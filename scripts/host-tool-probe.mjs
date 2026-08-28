#!/usr/bin/env node
// Live Copilot host probe. It keeps validator warnings separate from runtime
// grants and runs only against a throwaway plugin and workspace outside the repo.

import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync,
  rmSync, writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  basename, dirname, isAbsolute, join, relative, resolve, sep,
} from 'node:path';
import { tmpdir, arch, platform, release, homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  BOGUS_TOOLS,
  buildReport,
  classifyRun,
  normalizeReportForComparison,
  parseProbeBlock,
  redactText,
  redactValue,
  reportStatus,
  runMatrix,
  stableJson,
  validateReport,
} from './lib/tool-conformance.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = join(ROOT, 'test', 'fixtures', 'host-tool-probe');
const LAUNCHES = ['direct', 'delegated'];
const DEFAULT_TIMEOUT_SECONDS = 120;
const MAX_TRANSCRIPT_BYTES = 4 * 1024 * 1024;
const PLACEHOLDER_ROOT = '<TEMP>/kai-host-tool-probe-<nonce>';

function parseArgs(argv) {
  const values = {};
  const flags = new Set();
  const valueFlags = new Set([
    '--out', '--timeout', '--deep-tools', '--from', '--baseline', '--copilot-entry', '--rows',
  ]);
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '-h') {
      flags.add(arg);
      continue;
    }
    if (!arg.startsWith('--')) throw new Error(`unexpected positional argument "${arg}"`);
    const equal = arg.indexOf('=');
    if (equal !== -1) {
      values[arg.slice(0, equal)] = arg.slice(equal + 1);
      continue;
    }
    if (valueFlags.has(arg)) {
      if (!argv[index + 1] || argv[index + 1].startsWith('--')) {
        throw new Error(`${arg} requires a value`);
      }
      values[arg] = argv[++index];
    } else {
      flags.add(arg);
    }
  }
  return {
    mode: ['--self-test', '--plan', '--run', '--update', '--check'].filter((flag) => flags.has(flag)),
    deep: flags.has('--deep'),
    allowNetwork: flags.has('--allow-network'),
    keepTemp: flags.has('--keep-temp'),
    help: flags.has('--help') || flags.has('-h'),
    out: values['--out'] ?? null,
    from: values['--from'] ?? null,
    baseline: values['--baseline'] ?? null,
    copilotEntry: values['--copilot-entry'] ?? null,
    rows: values['--rows']
      ? values['--rows'].split(',').map((value) => value.trim()).filter(Boolean)
      : [],
    timeoutSeconds: values['--timeout'] === undefined
      ? DEFAULT_TIMEOUT_SECONDS
      : Number(values['--timeout']),
    deepTools: values['--deep-tools']
      ? values['--deep-tools'].split(',').map((value) => value.trim()).filter(Boolean)
      : [],
    unknown: [
      ...[...flags].filter((flag) => ![
        '--self-test', '--plan', '--run', '--update', '--check',
        '--deep', '--allow-network', '--keep-temp', '--help', '-h',
      ].includes(flag)),
      ...Object.keys(values).filter((flag) => !valueFlags.has(flag)),
    ],
  };
}

function usage() {
  return [
    'usage:',
    '  node scripts/host-tool-probe.mjs --self-test',
    '  node scripts/host-tool-probe.mjs --plan [--deep] [--deep-tools a,b]',
    '  node scripts/host-tool-probe.mjs --run [--deep] [--allow-network]',
    '       [--out <file|->] [--keep-temp] [--timeout <seconds>]',
    '       [--copilot-entry <path-to-versioned-index.js>]',
    '       [--rows R2-primary,R8-repo-current]',
    '  node scripts/host-tool-probe.mjs --update --from <report> --baseline <file>',
    '  node scripts/host-tool-probe.mjs --check --from <report> --baseline <file>',
    '',
    '--update and --check compare normalized, already-redacted reports. They do',
    'not run Copilot and have no default committed baseline.',
  ].join('\n');
}

function validateArgs(args) {
  if (args.help) return;
  if (args.unknown.length) throw new Error(`unknown option(s): ${args.unknown.join(', ')}`);
  if (args.mode.length !== 1) throw new Error('choose exactly one mode: --self-test, --plan, --run, --update, or --check');
  if (!Number.isInteger(args.timeoutSeconds) || args.timeoutSeconds < 10 || args.timeoutSeconds > 900) {
    throw new Error('--timeout must be an integer from 10 through 900 seconds');
  }
  if (args.deepTools.length && !args.deep) throw new Error('--deep-tools requires --deep');
  if (['--update', '--check'].includes(args.mode[0]) && (!args.from || !args.baseline)) {
    throw new Error(`${args.mode[0]} requires --from <report> and --baseline <file>`);
  }
  if (args.mode[0] !== '--run' && (args.out || args.keepTemp)) {
    throw new Error('--out and --keep-temp are valid only with --run');
  }
  if (!['--plan', '--run'].includes(args.mode[0]) && args.allowNetwork) {
    throw new Error('--allow-network is valid only with --plan or --run');
  }
  if (!['--plan', '--run'].includes(args.mode[0]) && (args.deep || args.deepTools.length)) {
    throw new Error('--deep and --deep-tools are valid only with --plan or --run');
  }
  if (!['--plan', '--run'].includes(args.mode[0]) && args.copilotEntry) {
    throw new Error('--copilot-entry is valid only with --plan or --run');
  }
  if (args.copilotEntry && (!isAbsolute(args.copilotEntry) || !existsSync(args.copilotEntry))) {
    throw new Error('--copilot-entry must name an existing absolute file');
  }
  if (!['--plan', '--run'].includes(args.mode[0]) && args.rows.length) {
    throw new Error('--rows is valid only with --plan or --run');
  }
}

function agentId(row) {
  return `probe-${row.id.toLowerCase()}`;
}

function frontmatter(row) {
  const lines = [
    '---',
    `name: ${agentId(row)}`,
    `description: "Ephemeral host-tool probe for ${row.id}."`,
  ];
  if (row.declared !== null) lines.push(`tools: ${JSON.stringify(row.declared)}`);
  lines.push('---');
  return lines.join('\n');
}

function agentBody(row) {
  const inheritsSkill = row.declared === null
    || row.declared.includes('*')
    || row.declared.includes('skill');
  return [
    frontmatter(row),
    '',
    ...(inheritsSkill ? [
      '**Inherits:** `probe-nonce`',
      '',
      'Load and use the inherited `probe-nonce` skill only for the requested skill check.',
      '',
    ] : []),
    '# Ephemeral tool probe',
    '',
    'Follow the supplied probe instructions exactly. Work only in the current',
    'scratch directory. Never inspect environment variables, credentials, parent',
    'directories, or any repository. Continue after an unavailable tool.',
    '',
    'Finish by printing exactly one delimited JSON object as requested.',
    '',
  ].join('\n');
}

function launcherBody() {
  return [
    '---',
    'name: probe-launcher',
    'description: "Ephemeral launcher for the delegated host-tool probe leg."',
    'tools: ["agent"]',
    '---',
    '',
    '# Delegated probe launcher',
    '',
    'Delegate exactly once to the named probe agent. Pass the supplied payload',
    'verbatim. Do not perform its file operations yourself. Return the delegated',
    'agent output verbatim, including its KAI-PROBE delimiters.',
    '',
  ].join('\n');
}

function helperBody() {
  return [
    '---',
    'name: probe-helper',
    'description: "Ephemeral nested-agent side-effect helper."',
    'tools: ["edit"]',
    '---',
    '',
    '# Nested probe helper',
    '',
    'Write the supplied token to `delegate-report.json` as',
    '`{"token":"<supplied token>"}` and return a one-line completion message.',
    'Do nothing else.',
    '',
  ].join('\n');
}

function skillBody(skillNonce) {
  return [
    '---',
    'name: probe-nonce',
    'description: "Carries one ephemeral nonce for a host-tool probe."',
    'tools: ["read"]',
    '---',
    '',
    '# Probe nonce',
    '',
    'Return this value verbatim to the calling agent:',
    '',
    '```text',
    skillNonce,
    '```',
    '',
  ].join('\n');
}

function probePrompt(tokens, { allowNetwork, helperAgent = 'probe-helper' }) {
  const networkInstruction = allowNetwork
    ? '8. If a web tool is available, request https://example.com/ and report `web` in `self_reported` only if the request succeeds.'
    : '8. Do not make any network request.';
  return [
    'This is a bounded capability probe in a throwaway workspace.',
    'Attempt every numbered action. If an action or tool is unavailable, continue.',
    'Do not inspect environment variables, credentials, parent directories, or any repository.',
    '',
    '1. Read `sentinel-a.txt`; keep its exact content for `read_nonce`.',
    `2. Replace all content of \`sentinel-b.txt\` with exactly: ${tokens.edit}`,
    `3. Create \`made-by-run.txt\` containing exactly: ${tokens.create}`,
    '4. Search `decoy-*.txt` for the line beginning `KAI_SEARCH_NEEDLE_`; report only its filename.',
    '5. Use a shell/execute tool to run:',
    '   node -e "require(\'node:fs\').writeFileSync(\'shell-proof.txt\',String(process.pid))"',
    `6. Use an agent/delegation tool to ask \`${helperAgent}\` to write`,
    `   \`delegate-report.json\` with token: ${tokens.delegate}`,
    '7. Load `probe-nonce` if that skill is available and report its nonce.',
    networkInstruction,
    '',
    'Set `self_reported` to tool identifiers you believe actually succeeded.',
    'Use null for evidence you could not obtain. Print no secrets or environment data.',
    'Finish with exactly this shape:',
    '<<<KAI-PROBE-BEGIN>>>',
    '{"self_reported":[],"read_nonce":null,"search_file":null,"skill_nonce":null}',
    '<<<KAI-PROBE-END>>>',
  ].join('\n');
}

function invocationPlan(row, launch, root, tokens, options = {}) {
  const invocation = `${row.id.toLowerCase()}-${launch}`;
  const pluginName = `kai-host-tool-${invocation}`;
  const pluginDir = join(root, 'plugins', invocation);
  const workDir = join(root, 'work', invocation);
  const qualifiedProbeAgent = `${pluginName}:${agentId(row)}`;
  const childPrompt = probePrompt(tokens, {
    ...options,
    helperAgent: `${pluginName}:probe-helper`,
  });
  const selectedAgent = launch === 'direct'
    ? qualifiedProbeAgent
    : `${pluginName}:probe-launcher`;
  const prompt = launch === 'direct'
    ? childPrompt
    : [
      `Delegate to agent \`${qualifiedProbeAgent}\` with this exact payload:`,
      '',
      childPrompt,
    ].join('\n');
  const copilotArgs = [
    '--plugin-dir', pluginDir,
    '--add-dir', workDir,
    '--allow-all-tools',
    '--no-custom-instructions',
    '--agent', selectedAgent,
    '-p', prompt,
  ];
  return {
    row,
    launch,
    invocation,
    pluginName,
    pluginDir,
    workDir,
    selectedAgent,
    prompt,
    command: options.copilotEntry ? process.execPath : 'copilot',
    argv: options.copilotEntry ? [options.copilotEntry, ...copilotArgs] : copilotArgs,
    frontmatter: {
      probe: frontmatter(row),
      launcher: launch === 'delegated' ? launcherBody().split('\n---\n')[0] + '\n---' : null,
      helper: helperBody().split('\n---\n')[0] + '\n---',
      skill: skillBody('<SKILL_NONCE>').split('\n---\n')[0] + '\n---',
    },
  };
}

function planDocument(args) {
  const rows = selectedRows(args);
  const tokens = {
    edit: '<EDIT_TOKEN>',
    create: '<CREATE_TOKEN>',
    delegate: '<DELEGATE_TOKEN>',
  };
  return {
    probe_version: 1,
    mode: 'plan',
    writes: false,
    spawns: false,
    isolation_root: PLACEHOLDER_ROOT,
    environment: {
      inherited: [
        'PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP',
        'TMPDIR', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'PROGRAMDATA',
        'XDG_CONFIG_HOME', 'XDG_CACHE_HOME', 'LANG', 'LC_ALL', 'TERM',
      ],
      forced: { CI: '1', NO_COLOR: '1' },
      credential_variables: 'removed',
    },
    matrix: rows.map((row) => ({
      id: row.id,
      declared: row.declared,
      launches: LAUNCHES.map((launch) => {
        const planned = invocationPlan(row, launch, PLACEHOLDER_ROOT, tokens, {
          allowNetwork: args.allowNetwork,
          copilotEntry: args.copilotEntry,
        });
        return {
          launch,
          cwd: planned.workDir,
          frontmatter: planned.frontmatter,
          command: planned.command,
          argv: planned.argv,
        };
      }),
    })),
  };
}

function selectedRows(args) {
  const rows = runMatrix({ deep: args.deep, deepTools: args.deepTools });
  const requested = args.rows ?? [];
  if (!requested.length) return rows;
  const selected = rows.filter((row) => requested.includes(row.id));
  const missing = requested.filter((id) => !selected.some((row) => row.id === id));
  if (missing.length) throw new Error(`unknown probe row(s): ${missing.join(', ')}`);
  return selected;
}

function makeTokens() {
  const token = () => randomBytes(16).toString('hex');
  return {
    read: `KAI_READ_${token()}`,
    edit: `KAI_EDIT_${token()}`,
    create: `KAI_CREATE_${token()}`,
    search: `KAI_SEARCH_NEEDLE_${token()}`,
    delegate: `KAI_DELEGATE_${token()}`,
    skill: `KAI_SKILL_${token()}`,
  };
}

function materializeInvocation(plan, tokens) {
  const agentsDir = join(plan.pluginDir, 'agents');
  const skillDir = join(plan.pluginDir, 'skills', 'probe-nonce');
  mkdirSync(agentsDir, { recursive: true });
  mkdirSync(skillDir, { recursive: true });
  mkdirSync(plan.workDir, { recursive: true });

  writeFileSync(join(plan.pluginDir, 'plugin.json'), stableJson({
    name: plan.pluginName,
    version: '0.0.0-probe',
    description: 'Ephemeral host-tool probe. Never install.',
    agents: 'agents',
    skills: 'skills',
  }));
  writeFileSync(join(agentsDir, `${agentId(plan.row)}.agent.md`), agentBody(plan.row));
  writeFileSync(join(agentsDir, 'probe-helper.agent.md'), helperBody());
  if (plan.launch === 'delegated') {
    writeFileSync(join(agentsDir, 'probe-launcher.agent.md'), launcherBody());
  }
  writeFileSync(join(skillDir, 'SKILL.md'), skillBody(tokens.skill));

  writeFileSync(join(plan.workDir, 'sentinel-a.txt'), tokens.read);
  writeFileSync(join(plan.workDir, 'sentinel-b.txt'), 'UNCHANGED');
  const needleIndex = Number.parseInt(tokens.search.slice(-2), 16) % 32;
  for (let index = 0; index < 32; index++) {
    const name = `decoy-${String(index).padStart(2, '0')}.txt`;
    const content = index === needleIndex ? tokens.search : `decoy ${index}`;
    writeFileSync(join(plan.workDir, name), content);
  }
  return { needleFile: `decoy-${String(needleIndex).padStart(2, '0')}.txt` };
}

function safeEnvironment() {
  const allowed = new Set([
    'PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP',
    'TMPDIR', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'PROGRAMDATA',
    'XDG_CONFIG_HOME', 'XDG_CACHE_HOME', 'LANG', 'LC_ALL', 'TERM',
  ]);
  const environment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => allowed.has(name.toUpperCase())),
  );
  environment.CI = '1';
  environment.NO_COLOR = '1';
  return environment;
}

function executeInvocation(plan, timeoutSeconds) {
  const started = Date.now();
  const result = spawnSync(plan.command, plan.argv, {
    cwd: plan.workDir,
    env: safeEnvironment(),
    encoding: 'utf8',
    input: '',
    maxBuffer: MAX_TRANSCRIPT_BYTES,
    shell: false,
    timeout: timeoutSeconds * 1000,
    windowsHide: true,
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const combined = `${stdout}\n${stderr}`;
  return {
    status: result.status,
    signal: result.signal,
    stdout,
    stderr,
    durationMs: Date.now() - started,
    timedOut: result.error?.code === 'ETIMEDOUT',
    truncated: result.error?.code === 'ENOBUFS',
    error: result.error && !['ETIMEDOUT', 'ENOBUFS'].includes(result.error.code)
      ? result.error.message
      : null,
    interactiveRequired: /\b(?:sign|log)[ -]?in\b|device code|authenticate|authorization required|permission required|approval required|interactive prompt/i.test(combined),
  };
}

function collectEvidence(plan, tokens, needleFile, execution) {
  const parsed = parseProbeBlock(execution.stdout);
  const reported = parsed.ok ? parsed.value : {};
  const read = reported.read_nonce === tokens.read;
  const search = reported.search_file === needleFile;
  const skill = reported.skill_nonce === tokens.skill;
  const edit = readExact(join(plan.workDir, 'sentinel-b.txt'))?.trim() === tokens.edit;
  const create = readExact(join(plan.workDir, 'made-by-run.txt'))?.trim() === tokens.create;
  const shellProof = readExact(join(plan.workDir, 'shell-proof.txt'))?.trim();
  const execute = /^\d+$/.test(shellProof ?? '') && Number(shellProof) > 0;
  let agent = false;
  const delegate = readJson(join(plan.workDir, 'delegate-report.json'));
  if (delegate?.token === tokens.delegate) agent = true;
  return { read, edit, create, search, execute, agent, skill };
}

function readExact(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function assertOutsideRepo(path) {
  const rel = relative(ROOT, resolve(path));
  if (!rel || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))) {
    throw new Error(`scratch path resolved inside the repository: ${path}`);
  }
}

function findExecutable(command) {
  const pathEntries = (process.env.PATH ?? '').split(process.platform === 'win32' ? ';' : ':');
  const extensions = process.platform === 'win32'
    ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';')
    : [''];
  for (const pathEntry of pathEntries) {
    if (!pathEntry) continue;
    for (const extension of extensions) {
      const candidate = join(pathEntry, `${command}${extension.toLowerCase()}`);
      if (existsSync(candidate)) return candidate;
      const originalCase = join(pathEntry, `${command}${extension}`);
      if (existsSync(originalCase)) return originalCase;
    }
  }
  return null;
}

function hostIdentity(timeoutSeconds, copilotEntry) {
  const command = copilotEntry ? process.execPath : 'copilot';
  const argv = copilotEntry ? [copilotEntry, '--version'] : ['--version'];
  const result = spawnSync(command, argv, {
    encoding: 'utf8',
    env: safeEnvironment(),
    input: '',
    shell: false,
    timeout: Math.min(timeoutSeconds, 15) * 1000,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || result.stderr || `exit ${result.status}`;
    throw new Error(`copilot --version failed: ${redactText(detail, [homedir()])}`);
  }
  const resolvedPath = copilotEntry ?? findExecutable('copilot');
  return {
    copilot_version: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
    copilot_resolved_path: resolvedPath
      ? `<redacted>/${basename(dirname(resolvedPath))}/${basename(resolvedPath)}`
      : '<unresolved>',
    platform: platform(),
    arch: arch(),
    os_release: release(),
    node_version: process.version,
  };
}

function runLive(args) {
  const systemTemp = resolve(tmpdir());
  assertOutsideRepo(systemTemp);
  const before = snapshotRepository();
  const scratchRoot = mkdtempSync(join(systemTemp, 'kai-host-tool-probe-'));
  assertOutsideRepo(scratchRoot);
  const rows = selectedRows(args);
  const inputs = [];
  const sensitive = [homedir(), scratchRoot];
  let liveBlocker = null;

  try {
    const host = hostIdentity(args.timeoutSeconds, args.copilotEntry);
    for (const row of rows) {
      for (const launch of LAUNCHES) {
        const tokens = makeTokens();
        sensitive.push(...Object.values(tokens));
        const plan = invocationPlan(row, launch, scratchRoot, tokens, {
          allowNetwork: args.allowNetwork,
          copilotEntry: args.copilotEntry,
        });
        const { needleFile } = materializeInvocation(plan, tokens);
        const execution = executeInvocation(plan, args.timeoutSeconds);
        if (execution.interactiveRequired) {
          execution.error = 'interactive authentication or authorization was requested; live probe stopped';
          liveBlocker = `${row.id}/${launch}: interactive authentication or authorization was requested`;
        } else if (execution.timedOut) {
          liveBlocker = `${row.id}/${launch}: timed out; the command may require interaction`;
        } else if (execution.error) {
          liveBlocker = `${row.id}/${launch}: the host process could not start safely`;
        }
        inputs.push({
          row,
          launch,
          execution,
          evidence: collectEvidence(plan, tokens, needleFile, execution),
        });
        if (liveBlocker) break;
      }
      if (liveBlocker) break;
    }

    const report = buildReport({
      inputs,
      host,
      captured: new Date().toISOString(),
      allowNetwork: args.allowNetwork,
      sensitiveValues: sensitive,
    });
    if (liveBlocker) {
      report.caveats.push(`stopped: ${liveBlocker}`);
    }
    const after = snapshotRepository();
    if (before !== after) {
      throw new Error('repository content changed during the live run; refusing to persist the report');
    }
    const outputPath = writeLiveReport(report, args.out);
    if (args.keepTemp) {
      console.error(`host-tool-probe: kept isolated scratch tree at ${redactText(scratchRoot, sensitive)}`);
    }
    console.error(`host-tool-probe: wrote redacted report to ${outputPath}`);
    return liveBlocker ? 3 : reportStatus(report);
  } finally {
    if (!args.keepTemp) rmSync(scratchRoot, { recursive: true, force: true });
  }
}

function writeLiveReport(report, requested) {
  if (requested === '-') {
    process.stdout.write(stableJson(report));
    return 'stdout';
  }
  const stamp = report.captured.replace(/\D/g, '').slice(0, 14);
  const version = String(report.host.copilot_version).replace(/[^A-Za-z0-9.-]+/g, '-');
  const path = resolve(requested ?? join(
    ROOT, '.kai', 'runs', 'eng', `host-tool-conformance-${version}-${stamp}.json`,
  ));
  if (existsSync(path)) throw new Error(`refusing to overwrite existing report: ${path}`);
  mkdirSync(dirname(path), { recursive: true });
  atomicWrite(path, stableJson(report));
  return redactText(path, [homedir()]);
}

function baselineMode(args, update) {
  const source = readReport(args.from, '--from');
  const errors = validateReport(source);
  if (errors.length) throw new Error(`invalid source report:\n  ${errors.join('\n  ')}`);
  const redacted = redactValue(source, [homedir()]);
  if (stableJson(source) !== stableJson(redacted)) {
    throw new Error('source report contains data that the redactor would change; use the persisted redacted report');
  }
  const normalized = normalizeReportForComparison(source);
  const baselinePath = resolve(args.baseline);
  if (resolve(args.from) === baselinePath) {
    throw new Error('--from and --baseline must be different files');
  }
  if (update) {
    mkdirSync(dirname(baselinePath), { recursive: true });
    atomicWrite(baselinePath, stableJson(normalized));
    console.log(`host-tool-probe: updated normalized baseline ${baselinePath}`);
    return 0;
  }
  const baseline = readReport(baselinePath, '--baseline');
  const baselineErrors = validateReport(baseline);
  if (baselineErrors.length) throw new Error(`invalid baseline:\n  ${baselineErrors.join('\n  ')}`);
  if (stableJson(normalized) !== stableJson(baseline)) {
    console.error('host-tool-probe: current normalized report differs from baseline');
    return 1;
  }
  console.log('host-tool-probe: current normalized report matches baseline');
  return 0;
}

function readReport(path, flag) {
  if (!path) throw new Error(`${flag} requires a path`);
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (error) {
    throw new Error(`${flag} is not readable JSON: ${error.message}`);
  }
}

function atomicWrite(path, content) {
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, content, { flag: 'wx' });
  renameSync(temporary, path);
}

function snapshotRepository() {
  const ignoredRoots = new Set(['.git', 'node_modules']);
  const entries = [];
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!prefix && ignoredRoots.has(entry.name)) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (rel === '.kai/runs' || rel.startsWith('.kai/runs/')) continue;
      if (/^\.kai\/activity\.jsonl(?:\.1)?$/.test(rel)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path, rel);
      else if (entry.isFile()) {
        entries.push(`${rel}\0${createHash('sha256').update(readFileSync(path)).digest('hex')}`);
      }
    }
  };
  walk(ROOT);
  return createHash('sha256').update(entries.join('\n')).digest('hex');
}

function selfTest() {
  const before = snapshotRepository();
  let passed = 0;
  let failed = 0;
  const ok = (condition, label) => {
    if (condition) {
      passed++;
      console.log(`  ok ${label}`);
    } else {
      failed++;
      console.error(`  FAIL ${label}`);
    }
  };
  const fixture = (name) => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'));

  const warned = fixture('warned-and-granted.json');
  const warnedRun = classifyRun(warned);
  const warnedReport = buildReport({
    inputs: [warned, ...fixture('observed-controls.json').inputs],
    host: fixedHost(),
    captured: '2026-08-28T05:14:22.000Z',
  });
  ok(
    warnedRun.validator.warned.includes('edit')
      && warnedRun.grant.by_tool.edit === 'exercised-ok'
      && warnedReport.findings.warned_and_granted.includes('edit'),
    'validator warning and exercised runtime grant remain independently expressible',
  );

  const disagreement = classifyRun(fixture('disagreement.json'));
  ok(
    disagreement.grant.by_tool.execute === 'exercised-fail'
      && disagreement.grant.disagreements.some((entry) => entry.tool === 'execute'),
    'verified side effects outrank a contradictory self-report',
  );

  const controls = buildReport({
    inputs: fixture('observed-controls.json').inputs,
    host: fixedHost(),
    captured: '2026-08-28T05:14:22.000Z',
  });
  ok(
    controls.findings.bogus_ignored === true
      && BOGUS_TOOLS.every((tool) =>
        controls.matrix[tool].validator === 'warned'
        && controls.matrix[tool].grant_direct === 'not-testable'
        && controls.matrix[tool].grant_delegated === 'not-testable'),
    'bogus controls warn while the real read capability still works',
  );

  for (const name of ['missing-block.json', 'malformed-block.json']) {
    const run = classifyRun(fixture(name));
    ok(
      !run.valid
        && run.validator.unobserved.length === run.declared.length
        && Object.values(run.grant.by_tool).every((value) => value === 'unobserved'),
      `${name} is unobserved rather than denied`,
    );
  }

  const truncated = classifyRun(fixture('truncated.json'));
  const nonzero = classifyRun(fixture('nonzero.json'));
  const truncatedReport = buildReport({
    inputs: [fixture('truncated.json'), ...fixture('observed-controls.json').inputs],
    host: fixedHost(),
    captured: '2026-08-28T05:14:22.000Z',
  });
  ok(
    !truncated.valid
      && !nonzero.valid
      && !Object.prototype.hasOwnProperty.call(truncatedReport.matrix, 'edit')
      && truncatedReport.caveats.some((value) => value.includes('truncated')),
    'truncated and non-zero runs fail closed and are excluded from findings',
  );

  const redactionFixture = fixture('redaction.json');
  const sensitive = [
    `${redactionFixture.github_prefix}_${redactionFixture.github_value}`,
    `${redactionFixture.authorization_scheme} ${redactionFixture.authorization_value}`,
    ...redactionFixture.home_paths,
  ].join('\n');
  const redacted = redactText(sensitive);
  ok(
    !redacted.includes('ghp_')
      && !redacted.includes(redactionFixture.authorization_value)
      && !redacted.includes('alice'),
    'credentials and absolute home paths are redacted before persistence',
  );

  const deterministicInput = {
    inputs: [warned, ...fixture('observed-controls.json').inputs],
    host: fixedHost(),
    captured: '2026-08-28T05:14:22.000Z',
  };
  ok(
    stableJson(buildReport(deterministicInput)) === stableJson(buildReport(deterministicInput)),
    'identical classifier input emits byte-identical output',
  );

  const planArgs = { deep: false, deepTools: [], allowNetwork: false };
  ok(
    stableJson(planDocument(planArgs)) === stableJson(planDocument(planArgs)),
    '--plan output is deterministic',
  );

  const normalized = normalizeReportForComparison(buildReport(deterministicInput));
  ok(
    normalized.captured === '<normalized>'
      && normalized.runs.every((run) => run.duration_ms === null),
    'baseline normalization removes only capture time and run duration',
  );

  const after = snapshotRepository();
  ok(before === after, '--self-test leaves repository content byte-identical');
  console.log(`\nhost-tool-probe self-test: ${passed} checks passed${failed ? `, ${failed} FAILED` : ''}`);
  return failed === 0 ? 0 : 1;
}

function fixedHost() {
  return {
    copilot_version: 'fixture-cli',
    copilot_resolved_path: '<redacted>/bin/copilot',
    platform: 'fixture',
    arch: 'fixture',
    os_release: 'fixture',
    node_version: 'fixture',
  };
}

function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
    validateArgs(args);
  } catch (error) {
    console.error(`host-tool-probe: ${error.message}\n\n${usage()}`);
    return 1;
  }
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const mode = args.mode[0];
  try {
    if (mode === '--self-test') return selfTest();
    if (mode === '--plan') {
      process.stdout.write(stableJson(planDocument(args)));
      return 0;
    }
    if (mode === '--run') return runLive(args);
    if (mode === '--update') return baselineMode(args, true);
    return baselineMode(args, false);
  } catch (error) {
    console.error(`host-tool-probe: ${redactText(error.stack ?? error.message, [homedir()])}`);
    return mode === '--run' ? 3 : 1;
  }
}

const isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) process.exit(main(process.argv.slice(2)));

export {
  agentBody,
  frontmatter,
  invocationPlan,
  main,
  planDocument,
  probePrompt,
};

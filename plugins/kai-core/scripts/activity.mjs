#!/usr/bin/env node
// activity — the writer for the declared activity log.
//
// Agents are prompt documents with no runtime, so "reporting" has to be a
// command they can run. This is that command: one bounded append per call.
//
//   activity start    --root <ws> --role <r> --run <id> [--item <i>] --for 30m
//   activity progress --root <ws> --role <r> --run <id> --for 20m [--note "..."]
//   activity stop     --root <ws> --role <r> --run <id> --outcome handoff
//
// It reports *activity*, never *state*. State, verdicts, and reviews live on
// the coordination item and are rejected here by the shared library.
//
// Exits 0 on a successful append and 0 on a rejected one only when --quiet is
// set; otherwise a rejection exits 1 so a mistake in an agent's invocation is
// visible rather than silently dropping the signal.
//
// Node built-ins only; writes one gitignored file.

import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { append, read, runs, buildRecord, safeNote, digest, LOG_REL, FORBIDDEN_FIELDS } from './lib/activity.mjs';
import { resolveWorkspaceRoot } from './lib/workspace-resolve.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DUR = /^(\d+)(s|m|h)$/;

export function parseDuration(v) {
  const m = DUR.exec(String(v || '').trim());
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === 's' ? n : m[2] === 'm' ? n * 60 : n * 3600;
}

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const body = a.slice(2);
      // Support --key=value as well as --key value, so a flag the contract
      // rejects is still *seen* and reported rather than silently ignored.
      const eq = body.indexOf('=');
      if (eq !== -1) { out[body.slice(0, eq)] = body.slice(eq + 1); continue; }
      const key = body;
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

export function newRunId() {
  return randomBytes(5).toString('hex');
}

function main(argv) {
  const args = parseArgs(argv);
  const cmd = args._[0];
  if (!cmd || args.help) {
    console.log([
      'usage: activity <start|progress|stop|show> --root <workspace> --role <role> --run <id> [options]',
      '',
      `  writes ${LOG_REL} (gitignored, append-only)`,
      '',
      '  --for <30m|2h|90s>   when this run will report next (required for start/progress)',
      '  --item <item-id>     the coordination item this run serves',
      '  --outcome <handoff|done|blocked|abandoned>   required for stop',
      '  --note "<text>"      one short bounded line; paths are rejected',
      '  --new-run            print a fresh run id and exit',
    ].join('\n'));
    return 0;
  }

  if (args['new-run'] || cmd === 'new-run') {
    console.log(newRunId());
    return 0;
  }

  const resolved = resolveWorkspaceRoot({ explicitRoot: args.root, cwd: process.cwd() });
  if (!resolved.ok) {
    console.error(`activity: ${resolved.reason}`);
    return 1;
  }
  const root = resolved.root;

  if (cmd === 'show') {
    const log = read(root);
    if (!log.present) { console.log('activity: no log yet'); return 0; }
    const open = runs(log.records).filter((r) => r.open);
    if (!open.length) { console.log(`activity: ${log.records.length} record(s), no open run`); return 0; }
    for (const r of open) {
      const flag = r.overdue ? ' OVERDUE' : '';
      console.log(`  ${r.role}${r.item ? ` on ${r.item}` : ''} — run ${r.run}, silent ${Math.round((r.silent_for || 0) / 60)}m${flag}`);
    }
    return 0;
  }

  if (!['start', 'progress', 'stop'].includes(cmd)) {
    console.error(`activity: unknown command "${cmd}"`);
    return 1;
  }

  const input = { e: cmd, role: args.role, run: args.run, item: args.item, note: args.note };
  // The library rejects forbidden fields, but the CLI must reject the *flags*
  // too: an agent that reaches for `--state` should be told the boundary exists
  // rather than have the flag silently ignored.
  for (const k of Object.keys(args)) {
    if (FORBIDDEN_FIELDS.has(k.toLowerCase().replace(/-/g, '_'))) input[k.toLowerCase().replace(/-/g, '_')] = args[k];
  }
  if (cmd === 'stop') input.outcome = args.outcome;
  else {
    const secs = parseDuration(args.for);
    if (secs === null) { console.error('activity: --for is required for start/progress (e.g. --for 30m)'); return 1; }
    input.next_report_by = Math.floor(Date.now() / 1000) + secs;
  }

  const r = append(root, input);
  if (!r.ok) {
    if (args.quiet) return 0;
    console.error(`activity: not recorded — ${r.reason}`);
    return 1;
  }
  if (!args.quiet) console.log(`activity: ${cmd} recorded for ${r.record.role} (run ${r.record.run})`);
  return 0;
}

// --- self-test -------------------------------------------------------------
function selfTest() {
  let failed = 0;
  const ok = (cond, msg) => { if (cond) console.log(`✓ self-test: ${msg}`); else { console.error(`✗ self-test: ${msg}`); failed++; } };
  const NOW = 1770000000000;
  const nowSec = Math.floor(NOW / 1000);
  const base = { e: 'start', role: 'principal-swe-backend', run: 'a1b2c3d4e5', item: 'export-audit', next_report_by: nowSec + 1800 };

  ok(buildRecord(base, NOW).ok, 'a well-formed start record is accepted');

  // The boundary against the item record is the whole point of this surface.
  for (const f of ['state', 'verdict', 'change_ref', 'version', 'lease']) {
    const bad = buildRecord({ ...base, [f]: 'x' }, NOW);
    ok(!bad.ok && /item record/.test(bad.reason), `a record carrying "${f}" is rejected as item state`);
  }

  ok(!buildRecord({ ...base, e: 'thinking' }, NOW).ok, 'an event outside the closed vocabulary is rejected');
  ok(!buildRecord({ ...base, e: 'stop', outcome: 'great' }, NOW).ok, 'an outcome outside the closed vocabulary is rejected');
  ok(buildRecord({ ...base, e: 'stop', outcome: 'handoff' }, NOW).ok, 'a stop with a known outcome is accepted');
  ok(!buildRecord({ ...base, next_report_by: undefined }, NOW).ok,
    'a start with no declared deadline is rejected — silence must stay checkable');

  // Privacy: this file is gitignored but pasteable into a public issue.
  ok(safeNote('see C:\\Users\\someone\\repo\\x.ts') === null, 'a note containing a Windows path is dropped');
  ok(safeNote('see /home/someone/repo/x.ts') === null, 'a note containing a POSIX home path is dropped');
  const long = safeNote('x'.repeat(500));
  ok(long !== null && long.length <= 120, 'a long note is truncated to the bound');
  ok(safeNote('line one\nline two') === 'line one line two', 'a multi-line note is flattened to one line');
  const built = buildRecord({ ...base, note: 'refactoring the parser' }, NOW);
  ok(built.ok && !/[A-Za-z]:\\|\/home\//.test(built.line), 'no absolute path can reach a serialized record');
  ok(built.ok && built.record.src === 'declared', 'every record is tiered declared, matching work-status');
  ok(!('sid' in built.record) && !('cwd' in built.record), 'no session or directory identifier is recorded');

  ok(digest('abc') === digest('abc') && digest('abc') !== digest('abd'), 'the digest is stable and discriminating');
  ok(parseDuration('30m') === 1800 && parseDuration('2h') === 7200 && parseDuration('45s') === 45,
    'durations parse to seconds');
  ok(parseDuration('soon') === null, 'an unparseable duration is rejected rather than guessed');

  // Shared workspace resolver (scripts/lib/workspace-resolve.mjs): every CLI
  // that used to grow its own ad-hoc root logic defers to this one function.
  {
    const wsTmp = mkdtempSync(join(tmpdir(), 'kai-activity-ws-'));
    try {
      const withManifest = (...segments) => {
        const dir = join(wsTmp, ...segments);
        mkdirSync(join(dir, '.kai'), { recursive: true });
        writeFileSync(join(dir, '.kai', 'manifest.json'), '{}');
        return dir;
      };

      // explicit root
      const explicitWs = withManifest('explicit-ws');
      const explicitR = resolveWorkspaceRoot({ explicitRoot: explicitWs, cwd: wsTmp, env: {} });
      ok(explicitR.ok && explicitR.root === explicitWs && explicitR.source === 'explicit',
        'an explicit caller root resolves directly and wins over everything else');

      // upward discovery
      const searchWs = withManifest('search-ws');
      mkdirSync(join(searchWs, 'a', 'b', 'c'), { recursive: true });
      const searchR = resolveWorkspaceRoot({ cwd: join(searchWs, 'a', 'b', 'c'), env: {} });
      ok(searchR.ok && searchR.root === searchWs && searchR.source === 'search',
        'a cwd nested under the workspace resolves upward to the manifest that carries it');

      // explicit root is validated in place, never searched upward: naming a
      // non-workspace subdirectory of a real workspace must fail, not
      // silently retarget the ancestor that cwd search would have found.
      const explicitNested = resolveWorkspaceRoot({ explicitRoot: join(searchWs, 'a', 'b', 'c'), env: {} });
      ok(!explicitNested.ok && /never searched upward/.test(explicitNested.reason),
        'an explicit root naming a non-workspace subdirectory fails instead of resolving upward to its ancestor');

      // env override
      const envWs = withManifest('env-ws');
      const envR = resolveWorkspaceRoot({ cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: envWs } });
      ok(envR.ok && envR.root === envWs && envR.source === 'env',
        'KAI_WORKSPACE_ROOT is honored when no explicit root is given');
      const explicitBeatsEnv = resolveWorkspaceRoot({ explicitRoot: explicitWs, cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: envWs } });
      ok(explicitBeatsEnv.ok && explicitBeatsEnv.root === explicitWs,
        'an explicit root wins over KAI_WORKSPACE_ROOT, not merely over cwd');

      // invalid override
      const relativeEnv = resolveWorkspaceRoot({ cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: 'relative/path' } });
      ok(!relativeEnv.ok && /absolute/.test(relativeEnv.reason),
        'a relative KAI_WORKSPACE_ROOT is refused rather than resolved against an unstated base');
      const noManifestDir = join(wsTmp, 'no-manifest-here');
      mkdirSync(noManifestDir, { recursive: true });
      const unmanifestedEnv = resolveWorkspaceRoot({ cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: noManifestDir } });
      ok(!unmanifestedEnv.ok && /manifest/.test(unmanifestedEnv.reason),
        'an absolute KAI_WORKSPACE_ROOT with no manifest.json is refused, not silently accepted');

      // missing workspace
      const emptyDir = join(wsTmp, 'nothing-here');
      mkdirSync(emptyDir, { recursive: true });
      const missing = resolveWorkspaceRoot({ cwd: emptyDir, env: {} });
      ok(!missing.ok && /manifest/.test(missing.reason),
        'a directory with no manifest anywhere upward reports a clear not-found, not a guess');

      // the one deliberate behavior change: a bare .git no longer counts
      const gitOnlyDir = join(wsTmp, 'git-only-repo');
      mkdirSync(join(gitOnlyDir, '.git'), { recursive: true });
      const gitOnly = resolveWorkspaceRoot({ cwd: gitOnlyDir, env: {} });
      ok(!gitOnly.ok, 'a bare .git with no .kai/manifest.json is no longer treated as a kai workspace');
    } finally {
      rmSync(wsTmp, { recursive: true, force: true });
    }
  }

  // Fold: open vs stopped vs overdue.
  const recs = [
    { t: nowSec - 3600, src: 'declared', e: 'start', role: 'r1', run: 'run1', next_report_by: nowSec - 1800 },
    { t: nowSec - 600, src: 'declared', e: 'start', role: 'r2', run: 'run2', next_report_by: nowSec + 1800 },
    { t: nowSec - 500, src: 'declared', e: 'stop', role: 'r2', run: 'run2', outcome: 'handoff' },
    { t: nowSec - 60, src: 'declared', e: 'start', role: 'r3', run: 'run3', next_report_by: nowSec + 600 },
  ];
  const folded = runs(recs, NOW);
  const byId = new Map(folded.map((r) => [r.run, r]));
  ok(byId.get('run1').open && byId.get('run1').overdue, 'a run silent past its own deadline is overdue');
  ok(!byId.get('run2').open && byId.get('run2').outcome === 'handoff', 'a stopped run is closed with its outcome');
  ok(byId.get('run3').open && !byId.get('run3').overdue, 'a run inside its deadline is open but not overdue');

  // Degradation: a corrupt line must never take the reader down.
  const parsed = (() => {
    const lines = ['{"e":"start","role":"r","run":"z1","t":1}', 'not json', '{"e":"start"', ''];
    let good = 0, bad = 0;
    for (const l of lines) { if (!l.trim()) continue; try { JSON.parse(l); good++; } catch { bad++; } }
    return { good, bad };
  })();
  ok(parsed.good === 1 && parsed.bad === 2, 'a partial write is a skipped line, not a parse failure');

  // Concurrency, measured rather than asserted. Each agent is a separate OS
  // process, so single-threaded JS grants no mutual exclusion; what makes this
  // safe is O_APPEND plus one write() per record. If that ever stops holding,
  // this is the test that catches it.
  const tmp = mkdtempSync(join(tmpdir(), 'kai-activity-'));
  try {
    const W = 6, N = 120;
    const worker = join(tmp, 'w.mjs');
    const libUrl = pathToFileURL(join(REPO_ROOT, 'scripts', 'lib', 'activity.mjs')).href;
    writeFileSync(worker, [
      `const { append } = await import(${JSON.stringify(libUrl)});`,
      'const [root, id] = process.argv.slice(2);',
      `for (let i = 0; i < ${N}; i++) {`,
      "  append(root, { e: 'progress', role: `worker-${id}`, run: `run${id}0000`, next_report_by: 9999999999, note: `tick ${i}` });",
      '}',
    ].join('\n'));

    const kids = [];
    for (let i = 0; i < W; i++) kids.push(spawnSync(process.execPath, [worker, tmp, String(i)], { encoding: 'utf8' }));
    ok(kids.every((k) => k.status === 0), 'every concurrent writer exited cleanly');

    const after = read(tmp);
    ok(after.present && after.records.length === W * N && after.skipped === 0,
      `${W} concurrent processes x ${N} appends produced ${after.records.length}/${W * N} intact records, ${after.skipped} corrupt`);
    const perWorker = new Set(after.records.map((r) => r.role));
    ok(perWorker.size === W, 'no writer was starved out by the others');

    // End-to-end through the CLI an agent actually invokes.
    const cli = join(REPO_ROOT, 'scripts', 'activity.mjs');
    const e2eRoot = mkdtempSync(join(tmpdir(), 'kai-activity-e2e-'));
    mkdirSync(join(e2eRoot, '.kai'), { recursive: true });
    writeFileSync(join(e2eRoot, '.kai', 'manifest.json'), '{}');
    const s1 = spawnSync(process.execPath, [cli, 'start', '--root', e2eRoot, '--role', 'principal-swe-backend',
      '--run', 'abc123def4', '--item', 'export-audit', '--for', '30m'], { encoding: 'utf8' });
    const s2 = spawnSync(process.execPath, [cli, 'stop', '--root', e2eRoot, '--role', 'principal-swe-backend',
      '--run', 'abc123def4', '--outcome', 'handoff'], { encoding: 'utf8' });
    ok(s1.status === 0 && s2.status === 0, 'the CLI records a start and a stop');
    const e2e = read(e2eRoot);
    ok(e2e.present && e2e.records.length === 2, 'both records land in the log');
    ok(runs(e2e.records).every((r) => !r.open), 'the run pairs and closes');

    // Unit regression: fabricated records in a test can silently certify a unit
    // the real writer never emits. These assertions go through the actual
    // append path, so a seconds/milliseconds mixup cannot pass again.
    const written = e2e.records[0];
    ok(Math.abs(written.t - Math.floor(Date.now() / 1000)) < 120,
      'a written record stamps epoch SECONDS, the same unit as next_report_by');
    const liveRoot = mkdtempSync(join(tmpdir(), 'kai-activity-live-'));
    mkdirSync(join(liveRoot, '.kai'), { recursive: true });
    writeFileSync(join(liveRoot, '.kai', 'manifest.json'), '{}');
    spawnSync(process.execPath, [cli, 'start', '--root', liveRoot, '--role', 'principal-sre',
      '--run', 'aaaa1111bb', '--for', '30m'], { encoding: 'utf8' });
    const folded = runs(read(liveRoot).records)[0];
    ok(folded.silent_for >= 0 && folded.silent_for < 120,
      `a just-written run reports a sane silence (${folded.silent_for}s), not a unit-mismatched number`);
    ok(folded.open && !folded.overdue, 'a just-written run inside its window is open and not overdue');
    rmSync(liveRoot, { recursive: true, force: true });

    const badState = spawnSync(process.execPath, [cli, 'start', '--root', e2eRoot, '--role', 'r',
      '--run', 'abc123def4', '--for', '5m', '--state', 'shipped'], { encoding: 'utf8' });
    ok(badState.status === 1 && /item record/.test(badState.stderr),
      'the CLI refuses to record item state and says why');
    const badEq = spawnSync(process.execPath, [cli, 'start', '--root', e2eRoot, '--role', 'r',
      '--run', 'abc123def4', '--for', '5m', '--State=shipped'], { encoding: 'utf8' });
    ok(badEq.status === 1 && /item record/.test(badEq.stderr),
      'the --Key=value form is seen and rejected too, not silently ignored');

    // The reader is a gate as well as the writer: the log is a plain file.
    const evilRoot = mkdtempSync(join(tmpdir(), 'kai-activity-evil-'));
    mkdirSync(join(evilRoot, '.kai'), { recursive: true });
    writeFileSync(join(evilRoot, '.kai', 'activity.jsonl'), [
      JSON.stringify({ t: 1, e: 'start', run: 'aaaa1111bb', role: '/home/alice/secret', next_report_by: 2 }),
      JSON.stringify({ t: 1, e: 'start', run: 'aaaa1111bb', role: 'ok-role', item: '../../etc/passwd' }),
      JSON.stringify({ t: 1, e: 'start', run: 'aaaa1111bb', role: 'ok-role', note: 'C:\\Users\\alice\\x.ts' }),
      JSON.stringify({ t: 1, e: 'start', run: 'aaaa1111bb', role: 'ok-role', next_report_by: 2 }),
    ].join('\n'));
    const evil = read(evilRoot);
    ok(evil.records.length === 1 && evil.skipped === 3,
      'a hand-written record carrying a path, a traversal, or a leaky note is skipped on READ, not just on write');
    rmSync(evilRoot, { recursive: true, force: true });
    rmSync(e2eRoot, { recursive: true, force: true });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  console.log(failed === 0 ? '✓ activity self-test: all checks passed' : `✗ activity self-test: ${failed} failure(s)`);
  return failed === 0 ? 0 : 1;
}

// --- cli -------------------------------------------------------------------
// Guarded: importing this module must not run the CLI or exit the process.
const isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  const argv = process.argv.slice(2);
  process.exit(argv.includes('--self-test') ? selfTest() : main(argv));
}

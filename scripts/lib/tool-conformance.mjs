import { createHash } from 'node:crypto';

export const PRIMARY_TOOLS = [
  'execute', 'read', 'edit', 'search', 'agent', 'web', 'todo',
];

export const COMPATIBLE_TOOLS = [
  'shell', 'Bash', 'powershell',
  'Read', 'NotebookRead',
  'Edit', 'MultiEdit', 'Write',
  'Grep', 'Glob',
  'custom-agent', 'Task',
];

export const REPO_TOOLS = [
  'view', 'create', 'edit', 'grep', 'glob',
  'bash', 'shell',
  'ask_user',
  'skill',
  'task', 'read_agent', 'write_agent',
  'web_fetch', 'web_search',
  'session_store_sql',
  'playwright',
];

export const BOGUS_TOOLS = ['kai-not-a-tool', 'zzz_bogus_42'];

const TOOL_FAMILIES = new Map([
  ['execute', 'execute'], ['shell', 'execute'], ['Bash', 'execute'],
  ['powershell', 'execute'], ['bash', 'execute'],
  ['read', 'read'], ['Read', 'read'], ['NotebookRead', 'read'], ['view', 'read'],
  ['edit', 'edit'], ['Edit', 'edit'], ['MultiEdit', 'edit'], ['Write', 'edit'],
  ['create', 'create'],
  ['search', 'search'], ['Grep', 'search'], ['Glob', 'search'],
  ['grep', 'search'], ['glob', 'search'],
  ['agent', 'agent'], ['custom-agent', 'agent'], ['Task', 'agent'], ['task', 'agent'],
  ['skill', 'skill'],
  ['web', 'web'], ['web_fetch', 'web'], ['web_search', 'web'],
  ['todo', 'self-report'], ['ask_user', 'self-report'],
  ['read_agent', 'self-report'], ['write_agent', 'self-report'],
  ['session_store_sql', 'self-report'], ['playwright', 'self-report'],
]);

const PRIMARY = new Set(PRIMARY_TOOLS);
const COMPATIBLE = new Set(COMPATIBLE_TOOLS);
const REPO = new Set(REPO_TOOLS);
const BOGUS = new Set(BOGUS_TOOLS);
const BEGIN = '<<<KAI-PROBE-BEGIN>>>';
const END = '<<<KAI-PROBE-END>>>';

const unique = (values) => [...new Set(values)].sort();

export function runMatrix({ deep = false, deepTools = [] } = {}) {
  const rows = [
    { id: 'R0-omitted', label: 'omitted', declared: null },
    { id: 'R1-wildcard', label: 'wildcard', declared: ['*'] },
    { id: 'R2-primary', label: 'primary', declared: PRIMARY_TOOLS },
    { id: 'R3-shell-family', label: 'shell-family', declared: ['shell', 'Bash', 'powershell'] },
    { id: 'R4-read-family', label: 'read-family', declared: ['Read', 'NotebookRead'] },
    { id: 'R5-edit-family', label: 'edit-family', declared: ['Edit', 'MultiEdit', 'Write'] },
    { id: 'R6-search-family', label: 'search-family', declared: ['Grep', 'Glob'] },
    { id: 'R7-agent-family', label: 'agent-family', declared: ['custom-agent', 'Task'] },
    { id: 'R8-repo-current', label: 'repo-current', declared: REPO_TOOLS },
    { id: 'R9-control', label: 'control', declared: ['read', ...BOGUS_TOOLS] },
  ].map((row) => ({ ...row, declared: row.declared ? [...row.declared] : null }));

  if (!deep) return rows;
  const requested = deepTools.length
    ? unique(deepTools)
    : unique([...PRIMARY_TOOLS, ...COMPATIBLE_TOOLS, ...REPO_TOOLS]);
  for (const tool of requested) {
    rows.push({
      id: `R10-${slug(tool)}`,
      label: 'singleton',
      declared: [tool],
    });
  }
  return rows;
}

export function toolClass(tool) {
  if (PRIMARY.has(tool)) return 'primary';
  if (COMPATIBLE.has(tool)) return 'compatible';
  if (BOGUS.has(tool)) return 'bogus-control';
  if (REPO.has(tool)) return 'repo-current';
  if (tool === '*') return 'wildcard';
  return 'other';
}

export function toolFamily(tool) {
  return TOOL_FAMILIES.get(tool) ?? 'unknown';
}

export function parseWarnings(text) {
  const warned = [];
  const lines = String(text ?? '').split(/\r?\n/);
  const patterns = [
    /Unknown tool name in the tool allowlist:\s*["'`]?([^"'`\s,]+)/i,
    /(?:unknown|unrecognized|unsupported)\s+tool(?:\s+name)?[^"'`\r\n]*["'`]([^"'`]+)["'`]/i,
  ];
  const rawLines = [];
  for (const line of lines) {
    const match = patterns.map((pattern) => pattern.exec(line)).find(Boolean);
    if (!match) continue;
    warned.push(match[1].trim());
    rawLines.push(line.trim());
  }
  return { warned: unique(warned), rawLines: unique(rawLines) };
}

export function parseProbeBlock(text) {
  const source = String(text ?? '');
  const begin = source.lastIndexOf(BEGIN);
  if (begin === -1) return { ok: false, reason: 'probe block is missing', value: null };
  const payloadStart = begin + BEGIN.length;
  const end = source.indexOf(END, payloadStart);
  if (end === -1) return { ok: false, reason: 'probe block is truncated', value: null };
  const payload = source.slice(payloadStart, end).trim();
  try {
    const value = JSON.parse(payload);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, reason: 'probe block must contain a JSON object', value: null };
    }
    return { ok: true, reason: null, value };
  } catch (error) {
    return { ok: false, reason: `probe block is malformed JSON: ${error.message}`, value: null };
  }
}

function classifiedGrant(tool, selfReported, evidence, allowNetwork) {
  const family = toolFamily(tool);
  if (family === 'unknown' || family === 'wildcard' || BOGUS.has(tool)) return 'not-testable';
  if (family === 'self-report') {
    return selfReported.has(tool) ? 'self-reported-present' : 'self-reported-absent';
  }
  if (family === 'web') {
    if (!allowNetwork) return 'not-testable';
    return selfReported.has(tool) || selfReported.has('web')
      ? 'self-reported-present'
      : 'self-reported-absent';
  }
  return evidence[family] ? 'exercised-ok' : 'exercised-fail';
}

export function classifyRun({
  row,
  launch,
  execution,
  evidence = {},
  allowNetwork = false,
}) {
  const transcript = `${execution.stdout ?? ''}\n${execution.stderr ?? ''}`;
  const parsed = parseProbeBlock(execution.stdout);
  const warningData = parseWarnings(transcript);
  const declared = row.declared ?? [];
  const timedOut = Boolean(execution.timedOut);
  const spawnFailed = Boolean(execution.error);
  const nonzero = execution.status !== 0;
  const valid = parsed.ok && !timedOut && !spawnFailed && !nonzero && !execution.truncated;
  const selfReported = new Set(
    valid && Array.isArray(parsed.value.self_reported)
      ? parsed.value.self_reported.filter((value) => typeof value === 'string')
      : [],
  );
  const byTool = {};
  const disagreements = [];

  for (const tool of declared) {
    const result = valid
      ? classifiedGrant(tool, selfReported, evidence, allowNetwork)
      : 'unobserved';
    byTool[tool] = result;
    const family = toolFamily(tool);
    if (
      result === 'exercised-fail'
      && (selfReported.has(tool) || selfReported.has(family))
    ) {
      disagreements.push({
        tool,
        self_reported: 'present',
        exercised: 'fail',
      });
    }
  }

  const exercised = {
    read: exerciseResult(valid, evidence.read, 'nonce echoed from sentinel-a.txt'),
    edit: exerciseResult(valid, evidence.edit, 'sentinel-b.txt carries the token'),
    create: exerciseResult(valid, evidence.create, 'made-by-run.txt carries the token'),
    search: exerciseResult(valid, evidence.search, 'named the decoy containing the hidden needle'),
    execute: exerciseResult(valid, evidence.execute, 'shell-proof.txt contains a process id'),
    agent: exerciseResult(valid, evidence.agent, 'delegate-report.json carries the token'),
    skill: exerciseResult(valid, evidence.skill, 'skill nonce was reported'),
    web: {
      result: allowNetwork
        ? (valid ? 'self-reported' : 'unobserved')
        : 'not-testable',
      evidence: allowNetwork ? 'network result is model-reported' : 'network probes disabled',
    },
  };

  return {
    id: row.id,
    launch,
    tools_field: row.declared === null ? 'omitted' : 'explicit',
    declared,
    exit_code: execution.status ?? null,
    duration_ms: execution.durationMs ?? null,
    valid,
    invalid_reason: valid ? null : invalidReason({ execution, parsed }),
    validator: {
      warned: warningData.warned.filter((tool) => declared.includes(tool)),
      silent: [],
      unobserved: valid ? [] : [...declared],
      raw_lines: warningData.rawLines,
    },
    grant: {
      self_reported: unique([...selfReported]),
      by_tool: byTool,
      exercised,
      disagreements,
    },
    transcript_sha256: createHash('sha256').update(redactText(transcript)).digest('hex'),
    transcript_retained: false,
  };
}

function exerciseResult(valid, passed, evidence) {
  if (!valid) return { result: 'unobserved', evidence: 'run is invalid' };
  return {
    result: passed ? 'ok' : 'fail',
    evidence: passed ? evidence : 'required side effect absent after run',
  };
}

function invalidReason({ execution, parsed }) {
  if (execution.timedOut) return 'host process timed out';
  if (execution.truncated) return 'host transcript was truncated';
  if (execution.error) return `host process failed to start: ${execution.error}`;
  if (execution.status !== 0) return `host process exited ${execution.status}`;
  return parsed.reason;
}

export function buildReport({
  inputs,
  host,
  captured,
  allowNetwork = false,
  sensitiveValues = [],
}) {
  const classified = inputs.map((input) => classifyRun({ ...input, allowNetwork }));
  applyValidatorObservability(classified);
  const validRuns = classified.filter((run) => run.valid);
  const channels = channelStatus(classified);
  const report = {
    schema_version: 1,
    probe_version: 1,
    captured,
    host,
    channels,
    runs: classified,
    matrix: buildToolMatrix(validRuns),
    findings: buildFindings(classified),
    not_measured: unique([
      'todo', 'playwright', 'session_store_sql', 'read_agent', 'write_agent',
      ...(allowNetwork ? [] : ['web']),
    ]),
    caveats: [
      'one host, one OS, one CLI build - this is a measurement, not a specification',
      'search-family evidence is corroborating because a read tool could find the same needle',
      ...(allowNetwork ? ['web results are model-reported, not proven by an out-of-band side effect'] : []),
      ...classified.filter((run) => !run.valid).map((run) => `${run.id}/${run.launch}: ${run.invalid_reason}`),
    ],
  };
  return redactValue(report, sensitiveValues);
}

function applyValidatorObservability(runs) {
  for (const launch of ['direct', 'delegated']) {
    const control = runs.find((run) => run.id === 'R9-control' && run.launch === launch);
    const observed = control?.valid
      && BOGUS_TOOLS.every((tool) => control.validator.warned.includes(tool));
    for (const run of runs.filter((candidate) => candidate.launch === launch)) {
      if (!run.valid || !observed) {
        run.validator.unobserved = [...run.declared];
        run.validator.silent = [];
        continue;
      }
      run.validator.unobserved = [];
      run.validator.silent = run.declared.filter((tool) => !run.validator.warned.includes(tool));
    }
  }
}

function channelStatus(runs) {
  const validatorByLaunch = {};
  const runtimeByLaunch = {};
  for (const launch of ['direct', 'delegated']) {
    const selected = runs.filter((run) => run.launch === launch);
    const control = selected.find((run) => run.id === 'R9-control');
    validatorByLaunch[launch] = control?.valid
      && BOGUS_TOOLS.every((tool) => control.validator.warned.includes(tool))
      ? 'observed'
      : 'unobserved';
    runtimeByLaunch[launch] = selected.length > 0 && selected.every((run) => run.valid)
      ? 'observed'
      : selected.some((run) => run.valid) ? 'partial' : 'unobserved';
  }
  return {
    validator: {
      status: Object.values(validatorByLaunch).every((value) => value === 'observed')
        ? 'observed'
        : 'unobserved',
      by_launch: validatorByLaunch,
      control_run: 'R9-control',
      rule: 'silent is valid only when both bogus control warnings were observed',
    },
    runtime: {
      status: Object.values(runtimeByLaunch).every((value) => value === 'observed')
        ? 'observed'
        : Object.values(runtimeByLaunch).some((value) => value !== 'unobserved')
          ? 'partial'
          : 'unobserved',
      by_launch: runtimeByLaunch,
    },
  };
}

function buildToolMatrix(runs) {
  const tools = unique(runs.flatMap((run) => run.declared));
  const matrix = {};
  for (const tool of tools) {
    const selected = runs.filter((run) => run.declared.includes(tool));
    matrix[tool] = {
      class: toolClass(tool),
      validator: aggregateValidator(selected, tool),
      grant_direct: aggregateGrant(selected.filter((run) => run.launch === 'direct'), tool),
      grant_delegated: aggregateGrant(selected.filter((run) => run.launch === 'delegated'), tool),
      runs: selected.map((run) => `${run.id}/${run.launch}`).sort(),
    };
  }
  return matrix;
}

function aggregateValidator(runs, tool) {
  if (!runs.length || runs.some((run) => run.validator.unobserved.includes(tool))) return 'unobserved';
  if (runs.some((run) => run.validator.warned.includes(tool))) return 'warned';
  return 'silent';
}

function aggregateGrant(runs, tool) {
  if (!runs.length) return 'unobserved';
  const values = runs.map((run) => run.grant.by_tool[tool] ?? 'unobserved');
  for (const preferred of [
    'exercised-ok', 'self-reported-present', 'exercised-fail',
    'self-reported-absent', 'not-testable', 'unobserved',
  ]) {
    if (values.includes(preferred)) return preferred;
  }
  return 'unobserved';
}

function buildFindings(runs) {
  const validRuns = runs.filter((run) => run.valid);
  const matrix = buildToolMatrix(validRuns);
  const warnedAndGranted = [];
  const silentAndUngranted = [];
  let delegationDiffers = false;
  for (const [tool, result] of Object.entries(matrix)) {
    const grants = [result.grant_direct, result.grant_delegated];
    if (result.validator === 'warned' && grants.includes('exercised-ok')) warnedAndGranted.push(tool);
    if (result.validator === 'silent' && grants.includes('exercised-fail')) silentAndUngranted.push(tool);
    if (
      result.grant_direct !== 'unobserved'
      && result.grant_delegated !== 'unobserved'
      && result.grant_direct !== result.grant_delegated
    ) {
      delegationDiffers = true;
    }
  }

  const controls = ['direct', 'delegated'].map((launch) =>
    runs.find((run) => run.id === 'R9-control' && run.launch === launch));
  const controlsObserved = controls.every((run) =>
    run?.valid && run.validator.unobserved.length === 0);
  const bogusIgnored = controlsObserved
    ? controls.every((run) =>
      BOGUS_TOOLS.every((tool) => run.validator.warned.includes(tool))
      && run.grant.by_tool.read === 'exercised-ok')
    : null;

  const primaryRuns = runs.filter((run) => run.id === 'R2-primary');
  const primaryComplete = LAUNCH_MODES.every((launch) =>
    primaryRuns.some((run) =>
      run.launch === launch && run.valid && run.validator.unobserved.length === 0));
  const primaryValidator = PRIMARY_TOOLS.map((tool) => matrix[tool]?.validator ?? 'unobserved');
  const warningFree = !primaryComplete || primaryValidator.includes('unobserved')
    ? null
    : primaryValidator.every((value) => value === 'silent');

  const runIds = unique(runs.map((run) => run.id));
  const paired = runIds.every((id) =>
    LAUNCH_MODES.every((launch) =>
      runs.some((run) => run.id === id && run.launch === launch && run.valid)));

  return {
    warned_and_granted: warnedAndGranted.sort(),
    silent_and_ungranted: silentAndUngranted.sort(),
    bogus_ignored: bogusIgnored,
    base_set_direct: baseSet(runs, 'direct'),
    base_set_delegated: baseSet(runs, 'delegated'),
    delegation_differs: paired ? delegationDiffers : null,
    warning_free_spelling_exists: warningFree,
  };
}

function baseSet(runs, launch) {
  const omitted = runs.find((run) =>
    run.id === 'R0-omitted' && run.launch === launch && run.valid);
  if (!omitted) return [];
  return Object.entries(omitted.grant.exercised)
    .filter(([, result]) => result.result === 'ok')
    .map(([family]) => family)
    .sort();
}

const LAUNCH_MODES = ['direct', 'delegated'];

export function reportStatus(report) {
  if (!report.runs.some((run) => run.valid)) return 3;
  if (report.channels.validator.status !== 'observed') return 3;
  if (report.runs.some((run) => !run.valid)) return 1;
  if (report.runs.some((run) =>
    Object.values(run.grant.by_tool).includes('exercised-fail'))) return 1;
  return 0;
}

export function normalizeReportForComparison(report) {
  const normalized = structuredClone(report);
  normalized.captured = '<normalized>';
  for (const run of normalized.runs ?? []) run.duration_ms = null;
  return normalized;
}

export function validateReport(report) {
  const errors = [];
  if (report?.schema_version !== 1) errors.push('schema_version must be 1');
  if (report?.probe_version !== 1) errors.push('probe_version must be 1');
  if (!report?.host?.copilot_version) errors.push('host.copilot_version is required');
  if (!Array.isArray(report?.runs)) errors.push('runs must be an array');
  if (!report?.channels?.validator || !report?.channels?.runtime) {
    errors.push('validator and runtime channel status are required');
  }
  for (const run of report?.runs ?? []) {
    if (!['direct', 'delegated'].includes(run.launch)) {
      errors.push(`${run.id ?? '<unknown>'}: invalid launch mode`);
    }
    if (typeof run.valid !== 'boolean') errors.push(`${run.id ?? '<unknown>'}: valid must be boolean`);
    if (!run.validator || !run.grant) errors.push(`${run.id ?? '<unknown>'}: validator and grant are required`);
  }
  return errors;
}

export function stableJson(value) {
  return `${JSON.stringify(sortValue(value), null, 2)}\n`;
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, sortValue(value[key])]),
  );
}

export function redactText(value, sensitiveValues = []) {
  let text = String(value ?? '');
  const replacements = [
    [/\bgh[pousr]_[A-Za-z0-9_]{12,}\b/g, '<redacted-token>'],
    [/\bgithub_pat_[A-Za-z0-9_]{12,}\b/g, '<redacted-token>'],
    [/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/gi, 'Bearer <redacted-token>'],
    [/\b(?:token|password|secret|api[_-]?key)\s*[:=]\s*["']?[^\s"',;]+/gi, '<redacted-credential>'],
    [/\b[A-Za-z]:\\Users\\[^\\\r\n]+/gi, '<redacted-home>'],
    [/\/(?:home|Users)\/[^/\s]+/g, '<redacted-home>'],
  ];
  for (const sensitive of sensitiveValues.filter(Boolean).sort((a, b) => b.length - a.length)) {
    text = text.split(String(sensitive)).join('<redacted>');
  }
  for (const [pattern, replacement] of replacements) text = text.replace(pattern, replacement);
  return text;
}

export function redactValue(value, sensitiveValues = []) {
  if (typeof value === 'string') return redactText(value, sensitiveValues);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, sensitiveValues));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, redactValue(item, sensitiveValues)]),
  );
}

function slug(value) {
  const normalized = value.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  if (value === value.toLowerCase()) return normalized;
  const caseTag = createHash('sha256').update(value).digest('hex').slice(0, 6);
  return `${normalized}-${caseTag}`;
}

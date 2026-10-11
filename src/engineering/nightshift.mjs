#!/usr/bin/env node

import {spawnSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {delimiter, dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const PLAN_KEYS = new Set([
  'schemaVersion',
  'runId',
  'approvedAt',
  'deadline',
  'projectId',
  'subject',
  'direction',
  'base',
  'limits',
  'permissions',
  'stacking',
  'slices',
]);
const SLICE_KEYS = new Set([
  'id',
  'task',
  'outcome',
  'acceptance',
  'touches',
  'completionCheck',
  'route',
  'reviewRequired',
  'branch',
  'dependsOn',
]);
const RESULT_KEYS = new Set([
  'status',
  'summary',
  'headSha',
  'prUrl',
  'evidence',
  'suggestions',
  'blocker',
  'nextAction',
]);
const SUGGESTION_KEYS = new Set([
  'summary',
  'basis',
  'whyDeferred',
  'benefit',
  'costRisk',
  'priority',
]);
const BLOCKER_KEYS = new Set([
  'kind',
  'owner',
  'context',
  'ask',
  'answerBy',
  'questionRef',
]);
const RESULT_STATUSES = new Set(['delivered', 'blocked', 'failed']);
const STAGE_RESULT_KEYS = new Set([
  'status',
  'summary',
  'headSha',
  'evidence',
  'suggestions',
  'blocker',
  'nextAction',
]);
const STAGE_STATUSES = new Set(['completed', 'blocked', 'failed']);
const BLOCKER_KINDS = new Set([
  'fact',
  'decision',
  'action',
  'capability',
  'collision',
  'limit',
]);
const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;
const PROJECT_ID = /^[a-z][a-z0-9-]*$/;
const TYPED_FEATURE_ID = /^engineering:feature:[a-z0-9][a-z0-9-]*$/;
const TYPED_TASK_ID = /^engineering:task:[a-z0-9][a-z0-9-]*$/;
const FULL_SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const BRANCH = /^kai\/(?:feat|fix|docs|refactor|chore)\/[a-z0-9][a-z0-9-]*$/;
const SECRET_REF = /^[A-Z][A-Z0-9_]*$/;
const MAX_CAPTURE_BYTES = 16 * 1024 * 1024;
const ROUTE_BUILDERS = Object.freeze({
  frontend: 'eng-builder-frontend',
  backend: 'eng-builder-backend',
});
const DELIVERY_PROFILE = 'eng-lead-software';
const REVIEW_PROFILE = 'eng-reviewer-code';

function fail(message) {
  throw new Error(message);
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value;
}

function exactKeys(value, keys, label) {
  object(value, label);
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) fail(`${label} is missing "${key}"`);
  }
  for (const key of Object.keys(value)) {
    if (!keys.has(key)) fail(`${label} contains unexpected key "${key}"`);
  }
}

function string(value, label) {
  if (typeof value !== 'string' || !value.trim() || /[\0]/.test(value)) {
    fail(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value, label) {
  if (value === null) return null;
  return string(value, label);
}

function integer(value, label, {min = 1, max = Number.MAX_SAFE_INTEGER} = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    fail(`${label} must be an integer from ${min} through ${max}`);
  }
  return value;
}

function finite(value, label, {min = 0, max = Number.MAX_VALUE} = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    fail(`${label} must be a finite number from ${min} through ${max}`);
  }
  return value;
}

function timestamp(value, label) {
  const parsed = Date.parse(string(value, label));
  if (!Number.isFinite(parsed)) fail(`${label} must be an ISO timestamp`);
  return new Date(parsed).toISOString();
}

function strings(value, label, {nonEmpty = false, pattern = null} = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0)) {
    fail(`${label} must be ${nonEmpty ? 'a non-empty' : 'an'} array`);
  }
  const normalized = value.map((entry, index) => {
    const item = string(entry, `${label}[${index}]`);
    if (pattern && !pattern.test(item)) fail(`${label}[${index}] is invalid`);
    return item;
  });
  if (new Set(normalized).size !== normalized.length) fail(`${label} contains duplicates`);
  return normalized;
}

function positiveVersion(value, label) {
  return integer(value, label, {min: 1});
}

function safeId(value, label) {
  value = string(value, label);
  if (!SAFE_ID.test(value)) fail(`${label} must be a lowercase safe ID`);
  return value;
}

function fullSha(value, label) {
  value = string(value, label);
  if (!FULL_SHA.test(value)) fail(`${label} must be a full lowercase commit SHA`);
  return value;
}

function validUrl(value, label) {
  value = string(value, label);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${label} must be an absolute URL`);
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    fail(`${label} must be an HTTPS URL without credentials`);
  }
  return parsed.toString().replace(/\/$/, '');
}

function branch(value, label) {
  value = string(value, label);
  if (!BRANCH.test(value)) {
    fail(`${label} must use kai/<type>/<anchor>-<slug> with a supported type`);
  }
  return value;
}

function safeRelative(value, label) {
  value = string(value, label).replaceAll('\\', '/').replace(/^\.\//, '');
  if (value.startsWith('/') || value.split('/').some(part =>
    !part || part === '.' || part === '..' || /[\0\r\n]/.test(part))) {
    fail(`${label} must be a safe repository-relative path`);
  }
  return value;
}

function normalizeSlice(raw, index) {
  const label = `slices[${index}]`;
  exactKeys(raw, SLICE_KEYS, label);
  exactKeys(raw.task, new Set(['id', 'version']), `${label}.task`);
  const taskId = string(raw.task.id, `${label}.task.id`);
  if (!TYPED_TASK_ID.test(taskId)) fail(`${label}.task.id must be an engineering Task ID`);
  const route = string(raw.route, `${label}.route`);
  if (!Object.hasOwn(ROUTE_BUILDERS, route)) {
    fail(`${label}.route must be "frontend" or "backend"`);
  }
  if (typeof raw.reviewRequired !== 'boolean') {
    fail(`${label}.reviewRequired must be boolean`);
  }
  return {
    id: safeId(raw.id, `${label}.id`),
    task: {
      id: taskId,
      version: positiveVersion(raw.task.version, `${label}.task.version`),
    },
    outcome: string(raw.outcome, `${label}.outcome`),
    acceptance: strings(raw.acceptance, `${label}.acceptance`, {nonEmpty: true}),
    touches: strings(raw.touches, `${label}.touches`, {nonEmpty: true})
      .map((entry, touchIndex) => safeRelative(entry, `${label}.touches[${touchIndex}]`)),
    completionCheck: string(raw.completionCheck, `${label}.completionCheck`),
    route,
    reviewRequired: raw.reviewRequired,
    branch: branch(raw.branch, `${label}.branch`),
    dependsOn: strings(raw.dependsOn, `${label}.dependsOn`),
  };
}

export function profilesForSlice(slice) {
  const builder = ROUTE_BUILDERS[slice.route];
  if (!builder) fail(`slice route ${slice.route ?? '(missing)'} is unsupported`);
  return [
    builder,
    DELIVERY_PROFILE,
    ...(slice.reviewRequired ? [REVIEW_PROFILE] : []),
  ];
}

function assertAcyclic(slices) {
  const byId = new Map(slices.map(slice => [slice.id, slice]));
  const visiting = new Set();
  const visited = new Set();
  const visit = slice => {
    if (visiting.has(slice.id)) fail(`slice dependencies contain a cycle at ${slice.id}`);
    if (visited.has(slice.id)) return;
    visiting.add(slice.id);
    for (const dependency of slice.dependsOn) {
      const target = byId.get(dependency);
      if (!target) fail(`slice ${slice.id} has unknown dependency ${dependency}`);
      visit(target);
    }
    visiting.delete(slice.id);
    visited.add(slice.id);
  };
  slices.forEach(visit);
}

export function validatePlan(raw) {
  exactKeys(raw, PLAN_KEYS, 'plan');
  if (raw.schemaVersion !== 1) fail('plan.schemaVersion must be 1');
  const approvedAt = timestamp(raw.approvedAt, 'plan.approvedAt');
  const deadline = timestamp(raw.deadline, 'plan.deadline');
  if (Date.parse(deadline) <= Date.parse(approvedAt)) {
    fail('plan.deadline must be after plan.approvedAt');
  }
  const projectId = string(raw.projectId, 'plan.projectId');
  if (!PROJECT_ID.test(projectId)) fail('plan.projectId must be kebab-case');

  exactKeys(raw.subject, new Set(['kind', 'id', 'version']), 'plan.subject');
  if (raw.subject.kind !== 'feature') fail('plan.subject.kind must be "feature"');
  const subjectId = string(raw.subject.id, 'plan.subject.id');
  if (!TYPED_FEATURE_ID.test(subjectId)) {
    fail('plan.subject.id must be an engineering Feature ID');
  }

  exactKeys(raw.direction, new Set(['path', 'sha256', 'goal']), 'plan.direction');
  const directionPath = safeRelative(raw.direction.path, 'plan.direction.path');
  if (directionPath !== 'docs/kai/DIRECTION.md') {
    fail('plan.direction.path must be docs/kai/DIRECTION.md');
  }
  const directionSha = string(raw.direction.sha256, 'plan.direction.sha256');
  if (!SHA256.test(directionSha)) fail('plan.direction.sha256 must be lowercase SHA-256');

  exactKeys(raw.base, new Set(['remote', 'branch', 'sha']), 'plan.base');
  const remote = string(raw.base.remote, 'plan.base.remote');
  if (!/^[A-Za-z0-9._-]+$/.test(remote)) fail('plan.base.remote is invalid');
  const baseBranch = string(raw.base.branch, 'plan.base.branch');
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(baseBranch)
    || baseBranch.includes('..') || baseBranch.endsWith('/')) {
    fail('plan.base.branch is invalid');
  }

  exactKeys(raw.limits, new Set([
    'maxPullRequests',
    'maxAiCredits',
    'maxAutopilotContinues',
    'maxRetainedWorktrees',
  ]), 'plan.limits');
  exactKeys(raw.permissions, new Set([
    'push',
    'pullRequests',
    'allowedUrls',
    'secretRefs',
  ]), 'plan.permissions');
  if (typeof raw.permissions.push !== 'boolean'
    || typeof raw.permissions.pullRequests !== 'boolean') {
    fail('plan permissions must use booleans');
  }
  if (typeof raw.stacking !== 'boolean') fail('plan.stacking must be boolean');

  if (!Array.isArray(raw.slices) || raw.slices.length === 0) {
    fail('plan.slices must be a non-empty array');
  }
  const slices = raw.slices.map(normalizeSlice);
  if (new Set(slices.map(slice => slice.id)).size !== slices.length) {
    fail('plan.slices contains duplicate IDs');
  }
  if (new Set(slices.map(slice => slice.branch.toLowerCase())).size !== slices.length) {
    fail('plan.slices contains duplicate branches');
  }
  assertAcyclic(slices);

  return {
    schemaVersion: 1,
    runId: safeId(raw.runId, 'plan.runId'),
    approvedAt,
    deadline,
    projectId,
    subject: {
      kind: 'feature',
      id: subjectId,
      version: positiveVersion(raw.subject.version, 'plan.subject.version'),
    },
    direction: {
      path: directionPath,
      sha256: directionSha,
      goal: string(raw.direction.goal, 'plan.direction.goal'),
    },
    base: {
      remote,
      branch: baseBranch,
      sha: fullSha(raw.base.sha, 'plan.base.sha'),
    },
    limits: {
      maxPullRequests: integer(raw.limits.maxPullRequests, 'plan.limits.maxPullRequests', {
        min: 1,
        max: 100,
      }),
      maxAiCredits: finite(raw.limits.maxAiCredits, 'plan.limits.maxAiCredits', {
        min: 0.01,
        max: 1_000_000,
      }),
      maxAutopilotContinues: integer(
        raw.limits.maxAutopilotContinues,
        'plan.limits.maxAutopilotContinues',
        {min: 1, max: 100},
      ),
      maxRetainedWorktrees: integer(
        raw.limits.maxRetainedWorktrees,
        'plan.limits.maxRetainedWorktrees',
        {min: 0, max: 100},
      ),
    },
    permissions: {
      push: raw.permissions.push,
      pullRequests: raw.permissions.pullRequests,
      allowedUrls: strings(raw.permissions.allowedUrls, 'plan.permissions.allowedUrls')
        .map((entry, index) => validUrl(entry, `plan.permissions.allowedUrls[${index}]`)),
      secretRefs: strings(raw.permissions.secretRefs, 'plan.permissions.secretRefs', {
        pattern: SECRET_REF,
      }),
    },
    stacking: raw.stacking,
    slices,
  };
}

function suggestion(raw, label) {
  exactKeys(raw, SUGGESTION_KEYS, label);
  return {
    summary: string(raw.summary, `${label}.summary`),
    basis: string(raw.basis, `${label}.basis`),
    whyDeferred: string(raw.whyDeferred, `${label}.whyDeferred`),
    benefit: string(raw.benefit, `${label}.benefit`),
    costRisk: string(raw.costRisk, `${label}.costRisk`),
    priority: string(raw.priority, `${label}.priority`),
  };
}

function blockerResult(raw, label) {
  exactKeys(raw, BLOCKER_KEYS, label);
  const kind = string(raw.kind, `${label}.kind`);
  if (!BLOCKER_KINDS.has(kind)) fail(`${label}.kind is unsupported`);
  return {
    kind,
    owner: string(raw.owner, `${label}.owner`),
    context: string(raw.context, `${label}.context`),
    ask: string(raw.ask, `${label}.ask`),
    answerBy: string(raw.answerBy, `${label}.answerBy`),
    questionRef: optionalString(raw.questionRef, `${label}.questionRef`),
  };
}

export function validateSliceResult(raw, {
  baseHead,
  actualHead,
  clean,
} = {}) {
  exactKeys(raw, RESULT_KEYS, 'result');
  const status = string(raw.status, 'result.status');
  if (!RESULT_STATUSES.has(status)) fail('result.status is unsupported');
  const headSha = raw.headSha === null ? null : fullSha(raw.headSha, 'result.headSha');
  const prUrl = raw.prUrl === null ? null : validUrl(raw.prUrl, 'result.prUrl');
  if (prUrl !== null && !/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(prUrl)) {
    fail('result.prUrl must be a GitHub pull request URL');
  }
  if (!Array.isArray(raw.suggestions)) fail('result.suggestions must be an array');
  const normalized = {
    status,
    summary: string(raw.summary, 'result.summary'),
    headSha,
    prUrl,
    evidence: strings(raw.evidence, 'result.evidence'),
    suggestions: raw.suggestions.map((entry, index) =>
      suggestion(entry, `result.suggestions[${index}]`)),
    blocker: raw.blocker === null ? null : blockerResult(raw.blocker, 'result.blocker'),
    nextAction: string(raw.nextAction, 'result.nextAction'),
  };

  if (status === 'delivered') {
    if (normalized.blocker !== null) fail('delivered result.blocker must be null');
    if (!normalized.prUrl) fail('delivered result requires a pull request URL in prUrl');
    if (!normalized.headSha) fail('delivered result requires headSha');
    if (clean !== true) fail('delivered result requires a clean worktree');
    if (normalized.headSha !== actualHead) {
      fail('delivered result headSha does not match actual worktree HEAD');
    }
    if (normalized.headSha === baseHead) fail('delivered result must differ from its base head');
  } else if (normalized.blocker === null) {
    fail(`${status} result requires blocker details`);
  }
  return normalized;
}

function validateStageResult(raw, {
  actualHead,
  baseHead,
  clean,
  requireChange,
  label,
}) {
  exactKeys(raw, STAGE_RESULT_KEYS, label);
  const status = string(raw.status, `${label}.status`);
  if (!STAGE_STATUSES.has(status)) fail(`${label}.status is unsupported`);
  const headSha = raw.headSha === null ? null : fullSha(raw.headSha, `${label}.headSha`);
  if (!Array.isArray(raw.suggestions)) fail(`${label}.suggestions must be an array`);
  const normalized = {
    status,
    summary: string(raw.summary, `${label}.summary`),
    headSha,
    evidence: strings(raw.evidence, `${label}.evidence`),
    suggestions: raw.suggestions.map((entry, index) =>
      suggestion(entry, `${label}.suggestions[${index}]`)),
    blocker: raw.blocker === null ? null : blockerResult(raw.blocker, `${label}.blocker`),
    nextAction: string(raw.nextAction, `${label}.nextAction`),
  };
  if (status === 'completed') {
    if (normalized.blocker !== null) fail(`${label}.blocker must be null when completed`);
    if (!normalized.headSha || normalized.headSha !== actualHead) {
      fail(`${label}.headSha must match actual worktree HEAD`);
    }
    if (clean !== true) fail(`${label} requires a clean committed worktree`);
    if (requireChange && normalized.headSha === baseHead) {
      fail(`${label} completed without a commit beyond its base`);
    }
  } else if (normalized.blocker === null) {
    fail(`${label} requires blocker details when ${status}`);
  }
  return normalized;
}

function stageAsSliceResult(stage) {
  if (stage.status === 'completed') fail('completed stage cannot become a terminal slice result');
  return {
    status: stage.status,
    summary: stage.summary,
    headSha: stage.headSha,
    prUrl: null,
    evidence: stage.evidence,
    suggestions: stage.suggestions,
    blocker: stage.blocker,
    nextAction: stage.nextAction,
  };
}

export function runPaths(root, runId) {
  const safeRunId = safeId(runId, 'run ID');
  const runRelative = join('.kai', 'engineering', 'reports', 'nightshift', safeRunId);
  const runRoot = resolve(root, runRelative);
  return {
    runRelative,
    runRoot,
    drafts: join(runRoot, 'drafts'),
    evidence: join(runRoot, 'evidence'),
    scratch: join(runRoot, 'scratch'),
    plan: join(runRoot, 'drafts', 'plan.json'),
    ledger: join(runRoot, 'drafts', 'ledger.json'),
    report: join(runRoot, 'drafts', 'report.md'),
  };
}

function canonical(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${label} is not readable JSON: ${error.message}`);
  }
}

function isWithin(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function pathKey(path) {
  const normalized = resolve(path).replaceAll('\\', '/');
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function samePath(left, right) {
  return pathKey(left) === pathKey(right);
}

function assertNoLinks(parent, target, label) {
  if (!isWithin(parent, target)) fail(`${label} escapes its allowed root`);
  let current = resolve(parent);
  if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
    fail(`${label} cannot use a linked root`);
  }
  const rel = relative(current, resolve(target));
  for (const part of rel.split(sep).filter(Boolean)) {
    current = join(current, part);
    if (!existsSync(current)) continue;
    if (lstatSync(current).isSymbolicLink()) fail(`${label} cannot traverse a link or junction`);
  }
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), {recursive: true});
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, bytes, {flag: 'wx'});
  try {
    renameSync(temp, path);
  } catch (error) {
    rmSync(temp, {force: true});
    throw error;
  }
}

function writeLedger(path, ledger) {
  atomicWrite(path, canonical(ledger));
}

function git(root, args, {allowFailure = false} = {}) {
  const result = spawnSync('git', ['--no-pager', '-C', root, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: MAX_CAPTURE_BYTES,
    env: Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key))),
  });
  if (!allowFailure && (result.error || result.status !== 0)) {
    fail(`git ${args[0]} failed: ${result.error?.message ?? result.stderr.trim() ?? `exit ${result.status}`}`);
  }
  return result;
}

function gitText(root, args) {
  return git(root, args).stdout.trim();
}

function workspace(root, plan, {verifyCurrentBase = false} = {}) {
  root = resolve(root);
  if (!existsSync(root)) fail(`workspace root does not exist: ${root}`);
  if (!samePath(realpathSync(root), root)) fail('workspace root must use its exact physical path');
  const manifestPath = join(root, '.kai', 'manifest.json');
  if (!existsSync(manifestPath) || lstatSync(manifestPath).isSymbolicLink()) {
    fail('Nightshift requires an exact schema-5 .kai/manifest.json');
  }
  const manifest = readJson(manifestPath, '.kai/manifest.json');
  if (manifest.schema_version !== 5) fail('Nightshift requires workspace schema 5');
  const project = manifest.projects?.find(entry => entry.id === plan.projectId);
  if (!project) fail(`workspace has no project binding "${plan.projectId}"`);
  const projectRoot = manifest.placement === 'repo-local'
    ? resolve(root, project.path)
    : resolve(project.path);
  if (!existsSync(projectRoot) || !samePath(realpathSync(projectRoot), projectRoot)) {
    fail('Nightshift project root must be an exact existing physical path');
  }
  if (!samePath(gitText(projectRoot, ['rev-parse', '--show-toplevel']), projectRoot)) {
    fail('Nightshift project binding must itself be the Git root');
  }
  if (manifest.placement === 'repo-local') {
    const trackedPrivate = gitText(projectRoot, ['ls-files', '--', '.kai']);
    if (trackedPrivate) fail('Nightshift refuses tracked .kai workspace state');
    const ignoredPrivate = git(projectRoot, [
      'check-ignore',
      '--quiet',
      '--no-index',
      '.kai/engineering/reports/nightshift/.probe',
    ], {allowFailure: true});
    if (ignoredPrivate.status !== 0) {
      fail('Nightshift requires the private .kai tree to be ignored');
    }
  }
  const baseObject = gitText(projectRoot, ['rev-parse', '--verify', `${plan.base.sha}^{commit}`]);
  if (baseObject !== plan.base.sha) fail('approved base commit does not resolve exactly');
  if (verifyCurrentBase) verifyBasis(projectRoot, plan);
  return {root, manifest, project, projectRoot};
}

function verifyBase(projectRoot, plan) {
  const resolved = gitText(projectRoot, ['rev-parse', '--verify', `${plan.base.sha}^{commit}`]);
  if (resolved !== plan.base.sha) fail('approved base commit does not resolve exactly');
  const remoteRef = `refs/remotes/${plan.base.remote}/${plan.base.branch}`;
  const remote = git(projectRoot, ['rev-parse', '--verify', remoteRef], {allowFailure: true});
  if (remote.status !== 0) fail(`approved base ref ${remoteRef} is unavailable; fetch it before Nightshift`);
  if (remote.stdout.trim() !== plan.base.sha) {
    fail(`approved base drifted: ${remoteRef} no longer matches ${plan.base.sha}`);
  }
}

function verifyDirection(projectRoot, plan) {
  const path = resolve(projectRoot, ...plan.direction.path.split('/'));
  if (!isWithin(projectRoot, path) || !existsSync(path) || lstatSync(path).isSymbolicLink()) {
    fail('approved Direction path is unavailable or unsafe');
  }
  const digest = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (digest !== plan.direction.sha256) {
    fail('approved Direction changed after Nightshift preparation');
  }
}

function verifyBasis(projectRoot, plan) {
  verifyBase(projectRoot, plan);
  verifyDirection(projectRoot, plan);
}

function initialLedger(plan) {
  return {
    schemaVersion: 1,
    runId: plan.runId,
    status: 'prepared',
    startedAt: null,
    finishedAt: null,
    terminalReason: null,
    observedAiCredits: null,
    slices: Object.fromEntries(plan.slices.map(slice => [slice.id, {
      status: 'pending',
      baseHead: null,
      headSha: null,
      branch: slice.branch,
      worktree: null,
      result: null,
      reason: null,
      startedAt: null,
      finishedAt: null,
    }])),
  };
}

export function prepareRun({root, plan: rawPlan}) {
  const plan = validatePlan(rawPlan);
  workspace(root, plan, {verifyCurrentBase: true});
  const paths = runPaths(root, plan.runId);
  assertNoLinks(resolve(root, '.kai'), paths.runRoot, 'Nightshift run path');
  mkdirSync(paths.drafts, {recursive: true});
  mkdirSync(paths.evidence, {recursive: true});
  mkdirSync(paths.scratch, {recursive: true});

  if (existsSync(paths.plan)) {
    const existing = validatePlan(readJson(paths.plan, 'retained Nightshift plan'));
    if (canonical(existing) !== canonical(plan)) {
      fail(`Nightshift run ${plan.runId} already has a different immutable plan`);
    }
    if (!existsSync(paths.ledger)) fail('retained Nightshift plan has no ledger');
    return {plan, ledger: readJson(paths.ledger, 'Nightshift ledger'), paths, created: false};
  }

  atomicWrite(paths.plan, canonical(plan));
  const ledger = initialLedger(plan);
  writeLedger(paths.ledger, ledger);
  return {plan, ledger, paths, created: true};
}

function loadRun(root, runId) {
  const paths = runPaths(root, runId);
  if (!existsSync(paths.plan) || !existsSync(paths.ledger)) {
    fail(`Nightshift run ${runId} is not prepared`);
  }
  const plan = validatePlan(readJson(paths.plan, 'Nightshift plan'));
  if (plan.runId !== runId) fail('Nightshift plan run ID does not match its path');
  const ledger = readJson(paths.ledger, 'Nightshift ledger');
  if (ledger.schemaVersion !== 1 || ledger.runId !== runId || !ledger.slices) {
    fail('Nightshift ledger is malformed');
  }
  const resolved = workspace(root, plan);
  return {plan, ledger, paths, ...resolved};
}

export function classifySlices(plan, ledger) {
  const ready = [];
  const skipped = [];
  for (const slice of plan.slices) {
    const state = ledger.slices[slice.id];
    if (!state || state.status !== 'pending') continue;
    let waiting = false;
    let reason = null;
    for (const dependency of slice.dependsOn) {
      const dependencyState = ledger.slices[dependency]?.status;
      if (new Set(['blocked', 'failed', 'skipped']).has(dependencyState)) {
        reason = `dependency ${dependency} is ${dependencyState}`;
        break;
      }
      if (dependencyState !== 'delivered') waiting = true;
    }
    if (reason) {
      skipped.push({id: slice.id, reason});
    } else if (!waiting && slice.dependsOn.length > 0 && !plan.stacking) {
      skipped.push({
        id: slice.id,
        reason: 'dependency delivered but stacked pull requests are not approved',
      });
    } else if (!waiting) {
      ready.push(slice);
    }
  }
  return {ready, skipped};
}

function safePluginArguments(env = process.env) {
  const dirs = (env.KAI_COPILOT_PLUGIN_DIRS ?? '').split(delimiter).filter(Boolean);
  for (const path of dirs) {
    if (!isAbsolute(path) || !existsSync(path)) {
      fail('KAI_COPILOT_PLUGIN_DIRS must contain existing absolute plugin directories');
    }
  }
  return dirs.flatMap(path => ['--plugin-dir', path]);
}

export function buildCopilotArgs({
  plan,
  slice,
  profile,
  prompt,
  aiCredits,
  workspaceRoot = null,
  env = process.env,
}) {
  const args = [
    '--agent',
    string(profile, 'Copilot profile'),
    ...safePluginArguments(env),
    '--autopilot',
    '--no-ask-user',
    '--allow-all-tools',
    '--no-auto-update',
    '--max-autopilot-continues',
    String(plan.limits.maxAutopilotContinues),
    '--max-ai-credits',
    String(aiCredits),
  ];
  if (workspaceRoot) args.push('--add-dir', resolve(workspaceRoot));
  for (const url of plan.permissions.allowedUrls) args.push('--allow-url', url);
  if (plan.permissions.secretRefs.length > 0) {
    args.push('--secret-env-vars', ...plan.permissions.secretRefs);
  }
  args.push('--silent', '--prompt', prompt);
  return args;
}

function resultContract() {
  return {
    status: 'delivered | blocked | failed',
    summary: '<required outcome or exact gap>',
    headSha: '<full lowercase commit SHA or null>',
    prUrl: '<GitHub pull request URL or null>',
    evidence: ['<durable observation or reference>'],
    suggestions: [{
      summary: '<not implemented>',
      basis: '<observed condition or explicit hypothesis>',
      whyDeferred: '<delivery-boundary reason>',
      benefit: '<expected value>',
      costRisk: '<implementation cost or risk>',
      priority: '<suggested priority>',
    }],
    blocker: {
      kind: '<fact | decision | action | capability | collision | limit>',
      owner: '<named authority or fact owner>',
      context: '<Observation, Attempts, Boundary, Recommendation, Resume point>',
      ask: '<one decision or action>',
      answerBy: '<timing or milestone>',
      questionRef: '<Core question reference or null>',
    },
    nextAction: '<safe resume or review action>',
  };
}

function stageResultContract() {
  return {
    status: 'completed | blocked | failed',
    summary: '<completed work or exact gap>',
    headSha: '<full lowercase commit SHA or null>',
    evidence: ['<durable observation or reference>'],
    suggestions: resultContract().suggestions,
    blocker: resultContract().blocker,
    nextAction: '<safe handoff or resume action>',
  };
}

function sharedPrompt(plan, slice, {baseHead, pullRequestBase}) {
  return [
    `Nightshift run ${plan.runId}, slice ${slice.id}, and no other scope.`,
    `Coordination workspace: ${plan.projectId}; Feature: ${plan.subject.id} version ${plan.subject.version}.`,
    `Task: ${slice.task.id} version ${slice.task.version}.`,
    `Required outcome: ${slice.outcome}`,
    `Acceptance: ${slice.acceptance.join(' | ')}`,
    `Touched areas: ${slice.touches.join(', ')}`,
    `Completion check: ${slice.completionCheck}`,
    `Git base commit: ${baseHead}`,
    `Branch: ${slice.branch}`,
    `Pull request base: ${pullRequestBase}`,
    `Git push authorized: ${plan.permissions.push}; pull request authorized: ${plan.permissions.pullRequests}.`,
    'Implement required work only. Preserve blockers in Core. Put broader or lower-confidence ideas in suggestions.',
    'Never merge, deploy, release, self-approve, or change Feature/Requirement scope.',
  ];
}

function builderPrompt(plan, slice, basis) {
  return [
    ...sharedPrompt(plan, slice, basis),
    `Act as the routed ${slice.route} builder. Apply software-development and your existing domain standards.`,
    'Claim and execute only the exact coordinated Task. Commit the coherent implementation and leave the worktree clean.',
    'Do not push, open a pull request, review, merge, deploy, or release. The delivery lead owns the next stage.',
    'Your final response must be exactly one JSON object with no Markdown fence or surrounding prose.',
    JSON.stringify(stageResultContract(), null, 2),
    'For completed, blocker must be null. For blocked or failed, blocker must be populated.',
  ].join('\n\n');
}

function deliveryPrompt(plan, slice, basis, builderResult) {
  return [
    ...sharedPrompt(plan, slice, basis),
    'Act as eng-lead-software for integration and pull-request delivery of the completed builder handoff.',
    `Builder handoff: ${JSON.stringify(builderResult)}`,
    'Verify the exact diff, Core handoff, scope, evidence, and clean Git state. Apply pr-sizing to the completed diff and pr-delivery to open the authorized pull request.',
    'Do not implement product changes, infer optional review, merge, deploy, tag, or release.',
    'Your final response must be exactly one JSON object with no Markdown fence or surrounding prose.',
    JSON.stringify(resultContract(), null, 2),
    'For delivered, blocker must be null. For blocked or failed, blocker must be populated.',
  ].join('\n\n');
}

function reviewPrompt(plan, slice, basis, deliveryResult) {
  return [
    ...sharedPrompt(plan, slice, basis),
    'Act as eng-reviewer-code. Independently review the exact delivered head and pull request without modifying the product.',
    `Delivery handoff: ${JSON.stringify(deliveryResult)}`,
    'Record the required exact-revision review in Core. Use completed only for Pass; use blocked for Changes requested and failed for Inconclusive or host failure.',
    'Your final response must be exactly one JSON object with no Markdown fence or surrounding prose.',
    JSON.stringify(stageResultContract(), null, 2),
    'For completed, blocker must be null. For blocked or failed, blocker must be populated.',
  ].join('\n\n');
}

function worktreePath(projectRoot, runId, sliceId) {
  const parent = resolve(dirname(projectRoot), '.kai-nightshift-worktrees');
  const path = resolve(parent, projectRoot.split(/[\\/]/).at(-1), runId, sliceId);
  if (!isWithin(parent, path)) fail('derived worktree path escapes Nightshift root');
  assertNoLinks(parent, path, 'Nightshift worktree path');
  return path;
}

function branchExists(projectRoot, name) {
  return git(projectRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${name}`], {
    allowFailure: true,
  }).status === 0;
}

function createWorktree(projectRoot, plan, slice, baseHead) {
  const path = worktreePath(projectRoot, plan.runId, slice.id);
  if (existsSync(path)) fail(`worktree path already exists: ${path}`);
  if (branchExists(projectRoot, slice.branch)) {
    fail(`branch already exists before slice execution: ${slice.branch}`);
  }
  mkdirSync(dirname(path), {recursive: true});
  git(projectRoot, ['worktree', 'add', '-b', slice.branch, path, baseHead]);
  return path;
}

function writeCapture(path, value) {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, typeof value === 'string' ? value : '', 'utf8');
}

export function redactSecrets(value, secretRefs, env = process.env) {
  let redacted = String(value ?? '');
  const values = secretRefs
    .map(name => [name, env[name]])
    .filter(([, secret]) => typeof secret === 'string' && secret.length > 0)
    .sort((left, right) => right[1].length - left[1].length);
  for (const [name, secret] of values) {
    redacted = redacted.split(secret).join(`[REDACTED:${name}]`);
  }
  return redacted;
}

function sessionEnvironment(env, plan) {
  const allowedSecrets = new Set(plan.permissions.secretRefs);
  const child = {};
  for (const [name, value] of Object.entries(env)) {
    if (name === 'COPILOT_AGENT_SESSION_ID') continue;
    if (/(?:TOKEN|SECRET|PASSWORD|CREDENTIAL|(?:^|_)KEY(?:_|$))/i.test(name)
      && !allowedSecrets.has(name)) {
      continue;
    }
    child[name] = value;
  }
  return child;
}

function parseResultOutput(stdout) {
  const text = String(stdout ?? '').trim();
  if (!text) fail('workflow session returned no JSON result');
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`workflow session result is not exact JSON: ${error.message}`);
  }
}

function failureResult(kind, summary, context, nextAction) {
  return {
    status: 'failed',
    summary,
    headSha: null,
    prUrl: null,
    evidence: [],
    suggestions: [],
    blocker: {
      kind,
      owner: 'operator',
      context,
      ask: nextAction,
      answerBy: 'before resuming this slice',
      questionRef: null,
    },
    nextAction,
  };
}

function baseForSlice(plan, ledger, slice) {
  if (slice.dependsOn.length === 0) {
    return {head: plan.base.sha, pullRequestBase: plan.base.branch};
  }
  const dependency = slice.dependsOn.at(-1);
  const state = ledger.slices[dependency];
  if (state?.status !== 'delivered' || !state.headSha) {
    fail(`slice ${slice.id} dependency ${dependency} is not delivered`);
  }
  const dependencySlice = plan.slices.find(candidate => candidate.id === dependency);
  return {head: state.headSha, pullRequestBase: dependencySlice.branch};
}

function runProfile({
  root,
  plan,
  slice,
  paths,
  worktree,
  profile,
  stage,
  prompt,
  aiCredits,
  env = process.env,
}) {
  const args = buildCopilotArgs({
    plan,
    slice,
    profile,
    prompt,
    aiCredits,
    workspaceRoot: root,
    env,
  });
  const timeout = Math.max(1, Date.parse(plan.deadline) - Date.now());
  const executable = env.KAI_COPILOT_EXECUTABLE || 'copilot';
  const childEnv = sessionEnvironment(env, plan);
  const child = spawnSync(executable, args, {
    cwd: worktree,
    env: {
      ...childEnv,
      KAI_WORKSPACE_ROOT: root,
      KAI_NIGHTSHIFT_RUN_ID: plan.runId,
      KAI_NIGHTSHIFT_SLICE_ID: slice.id,
      KAI_NIGHTSHIFT_STAGE: stage,
    },
    encoding: 'utf8',
    windowsHide: true,
    timeout,
    maxBuffer: MAX_CAPTURE_BYTES,
  });
  const stdoutPath = join(paths.evidence, `${slice.id}-${stage}-stdout.log`);
  const stderrPath = join(paths.evidence, `${slice.id}-${stage}-stderr.log`);
  const stdout = redactSecrets(child.stdout, plan.permissions.secretRefs, env);
  const stderr = redactSecrets(child.stderr, plan.permissions.secretRefs, env);
  writeCapture(stdoutPath, stdout);
  writeCapture(stderrPath, stderr);
  if (child.error || child.status !== 0) {
    const reason = child.error?.code === 'ETIMEDOUT'
      ? `${stage} session exceeded the approved deadline`
      : `${stage} session failed (${child.error?.code ?? `exit ${child.status}`})`;
    return {
      ok: false,
      stdoutPath,
      stderrPath,
      result: failureResult(
        child.error?.code === 'ETIMEDOUT' ? 'limit' : 'capability',
        reason,
        [
          `Observation: ${reason}.`,
          `Attempts: one bounded ${profile} session was launched for ${slice.id}.`,
          'Boundary: no successful exact JSON result was observed.',
          'Recommendation: inspect the private session logs and host capability.',
          `Resume point: preserved worktree ${worktree}.`,
        ].join('\n'),
        'Resolve the host failure and explicitly resume the slice.',
      ),
    };
  }
  return {
    ok: true,
    stdoutPath,
    stderrPath,
    raw: parseResultOutput(stdout),
  };
}

function invalidStageResult(error, {stage, stdoutPath, worktree, actualHead}) {
  return failureResult(
    'capability',
    error.message,
    [
      `Observation: ${error.message}.`,
      `Attempts: ${stage} output was captured at ${stdoutPath}.`,
      'Boundary: invalid or contradictory output cannot become delivery evidence.',
      'Recommendation: inspect the session and repair the exact result contract.',
      `Resume point: preserved worktree ${worktree} at ${actualHead}.`,
    ].join('\n'),
    'Resolve the invalid session result before resuming.',
  );
}

function runSession({
  root,
  projectRoot,
  plan,
  slice,
  paths,
  baseHead,
  pullRequestBase,
  aiCredits,
  env = process.env,
}) {
  const worktree = createWorktree(projectRoot, plan, slice, baseHead);
  const profiles = profilesForSlice(slice);
  const stageCredits = aiCredits / profiles.length;
  const basis = {baseHead, pullRequestBase};

  const builder = runProfile({
    root,
    plan,
    slice,
    paths,
    worktree,
    profile: profiles[0],
    stage: 'build',
    prompt: builderPrompt(plan, slice, basis),
    aiCredits: stageCredits,
    env,
  });
  let actualHead = gitText(worktree, ['rev-parse', 'HEAD']);
  let clean = gitText(worktree, ['status', '--porcelain']) === '';
  if (!builder.ok) {
    return {worktree, actualHead, clean, result: builder.result};
  }
  let builderResult;
  try {
    builderResult = validateStageResult(builder.raw, {
      actualHead,
      baseHead,
      clean,
      requireChange: true,
      label: 'builder result',
    });
  } catch (error) {
    return {
      worktree,
      actualHead,
      clean,
      result: invalidStageResult(error, {
        stage: 'builder',
        stdoutPath: builder.stdoutPath,
        worktree,
        actualHead,
      }),
    };
  }
  if (builderResult.status !== 'completed') {
    return {worktree, actualHead, clean, result: stageAsSliceResult(builderResult)};
  }

  const delivery = runProfile({
    root,
    plan,
    slice,
    paths,
    worktree,
    profile: DELIVERY_PROFILE,
    stage: 'delivery',
    prompt: deliveryPrompt(plan, slice, basis, builderResult),
    aiCredits: stageCredits,
    env,
  });
  actualHead = gitText(worktree, ['rev-parse', 'HEAD']);
  clean = gitText(worktree, ['status', '--porcelain']) === '';
  if (!delivery.ok) {
    return {worktree, actualHead, clean, result: delivery.result};
  }
  let deliveryResult;
  try {
    deliveryResult = validateSliceResult(delivery.raw, {baseHead, actualHead, clean});
  } catch (error) {
    return {
      worktree,
      actualHead,
      clean,
      result: invalidStageResult(error, {
        stage: 'delivery',
        stdoutPath: delivery.stdoutPath,
        worktree,
        actualHead,
      }),
    };
  }
  if (deliveryResult.status !== 'delivered' || !slice.reviewRequired) {
    return {worktree, actualHead, clean, result: deliveryResult};
  }

  const review = runProfile({
    root,
    plan,
    slice,
    paths,
    worktree,
    profile: REVIEW_PROFILE,
    stage: 'review',
    prompt: reviewPrompt(plan, slice, basis, deliveryResult),
    aiCredits: stageCredits,
    env,
  });
  actualHead = gitText(worktree, ['rev-parse', 'HEAD']);
  clean = gitText(worktree, ['status', '--porcelain']) === '';
  if (!review.ok) {
    return {worktree, actualHead, clean, result: review.result};
  }
  let reviewResult;
  try {
    reviewResult = validateStageResult(review.raw, {
      actualHead,
      baseHead: actualHead,
      clean,
      requireChange: false,
      label: 'review result',
    });
  } catch (error) {
    return {
      worktree,
      actualHead,
      clean,
      result: invalidStageResult(error, {
        stage: 'review',
        stdoutPath: review.stdoutPath,
        worktree,
        actualHead,
      }),
    };
  }
  if (reviewResult.status !== 'completed') {
    return {
      worktree,
      actualHead,
      clean,
      result: {
        ...stageAsSliceResult(reviewResult),
        prUrl: deliveryResult.prUrl,
      },
    };
  }
  return {
    worktree,
    actualHead,
    clean,
    result: {
      ...deliveryResult,
      evidence: [...deliveryResult.evidence, ...reviewResult.evidence],
      suggestions: [...deliveryResult.suggestions, ...reviewResult.suggestions],
      nextAction: reviewResult.nextAction,
    },
  };
}

function removeDeliveredWorktree(projectRoot, path) {
  git(projectRoot, ['worktree', 'remove', path]);
}

function terminalStatus(ledger) {
  const states = Object.values(ledger.slices).map(slice => slice.status);
  if (states.includes('failed')) return 'completed-with-failures';
  if (states.includes('blocked') || states.includes('skipped')) return 'completed-with-blockers';
  return 'completed';
}

function markSkipped(ledger, skipped, now) {
  for (const item of skipped) {
    const state = ledger.slices[item.id];
    if (state.status !== 'pending') continue;
    state.status = 'skipped';
    state.reason = item.reason;
    state.finishedAt = now;
  }
}

function skipPending(ledger, reason, now) {
  for (const state of Object.values(ledger.slices)) {
    if (state.status !== 'pending') continue;
    state.status = 'skipped';
    state.reason = reason;
    state.finishedAt = now;
  }
}

function retainedCount(ledger) {
  return Object.values(ledger.slices).filter(slice =>
    slice.worktree?.retained === true).length;
}

export function renderMorningReport(plan, ledger) {
  const safe = value => String(value ?? 'unavailable')
    .replace(/\r?\n/g, '<br>')
    .replace(/\|/g, '\\|');
  const rows = plan.slices.map(slice => ({
    slice,
    state: ledger.slices[slice.id],
  }));
  const deliveredRows = rows.filter(({state}) => state?.status === 'delivered')
    .map(({slice, state}) => {
      const evidence = state.result.evidence.length
        ? state.result.evidence.join('; ')
        : 'No reviewer-facing evidence reported';
      const deferred = state.result.suggestions.length
        ? state.result.suggestions.map(item => item.summary).join('; ')
        : 'None reported';
      return `| ${safe(state.result.prUrl)} | ${safe(slice.outcome)} | ${safe(evidence)} | ${safe(deferred)} |`;
    });
  const blockedRows = rows.filter(({state}) =>
    state && new Set(['blocked', 'failed']).has(state.status))
    .map(({slice, state}) => {
      const blocker = state.result?.blocker;
      const field = prefix => blocker?.context?.split(/\r?\n/)
        .find(line => line.startsWith(`${prefix}:`))?.slice(prefix.length + 1).trim()
        ?? 'unavailable';
      const recommendation = [
        field('Recommendation'),
        blocker?.ask ? `Decision: ${blocker.ask}` : null,
      ].filter(Boolean).join(' ');
      return `| ${safe(slice.task.id)} | ${safe(state.result?.summary ?? state.reason)} | `
        + `${safe(field('Boundary'))} | ${safe(blocker?.owner)} | `
        + `${safe(recommendation)} | ${safe(field('Resume point'))} |`;
    });
  const skippedRows = rows.filter(({state}) => state?.status === 'skipped')
    .map(({slice, state}) =>
      `| ${safe(slice.id)} | ${safe(state.reason)} | ${safe(slice.dependsOn.join(', ') || 'run limit')} | Re-evaluate during morning reconciliation |`);
  const suggestions = rows.flatMap(({slice, state}) =>
    (state?.result?.suggestions ?? []).map(item => ({slice, item})));
  const suggestionRows = suggestions.map(({item}) =>
    `| ${safe(item.summary)} | ${safe(item.basis)} | ${safe(item.whyDeferred)} | `
    + `${safe(item.benefit)} | ${safe(item.costRisk)} | ${safe(item.priority)} |`);
  const retained = rows.filter(({state}) => state?.worktree?.retained)
    .map(({state}) => state.worktree.path);

  return `# Nightshift ${plan.runId}

## Goal and approved scope

${plan.direction.goal}

- Subject: ${plan.subject.id} version ${plan.subject.version}
- Base: ${plan.base.remote}/${plan.base.branch} at ${plan.base.sha}
- Deadline: ${plan.deadline}
- Planned slices: ${plan.slices.length}

## Delivered pull requests

| PR | Required outcome | Evidence | Intentionally not done |
| --- | --- | --- | --- |
${deliveredRows.length ? deliveredRows.join('\n') : '| None | - | - | - |'}

## Blocked work

| Task/PR | What stopped | Why unsafe to continue | Decision owner | Recommended action | Resume point |
| --- | --- | --- | --- | --- | --- |
${blockedRows.length ? blockedRows.join('\n') : '| None | - | - | - | - | - |'}

## Skipped work

| Slice | Reason | Dependency or limit | Next action |
| --- | --- | --- | --- |
${skippedRows.length ? skippedRows.join('\n') : '| None | - | - | - |'}

## Suggestions for the morning

| Suggestion | Evidence or basis | Why deferred | Benefit | Cost/risk | Suggested priority |
| --- | --- | --- | --- | --- | --- |
${suggestionRows.length ? suggestionRows.join('\n') : '| None | - | - | - | - | - |'}

## Run limits

- Status: ${safe(ledger.status)}
- Started: ${safe(ledger.startedAt)}
- Finished: ${safe(ledger.finishedAt)}
- Terminal reason: ${safe(ledger.terminalReason)}
- Pull requests: ${rows.filter(({state}) => state?.status === 'delivered').length}/${plan.limits.maxPullRequests}
- AI credits: ${ledger.observedAiCredits === null ? 'unavailable' : safe(ledger.observedAiCredits)} (approved soft ceiling ${plan.limits.maxAiCredits})
- Retained worktrees: ${retained.length ? retained.map(safe).join(', ') : 'none'}
`;
}

function writeReport(paths, plan, ledger) {
  const report = renderMorningReport(plan, ledger);
  atomicWrite(paths.report, report);
  return report;
}

export function reportRun({root, runId}) {
  const {plan, ledger, paths} = loadRun(root, runId);
  return {report: writeReport(paths, plan, ledger), plan, ledger, paths};
}

export function executeRun({
  root,
  runId,
  env = process.env,
  now = () => new Date(),
  runSlice = runSession,
  removeWorktree = removeDeliveredWorktree,
  verifyRunBasis = verifyBasis,
}) {
  const loaded = loadRun(root, runId);
  const {plan, paths, projectRoot} = loaded;
  const ledger = loaded.ledger;
  if (new Set(['completed', 'completed-with-blockers', 'completed-with-failures']).has(ledger.status)) {
    writeReport(paths, plan, ledger);
    return {plan, ledger, paths};
  }
  if (ledger.status === 'prepared') {
    ledger.status = 'running';
    ledger.startedAt = now().toISOString();
    writeLedger(paths.ledger, ledger);
  } else if (ledger.status !== 'running') {
    fail(`Nightshift run cannot execute from ledger status ${ledger.status}`);
  }

  const sliceCredits = plan.limits.maxAiCredits / Math.min(
    plan.slices.length,
    plan.limits.maxPullRequests,
  );
  while (true) {
    verifyRunBasis(projectRoot, plan);
    const classified = classifySlices(plan, ledger);
    markSkipped(ledger, classified.skipped, now().toISOString());
    writeLedger(paths.ledger, ledger);

    const launchedCount = Object.values(ledger.slices)
      .filter(slice => new Set(['delivered', 'blocked', 'failed']).has(slice.status)).length;
    if (launchedCount >= plan.limits.maxPullRequests) {
      ledger.terminalReason = 'pull-request/launch limit reached';
      skipPending(ledger, ledger.terminalReason, now().toISOString());
      break;
    }
    if (Date.now() >= Date.parse(plan.deadline)) {
      ledger.terminalReason = 'deadline reached';
      skipPending(ledger, ledger.terminalReason, now().toISOString());
      break;
    }
    if (retainedCount(ledger) > 0
      && retainedCount(ledger) >= plan.limits.maxRetainedWorktrees) {
      ledger.terminalReason = 'retained-worktree limit reached';
      skipPending(ledger, ledger.terminalReason, now().toISOString());
      break;
    }
    const refreshed = classifySlices(plan, ledger);
    if (refreshed.ready.length === 0) {
      ledger.terminalReason = 'no safe ready slices remain';
      break;
    }

    const slice = refreshed.ready[0];
    const state = ledger.slices[slice.id];
    const base = baseForSlice(plan, ledger, slice);
    state.status = 'running';
    state.baseHead = base.head;
    state.startedAt = now().toISOString();
    writeLedger(paths.ledger, ledger);

    let observed;
    try {
      observed = runSlice({
        root: resolve(root),
        projectRoot,
        plan,
        slice,
        paths,
        baseHead: base.head,
        pullRequestBase: base.pullRequestBase,
        aiCredits: sliceCredits,
        env,
      });
    } catch (error) {
      state.status = 'failed';
      state.finishedAt = now().toISOString();
      state.reason = error.message;
      const candidate = worktreePath(projectRoot, plan.runId, slice.id);
      if (existsSync(candidate)) state.worktree = {path: candidate, retained: true};
      state.result = failureResult(
        'capability',
        error.message,
        [
          `Observation: ${error.message}.`,
          'Attempts: Nightshift attempted to prepare or launch the slice once.',
          'Boundary: the runner cannot prove a safe executable environment.',
          'Recommendation: resolve the host or Git failure before resuming.',
          'Resume point: no successful workflow result was observed.',
        ].join('\n'),
        'Resolve the runner failure before resuming.',
      );
      writeLedger(paths.ledger, ledger);
      continue;
    }

    state.headSha = observed.actualHead;
    state.result = observed.result;
    state.status = observed.result.status;
    state.finishedAt = now().toISOString();
    state.worktree = {
      path: observed.worktree,
      retained: observed.result.status !== 'delivered',
    };
    if (observed.result.status === 'delivered') {
      removeWorktree(projectRoot, observed.worktree);
      state.worktree.retained = false;
    }
    writeLedger(paths.ledger, ledger);
  }

  ledger.status = terminalStatus(ledger);
  ledger.finishedAt = now().toISOString();
  ledger.terminalReason ??= 'all approved slices reached terminal state';
  writeLedger(paths.ledger, ledger);
  writeReport(paths, plan, ledger);
  return {plan, ledger, paths};
}

function arg(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1] ?? null;
}

function usage() {
  return [
    'usage:',
    '  nightshift.mjs prepare --root <workspace> --plan <file>',
    '  nightshift.mjs run --root <workspace> --run-id <id>',
    '  nightshift.mjs report --root <workspace> --run-id <id>',
    '  nightshift.mjs status --root <workspace> --run-id <id>',
  ].join('\n');
}

export async function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  if (command === '--help' || command === '-h' || command === 'help') {
    console.log(usage());
    return 0;
  }
  const root = arg(argv, '--root');
  if (!command || !root) fail(usage());
  if (command === 'prepare') {
    const planPath = arg(argv, '--plan');
    if (!planPath) fail(usage());
    const result = prepareRun({root, plan: readJson(resolve(planPath), 'approved plan')});
    console.log(JSON.stringify({
      runId: result.plan.runId,
      created: result.created,
      status: result.ledger.status,
      runRoot: result.paths.runRoot,
    }, null, 2));
    return 0;
  }
  const runId = arg(argv, '--run-id');
  if (!runId) fail(usage());
  if (command === 'run') {
    const result = executeRun({root, runId});
    console.log(JSON.stringify({
      runId,
      status: result.ledger.status,
      terminalReason: result.ledger.terminalReason,
      report: result.paths.report,
    }, null, 2));
    return result.ledger.status === 'completed-with-failures' ? 1 : 0;
  }
  if (command === 'report') {
    const result = reportRun({root, runId});
    console.log(result.paths.report);
    return 0;
  }
  if (command === 'status') {
    const {ledger} = loadRun(root, runId);
    console.log(JSON.stringify(ledger, null, 2));
    return 0;
  }
  fail(usage());
}

const entry = process.argv[1] ? resolve(process.argv[1]) : null;
if (entry === fileURLToPath(import.meta.url)) {
  main().then(
    code => {
      process.exitCode = code;
    },
    error => {
      console.error(`Nightshift: ${error.message}`);
      process.exitCode = 1;
    },
  );
}

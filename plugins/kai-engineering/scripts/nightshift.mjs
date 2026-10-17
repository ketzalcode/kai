#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);

// src/engineering/nightshift.mjs
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { delimiter, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
var PLAN_KEYS = /* @__PURE__ */ new Set([
  "schemaVersion",
  "runId",
  "approvedAt",
  "deadline",
  "projectId",
  "goal",
  "tasks",
  "planningProjection",
  "base",
  "limits",
  "permissions",
  "stacking",
  "evidenceExpectations"
]);
var SLICE_KEYS = /* @__PURE__ */ new Set([
  "id",
  "task",
  "outcome",
  "acceptance",
  "touches",
  "completionCheck",
  "route",
  "reviewRequired",
  "branch",
  "baseHead",
  "pullRequestBase"
]);
var RESULT_KEYS = /* @__PURE__ */ new Set([
  "status",
  "summary",
  "headSha",
  "prUrl",
  "evidence",
  "suggestions",
  "blocker",
  "nextAction"
]);
var SUGGESTION_KEYS = /* @__PURE__ */ new Set([
  "summary",
  "basis",
  "whyDeferred",
  "benefit",
  "costRisk",
  "priority"
]);
var BLOCKER_KEYS = /* @__PURE__ */ new Set([
  "kind",
  "owner",
  "context",
  "ask",
  "answerBy",
  "questionRef"
]);
var NIGHTSHIFT_DECISION_KEYS = /* @__PURE__ */ new Set([
  "status",
  "summary",
  "slice",
  "blocker",
  "nextAction"
]);
var RESULT_STATUSES = /* @__PURE__ */ new Set(["delivered", "blocked", "failed"]);
var STAGE_RESULT_KEYS = /* @__PURE__ */ new Set([
  "status",
  "summary",
  "headSha",
  "evidence",
  "suggestions",
  "blocker",
  "nextAction"
]);
var STAGE_STATUSES = /* @__PURE__ */ new Set(["completed", "blocked", "failed"]);
var BLOCKER_KINDS = /* @__PURE__ */ new Set([
  "fact",
  "decision",
  "action",
  "capability",
  "collision",
  "limit"
]);
var NIGHTSHIFT_STATUSES = /* @__PURE__ */ new Set(["slice", "complete", "blocked"]);
var SAFE_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;
var PROJECT_ID = /^[a-z][a-z0-9-]*$/;
var TYPED_TASK_ID = /^engineering:task:[a-z0-9][a-z0-9-]*$/;
var FULL_SHA = /^[0-9a-f]{40}$/;
var BRANCH = /^kai\/(?:feat|fix|docs|refactor|chore)\/[a-z0-9][a-z0-9-]*$/;
var SECRET_REF = /^[A-Z][A-Z0-9_]*$/;
var MAX_CAPTURE_BYTES = 16 * 1024 * 1024;
var ROUTE_BUILDERS = Object.freeze({
  frontend: "eng-builder-frontend",
  backend: "eng-builder-backend"
});
var DELIVERY_PROFILE = "eng-lead-software";
var REVIEW_PROFILE = "eng-reviewer-code";
var DECISION_PROFILE = "eng-nightshift";
function fail(message) {
  throw new Error(message);
}
function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
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
  if (typeof value !== "string" || !value.trim() || /[\0]/.test(value)) {
    fail(`${label} must be a non-empty string`);
  }
  return value.trim();
}
function optionalString(value, label) {
  if (value === null) return null;
  return string(value, label);
}
function integer(value, label, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    fail(`${label} must be an integer from ${min} through ${max}`);
  }
  return value;
}
function finite(value, label, { min = 0, max = Number.MAX_VALUE } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    fail(`${label} must be a finite number from ${min} through ${max}`);
  }
  return value;
}
function timestamp(value, label) {
  const parsed = Date.parse(string(value, label));
  if (!Number.isFinite(parsed)) fail(`${label} must be an ISO timestamp`);
  return new Date(parsed).toISOString();
}
function strings(value, label, { nonEmpty = false, pattern = null } = {}) {
  if (!Array.isArray(value) || nonEmpty && value.length === 0) {
    fail(`${label} must be ${nonEmpty ? "a non-empty" : "an"} array`);
  }
  const normalized = value.map((entry2, index) => {
    const item = string(entry2, `${label}[${index}]`);
    if (pattern && !pattern.test(item)) fail(`${label}[${index}] is invalid`);
    return item;
  });
  if (new Set(normalized).size !== normalized.length) fail(`${label} contains duplicates`);
  return normalized;
}
function positiveVersion(value, label) {
  return integer(value, label, { min: 1 });
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
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    fail(`${label} must be an HTTPS URL without credentials`);
  }
  return parsed.toString().replace(/\/$/, "");
}
function branch(value, label) {
  value = string(value, label);
  if (!BRANCH.test(value)) {
    fail(`${label} must use kai/<type>/<anchor>-<slug> with a supported type`);
  }
  return value;
}
function safeRelative(value, label) {
  value = string(value, label).replaceAll("\\", "/").replace(/^\.\//, "");
  if (value.startsWith("/") || value.split("/").some((part) => !part || part === "." || part === ".." || /[\0\r\n]/.test(part))) {
    fail(`${label} must be a safe repository-relative path`);
  }
  return value;
}
function normalizeSlice(raw, index) {
  const label = `slices[${index}]`;
  exactKeys(raw, SLICE_KEYS, label);
  exactKeys(raw.task, /* @__PURE__ */ new Set(["id", "version"]), `${label}.task`);
  const taskId = string(raw.task.id, `${label}.task.id`);
  if (!TYPED_TASK_ID.test(taskId)) fail(`${label}.task.id must be an engineering Task ID`);
  const route = string(raw.route, `${label}.route`);
  if (!Object.hasOwn(ROUTE_BUILDERS, route)) {
    fail(`${label}.route must be "frontend" or "backend"`);
  }
  if (typeof raw.reviewRequired !== "boolean") {
    fail(`${label}.reviewRequired must be boolean`);
  }
  return {
    id: safeId(raw.id, `${label}.id`),
    task: {
      id: taskId,
      version: positiveVersion(raw.task.version, `${label}.task.version`)
    },
    outcome: string(raw.outcome, `${label}.outcome`),
    acceptance: strings(raw.acceptance, `${label}.acceptance`, { nonEmpty: true }),
    touches: strings(raw.touches, `${label}.touches`, { nonEmpty: true }).map((entry2, touchIndex) => safeRelative(entry2, `${label}.touches[${touchIndex}]`)),
    completionCheck: string(raw.completionCheck, `${label}.completionCheck`),
    route,
    reviewRequired: raw.reviewRequired,
    branch: branch(raw.branch, `${label}.branch`),
    baseHead: fullSha(raw.baseHead, `${label}.baseHead`),
    pullRequestBase: string(raw.pullRequestBase, `${label}.pullRequestBase`)
  };
}
function profilesForSlice(slice) {
  const builder = ROUTE_BUILDERS[slice.route];
  if (!builder) fail(`slice route ${slice.route ?? "(missing)"} is unsupported`);
  return [
    builder,
    DELIVERY_PROFILE,
    ...slice.reviewRequired ? [REVIEW_PROFILE] : []
  ];
}
function validatePlan(raw) {
  exactKeys(raw, PLAN_KEYS, "plan");
  if (raw.schemaVersion !== 1) fail("plan.schemaVersion must be 1");
  const approvedAt = timestamp(raw.approvedAt, "plan.approvedAt");
  const deadline = timestamp(raw.deadline, "plan.deadline");
  if (Date.parse(deadline) <= Date.parse(approvedAt)) {
    fail("plan.deadline must be after plan.approvedAt");
  }
  const projectId = string(raw.projectId, "plan.projectId");
  if (!PROJECT_ID.test(projectId)) fail("plan.projectId must be kebab-case");
  exactKeys(raw.goal, /* @__PURE__ */ new Set(["outcome", "acceptance"]), "plan.goal");
  const goal = {
    outcome: string(raw.goal.outcome, "plan.goal.outcome"),
    acceptance: strings(raw.goal.acceptance, "plan.goal.acceptance", { nonEmpty: true })
  };
  if (!Array.isArray(raw.tasks) || raw.tasks.length === 0) {
    fail("plan.tasks must be a non-empty array");
  }
  const tasks = raw.tasks.map((task, index) => {
    exactKeys(task, /* @__PURE__ */ new Set(["id", "version"]), `plan.tasks[${index}]`);
    const id = string(task.id, `plan.tasks[${index}].id`);
    if (!TYPED_TASK_ID.test(id)) fail(`plan.tasks[${index}].id must be an engineering Task ID`);
    return { id, version: positiveVersion(task.version, `plan.tasks[${index}].version`) };
  });
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) {
    fail("plan.tasks contains duplicate Task IDs");
  }
  let planningProjection = null;
  if (raw.planningProjection !== null) {
    exactKeys(
      raw.planningProjection,
      /* @__PURE__ */ new Set(["summary", "references"]),
      "plan.planningProjection"
    );
    planningProjection = {
      summary: string(raw.planningProjection.summary, "plan.planningProjection.summary"),
      references: strings(
        raw.planningProjection.references,
        "plan.planningProjection.references",
        { nonEmpty: true }
      )
    };
  }
  exactKeys(raw.base, /* @__PURE__ */ new Set(["remote", "branch", "sha"]), "plan.base");
  const remote = string(raw.base.remote, "plan.base.remote");
  if (!/^[A-Za-z0-9._-]+$/.test(remote)) fail("plan.base.remote is invalid");
  const baseBranch = string(raw.base.branch, "plan.base.branch");
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(baseBranch) || baseBranch.includes("..") || baseBranch.endsWith("/")) {
    fail("plan.base.branch is invalid");
  }
  exactKeys(raw.limits, /* @__PURE__ */ new Set([
    "maxPullRequests",
    "maxAiCredits",
    "maxAutopilotContinues",
    "maxRetainedWorktrees"
  ]), "plan.limits");
  exactKeys(raw.permissions, /* @__PURE__ */ new Set([
    "push",
    "pullRequests",
    "allowedUrls",
    "secretRefs"
  ]), "plan.permissions");
  if (typeof raw.permissions.push !== "boolean" || typeof raw.permissions.pullRequests !== "boolean") {
    fail("plan permissions must use booleans");
  }
  if (typeof raw.stacking !== "boolean") fail("plan.stacking must be boolean");
  return {
    schemaVersion: 1,
    runId: safeId(raw.runId, "plan.runId"),
    approvedAt,
    deadline,
    projectId,
    goal,
    tasks,
    planningProjection,
    base: {
      remote,
      branch: baseBranch,
      sha: fullSha(raw.base.sha, "plan.base.sha")
    },
    limits: {
      maxPullRequests: integer(raw.limits.maxPullRequests, "plan.limits.maxPullRequests", {
        min: 1,
        max: 100
      }),
      maxAiCredits: raw.limits.maxAiCredits === null ? null : finite(raw.limits.maxAiCredits, "plan.limits.maxAiCredits", {
        min: 0.01,
        max: 1e6
      }),
      maxAutopilotContinues: integer(
        raw.limits.maxAutopilotContinues,
        "plan.limits.maxAutopilotContinues",
        { min: 1, max: 100 }
      ),
      maxRetainedWorktrees: integer(
        raw.limits.maxRetainedWorktrees,
        "plan.limits.maxRetainedWorktrees",
        { min: 0, max: 100 }
      )
    },
    permissions: {
      push: raw.permissions.push,
      pullRequests: raw.permissions.pullRequests,
      allowedUrls: strings(raw.permissions.allowedUrls, "plan.permissions.allowedUrls").map((entry2, index) => validUrl(entry2, `plan.permissions.allowedUrls[${index}]`)),
      secretRefs: strings(raw.permissions.secretRefs, "plan.permissions.secretRefs", {
        pattern: SECRET_REF
      })
    },
    stacking: raw.stacking,
    evidenceExpectations: strings(
      raw.evidenceExpectations,
      "plan.evidenceExpectations",
      { nonEmpty: true }
    )
  };
}
function terminalSliceEvents(events) {
  return events.filter((entry2) => (/* @__PURE__ */ new Set([
    "slice.delivered",
    "slice.blocked",
    "slice.failed"
  ])).has(entry2.type));
}
function validateNightshiftDecision(raw, { plan, events }) {
  exactKeys(raw, NIGHTSHIFT_DECISION_KEYS, "Nightshift decision");
  const status = string(raw.status, "Nightshift decision.status");
  if (!NIGHTSHIFT_STATUSES.has(status)) fail("Nightshift decision.status is unsupported");
  const normalized = {
    status,
    summary: string(raw.summary, "Nightshift decision.summary"),
    slice: raw.slice === null ? null : normalizeSlice(raw.slice, 0),
    blocker: raw.blocker === null ? null : blockerResult(raw.blocker, "Nightshift decision.blocker"),
    nextAction: string(raw.nextAction, "Nightshift decision.nextAction")
  };
  if (status === "slice") {
    if (!normalized.slice) fail("slice Nightshift decision requires one slice");
    if (normalized.blocker !== null) fail("slice Nightshift decision blocker must be null");
    if (!plan.tasks.some((task) => task.id === normalized.slice.task.id && task.version === normalized.slice.task.version)) {
      fail("Nightshift decision slice Task is outside the approved bounded Task set");
    }
    const prior = terminalSliceEvents(events);
    if (prior.some((entry2) => entry2.payload.slice.id === normalized.slice.id)) {
      fail(`Nightshift decision repeats slice ID ${normalized.slice.id}`);
    }
    if (prior.some((entry2) => entry2.payload.slice.branch.toLowerCase() === normalized.slice.branch.toLowerCase())) {
      fail(`Nightshift decision repeats branch ${normalized.slice.branch}`);
    }
    const delivered = prior.filter((entry2) => entry2.type === "slice.delivered");
    const allowed = new Map([
      [plan.base.sha, plan.base.branch],
      ...delivered.map((entry2) => [
        entry2.payload.result.headSha,
        entry2.payload.slice.branch
      ])
    ]);
    if (!allowed.has(normalized.slice.baseHead)) {
      fail("Nightshift decision slice.baseHead is neither the approved base nor a delivered head");
    }
    if (normalized.slice.baseHead !== plan.base.sha && !plan.stacking) {
      fail("Nightshift decision requires stacking permission for a delivered-head base");
    }
    if (allowed.get(normalized.slice.baseHead) !== normalized.slice.pullRequestBase) {
      fail("Nightshift decision slice.pullRequestBase does not match its base head");
    }
  } else {
    if (normalized.slice !== null) fail(`${status} Nightshift decision slice must be null`);
    if (status === "complete" && normalized.blocker !== null) {
      fail("complete Nightshift decision blocker must be null");
    }
    if (status === "blocked" && normalized.blocker === null) {
      fail("blocked Nightshift decision requires blocker details");
    }
  }
  return normalized;
}
function suggestion(raw, label) {
  exactKeys(raw, SUGGESTION_KEYS, label);
  return {
    summary: string(raw.summary, `${label}.summary`),
    basis: string(raw.basis, `${label}.basis`),
    whyDeferred: string(raw.whyDeferred, `${label}.whyDeferred`),
    benefit: string(raw.benefit, `${label}.benefit`),
    costRisk: string(raw.costRisk, `${label}.costRisk`),
    priority: string(raw.priority, `${label}.priority`)
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
    questionRef: optionalString(raw.questionRef, `${label}.questionRef`)
  };
}
function validateSliceResult(raw, {
  baseHead,
  actualHead,
  clean
} = {}) {
  exactKeys(raw, RESULT_KEYS, "result");
  const status = string(raw.status, "result.status");
  if (!RESULT_STATUSES.has(status)) fail("result.status is unsupported");
  const headSha = raw.headSha === null ? null : fullSha(raw.headSha, "result.headSha");
  const prUrl = raw.prUrl === null ? null : validUrl(raw.prUrl, "result.prUrl");
  if (prUrl !== null && !/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(prUrl)) {
    fail("result.prUrl must be a GitHub pull request URL");
  }
  if (!Array.isArray(raw.suggestions)) fail("result.suggestions must be an array");
  const normalized = {
    status,
    summary: string(raw.summary, "result.summary"),
    headSha,
    prUrl,
    evidence: strings(raw.evidence, "result.evidence"),
    suggestions: raw.suggestions.map((entry2, index) => suggestion(entry2, `result.suggestions[${index}]`)),
    blocker: raw.blocker === null ? null : blockerResult(raw.blocker, "result.blocker"),
    nextAction: string(raw.nextAction, "result.nextAction")
  };
  if (status === "delivered") {
    if (normalized.blocker !== null) fail("delivered result.blocker must be null");
    if (!normalized.prUrl) fail("delivered result requires a pull request URL in prUrl");
    if (!normalized.headSha) fail("delivered result requires headSha");
    if (clean !== true) fail("delivered result requires a clean worktree");
    if (normalized.headSha !== actualHead) {
      fail("delivered result headSha does not match actual worktree HEAD");
    }
    if (normalized.headSha === baseHead) fail("delivered result must differ from its base head");
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
  label
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
    suggestions: raw.suggestions.map((entry2, index) => suggestion(entry2, `${label}.suggestions[${index}]`)),
    blocker: raw.blocker === null ? null : blockerResult(raw.blocker, `${label}.blocker`),
    nextAction: string(raw.nextAction, `${label}.nextAction`)
  };
  if (status === "completed") {
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
  if (stage.status === "completed") fail("completed stage cannot become a terminal slice result");
  return {
    status: stage.status,
    summary: stage.summary,
    headSha: stage.headSha,
    prUrl: null,
    evidence: stage.evidence,
    suggestions: stage.suggestions,
    blocker: stage.blocker,
    nextAction: stage.nextAction
  };
}
function runPaths(root, runId) {
  const safeRunId = safeId(runId, "run ID");
  const runRelative = join(".kai", "engineering", "reports", "nightshift", safeRunId);
  const runRoot = resolve(root, runRelative);
  return {
    runRelative,
    runRoot,
    drafts: join(runRoot, "drafts"),
    evidence: join(runRoot, "evidence"),
    scratch: join(runRoot, "scratch"),
    plan: join(runRoot, "drafts", "plan.json"),
    events: join(runRoot, "evidence", "events.jsonl"),
    report: join(runRoot, "drafts", "report.md")
  };
}
function canonical(value) {
  return `${JSON.stringify(value, null, 2)}
`;
}
function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${label} is not readable JSON: ${error.message}`);
  }
}
function isWithin(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  return rel === "" || rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}
function pathKey(path) {
  const normalized = resolve(path).replaceAll("\\", "/");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
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
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, bytes, { flag: "wx" });
  try {
    renameSync(temp, path);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
}
var EVENT_TYPES = /* @__PURE__ */ new Set([
  "run.prepared",
  "nightshift.decided",
  "slice.started",
  "slice.delivered",
  "slice.blocked",
  "slice.failed",
  "run.completed",
  "run.blocked",
  "run.stopped"
]);
function readEvents(path, runId) {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8");
  if (!text.trim()) return [];
  return text.trimEnd().split(/\r?\n/).map((line, index) => {
    let event;
    try {
      event = JSON.parse(line);
    } catch (error) {
      fail(`Nightshift event ${index + 1} is not valid JSON: ${error.message}`);
    }
    exactKeys(event, /* @__PURE__ */ new Set([
      "schemaVersion",
      "eventId",
      "runId",
      "sequence",
      "type",
      "at",
      "payload"
    ]), `event[${index}]`);
    if (event.schemaVersion !== 1) fail(`event[${index}].schemaVersion must be 1`);
    if (event.runId !== runId) fail(`event[${index}] belongs to another run`);
    if (event.sequence !== index + 1) fail(`event[${index}] has a non-contiguous sequence`);
    if (!/^[0-9a-f-]{36}$/i.test(event.eventId)) fail(`event[${index}].eventId is invalid`);
    if (!EVENT_TYPES.has(event.type)) fail(`event[${index}].type is unsupported`);
    timestamp(event.at, `event[${index}].at`);
    object(event.payload, `event[${index}].payload`);
    return event;
  });
}
function appendRunEvent({
  path,
  runId,
  type,
  payload,
  at = (/* @__PURE__ */ new Date()).toISOString()
}) {
  if (!EVENT_TYPES.has(type)) fail(`Nightshift event type ${type} is unsupported`);
  const events = readEvents(path, runId);
  const event = {
    schemaVersion: 1,
    eventId: randomUUID(),
    runId,
    sequence: events.length + 1,
    type,
    at: timestamp(at, "event.at"),
    payload: object(payload, "event.payload")
  };
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(event)}
`, { encoding: "utf8", flag: "a" });
  return event;
}
function foldEvents(plan, events) {
  const state = {
    runId: plan.runId,
    status: "prepared",
    startedAt: events[0]?.at ?? null,
    finishedAt: null,
    terminalReason: null,
    observedAiCredits: null,
    slices: []
  };
  for (const event of events) {
    if (event.type === "slice.started") {
      state.slices.push({
        slice: event.payload.slice,
        status: "running",
        result: null,
        worktree: event.payload.worktree
      });
      state.status = "running";
      continue;
    }
    if (event.type.startsWith("slice.") && event.type !== "slice.started") {
      let sliceState = state.slices.find((entry2) => entry2.slice.id === event.payload.slice.id);
      if (!sliceState) {
        sliceState = { slice: event.payload.slice };
        state.slices.push(sliceState);
      }
      sliceState.status = event.type.slice("slice.".length);
      sliceState.result = event.payload.result;
      sliceState.worktree = event.payload.worktree;
      continue;
    }
    if (event.type === "run.completed" || event.type === "run.blocked" || event.type === "run.stopped") {
      const statuses = state.slices.map((entry2) => entry2.status);
      state.status = statuses.includes("failed") ? "completed-with-failures" : statuses.includes("blocked") || event.type !== "run.completed" ? "completed-with-blockers" : "completed";
      state.finishedAt = event.at;
      state.terminalReason = event.payload.reason;
    }
  }
  return state;
}
function git(root, args, { allowFailure = false } = {}) {
  const result = spawnSync("git", ["--no-pager", "-C", root, ...args], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: MAX_CAPTURE_BYTES,
    env: Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)))
  });
  if (!allowFailure && (result.error || result.status !== 0)) {
    fail(`git ${args[0]} failed: ${result.error?.message ?? result.stderr.trim() ?? `exit ${result.status}`}`);
  }
  return result;
}
function gitText(root, args) {
  return git(root, args).stdout.trim();
}
function workspace(root, plan, { verifyCurrentBase = false } = {}) {
  root = resolve(root);
  if (!existsSync(root)) fail(`workspace root does not exist: ${root}`);
  if (!samePath(realpathSync(root), root)) fail("workspace root must use its exact physical path");
  const manifestPath = join(root, ".kai", "manifest.json");
  if (!existsSync(manifestPath) || lstatSync(manifestPath).isSymbolicLink()) {
    fail("Nightshift requires an exact schema-6 .kai/manifest.json");
  }
  const manifest = readJson(manifestPath, ".kai/manifest.json");
  if (manifest.schema_version !== 6) fail("Nightshift requires workspace schema 6");
  const project = manifest.projects?.find((entry2) => entry2.id === plan.projectId);
  if (!project) fail(`workspace has no project binding "${plan.projectId}"`);
  const projectRoot = manifest.placement === "repo-local" ? resolve(root, project.path) : resolve(project.path);
  if (!existsSync(projectRoot) || !samePath(realpathSync(projectRoot), projectRoot)) {
    fail("Nightshift project root must be an exact existing physical path");
  }
  if (!samePath(gitText(projectRoot, ["rev-parse", "--show-toplevel"]), projectRoot)) {
    fail("Nightshift project binding must itself be the Git root");
  }
  if (manifest.placement === "repo-local") {
    const trackedPrivate = gitText(projectRoot, ["ls-files", "--", ".kai"]);
    if (trackedPrivate) fail("Nightshift refuses tracked .kai workspace state");
    const ignoredPrivate = git(projectRoot, [
      "check-ignore",
      "--quiet",
      "--no-index",
      ".kai/engineering/reports/nightshift/.probe"
    ], { allowFailure: true });
    if (ignoredPrivate.status !== 0) {
      fail("Nightshift requires the private .kai tree to be ignored");
    }
  }
  const baseObject = gitText(projectRoot, ["rev-parse", "--verify", `${plan.base.sha}^{commit}`]);
  if (baseObject !== plan.base.sha) fail("approved base commit does not resolve exactly");
  if (verifyCurrentBase) verifyBasis(projectRoot, plan);
  return { root, manifest, project, projectRoot };
}
function verifyBase(projectRoot, plan) {
  const resolved = gitText(projectRoot, ["rev-parse", "--verify", `${plan.base.sha}^{commit}`]);
  if (resolved !== plan.base.sha) fail("approved base commit does not resolve exactly");
  const remoteRef = `refs/remotes/${plan.base.remote}/${plan.base.branch}`;
  const remote = git(projectRoot, ["rev-parse", "--verify", remoteRef], { allowFailure: true });
  if (remote.status !== 0) fail(`approved base ref ${remoteRef} is unavailable; fetch it before Nightshift`);
  if (remote.stdout.trim() !== plan.base.sha) {
    fail(`approved base drifted: ${remoteRef} no longer matches ${plan.base.sha}`);
  }
}
function verifyBasis(projectRoot, plan) {
  verifyBase(projectRoot, plan);
}
function prepareRun({ root, plan: rawPlan }) {
  const plan = validatePlan(rawPlan);
  workspace(root, plan, { verifyCurrentBase: true });
  const paths = runPaths(root, plan.runId);
  assertNoLinks(resolve(root, ".kai"), paths.runRoot, "Nightshift run path");
  mkdirSync(paths.drafts, { recursive: true });
  mkdirSync(paths.evidence, { recursive: true });
  mkdirSync(paths.scratch, { recursive: true });
  if (existsSync(paths.plan)) {
    const existing = validatePlan(readJson(paths.plan, "retained Nightshift plan"));
    if (canonical(existing) !== canonical(plan)) {
      fail(`Nightshift run ${plan.runId} already has a different immutable plan`);
    }
    const events2 = readEvents(paths.events, plan.runId);
    if (events2.length === 0) fail("retained Nightshift plan has no event history");
    return { plan, events: events2, state: foldEvents(plan, events2), paths, created: false };
  }
  atomicWrite(paths.plan, canonical(plan));
  appendRunEvent({
    path: paths.events,
    runId: plan.runId,
    type: "run.prepared",
    payload: { summary: "Nightshift admission approved" },
    at: plan.approvedAt
  });
  const events = readEvents(paths.events, plan.runId);
  return { plan, events, state: foldEvents(plan, events), paths, created: true };
}
function loadRun(root, runId) {
  const paths = runPaths(root, runId);
  if (!existsSync(paths.plan) || !existsSync(paths.events)) {
    fail(`Nightshift run ${runId} is not prepared`);
  }
  const plan = validatePlan(readJson(paths.plan, "Nightshift plan"));
  if (plan.runId !== runId) fail("Nightshift plan run ID does not match its path");
  const events = readEvents(paths.events, runId);
  if (events.length === 0 || events[0].type !== "run.prepared") {
    fail("Nightshift event history is missing run.prepared");
  }
  const resolved = workspace(root, plan);
  return { plan, events, state: foldEvents(plan, events), paths, ...resolved };
}
function safePluginArguments(env = process.env) {
  const dirs = (env.KAI_COPILOT_PLUGIN_DIRS ?? "").split(delimiter).filter(Boolean);
  for (const path of dirs) {
    if (!isAbsolute(path) || !existsSync(path)) {
      fail("KAI_COPILOT_PLUGIN_DIRS must contain existing absolute plugin directories");
    }
  }
  return dirs.flatMap((path) => ["--plugin-dir", path]);
}
function buildCopilotArgs({
  plan,
  slice,
  profile,
  prompt,
  aiCredits,
  workspaceRoot = null,
  env = process.env
}) {
  if (aiCredits === null && plan.limits.maxAiCredits !== null) {
    fail("uncapped AI credits require explicit approval in plan.limits.maxAiCredits");
  }
  if (aiCredits !== null) finite(aiCredits, "aiCredits", { min: 1e-6 });
  const args = [
    "--agent",
    string(profile, "Copilot profile"),
    ...safePluginArguments(env),
    "--autopilot",
    "--no-ask-user",
    "--allow-all-tools",
    "--no-auto-update",
    "--max-autopilot-continues",
    String(plan.limits.maxAutopilotContinues)
  ];
  if (aiCredits !== null) args.push("--max-ai-credits", String(aiCredits));
  if (workspaceRoot) args.push("--add-dir", resolve(workspaceRoot));
  for (const url of plan.permissions.allowedUrls) args.push("--allow-url", url);
  if (plan.permissions.secretRefs.length > 0) {
    args.push("--secret-env-vars", ...plan.permissions.secretRefs);
  }
  args.push("--silent", "--prompt", prompt);
  return args;
}
function resultContract() {
  return {
    status: "delivered | blocked | failed",
    summary: "<required outcome or exact gap>",
    headSha: "<full lowercase commit SHA or null>",
    prUrl: "<GitHub pull request URL or null>",
    evidence: ["<durable observation or reference>"],
    suggestions: [{
      summary: "<not implemented>",
      basis: "<observed condition or explicit hypothesis>",
      whyDeferred: "<delivery-boundary reason>",
      benefit: "<expected value>",
      costRisk: "<implementation cost or risk>",
      priority: "<suggested priority>"
    }],
    blocker: {
      kind: "<fact | decision | action | capability | collision | limit>",
      owner: "<named authority or fact owner>",
      context: "<Observation, Attempts, Boundary, Recommendation, Resume point>",
      ask: "<one decision or action>",
      answerBy: "<timing or milestone>",
      questionRef: "<Core question reference or null>"
    },
    nextAction: "<safe resume or review action>"
  };
}
function stageResultContract() {
  return {
    status: "completed | blocked | failed",
    summary: "<completed work or exact gap>",
    headSha: "<full lowercase commit SHA or null>",
    evidence: ["<durable observation or reference>"],
    suggestions: resultContract().suggestions,
    blocker: resultContract().blocker,
    nextAction: "<safe handoff or resume action>"
  };
}
function nightshiftDecisionContract() {
  return {
    status: "slice | complete | blocked",
    summary: "<why this is the next decision>",
    slice: {
      id: "<safe slice ID>",
      task: { id: "<engineering Task ID>", version: 1 },
      outcome: "<one required PR outcome>",
      acceptance: ["<accepted criterion>"],
      touches: ["<repository-relative area>"],
      completionCheck: "<observable check>",
      route: "frontend | backend",
      reviewRequired: false,
      branch: "<kai branch>",
      baseHead: "<approved base or delivered head>",
      pullRequestBase: "<matching base branch>"
    },
    blocker: resultContract().blocker,
    nextAction: "<launch, morning decision, or report action>"
  };
}
function nightshiftHistory(events) {
  return terminalSliceEvents(events).map((entry2) => ({
    sliceId: entry2.payload.slice.id,
    task: entry2.payload.slice.task,
    status: entry2.type.slice("slice.".length),
    branch: entry2.payload.slice.branch,
    headSha: entry2.payload.result.headSha,
    prUrl: entry2.payload.result.prUrl,
    summary: entry2.payload.result.summary,
    suggestions: entry2.payload.result.suggestions
  }));
}
function nightshiftDecisionPrompt(plan, events) {
  return [
    `Act as eng-nightshift and own the next incremental decision for run ${plan.runId}.`,
    `Approved admission: ${JSON.stringify(plan)}`,
    `Accumulated terminal checkpoints: ${JSON.stringify(nightshiftHistory(events))}`,
    "Read the approved goal, bounded Core Tasks, dependencies, questions, grants, prior PR evidence, and any supplied planning projection.",
    "Choose exactly one next frontend or backend PR-sized slice, return a blocker, or declare the approved outcome complete.",
    "Do not pre-plan the rest of the night. Do not implement product code. Do not turn suggestions into scope.",
    "A non-base baseHead is allowed only for a delivered prior slice and only when stacking was approved.",
    "Your final response must be exactly one JSON object with no Markdown fence or surrounding prose.",
    JSON.stringify(nightshiftDecisionContract(), null, 2),
    "For slice, blocker must be null. For complete, slice and blocker must be null. For blocked, slice must be null and blocker populated."
  ].join("\n\n");
}
function sharedPrompt(plan, slice, { baseHead, pullRequestBase }) {
  return [
    `Nightshift run ${plan.runId}, slice ${slice.id}, and no other scope.`,
    `Coordination workspace: ${plan.projectId}; approved goal: ${plan.goal.outcome}.`,
    `Task: ${slice.task.id} version ${slice.task.version}.`,
    `Required outcome: ${slice.outcome}`,
    `Acceptance: ${slice.acceptance.join(" | ")}`,
    `Touched areas: ${slice.touches.join(", ")}`,
    `Completion check: ${slice.completionCheck}`,
    `Git base commit: ${baseHead}`,
    `Branch: ${slice.branch}`,
    `Pull request base: ${pullRequestBase}`,
    `Git push authorized: ${plan.permissions.push}; pull request authorized: ${plan.permissions.pullRequests}.`,
    "Implement required work only. Preserve blockers in Core. Put broader or lower-confidence ideas in suggestions.",
    "Never merge, deploy, release, self-approve, or expand the approved goal or bounded Task set."
  ];
}
function builderPrompt(plan, slice, basis) {
  return [
    ...sharedPrompt(plan, slice, basis),
    `Act as the routed ${slice.route} builder. Apply software-development and your existing domain standards.`,
    "Claim and execute only the exact coordinated Task. Commit the coherent implementation and leave the worktree clean.",
    "Do not push, open a pull request, review, merge, deploy, or release. The delivery lead owns the next stage.",
    "Your final response must be exactly one JSON object with no Markdown fence or surrounding prose.",
    JSON.stringify(stageResultContract(), null, 2),
    "For completed, blocker must be null. For blocked or failed, blocker must be populated."
  ].join("\n\n");
}
function deliveryPrompt(plan, slice, basis, builderResult) {
  return [
    ...sharedPrompt(plan, slice, basis),
    "Act as eng-lead-software for integration and pull-request delivery of the completed builder handoff.",
    `Builder handoff: ${JSON.stringify(builderResult)}`,
    "Verify the exact diff, Core handoff, scope, evidence, and clean Git state. Apply pr-sizing to the completed diff and pr-delivery to open the authorized pull request.",
    "Do not implement product changes, infer optional review, merge, deploy, tag, or release.",
    "Your final response must be exactly one JSON object with no Markdown fence or surrounding prose.",
    JSON.stringify(resultContract(), null, 2),
    "For delivered, blocker must be null. For blocked or failed, blocker must be populated."
  ].join("\n\n");
}
function reviewPrompt(plan, slice, basis, deliveryResult) {
  return [
    ...sharedPrompt(plan, slice, basis),
    "Act as eng-reviewer-code. Independently review the exact delivered head and pull request without modifying the product.",
    `Delivery handoff: ${JSON.stringify(deliveryResult)}`,
    "Record the required exact-revision review in Core. Use completed only for Pass; use blocked for Changes requested and failed for Inconclusive or host failure.",
    "Your final response must be exactly one JSON object with no Markdown fence or surrounding prose.",
    JSON.stringify(stageResultContract(), null, 2),
    "For completed, blocker must be null. For blocked or failed, blocker must be populated."
  ].join("\n\n");
}
function worktreePath(projectRoot, runId, sliceId) {
  const parent = resolve(projectRoot, ".worktrees");
  const path = resolve(parent, "nightshift", safeId(runId, "runId"), safeId(sliceId, "sliceId"));
  if (!isWithin(parent, path)) fail("derived worktree path escapes Nightshift root");
  assertNoLinks(projectRoot, path, "Nightshift worktree path");
  if (git(projectRoot, ["check-ignore", "--quiet", "--no-index", path], {
    allowFailure: true
  }).status !== 0) {
    fail("Nightshift requires its project-local worktree path to be ignored");
  }
  return path;
}
function branchExists(projectRoot, name) {
  return git(projectRoot, ["show-ref", "--verify", "--quiet", `refs/heads/${name}`], {
    allowFailure: true
  }).status === 0;
}
function createWorktree(projectRoot, plan, slice, baseHead) {
  const path = worktreePath(projectRoot, plan.runId, slice.id);
  if (existsSync(path)) fail(`worktree path already exists: ${path}`);
  if (branchExists(projectRoot, slice.branch)) {
    fail(`branch already exists before slice execution: ${slice.branch}`);
  }
  mkdirSync(dirname(path), { recursive: true });
  git(projectRoot, ["worktree", "add", "-b", slice.branch, path, baseHead]);
  return path;
}
function writeCapture(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === "string" ? value : "", "utf8");
}
function redactSecrets(value, secretRefs, env = process.env) {
  let redacted = String(value ?? "");
  const values = secretRefs.map((name) => [name, env[name]]).filter(([, secret]) => typeof secret === "string" && secret.length > 0).sort((left, right) => right[1].length - left[1].length);
  for (const [name, secret] of values) {
    redacted = redacted.split(secret).join(`[REDACTED:${name}]`);
  }
  return redacted;
}
function sessionEnvironment(env, plan) {
  const allowedSecrets = new Set(plan.permissions.secretRefs);
  const child = {};
  for (const [name, value] of Object.entries(env)) {
    if (name === "COPILOT_AGENT_SESSION_ID") continue;
    if (/(?:TOKEN|SECRET|PASSWORD|CREDENTIAL|(?:^|_)KEY(?:_|$))/i.test(name) && !allowedSecrets.has(name)) {
      continue;
    }
    child[name] = value;
  }
  return child;
}
function parseResultOutput(stdout) {
  const text = String(stdout ?? "").trim();
  if (!text) fail("workflow session returned no JSON result");
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`workflow session result is not exact JSON: ${error.message}`);
  }
}
function failureResult(kind, summary, context, nextAction) {
  return {
    status: "failed",
    summary,
    headSha: null,
    prUrl: null,
    evidence: [],
    suggestions: [],
    blocker: {
      kind,
      owner: "operator",
      context,
      ask: nextAction,
      answerBy: "before resuming this slice",
      questionRef: null
    },
    nextAction
  };
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
  env = process.env
}) {
  const sliceId = slice?.id ?? stage;
  const args = buildCopilotArgs({
    plan,
    slice,
    profile,
    prompt,
    aiCredits,
    workspaceRoot: root,
    env
  });
  const timeout = Math.max(1, Date.parse(plan.deadline) - Date.now());
  const executable = env.KAI_COPILOT_EXECUTABLE || "copilot";
  const childEnv = sessionEnvironment(env, plan);
  const child = spawnSync(executable, args, {
    cwd: worktree,
    env: {
      ...childEnv,
      KAI_WORKSPACE_ROOT: root,
      KAI_NIGHTSHIFT_RUN_ID: plan.runId,
      KAI_NIGHTSHIFT_SLICE_ID: sliceId,
      KAI_NIGHTSHIFT_STAGE: stage
    },
    encoding: "utf8",
    windowsHide: true,
    timeout,
    maxBuffer: MAX_CAPTURE_BYTES
  });
  const stdoutPath = join(paths.evidence, `${sliceId}-${stage}-stdout.log`);
  const stderrPath = join(paths.evidence, `${sliceId}-${stage}-stderr.log`);
  const stdout = redactSecrets(child.stdout, plan.permissions.secretRefs, env);
  const stderr = redactSecrets(child.stderr, plan.permissions.secretRefs, env);
  writeCapture(stdoutPath, stdout);
  writeCapture(stderrPath, stderr);
  if (child.error || child.status !== 0) {
    const reason = child.error?.code === "ETIMEDOUT" ? `${stage} session exceeded the approved deadline` : `${stage} session failed (${child.error?.code ?? `exit ${child.status}`})`;
    return {
      ok: false,
      stdoutPath,
      stderrPath,
      result: failureResult(
        child.error?.code === "ETIMEDOUT" ? "limit" : "capability",
        reason,
        [
          `Observation: ${reason}.`,
          `Attempts: one bounded ${profile} session was launched for ${sliceId}.`,
          "Boundary: no successful exact JSON result was observed.",
          "Recommendation: inspect the private session logs and host capability.",
          `Resume point: preserved worktree ${worktree}.`
        ].join("\n"),
        "Resolve the host failure and explicitly resume the slice."
      )
    };
  }
  return {
    ok: true,
    stdoutPath,
    stderrPath,
    raw: parseResultOutput(stdout)
  };
}
function invalidStageResult(error, { stage, stdoutPath, worktree, actualHead }) {
  return failureResult(
    "capability",
    error.message,
    [
      `Observation: ${error.message}.`,
      `Attempts: ${stage} output was captured at ${stdoutPath}.`,
      "Boundary: invalid or contradictory output cannot become delivery evidence.",
      "Recommendation: inspect the session and repair the exact result contract.",
      `Resume point: preserved worktree ${worktree} at ${actualHead}.`
    ].join("\n"),
    "Resolve the invalid session result before resuming."
  );
}
function nightshiftDecisionFailure(result) {
  return {
    status: "blocked",
    summary: result.summary,
    slice: null,
    blocker: result.blocker,
    nextAction: result.nextAction
  };
}
function runNightshiftDecision({
  root,
  projectRoot,
  plan,
  events,
  paths,
  aiCredits,
  env = process.env
}) {
  const decisionNumber = events.filter((entry2) => entry2.type === "nightshift.decided").length + 1;
  const controlId = `nightshift-${decisionNumber}`;
  const worktree = worktreePath(projectRoot, plan.runId, controlId);
  if (existsSync(worktree)) fail(`Nightshift decision worktree already exists: ${worktree}`);
  mkdirSync(dirname(worktree), { recursive: true });
  git(projectRoot, ["worktree", "add", "--detach", worktree, plan.base.sha]);
  const stage = `nightshift-decision-${decisionNumber}`;
  const observed = runProfile({
    root,
    plan,
    slice: null,
    paths,
    worktree,
    profile: DECISION_PROFILE,
    stage,
    prompt: nightshiftDecisionPrompt(plan, events),
    aiCredits,
    env
  });
  const clean = gitText(worktree, ["status", "--porcelain"]) === "";
  if (!observed.ok) return nightshiftDecisionFailure(observed.result);
  if (!clean) {
    return nightshiftDecisionFailure(failureResult(
      "capability",
      "software lead mutated the planning worktree",
      [
        "Observation: the Nightshift decision session changed repository files.",
        "Attempts: one bounded Nightshift decision was requested.",
        "Boundary: planning may not mutate the product.",
        "Recommendation: inspect the preserved Nightshift worktree.",
        `Resume point: ${worktree}.`
      ].join("\n"),
      "Resolve the lead planning mutation before resuming."
    ));
  }
  let decision;
  try {
    decision = validateNightshiftDecision(observed.raw, { plan, events });
  } catch (error) {
    return nightshiftDecisionFailure(invalidStageResult(error, {
      stage: "Nightshift decision",
      stdoutPath: observed.stdoutPath,
      worktree,
      actualHead: plan.base.sha
    }));
  }
  git(projectRoot, ["worktree", "remove", worktree]);
  return decision;
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
  env = process.env
}) {
  const worktree = createWorktree(projectRoot, plan, slice, baseHead);
  const profiles = profilesForSlice(slice);
  const stageCredits = aiCredits === null ? null : aiCredits / profiles.length;
  const basis = { baseHead, pullRequestBase };
  const builder = runProfile({
    root,
    plan,
    slice,
    paths,
    worktree,
    profile: profiles[0],
    stage: "build",
    prompt: builderPrompt(plan, slice, basis),
    aiCredits: stageCredits,
    env
  });
  let actualHead = gitText(worktree, ["rev-parse", "HEAD"]);
  let clean = gitText(worktree, ["status", "--porcelain"]) === "";
  if (!builder.ok) {
    return { worktree, actualHead, clean, result: builder.result };
  }
  let builderResult;
  try {
    builderResult = validateStageResult(builder.raw, {
      actualHead,
      baseHead,
      clean,
      requireChange: true,
      label: "builder result"
    });
  } catch (error) {
    return {
      worktree,
      actualHead,
      clean,
      result: invalidStageResult(error, {
        stage: "builder",
        stdoutPath: builder.stdoutPath,
        worktree,
        actualHead
      })
    };
  }
  if (builderResult.status !== "completed") {
    return { worktree, actualHead, clean, result: stageAsSliceResult(builderResult) };
  }
  const delivery = runProfile({
    root,
    plan,
    slice,
    paths,
    worktree,
    profile: DELIVERY_PROFILE,
    stage: "delivery",
    prompt: deliveryPrompt(plan, slice, basis, builderResult),
    aiCredits: stageCredits,
    env
  });
  actualHead = gitText(worktree, ["rev-parse", "HEAD"]);
  clean = gitText(worktree, ["status", "--porcelain"]) === "";
  if (!delivery.ok) {
    return { worktree, actualHead, clean, result: delivery.result };
  }
  let deliveryResult;
  try {
    deliveryResult = validateSliceResult(delivery.raw, { baseHead, actualHead, clean });
  } catch (error) {
    return {
      worktree,
      actualHead,
      clean,
      result: invalidStageResult(error, {
        stage: "delivery",
        stdoutPath: delivery.stdoutPath,
        worktree,
        actualHead
      })
    };
  }
  if (deliveryResult.status !== "delivered" || !slice.reviewRequired) {
    return { worktree, actualHead, clean, result: deliveryResult };
  }
  const review = runProfile({
    root,
    plan,
    slice,
    paths,
    worktree,
    profile: REVIEW_PROFILE,
    stage: "review",
    prompt: reviewPrompt(plan, slice, basis, deliveryResult),
    aiCredits: stageCredits,
    env
  });
  actualHead = gitText(worktree, ["rev-parse", "HEAD"]);
  clean = gitText(worktree, ["status", "--porcelain"]) === "";
  if (!review.ok) {
    return { worktree, actualHead, clean, result: review.result };
  }
  let reviewResult;
  try {
    reviewResult = validateStageResult(review.raw, {
      actualHead,
      baseHead: actualHead,
      clean,
      requireChange: false,
      label: "review result"
    });
  } catch (error) {
    return {
      worktree,
      actualHead,
      clean,
      result: invalidStageResult(error, {
        stage: "review",
        stdoutPath: review.stdoutPath,
        worktree,
        actualHead
      })
    };
  }
  if (reviewResult.status !== "completed") {
    return {
      worktree,
      actualHead,
      clean,
      result: {
        ...stageAsSliceResult(reviewResult),
        prUrl: deliveryResult.prUrl
      }
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
      nextAction: reviewResult.nextAction
    }
  };
}
function removeDeliveredWorktree(projectRoot, path) {
  git(projectRoot, ["worktree", "remove", path]);
}
function renderMorningReport(plan, events) {
  const state = foldEvents(plan, events);
  const safe = (value) => String(value ?? "unavailable").replace(/\r?\n/g, "<br>").replace(/\|/g, "\\|");
  const rows = state.slices.map((sliceState) => ({
    slice: sliceState.slice,
    state: sliceState
  }));
  const deliveredRows = rows.filter(({ state: state2 }) => state2?.status === "delivered").map(({ slice, state: state2 }) => {
    const evidence = state2.result.evidence.length ? state2.result.evidence.join("; ") : "No reviewer-facing evidence reported";
    const deferred = state2.result.suggestions.length ? state2.result.suggestions.map((item) => item.summary).join("; ") : "None reported";
    return `| ${safe(state2.result.prUrl)} | ${safe(slice.outcome)} | ${safe(evidence)} | ${safe(deferred)} |`;
  });
  const blockedRows = rows.filter(({ state: state2 }) => state2 && (/* @__PURE__ */ new Set(["blocked", "failed"])).has(state2.status)).map(({ slice, state: state2 }) => {
    const blocker = state2.result?.blocker;
    const field = (prefix) => blocker?.context?.split(/\r?\n/).find((line) => line.startsWith(`${prefix}:`))?.slice(prefix.length + 1).trim() ?? "unavailable";
    const recommendation = [
      field("Recommendation"),
      blocker?.ask ? `Decision: ${blocker.ask}` : null
    ].filter(Boolean).join(" ");
    return `| ${safe(slice.task.id)} | ${safe(state2.result?.summary ?? state2.reason)} | ${safe(field("Boundary"))} | ${safe(blocker?.owner)} | ${safe(recommendation)} | ${safe(field("Resume point"))} |`;
  });
  const suggestions = rows.flatMap(({ slice, state: state2 }) => (state2?.result?.suggestions ?? []).map((item) => ({ slice, item })));
  const suggestionRows = suggestions.map(({ item }) => `| ${safe(item.summary)} | ${safe(item.basis)} | ${safe(item.whyDeferred)} | ${safe(item.benefit)} | ${safe(item.costRisk)} | ${safe(item.priority)} |`);
  const retained = rows.filter(({ state: state2 }) => state2?.worktree?.retained).map(({ state: state2 }) => state2.worktree.path);
  return `# Nightshift ${plan.runId}

## Goal and approved scope

${plan.goal.outcome}

- Acceptance: ${plan.goal.acceptance.join(" | ")}
- Bounded Tasks: ${plan.tasks.map((task) => `${task.id}@${task.version}`).join(", ")}
- Planning projection: ${plan.planningProjection ? `${plan.planningProjection.summary} (${plan.planningProjection.references.join(", ")})` : "not supplied"}
- Base: ${plan.base.remote}/${plan.base.branch} at ${plan.base.sha}
- Deadline: ${plan.deadline}
- Attempted slices: ${rows.length}

## Delivered pull requests

| PR | Required outcome | Evidence | Intentionally not done |
| --- | --- | --- | --- |
${deliveredRows.length ? deliveredRows.join("\n") : "| None | - | - | - |"}

## Blocked work

| Task/PR | What stopped | Why unsafe to continue | Decision owner | Recommended action | Resume point |
| --- | --- | --- | --- | --- | --- |
${blockedRows.length ? blockedRows.join("\n") : "| None | - | - | - | - | - |"}

## Skipped work

| Slice | Reason | Dependency or limit | Next action |
| --- | --- | --- | --- |
| None | - | - | - |

## Suggestions for the morning

| Suggestion | Evidence or basis | Why deferred | Benefit | Cost/risk | Suggested priority |
| --- | --- | --- | --- | --- | --- |
${suggestionRows.length ? suggestionRows.join("\n") : "| None | - | - | - | - | - |"}

## Run limits

- Status: ${safe(state.status)}
- Started: ${safe(state.startedAt)}
- Finished: ${safe(state.finishedAt)}
- Terminal reason: ${safe(state.terminalReason)}
- Pull requests: ${rows.filter(({ state: state2 }) => state2?.status === "delivered").length}/${plan.limits.maxPullRequests}
- AI credits: unavailable (${plan.limits.maxAiCredits === null ? "no credit ceiling approved" : `approved soft ceiling ${plan.limits.maxAiCredits}`})
- Retained worktrees: ${retained.length ? retained.map(safe).join(", ") : "none"}
`;
}
function writeReport(paths, plan, events) {
  const report = renderMorningReport(plan, events);
  atomicWrite(paths.report, report);
  return report;
}
function reportRun({ root, runId }) {
  const { plan, events, state, paths } = loadRun(root, runId);
  return { report: writeReport(paths, plan, events), plan, events, state, paths };
}
function executeRun({
  root,
  runId,
  env = process.env,
  now = () => /* @__PURE__ */ new Date(),
  decideNext = runNightshiftDecision,
  runSlice = runSession,
  removeWorktree = removeDeliveredWorktree,
  verifyRunBasis = verifyBasis
}) {
  const loaded = loadRun(root, runId);
  const { plan, paths, projectRoot } = loaded;
  let events = loaded.events;
  let state = foldEvents(plan, events);
  if ((/* @__PURE__ */ new Set(["completed", "completed-with-blockers", "completed-with-failures"])).has(state.status)) {
    writeReport(paths, plan, events);
    return { plan, events, state, paths };
  }
  const creditUnit = plan.limits.maxAiCredits === null ? null : plan.limits.maxAiCredits / (plan.limits.maxPullRequests * 4 + 1);
  while (true) {
    verifyRunBasis(projectRoot, plan);
    events = readEvents(paths.events, runId);
    state = foldEvents(plan, events);
    const launchedCount = state.slices.filter((slice2) => (/* @__PURE__ */ new Set(["delivered", "blocked", "failed"])).has(slice2.status)).length;
    if (launchedCount >= plan.limits.maxPullRequests) {
      appendRunEvent({
        path: paths.events,
        runId,
        type: "run.stopped",
        payload: { reason: "pull-request/launch limit reached" },
        at: now().toISOString()
      });
      break;
    }
    if (now().getTime() >= Date.parse(plan.deadline)) {
      appendRunEvent({
        path: paths.events,
        runId,
        type: "run.stopped",
        payload: { reason: "deadline reached" },
        at: now().toISOString()
      });
      break;
    }
    const retained = state.slices.filter((slice2) => slice2.worktree?.retained).length;
    if (retained > 0 && retained >= plan.limits.maxRetainedWorktrees) {
      appendRunEvent({
        path: paths.events,
        runId,
        type: "run.stopped",
        payload: { reason: "retained-worktree limit reached" },
        at: now().toISOString()
      });
      break;
    }
    let decision;
    try {
      decision = validateNightshiftDecision(decideNext({
        root: resolve(root),
        projectRoot,
        plan,
        events,
        paths,
        aiCredits: creditUnit,
        env
      }), { plan, events });
    } catch (error) {
      decision = nightshiftDecisionFailure(failureResult(
        "capability",
        error.message,
        [
          `Observation: ${error.message}.`,
          "Attempts: the runner requested one Nightshift decision.",
          "Boundary: the runner cannot invent the next product action.",
          "Recommendation: inspect the Nightshift decision evidence.",
          "Resume point: no new slice was launched."
        ].join("\n"),
        "Resolve the Nightshift decision failure before resuming."
      ));
    }
    appendRunEvent({
      path: paths.events,
      runId,
      type: "nightshift.decided",
      payload: { decision },
      at: now().toISOString()
    });
    if (decision.status === "complete") {
      appendRunEvent({
        path: paths.events,
        runId,
        type: "run.completed",
        payload: { reason: decision.summary },
        at: now().toISOString()
      });
      break;
    }
    if (decision.status === "blocked") {
      appendRunEvent({
        path: paths.events,
        runId,
        type: "run.blocked",
        payload: { reason: decision.summary, blocker: decision.blocker },
        at: now().toISOString()
      });
      break;
    }
    const slice = decision.slice;
    appendRunEvent({
      path: paths.events,
      runId,
      type: "slice.started",
      payload: { slice, worktree: null },
      at: now().toISOString()
    });
    let observed;
    try {
      observed = runSlice({
        root: resolve(root),
        projectRoot,
        plan,
        slice,
        paths,
        baseHead: slice.baseHead,
        pullRequestBase: slice.pullRequestBase,
        aiCredits: creditUnit === null ? null : creditUnit * 3,
        env
      });
    } catch (error) {
      const candidate = worktreePath(projectRoot, plan.runId, slice.id);
      observed = {
        worktree: candidate,
        actualHead: null,
        clean: false,
        result: failureResult(
          "capability",
          error.message,
          [
            `Observation: ${error.message}.`,
            "Attempts: Nightshift attempted to prepare or launch the slice once.",
            "Boundary: the runner cannot prove a safe executable environment.",
            "Recommendation: resolve the host or Git failure before resuming.",
            "Resume point: no successful workflow result was observed."
          ].join("\n"),
          "Resolve the runner failure before resuming."
        )
      };
    }
    const worktree = {
      path: observed.worktree,
      retained: observed.result.status !== "delivered"
    };
    if (observed.result.status === "delivered") {
      removeWorktree(projectRoot, observed.worktree);
      worktree.retained = false;
    }
    appendRunEvent({
      path: paths.events,
      runId,
      type: `slice.${observed.result.status}`,
      payload: { slice, result: observed.result, worktree },
      at: now().toISOString()
    });
  }
  events = readEvents(paths.events, runId);
  state = foldEvents(plan, events);
  writeReport(paths, plan, events);
  return { plan, events, state, paths };
}
function arg(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1] ?? null;
}
function usage() {
  return [
    "usage:",
    "  nightshift.mjs prepare --root <workspace> --plan <file>",
    "  nightshift.mjs run --root <workspace> --run-id <id>",
    "  nightshift.mjs report --root <workspace> --run-id <id>",
    "  nightshift.mjs status --root <workspace> --run-id <id>"
  ].join("\n");
}
async function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  if (command === "--help" || command === "-h" || command === "help") {
    console.log(usage());
    return 0;
  }
  const root = arg(argv, "--root");
  if (!command || !root) fail(usage());
  if (command === "prepare") {
    const planPath = arg(argv, "--plan");
    if (!planPath) fail(usage());
    const result = prepareRun({ root, plan: readJson(resolve(planPath), "approved plan") });
    console.log(JSON.stringify({
      runId: result.plan.runId,
      created: result.created,
      status: result.state.status,
      runRoot: result.paths.runRoot
    }, null, 2));
    return 0;
  }
  const runId = arg(argv, "--run-id");
  if (!runId) fail(usage());
  if (command === "run") {
    const result = executeRun({ root, runId });
    console.log(JSON.stringify({
      runId,
      status: result.state.status,
      terminalReason: result.state.terminalReason,
      report: result.paths.report
    }, null, 2));
    return result.state.status === "completed-with-failures" ? 1 : 0;
  }
  if (command === "report") {
    const result = reportRun({ root, runId });
    console.log(result.paths.report);
    return 0;
  }
  if (command === "status") {
    const { state } = loadRun(root, runId);
    console.log(JSON.stringify(state, null, 2));
    return 0;
  }
  fail(usage());
}
var entry = process.argv[1] ? resolve(process.argv[1]) : null;
if (entry === fileURLToPath(import.meta.url)) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(`Nightshift: ${error.message}`);
      process.exitCode = 1;
    }
  );
}
export {
  appendRunEvent,
  buildCopilotArgs,
  executeRun,
  foldEvents,
  main,
  prepareRun,
  profilesForSlice,
  redactSecrets,
  renderMorningReport,
  reportRun,
  runPaths,
  validateNightshiftDecision,
  validatePlan,
  validateSliceResult,
  worktreePath
};

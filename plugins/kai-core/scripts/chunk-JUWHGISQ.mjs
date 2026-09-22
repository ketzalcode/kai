import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  recordApproval,
  recordReview,
  registerArtifact,
  registerEvidence,
  transitionAsset
} from "./chunk-5QXOH5X2.mjs";
import {
  DATABASE,
  GRANTABLE_STATES,
  LOCK,
  SHIP_STATES,
  applyCommand,
  applyOperation,
  assertWorkspacePath,
  assertWorkspaceWrite,
  bindEvidenceRuntime,
  bindMigrationRepair,
  captureInputBasis,
  closeStore,
  exactFile,
  exclusiveFile,
  listRecords,
  migrateWorkspace,
  migrationManifest,
  normalized,
  openStore,
  pathHasLink,
  privateAdmission,
  readOperationReceipt,
  readRecord,
  recoverMigration,
  repairLegacyRecord,
  requireActorAvailable,
  requireHostActionGrant,
  requireLease,
  rollbackMigration,
  safePath,
  sameActor,
  workspaceManifest
} from "./chunk-SQAAX6CQ.mjs";
import "./chunk-MIK5J3AD.mjs";
import "./chunk-VTZRFV57.mjs";
import {
  copilotLaunch
} from "./chunk-MZ7YRIJ3.mjs";
import {
  CLASSIFICATIONS,
  COMMAND_KINDS,
  MAX_OBSERVATIONS,
  RuntimeError,
  approvedProfileModel,
  assertExactKeys,
  attemptSummary,
  canonicalJson,
  clone,
  commandDigest,
  criteriaRef,
  effectSummary,
  fail,
  isPlainObject,
  latestTerminalObservations,
  sanitizeFacts,
  text,
  validateActor,
  validateAuthority,
  validateCapabilities,
  validateCommand,
  validateHostObservation,
  validateRecord
} from "./chunk-VP4QXWCX.mjs";

// src/core/lib/coordination-runtime/native-host.mjs
import { randomUUID, createHash } from "node:crypto";
import { existsSync as existsSync3 } from "node:fs";

// src/core/lib/coordination-runtime/native-receipts.mjs
import { createReadStream, existsSync, lstatSync, openSync, fstatSync, closeSync } from "node:fs";
import { join, isAbsolute } from "node:path";
import { createInterface } from "node:readline";
var fail2 = (code, message) => {
  throw new RuntimeError(code, message);
};
var eventTypes = /* @__PURE__ */ new Set([
  "tool.execution_start",
  "tool.execution_complete",
  "session.start",
  "subagent.selected",
  "assistant.turn_start"
]);
var fields = (value, keys) => Object.fromEntries(keys.filter((k) => value?.[k] !== void 0).map((k) => [k, value[k]]));
function safeEvent(event) {
  const data = event.data ?? {};
  let selected;
  if (event.type === "session.start") selected = {
    ...fields(data, ["sessionId", "copilotVersion", "startTime"]),
    context: fields(data.context, ["cwd"])
  };
  else if (event.type === "subagent.selected") selected = fields(data, ["agentName"]);
  else if (event.type === "tool.execution_start") selected = {
    ...fields(data, ["toolCallId", "toolName"]),
    arguments: fields(
      data.arguments,
      data.toolName === "ask_user" ? ["message", "requestedSchema"] : data.toolName === "powershell" ? ["command", "mode"] : []
    )
  };
  else if (event.type === "tool.execution_complete") selected = {
    ...fields(data, ["toolCallId", "success"]),
    result: fields(data.result, ["content", "detailedContent"])
  };
  else selected = {};
  return { ...fields(event, ["id", "timestamp", "type", "agentId"]), data: selected };
}
function contextIdentity(env) {
  const id = env.COPILOT_AGENT_SESSION_ID;
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]{0,127}$/i.test(id)) {
    fail2("UNSUPPORTED_HOST", "COPILOT_AGENT_SESSION_ID is absent/invalid; read-only and direct work remain available");
  }
  return id;
}
async function* nativeEvents(env, types = ["tool.execution_start", "tool.execution_complete"]) {
  if (!Array.isArray(types) || types.some((t) => !eventTypes.has(t))) fail2("INVALID_INPUT", "native metadata types must be explicitly allowlisted");
  const sessionId = contextIdentity(env);
  const home = env.USERPROFILE || env.HOME;
  if (!home || !isAbsolute(home)) fail2("UNSUPPORTED_HOST", "native session-state home is unavailable");
  const directory = join(home, ".copilot", "session-state", sessionId);
  const path = join(directory, "events.jsonl");
  if (!existsSync(path)) fail2("UNSUPPORTED_HOST", "this context has no standalone journal; use prepare, reserve/delegate, then launch the standalone --session-id context. Nested agent IDs are not mapped to parent journals");
  if (pathHasLink(home, path) || !lstatSync(path).isFile() || lstatSync(path).nlink !== 1) {
    fail2("UNSUPPORTED_HOST", "native journal must be an unshared regular local file");
  }
  const stat = lstatSync(path);
  const fd = openSync(path, "r");
  const opened = fstatSync(fd);
  if (opened.ino !== stat.ino || opened.dev !== stat.dev || opened.nlink !== 1 || !opened.isFile()) {
    closeSync(fd);
    fail2("UNSUPPORTED_HOST", "native journal changed identity while opening");
  }
  if (opened.size === 0) {
    closeSync(fd);
    return;
  }
  const stream = createReadStream(path, { fd, encoding: "utf8", end: opened.size - 1 });
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  let seq = 0;
  try {
    for await (const line of lines) {
      seq++;
      if (!types.some((type) => line.includes(type))) continue;
      let event;
      try {
        event = JSON.parse(line);
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        continue;
      }
      if (!types.includes(event.type)) continue;
      yield { event: safeEvent(event), seq, sessionId };
    }
  } finally {
    lines.close();
    stream.destroy();
  }
}
async function readNativeTool({ env, toolCallId, toolNames, matchesStart }) {
  if (toolCallId === void 0) {
    if (typeof matchesStart !== "function") fail2("INVALID_INPUT", "receipt lookup requires a canonical issued request");
    const candidates = [];
    for await (const { event } of nativeEvents(env)) {
      if (event.type === "tool.execution_start" && toolNames.includes(event.data?.toolName) && matchesStart(event.data.arguments)) candidates.push(event.data.toolCallId);
    }
    if (candidates.length !== 1) fail2("AUTHORITY_REQUIRED", "canonical request must match one native interaction; use an exact --tool-call when disambiguation is needed");
    [toolCallId] = candidates;
  }
  if (typeof toolCallId !== "string" || !toolCallId || toolCallId.length > 256) fail2("INVALID_INPUT", "native --tool-call ID must be nonempty and bounded");
  let start, complete, starts = 0, completions = 0, startSeq, completeSeq, sessionId;
  for await (const frame of nativeEvents(env)) {
    const { event, seq } = frame;
    sessionId = frame.sessionId;
    const data = event.data;
    if (data?.toolCallId !== toolCallId) continue;
    if (event.agentId) {
      fail2("UNSUPPORTED_HOST", "this receipt belongs to a nested host agent; agentId is not a measured mapping to COPILOT_AGENT_SESSION_ID. Use a trusted host-owned identity/capture registry");
    }
    if (event.type === "tool.execution_start") {
      starts++;
      startSeq = seq;
      if (!toolNames.includes(data.toolName)) fail2("UNSUPPORTED_HOST", "native tool receipt type is not supported for this operation");
      start = { id: event.id, timestamp: event.timestamp, name: data.toolName, arguments: data.arguments };
    } else if (event.type === "tool.execution_complete") {
      completions++;
      completeSeq = seq;
      complete = {
        id: event.id,
        timestamp: event.timestamp,
        success: data.success,
        content: data.result?.content,
        detailedContent: data.result?.detailedContent
      };
    }
  }
  if (starts !== 1 || completions !== 1 || startSeq >= completeSeq) {
    fail2("AUTHORITY_REQUIRED", "native receipt requires exactly one ordered matching start and completion");
  }
  if (!start.timestamp || Number.isNaN(Date.parse(start.timestamp)) || !complete.timestamp || Number.isNaN(Date.parse(complete.timestamp)) || Date.parse(complete.timestamp) > Date.now() || Date.parse(start.timestamp) > Date.parse(complete.timestamp)) {
    fail2("EVIDENCE_GAP", "native completion has no valid capture timestamp");
  }
  return { sessionId, toolCallId, start, complete };
}
async function matchHumanDecision({ env, request, toolCallId }) {
  const receipt = await readNativeTool({ env, toolCallId, toolNames: ["ask_user"], matchesStart: (args) => args?.message === request.message && canonicalJson(args?.requestedSchema ?? null) === canonicalJson(request.requestedSchema) });
  const reply = `APPROVE ${request.nonce}`;
  if (receipt.complete.success !== true || receipt.start.arguments?.message !== request.message || canonicalJson(receipt.start.arguments?.requestedSchema ?? null) !== canonicalJson(request.requestedSchema) || receipt.complete.content !== `User responded: ${reply}` || receipt.complete.detailedContent !== `User responded:
decision: ${reply}` || Date.parse(receipt.start.timestamp) < Date.parse(request.createdAt) || Date.parse(receipt.complete.timestamp) > Date.parse(request.expiresAt)) {
    fail2("AUTHORITY_REQUIRED", "operator decision requires the exact visible nonce/scope/action and unconditional strict APPROVE reply; tool success alone is not approval");
  }
  return {
    source: "host-interaction",
    reference: `host:copilot:${receipt.sessionId}:${receipt.complete.id}`,
    attributed_to: "Operator",
    captured_at: receipt.complete.timestamp,
    requestNonce: request.nonce,
    toolCallId: receipt.toolCallId,
    sessionId: receipt.sessionId,
    startEventId: receipt.start.id,
    completeEventId: receipt.complete.id
  };
}

// src/core/lib/coordination-runtime/native-capabilities.mjs
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync as existsSync2 } from "node:fs";
var lane = ".kai/state/host";
var fail3 = (code, message) => {
  throw new RuntimeError(code, message);
};
var kinds = /* @__PURE__ */ new Set(["requests", "capabilities", "captures", "preparations", "reservations"]);
var requireKind = (kind) => {
  if (!kinds.has(kind)) fail3("INVALID_INPUT", "unsupported native issuer record kind");
};
function capabilityId(id) {
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    fail3("AUTHORITY_REQUIRED", "an issued capability/request UUID is required");
  }
  return id;
}
function key(root, create) {
  const name = `${lane}/key`;
  const present = existsSync2(safePath(root, name));
  const admission = privateAdmission(root, { admit: create && !present });
  if (admission.errors.length) fail3("INVALID_INPUT", admission.errors.join("; "));
  if (!present) {
    if (!create) fail3("AUTHORITY_REQUIRED", "no native capability issuer has been initialized");
    try {
      exclusiveFile(root, name, randomBytes(32));
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  const bytes = exactFile(root, name);
  if (bytes.length !== 32) fail3("AUTHORITY_REQUIRED", "invalid native issuer key");
  return bytes;
}
function signature(root, payload, create = false) {
  return createHmac("sha256", key(root, create)).update(canonicalJson(payload)).digest("hex");
}
function writeIssued(root, kind, id, payload) {
  requireKind(kind);
  capabilityId(id);
  const value = { payload, mac: signature(root, payload, true) };
  const name = `${lane}/${kind}/${id}.json`;
  if (existsSync2(safePath(root, name))) {
    if (canonicalJson(readIssued(root, kind, id)) !== canonicalJson(payload)) fail3("OPERATION_CONFLICT", "issued identity already has different content");
    return;
  }
  exclusiveFile(root, name, canonicalJson(value));
}
function readIssued(root, kind, id) {
  requireKind(kind);
  capabilityId(id);
  const name = `${lane}/${kind}/${id}.json`;
  if (!existsSync2(safePath(root, name))) fail3("AUTHORITY_REQUIRED", `no issued ${kind} for this identity`);
  const bytes = exactFile(root, name);
  let value;
  try {
    value = JSON.parse(bytes);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    fail3("AUTHORITY_REQUIRED", "issued capability file is malformed");
  }
  if (!value?.payload || typeof value.mac !== "string" || !/^[a-f0-9]{64}$/.test(value.mac) || !timingSafeEqual(Buffer.from(value.mac, "hex"), Buffer.from(signature(root, value.payload), "hex"))) {
    fail3("AUTHORITY_REQUIRED", "capability was not issued by this workspace host");
  }
  return value.payload;
}

// src/core/lib/coordination-runtime/host.mjs
import { isAbsolute as isAbsolute2, join as join2 } from "node:path";

// src/core/lib/coordination-runtime/host-plan.mjs
function validateRoster(roster, profiles) {
  if (!Array.isArray(roster) || !isPlainObject(profiles)) fail("INVALID_INPUT", "host roster/profiles are required");
  const ids = /* @__PURE__ */ new Set();
  for (const entry of roster) {
    assertExactKeys(entry, /* @__PURE__ */ new Set(["id", "role", "model"]), "roster entry");
    text(entry.id, "qualified host id");
    text(entry.role, "roster role");
    if (entry.model !== null) text(entry.model, "roster model");
    if (ids.has(entry.id)) fail("INVALID_INPUT", "duplicate host agent id");
    ids.add(entry.id);
  }
}
function planDispatch({ item, roster, profiles, capabilities, request = {} }) {
  if (!item || typeof item.next_role !== "string") fail("ROLE_UNAVAILABLE", "item has no next role");
  if (!Array.isArray(roster) || roster.some((entry2) => !isPlainObject(entry2))) {
    fail("INVALID_INPUT", "roster must be an array of entries");
  }
  const entries = roster.filter((entry2) => entry2.role === item.next_role);
  if (entries.length !== 1) fail("ROLE_UNAVAILABLE", "exact next role must resolve to one qualified host ID");
  validateRoster(roster, profiles);
  validateCapabilities(capabilities);
  assertExactKeys(request, /* @__PURE__ */ new Set(["role", "profile", "model", "fallbackModel", "effort"]), "dispatch request", /* @__PURE__ */ new Set());
  const profile = profiles[item.next_role];
  const requiredModel = approvedProfileModel(item.next_role, profile);
  if (request.role !== void 0 && request.role !== item.next_role || request.profile !== void 0 && request.profile !== profile) {
    fail("INVALID_INPUT", "requested role/profile is inconsistent with the installed role");
  }
  if (request.model !== void 0 && request.model !== requiredModel || request.fallbackModel !== void 0 && request.fallbackModel !== requiredModel || !capabilities.models.includes(requiredModel)) {
    fail("MODEL_UNAVAILABLE", "required model is unavailable or requested fallback is outside approved policy");
  }
  const [entry] = entries;
  if (!capabilities.modelOverride && entry.model !== requiredModel) {
    fail("MODEL_UNAVAILABLE", "host cannot guarantee the pinned model without a supported override");
  }
  const settings = {};
  if (capabilities.modelOverride) settings.model = requiredModel;
  if (request.effort !== void 0 && request.effort !== null) {
    if (!capabilities.efforts.includes(request.effort)) fail("UNSUPPORTED_HOST", "requested effort override is unsupported");
    settings.effort = request.effort;
  }
  return {
    mode: capabilities.peerDispatch ? "peer-available" : "ordered-queue",
    automatic: false,
    queue: [{
      agentId: entry.id,
      role: item.next_role,
      profile,
      requestedModel: requiredModel,
      settings: clone(settings),
      context: "fresh-single-shot"
    }]
  };
}

// src/core/lib/coordination-runtime/host.mjs
var bindings = /* @__PURE__ */ new WeakMap();
var equal = (left, right) => canonicalJson(left) === canonicalJson(right);
var uncertainEffect = (body) => ["unknown", "conflicting"].includes(body.outcome);
function bindHostRuntime(store, options) {
  assertExactKeys(options, /* @__PURE__ */ new Set([
    "root",
    "authority",
    "roster",
    "profiles",
    "capabilities",
    "maxAttempts",
    "verifyObservation"
  ]), "host runtime", /* @__PURE__ */ new Set(["root", "authority", "roster", "profiles", "capabilities", "maxAttempts"]));
  workspaceManifest(options.root);
  if (!store || store.closed || !isAbsolute2(store.path) || normalized(store.path) !== normalized(join2(options.root, ".kai", "state", "coordination.sqlite"))) {
    fail("INVALID_INPUT", "host workspace must be explicitly bound to this store");
  }
  assertWorkspacePath(options.root, ".kai/state/coordination.sqlite");
  validateAuthority(options.authority);
  validateRoster(options.roster, options.profiles);
  validateCapabilities(options.capabilities);
  if (!Number.isSafeInteger(options.maxAttempts) || options.maxAttempts < 1 || options.maxAttempts > 10) {
    fail("INVALID_INPUT", "trusted maximum attempts must be from 1 through 10");
  }
  if (options.verifyObservation !== void 0 && typeof options.verifyObservation !== "function") {
    fail("INVALID_INPUT", "verifyObservation must be a trusted host function");
  }
  const { verifyObservation, ...data } = options;
  bindings.set(store, { ...clone(data), verifyObservation });
}
function contextFor(store, command, kinds2) {
  const cmd = clone(command);
  validateCommand(cmd);
  if (!kinds2.includes(cmd.kind)) fail("INVALID_INPUT", "incorrect host recording API for command kind");
  const context = bindings.get(store);
  if (!context || store.closed) fail("AUTHORITY_REQUIRED", "bind the trusted host runtime before recording");
  workspaceManifest(context.root);
  requireActorAvailable(cmd, context.authority);
  requireHostActionGrant(cmd, context.authority, cmd.kind);
  return { context, cmd };
}
function actingItem(tx, command, context, target) {
  const p = command.payload;
  const item = tx.get("item", p.itemId);
  if (!item) fail("EVIDENCE_GAP", "host intent requires an existing work item");
  if (item.version !== p.itemVersion) fail("VERSION_CONFLICT", "host intent item version is stale");
  if (!GRANTABLE_STATES.has(item.body.state) || item.body.recovery_hold !== null || item.body.waiting_on_questions.length > 0) {
    fail("RECOVERY_REQUIRED", "work item is not available for host execution");
  }
  if (target.role === "operator" || SHIP_STATES.has(item.body.state) && target.role !== "workflow-ship") {
    fail("AUTHORITY_REQUIRED", "host execution cannot replace the shipping role or the operator");
  }
  requireHostActionGrant({
    ...command,
    recordKind: "item",
    recordId: item.id,
    expectedVersion: item.version
  }, context.authority, command.kind);
  if (item.body.lease !== null) requireLease(item, { ...command, actor: target });
  else if (command.leaseToken !== null) fail("LEASE_CONFLICT", "host intent supplied a lease that no longer exists");
  return item;
}
function noUnresolvedEffects(tx, itemId) {
  if (tx.list("effect", itemId).some((record) => uncertainEffect(record.body))) {
    fail("RECOVERY_REQUIRED", "effect outcome is unresolved; never automatically replay");
  }
}
function resumeContext(tx, context, command, item, planned, previous) {
  const p = command.payload;
  const sameRun = tx.list("host-attempt").filter((record) => record.body.target.runId === p.target.runId);
  if (p.resumeFrom === null) {
    if (sameRun.length) fail("RECOVERY_REQUIRED", "fresh single-shot work requires a fresh host run");
    return { context: "fresh-single-shot", resume_from: null, resume_session_id: null };
  }
  if (!context.capabilities.resume) fail("UNSUPPORTED_HOST", "host resume is unsupported");
  const prior = previous.find((record) => record.id === p.resumeFrom)?.body;
  if (!prior || prior.status !== "failed" || prior.item_version !== item.version || prior.profile !== p.profile || prior.agent_id !== planned.agentId || prior.requested_model !== p.requestedModel || prior.requested_effort !== p.effort || prior.independence_key !== p.independenceKey || !sameActor(prior.target, p.target) || sameRun.some((record) => record.itemId !== item.id || record.body.profile !== p.profile || record.body.target.role !== p.target.role || record.body.independence_key !== p.independenceKey)) {
    fail("RECOVERY_REQUIRED", "resume cannot cross item, role, profile, run or independence boundaries");
  }
  const latest = latestTerminalObservations(prior);
  if (!latest.length || latest.some(({ facts }) => facts.status !== "failed" || !facts.sessionId || facts.actualModel !== p.requestedModel || p.effort !== null && facts.actualEffort !== p.effort)) {
    fail("RECOVERY_REQUIRED", "resume requires verified stopped liveness, session and matching model/effort");
  }
  return { context: "resume", resume_from: p.resumeFrom, resume_session_id: latest[0].facts.sessionId };
}
function recordAttempt(store, command) {
  const { context, cmd } = contextFor(store, command, ["attempt.start"]);
  return applyOperation(store, cmd, (_current, tx) => {
    const p = cmd.payload;
    const item = actingItem(tx, cmd, context, p.target);
    if (p.target.role !== item.body.next_role) fail("INVALID_INPUT", "target must be the item next role");
    const planned = planDispatch({
      item: item.body,
      roster: context.roster,
      profiles: context.profiles,
      capabilities: context.capabilities,
      request: { role: p.target.role, profile: p.profile, model: p.requestedModel, effort: p.effort }
    }).queue[0];
    if (["review", "technical-review"].includes(p.profile) && item.body.producing_actors.some((producer) => producer.runId === p.target.runId)) {
      fail("RECOVERY_REQUIRED", "independent review cannot reuse a producing run");
    }
    if (p.resumeFrom !== null && !context.capabilities.resume) fail("UNSUPPORTED_HOST", "host resume is unsupported");
    noUnresolvedEffects(tx, item.id);
    const previous = tx.list("host-attempt", item.id);
    if (previous.length >= context.maxAttempts || previous.some((record) => ["intent", "uncertain", "conflicting", "mismatched"].includes(record.body.status) || record.body.status === "completed" && record.body.item_version === item.version)) {
      fail("RECOVERY_REQUIRED", "attempt is unresolved, already completed or bounded attempts exhausted; no automatic redispatch");
    }
    const resume = resumeContext(tx, context, cmd, item, planned, previous);
    return {
      schema_version: 1,
      attempt_id: cmd.recordId,
      item_id: item.id,
      item_version: item.version,
      actor: cmd.actor,
      target: p.target,
      agent_id: planned.agentId,
      profile: p.profile,
      requested_model: p.requestedModel,
      requested_effort: p.effort,
      independence_key: p.independenceKey,
      ...resume,
      capabilities: clone(context.capabilities),
      settings: planned.settings,
      created_at: p.createdAt,
      status: "intent",
      observations: [],
      gaps: []
    };
  });
}
function verifiedObservation(context, cmd, handle) {
  const proof = context.verifyObservation?.(clone(cmd), handle);
  if (!proof || typeof proof.then === "function") fail("EVIDENCE_GAP", "verified host capture is required; caller JSON is not observation");
  assertExactKeys(proof, /* @__PURE__ */ new Set([
    "commandDigest",
    "actor",
    "observationId",
    "attemptId",
    "effectId",
    "capturedAt",
    "source",
    "facts"
  ]), "host attestation");
  const effect = cmd.recordKind === "effect";
  if (proof.commandDigest !== commandDigest(cmd) || !sameActor(proof.actor, cmd.actor) || proof.observationId !== cmd.payload.observationId || proof.attemptId !== (effect ? cmd.payload.attemptId : cmd.recordId) || proof.effectId !== (effect ? cmd.recordId : null)) {
    fail("EVIDENCE_GAP", "host capture does not cover this exact command, actor, attempt and effect");
  }
  const observation = {
    observationId: proof.observationId,
    source: proof.source,
    capturedAt: proof.capturedAt,
    facts: sanitizeFacts(proof.facts, effect),
    sessionConflicts: []
  };
  validateHostObservation(observation, effect);
  if (Date.parse(observation.capturedAt) > Date.now()) fail("EVIDENCE_GAP", "host capture cannot be in the future");
  return observation;
}
function appendObservation(body, observation, effect) {
  if (Date.parse(observation.capturedAt) < Date.parse(body.created_at)) fail("EVIDENCE_GAP", "capture predates intent");
  const existing = body.observations.find((entry) => entry.observationId === observation.observationId);
  if (existing && !equal(existing, observation)) fail("OPERATION_CONFLICT", "observation ID already has different facts");
  if (!existing) {
    if (body.observations.length >= MAX_OBSERVATIONS) fail("RECOVERY_REQUIRED", "observation limit reached; reconcile without replay");
    body.observations.push(observation);
  }
  return { ...body, ...effect ? effectSummary(body) : attemptSummary(body) };
}
function recordObservation(store, command, handle, effect) {
  const { context, cmd } = contextFor(store, command, [effect ? "effect.result" : "attempt.result"]);
  const observation = verifiedObservation(context, cmd, handle);
  const receipt = applyOperation(store, cmd, (current, tx) => {
    if (!current) fail("EVIDENCE_GAP", "observation requires a persisted intent");
    if (effect && (current.body.attempt_id !== cmd.payload.attemptId || tx.get("host-attempt", current.body.attempt_id)?.itemId !== current.itemId)) {
      fail("EVIDENCE_GAP", "effect result must bind its exact persisted attempt");
    }
    const retained2 = current.body.observations.find((o) => o.observationId === observation.observationId);
    const sessionConflicts = retained2?.sessionConflicts ?? (effect ? [] : conflictingSessions(tx, current, observation));
    return appendObservation(current.body, { ...observation, sessionConflicts }, effect);
  });
  const retained = receipt.data.record.body.observations.find((o) => o.observationId === observation.observationId);
  if (!retained || !equal({ ...retained, sessionConflicts: [] }, observation)) {
    fail("OPERATION_CONFLICT", "replayed operation has a different verified observation");
  }
  return receipt;
}
function conflictingSessions(tx, current, observation) {
  if (observation.source !== "host" || observation.facts.sessionId === null) return [];
  return tx.list("host-attempt").filter((record) => record.id !== current.id && record.body.observations.some((o) => o.source === "host" && o.facts.sessionId === observation.facts.sessionId) && (current.body.context === "fresh-single-shot" || record.itemId !== current.itemId || !sameActor(record.body.target, current.body.target) || record.body.profile !== current.body.profile || record.body.independence_key !== current.body.independence_key)).map((record) => record.id).sort();
}
function recordHostResult(store, command, observation) {
  return recordObservation(store, command, observation, false);
}
function recordEffect(store, command, observation) {
  if (command?.kind === "effect.result") return recordObservation(store, command, observation, true);
  const { context, cmd } = contextFor(store, command, ["effect.intent"]);
  return applyOperation(store, cmd, (_current, tx) => {
    const p = cmd.payload;
    const attempt = tx.get("host-attempt", p.attemptId);
    if (!attempt || attempt.itemId !== p.itemId) fail("EVIDENCE_GAP", "effect intent requires the exact persisted host attempt");
    const item = actingItem(tx, cmd, context, attempt.body.target);
    if (attempt.body.item_version !== item.version || attempt.body.status !== "intent") {
      fail("RECOVERY_REQUIRED", "effect intent requires a current, unresolved execution intent");
    }
    noUnresolvedEffects(tx, item.id);
    if (tx.list("effect", item.id).some((record) => p.idempotencyKey !== null && record.body.idempotency_key === p.idempotencyKey)) {
      fail("OPERATION_CONFLICT", "effect idempotency key is already retained; reconcile its result");
    }
    const body = {
      schema_version: 1,
      effect_id: cmd.recordId,
      attempt_id: p.attemptId,
      item_id: item.id,
      item_version: item.version,
      actor: cmd.actor,
      intended_action: p.intendedAction,
      idempotency_key: p.idempotencyKey,
      external: p.external,
      paid: p.paid,
      created_at: p.createdAt,
      observations: []
    };
    return { ...body, ...effectSummary(body) };
  });
}

// src/core/lib/coordination-runtime/host-composition.mjs
function createTrustedEmbedding({
  identity,
  authorize,
  runs,
  verifyCapture,
  verifyOperatorDecision,
  verifyObservation,
  roster = [],
  profiles = {},
  capabilities,
  maxAttempts = 3
}) {
  if (typeof identity !== "function" || typeof authorize !== "function" || typeof runs !== "function") {
    throw new RuntimeError("INVALID_INPUT", "trusted embedding requires identity, authorize and runs functions");
  }
  return {
    async apply({ root, store, command, options = {} }) {
      validateCommand(command);
      const actual = identity();
      if (!actual || actual !== command.actor.runId) {
        throw new RuntimeError("AUTHORITY_REQUIRED", "command actor must use the actual current host context ID");
      }
      const authority = await authorize({ root, store, command, options });
      const approvedRuns = await runs({ root, actor: command.actor });
      if (!approvedRuns.every((run) => sameActor(run.actor, command.actor))) {
        throw new RuntimeError("AUTHORITY_REQUIRED", "embedding must not relabel another producing context");
      }
      bindEvidenceRuntime(store, {
        root,
        authority,
        runs: approvedRuns,
        verifyCapture,
        verifyOperatorDecision
      });
      const producer = {
        "artifact.register": registerArtifact,
        "asset.transition": transitionAsset,
        "evidence.register": (s, c) => registerEvidence(s, c, options.capture),
        "review.record": recordReview,
        "approval.record": recordApproval
      }[command.kind];
      if (producer) return producer(store, command);
      if (["attempt.start", "attempt.result", "effect.intent", "effect.result"].includes(command.kind)) {
        bindHostRuntime(store, { root, authority, roster, profiles, capabilities, maxAttempts, verifyObservation });
        if (command.kind === "attempt.start") return recordAttempt(store, command);
        if (command.kind === "attempt.result") return recordHostResult(store, command, options.capture);
        return recordEffect(store, command, options.capture);
      }
      return applyCommand(store, command, authority);
    }
  };
}

// src/core/lib/coordination-runtime/native-context.mjs
var fail4 = (message) => {
  throw new RuntimeError("AUTHORITY_REQUIRED", message);
};
async function verifyNativeContext({ env, root, preparation, reservedAt }) {
  const id = contextIdentity(env);
  if (id !== preparation.actor.runId) fail4("prepared role belongs to another actual host context");
  let start, agent, firstModelAt;
  for await (const { event } of nativeEvents(env, ["session.start", "subagent.selected", "assistant.turn_start"])) {
    if (event.agentId) continue;
    if (event.type === "session.start") {
      if (start) fail4("standalone context has ambiguous session starts");
      start = {
        id: event.id,
        timestamp: event.timestamp,
        sessionId: event.data?.sessionId,
        version: event.data?.copilotVersion,
        cwd: event.data?.context?.cwd
      };
    } else if (event.type === "subagent.selected") {
      agent = event.data?.agentName;
    } else {
      if (!start || agent !== preparation.agentId) fail4("native model turn did not start in its prepared role");
      if (firstModelAt === void 0) firstModelAt = event.timestamp;
    }
  }
  if (!start || start.sessionId !== id || start.version !== "1.0.85" || typeof start.cwd !== "string" || normalized(start.cwd) !== normalized(root) || agent !== preparation.agentId) fail4("native session identity, workspace or selected agent does not match its preparation");
  if (!Number.isFinite(Date.parse(start.timestamp)) || Date.parse(start.timestamp) > Date.parse(firstModelAt) || !Number.isFinite(Date.parse(firstModelAt)) || !Number.isFinite(Date.parse(reservedAt)) || Date.parse(firstModelAt) < Date.parse(reservedAt) || Date.parse(firstModelAt) > Date.now()) {
    fail4("native model work must start after its persisted reservation/delegation");
  }
  return {
    sessionId: id,
    agentId: agent,
    firstModelAt,
    reservedAt,
    reference: `host:copilot:${id}:${start.id}`
  };
}

// src/core/lib/coordination-runtime/native-routing.mjs
var routingActions = /* @__PURE__ */ new Set([
  "item.grant",
  "item.promote",
  "item.update",
  "item.handoff",
  "question.open",
  "question.answer"
]);
var delegatedActions = /* @__PURE__ */ new Set(["question.answer", "item.handoff"]);
var fail5 = (message) => {
  throw new RuntimeError("AUTHORITY_REQUIRED", message);
};
function routingBasis(root, store, item) {
  return {
    criteria: criteriaRef(item.body),
    inputs: captureInputBasis(
      { root },
      { get: (kind, id) => readRecord(store, kind, id) },
      item.body.context_artifacts
    ),
    initiative: item.body.initiative,
    scopeAuthority: item.body.scope_authority,
    touches: item.body.touches,
    dependencies: item.body.depends_on
  };
}
function requireRoutingScope(root, store, cap, command = null) {
  const scope = cap.request.scope;
  const item = readRecord(store, "item", scope.itemId);
  if (!item || canonicalJson(routingBasis(root, store, item)) !== canonicalJson(cap.request.routingBasis)) {
    fail5("coordinator/delegation criteria, inputs or work scope changed");
  }
  if (!command) return item;
  if (command.recordKind !== "item" || command.recordId !== scope.itemId || !scope.actions.includes(command.kind) || !routingActions.has(command.kind)) fail5("bounded routing does not grant this domain action");
  if (command.kind === "item.handoff" && (command.payload.state !== null || command.payload.subject !== void 0)) {
    fail5("bounded routing cannot supply a new subject or domain/acceptance transition");
  }
  if (command.kind === "item.update" && Object.keys(command.payload.changes ?? command.payload).some((k) => !["next_role", "priority", "title", "updated_at"].includes(k))) {
    fail5("bounded routing cannot change requirements, inputs or product scope");
  }
  if (command.kind === "question.answer") {
    const question = readRecord(store, "question", command.payload.questionId);
    if (!question || question.itemId !== item.id || question.body.recipient !== command.actor.role || command.actor.role === "operator" || command.payload.content.resolves || scope.type === "delegation" && command.payload.questionId !== scope.questionId) {
      fail5("bounded answer requires the exact addressed non-operator question; conflict resolution needs separate authority");
    }
  }
  return item;
}

// src/core/lib/coordination-runtime/native-host.mjs
var fail6 = (code, message) => {
  throw new RuntimeError(code, message);
};
var hash = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
var exact = (value, keys, label) => assertExactKeys(value, new Set(keys), label);
var manifestHash = (root) => hash(JSON.parse(exactFile(root, ".kai/manifest.json")));
var runActions = new Set([...COMMAND_KINDS].filter((k) => !k.startsWith("initiative.") && !k.startsWith("attempt.") && !k.startsWith("effect.") && k !== "item.create"));
var commandActions = (command) => [command.kind, ...command.kind === "item.handoff" && command.payload.state !== null ? ["item.transition"] : []];
function currentBasis(root, id) {
  const store = openStore({ path: safePath(root, DATABASE), mode: "read" });
  try {
    const item = readRecord(store, "item", id) ?? fail6("EVIDENCE_GAP", "run scope requires an existing item");
    return itemBasis(root, store, item);
  } finally {
    closeStore(store);
  }
}
function itemBasis(root, store, item) {
  return {
    subject: item.body.change_ref,
    criteria: criteriaRef(item.body),
    inputs: captureInputBasis({ root }, { get: (kind, id) => readRecord(store, kind, id) }, item.body.context_artifacts)
  };
}
function commandBasis(root, store, command) {
  const item = readRecord(store, "item", command.recordId) ?? fail6("EVIDENCE_GAP", "command scope requires an existing item");
  const changes = command.kind === "item.update" ? command.payload.changes : null;
  if (!changes || !Object.hasOwn(changes, "context_artifacts")) return itemBasis(root, store, item);
  if (command.actor.role !== item.body.scope_authority) {
    fail6("AUTHORITY_REQUIRED", "prospective context replacement requires the actual scope owner decision");
  }
  const prospective = validateRecord({ ...item, body: { ...item.body, ...changes } });
  const tx = { get: (kind, id) => readRecord(store, kind, id) };
  const priorBasis = { subject: item.body.change_ref, criteria: criteriaRef(item.body), inputs: [], gaps: [] };
  for (const reference of [...new Set(item.body.context_artifacts)].sort()) {
    try {
      priorBasis.inputs.push(...captureInputBasis({ root }, tx, [reference]));
    } catch (error) {
      if (!(error instanceof RuntimeError) || error.code !== "EVIDENCE_GAP") throw error;
      priorBasis.gaps.push({ reference, code: error.code, message: error.message });
    }
  }
  return { priorBasis, prospectiveBasis: itemBasis(root, store, prospective) };
}
function requestCommandBasis(root, command) {
  const store = openStore({ path: safePath(root, DATABASE), mode: "read" });
  try {
    return commandBasis(root, store, command);
  } finally {
    closeStore(store);
  }
}
function visibleRequest(payload) {
  const { nonce, createdAt, expiresAt, ...scope } = payload;
  return {
    ...payload,
    message: `Kai operator authorization
Workspace: ${payload.root}
Nonce: ${nonce}
Scope (exact JSON):
${canonicalJson(scope)}
Expires: ${expiresAt}
Approve only this actor, workspace, subject, criteria and action. Reply exactly APPROVE ${nonce} or DECLINE ${nonce}. Conditional/freeform replies do not authorize work.`,
    requestedSchema: { type: "object", properties: { decision: {
      type: "string",
      enum: [`APPROVE ${nonce}`, `DECLINE ${nonce}`]
    } }, required: ["decision"], additionalProperties: false }
  };
}
async function captureReceipt(env, request, toolCallId) {
  const receipt = await readNativeTool({
    env,
    toolCallId,
    toolNames: ["powershell"],
    matchesStart: (args) => args?.command === request.command
  });
  if (receipt.start.arguments?.command !== request.command || receipt.start.arguments.mode === "async" || Date.parse(receipt.start.timestamp) < Date.parse(request.createdAt) || receipt.complete.success !== true) {
    fail6("EVIDENCE_GAP", "capture requires the exact completed native command issued after its scoped intent; no automatic execution/retry");
  }
  return receipt;
}
function createNativeHost({ env = process.env, discover } = {}) {
  const identity = () => contextIdentity(env);
  const discovery = async (root, role) => discover ? discover({ root, role }) : (await import("./chunk-7OKIIWCH.mjs")).discoverCopilot({ root, env, role });
  const ensureIdentity = (actor) => {
    validateActor(actor);
    if (actor.runId !== identity()) fail6("AUTHORITY_REQUIRED", "actor runId must match COPILOT_AGENT_SESSION_ID; role relabeling does not create independence");
  };
  function capability(root, id, currentContext = true) {
    const cap = readIssued(root, "capabilities", id);
    if (cap.request.root !== root || cap.request.workspaceManifest !== manifestHash(root) || Date.parse(cap.request.expiresAt) <= Date.now()) fail6("AUTHORITY_REQUIRED", "issued capability expired or workspace binding changed");
    if (currentContext && cap.request.requesterContext !== identity()) fail6("AUTHORITY_REQUIRED", "capability belongs to a different actual host context");
    return cap;
  }
  function preparation(root, actor) {
    const prepared = readIssued(root, "preparations", actor.runId);
    if (!sameActor(prepared.actor, actor) || prepared.root !== root || prepared.workspaceManifest !== manifestHash(root) || Date.parse(prepared.expiresAt) <= Date.now()) {
      fail6("AUTHORITY_REQUIRED", "native preparation actor, workspace or lifetime does not match");
    }
    return prepared;
  }
  async function delegatedContext(root, store, cap, command) {
    const scope = cap.request.scope;
    const parent = capability(root, cap.parentCapability, false);
    if (parent.request.scope.type !== "coordination" || parent.request.scope.itemId !== scope.itemId || scope.actions.some((a) => !delegatedActions.has(a) || !parent.request.scope.actions.includes(a))) {
      fail6("AUTHORITY_REQUIRED", "delegation is not a bounded subset of an actual coordinator grant");
    }
    requireRoutingScope(root, store, parent);
    requireRoutingScope(root, store, cap, command);
    const prepared = preparation(root, scope.actor);
    const context = await verifyNativeContext({ env, root, preparation: prepared, reservedAt: cap.request.createdAt });
    return { prepared, context };
  }
  async function leaseContext(root, store, actor, itemId, token) {
    const item = readRecord(store, "item", itemId);
    const lease = item?.body.lease;
    const grant = lease && lease.token === token && sameActor(lease.holder, actor) && Date.parse(lease.expires_at) > Date.now() && listRecords(store, { kind: "grant", itemId }).find((r) => sameActor(r.body.actor, actor) && r.body.lease_token === token && r.body.status === "active" && Date.parse(r.body.expires_at) > Date.now());
    if (!grant) fail6("AUTHORITY_REQUIRED", "the actual actor must hold a live persisted lease or bounded delegation");
    const reserved = readIssued(root, "reservations", token);
    if (reserved.itemId !== itemId || !sameActor(reserved.actor, actor) || reserved.leaseToken !== token) {
      fail6("AUTHORITY_REQUIRED", "native reservation is not bound to this persisted lease");
    }
    const prepared = preparation(root, actor);
    const context = await verifyNativeContext({ env, root, preparation: prepared, reservedAt: reserved.reservedAt });
    return { prepared, context, grant, leaseToken: token };
  }
  return {
    async capabilities({ root }) {
      return { discovery: await discovery(root) };
    },
    async prepare({ root, body }) {
      exact(body, ["role"], "native preparation");
      if (typeof body.role !== "string" || !body.role || body.role === "operator") fail6("INVALID_INPUT", "prepare requires a non-operator native role");
      const requesterContext = identity();
      const catalog = await discovery(root, body.role);
      const actor = catalog.prepared?.actor;
      if (!actor || actor.role !== body.role || !catalog.roster.some((r) => r.id === catalog.prepared.agentId && r.role === actor.role) || catalog.modelPromptSent !== false || catalog.transportClosed !== true) {
        fail6("UNSUPPORTED_HOST", "host did not supply a metadata-only prepared native context");
      }
      const id = capabilityId(actor.runId);
      const prepared = {
        id,
        actor,
        agentId: catalog.prepared.agentId,
        root,
        workspaceManifest: manifestHash(root),
        requesterContext,
        catalog,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: new Date(Date.now() + 36e5).toISOString(),
        reserved: false
      };
      writeIssued(root, "preparations", id, prepared);
      const launch = copilotLaunch(env);
      return {
        preparation: prepared,
        discovery: catalog,
        launch: { executable: launch.executable, arguments: [`--session-id=${id}`, `--agent=${prepared.agentId}`, ...launch.pluginArguments] },
        instruction: "Metadata only; not permission to start model work. First persist item.grant or delegate to this actor. Then launch this standalone context in this workspace using these identity arguments and existing host permissions. Its first command should be claim. Native ACP metadata-only sessions are not promised to survive transport closure."
      };
    },
    async delegate({ root, store, body, options }) {
      exact(body, ["actor", "itemId", "preparation", "actions", "questionId"], "role delegation");
      ensureIdentity(body.actor);
      const parent = capability(root, options.capability);
      if (parent.request.scope.type !== "coordination" || !sameActor(parent.request.scope.actor, body.actor) || parent.request.scope.itemId !== body.itemId || !Array.isArray(body.actions) || !body.actions.length || new Set(body.actions).size !== body.actions.length || body.actions.some((a) => !delegatedActions.has(a) || !parent.request.scope.actions.includes(a))) {
        fail6("AUTHORITY_REQUIRED", "delegation requires an already-authorized coordinator and explicit bounded role-owned actions");
      }
      const item = requireRoutingScope(root, store, parent);
      const prepared = readIssued(root, "preparations", body.preparation);
      preparation(root, prepared.actor);
      if (prepared.requesterContext !== identity()) fail6("AUTHORITY_REQUIRED", "only the preparing coordinator can delegate this context");
      const question = body.questionId === null ? null : readRecord(store, "question", body.questionId);
      if (body.actions.includes("question.answer") && (!question || question.itemId !== body.itemId || question.body.recipient !== prepared.actor.role || prepared.actor.role === "operator")) {
        fail6("AUTHORITY_REQUIRED", "answer delegation must bind the actual addressed role and question");
      }
      if (!body.actions.includes("question.answer") && body.questionId !== null) fail6("INVALID_INPUT", "question binding is only for an answer delegation");
      if (!question && ![item.body.next_role, item.body.scope_authority].includes(prepared.actor.role)) {
        fail6("AUTHORITY_REQUIRED", "handoff delegation must be assigned to the current routed role or scope owner");
      }
      const nonce = randomUUID();
      const request = {
        nonce,
        root,
        workspaceManifest: manifestHash(root),
        requesterContext: prepared.actor.runId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: new Date(Math.min(
          Date.parse(parent.request.expiresAt),
          Date.parse(prepared.expiresAt)
        )).toISOString(),
        routingBasis: parent.request.routingBasis,
        scope: {
          type: "delegation",
          actor: prepared.actor,
          itemId: body.itemId,
          actions: body.actions,
          questionId: body.questionId
        }
      };
      writeIssued(root, "capabilities", nonce, { request, parentCapability: options.capability, catalog: prepared.catalog });
      return { capability: nonce, actor: prepared.actor, expiresAt: request.expiresAt, reservedAt: request.createdAt };
    },
    async claim({ root, store, options }) {
      const prepared = readIssued(root, "preparations", identity());
      preparation(root, prepared.actor);
      if (options.capability) {
        const cap = capability(root, options.capability);
        if (cap.request.scope.type !== "delegation" || cap.request.scope.itemId !== options.item || !sameActor(cap.request.scope.actor, prepared.actor)) fail6("AUTHORITY_REQUIRED", "claim requires this prepared actor and exact delegated item");
        const { context } = await delegatedContext(root, store, cap);
        return { actor: prepared.actor, context, actions: cap.request.scope.actions, leaseToken: null };
      }
      const lease = readRecord(store, "item", options.item)?.body.lease;
      const bound = await leaseContext(root, store, prepared.actor, options.item, lease?.token);
      return { actor: prepared.actor, context: bound.context, actions: bound.grant.body.actions, leaseToken: bound.leaseToken };
    },
    async request({ root, body }) {
      const requesterContext = identity();
      const payload = {
        nonce: randomUUID(),
        root,
        workspaceManifest: manifestHash(root),
        requesterContext,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1e3).toISOString(),
        scope: body
      };
      if (body.type === "command") {
        exact(body, ["type", "command"], "command request");
        validateCommand(body.command);
        ensureIdentity(body.command.actor);
        payload.subject = body.command.payload.body?.subject ?? body.command.payload.subject ?? null;
        payload.criteria = body.command.payload.body?.criteria_ref ?? null;
        payload.action = body.command.kind;
        if (body.command.recordKind === "item" && body.command.expectedVersion > 0) {
          Object.assign(payload, requestCommandBasis(root, body.command));
        }
      } else if (body.type === "coordination") {
        exact(body, ["type", "actor", "itemId", "actions"], "coordination request");
        ensureIdentity(body.actor);
        if (body.actor.role === "operator" || !Array.isArray(body.actions) || !body.actions.length || new Set(body.actions).size !== body.actions.length || body.actions.some((a) => !routingActions.has(a))) {
          fail6("INVALID_INPUT", "coordination actions must be explicit non-operator routing actions, not acceptance");
        }
        const store = openStore({ path: safePath(root, DATABASE), mode: "read" });
        try {
          const item = readRecord(store, "item", body.itemId) ?? fail6("EVIDENCE_GAP", "coordination requires an existing item");
          payload.routingBasis = routingBasis(root, store, item);
        } finally {
          closeStore(store);
        }
        payload.action = body.actions;
      } else if (body.type === "run") {
        exact(body, ["type", "actor", "itemId", "actions"], "run request");
        ensureIdentity(body.actor);
        if (body.actor.role === "operator" || !Array.isArray(body.actions) || !body.actions.length || new Set(body.actions).size !== body.actions.length || body.actions.some((a) => !runActions.has(a))) {
          fail6("INVALID_INPUT", "run actions must be explicit supported item actions for a non-operator");
        }
        Object.assign(payload, currentBasis(root, body.itemId), { action: body.actions });
      } else if (body.type === "maintenance") {
        exact(body, ["type", "action"], "maintenance request");
        if (!["init", "migrate", "recover-activate", "recover-abandon", "rollback"].includes(body.action)) fail6("INVALID_INPUT", "unsupported maintenance action");
        payload.subject = payload.workspaceManifest;
        payload.criteria = null;
        payload.action = body.action;
      } else if (body.type === "repair") {
        exact(body, ["type", "request"], "repair decision request");
        exact(body.request, ["operationId", "sourceId", "expectedVersion", "actor", "reason", "body"], "repair request");
        ensureIdentity(body.request.actor);
        payload.subject = hash(body.request);
        payload.criteria = null;
        payload.action = "repair";
      } else if (body.type === "capture") {
        exact(body, ["type", "actor", "itemId", "command", "checks", "classification"], "capture request");
        ensureIdentity(body.actor);
        if (typeof body.command !== "string" || !body.command.trim() || Buffer.byteLength(body.command) > 32 * 1024 || !Array.isArray(body.checks) || body.checks.length > 64 || body.checks.some((c) => typeof c !== "string" || !c.trim() || c.length > 256) || new Set(body.checks).size !== body.checks.length || !CLASSIFICATIONS.has(body.classification) || body.itemId !== null && (typeof body.itemId !== "string" || !body.itemId)) {
          fail6("INVALID_INPUT", "capture needs an exact PowerShell command, bounded check labels, classification and itemId|null");
        }
        if (body.itemId !== null) Object.assign(payload, currentBasis(root, body.itemId));
        else {
          payload.subject = null;
          payload.criteria = null;
          payload.inputs = [];
        }
        const request2 = {
          ...payload,
          command: `# Kai capture ${payload.nonce}
${body.command}`,
          instruction: "Run this exact command once through the existing authorized native PowerShell tool. This request neither authorizes nor executes it. Then use receipt/capture with this request nonce; --tool-call is optional when known. Never replay an uncertain effect."
        };
        writeIssued(root, "requests", request2.nonce, request2);
        return { request: request2 };
      } else fail6("INVALID_INPUT", "request type must be command, run, coordination, maintenance, repair or capture");
      const request = visibleRequest(payload);
      writeIssued(root, "requests", request.nonce, request);
      return { request };
    },
    async receipt({ root, options }) {
      const request = readIssued(root, "requests", options.request);
      if (request.root !== root || request.workspaceManifest !== manifestHash(root) || Date.parse(request.expiresAt) <= Date.now()) fail6("AUTHORITY_REQUIRED", "request expired or workspace changed");
      if (request.scope.type === "capture") {
        if (request.requesterContext !== identity()) fail6("AUTHORITY_REQUIRED", "capture receipt belongs to another context");
        const receipt2 = await captureReceipt(env, request, options["tool-call"]);
        return { receipt: {
          toolCallId: receipt2.toolCallId,
          sessionId: receipt2.sessionId,
          startEventId: receipt2.start.id,
          completeEventId: receipt2.complete.id,
          capturedAt: receipt2.complete.timestamp
        } };
      }
      const receipt = await matchHumanDecision({ env, request, toolCallId: options["tool-call"] });
      return { receipt };
    },
    async authorize({ root, options }) {
      const request = readIssued(root, "requests", options.request);
      if (request.scope.type === "capture") fail6("INVALID_INPUT", "capture intents are not authorization requests");
      if (request.scope.type === "coordination" && request.scope.actions.some((action) => !routingActions.has(action))) {
        fail6("INVALID_INPUT", "coordination request contains unsupported routing actions; issue a new supported request");
      }
      if (request.root !== root || request.workspaceManifest !== manifestHash(root) || Date.parse(request.expiresAt) <= Date.now()) {
        fail6("AUTHORITY_REQUIRED", "request expired or workspace changed");
      }
      const receipt = await matchHumanDecision({ env, request, toolCallId: options["tool-call"] });
      const actor = request.scope.command?.actor ?? request.scope.actor ?? request.scope.request?.actor;
      let catalog;
      if (existsSync3(safePath(root, `.kai/state/host/capabilities/${request.nonce}.json`))) {
        const existing = readIssued(root, "capabilities", request.nonce);
        if (canonicalJson(existing.request) !== canonicalJson(request) || canonicalJson(existing.receipt) !== canonicalJson(receipt)) {
          fail6("OPERATION_CONFLICT", "this nonce already has a different issued decision receipt");
        }
        catalog = existing.catalog;
      } else catalog = await discovery(root);
      if (actor && actor.role !== "operator" && !catalog.roster.some((entry) => entry.role === actor.role)) {
        fail6("ROLE_UNAVAILABLE", "requested actor role is not in the actual host roster");
      }
      writeIssued(root, "capabilities", request.nonce, { request, receipt, catalog });
      return {
        capability: request.nonce,
        actor: actor ?? null,
        expiresAt: request.expiresAt,
        receipt: { reference: receipt.reference, captured_at: receipt.captured_at }
      };
    },
    async maintenance({ root, verb, body, options }) {
      const cap = capability(root, options.capability);
      const action = verb === "recover" ? `recover-${options.action}` : verb;
      if (verb === "repair") {
        if (cap.request.scope.type !== "repair" || canonicalJson(cap.request.scope.request) !== canonicalJson(body)) {
          fail6("AUTHORITY_REQUIRED", "repair requires a matched decision for the exact repair request");
        }
        ensureIdentity(body.actor);
        assertWorkspaceWrite(safePath(root, DATABASE), { requirePrivate: true });
        const store2 = openStore({ path: safePath(root, DATABASE), mode: "write" });
        try {
          bindMigrationRepair(store2, {
            root,
            roles: cap.catalog.roster.map((e) => e.role),
            verify: ({ request }) => canonicalJson(request) === canonicalJson(body)
          });
          return repairLegacyRecord(store2, body);
        } finally {
          closeStore(store2);
        }
      }
      if (options.confirm !== true || cap.request.scope.type !== "maintenance" || cap.request.scope.action !== action) {
        fail6("AUTHORITY_REQUIRED", "maintenance requires --confirm and an issued capability for the exact action");
      }
      if (verb === "migrate") return migrateWorkspace({ root, confirm: true, roles: cap.catalog.roster.map((e) => e.role), env });
      if (verb === "recover") {
        if (!existsSync3(safePath(root, LOCK))) fail6("RECOVERY_REQUIRED", "no interrupted migration lock exists; recovery never initializes or retries work");
        return recoverMigration({ root, confirm: true, action: options.action, env });
      }
      if (verb === "rollback") return rollbackMigration({ root, confirm: true, env });
      migrationManifest(root, [4], env);
      const path = safePath(root, DATABASE);
      if (existsSync3(path)) fail6("VERSION_CONFLICT", "store already exists; init never replaces or repairs it");
      const privacy = privateAdmission(root, { admit: true });
      if (privacy.errors.length) fail6("INVALID_INPUT", privacy.errors.join("; "));
      assertWorkspaceWrite(path, { requirePrivate: true });
      const store = openStore({ path, mode: "create" });
      closeStore(store);
      return { initialized: true, databasePath: path, privateAdmission: privacy.admitted };
    },
    async apply({ root, store, command, options }) {
      ensureIdentity(command.actor);
      const cap = options.capability ? capability(root, options.capability) : null;
      let catalog, grants = [];
      if (cap) {
        const scope = cap.request.scope;
        if (scope.type === "command") {
          if (canonicalJson(scope.command) !== canonicalJson(command)) fail6("AUTHORITY_REQUIRED", "command capability does not cover these exact command bytes");
          if (cap.request.prospectiveBasis) {
            const priorReceipt = readOperationReceipt(store, command);
            if (priorReceipt) return priorReceipt;
            if (canonicalJson(commandBasis(root, store, command)) !== canonicalJson({
              priorBasis: cap.request.priorBasis,
              prospectiveBasis: cap.request.prospectiveBasis
            })) fail6("EVIDENCE_GAP", "prospective replacement or explicit prior basis gaps changed after decision");
          } else if (cap.request.inputs) {
            const current = readRecord(store, "item", command.recordId);
            const basis = current && itemBasis(root, store, current);
            if (!basis || canonicalJson(basis.inputs) !== canonicalJson(cap.request.inputs)) fail6("EVIDENCE_GAP", "command capability applicable input basis changed");
          }
        } else if (scope.type === "run") {
          const item = readRecord(store, "item", scope.itemId);
          if (!sameActor(scope.actor, command.actor) || command.recordKind !== "item" || command.recordId !== scope.itemId || commandActions(command).some((action) => !scope.actions.includes(action)) || !item || canonicalJson(itemBasis(root, store, item)) !== canonicalJson({
            subject: cap.request.subject,
            criteria: cap.request.criteria,
            inputs: cap.request.inputs
          })) {
            fail6("AUTHORITY_REQUIRED", "run capability does not cover the actor, action, subject and current input criteria");
          }
          if (command.kind === "approval.record" && item.body.artifact_class === "paid-media") {
            fail6("AUTHORITY_REQUIRED", "paid-media approval requires a command-specific actual human decision");
          }
        } else if (scope.type === "coordination" || scope.type === "delegation") {
          if (!sameActor(scope.actor, command.actor)) fail6("AUTHORITY_REQUIRED", "routing capability belongs to a different role/context");
          requireRoutingScope(root, store, cap, command);
          if (scope.type === "delegation") await delegatedContext(root, store, cap, command);
        } else fail6("AUTHORITY_REQUIRED", "not an execution capability");
        catalog = cap.catalog;
        grants = [{
          actor: command.actor,
          actions: commandActions(command),
          recordKind: command.recordKind,
          recordId: command.recordId,
          basisRef: `${command.recordKind}/${command.recordId}@${command.expectedVersion}`
        }];
        if (["attempt.start", "effect.intent"].includes(command.kind)) grants.push({
          actor: command.actor,
          actions: [command.kind],
          recordKind: "item",
          recordId: command.payload.itemId,
          basisRef: `item/${command.payload.itemId}@${command.payload.itemVersion}`
        });
      } else {
        const bound = await leaseContext(root, store, command.actor, command.recordId, command.leaseToken);
        if (commandActions(command).some((a) => !bound.grant.body.actions.includes(a))) fail6("AUTHORITY_REQUIRED", "lease does not authorize the complete command");
        catalog = bound.prepared.catalog;
      }
      if (command.kind === "item.grant") preparation(root, command.payload.holder);
      let capture;
      if (options.capture) capture = readIssued(root, "captures", options.capture);
      const decision = () => {
        if (!cap || cap.request.scope.type !== "command" || command.kind !== "approval.record") return null;
        const { source, reference, attributed_to, captured_at } = cap.receipt;
        const b = command.payload.body;
        return { source, reference, attributed_to, captured_at, ...Object.fromEntries(
          ["item_id", "subject", "criteria_ref", "kind", "decision", "deployment", "recovery"].map((k) => [k, b[k]])
        ) };
      };
      const embedding = createTrustedEmbedding({
        identity,
        authorize: () => ({ roles: catalog.roster.map((e) => e.role), grants }),
        runs: ({ actor }) => [{ actor, directory: `.kai/runs/native/${actor.runId}` }],
        verifyCapture: (c) => {
          if (!capture || capture.type !== "command" || !sameActor(capture.actor, c.actor) || capture.root !== root || capture.itemId !== c.recordId || canonicalJson(capture.subject) !== canonicalJson(c.payload.body.subject) || capture.criteria !== c.payload.body.criteria_ref || canonicalJson(capture.inputs) !== canonicalJson(itemBasis(root, store, readRecord(store, "item", c.recordId)).inputs)) {
            fail6("EVIDENCE_GAP", "no host-owned capture for this actor, item, subject and current input criteria");
          }
          return { ...capture.proof, command_digest: commandDigest(c) };
        },
        verifyOperatorDecision: decision,
        verifyObservation: () => {
          fail6("UNSUPPORTED_HOST", "native terminal tool receipts do not prove peer model execution or external effect outcome; bind an actual host-owned observation registry through createTrustedEmbedding");
        },
        roster: catalog.roster,
        profiles: catalog.profiles,
        capabilities: catalog.capabilities
      });
      const result = await embedding.apply({ root, store, command, options });
      const lease = command.kind === "item.grant" && result.data.record.body.lease;
      if (lease) {
        const name = `.kai/state/host/reservations/${lease.token}.json`;
        if (!existsSync3(safePath(root, name))) writeIssued(root, "reservations", lease.token, {
          itemId: command.recordId,
          actor: lease.holder,
          leaseToken: lease.token,
          operationId: command.operationId,
          reservedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        else readIssued(root, "reservations", lease.token);
      }
      return result;
    },
    async plan({ root, store, itemId }) {
      const catalog = await discovery(root);
      const item = readRecord(store, "item", itemId) ?? fail6("EVIDENCE_GAP", "item does not exist");
      return {
        ...planDispatch({ item: item.body, ...catalog }),
        gap: "No automatic peer dispatch or effect replay. For each queued native role: prepare, persist item.grant or delegate, then launch the standalone --session-id context with existing host permissions. Inspect claim before acting; metadata preparation alone does not authorize model work."
      };
    },
    async capture({ root, body, options }) {
      exact(body, ["requestId"], "capture delivery");
      const request = readIssued(root, "requests", body.requestId);
      if (request.scope.type !== "capture" || request.root !== root || request.workspaceManifest !== manifestHash(root) || request.requesterContext !== identity() || Date.parse(request.expiresAt) <= Date.now()) fail6("AUTHORITY_REQUIRED", "capture request is not current for this workspace and host context");
      const receipt = await captureReceipt(env, request, options["tool-call"]);
      const result = receipt.complete.content;
      if (typeof result !== "string" || Buffer.byteLength(result) > 1024 * 1024) fail6("EVIDENCE_GAP", "native command result is missing or exceeds 1 MiB; capture a bounded existing check");
      for (const line of result.split(/\r?\n/)) {
        let event;
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }
        if (typeof event?.type === "string" && /^(assistant|model|session|user)\./.test(event.type)) {
          fail6("UNSUPPORTED_HOST", "native model/event streams require an allowlisted host-owned observation adapter; command capture never retains reasoning/cache internals");
        }
      }
      const exit = /(?:^|\n)<shellId: [^\r\n<>]+ completed with exit code (-?\d+)>\s*$/.exec(result);
      if (!exit || !Number.isSafeInteger(Number(exit[1]))) {
        fail6("UNSUPPORTED_HOST", "native command is partial or has an unsupported completion format; inspect/reconcile it, never automatically replay");
      }
      const proof = {
        source: "host-command",
        reference: `host:copilot:${receipt.sessionId}:${receipt.complete.id}`,
        actor: request.scope.actor,
        captured_at: receipt.complete.timestamp,
        command: ["powershell", "-Command", receipt.start.arguments.command],
        exit_code: Number(exit[1]),
        checks: request.scope.checks,
        classification: request.scope.classification
      };
      const capture = {
        type: "command",
        root,
        actor: request.scope.actor,
        itemId: request.scope.itemId,
        subject: request.subject,
        criteria: request.criteria,
        inputs: request.inputs,
        proof,
        result,
        toolCallId: receipt.toolCallId,
        startEventId: receipt.start.id,
        completeEventId: receipt.complete.id
      };
      writeIssued(root, "captures", request.nonce, capture);
      return {
        capture: request.nonce,
        exitCode: proof.exit_code,
        capturedAt: proof.captured_at,
        capturedCommand: receipt.start.arguments.command,
        reference: proof.reference,
        classification: proof.classification,
        resultBytes: Buffer.byteLength(result)
      };
    }
  };
}
export {
  createNativeHost
};

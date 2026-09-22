import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);

// src/core/lib/coordination.mjs
var LIFECYCLE = /* @__PURE__ */ new Set([
  "proposed",
  "ready",
  "in-progress",
  "in-review",
  "blocked",
  "completed",
  "release-ready",
  "deploying",
  "production-verification",
  "shipped",
  "dropped"
]);
var NEEDS_CHANGE_REF = /* @__PURE__ */ new Set([
  "in-review",
  "release-ready",
  "deploying",
  "production-verification",
  "shipped"
]);
var REQUIRES_STATES = /* @__PURE__ */ new Set(["in-review", "completed", "release-ready", "shipped"]);
var TERMINAL = /* @__PURE__ */ new Set(["shipped", "completed", "dropped"]);
var OPERATOR_GATED = /* @__PURE__ */ new Set(["release-ready", "deploying", "production-verification"]);
function frontmatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0] !== "---") return null;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return null;
  return lines.slice(1, end);
}
function cleanScalar(raw) {
  let s = (raw ?? "").trim();
  if (s.startsWith('"') && s.endsWith('"') || s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1);
  }
  const h = s.indexOf(" #");
  if (h !== -1) s = s.slice(0, h).trim();
  return s;
}
function scalar(fmLines, key) {
  for (const l of fmLines) {
    const m = l.match(new RegExp(`^${key}:\\s?(.*)$`));
    if (m) return cleanScalar(m[1]);
  }
  return void 0;
}
var isNull = (v) => v === void 0 || v === "" || v === "null" || v === "~" || v === "\u2014";
var unquote = (s) => {
  const t = (s ?? "").trim();
  return t.startsWith('"') && t.endsWith('"') || t.startsWith("'") && t.endsWith("'") ? t.slice(1, -1) : t;
};
function dependsOn(fmLines) {
  const out = [];
  let inBlock = false;
  let cur = null;
  for (const l of fmLines) {
    if (/^depends_on:\s*(\[\])?\s*$/.test(l)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^\S/.test(l)) break;
      const mi = l.match(/^\s*-\s*item:\s*(.+?)\s*$/);
      if (mi) {
        cur = { item: cleanScalar(mi[1]), requires: void 0 };
        out.push(cur);
        continue;
      }
      const mr = l.match(/^\s*requires:\s*(.+?)\s*$/);
      if (mr && cur) cur.requires = cleanScalar(mr[1]);
    }
  }
  return out;
}
function lease(fmLines) {
  const out = { holder: void 0, token: void 0, versionAtGrant: void 0, expires: void 0 };
  let inBlock = false;
  for (const l of fmLines) {
    if (/^lease:\s*$/.test(l)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^\S/.test(l)) break;
      const h = l.match(/^\s*holder:\s?(.*)$/);
      const t = l.match(/^\s*token:\s?(.*)$/);
      const v = l.match(/^\s*version_at_grant:\s?(.*)$/);
      const e = l.match(/^\s*expires:\s?(.*)$/);
      if (h) out.holder = h[1].trim();
      if (t) out.token = t[1].trim();
      if (v) out.versionAtGrant = v[1].trim();
      if (e) out.expires = e[1].trim();
    }
  }
  return out;
}
function listBlock(fmLines, key) {
  const out = [];
  let inBlock = false;
  for (const l of fmLines) {
    if (new RegExp(`^${key}:\\s*(\\[\\])?\\s*$`).test(l)) {
      if (/\[\]\s*$/.test(l)) return out;
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^\S/.test(l)) break;
      const m = l.match(/^\s*-\s*(.+?)\s*$/);
      if (m) out.push(cleanScalar(m[1]));
    }
  }
  return out;
}
function mapListBlock(fmLines, key) {
  const out = [];
  let inBlock = false;
  let cur = null;
  for (const l of fmLines) {
    if (new RegExp(`^${key}:\\s*(\\[\\])?\\s*$`).test(l)) {
      if (/\[\]\s*$/.test(l)) return out;
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^\S/.test(l)) break;
      const start = l.match(/^\s*-\s*([A-Za-z_][\w-]*):\s?(.*)$/);
      if (start) {
        cur = { [start[1]]: cleanScalar(start[2]) };
        out.push(cur);
        continue;
      }
      const kv = l.match(/^\s*([A-Za-z_][\w-]*):\s?(.*)$/);
      if (kv && cur) cur[kv[1]] = cleanScalar(kv[2]);
    }
  }
  return out;
}
function parseStamp(s) {
  const t = unquote(s);
  let mm = t.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})$/);
  if (mm) return Date.UTC(+mm[1], +mm[2] - 1, +mm[3], +mm[4], +mm[5]);
  mm = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (mm) return Date.UTC(+mm[1], +mm[2] - 1, +mm[3]);
  const d = Date.parse(t);
  return Number.isNaN(d) ? null : d;
}
var HEADER_KEYWORD_RE = /^\s*(?:[#>*_`]+\s*)*\s*(QUESTION|ANSWER|HANDOFF)\b(.*)$/;
var HEADER_BODY_RE = /^\s*(?:\[([^\]]+)\]|([^\s[][\S]*))\s*(?:(\d{4}-\d{2}-\d{2}(?:-\d{4})?)\s*)?[—-]\s*@?([\w.-]+)\s*(?:→|->)\s*@?([\w.-]+)\s*$/;
var FIELD_RE = /^\s*-\s*([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*$/;
function parseThread(raw) {
  const lines = raw.split(/\r?\n/);
  const messages = [];
  let cur = null;
  let fenced = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      cur = null;
      continue;
    }
    if (fenced) continue;
    const km = line.match(HEADER_KEYWORD_RE);
    if (km) {
      const kind = km[1];
      if (kind === "HANDOFF") {
        cur = null;
        continue;
      }
      const hb = km[2].match(HEADER_BODY_RE);
      if (!hb) {
        cur = null;
        continue;
      }
      cur = {
        kind,
        id: (hb[1] ?? hb[2] ?? "").trim(),
        from: hb[4],
        to: hb[5],
        timestamp: hb[3] || null,
        fields: {}
      };
      messages.push(cur);
      continue;
    }
    if (!cur) continue;
    const fm = line.match(FIELD_RE);
    if (fm) {
      const value = cleanScalar(fm[2]).replace(/^[`*_]+|[`*_]+$/g, "").trim();
      cur.fields[fm[1].toLowerCase()] = value;
    }
  }
  const questionMsgs = messages.filter((m) => m.kind === "QUESTION");
  const answerMsgs = messages.filter((m) => m.kind === "ANSWER");
  const knownIds = new Set(questionMsgs.map((m) => m.id));
  const diagnostics = [];
  const questions = questionMsgs.map((q) => {
    const out = {
      id: q.id,
      from: q.from,
      to: q.to,
      status: q.fields.status,
      kind: q.fields.kind,
      blocking: q.fields.blocking,
      ask: q.fields.ask,
      answer_by: q.fields.answer_by,
      context: q.fields.context
    };
    const related = answerMsgs.filter((a) => a.id === q.id);
    const hasContent = (a) => typeof a.fields.answer === "string" && a.fields.answer.trim().length > 0;
    const statusAcceptable = (a) => a.fields.status === void 0 || a.fields.status === "answered";
    const inLane = (a) => a.fields.lane === "in-lane";
    const partyMatch = (a) => a.from === q.to && a.to === q.from;
    const resolving = related.filter((a) => statusAcceptable(a) && inLane(a) && partyMatch(a) && hasContent(a));
    for (const a of related) {
      if (resolving.includes(a)) continue;
      let type;
      if (!inLane(a)) type = "out-of-lane";
      else if (!partyMatch(a)) type = "party-mismatch";
      else if (!statusAcceptable(a)) type = "unresolved-status";
      else if (!hasContent(a)) type = "blank-answer";
      else type = "unresolved-answer";
      diagnostics.push({
        type,
        id: q.id,
        message: `${a.kind} ${a.id} from ${a.from} does not reconcile (${type.replace(/-/g, " ")})`
      });
    }
    if (resolving.length) {
      const distinct = new Set(resolving.map((a) => a.fields.answer ?? ""));
      if (distinct.size > 1) {
        diagnostics.push({
          type: "conflicting-answer",
          id: q.id,
          message: `${resolving.length} contradictory in-lane answers for ${q.id}; forcing it open`
        });
        out.status = "open";
      } else {
        out.status = "answered";
        out.answer = resolving[0].fields.answer;
        out.lane = resolving[0].fields.lane;
        out.provenance = resolving[0].fields.provenance;
      }
    }
    return out;
  });
  for (const a of answerMsgs) {
    if (!knownIds.has(a.id)) {
      diagnostics.push({
        type: "orphan-answer",
        id: a.id,
        message: `ANSWER ${a.id} has no matching QUESTION in this thread`
      });
    }
  }
  return { questions, answers: answerMsgs, diagnostics, messages };
}

// src/core/lib/coordination-runtime/contract.mjs
import { createHash } from "node:crypto";

// src/core/lib/agent-model-policy.mjs
var ROLE_FAMILY_PACK = Object.freeze({
  core: "core",
  eng: "engineering",
  creative: "creative"
});
var ROLE_POSTURES = Object.freeze([
  "lead",
  "builder",
  "reviewer",
  "operator",
  "coordinator",
  "advisor"
]);
var ROLE_POSTURE_PROFILES = Object.freeze({
  lead: Object.freeze(["judgment", "technical-judgment"]),
  builder: Object.freeze(["execution"]),
  reviewer: Object.freeze(["review", "technical-review"]),
  operator: Object.freeze(["operations"]),
  coordinator: Object.freeze(["coordination"]),
  advisor: Object.freeze(["judgment", "technical-judgment", "advisory"])
});
var KIND_AGENT_PROFILES = Object.freeze({
  workflow: Object.freeze(["procedure"]),
  persona: Object.freeze(["simulation"]),
  instructor: Object.freeze(["teaching"])
});
var ROLE_PROFILE_MODELS = Object.freeze({
  judgment: "claude-opus-5",
  "technical-judgment": "gpt-5.6-sol",
  review: "claude-opus-5",
  "technical-review": "gpt-5.6-terra",
  execution: "claude-sonnet-5",
  operations: "claude-sonnet-5",
  coordination: "claude-sonnet-5",
  advisory: "claude-sonnet-5",
  procedure: "claude-sonnet-5",
  teaching: "claude-sonnet-5",
  simulation: "claude-sonnet-5"
});
var KIND_AGENT_FAMILIES = Object.freeze([
  "workflow",
  "persona",
  "instructor"
]);
function agentProfileModelErrors({ id, body, fm = {} }, legacyIds = /* @__PURE__ */ new Set()) {
  const [family, posture] = (id ?? "").split("-");
  const isDurableRole = family in ROLE_FAMILY_PACK && !legacyIds.has(id);
  const isNewKind = KIND_AGENT_FAMILIES.includes(family) && !legacyIds.has(id);
  if (!isDurableRole && !isNewKind) return [];
  const errors = [];
  const profiles = [...(body ?? "").matchAll(
    /^\*\*Primary profile:\*\*\s+`?([a-z][a-z-]*)`?\s*$/gm
  )].map((match) => match[1]);
  if (profiles.length !== 1) {
    errors.push(`new agent must declare exactly one \`**Primary profile:** <profile>\` line (found ${profiles.length})`);
    return errors;
  }
  const [profile] = profiles;
  const expected = ROLE_PROFILE_MODELS[profile];
  if (!expected) {
    errors.push(`primary profile \`${profile}\` has no approved model mapping`);
    return errors;
  }
  const allowed = isDurableRole ? ROLE_POSTURE_PROFILES[posture] : KIND_AGENT_PROFILES[family];
  if (!allowed?.includes(profile)) {
    errors.push(`${isDurableRole ? `posture \`${posture}\`` : `kind \`${family}\``} requires primary profile ${(allowed ?? []).map((value) => `\`${value}\``).join(" or ") || "(none)"}, not \`${profile}\``);
  }
  const model = (fm.model ?? "").trim().replace(/^(['"])(.*)\1$/, "$2");
  if (!model) {
    errors.push(`new agent with profile \`${profile}\` must declare frontmatter model "${expected}"`);
  } else if (model !== expected) {
    errors.push(`primary profile \`${profile}\` requires frontmatter model "${expected}", not "${model}"`);
  }
  return errors;
}

// src/core/lib/coordination-runtime/host-schema.mjs
var MAX_OBSERVATIONS = 32;
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var fail = (code, message) => {
  throw new RuntimeError(code, message);
};
var invalid = (message) => fail("INVALID_INPUT", message);
var clone = (value) => JSON.parse(canonicalJson(value));
var exact = (value, keys, label) => assertExactKeys(value, new Set(keys), label);
function text(value, label, max = 512) {
  assertNonEmptyString(value, label);
  if (Buffer.byteLength(value, "utf8") > max) invalid(`${label} exceeds ${max} bytes`);
}
var nullableText = (value, label) => {
  if (value !== null) text(value, label);
};
var uuid = (value, label) => {
  if (!UUID.test(value ?? "")) invalid(`${label} must be a UUID`);
};
var boolean = (value, label) => {
  if (typeof value !== "boolean") invalid(`${label} must be boolean`);
};
var member = (value, choices, label) => {
  if (!choices.includes(value)) invalid(`${label} is unsupported`);
};
var positive = (value, label) => {
  if (!Number.isSafeInteger(value) || value < 1) invalid(`${label} must be a positive safe integer`);
};
var measurement = (value, label, integer = false) => {
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || integer && !Number.isSafeInteger(value))) invalid(`${label} is not a valid measurement`);
};
function validateCapabilities(value) {
  exact(value, ["peerDispatch", "resume", "modelOverride", "usage", "models", "efforts"], "capabilities");
  for (const key of ["peerDispatch", "resume", "modelOverride", "usage"]) boolean(value[key], key);
  for (const key of ["models", "efforts"]) {
    if (!Array.isArray(value[key]) || new Set(value[key]).size !== value[key].length) invalid(`${key} must be unique`);
    value[key].forEach((entry) => text(entry, key));
  }
}
function approvedProfileModel(role, profile) {
  const model = Object.hasOwn(ROLE_PROFILE_MODELS, profile ?? "") ? ROLE_PROFILE_MODELS[profile] : null;
  if (!model) invalid("role has no approved primary profile");
  const errors = agentProfileModelErrors({ id: role, body: `**Primary profile:** ${profile}`, fm: { model } });
  if (errors.length) invalid(errors.join("; "));
  return model;
}
function validateHostCommand(command) {
  const p = command.payload;
  const attempt = command.kind.startsWith("attempt.");
  if (command.recordKind !== (attempt ? "host-attempt" : "effect")) invalid("host command recordKind mismatch");
  uuid(command.recordId, "host recordId");
  if (command.kind.endsWith(".result")) {
    exact(p, attempt ? ["observationId"] : ["attemptId", "observationId"], "result payload");
    uuid(p.observationId, "observationId");
    if (!attempt) uuid(p.attemptId, "attemptId");
    positive(command.expectedVersion, "result expectedVersion");
    if (command.leaseToken !== null) invalid("host observations do not use acting leases");
    return;
  }
  if (command.expectedVersion !== 0) invalid("host intent creation expects version 0");
  const common = ["itemId", "itemVersion", "createdAt"];
  exact(p, [...common, ...attempt ? ["target", "profile", "requestedModel", "effort", "independenceKey", "resumeFrom"] : ["attemptId", "intendedAction", "idempotencyKey", "external", "paid"]], "intent payload");
  text(p.itemId, "itemId");
  positive(p.itemVersion, "itemVersion");
  assertTimestamp(p.createdAt, "createdAt");
  if (attempt) {
    validateActor(p.target);
    for (const key of ["profile", "requestedModel", "independenceKey"]) text(p[key], key);
    nullableText(p.effort, "effort");
    if (p.resumeFrom !== null) uuid(p.resumeFrom, "resumeFrom");
  } else {
    uuid(p.attemptId, "attemptId");
    text(p.intendedAction, "intendedAction", 2048);
    nullableText(p.idempotencyKey, "idempotencyKey");
    boolean(p.external, "external");
    boolean(p.paid, "paid");
  }
}
var attemptFactKeys = [
  "status",
  "liveness",
  "sessionId",
  "actualRole",
  "actualProfile",
  "actualModel",
  "actualEffort",
  "inputTokens",
  "outputTokens",
  "cost",
  "usage",
  "durationMs",
  "response",
  "exitCode"
];
var effectFactKeys = ["outcome", "response"];
var pick = (value, keys) => Object.fromEntries(keys.map((key) => [key, value[key] ?? null]));
function sanitizeFacts(raw, effect = false) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) invalid("host facts must be an object");
  const facts = pick(raw, effect ? effectFactKeys : attemptFactKeys);
  if (!effect && facts.usage !== null) {
    const value = facts.usage;
    if (typeof value !== "object" || Array.isArray(value)) invalid("usage must be an object");
    facts.usage = pick(value, ["scope", "sessionId", "totalNanoAiu", "totalPremiumRequests"]);
  }
  if (!effect && facts.cost !== null) {
    const value = facts.cost;
    if (typeof value !== "object" || Array.isArray(value)) invalid("cost requires an explicit unit and scope");
    facts.cost = pick(value, ["amount", "currency", "scope", "sessionId"]);
  }
  return clone(facts);
}
function validateFacts(facts, source, effect) {
  exact(facts, effect ? effectFactKeys : attemptFactKeys, "observation facts");
  if (facts.response !== null) {
    if (typeof facts.response !== "string" || Buffer.byteLength(facts.response, "utf8") > 8192) {
      invalid("user-facing response must be at most 8192 bytes");
    }
  }
  if (effect) {
    member(facts.outcome, ["unknown", "succeeded", "not-applied"], "effect outcome");
    if (source !== "host" && facts.outcome !== "unknown") invalid("local timing cannot establish an external effect outcome");
    return;
  }
  member(facts.status, ["completed", "failed", "timeout", "acknowledgement-lost"], "host status");
  member(facts.liveness, ["stopped", "running", "unknown"], "host liveness");
  for (const key of ["sessionId", "actualRole", "actualProfile", "actualModel", "actualEffort"]) nullableText(facts[key], key);
  for (const key of ["inputTokens", "outputTokens"]) measurement(facts[key], key, true);
  measurement(facts.durationMs, "durationMs");
  if (facts.exitCode !== null && !Number.isSafeInteger(facts.exitCode)) invalid("exitCode must be an integer or null");
  if (facts.usage !== null) {
    const u = facts.usage;
    exact(u, ["scope", "sessionId", "totalNanoAiu", "totalPremiumRequests"], "usage");
    if (u.scope !== "session-cumulative" || u.sessionId === null || u.sessionId !== facts.sessionId) {
      invalid("usage checkpoints require the exact cumulative session identity");
    }
    measurement(u.totalNanoAiu, "totalNanoAiu", true);
    measurement(u.totalPremiumRequests, "totalPremiumRequests");
  }
  if (facts.cost !== null) {
    const c = facts.cost;
    exact(c, ["amount", "currency", "scope", "sessionId"], "cost");
    measurement(c.amount, "cost.amount");
    if (c.amount === null || !/^[A-Z]{3}$/.test(c.currency ?? "")) invalid("cost requires an observed currency amount");
    member(c.scope, ["attempt", "session-cumulative"], "cost.scope");
    if (c.scope === "attempt" ? c.sessionId !== null : c.sessionId === null || c.sessionId !== facts.sessionId) {
      invalid("cost session identity does not match its scope");
    }
  }
  if (source === "local") {
    if (!["timeout", "acknowledgement-lost"].includes(facts.status) || facts.liveness !== "unknown" || attemptFactKeys.filter((key) => !["status", "liveness", "durationMs"].includes(key)).some((key) => facts[key] !== null)) {
      invalid("local observations may only establish elapsed timing and uncertain acknowledgement/liveness");
    }
  }
}
function validateHostObservation(value, effect = false) {
  exact(value, ["observationId", "source", "capturedAt", "facts", "sessionConflicts"], "host observation");
  uuid(value.observationId, "observationId");
  member(value.source, ["host", "local"], "observation source");
  assertTimestamp(value.capturedAt, "capturedAt");
  if (!Array.isArray(value.sessionConflicts) || new Set(value.sessionConflicts).size !== value.sessionConflicts.length || effect && value.sessionConflicts.length !== 0) invalid("invalid observed session conflicts");
  value.sessionConflicts.forEach((id) => uuid(id, "session conflict attempt"));
  validateFacts(value.facts, value.source, effect);
}
var isTerminalObservation = (o) => o.source === "host" && o.facts.liveness === "stopped" && ["completed", "failed"].includes(o.facts.status);
function latestTerminalObservations(body) {
  const terminal = body.observations.filter(isTerminalObservation);
  const latest = Math.max(...terminal.map((o) => Date.parse(o.capturedAt)));
  return terminal.filter((o) => Date.parse(o.capturedAt) === latest);
}
function attemptSummary(body) {
  const gaps = /* @__PURE__ */ new Set();
  const terminal = [];
  for (const observation of body.observations) {
    const f = observation.facts;
    if (observation.sessionConflicts.length) gaps.add("SESSION_BOUNDARY_MISMATCH");
    if (f.actualModel === null) gaps.add("MODEL_UNKNOWN");
    else if (f.actualModel !== body.requested_model) gaps.add("MODEL_MISMATCH");
    for (const [actual, requested, label] of [
      ["actualEffort", "requested_effort", "EFFORT"],
      ["actualProfile", "profile", "PROFILE"]
    ]) {
      if (body[requested] !== null && f[actual] === null) gaps.add(`${label}_UNKNOWN`);
      else if (f[actual] !== null && body[requested] !== null && f[actual] !== body[requested]) gaps.add(`${label}_MISMATCH`);
    }
    if (f.actualRole !== null && f.actualRole !== body.target.role) gaps.add("ROLE_MISMATCH");
    if (body.context === "resume") {
      if (f.sessionId === null) gaps.add("SESSION_UNKNOWN");
      else if (f.sessionId !== body.resume_session_id) gaps.add("SESSION_MISMATCH");
    }
    if (f.exitCode !== null && f.exitCode !== 0) gaps.add("EXIT_FAILURE");
    if (f.status === "failed") gaps.add("HOST_FAILURE");
    if (f.liveness === "unknown") gaps.add("LIVENESS_UNKNOWN");
    if (f.status === "acknowledgement-lost") gaps.add("ACKNOWLEDGEMENT_LOST");
    if (f.status === "timeout") gaps.add("TIMEOUT");
    if (isTerminalObservation(observation)) terminal.push(f);
  }
  let status = body.observations.length === 0 ? "intent" : "uncertain";
  if (terminal.length) {
    const latest = latestTerminalObservations(body);
    status = latest[0].facts.status;
    if (gaps.has("EXIT_FAILURE")) status = "failed";
    if ([...gaps].some((gap) => gap.endsWith("_MISMATCH"))) status = "mismatched";
    const disagreement = terminal.some((f) => f.status !== terminal[0].status);
    const identities = ["sessionId", "actualModel", "actualRole", "actualProfile"];
    if (disagreement || identities.some((key) => new Set(terminal.map((f) => f[key]).filter((v) => v !== null)).size > 1)) {
      gaps.add("CONFLICTING_RESULTS");
      status = "conflicting";
    }
    const current = body.observations.filter((o) => o.source === "host" && Date.parse(o.capturedAt) >= Date.parse(latest[0].capturedAt));
    if (current.some((o) => o.facts.liveness === "running")) {
      gaps.add("CONFLICTING_RESULTS");
      status = "conflicting";
    } else if (["completed", "failed"].includes(status) && current.some((o) => o.facts.liveness === "unknown")) {
      status = "uncertain";
    }
  }
  return { status, gaps: [...gaps].sort() };
}
function effectSummary(body) {
  const outcomes = new Set(body.observations.map((o) => o.facts.outcome).filter((o) => o !== "unknown"));
  const outcome = outcomes.size > 1 ? "conflicting" : [...outcomes][0] ?? "unknown";
  return { outcome, gaps: outcome === "conflicting" ? ["CONFLICTING_RESULTS"] : outcome === "unknown" ? ["EFFECT_OUTCOME_UNKNOWN"] : [] };
}
function validateHostRecord(body, label, effect = false) {
  const common = ["schema_version", "item_id", "item_version", "actor", "created_at", "observations", "gaps"];
  exact(body, [...common, ...effect ? ["effect_id", "attempt_id", "intended_action", "idempotency_key", "external", "paid", "outcome"] : [
    "attempt_id",
    "target",
    "agent_id",
    "profile",
    "requested_model",
    "requested_effort",
    "independence_key",
    "context",
    "resume_from",
    "resume_session_id",
    "capabilities",
    "settings",
    "status"
  ]], label);
  if (body.schema_version !== 1) invalid("host record schema_version must be 1");
  text(body.item_id, "item_id");
  positive(body.item_version, "item_version");
  validateActor(body.actor);
  assertTimestamp(body.created_at, "created_at");
  uuid(body.attempt_id, "attempt_id");
  if (!Array.isArray(body.observations) || body.observations.length > MAX_OBSERVATIONS) invalid("observation bound exceeded");
  body.observations.forEach((o) => validateHostObservation(o, effect));
  if (new Set(body.observations.map((o) => o.observationId)).size !== body.observations.length) invalid("duplicate observation IDs");
  if (effect) {
    uuid(body.effect_id, "effect_id");
    text(body.intended_action, "intended_action", 2048);
    nullableText(body.idempotency_key, "idempotency_key");
    boolean(body.external, "external");
    boolean(body.paid, "paid");
  } else {
    validateActor(body.target);
    for (const key of ["agent_id", "profile", "requested_model", "independence_key"]) text(body[key], key);
    if (body.requested_model !== approvedProfileModel(body.target.role, body.profile)) {
      invalid("host record requested model must match its approved primary profile");
    }
    nullableText(body.requested_effort, "requested_effort");
    member(body.context, ["fresh-single-shot", "resume"], "context");
    nullableText(body.resume_session_id, "resume_session_id");
    if (body.resume_from !== null) uuid(body.resume_from, "resume_from");
    if (body.context === "resume" ? body.resume_from === null || body.resume_session_id === null : body.resume_from !== null || body.resume_session_id !== null) invalid("resume context identity mismatch");
    validateCapabilities(body.capabilities);
    assertExactKeys(body.settings, /* @__PURE__ */ new Set(["model", "effort"]), "settings", /* @__PURE__ */ new Set());
    if (Object.hasOwn(body.settings, "model") && (!body.capabilities.modelOverride || body.settings.model !== body.requested_model)) invalid("unsupported model override");
    if (Object.hasOwn(body.settings, "effort") && (body.settings.effort !== body.requested_effort || !body.capabilities.efforts.includes(body.settings.effort))) invalid("unsupported effort override");
    if (body.requested_effort !== null && body.settings.effort !== body.requested_effort) {
      invalid("host record must carry the supported requested effort");
    }
    if (!body.capabilities.models.includes(body.requested_model) || body.capabilities.modelOverride && body.settings.model !== body.requested_model) {
      invalid("host record must retain the available model and supported override");
    }
  }
  const summary = effect ? effectSummary(body) : attemptSummary(body);
  for (const [key, value] of Object.entries(summary)) {
    if (canonicalJson(body[key]) !== canonicalJson(value)) invalid(`host ${key} does not match retained observations`);
  }
}
function validateHostMutation(command, current, nextBody) {
  if (!Array.isArray(nextBody.observations)) invalid("host mutation requires an observations array");
  const result = command.kind.endsWith(".result");
  if (!result) {
    if (current) invalid("host intent requires a missing record");
    if (nextBody.item_id !== command.payload.itemId || nextBody.item_version !== command.payload.itemVersion || canonicalJson(nextBody.actor) !== canonicalJson(command.actor) || nextBody.created_at !== command.payload.createdAt || nextBody.observations.length !== 0) {
      invalid("host intent must preserve the command identity");
    }
    const fields = command.kind === "attempt.start" ? {
      target: "target",
      profile: "profile",
      requestedModel: "requested_model",
      effort: "requested_effort",
      independenceKey: "independence_key",
      resumeFrom: "resume_from"
    } : {
      attemptId: "attempt_id",
      intendedAction: "intended_action",
      idempotencyKey: "idempotency_key",
      external: "external",
      paid: "paid"
    };
    for (const [payloadKey, bodyKey] of Object.entries(fields)) {
      if (canonicalJson(command.payload[payloadKey]) !== canonicalJson(nextBody[bodyKey])) {
        invalid(`host intent must preserve payload.${payloadKey}`);
      }
    }
    return;
  }
  if (!current) invalid("host result requires an existing intent");
  const allowed = /* @__PURE__ */ new Set(["observations", "gaps", command.recordKind === "effect" ? "outcome" : "status"]);
  for (const key of /* @__PURE__ */ new Set([...Object.keys(current.body), ...Object.keys(nextBody)])) {
    if (!allowed.has(key) && canonicalJson(current.body[key]) !== canonicalJson(nextBody[key])) {
      invalid(`host result cannot change ${key}`);
    }
  }
  if (nextBody.observations.length < current.body.observations.length || nextBody.observations.length > current.body.observations.length + 1 || canonicalJson(nextBody.observations.slice(0, current.body.observations.length)) !== canonicalJson(current.body.observations) || !nextBody.observations.some((o) => o.observationId === command.payload.observationId)) {
    invalid("host observations are append-only and bound to the command");
  }
}

// src/core/lib/coordination-runtime/contract.mjs
var HOST_COMMANDS = /* @__PURE__ */ new Set(["attempt.start", "attempt.result", "effect.intent", "effect.result"]);
var COMMAND_KINDS = /* @__PURE__ */ new Set([
  "initiative.create",
  "initiative.update",
  "item.create",
  "item.update",
  "item.promote",
  "item.grant",
  "item.transition",
  "item.handoff",
  "item.restore",
  "question.open",
  "question.answer",
  "attempt.recover",
  ...HOST_COMMANDS,
  "artifact.register",
  "asset.transition",
  "evidence.register",
  "review.record",
  "approval.record"
]);
var RECORD_KINDS = /* @__PURE__ */ new Set([
  "initiative",
  "item",
  "question",
  "attempt",
  "host-attempt",
  "artifact",
  "asset",
  "evidence",
  "review",
  "approval",
  "effect",
  "message",
  "grant"
]);
var SUBJECT_KINDS = /* @__PURE__ */ new Set(["git", "sha256", "bundle-sha256"]);
var REVIEW_VERDICTS = /* @__PURE__ */ new Set(["approved", "changes-requested", "blocked"]);
var APPROVAL_KINDS = /* @__PURE__ */ new Set([
  "scope",
  "completion",
  "operator-deploy-start",
  "operator-deploy-complete",
  "operator-recovery-resolution"
]);
var EVIDENCE_KINDS = /* @__PURE__ */ new Set([
  "dod-dimension",
  "deployment",
  "production-verification",
  "recovery-reconciliation"
]);
var DOD_DIMENSIONS = /* @__PURE__ */ new Set([
  "scope-true",
  "verified",
  "reviewed",
  "shippable-safely",
  "documented",
  "coordination-closed"
]);
var UUID2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var HEX_DIGEST = /^[0-9a-f]{64}$/i;
var GIT_OBJECT = /^[0-9a-f]{7,40}$/i;
var ITEM_DELIVERY_CLASSES = /* @__PURE__ */ new Set(["knowledge", "product-change", "operational"]);
var INITIATIVE_STATES = /* @__PURE__ */ new Set([
  "proposed",
  "active",
  "paused",
  "completed",
  "shipped",
  "archived"
]);
var QUESTION_KINDS = /* @__PURE__ */ new Set(["fact", "decision", "reply", "action"]);
var MESSAGE_KINDS = /* @__PURE__ */ new Set(["question", "answer", "handoff", "recovery"]);
var PROVENANCE_KINDS = /* @__PURE__ */ new Set(["live-peer", "durable-thread", "operator"]);
var RECOVERY_DISPOSITIONS = /* @__PURE__ */ new Set([
  "safe-to-resume",
  "conflicting-partial-work"
]);
var ITEM_DESCRIPTIVE_FIELDS = /* @__PURE__ */ new Set([
  "title",
  "priority",
  "next_role",
  "outcome",
  "acceptance",
  "artifact_expectation",
  "artifact_expectation_reason",
  "artifact_class",
  "durability",
  "validity_owner",
  "artifact_targets",
  "context_artifacts",
  "touches",
  "depends_on",
  "required_for_milestone",
  "updated_at"
]);
var RuntimeError = class extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.name = "RuntimeError";
    this.code = code;
    this.retryable = retryable;
  }
};
function invalid2(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function criteriaRef(item) {
  const fields = [
    "outcome",
    "acceptance",
    "completion_authority",
    "review_requirements",
    "artifact_expectation",
    "artifact_expectation_reason",
    "artifact_class",
    "durability",
    "validity_owner",
    "artifact_targets"
  ];
  const criteria = Object.fromEntries(fields.map((key) => [key, item[key]]));
  if (item.context_artifacts?.length) criteria.context_artifacts = item.context_artifacts;
  return createHash("sha256").update(canonicalJson(criteria)).digest("hex");
}
function subjectEquals(left, right) {
  return left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
}
function isProducingRun(item, actor) {
  return item.producing_actors.some((producer) => producer.runId === actor.runId);
}
function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function assertExactKeys(value, allowed, label, required = allowed) {
  if (!isPlainObject(value)) invalid2(`${label} must be an object`);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) invalid2(`${label} contains unknown field "${key}"`);
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) invalid2(`${label} is missing "${key}"`);
  }
}
function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    invalid2(`${label} must be a non-empty string`);
  }
}
function assertNullableString(value, label) {
  if (value !== null) assertNonEmptyString(value, label);
}
function assertBoolean(value, label) {
  if (typeof value !== "boolean") invalid2(`${label} must be a boolean`);
}
function assertTimestamp(value, label) {
  assertNonEmptyString(value, label);
  if (Number.isNaN(Date.parse(value))) invalid2(`${label} must be an ISO-compatible timestamp`);
}
function assertUuid(value, label) {
  if (typeof value !== "string" || !UUID2.test(value)) invalid2(`${label} must be a UUID`);
}
function assertStringArray(value, label, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || nonEmpty && value.length === 0) {
    invalid2(`${label} must be ${nonEmpty ? "a non-empty" : "an"} array`);
  }
  for (const entry of value) assertNonEmptyString(entry, `${label} entry`);
  if (new Set(value).size !== value.length) invalid2(`${label} must not contain duplicates`);
}
function validateActor(actor, label = "actor") {
  assertExactKeys(actor, /* @__PURE__ */ new Set(["role", "runId"]), label);
  assertNonEmptyString(actor.role, `${label}.role`);
  assertNonEmptyString(actor.runId, `${label}.runId`);
}
function validateNullableActor(actor, label) {
  if (actor !== null) validateActor(actor, label);
}
function encodeCanonical(value, ancestors) {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) invalid2("JSON numbers must be finite");
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    invalid2(`unsupported JSON value type "${typeof value}"`);
  }
  if (ancestors.has(value)) invalid2("cyclic JSON values are not supported");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) invalid2("sparse arrays are not supported");
      }
      return `[${value.map((entry) => encodeCanonical(entry, ancestors)).join(",")}]`;
    }
    if (!isPlainObject(value)) invalid2("JSON objects must use a plain object prototype");
    if (Object.getOwnPropertySymbols(value).length > 0) {
      invalid2("symbol-keyed JSON fields are not supported");
    }
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${encodeCanonical(value[key], ancestors)}`).join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}
function canonicalJson(value) {
  return encodeCanonical(value, /* @__PURE__ */ new WeakSet());
}
function commandDigest(command) {
  return createHash("sha256").update(canonicalJson(command), "utf8").digest("hex");
}
function validateSubjectRef(subject, label = "subject") {
  if (!isPlainObject(subject)) invalid2(`${label} must be an object`);
  if (!SUBJECT_KINDS.has(subject.kind)) invalid2(`${label}.kind is unsupported`);
  if (subject.kind === "git") {
    assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "base", "head"]), label);
    if (!GIT_OBJECT.test(subject.base) || !GIT_OBJECT.test(subject.head)) {
      invalid2(`${label} git base/head must be immutable git object IDs`);
    }
  } else if (subject.kind === "sha256") {
    assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "digest", "path"]), label);
    if (!HEX_DIGEST.test(subject.digest)) invalid2(`${label}.digest must be SHA-256`);
    assertNonEmptyString(subject.path, `${label}.path`);
  } else {
    assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "digest", "entries"]), label);
    if (!HEX_DIGEST.test(subject.digest)) invalid2(`${label}.digest must be SHA-256`);
    if (!Array.isArray(subject.entries) || subject.entries.length === 0) {
      invalid2(`${label}.entries must be a non-empty array`);
    }
    for (const [index, entry] of subject.entries.entries()) {
      assertExactKeys(entry, /* @__PURE__ */ new Set(["path", "digest"]), `${label}.entries[${index}]`);
      assertNonEmptyString(entry.path, `${label}.entries[${index}].path`);
      if (!HEX_DIGEST.test(entry.digest)) {
        invalid2(`${label}.entries[${index}].digest must be SHA-256`);
      }
    }
  }
  return subject;
}
function validateNullableSubject(subject, label) {
  if (subject !== null) validateSubjectRef(subject, label);
}
function validateDependencies(value, label) {
  if (!Array.isArray(value)) invalid2(`${label} must be an array`);
  const seen = /* @__PURE__ */ new Set();
  for (const [index, dependency] of value.entries()) {
    assertExactKeys(dependency, /* @__PURE__ */ new Set(["item", "requires"]), `${label}[${index}]`);
    assertNonEmptyString(dependency.item, `${label}[${index}].item`);
    if (!REQUIRES_STATES.has(dependency.requires)) {
      invalid2(`${label}[${index}].requires is unsupported`);
    }
    if (seen.has(dependency.item)) invalid2(`${label} contains duplicate item "${dependency.item}"`);
    seen.add(dependency.item);
  }
}
function validateReviewRequirements(value, label) {
  if (!Array.isArray(value)) invalid2(`${label} must be an array`);
  const seen = /* @__PURE__ */ new Set();
  for (const [index, requirement] of value.entries()) {
    assertExactKeys(requirement, /* @__PURE__ */ new Set(["role", "kind"]), `${label}[${index}]`);
    assertNonEmptyString(requirement.role, `${label}[${index}].role`);
    assertNonEmptyString(requirement.kind, `${label}[${index}].kind`);
    const key = `${requirement.role}\0${requirement.kind}`;
    if (seen.has(key)) invalid2(`${label} contains a duplicate requirement`);
    seen.add(key);
  }
}
function validateLease(value, label) {
  if (value === null) return;
  assertExactKeys(value, /* @__PURE__ */ new Set([
    "holder",
    "token",
    "version_at_grant",
    "acquired_at",
    "expires_at"
  ]), label);
  validateActor(value.holder, `${label}.holder`);
  assertNonEmptyString(value.token, `${label}.token`);
  if (!Number.isSafeInteger(value.version_at_grant) || value.version_at_grant < 1) {
    invalid2(`${label}.version_at_grant must be a positive safe integer`);
  }
  assertTimestamp(value.acquired_at, `${label}.acquired_at`);
  assertTimestamp(value.expires_at, `${label}.expires_at`);
}
function validateItemBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "id",
    "title",
    "initiative",
    "delivery_class",
    "state",
    "resume_state",
    "scope_authority",
    "completion_authority",
    "producer_actor",
    "producing_actors",
    "acceptance_actor",
    "priority",
    "next_role",
    "outcome",
    "acceptance",
    "artifact_expectation",
    "artifact_expectation_reason",
    "artifact_class",
    "durability",
    "validity_owner",
    "artifact_targets",
    "context_artifacts",
    "touches",
    "depends_on",
    "lease",
    "recovery_hold",
    "waiting_on_questions",
    "required_for_milestone",
    "review_requirements",
    "change_ref",
    "updated_at"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  for (const key of [
    "id",
    "title",
    "initiative",
    "scope_authority",
    "completion_authority",
    "outcome"
  ]) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  if (!ITEM_DELIVERY_CLASSES.has(body.delivery_class)) {
    invalid2(`${label}.delivery_class is unsupported`);
  }
  if (!LIFECYCLE.has(body.state)) invalid2(`${label}.state is unsupported`);
  if (body.resume_state !== null && (!LIFECYCLE.has(body.resume_state) || body.resume_state === "blocked")) {
    invalid2(`${label}.resume_state is unsupported`);
  }
  validateNullableActor(body.producer_actor, `${label}.producer_actor`);
  if (!Array.isArray(body.producing_actors)) invalid2(`${label}.producing_actors must be an array`);
  body.producing_actors.forEach((actor, index) => validateActor(actor, `${label}.producing_actors[${index}]`));
  if (body.producer_actor && !body.producing_actors.some((actor) => actor.role === body.producer_actor.role && actor.runId === body.producer_actor.runId)) {
    invalid2(`${label}.producing_actors must retain the current producer`);
  }
  validateNullableActor(body.acceptance_actor, `${label}.acceptance_actor`);
  if (!Number.isSafeInteger(body.priority) || body.priority < 0) {
    invalid2(`${label}.priority must be a non-negative safe integer`);
  }
  assertNullableString(body.next_role, `${label}.next_role`);
  assertStringArray(body.acceptance, `${label}.acceptance`, { nonEmpty: true });
  if (!(/* @__PURE__ */ new Set(["owed", "none"])).has(body.artifact_expectation)) {
    invalid2(`${label}.artifact_expectation is unsupported`);
  }
  assertNullableString(
    body.artifact_expectation_reason,
    `${label}.artifact_expectation_reason`
  );
  for (const key of ["artifact_class", "durability", "validity_owner"]) {
    assertNullableString(body[key], `${label}.${key}`);
  }
  if (body.artifact_expectation === "none" && body.artifact_expectation_reason === null) {
    invalid2(`${label}.artifact_expectation_reason is required when no artifact is owed`);
  }
  if (body.artifact_expectation === "owed" && [body.artifact_class, body.durability, body.validity_owner].includes(null)) {
    invalid2(`${label} requires artifact class, durability, and validity owner`);
  }
  for (const key of [
    "artifact_targets",
    "context_artifacts",
    "touches",
    "waiting_on_questions"
  ]) {
    assertStringArray(body[key], `${label}.${key}`);
  }
  validateDependencies(body.depends_on, `${label}.depends_on`);
  validateLease(body.lease, `${label}.lease`);
  if (body.recovery_hold !== null) {
    assertUuid(body.recovery_hold, `${label}.recovery_hold`);
    if (body.state !== "blocked" && body.state !== "dropped") {
      invalid2(`${label}.recovery_hold requires blocked or dropped state`);
    }
  }
  assertBoolean(body.required_for_milestone, `${label}.required_for_milestone`);
  validateReviewRequirements(body.review_requirements, `${label}.review_requirements`);
  validateNullableSubject(body.change_ref, `${label}.change_ref`);
  assertTimestamp(body.updated_at, `${label}.updated_at`);
  if (body.acceptance_actor && body.producing_actors.some((actor) => actor.runId === body.acceptance_actor.runId)) {
    invalid2(`${label} cannot name its producing run as acceptance actor`);
  }
  if (body.producer_actor && body.producer_actor.role === body.completion_authority && body.review_requirements.some((requirement) => requirement.kind === "product-design-acceptance")) {
    invalid2(`${label} producing designer cannot be its completion authority`);
  }
  if (body.state === "blocked") {
    if (body.resume_state === null) invalid2(`${label}.resume_state is required while blocked`);
  } else if (body.resume_state !== null) {
    invalid2(`${label}.resume_state is only valid while blocked`);
  }
  if (body.lease !== null && body.lease.version_at_grant >= Number.MAX_SAFE_INTEGER) {
    invalid2(`${label}.lease.version_at_grant is invalid`);
  }
}
function validateMilestone(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set([
    "id",
    "title",
    "delivery_class",
    "required_items",
    "status"
  ]), label);
  assertNonEmptyString(value.id, `${label}.id`);
  assertNonEmptyString(value.title, `${label}.title`);
  if (!ITEM_DELIVERY_CLASSES.has(value.delivery_class)) {
    invalid2(`${label}.delivery_class is unsupported`);
  }
  assertStringArray(value.required_items, `${label}.required_items`);
  if (!(/* @__PURE__ */ new Set(["proposed", "active", "completed", "shipped", "dropped"])).has(value.status)) {
    invalid2(`${label}.status is unsupported`);
  }
}
function validateBacklogEntry(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set(["id", "title", "status", "item_id", "reason"]), label);
  assertNonEmptyString(value.id, `${label}.id`);
  assertNonEmptyString(value.title, `${label}.title`);
  if (!(/* @__PURE__ */ new Set(["parked", "promoted", "dropped"])).has(value.status)) {
    invalid2(`${label}.status is unsupported`);
  }
  assertNullableString(value.item_id, `${label}.item_id`);
  assertNullableString(value.reason, `${label}.reason`);
}
function validateInitiativeBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "id",
    "title",
    "status",
    "owner",
    "scope",
    "milestones",
    "backlog",
    "north_star_ref",
    "updated_at"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  for (const key of ["id", "title", "owner", "north_star_ref"]) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  if (!INITIATIVE_STATES.has(body.status)) invalid2(`${label}.status is unsupported`);
  assertExactKeys(body.scope, /* @__PURE__ */ new Set(["current"]), `${label}.scope`);
  assertStringArray(body.scope.current, `${label}.scope.current`, { nonEmpty: true });
  if (!Array.isArray(body.milestones)) invalid2(`${label}.milestones must be an array`);
  body.milestones.forEach((entry, index) => validateMilestone(entry, `${label}.milestones[${index}]`));
  if (!Array.isArray(body.backlog)) invalid2(`${label}.backlog must be an array`);
  body.backlog.forEach((entry, index) => validateBacklogEntry(entry, `${label}.backlog[${index}]`));
  assertTimestamp(body.updated_at, `${label}.updated_at`);
}
function validateQuestionBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "question_id",
    "item_id",
    "asker",
    "recipient",
    "kind",
    "blocking",
    "status",
    "context",
    "ask",
    "answer_by",
    "opened_message_id",
    "answer_message_ids",
    "resolution"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  for (const key of ["question_id", "item_id", "recipient", "context", "ask", "answer_by"]) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  validateActor(body.asker, `${label}.asker`);
  if (!QUESTION_KINDS.has(body.kind)) invalid2(`${label}.kind is unsupported`);
  assertBoolean(body.blocking, `${label}.blocking`);
  if (!(/* @__PURE__ */ new Set(["open", "answered"])).has(body.status)) {
    invalid2(`${label}.status is unsupported`);
  }
  assertUuid(body.opened_message_id, `${label}.opened_message_id`);
  assertStringArray(body.answer_message_ids, `${label}.answer_message_ids`);
  if (body.resolution !== null) {
    assertExactKeys(body.resolution, /* @__PURE__ */ new Set([
      "answer",
      "lane",
      "provenance",
      "message_id",
      "answered_at",
      "sender"
    ]), `${label}.resolution`);
    assertNonEmptyString(body.resolution.answer, `${label}.resolution.answer`);
    if (body.resolution.lane !== "in-lane") {
      invalid2(`${label}.resolution.lane must be "in-lane"`);
    }
    if (!PROVENANCE_KINDS.has(body.resolution.provenance)) {
      invalid2(`${label}.resolution.provenance is unsupported`);
    }
    assertUuid(body.resolution.message_id, `${label}.resolution.message_id`);
    assertTimestamp(body.resolution.answered_at, `${label}.resolution.answered_at`);
    validateActor(body.resolution.sender, `${label}.resolution.sender`);
  }
}
function validateMessageBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "message_id",
    "thread_id",
    "item_id",
    "parent_id",
    "sender_role",
    "sender_run",
    "recipient",
    "kind",
    "created_at",
    "basis_version",
    "payload",
    "artifact_refs",
    "evidence_refs",
    "provenance"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.message_id, `${label}.message_id`);
  for (const key of ["thread_id", "item_id", "sender_role", "sender_run", "recipient"]) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  if (body.parent_id !== null) assertUuid(body.parent_id, `${label}.parent_id`);
  if (!MESSAGE_KINDS.has(body.kind)) invalid2(`${label}.kind is unsupported`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  if (!Number.isSafeInteger(body.basis_version) || body.basis_version < 1) {
    invalid2(`${label}.basis_version must be a positive safe integer`);
  }
  if (body.kind === "question") {
    validateQuestionContent(body.payload);
  } else if (body.kind === "answer") {
    validateAnswerContent(body.payload);
  } else if (body.kind === "handoff") {
    validateHandoffContent(body.payload);
  } else {
    assertExactKeys(body.payload, /* @__PURE__ */ new Set([
      "observed",
      "disposition",
      "staleLeaseToken",
      "newLeaseToken"
    ]), `${label}.payload`);
    assertNonEmptyString(body.payload.observed, `${label}.payload.observed`);
    if (!RECOVERY_DISPOSITIONS.has(body.payload.disposition)) {
      invalid2(`${label}.payload.disposition is unsupported`);
    }
    assertNonEmptyString(
      body.payload.staleLeaseToken,
      `${label}.payload.staleLeaseToken`
    );
    assertNullableString(
      body.payload.newLeaseToken,
      `${label}.payload.newLeaseToken`
    );
  }
  assertStringArray(body.artifact_refs, `${label}.artifact_refs`);
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`);
  if (!PROVENANCE_KINDS.has(body.provenance)) invalid2(`${label}.provenance is unsupported`);
}
function validateReviewBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "review_id",
    "item_id",
    "reviewer",
    "kind",
    "subject",
    "criteria",
    "criteria_ref",
    "supersedes",
    "verdict",
    "finding_refs",
    "evidence_refs",
    "created_at"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.review_id, `${label}.review_id`);
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  validateActor(body.reviewer, `${label}.reviewer`);
  assertNonEmptyString(body.kind, `${label}.kind`);
  validateSubjectRef(body.subject, `${label}.subject`);
  assertStringArray(body.criteria, `${label}.criteria`, { nonEmpty: true });
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  validateSupersedes(body.supersedes, body.review_id, label);
  if (!REVIEW_VERDICTS.has(body.verdict)) invalid2(`${label}.verdict is unsupported`);
  assertStringArray(body.finding_refs, `${label}.finding_refs`);
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, { nonEmpty: true });
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateCriteriaRef(value, label) {
  if (typeof value !== "string" || !HEX_DIGEST.test(value)) {
    invalid2(`${label} must be a SHA-256 criteria reference`);
  }
}
function validateSupersedes(ids, ownId, label) {
  assertStringArray(ids, `${label}.supersedes`);
  for (const id of ids) {
    assertUuid(id, `${label}.supersedes entry`);
    if (id === ownId) invalid2(`${label} cannot supersede itself`);
  }
}
function validateDeploymentContext(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set(["environment", "environment_class", "deployment_id"]), label);
  assertNonEmptyString(value.environment, `${label}.environment`);
  if (value.environment_class !== "production") invalid2(`${label} must confirm a production environment`);
  assertNonEmptyString(value.deployment_id, `${label}.deployment_id`);
}
function validateApprovalBody(body, label) {
  const required = /* @__PURE__ */ new Set([
    "schema_version",
    "approval_id",
    "item_id",
    "authority",
    "kind",
    "subject",
    "criteria_ref",
    "supersedes",
    "deployment",
    "recovery",
    "decision",
    "evidence_refs",
    "reason",
    "created_at"
  ]);
  assertExactKeys(body, /* @__PURE__ */ new Set([...required, "provenance", "recorded_at_item_version"]), label, required);
  if (Object.hasOwn(body, "provenance")) validateDecisionProvenance(body.provenance, `${label}.provenance`);
  if (Object.hasOwn(body, "recorded_at_item_version") && (!Number.isSafeInteger(body.recorded_at_item_version) || body.recorded_at_item_version < 1)) {
    invalid2(`${label}.recorded_at_item_version must be a positive item version`);
  }
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.approval_id, `${label}.approval_id`);
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  validateActor(body.authority, `${label}.authority`);
  if (!APPROVAL_KINDS.has(body.kind)) invalid2(`${label}.kind is unsupported`);
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  validateSupersedes(body.supersedes, body.approval_id, label);
  if (body.kind === "operator-recovery-resolution") {
    if (body.subject !== null) invalid2(`${label}.subject must be null for recovery resolution`);
    assertExactKeys(body.recovery, /* @__PURE__ */ new Set([
      "attempt_id",
      "stale_lease_token",
      "disposition",
      "resume_role"
    ]), `${label}.recovery`);
    assertUuid(body.recovery.attempt_id, `${label}.recovery.attempt_id`);
    assertNonEmptyString(body.recovery.stale_lease_token, `${label}.recovery.stale_lease_token`);
    if (body.recovery.disposition !== "safe-to-resume") {
      invalid2(`${label}.recovery.disposition must be safe-to-resume`);
    }
    assertNonEmptyString(body.recovery.resume_role, `${label}.recovery.resume_role`);
    if (body.recovery.resume_role === "operator") {
      invalid2(`${label}.recovery.resume_role cannot lease to operator`);
    }
  } else {
    validateSubjectRef(body.subject, `${label}.subject`);
    if (body.recovery !== null) invalid2(`${label}.recovery is only for recovery resolution`);
  }
  if (body.kind === "operator-deploy-start" || body.kind === "operator-deploy-complete") {
    validateDeploymentContext(body.deployment, `${label}.deployment`);
  } else if (body.deployment !== null) {
    invalid2(`${label}.deployment is only for deployment confirmation`);
  }
  if (!(/* @__PURE__ */ new Set(["approved", "rejected"])).has(body.decision)) {
    invalid2(`${label}.decision is unsupported`);
  }
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, { nonEmpty: true });
  assertNonEmptyString(body.reason, `${label}.reason`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateEvidenceBody(body, label) {
  const required = /* @__PURE__ */ new Set([
    "schema_version",
    "evidence_id",
    "item_id",
    "kind",
    "subject",
    "criteria_ref",
    "supersedes",
    "dimension",
    "outcome",
    "evidence_refs",
    "reason",
    "data",
    "created_at"
  ]);
  assertExactKeys(body, /* @__PURE__ */ new Set([...required, "provenance"]), label, required);
  if (Object.hasOwn(body, "provenance")) {
    assertExactKeys(body.provenance, /* @__PURE__ */ new Set(["tier", "capture"]), `${label}.provenance`);
    if (!(/* @__PURE__ */ new Set(["observed", "declared"])).has(body.provenance.tier)) invalid2(`${label}.provenance.tier is unsupported`);
    if (body.provenance.tier === "observed") validateCapture(body.provenance.capture);
    else if (body.provenance.capture !== null) invalid2("declared provenance cannot claim capture");
  }
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.evidence_id, `${label}.evidence_id`);
  validateSupersedes(body.supersedes, body.evidence_id, label);
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  if (!EVIDENCE_KINDS.has(body.kind)) invalid2(`${label}.kind is unsupported`);
  validateNullableSubject(body.subject, `${label}.subject`);
  if (body.kind === "recovery-reconciliation") {
    if (body.criteria_ref !== null) invalid2(`${label}.criteria_ref must be null for recovery`);
    if (body.supersedes.length > 0) invalid2(`${label} recovery reconciliation cannot supersede observations`);
  } else {
    validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  }
  if (body.kind === "recovery-reconciliation" && body.subject !== null) {
    invalid2(`${label}.subject must be null for recovery reconciliation`);
  }
  if (body.kind !== "recovery-reconciliation" && body.subject === null) {
    invalid2(`${label}.subject is required`);
  }
  if (body.kind === "dod-dimension") {
    if (!DOD_DIMENSIONS.has(body.dimension)) invalid2(`${label}.dimension is unsupported`);
    if (!(/* @__PURE__ */ new Set(["clear", "waived", "gap"])).has(body.outcome)) {
      invalid2(`${label}.outcome is unsupported for a DoD dimension`);
    }
    if (body.outcome === "waived") assertNonEmptyString(body.reason, `${label}.reason`);
  } else {
    if (body.dimension !== null) invalid2(`${label}.dimension must be null`);
    if (!(/* @__PURE__ */ new Set(["passed", "failed"])).has(body.outcome)) {
      invalid2(`${label}.outcome is unsupported`);
    }
  }
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, { nonEmpty: true });
  assertNullableString(body.reason, `${label}.reason`);
  if (body.kind === "dod-dimension") {
    assertExactKeys(body.data, /* @__PURE__ */ new Set(), `${label}.data`);
  } else if (body.kind === "deployment") {
    assertExactKeys(
      body.data,
      /* @__PURE__ */ new Set(["environment", "deployment_id"]),
      `${label}.data`
    );
    assertNonEmptyString(body.data.environment, `${label}.data.environment`);
    assertNonEmptyString(body.data.deployment_id, `${label}.data.deployment_id`);
  } else if (body.kind === "production-verification") {
    assertExactKeys(body.data, /* @__PURE__ */ new Set(["environment", "deployment_id", "checks"]), `${label}.data`);
    assertNonEmptyString(body.data.environment, `${label}.data.environment`);
    assertNonEmptyString(body.data.deployment_id, `${label}.data.deployment_id`);
    assertStringArray(body.data.checks, `${label}.data.checks`, { nonEmpty: true });
  } else {
    assertExactKeys(body.data, /* @__PURE__ */ new Set([
      "stale_lease_token",
      "disposition",
      "observed"
    ]), `${label}.data`);
    assertNonEmptyString(
      body.data.stale_lease_token,
      `${label}.data.stale_lease_token`
    );
    if (!RECOVERY_DISPOSITIONS.has(body.data.disposition)) {
      invalid2(`${label}.data.disposition is unsupported`);
    }
    assertNonEmptyString(body.data.observed, `${label}.data.observed`);
  }
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateGrantBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "grant_id",
    "item_id",
    "actor",
    "actions",
    "record_kind",
    "record_id",
    "basis_ref",
    "lease_token",
    "issued_by",
    "created_at",
    "expires_at",
    "status"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.grant_id, `${label}.grant_id`);
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  validateActor(body.actor, `${label}.actor`);
  assertStringArray(body.actions, `${label}.actions`, { nonEmpty: true });
  if (!RECORD_KINDS.has(body.record_kind)) invalid2(`${label}.record_kind is unsupported`);
  assertNonEmptyString(body.record_id, `${label}.record_id`);
  assertNonEmptyString(body.basis_ref, `${label}.basis_ref`);
  assertNonEmptyString(body.lease_token, `${label}.lease_token`);
  validateActor(body.issued_by, `${label}.issued_by`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  assertTimestamp(body.expires_at, `${label}.expires_at`);
  if (!(/* @__PURE__ */ new Set(["active", "recovered", "revoked"])).has(body.status)) {
    invalid2(`${label}.status is unsupported`);
  }
}
function validateAttemptBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "attempt_id",
    "item_id",
    "grantor",
    "stale_lease",
    "observed",
    "disposition",
    "recovery_evidence_ids",
    "new_lease",
    "created_at"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.attempt_id, `${label}.attempt_id`);
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  validateActor(body.grantor, `${label}.grantor`);
  if (body.stale_lease === null) invalid2(`${label}.stale_lease is required`);
  validateLease(body.stale_lease, `${label}.stale_lease`);
  assertNonEmptyString(body.observed, `${label}.observed`);
  if (!RECOVERY_DISPOSITIONS.has(body.disposition)) {
    invalid2(`${label}.disposition is unsupported`);
  }
  assertStringArray(
    body.recovery_evidence_ids,
    `${label}.recovery_evidence_ids`,
    { nonEmpty: true }
  );
  validateLease(body.new_lease, `${label}.new_lease`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}
var ASSET_DISPOSITIONS = /* @__PURE__ */ new Set([
  "scratch",
  "draft",
  "working",
  "published",
  "personal",
  "archived",
  "retracted",
  "discarded"
]);
var ASSET_VALIDITIES = /* @__PURE__ */ new Set([
  "unknown",
  "provisional",
  "current",
  "stale",
  "expired",
  "superseded",
  "invalidated",
  "retired"
]);
var CLASSIFICATIONS = /* @__PURE__ */ new Set(["public", "internal", "confidential", "personal"]);
function validateCaptureReference(value, label) {
  if (typeof value !== "string" || !/^(host|artifact|evidence):[a-z0-9][a-z0-9._:-]*$/i.test(value)) {
    invalid2(`${label} must be a logical host/artifact/evidence reference, never a machine path`);
  }
}
function validateCapture(value) {
  assertExactKeys(value, /* @__PURE__ */ new Set([
    "source",
    "reference",
    "actor",
    "captured_at",
    "command",
    "exit_code",
    "checks",
    "classification",
    "command_digest"
  ]), "capture");
  validateCriteriaRef(value.command_digest, "capture.command_digest");
  if (value.source !== "host-command") invalid2("capture.source must be host-command");
  validateCaptureReference(value.reference, "capture.reference");
  validateActor(value.actor, "capture.actor");
  assertTimestamp(value.captured_at, "capture.captured_at");
  if (!Array.isArray(value.command) || value.command.length === 0) invalid2("capture.command is required");
  value.command.forEach((entry) => assertNonEmptyString(entry, "capture.command entry"));
  if (!Number.isSafeInteger(value.exit_code)) invalid2("capture.exit_code must be an integer");
  assertStringArray(value.checks, "capture.checks");
  if (!CLASSIFICATIONS.has(value.classification)) invalid2("capture.classification is unsupported");
  return value;
}
function validateDecisionProvenance(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set(["source", "reference", "attributed_to", "captured_at"]), label);
  if (!(/* @__PURE__ */ new Set(["host-interaction", "attributed-supplied"])).has(value.source)) invalid2(`${label}.source is unsupported`);
  validateCaptureReference(value.reference, `${label}.reference`);
  assertNonEmptyString(value.attributed_to, `${label}.attributed_to`);
  assertTimestamp(value.captured_at, `${label}.captured_at`);
}
function validateOperatorDecision(value) {
  const keys = [
    "source",
    "reference",
    "attributed_to",
    "captured_at",
    "item_id",
    "subject",
    "criteria_ref",
    "kind",
    "decision",
    "deployment",
    "recovery"
  ];
  assertExactKeys(value, new Set(keys), "operator decision");
  validateDecisionProvenance(Object.fromEntries(keys.slice(0, 4).map((key) => [key, value[key]])), "operator decision provenance");
  assertNonEmptyString(value.item_id, "operator decision item_id");
  validateNullableSubject(value.subject, "operator decision subject");
  validateCriteriaRef(value.criteria_ref, "operator decision criteria_ref");
  if (!APPROVAL_KINDS.has(value.kind)) invalid2("operator decision kind is unsupported");
  if (!(/* @__PURE__ */ new Set(["approved", "rejected"])).has(value.decision)) invalid2("operator decision is unsupported");
  canonicalJson(value);
}
function operatorDecisionActor(provenance) {
  validateDecisionProvenance(provenance, "operator decision identity");
  return { role: "operator", runId: `human:${createHash("sha256").update(canonicalJson(provenance)).digest("hex")}` };
}
function validateArtifactBody(body, label) {
  const required = /* @__PURE__ */ new Set([
    "schema_version",
    "artifact_id",
    "item_id",
    "producer",
    "subject",
    "criteria_ref",
    "project_id",
    "run_directory",
    "snapshots",
    "manifest_path",
    "classification",
    "media_type",
    "title",
    "created_at"
  ]);
  assertExactKeys(body, /* @__PURE__ */ new Set([...required, "input_basis"]), label, required);
  if (body.input_basis !== void 0) {
    if (!Array.isArray(body.input_basis)) invalid2(`${label}.input_basis must be an array`);
    const references = /* @__PURE__ */ new Set();
    for (const basis of body.input_basis) {
      assertExactKeys(basis, /* @__PURE__ */ new Set(["reference", "digest"]), `${label}.input_basis entry`);
      assertNonEmptyString(basis.reference, `${label}.input reference`);
      validateCriteriaRef(basis.digest, `${label}.input digest`);
      if (references.has(basis.reference)) invalid2(`${label}.input_basis has duplicate references`);
      references.add(basis.reference);
    }
  }
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.artifact_id, `${label}.artifact_id`);
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  validateActor(body.producer, `${label}.producer`);
  validateSubjectRef(body.subject, `${label}.subject`);
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  assertNullableString(body.project_id, `${label}.project_id`);
  assertNonEmptyString(body.run_directory, `${label}.run_directory`);
  if (!Array.isArray(body.snapshots)) invalid2(`${label}.snapshots must be an array`);
  for (const snapshot of body.snapshots) {
    assertExactKeys(snapshot, /* @__PURE__ */ new Set(["path", "digest", "snapshot_path"]), `${label}.snapshot`);
    assertNonEmptyString(snapshot.path, `${label}.snapshot.path`);
    assertNonEmptyString(snapshot.snapshot_path, `${label}.snapshot.snapshot_path`);
    validateCriteriaRef(snapshot.digest, `${label}.snapshot.digest`);
  }
  if (body.subject.kind === "git" !== (body.snapshots.length === 0)) invalid2(`${label} requires exact non-Git snapshots`);
  assertNullableString(body.manifest_path, `${label}.manifest_path`);
  if (body.subject.kind === "git" !== (body.manifest_path === null)) invalid2(`${label} requires non-Git manifest`);
  if (!CLASSIFICATIONS.has(body.classification)) invalid2(`${label}.classification is unsupported`);
  for (const key of ["media_type", "title"]) assertNonEmptyString(body[key], `${label}.${key}`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateAssetBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "asset_id",
    "item_id",
    "artifact_id",
    "revision",
    "producer",
    "completion_authority",
    "validity_owner",
    "disposition",
    "validity",
    "target",
    "completion_approval_id",
    "input_asset_ids",
    "supersedes",
    "superseded_by",
    "history",
    "updated_at"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  for (const key of ["asset_id", "artifact_id"]) assertUuid(body[key], `${label}.${key}`);
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  if (!Number.isSafeInteger(body.revision) || body.revision < 1) invalid2(`${label}.revision must be positive`);
  validateActor(body.producer, `${label}.producer`);
  assertNonEmptyString(body.completion_authority, `${label}.completion_authority`);
  assertNullableString(body.validity_owner, `${label}.validity_owner`);
  if (!ASSET_DISPOSITIONS.has(body.disposition) || !ASSET_VALIDITIES.has(body.validity)) invalid2(`${label} has unsupported state`);
  assertNonEmptyString(body.target, `${label}.target`);
  for (const key of ["completion_approval_id", "supersedes", "superseded_by"]) {
    if (body[key] !== null) assertUuid(body[key], `${label}.${key}`);
  }
  assertStringArray(body.input_asset_ids, `${label}.input_asset_ids`);
  for (const id of body.input_asset_ids) assertUuid(id, `${label}.input_asset_ids entry`);
  if (!Array.isArray(body.history) || body.history.length === 0) invalid2(`${label}.history is required`);
  for (const entry of body.history) {
    assertExactKeys(entry, /* @__PURE__ */ new Set(["disposition", "validity", "target", "reason", "at", "at_item_version"]), `${label}.history entry`);
    if (!Number.isSafeInteger(entry.at_item_version) || entry.at_item_version < 1) invalid2(`${label}.history item version must be positive`);
    if (!ASSET_DISPOSITIONS.has(entry.disposition) || !ASSET_VALIDITIES.has(entry.validity)) invalid2(`${label} history has unsupported state`);
    assertNonEmptyString(entry.target, `${label}.history.target`);
    assertNonEmptyString(entry.reason, `${label}.history.reason`);
    assertTimestamp(entry.at, `${label}.history.at`);
  }
  assertTimestamp(body.updated_at, `${label}.updated_at`);
}
function validateProducerCommand(command) {
  if (command.recordKind !== "item" || command.expectedVersion < 1) invalid2(`${command.kind} requires an existing item`);
  if (command.kind === "artifact.register") {
    const required = /* @__PURE__ */ new Set([
      "artifactId",
      "assetId",
      "subject",
      "projectId",
      "classification",
      "mediaType",
      "title",
      "inputAssetIds",
      "at"
    ]);
    assertExactKeys(command.payload, /* @__PURE__ */ new Set([...required, "recoveryLeaseToken"]), "artifact.register payload", required);
    if (Object.hasOwn(command.payload, "recoveryLeaseToken")) {
      assertNonEmptyString(command.payload.recoveryLeaseToken, "artifact.register recoveryLeaseToken");
    }
    for (const key of ["artifactId", "assetId"]) assertUuid(command.payload[key], `artifact.register ${key}`);
    validateSubjectRef(command.payload.subject);
    assertNullableString(command.payload.projectId, "artifact.register projectId");
    if (!CLASSIFICATIONS.has(command.payload.classification)) invalid2("artifact.register classification is unsupported");
    for (const key of ["mediaType", "title"]) assertNonEmptyString(command.payload[key], `artifact.register ${key}`);
    assertStringArray(command.payload.inputAssetIds, "artifact.register inputAssetIds");
    for (const id of command.payload.inputAssetIds) assertUuid(id, "artifact.register inputAssetIds entry");
    assertTimestamp(command.payload.at, "artifact.register at");
  } else if (command.kind === "asset.transition") {
    assertExactKeys(command.payload, /* @__PURE__ */ new Set([
      "assetId",
      "disposition",
      "validity",
      "target",
      "approvalId",
      "supersedes",
      "reason",
      "at"
    ]), "asset.transition payload");
    assertUuid(command.payload.assetId, "asset.transition assetId");
    for (const key of ["approvalId", "supersedes"]) {
      if (command.payload[key] !== null) assertUuid(command.payload[key], `asset.transition ${key}`);
    }
    if (!ASSET_DISPOSITIONS.has(command.payload.disposition) || !ASSET_VALIDITIES.has(command.payload.validity)) invalid2("asset.transition state is unsupported");
    assertNullableString(command.payload.target, "asset.transition target");
    assertNonEmptyString(command.payload.reason, "asset.transition reason");
    assertTimestamp(command.payload.at, "asset.transition at");
  } else {
    assertExactKeys(command.payload, new Set(command.kind === "evidence.register" ? ["body", "tier"] : ["body"]), `${command.kind} payload`);
    const kind = command.kind.split(".")[0];
    recordBodyValidators.get(kind)(command.payload.body, `${command.kind} body`);
    if (command.payload.body.item_id !== command.recordId) invalid2(`${command.kind} must bind the primary item`);
    if (Object.hasOwn(command.payload.body, "provenance")) invalid2("provenance is host-derived, not command input");
    if (Object.hasOwn(command.payload.body, "recorded_at_item_version")) invalid2("recorded item version is runtime-derived");
    if (kind === "evidence" && !(/* @__PURE__ */ new Set(["observed", "declared"])).has(command.payload.tier)) invalid2("evidence.register tier is unsupported");
  }
}
var recordBodyValidators = /* @__PURE__ */ new Map([
  ["initiative", validateInitiativeBody],
  ["item", validateItemBody],
  ["question", validateQuestionBody],
  ["attempt", validateAttemptBody],
  ["host-attempt", validateHostRecord],
  ["evidence", validateEvidenceBody],
  ["review", validateReviewBody],
  ["approval", validateApprovalBody],
  ["message", validateMessageBody],
  ["grant", validateGrantBody],
  ["artifact", validateArtifactBody],
  ["asset", validateAssetBody],
  ["effect", (body, label) => validateHostRecord(body, label, true)]
]);
function validateCreate(command, expectedKind, bodyValidator) {
  if (command.recordKind !== expectedKind) {
    invalid2(`${command.kind} requires recordKind "${expectedKind}"`);
  }
  if (command.expectedVersion !== 0) invalid2(`${command.kind} requires version 0`);
  if (command.leaseToken !== null) invalid2(`${command.kind} cannot carry a lease token`);
  assertExactKeys(command.payload, /* @__PURE__ */ new Set(["body"]), `${command.kind} payload`);
  bodyValidator(command.payload.body, `${command.kind} payload.body`);
  if (command.payload.body.id !== command.recordId) {
    invalid2(`${command.kind} body id must match command.recordId`);
  }
}
function validateChangesPayload(command, fields, label) {
  assertExactKeys(command.payload, /* @__PURE__ */ new Set(["changes"]), `${label} payload`);
  if (!isPlainObject(command.payload.changes) || Object.keys(command.payload.changes).length === 0) {
    invalid2(`${label} payload.changes must be a non-empty object`);
  }
  for (const key of Object.keys(command.payload.changes)) {
    if (!fields.has(key)) invalid2(`${label} cannot change "${key}"`);
  }
}
function validateItemUpdate(command) {
  if (command.recordKind !== "item") invalid2('item.update requires recordKind "item"');
  if (command.expectedVersion < 1) invalid2("item.update requires an existing record version");
  if (Object.keys(command.payload).length === 1 && Object.hasOwn(command.payload, "title")) {
    assertNonEmptyString(command.payload.title, "item.update payload.title");
    return;
  }
  validateChangesPayload(command, ITEM_DESCRIPTIVE_FIELDS, "item.update");
}
function validateInitiativeUpdate(command) {
  if (command.recordKind !== "initiative") {
    invalid2('initiative.update requires recordKind "initiative"');
  }
  if (command.expectedVersion < 1) {
    invalid2("initiative.update requires an existing record version");
  }
  validateChangesPayload(command, /* @__PURE__ */ new Set([
    "title",
    "status",
    "scope",
    "milestones",
    "backlog",
    "north_star_ref",
    "updated_at"
  ]), "initiative.update");
}
function validateAtPayload(command, kind, keys) {
  if (command.recordKind !== "item") invalid2(`${kind} requires recordKind "item"`);
  if (command.expectedVersion < 1) invalid2(`${kind} requires an existing record version`);
  assertExactKeys(command.payload, new Set(keys), `${kind} payload`);
}
function validateItemPromote(command) {
  validateAtPayload(command, "item.promote", ["at"]);
  assertTimestamp(command.payload.at, "item.promote payload.at");
}
function validateItemGrant(command) {
  validateAtPayload(command, "item.grant", [
    "holder",
    "actions",
    "acquiredAt",
    "expiresAt"
  ]);
  validateActor(command.payload.holder, "item.grant payload.holder");
  assertStringArray(command.payload.actions, "item.grant payload.actions", { nonEmpty: true });
  for (const action of command.payload.actions) {
    if (!(/* @__PURE__ */ new Set([
      "item.update",
      "item.transition",
      "item.handoff",
      "question.open",
      "artifact.register",
      "asset.transition",
      "evidence.register",
      "review.record",
      "approval.record"
    ])).has(action)) {
      invalid2(`item.grant payload.actions contains unsupported action "${action}"`);
    }
  }
  assertTimestamp(command.payload.acquiredAt, "item.grant payload.acquiredAt");
  assertTimestamp(command.payload.expiresAt, "item.grant payload.expiresAt");
  if (Date.parse(command.payload.expiresAt) <= Date.parse(command.payload.acquiredAt)) {
    invalid2("item.grant payload.expiresAt must be after acquiredAt");
  }
}
function validateTransition(command) {
  if (command.recordKind !== "item") {
    invalid2('item.transition requires recordKind "item"');
  }
  if (command.expectedVersion < 1) {
    invalid2("item.transition requires an existing record version");
  }
  assertExactKeys(
    command.payload,
    /* @__PURE__ */ new Set(["to", "at", "reason", "subject"]),
    "item.transition payload",
    /* @__PURE__ */ new Set(["to", "at", "reason"])
  );
  if (!LIFECYCLE.has(command.payload.to)) invalid2("item.transition payload.to is unsupported");
  assertTimestamp(command.payload.at, "item.transition payload.at");
  assertNonEmptyString(command.payload.reason, "item.transition payload.reason");
  if (Object.hasOwn(command.payload, "subject")) {
    validateNullableSubject(command.payload.subject, "item.transition payload.subject");
  }
  if (command.payload.to === "in-review" && (!Object.hasOwn(command.payload, "subject") || command.payload.subject === null)) {
    invalid2("item.transition to in-review requires a subject");
  }
}
function validateHandoffContent(content) {
  assertExactKeys(content, /* @__PURE__ */ new Set([
    "did",
    "needs",
    "assetState",
    "authority",
    "revalidation",
    "questions"
  ]), "item.handoff payload.content");
  for (const key of ["did", "needs", "assetState", "authority", "revalidation"]) {
    assertNonEmptyString(content[key], `item.handoff payload.content.${key}`);
  }
  assertStringArray(content.questions, "item.handoff payload.content.questions");
}
function validateMessagePayload(command, kind, contentValidator) {
  validateAtPayload(command, kind, [
    ...kind === "question.open" ? ["questionId"] : [],
    ...kind === "question.answer" ? ["questionId"] : [],
    "messageId",
    "parentId",
    "recipient",
    "kind",
    "createdAt",
    "content",
    "artifactRefs",
    "evidenceRefs",
    "provenance"
  ]);
  if (kind === "question.open" || kind === "question.answer") {
    assertNonEmptyString(command.payload.questionId, `${kind} payload.questionId`);
  }
  assertUuid(command.payload.messageId, `${kind} payload.messageId`);
  if (command.payload.parentId !== null) {
    assertUuid(command.payload.parentId, `${kind} payload.parentId`);
  }
  assertNonEmptyString(command.payload.recipient, `${kind} payload.recipient`);
  assertNonEmptyString(command.payload.kind, `${kind} payload.kind`);
  const expectedKind = kind === "question.open" ? "question" : "answer";
  if (command.payload.kind !== expectedKind) {
    invalid2(`${kind} payload.kind must be "${expectedKind}"`);
  }
  assertTimestamp(command.payload.createdAt, `${kind} payload.createdAt`);
  contentValidator(command.payload.content);
  assertStringArray(command.payload.artifactRefs, `${kind} payload.artifactRefs`);
  assertStringArray(command.payload.evidenceRefs, `${kind} payload.evidenceRefs`);
  if (!PROVENANCE_KINDS.has(command.payload.provenance)) {
    invalid2(`${kind} payload.provenance is unsupported`);
  }
}
function validateQuestionContent(content) {
  assertExactKeys(content, /* @__PURE__ */ new Set([
    "questionKind",
    "blocking",
    "context",
    "ask",
    "answerBy"
  ]), "question.open payload.content");
  if (!QUESTION_KINDS.has(content.questionKind)) {
    invalid2("question.open payload.content.questionKind is unsupported");
  }
  assertBoolean(content.blocking, "question.open payload.content.blocking");
  assertNonEmptyString(content.context, "question.open payload.content.context");
  assertNonEmptyString(content.ask, "question.open payload.content.ask");
  assertNonEmptyString(content.answerBy, "question.open payload.content.answerBy");
}
function validateAnswerContent(content) {
  assertExactKeys(
    content,
    /* @__PURE__ */ new Set(["status", "answer", "lane", "resolves"]),
    "question.answer payload.content",
    /* @__PURE__ */ new Set(["status", "answer", "lane"])
  );
  if (content.status !== "answered") {
    invalid2('question.answer payload.content.status must be "answered"');
  }
  assertNonEmptyString(content.answer, "question.answer payload.content.answer");
  if (content.lane !== "in-lane" && content.lane !== "out-of-lane") {
    invalid2("question.answer payload.content.lane is unsupported");
  }
  if (Object.hasOwn(content, "resolves")) {
    assertStringArray(content.resolves, "question.answer payload.content.resolves", { nonEmpty: true });
    for (const id of content.resolves) assertUuid(id, "question.answer payload.content.resolves entry");
    if (content.lane !== "in-lane") invalid2("out-of-lane answers cannot resolve contradictions");
  }
}
function validateItemHandoff(command) {
  if (command.recordKind !== "item") invalid2('item.handoff requires recordKind "item"');
  if (command.expectedVersion < 1) {
    invalid2("item.handoff requires an existing record version");
  }
  const required = /* @__PURE__ */ new Set([
    "toRole",
    "state",
    "createdAt",
    "messageId",
    "parentId",
    "content",
    "artifactRefs",
    "evidenceRefs",
    "provenance"
  ]);
  assertExactKeys(
    command.payload,
    /* @__PURE__ */ new Set([...required, "subject"]),
    "item.handoff payload",
    required
  );
  assertNonEmptyString(command.payload.toRole, "item.handoff payload.toRole");
  if (command.payload.state !== null && !LIFECYCLE.has(command.payload.state)) {
    invalid2("item.handoff payload.state is unsupported");
  }
  if (Object.hasOwn(command.payload, "subject")) {
    validateNullableSubject(command.payload.subject, "item.handoff payload.subject");
  }
  if (command.payload.state === "in-review" && (!Object.hasOwn(command.payload, "subject") || command.payload.subject === null)) {
    invalid2("item.handoff to in-review requires a subject");
  }
  assertTimestamp(command.payload.createdAt, "item.handoff payload.createdAt");
  assertUuid(command.payload.messageId, "item.handoff payload.messageId");
  if (command.payload.parentId !== null) {
    assertUuid(command.payload.parentId, "item.handoff payload.parentId");
  }
  validateHandoffContent(command.payload.content);
  assertStringArray(command.payload.artifactRefs, "item.handoff payload.artifactRefs");
  assertStringArray(command.payload.evidenceRefs, "item.handoff payload.evidenceRefs");
  if (!PROVENANCE_KINDS.has(command.payload.provenance)) {
    invalid2("item.handoff payload.provenance is unsupported");
  }
}
function validateRestore(command) {
  if (command.recordKind !== "item" || command.expectedVersion < 1) {
    invalid2("item.restore requires an existing item");
  }
  assertExactKeys(
    command.payload,
    /* @__PURE__ */ new Set(["at", "recoveryApprovalId"]),
    "item.restore payload",
    /* @__PURE__ */ new Set(["at"])
  );
  assertTimestamp(command.payload.at, "item.restore payload.at");
  if (Object.hasOwn(command.payload, "recoveryApprovalId")) {
    assertUuid(command.payload.recoveryApprovalId, "item.restore payload.recoveryApprovalId");
  }
}
function validateRecover(command) {
  validateAtPayload(command, "attempt.recover", [
    "attemptId",
    "observed",
    "disposition",
    "recoveryEvidenceIds",
    "redispatch",
    "createdAt",
    "expiresAt"
  ]);
  assertUuid(command.payload.attemptId, "attempt.recover payload.attemptId");
  assertNonEmptyString(command.payload.observed, "attempt.recover payload.observed");
  if (!RECOVERY_DISPOSITIONS.has(command.payload.disposition)) {
    invalid2("attempt.recover payload.disposition is unsupported");
  }
  assertStringArray(
    command.payload.recoveryEvidenceIds,
    "attempt.recover payload.recoveryEvidenceIds"
  );
  validateNullableActor(command.payload.redispatch, "attempt.recover payload.redispatch");
  assertTimestamp(command.payload.createdAt, "attempt.recover payload.createdAt");
  if (command.payload.expiresAt !== null) {
    assertTimestamp(command.payload.expiresAt, "attempt.recover payload.expiresAt");
  }
  if (command.payload.disposition === "safe-to-resume") {
    if (command.payload.redispatch === null !== (command.payload.expiresAt === null)) {
      invalid2("safe recovery requires redispatch and expiresAt together, or neither");
    }
    if (command.payload.expiresAt !== null && Date.parse(command.payload.expiresAt) <= Date.parse(command.payload.createdAt)) {
      invalid2("recovered lease expiresAt must be after createdAt");
    }
  } else if (command.payload.redispatch !== null || command.payload.expiresAt !== null) {
    invalid2("conflicting recovery cannot redispatch or set expiresAt");
  }
}
var commandValidators = new Map([
  ...[...HOST_COMMANDS].map((kind) => [kind, validateHostCommand]),
  ...["artifact.register", "asset.transition", "evidence.register", "review.record", "approval.record"].map((kind) => [kind, validateProducerCommand]),
  ["initiative.create", (command) => validateCreate(command, "initiative", validateInitiativeBody)],
  ["initiative.update", validateInitiativeUpdate],
  ["item.create", (command) => validateCreate(command, "item", validateItemBody)],
  ["item.update", validateItemUpdate],
  ["item.promote", validateItemPromote],
  ["item.grant", validateItemGrant],
  ["item.transition", validateTransition],
  ["item.handoff", validateItemHandoff],
  ["item.restore", validateRestore],
  ["question.open", (command) => validateMessagePayload(command, "question.open", validateQuestionContent)],
  ["question.answer", (command) => validateMessagePayload(command, "question.answer", validateAnswerContent)],
  ["attempt.recover", validateRecover]
]);
function validateAuthority(authority) {
  assertExactKeys(authority, /* @__PURE__ */ new Set(["roles", "grants"]), "authority");
  assertStringArray(authority.roles, "authority.roles");
  if (authority.roles.includes("operator")) {
    invalid2("operator is a reserved endpoint, not an installed role");
  }
  if (!Array.isArray(authority.grants)) invalid2("authority.grants must be an array");
  for (const [index, grant] of authority.grants.entries()) {
    const label = `authority.grants[${index}]`;
    assertExactKeys(grant, /* @__PURE__ */ new Set([
      "actor",
      "actions",
      "recordKind",
      "recordId",
      "basisRef"
    ]), label);
    validateActor(grant.actor, `${label}.actor`);
    assertStringArray(grant.actions, `${label}.actions`, { nonEmpty: true });
    for (const action of grant.actions) {
      if (!COMMAND_KINDS.has(action)) {
        invalid2(`${label}.actions contains unsupported action "${action}"`);
      }
    }
    if (!RECORD_KINDS.has(grant.recordKind)) {
      invalid2(`${label}.recordKind is unsupported`);
    }
    assertNonEmptyString(grant.recordId, `${label}.recordId`);
    assertNonEmptyString(grant.basisRef, `${label}.basisRef`);
  }
  return authority;
}
function validateCommand(command) {
  if (!isPlainObject(command)) invalid2("command must be an object");
  assertExactKeys(command, /* @__PURE__ */ new Set([
    "operationId",
    "kind",
    "actor",
    "recordKind",
    "recordId",
    "expectedVersion",
    "leaseToken",
    "payload"
  ]), "command");
  assertUuid(command.operationId, "command.operationId");
  assertNonEmptyString(command.kind, "command.kind");
  if (!COMMAND_KINDS.has(command.kind)) {
    invalid2(`unsupported command kind "${command.kind}"`);
  }
  validateActor(command.actor, "command.actor");
  if (!RECORD_KINDS.has(command.recordKind)) {
    invalid2(`unsupported record kind "${command.recordKind}"`);
  }
  assertNonEmptyString(command.recordId, "command.recordId");
  if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 0) {
    invalid2("command.expectedVersion must be a non-negative safe integer");
  }
  if (command.leaseToken !== null) {
    assertNonEmptyString(command.leaseToken, "command.leaseToken");
  }
  if (!isPlainObject(command.payload)) invalid2("command.payload must be an object");
  canonicalJson(command.payload);
  commandValidators.get(command.kind)(command);
  return command;
}
function changedKeys(before, after) {
  const keys = /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => canonicalJson(before[key]) !== canonicalJson(after[key]));
}
function assertChangedOnly(current, nextBody, allowed, label) {
  for (const key of changedKeys(current.body, nextBody)) {
    if (!allowed.has(key)) invalid2(`${label} may not change "${key}"`);
  }
}
function validateCommandMutation(command, current, nextBody) {
  if (!isPlainObject(nextBody)) invalid2(`${command.kind} must produce an object body`);
  if (HOST_COMMANDS.has(command.kind)) {
    validateHostMutation(command, current, nextBody);
    return nextBody;
  }
  if (command.kind.endsWith(".create")) {
    if (current) invalid2(`${command.kind} requires a missing record`);
    if (canonicalJson(nextBody) !== canonicalJson(command.payload.body)) {
      invalid2(`${command.kind} must create the supplied body exactly`);
    }
    return nextBody;
  }
  if (!current) invalid2(`${command.kind} requires an existing record`);
  if (command.kind === "item.update") {
    const changes = Object.hasOwn(command.payload, "changes") ? command.payload.changes : { title: command.payload.title };
    const expected = { ...current.body, ...changes };
    if (canonicalJson(nextBody) !== canonicalJson(expected)) {
      invalid2("item.update may only apply the descriptive changes in its payload");
    }
  } else if (command.kind === "initiative.update") {
    const expected = { ...current.body, ...command.payload.changes };
    if (canonicalJson(nextBody) !== canonicalJson(expected)) {
      invalid2("initiative.update may only apply the changes in its payload");
    }
  } else {
    const allowedByKind = new Map([
      ...["artifact.register", "asset.transition", "evidence.register", "review.record", "approval.record"].map((kind) => [kind, /* @__PURE__ */ new Set()]),
      ["item.promote", /* @__PURE__ */ new Set(["state", "updated_at"])],
      ["item.grant", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "producer_actor",
        "producing_actors",
        "next_role",
        "lease",
        "updated_at"
      ])],
      ["item.transition", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "acceptance_actor",
        "next_role",
        "lease",
        "change_ref",
        "updated_at"
      ])],
      ["item.handoff", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "acceptance_actor",
        "next_role",
        "lease",
        "change_ref",
        "updated_at"
      ])],
      ["item.restore", /* @__PURE__ */ new Set(["state", "resume_state", "next_role", "recovery_hold", "updated_at"])],
      ["question.open", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "lease",
        "waiting_on_questions",
        "updated_at"
      ])],
      ["question.answer", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "lease",
        "waiting_on_questions",
        "updated_at"
      ])],
      ["attempt.recover", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "next_role",
        "lease",
        "producer_actor",
        "producing_actors",
        "recovery_hold",
        "updated_at"
      ])]
    ]);
    assertChangedOnly(current, nextBody, allowedByKind.get(command.kind), command.kind);
  }
  return nextBody;
}
function validateRecord(record) {
  if (!isPlainObject(record)) invalid2("record must be an object");
  assertExactKeys(record, /* @__PURE__ */ new Set([
    "kind",
    "id",
    "itemId",
    "version",
    "body"
  ]), "record");
  if (!RECORD_KINDS.has(record.kind)) {
    invalid2(`unsupported record kind "${record.kind}"`);
  }
  assertNonEmptyString(record.id, "record.id");
  if (record.itemId !== null) assertNonEmptyString(record.itemId, "record.itemId");
  if (!Number.isSafeInteger(record.version) || record.version < 1) {
    invalid2("record.version must be a positive safe integer");
  }
  const validator = recordBodyValidators.get(record.kind);
  validator(record.body, `record ${record.kind}/${record.id} body`);
  if (record.kind === "item" && (record.id !== record.body.id || record.itemId !== record.id)) {
    invalid2("item record envelope must match body.id");
  }
  if (record.kind === "initiative" && (record.id !== record.body.id || record.itemId !== null)) {
    invalid2("initiative record envelope must match body.id and have null itemId");
  }
  if ((/* @__PURE__ */ new Set([
    "question",
    "attempt",
    "host-attempt",
    "effect",
    "evidence",
    "review",
    "approval",
    "artifact",
    "asset",
    "message",
    "grant"
  ])).has(record.kind) && record.itemId !== record.body.item_id) {
    invalid2(`${record.kind} record itemId must match body.item_id`);
  }
  const identityKeys = /* @__PURE__ */ new Map([
    ["artifact", "artifact_id"],
    ["asset", "asset_id"],
    ["question", "question_id"],
    ["attempt", "attempt_id"],
    ["host-attempt", "attempt_id"],
    ["effect", "effect_id"],
    ["evidence", "evidence_id"],
    ["review", "review_id"],
    ["approval", "approval_id"],
    ["message", "message_id"],
    ["grant", "grant_id"]
  ]);
  const identityKey = identityKeys.get(record.kind);
  if (identityKey && record.id !== record.body[identityKey]) {
    invalid2(`${record.kind} record id must match body.${identityKey}`);
  }
  return record;
}

export {
  LIFECYCLE,
  NEEDS_CHANGE_REF,
  REQUIRES_STATES,
  TERMINAL,
  OPERATOR_GATED,
  frontmatter,
  cleanScalar,
  scalar,
  isNull,
  unquote,
  dependsOn,
  lease,
  listBlock,
  mapListBlock,
  parseStamp,
  parseThread,
  MAX_OBSERVATIONS,
  fail,
  clone,
  text,
  validateCapabilities,
  approvedProfileModel,
  sanitizeFacts,
  validateHostObservation,
  latestTerminalObservations,
  attemptSummary,
  effectSummary,
  COMMAND_KINDS,
  RECORD_KINDS,
  DOD_DIMENSIONS,
  RuntimeError,
  criteriaRef,
  subjectEquals,
  isProducingRun,
  isPlainObject,
  assertExactKeys,
  validateActor,
  canonicalJson,
  commandDigest,
  validateSubjectRef,
  CLASSIFICATIONS,
  validateCapture,
  validateOperatorDecision,
  operatorDecisionActor,
  validateAuthority,
  validateCommand,
  validateCommandMutation,
  validateRecord
};

import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  TASK_DEPENDENCY_STATES,
  TASK_LIFECYCLE
} from "./chunk-ITUOITH3.mjs";

// src/core/lib/coordination-runtime/contract-primitives.mjs
import { createHash } from "node:crypto";
var SUBJECT_KINDS = /* @__PURE__ */ new Set(["git", "sha256", "bundle-sha256"]);
var PACKS = /* @__PURE__ */ new Set(["core", "engineering", "creative"]);
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var HEX_DIGEST = /^[0-9a-f]{64}$/i;
var GIT_OBJECT = /^[0-9a-f]{7,40}$/i;
var SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";
var EPIC_ID = new RegExp(`^epic:(?<slug>${SLUG})$`);
var TYPED_ID = new RegExp(`^(?<pack>core|engineering|creative):(?<kind>feature|requirement|task):(?<slug>${SLUG})$`);
var RuntimeError = class extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.name = "RuntimeError";
    this.code = code;
    this.retryable = retryable;
  }
};
function invalid(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function assertExactKeys(value, allowed, label, required = allowed) {
  if (!isPlainObject(value)) invalid(`${label} must be an object`);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) invalid(`${label} contains unknown field "${key}"`);
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) invalid(`${label} is missing "${key}"`);
  }
}
function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    invalid(`${label} must be a non-empty string`);
  }
}
function assertNullableString(value, label) {
  if (value !== null) assertNonEmptyString(value, label);
}
function assertBoolean(value, label) {
  if (typeof value !== "boolean") invalid(`${label} must be a boolean`);
}
function assertTimestamp(value, label) {
  assertNonEmptyString(value, label);
  if (Number.isNaN(Date.parse(value))) invalid(`${label} must be an ISO-compatible timestamp`);
}
function assertUuid(value, label) {
  if (typeof value !== "string" || !UUID.test(value)) invalid(`${label} must be a UUID`);
}
function assertStringArray(value, label, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || nonEmpty && value.length === 0) {
    invalid(`${label} must be ${nonEmpty ? "a non-empty" : "an"} array`);
  }
  for (const entry of value) assertNonEmptyString(entry, `${label} entry`);
  if (new Set(value).size !== value.length) invalid(`${label} must not contain duplicates`);
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
    if (!Number.isFinite(value)) invalid("JSON numbers must be finite");
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    invalid(`unsupported JSON value type "${typeof value}"`);
  }
  if (ancestors.has(value)) invalid("cyclic JSON values are not supported");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) invalid("sparse arrays are not supported");
      }
      return `[${value.map((entry) => encodeCanonical(entry, ancestors)).join(",")}]`;
    }
    if (!isPlainObject(value)) invalid("JSON objects must use a plain object prototype");
    if (Object.getOwnPropertySymbols(value).length > 0) {
      invalid("symbol-keyed JSON fields are not supported");
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
  if (!isPlainObject(subject)) invalid(`${label} must be an object`);
  if (!SUBJECT_KINDS.has(subject.kind)) invalid(`${label}.kind is unsupported`);
  if (subject.kind === "git") {
    assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "base", "head"]), label);
    if (!GIT_OBJECT.test(subject.base) || !GIT_OBJECT.test(subject.head)) {
      invalid(`${label} git base/head must be immutable git object IDs`);
    }
  } else if (subject.kind === "sha256") {
    assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "digest", "path"]), label);
    if (!HEX_DIGEST.test(subject.digest)) invalid(`${label}.digest must be SHA-256`);
    assertNonEmptyString(subject.path, `${label}.path`);
  } else {
    assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "digest", "entries"]), label);
    if (!HEX_DIGEST.test(subject.digest)) invalid(`${label}.digest must be SHA-256`);
    if (!Array.isArray(subject.entries) || subject.entries.length === 0) {
      invalid(`${label}.entries must be a non-empty array`);
    }
    for (const [index, entry] of subject.entries.entries()) {
      assertExactKeys(entry, /* @__PURE__ */ new Set(["path", "digest"]), `${label}.entries[${index}]`);
      assertNonEmptyString(entry.path, `${label}.entries[${index}].path`);
      if (!HEX_DIGEST.test(entry.digest)) {
        invalid(`${label}.entries[${index}].digest must be SHA-256`);
      }
    }
  }
  return subject;
}
function validateNullableSubject(subject, label) {
  if (subject !== null) validateSubjectRef(subject, label);
}
function parseEpicId(value, label) {
  const match = typeof value === "string" ? value.match(EPIC_ID) : null;
  if (!match) invalid(`${label} must match "epic:<slug>"`);
  return match.groups;
}
function parseTypedId(value, expectedKind, label) {
  const match = typeof value === "string" ? value.match(TYPED_ID) : null;
  if (!match || match.groups.kind !== expectedKind) {
    invalid(`${label} must match "<pack>:${expectedKind}:<slug>"`);
  }
  return match.groups;
}
function validateChangesPayload(command, fields, label) {
  assertExactKeys(command.payload, /* @__PURE__ */ new Set(["changes"]), `${label} payload`);
  if (!isPlainObject(command.payload.changes) || Object.keys(command.payload.changes).length === 0) {
    invalid(`${label} payload.changes must be a non-empty object`);
  }
  for (const key of Object.keys(command.payload.changes)) {
    if (!fields.has(key)) invalid(`${label} cannot change "${key}"`);
  }
}
function changedKeys(before, after) {
  const keys = /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => canonicalJson(before[key]) !== canonicalJson(after[key]));
}
function assertChangedOnly(current, nextBody, allowed, label) {
  for (const key of changedKeys(current.body, nextBody)) {
    if (!allowed.has(key)) invalid(`${label} may not change "${key}"`);
  }
}

// src/core/lib/coordination-runtime/hierarchy-contract.mjs
import { createHash as createHash2 } from "node:crypto";

// src/core/lib/coordination-runtime/task-contract.mjs
var ITEM_DELIVERY_CLASSES = /* @__PURE__ */ new Set(["knowledge", "product-change", "operational"]);
var PROVENANCE_KINDS = /* @__PURE__ */ new Set(["live-peer", "durable-thread", "operator"]);
var TASK_BODY_FIELDS = /* @__PURE__ */ new Set([
  "schema_version",
  "id",
  "pack",
  "feature_id",
  "satisfies",
  "title",
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
  "review_requirements",
  "change_ref",
  "updated_at"
]);
var LEGACY_ITEM_BODY_FIELDS = /* @__PURE__ */ new Set([
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
]);
var TASK_UPDATE_FIELDS = /* @__PURE__ */ new Set([
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
  "updated_at"
]);
var TASK_COMMAND_KINDS = /* @__PURE__ */ new Set([
  "task.create",
  "task.update",
  "task.promote",
  "task.grant",
  "task.transition",
  "task.handoff",
  "task.restore"
]);
function validateDependencies(value, label, { entryKey, typedKind = null } = {}) {
  if (!Array.isArray(value)) invalid(`${label} must be an array`);
  const seen = /* @__PURE__ */ new Set();
  for (const [index, dependency] of value.entries()) {
    assertExactKeys(dependency, /* @__PURE__ */ new Set([entryKey, "requires"]), `${label}[${index}]`);
    assertNonEmptyString(dependency[entryKey], `${label}[${index}].${entryKey}`);
    if (typedKind !== null) parseTypedId(dependency[entryKey], typedKind, `${label}[${index}].${entryKey}`);
    if (!TASK_DEPENDENCY_STATES.has(dependency.requires)) {
      invalid(`${label}[${index}].requires is unsupported`);
    }
    if (seen.has(dependency[entryKey])) {
      invalid(`${label} contains duplicate ${entryKey} "${dependency[entryKey]}"`);
    }
    seen.add(dependency[entryKey]);
  }
}
function validateReviewRequirements(value, label) {
  if (!Array.isArray(value)) invalid(`${label} must be an array`);
  const seen = /* @__PURE__ */ new Set();
  for (const [index, requirement] of value.entries()) {
    assertExactKeys(requirement, /* @__PURE__ */ new Set(["role", "kind"]), `${label}[${index}]`);
    assertNonEmptyString(requirement.role, `${label}[${index}].role`);
    assertNonEmptyString(requirement.kind, `${label}[${index}].kind`);
    const key = `${requirement.role}\0${requirement.kind}`;
    if (seen.has(key)) invalid(`${label} contains a duplicate requirement`);
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
    invalid(`${label}.version_at_grant must be a positive safe integer`);
  }
  assertTimestamp(value.acquired_at, `${label}.acquired_at`);
  assertTimestamp(value.expires_at, `${label}.expires_at`);
}
function validateTaskSatisfies(value, label, pack) {
  assertStringArray(value, label, { nonEmpty: true });
  for (const [index, id] of value.entries()) {
    const parsed = parseTypedId(id, "requirement", `${label}[${index}]`);
    if (parsed.pack !== pack) invalid(`${label} must stay within the task pack`);
  }
}
function validateTaskLikeBody(body, label, { legacy = false } = {}) {
  assertExactKeys(body, legacy ? LEGACY_ITEM_BODY_FIELDS : TASK_BODY_FIELDS, label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  for (const key of legacy ? ["id", "title", "initiative", "scope_authority", "completion_authority", "outcome"] : ["id", "title", "pack", "feature_id", "scope_authority", "completion_authority", "outcome"]) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  if (!ITEM_DELIVERY_CLASSES.has(body.delivery_class)) {
    invalid(`${label}.delivery_class is unsupported`);
  }
  if (!TASK_LIFECYCLE.has(body.state)) invalid(`${label}.state is unsupported`);
  if (body.resume_state !== null && (!TASK_LIFECYCLE.has(body.resume_state) || body.resume_state === "blocked")) {
    invalid(`${label}.resume_state is unsupported`);
  }
  if (!legacy) {
    if (!PACKS.has(body.pack)) invalid(`${label}.pack is unsupported`);
    const taskId = parseTypedId(body.id, "task", `${label}.id`);
    if (taskId.pack !== body.pack) invalid(`${label}.pack must match its typed id`);
    const featureId = parseTypedId(body.feature_id, "feature", `${label}.feature_id`);
    if (featureId.pack !== body.pack) {
      invalid(`${label}.feature_id must stay within the task pack`);
    }
    validateTaskSatisfies(body.satisfies, `${label}.satisfies`, body.pack);
  }
  validateNullableActor(body.producer_actor, `${label}.producer_actor`);
  if (!Array.isArray(body.producing_actors)) invalid(`${label}.producing_actors must be an array`);
  body.producing_actors.forEach((entry, index) => validateActor(entry, `${label}.producing_actors[${index}]`));
  if (body.producer_actor && !body.producing_actors.some((entry) => entry.role === body.producer_actor.role && entry.runId === body.producer_actor.runId)) {
    invalid(`${label}.producing_actors must retain the current producer`);
  }
  validateNullableActor(body.acceptance_actor, `${label}.acceptance_actor`);
  if (!Number.isSafeInteger(body.priority) || body.priority < 0) {
    invalid(`${label}.priority must be a non-negative safe integer`);
  }
  assertNullableString(body.next_role, `${label}.next_role`);
  assertStringArray(body.acceptance, `${label}.acceptance`, { nonEmpty: true });
  if (!(/* @__PURE__ */ new Set(["owed", "none"])).has(body.artifact_expectation)) {
    invalid(`${label}.artifact_expectation is unsupported`);
  }
  assertNullableString(body.artifact_expectation_reason, `${label}.artifact_expectation_reason`);
  for (const key of ["artifact_class", "durability", "validity_owner"]) {
    assertNullableString(body[key], `${label}.${key}`);
  }
  if (body.artifact_expectation === "none" && body.artifact_expectation_reason === null) {
    invalid(`${label}.artifact_expectation_reason is required when no artifact is owed`);
  }
  if (body.artifact_expectation === "owed" && [body.artifact_class, body.durability, body.validity_owner].includes(null)) {
    invalid(`${label} requires artifact class, durability, and validity owner`);
  }
  for (const key of ["artifact_targets", "context_artifacts", "touches", "waiting_on_questions"]) {
    assertStringArray(body[key], `${label}.${key}`);
  }
  validateDependencies(body.depends_on, `${label}.depends_on`, legacy ? { entryKey: "item" } : { entryKey: "task", typedKind: "task" });
  validateLease(body.lease, `${label}.lease`);
  if (body.recovery_hold !== null) {
    assertUuid(body.recovery_hold, `${label}.recovery_hold`);
    if (body.state !== "blocked" && body.state !== "dropped") {
      invalid(`${label}.recovery_hold requires blocked or dropped state`);
    }
  }
  if (legacy) {
    assertBoolean(body.required_for_milestone, `${label}.required_for_milestone`);
  }
  validateReviewRequirements(body.review_requirements, `${label}.review_requirements`);
  validateNullableSubject(body.change_ref, `${label}.change_ref`);
  assertTimestamp(body.updated_at, `${label}.updated_at`);
  if (body.acceptance_actor && body.producing_actors.some((entry) => entry.runId === body.acceptance_actor.runId)) {
    invalid(`${label} cannot name its producing run as acceptance actor`);
  }
  if (body.producer_actor && body.producer_actor.role === body.completion_authority && body.review_requirements.some((requirement) => requirement.kind === "product-design-acceptance")) {
    invalid(`${label} producing designer cannot be its completion authority`);
  }
  if (body.state === "blocked") {
    if (body.resume_state === null) invalid(`${label}.resume_state is required while blocked`);
  } else if (body.resume_state !== null) {
    invalid(`${label}.resume_state is only valid while blocked`);
  }
  if (body.lease !== null && body.lease.version_at_grant >= Number.MAX_SAFE_INTEGER) {
    invalid(`${label}.lease.version_at_grant is invalid`);
  }
  return body;
}
function validateTaskBody(body, label = "task") {
  return validateTaskLikeBody(body, label, { legacy: false });
}
function validateLegacyItemBody(body, label = "item") {
  return validateTaskLikeBody(body, label, { legacy: true });
}
function validateCreate(command, expectedKind, bodyValidator2) {
  if (command.recordKind !== expectedKind) {
    invalid(`${command.kind} requires recordKind "${expectedKind}"`);
  }
  if (command.expectedVersion !== 0) invalid(`${command.kind} requires version 0`);
  if (command.leaseToken !== null) invalid(`${command.kind} cannot carry a lease token`);
  assertExactKeys(command.payload, /* @__PURE__ */ new Set(["body"]), `${command.kind} payload`);
  bodyValidator2(command.payload.body, `${command.kind} payload.body`);
  if (command.payload.body.id !== command.recordId) {
    invalid(`${command.kind} body id must match command.recordId`);
  }
}
function validateTaskLikeUpdate(command, { commandKind, recordKind, fields }) {
  if (command.recordKind !== recordKind) {
    invalid(`${commandKind} requires recordKind "${recordKind}"`);
  }
  if (command.expectedVersion < 1) {
    invalid(`${commandKind} requires an existing record version`);
  }
  if (Object.keys(command.payload).length === 1 && Object.hasOwn(command.payload, "title")) {
    assertNonEmptyString(command.payload.title, `${commandKind} payload.title`);
    return;
  }
  validateChangesPayload(command, fields, commandKind);
}
function validateAtPayload(command, kind, recordKind, keys) {
  if (command.recordKind !== recordKind) invalid(`${kind} requires recordKind "${recordKind}"`);
  if (command.expectedVersion < 1) invalid(`${kind} requires an existing record version`);
  assertExactKeys(command.payload, new Set(keys), `${kind} payload`);
}
function validateTaskLikePromote(command, { kind, recordKind }) {
  validateAtPayload(command, kind, recordKind, ["at"]);
  assertTimestamp(command.payload.at, `${kind} payload.at`);
}
function validateTaskLikeGrant(command, { kind, recordKind, actions }) {
  validateAtPayload(command, kind, recordKind, ["holder", "actions", "acquiredAt", "expiresAt"]);
  validateActor(command.payload.holder, `${kind} payload.holder`);
  assertStringArray(command.payload.actions, `${kind} payload.actions`, { nonEmpty: true });
  for (const action of command.payload.actions) {
    if (!actions.has(action)) {
      invalid(`${kind} payload.actions contains unsupported action "${action}"`);
    }
  }
  assertTimestamp(command.payload.acquiredAt, `${kind} payload.acquiredAt`);
  assertTimestamp(command.payload.expiresAt, `${kind} payload.expiresAt`);
  if (Date.parse(command.payload.expiresAt) <= Date.parse(command.payload.acquiredAt)) {
    invalid(`${kind} payload.expiresAt must be after acquiredAt`);
  }
}
function validateTaskLikeTransition(command, { kind, recordKind }) {
  if (command.recordKind !== recordKind) invalid(`${kind} requires recordKind "${recordKind}"`);
  if (command.expectedVersion < 1) invalid(`${kind} requires an existing record version`);
  assertExactKeys(
    command.payload,
    /* @__PURE__ */ new Set(["to", "at", "reason", "subject"]),
    `${kind} payload`,
    /* @__PURE__ */ new Set(["to", "at", "reason"])
  );
  if (!TASK_LIFECYCLE.has(command.payload.to)) invalid(`${kind} payload.to is unsupported`);
  assertTimestamp(command.payload.at, `${kind} payload.at`);
  assertNonEmptyString(command.payload.reason, `${kind} payload.reason`);
  if (Object.hasOwn(command.payload, "subject")) {
    validateNullableSubject(command.payload.subject, `${kind} payload.subject`);
  }
  if (command.payload.to === "in-review" && (!Object.hasOwn(command.payload, "subject") || command.payload.subject === null)) {
    invalid(`${kind} to in-review requires a subject`);
  }
}
function validateHandoffContent(content, label) {
  assertExactKeys(content, /* @__PURE__ */ new Set([
    "did",
    "needs",
    "assetState",
    "authority",
    "revalidation",
    "questions"
  ]), label);
  for (const key of ["did", "needs", "assetState", "authority", "revalidation"]) {
    assertNonEmptyString(content[key], `${label}.${key}`);
  }
  assertStringArray(content.questions, `${label}.questions`);
}
function validateTaskLikeHandoff(command, { kind, recordKind }) {
  if (command.recordKind !== recordKind) invalid(`${kind} requires recordKind "${recordKind}"`);
  if (command.expectedVersion < 1) invalid(`${kind} requires an existing record version`);
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
    `${kind} payload`,
    required
  );
  assertNonEmptyString(command.payload.toRole, `${kind} payload.toRole`);
  if (command.payload.state !== null && !TASK_LIFECYCLE.has(command.payload.state)) {
    invalid(`${kind} payload.state is unsupported`);
  }
  if (Object.hasOwn(command.payload, "subject")) {
    validateNullableSubject(command.payload.subject, `${kind} payload.subject`);
  }
  if (command.payload.state === "in-review" && (!Object.hasOwn(command.payload, "subject") || command.payload.subject === null)) {
    invalid(`${kind} to in-review requires a subject`);
  }
  assertTimestamp(command.payload.createdAt, `${kind} payload.createdAt`);
  assertUuid(command.payload.messageId, `${kind} payload.messageId`);
  if (command.payload.parentId !== null) {
    assertUuid(command.payload.parentId, `${kind} payload.parentId`);
  }
  validateHandoffContent(command.payload.content, `${kind} payload.content`);
  assertStringArray(command.payload.artifactRefs, `${kind} payload.artifactRefs`);
  assertStringArray(command.payload.evidenceRefs, `${kind} payload.evidenceRefs`);
  if (!PROVENANCE_KINDS.has(command.payload.provenance)) {
    invalid(`${kind} payload.provenance is unsupported`);
  }
}
function validateTaskLikeRestore(command, { kind, recordKind }) {
  if (command.recordKind !== recordKind || command.expectedVersion < 1) {
    invalid(`${kind} requires an existing ${recordKind}`);
  }
  assertExactKeys(
    command.payload,
    /* @__PURE__ */ new Set(["at", "recoveryApprovalId"]),
    `${kind} payload`,
    /* @__PURE__ */ new Set(["at"])
  );
  assertTimestamp(command.payload.at, `${kind} payload.at`);
  if (Object.hasOwn(command.payload, "recoveryApprovalId")) {
    assertUuid(command.payload.recoveryApprovalId, `${kind} payload.recoveryApprovalId`);
  }
}
var taskCommandValidators = /* @__PURE__ */ new Map([
  ["task.create", (command) => validateCreate(command, "task", validateTaskBody)],
  ["task.update", (command) => validateTaskLikeUpdate(command, {
    commandKind: "task.update",
    recordKind: "task",
    fields: TASK_UPDATE_FIELDS
  })],
  ["task.promote", (command) => validateTaskLikePromote(command, {
    kind: "task.promote",
    recordKind: "task"
  })],
  ["task.grant", (command) => validateTaskLikeGrant(command, {
    kind: "task.grant",
    recordKind: "task",
    actions: /* @__PURE__ */ new Set([
      "task.update",
      "task.transition",
      "task.handoff",
      "question.open",
      "artifact.register",
      "asset.transition",
      "evidence.register",
      "review.record",
      "approval.record"
    ])
  })],
  ["task.transition", (command) => validateTaskLikeTransition(command, {
    kind: "task.transition",
    recordKind: "task"
  })],
  ["task.handoff", (command) => validateTaskLikeHandoff(command, {
    kind: "task.handoff",
    recordKind: "task"
  })],
  ["task.restore", (command) => validateTaskLikeRestore(command, {
    kind: "task.restore",
    recordKind: "task"
  })]
]);
function validateTaskCommand(command) {
  if (!TASK_COMMAND_KINDS.has(command.kind)) {
    invalid(`unsupported command kind "${command.kind}"`);
  }
  taskCommandValidators.get(command.kind)(command);
  return command;
}
function validateTaskLikeCommandMutation(command, current, nextBody, {
  updateCommand,
  updateFailure,
  allowedByKind
} = {}) {
  if (!isPlainObject(nextBody)) invalid(`${command.kind} must produce an object body`);
  if (command.kind.endsWith(".create")) {
    if (current) invalid(`${command.kind} requires a missing record`);
    if (canonicalJson(nextBody) !== canonicalJson(command.payload.body)) {
      invalid(`${command.kind} must create the supplied body exactly`);
    }
    return nextBody;
  }
  if (!current) invalid(`${command.kind} requires an existing record`);
  if (command.kind === updateCommand) {
    const changes = Object.hasOwn(command.payload, "changes") ? command.payload.changes : { title: command.payload.title };
    const expected = { ...current.body, ...changes };
    if (canonicalJson(nextBody) !== canonicalJson(expected)) invalid(updateFailure);
    return nextBody;
  }
  assertChangedOnly(current, nextBody, allowedByKind.get(command.kind), command.kind);
  return nextBody;
}
function validateTaskCommandMutation(command, current, nextBody) {
  return validateTaskLikeCommandMutation(command, current, nextBody, {
    updateCommand: "task.update",
    updateFailure: "task.update may only apply the descriptive changes in its payload",
    allowedByKind: /* @__PURE__ */ new Map([
      ["task.promote", /* @__PURE__ */ new Set(["state", "updated_at"])],
      ["task.grant", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "producer_actor",
        "producing_actors",
        "next_role",
        "lease",
        "updated_at"
      ])],
      ["task.transition", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "acceptance_actor",
        "next_role",
        "lease",
        "change_ref",
        "updated_at"
      ])],
      ["task.handoff", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "acceptance_actor",
        "next_role",
        "lease",
        "change_ref",
        "updated_at"
      ])],
      ["task.restore", /* @__PURE__ */ new Set(["state", "resume_state", "next_role", "recovery_hold", "updated_at"])]
    ])
  });
}

// src/core/lib/coordination-runtime/hierarchy-contract.mjs
var COMMON_PARENT_FIELDS = [
  "schema_version",
  "id",
  "title",
  "state",
  "completion_disposition",
  "owner",
  "scope_authority",
  "completion_authority",
  "priority",
  "outcome",
  "acceptance",
  "hold",
  "created_at",
  "updated_at"
];
var FEATURE_DEPENDENCY_REQUIRES = /* @__PURE__ */ new Set(["delivered"]);
var COMPOSITION_EDGES = Object.freeze({
  epic: {
    childKind: "feature",
    lists: ["required_features", "optional_features"],
    parentField: "epic_id",
    singleParent: true
  },
  feature: {
    childKind: "requirement",
    lists: ["required_requirements", "optional_requirements"],
    parentField: "feature_id",
    singleParent: true
  },
  requirement: {
    childKind: "task",
    lists: ["required_tasks", "optional_tasks"],
    parentField: null,
    singleParent: false
  }
});
var HIERARCHY_KINDS = /* @__PURE__ */ new Set(["epic", "feature", "requirement", "task"]);
var PARENT_STATES = /* @__PURE__ */ new Set(["proposed", "active", "completed"]);
var PARENT_DISPOSITIONS = Object.freeze({
  epic: /* @__PURE__ */ new Set(["achieved", "cancelled", "superseded"]),
  feature: /* @__PURE__ */ new Set(["delivered", "cancelled", "superseded"]),
  requirement: /* @__PURE__ */ new Set(["satisfied", "cancelled", "superseded"])
});
var PARENT_COMMAND_KINDS = /* @__PURE__ */ new Set([
  "epic.create",
  "epic.update",
  "epic.activate",
  "epic.hold",
  "epic.release",
  "epic.complete",
  "feature.create",
  "feature.update",
  "feature.activate",
  "feature.hold",
  "feature.release",
  "feature.complete",
  "requirement.create",
  "requirement.update",
  "requirement.activate",
  "requirement.hold",
  "requirement.release",
  "requirement.complete"
]);
var PARENT_UPDATE_FIELDS = /* @__PURE__ */ new Map([
  ["epic", /* @__PURE__ */ new Set([
    "title",
    "owner",
    "scope_authority",
    "completion_authority",
    "priority",
    "outcome",
    "acceptance",
    "direction_ref",
    "contribution",
    "scope_fit",
    "required_features",
    "optional_features"
  ])],
  ["feature", /* @__PURE__ */ new Set([
    "title",
    "owner",
    "scope_authority",
    "completion_authority",
    "priority",
    "outcome",
    "acceptance",
    "required_requirements",
    "optional_requirements",
    "depends_on_features"
  ])],
  ["requirement", /* @__PURE__ */ new Set([
    "title",
    "owner",
    "scope_authority",
    "completion_authority",
    "priority",
    "outcome",
    "acceptance",
    "required_tasks",
    "optional_tasks"
  ])]
]);
function validateDirectionRef(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set(["path", "hash", "goal"]), label);
  assertNonEmptyString(value.path, `${label}.path`);
  if (!HEX_DIGEST.test(value.hash)) invalid(`${label}.hash must be SHA-256`);
  assertNonEmptyString(value.goal, `${label}.goal`);
}
function validateHold(value, label) {
  if (value === null) return;
  assertExactKeys(value, /* @__PURE__ */ new Set([
    "reason",
    "set_by",
    "set_at",
    "release_condition",
    "basis_refs"
  ]), label);
  assertNonEmptyString(value.reason, `${label}.reason`);
  validateActor(value.set_by, `${label}.set_by`);
  assertTimestamp(value.set_at, `${label}.set_at`);
  assertNonEmptyString(value.release_condition, `${label}.release_condition`);
  assertStringArray(value.basis_refs, `${label}.basis_refs`);
}
function validatePackScopedIds(value, label, kind, pack = null) {
  assertStringArray(value, label);
  for (const [index, id] of value.entries()) {
    const parsed = parseTypedId(id, kind, `${label}[${index}]`);
    if (pack !== null && parsed.pack !== pack) invalid(`${label} must stay within the ${pack} pack`);
  }
}
function assertDisjointLists(required, optional, label) {
  const overlap = required.find((id) => optional.includes(id));
  if (overlap) invalid(`${label} required and optional child lists must not overlap`);
}
function validateFeatureDependencies(value, label) {
  if (!Array.isArray(value)) invalid(`${label} must be an array`);
  const seen = /* @__PURE__ */ new Set();
  for (const [index, dependency] of value.entries()) {
    assertExactKeys(dependency, /* @__PURE__ */ new Set(["feature", "requires"]), `${label}[${index}]`);
    parseTypedId(dependency.feature, "feature", `${label}[${index}].feature`);
    if (!FEATURE_DEPENDENCY_REQUIRES.has(dependency.requires)) {
      invalid(`${label}[${index}].requires is unsupported`);
    }
    if (seen.has(dependency.feature)) {
      invalid(`${label} contains duplicate feature "${dependency.feature}"`);
    }
    seen.add(dependency.feature);
  }
}
function validateCommonParentBody(body, label, kind, extraFields) {
  assertExactKeys(body, /* @__PURE__ */ new Set([...COMMON_PARENT_FIELDS, ...extraFields]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  for (const key of ["id", "title", "owner", "scope_authority", "completion_authority", "outcome"]) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  if (kind === "epic") {
    parseEpicId(body.id, `${label}.id`);
  } else {
    assertNonEmptyString(body.pack, `${label}.pack`);
    const parsed = parseTypedId(body.id, kind, `${label}.id`);
    if (parsed.pack !== body.pack) invalid(`${label}.pack must match its typed id`);
  }
  if (!PARENT_STATES.has(body.state)) invalid(`${label}.state is unsupported`);
  if (body.state === "completed") {
    if (body.completion_disposition === null) {
      invalid(`${label}.completed parents require a completion_disposition`);
    }
    if (!PARENT_DISPOSITIONS[kind].has(body.completion_disposition)) {
      invalid(`${label}.completion_disposition is unsupported for ${kind}`);
    }
  } else if (body.completion_disposition !== null) {
    invalid(`${label}.completion_disposition must be null until the parent is completed`);
  }
  if (!Number.isSafeInteger(body.priority) || body.priority < 0) {
    invalid(`${label}.priority must be a non-negative safe integer`);
  }
  assertStringArray(body.acceptance, `${label}.acceptance`, { nonEmpty: true });
  validateHold(body.hold, `${label}.hold`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  assertTimestamp(body.updated_at, `${label}.updated_at`);
}
function validateEpicBody(body, label) {
  validateCommonParentBody(body, label, "epic", [
    "direction_ref",
    "contribution",
    "scope_fit",
    "required_features",
    "optional_features"
  ]);
  validateDirectionRef(body.direction_ref, `${label}.direction_ref`);
  assertNonEmptyString(body.contribution, `${label}.contribution`);
  assertNonEmptyString(body.scope_fit, `${label}.scope_fit`);
  validatePackScopedIds(body.required_features, `${label}.required_features`, "feature");
  validatePackScopedIds(body.optional_features, `${label}.optional_features`, "feature");
  assertDisjointLists(body.required_features, body.optional_features, `${label}.required_features`);
}
function validateFeatureBody(body, label) {
  validateCommonParentBody(body, label, "feature", [
    "pack",
    "epic_id",
    "required_requirements",
    "optional_requirements",
    "depends_on_features"
  ]);
  parseEpicId(body.epic_id, `${label}.epic_id`);
  validatePackScopedIds(body.required_requirements, `${label}.required_requirements`, "requirement", body.pack);
  validatePackScopedIds(body.optional_requirements, `${label}.optional_requirements`, "requirement", body.pack);
  assertDisjointLists(body.required_requirements, body.optional_requirements, `${label}.required_requirements`);
  validateFeatureDependencies(body.depends_on_features, `${label}.depends_on_features`);
}
function validateRequirementBody(body, label) {
  validateCommonParentBody(body, label, "requirement", [
    "pack",
    "feature_id",
    "required_tasks",
    "optional_tasks"
  ]);
  const feature = parseTypedId(body.feature_id, "feature", `${label}.feature_id`);
  if (feature.pack !== body.pack) invalid(`${label}.feature_id must stay within the ${body.pack} pack`);
  validatePackScopedIds(body.required_tasks, `${label}.required_tasks`, "task", body.pack);
  validatePackScopedIds(body.optional_tasks, `${label}.optional_tasks`, "task", body.pack);
  assertDisjointLists(body.required_tasks, body.optional_tasks, `${label}.required_tasks`);
}
function resolveLookup(lookup, kind, id) {
  if (!lookup) return null;
  if (typeof lookup === "function") return lookup(kind, id) ?? null;
  if (lookup instanceof Map) {
    if (lookup.has(kind) && lookup.get(kind) instanceof Map) {
      return lookup.get(kind).get(id) ?? null;
    }
    const keyed = lookup.get(`${kind}\0${id}`);
    if (keyed) return keyed;
    const byId = lookup.get(id);
    if (byId?.kind === kind) return byId;
    return null;
  }
  if (isPlainObject(lookup)) {
    if (lookup[kind] && isPlainObject(lookup[kind])) return lookup[kind][id] ?? null;
    const keyed = lookup[`${kind}\0${id}`];
    if (keyed) return keyed;
    const byId = lookup[id];
    if (byId?.kind === kind) return byId;
  }
  return null;
}
function bodyValidator(kind) {
  if (kind === "epic") return validateEpicBody;
  if (kind === "feature") return validateFeatureBody;
  if (kind === "requirement") return validateRequirementBody;
  return validateTaskBody;
}
function contains(listA, listB, id) {
  return listA.includes(id) || listB.includes(id);
}
function validateHierarchyRecord(record, lookup = null) {
  if (!isPlainObject(record)) invalid("record must be an object");
  assertExactKeys(record, /* @__PURE__ */ new Set(["kind", "id", "subject", "version", "body"]), "record");
  if (!HIERARCHY_KINDS.has(record.kind)) {
    invalid(`unsupported hierarchy record kind "${record.kind}"`);
  }
  assertNonEmptyString(record.id, "record.id");
  if (record.subject !== null) {
    invalid(`${record.kind} record envelope must have null subject`);
  }
  if (!Number.isSafeInteger(record.version) || record.version < 1) {
    invalid("record.version must be a positive safe integer");
  }
  bodyValidator(record.kind)(record.body, `record ${record.kind}/${record.id} body`);
  if (record.id !== record.body.id) invalid(`${record.kind} record envelope must match body.id`);
  const resolve = (kind, id) => resolveLookup(lookup, kind, id);
  if (record.kind === "feature" && lookup) {
    const epic = resolve("epic", record.body.epic_id);
    if (!epic) invalid(`feature/${record.id} must reference an existing epic`);
    if (!contains(epic.body.required_features, epic.body.optional_features, record.id)) {
      invalid(`feature/${record.id} must appear in epic/${epic.id}`);
    }
  }
  if (record.kind === "requirement" && lookup) {
    const feature = resolve("feature", record.body.feature_id);
    if (!feature || feature.body.pack !== record.body.pack) {
      invalid(`requirement/${record.id} must reference an existing same-pack feature`);
    }
    if (!contains(feature.body.required_requirements, feature.body.optional_requirements, record.id)) {
      invalid(`requirement/${record.id} must appear in feature/${feature.id}`);
    }
  }
  if (record.kind === "task" && lookup) {
    const feature = resolve("feature", record.body.feature_id);
    if (!feature || feature.body.pack !== record.body.pack) {
      invalid(`task/${record.id} must reference an existing same-pack feature`);
    }
    for (const requirementId of record.body.satisfies) {
      const requirement = resolve("requirement", requirementId);
      if (!requirement) invalid(`task/${record.id} must reference existing requirements in satisfies`);
      if (requirement.body.feature_id !== record.body.feature_id) {
        invalid(`task/${record.id} must satisfy only requirements that belong to its feature`);
      }
      if (!contains(requirement.body.required_tasks, requirement.body.optional_tasks, record.id)) {
        invalid("requirement-task edges must agree bidirectionally");
      }
    }
  }
  return record;
}
function hierarchyLookup(records) {
  const index = /* @__PURE__ */ new Map();
  for (const record of records) {
    const key = `${record.kind}\0${record.id}`;
    if (index.has(key)) invalid(`duplicate hierarchy record ${record.kind}/${record.id}`);
    index.set(key, record);
  }
  return index;
}
function readHierarchy(index, kind, id) {
  return index.get(`${kind}\0${id}`) ?? null;
}
function nodeKey(kind, id) {
  return `${kind}\0${id}`;
}
function describeNode(node) {
  return node.replace("\0", "/");
}
function detectDirectedCycle(adjacency, label) {
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  function walk(node) {
    if (visited.has(node)) return;
    if (visiting.has(node)) invalid(`${label} detected at ${describeNode(node)}`);
    visiting.add(node);
    for (const next of adjacency.get(node) ?? []) {
      if (adjacency.has(next)) walk(next);
    }
    visiting.delete(node);
    visited.add(node);
  }
  for (const node of adjacency.keys()) walk(node);
}
function dependencyAdjacency(records, getTargets) {
  return new Map(records.map((record) => [
    nodeKey(record.kind, record.id),
    new Set(getTargets(record).map((id) => nodeKey(record.kind, id)))
  ]));
}
function compositionChildren(record) {
  const edge = COMPOSITION_EDGES[record.kind];
  if (!edge) return [];
  return edge.lists.flatMap((list) => record.body[list]);
}
function validateSingleCompositionParent(entries) {
  const claims = /* @__PURE__ */ new Map();
  for (const record of entries) {
    const edge = COMPOSITION_EDGES[record.kind];
    if (!edge?.singleParent) continue;
    const parentNode = nodeKey(record.kind, record.id);
    for (const childId of compositionChildren(record)) {
      const childNode = nodeKey(edge.childKind, childId);
      const claimed = claims.get(childNode);
      if (claimed !== void 0 && claimed !== parentNode) {
        invalid(`${edge.childKind}/${childId} must belong to exactly one ${record.kind}`);
      }
      claims.set(childNode, parentNode);
    }
  }
}
function validateCompositionStructure(entries, resolve) {
  validateSingleCompositionParent(entries);
  const adjacency = new Map(entries.map((record) => [nodeKey(record.kind, record.id), /* @__PURE__ */ new Set()]));
  for (const record of entries) {
    const edge = COMPOSITION_EDGES[record.kind];
    if (!edge) continue;
    const children = adjacency.get(nodeKey(record.kind, record.id));
    for (const childId of compositionChildren(record)) {
      const child = resolve(edge.childKind, childId);
      if (edge.parentField === null) {
        if (!child) {
          invalid(`${record.kind}/${record.id} references a missing ${edge.childKind} ${childId}`);
        }
        if (child.body.feature_id !== record.body.feature_id) {
          invalid(`${edge.childKind}/${childId} must share ${record.kind}/${record.id} feature ${record.body.feature_id}`);
        }
        if (!child.body.satisfies.includes(record.id)) {
          invalid("requirement-task edges must agree bidirectionally");
        }
      } else if (!child || child.body[edge.parentField] !== record.id) {
        invalid(`${record.kind}/${record.id} references a missing or mismatched ${edge.childKind} ${childId}`);
      }
      children.add(nodeKey(edge.childKind, childId));
    }
  }
  detectDirectedCycle(adjacency, "composition cycle");
}
function validateHierarchyRelationships(records) {
  const entries = [...records];
  const index = hierarchyLookup(entries);
  const resolve = (kind, id) => readHierarchy(index, kind, id);
  entries.forEach((record) => validateHierarchyRecord(record, resolve));
  validateCompositionStructure(entries, resolve);
  for (const feature of entries.filter((record) => record.kind === "feature")) {
    for (const dependency of feature.body.depends_on_features) {
      if (!resolve("feature", dependency.feature)) {
        invalid(`feature/${feature.id} references a missing dependency ${dependency.feature}`);
      }
    }
  }
  for (const task of entries.filter((record) => record.kind === "task")) {
    const feature = resolve("feature", task.body.feature_id);
    for (const dependency of task.body.depends_on) {
      const upstream = resolve("task", dependency.task);
      if (!upstream) invalid(`task/${task.id} references a missing dependency ${dependency.task}`);
      const upstreamFeature = resolve("feature", upstream.body.feature_id);
      if (feature && upstreamFeature && upstreamFeature.body.epic_id !== feature.body.epic_id) {
        invalid(`task/${task.id} dependencies must stay within one epic`);
      }
    }
  }
  detectDirectedCycle(
    dependencyAdjacency(
      entries.filter((record) => record.kind === "feature"),
      (feature) => feature.body.depends_on_features.map((dependency) => dependency.feature)
    ),
    "feature dependency cycle"
  );
  detectDirectedCycle(
    dependencyAdjacency(
      entries.filter((record) => record.kind === "task"),
      (task) => task.body.depends_on.map((dependency) => dependency.task)
    ),
    "task dependency cycle"
  );
  return entries;
}
function validateParentCreate(command, parentKind) {
  if (command.recordKind !== parentKind) {
    invalid(`${command.kind} requires recordKind "${parentKind}"`);
  }
  if (command.expectedVersion !== 0) invalid(`${command.kind} requires version 0`);
  if (command.leaseToken !== null) invalid(`${command.kind} cannot carry a lease token`);
  assertExactKeys(command.payload, /* @__PURE__ */ new Set(["body"]), `${command.kind} payload`);
  bodyValidator(parentKind)(command.payload.body, `${command.kind} payload.body`);
  if (command.payload.body.id !== command.recordId) {
    invalid(`${command.kind} body id must match command.recordId`);
  }
}
function validateExistingParentCommand(command, parentKind) {
  if (command.recordKind !== parentKind) invalid(`${command.kind} requires recordKind "${parentKind}"`);
  if (command.expectedVersion < 1) invalid(`${command.kind} requires an existing record version`);
  if (command.leaseToken !== null) invalid(`${command.kind} cannot carry a lease token`);
}
function validateParentUpdate(command, parentKind) {
  validateExistingParentCommand(command, parentKind);
  assertExactKeys(command.payload, /* @__PURE__ */ new Set(["at", "changes"]), `${command.kind} payload`);
  assertTimestamp(command.payload.at, `${command.kind} payload.at`);
  validateChangesPayload(
    { ...command, payload: { changes: command.payload.changes } },
    PARENT_UPDATE_FIELDS.get(parentKind),
    command.kind
  );
}
function validateAtPayload2(command, parentKind, fields, required = fields) {
  validateExistingParentCommand(command, parentKind);
  assertExactKeys(command.payload, new Set(fields), `${command.kind} payload`, new Set(required));
}
function validateParentActivate(command, parentKind) {
  validateAtPayload2(command, parentKind, ["at"]);
  assertTimestamp(command.payload.at, `${command.kind} payload.at`);
}
function validateParentHold(command, parentKind) {
  validateAtPayload2(command, parentKind, ["at", "reason", "releaseCondition", "basisRefs"]);
  assertTimestamp(command.payload.at, `${command.kind} payload.at`);
  assertNonEmptyString(command.payload.reason, `${command.kind} payload.reason`);
  assertNonEmptyString(command.payload.releaseCondition, `${command.kind} payload.releaseCondition`);
  assertStringArray(command.payload.basisRefs, `${command.kind} payload.basisRefs`);
}
function validateParentRelease(command, parentKind) {
  validateAtPayload2(command, parentKind, ["at", "reason", "conditionMet", "basisRefs"]);
  assertTimestamp(command.payload.at, `${command.kind} payload.at`);
  assertNonEmptyString(command.payload.reason, `${command.kind} payload.reason`);
  assertBoolean(command.payload.conditionMet, `${command.kind} payload.conditionMet`);
  assertStringArray(command.payload.basisRefs, `${command.kind} payload.basisRefs`);
}
function validateParentComplete(command, parentKind) {
  validateAtPayload2(
    command,
    parentKind,
    ["at", "disposition", "reason", "closureRef", "basisRefs"],
    ["at", "disposition", "reason", "basisRefs"]
  );
  assertTimestamp(command.payload.at, `${command.kind} payload.at`);
  assertNullableString(command.payload.closureRef ?? null, `${command.kind} payload.closureRef`);
  if (command.payload.closureRef !== void 0 && !HEX_DIGEST.test(command.payload.closureRef)) {
    invalid(`${command.kind} payload.closureRef must be SHA-256`);
  }
  assertNonEmptyString(command.payload.reason, `${command.kind} payload.reason`);
  if (!PARENT_DISPOSITIONS[parentKind].has(command.payload.disposition)) {
    invalid(`${command.kind} payload.disposition is unsupported`);
  }
  assertStringArray(command.payload.basisRefs, `${command.kind} payload.basisRefs`);
  const successDisposition = (/* @__PURE__ */ new Map([
    ["epic", "achieved"],
    ["feature", "delivered"],
    ["requirement", "satisfied"]
  ])).get(parentKind);
  if (command.payload.disposition === successDisposition && !Object.hasOwn(command.payload, "closureRef")) {
    invalid(`${command.kind} payload.closureRef is required for successful completion`);
  }
}
function validateParentCommand(command) {
  if (!PARENT_COMMAND_KINDS.has(command.kind)) {
    invalid(`unsupported command kind "${command.kind}"`);
  }
  const [parentKind, action] = command.kind.split(".");
  if (action === "create") validateParentCreate(command, parentKind);
  else if (action === "update") validateParentUpdate(command, parentKind);
  else if (action === "activate") validateParentActivate(command, parentKind);
  else if (action === "hold") validateParentHold(command, parentKind);
  else if (action === "release") validateParentRelease(command, parentKind);
  else validateParentComplete(command, parentKind);
  return command;
}
function validateParentCommandMutation(command, current, nextBody) {
  if (!isPlainObject(nextBody)) invalid(`${command.kind} must produce an object body`);
  if (command.kind.endsWith(".create")) {
    if (current) invalid(`${command.kind} requires a missing record`);
    if (canonicalJson(nextBody) !== canonicalJson(command.payload.body)) {
      invalid(`${command.kind} must create the supplied body exactly`);
    }
    return nextBody;
  }
  if (!current) invalid(`${command.kind} requires an existing record`);
  const [, action] = command.kind.split(".");
  if (action === "update") {
    const expected = {
      ...current.body,
      ...command.payload.changes,
      updated_at: command.payload.at
    };
    if (canonicalJson(nextBody) !== canonicalJson(expected)) {
      invalid(`${command.kind} may only apply the changes in its payload`);
    }
    return nextBody;
  }
  const allowedByAction = /* @__PURE__ */ new Map([
    ["activate", /* @__PURE__ */ new Set(["state", "updated_at"])],
    ["hold", /* @__PURE__ */ new Set(["hold", "updated_at"])],
    ["release", /* @__PURE__ */ new Set(["hold", "updated_at"])],
    ["complete", /* @__PURE__ */ new Set(["state", "completion_disposition", "updated_at"])]
  ]);
  assertChangedOnly(current, nextBody, allowedByAction.get(action), command.kind);
  return nextBody;
}
function closureIdentity(record, label) {
  if (!isPlainObject(record)) invalid(`${label} must be an object`);
  if (!HIERARCHY_KINDS.has(record.kind)) invalid(`${label}.kind is unsupported`);
  assertNonEmptyString(record.id, `${label}.id`);
  if (!Number.isSafeInteger(record.version) || record.version < 1) {
    invalid(`${label}.version must be a positive safe integer`);
  }
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    disposition: record.body?.completion_disposition ?? record.completion_disposition ?? null
  };
}
function parentClosureRef(parent, requiredChildren) {
  const parentIdentity = closureIdentity(parent, "parent");
  if (!Array.isArray(requiredChildren)) invalid("requiredChildren must be an array");
  const children = requiredChildren.map((record, index) => closureIdentity(record, `requiredChildren[${index}]`)).sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
  return createHash2("sha256").update(canonicalJson({
    parent: {
      kind: parentIdentity.kind,
      id: parentIdentity.id,
      version: parentIdentity.version
    },
    requiredChildren: children.map((child) => ({
      kind: child.kind,
      id: child.id,
      version: child.version,
      disposition: child.disposition
    }))
  })).digest("hex");
}

// src/core/lib/coordination-runtime/contract.mjs
import { createHash as createHash3 } from "node:crypto";

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
var UUID2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var fail = (code, message) => {
  throw new RuntimeError(code, message);
};
var invalid2 = (message) => fail("INVALID_INPUT", message);
var clone = (value) => JSON.parse(canonicalJson(value));
var exact = (value, keys, label) => assertExactKeys(value, new Set(keys), label);
function text(value, label, max = 512) {
  assertNonEmptyString(value, label);
  if (Buffer.byteLength(value, "utf8") > max) invalid2(`${label} exceeds ${max} bytes`);
}
var nullableText = (value, label) => {
  if (value !== null) text(value, label);
};
var uuid = (value, label) => {
  if (!UUID2.test(value ?? "")) invalid2(`${label} must be a UUID`);
};
var boolean = (value, label) => {
  if (typeof value !== "boolean") invalid2(`${label} must be boolean`);
};
var member = (value, choices, label) => {
  if (!choices.includes(value)) invalid2(`${label} is unsupported`);
};
var positive = (value, label) => {
  if (!Number.isSafeInteger(value) || value < 1) invalid2(`${label} must be a positive safe integer`);
};
var measurement = (value, label, integer = false) => {
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || integer && !Number.isSafeInteger(value))) invalid2(`${label} is not a valid measurement`);
};
function validateCapabilities(value) {
  exact(value, ["peerDispatch", "resume", "modelOverride", "usage", "models", "efforts"], "capabilities");
  for (const key of ["peerDispatch", "resume", "modelOverride", "usage"]) boolean(value[key], key);
  for (const key of ["models", "efforts"]) {
    if (!Array.isArray(value[key]) || new Set(value[key]).size !== value[key].length) invalid2(`${key} must be unique`);
    value[key].forEach((entry) => text(entry, key));
  }
}
function approvedProfileModel(role, profile) {
  const model = Object.hasOwn(ROLE_PROFILE_MODELS, profile ?? "") ? ROLE_PROFILE_MODELS[profile] : null;
  if (!model) invalid2("role has no approved primary profile");
  const errors = agentProfileModelErrors({ id: role, body: `**Primary profile:** ${profile}`, fm: { model } });
  if (errors.length) invalid2(errors.join("; "));
  return model;
}
function validateHostCommand(command) {
  const p = command.payload;
  const attempt = command.kind.startsWith("attempt.");
  if (command.recordKind !== (attempt ? "host-attempt" : "effect")) invalid2("host command recordKind mismatch");
  uuid(command.recordId, "host recordId");
  if (command.kind.endsWith(".result")) {
    exact(p, attempt ? ["observationId"] : ["attemptId", "observationId"], "result payload");
    uuid(p.observationId, "observationId");
    if (!attempt) uuid(p.attemptId, "attemptId");
    positive(command.expectedVersion, "result expectedVersion");
    if (command.leaseToken !== null) invalid2("host observations do not use acting leases");
    return;
  }
  if (command.expectedVersion !== 0) invalid2("host intent creation expects version 0");
  const common = ["taskId", "taskVersion", "createdAt"];
  exact(p, [...common, ...attempt ? ["target", "profile", "requestedModel", "effort", "independenceKey", "resumeFrom"] : ["attemptId", "intendedAction", "idempotencyKey", "external", "paid"]], "intent payload");
  text(p.taskId, "taskId");
  positive(p.taskVersion, "taskVersion");
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
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) invalid2("host facts must be an object");
  const facts = pick(raw, effect ? effectFactKeys : attemptFactKeys);
  if (!effect && facts.usage !== null) {
    const value = facts.usage;
    if (typeof value !== "object" || Array.isArray(value)) invalid2("usage must be an object");
    facts.usage = pick(value, ["scope", "sessionId", "totalNanoAiu", "totalPremiumRequests"]);
  }
  if (!effect && facts.cost !== null) {
    const value = facts.cost;
    if (typeof value !== "object" || Array.isArray(value)) invalid2("cost requires an explicit unit and scope");
    facts.cost = pick(value, ["amount", "currency", "scope", "sessionId"]);
  }
  return clone(facts);
}
function validateFacts(facts, source, effect) {
  exact(facts, effect ? effectFactKeys : attemptFactKeys, "observation facts");
  if (facts.response !== null) {
    if (typeof facts.response !== "string" || Buffer.byteLength(facts.response, "utf8") > 8192) {
      invalid2("user-facing response must be at most 8192 bytes");
    }
  }
  if (effect) {
    member(facts.outcome, ["unknown", "succeeded", "not-applied"], "effect outcome");
    if (source !== "host" && facts.outcome !== "unknown") invalid2("local timing cannot establish an external effect outcome");
    return;
  }
  member(facts.status, ["completed", "failed", "timeout", "acknowledgement-lost"], "host status");
  member(facts.liveness, ["stopped", "running", "unknown"], "host liveness");
  for (const key of ["sessionId", "actualRole", "actualProfile", "actualModel", "actualEffort"]) nullableText(facts[key], key);
  for (const key of ["inputTokens", "outputTokens"]) measurement(facts[key], key, true);
  measurement(facts.durationMs, "durationMs");
  if (facts.exitCode !== null && !Number.isSafeInteger(facts.exitCode)) invalid2("exitCode must be an integer or null");
  if (facts.usage !== null) {
    const u = facts.usage;
    exact(u, ["scope", "sessionId", "totalNanoAiu", "totalPremiumRequests"], "usage");
    if (u.scope !== "session-cumulative" || u.sessionId === null || u.sessionId !== facts.sessionId) {
      invalid2("usage checkpoints require the exact cumulative session identity");
    }
    measurement(u.totalNanoAiu, "totalNanoAiu", true);
    measurement(u.totalPremiumRequests, "totalPremiumRequests");
  }
  if (facts.cost !== null) {
    const c = facts.cost;
    exact(c, ["amount", "currency", "scope", "sessionId"], "cost");
    measurement(c.amount, "cost.amount");
    if (c.amount === null || !/^[A-Z]{3}$/.test(c.currency ?? "")) invalid2("cost requires an observed currency amount");
    member(c.scope, ["attempt", "session-cumulative"], "cost.scope");
    if (c.scope === "attempt" ? c.sessionId !== null : c.sessionId === null || c.sessionId !== facts.sessionId) {
      invalid2("cost session identity does not match its scope");
    }
  }
  if (source === "local") {
    if (!["timeout", "acknowledgement-lost"].includes(facts.status) || facts.liveness !== "unknown" || attemptFactKeys.filter((key) => !["status", "liveness", "durationMs"].includes(key)).some((key) => facts[key] !== null)) {
      invalid2("local observations may only establish elapsed timing and uncertain acknowledgement/liveness");
    }
  }
}
function validateHostObservation(value, effect = false) {
  exact(value, ["observationId", "source", "capturedAt", "facts", "sessionConflicts"], "host observation");
  uuid(value.observationId, "observationId");
  member(value.source, ["host", "local"], "observation source");
  assertTimestamp(value.capturedAt, "capturedAt");
  if (!Array.isArray(value.sessionConflicts) || new Set(value.sessionConflicts).size !== value.sessionConflicts.length || effect && value.sessionConflicts.length !== 0) invalid2("invalid observed session conflicts");
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
  const common = ["schema_version", "subject", "subject_version", "actor", "created_at", "observations", "gaps"];
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
  if (body.schema_version !== 1) invalid2("host record schema_version must be 1");
  exact(body.subject, ["kind", "id"], "subject");
  if (body.subject.kind !== "task") invalid2("host record subject must be a Task");
  text(body.subject.id, "subject.id");
  positive(body.subject_version, "subject_version");
  validateActor(body.actor);
  assertTimestamp(body.created_at, "created_at");
  uuid(body.attempt_id, "attempt_id");
  if (!Array.isArray(body.observations) || body.observations.length > MAX_OBSERVATIONS) invalid2("observation bound exceeded");
  body.observations.forEach((o) => validateHostObservation(o, effect));
  if (new Set(body.observations.map((o) => o.observationId)).size !== body.observations.length) invalid2("duplicate observation IDs");
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
      invalid2("host record requested model must match its approved primary profile");
    }
    nullableText(body.requested_effort, "requested_effort");
    member(body.context, ["fresh-single-shot", "resume"], "context");
    nullableText(body.resume_session_id, "resume_session_id");
    if (body.resume_from !== null) uuid(body.resume_from, "resume_from");
    if (body.context === "resume" ? body.resume_from === null || body.resume_session_id === null : body.resume_from !== null || body.resume_session_id !== null) invalid2("resume context identity mismatch");
    validateCapabilities(body.capabilities);
    assertExactKeys(body.settings, /* @__PURE__ */ new Set(["model", "effort"]), "settings", /* @__PURE__ */ new Set());
    if (Object.hasOwn(body.settings, "model") && (!body.capabilities.modelOverride || body.settings.model !== body.requested_model)) invalid2("unsupported model override");
    if (Object.hasOwn(body.settings, "effort") && (body.settings.effort !== body.requested_effort || !body.capabilities.efforts.includes(body.settings.effort))) invalid2("unsupported effort override");
    if (body.requested_effort !== null && body.settings.effort !== body.requested_effort) {
      invalid2("host record must carry the supported requested effort");
    }
    if (!body.capabilities.models.includes(body.requested_model) || body.capabilities.modelOverride && body.settings.model !== body.requested_model) {
      invalid2("host record must retain the available model and supported override");
    }
  }
  const summary = effect ? effectSummary(body) : attemptSummary(body);
  for (const [key, value] of Object.entries(summary)) {
    if (canonicalJson(body[key]) !== canonicalJson(value)) invalid2(`host ${key} does not match retained observations`);
  }
}
function validateHostMutation(command, current, nextBody) {
  if (!Array.isArray(nextBody.observations)) invalid2("host mutation requires an observations array");
  const result = command.kind.endsWith(".result");
  if (!result) {
    if (current) invalid2("host intent requires a missing record");
    if (nextBody.subject?.kind !== "task" || nextBody.subject.id !== command.payload.taskId || nextBody.subject_version !== command.payload.taskVersion || canonicalJson(nextBody.actor) !== canonicalJson(command.actor) || nextBody.created_at !== command.payload.createdAt || nextBody.observations.length !== 0) {
      invalid2("host intent must preserve the command identity");
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
        invalid2(`host intent must preserve payload.${payloadKey}`);
      }
    }
    return;
  }
  if (!current) invalid2("host result requires an existing intent");
  const allowed = /* @__PURE__ */ new Set(["observations", "gaps", command.recordKind === "effect" ? "outcome" : "status"]);
  for (const key of /* @__PURE__ */ new Set([...Object.keys(current.body), ...Object.keys(nextBody)])) {
    if (!allowed.has(key) && canonicalJson(current.body[key]) !== canonicalJson(nextBody[key])) {
      invalid2(`host result cannot change ${key}`);
    }
  }
  if (nextBody.observations.length < current.body.observations.length || nextBody.observations.length > current.body.observations.length + 1 || canonicalJson(nextBody.observations.slice(0, current.body.observations.length)) !== canonicalJson(current.body.observations) || !nextBody.observations.some((o) => o.observationId === command.payload.observationId)) {
    invalid2("host observations are append-only and bound to the command");
  }
}

// src/core/lib/coordination-runtime/contract.mjs
var HOST_COMMANDS = /* @__PURE__ */ new Set(["attempt.start", "attempt.result", "effect.intent", "effect.result"]);
var COMMAND_KINDS = /* @__PURE__ */ new Set([
  ...PARENT_COMMAND_KINDS,
  ...TASK_COMMAND_KINDS,
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
  ...HIERARCHY_KINDS,
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
  "recovery-reconciliation",
  "parent-completion"
]);
var DOD_DIMENSIONS = /* @__PURE__ */ new Set([
  "scope-true",
  "verified",
  "reviewed",
  "shippable-safely",
  "documented",
  "coordination-closed"
]);
var ITEM_DELIVERY_CLASSES2 = /* @__PURE__ */ new Set(["knowledge", "product-change", "operational"]);
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
var PROVENANCE_KINDS2 = /* @__PURE__ */ new Set(["live-peer", "durable-thread", "operator"]);
var RECOVERY_DISPOSITIONS = /* @__PURE__ */ new Set([
  "safe-to-resume",
  "conflicting-partial-work"
]);
function validateHierarchySubject(subject, label = "subject") {
  if (!isPlainObject(subject)) invalid(`${label} must be an object`);
  assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "id"]), label);
  if (!HIERARCHY_KINDS.has(subject.kind)) invalid(`${label}.kind is unsupported`);
  if (subject.kind === "epic") parseEpicId(subject.id, `${label}.id`);
  else parseTypedId(subject.id, subject.kind, `${label}.id`);
  return subject;
}
function subjectRef(subject, version) {
  validateHierarchySubject(subject);
  if (!Number.isSafeInteger(version) || version < 1) {
    invalid("subject version must be a positive safe integer");
  }
  return `${subject.kind}/${subject.id}@${version}`;
}
function subjectEquals(left, right) {
  if (left === null || right === null || left === void 0 || right === void 0) return false;
  validateHierarchySubject(left, "left subject");
  validateHierarchySubject(right, "right subject");
  return left.kind === right.kind && left.id === right.id;
}
function relationshipBindings(record) {
  const body = record.body;
  if (record.kind === "epic") {
    return [...body.required_features, ...body.optional_features].map((id) => ({ subject: { kind: "feature", id }, requiredState: null }));
  }
  if (record.kind === "feature") {
    return [
      { subject: { kind: "epic", id: body.epic_id }, requiredState: null },
      ...[...body.required_requirements, ...body.optional_requirements].map((id) => ({ subject: { kind: "requirement", id }, requiredState: null })),
      ...body.depends_on_features.map((dependency) => ({
        subject: { kind: "feature", id: dependency.feature },
        requiredState: dependency.requires
      }))
    ];
  }
  if (record.kind === "requirement") {
    return [
      { subject: { kind: "feature", id: body.feature_id }, requiredState: null },
      ...[...body.required_tasks, ...body.optional_tasks].map((id) => ({ subject: { kind: "task", id }, requiredState: null }))
    ];
  }
  return [
    { subject: { kind: "feature", id: body.feature_id }, requiredState: null },
    ...body.satisfies.map((id) => ({
      subject: { kind: "requirement", id },
      requiredState: null
    })),
    ...body.depends_on.map((dependency) => ({
      subject: { kind: "task", id: dependency.task },
      requiredState: dependency.requires
    }))
  ];
}
function criteriaRef(record, lookup) {
  if (!isPlainObject(record) || !HIERARCHY_KINDS.has(record.kind) || record.id !== record.body?.id) {
    invalid("criteriaRef requires a hierarchy record");
  }
  const subject = validateHierarchySubject({ kind: record.kind, id: record.id });
  if (!Number.isSafeInteger(record.version) || record.version < 1) {
    invalid("criteriaRef record version must be a positive safe integer");
  }
  const relationships = relationshipBindings(record);
  if (relationships.length > 0 && typeof lookup !== "function") {
    invalid("criteriaRef requires a relationship lookup");
  }
  const relationshipRefs = relationships.map(({ subject: relationship, requiredState }) => {
    const related = lookup(relationship.kind, relationship.id);
    if (!related || related.kind !== relationship.kind || related.id !== relationship.id || !Number.isSafeInteger(related.version) || related.version < 1) {
      invalid(`criteriaRef relationship ${relationship.kind}/${relationship.id} is missing`);
    }
    return {
      subject: subjectRef(relationship, related.version),
      required_state: requiredState
    };
  }).sort((left, right) => left.subject.localeCompare(right.subject) || String(left.required_state).localeCompare(String(right.required_state)));
  const fields = record.kind === "task" ? [
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
  ] : ["outcome", "acceptance", "completion_authority"];
  const criteria = Object.fromEntries(fields.map((key) => [key, record.body[key]]));
  if (record.kind === "task" && record.body.context_artifacts?.length) {
    criteria.context_artifacts = record.body.context_artifacts;
  }
  return createHash3("sha256").update(canonicalJson({
    subject: subjectRef(subject, record.version),
    criteria,
    relationships: relationshipRefs,
    immutable_subject: record.kind === "task" ? record.body.change_ref : null
  })).digest("hex");
}
function isProducingRun(task, actor) {
  return Array.isArray(task.producing_actors) && task.producing_actors.some((producer) => producer.runId === actor.runId);
}
function validateLease2(value, label) {
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
    invalid(`${label}.version_at_grant must be a positive safe integer`);
  }
  assertTimestamp(value.acquired_at, `${label}.acquired_at`);
  assertTimestamp(value.expires_at, `${label}.expires_at`);
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
  if (!ITEM_DELIVERY_CLASSES2.has(value.delivery_class)) {
    invalid(`${label}.delivery_class is unsupported`);
  }
  assertStringArray(value.required_items, `${label}.required_items`);
  if (!(/* @__PURE__ */ new Set(["proposed", "active", "completed", "shipped", "dropped"])).has(value.status)) {
    invalid(`${label}.status is unsupported`);
  }
}
function validateBacklogEntry(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set(["id", "title", "status", "item_id", "reason"]), label);
  assertNonEmptyString(value.id, `${label}.id`);
  assertNonEmptyString(value.title, `${label}.title`);
  if (!(/* @__PURE__ */ new Set(["parked", "promoted", "dropped"])).has(value.status)) {
    invalid(`${label}.status is unsupported`);
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
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  for (const key of ["id", "title", "owner", "north_star_ref"]) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  if (!INITIATIVE_STATES.has(body.status)) invalid(`${label}.status is unsupported`);
  assertExactKeys(body.scope, /* @__PURE__ */ new Set(["current"]), `${label}.scope`);
  assertStringArray(body.scope.current, `${label}.scope.current`, { nonEmpty: true });
  if (!Array.isArray(body.milestones)) invalid(`${label}.milestones must be an array`);
  body.milestones.forEach((entry, index) => validateMilestone(entry, `${label}.milestones[${index}]`));
  if (!Array.isArray(body.backlog)) invalid(`${label}.backlog must be an array`);
  body.backlog.forEach((entry, index) => validateBacklogEntry(entry, `${label}.backlog[${index}]`));
  assertTimestamp(body.updated_at, `${label}.updated_at`);
}
function validateQuestionBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "question_id",
    "subject",
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
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  for (const key of ["question_id", "recipient", "context", "ask", "answer_by"]) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  validateActor(body.asker, `${label}.asker`);
  if (!QUESTION_KINDS.has(body.kind)) invalid(`${label}.kind is unsupported`);
  assertBoolean(body.blocking, `${label}.blocking`);
  if (!(/* @__PURE__ */ new Set(["open", "answered"])).has(body.status)) {
    invalid(`${label}.status is unsupported`);
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
      invalid(`${label}.resolution.lane must be "in-lane"`);
    }
    if (!PROVENANCE_KINDS2.has(body.resolution.provenance)) {
      invalid(`${label}.resolution.provenance is unsupported`);
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
    "subject",
    "thread_id",
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
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.message_id, `${label}.message_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  for (const key of ["thread_id", "sender_role", "sender_run", "recipient"]) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  if (body.parent_id !== null) assertUuid(body.parent_id, `${label}.parent_id`);
  if (!MESSAGE_KINDS.has(body.kind)) invalid(`${label}.kind is unsupported`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  if (!Number.isSafeInteger(body.basis_version) || body.basis_version < 1) {
    invalid(`${label}.basis_version must be a positive safe integer`);
  }
  if (body.thread_id !== subjectRef(body.subject, body.basis_version)) {
    invalid(`${label}.thread_id must bind the exact subject version`);
  }
  if (body.kind === "question") {
    validateQuestionContent(body.payload);
  } else if (body.kind === "answer") {
    validateAnswerContent(body.payload);
  } else if (body.kind === "handoff") {
    validateHandoffContent2(body.payload);
  } else {
    assertExactKeys(body.payload, /* @__PURE__ */ new Set([
      "observed",
      "disposition",
      "staleLeaseToken",
      "newLeaseToken"
    ]), `${label}.payload`);
    assertNonEmptyString(body.payload.observed, `${label}.payload.observed`);
    if (!RECOVERY_DISPOSITIONS.has(body.payload.disposition)) {
      invalid(`${label}.payload.disposition is unsupported`);
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
  if (!PROVENANCE_KINDS2.has(body.provenance)) invalid(`${label}.provenance is unsupported`);
}
function validateReviewBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "review_id",
    "subject",
    "reviewer",
    "kind",
    "content_ref",
    "criteria",
    "criteria_ref",
    "supersedes",
    "verdict",
    "finding_refs",
    "evidence_refs",
    "created_at"
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.review_id, `${label}.review_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (body.subject.kind !== "task") invalid(`${label}.subject must be a Task`);
  validateActor(body.reviewer, `${label}.reviewer`);
  assertNonEmptyString(body.kind, `${label}.kind`);
  validateSubjectRef(body.content_ref, `${label}.content_ref`);
  assertStringArray(body.criteria, `${label}.criteria`, { nonEmpty: true });
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  validateSupersedes(body.supersedes, body.review_id, label);
  if (!REVIEW_VERDICTS.has(body.verdict)) invalid(`${label}.verdict is unsupported`);
  assertStringArray(body.finding_refs, `${label}.finding_refs`);
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, { nonEmpty: true });
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateCriteriaRef(value, label) {
  if (typeof value !== "string" || !HEX_DIGEST.test(value)) {
    invalid(`${label} must be a SHA-256 criteria reference`);
  }
}
function validateSupersedes(ids, ownId, label) {
  assertStringArray(ids, `${label}.supersedes`);
  for (const id of ids) {
    assertUuid(id, `${label}.supersedes entry`);
    if (id === ownId) invalid(`${label} cannot supersede itself`);
  }
}
function validateDeploymentContext(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set(["environment", "environment_class", "deployment_id"]), label);
  assertNonEmptyString(value.environment, `${label}.environment`);
  if (value.environment_class !== "production") invalid(`${label} must confirm a production environment`);
  assertNonEmptyString(value.deployment_id, `${label}.deployment_id`);
}
function validateApprovalBody(body, label) {
  const required = /* @__PURE__ */ new Set([
    "schema_version",
    "approval_id",
    "subject",
    "authority",
    "kind",
    "content_ref",
    "criteria_ref",
    "supersedes",
    "deployment",
    "recovery",
    "decision",
    "evidence_refs",
    "reason",
    "created_at"
  ]);
  assertExactKeys(body, /* @__PURE__ */ new Set([...required, "provenance", "recorded_at_subject_version"]), label, required);
  if (Object.hasOwn(body, "provenance")) validateDecisionProvenance(body.provenance, `${label}.provenance`);
  if (Object.hasOwn(body, "recorded_at_subject_version") && (!Number.isSafeInteger(body.recorded_at_subject_version) || body.recorded_at_subject_version < 1)) {
    invalid(`${label}.recorded_at_subject_version must be a positive subject version`);
  }
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.approval_id, `${label}.approval_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  validateActor(body.authority, `${label}.authority`);
  if (!APPROVAL_KINDS.has(body.kind)) invalid(`${label}.kind is unsupported`);
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  validateSupersedes(body.supersedes, body.approval_id, label);
  if (body.kind === "operator-recovery-resolution") {
    if (body.subject.kind !== "task") invalid(`${label}.subject must be a Task for recovery resolution`);
    if (body.content_ref !== null) invalid(`${label}.content_ref must be null for recovery resolution`);
    assertExactKeys(body.recovery, /* @__PURE__ */ new Set([
      "attempt_id",
      "stale_lease_token",
      "disposition",
      "resume_role"
    ]), `${label}.recovery`);
    assertUuid(body.recovery.attempt_id, `${label}.recovery.attempt_id`);
    assertNonEmptyString(body.recovery.stale_lease_token, `${label}.recovery.stale_lease_token`);
    if (body.recovery.disposition !== "safe-to-resume") {
      invalid(`${label}.recovery.disposition must be safe-to-resume`);
    }
    assertNonEmptyString(body.recovery.resume_role, `${label}.recovery.resume_role`);
    if (body.recovery.resume_role === "operator") {
      invalid(`${label}.recovery.resume_role cannot lease to operator`);
    }
  } else {
    if (body.subject.kind === "task") validateSubjectRef(body.content_ref, `${label}.content_ref`);
    else if (body.kind !== "completion" || body.content_ref !== null) {
      invalid(`${label} parent subjects support completion approval without a content_ref`);
    }
    if (body.recovery !== null) invalid(`${label}.recovery is only for recovery resolution`);
  }
  if (body.kind === "operator-deploy-start" || body.kind === "operator-deploy-complete") {
    if (body.subject.kind !== "task") invalid(`${label}.subject must be a Task for deployment confirmation`);
    validateDeploymentContext(body.deployment, `${label}.deployment`);
  } else if (body.deployment !== null) {
    invalid(`${label}.deployment is only for deployment confirmation`);
  }
  if (!(/* @__PURE__ */ new Set(["approved", "rejected"])).has(body.decision)) {
    invalid(`${label}.decision is unsupported`);
  }
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, { nonEmpty: true });
  assertNonEmptyString(body.reason, `${label}.reason`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateEvidenceBody(body, label) {
  const required = /* @__PURE__ */ new Set([
    "schema_version",
    "evidence_id",
    "subject",
    "kind",
    "content_ref",
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
    if (!(/* @__PURE__ */ new Set(["observed", "declared"])).has(body.provenance.tier)) invalid(`${label}.provenance.tier is unsupported`);
    if (body.provenance.tier === "observed") validateCapture(body.provenance.capture);
    else if (body.provenance.capture !== null) invalid("declared provenance cannot claim capture");
  }
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.evidence_id, `${label}.evidence_id`);
  validateSupersedes(body.supersedes, body.evidence_id, label);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (!EVIDENCE_KINDS.has(body.kind)) invalid(`${label}.kind is unsupported`);
  validateNullableSubject(body.content_ref, `${label}.content_ref`);
  if (body.kind === "parent-completion") {
    if (body.subject.kind === "task") invalid(`${label}.subject must be a parent hierarchy subject`);
    if (body.content_ref !== null) invalid(`${label}.content_ref must be null for parent completion`);
  } else if (body.subject.kind !== "task") {
    invalid(`${label}.subject must be a Task for execution evidence`);
  }
  if (body.kind === "recovery-reconciliation") {
    if (body.criteria_ref !== null) invalid(`${label}.criteria_ref must be null for recovery`);
    if (body.supersedes.length > 0) invalid(`${label} recovery reconciliation cannot supersede observations`);
  } else {
    validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  }
  if (body.kind === "recovery-reconciliation" && body.content_ref !== null) {
    invalid(`${label}.content_ref must be null for recovery reconciliation`);
  }
  if (!(/* @__PURE__ */ new Set(["recovery-reconciliation", "parent-completion"])).has(body.kind) && body.content_ref === null) {
    invalid(`${label}.content_ref is required`);
  }
  if (body.kind === "dod-dimension") {
    if (!DOD_DIMENSIONS.has(body.dimension)) invalid(`${label}.dimension is unsupported`);
    if (!(/* @__PURE__ */ new Set(["clear", "waived", "gap"])).has(body.outcome)) {
      invalid(`${label}.outcome is unsupported for a DoD dimension`);
    }
    if (body.outcome === "waived") assertNonEmptyString(body.reason, `${label}.reason`);
  } else {
    if (body.dimension !== null) invalid(`${label}.dimension must be null`);
    if (!(/* @__PURE__ */ new Set(["passed", "failed"])).has(body.outcome)) {
      invalid(`${label}.outcome is unsupported`);
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
  } else if (body.kind === "recovery-reconciliation") {
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
      invalid(`${label}.data.disposition is unsupported`);
    }
    assertNonEmptyString(body.data.observed, `${label}.data.observed`);
  } else {
    assertExactKeys(body.data, /* @__PURE__ */ new Set(), `${label}.data`);
  }
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateGrantBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "grant_id",
    "subject",
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
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.grant_id, `${label}.grant_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (body.subject.kind !== "task") invalid(`${label}.subject must be a Task`);
  validateActor(body.actor, `${label}.actor`);
  assertStringArray(body.actions, `${label}.actions`, { nonEmpty: true });
  if (!RECORD_KINDS.has(body.record_kind)) invalid(`${label}.record_kind is unsupported`);
  assertNonEmptyString(body.record_id, `${label}.record_id`);
  assertNonEmptyString(body.basis_ref, `${label}.basis_ref`);
  assertNonEmptyString(body.lease_token, `${label}.lease_token`);
  validateActor(body.issued_by, `${label}.issued_by`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  assertTimestamp(body.expires_at, `${label}.expires_at`);
  if (!(/* @__PURE__ */ new Set(["active", "recovered", "revoked"])).has(body.status)) {
    invalid(`${label}.status is unsupported`);
  }
}
function validateAttemptBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "attempt_id",
    "subject",
    "grantor",
    "stale_lease",
    "observed",
    "disposition",
    "recovery_evidence_ids",
    "new_lease",
    "created_at"
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.attempt_id, `${label}.attempt_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (body.subject.kind !== "task") invalid(`${label}.subject must be a Task`);
  validateActor(body.grantor, `${label}.grantor`);
  if (body.stale_lease === null) invalid(`${label}.stale_lease is required`);
  validateLease2(body.stale_lease, `${label}.stale_lease`);
  assertNonEmptyString(body.observed, `${label}.observed`);
  if (!RECOVERY_DISPOSITIONS.has(body.disposition)) {
    invalid(`${label}.disposition is unsupported`);
  }
  assertStringArray(
    body.recovery_evidence_ids,
    `${label}.recovery_evidence_ids`,
    { nonEmpty: true }
  );
  validateLease2(body.new_lease, `${label}.new_lease`);
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
    invalid(`${label} must be a logical host/artifact/evidence reference, never a machine path`);
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
  if (value.source !== "host-command") invalid("capture.source must be host-command");
  validateCaptureReference(value.reference, "capture.reference");
  validateActor(value.actor, "capture.actor");
  assertTimestamp(value.captured_at, "capture.captured_at");
  if (!Array.isArray(value.command) || value.command.length === 0) invalid("capture.command is required");
  value.command.forEach((entry) => assertNonEmptyString(entry, "capture.command entry"));
  if (!Number.isSafeInteger(value.exit_code)) invalid("capture.exit_code must be an integer");
  assertStringArray(value.checks, "capture.checks");
  if (!CLASSIFICATIONS.has(value.classification)) invalid("capture.classification is unsupported");
  return value;
}
function validateDecisionProvenance(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set(["source", "reference", "attributed_to", "captured_at"]), label);
  if (!(/* @__PURE__ */ new Set(["host-interaction", "attributed-supplied"])).has(value.source)) invalid(`${label}.source is unsupported`);
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
    "subject",
    "content_ref",
    "criteria_ref",
    "kind",
    "decision",
    "deployment",
    "recovery"
  ];
  assertExactKeys(value, new Set(keys), "operator decision");
  validateDecisionProvenance(Object.fromEntries(keys.slice(0, 4).map((key) => [key, value[key]])), "operator decision provenance");
  validateHierarchySubject(value.subject, "operator decision subject");
  validateNullableSubject(value.content_ref, "operator decision content_ref");
  validateCriteriaRef(value.criteria_ref, "operator decision criteria_ref");
  if (!APPROVAL_KINDS.has(value.kind)) invalid("operator decision kind is unsupported");
  if (!(/* @__PURE__ */ new Set(["approved", "rejected"])).has(value.decision)) invalid("operator decision is unsupported");
  canonicalJson(value);
}
function operatorDecisionActor(provenance) {
  validateDecisionProvenance(provenance, "operator decision identity");
  return { role: "operator", runId: `human:${createHash3("sha256").update(canonicalJson(provenance)).digest("hex")}` };
}
function validateArtifactBody(body, label) {
  const required = /* @__PURE__ */ new Set([
    "schema_version",
    "artifact_id",
    "subject",
    "producer",
    "content_ref",
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
    if (!Array.isArray(body.input_basis)) invalid(`${label}.input_basis must be an array`);
    const references = /* @__PURE__ */ new Set();
    for (const basis of body.input_basis) {
      assertExactKeys(basis, /* @__PURE__ */ new Set(["reference", "digest"]), `${label}.input_basis entry`);
      assertNonEmptyString(basis.reference, `${label}.input reference`);
      validateCriteriaRef(basis.digest, `${label}.input digest`);
      if (references.has(basis.reference)) invalid(`${label}.input_basis has duplicate references`);
      references.add(basis.reference);
    }
  }
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.artifact_id, `${label}.artifact_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  validateActor(body.producer, `${label}.producer`);
  validateSubjectRef(body.content_ref, `${label}.content_ref`);
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  assertNullableString(body.project_id, `${label}.project_id`);
  assertNonEmptyString(body.run_directory, `${label}.run_directory`);
  if (!Array.isArray(body.snapshots)) invalid(`${label}.snapshots must be an array`);
  for (const snapshot of body.snapshots) {
    assertExactKeys(snapshot, /* @__PURE__ */ new Set(["path", "digest", "snapshot_path"]), `${label}.snapshot`);
    assertNonEmptyString(snapshot.path, `${label}.snapshot.path`);
    assertNonEmptyString(snapshot.snapshot_path, `${label}.snapshot.snapshot_path`);
    validateCriteriaRef(snapshot.digest, `${label}.snapshot.digest`);
  }
  if (body.content_ref.kind === "git" !== (body.snapshots.length === 0)) invalid(`${label} requires exact non-Git snapshots`);
  assertNullableString(body.manifest_path, `${label}.manifest_path`);
  if (body.content_ref.kind === "git" !== (body.manifest_path === null)) invalid(`${label} requires non-Git manifest`);
  if (!CLASSIFICATIONS.has(body.classification)) invalid(`${label}.classification is unsupported`);
  for (const key of ["media_type", "title"]) assertNonEmptyString(body[key], `${label}.${key}`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateAssetBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "asset_id",
    "subject",
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
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  for (const key of ["asset_id", "artifact_id"]) assertUuid(body[key], `${label}.${key}`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (!Number.isSafeInteger(body.revision) || body.revision < 1) invalid(`${label}.revision must be positive`);
  validateActor(body.producer, `${label}.producer`);
  assertNonEmptyString(body.completion_authority, `${label}.completion_authority`);
  assertNullableString(body.validity_owner, `${label}.validity_owner`);
  if (!ASSET_DISPOSITIONS.has(body.disposition) || !ASSET_VALIDITIES.has(body.validity)) invalid(`${label} has unsupported state`);
  assertNonEmptyString(body.target, `${label}.target`);
  for (const key of ["completion_approval_id", "supersedes", "superseded_by"]) {
    if (body[key] !== null) assertUuid(body[key], `${label}.${key}`);
  }
  assertStringArray(body.input_asset_ids, `${label}.input_asset_ids`);
  for (const id of body.input_asset_ids) assertUuid(id, `${label}.input_asset_ids entry`);
  if (!Array.isArray(body.history) || body.history.length === 0) invalid(`${label}.history is required`);
  for (const entry of body.history) {
    assertExactKeys(entry, /* @__PURE__ */ new Set(["disposition", "validity", "target", "reason", "at", "at_subject_version"]), `${label}.history entry`);
    if (!Number.isSafeInteger(entry.at_subject_version) || entry.at_subject_version < 1) invalid(`${label}.history subject version must be positive`);
    if (!ASSET_DISPOSITIONS.has(entry.disposition) || !ASSET_VALIDITIES.has(entry.validity)) invalid(`${label} history has unsupported state`);
    assertNonEmptyString(entry.target, `${label}.history.target`);
    assertNonEmptyString(entry.reason, `${label}.history.reason`);
    assertTimestamp(entry.at, `${label}.history.at`);
  }
  assertTimestamp(body.updated_at, `${label}.updated_at`);
}
function validateProducerCommand(command) {
  if (!HIERARCHY_KINDS.has(command.recordKind) || command.expectedVersion < 1) {
    invalid(`${command.kind} requires an existing hierarchy subject`);
  }
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
    if (!CLASSIFICATIONS.has(command.payload.classification)) invalid("artifact.register classification is unsupported");
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
    if (!ASSET_DISPOSITIONS.has(command.payload.disposition) || !ASSET_VALIDITIES.has(command.payload.validity)) invalid("asset.transition state is unsupported");
    assertNullableString(command.payload.target, "asset.transition target");
    assertNonEmptyString(command.payload.reason, "asset.transition reason");
    assertTimestamp(command.payload.at, "asset.transition at");
  } else {
    assertExactKeys(command.payload, new Set(command.kind === "evidence.register" ? ["body", "tier"] : ["body"]), `${command.kind} payload`);
    const kind = command.kind.split(".")[0];
    recordBodyValidators.get(kind)(command.payload.body, `${command.kind} body`);
    const subject = { kind: command.recordKind, id: command.recordId };
    if (!subjectEquals(command.payload.body.subject, subject)) {
      invalid(`${command.kind} must bind the primary hierarchy subject`);
    }
    if (kind === "review" && command.recordKind !== "task") {
      invalid("review.record requires an existing Task");
    }
    if (kind === "approval" && command.recordKind !== "task" && command.payload.body.kind !== "completion") {
      invalid("only completion approvals may bind parent hierarchy subjects");
    }
    if (kind === "evidence" && command.recordKind !== "task" && command.payload.body.kind !== "parent-completion") {
      invalid("only parent-completion evidence may bind parent hierarchy subjects");
    }
    if (Object.hasOwn(command.payload.body, "provenance")) invalid("provenance is host-derived, not command input");
    if (Object.hasOwn(command.payload.body, "recorded_at_subject_version")) invalid("recorded subject version is runtime-derived");
    if (kind === "evidence" && !(/* @__PURE__ */ new Set(["observed", "declared"])).has(command.payload.tier)) invalid("evidence.register tier is unsupported");
  }
}
var recordBodyValidators = /* @__PURE__ */ new Map([
  ["initiative", validateInitiativeBody],
  ["item", validateLegacyItemBody],
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
function validateAtPayload3(command, kind, keys) {
  if (!HIERARCHY_KINDS.has(command.recordKind)) invalid(`${kind} requires a hierarchy recordKind`);
  if (command.expectedVersion < 1) invalid(`${kind} requires an existing record version`);
  assertExactKeys(command.payload, new Set(keys), `${kind} payload`);
}
function validateHandoffContent2(content) {
  assertExactKeys(content, /* @__PURE__ */ new Set([
    "did",
    "needs",
    "assetState",
    "authority",
    "revalidation",
    "questions"
  ]), "task.handoff payload.content");
  for (const key of ["did", "needs", "assetState", "authority", "revalidation"]) {
    assertNonEmptyString(content[key], `task.handoff payload.content.${key}`);
  }
  assertStringArray(content.questions, "task.handoff payload.content.questions");
}
function validateMessagePayload(command, kind, contentValidator) {
  validateAtPayload3(command, kind, [
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
    invalid(`${kind} payload.kind must be "${expectedKind}"`);
  }
  assertTimestamp(command.payload.createdAt, `${kind} payload.createdAt`);
  contentValidator(command.payload.content);
  assertStringArray(command.payload.artifactRefs, `${kind} payload.artifactRefs`);
  assertStringArray(command.payload.evidenceRefs, `${kind} payload.evidenceRefs`);
  if (!PROVENANCE_KINDS2.has(command.payload.provenance)) {
    invalid(`${kind} payload.provenance is unsupported`);
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
    invalid("question.open payload.content.questionKind is unsupported");
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
    invalid('question.answer payload.content.status must be "answered"');
  }
  assertNonEmptyString(content.answer, "question.answer payload.content.answer");
  if (content.lane !== "in-lane" && content.lane !== "out-of-lane") {
    invalid("question.answer payload.content.lane is unsupported");
  }
  if (Object.hasOwn(content, "resolves")) {
    assertStringArray(content.resolves, "question.answer payload.content.resolves", { nonEmpty: true });
    for (const id of content.resolves) assertUuid(id, "question.answer payload.content.resolves entry");
    if (content.lane !== "in-lane") invalid("out-of-lane answers cannot resolve contradictions");
  }
}
function validateRecover(command) {
  validateAtPayload3(command, "attempt.recover", [
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
    invalid("attempt.recover payload.disposition is unsupported");
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
      invalid("safe recovery requires redispatch and expiresAt together, or neither");
    }
    if (command.payload.expiresAt !== null && Date.parse(command.payload.expiresAt) <= Date.parse(command.payload.createdAt)) {
      invalid("recovered lease expiresAt must be after createdAt");
    }
  } else if (command.payload.redispatch !== null || command.payload.expiresAt !== null) {
    invalid("conflicting recovery cannot redispatch or set expiresAt");
  }
}
var commandValidators = new Map([
  ...[...HOST_COMMANDS].map((kind) => [kind, validateHostCommand]),
  ...[...PARENT_COMMAND_KINDS].map((kind) => [kind, validateParentCommand]),
  ...[...TASK_COMMAND_KINDS].map((kind) => [kind, validateTaskCommand]),
  ...["artifact.register", "asset.transition", "evidence.register", "review.record", "approval.record"].map((kind) => [kind, validateProducerCommand]),
  ["question.open", (command) => validateMessagePayload(command, "question.open", validateQuestionContent)],
  ["question.answer", (command) => validateMessagePayload(command, "question.answer", validateAnswerContent)],
  ["attempt.recover", validateRecover]
]);
function validateAuthority(authority) {
  assertExactKeys(authority, /* @__PURE__ */ new Set(["roles", "grants"]), "authority");
  assertStringArray(authority.roles, "authority.roles");
  if (authority.roles.includes("operator")) {
    invalid("operator is a reserved endpoint, not an installed role");
  }
  if (!Array.isArray(authority.grants)) invalid("authority.grants must be an array");
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
        invalid(`${label}.actions contains unsupported action "${action}"`);
      }
    }
    if (!RECORD_KINDS.has(grant.recordKind)) {
      invalid(`${label}.recordKind is unsupported`);
    }
    assertNonEmptyString(grant.recordId, `${label}.recordId`);
    assertNonEmptyString(grant.basisRef, `${label}.basisRef`);
  }
  return authority;
}
function validateCommand(command) {
  if (!isPlainObject(command)) invalid("command must be an object");
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
    invalid(`unsupported command kind "${command.kind}"`);
  }
  validateActor(command.actor, "command.actor");
  if (!RECORD_KINDS.has(command.recordKind)) {
    invalid(`unsupported record kind "${command.recordKind}"`);
  }
  assertNonEmptyString(command.recordId, "command.recordId");
  if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 0) {
    invalid("command.expectedVersion must be a non-negative safe integer");
  }
  if (command.leaseToken !== null) {
    assertNonEmptyString(command.leaseToken, "command.leaseToken");
  }
  if (!isPlainObject(command.payload)) invalid("command.payload must be an object");
  canonicalJson(command.payload);
  commandValidators.get(command.kind)(command);
  return command;
}
function validateCommandMutation(command, current, nextBody) {
  if (!isPlainObject(nextBody)) invalid(`${command.kind} must produce an object body`);
  if (HOST_COMMANDS.has(command.kind)) {
    validateHostMutation(command, current, nextBody);
    return nextBody;
  }
  if (PARENT_COMMAND_KINDS.has(command.kind)) {
    validateParentCommandMutation(command, current, nextBody);
    return nextBody;
  }
  if (TASK_COMMAND_KINDS.has(command.kind)) {
    validateTaskCommandMutation(command, current, nextBody);
    return nextBody;
  }
  if (command.kind.endsWith(".create")) {
    if (current) invalid(`${command.kind} requires a missing record`);
    if (canonicalJson(nextBody) !== canonicalJson(command.payload.body)) {
      invalid(`${command.kind} must create the supplied body exactly`);
    }
    return nextBody;
  }
  if (!current) invalid(`${command.kind} requires an existing record`);
  const allowedByKind = new Map([
    ...["artifact.register", "asset.transition", "evidence.register", "review.record", "approval.record"].map((kind) => [kind, /* @__PURE__ */ new Set()]),
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
  return nextBody;
}
function validateRecord(record) {
  if (!isPlainObject(record)) invalid("record must be an object");
  assertExactKeys(record, /* @__PURE__ */ new Set([
    "kind",
    "id",
    "subject",
    "version",
    "body"
  ]), "record");
  if (!RECORD_KINDS.has(record.kind)) {
    invalid(`unsupported record kind "${record.kind}"`);
  }
  if (HIERARCHY_KINDS.has(record.kind)) {
    validateHierarchyRecord(record);
    return record;
  }
  assertNonEmptyString(record.id, "record.id");
  if (record.subject !== null) {
    if (record.subject.kind === "item") {
      if (!isPlainObject(record.subject)) invalid("record.subject must be an object or null");
      assertExactKeys(record.subject, /* @__PURE__ */ new Set(["kind", "id"]), "record.subject");
      assertNonEmptyString(record.subject.id, "record.subject.id");
    } else {
      validateHierarchySubject(record.subject, "record.subject");
    }
  }
  if (!Number.isSafeInteger(record.version) || record.version < 1) {
    invalid("record.version must be a positive safe integer");
  }
  const validator = recordBodyValidators.get(record.kind);
  validator(record.body, `record ${record.kind}/${record.id} body`);
  if (record.kind === "item" && (record.id !== record.body.id || record.subject?.kind !== "item" || record.subject.id !== record.id)) {
    invalid("item record envelope must match body.id");
  }
  if (record.kind === "initiative" && (record.id !== record.body.id || record.subject !== null)) {
    invalid("initiative record envelope must match body.id and have null subject");
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
  ])).has(record.kind) && (record.subject === null || !subjectEquals(record.subject, record.body.subject))) {
    invalid(`${record.kind} record envelope subject must match body.subject`);
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
    invalid(`${record.kind} record id must match body.${identityKey}`);
  }
  return record;
}

export {
  PACKS,
  RuntimeError,
  isPlainObject,
  assertExactKeys,
  validateActor,
  canonicalJson,
  commandDigest,
  validateSubjectRef,
  changedKeys,
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
  HIERARCHY_KINDS,
  PARENT_COMMAND_KINDS,
  validateHierarchyRecord,
  validateHierarchyRelationships,
  parentClosureRef,
  COMMAND_KINDS,
  RECORD_KINDS,
  DOD_DIMENSIONS,
  validateHierarchySubject,
  subjectRef,
  subjectEquals,
  criteriaRef,
  isProducingRun,
  CLASSIFICATIONS,
  validateCapture,
  validateOperatorDecision,
  operatorDecisionActor,
  validateAuthority,
  validateCommand,
  validateCommandMutation,
  validateRecord
};

import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  DATABASE,
  LOCK,
  MIGRATIONS,
  applyOperation,
  assertWorkspacePath,
  assertWorkspaceWrite,
  closeStore,
  durablePath,
  exactBytes,
  exactFile,
  exclusiveFile,
  fail,
  fail2,
  fileFingerprint,
  hash,
  hashArtifact,
  logicalStoreDigest,
  migrationManifest,
  openStore,
  pathPrivacy,
  privateAdmission,
  read,
  readDirection,
  readMessageOperation,
  readMessagePage,
  readRecord,
  readSnapshot,
  readSubjectView,
  runs,
  safePath,
  sameSnapshot,
  sourceSnapshot,
  verifyArtifact,
  verifyTarget,
  workspaceManifest
} from "./chunk-GYNRRGQI.mjs";
import {
  COORDINATION_DATABASE,
  LEGACY_COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
  canonicalPath,
  directionPath,
  exactPath,
  normalized,
  parseTypedArtifactRoute,
  pathHasLink,
  readWorkspaceManifest,
  workspaceRootFromCoordinationDatabase
} from "./chunk-S3PHSJ44.mjs";
import {
  DOD_DIMENSIONS,
  RuntimeError,
  assertExactKeys,
  canonicalJson,
  changedKeys,
  criteriaRef,
  isProducingRun,
  parentClosureRef,
  subjectEquals,
  subjectRef,
  validateActor,
  validateAuthority,
  validateCommand,
  validateHierarchyRecord,
  validateHierarchySubject,
  validateRecord
} from "./chunk-XLDNBMDG.mjs";
import {
  TASK_NEEDS_CHANGE_REF,
  TASK_TERMINAL_STATES,
  TERMINAL,
  frontmatter,
  isNull,
  lease,
  listBlock,
  mapListBlock,
  parseStamp,
  parseThread,
  scalar
} from "./chunk-ITUOITH3.mjs";

// src/core/lib/coordination-runtime/acceptance-verdicts.mjs
var contentEquals = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
function matchesAcceptance(body, record, lookup3) {
  return subjectEquals(body.subject, { kind: record.kind, id: record.id }) && body.criteria_ref === criteriaRef(record, lookup3) && (record.kind === "task" ? contentEquals(body.content_ref, record.body.change_ref) : body.content_ref === null);
}
function effectiveRecords(records, idKey, scope, maySupersede) {
  const byId = new Map(records.map((record) => [record[idKey], record]));
  const replaced = /* @__PURE__ */ new Set();
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit = (record) => {
    const id = record[idKey];
    if (visiting.has(id)) fail("EVIDENCE_GAP", "verdict supersession contains a cycle");
    if (visited.has(id)) return;
    visiting.add(id);
    for (const priorId of record.supersedes) {
      const prior = byId.get(priorId);
      if (!prior || scope(prior) !== scope(record)) {
        fail("EVIDENCE_GAP", `${id} supersedes a missing or differently scoped verdict`);
      }
      if (!maySupersede(record)) {
        fail("AUTHORITY_REQUIRED", "a producing run cannot supersede an independent verdict");
      }
      if (replaced.has(priorId)) fail("EVIDENCE_GAP", "verdict supersession has conflicting successors");
      visit(prior);
      replaced.add(priorId);
    }
    visiting.delete(id);
    visited.add(id);
  };
  records.forEach(visit);
  return records.filter((record) => !replaced.has(record[idKey]));
}
function effectiveReviews(reviews, record, lookup3) {
  return effectiveRecords(
    reviews.filter((review) => matchesAcceptance(review, record, lookup3)),
    "review_id",
    (review) => canonicalJson([review.reviewer.role, review.kind]),
    (review) => !isProducingRun(record.body, review.reviewer)
  );
}
function effectiveApprovals(approvals, record, lookup3) {
  const relevant = approvals.filter((approval) => approval.kind === "operator-recovery-resolution" ? subjectEquals(approval.subject, { kind: record.kind, id: record.id }) && approval.criteria_ref === criteriaRef(record, lookup3) && approval.recovery.attempt_id === record.body.recovery_hold : matchesAcceptance(approval, record, lookup3));
  return effectiveRecords(
    relevant,
    "approval_id",
    (approval) => canonicalJson([approval.authority.role, approval.kind, approval.recovery?.attempt_id ?? null]),
    (approval) => approval.kind !== "completion" || record.kind !== "task" || !isProducingRun(record.body, approval.authority)
  );
}
function evidenceScope(record) {
  return canonicalJson([
    record.kind,
    record.dimension,
    record.data.environment ?? null,
    record.data.deployment_id ?? null
  ]);
}
function effectiveEvidence(evidence, record, lookup3) {
  return effectiveRecords(
    evidence.filter((body) => matchesAcceptance(body, record, lookup3)),
    "evidence_id",
    evidenceScope,
    () => true
  );
}

// src/core/lib/coordination-runtime/context.mjs
var DEFAULT_CONTEXT_MAX_BYTES = 24 * 1024;
var DEFAULT_CONTEXT_RECENT_LIMIT = 8;
var MAX_RECENT_LIMIT = 8;
var MAX_MESSAGE_PAGE = 100;
var MAX_EXCERPT_BYTES = 512;
var TERMINAL2 = /* @__PURE__ */ new Set(["completed", "shipped", "dropped"]);
var bindsSubject = (record, subject) => subjectEquals(record?.subject, subject);
function invalid(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function gap(message) {
  throw new RuntimeError("EVIDENCE_GAP", message);
}
function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value === "") invalid(`${label} must be a string`);
}
function validateProjectionOptions(subject, maxBytes, recentLimit) {
  validateHierarchySubject(subject, "context subject");
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    invalid("context maxBytes must be a positive safe integer");
  }
  if (!Number.isSafeInteger(recentLimit) || recentLimit < 0 || recentLimit > MAX_RECENT_LIMIT) {
    invalid(`context recentLimit must be an integer from 0 through ${MAX_RECENT_LIMIT}`);
  }
}
function excerpt(value) {
  const source = typeof value === "string" ? value : canonicalJson(value);
  const sourceBytes = Buffer.byteLength(source, "utf8");
  if (sourceBytes <= MAX_EXCERPT_BYTES) {
    return { text: source, truncated: false };
  }
  const suffix = "\u2026";
  const suffixBytes = Buffer.byteLength(suffix, "utf8");
  let bytes = 0;
  let text = "";
  for (const character of source) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (bytes + characterBytes + suffixBytes > MAX_EXCERPT_BYTES) break;
    text += character;
    bytes += characterBytes;
  }
  return { text: `${text}${suffix}`, truncated: true };
}
function messageSummary(entry) {
  const message = entry.record.body;
  return {
    ref: `message:${entry.record.id}`,
    event_seq: entry.eventSeq,
    kind: message.kind,
    sender: { role: message.sender_role, runId: message.sender_run },
    recipient: message.recipient,
    parent_id: message.parent_id,
    basis_version: message.basis_version,
    created_at_declared: message.created_at,
    payload_excerpt: excerpt(message.payload),
    artifact_reference_count: message.artifact_refs.length,
    evidence_reference_count: message.evidence_refs.length
  };
}
function detailIdentity(reference) {
  const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
  return match ? { kind: match[1].toLowerCase(), id: match[2] } : null;
}
function unique(values) {
  return [...new Set(values)];
}
function currentDecisions(view, get) {
  const effective = effectiveApprovals(
    view.approvals.map(({ record }) => record.body),
    view.record,
    get
  );
  const byId = new Map(view.approvals.map((entry) => [entry.record.id, entry]));
  return effective.map((body) => {
    const entry = byId.get(body.approval_id);
    if (!entry || entry.eventSeq === null) {
      gap(`approval/${body.approval_id} has no persisted event chronology`);
    }
    return {
      entry,
      summary: {
        ref: `approval:${body.approval_id}`,
        event_seq: entry.eventSeq,
        kind: body.kind,
        authority: body.authority,
        decision: body.decision,
        criteria_ref: body.criteria_ref,
        reason: body.reason,
        recovery: body.recovery,
        created_at_declared: body.created_at,
        evidence_verification: "not_performed"
      }
    };
  }).sort((left, right) => left.entry.eventSeq - right.entry.eventSeq);
}
function unresolvedQuestions(view) {
  const subject = { kind: view.record.kind, id: view.record.id };
  const waiting = new Set(view.record.body.waiting_on_questions ?? []);
  const terminal = TERMINAL2.has(view.record.body.state);
  return view.questions.map((entry) => {
    const question = entry.record;
    if (!question) gap("hierarchy subject references a missing question");
    if (!bindsSubject(question, subject) || !terminal && question.body.status !== "open" || !terminal && waiting.has(question.id) && question.body.blocking !== true) {
      gap(`question/${question.id} is not unresolved for ${subject.kind}/${subject.id}`);
    }
    if (entry.eventSeq === null) {
      gap(`question/${question.id} has no persisted opening-message chronology`);
    }
    if (!entry.openedMessage || !bindsSubject(entry.openedMessage, subject) || entry.openedMessage.body.message_id !== question.body.opened_message_id || entry.openedMessage.body.kind !== "question") {
      gap(`question/${question.id} references a missing opening message`);
    }
    for (const message of entry.answerMessages) {
      if (!bindsSubject(message, subject) || message.body.kind !== "answer") {
        gap(`question/${question.id} references a missing answer message`);
      }
    }
    return {
      entry,
      summary: {
        ref: `question:${question.id}`,
        event_seq: entry.eventSeq,
        kind: question.body.kind,
        blocking: question.body.blocking,
        disposition: TERMINAL2.has(view.record.body.state) ? "historical-follow-up" : question.body.blocking ? "blocking" : "nonblocking",
        status: question.body.status,
        asker: question.body.asker,
        recipient: question.body.recipient,
        context: question.body.context,
        ask: question.body.ask,
        answer_by: question.body.answer_by,
        opened_message_ref: `message:${question.body.opened_message_id}`,
        answer_message_refs: question.body.answer_message_ids.map((id) => `message:${id}`)
      }
    };
  }).sort((left, right) => left.entry.eventSeq - right.entry.eventSeq || left.entry.record.id.localeCompare(right.entry.record.id));
}
function recoveryHold(view) {
  if (view.record.kind !== "task" || view.record.body.recovery_hold === null) return null;
  const entry = view.recoveryHold;
  const attempt = entry?.record;
  const subject = { kind: "task", id: view.record.id };
  if (!bindsSubject(attempt, subject) || attempt.id !== view.record.body.recovery_hold || attempt.body.disposition !== "conflicting-partial-work") {
    gap(`task/${view.record.id} references a missing or mismatched recovery attempt`);
  }
  if (!entry.message || entry.eventSeq === null || !bindsSubject(entry.message, subject) || entry.message.body.kind !== "recovery") {
    gap(`attempt/${attempt.id} references a missing recovery message or event`);
  }
  return {
    ref: `attempt:${attempt.id}`,
    message_ref: `message:${entry.message.id}`,
    event_seq: entry.eventSeq,
    observed: attempt.body.observed,
    disposition: attempt.body.disposition,
    stale_lease: attempt.body.stale_lease,
    grantor: attempt.body.grantor,
    created_at_declared: attempt.body.created_at,
    evidence_refs: attempt.body.recovery_evidence_ids.map((id) => `evidence:${id}`),
    required_resolution: {
      authority: "operator",
      kind: "operator-recovery-resolution",
      attempt_id: attempt.id,
      stale_lease_token: attempt.body.stale_lease.token,
      criteria_ref: view.criteriaRef,
      disposition: "safe-to-resume",
      scope: TERMINAL2.has(view.record.body.state) ? "before-restoration" : "before-resumption",
      release: "persist exact operator approval, then separately authorized task.restore",
      evidence_verification: "not_performed"
    }
  };
}
function dependencies(view) {
  return view.dependencies.map(({ dependency, record }) => {
    const dependencyId = dependency.task;
    if (!record) {
      gap(`${view.record.kind}/${view.record.id} references missing dependency task/${dependencyId}`);
    }
    return {
      task_id: record.id,
      task_version: record.version,
      state: record.body.state,
      resume_state: record.body.resume_state ?? null,
      recovery_hold: record.body.recovery_hold ?? null,
      requires: dependency.requires
    };
  });
}
function ensureMessage(entry, label, subject, version) {
  if (!entry?.record) gap(`${label} references a missing message`);
  const threadId = subjectRef(subject, version);
  if (!bindsSubject(entry.record, subject) || entry.record.body.thread_id !== threadId) {
    gap(`${label} does not belong to ${threadId}`);
  }
  return entry;
}
function addReference(references, kind, id) {
  references.set(`${kind}:${id}`, { kind, id });
}
function selectedEvidenceReferences(view, questions, decisions, selectedMessages, latestHandoff) {
  const values = [
    ...view.record.body.context_artifacts ?? [],
    ...questions.flatMap(({ entry }) => [entry.openedMessage, ...entry.answerMessages].flatMap((message) => [
      ...message.body.artifact_refs,
      ...message.body.evidence_refs
    ])),
    ...(view.recoveryHold?.record?.body.recovery_evidence_ids ?? []).map((id) => `evidence:${id}`),
    ...decisions.flatMap(({ entry }) => entry.record.body.evidence_refs),
    ...latestHandoff ? [
      ...latestHandoff.record.body.artifact_refs,
      ...latestHandoff.record.body.evidence_refs
    ] : [],
    ...selectedMessages.flatMap(({ record }) => [
      ...record.body.artifact_refs,
      ...record.body.evidence_refs
    ])
  ];
  const details = new Map(view.referencedDetails.map((entry) => [entry.reference, entry.record]));
  for (const reference of unique(values)) {
    const identity = detailIdentity(reference);
    if (identity && !details.get(reference)) {
      gap(`${reference} is missing or is not readable in the context snapshot`);
    }
  }
  return unique(values);
}
function historyCursor(view, selectedMessages) {
  const remainingCount = view.messageCount - selectedMessages.length;
  if (remainingCount <= 0) return null;
  return {
    subject: { kind: view.record.kind, id: view.record.id },
    threadId: subjectRef(
      { kind: view.record.kind, id: view.record.id },
      view.record.version
    ),
    basisVersion: view.record.version,
    beforeSeq: selectedMessages.length > 0 ? selectedMessages[0].eventSeq : view.throughSeq + 1,
    remainingCount
  };
}
function packetFor(view, {
  questionEntries,
  recovery,
  decisionEntries,
  dependencyEntries,
  latestHandoff,
  selectedMessages
}) {
  const references = /* @__PURE__ */ new Map();
  for (const question of questionEntries) {
    addReference(references, "question", question.entry.record.id);
    addReference(references, "message", question.entry.record.body.opened_message_id);
    for (const id of question.entry.record.body.answer_message_ids) {
      addReference(references, "message", id);
    }
  }
  if (recovery) {
    addReference(references, "attempt", view.recoveryHold.record.id);
    addReference(references, "message", view.recoveryHold.message.id);
  }
  for (const decision of decisionEntries) {
    addReference(references, "approval", decision.entry.record.id);
  }
  if (latestHandoff) addReference(references, "message", latestHandoff.record.id);
  for (const message of selectedMessages) {
    addReference(references, "message", message.record.id);
  }
  const artifactEvidenceReferences = selectedEvidenceReferences(
    view,
    questionEntries,
    decisionEntries,
    selectedMessages,
    latestHandoff
  );
  for (const reference of artifactEvidenceReferences) {
    const identity = detailIdentity(reference);
    if (identity) addReference(references, identity.kind, identity.id);
  }
  const cursor = historyCursor(view, selectedMessages);
  const referenceList = [...references.values()];
  const record = view.record;
  const subject = { kind: record.kind, id: record.id };
  const packet = {
    schema_version: 1,
    through_seq: view.throughSeq,
    subject: {
      kind: record.kind,
      id: record.id,
      version: record.version,
      title: record.body.title,
      state: record.body.state,
      resume_state: record.body.resume_state ?? null,
      recovery_hold: record.body.recovery_hold ?? null,
      completion_disposition: record.body.completion_disposition ?? null,
      outcome: record.body.outcome
    },
    authority: {
      owner: record.body.owner ?? null,
      scope_authority: record.body.scope_authority,
      completion_authority: record.body.completion_authority,
      acceptance_actor: record.body.acceptance_actor ?? null,
      next_role: record.body.next_role ?? null,
      lease: record.body.lease == null ? null : {
        holder: record.body.lease.holder,
        token: record.body.lease.token,
        version_at_grant: record.body.lease.version_at_grant,
        expires_at: record.body.lease.expires_at
      }
    },
    revision: {
      subject_ref: subjectRef(subject, record.version),
      subject_version: record.version,
      criteria_ref: view.criteriaRef,
      change_ref: record.body.change_ref ?? null,
      updated_at: record.body.updated_at
    },
    acceptance: record.body.acceptance,
    review_requirements: record.body.review_requirements ?? [],
    artifact_obligations: {
      artifact_expectation: record.body.artifact_expectation ?? null,
      artifact_expectation_reason: record.body.artifact_expectation_reason ?? null,
      artifact_class: record.body.artifact_class ?? null,
      durability: record.body.durability ?? null,
      validity_owner: record.body.validity_owner ?? null,
      artifact_targets: record.body.artifact_targets ?? []
    },
    dependencies: dependencyEntries,
    unresolved_questions: questionEntries.map(({ summary }) => summary),
    recovery_hold: recovery,
    blockers: [
      ...questionEntries.filter(({ summary }) => summary.disposition === "blocking").map(({ summary }) => summary),
      ...recovery && !TERMINAL2.has(record.body.state) ? [{ kind: "recovery-hold", ref: recovery.ref, required_authority: "operator" }] : []
    ],
    decisions: decisionEntries.map(({ summary }) => summary),
    latest_handoff: latestHandoff ? messageSummary(latestHandoff) : null,
    selected_artifact_evidence_references: artifactEvidenceReferences,
    recent_messages: selectedMessages.map(messageSummary),
    references: referenceList,
    history_cursor: cursor
  };
  return {
    text: canonicalJson(packet),
    references: referenceList,
    historyCursor: cursor
  };
}
function projectContext(store, {
  subject,
  maxBytes = DEFAULT_CONTEXT_MAX_BYTES,
  recentLimit = DEFAULT_CONTEXT_RECENT_LIMIT
}) {
  validateProjectionOptions(subject, maxBytes, recentLimit);
  const view = readSubjectView(store, {
    subject,
    recentLimit
  });
  if (!view.record) gap(`${subject.kind}/${subject.id} does not exist`);
  const get = (kind, id) => readRecord(store, kind, id);
  view.criteriaRef = criteriaRef(view.record, get);
  const questionEntries = unresolvedQuestions(view);
  const recovery = recoveryHold(view);
  const decisionEntries = currentDecisions(view, get);
  const dependencyEntries = dependencies(view);
  const latestHandoff = view.latestHandoff === null ? null : ensureMessage(view.latestHandoff, "latest handoff", subject, view.record.version);
  const recent = view.recentMessages.map((entry, index) => ensureMessage(entry, `recent message ${index + 1}`, subject, view.record.version));
  const fixed = {
    questionEntries,
    recovery,
    decisionEntries,
    dependencyEntries,
    latestHandoff
  };
  let selectedMessages = [];
  let projection = packetFor(view, { ...fixed, selectedMessages });
  let bytes = Buffer.byteLength(projection.text, "utf8");
  if (bytes > maxBytes) {
    throw new RuntimeError(
      "CONTEXT_BUDGET",
      `Required context uses ${bytes} bytes; limit is ${maxBytes}`
    );
  }
  for (let count = 1; count <= recent.length; count += 1) {
    const candidateMessages = recent.slice(-count);
    const candidate = packetFor(view, { ...fixed, selectedMessages: candidateMessages });
    const candidateBytes = Buffer.byteLength(candidate.text, "utf8");
    if (candidateBytes > maxBytes) break;
    selectedMessages = candidateMessages;
    projection = candidate;
    bytes = candidateBytes;
  }
  return {
    throughSeq: view.throughSeq,
    text: projection.text,
    bytes,
    references: projection.references,
    historyCursor: projection.historyCursor
  };
}
function readDetail(store, { kind, id }) {
  assertNonEmptyString(kind, "detail kind");
  assertNonEmptyString(id, "detail id");
  const record = readRecord(store, kind, id);
  if (!record) gap(`${kind}/${id} does not exist`);
  return record;
}
function readMessages(store, {
  subject,
  threadId,
  basisVersion,
  beforeSeq = null,
  limit = 50
}) {
  validateHierarchySubject(subject, "message subject");
  assertNonEmptyString(threadId, "message threadId");
  if (!Number.isSafeInteger(basisVersion) || basisVersion < 1) {
    invalid("message basisVersion must be a positive safe integer");
  }
  if (threadId !== subjectRef(subject, basisVersion)) {
    invalid("message threadId must bind the requested typed subject and basisVersion");
  }
  if (beforeSeq !== null && (!Number.isSafeInteger(beforeSeq) || beforeSeq < 1)) {
    invalid("message beforeSeq must be a positive safe integer or null");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_MESSAGE_PAGE) {
    invalid(`message limit must be an integer from 1 through ${MAX_MESSAGE_PAGE}`);
  }
  return readMessagePage(store, {
    subject,
    threadId,
    basisVersion,
    beforeSeq,
    limit
  });
}

// src/core/lib/coordination-runtime/input-basis.mjs
import { createHash } from "node:crypto";
var digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
var privacyRank = { public: 0, internal: 1, confidential: 2, personal: 3 };
function captureInputBasis(context, tx, references, seen = /* @__PURE__ */ new Set(), observe) {
  return [...new Set(references)].sort().map((reference) => {
    if (seen.has(reference)) fail("EVIDENCE_GAP", "applicable inputs contain a cycle");
    const next = /* @__PURE__ */ new Set([...seen, reference]);
    const match = /^(artifact|asset|evidence):([0-9a-f-]+)$/i.exec(reference);
    if (!match) {
      const subject = hashArtifact({ root: context.root, relativePath: reference });
      observe?.({ subject, classification: pathPrivacy(context.root, subject.path) });
      return { reference, digest: digest(subject) };
    }
    const [, kind, id] = match;
    const record = tx.get(kind, id);
    if (!record) fail("EVIDENCE_GAP", `applicable input ${reference} is missing`);
    if (kind === "artifact") {
      verifyArtifact(context.root, record.body);
      observe?.(record.body);
      if (record.body.input_basis === void 0) {
        fail("EVIDENCE_GAP", `applicable input ${reference} has unknown captured lineage; register a fresh explicit input basis`);
      }
      verifyInputBasis(context, tx, record.body.input_basis, next, observe);
    } else if (kind === "asset") {
      captureInputBasis(context, tx, [
        `artifact:${record.body.artifact_id}`,
        ...record.body.input_asset_ids.map((id2) => `asset:${id2}`)
      ], next, observe);
    } else {
      captureInputBasis(context, tx, record.body.evidence_refs, next, observe);
    }
    const owner = record.subject ? tx.get(record.subject.kind, record.subject.id) : null;
    if (!owner) fail("EVIDENCE_GAP", `applicable input ${reference} has no owning hierarchy subject`);
    return {
      reference,
      digest: digest({
        record,
        ownerCriteria: criteriaRef(owner, (kind2, id2) => tx.get(kind2, id2))
      })
    };
  });
}
function verifyInputBasis(context, tx, basis, seen = /* @__PURE__ */ new Set(), observe) {
  if (canonicalJson(captureInputBasis(context, tx, basis.map((b) => b.reference), seen, observe)) !== canonicalJson(basis)) {
    fail("EVIDENCE_GAP", "applicable design/brief/input revision changed; register a fresh output basis and independent acceptance");
  }
}
function inputBasisCurrent(context, tx, basis) {
  try {
    verifyInputBasis(context, tx, basis);
    return true;
  } catch (error) {
    if (error.code !== "EVIDENCE_GAP") throw error;
    return false;
  }
}
function artifactInputReferences(item, inputAssetIds) {
  return [...item.context_artifacts ?? [], ...inputAssetIds.map((id) => `asset:${id}`)];
}

// src/core/lib/coordination-runtime/migration.mjs
import {
  chmodSync,
  closeSync,
  constants,
  copyFileSync,
  existsSync as existsSync2,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";

// src/core/lib/coordination-runtime/migration-legacy.mjs
import { basename } from "node:path";
import { existsSync } from "node:fs";
var nullable = (v) => isNull(v) ? null : v;
var METADATA_LIMIT = 64 * 1024;
var retired = (role) => /^(product-|gtm-|personal-|kai-product-|kai-go-to-market-)/.test(role ?? "");
var roleKnown = (role, roles) => role === "operator" || !retired(role) && roles.includes(role);
function block(lines, key) {
  const start = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    out.push(line);
  }
  return out;
}
function section(text, heading) {
  return new RegExp(`(?:^|\\n)## ${heading}\\s*\\r?\\n([\\s\\S]*?)(?=\\n## |$)`).exec(text)?.[1].trim();
}
function timestamp(value) {
  const parsed = parseStamp(value);
  return parsed === null ? null : new Date(parsed).toISOString();
}
function scalarShape(raw, { emptyList = false } = {}) {
  const value = raw.trim();
  if (emptyList && value === "[]") return true;
  if (!value || value === "~") return false;
  if (/^"[^"\r\n]*"$|^'[^'\r\n]*'$/.test(value)) return true;
  return !/^[\[\]{}|>&*!?#"'%-]|:\s|[\r\n\t]/.test(value);
}
function collection(lines, key, issues, { keys = null, emptyLists = [] } = {}) {
  const head = lines.find((l) => l.startsWith(`${key}:`));
  const body = block(lines, key).filter((l) => l.trim() && !/^\s*#/.test(l));
  if (!head || !new RegExp(`^${key}:\\s*(\\[\\])?\\s*$`).test(head) || scalar(lines, key) === "[]" && body.length || scalar(lines, key) === "" && !body.length) {
    issues.push(`unsupported or indeterminate ${key} collection shape`);
    return [];
  }
  let valid = true, current = null;
  const complete = () => {
    if (current && keys.some((k) => !current.has(k))) valid = false;
  };
  for (const line of body) {
    if (!keys) {
      const value = /^ {2}- (.+)$/.exec(line)?.[1];
      if (!value || !scalarShape(value)) valid = false;
      continue;
    }
    const start = /^ {2}- ([a-z_]+):\s?(.*)$/.exec(line);
    const continuation = /^ {4}([a-z_]+):\s?(.*)$/.exec(line);
    if (start) {
      complete();
      current = /* @__PURE__ */ new Set();
      if (start[1] !== keys[0]) valid = false;
    }
    const entry = start ?? continuation;
    if (!entry || !current || !keys.includes(entry[1]) || current.has(entry[1]) || !scalarShape(entry[2], { emptyList: emptyLists.includes(entry[1]) })) {
      valid = false;
    }
    if (entry && current) current.add(entry[1]);
  }
  complete();
  if (!valid) {
    issues.push(`malformed, partial or nested ${key} collection`);
    return [];
  }
  return keys ? mapListBlock(lines, key) : listBlock(lines, key);
}
function headerMetadata(lines, kind, issues) {
  const fields = {};
  const declarations = /* @__PURE__ */ new Map();
  for (const line of lines) {
    const match = /^([a-z_]+):/.exec(line);
    if (!match) {
      if (/^\S/.test(line)) issues.push("unsupported or malformed top-level metadata");
      continue;
    }
    const key = match[1];
    const values = declarations.get(key) ?? [];
    if (values.length) issues.push(`ambiguous duplicate field ${key}`);
    values.push(scalar([line], key));
    declarations.set(key, values);
    fields[key] = values[0];
  }
  let identityUnresolved = ["id", "slug"].some((key) => (declarations.get(key)?.length ?? 0) > 1);
  if (kind === "initiative" && fields.id && fields.slug && fields.id !== fields.slug) {
    issues.push("ambiguous id versus declared slug");
    identityUnresolved = true;
  }
  const lifecycle = ["state", "status"].flatMap((key) => declarations.get(key) ?? []);
  const lifecycleAmbiguous = new Set(lifecycle).size > 1 || ["state", "status"].some((key) => (declarations.get(key)?.length ?? 0) > 1);
  const declaredState = fields[kind === "initiative" ? "status" : "state"] ?? null;
  if (lifecycleAmbiguous) issues.push("ambiguous or conflicting lifecycle declarations");
  if (declaredState === null || isNull(declaredState)) issues.push(`missing explicit ${kind} lifecycle`);
  return {
    fields,
    declaredState,
    producerRun: fields.producer_run ?? null,
    updated: fields.updated ?? fields.updated_at ?? null,
    metadataSupported: issues.length === 0,
    identityUnresolved,
    lifecycleAmbiguous,
    terminalHistory: lifecycle.some((state) => TERMINAL.has(state) || state === "archived")
  };
}
function parseSource(root, entry, roles) {
  const candidate = /\.md$/i.test(entry.path);
  const file = candidate ? fileFingerprint(root, entry.path, { prefixBytes: METADATA_LIMIT }) : null;
  if (file && (file.digest !== entry.digest || file.size !== entry.size)) fail2("RECOVERY_REQUIRED", "legacy source changed during parsing");
  const text = file?.prefix.toString("utf8") ?? "";
  const invalidEncoding = file && !file.prefix.equals(Buffer.from(text));
  const fm = frontmatter(text)?.filter((line) => !/^\s*#/.test(line)) ?? null;
  const archivedItem = entry.path.startsWith(".kai/archive/") && fm && (scalar(fm, "type") === "work-item" || scalar(fm, "id") && scalar(fm, "initiative") && scalar(fm, "state") && scalar(fm, "version"));
  const kind = entry.path.startsWith(".kai/state/items/") && !/\/README\.md$/i.test(entry.path) || archivedItem ? "item" : entry.path.startsWith(".kai/state/threads/") && !/\/README\.md$/i.test(entry.path) ? "thread" : /\/initiative\.md$/.test(entry.path) || /\/northstar\.md$/.test(entry.path) && fm ? "initiative" : /backlog\.md$/.test(entry.path) ? "backlog" : fm && scalar(fm, "asset_id") ? "asset" : "archive";
  const source = {
    sourceId: hash(entry.path),
    path: entry.path,
    digest: entry.digest,
    kind,
    declaredId: fm ? nullable(scalar(fm, kind === "asset" ? "asset_id" : "id")) ?? (kind === "initiative" ? nullable(scalar(fm, "slug")) : null) : null,
    size: entry.size,
    parsed: {},
    issues: [],
    status: "archived",
    version: 1,
    record: null
  };
  if (fm && !invalidEncoding && ["item", "initiative"].includes(kind)) {
    source.parsed = headerMetadata(fm, kind, source.issues);
  }
  if (candidate && (entry.size > METADATA_LIMIT || invalidEncoding) && (kind !== "archive" || text.startsWith("---"))) {
    source.status = "quarantined";
    source.issues.push("unsupported encoding or oversized coordination metadata; 64 KiB limit, exact bytes retained externally");
    if (!fm || invalidEncoding) {
      source.declaredId = null;
      source.parsed.identityUnresolved = true;
    } else if (!source.parsed.fields) source.parsed = {
      declaredState: scalar(fm, "state") ?? scalar(fm, "status") ?? null,
      fields: Object.fromEntries(fm.filter((l) => /^[a-z_]+:/.test(l)).map((l) => {
        const key = l.slice(0, l.indexOf(":"));
        return [key, scalar(fm, key)];
      }))
    };
    source.parsed.metadataSupported = false;
    return source;
  }
  if (kind === "thread") {
    const thread = parseThread(text);
    source.parsed = { ...thread, messages: thread.messages.map((m) => ({ ...m, senderRun: m.fields.sender_run ?? null })) };
    source.declaredId = fm ? nullable(scalar(fm, "id")) : null;
    source.parsed.itemId = fm ? nullable(scalar(fm, "item_id")) ?? basename(entry.path, ".md") : basename(entry.path, ".md");
    source.issues.push(...thread.diagnostics.map((d) => `${d.type}: ${d.message}`));
    if (thread.messages.length) source.issues.push("legacy thread requires explicit revalidation; roles alone do not prove run identity or current answers");
    if (/\b(?:QUESTION|ANSWER|HANDOFF)\b/.test(text) && !thread.messages.length) source.issues.push("unparsed legacy thread packet");
    if (source.issues.length) source.status = "quarantined";
    return source;
  }
  if (!["item", "initiative"].includes(kind)) {
    source.parsed = { declaredState: fm ? scalar(fm, "state") ?? scalar(fm, "status") ?? null : null };
    if (kind === "asset") {
      source.declaredId = nullable(scalar(fm, "asset_id"));
      source.parsed.metadata = Object.fromEntries(fm.filter((l) => /^[a-z_]+:/.test(l)).map((l) => {
        const key = l.slice(0, l.indexOf(":"));
        return [key, scalar(fm, key)];
      }));
      source.issues.push("legacy asset validity/acceptance is historical and requires fresh runtime evidence");
      source.status = "quarantined";
    }
    if (kind === "backlog") {
      source.parsed.entries = text.split(/\r?\n/).filter((l) => /^\|/.test(l)).map((l) => l.split("|").slice(1, -1).map((s) => s.trim())).filter((c) => c.length >= 3 && c[0] && !/^(id|[-: ]+)$/i.test(c[0])).map((c) => ({ id: c[0], title: c[1], status: c[2], rawCells: c }));
    }
    return source;
  }
  source.status = "quarantined";
  if (!fm) {
    source.parsed = { identityUnresolved: true, metadataSupported: false };
    source.issues.push("malformed frontmatter");
    return source;
  }
  const { fields } = source.parsed;
  const seen = new Set(Object.keys(fields));
  if (kind === "initiative") {
    source.declaredId ??= nullable(fields.slug);
    source.parsed.milestones = block(fm, "milestones");
  }
  if (!source.declaredId) source.issues.push("missing declared original ID");
  const declaredLease = lease(fm);
  if (!isNull(fields.lease) && fields.lease !== "" || !isNull(declaredLease.holder) || !isNull(declaredLease.token) || /^(in-progress|deploying|production-verification)$/.test(fields.state ?? "")) {
    fail2("RECOVERY_REQUIRED", `offline migration refuses active or unreconciled work: ${entry.path}`);
  }
  for (const key of ["owner", "scope_authority", "completion_authority", "next_role", "validity_owner"]) {
    if (!isNull(fields[key]) && !roleKnown(fields[key], roles)) source.issues.push(`unresolved or retired ${key}: ${fields[key]}`);
  }
  if (kind === "item" && TERMINAL.has(fields.state)) source.issues.push("historical terminal acceptance is unverifiable; retain lifecycle without reopening it");
  if (archivedItem) source.issues.push("archived work identity/version is historical, never new dispatchable work");
  if (kind === "initiative" && ["completed", "shipped", "archived", "dropped"].includes(fields.status)) {
    source.issues.push("historical terminal initiative closure is unverified");
  }
  if (kind === "item" && fields.state !== "proposed") source.issues.push("legacy advancement needs explicit scope revalidation; no current approval imported");
  const requireField = (key) => {
    if (!seen.has(key)) source.issues.push(`missing explicit ${key}`);
  };
  const checkedCollection = (lines, key, options) => {
    const issues = [];
    const value = collection(lines, key, issues, options);
    if (issues.length) source.parsed.metadataSupported = false;
    source.issues.push(...issues);
    return value;
  };
  const list = (key) => checkedCollection(fm, key);
  const mapList = (key, keys, emptyLists = []) => checkedCollection(fm, key, { keys, emptyLists });
  const collections = new Set(kind === "item" ? ["acceptance", "artifact_targets", "context_artifacts", "touches", "depends_on", "waiting_on_questions", "review_requirements", "completed_reviews"] : ["scope", "milestones", "backlog"]);
  for (const key of seen) {
    if (!collections.has(key) && block(fm, key).some((l) => l.trim() && !/^\s*#/.test(l))) {
      source.issues.push(`unsupported nested ${key} metadata`);
      source.parsed.metadataSupported = false;
    }
  }
  let body;
  if (kind === "item") {
    for (const key of ["owner", "scope_authority", "completion_authority", "lease", "change_ref", "required_for_milestone", "depends_on", "review_requirements", "completed_reviews"]) requireField(key);
    const reviews = mapList("review_requirements", ["role", "kind"]);
    source.parsed.completedReviews = mapList("completed_reviews", ["role", "kind", "evidence", "verdict", "timestamp", "change_ref"]);
    if (source.parsed.completedReviews.length) source.issues.push("historical reviews retained, not current acceptance");
    const dependencies2 = mapList("depends_on", ["item", "requires"]);
    if (fields.review_requirements !== "" && fields.review_requirements !== "[]") source.issues.push("unsupported review requirements");
    reviews.forEach((r) => {
      if (!roleKnown(r.role, roles)) source.issues.push(`unavailable reviewer ${r.role}`);
    });
    if (!isNull(fields.change_ref)) source.issues.push("legacy revision needs explicit artifact registration");
    if (!["true", "false", "yes", "no"].includes(fields.required_for_milestone)) source.issues.push("unknown milestone requirement");
    body = {
      schema_version: 1,
      id: source.declaredId,
      title: fields.title,
      initiative: fields.initiative,
      delivery_class: fields.delivery_class,
      state: fields.state,
      resume_state: null,
      scope_authority: fields.scope_authority,
      completion_authority: fields.completion_authority,
      producer_actor: null,
      producing_actors: [],
      acceptance_actor: null,
      priority: Number(fields.priority),
      next_role: nullable(fields.next_role),
      outcome: fields.outcome ?? section(text, "Outcome"),
      acceptance: seen.has("acceptance") ? list("acceptance") : section(text, "Acceptance")?.split(/\r?\n/).map((l) => /^- \[[ x]\] (.+)$/.exec(l)?.[1]) ?? [],
      artifact_expectation: fields.artifact_expectation,
      artifact_expectation_reason: nullable(fields.artifact_expectation_reason),
      artifact_class: nullable(fields.artifact_class),
      durability: nullable(fields.durability),
      validity_owner: nullable(fields.validity_owner),
      artifact_targets: list("artifact_targets"),
      context_artifacts: list("context_artifacts"),
      touches: list("touches"),
      depends_on: dependencies2,
      lease: null,
      recovery_hold: null,
      waiting_on_questions: list("waiting_on_questions"),
      required_for_milestone: ["true", "yes"].includes(fields.required_for_milestone),
      review_requirements: reviews,
      change_ref: null,
      updated_at: timestamp(fields.updated_at ?? fields.updated)
    };
    if (body.waiting_on_questions.length) source.issues.push("unresolved legacy blocking questions");
    if (fields.producer_run || fields.producer_actor || fields.producing_actors) source.issues.push("declared production history needs explicit revalidation");
    for (const path2 of [...body.context_artifacts, ...body.artifact_targets]) {
      try {
        if (path2.startsWith("project:")) {
          source.issues.push(`project artifact requires explicit revalidation: ${path2}`);
          continue;
        }
        if (!existsSync(safePath(root, path2))) source.issues.push(`missing artifact: ${path2}`);
      } catch {
        source.issues.push(`unsafe artifact: ${path2}`);
      }
    }
  } else {
    const milestones = mapList("milestones", ["id", "title", "delivery_class", "required_items", "status"], ["required_items"]).map((m) => ({
      id: m.id,
      title: m.title,
      delivery_class: m.delivery_class,
      required_items: m.required_items === "[]" ? [] : null,
      status: m.status
    }));
    const backlog = mapList("backlog", ["id", "title", "status", "item_id", "reason"]).map((b) => ({
      id: b.id,
      title: b.title,
      status: b.status,
      item_id: nullable(b.item_id),
      reason: nullable(b.reason)
    }));
    source.parsed.terminalMilestones = milestones.some((m) => TERMINAL.has(m.status));
    if (source.parsed.terminalMilestones) source.issues.push("historical terminal milestone closure is unverified");
    const scopeBlock = block(fm, "scope");
    let scopeCurrent;
    if (scopeBlock.some((l) => /^ {2}current:/.test(l))) {
      const nested = scopeBlock.map((l) => l.slice(2));
      if (fields.scope !== "" || scopeBlock.some((l) => l.trim() && !l.startsWith("  ")) || nested.filter((l) => /^\S/.test(l) && !/^#/.test(l)).length !== 1) {
        source.issues.push("unsupported scope mapping");
        source.parsed.metadataSupported = false;
      }
      const issues = [];
      scopeCurrent = collection(nested, "current", issues);
      if (issues.length) source.parsed.metadataSupported = false;
      source.issues.push(...issues.map((i) => `scope: ${i}`));
    } else scopeCurrent = list("scope");
    body = {
      schema_version: 1,
      id: source.declaredId,
      title: fields.title,
      status: fields.status,
      owner: fields.owner,
      scope: { current: scopeCurrent },
      milestones,
      backlog,
      north_star_ref: fields.north_star_ref ?? entry.path,
      updated_at: timestamp(fields.updated_at ?? fields.updated)
    };
    try {
      if (!existsSync(safePath(root, body.north_star_ref))) source.issues.push("missing north star");
    } catch {
      source.issues.push("unsafe north star");
    }
  }
  const version = kind === "item" ? Number(fields.version) : Number(fields.version ?? 1);
  try {
    source.record = validateRecord({
      kind,
      id: source.declaredId,
      subject: kind === "item" ? { kind: "item", id: source.declaredId } : null,
      version,
      body
    });
  } catch (error) {
    source.issues.push(error.message);
    source.record = null;
  }
  if (!source.issues.length) source.status = "converted";
  return source;
}
function parseLegacySources(root, files, roles) {
  const sources = files.map((entry) => parseSource(root, entry, roles));
  const identities = /* @__PURE__ */ new Map();
  for (const source of sources) {
    if (!source.declaredId || !["item", "initiative"].includes(source.kind)) continue;
    const key = `${source.kind}/${source.declaredId}`;
    const group = identities.get(key) ?? [];
    group.push(source);
    identities.set(key, group);
  }
  for (const group of identities.values()) {
    if (group.length > 1) group.forEach((s) => {
      s.issues.push("ambiguous duplicate declared ID");
      s.status = "quarantined";
    });
  }
  for (const source of sources.filter((s) => s.kind === "item")) {
    if (sources.some((s) => s.kind === "thread" && s.parsed.itemId === source.declaredId && s.issues.length)) {
      source.issues.push("legacy thread has unresolved authority/history");
      source.status = "quarantined";
    }
  }
  let changed;
  do {
    changed = false;
    const safe = new Map(sources.filter((s) => s.status === "converted").map((s) => [`${s.kind}/${s.declaredId}`, s]));
    for (const s of safe.values()) {
      if (s.kind === "initiative") {
        const references = [
          ...s.record.body.milestones.flatMap((m) => m.required_items),
          ...s.record.body.backlog.map((b) => b.item_id).filter(Boolean)
        ];
        if (references.some((id) => !safe.has(`item/${id}`))) {
          s.issues.push("unresolved milestone/backlog item reference");
          s.status = "quarantined";
          changed = true;
        }
      }
      if (s.kind !== "item") continue;
      const body = s.record.body;
      if (!safe.has(`initiative/${body.initiative}`) || body.depends_on.some((d) => !safe.has(`item/${d.item}`))) {
        s.issues.push("unresolved initiative or dependency");
        s.status = "quarantined";
        changed = true;
      }
      const visiting = /* @__PURE__ */ new Set();
      const visit = (id) => {
        if (visiting.has(id)) return true;
        visiting.add(id);
        const cycle = (safe.get(`item/${id}`)?.record.body.depends_on ?? []).some((d) => visit(d.item));
        visiting.delete(id);
        return cycle;
      };
      if (visit(s.declaredId)) {
        s.issues.push("dependency cycle");
        s.status = "quarantined";
        changed = true;
      }
    }
  } while (changed);
  return sources;
}
function legacyClassificationSources(rows, existing = /* @__PURE__ */ new Set()) {
  if (!Array.isArray(rows)) return [];
  const sources = [];
  for (const row of rows) {
    if (!row || !(/* @__PURE__ */ new Set(["initiative", "item"])).has(row.kind)) continue;
    const declaredId = typeof row.declared_id === "string" && row.declared_id ? row.declared_id : null;
    const key = `${row.kind}\0${declaredId}`;
    if (declaredId && existing.has(key) && (/* @__PURE__ */ new Set(["converted", "revalidated"])).has(row.status)) continue;
    let parsed = {};
    let issues = [];
    try {
      parsed = JSON.parse(row.parsed);
      issues = JSON.parse(row.issues);
    } catch {
      fail2("RECOVERY_REQUIRED", `legacy source classification metadata is malformed: ${row.path}`);
    }
    const declaredVersion = Number(parsed.fields?.version);
    const version = Number.isSafeInteger(declaredVersion) && declaredVersion > 0 ? declaredVersion : Number(row.version);
    sources.push({
      kind: row.kind,
      id: `source:${row.source_id}`,
      declared_id: declaredId,
      version: Number.isSafeInteger(version) && version > 0 ? version : 1,
      lifecycle: parsed.declaredState ?? null,
      updated_at: parsed.updated ?? parsed.fields?.updated_at ?? parsed.fields?.updated ?? null,
      digest: row.digest,
      body: null,
      record_available: false,
      source_path: row.path,
      source_id: row.source_id,
      source_status: row.status,
      issues
    });
  }
  return sources.sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
}

// src/core/lib/coordination-runtime/migration.mjs
var inFlight = /* @__PURE__ */ new Set();
var repairs = /* @__PURE__ */ new WeakMap();
var json = (root, path2) => JSON.parse(exactFile(root, path2));
function confirmed(confirm) {
  if (confirm !== true) fail2("AUTHORITY_REQUIRED", "confirm:true must explicitly acknowledge offline migration/recovery");
}
function stagingUnavailable() {
  fail2(
    "SCHEMA_MISMATCH",
    "schema 3/4 live stores are read-only; only explicit offline migration staging may write"
  );
}
function createLegacyMigrationStagingStore({ root, name, env = process.env }) {
  migrationManifest(root, [3], env);
  if (typeof name !== "string" || !new RegExp(`^${MIGRATIONS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/[0-9a-f-]{36}/staged\\.sqlite$`, "i").test(name)) {
    fail2("INVALID_INPUT", "legacy migration staging store must use its exact private migration path");
  }
  return openStore({ path: safePath(root, name), mode: "create" });
}
function privateWorkspace(root, admit = false) {
  const privacy = privateAdmission(root, { admit });
  if (privacy.errors.length) fail2("INVALID_INPUT", privacy.errors.join("; "));
  return privacy;
}
function finishStore(store) {
  const result = store.database.prepare("PRAGMA wal_checkpoint(TRUNCATE)").get();
  if (result.busy) fail2("STORE_BUSY", "staged WAL checkpoint is busy");
  closeStore(store);
}
function assertOffline(root) {
  const activity = read(root);
  if (activity.skipped) fail2("RECOVERY_REQUIRED", "malformed legacy activity prevents proving offline state");
  if (runs(activity.records, Date.now()).some((r) => r.open)) fail2("RECOVERY_REQUIRED", "active/unreconciled legacy run prevents offline migration");
}
function assertNoDatabase(root) {
  for (const name of [DATABASE, `${DATABASE}-wal`, `${DATABASE}-shm`, `${DATABASE}-journal`]) {
    if (existsSync2(safePath(root, name))) fail2("RECOVERY_REQUIRED", "existing or incomplete migration database requires explicit recovery; never copy a live WAL/main file");
  }
}
function receiptFor(root, plan) {
  return {
    id: plan.id,
    activated: true,
    backupPath: safePath(root, `${plan.directory}/backup`),
    sourceCount: plan.files.length,
    databasePath: safePath(root, DATABASE),
    privateAdmission: plan.privateAdmission
  };
}
function vacant(root, name) {
  if (existsSync2(safePath(root, name))) fail2("RECOVERY_REQUIRED", `unexpected existing migration target: ${name}`);
}
function verifyBackup(root, plan) {
  if (plan.schema_version !== 1 || !/^[0-9a-f-]{36}$/.test(plan.id) || plan.directory !== `${MIGRATIONS}/${plan.id}` || !Array.isArray(plan.files)) fail2("RECOVERY_REQUIRED", "invalid migration plan");
  const seen = /* @__PURE__ */ new Set();
  for (const entry of plan.files) {
    if (!entry || typeof entry.path !== "string" || seen.has(entry.path)) fail2("RECOVERY_REQUIRED", "invalid backup inventory");
    seen.add(entry.path);
    const file = fileFingerprint(root, `${plan.directory}/backup/${entry.path}`);
    if (file.size !== entry.size || file.digest !== entry.digest) fail2("RECOVERY_REQUIRED", `tampered migration backup: ${entry.path}`);
  }
  const original = exactFile(root, `${plan.directory}/backup/.kai/manifest.json`);
  if (hash(original) !== plan.originalManifestDigest) fail2("RECOVERY_REQUIRED", "migration manifest backup mismatch");
}
function readyPlan(root, directory) {
  const planBytes = exactFile(root, `${directory}/plan.json`);
  const plan = JSON.parse(planBytes);
  if (plan.directory !== directory) fail2("RECOVERY_REQUIRED", "migration directory mismatch");
  const ready = json(root, `${directory}/ready.json`);
  if (ready.planDigest !== hash(planBytes) || ready.id !== plan.id) fail2("RECOVERY_REQUIRED", "migration plan/ready identity mismatch");
  verifyBackup(root, plan);
  return { plan, ready };
}
function validateStagedStore(root, plan, ready, name) {
  const store = openStore({ path: safePath(root, name), mode: "read" });
  try {
    if (!canRollback(store) || logicalStoreDigest(store) !== ready.stateDigest) fail2("RECOVERY_REQUIRED", "staged store changed or contains new runtime work");
    for (const row of store.database.prepare("SELECT kind,id FROM records").all()) readRecord(store, row.kind, row.id);
    const identity = JSON.parse(store.database.prepare("SELECT value FROM metadata WHERE key='migration'").get().value);
    if (identity.id !== plan.id || identity.root !== resolve(root) || identity.workspaceId !== plan.workspaceId) {
      fail2("RECOVERY_REQUIRED", "staged store belongs to another workspace/migration");
    }
  } finally {
    closeStore(store);
  }
}
function activatedManifestBytes(root, plan) {
  const original = JSON.parse(exactFile(root, `${plan.directory}/backup/.kai/manifest.json`));
  return Buffer.from(`${JSON.stringify({ ...original, schema_version: 4, coordination_migration: {
    id: plan.id,
    directory: plan.directory,
    readyDigest: hash(exactFile(root, `${plan.directory}/ready.json`))
  } }, null, 2)}
`);
}
function activate(root, plan, ready, env) {
  migrationManifest(root, [3], env);
  privateWorkspace(root);
  assertOffline(root);
  verifyBackup(root, plan);
  const retained = readyPlan(root, plan.directory);
  if (canonicalJson(retained.plan) !== canonicalJson(plan) || canonicalJson(retained.ready) !== canonicalJson(ready)) {
    fail2("RECOVERY_REQUIRED", "migration plan or ready state changed before activation");
  }
  sameSnapshot(plan.files, sourceSnapshot(root));
  const staged = `${plan.directory}/staged.sqlite`;
  if (!existsSync2(safePath(root, DATABASE))) {
    assertNoDatabase(root);
    validateStagedStore(root, plan, ready, staged);
    vacant(root, DATABASE);
    renameSync(safePath(root, staged), safePath(root, DATABASE));
  } else {
    if (existsSync2(safePath(root, staged))) fail2("RECOVERY_REQUIRED", "both staged and final databases exist; cannot choose authority");
    validateStagedStore(root, plan, ready, DATABASE);
  }
  sameSnapshot(plan.files, sourceSnapshot(root));
  verifyBackup(root, plan);
  const bytes = activatedManifestBytes(root, plan);
  const stageManifest = `${plan.directory}/manifest-4.json`;
  if (existsSync2(safePath(root, stageManifest))) {
    if (!exactFile(root, stageManifest).equals(bytes)) fail2("RECOVERY_REQUIRED", "unexpected changed manifest stage");
  } else exclusiveFile(root, stageManifest, bytes);
  sameSnapshot(plan.files, sourceSnapshot(root));
  renameSync(safePath(root, stageManifest), safePath(root, ".kai/manifest.json"));
  return receiptFor(root, plan);
}
function releaseLock(root, expected) {
  if (!exactFile(root, LOCK).equals(Buffer.from(expected))) fail2("RECOVERY_REQUIRED", "migration lock changed; refusing removal");
  unlinkSync(safePath(root, LOCK));
}
function migrateWorkspace({ root, confirm, roles = [], env = process.env } = {}) {
  confirmed(confirm);
  const manifest = migrationManifest(root, [3], env);
  if (!Array.isArray(roles) || roles.some((r) => typeof r !== "string")) fail2("INVALID_INPUT", "installed role identities must be supplied");
  if (inFlight.has(root) || existsSync2(safePath(root, LOCK))) fail2("RECOVERY_REQUIRED", "incomplete or competing migration; inspect and explicitly recover");
  const privacy = privateWorkspace(root, true);
  assertNoDatabase(root);
  assertOffline(root);
  const id = randomUUID();
  const directory = `${MIGRATIONS}/${id}`;
  const lockBytes = canonicalJson({ id, directory, pid: process.pid });
  exclusiveFile(root, LOCK, lockBytes);
  inFlight.add(root);
  let store;
  try {
    const files = sourceSnapshot(root);
    const sources = parseLegacySources(root, files, roles);
    mkdirSync(safePath(root, MIGRATIONS), { recursive: true });
    mkdirSync(safePath(root, directory), { recursive: false });
    const plan = {
      schema_version: 1,
      id,
      directory,
      workspaceId: manifest.workspace_id,
      root: resolve(root),
      files,
      privateAdmission: privacy.admitted,
      originalManifestDigest: hash(exactFile(root, ".kai/manifest.json"))
    };
    exclusiveFile(root, `${directory}/plan.json`, canonicalJson(plan));
    for (const file of files) {
      const target = safePath(root, `${directory}/backup/${file.path}`);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(safePath(root, file.path), target, constants.COPYFILE_EXCL);
      const fd = openSync(target, "r+");
      try {
        fsyncSync(fd);
      } finally {
        closeSync(fd);
      }
      chmodSync(target, 256);
    }
    verifyBackup(root, plan);
    sameSnapshot(files, sourceSnapshot(root));
    exclusiveFile(root, `${directory}/staged.sqlite`, Buffer.alloc(0));
    store = createLegacyMigrationStagingStore({
      root,
      name: `${directory}/staged.sqlite`,
      env
    });
    store.database.exec(`BEGIN IMMEDIATE;
      CREATE TABLE legacy_sources (
        source_id TEXT PRIMARY KEY, path TEXT NOT NULL UNIQUE, digest TEXT NOT NULL,
        kind TEXT NOT NULL, declared_id TEXT, size INTEGER NOT NULL, backup_path TEXT NOT NULL, parsed TEXT NOT NULL,
        issues TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL
      );`);
    const insert = store.database.prepare("INSERT INTO legacy_sources VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    for (const source of sources) {
      insert.run(
        source.sourceId,
        source.path,
        source.digest,
        source.kind,
        source.declaredId,
        source.size,
        `${directory}/backup/${source.path}`,
        JSON.stringify(source.parsed),
        canonicalJson(source.issues),
        source.status,
        source.version
      );
      if (source.status === "converted") {
        const r = source.record;
        store.database.prepare(`
          INSERT INTO records (kind, id, subject_kind, subject_id, version, body)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          r.kind,
          r.id,
          r.subject?.kind ?? null,
          r.subject?.id ?? null,
          r.version,
          canonicalJson(r.body)
        );
      }
    }
    store.database.prepare(`
      INSERT INTO events(operation_id, subject_kind, subject_id, payload)
      VALUES (?, NULL, NULL, ?)
    `).run(
      id,
      canonicalJson({
        kind: "workspace.migrate",
        actor: null,
        sourceSchema: 3,
        migrationId: id,
        sourceCount: sources.length,
        provenance: "legacy-declared",
        timestamp: null
      })
    );
    store.database.prepare("INSERT INTO metadata VALUES (?,?)").run(
      "migration",
      canonicalJson({ id, root: resolve(root), workspaceId: manifest.workspace_id, directory })
    );
    const stateDigest = logicalStoreDigest(store);
    store.database.prepare("INSERT INTO metadata VALUES (?,?)").run("migration_baseline", stateDigest);
    store.database.exec("COMMIT");
    finishStore(store);
    const ready = { id, planDigest: hash(exactFile(root, `${directory}/plan.json`)), stateDigest };
    exclusiveFile(root, `${directory}/ready.json`, canonicalJson(ready));
    const receipt = activate(root, plan, ready, env);
    releaseLock(root, lockBytes);
    return receipt;
  } finally {
    closeStore(store);
    inFlight.delete(root);
  }
}
function canRollback(store) {
  return readSnapshot(store, () => {
    const baseline = store.database.prepare("SELECT value FROM metadata WHERE key='migration_baseline'").get();
    return !!baseline && logicalStoreDigest(store) === baseline.value;
  });
}
function recoverMigration({ root, confirm, action, env = process.env } = {}) {
  confirmed(confirm);
  migrationManifest(root, [3, 4], env);
  if (!["activate", "abandon"].includes(action)) fail2("INVALID_INPUT", "recovery action must be activate or abandon");
  if (inFlight.has(root)) fail2("STORE_BUSY", "migration is active in this process");
  const lockBytes = exactFile(root, LOCK);
  const lock = JSON.parse(lockBytes);
  if (lock.directory !== `${MIGRATIONS}/${lock.id}` || !/^[0-9a-f-]{36}$/.test(lock.id) || !Number.isSafeInteger(lock.pid) || lock.pid < 1) fail2("RECOVERY_REQUIRED", "unrecognized migration lock");
  if (lock.pid !== process.pid) {
    try {
      process.kill(lock.pid, 0);
      fail2("STORE_BUSY", "migration owner process is still active");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
  const recoveryLock = `${lock.directory}/recovery.lock`;
  exclusiveFile(root, recoveryLock, lockBytes);
  try {
    const m = migrationManifest(root, [3, 4], env);
    if (m.schema_version === 4) {
      const { plan: plan2 } = activePlan(root, m);
      if (plan2.id !== lock.id || action !== "activate") fail2("RECOVERY_REQUIRED", "activated migration requires rollback API");
      const { ready: ready2 } = readyPlan(root, lock.directory);
      validateStagedStore(root, plan2, ready2, DATABASE);
      releaseLock(root, lockBytes);
      return receiptFor(root, plan2);
    }
    if (action === "abandon") {
      if (existsSync2(safePath(root, DATABASE))) {
        const { plan: plan2, ready: ready2 } = readyPlan(root, lock.directory);
        validateStagedStore(root, plan2, ready2, DATABASE);
        vacant(root, `${lock.directory}/abandoned.sqlite`);
        renameSync(safePath(root, DATABASE), safePath(root, `${lock.directory}/abandoned.sqlite`));
      }
      releaseLock(root, lockBytes);
      return { id: lock.id, activated: false, abandoned: true, retainedPath: safePath(root, lock.directory) };
    }
    const { plan, ready } = readyPlan(root, lock.directory);
    const receipt = activate(root, plan, ready, env);
    releaseLock(root, lockBytes);
    return receipt;
  } finally {
    if (!exactFile(root, recoveryLock).equals(lockBytes)) fail2("RECOVERY_REQUIRED", "recovery lock changed; preserving it");
    unlinkSync(safePath(root, recoveryLock));
  }
}
function activePlan(root, manifest = migrationManifest(root, [4])) {
  const identity = manifest.coordination_migration;
  if (!identity || identity.directory !== `${MIGRATIONS}/${identity.id}`) fail2("RECOVERY_REQUIRED", "no recognized migration backup");
  const bytes = exactFile(root, `${identity.directory}/ready.json`);
  if (hash(bytes) !== identity.readyDigest) fail2("RECOVERY_REQUIRED", "changed migration receipt");
  const { plan, ready } = readyPlan(root, identity.directory);
  if (plan.id !== identity.id || plan.workspaceId !== manifest.workspace_id || plan.root !== resolve(root)) fail2("RECOVERY_REQUIRED", "migration workspace identity mismatch");
  return { plan, ready };
}
function verifyMigration(root, { env = process.env } = {}) {
  const { plan, ready } = activePlan(root, migrationManifest(root, [4], env));
  return { plan, ready };
}
function rollbackMigration({ root, confirm, env = process.env } = {}) {
  confirmed(confirm);
  const manifest = migrationManifest(root, [4], env);
  const { plan, ready } = activePlan(root, manifest);
  const activatedManifest = activatedManifestBytes(root, plan);
  if (!exactFile(root, ".kai/manifest.json").equals(activatedManifest)) fail2("RECOVERY_REQUIRED", "manifest changed after migration; rollback will not overwrite user edits");
  vacant(root, `${plan.directory}/rolled-back.sqlite`);
  if (existsSync2(safePath(root, LOCK))) fail2("RECOVERY_REQUIRED", "finish pending migration recovery first");
  const lockBytes = canonicalJson({ id: plan.id, directory: plan.directory, pid: process.pid, rollback: true });
  exclusiveFile(root, LOCK, lockBytes);
  let store;
  try {
    privateWorkspace(root);
    verifyBackup(root, plan);
    const live = sourceSnapshot(root).filter((e) => e.path !== ".kai/manifest.json");
    const original = plan.files.filter((e) => e.path !== ".kai/manifest.json");
    sameSnapshot(original, live);
    validateStagedStore(root, plan, ready, DATABASE);
    store = openStore({ path: safePath(root, DATABASE), mode: "write" });
    store.database.exec("BEGIN IMMEDIATE");
    if (!canRollbackInTransaction(store, ready)) fail2("RECOVERY_REQUIRED", "new runtime work prevents rollback");
    store.database.exec("COMMIT");
    finishStore(store);
    const bytes = exactFile(root, `${plan.directory}/backup/.kai/manifest.json`);
    const next = `${plan.directory}/rollback-manifest-${randomUUID()}.json`;
    exclusiveFile(root, next, bytes);
    sameSnapshot(original, sourceSnapshot(root).filter((e) => e.path !== ".kai/manifest.json"));
    if (!exactFile(root, ".kai/manifest.json").equals(activatedManifest)) fail2("RECOVERY_REQUIRED", "manifest changed during rollback");
    vacant(root, `${plan.directory}/rolled-back.sqlite`);
    renameSync(safePath(root, next), safePath(root, ".kai/manifest.json"));
    renameSync(safePath(root, DATABASE), safePath(root, `${plan.directory}/rolled-back.sqlite`));
    releaseLock(root, lockBytes);
    return { id: plan.id, rolledBack: true, backupPath: safePath(root, `${plan.directory}/backup`) };
  } catch (error) {
    if (store && !store.closed) {
      try {
        store.database.exec("ROLLBACK");
      } catch {
      }
    }
    if (migrationManifest(root, [3, 4], env).schema_version === 4) releaseLock(root, lockBytes);
    throw error;
  } finally {
    closeStore(store);
  }
}
function canRollbackInTransaction(store, ready) {
  return logicalStoreDigest(store) === ready.stateDigest;
}
function readLegacyRecords(store, { sourceId, includeRaw = false } = {}) {
  if (includeRaw && typeof sourceId !== "string") fail2("INVALID_INPUT", "raw legacy reads require a single sourceId");
  const migrated = store.database.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='migration_sources'"
  ).get();
  if (migrated) {
    let metadata;
    try {
      metadata = JSON.parse(store.database.prepare(
        "SELECT value FROM metadata WHERE key='migration_v5'"
      ).get()?.value ?? "null");
    } catch {
      fail2("EVIDENCE_GAP", "schema-5 migration provenance metadata is invalid");
    }
    if (!metadata || typeof metadata.backup_path !== "string" || typeof metadata.receipt_path !== "string" || !isAbsolute(metadata.backup_path) || resolve(metadata.receipt_path) !== resolve(metadata.backup_path, "receipt.json")) {
      fail2("EVIDENCE_GAP", "schema-5 migration provenance has an invalid external receipt binding");
    }
    const receiptPath = resolve(metadata.receipt_path);
    if (pathHasLink(dirname(receiptPath), receiptPath) || !exactPath(receiptPath)) {
      fail2("EVIDENCE_GAP", "schema-5 migration receipt is linked or aliased");
    }
    let receipt;
    try {
      receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
    } catch {
      fail2("EVIDENCE_GAP", "schema-5 migration receipt is missing or invalid");
    }
    let workspaceRoot2;
    try {
      workspaceRoot2 = workspaceRootFromCoordinationDatabase(store.path);
    } catch {
      fail2("EVIDENCE_GAP", "schema-5 migration provenance belongs to another store path");
    }
    if (receipt.activated !== true || receipt.digest !== metadata.receipt_digest || hash(canonicalJson(receipt.payload)) !== receipt.digest || typeof receipt.payload?.workspace_root !== "string" || !isAbsolute(receipt.payload.workspace_root) || canonicalPath(receipt.payload.workspace_root) !== canonicalPath(workspaceRoot2) || receipt.payload.backup_path !== metadata.backup_path) {
      fail2("EVIDENCE_GAP", "schema-5 migration receipt does not bind this workspace and backup");
    }
    const select2 = `SELECT source_id,path,digest,size,category,owner_hint,
      classification,backup_relative FROM migration_sources`;
    const rows2 = sourceId === void 0 ? store.database.prepare(`${select2} ORDER BY path`).all() : store.database.prepare(`${select2} WHERE source_id=?`).all(sourceId);
    return rows2.map((row) => {
      if (row.source_id !== hash(row.path) || row.backup_relative !== `private/${row.path}`) {
        fail2("EVIDENCE_GAP", "schema-5 migration source identity is invalid");
      }
      let classification;
      try {
        classification = JSON.parse(row.classification);
      } catch {
        fail2("EVIDENCE_GAP", "schema-5 migration source classification is invalid");
      }
      const source = {
        sourceId: row.source_id,
        path: row.path,
        digest: row.digest,
        kind: row.category,
        declaredId: null,
        size: row.size,
        backupPath: row.backup_relative,
        parsed: { ownerHint: row.owner_hint, classification },
        issues: [],
        status: classification.action === "migrate" ? "migrated" : "historical",
        version: 1
      };
      if (includeRaw) {
        const absolute = resolve(metadata.backup_path, ...row.backup_relative.split("/"));
        const rel = relative(canonicalPath(metadata.backup_path), canonicalPath(absolute));
        if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel) || pathHasLink(metadata.backup_path, absolute) || !exactPath(absolute)) {
          fail2("EVIDENCE_GAP", "schema-5 migration source backup escapes or aliases its verified root");
        }
        const stat = lstatSync(absolute);
        const raw = readFileSync(absolute);
        const after = lstatSync(absolute);
        if (!stat.isFile() || stat.nlink !== 1 || raw.length !== row.size || stat.dev !== after.dev || stat.ino !== after.ino || stat.size !== after.size || stat.mtimeMs !== after.mtimeMs || hash(raw) !== row.digest) {
          fail2("EVIDENCE_GAP", "schema-5 migration source backup size or digest changed");
        }
        source.raw = raw;
      }
      return source;
    });
  }
  const table = store.database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='legacy_sources'").get();
  if (!table) return [];
  const columns = store.database.prepare("PRAGMA table_info(legacy_sources)").all().map((c) => c.name);
  if (columns.includes("raw") || !columns.includes("backup_path") || !columns.includes("size")) {
    fail2("SCHEMA_MISMATCH", "legacy source storage requires external backup references; no automatic database rewrite is supported");
  }
  const select = "SELECT source_id,path,digest,kind,declared_id,size,backup_path,parsed,issues,status,version FROM legacy_sources";
  const rows = sourceId === void 0 ? store.database.prepare(`${select} ORDER BY path`).all() : store.database.prepare(`${select} WHERE source_id=?`).all(sourceId);
  return rows.map((r) => {
    const source = {
      sourceId: r.source_id,
      path: r.path,
      digest: r.digest,
      kind: r.kind,
      declaredId: r.declared_id,
      size: r.size,
      backupPath: r.backup_path,
      parsed: JSON.parse(r.parsed),
      issues: JSON.parse(r.issues),
      status: r.status,
      version: r.version
    };
    if (includeRaw) {
      const identity = JSON.parse(store.database.prepare("SELECT value FROM metadata WHERE key='migration'").get().value);
      if (source.backupPath !== `${MIGRATIONS}/${identity.id}/backup/${source.path}` || identity.directory !== `${MIGRATIONS}/${identity.id}` || source.sourceId !== hash(source.path)) fail2("EVIDENCE_GAP", "invalid legacy backup reference");
      const root = identity.root;
      const canonical = safePath(root, DATABASE);
      const retained = ["staged.sqlite", "rolled-back.sqlite", "abandoned.sqlite"].map((n) => safePath(root, `${identity.directory}/${n}`));
      if (![canonical, ...retained].includes(resolve(store.path))) fail2("EVIDENCE_GAP", "legacy backup belongs to another store/root");
      source.raw = exactFile(root, source.backupPath);
      if (source.raw.length !== source.size || hash(source.raw) !== source.digest) fail2("EVIDENCE_GAP", "legacy backup size/digest changed");
    }
    return source;
  });
}
function bindMigrationRepair(store, { root, roles, verify } = {}) {
  stagingUnavailable();
  migrationManifest(root, [4]);
  if (store.closed || store.mode === "read" || resolve(store.path) !== safePath(root, DATABASE) || !Array.isArray(roles) || typeof verify !== "function") fail2("AUTHORITY_REQUIRED", "repair requires explicit store/root and trusted host verifier");
  repairs.set(store, { root, roles: [...roles], verify });
}
function repairLegacyRecord(store, request) {
  stagingUnavailable();
  const binding = repairs.get(store);
  if (!binding || store.closed) fail2("AUTHORITY_REQUIRED", "bind a trusted host repair verifier first");
  const input = JSON.parse(canonicalJson(request));
  assertExactKeys(input, /* @__PURE__ */ new Set(["operationId", "sourceId", "expectedVersion", "actor", "reason", "body"]), "legacy repair");
  validateActor(input.actor);
  if (!/^[0-9a-f-]{36}$/.test(input.operationId) || typeof input.reason !== "string" || !input.reason.trim()) fail2("INVALID_INPUT", "repair requires operation UUID and rationale");
  const digest2 = hash(canonicalJson(input));
  store.database.exec("BEGIN IMMEDIATE");
  try {
    assertWorkspaceWrite(store.path, { requirePrivate: true });
    migrationManifest(binding.root, [4]);
    const previous = store.database.prepare("SELECT * FROM operations WHERE id=?").get(input.operationId);
    if (previous) {
      if (previous.payload_digest !== digest2) fail2("OPERATION_CONFLICT", "repair operation reused with changed content");
      store.database.exec("COMMIT");
      return JSON.parse(previous.receipt);
    }
    const source = readLegacyRecords(store, { sourceId: input.sourceId, includeRaw: true })[0];
    if (!source || source.status !== "quarantined" || source.version !== input.expectedVersion) fail2("VERSION_CONFLICT", "quarantine source missing, changed or already repaired");
    if (!source.declaredId || !["item", "initiative"].includes(source.kind)) fail2("INVALID_INPUT", "only records with a declared original identity can be revalidated");
    if (hash(source.raw) !== source.digest) fail2("EVIDENCE_GAP", "legacy source bytes changed; cannot revalidate unverified history");
    const history = source.parsed;
    const fields = history.fields ?? {};
    const lifecycle = fields[source.kind === "initiative" ? "status" : "state"];
    if (history.metadataSupported !== true || history.identityUnresolved || history.lifecycleAmbiguous || isNull(lifecycle) || fields.state !== void 0 && fields.status !== void 0 && fields.state !== fields.status) {
      fail2("INVALID_INPUT", "ambiguous or unsupported source history requires offline reconciliation, not partial repair");
    }
    if (history.terminalHistory || [fields.state, fields.status].some((state) => TERMINAL.has(state) || state === "archived")) {
      fail2("INVALID_INPUT", "historical completed/shipped work cannot be reopened");
    }
    if (source.path.startsWith(".kai/archive/") || source.parsed.terminalMilestones) {
      fail2("INVALID_INPUT", "historical archived work or terminal milestones cannot be reopened");
    }
    if (readLegacyRecords(store).filter((s) => s.kind === source.kind && s.declaredId === source.declaredId).length !== 1) fail2("INVALID_INPUT", "duplicate declared identity requires explicit source reconciliation");
    if (readRecord(store, source.kind, source.declaredId)) fail2("VERSION_CONFLICT", "runtime record already exists");
    const originalVersion = source.parsed.fields?.version ?? (source.kind === "initiative" ? "1" : null);
    if (typeof originalVersion !== "string" || !/^[1-9]\d*$/.test(originalVersion) || !Number.isSafeInteger(Number(originalVersion))) {
      fail2("INVALID_INPUT", "unknown or unsupported original version history cannot be revalidated");
    }
    const record = validateRecord({
      kind: source.kind,
      id: source.declaredId,
      subject: source.kind === "item" ? { kind: "item", id: source.declaredId } : null,
      version: Number(originalVersion),
      body: input.body
    });
    if (record.kind === "item") {
      const b = record.body;
      if (b.state !== "proposed" || b.lease !== null || b.change_ref !== null || b.producer_actor !== null || b.acceptance_actor !== null || b.producing_actors.length || b.waiting_on_questions.length || b.recovery_hold !== null) {
        fail2("INVALID_INPUT", "revalidation starts proposed scope, never historical production or acceptance");
      }
      for (const role of [b.scope_authority, b.completion_authority, b.next_role, ...b.review_requirements.map((r) => r.role)].filter(Boolean)) {
        if (!roleKnown(role, binding.roles)) fail2("ROLE_UNAVAILABLE", `unavailable repair role: ${role}`);
      }
      if (!readRecord(store, "initiative", b.initiative) || b.depends_on.some((d) => !readRecord(store, "item", d.item))) fail2("EVIDENCE_GAP", "repair has unresolved initiative/dependencies");
      captureInputBasis({ root: binding.root }, { get: (kind, id) => readRecord(store, kind, id) }, b.context_artifacts);
      for (const path2 of b.artifact_targets) assertWorkspacePath(binding.root, path2);
    } else if (!["proposed", "active", "paused"].includes(record.body.status) || !roleKnown(record.body.owner, binding.roles) || record.body.milestones.some((m) => TERMINAL.has(m.status))) {
      fail2("INVALID_INPUT", "initiative repair cannot fabricate closure or an unavailable owner");
    } else {
      exactBytes(binding.root, record.body.north_star_ref);
      for (const id of [
        ...record.body.milestones.flatMap((m) => m.required_items),
        ...record.body.backlog.map((b) => b.item_id).filter(Boolean)
      ]) {
        if (!readRecord(store, "item", id)) fail2("EVIDENCE_GAP", "initiative repair has an unresolved item reference");
      }
    }
    if (!roleKnown(input.actor.role, binding.roles) || binding.verify({ request: input, source, record }) !== true) fail2("AUTHORITY_REQUIRED", "explicit repair/revalidation decision not verified by host");
    migrationManifest(binding.root, [4]);
    assertWorkspaceWrite(store.path, { requirePrivate: true });
    store.database.prepare(`
      INSERT INTO records (kind, id, subject_kind, subject_id, version, body)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      record.kind,
      record.id,
      record.subject?.kind ?? null,
      record.subject?.id ?? null,
      record.version,
      canonicalJson(record.body)
    );
    store.database.prepare("UPDATE legacy_sources SET status='revalidated',version=version+1 WHERE source_id=?").run(source.sourceId);
    const eventSubject = record.kind === "item" ? { kind: "item", id: record.id } : record.subject;
    const event = store.database.prepare(`
      INSERT INTO events(operation_id, subject_kind, subject_id, payload)
      VALUES (?, ?, ?, ?)
    `).run(
      input.operationId,
      eventSubject?.kind ?? null,
      eventSubject?.id ?? null,
      canonicalJson({
        kind: "legacy.revalidate",
        actor: input.actor,
        sourceId: source.sourceId,
        sourceDigest: source.digest,
        sourcePath: source.path,
        sourceSize: source.size,
        sourceBackupPath: source.backupPath,
        reason: input.reason,
        recordKind: record.kind,
        recordId: record.id,
        body: record.body
      })
    );
    const receipt = { ok: true, operationId: input.operationId, recordVersion: record.version, eventSeq: Number(event.lastInsertRowid), data: { record } };
    store.database.prepare("INSERT INTO operations VALUES(?,?,?)").run(input.operationId, digest2, canonicalJson(receipt));
    store.database.exec("COMMIT");
    return receipt;
  } catch (error) {
    store.database.exec("ROLLBACK");
    throw error;
  }
}

// src/core/lib/coordination-runtime/authority.mjs
function fail3(code, message) {
  throw new RuntimeError(code, message);
}
function sameActor(left, right) {
  return left?.role === right?.role && left?.runId === right?.runId;
}
function requireRoleAvailable(role, authority, label) {
  if (role !== "operator" && !authority.roles.includes(role)) {
    fail3("ROLE_UNAVAILABLE", `${label} role "${role}" is not available`);
  }
}
function requireActorAvailable(command, authority) {
  requireRoleAvailable(command.actor.role, authority, "actor");
}
function hostGrantMatches(grant, command, action) {
  return sameActor(grant.actor, command.actor) && grant.actions.includes(action) && grant.recordKind === command.recordKind && grant.recordId === command.recordId && grant.basisRef === `${command.recordKind}/${command.recordId}@${command.expectedVersion}`;
}
function hostGrantMatchesBasis(grant, command, action, basisRef) {
  return sameActor(grant.actor, command.actor) && grant.actions.includes(action) && grant.recordKind === command.recordKind && grant.recordId === command.recordId && grant.basisRef === basisRef;
}
function persistedGrantMatches(record, command, action) {
  const grant = record.body;
  return grant.status === "active" && sameActor(grant.actor, command.actor) && grant.actions.includes(action) && grant.record_kind === command.recordKind && grant.record_id === command.recordId && grant.lease_token === command.leaseToken && Date.parse(grant.expires_at) > Date.now();
}
function hasHostActionGrant(command, authority, action) {
  return authority.grants.some((grant) => hostGrantMatches(grant, command, action));
}
function hasHostActionGrantForBasis(command, authority, action, basisRef) {
  return authority.grants.some(
    (grant) => hostGrantMatchesBasis(grant, command, action, basisRef)
  );
}
function requireActionGrant(tx, command, authority, action) {
  const allowed = hasHostActionGrant(command, authority, action) || command.leaseToken !== null && tx.list("grant", { kind: "task", id: command.recordId }).some((record) => persistedGrantMatches(record, command, action));
  if (!allowed) {
    fail3(
      "AUTHORITY_REQUIRED",
      `${command.actor.role} lacks explicit ${action} authority for ${command.recordKind}/${command.recordId}`
    );
  }
}
function requireHostActionGrant(command, authority, action) {
  if (!hasHostActionGrant(command, authority, action)) {
    fail3(
      "AUTHORITY_REQUIRED",
      `${command.actor.role} lacks trusted host ${action} authority for ${command.recordKind}/${command.recordId}`
    );
  }
}
function requireNamedAuthority(tx, command, authority, action, role) {
  if (command.actor.role !== role) {
    fail3(
      "AUTHORITY_REQUIRED",
      `${action} requires declared authority "${role}", not "${command.actor.role}"`
    );
  }
  requireHostActionGrant(command, authority, action);
}
function requireAnyNamedAuthority(tx, command, authority, action, roles) {
  const allowed = [...new Set(roles)];
  if (!allowed.includes(command.actor.role)) {
    fail3(
      "AUTHORITY_REQUIRED",
      `${action} requires one of the declared authorities ${allowed.map((role) => `"${role}"`).join(", ")}, not "${command.actor.role}"`
    );
  }
  requireHostActionGrant(command, authority, action);
}
function leaseIsLive(lease2) {
  return lease2 !== null && Date.parse(lease2.expires_at) > Date.now();
}
function requireLease(task, command) {
  if (task.body.lease !== null && !leaseIsLive(task.body.lease)) {
    fail3("RECOVERY_REQUIRED", `task/${task.id} lease expired and must be reconciled`);
  }
  if (task.body.lease === null || !sameActor(task.body.lease.holder, command.actor) || task.body.lease.token !== command.leaseToken) {
    fail3("LEASE_CONFLICT", `command does not hold the current lease for task/${task.id}`);
  }
}
function requireLeasedActingAuthority(tx, task, command, authority, action) {
  requireLease(task, command);
  requireActionGrant(tx, command, authority, action);
}
function requireActingAuthority(tx, task, command, authority, action) {
  if (task.body.lease === null) {
    requireHostActionGrant(command, authority, action);
    return;
  }
  requireLeasedActingAuthority(tx, task, command, authority, action);
}

// src/core/lib/coordination-runtime/hierarchy-engine.mjs
import { basename as basename2, posix as path } from "node:path";
var PARENT_CONFIG = Object.freeze({
  epic: {
    childKind: "feature",
    requiredField: "required_features",
    optionalField: "optional_features",
    successDisposition: "achieved",
    childSuccessDisposition: "delivered"
  },
  feature: {
    childKind: "requirement",
    requiredField: "required_requirements",
    optionalField: "optional_requirements",
    successDisposition: "delivered",
    childSuccessDisposition: "satisfied"
  },
  requirement: {
    childKind: "task",
    requiredField: "required_tasks",
    optionalField: "optional_tasks",
    successDisposition: "satisfied",
    childSuccessDisposition: null
  }
});
var SCOPE_FIELDS = Object.freeze({
  epic: /* @__PURE__ */ new Set([
    "owner",
    "scope_authority",
    "completion_authority",
    "outcome",
    "acceptance",
    "direction_ref",
    "contribution",
    "scope_fit",
    "required_features",
    "optional_features"
  ]),
  feature: /* @__PURE__ */ new Set([
    "owner",
    "scope_authority",
    "completion_authority",
    "outcome",
    "acceptance",
    "required_requirements",
    "optional_requirements",
    "depends_on_features"
  ]),
  requirement: /* @__PURE__ */ new Set([
    "owner",
    "scope_authority",
    "completion_authority",
    "outcome",
    "acceptance",
    "required_tasks",
    "optional_tasks"
  ])
});
function fail4(code, message) {
  throw new RuntimeError(code, message);
}
function uniqueRecords(records) {
  const unique2 = /* @__PURE__ */ new Map();
  for (const record of records.filter(Boolean)) {
    unique2.set(`${record.kind}\0${record.id}`, record);
  }
  return [...unique2.values()];
}
function relationshipVersion(record, taskDisposition = null) {
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    state: record.body.state,
    disposition: record.kind === "task" ? taskDisposition ?? record.body.state : record.body.completion_disposition
  };
}
function relationshipVersions(records) {
  return uniqueRecords(records).map((record) => relationshipVersion(record)).sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
}
function directionBasis(direction) {
  return `direction:${direction.path}@${direction.hash}`;
}
function eventTime(command, nextBody) {
  return command.kind.endsWith(".create") ? nextBody.created_at : command.payload.at;
}
function eventReason(command) {
  if (typeof command.payload.reason === "string") return command.payload.reason;
  const action = command.kind.split(".")[1];
  if (action === "create") return "Created the governed parent proposal.";
  if (action === "update") return "Updated the governed parent record.";
  return `Accepted the governed parent ${action} decision.`;
}
function appendMutationEvent(tx, current, nextBody, command, related, { basisRefs = [], extra = {} } = {}) {
  const oldVersion = current?.version ?? 0;
  tx.appendEvent({
    kind: command.kind,
    actor: command.actor,
    at: eventTime(command, nextBody),
    reason: eventReason(command),
    recordKind: command.recordKind,
    recordId: command.recordId,
    oldVersion,
    newVersion: oldVersion + 1,
    changedFields: current === null ? Object.keys(nextBody).sort() : changedKeys(current.body, nextBody).sort(),
    basisRefs: [...new Set(basisRefs)],
    relationshipVersions: relationshipVersions(related),
    ...extra
  });
}
function workspaceRoot(store) {
  return workspaceRootFromCoordinationDatabase(store.path);
}
function configuredDirectionPath(project) {
  if (typeof project?.publication_root !== "string") return null;
  const publicationRoot = project.publication_root.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  return path.join(publicationRoot, basename2(directionPath()));
}
function projectIdForDirectionRef(manifest, directionRef) {
  if (!directionRef || typeof directionRef.path !== "string") {
    fail4("EVIDENCE_GAP", "Epic Direction reference must name a configured project path");
  }
  const matches = Array.isArray(manifest.projects) ? manifest.projects.filter(
    (project) => configuredDirectionPath(project) === directionRef.path
  ) : [];
  if (matches.length !== 1) {
    fail4(
      "EVIDENCE_GAP",
      `Epic Direction path "${directionRef.path}" must match exactly one configured project`
    );
  }
  if (typeof matches[0].id !== "string" || !matches[0].id.trim()) {
    fail4("EVIDENCE_GAP", "the configured project matching the Epic Direction path needs an id");
  }
  return matches[0].id;
}
function currentDirectionForStore(store, directionRef) {
  const root = workspaceRoot(store);
  const result = readWorkspaceManifest(root);
  if (!result.ok) {
    fail4("EVIDENCE_GAP", `current Direction cannot be resolved: ${result.reason}`);
  }
  try {
    const projectId = projectIdForDirectionRef(result.manifest, directionRef);
    return readDirection({
      workspaceRoot: root,
      manifest: result.manifest,
      projectId
    });
  } catch (error) {
    fail4("EVIDENCE_GAP", `current Direction cannot be resolved: ${error.message}`);
  }
}
function exactDirectionRef(direction) {
  return {
    path: direction.path,
    hash: direction.hash,
    goal: direction.goal
  };
}
function assertDirectionAligned(epic, direction) {
  if (canonicalJson(epic.body.direction_ref) !== canonicalJson(exactDirectionRef(direction))) {
    fail4(
      "EVIDENCE_GAP",
      `epic/${epic.id} is not aligned to the current runtime-computed Direction`
    );
  }
}
function hasStaleDirection(tx, record, resolveDirection) {
  try {
    const epic = epicAncestor(tx, record);
    const direction = resolveDirection(epic.body.direction_ref);
    return canonicalJson(epic.body.direction_ref) !== canonicalJson(exactDirectionRef(direction));
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "EVIDENCE_GAP") return false;
    throw error;
  }
}
function requireActive(record, label) {
  if (record.body.state !== "active") {
    fail4("EVIDENCE_GAP", `${label} must be active`);
  }
}
function requireNoHold(record, label) {
  if (record.body.hold !== null) {
    fail4("EVIDENCE_GAP", `${label} is under an effective hold`);
  }
}
function featureDependencyRecords(tx, feature, { requireDelivered = false } = {}) {
  const dependencies2 = [];
  for (const dependency of feature.body.depends_on_features) {
    const upstream = tx.get("feature", dependency.feature);
    if (!upstream) {
      fail4(
        "INVALID_INPUT",
        `feature/${feature.id} references a missing dependency ${dependency.feature}`
      );
    }
    if (requireDelivered && (upstream.body.state !== "completed" || upstream.body.completion_disposition !== "delivered")) {
      fail4(
        "EVIDENCE_GAP",
        `feature/${dependency.feature} must be completed with delivered`
      );
    }
    dependencies2.push(upstream);
  }
  return dependencies2;
}
function assertNoFeatureDependencyCycle(tx, candidate) {
  const features = new Map(tx.list("feature").map((record) => [record.id, record]));
  features.set(candidate.id, candidate);
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  function visit(id) {
    if (visiting.has(id)) {
      fail4("INVALID_INPUT", `feature dependency cycle detected at feature/${id}`);
    }
    if (visited.has(id)) return;
    const feature = features.get(id);
    if (!feature) return;
    visiting.add(id);
    for (const dependency of feature.body.depends_on_features) {
      if (!features.has(dependency.feature)) {
        fail4(
          "INVALID_INPUT",
          `feature/${feature.id} references a missing dependency ${dependency.feature}`
        );
      }
      visit(dependency.feature);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of features.keys()) visit(id);
}
function containsChild(parent, config, childId) {
  return parent.body[config.requiredField].includes(childId) || parent.body[config.optionalField].includes(childId);
}
function candidateLookup(tx, candidate) {
  return (kind, id) => kind === candidate.kind && id === candidate.id ? candidate : tx.get(kind, id);
}
function assertUniqueParentClaims(tx, parentKind, candidate) {
  const config = PARENT_CONFIG[parentKind];
  if (!config || parentKind === "requirement") return;
  const claims = /* @__PURE__ */ new Map();
  const parents = tx.list(parentKind).filter((record) => record.id !== candidate.id).concat(candidate);
  for (const parent of parents) {
    for (const childId of [
      ...parent.body[config.requiredField],
      ...parent.body[config.optionalField]
    ]) {
      const claimedBy = claims.get(childId);
      if (claimedBy && claimedBy !== parent.id) {
        fail4(
          "INVALID_INPUT",
          `${config.childKind}/${childId} must belong to exactly one ${parentKind}`
        );
      }
      claims.set(childId, parent.id);
    }
  }
}
function assertExistingChildrenAgree(tx, parent) {
  const config = PARENT_CONFIG[parent.kind];
  const listed = /* @__PURE__ */ new Set([
    ...parent.body[config.requiredField],
    ...parent.body[config.optionalField]
  ]);
  const related = [];
  if (parent.kind === "epic") {
    for (const child of tx.list("feature")) {
      if (child.body.epic_id === parent.id && !listed.has(child.id)) {
        fail4(
          "INVALID_INPUT",
          `feature/${child.id} must remain listed by epic/${parent.id}`
        );
      }
    }
    for (const id of listed) {
      const child = tx.get("feature", id);
      if (!child) continue;
      if (child.body.epic_id !== parent.id) {
        fail4(
          "INVALID_INPUT",
          `epic/${parent.id} references mismatched feature/${id}`
        );
      }
      related.push(child);
    }
  } else if (parent.kind === "feature") {
    for (const child of tx.list("requirement")) {
      if (child.body.feature_id === parent.id && !listed.has(child.id)) {
        fail4(
          "INVALID_INPUT",
          `requirement/${child.id} must remain listed by feature/${parent.id}`
        );
      }
    }
    for (const id of listed) {
      const child = tx.get("requirement", id);
      if (!child) continue;
      if (child.body.feature_id !== parent.id || child.body.pack !== parent.body.pack) {
        fail4(
          "INVALID_INPUT",
          `feature/${parent.id} references mismatched requirement/${id}`
        );
      }
      related.push(child);
    }
  } else {
    for (const child of tx.list("task")) {
      if (child.body.satisfies.includes(parent.id) && !listed.has(child.id)) {
        fail4(
          "INVALID_INPUT",
          `task/${child.id} must remain listed by requirement/${parent.id}`
        );
      }
    }
    for (const id of listed) {
      const child = tx.get("task", id);
      if (!child) continue;
      if (child.body.feature_id !== parent.body.feature_id || !child.body.satisfies.includes(parent.id)) {
        fail4(
          "INVALID_INPUT",
          `requirement/${parent.id} references mismatched task/${id}`
        );
      }
      related.push(child);
    }
  }
  return related;
}
function assertParentRelationships(tx, candidate) {
  validateHierarchyRecord(candidate, candidateLookup(tx, candidate));
  assertUniqueParentClaims(tx, candidate.kind, candidate);
  const related = assertExistingChildrenAgree(tx, candidate);
  if (candidate.kind === "feature") {
    assertNoFeatureDependencyCycle(tx, candidate);
    related.push(...featureDependencyRecords(tx, candidate));
    const epic = tx.get("epic", candidate.body.epic_id);
    if (!epic || !containsChild(epic, PARENT_CONFIG.epic, candidate.id)) {
      fail4(
        "INVALID_INPUT",
        `feature/${candidate.id} must appear in epic/${candidate.body.epic_id}`
      );
    }
    related.push(epic);
  } else if (candidate.kind === "requirement") {
    const feature = tx.get("feature", candidate.body.feature_id);
    if (!feature || !containsChild(feature, PARENT_CONFIG.feature, candidate.id)) {
      fail4(
        "INVALID_INPUT",
        `requirement/${candidate.id} must appear in feature/${candidate.body.feature_id}`
      );
    }
    related.push(feature);
  }
  return uniqueRecords(related);
}
function requireKnownParentRoles(body, authority) {
  for (const [label, role] of [
    ["owner", body.owner],
    ["scope authority", body.scope_authority],
    ["completion authority", body.completion_authority]
  ]) {
    requireRoleAvailable(role, authority, label);
  }
}
function requireAllowedAuthority(command, authority, roles, message) {
  if (!roles.includes(command.actor.role)) {
    fail4("AUTHORITY_REQUIRED", message);
  }
  requireHostActionGrant(command, authority, command.kind);
}
function parentContext(tx, record) {
  if (record.kind === "epic") return [];
  if (record.kind === "feature") {
    return [tx.get("epic", record.body.epic_id)].filter(Boolean);
  }
  return [tx.get("feature", record.body.feature_id)].filter(Boolean);
}
function epicAncestor(tx, record) {
  if (record.kind === "epic") return record;
  const feature = record.kind === "feature" ? record : tx.get("feature", record.body.feature_id);
  if (!feature) {
    fail4("EVIDENCE_GAP", `${record.kind}/${record.id} has no current Feature ancestor`);
  }
  const epic = tx.get("epic", feature.body.epic_id);
  if (!epic) {
    fail4("EVIDENCE_GAP", `feature/${feature.id} has no current Epic ancestor`);
  }
  return epic;
}
function directionForRecord(tx, record, runtime) {
  const epic = epicAncestor(tx, record);
  return runtime.direction(epic.body.direction_ref);
}
function assertAlignedAncestors(tx, record, direction) {
  validateHierarchyRecord(record);
  if (record.kind === "epic") {
    assertDirectionAligned(record, direction);
    return [];
  }
  const feature = record.kind === "feature" ? record : tx.get("feature", record.body.feature_id);
  if (!feature) {
    fail4(
      "EVIDENCE_GAP",
      `${record.kind}/${record.id} has no current Feature ancestor`
    );
  }
  requireActive(feature, `feature/${feature.id}`);
  requireNoHold(feature, `feature/${feature.id}`);
  const epic = tx.get("epic", feature.body.epic_id);
  if (!epic) {
    fail4("EVIDENCE_GAP", `feature/${feature.id} has no current Epic ancestor`);
  }
  requireActive(epic, `epic/${epic.id}`);
  requireNoHold(epic, `epic/${epic.id}`);
  assertDirectionAligned(epic, direction);
  const related = [feature, epic, ...featureDependencyRecords(tx, feature, {
    requireDelivered: true
  })];
  if (record.kind === "requirement") {
    if (record.body.feature_id !== feature.id || !containsChild(feature, PARENT_CONFIG.feature, record.id)) {
      fail4(
        "INVALID_INPUT",
        `requirement/${record.id} does not match feature/${feature.id}`
      );
    }
    return uniqueRecords(related.filter((entry) => entry.id !== record.id));
  }
  if (record.kind === "task") {
    if (record.body.feature_id !== feature.id) {
      fail4("INVALID_INPUT", `task/${record.id} does not match feature/${feature.id}`);
    }
    for (const requirementId of record.body.satisfies) {
      const requirement = tx.get("requirement", requirementId);
      if (!requirement || requirement.body.feature_id !== feature.id || !containsChild(requirement, PARENT_CONFIG.requirement, record.id)) {
        fail4(
          "INVALID_INPUT",
          `task/${record.id} has an invalid Requirement relationship`
        );
      }
      requireActive(requirement, `requirement/${requirement.id}`);
      requireNoHold(requirement, `requirement/${requirement.id}`);
      related.push(requirement);
    }
    return uniqueRecords(related.filter((entry) => entry.id !== record.id));
  }
  return uniqueRecords(related.filter((entry) => entry.id !== record.id));
}
function taskTerminalState(task) {
  return task.body.delivery_class === "knowledge" ? "completed" : "shipped";
}
function closureChildIdentity(record) {
  if (record.kind !== "task") return record;
  return {
    ...record,
    body: {
      ...record.body,
      completion_disposition: record.body.state
    }
  };
}
function closureEligibility(tx, parent) {
  validateHierarchyRecord(parent);
  const config = PARENT_CONFIG[parent.kind];
  if (!config) fail4("INVALID_INPUT", `${parent.kind}/${parent.id} is not a parent record`);
  const requiredChildren = [];
  const related = [];
  const blockers = [];
  for (const id of parent.body[config.requiredField]) {
    const child = tx.get(config.childKind, id);
    if (!child) {
      blockers.push({
        kind: config.childKind,
        id,
        reason: `required ${config.childKind}/${id} is missing`
      });
      continue;
    }
    validateHierarchyRecord(child);
    requiredChildren.push(child);
    related.push(child);
    if (child.kind === "task") {
      const requiredState = taskTerminalState(child);
      if (child.body.state !== requiredState) {
        blockers.push({
          kind: child.kind,
          id: child.id,
          reason: `required task/${child.id} must reach terminal state ${requiredState}`
        });
      }
    } else if (child.body.state !== "completed" || child.body.completion_disposition !== config.childSuccessDisposition) {
      blockers.push({
        kind: child.kind,
        id: child.id,
        reason: `required ${child.kind}/${child.id} must complete with ${config.childSuccessDisposition}`
      });
    }
  }
  if (parent.kind === "feature") {
    for (const dependency of parent.body.depends_on_features) {
      const upstream = tx.get("feature", dependency.feature);
      if (!upstream) {
        blockers.push({
          kind: "feature",
          id: dependency.feature,
          reason: `dependency feature/${dependency.feature} is missing`
        });
        continue;
      }
      validateHierarchyRecord(upstream);
      related.push(upstream);
      if (upstream.body.state !== "completed" || upstream.body.completion_disposition !== "delivered") {
        blockers.push({
          kind: "feature",
          id: upstream.id,
          reason: `dependency feature/${upstream.id} must complete with delivered`
        });
      }
    }
  }
  const eligible = blockers.length === 0;
  const targetParent = {
    ...parent,
    version: parent.body.state === "completed" ? parent.version : parent.version + 1,
    body: {
      ...parent.body,
      state: "completed",
      completion_disposition: config.successDisposition
    }
  };
  return {
    eligible,
    blockers,
    requiredChildren,
    relationshipVersions: uniqueRecords(related).map((record) => relationshipVersion(record)).sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id)),
    closureRef: eligible ? parentClosureRef(
      targetParent,
      requiredChildren.map(closureChildIdentity)
    ) : null
  };
}
function createCandidate(command) {
  return {
    kind: command.recordKind,
    id: command.recordId,
    subject: null,
    version: 1,
    body: command.payload.body
  };
}
function updateCandidate(current, body) {
  return { ...current, version: current.version + 1, body };
}
function requireProposalBody(body) {
  if (body.state !== "proposed" || body.completion_disposition !== null) {
    fail4("INVALID_INPUT", "new parent records must begin proposed without a completion disposition");
  }
  if (body.hold !== null) {
    fail4("INVALID_INPUT", "new parent proposals must record holds through the hold command");
  }
}
function handleEpicCreate(current, tx, command, authority, runtime) {
  if (current !== null) fail4("VERSION_CONFLICT", `epic/${command.recordId} exists`);
  const body = command.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  requireAllowedAuthority(
    command,
    authority,
    ["operator", body.scope_authority],
    "epic.create requires the operator or delegated Epic scope authority"
  );
  const direction = runtime.direction(body.direction_ref);
  const candidate = createCandidate(command);
  assertDirectionAligned(candidate, direction);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command, related, {
    basisRefs: [directionBasis(direction)]
  });
  return body;
}
function handleFeatureCreate(current, tx, command, authority) {
  if (current !== null) fail4("VERSION_CONFLICT", `feature/${command.recordId} exists`);
  const body = command.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  requireAllowedAuthority(
    command,
    authority,
    [body.owner, body.scope_authority],
    "feature.create requires the pack owner or delegated pack authority"
  );
  const epic = tx.get("epic", body.epic_id);
  if (!epic) fail4("EVIDENCE_GAP", `epic/${body.epic_id} does not exist`);
  requireActive(epic, `epic/${epic.id}`);
  const candidate = createCandidate(command);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command, related);
  return body;
}
function handleRequirementCreate(current, tx, command, authority) {
  if (current !== null) fail4("VERSION_CONFLICT", `requirement/${command.recordId} exists`);
  const body = command.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  const feature = tx.get("feature", body.feature_id);
  if (!feature) fail4("EVIDENCE_GAP", `feature/${body.feature_id} does not exist`);
  requireActive(feature, `feature/${feature.id}`);
  requireAllowedAuthority(
    command,
    authority,
    [feature.body.owner, feature.body.scope_authority],
    "requirement.create requires the Feature owner or delegated pack authority"
  );
  const candidate = createCandidate(command);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command, related);
  return body;
}
function requireParentUpdateAuthority(tx, current, command, authority, changes, runtime) {
  const changed = new Set(Object.keys(changes));
  const hasPriority = changed.delete("priority");
  const hasScope = [...changed].some((key) => SCOPE_FIELDS[current.kind].has(key));
  const hasDescription = [...changed].some((key) => key === "title");
  if (current.kind === "epic") {
    if (hasPriority) {
      if (command.actor.role === "operator") {
        requireHostActionGrant(command, authority, command.kind);
      } else {
        const direction = runtime.direction(current.body.direction_ref);
        if (!hasHostActionGrantForBasis(
          command,
          authority,
          command.kind,
          directionBasis(direction)
        )) {
          fail4(
            "AUTHORITY_REQUIRED",
            "Epic priority requires the operator or an explicit Current Goal steward grant"
          );
        }
      }
    }
    if (hasScope) {
      requireNamedAuthority(
        tx,
        command,
        authority,
        command.kind,
        current.body.scope_authority
      );
    }
  } else if (current.kind === "feature") {
    const epic = tx.get("epic", current.body.epic_id);
    if (!epic) fail4("EVIDENCE_GAP", `epic/${current.body.epic_id} does not exist`);
    if (hasPriority || hasScope) {
      requireAllowedAuthority(
        command,
        authority,
        [epic.body.owner],
        "Feature scope and priority require the Epic steward"
      );
    }
  } else {
    const feature = tx.get("feature", current.body.feature_id);
    if (!feature) fail4("EVIDENCE_GAP", `feature/${current.body.feature_id} does not exist`);
    if (hasPriority || hasScope) {
      requireAllowedAuthority(
        command,
        authority,
        [feature.body.owner],
        "Requirement scope and priority require the Feature owner"
      );
    }
  }
  if (hasDescription) {
    requireNamedAuthority(tx, command, authority, command.kind, current.body.owner);
  }
}
function handleParentUpdate(current, tx, command, authority, runtime) {
  if (current.body.state === "completed") {
    fail4("INVALID_INPUT", `${current.kind}/${current.id} is completed and immutable`);
  }
  const changes = command.payload.changes;
  requireParentUpdateAuthority(tx, current, command, authority, changes, runtime);
  const next = {
    ...current.body,
    ...changes,
    updated_at: command.payload.at
  };
  requireKnownParentRoles(next, authority);
  const candidate = updateCandidate(current, next);
  let basisRefs = [];
  if (current.kind === "epic" && Object.hasOwn(changes, "direction_ref")) {
    const direction = runtime.direction(candidate.body.direction_ref);
    assertDirectionAligned(candidate, direction);
    basisRefs = [directionBasis(direction)];
  }
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, current, next, command, related, { basisRefs });
  return next;
}
function activationAuthority(tx, current, command, authority) {
  if (current.kind === "epic") {
    requireAllowedAuthority(
      command,
      authority,
      [current.body.scope_authority],
      "Epic activation requires its scope authority"
    );
    return;
  }
  if (current.kind === "feature") {
    const epic = tx.get("epic", current.body.epic_id);
    if (!epic) fail4("EVIDENCE_GAP", `epic/${current.body.epic_id} does not exist`);
    requireAllowedAuthority(
      command,
      authority,
      [epic.body.owner],
      "Feature activation requires the Epic steward"
    );
    return;
  }
  const feature = tx.get("feature", current.body.feature_id);
  if (!feature) fail4("EVIDENCE_GAP", `feature/${current.body.feature_id} does not exist`);
  requireAllowedAuthority(
    command,
    authority,
    [feature.body.owner],
    "Requirement activation requires the Feature owner"
  );
}
function handleParentActivate(current, tx, command, authority, runtime) {
  if (current.body.state !== "proposed") {
    fail4("INVALID_INPUT", `${current.kind}.activate requires a proposed parent`);
  }
  requireNoHold(current, `${current.kind}/${current.id}`);
  requireKnownParentRoles(current.body, authority);
  activationAuthority(tx, current, command, authority);
  const next = {
    ...current.body,
    state: "active",
    updated_at: command.payload.at
  };
  const candidate = updateCandidate(current, next);
  const direction = directionForRecord(tx, candidate, runtime);
  const related = [
    ...assertParentRelationships(tx, candidate),
    ...assertAlignedAncestors(tx, candidate, direction)
  ];
  appendMutationEvent(tx, current, next, command, related, {
    basisRefs: [directionBasis(direction)]
  });
  return next;
}
function requireOwnerOrScope(current, command, authority) {
  requireAnyNamedAuthority(
    null,
    command,
    authority,
    command.kind,
    [current.body.owner, current.body.scope_authority]
  );
}
function handleParentHold(current, tx, command, authority) {
  if (current.body.state === "completed") {
    fail4("INVALID_INPUT", "completed parents cannot be placed on hold");
  }
  if (current.body.hold !== null) {
    fail4("INVALID_INPUT", `${current.kind}/${current.id} already has a hold`);
  }
  requireOwnerOrScope(current, command, authority);
  const next = {
    ...current.body,
    hold: {
      reason: command.payload.reason,
      set_by: command.actor,
      set_at: command.payload.at,
      release_condition: command.payload.releaseCondition,
      basis_refs: command.payload.basisRefs
    },
    updated_at: command.payload.at
  };
  appendMutationEvent(tx, current, next, command, parentContext(tx, current), {
    basisRefs: command.payload.basisRefs
  });
  return next;
}
function handleParentRelease(current, tx, command, authority) {
  if (current.body.state === "completed") {
    fail4("INVALID_INPUT", "completed parents cannot release holds");
  }
  if (current.body.hold === null) {
    fail4("INVALID_INPUT", `${current.kind}/${current.id} has no hold to release`);
  }
  if (command.payload.basisRefs.length === 0) {
    fail4("EVIDENCE_GAP", "hold release requires evidence basis references");
  }
  requireOwnerOrScope(current, command, authority);
  const next = {
    ...current.body,
    hold: null,
    updated_at: command.payload.at
  };
  appendMutationEvent(tx, current, next, command, parentContext(tx, current), {
    basisRefs: command.payload.basisRefs,
    extra: { releaseConditionMet: command.payload.conditionMet }
  });
  return next;
}
function handleParentComplete(current, tx, command, authority, runtime) {
  if (current.body.state !== "active") {
    fail4("INVALID_INPUT", `${current.kind}.complete requires an active parent`);
  }
  requireAllowedAuthority(
    command,
    authority,
    [current.body.completion_authority],
    `${current.kind}.complete requires its declared completion authority`
  );
  const config = PARENT_CONFIG[current.kind];
  const successful = command.payload.disposition === config.successDisposition;
  let related = parentContext(tx, current);
  let closureRef = null;
  let basisRefs = command.payload.basisRefs;
  if (successful) {
    requireNoHold(current, `${current.kind}/${current.id}`);
    const direction = directionForRecord(tx, current, runtime);
    related = [
      ...related,
      ...assertParentRelationships(tx, current),
      ...assertAlignedAncestors(tx, current, direction)
    ];
    basisRefs = [...basisRefs, directionBasis(direction)];
    const eligibility = closureEligibility(tx, current);
    if (!eligibility.eligible) {
      fail4("EVIDENCE_GAP", eligibility.blockers[0].reason);
    }
    closureRef = eligibility.closureRef;
    if (command.payload.closureRef !== closureRef) {
      fail4(
        "VERSION_CONFLICT",
        `${current.kind}/${current.id} closure reference does not match current child versions`
      );
    }
    related.push(...eligibility.requiredChildren);
    for (const version of eligibility.relationshipVersions) {
      const record = tx.get(version.kind, version.id);
      if (record) related.push(record);
    }
  } else if (Object.hasOwn(command.payload, "closureRef")) {
    fail4(
      "INVALID_INPUT",
      "cancelled and superseded completion must not claim a successful closure reference"
    );
  }
  const next = {
    ...current.body,
    state: "completed",
    completion_disposition: command.payload.disposition,
    updated_at: command.payload.at
  };
  appendMutationEvent(tx, current, next, command, related, {
    basisRefs,
    extra: {
      closureRef,
      disposition: command.payload.disposition
    }
  });
  return next;
}
var parentHandlers = /* @__PURE__ */ new Map([
  ["epic.create", handleEpicCreate],
  ["epic.update", handleParentUpdate],
  ["epic.activate", handleParentActivate],
  ["epic.hold", handleParentHold],
  ["epic.release", handleParentRelease],
  ["epic.complete", handleParentComplete],
  ["feature.create", handleFeatureCreate],
  ["feature.update", handleParentUpdate],
  ["feature.activate", handleParentActivate],
  ["feature.hold", handleParentHold],
  ["feature.release", handleParentRelease],
  ["feature.complete", handleParentComplete],
  ["requirement.create", handleRequirementCreate],
  ["requirement.update", handleParentUpdate],
  ["requirement.activate", handleParentActivate],
  ["requirement.hold", handleParentHold],
  ["requirement.release", handleParentRelease],
  ["requirement.complete", handleParentComplete]
]);

// src/core/lib/coordination-runtime/evidence-context.mjs
import { isAbsolute as isAbsolute2, join } from "node:path";
var bindings = /* @__PURE__ */ new WeakMap();
var transactions = /* @__PURE__ */ new WeakMap();
var clone = (value) => JSON.parse(canonicalJson(value));
function bindEvidenceRuntime(store, options) {
  assertExactKeys(options, /* @__PURE__ */ new Set([
    "root",
    "authority",
    "runs",
    "verifyCapture",
    "verifyOperatorDecision"
  ]), "evidence runtime", /* @__PURE__ */ new Set(["root", "authority", "runs"]));
  const manifest = workspaceManifest(options.root);
  const database = manifest.schema_version === WORKSPACE_SCHEMA_VERSION ? COORDINATION_DATABASE : LEGACY_COORDINATION_DATABASE;
  if (!store || store.closed || !isAbsolute2(store.path) || normalized(store.path) !== normalized(join(options.root, ...database.split("/")))) {
    fail("INVALID_INPUT", "evidence workspace must be explicitly bound to this store");
  }
  assertWorkspacePath(options.root, database);
  validateAuthority(options.authority);
  if (!Array.isArray(options.runs)) fail("INVALID_INPUT", "approved run bindings must be an array");
  const actors = /* @__PURE__ */ new Set();
  const directories = /* @__PURE__ */ new Set();
  for (const run of options.runs) {
    assertExactKeys(run, /* @__PURE__ */ new Set(["actor", "directory"]), "approved run");
    validateActor(run.actor);
    const directory = durablePath(run.directory);
    let route;
    try {
      const parsed = parseTypedArtifactRoute(directory);
      [route] = parsed.routes;
      if (parsed.visibility !== "private" || parsed.routes.length !== 1 || route.members.length !== 0) {
        fail("INVALID_INPUT", "approved run directory must be one complete typed private artifact route");
      }
    } catch (error) {
      if (error?.code) throw error;
      fail("INVALID_INPUT", error.message);
    }
    if (directory !== run.directory || actors.has(canonicalJson(run.actor)) || directories.has(directory.toLowerCase())) {
      fail("INVALID_INPUT", "approved run directories must be unique typed private artifact paths");
    }
    assertWorkspacePath(options.root, `${directory}/.evidence/probe`);
    actors.add(canonicalJson(run.actor));
    directories.add(directory.toLowerCase());
  }
  for (const key of ["verifyCapture", "verifyOperatorDecision"]) {
    if (options[key] !== void 0 && typeof options[key] !== "function") {
      fail("INVALID_INPUT", `${key} must be a trusted host function`);
    }
  }
  bindings.set(store, {
    ...options,
    root: normalized(options.root),
    authority: clone(options.authority),
    runs: clone(options.runs)
  });
}
function bindEvidenceTransaction(store, tx) {
  transactions.set(tx, store);
  return tx;
}
function bindEvidenceReadView(tx, { root }) {
  workspaceManifest(root);
  bindings.set(tx, { root: normalized(root) });
  return tx;
}
function contextFor(storeOrTransaction) {
  const store = transactions.get(storeOrTransaction) ?? storeOrTransaction;
  const context = bindings.get(store);
  if (!context || store.closed) {
    fail("AUTHORITY_REQUIRED", "bind the explicit workspace and host authority before evidence operations or acceptance");
  }
  workspaceManifest(context.root);
  return context;
}

// src/core/lib/coordination-runtime/evidence-integrity.mjs
var contentEquals2 = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
var bindsSubject2 = (record, subject) => subjectEquals(record?.subject, subject);
var lookup = (tx) => (kind, id) => tx.get(kind, id);
var positiveEvidenceOutcomes = /* @__PURE__ */ new Set(["clear", "waived", "passed"]);
function hasPublicSafeExcerptPath(root, path2) {
  if (pathPrivacy(root, path2) === "public") return true;
  try {
    const parsed = parseTypedArtifactRoute(path2);
    return parsed.visibility === "private" && parsed.routes.length === 1 && parsed.routes[0].lifecycle === "drafts";
  } catch {
    return false;
  }
}
function requirePositiveEffectiveEvidence(effective, record) {
  const scoped = effective.filter((candidate) => evidenceScope(candidate) === evidenceScope(record));
  if (!effective.some((candidate) => candidate.evidence_id === record.evidence_id) || scoped.some((candidate) => !positiveEvidenceOutcomes.has(candidate.outcome))) {
    fail(
      "EVIDENCE_GAP",
      "superseded or negative evidence, including conflicting scoped evidence, cannot establish acceptance"
    );
  }
}
function hasPublicationHistory(asset) {
  return asset.history.some((h) => ["published", "retracted"].includes(h.disposition) || h.target.startsWith("project:") && !h.target.endsWith(":@git") && h.validity === "current");
}
function verifyAssetContent(context, tx, asset) {
  const artifact = tx.get("artifact", asset.artifact_id);
  if (!bindsSubject2(artifact, asset.subject)) fail("EVIDENCE_GAP", "asset has no registered artifact");
  verifyArtifact(context.root, artifact.body);
  verifyInputBasis(context, tx, artifact.body.input_basis ?? []);
  const initial = artifact.body.content_ref.kind === "sha256" ? artifact.body.content_ref.path : artifact.body.manifest_path ?? `project:${artifact.body.project_id}:@git`;
  if (asset.target !== initial || asset.history.some((h) => ["working", "published"].includes(h.disposition))) {
    verifyTarget(context.root, asset.target, artifact.body);
  }
  return artifact.body;
}
function verifyRegisteredArtifact(context, tx, record) {
  verifyInputBasis(context, tx, record.body.input_basis ?? []);
  const assets = tx.list("asset", record.subject).filter((asset) => asset.body.artifact_id === record.id);
  if (assets.length === 0) verifyArtifact(context.root, record.body);
  else assets.forEach((asset) => verifyAssetContent(context, tx, asset.body));
}
function parentReportArtifact(context, tx, parent, reference, approvalId = null) {
  const match = /^artifact:([0-9a-f-]+)$/i.exec(reference);
  if (!match) {
    fail("EVIDENCE_GAP", "parent completion proof must reference persisted report artifacts");
  }
  const artifact = tx.get("artifact", match[1]);
  if (!bindsSubject2(artifact, { kind: parent.kind, id: parent.id }) || artifact.body.classification !== "public" || !artifactBasisCurrent(context, tx, parent, artifact.body)) {
    fail("EVIDENCE_GAP", "parent completion report artifact is missing, stale, or not public");
  }
  const paths = artifact.body.content_ref.kind === "git" ? [] : artifact.body.content_ref.kind === "sha256" ? [artifact.body.content_ref.path] : artifact.body.content_ref.entries.map((entry) => entry.path);
  if (paths.some((path2) => !hasPublicSafeExcerptPath(context.root, path2))) {
    fail("EVIDENCE_GAP", "parent completion report artifact has no public safe-excerpt lane");
  }
  verifyRegisteredArtifact(context, tx, artifact);
  if (approvalId !== null) {
    const assets = tx.list("asset", artifact.subject).filter((record) => record.body.artifact_id === artifact.id && record.body.validity === "current" && !(/* @__PURE__ */ new Set(["scratch", "draft", "discarded", "retracted"])).has(record.body.disposition) && record.body.completion_approval_id === approvalId);
    if (assets.length !== 1 || assets[0].body.history.at(-1).at_subject_version !== parent.version) {
      fail(
        "EVIDENCE_GAP",
        "parent completion report artifact lacks one accepted current revision"
      );
    }
    verifyAssetContent(context, tx, assets[0].body);
  }
  return artifact.body;
}
function verifyParentCompletionEvidence(context, tx, parent, refs, { approvalId = null } = {}) {
  if (parent.kind === "task" || !Array.isArray(refs) || refs.length === 0 || refs.some((reference) => !/^artifact:([0-9a-f-]+)$/i.test(reference)) || new Set(refs).size !== refs.length) {
    fail("EVIDENCE_GAP", "parent completion requires exact accepted report artifact proof");
  }
  return refs.map((reference) => parentReportArtifact(context, tx, parent, reference, approvalId));
}
function verifyParentCompletionApproval(context, tx, parent, refs, { approvalId = null } = {}) {
  if (parent.kind === "task" || !Array.isArray(refs) || refs.length === 0 || new Set(refs).size !== refs.length) {
    fail("EVIDENCE_GAP", "parent completion approval requires persisted parent-completion evidence");
  }
  const evidenceRefs = refs.filter((reference) => /^evidence:([0-9a-f-]+)$/i.test(reference));
  const artifactRefs = refs.filter((reference) => /^artifact:([0-9a-f-]+)$/i.test(reference));
  if (evidenceRefs.length === 0 || artifactRefs.length === 0 || evidenceRefs.length + artifactRefs.length !== refs.length) {
    fail(
      "EVIDENCE_GAP",
      "parent completion approval requires persisted evidence and explicit report artifacts"
    );
  }
  const effective = effectiveEvidence(
    tx.list("evidence", { kind: parent.kind, id: parent.id }).map((record) => record.body),
    parent,
    lookup(tx)
  );
  const evidenceArtifacts = /* @__PURE__ */ new Set();
  for (const reference of evidenceRefs) {
    const id = reference.slice("evidence:".length);
    const record = tx.get("evidence", id);
    if (!record || !subjectEquals(record.subject, { kind: parent.kind, id: parent.id }) || record.body.kind !== "parent-completion" || record.body.outcome !== "passed" || record.body.provenance?.tier !== "observed" || !effective.some((candidate) => candidate.evidence_id === id)) {
      fail("EVIDENCE_GAP", "parent completion evidence is missing, stale, negative, or cross-subject");
    }
    requirePositiveEffectiveEvidence(effective, record.body);
    for (const artifact of verifyParentCompletionEvidence(
      context,
      tx,
      parent,
      record.body.evidence_refs,
      { approvalId }
    )) {
      evidenceArtifacts.add(artifact.artifact_id);
    }
  }
  for (const reference of artifactRefs) {
    const artifact = parentReportArtifact(context, tx, parent, reference, approvalId);
    if (!evidenceArtifacts.has(artifact.artifact_id)) {
      fail(
        "EVIDENCE_GAP",
        "explicitly accepted report artifact is not part of the parent completion evidence"
      );
    }
  }
  return artifactRefs.map((reference) => reference.slice("artifact:".length));
}
function artifactBasisCurrent(context, tx, item, artifact) {
  return artifact.criteria_ref === criteriaRef(item, lookup(tx)) && (item.body.context_artifacts ?? []).every((ref) => artifact.input_basis?.some((b) => b.reference === ref)) && inputBasisCurrent(context, tx, artifact.input_basis ?? []);
}
function subjectArtifact(context, tx, item, subject, acceptingActor = null) {
  if (item.kind !== "task") fail("INVALID_INPUT", "execution artifacts require a Task subject");
  const history = tx.list("artifact", { kind: "task", id: item.id }).filter((record) => contentEquals2(record.body.content_ref, subject));
  if (acceptingActor && (isProducingRun(item.body, acceptingActor) || history.some((record) => record.body.producer.runId === acceptingActor.runId))) {
    fail("AUTHORITY_REQUIRED", "a producing run cannot independently accept its exact subject");
  }
  const candidates = history.filter((record) => artifactBasisCurrent(context, tx, item, record.body));
  if (candidates.length === 0) fail("EVIDENCE_GAP", "exact current subject has no registered retained artifact");
  for (const candidate of candidates) verifyRegisteredArtifact(context, tx, candidate);
}
function verifyReferences(context, tx, item, refs, { recovery = false, positive = true } = {}) {
  const artifacts = [];
  const visit = (ref, seen) => {
    const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(ref);
    if (!match || seen.has(ref)) fail("EVIDENCE_GAP", "references must name registered acyclic artifact/evidence records");
    const [, kind, id] = match;
    const record = tx.get(kind, id);
    if (!bindsSubject2(record, { kind: item.kind, id: item.id })) {
      fail("EVIDENCE_GAP", "referenced evidence is missing or belongs to another hierarchy subject");
    }
    if (kind === "artifact") {
      if (!recovery && record.body.criteria_ref !== criteriaRef(item, lookup(tx))) {
        fail("EVIDENCE_GAP", "artifact criteria changed");
      }
      verifyRegisteredArtifact(context, tx, record);
      artifacts.push(record.body);
    } else {
      if (!recovery && !matchesAcceptance(record.body, item, lookup(tx))) fail("EVIDENCE_GAP", "referenced evidence is not current");
      if (!recovery && positive) {
        const effective = effectiveEvidence(
          tx.list("evidence", { kind: item.kind, id: item.id }).map((r) => r.body),
          item,
          lookup(tx)
        );
        requirePositiveEffectiveEvidence(effective, record.body);
      }
      record.body.evidence_refs.forEach((child) => visit(child, /* @__PURE__ */ new Set([...seen, ref])));
    }
  };
  refs.forEach((ref) => visit(ref, /* @__PURE__ */ new Set()));
  return artifacts;
}
function verifyVerdict(tx, item, verdict, actor = null) {
  const context = contextFor(tx);
  subjectArtifact(context, tx, item, verdict.content_ref, actor);
  verifyReferences(context, tx, item, [...verdict.evidence_refs, ...verdict.finding_refs ?? []]);
}

// src/core/lib/coordination-runtime/acceptance.mjs
function fail5(code, message) {
  throw new RuntimeError(code, message);
}
function taskOnly(record, action) {
  if (record.kind !== "task") fail5("INVALID_INPUT", `${action} requires a Task subject`);
}
function lookup2(tx) {
  return (kind, id) => tx.get(kind, id);
}
function bodies(tx, kind, record) {
  return tx.list(kind, { kind: record.kind, id: record.id }).map((entry) => entry.body);
}
function requireReviews(tx, item) {
  taskOnly(item, "review requirements");
  const reviews = effectiveReviews(bodies(tx, "review", item), item, lookup2(tx));
  for (const requirement of item.body.review_requirements) {
    const matching = reviews.filter((review) => review.reviewer.role === requirement.role && review.kind === requirement.kind);
    if (matching.length === 0) {
      fail5("EVIDENCE_GAP", `task/${item.id} lacks current ${requirement.role} ${requirement.kind} review`);
    }
    const independent = matching.filter((review) => !isProducingRun(item.body, review.reviewer));
    if (independent.length === 0) {
      fail5("AUTHORITY_REQUIRED", "a producing run cannot review its own subject");
    }
    if (independent.some((review) => review.verdict !== "approved")) {
      fail5("EVIDENCE_GAP", `task/${item.id} has an unresolved negative ${requirement.kind} review`);
    }
    if (requirement.kind === "product-design-acceptance" && (requirement.role !== item.body.completion_authority || item.body.producing_actors.some((actor) => actor.role === requirement.role))) {
      fail5("AUTHORITY_REQUIRED", "product-design acceptance requires an independent completion authority");
    }
    independent.forEach((review) => verifyVerdict(tx, item, review, review.reviewer));
  }
}
function completionApproval(tx, item) {
  const matching = effectiveApprovals(bodies(tx, "approval", item), item, lookup2(tx)).filter((approval) => approval.kind === "completion" && approval.authority.role === item.body.completion_authority);
  if (matching.length === 0) {
    fail5(
      "EVIDENCE_GAP",
      `${item.kind}/${item.id} lacks current completion-authority approval`
    );
  }
  if (item.kind !== "task") {
    if (matching.some((approval) => approval.decision !== "approved" || approval.recorded_at_subject_version !== item.version)) {
      fail5(
        "EVIDENCE_GAP",
        "an effective parent completion decision rejects or predates the current revision"
      );
    }
    const context = contextFor(tx);
    matching.forEach((approval) => verifyParentCompletionApproval(
      context,
      tx,
      item,
      approval.evidence_refs,
      { approvalId: approval.approval_id }
    ));
    return matching[0];
  }
  const independent = matching.filter((approval) => !isProducingRun(item.body, approval.authority));
  if (independent.length === 0) fail5("AUTHORITY_REQUIRED", "a producing run cannot accept its own work");
  if (independent.some((approval) => approval.decision !== "approved")) {
    fail5("EVIDENCE_GAP", "an effective completion decision rejects the current work");
  }
  independent.forEach((approval) => verifyVerdict(tx, item, approval, approval.authority));
  return independent[0];
}
function requireReleaseEvidence(tx, item) {
  taskOnly(item, "release evidence");
  const evidence = effectiveEvidence(bodies(tx, "evidence", item), item, lookup2(tx)).filter((record) => record.kind === "dod-dimension");
  for (const dimension of DOD_DIMENSIONS) {
    const matching = evidence.filter((record) => record.dimension === dimension);
    if (matching.length === 0 || matching.some((record) => record.outcome === "gap")) {
      fail5("EVIDENCE_GAP", `task/${item.id} lacks accepted ${dimension} evidence for its current criteria`);
    }
    matching.forEach((record) => verifyVerdict(tx, item, record));
  }
}
function requireOperatorApproval(tx, item, kind) {
  taskOnly(item, "deployment approval");
  const approvals = effectiveApprovals(bodies(tx, "approval", item), item, lookup2(tx)).filter((approval) => approval.kind === kind && approval.authority.role === "operator");
  if (approvals.length === 0 || approvals.some((approval) => approval.decision !== "approved")) {
    fail5("AUTHORITY_REQUIRED", `task/${item.id} lacks effective ${kind} operator confirmation`);
  }
  if (new Set(approvals.map((approval) => canonicalJson(approval.deployment))).size !== 1) {
    fail5("AUTHORITY_REQUIRED", "operator confirmations disagree about the production deployment");
  }
  approvals.forEach((approval) => verifyVerdict(tx, item, approval, approval.authority));
  return approvals[0];
}
function requireDeploymentEvidence(tx, item, kind) {
  taskOnly(item, "deployment evidence");
  const start = requireOperatorApproval(tx, item, "operator-deploy-start");
  const complete = requireOperatorApproval(tx, item, "operator-deploy-complete");
  if (canonicalJson(start.deployment) !== canonicalJson(complete.deployment)) {
    fail5("AUTHORITY_REQUIRED", "deployment completion does not match the confirmed production start");
  }
  const evidence = effectiveEvidence(bodies(tx, "evidence", item), item, lookup2(tx)).filter((record) => record.kind === kind && record.data.environment === start.deployment.environment && record.data.deployment_id === start.deployment.deployment_id);
  if (evidence.length === 0 || evidence.some((record) => record.outcome !== "passed")) {
    fail5("EVIDENCE_GAP", `task/${item.id} lacks passed ${kind} evidence for the confirmed production deployment`);
  }
  evidence.forEach((record) => verifyVerdict(tx, item, record));
}
function recoveryResolution(tx, item, approvalId) {
  taskOnly(item, "recovery resolution");
  const approvals = effectiveApprovals(bodies(tx, "approval", item), item, lookup2(tx)).filter((approval2) => approval2.kind === "operator-recovery-resolution" && approval2.authority.role === "operator");
  const approval = approvals.find((candidate) => candidate.approval_id === approvalId);
  const attempt = tx.get("attempt", item.body.recovery_hold);
  if (!approval || approvals.some((candidate) => candidate.decision !== "approved") || new Set(approvals.map((candidate) => canonicalJson(candidate.recovery))).size !== 1 || attempt?.subject?.kind !== "task" || attempt.subject.id !== item.id || attempt.body.disposition !== "conflicting-partial-work" || attempt.body.stale_lease.token !== approval.recovery.stale_lease_token) {
    fail5("AUTHORITY_REQUIRED", "conflicting partial work requires exact persisted operator resolution");
  }
  return approval;
}

// src/core/lib/coordination-runtime/task-engine.mjs
import { randomUUID as randomUUID2 } from "node:crypto";
var GRANTABLE_STATES = /* @__PURE__ */ new Set([
  "ready",
  "in-progress",
  "in-review",
  "release-ready",
  "deploying",
  "production-verification"
]);
var SHIP_STATES = /* @__PURE__ */ new Set([
  "release-ready",
  "deploying",
  "production-verification"
]);
var ALLOWED_TRANSITIONS = /* @__PURE__ */ new Map([
  ["proposed", /* @__PURE__ */ new Set(["dropped"])],
  ["ready", /* @__PURE__ */ new Set(["blocked", "dropped"])],
  ["in-progress", /* @__PURE__ */ new Set(["in-review", "blocked", "dropped"])],
  ["in-review", /* @__PURE__ */ new Set(["in-progress", "completed", "release-ready", "blocked", "dropped"])],
  ["release-ready", /* @__PURE__ */ new Set(["deploying", "blocked", "dropped"])],
  ["deploying", /* @__PURE__ */ new Set(["production-verification", "blocked", "dropped"])],
  ["production-verification", /* @__PURE__ */ new Set(["shipped", "blocked", "dropped"])],
  ["blocked", /* @__PURE__ */ new Set(["dropped"])],
  ["completed", /* @__PURE__ */ new Set()],
  ["shipped", /* @__PURE__ */ new Set()],
  ["dropped", /* @__PURE__ */ new Set()]
]);
function fail6(code, message, retryable = false) {
  throw new RuntimeError(code, message, retryable);
}
function requireKnownTaskRoles(body, authority) {
  for (const [label, role] of [
    ["scope authority", body.scope_authority],
    ["completion authority", body.completion_authority],
    ["next role", body.next_role],
    ["producer", body.producer_actor?.role ?? null],
    ["acceptance actor", body.acceptance_actor?.role ?? null]
  ]) {
    if (role !== null) requireRoleAvailable(role, authority, label);
  }
  for (const requirement of body.review_requirements) {
    requireRoleAvailable(requirement.role, authority, "review requirement");
  }
}
function taskRecord(body, version = 1) {
  return {
    kind: "task",
    id: body.id,
    subject: null,
    version,
    body
  };
}
function assertCurrentAlignment(tx, task, runtime) {
  const feature = tx.get("feature", task.body.feature_id);
  if (!feature) {
    fail6("EVIDENCE_GAP", `task/${task.id} has no current Feature ancestor`);
  }
  const epic = tx.get("epic", feature.body.epic_id);
  if (!epic) {
    fail6("EVIDENCE_GAP", `feature/${feature.id} has no current Epic ancestor`);
  }
  return assertAlignedAncestors(tx, task, runtime.direction(epic.body.direction_ref));
}
function alignmentFailure(tx, task, runtime) {
  try {
    assertCurrentAlignment(tx, task, runtime);
    return null;
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "EVIDENCE_GAP") return error;
    throw error;
  }
}
function taskStateSatisfies(task, requirement) {
  if (requirement === "in-review") {
    return (/* @__PURE__ */ new Set([
      "in-review",
      "completed",
      "release-ready",
      "deploying",
      "production-verification",
      "shipped"
    ])).has(task.body.state);
  }
  if (requirement === "completed") {
    return task.body.delivery_class === "knowledge" && task.body.state === "completed";
  }
  if (requirement === "release-ready") {
    return task.body.delivery_class !== "knowledge" && (/* @__PURE__ */ new Set([
      "release-ready",
      "deploying",
      "production-verification",
      "shipped"
    ])).has(task.body.state);
  }
  return task.body.delivery_class !== "knowledge" && task.body.state === "shipped";
}
function dependencyStatus(tx, task) {
  const pending = [];
  const failed = [];
  for (const dependency of task.body.depends_on) {
    const upstream = tx.get("task", dependency.task);
    if (!upstream) {
      fail6(
        "EVIDENCE_GAP",
        `dependency task/${dependency.task} does not exist`
      );
    }
    if (upstream.body.state === "dropped") {
      failed.push(dependency.task);
    } else if (!taskStateSatisfies(upstream, dependency.requires)) {
      pending.push(dependency.task);
    }
  }
  return { pending, failed };
}
function assertNoDependencyCycle(tx, candidate) {
  const all = new Map(tx.list("task").map((record) => [record.id, record.body]));
  all.set(candidate.id, candidate);
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit = (id) => {
    if (visiting.has(id)) fail6("INVALID_INPUT", `dependency cycle includes task/${id}`);
    if (visited.has(id)) return;
    const task = all.get(id);
    if (!task) return;
    visiting.add(id);
    for (const dependency of task.depends_on) visit(dependency.task);
    visiting.delete(id);
    visited.add(id);
  };
  visit(candidate.id);
}
function touchPrefix(touch) {
  const normalized2 = touch.replaceAll("\\", "/").toLowerCase();
  const segments = normalized2.split("/");
  if (segments.includes("..") || normalized2.startsWith("/") || /^[a-z]:/.test(normalized2)) {
    return { prefix: "", wildcard: true };
  }
  const path2 = segments.filter((segment) => segment !== "" && segment !== ".").join("/");
  const wildcard = path2.search(/[*?[\]{}()!+@]/);
  return {
    prefix: wildcard === -1 ? path2 : path2.slice(0, wildcard),
    wildcard: wildcard !== -1 || normalized2.endsWith("/")
  };
}
function touchesOverlap(left, right) {
  for (const leftTouch of left) {
    for (const rightTouch of right) {
      const left2 = touchPrefix(leftTouch);
      const right2 = touchPrefix(rightTouch);
      if (left2.prefix === right2.prefix) return true;
      if ((left2.wildcard || right2.wildcard) && (left2.prefix.startsWith(right2.prefix) || right2.prefix.startsWith(left2.prefix))) return true;
    }
  }
  return false;
}
function requireNoTouchConflict(tx, task) {
  for (const other of tx.list("task")) {
    if (other.id === task.id || !leaseIsLive(other.body.lease)) continue;
    if (touchesOverlap(task.body.touches, other.body.touches)) {
      fail6(
        "LEASE_CONFLICT",
        `task/${task.id} touch set conflicts with active task/${other.id}`
      );
    }
  }
}
function requireNoOpenQuestions(task) {
  if (task.body.waiting_on_questions.length > 0) {
    fail6(
      "EVIDENCE_GAP",
      `task/${task.id} has unanswered blocking questions`
    );
  }
}
function requireImmutableSubject(task) {
  if (task.body.change_ref === null) {
    fail6("EVIDENCE_GAP", `task/${task.id} has no immutable change subject`);
  }
}
function requireTransition(tx, task, command, authority, to) {
  const from = task.body.state;
  if (!ALLOWED_TRANSITIONS.get(from)?.has(to)) {
    fail6("INVALID_INPUT", `task lifecycle does not allow ${from} -> ${to}`);
  }
  if (task.body.lease !== null && !leaseIsLive(task.body.lease)) {
    fail6("RECOVERY_REQUIRED", `task/${task.id} lease expired and must be reconciled`);
  }
  if (to !== "blocked" && to !== "dropped") requireNoOpenQuestions(task);
  const dependencies2 = dependencyStatus(tx, task);
  if (dependencies2.failed.length > 0 && to !== "blocked" && to !== "dropped") {
    fail6(
      "RECOVERY_REQUIRED",
      `task/${task.id} has failed dependencies: ${dependencies2.failed.join(", ")}`
    );
  }
  if (dependencies2.pending.length > 0 && to !== "blocked" && to !== "dropped") {
    fail6(
      "EVIDENCE_GAP",
      `task/${task.id} has pending dependencies: ${dependencies2.pending.join(", ")}`
    );
  }
  if (to === "ready") {
    requireNamedAuthority(
      tx,
      command,
      authority,
      "task.promote",
      task.body.scope_authority
    );
    return null;
  }
  if (to === "dropped") {
    requireNamedAuthority(
      tx,
      command,
      authority,
      "task.transition",
      task.body.scope_authority
    );
    return null;
  }
  requireActingAuthority(tx, task, command, authority, "task.transition");
  if (to === "in-review") {
    if (!sameActor(command.actor, task.body.producer_actor)) {
      fail6("AUTHORITY_REQUIRED", "only the producing actor may submit its work for review");
    }
    requireImmutableSubject(task);
  }
  if (to === "completed") {
    if (task.body.delivery_class !== "knowledge") {
      fail6("INVALID_INPUT", "completed is reserved for knowledge Tasks");
    }
    requireImmutableSubject(task);
    requireReviews(tx, task);
    return completionApproval(tx, task);
  }
  if (to === "release-ready") {
    if (task.body.delivery_class === "knowledge") {
      fail6("INVALID_INPUT", "knowledge Tasks do not enter release-ready");
    }
    if (command.actor.role !== "workflow-ship") {
      fail6("AUTHORITY_REQUIRED", "workflow-ship owns release readiness");
    }
    requireImmutableSubject(task);
    requireReviews(tx, task);
    const approval = completionApproval(tx, task);
    requireReleaseEvidence(tx, task);
    return approval;
  }
  if (to === "deploying") {
    if (command.actor.role !== "workflow-ship") {
      fail6("AUTHORITY_REQUIRED", "workflow-ship owns deployment recording");
    }
    requireOperatorApproval(tx, task, "operator-deploy-start");
  }
  if (to === "production-verification") {
    if (command.actor.role !== "workflow-ship") {
      fail6("AUTHORITY_REQUIRED", "workflow-ship owns deployment recording");
    }
    requireOperatorApproval(tx, task, "operator-deploy-complete");
    requireDeploymentEvidence(tx, task, "deployment");
  }
  if (to === "shipped") {
    if (command.actor.role !== "workflow-ship") {
      fail6("AUTHORITY_REQUIRED", "workflow-ship owns shipment recording");
    }
    requireDeploymentEvidence(tx, task, "deployment");
    requireDeploymentEvidence(tx, task, "production-verification");
  }
  return null;
}
function transitionBody(tx, task, command, authority, runtime, to, at) {
  if (to !== "blocked" && to !== "dropped" || hasStaleDirection(tx, task, runtime.direction)) {
    assertCurrentAlignment(tx, task, runtime);
  }
  const candidate = to === "in-review" ? {
    ...task,
    body: {
      ...task.body,
      change_ref: command.payload.subject
    }
  } : task;
  const approval = requireTransition(tx, candidate, command, authority, to);
  let nextRole = task.body.next_role;
  if (to === "in-progress") {
    nextRole = task.body.producer_actor?.role ?? task.body.next_role;
  } else if (to === "in-review") {
    nextRole = task.body.review_requirements[0]?.role ?? task.body.completion_authority;
  } else if (to === "release-ready") {
    nextRole = "operator";
  } else if (to === "deploying" || to === "production-verification") {
    nextRole = "workflow-ship";
  } else if (TASK_TERMINAL_STATES.has(to)) {
    nextRole = null;
  }
  retireLeaseGrants(tx, task, "revoked");
  return {
    ...task.body,
    state: to,
    resume_state: to === "blocked" ? task.body.state : null,
    acceptance_actor: approval?.authority ?? task.body.acceptance_actor,
    next_role: nextRole,
    change_ref: to === "in-review" ? command.payload.subject : task.body.change_ref,
    lease: null,
    updated_at: at
  };
}
function putMessage(tx, task, command, {
  messageId,
  parentId,
  recipient,
  kind,
  createdAt,
  content,
  artifactRefs,
  evidenceRefs,
  provenance
}, basisVersion = task.version + 1) {
  if (tx.get("message", messageId)) {
    fail6("OPERATION_CONFLICT", `message/${messageId} already exists`);
  }
  if (parentId !== null) {
    const parent = tx.get("message", parentId);
    if (!parent) fail6("INVALID_INPUT", `parent message/${parentId} does not exist`);
    if (!subjectEquals(parent.subject, { kind: task.kind, id: task.id })) {
      fail6("INVALID_INPUT", `parent message/${parentId} belongs to another hierarchy subject`);
    }
  }
  const body = {
    schema_version: 1,
    message_id: messageId,
    subject: { kind: task.kind, id: task.id },
    thread_id: subjectRef({ kind: task.kind, id: task.id }, basisVersion),
    parent_id: parentId,
    sender_role: command.actor.role,
    sender_run: command.actor.runId,
    recipient,
    kind,
    created_at: createdAt,
    basis_version: basisVersion,
    payload: content,
    artifact_refs: artifactRefs,
    evidence_refs: evidenceRefs,
    provenance
  };
  tx.put({
    kind: "message",
    id: messageId,
    subject: body.subject,
    version: 1,
    body
  });
  return body;
}
function handleTaskCreate(current, tx, command, authority, runtime) {
  if (current !== null) fail6("VERSION_CONFLICT", `task/${command.recordId} exists`);
  const body = command.payload.body;
  if (body.state !== "proposed") {
    fail6("INVALID_INPUT", "new Tasks must begin proposed");
  }
  assertCurrentAlignment(tx, taskRecord(body), runtime);
  requireActionGrant(tx, command, authority, "task.create");
  requireKnownTaskRoles(body, authority);
  if (body.producer_actor && sameActor(body.producer_actor, body.acceptance_actor)) {
    fail6("AUTHORITY_REQUIRED", "the producer cannot be the acceptance actor");
  }
  assertNoDependencyCycle(tx, body);
  return body;
}
function handleTaskUpdate(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireActingAuthority(tx, current, command, authority, "task.update");
  const changes = Object.hasOwn(command.payload, "changes") ? command.payload.changes : { title: command.payload.title };
  const next = { ...current.body, ...changes };
  const acceptedState = current.body.state === "blocked" ? current.body.resume_state : current.body.state;
  if ((TASK_TERMINAL_STATES.has(acceptedState) || SHIP_STATES.has(acceptedState)) && criteriaRef({ ...current, body: next }, (kind, id) => tx.get(kind, id)) !== criteriaRef(current, (kind, id) => tx.get(kind, id))) {
    fail6("INVALID_INPUT", "accepted criteria are frozen; record changed requirements as new work");
  }
  if (current.body.recovery_hold !== null && Object.hasOwn(changes, "next_role")) {
    fail6("AUTHORITY_REQUIRED", "operator resolution must release the recovery routing hold");
  }
  requireKnownTaskRoles(next, authority);
  assertNoDependencyCycle(tx, next);
  if (current.body.lease !== null && Object.hasOwn(changes, "touches")) {
    requireNoTouchConflict(tx, { ...current, body: next });
  }
  return next;
}
function handleTaskPromote(current, tx, command, authority, runtime) {
  if (current.body.state !== "proposed") {
    fail6("INVALID_INPUT", "task.promote requires a proposed task");
  }
  assertCurrentAlignment(tx, current, runtime);
  requireKnownTaskRoles(current.body, authority);
  requireNamedAuthority(
    tx,
    command,
    authority,
    "task.promote",
    current.body.scope_authority
  );
  dependencyStatus(tx, current);
  return {
    ...current.body,
    state: "ready",
    updated_at: command.payload.at
  };
}
function createPersistedGrant(tx, task, command, holder, actions, acquiredAt, expiresAt, token) {
  const grantId = randomUUID2();
  tx.put({
    kind: "grant",
    id: grantId,
    subject: { kind: "task", id: task.id },
    version: 1,
    body: {
      schema_version: 1,
      grant_id: grantId,
      subject: { kind: "task", id: task.id },
      actor: holder,
      actions,
      record_kind: "task",
      record_id: task.id,
      basis_ref: subjectRef({ kind: "task", id: task.id }, task.version),
      lease_token: token,
      issued_by: command.actor,
      created_at: acquiredAt,
      expires_at: expiresAt,
      status: "active"
    }
  });
  return grantId;
}
function retireLeaseGrants(tx, task, status) {
  if (task.body.lease === null) return;
  for (const record of tx.list("grant", { kind: "task", id: task.id })) {
    if (record.body.lease_token === task.body.lease.token && record.body.status === "active") {
      tx.put({ ...record, version: record.version + 1, body: { ...record.body, status } });
    }
  }
}
function withProducer(body, actor) {
  const history = [...body.producing_actors];
  for (const producer of [body.producer_actor, actor]) {
    if (producer && !history.some((previous) => sameActor(previous, producer))) history.push(producer);
  }
  return { producer_actor: actor, producing_actors: history };
}
function handleTaskGrant(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireActionGrant(tx, command, authority, "task.grant");
  requireKnownTaskRoles(current.body, authority);
  if (current.body.recovery_hold !== null) {
    fail6("AUTHORITY_REQUIRED", "operator resolution is required before regrant");
  }
  if (current.body.lease !== null) {
    if (leaseIsLive(current.body.lease)) {
      fail6("LEASE_CONFLICT", `task/${current.id} already has a live lease`);
    }
    fail6(
      "RECOVERY_REQUIRED",
      `task/${current.id} has an expired lease that must be reconciled`
    );
  }
  if (!GRANTABLE_STATES.has(current.body.state)) {
    fail6("INVALID_INPUT", `task/${current.id} cannot be granted from ${current.body.state}`);
  }
  requireRoleAvailable(command.payload.holder.role, authority, "lease holder");
  if (command.payload.holder.role === "operator") {
    fail6("INVALID_INPUT", "operator is a reserved endpoint and cannot hold a lease");
  }
  if (current.body.next_role !== null && current.body.next_role !== command.payload.holder.role) {
    fail6(
      "AUTHORITY_REQUIRED",
      `task/${current.id} is routed to ${current.body.next_role}`
    );
  }
  if (Date.parse(command.payload.expiresAt) <= Date.now()) {
    fail6("INVALID_INPUT", "a new lease must expire in the future");
  }
  requireNoOpenQuestions(current);
  const dependencies2 = dependencyStatus(tx, current);
  if (dependencies2.failed.length > 0) {
    return {
      ...current.body,
      state: "blocked",
      resume_state: current.body.state,
      lease: null,
      updated_at: command.payload.acquiredAt
    };
  }
  if (dependencies2.pending.length > 0) {
    fail6(
      "EVIDENCE_GAP",
      `task/${current.id} has pending dependencies: ${dependencies2.pending.join(", ")}`
    );
  }
  requireNoTouchConflict(tx, current);
  const token = randomUUID2();
  createPersistedGrant(
    tx,
    current,
    command,
    command.payload.holder,
    command.payload.actions,
    command.payload.acquiredAt,
    command.payload.expiresAt,
    token
  );
  return {
    ...current.body,
    state: current.body.state === "ready" ? "in-progress" : current.body.state,
    ...current.body.state === "ready" || current.body.state === "in-progress" ? withProducer(current.body, command.payload.holder) : {},
    next_role: command.payload.holder.role,
    lease: {
      holder: command.payload.holder,
      token,
      version_at_grant: current.version,
      acquired_at: command.payload.acquiredAt,
      expires_at: command.payload.expiresAt
    },
    updated_at: command.payload.acquiredAt
  };
}
function handleTaskTransition(current, tx, command, authority, runtime) {
  return transitionBody(
    tx,
    current,
    command,
    authority,
    runtime,
    command.payload.to,
    command.payload.at
  );
}
function handleTaskHandoff(current, tx, command, authority, runtime) {
  const staleDirection = hasStaleDirection(tx, current, runtime.direction);
  if (staleDirection) {
    requireLeasedActingAuthority(tx, current, command, authority, "task.handoff");
    if (command.payload.state !== null) {
      fail6(
        "AUTHORITY_REQUIRED",
        `Direction-stale task/${current.id} handoff must preserve execution state`
      );
    }
    if (!(/* @__PURE__ */ new Set([current.body.scope_authority, "operator"])).has(command.payload.toRole)) {
      fail6(
        "AUTHORITY_REQUIRED",
        `Direction-stale task/${current.id} may hand off only to a safe owner`
      );
    }
  } else {
    requireActingAuthority(tx, current, command, authority, "task.handoff");
  }
  if (current.body.recovery_hold !== null) {
    fail6("AUTHORITY_REQUIRED", "operator resolution is required before handoff");
  }
  requireRoleAvailable(command.payload.toRole, authority, "handoff recipient");
  let next = current.body;
  if (command.payload.state !== null) {
    next = transitionBody(
      tx,
      current,
      command,
      authority,
      runtime,
      command.payload.state,
      command.payload.createdAt
    );
  } else if (!staleDirection) {
    const alignment = alignmentFailure(tx, current, runtime);
    if (alignment && !(/* @__PURE__ */ new Set([current.body.scope_authority, "operator"])).has(command.payload.toRole)) {
      fail6(
        "AUTHORITY_REQUIRED",
        `Direction-stale task/${current.id} may hand off only to a safe owner`
      );
    }
  }
  putMessage(tx, current, command, {
    messageId: command.payload.messageId,
    parentId: command.payload.parentId,
    recipient: command.payload.toRole,
    kind: "handoff",
    createdAt: command.payload.createdAt,
    content: command.payload.content,
    artifactRefs: command.payload.artifactRefs,
    evidenceRefs: command.payload.evidenceRefs,
    provenance: command.payload.provenance
  });
  retireLeaseGrants(tx, current, "revoked");
  return {
    ...next,
    next_role: command.payload.toRole,
    lease: null,
    updated_at: command.payload.createdAt
  };
}
function requireRestorationAuthority(task, command, authority) {
  requireHostActionGrant(command, authority, "task.restore");
  if (SHIP_STATES.has(task.body.resume_state) && command.actor.role !== "workflow-ship") {
    fail6("AUTHORITY_REQUIRED", `workflow-ship must restore ${task.body.resume_state}`);
  }
}
function handleTaskRestore(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireRestorationAuthority(current, command, authority);
  if (current.body.state !== "blocked" || current.body.resume_state === null) {
    fail6("INVALID_INPUT", "task.restore requires a blocked task with resume_state");
  }
  const resolution = current.body.recovery_hold !== null ? recoveryResolution(tx, current, command.payload.recoveryApprovalId) : null;
  if (resolution) requireRoleAvailable(resolution.recovery.resume_role, authority, "recovery recipient");
  if (!resolution && command.payload.recoveryApprovalId) {
    fail6("INVALID_INPUT", "task has no recovery hold to resolve");
  }
  if (current.body.lease !== null) {
    fail6("RECOVERY_REQUIRED", "the blocked reservation must be reconciled before restoration");
  }
  requireNoOpenQuestions(current);
  const dependencies2 = dependencyStatus(tx, current);
  if (dependencies2.failed.length > 0) {
    fail6(
      "RECOVERY_REQUIRED",
      `task/${current.id} still has failed dependencies`
    );
  }
  if (dependencies2.pending.length > 0) {
    fail6(
      "EVIDENCE_GAP",
      `task/${current.id} still has pending dependencies`
    );
  }
  if (TASK_NEEDS_CHANGE_REF.has(current.body.resume_state) && current.body.change_ref === null) {
    fail6(
      "EVIDENCE_GAP",
      `task/${current.id} cannot restore ${current.body.resume_state} without a change subject`
    );
  }
  return {
    ...current.body,
    state: current.body.resume_state,
    resume_state: null,
    recovery_hold: null,
    next_role: resolution?.recovery.resume_role ?? current.body.next_role,
    updated_at: command.payload.at
  };
}
function handleQuestionOpen(current, tx, command, authority, runtime) {
  const task = current.kind === "task";
  if (task) {
    assertCurrentAlignment(tx, current, runtime);
    requireActingAuthority(tx, current, command, authority, "question.open");
  } else {
    requireActionGrant(tx, command, authority, "question.open");
  }
  if (task && TASK_TERMINAL_STATES.has(current.body.state)) {
    fail6("INVALID_INPUT", "terminal Tasks cannot open questions");
  }
  if (command.payload.kind !== "question") {
    fail6("INVALID_INPUT", 'question.open message kind must be "question"');
  }
  requireRoleAvailable(command.payload.recipient, authority, "question recipient");
  if (command.payload.recipient === "operator" && command.payload.content.questionKind === "fact") {
    fail6(
      "AUTHORITY_REQUIRED",
      "fact questions must be addressed to the real role that owns the fact"
    );
  }
  if (tx.get("question", command.payload.questionId)) {
    fail6(
      "OPERATION_CONFLICT",
      `question/${command.payload.questionId} already exists`
    );
  }
  const message = putMessage(tx, current, command, {
    messageId: command.payload.messageId,
    parentId: command.payload.parentId,
    recipient: command.payload.recipient,
    kind: "question",
    createdAt: command.payload.createdAt,
    content: command.payload.content,
    artifactRefs: command.payload.artifactRefs,
    evidenceRefs: command.payload.evidenceRefs,
    provenance: command.payload.provenance
  });
  const content = command.payload.content;
  tx.put({
    kind: "question",
    id: command.payload.questionId,
    subject: { kind: current.kind, id: current.id },
    version: 1,
    body: {
      schema_version: 1,
      question_id: command.payload.questionId,
      subject: { kind: current.kind, id: current.id },
      asker: command.actor,
      recipient: command.payload.recipient,
      kind: content.questionKind,
      blocking: content.blocking,
      status: "open",
      context: content.context,
      ask: content.ask,
      answer_by: content.answerBy,
      opened_message_id: message.message_id,
      answer_message_ids: [],
      resolution: null
    }
  });
  if (!task || !content.blocking) {
    return { ...current.body, updated_at: command.payload.createdAt };
  }
  retireLeaseGrants(tx, current, "revoked");
  const waiting = current.body.waiting_on_questions.includes(command.payload.questionId) ? current.body.waiting_on_questions : [...current.body.waiting_on_questions, command.payload.questionId];
  return {
    ...current.body,
    state: "blocked",
    resume_state: current.body.state === "blocked" ? current.body.resume_state : current.body.state,
    waiting_on_questions: waiting,
    lease: null,
    updated_at: command.payload.createdAt
  };
}
function effectiveAnswers(tx, question, answerIds) {
  const answers = answerIds.map((id) => tx.get("message", id)?.body).filter((candidate) => candidate?.kind === "answer" && candidate.subject.kind === question.subject.kind && candidate.subject.id === question.subject.id && candidate.sender_role === question.body.recipient && candidate.recipient === question.body.asker.role && candidate.parent_id === question.body.opened_message_id && candidate.payload.status === "answered" && candidate.payload.lane === "in-lane");
  const replaced = new Set(answers.flatMap((answer) => answer.payload.resolves ?? []));
  return answers.filter((answer) => !replaced.has(answer.message_id));
}
function handleQuestionAnswer(current, tx, command, authority, runtime) {
  const task = current.kind === "task";
  if (task) assertCurrentAlignment(tx, current, runtime);
  if (command.payload.kind !== "answer") {
    fail6("INVALID_INPUT", 'question.answer message kind must be "answer"');
  }
  const question = tx.get("question", command.payload.questionId);
  if (question?.subject?.kind !== current.kind || question.subject.id !== current.id) {
    fail6(
      "INVALID_INPUT",
      `question/${command.payload.questionId} does not belong to task/${current.id}`
    );
  }
  if (command.actor.role !== question.body.recipient) {
    fail6(
      "AUTHORITY_REQUIRED",
      `question/${question.id} is addressed to ${question.body.recipient}`
    );
  }
  if (command.actor.role === "operator") {
    requireActionGrant(tx, command, authority, "question.answer");
  } else {
    requireActorAvailable(command, authority);
  }
  if (command.payload.recipient !== question.body.asker.role) {
    fail6("INVALID_INPUT", "answer recipient must be the original asker");
  }
  if (command.payload.parentId !== question.body.opened_message_id) {
    fail6("INVALID_INPUT", "answer parent must be the opening question message");
  }
  if (command.payload.content.resolves) {
    requireHostActionGrant(command, authority, "question.answer");
    const prior = effectiveAnswers(tx, question, question.body.answer_message_ids);
    const targets = new Set(command.payload.content.resolves);
    if (targets.size !== prior.length || prior.some((answer) => !targets.has(answer.message_id))) {
      fail6("INVALID_INPUT", "explicit question resolution must address every effective prior answer");
    }
  }
  const message = putMessage(tx, current, command, {
    messageId: command.payload.messageId,
    parentId: command.payload.parentId,
    recipient: command.payload.recipient,
    kind: "answer",
    createdAt: command.payload.createdAt,
    content: command.payload.content,
    artifactRefs: command.payload.artifactRefs,
    evidenceRefs: command.payload.evidenceRefs,
    provenance: command.payload.provenance
  });
  const answerIds = [...question.body.answer_message_ids, message.message_id];
  const answers = effectiveAnswers(tx, question, answerIds);
  const distinctAnswers = new Set(answers.map((answer) => answer.payload.answer.trim()));
  const resolved = distinctAnswers.size === 1;
  const resolvingMessage = resolved ? answers.at(-1) : null;
  tx.put({
    ...question,
    version: question.version + 1,
    body: {
      ...question.body,
      status: resolved ? "answered" : "open",
      answer_message_ids: answerIds,
      resolution: resolved ? {
        answer: resolvingMessage.payload.answer,
        lane: "in-lane",
        provenance: resolvingMessage.provenance,
        message_id: resolvingMessage.message_id,
        answered_at: resolvingMessage.created_at,
        sender: {
          role: resolvingMessage.sender_role,
          runId: resolvingMessage.sender_run
        }
      } : null
    }
  });
  if (!task || TASK_TERMINAL_STATES.has(current.body.state)) {
    return { ...current.body, updated_at: command.payload.createdAt };
  }
  let waiting = current.body.waiting_on_questions;
  if (question.body.blocking) {
    if (resolved) {
      waiting = waiting.filter((id) => id !== question.id);
    } else if (!waiting.includes(question.id)) {
      waiting = [...waiting, question.id];
    }
  }
  const shouldBlock = question.body.blocking && !resolved;
  const releaseLease = shouldBlock && leaseIsLive(current.body.lease);
  if (releaseLease) retireLeaseGrants(tx, current, "revoked");
  return {
    ...current.body,
    state: shouldBlock ? "blocked" : current.body.state,
    resume_state: shouldBlock && current.body.state !== "blocked" ? current.body.state : current.body.resume_state,
    waiting_on_questions: waiting,
    lease: releaseLease ? null : current.body.lease,
    updated_at: command.payload.createdAt
  };
}
function recoveryEvidence(tx, task, command) {
  if (command.payload.recoveryEvidenceIds.length === 0) {
    fail6("EVIDENCE_GAP", "lease expiry alone cannot authorize recovery");
  }
  for (const id of command.payload.recoveryEvidenceIds) {
    const record = tx.get("evidence", id);
    if (record?.subject?.kind !== "task" || record.subject.id !== task.id || record.body.kind !== "recovery-reconciliation" || record.body.outcome !== "passed" || record.body.data.stale_lease_token !== task.body.lease.token || record.body.data.disposition !== command.payload.disposition || record.body.data.observed !== command.payload.observed || Date.parse(record.body.created_at) < Date.parse(task.body.lease.expires_at)) {
      fail6(
        "EVIDENCE_GAP",
        `evidence/${id} does not reconcile the stale lease and disposition`
      );
    }
  }
}
function handleAttemptRecover(current, tx, command, authority, runtime) {
  requireActionGrant(tx, command, authority, "attempt.recover");
  if (TASK_TERMINAL_STATES.has(current.body.state)) {
    fail6(
      "INVALID_INPUT",
      `task/${current.id} cannot recover a lease from ${current.body.state}`
    );
  }
  if (current.body.lease === null) {
    fail6("INVALID_INPUT", `task/${current.id} has no lease to recover`);
  }
  if (leaseIsLive(current.body.lease)) {
    fail6("LEASE_CONFLICT", `task/${current.id} lease has not expired`);
  }
  recoveryEvidence(tx, current, command);
  if (tx.get("attempt", command.payload.attemptId) || tx.get("message", command.payload.attemptId)) {
    fail6(
      "OPERATION_CONFLICT",
      `attempt/${command.payload.attemptId} already exists`
    );
  }
  const staleLease = current.body.lease;
  let newLease = null;
  let state = current.body.state;
  let resumeState = current.body.resume_state;
  let nextRole = current.body.next_role;
  let producing = {};
  let recoveryHold2 = current.body.recovery_hold;
  if (command.payload.disposition === "safe-to-resume" && recoveryHold2 !== null) {
    fail6("AUTHORITY_REQUIRED", "operator resolution is required before recovery");
  }
  if (command.payload.disposition === "safe-to-resume" && command.payload.redispatch !== null) {
    assertCurrentAlignment(tx, current, runtime);
    requireNoOpenQuestions(current);
    const dependencies2 = dependencyStatus(tx, current);
    if (dependencies2.failed.length > 0) {
      fail6("RECOVERY_REQUIRED", `task/${current.id} has failed dependencies`);
    }
    if (dependencies2.pending.length > 0) {
      fail6("EVIDENCE_GAP", `task/${current.id} has pending dependencies`);
    }
    if (state === "blocked") {
      requireRestorationAuthority(current, command, authority);
      state = resumeState;
      resumeState = null;
      if (!GRANTABLE_STATES.has(state)) {
        fail6("INVALID_INPUT", "blocked lease has no resumable work state");
      }
    }
    if (TASK_NEEDS_CHANGE_REF.has(state) && current.body.change_ref === null) {
      fail6("EVIDENCE_GAP", `task/${current.id} cannot resume ${state} without an immutable subject`);
    }
    requireRoleAvailable(command.payload.redispatch.role, authority, "recovery recipient");
    if (command.payload.redispatch.role === "operator") {
      fail6("INVALID_INPUT", "operator cannot receive a recovery lease");
    }
    if (Date.parse(command.payload.expiresAt) <= Date.now()) {
      fail6("INVALID_INPUT", "a recovered lease must expire in the future");
    }
    requireNoTouchConflict(tx, current);
    const token = randomUUID2();
    newLease = {
      holder: command.payload.redispatch,
      token,
      version_at_grant: current.version,
      acquired_at: command.payload.createdAt,
      expires_at: command.payload.expiresAt
    };
    createPersistedGrant(
      tx,
      current,
      command,
      command.payload.redispatch,
      ["task.update", "task.transition", "task.handoff", "question.open"],
      command.payload.createdAt,
      command.payload.expiresAt,
      token
    );
    nextRole = command.payload.redispatch.role;
    if (state === "in-progress") {
      producing = withProducer(current.body, command.payload.redispatch);
    }
  } else if (command.payload.disposition === "conflicting-partial-work") {
    if (state !== "blocked") {
      resumeState = state;
      state = "blocked";
    }
    nextRole = "operator";
    recoveryHold2 = command.payload.attemptId;
  }
  retireLeaseGrants(tx, current, "recovered");
  tx.put({
    kind: "attempt",
    id: command.payload.attemptId,
    subject: { kind: "task", id: current.id },
    version: 1,
    body: {
      schema_version: 1,
      attempt_id: command.payload.attemptId,
      subject: { kind: "task", id: current.id },
      grantor: command.actor,
      stale_lease: staleLease,
      observed: command.payload.observed,
      disposition: command.payload.disposition,
      recovery_evidence_ids: command.payload.recoveryEvidenceIds,
      new_lease: newLease,
      created_at: command.payload.createdAt
    }
  });
  putMessage(tx, current, command, {
    messageId: command.payload.attemptId,
    parentId: null,
    recipient: command.payload.redispatch?.role ?? (command.payload.disposition === "conflicting-partial-work" ? "operator" : current.body.next_role ?? command.actor.role),
    kind: "recovery",
    createdAt: command.payload.createdAt,
    content: {
      observed: command.payload.observed,
      disposition: command.payload.disposition,
      staleLeaseToken: staleLease.token,
      newLeaseToken: newLease?.token ?? null
    },
    artifactRefs: [],
    evidenceRefs: command.payload.recoveryEvidenceIds,
    provenance: "durable-thread"
  });
  return {
    ...current.body,
    state,
    resume_state: resumeState,
    next_role: nextRole,
    ...producing,
    recovery_hold: recoveryHold2,
    lease: newLease,
    updated_at: command.payload.createdAt
  };
}
var taskHandlers = /* @__PURE__ */ new Map([
  ["task.create", handleTaskCreate],
  ["task.update", handleTaskUpdate],
  ["task.promote", handleTaskPromote],
  ["task.grant", handleTaskGrant],
  ["task.transition", handleTaskTransition],
  ["task.handoff", handleTaskHandoff],
  ["task.restore", handleTaskRestore],
  ["question.open", handleQuestionOpen],
  ["question.answer", handleQuestionAnswer],
  ["attempt.recover", handleAttemptRecover]
]);

// src/core/lib/coordination-runtime/engine.mjs
function fail7(code, message, retryable = false) {
  throw new RuntimeError(code, message, retryable);
}
var handlers = new Map([
  ...parentHandlers,
  ...taskHandlers
]);
function duplicateMessageReceipt(store, command) {
  const messageId = command.payload?.messageId;
  if (typeof messageId !== "string") return null;
  const existing = readMessageOperation(store, messageId);
  if (!existing) return null;
  const expectedEvent = {
    kind: command.kind,
    actor: command.actor,
    recordKind: command.recordKind,
    recordId: command.recordId,
    payload: command.payload
  };
  if (canonicalJson(existing.event) !== canonicalJson(expectedEvent)) {
    fail7(
      "OPERATION_CONFLICT",
      `message/${messageId} was already used with different content`
    );
  }
  return existing.receipt;
}
function applyCommand(store, command, authority) {
  validateCommand(command);
  if (!handlers.has(command.kind)) {
    fail7("INVALID_INPUT", `${command.kind} requires its dedicated evidence producer`);
  }
  validateAuthority(authority);
  requireActorAvailable(command, authority);
  const duplicate = duplicateMessageReceipt(store, command);
  if (duplicate) return duplicate;
  try {
    return applyOperation(store, command, (current, tx) => {
      bindEvidenceTransaction(store, tx);
      const handler = handlers.get(command.kind);
      return handler(current, tx, command, authority, {
        direction: (directionRef) => currentDirectionForStore(store, directionRef)
      });
    });
  } catch (error) {
    if (command.payload?.messageId && (error?.code === "VERSION_CONFLICT" || error?.code === "OPERATION_CONFLICT")) {
      const racedDuplicate = duplicateMessageReceipt(store, command);
      if (racedDuplicate) return racedDuplicate;
    }
    throw error;
  }
}

export {
  matchesAcceptance,
  effectiveReviews,
  effectiveApprovals,
  effectiveEvidence,
  DEFAULT_CONTEXT_MAX_BYTES,
  DEFAULT_CONTEXT_RECENT_LIMIT,
  projectContext,
  readDetail,
  readMessages,
  legacyClassificationSources,
  privacyRank,
  captureInputBasis,
  artifactInputReferences,
  migrateWorkspace,
  recoverMigration,
  verifyMigration,
  rollbackMigration,
  readLegacyRecords,
  bindMigrationRepair,
  repairLegacyRecord,
  bindEvidenceRuntime,
  bindEvidenceTransaction,
  bindEvidenceReadView,
  contextFor,
  sameActor,
  requireRoleAvailable,
  requireActorAvailable,
  requireHostActionGrant,
  requireNamedAuthority,
  leaseIsLive,
  requireLease,
  requireLeasedActingAuthority,
  requireActingAuthority,
  currentDirectionForStore,
  hasStaleDirection,
  assertAlignedAncestors,
  hasPublicationHistory,
  verifyAssetContent,
  verifyParentCompletionEvidence,
  verifyParentCompletionApproval,
  artifactBasisCurrent,
  subjectArtifact,
  verifyReferences,
  verifyVerdict,
  requireReviews,
  completionApproval,
  requireReleaseEvidence,
  requireOperatorApproval,
  requireDeploymentEvidence,
  recoveryResolution,
  GRANTABLE_STATES,
  SHIP_STATES,
  taskStateSatisfies,
  applyCommand
};

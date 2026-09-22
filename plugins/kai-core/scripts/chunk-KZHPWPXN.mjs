import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  DATABASE,
  LOCK,
  assertWorkspacePath,
  closeStore,
  effectiveApprovals,
  exactFile,
  itemStateSatisfies,
  migrationManifest,
  normalized,
  openStore,
  privateAdmission,
  readContextView,
  readLegacyRecords,
  readMessagePage,
  readRecord,
  readSnapshot,
  safePath,
  sourceSnapshot,
  verifyMigration,
  workspaceManifest
} from "./chunk-SQAAX6CQ.mjs";
import {
  RuntimeError,
  TERMINAL,
  canonicalJson,
  criteriaRef
} from "./chunk-VP4QXWCX.mjs";

// src/core/lib/coordination-runtime/context.mjs
var DEFAULT_MAX_BYTES = 24 * 1024;
var DEFAULT_RECENT_LIMIT = 8;
var MAX_RECENT_LIMIT = 8;
var MAX_MESSAGE_PAGE = 100;
var MAX_EXCERPT_BYTES = 512;
var TERMINAL2 = /* @__PURE__ */ new Set(["completed", "shipped", "dropped"]);
function invalid(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function gap(message) {
  throw new RuntimeError("EVIDENCE_GAP", message);
}
function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value === "") invalid(`${label} must be a string`);
}
function validateProjectionOptions(itemId, maxBytes, recentLimit) {
  assertNonEmptyString(itemId, "context itemId");
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
  let text2 = "";
  for (const character of source) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (bytes + characterBytes + suffixBytes > MAX_EXCERPT_BYTES) break;
    text2 += character;
    bytes += characterBytes;
  }
  return { text: `${text2}${suffix}`, truncated: true };
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
function currentDecisions(view) {
  const effective = effectiveApprovals(
    view.approvals.map(({ record }) => record.body),
    view.item.body
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
  const waiting = new Set(view.item.body.waiting_on_questions);
  const terminal = TERMINAL2.has(view.item.body.state);
  return view.questions.map((entry) => {
    const question = entry.record;
    if (!question) gap("item references a missing question");
    if (question.itemId !== view.item.id || !terminal && question.body.status !== "open" || !terminal && waiting.has(question.id) && question.body.blocking !== true) {
      gap(`question/${question.id} is not an unresolved question for item/${view.item.id}`);
    }
    if (entry.eventSeq === null) {
      gap(`question/${question.id} has no persisted opening-message chronology`);
    }
    if (!entry.openedMessage || entry.openedMessage.itemId !== view.item.id || entry.openedMessage.body.message_id !== question.body.opened_message_id || entry.openedMessage.body.kind !== "question") {
      gap(`question/${question.id} references a missing opening message`);
    }
    for (const message of entry.answerMessages) {
      if (!message || message.itemId !== view.item.id || message.body.kind !== "answer") {
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
        disposition: TERMINAL2.has(view.item.body.state) ? "historical-follow-up" : question.body.blocking ? "blocking" : "nonblocking",
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
  if (view.item.body.recovery_hold === null) return null;
  const entry = view.recoveryHold;
  const attempt = entry?.record;
  if (!attempt || attempt.itemId !== view.item.id || attempt.id !== view.item.body.recovery_hold || attempt.body.disposition !== "conflicting-partial-work") {
    gap(`item/${view.item.id} references a missing or mismatched recovery attempt`);
  }
  if (!entry.message || entry.eventSeq === null || entry.message.itemId !== view.item.id || entry.message.body.kind !== "recovery") {
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
      criteria_ref: criteriaRef(view.item.body),
      disposition: "safe-to-resume",
      scope: TERMINAL2.has(view.item.body.state) ? "before-restoration" : "before-resumption",
      release: "persist exact operator approval, then separately authorized item.restore",
      evidence_verification: "not_performed"
    }
  };
}
function dependencies(view) {
  return view.dependencies.map(({ dependency, record }) => {
    if (!record) gap(`item/${view.item.id} references missing dependency item/${dependency.item}`);
    return {
      item_id: record.id,
      item_version: record.version,
      state: record.body.state,
      requires: dependency.requires
    };
  });
}
function ensureMessage(entry, label, itemId) {
  if (!entry?.record) gap(`${label} references a missing message`);
  if (entry.record.body.thread_id !== itemId) {
    gap(`${label} does not belong to thread/${itemId}`);
  }
  return entry;
}
function addReference(references, kind, id) {
  references.set(`${kind}:${id}`, { kind, id });
}
function selectedEvidenceReferences(view, questions, decisions, selectedMessages, latestHandoff) {
  const values = [
    ...view.item.body.context_artifacts,
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
    threadId: view.item.id,
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
  const item = view.item;
  const packet = {
    schema_version: 1,
    through_seq: view.throughSeq,
    item: {
      id: item.id,
      title: item.body.title,
      state: item.body.state,
      resume_state: item.body.resume_state,
      recovery_hold: item.body.recovery_hold,
      outcome: item.body.outcome
    },
    authority: {
      scope_authority: item.body.scope_authority,
      completion_authority: item.body.completion_authority,
      acceptance_actor: item.body.acceptance_actor,
      next_role: item.body.next_role,
      lease: item.body.lease === null ? null : {
        holder: item.body.lease.holder,
        token: item.body.lease.token,
        version_at_grant: item.body.lease.version_at_grant,
        expires_at: item.body.lease.expires_at
      }
    },
    revision: {
      item_version: item.version,
      criteria_ref: criteriaRef(item.body),
      change_ref: item.body.change_ref,
      updated_at: item.body.updated_at
    },
    acceptance: item.body.acceptance,
    review_requirements: item.body.review_requirements,
    artifact_obligations: {
      artifact_expectation: item.body.artifact_expectation,
      artifact_expectation_reason: item.body.artifact_expectation_reason,
      artifact_class: item.body.artifact_class,
      durability: item.body.durability,
      validity_owner: item.body.validity_owner,
      artifact_targets: item.body.artifact_targets
    },
    dependencies: dependencyEntries,
    unresolved_questions: questionEntries.map(({ summary }) => summary),
    recovery_hold: recovery,
    blockers: [
      ...questionEntries.filter(({ summary }) => summary.disposition === "blocking").map(({ summary }) => summary),
      ...recovery && !TERMINAL2.has(item.body.state) ? [{ kind: "recovery-hold", ref: recovery.ref, required_authority: "operator" }] : []
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
  itemId,
  maxBytes = DEFAULT_MAX_BYTES,
  recentLimit = DEFAULT_RECENT_LIMIT
}) {
  validateProjectionOptions(itemId, maxBytes, recentLimit);
  const view = readContextView(store, { itemId, recentLimit });
  if (!view.item) gap(`item/${itemId} does not exist`);
  const questionEntries = unresolvedQuestions(view);
  const recovery = recoveryHold(view);
  const decisionEntries = currentDecisions(view);
  const dependencyEntries = dependencies(view);
  const latestHandoff = view.latestHandoff === null ? null : ensureMessage(view.latestHandoff, "latest handoff", itemId);
  const recent = view.recentMessages.map((entry, index) => ensureMessage(entry, `recent message ${index + 1}`, itemId));
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
  threadId,
  beforeSeq = null,
  limit = 50
}) {
  assertNonEmptyString(threadId, "message threadId");
  if (beforeSeq !== null && (!Number.isSafeInteger(beforeSeq) || beforeSeq < 1)) {
    invalid("message beforeSeq must be a positive safe integer or null");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_MESSAGE_PAGE) {
    invalid(`message limit must be an integer from 1 through ${MAX_MESSAGE_PAGE}`);
  }
  return readMessagePage(store, { threadId, beforeSeq, limit });
}

// src/core/lib/coordination-runtime/inspection.mjs
import { existsSync, readdirSync } from "node:fs";
import { basename as basename2 } from "node:path";

// src/core/lib/coordination-runtime/report-paths.mjs
import {
  closeSync,
  fsyncSync,
  fstatSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { randomUUID } from "node:crypto";
import { basename } from "node:path";

// src/core/lib/coordination-runtime/report-safety.mjs
import { createHash } from "node:crypto";
var hash = (value) => createHash("sha256").update(value).digest("hex");
var escapeHtml = (value) => String(value ?? "unavailable").replace(
  /[&<>"']/g,
  (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]
);
var escapeMarkdown = (value) => escapeHtml(value).replace(/([\\`*_[\]{}()#+.!|~-])/g, "\\$1").replace(/:/g, "&#58;").replace(/@/g, "&#64;").replace(/\r?\n/g, "<br>");
var knownGap = (error) => error instanceof RuntimeError && ["EVIDENCE_GAP", "AUTHORITY_REQUIRED", "INVALID_INPUT"].includes(error.code);
var tokenKey = (key) => /^token$|lease.*token$/i.test(key);
function possibleBearerSuffix(text2, secret) {
  const prefix = secret.slice(0, Math.min(text2.length, secret.length - 1));
  const fallback = new Uint32Array(prefix.length);
  let matched = 0;
  for (let i = 1; i < prefix.length; i++) {
    while (matched && prefix[i] !== prefix[matched]) matched = fallback[matched - 1];
    if (prefix[i] === prefix[matched]) matched++;
    fallback[i] = matched;
  }
  matched = 0;
  for (let i = text2.length - prefix.length; i < text2.length; i++) {
    while (matched && text2[i] !== prefix[matched]) matched = fallback[matched - 1];
    if (text2[i] === prefix[matched]) matched++;
  }
  return matched;
}
function redactPreview(preview, secrets, notice) {
  const text2 = preview.content;
  if (!secrets.size) return { content: text2, boundaryWithheldBytes: 0 };
  const patterns = new Set(secrets);
  if (preview.encoding === "latin1") {
    for (const secret of secrets) patterns.add(Buffer.from(secret.slice(0, text2.length + 1)).toString("latin1"));
  }
  const masked = new Uint8Array(text2.length);
  const mark = (start, end, flag) => {
    if (preview.encoding === "utf8") {
      if (/[\uDC00-\uDFFF]/.test(text2[start]) && /[\uD800-\uDBFF]/.test(text2[start - 1])) start--;
      if (/[\uD800-\uDBFF]/.test(text2[end - 1]) && /[\uDC00-\uDFFF]/.test(text2[end])) end++;
    }
    for (let i = start; i < end; i++) if (!masked[i]) masked[i] = flag;
  };
  let boundaryStart = text2.length;
  for (const secret of patterns) {
    let markedThrough = 0;
    for (let start = text2.indexOf(secret); start !== -1; start = text2.indexOf(secret, start + 1)) {
      mark(Math.max(start, markedThrough), start + secret.length, 1);
      markedThrough = start + secret.length;
      notice.occurrences++;
    }
    if (preview.previewState === "limited") {
      boundaryStart = Math.min(boundaryStart, text2.length - possibleBearerSuffix(text2, secret));
    }
  }
  let boundaryWithheldBytes = 0;
  if (boundaryStart < text2.length) {
    mark(boundaryStart, text2.length, 2);
    for (let start = 0; start < text2.length; ) {
      if (masked[start] !== 2) {
        start++;
        continue;
      }
      let end = start + 1;
      while (masked[end] === 2) end++;
      boundaryWithheldBytes += Buffer.byteLength(text2.slice(start, end), preview.encoding);
      start = end;
    }
    if (boundaryWithheldBytes) notice.boundaries++;
  }
  const parts = [];
  for (let start = 0; start < text2.length; ) {
    let end = start;
    let flags = 0;
    const withheld = !!masked[start];
    while (end < text2.length && !!masked[end] === withheld) flags |= masked[end++];
    parts.push(!withheld ? text2.slice(start, end) : flags & 2 ? "[withheld possible bearer-boundary]" : "[redacted bearer]");
    start = end;
  }
  return { content: parts.join(""), boundaryWithheldBytes };
}
function redaction(value) {
  const secrets = /* @__PURE__ */ new Set();
  const notice = { fields: 0, occurrences: 0, boundaries: 0 };
  const previews = new Set(value?.inspection?.artifactPreviews ?? []);
  function find(entry) {
    if (!entry || typeof entry !== "object") return;
    for (const [key, child] of Object.entries(entry)) {
      if (tokenKey(key) && typeof child === "string" && child) secrets.add(child);
      else find(child);
    }
  }
  find(value);
  function cleanText(entry, replaceKnown = true) {
    if (replaceKnown) for (const secret of secrets) entry = entry.replaceAll(secret, () => {
      notice.occurrences++;
      return "[redacted bearer]";
    });
    entry = entry.replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, () => {
      notice.occurrences++;
      return "[redacted bearer]";
    }).replace(/("(?:token|[^"]*lease[^"]*token)"\s*:\s*")([^"]+)(")/gi, (match, start, value2, end) => {
      if (value2 === "[redacted bearer]") return match;
      notice.occurrences++;
      return `${start}[redacted bearer]${end}`;
    });
    return entry;
  }
  function clean(entry) {
    if (typeof entry === "string") return cleanText(entry);
    if (Array.isArray(entry)) return entry.map(clean);
    if (!entry || typeof entry !== "object") return entry;
    const preview = previews.has(entry) && typeof entry.content === "string" ? redactPreview(entry, secrets, notice) : null;
    const result = Object.fromEntries(Object.entries(entry).filter(([key]) => {
      if (!tokenKey(key)) return true;
      notice.fields++;
      return false;
    }).map(([key, child]) => [key, preview && key === "content" ? cleanText(preview.content, false) : clean(child)]));
    if (preview?.boundaryWithheldBytes) {
      result.boundaryWithheldBytes = (entry.boundaryWithheldBytes ?? 0) + preview.boundaryWithheldBytes;
    }
    return result;
  }
  return { value: clean(value), notice };
}
function redactReport(value) {
  const result = redaction(value);
  const boundaries = (value.redactions?.boundaries ?? 0) + result.notice.boundaries;
  return { ...result.value, redactions: {
    fields: (value.redactions?.fields ?? 0) + result.notice.fields,
    occurrences: (value.redactions?.occurrences ?? 0) + result.notice.occurrences,
    ...boundaries || value.redactions?.boundaries !== void 0 ? { boundaries } : {}
  } };
}
var redactionNotice = (view) => {
  const { fields = 0, occurrences = 0, boundaries = 0 } = view.redactions ?? {};
  return fields || occurrences || boundaries ? `Redactions applied: ${fields} bearer fields omitted; ${occurrences} known bearer occurrences replaced across captured content.` + (boundaries ? ` Conservative boundary withholding: ${boundaries} truncated preview suffixes could continue as known bearers; withheld without inspecting omitted bytes, not confirmed secret occurrences.` : "") + " Digests identify retained originals; previews are redacted derivatives. Secret detection is not exhaustive." : "No supported bearer redactions detected in captured content; this is not a guarantee of secret removal.";
};
var generatedLink = (value) => typeof value === "string" && /^[a-z0-9-]+\.html(?:#[a-z0-9-]+)?$/.test(value);
var referenceAnchor = (ref) => `ref-${hash(ref).slice(0, 32)}`;
var artifactPreviewLimits = Object.freeze({ perArtifactBytes: 64 * 1024, aggregateBytes: 1024 * 1024 });
var artifactPreviewPolicy = "Artifact preview budgets: 64 KiB per artifact (shared by bundle members), 1 MiB across this report, measured in source bytes before redaction/encoding. Full retained files, SHA-256 identities, required questions/criteria and full message history are not truncated by these budgets.";
function artifactPreviewNotice(preview) {
  if (preview.gap) return `Preview unavailable \u2014 evidence gap: ${preview.gap}`;
  if (!preview.previewState) return "Legacy preview metadata: byte budget and completeness unavailable; rebuild the report.";
  const count = `${preview.previewBytes} of ${preview.sourceSize} source bytes captured; ${preview.omittedBytes} bytes omitted.` + (preview.boundaryWithheldBytes ? ` Conservative boundary withholding: ${preview.boundaryWithheldBytes} captured source bytes replaced as a possible known-bearer prefix; the omitted continuation was not inspected. These bytes still spend the source-prefix budget.` : "");
  if (preview.previewState === "complete") return `Complete preview. ${count}`;
  return `Presentation limitation \u2014 ${preview.previewState === "omitted" ? "No preview: budget cannot supply a complete text character or any source bytes." : "Limited prefix preview; remainder not embedded."} ${count} Limits: ${preview.limitReasons.join(", ")}. This is not a failed source acceptance or an evidence gap; full retained-file identity was verified.`;
}
var snapshotWarning = "Snapshot \u2014 not live. Recorded lifecycle is historical truth, not a new acceptance or shipping decision. Current proof checks and their gaps are listed; historical proof is not reaccepted. Files can change after generation.";

// src/core/lib/coordination-runtime/report-render.mjs
import { createHash as createHash2 } from "node:crypto";
var text = (value) => value === null || value === void 0 ? "unavailable" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
var actor = (value) => value ? `${value.role} \xB7 run ${value.runId}` : "unavailable";
var paragraph = (value) => ({ type: "paragraph", text: text(value) });
var table = (caption, headers, rows) => ({ type: "table", caption, headers, rows });
var detail = (title, blocks) => ({ type: "details", title, blocks });
var recordDetail = (record) => detail(
  `Full registry metadata: ${record.ref ?? record.id ?? "record"}`,
  [{ type: "pre", text: text(record) }]
);
var row = (cells, ref = null) => ({ cells, ref });
var cell = (value, ref = null, href = null) => ({ text: text(value), ref, href });
var link = (label, href) => ({ type: "link", text: label, href });
var refs = (values) => (values ?? []).map((ref) => cell(ref, ref));
var refsCell = (values) => ({ refs: refs(values) });
var unavailable = "unavailable";
var money = (cost) => cost && typeof cost === "object" && Number.isFinite(cost.amount) && /^[A-Z]{3}$/.test(cost.currency ?? "") && ["attempt", "session-cumulative"].includes(cost.scope) ? `${cost.currency} ${cost.amount} \xB7 ${cost.scope} \xB7 session ${text(cost.sessionId)}` : unavailable;
var usage = (value) => value ? `${text(value.totalPremiumRequests)} premium-request units; ${text(value.totalNanoAiu)} nano-AIU; ${text(value.scope)}; session ${text(value.sessionId)}` : unavailable;
var provenance = (record) => record.provenance?.tier ?? "declared";
function inspectionPaths(view) {
  const digest = createHash2("sha256");
  const add = (value) => digest.update(`${JSON.stringify(value)}
`);
  add([
    view.workspace,
    view.item?.id,
    view.throughSeq,
    view.generatedAt,
    view.inspection?.threadId,
    view.inspection?.throughSeq,
    view.inspection?.previewBudget
  ]);
  for (const page of view.inspection?.messagePages ?? []) {
    add(["message-page", page.length]);
    for (const entry of page) add(entry);
  }
  for (const preview of view.inspection?.artifactPreviews ?? []) add(preview);
  const key = digest.digest("hex").slice(0, 32);
  return {
    histories: (view.inspection?.messagePages ?? []).map((_, i) => `history-${key}-${i + 1}.html`),
    artifacts: (view.inspection?.artifactPreviews ?? []).map((_, i) => `artifact-${key}-${i + 1}.html`)
  };
}
function verdictTable(title, records) {
  return table(
    title,
    ["Record / verdict", "Actor / independence", "Revision / integrity", "Evidence references"],
    records.map((r) => row([
      cell(`${r.ref}
${r.kind}: ${r.verdict ?? r.decision ?? r.outcome}
Provenance: ${provenance(r)}
${r.reason ?? ""}`),
      cell(`${actor(r.reviewer ?? r.authority)}
Independence: ${r.independent === null ? "not an independent review" : r.independent ? "independent" : "not independent"}`),
      cell(`${r.status} \xB7 ${r.integrity}
Criteria ${r.criteria_ref}
Declared time ${r.created_at}
Persisted event ${text(r.eventSeq)}`),
      refsCell(r.evidence_refs)
    ], r.ref))
  );
}
function sectionsFor(view) {
  const destinations = inspectionPaths(view);
  const messageLinks = new Map((view.inspection?.messagePages ?? []).flatMap((page, i) => page.map((entry) => [entry.ref, `${destinations.histories[i]}#${referenceAnchor(entry.ref)}`])));
  const decisions = view.decisions ?? [];
  const currentDecisions2 = decisions.filter((d) => ["current", "conflict"].includes(d.status));
  const historicalDecisions = decisions.filter((d) => !["current", "conflict"].includes(d.status));
  const reviews = view.reviews ?? [];
  const activeReviews = reviews.filter((r) => ["current", "conflict"].includes(r.status));
  const oldReviews = reviews.filter((r) => !["current", "conflict"].includes(r.status));
  const gaps = (view.gaps ?? []).map((g) => typeof g === "string" ? { message: g } : g);
  const history = view.history ?? {};
  const questions = view.questions ?? [];
  const messageRows = (view.messages ?? []).map((message) => row([
    cell(message.ref ?? message.id),
    cell(`Event ${text(message.eventSeq)} \xB7 declared ${text(message.created_at)}`),
    cell(`${message.sender_role ?? unavailable} \xB7 run ${message.sender_run ?? unavailable}
${message.kind ?? unavailable}`),
    cell(`${message.payloadExcerpt?.text ?? text(message.payload)}${message.payloadExcerpt?.truncated ? "\n[Limited preview; full payload retained in store.]" : ""}`),
    { refs: [
      ...refs([...message.artifact_refs ?? [], ...message.evidence_refs ?? []]),
      ...messageLinks.has(message.ref) ? [cell("Full message", null, messageLinks.get(message.ref))] : []
    ] }
  ], message.ref));
  const questionTable = (title, entries) => table(
    title,
    ["Question", "Context / ask / deadline", "Disposition / resolution"],
    entries.map((q) => row([
      cell(q.ref),
      cell(`${q.context}
${q.ask}
Answer by: ${q.answer_by}`),
      cell(`${q.disposition} \xB7 ${q.status}
${q.resolution?.answer ?? "No resolution recorded"}`)
    ], q.ref))
  );
  const attempts = (view.attempts ?? []).flatMap((a) => {
    const observations = a.observations ?? [];
    const requested = table(
      `Attempt ${a.id ?? unavailable}`,
      ["Identity / status", "Requested role / profile / model / effort", "Context / independence"],
      [row([
        cell(`${a.ref ?? unavailable}
${a.status ?? a.disposition ?? unavailable}
Item version ${text(a.item_version)} \xB7 declared ${text(a.created_at)}`),
        cell(`${actor(a.target)}
Profile ${text(a.profile)}
Model ${text(a.requested_model)}
Effort ${text(a.requested_effort)}`),
        cell(`${text(a.context)}
Resume from ${text(a.resume_from)}
Session ${text(a.resume_session_id)}
Independence key ${text(a.independence_key)}`)
      ], a.ref)]
    );
    const observed = table(
      "Observed host measurements \u2014 no totals",
      ["Observation / provenance", "Observed role / profile / model / effort", "Tokens / duration", "Currency cost / usage"],
      observations.length ? observations.map((o) => row([
        cell(`${o.observationId}
Provenance: observed
${o.source} \xB7 captured ${o.capturedAt}
${o.facts.status} / ${o.facts.liveness}
Session ${text(o.facts.sessionId)}`),
        cell(`${text(o.facts.actualRole)}
${text(o.facts.actualProfile)}
Model ${text(o.facts.actualModel)}
Effort ${text(o.facts.actualEffort)}`),
        cell(`Input ${text(o.facts.inputTokens)}
Output ${text(o.facts.outputTokens)}
Duration ${text(o.facts.durationMs)} ms
Exit ${text(o.facts.exitCode)}`),
        cell(`Cost ${money(o.facts.cost)}
Usage ${usage(o.facts.usage)}`)
      ])) : [row([
        cell("No host observation"),
        cell("Model unavailable"),
        cell("Tokens / duration unavailable"),
        cell(`Cost ${money(a.cost)} \xB7 usage unavailable`)
      ])]
    );
    return [requested, observed, paragraph(`Attempt gaps: ${(a.gaps ?? []).join(", ") || "none recorded"}`), recordDetail(a)];
  });
  const sections = [
    {
      id: "outcome",
      title: "Outcome and current state",
      blocks: [
        paragraph(view.item?.outcome ?? "Outcome unavailable"),
        table("Recorded state and authority", ["Recorded lifecycle", "Current proof checks", "Authority / revision"], [row([
          cell(view.item?.state),
          cell(`${view.integrity?.status ?? "unavailable"} \u2014 not a new acceptance decision`),
          cell(`Scope ${text(view.item?.scope_authority)}
Completion ${text(view.item?.completion_authority)}
Version ${text(view.item?.version)}
Criteria ${text(view.item?.criteriaRef)}`)
        ])]),
        table(
          "Blockers \u2014 terminal follow-ups do not reopen lifecycle",
          ["Reference", "Required action"],
          (view.blockers ?? []).map((b) => row([cell(b.ref), cell(b.ask ?? b.context ?? b.kind)]))
        ),
        table(
          "Evidence gaps and limitations",
          ["Severity / reference", "Gap"],
          gaps.map((g) => row([cell(`${g.severity ?? "gap"} \xB7 ${g.ref ?? ""}`), cell(g.message)]))
        )
      ]
    },
    {
      id: "changes",
      title: "Changes and important decisions",
      blocks: [
        paragraph(`Declared scope \u2014 not verified changes: ${(view.item?.touches ?? []).join(", ") || "none recorded"}`),
        paragraph("Git paths below are derived read-only from exact registered base/head in the bound project, with renames disabled (add/delete pairs). Recorded artifact revisions are not a diff. No before/after change semantics are inferred for non-Git evidence."),
        table(
          "Changed paths and recorded revision evidence",
          ["Path / source", "Recorded status / provenance", "Exact revision"],
          (view.changes ?? []).map((c) => row([
            cell(`${c.path}
${c.ref}`),
            cell(`${c.kind === "git" ? "Git changed path" : "Recorded artifact revision"} \xB7 ${c.status}
Provenance: ${c.provenance}`),
            cell(c.kind === "git" ? `Project ${c.projectId}
Base ${c.base}
Head ${c.head}` : `SHA-256 ${c.digest}`)
          ]))
        ),
        table(
          "Latest recorded handoff rationale \u2014 declared, not verified changes",
          ["Handoff", "Recorded excerpt", "Full retained message"],
          (view.messages ?? []).filter((message) => message.kind === "handoff").slice(-1).map((message) => row([
            cell(message.ref),
            cell(message.payloadExcerpt?.text ?? text(message.payload)),
            cell("Full message", null, messageLinks.get(message.ref))
          ]))
        ),
        paragraph("Important decisions below retain recorded rationale; report generation supplies no new approval. Full handoff rationale remains reachable in the addressed thread section."),
        verdictTable("Current decisions", currentDecisions2),
        ...currentDecisions2.map(recordDetail),
        detail(
          `Historical / superseded decisions (${historicalDecisions.length})`,
          [
            verdictTable("Historical decisions \u2014 not reaccepted by this report", historicalDecisions),
            ...historicalDecisions.map(recordDetail)
          ]
        )
      ]
    },
    {
      id: "coverage",
      title: "Criteria-to-evidence coverage and exact artifacts",
      blocks: [
        paragraph("Coverage is explicit, not inferred from a model response, lifecycle state or item-level approval. Pending means not supplied yet; a broken positive claim is a gap."),
        table(
          "Acceptance criteria and exact support",
          ["Criterion", "Coverage", "Verdicts / evidence"],
          (view.criteria ?? []).map((c) => row([
            cell(c.text),
            cell(`${c.status}
${c.explanation ?? ""}`),
            refsCell([...c.verdictRefs ?? [], ...c.evidenceRefs ?? []])
          ]))
        ),
        detail(
          "Required reviews, artifacts and dependencies (complete metadata)",
          [{ type: "pre", text: text(view.obligations) }]
        )
      ]
    },
    {
      id: "artifacts",
      title: "Exact artifacts and retained references",
      blocks: [
        paragraph("Registered source locations remain inert text. Linked previews display captured retained bytes as escaped text or hex, never executable HTML, images or downloads. These redacted derivatives do not confer acceptance."),
        paragraph(artifactPreviewPolicy),
        ...view.artifacts?.length ? view.artifacts.flatMap((a) => [
          table(a.title ?? a.ref, ["Artifact / producer", "Exact subject / criteria", "Status / classification"], [row([
            cell(`${a.ref}
${actor(a.producer)}`),
            cell(`${text(a.subject)}
Criteria ${text(a.criteria_ref)}`),
            cell(`${a.status} \xB7 ${a.integrity}
Provenance: declared
${a.classification} \xB7 ${a.media_type}`)
          ], a.ref)]),
          table(
            "Retained snapshot identities",
            ["Source path", "SHA-256 digest", "Retained path"],
            (a.snapshots ?? []).map((s) => row([cell(s.path), cell(s.digest), cell(s.snapshot_path)]))
          ),
          paragraph(`Retained manifest: ${text(a.manifest_path)}`),
          ...(view.inspection?.artifactPreviews ?? []).flatMap((p, i) => p.ref === a.ref ? [
            paragraph(artifactPreviewNotice(p)),
            link(p.gap ? "Preview unavailable \u2014 inspect recorded gap" : p.previewState === "omitted" ? "No preview \u2014 inspect presentation limitation" : "Inert retained preview", destinations.artifacts[i])
          ] : []),
          recordDetail(a),
          ...(a.assets ?? []).flatMap((asset) => [
            paragraph(`Asset ${asset.asset_id}: ${asset.disposition} / ${asset.validity} \xB7 canonical target ${asset.target}`),
            detail("Asset disposition and validity history", [{ type: "pre", text: text(asset) }])
          ])
        ]) : [paragraph("No registered artifacts. Artifact obligations remain visible above.")]
      ]
    },
    {
      id: "reviews",
      title: "Independent verdicts and uncertainty",
      blocks: [
        verdictTable("Current reviews", activeReviews),
        ...activeReviews.map(recordDetail),
        detail(
          `Historical / superseded reviews (${oldReviews.length})`,
          [
            verdictTable("Historical reviews \u2014 original verdict retained, not current acceptance", oldReviews),
            ...oldReviews.map(recordDetail)
          ]
        ),
        verdictTable("Evidence provenance and outcomes", view.evidence ?? []),
        ...(view.evidence ?? []).map(recordDetail)
      ]
    },
    {
      id: "history",
      title: "Addressed thread and execution history",
      blocks: [
        questionTable("Unresolved questions and terminal follow-ups", questions.filter((q) => q.status === "open")),
        detail(
          `Addressed questions (${questions.filter((q) => q.status === "answered").length})`,
          [
            questionTable("Addressed history", questions.filter((q) => q.status === "answered")),
            ...questions.filter((q) => q.status === "answered").map(recordDetail)
          ]
        ),
        paragraph(`Recent message preview: ${view.messages?.length ?? 0} of ${text(history.totalMessages)}. ${history.limitation ?? "Full history remains in the coordination store."}`),
        detail("Recent messages (limited preview)", [table(
          "Recent messages in persisted event order",
          ["Message", "Chronology", "Sender / kind", "Payload excerpt", "References"],
          messageRows
        )]),
        ...destinations.histories.length ? [link("Full and older messages", destinations.histories[0])] : [paragraph("No captured messages. No live data is fetched by this document.")],
        detail("Captured history scope", [paragraph(`Sequence cursor: ${text(history.cursor)}. Captured item/thread only, through sequence ${view.throughSeq}.`)])
      ]
    },
    {
      id: "attempts",
      title: "Attempts, models and usage",
      blocks: [
        paragraph("Requested is not observed. Unknown models, tokens, duration and costs remain unavailable. Premium-request units and nano-AIU are not dollars. Session-cumulative checkpoints overlap: no sums, currency conversion or per-attempt attribution is performed."),
        ...attempts.length ? attempts : [paragraph("No attempts recorded. Observed model and cost unavailable.")],
        detail(
          `Effect intent / outcome history (${view.effects?.length ?? 0})`,
          (view.effects ?? []).map(recordDetail)
        )
      ]
    }
  ];
  const artifacts = sections.find((s) => s.id === "artifacts");
  sections.find((s) => s.id === "coverage").blocks.push(...artifacts.blocks);
  return sections.filter((s) => s !== artifacts);
}
var css = `
:root{color-scheme:light dark;--bg:#f4f6f8;--ink:#172c3d;--paper:#fff;--line:#a9b7c2;--muted:#425b70;--accent:#174d85}
*{box-sizing:border-box}html{font:16px/1.55 system-ui,sans-serif;background:var(--bg);color:var(--ink)}
body{margin:0}header,main,footer{max-width:1200px;margin:auto;padding:24px}header{border-bottom:3px solid var(--accent)}
h1{font-size:clamp(1.45rem,3vw,2.25rem);line-height:1.25}h2{font-size:1.4rem;margin:0 0 16px}
p,td,th,h1,h2,summary,a,pre{overflow-wrap:anywhere;word-break:normal;min-width:0}
section{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:24px;margin:0 0 24px;min-width:0}
nav{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:18px}a{color:var(--accent);text-underline-offset:3px}
.stamp{color:var(--muted)}.warning{border-left:4px solid var(--accent);padding:8px 12px;background:var(--paper)}
.subject{color:var(--muted);font-size:.95rem;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}.status-strip{font-weight:650;background:var(--paper);border:1px solid var(--line);padding:12px}
.skip{position:absolute;left:12px;top:-200px;padding:8px;background:var(--paper);z-index:2}.skip:focus{top:10px}
:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
table{width:100%;table-layout:fixed;border-collapse:collapse;margin:18px 0;font-size:.93rem}
caption{text-align:left;font-weight:700;margin:0 0 8px}th,td{text-align:left;vertical-align:top;padding:10px;border:1px solid var(--line);white-space:pre-wrap}
th{background:var(--bg)}td a{display:inline-block}details{border:1px solid var(--line);border-radius:6px;padding:12px;margin:14px 0}
summary{cursor:pointer;font-weight:650}pre{white-space:pre-wrap;font-size:.86rem;max-width:100%;margin:14px 0}
@media(max-width:600px){header,main,footer{padding:12px}section{padding:14px;margin-bottom:16px}table,thead,tbody,tr,th,td{display:block;width:100%}thead{position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden}tr{border:1px solid var(--line);margin:12px 0}td{border:0;border-bottom:1px solid var(--line);padding:8px}td:last-child{border-bottom:0}td::before{content:attr(data-label);display:block;font-weight:700;color:var(--muted)}caption{display:block}details{padding:9px}}
@media(prefers-color-scheme:dark){:root{--bg:#121b23;--ink:#ecf1f5;--paper:#1b2935;--line:#728697;--muted:#c0d1df;--accent:#9dc8ff}}
@media print{.skip,nav{display:none}section{break-inside:avoid}details{border-color:#888}}
`;
function allRefs(sections) {
  const result = /* @__PURE__ */ new Set();
  function walk(blocks) {
    for (const block of blocks) {
      if (block.type === "table") block.rows.forEach((r) => {
        if (r.ref) result.add(r.ref);
      });
      if (block.type === "details") walk(block.blocks);
    }
  }
  sections.forEach((section) => walk(section.blocks));
  return result;
}
function renderHtml(input) {
  const view = redactReport(input);
  const sections = sectionsFor(view);
  const targets = allRefs(sections);
  const renderCell = (value) => value.refs ? value.refs.map(renderCell).join("<br>") || "None recorded" : generatedLink(value.href) ? `<a href="${escapeHtml(value.href)}">${escapeHtml(value.text)}</a>` : value.ref && targets.has(value.ref) ? `<a href="#${referenceAnchor(value.ref)}">${escapeHtml(value.text)}</a>` : escapeHtml(value.text);
  function blocksHtml(blocks) {
    return blocks.map((block) => {
      if (block.type === "paragraph") return `<p>${escapeHtml(block.text)}</p>`;
      if (block.type === "link") return `<p>${generatedLink(block.href) ? `<a href="${escapeHtml(block.href)}">${escapeHtml(block.text)}</a>` : escapeHtml(block.text)}</p>`;
      if (block.type === "pre") return `<pre>${escapeHtml(block.text)}</pre>`;
      if (block.type === "details") return `<details><summary>${escapeHtml(block.title)}</summary>${blocksHtml(block.blocks)}</details>`;
      return `<table><caption>${escapeHtml(block.caption)}</caption><thead><tr>${block.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${block.rows.length ? block.rows.map((r) => `<tr${r.ref ? ` id="${referenceAnchor(r.ref)}"` : ""}>${r.cells.map((c, i) => `<td data-label="${escapeHtml(block.headers[i])}">${renderCell(c)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${block.headers.length}">None recorded.</td></tr>`}</tbody></table>`;
    }).join("\n");
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">
<title>Coordination evidence report</title><style>${css}</style></head><body>
<a class="skip" href="#main">Skip to report</a><header><p>CORE \xB7 OFFLINE COORDINATION REPORT</p>
<h1>Coordination evidence report</h1>
${subjectHtml(view)}
<p class="status-strip">${escapeHtml(statusLine(view))}</p>
<p class="stamp">Workspace ${escapeHtml(view.workspace?.id)} \xB7 item ${escapeHtml(view.item?.id)} \xB7 version ${escapeHtml(view.item?.version)}<br>Through sequence ${escapeHtml(view.throughSeq)} \xB7 generated <time datetime="${escapeHtml(view.generatedAt)}">${escapeHtml(view.generatedAt)}</time></p>
<p class="warning">${escapeHtml(snapshotWarning)}</p>
<p class="stamp">${escapeHtml(redactionNotice(view))}</p>
<nav aria-label="Report sections">${sections.map((s) => `<a href="#${s.id}">${escapeHtml(s.title)}</a>`).join("")}</nav></header>
<main id="main" tabindex="-1">${sections.map((s) => `<section id="${s.id}" aria-labelledby="${s.id}-heading"><h2 id="${s.id}-heading">${escapeHtml(s.title)}</h2>${blocksHtml(s.blocks)}</section>`).join("\n")}</main>
<footer><p>Derived private report. No authoritative state was changed by export. Artifact content is not embedded or executed.</p></footer></body></html>
`;
}
function renderMarkdown(input) {
  const view = redactReport(input);
  const sections = sectionsFor(view);
  const cellText = (value) => value.refs ? value.refs.map(cellText).join("<br>") || "None recorded" : generatedLink(value.href) ? `[${escapeMarkdown(value.text)}](${value.href})` : escapeMarkdown(value.text);
  function blocksMarkdown(blocks) {
    return blocks.map((block) => {
      if (block.type === "paragraph") return escapeMarkdown(block.text);
      if (block.type === "link") return generatedLink(block.href) ? `[${escapeMarkdown(block.text)}](${block.href})` : escapeMarkdown(block.text);
      if (block.type === "pre") return `<pre>${escapeHtml(block.text)}</pre>`;
      if (block.type === "details") return `<details><summary>${escapeHtml(block.title)}</summary>

${blocksMarkdown(block.blocks)}

</details>`;
      return `**${escapeMarkdown(block.caption)}**

| ${block.headers.map(escapeMarkdown).join(" | ")} |
| ${block.headers.map(() => "---").join(" | ")} |
${block.rows.length ? block.rows.map((r) => `| ${r.cells.map(cellText).join(" | ")} |`).join("\n") : `| None recorded ${block.headers.slice(1).map(() => "| ").join("")}|`}`;
    }).join("\n\n");
  }
  return `# Coordination evidence report

Subject: ${escapeMarkdown(view.item?.title)}

${escapeMarkdown(statusLine(view))}

Workspace ${escapeMarkdown(view.workspace?.id)} \xB7 item ${escapeMarkdown(view.item?.id)} \xB7 version ${escapeMarkdown(view.item?.version)}

Through sequence ${escapeMarkdown(view.throughSeq)} \xB7 generated ${escapeMarkdown(view.generatedAt)}

${escapeMarkdown(snapshotWarning)}

${escapeMarkdown(redactionNotice(view))}

${sections.map((s) => `## ${escapeMarkdown(s.title)}

${blocksMarkdown(s.blocks)}`).join("\n\n")}
`;
}
function statusLine(view) {
  const blockers = view.blockers?.length ?? 0;
  return `Recorded state: ${text(view.item?.state)} \xB7 Proof checks: ${view.integrity?.status ?? "unavailable"} (not acceptance) \xB7 Blockers: ${blockers}${blockers ? " \u2014 inspect required actions below." : " recorded; check pending criteria and gaps before acting."}`;
}
function subjectHtml(view) {
  const full = text(view.item?.title);
  const chars = [...full];
  return `<p class="subject">Subject: ${escapeHtml(chars.length > 140 ? `${chars.slice(0, 137).join("")}\u2026` : full)}</p><details><summary>Full recorded subject</summary><p>${escapeHtml(full)}</p></details>`;
}
function offlinePage(view, title, contents, links = []) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">
<title>${escapeHtml(title)}</title><style>${css}</style></head><body><a class="skip" href="#main">Skip to report</a>
<header><h1>${escapeHtml(title)}</h1>${subjectHtml(view)}<p class="status-strip">${escapeHtml(statusLine(view))}</p>
<p class="stamp">Workspace ${escapeHtml(view.workspace?.id)} \xB7 item ${escapeHtml(view.item?.id)} \xB7 through sequence ${escapeHtml(view.throughSeq)} \xB7 generated ${escapeHtml(view.generatedAt)}</p>
<p class="warning">${escapeHtml(snapshotWarning)}</p><p>${escapeHtml(redactionNotice(view))}</p>
<nav aria-label="Offline inspection">${links.filter((l) => generatedLink(l.href)).map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.text)}</a>`).join(" ")}</nav></header>
<main id="main" tabindex="-1">${contents}</main></body></html>
`;
}
function renderCompanions(view, reportFile) {
  const paths = inspectionPaths(view);
  const back = { text: "Back to captured report", href: reportFile };
  const messages = (view.inspection?.messagePages ?? []).map((page, i) => {
    const links = [back];
    if (i > 0) links.push({ text: "Newer messages", href: paths.histories[i - 1] });
    if (i < paths.histories.length - 1) links.push({ text: "Older messages", href: paths.histories[i + 1] });
    const bytes = offlinePage(
      view,
      "Captured message history",
      `<p>Full retained message records, newest events first. Provenance: declared durable thread. Page ${i + 1} of ${paths.histories.length}. Missing records are gaps, not empty payloads.</p>` + page.map((entry) => `<section id="${referenceAnchor(entry.ref)}"><h2>${escapeHtml(entry.ref)} \xB7 event ${escapeHtml(entry.eventSeq)}</h2><pre>${escapeHtml(entry.gap ?? text(entry.record))}</pre></section>`).join(""),
      links
    );
    return { file: paths.histories[i], kind: "messages", bytes };
  });
  const artifacts = (view.inspection?.artifactPreviews ?? []).map((preview, i) => {
    const content = preview.encoding === "latin1" && preview.content !== null ? Buffer.from(preview.content, "latin1").toString("hex").match(/.{1,64}/g)?.join("\n") ?? "" : preview.content;
    const bytes = offlinePage(view, "Inert retained artifact preview", `<section><h2>Captured retained bytes</h2>
<p>Provenance: derived preview of declared artifact ${escapeHtml(preview.ref)} \xB7 ${escapeHtml(preview.status)}.</p>
<p>Source ${escapeHtml(preview.path)} \xB7 retained ${escapeHtml(preview.retainedPath)} \xB7 registered full-source SHA-256 ${escapeHtml(preview.sourceDigest)} \xB7 verified retained size ${escapeHtml(preview.sourceSize)} bytes. This is not a prefix or preview digest.</p>
<p>${escapeHtml(artifactPreviewPolicy)}</p><p>${escapeHtml(artifactPreviewNotice(preview))}</p>
<p>${escapeHtml(preview.encoding === "latin1" ? "Hexadecimal representation of captured bytes only (redaction before encoding)." : "Escaped UTF-8 of captured bytes only. Markup is text, never executed.")}</p>
<pre>${escapeHtml(preview.gap ?? content ?? "No preview embedded.")}</pre></section>`, [back]);
    return { file: paths.artifacts[i], kind: "artifact-preview", bytes };
  });
  return [...messages, ...artifacts];
}
function renderLanding(metadata) {
  return offlinePage(
    metadata.view,
    "Coordination evidence report",
    "<section><h2>Stable offline entry point</h2><p>This landing selects the most recently exported complete generation, not live state. Older immutable snapshots are retained. Opening a captured report does not run evidence.</p></section>",
    [{ text: "Open captured report", href: metadata.html.file }]
  ) + `<!-- kai-current ${metadata.through_seq} ${metadata.html.digest} ${hash(JSON.stringify({ ...metadata, landing: void 0 }))} -->
`;
}

// src/core/lib/coordination-runtime/report-paths.mjs
function reportPaths({ root, itemId, throughSeq, digest }) {
  workspaceManifest(root);
  if (typeof itemId !== "string" || itemId.length === 0 || !itemId.isWellFormed() || Buffer.byteLength(itemId) > 8192) {
    throw new RuntimeError("INVALID_INPUT", "report itemId must be nonempty well-formed text of at most 8192 bytes");
  }
  const relativeDirectory = `.kai/review/coordination/item-${hash(itemId)}`;
  const directory = assertWorkspacePath(root, relativeDirectory);
  const indexPath = assertWorkspacePath(root, `${relativeDirectory}/index.html`);
  if (throughSeq === void 0 && digest === void 0) return { directory, indexPath };
  if (!Number.isSafeInteger(throughSeq) || throughSeq < 0 || !/^[0-9a-f]{64}$/.test(digest ?? "")) {
    throw new RuntimeError("INVALID_INPUT", "report generation requires a sequence and lowercase SHA-256 digest");
  }
  const stem = `snapshot-${throughSeq}-${digest.slice(0, 48)}`;
  const pathFor = (extension) => {
    const path = assertWorkspacePath(root, `${relativeDirectory}/${stem}.${extension}`);
    if (process.platform === "win32" && path.length > 259) {
      throw new RuntimeError("INVALID_INPUT", "report path exceeds the offline browser limit; use a shorter workspace root");
    }
    return path;
  };
  return { directory, indexPath, path: pathFor("html"), markdownPath: pathFor("md"), metadataPath: pathFor("json") };
}
function readExisting(path) {
  let fd;
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) {
      throw new RuntimeError("INVALID_INPUT", "report output must be a regular unshared file");
    }
    fd = openSync(path, "r");
    const current = fstatSync(fd);
    const bytes = readFileSync(fd);
    const after = fstatSync(fd);
    if (!current.isFile() || current.nlink !== 1 || current.ino !== stat.ino || current.dev !== stat.dev || after.mtimeMs !== current.mtimeMs || after.size !== bytes.length) {
      throw new RuntimeError("EVIDENCE_GAP", "report output changed identity or bytes while reading");
    }
    return bytes;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  } finally {
    if (fd !== void 0) closeSync(fd);
  }
}
function checkExisting(path, bytes) {
  const current = readExisting(path);
  if (current !== null && !current.equals(Buffer.from(bytes))) {
    throw new RuntimeError("EVIDENCE_GAP", "immutable report output already exists with different bytes or identity");
  }
  return current !== null;
}
function reportMemberPath({ root, itemId, file }) {
  reportPaths({ root, itemId });
  if (!/^[a-z0-9-]+\.(html|md|json|lock|new)$/.test(file)) {
    throw new RuntimeError("INVALID_INPUT", "report member must be a generated basename");
  }
  const path = assertWorkspacePath(root, `.kai/review/coordination/item-${hash(itemId)}/${file}`);
  if (process.platform === "win32" && path.length > 259) {
    throw new RuntimeError("INVALID_INPUT", "report member exceeds the offline browser path limit");
  }
  return path;
}
function ownedLanding(root, itemId, indexPath) {
  const bytes = readExisting(indexPath);
  if (bytes === null) return null;
  const reject = () => {
    throw new RuntimeError("EVIDENCE_GAP", "stable index is unrecognized, changed, incomplete or belongs to another workspace/item");
  };
  const match = /<!-- kai-current (\d+) ([a-f0-9]{64}) ([a-f0-9]{64}) -->\n$/.exec(bytes.toString("utf8"));
  if (!match) reject();
  const paths = reportPaths({ root, itemId, throughSeq: Number(match[1]), digest: match[2] });
  let metadata;
  try {
    metadata = JSON.parse(readExisting(paths.metadataPath));
  } catch {
    reject();
  }
  const manifest = workspaceManifest(root);
  if (metadata?.schema_version !== 2 || metadata.kind !== "kai-coordination-report" || metadata.derived !== true || metadata.workspace?.id !== manifest.workspace_id || metadata.workspace?.root !== normalized(root) || metadata.item?.id !== itemId || metadata.through_seq !== Number(match[1]) || metadata.html?.digest !== match[2] || metadata.html?.file !== basename(paths.path) || metadata.markdown?.file !== basename(paths.markdownPath) || !Array.isArray(metadata.companions) || metadata.landing?.file !== "index.html" || hash(bytes) !== metadata.landing.digest || match[3] !== hash(JSON.stringify({ ...metadata, landing: void 0 })) || metadata.view_digest !== hash(JSON.stringify(metadata.view)) || !bytes.equals(Buffer.from(renderLanding(metadata)))) reject();
  for (const member of [metadata.html, metadata.markdown, ...metadata.companions]) {
    const retained = readExisting(reportMemberPath({ root, itemId, file: member.file }));
    if (retained === null || hash(retained) !== member.digest) reject();
  }
  return bytes;
}
function inspectReportIndex({ root, itemId }) {
  const { indexPath } = reportPaths({ root, itemId });
  const bytes = ownedLanding(root, itemId, indexPath);
  if (bytes === null) return null;
  const match = /<!-- kai-current (\d+) ([a-f0-9]{64}) ([a-f0-9]{64}) -->\n$/.exec(bytes.toString("utf8"));
  const paths = reportPaths({ root, itemId, throughSeq: Number(match[1]), digest: match[2] });
  const metadata = JSON.parse(readExisting(paths.metadataPath));
  const view = metadata.view;
  if (view?.schema_version !== 1 || view.workspace?.id !== metadata.workspace.id || view.workspace?.root !== metadata.workspace.root || view.item?.id !== itemId || view.item?.version !== metadata.item.version || view.throughSeq !== metadata.through_seq || view.generatedAt !== metadata.generated_at || view.inspection && (view.inspection.threadId !== itemId || view.inspection.throughSeq !== metadata.through_seq)) {
    throw new RuntimeError("EVIDENCE_GAP", "selected report view identity does not match its workspace/item/generation");
  }
  const members = [metadata.html, metadata.markdown, ...metadata.companions];
  if (new Set(members.map((m) => m.file)).size !== members.length) {
    throw new RuntimeError("EVIDENCE_GAP", "selected report contains duplicate members");
  }
  return { paths, metadata };
}
function persistReportFiles({ root, itemId, throughSeq, digest, html, markdown, metadata, companions, landing }) {
  let paths = reportPaths({ root, itemId, throughSeq, digest });
  const files = [
    [paths.path, html],
    [paths.markdownPath, markdown],
    ...companions.map((c) => [reportMemberPath({ root, itemId, file: c.file }), c.bytes]),
    [paths.metadataPath, metadata]
  ];
  files.forEach(([path, bytes]) => checkExisting(path, bytes));
  mkdirSync(paths.directory, { recursive: true });
  paths = reportPaths({ root, itemId, throughSeq, digest });
  const member = (file) => reportMemberPath({ root, itemId, file });
  const lock = member("current.lock");
  let lockFd;
  try {
    lockFd = openSync(lock, "wx", 384);
  } catch (error) {
    if (error.code === "EEXIST") throw new RuntimeError("STORE_BUSY", "report landing writer lock exists; no automatic stale-lock removal", true);
    throw error;
  }
  let stage;
  let staged = false;
  try {
    stage = member(`index-${randomUUID()}.new`);
    const previous = ownedLanding(root, itemId, paths.indexPath);
    for (const [path, bytes] of files) {
      member(basename(path));
      try {
        writeFileSync(path, bytes, { flag: "wx", mode: 384 });
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        checkExisting(path, bytes);
      }
    }
    if (previous?.equals(Buffer.from(landing))) return { ...paths, throughSeq, digest };
    const fd = openSync(stage, "wx", 384);
    staged = true;
    try {
      writeFileSync(fd, landing);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    paths = reportPaths({ root, itemId, throughSeq, digest });
    if (previous === null) {
      linkSync(stage, paths.indexPath);
      unlinkSync(stage);
    } else {
      checkExisting(paths.indexPath, previous);
      if (!ownedLanding(root, itemId, paths.indexPath)?.equals(previous)) {
        throw new RuntimeError("EVIDENCE_GAP", "stable index changed during export");
      }
      renameSync(stage, paths.indexPath);
    }
    staged = false;
  } finally {
    try {
      if (staged) unlinkSync(stage);
    } finally {
      closeSync(lockFd);
      unlinkSync(lock);
    }
  }
  return { ...paths, throughSeq, digest };
}
var fileName = (path) => basename(path);

// src/core/lib/coordination-runtime/inspection.mjs
function inspectRuntime(root, { env = process.env, intent = "coordinate" } = {}) {
  const result = { errors: [], warnings: [], migrations: [], runtime: null };
  if (!["inspect", "coordinate"].includes(intent)) {
    result.errors.push("workspace intent must be inspect or coordinate");
    return result;
  }
  let store;
  try {
    const manifest = migrationManifest(root, [3, 4], env);
    if (existsSync(safePath(root, LOCK))) {
      result.migrations.push("incomplete/competing migration; explicit offline recovery required");
      result.warnings.push("migration lock exists; coordinated writes are held");
    }
    if (manifest.schema_version === 3) {
      result.migrations.push("schema 3 is inspect-only; explicit offline schema 4 migration required for coordination");
      if (existsSync(safePath(root, DATABASE))) result.warnings.push("unactivated database is not authority; inspect migration recovery");
      return result;
    }
    result.errors.push(...privateAdmission(root).errors);
    if (!existsSync(safePath(root, DATABASE))) {
      if (intent === "inspect") {
        result.warnings.push("schema 4 coordination database does not exist yet; this is the expected state before the authorized init and inspection will not create it");
      } else {
        result.errors.push("schema 4 coordination database is missing; inspection will not create it");
      }
      return result;
    }
    exactFile(root, DATABASE);
    store = openStore({ path: safePath(root, DATABASE), mode: "read" });
    readSnapshot(store, () => {
      const throughSeq = Number(store.database.prepare("SELECT COALESCE(MAX(seq),0) AS seq FROM events").get().seq);
      const items = [];
      const findings = [];
      const add = (item, section, headline, why, path = DATABASE) => findings.push({ section, item, tier: "derived", headline, why, path });
      for (const row2 of store.database.prepare("SELECT id FROM records WHERE kind='item' ORDER BY id").all()) {
        try {
          items.push(readRecord(store, "item", row2.id));
        } catch (error) {
          add(row2.id, "integrity", "runtime record is malformed", error.message);
        }
      }
      const sources = readLegacyRecords(store);
      for (const source of sources.filter((s) => s.status === "quarantined")) {
        result.warnings.push(`quarantined ${source.kind}/${source.declaredId ?? source.path}: ${source.issues.join("; ")}`);
        add(source.declaredId ?? source.path, "integrity", `quarantined legacy ${source.kind}`, source.issues.join("; "), source.path);
      }
      for (const item of items) {
        if (item.body.state === "blocked") add(item.id, "blocked", "recorded lifecycle is blocked", "Resolve recorded blockers through authorized runtime commands.");
        if (["release-ready", "deploying", "production-verification"].includes(item.body.state)) {
          add(item.id, "needs-you", "recorded lifecycle waits on an operator", "No deployment or production action is inferred.");
        }
        for (const dep of item.body.depends_on) {
          const upstream = items.find((i) => i.id === dep.item);
          if (!upstream) add(item.id, "integrity", "dependency is missing or quarantined", dep.item);
          else if (!TERMINAL.has(item.body.state) && !itemStateSatisfies(upstream, dep.requires)) {
            add(item.id, "blocked", "dependency gate is not satisfied", `${dep.item} requires ${dep.requires}`);
          }
        }
        try {
          projectContext(store, { itemId: item.id });
        } catch (error) {
          add(item.id, "unknown", "runtime context/evidence gap", error.message);
        }
        try {
          const report = inspectReportIndex({ root, itemId: item.id });
          const paths = reportPaths({ root, itemId: item.id });
          if (!report) {
            if (existsSync(paths.directory) && readdirSync(paths.directory).length) {
              result.warnings.push(`partial/old derived report for ${item.id}: no complete owned index`);
            }
          } else {
            const metadata = report.metadata;
            if (metadata.through_seq !== throughSeq || metadata.item.version !== item.version) {
              result.warnings.push(`stale derived report for ${item.id}: source sequence ${metadata.through_seq}, live ${throughSeq}; item version ${metadata.item.version}, live ${item.version}`);
            }
            const selected = /* @__PURE__ */ new Set([
              "index.html",
              basename2(report.paths.metadataPath),
              metadata.html.file,
              metadata.markdown.file,
              ...metadata.companions.map((c) => c.file)
            ]);
            const others = readdirSync(paths.directory).filter((file) => !selected.has(file));
            if (others.length) result.warnings.push(`older or partial derived output remains for ${item.id}; selected complete generation alone was verified`);
          }
        } catch (error) {
          result.warnings.push(`changed/incomplete derived report for ${item.id}: ${error.message}`);
        }
      }
      result.runtime = { throughSeq, items, findings, sources };
    });
    if (manifest.coordination_migration) {
      try {
        const { plan } = verifyMigration(root, { env });
        const live = new Map(sourceSnapshot(root).map((e) => [e.path, e.digest]));
        for (const file of plan.files.filter((f) => f.path !== ".kai/manifest.json")) {
          if (live.get(file.path) !== file.digest) result.warnings.push(`legacy source/view drift: ${file.path}; not imported as current authority`);
        }
      } catch (error) {
        result.warnings.push(`migration backup/receipt gap: ${error.message}`);
      }
    }
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    closeStore(store);
  }
  return result;
}

export {
  projectContext,
  readDetail,
  readMessages,
  hash,
  knownGap,
  redactReport,
  artifactPreviewLimits,
  snapshotWarning,
  renderHtml,
  renderMarkdown,
  renderCompanions,
  renderLanding,
  reportPaths,
  persistReportFiles,
  fileName,
  inspectRuntime
};

import {
  RuntimeError,
  canonicalJson,
  criteriaRef,
} from './contract.mjs';
import {effectiveApprovals} from './acceptance-verdicts.mjs';
import {
  readContextView,
  readMessagePage,
  readRecord,
} from './store.mjs';

const DEFAULT_MAX_BYTES = 24 * 1024;
const DEFAULT_RECENT_LIMIT = 8;
const MAX_RECENT_LIMIT = 8;
const MAX_MESSAGE_PAGE = 100;
const MAX_EXCERPT_BYTES = 512;
const TERMINAL = new Set(['completed', 'shipped', 'dropped']);

function invalid(message) {
  throw new RuntimeError('INVALID_INPUT', message);
}

function gap(message) {
  throw new RuntimeError('EVIDENCE_GAP', message);
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value === '') invalid(`${label} must be a string`);
}

function validateProjectionOptions(itemId, maxBytes, recentLimit) {
  assertNonEmptyString(itemId, 'context itemId');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    invalid('context maxBytes must be a positive safe integer');
  }
  if (!Number.isSafeInteger(recentLimit)
    || recentLimit < 0
    || recentLimit > MAX_RECENT_LIMIT) {
    invalid(`context recentLimit must be an integer from 0 through ${MAX_RECENT_LIMIT}`);
  }
}

function excerpt(value) {
  const source = typeof value === 'string' ? value : canonicalJson(value);
  const sourceBytes = Buffer.byteLength(source, 'utf8');
  if (sourceBytes <= MAX_EXCERPT_BYTES) {
    return {text: source, truncated: false};
  }
  const suffix = '…';
  const suffixBytes = Buffer.byteLength(suffix, 'utf8');
  let bytes = 0;
  let text = '';
  for (const character of source) {
    const characterBytes = Buffer.byteLength(character, 'utf8');
    if (bytes + characterBytes + suffixBytes > MAX_EXCERPT_BYTES) break;
    text += character;
    bytes += characterBytes;
  }
  return {text: `${text}${suffix}`, truncated: true};
}

function messageSummary(entry) {
  const message = entry.record.body;
  return {
    ref: `message:${entry.record.id}`,
    event_seq: entry.eventSeq,
    kind: message.kind,
    sender: {role: message.sender_role, runId: message.sender_run},
    recipient: message.recipient,
    parent_id: message.parent_id,
    basis_version: message.basis_version,
    created_at_declared: message.created_at,
    payload_excerpt: excerpt(message.payload),
    artifact_reference_count: message.artifact_refs.length,
    evidence_reference_count: message.evidence_refs.length,
  };
}

function detailIdentity(reference) {
  const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
  return match ? {kind: match[1].toLowerCase(), id: match[2]} : null;
}

function unique(values) {
  return [...new Set(values)];
}

function currentDecisions(view) {
  const effective = effectiveApprovals(
    view.approvals.map(({record}) => record.body),
    view.item.body,
  );
  const byId = new Map(view.approvals.map(entry => [entry.record.id, entry]));
  return effective.map(body => {
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
        evidence_verification: 'not_performed',
      },
    };
  }).sort((left, right) => left.entry.eventSeq - right.entry.eventSeq);
}

function unresolvedQuestions(view) {
  const waiting = new Set(view.item.body.waiting_on_questions);
  const terminal = TERMINAL.has(view.item.body.state);
  return view.questions.map(entry => {
    const question = entry.record;
    if (!question) gap('item references a missing question');
    if (question.itemId !== view.item.id
      || (!terminal && question.body.status !== 'open')
      || (!terminal && waiting.has(question.id) && question.body.blocking !== true)) {
      gap(`question/${question.id} is not an unresolved question for item/${view.item.id}`);
    }
    if (entry.eventSeq === null) {
      gap(`question/${question.id} has no persisted opening-message chronology`);
    }
    if (!entry.openedMessage
      || entry.openedMessage.itemId !== view.item.id
      || entry.openedMessage.body.message_id !== question.body.opened_message_id
      || entry.openedMessage.body.kind !== 'question') {
      gap(`question/${question.id} references a missing opening message`);
    }
    for (const message of entry.answerMessages) {
      if (!message || message.itemId !== view.item.id || message.body.kind !== 'answer') {
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
        disposition: TERMINAL.has(view.item.body.state) ? 'historical-follow-up'
          : question.body.blocking ? 'blocking' : 'nonblocking',
        status: question.body.status,
        asker: question.body.asker,
        recipient: question.body.recipient,
        context: question.body.context,
        ask: question.body.ask,
        answer_by: question.body.answer_by,
        opened_message_ref: `message:${question.body.opened_message_id}`,
        answer_message_refs: question.body.answer_message_ids.map(id => `message:${id}`),
      },
    };
  }).sort((left, right) => left.entry.eventSeq - right.entry.eventSeq
    || left.entry.record.id.localeCompare(right.entry.record.id));
}

function recoveryHold(view) {
  if (view.item.body.recovery_hold === null) return null;
  const entry = view.recoveryHold;
  const attempt = entry?.record;
  if (!attempt || attempt.itemId !== view.item.id
    || attempt.id !== view.item.body.recovery_hold
    || attempt.body.disposition !== 'conflicting-partial-work') {
    gap(`item/${view.item.id} references a missing or mismatched recovery attempt`);
  }
  if (!entry.message || entry.eventSeq === null
    || entry.message.itemId !== view.item.id || entry.message.body.kind !== 'recovery') {
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
    evidence_refs: attempt.body.recovery_evidence_ids.map(id => `evidence:${id}`),
    required_resolution: {
      authority: 'operator',
      kind: 'operator-recovery-resolution',
      attempt_id: attempt.id,
      stale_lease_token: attempt.body.stale_lease.token,
      criteria_ref: criteriaRef(view.item.body),
      disposition: 'safe-to-resume',
      scope: TERMINAL.has(view.item.body.state) ? 'before-restoration' : 'before-resumption',
      release: 'persist exact operator approval, then separately authorized item.restore',
      evidence_verification: 'not_performed',
    },
  };
}

function dependencies(view) {
  return view.dependencies.map(({dependency, record}) => {
    if (!record) gap(`item/${view.item.id} references missing dependency item/${dependency.item}`);
    return {
      item_id: record.id,
      item_version: record.version,
      state: record.body.state,
      requires: dependency.requires,
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
  references.set(`${kind}:${id}`, {kind, id});
}

function selectedEvidenceReferences(
  view,
  questions,
  decisions,
  selectedMessages,
  latestHandoff,
) {
  const values = [
    ...view.item.body.context_artifacts,
    ...questions.flatMap(({entry}) =>
      [entry.openedMessage, ...entry.answerMessages].flatMap(message => [
        ...message.body.artifact_refs, ...message.body.evidence_refs,
      ])),
    ...(view.recoveryHold?.record?.body.recovery_evidence_ids ?? [])
      .map(id => `evidence:${id}`),
    ...decisions.flatMap(({entry}) => entry.record.body.evidence_refs),
    ...(latestHandoff
      ? [
          ...latestHandoff.record.body.artifact_refs,
          ...latestHandoff.record.body.evidence_refs,
        ]
      : []),
    ...selectedMessages.flatMap(({record}) => [
      ...record.body.artifact_refs,
      ...record.body.evidence_refs,
    ]),
  ];
  const details = new Map(view.referencedDetails.map(entry => [entry.reference, entry.record]));
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
    beforeSeq: selectedMessages.length > 0
      ? selectedMessages[0].eventSeq
      : view.throughSeq + 1,
    remainingCount,
  };
}

function packetFor(view, {
  questionEntries,
  recovery,
  decisionEntries,
  dependencyEntries,
  latestHandoff,
  selectedMessages,
}) {
  const references = new Map();
  for (const question of questionEntries) {
    addReference(references, 'question', question.entry.record.id);
    addReference(references, 'message', question.entry.record.body.opened_message_id);
    for (const id of question.entry.record.body.answer_message_ids) {
      addReference(references, 'message', id);
    }
  }
  if (recovery) {
    addReference(references, 'attempt', view.recoveryHold.record.id);
    addReference(references, 'message', view.recoveryHold.message.id);
  }
  for (const decision of decisionEntries) {
    addReference(references, 'approval', decision.entry.record.id);
  }
  if (latestHandoff) addReference(references, 'message', latestHandoff.record.id);
  for (const message of selectedMessages) {
    addReference(references, 'message', message.record.id);
  }

  const artifactEvidenceReferences = selectedEvidenceReferences(
    view,
    questionEntries,
    decisionEntries,
    selectedMessages,
    latestHandoff,
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
      outcome: item.body.outcome,
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
        expires_at: item.body.lease.expires_at,
      },
    },
    revision: {
      item_version: item.version,
      criteria_ref: criteriaRef(item.body),
      change_ref: item.body.change_ref,
      updated_at: item.body.updated_at,
    },
    acceptance: item.body.acceptance,
    review_requirements: item.body.review_requirements,
    artifact_obligations: {
      artifact_expectation: item.body.artifact_expectation,
      artifact_expectation_reason: item.body.artifact_expectation_reason,
      artifact_class: item.body.artifact_class,
      durability: item.body.durability,
      validity_owner: item.body.validity_owner,
      artifact_targets: item.body.artifact_targets,
    },
    dependencies: dependencyEntries,
    unresolved_questions: questionEntries.map(({summary}) => summary),
    recovery_hold: recovery,
    blockers: [
      ...questionEntries.filter(({summary}) => summary.disposition === 'blocking')
        .map(({summary}) => summary),
      ...(recovery && !TERMINAL.has(item.body.state)
        ? [{kind: 'recovery-hold', ref: recovery.ref, required_authority: 'operator'}] : []),
    ],
    decisions: decisionEntries.map(({summary}) => summary),
    latest_handoff: latestHandoff ? messageSummary(latestHandoff) : null,
    selected_artifact_evidence_references: artifactEvidenceReferences,
    recent_messages: selectedMessages.map(messageSummary),
    references: referenceList,
    history_cursor: cursor,
  };
  return {
    text: canonicalJson(packet),
    references: referenceList,
    historyCursor: cursor,
  };
}

/**
 * Build the complete bounded agent-visible context packet used by report and
 * CLI consumers. The returned text already contains its references and cursor;
 * callers must not append an unbounded history list.
 */
export function projectContext(store, {
  itemId,
  maxBytes = DEFAULT_MAX_BYTES,
  recentLimit = DEFAULT_RECENT_LIMIT,
}) {
  validateProjectionOptions(itemId, maxBytes, recentLimit);
  const view = readContextView(store, {itemId, recentLimit});
  if (!view.item) gap(`item/${itemId} does not exist`);

  const questionEntries = unresolvedQuestions(view);
  const recovery = recoveryHold(view);
  const decisionEntries = currentDecisions(view);
  const dependencyEntries = dependencies(view);
  const latestHandoff = view.latestHandoff === null
    ? null
    : ensureMessage(view.latestHandoff, 'latest handoff', itemId);
  const recent = view.recentMessages.map((entry, index) =>
    ensureMessage(entry, `recent message ${index + 1}`, itemId));
  const fixed = {
    questionEntries,
    recovery,
    decisionEntries,
    dependencyEntries,
    latestHandoff,
  };

  let selectedMessages = [];
  let projection = packetFor(view, {...fixed, selectedMessages});
  let bytes = Buffer.byteLength(projection.text, 'utf8');
  if (bytes > maxBytes) {
    throw new RuntimeError(
      'CONTEXT_BUDGET',
      `Required context uses ${bytes} bytes; limit is ${maxBytes}`,
    );
  }

  for (let count = 1; count <= recent.length; count += 1) {
    const candidateMessages = recent.slice(-count);
    const candidate = packetFor(view, {...fixed, selectedMessages: candidateMessages});
    const candidateBytes = Buffer.byteLength(candidate.text, 'utf8');
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
    historyCursor: projection.historyCursor,
  };
}

/**
 * Read one exact persisted record for report/CLI drill-down. This is historical
 * inspection only and does not re-run current acceptance or evidence gates.
 */
export function readDetail(store, {kind, id}) {
  assertNonEmptyString(kind, 'detail kind');
  assertNonEmptyString(id, 'detail id');
  const record = readRecord(store, kind, id);
  if (!record) gap(`${kind}/${id} does not exist`);
  return record;
}

/**
 * Read one bounded older-history page ordered by persisted event sequence.
 * Returns {messages, hasMore, nextCursor}; nextCursor is null or
 * {threadId, beforeSeq}. Only projectContext's initial cursor has an exact
 * remainingCount. Caller counts are ignored; each page uses LIMIT + 1.
 */
export function readMessages(store, {
  threadId,
  beforeSeq = null,
  limit = 50,
}) {
  assertNonEmptyString(threadId, 'message threadId');
  if (beforeSeq !== null
    && (!Number.isSafeInteger(beforeSeq) || beforeSeq < 1)) {
    invalid('message beforeSeq must be a positive safe integer or null');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_MESSAGE_PAGE) {
    invalid(`message limit must be an integer from 1 through ${MAX_MESSAGE_PAGE}`);
  }
  return readMessagePage(store, {threadId, beforeSeq, limit});
}

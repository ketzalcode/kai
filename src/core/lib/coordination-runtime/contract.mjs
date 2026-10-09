import {createHash} from 'node:crypto';
import {
  HEX_DIGEST,
  assertBoolean,
  assertChangedOnly,
  assertExactKeys,
  assertNonEmptyString,
  assertNullableString,
  assertStringArray,
  assertTimestamp,
  assertUuid,
  canonicalJson,
  invalid,
  isPlainObject,
  parseEpicId,
  parseTypedId,
  validateActor,
  validateNullableActor,
  validateNullableSubject,
  validateSubjectRef,
} from './contract-primitives.mjs';
import {
  validateHostCommand, validateHostMutation, validateHostRecord,
} from './host-schema.mjs';
import {
  HIERARCHY_KINDS,
  validateHierarchyRecord,
  validateParentCommand,
  validateParentCommandMutation,
} from './hierarchy-contract.mjs';
import {
  validateTaskCommand,
  validateTaskCommandMutation,
} from './task-contract.mjs';
import {
  COMMAND_KINDS,
  RECORD_KINDS,
  commandKind,
  recordKind,
} from './schema.mjs';

export {
  RuntimeError,
  SUBJECT_KINDS,
  assertExactKeys,
  assertNonEmptyString,
  assertTimestamp,
  canonicalJson,
  commandDigest,
  isPlainObject,
  validateActor,
  validateSubjectRef,
} from './contract-primitives.mjs';

export {
  PARENT_DISPOSITIONS,
  PARENT_STATES,
  parentClosureRef,
  validateHierarchyRecord,
  validateHierarchyRelationships,
  validateParentCommand,
  validateParentCommandMutation,
} from './hierarchy-contract.mjs';

export {
  validateTaskBody,
  validateTaskCommand,
  validateTaskCommandMutation,
} from './task-contract.mjs';

export {
  COORDINATION_SCHEMA,
  COMMAND_KINDS,
  HIERARCHY_KINDS,
  PARENT_COMMAND_KINDS,
  RECORD_KINDS,
  TASK_COMMAND_KINDS,
  commandKind,
  recordKind,
} from './schema.mjs';

/**
 * @typedef {{role: string, runId: string}} Actor
 * @typedef {{kind: string, id: string}} HierarchySubject
 * @typedef {{kind: string, id: string, subject: HierarchySubject|null,
 *   version: number, body: object}} Record
 * @typedef {{operationId: string, kind: string, actor: Actor,
 *   recordKind: string, recordId: string, expectedVersion: number,
 *   leaseToken: string|null, payload: object}} Command
 * @typedef {{actor: Actor, actions: string[], recordKind: string,
 *   recordId: string, basisRef: string}} AuthorityGrant
 * @typedef {{roles: string[], grants: AuthorityGrant[]}} Authority
 * @typedef {{ok: true, operationId: string, recordVersion: number,
 *   eventSeq: number, data: object}
 *   | {ok: false, code: string, message: string, retryable: boolean}} Result
 */

export const ERROR_CODES = new Set([
  'INVALID_INPUT',
  'SCHEMA_MISMATCH',
  'VERSION_CONFLICT',
  'LEASE_CONFLICT',
  'OPERATION_CONFLICT',
  'AUTHORITY_REQUIRED',
  'ROLE_UNAVAILABLE',
  'MODEL_UNAVAILABLE',
  'EVIDENCE_GAP',
  'CONTEXT_BUDGET',
  'STORE_BUSY',
  'RECOVERY_REQUIRED',
  'UNSUPPORTED_HOST',
]);

export const REVIEW_VERDICTS = new Set(['approved', 'changes-requested', 'blocked']);
export const APPROVAL_KINDS = new Set([
  'scope',
  'completion',
  'operator-deploy-start',
  'operator-deploy-complete',
  'operator-recovery-resolution',
]);
export const EVIDENCE_KINDS = new Set([
  'dod-dimension',
  'deployment',
  'production-verification',
  'recovery-reconciliation',
  'parent-completion',
]);
export const DOD_DIMENSIONS = new Set([
  'scope-true',
  'verified',
  'reviewed',
  'shippable-safely',
  'documented',
  'coordination-closed',
]);

const QUESTION_KINDS = new Set(['fact', 'decision', 'reply', 'action']);
const MESSAGE_KINDS = new Set(['question', 'answer', 'handoff', 'recovery']);
const PROVENANCE_KINDS = new Set(['live-peer', 'durable-thread', 'operator']);
const RECOVERY_DISPOSITIONS = new Set([
  'safe-to-resume',
  'conflicting-partial-work',
]);

export function validateHierarchySubject(subject, label = 'subject') {
  if (!isPlainObject(subject)) invalid(`${label} must be an object`);
  assertExactKeys(subject, new Set(['kind', 'id']), label);
  if (!HIERARCHY_KINDS.has(subject.kind)) invalid(`${label}.kind is unsupported`);
  if (subject.kind === 'epic') parseEpicId(subject.id, `${label}.id`);
  else parseTypedId(subject.id, subject.kind, `${label}.id`);
  return subject;
}

export function subjectRef(subject, version) {
  validateHierarchySubject(subject);
  if (!Number.isSafeInteger(version) || version < 1) {
    invalid('subject version must be a positive safe integer');
  }
  return `${subject.kind}/${subject.id}@${version}`;
}

export function subjectEquals(left, right) {
  if (left === null || right === null || left === undefined || right === undefined) return false;
  validateHierarchySubject(left, 'left subject');
  validateHierarchySubject(right, 'right subject');
  return left.kind === right.kind && left.id === right.id;
}

function relationshipBindings(record) {
  const body = record.body;
  if (record.kind === 'epic') {
    return [...body.required_features, ...body.optional_features]
      .map(id => ({subject: {kind: 'feature', id}, requiredState: null}));
  }
  if (record.kind === 'feature') {
    return [
      {subject: {kind: 'epic', id: body.epic_id}, requiredState: null},
      ...[...body.required_requirements, ...body.optional_requirements]
        .map(id => ({subject: {kind: 'requirement', id}, requiredState: null})),
      ...body.depends_on_features.map(dependency => ({
        subject: {kind: 'feature', id: dependency.feature},
        requiredState: dependency.requires,
      })),
    ];
  }
  if (record.kind === 'requirement') {
    return [
      {subject: {kind: 'feature', id: body.feature_id}, requiredState: null},
      ...[...body.required_tasks, ...body.optional_tasks]
        .map(id => ({subject: {kind: 'task', id}, requiredState: null})),
    ];
  }
  return [
    {subject: {kind: 'feature', id: body.feature_id}, requiredState: null},
    ...body.satisfies.map(id => ({
      subject: {kind: 'requirement', id},
      requiredState: null,
    })),
    ...body.depends_on.map(dependency => ({
      subject: {kind: 'task', id: dependency.task},
      requiredState: dependency.requires,
    })),
  ];
}

export function criteriaRef(record, lookup) {
  if (!isPlainObject(record) || !HIERARCHY_KINDS.has(record.kind)
    || record.id !== record.body?.id) {
    invalid('criteriaRef requires a hierarchy record');
  }
  const subject = validateHierarchySubject({kind: record.kind, id: record.id});
  if (!Number.isSafeInteger(record.version) || record.version < 1) {
    invalid('criteriaRef record version must be a positive safe integer');
  }
  const relationships = relationshipBindings(record);
  if (relationships.length > 0 && typeof lookup !== 'function') {
    invalid('criteriaRef requires a relationship lookup');
  }
  const relationshipRefs = relationships.map(({subject: relationship, requiredState}) => {
    const related = lookup(relationship.kind, relationship.id);
    if (!related || related.kind !== relationship.kind || related.id !== relationship.id
      || !Number.isSafeInteger(related.version) || related.version < 1) {
      invalid(`criteriaRef relationship ${relationship.kind}/${relationship.id} is missing`);
    }
    return {
      subject: subjectRef(relationship, related.version),
      required_state: requiredState,
    };
  }).sort((left, right) => left.subject.localeCompare(right.subject)
    || String(left.required_state).localeCompare(String(right.required_state)));
  const fields = record.kind === 'task'
    ? [
        'outcome', 'acceptance', 'completion_authority', 'review_requirements',
        'artifact_expectation', 'artifact_expectation_reason', 'artifact_class',
        'durability', 'validity_owner', 'artifact_targets',
      ]
    : ['outcome', 'acceptance', 'completion_authority'];
  const criteria = Object.fromEntries(fields.map(key => [key, record.body[key]]));
  if (record.kind === 'task' && record.body.context_artifacts?.length) {
    criteria.context_artifacts = record.body.context_artifacts;
  }
  return createHash('sha256').update(canonicalJson({
    subject: subjectRef(subject, record.version),
    criteria,
    relationships: relationshipRefs,
    immutable_subject: record.kind === 'task' ? record.body.change_ref : null,
  })).digest('hex');
}

export function isProducingRun(task, actor) {
  return Array.isArray(task.producing_actors)
    && task.producing_actors.some(producer => producer.runId === actor.runId);
}

function validateStringMap(value, label) {
  if (!isPlainObject(value)) invalid(`${label} must be an object`);
  canonicalJson(value);
}

function validateLease(value, label) {
  if (value === null) return;
  assertExactKeys(value, new Set([
    'holder', 'token', 'version_at_grant', 'acquired_at', 'expires_at',
  ]), label);
  validateActor(value.holder, `${label}.holder`);
  assertNonEmptyString(value.token, `${label}.token`);
  if (!Number.isSafeInteger(value.version_at_grant) || value.version_at_grant < 1) {
    invalid(`${label}.version_at_grant must be a positive safe integer`);
  }
  assertTimestamp(value.acquired_at, `${label}.acquired_at`);
  assertTimestamp(value.expires_at, `${label}.expires_at`);
}

function validateQuestionBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version',
    'question_id',
    'subject',
    'asker',
    'recipient',
    'kind',
    'blocking',
    'status',
    'context',
    'ask',
    'answer_by',
    'opened_message_id',
    'answer_message_ids',
    'resolution',
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  for (const key of ['question_id', 'recipient', 'context', 'ask', 'answer_by']) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  validateActor(body.asker, `${label}.asker`);
  if (!QUESTION_KINDS.has(body.kind)) invalid(`${label}.kind is unsupported`);
  assertBoolean(body.blocking, `${label}.blocking`);
  if (!new Set(['open', 'answered']).has(body.status)) {
    invalid(`${label}.status is unsupported`);
  }
  assertUuid(body.opened_message_id, `${label}.opened_message_id`);
  assertStringArray(body.answer_message_ids, `${label}.answer_message_ids`);
  if (body.resolution !== null) {
    assertExactKeys(body.resolution, new Set([
      'answer', 'lane', 'provenance', 'message_id', 'answered_at', 'sender',
    ]), `${label}.resolution`);
    assertNonEmptyString(body.resolution.answer, `${label}.resolution.answer`);
    if (body.resolution.lane !== 'in-lane') {
      invalid(`${label}.resolution.lane must be "in-lane"`);
    }
    if (!PROVENANCE_KINDS.has(body.resolution.provenance)) {
      invalid(`${label}.resolution.provenance is unsupported`);
    }
    assertUuid(body.resolution.message_id, `${label}.resolution.message_id`);
    assertTimestamp(body.resolution.answered_at, `${label}.resolution.answered_at`);
    validateActor(body.resolution.sender, `${label}.resolution.sender`);
  }
}

function validateMessageBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version',
    'message_id',
    'subject',
    'thread_id',
    'parent_id',
    'sender_role',
    'sender_run',
    'recipient',
    'kind',
    'created_at',
    'basis_version',
    'payload',
    'artifact_refs',
    'evidence_refs',
    'provenance',
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.message_id, `${label}.message_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  for (const key of ['thread_id', 'sender_role', 'sender_run', 'recipient']) {
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
  if (body.kind === 'question') {
    validateQuestionContent(body.payload);
  } else if (body.kind === 'answer') {
    validateAnswerContent(body.payload);
  } else if (body.kind === 'handoff') {
    validateHandoffContent(body.payload);
  } else {
    assertExactKeys(body.payload, new Set([
      'observed', 'disposition', 'staleLeaseToken', 'newLeaseToken',
    ]), `${label}.payload`);
    assertNonEmptyString(body.payload.observed, `${label}.payload.observed`);
    if (!RECOVERY_DISPOSITIONS.has(body.payload.disposition)) {
      invalid(`${label}.payload.disposition is unsupported`);
    }
    assertNonEmptyString(body.payload.staleLeaseToken,
      `${label}.payload.staleLeaseToken`);
    assertNullableString(body.payload.newLeaseToken,
      `${label}.payload.newLeaseToken`);
  }
  assertStringArray(body.artifact_refs, `${label}.artifact_refs`);
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`);
  if (!PROVENANCE_KINDS.has(body.provenance)) invalid(`${label}.provenance is unsupported`);
}

function validateReviewBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version',
    'review_id',
    'subject',
    'reviewer',
    'kind',
    'content_ref',
    'criteria',
    'criteria_ref',
    'supersedes',
    'verdict',
    'finding_refs',
    'evidence_refs',
    'created_at',
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.review_id, `${label}.review_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (body.subject.kind !== 'task') invalid(`${label}.subject must be a Task`);
  validateActor(body.reviewer, `${label}.reviewer`);
  assertNonEmptyString(body.kind, `${label}.kind`);
  validateSubjectRef(body.content_ref, `${label}.content_ref`);
  assertStringArray(body.criteria, `${label}.criteria`, {nonEmpty: true});
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  validateSupersedes(body.supersedes, body.review_id, label);
  if (!REVIEW_VERDICTS.has(body.verdict)) invalid(`${label}.verdict is unsupported`);
  assertStringArray(body.finding_refs, `${label}.finding_refs`);
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, {nonEmpty: true});
  assertTimestamp(body.created_at, `${label}.created_at`);
}

function validateCriteriaRef(value, label) {
  if (typeof value !== 'string' || !HEX_DIGEST.test(value)) {
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
  assertExactKeys(value, new Set(['environment', 'environment_class', 'deployment_id']), label);
  assertNonEmptyString(value.environment, `${label}.environment`);
  if (value.environment_class !== 'production') invalid(`${label} must confirm a production environment`);
  assertNonEmptyString(value.deployment_id, `${label}.deployment_id`);
}

function validateApprovalBody(body, label) {
  const required = new Set([
    'schema_version',
    'approval_id',
    'subject',
    'authority',
    'kind',
    'content_ref',
    'criteria_ref',
    'supersedes',
    'deployment',
    'recovery',
    'decision',
    'evidence_refs',
    'reason',
    'created_at',
  ]);
  assertExactKeys(body, new Set([...required, 'provenance', 'recorded_at_subject_version']), label, required);
  if (Object.hasOwn(body, 'provenance')) validateDecisionProvenance(body.provenance, `${label}.provenance`);
  if (Object.hasOwn(body, 'recorded_at_subject_version')
    && (!Number.isSafeInteger(body.recorded_at_subject_version) || body.recorded_at_subject_version < 1)) {
    invalid(`${label}.recorded_at_subject_version must be a positive subject version`);
  }
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.approval_id, `${label}.approval_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  validateActor(body.authority, `${label}.authority`);
  if (!APPROVAL_KINDS.has(body.kind)) invalid(`${label}.kind is unsupported`);
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  validateSupersedes(body.supersedes, body.approval_id, label);
  if (body.kind === 'operator-recovery-resolution') {
    if (body.subject.kind !== 'task') invalid(`${label}.subject must be a Task for recovery resolution`);
    if (body.content_ref !== null) invalid(`${label}.content_ref must be null for recovery resolution`);
    assertExactKeys(body.recovery, new Set([
      'attempt_id', 'stale_lease_token', 'disposition', 'resume_role',
    ]), `${label}.recovery`);
    assertUuid(body.recovery.attempt_id, `${label}.recovery.attempt_id`);
    assertNonEmptyString(body.recovery.stale_lease_token, `${label}.recovery.stale_lease_token`);
    if (body.recovery.disposition !== 'safe-to-resume') {
      invalid(`${label}.recovery.disposition must be safe-to-resume`);
    }
    assertNonEmptyString(body.recovery.resume_role, `${label}.recovery.resume_role`);
    if (body.recovery.resume_role === 'operator') {
      invalid(`${label}.recovery.resume_role cannot lease to operator`);
    }
  } else {
    if (body.subject.kind === 'task') validateSubjectRef(body.content_ref, `${label}.content_ref`);
    else if (body.kind !== 'completion' || body.content_ref !== null) {
      invalid(`${label} parent subjects support completion approval without a content_ref`);
    }
    if (body.recovery !== null) invalid(`${label}.recovery is only for recovery resolution`);
  }
  if (body.kind === 'operator-deploy-start' || body.kind === 'operator-deploy-complete') {
    if (body.subject.kind !== 'task') invalid(`${label}.subject must be a Task for deployment confirmation`);
    validateDeploymentContext(body.deployment, `${label}.deployment`);
  } else if (body.deployment !== null) {
    invalid(`${label}.deployment is only for deployment confirmation`);
  }
  if (!new Set(['approved', 'rejected']).has(body.decision)) {
    invalid(`${label}.decision is unsupported`);
  }
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, {nonEmpty: true});
  assertNonEmptyString(body.reason, `${label}.reason`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}

function validateEvidenceBody(body, label) {
  const required = new Set([
    'schema_version',
    'evidence_id',
    'subject',
    'kind',
    'content_ref',
    'criteria_ref',
    'supersedes',
    'dimension',
    'outcome',
    'evidence_refs',
    'reason',
    'data',
    'created_at',
  ]);
  assertExactKeys(body, new Set([...required, 'provenance']), label, required);
  if (Object.hasOwn(body, 'provenance')) {
    assertExactKeys(body.provenance, new Set(['tier', 'capture']), `${label}.provenance`);
    if (!new Set(['observed', 'declared']).has(body.provenance.tier)) invalid(`${label}.provenance.tier is unsupported`);
    if (body.provenance.tier === 'observed') validateCapture(body.provenance.capture);
    else if (body.provenance.capture !== null) invalid('declared provenance cannot claim capture');
  }
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.evidence_id, `${label}.evidence_id`);
  validateSupersedes(body.supersedes, body.evidence_id, label);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (!EVIDENCE_KINDS.has(body.kind)) invalid(`${label}.kind is unsupported`);
  validateNullableSubject(body.content_ref, `${label}.content_ref`);
  if (body.kind === 'parent-completion') {
    if (body.subject.kind === 'task') invalid(`${label}.subject must be a parent hierarchy subject`);
    if (body.content_ref !== null) invalid(`${label}.content_ref must be null for parent completion`);
  } else if (body.subject.kind !== 'task') {
    invalid(`${label}.subject must be a Task for execution evidence`);
  }
  if (body.kind === 'recovery-reconciliation') {
    if (body.criteria_ref !== null) invalid(`${label}.criteria_ref must be null for recovery`);
    if (body.supersedes.length > 0) invalid(`${label} recovery reconciliation cannot supersede observations`);
  } else {
    validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  }
  if (body.kind === 'recovery-reconciliation' && body.content_ref !== null) {
    invalid(`${label}.content_ref must be null for recovery reconciliation`);
  }
  if (!new Set(['recovery-reconciliation', 'parent-completion']).has(body.kind)
    && body.content_ref === null) {
    invalid(`${label}.content_ref is required`);
  }
  if (body.kind === 'dod-dimension') {
    if (!DOD_DIMENSIONS.has(body.dimension)) invalid(`${label}.dimension is unsupported`);
    if (!new Set(['clear', 'waived', 'gap']).has(body.outcome)) {
      invalid(`${label}.outcome is unsupported for a DoD dimension`);
    }
    if (body.outcome === 'waived') assertNonEmptyString(body.reason, `${label}.reason`);
  } else {
    if (body.dimension !== null) invalid(`${label}.dimension must be null`);
    if (!new Set(['passed', 'failed']).has(body.outcome)) {
      invalid(`${label}.outcome is unsupported`);
    }
  }
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, {nonEmpty: true});
  assertNullableString(body.reason, `${label}.reason`);
  if (body.kind === 'dod-dimension') {
    assertExactKeys(body.data, new Set(), `${label}.data`);
  } else if (body.kind === 'deployment') {
    assertExactKeys(body.data, new Set(['environment', 'deployment_id']),
      `${label}.data`);
    assertNonEmptyString(body.data.environment, `${label}.data.environment`);
    assertNonEmptyString(body.data.deployment_id, `${label}.data.deployment_id`);
  } else if (body.kind === 'production-verification') {
    assertExactKeys(body.data, new Set(['environment', 'deployment_id', 'checks']), `${label}.data`);
    assertNonEmptyString(body.data.environment, `${label}.data.environment`);
    assertNonEmptyString(body.data.deployment_id, `${label}.data.deployment_id`);
    assertStringArray(body.data.checks, `${label}.data.checks`, {nonEmpty: true});
  } else if (body.kind === 'recovery-reconciliation') {
    assertExactKeys(body.data, new Set([
      'stale_lease_token', 'disposition', 'observed',
    ]), `${label}.data`);
    assertNonEmptyString(body.data.stale_lease_token,
      `${label}.data.stale_lease_token`);
    if (!RECOVERY_DISPOSITIONS.has(body.data.disposition)) {
      invalid(`${label}.data.disposition is unsupported`);
    }
    assertNonEmptyString(body.data.observed, `${label}.data.observed`);
  } else {
    assertExactKeys(body.data, new Set(), `${label}.data`);
  }
  assertTimestamp(body.created_at, `${label}.created_at`);
}

function validateGrantBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version',
    'grant_id',
    'subject',
    'actor',
    'actions',
    'record_kind',
    'record_id',
    'basis_ref',
    'lease_token',
    'issued_by',
    'created_at',
    'expires_at',
    'status',
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.grant_id, `${label}.grant_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (body.subject.kind !== 'task') invalid(`${label}.subject must be a Task`);
  validateActor(body.actor, `${label}.actor`);
  assertStringArray(body.actions, `${label}.actions`, {nonEmpty: true});
  if (!RECORD_KINDS.has(body.record_kind)) invalid(`${label}.record_kind is unsupported`);
  assertNonEmptyString(body.record_id, `${label}.record_id`);
  assertNonEmptyString(body.basis_ref, `${label}.basis_ref`);
  assertNonEmptyString(body.lease_token, `${label}.lease_token`);
  validateActor(body.issued_by, `${label}.issued_by`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  assertTimestamp(body.expires_at, `${label}.expires_at`);
  if (!new Set(['active', 'recovered', 'revoked']).has(body.status)) {
    invalid(`${label}.status is unsupported`);
  }
}

function validateAttemptBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version',
    'attempt_id',
    'subject',
    'grantor',
    'stale_lease',
    'observed',
    'disposition',
    'recovery_evidence_ids',
    'new_lease',
    'created_at',
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.attempt_id, `${label}.attempt_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (body.subject.kind !== 'task') invalid(`${label}.subject must be a Task`);
  validateActor(body.grantor, `${label}.grantor`);
  if (body.stale_lease === null) invalid(`${label}.stale_lease is required`);
  validateLease(body.stale_lease, `${label}.stale_lease`);
  assertNonEmptyString(body.observed, `${label}.observed`);
  if (!RECOVERY_DISPOSITIONS.has(body.disposition)) {
    invalid(`${label}.disposition is unsupported`);
  }
  assertStringArray(body.recovery_evidence_ids,
    `${label}.recovery_evidence_ids`, {nonEmpty: true});
  validateLease(body.new_lease, `${label}.new_lease`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}

export const ASSET_DISPOSITIONS = new Set([
  'scratch', 'draft', 'working', 'published', 'personal', 'archived', 'retracted', 'discarded',
]);
export const ASSET_VALIDITIES = new Set([
  'unknown', 'provisional', 'current', 'stale', 'expired', 'superseded', 'invalidated', 'retired',
]);
export const CLASSIFICATIONS = new Set(['public', 'internal', 'confidential', 'personal']);

function validateCaptureReference(value, label) {
  if (typeof value !== 'string' || !/^(host|artifact|evidence):[a-z0-9][a-z0-9._:-]*$/i.test(value)) {
    invalid(`${label} must be a logical host/artifact/evidence reference, never a machine path`);
  }
}

export function validateCapture(value) {
  assertExactKeys(value, new Set([
    'source', 'reference', 'actor', 'captured_at', 'command', 'exit_code', 'checks', 'classification', 'command_digest',
  ]), 'capture');
  validateCriteriaRef(value.command_digest, 'capture.command_digest');
  if (value.source !== 'host-command') invalid('capture.source must be host-command');
  validateCaptureReference(value.reference, 'capture.reference');
  validateActor(value.actor, 'capture.actor');
  assertTimestamp(value.captured_at, 'capture.captured_at');
  // Arguments can repeat; unlike rubric/check lists this is an ordered invocation.
  if (!Array.isArray(value.command) || value.command.length === 0) invalid('capture.command is required');
  value.command.forEach(entry => assertNonEmptyString(entry, 'capture.command entry'));
  if (!Number.isSafeInteger(value.exit_code)) invalid('capture.exit_code must be an integer');
  assertStringArray(value.checks, 'capture.checks');
  if (!CLASSIFICATIONS.has(value.classification)) invalid('capture.classification is unsupported');
  return value;
}

function validateDecisionProvenance(value, label) {
  assertExactKeys(value, new Set(['source', 'reference', 'attributed_to', 'captured_at']), label);
  if (!new Set(['host-interaction', 'attributed-supplied']).has(value.source)) invalid(`${label}.source is unsupported`);
  validateCaptureReference(value.reference, `${label}.reference`);
  assertNonEmptyString(value.attributed_to, `${label}.attributed_to`);
  assertTimestamp(value.captured_at, `${label}.captured_at`);
}

export function validateOperatorDecision(value) {
  const keys = ['source', 'reference', 'attributed_to', 'captured_at', 'subject', 'content_ref',
    'criteria_ref', 'kind', 'decision', 'deployment', 'recovery'];
  assertExactKeys(value, new Set(keys), 'operator decision');
  validateDecisionProvenance(Object.fromEntries(keys.slice(0, 4).map(key => [key, value[key]])), 'operator decision provenance');
  validateHierarchySubject(value.subject, 'operator decision subject');
  validateNullableSubject(value.content_ref, 'operator decision content_ref');
  validateCriteriaRef(value.criteria_ref, 'operator decision criteria_ref');
  if (!APPROVAL_KINDS.has(value.kind)) invalid('operator decision kind is unsupported');
  if (!new Set(['approved', 'rejected']).has(value.decision)) invalid('operator decision is unsupported');
  canonicalJson(value);
}

export function operatorDecisionActor(provenance) {
  validateDecisionProvenance(provenance, 'operator decision identity');
  return {role: 'operator', runId: `human:${createHash('sha256').update(canonicalJson(provenance)).digest('hex')}`};
}

function validateArtifactBody(body, label) {
  const required = new Set([
    'schema_version', 'artifact_id', 'subject', 'producer', 'content_ref', 'criteria_ref',
    'project_id', 'run_directory', 'snapshots', 'manifest_path', 'classification',
    'media_type', 'title', 'created_at',
  ]);
  assertExactKeys(body, new Set([...required, 'input_basis']), label, required);
  if (body.input_basis !== undefined) {
    if (!Array.isArray(body.input_basis)) invalid(`${label}.input_basis must be an array`);
    const references = new Set();
    for (const basis of body.input_basis) {
      assertExactKeys(basis, new Set(['reference', 'digest']), `${label}.input_basis entry`);
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
    assertExactKeys(snapshot, new Set(['path', 'digest', 'snapshot_path']), `${label}.snapshot`);
    assertNonEmptyString(snapshot.path, `${label}.snapshot.path`);
    assertNonEmptyString(snapshot.snapshot_path, `${label}.snapshot.snapshot_path`);
    validateCriteriaRef(snapshot.digest, `${label}.snapshot.digest`);
  }
  if ((body.content_ref.kind === 'git') !== (body.snapshots.length === 0)) invalid(`${label} requires exact non-Git snapshots`);
  assertNullableString(body.manifest_path, `${label}.manifest_path`);
  if ((body.content_ref.kind === 'git') !== (body.manifest_path === null)) invalid(`${label} requires non-Git manifest`);
  if (!CLASSIFICATIONS.has(body.classification)) invalid(`${label}.classification is unsupported`);
  for (const key of ['media_type', 'title']) assertNonEmptyString(body[key], `${label}.${key}`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}

function validateAssetBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version', 'asset_id', 'subject', 'artifact_id', 'revision', 'producer',
    'completion_authority', 'validity_owner', 'disposition', 'validity', 'target',
    'completion_approval_id', 'input_asset_ids', 'supersedes', 'superseded_by', 'history', 'updated_at',
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  for (const key of ['asset_id', 'artifact_id']) assertUuid(body[key], `${label}.${key}`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (!Number.isSafeInteger(body.revision) || body.revision < 1) invalid(`${label}.revision must be positive`);
  validateActor(body.producer, `${label}.producer`);
  assertNonEmptyString(body.completion_authority, `${label}.completion_authority`);
  assertNullableString(body.validity_owner, `${label}.validity_owner`);
  if (!ASSET_DISPOSITIONS.has(body.disposition) || !ASSET_VALIDITIES.has(body.validity)) invalid(`${label} has unsupported state`);
  assertNonEmptyString(body.target, `${label}.target`);
  for (const key of ['completion_approval_id', 'supersedes', 'superseded_by']) {
    if (body[key] !== null) assertUuid(body[key], `${label}.${key}`);
  }
  assertStringArray(body.input_asset_ids, `${label}.input_asset_ids`);
  for (const id of body.input_asset_ids) assertUuid(id, `${label}.input_asset_ids entry`);
  if (!Array.isArray(body.history) || body.history.length === 0) invalid(`${label}.history is required`);
  for (const entry of body.history) {
    assertExactKeys(entry, new Set(['disposition', 'validity', 'target', 'reason', 'at', 'at_subject_version']), `${label}.history entry`);
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
  if (command.kind === 'artifact.register') {
    const required = new Set([
      'artifactId', 'assetId', 'subject', 'projectId', 'classification', 'mediaType', 'title', 'inputAssetIds', 'at',
    ]);
    assertExactKeys(command.payload, new Set([...required, 'recoveryLeaseToken']), 'artifact.register payload', required);
    if (Object.hasOwn(command.payload, 'recoveryLeaseToken')) {
      assertNonEmptyString(command.payload.recoveryLeaseToken, 'artifact.register recoveryLeaseToken');
    }
    for (const key of ['artifactId', 'assetId']) assertUuid(command.payload[key], `artifact.register ${key}`);
    validateSubjectRef(command.payload.subject);
    assertNullableString(command.payload.projectId, 'artifact.register projectId');
    if (!CLASSIFICATIONS.has(command.payload.classification)) invalid('artifact.register classification is unsupported');
    for (const key of ['mediaType', 'title']) assertNonEmptyString(command.payload[key], `artifact.register ${key}`);
    assertStringArray(command.payload.inputAssetIds, 'artifact.register inputAssetIds');
    for (const id of command.payload.inputAssetIds) assertUuid(id, 'artifact.register inputAssetIds entry');
    assertTimestamp(command.payload.at, 'artifact.register at');
  } else if (command.kind === 'asset.transition') {
    assertExactKeys(command.payload, new Set([
      'assetId', 'disposition', 'validity', 'target', 'approvalId', 'supersedes', 'reason', 'at',
    ]), 'asset.transition payload');
    assertUuid(command.payload.assetId, 'asset.transition assetId');
    for (const key of ['approvalId', 'supersedes']) {
      if (command.payload[key] !== null) assertUuid(command.payload[key], `asset.transition ${key}`);
    }
    if (!ASSET_DISPOSITIONS.has(command.payload.disposition) || !ASSET_VALIDITIES.has(command.payload.validity)) invalid('asset.transition state is unsupported');
    assertNullableString(command.payload.target, 'asset.transition target');
    assertNonEmptyString(command.payload.reason, 'asset.transition reason');
    assertTimestamp(command.payload.at, 'asset.transition at');
  } else {
    assertExactKeys(command.payload, new Set(command.kind === 'evidence.register' ? ['body', 'tier'] : ['body']), `${command.kind} payload`);
    const kind = command.kind.split('.')[0];
    recordBodyValidators.get(kind)(command.payload.body, `${command.kind} body`);
    const subject = {kind: command.recordKind, id: command.recordId};
    if (!subjectEquals(command.payload.body.subject, subject)) {
      invalid(`${command.kind} must bind the primary hierarchy subject`);
    }
    if (kind === 'review' && command.recordKind !== 'task') {
      invalid('review.record requires an existing Task');
    }
    if (kind === 'approval' && command.recordKind !== 'task'
      && command.payload.body.kind !== 'completion') {
      invalid('only completion approvals may bind parent hierarchy subjects');
    }
    if (kind === 'evidence' && command.recordKind !== 'task'
      && command.payload.body.kind !== 'parent-completion') {
      invalid('only parent-completion evidence may bind parent hierarchy subjects');
    }
    if (Object.hasOwn(command.payload.body, 'provenance')) invalid('provenance is host-derived, not command input');
    if (Object.hasOwn(command.payload.body, 'recorded_at_subject_version')) invalid('recorded subject version is runtime-derived');
    if (kind === 'evidence' && !new Set(['observed', 'declared']).has(command.payload.tier)) invalid('evidence.register tier is unsupported');
  }
}

const recordBodyValidators = new Map([
  ['question', validateQuestionBody],
  ['attempt', validateAttemptBody],
  ['host-attempt', validateHostRecord],
  ['evidence', validateEvidenceBody],
  ['review', validateReviewBody],
  ['approval', validateApprovalBody],
  ['message', validateMessageBody],
  ['grant', validateGrantBody],
  ['artifact', validateArtifactBody],
  ['asset', validateAssetBody],
  ['effect', (body, label) => validateHostRecord(body, label, true)],
]);

function validateAtPayload(command, kind, keys) {
  if (!HIERARCHY_KINDS.has(command.recordKind)) invalid(`${kind} requires a hierarchy recordKind`);
  if (command.expectedVersion < 1) invalid(`${kind} requires an existing record version`);
  assertExactKeys(command.payload, new Set(keys), `${kind} payload`);
}

function validateHandoffContent(content) {
  assertExactKeys(content, new Set([
    'did', 'needs', 'assetState', 'authority', 'revalidation', 'questions',
  ]), 'task.handoff payload.content');
  for (const key of ['did', 'needs', 'assetState', 'authority', 'revalidation']) {
    assertNonEmptyString(content[key], `task.handoff payload.content.${key}`);
  }
  assertStringArray(content.questions, 'task.handoff payload.content.questions');
}

function validateMessagePayload(command, kind, contentValidator) {
  validateAtPayload(command, kind, [
    ...(kind === 'question.open' ? ['questionId'] : []),
    ...(kind === 'question.answer' ? ['questionId'] : []),
    'messageId',
    'parentId',
    'recipient',
    'kind',
    'createdAt',
    'content',
    'artifactRefs',
    'evidenceRefs',
    'provenance',
  ]);
  if (kind === 'question.open' || kind === 'question.answer') {
    assertNonEmptyString(command.payload.questionId, `${kind} payload.questionId`);
  }
  assertUuid(command.payload.messageId, `${kind} payload.messageId`);
  if (command.payload.parentId !== null) {
    assertUuid(command.payload.parentId, `${kind} payload.parentId`);
  }
  assertNonEmptyString(command.payload.recipient, `${kind} payload.recipient`);
  assertNonEmptyString(command.payload.kind, `${kind} payload.kind`);
  const expectedKind = kind === 'question.open' ? 'question' : 'answer';
  if (command.payload.kind !== expectedKind) {
    invalid(`${kind} payload.kind must be "${expectedKind}"`);
  }
  assertTimestamp(command.payload.createdAt, `${kind} payload.createdAt`);
  contentValidator(command.payload.content);
  assertStringArray(command.payload.artifactRefs, `${kind} payload.artifactRefs`);
  assertStringArray(command.payload.evidenceRefs, `${kind} payload.evidenceRefs`);
  if (!PROVENANCE_KINDS.has(command.payload.provenance)) {
    invalid(`${kind} payload.provenance is unsupported`);
  }
}

function validateQuestionContent(content) {
  assertExactKeys(content, new Set([
    'questionKind', 'blocking', 'context', 'ask', 'answerBy',
  ]), 'question.open payload.content');
  if (!QUESTION_KINDS.has(content.questionKind)) {
    invalid('question.open payload.content.questionKind is unsupported');
  }
  assertBoolean(content.blocking, 'question.open payload.content.blocking');
  assertNonEmptyString(content.context, 'question.open payload.content.context');
  assertNonEmptyString(content.ask, 'question.open payload.content.ask');
  assertNonEmptyString(content.answerBy, 'question.open payload.content.answerBy');
}

function validateAnswerContent(content) {
  assertExactKeys(content, new Set(['status', 'answer', 'lane', 'resolves']),
    'question.answer payload.content', new Set(['status', 'answer', 'lane']));
  if (content.status !== 'answered') {
    invalid('question.answer payload.content.status must be "answered"');
  }
  assertNonEmptyString(content.answer, 'question.answer payload.content.answer');
  if (content.lane !== 'in-lane' && content.lane !== 'out-of-lane') {
    invalid('question.answer payload.content.lane is unsupported');
  }
  if (Object.hasOwn(content, 'resolves')) {
    assertStringArray(content.resolves, 'question.answer payload.content.resolves', {nonEmpty: true});
    for (const id of content.resolves) assertUuid(id, 'question.answer payload.content.resolves entry');
    if (content.lane !== 'in-lane') invalid('out-of-lane answers cannot resolve contradictions');
  }
}

function validateRecover(command) {
  validateAtPayload(command, 'attempt.recover', [
    'attemptId',
    'observed',
    'disposition',
    'recoveryEvidenceIds',
    'redispatch',
    'createdAt',
    'expiresAt',
  ]);
  assertUuid(command.payload.attemptId, 'attempt.recover payload.attemptId');
  assertNonEmptyString(command.payload.observed, 'attempt.recover payload.observed');
  if (!RECOVERY_DISPOSITIONS.has(command.payload.disposition)) {
    invalid('attempt.recover payload.disposition is unsupported');
  }
  assertStringArray(command.payload.recoveryEvidenceIds,
    'attempt.recover payload.recoveryEvidenceIds');
  validateNullableActor(command.payload.redispatch, 'attempt.recover payload.redispatch');
  assertTimestamp(command.payload.createdAt, 'attempt.recover payload.createdAt');
  if (command.payload.expiresAt !== null) {
    assertTimestamp(command.payload.expiresAt, 'attempt.recover payload.expiresAt');
  }
  if (command.payload.disposition === 'safe-to-resume') {
    if ((command.payload.redispatch === null) !== (command.payload.expiresAt === null)) {
      invalid('safe recovery requires redispatch and expiresAt together, or neither');
    }
    if (command.payload.expiresAt !== null
      && Date.parse(command.payload.expiresAt) <= Date.parse(command.payload.createdAt)) {
      invalid('recovered lease expiresAt must be after createdAt');
    }
  } else if (command.payload.redispatch !== null || command.payload.expiresAt !== null) {
    invalid('conflicting recovery cannot redispatch or set expiresAt');
  }
}

const commandValidatorKinds = new Map([
  ['host', validateHostCommand],
  ['hierarchy', validateParentCommand],
  ['task', validateTaskCommand],
  ['producer', validateProducerCommand],
  ['message', command => command.kind === 'question.open'
    ? validateMessagePayload(command, 'question.open', validateQuestionContent)
    : validateMessagePayload(command, 'question.answer', validateAnswerContent)],
  ['recovery', validateRecover],
]);

const commandValidators = new Map([
  ...[...COMMAND_KINDS].map(kind => [
    kind,
    commandValidatorKinds.get(commandKind(kind).validator),
  ]),
]);

export function validateAuthority(authority) {
  assertExactKeys(authority, new Set(['roles', 'grants']), 'authority');
  assertStringArray(authority.roles, 'authority.roles');
  if (authority.roles.includes('operator')) {
    invalid('operator is a reserved endpoint, not an installed role');
  }
  if (!Array.isArray(authority.grants)) invalid('authority.grants must be an array');
  for (const [index, grant] of authority.grants.entries()) {
    const label = `authority.grants[${index}]`;
    assertExactKeys(grant, new Set([
      'actor', 'actions', 'recordKind', 'recordId', 'basisRef',
    ]), label);
    validateActor(grant.actor, `${label}.actor`);
    assertStringArray(grant.actions, `${label}.actions`, {nonEmpty: true});
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

export function validateCommand(command) {
  if (!isPlainObject(command)) invalid('command must be an object');
  assertExactKeys(command, new Set([
    'operationId',
    'kind',
    'actor',
    'recordKind',
    'recordId',
    'expectedVersion',
    'leaseToken',
    'payload',
  ]), 'command');
  assertUuid(command.operationId, 'command.operationId');
  assertNonEmptyString(command.kind, 'command.kind');
  if (!COMMAND_KINDS.has(command.kind)) {
    invalid(`unsupported command kind "${command.kind}"`);
  }
  validateActor(command.actor, 'command.actor');
  if (!RECORD_KINDS.has(command.recordKind)) {
    invalid(`unsupported record kind "${command.recordKind}"`);
  }
  assertNonEmptyString(command.recordId, 'command.recordId');
  if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 0) {
    invalid('command.expectedVersion must be a non-negative safe integer');
  }
  if (command.leaseToken !== null) {
    assertNonEmptyString(command.leaseToken, 'command.leaseToken');
  }
  if (!isPlainObject(command.payload)) invalid('command.payload must be an object');
  canonicalJson(command.payload);
  commandValidators.get(command.kind)(command);
  return command;
}

export function validateCommandMutation(command, current, nextBody) {
  if (!isPlainObject(nextBody)) invalid(`${command.kind} must produce an object body`);
  const declaration = commandKind(command.kind);
  if (declaration.validator === 'host') {
    validateHostMutation(command, current, nextBody);
    return nextBody;
  }
  if (declaration.validator === 'hierarchy') {
    validateParentCommandMutation(command, current, nextBody);
    return nextBody;
  }
  if (declaration.validator === 'task') {
    validateTaskCommandMutation(command, current, nextBody);
    return nextBody;
  }
  if (command.kind.endsWith('.create')) {
    if (current) invalid(`${command.kind} requires a missing record`);
    if (canonicalJson(nextBody) !== canonicalJson(command.payload.body)) {
      invalid(`${command.kind} must create the supplied body exactly`);
    }
    return nextBody;
  }
  if (!current) invalid(`${command.kind} requires an existing record`);
  assertChangedOnly(
    current,
    nextBody,
    new Set(declaration.allowedMutations),
    command.kind,
  );
  return nextBody;
}

export function validateRecord(record) {
  if (!isPlainObject(record)) invalid('record must be an object');
  assertExactKeys(record, new Set([
    'kind',
    'id',
    'subject',
    'version',
    'body',
  ]), 'record');
  if (!RECORD_KINDS.has(record.kind)) {
    invalid(`unsupported record kind "${record.kind}"`);
  }
  const declaration = recordKind(record.kind);
  if (declaration.validator === 'hierarchy' || declaration.validator === 'task') {
    validateHierarchyRecord(record);
    return record;
  }
  assertNonEmptyString(record.id, 'record.id');
  if (record.subject !== null) {
    validateHierarchySubject(record.subject, 'record.subject');
  }
  if (!Number.isSafeInteger(record.version) || record.version < 1) {
    invalid('record.version must be a positive safe integer');
  }
  const validator = recordBodyValidators.get(record.kind);
  validator(record.body, `record ${record.kind}/${record.id} body`);
  if (new Set(['question', 'attempt', 'host-attempt', 'effect', 'evidence', 'review', 'approval', 'artifact', 'asset',
    'message', 'grant']).has(record.kind)
    && (record.subject === null || !subjectEquals(record.subject, record.body.subject))) {
    invalid(`${record.kind} record envelope subject must match body.subject`);
  }
  const identityKeys = new Map([
    ['artifact', 'artifact_id'],
    ['asset', 'asset_id'],
    ['question', 'question_id'],
    ['attempt', 'attempt_id'],
    ['host-attempt', 'attempt_id'],
    ['effect', 'effect_id'],
    ['evidence', 'evidence_id'],
    ['review', 'review_id'],
    ['approval', 'approval_id'],
    ['message', 'message_id'],
    ['grant', 'grant_id'],
  ]);
  const identityKey = identityKeys.get(record.kind);
  if (identityKey && record.id !== record.body[identityKey]) {
    invalid(`${record.kind} record id must match body.${identityKey}`);
  }
  return record;
}

import {createHash} from 'node:crypto';
import {
  LIFECYCLE,
  REQUIRES_STATES,
} from '../coordination.mjs';
import {
  validateHostCommand, validateHostMutation, validateHostRecord,
} from './host-schema.mjs';

/**
 * @typedef {{role: string, runId: string}} Actor
 * @typedef {{kind: string, id: string, itemId: string|null,
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

const HOST_COMMANDS = new Set(['attempt.start', 'attempt.result', 'effect.intent', 'effect.result']);

export const COMMAND_KINDS = new Set([
  'initiative.create',
  'initiative.update',
  'item.create',
  'item.update',
  'item.promote',
  'item.grant',
  'item.transition',
  'item.handoff',
  'item.restore',
  'question.open',
  'question.answer',
  'attempt.recover',
  ...HOST_COMMANDS,
  'artifact.register',
  'asset.transition',
  'evidence.register',
  'review.record',
  'approval.record',
]);

export const RECORD_KINDS = new Set([
  'initiative',
  'item',
  'question',
  'attempt',
  'host-attempt',
  'artifact',
  'asset',
  'evidence',
  'review',
  'approval',
  'effect',
  'message',
  'grant',
]);

export const SUBJECT_KINDS = new Set(['git', 'sha256', 'bundle-sha256']);
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
]);
export const DOD_DIMENSIONS = new Set([
  'scope-true',
  'verified',
  'reviewed',
  'shippable-safely',
  'documented',
  'coordination-closed',
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_DIGEST = /^[0-9a-f]{64}$/i;
const GIT_OBJECT = /^[0-9a-f]{7,40}$/i;
const ITEM_DELIVERY_CLASSES = new Set(['knowledge', 'product-change', 'operational']);
const INITIATIVE_STATES = new Set([
  'proposed', 'active', 'paused', 'completed', 'shipped', 'archived',
]);
const QUESTION_KINDS = new Set(['fact', 'decision', 'reply', 'action']);
const MESSAGE_KINDS = new Set(['question', 'answer', 'handoff', 'recovery']);
const PROVENANCE_KINDS = new Set(['live-peer', 'durable-thread', 'operator']);
const RECOVERY_DISPOSITIONS = new Set([
  'safe-to-resume',
  'conflicting-partial-work',
]);
const ITEM_DESCRIPTIVE_FIELDS = new Set([
  'title',
  'priority',
  'next_role',
  'outcome',
  'acceptance',
  'artifact_expectation',
  'artifact_expectation_reason',
  'artifact_class',
  'durability',
  'validity_owner',
  'artifact_targets',
  'context_artifacts',
  'touches',
  'depends_on',
  'required_for_milestone',
  'updated_at',
]);

export class RuntimeError extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
    this.retryable = retryable;
  }
}

function invalid(message) {
  throw new RuntimeError('INVALID_INPUT', message);
}

export function criteriaRef(item) {
  const fields = [
    'outcome', 'acceptance', 'completion_authority', 'review_requirements',
    'artifact_expectation', 'artifact_expectation_reason', 'artifact_class',
    'durability', 'validity_owner', 'artifact_targets',
  ];
  const criteria = Object.fromEntries(fields.map(key => [key, item[key]]));
  if (item.context_artifacts?.length) criteria.context_artifacts = item.context_artifacts;
  return createHash('sha256').update(canonicalJson(criteria)).digest('hex');
}

export function subjectEquals(left, right) {
  return left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
}

export function isProducingRun(item, actor) {
  return item.producing_actors.some(producer => producer.runId === actor.runId);
}

export function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function assertExactKeys(value, allowed, label, required = allowed) {
  if (!isPlainObject(value)) invalid(`${label} must be an object`);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) invalid(`${label} contains unknown field "${key}"`);
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) invalid(`${label} is missing "${key}"`);
  }
}

export function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    invalid(`${label} must be a non-empty string`);
  }
}

function assertNullableString(value, label) {
  if (value !== null) assertNonEmptyString(value, label);
}

function assertBoolean(value, label) {
  if (typeof value !== 'boolean') invalid(`${label} must be a boolean`);
}

export function assertTimestamp(value, label) {
  assertNonEmptyString(value, label);
  if (Number.isNaN(Date.parse(value))) invalid(`${label} must be an ISO-compatible timestamp`);
}

function assertUuid(value, label) {
  if (typeof value !== 'string' || !UUID.test(value)) invalid(`${label} must be a UUID`);
}

function assertStringArray(value, label, {nonEmpty = false} = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0)) {
    invalid(`${label} must be ${nonEmpty ? 'a non-empty' : 'an'} array`);
  }
  for (const entry of value) assertNonEmptyString(entry, `${label} entry`);
  if (new Set(value).size !== value.length) invalid(`${label} must not contain duplicates`);
}

export function validateActor(actor, label = 'actor') {
  assertExactKeys(actor, new Set(['role', 'runId']), label);
  assertNonEmptyString(actor.role, `${label}.role`);
  assertNonEmptyString(actor.runId, `${label}.runId`);
}

function validateNullableActor(actor, label) {
  if (actor !== null) validateActor(actor, label);
}

function validateStringMap(value, label) {
  if (!isPlainObject(value)) invalid(`${label} must be an object`);
  canonicalJson(value);
}

function encodeCanonical(value, ancestors) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid('JSON numbers must be finite');
    return JSON.stringify(value);
  }
  if (typeof value !== 'object') {
    invalid(`unsupported JSON value type "${typeof value}"`);
  }
  if (ancestors.has(value)) invalid('cyclic JSON values are not supported');

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) invalid('sparse arrays are not supported');
      }
      return `[${value.map(entry => encodeCanonical(entry, ancestors)).join(',')}]`;
    }
    if (!isPlainObject(value)) invalid('JSON objects must use a plain object prototype');
    if (Object.getOwnPropertySymbols(value).length > 0) {
      invalid('symbol-keyed JSON fields are not supported');
    }
    const keys = Object.keys(value).sort();
    return `{${keys.map(key =>
      `${JSON.stringify(key)}:${encodeCanonical(value[key], ancestors)}`).join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalJson(value) {
  return encodeCanonical(value, new WeakSet());
}

export function commandDigest(command) {
  return createHash('sha256').update(canonicalJson(command), 'utf8').digest('hex');
}

export function validateSubjectRef(subject, label = 'subject') {
  if (!isPlainObject(subject)) invalid(`${label} must be an object`);
  if (!SUBJECT_KINDS.has(subject.kind)) invalid(`${label}.kind is unsupported`);
  if (subject.kind === 'git') {
    assertExactKeys(subject, new Set(['kind', 'base', 'head']), label);
    if (!GIT_OBJECT.test(subject.base) || !GIT_OBJECT.test(subject.head)) {
      invalid(`${label} git base/head must be immutable git object IDs`);
    }
  } else if (subject.kind === 'sha256') {
    assertExactKeys(subject, new Set(['kind', 'digest', 'path']), label);
    if (!HEX_DIGEST.test(subject.digest)) invalid(`${label}.digest must be SHA-256`);
    assertNonEmptyString(subject.path, `${label}.path`);
  } else {
    assertExactKeys(subject, new Set(['kind', 'digest', 'entries']), label);
    if (!HEX_DIGEST.test(subject.digest)) invalid(`${label}.digest must be SHA-256`);
    if (!Array.isArray(subject.entries) || subject.entries.length === 0) {
      invalid(`${label}.entries must be a non-empty array`);
    }
    for (const [index, entry] of subject.entries.entries()) {
      assertExactKeys(entry, new Set(['path', 'digest']), `${label}.entries[${index}]`);
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

function validateDependencies(value, label) {
  if (!Array.isArray(value)) invalid(`${label} must be an array`);
  const seen = new Set();
  for (const [index, dependency] of value.entries()) {
    assertExactKeys(dependency, new Set(['item', 'requires']), `${label}[${index}]`);
    assertNonEmptyString(dependency.item, `${label}[${index}].item`);
    if (!REQUIRES_STATES.has(dependency.requires)) {
      invalid(`${label}[${index}].requires is unsupported`);
    }
    if (seen.has(dependency.item)) invalid(`${label} contains duplicate item "${dependency.item}"`);
    seen.add(dependency.item);
  }
}

function validateReviewRequirements(value, label) {
  if (!Array.isArray(value)) invalid(`${label} must be an array`);
  const seen = new Set();
  for (const [index, requirement] of value.entries()) {
    assertExactKeys(requirement, new Set(['role', 'kind']), `${label}[${index}]`);
    assertNonEmptyString(requirement.role, `${label}[${index}].role`);
    assertNonEmptyString(requirement.kind, `${label}[${index}].kind`);
    const key = `${requirement.role}\0${requirement.kind}`;
    if (seen.has(key)) invalid(`${label} contains a duplicate requirement`);
    seen.add(key);
  }
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

function validateItemBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version',
    'id',
    'title',
    'initiative',
    'delivery_class',
    'state',
    'resume_state',
    'scope_authority',
    'completion_authority',
    'producer_actor',
    'producing_actors',
    'acceptance_actor',
    'priority',
    'next_role',
    'outcome',
    'acceptance',
    'artifact_expectation',
    'artifact_expectation_reason',
    'artifact_class',
    'durability',
    'validity_owner',
    'artifact_targets',
    'context_artifacts',
    'touches',
    'depends_on',
    'lease',
    'recovery_hold',
    'waiting_on_questions',
    'required_for_milestone',
    'review_requirements',
    'change_ref',
    'updated_at',
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  for (const key of ['id', 'title', 'initiative', 'scope_authority',
    'completion_authority', 'outcome']) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  if (!ITEM_DELIVERY_CLASSES.has(body.delivery_class)) {
    invalid(`${label}.delivery_class is unsupported`);
  }
  if (!LIFECYCLE.has(body.state)) invalid(`${label}.state is unsupported`);
  if (body.resume_state !== null && (!LIFECYCLE.has(body.resume_state)
    || body.resume_state === 'blocked')) {
    invalid(`${label}.resume_state is unsupported`);
  }
  validateNullableActor(body.producer_actor, `${label}.producer_actor`);
  if (!Array.isArray(body.producing_actors)) invalid(`${label}.producing_actors must be an array`);
  body.producing_actors.forEach((actor, index) =>
    validateActor(actor, `${label}.producing_actors[${index}]`));
  if (body.producer_actor && !body.producing_actors.some(actor =>
    actor.role === body.producer_actor.role && actor.runId === body.producer_actor.runId)) {
    invalid(`${label}.producing_actors must retain the current producer`);
  }
  validateNullableActor(body.acceptance_actor, `${label}.acceptance_actor`);
  if (!Number.isSafeInteger(body.priority) || body.priority < 0) {
    invalid(`${label}.priority must be a non-negative safe integer`);
  }
  assertNullableString(body.next_role, `${label}.next_role`);
  assertStringArray(body.acceptance, `${label}.acceptance`, {nonEmpty: true});
  if (!new Set(['owed', 'none']).has(body.artifact_expectation)) {
    invalid(`${label}.artifact_expectation is unsupported`);
  }
  assertNullableString(body.artifact_expectation_reason,
    `${label}.artifact_expectation_reason`);
  for (const key of ['artifact_class', 'durability', 'validity_owner']) {
    assertNullableString(body[key], `${label}.${key}`);
  }
  if (body.artifact_expectation === 'none' && body.artifact_expectation_reason === null) {
    invalid(`${label}.artifact_expectation_reason is required when no artifact is owed`);
  }
  if (body.artifact_expectation === 'owed'
    && [body.artifact_class, body.durability, body.validity_owner].includes(null)) {
    invalid(`${label} requires artifact class, durability, and validity owner`);
  }
  for (const key of ['artifact_targets', 'context_artifacts', 'touches',
    'waiting_on_questions']) {
    assertStringArray(body[key], `${label}.${key}`);
  }
  validateDependencies(body.depends_on, `${label}.depends_on`);
  validateLease(body.lease, `${label}.lease`);
  if (body.recovery_hold !== null) {
    assertUuid(body.recovery_hold, `${label}.recovery_hold`);
    if (body.state !== 'blocked' && body.state !== 'dropped') {
      invalid(`${label}.recovery_hold requires blocked or dropped state`);
    }
  }
  assertBoolean(body.required_for_milestone, `${label}.required_for_milestone`);
  validateReviewRequirements(body.review_requirements, `${label}.review_requirements`);
  validateNullableSubject(body.change_ref, `${label}.change_ref`);
  assertTimestamp(body.updated_at, `${label}.updated_at`);
  if (body.acceptance_actor && body.producing_actors.some(actor =>
    actor.runId === body.acceptance_actor.runId)) {
    invalid(`${label} cannot name its producing run as acceptance actor`);
  }
  if (body.producer_actor
    && body.producer_actor.role === body.completion_authority
    && body.review_requirements.some(requirement =>
      requirement.kind === 'product-design-acceptance')) {
    invalid(`${label} producing designer cannot be its completion authority`);
  }
  if (body.state === 'blocked') {
    if (body.resume_state === null) invalid(`${label}.resume_state is required while blocked`);
  } else if (body.resume_state !== null) {
    invalid(`${label}.resume_state is only valid while blocked`);
  }
  if (body.lease !== null && body.lease.version_at_grant >= Number.MAX_SAFE_INTEGER) {
    invalid(`${label}.lease.version_at_grant is invalid`);
  }
}

function validateMilestone(value, label) {
  assertExactKeys(value, new Set([
    'id', 'title', 'delivery_class', 'required_items', 'status',
  ]), label);
  assertNonEmptyString(value.id, `${label}.id`);
  assertNonEmptyString(value.title, `${label}.title`);
  if (!ITEM_DELIVERY_CLASSES.has(value.delivery_class)) {
    invalid(`${label}.delivery_class is unsupported`);
  }
  assertStringArray(value.required_items, `${label}.required_items`);
  if (!new Set(['proposed', 'active', 'completed', 'shipped', 'dropped']).has(value.status)) {
    invalid(`${label}.status is unsupported`);
  }
}

function validateBacklogEntry(value, label) {
  assertExactKeys(value, new Set(['id', 'title', 'status', 'item_id', 'reason']), label);
  assertNonEmptyString(value.id, `${label}.id`);
  assertNonEmptyString(value.title, `${label}.title`);
  if (!new Set(['parked', 'promoted', 'dropped']).has(value.status)) {
    invalid(`${label}.status is unsupported`);
  }
  assertNullableString(value.item_id, `${label}.item_id`);
  assertNullableString(value.reason, `${label}.reason`);
}

function validateInitiativeBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version',
    'id',
    'title',
    'status',
    'owner',
    'scope',
    'milestones',
    'backlog',
    'north_star_ref',
    'updated_at',
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  for (const key of ['id', 'title', 'owner', 'north_star_ref']) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  if (!INITIATIVE_STATES.has(body.status)) invalid(`${label}.status is unsupported`);
  assertExactKeys(body.scope, new Set(['current']), `${label}.scope`);
  assertStringArray(body.scope.current, `${label}.scope.current`, {nonEmpty: true});
  if (!Array.isArray(body.milestones)) invalid(`${label}.milestones must be an array`);
  body.milestones.forEach((entry, index) =>
    validateMilestone(entry, `${label}.milestones[${index}]`));
  if (!Array.isArray(body.backlog)) invalid(`${label}.backlog must be an array`);
  body.backlog.forEach((entry, index) =>
    validateBacklogEntry(entry, `${label}.backlog[${index}]`));
  assertTimestamp(body.updated_at, `${label}.updated_at`);
}

function validateQuestionBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version',
    'question_id',
    'item_id',
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
  for (const key of ['question_id', 'item_id', 'recipient', 'context', 'ask', 'answer_by']) {
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
    'thread_id',
    'item_id',
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
  for (const key of ['thread_id', 'item_id', 'sender_role', 'sender_run', 'recipient']) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }
  if (body.parent_id !== null) assertUuid(body.parent_id, `${label}.parent_id`);
  if (!MESSAGE_KINDS.has(body.kind)) invalid(`${label}.kind is unsupported`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  if (!Number.isSafeInteger(body.basis_version) || body.basis_version < 1) {
    invalid(`${label}.basis_version must be a positive safe integer`);
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
    'item_id',
    'reviewer',
    'kind',
    'subject',
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
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  validateActor(body.reviewer, `${label}.reviewer`);
  assertNonEmptyString(body.kind, `${label}.kind`);
  validateSubjectRef(body.subject, `${label}.subject`);
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
    'item_id',
    'authority',
    'kind',
    'subject',
    'criteria_ref',
    'supersedes',
    'deployment',
    'recovery',
    'decision',
    'evidence_refs',
    'reason',
    'created_at',
  ]);
  assertExactKeys(body, new Set([...required, 'provenance', 'recorded_at_item_version']), label, required);
  if (Object.hasOwn(body, 'provenance')) validateDecisionProvenance(body.provenance, `${label}.provenance`);
  if (Object.hasOwn(body, 'recorded_at_item_version')
    && (!Number.isSafeInteger(body.recorded_at_item_version) || body.recorded_at_item_version < 1)) {
    invalid(`${label}.recorded_at_item_version must be a positive item version`);
  }
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  assertUuid(body.approval_id, `${label}.approval_id`);
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  validateActor(body.authority, `${label}.authority`);
  if (!APPROVAL_KINDS.has(body.kind)) invalid(`${label}.kind is unsupported`);
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  validateSupersedes(body.supersedes, body.approval_id, label);
  if (body.kind === 'operator-recovery-resolution') {
    if (body.subject !== null) invalid(`${label}.subject must be null for recovery resolution`);
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
    validateSubjectRef(body.subject, `${label}.subject`);
    if (body.recovery !== null) invalid(`${label}.recovery is only for recovery resolution`);
  }
  if (body.kind === 'operator-deploy-start' || body.kind === 'operator-deploy-complete') {
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
    'item_id',
    'kind',
    'subject',
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
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  if (!EVIDENCE_KINDS.has(body.kind)) invalid(`${label}.kind is unsupported`);
  validateNullableSubject(body.subject, `${label}.subject`);
  if (body.kind === 'recovery-reconciliation') {
    if (body.criteria_ref !== null) invalid(`${label}.criteria_ref must be null for recovery`);
    if (body.supersedes.length > 0) invalid(`${label} recovery reconciliation cannot supersede observations`);
  } else {
    validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  }
  if (body.kind === 'recovery-reconciliation' && body.subject !== null) {
    invalid(`${label}.subject must be null for recovery reconciliation`);
  }
  if (body.kind !== 'recovery-reconciliation' && body.subject === null) {
    invalid(`${label}.subject is required`);
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
  } else {
    assertExactKeys(body.data, new Set([
      'stale_lease_token', 'disposition', 'observed',
    ]), `${label}.data`);
    assertNonEmptyString(body.data.stale_lease_token,
      `${label}.data.stale_lease_token`);
    if (!RECOVERY_DISPOSITIONS.has(body.data.disposition)) {
      invalid(`${label}.data.disposition is unsupported`);
    }
    assertNonEmptyString(body.data.observed, `${label}.data.observed`);
  }
  assertTimestamp(body.created_at, `${label}.created_at`);
}

function validateGrantBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version',
    'grant_id',
    'item_id',
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
  assertNonEmptyString(body.item_id, `${label}.item_id`);
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
    'item_id',
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
  assertNonEmptyString(body.item_id, `${label}.item_id`);
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
  const keys = ['source', 'reference', 'attributed_to', 'captured_at', 'item_id', 'subject',
    'criteria_ref', 'kind', 'decision', 'deployment', 'recovery'];
  assertExactKeys(value, new Set(keys), 'operator decision');
  validateDecisionProvenance(Object.fromEntries(keys.slice(0, 4).map(key => [key, value[key]])), 'operator decision provenance');
  assertNonEmptyString(value.item_id, 'operator decision item_id');
  validateNullableSubject(value.subject, 'operator decision subject');
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
    'schema_version', 'artifact_id', 'item_id', 'producer', 'subject', 'criteria_ref',
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
  assertNonEmptyString(body.item_id, `${label}.item_id`);
  validateActor(body.producer, `${label}.producer`);
  validateSubjectRef(body.subject, `${label}.subject`);
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
  if ((body.subject.kind === 'git') !== (body.snapshots.length === 0)) invalid(`${label} requires exact non-Git snapshots`);
  assertNullableString(body.manifest_path, `${label}.manifest_path`);
  if ((body.subject.kind === 'git') !== (body.manifest_path === null)) invalid(`${label} requires non-Git manifest`);
  if (!CLASSIFICATIONS.has(body.classification)) invalid(`${label}.classification is unsupported`);
  for (const key of ['media_type', 'title']) assertNonEmptyString(body[key], `${label}.${key}`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}

function validateAssetBody(body, label) {
  assertExactKeys(body, new Set([
    'schema_version', 'asset_id', 'item_id', 'artifact_id', 'revision', 'producer',
    'completion_authority', 'validity_owner', 'disposition', 'validity', 'target',
    'completion_approval_id', 'input_asset_ids', 'supersedes', 'superseded_by', 'history', 'updated_at',
  ]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  for (const key of ['asset_id', 'artifact_id']) assertUuid(body[key], `${label}.${key}`);
  assertNonEmptyString(body.item_id, `${label}.item_id`);
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
    assertExactKeys(entry, new Set(['disposition', 'validity', 'target', 'reason', 'at', 'at_item_version']), `${label}.history entry`);
    if (!Number.isSafeInteger(entry.at_item_version) || entry.at_item_version < 1) invalid(`${label}.history item version must be positive`);
    if (!ASSET_DISPOSITIONS.has(entry.disposition) || !ASSET_VALIDITIES.has(entry.validity)) invalid(`${label} history has unsupported state`);
    assertNonEmptyString(entry.target, `${label}.history.target`);
    assertNonEmptyString(entry.reason, `${label}.history.reason`);
    assertTimestamp(entry.at, `${label}.history.at`);
  }
  assertTimestamp(body.updated_at, `${label}.updated_at`);
}

function validateProducerCommand(command) {
  if (command.recordKind !== 'item' || command.expectedVersion < 1) invalid(`${command.kind} requires an existing item`);
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
    if (command.payload.body.item_id !== command.recordId) invalid(`${command.kind} must bind the primary item`);
    if (Object.hasOwn(command.payload.body, 'provenance')) invalid('provenance is host-derived, not command input');
    if (Object.hasOwn(command.payload.body, 'recorded_at_item_version')) invalid('recorded item version is runtime-derived');
    if (kind === 'evidence' && !new Set(['observed', 'declared']).has(command.payload.tier)) invalid('evidence.register tier is unsupported');
  }
}

const recordBodyValidators = new Map([
  ['initiative', validateInitiativeBody],
  ['item', validateItemBody],
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

function validateCreate(command, expectedKind, bodyValidator) {
  if (command.recordKind !== expectedKind) {
    invalid(`${command.kind} requires recordKind "${expectedKind}"`);
  }
  if (command.expectedVersion !== 0) invalid(`${command.kind} requires version 0`);
  if (command.leaseToken !== null) invalid(`${command.kind} cannot carry a lease token`);
  assertExactKeys(command.payload, new Set(['body']), `${command.kind} payload`);
  bodyValidator(command.payload.body, `${command.kind} payload.body`);
  if (command.payload.body.id !== command.recordId) {
    invalid(`${command.kind} body id must match command.recordId`);
  }
}

function validateChangesPayload(command, fields, label) {
  assertExactKeys(command.payload, new Set(['changes']), `${label} payload`);
  if (!isPlainObject(command.payload.changes)
    || Object.keys(command.payload.changes).length === 0) {
    invalid(`${label} payload.changes must be a non-empty object`);
  }
  for (const key of Object.keys(command.payload.changes)) {
    if (!fields.has(key)) invalid(`${label} cannot change "${key}"`);
  }
}

function validateItemUpdate(command) {
  if (command.recordKind !== 'item') invalid('item.update requires recordKind "item"');
  if (command.expectedVersion < 1) invalid('item.update requires an existing record version');
  if (Object.keys(command.payload).length === 1 && Object.hasOwn(command.payload, 'title')) {
    assertNonEmptyString(command.payload.title, 'item.update payload.title');
    return;
  }
  validateChangesPayload(command, ITEM_DESCRIPTIVE_FIELDS, 'item.update');
}

function validateInitiativeUpdate(command) {
  if (command.recordKind !== 'initiative') {
    invalid('initiative.update requires recordKind "initiative"');
  }
  if (command.expectedVersion < 1) {
    invalid('initiative.update requires an existing record version');
  }
  validateChangesPayload(command, new Set([
    'title', 'status', 'scope', 'milestones', 'backlog', 'north_star_ref', 'updated_at',
  ]), 'initiative.update');
}

function validateAtPayload(command, kind, keys) {
  if (command.recordKind !== 'item') invalid(`${kind} requires recordKind "item"`);
  if (command.expectedVersion < 1) invalid(`${kind} requires an existing record version`);
  assertExactKeys(command.payload, new Set(keys), `${kind} payload`);
}

function validateItemPromote(command) {
  validateAtPayload(command, 'item.promote', ['at']);
  assertTimestamp(command.payload.at, 'item.promote payload.at');
}

function validateItemGrant(command) {
  validateAtPayload(command, 'item.grant', [
    'holder', 'actions', 'acquiredAt', 'expiresAt',
  ]);
  validateActor(command.payload.holder, 'item.grant payload.holder');
  assertStringArray(command.payload.actions, 'item.grant payload.actions', {nonEmpty: true});
  for (const action of command.payload.actions) {
    if (!new Set([
      'item.update', 'item.transition', 'item.handoff', 'question.open',
      'artifact.register', 'asset.transition', 'evidence.register', 'review.record', 'approval.record',
    ]).has(action)) {
      invalid(`item.grant payload.actions contains unsupported action "${action}"`);
    }
  }
  assertTimestamp(command.payload.acquiredAt, 'item.grant payload.acquiredAt');
  assertTimestamp(command.payload.expiresAt, 'item.grant payload.expiresAt');
  if (Date.parse(command.payload.expiresAt) <= Date.parse(command.payload.acquiredAt)) {
    invalid('item.grant payload.expiresAt must be after acquiredAt');
  }
}

function validateTransition(command) {
  if (command.recordKind !== 'item') {
    invalid('item.transition requires recordKind "item"');
  }
  if (command.expectedVersion < 1) {
    invalid('item.transition requires an existing record version');
  }
  assertExactKeys(
    command.payload,
    new Set(['to', 'at', 'reason', 'subject']),
    'item.transition payload',
    new Set(['to', 'at', 'reason']),
  );
  if (!LIFECYCLE.has(command.payload.to)) invalid('item.transition payload.to is unsupported');
  assertTimestamp(command.payload.at, 'item.transition payload.at');
  assertNonEmptyString(command.payload.reason, 'item.transition payload.reason');
  if (Object.hasOwn(command.payload, 'subject')) {
    validateNullableSubject(command.payload.subject, 'item.transition payload.subject');
  }
  if (command.payload.to === 'in-review'
    && (!Object.hasOwn(command.payload, 'subject') || command.payload.subject === null)) {
    invalid('item.transition to in-review requires a subject');
  }
}

function validateHandoffContent(content) {
  assertExactKeys(content, new Set([
    'did', 'needs', 'assetState', 'authority', 'revalidation', 'questions',
  ]), 'item.handoff payload.content');
  for (const key of ['did', 'needs', 'assetState', 'authority', 'revalidation']) {
    assertNonEmptyString(content[key], `item.handoff payload.content.${key}`);
  }
  assertStringArray(content.questions, 'item.handoff payload.content.questions');
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

function validateItemHandoff(command) {
  if (command.recordKind !== 'item') invalid('item.handoff requires recordKind "item"');
  if (command.expectedVersion < 1) {
    invalid('item.handoff requires an existing record version');
  }
  const required = new Set([
    'toRole', 'state', 'createdAt', 'messageId', 'parentId', 'content',
    'artifactRefs', 'evidenceRefs', 'provenance',
  ]);
  assertExactKeys(
    command.payload,
    new Set([...required, 'subject']),
    'item.handoff payload',
    required,
  );
  assertNonEmptyString(command.payload.toRole, 'item.handoff payload.toRole');
  if (command.payload.state !== null && !LIFECYCLE.has(command.payload.state)) {
    invalid('item.handoff payload.state is unsupported');
  }
  if (Object.hasOwn(command.payload, 'subject')) {
    validateNullableSubject(command.payload.subject, 'item.handoff payload.subject');
  }
  if (command.payload.state === 'in-review'
    && (!Object.hasOwn(command.payload, 'subject') || command.payload.subject === null)) {
    invalid('item.handoff to in-review requires a subject');
  }
  assertTimestamp(command.payload.createdAt, 'item.handoff payload.createdAt');
  assertUuid(command.payload.messageId, 'item.handoff payload.messageId');
  if (command.payload.parentId !== null) {
    assertUuid(command.payload.parentId, 'item.handoff payload.parentId');
  }
  validateHandoffContent(command.payload.content);
  assertStringArray(command.payload.artifactRefs, 'item.handoff payload.artifactRefs');
  assertStringArray(command.payload.evidenceRefs, 'item.handoff payload.evidenceRefs');
  if (!PROVENANCE_KINDS.has(command.payload.provenance)) {
    invalid('item.handoff payload.provenance is unsupported');
  }
}

function validateRestore(command) {
  if (command.recordKind !== 'item' || command.expectedVersion < 1) {
    invalid('item.restore requires an existing item');
  }
  assertExactKeys(command.payload, new Set(['at', 'recoveryApprovalId']),
    'item.restore payload', new Set(['at']));
  assertTimestamp(command.payload.at, 'item.restore payload.at');
  if (Object.hasOwn(command.payload, 'recoveryApprovalId')) {
    assertUuid(command.payload.recoveryApprovalId, 'item.restore payload.recoveryApprovalId');
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

const commandValidators = new Map([
  ...[...HOST_COMMANDS].map(kind => [kind, validateHostCommand]),
  ...['artifact.register', 'asset.transition', 'evidence.register', 'review.record', 'approval.record']
    .map(kind => [kind, validateProducerCommand]),
  ['initiative.create', command =>
    validateCreate(command, 'initiative', validateInitiativeBody)],
  ['initiative.update', validateInitiativeUpdate],
  ['item.create', command => validateCreate(command, 'item', validateItemBody)],
  ['item.update', validateItemUpdate],
  ['item.promote', validateItemPromote],
  ['item.grant', validateItemGrant],
  ['item.transition', validateTransition],
  ['item.handoff', validateItemHandoff],
  ['item.restore', validateRestore],
  ['question.open', command =>
    validateMessagePayload(command, 'question.open', validateQuestionContent)],
  ['question.answer', command =>
    validateMessagePayload(command, 'question.answer', validateAnswerContent)],
  ['attempt.recover', validateRecover],
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

function changedKeys(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter(key => canonicalJson(before[key]) !== canonicalJson(after[key]));
}

function assertChangedOnly(current, nextBody, allowed, label) {
  for (const key of changedKeys(current.body, nextBody)) {
    if (!allowed.has(key)) invalid(`${label} may not change "${key}"`);
  }
}

export function validateCommandMutation(command, current, nextBody) {
  if (!isPlainObject(nextBody)) invalid(`${command.kind} must produce an object body`);
  if (HOST_COMMANDS.has(command.kind)) {
    validateHostMutation(command, current, nextBody);
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
  if (command.kind === 'item.update') {
    const changes = Object.hasOwn(command.payload, 'changes')
      ? command.payload.changes
      : {title: command.payload.title};
    const expected = {...current.body, ...changes};
    if (canonicalJson(nextBody) !== canonicalJson(expected)) {
      invalid('item.update may only apply the descriptive changes in its payload');
    }
  } else if (command.kind === 'initiative.update') {
    const expected = {...current.body, ...command.payload.changes};
    if (canonicalJson(nextBody) !== canonicalJson(expected)) {
      invalid('initiative.update may only apply the changes in its payload');
    }
  } else {
    const allowedByKind = new Map([
      ...['artifact.register', 'asset.transition', 'evidence.register', 'review.record', 'approval.record']
        .map(kind => [kind, new Set()]),
      ['item.promote', new Set(['state', 'updated_at'])],
      ['item.grant', new Set([
        'state', 'resume_state', 'producer_actor', 'producing_actors', 'next_role', 'lease', 'updated_at',
      ])],
      ['item.transition', new Set([
        'state', 'resume_state', 'acceptance_actor', 'next_role', 'lease',
        'change_ref', 'updated_at',
      ])],
      ['item.handoff', new Set([
        'state', 'resume_state', 'acceptance_actor', 'next_role', 'lease',
        'change_ref', 'updated_at',
      ])],
      ['item.restore', new Set(['state', 'resume_state', 'next_role', 'recovery_hold', 'updated_at'])],
      ['question.open', new Set([
        'state', 'resume_state', 'lease', 'waiting_on_questions', 'updated_at',
      ])],
      ['question.answer', new Set([
        'state', 'resume_state', 'lease', 'waiting_on_questions', 'updated_at',
      ])],
      ['attempt.recover', new Set([
        'state', 'resume_state', 'next_role', 'lease', 'producer_actor',
        'producing_actors', 'recovery_hold', 'updated_at',
      ])],
    ]);
    assertChangedOnly(current, nextBody, allowedByKind.get(command.kind), command.kind);
  }
  return nextBody;
}

export function validateRecord(record) {
  if (!isPlainObject(record)) invalid('record must be an object');
  assertExactKeys(record, new Set([
    'kind',
    'id',
    'itemId',
    'version',
    'body',
  ]), 'record');
  if (!RECORD_KINDS.has(record.kind)) {
    invalid(`unsupported record kind "${record.kind}"`);
  }
  assertNonEmptyString(record.id, 'record.id');
  if (record.itemId !== null) assertNonEmptyString(record.itemId, 'record.itemId');
  if (!Number.isSafeInteger(record.version) || record.version < 1) {
    invalid('record.version must be a positive safe integer');
  }
  const validator = recordBodyValidators.get(record.kind);
  validator(record.body, `record ${record.kind}/${record.id} body`);
  if (record.kind === 'item' && (record.id !== record.body.id || record.itemId !== record.id)) {
    invalid('item record envelope must match body.id');
  }
  if (record.kind === 'initiative'
    && (record.id !== record.body.id || record.itemId !== null)) {
    invalid('initiative record envelope must match body.id and have null itemId');
  }
  if (new Set(['question', 'attempt', 'host-attempt', 'effect', 'evidence', 'review', 'approval', 'artifact', 'asset',
    'message', 'grant']).has(record.kind)
    && record.itemId !== record.body.item_id) {
    invalid(`${record.kind} record itemId must match body.item_id`);
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

import {
  TASK_DEPENDENCY_STATES,
  TASK_LIFECYCLE,
} from '../coordination.mjs';
import {
  PACKS,
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
  parseTypedId,
  validateActor,
  validateChangesPayload,
  validateNullableActor,
  validateNullableSubject,
} from './contract-primitives.mjs';

const ITEM_DELIVERY_CLASSES = new Set(['knowledge', 'product-change', 'operational']);
const PROVENANCE_KINDS = new Set(['live-peer', 'durable-thread', 'operator']);

const TASK_BODY_FIELDS = new Set([
  'schema_version',
  'id',
  'pack',
  'feature_id',
  'satisfies',
  'title',
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
  'review_requirements',
  'change_ref',
  'updated_at',
]);

const TASK_UPDATE_FIELDS = new Set([
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
  'updated_at',
]);

export const TASK_COMMAND_KINDS = new Set([
  'task.create',
  'task.update',
  'task.promote',
  'task.grant',
  'task.transition',
  'task.handoff',
  'task.restore',
]);

function validateDependencies(value, label, {entryKey, typedKind = null} = {}) {
  if (!Array.isArray(value)) invalid(`${label} must be an array`);
  const seen = new Set();
  for (const [index, dependency] of value.entries()) {
    assertExactKeys(dependency, new Set([entryKey, 'requires']), `${label}[${index}]`);
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

function validateTaskSatisfies(value, label, pack) {
  assertStringArray(value, label, {nonEmpty: true});
  for (const [index, id] of value.entries()) {
    const parsed = parseTypedId(id, 'requirement', `${label}[${index}]`);
    if (parsed.pack !== pack) invalid(`${label} must stay within the task pack`);
  }
}

export function validateTaskBody(body, label = 'task') {
  assertExactKeys(body, TASK_BODY_FIELDS, label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);

  for (const key of [
    'id', 'title', 'pack', 'feature_id', 'scope_authority', 'completion_authority', 'outcome',
  ]) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }

  if (!ITEM_DELIVERY_CLASSES.has(body.delivery_class)) {
    invalid(`${label}.delivery_class is unsupported`);
  }
  if (!TASK_LIFECYCLE.has(body.state)) invalid(`${label}.state is unsupported`);
  if (body.resume_state !== null && (!TASK_LIFECYCLE.has(body.resume_state)
    || body.resume_state === 'blocked')) {
    invalid(`${label}.resume_state is unsupported`);
  }

  if (!PACKS.has(body.pack)) invalid(`${label}.pack is unsupported`);
  const taskId = parseTypedId(body.id, 'task', `${label}.id`);
  if (taskId.pack !== body.pack) invalid(`${label}.pack must match its typed id`);
  const featureId = parseTypedId(body.feature_id, 'feature', `${label}.feature_id`);
  if (featureId.pack !== body.pack) {
    invalid(`${label}.feature_id must stay within the task pack`);
  }
  validateTaskSatisfies(body.satisfies, `${label}.satisfies`, body.pack);

  validateNullableActor(body.producer_actor, `${label}.producer_actor`);
  if (!Array.isArray(body.producing_actors)) invalid(`${label}.producing_actors must be an array`);
  body.producing_actors.forEach((entry, index) =>
    validateActor(entry, `${label}.producing_actors[${index}]`));
  if (body.producer_actor && !body.producing_actors.some(entry =>
    entry.role === body.producer_actor.role && entry.runId === body.producer_actor.runId)) {
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
  assertNullableString(body.artifact_expectation_reason, `${label}.artifact_expectation_reason`);
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

  for (const key of ['artifact_targets', 'context_artifacts', 'touches', 'waiting_on_questions']) {
    assertStringArray(body[key], `${label}.${key}`);
  }
  validateDependencies(body.depends_on, `${label}.depends_on`, {
    entryKey: 'task',
    typedKind: 'task',
  });
  validateLease(body.lease, `${label}.lease`);
  if (body.recovery_hold !== null) {
    assertUuid(body.recovery_hold, `${label}.recovery_hold`);
    if (body.state !== 'blocked' && body.state !== 'dropped') {
      invalid(`${label}.recovery_hold requires blocked or dropped state`);
    }
  }

  validateReviewRequirements(body.review_requirements, `${label}.review_requirements`);
  validateNullableSubject(body.change_ref, `${label}.change_ref`);
  assertTimestamp(body.updated_at, `${label}.updated_at`);

  if (body.acceptance_actor && body.producing_actors.some(entry =>
    entry.runId === body.acceptance_actor.runId)) {
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

  return body;
  return body;
}

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

function validateTaskLikeUpdate(command, {commandKind, recordKind, fields}) {
  if (command.recordKind !== recordKind) {
    invalid(`${commandKind} requires recordKind "${recordKind}"`);
  }
  if (command.expectedVersion < 1) {
    invalid(`${commandKind} requires an existing record version`);
  }
  if (Object.keys(command.payload).length === 1 && Object.hasOwn(command.payload, 'title')) {
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

function validateTaskLikePromote(command, {kind, recordKind}) {
  validateAtPayload(command, kind, recordKind, ['at']);
  assertTimestamp(command.payload.at, `${kind} payload.at`);
}

function validateTaskLikeGrant(command, {kind, recordKind, actions}) {
  validateAtPayload(command, kind, recordKind, ['holder', 'actions', 'acquiredAt', 'expiresAt']);
  validateActor(command.payload.holder, `${kind} payload.holder`);
  assertStringArray(command.payload.actions, `${kind} payload.actions`, {nonEmpty: true});
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

function validateTaskLikeTransition(command, {kind, recordKind}) {
  if (command.recordKind !== recordKind) invalid(`${kind} requires recordKind "${recordKind}"`);
  if (command.expectedVersion < 1) invalid(`${kind} requires an existing record version`);
  assertExactKeys(
    command.payload,
    new Set(['to', 'at', 'reason', 'subject']),
    `${kind} payload`,
    new Set(['to', 'at', 'reason']),
  );
  if (!TASK_LIFECYCLE.has(command.payload.to)) invalid(`${kind} payload.to is unsupported`);
  assertTimestamp(command.payload.at, `${kind} payload.at`);
  assertNonEmptyString(command.payload.reason, `${kind} payload.reason`);
  if (Object.hasOwn(command.payload, 'subject')) {
    validateNullableSubject(command.payload.subject, `${kind} payload.subject`);
  }
  if (command.payload.to === 'in-review'
    && (!Object.hasOwn(command.payload, 'subject') || command.payload.subject === null)) {
    invalid(`${kind} to in-review requires a subject`);
  }
}

function validateHandoffContent(content, label) {
  assertExactKeys(content, new Set([
    'did', 'needs', 'assetState', 'authority', 'revalidation', 'questions',
  ]), label);
  for (const key of ['did', 'needs', 'assetState', 'authority', 'revalidation']) {
    assertNonEmptyString(content[key], `${label}.${key}`);
  }
  assertStringArray(content.questions, `${label}.questions`);
}

function validateTaskLikeHandoff(command, {kind, recordKind}) {
  if (command.recordKind !== recordKind) invalid(`${kind} requires recordKind "${recordKind}"`);
  if (command.expectedVersion < 1) invalid(`${kind} requires an existing record version`);
  const required = new Set([
    'toRole', 'state', 'createdAt', 'messageId', 'parentId', 'content',
    'artifactRefs', 'evidenceRefs', 'provenance',
  ]);
  assertExactKeys(
    command.payload,
    new Set([...required, 'subject']),
    `${kind} payload`,
    required,
  );
  assertNonEmptyString(command.payload.toRole, `${kind} payload.toRole`);
  if (command.payload.state !== null && !TASK_LIFECYCLE.has(command.payload.state)) {
    invalid(`${kind} payload.state is unsupported`);
  }
  if (Object.hasOwn(command.payload, 'subject')) {
    validateNullableSubject(command.payload.subject, `${kind} payload.subject`);
  }
  if (command.payload.state === 'in-review'
    && (!Object.hasOwn(command.payload, 'subject') || command.payload.subject === null)) {
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

function validateTaskLikeRestore(command, {kind, recordKind}) {
  if (command.recordKind !== recordKind || command.expectedVersion < 1) {
    invalid(`${kind} requires an existing ${recordKind}`);
  }
  assertExactKeys(command.payload, new Set(['at', 'recoveryApprovalId']),
    `${kind} payload`, new Set(['at']));
  assertTimestamp(command.payload.at, `${kind} payload.at`);
  if (Object.hasOwn(command.payload, 'recoveryApprovalId')) {
    assertUuid(command.payload.recoveryApprovalId, `${kind} payload.recoveryApprovalId`);
  }
}

const taskCommandValidators = new Map([
  ['task.create', command => validateCreate(command, 'task', validateTaskBody)],
  ['task.update', command => validateTaskLikeUpdate(command, {
    commandKind: 'task.update',
    recordKind: 'task',
    fields: TASK_UPDATE_FIELDS,
  })],
  ['task.promote', command => validateTaskLikePromote(command, {
    kind: 'task.promote',
    recordKind: 'task',
  })],
  ['task.grant', command => validateTaskLikeGrant(command, {
    kind: 'task.grant',
    recordKind: 'task',
    actions: new Set([
      'task.update',
      'task.transition',
      'task.handoff',
      'question.open',
      'artifact.register',
      'asset.transition',
      'evidence.register',
      'review.record',
      'approval.record',
    ]),
  })],
  ['task.transition', command => validateTaskLikeTransition(command, {
    kind: 'task.transition',
    recordKind: 'task',
  })],
  ['task.handoff', command => validateTaskLikeHandoff(command, {
    kind: 'task.handoff',
    recordKind: 'task',
  })],
  ['task.restore', command => validateTaskLikeRestore(command, {
    kind: 'task.restore',
    recordKind: 'task',
  })],
]);

export function validateTaskCommand(command) {
  if (!TASK_COMMAND_KINDS.has(command.kind)) {
    invalid(`unsupported command kind "${command.kind}"`);
  }
  taskCommandValidators.get(command.kind)(command);
  return command;
}

function validateTaskLikeCommandMutation(command, current, nextBody, {
  updateCommand,
  updateFailure,
  allowedByKind,
} = {}) {
  if (!isPlainObject(nextBody)) invalid(`${command.kind} must produce an object body`);
  if (command.kind.endsWith('.create')) {
    if (current) invalid(`${command.kind} requires a missing record`);
    if (canonicalJson(nextBody) !== canonicalJson(command.payload.body)) {
      invalid(`${command.kind} must create the supplied body exactly`);
    }
    return nextBody;
  }
  if (!current) invalid(`${command.kind} requires an existing record`);
  if (command.kind === updateCommand) {
    const changes = Object.hasOwn(command.payload, 'changes')
      ? command.payload.changes
      : {title: command.payload.title};
    const expected = {...current.body, ...changes};
    if (canonicalJson(nextBody) !== canonicalJson(expected)) invalid(updateFailure);
    return nextBody;
  }
  assertChangedOnly(current, nextBody, allowedByKind.get(command.kind), command.kind);
  return nextBody;
}

export function validateTaskCommandMutation(command, current, nextBody) {
  return validateTaskLikeCommandMutation(command, current, nextBody, {
    updateCommand: 'task.update',
    updateFailure: 'task.update may only apply the descriptive changes in its payload',
    allowedByKind: new Map([
      ['task.promote', new Set(['state', 'updated_at'])],
      ['task.grant', new Set([
        'state', 'resume_state', 'producer_actor', 'producing_actors', 'next_role', 'lease', 'updated_at',
      ])],
      ['task.transition', new Set([
        'state', 'resume_state', 'acceptance_actor', 'next_role', 'lease',
        'change_ref', 'updated_at',
      ])],
      ['task.handoff', new Set([
        'state', 'resume_state', 'acceptance_actor', 'next_role', 'lease',
        'change_ref', 'updated_at',
      ])],
      ['task.restore', new Set(['state', 'resume_state', 'next_role', 'recovery_hold', 'updated_at'])],
    ]),
  });
}

import {randomUUID} from 'node:crypto';
import {
  RuntimeError,
  criteriaRef,
} from './contract.mjs';
import {
  completionApproval,
  recoveryResolution,
  requireDeploymentEvidence,
  requireOperatorApproval,
  requireReleaseEvidence,
  requireReviews,
} from './acceptance.mjs';
import {
  sameActor, requireRoleAvailable, requireActorAvailable, requireActionGrant,
  requireHostActionGrant, requireNamedAuthority, leaseIsLive, requireLease, requireActingAuthority,
  requireLeasedActingAuthority,
} from './authority.mjs';
import {assertAlignedAncestors, hasStaleDirection} from './hierarchy-engine.mjs';
import {
  TASK_NEEDS_CHANGE_REF,
  TASK_TERMINAL_STATES,
} from '../coordination.mjs';

export const GRANTABLE_STATES = new Set([
  'ready',
  'in-progress',
  'in-review',
  'release-ready',
  'deploying',
  'production-verification',
]);
export const SHIP_STATES = new Set([
  'release-ready',
  'deploying',
  'production-verification',
]);
const ALLOWED_TRANSITIONS = new Map([
  ['proposed', new Set(['dropped'])],
  ['ready', new Set(['blocked', 'dropped'])],
  ['in-progress', new Set(['in-review', 'blocked', 'dropped'])],
  ['in-review', new Set(['in-progress', 'completed', 'release-ready', 'blocked', 'dropped'])],
  ['release-ready', new Set(['deploying', 'blocked', 'dropped'])],
  ['deploying', new Set(['production-verification', 'blocked', 'dropped'])],
  ['production-verification', new Set(['shipped', 'blocked', 'dropped'])],
  ['blocked', new Set(['dropped'])],
  ['completed', new Set()],
  ['shipped', new Set()],
  ['dropped', new Set()],
]);

function fail(code, message, retryable = false) {
  throw new RuntimeError(code, message, retryable);
}

function requireKnownTaskRoles(body, authority) {
  for (const [label, role] of [
    ['scope authority', body.scope_authority],
    ['completion authority', body.completion_authority],
    ['next role', body.next_role],
    ['producer', body.producer_actor?.role ?? null],
    ['acceptance actor', body.acceptance_actor?.role ?? null],
  ]) {
    if (role !== null) requireRoleAvailable(role, authority, label);
  }
  for (const requirement of body.review_requirements) {
    requireRoleAvailable(requirement.role, authority, 'review requirement');
  }
}

function taskRecord(body, version = 1) {
  return {
    kind: 'task',
    id: body.id,
    subject: null,
    version,
    body,
  };
}

function assertCurrentAlignment(tx, task, runtime) {
  const feature = tx.get('feature', task.body.feature_id);
  if (!feature) {
    fail('EVIDENCE_GAP', `task/${task.id} has no current Feature ancestor`);
  }
  const epic = tx.get('epic', feature.body.epic_id);
  if (!epic) {
    fail('EVIDENCE_GAP', `feature/${feature.id} has no current Epic ancestor`);
  }
  return assertAlignedAncestors(tx, task, runtime.direction(epic.body.direction_ref));
}

function alignmentFailure(tx, task, runtime) {
  try {
    assertCurrentAlignment(tx, task, runtime);
    return null;
  } catch (error) {
    if (error instanceof RuntimeError && error.code === 'EVIDENCE_GAP') return error;
    throw error;
  }
}

export function taskStateSatisfies(task, requirement) {
  if (requirement === 'in-review') {
    return new Set([
      'in-review', 'completed', 'release-ready', 'deploying',
      'production-verification', 'shipped',
    ]).has(task.body.state);
  }
  if (requirement === 'completed') {
    return task.body.delivery_class === 'knowledge' && task.body.state === 'completed';
  }
  if (requirement === 'release-ready') {
    return task.body.delivery_class !== 'knowledge'
      && new Set([
        'release-ready', 'deploying', 'production-verification', 'shipped',
      ]).has(task.body.state);
  }
  return task.body.delivery_class !== 'knowledge' && task.body.state === 'shipped';
}

function dependencyStatus(tx, task) {
  const pending = [];
  const failed = [];
  for (const dependency of task.body.depends_on) {
    const upstream = tx.get('task', dependency.task);
    if (!upstream) {
      fail('EVIDENCE_GAP',
        `dependency task/${dependency.task} does not exist`);
    }
    if (upstream.body.state === 'dropped') {
      failed.push(dependency.task);
    } else if (!taskStateSatisfies(upstream, dependency.requires)) {
      pending.push(dependency.task);
    }
  }
  return {pending, failed};
}

function assertNoDependencyCycle(tx, candidate) {
  const all = new Map(tx.list('task').map(record => [record.id, record.body]));
  all.set(candidate.id, candidate);
  const visiting = new Set();
  const visited = new Set();

  const visit = id => {
    if (visiting.has(id)) fail('INVALID_INPUT', `dependency cycle includes task/${id}`);
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
  const normalized = touch.replaceAll('\\', '/').toLowerCase();
  const segments = normalized.split('/');
  // Unknown glob syntax and parent traversal cannot prove isolation.
  if (segments.includes('..') || normalized.startsWith('/') || /^[a-z]:/.test(normalized)) {
    return {prefix: '', wildcard: true};
  }
  const path = segments.filter(segment => segment !== '' && segment !== '.').join('/');
  const wildcard = path.search(/[*?[\]{}()!+@]/);
  return {
    prefix: wildcard === -1 ? path : path.slice(0, wildcard),
    wildcard: wildcard !== -1 || normalized.endsWith('/'),
  };
}

function touchesOverlap(left, right) {
  for (const leftTouch of left) {
    for (const rightTouch of right) {
      const left = touchPrefix(leftTouch);
      const right = touchPrefix(rightTouch);
      if (left.prefix === right.prefix) return true;
      if ((left.wildcard || right.wildcard)
        && (left.prefix.startsWith(right.prefix) || right.prefix.startsWith(left.prefix))) return true;
    }
  }
  return false;
}

function requireNoTouchConflict(tx, task) {
  for (const other of tx.list('task')) {
    if (other.id === task.id || !leaseIsLive(other.body.lease)) continue;
    if (touchesOverlap(task.body.touches, other.body.touches)) {
      fail('LEASE_CONFLICT',
        `task/${task.id} touch set conflicts with active task/${other.id}`);
    }
  }
}

function requireNoOpenQuestions(task) {
  if (task.body.waiting_on_questions.length > 0) {
    fail('EVIDENCE_GAP',
      `task/${task.id} has unanswered blocking questions`);
  }
}

function requireImmutableSubject(task) {
  if (task.body.change_ref === null) {
    fail('EVIDENCE_GAP', `task/${task.id} has no immutable change subject`);
  }
}

function requireTransition(tx, task, command, authority, to) {
  const from = task.body.state;
  if (!ALLOWED_TRANSITIONS.get(from)?.has(to)) {
    fail('INVALID_INPUT', `task lifecycle does not allow ${from} -> ${to}`);
  }
  if (task.body.lease !== null && !leaseIsLive(task.body.lease)) {
    fail('RECOVERY_REQUIRED', `task/${task.id} lease expired and must be reconciled`);
  }
  if (to !== 'blocked' && to !== 'dropped') requireNoOpenQuestions(task);
  const dependencies = dependencyStatus(tx, task);
  if (dependencies.failed.length > 0 && to !== 'blocked' && to !== 'dropped') {
    fail('RECOVERY_REQUIRED',
      `task/${task.id} has failed dependencies: ${dependencies.failed.join(', ')}`);
  }
  if (dependencies.pending.length > 0 && to !== 'blocked' && to !== 'dropped') {
    fail('EVIDENCE_GAP',
      `task/${task.id} has pending dependencies: ${dependencies.pending.join(', ')}`);
  }

  if (to === 'ready') {
    requireNamedAuthority(tx, command, authority, 'task.promote',
      task.body.scope_authority);
    return null;
  }
  if (to === 'dropped') {
    requireNamedAuthority(tx, command, authority, 'task.transition',
      task.body.scope_authority);
    return null;
  }

  requireActingAuthority(tx, task, command, authority, 'task.transition');
  if (to === 'in-review') {
    if (!sameActor(command.actor, task.body.producer_actor)) {
      fail('AUTHORITY_REQUIRED', 'only the producing actor may submit its work for review');
    }
    requireImmutableSubject(task);
  }
  if (to === 'completed') {
    if (task.body.delivery_class !== 'knowledge') {
      fail('INVALID_INPUT', 'completed is reserved for knowledge Tasks');
    }
    requireImmutableSubject(task);
    requireReviews(tx, task);
    return completionApproval(tx, task);
  }
  if (to === 'release-ready') {
    if (task.body.delivery_class === 'knowledge') {
      fail('INVALID_INPUT', 'knowledge Tasks do not enter release-ready');
    }
    if (command.actor.role !== 'workflow-ship') {
      fail('AUTHORITY_REQUIRED', 'workflow-ship owns release readiness');
    }
    requireImmutableSubject(task);
    requireReviews(tx, task);
    const approval = completionApproval(tx, task);
    requireReleaseEvidence(tx, task);
    return approval;
  }
  if (to === 'deploying') {
    if (command.actor.role !== 'workflow-ship') {
      fail('AUTHORITY_REQUIRED', 'workflow-ship owns deployment recording');
    }
    requireOperatorApproval(tx, task, 'operator-deploy-start');
  }
  if (to === 'production-verification') {
    if (command.actor.role !== 'workflow-ship') {
      fail('AUTHORITY_REQUIRED', 'workflow-ship owns deployment recording');
    }
    requireOperatorApproval(tx, task, 'operator-deploy-complete');
    requireDeploymentEvidence(tx, task, 'deployment');
  }
  if (to === 'shipped') {
    if (command.actor.role !== 'workflow-ship') {
      fail('AUTHORITY_REQUIRED', 'workflow-ship owns shipment recording');
    }
    requireDeploymentEvidence(tx, task, 'deployment');
    requireDeploymentEvidence(tx, task, 'production-verification');
  }
  return null;
}

function transitionBody(tx, task, command, authority, runtime, to, at) {
  if ((to !== 'blocked' && to !== 'dropped')
    || hasStaleDirection(tx, task, runtime.direction)) {
    assertCurrentAlignment(tx, task, runtime);
  }
  const candidate = to === 'in-review'
    ? {
      ...task,
      body: {
        ...task.body,
        change_ref: command.payload.subject,
      },
    }
    : task;
  const approval = requireTransition(tx, candidate, command, authority, to);
  let nextRole = task.body.next_role;
  if (to === 'in-progress') {
    nextRole = task.body.producer_actor?.role ?? task.body.next_role;
  } else if (to === 'in-review') {
    nextRole = task.body.review_requirements[0]?.role
      ?? task.body.completion_authority;
  } else if (to === 'release-ready') {
    nextRole = 'operator';
  } else if (to === 'deploying' || to === 'production-verification') {
    nextRole = 'workflow-ship';
  } else if (TASK_TERMINAL_STATES.has(to)) {
    nextRole = null;
  }
  retireLeaseGrants(tx, task, 'revoked');
  return {
    ...task.body,
    state: to,
    resume_state: to === 'blocked' ? task.body.state : null,
    acceptance_actor: approval?.authority ?? task.body.acceptance_actor,
    next_role: nextRole,
    change_ref: to === 'in-review'
      ? command.payload.subject
      : task.body.change_ref,
    lease: null,
    updated_at: at,
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
  provenance,
}) {
  if (tx.get('message', messageId)) {
    fail('OPERATION_CONFLICT', `message/${messageId} already exists`);
  }
  if (parentId !== null && !tx.get('message', parentId)) {
    fail('INVALID_INPUT', `parent message/${parentId} does not exist`);
  }
  const body = {
    schema_version: 1,
    message_id: messageId,
    thread_id: task.id,
    item_id: task.id,
    parent_id: parentId,
    sender_role: command.actor.role,
    sender_run: command.actor.runId,
    recipient,
    kind,
    created_at: createdAt,
    basis_version: task.version,
    payload: content,
    artifact_refs: artifactRefs,
    evidence_refs: evidenceRefs,
    provenance,
  };
  tx.put({
    kind: 'message',
    id: messageId,
    subject: {kind: 'item', id: task.id},
    version: 1,
    body,
  });
  return body;
}

function handleTaskCreate(current, tx, command, authority, runtime) {
  if (current !== null) fail('VERSION_CONFLICT', `task/${command.recordId} exists`);
  const body = command.payload.body;
  if (body.state !== 'proposed') {
    fail('INVALID_INPUT', 'new Tasks must begin proposed');
  }
  assertCurrentAlignment(tx, taskRecord(body), runtime);
  requireActionGrant(tx, command, authority, 'task.create');
  requireKnownTaskRoles(body, authority);
  if (body.producer_actor && sameActor(body.producer_actor, body.acceptance_actor)) {
    fail('AUTHORITY_REQUIRED', 'the producer cannot be the acceptance actor');
  }
  assertNoDependencyCycle(tx, body);
  return body;
}

function handleTaskUpdate(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireActingAuthority(tx, current, command, authority, 'task.update');
  const changes = Object.hasOwn(command.payload, 'changes')
    ? command.payload.changes
    : {title: command.payload.title};
  const next = {...current.body, ...changes};
  const acceptedState = current.body.state === 'blocked'
    ? current.body.resume_state : current.body.state;
  if ((TASK_TERMINAL_STATES.has(acceptedState) || SHIP_STATES.has(acceptedState))
    && criteriaRef(next) !== criteriaRef(current.body)) {
    fail('INVALID_INPUT', 'accepted criteria are frozen; record changed requirements as new work');
  }
  if (current.body.recovery_hold !== null && Object.hasOwn(changes, 'next_role')) {
    fail('AUTHORITY_REQUIRED', 'operator resolution must release the recovery routing hold');
  }
  requireKnownTaskRoles(next, authority);
  assertNoDependencyCycle(tx, next);
  if (current.body.lease !== null && Object.hasOwn(changes, 'touches')) {
    requireNoTouchConflict(tx, {...current, body: next});
  }
  return next;
}

function handleTaskPromote(current, tx, command, authority, runtime) {
  if (current.body.state !== 'proposed') {
    fail('INVALID_INPUT', 'task.promote requires a proposed task');
  }
  assertCurrentAlignment(tx, current, runtime);
  requireKnownTaskRoles(current.body, authority);
  requireNamedAuthority(tx, command, authority, 'task.promote',
    current.body.scope_authority);
  dependencyStatus(tx, current);
  return {
    ...current.body,
    state: 'ready',
    updated_at: command.payload.at,
  };
}

function createPersistedGrant(tx, task, command, holder, actions, acquiredAt, expiresAt, token) {
  const grantId = randomUUID();
  tx.put({
    kind: 'grant',
    id: grantId,
    subject: {kind: 'item', id: task.id},
    version: 1,
    body: {
      schema_version: 1,
      grant_id: grantId,
      item_id: task.id,
      actor: holder,
      actions,
      record_kind: 'task',
      record_id: task.id,
      basis_ref: `task/${task.id}@${task.version}`,
      lease_token: token,
      issued_by: command.actor,
      created_at: acquiredAt,
      expires_at: expiresAt,
      status: 'active',
    },
  });
  return grantId;
}

function retireLeaseGrants(tx, task, status) {
  if (task.body.lease === null) return;
  for (const record of tx.list('grant', {kind: 'item', id: task.id})) {
    if (record.body.lease_token === task.body.lease.token && record.body.status === 'active') {
      tx.put({...record, version: record.version + 1, body: {...record.body, status}});
    }
  }
}

function withProducer(body, actor) {
  const history = [...body.producing_actors];
  for (const producer of [body.producer_actor, actor]) {
    if (producer && !history.some(previous => sameActor(previous, producer))) history.push(producer);
  }
  return {producer_actor: actor, producing_actors: history};
}

function handleTaskGrant(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireActionGrant(tx, command, authority, 'task.grant');
  requireKnownTaskRoles(current.body, authority);
  if (current.body.recovery_hold !== null) {
    fail('AUTHORITY_REQUIRED', 'operator resolution is required before regrant');
  }
  if (current.body.lease !== null) {
    if (leaseIsLive(current.body.lease)) {
      fail('LEASE_CONFLICT', `task/${current.id} already has a live lease`);
    }
    fail('RECOVERY_REQUIRED',
      `task/${current.id} has an expired lease that must be reconciled`);
  }
  if (!GRANTABLE_STATES.has(current.body.state)) {
    fail('INVALID_INPUT', `task/${current.id} cannot be granted from ${current.body.state}`);
  }
  requireRoleAvailable(command.payload.holder.role, authority, 'lease holder');
  if (command.payload.holder.role === 'operator') {
    fail('INVALID_INPUT', 'operator is a reserved endpoint and cannot hold a lease');
  }
  if (current.body.next_role !== null
    && current.body.next_role !== command.payload.holder.role) {
    fail('AUTHORITY_REQUIRED',
      `task/${current.id} is routed to ${current.body.next_role}`);
  }
  if (Date.parse(command.payload.expiresAt) <= Date.now()) {
    fail('INVALID_INPUT', 'a new lease must expire in the future');
  }
  requireNoOpenQuestions(current);
  const dependencies = dependencyStatus(tx, current);
  if (dependencies.failed.length > 0) {
    return {
      ...current.body,
      state: 'blocked',
      resume_state: current.body.state,
      lease: null,
      updated_at: command.payload.acquiredAt,
    };
  }
  if (dependencies.pending.length > 0) {
    fail('EVIDENCE_GAP',
      `task/${current.id} has pending dependencies: ${dependencies.pending.join(', ')}`);
  }
  requireNoTouchConflict(tx, current);

  const token = randomUUID();
  createPersistedGrant(
    tx,
    current,
    command,
    command.payload.holder,
    command.payload.actions,
    command.payload.acquiredAt,
    command.payload.expiresAt,
    token,
  );
  return {
    ...current.body,
    state: current.body.state === 'ready' ? 'in-progress' : current.body.state,
    ...(current.body.state === 'ready' || current.body.state === 'in-progress'
      ? withProducer(current.body, command.payload.holder) : {}),
    next_role: command.payload.holder.role,
    lease: {
      holder: command.payload.holder,
      token,
      version_at_grant: current.version,
      acquired_at: command.payload.acquiredAt,
      expires_at: command.payload.expiresAt,
    },
    updated_at: command.payload.acquiredAt,
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
    command.payload.at,
  );
}

function handleTaskHandoff(current, tx, command, authority, runtime) {
  const staleDirection = hasStaleDirection(tx, current, runtime.direction);
  if (staleDirection) {
    requireLeasedActingAuthority(tx, current, command, authority, 'task.handoff');
    if (command.payload.state !== null) {
      fail('AUTHORITY_REQUIRED',
        `Direction-stale task/${current.id} handoff must preserve execution state`);
    }
    if (!new Set([current.body.scope_authority, 'operator'])
      .has(command.payload.toRole)) {
      fail('AUTHORITY_REQUIRED',
        `Direction-stale task/${current.id} may hand off only to a safe owner`);
    }
  } else {
    requireActingAuthority(tx, current, command, authority, 'task.handoff');
  }
  if (current.body.recovery_hold !== null) {
    fail('AUTHORITY_REQUIRED', 'operator resolution is required before handoff');
  }
  requireRoleAvailable(command.payload.toRole, authority, 'handoff recipient');
  let next = current.body;
  if (command.payload.state !== null) {
    next = transitionBody(
      tx,
      current,
      command,
      authority,
      runtime,
      command.payload.state,
      command.payload.createdAt,
    );
  } else if (!staleDirection) {
    const alignment = alignmentFailure(tx, current, runtime);
    if (alignment && !new Set([current.body.scope_authority, 'operator'])
      .has(command.payload.toRole)) {
      fail('AUTHORITY_REQUIRED',
        `Direction-stale task/${current.id} may hand off only to a safe owner`);
    }
  }
  putMessage(tx, current, command, {
    messageId: command.payload.messageId,
    parentId: command.payload.parentId,
    recipient: command.payload.toRole,
    kind: 'handoff',
    createdAt: command.payload.createdAt,
    content: command.payload.content,
    artifactRefs: command.payload.artifactRefs,
    evidenceRefs: command.payload.evidenceRefs,
    provenance: command.payload.provenance,
  });
  retireLeaseGrants(tx, current, 'revoked');
  return {
    ...next,
    next_role: command.payload.toRole,
    lease: null,
    updated_at: command.payload.createdAt,
  };
}

function requireRestorationAuthority(task, command, authority) {
  requireHostActionGrant(command, authority, 'task.restore');
  if (SHIP_STATES.has(task.body.resume_state) && command.actor.role !== 'workflow-ship') {
    fail('AUTHORITY_REQUIRED', `workflow-ship must restore ${task.body.resume_state}`);
  }
}

function handleTaskRestore(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireRestorationAuthority(current, command, authority);
  if (current.body.state !== 'blocked' || current.body.resume_state === null) {
    fail('INVALID_INPUT', 'task.restore requires a blocked task with resume_state');
  }
  const resolution = current.body.recovery_hold !== null
    ? recoveryResolution(tx, current, command.payload.recoveryApprovalId) : null;
  if (resolution) requireRoleAvailable(resolution.recovery.resume_role, authority, 'recovery recipient');
  if (!resolution && command.payload.recoveryApprovalId) {
    fail('INVALID_INPUT', 'task has no recovery hold to resolve');
  }
  if (current.body.lease !== null) {
    fail('RECOVERY_REQUIRED', 'the blocked reservation must be reconciled before restoration');
  }
  requireNoOpenQuestions(current);
  const dependencies = dependencyStatus(tx, current);
  if (dependencies.failed.length > 0) {
    fail('RECOVERY_REQUIRED',
      `task/${current.id} still has failed dependencies`);
  }
  if (dependencies.pending.length > 0) {
    fail('EVIDENCE_GAP',
      `task/${current.id} still has pending dependencies`);
  }
  if (TASK_NEEDS_CHANGE_REF.has(current.body.resume_state)
    && current.body.change_ref === null) {
    fail('EVIDENCE_GAP',
      `task/${current.id} cannot restore ${current.body.resume_state} without a change subject`);
  }
  return {
    ...current.body,
    state: current.body.resume_state,
    resume_state: null,
    recovery_hold: null,
    next_role: resolution?.recovery.resume_role ?? current.body.next_role,
    updated_at: command.payload.at,
  };
}

function handleQuestionOpen(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireActingAuthority(tx, current, command, authority, 'question.open');
  if (TASK_TERMINAL_STATES.has(current.body.state)) {
    fail('INVALID_INPUT', 'terminal Tasks cannot open questions');
  }
  if (command.payload.kind !== 'question') {
    fail('INVALID_INPUT', 'question.open message kind must be "question"');
  }
  requireRoleAvailable(command.payload.recipient, authority, 'question recipient');
  if (command.payload.recipient === 'operator'
    && command.payload.content.questionKind === 'fact') {
    fail('AUTHORITY_REQUIRED',
      'fact questions must be addressed to the real role that owns the fact');
  }
  if (tx.get('question', command.payload.questionId)) {
    fail('OPERATION_CONFLICT',
      `question/${command.payload.questionId} already exists`);
  }
  const message = putMessage(tx, current, command, {
    messageId: command.payload.messageId,
    parentId: command.payload.parentId,
    recipient: command.payload.recipient,
    kind: 'question',
    createdAt: command.payload.createdAt,
    content: command.payload.content,
    artifactRefs: command.payload.artifactRefs,
    evidenceRefs: command.payload.evidenceRefs,
    provenance: command.payload.provenance,
  });
  const content = command.payload.content;
  tx.put({
    kind: 'question',
    id: command.payload.questionId,
    subject: {kind: 'item', id: current.id},
    version: 1,
    body: {
      schema_version: 1,
      question_id: command.payload.questionId,
      item_id: current.id,
      asker: command.actor,
      recipient: command.payload.recipient,
      kind: content.questionKind,
      blocking: content.blocking,
      status: 'open',
      context: content.context,
      ask: content.ask,
      answer_by: content.answerBy,
      opened_message_id: message.message_id,
      answer_message_ids: [],
      resolution: null,
    },
  });
  if (!content.blocking) {
    return {...current.body, updated_at: command.payload.createdAt};
  }
  retireLeaseGrants(tx, current, 'revoked');
  const waiting = current.body.waiting_on_questions.includes(command.payload.questionId)
    ? current.body.waiting_on_questions
    : [...current.body.waiting_on_questions, command.payload.questionId];
  return {
    ...current.body,
    state: 'blocked',
    resume_state: current.body.state === 'blocked'
      ? current.body.resume_state
      : current.body.state,
    waiting_on_questions: waiting,
    lease: null,
    updated_at: command.payload.createdAt,
  };
}

function effectiveAnswers(tx, question, answerIds) {
  const answers = answerIds
    .map(id => tx.get('message', id)?.body)
    .filter(candidate => candidate?.kind === 'answer'
      && candidate.item_id === question.subject.id
      && candidate.sender_role === question.body.recipient
      && candidate.recipient === question.body.asker.role
      && candidate.parent_id === question.body.opened_message_id
      && candidate.payload.status === 'answered'
      && candidate.payload.lane === 'in-lane');
  const replaced = new Set(answers.flatMap(answer => answer.payload.resolves ?? []));
  return answers.filter(answer => !replaced.has(answer.message_id));
}

function handleQuestionAnswer(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  if (command.payload.kind !== 'answer') {
    fail('INVALID_INPUT', 'question.answer message kind must be "answer"');
  }
  const question = tx.get('question', command.payload.questionId);
  if (question?.subject?.kind !== 'item' || question.subject.id !== current.id) {
    fail('INVALID_INPUT',
      `question/${command.payload.questionId} does not belong to task/${current.id}`);
  }
  if (command.actor.role !== question.body.recipient) {
    fail('AUTHORITY_REQUIRED',
      `question/${question.id} is addressed to ${question.body.recipient}`);
  }
  if (command.actor.role === 'operator') {
    requireActionGrant(tx, command, authority, 'question.answer');
  } else {
    requireActorAvailable(command, authority);
  }
  if (command.payload.recipient !== question.body.asker.role) {
    fail('INVALID_INPUT', 'answer recipient must be the original asker');
  }
  if (command.payload.parentId !== question.body.opened_message_id) {
    fail('INVALID_INPUT', 'answer parent must be the opening question message');
  }
  if (command.payload.content.resolves) {
    requireHostActionGrant(command, authority, 'question.answer');
    const prior = effectiveAnswers(tx, question, question.body.answer_message_ids);
    const targets = new Set(command.payload.content.resolves);
    if (targets.size !== prior.length || prior.some(answer => !targets.has(answer.message_id))) {
      fail('INVALID_INPUT', 'explicit question resolution must address every effective prior answer');
    }
  }
  const message = putMessage(tx, current, command, {
    messageId: command.payload.messageId,
    parentId: command.payload.parentId,
    recipient: command.payload.recipient,
    kind: 'answer',
    createdAt: command.payload.createdAt,
    content: command.payload.content,
    artifactRefs: command.payload.artifactRefs,
    evidenceRefs: command.payload.evidenceRefs,
    provenance: command.payload.provenance,
  });

  const answerIds = [...question.body.answer_message_ids, message.message_id];
  const answers = effectiveAnswers(tx, question, answerIds);
  const distinctAnswers = new Set(answers.map(answer => answer.payload.answer.trim()));
  const resolved = distinctAnswers.size === 1;
  const resolvingMessage = resolved ? answers.at(-1) : null;
  tx.put({
    ...question,
    version: question.version + 1,
    body: {
      ...question.body,
      status: resolved ? 'answered' : 'open',
      answer_message_ids: answerIds,
      resolution: resolved ? {
        answer: resolvingMessage.payload.answer,
        lane: 'in-lane',
        provenance: resolvingMessage.provenance,
        message_id: resolvingMessage.message_id,
        answered_at: resolvingMessage.created_at,
        sender: {
          role: resolvingMessage.sender_role,
          runId: resolvingMessage.sender_run,
        },
      } : null,
    },
  });

  if (TASK_TERMINAL_STATES.has(current.body.state)) {
    return {...current.body, updated_at: command.payload.createdAt};
  }
  let waiting = current.body.waiting_on_questions;
  if (question.body.blocking) {
    if (resolved) {
      waiting = waiting.filter(id => id !== question.id);
    } else if (!waiting.includes(question.id)) {
      waiting = [...waiting, question.id];
    }
  }
  const shouldBlock = question.body.blocking && !resolved;
  const releaseLease = shouldBlock && leaseIsLive(current.body.lease);
  if (releaseLease) retireLeaseGrants(tx, current, 'revoked');
  return {
    ...current.body,
    state: shouldBlock ? 'blocked' : current.body.state,
    resume_state: shouldBlock && current.body.state !== 'blocked'
      ? current.body.state
      : current.body.resume_state,
    waiting_on_questions: waiting,
    lease: releaseLease ? null : current.body.lease,
    updated_at: command.payload.createdAt,
  };
}

function recoveryEvidence(tx, task, command) {
  if (command.payload.recoveryEvidenceIds.length === 0) {
    fail('EVIDENCE_GAP', 'lease expiry alone cannot authorize recovery');
  }
  for (const id of command.payload.recoveryEvidenceIds) {
    const record = tx.get('evidence', id);
    if (record?.subject?.kind !== 'item' || record.subject.id !== task.id
      || record.body.kind !== 'recovery-reconciliation'
      || record.body.outcome !== 'passed'
      || record.body.data.stale_lease_token !== task.body.lease.token
      || record.body.data.disposition !== command.payload.disposition
      || record.body.data.observed !== command.payload.observed
      || Date.parse(record.body.created_at) < Date.parse(task.body.lease.expires_at)) {
      fail('EVIDENCE_GAP',
        `evidence/${id} does not reconcile the stale lease and disposition`);
    }
  }
}

function handleAttemptRecover(current, tx, command, authority, runtime) {
  requireActionGrant(tx, command, authority, 'attempt.recover');
  if (TASK_TERMINAL_STATES.has(current.body.state)) {
    fail('INVALID_INPUT',
      `task/${current.id} cannot recover a lease from ${current.body.state}`);
  }
  if (current.body.lease === null) {
    fail('INVALID_INPUT', `task/${current.id} has no lease to recover`);
  }
  if (leaseIsLive(current.body.lease)) {
    fail('LEASE_CONFLICT', `task/${current.id} lease has not expired`);
  }
  recoveryEvidence(tx, current, command);
  if (tx.get('attempt', command.payload.attemptId)
    || tx.get('message', command.payload.attemptId)) {
    fail('OPERATION_CONFLICT',
      `attempt/${command.payload.attemptId} already exists`);
  }
  const staleLease = current.body.lease;
  let newLease = null;
  let state = current.body.state;
  let resumeState = current.body.resume_state;
  let nextRole = current.body.next_role;
  let producing = {};
  let recoveryHold = current.body.recovery_hold;

  if (command.payload.disposition === 'safe-to-resume' && recoveryHold !== null) {
    fail('AUTHORITY_REQUIRED', 'operator resolution is required before recovery');
  }
  if (command.payload.disposition === 'safe-to-resume' && command.payload.redispatch !== null) {
    assertCurrentAlignment(tx, current, runtime);
    requireNoOpenQuestions(current);
    const dependencies = dependencyStatus(tx, current);
    if (dependencies.failed.length > 0) {
      fail('RECOVERY_REQUIRED', `task/${current.id} has failed dependencies`);
    }
    if (dependencies.pending.length > 0) {
      fail('EVIDENCE_GAP', `task/${current.id} has pending dependencies`);
    }
    if (state === 'blocked') {
      requireRestorationAuthority(current, command, authority);
      state = resumeState;
      resumeState = null;
      if (!GRANTABLE_STATES.has(state)) {
        fail('INVALID_INPUT', 'blocked lease has no resumable work state');
      }
    }
    if (TASK_NEEDS_CHANGE_REF.has(state) && current.body.change_ref === null) {
      fail('EVIDENCE_GAP', `task/${current.id} cannot resume ${state} without an immutable subject`);
    }
    requireRoleAvailable(command.payload.redispatch.role, authority, 'recovery recipient');
    if (command.payload.redispatch.role === 'operator') {
      fail('INVALID_INPUT', 'operator cannot receive a recovery lease');
    }
    if (Date.parse(command.payload.expiresAt) <= Date.now()) {
      fail('INVALID_INPUT', 'a recovered lease must expire in the future');
    }
    requireNoTouchConflict(tx, current);
    const token = randomUUID();
    newLease = {
      holder: command.payload.redispatch,
      token,
      version_at_grant: current.version,
      acquired_at: command.payload.createdAt,
      expires_at: command.payload.expiresAt,
    };
    createPersistedGrant(
      tx,
      current,
      command,
      command.payload.redispatch,
      ['task.update', 'task.transition', 'task.handoff', 'question.open'],
      command.payload.createdAt,
      command.payload.expiresAt,
      token,
    );
    nextRole = command.payload.redispatch.role;
    if (state === 'in-progress') {
      producing = withProducer(current.body, command.payload.redispatch);
    }
  } else if (command.payload.disposition === 'conflicting-partial-work') {
    if (state !== 'blocked') {
      resumeState = state;
      state = 'blocked';
    }
    nextRole = 'operator';
    recoveryHold = command.payload.attemptId;
  }

  retireLeaseGrants(tx, current, 'recovered');
  tx.put({
    kind: 'attempt',
    id: command.payload.attemptId,
    subject: {kind: 'item', id: current.id},
    version: 1,
    body: {
      schema_version: 1,
      attempt_id: command.payload.attemptId,
      item_id: current.id,
      grantor: command.actor,
      stale_lease: staleLease,
      observed: command.payload.observed,
      disposition: command.payload.disposition,
      recovery_evidence_ids: command.payload.recoveryEvidenceIds,
      new_lease: newLease,
      created_at: command.payload.createdAt,
    },
  });
  putMessage(tx, current, command, {
    messageId: command.payload.attemptId,
    parentId: null,
    recipient: command.payload.redispatch?.role
      ?? (command.payload.disposition === 'conflicting-partial-work'
        ? 'operator' : current.body.next_role ?? command.actor.role),
    kind: 'recovery',
    createdAt: command.payload.createdAt,
    content: {
      observed: command.payload.observed,
      disposition: command.payload.disposition,
      staleLeaseToken: staleLease.token,
      newLeaseToken: newLease?.token ?? null,
    },
    artifactRefs: [],
    evidenceRefs: command.payload.recoveryEvidenceIds,
    provenance: 'durable-thread',
  });
  return {
    ...current.body,
    state,
    resume_state: resumeState,
    next_role: nextRole,
    ...producing,
    recovery_hold: recoveryHold,
    lease: newLease,
    updated_at: command.payload.createdAt,
  };
}

export const taskHandlers = new Map([
  ['task.create', handleTaskCreate],
  ['task.update', handleTaskUpdate],
  ['task.promote', handleTaskPromote],
  ['task.grant', handleTaskGrant],
  ['task.transition', handleTaskTransition],
  ['task.handoff', handleTaskHandoff],
  ['task.restore', handleTaskRestore],
  ['question.open', handleQuestionOpen],
  ['question.answer', handleQuestionAnswer],
  ['attempt.recover', handleAttemptRecover],
]);

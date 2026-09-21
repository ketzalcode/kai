import {randomUUID} from 'node:crypto';
import {bindEvidenceTransaction} from './evidence-context.mjs';
import {
  RuntimeError,
  canonicalJson,
  criteriaRef,
  validateAuthority,
  validateCommand,
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
  applyOperation,
  readMessageOperation,
} from './store.mjs';
import {
  sameActor, requireRoleAvailable, requireActorAvailable, requireActionGrant,
  requireHostActionGrant, requireNamedAuthority, leaseIsLive, requireLease, requireActingAuthority,
} from './authority.mjs';
import {
  NEEDS_CHANGE_REF,
  TERMINAL,
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
const INITIATIVE_TRANSITIONS = new Map([
  ['proposed', new Set(['proposed', 'active'])],
  ['active', new Set(['active', 'paused', 'completed', 'shipped'])],
  ['paused', new Set(['paused', 'active'])],
  ['completed', new Set(['completed', 'archived'])],
  ['shipped', new Set(['shipped', 'archived'])],
  ['archived', new Set(['archived'])],
]);

function fail(code, message, retryable = false) {
  throw new RuntimeError(code, message, retryable);
}

function requireKnownItemRoles(body, authority) {
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

export function itemStateSatisfies(item, requirement) {
  if (requirement === 'in-review') {
    return new Set([
      'in-review', 'completed', 'release-ready', 'deploying',
      'production-verification', 'shipped',
    ]).has(item.body.state);
  }
  if (requirement === 'completed') {
    return item.body.delivery_class === 'knowledge' && item.body.state === 'completed';
  }
  if (requirement === 'release-ready') {
    return item.body.delivery_class !== 'knowledge'
      && new Set([
        'release-ready', 'deploying', 'production-verification', 'shipped',
      ]).has(item.body.state);
  }
  return item.body.delivery_class !== 'knowledge' && item.body.state === 'shipped';
}

function dependencyStatus(tx, item) {
  const pending = [];
  const failed = [];
  for (const dependency of item.body.depends_on) {
    const upstream = tx.get('item', dependency.item);
    if (!upstream) {
      fail('EVIDENCE_GAP',
        `dependency item/${dependency.item} does not exist`);
    }
    if (upstream.body.state === 'dropped') {
      failed.push(dependency.item);
    } else if (!itemStateSatisfies(upstream, dependency.requires)) {
      pending.push(dependency.item);
    }
  }
  return {pending, failed};
}

function assertNoDependencyCycle(tx, candidate) {
  const all = new Map(tx.list('item').map(record => [record.id, record.body]));
  all.set(candidate.id, candidate);
  const visiting = new Set();
  const visited = new Set();

  const visit = id => {
    if (visiting.has(id)) fail('INVALID_INPUT', `dependency cycle includes item/${id}`);
    if (visited.has(id)) return;
    const item = all.get(id);
    if (!item) return;
    visiting.add(id);
    for (const dependency of item.depends_on) visit(dependency.item);
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

function requireNoTouchConflict(tx, item) {
  for (const other of tx.list('item')) {
    if (other.id === item.id || !leaseIsLive(other.body.lease)) continue;
    if (touchesOverlap(item.body.touches, other.body.touches)) {
      fail('LEASE_CONFLICT',
        `item/${item.id} touch set conflicts with active item/${other.id}`);
    }
  }
}

function requireNoOpenQuestions(item) {
  if (item.body.waiting_on_questions.length > 0) {
    fail('EVIDENCE_GAP',
      `item/${item.id} has unanswered blocking questions`);
  }
}

function requireImmutableSubject(item) {
  if (item.body.change_ref === null) {
    fail('EVIDENCE_GAP', `item/${item.id} has no immutable change subject`);
  }
}

function requireTransition(tx, item, command, authority, to) {
  const from = item.body.state;
  if (!ALLOWED_TRANSITIONS.get(from)?.has(to)) {
    fail('INVALID_INPUT', `item lifecycle does not allow ${from} -> ${to}`);
  }
  if (item.body.lease !== null && !leaseIsLive(item.body.lease)) {
    fail('RECOVERY_REQUIRED', `item/${item.id} lease expired and must be reconciled`);
  }
  if (to !== 'blocked' && to !== 'dropped') requireNoOpenQuestions(item);
  const dependencies = dependencyStatus(tx, item);
  if (dependencies.failed.length > 0 && to !== 'blocked' && to !== 'dropped') {
    fail('RECOVERY_REQUIRED',
      `item/${item.id} has failed dependencies: ${dependencies.failed.join(', ')}`);
  }
  if (dependencies.pending.length > 0 && to !== 'blocked' && to !== 'dropped') {
    fail('EVIDENCE_GAP',
      `item/${item.id} has pending dependencies: ${dependencies.pending.join(', ')}`);
  }

  if (to === 'ready') {
    requireNamedAuthority(tx, command, authority, 'item.promote',
      item.body.scope_authority);
    return null;
  }
  if (to === 'dropped') {
    requireNamedAuthority(tx, command, authority, 'item.transition',
      item.body.scope_authority);
    return null;
  }

  requireActingAuthority(tx, item, command, authority, 'item.transition');
  if (to === 'in-review') {
    if (!sameActor(command.actor, item.body.producer_actor)) {
      fail('AUTHORITY_REQUIRED', 'only the producing actor may submit its work for review');
    }
    requireImmutableSubject(item);
  }
  if (to === 'completed') {
    if (item.body.delivery_class !== 'knowledge') {
      fail('INVALID_INPUT', 'completed is reserved for knowledge items');
    }
    requireImmutableSubject(item);
    requireReviews(tx, item);
    return completionApproval(tx, item);
  }
  if (to === 'release-ready') {
    if (item.body.delivery_class === 'knowledge') {
      fail('INVALID_INPUT', 'knowledge items do not enter release-ready');
    }
    if (command.actor.role !== 'workflow-ship') {
      fail('AUTHORITY_REQUIRED', 'workflow-ship owns release readiness');
    }
    requireImmutableSubject(item);
    requireReviews(tx, item);
    const approval = completionApproval(tx, item);
    requireReleaseEvidence(tx, item);
    return approval;
  }
  if (to === 'deploying') {
    if (command.actor.role !== 'workflow-ship') {
      fail('AUTHORITY_REQUIRED', 'workflow-ship owns deployment recording');
    }
    requireOperatorApproval(tx, item, 'operator-deploy-start');
  }
  if (to === 'production-verification') {
    if (command.actor.role !== 'workflow-ship') {
      fail('AUTHORITY_REQUIRED', 'workflow-ship owns deployment recording');
    }
    requireOperatorApproval(tx, item, 'operator-deploy-complete');
    requireDeploymentEvidence(tx, item, 'deployment');
  }
  if (to === 'shipped') {
    if (command.actor.role !== 'workflow-ship') {
      fail('AUTHORITY_REQUIRED', 'workflow-ship owns shipment recording');
    }
    requireDeploymentEvidence(tx, item, 'deployment');
    requireDeploymentEvidence(tx, item, 'production-verification');
  }
  return null;
}

function transitionBody(tx, item, command, authority, to, at) {
  const candidate = to === 'in-review'
    ? {
      ...item,
      body: {
        ...item.body,
        change_ref: command.payload.subject,
      },
    }
    : item;
  const approval = requireTransition(tx, candidate, command, authority, to);
  let nextRole = item.body.next_role;
  if (to === 'in-progress') {
    nextRole = item.body.producer_actor?.role ?? item.body.next_role;
  } else if (to === 'in-review') {
    nextRole = item.body.review_requirements[0]?.role
      ?? item.body.completion_authority;
  } else if (to === 'release-ready') {
    nextRole = 'operator';
  } else if (to === 'deploying' || to === 'production-verification') {
    nextRole = 'workflow-ship';
  } else if (TERMINAL.has(to)) {
    nextRole = null;
  }
  retireLeaseGrants(tx, item, 'revoked');
  return {
    ...item.body,
    state: to,
    resume_state: to === 'blocked' ? item.body.state : null,
    acceptance_actor: approval?.authority ?? item.body.acceptance_actor,
    next_role: nextRole,
    change_ref: to === 'in-review'
      ? command.payload.subject
      : item.body.change_ref,
    lease: null,
    updated_at: at,
  };
}

function putMessage(tx, item, command, {
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
    thread_id: item.id,
    item_id: item.id,
    parent_id: parentId,
    sender_role: command.actor.role,
    sender_run: command.actor.runId,
    recipient,
    kind,
    created_at: createdAt,
    basis_version: item.version,
    payload: content,
    artifact_refs: artifactRefs,
    evidence_refs: evidenceRefs,
    provenance,
  };
  tx.put({
    kind: 'message',
    id: messageId,
    itemId: item.id,
    version: 1,
    body,
  });
  return body;
}

function handleInitiativeCreate(current, tx, command, authority) {
  if (current !== null) fail('VERSION_CONFLICT', `initiative/${command.recordId} exists`);
  requireActionGrant(tx, command, authority, 'initiative.create');
  const body = command.payload.body;
  if (body.status !== 'proposed'
    || body.milestones.some(milestone => milestone.status !== 'proposed')
    || body.backlog.some(entry => entry.status !== 'parked')) {
    fail('INVALID_INPUT', 'new initiatives and milestones must begin proposed with parked backlog');
  }
  requireRoleAvailable(body.owner, authority, 'initiative owner');
  return body;
}

function requireInitiativeClosure(tx, initiative, status) {
  if (status !== 'completed' && status !== 'shipped') return;
  if (initiative.milestones.length === 0) {
    fail('EVIDENCE_GAP', 'initiative closure requires at least one milestone');
  }
  const includesProduction = initiative.milestones.some(
    milestone => milestone.delivery_class !== 'knowledge',
  );
  if (status === 'completed' && includesProduction) {
    fail('INVALID_INPUT', 'initiatives with production milestones must finish shipped');
  }
  if (status === 'shipped' && !includesProduction) {
    fail('INVALID_INPUT', 'knowledge-only initiatives finish completed');
  }
  for (const milestone of initiative.milestones) {
    if (milestone.required_items.length === 0) {
      fail('EVIDENCE_GAP', `milestone/${milestone.id} has no required items`);
    }
    for (const id of milestone.required_items) {
      const item = tx.get('item', id);
      if (!item) fail('EVIDENCE_GAP', `required item/${id} does not exist`);
      const required = milestone.delivery_class === 'knowledge' ? 'completed' : 'shipped';
      if (item.body.state !== required) {
        fail('EVIDENCE_GAP', `required item/${id} has not reached ${required}`);
      }
    }
  }
}

function handleInitiativeUpdate(current, tx, command, authority) {
  requireNamedAuthority(tx, command, authority, 'initiative.update', current.body.owner);
  const next = {...current.body, ...command.payload.changes};
  if (!INITIATIVE_TRANSITIONS.get(current.body.status)?.has(next.status)) {
    fail('INVALID_INPUT',
      `initiative lifecycle does not allow ${current.body.status} -> ${next.status}`);
  }
  requireInitiativeClosure(tx, next, next.status);
  return next;
}

function handleItemCreate(current, tx, command, authority) {
  if (current !== null) fail('VERSION_CONFLICT', `item/${command.recordId} exists`);
  requireActionGrant(tx, command, authority, 'item.create');
  const body = command.payload.body;
  if (body.state !== 'proposed') {
    fail('INVALID_INPUT', 'new items must begin proposed');
  }
  if (!tx.get('initiative', body.initiative)) {
    fail('EVIDENCE_GAP', `initiative/${body.initiative} does not exist`);
  }
  requireKnownItemRoles(body, authority);
  if (body.producer_actor && sameActor(body.producer_actor, body.acceptance_actor)) {
    fail('AUTHORITY_REQUIRED', 'the producer cannot be the acceptance actor');
  }
  assertNoDependencyCycle(tx, body);
  return body;
}

function handleItemUpdate(current, tx, command, authority) {
  requireActingAuthority(tx, current, command, authority, 'item.update');
  const changes = Object.hasOwn(command.payload, 'changes')
    ? command.payload.changes
    : {title: command.payload.title};
  const next = {...current.body, ...changes};
  const acceptedState = current.body.state === 'blocked'
    ? current.body.resume_state : current.body.state;
  if ((TERMINAL.has(acceptedState) || SHIP_STATES.has(acceptedState))
    && criteriaRef(next) !== criteriaRef(current.body)) {
    fail('INVALID_INPUT', 'accepted criteria are frozen; record changed requirements as new work');
  }
  if (current.body.recovery_hold !== null && Object.hasOwn(changes, 'next_role')) {
    fail('AUTHORITY_REQUIRED', 'operator resolution must release the recovery routing hold');
  }
  requireKnownItemRoles(next, authority);
  assertNoDependencyCycle(tx, next);
  if (current.body.lease !== null && Object.hasOwn(changes, 'touches')) {
    requireNoTouchConflict(tx, {...current, body: next});
  }
  return next;
}

function handleItemPromote(current, tx, command, authority) {
  if (current.body.state !== 'proposed') {
    fail('INVALID_INPUT', 'item.promote requires a proposed item');
  }
  requireKnownItemRoles(current.body, authority);
  requireNamedAuthority(tx, command, authority, 'item.promote',
    current.body.scope_authority);
  dependencyStatus(tx, current);
  return {
    ...current.body,
    state: 'ready',
    updated_at: command.payload.at,
  };
}

function createPersistedGrant(tx, item, command, holder, actions, acquiredAt, expiresAt, token) {
  const grantId = randomUUID();
  tx.put({
    kind: 'grant',
    id: grantId,
    itemId: item.id,
    version: 1,
    body: {
      schema_version: 1,
      grant_id: grantId,
      item_id: item.id,
      actor: holder,
      actions,
      record_kind: 'item',
      record_id: item.id,
      basis_ref: `item/${item.id}@${item.version}`,
      lease_token: token,
      issued_by: command.actor,
      created_at: acquiredAt,
      expires_at: expiresAt,
      status: 'active',
    },
  });
  return grantId;
}

function retireLeaseGrants(tx, item, status) {
  if (item.body.lease === null) return;
  for (const record of tx.list('grant', item.id)) {
    if (record.body.lease_token === item.body.lease.token && record.body.status === 'active') {
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

function handleItemGrant(current, tx, command, authority) {
  requireActionGrant(tx, command, authority, 'item.grant');
  requireKnownItemRoles(current.body, authority);
  if (current.body.recovery_hold !== null) {
    fail('AUTHORITY_REQUIRED', 'operator resolution is required before regrant');
  }
  if (current.body.lease !== null) {
    if (leaseIsLive(current.body.lease)) {
      fail('LEASE_CONFLICT', `item/${current.id} already has a live lease`);
    }
    fail('RECOVERY_REQUIRED',
      `item/${current.id} has an expired lease that must be reconciled`);
  }
  if (!GRANTABLE_STATES.has(current.body.state)) {
    fail('INVALID_INPUT', `item/${current.id} cannot be granted from ${current.body.state}`);
  }
  requireRoleAvailable(command.payload.holder.role, authority, 'lease holder');
  if (command.payload.holder.role === 'operator') {
    fail('INVALID_INPUT', 'operator is a reserved endpoint and cannot hold a lease');
  }
  if (current.body.next_role !== null
    && current.body.next_role !== command.payload.holder.role) {
    fail('AUTHORITY_REQUIRED',
      `item/${current.id} is routed to ${current.body.next_role}`);
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
      `item/${current.id} has pending dependencies: ${dependencies.pending.join(', ')}`);
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

function handleItemTransition(current, tx, command, authority) {
  return transitionBody(
    tx,
    current,
    command,
    authority,
    command.payload.to,
    command.payload.at,
  );
}

function handleItemHandoff(current, tx, command, authority) {
  requireActingAuthority(tx, current, command, authority, 'item.handoff');
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
      command.payload.state,
      command.payload.createdAt,
    );
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

function requireRestorationAuthority(item, command, authority) {
  requireHostActionGrant(command, authority, 'item.restore');
  if (SHIP_STATES.has(item.body.resume_state) && command.actor.role !== 'workflow-ship') {
    fail('AUTHORITY_REQUIRED', `workflow-ship must restore ${item.body.resume_state}`);
  }
}

function handleItemRestore(current, tx, command, authority) {
  requireRestorationAuthority(current, command, authority);
  if (current.body.state !== 'blocked' || current.body.resume_state === null) {
    fail('INVALID_INPUT', 'item.restore requires a blocked item with resume_state');
  }
  const resolution = current.body.recovery_hold !== null
    ? recoveryResolution(tx, current, command.payload.recoveryApprovalId) : null;
  if (resolution) requireRoleAvailable(resolution.recovery.resume_role, authority, 'recovery recipient');
  if (!resolution && command.payload.recoveryApprovalId) {
    fail('INVALID_INPUT', 'item has no recovery hold to resolve');
  }
  if (current.body.lease !== null) {
    fail('RECOVERY_REQUIRED', 'the blocked reservation must be reconciled before restoration');
  }
  requireNoOpenQuestions(current);
  const dependencies = dependencyStatus(tx, current);
  if (dependencies.failed.length > 0) {
    fail('RECOVERY_REQUIRED',
      `item/${current.id} still has failed dependencies`);
  }
  if (dependencies.pending.length > 0) {
    fail('EVIDENCE_GAP',
      `item/${current.id} still has pending dependencies`);
  }
  if (NEEDS_CHANGE_REF.has(current.body.resume_state)
    && current.body.change_ref === null) {
    fail('EVIDENCE_GAP',
      `item/${current.id} cannot restore ${current.body.resume_state} without a change subject`);
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

function handleQuestionOpen(current, tx, command, authority) {
  requireActingAuthority(tx, current, command, authority, 'question.open');
  if (TERMINAL.has(current.body.state)) {
    fail('INVALID_INPUT', 'terminal items cannot open questions');
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
    itemId: current.id,
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
      && candidate.item_id === question.itemId
      && candidate.sender_role === question.body.recipient
      && candidate.recipient === question.body.asker.role
      && candidate.parent_id === question.body.opened_message_id
      && candidate.payload.status === 'answered'
      && candidate.payload.lane === 'in-lane');
  const replaced = new Set(answers.flatMap(answer => answer.payload.resolves ?? []));
  return answers.filter(answer => !replaced.has(answer.message_id));
}

function handleQuestionAnswer(current, tx, command, authority) {
  if (command.payload.kind !== 'answer') {
    fail('INVALID_INPUT', 'question.answer message kind must be "answer"');
  }
  const question = tx.get('question', command.payload.questionId);
  if (!question || question.itemId !== current.id) {
    fail('INVALID_INPUT',
      `question/${command.payload.questionId} does not belong to item/${current.id}`);
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

  if (TERMINAL.has(current.body.state)) {
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

function recoveryEvidence(tx, item, command) {
  if (command.payload.recoveryEvidenceIds.length === 0) {
    fail('EVIDENCE_GAP', 'lease expiry alone cannot authorize recovery');
  }
  for (const id of command.payload.recoveryEvidenceIds) {
    const record = tx.get('evidence', id);
    if (!record || record.itemId !== item.id
      || record.body.kind !== 'recovery-reconciliation'
      || record.body.outcome !== 'passed'
      || record.body.data.stale_lease_token !== item.body.lease.token
      || record.body.data.disposition !== command.payload.disposition
      || record.body.data.observed !== command.payload.observed
      || Date.parse(record.body.created_at) < Date.parse(item.body.lease.expires_at)) {
      fail('EVIDENCE_GAP',
        `evidence/${id} does not reconcile the stale lease and disposition`);
    }
  }
}

function handleAttemptRecover(current, tx, command, authority) {
  requireActionGrant(tx, command, authority, 'attempt.recover');
  if (TERMINAL.has(current.body.state)) {
    fail('INVALID_INPUT',
      `item/${current.id} cannot recover a lease from ${current.body.state}`);
  }
  if (current.body.lease === null) {
    fail('INVALID_INPUT', `item/${current.id} has no lease to recover`);
  }
  if (leaseIsLive(current.body.lease)) {
    fail('LEASE_CONFLICT', `item/${current.id} lease has not expired`);
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
    requireNoOpenQuestions(current);
    const dependencies = dependencyStatus(tx, current);
    if (dependencies.failed.length > 0) {
      fail('RECOVERY_REQUIRED', `item/${current.id} has failed dependencies`);
    }
    if (dependencies.pending.length > 0) {
      fail('EVIDENCE_GAP', `item/${current.id} has pending dependencies`);
    }
    if (state === 'blocked') {
      requireRestorationAuthority(current, command, authority);
      state = resumeState;
      resumeState = null;
      if (!GRANTABLE_STATES.has(state)) {
        fail('INVALID_INPUT', 'blocked lease has no resumable work state');
      }
    }
    if (NEEDS_CHANGE_REF.has(state) && current.body.change_ref === null) {
      fail('EVIDENCE_GAP', `item/${current.id} cannot resume ${state} without an immutable subject`);
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
      ['item.update', 'item.transition', 'item.handoff', 'question.open'],
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
    itemId: current.id,
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

const handlers = new Map([
  ['initiative.create', handleInitiativeCreate],
  ['initiative.update', handleInitiativeUpdate],
  ['item.create', handleItemCreate],
  ['item.update', handleItemUpdate],
  ['item.promote', handleItemPromote],
  ['item.grant', handleItemGrant],
  ['item.transition', handleItemTransition],
  ['item.handoff', handleItemHandoff],
  ['item.restore', handleItemRestore],
  ['question.open', handleQuestionOpen],
  ['question.answer', handleQuestionAnswer],
  ['attempt.recover', handleAttemptRecover],
]);

function duplicateMessageReceipt(store, command) {
  const messageId = command.payload?.messageId;
  if (typeof messageId !== 'string') return null;
  const existing = readMessageOperation(store, messageId);
  if (!existing) return null;
  const expectedEvent = {
    kind: command.kind,
    actor: command.actor,
    recordKind: command.recordKind,
    recordId: command.recordId,
    payload: command.payload,
  };
  if (canonicalJson(existing.event) !== canonicalJson(expectedEvent)) {
    fail('OPERATION_CONFLICT',
      `message/${messageId} was already used with different content`);
  }
  return existing.receipt;
}

export function applyCommand(store, command, authority) {
  validateCommand(command);
  if (!handlers.has(command.kind)) fail('INVALID_INPUT', `${command.kind} requires its dedicated evidence producer`);
  validateAuthority(authority);
  requireActorAvailable(command, authority);
  const duplicate = duplicateMessageReceipt(store, command);
  if (duplicate) return duplicate;
  try {
    return applyOperation(store, command, (current, tx) => {
      bindEvidenceTransaction(store, tx);
      const handler = handlers.get(command.kind);
      return handler(current, tx, command, authority);
    });
  } catch (error) {
    if (command.payload?.messageId
      && (error?.code === 'VERSION_CONFLICT'
        || error?.code === 'OPERATION_CONFLICT')) {
      const racedDuplicate = duplicateMessageReceipt(store, command);
      if (racedDuplicate) return racedDuplicate;
    }
    throw error;
  }
}

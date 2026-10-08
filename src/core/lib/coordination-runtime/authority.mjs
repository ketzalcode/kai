import {RuntimeError} from './contract.mjs';

function fail(code, message) {
  throw new RuntimeError(code, message);
}

export function sameActor(left, right) {
  return left?.role === right?.role && left?.runId === right?.runId;
}

export function requireRoleAvailable(role, authority, label) {
  if (role !== 'operator' && !authority.roles.includes(role)) {
    fail('ROLE_UNAVAILABLE', `${label} role "${role}" is not available`);
  }
}

export function requireActorAvailable(command, authority) {
  requireRoleAvailable(command.actor.role, authority, 'actor');
}

function hostGrantMatches(grant, command, action) {
  return sameActor(grant.actor, command.actor)
    && grant.actions.includes(action)
    && grant.recordKind === command.recordKind
    && grant.recordId === command.recordId
    && grant.basisRef === `${command.recordKind}/${command.recordId}@${command.expectedVersion}`;
}

function hostGrantMatchesBasis(grant, command, action, basisRef) {
  return sameActor(grant.actor, command.actor)
    && grant.actions.includes(action)
    && grant.recordKind === command.recordKind
    && grant.recordId === command.recordId
    && grant.basisRef === basisRef;
}

function persistedGrantMatches(record, command, action) {
  const grant = record.body;
  return grant.status === 'active'
    && sameActor(grant.actor, command.actor)
    && grant.actions.includes(action)
    && grant.record_kind === command.recordKind
    && grant.record_id === command.recordId
    && grant.lease_token === command.leaseToken
    && Date.parse(grant.expires_at) > Date.now();
}

export function hasHostActionGrant(command, authority, action) {
  return authority.grants.some(grant => hostGrantMatches(grant, command, action));
}

export function hasHostActionGrantForBasis(command, authority, action, basisRef) {
  return authority.grants.some(
    grant => hostGrantMatchesBasis(grant, command, action, basisRef),
  );
}

export function requireActionGrant(tx, command, authority, action) {
  const allowed = hasHostActionGrant(command, authority, action)
    || (command.leaseToken !== null
      && tx.list('grant', {kind: 'item', id: command.recordId})
      .some(record => persistedGrantMatches(record, command, action)));
  if (!allowed) {
    fail('AUTHORITY_REQUIRED',
      `${command.actor.role} lacks explicit ${action} authority for ${command.recordKind}/${command.recordId}`);
  }
}

export function requireHostActionGrant(command, authority, action) {
  if (!hasHostActionGrant(command, authority, action)) {
    fail('AUTHORITY_REQUIRED',
      `${command.actor.role} lacks trusted host ${action} authority for ${command.recordKind}/${command.recordId}`);
  }
}

export function requireNamedAuthority(tx, command, authority, action, role) {
  if (command.actor.role !== role) {
    fail('AUTHORITY_REQUIRED',
      `${action} requires declared authority "${role}", not "${command.actor.role}"`);
  }
  requireHostActionGrant(command, authority, action);
}

export function requireAnyNamedAuthority(tx, command, authority, action, roles) {
  const allowed = [...new Set(roles)];
  if (!allowed.includes(command.actor.role)) {
    fail('AUTHORITY_REQUIRED',
      `${action} requires one of the declared authorities ${allowed.map(role => `"${role}"`).join(', ')}, not "${command.actor.role}"`);
  }
  requireHostActionGrant(command, authority, action);
}

export function leaseIsLive(lease) {
  return lease !== null && Date.parse(lease.expires_at) > Date.now();
}

export function requireLease(task, command) {
  if (task.body.lease !== null && !leaseIsLive(task.body.lease)) {
    fail('RECOVERY_REQUIRED', `task/${task.id} lease expired and must be reconciled`);
  }
  if (task.body.lease === null
    || !sameActor(task.body.lease.holder, command.actor)
    || task.body.lease.token !== command.leaseToken) {
    fail('LEASE_CONFLICT', `command does not hold the current lease for task/${task.id}`);
  }
}

export function requireActingAuthority(tx, task, command, authority, action) {
  if (task.body.lease === null) {
    requireHostActionGrant(command, authority, action);
    return;
  }
  requireLease(task, command);
  requireActionGrant(tx, command, authority, action);
}

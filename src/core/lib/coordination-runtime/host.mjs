import {isAbsolute, join} from 'node:path';
import {
  assertExactKeys, canonicalJson, commandDigest, validateAuthority, validateCommand,
} from './contract.mjs';
import {requireActorAvailable, requireHostActionGrant, requireLease, sameActor} from './authority.mjs';
import {applyOperation} from './store.mjs';
import {GRANTABLE_STATES, SHIP_STATES} from './engine.mjs';
import {normalized} from '../workspace-path-safety.mjs';
import {assertWorkspacePath, workspaceManifest} from './evidence-content.mjs';
import {planDispatch, validateRoster} from './host-plan.mjs';
import {
  MAX_OBSERVATIONS, attemptSummary, clone, effectSummary, fail, latestTerminalObservations, sanitizeFacts,
  validateCapabilities, validateHostObservation,
} from './host-schema.mjs';

export {planDispatch} from './host-plan.mjs';
const bindings = new WeakMap();
const equal = (left, right) => canonicalJson(left) === canonicalJson(right);
// Declared risk flags cannot prove an unresolved effect is safe to repeat.
const uncertainEffect = body => ['unknown', 'conflicting'].includes(body.outcome);

/**
 * Trusted in-process composition, never a JSON/CLI authority endpoint.
 * Discovery, grants, profiles and verifyObservation come from the real host.
 * profiles maps role IDs to their source-declared primary profile. capabilities
 * is {peerDispatch, resume, modelOverride, usage, models: [], efforts: []}.
 * maxAttempts is a required trusted item-wide bound (1..10).
 * The synchronous verifier checks its own opaque capture/receipt registry and
 * returns {commandDigest, actor, observationId, attemptId, effectId, capturedAt,
 * source: 'host'|'local', facts}, or null. It must NOT attest caller self-reports.
 * capturedAt is the original capture time, never delivery/recording time. The
 * verifier must preserve it when rebinding the same capture to a new command or
 * observationId; a new recorder ID is not fresh evidence of stopped liveness.
 * This is not authentication against the OS user or arbitrary in-process code.
 * Evidence runtime binding remains separate; host facts confer no acceptance.
 */
export function bindHostRuntime(store, options) {
  assertExactKeys(options, new Set([
    'root', 'authority', 'roster', 'profiles', 'capabilities', 'maxAttempts', 'verifyObservation',
  ]), 'host runtime', new Set(['root', 'authority', 'roster', 'profiles', 'capabilities', 'maxAttempts']));
  workspaceManifest(options.root);
  if (!store || store.closed || !isAbsolute(store.path)
    || normalized(store.path) !== normalized(join(options.root, '.kai', 'state', 'coordination.sqlite'))) {
    fail('INVALID_INPUT', 'host workspace must be explicitly bound to this store');
  }
  assertWorkspacePath(options.root, '.kai/state/coordination.sqlite');
  validateAuthority(options.authority);
  validateRoster(options.roster, options.profiles);
  validateCapabilities(options.capabilities);
  if (!Number.isSafeInteger(options.maxAttempts) || options.maxAttempts < 1 || options.maxAttempts > 10) {
    fail('INVALID_INPUT', 'trusted maximum attempts must be from 1 through 10');
  }
  if (options.verifyObservation !== undefined && typeof options.verifyObservation !== 'function') {
    fail('INVALID_INPUT', 'verifyObservation must be a trusted host function');
  }
  const {verifyObservation, ...data} = options;
  bindings.set(store, {...clone(data), verifyObservation});
}

function contextFor(store, command, kinds) {
  const cmd = clone(command);
  validateCommand(cmd);
  if (!kinds.includes(cmd.kind)) fail('INVALID_INPUT', 'incorrect host recording API for command kind');
  const context = bindings.get(store);
  if (!context || store.closed) fail('AUTHORITY_REQUIRED', 'bind the trusted host runtime before recording');
  workspaceManifest(context.root);
  requireActorAvailable(cmd, context.authority);
  requireHostActionGrant(cmd, context.authority, cmd.kind);
  return {context, cmd};
}

function actingItem(tx, command, context, target) {
  const p = command.payload;
  const item = tx.get('item', p.itemId);
  if (!item) fail('EVIDENCE_GAP', 'host intent requires an existing work item');
  if (item.version !== p.itemVersion) fail('VERSION_CONFLICT', 'host intent item version is stale');
  if (!GRANTABLE_STATES.has(item.body.state)
    || item.body.recovery_hold !== null || item.body.waiting_on_questions.length > 0) {
    fail('RECOVERY_REQUIRED', 'work item is not available for host execution');
  }
  if (target.role === 'operator' || (SHIP_STATES.has(item.body.state) && target.role !== 'workflow-ship')) {
    fail('AUTHORITY_REQUIRED', 'host execution cannot replace the shipping role or the operator');
  }
  requireHostActionGrant({
    ...command, recordKind: 'item', recordId: item.id, expectedVersion: item.version,
  }, context.authority, command.kind);
  if (item.body.lease !== null) requireLease(item, {...command, actor: target});
  else if (command.leaseToken !== null) fail('LEASE_CONFLICT', 'host intent supplied a lease that no longer exists');
  return item;
}

function noUnresolvedEffects(tx, itemId) {
  if (tx.list('effect', itemId).some(record => uncertainEffect(record.body))) {
    fail('RECOVERY_REQUIRED', 'effect outcome is unresolved; never automatically replay');
  }
}

function resumeContext(tx, context, command, item, planned, previous) {
  const p = command.payload;
  const sameRun = tx.list('host-attempt').filter(record => record.body.target.runId === p.target.runId);
  if (p.resumeFrom === null) {
    if (sameRun.length) fail('RECOVERY_REQUIRED', 'fresh single-shot work requires a fresh host run');
    return {context: 'fresh-single-shot', resume_from: null, resume_session_id: null};
  }
  if (!context.capabilities.resume) fail('UNSUPPORTED_HOST', 'host resume is unsupported');
  const prior = previous.find(record => record.id === p.resumeFrom)?.body;
  if (!prior || prior.status !== 'failed' || prior.item_version !== item.version
    || prior.profile !== p.profile || prior.agent_id !== planned.agentId
    || prior.requested_model !== p.requestedModel || prior.requested_effort !== p.effort
    || prior.independence_key !== p.independenceKey || !sameActor(prior.target, p.target)
    || sameRun.some(record => record.itemId !== item.id || record.body.profile !== p.profile
      || record.body.target.role !== p.target.role || record.body.independence_key !== p.independenceKey)) {
    fail('RECOVERY_REQUIRED', 'resume cannot cross item, role, profile, run or independence boundaries');
  }
  const latest = latestTerminalObservations(prior);
  if (!latest.length || latest.some(({facts}) => facts.status !== 'failed'
    || !facts.sessionId || facts.actualModel !== p.requestedModel
    || (p.effort !== null && facts.actualEffort !== p.effort))) {
    fail('RECOVERY_REQUIRED', 'resume requires verified stopped liveness, session and matching model/effort');
  }
  return {context: 'resume', resume_from: p.resumeFrom, resume_session_id: latest[0].facts.sessionId};
}

/**
 * attempt.start targets a NEW host-attempt UUID at version 0. payload carries
 * itemId/itemVersion, target Actor, profile/requestedModel/effort,
 * independenceKey, resumeFrom (null by default), createdAt. Authority requires
 * BOTH exact host-attempt/UUID@0 and item/ID@itemVersion host action grants.
 * A live acting lease must belong to target; no item/grant/lifecycle is written.
 * A committed receipt records intent only, never acknowledgement or execution.
 */
export function recordAttempt(store, command) {
  const {context, cmd} = contextFor(store, command, ['attempt.start']);
  return applyOperation(store, cmd, (_current, tx) => {
    const p = cmd.payload;
    const item = actingItem(tx, cmd, context, p.target);
    if (p.target.role !== item.body.next_role) fail('INVALID_INPUT', 'target must be the item next role');
    const planned = planDispatch({
      item: item.body, roster: context.roster, profiles: context.profiles, capabilities: context.capabilities,
      request: {role: p.target.role, profile: p.profile, model: p.requestedModel, effort: p.effort},
    }).queue[0];
    if (['review', 'technical-review'].includes(p.profile)
      && item.body.producing_actors.some(producer => producer.runId === p.target.runId)) {
      fail('RECOVERY_REQUIRED', 'independent review cannot reuse a producing run');
    }
    if (p.resumeFrom !== null && !context.capabilities.resume) fail('UNSUPPORTED_HOST', 'host resume is unsupported');
    noUnresolvedEffects(tx, item.id);
    const previous = tx.list('host-attempt', item.id);
    if (previous.length >= context.maxAttempts
      || previous.some(record => ['intent', 'uncertain', 'conflicting', 'mismatched'].includes(record.body.status)
        || (record.body.status === 'completed' && record.body.item_version === item.version))) {
      fail('RECOVERY_REQUIRED', 'attempt is unresolved, already completed or bounded attempts exhausted; no automatic redispatch');
    }
    const resume = resumeContext(tx, context, cmd, item, planned, previous);
    return {
      schema_version: 1, attempt_id: cmd.recordId, item_id: item.id, item_version: item.version,
      actor: cmd.actor, target: p.target, agent_id: planned.agentId, profile: p.profile,
      requested_model: p.requestedModel, requested_effort: p.effort, independence_key: p.independenceKey,
      ...resume, capabilities: clone(context.capabilities), settings: planned.settings,
      created_at: p.createdAt, status: 'intent', observations: [], gaps: [],
    };
  });
}

function verifiedObservation(context, cmd, handle) {
  const proof = context.verifyObservation?.(clone(cmd), handle);
  if (!proof || typeof proof.then === 'function') fail('EVIDENCE_GAP', 'verified host capture is required; caller JSON is not observation');
  assertExactKeys(proof, new Set([
    'commandDigest', 'actor', 'observationId', 'attemptId', 'effectId', 'capturedAt', 'source', 'facts',
  ]), 'host attestation');
  const effect = cmd.recordKind === 'effect';
  if (proof.commandDigest !== commandDigest(cmd) || !sameActor(proof.actor, cmd.actor)
    || proof.observationId !== cmd.payload.observationId
    || proof.attemptId !== (effect ? cmd.payload.attemptId : cmd.recordId)
    || proof.effectId !== (effect ? cmd.recordId : null)) {
    fail('EVIDENCE_GAP', 'host capture does not cover this exact command, actor, attempt and effect');
  }
  const observation = {
    observationId: proof.observationId, source: proof.source, capturedAt: proof.capturedAt,
    facts: sanitizeFacts(proof.facts, effect), sessionConflicts: [],
  };
  validateHostObservation(observation, effect);
  if (Date.parse(observation.capturedAt) > Date.now()) fail('EVIDENCE_GAP', 'host capture cannot be in the future');
  return observation;
}

function appendObservation(body, observation, effect) {
  if (Date.parse(observation.capturedAt) < Date.parse(body.created_at)) fail('EVIDENCE_GAP', 'capture predates intent');
  const existing = body.observations.find(entry => entry.observationId === observation.observationId);
  if (existing && !equal(existing, observation)) fail('OPERATION_CONFLICT', 'observation ID already has different facts');
  if (!existing) {
    if (body.observations.length >= MAX_OBSERVATIONS) fail('RECOVERY_REQUIRED', 'observation limit reached; reconcile without replay');
    body.observations.push(observation);
  }
  return {...body, ...(effect ? effectSummary(body) : attemptSummary(body))};
}

function recordObservation(store, command, handle, effect) {
  const {context, cmd} = contextFor(store, command, [effect ? 'effect.result' : 'attempt.result']);
  const observation = verifiedObservation(context, cmd, handle);
  const receipt = applyOperation(store, cmd, (current, tx) => {
    if (!current) fail('EVIDENCE_GAP', 'observation requires a persisted intent');
    if (effect && (current.body.attempt_id !== cmd.payload.attemptId
      || tx.get('host-attempt', current.body.attempt_id)?.itemId !== current.itemId)) {
      fail('EVIDENCE_GAP', 'effect result must bind its exact persisted attempt');
    }
    const retained = current.body.observations.find(o => o.observationId === observation.observationId);
    const sessionConflicts = retained?.sessionConflicts ?? (effect ? [] : conflictingSessions(tx, current, observation));
    return appendObservation(current.body, {...observation, sessionConflicts}, effect);
  });
  // applyOperation replays receipts before mutate. A changed opaque capture
  // must not be hidden behind an otherwise identical JSON command/operation ID.
  const retained = receipt.data.record.body.observations.find(o => o.observationId === observation.observationId);
  if (!retained || !equal({...retained, sessionConflicts: []}, observation)) {
    fail('OPERATION_CONFLICT', 'replayed operation has a different verified observation');
  }
  return receipt;
}

function conflictingSessions(tx, current, observation) {
  if (observation.source !== 'host' || observation.facts.sessionId === null) return [];
  return tx.list('host-attempt').filter(record => record.id !== current.id
    && record.body.observations.some(o => o.source === 'host' && o.facts.sessionId === observation.facts.sessionId)
    && (current.body.context === 'fresh-single-shot' || record.itemId !== current.itemId
      || !sameActor(record.body.target, current.body.target)
      || record.body.profile !== current.body.profile
      || record.body.independence_key !== current.body.independence_key))
    .map(record => record.id).sort();
}

/** attempt.result: existing host-attempt, payload {observationId}; no lease. */
export function recordHostResult(store, command, observation) {
  return recordObservation(store, command, observation, false);
}

/**
 * effect.intent creates effect/UUID@0 with itemId/itemVersion, attemptId,
 * intendedAction, idempotencyKey (nullable), external, paid, createdAt.
 * effect.result targets that effect and carries {attemptId, observationId}.
 * Like attempts, intents need BOTH primary and item-scoped host grants.
 * These records plan/observe effects; they never execute or replay the action.
 */
export function recordEffect(store, command, observation) {
  if (command?.kind === 'effect.result') return recordObservation(store, command, observation, true);
  const {context, cmd} = contextFor(store, command, ['effect.intent']);
  return applyOperation(store, cmd, (_current, tx) => {
    const p = cmd.payload;
    const attempt = tx.get('host-attempt', p.attemptId);
    if (!attempt || attempt.itemId !== p.itemId) fail('EVIDENCE_GAP', 'effect intent requires the exact persisted host attempt');
    const item = actingItem(tx, cmd, context, attempt.body.target);
    if (attempt.body.item_version !== item.version || attempt.body.status !== 'intent') {
      fail('RECOVERY_REQUIRED', 'effect intent requires a current, unresolved execution intent');
    }
    noUnresolvedEffects(tx, item.id);
    if (tx.list('effect', item.id).some(record => p.idempotencyKey !== null
      && record.body.idempotency_key === p.idempotencyKey)) {
      fail('OPERATION_CONFLICT', 'effect idempotency key is already retained; reconcile its result');
    }
    const body = {
      schema_version: 1, effect_id: cmd.recordId, attempt_id: p.attemptId, item_id: item.id,
      item_version: item.version, actor: cmd.actor, intended_action: p.intendedAction,
      idempotency_key: p.idempotencyKey, external: p.external, paid: p.paid,
      created_at: p.createdAt, observations: [],
    };
    return {...body, ...effectSummary(body)};
  });
}

import {
  RuntimeError, assertExactKeys, assertNonEmptyString, assertTimestamp,
  canonicalJson, validateActor,
} from './contract.mjs';
import {ROLE_PROFILE_MODELS, agentProfileModelErrors} from '../pack-plan.mjs';

export const MAX_OBSERVATIONS = 32;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const fail = (code, message) => { throw new RuntimeError(code, message); };
const invalid = message => fail('INVALID_INPUT', message);
export const clone = value => JSON.parse(canonicalJson(value));
const exact = (value, keys, label) => assertExactKeys(value, new Set(keys), label);
export function text(value, label, max = 512) {
  assertNonEmptyString(value, label);
  if (Buffer.byteLength(value, 'utf8') > max) invalid(`${label} exceeds ${max} bytes`);
}
const nullableText = (value, label) => { if (value !== null) text(value, label); };
const uuid = (value, label) => { if (!UUID.test(value ?? '')) invalid(`${label} must be a UUID`); };
const boolean = (value, label) => { if (typeof value !== 'boolean') invalid(`${label} must be boolean`); };
const member = (value, choices, label) => { if (!choices.includes(value)) invalid(`${label} is unsupported`); };
const positive = (value, label) => {
  if (!Number.isSafeInteger(value) || value < 1) invalid(`${label} must be a positive safe integer`);
};
const measurement = (value, label, integer = false) => {
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value)
    || value < 0 || (integer && !Number.isSafeInteger(value)))) invalid(`${label} is not a valid measurement`);
};

export function validateCapabilities(value) {
  exact(value, ['peerDispatch', 'resume', 'modelOverride', 'usage', 'models', 'efforts'], 'capabilities');
  for (const key of ['peerDispatch', 'resume', 'modelOverride', 'usage']) boolean(value[key], key);
  for (const key of ['models', 'efforts']) {
    if (!Array.isArray(value[key]) || new Set(value[key]).size !== value[key].length) invalid(`${key} must be unique`);
    value[key].forEach(entry => text(entry, key));
  }
}

export function approvedProfileModel(role, profile) {
  const model = Object.hasOwn(ROLE_PROFILE_MODELS, profile ?? '') ? ROLE_PROFILE_MODELS[profile] : null;
  if (!model) invalid('role has no approved primary profile');
  const errors = agentProfileModelErrors({id: role, body: `**Primary profile:** ${profile}`, fm: {model}});
  if (errors.length) invalid(errors.join('; '));
  return model;
}

export function validateHostCommand(command) {
  const p = command.payload;
  const attempt = command.kind.startsWith('attempt.');
  if (command.recordKind !== (attempt ? 'host-attempt' : 'effect')) invalid('host command recordKind mismatch');
  uuid(command.recordId, 'host recordId');
  if (command.kind.endsWith('.result')) {
    exact(p, attempt ? ['observationId'] : ['attemptId', 'observationId'], 'result payload');
    uuid(p.observationId, 'observationId');
    if (!attempt) uuid(p.attemptId, 'attemptId');
    positive(command.expectedVersion, 'result expectedVersion');
    if (command.leaseToken !== null) invalid('host observations do not use acting leases');
    return;
  }
  if (command.expectedVersion !== 0) invalid('host intent creation expects version 0');
  const common = ['itemId', 'itemVersion', 'createdAt'];
  exact(p, [...common, ...(attempt
    ? ['target', 'profile', 'requestedModel', 'effort', 'independenceKey', 'resumeFrom']
    : ['attemptId', 'intendedAction', 'idempotencyKey', 'external', 'paid'])], 'intent payload');
  text(p.itemId, 'itemId');
  positive(p.itemVersion, 'itemVersion');
  assertTimestamp(p.createdAt, 'createdAt');
  if (attempt) {
    validateActor(p.target);
    for (const key of ['profile', 'requestedModel', 'independenceKey']) text(p[key], key);
    nullableText(p.effort, 'effort');
    if (p.resumeFrom !== null) uuid(p.resumeFrom, 'resumeFrom');
  } else {
    uuid(p.attemptId, 'attemptId');
    text(p.intendedAction, 'intendedAction', 2048);
    nullableText(p.idempotencyKey, 'idempotencyKey');
    boolean(p.external, 'external');
    boolean(p.paid, 'paid');
  }
}

const attemptFactKeys = [
  'status', 'liveness', 'sessionId', 'actualRole', 'actualProfile', 'actualModel', 'actualEffort',
  'inputTokens', 'outputTokens', 'cost', 'usage', 'durationMs', 'response', 'exitCode',
];
const effectFactKeys = ['outcome', 'response'];
const pick = (value, keys) => Object.fromEntries(keys.map(key => [key, value[key] ?? null]));

// The verifier may receive native events; only these fields may reach SQLite.
// Field names cannot establish provenance: the verifier itself is a host capability.
export function sanitizeFacts(raw, effect = false) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) invalid('host facts must be an object');
  const facts = pick(raw, effect ? effectFactKeys : attemptFactKeys);
  if (!effect && facts.usage !== null) {
    const value = facts.usage;
    if (typeof value !== 'object' || Array.isArray(value)) invalid('usage must be an object');
    facts.usage = pick(value, ['scope', 'sessionId', 'totalNanoAiu', 'totalPremiumRequests']);
  }
  if (!effect && facts.cost !== null) {
    const value = facts.cost;
    if (typeof value !== 'object' || Array.isArray(value)) invalid('cost requires an explicit unit and scope');
    facts.cost = pick(value, ['amount', 'currency', 'scope', 'sessionId']);
  }
  return clone(facts);
}

function validateFacts(facts, source, effect) {
  exact(facts, effect ? effectFactKeys : attemptFactKeys, 'observation facts');
  if (facts.response !== null) {
    if (typeof facts.response !== 'string' || Buffer.byteLength(facts.response, 'utf8') > 8192) {
      invalid('user-facing response must be at most 8192 bytes');
    }
  }
  if (effect) {
    member(facts.outcome, ['unknown', 'succeeded', 'not-applied'], 'effect outcome');
    if (source !== 'host' && facts.outcome !== 'unknown') invalid('local timing cannot establish an external effect outcome');
    return;
  }
  member(facts.status, ['completed', 'failed', 'timeout', 'acknowledgement-lost'], 'host status');
  member(facts.liveness, ['stopped', 'running', 'unknown'], 'host liveness');
  for (const key of ['sessionId', 'actualRole', 'actualProfile', 'actualModel', 'actualEffort']) nullableText(facts[key], key);
  for (const key of ['inputTokens', 'outputTokens']) measurement(facts[key], key, true);
  measurement(facts.durationMs, 'durationMs');
  if (facts.exitCode !== null && !Number.isSafeInteger(facts.exitCode)) invalid('exitCode must be an integer or null');
  if (facts.usage !== null) {
    const u = facts.usage;
    exact(u, ['scope', 'sessionId', 'totalNanoAiu', 'totalPremiumRequests'], 'usage');
    if (u.scope !== 'session-cumulative' || u.sessionId === null || u.sessionId !== facts.sessionId) {
      invalid('usage checkpoints require the exact cumulative session identity');
    }
    measurement(u.totalNanoAiu, 'totalNanoAiu', true);
    measurement(u.totalPremiumRequests, 'totalPremiumRequests');
  }
  if (facts.cost !== null) {
    const c = facts.cost;
    exact(c, ['amount', 'currency', 'scope', 'sessionId'], 'cost');
    measurement(c.amount, 'cost.amount');
    if (c.amount === null || !/^[A-Z]{3}$/.test(c.currency ?? '')) invalid('cost requires an observed currency amount');
    member(c.scope, ['attempt', 'session-cumulative'], 'cost.scope');
    if (c.scope === 'attempt' ? c.sessionId !== null : c.sessionId === null || c.sessionId !== facts.sessionId) {
      invalid('cost session identity does not match its scope');
    }
  }
  if (source === 'local') {
    if (!['timeout', 'acknowledgement-lost'].includes(facts.status) || facts.liveness !== 'unknown'
      || attemptFactKeys.filter(key => !['status', 'liveness', 'durationMs'].includes(key)).some(key => facts[key] !== null)) {
      invalid('local observations may only establish elapsed timing and uncertain acknowledgement/liveness');
    }
  }
}

export function validateHostObservation(value, effect = false) {
  exact(value, ['observationId', 'source', 'capturedAt', 'facts', 'sessionConflicts'], 'host observation');
  uuid(value.observationId, 'observationId');
  member(value.source, ['host', 'local'], 'observation source');
  assertTimestamp(value.capturedAt, 'capturedAt');
  if (!Array.isArray(value.sessionConflicts)
    || new Set(value.sessionConflicts).size !== value.sessionConflicts.length
    || (effect && value.sessionConflicts.length !== 0)) invalid('invalid observed session conflicts');
  value.sessionConflicts.forEach(id => uuid(id, 'session conflict attempt'));
  validateFacts(value.facts, value.source, effect);
}

const isTerminalObservation = o => o.source === 'host' && o.facts.liveness === 'stopped'
  && ['completed', 'failed'].includes(o.facts.status);

export function latestTerminalObservations(body) {
  const terminal = body.observations.filter(isTerminalObservation);
  const latest = Math.max(...terminal.map(o => Date.parse(o.capturedAt)));
  return terminal.filter(o => Date.parse(o.capturedAt) === latest);
}

export function attemptSummary(body) {
  const gaps = new Set();
  const terminal = [];
  for (const observation of body.observations) {
    const f = observation.facts;
    if (observation.sessionConflicts.length) gaps.add('SESSION_BOUNDARY_MISMATCH');
    if (f.actualModel === null) gaps.add('MODEL_UNKNOWN');
    else if (f.actualModel !== body.requested_model) gaps.add('MODEL_MISMATCH');
    for (const [actual, requested, label] of [
      ['actualEffort', 'requested_effort', 'EFFORT'], ['actualProfile', 'profile', 'PROFILE'],
    ]) {
      if (body[requested] !== null && f[actual] === null) gaps.add(`${label}_UNKNOWN`);
      else if (f[actual] !== null && body[requested] !== null && f[actual] !== body[requested]) gaps.add(`${label}_MISMATCH`);
    }
    if (f.actualRole !== null && f.actualRole !== body.target.role) gaps.add('ROLE_MISMATCH');
    if (body.context === 'resume') {
      if (f.sessionId === null) gaps.add('SESSION_UNKNOWN');
      else if (f.sessionId !== body.resume_session_id) gaps.add('SESSION_MISMATCH');
    }
    if (f.exitCode !== null && f.exitCode !== 0) gaps.add('EXIT_FAILURE');
    if (f.status === 'failed') gaps.add('HOST_FAILURE');
    if (f.liveness === 'unknown') gaps.add('LIVENESS_UNKNOWN');
    if (f.status === 'acknowledgement-lost') gaps.add('ACKNOWLEDGEMENT_LOST');
    if (f.status === 'timeout') gaps.add('TIMEOUT');
    if (isTerminalObservation(observation)) terminal.push(f);
  }
  let status = body.observations.length === 0 ? 'intent' : 'uncertain';
  if (terminal.length) {
    const latest = latestTerminalObservations(body);
    status = latest[0].facts.status;
    if (gaps.has('EXIT_FAILURE')) status = 'failed';
    if ([...gaps].some(gap => gap.endsWith('_MISMATCH'))) status = 'mismatched';
    const disagreement = terminal.some(f => f.status !== terminal[0].status);
    const identities = ['sessionId', 'actualModel', 'actualRole', 'actualProfile'];
    if (disagreement || identities.some(key => new Set(terminal.map(f => f[key]).filter(v => v !== null)).size > 1)) {
      gaps.add('CONFLICTING_RESULTS');
      status = 'conflicting';
    }
    // Capture chronology, not arrival order or recorder IDs, establishes current
    // liveness. Equal timestamps cannot prove the process stopped after running.
    const current = body.observations.filter(o => o.source === 'host'
      && Date.parse(o.capturedAt) >= Date.parse(latest[0].capturedAt));
    if (current.some(o => o.facts.liveness === 'running')) {
      gaps.add('CONFLICTING_RESULTS');
      status = 'conflicting';
    } else if (['completed', 'failed'].includes(status)
      && current.some(o => o.facts.liveness === 'unknown')) {
      status = 'uncertain';
    }
  }
  return {status, gaps: [...gaps].sort()};
}

export function effectSummary(body) {
  const outcomes = new Set(body.observations.map(o => o.facts.outcome).filter(o => o !== 'unknown'));
  const outcome = outcomes.size > 1 ? 'conflicting' : [...outcomes][0] ?? 'unknown';
  return {outcome, gaps: outcome === 'conflicting' ? ['CONFLICTING_RESULTS']
    : outcome === 'unknown' ? ['EFFECT_OUTCOME_UNKNOWN'] : []};
}

export function validateHostRecord(body, label, effect = false) {
  const common = ['schema_version', 'item_id', 'item_version', 'actor', 'created_at', 'observations', 'gaps'];
  exact(body, [...common, ...(effect
    ? ['effect_id', 'attempt_id', 'intended_action', 'idempotency_key', 'external', 'paid', 'outcome']
    : ['attempt_id', 'target', 'agent_id', 'profile', 'requested_model', 'requested_effort',
      'independence_key', 'context', 'resume_from', 'resume_session_id', 'capabilities', 'settings', 'status'])], label);
  if (body.schema_version !== 1) invalid('host record schema_version must be 1');
  text(body.item_id, 'item_id');
  positive(body.item_version, 'item_version');
  validateActor(body.actor);
  assertTimestamp(body.created_at, 'created_at');
  uuid(body.attempt_id, 'attempt_id');
  if (!Array.isArray(body.observations) || body.observations.length > MAX_OBSERVATIONS) invalid('observation bound exceeded');
  body.observations.forEach(o => validateHostObservation(o, effect));
  if (new Set(body.observations.map(o => o.observationId)).size !== body.observations.length) invalid('duplicate observation IDs');
  if (effect) {
    uuid(body.effect_id, 'effect_id');
    text(body.intended_action, 'intended_action', 2048);
    nullableText(body.idempotency_key, 'idempotency_key');
    boolean(body.external, 'external');
    boolean(body.paid, 'paid');
  } else {
    validateActor(body.target);
    for (const key of ['agent_id', 'profile', 'requested_model', 'independence_key']) text(body[key], key);
    if (body.requested_model !== approvedProfileModel(body.target.role, body.profile)) {
      invalid('host record requested model must match its approved primary profile');
    }
    nullableText(body.requested_effort, 'requested_effort');
    member(body.context, ['fresh-single-shot', 'resume'], 'context');
    nullableText(body.resume_session_id, 'resume_session_id');
    if (body.resume_from !== null) uuid(body.resume_from, 'resume_from');
    if (body.context === 'resume' ? body.resume_from === null || body.resume_session_id === null
      : body.resume_from !== null || body.resume_session_id !== null) invalid('resume context identity mismatch');
    validateCapabilities(body.capabilities);
    assertExactKeys(body.settings, new Set(['model', 'effort']), 'settings', new Set());
    if (Object.hasOwn(body.settings, 'model') && (!body.capabilities.modelOverride
      || body.settings.model !== body.requested_model)) invalid('unsupported model override');
    if (Object.hasOwn(body.settings, 'effort') && (body.settings.effort !== body.requested_effort
      || !body.capabilities.efforts.includes(body.settings.effort))) invalid('unsupported effort override');
    if (body.requested_effort !== null && body.settings.effort !== body.requested_effort) {
      invalid('host record must carry the supported requested effort');
    }
    if (!body.capabilities.models.includes(body.requested_model)
      || (body.capabilities.modelOverride && body.settings.model !== body.requested_model)) {
      invalid('host record must retain the available model and supported override');
    }
  }
  const summary = effect ? effectSummary(body) : attemptSummary(body);
  for (const [key, value] of Object.entries(summary)) {
    if (canonicalJson(body[key]) !== canonicalJson(value)) invalid(`host ${key} does not match retained observations`);
  }
}

export function validateHostMutation(command, current, nextBody) {
  if (!Array.isArray(nextBody.observations)) invalid('host mutation requires an observations array');
  const result = command.kind.endsWith('.result');
  if (!result) {
    if (current) invalid('host intent requires a missing record');
    if (nextBody.item_id !== command.payload.itemId || nextBody.item_version !== command.payload.itemVersion
      || canonicalJson(nextBody.actor) !== canonicalJson(command.actor)
      || nextBody.created_at !== command.payload.createdAt || nextBody.observations.length !== 0) {
      invalid('host intent must preserve the command identity');
    }
    const fields = command.kind === 'attempt.start'
      ? {target: 'target', profile: 'profile', requestedModel: 'requested_model', effort: 'requested_effort',
        independenceKey: 'independence_key', resumeFrom: 'resume_from'}
      : {attemptId: 'attempt_id', intendedAction: 'intended_action', idempotencyKey: 'idempotency_key',
        external: 'external', paid: 'paid'};
    for (const [payloadKey, bodyKey] of Object.entries(fields)) {
      if (canonicalJson(command.payload[payloadKey]) !== canonicalJson(nextBody[bodyKey])) {
        invalid(`host intent must preserve payload.${payloadKey}`);
      }
    }
    return;
  }
  if (!current) invalid('host result requires an existing intent');
  const allowed = new Set(['observations', 'gaps', command.recordKind === 'effect' ? 'outcome' : 'status']);
  for (const key of new Set([...Object.keys(current.body), ...Object.keys(nextBody)])) {
    if (!allowed.has(key) && canonicalJson(current.body[key]) !== canonicalJson(nextBody[key])) {
      invalid(`host result cannot change ${key}`);
    }
  }
  if (nextBody.observations.length < current.body.observations.length
    || nextBody.observations.length > current.body.observations.length + 1
    || canonicalJson(nextBody.observations.slice(0, current.body.observations.length)) !== canonicalJson(current.body.observations)
    || !nextBody.observations.some(o => o.observationId === command.payload.observationId)) {
    invalid('host observations are append-only and bound to the command');
  }
}

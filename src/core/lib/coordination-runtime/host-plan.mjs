import {assertExactKeys, isPlainObject} from './contract.mjs';
import {approvedProfileModel, clone, fail, text, validateCapabilities} from './host-schema.mjs';

export function validateRoster(roster, profiles) {
  if (!Array.isArray(roster) || !isPlainObject(profiles)) fail('INVALID_INPUT', 'host roster/profiles are required');
  const ids = new Set();
  for (const entry of roster) {
    assertExactKeys(entry, new Set(['id', 'role', 'model']), 'roster entry');
    text(entry.id, 'qualified host id');
    text(entry.role, 'roster role');
    if (entry.model !== null) text(entry.model, 'roster model');
    if (ids.has(entry.id)) fail('INVALID_INPUT', 'duplicate host agent id');
    ids.add(entry.id);
  }
}

/**
 * Pure planning, not authorization or a launcher. Roster IDs and primary
 * profiles must be supplied by trusted host discovery/source loading.
 */
export function planDispatch({item, roster, profiles, capabilities, request = {}}) {
  if (!item || typeof item.next_role !== 'string') fail('ROLE_UNAVAILABLE', 'item has no next role');
  if (!Array.isArray(roster) || roster.some(entry => !isPlainObject(entry))) {
    fail('INVALID_INPUT', 'roster must be an array of entries');
  }
  const entries = roster.filter(entry => entry.role === item.next_role);
  if (entries.length !== 1) fail('ROLE_UNAVAILABLE', 'exact next role must resolve to one qualified host ID');
  validateRoster(roster, profiles);
  validateCapabilities(capabilities);
  assertExactKeys(request, new Set(['role', 'profile', 'model', 'fallbackModel', 'effort']), 'dispatch request', new Set());
  const profile = profiles[item.next_role];
  const requiredModel = approvedProfileModel(item.next_role, profile);
  if ((request.role !== undefined && request.role !== item.next_role)
    || (request.profile !== undefined && request.profile !== profile)) {
    fail('INVALID_INPUT', 'requested role/profile is inconsistent with the installed role');
  }
  // There is one approved model per profile today, not a fallback policy.
  if ((request.model !== undefined && request.model !== requiredModel)
    || (request.fallbackModel !== undefined && request.fallbackModel !== requiredModel)
    || !capabilities.models.includes(requiredModel)) {
    fail('MODEL_UNAVAILABLE', 'required model is unavailable or requested fallback is outside approved policy');
  }
  const [entry] = entries;
  if (!capabilities.modelOverride && entry.model !== requiredModel) {
    fail('MODEL_UNAVAILABLE', 'host cannot guarantee the pinned model without a supported override');
  }
  const settings = {};
  if (capabilities.modelOverride) settings.model = requiredModel;
  if (request.effort !== undefined && request.effort !== null) {
    if (!capabilities.efforts.includes(request.effort)) fail('UNSUPPORTED_HOST', 'requested effort override is unsupported');
    settings.effort = request.effort;
  }
  return {
    mode: capabilities.peerDispatch ? 'peer-available' : 'ordered-queue',
    automatic: false,
    queue: [{
      agentId: entry.id, role: item.next_role, profile, requestedModel: requiredModel,
      settings: clone(settings), context: 'fresh-single-shot',
    }],
  };
}

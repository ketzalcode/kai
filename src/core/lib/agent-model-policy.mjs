// The agent model policy, in the one place both the runtime and the tooling can
// reach it.
//
// The coordination host validates an actor's declared profile at runtime
// (`approvedProfileModel` in `coordination-runtime/host-schema.mjs`), and the
// repository validators check the same thing when an agent is authored. Those
// are the same rule, so it lives once.
//
// It lives under `src/` rather than in `tools/lib/pack-plan.mjs` because shipped
// code is the consumer that cannot be broken. Importing it the other way round
// is what used to drag 93 KB of release machinery — agent rosters and
// marketplace policy — into every consumer install so
// that a host could look up a model name.

export const ROLE_FAMILY_PACK = Object.freeze({
  eng: 'engineering',
  creative: 'creative',
});

export const ROLE_POSTURES = Object.freeze([
  'lead', 'builder', 'reviewer', 'operator', 'coordinator', 'advisor',
]);

export const MODEL_POLICY_VERSION = 'kai-agent-models-v4';
export const AGENT_PROMPT_HARD_LIMIT = 30_000;

export const ROLE_POSTURE_PROFILES = Object.freeze({
  lead: Object.freeze(['judgment', 'technical-judgment']),
  builder: Object.freeze(['execution']),
  reviewer: Object.freeze(['review', 'technical-review']),
  operator: Object.freeze(['operations']),
  coordinator: Object.freeze(['coordination']),
  advisor: Object.freeze(['judgment', 'technical-judgment', 'advisory']),
});

export const NAMED_CAPABILITY_AGENTS = Object.freeze({
  'eng-nightshift': Object.freeze({
    pack: 'engineering',
    profiles: Object.freeze(['technical-judgment']),
  }),
});

export const KIND_AGENT_PROFILES = Object.freeze({
  persona: Object.freeze(['simulation']),
  instructor: Object.freeze(['teaching']),
});

export const ROLE_PROFILE_MODELS = Object.freeze({
  judgment: 'claude-opus-5',
  'technical-judgment': 'gpt-5.6-sol',
  review: 'claude-opus-5',
  'technical-review': 'gpt-5.6-terra',
  execution: 'claude-sonnet-5',
  operations: 'claude-sonnet-5',
  coordination: 'claude-sonnet-5',
  advisory: 'claude-sonnet-5',
  teaching: 'claude-sonnet-5',
  simulation: 'claude-sonnet-5',
});

export const KIND_AGENT_FAMILIES = Object.freeze([
  'persona', 'instructor',
]);

export function agentProfileModelErrors({ id, body, fm = {} }) {
  const [family, posture] = (id ?? '').split('-');
  const isDurableRole = family in ROLE_FAMILY_PACK;
  const isNewKind = KIND_AGENT_FAMILIES.includes(family);
  const namedCapability = NAMED_CAPABILITY_AGENTS[id] ?? null;
  if (!isDurableRole && !isNewKind && !namedCapability) return [];
  const errors = [];

  const profiles = [...(body ?? '').matchAll(
    /^\*\*Primary profile:\*\*\s+`?([a-z][a-z-]*)`?\s*$/gm
  )].map((match) => match[1]);
  if (profiles.length !== 1) {
    errors.push(`new agent must declare exactly one \`**Primary profile:** <profile>\` line (found ${profiles.length})`);
    return errors;
  }
  const [profile] = profiles;
  const expected = ROLE_PROFILE_MODELS[profile];
  if (!expected) {
    errors.push(`primary profile \`${profile}\` has no approved model mapping`);
    return errors;
  }
  const allowed = namedCapability?.profiles
    ?? (isDurableRole ? ROLE_POSTURE_PROFILES[posture] : KIND_AGENT_PROFILES[family]);
  if (!allowed?.includes(profile)) {
    const owner = namedCapability
      ? `named capability \`${id}\``
      : isDurableRole ? `posture \`${posture}\`` : `kind \`${family}\``;
    errors.push(`${owner} requires primary profile `
      + `${(allowed ?? []).map((value) => `\`${value}\``).join(' or ') || '(none)'}, not \`${profile}\``);
  }
  const model = (fm.model ?? '').trim().replace(/^(['"])(.*)\1$/, '$2');
  if (!model) {
    errors.push(`new agent with profile \`${profile}\` must declare frontmatter model "${expected}"`);
  } else if (model !== expected) {
    errors.push(`primary profile \`${profile}\` requires frontmatter model "${expected}", not "${model}"`);
  }
  return errors;
}

// The pack names shipped code is allowed to know.
//
// `migration-doctor.mjs` needs exactly two things — the pack order and the
// plugin name each pack publishes under — to tell a user which plugins are
// installed. It used to import them from `pack-plan.mjs`, which meant 93 KB of
// release machinery (migration baselines, retired-agent rosters, marketplace
// policy) travelled into every consumer install to satisfy a list and a
// one-line function.
//
// This module is the authority for both. `tools/pack-plan.mjs` imports from
// here rather than redefining them, and a validator gate asserts the derived
// partition still matches, so the two cannot drift apart silently.
export const PACK_ORDER = Object.freeze(['core', 'creative', 'engineering']);

// Core is the required shared plugin; departments are `kai-<department>`.
export const packPluginName = (pack) => (pack === 'core' ? 'kai-core' : `kai-${pack}`);

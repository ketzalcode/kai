---
type: work-item
id: pack-split-crosspack-validator
title: Cross-pack reference validator across all three firing paths + assets + hooks-once
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split cross-pack reference validation
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - scripts/validate-plugin.mjs
  - scripts/pack-preview.mjs
touches:
  - scripts/validate-plugin.mjs
  - .github/workflows/validate.yml
depends_on:
  - item: pack-split-generator-gates
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews: []
change_ref: null
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-24-2011
---

## Outcome

Every cross-pack reference validates across all three firing paths — inherited
(`**Inherits:**`), user-invoked (`/skills run`), and orchestrated (agent-to-agent dispatch) —
plus non-markdown asset references (e.g. `scripts/demo-*.mjs`) and the rule that `hooks.json`
is assigned to exactly one pack. Layered onto the multi-manifest validator, wired as a CI gate.

## Acceptance

- [ ] A pack agent's inherited, user-invoked, and orchestrated references all resolve to a
      real provider (core or its own pack) across the plugin boundary, or CI fails with the exact miss.
- [ ] Non-markdown assets referenced by a skill are present in that skill's owning pack; an
      asset referenced across >1 pack is flagged for core.
- [ ] `hooks.json` assigned to exactly one pack (no pack duplicates a hook).
- [ ] Passes on `node scripts/pack-preview.mjs --all`; new CI step green; `npm test` passes.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- Delivers the "wired into the multi-manifest validate/release gates" clause on top of
  `pack-split-generator-gates`. Runs in parallel with `pack-split-preflight-compat`.
- The orchestrated firing path has no static `**Inherits:**` anchor — scoping how it is checked
  may need a `principal-swe-architect` call (covered by the required architecture review).

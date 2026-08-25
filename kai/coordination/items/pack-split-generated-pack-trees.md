---
type: work-item
id: pack-split-generated-pack-trees
title: Generate committed-unpublished kai-core + first department (personal) trees from root
initiative: pack-split
milestone: first-pack-extracted
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split committed-unpublished pack trees (generate-not-move)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - scripts/pack-preview.mjs
  - hooks.json
touches:
  - packs/kai-core/
  - packs/kai-personal/
  - scripts/pack-preview.mjs
  - package.json
depends_on:
  - item: pack-split-generator-gates
    requires: shipped
  - item: pack-split-crosspack-validator
    requires: shipped
  - item: pack-split-preflight-compat
    requires: shipped
  - item: pack-split-degraded-refusal
    requires: shipped
  - item: pack-split-ci-partition-checks
    requires: shipped
  - item: pack-split-host-semantics-spike
    requires: completed
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

The generator materializes the committed-but-unpublished `kai-core` + `kai-personal` trees from
root (root stays the single source of truth — nothing moved), realizing the explicit asset-ownership
rule: a non-markdown asset travels with the sole skill that invokes it (`scripts/demo-*.mjs` →
personal), any asset invoked across >1 pack promotes to core, and `hooks.json` + `scripts/observe-*.mjs`
ship in core only (hooks exactly once).

## Acceptance

- [ ] `packs/kai-core/` and `packs/kai-personal/` are generated from root, committed, and unpublished;
      re-generation is byte-stable; `agents/`+`skills/` at root are unchanged.
- [ ] `scripts/demo-*.mjs` travel with `personal`; `hooks.json` + `scripts/observe-*.mjs` present in
      core only; no department pack ships a duplicate hook.
- [ ] Each generated pack agent carries the preflight + degraded block; the cross-pack validator and
      partition CI pass on the committed trees.
- [ ] `node scripts/pack-preview.mjs --all`, `node scripts/validate-plugin.mjs`, `npm test` pass.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- **Slice.** Thin first increment = core + personal only. Deferred: `engineering`, `product`, `gtm`
  trees generated one-at-a-time ahead of publication in `pack-split-release-12c` — honoring
  "generate/validate/prove one department at a time." `personal` first: most defensible extraction
  and the department that owns the demo assets, so architect caveat (c) is resolved where it is needed.
- Architect caveat (b) — review-lens binding — is **not on this critical path** (engineering is
  deferred); resolve it before the engineering tree is generated. See decomposition Open Questions.
- Confirm committed-tree location `packs/` (Open Question 2).

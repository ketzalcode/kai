# Thread — pack-split-generated-pack-trees

Append-only communication log mirroring
`kai/coordination/items/pack-split-generated-pack-trees.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. **Slice:** generate committed-unpublished `kai-core` + `kai-personal` trees from root (generate-not-move), realizing architect caveat (c) asset-ownership (demo-*.mjs -> personal; hooks + observe-*.mjs -> core only, hooks exactly once). Deferred: engineering/product/gtm trees generated one-at-a-time in `pack-split-release-12c`. Size L. Owner `principal-swe-infra`; review `principal-swe-architect`/independent-architecture. Depends on all four dependency-guarantee items + `pack-split-generator-gates` (shipped) + `pack-split-host-semantics-spike` (completed).
- state:     proposed
- needs:     Steward grooming + promotion; confirm committed-tree location `packs/` (Open Question 2).
- artifacts: kai/coordination/items/pack-split-generated-pack-trees.md; decomposition WS#7
- evidence:  scripts/pack-preview.mjs buildAll() + PACKS.personal; hooks.json -> observe-subagent.mjs; scripts/demo-*.mjs invoked by creative-video-director + video-direction — captured 2026-08-24 from C:\src\kai
- questions: architect caveat (b) review-lens binding is NOT on this (personal) critical path — resolve before the engineering tree is generated (12c)
- next:      principal-product-manager — groom milestone-by-milestone; personal-first honors "one department at a time".

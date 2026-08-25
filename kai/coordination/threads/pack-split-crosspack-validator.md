# Thread — pack-split-crosspack-validator

Append-only communication log mirroring
`kai/coordination/items/pack-split-crosspack-validator.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Cross-pack reference validation across all three firing paths (inherited, user-invoked, orchestrated) + non-markdown assets + hooks-exactly-once, layered on the WS#1 multi-manifest validator. Size L. Owner `principal-swe-infra`; review `principal-swe-architect`/independent-architecture. Depends on `pack-split-generator-gates` (shipped); parallel with `pack-split-preflight-compat`.
- state:     proposed
- needs:     Steward grooming — confirm scope + promote when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-crosspack-validator.md; decomposition WS#3
- evidence:  scripts/validate-plugin.mjs (single-manifest ref checks today) — captured 2026-08-24 from C:\src\kai
- questions: orchestrated firing path has no static Inherits anchor — scoping the check may need an architect call (covered by the required review)
- next:      principal-product-manager — groom milestone-by-milestone.

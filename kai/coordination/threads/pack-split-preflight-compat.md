# Thread — pack-split-preflight-compat

Append-only communication log mirroring
`kai/coordination/items/pack-split-preflight-compat.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Combined fail-closed preflight + `contract: 1` version check injected into each pack agent body, byte-pinned in CI; `kai-core-contract-v1` materialized as a real core skill. Size L. Owner `principal-swe-infra`; reviews `principal-swe-architect`/independent-architecture + `principal-security`/independent-security (fail-closed trust boundary). Depends on `pack-split-generator-gates` (shipped).
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-preflight-compat.md; decomposition WS#4
- evidence:  scripts/pack-preview.mjs preflightBlock()/contractSkill() prototype + self-test — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone.

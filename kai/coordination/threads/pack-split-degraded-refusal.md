# Thread — pack-split-degraded-refusal

Append-only communication log mirroring
`kai/coordination/items/pack-split-degraded-refusal.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. One canonical drift-proof refusal block (restates no rules) copied per pack, CI-pinned like `inherits-block.txt`. Size M. Owner `principal-swe-infra`; reviews `principal-swe-architect`/independent-architecture + `principal-security`/independent-security. Depends on `pack-split-preflight-compat` (shipped) — shared agent-body injection surface, sequenced not raced.
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-degraded-refusal.md; decomposition WS#5
- evidence:  scripts/lib/inherits-block.txt (the canonical-file + CI-pin precedent) — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone.

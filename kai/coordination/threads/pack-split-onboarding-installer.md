# Thread — pack-split-onboarding-installer

Append-only communication log mirroring
`kai/coordination/items/pack-split-onboarding-installer.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Honest guided installer — core first, verify each step, stop on first failure, never claim unverified rollback, fresh-session caveat. Size M. Owner `principal-swe-infra` (install-order/verify semantics); prose co-authored by `principal-technical-writer`. Reviews `principal-swe-architect`/independent-architecture + `principal-technical-writer`/doc-review (prose honesty). Depends on `pack-split-generated-pack-trees` + `pack-split-migration-doctor` (shipped); parallel with `pack-split-host-gates`.
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-onboarding-installer.md; decomposition WS#11
- evidence:  docs/proposals/pack-architecture.md "Onboarding" (guided installer, not transactional) — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone.

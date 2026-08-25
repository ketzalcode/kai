# Thread — pack-split-migration-doctor

Append-only communication log mirroring
`kai/coordination/items/pack-split-migration-doctor.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Extend `scripts/workspace-doctor.mjs` for verifiable uninstall-first of legacy `kai`, coexistence refusal, existing-`.kai` workspace-provenance migration, and the fresh-session notice. Size L. Owner `principal-swe-infra`; reviews `principal-security`/independent-security (legacy contract collision, trust boundary) + `principal-sre`/independent-reliability (provenance migration safety). Depends on `pack-split-generator-gates` (shipped); parallel with `pack-split-generated-pack-trees`.
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-migration-doctor.md; decomposition WS#8
- evidence:  scripts/workspace-doctor.mjs already carries schema_version + migrations[] ladder — captured 2026-08-24 from C:\src\kai
- questions: none (cross-host legacy detection informed by the host-semantics spike)
- next:      principal-product-manager — groom milestone-by-milestone.

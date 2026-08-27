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

## NOTE 2026-08-26-1558 — principal-product-manager (steward)

- did:       Reconciled the accepted post-extraction DAG. Added the typed
             dependency `pack-split-pack-dependency-manifests (requires:
             shipped)` and incremented the item v1 -> v2. The earlier
             parallel-with-host-gates note is superseded: truthful installer
             commands and verification semantics depend on the host-informed
             manifest/runtime contract.
- state:     proposed
- needs:     Stay parked while `scope.current` is `first-pack-extracted`.
             After host gates complete, dependency manifests ship, and the
             steward promotes this item, preserve core-first, stop-on-first-
             failure, exact partial-state, and fresh-session behavior.
- artifacts: kai/coordination/items/pack-split-onboarding-installer.md;
             kai/coordination/items/pack-split-pack-dependency-manifests.md
- evidence:  generated-tree acceptance R11 defers manifests to publication;
             the dependency-manifest item owns verified install semantics.
- questions: none
- next:      principal-product-manager — retain behind the scope valve until
             the current milestone closes.

## HANDOFF 2026-08-27-1155 — principal-product-manager -> principal-swe-infra

- did:       Verified active scope `five-pack-split-shipped` and all three
             typed dependencies at `shipped`: generated pack trees, migration
             doctor, and dependency manifests. Promoted `proposed -> ready`
             without changing acceptance, touches, review requirements, or
             priority.
- state:     ready
- needs:     Implement the smallest honest guided installer: exact pack set
             and commands, explicit confirmation, core first, verify every
             step, stop on first failure, report exact partial state, and
             require a fresh session after core installation.
- artifacts: kai/coordination/items/pack-split-onboarding-installer.md;
             kai/library/releases/2026-08-27/01-ship-pack-split-pack-dependency-manifests/ship-record.md
- evidence:  `pack-split-generated-pack-trees`, `pack-split-migration-doctor`,
             and `pack-split-pack-dependency-manifests` are all `shipped`.
- questions: none
- next:      principal-swe-infra — claim a lease and implement; obtain both
             independent architecture and technical-writing reviews on one
             exact `change_ref`.

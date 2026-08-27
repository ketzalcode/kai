# Thread — pack-split-pack-dependency-manifests

Append-only communication log mirroring
`kai/coordination/items/pack-split-pack-dependency-manifests.md`. See
`kai-core-work-coordination`.

## NOTE 2026-08-26-1558 — principal-product-manager (steward)

- did:       Accepted the existing proposed item into the authoritative critical
             path and added it to `five-pack-split-shipped.required_items` at
             typed terminal state `shipped`. Cleared the premature owner field;
             no lease was taken. The item remains proposed because the current
             milestone is still `first-pack-extracted`.
- state:     proposed
- needs:     After `pack-split-host-gates` completes and the steward advances
             `scope.current`, promote this item before onboarding. Preserve
             root-generated packs, lockstep semver, unpublished topology, and
             the emitted-tree bare-import refusal.
- artifacts: kai/coordination/items/pack-split-pack-dependency-manifests.md;
             kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees/ship-record.md;
             kai/initiatives/pack-split/northstar.md
- evidence:  generated-tree acceptance R11 and its canonical ship record defer
             runtime dependency manifests to publication; `pack-split-release-12b`
             already declares this item as a prerequisite.
- questions: none
- next:      principal-product-manager — promote only after the current milestone
             closes; then `principal-swe-infra` owns implementation.

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

## HANDOFF 2026-08-26-1806 — principal-product-manager -> principal-swe-infra

- did:       Reconciled `first-pack-extracted` at 4 of 4 typed requirements,
             advanced `scope.current` to `five-pack-split-shipped`, and promoted
             this item alone `proposed -> ready` (v2 -> v3, priority 20 -> 10).
             Its sole dependency, `pack-split-host-gates (completed)`, is met.
             Owner and lease remain clear.
- state:     ready
- needs:     Implement only the accepted dependency-manifest/runtime contract,
             preserve root-generated packs and lockstep semver, keep emitted
             bare-import refusal intact, and obtain the required independent
             architecture review before release routing. Do not publish packs,
             alter marketplace topology, or start onboarding/release items.
- artifacts: kai/coordination/items/pack-split-pack-dependency-manifests.md;
             kai/initiatives/pack-split/northstar.md;
             kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md
- evidence:  PR #174 merged to main as
             `b6db547c41b606c92e78e9d91fab82c554fc7d3d`; main validation run
             `33028413182`, job `98375047081`, succeeded; host-gates is
             completed and SRE-ratified at `263452126179dd9f3a61183903a26a90c4d6b1c1`;
             the disposable consumer repository was deleted after evidence
             preservation.
- questions: none
- next:      principal-swe-infra — sole executable item; claim under a fresh
             lease before implementation.

## NOTE 2026-08-26-1818 — principal-swe-infra

- did:       Claimed the sole executable item under lease
             `psinfra-1818-dm65`, moved `ready -> in-progress`, and reconciled
             the declared touch set with the implementation already present in
             this same operator-authorized, single-worker session. No other
             item is in progress and no conflicting lease exists.
- state:     in-progress
- needs:     Complete generated manifests, audio resolution, release hygiene,
             exact-tree validation, and the required independent architecture
             review before moving to in-review.
- artifacts: scripts/lib/pack-plan.mjs; scripts/pack-preview.mjs;
             scripts/validate-plugin.mjs; packs/kai-core; packs/kai-personal;
             skills/kai-core-generate-audio/SKILL.md;
             skills/demo-narrate/SKILL.md
- evidence:  pack-preview self-test passed 155 checks before the final
             documentation and release-metadata pass; generated kai-core lock
             accepted `npm ci` and produced a working `lectoria --help`.
- questions: none
- next:      principal-swe-infra — finish the bounded dependency-contract
             increment, then bind review to a git change_ref.

## NOTE 2026-08-26-1823 — principal-swe-infra

- did:       Reconciled the touch set to include the canonical pack-architecture
             proposal after replacing its now-stale "no package manifests"
             statement with the settled host and `npm ci` contract.
- state:     in-progress
- needs:     Final regeneration, full validation, and commit-bound architecture
             review.
- artifacts: docs/proposals/pack-architecture.md;
             kai/coordination/items/pack-split-pack-dependency-manifests.md
- evidence:  Host behavior remains sourced from the completed reliability
             artifact; no marketplace topology or publication state changed.
- questions: none
- next:      principal-swe-infra — complete validation and mint change_ref.

## HANDOFF 2026-08-26-1827 — principal-swe-infra -> principal-swe-architect

- did:       Implemented the pack dependency contract and moved
             `in-progress -> in-review`. Every generated pack now receives
             deterministic npm metadata; core and personal project the exact
             root-pinned Lectoria graph; emitted bare imports require a
             same-pack declaration and lock record. Audio scripts and personal
             handoffs resolve the correct provider root and state the manual
             `npm ci` plus update-survival contract. Version moved
             `0.64.0 -> 0.65.0`. Lease cleared.
- state:     in-review
- needs:     Independent architecture review at exact change_ref
             `e67057ec061e9799cf7300bce972305ab01a7603`. If ratified, route to
             workflow-ship; if findings change implementation, mint a new ref
             and repeat review.
- artifacts: scripts/lib/pack-plan.mjs; scripts/pack-preview.mjs;
             scripts/validate-plugin.mjs; scripts/generate-audio.ps1;
             scripts/demo-narrate.mjs; skills/kai-core-generate-audio/SKILL.md;
             skills/demo-narrate/SKILL.md; packs/kai-core/package.json;
             packs/kai-core/package-lock.json; packs/kai-personal/package.json;
             packs/kai-personal/package-lock.json
- evidence:  `npm test` success at 0.65.0; pack self-test 157/157; generated
             drift clean; `git diff --check` clean; temporary core + personal
             `npm ci` both succeeded and exposed Lectoria; provider-root
             resolution invoked the generated core wrapper's pack-local binary.
             npm warned that this verification host's Node 24.14.0 is below the
             declared 24.15.0 floor; the install and executable probes still
             succeeded.
- questions: none
- next:      principal-swe-architect — review the dependency boundary,
             deterministic lock projection, same-pack runtime ownership, and
             provider-root invocation contract at the exact SHA.

## NOTE 2026-08-26-1827 — director review dispatch

- did:       Granted the required independent architecture review lease
             `arch-1827-dm65` at item version 6. Lifecycle remains `in-review`;
             implementation change_ref remains
             `e67057ec061e9799cf7300bce972305ab01a7603`.
- state:     in-review
- needs:     A ratify or changes-required verdict bound to the exact change_ref,
             with implementation left untouched by the assessor.
- artifacts: kai/coordination/items/pack-split-pack-dependency-manifests.md;
             kai/coordination/threads/pack-split-pack-dependency-manifests.md
- evidence:  No other item is in progress and the builder lease was cleared
             before this reviewer grant.
- questions: none
- next:      principal-swe-architect — perform the independent review under
             token `arch-1827-dm65`.

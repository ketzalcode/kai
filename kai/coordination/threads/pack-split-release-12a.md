# Thread — pack-split-release-12a

Append-only communication log mirroring
`kai/coordination/items/pack-split-release-12a.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Release 12a — the migration notice on `0.x`, no packs published, install surface unchanged. Size M. Owner `principal-swe-infra` prepares; **operator** publishes/tags. Reviews `principal-sre`/independent-reliability + `principal-technical-writer`/doc-review. Depends on `pack-split-onboarding-installer` + `pack-split-migration-doctor` (shipped).
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-release-12a.md; decomposition WS#12
- evidence:  docs/reference/plugin-structure.md "What 1.0.0 is reserved for" (groundwork stays on 0.x) — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone; publish is operator-executed.

## HANDOFF 2026-08-27-1306 — principal-product-manager -> principal-swe-infra

- did:       Verified `pack-split-onboarding-installer (requires: shipped)` and `pack-split-migration-doctor (requires: shipped)` against their authoritative records; confirmed release 12a fits current milestone `five-pack-split-shipped` with explicit acceptance; promoted only `pack-split-release-12a` from `proposed` to `ready`.
- state:     ready
- needs:     Prepare the migration notice on `0.x` only. Keep the install surface unchanged; keep the marketplace exactly the monolith `kai` at source `.`; publish no packs. The operator executes the tag and release. `principal-sre` / independent-reliability and `principal-technical-writer` / doc-review must bind one exact future `change_ref`.
- artifacts: kai/coordination/items/pack-split-release-12a.md; kai/initiatives/pack-split/northstar.md; kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md; docs/reference/plugin-structure.md
- evidence:  kai/coordination/items/pack-split-onboarding-installer.md (`shipped`, v18); kai/library/releases/2026-08-27/02-ship-pack-split-onboarding-installer/ship-record.md; kai/coordination/items/pack-split-migration-doctor.md (`shipped`, v5) — captured 2026-08-27-1306
- questions: none
- next:      principal-swe-infra — prepare release 12a within the unchanged staged-release constraints; do not tag, release, or publish.

## NOTE 2026-08-27-1320 — principal-swe-infra

- did:       Claimed release 12a and prepared the `0.67.0` monolith migration
             notice. README and CHANGELOG now say the split arrives at
             `1.0.0`, packs are still unpublished, users must not uninstall
             `kai` yet, and the guided installer will not remove legacy until
             the full requested set is available at one marketplace version.
- state:     in-progress
- needs:     Complete lockstep release metadata, run the release and contract
             gates, bind both required reviews to one exact change ref, and
             prepare the operator release handoff.
- artifacts: README.md; CHANGELOG.md;
             kai/coordination/items/pack-split-release-12a.md
- evidence:  Marketplace topology remains the single `kai` entry at source
             `.`; no pack entry was added and install commands are unchanged.
- questions: none
- next:      principal-swe-infra — finish release metadata and verification.

## HANDOFF 2026-08-27-1327 — principal-swe-infra -> principal-sre

- did:       Completed release 12a at exact implementation ref
             `2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620`. The `0.67.0`
             migration notice is prominent and fail-safe; all root,
             marketplace, core, and personal versions are lockstep.
- state:     in-review
- needs:     Review deprecation and rollout safety at the exact ref, then hand
             the same ref to `principal-technical-writer` for notice accuracy.
- artifacts: README.md; CHANGELOG.md; .github/plugin/marketplace.json;
             plugin.json; package.json; packs/kai-core/; packs/kai-personal/
- evidence:  Full `npm test` passed; `node scripts/release-guard.mjs --base
             origin/main --head 2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620`
             passed; marketplace remains exactly one `kai` entry at source `.`;
             no pack entry was added and install commands are unchanged.
- questions: none
- next:      principal-sre — perform independent reliability review at
             `2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620`.

## REVIEW 2026-08-27-1318 — principal-sre

- change_ref: 2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620
- verdict:    ratified
- findings:   P0 0 / P1 0 / P2 1. The notice, do-not-uninstall
              warning, fail-safe availability gate, monolith-only marketplace,
              unchanged install command, and lockstep `0.67.0` metadata are
              safe for release 12a. The sole P2 is record-only: expand the
              item's `touches` list to match the release metadata actually
              changed.
- evidence:   README.md:37-43; CHANGELOG.md:7-22;
              skills/kai-core-workspace-onboarding/SKILL.md:53-69,111-158;
              .github/plugin/marketplace.json:12-16. Release 12b remains
              NO-GO.
- next:       principal-swe-infra — reconcile the record-only touches finding;
              no implementation ref change or re-review is required.

## REVIEW 2026-08-27-1318 — principal-technical-writer

- change_ref: 2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620
- verdict:    approved
- findings:   P0 0 / P1 0 / P2 0.
- evidence:   The notice is prominent, concise, unambiguous, consistent with
              the guided installer, and accurately preserves the current
              monolith-only install surface without promising publication.
- next:       workflow-ship — run the six-dimension gate after PR CI.

## NOTE 2026-08-27-1318 — principal-swe-infra

- did:       Closed SRE's record-only P2 by expanding the item's `touches`
             list to every release metadata and coordination path changed.
             Implementation ref remains
             `2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620`; both required reviews
             now bind that exact ref.
- state:     in-review
- needs:     Push the reviewed change, obtain PR CI, then run
             `workflow-ship` PREPARE.
- artifacts: kai/coordination/items/pack-split-release-12a.md
- evidence:  SRE ratified P0/P1 `0/0`; technical writer approved
             P0/P1/P2 `0/0/0`.
- questions: none
- next:      principal-swe-infra — publish the review record and obtain PR CI.

## HANDOFF 2026-08-27-1319 — workflow-ship -> @operator

- did:       Ran PREPARE. All six DoD dimensions are Clear; promoted the
             canonical `0.67.0` ship record; moved item v5 -> v6 lease grant ->
             v7 `release-ready`; cleared the lease.
- state:     release-ready — not shipped
- needs:     Commit and push the PREPARE records, require PR #179 and exact-main
             CI green, merge without squash/rebase, publish `v0.67.0` at the
             merge commit, then return the production evidence named in the
             ship record.
- artifacts: kai/library/releases/2026-08-27/03-ship-pack-split-release-12a/ship-record.md;
             kai/coordination/items/pack-split-release-12a.md;
             kai/initiatives/pack-split/log.md;
             kai/initiatives/pack-split/deliverables.md
- evidence:  Reviewed implementation `2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620`;
             PR https://github.com/RubenSaucedo/kai/pull/179 at pre-PREPARE
             head `194dee86fc6a16712108c4e685be6d5e96944692`; run
             https://github.com/RubenSaucedo/kai/actions/runs/33112672011
             concluded success in all three jobs — captured 2026-08-27-1319
- questions: none
- next:      @operator — run the recorded deploy, abort, rollback, and
             production-verification steps. Release 12b remains NO-GO.

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | Clear | `scope.current: five-pack-split-shipped`; base-to-review diff is the `0.67.0` notice/version slice; marketplace stays one `kai` entry at source `.`; no pack is published. |
| 2 | verified | Clear | Full local `npm test` and exact release guard passed; PR run `33112672011` passed contract and both runtime-dependency jobs. No UI/design sub-gate applies. |
| 3 | reviewed | Clear | SRE ratified and technical writer approved exact ref `2b4c5b3d…`; SRE's sole record-only P2 is corrected; review-ref to PR head changes only the item/thread records. |
| 4 | shippable-safely | Clear | No runtime service, data, migration, or pack publication; main-CI/version/topology signals and patch-release rollback are recorded with owner `principal-swe-infra`. |
| 5 | documented | Clear | README, CHANGELOG, canonical ship record, initiative log, and deliverables index carry the release contract. |
| 6 | coordination-closed | Clear | Item v7, thread, board, ACTIVE, dependencies, reviews, and operator handoff agree; no questions are open. |

## NOTE 2026-08-27-1319 — workflow-ship

- did:       Completed the draft-to-library filing and initiative-index pass
             under a second verified workflow lease; item v7 -> v8 lease grant
             -> v9, with the lease cleared. The RELEASE-READY verdict and
             reviewed implementation ref are unchanged.
- state:     release-ready — not shipped
- artifacts: .kai/runs/ship/2026-08-27/01-ship-pack-split-release-12a/ship-record.md;
             kai/library/releases/2026-08-27/03-ship-pack-split-release-12a/ship-record.md
- next:      @operator — execute the existing HANDOFF; release 12b remains
             NO-GO.

## NOTE 2026-08-27-1319 — workflow-ship

- did:       Verified both release-record locations, reconciled the final
             item version through v10 lease grant -> v11, and cleared the
             lease. No readiness evidence or implementation changed.
- state:     release-ready — not shipped
- next:      @operator — execute the recorded deploy and return production
             evidence to `workflow-ship`.

## NOTE 2026-08-27-1319 — workflow-ship

- did:       Corrected the operator's PR-base inspection to the supported
             `gh api` fields; item v11 -> v12 lease grant -> v13, lease clear.
             No release verdict, implementation, or release metadata changed.
- state:     release-ready — not shipped
- next:      @operator — execute the recorded deploy handoff.

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

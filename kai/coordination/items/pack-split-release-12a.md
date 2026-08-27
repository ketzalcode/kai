---
type: work-item
id: pack-split-release-12a
title: Release 12a — migration notice on 0.x (no packs published)
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: shipped
resume_state: null
priority: 20
owner: principal-swe-infra
next_role: null
target: pack-split staged release 12a (migration notice)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/reference/plugin-structure.md
touches:
  - .github/plugin/marketplace.json
  - CHANGELOG.md
  - README.md
  - plugin.json
  - package.json
  - package-lock.json
  - packs/kai-core/plugin.json
  - packs/kai-core/package.json
  - packs/kai-core/package-lock.json
  - packs/kai-personal/plugin.json
  - packs/kai-personal/package.json
  - packs/kai-personal/package-lock.json
  - kai/coordination/
  - kai/initiatives/pack-split/log.md
  - kai/initiatives/pack-split/deliverables.md
  - kai/library/releases/2026-08-27/03-ship-pack-split-release-12a/
depends_on:
  - item: pack-split-onboarding-installer
    requires: shipped
  - item: pack-split-migration-doctor
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-sre
    kind: independent-reliability
  - role: principal-technical-writer
    kind: doc-review
completed_reviews:
  - role: principal-sre
    kind: independent-reliability
    change_ref: 2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620
    verdict: ratified
    evidence: "kai/coordination/threads/pack-split-release-12a.md"
    timestamp: 2026-08-27-1318
  - role: principal-technical-writer
    kind: doc-review
    change_ref: 2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620
    verdict: approved
    evidence: "kai/coordination/threads/pack-split-release-12a.md"
    timestamp: 2026-08-27-1318
change_ref: 2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620
version: 18
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1339
---

## Outcome

A `0.x` monolith release carrying the migration notice / deprecation warning — the split is coming and
here is how to migrate — with no packs published yet. Prepares users for the flip without changing the
install surface.

## Acceptance

- [x] The migration notice is prepared in the monolith and accurately describes the coming split + migration.
- [x] `marketplace.json` retains the monolith-only topology; the install command has not changed.
- [x] Release cut on `0.x` with CHANGELOG + README stamp; `node scripts/release-guard.mjs` gate passes.

## Evidence

- README `## Status` carries the pre-publication warning: do not uninstall
  legacy `kai` until all requested packs are published at one marketplace
  version; the guided path then removes legacy, installs core first, and
  verifies each step.
- CHANGELOG `0.67.0` records the same migration contract and explicitly states
  that packs remain unpublished and the current install surface is unchanged.
- Full `npm test` passes at `0.67.0`; `pack-preview --check` confirms the
  committed core and personal trees match the generator, and
  `release-guard.mjs` accepts the forward bump plus release notes.
- PR #179 head `194dee86fc6a16712108c4e685be6d5e96944692` passed GitHub
  Actions run `33112672011`: `contract`, `runtime-dependencies (kai-core)`,
  and `runtime-dependencies (kai-personal)` all concluded `success`.
- `workflow-ship` PREPARE passed all six DoD dimensions. Canonical record:
  `kai/library/releases/2026-08-27/03-ship-pack-split-release-12a/ship-record.md`.
- **CONFIRM-START:** Authoritative operator evidence records PR #179 head
  `0f1c1d28032d8fa8d9b7e0d94389ed4545bce72f` merged without squash or
  rebase as `b28113eb65256c00272382d6f73402ee7f0ff030` at
  `2026-08-27T20:29:17Z`, starting deployment of `v0.67.0` to the public
  GitHub release surface. Reviewed implementation
  `2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620` remains in ancestry; all later
  changes are coordination, initiative, and ship-record only.
- **CONFIRM-COMPLETE:** Exact-main run
  `https://github.com/RubenSaucedo/kai/actions/runs/33113558866` succeeded at
  merge `b28113eb65256c00272382d6f73402ee7f0ff030`; `contract`,
  `runtime-dependencies (kai-core)`, and
  `runtime-dependencies (kai-personal)` all succeeded. Public release
  `https://github.com/RubenSaucedo/kai/releases/tag/v0.67.0` is non-draft,
  non-prerelease, targets the exact merge, and was published
  `2026-08-27T20:29:54Z`.
- **Production verification passed 7/7.** Root plugin/package, marketplace
  metadata and monolith entry, core plugin/package, and personal
  plugin/package are all `0.67.0`; README and CHANGELOG agree. Marketplace
  contains exactly one `kai` at source `.`, no pack entry is published,
  `pack-preview --check` passes, and `validate-plugin` passes with 56 agents
  and 51 skills. The notice says packs remain unpublished and users must not
  uninstall legacy `kai` yet. Rollback was not invoked.

## Notes

- **Release/version: stays on `0.x`.** The publish/tag is **operator-executed**; this role prepares
  the release, never tags/publishes.
- First of the staged 12a/12b/12c release; no marketplace change here.

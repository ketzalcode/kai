---
type: work-item
id: pack-split-release-12a
title: Release 12a — migration notice on 0.x (no packs published)
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: in-progress
resume_state: null
priority: 20
owner: principal-swe-infra
next_role: principal-swe-infra
target: pack-split staged release 12a (migration notice)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/reference/plugin-structure.md
touches:
  - CHANGELOG.md
  - README.md
  - plugin.json
  - package.json
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
completed_reviews: []
change_ref: null
version: 3
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1320
---

## Outcome

A `0.x` monolith release carrying the migration notice / deprecation warning — the split is coming and
here is how to migrate — with no packs published yet. Prepares users for the flip without changing the
install surface.

## Acceptance

- [x] The migration notice is prepared in the monolith and accurately describes the coming split + migration.
- [x] `marketplace.json` retains the monolith-only topology; the install command has not changed.
- [ ] Release cut on `0.x` with CHANGELOG + README stamp; `node scripts/release-guard.mjs` gate passes.

## Evidence

- README `## Status` carries the pre-publication warning: do not uninstall
  legacy `kai` until all requested packs are published at one marketplace
  version; the guided path then removes legacy, installs core first, and
  verifies each step.
- CHANGELOG `0.67.0` records the same migration contract and explicitly states
  that packs remain unpublished and the current install surface is unchanged.

## Notes

- **Release/version: stays on `0.x`.** The publish/tag is **operator-executed**; this role prepares
  the release, never tags/publishes.
- First of the staged 12a/12b/12c release; no marketplace change here.

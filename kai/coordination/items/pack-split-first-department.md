---
type: work-item
id: pack-split-first-department
title: Prove kai-core + personal installs and operates over the plugin boundary
initiative: pack-split
milestone: first-pack-extracted
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split first-department install proof
artifact_target: kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
touches:
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md
depends_on:
  - item: pack-split-generated-pack-trees
    requires: shipped
  - item: pack-split-migration-doctor
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews: []
change_ref: null
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-24-2011
---

## Outcome

A verified proof that a project can install `kai-core` + `kai-personal` from the committed-unpublished
trees and its agents operate with the full contract resolved across the plugin boundary, with the
migration doctor enforcing uninstall-first — no public marketplace publish.

## Acceptance

- [ ] A real install of core + personal (via staging source / `--plugin-dir`) is performed and a
      personal agent binds `kai-core-*` skills across the plugin boundary and passes its preflight.
- [ ] The migration doctor's uninstall-first / coexistence-refusal is exercised on the real install.
- [ ] Per-session discovery-metadata cost for core+personal is captured against the whole-roster baseline.
- [ ] Evidence recorded at the artifact target.

## Evidence

- (to be filled) — operator install transcript + the reliability record.

## Notes

- "Shipped" here = enabling changes in a published `0.x` release **and** operator install evidence
  against the committed trees — distinct from the public flip (`pack-split-release-12b`). Confirm this
  reading with the steward (decomposition Open Question 3).
- The real install is **operator-executed**; this role assembles the proof and records evidence.

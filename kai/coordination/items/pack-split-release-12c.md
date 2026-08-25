---
type: work-item
id: pack-split-release-12c
title: Release 12c — publish remaining departments one at a time + cleanup (1.0.x)
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split staged release 12c (remaining departments + cleanup)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - .github/plugin/marketplace.json
touches:
  - .github/plugin/marketplace.json
  - packs/kai-engineering/
  - packs/kai-product/
  - packs/kai-gtm/
  - plugin.json
  - package.json
  - CHANGELOG.md
  - README.md
depends_on:
  - item: pack-split-release-12b
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-sre
    kind: independent-reliability
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

The remaining `engineering`, `product`, `gtm` department packs are generated one-at-a-time and
published, split scaffolding is removed, and the initiative finalizes on `1.0.x`. All five packs
(core + four departments) are live; the split is complete.

## Acceptance

- [ ] `engineering`, `product`, `gtm` trees generated from root (each its own reviewable pass) and
      published to `kai-plugins`, one at a time — never all remaining in one step.
- [ ] The engineering tree's review-lens binding (architect caveat b) is resolved before it is generated.
- [ ] Split scaffolding removed; `plugin.json` + `package.json` on `1.0.x`; marketplace index matches.
- [ ] `release-guard` gate passes for each staged publish.

## Evidence

- (to be filled) — marketplace diffs + operator publish confirmations per department.

## Notes

- **Release/version: `1.0.x`.** Publishes one department at a time; the publishes are **operator-executed**.
- Architect review covers each deferred tree, including the engineering review-lens binding (caveat b).

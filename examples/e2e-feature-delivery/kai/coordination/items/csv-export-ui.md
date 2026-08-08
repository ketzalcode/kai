---
type: work-item
id: csv-export-ui
title: Export button and progress state on the report view
initiative: csv-export
milestone: m1-export-ga
delivery_class: product-change
state: in-review
resume_state: null
priority: 20
owner: principal-swe-frontend
next_role: principal-qa-ui
target: web
artifact_target: kai/initiatives/csv-export/artifacts/design-ui.md
context_artifacts:
  - kai/initiatives/csv-export/artifacts/brief.md
  - kai/initiatives/csv-export/artifacts/design-ui.md
touches:
  - web/src/reports/export/**
  - web/src/reports/__tests__/export/**
depends_on:
  - item: csv-export-api
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-qa-ui
    kind: independent-system
completed_reviews: []
change_ref: 9b2d017
version: 6
lease:
  holder: principal-qa-ui
  token: lease-9b2d017-06
  version_at_grant: 5
  acquired: 2026-03-05-0900
  expires: 2099-03-05-1700
updated: 2026-03-05-0900
---

## Outcome

A user can trigger a CSV export from the report view and see honest progress and
failure states while it runs.

## Acceptance

- [x] Export button is disabled while an export for that report is in flight.
- [x] Progress reflects real server state rather than an animation.
- [x] A failed export surfaces a retry affordance and does not silently vanish.
- [ ] Independent system verification on a real browser.

## Evidence

- Design: `kai/initiatives/csv-export/artifacts/design-ui.md`
- Implementation: commit `9b2d017`
- Tests: `web/src/reports/__tests__/export/` — component and integration tests,
  written by the implementing frontend engineer.
- QA verification: in progress; the lease is held by `principal-qa-ui` against
  version 5, and the review is bound to `9b2d017`. Any new commit invalidates it.

## Notes

This item is deliberately **not** `release-ready`. Implementation is complete
and reviewed by its author, but the required independent verification has not
returned, so the state stays `in-review` and `next_role` points at the reviewer.

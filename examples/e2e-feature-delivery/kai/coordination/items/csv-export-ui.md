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
  - role: principal-product-designer
    kind: design-conformance
  - role: principal-qa-ui
    kind: independent-system
completed_reviews:
  - role: principal-product-designer
    kind: design-conformance
    change_ref: 9b2d017
    evidence: kai/coordination/threads/csv-export-ui.md
    verdict: approved
    timestamp: 2026-03-05-1015
change_ref: 9b2d017
version: 7
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-03-05-1015
---

## Outcome

A user can trigger a CSV export from the report view and see honest progress and
failure states while it runs.

## Acceptance

- [x] Export button is disabled while an export for that report is in flight.
- [x] Progress reflects real server state rather than an animation.
- [x] A failed export surfaces a retry affordance and does not silently vanish.
- [x] Design-conformance verdict from `principal-product-designer`.
- [ ] Independent system verification on a real browser.

## Evidence

- Design: `kai/initiatives/csv-export/artifacts/design-ui.md`
- Implementation: commit `9b2d017`
- Tests: `web/src/reports/__tests__/export/` — component and integration tests,
  written by the implementing frontend engineer.
- Design conformance: approved at `9b2d017` against the approved design artifact.
  This is a net-new user-facing surface, so the `definition-of-done` design
  sign-off sub-gate fires from the diff itself; without this verdict or a
  recorded operator WAIVER the item cannot reach `release-ready`.
- QA verification: not yet dispatched. The lease is unheld, and `next_role`
  names `principal-qa-ui`. When QA claims it, the lease is granted against the
  current version and the review binds to `9b2d017` — any new commit invalidates
  both completed reviews.

## Notes

This item is deliberately **not** `release-ready`. Implementation is complete
and design conformance has returned, but the required independent system
verification has not, so the state stays `in-review` and `next_role` points at
the reviewer.

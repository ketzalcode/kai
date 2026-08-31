---
type: work-item
id: lease-expired
title: Export retry semantics
initiative: fixture
delivery_class: product-change
state: in-progress
resume_state: null
priority: 50
owner: principal-swe-backend
next_role: principal-swe-backend
target: reporting-service
artifact_target: .kai/state/initiatives/fixture/artifacts/design-retry.md
context_artifacts: []
touches:
  - services/reporting/retry/**
depends_on: []
waiting_on_questions: []
required_for_milestone: false
review_requirements: []
completed_reviews: []
change_ref: null
version: 5
lease:
  holder: principal-swe-backend
  token: t-9f3c21
  version_at_grant: 4
  acquired: 2026-03-09-0800
  expires: 2026-03-09-2000
updated: 2026-03-09-0800
---

## Outcome

A failed export retries without duplicating audit rows.

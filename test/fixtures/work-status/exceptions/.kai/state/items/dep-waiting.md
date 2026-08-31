---
type: work-item
id: dep-waiting
title: Export usage dashboard
initiative: fixture
delivery_class: product-change
state: ready
resume_state: null
priority: 40
owner: principal-swe-frontend
next_role: principal-swe-frontend
target: web
artifact_target: .kai/state/initiatives/fixture/artifacts/design-usage.md
context_artifacts: []
touches:
  - web/src/reports/usage/**
depends_on:
  - item: awaiting-deploy
    requires: shipped
waiting_on_questions: []
required_for_milestone: false
review_requirements: []
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-03-08-1200
---

## Outcome

Tenants can see their export usage against the rate limit.

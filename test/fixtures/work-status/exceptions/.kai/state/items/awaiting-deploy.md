---
type: work-item
id: awaiting-deploy
title: Export rate limiting
initiative: fixture
delivery_class: product-change
state: release-ready
resume_state: null
priority: 20
owner: principal-swe-backend
next_role: null
target: reporting-service
artifact_target: .kai/state/initiatives/fixture/artifacts/design-rate-limit.md
context_artifacts: []
touches:
  - services/reporting/limits/**
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-security
    kind: independent-security
completed_reviews:
  - role: principal-security
    kind: independent-security
    change_ref: c31aa90
    evidence: .kai/state/threads/awaiting-deploy.md
    verdict: approved
    timestamp: 2026-03-09-1400
change_ref: c31aa90
version: 9
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-03-09-1400
---

## Outcome

Export requests are rate limited per tenant.

## Evidence

- Implementation: commit `c31aa90`
- Security review: approved at `c31aa90`.

---
type: work-item
id: stale-review
title: Export audit logging
initiative: fixture
delivery_class: product-change
state: in-review
resume_state: null
priority: 30
owner: principal-swe-backend
next_role: principal-security
target: reporting-service
artifact_target: kai/initiatives/fixture/artifacts/design-audit.md
context_artifacts: []
touches:
  - services/reporting/audit/**
depends_on: []
waiting_on_questions: []
required_for_milestone: false
review_requirements:
  - role: principal-security
    kind: independent-security
completed_reviews:
  - role: principal-security
    kind: independent-security
    change_ref: 1111aaa
    evidence: kai/coordination/threads/stale-review.md
    verdict: approved
    timestamp: 2026-03-07-1100
change_ref: 2222bbb
version: 6
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-03-09-0800
---

## Outcome

Every export attempt is audit logged.

## Evidence

- Implementation: commit `2222bbb` (amended after the security review).

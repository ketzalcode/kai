---
type: work-item
id: collision-untokened
title: Held lease with no grant token (racy pre-token acquisition)
initiative: sample
milestone: sample-ms
delivery_class: product-change
state: in-progress
resume_state: null
priority: 10
owner: principal-swe-backend
next_role: principal-swe-backend
target: sample
artifact_target: null
context_artifacts: []
touches:
  - src/api/**
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-backend
    kind: independent-code
completed_reviews: []
change_ref: null
version: 5
lease:
  holder: principal-swe-backend
  token: null
  version_at_grant: null
  acquired: 2999-01-01-0900
  expires: 2999-01-01-1700
updated: 2026-07-29-1506
---

## Outcome
Demonstrates collision detection: a held lease without a unique grant token (or
version_at_grant) is the exact racy shape that let two writers both "hold" the
item before serialized granting. The workspace doctor rejects it.

## Acceptance
- [ ] A held lease must carry a token bound to the version it was granted against.

## Evidence
- none yet

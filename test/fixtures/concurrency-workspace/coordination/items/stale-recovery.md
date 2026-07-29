---
type: work-item
id: stale-recovery
title: Expired but properly tokened lease (stale-work recovery signal)
initiative: sample
milestone: sample-ms
delivery_class: product-change
state: in-progress
resume_state: null
priority: 20
owner: principal-swe-frontend
next_role: principal-swe-frontend
target: sample
artifact_target: null
context_artifacts: []
touches:
  - web/src/**
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-frontend
    kind: independent-code
completed_reviews: []
change_ref: null
version: 7
lease:
  holder: principal-swe-frontend
  token: 7c1e-2026-07-20-0900
  version_at_grant: 6
  acquired: 2026-07-20-0900
  expires: 2026-07-20-1700
updated: 2026-07-20-1700
---

## Outcome
Demonstrates stale-lease recovery: a well-formed, uniquely tokened grant whose
expiry has passed. The doctor surfaces it as a stale-work recovery signal so the
single grantor reconciles the thread, re-grants with a fresh token (invalidating
the crashed run's token), and redispatches — rather than overwriting blindly.

## Acceptance
- [ ] An expired held lease is reported as a recovery signal, not silently reclaimed.

## Evidence
- none yet

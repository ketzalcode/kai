---
type: work-item
id: collision-racy-grant
title: Tokened lease whose version_at_grant did not follow the increment
initiative: sample
milestone: sample-ms
delivery_class: product-change
state: in-progress
resume_state: null
priority: 15
owner: principal-swe-backend
next_role: principal-swe-backend
target: sample
artifact_target: null
context_artifacts: []
touches:
  - src/worker/**
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-backend
    kind: independent-code
completed_reviews: []
change_ref: null
version: 4
lease:
  holder: principal-swe-backend
  token: 5b2d-2026-07-29-1010
  version_at_grant: 4
  acquired: 2999-01-01-0900
  expires: 2999-01-01-1700
updated: 2026-07-29-1010
---

## Outcome
Demonstrates collision detection beyond a missing field: a grant carries a
token but its `version_at_grant` (4) equals the item `version` (4). A real grant
reads version N, writes the lease, and increments to N+1, so a held lease always
has `version_at_grant` strictly less than `version`. Equality means the writer
skipped the increment — the exact racy double-write shape #30 guards against —
and the doctor rejects it.

## Acceptance
- [ ] A held lease with version_at_grant >= version is rejected.

## Evidence
- none yet

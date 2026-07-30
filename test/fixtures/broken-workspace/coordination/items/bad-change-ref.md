---
type: work-item
id: bad-change-ref
title: In-review item with a non-SHA change_ref
initiative: sample
milestone: sample-ms
delivery_class: product-change
state: in-review
resume_state: null
priority: 15
owner: null
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
change_ref: WIP-draft-3
version: 4
lease:
  holder: null
  acquired: null
  expires: null
updated: 2026-07-20-1415
---

## Outcome
An in-review item whose change_ref is a bespoke label ("WIP-draft-3") rather
than a git commit/PR-head SHA. Per #31 (decision A1) the doctor must reject it:
only a content-addressed git SHA is reproducible across machines.

## Acceptance
- [ ] n/a — fixture.

## Evidence
- none

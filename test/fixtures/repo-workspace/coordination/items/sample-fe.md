---
type: work-item
id: sample-fe
title: Sample FE slice
initiative: sample
milestone: sample-ms
delivery_class: product-change
state: ready
resume_state: null
priority: 20
owner: null
next_role: principal-swe-frontend
target: sample
artifact_target: null
context_artifacts: []
touches:
  - web/src/sample/**
depends_on:
  - item: sample-api
    requires: in-review
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-frontend
    kind: independent-code
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  acquired: null
  expires: null
updated: 2026-07-20-1415
---

## Outcome
A sample frontend slice that depends on sample-api.

## Acceptance
- [ ] Renders the sample payload.

## Evidence
- none yet

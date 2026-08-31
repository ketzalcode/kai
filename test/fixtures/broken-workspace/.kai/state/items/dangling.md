---
type: work-item
id: dangling
title: Item with a dangling dependency and a machine-absolute artifact path
initiative: sample
milestone: sample-ms
delivery_class: product-change
state: ready
resume_state: null
priority: 20
owner: null
next_role: principal-swe-frontend
target: sample
artifact_target: C:\Users\someone\out\report.md
artifact_targets:
  - ../escaped/report.md
context_artifacts: []
touches:
  - web/src/sample/**
depends_on:
  - item: does-not-exist
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-frontend
    kind: independent-code
completed_reviews: []
change_ref: null
version: 1
lease:
  holder: null
  acquired: null
  expires: null
updated: 2026-07-20-1415
---

## Outcome
An item that depends on a nonexistent upstream and writes outside the workspace.

## Acceptance
- [ ] n/a — fixture.

## Evidence
- none

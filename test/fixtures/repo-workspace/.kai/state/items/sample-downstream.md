---
type: work-item
id: sample-downstream
title: Sample downstream slice (ready but not yet executable)
initiative: sample
milestone: sample-ms
delivery_class: product-change
state: ready
resume_state: null
priority: 30
owner: null
next_role: principal-swe-frontend
target: sample
artifact_target: null
context_artifacts: []
touches:
  - web/src/sample-downstream/**
depends_on:
  - item: sample-api
    requires: shipped
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
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-07-20-1415
---

## Outcome
Demonstrates the revised lifecycle (#31, Option A): this item is `ready`
(steward-committed, dependency declared) while its dependency sample-api has
only reached `in-review`, not the required `shipped`. `ready` means committed,
not runnable — so the doctor reports this workspace as **healthy**. The director
computes the derived *executable* predicate at dispatch and simply waits for
sample-api to ship; the steward never re-promotes this item.

## Acceptance
- [ ] Renders the downstream sample view once sample-api ships.

## Evidence
- none yet

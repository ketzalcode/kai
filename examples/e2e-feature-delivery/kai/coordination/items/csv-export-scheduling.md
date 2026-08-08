---
type: work-item
id: csv-export-scheduling
title: Recurring scheduled exports
initiative: csv-export
milestone: null
delivery_class: product-change
state: proposed
resume_state: null
priority: 90
owner: null
next_role: principal-product-manager
target: reporting-service
artifact_target: null
context_artifacts:
  - kai/initiatives/csv-export/artifacts/brief.md
touches: []
depends_on:
  - item: csv-export-api
    requires: shipped
waiting_on_questions: []
required_for_milestone: false
review_requirements: []
completed_reviews: []
change_ref: null
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-03-02-1120
---

## Outcome

Users can schedule a report export to run and deliver on a recurring cadence.

## Why this is a proposal, not work

The backend engineer hit this while implementing `csv-export-api`: the streaming
endpoint would support scheduling with little extra effort, and it was tempting
to add it. That is an `expands-scope` change under `scope-discipline` — a new
capability, not a refinement of approved scope — so it was routed here as a
committed proposal instead of being built.

`principal-product-manager` owns whether this becomes real work. Nothing is lost
and nothing was smuggled in.

## Acceptance

- [ ] Not defined; this item has not been accepted into a milestone.

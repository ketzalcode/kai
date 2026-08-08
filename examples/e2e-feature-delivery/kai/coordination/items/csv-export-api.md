---
type: work-item
id: csv-export-api
title: CSV export endpoint for saved reports
initiative: csv-export
milestone: m1-export-ga
delivery_class: product-change
state: shipped
resume_state: null
priority: 10
owner: principal-swe-backend
next_role: null
target: reporting-service
artifact_target: kai/initiatives/csv-export/artifacts/design-api.md
context_artifacts:
  - kai/initiatives/csv-export/artifacts/brief.md
  - kai/initiatives/csv-export/artifacts/decision.md
touches:
  - services/reporting/export/**
  - services/reporting/tests/export/**
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-code
  - role: principal-security
    kind: independent-security
completed_reviews:
  - role: principal-swe-architect
    kind: independent-code
    change_ref: 4f1c8ae
    evidence: kai/coordination/threads/csv-export-api.md
    verdict: approved
    timestamp: 2026-03-04-0920
  - role: principal-security
    kind: independent-security
    change_ref: 4f1c8ae
    evidence: kai/coordination/threads/csv-export-api.md
    verdict: approved
    timestamp: 2026-03-04-1130
change_ref: 4f1c8ae
version: 12
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-03-04-1610
---

## Outcome

A saved report can be exported as CSV through a streaming endpoint that holds
memory flat regardless of row count.

## Acceptance

- [x] `GET /reports/{id}/export.csv` streams rows without buffering the result set.
- [x] Row-level authorization matches the report's own read policy.
- [x] Export attempts are audit-logged with actor, report id, and row count.
- [x] A 1M-row export completes under the gateway timeout in staging.

## Evidence

- Design: `kai/initiatives/csv-export/artifacts/design-api.md`
- Implementation: commit `4f1c8ae`
- Tests: `services/reporting/tests/export/` — unit + integration, written by the
  implementing engineer, not by QA.
- Architecture review: approved at `4f1c8ae` (see thread).
- Security review: approved at `4f1c8ae`; row-level authorization and audit
  logging verified.
- Staging load check: 1M rows in 41s, memory flat at ~90MB.
- Ship record: `kai/initiatives/csv-export/artifacts/ship-log.md` — readiness
  verdict, deploy handoff, and production-verification result.
- Production deploy: performed by the operator on 2026-03-04 (kai never
  deploys); error rate and p99 latency unchanged over the following 24h.

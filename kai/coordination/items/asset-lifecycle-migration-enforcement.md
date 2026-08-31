---
type: work-item
id: asset-lifecycle-migration-enforcement
title: Reconcile legacy assets and enforce closure completeness
initiative: asset-lifecycle-contract
milestone: migration-complete
delivery_class: product-change
state: ready
resume_state: null
priority: 20
owner: null
next_role: principal-swe-infra
target: migrated and enforced lifecycle state
artifact_expectation: owed
artifact_class: migration-report
durability: durable
completion_authority: principal-product-manager
validity_owner: principal-product-manager
artifact_targets:
  - kai/initiatives/asset-lifecycle-contract/artifacts/research/migration-report.md
context_artifacts:
  - skills/kai-core-asset-lifecycle/SKILL.md
depends_on:
  - item: asset-lifecycle-doctor-warnings
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: architecture-contract
completed_reviews: []
change_ref: null
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-28-1551
---

## Outcome

Kai's own workspace is inventoried without guessing legacy assets current, and
new initiative closure is blocked by unresolved required asset, backlog, or
ownership gaps.

## Acceptance

- [ ] Existing relevant assets receive stable IDs, dispositions, validity
      states, and owners or explicit unknown ownership.
- [ ] Current-only surfaces contain no unknown, provisional, invalidated, or
      superseded assets.
- [ ] Initiative closure enforcement runs only after deterministic migration.
- [ ] The initiative closes with a director summary and complete deliverables.

## Evidence

- Filled as work progresses.

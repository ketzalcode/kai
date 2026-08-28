---
type: work-item
id: asset-lifecycle-doctor-warnings
title: Add asset lifecycle doctor warnings and the derived catalog
initiative: asset-lifecycle-contract
milestone: enforcement-observable
delivery_class: product-change
state: ready
resume_state: null
priority: 10
owner: null
next_role: principal-swe-infra
target: workspace asset observability
artifact_expectation: none
artifact_expectation_reason: The durable result is doctor and catalog behavior plus fixtures.
artifact_class: null
durability: null
completion_authority: null
validity_owner: null
artifact_targets: []
context_artifacts:
  - skills/kai-core-asset-lifecycle/SKILL.md
  - kai/initiatives/asset-lifecycle-contract/artifacts/decisions/asset-lifecycle-contract.md
touches:
  - scripts/workspace-doctor.mjs
  - scripts/lib/**
  - test/fixtures/**
  - skills/kai-core-workspace-onboarding/**
  - workspace scaffold files
  - release metadata
depends_on:
  - item: asset-lifecycle-contract-release
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

Workspace tooling deterministically lists asset lifecycle state and warns about
legacy unknowns, stale assets, missing owners, orphan relationships, and
incomplete supersession without blocking migration.

## Acceptance

- [ ] New declarations with contradictory states fail closed.
- [ ] Legacy missing metadata warns rather than blocks.
- [ ] Catalog generation is deterministic and excludes non-current assets from
      current-only views.
- [ ] Self-tests cover valid, legacy, stale, orphan, and supersession cases.

## Evidence

- Filled as work progresses.

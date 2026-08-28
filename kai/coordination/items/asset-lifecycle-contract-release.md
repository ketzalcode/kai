---
type: work-item
id: asset-lifecycle-contract-release
title: Ship the universal asset lifecycle contract
initiative: asset-lifecycle-contract
milestone: contract-bound
delivery_class: product-change
state: in-progress
resume_state: null
priority: 1
owner: principal-swe-infra
next_role: principal-swe-infra
target: universal generated-asset behavior
artifact_expectation: owed
artifact_class: architecture-decision
durability: durable
completion_authority: principal-product-manager
validity_owner: principal-product-manager
artifact_targets:
  - kai/initiatives/asset-lifecycle-contract/artifacts/decisions/asset-lifecycle-contract.md
context_artifacts:
  - kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md
touches:
  - agents/**
  - skills/kai-core-asset-lifecycle/**
  - skills/kai-core-team-operating-rules/**
  - skills/kai-core-work-coordination/**
  - skills/kai-core-workspace-conventions/**
  - skills/kai-core-initiative-stewardship/**
  - skills/kai-core-definition-of-done/**
  - scripts/validate-plugin.mjs
  - scripts/generate-catalog.mjs
  - docs/reference/agents-and-skills.md
  - packs/**
  - plugin.json
  - package.json
  - package-lock.json
  - .github/plugin/marketplace.json
  - README.md
  - CHANGELOG.md
  - kai/initiatives/asset-lifecycle-contract/**
  - kai/coordination/**
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: architecture-contract
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: principal-swe-infra
  token: lifecycle-2026-08-28-1551
  version_at_grant: 1
  acquired: 2026-08-28-1551
  expires: 2026-08-28-2359
updated: 2026-08-28-1551
---

## Outcome

Every shipped kai agent loads one universal asset-lifecycle contract, and the
existing coordination, workspace, stewardship, and production gates use its
separate execution, disposition, validity, and closure semantics.

## Acceptance

- [ ] The new skill defines the complete operator-approved lifecycle.
- [ ] All 56 root agents and their generated mirrors inherit it.
- [ ] Validation rejects an omitted lifecycle contract.
- [ ] Release metadata and generated documentation are current.
- [ ] The full repository suite passes.

## Evidence

- Filled as implementation, review, CI, merge, and release progress.

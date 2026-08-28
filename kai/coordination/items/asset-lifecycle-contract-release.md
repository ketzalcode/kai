---
type: work-item
id: asset-lifecycle-contract-release
title: Ship the universal asset lifecycle contract
initiative: asset-lifecycle-contract
milestone: contract-bound
delivery_class: product-change
state: in-review
resume_state: null
priority: 1
owner: principal-swe-infra
next_role: principal-swe-architect
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
change_ref: 91c8195b6c7afef1ea35772e0dab9937615a423b
version: 3
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-28-1632
---

## Outcome

Every shipped kai agent loads one universal asset-lifecycle contract, and the
existing coordination, workspace, stewardship, and production gates use its
separate execution, disposition, validity, and closure semantics.

## Acceptance

- [x] The new skill defines the complete operator-approved lifecycle.
- [x] All 56 root agents and their generated mirrors inherit it.
- [x] Validation rejects an omitted lifecycle contract.
- [x] Release metadata and generated documentation are current.
- [x] The full repository suite passes.

## Evidence

- Implementation revision:
  `91c8195b6c7afef1ea35772e0dab9937615a423b`.
- `npm test` passed after generated catalog, pack trees, and inventory were
  refreshed.
- Initial architecture review bounced on five schema-2 staging contradictions;
  all five were corrected before the implementation revision was committed.

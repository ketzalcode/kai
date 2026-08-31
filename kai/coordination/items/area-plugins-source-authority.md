---
type: work-item
id: area-plugins-source-authority
title: Make plugin-local agents and skills authoritative
initiative: area-plugins
milestone: surface-rename
delivery_class: product-change
state: in-progress
resume_state: null
priority: 2
owner: principal-swe-infra
next_role: principal-swe-architect
target: one authoritative source per agent and skill
artifact_expectation: none
artifact_expectation_reason: The durable result is the repository source tree, validation, and release record.
artifact_class: null
durability: null
completion_authority: null
validity_owner: null
artifact_targets: []
context_artifacts:
  - kai/initiatives/area-plugins/northstar.md
  - kai/initiatives/area-plugins/artifacts/decisions/area-plugins-migration-architecture.md
touches:
  - agents/**
  - skills/**
  - plugins/**
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - scripts/generate-catalog.mjs
  - scripts/host-contract.mjs
  - docs/reference/agents-and-skills.md
  - docs/reference/plugin-structure.md
  - README.md
  - CHANGELOG.md
  - AGENTS.md
  - plugin.json
  - package.json
  - package-lock.json
  - .github/plugin/marketplace.json
  - kai/initiatives/area-plugins/**
  - kai/coordination/**
depends_on:
  - area-plugins-surface-tree-rename
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: architecture-contract
completed_reviews: []
change_ref: null
version: 1
lease:
  holder: principal-swe-infra
  token: source-authority-20260831-0953
  version_at_grant: 1
  acquired: 2026-08-31-0953
  expires: 2026-08-31-1153
updated: 2026-08-31-0953
---

## Outcome

Every shipped agent and skill has exactly one authoritative file inside its
owning plugin. Root duplicate trees are absent, and derived generation never
replaces complete source bodies.

## Acceptance

- [x] Validators, catalog generation, host inventory, previews, and reference
  analysis read plugin-local sources.
- [x] Duplicate ids and files placed outside their planned plugin fail.
- [x] Root `agents/` and `skills/` are removed.
- [x] Department dependency guards are explicit managed regions; the rest of an
  agent body is source.
- [x] Generation writes only manifests, locks, routed assets, hooks, and managed
  regions.
- [ ] Exact-ref architecture review accepts the migration.
- [ ] PR-head and merged-main validation pass.

## Evidence

- Pending implementation commit and independent architecture review.

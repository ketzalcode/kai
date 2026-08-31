---
type: work-item
id: area-plugins-source-authority
title: Make plugin-local agents and skills authoritative
initiative: area-plugins
milestone: surface-rename
delivery_class: product-change
state: shipped
resume_state: null
priority: 2
owner: principal-swe-infra
next_role: null
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
completed_reviews:
  - role: principal-swe-architect
    kind: architecture-contract
    phase: implementation
    change_ref: c95a013
    verdict: approved
    evidence: kai/coordination/threads/area-plugins-source-authority.md (REVIEW 2026-08-31-1040)
    timestamp: 2026-08-31-1040
    satisfies_requirement: true
change_ref: c95a013
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-31-1049
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
- [x] Exact-ref architecture review accepts the migration.
- [x] PR-head and merged-main validation pass.

## Evidence

- Implementation revisions:
  - `dc5f50a` removes the duplicate root sources.
  - `3cd1339` repoints readers and narrows generation.
  - `386dc56` closes the managed HTML marker and addresses the first review.
  - `c95a013` makes the source-boundary self-tests read-only and reports unknown
    plugin files without deleting them.
- All 108 authored sources match the pre-migration bodies after removing only
  the managed dependency-guard region from department agents.
- `npm test` passed at the final implementation ref with 192 pack-preview
  checks, all four named gates, generator parity, and syntax validation.
- Exact-ref architecture review accepted `c95a013` with no blockers or
  important findings.
- PR #200 merged as `bb8bfa9ed42550b987807bf4ac1a3c22bc2a58cf`;
  exact-main validation passed and release `v2.1.0` was published.

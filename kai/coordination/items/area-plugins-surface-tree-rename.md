---
type: work-item
id: area-plugins-surface-tree-rename
title: Rename the committed product tree from packs to plugins
initiative: area-plugins
milestone: surface-rename
delivery_class: product-change
state: in-progress
resume_state: null
priority: 1
owner: principal-swe-infra
next_role: principal-swe-infra
target: committed plugin tree naming
artifact_expectation: none
artifact_expectation_reason: The durable result is the repository tree, validation, and release record.
artifact_class: null
durability: null
completion_authority: null
validity_owner: null
artifact_targets: []
context_artifacts:
  - kai/initiatives/area-plugins/northstar.md
  - kai/initiatives/area-plugins/artifacts/decisions/area-plugins-migration-architecture.md
touches:
  - plugins/**
  - packs/**
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - scripts/release-guard.mjs
  - .github/plugin/marketplace.json
  - .github/workflows/validate.yml
  - .gitattributes
  - docs/getting-started.md
  - docs/reference/plugin-structure.md
  - README.md
  - CHANGELOG.md
  - AGENTS.md
  - plugin.json
  - package.json
  - package-lock.json
  - kai/initiatives/area-plugins/**
  - kai/coordination/**
depends_on: []
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
  token: surface-tree-rename-2026-08-31-0914
  version_at_grant: 1
  acquired: 2026-08-31-0914
  expires: 2026-08-31-1714
updated: 2026-08-31-0914
---

## Outcome

The committed installable product trees live under `plugins/`, with no
remaining live tooling, CI, marketplace, development, or release path pointing
at `packs/`.

## Acceptance

- [ ] All committed plugin-tree files move without content loss.
- [ ] `PACKS_DIR` is the single path authority and resolves to `plugins`.
- [ ] Marketplace sources and CI runtime paths use `plugins/`.
- [ ] Direct-development and contributor documentation use `plugins/`.
- [ ] Generated-tree drift checks and the full repository suite pass.

## Evidence

- Filled after implementation and exact-ref review.

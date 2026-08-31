---
type: work-item
id: area-plugins-surface-tree-rename
title: Rename the committed product tree from packs to plugins
initiative: area-plugins
milestone: surface-rename
delivery_class: product-change
state: shipped
resume_state: null
priority: 1
owner: principal-swe-infra
next_role: null
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
completed_reviews:
  - role: principal-swe-architect
    kind: architecture-contract
    phase: implementation
    change_ref: 178e4bba94b860ab179edda03259162bcce8e407
    verdict: approved
    evidence: kai/coordination/threads/area-plugins-surface-tree-rename.md (REVIEW 2026-08-31-0927)
    timestamp: 2026-08-31-0927
    satisfies_requirement: true
change_ref: 178e4bba94b860ab179edda03259162bcce8e407
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-31-0953
---

## Outcome

The committed installable product trees live under `plugins/`, with no
remaining live tooling, CI, marketplace, development, or release path pointing
at `packs/`.

## Acceptance

- [x] All committed plugin-tree files move without content loss.
- [x] `PACKS_DIR` is the single path authority and resolves to `plugins`.
- [x] Marketplace sources and CI runtime paths use `plugins/`.
- [x] Direct-development and contributor documentation use `plugins/`.
- [x] Generated-tree drift checks and the full repository suite pass.

## Evidence

- Implementation revision:
  `178e4bba94b860ab179edda03259162bcce8e407`.
- The base and head trees each contain 140 plugin files with a one-to-one path
  mapping; all 108 agent and skill blobs are byte-identical.
- `npm test` passed at `2.0.0`, including 183 pack-preview checks, all four
  named gates, and `plugins/` generator parity.
- Exact-ref architecture review accepted the path, content, marketplace, CI,
  release, and documentation changes with no blockers.
- PR #199 merged as `c99acec205daaad2ee2bffc7c29244ffde1b0804`; exact-main
  validation passed and release `v2.0.0` was published.

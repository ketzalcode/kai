---
type: work-item
id: pack-split-onboarding-installer
title: Honest guided onboarding installer — core first, verify each step, no unverified rollback
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split onboarding guided installer
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - skills/kai-core-workspace-onboarding/SKILL.md
touches:
  - skills/kai-core-workspace-onboarding/SKILL.md
  - agents/workflow-workspace-init.agent.md
depends_on:
  - item: pack-split-generated-pack-trees
    requires: shipped
  - item: pack-split-migration-doctor
    requires: shipped
  - item: pack-split-pack-dependency-manifests
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
  - role: principal-technical-writer
    kind: doc-review
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-26-1558
---

## Outcome

Onboarding is an honest guided installer: it shows the exact pack set and commands, gets explicit
confirmation, installs core first, verifies after every step, stops on first failure, reports partial
state precisely, never claims unverified rollback, and tells the user a freshly installed core is not
active until a new session starts.

## Acceptance

- [ ] The installer prose installs core first and verifies after each step, stopping on first failure.
- [ ] It never claims rollback it did not verify; partial state is reported precisely.
- [ ] The fresh-session caveat is stated where the user will hit it.
- [ ] `node scripts/validate-plugin.mjs` passes (onboarding still references the canonical style block);
      `npm test` passes.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- A skill is a prompt document — it cannot render a checked multi-select or an atomic transaction, so
  the installer is described honestly as guided, not transactional.
- Install-order/verify-gate semantics owned by `principal-swe-infra`; prose co-authored by
  `principal-technical-writer` (off critical path). Doc-review guards the honesty of the prose.
- **Steward DAG reconciliation 2026-08-26-1558:** onboarding now requires
  `pack-split-pack-dependency-manifests` at `shipped`; an installer cannot state
  truthful commands or verification semantics before the pack runtime contract
  is settled. It therefore follows host gates and dependency manifests rather
  than running in parallel with the host gate.

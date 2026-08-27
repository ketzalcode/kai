---
type: work-item
id: pack-split-onboarding-installer
title: Honest guided onboarding installer — core first, verify each step, no unverified rollback
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: product-change
state: release-ready
resume_state: null
priority: 20
owner: principal-swe-infra
next_role: "@operator"
target: pack-split onboarding guided installer
artifact_target: null
context_artifacts:
  - kai/library/releases/2026-08-27/02-ship-pack-split-onboarding-installer/ship-record.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - skills/kai-core-workspace-onboarding/SKILL.md
touches:
  - skills/kai-core-workspace-onboarding/SKILL.md
  - agents/workflow-workspace-init.agent.md
  - scripts/validate-plugin.mjs
  - docs/reference/agents-and-skills.md
  - packs/
  - plugin.json
  - package.json
  - package-lock.json
  - .github/plugin/marketplace.json
  - README.md
  - CHANGELOG.md
  - kai/coordination/
  - kai/initiatives/pack-split/
  - kai/library/releases/2026-08-27/02-ship-pack-split-onboarding-installer/
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
completed_reviews:
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: 82e98bcfe595e6d885843e90aa8a704d4478bb45
    verdict: ratified
    evidence: "kai/coordination/threads/pack-split-onboarding-installer.md"
    timestamp: 2026-08-27-1255
  - role: principal-technical-writer
    kind: doc-review
    change_ref: 82e98bcfe595e6d885843e90aa8a704d4478bb45
    verdict: approved
    evidence: "kai/coordination/threads/pack-split-onboarding-installer.md"
    timestamp: 2026-08-27-1255
change_ref: 82e98bcfe595e6d885843e90aa8a704d4478bb45
version: 14
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1257
---

## Outcome

Onboarding is an honest guided installer: it shows the exact pack set and commands, gets explicit
confirmation, installs core first, verifies after every step, stops on first failure, reports partial
state precisely, never claims unverified rollback, and tells the user a freshly installed core is not
active until a new session starts.

## Acceptance

- [x] The installer prose installs core first and verifies after each step, stopping on first failure.
- [x] It never claims rollback it did not verify; partial state is reported precisely.
- [x] The fresh-session caveat is stated where the user will hit it.
- [x] `node scripts/validate-plugin.mjs` passes (onboarding still references the canonical style block);
      `npm test` passes.
- [x] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- `skills/kai-core-workspace-onboarding/SKILL.md` carries the closed five-pack
  catalog, exact marketplace and install commands, read-only migration gate,
  explicit confirmation, core-first order, per-step checks, final migration
  check, and complete/partial/blocked/unknown result shape.
- The availability gate browses `kai-plugins` before the first install and
  refuses direct repository or subdirectory fallback. With packs still
  unpublished, the guided path stops before mutating plugin state.
- `agents/workflow-workspace-init.agent.md` selects pack-installation,
  workspace-initialization, or combined mode and inherits the detailed
  procedure rather than duplicating it.
- `scripts/validate-plugin.mjs` pins the five exact install commands in
  canonical order plus the availability, confirmation, no-rollback, failure,
  and fresh-session contracts.
- Full `npm test` passed at `0.66.0`, including contract validation, generated
  catalog parity, migration-doctor fixtures, 163 pack self-tests, all pack
  gates, generated-tree parity, and syntax checks.
- The first full run stopped only because the host-visible agent description
  made `docs/reference/agents-and-skills.md` stale. `npm run docs:generate`
  refreshed it and the complete rerun passed; no behavioral check failed.
- Root, marketplace, core, and personal release metadata is lockstep
  `0.66.0`; CHANGELOG and README are current. Marketplace remains the single
  monolith entry and generated packs remain unpublished.

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

---
type: work-item
id: pack-split-first-department
title: Prove kai-core + personal installs and operates over the plugin boundary
initiative: pack-split
milestone: first-pack-extracted
delivery_class: product-change
state: in-review
resume_state: null
priority: 10
owner: principal-swe-infra
next_role: workflow-ship
target: pack-split first-department install proof
artifact_target: kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
touches:
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md
depends_on:
  - item: pack-split-generated-pack-trees
    requires: shipped
  - item: pack-split-migration-doctor
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews:
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: 3b14dc6cfb693a7925c48a8c3d4446dda041c03f
    verdict: ratified
    evidence: "kai/coordination/threads/pack-split-first-department.md"
    timestamp: 2026-08-26-1516
change_ref: 3b14dc6cfb693a7925c48a8c3d4446dda041c03f
version: 9
lease: null
updated: 2026-08-26-1516
---

## Outcome

A verified proof that a project can install `kai-core` + `kai-personal` from the committed-unpublished
trees and its agents operate with the full contract resolved across the plugin boundary, with the
migration doctor enforcing uninstall-first — no public marketplace publish.

## Acceptance

- [x] A real install of core + personal (via staging source / `--plugin-dir`) is performed and a
      personal agent binds `kai-core-*` skills across the plugin boundary and passes its preflight.
- [x] The migration doctor's uninstall-first / coexistence-refusal is exercised on the real install.
- [x] Per-session discovery-metadata cost for core+personal is captured against the whole-roster baseline.
- [x] Evidence recorded at the artifact target.

## Evidence

- Completed reliability record:
  `kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md`.
- Raw operator evidence:
  `.kai/runs/eng/2026-08-26/01-infra-pack-split-first-department/evidence/`.
- Successful command packet:
  `.kai/runs/eng/2026-08-26/01-infra-pack-split-first-department/probe.ps1`.
- Fresh direct proof: `kai-personal:persona-self` invoked `kai-core-contract-v1`
  and inherited core skills from the `kai-core` provider, then returned
  `KAI_CORE_READY`, `contract: 1`, and `DIRECT_OK`.
- Doctor proof: staged coexistence returned `blocked` with `coexistence` and
  `legacy-installed`; staged clean returned `clear` / `no-workspace`; both
  staged inventories were unchanged.
- Discovery metadata: focused core+personal `8,093` characters / estimated
  `2,023.25` tokens versus monolith `20,063` / `5,015.75`, a `59.66%`
  character reduction.
- Marketplace remained one `kai` entry at `source: "."`; no pack was
  published and no global plugin registry was mutated.
- Evidence commit: `3b14dc6cfb693a7925c48a8c3d4446dda041c03f` on dedicated branch
  `docs/29-first-department-proof`, subject
  `docs(pack-split): record first department proof`.
- `node scripts/workspace-doctor.mjs --root C:\src\kai` passed exactly:
  `✓ workspace healthy — claimable (.)`.
- `git diff --check` passed. The evidence commit changes coordination,
  initiative, and reliability documentation only; it changes no agents,
  skills, scripts, manifests, packs, marketplace or release metadata, or
  production code.
- Independent architecture review ratified the proof at exact `change_ref`
  `3b14dc6cfb693a7925c48a8c3d4446dda041c03f`; the detailed REVIEW packet is
  in `kai/coordination/threads/pack-split-first-department.md`.

## Notes

- **Steward-confirmed 2026-08-26 (decomposition Open Question 3 closed):** "Shipped" here =
  all necessary enabling changes human-deployed in a published `0.x` release **and** operator
  install evidence against the committed-unpublished trees. No marketplace pack publication is
  permitted; the public flip remains exclusively `pack-split-release-12b`.
- The real install is **operator-executed**; this role assembles the proof and records evidence.

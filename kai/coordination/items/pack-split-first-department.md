---
type: work-item
id: pack-split-first-department
title: Prove kai-core + personal installs and operates over the plugin boundary
initiative: pack-split
milestone: first-pack-extracted
delivery_class: product-change
state: shipped
resume_state: null
priority: 10
owner: principal-swe-infra
next_role: null
target: pack-split first-department install proof
artifact_target: kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - kai/library/releases/2026-08-26/03-ship-pack-split-first-department/ship-record.md
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
version: 19
lease: null
updated: 2026-08-26-1550
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
- Six-dimension DoD gate passed 6/6 Clear at PREPARE; canonical record:
  `kai/library/releases/2026-08-26/03-ship-pack-split-first-department/ship-record.md`.
- Replacement PR #171 head `f9cf53fb705a6e262f2bac68b3aa5bd9a8bf558f`
  passed required check `contract` in run `33020537365`, job `98349568383`,
  then the operator merge-committed it at `2026-08-26T22:49:09Z` as
  `9a800e4e76cd6c15b9dfab01a7b1ed99c4285080`.
- Main validation run `33020918358`, job `98350796630`, completed `success`
  at the exact merge SHA (`2026-08-26T22:49:14Z` to
  `2026-08-26T22:49:28Z`).
- Production verification passed: reviewed `3b14dc6…` is an ancestor; the
  reliability artifact has identical blob `9a9390c15a72e235094f7f4ab4483659103c499e`
  at the review and merge refs; the item and canonical ship record are present
  on the merge; all forbidden top-level trees/blobs match source
  `342cd8eb9bacb7bfc8ccd3679f3f09667f1bd246`; marketplace remains exactly one
  `kai` entry at `source: "."`; and the `kai-core`/`kai-personal` pack trees are
  unchanged and unpublished.
- `workflow-ship` deliberately restored `blocked (resume: release-ready)` to
  `release-ready` at v16, then recorded `deploying` v17,
  `production-verification` v18, and `shipped` v19. The reviewed
  `change_ref` remains unchanged.

## Notes

- **Steward-confirmed 2026-08-26 (decomposition Open Question 3 closed):** "Shipped" here =
  all necessary enabling changes human-deployed in a published `0.x` release **and** operator
  install evidence against the committed-unpublished trees. No marketplace pack publication is
  permitted; the public flip remains exclusively `pack-split-release-12b`.
- The real install is **operator-executed**; this role assembles the proof and records evidence.
- **Resolved deployment blocker 2026-08-26:** GitHub Actions emitted required
  `contract` success for PR #171. The operator merged with ancestry preservation;
  `main` CI and the proportional production checks passed. PRs #169 and #170
  remain closed historical attempts.
- This evidence/coordination deployment created no version, tag, GitHub release,
  marketplace change, or pack publication. The enabling release remains
  `v0.64.0`.

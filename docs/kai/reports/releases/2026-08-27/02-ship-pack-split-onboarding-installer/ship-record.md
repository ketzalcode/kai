---
# <!-- kai:allow-legacy-roots -->
type: releases
title: Ship record - guided split-pack installer
slug: pack-split-onboarding-installer-ship-record
created: 2026-08-27
source: workflow-ship
target: honest guided split-pack installer
initiative: pack-split
milestone: five-pack-split-shipped
source_artifact: kai/coordination/items/pack-split-onboarding-installer.md
current_path: docs/kai/reports/releases/2026-08-27/02-ship-pack-split-onboarding-installer/ship-record.md
canonical_path: docs/kai/reports/releases/2026-08-27/02-ship-pack-split-onboarding-installer/ship-record.md
status: shipped - production verification 7/7 PASS; rollback not invoked
shipped: 2026-08-27T20:00:05Z - PR 177 merge 3be962442c6251e35a6524e3952fb3313513e257
related:
  - kai/coordination/threads/pack-split-onboarding-installer.md
  - docs/proposals/pack-architecture.md
evidence:
  - "reviewed implementation 82e98bcfe595e6d885843e90aa8a704d4478bb45"
  - "https://github.com/RubenSaucedo/kai/pull/177"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33110876495"
  - "PR head 1f4a23c772d0c5bc067e616c411d51b769208d30"
  - "merge 3be962442c6251e35a6524e3952fb3313513e257"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33111113566"
  - "https://github.com/RubenSaucedo/kai/releases/tag/v0.66.0"
---

# Ship Record - Guided Split-Pack Installer

**Work item:** `pack-split-onboarding-installer`
**Date:** PREPARE 2026-08-27 12:57 -07:00; CONFIRM 2026-08-27 13:04 -07:00
**Run:** `workflow-ship`

**What shipped:** `workflow-workspace-init` can guide an explicitly requested
pack migration without pretending a prompt is a multi-select or transaction.
It proves replacement availability, confirms the exact plan, preserves
core-first order, verifies each step, and reports failure state precisely.

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | All five item criteria are complete. The diff changes the canonical onboarding skill, its workflow carrier, a shared static contract gate, generated copies, catalog, and `0.66.0` release metadata. It does not publish packs or change marketplace topology. Publication-only host proof is routed as a proposal rather than pulled into this prompt slice. |
| 2 | verified | **Clear** | Full `npm test` passed at `0.66.0`, including workspace-doctor fixtures, 163 pack self-tests, all partition gates, generated-tree parity, and syntax checks. PR run `33110876495` passed `contract` plus both runtime-dependency jobs. Generated skill and agent copies match core. No user-facing UI changed, so the design sub-gate does not trigger. |
| 3 | reviewed | **Clear** | `principal-swe-architect` ratified and `principal-technical-writer` approved exact ref `82e98bcfe595e6d885843e90aa8a704d4478bb45`, both with P0/P1 = 0. Every later path is coordination or initiative record only. |
| 4 | shippable-safely | **Clear** | This is a prompt and validation change in the still-monolithic plugin. Packs remain unavailable, so the browse gate stops before plugin mutation. Rollback is a PR revert plus `0.66.1`; no data or published pack state exists. Signals are main CI, validator, generated parity, marketplace N=1, and release metadata. Owner: `principal-swe-infra`. |
| 5 | documented | **Clear** | The skill is the executable contract; the workflow description and generated catalog expose it; README and CHANGELOG describe current unavailable-pack behavior. This ship record plus initiative log/deliverables preserve the release decision. |
| 6 | coordination-closed | **Clear** | Item, board, active pointer, thread, acceptance, dependencies, and reviews agree. No questions are open. The publication-only browse/live-command residual is a named `PROPOSAL` in the initiative backlog with release 12b/12c owners and triggers. |

**Readiness verdict: RELEASE-READY.** Six of six dimensions are Clear.
**Completion verdict: SHIPPED.** Deployment completed successfully and
production verification passed 7 of 7 checks; rollback was not invoked.

## Rollout and monitoring

No canary or feature flag is needed. The change ships inside the `kai` monolith
and its committed-unpublished core projection. Before pack publication, the
guided installer can inspect and explain migration state, but a requested pack
missing from `kai-plugins` stops the run before any plugin install.

Healthy signals:

- PR and main `validate / contract` succeed.
- `node scripts/validate-plugin.mjs` preserves command order, confirmation,
  recovery, outcome, and session boundaries.
- `node scripts/pack-preview.mjs --check` reports no drift.
- Root, core, and personal versions remain lockstep `0.66.0`.
- Marketplace remains exactly one `kai` entry at source `.`.

Rollback triggers:

- main CI fails at the merge commit;
- generated core diverges from the canonical prompt;
- marketplace gains a pack entry in this release;
- validator no longer enforces the reviewed installer contract.

## Rollback

Revert PR #177, bump to `0.66.1`, update CHANGELOG and README, regenerate packs
and the catalog, and publish the patch release. The rollback removes the guided
installer behavior only. It does not touch workspaces, host plugin state, the
Lectoria artifact, or any published pack because this release publishes none.

## Deploy handoff

The operator has already authorized Kai to merge this PR autonomously:

1. Require PR #177 checks green and prove reviewed
   `82e98bcfe595e6d885843e90aa8a704d4478bb45` is in the PR ancestry.
2. Confirm every later path is under `kai/coordination/`,
   `kai/initiatives/pack-split/`, or this ship record.
3. Merge without squashing or rebasing away reviewed ancestry.
4. Wait for main validation at the exact merge commit.
5. Publish GitHub release `v0.66.0` from the matching CHANGELOG section,
   targeting the merge commit.
6. Verify version coherence, marketplace N=1, packs unpublished, generated
   parity, exact installer text/pins, and all main jobs.

Release 12b remains NO-GO.

## Production verification contract

Return:

1. PR head, merge commit, and merge timestamp.
2. Main run URL/id, exact head SHA, and all job conclusions.
3. Release URL, tag target, draft/prerelease state, and publish timestamp.
4. Version coherence across root, marketplace, core, personal, README, and
   CHANGELOG.
5. Marketplace count/source and proof no pack entry exists.
6. `pack-preview --check` plus the guided-installer static contract result.
7. Reviewed ancestry and confirmation that later commits changed records only.

## Production verification outcome

The operator supplied these production facts; `workflow-ship` recorded them
without repeating any deploy or release action.

| # | Check | Result |
|---|-------|--------|
| 1 | reviewed ancestry | Reviewed ref `82e98bcfe595e6d885843e90aa8a704d4478bb45` is an ancestor of PR head `1f4a23c772d0c5bc067e616c411d51b769208d30`; later PR changes touch only coordination, initiative, and ship-record paths. **PASS** |
| 2 | deployment start | PR #177 merged without squash or rebase at `2026-08-27T19:59:23Z` as `3be962442c6251e35a6524e3952fb3313513e257`. **PASS** |
| 3 | deployment completion | Exact-main validate run `33111113566` succeeded at the merge; `contract`, `runtime-dependencies (kai-core)`, and `runtime-dependencies (kai-personal)` all succeeded. **PASS** |
| 4 | release | Public `v0.66.0` release is non-draft, non-prerelease, targets the exact merge, and was published `2026-08-27T20:00:05Z`. **PASS** |
| 5 | version coherence | Root package/plugin, marketplace metadata and monolith entry, core, and personal are all `0.66.0`; README and CHANGELOG name `0.66.0`. **PASS** |
| 6 | publication topology | Marketplace contains exactly one plugin, `kai` at source `.`; no pack entry is published. Packs remain unpublished and the marketplace remains monolith-only. **PASS** |
| 7 | generated and static contracts | `node scripts/pack-preview.mjs --check` passes; `node scripts/validate-plugin.mjs` passes with 56 agents and 51 skills. **PASS** |

**Rollback was not invoked.** Release 12b remains **NO-GO**; no pack was
published and the marketplace remains monolith-only.

<!-- /kai:allow-legacy-roots -->

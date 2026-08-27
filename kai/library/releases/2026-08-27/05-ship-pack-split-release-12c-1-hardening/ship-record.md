---
type: releases
title: Ship record - release 12c-1 hardening on 1.0.1
slug: pack-split-release-12c-1-hardening-ship-record
created: 2026-08-27
source: workflow-ship
target: pack-split pre-publish hardening release (1.0.1; no marketplace surface change)
initiative: pack-split
source_artifact: kai/coordination/items/pack-split-release-12c-1-hardening.md
related:
  - kai/coordination/threads/pack-split-release-12c-1-hardening.md
  - kai/initiatives/pack-split/northstar.md
  - docs/reference/plugin-structure.md
evidence:
  - "reviewed implementation 5edd2a42188aba5359379b4104fafdfcada7bafc"
  - "final PR head 055c5d583491446993598ceb2f8f358dea6fb9ec"
  - "https://github.com/RubenSaucedo/kai/pull/184"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33126804646"
  - "merge commit 815680bbd28faa3aa093b28c741673bb5f3b5207 at 2026-08-27T23:36:39Z"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33126882590"
  - "https://github.com/RubenSaucedo/kai/releases/tag/v1.0.1"
---

# Ship Record - Release 12c-1 Hardening on 1.0.1

**Work item:** `pack-split-release-12c-1-hardening` · **Initiative:** `pack-split`  
**Target:** hardening-only `v1.0.1` · **Date:** 2026-08-27 16:40 -07:00  
**Run:** `workflow-ship` (retrospective PREPARE + CONFIRM-START + CONFIRM-COMPLETE)  
**What shipped (one line):** `v1.0.1` hardens marketplace derivation, emergency
rollback provenance, malformed host-state handling, and the derived CI matrix;
the public marketplace remains exactly `kai-core` + `kai-personal`.  
**Change:** [PR #184](https://github.com/RubenSaucedo/kai/pull/184) · reviewed
implementation `5edd2a42188aba5359379b4104fafdfcada7bafc` · final PR head
`055c5d583491446993598ceb2f8f358dea6fb9ec` · merge
`815680bbd28faa3aa093b28c741673bb5f3b5207`

> The authorized parent/operator performed every external action: merge,
> default-branch publication, marketplace registration/install probe, tag, and
> GitHub release. `workflow-ship` only verified evidence read-only and wrote
> these closure records.

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | The item is required by active milestone `five-pack-split-shipped`. PR #184 implements R1-R5 + H4 within the declared touch set. GitHub compare `5edd2a4…055c5d5` reports the reviewed ref as merge base and only two later `kai/coordination/` record files; the operator's excluded-`kai/` diff was empty. The merge marketplace has exactly core + personal and no department entry. |
| 2 | verified | **Clear** | Before review: generator wrote 70 files, full `npm test` passed, migration matrix 33 scenarios, pack self-test 178 checks, and exact release guard passed. Fresh final-head run [`33126804646`](https://github.com/RubenSaucedo/kai/actions/runs/33126804646) succeeded at `055c5d5…` in `contract`, `runtime-dependencies (kai-core)`, and `runtime-dependencies (kai-personal)`. No user-facing UI changed, so UI QA/design sign-off is not triggered. |
| 3 | reviewed | **Clear** | `principal-sre` (`independent-reliability`) and `principal-security` (`independent-security`) both approved exact implementation `5edd2a4…`, P0/P1/P2 `0/0/0`; item `completed_reviews` and the thread retain both. The records-only descendant proof binds those approvals to the merge candidate without moving `change_ref`. |
| 4 | shippable-safely | **Clear** | Rollout-operability holds: hardening-only big-bang publication is proportional because no pack/topology was added; exact-head and exact-main CI, then an isolated live default-branch browse/install/doctor probe, were the staged gates. Signals and owners are named below. No data/schema migration occurred. Rollback limits and a forward-fix path are explicit. |
| 5 | documented | **Clear** | `CHANGELOG.md`, `README.md`, and `docs/reference/plugin-structure.md` carry `1.0.1`, hardening scope, rollback behavior, and exact-head release stops. This durable release record and `kai/initiatives/pack-split/log.md` close the release history. |
| 6 | coordination-closed | **Clear** | No blocking questions; `pack-split-release-12b` is already `shipped`; the item/thread record deployment start, completion, production checks, and steward handoff. `BOARD.md`/`ACTIVE.md` are intentionally left for steward regeneration. |

**Readiness verdict: RELEASE-READY.** Six of six dimensions were Clear before
the operator merge.  
**Completion verdict: SHIPPED.** Deployment and proportional production
verification are evidenced below.

## Rollout plan and result

This was a hardening-only default-branch publication, not a new marketplace
surface. A percentage canary is unavailable for the repository-backed
marketplace, so the proportional sequence was:

1. exact reviewed implementation with independent reliability/security approval;
2. records-only final head with fresh three-job PR CI;
3. operator merge to production/default branch `main`;
4. exact-merge three-job CI;
5. isolated no-ref marketplace browse/install/doctor probe;
6. annotated `v1.0.1` tag and public GitHub release.

**Blast radius:** future browse/install/update and rollback-doctor behavior.
Existing installs were not force-mutated.  
**Healthy signals:** all three required checks at final head and exact main;
marketplace names exactly core + personal; both installs at `1.0.1`; installed
doctor `status: clear`, no remediation steps, both plugins installed/enabled,
and only `marketplace:kai-plugins` provenance.  
**Owners:** `principal-swe-infra` for correction; the authorized operator for
all external merge/tag/release/marketplace actions.

## Rollback plan

1. Freeze `12c-2` and later department publication if any `1.0.1` signal
   regresses.
2. Prefer a reviewed forward patch (`1.0.2`) from current `main`; rerun the
   full tests, exact release guard, independent reviews as triggered, final-head
   CI, exact-main CI, and the isolated marketplace probe.
3. If the live default-branch marketplace is actively broken before that patch,
   the operator may revert merge `815680b…` through a protected reviewed PR,
   require exact-main CI at the revert, verify the marketplace still serves
   exactly core + personal, then issue the corrective forward patch.
4. Do not delete or retarget public tag/release `v1.0.1`. Existing cached
   installs are not undone by a repository revert.

**Limits:** reverting the merge also removes the new safety hardening and rolls
repository version metadata backward, so it is an emergency containment step,
not the preferred steady state. No user data or schema changed; there is no
down-migration or data repair.

## Deploy handoff (historical - the human ran it)

1. The parent/operator confirmed reviewed-ref ancestry and an empty
   `git diff --exit-code 5edd2a4…055c5d5 -- . ':(exclude)kai/'`.
2. The parent/operator waited for fresh final-head run `33126804646`: all three
   required jobs succeeded at `055c5d5…`.
3. The parent/operator merged PR #184 using a merge commit. GitHub records
   `815680bbd28faa3aa093b28c741673bb5f3b5207` at
   `2026-08-27T23:36:39Z`.
4. The parent/operator waited for exact-main run `33126882590`, ran the live
   isolated marketplace probe, created annotated tag `v1.0.1`, and published
   the non-draft, non-prerelease release.

**Abort criteria were:** any implementation movement after review; any required
job not successful at final head or exact main; marketplace topology other than
exactly core + personal; version/provenance/enabled-state disagreement; or a
non-clear migration-doctor result. None tripped.

## Deployment confirmation

| Phase | Evidence | Result |
|-------|----------|--------|
| CONFIRM-START | PR #184 merged to production/default branch `main` as `815680b…` at `2026-08-27T23:36:39Z`; exact-main run `33126882590` started at `2026-08-27T23:36:42Z`. | **DEPLOYING confirmed** |
| CONFIRM-COMPLETE | Run [`33126882590`](https://github.com/RubenSaucedo/kai/actions/runs/33126882590) completed `success` at `2026-08-27T23:37:27Z`; its three jobs all concluded `success` at exact merge SHA. | **PRODUCTION-VERIFICATION entered** |

## Production verification

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | Exact-main CI | **Pass** | Run `33126882590`, head `815680b…`, conclusion `success`; `contract`, `runtime-dependencies (kai-core)`, and `runtime-dependencies (kai-personal)` all successful. |
| 2 | Published topology/version | **Pass** | Marketplace at merge SHA has `installSurface: packs`, metadata `1.0.1`, and exactly `kai-core` + `kai-personal` at `1.0.1`; no department or monolith entry. |
| 3 | Live isolated browse/install | **Pass** | Operator's new no-ref `COPILOT_HOME` browsed exactly core + personal; both installed successfully. Local read-only cross-check found exactly those two cache directories and both installed manifests at `1.0.1`. Raw probe state remains intentionally uncommitted. |
| 4 | Installed-core doctor | **Pass** | Operator-provided result: `status: clear`, `root: null`, no steps; core and personal each `presence: installed`, `enabled: true`, with only `marketplace:kai-plugins` provenance. |
| 5 | Tag/release integrity | **Pass** | GitHub tag object peels to `815680b…`; [release `v1.0.1`](https://github.com/RubenSaucedo/kai/releases/tag/v1.0.1) is public, non-draft, non-prerelease, targets the merge, and was published `2026-08-27T23:39:33Z`. |

## Verification limits

- This role had no shell and did not rerun Git commands or the installed
  doctor. The excluded-path diff and doctor output are operator evidence.
- GitHub API independently corroborated PR merge/head, reviewed-ref ancestry,
  records-only changed files after review, both workflow runs and job
  conclusions, marketplace contents at the merge, and tag/release target.
- Local reads independently corroborated the checked-out closure branch points
  at the merge and that the isolated cache contains exactly core + personal at
  `1.0.1`. No probe-home path or raw host state is committed.

## Follow-ups / parked

- Direct-install bare-name settings override-key measurement remains parked,
  non-blocking, in `kai/initiatives/pack-split/backlog.md`.
- `pack-split-release-12c-2-product` remains unpromoted. The
  `principal-product-manager` owns steward reconciliation, derived index
  refresh, and any next promotion after this closure.
- No department pack shipped in `1.0.1`; that hardening-only limit is retained
  in the changelog, release, item, and this record.

---
type: releases
title: Ship record - release 12c-2 product pack on 1.0.2
slug: pack-split-release-12c-2-product-ship-record
created: 2026-08-27
source: workflow-ship
target: pack-split staged department publish - kai-product 1.0.2
initiative: pack-split
source_artifact: kai/coordination/items/pack-split-release-12c-2-product.md
related:
  - kai/coordination/threads/pack-split-release-12c-2-product.md
  - kai/initiatives/pack-split/northstar.md
  - docs/reference/plugin-structure.md
evidence:
  - "reviewed implementation 31373efe880aa2676eb379920a1c599efd43ada4"
  - "final PR head 999147e4a67414ff4182c26a47eebe495d415903"
  - "https://github.com/RubenSaucedo/kai/pull/186"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33128391926"
  - "merge commit 1dd6f019df8a4ca8023df18a6bf32b8a7d1759e2 at 2026-08-28T00:03:44Z"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33128452012"
  - "https://github.com/RubenSaucedo/kai/releases/tag/v1.0.2"
---

# Ship Record - Release 12c-2 Product Pack on 1.0.2

**Work item:** `pack-split-release-12c-2-product` · **Initiative:** `pack-split`  
**Target:** first three-pack marketplace publication, `v1.0.2` ·
**Date:** 2026-08-27 17:05 -07:00  
**Run:** `workflow-ship` (retrospective PREPARE + CONFIRM-START +
CONFIRM-COMPLETE)  
**What shipped (one line):** `kai-product` joined `kai-core` and `kai-personal`
as the third marketplace pack at `1.0.2`, restoring 9 agents and 3 skills with
no runtime dependency.  
**Change:** [PR #186](https://github.com/RubenSaucedo/kai/pull/186) · reviewed
implementation `31373efe880aa2676eb379920a1c599efd43ada4` · final PR head
`999147e4a67414ff4182c26a47eebe495d415903` · merge
`1dd6f019df8a4ca8023df18a6bf32b8a7d1759e2`

> The operator performed every external action: merge, default-branch
> publication, marketplace probe, tag, and GitHub release. `workflow-ship`
> verified the supplied evidence and wrote only closure records.

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | The active `five-pack-split-shipped` milestone requires this item. PR #186 generated and published only the approved product slice. GitHub compare reports reviewed ref `31373ef…` as merge base of `1dd6f01…`; the only later files are this item's two `kai/coordination/` records, proving non-`kai/` equivalence. |
| 2 | verified | **Clear** | The item records full `npm test`, 180 pack self-tests, 33 migration scenarios, generated parity, and release guard success. Fresh final-head run [`33128391926`](https://github.com/RubenSaucedo/kai/actions/runs/33128391926) and exact-main run [`33128452012`](https://github.com/RubenSaucedo/kai/actions/runs/33128452012) each passed `contract` plus runtime jobs for core, personal, and product. Product's empty dependency leg passed. This packaging/docs change has no user-facing UI, so UI QA/design sign-off is not triggered. |
| 3 | reviewed | **Clear** | `principal-sre` (`independent-reliability`) and `principal-swe-architect` (`independent-architecture`) approved exact implementation `31373ef…` with no P0/P1 findings; the item and thread retain both revision-bound verdicts. |
| 4 | shippable-safely | **Clear** | Rollout-operability holds: the repository-backed marketplace has no percentage canary, so rollout was staged through reviewed ref, records-only final head, fresh four-job PR CI, operator merge, exact-main CI, then a new isolated no-ref marketplace browse/install/update/doctor probe. No data or schema migration occurred. Abort, rollback, signals, limits, and owners are explicit below. |
| 5 | documented | **Clear** | `CHANGELOG.md`, `README.md`, `docs/getting-started.md`, and the item evidence describe the published three-pack surface and `1.0.2`. This durable release record and `kai/initiatives/pack-split/log.md` stamp the production result. |
| 6 | coordination-closed | **Clear** | The dependency on `12c-1` is shipped, questions are empty, the item/thread record deployment and production verification, and the product item hands back to the steward without silently promoting engineering. |

**Readiness verdict: RELEASE-READY.** All six dimensions were Clear before the
operator merge.  
**Completion verdict: SHIPPED.** Deployment and proportional production
verification are evidenced below.

## Rollout plan and result

A percentage canary is unavailable for the default-branch-backed marketplace.
The proportional staged sequence was:

1. exact implementation with independent reliability and architecture approval;
2. records-only final head with fresh four-job PR CI;
3. operator merge to production/default branch `main`;
4. exact-merge four-job CI;
5. fresh isolated no-ref marketplace browse, three installs, idempotent product
   update, and installed-core doctor;
6. annotated `v1.0.2` tag and public GitHub release.

**Blast radius:** marketplace discovery and new installs/updates of the three
published packs. Existing installations were not force-mutated.  
**Healthy signals:** four successful jobs at final head and exact main; browse
returns exactly core, personal, and product; all three install at `1.0.2`;
product update reports already latest at `v1.0.2`; doctor returns `status:
clear`, with all three enabled and solely marketplace-provenanced.  
**Owners:** `principal-swe-infra` for correction; the operator for all external
merge, tag, release, marketplace, deployment, and rollback actions.

## Rollback plan

1. Freeze `12c-3` and later publication if any `1.0.2` signal regresses.
2. Prefer a reviewed forward patch from current `main`; rerun full tests,
   release guard, triggered independent reviews, exact-head and exact-main CI,
   and the isolated marketplace probe.
3. For active marketplace breakage before a forward patch is ready, the
   operator may revert merge `1dd6f01…` through a protected reviewed PR, require
   exact-main CI at the revert, and verify the marketplace again serves exactly
   core + personal with a clear doctor.
4. Do not delete or retarget public tag/release `v1.0.2`.

**Limits:** a repository revert removes product from new marketplace discovery
but does not uninstall cached/existing product copies or undo the public tag and
release. No user data or schema changed; there is no down-migration.

## Deploy handoff (historical - the human ran it)

1. The operator confirmed reviewed-ref ancestry and an empty non-`kai/` diff
   from `31373ef…` to final head `999147e…`.
2. The operator waited for run `33128391926`; all four jobs succeeded at final
   head.
3. The operator merged PR #186. GitHub records merge `1dd6f01…` at
   `2026-08-28T00:03:44Z`.
4. The operator waited for exact-main run `33128452012`, completed the fresh
   isolated marketplace probe, created annotated tag `v1.0.2`, and published
   the non-draft, non-prerelease release.

**Abort criteria were:** implementation movement after review; a non-successful
job at final head or exact main; marketplace topology other than exactly core,
personal, and product; install/update/version/provenance disagreement; or a
non-clear doctor result. None tripped.

## Deployment confirmation

| Phase | Evidence | Result |
|-------|----------|--------|
| CONFIRM-START | PR #186 merged to production/default branch `main` as `1dd6f01…` at `2026-08-28T00:03:44Z`; exact-main run `33128452012` started at `2026-08-28T00:03:46Z`. | **DEPLOYING confirmed** |
| CONFIRM-COMPLETE | Run [`33128452012`](https://github.com/RubenSaucedo/kai/actions/runs/33128452012) completed `success` at `2026-08-28T00:04:29Z`; all four jobs concluded `success` at exact merge SHA. | **PRODUCTION-VERIFICATION entered** |

## Production verification

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | Exact-main CI | **Pass** | Run `33128452012`, head `1dd6f01…`, conclusion `success`; `contract`, `runtime-dependencies (kai-core)`, `runtime-dependencies (kai-personal)`, and `runtime-dependencies (kai-product)` all succeeded. |
| 2 | Fresh marketplace topology | **Pass** | A brand-new isolated `COPILOT_HOME` registered `RubenSaucedo/kai` without a branch ref; browse returned exactly `kai-core`, `kai-personal`, and `kai-product`. |
| 3 | Install and update | **Pass** | All three installed successfully at `1.0.2`; idempotent `copilot plugin update kai-product@kai-plugins` succeeded and reported already latest at `v1.0.2`. |
| 4 | Installed-core doctor | **Pass** | JSON result `status: clear`; all three plugins present, `enabled: true`, version `1.0.2`, with provenance solely `marketplace:kai-plugins`. |
| 5 | Tag/release integrity | **Pass** | Annotated tag `v1.0.2` peels to merge `1dd6f01…`; [release `v1.0.2`](https://github.com/RubenSaucedo/kai/releases/tag/v1.0.2) is public, non-draft, non-prerelease, targets that merge, and was published `2026-08-28T00:05:21Z`. |

## Verification limits

- The host probe and doctor results are operator-provided evidence. Raw isolated
  host state remains outside the workspace and is intentionally uncommitted.
- GitHub API independently corroborates PR merge/head, reviewed-ref ancestry,
  the records-only post-review diff, both workflow runs and job conclusions,
  and the annotated tag/public release target.
- Branch protection still requires only `contract`; the three runtime jobs ran
  and passed but are recorded as running-not-enforced, satisfying the item's
  explicit acceptance alternative.

## Follow-ups / parked

- `pack-split-release-12c-3-engineering` remains for the product steward to
  promote separately; this closure does not promote it.
- Direct-install bare-name settings override-key measurement remains parked,
  non-blocking, in `kai/initiatives/pack-split/backlog.md`.
- The milestone remains open: engineering and go-to-market still owe separate
  reviewed, operator-published releases.

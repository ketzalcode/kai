---
# <!-- kai:allow-legacy-roots -->
type: releases
title: Ship record - release 12c-3 engineering pack on 1.0.3
slug: pack-split-release-12c-3-engineering-ship-record
created: 2026-08-27
source: workflow-ship
target: pack-split staged department publish - kai-engineering 1.0.3
initiative: pack-split
source_artifact: kai/coordination/items/pack-split-release-12c-3-engineering.md
related:
  - kai/coordination/threads/pack-split-release-12c-3-engineering.md
  - kai/initiatives/pack-split/northstar.md
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-release-12c-3-engineering.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-release-12c-3-engineering-architecture-review.md
evidence:
  - "reviewed implementation 27804defe2f5f7fa16c2f5373884691203d21974"
  - "final PR head 24c2c752d0757e8d9617a6fbcc5de1d1e4f14cf4"
  - "https://github.com/RubenSaucedo/kai/pull/188"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33129894592"
  - "merge commit 5b8ef7ee38ec1a841e5020047a8ca43d0ca4be27 at 2026-08-28T00:30:49Z"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33129961905"
  - "https://github.com/RubenSaucedo/kai/releases/tag/v1.0.3"
---

# Ship Record - Release 12c-3 Engineering Pack on 1.0.3

**Work item:** `pack-split-release-12c-3-engineering` · **Initiative:** `pack-split`  
**Target:** four-pack marketplace publication, `v1.0.3` ·
**Date:** 2026-08-27 17:32 -07:00  
**Run:** `workflow-ship` (retrospective PREPARE + CONFIRM-START +
CONFIRM-COMPLETE)  
**What shipped (one line):** `kai-engineering` joined core, personal, and
product as the fourth marketplace pack at `1.0.3`, adding 20 agents and 15
skills while preserving runtime-dispatched review lenses.  
**Change:** [PR #188](https://github.com/RubenSaucedo/kai/pull/188) · reviewed
implementation `27804defe2f5f7fa16c2f5373884691203d21974` · final PR head
`24c2c752d0757e8d9617a6fbcc5de1d1e4f14cf4` · merge
`5b8ef7ee38ec1a841e5020047a8ca43d0ca4be27`

> The operator performed every external action: merge, marketplace probe, tag,
> and GitHub release. `workflow-ship` verified the supplied evidence and wrote
> only documentation and coordination closure.

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | The active `five-pack-split-shipped` milestone requires this item. PR #188 publishes only engineering at `1.0.3`; GTM remains absent. Reviewed ref `27804def…` is an ancestor of final head `24c2c75…`; its three later commits change only `kai/`. Final head and merge have identical tree `9cd0f9a…`, preserving reviewed implementation content. |
| 2 | verified | **Clear** | Exact-ref `npm test` is recorded on the item. Final-head run [`33129894592`](https://github.com/RubenSaucedo/kai/actions/runs/33129894592) and exact-main run [`33129961905`](https://github.com/RubenSaucedo/kai/actions/runs/33129961905) each passed `contract` plus all four runtime legs, including empty-dependency engineering. This packaging/docs change has no user-facing UI; UI QA and design sign-off are not triggered. |
| 3 | reviewed | **Clear** | `principal-sre` and `principal-swe-architect` approved exact ref `27804def…`, each at P0/P1/P2 0/0/0. Their revision-bound artifacts are linked in frontmatter and retained on the item. |
| 4 | shippable-safely | **Clear** | Rollout-operability holds: exact-ref reviews, records-only final head, five-job PR CI, operator merge, exact-main CI, then fresh isolated no-ref browse/install/update/doctor. No schema or data migration occurred. Rollback, limits, signals, and owners are explicit below. |
| 5 | documented | **Clear** | `CHANGELOG.md`, `README.md`, and `docs/getting-started.md` describe the four-pack `1.0.3` surface and keep GTM out of scope. This record, the item, and `kai/initiatives/pack-split/log.md` retain closure evidence. |
| 6 | coordination-closed | **Clear** | Both dependencies are terminal, no questions are open, all acceptance is checked, and item/thread evidence covers deployment and production verification. GTM is named only as a separate proposed dependent. |

**Readiness verdict: RELEASE-READY.** All six dimensions were Clear before the
operator merge.  
**Completion verdict: SHIPPED.** Deployment and proportional production
verification are evidenced below.

## Rollout plan and result

A percentage canary is unavailable for the default-branch-backed marketplace.
The proportional sequence was:

1. exact implementation with reliability and architecture approval;
2. records-only final head with five-job PR CI;
3. operator merge to production/default branch `main`;
4. five-job exact-main CI;
5. fresh isolated no-ref marketplace browse, four installs, idempotent
   engineering update, and installed-core doctor;
6. annotated `v1.0.3` tag and public GitHub release.

**Blast radius:** marketplace discovery and new installs/updates of the four
published packs; existing installations were not force-mutated.  
**Healthy signals:** both CI runs pass five jobs; browse returns exactly core,
personal, product, and engineering; all install at `1.0.3`; engineering update
is idempotent; doctor is clear, enabled, and marketplace-only for all four.  
**Owners:** `principal-swe-infra` for correction; the operator for external
merge, tag, release, marketplace, deployment, and rollback actions.

## Rollback plan

1. Freeze GTM promotion if any `1.0.3` signal regresses.
2. Prefer a reviewed forward patch from current `main`; rerun full tests,
   release guard, required reviews, exact-head/main CI, and the isolated probe.
3. For active marketplace breakage, the operator may revert merge `5b8ef7e…`
   through a protected reviewed PR, require exact-main CI, and verify the
   marketplace again serves exactly core + personal + product with clear doctor.
4. Do not delete or retarget public tag/release `v1.0.3`.

**Limits:** a repository revert removes engineering from new discovery but does
not uninstall cached/existing copies or undo the public tag/release. No user
data or schema changed; there is no down-migration.

## Deploy handoff (historical - the human ran it)

1. The operator confirmed reviewed ancestry and records-only movement to final
   head `24c2c75…`.
2. The operator waited for final-head run `33129894592`; all five jobs passed.
3. The operator merged PR #188 as `5b8ef7e…` at
   `2026-08-28T00:30:49Z`.
4. The operator waited for exact-main run `33129961905`, completed the fresh
   no-ref marketplace probe, created `v1.0.3`, and published the release.

**Abort criteria were:** implementation movement after review; any failed CI
job; marketplace topology other than exactly the four named packs; version,
update, or provenance disagreement; or a non-clear doctor. None tripped.

## Deployment confirmation

| Phase | Evidence | Result |
|-------|----------|--------|
| CONFIRM-START | PR #188 merged to production/default branch `main` as `5b8ef7e…` at `2026-08-28T00:30:49Z`; exact-main run `33129961905` started at `2026-08-28T00:30:52Z`. | **DEPLOYING confirmed** |
| CONFIRM-COMPLETE | Run `33129961905` completed `success` at `2026-08-28T00:31:36Z`; `contract` and all four runtime jobs succeeded at the exact merge SHA. | **PRODUCTION-VERIFICATION entered** |

## Production verification

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | Exact-main CI | **Pass** | Run `33129961905`, head `5b8ef7e…`, conclusion `success`; exactly five jobs passed: contract plus core, personal, product, and engineering runtime legs. |
| 2 | Fresh marketplace topology | **Pass** | Operator-provided fresh isolated no-ref probe browsed exactly `kai-core`, `kai-personal`, `kai-product`, and `kai-engineering`. |
| 3 | Install and update | **Pass** | All four installed at `1.0.3`; idempotent engineering update succeeded. |
| 4 | Installed-core doctor | **Pass** | `status: clear`; all four present, `enabled: true`, and solely marketplace-provenanced. |
| 5 | Tag/release integrity | **Pass** | Annotated tag `v1.0.3` peels to `5b8ef7e…`; [release `v1.0.3`](https://github.com/RubenSaucedo/kai/releases/tag/v1.0.3) targets that SHA, is public/non-draft/non-prerelease, and was published `2026-08-28T00:32:21Z`. |

## Verification limits

- The host probe and doctor are operator-provided evidence. Raw host state
  remains outside this workspace and no session-state path is promoted into
  durable coordination.
- GitHub API corroborates PR merge/head, reviewed ancestry, records-only
  post-review changes, identical final/merge trees, both workflow conclusions
  and job sets, and annotated-tag/public-release target.
- Branch protection enforcement was not asserted. The engineering job ran and
  passed and is recorded as running-but-not-enforced, satisfying acceptance.

## Follow-ups / parked

- `pack-split-release-12c-4-gtm` remains proposed behind this shipped item.
  This closure does not promote or implement it.
- The active milestone is now 7 of 8 typed required items; no milestone or
  initiative closure is claimed.

<!-- /kai:allow-legacy-roots -->

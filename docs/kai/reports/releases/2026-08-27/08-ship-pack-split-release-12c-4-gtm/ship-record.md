---
# <!-- kai:allow-legacy-roots -->
type: releases
title: Ship record - release 12c-4 GTM pack and finalize five-pack surface on 1.0.4
slug: pack-split-release-12c-4-gtm-ship-record
created: 2026-08-27
source: workflow-ship
target: pack-split final department publish - kai-gtm 1.0.4
initiative: pack-split
source_artifact: kai/coordination/items/pack-split-release-12c-4-gtm.md
related:
  - kai/coordination/threads/pack-split-release-12c-4-gtm.md
  - kai/initiatives/pack-split/northstar.md
evidence:
  - "reviewed implementation 1ad873725e62f53efd0c0005edd897e1672c915b"
  - "final PR head ad9326990a10519e379cb6475064535f4a051553"
  - "https://github.com/RubenSaucedo/kai/pull/190"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33130820714"
  - "merge commit 049764c9909a3e41fb1135287a74a6314c1a8529 at 2026-08-28T00:48:29Z"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33130883171"
  - "https://github.com/RubenSaucedo/kai/releases/tag/v1.0.4"
---

# Ship Record - Release 12c-4 GTM Pack on 1.0.4

**Work item:** `pack-split-release-12c-4-gtm` · **Initiative:** `pack-split`  
**Target:** final five-pack marketplace publication, `v1.0.4` ·
**Date:** 2026-08-27 17:50 -07:00  
**Run:** `workflow-ship` (retrospective PREPARE + CONFIRM-START +
CONFIRM-COMPLETE)  
**What shipped (one line):** `kai-gtm` joined core, personal, product, and
engineering as the fifth marketplace pack at `1.0.4`, while the incremental
split scaffolding and partial-surface documentation were retired.  
**Change:** [PR #190](https://github.com/RubenSaucedo/kai/pull/190) · reviewed
implementation `1ad873725e62f53efd0c0005edd897e1672c915b` · final PR head
`ad9326990a10519e379cb6475064535f4a051553` · merge
`049764c9909a3e41fb1135287a74a6314c1a8529`

> The operator performed every external action: merge, marketplace probe, tag,
> and GitHub release. `workflow-ship` verified the supplied evidence and wrote
> only documentation and coordination closure.

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | The active `five-pack-split-shipped` milestone requires this exact final department publish. PR #190 publishes GTM at `1.0.4`, completes the declared five-pack partition, and removes only the planned incremental scaffolding. Reviewed ref `1ad8737…` is the direct parent of final head `ad93269…`; the intervening commit changes only `kai/` records. Final head and merge share tree `82d50304…`. |
| 2 | verified | **Clear** | Exact-ref `npm test` is recorded on the item. Final-head run [`33130820714`](https://github.com/RubenSaucedo/kai/actions/runs/33130820714) and exact-main run [`33130883171`](https://github.com/RubenSaucedo/kai/actions/runs/33130883171) each passed exactly six jobs: `contract` plus all five runtime legs. Fresh production probing passed. This packaging/docs change has no user-facing UI; UI QA and design sign-off are not triggered. |
| 3 | reviewed | **Clear** | `principal-sre` and `principal-swe-architect` each approved exact ref `1ad8737…` at P0/P1/P2 0/0/0; revision-bound REVIEW entries remain in the item thread. No finding was deferred or dropped. |
| 4 | shippable-safely | **Clear** | Rollout-operability holds: exact-ref reviews, records-only final head, six-job PR CI, operator merge, six-job exact-main CI, then fresh isolated no-ref browse/install/update/doctor. No schema or data migration occurred. Rollback, limits, signals, and owners are explicit below. |
| 5 | documented | **Clear** | `CHANGELOG.md`, `README.md`, and `docs/reference/plugin-structure.md` describe the finished five-pack `1.0.4` surface and four-departments-before-core rollback order. This record, the item, deliverables index, and initiative log retain closure evidence. |
| 6 | coordination-closed | **Clear** | The dependency is terminal, no questions are open, all item acceptance is checked, and item/thread evidence covers deployment and production verification. The PM-owned milestone closure remains an explicit next action rather than a hidden release gap. |

**Readiness verdict: RELEASE-READY.** All six dimensions were Clear before the
operator merge.  
**Completion verdict: SHIPPED.** Deployment and proportional production
verification are evidenced below.

## Rollout plan and result

A percentage canary is unavailable for the default-branch-backed marketplace.
The proportional sequence was:

1. exact implementation with reliability and architecture approval;
2. records-only final head with six-job PR CI;
3. operator merge to production/default branch `main`;
4. six-job exact-main CI;
5. fresh isolated no-ref marketplace browse, five installs, idempotent GTM
   update, and installed-core doctor;
6. annotated `v1.0.4` tag and public GitHub release.

**Blast radius:** marketplace discovery and new installs/updates of all five
published packs; existing installations were not force-mutated.  
**Healthy signals:** both CI runs pass six jobs; browse returns exactly core,
personal, product, engineering, and GTM; all install at `1.0.4`; GTM update is
idempotent; doctor is clear, enabled, and marketplace-only for all five.  
**Owners:** `principal-swe-infra` for correction; the operator for external
merge, tag, release, marketplace, deployment, and rollback actions.

## Rollback plan

1. Freeze milestone closure if any `1.0.4` signal regresses.
2. Prefer a reviewed forward patch from current `main`; rerun full tests,
   release guard, required reviews, exact-head/main CI, and the isolated probe.
3. For active marketplace breakage, the operator may revert merge `049764c…`
   through a protected reviewed PR, require exact-main CI, and verify the
   marketplace again serves exactly core, personal, product, and engineering.
4. For a full split rollback, follow the documented order: remove GTM,
   engineering, product, and personal before core last.
5. Do not delete or retarget public tag/release `v1.0.4`.

**Limits:** a repository revert removes GTM from new discovery but does not
uninstall cached/existing copies or undo the public tag/release. No user data or
schema changed; there is no down-migration.

## Deploy handoff (historical - the human ran it)

1. The operator confirmed reviewed ancestry and records-only movement to final
   head `ad93269…`.
2. The operator waited for final-head run `33130820714`; all six jobs passed.
3. The operator merged PR #190 as `049764c…` at
   `2026-08-28T00:48:29Z`.
4. The operator waited for exact-main run `33130883171`, completed the fresh
   no-ref marketplace probe, created annotated `v1.0.4`, and published the
   release.

**Abort criteria were:** implementation movement after review; any failed CI
job; marketplace topology other than exactly the five named packs; version,
update, or provenance disagreement; or a non-clear doctor. None tripped.

## Deployment confirmation

| Phase | Evidence | Result |
|-------|----------|--------|
| CONFIRM-START | PR #190 merged to production/default branch `main` as `049764c…` at `2026-08-28T00:48:29Z`; exact-main run `33130883171` started at `2026-08-28T00:48:31Z`. | **DEPLOYING confirmed** |
| CONFIRM-COMPLETE | Run `33130883171` completed `success` at `2026-08-28T00:49:20Z`; `contract` and all five runtime jobs succeeded at the exact merge SHA. | **PRODUCTION-VERIFICATION entered** |

## Production verification

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | Exact-main CI | **Pass** | Run `33130883171`, head `049764c…`, conclusion `success`; exactly six jobs passed: contract plus core, personal, product, engineering, and GTM runtime legs. |
| 2 | Fresh marketplace topology | **Pass** | Operator-provided fresh isolated no-ref probe browsed exactly `kai-core`, `kai-personal`, `kai-product`, `kai-engineering`, and `kai-gtm`. |
| 3 | Install and update | **Pass** | All five installed at `1.0.4`; idempotent GTM update succeeded. |
| 4 | Installed-core doctor | **Pass** | `status: clear`; all five present, `enabled: true`, and solely marketplace-provenanced. |
| 5 | Tag/release integrity | **Pass** | Annotated tag object `9c9a109…` peels to `049764c…`; [release `v1.0.4`](https://github.com/RubenSaucedo/kai/releases/tag/v1.0.4) targets that SHA, is public/non-draft/non-prerelease, and was published `2026-08-28T00:49:59Z`. |

## Verification limits

- The host probe and doctor are operator-provided evidence. Raw host/session
  state is not promoted into durable coordination.
- GitHub API corroborates PR merge/head, reviewed ancestry, records-only
  post-review movement, identical final/merge trees, both workflow conclusions
  and job sets, and annotated-tag/public-release target.
- Branch protection enforcement was not asserted. The GTM job ran and passed
  and is recorded as running-but-not-enforced, satisfying acceptance.

## Follow-ups / parked

- All 8 of 8 typed `five-pack-split-shipped` requirements are at their required
  terminal states. `principal-product-manager` owns the separate milestone and
  initiative closure decision.
- The milestone evidence bundle is indexed in
  `kai/initiatives/pack-split/deliverables.md`: release record 04 proves the
  monolith retirement and initial core/personal publication; records 06, 07,
  and 08 retain the product, engineering, and GTM publication probes.
- No milestone or initiative closure is claimed by this ship record.

<!-- /kai:allow-legacy-roots -->

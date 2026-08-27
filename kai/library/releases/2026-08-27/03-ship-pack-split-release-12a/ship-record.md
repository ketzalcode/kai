---
type: releases
title: Ship record - release 12a migration notice
slug: pack-split-release-12a-ship-record
created: 2026-08-27
source: workflow-ship + .kai/runs/ship/2026-08-27/01-ship-pack-split-release-12a/ship-record.md
target: pack-split staged release 12a migration notice
initiative: pack-split
milestone: five-pack-split-shipped
source_artifact: kai/coordination/items/pack-split-release-12a.md
current_path: kai/library/releases/2026-08-27/03-ship-pack-split-release-12a/ship-record.md
canonical_path: kai/library/releases/2026-08-27/03-ship-pack-split-release-12a/ship-record.md
status: shipped - production verification 7/7 PASS; rollback not invoked
shipped: 2026-08-27T20:29:54Z - PR 179 merge b28113eb65256c00272382d6f73402ee7f0ff030
related:
  - kai/coordination/threads/pack-split-release-12a.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/reference/plugin-structure.md
evidence:
  - "reviewed implementation 2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620"
  - "https://github.com/RubenSaucedo/kai/pull/179"
  - "pre-PREPARE PR head 194dee86fc6a16712108c4e685be6d5e96944692"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33112672011"
  - "kai/coordination/threads/pack-split-release-12a.md"
  - "PR head 0f1c1d28032d8fa8d9b7e0d94389ed4545bce72f"
  - "merge b28113eb65256c00272382d6f73402ee7f0ff030"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33113558866"
  - "https://github.com/RubenSaucedo/kai/releases/tag/v0.67.0"
---

# Ship Record - Release 12a Migration Notice

**Work item:** `pack-split-release-12a` · **Initiative:** `pack-split`  
**Target:** `pack-split-staged-release-12a` · **Date:** PREPARE 2026-08-27
13:19 -07:00; CONFIRM 2026-08-27 13:33 -07:00
**Run:** `workflow-ship`  
**What shipped:** `v0.67.0` adds the monolith migration notice while preserving
the current install surface and publishing no pack.  
**Change:** [PR #179](https://github.com/RubenSaucedo/kai/pull/179) · reviewed
implementation `2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620`

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | The item and WS#12 require a `0.x` migration notice with no pack publication. The diff from base `ff7a29f5cde149b89e6aed6dd9b5b0e14a34ea55` to reviewed ref `2b4c5b3d…` changes the notice, lockstep `0.67.0` release metadata, and records only. README says do not uninstall yet; marketplace remains exactly one `kai` entry at source `.`; no pack entry or install-command change exists. This fits `scope.current: [five-pack-split-shipped]` and the non-negotiable that groundwork stays on `0.x`. |
| 2 | verified | **Clear** | Full local `npm test` passed. Exact `node scripts/release-guard.mjs --base origin/main --head 2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620` passed. PR run [`33112672011`](https://github.com/RubenSaucedo/kai/actions/runs/33112672011) concluded `success` at `194dee86…`: `contract`, `runtime-dependencies (kai-core)`, and `runtime-dependencies (kai-personal)` all succeeded; contract included generated parity and the real PR release guard. No user-facing UI changed, so QA/UI, UX walk, and product-design sign-off do not apply. |
| 3 | reviewed | **Clear** | `principal-sre` ratified exact ref `2b4c5b3d…` with P0/P1 `0/0`; its sole P2 was record-only and is corrected in the item touch set without implementation change. `principal-technical-writer` approved the same ref with P0/P1/P2 `0/0/0`. GitHub compare from the reviewed ref to pre-PREPARE head `194dee86…` contains one records commit changing only the item and thread. |
| 4 | shippable-safely | **Clear** | Rollout-operability holds proportionally: this is notice/version metadata, not a service, data migration, host mutation, or marketplace pack publication. Big-bang is appropriate; no canary, flag, alert, or runbook is invented. Health signals are PR/main CI, exact reviewed ancestry, lockstep versions, marketplace N=1 at source `.`, generated parity, and the release/tag target. Technical owner: `principal-swe-infra`; deployment owner: `@operator`. Rollback is the patch-release path below. |
| 5 | documented | **Clear** | README and CHANGELOG carry the migration contract and `v0.67.0` compare link. This canonical release record, `kai/initiatives/pack-split/log.md`, and `deliverables.md` preserve readiness, rollback, and production-evidence requirements. |
| 6 | coordination-closed | **Clear** | The authoritative item is `shipped` at v18, lease and fulfilled post-ship `next_role` clear; both typed dependencies are `shipped`; both exact-ref reviews remain complete; the release-cut criterion is complete; no question is open. Thread, BOARD, ACTIVE, log, deliverables, and this record agree. |

**Readiness verdict: RELEASE-READY.** Six of six dimensions are Clear.  
**Completion verdict: SHIPPED.** Operator deployment completed successfully
and production verification passed 7 of 7 checks; rollback was not invoked.

## Rollout plan (executed by the operator)

Big-bang is justified because the production effect is a monolith notice and
lockstep version stamp. There is no traffic cohort, runtime flag, schema, data,
workspace mutation, or pack publication to stage.

1. Commit and push only the PREPARE records listed below.
2. Re-run PR validation and require all three jobs to succeed.
3. Merge PR #179 with a merge commit; do not squash or rebase away reviewed
   implementation ancestry.
4. Require the `main` validation run at the exact merge SHA to succeed.
5. Tag and publish `v0.67.0` at that merge SHA.
6. Run the production checks below. Release 12b stays NO-GO.

Blast radius: the public monolith README/CHANGELOG and lockstep version
metadata. Healthy signals: all three exact-main jobs green, version coherence,
marketplace N=1 with `kai` at source `.`, no pack entry, generated parity, and
the public tag/release targeting the merge.

## Rollback plan

- **Before merge:** stop; change nothing.
- **After merge but before tag/release:** do not publish. Revert the PR merge
  through a reviewed rollback PR and require exact-main CI green.
- **After `v0.67.0` publication:** do not rewrite or retarget the public tag.
  `principal-swe-infra` prepares a corrective `0.67.1` rollback that reverts
  the notice, updates all lockstep version surfaces plus README/CHANGELOG,
  regenerates the committed packs, and passes `npm test` and release guard.
  The operator merges and publishes it; `workflow-ship` records the rollback
  evidence on this item and deliberately returns it to `release-ready`.

No rollback changes user data, workspaces, plugin installation state, or
published pack state. A release already pulled by a user is not undone by
deleting a tag, which is why the post-publication rollback is a forward patch.

## Deploy handoff (operator-executed; retained for audit)

From `feat/29-release-12a-migration-notice`:

1. Prove the reviewed implementation is intact, then commit and push only the
   PREPARE records:

   ```powershell
   $review = "2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620"
   $impl = @(
     ".github/plugin/marketplace.json", "CHANGELOG.md", "README.md",
     "plugin.json", "package.json", "package-lock.json",
     "packs/kai-core/plugin.json", "packs/kai-core/package.json",
     "packs/kai-core/package-lock.json", "packs/kai-personal/plugin.json",
     "packs/kai-personal/package.json", "packs/kai-personal/package-lock.json"
   )
   git merge-base --is-ancestor $review HEAD
   if ($LASTEXITCODE) { throw "reviewed ref is not an ancestor" }
   git diff --exit-code $review -- $impl
   if ($LASTEXITCODE) { throw "implementation changed after review" }
   git add kai/coordination/items/pack-split-release-12a.md `
     kai/coordination/threads/pack-split-release-12a.md `
     kai/coordination/BOARD.md kai/coordination/ACTIVE.md `
     kai/initiatives/pack-split/log.md `
     kai/initiatives/pack-split/deliverables.md `
     kai/library/releases/2026-08-27/03-ship-pack-split-release-12a/ship-record.md
   git commit -m "docs: prepare release 12a"
   git push origin feat/29-release-12a-migration-notice
   ```

2. Require PR #179 to remain based on
   `ff7a29f5cde149b89e6aed6dd9b5b0e14a34ea55`, with only the reviewed
   implementation plus the named record paths. Wait for `contract`,
   `runtime-dependencies (kai-core)`, and
   `runtime-dependencies (kai-personal)` to succeed:

   ```powershell
   gh pr checks 179 --watch
   gh api repos/RubenSaucedo/kai/pulls/179 `
     --jq "{state:.state,draft:.draft,mergeable:.mergeable,base:.base.sha,head:.head.sha,url:.html_url}"
   ```

3. Abort if the base moved, reviewed ancestry fails, any implementation path
   differs from the reviewed ref, any job is not `success`, marketplace
   topology is not N=1/source `.`, a pack entry appears, or a rebase is
   required. Otherwise merge without squash/rebase:

   ```powershell
   gh pr merge 179 --merge
   $merge = gh pr view 179 --json mergeCommit --jq ".mergeCommit.oid"
   ```

4. Wait for exact-main validation and require all three jobs to succeed:

   ```powershell
   $run = gh run list --workflow validate --branch main --commit $merge `
     --limit 1 --json databaseId,headSha,status,conclusion,url | ConvertFrom-Json
   if (-not $run -or $run.headSha -ne $merge) { throw "exact-main run missing" }
   gh run watch $run.databaseId --exit-status
   gh run view $run.databaseId --json headSha,status,conclusion,jobs,url
   ```

5. Only after exact-main success, tag and publish:

   ```powershell
   git fetch origin --tags
   git switch main
   git pull --ff-only origin main
   if ((git rev-parse HEAD) -ne $merge) { throw "main is not the merge SHA" }
   git tag -a v0.67.0 $merge -m "kai v0.67.0"
   git push origin refs/tags/v0.67.0
   gh release create v0.67.0 --verify-tag --target $merge --title "v0.67.0" `
     --notes "Migration notice for the v1.0.0 pack split. Packs remain unpublished; the marketplace remains the kai monolith at source .; install commands are unchanged."
   ```

## Production verification

Run on updated `main` after the release:

1. Confirm exact-main CI succeeded at the merge SHA and all three jobs
   concluded `success`.
2. Confirm reviewed ref `2b4c5b3d…` is an ancestor and every later PR path is
   one of the named coordination/initiative/release-record paths.
3. Confirm root, marketplace, core, and personal package/plugin/lock versions
   are all `0.67.0`; README and CHANGELOG agree.
4. Confirm marketplace `plugins` has length 1, with `name: kai` and
   `source: "."`; no pack entry exists.
5. Run:

   ```powershell
   node scripts/pack-preview.mjs --check
   node scripts/validate-plugin.mjs
   ```

6. Confirm the migration notice says packs are unpublished, users must not
   uninstall `kai` yet, and current install/update commands are unchanged.
7. Confirm `git rev-list -n 1 v0.67.0` equals the merge SHA and
   `gh release view v0.67.0 --json url,tagName,targetCommitish,isDraft,isPrerelease,publishedAt`
   reports a public, non-prerelease release.

Return to `workflow-ship`: final PR head, merge SHA and timestamp; main run
URL/ID/head/conclusion plus all job conclusions; release URL/tag target/status/
timestamp; version/topology outputs; generated-parity and validator outputs.
A run URL without a successful conclusion is not completion.

## Production verification outcome

The operator supplied these production facts; `workflow-ship` recorded them
without repeating any merge, tag, release, deploy, or publish action.

| # | Check | Result |
|---|-------|--------|
| 1 | exact-main validation | Run [`33113558866`](https://github.com/RubenSaucedo/kai/actions/runs/33113558866) succeeded at merge `b28113eb65256c00272382d6f73402ee7f0ff030`; `contract`, `runtime-dependencies (kai-core)`, and `runtime-dependencies (kai-personal)` all succeeded. **PASS** |
| 2 | reviewed ancestry | Reviewed implementation `2b4c5b3d3c7e757f0cb3cf5ae6fc68964ad7c620` remains in ancestry; every later change through PR head `0f1c1d28032d8fa8d9b7e0d94389ed4545bce72f` is coordination, initiative, or ship-record only. **PASS** |
| 3 | version coherence | Root plugin/package, marketplace metadata and monolith entry, core plugin/package, and personal plugin/package are all `0.67.0`; README and CHANGELOG agree. **PASS** |
| 4 | publication topology | Marketplace contains exactly one `kai` at source `.`; no pack entry is published. **PASS** |
| 5 | generated parity | `node scripts/pack-preview.mjs --check` passes. **PASS** |
| 6 | plugin contract | `node scripts/validate-plugin.mjs` passes with 56 agents and 51 skills. **PASS** |
| 7 | notice and public release | The notice says packs are unpublished and users must not uninstall legacy `kai` yet. Public [`v0.67.0`](https://github.com/RubenSaucedo/kai/releases/tag/v0.67.0) is non-draft, non-prerelease, targets the exact merge, and was published `2026-08-27T20:29:54Z`. **PASS** |

**Rollback was not invoked.**

## Follow-ups / parked

- Release 12b's typed dependency on this item is satisfied. In the separate
  steward reconciliation after this ship closure, `principal-product-manager`
  verified all four dependencies and promoted release 12b to `ready` v5. That
  later coordination action did not implement or publish release 12b.
- No review finding is deferred. SRE's sole P2 was record-only and corrected.
- Packs remain unpublished.

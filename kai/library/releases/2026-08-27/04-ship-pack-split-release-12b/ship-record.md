---
type: releases
title: Ship record - release 12b minimal 1.0.0 pack flip
slug: pack-split-release-12b-ship-record
created: 2026-08-27
source: workflow-ship (PREPARE)
target: pack-split staged release 12b (the 1.0.0 flip)
initiative: pack-split
milestone: five-pack-split-shipped
source_artifact: kai/coordination/items/pack-split-release-12b.md
current_path: kai/library/releases/2026-08-27/04-ship-pack-split-release-12b/ship-record.md
canonical_path: kai/library/releases/2026-08-27/04-ship-pack-split-release-12b/ship-record.md
status: release-ready - PREPARE complete; not deployed, not published, not tagged
shipped: null
related:
  - kai/coordination/threads/pack-split-release-12b.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/reference/plugin-structure.md
  - kai/library/releases/2026-08-27/03-ship-pack-split-release-12a/ship-record.md
evidence:
  - "reviewed implementation 236f36d4f7ea5b2cd02cd42f3359bb318b253c4d"
  - "https://github.com/RubenSaucedo/kai/pull/181"
  - "PREPARE-bound PR head b0bb79faa51dd14bfb0cf7151ed6a16b0f538f92"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33118653686"
  - "kai/coordination/threads/pack-split-release-12b.md"
  - "branch feat/29-release-12b-pack-flip"
---

# Ship Record - Release 12b Minimal 1.0.0 Pack Flip

**Work item:** `pack-split-release-12b` · **Initiative:** `pack-split`
**Target:** `pack-split staged release 12b (the 1.0.0 flip)` · **Date:** PREPARE
2026-08-27 14:33 -07:00
**Run:** `workflow-ship` (PREPARE only)
**What shipped (one line):** `v1.0.0` publishes `kai-core` + `kai-personal` to
`kai-plugins`, retires the published `kai` monolith, and changes the public
install surface.
**Change:** [PR #181](https://github.com/RubenSaucedo/kai/pull/181) · reviewed
implementation `236f36d4f7ea5b2cd02cd42f3359bb318b253c4d` · PREPARE-bound head
`b0bb79faa51dd14bfb0cf7151ed6a16b0f538f92` · branch
`feat/29-release-12b-pack-flip`

> **Nothing here has been deployed.** This role prepared and gated the release.
> The merge, tag, release, and publication are `@operator` actions.

> **Record location.** The caller moved the PREPARE output into its canonical
> home before committing the release-ready state.

## Verification reach of this run (stated, not glossed)

This PREPARE ran without shell or GitHub-API reach: `api.github.com` returned
`403` and no command execution was available. Everything marked
**verified-here** below was read directly from the working tree at
`b0bb79fa…` (confirmed as the checked-out branch head). Everything marked
**attested** comes from the dispatch and the authoritative thread and was *not*
re-executed by this role.

Both attested claims are therefore converted into **mandatory mechanical
pre-merge stop conditions** (§Deploy handoff steps 1-3) rather than assumed:

- **Reviewed-ref equivalence** — that head `b0bb79fa…` differs from reviewed
  `236f36d4…` only in `kai/` records is attested. Step 1 proves it with
  `git diff --exit-code`, and aborts otherwise.
- **CI greenness** — run
  [`33118653686`](https://github.com/RubenSaucedo/kai/actions/runs/33118653686)
  is attested green on `contract`, `runtime-dependencies (kai-core)`, and
  `runtime-dependencies (kai-personal)`. That run is at `b0bb79fa…`, which the
  PREPARE records commit **supersedes**, so it is a precondition signal only.
  Step 2 requires a *fresh* run at the final head as the actual merge gate.

*Record-keeping note:* prior thread entries carry `1515`/`1516` wall-clock
stamps while this run's true local time is `14:33 -07:00` (offset drift in the
upstream entries). Real times are recorded here; no history was reordered.

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | The item is a typed `required_items` entry of `scope.current: [five-pack-split-shipped]` and its acceptance is unchanged since promotion. Verified-here at `b0bb79fa…`: `.github/plugin/marketplace.json` publishes exactly `kai-core` (`./packs/kai-core`) and `kai-personal` (`./packs/kai-personal`) at `1.0.0` with `metadata.installSurface: packs` and **no `kai` monolith entry**; `plugin.json`, `package.json`, and both pack manifests are `1.0.0`; `CHANGELOG.md` has `## [1.0.0] - 2026-08-27` plus its compare link; `README.md` carries the `v1.0.0` stamp. **A4(1)** is real: `scripts/release-guard.mjs:22` lists `.github/plugin/marketplace.json` in `BEHAVIOR_FILES`, with a self-test arm at `:130`. **A4(2)** is real: `scripts/validate-plugin.mjs:822` errors when `sourceManifest.name !== entry.name`. Non-negotiables hold — `skills/kai-core-workspace-onboarding/SKILL.md:31-34` makes rows 2-5 the selectable set and core "never offered as a choice"/"the only automatic inclusion"; the slice is core + **one** department, not five. No scope expansion rides along. |
| 2 | verified | **Clear** (attested CI; re-gated at final head) | Thread `2026-08-27-1500`: full `npm test` and the exact release guard pass, including 170 pack self-tests, generated parity, migration-doctor fixtures, source/name marketplace validation, and the marketplace-sensitive release-guard arm. Host proof: the corrected isolated staging probe installed and idempotently updated core + personal at exact `1.0.0` with only `marketplace:kai-plugins` provenance; the real direct-monolith doctor exits 2 with exactly `legacy-installed` + `workspace-provenance-current` and no `enabled-state-unverified`. `test/fixtures/host-installs.json` carries direct-install, disabled, disagreement, and absent-settings arms (verified-here). CI run `33118653686` is attested green on all three required jobs. No designed user-facing UI surface changes — this is marketplace/release metadata, scripts, and docs — so QA/UI, UX walk, and product-design sign-off do not apply (same basis as release 12a). |
| 3 | reviewed | **Clear** (equivalence re-gated at merge) | Both `review_requirements` are satisfied at the **same exact** `change_ref 236f36d4f7ea5b2cd02cd42f3359bb318b253c4d`: `principal-sre`/`independent-reliability` **approved** and `principal-security`/`independent-security` **approved**, recorded in `completed_reviews` and as thread `REVIEW` entries. The chain is genuinely adversarial, not a rubber stamp: reliability blocked `20d82bb…` on two P1s (config/settings enabled-state disagreement; no gate-legal rollback or post-merge probe), then rejected the first over-strict reconciliation rule after measuring a real host with an empty override map, before approving the final semantics. No P0/P1 remains open. Four non-blocking follow-ups are recorded in the item Notes and carried in §Follow-ups — none deleted. |
| 4 | shippable-safely | **Clear** | Highest blast radius in the initiative: merging changes the **public install surface** and retires the published monolith. Staging is the initiative's own canary — `12a` (notice) -> `12b` (core + **one** department) -> `12c` (remainder) — satisfying the non-negotiable never to flip five packs in one unreviewable step. Reversibility is designed, CI-enforced, and documented at `docs/reference/plugin-structure.md:190` (verified-here): a `legacy-rollback` forward-patch mode the validator accepts only at `>=1.0.0`, requiring the monolith and forbidding pack entries, plus an already-migrated recovery order (departments first, `kai-core` last, prove absence, reinstall monolith, fresh session). Unpublished departments fail closed, not silently: `SKILL.md:113-118` stops before installing anything if a selected department is absent or version-skewed. Post-merge probe is pre-defined (`plugin-structure.md` release step 4). Technical owner `principal-swe-infra`; deployment owner `@operator`. Honest limits in §Rollback. |
| 5 | documented | **Clear** | Verified-here: `CHANGELOG.md` `[1.0.0]` documents the pack surface, marketplace publication-integrity gates, machine-readable install-state evidence, the rollback mode, monolith retirement, the pack-targeted commands, the `/plugin` recovery correction, and enabled-state reconciliation, with its `[1.0.0]:` compare link at `:2990`. `README.md` carries the `v1.0.0` status stamp and an honest disclosure that the first slice installs **16 agents and 31 skills** of 56/51 and that migrating removes engineering/product/GTM roles until `1.0.x`. `docs/reference/plugin-structure.md` carries both the release steps and the emergency rollback runbook. This record is the durable release artifact; `kai/initiatives/pack-split/log.md` is stamped at PREPARE and again at closure. |
| 6 | coordination-closed | **Clear** | Item at `v10`, `in-review`, `lease.holder: null`, `resume_state: null`, `waiting_on_questions: []`, `next_role: workflow-ship`. All four typed dependencies re-verified **here** against their authoritative records at their required terminal states: `pack-split-host-gates` `completed` v17 (`knowledge`, so `completed` is its terminal state), `pack-split-pack-dependency-manifests` `shipped` v23, `pack-split-release-12a` `shipped` v18, `pack-split-onboarding-installer` `shipped` v18. Thread and item agree. `BOARD.md`/`ACTIVE.md` rows are stale index snapshots (see §Follow-ups); the item record is authoritative. |

**Readiness verdict: RELEASE-READY.** Six of six dimensions Clear, with two
attested claims converted into mechanical pre-merge stop conditions.
**Completion verdict: NOT SHIPPED.** No deployment, publication, tag, or
production verification has occurred.

## Rollout plan

**The merge is the publication.** The `kai-plugins` marketplace is served from
the default branch, so merging PR #181 immediately retires the monolith entry
and publishes core + personal to anyone who browses or updates the marketplace.
The tag and GitHub release are markers that follow. **The abort window closes at
merge, not at tag** — everything cheap to reverse must be checked before step 4.

Staging is structural rather than percentage-based, because a marketplace index
has no traffic cohort:

1. `12a` shipped the migration notice on `0.x` with no pack published.
2. `12b` (this) publishes core + **one** department only.
3. `12c` publishes the remaining departments.

**Blast radius:** every new and migrating install. New installs must use
`kai-core` + `kai-personal`; the monolith is no longer installable from the
marketplace. Existing monolith installations keep working — they are not
force-migrated — but their upgrade path changes. Migrating users lose the
engineering, product, and GTM roles until `12c`, which README discloses.

**Healthy signals:** all three jobs green at the exact merge SHA; reviewed
ancestry intact; `1.0.0` coherent across all seven version surfaces; marketplace
topology exactly two pack entries with no monolith; generated parity and
validator clean; the isolated-home probe installing both packs at `1.0.0` with
only `marketplace:kai-plugins` provenance; the real direct-monolith doctor
reporting `legacy-installed` without `enabled-state-unverified`.

## Rollback plan

- **Before merge:** stop and change nothing. Nothing is public.
- **After merge, before tag/release:** the marketplace is *already live*. Do not
  tag. Revert the merge through a reviewed rollback PR and require exact-`main`
  CI green at the revert SHA; this restores the monolith entry directly.
- **After `v1.0.0` is published:** do not rewrite or retarget the public tag.
  `principal-swe-infra` prepares a corrective `1.0.1` per
  `docs/reference/plugin-structure.md:190` — set
  `metadata.installSurface: legacy-rollback`, replace the pack entries with the
  root `kai` entry at the same patch version, add the changelog and README
  notice, pass `npm test` and the exact release guard. `@operator` merges and
  publishes; `workflow-ship` records the rollback evidence and is the only role
  that then deliberately returns this item to `release-ready`.
- **For users who already migrated:** uninstall department packs first,
  `kai-core` last, confirm `copilot plugin list` shows neither surface, install
  `kai@kai-plugins`, then start a fresh session. Never install the restored
  monolith beside packs — the doctor correctly refuses that coexistence.

**What rollback does NOT undo — stated plainly:**

- A release already pulled by a user is not undone by deleting a tag. That is
  precisely why post-publication rollback is a **forward patch**, not a revert.
- Workspace provenance written during a migration is **not** automatically
  reversed by the rollback path. This is a known non-blocking SRE follow-up
  (§Follow-ups) and must be handled manually during an emergency restore.
- Rollback does not restore a migrated user's host state on its own; that user
  must run the already-migrated recovery order above.
- No user data or schema is touched by this release; there is no data migration
  to reverse.

## Deploy handoff (the human runs these — kai does not)

From `feat/29-release-12b-pack-flip`. **Abort at the first failure.**

1. **Prove the reviewed implementation is intact, then push only the PREPARE
   records.** The
   `':(exclude)kai/'` pathspec is the real gate: any difference outside `kai/`
   means the merge candidate is not what SRE and security approved.

   ```powershell
   $review = "236f36d4f7ea5b2cd02cd42f3359bb318b253c4d"
   git fetch origin
   git merge-base --is-ancestor $review HEAD
   if ($LASTEXITCODE) { throw "reviewed ref is not an ancestor" }
   git diff --exit-code $review HEAD -- . ':(exclude)kai/'
   if ($LASTEXITCODE) { throw "implementation changed after review - STOP, re-review required" }

   git add kai/coordination/items/pack-split-release-12b.md `
     kai/coordination/threads/pack-split-release-12b.md `
     kai/initiatives/pack-split/log.md `
     kai/library/releases/2026-08-27/04-ship-pack-split-release-12b
   git commit -m "docs: prepare release 12b"
   git push origin feat/29-release-12b-pack-flip
   ```

2. **Require a fresh green run at the new head.** Run `33118653686` is at
   `b0bb79fa…` and no longer describes the merge candidate.

   ```powershell
   gh pr checks 181 --watch
   gh api repos/RubenSaucedo/kai/pulls/181 `
     --jq "{state:.state,draft:.draft,mergeable:.mergeable,mergeable_state:.mergeable_state,base:.base.sha,head:.head.sha,url:.html_url}"
   ```

   All three of `contract`, `runtime-dependencies (kai-core)`, and
   `runtime-dependencies (kai-personal)` must conclude `success` at the new head.

3. **Re-confirm the release surface before the irreversible step.**

   ```powershell
   node scripts/pack-preview.mjs --check
   node scripts/validate-plugin.mjs
   node scripts/release-guard.mjs --base origin/main --head (git rev-parse HEAD)
   ```

4. **Merge — this publishes.** Do not squash or rebase; reviewed ancestry must
   survive.

   ```powershell
   gh pr merge 181 --merge
   $merge = gh pr view 181 --json mergeCommit --jq ".mergeCommit.oid"
   ```

5. **Require exact-`main` validation at the merge SHA.**

   ```powershell
   $run = gh run list --workflow validate --branch main --commit $merge `
     --limit 1 --json databaseId,headSha,status,conclusion,url | ConvertFrom-Json
   if (-not $run -or $run.headSha -ne $merge) { throw "exact-main run missing" }
   gh run watch $run.databaseId --exit-status
   ```

6. **Run the production verification below — before tagging.** Publication is
   already live; the tag must not be cut while any check disagrees.

7. **Only after every check passes, tag and publish.**

   ```powershell
   git fetch origin --tags
   git switch main
   git pull --ff-only origin main
   if ((git rev-parse HEAD) -ne $merge) { throw "main is not the merge SHA" }
   git tag -a v1.0.0 $merge -m "kai v1.0.0"
   git push origin refs/tags/v1.0.0
   gh release create v1.0.0 --verify-tag --target $merge --title "v1.0.0" `
     --notes "The pack install surface. kai-core + kai-personal are published; the kai monolith is retired from the marketplace. Remaining department packs follow in 1.0.x."
   ```

### Stop conditions (abort immediately)

- Anything outside `kai/` differs between `236f36d4…` and the merge candidate.
- The reviewed ref is not an ancestor of the head.
- Any of the three required jobs is not `success` at the final head or at the
  exact merge SHA, or the run's `headSha` is not the merge SHA.
- The PR is not `mergeable`, the base moved, or a rebase/squash is required.
- `pack-preview --check`, `validate-plugin`, or the exact release guard fails.
- Marketplace topology is not exactly two entries (`kai-core`, `kai-personal`)
  at `1.0.0` with `installSurface: packs`, or any `kai` monolith entry appears.
- Any version surface disagrees with `1.0.0`.
- The isolated-home probe cannot install or idempotently update both packs, or
  reports provenance other than `marketplace:kai-plugins`.
- The real direct-monolith doctor emits `enabled-state-unverified`.
- **Between merge and tag:** any failure means do **not** tag — revert the merge
  instead.

## Production verification

Run on updated `main` at the merge SHA, **before** tagging where possible.

1. Exact-`main` CI succeeded at the merge SHA; all three jobs `success`.
2. Reviewed ancestry: `236f36d4…` is an ancestor, and every later change is
   confined to `kai/` records.
3. Version coherence: root `plugin.json`/`package.json`, marketplace
   `metadata.version` and both entry versions, and both pack
   `plugin.json`/`package.json` are all `1.0.0`; README and CHANGELOG agree.
4. Publication topology: `plugins` has length 2 — `kai-core` at
   `./packs/kai-core` and `kai-personal` at `./packs/kai-personal`;
   `installSurface` is `packs`; **no `kai` monolith entry exists**.
5. `node scripts/pack-preview.mjs --check` and `node scripts/validate-plugin.mjs`
   both pass.
6. Isolated-home host probe at the merge commit: register `RubenSaucedo/kai` in
   an isolated `COPILOT_HOME`, `browse kai-plugins` (only core + personal, at
   `1.0.0`), install `kai-core` then `kai-personal`, re-run both update commands
   for idempotence, then run the **installed** core migration doctor with
   `--json` — both rows present, `enabled: true`, exact `1.0.0`, provenance only
   `marketplace:kai-plugins`, no cache paths in the inventory.
7. Real direct-monolith host doctor: exits 2 with exactly `legacy-installed` and
   `workspace-provenance-current`, and **no** `enabled-state-unverified`.
8. After tagging: `git rev-list -n 1 v1.0.0` equals the merge SHA, and
   `gh release view v1.0.0 --json url,tagName,targetCommitish,isDraft,isPrerelease,publishedAt`
   reports a public, non-draft, non-prerelease release.

**Return to `workflow-ship` to close the item:** final PR head and merge SHA
with timestamps; the exact-`main` run URL/ID/`headSha`/conclusion plus every job
conclusion; the version and topology outputs; parity and validator outputs; both
host-probe results; and the release URL, tag target, and publication timestamp.
A run URL without a successful conclusion is not completion.

## Follow-ups / parked

Carried forward, not dropped — all four are the non-blocking findings from the
approving SRE and security reviews, already recorded in the item Notes:

- Add a malformed-settings fixture arm (both reviewers, non-blocking).
- Document that a direct-install settings override key shape is not
  host-measured (SRE, non-blocking).
- Reverse workspace manifest provenance during an emergency monolith rollback
  (SRE, non-blocking) — called out in §Rollback as a known manual gap.
- Derive the rollback forbidden set from every pack before release `12c`
  (SRE, non-blocking).

Coordination hygiene:

- `BOARD.md:35` and the `ACTIVE.md` snapshot still show this item as `ready`
  with `next_role: principal-swe-infra`, predating the `in-progress ->
  in-review -> release-ready` walk. Both are regenerated index views owned by
  `director-chief-of-staff`; the item record is authoritative. Flagged for the
  next regeneration rather than edited here.

Dependents:

- `pack-split-release-12c` requires this item at `shipped` and stays blocked
  until production verification closes it. It is the item that publishes the
  engineering, product, and GTM packs the README currently discloses as absent.

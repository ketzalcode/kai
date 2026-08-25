---
type: releases
title: Ship record — harden the pack generator and make validate/release gates multi-manifest aware
slug: pack-split-generator-gates-ship-record
created: 2026-08-24
source: workflow-ship (PREPARE gate re-run) — kai/coordination/items/pack-split-generator-gates.md
target: pack-split build tooling — generator + multi-manifest gates (foundation)
initiative: pack-split
source_artifact: null
related:
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
evidence:
  - path: https://github.com/RubenSaucedo/kai/pull/152
    source: GitHub PR — merged 2026-08-25T18:20:55Z (operator-supplied)
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32814515790/job/97700043167
    source: GitHub Actions job `contract` at the PR head (read via api.github.com, read-only)
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32883225913
    source: GitHub Actions `validate` on `main` — conclusion success at head 47aa0549… (operator-supplied)
  - path: https://github.com/RubenSaucedo/kai/releases/tag/v0.58.0
    source: GitHub release v0.58.0 at merge commit 47aa0549… (operator-supplied)
  - path: kai/coordination/items/pack-split-generator-gates.md
    source: authoritative work item (version 16, `shipped`)
  - path: kai/coordination/threads/pack-split-generator-gates.md
    source: item thread
---

# Ship Record — Harden the pack generator and make validate/release gates multi-manifest aware

**Work item:** `pack-split-generator-gates`  ·  **Initiative:** `pack-split`
**Milestone:** `dependency-guarantees`  ·  **Delivery class:** `product-change`
**Target:** pack-split build tooling — generator + multi-manifest gates (foundation)
**Date:** 2026-08-24 22:52 local (America/Los_Angeles, UTC-07:00)
**Run:** `workflow-ship` — PREPARE, gate **re-run** after the `2026-08-24-2244` BOUNCE
**Closed:** 2026-08-25 11:25 local — `workflow-ship` CONFIRM-START + CONFIRM-COMPLETE
**Final state:** **SHIPPED** (`release-ready` -> `deploying` -> `production-verification` -> `shipped`)

**What shipped (one line):** the deterministic pack generator plus
multi-manifest validate/release gates on `0.58.0` — build-tooling plumbing only,
with **no pack tree committed and no pack published**; kai still ships as the
single `kai` plugin.

**Shipped as:** PR #152 merged 2026-08-25T18:20:55Z -> merge commit
`47aa0549f89b1733483dd6b662a4787d621c9430` on `main`, tagged and released `v0.58.0`.

**Change:**
- PR: <https://github.com/RubenSaucedo/kai/pull/152> — *feat(pack-split): add generator and manifest gates*
- Branch: `kai/feat/29-pack-generator-gates` -> base `main`
- Reviewed implementation commit: `4ed8f88562909ac292d856902b401a724f796f02`
- Ratified review binding (`change_ref`): `457254b973fb58b129332ffaa609fb5febfdd412`
- Version: `0.57.0 -> 0.58.0`

> **Canonical location note — promotion COMPLETE (reconciled 2026-08-25-1136).** Per
> `kai-core-workspace-conventions` this release record belongs at
> `kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md`
> — and that is where it now lives. The operator executed the outstanding move with
> `git mv` from `kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md`;
> the old path no longer exists. **No implementation, release, or verification fact
> changed with the move** — same content, same evidence, same `v0.58.0`, same rollback
> plan. The previously recorded "promotion owed" follow-up is **closed**; see
> "Promotion — complete" below. Earlier entries in the item, thread, and initiative log
> that cite the pre-promotion path were true when written and are corrected by appended
> notes rather than rewritten.

---

## DoD gate — all six dimensions

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | Foundation plumbing only, inside `northstar.scope.current: [dependency-guarantees]`. PR file set = the item's `touches` (`scripts/lib/pack-plan.mjs`, `scripts/pack-preview.mjs`, `scripts/validate-plugin.mjs`, `scripts/release-guard.mjs`, `.github/workflows/validate.yml`, `package.json`) + release metadata (`plugin.json`, `package-lock.json`, `.github/plugin/marketplace.json`, `CHANGELOG.md`, `README.md`, `AGENTS.md`) + coordination records under `kai/`. `non_negotiable` held and **verified at the PR head, not asserted**: no `packs/` tree exists (`GET /repos/RubenSaucedo/kai/contents/packs?ref=4ed8f88…` -> **404**); the `marketplace.json` patch is version-only (`0.57.0 -> 0.58.0` in both fields) so the index still lists exactly one plugin, `name: kai`, `source: "."`; groundwork stays on `0.x`; no sixth pack. Scope-expanding findings routed, not smuggled: A1–A3 -> `pack-split-generated-pack-trees`, A4 -> `pack-split-release-12b`, A5 -> `pack-split-ci-partition-checks`, A6 -> PROPOSAL in `kai/initiatives/pack-split/backlog.md`. |
| 2 | verified | **Clear** *(was the Gap that bounced this item)* | GitHub Actions run **32814515790**, job **`contract`** (id `97700043167`), `ubuntu-latest` / Node 20, `status: completed`, **`conclusion: success`**, 13s (`2026-08-25T05:51:47Z -> 05:52:00Z` = 22:51:47–22:52:00 local). **All 11 steps `success`**, including the three that were previously unevidenced: step 8 `Pack generator self-test`, step 9 `Committed pack trees match the generator`, and step 11 `Release-guard (behavior change requires a bump + release notes)` — the `pull_request`-gated real base/head gate that had **never executed in any form**. Verified by `workflow-ship` directly against the GitHub REST API (read-only), not accepted on assertion. Local suite (`pack-preview --self-test` 35 checks, `--check`, `validate-plugin`, `release-guard --self-test`, `check-syntax`, `npm test`) operator-executed, all exit 0. **Design sub-gate: not triggered** — developer-facing build tooling, no user-facing surface; no waiver needed and none invented. |
| 3 | reviewed | **Clear** | The sole `review_requirements` entry (`principal-swe-architect` / `independent-architecture`) has a `ratified` `completed_reviews` verdict bound to `change_ref 457254b973fb58b129332ffaa609fb5febfdd412` (2026-08-24-2231). The implementation **did not change** during PR delivery — the operator confirmed an empty diff between that binding and PR head `4ed8f88…` across all implementation and release files, and PR #152's body records the same claim publicly. Per `kai-core-work-coordination` (`change_ref` is updated *when implementation changes*), the item's `change_ref` therefore stays at the ratified object, preserving the exact `completed_reviews.change_ref == change_ref` match this dimension requires. The architect's own binding caveat (verdict void unless the snapshot equals the reviewed worktree) was discharged at the 2026-08-24-2244 gate and is not reopened. Findings A1–A6 owned or parked (paths under dim-1). |
| 4 | shippable-safely | **Clear (proportional)** | `review-rollout-operability` applied and right-sized — verdict **Holds**. No runtime service, no data, no migration, no external state, no user-facing surface, no publication change. Fail-closed by construction: `COMMITTED_PACKS` is empty so `--write` refuses, `writeCommitted` throws before any destructive `rmSync`, and `discoverManifests` leaves N=1 byte-for-byte unchanged. Pre-merge reversibility is total (do not merge); post-merge is a single revert (plan below). **The residual risk named at the bounce is now retired**: "a platform-fragile `--check` becomes a mandatory gate on every PR in this repo" was the live hazard, and both new steps plus the real release-guard gate now pass on `ubuntu-latest` — the exact platform that hazard lived on. Monitoring signal: the `validate` workflow on `main` and on the next PRs. Owner: `principal-swe-infra`. |
| 5 | documented | **Clear** | `CHANGELOG.md` `[0.58.0] - 2026-08-24` section + compare link; `README.md` `## Status` stamped `v0.58.0` with honest "no packs are published yet" framing; `AGENTS.md` release-path list extended with a committed `packs/` tree; the `packs/` committed-root decision recorded in the item Evidence and `kai/initiatives/pack-split/log.md`. This release record is written and indexed in `kai/initiatives/pack-split/deliverables.md`. Initiative `log.md` carries the **release-ready** entry; the **ship** stamp is deliberately withheld until CONFIRM-COMPLETE, because it has not shipped. |
| 6 | coordination-closed | **Clear** | Item record current and truthful (v13, `release-ready`, lease cleared, `resume_state: null`, acceptance criterion 5 now ticked **with the workflow-run URL**, not by assertion); this thread carries the deploy HANDOFF; `BOARD.md` and `ACTIVE.md` refreshed; dependency `pack-split-partition-lock` is `completed`; `waiting_on_questions: []` and the three open initiative questions are non-blocking; A6 parked in the committed backlog. **Recorded, not hidden:** PR delivery was executed by the operator directly rather than routed back through a `principal-swe-infra` HANDOFF, so the thread had no delivery entry — this gate's HANDOFF supplies it, and every delivery claim was re-verified against GitHub rather than taken on report. |

**Readiness verdict: RELEASE-READY.**

### What changed since the 2026-08-24-2244 BOUNCE

Exactly one thing, and it is the one thing that could still have failed. The
bounce held dim-2 open because acceptance criterion 5 ("the new CI steps run
green on the pushed PR") had no evidence and could acquire none while the change
was uncommitted. It now has evidence, on the platform the risk lived on:

1. **Platform closed.** Every prior green run was Windows; run 32814515790 is
   `ubuntu-latest`. The byte-stable, LF-normalised, forward-slash-keyed
   generation claim — the exact class that passes on one OS and fails on the
   other — passed there.
2. **The never-executed step executed.** `Release-guard --base <base.sha> --head
   <head.sha>` ran for real against this diff (not `--self-test`) and passed:
   `scripts/` is a `BEHAVIOR_PREFIX`, so the gate classified the change
   behavior-sensitive and found the bump + CHANGELOG + README it demands.
3. **Repo-wide blast radius de-risked.** The two steps that become mandatory on
   every future PR are green on the runner every future PR will use.

Non-blocking deviations from the bounce's suggested PR shape, reviewed and
**accepted as correct**: the PR title is `feat(pack-split): add generator and
manifest gates` (49 chars, imperative, correct type, no trailing `(#N)`) rather
than the longer wording suggested — conforms to `kai-core-pr-delivery` §3; and the
body says `Part of #29` rather than `Closes #29`, which is **more** accurate —
issue #29 is the umbrella "Align Kai positioning and evaluate optional plugin
packs", not this item, and closing it here would have falsely retired the whole
initiative.

---

## Rollout plan

**Single-step: squash-merge PR #152 into `main`.** Big-bang is justified, not
conceded — there is no runtime service, no data, no user-facing surface and no
published artifact to ramp. The "rollout" is a repository state change.

- **Blast radius (real, and bounded):** every future PR in this repository gains
  two mandatory `validate` steps (`Pack generator self-test`,
  `Committed pack trees match the generator`), and `packs/` joins the
  release-enforced path list. Consumers are unaffected: `/plugin update kai`
  still resolves one `kai` plugin at `source: "."`.
- **Monitoring signals:** the `validate` workflow run on `main` at the merge
  commit; then the `validate` runs on the next one or two PRs from any
  contributor — that is where a platform-fragile `--check` would surface.
- **Owner at 3am:** `principal-swe-infra` (item owner).

## Rollback plan

**Clean and complete — nothing here is one-way.**

- **Before merge:** do not merge. Reversibility is total.
- **After merge:** revert the squash-merge commit —
  `git revert <merge-sha>` on `main`, or the **Revert** button on PR #152.
- **What a rollback does NOT undo:** nothing. There is no data migration, no
  backfill, no schema change, no external state, no committed `packs/` tree, and
  no marketplace change to unwind.
- **One ordering caveat:** if the `v0.58.0` tag and GitHub release have already
  been cut (deploy step 5 below), a revert must **also** delete that tag and the
  release — otherwise a published release points at a reverted tree. Reverting
  before tagging avoids this entirely.

---

## Deploy handoff — the human runs these; kai does not

`workflow-ship` recorded this release. It did **not** merge, tag, release, or
publish anything, and it will not.

1. **Confirm the current PR head contains the verified implementation unchanged.**
   ```bash
   git fetch origin
   git merge-base --is-ancestor \
     4ed8f88562909ac292d856902b401a724f796f02 \
     origin/kai/feat/29-pack-generator-gates
   git diff --exit-code \
     4ed8f88562909ac292d856902b401a724f796f02 \
     origin/kai/feat/29-pack-generator-gates -- \
     .github/plugin/marketplace.json .github/workflows/validate.yml \
     AGENTS.md CHANGELOG.md README.md package-lock.json package.json plugin.json \
     scripts/lib/pack-plan.mjs scripts/pack-preview.mjs \
     scripts/release-guard.mjs scripts/validate-plugin.mjs
   ```
   Both commands must exit 0. Coordination-only readiness records may follow the
   implementation commit; implementation or release-file drift is not allowed.

2. **Confirm the required check is green for the current PR head.**
   ```bash
   gh pr checks 152
   ```
   The `contract` check must pass. The run recorded above proves the implementation
   on Ubuntu; any later coordination-only commit still has to pass on the final head.

3. **Merge PR #152** — GitHub **Squash and merge** (repo convention; GitHub
   auto-appends `(#152)`). Do **not** push additional commits to the branch
   after the final green check.
   <https://github.com/RubenSaucedo/kai/pull/152>

4. **Watch the `validate` workflow on `main`** (push event — 10 steps; the
   PR-only release-guard step is correctly skipped on push). All green.

5. **Promote the release record during CONFIRM-COMPLETE.** — **DONE 2026-08-25**
   (operator-executed `git mv`; see "Promotion — complete" below). The readiness
   records shipped in PR #152; this record was moved to its canonical library home
   in the follow-up coordination change:
   ```bash
   mkdir -p kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates
   git mv kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md \
          kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
   ```

6. **Per `AGENTS.md`, tag and release** once `main` is green:
   ```bash
   git tag v0.58.0 && git push origin v0.58.0
   ```
   then cut the matching GitHub release from the `[0.58.0]` CHANGELOG entry.

**Abort criteria — stop and return the item rather than pushing through:**
- the verified implementation commit is not an ancestor of the current PR head,
  or the implementation/release-file diff in step 1 is non-empty;
- the required check is not green on the current PR head;
- merge conflict on `main` (rebase changes the tree; the ratified binding and the
  CI evidence both stop applying — return to the gate);
- `validate` red on `main` after merge -> **revert first** (rollback plan above),
  then treat it as a real defect, not flake, and route to `principal-swe-infra`;
- do **not** hand-edit around a failing release-guard step.

---

## Production verification — EXECUTED 2026-08-25-1125, result PASS

Proportional to a build-tooling change with no runtime surface. `workflow-ship` ran
the read-only checks it could and labelled the rest operator-attested — **no check was
marked verified that was not actually re-derived here.**

**Environment limits, stated up front:** this run had **no shell** (read/search/edit/fetch
only) and `api.github.com` returned **403** to read-only fetches, as did the release
pages. CI conclusions and annotated-tag peels therefore could **not** be independently
re-derived and are recorded as operator-attested.

| # | Check | Result | How verified |
|---|-------|--------|--------------|
| 1 | **Main contract green** — `validate` on `main` at the merge commit | **Pass — operator-attested** | Run <https://github.com/RubenSaucedo/kai/actions/runs/32883225913>, `conclusion: success`, head SHA exactly `47aa0549f89b1733483dd6b662a4787d621c9430`. Not re-derived (403). **Corroborated locally:** `.git/refs/heads/main` = `.git/refs/remotes/origin/main` = `.git/FETCH_HEAD` = `47aa0549f89b1733483dd6b662a4787d621c9430`, and `.git/logs/refs/heads/main` records `ec29cf2f… -> 47aa0549…` `pull --ff-only: Fast-forward` at 2026-08-25 11:25:26 local. |
| 2 | **Version coherence on `main`** | **Pass — verified** | All six locations read `0.58.0`: `plugin.json:4`, `package.json:3`, `package-lock.json:3` **and** `:9`, `.github/plugin/marketplace.json` `metadata.version` **and** `plugins[0].version`. `README.md:34` `## Status` reads `v0.58.0`. `CHANGELOG.md:7` has `## [0.58.0] - 2026-08-24` and `:2563` the compare link. |
| 3 | **Marketplace still exactly one entry** | **Pass — verified** | `.github/plugin/marketplace.json` `plugins[]` has length **1**: `name: kai`, `source: "."`. No pack entries. `/plugin update kai` still resolves the single monolith. |
| 4 | **No `packs/` tree published** | **Pass — verified** | Nothing matches `packs/**` anywhere on the checked-out `main`. The `non_negotiable` this foundation was gated on holds **in production**, not merely at the PR head — the committed-unpublished contract has not started early. |
| 5 | **Tags and releases present** | **Pass — partly verified** | `.git/refs/tags/v0.58.0` = `66b3c577b85c0fef7b23785ec2d530ddb74ea576` and `.git/refs/tags/v0.57.0` = `a0b140ed70a04bbf8a7974153dafdd9bc4cf1f57` — both refs **exist locally**. Both are annotated-tag object ids; peeling them to commits requires `git`, so *"`v0.58.0` is at the merge commit"* remains operator-attested. Releases: `v0.58.0`, `v0.57.0`. |

**Verdict: production verification PASS -> item `shipped`.** Nothing contradicted the
operator's evidence, and the one claim inside it that was independently checkable —
that `main` now points at `47aa0549f89b1733483dd6b662a4787d621c9430` — matched exactly.

### A latent documentation defect the operator fixed on the way

The compare link this release introduced,
`[0.58.0]: https://github.com/RubenSaucedo/kai/compare/v0.57.0...v0.58.0`, was
**dangling**: the historical `v0.57.0` tag and release had never been cut. The operator
restored `v0.57.0` at its own merge commit
(<https://github.com/RubenSaucedo/kai/releases/tag/v0.57.0>), so the link now resolves.
Dimension 5 (documented) is stronger in production than it was at the gate.

### Rollback was not invoked

No abort criterion fired. `main` CI was green at the merge commit, so the recorded
rollback path (revert the squash-merge; delete the `v0.58.0` tag and release if already
cut) was never needed and remains available unchanged.

---

## Promotion — complete (2026-08-25)

The library promotion that was outstanding at CONFIRM-COMPLETE has been **executed by the
operator** and is closed. It was never faked: at the 2026-08-25-1125 run this environment
could not create directories, so the gap was recorded rather than papered over.

- **Old path (pre-promotion, no longer exists):** `kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md`
- **Canonical path (current, authoritative):** `kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md`
- **How:** operator-executed `git mv` (history preserved). No implementation, release
  metadata, or production behavior changed; no new version was cut.

```bash
# executed by the operator, 2026-08-25
mkdir -p kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates
git mv kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md \
       kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
```

Verified read-only here: the canonical path exists and holds this record; nothing matches
the old path anywhere under `kai/`. `kai/` is not a `BEHAVIOR_PREFIX`, so release-guard did
not require a second version bump for the move or for these reconciliation records. Item
state remains **`shipped`** — the move corrected filing, not the release.

---

## Follow-ups / parked

Nothing was dropped to clear this gate.

| Finding | Owner record | Status |
|---|---|---|
| A1 `checkCommitted` ENOENT before the `--write` hint | `pack-split-generated-pack-trees` | acceptance criterion |
| A2 OS artifacts under `packs/` splitting local vs CI | `pack-split-generated-pack-trees` | acceptance criterion |
| A3 `.gitattributes` pin `packs/** text eol=lf` | `pack-split-generated-pack-trees` | acceptance criterion (+`touches`) |
| A4 marketplace publication outside release enforcement | `pack-split-release-12b` | acceptance criteria (+`touches`) |
| A5 `PACK_AGENTS` duplicate roster truth | `pack-split-ci-partition-checks` | acceptance criterion |
| A6 zero-skill pack manifest/`skills/` mismatch | `kai/initiatives/pack-split/backlog.md` | PROPOSAL, parked with trigger |

**Dependents — reconciled at `shipped`, none promoted.** `workflow-ship` records that the
dependency is satisfied; it does **not** promote or dispatch. Only the steward moves an
item `proposed -> ready`.

| Dependent | Milestone | Its `generator-gates` dep | Other blockers | Executable now? |
|---|---|---|---|---|
| `pack-split-crosspack-validator` | dependency-guarantees (in scope) | **satisfied** | none | **No — still `proposed`.** Needs steward grooming. |
| `pack-split-preflight-compat` | dependency-guarantees (in scope) | **satisfied** | none | **No — still `proposed`.** Needs steward grooming. |
| `pack-split-migration-doctor` | first-pack-extracted (**out of `scope.current`**) | **satisfied** | milestone outside current scope | **No** — scope, not dependency. |
| `pack-split-generated-pack-trees` | first-pack-extracted | **satisfied** | `crosspack-validator`, `preflight-compat`, `degraded-refusal`, `ci-partition-checks` (all `shipped`) + `host-semantics-spike` (`completed`) | **No** — 5 of 6 deps still open. |

Milestone `dependency-guarantees` now has **1 of 5** `required_items` at `shipped`
(`generator-gates`); `preflight-compat`, `degraded-refusal`, `crosspack-validator`, and
`ci-partition-checks` remain.

---
type: releases
title: Ship record — cross-pack reference validator across all three firing paths, invoked assets, and hooks-exactly-once
slug: pack-split-crosspack-validator-ship-record
created: 2026-08-25
source: workflow-ship (PREPARE gate) — kai/coordination/items/pack-split-crosspack-validator.md
target: pack-split cross-pack reference validation
initiative: pack-split
source_artifact: null
canonical_path: kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md
promotion: completed 2026-08-25 — canonical library home
related:
  - kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
evidence:
  - path: https://github.com/RubenSaucedo/kai/pull/156
    source: GitHub PR #156 "feat: validate cross-pack references" — open, draft false, `mergeable: true`, `mergeable_state: clean`, 1 commit, +1314/-55 across 15 files (read here at PREPARE)
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32900688907
    source: workflow `validate` run 32900688907 — event `pull_request`, `run_attempt: 1`, `head_sha 0f3705e0…`, base `630089bc…`, `conclusion: success` (read here)
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32900688907/job/97973596644
    source: job `contract` — ubuntu-latest / Node 20, 11/11 substantive steps `success`, 21:22:54Z -> 21:23:10Z (16s) (read here)
  - path: kai/coordination/items/pack-split-crosspack-validator.md
    source: authoritative work item (v5 -> v6, `in-review -> release-ready`); `## Review — independent architecture (ratification), 2026-08-25-1428` is the durable review record
  - path: kai/coordination/threads/pack-split-crosspack-validator.md
    source: item thread — build HANDOFF 2026-08-25-1410, operator validation HANDOFF 2026-08-25-1420, ratification HANDOFF 2026-08-25-1428, deploy HANDOFF 2026-08-25-1435
  - path: kai/initiatives/pack-split/backlog.md
    source: PROPOSAL parked at this gate — cross-department agent-referral degradation is unspecified (architect escalation to `principal-product-manager`)
---

# Ship Record — Cross-pack reference validator (3 firing paths + invoked assets + hooks-exactly-once)

**Work item:** `pack-split-crosspack-validator`  ·  **Initiative:** `pack-split`
**Milestone:** `dependency-guarantees`  ·  **Delivery class:** `product-change`
**Target:** pack-split cross-pack reference validation
**Date:** 2026-08-25 14:23 local (America/Los_Angeles, UTC-07:00) — recorded as
**2026-08-25-1435** so the append-only coordination record stays ordered behind the
architect's `1428` entry, exactly as that review stamped behind the operator's `1420`.
**Run:** `workflow-ship` — **PREPARE** (`in-review -> release-ready`)
**Final state:** **RELEASE-READY — not shipped.** `workflow-ship` recorded this release;
it merged nothing, tagged nothing, released nothing and published nothing, and it will not.

**What shipped (one line, once the operator deploys it):** every cross-pack reference a
shipped body makes — inherited (`**Inherits:**`), user-invoked (`user-invocable: true`)
and orchestrated (dispatch entries) — plus every invoked `scripts/*` asset and the single
pack that owns `hooks.json`, now resolves against **what the authoritative generator
emits** or fails CI by name; released as `0.60.0` of the existing single `kai` plugin,
with **no `packs/` tree committed and no pack published**.

**Change:**
- PR: <https://github.com/RubenSaucedo/kai/pull/156> — *feat: validate cross-pack references*
- Branch `kai/feat/29-crosspack-validator` head **`0f3705e0b714f7d23a900296fb7c6f59d12148be`**
  (short `0f3705e` resolved to the full SHA from
  `.git/refs/heads/kai/feat/29-crosspack-validator` and confirmed independently by the
  GitHub API)
- Base `main` **`630089bc3609e4b5793f3e755fadc7bb51d43bf4`** — the PR base SHA reported
  by the API is byte-identical to local `.git/refs/heads/main` **and** to `FETCH_HEAD`
  (`origin/main`), so **the branch is one commit ahead of `main` with no divergence**
  (reflog: a single `commit:` entry, `630089bc… -> 0f3705e…`)
- Ratified review binding (`change_ref`): **`cb5fd0290f1a8b7478b54e98bf24f1968aa58f09`**
- Version: `0.59.0 -> 0.60.0`  ·  Size: +1314 / -55 across **15** files, 1 commit

> **Why `change_ref` is not the PR head.** The sole required review binds
> `cb5fd029…`, the non-destructive object minted over the validated worktree. Per
> `kai-core-work-coordination`, `change_ref` moves **when the implementation
> changes** — the operator attests that every implementation and release file at PR
> head `0f3705e…` is byte-identical to that object, so the binding is preserved
> rather than re-minted. **That attestation is not re-derivable in this environment
> (no shell)** and is therefore re-checked mechanically as **deploy step 1**, which
> fails closed if it is ever untrue.

---

## DoD gate — all six dimensions

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | Diff = the item's declared `touches` + release metadata + coordination records. Inside `northstar.scope.current: [dependency-guarantees]`, `required_for_milestone: true`; the item's outcome (three firing paths + assets + hooks-once, wired as a CI gate) is exactly what landed. **`non_negotiable` re-read at the PR head, not asserted:** `COMMITTED_PACKS = []` (`scripts/lib/pack-plan.mjs`, read at `0f3705e…` via `raw.githubusercontent.com`) so `--write` still refuses; **no `packs/` tree** (glob `packs/**` → no match in the branch checkout; CI step 9 `Committed pack trees match the generator` green); `.github/plugin/marketplace.json` still **exactly one** plugin, `kai` at `source: "."`, version-only patch (`0.59.0 -> 0.60.0`, both fields — read from the PR patch); root `agents/` + `skills/` untouched — **no agent or skill body was edited to fit the parser**, which was the live risk in design call 1; the five-pack partition and `packPluginName` are byte-unchanged; groundwork stays on `0.x`. `touches` was **extended, not silently expanded** (`scripts/pack-preview.mjs` + the six release files, declared on the record with reasons). `.github/workflows/validate.yml` is a **header-comment-only** change — verified from the PR patch itself (+9/−7, every line inside the leading `#` block) and corroborated mechanically: the `contract` job ran the **same 11 substantive steps** as the `0.59.0` release job, so no step was added. Findings routed, not smuggled — see *Follow-ups*. |
| 2 | verified | **Clear** *(the one open criterion is now closed with real evidence)* | Acceptance criterion 5 — "the new CI step runs **green on the pushed PR**" — is satisfied by **GitHub Actions run `32900688907`**, workflow `validate`, event `pull_request`, `head_sha 0f3705e0b714f7d23a900296fb7c6f59d12148be`, base `630089bc…`, `run_attempt: 1`, `status: completed`, **`conclusion: success`**; job **`contract`** (`97973596644`) on `ubuntu-latest` / Node 20, `21:22:54Z -> 21:23:10Z` (**16s**), **all 11 substantive steps `success`** — including step 4 `Validate plugin contract` (which now carries the cross-pack reference, asset-ownership and hooks-assignment checks), step 8 `Pack generator self-test` (the 70-check arms), step 9 `Committed pack trees match the generator`, and step 11 the `pull_request`-only `Release-guard --base --head` gate. **Read directly from `api.github.com` by this run (read-only), not accepted on report.** Local suite **operator-attested** (2026-08-25-1420): `pack-preview --self-test` **70 checks**, `validate-plugin` **56 agents / 51 skills**, `pack-preview --all --out <session temp>` generated all five previews (output removed), `npm test` **exit 0**. **Design sub-gate not triggered** — developer-facing build/CI tooling with no user-facing interaction surface and no net-new or materially-changed UI; no waiver invented, none needed. **QA-UI not implicated** for the same reason. |
| 3 | reviewed | **Clear** | The item declares **one** `review_requirements` entry and it is satisfied at the item's own `change_ref`: `principal-swe-architect` / `independent-architecture` / **`ratified`** 2026-08-25-1428 at **`cb5fd0290f1a8b7478b54e98bf24f1968aa58f09`**, recorded in `completed_reviews` and evidenced by the item's `## Review` section (the initiative's convention — only *security* reviews carry a separate artifact file; see N5). **Zero blocking findings:** all six contested design calls were endorsed on re-derived evidence, including the load-bearing one — references resolve against `packProviders(materializePacks(...))`, i.e. emitted files, not a plan. No finding was deleted: five non-blocking observations (N1–N5), three WS#7 binding constraints, and one product escalation all carry named owners in *Follow-ups*. **No security review is required for this item and none was invented** — no new capability, tool grant, runtime surface or trust boundary moves; the steward scoped it to a single architecture review at promotion. **Stated plainly:** head-vs-`change_ref` byte-identity is an operator attestation this run could not re-derive (no shell); it is re-checked mechanically as deploy step 1, and drift there voids the binding and returns the item to the gate. |
| 4 | shippable-safely | **Clear (proportional)** | `review-rollout-operability` applied and right-sized — verdict **Holds**. No runtime service, no data, no migration, no schema, no external state, no publication change, no user-facing surface: all 56 shipped agent bodies and 51 skill bodies are **byte-unchanged**, so a consumer running `/plugin update kai` receives version metadata and docs only. The real blast radius is **this repository's CI**, named rather than hand-waved: every future PR now additionally gates on cross-pack reference resolution, asset ownership and hooks-exactly-once — already green on `ubuntu-latest`, the same runner those PRs use, in 16s. A canary, a feature flag, a ring rollout and a runbook are **not applicable** to a build-time gate and are deliberately not invented; reversibility (below) is the safety mechanism and it is total. Fail direction is closed — an unresolvable reference fails the build rather than shipping a broken pack. Signals + owner below. |
| 5 | documented | **Clear** | `CHANGELOG.md` `## [0.60.0] - 2026-08-25` (Added ×3, Changed ×2) plus the `[0.60.0]: …compare/v0.59.0...v0.60.0` link — **not dangling**: the `v0.59.0` tag exists (`.git/refs/tags/v0.59.0`). `README.md:34` `## Status` reads `v0.60.0` — 56 agents / 51 skills — with four added lines describing what validation now covers. `.github/workflows/validate.yml`'s header now states cross-pack reference resolution, invoked assets and the single owner of `hooks.json`, so the workflow describes what it enforces. The durable design record is the item's `## Review` section (N5). This release record is at its canonical library path and indexed in `kai/initiatives/pack-split/deliverables.md`; `kai/initiatives/pack-split/log.md` carries the **release-ready** entry. The **ship** stamp is deliberately withheld — it has not shipped. No ops runbook is implicated (no runtime surface). |
| 6 | coordination-closed | **Clear** | Item record current and truthful (v5 -> v6, `in-review -> release-ready`, `resume_state: null`, lease `null`, `next_role: "@operator"`), acceptance criterion 5 ticked **with the run URL**, not by assertion. The deploy HANDOFF is appended to the thread; `BOARD.md` and `ACTIVE.md` refreshed; the PROPOSAL the architect escalated is **parked in the initiative backlog** rather than left inside a review section. `depends_on: pack-split-generator-gates (requires: shipped)` verified satisfied at its v17 record. `waiting_on_questions: []`; the three open initiative questions remain non-blocking. **No dependent is cleared by this gate** — `pack-split-ci-partition-checks` requires this item at **`shipped`**, which it is not, so it stays non-dispatchable; `pack-split-degraded-refusal` still overlaps this item on `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs`, now as **live surface movement**, so the touch-conflict check at dispatch applies harder, not less. |

**Readiness verdict: RELEASE-READY.** No dimension is Waived; none needed to be.

### What closed since the ratification

Exactly one thing, and it is the thing only CI could close. At 2026-08-25-1428 the
architecture review ratified the seam and explicitly refused to tick — or waive — the
"green on the pushed PR" criterion. Between then and now the operator pushed
`0f3705e…` and opened PR #156, and the required `contract` check ran green on
`ubuntu-latest`. That is verified here against the GitHub API rather than accepted on
report, so the gate passes instead of bouncing.

### Environment limits, stated up front

This run had **no shell** (read / search / edit / fetch only). Recorded rather than
papered over:

- **Verified here, read-only:** PR #156 metadata (`mergeable: true`,
  `mergeable_state: clean`, `commits: 1`, `changed_files: 15`, `additions: 1314`,
  `deletions: 55`); the `validate` run and its full job step list; **six** of the 15
  changed filenames with their patches (`.github/plugin/marketplace.json`,
  `.github/workflows/validate.yml`, `CHANGELOG.md`, `README.md`,
  `kai/coordination/ACTIVE.md`, `kai/coordination/BOARD.md`); `plugin.json`,
  `package.json`, `package-lock.json` (×2) and `scripts/lib/pack-plan.mjs`
  **at the PR head commit** via `raw.githubusercontent.com`; local refs and reflog
  (`.git/refs/**`, `.git/logs/HEAD`).
- **Not fully re-derived:** `api.github.com` began returning **403** (rate limit)
  partway through paging the PR file list, so **9 of 15** filenames rest on the item's
  declared `touches` plus count agreement (10 implementation/release + 5 coordination
  = 15). Deploy step 1 converts that inference into a mechanical check.
- **Operator-attested, not re-derived:** byte-identity between `cb5fd029…` and PR head
  `0f3705e…`; the local suite (70-check self-test, 56/51, five-pack preview,
  `npm test` exit 0). Both are re-checked at deploy steps 1 and 3, which fail closed.

---

## Rollout plan

**Big-bang — and justified.** There is nothing to stage: the change is a build-time
validator plus release metadata, with no runtime path, no user cohort and no data.

- **Staging mechanism:** none, deliberately. A flag or canary on a CI gate would create
  a second configuration to keep in sync for a check whose only "users" are future PRs
  in this repository. `review-rollout-operability` right-sizes this to reversibility,
  which is total.
- **Blast radius, named honestly:**
  1. **This repo's CI** — every future PR and push to `main` now also runs the
     cross-pack reference, asset-ownership and hooks-assignment checks inside the
     existing `Validate plugin contract` and `Pack generator self-test` steps. Green
     today on the live corpus and on `ubuntu-latest`, 16s end to end.
  2. **The next contributor to move a reference** — a new cross-department *skill*
     reference, an asset invoked from two packs but assigned to a department, or a
     second `hooks.json` claimant now **fails the build by name**. That is the point,
     and it is the one way this change can surprise someone.
  3. **`pack-split-degraded-refusal`** shares `scripts/lib/pack-plan.mjs` and
     `scripts/validate-plugin.mjs`; after merge those surfaces have moved, so that item
     must read this diff rather than assume it.
  4. **Consumers of the published `kai` plugin** — no behavioural change whatsoever;
     56 agents and 51 skills are byte-identical. They receive `0.60.0` metadata, README
     and CHANGELOG.
- **Monitoring signals:** the `validate` workflow on `main` at the merge commit
  (`conclusion`), and specifically its `Validate plugin contract` and `Pack generator
  self-test` steps; the `v0.60.0` tag/release peel.
- **Owner at 3am:** `principal-swe-infra` (item owner). Escalation for a design question
  on the seam: `principal-swe-architect`.

## Rollback plan

**Clean and complete — nothing here is one-way.**

- **Before merge:** do not merge. Reversibility is total.
- **After merge, before tagging:** revert the merge commit — `git revert <merge-sha>` on
  `main`, or the **Revert** button on PR #156.
- **After tagging/releasing:** the revert above **plus** delete the `v0.60.0` tag and its
  GitHub release, otherwise a published release points at a reverted tree. Reverting
  before tagging avoids this entirely — prefer it.
- **What a rollback does NOT undo:** nothing durable. No data migration, no backfill, no
  schema change, no external state, no committed `packs/` tree, no marketplace entry, no
  publication. The single residue is that a consumer who ran `/plugin update kai` between
  merge and revert holds a local `0.60.0` copy until they update again — and that copy is
  behaviourally identical to `0.59.0`, since no agent or skill body changed.
- **Not a rollback path:** hand-editing `scripts/lib/pack-plan.mjs`,
  `scripts/validate-plugin.mjs`, `scripts/pack-preview.mjs` or the version locations on
  `main` to "fix forward" past a red gate, and **not** relaxing a new check to make a
  failing reference pass. Revert, then route the defect to `principal-swe-infra`.

---

## Deploy handoff — the human runs these; kai does not

`workflow-ship` recorded this release. It did **not** merge, tag, release or publish
anything, and it will not. Steps 1 and 3 are the mechanical re-checks of the two
operator attestations this gate could not re-derive.

1. **Confirm the PR head still carries the *reviewed* implementation, unchanged — and
   that nothing else rode along.**
   ```bash
   git fetch origin
   git diff --exit-code \
     cb5fd0290f1a8b7478b54e98bf24f1968aa58f09 \
     origin/kai/feat/29-crosspack-validator -- \
     .github/plugin/marketplace.json .github/workflows/validate.yml \
     CHANGELOG.md README.md package-lock.json package.json plugin.json \
     scripts/lib/pack-plan.mjs scripts/pack-preview.mjs scripts/validate-plugin.mjs

   git diff --name-only 630089bc3609e4b5793f3e755fadc7bb51d43bf4 \
                        origin/kai/feat/29-crosspack-validator
   ```
   The first command must exit 0. The second must list **exactly 15** paths — the ten
   above plus `kai/coordination/ACTIVE.md`, `kai/coordination/BOARD.md`,
   `kai/coordination/items/pack-split-crosspack-validator.md`,
   `kai/coordination/threads/pack-split-crosspack-validator.md` and
   `kai/initiatives/pack-split/log.md` — with **no** path under `agents/`, `skills/`,
   `packs/`, `docs/` or `test/`. Anything else is scope drift: stop and return the item.
   Implementation or release-file drift voids the review binding.

2. **COMPLETED 2026-08-25 — finish this record's promotion** (coordination-only,
   no version bump — `kai/` is not a `BEHAVIOR_PREFIX`):
   ```bash
   mkdir -p kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator
   git mv kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator.md \
          kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md
   ```
   Doing it **here** keeps it inside the same records commit, so no post-ship
   reconciliation is owed (the `0.58.0` record needed one; the `0.59.0` record's move was
   a separate step).

3. **Commit the readiness records, then confirm the check is green on the *final* head.**
   ```bash
   git add kai/ && git commit -m "docs: record crosspack-validator ship gate"
   git push origin kai/feat/29-crosspack-validator
   gh pr checks 156            # `contract` must pass on the final head
   ```
   Pushing moves the PR head; the review still binds because step 1 proves no
   implementation or release file moved, so `change_ref` stays at `cb5fd029…`. Merging
   first and committing the records to `main` afterwards is equally acceptable — but
   **the required check must be green on whatever head you merge**, and run
   `32900688907` only proves head `0f3705e…`.

4. **Merge PR #156** — GitHub **Squash and merge** (repo convention; GitHub auto-appends
   `(#156)`). The PR reports `mergeable_state: clean` against `630089bc…`, which is
   current `origin/main`, so no rebase is needed — and a rebase would change the tree and
   void both the review binding and the CI evidence. Do not push further commits after
   the final green check. <https://github.com/RubenSaucedo/kai/pull/156>

5. **Watch `validate` on `main`** at the merge commit (push event — 10 steps; the
   PR-only release-guard step is correctly skipped). All green before step 6.

6. **Per `AGENTS.md`, tag and release** once `main` is green:
   ```bash
   git tag v0.60.0 && git push origin v0.60.0
   ```
   then cut the GitHub release from the `[0.60.0]` CHANGELOG section.
   **Release-note language is constrained by what was actually proven:** the truthful
   claim is that **CI now resolves** every inherited, user-invoked and orchestrated
   reference against the generator's emitted trees, that invoked `scripts/*` assets are
   assigned to a pack, and that `hooks.json` has exactly one owner. Do **not** claim any
   pack is generated, committed or published — none is (`COMMITTED_PACKS = []`, no
   `packs/` tree, marketplace still N=1) — and do **not** imply the split is done.

7. **Return the deployment evidence** to `workflow-ship` (below) so CONFIRM-START and
   CONFIRM-COMPLETE can run. Do not mark this item `shipped` by hand.

**Abort criteria — stop and return the item rather than pushing through:**
- step 1's implementation/release diff is non-empty, or the name list is not exactly
  those 15 paths (review binding void / scope drift);
- the required `contract` check is not green on the head you are about to merge;
- merge conflict on `main` — a rebase changes the tree, so both the review binding and
  the CI evidence stop applying; return to the gate;
- `validate` red on `main` after merge → **revert first** (rollback plan above), then
  treat it as a real defect and route to `principal-swe-infra`;
- the tag/release step fails after `main` is green → stop; the tag is recoverable and
  nothing is inconsistent yet;
- do **not** hand-edit around a failing validator step, and do **not** loosen a new check
  to get a merge through.

---

## Production verification — to be executed at CONFIRM-COMPLETE

Proportional to a build/CI-tooling change with no runtime surface. Every check is
read-only.

| # | Check | Pass condition |
|---|-------|----------------|
| 1 | **`validate` green on `main`** | Workflow run at the merge commit: `event: push`, `conclusion: success`, `head_sha` = the merge SHA. |
| 2 | **The new gates actually ran in production** | In that run, steps `Validate plugin contract` **and** `Pack generator self-test` are `success` — that is where the cross-pack, asset and hooks checks live. A green run with either step skipped is **not** a pass. |
| 3 | **Version coherence on `main`** | `0.60.0` in all eight locations at the merge commit — `plugin.json`, `package.json`, `package-lock.json` (×2), `.github/plugin/marketplace.json` (`metadata.version` + `plugins[0].version`), `README.md` `## Status`, `CHANGELOG.md` `## [0.60.0]` + its `v0.59.0...v0.60.0` compare link, which must resolve. |
| 4 | **Marketplace still exactly one entry** | `plugins[]` length **1**, `name: kai`, `source: "."` — no pack entries. |
| 5 | **No `packs/` tree on `main`; `COMMITTED_PACKS` still empty** | Nothing matches `packs/**` at the merge commit and `scripts/lib/pack-plan.mjs` still reads `COMMITTED_PACKS = []`. The committed-unpublished non-negotiable must hold **in production**, not merely at the PR head. |
| 6 | **Roster unmoved** | `README.md` `## Status` still reads 56 agents / 51 skills, and no `agents/**` or `skills/**` path appears in the merge diff — the validator landed without touching a single shipped body. |
| 7 | **Tag and release** | `v0.60.0` exists and peels to the merge commit; the GitHub release is cut from the `[0.60.0]` section, not draft, not prerelease; the notes claim CI validation only — no published pack, no completed split. |

**Evidence the operator must return:**

- **CONFIRM-START:** deployment run URL/ID, environment (`main` / GitHub Releases),
  version + SHA being deployed, start timestamp.
- **CONFIRM-COMPLETE:** merge commit SHA and merge timestamp; the `main` workflow run
  URL/ID **with its `conclusion`** (a URL without a successful conclusion is not
  completion); `v0.60.0` tag + release URLs; completion timestamp.

If any check fails, the recorded abort/rollback path is invoked **through the operator**,
`production-verification` is captured in `resume_state`, and the item is set `blocked`
with `principal-swe-infra` named. Only `workflow-ship` may later return it to
`release-ready`, and only on rollback evidence. **kai never executes the deployment or
the rollback.**

---

## Follow-ups / parked

**Nothing from the review was dropped.** Every observation has a named owner:

- **PROPOSAL — cross-department agent-referral degradation is unspecified.** The
  architect's escalation to `principal-product-manager` is **parked as a PROPOSAL in
  `kai/initiatives/pack-split/backlog.md`** by this gate, so a finding that ships is a
  finding that is owned. It is **not** a dependency, **not** an item, **not** an
  acceptance criterion, and it does **not** gate this release.
- **N1** — a dispatch entry naming a *deleted skill* is silently dropped (skills classify
  by resolution, agents by shape). Not a cross-pack defect; identical in the monolith
  today. Mitigation (widen the live lens arm from one lens to all nine
  `workflow-doc-review` lenses) → **`pack-split-ci-partition-checks`**.
- **N2** — two "agent-shaped" definitions now exist (`AGENT_REF` omits `creative`;
  `AGENT_SHAPED` is the complete one) → with **A5** in
  **`pack-split-ci-partition-checks`**.
- **N3** — `endsWith('/hooks.json')` counts any depth where `^[^/]+/hooks\.json$` is the
  intent; unreachable today, fail-closed → **`pack-split-generated-pack-trees`** (WS#7).
- **N4** — hook-asset key-spaces differ and only the first `${PLUGIN_ROOT}` path per
  command is read; fail-closed, one line, whenever hooks change → WS#7.
- **N5** — answered, not owed: the item's `## Review` section is this initiative's
  durable record for an architecture review; no new artifact lane was opened.
- **Three binding constraints on WS#7 `pack-split-generated-pack-trees`:** consume
  `planAssets` / `HOOKS_OWNER` rather than re-deriving ownership; route hook scripts **by
  declaration**, not by prose mention; emit `hooks.json` into **core only**.
- **P2-S1** (the generated-agent preflight pin gated on a pack-name pattern) remains a
  parked PROPOSAL from the `0.59.0` gate; this change did not widen it.
- **Recorded so today's green is not over-read:** given `planAssets` output, two of
  `assetOwnershipErrors`' four arms are **structurally unreachable today** — the plan
  defines ownership from the consumer set, so it cannot disagree with itself. They become
  load-bearing only when WS#7 supplies an independent owner source. Likewise,
  `scripts/observe-subagent.mjs` is owned by core today only because a core skill's prose
  invokes it: fail-closed, but fragile as a *routing* input.

**Dependents — none cleared by this gate.** `pack-split-ci-partition-checks` requires this
item at **`shipped`**; it stays non-dispatchable until CONFIRM-COMPLETE runs.
`pack-split-degraded-refusal` is dispatchable but overlaps this item's files, so its
touch-conflict check still applies. **Milestone `dependency-guarantees` stays at 2 of 5
required items `shipped`** — RELEASE-READY moves nothing downstream.

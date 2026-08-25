---
type: releases
title: Ship record — combined fail-closed preflight + version-compat in every generated pack agent, CI byte-pinned
slug: pack-split-preflight-compat-ship-record
created: 2026-08-25
source: workflow-ship (PREPARE gate) — kai/coordination/items/pack-split-preflight-compat.md
target: pack-split contract preflight + version compatibility
initiative: pack-split
source_artifact: null
canonical_path: kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md
promotion: completed 2026-08-25 — canonical library home
related:
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
  - kai/initiatives/pack-split/artifacts/security/pack-split-preflight-compat.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
evidence:
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32895404267
    source: main `validate` run 32895404267 — event push, head_sha 67670525…, conclusion success (read here at CONFIRM-COMPLETE)
  - path: https://github.com/RubenSaucedo/kai/releases/tag/v0.59.0
    source: published release 376694649, tag v0.59.0 peeled to merge commit 67670525… (read here)
  - path: https://github.com/RubenSaucedo/kai/pull/154
    source: GitHub PR #154 — squash-merged 2026-08-25T20:27:09Z into 67670525… (was open at head d4145eed… when PREPARE ran)
  - path: kai/coordination/items/pack-split-preflight-compat.md
    source: authoritative work item (version 17, `shipped` — was v14 `release-ready` at PREPARE)
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32893764931
    source: workflow `validate` run 32893764931, event pull_request, head_sha d4145eed…, conclusion success (read here)
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32893764931/job/97951496629
    source: job `contract` — ubuntu-latest / Node 20, 11/11 substantive steps success, 14s (read here)
  - path: kai/coordination/threads/pack-split-preflight-compat.md
    source: item thread — deploy HANDOFF 2026-08-25-1310, ship HANDOFF 2026-08-25-1328
  - path: kai/initiatives/pack-split/artifacts/security/pack-split-preflight-compat.md
    source: independent security assessment (P0 0 / P1 0 / P2 2) at change_ref 3383d7f2…
---

# Ship Record — Combined fail-closed preflight + version-compat in each generated pack agent, CI byte-pinned

**Work item:** `pack-split-preflight-compat`  ·  **Initiative:** `pack-split`
**Milestone:** `dependency-guarantees`  ·  **Delivery class:** `product-change`
**Target:** pack-split contract preflight + version compatibility
**Date:** 2026-08-25 13:10 local (America/Los_Angeles, UTC-07:00)
**Run:** `workflow-ship` — **PREPARE** (`in-review -> release-ready`) 2026-08-25-1310,
then **CONFIRM-START + CONFIRM-COMPLETE** (`release-ready -> deploying ->
production-verification -> shipped`) 2026-08-25-1328
**Final state:** **SHIPPED** — the operator merged, tagged, released and published;
**kai merged, tagged, released and published nothing, at any phase.** Production
verification PASSED; rollback was never invoked. *(This line read "RELEASE-READY —
not shipped" until the operator supplied deployment evidence; it is updated here
because the record's header must state the item's real terminal state.)*

**What shipped (one line, once the operator deploys it):** `kai-core-contract-v1`
becomes a real on-disk core skill and the authoritative generator injects one
canonical, byte-pinned fail-closed preflight + contract-version block into every
**generated non-core** pack agent body — released as `0.59.0` of the existing
single `kai` plugin, with **no `packs/` tree committed and no pack published**.

**Change:**
- PR: <https://github.com/RubenSaucedo/kai/pull/154> — *feat: add fail-closed pack preflight*
- Branch `kai/feat/29-preflight-compat` (head `d4145eed69681e20d2443a4242e687a9036bf557`)
  -> base `main` (`9d16e0751cc223f9bc9421cedbf0ac32b134b9c3`)
- Single implementation commit on the branch (reflog-verified): `9d16e075… -> d4145eed…`
- Ratified/cleared review binding (`change_ref`): `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`
- Version: `0.58.0 -> 0.59.0`

> **Canonical location note — promotion completed 2026-08-25.**
> This record now lives at
> `kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md`.
> The move changed coordination records only; no implementation or release
> metadata changed.

> **Why `change_ref` is not the PR head.** Both required reviews bind
> `3383d7f2…`, the `git stash create` object of the reviewed worktree. Per
> `kai-core-work-coordination`, `change_ref` moves **when the implementation
> changes** — the operator attests the implementation and release files at PR
> head `d4145eed…` are byte-identical to that object, so the binding is
> preserved rather than re-minted. That attestation is **not** re-derivable in
> this environment (no shell) and is therefore re-checked as **deploy step 1**,
> which fails closed if it is ever untrue.

---

## DoD gate — all six dimensions

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | Diff is the item's `touches` + release metadata + coordination records — no capability beyond the acceptance. Inside `northstar.scope.current: [dependency-guarantees]`, `required_for_milestone: true`. `non_negotiable` held, **read here rather than asserted**: `COMMITTED_PACKS = []` (`scripts/lib/pack-plan.mjs:102`) so `--write` still refuses; **no `packs/` tree exists** (glob `packs/**` → no match); `.github/plugin/marketplace.json` still lists **exactly one** plugin, `kai` at `source: "."`, version-only patch (`0.58.0 -> 0.59.0`, both fields); root `agents/` + `skills/` remain the single source of truth (the monolith injects no preflight); groundwork stays on `0.x`; core agents excluded, so no core/department duplication. Declared-but-untouched `touches` entry `.github/workflows/validate.yml` is deliberate, not an omission — the workflow already runs every gate this change adds. Findings routed, not smuggled: **P2-S1 → PROPOSAL parked in `kai/initiatives/pack-split/backlog.md`** (natural home `pack-split-ci-partition-checks`, owner `principal-swe-infra`); N2 decided-accepted by security; N3/N4/R1–R3 recorded with named owners. |
| 2 | verified | **Clear** *(the one criterion that was open is now closed with real evidence)* | Acceptance criterion 6 — "`validate` runs green on the pushed PR" — is satisfied by **GitHub Actions run 32893764931**, workflow `validate`, event `pull_request`, `head_sha d4145eed…`, base `9d16e075…`, `run_attempt: 1`, `status: completed`, **`conclusion: success`**; job **`contract`** (`97951496629`) on `ubuntu-latest` / Node 20, `2026-08-25T20:10:09Z -> 20:10:23Z` (**14s**), **all 11 substantive steps `success`** including step 4 `Validate plugin contract` (the new byte-pin), step 8 `Pack generator self-test`, step 9 `Committed pack trees match the generator`, and step 11 the `pull_request`-only real `Release-guard --base --head` gate. **Read directly from `api.github.com` by this run (read-only), not accepted on report.** Local suite operator-attested: `npm test` exit 0 pre-push, plus `pack-preview --self-test` (44 checks), `--all` healthy / `--no-core` / `--contract 2` arms, `--check`, `validate-plugin` (56 agents / 51 skills), `docs:check`, `host-contract --self-test`, `release-guard --self-test`, syntax. **Design sub-gate not triggered** — developer-facing packaging/build tooling with no user-facing interaction surface (`northstar` states the product-design step is not implicated); no waiver invented, none needed. **QA-UI not implicated** for the same reason. |
| 3 | reviewed | **Clear** | Both `review_requirements` entries are satisfied at the **same** ref, which is the item's `change_ref 3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`: `principal-swe-architect` / `independent-architecture` **ratified** 2026-08-25-1248, and `principal-security` / `independent-security` **clear** 2026-08-25-1257 (P0 0 / P1 0 / P2 2, assessment artifact linked above). Every blocking finding is closed on the record: **A1** (unpinned contract-version literal, fail-open direction) closed by deleting the second prose literal and pinning the survivor by set-cardinality — re-read here at `scripts/validate-plugin.mjs:374–378` and `scripts/lib/preflight-block.txt` (exactly one `contract: 1`); **A2** (position upper bound) closed at `validate-plugin.mjs:416–425`; **N1** (stale README roster count) closed at `README.md:168` = 56 agents / 51 skills. Non-blocking items are owned, not dropped (dim-1). PR #154's body publicly restates both bindings. **Stated plainly:** head-vs-ref byte-identity is an operator attestation this run could not re-derive; it is re-checked mechanically as deploy step 1. |
| 4 | shippable-safely | **Clear (proportional)** | `review-rollout-operability` applied and right-sized — verdict **Holds**. No runtime service, no data, no migration, no external state, no publication change, no user-facing surface. The injected block only exists in **generated** pack trees, and none are committed or published (`COMMITTED_PACKS = []`), so the shipped monolith's 56 agents are byte-unaffected; the one thing consumers receive is an inert 51st skill that is not `user-invocable` and inherited by nobody. Fail-closed by construction, and the fail-open shape the earlier refs carried is now unconstructible (one version literal, refusal defined as its complement). Pre-merge reversibility is total; post-merge is one revert. Real blast radius, named: every future PR in this repo now also gates on the preflight byte-pin, adjacency and probe assertions — already green on `ubuntu-latest`, the runner those PRs use. Signals + owner below. |
| 5 | documented | **Clear** | `CHANGELOG.md` `## [0.59.0] - 2026-08-25` (Added ×4, Changed ×2) with the `[0.59.0]: …compare/v0.58.0...v0.59.0` link — and the `v0.58.0` tag it compares against exists (`.git/refs/tags/v0.58.0`), so the link is not dangling; `README.md:34` `## Status` `v0.59.0` — 56 agents / 51 skills, matching `:168`; catalog `docs/reference/agents-and-skills.md` and the host inventory fixture `test/fixtures/inventory.json` both carry the new skill at 51 (proved by `docs:check` + `host-contract --self-test`). This release record is written (library zone, promotion owed — see the note above) and indexed in `kai/initiatives/pack-split/deliverables.md`; `kai/initiatives/pack-split/log.md` carries the **release-ready** entry. The **ship** stamp is deliberately withheld — it has not shipped. |
| 6 | coordination-closed | **Clear** | Item record current and truthful (v12 -> v14, `in-review -> release-ready`, `resume_state: null`, lease self-granted for the gate and **cleared**, `next_role: "@operator"`), acceptance criterion 6 ticked **with the run URL**, not by assertion. This record's deploy HANDOFF is appended to the thread; `BOARD.md` and `ACTIVE.md` refreshed. `depends_on: pack-split-generator-gates (requires: shipped)` verified satisfied at its v17 record. `waiting_on_questions: []`; the three open initiative questions remain non-blocking. **No dependent is cleared by this gate** — `pack-split-degraded-refusal` and `pack-split-ci-partition-checks` require this item at **`shipped`**, which it is not, so both stay non-dispatchable; `pack-split-crosspack-validator` still overlaps this item on `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs`, so the touch-conflict check at dispatch still applies. |

**Readiness verdict: RELEASE-READY.** No dimension is Waived; none needed to be.

### What closed since the security handback

Exactly one thing, and it is the thing only CI could close. Security predicted
this gate would bounce on the unticked "`validate` green on the pushed PR"
criterion, because at 2026-08-25-1257 nothing was committed and the branch still
sat at `9d16e075…`. Between then and now the operator committed (`d4145eed…`),
pushed, and opened PR #154, and the required check ran green on `ubuntu-latest`.
That prediction was correct **and is now superseded by evidence**, so the gate
passes rather than bounces — verified here against the GitHub API, not accepted
on report.

### Environment limits, stated up front

This run had **no shell** (read/search/edit/fetch only). Consequences, recorded
rather than papered over:

- **Verified here, read-only:** PR #154 metadata, the `validate` run and its job
  step list (`api.github.com`), local refs/reflog (`.git/refs/**`,
  `.git/logs/HEAD` — branch and `origin/` branch both at `d4145eed…`, `main` and
  `origin/main` both at `9d16e075…`, exactly one commit on the branch), and the
  working-tree content of every file the reviews and acceptance criteria turn on.
- **Operator-attested, not re-derived:** byte-identity between `3383d7f2…` and PR
  head `d4145eed…`; local `npm test` exit 0. Both are re-checked mechanically at
  deploy steps 1–2, which fail closed.
- `api.github.com` began returning **403** (rate limit) partway through, so the
  PR *file list* and a `GET /contents/packs?ref=d4145eed…` 404 could **not** be
  re-derived at the head. The `packs/`-absence and marketplace-N=1 claims above
  are read from the checked-out tree at `d4145eed…` (branch head = worktree) and
  are re-verified on `main` at production verification.

---

## Rollout plan

**Single-step: squash-merge PR #154 into `main`, then tag and release `v0.59.0`.**
Big-bang is justified, not conceded — there is no runtime service, no data, no
external state, and no published pack to ramp. The "rollout" is a repository
state change plus a version tag.

- **Blast radius (real, bounded):**
  1. *Repo:* every future PR's `contract` check now also enforces the canonical
     preflight block's existence, its single pinned contract version, the probe
     skill's marker/version, exactly-one verbatim copy in each generated
     department agent, core exclusion, and preflight adjacency. Already green on
     the runner every future PR uses.
  2. *Consumers:* `/plugin update kai` resolves the same single `kai` plugin at
     `source: "."`; they receive a 51st skill (`kai-core-contract-v1`) that is
     **inert** — not `user-invocable`, inherited by no agent, and no shipped
     agent body carries the preflight.
  3. *Downstream items:* `pack-split-degraded-refusal` inherits a mechanically
     enforced ordering constraint (its block must land **after** the preflight).
- **Monitoring signals:** the `validate` workflow on `main` at the merge commit
  (push event — the PR-only release-guard step is correctly skipped); then the
  `contract` runs on the next one or two PRs from any contributor, which is where
  a brittle new pin would surface.
- **Owner at 3am:** `principal-swe-infra` (item owner).

## Rollback plan

**Clean and complete — nothing here is one-way.**

- **Before merge:** do not merge. Reversibility is total.
- **After merge, before tagging:** revert the squash-merge commit —
  `git revert <merge-sha>` on `main`, or the **Revert** button on PR #154.
- **After tagging/releasing:** the revert above **plus** delete the `v0.59.0` tag
  and its GitHub release, otherwise a published release points at a reverted
  tree. Reverting before tagging avoids this entirely — prefer it.
- **What a rollback does NOT undo:** nothing durable. No data migration, no
  backfill, no schema change, no external state, no committed `packs/` tree, no
  marketplace change. The single residue is that any consumer who ran
  `/plugin update kai` between merge and revert holds a local `0.59.0` copy until
  they update again — and that copy is inert (an unreferenced probe skill), so it
  changes no agent's behaviour.
- **Not a rollback path:** hand-editing `scripts/lib/preflight-block.txt`,
  `scripts/validate-plugin.mjs`, or the version locations on `main` to "fix
  forward" past a red gate. Revert, then route the defect.

---

## Deploy handoff — the human runs these; kai does not

`workflow-ship` recorded this release. It did **not** merge, tag, release, or
publish anything, and it will not. Steps 1–2 are the mechanical re-checks of the
two operator attestations this gate could not re-derive.

1. **Confirm the PR head still carries the *reviewed* implementation, unchanged.**
   ```bash
   git fetch origin
   git diff --exit-code \
     3383d7f2476f6ccdec5b4d3077783a13fe47eeb7 \
     origin/kai/feat/29-preflight-compat -- \
     .github/plugin/marketplace.json CHANGELOG.md README.md \
     docs/reference/agents-and-skills.md package-lock.json package.json plugin.json \
     scripts/generate-catalog.mjs scripts/lib/pack-plan.mjs scripts/lib/preflight-block.txt \
     scripts/pack-preview.mjs scripts/validate-plugin.mjs \
     skills/kai-core-contract-v1/SKILL.md test/fixtures/inventory.json
   ```
   Must exit 0. Coordination-only records (`kai/**`) may differ — expected, since
   the readiness records written by this gate are not yet committed.
   **Implementation or release-file drift is not allowed**: it voids both review
   bindings and returns the item to the gate.

2. **Commit the readiness records, then confirm the check is green on the *final* head.**
   ```bash
   git add kai/ && git commit -m "docs: record preflight ship gate"
   git push origin kai/feat/29-preflight-compat
   gh pr checks 154            # `contract` must pass on the final head
   ```
   Pushing moves the PR head; the reviews still bind because step 1 proves no
   implementation or release file moved, and `change_ref` therefore stays at
   `3383d7f2…`. Merging first and committing the records to `main` afterwards is
   equally acceptable — but **the required check must be green on whatever head
   you merge**, and run `32893764931` only proves head `d4145eed…`.

3. **Merge PR #154** — GitHub **Squash and merge** (repo convention; GitHub
   auto-appends `(#154)`). Do not push further commits to the branch after the
   final green check. <https://github.com/RubenSaucedo/kai/pull/154>

4. **Watch `validate` on `main`** at the merge commit (push event — 10 steps; the
   PR-only release-guard step is correctly skipped). All green before step 5.

5. **Per `AGENTS.md`, tag and release** once `main` is green:
   ```bash
   git tag v0.59.0 && git push origin v0.59.0
   ```
   then cut the GitHub release from the `[0.59.0]` CHANGELOG section.
   **Release-note language is constrained by security finding P2-S2:** do **not**
   claim pack agents *refuse* — nothing here proves a model obeys the block. The
   truthful claim is that every generated department agent *carries a byte-pinned
   fail-closed instruction*, and that the preview's core-absent and version-skew
   arms print the exact `KAI-CORE-MISSING` token. Do not imply any pack is
   published; none is.

6. **COMPLETED 2026-08-25 — promote this record to its canonical library home**
   (coordination-only; no version bump — `kai/` is not a `BEHAVIOR_PREFIX`):
   ```bash
   mkdir -p kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat
   git mv kai/initiatives/pack-split/artifacts/docs/pack-split-preflight-compat-ship-record.md \
          kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md
   ```

7. **Return the deployment evidence** to `workflow-ship` (below) so CONFIRM-START
   and CONFIRM-COMPLETE can run. Do not mark this item `shipped` by hand.

**Abort criteria — stop and return the item rather than pushing through:**
- step 1's implementation/release diff is non-empty (review bindings void);
- the required `contract` check is not green on the head you are about to merge;
- merge conflict on `main` — a rebase changes the tree, so both the review
  binding and the CI evidence stop applying; return to the gate;
- `validate` red on `main` after merge → **revert first** (rollback plan above),
  then treat it as a real defect and route to `principal-swe-infra`;
- the tag/release step fails after `main` is green → stop; the tag is recoverable
  and nothing is inconsistent yet;
- do **not** hand-edit around a failing release-guard or byte-pin step.

---

## Production verification — the plan as written at PREPARE (executed below; kept for the audit trail)

Proportional to a packaging/build-tooling change with no runtime surface. Every
check below is read-only.

| # | Check | Pass condition |
|---|-------|----------------|
| 1 | **`validate` green on `main`** | Workflow run at the merge commit: `conclusion: success`, `head_sha` = the merge SHA. |
| 2 | **Version coherence on `main`** | `0.59.0` in all eight locations — `plugin.json`, `package.json`, `package-lock.json` (×2), `.github/plugin/marketplace.json` (`metadata.version` + the `plugins[0]` entry), `README.md` `## Status`, `CHANGELOG.md` `## [0.59.0]` + its compare link. |
| 3 | **Marketplace still exactly one entry** | `plugins[]` length **1**, `name: kai`, `source: "."` — no pack entries. |
| 4 | **No `packs/` tree on `main`** | Nothing matches `packs/**`. The committed-unpublished non-negotiable must hold **in production**, not merely at the PR head. |
| 5 | **The probe shipped and is pinned** | `skills/kai-core-contract-v1/SKILL.md` present on `main`, returning `KAI_CORE_READY` + `contract: 1`; `scripts/lib/preflight-block.txt` demands exactly one version and it is `1` — both re-asserted by check 1's `Validate plugin contract` step. |
| 6 | **Tag and release** | `v0.59.0` exists and points at the merge commit; the GitHub release is cut from the `[0.59.0]` section; the `v0.58.0...v0.59.0` compare link resolves. |

**Evidence the operator must return:**

- **CONFIRM-START:** deployment run URL/ID, environment (`main` / GitHub
  Releases), version + SHA being deployed, start timestamp.
- **CONFIRM-COMPLETE:** merge commit SHA and merge timestamp; the `main`
  workflow run URL/ID **with its `conclusion`** (a URL without a successful
  conclusion is not completion); `v0.59.0` tag + release URLs; completion
  timestamp.

If any check fails, the recorded abort/rollback path is invoked **through the
operator**, `production-verification` is captured in `resume_state`, and the item
is set `blocked` with `principal-swe-infra` named. Only `workflow-ship` may later
return it to `release-ready`, and only on rollback evidence.

---

## Production verification — EXECUTED at CONFIRM-COMPLETE 2026-08-25-1328: **PASS**

Proportional to a packaging/build-tooling change with no runtime surface. Every
check below is read-only. **Five of six were re-derived here against the merge
commit itself** — via `raw.githubusercontent.com` and the git-trees/tags APIs at
`67670525808be349466155b836a7fdbbe4dfb8b7`, deliberately *not* the local
worktree, so a dirty checkout could not have produced a false pass.

| # | Check | Pass condition | Result |
|---|-------|----------------|--------|
| 1 | **`validate` green on `main`** | Workflow run at the merge commit: `conclusion: success`, `head_sha` = the merge SHA. | **PASS.** Run `32895404267`, `event: push`, `run_attempt: 1`, `status: completed`, **`conclusion: success`**, `head_sha 67670525808be349466155b836a7fdbbe4dfb8b7`, `display_title: "feat: add fail-closed pack preflight (#154)"`, `20:27:12Z -> 20:27:30Z`. Job-level detail (`97956815622`, 16s) is operator-attested — the jobs endpoint returned **403** — but a run cannot conclude `success` with a failing job. |
| 2 | **Version coherence on `main`** | `0.59.0` in all eight locations. | **PASS.** At the merge commit: `plugin.json`; `package.json`; `package-lock.json` ×2 (root `version` + `packages[""].version`); `marketplace.json` `metadata.version` + `plugins[0].version`; `README.md` `## Status` `v0.59.0` — 56 agents / 51 skills; `CHANGELOG.md` `## [0.59.0] - 2026-08-25`. The compare link (`CHANGELOG.md:2613`) is read from checked-out `main` and is **not dangling**: the API reports `v0.58.0 -> 47aa0549…`. |
| 3 | **Marketplace still exactly one entry** | `plugins[]` length **1**, `name: kai`, `source: "."`. | **PASS.** Exactly one entry, `kai` at `source: "."`, version-only patch. No pack entries. |
| 4 | **No `packs/` tree on `main`** | Nothing matches `packs/**`. | **PASS — proven positively, not inferred.** The merge commit's root tree `25d379d024b1bff7f406f1af8cee8ec971ce73ff` lists `package-lock.json`, `package.json`, `plugin.json` consecutively; `packs` sorts between `package.json` and `plugin.json` in git's byte ordering and **is absent**. `COMMITTED_PACKS = []` still holds in `scripts/lib/pack-plan.mjs` at that commit. |
| 5 | **The probe shipped and is pinned** | `skills/kai-core-contract-v1/SKILL.md` present on `main` returning `KAI_CORE_READY` + `contract: 1`. | **PASS.** Present at the merge commit with the exact two-line marker, `tools: [view]`, and the "version lives in the name" clause. The byte-pin is re-asserted by check 1's green `Validate plugin contract` step. |
| 6 | **Tag and release** | `v0.59.0` exists and points at the merge commit; release cut; compare link resolves. | **PASS.** `.git/refs/tags/v0.59.0` is the annotated **tag object** `338cfb04cb06bb689ca3522ac3f934a1e256b1fe`; peeled via `GET /repos/RubenSaucedo/kai/tags` to commit `67670525808be349466155b836a7fdbbe4dfb8b7` — the merge commit. Release `376694649` published 2026-08-25T20:28:01Z, not draft, not prerelease. |

**Release-note language checked against security P2-S2 — by reading the published
body, not by report.** It claims generated department-agent bodies "carry a
canonical, byte-pinned fail-closed compatibility instruction" and that the
**preview arms** emit `KAI-CORE-MISSING`. It does **not** claim a pack agent
*refuses* — the claim no evidence supports yet — and it states outright that no
`packs/` tree is committed and the marketplace still exposes only the monolithic
`kai` plugin. **Compliant.**

**Environment limits, stated rather than absorbed.** No shell. `api.github.com`
intermittently returned **403** (rate limit), which blocked the per-job step list
and the `git/tags` peel endpoint; both were worked around with *stronger or
equal* read-only sources (run-level conclusion; the `tags` listing, which returns
the peeled commit) rather than downgraded to assertion. The only claim resting on
operator attestation alone is the job's step-level breakdown, and it is subsumed
by the run's `success`.

**Rollback was never invoked.** No revert, no tag deletion, no release deletion.

---

## Deployment record (operator-executed; kai executed nothing)

| Fact | Value |
|------|-------|
| PR | #154, **squash-merged** 2026-08-25T20:27:09Z |
| Merge commit on `main` | `67670525808be349466155b836a7fdbbe4dfb8b7` |
| Environment | `main` + GitHub Releases |
| Version | `0.58.0 -> 0.59.0` |
| Deployment run | <https://github.com/RubenSaucedo/kai/actions/runs/32895404267> — started 20:27:12Z, **`conclusion: success`** 20:27:30Z |
| Tag | annotated `v0.59.0` -> the merge commit |
| Release | <https://github.com/RubenSaucedo/kai/releases/tag/v0.59.0>, published 20:28:01Z |
| Rollback | **not invoked** |

**Final state: `shipped`** — reached 2026-08-25-1328 by
`release-ready -> deploying -> production-verification -> shipped`, no state
skipped. Deploy steps 1–3 (reviewed-diff check, final-head green, squash-merge)
were executed by the operator; this run verified their *outcome* on `main` rather
than re-running them.

---

## Follow-ups / parked

- **P2-S1 (security, non-blocking) — PROPOSAL parked** in
  `kai/initiatives/pack-split/backlog.md`: the generated-agent pin is gated on
  `/^kai-[a-z]+\/agents\/.+\.agent\.md$/`, so a future hyphenated or digit-bearing
  pack key would silently escape the copy-count/position/adjacency assertions.
  Coverage is complete today. Owner `principal-swe-infra`; natural home
  `pack-split-ci-partition-checks`; **filing is the steward's call** — this gate
  created no item.
- **P2-S2 (evidence gap)** — no host-run evidence that an agent carrying the block
  actually refuses. Owed by `pack-split-host-gates`; binds release-note language
  (deploy step 5).
- **N2 watch condition / R1 authenticity** — `tools: [view]` acceptance is
  conditional on shipped-fleet capability, and the probe proves availability and
  compatibility, **not authenticity**. Both belong to
  `pack-split-host-semantics-spike`; R1 is the operator's call **at publication**,
  which is not this release.
- **N3 / N4** — notes for whoever performs the contract bump (`pack-preview`'s
  `contract === 1` is a mode selector that fails loudly; the pin matches
  `` `contract: N` `` forms). Recorded on the item; no work created.
- **Library promotion of this record** — deploy step 6 above.
- **Nothing is unblocked by this record** *(true at PREPARE; superseded at
  CONFIRM-COMPLETE 2026-08-25-1328)*. With this item now `shipped`:
  **`pack-split-degraded-refusal` is unblocked** — this was its sole dependency —
  though its touch overlap with `pack-split-crosspack-validator` still makes the
  dispatch-time conflict check real. **`pack-split-ci-partition-checks` stays
  blocked** on `pack-split-crosspack-validator` (still `ready`), with one of two
  dependencies now met. `pack-split-generated-pack-trees` has two of six met and
  stays `proposed`, outside `scope.current`. `dependency-guarantees` moves to
  **2 of 5 required items `shipped`** and remains **OPEN**.

---

**Boundary, restated because it is the point:** `workflow-ship` gated and recorded
this release. The merge, the tag, the GitHub release, and every command in the
deploy handoff are the **operator's** to run. This item is `release-ready`, not
`shipped`.

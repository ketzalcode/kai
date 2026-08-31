---
# <!-- kai:allow-legacy-roots -->
type: releases
title: Ship record — canonical degraded-mode refusal instruction carried by every generated department agent, CI-pinned
slug: pack-split-degraded-refusal-ship-record
created: 2026-08-25
source: workflow-ship (PREPARE gate) — kai/coordination/items/pack-split-degraded-refusal.md
target: pack-split degraded-mode refusal
initiative: pack-split
source_artifact: null
canonical_path: docs/kai/reports/releases/2026-08-25/03-ship-pack-split-degraded-refusal/ship-record.md
promotion: completed 2026-08-25 — canonical library home
related:
  - kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md
  - kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-degraded-refusal.md
  - kai/initiatives/pack-split/artifacts/security/pack-split-degraded-refusal.md
evidence:
  - path: https://github.com/RubenSaucedo/kai/pull/158
    source: GitHub PR #158 "feat: add degraded-mode refusal" — open, `draft: false`, `mergeable: true`, `mergeable_state: clean`, 1 commit, +2152/-100 across 17 files, head `75053e08…`, base `e679de9d…` (read here at PREPARE from `api.github.com`)
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32908330221/job/97997128517
    source: check run `contract` (id `97997128517`), `head_sha 75053e08551e6865df501e85d25888b19693af72`, `status: completed`, **`conclusion: success`**, 2026-08-25T22:54:13Z -> 22:54:25Z (**12s**); the only check run on that head (`total_count: 1`) — read here from `api.github.com/commits/<sha>/check-runs`
  - path: https://api.github.com/repos/RubenSaucedo/kai/check-runs/97997128517/annotations
    source: the run's single annotation is `annotation_level: warning` — "Node.js 20 is deprecated … actions/checkout@v4, actions/setup-node@v4" — pre-existing, not a failure and not caused by this change
  - path: https://raw.githubusercontent.com/RubenSaucedo/kai/75053e08551e6865df501e85d25888b19693af72/scripts/lib/degraded-block.txt
    source: canonical block read at the PR head and compared against the local worktree copy the two reviews were read from — identical
  - path: kai/coordination/items/pack-split-degraded-refusal.md
    source: authoritative work item (v8 -> v9 at PREPARE, `in-review -> release-ready`); `## Review — independent architecture (ratification), 2026-08-25-1516` and `## Review — independent security, 2026-08-25-1540` are the durable review records
  - path: kai/coordination/threads/pack-split-degraded-refusal.md
    source: item thread — build HANDOFF 2026-08-25-1518, operator verification HANDOFF 2026-08-25-1525, ratification HANDOFF 2026-08-25-1516, security-clear HANDOFF 2026-08-25-1540, deploy HANDOFF 2026-08-25-1554
  - path: kai/initiatives/pack-split/backlog.md
    source: six PROPOSALs parked at this gate (A1, E1, §147 errata, P2-D1, P2-D2, P2-D3) plus a blast-radius update recording P2-S1/N1 + N3 on the already-parked pin-pattern proposal — nothing routed by a reviewer was dropped
  - path: https://github.com/RubenSaucedo/kai/commit/680ca445a2616bc9bc1b972db6b40042c06abf6c
    source: 'merge commit of PR #158 on `main` (squash), 2026-08-25T23:12:06Z, single parent `e679de9d…` = the PREPARE base (no rebase), signature `verified: true` — read at CONFIRM-START from `api.github.com`'
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32909692506
    source: '`main` `validate` run — `event: push`, `run_attempt: 1`, `head_sha 680ca445…`, `status: completed`, **`conclusion: success`**, 23:12:10Z -> 23:12:29Z; job `contract` `98001208870` `success` in 16s with 10 substantive steps green (incl. `Validate plugin contract`, `Pack generator self-test`) and the `pull_request`-only release-guard step correctly skipped; `check-runs` on the merge SHA `total_count: 1`'
  - path: https://github.com/RubenSaucedo/kai/releases/tag/v0.61.0
    source: 'release id `376770741`, `draft: false`, `prerelease: false`, published 2026-08-25T23:12:37Z, from annotated tag object `e88857db…` peeling to the merge commit; body read in full and confirmed to claim carriage + CI enforcement only, explicitly disclaiming measured refusal, graceful degradation and any pack publication'
---

# Ship Record — canonical degraded-mode refusal instruction, CI-pinned

**Work item:** `pack-split-degraded-refusal`  ·  **Initiative:** `pack-split`
**Milestone:** `dependency-guarantees`  ·  **Delivery class:** `product-change`
**Target:** pack-split degraded-mode refusal
**Date:** 2026-08-25 15:54 local (America/Los_Angeles, UTC-07:00) — recorded as
**2026-08-25-1554** so the append-only record stays ordered behind the security
review's `1540` entry.
**Run:** `workflow-ship` — **PREPARE** (`in-review -> release-ready`) 2026-08-25-1554,
then **CONFIRM-START + CONFIRM-COMPLETE** (`release-ready -> deploying ->
production-verification -> shipped`) 2026-08-25-1612.
**State reached: SHIPPED** — `v0.61.0` merged to `main` as
`680ca445a2616bc9bc1b972db6b40042c06abf6c`, `main` run `32909692506`
**`conclusion: success`**, production verification **8 of 8 PASS**, tag and release
published against that exact commit. **The operator executed every deployment
action; kai merged, tagged, released and published nothing** and re-derived the
production facts read-only. **No rollback was invoked.** *(The PREPARE text below
is preserved verbatim as the audit trail; the executed verification and the
deployment record are appended at the end.)*

**What shipped (one line):** one canonical block of text
(`scripts/lib/degraded-block.txt`) that the authoritative generator copies into
**every generated department agent's own body**, immediately after the core
preflight, and that CI pins byte-for-byte — so every generated department body
**carries a pinned refusal instruction** for the one state the preflight cannot
cover (core answered and is compatible, and the shared operating contract is
still not in the session); released as `0.61.0` of the existing single `kai`
plugin, with **no `packs/` tree committed and no pack published**.

> **Language constraint, binding on this record and on the release note.**
> Per the security review's truth-binding (`P2-S2`, extended), the evidenced
> claim is *carriage, order, count and text* — every generated department agent
> **carries a pinned, correctly ordered refusal instruction that cannot drift
> from core**. This record does **not** claim that any agent *refuses*, *detects*
> contract loss, or *degrades gracefully*. The block's trigger is
> **model-evaluated self-report**, unlike the preflight's probe-evaluated
> artifact; its effectiveness is **unmeasured**, and the CI pin is on the text
> being present, unique, ordered and unaltered — never on a model obeying it.

**Change:**
- PR: <https://github.com/RubenSaucedo/kai/pull/158> — *feat: add degraded-mode refusal*
- Branch `kai/feat/29-degraded-refusal` head **`75053e08551e6865df501e85d25888b19693af72`**
  (read from `.git/refs/heads/kai/feat/29-degraded-refusal`, from the branch reflog —
  a single `commit:` entry `e679de9d… -> 75053e08…` — and independently from the
  GitHub API's PR `head.sha` / `statuses_url`; all three agree)
- Base `main` **`e679de9d41187614e9765e00ec3e20dafff9ec0c`** — the API's PR base SHA
  is byte-identical to local `.git/refs/heads/main`, so **the branch is exactly one
  commit ahead of `main` with no divergence**
- Review binding (`change_ref`): **`8d3ef4844988f4974e6bec8f406a7723dee4e942`**
- Version: `0.60.0 -> 0.61.0`  ·  Size: +2152 / -100 across **17** files, 1 commit
- **Not deployed.** No merge, no tag, no release, no publication.

> **Why `change_ref` is not the PR head.** Both required reviews bind
> `8d3ef484…`, the non-destructive `git stash create` object minted over the
> validated worktree at 2026-08-25-1525 — the fourth time this initiative has used
> that mechanism (`a15bd823…`, `96b693a1…`, `3383d7f2…`). Per
> `kai-core-work-coordination`, `change_ref` moves **when the implementation
> changes**; the operator attests that every implementation and release file at PR
> head `75053e08…` is byte-identical to that object, so the binding is preserved
> rather than re-minted and both reviews re-run. **That attestation is not fully
> re-derivable in this environment (no shell — the stash object cannot be decoded
> here)**, and both reviewers bound conditionally on it. It is therefore converted
> into **deploy step 1**, a mechanical `git diff --exit-code` that fails closed.
> Partial corroboration was obtained here: `scripts/lib/degraded-block.txt` read at
> the PR head via `raw.githubusercontent.com` is identical to the local worktree
> copy the two reviews were read from.

---

## DoD gate — all six dimensions

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | Diff = the item's declared `touches` (minus `.github/workflows/validate.yml`, declared and deliberately **not** changed) + release metadata + coordination records. Inside `northstar.scope.current: [dependency-guarantees]`; `scripts/lib/`, `scripts/pack-preview.mjs`, `scripts/validate-plugin.mjs` and `plugin.json` are all named `scope.targets`. **File set derived, not asserted:** the API reports **17** changed files; the list runs `.github/plugin/marketplace.json` -> `CHANGELOG.md` -> `README.md` -> `kai/coordination/ACTIVE.md` with **nothing between `README.md` and `kai/`** (so no `agents/`, `docs/`, `examples/`, `hooks.json`), and **terminates at `scripts/validate-plugin.mjs`** (so no `packs/`, `skills/`, `test/`) — leaving exactly 11 interior slots for the 11 remaining expected paths. **Non-negotiables re-read on disk, not assumed:** `COMMITTED_PACKS = []` (`scripts/lib/pack-plan.mjs:117`), no `packs/` tree (glob `packs/**` → no match), marketplace still **exactly one** plugin `kai` at `source: "."` with a version-only patch (`0.60.0 -> 0.61.0`, both fields, read from the PR patch), groundwork still on `0.x`, and root `agents/` + `skills/` untouched — all 56 agents and 51 skills byte-unchanged. Reviewer findings routed, not smuggled: **six** PROPOSALs parked in the initiative backlog at this gate, plus a blast-radius update on an existing one (*Follow-ups*). |
| 2 | verified | **Clear** | **Criterion 6 — "the `validate` workflow runs green on the pushed PR" — closed with a workflow run, read here from `api.github.com` rather than accepted on report:** check run `contract` id **`97997128517`**, `head_sha 75053e08551e6865df501e85d25888b19693af72`, `status: completed`, **`conclusion: success`**, 22:54:13Z -> 22:54:25Z (**12s**), run **`32908330221`**; `total_count: 1`, so this is the *only* check on that head and no second, red check is hiding behind it. On a `pull_request` event that job runs all 8 substantive steps of `.github/workflows/validate.yml`, including `Validate plugin contract` (which materialises the generator's trees and applies the new pins) and `Pack generator self-test`. Its one annotation is a **warning** (Node-20 runner deprecation on `actions/checkout@v4` / `setup-node@v4`) — pre-existing, unrelated, not a failure. **Criterion 5 — local suite — operator-attested** (thread HANDOFF 2026-08-25-1525): full `npm test` **exit 0**, `pack-preview --check` passed, all five `--all --out` preview trees generated, temp output removed; `package.json`'s `test` script was read here and does chain `validate-plugin.mjs`, `pack-preview.mjs --self-test` and `--check`, so one exit-0 covers all three named commands. **`--check` is vacuous for this item** (`pack-preview.mjs:281-283` returns early while `COMMITTED_PACKS` is empty and `packs/` is absent — architecture's N2, confirmed independently by security); it is recorded as passing and **explicitly not counted** as evidence that anything is injected or pinned. **Design sub-gate not triggered, no waiver invented:** no net-new or materially-changed user-facing surface — no pack is generated, committed or published at this ref, and every shipped agent/skill body is byte-identical, so a consumer running `/plugin update kai` receives version metadata, README and CHANGELOG only. `principal-qa-ui` not implicated for the same reason. |
| 3 | reviewed | **Clear** | Both `review_requirements` are satisfied at the item's own `change_ref 8d3ef4844988f4974e6bec8f406a7723dee4e942`: `principal-swe-architect` / `independent-architecture` / **`ratified`** 2026-08-25-1516 (record: `kai/initiatives/pack-split/artifacts/decisions/pack-split-degraded-refusal.md`) and `principal-security` / `independent-security` / **`clear`** 2026-08-25-1540, **P0: 0 · P1: 0 · P2: 4**, none blocking, **no residual risk accepted** (record: `kai/initiatives/pack-split/artifacts/security/pack-split-degraded-refusal.md`). Both `completed_reviews` entries carry that exact ref, so the "same ref, both reviews" rule holds. **Zero findings deleted:** A1, E1, the §147 errata, P2-D1/D2/D3 and P2-S1/N1 + N3 are all parked as PROPOSALs with named owners (*Follow-ups*). **Stated plainly:** head-vs-`change_ref` byte-identity is an operator attestation this run could not fully re-derive (no shell), and both reviewers bound conditionally on it — it is re-checked mechanically as **deploy step 1**, and drift there voids both bindings and returns the item to this gate. |
| 4 | shippable-safely | **Clear (proportional)** | `review-rollout-operability` applied and right-sized — verdict **Holds**. No runtime service, no data, no migration, no schema, no external state, no publication change, no user-facing surface: the change is generator + validator + preview logic, one new 840-byte text asset, and release metadata. A canary, a feature flag, a ring rollout and an ops runbook are **not applicable** to a build-time gate and are deliberately **not invented**; reversibility is the safety mechanism and it is total (below). **Fail direction is closed, asserted in both directions over real generator output:** `validate-plugin.mjs:428-482` requires the exact bytes, **exactly one** copy per generated department agent, **zero** in every core agent (`:451`), the preflight still first after the inherits directive, and the refusal immediately after it with only whitespace between (`:477-481`); order is stated once (`pack-plan.mjs:280`) and spliced once (`:286`), so the double-injection inversion architecture predicted is unconstructible. The honest blast radius is **this repo's CI** plus **the next contributor who edits that file or the block order** — named below. |
| 5 | documented | **Clear** | `CHANGELOG.md` `## [0.61.0] - 2026-08-25` (Added ×2, Changed ×2) with the `[0.61.0]: …compare/v0.60.0...v0.61.0` link — **not dangling**: `refs/tags/v0.60.0` = `d5cd9590…` in `.git/packed-refs`. `README.md` `## Status` reads `v0.61.0` — 56 agents / 51 skills (inventory unchanged). Version coherent across **all six** locations: `plugin.json`, `package.json`, `package-lock.json` (root **and** `packages[""]`, both read), `marketplace.json` `metadata.version` **and** the `kai` entry. Durable decisions promoted: the architecture decision record and the security assessment are both committed initiative artifacts. This release record sits in the library zone and is indexed in `kai/initiatives/pack-split/deliverables.md`; `kai/initiatives/pack-split/log.md` carries the **release-ready** entry. The **ship** stamp is deliberately withheld — it has not shipped. No ops runbook is implicated (no runtime surface). |
| 6 | coordination-closed | **Clear** | Item record current and truthful (v8 -> v9, `in-review -> release-ready`, `resume_state: null`, `lease: null`, `next_role: "@operator"`), acceptance criteria 1–6 ticked **with their evidence**, criterion 6 with the run URL. Deploy HANDOFF appended to the thread; `BOARD.md` and `ACTIVE.md` refreshed. `depends_on: pack-split-preflight-compat (requires: shipped)` verified satisfied at its **v17 `shipped`** record. `waiting_on_questions: []`; the three open initiative questions remain non-blocking. **No dependent is cleared by this gate** — `pack-split-generated-pack-trees` requires this item at `shipped`, which it is not; `pack-split-ci-partition-checks` still overlaps it on `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs` and `scripts/pack-preview.mjs`, so its touch-conflict check at dispatch applies harder, not less. Milestone `dependency-guarantees` stays at **3 of 5** required items `shipped` — `release-ready` is not `shipped`. |

**Readiness verdict: RELEASE-READY.** No dimension is Waived; none needed to be.

### What closed since the security review

Exactly one thing, and it is the thing only CI could close. At 2026-08-25-1540
`principal-security` explicitly predicted *"a DoD bounce on the unticked
local-command and CI-green-on-the-pushed-PR criteria"* — correct at the moment it
was written, because no branch commit and no PR existed. Between then and now the
operator committed `75053e08…`, pushed the branch and opened PR #158, and the
required `contract` check ran **green on that exact head**. That run was read here
against the GitHub API rather than accepted on report, so the gate passes instead
of bouncing. Criteria 1–4 were already implemented-and-read; they are ticked now
because the checks that assert them (`validate-plugin`, `pack-preview --self-test`)
ran green both locally and in CI — not because the code was read.

### Environment limits, stated up front

This run had **no shell** (read / search / fetch / edit only). Recorded rather
than papered over:

- **Re-derived here, read-only:** PR #158 metadata; the `contract` check run, its
  conclusion, timing and its single warning annotation; the changed-file count
  with its first four and its last filename; `scripts/lib/degraded-block.txt` at
  the PR head; local refs and reflogs (`.git/HEAD`, `.git/refs/heads/**`,
  `.git/logs/refs/heads/**`, `.git/packed-refs`); and on disk —
  `COMMITTED_PACKS = []`, `guaranteeBlocks` / `injectBlocks` / `materializePacks`,
  the `validate-plugin` refusal pins, the six version locations, the CHANGELOG
  section and compare link, and the absence of `packs/`.
- **Not fully re-derived:** **11 of 17** filenames rest on the count identity plus
  the alphabetical boundaries above rather than on a direct read of each entry
  (`api.github.com` paging cost); deploy step 1 converts that inference into a
  mechanical check.
- **Operator-attested, not re-derived:** byte-identity between `8d3ef484…` and PR
  head `75053e08…`; the local suite (`npm test` exit 0, `--check`, five preview
  trees). Both are re-checked at deploy steps 1 and 3, which fail closed.
- **Never attempted:** decoding the stash object, or any write to the remote.

---

## Rollout plan

**Big-bang — and justified.** There is nothing to stage: the change is build-time
generator/validator logic plus one text asset and release metadata, with no
runtime path, no user cohort, no data and no publication change.

- **Staging mechanism:** none, deliberately. A flag or canary on a build-time pin
  would create a second configuration to keep in sync for a check whose only
  "users" are future PRs in this repository.
- **Blast radius, named honestly:**
  1. **This repo's CI** — every future PR and push to `main` now additionally
     asserts, inside the existing `Validate plugin contract` and `Pack generator
     self-test` steps, that the refusal block is present exactly once, byte-exact,
     immediately after the preflight in every generated department agent, absent
     from every core agent, and that the canonical file still restates no rule.
     Green today on the live corpus, `ubuntu-latest`, 12s end to end.
  2. **The next contributor who edits `scripts/lib/degraded-block.txt`, the block
     order, or the pack-key naming** — an added affirmative bullet, a cited skill,
     a line lifted from a live `kai-core-*` skill, the preflight's
     `KAI-CORE-MISSING` token, a second contract-version literal, an over-budget
     block, or a re-anchored injection now **fails the build by name**. That is the
     point, and it is the one way this change can surprise someone.
  3. **`pack-split-ci-partition-checks`** shares `scripts/lib/pack-plan.mjs`,
     `scripts/validate-plugin.mjs` and `scripts/pack-preview.mjs`; after merge
     those surfaces have moved again, so that item must read this diff rather than
     assume it.
  4. **Consumers of the published `kai` plugin** — **no behavioural change
     whatsoever**; 56 agents and 51 skills are byte-identical. They receive
     `0.61.0` metadata, README and CHANGELOG. Nothing in this release reaches an
     installed agent body, because no pack is committed or published.
- **Monitoring signals:** the `validate` workflow on `main` at the merge commit
  (`conclusion`), specifically its `Validate plugin contract` and `Pack generator
  self-test` steps; the `v0.61.0` tag/release peel.
- **Owner at 3am:** `principal-swe-infra` (item owner). Escalation for a design
  question on the seam: `principal-swe-architect`; on the trust boundary:
  `principal-security`.

## Rollback plan

**Clean and complete — nothing here is one-way.**

- **Before merge:** do not merge. Reversibility is total.
- **After merge, before tagging:** revert the merge commit — `git revert <merge-sha>`
  on `main`, or the **Revert** button on PR #158.
- **After tagging/releasing:** the revert above **plus** delete the `v0.61.0` tag
  and its GitHub release, otherwise a published release points at a reverted tree.
  Reverting before tagging avoids this entirely — prefer it.
- **What a rollback does NOT undo:** nothing durable. No data migration, no
  backfill, no schema change, no external state, no committed `packs/` tree, no
  marketplace pack entry, no publication. The single residue is that a consumer
  who ran `/plugin update kai` between merge and revert holds a local `0.61.0`
  copy until they update again — and that copy is **behaviourally identical** to
  `0.60.0`, since no agent or skill body changed.
- **Not a rollback path:** hand-editing `scripts/lib/degraded-block.txt`,
  `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs`,
  `scripts/pack-preview.mjs` or the version locations on `main` to "fix forward"
  past a red gate, and **not** relaxing a new pin to make a failing generated agent
  pass. Revert, then route the defect to `principal-swe-infra`.
- **If rollback is invoked:** return the evidence here. Only `workflow-ship`
  deliberately returns this item to `release-ready`, after rollback evidence shows
  the environment is safe. Do not open a duplicate rollback item.

---

## Deploy handoff — the human runs these; kai does not

`workflow-ship` recorded this release. It did **not** merge, tag, release or
publish anything, and it will not. Steps 1 and 3 are the mechanical re-checks of
the two operator attestations this gate could not re-derive.

1. **Confirm the PR head still carries the *reviewed* implementation, unchanged —
   and that nothing else rode along.** Run this **before** committing the records.
   ```bash
   git fetch origin
   git diff --exit-code \
     8d3ef4844988f4974e6bec8f406a7723dee4e942 \
     origin/kai/feat/29-degraded-refusal -- \
     .github/plugin/marketplace.json CHANGELOG.md README.md \
     package-lock.json package.json plugin.json \
     scripts/lib/degraded-block.txt scripts/lib/pack-plan.mjs \
     scripts/pack-preview.mjs scripts/validate-plugin.mjs

   git diff --name-only e679de9d41187614e9765e00ec3e20dafff9ec0c \
                        origin/kai/feat/29-degraded-refusal
   ```
   The first command must exit 0 — that is the whole of the review binding. The
   second must list **exactly 17** paths: the ten above plus
   `kai/coordination/ACTIVE.md`, `kai/coordination/BOARD.md`,
   `kai/coordination/items/pack-split-degraded-refusal.md`,
   `kai/coordination/threads/pack-split-degraded-refusal.md`,
   `kai/initiatives/pack-split/artifacts/decisions/pack-split-degraded-refusal.md`,
   `kai/initiatives/pack-split/artifacts/security/pack-split-degraded-refusal.md`
   and `kai/initiatives/pack-split/log.md` — with **no** path under `agents/`,
   `skills/`, `packs/`, `docs/` or `test/`, and **no** change to
   `.github/workflows/validate.yml`. Anything else is scope drift: stop and return
   the item.

2. **Finish this record's promotion, then commit the readiness records**
   (coordination + library only — `kai/` is not a `BEHAVIOR_PREFIX`, so no further
   version bump is owed). This environment cannot create directories, so the move
   is yours; doing it **here** keeps it inside the same records commit, so no
   post-ship reconciliation is owed (the `0.58.0` record needed one).
   ```bash
   mkdir -p kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal
   git mv kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal.md \
          kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal/ship-record.md
   git add kai/ && git commit -m "docs: record degraded-refusal ship gate"
   ```
   This commit adds the ship record plus
   `kai/initiatives/pack-split/{deliverables.md,backlog.md}` to the path list —
   expected, coordination-only, and the reason step 1 runs first.

3. **Push, then confirm the required check is green on the *final* head.**
   ```bash
   git push origin kai/feat/29-degraded-refusal
   gh pr checks 158            # `contract` must pass on the final head
   ```
   Pushing moves the PR head; the reviews still bind because step 1 proves no
   implementation or release file moved, so `change_ref` stays at `8d3ef484…`.
   Merging first and committing the records to `main` afterwards is equally
   acceptable — but **the required check must be green on whatever head you
   merge**, and run `32908330221` only proves head `75053e08…`.

4. **Merge PR #158** — GitHub **Squash and merge** (repo convention; GitHub
   auto-appends `(#158)`). The PR reports `mergeable_state: clean` against
   `e679de9d…`, which is current `origin/main`, so no rebase is needed — and a
   rebase would change the tree and void both review bindings and the CI evidence.
   Do not push further commits after the final green check.
   <https://github.com/RubenSaucedo/kai/pull/158>

5. **Watch `validate` on `main`** at the merge commit (push event — the
   `pull_request`-only `Release-guard --base --head` step is correctly skipped; the
   other 8 substantive steps must be green). All green before step 6.

6. **Per `AGENTS.md`, tag and release** once `main` is green:
   ```bash
   git tag v0.61.0 && git push origin v0.61.0
   ```
   then cut the GitHub release from the `[0.61.0]` CHANGELOG section.
   **Release-note language is constrained by what was actually proven.** The
   truthful claim is that **every generated department agent now carries a pinned,
   byte-exact, correctly ordered refusal instruction** for the state the preflight
   cannot cover, and that CI fails by name if that text is missing, duplicated,
   misplaced, altered, or grows into a second copy of the contract. Do **not**
   claim that agents *refuse*, *detect* contract loss, or *degrade gracefully* —
   the trigger is model-evaluated and its effectiveness is unmeasured. Do **not**
   claim any pack is generated, committed or published (`COMMITTED_PACKS = []`, no
   `packs/` tree, marketplace still N=1), do **not** say "every pack" without
   "department" (core agents deliberately carry neither block), and do **not**
   imply the split is done.

7. **Return the deployment evidence** to `workflow-ship` (below) so CONFIRM-START
   and CONFIRM-COMPLETE can run. Do not mark this item `shipped` by hand.

**Abort criteria — stop, and return the item rather than pushing through:**
- step 1's implementation/release diff is **non-empty** — the reviews no longer
  bind, and a new ref must be minted and re-reviewed by **both** roles;
- step 1's name list is not exactly those 17 paths (+2 from step 2), or contains
  anything under `agents/`, `skills/`, `packs/`, `docs/` or `test/` — scope drift;
- `contract` is red on the head you intend to merge, or `mergeable_state` is no
  longer `clean`;
- `main` is red at the merge commit — **revert before tagging** (rollback plan),
  and return the evidence here.

---

## Production verification — the plan as written at PREPARE (executed below; kept for the audit trail)

All read-only. Return the evidence; `workflow-ship` re-derives what this
environment can and records the rest as operator-attested.

1. **Deployment start evidence (CONFIRM-START):** merge timestamp, merge commit
   SHA on `main`, and the `main` `validate` run URL/ID with its start time.
2. **Deployment completion evidence (CONFIRM-COMPLETE):** that run's
   **`conclusion: success`** at the merge `head_sha`. A run URL without a
   successful conclusion is not completion.
3. **Version coherence at `0.61.0` on `main`** — all six locations plus the README
   `## Status` stamp (56 agents / 51 skills) and the dated
   `## [0.61.0] - 2026-08-25` CHANGELOG section with a **non-dangling** compare
   link (`v0.60.0` = `d5cd9590…` must exist).
4. **Marketplace still exactly one entry** — `plugins[]` length 1, `kai`,
   `source: "."`. No pack entries.
5. **`COMMITTED_PACKS` still `[]` and still no `packs/` tree** at the merge commit —
   prove the absence **positively** from the root tree listing, not from a local
   glob (`packs` sorts between `package.json` and `plugin.json`).
6. **The canonical block shipped and is pinned** — `scripts/lib/degraded-block.txt`
   present at the merge commit and byte-identical to the reviewed copy; the pin
   itself is re-asserted by check 2's green `Validate plugin contract` step.
7. **Tag and release point at the merge** — `v0.61.0` peels to the merge commit;
   release published, not draft, not prerelease.
8. **No agent or skill body changed on `main`** — the merge diff touches no path
   under `agents/` or `skills/`.

**Expected threshold: 8 of 8.** Any failure → do **not** mark `shipped`: invoke the
recorded rollback through the operator, capture `production-verification` in
`resume_state`, and set `blocked` with `principal-swe-infra` named.

---

## Production verification — EXECUTED at CONFIRM-COMPLETE 2026-08-25-1612: **8 of 8 PASS**

Every check re-derived read-only against the merge commit itself — the git
commit/tree/tag APIs, the Actions API and `raw.githubusercontent.com` at
`680ca445…` — deliberately **not** the local worktree, so a dirty checkout could
not have produced a false pass. This run had **no shell**; nothing was executed.

| # | Check | Result | How verified |
|---|-------|--------|--------------|
| 1 | Deployment start evidence | **PASS (re-derived)** | Merge commit `680ca445a2616bc9bc1b972db6b40042c06abf6c` on `main`, single parent `e679de9d41187614e9765e00ec3e20dafff9ec0c` — **the exact PREPARE base, so no rebase happened** and both review bindings survive — authored 2026-08-25T23:12:06Z, `verification.verified: true`, message `feat: add degraded-mode refusal (#158)` carrying both the implementation commit and the `docs: record degraded refusal ship gate` records commit. `main` run `32909692506`, `run_started_at` 23:12:10Z. Corroborated locally: `.git/refs/heads/main` = that SHA. |
| 2 | Deployment completion — and the pins actually ran in production | **PASS (re-derived)** | Run `32909692506`: `status: completed`, **`conclusion: success`**, `event: push`, `head_branch: main`, `run_attempt: 1`, `head_sha` exactly the merge commit, 23:12:10Z -> 23:12:29Z. Job `contract` `98001208870` on `ubuntu-latest`, 23:12:12Z -> 23:12:28Z (**16s**), **10 substantive steps all `success`** — including step 4 **`Validate plugin contract`** (the byte-pin over real generator output) and step 8 **`Pack generator self-test`** (the mutation, on-disk `--all` and drift arms), the two steps this item's guarantees live in. Step 11 `Release-guard (--base --head)` is `skipped`, correct on a `push` event: it is the `pull_request`-only gate and it ran green on the PR. `check-runs` on the merge SHA: `total_count: 1` — no second red check hides behind it. |
| 3 | Version coherence `0.61.0` on `main` | **PASS (re-derived)** | At the merge commit: `plugin.json` `0.61.0`; `package.json` `0.61.0`; `package-lock.json` **both** root `version` and `packages[""].version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` = `v0.61.0` — **56 agents and 51 skills**; `CHANGELOG.md` `## [0.61.0] - 2026-08-25` with its `[0.61.0]: …/compare/v0.60.0...v0.61.0` link. **Not dangling** — tag `v0.60.0` (`d5cd9590…`) exists and peels to `32a07a9a…`. Eight of eight locations. |
| 4 | Marketplace still exactly one entry | **PASS (re-derived)** | `.github/plugin/marketplace.json` at the merge commit: `plugins[]` length **1**, `name: kai`, `source: "."`, version-only change. No pack entries; the monolith remains authoritative. |
| 5 | `COMMITTED_PACKS` empty **and** no `packs/` tree | **PASS (re-derived, proven positively)** | `scripts/lib/pack-plan.mjs` at the merge commit still reads `export const COMMITTED_PACKS = [];`. Absence of `packs/` is proven from the merge commit's **complete** root tree (`d4f95819…`, `"truncated": false`), which lists `package-lock.json`, `package.json`, `plugin.json`, `scripts`, `skills`, `test` — `packs` sorts between `package.json` and `plugin.json` in git's byte ordering and **is absent**. Not inferred from a local glob. The committed-unpublished non-negotiable holds **in production**. |
| 6 | The canonical block shipped and is pinned | **PASS (re-derived)** | `scripts/lib/degraded-block.txt` read at the merge commit — present and identical to the copy both reviews were read from: one heading, the trigger-boundary paragraph ("The preflight above proves `kai-core` answered and is compatible…"), five bullets (one `Refuse …` single-shot, three `Do not …`, one `Tell the operator to install \`kai-core\``), **no** `KAI-CORE-MISSING`, **no** contract-version literal. The pin itself is re-asserted by check 2's green `Validate plugin contract` and `Pack generator self-test` steps. |
| 7 | Tag and release point at the merge | **PASS (re-derived)** | `refs/tags/v0.61.0` -> annotated **tag object** `e88857db3bc81a64f7edee966cf409ca4319d126` (tagger 23:12:33Z), peeled via the git-tags API to commit `680ca445…` — **the merge commit**. Release `376770741`, `tag_name: v0.61.0`, `target_commitish: main`, `draft: false`, `prerelease: false`, `published_at` 23:12:37Z. |
| 8 | No agent or skill body changed on `main` | **PASS (re-derived, by tree identity)** | Between base `e679de9d…` and the merge commit, the `agents` subtree (`c0284f31c7cd221cc2f31712f98148482c5ac49a`) and the `skills` subtree (`2a4a7abc01571bf6c237b97548a3e5ce0462caf6`) are **byte-identical**, as are `docs`, `examples`, `test`, `.kai`, `hooks.json`, `AGENTS.md`, `LICENSE`, `.gitignore`, `.gitattributes`, `.nvmrc` and `.env.example`. Only `.github`, `CHANGELOG.md`, `README.md`, `kai`, `package-lock.json`, `package.json`, `plugin.json` and `scripts` moved — exactly the declared surface. Inside `.github`, **`workflows` is byte-identical (`2fb1467c…`)**: `validate.yml` was declared in `touches` and genuinely **not** changed, so "no new CI step" is true in production; only `.github/plugin` moved. Not one shipped body was edited. |

**Release-note language checked by reading the published body, not by report.** The
`v0.61.0` release claims **carriage and CI enforcement only** — "Every generated
department-agent body now carries a canonical, byte-pinned degraded-mode refusal
instruction after the core compatibility preflight"; "Added CI validation for exact
copy count, ordering, adjacency, core exclusion, and absence of duplicated operating
rules" — and states the limits outright under **Unchanged**: "The trigger remains a
model-evaluated instruction; this release does not claim measured refusal or graceful
degradation", and "No generated pack tree is committed or published, and the
marketplace still exposes only the monolithic `kai` plugin." It says **department**
agent, never "every pack"; it claims **no model obedience**, no detection and no
graceful degradation; and it does not imply the split is done. Compliant with the
security review's extended `P2-S2` truth-binding and with the constraint deploy step 6
placed on it.

**What production evidence proves, at exactly its own width.** Proven: **carriage,
order, count and text** — the canonical block is on `main`, byte-identical to the
reviewed copy, and the gates that pin it into every generated department agent (exact
bytes, exactly one copy, immediately after the preflight, zero copies in core,
restating no rule) ran green on the merge commit. **Not proven, and not claimed
anywhere:** that any agent *refuses*, *detects* contract loss, or *degrades
gracefully*. That trigger is model-evaluated self-report and remains **unmeasured**;
concrete firing evidence stays owed downstream at `pack-split-host-gates` (parked
**P2-D1**). `pack-preview --check` remains **vacuous** for this item
(`pack-preview.mjs:281-283`) and is not counted.

**The two PREPARE attestations are now subsumed by production evidence.**
Head-vs-ref byte-identity and the local suite were operator-attested at PREPARE and
converted into fail-closed deploy steps 1 and 3. The merge tree changed only the
declared paths, `agents/` and `skills/` are provably byte-identical, and the identical
gates ran green on `main` — so the reviewed implementation is what production runs.
The exit status of deploy step 1's `git diff --exit-code` itself remains
operator-attested; it was not re-derived here (no shell).

---

## Deployment record (operator-executed; kai executed nothing)

| What | Value |
|------|-------|
| PR | [#158](https://github.com/RubenSaucedo/kai/pull/158) — squash-merged (repo convention), **not rebased** |
| Merge commit | `680ca445a2616bc9bc1b972db6b40042c06abf6c` on `main`, parent `e679de9d41187614e9765e00ec3e20dafff9ec0c` |
| Merge time | 2026-08-25T23:12:06Z (signature `verified_at` 23:12:07Z) |
| Version | `0.60.0 -> 0.61.0` |
| `main` CI | run [`32909692506`](https://github.com/RubenSaucedo/kai/actions/runs/32909692506), job `contract` [`98001208870`](https://github.com/RubenSaucedo/kai/actions/runs/32909692506/job/98001208870) — `success`, 16s |
| Tag | annotated `v0.61.0` -> tag object `e88857db3bc81a64f7edee966cf409ca4319d126`, peels to the merge commit |
| Release | [`v0.61.0`](https://github.com/RubenSaucedo/kai/releases/tag/v0.61.0) — id `376770741`, published 2026-08-25T23:12:37Z, not draft, not prerelease |
| Rollback | **never invoked** — the recorded abort/rollback path was not entered, and this item was never returned to `release-ready` |
| Records commit | folded into the same squash-merge, so the ship record landed at its canonical library path with the release — **no post-ship `git mv` is owed** (the `0.58.0` record needed one; `0.60.0` and this one did not) |

**Lifecycle walked, not skipped.** Item **v9 -> v10 (`deploying`) -> v11
(`production-verification`) -> v12 (`shipped`)**, workflow lease
`wsh-2026-08-25-1612-dgr-confirm` self-granted at v9 and cleared at close,
`resume_state` `null` throughout, `next_role: "@operator" -> null`. `change_ref` stays
`8d3ef4844988f4974e6bec8f406a7723dee4e942` — deployment moves an item's *state*, not
its reviewed implementation ref.

**Downstream, cleared strictly by the DAG.** Milestone `dependency-guarantees` moves
to **4 of 5 required items `shipped`** and stays **OPEN** — only
`pack-split-ci-partition-checks` remains. `pack-split-generated-pack-trees` goes from
**3 of 6** to **4 of 6** dependencies met, stays `proposed`, in `first-pack-extracted`,
outside `scope.current` — the one-way valve stays shut. `pack-split-ci-partition-checks`
was already dependency-satisfied and dispatchable; nothing here changed that, and
dispatch is the director's call — but its overlap on `scripts/lib/pack-plan.mjs`,
`scripts/validate-plugin.mjs` and `scripts/pack-preview.mjs` is now **landed on
`main`**, so it must read this diff rather than the pre-`0.61.0` files. **No dependent
item record was edited** — a reconciliation NOTE was appended to the affected thread.

---

## Follow-ups / parked

Every reviewer finding not shipping here is parked as a PROPOSAL in
`kai/initiatives/pack-split/backlog.md` (the initiative's `proposal_channel`) — six new
entries, plus **P2-S1/N1 + N3** recorded as a blast-radius update on the pin-pattern
proposal already parked there at the `preflight-compat` gate, rather than duplicated.
**Nothing was deleted, and this gate created no item** — filing is the steward's.

| Ref | What | Owner | Reopen trigger |
|-----|------|-------|----------------|
| **A1** (arch) | Core agents are excluded on an argument the re-scoped trigger no longer fully carries — context-loading absence can reach a core agent too. Covering it needs a *second* canonical block with its own pin, because this block's first sentence would be false where no preflight exists. Security adds: core holds `director-chief-of-staff` and `workflow-workspace-init`, so the uncovered blast radius per agent is **larger**, not smaller. | `principal-product-manager` | `pack-split-generated-pack-trees`, at the latest `pack-split-first-department` |
| **E1** (arch escalation) | `northstar.md` `dependency-guarantees` reads *"shipped in **every pack**"*; this ships in every **department** pack (4 of 5). The item's own acceptance ("every generated pack agent") is met exactly. Milestone-acceptance interpretation — amend the line or read it as satisfied. Security raised the same wording question against the CHANGELOG headline. | `principal-product-manager` | Before `dependency-guarantees` is declared met |
| **§147 errata** (arch, decided) | `docs/proposals/pack-architecture.md:147` ("for when the preflight **fails**") and §157's sketch opening are **superseded** by the shipped preflight; the decision record holds the reasoning. A one-line errata should ride whatever item next legitimately edits that proposal — deliberately **not** smuggled into this diff and **not** worth an item of its own. | `principal-swe-infra` (rider) | Next item that edits `docs/proposals/pack-architecture.md` |
| **P2-D1** (sec) | An agent carrying **both** blocks must still reply with exactly `KAI-CORE-MISSING` and nothing else in the `--no-core` and `--contract 2` builds — concrete evidence owed downstream. | `principal-swe-infra` + `@operator` | `pack-split-host-gates` |
| **P2-D2** (sec) | The refusal's prohibition set is narrower than the preflight's (no explicit product-code-edit / command / tool-call bullet). Coverage gap, **not** a regression; smallest fix ~90 chars against ~360 of remaining budget. Not requested — it moves a byte-pinned file and re-binds both reviews. | `principal-swe-infra` | Next item that legitimately reopens the block |
| **P2-D3** (sec) | The only permitted remedy is install-shaped for a condition at least as often a context-loading failure; the install/restart distinction survives in the token but not the remedy. Recovery-guidance impact, not exploitability. | `principal-swe-infra` | Same as P2-D2 |
| **P2-S1 / N1 + N3** (sec/arch) | `validate-plugin.mjs:443` gates **both** guarantees on `/^kai-[a-z]+\/agents\/.+\.agent\.md$/` — a future pack key outside `[a-z]+` escapes the preflight pin *and* the refusal pin together (no such key exists today: `core`, `engineering`, `product`, `gtm`, `personal`). **N3:** `injectPreflight` survives as an exported single-block helper with one self-test caller — inert, but an affordance for producing an agent carrying the preflight and not the refusal. | `principal-swe-infra` | Next new pack key, or next edit to `pack-plan.mjs` |

**Accepted at review, no work created:** the "restates no rule" guarantee is a
**shape** check — the opener rule is a *prefix* test and the opening paragraph is
not opener-checked, so a deliberately authored English clause inside the citation,
verbatim-quote and 1200-character limits is caught by **review, not by machine**.
Architecture accepted this explicitly and corrected it as *wider* than infra
reported. Recorded here so no future reader mistakes the pin for a semantic
guarantee.

**Not routed, pre-existing:** `.github/workflows/validate.yml` pins
`node-version: '20'` while `package.json` `engines` requires
`^22.22.2 || ^24.15.0 || >=26`; the green run's single annotation is the matching
GitHub Node-20 deprecation warning. Pre-existing, unchanged by this item, no item
created.

**Dependents:** none cleared. `pack-split-generated-pack-trees` requires this item
at `shipped`; `pack-split-ci-partition-checks` remains overlapping on three shared
files. Milestone `dependency-guarantees`: **3 of 5** required items `shipped`.

---

**Boundary, stated plainly:** the deploy steps above are the **operator's** to run.
`workflow-ship` recorded this release and verified what it could read; it did not
merge, tag, release, publish or deploy anything, and it will not.

<!-- /kai:allow-legacy-roots -->

---
type: releases
title: Ship record — generated committed-unpublished kai-core + kai-personal trees
slug: pack-split-generated-pack-trees-ship-record
created: 2026-08-26
source: workflow-ship
target: pack-split committed-unpublished pack trees (generate-not-move)
initiative: pack-split
milestone: first-pack-extracted
source_artifact: kai/coordination/items/pack-split-generated-pack-trees.md
current_path: kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees/ship-record.md
canonical_path: kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees/ship-record.md
status: shipped — production verification 6/6 PASS; rollback not invoked
shipped: 2026-08-26T21:43:39Z — v0.64.0, merge commit 2eea0f04f1c3dc0b4788de1e82909c5cc882e75d
related:
  - kai/coordination/threads/pack-split-generated-pack-trees.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md
evidence:
  - "implementation commit 5a5afb0e0eb40cbaa37eb195cdfcfca3efc1e81f"
  - "coordination commit 7102f94be129cd2dc5b3d49b09a4b4591dd155cb"
  - "branch feat/29-generated-core-personal, base main 31d5d110cb2a3f63ef6085e707bfe412a8c0b0ea"
  - "https://github.com/RubenSaucedo/kai/pull/167"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33016379347"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33016421758"
  - "https://github.com/RubenSaucedo/kai/releases/tag/v0.64.0"
---

# Ship Record — Generated committed-unpublished `kai-core` + `kai-personal` trees

**Work item:** `pack-split-generated-pack-trees` · **Initiative:** `pack-split`
**Target:** pack-split committed-unpublished pack trees (generate-not-move)
**Date:** PREPARE 2026-08-26 14:24 -07:00 · CONFIRM 2026-08-26 14:43 -07:00
· **Run:** `workflow-ship`
**What shipped (one line):** the first committed — and deliberately unpublished —
generated `packs/kai-core/` (44 files) + `packs/kai-personal/` (22 files) trees,
projected from the canonical root in `v0.64.0`.

> **File placement.** PREPARE initially wrote this record flat because that run
> had no shell. Deploy step 5 moved it to `canonical_path` before the records
> commit.

**Change:** [PR #167](https://github.com/RubenSaucedo/kai/pull/167), merged as
`2eea0f04f1c3dc0b4788de1e82909c5cc882e75d`; reviewed implementation
`5a5afb0e0eb40cbaa37eb195cdfcfca3efc1e81f` remains in its ancestry. At PREPARE,
branch `feat/29-generated-core-personal` was two commits off
`main` `31d5d110cb2a3f63ef6085e707bfe412a8c0b0ea`:

| commit | subject | role |
|---|---|---|
| `5a5afb0e0eb40cbaa37eb195cdfcfca3efc1e81f` | `feat(packs): generate core and personal trees` | implementation — the reviewed `change_ref` |
| `7102f94be129cd2dc5b3d49b09a4b4591dd155cb` | `docs(coordination): record generated pack review` | coordination records only |

At PREPARE no PR existed and the branch was unpushed. That historical state is superseded
by the deployment and production-verification record below. The generated packs remain
**unpublished**.

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | Item milestone `first-pack-extracted` == `northstar.scope.current`. All 5 acceptance criteria + A1–A3 + R1–R11 ticked and re-derived below from the working tree. The marketplace edit is version-only and authorized by R8's own parenthetical. |
| 2 | verified | **Clear** (operator/infra-attested; no shell in this run) | `npm test`, four pack gates, 148 self-test checks, committed-tree `--check`, 112-file `--all` preview, direct imports of generated entry points — recorded by `principal-swe-infra` (thread NOTE 2026-08-26-1420) and independently reviewed at the same SHA. Re-executed mechanically at deploy step 6. Design sub-gate **does not trigger**: developer-facing packaging change, no user-facing surface. |
| 3 | reviewed | **Clear** | `review_requirements` = 1 entry (`principal-swe-architect` / `independent-architecture`); `completed_reviews` carries `approved` at `change_ref 5a5afb0e…` == the item's `change_ref` (thread REVIEW 2026-08-26-1412). Both prior-round findings corrected, mutation-tested, re-reviewed. Deploy step 2 binds the tip to that ref. |
| 4 | shippable-safely | **Clear** (canary/flag/ramp waived — no runtime surface) | Artifact is inert: N=1 marketplace, no pack entry, no installable pack. Reversibility proven in code (`scripts/pack-preview.mjs:259-262` — `checkCommitted` returns ok with `COMMITTED_PACKS = []` and no `packs/`). R7 differential = zero pack-attributable provider/skill/hook delta. Signals + owner named below. |
| 5 | documented | **Clear** | `CHANGELOG.md [0.64.0]` (states "not installable from the marketplace"); `README.md:34-43` status stamp with the same claim; `docs/proposals/pack-architecture.md:15,33,292,421` scoped to one Windows host with macOS/cloud listed unverified (R6); this record promoted to the library; initiative `log.md` stamped by this run. |
| 6 | coordination-closed | **Clear** | Item v6 -> v7, `in-review -> release-ready`, `next_role: "@operator"`, lease `null`, `resume_state: null`, `waiting_on_questions: []`. All six `depends_on` verified terminal. `touches` corrected for record accuracy (see below). Deploy HANDOFF appended to the thread. |

**Readiness verdict: RELEASE-READY.** Six of six Clear, none Gap.

### What was re-derived here rather than accepted on report

Read directly from the working tree at `7102f94…`. This run had no shell, so every
line below is a file read, not a re-executed command:

- **Two packs, no third.** `packs/` contains exactly `kai-core` (44 files: 7 agents,
  24 skills, 11 scripts, `hooks.json`, `plugin.json`) and `kai-personal` (22 files),
  matching the item's declared 44 + 22. `COMMITTED_PACKS = ['core', 'personal']`
  (`scripts/lib/pack-plan.mjs:122`). **R8, third-pack stop gate: intact.**
- **Hooks exactly once.** `packs/kai-core/hooks.json` is the only hooks manifest; both
  entries invoke a single `${PLUGIN_ROOT}/scripts/observe-subagent.mjs`, which is present
  in core. Personal emits none. **R2/R3 hold on emitted files.**
- **Asset routing.** `scripts/demo-*.mjs` + `lib/cursor-png.mjs` are personal-only;
  `observe-*.mjs`, `workspace-doctor.mjs` and the shared `lib/*` are core-only.
- **Guarantee blocks.** All 9 personal agents carry the `kai-core-contract-v1` preflight
  **and** `## Degraded mode — no operating contract`; **0 of 7 core agents carry either.**
  **R1 holds as a decided residual, not an omission.**
- **No premature manifests.** No `package.json` / `package-lock.json` under `packs/`; the
  gate's own mutation arm asserts `kai-core/package.json` fails
  (`scripts/pack-preview.mjs:681`). **R11 holds.**
- **A1/A2/A3 closed in code.** `checkCommitted` guards on `existsSync(base)`
  (`pack-preview.mjs:259`); the committed walk skips `.DS_Store` / `Thumbs.db` (`:241`);
  `.gitattributes` pins `packs/** text eol=lf` beside the existing `scripts/**` pin.
- **Version coherence at `0.64.0`** across `package.json`, `package-lock.json` (x2),
  `plugin.json`, `packs/kai-core/plugin.json`, `packs/kai-personal/plugin.json`,
  `.github/plugin/marketplace.json` (`metadata.version` + entry), README, CHANGELOG.
- **Marketplace topology N=1**, single `kai` entry at `source: "."`, **zero pack entries**.
  **Publication stop gate: intact.**
- **Dependencies:** `generator-gates`, `preflight-compat`, `crosspack-validator`,
  `degraded-refusal`, `ci-partition-checks` all `shipped`; `host-semantics-spike`
  `completed`. **6 of 6.**
- **Branch position:** local `main`, `origin/main` and `FETCH_HEAD` all read
  `31d5d110…`, and the branch reflog shows exactly the two commits above — so an
  ff/squash merge is clean and no rebase is needed.

### Three things named rather than papered over

1. **The marketplace edit vs the compressed stop gate.** `ACTIVE.md` and the steward's
   dispatch HANDOFF compress the stop gate to *"any marketplace edit" / "do not touch
   marketplace.json"*, and `.github/plugin/marketplace.json` **was** edited — the
   `0.63.1 -> 0.64.0` lockstep bump in two version fields. The authoritative item record
   governs, and acceptance criterion **R8 explicitly permits exactly this**: *"Marketplace
   topology stays N=1 at `source: "."` (**only its lockstep release version changes**)"*.
   Topology is verified unchanged and no pack entry exists, so the gate's purpose —
   nothing published — holds. **Deploy step 3 binds this to the diff** and aborts on
   anything beyond the two version lines. If the steward intends the stricter literal
   reading, the correction is to revert those two lines: a one-line veto available to the
   operator now, rather than a surprise discovered after merge.
2. **`touches` was incomplete; the record was corrected, not the diff.** The item declared
   `package.json` but not `plugin.json`, `package-lock.json`, or
   `.github/plugin/marketplace.json`, all of which the release bump necessarily edits
   (this repo's standard eight-location bump; `pack-split-migration-doctor` declared all
   four). All three are added to `touches` as a **record-accuracy correction, not a scope
   expansion** — no new capability, and the only other item claiming `marketplace.json`
   (`pack-split-release-12b`) is `proposed` with no lease, so there is no touch collision.
3. **R7's amendment is attested, and this verdict does not depend on it.** The thread's R7
   note is authored by `principal-swe-infra` and states the steward accepted the causal
   reading; no steward-authored entry after `2026-08-26-1340` records it independently.
   That does not change the verdict, because the measured evidence satisfies the
   **original, unamended** wording too: the delegated child wrote 4 observer records
   **with** `packs/` and the identical 4 **without** it at `31d5d110…`, and zero
   `kai-core:` / `kai-personal:` providers were exposed — so the tree *adds* nothing.
   A steward confirmation NOTE is listed under follow-ups as record hygiene.

## Rollout plan

**Staging is waived, deliberately.** There is nothing to ramp: the trees are inert data
inside the existing monolithic plugin. No service, no traffic, no runtime flag, no
migration, no data. A canary and a ring rollout would be gate theater here.

**The blast radius is real anyway, and it is this:** the marketplace entry is
`source: "."`, so from `v0.64.0` every user who runs `/plugin update kai` receives the 66
duplicated pack files inside the `kai` payload. The risk is not that they can install a
pack — they cannot — but that a host might **ambiently discover** the tree and expose
duplicate providers, duplicate skills, or double-fire hooks.

**That is exactly what R7 measured**, on Windows Copilot CLI 1.0.80, as a differential
against an isolated no-`packs/` worktree at `31d5d110…`: zero pack-attributable provider,
skill, and hook delta. The residual duplicate hook firing is pre-existing root +
installed-monolith behavior, present identically in the baseline.

**Named residual, not a clean bill:** macOS and the cloud host are **unmeasured**. The
architect's approval says so explicitly, `docs/proposals/pack-architecture.md:421` says
so, and `pack-split-host-gates` owns closing it. This release does not certify them.

**Monitoring signals**

| Signal | Healthy | Sick |
|---|---|---|
| Host roster after `/plugin update kai` | only `kai:` providers | any `kai-core:` / `kai-personal:` provider appears |
| Contract skill resolution | exactly one `kai-core-contract-v1` | a second, pack-provided copy |
| Observer records per delegated child | 4 (the recorded baseline) | > 4 |
| `main` `validate / contract` | `conclusion: success` | anything else |

**Owner at 3am:** `principal-swe-infra` (implementation), `principal-product-manager`
(scope and stop-gate authority), `pack-split-host-gates` (macOS + cloud evidence).

## Rollback plan

**Clean, and verified as clean rather than asserted.** Revert the merge commit on `main`;
that removes `packs/` and restores `COMMITTED_PACKS = []`. The reverted tree passes its
own gate: `checkCommitted` returns `ok: true` with the note *"no committed packs
configured"* when `COMMITTED_PACKS` is empty and `packs/` is absent
(`scripts/pack-preview.mjs:259-262`). Because `packs/` is a `BEHAVIOR_PREFIX`, the revert
must carry a **patch bump (`0.64.1`) + CHANGELOG + README** or release-guard rejects it —
a requirement of the rollback, not an obstacle to it.

**What a rollback does NOT undo:** the `v0.64.0` tag and GitHub release remain in history,
and any user who already updated keeps the 0.64.0 payload until they update again. There
is **no data, no migration, no backfill, and no external state**, so nothing is
unrecoverable — the rollback is a code revert plus a follow-on release.

**Abort criteria (hit rollback):** any deploy-step check below failing; `main` CI red at
the merge commit; or any `kai-core:` / `kai-personal:` provider, duplicate contract skill,
or observer-record delta appearing on a host after update.

## Deploy handoff (the human runs these — kai does not)

`workflow-ship` merged nothing, pushed nothing, tagged nothing, released nothing, and
published nothing. Steps 1–4 are read-only pre-merge gates that fail closed.

> **Completed by the operator.** This section is retained as the approved deployment
> procedure; completion and verification evidence are recorded below.

1. **Confirm the branch shape.**
   `git -C C:\src\kai log --oneline 31d5d110cb2a3f63ef6085e707bfe412a8c0b0ea..HEAD`
   → expect `5a5afb0e`, `7102f94`, plus the one records commit from step 5. Any other
   commit → stop.
2. **Bind the review to the tip.**
   `git diff --name-only 5a5afb0e0eb40cbaa37eb195cdfcfca3efc1e81f..HEAD`
   → must list **only** `kai/coordination/**`, `kai/library/releases/**`,
   `kai/initiatives/pack-split/log.md`, and
   `kai/initiatives/pack-split/backlog.md`. Any implementation, script, product
   doc, or release-metadata file here **voids the architecture approval** →
   stop and re-review at a new ref.
3. **Prove the marketplace edit is version-only.**
   `git diff 31d5d110cb2a3f63ef6085e707bfe412a8c0b0ea..HEAD -- .github/plugin/marketplace.json`
   → must show exactly two changed lines, both `"version": "0.63.1"` -> `"0.64.0"`. Any
   added, removed, or renamed entry → **publication stop gate tripped**, abort.
4. **Prove no third pack.**
   `git diff --name-only 31d5d110cb2a3f63ef6085e707bfe412a8c0b0ea..HEAD -- packs/`
   → every path under `packs/kai-core/` or `packs/kai-personal/` only, and
   `COMMITTED_PACKS` in `scripts/lib/pack-plan.mjs` reads `['core', 'personal']`.
5. **Commit the release records.** This record is already in its canonical
   directory. Commit it together with the item, thread, `BOARD.md`, `ACTIVE.md`,
   initiative `log.md`, and the steward-routed backlog record.
6. **Push and open the PR.** Title `feat: generate committed-unpublished core and personal
   pack trees`. Wait for `validate / contract` on the PR head to reach
   `conclusion: success` — that run re-executes `npm test`, the four pack gates, the 148
   self-test checks, and the committed-tree check this session could not run.
   **Red CI → abort; do not merge.**
7. **Merge** (squash or fast-forward; a rebase that rewrites `5a5afb0e…` would void the
   review binding), then **release `v0.64.0`** targeting the merge commit, non-draft,
   non-prerelease.
8. **Do not touch `.github/plugin/marketplace.json` beyond step 3's version bump.** No
   pack may be published in this release.

Then return to `workflow-ship` with the evidence in the next section.

## Production verification

The operator returned the following contract for **CONFIRM-START** and
**CONFIRM-COMPLETE**:

1. **CONFIRM-START:** PR number + URL, merge commit SHA, `main` workflow run URL/ID,
   environment, start timestamp.
2. **CONFIRM-COMPLETE:** that run's `conclusion: success` and job ID at the merge commit;
   the published `v0.64.0` release URL, non-draft, non-prerelease, targeting the merge
   commit; completion timestamp.
3. **Version coherence on merged `main`** at all eight locations plus README `## Status`
   and a non-dangling `[0.64.0]` CHANGELOG compare link (`v0.63.1` tag must exist).
4. **Topology check on `main`:** `.github/plugin/marketplace.json` still exactly one
   entry, `kai` at `source: "."`, zero pack entries.
5. **Tree check on `main`:** `packs/` = `kai-core` (44 files) + `kai-personal` (22), and
   `node scripts/pack-preview.mjs --check` byte-identical at the merge commit.
6. **R7 re-check against the published artifact** — the one check pre-merge evidence
   cannot cover: after `/plugin update kai`, confirm the host roster exposes no
   `kai-core:` / `kai-personal:` provider, no second `kai-core-contract-v1`, and no
   observer-record delta above the 4-record baseline. A positive delta is a **stop** —
   invoke the rollback above; do not reason it away.

Kai records these read-only. Kai does not execute the deployment or the rollback.

### Outcome — 2026-08-26-1443: **PASSED 6 of 6. SHIPPED.**

| # | check | result |
|---|-------|--------|
| 1 | deployment start | PR run `33016379347`, job `98335558480`, passed in 15s; PR #167 merged `2026-08-26T21:40:01Z` as `2eea0f04...`; `main` run `33016421758` started `21:40:03Z` at that exact SHA. Local `main` and `origin/main` reached the merge SHA; worktree clean immediately after the operator sequence, before this records edit — **PASS** |
| 2 | deployment completion | Main job `98335703857` completed `success` at `21:40:17Z`; the merge has exactly one check run and it is successful. `v0.64.0` published `21:40:33Z`, non-draft, non-prerelease, target exactly the merge SHA — **PASS** |
| 3 | review binding | GitHub compare reports `5a5afb0e...` as the merge base/ancestor of `2eea0f04...`; the merge method preserved the independently reviewed implementation commit — **PASS** |
| 4 | version, topology, trees | Production reads `0.64.0`; marketplace N=1, one `kai` at `source: "."`, zero pack entries; `COMMITTED_PACKS = ['core','personal']`; merge root `packs/` contains only `kai-core` + `kai-personal`; CI step `Committed pack trees match the generator` succeeded. **No pack was published** — **PASS** |
| 5 | installed artifact + fresh session | Official `copilot plugin update kai` **failed** with Windows `Access is denied` because the active CLI loaded the plugin; this was not a successful plugin-manager update. The clean installed direct checkout was fast-forwarded with `git pull --ff-only origin main` from `a879116...` / manifest `0.47.0` to exact merge `2eea0f0...` / manifest `0.64.0`. Fresh Copilot CLI 1.0.80 then returned exactly `CORE=0 PERSONAL=0 CONTRACT_DUPLICATE=no CHILD=ok` — **PASS with residual** |
| 6 | observer differential | Consent enabled; `.kai/observed.jsonl` 363 -> 367 for one built-in `explore` child: exactly baseline start/start then stop/stop for session `4d11d50d1b4d`, role `explore`, agent `1fb0de3084e1`; no pack-attributable provider, contract-skill, or hook delta — **PASS** |

**Residual — stale registry display, not a ship blocker under this contract.**
`copilot plugin list` still reports cached registry metadata `0.47.0`, while the installed
checkout is at exact merge `2eea0f0...` and its `plugin.json` reads `0.64.0`. The official
updater failure is stated, not relabeled. The production contract gates the checkout the
fresh session actually loaded and the resulting provider/skill/hook behavior; those are
directly evidenced and all passed. The stale display neither publishes a pack nor changes
loaded content. Reopen if a fresh session loads the old artifact or produces any positive
pack-attributable delta.

**Rollback was never invoked.** Kai performed no merge, push, tag, release, installed-checkout
update, deployment, or rollback; it recorded the operator's actions and read-only evidence.

## Follow-ups / parked

- **A4 publication guard** → `pack-split-release-12b` (`proposed`). Committing this tree
  is what makes the unpublished -> published flip a pure `marketplace.json` edit that
  release-guard exempts. The guard must land **no later than** the flip. Raise to the
  steward if any publication becomes possible first.
- **macOS + cloud host certification** → `pack-split-host-gates` (`proposed`). Blocks
  publication; not certified by this release.
- **Review-lens binding (architect caveat b)** → resolve before the engineering tree is
  generated in `pack-split-release-12c`; off this critical path.
- **Runtime dependency manifests** → deferred to publication
  (`pack-split-pack-dependency-manifests`). Until then Lectoria inside a generated pack
  resolves only via `LECTORIA_BIN` or `PATH`.
- **Steward confirmation of the R7 amendment** (record hygiene, non-blocking) →
  `principal-product-manager`: a one-line thread NOTE confirming the baseline-comparison
  sentence in R7 is steward-authored.
- **Unblocked at `shipped`, not before:** `pack-split-first-department` and
  `pack-split-host-gates` both declare this item at `shipped`. Milestone
  `first-pack-extracted` does **not** advance on `release-ready`.

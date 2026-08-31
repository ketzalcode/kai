---
# <!-- kai:allow-legacy-roots -->
type: releases
title: Ship record — four named CI partition gates + kai-core-* namespace enforcement (forced fleet rename)
slug: pack-split-ci-partition-checks-ship-record
created: 2026-08-25
source: workflow-ship (PREPARE + CONFIRM-START + CONFIRM-COMPLETE) — kai/coordination/items/pack-split-ci-partition-checks.md
target: pack-split CI partition enforcement + namespace
initiative: pack-split
source_artifact: null
canonical_path: docs/kai/reports/releases/2026-08-25/04-ship-pack-split-ci-partition-checks/ship-record.md
promotion: completed 2026-08-25 — canonical library home; verified present at merge commit b72453f1ed46393e77722995212920b9f8615c79 (blob 291d839e…), so no post-ship reconciliation is owed
shipped: 2026-08-26T00:50:07Z — v0.62.0, merge commit b72453f1ed46393e77722995212920b9f8615c79, production verification 9/9, rollback never invoked
related:
  - kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal/ship-record.md
  - kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md
  - kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
evidence:
  - path: https://github.com/RubenSaucedo/kai/commit/b72453f1ed46393e77722995212920b9f8615c79
    source: '**the merge commit — production.** PR #160 `state: closed`, **`merged: true`**, `merged_at` **2026-08-26T00:50:07Z**, `merge_commit_sha` **`b72453f1ed46393e77722995212920b9f8615c79`**, merged by `RubenSaucedo` as a squash (`commits: 3`, `changed_files: 26`, +2973/-229) whose single parent is `16493a303c…`, the branch''s own base — so **no rebase**. Final PR head at merge was `1617c819487d19ffd284a30b9d1ad0e698e211fd`, two commits past the ratified ref; the binding was re-proven at the object level rather than re-diffed'
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32916653342/job/98021655301
    source: '**the `main` deployment run.** Job `contract` `98021655301` (run `32916653342`, `workflow_name: validate`, `head_branch: main`, `run_attempt: 1`), `status: completed`, **`conclusion: success`**, 2026-08-26T00:50:12Z -> 00:50:27Z (**15s**) at `head_sha b72453f1…`. **The four gates read individually `success` as named steps in the `main` run** — 9 `Partition gate (one pack per agent, one provider per skill, kai-core-* namespace)`, 10 `Collision gate (no id emitted by two packs)`, 11 `Partial-install gate (a department installed with kai-core alone)`, 12 `Version-skew gate (contract pins agree; absent or skewed core fails closed)` — plus 4 `Validate plugin contract`, 5 `Workspace-doctor self-test`, 6 `Host-loader acceptance`, 7 `Release-guard self-test`, 8 `Pack generator self-test`, 13 `Committed pack trees match the generator`, 14 `Check helper script syntax`: **eleven substantive steps, all green**, with 15 `Release-guard (behavior change requires a bump + release notes)` **`skipped`** on a push event, exactly as this record predicted'
  - path: https://api.github.com/repos/RubenSaucedo/kai/commits/b72453f1ed46393e77722995212920b9f8615c79/check-runs
    source: '`total_count: 1` on the **merge** SHA — one check, `success`; nothing red hides behind it. `annotations_count: 1` is the pre-existing Node-20 runner deprecation warning'
  - path: https://api.github.com/repos/RubenSaucedo/kai/git/trees/b72453f1ed46393e77722995212920b9f8615c79
    source: '**the decisive comparison.** Complete root tree at the merge (`truncated: false`, 21 entries) is **byte-identical to the ratified `aca16e56…` on every top-level entry except `kai/`**: `.env.example` `e39cc322`, `.gitattributes` `2aa1cd03`, `.github` `2034a566`, `.gitignore` `f2abfdaf`, `.kai` `62ab64a1`, `.nvmrc` `a45fd52c`, `AGENTS.md` `c9794bcd`, `CHANGELOG.md` `e2149cee`, `LICENSE` `1db1d317`, `README.md` `652ee436`, `agents` `c0284f31`, `docs` `2c5b302f`, `examples` `d29fd2f2`, `hooks.json` `a21df80f`, `package-lock.json` `4cdda0f8`, `package.json` `0a3bb8cd`, `plugin.json` `63ce31fa`, `scripts` `8996552b`, `skills` `d935bd32`, `test` `2e82a331`. Only `kai` moved (`8baeb55b` -> `69e366c7`, records). **`packs` is absent**, where it would sort between `package.json` and `plugin.json`'
  - path: https://api.github.com/repos/RubenSaucedo/kai/git/trees/d935bd32e5115428330e1c4675935974be608aa2
    source: 'the `skills` subtree in production (`truncated: false`) — **`kai-core-fleet-observation` present, `fleet-observation` absent**, 51 skill directories plus `.gitkeep`. Identical to the ratified ref, so the shipped rename is the reviewed rename'
  - path: https://api.github.com/repos/RubenSaucedo/kai/git/tags/cf91008b2d3530d124e13cc1cf3229c12243f2ed
    source: 'annotated tag `v0.62.0` (tagger 2026-08-26T00:50:30Z) **peels to `b72453f1…`**, the merge commit — `object.type: commit`. `refs/tags/v0.61.0` also present (`e88857db…`), so the `[0.62.0]` compare link is **not dangling**'
  - path: https://github.com/RubenSaucedo/kai/releases/tag/v0.62.0
    source: 'release `376800860`, `tag_name v0.62.0`, `target_commitish main`, **`draft: false`, `prerelease: false`**, published 2026-08-26T00:50:33Z. **Body read in full and it holds the step-6 language constraints** — states the breaking rename ("Renamed the user-invocable `fleet-observation` skill to `kai-core-fleet-observation` … Update direct invocations to the new name"), states "No generated pack tree is committed or published; the marketplace remains the monolithic `kai` plugin", and re-introduces **none** of the host-resolution language A2 removed'
  - path: https://raw.githubusercontent.com/RubenSaucedo/kai/b72453f1ed46393e77722995212920b9f8615c79/scripts/lib/pack-plan.mjs
    source: 'production blob reads pinned at the merge SHA — **`COMMITTED_PACKS = []`** and `SKILL_OWNER_OVERRIDES` mapping `''kai-core-fleet-observation'': ''core''`. Alongside `plugin.json` `0.62.0`, `package.json` `0.62.0`, `package-lock.json` `0.62.0` ×2, `.github/plugin/marketplace.json` `0.62.0` ×2 with **exactly one** plugin entry (`kai` at `source: "."`), `README.md` `## Status` reading `v0.62.0` — 56 agents and 51 skills, and `CHANGELOG.md` `## [0.62.0] - 2026-08-25` with its compare link'
  - path: https://github.com/RubenSaucedo/kai/pull/160
    source: 'GitHub PR #160 "feat: enforce pack partition gates" — read at PREPARE as `state: open`, created 2026-08-26T00:31:20Z, head `63f6da167f1ead58bc63dd5ef8e9c5f52ad1869b`, then merged as recorded above'
  - path: https://github.com/RubenSaucedo/kai/actions/runs/32915426171/job/98018029769
    source: 'check run `contract` (id `98018029769`, run `32915426171`), `workflow_name: validate`, `head_sha 63f6da167f1ead58bc63dd5ef8e9c5f52ad1869b`, `run_attempt: 1`, `status: completed`, **`conclusion: success`**, 2026-08-26T00:31:27Z -> 00:31:45Z (**18s**). **All four new named gates read individually green in the step list** — step 9 `Partition gate (one pack per agent, one provider per skill, kai-core-* namespace)`, step 10 `Collision gate (no id emitted by two packs)`, step 11 `Partial-install gate (a department installed with kai-core alone)`, step 12 `Version-skew gate (contract pins agree; absent or skewed core fails closed)` — plus step 4 `Validate plugin contract`, step 8 `Pack generator self-test`, step 13 `Committed pack trees match the generator`, step 14 `Check helper script syntax` and step 15 `Release-guard (--base --head)`. Twelve substantive steps, every one `success`'
  - path: https://api.github.com/repos/RubenSaucedo/kai/commits/63f6da167f1ead58bc63dd5ef8e9c5f52ad1869b/check-runs
    source: '`total_count: 1` on the PR head — `contract` is the only check, so no second red check hides behind the green one. Its single annotation is `annotations_count: 1` (the pre-existing Node-20 runner deprecation warning carried by every run in this initiative)'
  - path: https://github.com/RubenSaucedo/kai/commit/63f6da167f1ead58bc63dd5ef8e9c5f52ad1869b.diff
    source: 'the complete diff of the commit that sits between the ratified ref and the PR head — **three files, all under `kai/coordination/`**: `ACTIVE.md` (+64), `BOARD.md`, `items/pack-split-ci-partition-checks.md` (+182/-9). Its parent is exactly `aca16e56d3d70cf6bac5181a41c3d4a87055dccc`, so **every implementation and release file at the PR head is byte-identical to the reviewed object**. Machine-read here, not accepted on report'
  - path: https://api.github.com/repos/RubenSaucedo/kai/git/trees/95b0a5235706d0061a0f74dc7656ca028f5939e6
    source: 'complete root tree at the PR head (`truncated: false`) — 21 entries, **no `packs`** (it would sort between `package.json` and `plugin.json`); `agents` subtree `c0284f31c7cd221cc2f31712f98148482c5ac49a`'
  - path: https://api.github.com/repos/RubenSaucedo/kai/git/trees/16493a303c6532c8a7d0c78faf5c9027a5c9d998
    source: 'complete root tree at the PR base `main` (`truncated: false`) — `agents` subtree **`c0284f31c7cd221cc2f31712f98148482c5ac49a`, identical to the head**, as are `examples`, `hooks.json`, `.kai`, `AGENTS.md`, `LICENSE`, `.env.example`, `.gitattributes`, `.gitignore`, `.nvmrc`; and **no `packs`** on either side'
  - path: kai/coordination/items/pack-split-ci-partition-checks.md
    source: 'authoritative work item (v8 -> v9 at PREPARE, `in-review -> release-ready`); `## Independent architecture re-review — 2026-08-25-1745 (ratification)` is the durable review record, bound to `change_ref aca16e56d3d70cf6bac5181a41c3d4a87055dccc`'
  - path: kai/coordination/threads/pack-split-ci-partition-checks.md
    source: 'item thread — build HANDOFF 2026-08-25-1705, `Q-…-01` asked 1705 and closed 1740, operator HANDOFF 1720, REVIEW 1725 (not ratified), HANDOFF 1740, REVIEW 1745 (ratified), deploy HANDOFF 2026-08-25-1750'
  - path: kai/initiatives/pack-split/backlog.md
    source: 'three PROPOSALs parked at this gate (N4 evidence-width, N5 fail-closed inconsistency across `parseGeneratedKey` consumers, S1 user-invocable rename with no alias) — nothing a reviewer routed was dropped'
  - path: .github/workflows/validate.yml
    source: 'the four named gate steps as written, read locally at lines 44-58 — the step names match the CI job step names byte-for-byte, which is direct proof that the pushed workflow is the reviewed workflow'
---

# Ship Record — four named CI partition gates + `kai-core-*` namespace enforcement

**Work item:** `pack-split-ci-partition-checks`  ·  **Initiative:** `pack-split`
**Milestone:** `dependency-guarantees` (the CI capstone — the 5th and last required item)
**Delivery class:** `product-change`  ·  **Target:** pack-split CI partition enforcement + namespace
**Date:** 2026-08-25 17:31 local (America/Los_Angeles, UTC-07:00) = 2026-08-26T00:31Z.
**Recorded as 2026-08-25-1750** so the append-only record stays ordered behind the
architecture ratification's `1745` entry; the record labels in this item have drifted
ahead of wall clock and are kept monotonic rather than re-based.
**Run:** `workflow-ship` — **PREPARE** (`in-review -> release-ready`) 2026-08-25-1750, then
**CONFIRM-START + CONFIRM-COMPLETE** (`release-ready -> deploying -> production-verification ->
shipped`) 2026-08-25-1751.
**What shipped (one line):** the locked five-pack partition becomes a **hard CI gate** —
four independently named failing steps on every push and pull request — and core-provided
skills are held to the `kai-core-*` prefix, which forces `fleet-observation` to become
`kai-core-fleet-observation`.
**Change:** [PR #160](https://github.com/RubenSaucedo/kai/pull/160) ·
merged `b72453f1ed46393e77722995212920b9f8615c79` ·
reviewed ref `aca16e56d3d70cf6bac5181a41c3d4a87055dccc` · base `main` `16493a303c6532c8a7d0c78faf5c9027a5c9d998`
**Version:** `0.61.0 -> 0.62.0` · **Tag/release:** `v0.62.0`, published 2026-08-26T00:50:33Z

> **State reached: SHIPPED.** Verified in production 2026-08-25-1751 — **9 of 9 checks passed**,
> **rollback never invoked**. kai merged nothing, pushed nothing, tagged nothing, released
> nothing and deployed nothing; every deploy step below was run by the operator, and every
> production fact was re-derived read-only against the merge commit.

---

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | Top-level tree diff base -> head: only declared paths moved; `agents/` byte-identical; no `packs/` on either side |
| 2 | verified | **Clear** (qa-ui + UX walk **Waived**) | Run `32915426171` job `98018029769` `success` at the PR head, **all four named gates green as individual steps**; local suite operator-attested |
| 3 | reviewed | **Clear** | `independent-architecture` **RATIFIED** at `aca16e56…`; the one commit past that ref is **provably coordination-only** |
| 4 | shippable-safely | **Clear** (canary/flag/ring deliberately **not invented**) | Build-time gate, no runtime path; one user-visible rename; clean `git revert` reversibility |
| 5 | documented | **Clear** | CHANGELOG `[0.62.0]` + compare link, README `## Status`, `plugin-structure.md` gate rows, regenerated catalog, this record, initiative log |
| 6 | coordination-closed | **Clear** | Item v8 -> v9, lease `null`, `waiting_on_questions: []`, `Q-…-01` closed, both dependencies `shipped` |

**Readiness verdict: RELEASE-READY.** All six Clear; two sub-gates waived with reasons
recorded below (`principal-qa-ui` and the product-design step). No Gap.

### 1 — scope-true · **Clear**

`milestone: dependency-guarantees` is in `northstar.scope.current`, and
`required_for_milestone: true`.

**Scope was derived from git objects, not asserted.** Comparing the *complete* root
trees (`truncated: false` on both) of base `16493a303c…` and head `63f6da16…`:

| moved | byte-identical |
|-------|----------------|
| `.github`, `CHANGELOG.md`, `README.md`, `docs`, `kai`, `package-lock.json`, `package.json`, `plugin.json`, `scripts`, `skills`, `test` | `agents` (**`c0284f31c7cd221cc2f31712f98148482c5ac49a` on both sides**), `examples`, `hooks.json`, `.kai`, `AGENTS.md`, `LICENSE`, `.env.example`, `.gitattributes`, `.gitignore`, `.nvmrc` |

Every moved path is in the item's declared `touches` (or is `kai/` coordination
records, which `touches` does not cover and never has). The `agents` subtree being
**identical** proves three claims at once that were previously read by eye: no agent
body changed, **no new tool grant**, and no `**Inherits:**` line moved — consistent with
`kai-core-fleet-observation` being an orphan skill.

**Touch-set expansion was declared, not smuggled.** `package.json`,
`package-lock.json`, `plugin.json`, `.github/plugin/marketplace.json` (forced by the
release-bump criterion), `docs/proposals/pack-architecture.md` (forced — the line
contains "inherits", so the validator's inherit-line check rejects the stale token) and
`docs/reference/plugin-structure.md` (the two new `npm test` rows) were added to
`touches` by the acting role at build time.

**Non-negotiables re-read at the head, positively:**

- `COMMITTED_PACKS = []` — `scripts/lib/pack-plan.mjs:122`.
- **No `packs/` tree** — proven from the complete root tree listing at the head, where
  `packs` would sort between `package.json` and `plugin.json` and **is absent**. Not
  inferred from a local glob.
- Marketplace still **exactly one** entry, `kai` at `source: "."` — version-only change.
- Groundwork still on `0.x` (`0.62.0`); `1.0.0` untouched and still reserved for the split.
- Root `agents/` + `skills/` remain the single source of truth; nothing was hand-carved
  out of root.

### 2 — verified · **Clear** (with two recorded waivers)

**The criterion only CI could close is closed, and it was read here rather than
accepted on report.** Check run `contract` `98018029769` (run `32915426171`,
`workflow_name: validate`, `run_attempt: 1`) at `head_sha 63f6da16…`:
`status: completed`, **`conclusion: success`**, 00:31:27Z -> 00:31:45Z (**18s**),
`check-runs total_count: 1` on that head — so it is the only check and nothing red hides
behind it.

**The four gates were verified as steps, not inferred from a green tick.** The job's
step list carries them individually, each `conclusion: success`:

| # | step | conclusion |
|---|------|-----------|
| 9 | `Partition gate (one pack per agent, one provider per skill, kai-core-* namespace)` | `success` |
| 10 | `Collision gate (no id emitted by two packs)` | `success` |
| 11 | `Partial-install gate (a department installed with kai-core alone)` | `success` |
| 12 | `Version-skew gate (contract pins agree; absent or skewed core fails closed)` | `success` |

Those names match `.github/workflows/validate.yml:47-55` byte-for-byte, which is direct
proof that **the pushed workflow is the reviewed workflow** — a step name cannot appear
in a run without being in the workflow that ran. Also green on the same run: step 4
`Validate plugin contract`, step 8 `Pack generator self-test`, step 13 `Committed pack
trees match the generator`, step 14 `Check helper script syntax`, and step 15
`Release-guard (--base --head)` — the `pull_request`-only gate that requires a
behaviour change to carry a version bump plus release notes, which is independent
machine confirmation of the `0.62.0` bump.

**Operator-attested, and labelled as such:** `pack-preview --self-test` **134 checks**,
`--gate all` four gates clean, `validate-plugin` **56 agents / 51 skills**,
`host-contract` self-test with the inventory matching, and full `npm test` pass. This
run had **no shell** and executed nothing. One acceptance-relevant check is in `npm test`
but **not** in CI — `generate-catalog.mjs --check` — so it rests on the attestation;
corroborated by reading the artefacts it would have compared:
`docs/reference/agents-and-skills.md:199` and `test/fixtures/inventory.json:81,143` all
carry `kai-core-fleet-observation`, and a repo-wide scan finds the only surviving bare
`fleet-observation` tokens are historical CHANGELOG entries (deliberately excluded from
the reference scan), the intentional mutation fixture at `pack-preview.mjs:764`, and the
README sentence that names the old name in order to explain the rename.

**Waived — `principal-qa-ui` did not run, and no UX walk was performed.** Reason: there
is no user-facing interaction surface to walk. This is a build-time CI gate plus a
metadata rename; the northstar's own Stewardship section records the initiative as "a
developer-facing packaging change with no user-facing interaction surface". The rename
*is* user-visible (see dimension 4) but it is verified mechanically — catalog, golden
inventory, docs, and the namespace gate itself — not by a walkthrough.

**Waived — the product-design sub-gate.** No net-new or materially-changed user-facing
surface. Same recorded northstar line: "the product-design step is not implicated". This
is a recorded product-design waiver at the initiative level, not a per-item judgement
call made here.

### 3 — reviewed · **Clear**

The item carries **one** review requirement — `principal-swe-architect` /
`independent-architecture` — and it is **RATIFIED** at `change_ref
aca16e56d3d70cf6bac5181a41c3d4a87055dccc`, recorded in `completed_reviews` at that exact
ref and written up in full on the item. Two prior rounds returned CHANGES REQUIRED
(1725: A1 the ref was not a commit, A2 the host-semantics over-claim, A3 a record
overstatement); all three are closed on this ref.

**The head is one commit past the reviewed ref, and that was checked rather than
accepted.** PR #160 has exactly two commits: `aca16e56…` (implementation) and
`63f6da16…` (`docs: record partition gate review`), whose parent is exactly `aca16e56…`.
Its **complete** diff, read from GitHub, is three files and all three are coordination
records: `kai/coordination/ACTIVE.md`, `kai/coordination/BOARD.md`,
`kai/coordination/items/pack-split-ci-partition-checks.md`. The diff begins at
`kai/coordination/ACTIVE.md` — so nothing under `.github/`, `CHANGELOG.md`, `README.md`
or `docs/` precedes it — and terminates inside the item file, so nothing under
`package*.json`, `plugin.json`, `scripts/`, `skills/` or `test/` follows it.
**Therefore every implementation and release file at the PR head is byte-identical to
the ratified object**, and the review binding survives the head having moved.
`change_ref` stays at `aca16e56…`: it moves only when the implementation moves.

**Residual attestation, named not buried.** The architect read the **worktree**, with
worktree-to-commit byte-identity operator-attested (that session also had no shell).
Partially re-derived here: the pushed tree passed the same gates in CI, and the four
gate step names in the run match the workflow file the review was read from. The rest is
converted into **deploy step 1**, a `git diff --exit-code` that fails closed.

**Nothing routed was dropped.** Three non-blocking findings from the ratification:

- **N4** — a source comment (`pack-plan.mjs:27`, "Hosts have exposed duplicate plugin
  names differently") claims a corpus wider than the one measured host. **Parked as a
  PROPOSAL** rather than fixed: fixing it means a new commit, a new ref, and re-binding
  the one review — a round trip this gate would have to pay for a comment adjective.
- **N5** — `guaranteeBlockErrors` now errors on an unresolvable generated key while
  `packProviders` and the hooks-claimant filters still skip one, so the fail-closed
  property is inconsistent across consumers. **Parked as a PROPOSAL** with the
  reviewer's named reopen trigger. Masked today because a divergent key trips the
  partial-install gate loudly in the same run.
- **N6** — the item's own Evidence table lists the pre-fix CI step names. **Corrected in
  the record** at this gate (the live names are in the table above); no code implication.

### 4 — shippable-safely · **Clear**

Rigor matched to blast radius; see the Rollout and Rollback sections. A flag, a canary,
a percentage ring and a runbook were **not invented** — a build-time gate has no runtime
path, no cohort and no data — and the one genuinely user-visible element (the rename) is
named rather than waved past.

**The one risk worth stating plainly: these gates fail the build for the whole
repository, not just for pack work.** A false positive blocks every PR. What makes that
acceptable: each gate is a pure function over plain data with **one** implementation
shared by three callers (validator, `--gate` runner, self-test), it is proven by 134
mutation arms that assert on specific message text, and it ran green against the live
tree in CI before merge. The one *new* fail-closed guard (A3 — an unresolvable generated
key now errors instead of skipping) is unreachable on the authoritative path today,
because `materializePacks` derives every key from the same `PACK_ORDER` the check
resolves against, so it cannot false-positive against today's tree.

### 5 — documented · **Clear**

- `CHANGELOG.md` — dated `## [0.62.0] - 2026-08-25` section with Added/Changed entries,
  plus a non-dangling `[0.62.0]: …/compare/v0.61.0...v0.62.0` link (`CHANGELOG.md:2768`).
- `README.md` `## Status` — `v0.62.0`, **56 agents and 51 skills**, and a paragraph that
  states the four gates and the rename in the observed-truth wording A2 required.
- `docs/reference/plugin-structure.md:96-97` — the `pack-preview:self-test` and
  `pack-preview:gate` rows, so the `npm test` table names the new gates.
- `docs/reference/agents-and-skills.md:199` regenerated; `docs/getting-started.md:111`,
  `docs/workspaces.md:334`, `docs/proposals/pack-architecture.md:412` renamed.
- Durable decisions promoted: this ship record (library zone, `type: releases`), plus the
  CHANGELOG call recording that historical entries keep the old name deliberately.
- Initiative `log.md` stamped at this gate. **Record drift reconciled there, not hidden:**
  the 2026-08-25-1745 ratification never received its own `log.md` entry (the records
  commit touched only `kai/coordination/`), so this gate's entry carries it.

### 6 — coordination-closed · **Clear**

- Item **v8 -> v9**, `in-review -> release-ready`, `owner: principal-swe-infra`,
  `next_role: workflow-ship -> "@operator"`, `lease: null`, `resume_state: null`.
- Acceptance criteria **1–8 all ticked**; criteria 3, 5 and 6 were ticked *here*, which is
  where the review explicitly left them ("ticking belongs to the owner and the ship gate,
  on their own evidence").
- `waiting_on_questions: []`; `Q-pack-split-ci-partition-checks-01` closed 1740.
- Dependencies: `pack-split-crosspack-validator` **shipped**, `pack-split-preflight-compat`
  **shipped** — both `requires: shipped`, both met, neither type weakened.
- **Milestone `dependency-guarantees` stays at 4 of 5 required items `shipped`.**
  `release-ready` is not `shipped`. It becomes 5 of 5 only after production verification,
  and **declaring the milestone met is the steward's call, not this gate's.**
- **Dependent not cleared:** `pack-split-generated-pack-trees` stays `proposed` at 4 of 6
  met — it requires this item at `shipped`, and it is outside `scope.current` regardless.
- **Routed to the steward, not closed here:** decomposition Open Question 4
  (director-availability completeness) is now answerable — criterion 4 is ticked on
  `availabilityErrors` pinning all three rules over `DISPATCHING_ROLES`. Closing an
  initiative open question is the steward's act.

---

## Rollout plan

**Big-bang, and justified rather than assumed.** Two distinct surfaces ship together:

**(a) The four CI gates — build-time only.** They run in GitHub Actions on `push` to
`main` and on every `pull_request`. There is no runtime path, no user cohort, no
percentage, no ring and nothing to flag off, so none was invented. Blast radius is **this
repository's CI**: if a gate is wrong, every PR goes red until it is reverted. Nobody's
running system changes.

**(b) The `fleet-observation` -> `kai-core-fleet-observation` rename — user-visible.**
The skill is `user-invocable: true`. Updates reach users through `/plugin update kai` or
a new session (the host loads the plugin from the repo), so adoption is per-session and
effectively immediate on update, with **no alias for the old name**. Anyone invoking
`fleet-observation` gets nothing after updating.

**Why no alias, and why that is not smuggled scope:** the initiative's non-negotiable is
"Core skills carry the owned-namespace `kai-core-*` prefix", and 22 core skills were
already renamed this way in earlier landed work — this is the 23rd and last, the single
violation the new prefix check finds. The rename is *forced* by the gate this item adds
(the tree goes red until it lands) and *contained* (an orphan skill; no agent inherits
it, so no `**Inherits:**` line changed). It is recorded in the `0.62.0` CHANGELOG and in
the README `## Status`.

**Monitoring signal:** the `validate` workflow run on `main` at the merge commit — the
same twelve steps, minus the `pull_request`-only release-guard. There is no other
telemetry, and none is claimed.

**Owner at 3am:** `principal-swe-infra`.

## Rollback plan

**Clean, and reversible in one command.** No data changed, no migration ran, no state was
written anywhere. `COMMITTED_PACKS` is `[]`, there is no `packs/` tree, and the
marketplace still lists one plugin, so no consumer has installed anything new.

1. `git revert -m 1 <merge-sha>` on `main`, push, and let `validate` go green — the four
   gate steps disappear with the workflow revert, the prefix check goes with them, and
   the skill directory moves back to `skills/fleet-observation/`.
2. Cut a follow-up `0.x` bump (`0.63.0`) with a CHANGELOG entry stating the revert. Do
   **not** silently reuse `0.62.0`.
3. If `v0.62.0` was already tagged and released, **delete or supersede it explicitly** —
   a tag pointing at a reverted state is the one durable artefact a revert does not clean
   up by itself.

**What a rollback does NOT undo:**

- Any user who already ran `/plugin update kai` and learned `kai-core-fleet-observation`
  loses that name again. There is no alias in either direction, so the flip-flop is
  visible to them. This is the only irreversible-ish consequence, and it is cosmetic.
- The published `v0.62.0` release notes, once out, are public. Superseding is an explicit
  act (step 3), not automatic.

**Kill switch:** none exists and none was invented. Reverting the commit *is* the switch;
for a build-time gate that is the proportional answer.

---

## Deploy handoff — the human runs these; kai does not

`workflow-ship` recorded this release. It did **not** push, merge, tag, release or
publish anything, and it will not. Step 1 is the mechanical re-check of the one
attestation this gate could not fully re-derive.

1. **Confirm the PR head still carries the *reviewed* implementation, unchanged — and
   that nothing else rode along.** Run this **before** committing the records.
   ```bash
   git fetch origin
   git diff --exit-code \
     aca16e56d3d70cf6bac5181a41c3d4a87055dccc \
     origin/kai/feat/29-ci-partition-checks -- \
     .github/workflows/validate.yml .github/plugin/marketplace.json \
     CHANGELOG.md README.md docs/ \
     package-lock.json package.json plugin.json \
     scripts/ skills/ test/fixtures/inventory.json

   git diff --name-only 16493a303c6532c8a7d0c78faf5c9027a5c9d998 \
                        origin/kai/feat/29-ci-partition-checks
   ```
   The first command **must exit 0** — that is the whole of the review binding. The
   second must list only paths under the eleven top-level entries this gate derived
   (`.github`, `CHANGELOG.md`, `README.md`, `docs`, `kai`, `package-lock.json`,
   `package.json`, `plugin.json`, `scripts`, `skills`, `test`) — with **nothing** under
   `agents/`, `examples/`, `packs/`, and no change to `hooks.json` or `AGENTS.md`.
   Under `skills/` it must be **exactly two** paths, the two halves of the rename.
   Anything else is scope drift: stop and return the item.

2. **Finish this record's promotion, then commit the readiness records** (coordination +
   library only — `kai/` is not a `BEHAVIOR_PREFIX`, so no further version bump is owed;
   the PR's own release-guard step already passed). This environment cannot create
   directories, so the move is yours; doing it **here** keeps it in the same records
   commit, so no post-ship reconciliation is owed.
   ```bash
   mkdir -p kai/library/releases/2026-08-25/04-ship-pack-split-ci-partition-checks
   git mv kai/library/releases/2026-08-25/04-ship-pack-split-ci-partition-checks.md \
          kai/library/releases/2026-08-25/04-ship-pack-split-ci-partition-checks/ship-record.md
   git add kai/ && git commit -m "docs: record ci-partition-checks ship gate"
   ```

3. **Push, then confirm the required check is green on the *final* head.**
   ```bash
   git push origin kai/feat/29-ci-partition-checks
   gh pr checks 160        # `contract` must pass on the final head
   ```
   Pushing moves the PR head; the review still binds because step 1 proves no
   implementation or release file moved, so `change_ref` stays at `aca16e56…`. Run
   `32915426171` only proves head `63f6da16…`. **Confirm the four gate steps are green on
   whatever head you merge** — a green summary tick is not the same claim.

4. **Merge PR #160** — GitHub **Squash and merge** (repo convention; GitHub auto-appends
   `(#160)`). The base is `main` at `16493a303c…`, which is the branch's own merge base,
   so **no rebase is needed — and a rebase would change the tree and void both the review
   binding and the CI evidence.** Do not push further commits after the final green check.
   <https://github.com/RubenSaucedo/kai/pull/160>

5. **Watch `validate` on `main`** at the merge commit (push event — the
   `pull_request`-only `Release-guard --base --head` step is correctly skipped; the other
   **eleven** substantive steps, including all four named gates, must be green). All green
   before step 6.

6. **Per `AGENTS.md`, tag and release** once `main` is green:
   ```bash
   git tag v0.62.0 && git push origin v0.62.0
   ```
   then cut the GitHub release from the `[0.62.0]` CHANGELOG section.

   **Release-note language is constrained by what was actually proven.**

   *Say, because it is proven:* the pack partition is now enforced by **four named CI
   gates** that fail by name; the validator, the gate runner and the mutation self-test
   run the **same** functions, so a gate cannot be green in CI and red in its own proof;
   core-provided skills are held to the `kai-core-*` prefix **in both directions**; and
   `fleet-observation` is now `kai-core-fleet-observation`.

   *Say, because users need it:* the rename is a **breaking rename of a user-invocable
   skill** and **no alias ships** — anyone invoking `fleet-observation` must switch to
   `kai-core-fleet-observation`.

   *Do not say:* that any pack is generated, committed, published or installable
   (`COMMITTED_PACKS = []`, no `packs/` tree, marketplace still N=1); that the split is
   done; that partial-install or version-skew has been **measured on a real host** (the
   arms are generator-level — host certification stays owed at `pack-split-host-gates`);
   or anything that re-introduces the host-resolution claim A2 removed — no
   "first-found-wins", no "the host keeps the first copy", no "install order decides".
   The shipped prose deliberately claims the **absence of a guarantee**; the release note
   must not upgrade that back into a mechanism.

7. **Return the deployment evidence** to `workflow-ship` (see below) so CONFIRM-START and
   CONFIRM-COMPLETE can run. **Do not mark this item `shipped` by hand.**

**Abort criteria — stop, and return the item rather than pushing through:**

- step 1's implementation/release diff is **non-empty** — the review no longer binds, a
  new ref must be minted and re-reviewed by `principal-swe-architect`;
- step 1's name list contains anything under `agents/`, `examples/` or `packs/`, touches
  `hooks.json`, or lists more than the two rename paths under `skills/` — scope drift;
- `contract` is red on the head you intend to merge, or **any one of the four gate steps**
  is red or missing, or `mergeable_state` is no longer `clean`;
- `main` is red at the merge commit — **revert before tagging** (rollback plan), and
  return the evidence here.

---

## Production verification

All read-only. Return the evidence; `workflow-ship` re-derives what this environment can
and records the rest as operator-attested.

1. **Deployment start evidence (CONFIRM-START):** merge timestamp, merge commit SHA on
   `main`, and the `main` `validate` run URL/ID with its start time.
2. **Deployment completion evidence (CONFIRM-COMPLETE):** that run's
   **`conclusion: success`** at the merge `head_sha`, **with the four named gate steps
   individually `success` in the `main` run** — not only on the PR. A run URL without a
   successful conclusion is not completion.
3. **Version coherence at `0.62.0` on `main`** — `plugin.json`, `package.json`,
   `package-lock.json` ×2, `.github/plugin/marketplace.json` ×2, the README `## Status`
   stamp (56 agents / 51 skills) and the dated `## [0.62.0] - 2026-08-25` CHANGELOG
   section with a **non-dangling** compare link (tag `v0.61.0` must exist and peel).
4. **Marketplace still exactly one entry** — `plugins[]` length 1, `kai`, `source: "."`.
5. **`COMMITTED_PACKS` still `[]` and still no `packs/` tree** at the merge commit —
   proven **positively** from the merge commit's complete root tree, not from a local glob.
6. **The rename landed in production** — `skills/kai-core-fleet-observation/SKILL.md`
   present, `skills/fleet-observation/` absent, and the merge diff under `skills/` is
   **exactly those two paths and no other skill body**.
7. **`agents/` byte-identical to the base** — subtree
   `c0284f31c7cd221cc2f31712f98148482c5ac49a` on both sides. No agent body changed, no new
   tool grant.
8. **Tag and release point at the merge** — `v0.62.0` peels to the merge commit; release
   published, not draft, not prerelease; **body read in full** and holding the step-6
   language constraints (including the breaking-rename notice).
9. **`check-runs` on the merge SHA `total_count: 1`** — no second red check behind the green.

**Expected threshold: 9 of 9.** Any failure -> do **not** mark `shipped`: invoke the
recorded rollback through the operator, capture `production-verification` in
`resume_state`, and set `blocked` with `principal-swe-infra` named. Only `workflow-ship`
may later return the item to `release-ready`, and only on rollback/cleanup evidence.

### Outcome — 2026-08-25-1751: **PASSED 9 of 9. SHIPPED.**

Re-derived read-only against merge commit `b72453f1ed46393e77722995212920b9f8615c79`.
This session had **no shell**: every fact is an `api.github.com` /
`raw.githubusercontent.com` read pinned at that SHA, plus local `.git` ref reads.
**Nothing was executed, and no implementation or release file was edited.**

| # | check | result |
|---|-------|--------|
| 1 | deployment start | PR #160 `merged: true` at **2026-08-26T00:50:07Z** into `b72453f1…`, squash, parent `16493a303c…` (**no rebase**); `main` run `32916653342` started 00:50:12Z; local `.git/refs/heads/main` agrees — **PASS** |
| 2 | completion, four gates green **in the `main` run** | job `98021655301` **`success`**, 00:50:12Z -> 00:50:27Z (**15s**); steps 9–12 each `success`; eleven substantive steps green; release-guard correctly `skipped` on a push event — **PASS** |
| 3 | `0.62.0` coherent across all eight locations | `plugin.json`, `package.json`, `package-lock.json` ×2, `marketplace.json` ×2, README `## Status` (`v0.62.0` — 56 agents and 51 skills), `## [0.62.0] - 2026-08-25` + compare link; `v0.61.0` tag (`e88857db…`) exists, so **not dangling** — **PASS** |
| 4 | marketplace exactly one entry | `plugins[]` length 1, `kai` at `source: "."` — **PASS** |
| 5 | `COMMITTED_PACKS` `[]`, no `packs/` tree | read in production at `scripts/lib/pack-plan.mjs`; merge root tree `truncated: false`, 21 entries, **`packs` absent** — **PASS** |
| 6 | the rename landed | `skills` subtree carries `kai-core-fleet-observation`, **no** `fleet-observation`; 51 skill dirs; `SKILL_OWNER_OVERRIDES` maps the new name to `core`; subtree identical to the ratified ref — **PASS** |
| 7 | `agents/` byte-identical to base | `c0284f31c7cd221cc2f31712f98148482c5ac49a` at base **and** merge — **PASS** |
| 8 | tag and release point at the merge | annotated tag `cf91008b…` **peels to `b72453f1…`**; release `376800860`, not draft, not prerelease; **body read in full** and holding the step-6 constraints, including the breaking-rename notice — **PASS** |
| 9 | `check-runs` on the merge SHA | `total_count: 1`, `success` — **PASS** |

**One reading did more work than the other eight combined.** The merge commit's complete
root tree is **byte-identical to the ratified `aca16e56…` on every top-level entry except
`kai/`** (coordination and library records). The PR head had moved twice past the reviewed
ref (`63f6da16…`, then `1617c819…`) and the merge was a **squash** — three ways the
reviewed object could have drifted into production unnoticed. It did not, and that is
proven from git objects rather than from anyone's attestation: **what runs in production
is, byte-for-byte, what the architecture review ratified.** `change_ref` therefore stays at
`aca16e56…` — deployment moves state, not the reviewed ref.

**Rollback was never invoked.** No step of the recorded rollback plan was needed or run,
`v0.62.0` stands, and the plan above remains the reversal path if one is ever required.

**Milestone.** `dependency-guarantees` now has **5 of 5** required items `shipped`. That is
a **count, not a closure** — declaring the milestone met, advancing `scope.current`, and
closing decomposition Open Question 4 are the **steward's** calls, routed to
`principal-product-manager` and deliberately not taken by this gate.

---

## Follow-ups / parked

Parked at this gate in `kai/initiatives/pack-split/backlog.md` — none gated the release,
none is fixed in PR #160, and none was deleted from a review:

- **N4** — `pack-plan.mjs:27` claims duplicate-name behaviour has been observed across
  hosts; the measured corpus is **one** host plus an open question. Owner:
  `principal-swe-infra`, at whatever next legitimately reopens that file.
- **N5** — the fail-closed property of `parseGeneratedKey` is inconsistent across its
  consumers: `guaranteeBlockErrors` errors on an unresolvable key, `packProviders` and
  the hooks-claimant filters still skip one. Reopen trigger named by the reviewer.
- **S1** — the rename ships **no alias** for a `user-invocable: true` skill, and the
  CHANGELOG files it under `### Added` rather than a breaking-change callout. Routed to
  `principal-product-manager` as a policy question for the remaining renames in the split,
  not a defect in this release.

**Dependents:** `pack-split-generated-pack-trees` requires this item at `shipped`. That
edge is now **satisfied** — it moves from 4 of 6 to **5 of 6** dependencies met. It stays
`proposed` and **non-dispatchable**: `pack-split-host-semantics-spike` is still not
`completed`, and it sits in `first-pack-extracted`, outside `scope.current`. No dependent
item record was edited — dependency satisfaction is derived at dispatch, never stored.
**Milestone `dependency-guarantees` is now 5 of 5 required items `shipped`.**

**For the steward, now due:** decomposition Open Question 4
(director-availability completeness) is answerable and can be closed — criterion 4 answers
it and `availabilityErrors` pins it in CI; the milestone's fifth required item is
satisfied, so milestone closure and whether `scope.current` advances are steward decisions,
not this gate's; and **S1** needs a policy for the remaining user-invocable renames.

<!-- /kai:allow-legacy-roots -->

---
type: work-item
id: pack-split-preflight-compat
title: Combined fail-closed preflight + version-compat in each pack agent body, CI byte-pinned
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: shipped
resume_state: null
priority: 10
owner: principal-swe-infra
next_role: null
target: pack-split contract preflight + version compatibility
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - scripts/lib/inherits-block.txt
  - scripts/validate-plugin.mjs
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
touches:
  - skills/kai-core-contract-v1/SKILL.md
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/lib/preflight-block.txt
  - scripts/validate-plugin.mjs
  - .github/workflows/validate.yml
  # Declared at handback 2026-08-25-1157: the release and catalog rules in
  # AGENTS.md make these mandatory for any behaviour-sensitive change, so they
  # are recorded rather than left as a silent expansion. No new capability.
  - scripts/generate-catalog.mjs
  - docs/reference/agents-and-skills.md
  - test/fixtures/inventory.json
  - README.md
  - CHANGELOG.md
  - plugin.json
  - package.json
  - package-lock.json
  - .github/plugin/marketplace.json
depends_on:
  - item: pack-split-generator-gates
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
  - role: principal-security
    kind: independent-security
completed_reviews:
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: 3383d7f2476f6ccdec5b4d3077783a13fe47eeb7
    verdict: ratified
    evidence: "## Review — independent architecture (ratification), 2026-08-25-1248"
    timestamp: 2026-08-25-1248
  - role: principal-security
    kind: independent-security
    change_ref: 3383d7f2476f6ccdec5b4d3077783a13fe47eeb7
    verdict: clear
    evidence: "kai/initiatives/pack-split/artifacts/security/pack-split-preflight-compat.md"
    timestamp: 2026-08-25-1257
change_ref: 3383d7f2476f6ccdec5b4d3077783a13fe47eeb7
version: 17
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-25-1328
---

## Outcome

`kai-core-contract-v1` exists as a real core skill, and the generator injects a combined
fail-closed **preflight + `contract: 1` version check** into each pack agent's own body,
pinned byte-for-byte in CI like `inherits-block.txt`. Core-absent and core-version-skew
each produce the exact refusal token; no silent-degradation path in the tested arms.

## Acceptance

*Tightened by the steward at promotion 2026-08-25-1139 against the shipped foundation
(`pack-split-generator-gates`, `v0.58.0` on `main`). Two changes only, both required by
findings already on the record — no new requirement was added and the bar was not raised:
(1) the injection point is named as the **authoritative generator path**
(`materializePacks` in `scripts/lib/pack-plan.mjs`, whose own header defers guarantee-block
injection to this item) rather than the throwaway preview, per the steward's generator-gates
acceptance correction of 2026-08-24-2240 that assigned guarantee-block injection downstream;
(2) the bundled "local commands + CI green" criterion is **split**, because the
2026-08-24-2244 DoD gate bounced `generator-gates` for exactly that bundling — two claims
with two different evidence sources cannot share one checkbox.*

- [x] `skills/kai-core-contract-v1/SKILL.md` exists as a real core skill returning the rigid
      `KAI_CORE_READY` / `contract: 1` marker. Today only the `CONTRACT_SKILL` / `REFUSAL`
      constants exist (`scripts/lib/pack-plan.mjs`); the skill is script-synthesized, not on disk.
      — **DONE 2026-08-25-1219.** The operator created the directory and wrote the file; it is on
      disk with the exact body recorded in the 2026-08-25-1157 HANDOFF, verified by reading it
      here. The prior **BLOCKED** annotation and its "no shell / cannot create a directory"
      rationale are **superseded and no longer true**.
- [x] The combined preflight + version check is injected by the **authoritative generator
      path** (`materializePacks`), so a committed tree — not only a `--all` preview — carries
      it; placed after each pack agent's `**Inherits:**` line, with exactly one such line remaining.
      — Implemented in `scripts/lib/pack-plan.mjs` (`preflightBlock` / `injectPreflight`, core
      excluded) **and now executed.** `pack-preview --self-test` (44 checks, 0 failures) asserts
      over real `materializePacks` output that a department agent carries the block, that no core
      agent does, and that core provides the probe at `kai-core/skills/kai-core-contract-v1/SKILL.md`
      (`scripts/pack-preview.mjs:404–410`); the placement/verbatim-once/LF assertions cover the
      anchor. The anchor was also corrected — the block now lands after the whole inherits
      directive, not between the line and the blockquote that binds it.
- [x] The injected block is pinned byte-for-byte in CI from a canonical
      `scripts/lib/preflight-block.txt`, following the existing `scripts/lib/inherits-block.txt`
      pin precedent in `scripts/validate-plugin.mjs`.
      — Implemented (canonical file + validator section that regenerates and compares verbatim,
      once, in position, absent from core, over a rigid probe) **and now executed locally**:
      `node scripts/validate-plugin.mjs` reports valid, 56 agents / 51 skills. The pin *mechanism*
      is proven; proof that **CI runs it on the PR** is the separate unticked criterion below.
- [x] Core-absent and `contract: 2` arms each produce the exact `KAI-CORE-MISSING` refusal
      token in `node scripts/pack-preview.mjs --all --out <dir>`.
      — **Executed, all three arms.** Contract 1: `preflight ready`. `--no-core`: exact
      `KAI-CORE-MISSING`. `--contract 2`: exact `KAI-CORE-MISSING`. The operator's log abbreviates
      these as `--all`, but `--out <dir>` was necessarily supplied — `buildAll` calls
      `rmSync(out, …)` / `join(out, …)` on its first statements (`scripts/pack-preview.mjs:143`),
      so `--all` without `--out` throws before building anything. The criterion's exact command
      form was therefore exercised.
- [x] `node scripts/pack-preview.mjs --self-test`, `node scripts/pack-preview.mjs --check`,
      `node scripts/validate-plugin.mjs`, and `npm test` pass **locally**.
      — **All four pass.** `--self-test`: 44 checks passed. `--check`: passed (no committed packs
      configured — the expected result while `COMMITTED_PACKS` is empty). `validate-plugin`: valid,
      56 agents / 51 skills. Full `npm test`: passed, which also carries the catalog check,
      host-contract self-test (inventory matches), release-guard self-test, and syntax check.
      The earlier "**Not run.** No shell." annotation is **superseded**.
- [x] The `validate` workflow runs **green on the pushed PR** (its own claim, its own
      evidence — a workflow run, not an assertion).
      — **DONE 2026-08-25-1310, ticked by `workflow-ship` with the run URL, not by assertion.**
      The operator committed (`d4145eed69681e20d2443a4242e687a9036bf557`, the single commit on
      `kai/feat/29-preflight-compat` off `9d16e075…`), pushed, and opened **PR #154**. GitHub
      Actions run **32893764931** — workflow `validate`, event `pull_request`, `head_sha`
      `d4145eed…`, `run_attempt: 1`, `status: completed`, **`conclusion: success`**; job
      **`contract`** (`97951496629`) on `ubuntu-latest` / Node 20,
      `2026-08-25T20:10:09Z -> 20:10:23Z` (**14s**), **all 11 substantive steps `success`**,
      including step 4 `Validate plugin contract` (the new byte-pin), steps 8–9 the pack-generator
      self-test and committed-tree check, and step 11 the `pull_request`-only **real**
      `Release-guard --base --head` gate. Read directly from `api.github.com` by that run
      (read-only). <https://github.com/RubenSaucedo/kai/actions/runs/32893764931/job/97951496629>
      The prior "**Still unticked, deliberately** … no commit on it" annotation was true when
      written and is **superseded**.
- [x] Version bumped on `0.x` with CHANGELOG + README stamp.
      — `0.58.0 -> 0.59.0` in `plugin.json`, `package.json`, `package-lock.json` (both fields),
      `.github/plugin/marketplace.json` (`metadata.version` + the `plugins[]` entry), plus the
      dated `## [0.59.0] - 2026-08-25` CHANGELOG section, its `[0.59.0]:` compare link, and the
      README `## Status` stamp (`v0.59.0`, 56 agents / 51 skills). Verified by reading all eight
      locations; this criterion needs no execution.

## Evidence

**Implemented 2026-08-25-1157 by `principal-swe-infra` in the working tree at `C:\src\kai`.
Blocker resolved and verification run by the operator 2026-08-25-1219; reconciled here by
`principal-swe-infra` (record only — no implementation or release file was touched by the
reconciliation).** Still no commit, push, PR, tag, release, or publish.

**Blocker — RESOLVED 2026-08-25-1219. The paragraph it replaces is superseded, not deleted from
history: it survives verbatim in this item's thread at the 2026-08-25-1157 HANDOFF.** The
environment constraint was real when recorded (the file tool would not create a file under a
missing parent directory, and that run had no shell). The operator created
`skills/kai-core-contract-v1/` and wrote `SKILL.md` with the exact body from that HANDOFF —
confirmed by reading the file here, front matter and both marker lines intact. **Every "no shell",
"nothing was run", and "fails by design until the skill lands" claim on this record is now stale
and must not be carried into review.**

**Verification — operator-run 2026-08-25-1219, recorded as attested (this reconciliation has no
shell and did not re-execute anything).**

| command | result |
|---|---|
| `pack-preview --self-test` | 44 checks passed |
| `pack-preview --all` (contract 1) | preflight ready |
| `pack-preview --all --no-core` | exact `KAI-CORE-MISSING` |
| `pack-preview --all --contract 2` | exact `KAI-CORE-MISSING` |
| `pack-preview --check` | passed — no committed packs configured |
| `validate-plugin` | valid, 56 agents / 51 skills |
| catalog check (`docs:check`) | passed |
| host-contract self-test | passed, inventory matches |
| release-guard self-test | passed |
| syntax check | passed |
| `npm test` (full) | passed |

**One command failed, and it is stated rather than buried.** The operator additionally attempted
`node scripts/generate-fixture.mjs`. **That script does not exist in this repo** (confirmed: no
`scripts/generate-fixture.mjs`, and no `package.json` script references it), so the command failed
on a missing file **before touching anything** — no partial write, no side effect, nothing to roll
back. It is **not** part of `npm test`, not referenced by any acceptance criterion, and not the
gate for the fixture it was aimed at. `npm run docs:generate` — the real catalog generator — did
succeed, and the hand-edited `test/fixtures/inventory.json` was then validated by the **real**
gate, `node scripts/host-contract.mjs --self-test`, which passed with the inventory matching. So
the failure changes no verdict above; it was a wrong guess at a helper name, corrected by using
the gate that actually owns the fixture.

**Changed files (16).** New: `scripts/lib/preflight-block.txt`,
`skills/kai-core-contract-v1/SKILL.md` *(now on disk)*. Modified: `scripts/lib/pack-plan.mjs`,
`scripts/pack-preview.mjs`, `scripts/validate-plugin.mjs`, `scripts/generate-catalog.mjs`,
`docs/reference/agents-and-skills.md`, `test/fixtures/inventory.json`, `README.md`,
`CHANGELOG.md`, `plugin.json`, `package.json`, `package-lock.json`,
`.github/plugin/marketplace.json`, and this record + its thread.

**Design decisions a reviewer should test, not assume.**

- **Injection anchor corrected.** The prototype spliced at the first blank line after the
  `**Inherits:**` line, which put the preflight *between* that line and the `> Load and apply…`
  directive that binds it. Injection now lands after the whole directive block.
- **Core agents are excluded.** They ship inside the pack that provides the probe, so a preflight
  there could only fail on itself.
- **One prose source.** The block text exists only in `scripts/lib/preflight-block.txt`; the
  generator, the preview and the validator all read it. No copy of the prose lives in JS.
- **`kai-core-contract-v1: core`** is an explicit `SKILL_OWNER_OVERRIDES` entry. The nine ratified
  orphan dispositions are untouched; the paired `orphans.length === overrides.length` assertion
  still holds at 10/10, so the invariant was not weakened to accommodate the new skill.
- **Firing path.** The probe is not `user-invocable` and no root agent inherits it, so the
  validator's firing-path check exempts exactly the skill the canonical block names — derived
  from the block, not a hardcoded exemption.
- **No new CI step.** `validate-plugin.mjs` and `pack-preview --self-test` already run on every
  PR and push, so `.github/workflows/validate.yml` (in `touches`) was deliberately **not**
  changed; there is no coverage gap to close.

**Held boundaries.** No degraded-mode block (that is `pack-split-degraded-refusal`); no
version-skew *CI arm* (that is `pack-split-ci-partition-checks`); no `packs/` tree —
`COMMITTED_PACKS` stays empty and `--write` still refuses; no cross-pack validator, collision
gate, fleet rename, migration doctor, marketplace publication, tag or release.

**Both reviews still owed, and neither can bind yet.** `principal-swe-architect` /
`independent-architecture` and `principal-security` / `independent-security` must ratify the
**same** `change_ref`, and `change_ref` is `null` because nothing is committed. Branch
`kai/feat/29-preflight-compat` now exists, cut from `9d16e0751cc223f9bc9421cedbf0ac32b134b9c3`
(`main` after PR #153), but the reflog shows **no commit on it** — the work is still an
uncommitted working tree, now on a branch instead of on `main`. The operator commits and pushes;
both reviews then ratify that same `change_ref`. Local green does not substitute for either
review, and `next_role` stays `principal-swe-architect` pending that binding.

**Scope unchanged by this reconciliation.** No pack trees, no marketplace pack entries, no
degraded-mode block, no cross-pack validator, no collision gates, no migration logic, no tag, no
release, no publication. `COMMITTED_PACKS` is still empty and `--write` still refuses, so the
committed-unpublished non-negotiable holds.

## Review — independent architecture, 2026-08-25-1231 (`principal-swe-architect`)

**Verdict: CHANGES REQUIRED.** Bound to `change_ref a15bd82310737abe550fe660f3677eb19f1c0da2`
(reviewed against the worktree on the operator's attested empty diff for all
implementation/release files; this run had no shell and re-derived nothing by execution).
**No entry was added to `completed_reviews`** — the `independent-architecture` requirement is
**not** satisfied, and a non-ratifying verdict must not sit in a list whose only meaning is
"requirement met at this ref". `principal-security` is **not** unblocked; it should review the
**next** ref, not this one.

**The seam is right. Two guards on it are incomplete, both silent under a fully green CI.**
The shape — one canonical block, injected by the authoritative generator into non-core agents
only, over a core-owned probe, with root as the single source — is the correct structure and I
endorse it as designed. Neither finding is a defect in behaviour *today*; both are holes in the
pin this item exists to provide, and both are closable inside files already in `touches`.

### A1 — the contract version the block demands is the only semantic element of the canonical block not pinned

`scripts/lib/preflight-block.txt` states the required version twice as bare prose literals
("whose value is exactly `1`", "anything other than `1`"). `scripts/validate-plugin.mjs:368–376`
pins three properties of that canonical file — it names `CONTRACT_SKILL`, it carries `REFUSAL`,
it carries the inherited-skill override sentence — and **none of them pins the version**.
`validate-plugin.mjs:391` and `pack-preview.mjs:101` each compare the *probe's* declared version
against an independent bare `'1'` literal. There is no `CONTRACT_VERSION` constant.

**Failure mode, concrete and CI-green:** change one character in `preflight-block.txt` so the
block demands `2`. `validate-plugin` passes (skill name, refusal token and override sentence
unchanged; the probe still declares `1`). `pack-preview --self-test` passes (block copied
verbatim once, in position, LF; the ready arm evaluates the *probe* against the JS literal and
still reports `ready`). Every generated department agent then carries prose instructing it to
reply `KAI-CORE-MISSING` against a perfectly healthy core — a fleet-wide refusal of every
non-core agent, reported green by every gate this item ships.

Presence-detection is pinned through two shared constants. Version-detection — the half this
item is *named* for — is pinned in the probe and in the JS checkers, but not in the prose that is
the actual instruction the agent obeys. The checkers agree with each other and nobody checks the
contract.

**Smallest fix** (no new file, no new CI step, no new capability):
1. Export `CONTRACT_VERSION = '1'` beside `CONTRACT_SKILL` / `REFUSAL` in `scripts/lib/pack-plan.mjs`.
2. In `validate-plugin.mjs`, assert every backticked version value the canonical block demands
   equals `CONTRACT_VERSION` (e.g. the set of backticked bare-digit tokens in the block must be
   exactly `{CONTRACT_VERSION}`), and replace the bare `'1'` at line 391 with the constant.
3. In `pack-preview.mjs:101`, replace the bare `'1'` with the constant.

### A2 — the generated-agent position check has no upper bound, so the downstream degraded block's obvious path silently demotes the preflight

`validate-plugin.mjs:411–416` asserts only two **lower** bounds: the block sits after the
`**Inherits:**` line and after the inherits blockquote. Nothing bounds how far below the
directive it may sit, and nothing asserts what may sit *between* them.
`scripts/lib/pack-plan.mjs` exports `injectPreflight(body, block)` — a generic "splice this
block at the inherits anchor" function whose anchor (`afterInheritsDirective`) returns the **same
index** every call for a given directive.

`pack-split-degraded-refusal` (`ready`, priority 40) must inject a second canonical block into
these same bodies through this same `materializePacks`. Its obvious composition —
`injectPreflight(injectPreflight(body, preflight), degraded)`, or a copy-pasted `injectDegraded`
reusing the anchor — resolves to that same index, placing the degraded block **above** the
preflight:

```text
  today (correct)                        downstream default (silent inversion)
  ─────────────────────────────          ─────────────────────────────────────
  ---frontmatter---                      ---frontmatter---
  **Inherits:** `a`, `b`, …              **Inherits:** `a`, `b`, …
  > Load and apply every skill …         > Load and apply every skill …
  ┌───────────────────────────┐          ┌───────────────────────────┐
  │ ## Core preflight —       │          │ ## Degraded-mode refusal  │  ← anchor
  │    before anything else   │ ← anchor └───────────────────────────┘
  └───────────────────────────┘          ┌───────────────────────────┐
  <agent prose>                          │ ## Core preflight —       │
                                         │    before anything else   │  ← demoted
  checks: after Inherits ✓               └───────────────────────────┘
          after blockquote ✓             <agent prose>
                                         checks: after Inherits ✓  after blockquote ✓
                                                 → STILL GREEN
```

The inversion ships green: one verbatim preflight copy, still after the line, still after the
blockquote. What breaks is meaning — a section headed "**before anything else**" that is no
longer first, and an "only exception to the inherited-skill loading directive **above**" sentence
with another block wedged between it and the directive it claims to except.

This item establishes the anchor and the position pin, so it is the cheapest place to make the
seam fail loudly rather than the next item's to discover.

**Smallest fix** (~3 lines, same file, no new gate) — in the generated-agent loop, after the two
existing lower bounds, assert only whitespace separates the end of `inheritsBlock` from the start
of the preflight, with the remedy in the message ("the preflight must be the first block after
the directive it excepts"). Every generated agent satisfies this **today**; it costs nothing now
and converts the downstream inversion into a named CI failure. Optional, not required: give the
injector an explicit anchor parameter so "after the preflight" is expressible rather than
accidental — that shape call belongs to whoever builds the degraded block.

### Ruled clean (investigated, no finding)

- **The ordering ambiguity is RESOLVED.** With the block landing after the whole directive, the
  two added sentences do the work: the heading claims primacy ("before anything else"), and the
  body names the earlier rule and overrides it ("the only exception to the inherited-skill
  loading directive above. Do not load or apply any inherited skill until this preflight
  passes"). The directive's own fallback clause ("if one cannot be loaded, these non-negotiables
  still bind you") does not survive as a competing instruction: those non-negotiables are
  *constraints*, not permission to act, and the block separately forbids the exact actions they
  reference — claiming work, taking a lease, writing workspace state, calling any tool, answering
  from memory, replying with anything but the token. No operative conflict remains.
- **Injection placement and the anchor.** `afterInheritsDirective` walks the blank line and the
  whole blockquote; splice yields exactly one blank line either side. Verified against the real
  shape of all **56** root agents — every one carries exactly one `**Inherits:**` line **and**
  the verbatim blockquote, so the block's "directive above" reference never dangles, and the
  no-anchor branch is unreachable for the shipped roster (still correctly covered by a self-test).
- **The anchor's known regression is already guarded.** A second blank line between the
  `**Inherits:**` line and its blockquote would silently re-open the original defect (block
  wedged inside the directive) — `validate-plugin.mjs:414`'s second lower bound catches exactly
  that. Good guard; A2 is the missing symmetric one.
- **Core exclusion and probe ownership.** `materializePacks` injects on `p.kind !== 'core'`;
  the validator asserts `copies === 0` for every core agent and `=== 1` for every department
  agent over **real generator output**, not a preview. Core owns the probe
  (`kai-core/skills/kai-core-contract-v1/SKILL.md` asserted present).
- **The probe is a probe, not a second operating contract.** Two output lines, explicit "no
  restatement of any kai rule". It cannot drift from core because it says nothing core says —
  the same principle the degraded-block non-negotiable states.
- **The 51st skill and the nine ratified orphan dispositions.** All nine prior entries are
  byte-identical; `kai-core-contract-v1: core` is added as the tenth. `orphans.length ===
  overrides.length` **plus** `unplaced.length === 0` is set equality, not a count coincidence,
  so the invariant was genuinely not weakened to admit the new skill.
- **Firing-path handling.** The exemption is derived from the block (`preflight.includes(id)`),
  not hardcoded — if the block stops naming the probe, the exemption vanishes *and* the earlier
  content check errors. Correct direction of coupling.
- **Root as source, boundaries held.** Skill and core-agent bodies copied verbatim; nothing
  moved. `COMMITTED_PACKS` empty, `writeCommitted` refuses, no `packs/` tree on disk. No degraded
  block, no cross-pack validator, no collision gates, no migration, no pack publication.
- **Release/catalog integrity.** `0.59.0` coherent across `plugin.json`, `package.json`,
  `package-lock.json` (both fields), `marketplace.json` (`metadata.version` + the entry),
  CHANGELOG section + compare link, README `## Status`. Marketplace still **N=1**, `kai` at
  `source: "."`. Catalog and inventory both carry the new skill at 51.
- **Windows/LF.** `normalizeLF` on bodies, block `trimEnd`ed, splice joins on `\n`, validator and
  probe reads normalise. No mixed endings reachable from a CRLF checkout.
- **"No new CI step" is true.** `.github/workflows/validate.yml:34,42,44` already runs
  `validate-plugin.mjs`, `pack-preview --self-test` and `--check` on every PR and push. Leaving
  the workflow untouched was correct, not an omission.

### What the refusal arms actually prove (no finding; stated so it is not over-read)

`evaluatePreflight` re-implements the block's rule in JS over the built preview's probe file. The
arms therefore prove two real things — the `--no-core` and `--contract 2` builds genuinely omit
or skew the probe, and a rule of that shape yields the exact token — and they do **not** prove
that an agent carrying the block would refuse. That is an LLM-behaviour claim no static check can
make, and the acceptance criterion is satisfied as literally written (the command prints the
token). The record's "arms each produce the exact refusal token" should be read as the harness's
evaluation, not an agent's reply. A1 is the part of this gap that *is* mechanically fixable:
nothing currently ties the simulator's `'1'` to the block's `1`.

### Non-blocking observations (do not gate this item)

- **N1 — stale roster count in README prose.** `README.md:168` ("## What it ships") says
  "56 agents and 49 skills" against a true 51. `scripts/host-contract.mjs:142–154` deliberately
  scopes its count assertion to the `## Status` section, so this line is unguarded. **Pre-existing**
  (already wrong at 50 before this change), widened by one here. Doc fix; fold in with the A1/A2
  pass or take it as a release chore.
- **N2 — routed to `principal-security`, not decided here.**
  `skills/kai-core-contract-v1/SKILL.md` declares `tools: [view]` while its body forbids any tool
  call. All 51 skills declare a `tools:` line, so this follows house convention — but a
  trust-boundary probe holding a capability it must never exercise is a least-privilege question,
  and capability acceptance is security's call, not mine.

### Re-review scope

A1 and A2 only. Both are additive assertions plus one shared constant in
`scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs`, `scripts/pack-preview.mjs` — all
already in `touches`. No new file, no new CI step, no new capability, no acceptance criterion
added or raised. The re-review is scoped to those diffs against a **new** `change_ref`; nothing
else on this record needs re-litigating.

## Review — independent architecture (re-review), 2026-08-25-1241 (`principal-swe-architect`)

**Verdict: CHANGES REQUIRED.** Bound to `change_ref 96b693a1f8742b24234c88e170a17ef747bf6830`
(read through the worktree on the operator's attested byte-identity for all implementation and
release files; this run had no shell and re-executed nothing). **`completed_reviews` stays `[]`** —
the `independent-architecture` requirement is still unmet, and `principal-security` is still **not**
unblocked; it reviews the ref that closes this, not this one.

**A2 is closed. A1 is 3 lines short of closed.** One of the two version literals in the canonical
block is now pinned to the shared constant; the other is not, and the unpinned one is in the
**refusal** clause — so the residual failure direction is fail-**open** at a fail-closed trust
boundary, still green under every gate. That is the same finding, same severity class, not a new
bar. Scope of the return is a single assertion in `scripts/validate-plugin.mjs`. Nothing else on
this record needs re-litigating, and the design is unchanged and still endorsed.

### A2 — CLOSED, verified

`scripts/validate-plugin.mjs:416` computes `directiveEnd = directiveAt + inheritsBlock.length`
and `:421–423` rejects any generated body where `body.slice(directiveEnd, at)` is not
whitespace-only, with the remedy named in the message ("the preflight must remain the first
executable instruction"). That is exactly the upper bound the finding asked for. Checked the
edges, not just the happy path:

- **The downstream inversion now fails loudly.** `injectPreflight(injectPreflight(body, pf), deg)`
  places the degraded block between the blockquote and the preflight — non-whitespace in the
  slice — named CI failure instead of silent demotion.
- **Skipped-check branches are already covered elsewhere.** `inheritsBlock` null is a hard error
  at `:226`; a body missing the verbatim directive is a hard error at `:291`. Neither is a new
  silent path.
- **The wedge regression is still caught.** With `inherits-block.txt` being the blockquote only,
  a preflight spliced between the `**Inherits:**` line and the blockquote leaves `directiveAt >
  at`, so the `:419` lower bound errors first. Both bounds now hold, symmetrically.
- **Satisfied by every generated agent today** — `validate-plugin` reports valid at 56/51, so the
  new assertion cost nothing at introduction, as predicted.

### A1 — PARTIALLY CLOSED. The refusal clause's version literal is still unpinned

Landed and correct: `CONTRACT_VERSION = '1'` exported beside `CONTRACT_SKILL`/`REFUSAL`
(`scripts/lib/pack-plan.mjs:24`); both independent JS literals replaced with it
(`validate-plugin.mjs:394`, `pack-preview.mjs:104`); the block's *continue* clause pinned via
`preflight.includes(\`contract: ${CONTRACT_VERSION}\`)` (`validate-plugin.mjs:374`).

`scripts/lib/preflight-block.txt` states the demanded version **twice**. The check is a presence
test on the first occurrence only, so the second is unguarded:

```text
  scripts/lib/preflight-block.txt          pinned by validate-plugin.mjs:374?
  ───────────────────────────────────────  ─────────────────────────────────
  …returns `KAI_CORE_READY` and exactly
  `contract: 1`, continue normally…        ✓  includes(`contract: ${CONTRACT_VERSION}`)

  …or the contract value is
  anything other than `1`: stop…           ✗  nothing reads this literal
```

**Failure mode, concrete and CI-green — and the trigger is the contract bump this item exists to
make safe.** `preflight-block.txt` is a single hand-edited file; a v2 core is a *differently named*
skill, so a bump forces an edit here. Bump `CONTRACT_VERSION` to `'2'`, ship
`kai-core-contract-v2`, update the continue clause — and miss the refusal clause. Every gate stays
green (`CONTRACT_SKILL` named ✓, `REFUSAL` present ✓, `contract: 2` demanded ✓, probe declares 2
✓, block copied verbatim once, in position ✓). The shipped block then reads:

- continue iff the value is `2`
- stop iff the value is anything other than `1`

A healthy v2 core satisfies the continue clause **and** trips the refusal clause — fleet-wide
undefined behaviour. A stale v1 core trips neither cleanly, so the block **admits the skewed core
it exists to reject**. Same one-character mutation class as the original A1; worse direction,
because A1's mutation failed closed (spurious refusal) and this one can fail **open**.

**Smallest fix — one assertion, one file already in `touches`, ~3 lines.** In the canonical-block
section of `validate-plugin.mjs`, after the existing presence check, assert **set equality** over
every backticked version literal in the block rather than the presence of one. The invariant is
"the block demands exactly one version and it is `CONTRACT_VERSION`"; the form is yours. For
reference, this shape passes today unchanged and matches nothing else in the block
(`kai-core-contract-v1`, `KAI_CORE_READY`, `KAI-CORE-MISSING` carry no backticked bare digits):

```js
const demanded = new Set([...preflight.matchAll(/`(?:contract:\s*)?(\d+)`/g)].map((m) => m[1]));
if (demanded.size !== 1 || !demanded.has(CONTRACT_VERSION)) {
  err(PREFLIGHT_BLOCK_REL,
    `demands contract version(s) {${[...demanded].join(', ')}} but the shared constant is `
    + `${CONTRACT_VERSION} — every version literal in the block must be the same one, or the `
    + `block contradicts itself while CI stays green`);
}
```

`size !== 1` also catches a block that demands no version at all, which the current presence check
would report but a looser regex-only check would not.

**The scoping ambiguity here is partly mine, and this is not a raised bar.** The Review section of
2026-08-25-1231 specified "every backticked version value… the set of backticked bare-digit tokens
must be exactly `{CONTRACT_VERSION}`"; the HANDOFF summary compressed that to "the block's demanded
value" (singular). What landed is a fair reading of the summary. I am asking for the assertion as
originally written, not for anything additional.

### Also confirmed on this ref

- **N1 closed.** `README.md:168` now reads "56 agents and 51 skills"; `:34` `## Status` reads
  `v0.59.0` — 56 agents and 51 skills. Both agree with `validate-plugin`'s 56/51.
- **No implementation scope moved.** `COMMITTED_PACKS` is still `[]`, no `packs/` tree exists,
  `skills/kai-core-contract-v1/SKILL.md` is byte-unchanged (still `contract: 1`, still forbids any
  tool call), the CHANGELOG `[0.59.0]` section describes exactly this item's surface, and no
  degraded block, cross-pack validator, collision gate, migration logic, tag or release appeared.
  The A1/A2 pass stayed inside the three files it was scoped to plus the README line.
- **Everything ruled clean at `a15bd823…` still holds** and is not re-litigated: the seam, the
  anchor, core exclusion, probe ownership, the orphan-override set equality at 10/10, the derived
  firing-path exemption, LF handling, release coherence across all eight locations, and "no new CI
  step".

### Non-blocking, recorded not fixed (do not gate; do not fix in this pass)

- **N2 still routed to `principal-security`, undecided here.** `skills/kai-core-contract-v1/SKILL.md`
  declares `tools: [view]` while its body forbids any tool call. Capability acceptance is not
  architecture's to give.
- **N3 — `pack-preview`'s `contract === 1` is a mode selector, not a version demand.**
  `contractSkillText` uses the literal `1` to mean "serve the real shipped skill rather than
  synthesize". After a contract bump the `--contract 1` skew arm would serve the real v2 probe and
  the `--self-test` skew assertion would **fail loudly** — the right direction, so no finding. Worth
  a comment when the bump happens; not now.

### Re-review scope (unchanged in size)

The single `validate-plugin.mjs` assertion above, against a **new** `change_ref`. A2, N1 and every
prior ruled-clean item are settled and closed — do not re-open them. No new file, no new CI step,
no new capability, no acceptance criterion added or raised.

## Review — independent architecture (ratification), 2026-08-25-1248 (`principal-swe-architect`)

**Verdict: RATIFIED.** Bound to `change_ref 3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`
(read through the worktree on the operator's attested byte-identity for all implementation and
release files; this run had no shell and re-executed nothing — the green suite is **input**, not
verdict). **`completed_reviews` now carries this role/kind at this exact ref**, so the
`independent-architecture` requirement is satisfied **for this ref only**. `principal-security` is
**unblocked on this same unchanged ref** — if the ref moves, this entry stops counting and both
reviews must re-bind together.

**A1 is CLOSED, and closed better than I specified.** I asked for a validator assertion that would
police two prose literals. Infra removed the second literal instead: the block now states the
demanded version **once** and defines refusal as the *complement* of the continue clause, then pins
the survivor. That is a smaller structural change than the one I proposed and it removes the drift
*source* rather than detecting drift after the fact. Endorsed as landed.

### A1 — CLOSED. One literal, one back-reference, pinned

**The prose (`scripts/lib/preflight-block.txt`).** Exactly one demanded form remains:

```text
  - If it returns `KAI_CORE_READY` and exactly `contract: 1`, continue normally
    and never mention the check.                       ← the ONLY version literal
  - If the skill is unavailable, the marker is missing, or that exact contract
    line is not returned: stop immediately. Reply with exactly
    `KAI-CORE-MISSING` and nothing else.               ← back-reference, no literal
```

Checked the three things that matter, not just the literal count:

- **Exactly one version literal.** The block's other backticked tokens are
  `kai-core-contract-v1`, `KAI_CORE_READY` and `KAI-CORE-MISSING` — none carries a bare version.
- **Refusal is absence of that exact line, with no independent second literal.** The prior
  "anything other than `1`" clause is gone. Confirmed by search: no `anything other than` remains
  anywhere under `scripts/`.
- **The two clauses are exact complements, so there is no gap and no contradiction.** Continue =
  (marker ∧ exact line). Refuse = (¬available ∨ ¬marker ∨ ¬exact line). A skewed core returns
  `contract: 2`, so the exact line is not returned → **stop**. The fail-open reading the last round
  found — "continue iff 2, stop iff other than 1" — is now structurally unconstructible: there is
  no second clause to disagree with the first.
- **The bump-time trigger is gone.** At a contract bump the author edits one literal. There is no
  second one to miss, and the back-reference follows automatically.

**The pin (`scripts/validate-plugin.mjs:374–378`).** Extracts *all* backticked demanded values and
requires exactly one, equal to the shared constant:

```js
const demandedVersions = [...preflight.matchAll(/`contract:\s*([^`]+)`/g)].map((m) => m[1]);
if (demandedVersions.length !== 1 || demandedVersions[0] !== CONTRACT_VERSION) { err(…) }
```

Traced against the actual block and against the mutations that matter:

| mutation | result |
|---|---|
| today, unchanged | `["1"]`, equals `CONTRACT_VERSION` → **passes** |
| bump constant to `'2'`, forget the block | `["1"] !== "2"` → **fails by name** |
| re-add a second `contract: N` clause | length 2 → **fails** |
| drop the version from the block entirely | length 0 → **fails** |
| flip the block to `contract: 2` alone | `["2"] !== "1"` → **fails** (the original A1) |

No false positive: `kai-core-contract-v1` does not match, because the pattern anchors on a backtick
immediately followed by `contract:`. The generated bodies inherit this transitively — they are
byte-compared to the canonical block at `:405`, so a version literal cannot exist in an agent that
is not in the canonical file.

### A2 and prior ruled-clean architecture — re-confirmed unchanged on this ref

- **A2 adjacency guard intact and byte-unchanged.** `validate-plugin.mjs:416–425` still computes
  `directiveEnd` and rejects non-whitespace between the inherited-contract directive and the
  preflight, with both the `:419` lower bound and the `:421` split check still present. The
  `injectPreflight(injectPreflight(…))` inversion still fails by name.
- **Prose change did not strand a gate.** The override sentence pinned at `:379` is still present
  verbatim in the block; `pack-preview`'s self-test anchors on the `## Core preflight` heading and
  on `REFUSAL`, neither of which moved; nothing under `scripts/` asserted the deleted clause.
- **Nothing else moved.** `COMMITTED_PACKS` still `[]`, no `packs/` tree exists,
  `skills/kai-core-contract-v1/SKILL.md` byte-unchanged (still `contract: 1`, still forbids any
  tool call), `.github/workflows/validate.yml` unchanged — so "no new CI step" still holds.
- **Release coherence.** `0.59.0` across all eight locations (`package.json`, `package-lock.json`
  ×2, `plugin.json`, `marketplace.json` ×2, `README.md` `## Status`, `CHANGELOG [0.59.0]`);
  marketplace still **N=1** at `source: "."`; README `:34` and `:168` both read 56 agents / 51
  skills (N1 stays closed).
- **Orphan-override set equality still 10/10** (`pack-preview.mjs:395–398`: `orphans === overrides`
  **and** `unplaced === 0`), the derived firing-path exemption (`validate-plugin.mjs:474`) still
  reads from the block, and LF normalisation on a CRLF checkout still asserted.
- Everything ruled clean at `a15bd823…` and `96b693…` — the seam, the anchor, core exclusion, probe
  ownership — is settled and not re-litigated.

### Non-blocking, recorded not routed (no work is being created here)

- **N2 — still open, still `principal-security`'s to decide.** `skills/kai-core-contract-v1/SKILL.md`
  declares `tools: [view]` while its body forbids any tool call. Least-privilege acceptance is not
  architecture's to give; it travels to security on this ref.
- **N4 — new, deliberately not a finding.** The pin matches version literals of the form
  `` `contract: N` ``; a version stated as a bare backticked digit outside that form would escape
  it. No such literal exists today and the refusal clause no longer restates a version, so there is
  nothing to drift. Worth a glance by whoever performs the contract bump; **not** a required change
  and **not** routed as work.
- **N3 unchanged.** `pack-preview`'s `contract === 1` is a mode selector; it fails loudly at a bump.

### What this ratification does not do

It does not make the item `complete`, `release-ready` or `shipped`, and it does not tick the
CI-green-on-the-pushed-PR criterion — CI on the PR is evidence only CI can give. It does not accept
capability grants (N2) and does not clear `principal-security`. Milestone `dependency-guarantees`
remains **1 of 5 required items `shipped`**; `degraded-refusal` and `ci-partition-checks` still
require this item at `shipped` and stay non-dispatchable, and `crosspack-validator` still overlaps
it on `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs`, so the touch-conflict check at
dispatch still applies. No implementation or release file was edited by this review; nothing was
committed, pushed, merged, tagged, released or published.

## Review — independent security, 2026-08-25-1257 (`principal-security`)

**Verdict: CLEAR.** Bound to `change_ref 3383d7f2476f6ccdec5b4d3077783a13fe47eeb7` — the **same
unchanged ref** the architecture ratification binds, so both required reviews now bind one ref.
**P0: 0 — P1: 0 — P2: 2**, neither release-blocking and neither requiring a change at this ref.
`completed_reviews` now carries `principal-security` / `independent-security` at this exact ref;
full assessment at
`kai/initiatives/pack-split/artifacts/security/pack-split-preflight-compat.md`.

Read through the worktree on the operator's attested byte-identity for all implementation and
release files. **This run had no shell**: nothing was executed, no active check was run, and the
green `npm test` is **input, not verdict**. No implementation or release file was edited. **If the
worktree is not byte-identical to that object, this review does not bind.**

### The trust boundary holds, and it holds by structure rather than by vigilance

The security question this item exists to answer is narrow: a generated department agent that
cannot reach a compatible core must **refuse**, not degrade. It does, and the reason it does is
the part worth recording — the fail-open shape the two prior refs carried is now
*unconstructible*, not merely detected.

- **Refusal is the exact complement of continue, over one literal.** Continue = marker ∧ exactly
  `contract: 1`. Refuse = unavailable ∨ marker missing ∨ that exact line not returned. There is no
  second version literal to disagree with the first, so absence and skew share one path and no
  gap exists between the clauses.
- **The surviving literal is pinned by cardinality, not presence.** `validate-plugin.mjs:374–378`
  requires the set of demanded versions to be exactly `{CONTRACT_VERSION}` — a dropped version, a
  re-added second clause, a flipped literal, and a forgotten bump each fail **by name**.
- **The refusal names the exact dangerous actions.** "Do not claim work, take a lease, write
  workspace state, call any other tool, or answer the request from memory." This is the control
  that matters most to me: an agent whose contract skills are absent is precisely the agent most
  likely to corrupt `kai/coordination/**` while believing it is helping. Prevention is stated at
  the only layer that can still reach it.
- **Refusal leaks nothing** — one token, "and nothing else"; success is silent.
- **Primacy is mechanically bounded on both sides** (`validate-plugin.mjs:416–424`), and the
  no-anchor branch is unreachable for shipped agents because `:276–293` makes a missing
  `**Inherits:**` line or a missing verbatim directive a hard error.
- **Two independent keys guard the core exclusion.** The generator injects on `p.kind !== 'core'`
  while the validator's expectation keys on the `kai-core/` directory prefix. A mismatch in either
  direction is a named CI failure rather than a silent skip. That is a real second control and
  should not be "tidied" into one key.
- **Core exclusively owns the probe.** One provider per skill, `kai-core-contract-v1: core` as an
  explicit reviewed override, `core ∩ local = ∅` asserted in the self-test, and the probe asserted
  to materialise into `kai-core/`. A department pack cannot self-certify core's presence.
- **Missing or empty canonical block is a hard error**, and any error exits 1 on a workflow that
  already runs on every PR and push with `permissions: contents: read`.

### N2 — DECIDED: `tools: [view]` is **accepted** as adequate least privilege

Architecture routed this to me undecided. It is acceptable, and the reason is measured on the
shipped fleet rather than argued from principle:

1. **`tools: []` is not expressible.** `scripts/lib/loader-contract.mjs` rejects missing `tools`,
   a non-inline-array, *and* an empty array. The real choice is not "none vs `view`".
2. **The repo's declared semantic is a ceiling, not a grant** — `validate-plugin.mjs` states it
   outright ("A skill's `tools` is what that skill may use when loaded") and deliberately refuses
   to read a skill's `tools` as a requirement on the agent; that is what opt-in `requires_tools:`
   is for.
3. **Marginal capability is zero even under the opposite semantic.** All **56** agent files declare
   `view` — verified by reading every `^tools:` line under `agents/`, not assumed. No agent that
   could carry the injected preflight gains anything it did not already hold, so the ceiling-vs-
   grant ambiguity is **immaterial today**, not merely unlikely.
4. **`view` is read-only.** No `bash`/`shell`, no `create`/`edit`, no `web_*`, no `task`/
   `write_agent`. A fully subverted probe body cannot mutate, execute, or exfiltrate through its
   declared set.
5. **The probe is inert at this ref** — not `user-invocable`, inherited by nobody, no `packs/`
   tree, and the monolith injects no preflight; the firing-path exemption is *derived from the
   block* rather than hardcoded (`:474`), so if the block stops naming the probe the exemption
   vanishes.

**Not required, recorded as a watch condition:** `glob` would be strictly narrower (paths, no
contents). I am **not** asking for it — it would move a byte-pinned trust-boundary file for no
measured risk reduction. But point 3 is conditional: if a future agent ships **without** `view`
**and** the host turns out to treat skill `tools` as a grant, the probe becomes a genuine
(read-only) capability expansion. Both halves belong to `pack-split-host-semantics-spike`.

### P2-S1 — the generated-agent pin is gated on a pack-name pattern a future pack could fall outside

`validate-plugin.mjs:404` selects bodies with `/^kai-[a-z]+\/agents\/.+\.agent\.md$/`. All five
current pack keys are `[a-z]+`, so coverage today is **complete**. A future key with a hyphen or
digit (`kai-customer-success`) would not match, and that pack's agents would silently skip the
copy-count, position, and adjacency assertions.

This is a **pin-coverage** gap, not a live fail-open: the generator still injects on
`kind !== 'core'`, so those agents would carry the block; what is lost is verification, which only
bites alongside a second defect. Smallest fix if ever taken: `kai-[a-z-]+`, or derive the expected
set from `PACK_ORDER`/`planManifests` instead of a literal pattern. **Owner:**
`principal-swe-infra`, naturally folded into `pack-split-ci-partition-checks`, which already owns
partition/namespace work and already touches this file. **This review creates no item** — filing
is the steward's call.

### P2-S2 — evidence gap: no host-run evidence that an agent carrying the block refuses

Stated so it is not over-read later. `evaluatePreflight` (`pack-preview.mjs:91–116`) is a **JS
re-implementation** of the block's rule against a built preview's probe file; the arms prove those
builds genuinely omit or skew the probe and that a rule of that shape yields the exact token. The
validator proves every generated department agent carries the identical, correctly placed
instruction. Neither is evidence that a model **obeys** it.

Not release-blocking here — this item's acceptance is generation plus byte-pin, and host empirical
gates are explicitly out of my scope, already owned by `pack-split-host-gates` and
`pack-split-host-semantics-spike`. What it **does** bind: no downstream record, changelog entry, or
release note may say pack agents *refuse*. The truthful claim is that they *carry a pinned
fail-closed instruction*.

### Residual risk — recorded, none accepted by me

- **R1 — the boundary proves availability and compatibility, not authenticity.** The probe answers
  "is a skill named `kai-core-contract-v1` present and does it report contract 1", not "is it
  genuinely core's" — and it is the earliest instruction in a department session. A *compromised
  core* is not a widening (core supplies the operating rules anyway; that is total compromise
  either way). A *third-party plugin providing a same-named skill* is. **Exposure at this ref:
  none shipped** — `COMMITTED_PACKS` is `[]`, no `packs/` tree, marketplace still N=1 at
  `source: "."`. Owner: **operator**, at publication; technical unknowns owned by
  `pack-split-host-semantics-spike`, gating by `pack-split-crosspack-validator` /
  `pack-split-ci-partition-checks`.
- **R2 — the control is instruction-level, not host-enforced.** Byte-pinning and position-pinning
  are the strongest mechanical guarantees available at this layer; obedience is model behaviour.
  Owner: **operator** for acceptance, evidence owed by `pack-split-host-gates`.
- **R3 — the block's *semantic* integrity rests on human review of one file.** CI pins four
  properties; it cannot prove the absence of a future fail-open clause elsewhere in the prose. No
  such clause exists at this ref (whole file read). The control is that both required reviews
  re-bind on any ref change. No change requested.

**Recording a risk is not accepting it.** No residual risk is accepted by this review, and none
needs to be for the item to proceed — nothing is being waived.

### Also confirmed on this ref (security-relevant, non-duplicative of architecture)

- **Supply chain unchanged.** One git dependency, `lectoria`, pinned to a full commit SHA; both
  `package-lock.json` version fields at `0.59.0`; no dependency added, removed, or re-pointed.
- **No secret, credential, token, PII, tenant identifier, or endpoint** is read, written, logged,
  or transported by any file in this change. Nothing in the change reaches the network.
- **`.github/workflows/validate.yml` is unchanged**, still `permissions: contents: read`, so no CI
  privilege was widened to land this.
- **The probe is registered in the host-discoverable inventory** (`test/fixtures/inventory.json`),
  so it is not an undeclared surface.

### Not a finding, recorded so it is not rediscovered as one

The probe now ships inside the monolith, reachable only by explicit dispatch (no inheritance, not
`user-invocable`). A spurious load in a monolith session would emit two lines and stop — a
robustness wrinkle with no confidentiality, integrity, or privilege impact, and not
attacker-controlled. No change requested.

### What this review does not do

It does not make the item `complete`, `release-ready` or `shipped`; it does not tick the
CI-green-on-the-pushed-PR criterion; it does not accept residual risk; and it does not judge
anything outside the stated scope. **Routing note:** `next_role` is set to **`workflow-ship`**, not
`principal-product-manager`, because `kai-core-work-coordination` → *Review routing* step 4 sends a
`product-change` item to the ship gate once every `review_requirements` entry is satisfied at the
current ref, which is now true. The steward keeps the acceptance-criteria call and can re-route
cheaply; expect the DoD gate to bounce on the unticked "`validate` green on the pushed PR"
criterion, which is the correct mechanical outcome and **not** a security objection. Milestone
`dependency-guarantees` remains **1 of 5 required items `shipped`**; nothing downstream moved.

## Ship gate — DoD, 2026-08-25-1310 (`workflow-ship`, PREPARE)

**Verdict: RELEASE-READY — all six dimensions Clear, none Waived.** State
**`in-review -> release-ready`** (`resume_state` stays `null`). Lease self-granted at
version 12 (token `wsh-2026-08-25-1310-pfc-dod`, `version_at_grant: 12`, holder/token/version
re-read after grant), gate result written, lease **cleared**; version **12 -> 13 -> 14**.
`next_role: workflow-ship -> "@operator"`. Ship record written:
`kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md`.
The record was promoted to its canonical library home before merge; the move changed
coordination records only.

**kai did not merge, tag, release, or publish anything, and will not.** No implementation
file, release-metadata file, or downstream-scope file was touched by this gate.

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | Diff = `touches` + release metadata + coordination records, inside `northstar.scope.current: [dependency-guarantees]`. `non_negotiable` re-read here, not asserted: `COMMITTED_PACKS = []` (`pack-plan.mjs:102`), **no `packs/` tree** (glob `packs/**` → no match), marketplace still **N=1** (`kai` at `source: "."`, version-only patch), root stays the single source of truth, groundwork on `0.x`. `.github/workflows/validate.yml` is a declared-but-untouched `touch` — deliberate, the workflow already runs every gate this change adds. **P2-S1 parked as a PROPOSAL** in `kai/initiatives/pack-split/backlog.md`; nothing dropped. |
| 2 | verified | **Clear** | Run **32893764931** / job **`contract`** (`97951496629`), `ubuntu-latest`, **`conclusion: success`**, 14s, **11/11** substantive steps green at head `d4145eed…` — including the `pull_request`-only real release-guard gate. Verified against `api.github.com` read-only. Local `npm test` exit 0 + the full local arm list, operator-attested. **Design/QA-UI sub-gates not triggered** — developer-facing packaging, no user-facing surface; no waiver invented. |
| 3 | reviewed | **Clear** | `principal-swe-architect` / `independent-architecture` **ratified** and `principal-security` / `independent-security` **clear**, both bound to `change_ref 3383d7f2…` = the item's current `change_ref`. A1, A2, N1 closed and re-read on disk (`validate-plugin.mjs:374–378`, `:416–425`; `preflight-block.txt` one literal; `README.md:168`). N2 decided-accepted; P2-S1/P2-S2/N3/N4/R1–R3 owned with named homes. Head-vs-ref byte-identity is operator-attested and re-checked at deploy step 1. |
| 4 | shippable-safely | **Clear (proportional)** | `review-rollout-operability` applied — **Holds**. No runtime service, data, migration, external state or publication change; the block ships only into **generated** trees and none are committed, so the shipped 56 agents are byte-unaffected and consumers get one inert skill. Pre-merge reversibility total; post-merge one revert (tag/release deletion required only if already cut). Signals: `validate` on `main`, then the next PRs. Owner `principal-swe-infra`. |
| 5 | documented | **Clear** | `CHANGELOG [0.59.0]` + compare link (its `v0.58.0` counterpart tag exists locally, so the link is not dangling), `README` `## Status` `v0.59.0` 56/51 agreeing with `:168`, catalog + host inventory at 51, ship record written and indexed in `deliverables.md`, `log.md` carries the **release-ready** entry. **Ship stamp deliberately withheld.** |
| 6 | coordination-closed | **Clear** | This record (v14) current and truthful, criterion 6 ticked **with the run URL**; thread carries the deploy HANDOFF; `BOARD.md`/`ACTIVE.md` refreshed; `depends_on` satisfied at generator-gates v17; `waiting_on_questions: []`. **No dependent cleared** — `degraded-refusal` and `ci-partition-checks` need this item at `shipped`. |

**Environment limits, stated rather than absorbed.** No shell. PR metadata, the workflow run
and its job step list were read from `api.github.com`; local refs/reflog confirm branch and
`origin/` branch at `d4145eed…`, `main`/`origin/main` at `9d16e075…`, exactly one commit on
the branch. `api.github.com` then returned **403** (rate limit), so the PR *file list* and a
`GET /contents/packs?ref=d4145eed…` 404 could not be re-derived at the head — those claims are
read from the checked-out tree at that head and are re-verified on `main` at production
verification. Byte-identity to `3383d7f2…` and local `npm test` remain **operator-attested**,
and both are mechanically re-checked by deploy steps 1–2, which fail closed.

**Promotion completed 2026-08-25.** The ship record now lives at
`kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md`.
The move changed coordination records only; no implementation or release metadata changed.

**What this gate does not do.** It does not make the item `shipped`; it does not merge, tag,
release or publish; it does not clear any dependent; it does not accept residual risk R1–R3;
and it does not license release-note language that claims pack agents *refuse* (security
P2-S2 — the truthful claim is that they *carry a byte-pinned fail-closed instruction*).
Milestone `dependency-guarantees` remains **1 of 5 required items `shipped`**.

## Notes

- "Combined" = probe + version check in one injected block, so absence and skew share one refusal path.

- Mechanism is proven in `pack-preview.mjs`; this productionizes + CI-pins it. The version-skew CI
  arm is co-delivered with `pack-split-ci-partition-checks`.
- Security review: a missing/incompatible core must fail closed — this is the trust boundary.

### Steward promotion — 2026-08-25-1139 (`principal-product-manager`)

**`proposed -> ready`, priority 20 -> 10, `next_role: principal-swe-infra`, version 1 -> 2.**

- **Dependency verified, not assumed.** The sole `depends_on` entry
  `pack-split-generator-gates (requires: shipped)` is satisfied: that record is `state: shipped`
  at version 17, `change_ref 457254b97…`, PR #152 merged into
  `47aa0549f89b1733483dd6b662a4787d621c9430`, released `v0.58.0`, production verification passed.
- **Priority 10 — highest in the initiative.** `pack-split-degraded-refusal` depends on **this**
  item at `shipped` and shares its generated-agent-body injection surface, and
  `pack-split-ci-partition-checks` needs it for the version-skew arm. Sequencing it first
  releases more of `dependency-guarantees` than any other ready item, and the owner
  (`principal-swe-infra`) is the initiative's single-owner bottleneck, so queue order is real.
- **Fits `scope.current`.** Milestone `dependency-guarantees`, `required_for_milestone: true`;
  it is 1 of the 4 required items still outstanding. No milestone semantics changed.
- **Touch-set reconciled to the shipped foundation.** `scripts/lib/pack-plan.mjs` added: after
  `generator-gates`, the authoritative materialization lives there and its header explicitly
  defers guarantee-block injection to this item. Claim, not proof — reconcile on handback.
- **Both reviews still required at the same `change_ref`**: `principal-swe-architect` /
  `independent-architecture` (contract semantics) **and** `principal-security` /
  `independent-security` (fail-closed refusal is the trust boundary). Neither is waivable here.
- **Unchanged, deliberately:** outcome, milestone, `required_for_milestone`, `delivery_class`,
  review requirements, and the `0.x` versioning rule. No architecture decision was made or
  re-opened by this promotion; the ratified decomposition (WS#4) stands as written.

## Ship confirm — CONFIRM-START + CONFIRM-COMPLETE, 2026-08-25-1328 (`workflow-ship`)

- **Verdict: `SHIPPED`.** Self-granted the lease at version 14 (token
  `wsh-2026-08-25-1328-pfc-confirm`, `version_at_grant: 14`, re-read after the grant confirmed
  holder/token/version), walked every required lifecycle state, then cleared the lease.
  **`release-ready` -> `deploying` (v15) -> `production-verification` (v16) -> `shipped` (v17)**;
  `resume_state` stays `null`. No state was skipped and `shipped` was **not** reached directly
  from `release-ready`. `next_role: "@operator" -> null`.
- **kai merged, tagged, released and published nothing.** The operator executed every one of
  those actions and supplied the evidence; this run recorded it and re-derived the production
  facts read-only. No implementation file, release-metadata file, tag or release was created or
  modified here. **No rollback was invoked** at any point.
- **`change_ref` deliberately unchanged** at `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7` — the
  object both required reviews bind. Deployment moves an item's *state*, not its reviewed
  implementation ref; the merge commit is recorded below as deployment evidence instead.

**Deployment start (operator-supplied, CONFIRM-START).** PR #154 squash-merged
2026-08-25T20:27:09Z into merge commit `67670525808be349466155b836a7fdbbe4dfb8b7` on `main`;
environment `main` + GitHub Releases; version `0.59.0`. The `main` `validate` run started
2026-08-25T20:27:12Z — <https://github.com/RubenSaucedo/kai/actions/runs/32895404267>.

**Deployment completion (CONFIRM-COMPLETE).** That run reports `status: completed`,
**`conclusion: success`**, `event: push`, `run_attempt: 1`, `head_sha` exactly
`67670525808be349466155b836a7fdbbe4dfb8b7`, `display_title: "feat: add fail-closed pack
preflight (#154)"`, `20:27:12Z -> 20:27:30Z`. **Read from `api.github.com` by this run — a URL
without a successful conclusion would not have been accepted as completion.** Annotated tag
`v0.59.0` and release <https://github.com/RubenSaucedo/kai/releases/tag/v0.59.0> published
2026-08-25T20:28:01Z.

**Production verification — all six checks PASS, five re-derived read-only against the merge
commit itself (not the local worktree, and not accepted on report).**

| # | Check | Result | How verified |
|---|-------|--------|--------------|
| 1 | `main` CI green at the merge commit | **Pass (re-derived)** | Run `32895404267` via `api.github.com`: `conclusion: success` at `head_sha 67670525808be349466155b836a7fdbbe4dfb8b7`. Corroborated locally: `.git/refs/heads/main` = `.git/refs/remotes/origin/main` = that SHA. Job-level step detail (`97956815622`, 16s) is **operator-attested** — the jobs endpoint returned **403** (rate limit) — but a run cannot conclude `success` with a failing job, so the run-level conclusion is dispositive. |
| 2 | Version coherence at `0.59.0` on `main` | **Pass (re-derived)** | Read at the merge commit via `raw.githubusercontent.com`: `plugin.json` `0.59.0`; `package.json` `0.59.0`; `package-lock.json` **both** the root `version` and `packages[""].version` `0.59.0`; `marketplace.json` `metadata.version` **and** `plugins[0].version` `0.59.0`; `README.md` `## Status` `v0.59.0` — 56 agents and 51 skills; `CHANGELOG.md` `## [0.59.0] - 2026-08-25`. The `[0.59.0]: …/compare/v0.58.0...v0.59.0` link is read from the checked-out `main` (`CHANGELOG.md:2613`) and is **not dangling** — the API reports tag `v0.58.0` at `47aa0549f89b1733483dd6b662a4787d621c9430`. |
| 3 | Marketplace still exactly one monolithic entry | **Pass (re-derived)** | `.github/plugin/marketplace.json` at the merge commit: `plugins[]` length **1**, `name: kai`, `source: "."`. No pack entries. The monolith remains authoritative. |
| 4 | `COMMITTED_PACKS` empty **and** no `packs/` tree | **Pass (re-derived)** | `scripts/lib/pack-plan.mjs` at the merge commit still reads `export const COMMITTED_PACKS = [];`. Absence of `packs/` is proven **positively**, not inferred from a local glob: the root tree of the merge commit (`25d379d024b1bff7f406f1af8cee8ec971ce73ff`, read via the git-trees API) lists `package-lock.json`, `package.json`, `plugin.json` consecutively — `packs` sorts between `package.json` and `plugin.json` in git's byte ordering, and it is **not there**. The committed-unpublished non-negotiable holds in production. |
| 5 | The probe shipped and is pinned | **Pass (re-derived)** | `skills/kai-core-contract-v1/SKILL.md` present at the merge commit, returning exactly `KAI_CORE_READY` / `contract: 1`, `tools: [view]`, with the "version lives in the name" clause intact. The byte-pin itself is re-asserted by check 1's green `Validate plugin contract` step. |
| 6 | Tag and release point at the merge | **Pass (re-derived)** | The local ref `.git/refs/tags/v0.59.0` is the **annotated tag object** `338cfb04cb06bb689ca3522ac3f934a1e256b1fe`; peeling it needed the API (`git/tags` returned 403), so it was peeled via `GET /repos/RubenSaucedo/kai/tags`, which reports `v0.59.0 -> commit 67670525808be349466155b836a7fdbbe4dfb8b7` — **the merge commit**. Release `376694649` is published (not draft, not prerelease), `tag_name: v0.59.0`. |

**Release notes obey security P2-S2 — verified by reading the published body, not by report.**
The body says generated department-agent bodies "carry a canonical, byte-pinned fail-closed
compatibility instruction" and that the **preview arms** emit `KAI-CORE-MISSING`. It makes **no
claim that a pack agent refuses**, which is exactly the claim no evidence supports yet (owed by
`pack-split-host-gates`). It also states plainly that no `packs/` tree is committed and that the
marketplace still exposes only the monolithic `kai` plugin, so nothing implies a published pack.

**What shipping this does and does not change.** `dependency-guarantees` moves to **2 of 5
required items `shipped`** — still **OPEN**. Dependents were cleared strictly by the DAG, not
generously: `pack-split-degraded-refusal`'s **sole** dependency was this item at `shipped`, so it
is now **satisfied and dispatchable** (its overlap with `pack-split-crosspack-validator` on
`scripts/lib/pack-plan.mjs` / `scripts/validate-plugin.mjs` still makes the touch-conflict check
at dispatch real). `pack-split-ci-partition-checks` has **one of two** dependencies satisfied and
**remains blocked** on `pack-split-crosspack-validator` (still `ready`, not shipped).
`pack-split-generated-pack-trees` has **two of six** satisfied and stays `proposed` in a milestone
outside `scope.current`. **No residual risk was accepted here** — R1 (authenticity, the operator's
call *at publication*, which this release is not), R2 (instruction-level obedience, owed by
`pack-split-host-gates`) and R3 travel unchanged, and P2-S1 remains a parked backlog PROPOSAL.

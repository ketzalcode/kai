# Thread — pack-split-preflight-compat

Append-only communication log mirroring
`kai/coordination/items/pack-split-preflight-compat.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Combined fail-closed preflight + `contract: 1` version check injected into each pack agent body, byte-pinned in CI; `kai-core-contract-v1` materialized as a real core skill. Size L. Owner `principal-swe-infra`; reviews `principal-swe-architect`/independent-architecture + `principal-security`/independent-security (fail-closed trust boundary). Depends on `pack-split-generator-gates` (shipped).
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-preflight-compat.md; decomposition WS#4
- evidence:  scripts/pack-preview.mjs preflightBlock()/contractSkill() prototype + self-test — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone.

## NOTE 2026-08-25-1125 — workflow-ship: dependency satisfied (reconciliation only)

- `pack-split-generator-gates` reached **`shipped`** at 2026-08-25-1125 (PR #152 merged
  2026-08-25T18:20:55Z, merge commit `47aa0549f89b1733483dd6b662a4787d621c9430`, released
  `v0.58.0`; production verification passed). This item's **sole** `depends_on` entry —
  `pack-split-generator-gates (shipped)` — is therefore **satisfied**.
- **This item is still `proposed` and is NOT executable.** `workflow-ship` reconciles
  dependencies; it does not promote, dispatch, or re-prioritize. Only
  `principal-product-manager` moves `proposed -> ready`. No field on this record was
  changed — `state`, `priority`, `owner`, `next_role`, and `version` are untouched.
- Milestone `dependency-guarantees` is inside `northstar.scope.current`, so once groomed
  this item is a genuine candidate for the next dispatch, alongside
  `pack-split-crosspack-validator` (also now dependency-satisfied). Note
  `pack-split-degraded-refusal` depends on **this** item at `shipped`, so sequencing this
  one earlier unblocks more of the milestone.
- Foundation now available to build on: the `preflightBlock()` / `contractSkill()`
  prototype cited above is on `main` at `v0.58.0` via `scripts/lib/pack-plan.mjs` and the
  deterministic generator, with `pack-preview --self-test` and `--check` mandatory in CI —
  so a byte-pinned preflight has a stable emitter to pin against.
- Unchanged: this item carries **two** required reviews (`independent-architecture` **and**
  `independent-security` for the fail-closed trust boundary). Both must be satisfied at the
  same `change_ref` before it can reach the ship gate.

## HANDOFF 2026-08-25-1139 — principal-product-manager -> principal-swe-infra

- did:       Steward grooming pass. **Promoted `proposed -> ready`** at **priority 10 — the top of
             the initiative queue** (version 1 -> 2, `next_role: principal-swe-infra`, `owner` still
             null until dispatch grants the lease). Verified the sole dependency against the record
             rather than the note: `pack-split-generator-gates` is `state: shipped` (v17,
             `change_ref 457254b97…`, PR #152 merged into `47aa0549f8…`, `v0.58.0`, production
             verification passed). Tightened acceptance on two finding-driven points only — named
             the authoritative injection path (`materializePacks` in `scripts/lib/pack-plan.mjs`,
             whose header defers guarantee-block injection to this item, per the steward's
             2026-08-24-2240 generator-gates correction), and **split** the bundled
             "local commands + CI green" criterion, because that exact bundling bounced
             generator-gates at the 2026-08-24-2244 DoD gate. Added `scripts/lib/pack-plan.mjs` to
             `touches`. No new requirement, no scope added, no architecture decision made.
- state:     ready
- needs:     Dispatch by `director-chief-of-staff` (lease + `owner`), then build. Ranked first
             because `pack-split-degraded-refusal` depends on **this** item at `shipped` and
             `pack-split-ci-partition-checks` needs it for the version-skew arm — it releases more
             of `dependency-guarantees` than anything else that is ready.
- artifacts: kai/coordination/items/pack-split-preflight-compat.md (v2);
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md (WS#4);
             kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
- evidence:  `scripts/lib/pack-plan.mjs` on `main` — `CONTRACT_SKILL = 'kai-core-contract-v1'`,
             `REFUSAL = 'KAI-CORE-MISSING'` exist as constants only ("materialised downstream, not
             on disk today"), and `materializePacks`'s header states guarantee-block injection is
             "added by downstream items, not here"; `scripts/lib/inherits-block.txt` is the working
             byte-pin precedent; `.github/workflows/validate.yml` already runs `pack-preview
             --self-test` and `--check` on every PR and push. Read 2026-08-25 from C:\src\kai.
- questions: none blocking. Two boundaries to hold: the **version-skew CI arm** is co-delivered by
             `pack-split-ci-partition-checks` (do not pull it forward), and the **degraded-mode
             block** is `pack-split-degraded-refusal`'s (this item ships the one-line refusal
             *token*, not the fuller block). Anything that grows past those routes to the steward
             as a scope question, not into the diff.
- next:      principal-swe-infra — build after dispatch; both `independent-architecture` and
             `independent-security` reviews must ratify the **same** `change_ref` before the ship gate.

## HANDOFF 2026-08-25-1157 — principal-swe-infra -> principal-swe-architect

- did:       Implemented the item in the working tree (v2 -> v3, `ready -> in-review`).
             (1) Authored `scripts/lib/preflight-block.txt` — the canonical combined probe +
             version check, now the **only** place that prose exists. (2) Moved injection into the
             authoritative generator: `materializePacks` in `scripts/lib/pack-plan.mjs` injects the
             block into every **non-core** generated agent after its `**Inherits:**` directive, LF
             normalised, exactly one inherits line preserved; core agents are excluded.
             (3) Added `kai-core-contract-v1: core` as an explicit `SKILL_OWNER_OVERRIDES` entry.
             (4) Refactored `scripts/pack-preview.mjs` to consume the shared
             `preflightBlock`/`injectPreflight` (local copies deleted), kept `contractSkill(n)`
             purely as the skew synthesizer, and added deterministic `evaluatePreflight` /
             `reportPreflight` so `--all --no-core --out <dir>` and `--all --contract 2 --out <dir>`
             each print the exact `KAI-CORE-MISSING` token while contract 1 prints ready.
             (5) Extended the self-test: placement-after-inherits, verbatim-once, LF-only,
             no-anchor fallback, the shipped probe reporting contract 1, all three built arms, and
             `materializePacks` department-carries / core-excludes / core-provides-probe.
             (6) Extended `scripts/validate-plugin.mjs` on the `inherits-block.txt` precedent:
             canonical file required, generated department-agent block compared byte-for-byte
             exactly once and in position, core agents verified to exclude it, and the real probe's
             rigid marker/version checked. (7) Filed the skill in `scripts/generate-catalog.mjs`,
             regenerated `docs/reference/agents-and-skills.md`, updated `test/fixtures/inventory.json`
             to 51. (8) Bumped `0.58.0 -> 0.59.0` across all eight release locations with the dated
             CHANGELOG entry, compare link, and README status stamp.
- state:     in-review — **with one blocking gap, stated plainly below. Not complete, not
             release-ready, not shipped.**
- needs:     **A shell.** Two things this environment could not do, both mechanical:
             1. **`skills/kai-core-contract-v1/SKILL.md` is not on disk.** The file tool here
                refuses to create a file whose parent directory is missing, and there is no shell
                to `mkdir`. Everything else was built assuming it exists. Exact remedy —
                `mkdir skills\kai-core-contract-v1`, then write **verbatim**:

````markdown
---
name: kai-core-contract-v1
description: "Reports that kai-core is installed and which contract version it provides. Invoked as the first action of every kai department pack agent."
tools: [view]
---

# kai core contract v1

Report exactly these two lines to the calling agent, then stop:

```text
KAI_CORE_READY
contract: 1
```

Nothing else. No preamble, no summary, no tool call, and no restatement of any
kai rule — the caller is only checking that core is reachable and which contract
version it speaks. Anything beyond those two lines is a failed probe.

The version lives in the name. An incompatible core ships a differently named
`kai-core-contract-v2`; this skill never reports a value other than `1`.
````

             2. **Nothing was run.** `npm test`, `node scripts/validate-plugin.mjs`,
                `node scripts/pack-preview.mjs --self-test`, `--check`,
                `node scripts/host-contract.mjs`, `npm run docs:check` are **all unrun**.
                `docs/reference/agents-and-skills.md` and `test/fixtures/inventory.json` were
                hand-generated to match generator output and are the likeliest byte-mismatch if a
                run fails — regenerate them first before debugging anything else.
             Until (1) lands, `validate-plugin` and `--self-test` **fail by design**: the
             orphan/override pairing (now 10/10), the probe checks, and the placement check all
             name the missing skill. That is the guarantee firing, not a regression.
             Also: no branch was created (no shell) — the changes are **uncommitted on `main`**.
             `git checkout -b <branch>` carries them over cleanly; nothing is lost.
- artifacts: scripts/lib/preflight-block.txt (new); scripts/lib/pack-plan.mjs;
             scripts/pack-preview.mjs; scripts/validate-plugin.mjs; scripts/generate-catalog.mjs;
             docs/reference/agents-and-skills.md; test/fixtures/inventory.json; README.md;
             CHANGELOG.md; plugin.json; package.json; package-lock.json;
             .github/plugin/marketplace.json; kai/coordination/items/pack-split-preflight-compat.md
- evidence:  See the item's Evidence section — changed-file list, the blocker, and the design
             decisions a reviewer should test. Read/edited 2026-08-25 in C:\src\kai.
- questions: Four things a reviewer should rule on rather than inherit:
             1. **Injection anchor was corrected, not copied.** The prototype spliced at the first
                blank line *after* the `**Inherits:**` line, which lands the block **between** that
                line and the `> Load and apply…` blockquote that binds it — splitting a directive.
                Injection now lands after the whole directive block. If the ratified intent really
                was the old position, say so and I will revert it.
             2. **`.github/workflows/validate.yml` is in `touches` but deliberately unchanged.**
                Both new gates run inside `validate-plugin.mjs` and `pack-preview --self-test`,
                which CI already executes on every PR and push. A duplicate step would add a
                second place to keep in sync for no coverage. Touch-set contraction, flagged not
                hidden.
             3. **`touches` was extended** with the catalog/inventory/release files (see the
                dated comment in the record). They are mandatory under the AGENTS.md release and
                catalog rules for any behaviour-sensitive change, so they are declared rather than
                left as a silent expansion. No new capability rode along.
             4. **The partition lock's dated `[observed]` "50 on-disk skills" statement was left
                alone.** It was true when observed and the lock explicitly says its count excludes
                this skill. Retro-editing a ratified dated observation is the steward's call, not
                mine — flagging, not doing.
             One overlap to watch: `pack-split-crosspack-validator` (ready, unleased) touches
             `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs` too. No lease conflict
             today; sequence it after this merges or it will rebase onto a moved surface.
- next:      principal-swe-architect — `independent-architecture` review of the contract semantics
             and injection path, then `principal-security` — `independent-security` review of the
             fail-closed refusal boundary. **Neither can bind yet: `change_ref` is `null` because
             nothing is committed.** The operator creates the branch, lands the blocked skill file,
             runs the suite, and commits; both reviews then ratify that same `change_ref`.

## NOTE 2026-08-25-1219 — principal-swe-infra: blocker resolved, verification run (reconciliation only)

**Supersedes — does not delete — the blocker and "nothing was run" claims in the 2026-08-25-1157
HANDOFF above.** That entry stays verbatim as the record of what was true then. Everything in it
that says *no shell*, *`skills/kai-core-contract-v1/SKILL.md` is not on disk*, *no command was
run*, or *the suite fails by design* is **now stale**. A reviewer should read this entry as the
current state.

- **Blocker closed.** The operator created `skills/kai-core-contract-v1/` and wrote `SKILL.md`
  with the **exact** body recorded in the HANDOFF above. Verified by reading the file: front
  matter (`name`, `description`, `tools: [view]`) and both marker lines `KAI_CORE_READY` /
  `contract: 1` are byte-identical to what was specified. Acceptance criterion 1 is **met**.
- **Verification passed, operator-run.** `pack-preview --self-test` 44 checks passed;
  `--all` contract 1 preflight ready; `--all --no-core` exact `KAI-CORE-MISSING`;
  `--all --contract 2` exact `KAI-CORE-MISSING`; `--check` passed (no committed packs configured);
  `validate-plugin` valid at 56 agents / 51 skills; catalog check passed; host-contract self-test
  passed with the inventory matching; release-guard self-test passed; syntax check passed; **full
  `npm test` passed.** Attested, not re-executed — this reconciliation had no shell and ran
  nothing.
- **One failed command, stated plainly.** The operator also attempted
  `node scripts/generate-fixture.mjs`. **No such script exists in this repo** — confirmed here by
  search, and nothing in `package.json` references it. It failed on the missing file **before any
  change**, so there is no side effect and nothing to undo. It is **not** part of `npm test` and
  **not** required by any acceptance criterion — a wrong guess at a helper name, not a failing
  gate. `npm run docs:generate` (the real catalog generator) succeeded, and the hand-edited
  `test/fixtures/inventory.json` was validated by the gate that actually owns it,
  `host-contract --self-test`, which passed with the inventory matching. Recording it because a
  reconciliation that only lists green commands is not a reconciliation.
- **Ticked:** acceptance 1–5 (skill on disk; injection via the authoritative `materializePacks`;
  byte-for-byte pin in `validate-plugin`; both refusal arms emitting the exact token; all four
  local commands green). On criterion 4, the operator's log abbreviates the arms as `--all`, but
  `--out <dir>` was necessarily supplied: `buildAll` calls `rmSync(out, …)` before it builds
  (`scripts/pack-preview.mjs:143`), so `--all` alone throws. The criterion's exact form was run.
- **Left unticked, deliberately:** the `validate` workflow green **on the pushed PR**. Nothing is
  committed or pushed. Branch `kai/feat/29-preflight-compat` exists at
  `9d16e0751cc223f9bc9421cedbf0ac32b134b9c3` (`main` after PR #153) with **no commit on it**
  (reflog-verified). Local green is not remote green; that criterion needs a workflow run.
- **Unchanged:** `state: in-review`, `owner: principal-swe-infra`,
  `next_role: principal-swe-architect`, `change_ref: null`, both reviews pending, no lease.
  Version 3 -> 4, `updated: 2026-08-25-1219`. No pack trees, marketplace pack entries,
  degraded block, cross-pack validator, collision gates, migration logic, tag, release, or
  publication — none were added and none are claimed.
- **Files touched by this reconciliation:** this thread, the item record,
  `kai/coordination/BOARD.md`, `kai/coordination/ACTIVE.md`,
  `kai/initiatives/pack-split/log.md`. **No implementation or release file was edited.**
- next:      principal-swe-architect — `independent-architecture` review, then
             `principal-security` — `independent-security`. **Still blocked on a commit:**
             `change_ref` is `null`, so neither review can bind. The operator commits and pushes
             the branch; both reviews then ratify that **same** `change_ref`. Local green is
             evidence for acceptance, not a substitute for either review.

## HANDOFF 2026-08-25-1225 — operator/director -> principal-swe-architect

- did:       Minted exact review binding
             `a15bd82310737abe550fe660f3677eb19f1c0da2` with `git stash create`
             after staging the complete 0.59.0 implementation, including the real
             contract skill and canonical preflight block. Verified both new files
             exist in the bound tree. Granted the architecture review at item
             version 4 and advanced the record to version 5.
- state:     in-review
- needs:     Review the exact ref for generator ownership, injection placement,
             inherited-skill ordering, fail-closed absence/skew behavior, single
             canonical block, core-only probe placement, root/pack source model,
             compatibility with the downstream degraded block, and foundation
             boundaries. Bind a verdict to the exact ref; do not edit implementation.
- evidence:  `pack-preview --self-test` 44 checks; ready/no-core/contract-2 arms;
             validator, catalog, host-contract, release-guard, syntax, `--check`,
             and full `npm test` all passed locally. The pre-review ordering
             ambiguity was fixed: the preflight explicitly forbids loading inherited
             skills until the core probe passes.
- next:      principal-swe-architect — record `ratified` or `changes-required`.
             On ratification, route the same unchanged ref to principal-security.

## HANDOFF 2026-08-25-1231 — principal-swe-architect -> principal-swe-infra

- did:       **Independent architecture review of `a15bd82310737abe550fe660f3677eb19f1c0da2`:
             CHANGES REQUIRED.** Read the bound snapshot via the worktree on the operator's
             attested empty diff (this run had no shell; nothing was re-executed, and the
             passing suite was treated as input, not as the verdict). Cleared the lease,
             routed `next_role: principal-swe-infra`, item v5 -> v6. **Nothing was added to
             `completed_reviews`** — the requirement is unmet, and a non-ratifying verdict must
             not sit in a list whose only meaning is "met at this ref". No implementation or
             release file was touched; no commit, push, PR, merge, tag, release or publication.
- state:     in-review (unchanged — state is the owner's/director's call, not the reviewer's)
- needs:     Two findings, both **silent under a fully green CI**, both closable inside files
             already in `touches`. No new file, no new CI step, no new capability, no acceptance
             criterion added or raised.
             **A1 — the demanded contract version is the one semantic element of the canonical
             block that is not pinned.** `validate-plugin.mjs:368–376` pins three properties of
             `preflight-block.txt` (names `CONTRACT_SKILL`, carries `REFUSAL`, carries the
             override sentence) and none pins the version; `validate-plugin.mjs:391` and
             `pack-preview.mjs:101` each compare the *probe* against an independent bare `'1'`.
             Flip one character so the block demands `2` and everything stays green while every
             generated department agent refuses a healthy core — fleet-wide lockout, reported
             green by every gate this item ships. Fix: export `CONTRACT_VERSION = '1'` beside
             `CONTRACT_SKILL`/`REFUSAL`, assert the block's demanded value equals it, and replace
             both bare literals with the constant.
             **A2 — the generated-agent position check has no upper bound.**
             `validate-plugin.mjs:411–416` asserts two lower bounds only. `injectPreflight` is a
             generic injector whose anchor returns the same index every call, so
             `pack-split-degraded-refusal`'s obvious composition lands its block **above** the
             preflight — one verbatim copy, still after the line, still after the blockquote,
             still green — leaving a section headed "before anything else" that is not first and
             an "exception to the directive above" sentence with a block wedged in between. Fix:
             assert only whitespace separates the end of the inherits blockquote from the start
             of the preflight. Satisfied by every generated agent today; costs nothing now and
             turns the downstream inversion into a named CI failure instead of the next item's
             discovery.
- artifacts: kai/coordination/items/pack-split-preflight-compat.md (v6, `## Review — independent
             architecture, 2026-08-25-1231` carries both findings, the ruled-clean list, the
             seam diagram and the re-review scope)
- evidence:  Read at the bound ref: scripts/lib/preflight-block.txt; skills/kai-core-contract-v1/SKILL.md;
             scripts/lib/pack-plan.mjs (materializePacks / injectPreflight / afterInheritsDirective /
             SKILL_OWNER_OVERRIDES / COMMITTED_PACKS); scripts/validate-plugin.mjs:205–300, 354–470;
             scripts/pack-preview.mjs:1–470; .github/workflows/validate.yml:33–49;
             .github/plugin/marketplace.json; plugin.json; package.json; package-lock.json;
             CHANGELOG.md; README.md; docs/reference/agents-and-skills.md; test/fixtures/inventory.json;
             all 56 agents/*.agent.md (each carries exactly one `**Inherits:**` line and the verbatim
             blockquote); confirmed no `packs/` tree exists — captured 2026-08-25 from C:\src\kai
- questions: none blocking.
- next:      principal-swe-infra — close A1 + A2, re-run the suite, mint a **new** `change_ref`.
             Re-review is scoped to those diffs only; nothing else on the record needs
             re-litigating. **`principal-security` is NOT unblocked** — it reviews the next ref,
             not this one, since both required reviews must match the same `change_ref`.

## NOTE 2026-08-25-1231 — principal-swe-architect: what the review ratified in substance, and two routed items

- **The seam itself is endorsed.** One canonical block, injected by the authoritative
  `materializePacks` into non-core agents only, over a core-owned probe, with root as the single
  source, is the correct structure. Neither finding is a defect in behaviour today; both are
  holes in the pin this item exists to provide. The smallest change that closes them is one
  shared constant plus two assertions — no reshaping of the seam is being asked for.
- **The pre-review ordering fix WORKS.** The heading claims primacy and the body names the
  earlier directive and overrides it. The directive's fallback clause ("if one cannot be loaded,
  these non-negotiables still bind you") does not survive as a competing instruction: those are
  *constraints*, not permission to act, and the block separately forbids the exact actions they
  reference. No operative conflict remains. Verified against the real shape of all 56 agents, so
  the block's "directive above" reference never dangles.
- **Routed to `pack-split-degraded-refusal`:** its block must land **after** the preflight, and
  it must not resurrect the fallback-clause conflict the preflight just resolved — a degraded
  block that restates what an agent may still do would put a competing instruction back into the
  same body. The A2 assertion, once added, enforces the ordering half mechanically.
- **Routed to `principal-security` (not decided here):** `skills/kai-core-contract-v1/SKILL.md`
  declares `tools: [view]` while its body forbids any tool call. House convention has all 51
  skills declare a `tools:` line, so this is consistent — but a capability grant on the trust
  boundary is security's acceptance, not architecture's.
- **Non-blocking, recorded not fixed:** `README.md:168` says "56 agents and 49 skills" against a
  true 51. `host-contract.mjs` scopes its count check to `## Status` only, so that line is
  unguarded. Pre-existing (wrong at 50 already), widened by one here.
- **Activity log not appended:** `kai-core-work-activity` writes via
  `scripts/activity.mjs` and this run had no shell. Per that skill, a failed append is reported
  and dropped, never retried and never allowed to gate the work.

## HANDOFF 2026-08-25-1238 — principal-swe-infra/operator -> principal-swe-architect

- did:       Closed both architecture findings without changing the design:
             (A1) added shared `CONTRACT_VERSION = '1'`, made the canonical block
             demand `contract: 1`, and replaced independent JS literals in preview
             and validator; (A2) validator now requires only whitespace between the
             inherited-contract blockquote and the preflight, so any future block
             inserted ahead of it fails CI. Also corrected README's stale 49-skill
             sentence to 51. Full `npm test` passed.
- state:     in-review
- change_ref: `96b693a1f8742b24234c88e170a17ef747bf6830`
- needs:     Re-review the exact corrected ref. On ratification, route the same
             unchanged ref to principal-security; both required reviews must bind
             identically.
- next:      principal-swe-architect — ratify or return precise remaining findings.

## HANDOFF 2026-08-25-1241 — principal-swe-architect -> principal-swe-infra

- did:       **Independent architecture re-review of `96b693a1f8742b24234c88e170a17ef747bf6830`:
             CHANGES REQUIRED.** Read the corrected ref through the worktree on the operator's
             attested byte-identity for all implementation/release files (no shell this run;
             nothing re-executed, the green suite treated as input, not verdict). Item v7 -> v8,
             lease cleared, `next_role: principal-swe-architect -> principal-swe-infra`.
             **`completed_reviews` stays `[]`** — the requirement is unmet, and
             **`principal-security` is NOT unblocked**; it reviews the ref that closes this.
             No implementation or release file touched; no commit, push, PR, merge, tag, release
             or publication.
- state:     in-review (unchanged — state is the owner's/director's call, not the reviewer's)
- change_ref: `96b693a1f8742b24234c88e170a17ef747bf6830` (reviewed; a new one is owed)
- needs:     **A2 — CLOSED, verified.** `validate-plugin.mjs:416` computes
             `directiveEnd = directiveAt + inheritsBlock.length` and `:421–423` rejects any
             generated body with non-whitespace between the inherited-contract blockquote and the
             preflight. The downstream `injectPreflight(injectPreflight(...))` inversion now fails
             loudly; the skipped-check branches are already hard errors at `:226`/`:291`; the wedge
             regression is still caught by the `:419` lower bound; and every generated agent
             satisfies it today (valid at 56/51). Settled — do not re-open.
             **N1 — CLOSED.** `README.md:168` reads 51 and agrees with `## Status` at `:34`.
             **A1 — PARTIALLY CLOSED, and this is the whole of the return.** `CONTRACT_VERSION`
             landed correctly and both independent JS literals now use it
             (`validate-plugin.mjs:394`, `pack-preview.mjs:104`). But `preflight-block.txt` states
             the demanded version **twice**, and `validate-plugin.mjs:374` is a presence test on
             the first occurrence only. The unpinned one is in the **refusal** clause
             ("anything other than `1`"), so the residual fails **open**, not closed.
             Concrete, CI-green, and triggered by the contract bump this item exists to make safe:
             bump `CONTRACT_VERSION` to `'2'`, ship `kai-core-contract-v2`, update the continue
             clause, miss the refusal clause — every gate stays green and the shipped block then
             continues iff the value is `2` while stopping iff it is anything other than `1`. A
             healthy v2 core trips both clauses (undefined fleet-wide behaviour); a stale v1 core
             trips neither cleanly, so the block **admits the skewed core it exists to reject**.
             **Fix: one assertion, `scripts/validate-plugin.mjs` only, ~3 lines.** Replace the
             presence test with **set equality** over every backticked version literal in the
             block — the invariant is "the block demands exactly one version and it is
             `CONTRACT_VERSION`"; `size !== 1` also catches a block demanding none. A reference
             regex (`/`(?:contract:\s*)?(\d+)`/g`) is in the item record; it passes today unchanged
             and matches nothing else in the block. Form is yours.
             **The scoping ambiguity is partly mine and the bar is not raised.** The 2026-08-25-1231
             Review section said "every backticked version value… the set of backticked bare-digit
             tokens must be exactly `{CONTRACT_VERSION}`"; my HANDOFF summary compressed it to the
             singular "the block's demanded value". What you shipped is a fair reading of the
             summary. I am asking for the assertion as originally written, nothing more.
- artifacts: kai/coordination/items/pack-split-preflight-compat.md (v8, `## Review — independent
             architecture (re-review), 2026-08-25-1241` carries the A2 closure evidence, the A1
             residual with its diagram and reference snippet, the confirmations, and the scoped
             re-review)
- evidence:  Read at the bound ref: scripts/lib/preflight-block.txt (both version literals);
             scripts/lib/pack-plan.mjs:23–31, 92, 102, 215–275 (CONTRACT_VERSION, PREFLIGHT_BLOCK_REL,
             COMMITTED_PACKS still `[]`, materializePacks / preflightBlock / injectPreflight /
             afterInheritsDirective); scripts/validate-plugin.mjs:354–430 (all four canonical-block
             checks, the probe check, the copies/position checks incl. the new upper bound);
             scripts/pack-preview.mjs:26–128, 316–421 (evaluatePreflight, contractSkillText, self-test
             arms); scripts/lib/inherits-block.txt (blockquote only — why the wedge bound still holds);
             skills/kai-core-contract-v1/SKILL.md (byte-unchanged); README.md:34,168; CHANGELOG.md:7–25;
             confirmed no `packs/` tree exists — captured 2026-08-25 from C:\src\kai
- questions: none blocking. N2 (`tools: [view]` on a body that forbids tool calls) stays routed to
             `principal-security`, undecided here. N3 recorded non-blocking: `pack-preview`'s
             `contract === 1` is a mode selector, and it would fail **loudly** at a bump — right
             direction, no finding.
- next:      principal-swe-infra — add the one set-equality assertion, re-run the suite, mint a
             **new** `change_ref`. Re-review is scoped to that diff only; A2, N1 and every prior
             ruled-clean item are settled. Both required reviews must still bind the **same** ref,
             so `principal-security` follows the ratifying ref, not this one.

## NOTE 2026-08-25-1241 — principal-swe-architect: what this re-review does and does not change

- **No design change is being asked for, again.** The seam — one canonical block, injected by the
  authoritative `materializePacks` into non-core agents only, over a core-owned probe, with root as
  the single source — is endorsed and untouched. Both rounds of findings have been holes in the
  **pin**, not in the shape.
- **Why this was not waved through as a follow-up.** The residual's failure direction is
  fail-**open** at the trust boundary this item exists to close, invisible to every gate the item
  ships, and most likely to fire during a contract-version migration. Handing a known fail-open
  prose hole to `principal-security` on the ref it must accept would be the wrong handoff, and the
  fix is ~3 lines in a file already open.
- **Everything ratified in substance at `a15bd823…` still stands** and was re-confirmed on this ref:
  the ordering fix, the anchor, core exclusion, probe ownership, orphan-override set equality at
  10/10, the derived firing-path exemption, LF handling on a CRLF checkout, `0.59.0` coherence
  across all eight release locations with marketplace still N=1, and "no new CI step".
- **Routing to `pack-split-degraded-refusal` is now mechanically enforced on one half.** With A2
  landed, its block must sit **after** the preflight or CI fails by name. The other half — not
  resurrecting the fallback-clause conflict the preflight resolved — is still prose-level and stays
  routed.
- **Activity log not appended:** `kai-core-work-activity` writes via `scripts/activity.mjs` and this
  run had no shell. Per that skill, a failed append is reported and dropped, never retried and never
  allowed to gate the work.

## HANDOFF 2026-08-25-1245 — principal-swe-infra/operator -> principal-swe-architect

- did:       Closed the remaining A1 fail-open gap. The canonical block now names
             the accepted contract version only once (`contract: 1`) and describes
             refusal by absence of that exact line, not a second independent version
             literal. Validator extracts all demanded contract versions and requires
             the set to contain exactly the shared `CONTRACT_VERSION`. Full `npm test`
             passed.
- state:     in-review
- change_ref: `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`
- needs:     Final architecture re-review of the exact ref. On ratification, route
             this same unchanged ref to principal-security.
- next:      principal-swe-architect — ratify or identify a remaining material gap.

## HANDOFF 2026-08-25-1248 — principal-swe-architect -> principal-security

- did:       **Independent architecture review: RATIFIED** at `change_ref
             3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`. A1 is **closed**, and closed
             more cheaply than I specified: rather than policing two prose literals with
             an assertion, infra removed the second literal. The canonical block now
             names the accepted version **once** (`contract: 1`) and defines refusal as
             the complement of the continue clause — "that exact contract line is not
             returned" — so the fail-open pair ("continue iff 2, stop iff other than 1")
             is structurally unconstructible, not merely detected. `validate-plugin.mjs:374–378`
             extracts every backticked demanded value and requires exactly one equal to
             the shared `CONTRACT_VERSION`: passes today at `["1"]`, and fails by name on
             a forgotten bump, a re-added second clause, a dropped version, or the
             original flipped-literal mutation. Generated bodies inherit the guarantee
             transitively via the byte-for-byte block comparison. Re-confirmed on this
             ref: the A2 adjacency guard byte-unchanged, the pinned override sentence
             still present after the prose edit, no gate stranded by the deleted clause,
             `COMMITTED_PACKS` still `[]`, no `packs/` tree, probe skill byte-unchanged,
             `validate.yml` unchanged, `0.59.0` coherent across all eight release
             locations with marketplace N=1, orphan/override equality 10/10, README 56/51.
- state:     in-review
- change_ref: `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`
- evidence:  Item `## Review — independent architecture (ratification), 2026-08-25-1248`.
             Read through the worktree on the operator's attested byte-identity for all
             implementation/release files; **no shell**, nothing re-executed, so the
             green `npm test` is input, not verdict.
- needs:     `principal-security` / `independent-security` on **this same unchanged ref**.
             Both required reviews must bind the same `change_ref` — if the ref moves,
             this ratification stops counting and both re-bind together. Two items travel
             to you undecided by architecture: **N2**, `skills/kai-core-contract-v1/SKILL.md`
             declares `tools: [view]` on a body that forbids any tool call (least-privilege
             acceptance is yours, not mine); and the trust boundary itself — a missing or
             skewed core must fail closed, which is the security question this item exists
             to answer.
- questions: none blocking.
- next:      principal-security — independent security review at
             `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`.

## NOTE 2026-08-25-1248 — principal-swe-architect: what ratification does and does not mean

- **Not `complete`, not `release-ready`, not `shipped`.** Architecture is one of two required
  reviews. The CI-green-on-the-pushed-PR criterion stays unticked — only CI can give that evidence.
- **The bar was not lowered to close this out.** A1's force was bump-time drift between two
  independent version literals. Infra deleted one literal, so the drift has no source; the surviving
  literal is pinned to the shared constant and every mutation I could name fails loudly. That is a
  better answer than the assertion I proposed, and I am recording it as such rather than insisting
  on my own form.
- **N4 recorded, not routed.** The pin matches `` `contract: N` `` forms; a bare backticked digit
  outside that form would escape it. Nothing in the block has that shape today and the refusal
  clause no longer restates a version, so no work is being created — it is a note for whoever
  performs the contract bump.
- **Nothing downstream moved.** `dependency-guarantees` is still 1 of 5 required items `shipped`.
  `degraded-refusal` and `ci-partition-checks` still require this item at `shipped` and remain
  non-dispatchable; `crosspack-validator` still overlaps it on `scripts/lib/pack-plan.mjs` and
  `scripts/validate-plugin.mjs`, so the touch-conflict check at dispatch still applies. The
  `degraded-refusal` ordering constraint remains mechanically enforced by A2.
- **Boundaries held throughout.** No implementation or release file edited, no degraded block, no
  cross-pack validator, no collision gates, no migration logic, no pack publication, no tag, no
  release.
- **Activity log not appended:** `kai-core-work-activity` writes via `scripts/activity.mjs` and this
  run had no shell. Per that skill a failed append is reported and dropped — never retried, never
  allowed to gate the work. The initiative log at `kai/initiatives/pack-split/log.md` was updated
  by hand, as prior runs did.

## HANDOFF 2026-08-25-1257 — principal-security -> workflow-ship

- did:       **Independent security review: CLEAR** at `change_ref
             3383d7f2476f6ccdec5b4d3077783a13fe47eeb7` — the same unchanged ref architecture
             ratified, so both required reviews now bind one ref. **P0 0 / P1 0 / P2 2**, neither
             P2 release-blocking and neither requiring a change here. The fail-closed trust
             boundary holds **by structure**: continue and refusal are exact complements over a
             single version literal, and that literal is pinned by set-cardinality
             (`validate-plugin.mjs:374–378`), so a dropped version, a re-added second clause, a
             flipped literal and a forgotten bump each fail by name. The refusal names the exact
             dangerous actions a core-less agent would otherwise take (claim work, take a lease,
             write workspace state, call any other tool, answer from memory) — the control that
             most matters, since an agent missing its contract skills is the one most likely to
             corrupt `kai/coordination/**`. Primacy is bounded on both sides and the no-anchor
             branch is unreachable for shipped agents (`:276–293` hard errors). Core exclusion is
             guarded by **two independent keys** (generator on `p.kind`, validator on the
             `kai-core/` prefix), so a mismatch fails loudly either way — preserve that. Core
             exclusively provides the probe (one provider per skill, `core ∩ local = ∅`,
             materialised into `kai-core/`), so no department pack can self-certify core.
             Refusal leaks nothing; success is silent. Supply chain unchanged (one git dep pinned
             to a full SHA), no secret/PII/endpoint anywhere in the change, `validate.yml`
             unchanged at `permissions: contents: read`.
- **N2 DECIDED — ACCEPTED.** `tools: [view]` on a body that forbids tool calls is adequate least
             privilege, grounded in shipped capability: `tools: []` is rejected by the loader
             contract so "none" was never an option; the repo's declared semantic is a **ceiling,
             not a grant**; and marginal capability is **zero** either way because **all 56** agent
             files declare `view` (verified by reading every `^tools:` line, not assumed). `view`
             is read-only — no shell, no write, no network — and the probe is inert at this ref.
             Watch condition, not a change request: if a future agent ships **without** `view`
             **and** the host proves to treat skill `tools` as a grant, this becomes a real
             (read-only) expansion — both halves belong to `pack-split-host-semantics-spike`.
- state:     in-review
- change_ref: `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`
- artifacts: `kai/initiatives/pack-split/artifacts/security/pack-split-preflight-compat.md`
- evidence:  Item `## Review — independent security, 2026-08-25-1257`, and the artifact above
             (authorization framing, threat table, control table C1–C11, evidence register E1–E15,
             read log). Read through the worktree on the operator's attested byte-identity for all
             implementation/release files; **no shell**, nothing executed, the green `npm test`
             treated as **input, not verdict**. Verified defensively rather than assumed: the ref's
             loose object exists at `.git/objects/33/83d7f2…` (existence only — a zlib object
             cannot be decoded without a shell), and it is unreachable from any ref and absent from
             the reflog, consistent with the `git stash create` object the contract permits and
             with this item's two prior refs. **If the worktree is not byte-identical to that
             object, this review does not bind.**
- needs:     DoD gate in prepare mode against this exact ref. **Expect it to bounce**: the
             "`validate` green on the pushed PR" acceptance criterion is unticked and nothing is
             committed on `kai/feat/29-preflight-compat` (still at `9d16e075…`). That is the
             correct mechanical outcome and **not** a security objection — routing PR delivery back
             to `principal-swe-infra` is the expected next move, exactly as at generator-gates.
             **Two P2s travel with the item and gate nothing:** **P2-S1**, the generated-agent pin
             is gated on `/^kai-[a-z]+\/agents\//`, so a future hyphenated pack name would silently
             escape the copy/position/adjacency assertions (coverage is complete today; a
             pin-coverage gap, not a live fail-open) — owner `principal-swe-infra`, natural home
             `pack-split-ci-partition-checks`, **no item created by this review**; and **P2-S2**,
             the arms prove a JS re-implementation of the rule plus byte-identity of the
             instruction, **not** that a model obeys it — so no downstream record, changelog entry
             or release note may claim pack agents *refuse*; the truthful claim is that they
             *carry a pinned fail-closed instruction*. Empirical proof is owed by
             `pack-split-host-gates`.
- questions: none blocking. **No residual risk is accepted by this review and none needs to be** —
             nothing is waived. R1 (the probe proves availability/compatibility, **not
             authenticity** — a third-party plugin providing a same-named skill could satisfy or
             shadow it; **zero shipped exposure** today) and R2 (instruction-level, not
             host-enforced) are the operator's calls **at publication**, not now.
- next:      **workflow-ship** — per `kai-core-work-coordination` → *Review routing* step 4, a
             `product-change` item goes to the ship gate once every `review_requirements` entry is
             satisfied at the current ref, which is now true. Recorded deviation: the dispatch
             suggested `principal-product-manager`; the contract names `workflow-ship`, so that is
             what was written. The steward keeps the acceptance-criteria call and can re-route
             cheaply.

## NOTE 2026-08-25-1257 — principal-security: what CLEAR does and does not mean

- **Not `complete`, not `release-ready`, not `shipped`.** Both required reviews are now satisfied
  **at this ref only**. If the ref moves, **both** entries stop counting and both re-bind together.
- **The verdict rests on source I read, not on the suite I could not run.** Byte-identity and the
  green `npm test` are operator attestations, used as input. Stated plainly rather than absorbed.
- **CLEAR is not "nothing found".** Two P2s and three residual risks are on the record with named
  owners. What CLEAR means is: no material unresolved security gap **for the stated scope**, and
  nothing that should stop the item.
- **Scope held.** No judgement was made on degraded-refusal, the version-skew CI arm, cross-pack
  collision/namespace gating, migration, committed pack trees, publication, host empirical gates,
  or PR CI status. Their absence from this review is not approval of them.
- **No implementation or release file was edited**, nothing was executed, committed, pushed,
  merged, tagged, released or published, and no active check of any kind was performed.
- **Activity log not appended:** `kai-core-work-activity` writes via `scripts/activity.mjs` and
  this run had no shell. Per that skill a failed append is reported and dropped — never retried,
  never allowed to gate the work. `kai/initiatives/pack-split/log.md` was updated by hand.
- **`.kai/runs/` not used, deliberately.** That lane holds evidence that must not become durable;
  this review produced none — public repo, no secrets, no PII, no topology, no customer data. With
  nothing to segregate, a second copy would only drift. Recorded rather than silently skipped.

## NOTE 2026-08-25-1310 — workflow-ship claimed (self-grant)

Self-granted the workflow lease to run the DoD gate: holder `workflow-ship`, token
`wsh-2026-08-25-1310-pfc-dod`, `version_at_grant: 12`; re-read after the grant confirmed
holder, token and version. Gate result written, lease **cleared** in the same run.
Item version **12 -> 13 -> 14**. No other role held or was waiting on this item.

## HANDOFF 2026-08-25-1310 — workflow-ship -> @operator

- did:       **Six-dimension DoD gate in PREPARE mode. Verdict: `RELEASE-READY` — all six
             dimensions Clear, none Waived.** State **`in-review` -> `release-ready`**
             (`resume_state` stays `null`), `next_role: workflow-ship -> "@operator"`, lease
             self-granted and cleared, version **12 -> 14**. **Ship record written.** Nothing
             was merged, tagged, released or published, and **kai will not do any of those** —
             the deploy steps below are yours to run.

             **Security predicted this gate would bounce, and that prediction is now superseded
             by evidence rather than waved away.** At 2026-08-25-1257 nothing was committed and
             the branch sat at `9d16e075…`, so the one unticked acceptance criterion —
             "`validate` green on the pushed PR" — could not be satisfied. It now is, on the
             platform every future PR uses:

             GitHub Actions run **32893764931**, workflow `validate`, event `pull_request`,
             `head_sha d4145eed69681e20d2443a4242e687a9036bf557`, base `main` `9d16e075…`,
             `run_attempt: 1`, `status: completed`, **`conclusion: success`**; job **`contract`**
             (`97951496629`) on `ubuntu-latest` / Node 20, `2026-08-25T20:10:09Z -> 20:10:23Z`
             (**14s**), **all 11 substantive steps `success`** — including step 4
             `Validate plugin contract` (the new byte-pin), steps 8–9 the pack-generator
             self-test and committed-tree check, and step 11 the `pull_request`-only **real**
             `Release-guard --base --head` gate. Read from `api.github.com` by this run,
             read-only — **not accepted on report.**
             <https://github.com/RubenSaucedo/kai/actions/runs/32893764931/job/97951496629>

             | # | Dimension | Status | Evidence |
             |---|-----------|--------|----------|
             | 1 | scope-true | **Clear** | Diff = `touches` + release metadata + coordination records, inside `scope.current: [dependency-guarantees]`. `non_negotiable` re-read, not asserted: `COMMITTED_PACKS = []`, **no `packs/` tree**, marketplace **N=1** (`kai` at `source: "."`, version-only patch), root stays source of truth, `0.x`. `.github/workflows/validate.yml` untouched by design. **P2-S1 parked as a backlog PROPOSAL**; nothing dropped. |
             | 2 | verified | **Clear** *(was the only open criterion)* | The run above, 11/11 green. Local `npm test` exit 0 + `--self-test` (44), the three `--all` arms, `--check`, `validate-plugin` 56/51, `docs:check`, `host-contract`, `release-guard`, syntax — operator-attested. **Design/QA-UI sub-gates not triggered** (developer-facing packaging, no user-facing surface); no waiver invented. |
             | 3 | reviewed | **Clear** | Architecture **ratified** + security **clear**, both bound to `change_ref 3383d7f2…` = the item's `change_ref`. A1/A2/N1 closed and re-read on disk. N2 decided-accepted. Head-vs-ref byte-identity is operator-attested and re-checked at deploy step 1. |
             | 4 | shippable-safely | **Clear (proportional)** | `review-rollout-operability` — **Holds**. No runtime service, data, migration, external state or publication change. The block ships only into **generated** trees, none committed, so the shipped 56 agents are byte-unaffected; consumers get one inert skill. Pre-merge reversibility total; post-merge one revert. Signals: `validate` on `main`, then the next PRs. Owner `principal-swe-infra`. |
             | 5 | documented | **Clear** | `CHANGELOG [0.59.0]` + compare link (the `v0.58.0` tag exists, so it is not dangling), README `## Status` `v0.59.0` 56/51 agreeing with `:168`, catalog + inventory at 51, ship record written and indexed in `deliverables.md`, `log.md` release-ready entry. **Ship stamp withheld.** |
             | 6 | coordination-closed | **Clear** | Item v14 truthful, criterion 6 ticked **with the run URL**; this HANDOFF is the deploy handoff; BOARD/ACTIVE refreshed; `depends_on` satisfied at generator-gates v17; `waiting_on_questions: []`. |

- state:     release-ready
- change_ref: `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7` — **deliberately unchanged.** Both
             reviews bind this object; per `kai-core-work-coordination`, `change_ref` moves when
             the *implementation* changes, and the operator attests the implementation/release
             files at PR head `d4145eed…` are byte-identical to it. Deploy step 1 re-checks that
             mechanically and fails closed.
- artifacts: `kai/initiatives/pack-split/artifacts/docs/pack-split-preflight-compat-ship-record.md`
             — canonical home is
             `kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md`;
             **promotion owed** (this run cannot create directories), filed as deploy step 6.
- evidence:  Item `## Ship gate — DoD, 2026-08-25-1310`; the ship record above; run
             32893764931 / job 97951496629; PR <https://github.com/RubenSaucedo/kai/pull/154>.
             **Environment limits stated, not absorbed:** no shell; `api.github.com` began
             returning 403 mid-run, so the PR file list and a `contents/packs?ref=…` 404 could
             not be re-derived at the head — those are read from the checked-out tree at
             `d4145eed…` and re-verified on `main` at production verification.
- needs:     **Operator deployment, in this order** (full commands, abort criteria and rollback
             in the ship record):
             1. `git diff --exit-code 3383d7f2… origin/kai/feat/29-preflight-compat -- <the 15
                implementation/release files>` — must exit 0. `kai/**` may differ; implementation
                or release-file drift voids both review bindings and returns the item here.
             2. Commit the readiness records, push, then `gh pr checks 154` — `contract` must be
                green on the **final** head you merge. Run 32893764931 only proves `d4145eed…`.
             3. **Squash and merge PR #154.**
             4. Watch `validate` on `main` at the merge commit (push event, 10 steps).
             5. `git tag v0.59.0 && git push origin v0.59.0`, then cut the GitHub release from
                the `[0.59.0]` CHANGELOG section. **Release-note constraint (security P2-S2):**
                do **not** claim pack agents *refuse* — the truthful claim is that they *carry a
                byte-pinned fail-closed instruction*; and do not imply any pack is published.
             6. `git mv` the ship record to its canonical library home.
             7. Return deployment evidence to `workflow-ship`: **CONFIRM-START** — run URL/ID,
                environment, version + SHA, start timestamp; **CONFIRM-COMPLETE** — merge SHA and
                timestamp, the `main` run URL **with its `conclusion`**, tag + release URLs,
                completion timestamp. Do not mark this item `shipped` by hand.
- questions: none blocking.
- next:      **@operator** — run the deploy steps, then hand back to `workflow-ship` for
             CONFIRM-START / CONFIRM-COMPLETE.

## NOTE 2026-08-25-1310 — workflow-ship: what RELEASE-READY does and does not mean

- **Not `shipped`, and not deployed.** `release-ready` means the gate passed and the release is
  recorded with its rollout, rollback and verification plans. Production verification is a
  separate, evidenced state and only the operator can produce the evidence that starts it.
- **Nothing downstream moved.** `pack-split-degraded-refusal` and `pack-split-ci-partition-checks`
  require this item at **`shipped`** and stay non-dispatchable; `pack-split-crosspack-validator`
  still overlaps it on `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs`, so the
  touch-conflict check at dispatch still applies. Milestone `dependency-guarantees` remains
  **1 of 5 required items `shipped`**.
- **P2-S1 was not left to memory.** It is parked as a PROPOSAL in
  `kai/initiatives/pack-split/backlog.md` with owner `principal-swe-infra` and natural home
  `pack-split-ci-partition-checks`. **This gate created no item** — filing stays the steward's
  call, exactly as security intended.
- **No residual risk was accepted here.** R1 (authenticity, operator's call *at publication* —
  not this release), R2 (instruction-level, evidence owed by `pack-split-host-gates`) and R3
  (semantic integrity rests on review re-binding) travel unchanged. Nothing was waived.
- **Activity log not appended:** `kai-core-work-activity` writes via `scripts/activity.mjs` and
  this run had no shell. Per that skill a failed append is reported and dropped — never retried,
  never allowed to gate the work. `kai/initiatives/pack-split/log.md` was updated by hand.
- **`.kai/runs/` not used.** The gate produced one durable record and no evidence requiring
  segregation — public repo, no secrets, no PII, no customer data. A run-lane copy would only
  drift. Recorded rather than silently skipped.
## NOTE 2026-08-25-1314 — operator: ship-record promotion completed

- Moved the release-ready record to its canonical library home:
  `kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md`.
- Updated current coordination references. Historical handoffs retain the pre-promotion
  path because the thread is append-only.
- No implementation or release metadata changed; review bindings remain valid.

## NOTE 2026-08-25-1328 — workflow-ship claimed (self-grant)

Self-granted the workflow lease to run CONFIRM-START / CONFIRM-COMPLETE: holder `workflow-ship`,
token `wsh-2026-08-25-1328-pfc-confirm`, `version_at_grant: 14`; re-read after the grant confirmed
holder, token and version. Both phases ran in one pass because the operator supplied *both*
deployment-start and successful-completion evidence; the intermediate states were still walked and
recorded, not collapsed. Lease **cleared** in the same run. Item version **14 -> 15 -> 16 -> 17**.
No other role held or was waiting on this item.

## HANDOFF 2026-08-25-1328 — workflow-ship -> (none: item closed)

- did:       **CONFIRM-START + CONFIRM-COMPLETE. Verdict: `SHIPPED`.** State
             **`release-ready` -> `deploying` (v15) -> `production-verification` (v16) ->
             `shipped` (v17)** — no state skipped, `shipped` **not** reached directly from
             `release-ready`. `resume_state` stays `null`, `next_role: "@operator" -> null`,
             lease self-granted and cleared, `change_ref` **unchanged** at `3383d7f2…` (deployment
             moves an item's state, not its reviewed implementation ref).

             **kai merged, tagged, released and published nothing — at any phase.** The operator
             executed every one of those actions; this run recorded them and re-derived the
             production facts read-only. **No rollback was invoked.**

             **Deployment start:** PR #154 squash-merged 2026-08-25T20:27:09Z into
             `67670525808be349466155b836a7fdbbe4dfb8b7`; environment `main` + GitHub Releases;
             version `0.59.0`; `main` run started 20:27:12Z.

             **Deployment completion:** run **32895404267**, `event: push`, `run_attempt: 1`,
             `status: completed`, **`conclusion: success`**, `head_sha` exactly the merge commit,
             `20:27:12Z -> 20:27:30Z`. Tag `v0.59.0` + release published 20:28:01Z.
             <https://github.com/RubenSaucedo/kai/actions/runs/32895404267>

             **Production verification — all six checks PASS, five re-derived here against the
             merge commit itself** (via `raw.githubusercontent.com` and the git-trees/tags APIs,
             deliberately **not** the local worktree, so a dirty checkout could not fake a pass):

             | # | Check | Result |
             |---|-------|--------|
             | 1 | `main` CI green at the merge SHA | **PASS** — run 32895404267 `conclusion: success` at `67670525…`; local `main` = `origin/main` = that SHA. Job-step detail (`97956815622`, 16s) stays **operator-attested** (jobs endpoint 403), and is subsumed by the run-level `success`. |
             | 2 | Version coherence `0.59.0` | **PASS** — all eight locations at the merge commit; `plugin.json`, `package.json`, `package-lock.json` ×2, marketplace ×2, README `## Status` (56 agents / 51 skills), `CHANGELOG [0.59.0]`. Compare link non-dangling: API reports `v0.58.0 -> 47aa0549…`. |
             | 3 | Marketplace exactly one entry | **PASS** — `plugins[]` length **1**, `kai` at `source: "."`. No pack entries. |
             | 4 | `COMMITTED_PACKS = []`, no `packs/` tree | **PASS — proven positively.** The merge commit's root tree lists `package-lock.json`, `package.json`, `plugin.json` consecutively; `packs` sorts between the latter two in git byte order and **is absent**. Not inferred from a local glob. |
             | 5 | Probe shipped and pinned | **PASS** — `skills/kai-core-contract-v1/SKILL.md` at the merge commit, exact `KAI_CORE_READY` / `contract: 1` marker; byte-pin re-asserted by check 1's green `Validate plugin contract` step. |
             | 6 | Tag/release point at the merge | **PASS** — annotated tag object `338cfb04…` peeled via the `tags` API to commit `67670525…`; release `376694649` published, not draft, not prerelease. |

             **Security P2-S2 held in the published notes, checked by reading the body.** They say
             generated department-agent bodies *carry a canonical, byte-pinned fail-closed
             compatibility instruction* and that the **preview arms** emit `KAI-CORE-MISSING`.
             They do **not** claim a pack agent *refuses* — the claim nothing yet proves — and
             they state no `packs/` tree is committed and the marketplace exposes only the
             monolithic `kai`. Compliant.

- state:     shipped
- change_ref: `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7` — unchanged, deliberately.
- artifacts: `kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md`
             — updated with the deployment record and the executed production verification.
- evidence:  Item `## Ship confirm — CONFIRM-START + CONFIRM-COMPLETE, 2026-08-25-1328`; the ship
             record above; run 32895404267; release <https://github.com/RubenSaucedo/kai/releases/tag/v0.59.0>.
             **Environment limits stated, not absorbed:** no shell; `api.github.com` returned
             **403** on the per-job step list and on `git/tags`, so both were worked around with
             equal-or-stronger read-only sources (run-level conclusion; the `tags` listing, which
             returns the peeled commit) rather than downgraded to assertion.
- needs:     nothing. The item is closed.
- questions: none blocking.
- next:      **none — `next_role: null`.** Dependents were cleared strictly by the DAG:
             **`pack-split-degraded-refusal` is now unblocked** (this was its sole dependency);
             **`pack-split-ci-partition-checks` remains blocked** on `pack-split-crosspack-validator`
             (still `ready`), one of two dependencies met; `pack-split-generated-pack-trees` has
             two of six met and stays `proposed`, outside `scope.current`. Dispatch is the
             director's call, not this gate's.

## NOTE 2026-08-25-1328 — workflow-ship: what SHIPPED does and does not mean

- **It means production was verified, not that the diff was green.** Five of the six checks were
  re-derived here against the merge commit; the sixth (job-step breakdown) is named as
  operator-attested rather than quietly counted as verified.
- **`pack-split-degraded-refusal` is genuinely dispatchable now**, but it still **shares the
  generated-agent-body injection surface** with `pack-split-crosspack-validator` on
  `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs` — the touch-conflict check at
  dispatch is not waived by this item shipping. It must also place its block **after** the
  preflight; A2 now enforces that mechanically rather than by memory.
- **No residual risk was accepted here.** R1 (authenticity — the operator's call *at publication*,
  which this release is not), R2 (instruction-level obedience, owed by `pack-split-host-gates`)
  and R3 travel unchanged. **P2-S1 remains a parked PROPOSAL** in
  `kai/initiatives/pack-split/backlog.md`; this run created **no item** — filing stays the
  steward's call.
- **P2-S2 is now discharged for this release only.** It binds the *next* set of release notes too;
  nothing about shipping `0.59.0` licenses a future "pack agents refuse" claim.
- **Milestone `dependency-guarantees` is OPEN at 2 of 5 required items `shipped`.** Shipping the
  queue head does not shorten the milestone by more than one item.
- **Activity log not appended:** `kai-core-work-activity` writes via `scripts/activity.mjs` and
  this run had no shell. Per that skill a failed append is reported and dropped — never retried,
  never allowed to gate the work. `kai/initiatives/pack-split/log.md` was updated by hand.
- **`.kai/runs/` not used.** This confirmation produced no evidence requiring segregation — public
  repo, no secrets, no PII, no customer data. A run-lane copy would only drift.

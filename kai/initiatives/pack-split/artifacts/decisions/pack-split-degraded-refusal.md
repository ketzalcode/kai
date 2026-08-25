# Architecture Decision — the degraded refusal's trigger boundary, and what §147 still binds

**Source:** `kai/coordination/items/pack-split-degraded-refusal.md` (v5, `in-review`), dispatched by
the operator HANDOFF `2026-08-25-1525` on the thread; the question routed by
`principal-swe-infra` at `2026-08-25-1518` (build note, question **(b)**).
**Date:** 2026-08-25 15:16 local
**Run:** principal-swe-architect (`independent-architecture`, lease `psa-2026-08-25-1525-dgr`)
**change_ref:** `8d3ef4844988f4974e6bec8f406a7723dee4e942`
**Initiative:** pack-split (milestone `dependency-guarantees`)

**Decision (one line):** `docs/proposals/pack-architecture.md:147`'s trigger clause — the degraded
block ships "for when the preflight **fails**" — is **superseded** by the shipped preflight
contract; the shipped block's trigger sentence stands unchanged, and no implementation change is
required at this ref.

> **Boundary.** This record decides a seam. It edits no implementation or release file, runs no
> command, and creates no work item. Threat/control acceptance is `principal-security`'s;
> milestone-acceptance wording is the steward's. Both are routed below, not decided here.

---

## Context

Two guarantee blocks are now copied into every generated department agent's own body by one
authoritative path (`materializePacks` in `scripts/lib/pack-plan.mjs`), and byte-pinned in
`scripts/validate-plugin.mjs`:

- `scripts/lib/preflight-block.txt` (shipped `v0.59.0`) — invoke `kai-core-contract-v1` first; on
  absence, missing marker, or a version other than `contract: 1`, **reply with exactly
  `KAI-CORE-MISSING` and nothing else** and stop.
- `scripts/lib/degraded-block.txt` (this item, `v0.61.0`, 840 bytes) — opens *"The preflight above
  proves `kai-core` answered and is compatible. If its shared contracts are still not loaded in this
  session…"*, then refuses single-shot.

The ratified proposal predates the shipped preflight and describes the second block as shipping
"for when the preflight fails", sketching it as *"You are running without `kai-core`"*. The two
readings cannot both be built. Infra built the boundary the dispatch brief named, surfaced the
divergence rather than absorbing it, and routed the call here.

Read for this ruling: `scripts/lib/degraded-block.txt`, `scripts/lib/preflight-block.txt`,
`scripts/lib/pack-plan.mjs:244-410`, `scripts/validate-plugin.mjs:362-490`,
`scripts/pack-preview.mjs:80-260, 320-560`, `docs/proposals/pack-architecture.md:120-170`,
`kai/initiatives/pack-split/northstar.md`, and the `preflight-compat` A1/A2 review history.

## Diagram

**Where the two blocks live (component / boundary).** One canonical file each; one injection path;
one direction of travel. Core agents are outside the injected set in both cases.

```text
   canonical source                 THE SEAM                    generated tree (what a user installs)
   ───────────────────      ────────────────────────────    ─────────────────────────────────────────

   scripts/lib/                materializePacks()             kai-<department>/agents/<id>.agent.md
   ┌──────────────────┐        (pack-plan.mjs — the           ┌───────────────────────────────────┐
   │ preflight-       │──┐      ONE authoritative             │ ---  frontmatter  ---             │
   │   block.txt      │  │      injection path)               │ **Inherits:** … + blockquote      │
   ├──────────────────┤  ├──▶ guaranteeBlocks() ──▶ ══════════╪══ injection anchor ═══════════════│
   │ degraded-        │  │      = [preflight, degraded]       │ ## Core preflight   ← 1st exec.   │
   │   block.txt      │──┘    injectBlocks() = ONE splice     │ ## Degraded mode    ← contiguous  │
   └──────────────────┘         in argument order             │ agent body …                      │
        │      │                                              └───────────────────────────────────┘
        │      │                                                          ▲
        │      │                                              validate-plugin.mjs pins, over real
        │      │                                              generator output: exact bytes · exactly
        │      │                                              one each · preflight first after the
        │      │                                              directive · refusal immediately after
        │      │                                              the preflight · whitespace only between
        │      │
        │      └── NOT injected ──▶ ┌──────────────────────────────────────┐
        └───────── NOT injected ──▶ │ kai-core/agents/<id>.agent.md        │  zero copies of either,
                                    │ frontmatter + body, verbatim         │  asserted in both
                                    └──────────────────────────────────────┘  directions
```

**Which condition each block owns (why §147's literal trigger is unreachable).**

```text
  session start
      │
      ▼
  invoke `kai-core-contract-v1`                      ◀── PREFLIGHT DOMAIN
      │
      ├─ skill absent │ no KAI_CORE_READY │ not `contract: 1`
      │        │
      │        └──▶ reply EXACTLY `KAI-CORE-MISSING`, nothing else, stop   ██ TERMINAL ██
      │                                                                    no prose may follow,
      │                                                    so §147's "block for when the preflight
      │                                                    fails" has no reachable place to run
      │
      └─ KAI_CORE_READY ∧ `contract: 1`   (core answered, compatible)
               │
               ├─ shared operating contract IS in session ──▶ continue normally, never mention it
               │
               └─ shared operating contract NOT in session ──▶  ◀── DEGRADED DOMAIN
                        └──▶ single-shot answer · no claim/lease/handoff/review ·
                             no workspace or coordination state · no acting on remembered
                             rules · tell the operator to install `kai-core`
```

The two domains are disjoint by construction, and the union is total: every session lands in exactly
one leaf.

## Forces

1. **The preflight's failure path is terminal and byte-pinned.** "Reply with exactly
   `KAI-CORE-MISSING` and nothing else" is enforced in CI (`validate-plugin.mjs:395-397`) and was
   ratified at `3383d7f2…`. A second block that speaks *after* a failed preflight would require the
   agent to emit prose the preflight forbids. Implementing §147 literally makes the two shipped,
   byte-pinned blocks contradict each other — the fail-open reading the architect bounced **twice**
   on `preflight-compat` (A1, rounds 1231 and 1241), re-imported through a different door.
2. **A block that asserts a falsehood is not a refusal, it is noise.** After a passing preflight,
   "You are running without `kai-core`" is false on its face. An agent that reads a false premise in
   its own body is being trained to discount its own guarantee blocks.
3. **One diagnostic token, one meaning.** `KAI-CORE-MISSING` is the operator's only machine-readable
   signal. Overloading it with "core is here but the contract did not load" destroys the one
   distinction that tells the operator whether to *install* something or to *restart a session*.
   `degradedBlockErrors` forbids the block from carrying it.
4. **There is a real state neither block covered before this item.** The probe proves the *plugin*
   is installed and compatible. It cannot prove the *inherited skills* reached the session context —
   that is the "silent contract loss" §139-146 opens with, and it survives a passing preflight.
   Leaving it uncovered is the only outcome that loses coverage.
5. **The proposal's normative claims are elsewhere, and they are all satisfied.** §149-165 —
   "refusal, not a fallback contract", "restates no rules", canonical file + CI pin, trivial
   migration — is what the northstar lifted into a `non_negotiable`. §147 is a one-line trigger
   description, and its sketch is explicitly prefaced *"roughly:"*. Nothing depends on §147's clause
   except the wording of a block that has since been built more precisely than the sketch.

## Options considered

| # | Shape | Cost | Forces |
|---|-------|------|--------|
| **A** | **Ship as built; record §147's trigger clause as superseded.** | One doc errata, no code. | Satisfies 1-5. The trigger the block claims is the only one reachable after a terminal preflight. |
| B | Rewrite the block to §147's literal wording ("You are running without `kai-core`", fires when the preflight fails). | Reopens A1's fail-open class; requires relaxing the preflight's "nothing else" clause — a shipped, ratified, byte-pinned guarantee. | Violates 1, 2, 3. Leaves force 4 uncovered entirely: nothing then answers "installed but not loaded". |
| C | Ship **both** trigger sentences — a two-condition block. | Two conditions, one budget; the `KAI-CORE-MISSING` prohibition would have to be dropped for the core-absent arm. | Violates 1 and 3, and makes the block longer for a branch that cannot execute. |
| D | Do nothing — leave §147 and the shipped block disagreeing, undecided. | Free today. | The next implementer to read §147 "fixes" the block back into option B. The divergence is cheap to resolve now and expensive after packs are published. |

## Decision

- **Disposition: Endorse** (the shipped boundary), with `docs/proposals/pack-architecture.md:147`'s
  trigger clause **superseded** by the shipped preflight contract.
- **Recommendation:** no change to `scripts/lib/degraded-block.txt`, to the injection order, or to
  the pin. The stale artifact is the **proposal sentence**, not the code. Recorded here so the
  supersession is discoverable from the initiative's decisions directory; a one-line errata on
  §147 (pointing at this record) should ride whatever item next legitimately edits that proposal —
  it is **not** worth an item of its own and **must not** be smuggled into this ref's diff.
- **Precisely what is superseded, and what is not.** Superseded: §147's clause "for when the
  preflight fails", and the illustrative sketch's opening line at §157. **Not** superseded, and
  fully implemented as written: refusal-not-fallback (§149), restates-no-rules (§151-154), the
  canonical-file + CI-byte-pin mechanics (§161-165), and the trivial-migration property (§159-160).
- **Domain work it implies:** none at this ref. Infra owns the interior of these scripts and the
  shipped shape is the one I would have specified.
- **What stays the same:** the injection anchor and the `preflight-first` adjacency bound (the A2
  guard from `preflight-compat`); `injectPreflight` as the single-block form; `COMMITTED_PACKS = []`
  with no `packs/` tree; the marketplace at exactly one entry; core agents excluded from both blocks
  **for this ref** (see A1 below for the trigger that reopens that, and only that).
- **Reversibility:** the *decision* is cheap to reverse (edit one file, re-pin, regenerate — no data
  model, no published contract, no committed tree yet). The *class of error* it avoids is not: once
  packs are published, a block that contradicts the preflight ships to every installed department.

### Residual accepted — the "restates no rule" check is a shape check, not a semantic one

Infra flagged that the bullet-opener rule reads each bullet's **first line**, so an affirmative
instruction on a wrapped continuation line would pass it. **The hole is real and slightly wider than
described:** `degradedBlockErrors` tests openers as a *prefix*
(`DEGRADED_OPENERS.some((re) => re.test(bullet))`), so anything after the first clause escapes on the
**same** line too — `- Do not claim work; record the handoff in the thread.` passes the opener rule
exactly as a wrapped continuation would. The block's opening paragraph is free prose and is not
opener-checked at all.

**Accepted, no change required at this ref**, because the guarantee is honest once stated precisely:

- **Mechanical, by construction:** the block cannot cite a shipped skill or agent id; cannot repeat
  any ≥40-char line of the *live* `kai-core-*` skills (re-derived at check time, so it tracks core);
  cannot carry `KAI-CORE-MISSING` or a `` `contract:` `` literal; cannot exceed 1200 characters; and
  is byte-identical, exactly once, in the right position, in every generated department agent.
- **By review, not by machine:** whether a *newly authored English clause* inside those constraints
  is a coordination rule. No regex decides that, and the two fixes offered (forbid wrapped bullets,
  or sentence-split the block) trade real readability for a check that still would not decide it.

That distinction matters at the ship gate: acceptance criterion 3 is satisfied in the sense that the
check makes the **drift-prone** failures — appending a bullet, quoting core, growing the block —
mechanically impossible; it does not make a deliberately smuggled paraphrase impossible. Recorded so
nobody over-reads it later; **not** a finding, and **no** work is created.

## Open questions / escalations

### A1 — Core agents are excluded on an argument the re-scoped trigger no longer fully supports. **Defer, trigger named.**

The exclusion is justified as: *a core agent ships inside `kai-core`, so the absence it refuses is
not a state it can be in*. That is airtight for **install-level** absence — which is the condition
§147 assumed. It is **not** airtight for the condition this block actually owns: "installed and
compatible, but the shared contract is not in this session" is a *context-loading* property, not an
install property, and a `kai-core` agent is exposed to it exactly as a department agent is.

Not blocking, and deliberately not fixed here:

- **Unreachable in production today.** `COMMITTED_PACKS` is `[]`, there is no `packs/` tree, the
  marketplace ships one entry, and the monolith is still authoritative — no core-only install exists
  in the world to be exposed.
- **Closing it now would expand scope.** A core agent carries no preflight, so this block's first
  sentence ("The preflight above proves…") would be false there. Covering core needs a *second*
  canonical block, a second pin, and a second set of rules — a new file and new capability beyond
  this item's committed scope. Per `scope-discipline` that is a steward call at triage, not
  something architecture designs in during a review.
- **Trigger to reopen:** when a core-only install first becomes real — `pack-split-generated-pack-trees`
  (committed core tree) or, at the latest, `pack-split-first-department`. Routed to
  `principal-product-manager` as a **proposal**, joining the existing A1-A6 finding routes.

### E1 — Milestone acceptance wording, for the steward, not for me

`northstar.md` (`dependency-guarantees`) reads: *"The degraded-mode block is a refusal that restates
no core rules, **shipped in every pack**."* The implementation ships it in every **department** pack
(4 of 5), by the deliberate and — for install-level absence — correct exclusion above. The **item's**
acceptance, which the steward tightened at promotion, says "every generated **pack agent**" and is
met exactly. Whether the milestone line reads as satisfied, or should be amended to "every department
pack", is milestone-acceptance interpretation: **`principal-product-manager`'s call.** Architecture
does not self-clear it, and it does not block this ratification.

### N1 — For `principal-security`, at this same ref (their finding, now wider)

`P2-S1` from the `preflight-compat` security review — the generated-agent pin is gated on
`/^kai-[a-z]+\/agents\/.+\.agent\.md$/` — now gates **two** guarantees rather than one. A future pack
key outside `[a-z]+` would silently escape the preflight pin *and* the refusal pin together. No such
pack key exists (`core`, `engineering`, `product`, `gtm`, `personal`), so this is a blast-radius
update to a known, already-routed observation, not a new finding.

### N2 — For the ship gate: which command is actually the evidence

`pack-preview --check` returns `{ ok: true }` early while `COMMITTED_PACKS` is empty and `packs/` is
absent (`pack-preview.mjs:281-283`) — it is **vacuous** for this item. The CI enforcement of this
change rides on `node scripts/validate-plugin.mjs` (which materialises the tree in memory and pins
the blocks over real generator output) and `pack-preview --self-test` (the mutation, ordering,
core-exclusion, on-disk `--all` and drift arms). "`--check` passed" is true and must not be read as
evidence that the blocks are injected or pinned.

### N3 — Recorded, not routed (no work created)

`injectPreflight` survives as an exported single-block helper whose only remaining caller is one
self-test arm (`pack-preview.mjs:350`). It is inert today — every production path goes through
`guaranteeBlocks`/`injectBlocks` — but it is an exported affordance for producing an agent carrying
the preflight and **not** the refusal, which the validator would only catch because the pin asserts
over `materializePacks` output rather than over that helper. A note for whoever next edits
`pack-plan.mjs`; not a finding, and nothing to fix at this ref.

---

## What this ratification does and does not do

- **Does:** satisfy the `independent-architecture` requirement, **at
  `8d3ef4844988f4974e6bec8f406a7723dee4e942` only**. If the ref moves, this entry stops counting and
  both required reviews re-bind together.
- **Does not:** make the item `complete`, `release-ready`, or `shipped`; clear
  `principal-security`; tick the CI-green-on-the-pushed-PR criterion (only a workflow run can);
  or move milestone `dependency-guarantees`, which stays at **3 of 5** required items `shipped`.
- **Evidence basis:** read through the worktree at `C:\src\kai` on the operator's attestation that
  the implementation and release diff is byte-unchanged since binding. This run had **no shell**;
  nothing was executed. The operator's green `npm test` (exit 0), `--check`, and the five generated
  preview trees are **input to this review, never its verdict**.
- **Clock note:** this run's local clock reads **15:16**, earlier than the `1525` dispatch handoff it
  answers. Stamped as read rather than adjusted forward; the ordering is a clock discrepancy, not a
  review that predates its dispatch.

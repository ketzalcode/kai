---
type: work-item
id: pack-split-degraded-refusal
title: Canonical degraded-mode refusal block shipped in every pack, CI-pinned
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: shipped
resume_state: null
priority: 40
owner: principal-swe-infra
next_role: null
target: pack-split degraded-mode refusal
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - scripts/lib/inherits-block.txt
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
  - kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal/ship-record.md
touches:
  - scripts/lib/degraded-block.txt
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - .github/workflows/validate.yml
  # Reconciled at handback 2026-08-25-1518. `.github/workflows/validate.yml` was
  # declared but NOT changed: the workflow already runs `validate-plugin` and the
  # pack self-test, so no new CI step was needed and none was added. The release
  # files below are mandatory for any behaviour-sensitive change under AGENTS.md,
  # so they are declared rather than left as a silent expansion. No new capability.
  - README.md
  - CHANGELOG.md
  - plugin.json
  - package.json
  - package-lock.json
  - .github/plugin/marketplace.json
depends_on:
  - item: pack-split-preflight-compat
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
    change_ref: 8d3ef4844988f4974e6bec8f406a7723dee4e942
    verdict: ratified
    evidence: "kai/initiatives/pack-split/artifacts/decisions/pack-split-degraded-refusal.md"
    timestamp: 2026-08-25-1516
  - role: principal-security
    kind: independent-security
    change_ref: 8d3ef4844988f4974e6bec8f406a7723dee4e942
    verdict: clear
    evidence: "kai/initiatives/pack-split/artifacts/security/pack-split-degraded-refusal.md"
    timestamp: 2026-08-25-1540
change_ref: 8d3ef4844988f4974e6bec8f406a7723dee4e942
version: 12
lease: null
updated: 2026-08-25-1612
---

## Outcome

One canonical refusal block (`scripts/lib/degraded-block.txt`) that restates **no** core rules —
it states the absence of the contract and stops — copied into every pack agent by the generator
and pinned byte-for-byte in CI, so it cannot drift from core as core evolves.

## Acceptance

*Tightened by the steward at promotion 2026-08-25-1148 against the shipped foundation
(`pack-split-generator-gates`, `v0.58.0` on `main`). Two finding-driven changes only, no new
requirement and no raised bar: (1) the copy path is named as the **authoritative generator
path** (`materializePacks` in `scripts/lib/pack-plan.mjs`), whose own header states that
"Guarantee-block injection (preflight, degraded-mode) ... are added by downstream items, not
here" — this item is that downstream owner for the degraded-mode block, per the steward's
2026-08-24-2240 generator-gates acceptance correction; (2) the bundled "local commands + CI
green" criterion is **split**, because that exact bundling bounced `generator-gates` at the
2026-08-24-2244 DoD gate — two claims with two different evidence sources cannot share one
checkbox.*

- [x] `scripts/lib/degraded-block.txt` exists, restates no operating rules, and instructs single-shot
      refusal + "install kai-core" only. — 840-byte canonical file on disk and byte-identical at PR
      head `75053e08…`; `degradedBlockErrors()` (`scripts/lib/pack-plan.mjs:360-371`) is enforced by
      `scripts/validate-plugin.mjs:428-437` and ran green in `npm test` (exit 0) and in CI run
      `32908330221`.
- [x] Every generated pack agent carries the verbatim block, copied in by the **authoritative
      generator path** (`materializePacks`), so a committed tree — not only a `--all` preview —
      carries it; `validate-plugin.mjs` pins it byte-for-byte from the canonical file, following
      the existing `scripts/lib/inherits-block.txt` pin precedent. — `materializePacks`
      (`pack-plan.mjs:244-258`) injects `guaranteeBlocks()` (`:280`) via one `injectBlocks()` splice
      (`:286`) into every non-core agent and neither block into a core agent;
      `validate-plugin.mjs:440-482` pins exact bytes, exactly one copy, zero in core, and adjacency
      after the preflight, **over real generator output**. Green in `npm test` and in CI.
- [x] A CI check asserts the block introduces no coordination rule (drift-proof by construction).
      — `validate-plugin.mjs:428-437` runs `degradedBlockErrors` on the canonical file inside the
      existing `Validate plugin contract` step; `pack-preview --self-test` proves the failures by
      name through mutation. No new CI step was needed or added.
- [x] The block is present in every pack agent body produced by
      `node scripts/pack-preview.mjs --all --out <dir>`. — the on-disk `--self-test` arms read every
      agent a full `--all` build writes, in both directions (present in department, absent in core),
      plus a drift arm that softens the refusal inside a generated tree and catches it on that exact
      file; operator generated all five preview trees at 2026-08-25-1525.
- [x] `node scripts/pack-preview.mjs --self-test`, `node scripts/validate-plugin.mjs`, and
      `npm test` pass **locally**. — operator-attested, thread HANDOFF 2026-08-25-1525: full
      `npm test` **exit 0**, which chains all three (`package.json` `test` script). `--check` also
      passed but is **vacuous** for this item (`pack-preview.mjs:281-283`) and is not counted.
- [x] The `validate` workflow runs **green on the pushed PR** (its own claim, its own evidence —
      a workflow run, not an assertion). — check run `contract` **`97997128517`**, run
      **`32908330221`**, `head_sha 75053e08551e6865df501e85d25888b19693af72`, **`conclusion:
      success`**, 22:54:13Z -> 22:54:25Z (12s), the only check on that head (`total_count: 1`).
      Read from `api.github.com` at the ship gate.
- [x] Version bumped on `0.x` with CHANGELOG + README stamp. — `0.60.0 -> 0.61.0` in
      `plugin.json`, `package.json`, `package-lock.json` (top-level + `packages[""]`),
      `.github/plugin/marketplace.json` (`metadata.version` + the `kai` entry), a dated
      `## [0.61.0] - 2026-08-25` CHANGELOG section with its `[0.61.0]:` compare link, and the
      README `## Status` stamp at `v0.61.0`. File state, readable without running anything.

*Criteria 1–4 were implemented but left unticked by the build session, which ran no commands;
criteria 5–6 were untouched. **All six are now ticked at the ship gate 2026-08-25-1554**, each
against its own evidence source: 1–4 on the pins that assert them running green (locally and in
CI), 5 on the operator's attested `npm test` exit 0, and 6 on the workflow run itself. The
2026-08-24-2244 DoD bounce was about ticking an implementation claim on an unrun check; no tick
here rests on a read of the code alone.*

## Evidence

**Build 2026-08-25-1518 (`principal-swe-infra`). Implementation complete; ZERO commands were
run in this session — the run had no shell, so every check below is OWED, not passed.**

**What exists in the working tree (uncommitted, on `main`):**

- **`scripts/lib/degraded-block.txt`** (new, 840 bytes). One heading, one paragraph of fact, five
  bullets: one `Refuse …` (single-shot), three `Do not …`, one `Tell the operator to install
  \`kai-core\``. It names no skill, no agent, no contract version, and does not carry the
  preflight's `KAI-CORE-MISSING` token.
- **`scripts/lib/pack-plan.mjs`** — `DEGRADED_BLOCK_REL`, `degradedBlock()`, `guaranteeBlocks()`
  (the order, defined once), `injectBlocks()` (one splice, argument order), `injectPreflight()`
  kept as the single-block form, `coreContractLines()`, and the pure `degradedBlockErrors()`.
  `materializePacks` — the authoritative path — injects `[preflight, degraded]` into every
  non-core agent and neither into a core agent.
- **`scripts/validate-plugin.mjs`** — byte-pin over real generator output: exact copy, exactly
  one per department agent, zero in every core agent, positioned after the preflight with only
  whitespace between, preflight still first after the inherits directive; plus the
  no-coordination-rule rules on the canonical file.
- **`scripts/pack-preview.mjs`** — preview and self-test moved onto `guaranteeBlocks`/
  `injectBlocks`; new arms for injection order, on-disk presence across a full `--all` build,
  core exclusion, generator injection, refusal-rule mutations (8), and a drift arm that softens
  the refusal inside a generated tree and catches it on that exact file.
- **Release metadata** — `0.60.0 -> 0.61.0` in all six version locations (`plugin.json`,
  `package.json`, `package-lock.json` ×2, `marketplace.json` `metadata.version` + the `kai`
  entry), a dated `## [0.61.0] - 2026-08-25` CHANGELOG section with its `[0.61.0]:` compare link,
  and the README `## Status` stamp at `v0.61.0`, inventory unchanged at 56 agents / 51 skills.
- **Unchanged, deliberately:** `COMMITTED_PACKS` is still `[]`, there is no `packs/` tree, the
  marketplace still lists exactly one plugin (`kai` at `source: "."`), and
  `.github/workflows/validate.yml` was not touched — it already runs `validate-plugin`,
  `pack-preview --self-test` and `--check`, so no new CI step was needed.

**Owed, and blocking:** `node scripts/validate-plugin.mjs`, `node scripts/pack-preview.mjs
--self-test`, `node scripts/pack-preview.mjs --check`, `node scripts/pack-preview.mjs --all --out
<dir>`, and full `npm test`. Nothing was branched, committed, pushed, or opened as a PR, so
`change_ref` is `null` and **neither required review can bind yet**.

## Build note — 2026-08-25-1518 (`principal-swe-infra`)

**Trigger boundary, and why it does not conflict with the shipped preflight.** The preflight
(`v0.59.0`) owns core absence and version skew: it fails closed with exactly `KAI-CORE-MISSING`
and stops. That leaves exactly one state uncovered — core answered and is compatible, and the
shared operating contract still is not in the session. The refusal opens by naming that boundary
("The preflight above proves `kai-core` answered and is compatible"), so the two blocks never
claim the same condition, and the validator forbids the refusal from carrying the preflight's
token or any contract-version literal. This is an ordering decision, not an architecture change:
no new file beyond the item's own named file, no new CI step, no new capability.

**One divergence from the ratified proposal text, surfaced rather than absorbed.**
`docs/proposals/pack-architecture.md:147` describes the block as shipping "for when the preflight
**fails**", and its sketch opens "You are running without `kai-core`". That wording predates the
shipped preflight, which now *itself* answers the core-absent case with the exact
`KAI-CORE-MISSING` token and stops — so a block claiming "you are running without `kai-core`"
after a preflight that just proved core answered would be false on its face, and reachable only
by a session that skipped the preflight it is not allowed to skip. The dispatch brief names the
same boundary the implementation uses (preflight owns missing/skewed core; the refusal owns the
absence of the operating contract after compatibility succeeds), so the smallest coherent
ordering was implemented and the proposal's §147 sentence is what needs the architect's word —
either it is superseded by the shipped preflight, or this block's trigger sentence changes.
Nothing else in that section moves: "refusal, not a fallback contract", "restates no rules", the
canonical-file + CI-pin mechanics and the trivial-migration property are all implemented as
written.

**Core agents carry neither block — decided from the item wording and the ratified
architecture, not from convenience.** The item says "copied into every **pack agent** by the
generator" and the acceptance says "every generated **pack agent**"; the architecture pairs the
refusal with the preflight ("a degraded-mode block shipped in every pack for when the preflight
fails"). A core agent ships inside `kai-core`, so the preflight there could only fail on itself
and the absence the refusal describes is not a state it can be in. Placing it in core would ship
a refusal that can never fire, and would put a second copy of it in the pack that owns the
contract. The exclusion is asserted over real generator output, in both directions.

**"Restates no coordination rule", made mechanical.** A prohibition stays correct however core
evolves; an affirmative instruction is a second copy of the contract that drifts. So
`degradedBlockErrors` allows exactly three things to be said — refuse, prohibit, install
`kai-core` — and rejects: any other bullet, any backticked token that resolves to a shipped skill
or agent, any line repeated verbatim from a live `kai-core-*` skill (derived from the shipped
skills at check time, not a pinned list), the preflight's refusal token, a second
contract-version literal, and any block over the 1200-character refusal budget.

**Known residual, recorded not hidden.** The bullet-shape rule reads the first line of each
bullet; an affirmative sentence smuggled onto a *wrapped continuation* line would pass that one
rule. It would still have to survive the citation, verbatim-quote and budget rules. Closing it
properly means either forbidding wrapped bullets or sentence-splitting the block; both were
judged worse than the residual. Flagged for the architecture review to accept or bounce.

## Review — independent architecture (ratification), 2026-08-25-1516 (`principal-swe-architect`)

**Verdict: RATIFIED.** Bound to `change_ref 8d3ef4844988f4974e6bec8f406a7723dee4e942`.
`completed_reviews` now carries this role/kind at this exact ref, so the `independent-architecture`
requirement is satisfied **for this ref only** — if the ref moves, the entry stops counting and both
required reviews must re-bind together. `principal-security` is **unblocked on this same unchanged
ref**. Full decision record, with diagrams and the options table:
`kai/initiatives/pack-split/artifacts/decisions/pack-split-degraded-refusal.md`.

**Evidence basis.** Read through the worktree at `C:\src\kai` on the operator's attestation that the
implementation and release diff is byte-unchanged since binding. This run had **no shell**; nothing
was executed and no file outside coordination/initiative records was edited. The operator's green
`npm test` (exit 0), `pack-preview --check`, and the five generated preview trees are **input to
this review, never its verdict**. Acceptance ticks are the owner's and the DoD gate's, not the
reviewer's — criteria 1–6 are left exactly as the build left them.

### The routed question (b) — DECIDED: §147 is superseded, the block stands

`docs/proposals/pack-architecture.md:147` says the block ships "for when the preflight **fails**",
and §157 sketches it opening "You are running without `kai-core`". **That clause is superseded by
the shipped preflight contract, and no change to `scripts/lib/degraded-block.txt` is required.**

The decisive force is reachability, not taste. The shipped preflight's failure path is **terminal**
and byte-pinned: *"stop immediately. Reply with exactly `KAI-CORE-MISSING` and nothing else."* A
block that speaks after a failed preflight would need the agent to emit prose that block forbids, so
the literal §147 reading makes two shipped, CI-pinned guarantees contradict each other — and it
re-imports the fail-open class the architect bounced twice on `preflight-compat` (A1, 1231 and 1241)
through a different door. It would also assert something false: after a passing preflight, "you are
running without `kai-core`" is untrue on its face, and it would leave the one state neither block
covered — installed and compatible, contract not in session — uncovered entirely.

What §147 was describing is an **install-level** absence; the shipped preflight now answers that
case itself, with a machine-readable token. The block infra built covers the **session-level**
absence that survives a passing preflight — the "silent contract loss" §139–146 opens with. The two
domains are disjoint and their union is total: every session lands in exactly one leaf.

**Superseded:** §147's trigger clause and §157's sketch opening (which the proposal itself prefaces
*"roughly:"*). **Not superseded, and implemented as written:** refusal-not-fallback (§149),
restates-no-rules (§151–154), canonical file + CI byte-pin (§161–165), trivial migration (§159–160)
— i.e. every claim the northstar lifted into a `non_negotiable`. A one-line errata on §147 pointing
at the decision record should ride whatever item next legitimately edits that proposal; it is **not**
worth an item of its own and was deliberately **not** smuggled into this ref's diff.

### The routed question (a) — ENDORSED: the trigger boundary, as built

Verified in code rather than accepted from the handoff:

- `guaranteeBlocks()` states the order `[preflight, degraded]` **once**; `injectBlocks()` splices in
  a **single** pass at one anchor, so the `injectPreflight(injectPreflight(…))` inversion predicted
  by A2 is unconstructible from the shared helper (`pack-plan.mjs:280–296`).
- `materializePacks` — the authoritative path — injects both into every non-core agent and neither
  into a core agent (`pack-plan.mjs:244–258`).
- `validate-plugin.mjs:440–482` pins it over **real generator output**: exact bytes, exactly one
  each, zero of each in every core agent, preflight still first after the inherits directive with
  only whitespace between, refusal immediately after the preflight with only whitespace between.
- The refusal may carry neither `KAI-CORE-MISSING` nor any `` `contract:` `` literal
  (`pack-plan.mjs:360–371`), so the two refusals can never claim the same condition and the
  version-skew prose the architect bounced twice cannot re-enter through this file.
- `pack-preview --self-test` proves the failures **by name** through mutation, reads the on-disk
  `--all` build for every department and core agent, and catches a softened refusal inside a
  generated tree on that exact file (`pack-preview.mjs:354–364, 396–416, 444–481, 540–553`).

### The routed question (c) — residual ACCEPTED, and it is wider than stated

The opener test is a **prefix** test (`DEGRADED_OPENERS.some((re) => re.test(bullet))`), so a clause
after the first escapes on the **same** line too — `- Do not claim work; record the handoff in the
thread.` passes exactly as a wrapped continuation would; the opening paragraph is not opener-checked
at all. Accepted, **no change required at this ref**, with the guarantee stated honestly instead of
widened: *mechanically* the block cannot cite a shipped skill or agent, cannot repeat a ≥40-char line
of the live `kai-core-*` contract (re-derived at check time), cannot carry the preflight's token or a
version literal, cannot exceed 1200 characters, and cannot be absent, duplicated, or misplaced in any
generated department agent; *by review* — not by machine — whether a newly authored English clause
inside those limits is a coordination rule. That is the correct trade: the drift-prone failures are
impossible, and the two offered fixes (forbid wrapped bullets, sentence-split the block) buy no
semantic guarantee. **No work is created by this ruling.**

### A1 — new, non-blocking: core agents are excluded on an argument the re-scoped trigger no longer fully carries. **Deferred, trigger named**

"A core agent ships inside `kai-core`, so the absence it refuses is not a state it can be in" is
airtight for **install-level** absence — the condition §147 assumed. It is not airtight for the
condition this block now owns: "installed and compatible, but the contract is not in this session"
is a context-loading property, and a core agent is exposed to it exactly as a department agent is.

Not blocking, and deliberately not fixed here: no core-only install exists in the world yet
(`COMMITTED_PACKS` still `[]`, no `packs/` tree, marketplace still one entry, monolith still
authoritative), and covering core would need a **second** canonical block with its own pin and rules
— a core agent carries no preflight, so this block's first sentence would be false there. That is a
new file and a scope decision, which belongs to the steward at triage, not to a reviewer's diff.
**Reopen when a core-only install first becomes real:** `pack-split-generated-pack-trees`, or at the
latest `pack-split-first-department`. Routed to `principal-product-manager` as a proposal.

### E1 — escalation, steward's call, not architecture's

`northstar.md` (`dependency-guarantees`) reads *"…shipped in **every pack**"*; the implementation
ships it in every **department** pack (4 of 5), correctly. This item's own acceptance says "every
generated **pack agent**" and is met exactly. Whether the milestone line reads as satisfied or should
be amended to "every department pack" is milestone-acceptance interpretation —
**`principal-product-manager`'s**. It does not block this ratification and architecture does not
self-clear it.

### For `principal-security`, at this same ref

- **N1 — `P2-S1` now covers two guarantees, not one.** The generated-agent pin is gated on
  `/^kai-[a-z]+\/agents\/.+\.agent\.md$/` (`validate-plugin.mjs:443`); a future pack key outside
  `[a-z]+` would silently escape the preflight pin **and** the refusal pin together. No such key
  exists today (`core`, `engineering`, `product`, `gtm`, `personal`). Blast-radius update to your
  existing, already-routed observation — not a new finding.
- **The trust boundary itself** — whether a refusal whose trigger is *model-evaluated* ("if its
  shared contracts are still not loaded") is adequate where the preflight's trigger is
  probe-evaluated — is a control-acceptance question, and it is yours. Architecture's read, offered
  as input: the mechanical pin is on **presence, position, count and text**, never on **firing**;
  and a misfire is directionally safe (a false refusal costs availability, not integrity).

### N2 — for the ship gate: which command is the evidence

`pack-preview --check` returns `{ ok: true }` early while `COMMITTED_PACKS` is empty and `packs/` is
absent (`pack-preview.mjs:281–283`) — it is **vacuous** for this item. The CI enforcement here rides
on `node scripts/validate-plugin.mjs` (which materialises the tree and pins over real generator
output) and `pack-preview --self-test`. "`--check` passed" is true and must not be read as evidence
that the blocks are injected or pinned.

### N3 — recorded, not routed (no work created)

`injectPreflight` survives as an exported single-block helper whose only remaining caller is one
self-test arm (`pack-preview.mjs:350`). Inert today — every production path goes through
`guaranteeBlocks`/`injectBlocks` — but it is an exported affordance for producing an agent carrying
the preflight and not the refusal. A note for whoever next edits `pack-plan.mjs`.

### Also confirmed on this ref (read-only, non-duplicative)

`0.61.0` coherent across all six version locations (`plugin.json`, `package.json`, `package-lock.json`
×2, `marketplace.json` `metadata.version` + the `kai` entry) with the README `## Status` stamp at
`v0.61.0` / 56 agents / 51 skills and a dated `## [0.61.0] - 2026-08-25` section with its compare
link; marketplace still **exactly one** plugin at `source: "."`; **no `packs/` tree**;
`COMMITTED_PACKS` still `[]`; `.github/workflows/validate.yml` genuinely unchanged and already
running `validate-plugin`, `--self-test` and `--check`, so "no new CI step" is true; the CHANGELOG
entry claims the boundary this review just ratified and does not over-claim firing. The pre-existing
`node-version: '20'` vs `engines` mismatch infra recorded is confirmed pre-existing and stays
un-routed here.

## Review — independent security, 2026-08-25-1540 (`principal-security`)

**Verdict: CLEAR.** Bound to `change_ref 8d3ef4844988f4974e6bec8f406a7723dee4e942` — the same
unchanged ref the architecture review ratified. `completed_reviews` now carries
`principal-security` / `independent-security` / `clear` at this exact ref, so **both**
`review_requirements` are satisfied **for this ref only**; if the ref moves, both entries stop
counting and both reviews re-bind together. Full assessment:
`kai/initiatives/pack-split/artifacts/security/pack-split-degraded-refusal.md`.

**P0: 0 — P1: 0 — P2: 4.** None blocks this item, none requires a change at this ref, and **no
residual risk is accepted by this review** — recording a risk is not accepting it, and no acceptance
is needed because no control is waived and nothing at this ref reaches an installed agent
(`COMMITTED_PACKS` `[]`, no `packs/` tree, marketplace still one entry).

**Evidence basis.** Read through the worktree at `C:\src\kai`. This run had **no shell**: nothing was
executed, no active check was run, no network call was made. The operator's green `npm test` (exit
0), `--check`, and the five preview trees are **input, never verdict** — and `--check` is *vacuous*
for this item (architecture's N2, confirmed independently at `pack-preview.mjs:281-283`), so no part
of this verdict rests on it. The ref object `8d3ef484…` was confirmed present in `.git/objects/8d/`
(**existence only**, not decoded); `HEAD` is on `kai/feat/29-degraded-refusal` at `e679de9d…` with no
commit on the branch, so the ref is unreachable — consistent with the `git stash create` object this
initiative has used three times before. **If the worktree is not byte-identical to that object, this
review does not bind.** No acceptance criterion was ticked (owner's and the DoD gate's job), and no
implementation or release file was edited.

### The boundary held: what was verified in code, not accepted from the handoff

The refusal **cannot fail unsafe**, and that is mechanically supported: it orders after the preflight
with both adjacency bounds pinned over real generator output (`validate-plugin.mjs:455-482`); it may
carry neither `KAI-CORE-MISSING` nor a `` `contract:` `` literal (`pack-plan.mjs:360-371`), so it
cannot emit a false compatibility verdict; every instruction it contains is a refusal or a
prohibition except the one install remedy, so a misfire **narrows** the agent; and it grants no
capability and touches no credential, endpoint, or data path. Order is stated once and spliced once
(`:280-296`), injection and expectation use **independent keys** (`p.kind` vs the `kai-core/` prefix),
the preflight copy-count is checked **first** so a refusal-only agent fails by name, and a softened
refusal inside a generated tree is caught on that exact file.

### The trust boundary, answered honestly (architecture routed this to me)

The two triggers are not the same kind of thing: the preflight's input is an **observable artifact**;
the refusal's is **self-report**, and no marker for "the contracts are loaded" can exist at this
layer. So effectiveness is **unknown and unmeasured, not high**. The dominant miss is a false
negative — the agent's body still *names* the contracts on its `**Inherits:**` line, so a model may
conclude it holds them — and that miss lands exactly where the operator stands today with no block at
all. **The change cannot make that state worse.** False positives cost availability *and audit
trail* (a degraded agent declines to record durable state), so "directionally safe" is right but not
free. Injection-triggered degradation (untrusted in-context text asserting the condition) is an
availability vector, not an escalation: the block only subtracts.

**Truth-binding, extending `P2-S2`:** no record, changelog entry, release note, or ship record may
claim pack agents *refuse*, *degrade gracefully*, or *detect* contract loss. The evidenced claim is
that every generated department agent **carries a pinned, correctly ordered refusal instruction**
that cannot drift from core. The CHANGELOG at this ref respects that.

### Findings (all P2, all non-blocking, none creating work)

- **P2-D1 — the exactness of the `KAI-CORE-MISSING` reply is now a two-block model judgement.** In
  the core-absent state the agent reads a second block that ends "Tell the operator to install
  `kai-core`" — prose it must decide *not* to emit where the preflight allows only the token. It
  cannot emit a *false* token (forbidden by the rules) and it is conditioned on a passing preflight,
  so the failure shape is noisy-but-correct, not fail-open. **Concrete evidence owed downstream:**
  `pack-split-host-gates` should assert that an agent carrying **both** blocks replies with exactly
  the token and nothing else in **both** the `--no-core` and `--contract 2` builds. Owner
  `principal-swe-infra` + `@operator`; filing is the steward's.
- **P2-D2 — the refusal's prohibition set is narrower than the preflight's.** It does not explicitly
  name product-code edits, command execution, or tool calls (only "reply once from what the request
  itself carries, then stop"). **Coverage gap, not a regression** — the counterfactual is no block at
  all. Smallest fix if ever taken: one extra `Do not …` bullet (~90 chars against ~360 of remaining
  budget). **Not requested**: it moves a byte-pinned, ratified file and re-binds both reviews for a
  residual with no exploit path.
- **P2-D3 — the only permitted remedy is install-shaped** for a condition that is at least as often a
  context-loading failure. The install/restart distinction is preserved in the **token** but not in
  the **remedy**; impact is recovery guidance (misdiagnosis window), not exploitability. Should ride
  the item that next legitimately reopens the block.
- **P2-D4 — A1 confirmed: no current exploitable integrity path**, so it is correctly deferred —
  nothing is installed, so no agent is exposed. **One input for the steward's triage that
  architecture did not have to weigh:** core is not a low-value remainder — it holds
  `director-chief-of-staff` (the lease grantor, which writes items, leases and the board) and
  `workflow-workspace-init`. When a core-only install becomes real the uncovered blast radius is
  **larger per agent** than in a department pack. Reopen trigger unchanged
  (`pack-split-generated-pack-trees`, at the latest `pack-split-first-department`).
- **Carried, not re-filed — `P2-S1` (architecture's N1) confirmed:** `validate-plugin.mjs:443` gates
  both guarantees on `/^kai-[a-z]+\/agents\/.+\.agent\.md$/`; all five keys match today. Same P2,
  wider blast radius, same owner and same smallest fix.

**Residuals recorded, none accepted here:** R4 (model-evaluated trigger, unmeasured), R5 ("restates
no rule" is a *shape* check — the opener rule is a prefix test and the opening paragraph is not
opener-checked; **no marginal privilege**, since anyone who can edit that file already controls every
agent body), R6 (injection-triggered degradation), plus R1-R3 unchanged from `preflight-compat`. All
are the operator's **at pack publication**, not now.

**Not a security finding, routed for accuracy:** the CHANGELOG headline says "every generated **pack**
agent" while the body correctly states the department-only scope and the core exclusion — the same
wording question as architecture's **E1**, and `principal-product-manager`'s call.

**Next:** `workflow-ship`. Both required reviews are satisfied at this ref; a DoD bounce on the
unticked local-command and CI-green criteria is the correct mechanical outcome, not a security
objection. Milestone `dependency-guarantees` stays at **3 of 5** required items `shipped`.

### What this ratification does and does not do

- **Does:** satisfy `independent-architecture` at this exact ref.
- **Does not:** make this item `complete`, `release-ready` or `shipped`; clear
  `principal-security`; tick any acceptance criterion — the CI-green-on-the-pushed-PR criterion in
  particular can only be evidenced by a workflow run; or move milestone `dependency-guarantees`,
  which stays at **3 of 5** required items `shipped`. Downstream is unmoved:
  `pack-split-ci-partition-checks` still overlaps this item on `scripts/lib/pack-plan.mjs`,
  `scripts/validate-plugin.mjs` and `scripts/pack-preview.mjs`, so its touch-conflict check at
  dispatch still applies.
- **Clock note:** this run's local clock reads **15:16**, earlier than the `1525` dispatch handoff it
  answers. Stamped as read rather than adjusted forward — a clock discrepancy, not a review that
  predates its dispatch.

## Notes

- Follows `pack-split-preflight-compat` because it shares the generator injection path and the same
  generated agent bodies (touch overlap) — sequenced, not raced.
- Distinct from the preflight's one-line refusal *token*: this is the fuller shipped block the failed
  preflight points to. Mirrors the `inherits-block.txt` canonical-file + CI-pin + generator-copy pattern.

### Steward promotion — 2026-08-25-1148 (`principal-product-manager`)

**`proposed -> ready`, priority 20 -> 40, `next_role: principal-swe-infra`, version 1 -> 2.**

- **Promoted with its dependency unmet, deliberately.** `ready` is a **steward commitment**
  (fits scope, acceptance defined, `depends_on` declared) — it does **not** require the
  dependency to have resolved. This item's sole `depends_on` entry
  (`pack-split-preflight-compat`, `requires: shipped`) is **not** satisfied: that item is
  `ready` at priority 10 and has not been dispatched. **This item is therefore NOT
  dispatchable.** *Executable* is the director's derived predicate at dispatch time, never
  stored here; the dependency check must fail until `preflight-compat` reaches `shipped`.
- **Dependency type preserved exactly.** Still `requires: shipped` on `preflight-compat` — not
  weakened to `in-review` or `release-ready` to make it move sooner. The two share the same
  generated-agent-body injection surface (`materializePacks`) and both byte-pin from
  `scripts/validate-plugin.mjs`, so they are sequenced, not raced (decomposition WS#5).
- **Priority 40 — behind every currently dispatchable item.** Queue order is honest about
  reachability: `preflight-compat` (10), `crosspack-validator` (20), `host-semantics-spike`
  (30) are dependency-satisfied today; this is not. It ranks ahead of
  `pack-split-ci-partition-checks` (50) because that capstone waits on **two** upstreams.
- **Fits `scope.current`.** Milestone `dependency-guarantees`, `required_for_milestone: true`;
  1 of the 4 required items still outstanding. No milestone semantics changed.
- **Directly serves a non-negotiable.** "The degraded-mode block is a refusal, not a fallback
  contract; it restates no core rules, so it cannot drift." The drift-proof criterion is the
  whole point of the item and was not softened.
- **Touch-set reconciled to the shipped foundation.** `scripts/lib/pack-plan.mjs` added: after
  `generator-gates`, the authoritative materialization lives there and its header explicitly
  defers **degraded-mode** guarantee-block injection to a downstream item — this one. A claim,
  not proof; reconcile the actual changed-path set on handback.
- **Both reviews still required at the same `change_ref`**: `principal-swe-architect` /
  `independent-architecture` (refusal-not-fallback) **and** `principal-security` /
  `independent-security`. Neither is waivable here.
- **Unchanged, deliberately:** outcome, milestone, `required_for_milestone`, `delivery_class`,
  `owner: null`, review requirements, the `requires: shipped` dependency, and the `0.x`
  versioning rule. No architecture decision was made or re-opened; ratified WS#5 stands as
  written.

## Ship gate — 2026-08-25-1554 (`workflow-ship`, PREPARE)

**Verdict: RELEASE-READY. Not deploying, not shipped.** Item **v8 -> v9**,
`in-review -> release-ready`, `resume_state: null`, lease `null`,
`next_role: principal-security -> "@operator"`. Full record, with the deploy, abort, rollback and
production-verification steps:
`kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal/ship-record.md`
(promoted to its canonical path before merge).

**All six DoD dimensions Clear; none waived.** 1 scope-true, 2 verified, 3 reviewed,
4 shippable-safely (proportional), 5 documented, 6 coordination-closed.

**What closed since the security review.** Exactly one thing, and only CI could close it.
`principal-security` correctly predicted a DoD bounce on the unticked local-command and
CI-green criteria — true when written, because no commit and no PR existed. The operator has
since committed **`75053e08551e6865df501e85d25888b19693af72`**, pushed
`kai/feat/29-degraded-refusal` and opened **PR #158** (open, `mergeable_state: clean`, 1 commit,
+2152/-100 across 17 files, base `e679de9d…` = current local `main`), and check run `contract`
**`97997128517`** (run **`32908330221`**) completed **`conclusion: success`** in **12s** on that
exact head — `total_count: 1`, so no second red check hides behind it. **Read here from
`api.github.com`, not accepted on report.**

**`change_ref` deliberately unchanged** at `8d3ef4844988f4974e6bec8f406a7723dee4e942` — both
reviews bind that object, and `change_ref` moves only when the implementation changes. The
operator attests every implementation and release file at PR head is byte-identical to it; that
attestation is **not fully re-derivable here** (no shell — the stash object cannot be decoded),
so it is converted into **deploy step 1**, a `git diff --exit-code` that fails closed and voids
both bindings if it is ever untrue. Partial corroboration obtained:
`scripts/lib/degraded-block.txt` read at the PR head is identical to the worktree copy both
reviews were read from.

**Truth constraints honoured.** Per the security review's extended `P2-S2`, this record and the
release note claim **carriage, order, count and text** — every generated department agent
**carries a pinned, correctly ordered refusal instruction that cannot drift from core** — and
never that an agent *refuses*, *detects* contract loss, or *degrades gracefully*; the trigger is
model-evaluated self-report and its effectiveness is unmeasured. `pack-preview --check` is
recorded as passing and **explicitly not counted** as evidence of injection or pinning
(vacuous while `COMMITTED_PACKS` is `[]` — `pack-preview.mjs:281-283`).

**Nothing dropped.** Six PROPOSALs parked in `kai/initiatives/pack-split/backlog.md` at this
gate — **A1** (core-only coverage) and **E1** (northstar "every pack" wording) to
`principal-product-manager`; the **§147 errata** as a rider; **P2-D1** to `pack-split-host-gates`;
**P2-D2** and **P2-D3** to `principal-swe-infra` — plus **P2-S1/N1 + N3** recorded as a
blast-radius update on the pin-pattern proposal already parked there, rather than duplicated. No
item was created — filing is the steward's.

**Downstream unmoved.** Milestone `dependency-guarantees` stays at **3 of 5** required items
`shipped` — `release-ready` is not `shipped`. `pack-split-generated-pack-trees` requires this
item at `shipped` and is not cleared; `pack-split-ci-partition-checks` still overlaps it on
`scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs` and `scripts/pack-preview.mjs`, so
its touch-conflict check at dispatch applies harder, not less.

**This gate merged nothing, tagged nothing, released nothing, published nothing and deployed
nothing**, and edited no implementation or release file. Deployment is the operator's; return the
evidence for CONFIRM-START and CONFIRM-COMPLETE.

## Ship confirm — CONFIRM-START + CONFIRM-COMPLETE, 2026-08-25-1612 (`workflow-ship`)

- **Verdict: `SHIPPED`.** Workflow lease self-granted at version 9 (token
  `wsh-2026-08-25-1612-dgr-confirm`, `version_at_grant: 9`), every required lifecycle state
  walked, then cleared. **`release-ready` -> `deploying` (v10) -> `production-verification`
  (v11) -> `shipped` (v12)**; `resume_state` stays `null`. No state was skipped and `shipped`
  was **not** reached directly from `release-ready`. `next_role: "@operator" -> null`.
- **kai merged, tagged, released and published nothing — at any phase.** The operator executed
  every one of those actions and supplied the evidence; this run recorded it and re-derived the
  production facts read-only. No implementation file, release-metadata file, tag or release was
  created or modified here. **No rollback was invoked**, so the recorded abort/rollback path was
  never entered and this item was never returned to `release-ready`.
- **`change_ref` deliberately unchanged** at `8d3ef4844988f4974e6bec8f406a7723dee4e942` — the
  object both required reviews bind. Deployment moves an item's *state*, not its reviewed
  implementation ref; the merge commit is recorded below as deployment evidence instead.

**Deployment start (operator-supplied, CONFIRM-START).** PR #158 squash-merged
2026-08-25T23:12:06Z (signature `verified_at` 23:12:07Z) into merge commit
**`680ca445a2616bc9bc1b972db6b40042c06abf6c`** on `main` — single parent
`e679de9d41187614e9765e00ec3e20dafff9ec0c` (the exact PREPARE base, so no rebase happened),
`verification.verified: true`, message `feat: add degraded-mode refusal (#158)` carrying both the
implementation commit and the `docs: record degraded refusal ship gate` records commit;
environment `main` + GitHub Releases; version `0.60.0 -> 0.61.0`. The `main` `validate` run
started 2026-08-25T23:12:10Z — <https://github.com/RubenSaucedo/kai/actions/runs/32909692506>.

**Deployment completion (CONFIRM-COMPLETE).** Run `32909692506` reports `status: completed`,
**`conclusion: success`**, `event: push`, `head_branch: main`, `run_attempt: 1`, `head_sha`
exactly `680ca445a2616bc9bc1b972db6b40042c06abf6c`, 23:12:10Z -> 23:12:29Z; job `contract`
**`98001208870`** on `ubuntu-latest` `success`, 23:12:12Z -> 23:12:28Z (**16s**). **Read from
`api.github.com` by this run — a run URL without a successful conclusion would not have been
accepted as completion.**

**Production verification — 8 of 8 PASS, every check re-derived read-only against the merge
commit itself** (git commit/tree/tag APIs, the Actions API and `raw.githubusercontent.com` at
`680ca445…`), deliberately **not** the local worktree, so a dirty checkout could not have
produced a false pass.

| # | Check | Result | How verified |
|---|-------|--------|--------------|
| 1 | Deployment start | **PASS (re-derived)** | Merge commit `680ca445…`, parent `e679de9d…`, 23:12:06Z, signature valid; `main` run `32909692506` `run_started_at` 23:12:10Z. Corroborated locally: `.git/refs/heads/main` = `680ca445…`. |
| 2 | Deployment completion — the pins actually ran in production | **PASS (re-derived)** | Run `32909692506` `conclusion: success` at the merge `head_sha`; job `contract` `98001208870`, **10 substantive steps all `success`**, including step 4 **`Validate plugin contract`** (the byte-pin over real generator output) and step 8 **`Pack generator self-test`** (the mutation and on-disk arms). Step 11 `Release-guard (--base --head)` is `skipped`, correct on a `push` event — it is the `pull_request`-only gate and it ran green on the PR. Neither load-bearing step was skipped. `check-runs` on the merge SHA: `total_count: 1`, so no second red check hides behind it. |
| 3 | Version coherence `0.61.0` on `main` | **PASS (re-derived)** | At the merge commit: `plugin.json` `0.61.0`; `package.json` `0.61.0`; `package-lock.json` **both** root `version` and `packages[""].version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` = `v0.61.0` — **56 agents and 51 skills**; `CHANGELOG.md` `## [0.61.0] - 2026-08-25` with its `[0.61.0]: …/compare/v0.60.0...v0.61.0` link. The link is **not dangling** — tag `v0.60.0` (`d5cd9590…`) exists and peels to `32a07a9a…`. Eight of eight locations. |
| 4 | Marketplace still exactly one entry | **PASS (re-derived)** | `.github/plugin/marketplace.json` at the merge commit: `plugins[]` length **1**, `name: kai`, `source: "."`. No pack entries; the monolith remains authoritative. |
| 5 | `COMMITTED_PACKS` empty **and** no `packs/` tree | **PASS (re-derived, proven positively)** | `scripts/lib/pack-plan.mjs` at the merge commit still reads `export const COMMITTED_PACKS = [];`. Absence of `packs/` is not inferred from a local glob: the merge commit's root tree (`d4f95819…`, `"truncated": false`) lists `package-lock.json`, `package.json`, `plugin.json`, `scripts`, `skills`, `test` — `packs` sorts between `package.json` and `plugin.json` in git's byte ordering and **is absent**. The committed-unpublished non-negotiable holds **in production**. |
| 6 | The canonical block shipped, and the pin ran over it | **PASS (re-derived)** | `scripts/lib/degraded-block.txt` read at the merge commit via `raw.githubusercontent.com` — present and identical to the copy both reviews were read from (one heading, the trigger-boundary paragraph, five bullets: one `Refuse …`, three `Do not …`, one `Tell the operator to install \`kai-core\``; no `KAI-CORE-MISSING`, no contract-version literal). The pin itself is re-asserted by check 2's green `Validate plugin contract` and `Pack generator self-test` steps. |
| 7 | Tag and release point at the merge | **PASS (re-derived)** | `refs/tags/v0.61.0` -> annotated **tag object** `e88857db3bc81a64f7edee966cf409ca4319d126`, tagged 23:12:33Z, peeled via the git-tags API to commit `680ca445…` — **the merge commit**. Release `376770741`, `draft: false`, `prerelease: false`, `target_commitish: main`, published 23:12:37Z. |
| 8 | No agent or skill body changed on `main` | **PASS (re-derived, by tree identity)** | Between base `e679de9d…` and the merge commit the `agents` subtree (`c0284f31…`) and the `skills` subtree (`2a4a7abc…`) are **byte-identical**, as are `docs`, `examples`, `test`, `.kai`, `hooks.json` and `AGENTS.md`. Only `.github`, `CHANGELOG.md`, `README.md`, `kai`, `package-lock.json`, `package.json`, `plugin.json` and `scripts` moved. **`.github/workflows` is byte-identical (`2fb1467c…`)** — `validate.yml` was declared in `touches` and genuinely not changed, so "no new CI step" is true in production; only `.github/plugin` moved. Not one shipped body was edited. |

**Release-note language checked by reading the published body, not by report.** The `v0.61.0`
release claims carriage and CI enforcement only — "Every generated department-agent body now
carries a canonical, byte-pinned degraded-mode refusal instruction after the core compatibility
preflight" and "Added CI validation for exact copy count, ordering, adjacency, core exclusion, and
absence of duplicated operating rules" — and states the limits outright under **Unchanged**: "The
trigger remains a model-evaluated instruction; this release does not claim measured refusal or
graceful degradation" and "No generated pack tree is committed or published, and the marketplace
still exposes only the monolithic `kai` plugin." It says **department** agent, never "every pack";
it makes **no** claim of model obedience, detection or graceful degradation; and it does not imply
the split is done. Compliant with the security review's extended `P2-S2` truth-binding and with
deploy step 6.

**What is proven, stated at the same width as the evidence.** Production evidence establishes
**carriage, order, count and text**: the canonical block is on `main`, byte-identical to the
reviewed copy, and the gates that pin it into every generated department agent — exactly one copy,
immediately after the preflight, zero copies in core, restating no rule — ran green on the merge
commit. It does **not** establish that any agent *refuses*, *detects* contract loss, or *degrades
gracefully*: that trigger is model-evaluated self-report and remains **unmeasured**. `pack-preview
--check` remains **vacuous** for this item and is not counted.

**Environment limits, stated rather than absorbed.** This run had **no shell** (read / search /
fetch / edit only), so nothing was executed: every production fact above is a *read* of the merge
commit, the Actions API, the git object APIs or the published release. The two claims that were
operator-attested at PREPARE — byte-identity between `8d3ef484…` and the PR head, and the local
suite — are now **subsumed by production evidence**: the merge tree changed only the declared
paths, `agents/` and `skills/` are provably untouched, and the identical gates ran green on `main`.
The `git diff --exit-code` of deploy step 1 remains the operator's fail-closed check and its exit
status is operator-attested, not re-derived here.

**Downstream, cleared strictly by the DAG.** Milestone `dependency-guarantees` moves to
**4 of 5 required items `shipped`** — still **OPEN**; only `pack-split-ci-partition-checks`
remains. `pack-split-generated-pack-trees` goes from **3 of 6** to **4 of 6** dependencies met and
stays `proposed`, in `first-pack-extracted`, outside `scope.current` — the one-way valve stays
shut. `pack-split-ci-partition-checks` was already dependency-satisfied and dispatchable; nothing
here changed that, but its overlap with this item on `scripts/lib/pack-plan.mjs`,
`scripts/validate-plugin.mjs` and `scripts/pack-preview.mjs` is now **landed on `main`**, so its
touch-conflict check at dispatch applies harder, not less, and it must read this diff rather than
the pre-`0.61.0` files. **No dependent item record was edited** — a reconciliation NOTE was
appended to the affected thread instead. **No follow-up is owed on the record itself:** the ship
record was promoted to its canonical library path in the same records commit as the merge, so the
post-ship `git mv` the `0.58.0` record needed is not repeated here.

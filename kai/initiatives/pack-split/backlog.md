# pack-split — backlog

Initiative-scoped deferred proposals. An expansion discovered inside pack-split
lands here (not in `kai/coordination/backlog.md`, which is for unaffiliated
proposals). The steward grooms this list. See `kai-core-initiative-stewardship`.

**Nine proposals parked, none scheduled.** Six arrived at the
`pack-split-degraded-refusal` DoD gate (2026-08-25-1554), which also recorded a
seventh finding as a **blast-radius update** on an existing proposal rather than
duplicating it.

## Candidates noted at intake (not yet accepted)

These came out of the proposal's open questions and plan; they are recorded so
they are not lost. None is scheduled — the steward decides if and when any
becomes an item.

- Certify collision and roster-enumeration behaviour on macOS and the cloud host
  (all evidence to date is Windows CLI).
- Add a dispatch-probe that fails observably, stronger than the model reading its
  own roster (noted open in the proposal).
- Split versioning into per-pack semver plus a separate core contract version,
  once lockstep is no longer needed.
- Decide the permanent home of the 9 currently-unplaceable core skills beyond the
  `partition-lock` disposition (`demo-*`, `fleet-observation`,
  `onboard-to-codebase`, three `review-*`).
- Phase 0 metadata trimming as an independent, ship-on-`0.x` win (budget agent
  descriptions to ~250 chars, skills to ~180), re-measured so prose savings are
  not credited to the split.

## Grooming — 2026-08-24 (steward)

Reviewed all five candidates above against `scope.current` (`partition-lock`).
None fits the current milestone, so **all stay parked** — none is promoted:

- macOS / cloud-host certification and the observable dispatch-probe are already
  captured downstream as `pack-split-host-gates` under `first-pack-extracted`;
  revisit if the host-gate item needs them split out.
- Per-pack semver, the permanent orphan-skill home beyond the `partition-lock`
  disposition, and Phase 0 metadata trimming remain out of `partition-lock`
  scope. Phase 0 may be promoted independently on `0.x` if the steward chooses
  to bank the token win early; not scheduled now.

The one-way valve stays closed until a candidate fits `scope.current`.

## Parked proposals

### PROPOSAL — zero-skill pack generates a manifest pointing at a missing `skills/`

Parked by `principal-product-manager` (steward) 2026-08-24-2240, from architect finding **A6** in
the `pack-split-generator-gates` `independent-architecture` review (ratified 2026-08-24-2231 at
`change_ref 457254b973fb58b129332ffaa609fb5febfdd412`). Non-blocking; **not** fixed in that PR.

```
PROPOSAL
  problem:          `planManifests` in scripts/lib/pack-plan.mjs always sets
                    `manifest.skills = 'skills'`, but `materializePacks` only creates a
                    `skills/` directory when the pack owns >= 1 skill. A pack owning zero
                    skills would therefore generate a tree that fails validate's
                    `"skills" path ... does not exist` check.
  proposed_change:  Make the manifest's `skills` key conditional on the pack actually owning
                    at least one skill (or always emit the directory, even when empty).
  friction_cost:    A defensive branch plus a self-test arm for a state no pack can reach,
                    in the single machine-readable partition source that three downstream
                    guarantee items depend on. Adds surface to the most load-bearing file
                    in the initiative to guard a case the locked partition forbids.
  mission_tradeoff: Unreachable under the current thin core. All five locked departments own
                    >= 1 skill (23/15/3/2/7 = 50, ratified in the partition lock), and the
                    northstar's out_of_scope explicitly forbids "adding packs beyond the
                    agreed five once the partition is locked". Fixing it now spends
                    complexity on a scenario the non-negotiables rule out; it fails loudly
                    at generate time rather than shipping a silent defect, so deferring is
                    safe.
  scope_target:     Whichever milestone first proposes a sixth pack or a department that
                    owns zero skills; otherwise it never becomes work.
```

**What would change my mind (trigger to promote):** a sixth pack is proposed, the partition is
re-opened, or any re-partition leaves a department owning zero skills. Any of those makes this
reachable and it becomes a one-line fix in `pack-split-generated-pack-trees` or the then-current
generator item. Until then it stays parked — recorded so it is owned rather than remembered.

### PROPOSAL — the generated-agent preflight pin is gated on a pack-name pattern a future pack could fall outside

Parked by `workflow-ship` at the 2026-08-25-1310 DoD gate for
`pack-split-preflight-compat`, from **security finding P2-S1** in the
`independent-security` review (CLEAR 2026-08-25-1257 at `change_ref
3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`). Non-blocking — it did **not** gate the
release, and it is **not** fixed in PR #154. Recorded here because the security review
deliberately created no item ("filing is the steward's call") and a finding that ships
unowned is a finding that gets lost.

```
PROPOSAL
  problem:          scripts/validate-plugin.mjs:404 selects generated bodies with
                    /^kai-[a-z]+\/agents\/.+\.agent\.md$/. All five current pack keys are
                    [a-z]+, so coverage today is complete — but a future key with a hyphen
                    or a digit (e.g. kai-customer-success) would not match, and that pack's
                    agents would silently skip the copy-count, position and adjacency
                    assertions that make the preflight guarantee real.
  proposed_change:  Widen to `kai-[a-z-]+`, or better, derive the expected key set from
                    PACK_ORDER / planManifests in scripts/lib/pack-plan.mjs so the pin
                    cannot drift from the partition it is pinning.
  friction_cost:    Small — one pattern or one derivation in a file the owning item already
                    touches. The cost of doing it *here* would have been re-opening a
                    twice-reviewed, twice-bounced trust-boundary file at the ship gate for
                    a case no shipped pack can reach.
  mission_tradeoff: This is a pin-COVERAGE gap, not a live fail-open: materializePacks still
                    injects on kind !== 'core', so a hyphenated pack's agents would still
                    carry the block — what is lost is verification, which only bites
                    alongside a second defect. The northstar's out_of_scope forbids adding
                    packs beyond the agreed five while the partition is locked, so the
                    trigger cannot fire without a partition change.
  scope_target:     pack-split-ci-partition-checks (dependency-guarantees) — it already owns
                    partition/namespace work, already touches scripts/validate-plugin.mjs,
                    and already depends on this item at `shipped`.
  owner:            principal-swe-infra
```

**What would change my mind (trigger to promote):** a sixth pack, any pack key that is not
`[a-z]+`, or the partition being re-opened for renaming (note `pack-split-ci-partition-checks`
already carries the `fleet-observation -> kai-core-fleet-observation` rename, so a key-shape
change is closer than it looks). Until then it rides into `ci-partition-checks` as a two-line
hardening, not as its own item.

**Blast-radius update — 2026-08-25-1554 (`workflow-ship`, `pack-split-degraded-refusal` DoD
gate).** Same finding, wider consequence, same owner and same smallest fix — **not re-filed as a
second proposal**. That pattern now lives at `scripts/validate-plugin.mjs:443` and gates **two**
guarantees rather than one: a future pack key outside `[a-z]+` would silently escape the preflight
pin **and** the degraded-refusal pin **together**. Confirmed independently by architecture (**N1**)
and security (**P2-S1**, carried not re-filed) at `change_ref 8d3ef484…`; all five current keys
(`core`, `engineering`, `product`, `gtm`, `personal`) still match, so nothing is uncovered today.
**Riding with it — architect note N3, recorded not routed:** `injectPreflight` survives in
`scripts/lib/pack-plan.mjs` as an exported *single-block* helper whose only remaining caller is one
self-test arm. Inert today (every production path goes through `guaranteeBlocks`/`injectBlocks`),
but it is an exported affordance for producing an agent that carries the preflight and **not** the
refusal. Whoever takes the pattern fix should decide whether that export still earns its keep.

### PROPOSAL — cross-department agent-referral degradation is unspecified

Parked by `workflow-ship` at the 2026-08-25-1435 DoD gate for
`pack-split-crosspack-validator`, from the escalation in the `independent-architecture`
review (RATIFIED 2026-08-25-1428 at `change_ref cb5fd0290f1a8b7478b54e98bf24f1968aa58f09`).
The architect routed it to `principal-product-manager` **for triage** and deliberately did not
create an item, a dependency or an acceptance criterion; it is recorded here because a finding
that ships unowned is a finding that gets lost. It did **not** gate the `0.60.0` release and is
**not** fixed in PR #156.

```
PROPOSAL
  problem:          Ratifying design call 3 permits cross-department *agent* referrals while
                    cross-department *skill* references fail — correct, because partition-lock
                    §7.2 binds providers (what an agent *inherits*), not referrals. But that
                    leaves 12+ live referrals (principal-swe-manager -> principal-product-manager,
                    creative-video-director -> principal-product-marketing, and others) surviving
                    the split with NO defined behaviour when the sibling department pack is not
                    installed. WS#5 pack-split-degraded-refusal covers a missing *core*, not a
                    missing *department*, so nothing in the committed plan says what the operator
                    should see.
  proposed_change:  Decide the product behaviour for a referral to an uninstalled department:
                    degrade silently, name the missing pack, or name it and suggest installing
                    it. Then route the decision to whichever item owns generated agent bodies.
  friction_cost:    Any option beyond "silent" adds a new surface to generated bodies and a new
                    string to keep truthful across five packs — and it is a surface no committed
                    item owns today, so it would also need an owner and a milestone.
  mission_tradeoff: This is an operator-experience call, not an architecture call: the reference
                    model is already correct and fails closed for skills. Deferring costs nothing
                    today (the monolith is still authoritative and every role is present), and it
                    is not reachable until at least two packs are actually installable
                    separately — which is `first-pack-extracted`, outside `scope.current`.
                    Deciding it now would spend product judgment on a shape the extraction may
                    change.
  scope_target:     first-pack-extracted (or earlier, if the steward wants the answer before
                    pack-split-generated-pack-trees emits agent bodies).
  owner:            principal-product-manager (triage), then whichever item owns generated bodies
```

**What would change my mind (trigger to promote):** `pack-split-generated-pack-trees` reaching
implementation (it emits the agent bodies where any such text would live), a second pack becoming
independently installable, or a user hitting an unresolved referral in a preview. Until one of
those, it is a product question with no reachable user — recorded, owned, and not scheduled.

## Parked at the 2026-08-25-1554 DoD gate — `pack-split-degraded-refusal`

Six new proposals below, plus one **blast-radius update** to the already-parked
P2-S1 proposal (recorded there, not duplicated here). All come from the
`independent-architecture` ratification (2026-08-25-1516) and the
`independent-security` CLEAR (2026-08-25-1540), both bound to `change_ref
8d3ef4844988f4974e6bec8f406a7723dee4e942`. **None gated the release** and **none is
fixed in PR #158.** Both reviewers deliberately created no item — filing is the
steward's — so they are recorded here rather than left inside a review section.

### PROPOSAL — core agents carry no degraded-mode coverage, and the exclusion argument no longer fully carries

From architect finding **A1**, corroborated and widened by security **P2-D4**.

```
PROPOSAL
  problem:          Core agents are excluded from the refusal on the argument "a core agent
                    ships inside kai-core, so the absence it refuses is not a state it can
                    be in". That is airtight for INSTALL-level absence — the condition
                    docs/proposals/pack-architecture.md:147 assumed — but not for the
                    condition this block now owns after the shipped preflight re-scoped it:
                    "installed and compatible, but the shared contract is not in this
                    session" is a context-loading property, and a core agent is exposed to
                    it exactly as a department agent is.
  proposed_change:  Decide whether core agents need their own second canonical block, with
                    its own byte-pin and its own no-rule rules. It cannot be the same file:
                    a core agent carries no preflight, so this block's first sentence
                    ("The preflight above proves...") would be false there.
  friction_cost:    A new canonical file, a second pin, a second rule set, and a second
                    refusal budget — a new file and a new capability, i.e. a scope decision,
                    not a reviewer's diff.
  mission_tradeoff: Unreachable today: COMMITTED_PACKS is [], there is no packs/ tree, the
                    marketplace lists one plugin and the monolith is still authoritative, so
                    no core-only install exists in the world to be exposed. But security
                    adds one input architecture did not have to weigh: core is not a
                    low-value remainder — it holds director-chief-of-staff (the lease
                    grantor, which writes items, leases and the board) and
                    workflow-workspace-init, so when a core-only install becomes real the
                    UNCOVERED blast radius is LARGER per agent than in a department pack.
                    Deferring is safe now and gets more expensive the longer it waits.
  scope_target:     pack-split-generated-pack-trees (first committed core tree), or at the
                    latest pack-split-first-department.
  owner:            principal-product-manager (triage), then whichever item owns generated
                    core bodies
```

**What would change my mind (trigger to promote):** a core-only install becoming real —
`pack-split-generated-pack-trees` emitting a committed core tree, or
`pack-split-first-department` making core independently installable. Either makes this
reachable, and the reachable version of it is not a two-line hardening.

### PROPOSAL — the milestone line says "every pack"; the block ships in every *department* pack

From architect escalation **E1**, plus security's accuracy note on the CHANGELOG headline.

```
PROPOSAL
  problem:          northstar.md (dependency-guarantees) reads "The degraded-mode block is a
                    refusal that restates no core rules, shipped in every pack." The
                    implementation ships it in every DEPARTMENT pack — 4 of 5 — by the
                    deliberate and (for install-level absence) correct core exclusion. The
                    ITEM's own acceptance, tightened by the steward at promotion, says
                    "every generated pack agent" and is met exactly. The 0.61.0 CHANGELOG
                    headline has the same shape: it says "every generated pack agent" while
                    the body correctly scopes it to department agents and states the core
                    exclusion.
  proposed_change:  Decide, as milestone-acceptance interpretation: either read the line as
                    satisfied (core is deliberately out of scope for this block) or amend it
                    to "every department pack" — and, if amended, decide whether the
                    CHANGELOG headline is worth a follow-up wording fix or is adequately
                    qualified by its own body.
  friction_cost:    None technical. It is a wording decision on a committed northstar line
                    and possibly one shipped CHANGELOG headline.
  mission_tradeoff: Architecture explicitly refused to self-clear this, and security flagged
                    the same wording independently. Leaving it undecided risks the milestone
                    being declared met against a line that reads wider than what shipped —
                    exactly the kind of quiet over-claim the initiative's non-negotiables
                    exist to prevent.
  scope_target:     dependency-guarantees — before the milestone is declared met.
  owner:            principal-product-manager
```

**What would change my mind (trigger to promote):** it is already reachable — the steward should
settle it before `dependency-guarantees` is declared met, which is 2 required items away. It is
parked rather than promoted only because it blocks nothing today.

### PROPOSAL — one-line errata on `docs/proposals/pack-architecture.md` §147/§157

From the architecture ratification's decided question (b) — recorded so the decision does not
live only in a review section.

```
PROPOSAL
  problem:          docs/proposals/pack-architecture.md:147 still describes the block as
                    shipping "for when the preflight FAILS", and §157 sketches it opening
                    "You are running without kai-core". The architecture review ruled both
                    SUPERSEDED by the shipped preflight, which now answers the core-absent
                    case itself with the exact KAI-CORE-MISSING token and stops. A reader of
                    the proposal alone would reconstruct a block that contradicts two
                    shipped, CI-pinned guarantees.
  proposed_change:  One-line errata on §147 pointing at
                    kai/initiatives/pack-split/artifacts/decisions/pack-split-degraded-refusal.md,
                    and the same on §157's "roughly:"-prefaced sketch.
  friction_cost:    One or two lines. The cost of doing it in PR #158 would have been
                    expanding a ratified diff into a proposal document nobody reviewed for
                    this ref — the architect deliberately kept it out.
  mission_tradeoff: The decision is already durable (decision record + item Review section +
                    this backlog), so nothing is lost by waiting; what is lost by never
                    doing it is a stale proposal misleading a future reader. Explicitly NOT
                    worth an item of its own.
  scope_target:     Whichever item next legitimately edits docs/proposals/pack-architecture.md.
  owner:            principal-swe-infra (as a rider)
```

**What would change my mind (trigger to promote):** nothing should — it should ride, not lead. If
no item touches that proposal before `first-pack-extracted` opens, fold it into that milestone's
documentation pass.

### PROPOSAL — assert the two-block reply exactness on the host gate

From security **P2-D1**. The review named the owner and the destination and left the filing to
the steward.

```
PROPOSAL
  problem:          In the core-absent state a generated department agent now reads TWO
                    blocks: the preflight, which allows exactly KAI-CORE-MISSING and nothing
                    else, and the refusal, which ends "Tell the operator to install
                    kai-core" — prose the agent must decide NOT to emit. It cannot emit a
                    FALSE token (the rules forbid the token in the refusal) and the refusal
                    is conditioned on a PASSING preflight, so the failure shape is
                    noisy-but-correct rather than fail-open. But "noisy-but-correct" is a
                    model judgement, and nothing asserts it.
  proposed_change:  pack-split-host-gates should assert that an agent carrying BOTH blocks
                    replies with exactly the token and nothing else, in BOTH the --no-core
                    and the --contract 2 builds.
  friction_cost:    Two assertions inside a gate that already exists in plan, plus an
                    operator host session to run it — no kai role can run an external host
                    gate.
  mission_tradeoff: This is the only place the two-block interaction can be observed rather
                    than reasoned about. It cannot be closed at build time: the trigger is
                    model-evaluated, so only a live host run produces evidence.
  scope_target:     pack-split-host-gates (first-pack-extracted).
  owner:            principal-swe-infra + @operator
```

**What would change my mind (trigger to promote):** `pack-split-host-gates` being scoped — this
should be written into its acceptance rather than remembered.

### PROPOSAL — the refusal's prohibition set is narrower than the preflight's

From security **P2-D2**. Explicitly **not** requested at this ref.

```
PROPOSAL
  problem:          The refusal does not explicitly name product-code edits, command
                    execution, or tool calls; it says "reply once from what the request
                    itself carries, then stop" plus three coordination-shaped prohibitions.
                    The preflight's prohibition set is wider.
  proposed_change:  One extra "Do not ..." bullet, roughly 90 characters against roughly 360
                    of remaining refusal budget.
  friction_cost:    It moves a byte-pinned, twice-reviewed canonical file, which re-binds
                    BOTH required reviews for the item that carries it. That is the whole
                    reason it was not taken here.
  mission_tradeoff: A coverage gap, NOT a regression: the counterfactual is no block at all,
                    so nothing is made worse. The block only subtracts, so the miss is a
                    narrower refusal, never a broader permission.
  scope_target:     Whichever item next legitimately reopens scripts/lib/degraded-block.txt.
  owner:            principal-swe-infra
```

**What would change my mind (trigger to promote):** the block being reopened for any other
reason (P2-D3 below is the likeliest co-traveller), or a host gate observing an agent acting
rather than replying.

### PROPOSAL — the only permitted remedy is install-shaped

From security **P2-D3**.

```
PROPOSAL
  problem:          The refusal's single remedy is "Tell the operator to install kai-core",
                    but the condition it owns — core installed and compatible, contract not
                    in this session — is at least as often a CONTEXT-LOADING failure, for
                    which "install it" is the wrong advice. The install/restart distinction
                    survives in the preflight's TOKEN but not in this block's REMEDY.
  proposed_change:  Broaden the remedy line so it covers restoring the session context, not
                    only installing the plugin — without adding a second affirmative
                    instruction that would breach the restates-no-rules rules.
  friction_cost:    Same as P2-D2: it moves the byte-pinned canonical file and re-binds both
                    reviews. Wording it without smuggling in a coordination rule is the
                    delicate part.
  mission_tradeoff: Impact is recovery guidance — a misdiagnosis window for the operator —
                    not exploitability. Should ride with P2-D2 if the block is ever reopened,
                    so one re-review covers both.
  scope_target:     Whichever item next legitimately reopens scripts/lib/degraded-block.txt.
  owner:            principal-swe-infra
```

**What would change my mind (trigger to promote):** an operator actually hitting the
misdiagnosis (reinstalling a plugin that was already installed), or the block being reopened for
P2-D2.

# Thread — area-plugins-m2-decomposition

Append-only communication log mirroring
`kai/coordination/items/area-plugins-m2-decomposition.md`. Never edited after the
fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-1915):** no agent in this session has a shell, so
`kai/initiatives/area-plugins/` cannot be created and the canonical
`artifact_target`
(`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-m2-decomposition.md`)
cannot yet be written. That target is recorded and unchanged. Until one operator
`mkdir` runs, **this thread is the durable record of the milestone-2 delivery
plan** — a real canonical coordination path, not a substitute workspace. When
the initiative directory exists, the plan is transcribed from the PLAN packet
below without re-litigation.

---

## PLAN 2026-08-27-1922 — principal-swe-manager

# Engineering Scope — milestone 2, `optional-core-contract`

**Source:** `kai/coordination/items/area-plugins-m2-decomposition.md` (version 2,
`ready`, priority 10), decomposing the accepted design in
`kai/coordination/threads/area-plugins-optional-core-architecture.md`
(DECISION 2026-08-27-1858, scope-accepted 2026-08-27-1906) under
`kai/coordination/threads/area-plugins-scope-brief.md` (BRIEF 2026-08-27-1839 +
STEWARD AMENDMENT 2026-08-27-1906, A1–A4).
**Date:** 2026-08-27 19:22 local
**Run:** principal-swe-manager
**What we're building (one line):** `kai-core` becomes an optional
structured-experience upgrade — the injected fail-closed preflight becomes a
three-way mode selector, and the no-false-claim guarantee re-bases from prompt
refusal onto structural withholding of the claim procedures.

`kai/coordination/ACTIVE.md` still reads "No initiatives are active" and no north
star exists, so no initiative context was loaded. The dispatch packet plus the
three accepted records above are the binding scope.

---

## Posture

The architect's five-PR shape is **confirmed in its ordering logic and revised in
its packing**: floor -> guarantee -> behaviour -> proof -> surface survives
intact, but it emits **seven** implementation items rather than five, plus one
product-copy input. Three changes, each with a stated reason: **D3 lands first**
as its own commit (byte-neutral, smallest diff, and it re-bases provider
assignment on the *name* before PR-2 pins the claim surface *by provider*);
**one piece moves out of PR-3 into PR-2** (the `partial-core` skew arm, which
asserts byte-unchanged degraded behaviour and is green today, so it does not
belong in the one large diff); and **PR-5 splits in two**, because half of it is
a docs pass and the other half is a **Spike** that the "doc/UX only, nothing else
depends on it" framing was hiding.

Cost concentrates in exactly two places, and they are different kinds of cost.
**WS-3 (mode selection) is XL and stays XL** — the block swap and the gate
inversion cannot be split without a red intermediate commit, which is an
architectural ruling I am not reopening; I shrank it where shrinking was free and
stopped. **WS-5 (doctor) is unsized on purpose.** Grounding it turned up
something the architecture record's disposition table does not cover:
`scripts/lib/migration-doctor.mjs:736-741` emits a `refusal`-severity
`partial-pack-set` finding — *"a department pack inherits its operating contract
from core"* — with the remediation step literally reading
`# core is required, never optional`, and `scripts/workspace-doctor.mjs:661-666`
pins that classification as `blocked` in the self-test. That is a fourth,
self-tested place where "core is required" is encoded, and it is shipped product
copy. It is the one thing in this milestone I cannot size honestly today, and it
is the one scope call I am routing back rather than deciding.

Two grounded corrections to figures carried in the accepted record, neither of
which changes any ruling: there are **49** non-core generated agent bodies
(engineering 20 + gtm 11 + product 9 + personal 9), not 51 — 51 is the *skill*
count; and **all 56** root bodies carry `inherits-block.txt`, which is what makes
WS-1 wide rather than deep.

---

## Disposition summary

| Disposition | Count | Which |
|-------------|-------|-------|
| Ship | 4 | WS-0, WS-1, WS-2, WS-7 |
| Slice | 1 | WS-3 (thin atomic increment; one piece moved earlier into WS-2) |
| Spike | 1 | WS-5 |
| Sequence | 2 | WS-4, WS-6 |
| Split | 1 | applied to the architect's PR-5 -> children WS-5 + WS-6 (counted above, not double-counted) |
| Pushback | 0 | see *Scope negotiations* — the one open negotiation is acceptance **coverage**, not a cost objection |

**No Pushback, stated plainly.** I looked for a workstream whose honest cost
outruns its product value as scoped and did not find one. WS-1 is L for a
one-clause amendment, which looks disproportionate until you notice the clause is
byte-pinned into 56 root bodies by `validate-plugin.mjs:312-314` — the width is
the pin doing its job, not gold-plating, and there is no cheaper version that
leaves the floor honest. WS-3 is XL and unavoidable. Padding either would be as
dishonest as shaving them.

---

## Workstreams

### WS-0 — `planPacks()` becomes namespace-aware (D3)

- **Work-item ID:** `area-plugins-m2-planpacks-prefix`
- **Milestone:** `optional-core-contract`
- **What it is:** One condition in `planPacks()` so the `kai-core-` prefix decides
  the provider before the consumer-topology heuristic. The name becomes the
  contract `namespaceErrors()` already advertises.
- **Owner:** `principal-swe-infra`
- **Verification owner:** `principal-swe-infra` (self-test mutation + `--check`
  byte parity)
- **Review requirements:** `principal-swe-architect` / `independent-architecture`
  — it changes the generator's planner.
- **Size:** **S**
- **Dependencies:** none. **This is the first implementation item.**
- **Touches:** `scripts/lib/pack-plan.mjs`, `scripts/pack-preview.mjs`
  (self-test), `package.json`, `package-lock.json`, `CHANGELOG.md`.
- **Disposition:** **Ship**
- **Detail — where it goes and why that matters.** The condition must be
  evaluated **after** the orphan branch, over skills that have at least one
  consumer:

  ```js
  if (!packs) { orphans.push(s); continue; }                       // unchanged
  if (s.startsWith(CORE_SKILL_PREFIX) || packs.size > 1 || packs.has('core'))
    inheritedCore.push(s);
  else inheritedLocal[[...packs][0]].push(s);
  ```

  Placed *before* the orphan branch instead, `kai-core-contract-v1` and
  `kai-core-fleet-observation` stop being orphans, and `partitionErrors()`
  (`scripts/lib/pack-plan.mjs:1498-1506`) fires on both of their
  `SKILL_OWNER_OVERRIDES` entries — *"an agent already inherits it, so the
  override is a second truth about one skill"*. **Byte-neutral is not the same as
  gate-neutral**, and the naive placement is red on `--gate partition` while
  emitting an identical tree. Both properties are separate acceptance lines on the
  item.
- **Risk / unknowns:** byte-neutrality is **analytic, never executed** — nobody
  in this session has a shell, so no one has run the modified planner. It is the
  cheapest unmeasured claim in the milestone, which is exactly why it goes first.
- **Proves:** a future move of a single-consumer core agent (milestone 4) cannot
  silently re-plan the partition.
- **Does NOT touch:** any block file, any gate's assertions, any agent or skill
  body, `SKILL_OWNER_OVERRIDES`, `PACKS`, or a single generated byte.
- **Rollback:** revert one condition; regenerate; the tree is already identical.
- **Release:** `1.0.5`.

### WS-7 — standalone-block product copy (A4 #1, condition C1)

- **Work-item ID:** `area-plugins-m2-standalone-copy`
- **Milestone:** `optional-core-contract`
- **What it is:** The sentences for `standalone-block.txt` — the two honest
  paths, the one-sentence mode line, and the five pinned disclaimers. Structure,
  timing, anti-nag rule and disclaimer set are already fixed by the architecture;
  only the copy is outstanding.
- **Owner:** `principal-product-manager`
- **Verification owner:** `principal-swe-infra` (mechanical conformance to the
  clause set `standaloneBlockErrors()` will lint)
- **Review requirements:** `principal-swe-infra` / `doc-review`
- **Size:** **S**
- **Dependencies:** none. **Dispatchable immediately, in parallel with WS-0** —
  different owner, no shared touch set.
- **Touches:** its own item + thread only. The bytes land in WS-3.
- **Disposition:** **Ship**
- **Detail:** minted as a `proposed` item because WS-3 cannot declare a typed
  dependency on a deliverable that has no record — a dangling `depends_on` is a
  doctor error, and burying a hard input in prose is how a "blocked on copy" PR
  gets discovered at implementation time. **This is the one item I emit that is
  not a PR**; A4 already declares it owed and names the steward as owner, so it is
  sequencing inside approved scope, not new scope. The steward may fold it into
  their own queue instead — that is a promotion decision, not mine.
- **Risk / unknowns:** if the copy arrives late, WS-3 stalls with WS-0/1/2 already
  merged. That is the whole reason it is dispatched first, not third.
- **Release:** none (knowledge; terminal state `completed`).

### WS-1 — the standalone contract floor (PR-1)

- **Work-item ID:** `area-plugins-m2-standalone-floor`
- **Milestone:** `optional-core-contract`
- **What it is:** Amend `scripts/lib/inherits-block.txt` — qualify the
  durable-root clause to full mode and add the standalone-state clause — update
  the verbatim directive in all 56 root agent bodies, add `INHERITS_FLOOR_MAX`,
  regenerate.
- **Owner:** `principal-swe-infra`
- **Verification owner:** `principal-swe-infra`
- **Review requirements:** `principal-swe-architect` / `independent-architecture`
- **Size:** **L** — one file of judgment, 56 files of mechanical exactness, 56
  regenerated bodies, one new size budget, and a self-test mutation. Wide, not
  deep; the risk is a single body drifting by one character.
- **Dependencies:** `area-plugins-m2-planpacks-prefix` `requires: shipped`
  (**serialization edge** — both regenerate `packs/`; concurrent PRs would
  conflict across 56 generated files and make a red `--check` unattributable).
- **Touches:** `scripts/lib/inherits-block.txt`, `agents/*.agent.md` (all 56),
  `packs/*/agents/*.agent.md` (all 56, regenerated), `scripts/lib/pack-plan.mjs`
  (`INHERITS_FLOOR_MAX`), `scripts/validate-plugin.mjs`,
  `scripts/pack-preview.mjs` (self-test), `package.json`, `package-lock.json`,
  `CHANGELOG.md`.
- **Disposition:** **Ship**
- **Detail:** zero behaviour change while core is present, and the refusal still
  fires while it is absent — the floor becomes reachable only in WS-3. This is a
  reshape of shipped text, not a build: the floor already ships.
- **Risk / unknowns:** the new clause must not restate a core contract line
  (`coreContractLines()` drift check) and must fit `INHERITS_FLOOR_MAX`. If the
  budget and the required clause set collide, the clause gets tighter — the
  budget does not get raised silently.
- **Proves:** the operating floor is named, qualified, and size-bounded before
  anything relies on it.
- **Does NOT touch:** `preflight-block.txt`, `degraded-block.txt`, `planPacks()`,
  `**Inherits:**` lines, gate arms, identities.
- **Rollback:** revert one block file + 56 bodies; regenerate.
- **Release:** `1.0.6`.

### WS-2 — pin the claim surface before relaxing the load path (PR-2)

- **Work-item ID:** `area-plugins-m2-claim-surface-pin`
- **Milestone:** `optional-core-contract`
- **What it is:** Add `CLAIM_SKILLS` (the 14 Claim-family ids); extend
  `--gate partition` to assert every one is provided by `core` and by no area, and
  that `workflow-workspace-init` + `kai-core-workspace-onboarding` are co-located
  in `core`; add `standaloneBlockErrors()`, landed unused; add the `partial-core`
  arm to `--gate version-skew`.
- **Owner:** `principal-swe-infra`
- **Verification owner:** `principal-swe-infra`
- **Review requirements:** `principal-swe-architect` /
  `independent-architecture`; `principal-security` / `independent-security` —
  this item *is* the no-false-claim guarantee's mechanical anchor. Precedent:
  `pack-split-degraded-refusal` and `pack-split-preflight-compat` both carried an
  independent security review for the same surface.
- **Size:** **L** — `standaloneBlockErrors()` carries roughly ten required-clause
  assertions, each owing a mutation case in the self-test, plus the 14-member set,
  the co-location assertion and the new arm.
- **Dependencies:** `area-plugins-m2-standalone-floor` `requires: shipped`
  (serialization); `area-plugins-m2-planpacks-prefix` `requires: shipped`
  (**coherence edge** — with D3 landed, the pin rests on the name; without it, on
  consumer topology, which is precisely the variable milestone 4 moves).
- **Touches:** `scripts/lib/pack-plan.mjs`, `scripts/pack-preview.mjs`,
  `scripts/validate-plugin.mjs`, `package.json`, `package-lock.json`,
  `CHANGELOG.md`.
- **Disposition:** **Ship**
- **Detail — what moved in from PR-3, and why that is not a re-litigation.** The
  architect ruled the *block swap and the gate inversion* atomic. The
  `partial-core` arm is neither: it asserts that a core-present, contract-1
  session with a Claim-family skill missing still meets the **byte-unchanged**
  degraded refusal. It is assertable and green on today's tree, it has PR-2's
  character exactly ("asserts a property that already holds, lands green, cannot
  regress"), and every assertion moved out of the one large diff is one less thing
  a red `--check` there could be blamed on. If the implementing engineer finds it
  genuinely entangled with `evaluateMode`, it goes back to WS-3 and this item
  ships without it — recorded as revisable rather than dictated.
- **Risk / unknowns:** the 14-member `CLAIM_SKILLS` set is a judgment boundary
  copied from the architecture's family table. Getting a member wrong in either
  direction is silent: too few weakens the guarantee, too many red-lights a legal
  future roster edit. The set is an acceptance line, enumerated explicitly.
- **Proves:** the structural half of R1 — before core is ever optional.
- **Does NOT touch:** any block's bytes, `evaluatePreflight`, `planPacks()`, the
  generated tree (**this item is byte-neutral on `packs/` and that is an
  acceptance line**), `--gate collision`, `hooks.json`, identities.
- **Rollback:** revert the gate extension and the unused linter.
- **Release:** `1.0.7`.

### WS-3 — mode selection (PR-3)

- **Work-item ID:** `area-plugins-m2-mode-selection`
- **Milestone:** `optional-core-contract`
- **What it is:** Add `mode-block.txt` + `standalone-block.txt`; retire
  `preflight-block.txt`; add `MODE_BLOCK_REL` / `STANDALONE_BLOCK_REL`;
  `guaranteeBlocks()` returns three; extend `guaranteeBlockErrors()` to a
  three-block contiguity/order contract; retarget `contractPinErrors()` and swap
  its pinned literal; `evaluatePreflight` -> `evaluateMode` returning
  `{ mode, reply }`; invert the `no-core` skew arm; wire `standaloneBlockErrors()`;
  regenerate all 49 non-core bodies.
- **Owner:** `principal-swe-infra`
- **Verification owner:** `principal-swe-infra` for automated assertions;
  `principal-qa-ui` for the assembled-behaviour check
- **Review requirements:** `principal-swe-architect` /
  `independent-architecture`; `principal-security` / `independent-security`;
  `principal-qa-ui` / `ui-system`.
- **Size:** **XL**
- **Dependencies:** `area-plugins-m2-claim-surface-pin` `requires: shipped`
  — **HARD, condition C2, non-negotiable**: no commit may exist in which core is
  optional and the claim surface is unpinned. A PR that reverses or merges these
  two fails review on this line alone.
  `area-plugins-m2-standalone-copy` `requires: completed` — **HARD input**: the
  block's sentences are product copy under non-negotiable #5 and must not ship as
  a generator default.
- **Touches:** `scripts/lib/mode-block.txt` (new),
  `scripts/lib/standalone-block.txt` (new), `scripts/lib/preflight-block.txt`
  (deleted), `scripts/lib/pack-plan.mjs`, `scripts/pack-preview.mjs`,
  `scripts/validate-plugin.mjs`, `packs/*/agents/*.agent.md` (49 non-core,
  regenerated), `package.json`, `package-lock.json`, `CHANGELOG.md`.
- **Disposition:** **Slice** — the thin increment is the atomic block swap plus
  the gate inversion; `standaloneBlockErrors()` and the `partial-core` arm are
  explicitly moved **earlier** into WS-2, and `--gate partial-install` arm B is
  explicitly **deferred** to WS-4. What remains cannot be cut further: either half
  of the swap alone is a red build, which is an architectural ruling and not a
  scheduling preference.
- **Detail — C1 rides as an acceptance line.** The one-sentence mode line is not
  negotiable downward; `standaloneBlockErrors()` must assert both the explicit
  `once` instruction and the explicit do-not-repeat prohibition, or the anti-nag
  rule is hoped for rather than pinned.
- **Risk / unknowns:** the sharpest one is small and real —
  `contractPinErrors()` currently pins the literal *"Do not load or apply any
  inherited skill until this preflight passes."* (`pack-plan.mjs:1592`). The
  replacement mode-selection literal is **not fixed by the architecture record**;
  it is an in-PR design detail, and a weak choice silently weakens the three-way
  pin between constant, block prose, and probe body. Named here so review looks at
  it deliberately rather than skimming it as a rename.
- **Proves:** measure #1's behaviour — 49 of 49 non-core agents load standalone;
  and R2/R3 — skew and degraded refusals preserved byte-for-byte.
- **Does NOT touch:** `degraded-block.txt` bytes, `**Inherits:**` lines,
  `planPacks()`, `PACKS`, `CONTRACT_SKILL`/`CONTRACT_VERSION`, the
  `KAI-CORE-MISSING` token itself, `hooks.json`, `HOOKS_OWNER`,
  `providerCollisionErrors`, `namespaceErrors`, `--gate collision`, `PACKS_DIR`,
  the marketplace name, or any plugin identity.
- **Rollback:** revert two block files + the constants + regenerate. The
  fail-closed refusal returns exactly as it is today, on the same five identities.
- **Release:** `1.0.8`.

### WS-4 — the standalone proof (PR-4)

- **Work-item ID:** `area-plugins-m2-standalone-proof`
- **Milestone:** `optional-core-contract`
- **What it is:** `--gate partial-install` arm B — area alone, no core — with all
  five sub-assertions (no core-only reference; exactly one of each of the three
  blocks, contiguous and ordered; `hooks.json` absent and that absence named; every
  reachable skill ships in the area; no `.kai`, `kai/coordination`,
  `kai/initiatives`, or `manifest.json` path in the materialised tree).
- **Owner:** `principal-swe-infra`
- **Verification owner:** `principal-swe-infra`
- **Review requirements:** `principal-swe-architect` / `independent-architecture`
- **Size:** **L** — five distinct assertions plus mutation cases. Lower than it
  looks because `buildAll({ withCore: false })` already exists
  (`pack-preview.mjs:1334`), so arm B needs no new build mode.
- **Dependencies:** `area-plugins-m2-mode-selection` `requires: shipped` —
  **HARD**: the three blocks it counts do not exist until WS-3 lands.
- **Touches:** `scripts/pack-preview.mjs`, `scripts/lib/pack-plan.mjs`,
  `package.json`, `package-lock.json`, `CHANGELOG.md`.
- **Disposition:** **Sequence**
- **Detail:** independently valuable and independently revertible; it is the arm
  that turns measure #1 from asserted into proved. `principal-sre` is deliberately
  **not** required: nothing here changes traffic, failover, capacity, or an SLO,
  and the reliability question this gate answers is exactly the one the gate
  itself mechanises. Adding a reliability pass over a pure CI assertion would be
  ceremony.
- **Risk / unknowns:** sub-assertion (i) — "no generated area agent body
  references a file or script that ships only in core" — needs `referenceErrors()`
  / `assetOwnershipErrors()` re-parameterised for an area-only provider set. That
  is the only piece that is not a straight addition.
- **Proves:** measure #1, mechanically. Today it is unprovable because the arm
  does not exist.
- **Does NOT touch:** blocks, generator output, planner, or any generated byte —
  **byte-neutral on `packs/`, and that is an acceptance line**.
- **Rollback:** revert the arm.
- **Release:** `1.0.9`.

### WS-5 — the doctor's `partial-pack-set` verdict (from PR-5, split)

- **Work-item ID:** `area-plugins-m2-doctor-standalone`
- **Milestone:** `optional-core-contract`
- **What it is:** Reconcile the migration doctor with a world where a
  department pack without core is legitimate.
- **Owner:** `principal-swe-infra`
- **Verification owner:** `principal-swe-infra`
- **Review requirements:** `principal-swe-architect` /
  `independent-architecture`; `principal-sre` / `independent-reliability` — this
  one *does* earn a reliability pass, because relaxing the verdict removes a
  signal that currently catches a genuinely broken install.
- **Size:** **M, pending spike** (S if message-only; L if the status vocabulary
  changes)
- **Dependencies:** `area-plugins-m2-mode-selection` `requires: shipped` — the
  doctor must not describe a mode the shipped product does not have.
- **Touches:** `scripts/lib/migration-doctor.mjs`, `scripts/workspace-doctor.mjs`,
  `test/fixtures/host-installs.json`, `package.json`, `package-lock.json`,
  `CHANGELOG.md`.
- **Disposition:** **Spike**
- **Detail — the question, the time-box, and what each answer implies.**
  **Question:** can `--migration-check` distinguish a *deliberate standalone
  install* from a *failed or partial core install* using host state alone? Both
  present identically: a department pack installed, no core.
  **Time-box: one day.**
  - *Good answer (a sound signal exists):* reclassify to a `standalone` notice,
    keep `blocked` for the genuinely-broken case. Size **L** — the doctor's status
    vocabulary is asserted across ~30 `MIGRATION_CASES`.
  - *Bad answer (no sound signal):* the honest choice is between reclassifying to
    `clear` with a notice and **losing** the broken-install signal, or keeping
    `blocked` and **keeping** a false alarm for a legitimate user. That is a
    product call, not an engineering one — it returns to the steward, not to a
    default. Size **S** either way.
  - *Third outcome, permitted:* the doctor change is deferred to milestone 5 with
    the disclosure carried by `standalone-block.txt` alone. That is a legitimate
    result of the spike, not a failure of it.
- **Risk / unknowns:** this is the unknown. See *Scope negotiations* below — the
  underlying finding is a milestone-acceptance question, not just a sizing one.
- **Does NOT touch:** blocks, generator, planner, generated trees, gates.
- **Rollback:** revert the classification change and its fixtures.
- **Release:** `1.0.10` if it ships as code.
- **`required_for_milestone`: false** — milestone 2's written acceptance does not
  name it. Whether it *should* is the open negotiation.

### WS-6 — documenting the two modes (from PR-5, split)

- **Work-item ID:** `area-plugins-m2-docs-two-modes`
- **Milestone:** `optional-core-contract`
- **What it is:** `docs/getting-started.md` and
  `docs/reference/plugin-structure.md` describe the two modes, the upgrade
  transition, and each changed gate's new assertion.
- **Owner:** `principal-technical-writer`
- **Verification owner:** `principal-swe-infra` (the docs describe what actually
  merged)
- **Review requirements:** `principal-swe-infra` / `doc-review`
- **Size:** **M**
- **Dependencies:** `area-plugins-m2-mode-selection` `requires: shipped`;
  `area-plugins-m2-standalone-proof` `requires: shipped` (the gate assertions it
  documents).
- **Touches:** `docs/getting-started.md`, `docs/reference/plugin-structure.md`.
- **Disposition:** **Sequence**
- **Detail — why PR-5 split.** Three reasons, and the third is the one that
  decided it. (1) One owner per item: the docs are the writer's, the doctor is
  infra's. (2) `release-guard`'s `BEHAVIOR_PREFIXES`
  (`scripts/release-guard.mjs:20`) covers `scripts/` but exempts `docs/`, so the
  doctor change needs its own `1.0.x` and the docs change needs none — bundling
  drags a docs pass into the release train and blurs what a revert restores.
  (3) Decisively: **half of PR-5 is a Spike.** Shipping it as one "doc/UX only,
  nothing else depends on it" item would have buried an unsized unknown inside an
  item labelled trivial.
- **Risk / unknowns:** none material. It cannot start before WS-3 merges without
  documenting behaviour that does not exist.
- **Does NOT touch:** any behaviour path; no version bump; terminal state
  `completed`, and merging it is not shipping.
- **Rollback:** revert.
- **Release:** none.

---

## Typed dependency graph

```text
  WS-0 planpacks-prefix ─┬─[S]─> WS-1 standalone-floor ─[S]─> WS-2 claim-surface-pin
   (no deps, 1.0.5)      │            (1.0.6)                        (1.0.7)
                         └─────────────[C]───────────────────────────────^
                                                                        │
  WS-7 standalone-copy ──────────────────[H:input]────────────┐         │ [H: C2]
   (no deps, no release)                                      v         v
                                                        WS-3 mode-selection (1.0.8)
                                                                  │
                                        ┌─────────────[H]─────────┼─────────[H]──────────┐
                                        v                         v                      v
                              WS-4 standalone-proof      WS-5 doctor-standalone   WS-6 docs-two-modes
                                     (1.0.9)                 (1.0.10, SPIKE)          (no release)
                                        │                                                ^
                                        └────────────────────[H]─────────────────────────┘
```

| From | To | `requires` | Edge kind | Why |
|------|----|-----------|-----------|-----|
| WS-0 | WS-1 | `shipped` | **S** serialization | Both regenerate `packs/`; concurrent PRs conflict across 56 files and make a red `--check` unattributable. |
| WS-0 | WS-2 | `shipped` | **C** coherence | With D3 landed, the `CLAIM_SKILLS` pin rests on the name rather than on consumer topology — the variable milestone 4 moves. |
| WS-1 | WS-2 | `shipped` | **S** serialization | Same owner, same files, same tree. |
| WS-2 | WS-3 | `shipped` | **H** hard — **condition C2** | No commit may exist in which core is optional and the claim surface is unpinned. |
| WS-7 | WS-3 | `completed` | **H** hard input | The block's sentences are product copy; they must not ship as a generator default. |
| WS-3 | WS-4 | `shipped` | **H** hard | Arm B counts three blocks that do not exist until WS-3. |
| WS-3 | WS-5 | `shipped` | **H** hard | The doctor must not name a mode the product does not have. |
| WS-3 | WS-6 | `shipped` | **H** hard | Do not document unmerged behaviour. |
| WS-4 | WS-6 | `shipped` | **H** hard | The docs state each changed gate's new assertion. |

**Only edges marked H are correctness constraints.** The S and C edges are mine,
not the architecture's: they exist because one engineer owns six of these items
and every one of them regenerates or gates the same tree. **If capacity appears,
the steward may relax S and C edges; H edges are not relaxable, and the WS-2 ->
WS-3 edge is not relaxable by anyone below the operator.**

---

## Release packing

`release-guard` (`scripts/release-guard.mjs:20-30`) classifies `scripts/`,
`agents/`, `skills/`, `packs/`, `plugin.json`, `package.json` and
`marketplace.json` as behaviour paths, so each of WS-0/1/2/3/4/5 must carry its
own forward version bump. `docs/` is exempt, so WS-6 carries none.

| Item | Planned version | Note |
|------|-----------------|------|
| WS-0 `planpacks-prefix` | `1.0.5` | |
| WS-1 `standalone-floor` | `1.0.6` | |
| WS-2 `claim-surface-pin` | `1.0.7` | |
| WS-3 `mode-selection` | `1.0.8` | |
| WS-4 `standalone-proof` | `1.0.9` | |
| WS-5 `doctor-standalone` | `1.0.10` | only if the spike returns code |
| WS-6 `docs-two-modes` | none | `docs/` is release-guard exempt |
| WS-7 `standalone-copy` | none | knowledge |

**These numbers are planned, not pinned.** The version on any PR is the next
forward bump from `package.json` at PR time; if merge order changes, the numbers
shift and the plan does not need re-cutting. Whether each bump is separately
tagged and published is the operator's call at merge — this plan asserts the
bump, not the publication.

---

## Scope negotiations (for the PM)

**WS-5 — the doctor says the opposite of what this milestone ships. Acceptance
coverage decision needed.**

- **Asked:** the architecture scoped PR-5 as "doc/UX only" — `workspace-doctor`
  should report a core-less run as `standalone` rather than "not onboarded".
- **What grounding found:** the real contradiction is one layer down and is
  stronger than a false alarm. `scripts/lib/migration-doctor.mjs:736-741` emits a
  **`refusal`**-severity finding `partial-pack-set` — *"a department pack inherits
  its operating contract from core, and core missing does not raise a host
  error"* — and appends the remediation step
  `copilot plugin install kai-core@kai-plugins   # core is required, never
  optional`. `scripts/workspace-doctor.mjs:661-666` pins that verdict as `blocked`
  in the self-test. It is shipped, self-tested, user-visible copy asserting the
  exact proposition this milestone exists to retire, and it sits in a file the
  architecture record's per-gate disposition table never reaches.
- **Honest cost:** unsized until the spike answers whether a deliberate
  standalone install is distinguishable from a broken one. S if message-only, L if
  the status vocabulary gains a third verdict.
- **Cheaper alternative:** leave it. Ship milestone 2 with the doctor telling a
  legitimate standalone user they are `blocked` and must install core, and fix it
  in milestone 5 with the rest of the migration surface. The standalone block
  still discloses the mode, so the user is not misled about what the agent can do
  — only about whether their install is valid.
- **Decision needed:** does milestone 2's acceptance gain the doctor
  reconciliation, or does it ship internally inconsistent for one milestone? **I
  have marked WS-5 `required_for_milestone: false`, which is faithful to the
  acceptance as written — this is a steward call, not mine to make by setting a
  flag.**

**WS-7 — one emitted item is not a PR.** A4 declares the standalone-block copy
owed with the steward as owner and calls it a required input to PR-3, but no item
exists for it. I minted one `proposed` so WS-3's dependency can be typed instead
of narrated. If the steward would rather carry it in their own queue, drop the
item and the WS-3 edge converts to a prose input — the sequencing is unaffected
either way.

---

## Open questions / decisions needed

1. **Steward — WS-5 acceptance coverage.** As above: does
   `optional-core-contract` gain the doctor reconciliation, or does a shipped
   `blocked` verdict on a legitimate standalone install ride to milestone 5?
   Consequence: if it rides, milestone 2 closes with its own doctor contradicting
   its outcome statement.
2. **Steward — WS-7 as an item or as steward queue.** Consequence: whether WS-3's
   copy input is a typed dependency or a prose note.
3. **Architecture, in-PR at WS-3 — the replacement pinned literal.** What exact
   sentence replaces *"Do not load or apply any inherited skill until this
   preflight passes."* in `contractPinErrors()`? Consequence: a weak literal
   silently loosens the constant/prose/probe three-way pin, which is the one
   failure a fully green build can still ship.
4. **Infra, at WS-2 — the `CLAIM_SKILLS` membership list.** Enumerated from the
   architecture's family table; confirm the 14 before the gate hardens around
   them. Consequence: too few weakens R1, too many red-lights a legal roster edit
   in milestone 4.

---

## Emitted records

Eight `proposed` work items, each with a matching thread. **This decomposition
promotes nothing** — every one is `proposed` with `owner: null`, a cleared lease,
and `version: 1`, for `principal-product-manager` to promote or reject.

| # | Item id | Owner | Size | Disposition |
|---|---------|-------|------|-------------|
| WS-0 | `area-plugins-m2-planpacks-prefix` | `principal-swe-infra` | S | Ship |
| WS-7 | `area-plugins-m2-standalone-copy` | `principal-product-manager` | S | Ship |
| WS-1 | `area-plugins-m2-standalone-floor` | `principal-swe-infra` | L | Ship |
| WS-2 | `area-plugins-m2-claim-surface-pin` | `principal-swe-infra` | L | Ship |
| WS-3 | `area-plugins-m2-mode-selection` | `principal-swe-infra` | XL | Slice |
| WS-4 | `area-plugins-m2-standalone-proof` | `principal-swe-infra` | L | Sequence |
| WS-5 | `area-plugins-m2-doctor-standalone` | `principal-swe-infra` | M? | Spike |
| WS-6 | `area-plugins-m2-docs-two-modes` | `principal-technical-writer` | M | Sequence |

**Proposed milestone `required_items` mapping** for `optional-core-contract`, for
the steward to accept or amend — non-empty, and every entry typed:

```yaml
required_items:
  - item: area-plugins-m2-planpacks-prefix   # requires: shipped
  - item: area-plugins-m2-standalone-copy    # requires: completed
  - item: area-plugins-m2-standalone-floor   # requires: shipped
  - item: area-plugins-m2-claim-surface-pin  # requires: shipped
  - item: area-plugins-m2-mode-selection     # requires: shipped
  - item: area-plugins-m2-standalone-proof   # requires: shipped
  - item: area-plugins-m2-docs-two-modes     # requires: completed
```

`area-plugins-m2-doctor-standalone` is deliberately **absent** from the mapping,
pending negotiation 1. Milestone 4 (`area-taxonomy-split`) gains one new
dependency edge: `area-plugins-m2-planpacks-prefix` `requires: shipped`, per
amendment A3/S1.

---

## THE FIRST IMPLEMENTATION ITEM

**`area-plugins-m2-planpacks-prefix`**, owner `principal-swe-infra`. It has no
unmet dependency and can be dispatched the moment the steward promotes it.

**Its first commit** adds one prefix condition to `planPacks()` in
`scripts/lib/pack-plan.mjs`, placed *after* the orphan branch so
`kai-core-contract-v1` and `kai-core-fleet-observation` remain orphans and their
`SKILL_OWNER_OVERRIDES` entries stay legal, then proves two things in the same
PR: `pack-preview --check` reports byte parity on the whole committed tree, and
`--gate partition` stays green. Nothing else moves.

**`area-plugins-m2-standalone-copy`** (owner `principal-product-manager`) is also
unblocked and should be dispatched in parallel — different owner, no shared touch
set, and it is a hard input to WS-3 four items downstream.

---

## HANDOFF 2026-08-27-1922 — principal-swe-manager -> principal-product-manager

- did:       Decomposed milestone `optional-core-contract` into **eight `proposed` work items** (seven PRs plus one product-copy input), each with an owner, T-shirt size, typed `depends_on`, precise `touches`, checkable acceptance, `review_requirements`, a named rollback, and a planned `1.0.x`. **Confirmed the architect's floor -> guarantee -> behaviour -> proof -> surface ordering; revised its packing three ways, each with a reason:** (1) **D3 (`planPacks()` prefix) lands FIRST as its own commit** — byte-neutral, smallest diff, and it re-bases provider assignment on the name before PR-2 pins the claim surface by provider; I also found and recorded a **placement constraint the "one condition" framing hides** — put the condition before the orphan branch and `partitionErrors()` goes red on the two `kai-core-*` `SKILL_OWNER_OVERRIDES` entries, so byte-neutral is not the same as gate-neutral. (2) **The `partial-core` skew arm moves from PR-3 into PR-2** — it asserts byte-unchanged degraded behaviour, is green today, and does not fall under the architect's atomicity ruling, which covers only the block swap and the gate inversion. (3) **PR-5 splits into WS-5 + WS-6** — one owner each, `docs/` is release-guard exempt while `scripts/` is not, and decisively, half of PR-5 is a Spike that the "doc/UX only" framing was hiding. **Condition C2 is encoded as a typed `depends_on` with `requires: shipped`** on `area-plugins-m2-mode-selection`, not as prose. Wrote no production code and modified nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, `kai/initiatives/**`, or the parallel sibling's records.
- state:     completed
- needs:     **Steward promotion — nothing here is promoted.** Three things to weigh: (a) the proposed milestone `required_items` mapping above, seven entries, with `area-plugins-m2-doctor-standalone` deliberately excluded; (b) **scope negotiation 1**, the one real find of this pass — `scripts/lib/migration-doctor.mjs:736-741` ships a `refusal`-severity `partial-pack-set` verdict whose remediation step literally reads `# core is required, never optional`, self-tested as `blocked` at `scripts/workspace-doctor.mjs:661-666`; it is a fourth encoding of "core is required" that the architecture's disposition table never reaches, and whether milestone 2's acceptance must cover it is a steward call I have not made by flag; (c) **WS-7**, the standalone-block copy that A4 declares owed and names you as owner — I minted it `proposed` so WS-3's hard input could be typed rather than narrated, and it is yours to keep or fold.
- artifacts: kai/coordination/threads/area-plugins-m2-decomposition.md (this record — the durable milestone-2 delivery plan while `kai/initiatives/area-plugins/` cannot be created); kai/coordination/items/area-plugins-m2-decomposition.md (version 3, `completed`, lease cleared); eight new `proposed` items in `kai/coordination/items/area-plugins-m2-*.md` with eight matching threads in `kai/coordination/threads/`.
- evidence:  Read this session from `C:\src\kai`. `scripts/lib/pack-plan.mjs:405-419` (`packs.size > 1 || packs.has('core')`) and `:1498-1506` (`partitionErrors` rejects an override for a skill inheritance already places) — together these are the D3 placement constraint. `:104-119` — `SKILL_OWNER_OVERRIDES` places `kai-core-contract-v1` and `kai-core-fleet-observation` as orphans. `:1592` — the pinned literal `"Do not load or apply any inherited skill until this preflight passes."` that WS-3 must replace. `scripts/validate-plugin.mjs:312-314` — every root agent body must carry the verbatim `inherits-block.txt` directive, which is what makes WS-1 wide. `scripts/pack-preview.mjs:308-1237` — the ~930-line mutation self-test every gate change owes a case to; `:1334` — `buildAll({ withCore: false })` already exists, so WS-4 needs no new build mode. `scripts/release-guard.mjs:20-30` — `scripts/` is a behaviour path, `docs/` is exempt, which is what splits PR-5's release story. `scripts/lib/migration-doctor.mjs:736-741` and `scripts/workspace-doctor.mjs:661-666` — the shipped `partial-pack-set` refusal and its pinned `blocked` verdict. `packs/*/agents/` counted by directory: 20 + 11 + 9 + 9 + 7 = 56, so **49** non-core generated bodies, not the 51 the accepted record states (51 is the skill count) — a figure correction that changes no ruling.
- questions: none blocking. Four decisions are recorded in *Open questions* above; two are the steward's and two are in-PR engineering calls that do not gate dispatch.
- next:      `principal-product-manager` — promote or amend the eight `proposed` items and the milestone `required_items` mapping, and rule on scope negotiation 1. On promotion, `director-chief-of-staff` dispatches **`area-plugins-m2-planpacks-prefix`** to `principal-swe-infra` as the first implementation item, and **`area-plugins-m2-standalone-copy`** to `principal-product-manager` in parallel.

---

## STEWARD RULING 2026-08-27-1944 — principal-product-manager (steward)

Answering the two decisions this plan routed, and recording the one correction to
its dispatch call. **The full ruling and the amended milestone acceptance live in
`kai/coordination/threads/area-plugins-scope-brief.md`, STEWARD AMENDMENT
2026-08-27-1944 (A5–A9)** — this entry is the mirror where the questions were
asked, not a second source of truth.

**The plan is accepted as written.** Ordering, packing, the three revisions and
their reasons, sizes, edge kinds, release packing, and the named first
implementation item all stand. Verified against my own brief this pass: **C2** is a
typed `depends_on {item: area-plugins-m2-claim-surface-pin, requires: shipped}` in
`area-plugins-m2-mode-selection`'s frontmatter — machine-checkable, not prose;
**D3** sits in milestone 2 as its own item with byte-neutrality *and*
gate-neutrality as two separate acceptance lines; **C1** is carried in both the
copy item and `mode-selection`; every item is independently shippable, reversible,
and carries its own lockstep `1.0.x` or none with the reason stated. Nothing needed
fixing.

**Open question 1 — WS-5, the doctor. RULED (a): milestone 2's acceptance gains
it.** `area-plugins-m2-doctor-standalone` is now `required_for_milestone: true`.
`optional-core-contract` does not close with its own doctor telling a legitimate
standalone user that their install is `blocked` and that *"core is required, never
optional."* You were right to route this instead of settling it, and right that
`false` was faithful to the acceptance as written — the acceptance was wrong, so I
amended the acceptance rather than the flag. Two facts I verified beyond your
citations decided the shape: `migration-doctor.mjs:869` derives status from
severity over exactly `blocked`/`unknown`/`clear` (no `standalone` status exists,
so the Spike is genuinely a vocabulary question), and the self-test's `steps` regex
matches the command rather than the trailing comment — so the false sentence is
removable without perturbing the case set. The ruling therefore splits: **(i) the
false assertion goes, unconditionally, in this milestone**; **(ii) not classifying
a core-absent-only install as invalid is the default**, mechanism left to the Spike
and the architect, defeasible only by a `principal-sre` BLOCK, which I do not
relabel and which escalates to the operator with milestone 3 as its home. **The
Spike's "no sound signal" branch is pre-decided** so it cannot bounce back onto the
critical path.

**Open question 2 — WS-7. RULED: it stays its own item.** A typed `depends_on`
beats a prose input, and folding the copy into a private steward queue would have
hidden a hard input four items downstream. It is promoted to the **top** of the
queue.

**Open questions 3 and 4 stay where you put them.** The replacement pinned literal
is an in-PR architecture decision (its standard is *equivalent strength*, already
an acceptance line) and does not route to me; it returns only if the pin cannot be
held. The `CLAIM_SKILLS` membership list is confirmed as a steward-visible
boundary: it is the mechanism behind amended measure #2(a), so a membership change
is a steward question, not an in-PR judgment.

**Figure correction confirmed: 49, not 51.** Counted independently from the
committed tree — engineering 20 + gtm 11 + product 9 + personal 9 + core 7 = 56, so
49 non-core; 51 is the skill count. Carried into the brief as A6.

**One correction to the dispatch call, and the reason is not in your lane.** You
named `area-plugins-m2-planpacks-prefix` first with
`area-plugins-m2-standalone-copy` dispatched in parallel. Engineering-wise that is
exactly right. What the decomposition could not see is the initiative frontier —
`kai/coordination/ACTIVE.md` reads "No initiatives are active", so you worked with
no `scope.current` in view. It is still `decisions-locked`;
`area-plugins-migration-architecture` is `in-review` with `principal-sre`; and
milestone 1's acceptance ends *"No production code, manifest, or marketplace change
has been made."* A milestone-2 code merge today would make that line permanently
unclaimable. So `planpacks-prefix` gains one steward edge —
`area-plugins-migration-architecture` `requires: completed` — which transitively
gates the whole code chain through the head, clears itself with no round-trip, and
leaves **`area-plugins-m2-standalone-copy` as the only item executable now.**
`planpacks-prefix` remains the first *implementation* dispatch, the moment
milestone 1 closes.

**Promoted, `proposed -> ready`, all eight** (`owner: null`, five lease fields
null, `version` 1 -> 2, steward priorities): copy 10 · planpacks-prefix 20 · floor
30 · claim-surface-pin 40 · mode-selection 50 · standalone-proof 60 ·
doctor-standalone 70 · docs-two-modes 80. The milestone `required_items` mapping is
accepted with the doctor added — **eight entries, all typed**.


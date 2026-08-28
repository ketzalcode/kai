# Thread — area-plugins-taxonomy-decision

Append-only communication log mirroring
`kai/coordination/items/area-plugins-taxonomy-decision.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-1850):** no agent in this session has a shell,
so `kai/initiatives/area-plugins/` cannot be created and the canonical
`artifact_target`
(`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-decision.md`)
cannot yet be written. That target is recorded and unchanged. Until one operator
`mkdir` runs, **this thread is the durable record of the taxonomy decision** — a
real canonical coordination path, not a substitute workspace. When the
initiative directory exists, the decision artifact is transcribed from the
DECISION packet below without re-litigation.

---

## DECISION 2026-08-27-1850 — principal-swe-architect

**initiative:** area-plugins · **milestone:** decisions-locked (ships in
`area-taxonomy-split`, per the scope brief's ordering ruling)

# Architecture Decision — the post-`kai-personal` area taxonomy

**Source:** `kai/coordination/items/area-plugins-taxonomy-decision.md`
(state `ready`, version 3), under the binding product scope in
`kai/coordination/threads/area-plugins-scope-brief.md`
(`BRIEF 2026-08-27-1839`), succeeding
`kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md`.
**Date:** 2026-08-27 18:50 local
**Run:** principal-swe-architect

**Decision (one line):** Seven plugins, 56 agents, 51 skills, one provider each —
`creative-video-director` and its whole demo toolchain **relocate to `kai-gtm`**;
and provider assignment in `planPacks()` becomes **namespace-aware**, because
without that the *already-settled* memberships do not compile.

---

## Context

Read this session from `C:\src\kai`, by file, not from memory:

- `agents/` holds **56** `*.agent.md` files (directory read, enumerated below).
  `PACKS` in `scripts/lib/pack-plan.mjs:63-98` assigns 7 / 20 / 9 / 11 / 9 = 56.
  Roster and partition agree.
- `skills/` holds **51** directories containing `SKILL.md` (glob). The
  `pack-split` lock recorded 50 and explicitly excluded the then-synthesised
  `kai-core-contract-v1`; that skill is now on disk, and `fleet-observation`
  has since been renamed `kai-core-fleet-observation`. **Live governs: 51.**
- Provider assignment is computed, not declared. `planPacks()`
  (`pack-plan.mjs:382-434`) walks every agent's single `**Inherits:**` line and
  applies one rule: *a skill inherited from more than one pack, or from any core
  agent, is provided by `core`; otherwise it is local to its one consuming
  pack.* Skills no agent inherits are `orphans`, placed only by
  `SKILL_OWNER_OVERRIDES`.
- `namespaceErrors()` (`pack-plan.mjs:1527-1546`) enforces core's namespace **in
  both directions**: core may provide only `kai-core-*`, and no department may
  provide a `kai-core-*` id. It runs inside `--gate partition`
  (`scripts/pack-preview.mjs:1255-1260`).

The decision blocked: the operator settled which agents live in `kai-learning`,
`kai-assistant` and `kai-wellness`, and settled that
`director-executive-assistant` leaves `core` — but nobody had checked what
those moves do to the **computed** provider map. They break it. That, plus the
one open membership question (`creative-video-director`), is what this record
resolves.

---

## Diagram

### 1. Topology — before / after

```text
BEFORE — 5 plugins · 56 agents · 51 skills      AFTER — 7 plugins · 56 agents · 51 skills

┌─ kai-core ─────────────── 7 ─┐                ┌─ kai-core ─────────────── 6 ─┐
│ hooks.json (sole owner)      │                │ hooks.json (sole owner)      │
│ kai-core-contract-v1         │                │ kai-core-contract-v1         │
│ 24 kai-core-* skills         │                │ 24 kai-core-* skills         │
│ lectoria                     │                │ lectoria                     │
│ director-chief-of-staff      │                │ director-chief-of-staff      │
│ director-executive-assistant ├──┐             │ 5 x workflow-*               │
│ 5 x workflow-*               │  │             └──────────────────────────────┘
└──────────────────────────────┘  │                  ▲  every area resolves
                                  │                  │  kai-core-* across the
┌─ kai-engineering ─── 20 · 15 ─┐ │                  │  plugin boundary
┌─ kai-product ───────  9 ·  3 ─┐ │                  │
┌─ kai-gtm ───────────  11 ·  2 ┐ │      ┌───────────┴───────────────────────┐
└───────────────────────────────┘ │      │                                   │
                                  │  ┌─ kai-engineering ─ 20 · 15 ┐   ┌─ kai-learning ─ 4 · 1 ┐
┌─ kai-personal ───── 9 · 7 ────┐ │  ┌─ kai-product ───── 9 ·  3 ─┐   ┌─ kai-assistant ─ 3 · 1 ┐
│ creative-video-director ──────┼─┼─▶┌─ kai-gtm ──────── 12 ·  7 ─┐   ┌─ kai-wellness ── 2 · 0 ┐
│ video-direction, 4 x demo-*   │ │  │ + creative-video-director  │   │ + director-exec-asst.  │
│ scripts/demo-*.mjs, lectoria ─┼─┴─▶│ + video-direction + demo-* │   │ (from kai-core)        │
│ persona-self ─────────────────┼───▶│ + scripts/demo-*.mjs       │   └────────────────────────┘
│ 3 x instructor-*, course-audio│    │ + lectoria                 │
│ nutritionist, trainer         │    └────────────────────────────┘
│ career-mentor                 │
└───────── DISSOLVED ───────────┘         (n · m  =  agents · locally-provided skills)
```

### 2. The seam this decision actually turns on

The settled memberships fail `--gate partition` **today**, at a seam nobody
named: `planPacks()` decides providers by *consumer topology*, while
`namespaceErrors()` judges them by *name*. Those two agree only by coincidence,
and the settled moves break the coincidence.

```text
              planPacks()                      namespaceErrors()
        "who inherits this skill?"          "what is this skill called?"
                    │                                   │
                    ▼                                   ▼
   ┌────────────────────────────────┐    ┌──────────────────────────────┐
   │ >1 pack, or a core agent → core│    │ dept provides `kai-core-*`   │
   │ exactly 1 pack   → that pack   │    │        → ERROR               │
   └────────────────────────────────┘    └──────────────────────────────┘
                    │                                   ▲
                    └──────── disagree here ────────────┘

   kai-core-decision-brief          consumers: DEA only
   kai-core-executive-consultation  consumers: DEA only
        DEA: core -> kai-assistant   ⇒ planPacks says "kai-assistant local"
                                     ⇒ namespaceErrors says ERROR   ← RED

   kai-core-content-grounding       consumers: cvd(personal) + 2 x gtm
        cvd: personal -> kai-gtm     ⇒ planPacks says "kai-gtm local"
                                     ⇒ namespaceErrors says ERROR   ← RED

   FIX (D3): make the name authoritative in the planner, not just the checker.
             `id.startsWith('kai-core-')  ⇒  core`, evaluated first.
             Provably a no-op on today's tree (all 24 kai-core-* already land
             in core), so it ships byte-neutral and ahead of the split.
```

---

## Forces

Concrete, each traced to a file:

- **F1 — Namespace collapse (gate-level, hard).** Three `kai-core-*` skills lose
  core-provider status purely as a side effect of the settled moves.
  `kai-core-decision-brief` and `kai-core-executive-consultation` are inherited
  by **`director-executive-assistant` alone** (verified across all 56
  `**Inherits:**` lines; corroborated by the `pack-split` lock's single-consumer
  table). `kai-core-content-grounding` is core-provided only because
  `creative-video-director` (personal) and two `kai-gtm` agents inherit it — the
  lock records it verbatim as *"multi-pack, **no** core consumer."* Collapse any
  of those to one department and `planPacks()` hands the department a
  `kai-core-*` id, and `--gate partition` goes red. **This force exists
  independently of the `creative-video-director` question** — the settled,
  non-negotiable DEA move triggers it on its own.
- **F2 — Input contract.** `creative-video-director`'s sole factual inputs,
  `product_context.json` and `media_manifest.json`, are produced by
  `principal-product-marketing` ∈ `kai-gtm`. Its named peers are
  `principal-product-marketing` and `principal-linkedin-strategist` (both
  `kai-gtm`) and `persona-self` (→ `kai-assistant`). An agent whose required
  inputs are produced by a plugin the user did not install is **structurally not
  standalone-usable**, which is measure #1's whole point.
- **F3 — Install weight.** The agent does not travel alone. It drags
  `video-direction` + four `demo-*` skills + five JS assets
  (`scripts/demo-capture.mjs`, `demo-format.mjs`, `demo-narrate.mjs`,
  `demo-zoom.mjs`, `scripts/lib/cursor-png.mjs`, resolved by the import graph)
  + the `lectoria` runtime dependency + a Node engine pin
  (`^22.22.2 || ^24.15.0 || >=26.0.0`) + an ffmpeg/Azure-Speech story. Whichever
  area takes it, takes all of that.
- **F4 — One-sentence job test** (non-negotiable #3; measure #3 target
  *"catch-all count: 0"*). *kai-gtm:* "Take a product to market — demand, sales,
  pricing, partnerships, and the content that carries it." Video direction is
  market-facing content production; it fits with no structural "and."
  *kai-assistant:* "Support the operator personally — agenda, voice, career."
  Adding a product-video director forces "…**and** product video direction" —
  re-creating a mini catch-all inside the area built to prove the catch-all is
  gone. *kai-learning* is worse. *kai-wellness* is absurd.
- **F5 — Reversibility asymmetry.** Placement is a one-line `PACKS` edit in the
  repo and a **published plugin identity** in the marketplace. Reversing after
  publication means moving an agent between two live identities — the same class
  of pain as dissolving `kai-personal`. Cheap to write, expensive to undo. The
  scope brief already priced this asymmetry when it sequenced the split fourth.
- **F6 — Cross-department dependency is forbidden.** `referenceErrors()`
  (`pack-plan.mjs:1022-1065`) lets a department reach **only** its own pack or
  `kai-core`, with one carve-out: an *agent* reference is a routing target, not
  a load-time dependency, so cross-area **routing** is legal and cross-area
  **skills** are not. So the demo toolchain cannot be separated from
  `creative-video-director`, and it cannot be parked in core either —
  `namespaceErrors()` closes core to any id lacking the `kai-core-` prefix.
  **There is exactly one degree of freedom here, not two.**
- **F7 — Execution root, not consumer, owns a runtime dependency.**
  `kai-core-generate-audio/SKILL.md:17,48` binds execution to
  `<kai-core-plugin>/scripts/generate-audio.ps1` and says *"Never derive it from
  a calling"* pack; `validate.yml:117-129` asserts precisely that resolution.
  `demo-narrate/SKILL.md:113-123` binds to *this plugin's*
  `node_modules/.bin/lectoria`. So the declaration follows the plugin root the
  binary resolves from — **not** the agent that triggers the skill.

---

## Options considered — `creative-video-director`

| Option | Shape | Cost | Forces satisfied / violated |
|---|---|---|---|
| **Do nothing** (leave in `personal`) | Keep `kai-personal` | Violates non-negotiable #3 and the whole initiative | ✗ the point of the work |
| **Leave unplaced** | Not in any `PACKS` list | `partitionErrors()`: *"belongs to no pack — add it to PACKS, or it ships in nothing"* | ✗ illegal by construction |
| **New area** (`kai-creative`) | 8th plugin, 1 agent | Adds a plugin identity beyond the settled set; explicitly `out_of_scope`; **critical operator boundary #3** | ✓ F3, F4 ✗ scope — escalation, not a decision |
| **`kai-learning`** | 4 → 5 agents | Not teaching; forces a structural "and"; inputs in another plugin | ✗ F2, ✗ F4 |
| **`kai-assistant`** | 3 → 4 agents, 1 → 6 skills | Largest relative bloat; breaks the one-sentence test in the flagship new area; DEA-adjacent only by accident of the old catch-all; a standalone `kai-assistant` user gets an agent that cannot start | ✗ F2, ✗ F4, ✗ F3 (relative) |
| **`kai-gtm`** ✅ | 11 → 12 agents, 2 → 7 skills | +5 JS assets, +`lectoria`, + a binary-asserting CI leg, for GTM users who want no video | ✓ F2, ✓ F4, ✓ F6 · ✗ F3 |

**Why `kai-gtm` wins the F3-vs-F4 trade.** F4 is a **product non-negotiable**
(#3) with a measure target of zero catch-alls. F3 is a **measure** (#4) whose
stated targets are `kai-wellness` 16→2 and `kai-learning` 16→4 — *neither of
which this placement touches*. The cost lands on `kai-gtm`, an area with no
stated install-cost target and not one of the three being minted. A
non-negotiable outranks an untargeted measure. F2 then breaks the tie
independently: `kai-gtm` is the only area where this agent's inputs exist, and
under optional-core an area is judged by whether it works **alone**.

**Note that F1 is deliberately absent from this table.** Moving
`creative-video-director` into `kai-gtm` collapses `kai-core-content-grounding`
to a single department and would fail `--gate partition` — but the *settled*
DEA move fails it too, for the same reason, so the planner fix (D3) is required
regardless. I refuse to let a placement preference justify a generator change;
the generator change is justified by the settled membership alone, and the
placement is then decided on F2/F3/F4 with F1 neutral on both sides. Recording
the order matters: if D3 were ever reverted, `kai-gtm` stops being a legal home
and this decision reopens.

---

## Decision

### D1 — The agent map · **Endorse** (settled memberships, unchanged)

`PACKS` insertion order is `PACK_ORDER` is the canonical install order
(`pack-plan.mjs:99`; `validate-plugin.mjs:860` derives the guided installer from
it). Deleting `personal` — currently last — and appending the three new keys
leaves the first four keys **positionally unchanged**, so no existing pack is
reordered and the `pack-split` lock's declared order is not re-opened. The new
keys follow the brief's own vision sentence order: *engineering, product, gtm,
learning, assistant, wellness.*

| # | pack | plugin | agents | roster |
|---|---|---|---|---|
| 1 | `core` | `kai-core` | **6** | director-chief-of-staff · workflow-initiative-init · workflow-proactive-scan · workflow-self-check · workflow-weekly-pulse · workflow-workspace-init |
| 2 | `engineering` | `kai-engineering` | **20** | *unchanged* — principal-ai-applied-engineer · principal-ai-researcher · principal-data-engineer · principal-privacy-compliance · principal-qa-ui · principal-security · principal-solutions-architect · principal-sre · principal-swe-architect · principal-swe-backend · principal-swe-frontend · principal-swe-infra · principal-swe-manager · principal-technical-writer · workflow-doc-review · workflow-incident-response · workflow-issue-analysis · workflow-localization · workflow-pull-request · workflow-ship |
| 3 | `product` | `kai-product` | **9** | *unchanged* — persona-ux-first-time-user · principal-brand-designer · principal-data-analytics · principal-product-designer · principal-product-manager · principal-product-strategist · workflow-customer-feedback · workflow-experiment-review · workflow-product-explore |
| 4 | `gtm` | `kai-gtm` | **12** | *11 unchanged* — principal-customer-success · principal-demand-generation · principal-growth · principal-linkedin-strategist · principal-partnerships · principal-pricing-monetization · principal-product-marketing · principal-revenue-operations · principal-sales · principal-seo · workflow-support-triage — **+ creative-video-director** |
| 5 | `learning` | `kai-learning` | **4** | instructor-path-mentor · instructor-teacher · instructor-tutor · workflow-course-to-audio |
| 6 | `assistant` | `kai-assistant` | **3** | director-executive-assistant · persona-self · principal-engineer-career-mentor |
| 7 | `wellness` | `kai-wellness` | **2** | persona-professional-nutritionist · persona-professional-trainer |

**Total 6 + 20 + 9 + 12 + 4 + 3 + 2 = 56.** Verified against the live roster by
reading `agents/` this session: 56 `*.agent.md` files, each appearing exactly
once above. No agent is claimed twice; none is unclaimed.

`kai-engineering`, `kai-product` and `kai-gtm`'s existing 11 are untouched, per
`out_of_scope`. No hard correctness problem was found in them, so no `PROPOSAL`
is raised against their membership.

### D2 — `creative-video-director` → `kai-gtm` · **Relocate**

Moved across a boundary, not reshaped: the agent, its method skill, its
toolchain and its runtime dependency all land where its input producer and two
of its three routing peers already live. **`video-direction` and all four
`demo-*` skills move with it, and they have no choice** — F6 forbids a
department reaching another department's skills, and core's namespace is closed
to their un-prefixed ids.

**On the install-bloat question, stated plainly:** yes, this bloats `kai-gtm`.
Every `principal-sales` user now installs five demo skills, five JS assets, a
`lectoria` dependency declaration and a Node engine pin they will never use.
That is a real cost and the reason `kai-gtm` was not the obvious answer. It is
accepted because (a) the bytes are inert — the host does not run `npm`, so
nothing installs or executes until someone runs `npm ci --prefix`, and (b) the
alternative buys those bytes back by re-creating a catch-all, which is the one
thing this initiative exists to eliminate. Cost paid in inert bytes beats cost
paid in a violated non-negotiable.

### D3 — Provider assignment becomes namespace-aware · **Reshape**

**The settled taxonomy does not compile today.** Not because of anything I
chose — because `kai-core-decision-brief` and `kai-core-executive-consultation`
have exactly one consumer, and that consumer is leaving `core` by operator
decision.

The smallest structural change: in `planPacks()`, evaluate the `kai-core-`
prefix **before** the consumer-topology heuristic. One condition. The name
becomes the contract, which is exactly what `namespaceErrors()` already tells
every reader it is — the rule simply moves from the checker into the planner,
where it can be satisfied by construction instead of caught after the fact.

Three properties make this cheap:

1. **Provably output-neutral today.** All 24 `kai-core-*` skills already land in
   core under the current partition (`--gate partition` is green, and the
   self-test at `pack-preview.mjs:1123` asserts `namespaceErrors` is empty over
   the live plan). So the reshape emits a byte-identical tree, `--check` stays
   green, and it can ship in the `optional-core-contract` milestone — **ahead of
   the split**, on the stable five-plugin set, with one variable moving. That is
   the brief's own ordering discipline applied one level down.
2. **It removes a class of failure, not an instance.** Any future move of a
   single-consumer core agent hits the same wall. Fixing the seam once retires
   the whole class.
3. **`namespaceErrors()` is not made redundant.** It still catches a
   mis-prefixed core skill and a hand-edited or override-placed violation. It
   stops being the *only* thing standing between a legal roster edit and a red
   build.

**What I deliberately rejected**, and why: renaming `kai-core-content-grounding`
/ `-decision-brief` / `-executive-consultation` to bare ids (edits three
`**Inherits:**` lines and three directory names — content churn to make
packaging work, and `out_of_scope`); adding `SKILL_OWNER_OVERRIDES` entries to
force them to core (**illegal by construction** — `partitionErrors()` rejects an
override for a skill inheritance already places: *"the override is a second
truth about one skill"*); and accepting a red gate with a documented exception
(the acceptance line says *green by construction, not by exception*).

### D4 — Core-provided skills with no core consumer · **Defer to the sibling record**

After the move, `kai-core` provides `kai-core-decision-brief` and
`kai-core-executive-consultation` whose only consumer is a `kai-assistant`
agent, and `kai-core-content-grounding` whose only consumers are `kai-gtm`
agents. **This is an established pattern, not a new one:** the `pack-split` lock
already documents four core skills with no core consumer, kept there *"to avoid
cross-pack duplication."* Under today's required-core contract it is correct and
costs nothing.

Under **optional core** it becomes a live question — a standalone `kai-assistant`
loses two of `director-executive-assistant`'s six inherited skills. **That is the
optional-core record's call, not mine**, and the steward's precedence ruling
sends it there. I am recording the exact set it must rule on:

| skill | provider | sole/major consumers after the split | standalone gap if core absent |
|---|---|---|---|
| `kai-core-decision-brief` | core | `director-executive-assistant` (assistant) | assistant |
| `kai-core-executive-consultation` | core | `director-executive-assistant` (assistant) | assistant |
| `kai-core-content-grounding` | core | cvd + demand-generation + linkedin-strategist (all gtm) | gtm |
| `kai-core-generate-audio` | core | 3 × instructor-* + workflow-course-to-audio (learning); workflow-weekly-pulse (core) | learning |

If that record concludes an area must be *functionally* complete standalone,
these four need a rename-and-relocate that it owns and that I have not
pre-empted. **Flagged, not resolved.**

### D5 — `lectoria` → `core` + `gtm` only · **Relocate** (and a correction)

The brief's routed evidence expects a 2-way → **3-way** split, with
`kai-learning` acquiring `lectoria` because `workflow-course-to-audio` consumes
`kai-core-generate-audio`. **The files say otherwise, and I am correcting it**
rather than encoding it:

`kai-core-generate-audio/SKILL.md:17` — *"through `scripts/generate-audio.ps1`
in the **kai-core provider root**"*; `:48` — *"`<kai-core-plugin>/scripts/
generate-audio.ps1`. **Never derive it from a calling**"* pack; `:19` —
*"Lectoria is pinned in **kai-core's** generated `package.json`."* The CI probe
at `validate.yml:117-129` asserts exactly that resolution and asserts it **only
for `kai-core`**. A `kai-learning` instructor inheriting that skill therefore
executes `lectoria` out of **core's** `node_modules`, never its own. It ships no
file that resolves the binary from `${PLUGIN_ROOT}`, so it declares nothing.

**The rule that keeps the list reviewable rather than arbitrary — and the one
this record locks:** *a pack declares a runtime dependency **iff** it ships a
file that resolves that dependency from its own plugin root.* Trace:

| pack | ships a file resolving `node_modules/.bin/lectoria` from its own root? | declares |
|---|---|---|
| `core` | yes — `kai-core-generate-audio` + `scripts/generate-audio.ps1` | `['lectoria']` |
| `gtm` | yes — `demo-narrate` + `scripts/demo-narrate.mjs` (`demo-narrate/SKILL.md:113-123`) | `['lectoria']` |
| `engineering`, `product`, `learning`, `assistant`, `wellness` | no | `[]` |
| `personal` | *removed* | — |

**Derivation stays intact.** `runtimeDependencyMatrix()` (`pack-plan.mjs:157`)
is already derived from `COMMITTED_PACKS` × `PACK_RUNTIME_DEPENDENCIES`;
`COMMITTED_PACKS = [...PACK_ORDER]` is already derived from `PACKS`. Adding
three keys to `PACKS` extends the CI matrix with **zero workflow edits** — the
matrix comes from `pack-preview.mjs --ci-matrix` and the per-leg binary
assertion from `--ci-runtime-binaries` (`validate.yml:73-116`). And forgetting a
key is **fail-closed, not silent**: `packPackageMetadata()`
(`pack-plan.mjs:322`) throws *"no runtime dependency plan exists for pack"* at
generation time.

**CI legs change 5 → 8.** Binary-asserting legs move from
`{kai-core, kai-personal}` to `{kai-core, kai-gtm}`. Three new legs
(`kai-learning`, `kai-assistant`, `kai-wellness`) install a zero-dependency
lockfile and assert nothing — the workflow's documented "declares none" arm,
first exercised here.

### D6 — Truly-derived runtime dependencies · **Defer**

`PACK_RUNTIME_DEPENDENCIES` remains hand-listed against the D5 rule. Deriving it
mechanically — scanning each pack's shipped assets for
`node_modules/.bin/<binary>` resolution — is not worth building at one runtime
artifact and eight packs. **Trigger to reopen:** a second runtime artifact
enters `RUNTIME_ARTIFACTS`, or a pack's declaration is found to have drifted
from the files it actually ships.

---

## Skill provider map — full deltas

**Totals after:** core 24 · engineering 15 · product 3 · gtm 7 · learning 1 ·
assistant 1 · wellness 0 = **51**, matching the 51 `SKILL.md` files on disk.

### `SKILL_OWNER_OVERRIDES` — exactly four entries change

| skill | before | after | why |
|---|---|---|---|
| `create-product-demo` | `personal` | **`gtm`** | orphan (no agent inherits it); follows `creative-video-director` |
| `demo-capture` | `personal` | **`gtm`** | same |
| `demo-narrate` | `personal` | **`gtm`** | same |
| `demo-zoom` | `personal` | **`gtm`** | same |
| `kai-core-contract-v1` | `core` | `core` | unchanged |
| `kai-core-fleet-observation` | `core` | `core` | unchanged |
| `onboard-to-codebase`, `review-dependencies`, `review-performance-scale`, `review-success-metrics` | `engineering` | `engineering` | unchanged |

These four edits are **required, not cosmetic**. Left at `'personal'` after that
key leaves `PACKS`, each raises *two* `partitionErrors()`: *"places
`demo-capture` in "personal", which is not a pack"* **and** *"skill
`demo-capture` has no provider."* All four remain genuine orphans, so the
override stays legal (`partitionErrors()` rejects an override for a skill
inheritance already places).

### Inherited providers that change because an agent moved

| skill | consumers before | provider before | consumers after | provider after |
|---|---|---|---|---|
| `video-direction` | cvd (personal) | `personal` | cvd (gtm) | **`gtm`** — mechanical, no override |
| `extract-writing-style` | persona-self (personal) | `personal` | persona-self (assistant) | **`assistant`** |
| `generate-html-lesson` | instructor-teacher, instructor-tutor (personal) | `personal` | both (learning) | **`learning`** |

### Skills that would become **wrongly-owned** — the three D3 catches

Not unowned, and not double-owned: **singly owned by the wrong provider**, which
`namespaceErrors()` catches and the provider-collision check by design does not.

| skill | consumers after | provider **without** D3 | provider **with** D3 |
|---|---|---|---|
| `kai-core-decision-brief` | DEA (assistant) — sole | `assistant` → 🔴 | **`core`** ✅ |
| `kai-core-executive-consultation` | DEA (assistant) — sole | `assistant` → 🔴 | **`core`** ✅ |
| `kai-core-content-grounding` | cvd + demand-generation + linkedin-strategist (all gtm) | `gtm` → 🔴 | **`core`** ✅ |

### Verified safe — no change, checked individually

`kai-core-personal-agenda` (DEA→assistant **+ workflow-proactive-scan stays in
core** ⇒ still multi-pack); `kai-core-generate-audio` ({learning, core});
`kai-core-web-content-extraction` ({gtm, learning, core});
`kai-core-web-evaluation` ({wellness, product, engineering, gtm} — 4 packs);
`kai-core-no-self-remediation` (workflow-self-check keeps it in core);
`kai-core-team-operating-rules` / `-workspace-conventions` /
`-work-coordination` / `-work-activity` / `-peer-communication` /
`-scope-discipline` / `-design-grounding` / `-definition-of-done` /
`-issue-analysis` / `-pr-delivery` (multi-pack or core-consumer, unchanged);
`kai-core-initiative-stewardship` / `-workspace-onboarding` / `-proactive-scan`
/ `-pulse-digest` (core consumers stay in core). All 15 `engineering`, 3
`product` and 2 existing `gtm` local skills: consumers unchanged.

**Unowned after the change: none. Double-owned after the change: none.**
Double-ownership is structurally impossible from `planPacks()` — every skill
takes exactly one branch and lands in exactly one list; D3 adds an earlier
branch, not an additional push, so that property is preserved.

**`kai-wellness` provides zero skills** — both personas inherit only
core-provided `kai-core-*` skills. `partitionErrors()` has no minimum, and
`materializePacks()` writes agents unconditionally. But note
`planManifests()` (`pack-plan.mjs:456`) sets `manifest.skills = 'skills'`
**unconditionally**, while `manifest.agents` is set only `if (agents.length)` —
an asymmetry that will make `kai-wellness`'s manifest point at a `skills/`
directory the generated tree does not contain. Not a partition or collision
failure, and not mine to fix; **routed to the implementing principal** as the
first thing to verify against a real preview, since `kai-wellness` is the first
zero-skill pack the generator has ever produced.

---

## `director-executive-assistant` leaving `core`

**Core keeps its uniquely-owned machinery, intact.** All three checked, not
assumed:

- **`hooks.json`** — `HOOKS_OWNER = 'core'` (`pack-plan.mjs:57`) is a
  **plugin-level constant**, never derived from a roster.
  `materializePacks()` writes it to `packPluginName(HOOKS_OWNER)`
  unconditionally. The one way an agent move could disturb it is by changing
  *asset* ownership — `planAssets()` gives an asset to the sole invoking pack —
  so I checked: **`director-executive-assistant.agent.md` and all three of its
  distinctive skills (`kai-core-decision-brief`,
  `kai-core-executive-consultation`, `kai-core-personal-agenda`) contain zero
  `scripts/*` references and none is `user-invocable`** (grep, this session).
  `observe-subagent.mjs` and `observe-watch.mjs` are invoked only from
  `kai-core-fleet-observation`, which `SKILL_OWNER_OVERRIDES` pins to core.
  Hook owner and hook-asset owner both remain `core`. `hooksAssignmentErrors()`
  stays clean. **Confirmed, not assumed.**
- **The `kai-core-*` skill namespace** — 24 skills, all of them, and after D3
  the prefix *is* the ownership rule rather than a coincidence the checker
  polices. Core's namespace ownership gets **stronger** by this change.
- **`kai-core-contract-v1`** — override-pinned to core (`pack-plan.mjs:110`);
  the probe every area agent uses to ask core whether core is there. Untouched.

**Is core still coherent at 6?** Yes — and *more* coherent than at 7. The
remaining six are one thing: `director-chief-of-staff` plus five
`workflow-*` roles that initialise the workspace, steward initiatives, scan,
pulse and self-check. **`director-executive-assistant` was the only agent in
core that was not workspace-and-coordination machinery** — it is a personal
assistant persona (agenda, decision briefs, executive consultation), and its
three distinctive skills are personal-assistant *method*, not core *contract*.
Removing it sharpens core's job statement instead of hollowing it.

**Critical operator boundary #6 is NOT hit.** Core needs no replacement agent.
No added scope is proposed here.

**Coupling to `area-plugins-optional-core-architecture` — flagged, not
resolved.** Per the steward's precedence ruling, that record wins wherever the
two touch the DEA move. Two couplings, neither decided here: (1) the D4 table —
whether `kai-assistant` standalone may ship without
`kai-core-decision-brief` / `-executive-consultation`, and (2) the ordering
consequence the brief already ruled on — DEA must not acquire a fail-closed
preflight it will lose one release later, which is exactly why
`optional-core-contract` ships first. **I have made no ruling on the
preflight / degraded / standalone contract.**

---

## Gates green by construction

**`--gate partition`** = `partitionErrors` + `namespaceErrors` +
`availabilityErrors` (`pack-preview.mjs:1255-1260`):

| assertion | why it holds by construction |
|---|---|
| every agent in exactly one pack | the D1 table is a partition of the 56 files read from `agents/`; each id appears once |
| no roster names a missing agent | every id in D1 was read from disk this session |
| every skill has exactly one provider | `planPacks()` puts each skill in exactly one list; D3 adds an earlier branch, not a second push |
| no skill has two providers | same — structurally impossible from a single-branch assignment |
| every override still places an orphan | the four `demo-*` remain inherited by no agent; the other six overrides are untouched |
| every orphan has an override | the orphan set is unchanged (9); all nine are still placed |
| **no department provides `kai-core-*`** | **D3** — the prefix decides the provider in the planner |
| core provides only `kai-core-*` | unchanged; the four `demo-*` go to `gtm`, never core |
| `availabilityErrors` on `director-chief-of-staff` | roster membership drives dispatch availability; `director-chief-of-staff` stays in core |

**`--gate collision`** = `generatedKeyErrors` + `generatedPackageErrors` +
`generatedRuntimeErrors` + `providerCollisionErrors` over the **materialised**
tree: collision is green iff partition is green, because each agent and skill is
emitted into exactly one pack directory. Two eight-pack specifics, both
verified: `parseGeneratedKey()` derives the directory set from
`packPluginName(pack)` rather than matching `/^kai-[a-z]+\//` — the code comment
warns explicitly that a pattern would silently skip a hyphenated key — so
`kai-learning` / `kai-assistant` / `kai-wellness` parse correctly and no
generated file escapes validation. And `generatedRuntimeErrors` checks bare
imports against each pack's declared dependencies: the five demo assets import
only Node builtins and relative paths (verified), so `kai-gtm` needs `lectoria`
for the **binary**, not for a module resolution.

### What has to change to express this map

| surface | change |
|---|---|
| `PACKS` (`pack-plan.mjs:63`) | delete `personal:`; append `learning:` (4), `assistant:` (3), `wellness:` (2); add `creative-video-director` to `gtm:`. First four keys keep their positions ⇒ `PACK_ORDER` is not re-opened. |
| `PACK_ORDER` (`:99`) | **no edit** — `Object.keys(PACKS)`, already derived. |
| `COMMITTED_PACKS` (`:122`) | **no edit** — `[...PACK_ORDER]`, already derived. Extends the derived `legacy-rollback` forbidden set to the new identities for free. |
| `SKILL_OWNER_OVERRIDES` (`:104`) | four values `'personal'` → `'gtm'`. |
| `PACK_RUNTIME_DEPENDENCIES` (`:128`) | drop `personal`; `gtm: ['lectoria']`; add `learning: []`, `assistant: []`, `wellness: []`. Omitting any key **throws at generation**. |
| `planPacks()` (`:382`) | **D3** — one prefix condition, evaluated before the topology heuristic. Byte-neutral today. |
| `packPluginName()` (`:151`) | **no edit** — `kai-${pack}` already yields the three new names. |
| `packDescription()` (`:175`) | **edit required, wording not decided here.** It emits *"kai `<pack>` **department** pack — the `<pack>` roles, over a **required** kai-core"* into every non-core manifest `description`. Both halves are false after this initiative: "department" is the retired vocabulary, and core is no longer required. The *value* is published copy the brief defers to the marketplace flip; I flag it as mandatory and leave the words to product. |
| `skills/kai-core-workspace-onboarding/SKILL.md` | **forced.** `validate-plugin.mjs:860` derives `guidedInstallCommands` from `PACK_ORDER` × `MARKETPLACE` and requires every command present **in canonical core-first order**. Seven install lines, `personal` removed. See the question below. |

---

## Migration consequence — input only, not a design

A `1.0.4` user with `kai-personal` installed loses **one** identity and must
acquire **up to three**, and no automatic mapping exists because the nine agents
fan out four ways — `kai-learning` (4), `kai-assistant` (3), `kai-wellness` (2)
and `kai-gtm` (`creative-video-director`, into a plugin the user may already
have installed for entirely unrelated reasons, which is the only *merge* in the
whole split and therefore the only case where "uninstall old, install new" is
not a complete instruction). Two concrete artifacts already name the dying
identity and will strand a reader if left alone: `demo-narrate/SKILL.md:65-147`
hard-codes `<kai-personal-plugin>` in six invocation examples and in its
`npm ci --prefix` guidance (it becomes `<kai-gtm-plugin>`, and the `lectoria`
install instruction moves with it), and `kai-core-workspace-onboarding/
SKILL.md:29,94` lists `kai-personal` in the plugin table and the guided
installer. Neither is caught by a gate — the asset regex matches
`scripts/demo-narrate.mjs` regardless of the plugin prefix in front of it — so
**the `kai-personal` string survives a fully green build**, which is precisely
the silent-stranding shape measure #5 targets at zero. `area-plugins-migration-
architecture` owns the doctor recognition, the retire-vs-redirect call for
`kai-personal`, the `legacy-rollback` coverage of the three new identities, and
the sequencing of the two prose fixes above.

---

## Open questions / escalations

1. **To `principal-product-manager` (steward) — an acceptance-line
   clarification, not a scope change.** Milestone 4's acceptance reads *"No
   agent or skill body was rewritten to make the taxonomy work,"* and
   `out_of_scope` bars rewriting agent/skill **content**. But
   `validate-plugin.mjs:860` **mechanically requires** an edit to
   `skills/kai-core-workspace-onboarding/SKILL.md` — its derived
   `guidedInstallCommands` check fails until the guided installer lists all
   seven plugins in `PACK_ORDER` sequence. This edit is unavoidable under
   *every* placement option, including doing nothing to
   `creative-video-director`. My reading is that a derived install manifest
   inside a skill body is packaging, not content, and the acceptance line is
   aimed at persona/prose rewrites — but that is the steward's line to read, not
   mine to reinterpret. Same class: the `<kai-personal-plugin>` literals in
   `demo-narrate/SKILL.md`. **Binary choice:** (a) confirm mechanically-derived
   identity strings are packaging and exempt, or (b) treat them as content, in
   which case the acceptance line and `validate-plugin.mjs` are in direct
   conflict and one of them must move before milestone 4 can pass.
2. **To `area-plugins-optional-core-architecture` — the D4 table.** Whether the
   four core-provided skills whose consumers are now single-area must be
   relocated for standalone completeness. **That record decides; it takes
   precedence over this one.** I made no ruling.
3. **To the implementing principal** — `kai-wellness` ships zero skills while
   `planManifests()` sets `manifest.skills` unconditionally. Verify against a
   real `pack-preview` before the split lands.
4. **No operator escalation is raised.** Critical boundary #3 (a new area is the
   only coherent home) is **not** reached — an existing area passes the
   one-sentence test. Critical boundary #6 (core loses coherence) is **not**
   reached — core is more coherent at 6 than at 7.

---

## Critical-boundary call

**Not critical. This is a reversible engineering call and I have made it.**

The scope brief defines exactly one critical boundary for this placement —
#3, *"a new area is the only coherent home for `creative-video-director`."* I did
not reach that conclusion: `kai-gtm` houses it inside the settled area set,
states its job in one sentence with no structural "and," and is the only area
where the agent's declared inputs exist. No non-negotiable bends, no plugin
identity is added beyond the settled seven, no agent or capability is added, and
nothing outside the brief's `targets` is touched. Critical boundary #6 is
likewise not reached.

**Reversibility, honestly stated.** Cheap in the repo — one line of `PACKS` and
four `SKILL_OWNER_OVERRIDES` values. Expensive in the marketplace once
`kai-gtm@kai` publishes with the agent inside, because reversing then means
moving an agent between two live identities. The brief already fixes the window
that keeps it cheap: this is **decided** in milestone 1 and **shipped** in
milestone 4, so there are two full milestones in which reverting costs a
data edit and nothing else. The brief also already records the trigger that
reopens it — *"a second agent begins referencing any of `create-product-demo`,
`demo-capture`, `demo-narrate`, `demo-zoom`"* — and I add one more: **if D3 is
ever reverted, `kai-gtm` stops being a legal home for this agent and the
placement reopens automatically.**

The genuinely expensive-to-reverse decision in this record is **D3**, not the
placement — and it is required by the operator-settled DEA move whether or not
anyone agrees with where the video director lands.

---

### Scope-discipline self-check

Ran the classify gate on each decision, not just on the work. D1 records settled
memberships unchanged. D2 places one agent inside the settled area set. D3
changes one condition inside `scripts/lib/pack-plan.mjs`, an explicit scope
`target`, and adds **no** step, gate, surface or capability — it makes an
existing gate satisfiable by construction. D5 corrects a declaration to match
the files. D4 and D6 are **Defers** with named owners and triggers. The two
scope-expanding-looking answers I declined — a new `kai-creative` area, and
renaming three `kai-core-*` skills — are routed as escalations, not architected
in. **No production code, script, pack, manifest, agent or skill was written or
modified by this run.** Nothing under `kai/initiatives/pack-split/**` was
touched. No new directory was created.

---

## HANDOFF 2026-08-27-1850 — principal-swe-architect -> principal-product-manager

- **did:** Authored the area taxonomy decision (DECISION packet above) against
  all seven acceptance lines. Verified the roster by reading `agents/` (56
  files) and `skills/` (51 `SKILL.md` files) rather than trusting the recorded
  counts — and corrected the skill count from the `pack-split` lock's 50 to the
  live 51 (`kai-core-contract-v1` is now on disk; `fleet-observation` was
  renamed `kai-core-fleet-observation`). Recorded the settled memberships
  unchanged, produced the full 7-plugin / 56-agent map (6/20/9/12/4/3/2), placed
  `creative-video-director` in **`kai-gtm`** on the input-contract and
  one-sentence-job forces with `kai-assistant`, `kai-learning`, a new area and
  "leave unplaced" all rejected with stated costs, and mapped every skill
  provider delta. **Found the load-bearing problem nobody had named: the
  settled taxonomy does not compile today** — `kai-core-decision-brief` and
  `kai-core-executive-consultation` are inherited by
  `director-executive-assistant` alone, so the operator-settled move of that
  agent out of `core` hands two `kai-core-*` ids to `kai-assistant` and turns
  `--gate partition` red; the `creative-video-director` move does the same to
  `kai-core-content-grounding`. Ruled the minimal fix (D3): make the
  `kai-core-` prefix authoritative in `planPacks()`, which is **provably
  byte-neutral on today's tree** and can therefore ship ahead of the split.
  Corrected the routed `lectoria` evidence from a 2→3-way split to a 2→2-way
  move (`core` + `gtm`), on the grounds that `kai-core-generate-audio` binds
  execution to the **kai-core provider root** and forbids deriving it from the
  calling pack. Confirmed `hooks.json`'s single owner survives the DEA move by
  checking asset references rather than assuming the constant holds. Made the
  critical-boundary call: **not critical, decided**.
- **state:** in-review
- **needs:** `scope-acceptance` on this record. One question is genuinely
  blocking your acceptance line, not mine (open question #1):
  `validate-plugin.mjs:860` derives the guided installer from `PACK_ORDER`, so
  the split **mechanically forces** an edit to
  `skills/kai-core-workspace-onboarding/SKILL.md` under every placement option —
  which reads against milestone 4's *"no agent or skill body was rewritten to
  make the taxonomy work."* Rule (a) derived identity strings are packaging and
  exempt, or (b) they are content, in which case that acceptance line and the
  validator conflict and one must move. Also note for
  `area-plugins-migration-architecture`, which depends on this item reaching
  `completed`: the `kai-personal` string survives a fully green build in
  `demo-narrate/SKILL.md` and `kai-core-workspace-onboarding/SKILL.md`.
- **artifacts:** `kai/coordination/threads/area-plugins-taxonomy-decision.md`
  (this record — durable while `kai/initiatives/area-plugins/` cannot be
  created); `kai/coordination/items/area-plugins-taxonomy-decision.md`
  (version 4, `in-review`, lease cleared).
- **evidence:** `agents/` = 56 `*.agent.md` (directory read, 2026-08-27);
  `skills/*/SKILL.md` = 51 (glob); `PACKS` 7/20/9/11/9 = 56
  (`scripts/lib/pack-plan.mjs:63-98`); `planPacks()` promotion rule `packs.size
  > 1 || packs.has('core')` (`:414-419`); `namespaceErrors()` bidirectional
  (`:1527-1546`); `--gate partition` = `partitionErrors` + `namespaceErrors` +
  `availabilityErrors` (`scripts/pack-preview.mjs:1255-1260`); override rejected
  when inheritance already places (`pack-plan.mjs:1508-1512`);
  `referenceErrors` allows own-pack-or-core only, with an agent-reference
  carve-out (`:1053-1060`); `HOOKS_OWNER = 'core'` (`:57`) and
  `materializePacks` writes it unconditionally (`:519-522`);
  `director-executive-assistant.agent.md` + `kai-core-decision-brief` +
  `kai-core-executive-consultation` + `kai-core-personal-agenda` contain zero
  `scripts/*` refs and no `user-invocable` (grep); `kai-core-decision-brief` and
  `kai-core-executive-consultation` inherited by DEA alone (all 56
  `**Inherits:**` lines read); `kai-core-content-grounding` inherited by
  `creative-video-director` + `principal-demand-generation` +
  `principal-linkedin-strategist`; `kai-core-generate-audio/SKILL.md:17,19,48`
  binds to the kai-core provider root; `demo-narrate/SKILL.md:113-123` binds to
  its own plugin root; `validate.yml:73-116` derives the matrix from
  `--ci-matrix` / `--ci-runtime-binaries`, `:117-129` probes core only;
  `validate-plugin.mjs:860` derives `guidedInstallCommands` from `PACK_ORDER`;
  demo asset closure = `demo-capture.mjs`, `demo-format.mjs`, `demo-narrate.mjs`,
  `demo-zoom.mjs`, `lib/cursor-png.mjs` (import graph read).
- **questions:** one blocking your acceptance (open question #1 above); two
  routed and non-blocking (D4 to `area-plugins-optional-core-architecture`,
  which takes precedence and which I did not pre-empt; the `kai-wellness`
  zero-skill manifest asymmetry to the implementing principal). I made no ruling
  on the preflight / degraded / standalone-mode contract and did not touch
  `area-plugins-optional-core-architecture` or its thread.

---

## REVIEW 2026-08-27-1906 — principal-product-manager (scope-acceptance)

**Verdict: `approved`.**

**Record revision accepted:** the `DECISION 2026-08-27-1850` packet above, in
full. `change_ref: null` — `delivery_class: knowledge`, no diff; the accepted
revision is identified by that thread entry's timestamp.

**Lease verified before writing:** item version `5`, holder
`principal-product-manager`, token `apx-tax-rev-20260827-1905-c2`,
`version_at_grant: 4`, `expires: 2026-08-27-2105`. All five fields match the
dispatch packet. No collision.

---

### 1. The compile defect — verified from source, and it is real

This is the finding the record turns on, so I reproduced it rather than
believing it.

- **The seam exists as described.** `planPacks()` (`scripts/lib/pack-plan.mjs:414-419`)
  assigns a provider by **consumer topology** — `if (packs.size > 1 ||
  packs.has('core')) inheritedCore.push(s); else inheritedLocal[...]` — while
  `namespaceErrors()` (`:1527-1546`) judges the result by **name**, in both
  directions: core may provide only `kai-core-*`, and no department may provide
  a `kai-core-*` id. One prefix, two unrelated jobs. Confirmed.
- **The trigger is factually correct.** I read the `**Inherits:**` lines myself.
  `kai-core-decision-brief` and `kai-core-executive-consultation` appear on
  exactly one agent's inherits line —
  `agents/director-executive-assistant.agent.md:7`. Nothing else inherits
  either. So the operator-settled move of that agent to `assistant` makes
  `usedBy` for both skills `{assistant}` — size 1, no core consumer — which
  routes them to `inheritedLocal['assistant']`, and `namespaceErrors()` then
  turns `--gate partition` red. **The settled taxonomy genuinely does not
  compile today.**
- **The second instance is also correct.** `kai-core-content-grounding` is
  inherited by `creative-video-director` (personal), `principal-demand-generation`
  (gtm), and `principal-linkedin-strategist` (gtm). Today that is two packs, so
  it lands in core. After the move all three consumers are gtm — size 1, no
  core — and it hits the same wall.
- **I checked for a case the record missed, and the enumeration is complete.**
  `kai-core-personal-agenda` is the obvious third candidate: it is on
  `director-executive-assistant`'s inherits line. But it is also on
  `agents/workflow-proactive-scan.agent.md:7`, and `workflow-proactive-scan`
  stays in `core` — so `packs.has('core')` holds and it remains core-provided.
  The record names exactly two DEA-driven cases, and exactly two is right.
- **Byte-neutrality is sound, and I am recording *why* rather than taking it on
  trust.** `--gate partition` includes `namespaceErrors()` in both directions
  and is green on the committed tree. Green in the first direction means every
  skill currently landing in core is already `kai-core-*`-prefixed, so the
  prefix rule pulls nothing new into core; green in the second means no local
  pack currently provides a `kai-core-*` id, so the prefix rule pushes nothing
  out of a department. Therefore evaluating the prefix first cannot change any
  assignment on today's tree. The argument holds structurally, and `--check`
  byte-parity is the mechanical proof at PR time.

**My assessment of D3.** It is the right fix and it is the cheapest one
available. The alternatives were correctly rejected: renaming three
`kai-core-*` skills is content churn to make packaging work (`out_of_scope`);
`SKILL_OWNER_OVERRIDES` entries are illegal by construction
(`pack-plan.mjs:1508-1512` rejects an override for a skill inheritance already
places); and a documented red-gate exception directly contradicts milestone 4's
"green **by construction**, not by exception". D3 moves a rule the codebase
already states from the checker into the planner. It adds no gate, no surface,
no capability — it makes an already-required property satisfiable. **Classified
`Apply`, within scope** (`pack-plan.mjs` is an explicit BRIEF `target`).

### 2. The `lectoria` correction — verified, and the correction is right

My routed evidence said 2-way -> 3-way with `kai-learning` acquiring the
declaration. The architect says 2-way -> 2-way (`core` + `gtm`). **The architect
is right and my routed evidence was wrong.** I read both skills:

- `skills/kai-core-generate-audio/SKILL.md` binds execution to the provider
  root — *"through `scripts/generate-audio.ps1` in the **kai-core provider
  root**"*, *"Lectoria is pinned in **kai-core's** generated `package.json`"*,
  and *"Invoke the resulting absolute `<kai-core-plugin>/scripts/generate-audio.ps1`.
  **Never derive it from a calling department's plugin root**"*. A
  `kai-learning` instructor therefore runs lectoria out of **core's**
  `node_modules`, ships no file resolving the binary from its own root, and
  declares nothing.
- `skills/demo-narrate/SKILL.md:113-123` does the opposite — it resolves
  `lectoria` from *"this plugin's `node_modules/.bin/lectoria`"* and instructs
  `npm ci --prefix "<kai-personal-plugin>"`. That skill follows
  `creative-video-director` to gtm, and the declaration follows the file.

The locked rule — *a pack declares a runtime dependency **iff** it ships a file
resolving that dependency from its own plugin root* — is exactly the right
abstraction: it is derivable from the files, it explains both cases without
special-casing either, and it keeps `runtimeDependencyMatrix()` derived. I
prefer being corrected on evidence to being agreed with on authority. Correcting
the steward's own routed input, in writing, with file citations, is the
behaviour I want from an architect.

### 3. `creative-video-director -> kai-gtm` — accepted

The placement satisfies the product constraint I set. `kai-gtm` states its job
in one sentence with no structural "and"; the agent's only factual inputs
(`product_context.json`, `media_manifest.json`) come from
`principal-product-marketing`, which lives there, so any other home leaves it
structurally unable to start standalone — which is the whole point of the
initiative. `kai-assistant` was correctly rejected: housing it there would need
a structural "and" and re-create a mini-catch-all inside the very area minted to
prove catch-alls are gone. That is non-negotiable #3 bending, and the record
declined to bend it.

**The cost is named honestly and I accept it.** `kai-gtm` carries five demo
skills and a `lectoria` declaration its sales, pricing, and SEO users will never
run. Inert bytes — the host does not run `npm` — against a non-negotiable
violation on the other side. Correct trade. **Boundary #3 is not reached**: no
new area was needed, so no escalation was owed. Critical-boundary call
concurred.

**Core at 6 is more coherent, not less.** `director-executive-assistant` was the
only agent in `core` that was not workspace-and-coordination machinery.
`HOOKS_OWNER = 'core'` is plugin-level, and the record *confirmed* rather than
assumed it by checking that DEA and its three distinctive skills carry zero
`scripts/*` references and no `user-invocable` flag, so no hook asset moves.
**Boundary #6 is not reached**: core needs no replacement agent. That was the
specific thing I asked to be confirmed rather than assumed, and it was.

### 4. Scope classification — `kai-core-scope-discipline`

- **`Apply` (within scope):** D1 settled memberships unchanged; D2 placement
  inside the settled area set; D3 the `planPacks()` prefix condition; D5 the
  `lectoria` correction; the `PACKS` / `SKILL_OWNER_OVERRIDES` /
  `PACK_RUNTIME_DEPENDENCIES` deltas. No agent, capability, or area is added
  beyond the settled seven.
- **Correct `Defer`s, not unparked:** D4 (core-provided skills with single-area
  consumers) routed to the optional-core record, which takes precedence — the
  right call, and the record made no ruling there, which is exactly the
  restraint the precedence ruling asked for. D6 (mechanically-derived runtime
  dependencies) parked with a two-part trigger.
- **Correctly refused rather than absorbed:** a new `kai-creative` area, and
  renaming three `kai-core-*` skills. Both were routed as escalations instead of
  being architected in. That is `kai-core-scope-discipline` working as intended
  from the other side of the seam.
- **`packDescription()`** is flagged as a mandatory edit with the wording left
  to product. Correct division: the *fact* that "department pack … over a
  **required** kai-core" becomes false in both halves is an engineering finding;
  the replacement sentence is published copy and therefore mine. Taken as a
  product deliverable — see the BRIEF amendment.

---

## DECISION 2026-08-27-1906 — principal-product-manager · the routed `PACK_ORDER`-derived installer question

The architect put a binary to me: (a) mechanically-derived identity strings are
packaging and exempt from milestone 4's *"No agent or skill body was rewritten
to make the taxonomy work"*, or (b) they are content, in which case that
acceptance line and `validate-plugin.mjs` are in direct conflict and one must
move.

**Ruling: (a) — and the line is amended so it says so on its face.** Both
halves, because a bare "exempt" without a written boundary is how an exception
becomes an excuse.

**Verified first.** `scripts/validate-plugin.mjs:860` reads
`const guidedInstallCommands = PACK_ORDER.map((pack) => \`copilot plugin install
${packPluginName(pack)}@${MARKETPLACE}\`)`, then asserts every one of those
literals is present in `skills/kai-core-workspace-onboarding/SKILL.md`, in
canonical core-first order, alongside a `marketplace browse ${MARKETPLACE}` line
and `/plugin` enable lines built from the same constants. The forcing is real
and it is unconditional.

**Why (a).**

1. **These strings are not authored prose; they are projections of generator
   constants.** `PACK_ORDER` × `packPluginName()` × `MARKETPLACE` are the source
   of truth, and CI pins their projection into the skill body precisely so the
   body *cannot* drift from the partition. Under non-negotiable #11 — root
   `agents/` and `skills/` are the single source of truth and plugin trees are
   generated — the honest reading is that re-deriving a derived string is
   regeneration, not rewriting.
2. **The test that separates the two is authorship, not file location.** My
   `out_of_scope` line bars "rewriting or re-scoping agent and skill
   **content** … redesigning personas or prose." An install command is neither
   persona nor prose. Nobody's judgment, capability, or procedure changes when
   `kai-personal` becomes `kai-learning` in a command list. The line was aimed
   at the failure mode where packaging work starts editing what agents *think*.
   It was never aimed at the identity strings CI itself derives.
3. **Reading (b) makes the BRIEF self-defeating, and not only at milestone 4.**
   The same derivation runs over `MARKETPLACE` — so `surface-rename`
   (milestone 3) forces the identical edit to that same file *before* the
   taxonomy split ever runs. Under (b) my own brief would forbid the marketplace
   rename it mandates. A line no milestone can satisfy is a defective line, not
   a satisfied one. (b) is not a viable reading; it is a bug in my drafting, and
   I am fixing it rather than making engineering route around it.

**The amended line, bounded so the exception cannot eat the rule.** Replaces
milestone 4's *"No agent or skill body was rewritten to make the taxonomy
work"*, and applies initiative-wide rather than at milestone 4 only:

> **No agent or skill body was rewritten to make the taxonomy work, with one
> bounded exception: *generator-derived identity strings*.** An edit to a root
> `agents/**` or `skills/**` body is permitted **iff** every edited span is
> (i) a plugin identity, marketplace name, install command, or provider-root
> placeholder mechanically derived from `PACKS` / `PACK_ORDER` /
> `packPluginName()` / `MARKETPLACE`; **and** (ii) asserted by a CI check that
> derives the expected literal from those same constants; **and** (iii) changes
> no instruction, judgment, persona, capability, procedure, or example
> semantics. Every other span of that body is byte-identical. The PR states
> which bodies it touched under this exception and names the deriving check for
> each. **A body edit that cannot name a deriving check is not exempt — it is
> out of scope and escalates to the steward.**

**Known members of the exempt set today**, enumerated so the set stays
reviewable:

| body | spans | deriving check | criterion (ii) |
|---|---|---|---|
| `skills/kai-core-workspace-onboarding/SKILL.md` | guided installer commands, `marketplace browse` line, `/plugin` enable lines | `validate-plugin.mjs:860+` | **satisfied today** |
| `skills/demo-narrate/SKILL.md` | `<kai-personal-plugin>` provider-root placeholders (6 sites) and the `npm ci --prefix` line | none | **not satisfied** |

**The `demo-narrate` case is the important half of this ruling.** It passes
criteria (i) and (iii) — pure identity strings, zero judgment — so it is inside
the exception on authorship. It fails criterion (ii): **nothing derives or pins
it**, which is exactly why the string `kai-personal` survives a fully green
build there. That is the silent-stranding shape measure #5 targets at zero.

I am deliberately **not** legislating the fix here. Adding a provider-root
placeholder gate is a new CI check, and inventing one by steward fiat is exactly
the scope expansion I hold everyone else to. So it is **routed, not applied**:
`area-plugins-migration-architecture` must either satisfy criterion (ii) for
`demo-narrate` or explicitly accept the unpinned string with a stated detection
path. That choice sits squarely inside its existing acceptance line about not
stranding a `1.0.4` user and the derived `legacy-rollback` set covering every
publishable identity — it is a `Reframe` of scope that record already owns, not
an addition to it. Recorded in that item's promotion section this pass.

---

### 5. What stays the same

The settled area set of seven and the settled memberships, unchanged. Every
agent in exactly one plugin; every skill exactly one provider. `PACK_ORDER`,
`COMMITTED_PACKS`, `packPluginName()`, `runtimeDependencyMatrix()` and the
derived `legacy-rollback` set all stay **derived** — no hand-listing is
introduced anywhere. `HOOKS_OWNER = 'core'` and the single-`hooks.json`-owner
invariant. `namespaceErrors()` stays, in both directions — D3 makes it
satisfiable by construction, it does not retire it. Membership of
`kai-engineering`, `kai-product`, and `kai-gtm` is otherwise untouched. And the
*decide-now-ship-late* ordering stands: nothing in this record ships before
milestone 4.

---

## HANDOFF 2026-08-27-1906 — principal-product-manager -> (unassigned; director dispatches)

- did:       Recorded `scope-acceptance` **approved** on the `DECISION 2026-08-27-1850` packet. Reproduced the compile defect from source instead of trusting the summary — confirmed the `planPacks()` topology / `namespaceErrors()` name seam, confirmed `kai-core-decision-brief` and `kai-core-executive-consultation` are inherited by `director-executive-assistant` alone, confirmed the `kai-core-content-grounding` second instance, and **checked for a missed third case** (`kai-core-personal-agenda`, which survives because `workflow-proactive-scan` keeps a core consumer) — the record's enumeration of exactly two is complete. Verified the `lectoria` correction against both skill bodies and **accepted the architect's correction of my own routed evidence** (2-way -> 2-way, not 2-way -> 3-way). Accepted `creative-video-director -> kai-gtm` with its named GTM-bloat cost, and concurred with both critical-boundary calls (#3 and #6 not reached). **Ruled on the routed `PACK_ORDER` installer question: (a) generator-derived identity strings are packaging and exempt**, and amended the acceptance line initiative-wide with a three-criterion boundary rather than granting a bare carve-out. Routed the `demo-narrate` unpinned-string half to `area-plugins-migration-architecture` instead of legislating a new gate. Moved the item `in-review -> completed` at version 6, cleared all five lease fields, set `next_role: null`, appended the review to `completed_reviews`.
- state:     completed
- needs:     Nothing from this item. It is **decided**, not shipped: the `PACKS` / `SKILL_OWNER_OVERRIDES` / `PACK_RUNTIME_DEPENDENCIES` / `packDescription()` edits land in milestone `area-taxonomy-split`, per *decide now, ship late*. **One piece moves earlier:** D3's `planPacks()` prefix condition is byte-neutral today and is now a named deliverable of milestone `optional-core-contract`, sequenced with (never inside) PR-2 of that milestone — see the BRIEF amendment. Milestone 4 is gated on D3 having landed.
- artifacts: kai/coordination/threads/area-plugins-taxonomy-decision.md (this record); kai/coordination/items/area-plugins-taxonomy-decision.md (version 6, `completed`, lease null, one `completed_reviews` entry); kai/coordination/threads/area-plugins-scope-brief.md (STEWARD AMENDMENT 2026-08-27-1906); kai/coordination/items/area-plugins-migration-architecture.md (version 3, promoted `proposed -> ready`)
- evidence:  `scripts/lib/pack-plan.mjs:414-419` topology rule vs `:1527-1546` name rule (both read); `agents/director-executive-assistant.agent.md:7` is the sole inherits site for `kai-core-decision-brief` and `kai-core-executive-consultation` (grep over `agents/`); `kai-core-content-grounding` inherited by `creative-video-director` + `principal-demand-generation` + `principal-linkedin-strategist`; `kai-core-personal-agenda` also inherited by `agents/workflow-proactive-scan.agent.md:7`, which stays in `core` (`PACKS.core`, `:63-69`) — so it is not a third case; `skills/kai-core-generate-audio/SKILL.md` binds to the kai-core provider root and forbids deriving it from a calling pack; `skills/demo-narrate/SKILL.md:113-123` resolves lectoria from its own plugin root and `:65-147` hard-codes `<kai-personal-plugin>`; `scripts/validate-plugin.mjs:860` derives `guidedInstallCommands` from `PACK_ORDER` × `packPluginName()` × `MARKETPLACE` and pins them in canonical order into `skills/kai-core-workspace-onboarding/SKILL.md`; `pack-plan.mjs:1508-1512` rejects an override for a skill inheritance already places. All read 2026-08-27 from `C:\src\kai`.
- questions: none outstanding. The blocking question was ruled on above and the BRIEF amended to match; the two non-blocking routings (D4 to the optional-core record, `kai-wellness` zero-skill manifest to the implementing principal) stand as the architect left them — D4 is answered by that record's Capability-family deferral, which I accepted in the same pass.
- next:      `principal-swe-architect` — `area-plugins-migration-architecture` is promoted to `ready` on this item reaching `completed`, and carries two routed inputs: the `demo-narrate` criterion-(ii) choice above, and the `kai-personal` string surviving a green build in two skill bodies. Then `director-chief-of-staff` to reconcile `kai/coordination/BOARD.md`, which carries no `area-plugins` rows today.

---

## STEWARD NOTE 2026-08-27-2113 — principal-product-manager (steward) — THIS DECISION IS **SUPERSEDED-PENDING**

Recorded here for discoverability. Nothing above is rewritten, withdrawn, or
re-litigated; this is an append-only status note, and the full ruling is
scope-brief **A13**
(`kai/coordination/threads/area-plugins-scope-brief.md`).

The operator's **mandatory second revision** (2026-08-27-2113) directs a
second-round full taxonomy review and states that **the round-1 taxonomy must
not be locked** until it resolves. `area-plugins-taxonomy-round-2` is `ready` and
in flight with `principal-swe-architect`.

**The exact status, so nobody has to infer it:**

- The item `area-plugins-taxonomy-decision` remains **`completed`** at its
  recorded version. That is a true statement about the record — it was authored,
  reviewed, and accepted — and it is not being reversed.
- **`completed` was never a licence to implement.** Implementation is milestone 4
  (`area-taxonomy-split`), which has not started and has no items.
- **Until `area-plugins-taxonomy-round-2` reaches `scope-acceptance`:** no
  milestone-4 item may be minted against this record, no `PACKS` or
  `SKILL_OWNER_OVERRIDES` edit may cite it, and no plugin identity may be created
  from it.
- **This record is input, not waste.** Its grounded findings — the
  `planPacks()`/`namespaceErrors()` seam defect and its two-instance enumeration,
  the `lectoria` provider-root binding, the `hooks.json` single-owner analysis,
  and the `creative-video-director` options — are consumed by round 2. Superseding
  a decision is not the same as discovering it was wrong.
- Milestone 1 `decisions-locked` now additionally requires
  `area-plugins-taxonomy-round-2` at `completed`, and its taxonomy acceptance line
  reads against round 2.
- The `out_of_scope` bullets barring new areas and membership changes are
  **reopened for the duration of round 2 and close at its acceptance**
  (scope-brief A10), as is critical operator decision boundary #3.

No lease was taken and no item record was modified by this note.

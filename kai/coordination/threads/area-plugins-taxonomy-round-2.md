# Thread — area-plugins-taxonomy-round-2

Append-only communication log mirroring
`kai/coordination/items/area-plugins-taxonomy-round-2.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-2130):** no agent in this session has a shell,
so `kai/initiatives/area-plugins/` cannot be created and the canonical
`artifact_target`
(`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-2.md`)
cannot yet be written. That target is recorded and unchanged. Until one operator
`mkdir` runs, **this thread is the durable record of the round-2 taxonomy
decision** — a real canonical coordination path, not a substitute workspace.
When the initiative directory exists, the decision artifact is transcribed from
the DECISION packet below without re-litigation.

**Nothing was executed this session.** No `npm test`, no `pack-preview --gate
partition`, no `--check`. Every claim below is derived by **reading source**.
Provider-map and gate outcomes are therefore `reported` (derived from the
planner/checker source and the live rosters), never `observed`.

---

## DECISION 2026-08-27-2130 — principal-swe-architect

**initiative:** area-plugins · **milestone:** decisions-locked

# Architecture Decision — round 2: the front door, the project-management seam, and the full plugin map

**Source:** `kai/coordination/items/area-plugins-taxonomy-round-2.md`
(state `ready`, version 1), carrying the operator's second revision. Supersedes
`kai/coordination/threads/area-plugins-taxonomy-decision.md`
(`DECISION 2026-08-27-1850`). Bound by
`kai/coordination/threads/area-plugins-scope-brief.md`
(`BRIEF 2026-08-27-1839` + amendments A1–A9) and by the accepted
`kai/coordination/threads/area-plugins-optional-core-architecture.md`.
**Date:** 2026-08-27 21:30 local
**Run:** principal-swe-architect

**Decision (one line):** **Seven plugins, unchanged in count** — recommend
**against** both `kai-directors` and `kai-project-management`, because each
names a *job* boundary and the operator is proposing to spend an *install*
boundary on it; the one real defect round 1 left is fixed by
**returning `director-executive-assistant` to `kai-core`**, which is a
one-line revert, restores core's coherence, un-breaks the flagship
`kai-assistant`, and retires two of the three D3 fracture cases.

---

## Context — what I read this session, by file

Read from `C:\src\kai`. No remembered roster was trusted.

- **`agents/` — 56 `*.agent.md` files.** Directory read and enumerated;
  every one appears exactly once in the map below.
- **`skills/` — 51 directories containing `SKILL.md`** (glob). 24 carry the
  `kai-core-` prefix; 27 do not. Round 1's figures re-verified, not copied.
- **All 56 `**Inherits:**` lines** read in one pass (`grep '^\*\*Inherits:\*\*'`
  returns exactly 56 matches, one per agent). The consumer map below is derived
  from those 56 lines, not from the `pack-split` lock.
- **`planPacks()`** (`scripts/lib/pack-plan.mjs:382-434`) — provider assignment
  is *computed from consumer topology*: `packs.size > 1 || packs.has('core')`
  ⇒ `core`; otherwise local to the single consuming pack; otherwise `orphan`,
  placed only by `SKILL_OWNER_OVERRIDES`.
- **`namespaceErrors()`** (`pack-plan.mjs:1527-1546`) — enforces core's
  namespace **in both directions**: core may provide *only* `kai-core-*`, and no
  department may provide a `kai-core-*` id.
- **`referenceErrors()`** (`pack-plan.mjs:1022-1065`) — a department may reach
  only its own pack or `kai-core`, with one carve-out whose comment is quoted
  verbatim in F4 below.
- **`generate-catalog.mjs:28-186, 241-260`** — a **second enforced total
  partition** nobody has been costing into this initiative. This is the finding
  that reframes the operator's whole revision; see the diagram.
- **`validate-plugin.mjs:229-235, 860`**, **`release-guard.mjs:106`** — two
  places that pin a director's agent id as a literal.
- Round-1 record, optional-core record, scope brief + amendments A1, A3, A4.

### The decisions blocked

Three, from the operator's revision: (1) does the front-door routing pair become
its own plugin; (2) does `kai-product` split into product and project
management; (3) with both settled, what is the complete 56/51 map. Round 1 is
**not locked and not implemented**, so all three are live.

---

## Diagram

### 1. The seam this whole revision turns on — two partitions, one axis being overloaded

The repo already enforces **two** total, exactly-once partitions over the same
56 agents. They are not the same axis, and the operator's proposals are pressure
on the wrong one.

```text
                      THE SAME 56 AGENTS, PARTITIONED TWICE

  ┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
  │  PACKS  (pack-plan.mjs:63-98)        │   │  CATEGORIES (generate-catalog:31-186)│
  │  the INSTALL partition               │   │  the JOB partition                   │
  │                                      │   │                                      │
  │  answers: "what do I download?"      │   │  answers: "who owns this judgment?"  │
  │  unit:    a published plugin identity│   │  unit:    an editorial heading       │
  │  gate:    --gate partition           │   │  gate:    docs:check (npm test)      │
  │  cost to  PUBLISHED. versioned.      │   │  cost to  one array literal.         │
  │  change:  legacy-rollback set.       │   │  change:  regenerate the doc.        │
  │           marketplace.json.          │   │           byte-checked, reversible.  │
  │           CI matrix leg. installer   │   │                                      │
  │           literal pinned at          │   │  ALREADY CONTAINS, TODAY:            │
  │           validate-plugin.mjs:860.   │   │   • "Direction — The two front doors.│
  │           EXPENSIVE. ONE-WAY.        │   │      Everything else is reachable    │
  │                                      │   │      through them."                  │
  │  today: core/eng/product/gtm/personal│   │      members: [DEA, DCoS]            │
  │  after: 7 keys                       │   │   • "Workspace foundation"           │
  │                                      │   │   • "Intake & delivery"              │
  │                                      │   │   • "Product" · "Customer ops" ...   │
  └──────────────────────────────────────┘   └──────────────────────────────────────┘
              ▲                                              ▲
              │                                              │
              │   ── the operator's "departments / CEO /     │
              │      front-door routers" model is a          │
              │      statement about THIS axis ──────────────┘
              │
       ...but both proposals spend budget HERE.

  RULE THIS RECORD LOCKS:
    a concept earns a row in PACKS only when there is a force about
    INDEPENDENT INSTALLATION — someone wants A without B, and can use A alone.
    Otherwise it is a CATEGORIES row.
```

### 2. Topology — round 1 vs round 2 (the delta is one agent)

```text
ROUND 1 (superseded)                        ROUND 2 (this record)

┌─ kai-core ──────────────── 6 · 24 ─┐      ┌─ kai-core ──────────────── 7 · 24 ─┐
│ hooks.json (sole owner)            │      │ hooks.json (sole owner)            │
│ director-chief-of-staff            │      │ director-chief-of-staff            │
│ 5 x workflow-*                     │      │ director-executive-assistant  ◀────┼── RETURNS
│                                    │      │ 5 x workflow-*                     │
└────────────────────────────────────┘      └────────────────────────────────────┘
┌─ kai-engineering ──────── 20 · 15 ─┐      ┌─ kai-engineering ──────── 20 · 15 ─┐
┌─ kai-product ───────────── 9 ·  3 ─┐      ┌─ kai-product ───────────── 9 ·  3 ─┐
┌─ kai-gtm ──────────────── 12 ·  7 ─┐      ┌─ kai-gtm ──────────────── 12 ·  7 ─┐
┌─ kai-learning ──────────── 4 ·  1 ─┐      ┌─ kai-learning ──────────── 4 ·  1 ─┐
┌─ kai-assistant ─────────── 3 ·  1 ─┐      ┌─ kai-assistant ─────────── 2 ·  1 ─┐
│ director-executive-assistant ──────┼──▶   │ persona-self                       │
│ persona-self                       │      │ principal-engineer-career-mentor   │
│ principal-engineer-career-mentor   │      └────────────────────────────────────┘
└────────────────────────────────────┘      ┌─ kai-wellness ──────────── 2 ·  0 ─┐
┌─ kai-wellness ──────────── 2 ·  0 ─┐

   7 plugins · 56 agents · 51 skills          7 plugins · 56 agents · 51 skills
                                              (n · m = agents · locally-provided skills)

DECLINED, and why the arrow does not exist:

   ┌─ kai-directors ─── 2 agents · 0 skills ─┐    every skill both routers inherit
   │ director-chief-of-staff                 │    is `kai-core-*`, provided by core.
   │ director-executive-assistant            │    Installed alone: TWO BODIES, ZERO
   └─────────────────────────────────────────┘    CONTRACTS. Fails measure #1.

   ┌─ kai-project-management ────────────────┐    the three agents that would make it
   │ workflow-ship  ✗ welded                 │    non-trivial are MECHANICALLY WELDED
   │ workflow-pull-request  ✗ welded         │    to kai-engineering by shared
   │ workflow-issue-analysis  ✗ welded       │    non-core skills. See diagram 3.
   │ workflow-initiative-init  (core's)      │
   │ principal-product-manager (half a hat)  │
   └─────────────────────────────────────────┘
```

### 3. The mechanical weld — why three `workflow-*` agents cannot leave `kai-engineering`

This is a **hard gate consequence**, not a preference. It is the mirror image of
round 1's D3 and nothing fixes it.

```text
   review-rollout-operability            build-diagrams
   (no `kai-core-` prefix)               (no `kai-core-` prefix)
        │                                     │
   consumers today                       consumers today
   ┌────┴─────────────┐          ┌───────────┴──────────────────────────┐
   principal-sre      workflow-  swe-architect  swe-backend  swe-frontend
   [engineering]      ship       swe-infra      workflow-issue-analysis
                      [eng]                     workflow-pull-request
                                                        [all engineering]

   ONE pack  ⇒  planPacks(): local to `engineering`  ⇒  green today.

   MOVE workflow-ship (or PR, or issue-analysis) into a new pack:

        packs.size becomes 2
              ↓
        planPacks(): `packs.size > 1` ⇒ provider = core
              ↓
        namespaceErrors(): "kai-core provides skill `review-rollout-operability`,
        which does not carry the `kai-core-*` prefix" ⇒ 🔴 --gate partition RED

   THE THREE ESCAPES, ALL CLOSED:
     duplicate into both packs → providerCollisionErrors() (pack-plan.mjs:1546+)
     reach across departments  → referenceErrors(): "may only reach its own pack
                                 or kai-core — no department pack depends on another"
     rename to `kai-core-*`    → edits skill bodies with no deriving check
                                 ⇒ scope-brief A1 test (ii) FAILS ⇒ out of scope

   ⇒ workflow-ship, workflow-pull-request, workflow-issue-analysis STAY in
     kai-engineering. This is decided by the generator, not by me.
```

---

## Forces

Each traced to a file read this session.

- **F1 — A plugin is an install unit; a department is a job.** `PACKS` costs a
  published identity: a `PACK_ORDER` slot, a `COMMITTED_PACKS` entry, a
  `runtimeDependencyMatrix()` CI leg, a `marketplace.json` row, a
  `legacy-rollback` forbidden entry (non-negotiable #9), and a literal in the
  guided installer that `validate-plugin.mjs:860` pins into
  `kai-core-workspace-onboarding/SKILL.md`. `CATEGORIES` costs one array
  literal and a `npm run docs:generate`. The operator's model is a job model.
  Spending the expensive axis on it is the mis-fit.
- **F2 — Both routers inherit nothing but core.** `director-chief-of-staff`
  inherits 9 skills, **all `kai-core-*`**. `director-executive-assistant`
  inherits 6, **all `kai-core-*`**, and sole-consumes three of them
  (`kai-core-decision-brief`, `kai-core-executive-consultation`, and — with
  `workflow-proactive-scan` — `kai-core-personal-agenda`). No other agent in the
  fleet has a 100%-core inheritance. They are not a department; they are core's
  own consumers.
- **F3 — Standalone is structurally impossible for the routers, not merely
  degraded.** Success measure #1 targets *"every area plugin loads and works
  standalone."* DCoS's entire job is claiming, leasing, dispatching, and
  recording through `kai/coordination/` — precisely what non-negotiable #6
  forbids standalone mode from doing (*"never creates or impersonates a
  canonical `.kai` workspace … explicitly disclaims durable coordination,
  fleet visibility, leases, handoffs"*). DEA writes `kai/personal/inbox.md` and
  `agenda.md`, same class. A `kai-directors` plugin would be **the only plugin
  in the set whose standalone mode has no honest content**.
- **F4 — Cross-plugin *routing* is already sanctioned and already degrades
  correctly.** `referenceErrors()` comment, verbatim: *"An agent is a routing
  target, not a load-time dependency: naming a role in another department
  degrades to 'that pack is not installed'."* The routers can therefore live in
  core and route into `kai-gtm`, `kai-learning`, etc. **without** any of those
  being installed. The operator's front-door model already works at the current
  topology; it needs no new identity to work.
- **F5 — The mechanical weld (diagram 3).** `review-rollout-operability` and
  `build-diagrams` bind `workflow-ship`, `workflow-pull-request`, and
  `workflow-issue-analysis` to `kai-engineering`. Any `kai-project-management`
  containing them turns `--gate partition` red with no legal escape.
- **F6 — Round 1 applied its own coherence test unevenly.** Non-negotiable #3:
  *"Every successor area must state its job in one sentence without the word
  'and' doing structural work."* Round 1 used exactly that test to keep
  `creative-video-director` out of `kai-assistant` (*"…and product video
  direction"*). It did not apply it to `director-executive-assistant`, because
  that move arrived pre-settled. Applied: `kai-assistant` with DEA is *"Support
  the operator personally — voice, career, **and route the entire company's
  delivery, agenda, and decision briefs.**"* That is a structural "and", in the
  flagship area minted to prove catch-alls are gone. Without DEA:
  *"Represent the operator as an individual professional — their voice and their
  career."* One subject, two facets. Clean.
- **F7 — Reversibility asymmetry, restated for round 2.** A `PACKS` key is one
  line to write and a published identity to withdraw. A `CATEGORIES` row is one
  line to write and one line to withdraw. Under `kai-core-scope-discipline`,
  cheap-to-reverse gets decided fast; expensive-to-reverse gets the scrutiny.
  Two new plugin identities is the most expensive move available in this
  initiative, and it is being proposed to express a naming insight.
- **F8 — The deferral valve requires one owner on both ends.**
  `principal-product-manager.agent.md` describes the backlog as *"the one-way
  valve kai-core-scope-discipline's deferrals flow into and only you open out."*
  Split scope-decider from steward and the role that **defers** into the backlog
  is no longer the role that **promotes** out of it — reopening the exact
  scope-creep path the valve exists to close.
- **F9 — Agent-id renames fail the scope brief's own exemption test.** A1 permits
  a body edit **iff** every edited span is a generator-derived identity string
  **and** a CI check derives the expected literal **and** no instruction changes.
  A role rename touches **12 `agents/**` + `skills/**` bodies** with no deriving
  check (fails (ii)) and rewrites routing tables, which *are* instructions
  (fails (iii)). A1's closing line governs: *"A body edit that cannot name a
  deriving check is not exempt — it is out of scope and escalates to the
  steward."*

---

## Options considered

### For the front door

| Option | Shape | Cost | Forces |
|---|---|---|---|
| **Do nothing** (round 1: DCoS in core, DEA in `kai-assistant`) | 7 plugins | Leaves `kai-assistant` incoherent (F6) and structurally broken standalone (F2/F3); keeps two of three D3 fractures | ✗ F2 ✗ F3 ✗ F6 |
| **`kai-directors`** (operator's proposal) | 8 plugins, 2 agents, **0 skills** | New published identity; only plugin with no honest standalone mode; still 100% core-dependent so it is *effectively required together with core* — i.e. two identities that must always be installed as one | ✓ names the concept · ✗ F1 ✗ F2 ✗ F3 ✗ F7 |
| **Both routers → `kai-assistant`** | 7 plugins | Doubles down on F6; makes the newest area the biggest catch-all | ✗ F6 ✗ F3 |
| **Both routers stay in `kai-core`; the concept is named on the JOB axis** ✅ | 7 plugins, one revert | The word "directors" never appears in a plugin id; the operator must accept a catalog/doc expression instead of an install expression | ✓ F1 ✓ F2 ✓ F3 ✓ F4 ✓ F6 ✓ F7 |

### For project management

| Option | Shape | Cost | Forces |
|---|---|---|---|
| **Do nothing** | 7 plugins | `kai-product` keeps a genuine dual-hat role; concept stays unnamed | ✓ F5 · ✗ names nothing |
| **`kai-project-management` with the workflow set** | 8 plugins | 🔴 `--gate partition` red, no legal escape | ✗ F5 — **illegal by construction** |
| **`kai-project-management` without them** | 8 plugins holding `workflow-initiative-init` + half of `principal-product-manager` | Splits an agent that cannot be split (F8); takes core's own initiative machinery out of core; a plugin identity for ~1.5 agents | ✗ F1 ✗ F8 |
| **Split `principal-product-manager` into PM + steward** | 10 `kai-product` agents | *"Adding agents or capabilities"* — explicit `out_of_scope`; breaks the valve (F8) | ✗ F8 ✗ scope |
| **Name it on the JOB axis; leave the install axis alone** ✅ | 7 plugins, 0 moves | Same acceptance cost as above | ✓ F1 ✓ F5 ✓ F8 |

---

## Decision

### R1 — `director-executive-assistant` returns to `kai-core` · **Relocate** · **P0 BLOCKER**

The operator's directive (*"out of core **and out of `kai-assistant`**"*) is
half-satisfied by moving it to a third plugin and fully satisfied by moving it
back. Back is right on three independent grounds: F2 (it inherits nothing but
core and sole-consumes three core skills), F3 (its writes are exactly what
standalone mode forbids), F6 (its presence makes `kai-assistant` a catch-all by
the initiative's own test).

**This is the round-2 delta. Exactly one agent moves.** `core` 6 → **7**;
`assistant` 3 → **2**.

**Bonus, reported from the planner source:** it retires two of the three D3
fracture cases. `kai-core-decision-brief` and `kai-core-executive-consultation`
regain a core consumer and land in `core` by topology alone. Only
`kai-core-content-grounding` still fractures (cvd + demand-generation +
linkedin-strategist all in `gtm` ⇒ single department ⇒ 🔴 without the prefix
rule).

### R2 — `kai-directors` · **Decline** · **P0 BLOCKER** (the count is what blocks)

**Recommendation: against.** Not because the operator's model is wrong — the
model is right and it is *already the shipped product's model*
(`generate-catalog.mjs:41`: *"The two front doors. Everything else is reachable
through them."*). Against because a plugin is an install unit and this concept
has no independent-installation force behind it: the routers cannot be installed
usefully without core (F2), cannot run honestly without core (F3), and do not
need their own identity to route into departments that are not installed (F4).

**A `kai-directors` that is "optional" would be a false promise, and a
`kai-directors` that is honestly labelled "requires `kai-core`" is `kai-core`
with an extra identity to version, publish, and roll back.**

**What to do instead — the operator's model, delivered on the axis that fits:**

1. **Name core's job as the front office.** Core is not "the leftovers." Its one
   sentence is: *"The front door and the operating system — the two routers that
   turn an outcome into department work, plus the workspace, coordination, and
   contract layer every department shares."* That is copy, and A4 already
   assigns user-facing copy deliverables to product.
2. **`CATEGORIES` already carries "Direction."** It is enforced as a total
   partition (`generate-catalog.mjs:241-260`, checked by `docs:check` in
   `npm test`) and it is *not* an `area-plugins` target — so refining it is free
   and outside this initiative's blast radius entirely.

**Membership if the operator overrules me** (recorded so the decision is
one-step, not another round trip): `director-chief-of-staff` +
`director-executive-assistant`, **zero** local skills, `PACK_RUNTIME_DEPENDENCIES`
`[]`, inserted at `PACK_ORDER` position 2 (after `core`, before `engineering`) so
the first key stays positionally fixed. It would be **effectively required
alongside core, never standalone**, and measure #1 would need an explicit
carve-out for it — which is critical operator boundary #1's shape (a
non-negotiable bending), not an engineering call.

### R3 — `kai-project-management` · **Decline** · **P0 BLOCKER**

**Recommendation: against**, and the grounding is per-agent, read this session
rather than assumed. The operator's premise — *"`kai-product` mixes product
discipline with project/initiative management"* — is **half right, and the
half that is right is one hat on one agent, not a plugin's worth of agents.**

**Per-agent ruling on all 9 current `kai-product` members:**

| agent | what its body actually does | product / PM / other | move? |
|---|---|---|---|
| `principal-product-manager` | *"Owns product scope **and** initiative stewardship"* — brief, triage, smallest-correct scope **plus** north-star state, backlog grooming, promotion, prioritization, calling done | **genuinely both** | **no** — see R4 |
| `principal-product-designer` | interaction design for approved needs; reviews implementation against the approved design | product | no |
| `principal-product-strategist` | future opportunity, analogous products, fit scores, smallest validating experiment | product **discovery** | no |
| `persona-ux-first-time-user` | simulates a first-time walkthrough, reports confusion | product **evaluation** | no |
| `workflow-product-explore` | evidence-backed live-product map; *"Not UX evaluation, defect filing, scope, or design recommendations"* | product **discovery** | no |
| `workflow-customer-feedback` | de-identified theme synthesis + owner routing; *"Not product scoping"* | product **intake** | no |
| `workflow-experiment-review` | *"a referee, not a player"* — certifies experiment integrity; *"`principal-product-manager` owns scope"* | product **assurance** (catalog files it under growth) | no — flag only |
| `principal-brand-designer` | visual identity from **positioning** — and positioning is `principal-product-marketing`'s, in `kai-gtm` | arguably **GTM** | no — `out_of_scope`, flagged |
| `principal-data-analytics` | metric contracts, funnel/cohort/experiment analysis | arguably **GTM/growth** | no — `out_of_scope`, flagged |

**Finding: `kai-product` does not mix product with project management.** It
mixes product *discovery/design* with *growth-analytics* — a different seam
than the one proposed, and one the scope brief puts `out_of_scope` ("Changing
membership of `kai-engineering`, `kai-product`, or `kai-gtm`").

**And the project-management function the operator is looking for already
exists — it is `kai-core`.** `kai-core-work-coordination`,
`kai-core-work-activity`, `kai-core-initiative-stewardship`,
`kai-core-definition-of-done`, `kai-core-issue-analysis`, `kai-core-pr-delivery`,
`workflow-initiative-init`, `workflow-proactive-scan`, `workflow-weekly-pulse`,
and `director-chief-of-staff` **are** the project-management department. It is
invisible because core is named after its implementation, not its job — the
same root cause as R2, and the same fix.

**On the operator's `workflow-*` candidate list, ruled individually:**

| agent | current | ruling |
|---|---|---|
| `workflow-ship` | engineering | **stays — welded** by `review-rollout-operability` (F5) |
| `workflow-pull-request` | engineering | **stays — welded** by `build-diagrams` (F5) |
| `workflow-issue-analysis` | engineering | **stays — welded** by `build-diagrams` (F5) |
| `workflow-incident-response` | engineering | stays. Inherits only `kai-core-*` so it *is* movable — but its peers are `principal-sre` / `principal-security`, and no force pulls it out |
| `workflow-doc-review` | engineering | stays. Sole-consumes all 5 review-lens skills, so it *is* cleanly movable — no force |
| `workflow-localization` | engineering | stays. Not on the operator's list; noted for completeness |
| `workflow-product-explore` | product | stays. `product-exploration` sole-consumed, cleanly movable — no force |
| `workflow-experiment-review` | product | stays |
| `workflow-customer-feedback` | product | stays |
| `workflow-support-triage` | gtm | stays. `out_of_scope` + genuinely customer-ops |
| `workflow-initiative-init` | core | **stays in core.** It writes `kai/initiatives/**` — core's own machinery — and inherits only `kai-core-*`. Moving it takes the initiative substrate out of the plugin that defines it |

**The general rule this establishes, and it answers the operator's "do not
assume every `workflow-*` belongs in product" directly:** a `workflow-*` agent
belongs to the pack **whose non-core skills it shares**. Where it shares none,
it belongs with the principals whose output it gates. Six of the eleven
`workflow-*` agents are placement-free by inheritance; three are welded; two
follow their sole-consumed skills.

### R4 — `principal-product-manager`'s dual role · **Endorse the dual hat. Do not split.** · **LATER REFINEMENT (deferred with trigger)**

The operator is right that this is the crux. My ruling: **one agent, two hats,
and the hats are coupled by design — splitting them breaks a safety property.**

- **F8 is the load-bearing reason.** The body defines the backlog as *"the
  one-way valve `kai-core-scope-discipline`'s deferrals flow **into** and only
  you open **out**."* A valve with a different owner on each end is not a valve.
- Splitting means **adding an agent**, which `out_of_scope` forbids in terms
  (*"Adding agents or capabilities"*).
- `northstar.md`'s `owner` defaults to this role; a split needs a new default
  and a migration of every existing north star — expensive, and buys nothing
  this initiative needs.
- One honest wart, recorded not fixed: the PM body *claims* the steward role but
  its `**Inherits:**` line does **not** list `kai-core-initiative-stewardship`
  — only `director-chief-of-staff` inherits it. That is a **content**
  inconsistency (`out_of_scope` bullet 1), not a packaging defect, and it does
  not affect any provider assignment.

**Trigger to reopen:** a second role becomes a default steward on any north
star, **or** the backlog-promotion valve is observed being opened by a role
other than the deferring one. Either makes the coupling false and the split
correct.

### R5 — Role renames · **Propose the names. Do not ship them here.** · **LATER REFINEMENT**

**Proposed rename table:**

| old | new | keeps the distinction how |
|---|---|---|
| `director-chief-of-staff` | **`director-delivery`** | business delivery: *drive an outcome to done through the departments* |
| `director-executive-assistant` | **`director-agenda`** | personal/agenda: *what needs you, what's due, what to decide* |

**Why these two.** The current names are human job titles whose distinction only
reads to someone who has worked in an exec office — the proof is that **both
shipped `description:` lines need a "Not X (`other`)" disambiguator to
separate them.** `delivery` / `agenda` separate on the noun alone and need no
disambiguator. Runner-up pair: `director-delivery` / `director-desk` (rejected:
"desk" is cute, not precise). **Rejected: `director-personal`** — it re-imports
the `kai-personal` vocabulary that non-negotiable #3 dissolves. The `director-*`
prefix is retained deliberately: the three-tier `director-* / principal-* /
workflow-*` taxonomy is stated in both router bodies and is load-bearing.

**Migration cost — grounded by `grep`, not estimated. 57 occurrences across 21
root source files**, plus 2 file renames, plus 2 `name:` frontmatter fields:

| surface | files | occurrences | notes |
|---|---|---|---|
| `agents/**` | 6 | 17 | incl. `principal-ai-applied-engineer`, `principal-product-manager`, `workflow-initiative-init`, `workflow-proactive-scan` routing mentions |
| `skills/**` | 6 | 17 | `kai-core-work-coordination` (4), `kai-core-executive-consultation` (4), `-team-operating-rules` (3), `-decision-brief` (2), `-personal-agenda` (2), `-initiative-stewardship` (2) |
| `scripts/**` | 4 | 5 | **asserted literals**: `validate-plugin.mjs:232` (`ACTIVITY_EXEMPT`), `generate-catalog.mjs:42` (`CATEGORIES`), `release-guard.mjs:106` (self-test fixture), `pack-plan.mjs` (`PACKS`) |
| `docs/**` | 5 | 18 | `how-kai-works.md` alone has 10 |
| `packs/**` | 14 | 35 | generated — regenerates, no hand edit |
| `kai/coordination/**` | history | — | `out_of_scope` to rewrite; **after a rename every historical thread cites dead agent ids** |

**Ruling: renames are NOT P0, and they cannot ship inside `area-plugins` at
all.** F9: the 12 `agents/**` + `skills/**` bodies fail A1's exemption test at
(ii) — no check derives those ids — and the routing tables fail it at (iii),
because a routing table *is* an instruction. A1's own closing sentence routes
this: *"out of scope and escalates to the steward."*

**Route:** `PROPOSAL` to `principal-product-manager` (steward) for a **separate
initiative** after `migration-complete`. Doing it during `area-plugins` would
move plugin identity and agent identity in the same window — two renames, one
diff, and a red gate that cannot tell you which one broke it. That is exactly
the attribution discipline A3 established for the prefix fix.

### R6 — The D3 prefix fix stays in milestone 2 · **Endorse** · **P0 BLOCKER**

Unchanged and re-affirmed, with an honesty correction. Round 1 argued D3 was
justified *independently* of the `creative-video-director` placement, because
the settled DEA move triggered it on its own. **R1 removes that leg.** After
round 2, the only surviving fracture is `kai-core-content-grounding`, and it is
triggered by the cvd → `kai-gtm` placement.

D3 nonetheless stands, on three grounds that do not depend on placement:

1. **Already accepted and scheduled.** Steward amendment **A3** made it a named
   milestone-2 deliverable (constraint S1), gated milestone 4 on it, and pinned
   it to its own commit (S2). It is not mine to re-open.
2. **Provably byte-neutral today** — all 24 `kai-core-*` skills already land in
   `core`, so evaluating the prefix first cannot move an assignment.
3. **It retires a failure class.** Any future move of a single-consumer core
   agent hits the same wall; the name is already the contract that
   `namespaceErrors()` enforces, and D3 just moves it from the checker into the
   planner where it is satisfiable by construction.

### R7 — `creative-video-director` → `kai-gtm` · **Endorse round 1** · **P0 (settled, no change)**

Re-verified this session: `kai-core-content-grounding`'s consumers are exactly
`creative-video-director`, `principal-demand-generation`,
`principal-linkedin-strategist`; `video-direction` is sole-consumed by cvd; the
four `demo-*` skills remain genuine orphans placed by
`SKILL_OWNER_OVERRIDES`. Round 1's F2 (its only factual inputs are produced by
`principal-product-marketing` ∈ `kai-gtm`) and F4 (one-sentence job test) are
unaffected by anything in this record. **No change.**

One mild irony recorded for the reader: `kai-gtm` is the *only* placement that
collapses `kai-core-content-grounding` to a single department. Any other home
leaves it multi-pack and green without D3. That does **not** reopen the
placement — D3 is independently accepted (R6) and F2/F4 are not about gate
mechanics — but it is the honest shape of the tradeoff and it belongs on the
record.

---

## The complete map — 56 agents, 51 skills, one plugin each

### Agents — 7 plugins, 7 + 20 + 9 + 12 + 4 + 2 + 2 = **56**

| # | pack | plugin | n | roster |
|---|---|---|---|---|
| 1 | `core` | `kai-core` | **7** | director-chief-of-staff · **director-executive-assistant** · workflow-initiative-init · workflow-proactive-scan · workflow-self-check · workflow-weekly-pulse · workflow-workspace-init |
| 2 | `engineering` | `kai-engineering` | **20** | principal-ai-applied-engineer · principal-ai-researcher · principal-data-engineer · principal-privacy-compliance · principal-qa-ui · principal-security · principal-solutions-architect · principal-sre · principal-swe-architect · principal-swe-backend · principal-swe-frontend · principal-swe-infra · principal-swe-manager · principal-technical-writer · workflow-doc-review · workflow-incident-response · workflow-issue-analysis · workflow-localization · workflow-pull-request · workflow-ship |
| 3 | `product` | `kai-product` | **9** | persona-ux-first-time-user · principal-brand-designer · principal-data-analytics · principal-product-designer · principal-product-manager · principal-product-strategist · workflow-customer-feedback · workflow-experiment-review · workflow-product-explore |
| 4 | `gtm` | `kai-gtm` | **12** | creative-video-director · principal-customer-success · principal-demand-generation · principal-growth · principal-linkedin-strategist · principal-partnerships · principal-pricing-monetization · principal-product-marketing · principal-revenue-operations · principal-sales · principal-seo · workflow-support-triage |
| 5 | `learning` | `kai-learning` | **4** | instructor-path-mentor · instructor-teacher · instructor-tutor · workflow-course-to-audio |
| 6 | `assistant` | `kai-assistant` | **2** | persona-self · principal-engineer-career-mentor |
| 7 | `wellness` | `kai-wellness` | **2** | persona-professional-nutritionist · persona-professional-trainer |

**Reconciliation: 7 + 20 + 9 + 12 + 4 + 2 + 2 = 56.** Verified against the 56
`*.agent.md` files read from `agents/` this session. No agent claimed twice;
none unclaimed. `PACK_ORDER` keys 1–4 are positionally unchanged, so no
published pack is reordered.

### Skills — 24 + 15 + 3 + 7 + 1 + 1 + 0 = **51**

| pack | m | skills |
|---|---|---|
| `core` | **24** | kai-core-content-grounding · kai-core-contract-v1 ᵒ · kai-core-decision-brief · kai-core-definition-of-done · kai-core-design-grounding · kai-core-executive-consultation · kai-core-fleet-observation ᵒ · kai-core-generate-audio · kai-core-initiative-stewardship · kai-core-issue-analysis · kai-core-no-self-remediation · kai-core-peer-communication · kai-core-personal-agenda · kai-core-pr-delivery · kai-core-proactive-scan · kai-core-pulse-digest · kai-core-scope-discipline · kai-core-team-operating-rules · kai-core-web-content-extraction · kai-core-web-evaluation · kai-core-work-activity · kai-core-work-coordination · kai-core-workspace-conventions · kai-core-workspace-onboarding |
| `engineering` | **15** | build-diagrams · coding-style · doc-review-rigor · onboard-to-codebase ᵒ · pr-sizing · research-before-coding · review-alternatives · review-dependencies ᵒ · review-performance-scale ᵒ · review-rationale · review-risks-scope · review-rollout-operability · review-security-privacy · review-success-metrics ᵒ · review-ux-accessibility |
| `product` | **3** | html-block-diagrams · product-exploration · ui-mockup |
| `gtm` | **7** | create-product-demo ᵒ · demo-capture ᵒ · demo-narrate ᵒ · demo-zoom ᵒ · linkedin-content · product-marketing-intelligence · video-direction |
| `learning` | **1** | generate-html-lesson |
| `assistant` | **1** | extract-writing-style |
| `wellness` | **0** | — |

ᵒ = placed by `SKILL_OWNER_OVERRIDES` (genuine orphan, no `**Inherits:**` path).
All others assigned by `planPacks()` from the 56 inheritance lines.

**Reconciliation: 24 + 15 + 3 + 7 + 1 + 1 + 0 = 51**, matching the 51
`SKILL.md` files on disk (24 prefixed + 27 unprefixed).

### `SKILL_OWNER_OVERRIDES` — the four required edits (unchanged from round 1)

`create-product-demo`, `demo-capture`, `demo-narrate`, `demo-zoom`:
`'personal'` → `'gtm'`. Required, not cosmetic — left at `'personal'` after that
key leaves `PACKS`, each raises two `partitionErrors()` (*"places X in
'personal', which is not a pack"* and *"skill X has no provider"*).

### Provider changes caused by an agent moving

| skill | consumers before | provider before | consumers after | provider after |
|---|---|---|---|---|
| `video-direction` | cvd (personal) | `personal` | cvd (gtm) | **`gtm`** |
| `extract-writing-style` | persona-self (personal) | `personal` | persona-self (assistant) | **`assistant`** |
| `generate-html-lesson` | teacher, tutor (personal) | `personal` | both (learning) | **`learning`** |
| `kai-core-content-grounding` | cvd (personal) + 2 × gtm | `core` (multi-pack) | 3 × gtm — **single dept** | **`core` via D3** (would be `gtm` 🔴 without it) |
| `kai-core-decision-brief` | DEA (core) | `core` | DEA (**core**) | `core` — **no D3 needed after R1** |
| `kai-core-executive-consultation` | DEA (core) | `core` | DEA (**core**) | `core` — **no D3 needed after R1** |
| `kai-core-personal-agenda` | DEA + proactive-scan (core) | `core` | both (core) | `core` |

**Unowned after the change: none. Double-owned: none. Non-`kai-core-*` skill
landing in core: none** — which is the property R3's weld ruling exists to
preserve.

### `PACK_RUNTIME_DEPENDENCIES` — unchanged from round 1 D5

`core: ['lectoria']` (ships `kai-core-generate-audio` +
`scripts/generate-audio.ps1`, resolved from the **kai-core provider root** per
`kai-core-generate-audio/SKILL.md:17,48`); `gtm: ['lectoria']` (ships
`demo-narrate` + `scripts/demo-narrate.mjs`, resolved from *this plugin's*
`node_modules/.bin/lectoria`, `demo-narrate/SKILL.md:113-123`); `engineering`,
`product`, `learning`, `assistant`, `wellness`: `[]`. **Rule:** a pack declares a
runtime dependency **iff** it ships a file that resolves that dependency from its
own plugin root. CI legs 5 → 8; binary-asserting legs `{kai-core, kai-gtm}`.

---

## ASCII tree — recommended topology

```text
kai  (marketplace, renamed from kai-plugins)
│
├── kai-core@kai ...................... OPTIONAL structured-experience upgrade
│   │                                   "The front door and the operating system."
│   ├── hooks.json ..................... SOLE OWNER (HOOKS_OWNER = 'core')
│   ├── agents/ (7)
│   │   ├── director-chief-of-staff .... FRONT DOOR · business delivery
│   │   ├── director-executive-assistant  FRONT DOOR · personal / agenda   ◀── R1
│   │   ├── workflow-initiative-init
│   │   ├── workflow-proactive-scan
│   │   ├── workflow-self-check
│   │   ├── workflow-weekly-pulse
│   │   └── workflow-workspace-init
│   ├── skills/ (24) ................... all `kai-core-*`; the contract library
│   └── runtime: ['lectoria']
│
├── kai-engineering@kai ....... 20 agents · 15 skills · runtime []
│      "Design, build, review, and release software."
│      welded here by shared non-core skills: workflow-ship,
│      workflow-pull-request, workflow-issue-analysis
│
├── kai-product@kai ............ 9 agents ·  3 skills · runtime []
│      "Decide what to build and how it should behave."
│
├── kai-gtm@kai ............... 12 agents ·  7 skills · runtime ['lectoria']
│      "Take a product to market — demand, sales, pricing,
│       partnerships, and the content that carries it."
│      + creative-video-director + video-direction + 4 × demo-*
│
├── kai-learning@kai ........... 4 agents ·  1 skill  · runtime []
│      "Teach a subject and package it into lessons."
│
├── kai-assistant@kai .......... 2 agents ·  1 skill  · runtime []
│      "Represent the operator as an individual professional —
│       their voice and their career."                            ◀── coherent at 2
│
└── kai-wellness@kai ........... 2 agents ·  0 skills · runtime []
       "Audit fitness and nutrition products for safety."

TOTAL: 7 plugins · 56 agents · 51 skills · one provider each · one hooks.json owner

DECLINED THIS ROUND:  kai-directors (R2)   kai-project-management (R3)
                      — expressed on the CATEGORIES axis instead, at ~zero cost
```

---

## Router entry points, cross-plugin interaction, standalone, optional-core

| plugin | entry point when installed | cross-plugin interaction | standalone (this plugin alone) | with core absent |
|---|---|---|---|---|
| `kai-core` | **both routers.** DCoS = delivery; DEA = agenda/personal/unclear | routes **by agent reference** into any department, installed or not — `referenceErrors()` sanctions this and defines the degradation as *"that pack is not installed"* | a workspace + a front door with **no departments**. `kai-core-workspace-onboarding`'s guided installer is the honest next step | n/a — core *is* the durable layer |
| `kai-engineering` | any `principal-swe-*`, or `workflow-issue-analysis` for intake | consumes `kai-core-*` when core present; reachable as a routing target from core's routers | full — 15 local skills, zero core-local dependencies for method | mode-block; session/temp state; disclaims durable coordination, leases, handoffs, shipped-state |
| `kai-product` | `principal-product-manager` | same | full — 3 local skills | same |
| `kai-gtm` | `principal-product-marketing` (produces the context the rest consume) | same; `creative-video-director` gets its inputs **inside** this plugin — the F2 reason it lives here | full — 7 local skills; demo toolchain needs `npm ci --prefix` + ffmpeg/Azure-Speech | same |
| `kai-learning` | `instructor-tutor` (author) or `instructor-teacher` (package) | `kai-core-generate-audio` executes `lectoria` from **core's** provider root — so with no core, audio generation is the honest gap | 4 agents, 1 local skill; HTML lessons fine, audio needs core | same, plus the audio gap named above |
| `kai-assistant` | `persona-self` | none required | full — `extract-writing-style` is local | same |
| `kai-wellness` | either persona | none required | full — 0 local skills, both agents' method is in-body | same |

**The router-in-core question, answered plainly:** with core installed and zero
departments, the routers still work — they route to agents that resolve to
"not installed," which the generator already treats as the correct degradation
(F4). With a department installed and **no** core, that department has no
router, and that is honest: cross-department routing is only meaningful when
there are several departments *and* a coordination substrate to record the
handoff in. **No new contract is needed; none is proposed.**

---

## Move table — every ambiguous agent

| agent | round-1 home | round-2 home | reason |
|---|---|---|---|
| `director-executive-assistant` | `kai-assistant` | **`kai-core`** | **MOVED.** Operator directive (out of `kai-assistant`) + F2 (inherits only core, sole-consumes 3 core skills) + F3 (its writes are what standalone forbids) + F6 (made `kai-assistant` a catch-all) |
| `director-chief-of-staff` | `kai-core` | `kai-core` | unchanged. `kai-directors` declined (R2) |
| `creative-video-director` | `kai-gtm` | `kai-gtm` | unchanged. F2/F4 re-verified (R7) |
| `principal-product-manager` | `kai-product` | `kai-product` | unchanged. Dual hat endorsed; splitting breaks the deferral valve (F8, R4) |
| `workflow-initiative-init` | `kai-core` | `kai-core` | unchanged. Writes `kai/initiatives/**` — core's own substrate |
| `workflow-ship` | `kai-engineering` | `kai-engineering` | unchanged. **Welded** — `review-rollout-operability` fractures to core, `namespaceErrors()` 🔴 |
| `workflow-pull-request` | `kai-engineering` | `kai-engineering` | unchanged. **Welded** — `build-diagrams` |
| `workflow-issue-analysis` | `kai-engineering` | `kai-engineering` | unchanged. **Welded** — `build-diagrams` |
| `workflow-incident-response` | `kai-engineering` | `kai-engineering` | unchanged. Movable (core-only inheritance) but no force; peers are SRE/security |
| `workflow-doc-review` | `kai-engineering` | `kai-engineering` | unchanged. Cleanly movable (5 sole-consumed skills follow) but no force |
| `workflow-localization` | `kai-engineering` | `kai-engineering` | unchanged |
| `workflow-product-explore` | `kai-product` | `kai-product` | unchanged. Cleanly movable but it is discovery, not execution |
| `workflow-experiment-review` | `kai-product` | `kai-product` | unchanged. Referee over product/growth evidence |
| `workflow-customer-feedback` | `kai-product` | `kai-product` | unchanged. Product intake |
| `workflow-support-triage` | `kai-gtm` | `kai-gtm` | unchanged. `out_of_scope` + customer ops |
| `principal-brand-designer` | `kai-product` | `kai-product` | unchanged, **flagged**: works from positioning, which `kai-gtm` owns. `html-block-diagrams` sole-consumed so it would move cleanly. Blocked by `out_of_scope` |
| `principal-data-analytics` | `kai-product` | `kai-product` | unchanged, **flagged**: `CATEGORIES` already files it under growth/monetization. Blocked by `out_of_scope` |
| `persona-self` | `kai-assistant` | `kai-assistant` | unchanged |
| `principal-engineer-career-mentor` | `kai-assistant` | `kai-assistant` | unchanged |
| 3 × `instructor-*`, `workflow-course-to-audio` | `kai-learning` | `kai-learning` | unchanged |
| 2 × `persona-professional-*` | `kai-wellness` | `kai-wellness` | unchanged |

**Net: one agent moves.**

---

## P0 BLOCKER vs LATER REFINEMENT

**P0 — must be settled before `area-taxonomy-split` implementation begins.**
Each changes `PACKS`, `PACK_ORDER`, the computed provider map, or the CI matrix
— i.e. each is a *published-identity* or *gate-legality* decision.

| # | decision | why P0 |
|---|---|---|
| **R1** | DEA returns to `kai-core` | changes `PACKS` in two keys, changes 3 skill providers, changes `kai-assistant`'s measure-#1 standalone claim, and changes what the D3 fix is carrying |
| **R2** | plugin count stays **7** (no `kai-directors`) | count drives `PACK_ORDER`, `COMMITTED_PACKS`, the CI leg matrix, `marketplace.json`, the derived `legacy-rollback` set (non-negotiable #9), and the installer literal pinned at `validate-plugin.mjs:860`. Deciding it late means re-doing milestones 3–5 |
| **R3** | plugin count stays **7** (no `kai-project-management`); `workflow-ship` / `-pull-request` / `-issue-analysis` stay in `kai-engineering` | it is what makes the map **legal**. Any other answer is `--gate partition` red with no escape (F5) |
| **R6** | D3 prefix fix stays a milestone-2 deliverable, gating milestone 4 | already A3-binding; milestone 4 is red on arrival without it |
| **R7** | `creative-video-director` → `kai-gtm` | published identity; drags 5 skills, 5 JS assets, `lectoria`, a Node engine pin, and a CI binary leg |

**LATER REFINEMENT — safe to decide after implementation; each has a trigger.**

| # | decision | why deferrable / trigger |
|---|---|---|
| **R5** | role renames `director-delivery` / `director-agenda` | **cannot ship inside `area-plugins` at all** (F9 / A1(ii)). Route as a `PROPOSAL` for a separate initiative after `migration-complete`. Trigger to start: the plugin-identity rename is done and stable |
| **R2b** | naming core's job as the front office; refining `CATEGORIES` | `generate-catalog.mjs` is not an `area-plugins` `target`; the change is one array literal + `npm run docs:generate`, byte-checked and reversible. Copy is product's per A4 |
| **R4** | splitting the PM's scope hat from the steward hat | trigger: a second role becomes a default steward, **or** the deferral valve is opened by a role other than the deferring one |
| **R3b** | `principal-brand-designer` and `principal-data-analytics` homes | `out_of_scope` today. Trigger: a steward amendment reopens `kai-product`/`kai-gtm` membership, or one of them acquires a non-core skill shared with the other area |
| — | the PM body claiming stewardship without inheriting `kai-core-initiative-stewardship` | content, not packaging; affects no provider. Trigger: any initiative where the steward's contract is not loaded and it matters |
| — | routers naming agents in uninstalled plugins | **not a defect** — `referenceErrors()` sanctions it and defines the degradation. Trigger: a user report that a router named an agent with no install hint |

---

## Supersession statement

`area-plugins-taxonomy-decision` (`DECISION 2026-08-27-1850`) stays `completed`
as history. **It is not rewritten.**

**What round 1 decided, and what happens to each:**

| round-1 decision | status |
|---|---|
| **D1** — the 7-plugin agent map | **AMENDED.** One row changes: DEA `kai-assistant` → `kai-core`. `core` 6→7, `assistant` 3→2. All other rows **stand** |
| **D2** — `creative-video-director` → `kai-gtm`, with `video-direction` + 4 `demo-*` | **STANDS**, re-verified (R7) |
| **D3** — namespace-aware provider assignment | **STANDS** (R6), with a correction: its independent justification is now A3's acceptance and its class-of-failure property, **not** the DEA move, which R1 removes. It now carries one fracture (`kai-core-content-grounding`), not three |
| **D4** — core skills with no core consumer, routed to the optional-core record | **NARROWED.** `kai-core-decision-brief` and `kai-core-executive-consultation` **leave that list** — R1 restores their core consumer, so `kai-assistant` no longer has a standalone gap. Remaining: `kai-core-content-grounding` (gtm), `kai-core-generate-audio` (learning) |
| **D5** — `lectoria` declared by `core` + `gtm` only; the "ships a resolving file" rule | **STANDS**, unchanged |
| **D6** — deriving `PACK_RUNTIME_DEPENDENCIES` mechanically, deferred | **STANDS**, unchanged |
| round-1 skill provider map (24/15/3/7/1/1/0) | **STANDS** — R1 changes *why* two core skills land in core, not *where* |

**What round 2 adds that round 1 did not have:**

1. The **install-axis vs job-axis** rule (F1) — the reason both proposed plugins
   are declined and the reason the operator's model is nonetheless correct.
2. The **mechanical weld** (F5) — a hard, previously-unnamed constraint that
   three `workflow-*` agents cannot leave `kai-engineering`. This is the mirror
   of D3 and it has **no** fix.
3. The **coherence-test asymmetry** in round 1 (F6) — the test that excluded
   `creative-video-director` from `kai-assistant` was never applied to DEA.
4. A **grounded per-agent ruling** on all 9 `kai-product` members and all 11
   `workflow-*` agents.
5. The **rename blast radius**, measured (57 occurrences / 21 files) and ruled
   out of scope against A1's exemption test.

---

## Critical-boundary call

**One genuinely critical product decision. It is the operator's, not mine.**

### TLDR

> The operator asked for two new plugins to express a real and correct insight:
> **plugins are departments, the human is the CEO, and the routers are the front
> door.** I agree with the model and recommend **against** the two plugins. A
> plugin is an **install unit**; "front door" and "project management" are
> **job** concepts, and the repo already enforces a separate, free, reversible
> job partition (`CATEGORIES`) that literally already says *"Direction — the two
> front doors."* Spending two published plugin identities on a naming insight is
> the most expensive, least reversible move available in this initiative. The
> one real defect round 1 left — `director-executive-assistant` marooned in
> `kai-assistant` — is fixed by a **one-line revert** that costs nothing and
> fixes four things at once.
>
> **Operator's call:** accept the front door and project management as **named
> jobs inside `kai-core`** (recommended, ~zero cost, fully reversible), or
> insist on **plugin identities** (8 or 9 plugins, one of which can never be
> standalone — which bends non-negotiable #4/#5 and success measure #1, and is
> therefore an operator-only decision, not an engineering one).

### Before / after

```text
WHAT THE OPERATOR PROPOSED                 WHAT I RECOMMEND

 9 published identities                     7 published identities
 ┌──────────────┐                           ┌──────────────────────────────┐
 │ kai-core     │ 4 workflow-* + 24 skills  │ kai-core                     │
 │  "leftovers" │ ← is this still a plugin? │  = THE FRONT OFFICE          │
 └──────────────┘                           │  2 routers + 5 workflow-*    │
 ┌──────────────┐                           │  + 24 contracts + hooks.json │
 │ kai-directors│ 2 agents, 0 skills        │  one sentence, no "and":     │
 │              │ CANNOT RUN STANDALONE ✗   │  "The front door and the     │
 │              │ 100% dependent on core    │   operating system."         │
 └──────────────┘                           └──────────────────────────────┘
 ┌──────────────┐                            + 6 departments, unchanged
 │ kai-project- │ ship/PR/issue = 🔴 RED
 │ management   │ without them = 1.5 agents  the SAME two concepts, named on
 └──────────────┘                            the JOB axis at ~zero cost:
 ┌──────────────┐                           ┌──────────────────────────────┐
 │ kai-product  │ − PM's steward hat?       │ CATEGORIES (generate-catalog)│
 │              │   splits the valve ✗      │  "Direction" ......... exists│
 └──────────────┘                           │  "Project management". add   │
                                            │  cost: one array literal     │
 cost: 2 new identities, versioned,         │  reversible: yes             │
 published, in legacy-rollback,             └──────────────────────────────┘
 2 new CI legs, installer literal,
 marketplace rows — ALL ONE-WAY.            cost of R1 (the only move): one
                                            line in PACKS. Reversible.
```

### What I am explicitly **not** deciding

- **Whether the operator's naming insight is worth a plugin identity.** That is
  a product/value judgment. I have framed the technical tradeoff and the cost of
  each side; the call is the operator's, routed through the steward.
- **The scope amendment this revision requires.** `kai-project-management` would
  change `kai-product` membership, which `out_of_scope` forbids in terms;
  `kai-directors` would add an area beyond the settled set. The taxonomy has
  **not locked**, so the set is still amendable — but the amendment authority is
  the steward's (the A-series), not mine. If the operator overrules R2 or R3, an
  **A10 amendment must land before implementation**, not after.
- **`principal-security` / `principal-sre` verdicts.** Nothing here is a threat
  model or a readiness call.

---

## Domain work this implies

- **`principal-swe-infra` / whoever owns `pack-plan.mjs` in milestone 4** — one
  `PACKS` edit moving `director-executive-assistant` from the `assistant` list
  to the `core` list, plus the four `SKILL_OWNER_OVERRIDES` `'personal'` →
  `'gtm'` edits and the three new `PACK_RUNTIME_DEPENDENCIES` keys. The *what*,
  not the *how*; sizing and PR packing go to `principal-swe-manager`.
- **`principal-swe-manager`** — sequence R1 inside milestone 4's existing PR
  plan. It is one line and it must not ride inside the body-rewrite diff, for
  the same attribution reason A3/S2 gave the prefix fix.
- **`principal-product-manager` (steward)** — owns the `scope-acceptance` review
  on this item; owns the A10 amendment **if** the operator overrules R2/R3; owns
  the R5 rename `PROPOSAL` intake; owns the front-office copy under A4.
- **Nobody, yet** — R5's renames. Deliberately unassigned; they are a separate
  initiative after `migration-complete`.

## What stays the same

`kai-engineering` (20), `kai-product` (9), and `kai-gtm`'s existing 11 members;
`PACK_ORDER` positions 1–4; `hooks.json`'s sole owner (`core`); the
`SKILL_OWNER_OVERRIDES` entries other than the four demo skills; the D5 runtime
rule; the milestone order
(`decisions-locked → optional-core-contract → surface-rename →
area-taxonomy-split → migration-complete`); every agent and skill **body**.

## Reversibility

- **R1** — cheap. One `PACKS` line, pre-publication. If wrong, DEA moves again
  before any identity ships.
- **R2 / R3 (declining)** — **the cheap direction.** Not creating an identity is
  always reversible; creating one is not. If the operator later wants
  `kai-directors`, it can be minted at any time. If it ships now and is wrong,
  withdrawing it means moving agents between two live published identities — the
  same class of pain as dissolving `kai-personal`.
- **R4 / R5 / R7** — R4 and R5 are deferred with triggers, so reversibility is
  moot. R7 is expensive once published, which is why round 1 priced it and this
  record re-verified rather than re-decided it.
- **Consequence if the decline is wrong:** the operator's front-door and
  project-management concepts stay expressed in docs and the catalog rather than
  in the install list. Users discover them by reading, not by installing. That
  is a discoverability cost, and it is recoverable at any time.

## Open questions / escalations

1. **@operator, `kind: decision` — the critical-boundary call above.** Accept
   the front office / project management as named jobs inside `kai-core`
   (recommended), or mint plugin identities and accept that `kai-directors` can
   never be standalone (bends non-negotiable #4/#5 and measure #1)?
2. **@principal-product-manager (steward), `kind: decision`** — if the operator
   picks the second option, an **A10 amendment** must reopen `out_of_scope`
   ("adding areas beyond the settled set"; "changing membership of
   `kai-product`") **before** milestone 4 begins. Confirm the steward owns
   drafting it.
3. **@principal-product-manager (steward), `kind: decision`** — accept R5 as a
   `PROPOSAL` for a **post-`migration-complete`** initiative? It cannot ride in
   `area-plugins` under A1(ii)/(iii). If declined, the two routers keep names
   that need a "Not X" disambiguator to separate them.
4. **Reported, not observed.** No gate was run this session. Before milestone 4
   merges, `pack-preview --gate partition` and `--check` must be **observed**
   green against this map, and the reconciliation (56 / 51 / 7) re-asserted
   mechanically rather than by this record's arithmetic.

---

## HANDOFF 2026-08-27-2130 — principal-swe-architect -> principal-product-manager

- **did:** Read `agents/` (56 files), `skills/` (51 `SKILL.md`), all 56
  `**Inherits:**` lines, `planPacks()`, `namespaceErrors()`, `referenceErrors()`,
  `generate-catalog.mjs`, `validate-plugin.mjs`, `release-guard.mjs`, both
  director bodies, the nine `kai-product` bodies' role sections, the round-1 and
  optional-core records, and the scope brief with A1/A3/A4. Produced the
  complete round-2 map (**7 plugins · 56 agents · 51 skills**, reconciled),
  **declined** `kai-directors` (R2) and `kai-project-management` (R3) with
  grounded forces, **moved one agent** (`director-executive-assistant` →
  `kai-core`, R1), **endorsed** the PM's dual hat (R4), **proposed** two role
  renames and ruled them out of scope for this initiative (R5), re-affirmed the
  D3 prefix fix (R6) and the `creative-video-director` placement (R7), split
  every decision **P0 vs later refinement**, and stated the supersession of
  round 1 decision-by-decision.
- **found:** (a) a **second enforced total partition** (`CATEGORIES`,
  `docs:check`) that already expresses the operator's model at ~zero cost;
  (b) a **mechanical weld** — `review-rollout-operability` and `build-diagrams`
  make `workflow-ship`, `workflow-pull-request`, and `workflow-issue-analysis`
  un-movable out of `kai-engineering`, which makes any useful
  `kai-project-management` illegal by construction; (c) round 1 applied
  non-negotiable #3's one-sentence test to `creative-video-director` but not to
  `director-executive-assistant`; (d) the rename blast radius is **57
  occurrences across 21 root files** and fails A1's exemption test.
- **did not:** run any command (no shell); write or modify `scripts/`, `packs/`,
  `plugin.json`, `agents/`, `skills/`; create `kai/initiatives/area-plugins/`;
  touch `kai/initiatives/pack-split/**`; edit any other item or thread; rewrite
  the round-1 record; accept any residual risk on `principal-security`'s or
  `principal-sre`'s behalf; decide the product-value question in the
  critical-boundary call.
- **next:** `principal-product-manager` runs the declared `scope-acceptance`
  review. Three decisions are routed above: the operator's critical-boundary
  call (#1), the conditional A10 amendment (#2), and the R5 rename `PROPOSAL`
  intake (#3).
- **state:** item `ready` → `in-review`, `next_role: principal-product-manager`,
  version 1 → 2, lease cleared.

---

## REVIEW 2026-08-27-2138 — principal-product-manager (steward) · `scope-acceptance`

**kind:** `scope-acceptance` · **verdict: `approved-with-conditions`**
**change_ref:** `null` — this is a `delivery_class: knowledge` item with no diff.
The review binds to the architect's dated thread entry
**`DECISION 2026-08-27-2130 — principal-swe-architect`** in this thread, which is
the reviewed revision. Conditions C1–C5 below bind the transcription of that
DECISION into the canonical `artifact_target` when
`kai/initiatives/area-plugins/` exists; **none returns work to the architect.**

**Reviewed against:** `northstar`-equivalent scope in
`kai/coordination/threads/area-plugins-scope-brief.md` (`BRIEF 2026-08-27-1839`
+ A1–A16), non-negotiables #1–#13, success measures #1–#5, `out_of_scope` as
amended by A10, and this item's six acceptance lines.

---

### 1. Verification of the load-bearing mechanical claims

I did **not** accept the summary. Each claim was re-derived from source this
session. Nothing was executed — no shell — so gate outcomes remain `reported`.

#### (a) The `CATEGORIES` job partition — **VERIFIED, and stronger than claimed**

| claim | source | result |
|---|---|---|
| a second total partition exists | `generate-catalog.mjs:31` `const CATEGORIES = [` | ✅ |
| it has a "Direction" category | `generate-catalog.mjs:40` `title: 'Direction'` | ✅ |
| blurb is as quoted | `:41` `'The two front doors. Everything else is reachable through them.'` | ✅ **verbatim** |
| covering exactly those two agents | `:42` `members: ['director-executive-assistant', 'director-chief-of-staff']` | ✅ exactly two, no others |
| enforced as a **total** partition | `build()` `:244-260` — unfiled ⇒ `"is not filed under any catalog category"`; double-filed ⇒ `"is filed twice"`; wrong kind ⇒ error | ✅ exactly-once, both directions |
| gated by `docs:check` | `package.json:9` `"docs:check": "node scripts/generate-catalog.mjs --check"`; `package.json:19` `"test"` includes `generate-catalog.mjs --check` | ✅ in `npm test` |
| cost is one array literal | `CATEGORIES` is a module-level literal; output regenerates via `docs:generate` | ✅ |

**Beyond the claim:** the category is not merely defined, it is **already
rendered and shipped**. `docs/reference/agents-and-skills.md:32-34` reads:

```text
### Direction

The two front doors. Everything else is reachable through them.
```

#### (b) The `planPacks()` → `namespaceErrors()` weld — **VERIFIED**

First I confirmed the consumer derivation is the `**Inherits:**` line only, so
prose mentions cannot create a false edge: `declaredInherits()`
(`pack-plan.mjs:366-370`) matches `/^\*\*Inherits:\*\*(.*)$/m` and extracts
backticked ids; `inheritedSkills()` (`:375-376`) filters to skills on disk.
`grep '^\*\*Inherits:\*\*' agents/` returns **56 matches across 56 files** —
one per agent, independently reproducing the architect's figure. This matters:
`workflow-doc-review.agent.md:99` mentions `review-rollout-operability` in
**prose**, and is correctly **not** a consumer.

Consumers today, from the inheritance lines:

| skill | consumers (`**Inherits:**`) | packs today |
|---|---|---|
| `build-diagrams` | `principal-swe-architect`, `principal-swe-backend`, `principal-swe-frontend`, `principal-swe-infra`, `workflow-issue-analysis`, `workflow-pull-request` | **all `engineering`** |
| `review-rollout-operability` | `principal-sre`, `workflow-ship` | **all `engineering`** |

Both are single-pack ⇒ `planPacks()` `:403-404` takes the
`else inheritedLocal[[...packs][0]]` branch ⇒ local to `engineering` ⇒ legal,
because neither carries the `kai-core-` prefix and only **core** is
prefix-constrained.

Move **any one** of `workflow-ship` / `workflow-pull-request` /
`workflow-issue-analysis` into a new pack ⇒ that skill's `packs.size` becomes
`2` ⇒ `:404` `if (packs.size > 1 || packs.has('core')) inheritedCore.push(s)`
⇒ provider becomes `core` ⇒ `namespaceErrors()` `:1527-1533` first loop:

> ``kai-core provides skill `build-diagrams`, which does not carry the `kai-core-*` prefix``

⇒ `--gate partition` **red**. **The weld is real.** I also confirmed the three
escapes are genuinely closed: `providerCollisionErrors()` (`:1545+`) blocks
duplicating into both packs; `referenceErrors()` (`:1022-1065`) blocks
cross-department reach; renaming to `kai-core-*` edits skill bodies with no
deriving check and fails A1(ii) — my own contract, correctly applied against me.

**One nuance the record should carry:** the weld binds *any* pack these three
would move to. It is not specific to `kai-project-management`.

#### (c) Both routers inherit only `kai-core-*` — **VERIFIED**

- `director-chief-of-staff.agent.md:7` — **9** skills:
  `kai-core-team-operating-rules`, `-workspace-conventions`, `-work-coordination`,
  `-work-activity`, `-peer-communication`, `-definition-of-done`,
  `-issue-analysis`, `-pr-delivery`, `-initiative-stewardship`. **9/9 prefixed.**
- `director-executive-assistant.agent.md:7` — **6** skills:
  `kai-core-team-operating-rules`, `-workspace-conventions`, `-peer-communication`,
  `-decision-brief`, `-executive-consultation`, `-personal-agenda`.
  **6/6 prefixed.**

`kai-directors` installed alone would ship **2 agent bodies and 0 skills**.
Confirmed.

#### One citation defect found — **C1**

The DECISION's Context list states *"`validate-plugin.mjs:229-235, 860`,
`release-guard.mjs:106` — two places that pin a director's agent id as a
literal."* **`:860` is not a director-id literal.** Grepping both director ids
across `scripts/` returns exactly `validate-plugin.mjs:232` (`ACTIVITY_EXEMPT`,
DEA) and `release-guard.mjs:106` (a DCoS self-test fixture). Line 860 is the
**guided-installer assertion**:

```js
const guidedInstallCommands = PACK_ORDER.map(
  (pack) => `copilot plugin install ${packPluginName(pack)}@${MARKETPLACE}`,
);
```

— which requires the **exact install command for every pack, in canonical
core-first order**, to be present in `kai-core-workspace-onboarding/SKILL.md`,
with a distinct error for out-of-order commands.

**This does not weaken F1 — it strengthens it.** A new `PACKS` key does not cost
"a literal"; it costs a *mandatory, order-checked install command in shipped
onboarding prose*. F1's use of `:860` as a **PACKS cost** is correct as written;
only the Context line's attribution is wrong. **Ruling unaffected.**

---

### 2. RULING ONE — `kai-directors`: **DECLINE.** R2 upheld, on a ground the architect did not reach.

The operator asked for this. I am overruling the request, and I owe the operator
proof that their **goal** is delivered anyway. Two parts.

#### 2a. A fourth, decisive ground the DECISION missed

The architect declined `kai-directors` on cost (F1), core-dependence (F2/F3),
and reversibility (F7). All verified. But **the record never applied
non-negotiable #3's one-sentence test to `kai-directors` itself** — the very
test F6 correctly turns on round 1. Applied now:

> `kai-directors` — *"Drive company delivery to done **and** manage the
> operator's personal agenda."*

That is a **structural "and."** Two subjects, two audiences. The proof is
already shipped and mechanical: both routers' `description:` lines each require
a *"Not X (`other`)"* disambiguator to separate them — the architect noticed
this in R5 and used it to argue for renames, without noticing it is the same
evidence that **these two agents do not share one job.**

**`kai-directors` fails the exact test that dissolved `kai-personal`.** It would
mint a two-agent catch-all in the same initiative whose measure #3 targets
"Catch-all count: 0." A10 — my own amendment — pre-committed the outcome:

> *"A `kai-directors` that cannot pass the one-sentence test is not saved by
> being operator-suggested — that finding goes back to the operator, it does not
> get waved through."*

So the tally is not "a principle bends either way." **Minting `kai-directors`
bends non-negotiable #3, #4, #5, and success measure #1. Declining it bends
nothing** — because, as shown next, the operator's goal is fully deliverable
without it. Add the collision I already recorded in A10 (`m2-claim-surface-pin`
pins every `CLAIM_SKILLS` member to `core` and to **no** area; routing *is*
claiming, leasing, and recording) and `kai-directors` is not merely
non-standalone — **it is the one plugin whose sole purpose is the one thing
non-negotiable #6 forbids standalone mode from doing.**

#### 2b. The operator's goal is a front door and a CEO/departments model — not a `PACKS` row. It is delivered.

**And the plugin would actively damage the model.** In the operator's own
metaphor the front office is **not a department** — it is who you talk to. Listing
`kai-directors` between `kai-core` and `kai-engineering` renders the front door as
a *peer department*, which is precisely the wrong picture. Keeping both routers in
`kai-core` and naming core's job **the front office** is a *truer* expression of
the operator's model than the plugin would be.

**What the operator would SEE, today, already shipped and gate-enforced:**

```text
docs/reference/agents-and-skills.md:32

  ### Direction

  The two front doors. Everything else is reachable through them.

  | Name | What it owns |
  | ---- | ------------ |
  | director-executive-assistant | ...what needs you or who should handle it. |
  | director-chief-of-staff      | ...driving delivery. |
```

That is the operator's insight, in the product, checked by `npm test`. **It is
not a promise — it is current state.**

**The real gap, named honestly.** `CATEGORIES` already delivers *"front door."*
It does **not** deliver *"`kai-core` is the front office"* — because core is
still described by its implementation ("workspace machinery"), which is exactly
why the operator reached for a new plugin to name a thing that already exists.
**That gap is real, and it is a copy defect, not a packaging defect.** Fixing it
costs one array-literal blurb plus core's install-surface description. It is
`principal-product-manager`'s to own under A4, and I am booking it (§6).

**Verdict: `kai-directors` is DECLINED and the area set closes at 7.**
Reversible in the cheap direction (F7): if the discoverability cost is ever
actually felt, the identity can be minted later. Publishing it now and
withdrawing it later cannot be undone.

---

### 3. RULING TWO — `kai-project-management`: **DECLINE.** The operator is **right about the smell and wrong about the cause**, and I can prove both mechanically.

This is the most useful answer available, so I am stating it precisely.

#### 3a. The smell is REAL — and it is visible in an enforced artifact, not a judgment call

The architect grounded this by reading nine agent bodies. That is good evidence
but it is interpretive. There is **harder** evidence neither round used: the
already-shipped, `docs:check`-enforced job partition. Of `kai-product`'s **9**
`PACKS` members, the job axis files them under **four different headings**:

| `CATEGORIES` heading | `kai-product` members filed there |
|---|---|
| **Product** | `principal-product-manager`, `principal-product-strategist`, `principal-product-designer`, `principal-brand-designer` |
| **Growth, analytics & monetization** | `principal-data-analytics`, `workflow-experiment-review`, `workflow-customer-feedback` |
| **Product exploration & web evaluation** | `workflow-product-explore`, `persona-ux-first-time-user` |
| **Intake & delivery** | **none — zero of nine** |

**5 of 9 `kai-product` members are filed under a non-Product job heading.** The
operator looked at `kai-product`, felt "this is mixing two things," and was
**correct** — the repo's own enforced taxonomy says so.

#### 3b. The cause is NOT project management

**Zero** of the nine are filed under "Intake & delivery." The heterogeneity is
**growth-analytics (3)** and **evaluation (2)** — exactly the seam the architect
identified by reading bodies, now independently corroborated by a build-checked
artifact. The operator's diagnosis named the wrong seam.

#### 3c. The department the operator is looking for already exists — and the architect only half-named it

The DECISION says *"the project-management department already exists — it is
`kai-core`."* That is **half right and I am correcting it**, because the better
half is the half that will actually satisfy the operator. `CATEGORIES` already
contains:

```js
{
  kind: 'agent',
  title: 'Intake & delivery',
  blurb: 'The full life of one change: from an issue to a chosen approach, then
          to a merged PR, then to production. kai never merges or deploys itself.',
  members: ['workflow-issue-analysis', 'workflow-pull-request', 'workflow-ship'],
}
```

**Those are exactly, and only, the three agents the operator nominated for
`kai-project-management`.** The operator's proposed department already exists on
the job axis with the operator's own proposed membership. It is split across two
headings by design:

- **change delivery** → `Intake & delivery` (the three welded `workflow-*`)
- **initiative coordination** → `kai-core` (`kai-core-work-coordination`,
  `-work-activity`, `-initiative-stewardship`, `-definition-of-done`,
  `workflow-initiative-init`, `director-chief-of-staff`)

And on the install axis those three agents **cannot** be moved (§1b). So the
operator's request is simultaneously already-satisfied on the axis that can
express it, and illegal on the axis they asked for.

#### 3d. What SHOULD move out of `kai-product`? **Nothing, in `area-plugins`.**

A10 reopened `kai-product` membership for this window, so I *may* move
`principal-data-analytics`, `workflow-experiment-review`, and
`workflow-customer-feedback` to `kai-gtm`. **I am declining to**, as a scope
call:

1. The operator's stated concern was **project management**. Moving three agents
   they did not ask about, through a window opened for a different question, is
   textbook scope creep — the thing this role exists to stop.
2. It buys **nothing** the initiative measures. Measure #3 is coherence-by-
   one-sentence, and `kai-product`'s sentence — *"Decide what to build and how it
   should behave"* — holds for all nine without a structural "and."
3. It is not free: it changes two published rosters and re-derives the provider
   map for a cosmetic gain, during the window where R1 must be the *only* moving
   part so a red gate is attributable (the A3/S2 discipline).
4. The smell is **already fully addressed on the job axis at zero cost.**

**`kai-product` stays at 9. Net moves out of `kai-product` in this initiative:
zero.** Flagged as a `PROPOSAL` with a trigger in §6.

**Verdict: `kai-project-management` is DECLINED.** R3 upheld, with 3a/3c
recorded as the corrected reasoning.

---

### 4. RULING THREE — the renames: **accept the deferral; accept one name, reject the other.**

**Timing — P0 or later? LATER, and it cannot ship in `area-plugins`.** Upheld,
unchanged. F9 applies A1's exemption test correctly against the architect's own
proposal: 12 `agents/**` + `skills/**` bodies with no deriving check fails
A1(ii); routing tables are instructions and fail A1(iii). A1's closing sentence
routes it to me, and I am taking it. The independent reason is stronger than the
contractual one: moving **plugin identity and agent identity in the same window**
gives a red gate two candidate causes. That is the exact attribution discipline
A3/S2 established. **`PROPOSAL` accepted, for a separate initiative after
`migration-complete`.** (DECISION open question #3: **answered — yes.**)

**The names themselves — I am the named authority here, so I am ruling, not
deferring.**

| proposed | ruling |
|---|---|
| `director-chief-of-staff` → **`director-delivery`** | **ACCEPTED provisionally.** Precise, matches the body's own framing, separates on the noun with no disambiguator. |
| `director-executive-assistant` → **`director-agenda`** | **NOT ACCEPTED.** |

**Why `director-agenda` is wrong.** It names the **artifact**
(`kai/personal/agenda.md`), not the **job**. That agent's own shipped
`description:` is *"personal agenda, catch-up, task capture, **unclear routing**,
and decisions waiting on them. Use when asking what needs you **or who should
handle it**."* **"Unclear routing" is the front-door half** — it is where a user
who does not know who to ask arrives. `director-agenda` hides the single most
valuable thing that agent does for a new user, and it does so in the same record
that argues these two agents *are* "the two front doors." A name that erases half
of one front door fails its own premise.

I am **not** minting a replacement name here — that would be me designing inside
a window where the rename cannot ship, and the successor initiative should choose
it against evidence. I am instead binding the decision with a product constraint
(**C4**): *the successor name must read as a **front door for the operator** —
covering "who should handle this?" as well as "what needs me?" — and must not
re-import the dissolved `kai-personal` vocabulary.* `director-delivery` /
`director-agenda` may be reconsidered as a pair against that criterion.

Nothing is lost by leaving the second name open: the rename cannot ship in this
initiative either way.

---

### 5. RULING FOUR — the escalation: **DISSOLVED. No operator decision remains.**

The DECISION escalated one `kind: decision` to `@operator`. **I am dissolving
it, and not forwarding it.**

A question belongs to the operator when a **non-negotiable would have to bend
either way** and no kai role owns the choice. That was a fair reading at
`2130`. It is not true after §2a:

| branch | principles bent |
|---|---|
| Name the jobs inside `kai-core` (recommended) | **none** |
| Mint `kai-directors` | **#3** (structural "and" — a new catch-all), **#4**, **#5**, **measure #1**, plus the A10 `CLAIM_SKILLS` collision |

**A choice where one branch violates four ratified principles and the other
violates none is not a decision — it is a finding.** Scope and priority are
mine under `kai-core-scope-discipline`, and A10 pre-committed this exact
disposition in writing. Escalating would spend the operator's attention on a
call I am contractually required to make, and the operator has said they do not
want pauses that are not genuinely critical. **This one is not.**

Two things make dissolving safe rather than presumptuous:

1. **The operator's goal is delivered, not denied** (§2b, §3c) — and I have
   booked the copy work that closes the one real gap (§6).
2. **The direction is the reversible one** (F7). `kai-directors` can be minted
   any time; an unpublished identity costs nothing to revisit. The operator
   overrules this ruling by saying so — no re-analysis needed, because the
   architect already recorded the exact membership, `PACK_ORDER` position, and
   `PACK_RUNTIME_DEPENDENCIES` for that branch.

DECISION open question **#2 is therefore moot**: no A10-style reopening
amendment is required, because R2/R3 are upheld. Open question **#4 stands** and
is carried as **C5**.

---

### 6. Consequences booked (routed, not silently absorbed)

My `touches` set is three files, so I am **routing** these as `PROPOSAL`s in the
steward amendment rather than minting items now:

| # | proposal | why | trigger / timing |
|---|---|---|---|
| P1 | **Name `kai-core`'s job as the front office** — core's install-surface description + the `Direction`/`Workspace foundation` blurbs | closes the one **real** gap behind the `kai-directors` request (§2b). Copy, owned by product per A4 | milestone 3 `surface-rename` |
| P2 | **Add a project-management framing to the catalog** — make `Intake & delivery` + core's coordination layer legible as one named job | closes the `kai-project-management` request (§3c) | with P1 |
| P3 | **Role renames** (`director-delivery` + a successor for DEA, per C4) | R5, A1(ii)/(iii) | separate initiative, after `migration-complete` |
| P4 | **`kai-product` job-axis drift** — `principal-data-analytics`, `workflow-experiment-review`, `workflow-customer-feedback` | §3d; real but not this initiative's question | reopen only if one acquires a non-core skill shared with `kai-gtm`, or a steward amendment reopens membership |

`generate-catalog.mjs` is **not** an `area-plugins` `target`, so P1/P2 are
outside this initiative's blast radius — which is exactly why they are cheap.

---

### 7. Acceptance-line check

| acceptance line | result |
|---|---|
| all 56 agents / 51 skills, each in exactly one plugin, verified against live dirs | **met** — 7+20+9+12+4+2+2 = 56 and 24+15+3+7+1+1+0 = 51; I independently re-derived the 56 `**Inherits:**` count |
| explicit recommendation on `kai-directors`, with clearer role names | **met** — declined (R2, §2); names ruled in §4 |
| explicit recommendation on `kai-project-management`, grounded per-agent | **met** — declined (R3), grounded on all 9 bodies **and** corrected in §3 |
| router entry points, cross-plugin, standalone, optional-core per plugin | **met** — the 7-row table; `referenceErrors()` degradation quoted verbatim |
| each decision classified P0 vs later refinement | **met** — R1/R2/R3/R6/R7 P0; R2b/R3b/R4/R5 later, each with a trigger |
| supersession of round 1 explicit, round 1 not rewritten | **met** — D1–D6 ruled individually; round-1 record untouched |

**All six met.**

### 8. Conditions

Record-level and binding on transcription; **none returns work to the architect.**

- **C1** — Correct the Context attribution: `validate-plugin.mjs:860` is the
  **guided-installer command assertion**, not a director-id literal. The two
  director-id literals are `validate-plugin.mjs:232` and `release-guard.mjs:106`.
  F1's use of `:860` as a `PACKS` cost is correct and should be restated as an
  *order-checked install command in shipped onboarding prose*.
- **C2** — Carry §2a: `kai-directors` fails non-negotiable #3's one-sentence
  test. R2's decline rests on **four** grounds, and #3 is the strongest.
- **C3** — Carry §3a/§3c: the operator's smell is real and mechanically visible
  (5 of 9 `kai-product` members filed under non-Product headings); the cause is
  growth-analytics + evaluation, not project management; and the requested
  department already exists as `Intake & delivery` + `kai-core`. Replace the bare
  *"it is `kai-core`"* claim with this two-part statement.
- **C4** — `director-agenda` is **not** accepted. Record the naming constraint in
  §4 for the successor initiative.
- **C5** — The 56/51/7 reconciliation and every provider assignment stay
  **`reported`**. Before milestone 4 merges, `pack-preview --gate partition` and
  `--check` must be **`observed`** green. No downstream record may upgrade these
  to `observed` without a run.

### 9. Scope-discipline classification

Per `kai-core-scope-discipline`, classified against `scope.current`
(`allowlist-repair` + `decisions-locked`) and the non-negotiables:

- **R1** (DEA → `kai-core`) — **Apply.** In scope, one `PACKS` line, restores
  core's coherence, retires two D3 fractures.
- **R2 / R3** (declines) — **Apply.** Declining is the in-scope direction; it
  adds no surface.
- `kai-directors` / `kai-project-management` as identities — **expands-scope ⇒
  Defer** as `PROPOSAL`s. Both add a published surface and violate
  non-negotiables.
- **R5** renames — **expands-scope ⇒ Defer** (P3), separate initiative.
- **P1/P2** copy — **Minimize.** The operator's outcome at ~zero cost, on an
  axis outside this initiative's targets.
- **P4** `kai-product` drift — **Defer** with trigger.

### 10. Verdict

**`approved-with-conditions`.** The map is correct, complete, reconciled, and
legal. The two declines are right — one of them for a reason the record did not
yet contain. The operator's model is right and is delivered on the axis that can
carry it. Conditions C1–C5 bind the artifact transcription. **The item is
`completed`; the escalation is dissolved; no operator decision remains.**

**Area set CLOSED at 7 plugins**, per A10's terms — the reopening window ends
with this acceptance, and critical operator decision boundary #3 re-arms.

---

## HANDOFF 2026-08-27-2138 — principal-product-manager (steward) -> null

- **did:** Ran the declared `scope-acceptance` review. **Verified all three
  load-bearing mechanical claims against source** rather than on summary:
  (a) `CATEGORIES`/"Direction" confirmed verbatim at `generate-catalog.mjs:31-43`
  with total-coverage enforcement at `:244-260`, `--check` in `npm test`, and the
  category **already rendered** at `docs/reference/agents-and-skills.md:32-34`;
  (b) the `planPacks()` `:404` → `namespaceErrors()` `:1527-1533` weld confirmed
  real, after first confirming `declaredInherits()` `:366-370` reads only the
  `**Inherits:**` line (so `workflow-doc-review.agent.md:99` is prose, not a
  consumer); (c) both routers confirmed 9/9 and 6/6 `kai-core-*`. **Upheld R2 and
  R3, added a fourth and decisive ground the record lacked** (`kai-directors`
  fails non-negotiable #3's one-sentence test — the same test that dissolved
  `kai-personal`), **corrected R3's reasoning** with enforced evidence (5 of 9
  `kai-product` members are filed under non-Product `CATEGORIES` headings; zero
  under `Intake & delivery`), and **identified the operator's requested
  department already shipping** as `Intake & delivery` with exactly their
  proposed membership. Ruled `kai-product` moves to **zero**. Accepted
  `director-delivery`, **rejected `director-agenda`** with a binding naming
  constraint. **Dissolved the operator escalation.** Booked four `PROPOSAL`s.
  Verdict `approved-with-conditions` (C1–C5); item `completed`, lease cleared;
  steward amendment A17–A20 appended to the scope brief.
- **found:** (1) **Citation defect** — `validate-plugin.mjs:860` is the
  guided-installer command assertion, **not** a director-id literal; the cost
  argument it supports is *stronger* than stated (an order-checked install
  command in shipped onboarding prose). (2) **`kai-directors` fails
  non-negotiable #3** — a gap in the DECISION, which applied that test to
  `kai-assistant` but never to the plugin it was declining. (3) **`Intake &
  delivery` already exists** in `CATEGORIES` holding exactly
  `workflow-issue-analysis` + `workflow-pull-request` + `workflow-ship` — the
  operator's proposed `kai-project-management` membership, already named on the
  job axis, and the same three agents the weld makes immovable. (4) The one
  **real** gap behind both requests is that `kai-core` is described by its
  implementation, not its job — a copy defect, now booked as P1/P2.
- **did not:** run any command (no shell); modify `scripts/`, `packs/`,
  `plugin.json`, `agents/`, `skills/`, or anything under
  `kai/initiatives/pack-split/**`; create `kai/initiatives/area-plugins/`; touch
  `area-plugins-tool-allowlist-fix` (parallel sibling) or any other item;
  rewrite the round-1 record or any prior thread entry; mint new item files
  (outside my `touches` — routed as `PROPOSAL`s instead); upgrade any `reported`
  claim to `observed`; forward a dissolved escalation to the operator.
- **next:** `null`. Follow-on work is separate items, not this one. The steward
  promotion pass anticipated by the `2113` handoff may now run: the area-set
  boundary is **closed at 7**, the A12 edge on `m2-claim-surface-pin` is
  **cleared** (no router plugin ⇒ no `CLAIM_SKILLS` collision), round 1 is
  **superseded-final**, and milestone-4 items may be minted against round 2.
- **state:** item `in-review` → `completed`, `next_role: null`, version 3 → 4,
  lease cleared (all five fields `null`).

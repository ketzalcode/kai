# Architecture Decision — the three unbound review lenses stay unbound

**Source:** `kai/coordination/items/pack-split-review-lens-binding.md` (v3, `in-progress`,
lease `psa-2026-08-27-1535-rlb`); architect caveat **(b)** carried from
`kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md` §5 and routed here as
Open Question **1** of `kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md`.
**Date:** 2026-08-27 15:47 local
**Run:** principal-swe-architect
**Initiative:** pack-split (milestone `five-pack-split-shipped`)

**Decision (one line):** **DO NOT BIND.** `review-dependencies`, `review-performance-scale`
and `review-success-metrics` are **not** added to `workflow-doc-review`'s `**Inherits:**` line;
they stay placed into `kai-engineering` by `SKILL_OWNER_OVERRIDES` and stay dispatched at run
time via the `skill` tool. **No root source file changes for this reason.**

> **Boundary.** This record decides a seam. It edits no agent body, no override table, no
> generator, no CI, and no release file; it runs no command and creates no work item. The
> implementation obligation it produces for `pack-split-release-12c-3-engineering` is an
> **assertion of absence**, stated below. Item-frontmatter corrections on `12c-3` are the
> steward's to write, and are routed, not made here.

---

## Context

`workflow-doc-review` is an `engineering` agent (`scripts/lib/pack-plan.mjs:70-84`). It routes
nine `review-*` lenses. Six reach it today by inheritance and three do not:

| Lens | On `workflow-doc-review`'s `**Inherits:**` | Placed into `kai-engineering` by |
|------|---|---|
| `review-alternatives`, `review-rationale`, `review-risks-scope`, `review-ux-accessibility` | yes | inheritance (`planPacks`, `pack-plan.mjs:375-383`) |
| `review-security-privacy` | no — inherited by `principal-security`, `principal-privacy-compliance` | inheritance |
| `review-rollout-operability` | no — inherited by `principal-sre`, `workflow-ship` | inheritance |
| **`review-dependencies`, `review-performance-scale`, `review-success-metrics`** | **no** | **`SKILL_OWNER_OVERRIDES` (`pack-plan.mjs:115-117`)** |

The three are not stranded. `workflow-doc-review` names each on a `- **\`id\`** — …` line in its
`## The dimension skills` section, which is exactly the `DISPATCH_ENTRY` shape
(`pack-plan.mjs:814`), so `collectReferences` already records an **orchestrated** engineering →
engineering skill reference for all three, and `referenceErrors` already resolves them
(`pack-plan.mjs:987`; asserted green over the live corpus at `scripts/pack-preview.mjs:713`).
The agent declares the `skill` tool, and the host spike proved delegated cross-plugin `skill`
invocation works after `v0.63.1`
(`kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md`).

None of the nine lenses is `user-invocable`. Under **both** options the three land in
`kai-engineering` — identical to the disposition the partition lock ratified. Binding changes
*how* placement is derived, and what the host loads into one agent's context. It changes nothing
about which pack owns them.

Read for this ruling: `agents/workflow-doc-review.agent.md`; `agents/principal-security`,
`-privacy-compliance`, `-sre`, `workflow-ship` inherits lines; `skills/review-*/SKILL.md`
frontmatter; `scripts/lib/pack-plan.mjs` (`planPacks`, `partitionErrors`, `namespaceErrors`,
`referenceErrors`, `collectReferences`); `scripts/pack-preview.mjs` (`--self-test`,
`gatePartition`); `scripts/validate-plugin.mjs` (inherits-line rules);
`scripts/generate-catalog.mjs`; `kai/initiatives/pack-split/northstar.md`.

## Diagram

Where the three lenses sit, and which mechanism places them. Unchanged by this decision.

```text
  ┌─ kai-core (required, installed always) ───────────────────────────┐
  │  provides kai-core-* names ONLY — namespaceErrors enforces it     │
  └───────────────────────────▲───────────────────────────────────────┘
                              │ cross-plugin inherit
                              │ (host-verified; plugin order does NOT
                              │  change resolution — host-semantics spike)
  BUILD-TIME PLACEMENT        │        RUNTIME, INSIDE ONE PLUGIN
  ────────────────────        │        ────────────────────────────────
  ┌──────────────────────┐    │   ┌─ kai-engineering ──────────────────┐
  │ planPacks()          │    └───┤                                    │
  │  1 pack  ─► that pack│───────►│  workflow-doc-review               │
  │  >1 or core ─► core  │        │   │                                │
  └──────────┬───────────┘        │   ├─ **Inherits:**  load-time,     │
             │ leftover           │   │  ALWAYS loaded                 │
             ▼                    │   │    doc-review-rigor            │
  ┌──────────────────────┐        │   │    review-alternatives         │
  │ orphans — inherited  │        │   │    review-rationale            │
  │ by no agent          │        │   │    review-risks-scope          │
  │        │             │        │   │    review-ux-accessibility     │
  │        ▼             │        │   │                                │
  │ SKILL_OWNER_OVERRIDES│        │   └─ `skill` dispatch  run-time,   │
  │  (reviewed, pinned)  │───────►│      ONLY the lenses that apply    │
  │   review-dependencies│        │        review-security-privacy     │
  │   review-performance-│        │        review-rollout-operability  │
  │     scale            │        │        review-dependencies      ◄┐ │
  │   review-success-    │        │        review-performance-scale ◄┤ │
  │     metrics          │        │        review-success-metrics   ◄┘ │
  └──────────────────────┘        │              the 3 on the table    │
                                  └────────────────────────────────────┘
        placement result: kai-engineering — under BOTH options
```

What `bind` would actually move — and the promotion path it opens:

```text
  workflow-doc-review ──inherits──► review-success-metrics
       (engineering)                       │
                                           ├─ today: 1 pack ─► kai-engineering
                                           │                   (same answer)
  a future product/gtm agent ──inherits────┤
   e.g. principal-product-manager          │
                                           └─ then: >1 pack ─► kai-core
                                                                │
                              namespaceErrors (pack-plan:1492)  ▼
                 "kai-core provides skill `review-success-metrics`, which does
                  not carry the `kai-core-*` prefix … rename it to
                  `kai-core-review-success-metrics`"
                          ^ a one-line, CI-green, ARCHITECTURALLY WRONG remedy
```

## Forces

- **F1 — the initiative's own `out_of_scope` line forbids it.** `northstar.md:31`: *"Rewriting or
  re-scoping agent and skill content; this initiative relocates and guards contracts, it does not
  redesign them."* An `**Inherits:**` line is not packaging metadata — it is the agent's binding
  contract, and the host loads every named skill into that agent's context. Adding three lenses
  changes what `workflow-doc-review` *is*, inside a release (`12c-3`) whose entire job is publish
  protocol. This is the decisive force.
- **F2 — no force pulls toward `bind` today.** There is no observed defect, no failing gate, no
  ambiguous placement, no dangling reference. The three lenses resolve, fire, and ship in the
  right pack right now. "Cheapest architecture is the one you didn't add" applies literally: the
  proposed change resolves nothing that is currently broken.
- **F3 — the stated benefit ("consistency") is not delivered by the proposed change.** Binding
  three would leave `workflow-doc-review` inheriting **7 of 9** lenses and dispatching 2, because
  `review-security-privacy` and `review-rollout-operability` are bound to *other* engineering
  agents that hold them as standing contracts, not to the orchestrator. The rule that actually
  explains today's corpus is *"a lens is inherited by the role that always applies it, and
  dispatched by the router that sometimes applies it."* Binding three produces a different
  inconsistency, not consistency. Reaching real consistency would require binding all five
  unbound lenses — a larger agent redesign, squarely inside F1.
- **F4 — binding fights the agent's own design.** `workflow-doc-review` hard rule 2 is *"Only fire
  the dimensions that apply"*, and its first named anti-pattern is *"Firing every dimension on
  every doc."* Inheritance is unconditional load; dispatch is conditional. Binding moves three
  conditional lenses onto the unconditional path — toward the failure mode the agent exists to
  avoid.
- **F5 — the second benefit ("automatic placement") is already bought.** The concern behind it is
  that a hand-maintained override table rots. It cannot rot silently here: `partitionErrors`
  (`pack-plan.mjs:1465-1487`) fails an override for a skill not on disk, an override naming a
  non-pack, an override for a skill inheritance already places, **and** an orphan with no
  override — four arms, each proven by name in `scripts/pack-preview.mjs:1008-1023`. The table
  is guarded in both directions, so "automatic" buys no safety that is not already held.
- **F6 (tiebreaker) — `bind` selects the worse future failure mode.** Cross-plugin skill
  resolution is by **bare name**; core's defence is that it owns `kai-core-*` exclusively. The
  `review-*` names are bare, so they must never be promoted to core. `planPacks:381` promotes any
  skill inherited from more than one pack. `review-success-metrics` is the most plausible future
  product-agent inheritance in the corpus. Under `bind`, that future change promotes it to core
  and `namespaceErrors` proposes renaming it into core's namespace — a green, wrong, one-line
  fix. Under `do not bind`, the same future change trips `partitionErrors` ("an override for a
  skill inheritance already places") and then a cross-pack `referenceErrors` ("kai-engineering may
  only reach its own pack or kai-core") — two loud gates with **no green wrong answer available**.
  This is a future hazard, not a present force, so it is weighed as a tiebreaker.

## Options considered

| Option | Shape | Cost | Forces |
|---|---|---|---|
| **A — Bind** (standing manager recommendation) | 3 names onto `workflow-doc-review`'s `**Inherits:**`; delete `pack-plan.mjs:115-117`; re-point the `scripts/pack-preview.mjs:440-443` assertion, whose "engineering **orphan** disposition" label silently becomes a test of inheritance | root agent behaviour change + generator-input change inside a publish release; 3 more lens bodies always loaded into the router's context | violates F1, F4; fails to deliver F3; F5 already held; loses F6 |
| **B — Do not bind** *(chosen)* | leave everything as-is | override table keeps 3 entries | satisfies F1–F6 |
| **C — Bind all five unbound lenses** (true consistency) | 5 names onto the Inherits line | full agent redesign; every dispatch conditional collapses | violates F1 and F4 harder than A; not on the table |
| **D — Do nothing and defer** | no ruling; revisit at `12c-3` | leaves `12c-3` generating from an unsettled input — the exact inversion this item was created to prevent | rejected: the call is answerable now, so `Defer` would be evasion, not restraint |

**Rejected explicitly:** A, C, D. A is rejected on F1 primarily and F3 secondarily — the benefit
it is proposed for is not the benefit it produces.

## Decision

- **Disposition:** **Endorse.** The shape already fits the forces. The three lenses stay
  override-placed and dispatch-fired.
- **Recommendation:** change nothing. `agents/workflow-doc-review.agent.md` and
  `SKILL_OWNER_OVERRIDES` are correct as they stand.
- **Consequence for `SKILL_OWNER_OVERRIDES` (`pack-plan.mjs:104-118`):** the three
  `review-*: 'engineering'` entries are **KEPT, byte-unchanged**. They are neither removed nor
  redundant — they are the table's intended population, per its own comment: *"Skills with no
  inherited firing path still need one explicit provider."* Partition invariants:
  `orphans === overrides` holds at **9 = 9** (unchanged); `unplaced === 0` holds (unchanged);
  `plan.local.engineering.includes('review-dependencies')` holds by override, so the
  `scripts/pack-preview.mjs:440-443` assertion stays truthful **and correctly labelled**.
  `namespaceErrors` stays green: no bare-named skill is promoted to core.
- **Does it change any pack other than `engineering`?** **It changes no pack at all** — not even
  `engineering`. Acceptance line 4's escalation trigger therefore **does not fire**: no scope
  question, no new CI assertion, no partition re-lock. The locked partition is consumed exactly
  as ratified.
- **Domain work it implies:** none for `principal-swe-frontend`/`-backend`.
  `principal-swe-infra` inherits an assertion of absence on `12c-3` (below), not a change.
- **What stays the same, deliberately:** the `**Inherits:**` line of every agent in the corpus;
  `SKILL_OWNER_OVERRIDES`; `planPacks`; `partitionErrors`; `namespaceErrors`;
  `scripts/pack-preview.mjs`'s self-test; `docs/how-kai-works.md` §6 (its fan-out diagram depicts
  routing, which is exactly what is preserved); `docs/reference/agents-and-skills.md`
  (`generate-catalog.mjs` groups by a manual category map and never reads `**Inherits:**`, so
  `npm run docs:check` is untouched).
- **Reversibility:** **cheap.** Binding later is 3 added names, 3 deleted override lines, and one
  re-pointed self-test assertion, with `partitionErrors` mechanically forcing the two halves to
  move together (an override kept beside a new inheritance fails by name). Decided fast, per the
  reversibility bar. **Reopen trigger:** a non-`engineering` agent needs one of these three lenses
  as a *standing* contract, or `workflow-doc-review` stops dispatching them. Neither exists today.

## Implementation obligations for `pack-split-release-12c-3-engineering`

Exact, verifiable, and small. The file set this decision requires `12c-3` to change is **empty**;
what follows is how a reviewer proves that rather than assumes it.

1. **Assert absence, don't assume it.** At the reviewed `change_ref`, the cumulative branch diff
   must show **zero** changes to `agents/workflow-doc-review.agent.md`, and **zero** changes to
   `SKILL_OWNER_OVERRIDES` (`scripts/lib/pack-plan.mjs:104-118`). That is the implemented form of
   `12c-3` acceptance line 1 under this verdict — caveat (b) is closed *at generation time* by the
   input being settled, not by an edit.
2. **`scripts/lib/pack-plan.mjs` still changes — for an unrelated reason.** `COMMITTED_PACKS`
   (`pack-plan.mjs:122`) must gain `'engineering'`. Keep it in `12c-3`'s `touches`; do **not**
   read its presence there as this decision leaking in.
3. **`agents/workflow-doc-review.agent.md` should be dropped from `12c-3`'s `touches`.** It is now
   a false claim of intent to modify a root agent body, and `touches` is the parallel-safety
   claim. **Steward edit** (`principal-product-manager`), before `12c-3` is dispatched — not a
   scope escalation, and not mine to write.
4. **Retire the named risk.** `12c-3`'s Notes paragraph *"if the binding verdict is bind, the three
   `review-*` skills move from override-placement to inheritance-placement… the one place in `12c`
   where a decision changes generator behavior"* is **discharged**. `12c-3` now carries exactly one
   kind of risk — publish protocol — like the two releases either side of it. Its title
   ("carrying the ratified review-lens binding") is a steward wording nit; it now carries a
   ratified decision *not* to bind.
5. **Unchanged gates, expected green with no new assertion:** `pack-preview --self-test`,
   `--gate all`, `--check`, `npm run docs:check`, `npm test`. Because this is the no-change branch,
   the current green CI state *is* the evidence — no new run is needed to justify the decision
   itself (`12c-3` will re-run everything anyway for its own reasons).

## Open questions / escalations

**None. No operator decision remains, and nothing is escalated.**

- The decider was the architect by the item's own terms, the manager's `bind` was explicitly a
  recommendation, and it is refused here with reasons.
- Acceptance line 4's steward trigger did not fire — no pack changes.
- The single routed follow-up is obligation **3** (a `touches` correction on `12c-3`), which is
  ordinary steward hygiene, not a decision.
- Not decided here, and not blocked by this: cross-pack **agent** referral qualification —
  `director-executive-assistant:114` and `workflow-weekly-pulse:229` (both `kai-core`) name
  `workflow-doc-review` by bare id, while the host spike requires `kai-<pack>:<agent>` across a
  plugin boundary. `referenceErrors` deliberately permits this (an agent is a routing target that
  degrades to "that pack is not installed", not a load-time dependency). It is a pre-existing,
  corpus-wide referral-prose question, untouched and unaffected by this decision, and it belongs
  to whoever owns cross-pack referral wording — not to `12c-3`.

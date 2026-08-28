---
type: work-item
id: area-plugins-taxonomy-decision
title: Architecture — area plugin taxonomy, including creative-video-director placement
initiative: area-plugins
milestone: decisions-locked
delivery_class: knowledge
state: completed
resume_state: null
priority: 20
owner: null
next_role: null
target: The full agent-to-area assignment replacing kai-personal, with every skill provider resolved
artifact_target: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-decision.md
artifact_target_status: blocked-on-directory-creation; durable record is this item's thread until the initiative directory exists
context_artifacts:
  - kai/coordination/threads/area-plugins-taxonomy-decision.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - scripts/lib/pack-plan.mjs
  - agents/creative-video-director.agent.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
touches:
  - kai/coordination/items/area-plugins-taxonomy-decision.md
  - kai/coordination/threads/area-plugins-taxonomy-decision.md
depends_on:
  - item: area-plugins-scope-brief
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-product-manager
    kind: scope-acceptance
completed_reviews:
  - role: principal-product-manager
    kind: scope-acceptance
    change_ref: null
    verdict: approved
    evidence: "kai/coordination/threads/area-plugins-taxonomy-decision.md"
    record_revision: "DECISION 2026-08-27-1850 (thread entry timestamp; knowledge item, no diff)"
    timestamp: 2026-08-27-1906
change_ref: null
version: 6
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1906
---

## Outcome

A locked taxonomy: every agent assigned to exactly one area plugin, every skill
to exactly one provider, with `kai-personal` dissolved and the
`creative-video-director` placement resolved on evidence.

## Acceptance

- [x] The settled area memberships are recorded unchanged: `kai-learning`
      (instructor-tutor, instructor-teacher, instructor-path-mentor,
      workflow-course-to-audio); `kai-assistant` (director-executive-assistant,
      persona-self, principal-engineer-career-mentor); `kai-wellness`
      (persona-professional-nutritionist, persona-professional-trainer).
- [x] `director-executive-assistant` moving out of `core` into `kai-assistant`
      is assessed against core's remaining coherence and the hooks/skill
      ownership core still carries.
- [x] `creative-video-director` is placed in the **smallest coherent** area on
      stated evidence, with the alternatives and their costs named.
- [x] The four skills that follow it — `create-product-demo`, `demo-capture`,
      `demo-narrate`, `demo-zoom` — are assigned to exactly one provider, and
      `SKILL_OWNER_OVERRIDES` is updated accordingly.
- [x] The `lectoria` runtime dependency currently declared for `personal` is
      reassigned to the areas that actually execute it, and
      `PACK_RUNTIME_DEPENDENCIES` / `runtimeDependencyMatrix()` stay derived.
- [x] Every agent in the roster remains assigned to exactly one plugin; no
      skill has two providers; `--gate partition` and `--gate collision` stay
      green by construction.
- [x] Names whether the placement is a genuinely critical decision boundary
      requiring the operator, or a reversible engineering call.

## Notes

**Grounded fact (director, 2026-08-27-1818):** `creative-video-director` is the
sole agent in the roster referencing `create-product-demo`, `demo-capture`,
`demo-narrate`, or `demo-zoom`. Those four skills therefore follow its
placement, which collapses a would-be second decision into this one. Its
`**Inherits:**` line carries `kai-core-content-grounding` and `video-direction`,
and its documented consumers are `product_context.json` /
`media_manifest.json` produced by `principal-product-marketing` — which lives
in `kai-gtm`, not in the dissolving `kai-personal`.

**Environment limit:** no shell in this session; record the decision in this
item's thread until the initiative directory exists.

## Steward promotion — 2026-08-27-1839 (principal-product-manager)

**`proposed -> ready`. Priority 20 unchanged.**

Dependency satisfied: `area-plugins-scope-brief` is `completed` (version 3,
lease null); the scope decision is the `BRIEF 2026-08-27-1839` packet in
`kai/coordination/threads/area-plugins-scope-brief.md`, added to
`context_artifacts` above. No acceptance line was rewritten.

**Decide now, ship late.** The scope brief's ordering ruling sequences the
`area-taxonomy-split` milestone *fourth* — after `optional-core-contract` and
`surface-rename` — so that `kai-learning`, `kai-assistant`, and `kai-wellness`
are minted only once, at `@kai`, under `plugins/`, already carrying the final
dual-path contract. That is a **ship** constraint, not a **decide** constraint:
this record is authored now, in milestone 1, alongside the optional-core
record.

**Precedence.** Where this record and `area-plugins-optional-core-architecture`
touch the same question — chiefly `director-executive-assistant` leaving
`core` — **the optional-core record takes precedence.** No hard `depends_on`
was added so milestone 1 is not needlessly serialised; resolve both in one
coherent pass.

**Product constraint on the `creative-video-director` placement.** Smallest
coherent area, tested by the one-sentence job test: an area whose job cannot be
stated in one sentence is a catch-all, and dissolving a catch-all is the point
of this work. **Creating a new area to house one agent is out of scope** and is
critical operator boundary #3 in the brief — escalate rather than decide it.
The honest tension is yours to weigh, not mine to pre-empt: `kai-gtm` follows
the agent's input producer (`principal-product-marketing`) but imports four
`demo-*` skills and a runtime dependency it currently does not declare; any of
the three new areas keeps `kai-gtm` clean but weakens that area's one-sentence
job.

**Additional grounded evidence for acceptance line 5 (`lectoria`), captured
2026-08-27 from C:\src\kai.** The reassignment is not a rename of one
declaration — it is a 2-way to 3-way split. `PACK_RUNTIME_DEPENDENCIES` today
declares `lectoria` for `core` and `personal`, but the only on-disk consumers
are `agents/workflow-course-to-audio.agent.md` (-> `kai-learning`),
`skills/demo-narrate/SKILL.md` (-> follows `creative-video-director`), and
`skills/kai-core-generate-audio/SKILL.md` (-> `core`).
`PACK_RUNTIME_DEPENDENCIES` and `runtimeDependencyMatrix()` must stay derived
across that split.

**On `director-executive-assistant` leaving `core`.** `core` is 7 agents today
and becomes 6. `HOOKS_OWNER = 'core'` is a plugin-level assignment, not an
agent-level one, so the single-`hooks.json`-owner invariant should survive the
move — confirm it rather than assume it. If core needs a *replacement* agent to
remain coherent, that is added scope and critical operator boundary #6.

Lease and owner deliberately left clear for `director-chief-of-staff` to
dispatch.

## Architecture decision — 2026-08-27-1850 (principal-swe-architect)

**`ready -> in-review`, lease cleared, `next_role: principal-product-manager`**
for the `scope-acceptance` review this item carries. Not `completed`: the review
requirement is unsatisfied, so `completed_reviews` stays empty.

The decision record is the `DECISION 2026-08-27-1850` packet in
`kai/coordination/threads/area-plugins-taxonomy-decision.md`. All seven
acceptance lines are satisfied **as decisions**; the code edits they imply
(`PACKS`, `SKILL_OWNER_OVERRIDES`, `PACK_RUNTIME_DEPENDENCIES`, `planPacks()`,
`packDescription()`) land in the `area-taxonomy-split` milestone per the scope
brief's *decide now, ship late* ruling. No production code, script, pack,
manifest, agent or skill was modified by this run.

**The map.** 7 plugins, 56 agents: `core` 6 · `engineering` 20 · `product` 9 ·
`gtm` 12 · `learning` 4 · `assistant` 3 · `wellness` 2. Verified against the
live roster by reading `agents/` — 56 `*.agent.md` files, each appearing exactly
once. Skills: 51 on disk (not the lock's 50 — `kai-core-contract-v1` is now on
disk and `fleet-observation` was renamed `kai-core-fleet-observation`), split
core 24 · engineering 15 · product 3 · gtm 7 · learning 1 · assistant 1 ·
wellness 0.

**`creative-video-director` -> `kai-gtm`**, with `video-direction` and the four
`demo-*` skills, their five JS assets and the `lectoria` declaration. Decided on
the input contract (its only factual inputs come from `principal-product-marketing`
∈ `kai-gtm`, so anywhere else it cannot start standalone) and the one-sentence
job test (`kai-assistant` would need a structural "and", re-creating a
mini-catch-all in the area minted to prove catch-alls are gone). The cost is
real and named: `kai-gtm` carries five demo skills and a runtime dependency its
sales/pricing/SEO users will never run. Accepted because the bytes are inert —
the host does not run `npm` — while the alternative violates a non-negotiable.

**The load-bearing finding: the settled taxonomy does not compile today.**
`kai-core-decision-brief` and `kai-core-executive-consultation` are inherited by
`director-executive-assistant` *alone*, so the operator-settled move of that
agent out of `core` makes `planPacks()` hand two `kai-core-*` ids to
`kai-assistant`, and `namespaceErrors()` turns `--gate partition` red. The
`creative-video-director` move does the same to `kai-core-content-grounding`.
The minimal fix is one condition in `planPacks()` — the `kai-core-` prefix
decides the provider, evaluated before the consumer-topology heuristic — and it
is **provably byte-neutral on today's tree**, so it can ship in
`optional-core-contract`, ahead of the split, with one variable moving. This is
required by the settled DEA membership on its own; it is not a cost of the
`creative-video-director` placement.

**`lectoria` correction.** The routed evidence expected a 2-way -> 3-way split
with `kai-learning` acquiring it. The files say 2-way -> **2-way**: `core` +
`gtm`. `kai-core-generate-audio/SKILL.md:17,48` binds execution to the
`<kai-core-plugin>` provider root and says *"Never derive it from a calling"*
pack, and `validate.yml:117-129` probes exactly that — so a `kai-learning`
instructor runs `lectoria` out of **core's** `node_modules` and `kai-learning`
declares nothing. Rule locked: a pack declares a runtime dependency **iff** it
ships a file resolving that dependency from its own plugin root. CI legs go
5 -> 8 with zero workflow edits; binary-asserting legs move from
`{kai-core, kai-personal}` to `{kai-core, kai-gtm}`.

**Core at 6 is more coherent, not less.** `director-executive-assistant` was the
only agent in `core` that was not workspace-and-coordination machinery.
`HOOKS_OWNER = 'core'` survives — confirmed by checking that DEA and its three
distinctive skills carry zero `scripts/*` references and no `user-invocable`
flag, so no hook-asset ownership moves. Critical boundary #6 is **not** hit;
core needs no replacement agent.

**Critical-boundary call: not critical — a reversible engineering call, made.**
Boundary #3 (a new area is the only coherent home) is not reached. Cheap to
reverse until `kai-gtm@kai` publishes with the agent inside, which the brief's
*decide-now-ship-late* ordering keeps two milestones away.

**Flagged, not resolved — the optional-core coupling.** Four core-provided
skills now have single-area consumers (`kai-core-decision-brief`,
`kai-core-executive-consultation` -> assistant; `kai-core-content-grounding` ->
gtm; `kai-core-generate-audio` -> learning). Whether standalone completeness
requires relocating them belongs to `area-plugins-optional-core-architecture`,
which takes precedence. No ruling was made here on the preflight, degraded or
standalone-mode contract, and neither that item nor its thread was touched.

**One question blocks the steward's own acceptance line.**
`validate-plugin.mjs:860` derives `guidedInstallCommands` from `PACK_ORDER`, so
the split **mechanically forces** an edit to
`skills/kai-core-workspace-onboarding/SKILL.md` under every placement option —
which reads against milestone 4's *"no agent or skill body was rewritten to make
the taxonomy work."* Rule (a) derived identity strings are packaging and exempt,
or (b) they are content, in which case that acceptance line and the validator
conflict and one must move. Same class: the `<kai-personal-plugin>` literals in
`demo-narrate/SKILL.md`. Also recorded as input to
`area-plugins-migration-architecture`: the string `kai-personal` survives a
fully green build in both of those skill bodies — a silent-stranding path that
no gate catches.

## Scope acceptance — 2026-08-27-1906 (principal-product-manager)

**`in-review -> completed`. Verdict `approved`. Version 6, lease cleared,
`next_role: null`.** Reasoning: the `REVIEW 2026-08-27-1906` packet in
`kai/coordination/threads/area-plugins-taxonomy-decision.md`. `change_ref` is
`null` — `knowledge` item, no diff; the accepted record revision is the
`DECISION 2026-08-27-1850` thread entry.

**The compile defect was reproduced, not accepted on summary.** Verified the
`planPacks()` topology rule (`pack-plan.mjs:414-419`) against the
`namespaceErrors()` name rule (`:1527-1546`); verified by grep over `agents/`
that `kai-core-decision-brief` and `kai-core-executive-consultation` appear on
`director-executive-assistant.agent.md:7` and nowhere else; verified the
`kai-core-content-grounding` second instance. I also probed for a **third** case
the record might have missed — `kai-core-personal-agenda` — and it is not one,
because `workflow-proactive-scan` keeps a core consumer. The enumeration of
exactly two is complete and D3 is the minimal correct fix.

**The `lectoria` correction is accepted, and it corrects me.** My routed
evidence said 2-way -> 3-way; the files say 2-way -> 2-way (`core` + `gtm`),
because `kai-core-generate-audio` binds execution to the kai-core provider root
and forbids deriving it from a calling pack, while `demo-narrate` resolves the
binary from its own plugin root. The locked rule — a pack declares a runtime
dependency **iff** it ships a file resolving that dependency from its own plugin
root — is the right abstraction and keeps `runtimeDependencyMatrix()` derived.

**`creative-video-director -> kai-gtm` accepted** on the input-contract and
one-sentence-job forces, with the GTM-bloat cost named and accepted. Both
critical-boundary calls concurred: #3 (new area) and #6 (core coherence) are not
reached, so no operator escalation was owed.

**Routed installer question — RULED (a).** Generator-derived identity strings in
a skill body are **packaging, not content**, and are exempt from *"no agent or
skill body was rewritten to make the taxonomy work."* The line was defective as
written — the same derivation runs over `MARKETPLACE`, so milestone 3 forces the
identical edit before the taxonomy split ever runs — and it is amended
initiative-wide with a three-criterion boundary in
`kai/coordination/threads/area-plugins-scope-brief.md`
(`STEWARD AMENDMENT 2026-08-27-1906`).
`skills/kai-core-workspace-onboarding/SKILL.md` satisfies all three criteria
today. `skills/demo-narrate/SKILL.md` fails criterion (ii) — nothing derives or
pins its `<kai-personal-plugin>` literals — and that half is **routed to
`area-plugins-migration-architecture`, not legislated here**, because inventing
a new CI gate by steward fiat is the expansion I hold others to.

**Sequencing consequence.** D3's `planPacks()` prefix condition is byte-neutral
today and moves **into** milestone `optional-core-contract` as a named
deliverable, sequenced with — never inside — that milestone's PR-2. Milestone
`area-taxonomy-split` is gated on D3 having landed, since its own acceptance
demands gates green *by construction, not by exception*. The milestone order is
unchanged; see the BRIEF amendment.

**One factual note for the record, non-blocking and changing nothing.** This
item's summary line above lists `kai-core-generate-audio -> learning` among the
single-area-consumer skills; `workflow-weekly-pulse` (core) also inherits it, so
it stays core-provided by topology as well as by prefix. The thread's D4 table
states this correctly. No decision depends on the distinction.

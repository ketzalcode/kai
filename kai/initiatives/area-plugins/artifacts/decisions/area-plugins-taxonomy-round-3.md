# Architecture Decision — round 3: the nine-plugin map, the `kai-directors` standalone exception, and the two mechanical resolutions

**Source:** `kai/coordination/items/area-plugins-taxonomy-round-3.md` (state `ready`,
version 1, lease `apx-tax3-20260827-2200-p1`), carrying the **main agent's override**
of round 2.
**Date:** 2026-08-27 22:15 local
**Run:** principal-swe-architect
**Initiative:** area-plugins (milestone `decisions-locked`)
**Supersedes:** `area-plugins-taxonomy-decision` (round 1, `DECISION 2026-08-27-1850`)
and `area-plugins-taxonomy-round-2` (`DECISION 2026-08-27-2130`). **Neither is
rewritten.**

**Decision (one line):** **Nine plugins.** `kai-directors` and
`kai-project-management` are accepted as ruled by the main agent; the two
mechanical consequences round 2 identified are **resolved, not deferred** — the
`kai-core-*` namespace seam is green **by construction** under the already-planned
D3 prefix fix (which suffices unchanged), and the claim-surface collision
**dissolves without altering `CLAIM_SKILLS`**, because `kai-directors` provides
zero skills and zero assets, so a core-less install structurally cannot claim.

> **Boundary.** This record decides seams. It edits no agent body, no skill, no
> generator, no gate, no manifest, and no plugin identity. It runs no command.
> The implementation obligations it produces belong to milestone 4 items that do
> not exist yet; they are stated as **handoffs**, and minting them is the
> steward's call, not mine.

---

## Evidence discipline — `reported` vs `observed`

**Nothing was executed this session. No shell exists.** No `npm test`, no
`pack-preview --gate partition`, no `--check`, no `node`.

Therefore **every** count, provider assignment, gate outcome and byte claim in
this record is **`reported`** — derived by reading source files at `C:\src\kai`.
None is `observed`. The list of what must be `observed` green before milestone 4
merges is in §10. No downstream record may promote anything here to `observed`
without a run.

**What I read this session, by file** (no remembered roster trusted):

| source | what it fixed |
|---|---|
| `agents/*.agent.md` | directory enumerated — **56** files, `reported` |
| `skills/*/SKILL.md` | glob enumerated — **51** directories, `reported`; 24 carry `kai-core-`, 27 do not |
| all 56 `**Inherits:**` lines | one `grep`, exactly 56 matches, one per agent — **the provider map in §4 is derived from these, not from the shipped lock** |
| `pack-plan.mjs:63-98` | `PACKS` — the live 5-pack partition |
| `pack-plan.mjs:104-121` | `SKILL_OWNER_OVERRIDES` — the 10 orphan dispositions |
| `pack-plan.mjs:128-150` | `PACK_RUNTIME_DEPENDENCIES`, `RUNTIME_ARTIFACTS` (`lectoria`) |
| `pack-plan.mjs:157-173` | `runtimeDependencyMatrix()` — **throws** on a pack with no declared plan |
| `pack-plan.mjs:366-434` | `declaredInherits()` / `inheritedSkills()` / `planPacks()` — provider assignment by **consumer topology** |
| `pack-plan.mjs:1400-1436` | `hooksAssignmentErrors()` — single owner, asset co-location |
| `pack-plan.mjs:1452-1526` | `partitionErrors()` |
| `pack-plan.mjs:1527-1546` | `namespaceErrors()` — enforces the prefix **in both directions** |
| `pack-plan.mjs:1022-1065` | `referenceErrors()` — including the `kind: 'agent'` carve-out that legalises routing |
| `pack-plan.mjs:1620-1636` | `DISPATCHING_ROLES`, `AVAILABILITY_RULES`, `availabilityErrors()` |
| `pack-plan.mjs:1643+` | `guaranteeBlockErrors()` — per-pack block-copy arithmetic |
| `validate-plugin.mjs:229-241` | `ACTIVITY_EXEMPT` — a director-id literal at `:232` |
| `validate-plugin.mjs:850-870` | the **ordered guided-installer command assertion**, derived from `PACK_ORDER` |
| `generate-catalog.mjs:26-186` | `CATEGORIES` — the second enforced total partition |
| `hooks.json` | `${PLUGIN_ROOT}/scripts/observe-subagent.mjs` ×2 |
| `pack-preview.mjs:546-558, 760, 841, 1032-1045` | the self-test fixtures that name `kai-personal` and `lectoria` |
| `items/area-plugins-m2-planpacks-prefix.md` | the **D3 prefix fix** as specified and promoted |
| `items/area-plugins-m2-claim-surface-pin.md` | `CLAIM_SKILLS` (14 members), the gate arms, `standaloneBlockErrors()` |
| `threads/area-plugins-scope-brief.md` | non-negotiables #1–#13, critical operator boundaries #1–#8, A13 |
| `threads/area-plugins-taxonomy-round-2.md` | the weld finding, measure #1, C1–C5, the R5 naming ruling |
| `threads/area-plugins-optional-core-architecture.md` | the Contract / Claim / Capability families |
| `agents/director-*.agent.md` | grepped for `scripts/*.mjs\|ps1\|sh\|py` — **zero matches** (§7, D-4) |

---

## Context

Round 2 recommended **against** both `kai-directors` and `kai-project-management`
and held the count at seven. **The main agent reviewed and accepted both.** That
ruling is implemented here and is not relitigated. What round 2 got *mechanically*
right binds harder now, and §5–§7 discharge it.

**The two accepted rulings, recorded faithfully:**

**(1) `kai-directors` — ACCEPTED as an executive routing layer, not a
department.** The human is the CEO; the two `director-*` agents are front doors
*over* the departments rather than a department beside them. It **may be an
explicit exception to department standalone semantics**: with no core it may
perform **read-only discovery and routing** and **offer core installation**, but
it **must not claim leases, create canonical coordination, or impersonate full
delivery**. With core it gains durable orchestration. The main agent's judgment,
recorded as reasoning: *this exception is clearer than keeping human-facing
routers inside an implementation-named core.*

**(2) `kai-project-management` — ACCEPTED as a product boundary**, and round 2's
**weld finding is upheld and respected**: `workflow-ship`,
`workflow-pull-request` and `workflow-issue-analysis` **stay in
`kai-engineering`**. Initial membership is the current core *coordination*
workflows — `workflow-initiative-init`, `workflow-weekly-pulse`,
`workflow-proactive-scan`. `workflow-workspace-init` and `workflow-self-check`
stay in technical core. Division of labour: **product** keeps discovery, scope,
design, strategy, analytics, feedback, experiments; **project management** owns
portfolio/initiative creation, progress visibility, scheduling/cadence, and
proactive action surfaces. Whether a new principal project/program manager agent
is needed is a **later question** (§9, L4) — named, not invented.

**One correction to the dispatch's own premise, made early because everything
downstream depends on it.** The dispatch names three fracture cases and instructs
me to derive the full set rather than trust them. Derived from all 56
`**Inherits:**` lines: **there are six, and one of the three named is not one of
them.** `kai-core-personal-agenda` has **two** consumers —
`director-executive-assistant` (→ `kai-directors`) and `workflow-proactive-scan`
(→ `kai-project-management`) — which lands in **different** packs, so
`planPacks()` sees `packs.size === 2` and assigns it to `core` by topology. It is
green with or without the prefix fix. Four cases the dispatch does not name **are**
red. Full enumeration in §5.

---

## Diagram

### 1. Boundary — the nine plugins, what each *provides*, and the two seams

`n · m · a` = agents · locally-provided skills · locally-owned assets. Every
figure `reported`.

```text
                                THE HUMAN  (CEO)
                                      │
                        ┌─────────────┴──────────────┐
                        │      kai-directors         │  2 · 0 · 0
                        │  "the front door: it       │  ◀── STANDALONE EXCEPTION
                        │   decides who handles what"│      core-less: discovery +
                        └─────────────┬──────────────┘      routing + install offer.
                                      │                     No claim. No canonical
             routes to ───────────────┤                     coordination. (§7)
             (kind:'agent' refs;      │
              referenceErrors() :1057 │
              sanctions cross-pack,   │
              degrades to "not        │
              installed")             │
   ┌──────────┬──────────┬────────────┼────────────┬──────────┬──────────┐
   ▼          ▼          ▼            ▼            ▼          ▼          ▼
┌────────┐┌────────┐┌─────────┐┌──────────┐┌──────────┐┌─────────┐┌──────────┐
│kai-    ││kai-    ││kai-     ││kai-gtm   ││kai-      ││kai-     ││kai-      │
│project-││engin-  ││product  ││          ││learning  ││assistant││wellness  │
│mgmt    ││eering  ││         ││          ││          ││         ││          │
│3 ·0 ·0 ││20·15·6 ││ 9 ·3 ·0 ││12 ·7 ·5  ││ 4 ·1 ·0  ││2 ·1 ·0  ││2 ·0 ·0   │
│CORE-   ││        ││         ││+lectoria ││          ││         ││standalone│
│DEPENDENT│        ││         ││          ││          ││         ││= COMPLETE│
└────┬───┘└───┬────┘└────┬────┘└────┬─────┘└────┬─────┘└────┬────┘└────┬─────┘
     │        │          │          │           │           │          │
     └────────┴──────────┴────┬─────┴───────────┴───────────┴──────────┘
                              │   **Inherits:** `kai-core-*`   (all 24)
                              │   ══════ THE OPTIONAL SEAM ══════
                              ▼
                  ┌───────────────────────────────┐
                  │  kai-core        2 · 24 · N   │
                  │  "the machinery a durable kai │
                  │   workspace runs on"          │
                  │  • all 24 `kai-core-*` skills │
                  │  • all 14 CLAIM_SKILLS        │
                  │  • hooks.json (sole owner)    │
                  │  • kai-core-contract-v1 probe │
                  │  • lectoria                   │
                  │  OPTIONAL (non-negotiable #4) │
                  └───────────────────────────────┘

  ZERO-LOCAL-SKILL PLUGINS ARE A CLASS, NOT A ONE-OFF: directors,
  project-management, wellness. Two are core-dependent; wellness is not.
  The difference is derivable — see §7.5.
```

### 2. The namespace seam — why six skills fracture, and why one condition closes all six

```text
  planPacks()  (pack-plan.mjs:405-410)          namespaceErrors()  (:1527-1546)
  assigns a provider by CONSUMER TOPOLOGY  ───▶  judges that provider by NAME
  ────────────────────────────────────────       ──────────────────────────────
   if (!packs)              -> orphan             core may provide ONLY  kai-core-*
   if (size>1 || has core)  -> core               NO area may provide ANY kai-core-*
   else                     -> that one pack

  SPLITTING CORE NINE WAYS MOVES CONSUMERS. SIX kai-core-* SKILLS FOLLOW THEM OUT:

   skill                             sole/all consumers land in     topology says   NAME says
   ───────────────────────────────── ────────────────────────────── ─────────────── ─────────
   kai-core-decision-brief           DEA                → directors  directors      core  🔴
   kai-core-executive-consultation   DEA                → directors  directors      core  🔴
   kai-core-initiative-stewardship   DCoS               → directors  directors      core  🔴  NEW
   kai-core-proactive-scan           proactive-scan     → project-mgmt project-mgmt  core  🔴  NEW
   kai-core-pulse-digest             weekly-pulse       → project-mgmt project-mgmt  core  🔴  NEW
   kai-core-content-grounding        video-dir+demand+li→ gtm (all 3)  gtm           core  🔴  NEW

   kai-core-personal-agenda          DEA(directors) + scan(project-mgmt)  = 2 packs -> core  ✅
                                     ^^ NAMED IN THE DISPATCH AS A FRACTURE. IT IS NOT ONE.

  THE FIX (already specified + promoted as `area-plugins-m2-planpacks-prefix`):

     if (!packs) { orphans.push(s); continue; }              // unchanged
     if (s.startsWith(CORE_SKILL_PREFIX) || packs.size > 1 || packs.has('core'))
       inheritedCore.push(s);                                //  ◀── one condition
     else inheritedLocal[[...packs][0]].push(s);

  AFTER: the NAME decides. All 24 kai-core-* -> core. All 6 fractures close.
         namespaceErrors() direction 2 (no area claims kai-core-*)  ✅ by construction
         namespaceErrors() direction 1 (core provides only kai-core-*) ✅ — see §5.3
         CLAIM_SKILLS "core-provides / no-area-provides"             ✅ by construction

  VERDICT: THE D3 FIX SUFFICES UNCHANGED. Not extended. Not replaced.
```

### 3. The `kai-directors` standalone exception — control flow

```text
   session starts, an agent in kai-directors loads
                     │
                     ▼
        is kai-core installed?  (kai-core-contract-v1 probe)
              │                                    │
             YES                                   NO
              │                                    │
              ▼                                    ▼
   ┌────────────────────────┐        ┌──────────────────────────────────┐
   │ FULL MODE              │        │ ROUTER-STANDALONE MODE           │
   │ 7-9 kai-core-* skills  │        │ ON DISK: two agent bodies. That  │
   │ on disk: lease grammar,│        │ is the entire plugin. 0 skills,  │
   │ handoff packets,       │        │ 0 assets, 0 CLAIM_SKILLS.        │
   │ item/thread contracts, │        │                                  │
   │ initiative stewardship │        │ MAY:  read; enumerate the roster │
   │                        │        │       the session exposes; name  │
   │ durable orchestration  │        │       the right role; offer      │
   └────────────────────────┘        │       ONE install path for core. │
                                     │                                  │
                                     │ CANNOT (structurally — the       │
                                     │ procedures are not on disk):     │
                                     │   claim/renew a lease            │
                                     │   write kai/coordination/**      │
                                     │   mint an item/thread/initiative │
                                     │   emit HANDOFF/DECISION/REVIEW   │
                                     │   assert shipped / completed     │
                                     └──────────────────────────────────┘

   THE GUARANTEE IS THE SAME ONE THE ACCEPTED ARCHITECTURE ALREADY RESTS ON:
   structural withholding of the Claim family, not prompt refusal. kai-directors
   is not weaker than a department here — it is the *strongest* case, because it
   ships literally nothing but two bodies.
```

---

## Forces

Named concretely. Each drove a specific call below.

1. **`planPacks()` decides by topology; `namespaceErrors()` judges by name.**
   Splitting core nine ways moves consumers across packs, so six `kai-core-*`
   skills get assigned to a non-core provider while still carrying the prefix.
   `--gate partition` red, six times. (`pack-plan.mjs:405-410` vs `:1527-1546`.)
2. **`namespaceErrors()` fires in the *other* direction too.** Any non-prefixed
   skill whose consumers span two packs gets promoted to `core` — and core may
   provide only `kai-core-*`. This is round 2's weld. It is the reason
   `workflow-ship` / `-pull-request` / `-issue-analysis` cannot leave
   `kai-engineering`, and **the main agent's decision to leave them there is
   load-bearing for gate legality, not a courtesy.**
3. **`CLAIM_SKILLS` is asserted core-provided and area-provided-by-none**
   (`area-plugins-m2-claim-surface-pin`), and 7 of the 14 are inherited by the
   two routers. A router plugin that *provided* any of them would break the pin.
4. **`runtimeDependencyMatrix()` throws** on any pack with no declared runtime
   plan (`pack-plan.mjs:161`). Nine packs means nine keys, or the generator dies.
5. **`hooks.json` executes on the host for every installed copy.** Two owners =
   the observer fires twice per subagent; zero owners = never
   (`pack-plan.mjs:1400-1416`).
6. **`SKILL_OWNER_OVERRIDES` names `personal`**, a pack this map dissolves. Four
   entries point at a key that will not exist; `planPacks()` drops them into
   `unplaced` and `partitionErrors()` fires.
7. **Plugin identity is expensive and one-way.** `PACK_ORDER`,
   `COMMITTED_PACKS`, the CI matrix legs, `marketplace.json`, the **derived**
   `legacy-rollback` forbidden set (non-negotiable #9), and the
   **order-checked** guided-installer command list asserted at
   `validate-plugin.mjs:855-869` all scale with the count. Nine is a bigger bill
   than seven, and it is paid once.
8. **Non-negotiable #3** — every successor area states its job in one sentence
   without "and" doing structural work. Round 2's decisive ground against
   `kai-directors`. The override does **not** waive it (§3.2).
9. **Non-negotiable #4 / #6** — an area agent must *load* without core, and must
   never claim durably without it. A router with no coordination has nothing to
   route; the steward routed this as a binding question.
10. **Round-2 measure #1** ("installed alone: bodies **and** contracts") was
    applied to reject `kai-directors` — but round 2's *own accepted map* already
    shipped `kai-wellness` at **2 · 0**. The measure was applied inconsistently,
    which is a force *for* the override, not against it (§3.3).

---

## §1. The nine-plugin map — agents

All figures **`reported`**, derived from `agents/` (56 files) and the membership
below.

| # | plugin | agents | n |
|---|---|---|---|
| 1 | **kai-core** | `workflow-workspace-init`, `workflow-self-check` | **2** |
| 2 | **kai-directors** | `director-chief-of-staff`, `director-executive-assistant` | **2** |
| 3 | **kai-project-management** | `workflow-initiative-init`, `workflow-weekly-pulse`, `workflow-proactive-scan` | **3** |
| 4 | **kai-engineering** | `principal-swe-architect`, `principal-swe-backend`, `principal-swe-frontend`, `principal-swe-infra`, `principal-swe-manager`, `principal-solutions-architect`, `principal-sre`, `principal-security`, `principal-privacy-compliance`, `principal-qa-ui`, `principal-data-engineer`, `principal-ai-applied-engineer`, `principal-ai-researcher`, `principal-technical-writer`, `workflow-pull-request`, `workflow-issue-analysis`, `workflow-incident-response`, `workflow-ship`, `workflow-doc-review`, `workflow-localization` | **20** |
| 5 | **kai-product** | `principal-product-manager`, `principal-product-designer`, `principal-product-strategist`, `principal-brand-designer`, `principal-data-analytics`, `persona-ux-first-time-user`, `workflow-product-explore`, `workflow-experiment-review`, `workflow-customer-feedback` | **9** |
| 6 | **kai-gtm** | `principal-sales`, `principal-growth`, `principal-demand-generation`, `principal-product-marketing`, `principal-seo`, `principal-linkedin-strategist`, `principal-partnerships`, `principal-pricing-monetization`, `principal-revenue-operations`, `principal-customer-success`, `workflow-support-triage`, **`creative-video-director`** | **12** |
| 7 | **kai-learning** | `instructor-tutor`, `instructor-teacher`, `instructor-path-mentor`, `workflow-course-to-audio` | **4** |
| 8 | **kai-assistant** | `persona-self`, `principal-engineer-career-mentor` | **2** |
| 9 | **kai-wellness** | `persona-professional-nutritionist`, `persona-professional-trainer` | **2** |

**2 + 2 + 3 + 20 + 9 + 12 + 4 + 2 + 2 = 56.** ✅ `reported`

## §2. The nine-plugin map — skills

Provider derived from all 56 `**Inherits:**` lines, **under the D3 prefix fix**,
plus the retargeted `SKILL_OWNER_OVERRIDES`.

| # | plugin | locally-provided skills | m |
|---|---|---|---|
| 1 | **kai-core** | **all 24 `kai-core-*`**: `-team-operating-rules`, `-workspace-conventions`, `-work-coordination`, `-work-activity`, `-peer-communication`, `-scope-discipline`, `-no-self-remediation`, `-definition-of-done`, `-initiative-stewardship`, `-issue-analysis`, `-pr-delivery`, `-decision-brief`, `-executive-consultation`, `-personal-agenda`, `-proactive-scan`, `-pulse-digest`, `-workspace-onboarding`, `-fleet-observation`※, `-contract-v1`※, `-web-evaluation`, `-web-content-extraction`, `-content-grounding`, `-design-grounding`, `-generate-audio` | **24** |
| 2 | **kai-directors** | — none — | **0** |
| 3 | **kai-project-management** | — none — | **0** |
| 4 | **kai-engineering** | `research-before-coding`, `pr-sizing`, `coding-style`, `build-diagrams`, `review-security-privacy`, `review-rollout-operability`, `doc-review-rigor`, `review-alternatives`, `review-rationale`, `review-risks-scope`, `review-ux-accessibility`, `onboard-to-codebase`※, `review-dependencies`※, `review-performance-scale`※, `review-success-metrics`※ | **15** |
| 5 | **kai-product** | `ui-mockup`, `html-block-diagrams`, `product-exploration` | **3** |
| 6 | **kai-gtm** | `video-direction`, `linkedin-content`, `product-marketing-intelligence`, `create-product-demo`※, `demo-capture`※, `demo-narrate`※, `demo-zoom`※ | **7** |
| 7 | **kai-learning** | `generate-html-lesson` | **1** |
| 8 | **kai-assistant** | `extract-writing-style` | **1** |
| 9 | **kai-wellness** | — none — | **0** |

※ = placed by `SKILL_OWNER_OVERRIDES`, not by inheritance (10 skills have no
`**Inherits:**` consumer).

**24 + 0 + 0 + 15 + 3 + 7 + 1 + 1 + 0 = 51.** ✅ `reported`

### 2.1 ASCII tree

```text
kai/  (one marketplace, named `kai`; syntax <plugin>@kai — non-negotiable #2)
│
├── kai-core ──────────────────── 2 agents · 24 skills   OPTIONAL
│   ├── agents/  workflow-workspace-init, workflow-self-check
│   ├── skills/  24 × kai-core-*      (Contract 4 · Claim 14 · Capability 5 · probe 1)
│   ├── hooks.json                    (SOLE OWNER — pack-plan.mjs:57)
│   ├── scripts/ observe-subagent.mjs, generate-audio.ps1, workspace-doctor.mjs, …
│   └── runtime: lectoria
│
├── kai-directors ─────────────── 2 agents ·  0 skills ·  0 assets
│   └── agents/  director-chief-of-staff, director-executive-assistant
│                                     ▲ STANDALONE EXCEPTION (§7)
│
├── kai-project-management ─────── 3 agents ·  0 skills   CORE-DEPENDENT (§7.5)
│   └── agents/  workflow-initiative-init, workflow-weekly-pulse,
│                workflow-proactive-scan
│
├── kai-engineering ───────────── 20 agents · 15 skills
├── kai-product ────────────────── 9 agents ·  3 skills
├── kai-gtm ───────────────────── 12 agents ·  7 skills   runtime: lectoria
├── kai-learning ───────────────── 4 agents ·  1 skill
├── kai-assistant ──────────────── 2 agents ·  1 skill
└── kai-wellness ───────────────── 2 agents ·  0 skills   standalone = COMPLETE

                                   56 agents · 51 skills · 9 plugins
```

## §3. Non-negotiable #3 — the one-sentence job test, applied to all nine

The override made `kai-directors` an **exception to department standalone
semantics**. It did **not** waive non-negotiable #3, which was round 2's decisive
ground (C2). So #3 must be *satisfied*, not bent. It is.

| plugin | one-sentence job | #3 |
|---|---|---|
| kai-core | *the machinery a durable kai workspace runs on.* | n/a — #3 governs successor **areas**; core is the substrate. Stated anyway, and it passes. |
| **kai-directors** | ***the front door: it decides who should handle what.*** | **PASS** — one job, no "and", no catch-all. |
| **kai-project-management** | ***makes the portfolio's state visible on a cadence.*** | **PASS** — one job; start / track / surface are three facets of visibility, not three jobs. |
| kai-engineering | *takes a software change from idea to production.* | PASS |
| kai-product | *decides what is worth building.* | PASS |
| kai-gtm | *takes the product to market.* | PASS |
| kai-learning | *turns material into a lesson someone can learn from.* | PASS |
| **kai-assistant** | *the roles whose subject is **you**, not the product.* | **PASS, but thinnest.** `persona-self` (your voice) and `principal-engineer-career-mentor` (your trajectory) unify only under "about the operator personally." **Trigger (L5):** a third agent joining that is not about the operator personally makes this a catch-all and reopens #3. |
| kai-wellness | *advises on your physical health.* | PASS |

**3.2 — why `kai-directors` passes #3 now and failed it in round 2.** Round 2
tested it as a *department* and found no departmental job. The override reframes
it as a **layer over** departments, and "the front door: it decides who should
handle what" is a complete job statement for a layer. The test did not change; the
thing being tested did.

**3.3 — round 2's measure #1 was applied inconsistently, and this supports the
override on round 2's own terms.** Measure #1 ("installed alone: bodies **and**
contracts") was the first ground for declining `kai-directors` at *2 bodies, 0
contracts*. But round 2's **own accepted seven-plugin map ships `kai-wellness` at
2 · 0** — two bodies, zero contracts, unchallenged in both rounds. Zero-local-skill
plugins are therefore a **class already accepted**, not a novelty introduced by
the override. Measure #1 is retired here and replaced by the sharper, derivable
test in §7.5.

## §4. The complete move table, rounds 1 → 3

`1.0.4` = the shipped five-pack partition (`pack-plan.mjs:63-98`). Only agents
whose home changes in *any* round appear. All other 42 agents (engineering 20,
product 9, gtm 11, core 2) are **untouched in all three rounds**.

### 4.1 Agents

| agent | 1.0.4 | round 1 | round 2 | **round 3 (this)** | net move from 1.0.4 |
|---|---|---|---|---|---|
| `director-chief-of-staff` | core | core | core | **directors** | **MOVES** |
| `director-executive-assistant` | core | assistant | core | **directors** | **MOVES** |
| `workflow-initiative-init` | core | core | core | **project-management** | **MOVES** |
| `workflow-weekly-pulse` | core | core | core | **project-management** | **MOVES** |
| `workflow-proactive-scan` | core | core | core | **project-management** | **MOVES** |
| `workflow-workspace-init` | core | core | core | core | stays |
| `workflow-self-check` | core | core | core | core | stays |
| `creative-video-director` | personal | gtm | gtm | **gtm** | **MOVES** |
| `instructor-tutor` | personal | learning | learning | **learning** | **MOVES** |
| `instructor-teacher` | personal | learning | learning | **learning** | **MOVES** |
| `instructor-path-mentor` | personal | learning | learning | **learning** | **MOVES** |
| `workflow-course-to-audio` | personal | learning | learning | **learning** | **MOVES** |
| `persona-self` | personal | assistant | assistant | **assistant** | **MOVES** |
| `principal-engineer-career-mentor` | personal | assistant | assistant | **assistant** | **MOVES** |
| `persona-professional-nutritionist` | personal | wellness | wellness | **wellness** | **MOVES** |
| `persona-professional-trainer` | personal | wellness | wellness | **wellness** | **MOVES** |

**16 agents move from `1.0.4`; 40 do not.** Round 3's delta *against round 2* is
exactly **5 agents** (both directors out of core; three coordination workflows out
of core). ✅ `reported`

### 4.2 Skill providers

**With the D3 prefix fix in place, core's provider set is identical to `1.0.4`'s
— all 24 `kai-core-*`, unchanged.** This is the single most important reassurance
in the record: nine plugins does **not** redistribute the core namespace.

Only the **seven** skills provided by the dissolved `personal` pack move:

| skill | 1.0.4 | round 3 | placed by |
|---|---|---|---|
| `video-direction` | personal | **gtm** | inheritance (`creative-video-director`) |
| `create-product-demo` | personal | **gtm** | `SKILL_OWNER_OVERRIDES` — **retarget required** |
| `demo-capture` | personal | **gtm** | `SKILL_OWNER_OVERRIDES` — **retarget required** |
| `demo-narrate` | personal | **gtm** | `SKILL_OWNER_OVERRIDES` — **retarget required** |
| `demo-zoom` | personal | **gtm** | `SKILL_OWNER_OVERRIDES` — **retarget required** |
| `generate-html-lesson` | personal | **learning** | inheritance (`instructor-teacher`, `-tutor`) |
| `extract-writing-style` | personal | **assistant** | inheritance (`persona-self`) |

`kai-engineering` (15) and `kai-product` (3) are byte-identical to `1.0.4`.
`kai-gtm` goes 2 → 7. ✅ `reported`

## §5. RESOLUTION ONE — the `kai-core-*` namespace seam

### 5.1 The complete fracture set — six, derived from all 56 inherits lines

| # | skill | consumers (agent → round-3 pack) | topology provider | prefix says | without fix |
|---|---|---|---|---|---|
| 1 | `kai-core-decision-brief` | DEA → directors | `directors` | core | 🔴 |
| 2 | `kai-core-executive-consultation` | DEA → directors | `directors` | core | 🔴 |
| 3 | **`kai-core-initiative-stewardship`** | DCoS → directors | `directors` | core | 🔴 **NEW** |
| 4 | **`kai-core-proactive-scan`** | `workflow-proactive-scan` → project-mgmt | `project-management` | core | 🔴 **NEW** |
| 5 | **`kai-core-pulse-digest`** | `workflow-weekly-pulse` → project-mgmt | `project-management` | core | 🔴 **NEW** |
| 6 | **`kai-core-content-grounding`** | `creative-video-director` + `principal-demand-generation` + `principal-linkedin-strategist` → **all three now gtm** | `gtm` | core | 🔴 **NEW** |

**Three of the six are also `CLAIM_SKILLS` members** (`-initiative-stewardship`,
`-proactive-scan`, `-pulse-digest`, plus `-decision-brief` and
`-executive-consultation` — five of six), so each one would *simultaneously*
break `namespaceErrors()` **and** the claim-surface pin's "provided by core and by
no area" assertion. Two failures, one cause.

**Case 6 is the one nobody was looking for.** It is not caused by the two new
plugins at all — it is caused by `creative-video-director` moving `personal` → `gtm`,
a decision **round 1 and round 2 both already made**. Today its three consumers
straddle two packs so topology sends it to core; round 3 puts all three in `gtm`
and topology sends it to `gtm`. It would have gone red in the seven-plugin map too.

### 5.2 Not a fracture, contrary to the dispatch

`kai-core-personal-agenda` — consumers `director-executive-assistant`
(**directors**) and `workflow-proactive-scan` (**project-management**). Two
distinct packs ⇒ `packs.size > 1` ⇒ `core` by topology
(`pack-plan.mjs:407`). **Green with or without the fix.** Recorded so nobody
re-derives it.

### 5.3 The other direction — does any non-prefixed skill get promoted into core?

`namespaceErrors()` also forbids core providing a bare name. A non-prefixed skill
lands in core only if its consumers span >1 pack. Checked all 27 non-prefixed
skills against the round-3 membership:

| skill | round-3 consumer packs | result |
|---|---|---|
| `build-diagrams` | engineering only (architect, backend, frontend, infra, **issue-analysis, pull-request**) | local ✅ |
| `review-rollout-operability` | engineering only (`principal-sre`, **`workflow-ship`**) | local ✅ |
| `research-before-coding`, `pr-sizing`, `coding-style` | engineering only | local ✅ |
| `review-security-privacy` | engineering only | local ✅ |
| `doc-review-rigor`, `review-alternatives`, `review-rationale`, `review-risks-scope`, `review-ux-accessibility` | engineering only | local ✅ |
| `ui-mockup`, `html-block-diagrams`, `product-exploration` | product only | local ✅ |
| `video-direction`, `linkedin-content`, `product-marketing-intelligence` | gtm only | local ✅ |
| `generate-html-lesson` | learning only | local ✅ |
| `extract-writing-style` | assistant only | local ✅ |
| 10 orphans | no consumers → overrides | local/core ✅ |

**Zero non-prefixed skills reach core.** ✅ `reported`

**And this is entirely because the weld was respected.** Had
`workflow-ship`, `-pull-request` or `-issue-analysis` been forced into
`kai-project-management`, `review-rollout-operability` and `build-diagrams` would
each have straddled two packs, been promoted to `core`, and gone red with **no
escape** — `namespaceErrors()` direction 1 has no carve-out. The main agent's
decision to leave the release workflows in `kai-engineering` is **the load-bearing
reason this map compiles.** It is not deference to round 2; it is the gate.

### 5.4 Verdict on the D3 fix: **it suffices, unchanged**

`area-plugins-m2-planpacks-prefix` specifies exactly one condition, placed
**after** the orphan branch:

```js
if (!packs) { orphans.push(s); continue; }                     // unchanged
if (s.startsWith(CORE_SKILL_PREFIX) || packs.size > 1 || packs.has('core'))
  inheritedCore.push(s);
else inheritedLocal[[...packs][0]].push(s);
```

- All six fractures close, because the **name** now decides. ✅
- The placement constraint still holds under nine packs: `kai-core-contract-v1`
  and `kai-core-fleet-observation` remain orphans (no `**Inherits:**` consumer),
  so their `SKILL_OWNER_OVERRIDES` entries stay the only thing placing them and
  `partitionErrors()` does not fire on them. ✅
- `namespaceErrors()` stays unchanged and keeps running both directions — the
  planner satisfying the rule by construction does not retire the checker. ✅

**Does not need extending. Does not need replacing.** Its own item already carries
the milestone-4 `requires: shipped` edge (A3/S1). That edge is **hardened** by this
record: it is now carrying **six** fracture cases, not two, and one of them
(`kai-core-content-grounding`) is independent of both new plugins.

**Two adjacent facts the prefix fix does *not* cover.** They are constant-table
edits in the same file, and they are **milestone-4 P0**, not planner changes:

1. **`SKILL_OWNER_OVERRIDES` retarget.** Four entries point at `'personal'`, a
   key that ceases to exist. `planPacks()` finds `local['personal']` undefined,
   pushes them to `unplaced`, and `partitionErrors()` fires. Retarget
   `create-product-demo`, `demo-capture`, `demo-narrate`, `demo-zoom` → `'gtm'`.
2. **`PACK_RUNTIME_DEPENDENCIES` must gain a key per pack.**
   `runtimeDependencyMatrix()` **throws** — not warns — on a missing plan
   (`pack-plan.mjs:161`). See §8.

## §6. RESOLUTION TWO — the claim-surface collision

### 6.1 The collision, stated precisely

`area-plugins-m2-claim-surface-pin` asserts every one of the 14 `CLAIM_SKILLS`
is **provided by `core` and by no area**, so a core-less session lacks the lease
grammar to misuse. `director-chief-of-staff`'s job *is* claiming leases and
writing handoffs. Round 2 framed the dilemma as: *either `kai-directors` carries
coordination skills (the pin breaks) or it cannot route without core.*

### 6.2 The dilemma is false, because it conflates **provider** with **consumer**

`CLAIM_SKILLS` constrains **who ships** a skill. It says nothing about **who
inherits** it. Under the map above:

| fact | value | consequence |
|---|---|---|
| `CLAIM_SKILLS` members provided by `core` | **14 of 14** | pin holds ✅ |
| `CLAIM_SKILLS` members provided by any area | **0** | pin holds ✅ |
| `CLAIM_SKILLS` members provided by `kai-directors` | **0** | pin holds ✅ |
| skills of any kind provided by `kai-directors` | **0** | see below |
| assets (`scripts/**`) owned by `kai-directors` | **0** (`grep` of both bodies: no `scripts/*.mjs\|js\|cjs\|ps1\|sh\|py` reference) | see below |
| `CLAIM_SKILLS` members **inherited** by DCoS | 7 of its 9 (`-work-coordination`, `-work-activity`, `-peer-communication`, `-definition-of-done`, `-issue-analysis`, `-pr-delivery`, `-initiative-stewardship`) | full mode ✅ |
| `CLAIM_SKILLS` members **inherited** by DEA | 3 of its 6 (`-peer-communication`, `-decision-brief`, `-executive-consultation`) + `-personal-agenda` = 4 | full mode ✅ |

**`kai-directors` is two agent bodies and nothing else.** Installed with core, the
routers load the claim grammar from core and orchestrate durably. Installed
alone, those files are **not on disk** — no lease grammar, no handoff packet
format, no item/thread contract, no `shipped` gate, no `.kai/manifest.json`
minting procedure, and `workflow-workspace-init` (the only agent that runs
onboarding) is a core agent that is not installed either.

That is **exactly** the guarantee the accepted optional-core architecture already
rests on: *structural withholding of the Claim procedures at the partition level*,
not prompt refusal. `kai-directors` is not a weaker case than a department — it is
the **strongest**, because it ships zero contracts of its own.

### 6.3 **`CLAIM_SKILLS` does not change.** Membership stays at 14.

The dispatch asked me to say so if the honest answer were otherwise. It is not.
No member is added, removed, or re-homed. The pin's two assertions are green **by
construction** under the D3 fix. This closes the steward's binding question 2
(`scope-brief` A12/§2) and therefore **critical operator decision boundary #1
does not trip** — see §11.

### 6.4 What *does* need to change: the standalone **disclosure**, not the pin

The mechanism holds. The **honesty** does not, yet. `standaloneBlockErrors()` (in
`area-plugins-m2-claim-surface-pin`, landing **unused**) governs one block whose
content is a capability *disclaimer*: "you cannot coordinate; install core." For
`kai-directors` that block is **false in the permissive direction** — it would
disclaim the very read-only routing the exception preserves — and if the exception
lives only in hand-written director bodies, it is **unenforced prose**.

**Recommendation — the smallest enforceable shape:** one additional block file and
one additional linter arm, keyed to one pack. Not a new gate, not a new constant
family.

- `scripts/lib/standalone-router-block.txt` — byte-pinned, injected **only** into
  `kai-directors` agents, **instead of** (never in addition to) the generic
  standalone block.
- `standaloneRouterBlockErrors()` — modelled on `degradedBlockErrors()` /
  `standaloneBlockErrors()`, asserting the clause set in §7.
- `guaranteeBlockErrors()` already does per-pack block-copy arithmetic
  (`pack-plan.mjs:1643+`: core agents carry **zero** copies, department agents
  carry exactly one). It gains a `directors` arm: exactly one **router** block,
  zero generic blocks.

**Sequencing consequence — this is the finding with the shortest fuse.**
`area-plugins-m2-standalone-floor` and `area-plugins-m2-claim-surface-pin` are
**milestone 2**, ahead of milestone 4. If they harden `standaloneBlockErrors()`
around "one block, all non-core agents," milestone 4 must then *reopen* a shipped
gate to add a variant. **Routed as a PROPOSAL (§12, P-A): write
`standaloneBlockErrors()` parameterised over a block *variant* from the start.**
Cheap now; a shipped-gate reopening later. I am not minting that item.

## §7. The `kai-directors` standalone exception — as an enforceable contract

Stated as clauses a gate can decide, not as prose. Each names its enforcement
point.

| id | clause | enforced by |
|---|---|---|
| **D-1** | `PACKS.directors` contains **exactly two** agents and every id is in the `director-*` family. | `partitionErrors()` extension; `AGENT_FAMILIES` already knows the family (`pack-plan.mjs:856`) |
| **D-2** | `planPacks().local.directors` is **empty**. `kai-directors` provides **zero** skills. *This is the clause that makes "cannot claim" structural rather than aspirational.* | `--gate partition` |
| **D-3** | **Zero** `CLAIM_SKILLS` members are provided by `directors`; all 14 are provided by `core`. | the existing claim-surface-pin arm — **no exception is added for directors** |
| **D-4** | `planAssets()` assigns **no** asset to `directors`; the generated `kai-directors` tree contains no `scripts/**`. `reported`: both director bodies grep clean for asset references. | `assetOwnershipErrors()` + a generated-tree assertion |
| **D-5** | Each `kai-directors` agent body carries **exactly one** `standalone-router-block.txt` and **zero** copies of the generic standalone block. Never both. Never neither. | `guaranteeBlockErrors()` `directors` arm |
| **D-6** | The router block **permits exactly three things**: read-only discovery; naming a role / recommending a route; **one** offer to install `kai-core`. And **prohibits, one clause each**: claiming or renewing a lease; creating or editing anything under `kai/coordination/**`; minting a work item, thread, or initiative; emitting a `HANDOFF` / `DECISION` / `REVIEW` / `QUESTION` packet; asserting `shipped` or `completed`. Carries **no** `KAI-CORE-MISSING` token, states **no** `contract:` version, restates **no** `coreContractLines()`, is size-budgeted, and carries the `once` + do-not-repeat + no-retroactive-promotion instructions the accepted architecture already pins. | `standaloneRouterBlockErrors()`, every clause owing a mutation case |
| **D-7** | **Both** directors are in `DISPATCHING_ROLES` (today only `director-chief-of-staff` is, `pack-plan.mjs:1620`), so `availabilityErrors()` holds both to *"read the roster; test membership; never compute or compare counts."* | `availabilityErrors()` |
| **D-8** | `kai-directors` declares **no** dependency on any department. Routing to an uninstalled department is a **sanctioned degradation**, not a defect. | **already true** — `referenceErrors()` skips `kind: 'agent'` refs (`pack-plan.mjs:1057-1060`). **No change needed.** |

**D-7 is not cosmetic and is the one new obligation the exception creates.** In
router-standalone mode the DEA's *only* remaining job is routing over a roster it
must **read, not recall** — which is precisely what `AVAILABILITY_RULES` exists to
guarantee, and it is currently asserted for one of the two routers.

### 7.1 Steward binding question 1 — is the router's standalone path *useful* or merely *honest*?

**Useful, and it is the only plugin in the map for which that is true of a
reduced mode.** Discovery and routing need a roster and a body; both are present
core-less. The plugin's one-sentence job — *"the front door: it decides who should
handle what"* — is **fully true standalone**. What it loses is *durable
orchestration*, which the job sentence never claimed. That is a genuinely
different situation from §7.5.

### 7.5 The zero-local-skill class, and the honesty rule that separates it

Three plugins provide zero skills: `kai-directors`, `kai-project-management`,
`kai-wellness`. They are **not** the same case, and hand-maintaining the
difference is exactly the thing that drifts. It is derivable:

```
coreDependent(pack) = planPacks().local[pack].length === 0
                   && agents(pack).some(a => inherits(a).some(s => CLAIM_SKILLS.has(s)))
```

| plugin | local skills | inherits any CLAIM_SKILL? | `coreDependent` | standalone reality |
|---|---|---|---|---|
| `kai-directors` | 0 | **yes** (7 + 4) | **true** | **reduced but useful** — routing survives |
| `kai-project-management` | 0 | **yes** (all three agents) | **true** | **inert.** `workflow-weekly-pulse` without `kai-core-pulse-digest` cannot produce a pulse; `workflow-proactive-scan` without `-proactive-scan` and `-personal-agenda` cannot scan; `workflow-initiative-init` without `-work-coordination` cannot mint an initiative. |
| `kai-wellness` | 0 | **no** (only `-team-operating-rules`, `-web-evaluation`, `-no-self-remediation`) | **false** | **complete.** These personas never claim anything. |

The derivation separates the three correctly with no judgment list.

**`kai-project-management` is core-dependent by construction, and its install
surface must say so.** Non-negotiable #4 ("no area agent may require core **in
order to load**") is satisfied in the letter — the bodies load. The spirit needs
the sentence. **Recommendation — reuse a rewrite that is already committed scope:**
`packDescription()` (`pack-plan.mjs:175-182`) currently emits *"kai `<pack>`
**department** pack — the `<pack>` roles, over a **required** kai-core"*, and the
scope brief already records that **both halves become false** and that rewriting it
is **required input to milestone 4**. Fold the core-dependence clause into that
rewrite, **derived** from the predicate above. Zero new gates, zero new constants,
and the honesty is computed rather than remembered.

This is the answer to steward binding question 1 for the second plugin: **merely
honest, not useful** — and the one-sentence job must carry it, exactly as the
steward required.

## §8. `hooks.json` and the `lectoria` runtime declarations across nine plugins

### 8.1 `hooks.json` — **stays `core`. Zero diff. Endorse.**

`HOOKS_OWNER = 'core'` (`pack-plan.mjs:57`) is unchanged, and the chain that
makes it legal survives the split intact:

- `hooks.json` runs `${PLUGIN_ROOT}/scripts/observe-subagent.mjs` (×2).
- `hooksAssignmentErrors()` requires the hook's assets to be owned by the hook's
  **own** pack (`${PLUGIN_ROOT}` resolves inside it).
- `scripts/observe-subagent.mjs` is referenced from
  `skills/kai-core-fleet-observation/SKILL.md:61,109`, and that skill is placed in
  `core` by `SKILL_OWNER_OVERRIDES`. Owner = `core`. ✅ consistent.

**The optional-core objection, answered.** The original justification was *"core
is the one plugin every department already requires."* That is no longer true.
The replacement justification is stronger: **`kai-core-fleet-observation` is a
`CLAIM_SKILLS` member.** Fleet observation is Claim-family by design, so *no core
⇒ no observer* is the **correct** semantics, not a gap. Any other owner would put
the observer in a plugin that can be installed without the contract that makes
its output meaningful.

**Required test-fixture updates** (`reported`, from reading `pack-preview.mjs`):
the mutation case at `:1032-1045` asserts the message *"runs
`scripts/observe-subagent.mjs`, owned by **kai-personal**"* — a pack this map
dissolves. Re-point to a surviving pack (`kai-gtm`). Milestone-4 test work, not a
design change.

### 8.2 `lectoria` — two declaring packs, and nine keys are mandatory

`PACK_RUNTIME_DEPENDENCIES` must have an entry for **every** pack:
`runtimeDependencyMatrix()` throws `no runtime dependency plan exists for pack
"<x>"` on a missing key (`pack-plan.mjs:161`). Nine packs, nine keys.

Assignment, by the ratified rule *the dependency belongs to the pack that
directly executes it*:

| pack | dependencies | why |
|---|---|---|
| `core` | `['lectoria']` | `skills/kai-core-generate-audio/SKILL.md` invokes `scripts/generate-audio.ps1`; that skill is core-provided (consumers span `learning` + `project-management`, and the prefix rule confirms it), so the asset ships in core |
| `gtm` | `['lectoria']` | `skills/demo-narrate/SKILL.md` invokes `scripts/demo-narrate.mjs`; `demo-narrate` moves `personal` → `gtm` with `creative-video-director` |
| `directors`, `project-management`, `engineering`, `product`, `learning`, `assistant`, `wellness` | `[]` | declare nothing; their CI legs assert nothing |

**Two CI legs carry the `lectoria` binary** (was two: `core` + `personal`). Leg
**count** goes 5 → 9. `RUNTIME_ARTIFACTS` is unchanged — same version, same spec
URL, same `sha512`, same `lockKey`, same `binary`.

**Required test-fixture update:** `pack-preview.mjs:546-558` asserts *"runtime
manifests project lectoria only into **core and personal**, leaving other
departments empty."* Becomes **core and gtm**. `reported`.

**Recorded consequence — `kai-learning` loses audio standalone.** The three
instructors and `workflow-course-to-audio` all inherit `kai-core-generate-audio`,
which is **Capability**-family, provided by core. Installed without core,
`kai-learning` keeps `generate-html-lesson` and loses narration entirely —
`workflow-course-to-audio` is named for a capability it cannot reach. This is the
already-disclosed Capability-family loss, not a new defect, and it is **not**
`coreDependent` under §7.5 (no CLAIM_SKILL inherited). **Deferred with a trigger
(L3).**

## §9. `kai-core` at two agents — plugin, or contract library?

**Plainly: it is a contract-and-machinery library that must ship as a plugin
because the host has no smaller unit.** Both statements are true and neither is a
hedge.

**Agent count is the wrong measure of a plugin's coherence; provider count is.**
By provider count, `kai-core` is by a wide margin the largest thing in the fleet:

| what core provides | count | share |
|---|---|---|
| skills | **24** | 47% of all 51 |
| `CLAIM_SKILLS` | **14** | 100% |
| `hooks.json` | 1 | 100% |
| the version probe `kai-core-contract-v1` | 1 | 100% |
| `lectoria` | 1 of 2 declaring packs | — |
| agents | 2 | 3.6% |

**Its two agents are not a rump department — they are the machinery's
operators**, and each is load-bearing:

- `workflow-workspace-init` is the **only** agent that runs
  `kai-core-workspace-onboarding` and mints `.kai/manifest.json`. The
  claim-surface pin *already* asserts these two must be **co-located in `core`**.
  Remove it and installing core no longer creates a workspace — core would
  provide contracts nothing could instantiate.
- `workflow-self-check` verifies the structural honesty of what the machinery
  produced. It is the machinery's own audit.

**Ruling: `kai-core` remains a coherent plugin. It needs no replacement agent.**
Its job sentence changes from an implied department (*"the org spine"*) to
what it now is: *"the machinery a durable kai workspace runs on."* That is a copy
change in `packDescription()` — a rewrite already required by milestone 4 — not a
structural one.

**This is a direct answer to critical operator decision boundary #6**
(*"If `director-executive-assistant` leaving `core` means core needs a replacement
agent to remain sensible, that is added scope"*). **It does not trip.** Both
directors leave; core needs no replacement. See §11.

## §10. Router names

**Ruling on timing is unchanged and was not part of the override.** Round 2's R5
ruled the renames **cannot ship inside `area-plugins` at all** (F9 / A1(ii)–(iii)):
they would touch 57 occurrences across 21 root source files with no deriving
check, and moving **plugin identity and agent identity in the same window** gives
a red gate two candidate causes. The main agent overrode the two *product*
questions, not that sequencing ruling. **Therefore `kai-directors` ships with the
shipped ids `director-chief-of-staff` and `director-executive-assistant`.** The
plugin boundary and the agent names are independent, and separating them is the
smallest change.

**Applying round 2's own test (C4) to the requested pair:**

| name | ruling |
|---|---|
| `director-delivery` | **UPHELD.** Names the job — *drive an outcome to done through the departments* — separates on the noun with no disambiguator, and matches the body's own framing. Round 2 accepted it; nothing here weakens it. |
| **`director-personal`** | **FAILS. Recommend against.** |

**Why `director-personal` fails — three grounds, one of them new:**

1. **It re-imports dissolved vocabulary.** Non-negotiable #3 dissolves
   `kai-personal` *"not renamed."* `director-personal` reinstates the exact word
   the principle retired. Round 2 rejected this name on this ground already,
   before it was proposed here.
2. **It fails C4's positive clause.** C4 requires the successor name to read as a
   **front door for the operator**, covering *"who should handle this?"* as well
   as *"what needs me?"*. The agent's shipped `description:` is *"personal agenda,
   catch-up, task capture, **unclear routing**, and decisions waiting on them."*
   `personal` carries the agenda half and erases the routing half — the same
   failure that sank `director-agenda`, differently spelled. It names the
   **audience** instead of the **artifact**; both miss the **job**.
3. **NEW, and decisive under the override.** The accepted exception makes
   **read-only discovery and routing** the *only* thing this agent can do
   core-less. `director-personal` **actively misdescribes** its standalone
   capability: core-less it routes you to *anything* — engineering, product,
   gtm — not to anything "personal." The name would be least true in exactly the
   mode the exception exists to preserve. **The override raises the bar on this
   name rather than lowering it.**

**I am not minting a replacement.** Round 2's reason still holds and is
strengthened: the rename cannot ship in this initiative either way, and the
successor initiative should choose against evidence. Constraint **C4 stands**,
plus one addition:

> **C4′** — the successor name must remain true in **router-standalone mode**,
> where the agent's entire capability is discovery and routing. A name that
> describes only what the agent does *with* core fails.

`director-delivery` satisfies C4′ as written. Recorded as **later refinement L1**,
routed to the post-`migration-complete` initiative (round 2's P3).

## §11. P0 versus later refinement

**P0 — published identity or gate legality. Must be settled before any
milestone-4 item is minted.**

| # | decision | why P0 |
|---|---|---|
| **N1** | **Nine plugin identities**, named as in §1 | drives `PACK_ORDER`, `COMMITTED_PACKS`, 9 CI matrix legs, `marketplace.json`, the **derived** `legacy-rollback` forbidden set (non-negotiable #9), and the **order-checked** guided-installer command list asserted at `validate-plugin.mjs:855-869` — which means `skills/kai-core-workspace-onboarding/SKILL.md` must gain **four** new exact `copilot plugin install kai-<x>@kai` commands **in `PACK_ORDER` sequence** |
| **N2** | **`PACKS` membership** for all 56 (§1) | the partition itself |
| **N3** | **`SKILL_OWNER_OVERRIDES` retarget**: 4 demo skills `personal` → `gtm` | `'personal'` ceases to exist; without it `partitionErrors()` fires on `unplaced` |
| **N4** | **D3 prefix fix is a hard prerequisite**, `requires: shipped` (A3/S1) | six fracture cases, not two; milestone 4 is red on arrival without it |
| **N5** | **`PACK_RUNTIME_DEPENDENCIES`**: 9 keys; `lectoria` on `core` + `gtm` | `runtimeDependencyMatrix()` **throws** on a missing key |
| **N6** | **`hooks.json` owner stays `core`** | recorded decision, **zero diff** — but it must be *decided*, since its original justification ("every department requires core") is now false |
| **N7** | **The `kai-directors` exception mechanism** (D-1…D-8): router block file, `standaloneRouterBlockErrors()`, `guaranteeBlockErrors()` directors arm, `DISPATCHING_ROLES` +1 | the only **new mechanism** in the taxonomy; and its shape must be known to **milestone 2** (§12 P-A), not discovered at milestone 4 |
| **N8** | **`CLAIM_SKILLS` unchanged at 14**, all core-provided | closes steward question 2 and operator boundary #1 |
| **N9** | **`creative-video-director` → `kai-gtm`** (carried from rounds 1–2) | published identity; drags 5 skills, 5 JS assets, `lectoria`, and a CI binary leg — **and** case 6 of §5.1 |

**LATER REFINEMENT — each with a trigger.**

| # | decision | trigger |
|---|---|---|
| **L1** | Role renames: `director-delivery` + a C4/C4′-passing successor | cannot ship in `area-plugins` (F9/A1). Separate initiative after `migration-complete`; start when the plugin-identity rename is done and stable |
| **L2** | `generate-catalog.mjs` `CATEGORIES` realignment — the `Direction` blurb, and the `Personal` heading which now spans **two** plugins (`persona-self` + `career-mentor` → assistant; `weekly-pulse` + `proactive-scan` → project-management) | not an `area-plugins` target; one array literal + `npm run docs:generate`, byte-checked and reversible. Copy is product's (A4). Do it at milestone 3/5 |
| **L3** | Relocate `kai-core-generate-audio` → `kai-learning` (requires dropping the `kai-core-` prefix **and** re-homing or duplicating for `workflow-weekly-pulse`) | measured evidence that `kai-learning` standalone is not useful without narration |
| **L4** | **Whether a new `principal-project-manager` / program-manager agent is needed** — **named, not invented** | `kai-project-management` acquires a decision no `workflow-*` agent owns, **or** round 2's R4 fires (the PM's steward hat splits from the scope hat). Adding an agent is **out of `area-plugins` scope**; it is a `PROPOSAL` to `principal-product-manager`, not an architecture call |
| **L5** | `kai-assistant`'s #3 framing | a third agent joins it that is not about the operator personally |
| **L6** | `review-success-metrics` home (engineering vs product) | no force today; a product agent inherits it |
| **L7** | `principal-brand-designer` / `principal-data-analytics` homes (round 2 R3b) | a steward amendment reopens `kai-product`/`kai-gtm` membership, or one acquires a non-core skill shared with the other |

## §12. What must be `observed` green before milestone 4 merges

Everything in this record is **`reported`**. Before any milestone-4 PR merges,
these must be **`observed`**:

1. `node scripts/pack-preview.mjs --gate partition` — **green**, over the
   nine-pack tree. In particular: zero `namespaceErrors()` in **either**
   direction, and zero `partitionErrors()` on `SKILL_OWNER_OVERRIDES`.
2. `--gate collision`, `--gate partial-install`, `--gate version-skew` — green
   (including the `partial-core` arm, if it stayed in `claim-surface-pin`).
3. `node scripts/pack-preview.mjs --check` — byte parity over the regenerated
   committed `packs/` slice. **This one is *not* byte-neutral**: nine trees
   replace five, so `--check` is green against the *newly committed* slice, and
   the diff must be reviewed as an intended identity change, not asserted as
   parity with `1.0.4`.
4. `planPacks()` returns `local.directors === []`, `local['project-management']
   === []`, `local.wellness === []`, and `unplaced === []`.
5. All **24** `kai-core-*` skills appear in `planPacks().core`; **zero**
   non-prefixed skills appear there (§5.3).
6. All **14** `CLAIM_SKILLS` members provided by `core`, by **no** area
   (`claim-surface-pin` arm), and `workflow-workspace-init` +
   `kai-core-workspace-onboarding` still **co-located in `core`**.
7. `runtimeDependencyMatrix()` yields **nine** legs; exactly **two** carry the
   `lectoria` binary (`core`, `gtm`).
8. `hooksAssignmentErrors()` — exactly one owner (`core`), asset co-located.
9. The guided-installer assertion passes with **nine** ordered commands
   (`validate-plugin.mjs:855-869`).
10. `npm test` green — including `docs:check` total coverage over `CATEGORIES`
    (`generate-catalog.mjs:241-260`).
11. `release-guard` passes with a forward version bump.
12. The two `kai-personal`-naming self-test fixtures updated and green
    (`pack-preview.mjs:546-558` and `:1032-1045`).
13. Every new D-1…D-8 assertion carries a **mutation case** in the
    `pack-preview` self-test. *A rule with no mutation proving it is not landed.*

## §13. Supersession

**Neither prior round is rewritten.** Both stay readable as authored.

**`area-plugins-taxonomy-decision` (round 1, `DECISION 2026-08-27-1850`)** —
stays `completed` as history, its `SUPERSEDED-PENDING` status (A13) now
**resolved to SUPERSEDED**. What survives it: the `planPacks()`/`namespaceErrors()`
seam defect (**D3** — vindicated and enlarged from 3 cases to 6), the `lectoria`
provider-root binding, and the `hooks.json` owner analysis. What is superseded:
its plugin count (7), its placement of `director-executive-assistant` in
`kai-assistant`, and its core membership (6).

**`area-plugins-taxonomy-round-2` (`DECISION 2026-08-27-2130`)** — **SUPERSEDED
in its product conclusions, upheld in its mechanics.**

| round 2 | disposition here |
|---|---|
| **R1** — DEA returns to `kai-core` | **SUPERSEDED.** DEA goes to `kai-directors`. |
| **R2** — count stays 7, no `kai-directors` | **SUPERSEDED** by the main agent. Its measure-#1 ground is additionally shown inconsistent (§3.3); its non-negotiable-#3 ground is **satisfied, not waived** (§3.2). |
| **R3** — no `kai-project-management`; ship/PR/issue-analysis stay in engineering | **SPLIT.** First clause superseded; **second clause UPHELD and load-bearing** — it is why the map compiles (§5.3). |
| **R6** — D3 fix stays a milestone-2 deliverable gating milestone 4 | **UPHELD and strengthened** — now carrying six cases. |
| **R7** — `creative-video-director` → `kai-gtm` | **UPHELD**, and shown to create fracture case 6 independently of both new plugins. |
| **R5 / C4** — `director-delivery` accepted, `director-agenda` rejected, rename cannot ship here | **UPHELD.** Extended by C4′ and applied to `director-personal`, which **fails** (§10). |
| **C5** — reconciliation stays `reported` until observed | **UPHELD and re-issued** as §12. |
| **C1** — `validate-plugin.mjs:860` is the guided-installer assertion, not a director-id literal | **UPHELD and used correctly**: N1 costs four new ordered install commands in shipped onboarding prose. |
| the weld (F5) | **UPHELD** and re-verified independently this session. |
| the two-partition finding (`PACKS` vs `CATEGORIES`) | **UPHELD.** `CATEGORIES` realignment is L2 — cheap, reversible, product's copy. |

---

## Decision

- **Disposition: Decouple.** A real force pulls the routers and the coordination
  workflows out of core **today**: core is being made *optional*, and human-facing
  front doors that must be reachable without the machinery cannot live inside the
  machinery. The seam is introduced where that force acts, and nowhere else.
  Secondary dispositions: **Endorse** (`hooks.json` owner, `CLAIM_SKILLS` at 14,
  the D3 fix as specified, the weld, `kai-core` as a plugin);
  **Defer** (L1–L7, all with triggers).

- **Recommendation — the smallest structural change that resolves the forces:**
  1. **Nine plugins**, membership per §1/§2; 56 agents and 51 skills each placed
     exactly once.
  2. **`kai-directors`** = two agent bodies, **zero** skills, **zero** assets,
     with the standalone exception as the enforceable contract D-1…D-8.
  3. **`kai-project-management`** = the three coordination workflows; the release
     workflows **stay** in `kai-engineering`; it is **`coreDependent`** and its
     description must derive that.
  4. **`kai-core`** = 2 agents, 24 skills, `hooks.json`, the probe, `lectoria` —
     the machinery plugin. **No replacement agent.**
  5. **Namespace seam:** the already-promoted D3 prefix fix, **unchanged**, plus
     two constant-table edits (`SKILL_OWNER_OVERRIDES` retarget,
     `PACK_RUNTIME_DEPENDENCIES` nine keys).
  6. **Claim surface:** **`CLAIM_SKILLS` unchanged at 14.** The collision
     dissolves at the provider/consumer distinction.
  7. **Names:** ship the current agent ids; `director-delivery` upheld for the
     successor initiative; **`director-personal` rejected** on three grounds.

- **Domain work this implies** (handoffs — the *what*, not the *how*):
  - `principal-swe-infra` — `PACKS`, `SKILL_OWNER_OVERRIDES`,
    `PACK_RUNTIME_DEPENDENCIES`, the nine generated trees, the CI matrix,
    `marketplace.json`, the derived `legacy-rollback` set, and the two
    `kai-personal`-naming self-test fixtures. Plus the D-1…D-8 gate arms and
    `standaloneRouterBlockErrors()`.
  - `principal-product-manager` — the `standalone-router-block.txt` **copy**
    (permits/prohibits sentences), the rewritten `packDescription()` copy
    including the derived core-dependence clause, the four new ordered installer
    commands in `kai-core-workspace-onboarding/SKILL.md`, and the L2 `CATEGORIES`
    realignment. Copy is product's per A4.
  - `principal-security` — the exception is a change to the surface the
    no-false-claim guarantee rests on. `standaloneRouterBlockErrors()` and D-2/D-4
    warrant the same independent security review `pack-split-degraded-refusal`
    and `pack-split-preflight-compat` carried.
  - `principal-swe-manager` — decomposition and sequencing of the milestone-4
    items this record makes decidable, plus P-A below.

- **What stays the same — deliberately not touched:**
  `kai-engineering`'s 20 agents and 15 skills; `kai-product`'s 9 and 3; the
  `kai-gtm` core 11; `namespaceErrors()`, `referenceErrors()`,
  `partitionErrors()`, `providerCollisionErrors()` (all unchanged);
  `HOOKS_OWNER`; `RUNTIME_ARTIFACTS`; `CLAIM_SKILLS` membership; the degraded
  block's bytes; `CORE_SKILL_PREFIX`; the marketplace name; and every agent body
  and skill body in this initiative.

- **Reversibility:**
  - **Expensive / effectively one-way:** the nine plugin identities (N1) —
    published names, the derived `legacy-rollback` set, and non-negotiable #9's
    no-coexistence rule. This is where the scrutiny went.
  - **Cheap:** membership within the nine (a `PACKS` line), the override
    retargets, the runtime-dependency keys, the block copy, `CATEGORIES`.
  - **Consequence if wrong:** if `kai-project-management` proves to be an empty
    boundary in use, its three agents fold back into `kai-core` with a `PACKS`
    edit — but the **published identity** cannot be withdrawn without a rollback
    event under #9. That asymmetry is the real cost of the override, and it is
    stated here so it is chosen rather than discovered.

## Open questions / escalations

**Critical-boundary call: nothing here requires the operator.** Checked
explicitly against the scope brief's eight boundaries:

| boundary | trips? |
|---|---|
| **#1 — honesty cannot be mechanised** | **NO.** `CLAIM_SKILLS` survives intact: 14 members, all core-provided, none area-provided, green by construction (§6.3). The guarantee stays **structural**, never prompt-level. This is the boundary the steward warned would trip; it does not. |
| **#2 — coherence vs. the settled area set** | **NO.** The main agent, acting on the operator's direction, already ruled both product questions. |
| **#3 — `creative-video-director` needs a new area** | **NO.** `kai-gtm`, as rounds 1 and 2 both had it. |
| **#4 — coexistence window** | untouched — a milestone-3/4 migration question, not a taxonomy one. |
| **#5 — undetectable stranding** | untouched. |
| **#6 — core loses coherence / needs a replacement agent** | **NO.** Core is the machinery plugin and the fleet's largest provider (24/51 skills, 14/14 claim skills, `hooks.json`). Both directors leave and **no replacement agent is needed** (§9). |
| **#7 — durable state for standalone** | **NO.** Nothing here grants standalone durable state; D-6 explicitly prohibits it for routers. |
| **#8 — modifying `pack-split/**` or rewriting history** | **NO.** Nothing under `kai/initiatives/pack-split/**` is touched; rounds 1 and 2 are superseded, not rewritten. |

**Routed, not escalated** — three `PROPOSAL`s, because my `touches` set is three
files and minting items is not mine:

| # | proposal | to | why it cannot wait |
|---|---|---|---|
| **P-A** | Write `standaloneBlockErrors()` **parameterised over a block variant** in `area-plugins-m2-claim-surface-pin` / `-standalone-floor`, rather than hard-coded to one block for all non-core agents. | `principal-swe-manager` → steward | Those are **milestone 2**; the router block is **milestone 4**. Hard-coding now means reopening a shipped gate later. Cheap now, expensive later. **This is the only finding with a short fuse.** |
| **P-B** | Fold the derived **core-dependence** clause into the already-required `packDescription()` rewrite (scope brief, outstanding copy #2), using the §7.5 predicate. | `principal-product-manager` | The rewrite is already required input to milestone 4; adding the clause there costs nothing and avoids a new gate. |
| **P-C** | **L4 — whether a `principal-project-manager` agent is needed.** Named, deliberately **not** invented. Adding an agent is out of `area-plugins` scope. | `principal-product-manager` | Scope-discipline: the right-looking answer would add a **new capability** beyond committed scope. It is decided at triage, not architected in by default. |

**Scope-discipline classification** (per `kai-core-scope-discipline`, against
`scope.current` = `allowlist-repair` + `decisions-locked`):

- N1–N6, N8, N9 — **Apply.** In-scope consequences of an accepted product ruling;
  they change no committed scope, only make it legal.
- N7 (the exception mechanism) — **Apply.** It adds a **mechanism**, not a
  **capability**: it enforces a permission the main agent already granted. Adding
  it is the honest cost of the override; omitting it would leave the exception as
  unenforced prose.
- L1–L7 — **Defer**, each with a stated trigger.
- **L4 / P-C — routed, not applied.** A new agent is scope expansion and belongs
  to the steward at triage.

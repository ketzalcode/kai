# Thread — area-plugins-taxonomy-round-3

Append-only communication log mirroring
`kai/coordination/items/area-plugins-taxonomy-round-3.md`. Never edited after the
fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-2215):** no agent in this session has a shell.
**Nothing was executed.** No `npm test`, no `pack-preview --gate partition`, no
`--check`, no `node`. Every count, provider assignment, gate outcome and byte
claim below is **`reported`** — derived by reading source at `C:\src\kai` — and
**never `observed`**. The list of what must be `observed` green before milestone 4
merges is §12 of the canonical record.

**Unlike rounds 1 and 2, the canonical `artifact_target` now exists and is
writable.** The decision is written to
`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-3.md`.
This thread is the working/audit record, not a substitute for it.

---

## DECISION 2026-08-27-2215 — principal-swe-architect

**initiative:** area-plugins · **milestone:** decisions-locked
**item:** `area-plugins-taxonomy-round-3` (v1 → v2)
**lease verified before write:** `holder=principal-swe-architect`
`token=apx-tax3-20260827-2200-p1` `version_at_grant=1` `version=1` — **match, no
collision.**
**canonical artifact:**
`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-3.md`

### Decision (one line)

**Nine plugins.** `kai-directors` and `kai-project-management` accepted as ruled
by the main agent; the two mechanical consequences round 2 identified are
**resolved, not deferred** — the `kai-core-*` namespace seam is green **by
construction** under the already-promoted D3 prefix fix (**which suffices
unchanged**), and the claim-surface collision **dissolves without altering
`CLAIM_SKILLS`**, because `kai-directors` provides zero skills and zero assets.

**Disposition: Decouple** (core is being made optional; human-facing front doors
cannot live inside the machinery). Secondary: **Endorse** (`hooks.json` owner,
`CLAIM_SKILLS` at 14, the D3 fix as written, the weld, `kai-core` as a plugin);
**Defer** (L1–L7, each with a trigger).

### The override, implemented — not relitigated

Round 2 recommended against both plugins. The main agent accepted both. Recorded
faithfully in the canonical artifact's Context, including the reasoning:
`kai-directors` is an **executive routing layer, not a department** (the human is
the CEO; the two `director-*` agents are front doors *over* departments), and
that framing is **clearer than keeping human-facing routers inside an
implementation-named core**. `kai-project-management` is a **product boundary**,
and round 2's **weld finding is upheld and respected** — `workflow-ship`,
`workflow-pull-request` and `workflow-issue-analysis` **stay in
`kai-engineering`**.

### The map — 56 agents, 51 skills, each placed exactly once (`reported`)

| plugin | agents | skills |
|---|---|---|
| `kai-core` | 2 | 24 |
| `kai-directors` | 2 | 0 |
| `kai-project-management` | 3 | 0 |
| `kai-engineering` | 20 | 15 |
| `kai-product` | 9 | 3 |
| `kai-gtm` | 12 | 7 |
| `kai-learning` | 4 | 1 |
| `kai-assistant` | 2 | 1 |
| `kai-wellness` | 2 | 0 |
| **total** | **56** ✅ | **51** ✅ |

Derived from a directory read of `agents/` (56 `*.agent.md`) and a glob of
`skills/*/SKILL.md` (51), plus **all 56 `**Inherits:**` lines** read in one pass.
No remembered roster was trusted; the shipped `pack-split` lock was not used as a
provider source.

### RESOLUTION ONE — the namespace seam. Six fractures, not three.

`planPacks()` (`pack-plan.mjs:405-410`) assigns a provider by **consumer
topology**; `namespaceErrors()` (`:1527-1546`) judges it by **name**. Deriving
the provider map from every `**Inherits:**` line under the nine-plugin membership
yields **six** `kai-core-*` skills whose topology provider is a non-core pack:

| # | skill | consumers → pack | topology | without fix |
|---|---|---|---|---|
| 1 | `kai-core-decision-brief` | DEA → directors | directors | 🔴 (named in dispatch) |
| 2 | `kai-core-executive-consultation` | DEA → directors | directors | 🔴 (named in dispatch) |
| 3 | `kai-core-initiative-stewardship` | DCoS → directors | directors | 🔴 **NEW** |
| 4 | `kai-core-proactive-scan` | `workflow-proactive-scan` → project-mgmt | project-mgmt | 🔴 **NEW** |
| 5 | `kai-core-pulse-digest` | `workflow-weekly-pulse` → project-mgmt | project-mgmt | 🔴 **NEW** |
| 6 | `kai-core-content-grounding` | `creative-video-director` + `principal-demand-generation` + `principal-linkedin-strategist` → **all three gtm** | gtm | 🔴 **NEW** |

**Correction to the dispatch's premise.** `kai-core-personal-agenda` is **not** a
fracture case. It has **two** consumers landing in **different** packs — DEA
(directors) and `workflow-proactive-scan` (project-management) — so
`packs.size === 2` and topology sends it to `core`. Green with or without the fix.
Recorded so nobody re-derives it.

**Case 6 is independent of both new plugins.** It is caused by
`creative-video-director` moving `personal` → `gtm`, a decision rounds 1 **and** 2
already made. It would have gone red in the seven-plugin map too.

**Five of the six are also `CLAIM_SKILLS` members**, so each would break
`namespaceErrors()` **and** the claim-surface pin simultaneously. Two failures,
one cause.

**Verdict on the D3 fix (`area-plugins-m2-planpacks-prefix`): it SUFFICES,
UNCHANGED. Not extended. Not replaced.** One condition, placed after the orphan
branch, makes the **name** decide; all six close; the placement constraint still
holds under nine packs (`kai-core-contract-v1` and `kai-core-fleet-observation`
remain orphans, so `partitionErrors()` does not fire on their overrides);
`namespaceErrors()` stays unchanged and keeps running both directions. Its
milestone-4 `requires: shipped` edge (A3/S1) is **hardened** — it now carries six
cases, not two.

**The other direction is also green — and only because the weld was respected.**
All 27 non-prefixed skills stay single-pack, so **zero** reach `core`. Had any of
`workflow-ship` / `-pull-request` / `-issue-analysis` been forced into
`kai-project-management`, `review-rollout-operability` and `build-diagrams` would
have straddled two packs, been promoted to core, and gone red with **no escape**.
**The main agent's decision to leave the release workflows in `kai-engineering`
is the load-bearing reason this map compiles.**

**Two adjacent facts the prefix fix does NOT cover** (milestone-4 constant-table
edits, not planner changes): `SKILL_OWNER_OVERRIDES` must retarget the four demo
skills `'personal'` → `'gtm'` (the key ceases to exist ⇒ `unplaced` ⇒
`partitionErrors()`), and `PACK_RUNTIME_DEPENDENCIES` must gain a key per pack
(`runtimeDependencyMatrix()` **throws** on a missing plan, `:161`).

### RESOLUTION TWO — the claim surface. `CLAIM_SKILLS` does NOT change.

The dilemma was: either `kai-directors` carries coordination skills (the pin
breaks) or it cannot route without core. **It is false — it conflates *provider*
with *consumer*.** `CLAIM_SKILLS` constrains **who ships** a skill, not **who
inherits** it.

- All **14** `CLAIM_SKILLS` provided by `core`; **0** by any area; **0** by
  `kai-directors`. Pin green **by construction** under the D3 fix.
- `kai-directors` provides **0 skills** and **0 assets** (`reported`: both
  director bodies grep clean for any `scripts/*.{mjs,js,cjs,ps1,sh,py}`
  reference). It is **two agent bodies and nothing else**.
- With core: DCoS inherits 7 of the 14, DEA 4 — full durable orchestration.
- Without core: those files are **not on disk**. No lease grammar, no handoff
  format, no item/thread contract, no `shipped` gate, no `.kai/manifest.json`
  minting procedure — and `workflow-workspace-init` is a core agent that is not
  installed either.

That is the **same structural withholding** the accepted optional-core
architecture already rests on, and `kai-directors` is its **strongest** case, not
its weakest. **The dispatch asked me to say so if `CLAIM_SKILLS` had to change.
It does not. Membership stays at 14.**

**What does need to change is the standalone *disclosure*, not the pin.**
`standaloneBlockErrors()` governs one block whose content disclaims coordination
— **false in the permissive direction** for a router whose preserved capability
*is* routing. Recommended smallest shape: one `standalone-router-block.txt`, one
`standaloneRouterBlockErrors()`, one `guaranteeBlockErrors()` `directors` arm.

### The `kai-directors` standalone exception — enforceable clauses D-1…D-8

Stated as things a gate can decide (full text in the canonical artifact §7):

- **D-1** `PACKS.directors` = exactly two, all `director-*`.
- **D-2** `planPacks().local.directors` is **empty**. *This is the clause that
  makes "cannot claim" structural rather than aspirational.*
- **D-3** zero `CLAIM_SKILLS` provided by `directors`; **no exception added** to
  the claim-surface arm.
- **D-4** zero assets owned by `directors`; no `scripts/**` in the generated tree.
- **D-5** exactly one **router** block per directors agent, zero generic blocks.
- **D-6** the router block permits exactly three things (read-only discovery;
  naming a role / recommending a route; **one** core-install offer) and prohibits,
  one clause each: claiming/renewing a lease; writing `kai/coordination/**`;
  minting an item/thread/initiative; emitting `HANDOFF`/`DECISION`/`REVIEW`/
  `QUESTION`; asserting `shipped`/`completed`. No `KAI-CORE-MISSING` token, no
  `contract:` version, restates no `coreContractLines()`, size-budgeted.
- **D-7** **both** directors join `DISPATCHING_ROLES` (today only DCoS,
  `:1620`), so `availabilityErrors()` holds both to *read the roster, test
  membership, never count*. In router-standalone mode the DEA's only job **is**
  routing over a roster it must read, not recall.
- **D-8** no dependency on any department. **Already legal, no change** —
  `referenceErrors()` skips `kind: 'agent'` refs (`:1057-1060`), which is
  precisely what makes routing to an uninstalled department a *sanctioned
  degradation*.

### Steward binding questions — both answered

**Q1 — is a router's standalone path *useful* or merely *honest*?** Answered
per plugin, and they differ:

- **`kai-directors`: USEFUL.** Discovery and routing need a roster and a body;
  both are present core-less. Its one-sentence job — *"the front door: it decides
  who should handle what"* — is **fully true standalone**. What it loses is
  durable orchestration, which the sentence never claimed.
- **`kai-project-management`: MERELY HONEST — it is INERT standalone.**
  `workflow-weekly-pulse` without `kai-core-pulse-digest` cannot produce a pulse;
  `workflow-proactive-scan` without `-proactive-scan`/`-personal-agenda` cannot
  scan; `workflow-initiative-init` without `-work-coordination` cannot mint an
  initiative. Non-negotiable #4 is satisfied in the letter (the bodies load); the
  spirit needs the sentence, and the steward required it in the job statement.

**Q2 — where does the claim surface live once routers leave core?** All 14
`CLAIM_SKILLS` and all 24 `kai-core-*` skills in **exactly one** plugin —
`kai-core`. **The "provided by core and by no area" invariant SURVIVES.**
Therefore **critical operator decision boundary #1 does not trip** and nothing
escalates.

### The zero-local-skill class, and a derivable honesty rule

Three plugins provide zero skills — `kai-directors`, `kai-project-management`,
`kai-wellness`. They are **not the same case**, and the difference is derivable
rather than judged:

```
coreDependent(pack) = planPacks().local[pack].length === 0
                   && agents(pack).some(a => inherits(a).some(s => CLAIM_SKILLS.has(s)))
```

directors → **true** (reduced but useful) · project-management → **true**
(inert) · wellness → **false** (**complete** standalone — its personas inherit no
claim skill and never claim anything). Recommended to be folded into the
**already-required** `packDescription()` rewrite rather than a new gate.

**Round 2's measure #1 was applied inconsistently, and that supports the
override on round 2's own terms:** it rejected `kai-directors` at *2 bodies, 0
contracts*, while round 2's **own accepted map shipped `kai-wellness` at 2 · 0**.
Zero-local-skill plugins were already an accepted class.

### `hooks.json` and `lectoria`

- **`hooks.json` stays `core`. Zero diff — but it must be *decided*,** because
  its original justification ("core is the one plugin every department requires")
  is now false. **Replacement justification, stronger:**
  `kai-core-fleet-observation` is a **`CLAIM_SKILLS` member**, so *no core ⇒ no
  observer* is the **correct** semantics, not a gap. The asset chain still
  resolves: `hooks.json` → `scripts/observe-subagent.mjs` → referenced from
  `kai-core-fleet-observation/SKILL.md` → placed in `core` by override.
- **`lectoria` on two packs: `core` and `gtm`.** `core` because
  `kai-core-generate-audio` invokes `scripts/generate-audio.ps1` and that skill is
  core-provided; `gtm` because `demo-narrate` invokes `scripts/demo-narrate.mjs`
  and moves `personal` → `gtm`. The other seven packs declare `[]`. Nine keys are
  **mandatory** — `runtimeDependencyMatrix()` throws otherwise.
- **Two self-test fixtures name the dissolved `kai-personal`** and must be
  re-pointed (`pack-preview.mjs:546-558` "core and personal" → "core and gtm";
  `:1032-1045` "owned by kai-personal" → a surviving pack).
- **Recorded consequence:** `kai-learning` loses audio standalone
  (`kai-core-generate-audio` is Capability-family, core-provided). Disclosed, not
  new; **deferred with a trigger** (L3).

### `kai-core` at two agents — plainly stated

**It is a contract-and-machinery library that must ship as a plugin because the
host has no smaller unit — and it remains coherent.** Agent count is the wrong
measure; **provider count** is: core provides **24 of 51** skills (47%), **14 of
14** `CLAIM_SKILLS`, `hooks.json`, and the version probe. Its two agents are the
machinery's **operators**, and both are load-bearing:
`workflow-workspace-init` is the only agent that mints `.kai/manifest.json` (and
the claim-surface pin already requires it co-located with
`kai-core-workspace-onboarding`); `workflow-self-check` audits what the machinery
produced. **No replacement agent is needed** — so **critical operator boundary #6
does not trip.** The change is a copy change in `packDescription()`, already
required by milestone 4.

### Router names

**`director-delivery` UPHELD. `director-personal` REJECTED — three grounds:**

1. It **re-imports the dissolved `kai-personal` vocabulary** that non-negotiable
   #3 retired "not renamed."
2. It **fails C4's positive clause** — it carries the agenda half and erases the
   *"unclear routing"* half that is the front-door half. It names the
   **audience** where `director-agenda` named the **artifact**; both miss the
   **job**.
3. **NEW and decisive under the override** — the exception makes read-only
   discovery and routing the **only** thing this agent can do core-less, and
   `director-personal` **actively misdescribes** that: standalone it routes to
   *anything*, not to anything "personal." The name is least true in exactly the
   mode the exception preserves. **The override raises the bar on this name.**

**No replacement minted** — round 2's reason still holds and the rename cannot
ship in `area-plugins` either way (R5 / F9 / A1(ii)–(iii), **not** overridden).
**Therefore `kai-directors` ships with the shipped agent ids**; the plugin
boundary and the agent names are independent, and separating them is the smallest
change. One constraint added:

> **C4′** — the successor name must remain true in **router-standalone mode**,
> where the agent's entire capability is discovery and routing.

### P0 vs later refinement

**P0 (published identity / gate legality):** N1 nine identities — which costs
**four new ordered `copilot plugin install` commands** in
`kai-core-workspace-onboarding/SKILL.md` (asserted in order at
`validate-plugin.mjs:855-869`), nine CI legs, `marketplace.json`, and the derived
`legacy-rollback` set; N2 `PACKS`; N3 override retarget; N4 D3 fix at
`requires: shipped`; N5 nine runtime keys; N6 hooks owner stays `core`; N7 the
exception mechanism; N8 `CLAIM_SKILLS` unchanged; N9 `creative-video-director` →
`kai-gtm`.

**Later refinement, each with a trigger:** L1 role renames (separate initiative
after `migration-complete`); L2 `CATEGORIES` realignment — note the `Personal`
heading now spans **two** plugins; L3 `kai-core-generate-audio` relocation; **L4
whether a `principal-project-manager` agent is needed — NAMED, NOT INVENTED**;
L5 `kai-assistant`'s #3 framing; L6 `review-success-metrics` home; L7
brand-designer / data-analytics homes.

### Supersession — explicit, neither round rewritten

- **Round 1** (`DECISION 2026-08-27-1850`) — `SUPERSEDED-PENDING` (A13) now
  **resolved to SUPERSEDED**. Survives: the D3 seam defect (**vindicated and
  enlarged, 3 → 6 cases**), the `lectoria` provider-root binding, the
  `hooks.json` owner analysis. Superseded: count 7, DEA in `kai-assistant`, core
  at 6.
- **Round 2** (`DECISION 2026-08-27-2130`) — **superseded in its product
  conclusions, upheld in its mechanics.** R1 superseded; R2 superseded (and its
  measure-#1 ground shown inconsistent; its #3 ground **satisfied, not waived**);
  **R3 split** — first clause superseded, **second clause upheld and
  load-bearing**; R6 upheld and strengthened; R7 upheld; R5/C4 upheld and
  extended by C4′; C5 upheld and re-issued; C1 upheld and used; the weld upheld
  and independently re-verified; the two-partition finding upheld (→ L2).

### Critical-boundary call

**Nothing still needs the operator.** Checked against all eight boundaries:
#1 **no** (the claim surface survives intact — the one the steward warned would
trip); #2 already ruled by the main agent; #3 **no** (`kai-gtm`); #4/#5 untouched
(migration questions); #6 **no** (core needs no replacement agent); #7 **no**
(D-6 prohibits durable standalone state); #8 **no** (`pack-split/**` untouched,
rounds 1–2 superseded not rewritten).

### Routed, not escalated — three PROPOSALs

| # | proposal | to |
|---|---|---|
| **P-A** | **Shortest fuse.** Write `standaloneBlockErrors()` **parameterised over a block variant** in `area-plugins-m2-claim-surface-pin` / `-standalone-floor` (**milestone 2**) rather than hard-coded to one block for all non-core agents — the router block is **milestone 4**. Cheap now; a shipped-gate reopening later. | `principal-swe-manager` → steward |
| **P-B** | Fold the derived core-dependence clause into the already-required `packDescription()` rewrite. | `principal-product-manager` |
| **P-C** | **L4** — whether a `principal-project-manager` agent is needed. Named, deliberately not invented; a new agent is scope expansion, decided at triage. | `principal-product-manager` |

### Scope-discipline classification

Against `scope.current` (`allowlist-repair` + `decisions-locked`) and the
non-negotiables: **N1–N6, N8, N9 — Apply** (in-scope consequences of an accepted
ruling; they make committed scope legal, they do not extend it). **N7 — Apply**;
it adds a **mechanism**, not a **capability** — it enforces a permission the main
agent already granted, and omitting it would leave the exception as unenforced
prose. **L1–L7 — Defer**, each with a trigger. **L4 / P-C — routed, not
applied.**

### Definition-of-done self-check

- Every acceptance line on the item is met and checked (see HANDOFF below).
- **No shipped plugin behavior was edited.** Zero writes to `scripts/`, `packs/`,
  `plugin.json`, `agents/`, `skills/`. Zero writes under
  `kai/initiatives/pack-split/**`. Zero writes to
  `kai/initiatives/area-plugins/northstar.md`, deliverables, backlog, or the
  scope brief — the parallel siblings' files were not touched.
- **Nothing is claimed `shipped`, `verified`, or `observed`.** No command ran.
- Three `PROPOSAL`s routed rather than self-approved; one later-question named
  rather than invented.

---

## HANDOFF 2026-08-27-2215 — principal-swe-architect -> principal-product-manager

- **did:** Authored the canonical round-3 taxonomy decision implementing the main
  agent's override of round 2. Nine plugins; all **56 agents** and **51 skills**
  placed exactly once with per-plugin counts reconciling; the `kai-core-*`
  namespace seam resolved **green by construction** (six fracture cases derived
  from every `**Inherits:**` line — four of them not previously named, and one
  case named in the dispatch shown **not** to be a fracture); the claim-surface
  collision resolved **without changing `CLAIM_SKILLS`**; the `kai-directors`
  standalone exception specified as **eight enforceable clauses** rather than
  prose; `hooks.json` and `lectoria` reassigned across nine packs; router names
  ruled (`director-delivery` upheld, **`director-personal` rejected** on three
  grounds); P0-vs-later split recorded; rounds 1 and 2 explicitly superseded and
  **neither rewritten**.
- **state:** `in-review` (item v1 → v2, lease cleared, all five fields null).
- **needs:** `scope-acceptance` from `principal-product-manager` — the item's
  declared `review_requirements` entry. Specifically: (a) confirm the nine-plugin
  identity set as **committed scope**, since N1 is effectively one-way under
  non-negotiable #9; (b) accept or amend the three one-sentence job statements
  that are new (`kai-directors`, `kai-project-management`, and `kai-assistant` —
  the last is the thinnest against non-negotiable #3); (c) rule on **P-A**, which
  has the shortest fuse because it constrains **milestone 2**, not milestone 4;
  (d) accept **P-B** and **P-C** as steward-owned.
- **artifacts:**
  - `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-3.md`
    (canonical)
  - `kai/coordination/threads/area-plugins-taxonomy-round-3.md` (this thread)
  - `kai/coordination/items/area-plugins-taxonomy-round-3.md` (v2, `in-review`)
- **evidence:** All `reported`, none `observed` — **no shell existed in this
  session and nothing was executed.** Derived by reading, workspace-root-relative:
  `agents/` (directory read, 56 files); `skills/*/SKILL.md` (glob, 51); all 56
  `**Inherits:**` lines (one grep, 56 matches); `scripts/lib/pack-plan.mjs`
  (`:20-182`, `:366-434`, `:1022-1075`, `:1400-1460`, `:1520-1570`, `:1616-1660`);
  `scripts/validate-plugin.mjs` (`:218-245`, `:850-870`);
  `scripts/generate-catalog.mjs` (`:26-190`); `hooks.json`; `scripts/pack-preview.mjs`
  (fixtures at `:546-558`, `:760`, `:841`, `:1032-1045`);
  `agents/director-*.agent.md` (asset grep — **zero** matches);
  `kai/coordination/items/area-plugins-m2-planpacks-prefix.md`;
  `kai/coordination/items/area-plugins-m2-claim-surface-pin.md`;
  `kai/coordination/threads/area-plugins-scope-brief.md` (`:120-175`, `:1200-1290`);
  `kai/coordination/threads/area-plugins-taxonomy-round-2.md`;
  `kai/coordination/threads/area-plugins-optional-core-architecture.md`;
  `kai/coordination/ACTIVE.md`. Capture timestamp 2026-08-27-2215 local.
- **questions:** none blocking. Three `PROPOSAL`s (P-A, P-B, P-C) routed to the
  steward / `principal-swe-manager` for triage, not answers owed to me.
- **next:** `principal-product-manager` — it holds the `scope-acceptance` review
  this item declares, and all four `needs` items above are scope calls, not
  architecture calls. **P-A should be triaged first**: it constrains milestone 2,
  which is upstream of the milestone this record unblocks.

---

## REVIEW 2026-08-27-2240 — principal-product-manager — `scope-acceptance`

**initiative:** area-plugins · **milestone:** decisions-locked
**item:** `area-plugins-taxonomy-round-3` (v3 → v4)
**kind:** `scope-acceptance` · **verdict: APPROVED**

**Lease verified before any state-changing write.** Observed on the item record:
`holder=principal-product-manager`, `token=apx-tax3-acc-20260827-2225-q1`,
`version_at_grant=2`, `version=3`, `state=in-review` — all matching the dispatch.
`version_at_grant (2) < version (3)` is **not** a collision: `kai-core-work-coordination`
("Claiming work safely", step 5) specifies that the grant itself increments the
version, so *"a held lease always has `version_at_grant` strictly less than the item
`version`."* This is the correct held-lease shape. **No COLLISION.**

### What `change_ref` binds to

`change_ref: null` and stays null. This is a `delivery_class: knowledge` item that
produces no diff, so there is no commit SHA to content-address. **This acceptance
is bound instead to the architect's dated `DECISION 2026-08-27-2215` entry in this
thread and to the canonical artifact
`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-3.md`
as of that entry.** Any later edit to that artifact is outside this acceptance and
requires a fresh review. Stated explicitly because a null `change_ref` must never be
read as "unbound".

### Verification — I did not accept on summary

Five load-bearing claims re-derived independently from source this pass. All
`reported`, never `observed` — **no shell exists in this session and nothing was
executed.**

| # | claim | my independent check | result |
|---|---|---|---|
| a | 56 agents / 51 skills, counts reconcile | glob `agents/*.agent.md` → **56**; glob `skills/*/SKILL.md` → **51**; counted `kai-core-*` → **24**. Per-plugin: 2+2+3+20+9+12+4+2+2=**56**; 24+0+0+15+3+7+1+1+0=**51**; non-core skills 51−24=27 = 15+3+7+1+1 ✓ | **CONFIRMED** |
| b | `kai-core-personal-agenda` is NOT a fracture | grep: exactly two `**Inherits:**` consumers — `director-executive-assistant` (→ directors) and `workflow-proactive-scan` (→ project-management). Two packs ⇒ `packs.size === 2` ⇒ core by topology | **CONFIRMED — the dispatch's own premise was wrong, the architect is right** |
| c | both directors provide zero skills **and** zero assets | `director-chief-of-staff` inherits 9 skills, **all** `kai-core-*`; `director-executive-assistant` inherits 6, **all** `kai-core-*`. Asset grep over both bodies (`assets/`, `.mjs`, `.sh`, `scripts/`) → **zero matches** | **CONFIRMED** |
| d | `runtimeDependencyMatrix()` throws, not warns | `pack-plan.mjs:157-170` — `if (!dependencies) throw new Error(...)`, and a second `throw` on an unsanctioned binary. `pack-preview.mjs:762` calls it over `PACK_ORDER`, so all nine keys are load-bearing | **CONFIRMED — throws** |
| e | the six-fracture set is consistent | Derived the rule from the claims: a `kai-core-*` skill fractures iff all consumers land in exactly **one** non-core pack. Checked all six. `-content-grounding` has three consumers (`creative-video-director`, `principal-demand-generation`, `principal-linkedin-strategist`) — **all in gtm** ⇒ `packs.size === 1` ⇒ fractures. `-initiative-stewardship` has a single `**Inherits:**` consumer (DCoS); `principal-product-manager` names it in prose but **not** on its inherits line, so the provider map is unaffected | **CONFIRMED — rule applied consistently; `-personal-agenda` is correctly excluded by the same rule that includes the other six** |

### RULING 1 — the `CLAIM_SKILLS` provider-vs-consumer argument **HOLDS**

This was flagged as "an argument, not a proof" and tied to operator boundary #1. I
tested it hard. **It is a proof, and it is mechanically grounded, not rhetorical.**

The distinction maps onto the actual gate predicate. `namespaceErrors()`
(`pack-plan.mjs:1538`) fires on *"`<plugin>` **provides** skill `<id>`"* — the
quantifier is over **providers**, not inheritors. `planPacks()` and `planAssets()`
(`:1083`) both assign ownership by consumer-pack **cardinality**, which is a
statement about where a file lands, not about who reads it. A pack with an empty
local provider set has nothing to be quantified over, and therefore cannot violate a
provider-side pin. Round 2's dilemma really did conflate the two.

The structural leg is verified against real source, not asserted: both director
bodies inherit **only** `kai-core-*` skills and reference **zero** assets, so
`planPacks().local.directors` is empty by construction. Core-less, those skill files
are not on disk — the same structural withholding the accepted optional-core
architecture already rests on. `kai-directors` is not a weaker case than a
department; it is the strongest, because it ships zero contracts of its own.

**Membership stays at 14. Boundary #1 does NOT trip. No operator escalation.**

**One honesty caveat I am recording rather than burying:** `CLAIM_SKILLS` and
`standaloneBlockErrors()` **do not exist in `scripts/` today** — grep returns zero
matches repo-wide outside `kai/` records. They are milestone-2 constructs from the
accepted optional-core architecture. So "unchanged at 14" is a ruling about a
*planned* constant, verified against design records, and it stays `reported`. This
does **not** weaken the ruling — the structural fact it depends on (directors ship
zero skills and zero assets) is verified against real shipped source, and that is
precisely what the pin will quantify over. It does mean the pin's arm must be
**written** provider-side. That is P-A's neighbourhood and is why I am ruling on P-A
below rather than deferring it.

### RULING 2 — router names: the rejection of `director-personal` is **UPHELD**

C4 is mine, so this is my call to make and I am making it. All three grounds hold;
ground 3 is new, decisive, and I would have reached it independently. Core-less, that
agent's *entire* preserved capability is routing to **anything** — engineering,
product, gtm. `director-personal` is least true in exactly the mode the exception
exists to preserve. A name that describes only what an agent does *with* core is
disqualified. **C4′ is accepted as a standing naming constraint.**

`director-delivery` **upheld** as the working candidate — recorded as a constraint
carried to the successor initiative, **not** locked as shipped copy.

**I am not minting a third name, and the reasoning is the point:** renames cannot
ship in `area-plugins` at all (R5/F9/A1, not overridden). Minting a name inside a
window where it cannot be exercised would fix product copy against evidence the
successor initiative has not gathered yet, and would invite exactly one more round of
naming debate with no way to test the answer. The successor initiative chooses
against evidence, bound by C4 + C4′. **`kai-directors` ships with the shipped ids
`director-chief-of-staff` and `director-executive-assistant`.**

### RULING 3 — the two one-sentence jobs (my own A17 test, applied hard)

- **`kai-directors` — *"the front door: it decides who should handle what."*
  PASS, accepted as written.** One job, no structural "and", no catch-all. §3.2 is
  right that the test did not change — the thing being tested did. A layer over
  departments has a complete job statement.

- **`kai-project-management` — *"makes the portfolio's state visible on a cadence."*
  DOES NOT PASS AS WRITTEN. Reporting this rather than smoothing it over,** exactly
  as the steward obligation requires.

  The sentence covers `workflow-weekly-pulse` and `workflow-proactive-scan`. It does
  **not** cover `workflow-initiative-init`. Minting an initiative is a
  **state-creating** act, not a visibility act, and §7.5 concedes this in its own
  words — it describes that agent as one that *"cannot **mint** an initiative"*
  core-less. "Start / track / surface are three facets of visibility" is a strained
  reading: *track* and *surface* are facets of visibility; *start* is not. Making the
  sentence cover all three requires a structural "and" — *"…and starts new
  initiatives"* — which is precisely the failure mode non-negotiable #3 exists to
  catch.

  **Ruling: I amend the sentence rather than reopen membership.** Membership is a
  settled product override and is not relitigated by a copy defect; one-sentence jobs
  are product copy and mine under A4. Adopted:

  > **`kai-project-management` — *"maintains the portfolio's operating rhythm."***

  Starting an initiative, scanning for signals, and publishing a pulse are three
  facets of one job — the cadence by which a portfolio is kept running — and this
  sentence is true of all three agents without an "and". **PASS.**

  **Trigger, mirroring L5:** if a fourth agent joins `kai-project-management` that is
  not part of the portfolio's operating rhythm, this becomes a catch-all and
  non-negotiable #3 reopens.

### FINDING F-1 (new, mine) — D-7 carries an unnamed prerequisite

**D-7 is not free, and no record currently says so.** Verified this pass:

- `DISPATCHING_ROLES = ['director-chief-of-staff']` (`pack-plan.mjs:1620`).
- `availabilityErrors()` is enforced in **two** places over **every** member:
  `gatePartition()` (`pack-preview.mjs:1261-1265`) and `validate-plugin.mjs:522-531`.
- `director-chief-of-staff` carries all three pinned `AVAILABILITY_RULES` sentences
  (`:195`, `:209`, `:211`). **`director-executive-assistant` carries none of them —
  grep returns zero matches for all three.**

Therefore adding DEA to `DISPATCHING_ROLES` turns **`--gate partition` red with three
violations** until `agents/director-executive-assistant.agent.md` gains the three
byte-pinned sentences. §12.1 asserts partition green; N7 names *"`DISPATCHING_ROLES`
+1"* but **no record names the agent-body prose edit that must accompany it**. That is
a different change class from the constants edits N1–N9 describe, it lands in a
shipped agent body, and it is forbidden in this window.

**Disposition: recorded as an obligation on N7, not a blocker.** It is a completeness
gap in an otherwise verified decision — derivable from D-7, but derivable is not the
same as named, and unnamed gate prerequisites are discovered as red CI at milestone 4.
Carried into the scope brief amendment below.

### Rulings on the routed proposals

- **P-A — ACCEPTED, and it is the highest-priority consequence of this acceptance.**
  Parameterise `standaloneBlockErrors()` over a block variant from the start.
  Independently reinforced by my own finding that the claim-surface pin must be
  written **provider-side**. Both are milestone-2 shape constraints discovered at
  milestone 1, which is the cheapest possible moment. Routed to
  `principal-swe-manager` → steward for sequencing into
  `area-plugins-m2-claim-surface-pin` / `-standalone-floor`. **I am not minting the
  item in this review.**
- **P-B — ACCEPTED as steward-owned.** Folding the derived core-dependence clause
  into the already-required `packDescription()` rewrite adds no gate and no constant.
  Copy is mine under A4.
- **P-C — ACCEPTED as routed, and **deferred** with its trigger intact.** A new
  `principal-project-manager` agent is a **new capability** beyond `scope.current`.
  Under `kai-core-scope-discipline` that is expands-scope and is parked in the
  backlog, not architected in. The architect naming it instead of inventing it is
  exactly right.

### Scope-discipline classification (mine, as the owning role)

- **N1–N6, N8, N9 — Apply.** In-scope mechanical consequences of a settled product
  override. They add no capability; they make an accepted decision legal.
- **N7 — Apply, with F-1 attached.** It adds a *mechanism* enforcing a permission the
  main agent already granted. Omitting it would leave the exception as unenforced
  prose, which is the failure mode non-negotiable #1 exists to prevent.
- **L1–L7 — Defer**, triggers as stated. L4/P-C parked as a proposal.
- **The nine-plugin identity set is confirmed as committed scope.** N1 is effectively
  one-way under non-negotiable #9.

### Why APPROVED and not changes-requested

Every load-bearing claim I was asked to test survived independent re-derivation, and
one of them corrected the dispatch's own premise rather than deferring to it. The two
findings I add (F-1; the `kai-project-management` job sentence) are a completeness gap
and a copy defect — neither invalidates the map, the seam resolution, or the claim-surface
ruling, and both are resolved **inside this review** rather than by another round. A
third taxonomy round would buy nothing.

**Nothing here requires the operator.** I re-checked boundary #1 myself and it does not
trip; I concur on #2–#8.

**Evidence discipline upheld:** all thirteen §12 checks remain `observed`-owed. Nothing
in this acceptance promotes any of them. No downstream record may read this approval as
evidence that a gate is green.

---

## HANDOFF 2026-08-27-2240 — principal-product-manager -> director-chief-of-staff

- **did:** Performed the declared `scope-acceptance` review and **approved** it,
  after independently re-deriving all five load-bearing claims from source rather
  than accepting the architect's summary. Ruled that the **`CLAIM_SKILLS`
  provider-vs-consumer argument holds** and that **operator boundary #1 does not
  trip**; **upheld** the rejection of `director-personal` and declined to mint a
  third name; **accepted** `kai-directors`' one-sentence job as written and
  **amended** `kai-project-management`'s, which did not pass the A17 test as
  written. Closed the four items the north-star pass recorded as OWED, updated the
  north star and `deliverables.md`, and appended a dated steward amendment to the
  scope brief.
- **state:** `completed` (item v3 → v4, `next_role: null`, lease cleared — all five
  fields null).
- **needs:** nothing from me. **This closes the taxonomy chain.**
  `area-plugins-m2-claim-surface-pin`'s typed edge (`requires: completed`, already
  re-pointed here by the director) is now **satisfied**; I did not touch that item.
- **artifacts:**
  - `kai/coordination/threads/area-plugins-taxonomy-round-3.md` (`REVIEW
    2026-08-27-2240`, this record)
  - `kai/coordination/items/area-plugins-taxonomy-round-3.md` (v4, `completed`)
  - `kai/initiatives/area-plugins/northstar.md` (four OWED items closed; jobs recorded)
  - `kai/initiatives/area-plugins/deliverables.md` (two decision artifacts indexed)
  - `kai/coordination/threads/area-plugins-scope-brief.md` (`STEWARD AMENDMENT A27`)
- **evidence:** All `reported`, never `observed` — **no shell existed in this session
  and nothing was executed.** Derived by reading, workspace-root-relative:
  `agents/*.agent.md` (glob → 56); `skills/*/SKILL.md` (glob → 51, of which 24 are
  `kai-core-*`); `**Inherits:**` greps for all six claimed fracture skills and for
  `kai-core-personal-agenda`; `agents/director-chief-of-staff.agent.md` and
  `agents/director-executive-assistant.agent.md` (inherits lines + asset grep → zero
  matches + `AVAILABILITY_RULES` grep → 3 matches vs **0**);
  `scripts/lib/pack-plan.mjs` (`:157-170`, `:1073-1086`, `:1526-1545`, `:1614-1635`);
  `scripts/pack-preview.mjs` (`:756-769`, `:1223-1231`, `:1255-1267`);
  `scripts/validate-plugin.mjs` (`:516-532`); repo-wide grep for `CLAIM_SKILLS`
  (**zero** matches outside `kai/`); `skills/kai-core-work-coordination/SKILL.md`
  (`:308-350`, the lease/collision rule). Capture timestamp 2026-08-27-2240 local.
- **questions:** **none for `@operator`.** Boundary #1 re-checked by me directly and
  it does not trip; I concur with the architect on #2–#8. No operator decision
  remains on this item.
- **next:** `director-chief-of-staff` for dispatch. **Triage P-A first** — it
  constrains **milestone 2**, which is upstream of the milestone this record
  unblocks, and my finding that the claim-surface pin must be written
  **provider-side** points at the same code. **F-1** should be attached to whichever
  milestone-2/4 item lands `DISPATCHING_ROLES +1`: `agents/director-executive-assistant.agent.md`
  must gain the three byte-pinned `AVAILABILITY_RULES` sentences in the same change,
  or `--gate partition` goes red with three violations.

# Thread — area-plugins-scope-brief

Append-only communication log mirroring
`kai/coordination/items/area-plugins-scope-brief.md`. Never edited after the
fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-1839):** no agent in this session has a shell,
so `kai/initiatives/area-plugins/` cannot be created and the canonical
`artifact_target`
(`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-scope-brief.md`)
cannot yet be written. That target is recorded and unchanged. Until one
operator `mkdir` runs, **this thread is the durable record of the scope
decision** — a real canonical coordination path, not a substitute workspace.
When the initiative directory exists, the north star and the decision artifact
are transcribed from the BRIEF packet below without re-litigation.

---

## BRIEF 2026-08-27-1839 — principal-product-manager (steward)

Authoritative product scope for the `area-plugins` initiative. The operator has
settled the direction; this packet **restates it as scope** and adds only the
judgment the operator delegated: phase boundaries, ordering, measures, and the
decision-boundary line. Nothing in the ten directions is re-opened.

### Mission and vision

- **mission:** Make each kai area a standalone plugin a person can install and
  use on its own, with `kai-core` an optional upgrade that adds durable
  coordination rather than a prerequisite that gates access.
- **vision:** kai ships from one `kai` marketplace as area plugins —
  engineering, product, gtm, learning, assistant, wellness — each installable
  alone and honest about what it cannot do without core, with `kai-core` an
  opt-in upgrade to durable workspace, coordination, fleet, and handoffs, and
  every `1.0.4` user migrated off `kai-plugins` / `packs/` / `kai-personal`
  without stranding.

### The one product reframing this brief contributes

Direction #4 reads, on its face, as *"delete the fail-closed refusal."* That
reading would be a trust regression: today's `KAI-CORE-MISSING` is the only
mechanical thing standing between a core-less session and an agent that claims
it took a lease, wrote a handoff, or shipped something.

The correct reading, and the one this brief makes binding:

> **Fail-closed is relaxed for _loading_, never for _claims_.**
> Today the refusal fires on load. Tomorrow it fires on assertion. The
> guarantee does not shrink — it moves from *"you may not run"* to *"you may
> run, but you may not claim durable state."*

Every downstream decision inherits this framing. An optional-core design that
lets an area agent run without core but cannot mechanically prevent a false
durability claim has not satisfied direction #4 — it has traded a mechanical
guarantee for a prompt-level hope, which is a critical operator boundary (see
below), not an engineering detail.

### Scope

**targets**

- `plugin.json`
- `agents/`, `skills/` (root — the single source of truth)
- `scripts/lib/pack-plan.mjs` (`PACKS_DIR`, `PACKS`, `PACK_ORDER`,
  `SKILL_OWNER_OVERRIDES`, `COMMITTED_PACKS`, `PACK_RUNTIME_DEPENDENCIES`,
  `packPluginName`, derived `legacy-rollback` set)
- `scripts/lib/preflight-block.txt`, `scripts/lib/degraded-block.txt`
- `scripts/lib/migration-doctor.mjs` (`MARKETPLACE`)
- `scripts/pack-preview.mjs`, `scripts/validate-plugin.mjs`,
  `scripts/release-guard.mjs`, `scripts/workspace-doctor.mjs`
- `.github/plugin/marketplace.json`, `.github/workflows/validate.yml`
- `docs/getting-started.md`, `docs/reference/plugin-structure.md`, `AGENTS.md`
- the generated committed tree `packs/` -> `plugins/`
- the marketplace `kai-plugins` -> `kai`

**keywords**

`area`, `plugin`, `optional-core`, `standalone`, `dual-path`, `taxonomy`,
`kai-personal`, `learning`, `assistant`, `wellness`, `marketplace-rename`,
`packs-to-plugins`, `migration`, `composability`, `preflight`, `honesty`

**current**

`decisions-locked` only. `scope.current` is the active frontier, not the
roadmap; the steward advances it one milestone at a time so
`kai-core-scope-discipline` has a tight surface to classify against.

**out_of_scope**

- Rewriting or re-scoping agent and skill **content**. This initiative
  relocates agents and re-contracts loading; it does not redesign personas or
  prose. "Areas" is a packaging word, and packaging work that starts editing
  agent bodies has left scope.
- Adding agents or capabilities. No area gets a new agent to make it feel
  complete, and no area is justified by an agent that does not exist yet.
- Adding areas beyond the settled set (`core`, `engineering`, `product`, `gtm`,
  `learning`, `assistant`, `wellness`) once the taxonomy locks.
- Changing membership of `kai-engineering`, `kai-product`, or `kai-gtm`. Only
  `kai-personal` dissolves, and only `director-executive-assistant` leaves
  `core`.
- Naming a marketplace after an area, or creating a plugin named `kai`.
- Changing the host or upstream to add native plugin-dependency declarations;
  kai supplies prompt-level and CI-level guarantees only.
- Per-plugin independent semver. Lockstep versions stand.
- Rewriting historical records to match the new vocabulary — `CHANGELOG.md`,
  `kai/library/releases/**`, `kai/coordination/**`, `kai/initiatives/**` are
  history, not surfaces.
- Modifying anything under `kai/initiatives/pack-split/**`. That initiative is
  `shipped` and stays closed.
- Re-litigating the ten operator-settled directions.

**deferred** (each with the trigger that reopens it)

- **Per-area independent versioning.** Revisit when the area set has been
  stable for a full release cycle *and* one area needs a cadence the others
  do not. Inherited from `pack-split`.
- **A richer onboarding "area selector" beyond a truthful install list.**
  Revisit after `migration-complete`, when the area set stops moving. Building
  a selector against a moving set means building it twice.
- **Durable state for standalone mode** (any opt-in local store that outlives
  a session). Revisit only on evidence that standalone users repeatedly lose
  work they reasonably expected to keep. Explicitly parked: it reopens the
  honesty non-negotiable and would need its own operator decision.
- **`creative-video-director`'s longer-term home.** Revisit if a second agent
  begins referencing any of `create-product-demo`, `demo-capture`,
  `demo-narrate`, `demo-zoom` — today it is the sole referencer, which is why
  the placement is decidable now.
- **Broader fleet certification** of collision and roster-enumeration
  behavior beyond the bounded arms. Inherited unchanged from `pack-split`.

### Non-negotiable principles

These are the material the north star carries verbatim. #1–#10 restate the
operator's directions; #11–#13 are the invariants the current codebase and the
`pack-split` lineage already enforce and that this refactor must not lose.

1. `plugins/` is the artifact directory name. **"Areas" is product language
   only** — it never names a directory, a marketplace, or a manifest field.
2. Host syntax `<plugin>@<marketplace>` is fixed. There is exactly one
   marketplace and it is named `kai`, yielding `kai-engineering@kai`. No
   marketplace is named after an area; no plugin named `kai` is ever created.
3. `kai-personal` is **dissolved, not renamed**. Every successor area must
   state its job in one sentence without the word "and" doing structural work.
   A catch-all is not an area.
4. `kai-core` is an **optional** structured-experience upgrade. No area agent
   may require core in order to load.
5. With no core installed, an area agent offers exactly **two honest paths** —
   install core for durable workspace/coordination/fleet/handoffs, or continue
   in standalone mode. It never takes a silent third path.
6. **Fail-closed is relaxed for loading only, never for claims.** Standalone
   mode uses session/temp state only; it never creates or impersonates a
   canonical `.kai` workspace; and it explicitly disclaims durable
   coordination, fleet visibility, leases, handoffs, and shipped-state claims.
7. Installing core later activates full mode **in a fresh session**, and the
   transition is truthful: prior temp state is never presented as durable,
   never retroactively promoted, and never counted as evidence.
8. Several installed areas compose without ambiguity: unique skill IDs,
   exactly one provider per skill, exactly one `hooks.json` owner,
   generated-root determinism, and byte-parity `--check` preserved.
9. No `1.0.4` user is silently stranded, and old and new plugin identities
   never coexist in one workspace. The **derived** `legacy-rollback` forbidden
   set continues to cover every publishable identity, old and new.
10. Small reviewable PRs and lockstep versions. Each milestone is independently
    shippable and reversible; a milestone may span more than one release, but
    every release must be revertible on its own.
11. Root `agents/` and `skills/` stay the single source of truth. Plugin trees
    are **generated** and committed, never hand-carved.
12. **No new plugin identity is published under a marketplace name or an
    operating contract that has already been decided to change.** (Derived
    ruling — see the ordering section; elevated to a principle because it is
    what makes the phase order non-arbitrary.)
13. `pack-split` is `shipped` and closed. Nothing under
    `kai/initiatives/pack-split/**` is modified, and no rename rewrites
    historical records.

### Ordering ruling — the initiative's main sequencing risk

**Question put to me:** must the optional-core contract land *before* the
taxonomy split and the renames, or should taxonomy go first?

**Ruling: the optional-core contract lands first. Firmly. And I am revising
the proposed phase order further — the surface rename also moves ahead of the
taxonomy split.** Reasons, strongest first:

**1. Contract-then-identity.** The optional-core change alters *what every
non-core agent is*; the taxonomy change alters *which plugin each agent lives
in*. If taxonomy ships first, `kai-learning`, `kai-assistant`, and
`kai-wellness` are minted as marketplace identities carrying the byte-pinned
fail-closed preflight — i.e. born publishing "I refuse without core" — and one
release later we replace that contract under users who already installed them.
We would be shipping a promise we had already decided to break. Contract first
means every new identity is **born with its final contract**.

**2. The `director-executive-assistant` flip proves the point concretely.**
Today core agents are *forbidden* from carrying the preflight and non-core
agents *must* carry it. Moving `director-executive-assistant` out of `core`
into `kai-assistant` under the current contract therefore makes it *acquire* a
fail-closed refusal — and optional-core then strips it again. That agent would
ship two contradictory contracts in two consecutive releases, and it is
precisely the flagship an `kai-assistant` user would expect to work standalone.
Reversing the order removes the flip entirely.

**3. Reversible before irreversible.** The optional-core milestone creates and
destroys **no marketplace identity**: it is a generator change, regenerated and
republished on the existing five. If the dual-path contract is wrong, we revert
one version on five known identities. The taxonomy milestone mints three
identities and retires one, which is only reversible through a migration path.
The reversible change goes first, so the load-bearing mistake is discovered
while rollback is still cheap.

**4. Attribution under CI.** `--gate partition`, `--gate collision`, and
`--check` would otherwise be asked to certify a new partition *and* a new
contract in one step; a red build could not tell you which broke it. This is
the same discipline `pack-split` enforced — never flip everything in one
unreviewable step.

**Steelman of taxonomy-first, and why it loses.** Taxonomy is genuinely the
cheaper change *in the repo* — largely a data edit to `PACKS` and
`SKILL_OWNER_OVERRIDES` — and shipping it early would prove the generator
handles seven plugins. But it is cheap in the repo and **expensive in the
marketplace**, because it mints public identities. That asymmetry is the trap.
And the de-risking value is available without the risk: `pack-split` already
established "generated and committed unpublished" as a legal state, so the
seven-plugin generator can be proven in preview without publishing anything.
Taxonomy-first buys evidence we can get for free at a price we cannot refund.

**Why the surface rename also moves ahead of taxonomy (revision to the
proposed order).** The same principle #12 applies to the marketplace name. If
the rename lands *after* the split, the three new areas are born as
`kai-wellness@kai-plugins` and must re-point one release later — new identities
born into a dying marketplace name. If the rename lands *before* the split, the
riskiest change is executed against the **known, shipped, stable** `1.0.4`
five-plugin set with exactly one variable moving, the derived `legacy-rollback`
forbidden set covers five identities instead of eight, and the new areas are
born at `kai-learning@kai` and never move. A `1.0.4` user is touched twice
either way; only one of the two orders avoids minting identities we have
already decided to rename.

**What this ruling does _not_ decide.** Whether `packs/` -> `plugins/` and
`kai-plugins` -> `kai` ship as one release or two is delegated to
`area-plugins-migration-architecture`, which already carries that acceptance
line. My constraint on it is only this: **both must complete before any new
area identity is published**, and the two enormous diffs — the folder move and
the per-agent contract rewrite — must not land in the same PR.

**The one condition that would reopen this.** If the optional-core architecture
concludes that the shape of the dual-path contract genuinely depends on which
area an agent lives in, the two are entangled. The resolution is still not to
ship taxonomy first: it is that both **decisions** are already in milestone 1,
so taxonomy is *decided* early and *shipped* late.

### Milestones

Revised from the proposed shape: phases 3 and 4 are swapped, per the ordering
ruling. Five milestones, each independently shippable and reversible.

---

**1. `decisions-locked`**

- **outcome:** The product scope is authoritative and the three architecture
  questions — optional-core contract, area taxonomy, migration — are answered
  in reviewed decision records, before any generator, manifest, or marketplace
  change is made.
- **acceptance:**
  - This scope brief is complete and its non-negotiables are carried into a
    north star at `kai/initiatives/area-plugins/northstar.md`.
  - `area-plugins-optional-core-architecture` is `completed`: it names what
    replaces the injected preflight, defines standalone state and the
    core-installed-later transition, preserves composability, and states which
    CI gates change and what each asserts afterwards.
  - `area-plugins-taxonomy-decision` is `completed`: every agent in exactly one
    area, every skill exactly one provider, `creative-video-director` placed on
    stated evidence, `lectoria` reassigned to the areas that execute it.
  - `area-plugins-migration-architecture` is `completed`: marketplace rename
    mechanism, `kai-personal` fate, doctor recognition of both identities, and
    the derived `legacy-rollback` coverage are all decided.
  - No production code, manifest, or marketplace change has been made.
- **serves:** all five measures — this milestone is where they become
  falsifiable rather than aspirational.

---

**2. `optional-core-contract`**

- **outcome:** The dual-path standalone/full contract is built and CI-enforced
  **at root**, against the existing five-plugin topology, with no plugin
  identity created, renamed, or retired.
- **acceptance:**
  - Every generated non-core agent offers the two honest paths when core is
    absent, and none refuses to load for that reason alone.
  - Standalone mode is proven, in CI, to use session/temp state only — it
    creates no path that a workspace doctor would read as a canonical `.kai`
    workspace.
  - CI asserts the standalone disclaimer covers durable coordination, fleet
    visibility, leases, handoffs, and shipped-state claims; **any place
    fail-closed is deliberately relaxed is named with its replacement
    guarantee.**
  - The core-installed-later transition activates full mode in a fresh session
    and never presents prior temp state as durable.
  - `--gate partition`, `--gate collision`, `--gate partial-install`,
    `--gate version-skew`, and `--check` are all green, with each changed gate's
    new assertion documented.
  - Ships on the existing five identities under the existing marketplace name;
    revertible by reverting the generator and regenerating.
- **serves:** standalone usability; honesty (no false durability claim).

---

**3. `surface-rename`**

- **outcome:** The generated tree is `plugins/` and the marketplace is `kai`,
  executed against the stable five-plugin set with the dual-path contract
  already in place.
- **acceptance:**
  - `PACKS_DIR` remains the single source of truth for the tree name, and the
    five known literals that do not follow it are fixed:
    `.github/workflows/validate.yml`, `scripts/release-guard.mjs`
    `BEHAVIOR_PREFIXES`, `docs/getting-started.md`,
    `docs/reference/plugin-structure.md`, `AGENTS.md`.
  - `migration-doctor` (`MARKETPLACE`) and `workspace-doctor --migration-check`
    recognise both the old and new marketplace identities, classifying
    `clear` / `blocked` / `unknown` correctly through the transition.
  - The derived `legacy-rollback` forbidden set covers every publishable
    identity under both names.
  - No marketplace is named after an area; no plugin named `kai` exists.
  - Historical records are untouched.
  - The folder move and the marketplace rename do not land in the same PR.
- **serves:** no stranded `1.0.4` user; and it clears the way for identities to
  be born final.

---

**4. `area-taxonomy-split`**

- **outcome:** `kai-personal` is dissolved into `kai-learning`,
  `kai-assistant`, and `kai-wellness` (plus the decided
  `creative-video-director` placement), with `director-executive-assistant`
  moved out of `core` — every new identity born at `@kai`, under `plugins/`,
  carrying the final dual-path contract.
- **acceptance:**
  - The settled memberships ship unchanged: `kai-learning` (instructor-tutor,
    instructor-teacher, instructor-path-mentor, workflow-course-to-audio);
    `kai-assistant` (director-executive-assistant, persona-self,
    principal-engineer-career-mentor); `kai-wellness`
    (persona-professional-nutritionist, persona-professional-trainer).
  - Every agent is in exactly one plugin and every skill has exactly one
    provider; `--gate partition` and `--gate collision` are green **by
    construction**, not by exception.
  - Each area's job passes the one-sentence test; no successor is a catch-all.
  - `lectoria` is declared by exactly the areas that execute it.
  - `hooks.json` still has exactly one owner after
    `director-executive-assistant` leaves core.
  - No agent or skill body was rewritten to make the taxonomy work.
- **serves:** partition integrity and area coherence; focused install cost.

---

**5. `migration-complete`**

- **outcome:** Every `1.0.4` user has a proven path onto the new topology, the
  retired identities are gone rather than coexisting, and the initiative's
  claims are bound to production evidence.
- **acceptance:**
  - `kai-personal` is retired, superseded, or redirected per the migration
    record, with uninstall-first and coexistence-refused preserved.
  - No old identity remains installable, and no workspace can end up with an
    old and a new identity loaded together.
  - A doctor run on a real `1.0.4` install reaches `clear` on the new topology.
  - The success measures are re-measured against their baselines and recorded.
  - Closure evidence exists: a non-empty `deliverables.md` and
    `director-summary.md`, with every milestone's typed `required_items`
    mapping non-empty and every item at its declared terminal state.
- **serves:** no stranded `1.0.4` user; and it is the only milestone permitted
  to use the word `shipped`, and only after the operator has deployed and
  verified.

### Success measures

| # | measure | baseline (grounded, 2026-08-27) | target |
|---|---------|--------------------------------|--------|
| 1 | An area plugin is usable with no core installed. | **0 of 4** department plugins are usable standalone: every generated non-core agent carries the byte-pinned preflight and replies exactly `KAI-CORE-MISSING` when core is absent. | **Every** area plugin loads and works standalone, and 100% of standalone entries present the two honest paths. Zero core-required load failures. |
| 2 | Standalone mode never makes a false durability claim. | Trivially 0 today because standalone mode is unreachable — the refusal makes it impossible to claim anything. The relaxation is what creates the risk. | Still **0**, now mechanically: CI asserts every area agent's standalone path disclaims durable coordination, fleet visibility, leases, handoffs, and shipped-state, and creates no canonical `.kai` workspace. The core-installed-later transition never promotes temp state to durable. |
| 3 | Partition integrity and area coherence. | 56 agents across 5 plugins, `--gate partition` green at 56/56. But `kai-personal` is a **9-agent catch-all** — nutritionist, trainer, self, three instructors, video director, career mentor, course-to-audio — whose job cannot be stated in one sentence. | Every agent in exactly one area, every skill exactly one provider, gates green by construction at the new plugin count, and **every** area's job stated in one sentence. Catch-all count: 0. |
| 4 | Cost of a focused install. | To reach the 2 wellness personas today a user installs `kai-core` (7 agents) + `kai-personal` (9 agents) = **16 agents**, core mandatory. Learning is the same 16 to reach 4 agents. | `kai-wellness` standalone = **2 agents**, no required core (16 -> 2). `kai-learning` standalone = 4 agents (16 -> 4). |
| 5 | No `1.0.4` user is stranded. | 5 plugins live at `1.0.4` under marketplace `kai-plugins` with `installSurface: packs`; `migration-doctor` recognises exactly one marketplace name and `kai-personal` as a valid identity. | Every `1.0.4` identity has a doctor-verified path to its successor; old and new never coexist installed; the derived `legacy-rollback` set covers **100%** of publishable identities old and new; silent stranding paths: **0**. |

### Critical operator decision boundaries

Work proceeds without pauses **except** when one of these is hit. Each is a
place where a non-negotiable would have to bend, which is not an engineering
call:

1. **Honesty cannot be mechanised.** If the optional-core architecture
   concludes that standalone mode's no-false-claim guarantee cannot be enforced
   by CI and must rest on prompt text alone, that trades a mechanical guarantee
   for a prompt-level one. Non-negotiable #6 bends — operator only.
2. **Coherence vs. the settled area set.** If an area cannot be made coherent
   without either adding an agent (out of scope) or leaving a catch-all
   (violates #3), the operator chooses which principle bends.
3. **A new area is the only coherent home for `creative-video-director`.**
   That adds a plugin identity beyond the settled set — operator only.
4. **Coexistence window.** If the marketplace rename cannot be executed without
   a window in which old and new identities are both installed, that is
   non-negotiable #9 bending — operator only.
5. **Undetectable stranding.** If migration requires a manual user action we
   cannot detect or verify, silent stranding becomes possible — operator only.
6. **Core loses coherence.** If `director-executive-assistant` leaving `core`
   means core needs a replacement agent to remain sensible, that is added scope.
7. **Any proposal to give standalone mode durable state.** Parked in
   `deferred`; unparking it is an operator decision, not a design refinement.
8. **Any need to modify `kai/initiatives/pack-split/**` or rewrite historical
   records.** Refuse and escalate.

### Evidence routed to the architecture decisions

Grounded this session from `C:\src\kai`; recorded here as **input to the routed
decisions**, not as new scope.

**For `area-plugins-taxonomy-decision`:**

- `creative-video-director` is the **sole** agent referencing
  `create-product-demo`, `demo-capture`, `demo-narrate`, `demo-zoom`. Those
  four follow its placement, which collapses a would-be second decision into
  this one. Its `**Inherits:**` line carries `kai-core-content-grounding` and
  `video-direction`; its documented inputs (`product_context.json`,
  `media_manifest.json`) are produced by `principal-product-marketing`, which
  lives in `kai-gtm`.
- **New, and material:** `lectoria` fans out **three** ways under the new
  taxonomy, where `PACK_RUNTIME_DEPENDENCIES` today declares it for only
  `core` and `personal`. Its consumers on disk are
  `agents/workflow-course-to-audio.agent.md` (-> `kai-learning`),
  `skills/demo-narrate/SKILL.md` (-> follows `creative-video-director`), and
  `skills/kai-core-generate-audio/SKILL.md` (-> `core`). The reassignment is
  therefore not a rename of one declaration; it is a 2-way -> 3-way split, and
  `PACK_RUNTIME_DEPENDENCIES` / `runtimeDependencyMatrix()` must stay derived
  across it.
- Product constraint bounding the `creative-video-director` choice: **smallest
  coherent area**, tested by the one-sentence job test. Creating a new area to
  house one agent is out of scope and escalates (boundary #3). The honest
  tension for architecture to weigh, not for me to pre-empt: `kai-gtm` follows
  the input producer but imports four demo skills and a runtime dependency it
  currently does not declare; any of the three new areas keeps `kai-gtm` clean
  but weakens that area's one-sentence job.
- `core` is 7 agents today; `director-executive-assistant` leaving makes it 6.
  `HOOKS_OWNER = 'core'` is a plugin-level assignment, not an agent-level one,
  so the single-`hooks.json`-owner invariant should survive the move — but the
  taxonomy record must confirm it rather than assume it.

**For `area-plugins-optional-core-architecture`:**

- The relaxation target is precise: `scripts/lib/preflight-block.txt` and
  `scripts/lib/degraded-block.txt`, injected into every generated non-core
  agent, **forbidden** in core agents, and pinned byte-for-byte by `--check`.
  Direction #4 contradicts this mechanism directly; that contradiction is the
  load-bearing architectural change and the reason this decision is priority 1.
- The reframing in this brief is binding on that record: name, for each place
  fail-closed is relaxed, **the replacement guarantee**. "Removed" is not an
  acceptable disposition for any of them.

---

## HANDOFF 2026-08-27-1839 — principal-product-manager -> principal-swe-architect

- did:       Authored the authoritative product scope for `area-plugins` (BRIEF packet above) as steward: mission/vision, scope targets + keywords + `out_of_scope` + `deferred`, 13 non-negotiable principles carrying the ten operator-settled directions verbatim in intent, 5 milestones, 5 success measures with grounded baselines and targets, and 8 named critical operator decision boundaries. **Ruled on the ordering risk** and **revised the proposed phase order**: `optional-core-contract` before `area-taxonomy-split` (firmly), and `surface-rename` also moved ahead of the split — both under the derived principle that no new plugin identity is published under a marketplace name or contract already decided to change. Added one product reframing that binds the optional-core record: fail-closed is relaxed for *loading* only, never for *claims*. **Promotion rulings:** `area-plugins-optional-core-architecture` `proposed -> ready` (priority 20 -> 10); `area-plugins-taxonomy-decision` `proposed -> ready` (priority 20, unchanged); `area-plugins-migration-architecture` **held** at `proposed` — its `depends_on area-plugins-taxonomy-decision requires: completed` is genuinely unsatisfied, and that dependency is correct because the migration record must cover every new identity the taxonomy produces. Completed this knowledge item and cleared its lease. Wrote no production code and touched nothing under `scripts/`, `packs/`, `plugin.json`, or `kai/initiatives/pack-split/`.
- state:     completed
- needs:     Author the two `ready` decision records against their existing acceptance lists, consuming this brief as the scope constraint rather than re-deriving it. Route any needed change to scope, non-negotiables, or milestone boundaries back to the steward as a QUESTION — do not absorb it. Two bindings apply: (a) the optional-core record must name a **replacement guarantee** for every place fail-closed is relaxed, since "removed" is not an acceptable disposition; (b) where the taxonomy record and the optional-core record touch the same question — chiefly `director-executive-assistant` leaving `core` — the **optional-core record takes precedence**, so resolve them in one coherent pass. No hard `depends_on` was added between the two so milestone 1 is not needlessly serialised.
- artifacts: kai/coordination/threads/area-plugins-scope-brief.md (this record — durable scope decision while `kai/initiatives/area-plugins/` cannot be created); kai/coordination/items/area-plugins-scope-brief.md (version 3, `completed`, lease null); kai/coordination/items/area-plugins-optional-core-architecture.md (version 2, `ready`, priority 10); kai/coordination/items/area-plugins-taxonomy-decision.md (version 2, `ready`, priority 20); kai/coordination/items/area-plugins-migration-architecture.md (version 2, held `proposed`, priority 30)
- evidence:  `PACKS_DIR = 'packs'` (scripts/lib/pack-plan.mjs:49); `MARKETPLACE = 'kai-plugins'` (scripts/lib/migration-doctor.mjs:56); `.github/plugin/marketplace.json` — 5 plugins at `1.0.4`, `installSurface: packs`; `PACKS` = core 7 / engineering 20 / product 9 / gtm 11 / personal 9 = 56; `HOOKS_OWNER = 'core'`; `SKILL_OWNER_OVERRIDES` places the four `demo-*` skills in `personal`; `PACK_RUNTIME_DEPENDENCIES` declares `lectoria` for `core` and `personal`, while the only on-disk consumers are `agents/workflow-course-to-audio.agent.md`, `skills/demo-narrate/SKILL.md`, `skills/kai-core-generate-audio/SKILL.md`; `GATES` = partition | collision | partial-install | version-skew (scripts/pack-preview.mjs:1355-1359) — all captured 2026-08-27 from C:\src\kai by file read.
- questions: none blocking. Two items for the steward/operator when a shell exists: (1) `kai/initiatives/area-plugins/` needs one operator `mkdir` before the north star, `deliverables.md`, `log.md`, `backlog.md`, and the canonical `artifact_target` can be materialised from this packet; (2) `kai/coordination/ACTIVE.md` still reads "No initiatives are active" and cannot be corrected honestly until the north star exists — it is outside this item's `touches` and was deliberately not edited.
- next:      principal-swe-architect — owns both `ready` records. `area-plugins-optional-core-architecture` is priority 10 and is the single most load-bearing decision in the initiative; `area-plugins-taxonomy-decision` is priority 20 and may be authored in the same pass. Dispatch is `director-chief-of-staff`'s to make. `area-plugins-migration-architecture` returns to the steward for promotion the moment the taxonomy record reaches `completed`.

---

## STEWARD AMENDMENT 2026-08-27-1906 — principal-product-manager

**Append-only amendment to the `BRIEF 2026-08-27-1839` packet above. Nothing
above this line is rewritten.** Where this amendment and the original BRIEF
conflict, this amendment governs and the conflict is named explicitly below.

Issued at the `scope-acceptance` of `area-plugins-optional-core-architecture`
and `area-plugins-taxonomy-decision`, both **approved** and moved to
`completed` in the same pass. `kai/coordination/items/area-plugins-scope-brief.md`
remains `completed` at version 3 with a null lease — the item's acceptance was
met and its deliverable is the BRIEF packet; this amendment extends the durable
scope record without reopening the item.

Four things changed, all forced by evidence the two architects produced:

---

### A1 — Milestone 4's "no body rewritten" line was defective. Amended.

**Trigger.** `scripts/validate-plugin.mjs:860` derives
`guidedInstallCommands = PACK_ORDER.map(pack => \`copilot plugin install
${packPluginName(pack)}@${MARKETPLACE}\`)` and asserts every literal is present
in `skills/kai-core-workspace-onboarding/SKILL.md` in canonical core-first
order. Splitting `kai-personal` therefore **mechanically forces** an edit to
that skill body under every placement option — including doing nothing to
`creative-video-director`.

**Ruling: (a) — generator-derived identity strings are packaging, not content,
and are exempt.** Three reasons, and the third is the one that settles it:

1. They are not authored prose; they are **projections of generator constants**
   (`PACKS` / `PACK_ORDER` / `packPluginName()` / `MARKETPLACE`), pinned into
   the body by CI precisely so the body cannot drift from the partition. Under
   non-negotiable #11, re-deriving a derived string is regeneration, not
   rewriting.
2. The line separating content from packaging is **authorship, not file
   location**. `out_of_scope` bars "rewriting or re-scoping agent and skill
   content … redesigning personas or prose." An install command is neither. No
   judgment, capability, procedure, or persona changes when a plugin id changes
   in a command list.
3. **Reading (b) makes this brief self-defeating.** The same derivation runs
   over `MARKETPLACE`, so `surface-rename` (milestone 3) forces the identical
   edit to that same file *before* the taxonomy split ever runs. Under (b) the
   brief would forbid the marketplace rename it mandates. A line that no
   milestone can satisfy is a drafting bug, and I am fixing it rather than
   making engineering route around it.

**Amended acceptance line.** Replaces milestone 4's *"No agent or skill body was
rewritten to make the taxonomy work,"* and applies **initiative-wide** — to
milestones 3, 4, and 5 — not to milestone 4 alone:

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

**The exempt set today**, enumerated so it stays reviewable rather than
elastic:

| body | spans | deriving check | (ii) |
|---|---|---|---|
| `skills/kai-core-workspace-onboarding/SKILL.md` | guided installer commands, `marketplace browse` line, `/plugin` enable lines | `validate-plugin.mjs:860+` | **satisfied** |
| `skills/demo-narrate/SKILL.md` | `<kai-personal-plugin>` provider-root placeholders (6 sites) + the `npm ci --prefix` line | none | **not satisfied** |

`demo-narrate` passes (i) and (iii) but fails (ii): nothing derives or pins those
literals, which is exactly why the string `kai-personal` survives a fully green
build there — the silent-stranding shape measure #5 targets at zero.
**Routed, not legislated:** `area-plugins-migration-architecture` must either
satisfy (ii) for that file or explicitly accept the unpinned string with a
stated detection path. That is a `Reframe` inside its existing "no stranded
`1.0.4` user" acceptance, not an addition to it. Adding a CI gate by steward
fiat would be the same scope expansion I hold every other role to.

`out_of_scope` bullet 1 ("Rewriting or re-scoping agent and skill **content**")
stands unchanged and is now read *with* this exception rather than against it.

---

### A2 — Success measure #2 is restated as what it can actually assert.

**Trigger.** The routed blast-radius residual, accepted this pass in
`kai/coordination/threads/area-plugins-optional-core-architecture.md`
(`DECISION 2026-08-27-1906`). Once standalone mode is reachable, the permitted
output space stops being a single string, so *"was that claim false?"* becomes a
judgment over free text that no CI can decide. Measure #2 as originally written
("standalone mode never makes a false durability claim", baseline trivially 0)
would let a mechanically-green build read as proof of something it does not
prove.

**Amended measure #2** — it becomes an assertion about **mechanism presence**,
plus a detection clause, rather than an unfalsifiable claim about outcomes:

> **#2 — Standalone mode is structurally incapable of producing durable state,
> and says so.**
> *baseline:* not applicable — standalone is unreachable today, so the property
> is vacuous rather than achieved.
> *target:* (a) every skill in `CLAIM_SKILLS` is provided by `core` and by no
> area, and `workflow-workspace-init` + `kai-core-workspace-onboarding` are
> co-located in `core`, asserted by `--gate partition`; (b) every area agent's
> standalone path carries all five pinned disclaimers plus the
> no-retroactive-promotion prohibition, asserted by `standaloneBlockErrors()`;
> (c) a materialised area-alone tree contains **zero** paths under `.kai`,
> `kai/coordination`, `kai/initiatives`, `kai/library`, and no `manifest.json`,
> asserted by `--gate partial-install` arm B; (d) the core-installed-later
> transition contains no instruction to read a standalone scratch root.
> *detection, stated because prevention is now partial:* a substantiated report
> of a standalone agent asserting durable state is a **P0** that reopens
> critical boundary #1 with a real instance in hand.

Measures #1, #3, #4, #5 are unchanged.

---

### A3 — Sequencing: the `planPacks()` prefix fix moves into milestone 2. The milestone order does not change.

**The finding.** The operator-settled taxonomy **does not compile today**.
`kai-core-decision-brief` and `kai-core-executive-consultation` are inherited by
`director-executive-assistant` alone, so moving that agent to `kai-assistant`
hands two `kai-core-*` ids to a department and turns `--gate partition` red;
`kai-core-content-grounding` does the same when `creative-video-director` moves
to `kai-gtm`. Verified from source at review, including a check for a third case
(`kai-core-personal-agenda` is not one — `workflow-proactive-scan` keeps a core
consumer). The fix is one condition in `planPacks()`: the `kai-core-` prefix
decides the provider, evaluated before the consumer-topology heuristic.

**Ruling: the fix ships in `optional-core-contract` (milestone 2), not in
`area-taxonomy-split` (milestone 4).** This is my own ordering discipline
applied one level down, and it is required for the same four reasons the
original ordering ruling gave:

- It is **provably byte-neutral on today's tree.** `--gate partition` runs
  `namespaceErrors()` in both directions and is green, which means no core skill
  today lacks the prefix and no department today provides one — so evaluating
  the prefix first cannot move any assignment. `--check` byte-parity is the
  mechanical proof at PR time.
- It therefore lands against the **stable, shipped five-plugin set with exactly
  one variable moving**, instead of arriving inside the eight-plugin diff where
  a red gate could not tell you which change broke it.
- It **removes a class of failure, not an instance**: any future move of a
  single-consumer core agent hits the same wall.
- Milestone 4's own acceptance demands gates green *"by construction, not by
  exception"*. Without this fix, milestone 4 is red on arrival.

**Two binding constraints on it:**

- **S1 — milestone 2's acceptance gains it as a named deliverable**, and
  milestone 4 is **gated on it having landed**. This is a `Reframe` inside
  existing scope, not an addition: `scripts/lib/pack-plan.mjs` is already an
  explicit `target`, and it makes an already-required property satisfiable. It
  adds no gate, surface, step, or capability.
- **S2 — it is sequenced with, never inside, PR-2.** Milestone 2's PR order is
  **floor -> guarantee -> behaviour -> proof -> surface**; the prefix fix has
  PR-2's character (asserts a property that already holds, lands green, cannot
  regress) and must be its own commit. It must **not** ride inside PR-3, the
  one large diff that rewrites 51 agent bodies — a red `--check` there could not
  distinguish "the prefix rule re-planned the partition" from "the block swap
  changed every body." Attribution under CI is the whole reason the phase order
  exists. Sizing and release packing go to `principal-swe-manager`.

**The milestone order stands, unchanged and plainly stated:**

`decisions-locked -> optional-core-contract -> surface-rename ->
area-taxonomy-split -> migration-complete`

Nothing the architects found disturbs it. The compile defect is triggered by
**shipping** the taxonomy, not by **deciding** it, so *decide now, ship late*
still holds; the defect's fix is byte-neutral and therefore belongs early, which
is what the order already optimises for. What changed is milestone 2's
*contents* and one new dependency edge from milestone 4 to that deliverable — a
sequencing consequence, not a re-ordering.

Also confirmed at review: PR-2 of milestone 2 (`CLAIM_SKILLS` + the
`--gate partition` extension) must merge **before** PR-3 (mode selection), so no
commit ever exists in which core is optional and the claim surface is unpinned.
That is condition **C2** of the residual acceptance and is now a milestone-2
acceptance constraint, not advice.

---

### A4 — Two user-facing copy deliverables are product's, and are named so they cannot be defaulted.

Both surfaced by the architects and both correctly refused by them as product
judgment. Owner: `principal-product-manager`. Neither blocks the two completed
decision records.

1. **`standalone-block.txt` copy** — the two honest paths and the five pinned
   disclaimers, under non-negotiable #5. The architecture fixes the structure,
   the timing, the anti-nag rule, and the disclaimer set; only the sentences are
   outstanding. **Required input to milestone 2, PR-3.** The one-sentence mode
   line is not negotiable downward (condition **C1**): a user must know which
   mode produced an answer before deciding whether to trust it as recorded work.
2. **`packDescription()` copy** — it currently emits *"kai `<pack>` **department**
   pack — the `<pack>` roles, over a **required** kai-core"* into every non-core
   manifest `description`. **Both halves become false**: "department" is retired
   vocabulary and core is no longer required. **Required input to milestone 4**,
   and it is published marketplace copy, so it must not ship as a generator
   default.

Both are recorded here rather than minted as items, because
`kai/initiatives/area-plugins/` still cannot be created and the north star does
not exist. **They convert to `ready` items in the first steward pass after that
directory exists**; until then this amendment is the record that they are owed.

---

### Unchanged by this amendment

Mission and vision. All thirteen non-negotiable principles, verbatim. The scope
`targets` and `keywords`. `scope.current` remains `decisions-locked` — the
frontier does **not** advance to `optional-core-contract` until
`area-plugins-migration-architecture` is `completed`, which is the third and
last of milestone 1's typed required items and which was promoted to `ready`
this pass. Every `out_of_scope` bullet, including "adding agents or
capabilities", "adding areas beyond the settled set", and the `pack-split`
prohibition. All five `deferred` entries with their triggers — in particular
**durable state for standalone mode remains parked**, and the optional-core
record's ruling *against* an import path is endorsed rather than treated as an
oversight. All eight critical operator decision boundaries. Milestones 1, 3 and
5 in full; milestones 2 and 4 as amended above.

**Boundary #1 was tested this pass and not tripped.** The no-false-claim
guarantee does not rest on prompt text alone — two of its three mechanisms are
structural (Claim-family procedures absent from disk; workspace minting requires
a core-only skill *and* a core-only agent). The residual that remains is
accepted by the steward with conditions C1–C3, not escalated. Boundaries #3 and
#6 were tested by the taxonomy record and not reached.

---

## HANDOFF 2026-08-27-1906 — principal-product-manager (steward) -> principal-swe-architect

- did:       Ran `scope-acceptance` on both milestone-1 decision records and **approved** both, verifying the three load-bearing claims against source rather than accepting the summaries: `inherits-block.txt` genuinely carries and ships the standalone floor; the `planPacks()`-topology / `namespaceErrors()`-name seam defect is genuinely real and its two-instance enumeration is complete; the `lectoria` provider-root binding is genuinely as described, which corrected my own routed evidence from a 2->3-way to a 2->2-way split. **Ruled on the routed blast-radius residual: ACCEPTED with three binding conditions, not escalated** — boundary #1's trigger is not met, the residual is a property of settled direction #4 rather than of the design, and the failure is bounded to one session's text with no durable side effect. **Ruled on the routed `PACK_ORDER` installer question: (a) generator-derived identity strings are packaging and exempt**, and amended the acceptance line initiative-wide with a three-criterion boundary instead of granting a bare carve-out. Amended this BRIEF with A1–A4. Moved both items to `completed` at version 6 with leases cleared, and promoted `area-plugins-migration-architecture` `proposed -> ready`. Wrote no production code and touched nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `kai/initiatives/**`.
- state:     completed (this amendment; the scope-brief item remains `completed` at version 3)
- needs:     Author `area-plugins-migration-architecture` against its eight acceptance lines. Two routed inputs travel with it: (1) the `demo-narrate/SKILL.md` criterion-(ii) choice — either satisfy it with a deriving check or explicitly accept the unpinned `<kai-personal-plugin>` literals with a stated detection path; (2) the string `kai-personal` survives a fully green build in two skill bodies, which is the silent-stranding shape measure #5 targets at zero. The A1 exception governs how both are read. Route any needed change to scope, non-negotiables, or milestone boundaries back to the steward as a QUESTION.
- artifacts: kai/coordination/threads/area-plugins-scope-brief.md (this amendment); kai/coordination/items/area-plugins-optional-core-architecture.md (version 6, `completed`); kai/coordination/threads/area-plugins-optional-core-architecture.md (`REVIEW` + `DECISION 2026-08-27-1906`); kai/coordination/items/area-plugins-taxonomy-decision.md (version 6, `completed`); kai/coordination/threads/area-plugins-taxonomy-decision.md (`REVIEW` + `DECISION 2026-08-27-1906`); kai/coordination/items/area-plugins-migration-architecture.md (version 3, `ready`)
- evidence:  `scripts/lib/inherits-block.txt` (read verbatim — carries the core-absent fallback); `scripts/validate-plugin.mjs:312-314` (byte-pins it into every root agent body); `skills/kai-core-workspace-conventions/SKILL.md:29-30` ("never silent roots **for coordinated or initiative work**" — the qualifier the compressed restatement drops); `scripts/lib/pack-plan.mjs:414-419` vs `:1527-1546` (topology-vs-name seam); `agents/director-executive-assistant.agent.md:7` sole inherits site for `kai-core-decision-brief` + `kai-core-executive-consultation`; `agents/workflow-proactive-scan.agent.md:7` keeps `kai-core-personal-agenda` in core; `skills/kai-core-generate-audio/SKILL.md` binds to the kai-core provider root and forbids deriving it from a calling pack; `skills/demo-narrate/SKILL.md:113-123` resolves lectoria from its own plugin root, `:65-147` hard-codes `<kai-personal-plugin>`; `scripts/validate-plugin.mjs:860` derives the guided installer from `PACK_ORDER` × `packPluginName()` × `MARKETPLACE`. All read 2026-08-27 from `C:\src\kai`.
- questions: none blocking. Two operator items still outstanding and unchanged from 2026-08-27-1839: (1) `kai/initiatives/area-plugins/` needs one `mkdir` before the north star, `deliverables.md`, `log.md`, `backlog.md`, and the three canonical `artifact_target`s can be materialised from these packets; (2) `kai/coordination/ACTIVE.md` still reads "No initiatives are active" and cannot be corrected honestly until the north star exists. Both remain outside every touched item's `touches` and were not edited. Also for the director: `kai/coordination/BOARD.md` carries **no** `area-plugins` rows at all and needs reconciliation — it is a derived index and not mine to hand-edit.
- next:      `principal-swe-architect` — `area-plugins-migration-architecture` (`ready`, priority 30, `next_role: principal-swe-architect`, lease clear) is the last open item in milestone 1. Dispatch is `director-chief-of-staff`'s. On its completion, milestone `decisions-locked` has all three typed required items at `completed` and the steward advances `scope.current` to `optional-core-contract`.

---

## STEWARD AMENDMENT 2026-08-27-1944 — principal-product-manager (steward)

**Append-only amendment to the `BRIEF 2026-08-27-1839` packet and the
`STEWARD AMENDMENT 2026-08-27-1906` (A1–A4). Nothing above this line is
rewritten.** Where this amendment and anything above conflict, this amendment
governs and the conflict is named explicitly.

Issued at the milestone-2 promotion pass over the eight `proposed` items emitted
by `area-plugins-m2-decomposition` (PLAN 2026-08-27-1922). Five things changed:
**A5** rules the routed doctor question; **A6** carries a grounded figure
correction; **A7** accepts the milestone-2 `required_items` mapping as amended;
**A8** records the promotion and the frontier gate; **A9** resolves a drafting
ambiguity of mine that A7 depends on.

---

### A5 — The doctor. **RULING: (a) — amend the acceptance.** `optional-core-contract` does not close while the shipped product still says *"core is required, never optional."*

**Verified from source this pass, by me, not from the summary.** Both sites are
exactly where the manager said they were:

- `scripts/lib/migration-doctor.mjs:736-741` —
  `if (departments.length && !core)` emits `add('refusal', 'partial-pack-set', …)`
  with the justification *"a department pack inherits its operating contract from
  core, and core missing does not raise a host error"*, then
  `step(\`copilot plugin install ${CORE_PLUGIN}@${MARKETPLACE}   # core is required, never optional\`)`.
- `scripts/workspace-doctor.mjs:661-666` — `MIGRATION_CASES` entry
  *"department pack installed without kai-core"*, `home: 'partial-packs'`,
  **`status: 'blocked'`**, `expect: ['partial-pack-set']`,
  `steps: [/copilot plugin install kai-core@kai-plugins/]`.
- Two things I checked that neither the plan nor the item states, and that the
  ruling rests on. **(1)** `migration-doctor.mjs:869` —
  `report.status = severities.has('refusal') ? 'blocked' : …` — the status is
  *derived from severity*, and the vocabulary is exactly
  `blocked` / `unknown` / `clear`. There is no `standalone`, so "just report it
  as standalone" is not a copy edit; it is a vocabulary change, which is why the
  Spike is honest. **(2)** the self-test's step regex matches the *command*, not
  the trailing comment, so the false sentence can be removed without perturbing
  the case set. **The false assertion is separable from the ambiguity**, and that
  separation is what makes this ruling affordable.

**The ruling.** Milestone 2's acceptance **gains** the doctor reconciliation and
`area-plugins-m2-doctor-standalone` becomes `required_for_milestone: true`.

**Why (a) and not (b).** The cheaper option was on the table and I looked at it
squarely. Two things decided against it.

1. **The remediation copy is not ambiguous, it is false.** *"core is required,
   never optional"* is a flat statement about the product, and milestone 2 is the
   commit that makes it untrue. Ambiguity about *this install* (deliberate
   standalone vs. failed core) is real and is what the Spike exists for; ambiguity
   about *the product* is not — after milestone 2 there is no reading under which
   core is required. Shipping a milestone whose own diagnostic tells a user the
   opposite of what the milestone did is the exact failure mode this initiative's
   honesty non-negotiables exist to prevent, pointed inward instead of outward.
2. **The schedule argument for deferring is weaker than it looks.** WS-5 depends
   only on `mode-selection`, so it runs **in parallel with the docs item**, which
   is already required. Making it required adds one spike day, one S/L change and
   an SRE pass to a tail that exists anyway — it does not deepen the critical
   path. I was not willing to trade a shipped false statement for that.

**Bounded — this is a `Reframe` inside existing scope, not an addition.**
`scripts/lib/migration-doctor.mjs` and `scripts/workspace-doctor.mjs` are both
already explicit BRIEF `targets`. This adds no gate, surface, step, screen, field
or capability; it removes a statement the milestone itself falsifies. Same
reasoning that carried A3/S1, applied to the same kind of defect.

**Milestone 2 (`optional-core-contract`) gains one acceptance line, in two
parts:**

> **No shipped kai diagnostic asserts that `kai-core` is required, and none
> classifies an install as invalid on the sole basis of core's absence.**
> **(i) Unconditional:** `migration-doctor`'s `partial-pack-set` finding and every
> remediation step it emits state both branches truthfully — a deliberate
> core-less install is a **supported standalone install**, and a core install that
> failed is fixed by installing core. No shipped string asserts core is mandatory.
> **(ii) Default, defeasible only as stated below:** a core-absent-**only** install
> is not reported as invalid. Whether that is a downgraded severity, a new status,
> or a distinguishing signal is the Spike's and the architect's call — the
> mechanism is not mine to choose and this line does not choose it.

**Pre-decided fallback, so the Spike cannot return an open product question onto
the milestone's critical path.** If no sound host-state signal distinguishes a
deliberate standalone install from a failed core install, the steward's disposition
is already made: **the doctor reports the ambiguity truthfully rather than
resolving it against the user.** "Core absent and nothing else wrong" is, after
milestone 2, a valid install; a *failed* core install almost always leaves other
evidence that already has its own finding and its own severity — `legacy-installed`,
`coexistence`, `stale-install`, `provenance-collision`, `unreadable-metadata`,
`install-tree-unverified`, `enabled-state-unverified`, `disabled-install`. The
Spike does not need to come back to me to be allowed to proceed.

**Where the ruling stops, and whose call the rest is.**
`principal-sre` / `independent-reliability` is a required review on that item
precisely because relaxing a `blocked` verdict removes a signal. **If SRE returns
BLOCK/NOT-READY on part (ii), that verdict is theirs and I do not relabel it**:
part (i) still ships in milestone 2 (no reliability argument touches a false
sentence), and part (ii) escalates to the operator as a named residual with
`surface-rename` as its home.

**Companion line, milestone 3 (`surface-rename`).** Its existing doctor
acceptance — *"…classifying `clear` / `blocked` / `unknown` correctly through the
transition"* — is extended to name this case explicitly: **whatever status
disposition the milestone-2 Spike selects for a core-absent-only install is
carried correctly across both marketplace identities.** This is also the declared
home for part (ii) if it is deferred by the Spike or blocked by SRE. The manager's
option (b) offered milestone 5; milestone 3 already owns doctor classification
correctness and is adjacent, so the deferral distance was never five milestones.

**What stays the same, explicitly.** The `blocked` verdict for every
genuinely-broken install is untouched. `unknown` is still not a softer `clear`.
No new status is *mandated*. No generated tree, block file, gate arm, `PACKS`
entry, `hooks.json` owner or plugin identity changes. Milestone 2 still ships on
the existing five identities under the existing marketplace name. The
`.kai/manifest.json`-absent question stays inside the item as a review obligation,
not as a second milestone requirement.

---

### A6 — Figure correction: **49** non-core generated agent bodies, not 51.

**Verified independently this pass** by enumerating the committed tree:
`packs/kai-engineering/agents/` 20 · `packs/kai-gtm/agents/` 11 ·
`packs/kai-product/agents/` 9 · `packs/kai-personal/agents/` 9 ·
`packs/kai-core/agents/` 7 = **56** total, so **49** non-core. **51 is the skill
count** (`skills/*/SKILL.md`), which is where the number came from.

- **Corrected above:** A3/S2's *"PR-3, the one large diff that rewrites 51 agent
  bodies"* reads **49 agent bodies**. The ruling it supports is unchanged.
- **Carried, not rewritten:** `area-plugins-optional-core-architecture.md` uses 51
  as an agent count at `:65`, `:141`, `:197`, `:448` (its `:60` use of 51 is the
  *skill* count and is correct). That record is append-only and stays as written;
  this amendment governs the figure. Its measure-#1 framing reads
  **"core absent -> 0 of 49 usable / 49 of 49 usable"**.
- **No ruling, measure, or acceptance changes.** Measure #1's baseline states no
  count; measure #3's 56/51 is agents/skills and was already right.
  `area-plugins-m2-mode-selection` already carries 49 in its acceptance.

---

### A7 — Milestone-2 `required_items` mapping: **accepted as amended — eight entries, all typed.**

```yaml
required_items:
  - item: area-plugins-m2-planpacks-prefix    # requires: shipped
  - item: area-plugins-m2-standalone-copy     # requires: completed
  - item: area-plugins-m2-standalone-floor    # requires: shipped
  - item: area-plugins-m2-claim-surface-pin   # requires: shipped
  - item: area-plugins-m2-mode-selection      # requires: shipped
  - item: area-plugins-m2-standalone-proof    # requires: shipped
  - item: area-plugins-m2-doctor-standalone   # requires: shipped   <- added by A5
  - item: area-plugins-m2-docs-two-modes      # requires: completed
```

The doctor entry is `shipped` rather than `completed` because A5(i) necessarily
changes `scripts/lib/migration-doctor.mjs`, which `release-guard`
(`scripts/release-guard.mjs:20-30`) classifies as a behaviour path. **The item's
"nothing ships" branch is therefore closed for part (i)** and survives only for
part (ii). Milestone 4 (`area-taxonomy-split`) still gains its one new edge —
`area-plugins-m2-planpacks-prefix` at `requires: shipped`, per A3/S1; no
milestone-4 item exists yet, so that edge is **binding at mint time** and is the
first thing to check when milestone-4 items are created.

---

### A8 — Promotion and the frontier. All eight are `ready`; the code chain is gated by one typed edge; `scope.current` does **not** advance in this pass.

**`scope.current` stays `decisions-locked`.** `area-plugins-migration-architecture`
is `in-review` with `principal-sre` holding a live lease (read, not edited, this
pass). The 1906 amendment bound the frontier to that item reaching `completed`,
and I am not advancing it early because the next queue is ready — that is exactly
the convenience the gate exists to refuse.

**The gate is not ceremony, and here is the mechanical reason.** Milestone 1's own
acceptance ends with *"No production code, manifest, or marketplace change has been
made."* The moment a milestone-2 **code** item merges, that line becomes
permanently unclaimable and milestone 1 cannot close honestly. `decisions-locked`
bars production change; it does not bar knowledge work — which is why the
decomposition itself ran under it, and why the copy item may run under it too.

**Mechanism — one edge, not eight.** `area-plugins-m2-planpacks-prefix` gains
`depends_on: {item: area-plugins-migration-architecture, requires: completed}`.
Every other production-code item in the milestone is transitively downstream of it
(floor -> claim-pin -> mode-selection -> proof/doctor/docs), so a single typed edge
gates the whole chain, clears itself the moment milestone 1 closes, and needs no
steward round-trip. The manager could not have known to add it: `ACTIVE.md` still
reads "No initiatives are active", so the decomposition ran with no frontier in
view. This is stewardship's job, not a defect in the plan.

**Promotions (all eight `proposed -> ready`, `owner: null`, five lease fields
null, `version` 1 -> 2), ordered by value-to-mission:**

| priority | item | dispatch state |
|---|---|---|
| 10 | `area-plugins-m2-standalone-copy` | **executable now** |
| 20 | `area-plugins-m2-planpacks-prefix` | waits on milestone 1 (A8 edge) |
| 30 | `area-plugins-m2-standalone-floor` | waits on `planpacks-prefix` |
| 40 | `area-plugins-m2-claim-surface-pin` | waits on floor + prefix |
| 50 | `area-plugins-m2-mode-selection` | waits on C2 + copy |
| 60 | `area-plugins-m2-standalone-proof` | waits on mode-selection |
| 70 | `area-plugins-m2-doctor-standalone` | waits on mode-selection |
| 80 | `area-plugins-m2-docs-two-modes` | waits on mode-selection + proof |

`ready` is my commitment that each fits scope and is worth doing, **not** a claim
that it can run now — `kai-core-work-coordination`'s `ready` vs *executable*
distinction, with the director computing *executable* at dispatch.

**The copy item stays an item** (the manager's open question 2, answered): a typed
`depends_on` beats a prose input every time, it makes the milestone's most likely
stall visible on the board, and it is the one thing that can move today. It is
promoted ahead of `planpacks-prefix` for exactly that reason — the manager's
"dispatch both in parallel" was right in spirit and half-right in fact, because it
did not know the frontier.

**Confirmed without change from the plan:** condition **C2** is a typed
`depends_on {item: area-plugins-m2-claim-surface-pin, requires: shipped}` on
`area-plugins-m2-mode-selection` — verified in frontmatter, not prose. **D3** sits
in milestone 2 as its own item with byte-neutrality *and* gate-neutrality as two
separate acceptance lines. **C1** is carried in both the copy item's acceptance and
`mode-selection`'s. Every item is independently shippable, reversible, and carries
its own lockstep `1.0.x` (or none, with the reason stated).

---

### A9 — Drafting fix: milestone 5's `shipped` sentence governs the initiative claim, not per-item terminal state.

Milestone 5 reads *"it is the only milestone permitted to use the word `shipped`."*
Read literally against A7, milestone 2's mapping would be unsatisfiable, since six
of its items are release-bearing and `shipped` is their declared terminal state.
That sentence governs the **initiative-level** claim and the north star `status` —
no milestone before `migration-complete` may call *the initiative* shipped. It never
barred an individual release-bearing item from reaching its own `shipped` state under
`kai-core-work-coordination`, which still requires operator deployment and
verification per item. My ambiguity, fixed here rather than left for engineering to
route around.

---

### Unchanged by this amendment

Mission and vision. All thirteen non-negotiable principles, verbatim. Scope
`targets`, `keywords`, every `out_of_scope` bullet, all five `deferred` entries
with their triggers — **durable state for standalone mode remains parked**. All
eight critical operator decision boundaries; none was tripped this pass. A1, A2,
A3 (including S1 and S2) and A4 stand as written except for the one figure
corrected in A6. Milestone order stands:
`decisions-locked -> optional-core-contract -> surface-rename ->
area-taxonomy-split -> migration-complete`. Milestones 1, 4 and 5 unchanged;
milestone 2 as amended by A5; milestone 3 as extended by A5's companion line.

---

## HANDOFF 2026-08-27-1944 — principal-product-manager (steward) -> director-chief-of-staff

- did:       Steward promotion pass over the eight `proposed` milestone-2 items. **Promoted all eight `proposed -> ready`** (`owner: null`, all five lease fields null, `version` 1 -> 2, steward priorities 10–80, dated promotion section appended to each). **Ruled the routed doctor question (a) — amended the milestone-2 acceptance and set `area-plugins-m2-doctor-standalone` `required_for_milestone: true`**, bounded to the contradiction, with the Spike's fallback pre-decided so it cannot bounce back, and with `principal-sre`'s reliability verdict left explicitly un-relabelable. **Verified the plan against my own brief:** C2 is a typed `depends_on … requires: shipped`, not prose; D3 is its own milestone-2 item with byte- *and* gate-neutrality as separate acceptance lines; C1 is carried in both the copy and mode-selection items; every item is independently shippable with its own lockstep `1.0.x`. **Added one typed frontier edge** (`planpacks-prefix -> area-plugins-migration-architecture requires: completed`) so no milestone-2 code merges while milestone 1's "no production code has been made" acceptance line is still live. Confirmed the **49** non-core agent-body figure by counting the committed tree. Wrote no production code and modified nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, `kai/initiatives/**`, or the parallel sibling's records.
- state:     completed (this amendment; the scope-brief item remains `completed` at version 3)
- needs:     Dispatch. **`area-plugins-m2-standalone-copy` is the only executable item** (`ready`, priority 10, `next_role: principal-product-manager`, no unmet dependency). Everything else is `ready` and waiting on a declared dependency; the code chain unblocks itself the moment `area-plugins-migration-architecture` reaches `completed`, with no steward round-trip. `kai/coordination/BOARD.md` still carries **no** `area-plugins` rows and needs reconciliation — derived index, not mine to hand-edit.
- artifacts: kai/coordination/threads/area-plugins-scope-brief.md (this amendment, A5–A9); eight items at `kai/coordination/items/area-plugins-m2-*.md` (each `ready`, version 2); kai/coordination/items/area-plugins-m2-decomposition.md (version 4, steward close note, `next_role: director-chief-of-staff`); kai/coordination/threads/area-plugins-m2-decomposition.md (STEWARD RULING 2026-08-27-1944).
- evidence:  Read this session from `C:\src\kai`. `scripts/lib/migration-doctor.mjs:736-741` (the `refusal`-severity `partial-pack-set` finding and the `# core is required, never optional` remediation step, both read verbatim), `:52-54` (`CORE_PLUGIN` / `DEPARTMENT_PLUGINS` derived from the partition), `:869` (`finish()` — `refusal -> blocked`; the status vocabulary is `blocked`/`unknown`/`clear` with no `standalone`, which is what makes WS-5 a vocabulary change rather than a copy edit); `scripts/workspace-doctor.mjs:661-666` (`MIGRATION_CASES` pinning `status: 'blocked'`, and its `steps` regex matching the command rather than the trailing comment — the separability the A5 bound rests on), `:640-700` (the surrounding case set, showing the other broken-install findings that survive the fallback). `packs/*/agents/*.agent.md` enumerated: 20+11+9+9+7 = 56, non-core **49**. Item frontmatter verified directly for C2, C1, D3, sizes, releases and lease state. `kai/coordination/items/area-plugins-migration-architecture.md` read read-only: `in-review`, lease held by `principal-sre` (`apx-mig-sre-20260827-1930-f1`, expires 2026-08-27-2230) — not edited.
- questions: none blocking. Two operator items unchanged and still outstanding: (1) `kai/initiatives/area-plugins/` needs one `mkdir` before the north star, `backlog.md`, `log.md`, `deliverables.md` and the canonical `artifact_target`s can exist — until then these threads are the durable record; (2) `kai/coordination/ACTIVE.md` still reads "No initiatives are active" and cannot be corrected honestly until the north star exists, which is also why `scope.current` lives only in these packets.
- next:      `director-chief-of-staff` — dispatch `area-plugins-m2-standalone-copy` to `principal-product-manager` now. On `area-plugins-migration-architecture` reaching `completed`, the steward advances `scope.current` to `optional-core-contract` in a one-line pass, which clears the A8 edge and makes `area-plugins-m2-planpacks-prefix` the first implementation dispatch.

---

## STEWARD AMENDMENT 2026-08-27-2113 — principal-product-manager (steward)

**Append-only amendment to the `BRIEF 2026-08-27-1839` packet and amendments
A1–A9. Nothing above this line is rewritten.** Where this amendment and anything
above conflict, this amendment governs and the conflict is named explicitly.

Issued on the operator's **mandatory second revision** (eleven points, delivered
2026-08-27-2113), which directs that implementation must not proceed and that
the round-1 taxonomy must not be locked until it resolves. Seven things change:
**A10** admits the nine P0 concerns and **splits the initiative**; **A11**
re-ranks the milestones and adds a milestone 0; **A12** rules on the six gated
milestone-2 items; **A13** records round 1 as superseded-pending; **A14** places
the README work; **A15** parks fleet-observer UX and fences the distributed-agents
proposal; **A16** lists what was created and what is unchanged.

---

### A10 — The nine P0 concerns are admitted as top priority. **RULING: the initiative SPLITS. Four of the nine leave.**

The operator invited the honest answer, so here it is: **`area-plugins` is now
too big, and I am splitting it rather than letting it become the thing point 7
complains about.** An initiative that never closes is not a stretch goal, it is
an unbounded corpus that makes every other initiative harder to see. I will not
absorb nine P0s into a five-milestone initiative that is already stalled at
milestone 1 behind a fourth reliability review.

**The split line is a target line, not a taste line.** `area-plugins` targets
`plugin.json`, `PACKS`/`PACK_ORDER`/`PACKS_DIR`/`MARKETPLACE`, the generated
tree, the marketplace, and the install surface. Four of the nine P0s touch none
of those. They touch `skills/kai-core-workspace-conventions`,
`kai-core-work-coordination`, `kai-core-initiative-stewardship`,
`kai-core-workspace-onboarding`, and `kai/coordination/**` — the **workspace
corpus contract**, which is a different product with a different failure mode
(silent, accumulating dishonesty about state) than plugin packaging.

| # | operator concern | disposition | home |
|---|---|---|---|
| 1 | `kai-directors` plugin; routers out of core/assistant; clearer names | **IN** — taxonomy | `area-plugins` · `area-plugins-taxonomy-round-2` (in flight) |
| 2 | Separate `kai-project-management` plugin | **IN** — taxonomy | `area-plugins` · `area-plugins-taxonomy-round-2` (in flight) |
| 3 | Second-round full taxonomy review, P0 vs LATER classification | **IN** — taxonomy | `area-plugins` · `area-plugins-taxonomy-round-2` (in flight) |
| 4 | Tool-allowlist host defect (`Unknown tool name…`) | **IN** — new **milestone 0** | `area-plugins` · `area-plugins-tool-allowlist-fix` (**`ready`**) |
| 5 | README / install clarity against the FINAL taxonomy | **IN** — milestone 5 | `area-plugins` · `area-plugins-readme-clarity` (`proposed`) |
| 6 | Workspace corpus opt-out (tracked / local / hybrid) | **OUT** — splits | `workspace-corpus-contract` · `area-plugins-workspace-storage-modes` |
| 7 | Initiative lifecycle: close, complete, **archive** | **OUT** — splits | `workspace-corpus-contract` · `area-plugins-initiative-archive` |
| 8 | Exactly one workspace + one initiative backlog destination | **OUT** — splits | `workspace-corpus-contract` · `area-plugins-backlog-contract` |
| 9 | Canonical design/mock paths | **OUT** — splits | `workspace-corpus-contract` · `area-plugins-design-output-contract` |
| 10 | Fleet-observer UX redesign | **DEFERRED** with trigger | unaffiliated · `area-plugins-fleet-observer-ux` (`proposed`) |
| 11 | Distributed multi-PC agent communication | **OUT of delivery scope**, proposal only | already routed · `area-plugins-distributed-agents-proposal` |

**The second initiative: `workspace-corpus-contract`, status `proposed`.**

- **mission:** Make the kai workspace corpus bounded, opt-out-able, and honest —
  one place for every kind of record, a real close-and-archive path, and a
  storage choice the operator makes rather than inherits.
- **why it is one initiative and not four items:** all four P0s are the same
  defect wearing four hats — *kai documents conventions it does not enforce and
  does not let you decline.* They share targets
  (`skills/kai-core-workspace-conventions/SKILL.md`,
  `scripts/workspace-doctor.mjs`), they share one success measure (a doctor run
  can prove the corpus matches the operator's declared intent), and fixing any
  one without the others leaves the pattern intact.
- **why it is not part of `area-plugins`:** exactly one target overlaps —
  `scripts/workspace-doctor.mjs`, which `area-plugins` touches for
  `--migration-check` and which this initiative touches for corpus verification.
  One shared file is a sequencing note, not a merger argument. It is recorded as
  a **cross-initiative collision** in A16.
- **it needs an operator go.** Starting a second initiative is an operator
  decision, not a steward one. Its four items are created `proposed` with
  `owner: null` and cleared leases; **none is promoted to `ready` and none is
  dispatchable** until the operator authorizes the initiative. The three
  contracts in their threads are authored now so that the decision the operator
  makes is *"do we do this work"*, not *"what is this work."*

**Honest limit, stated rather than worked around.** No agent in this session has
a shell, so `kai/initiatives/workspace-corpus-contract/` cannot be created any
more than `kai/initiatives/area-plugins/` could. Its north star is owed on the
same terms as this one's: the scope above and the three contracts below are the
durable record until one operator `mkdir` runs. Work items are flat in
`kai/coordination/items/` by design and are fully legal without the directory.

**Two `out_of_scope` bullets are amended by operator direction, and the new
boundary is stated so the amendment cannot be read as an open door.**

The second revision directly contradicts two bullets in the original BRIEF:
*"Adding areas beyond the settled set (`core`, `engineering`, `product`, `gtm`,
`learning`, `assistant`, `wellness`) once the taxonomy locks"* and *"Changing
membership of `kai-engineering`, `kai-product`, or `kai-gtm`. Only `kai-personal`
dissolves, and only `director-executive-assistant` leaves `core`."* A proposed
`kai-directors` plugin, a proposed `kai-project-management` plugin, and
`director-chief-of-staff` leaving core each violate one or both. The operator is
the escalation path those bullets exist to reach, and the operator has decided.

> **Amended boundary.** The area set is **reopened for the duration of
> `area-plugins-taxonomy-round-2` and closes at its `scope-acceptance`.** While
> open, a new area is admissible only if the round-2 record justifies it against
> the one-sentence job test and accounts for every agent and skill it moves.
> After that acceptance the set is closed again on the original terms: adding an
> area, or changing the membership of a settled one, is out of scope and
> requires a fresh operator decision. **Critical operator decision boundary #3 is
> suspended for the same window** — `creative-video-director`'s placement may be
> resolved inside round 2 without a separate escalation, and re-arms on
> acceptance.

Non-negotiables #1, #2 and #3 are untouched by this: "areas" is still product
language only, there is still exactly one marketplace named `kai`, no plugin is
named `kai`, and every successor area still owes a one-sentence job with no
structural "and". A `kai-directors` that cannot pass the one-sentence test is not
saved by being operator-suggested — that finding goes back to the operator, it
does not get waved through.

---

### A11 — Milestone re-ranking. A new **milestone 0** carries the allowlist fix; the README is planned against the final taxonomy.

**New order, stated explicitly:**

```text
allowlist-repair -> decisions-locked -> optional-core-contract ->
surface-rename -> area-taxonomy-split -> migration-complete
```

**`scope.current` becomes `allowlist-repair` + `decisions-locked` — two
frontiers, and here is why that is not a loosening.** The rule is a tight
classification surface, not a count of one. These two share **no target file, no
decision, and no artifact**: `decisions-locked` is entirely knowledge work
producing records; `allowlist-repair` is entirely a frontmatter-schema repair in
agent bodies and their generated mirrors. Nothing in either can be justified by
the other, which is the property the gate actually protects. They advance
independently and close independently.

---

**0. `allowlist-repair`** *(new, first, independently shippable)*

- **outcome:** Every kai agent declares only tool names the Copilot CLI custom-
  agent schema actually accepts, the repeated `Unknown tool name in the tool
  allowlist` runtime warnings are gone, and the committed generated trees are
  regenerated so `pack-preview --check` byte parity holds.
- **acceptance:**
  - The **current** schema is established from live evidence — the running host
    and current Copilot CLI documentation — and cited in the record, not
    remembered. A parallel `research` consultation is producing it.
  - **Every** invalid declaration is located across **all 56** root
    `agents/*.agent.md` and their **56** generated mirrors under `packs/*/agents/`;
    the enumeration is complete and shown, not sampled.
  - The replacement is **portable**: it does not silently remove a capability an
    agent needs, and where a rejected name has no accepted equivalent the record
    says so rather than dropping the capability quietly.
  - Generated trees are regenerated; `pack-preview --check` byte parity holds;
    `--gate partition`, `--gate collision`, `--gate partial-install`, and
    `--gate version-skew` are green.
  - The warnings are **reported gone** against a stated observation method. No
    agent in this session can execute anything, so a claim of absence made
    without a run is `reported`, not `observed`, and must be labelled that way.
  - **Topology-neutral:** the change alters no `PACKS`, `PACK_ORDER`, `PACKS_DIR`,
    `MARKETPLACE`, `SKILL_OWNER_OVERRIDES`, plugin identity, marketplace name, or
    preflight/degraded/inherits block content.
- **serves:** none of the five success measures. **Stated plainly:** this
  milestone does not advance the mission. It is here because it is a live defect
  in shipped agents and because it collides head-on with milestone 2's PR-3 — the
  one large diff that rewrites 49 non-core agent bodies. Two unrelated whole-fleet
  rewrites must not be in flight at once; sequencing them is a steward call and
  this is it.

**Bounded carve-out to milestone 1's acceptance line, because A8 made it
load-bearing.** Milestone 1 ends with *"No production code, manifest, or
marketplace change has been made,"* and A8 correctly noted that the first
milestone-2 code merge makes that line permanently unclaimable. `allowlist-repair`
is production code. Rather than let a defect fix quietly falsify a milestone or
route around its own steward, the line is amended:

> **No production code, manifest, or marketplace change has been made *that
> implements or presupposes the area topology*.** A change is exempt **iff** it
> (i) is topology-neutral as defined in milestone 0's acceptance; **and** (ii)
> alters no `scripts/lib/preflight-block.txt`, `degraded-block.txt`, or
> `inherits-block.txt` content; **and** (iii) is proven green under the existing
> gates with `--check` byte parity re-established. Every other production change
> remains barred until `decisions-locked` closes. **A change that cannot claim all
> three clauses is not exempt — it escalates to the steward.**

The line's purpose was always to stop *topology implementation* from racing
*topology decisions*. A frontmatter-schema repair races nothing. Milestone 0 is
the only change currently claiming the exemption, and its PR must name the three
clauses.

**Milestone 1 `decisions-locked` gains one typed required item.**
`area-plugins-taxonomy-round-2` is `required_for_milestone: true` and the
milestone's acceptance line for the taxonomy now reads against **round 2**, not
round 1 (see A13). Milestone 1 therefore requires: `area-plugins-scope-brief`
(`completed` ✓), `area-plugins-optional-core-architecture` (`completed` ✓),
`area-plugins-taxonomy-decision` (`completed` ✓, **superseded-pending**),
`area-plugins-migration-architecture` (`in-review`), and
`area-plugins-taxonomy-round-2` (`ready`, in flight).

**Milestone 5 `migration-complete` gains `area-plugins-readme-clarity`** — see A14.

Milestones 2, 3 and 4 keep their outcomes and acceptance exactly as amended by
A1–A9. Milestone 4 additionally inherits the A7 mint-time edge
(`area-plugins-m2-planpacks-prefix` at `requires: shipped`) and must now be minted
against the **round-2** taxonomy.

---

### A12 — The six gated milestone-2 items. **RULING: five stay `ready` behind one new typed edge; one is unaffected. Nothing is dropped, nothing is re-decided.**

The question put to me is real and I checked it item by item rather than
answering it as a block. The round-2 taxonomy changes *which plugins exist*,
which changes *which agents are non-core*, which is an input to `CLAIM_SKILLS`
and to `planPacks()`. So: does that invalidate the six gated items?

**It invalidates one, and only one — and it is load-bearing.**

| item | affected by round 2? | ruling |
|---|---|---|
| `m2-planpacks-prefix` | **No** — and it is *strengthened*. The fix is "the `kai-core-` prefix decides the provider, evaluated before the consumer-topology heuristic." That rule is about a prefix, not about a department set. Every new plugin that takes a single-consumer core agent hits the same wall the rule removes; `kai-directors` taking `director-chief-of-staff` is the third instance of exactly the failure A3 enumerated two of. | **stays `ready`**, unchanged, still the chain head |
| `m2-standalone-floor` | **In applicability, not in definition.** The floor is what an agent may do without core; that is a per-agent contract, and the set of agents it applies to is generated from `PACKS` at build time. Round 2 moves names in that set; it does not change the floor. | **stays `ready`**, unchanged |
| `m2-claim-surface-pin` | **YES — this is the collision.** Its design asserts every `CLAIM_SKILLS` member is provided by `core` and by **no** area. A `kai-directors` plugin is a front-door **router**: routing work means taking leases, writing handoffs, and moving items — i.e. the claim surface itself. Either `kai-directors` carries coordination skills (the pin breaks) or it cannot route without core (non-negotiable #4's promise is materially different for that plugin than for the others). That is not a detail the pin can absorb after the fact. | **stays `ready`, gains one typed edge on `area-plugins-taxonomy-round-2 requires: completed`** |
| `m2-mode-selection` | Transitively — it already depends on `claim-surface-pin` at `requires: shipped` (condition C2). | gated by the edge above; no new edge |
| `m2-standalone-proof` | In its **arm set** (which plugins get materialised), not its design. | gated transitively; no new edge |
| `m2-doctor-standalone` | **No.** `migration-doctor`'s `CORE_PLUGIN` and `DEPARTMENT_PLUGINS` are derived from the partition (`scripts/lib/migration-doctor.mjs:52-54`), so the code is partition-agnostic; A5's ruling is about a false sentence, which is false under any taxonomy. | gated transitively; no new edge |
| `m2-docs-two-modes` | In **content** (it enumerates plugins), not design. | gated transitively; no new edge |

**Mechanism — one edge, again, not six.** `area-plugins-m2-claim-surface-pin`
gains `depends_on: {item: area-plugins-taxonomy-round-2, requires: completed}`.
Everything downstream of it (mode-selection at C2, then proof, doctor, docs) is
already transitively gated, and `planpacks-prefix` and `standalone-floor` stay
free above it. This costs the initiative nothing: the whole chain is *already*
blocked on `area-plugins-migration-architecture` reaching `completed` via the A8
edge, and round 2 is running in parallel with that review. The new edge changes
what must be true, not how long the queue is.

**`ready` is not withdrawn, and that is deliberate.** `ready` is my commitment
that an item fits scope and is worth doing — not that it can run now. All six
still fit scope and are still worth doing. Downgrading them to `proposed` or
`blocked` would discard eight items of accepted decomposition to express a
sequencing fact that a typed edge expresses exactly. `blocked` in particular is
wrong: it is for a stalled item with a `resume_state`, not for a queue behaving
correctly.

**Two questions routed to `area-plugins-taxonomy-round-2` as binding scope
constraints, not suggestions.** They are mine to route and not mine to answer:

1. **Can a front-door router operate standalone at all?** If `kai-directors`
   exists, its agents are non-core and therefore owe the standalone floor. A
   router with no coordination has nothing to route. The record must state, for
   each proposed router plugin, whether its standalone path is *useful* or merely
   *honest* — and if it is merely honest, say so in the plugin's one-sentence job
   rather than shipping a plugin whose standalone mode is an apology.
2. **Where does the claim surface live once routers leave core?** The record must
   place every `CLAIM_SKILLS` member and every `kai-core-*` skill in exactly one
   plugin and state whether the `provided by core and by no area` invariant
   survives. If it cannot survive, that is **critical operator decision boundary
   #1** (honesty cannot be mechanised) and it escalates — it does not get
   softened inside an architecture record.

---

### A13 — The round-1 taxonomy is **SUPERSEDED-PENDING**. Not locked, not implemented, not deleted.

Per operator direction. The precise state, so no one has to guess:

- `area-plugins-taxonomy-decision` remains `completed` at its recorded version.
  That is a true statement about the record: it was authored, reviewed, and
  accepted. **`completed` was never a licence to implement** — implementation is
  milestone 4, which has not started and has no items.
- **Its content is superseded-pending**: `area-plugins-taxonomy-round-2` will
  either supersede it in whole or in part. Until round 2 reaches
  `scope-acceptance`, **no milestone-4 item may be minted against round 1, no
  `PACKS` or `SKILL_OWNER_OVERRIDES` edit may cite it, and no plugin identity may
  be created from it.**
- **It is not rewritten and not withdrawn.** Its evidence — the `planPacks()`/
  `namespaceErrors()` seam defect, the `lectoria` provider-root binding, the
  `hooks.json` owner analysis — is grounded work that round 2 consumes as input.
  Superseding a decision is not the same as discovering it was wrong, and the
  record stays readable as written.
- Milestone 1 does not close until round 2 is `completed`. Milestone 1's taxonomy
  acceptance line now reads against round 2.

---

### A14 — README / install clarity: milestone 5, drafted early, merged late.

The operator's constraint is *plan it against the FINAL taxonomy rather than
adding transitional confusion*, and that resolves the placement cleanly. The
README is the **install surface**: it tells a person what kai is, what to
install, and what `<plugin>@<marketplace>` to type. Every one of those facts is
falsified by milestones 3 and 4 while they are in flight. A README rewritten at
milestone 2 would be wrong twice before it was right once.

`area-plugins-readme-clarity` is created `proposed` in milestone
`migration-complete`, with `depends_on: {area-plugins-taxonomy-round-2, requires:
completed}` so it can be **drafted** as soon as the taxonomy is decided, and a
binding acceptance line that it **must not merge before the new identities are
published** (milestone 4). Same *decide early, ship late* discipline the ordering
ruling already applies to the taxonomy itself. Its required content is fixed by
the operator's point 5 and carried in the item: concept, install surface,
marketplace syntax, standalone vs coordinated modes, and the plugin taxonomy —
all five simple and truthful.

Its mint-time edge onto milestone 4 is **binding at mint time** exactly as A7's
edge is: no milestone-4 item exists yet, so this is the second thing to check
when milestone-4 items are created.

---

### A15 — Fleet-observer UX is deferred with a trigger. Distributed agents is fenced out of delivery scope.

**Fleet-observer UX (#10)** joins `deferred` as a sixth entry, with the trigger
the operator gave:

> **Fleet-observer UX redesign.** Revisit when the nine P0 concerns are disposed
> *and* the plugin topology is locked (round-2 taxonomy accepted). Ground: no
> fleet-observer initiative or item exists anywhere in the corpus today —
> `area-plugins-fleet-observer-ux` is created `proposed` and unaffiliated as its
> intake record so the operator's "resumes" has something to resume. It is a
> product-surface redesign, so it belongs to neither `area-plugins` (packaging)
> nor `workspace-corpus-contract` (corpus governance); forcing it into either
> would be the catch-all move non-negotiable #3 forbids.

**Distributed multi-PC agent communication (#11)** is recorded in `out_of_scope`
as a new bullet:

> - **Distributed multi-PC agent communication.** Already routed to
>   `principal-security` as `area-plugins-distributed-agents-proposal` and
>   **proposal-only**. Its output is a security assessment, not a delivery
>   commitment. Nothing it proposes enters `area-plugins` delivery scope without
>   a fresh operator decision, and no `area-plugins` milestone may depend on it.
>   It is not duplicated here.

---

### A16 — What was created, what was edited, and what is unchanged.

**Created this pass — seven `proposed` items, one promoted.**

| item | initiative | milestone | state | priority | next role |
|---|---|---|---|---|---|
| `area-plugins-tool-allowlist-fix` | area-plugins | `allowlist-repair` | **`ready`** | 1 | `principal-swe-infra` |
| `area-plugins-readme-clarity` | area-plugins | `migration-complete` | `proposed` | 90 | `principal-technical-writer` |
| `area-plugins-initiative-archive` | workspace-corpus-contract | `corpus-honesty` | `proposed` | 10 | `principal-swe-infra` |
| `area-plugins-backlog-contract` | workspace-corpus-contract | `corpus-honesty` | `proposed` | 20 | `principal-swe-infra` |
| `area-plugins-design-output-contract` | workspace-corpus-contract | `corpus-honesty` | `proposed` | 30 | `principal-swe-infra` |
| `area-plugins-workspace-storage-modes` | workspace-corpus-contract | `corpus-honesty` | `proposed` | 40 | `principal-swe-infra` |
| `area-plugins-fleet-observer-ux` | *(none)* | — | `proposed` | 900 | `principal-product-manager` |

**On the `area-plugins-` ID prefix for the four items that leave.** The operator
named these seven IDs explicitly and I kept them verbatim, including on the four
that now belong to `workspace-corpus-contract`. An item ID is a stable
identifier; **membership is the `initiative:` field, not the prefix.** Renaming
IDs the operator wrote would break every cross-reference in this revision to save
a cosmetic inconsistency. Each of the four records the provenance line explicitly
so nobody reads the prefix as a scope claim.

**Only one existing item was edited:** `area-plugins-m2-claim-surface-pin`
(version 2 -> 3) gained the single A12 typed edge. No other item record was
touched. `area-plugins-taxonomy-round-2`,
`area-plugins-distributed-agents-proposal`, and
`area-plugins-migration-architecture` all hold live leases and were **read only**.

**Cross-initiative collision, declared rather than discovered later.**
`scripts/workspace-doctor.mjs` is a target of both initiatives — `area-plugins`
for `--migration-check` (milestones 2, 3 and 5, per A5) and
`workspace-corpus-contract` for corpus verification (all four items). It is
declared in the `touches` of both sides. Whichever lands second reconciles; if
they need to run concurrently, sequencing goes to `principal-swe-manager`, not to
a merge of the two initiatives.

**Within `workspace-corpus-contract`, all four items overlap on
`skills/kai-core-workspace-conventions/SKILL.md` and three of four on
`scripts/workspace-doctor.mjs`.** They carry accurate `touches` and **no
artificial typed edges** — their three contracts are already authored, so none
waits on another's *decision*, only on the director's collision check at
dispatch. Serializing them with fake dependencies would misreport why they wait.

### Unchanged by this amendment

Mission and vision. All thirteen non-negotiable principles, verbatim — including
#1 ("areas" is product language only), #2 (one marketplace named `kai`, no plugin
named `kai`), #3 (no catch-all; the one-sentence job test), #4 and #6
(fail-closed relaxed for loading, never for claims), #11 (root `agents/` and
`skills/` are the single source of truth; plugin trees are generated), and #13
(`pack-split` is closed and unmodified). Scope `targets` and `keywords`. Every
`out_of_scope` bullet except the two amended in A10, plus the new bullet in A15.
All five original `deferred` entries with their triggers — **durable state for
standalone mode remains parked** — plus the sixth added in A15. All five success
measures with their grounded baselines: measure #3's target already reads
"gates green by construction **at the new plugin count**" and needs no edit for a
larger area set. All eight critical operator decision boundaries, with #3
suspended only for the round-2 window per A10. A1–A9 stand as written. Milestones
2, 3 and 4 stand as amended by A1–A9; milestone 1 gains one required item and the
bounded carve-out in A11; milestone 5 gains the README item in A14.

**No production code, manifest, marketplace, script, skill, or agent body was
modified in this pass.** `kai/initiatives/pack-split/**` was **read** for the
archive contract's grounding and **not written**.

---

## HANDOFF 2026-08-27-2113 — principal-product-manager (steward) -> director-chief-of-staff

- did:       Steward scope revision on the operator's mandatory second revision. **Split the initiative** — admitted all nine P0 concerns, kept five in `area-plugins` (taxonomy round 2, the allowlist defect, README clarity) and moved four (#6–#9) into a new `proposed` initiative `workspace-corpus-contract`, with the split line drawn on target sets rather than taste and exactly one overlapping target declared. **Re-ranked the milestones**: added milestone 0 `allowlist-repair` first and independently shippable, set `scope.current` to the two non-overlapping frontiers `allowlist-repair` + `decisions-locked`, and amended milestone 1's "no production code" line with a three-clause topology-neutral carve-out so a defect fix cannot silently falsify a milestone. **Ruled the six gated milestone-2 items**: checked each against round 2 individually, found exactly one real collision (`claim-surface-pin`'s `CLAIM_SKILLS` core-only invariant vs. a router plugin that needs the claim surface to route), added one typed edge, kept all six `ready`, dropped nothing, and routed two binding questions into round 2. Recorded round 1 as **superseded-pending** with an explicit ban on minting milestone-4 work against it. **Created seven items** (one promoted `ready`) and **authored three enforceable contracts** — initiative archive, backlog, design output — each grounded in verified current-state evidence, plus the product requirement and honesty constraint for storage modes with the mechanism routed to infra. Wrote no production code and modified nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `kai/initiatives/pack-split/`.
- state:     completed (this amendment; the scope-brief item remains `completed` at version 3)
- needs:     Two operator decisions and one dispatch. **(1) Dispatch `area-plugins-tool-allowlist-fix` to `principal-swe-infra`** — it is `ready`, priority 1, has no unmet dependency, and is the only newly executable item; it must land before milestone 2's PR-3 agent-body rewrite. **(2) Operator go/no-go on the `workspace-corpus-contract` split**; its four items stay `proposed` and undispatchable until then. **(3)** `kai/coordination/BOARD.md` needs reconciliation for seven new rows, one changed row, and the two in-flight rows created at 2115 — derived index, not mine to hand-edit.
- artifacts: kai/coordination/threads/area-plugins-scope-brief.md (this amendment, A10–A16); kai/coordination/items/area-plugins-tool-allowlist-fix.md (`ready`, v1) + thread; kai/coordination/items/area-plugins-readme-clarity.md (`proposed`, v1) + thread; kai/coordination/items/area-plugins-initiative-archive.md (`proposed`, v1) + thread (**ARCHIVE CONTRACT**); kai/coordination/items/area-plugins-backlog-contract.md (`proposed`, v1) + thread (**BACKLOG CONTRACT**); kai/coordination/items/area-plugins-design-output-contract.md (`proposed`, v1) + thread (**DESIGN-OUTPUT CONTRACT**); kai/coordination/items/area-plugins-workspace-storage-modes.md (`proposed`, v1) + thread (**PRODUCT REQUIREMENT + HONESTY CONSTRAINT**); kai/coordination/items/area-plugins-fleet-observer-ux.md (`proposed`, v1) + thread; kai/coordination/items/area-plugins-m2-claim-surface-pin.md (v2 -> v3, one typed edge); kai/coordination/ACTIVE.md; kai/initiatives/INDEX.md; kai/coordination/threads/area-plugins-taxonomy-decision.md (supersession note).
- evidence:  All read this session from `C:\src\kai`. **Archive contract:** 23 `pack-split-*` records in `kai/coordination/items/` (38 non-README total, 61%), 23 in `kai/coordination/threads/` (36 non-README, 64%), 23 rows in `kai/coordination/BOARD.md:20-42` (36 rows, 64%) — all belonging to an initiative that is `shipped` and already absent from `ACTIVE.md`; `kai/initiatives/pack-split/backlog.md` holds 13 parked proposals across 6 dated sections with no closure disposition; `archived` is named at `skills/kai-core-initiative-stewardship/SKILL.md:59,130` and `kai/initiatives/README.md:69` but defined nowhere. **Backlog contract:** `kai/coordination/backlog.md` exists and is empty ("Nothing parked yet"); `kai/initiatives/pack-split/backlog.md` holds the 13; `kai-core-workspace-conventions/SKILL.md:466,497-498` already sets `proposal_channel` and the routing rule; a `TODOs?\.md|TODO list|todo file` grep across `agents/` and `skills/` returned **zero** matches and no stray TODO/tasks/NOTES file exists in the tree — the invention is emergent, not instructed. **Design-output contract:** `skills/ui-mockup/SKILL.md:135-167` already defines both mockup paths; `kai-core-workspace-conventions/SKILL.md:320,338` mirrors them; `principal-product-designer.agent.md:66` and `principal-brand-designer.agent.md:153,157` already follow them; `kai/library/README.md:32-42` lists 11 library types and **none is design**, so an unaffiliated durable design has no canonical home; `.gitignore` ignores binaries under `kai/library/**` but **not** under `kai/initiatives/**`. **Storage modes:** `corpus_visibility` already exists end to end — `scripts/workspace-doctor.mjs:140-142,386-415` (14 references incl. tracked-file drift detection and self-tests), `kai-core-workspace-conventions/SKILL.md:151,164,541-544`, `kai-core-workspace-onboarding/SKILL.md:301-330,467-490`, `workflow-workspace-init.agent.md:51,77,94,147,184`; `.kai/manifest.json` records `"corpus_visibility": "committed"`; onboarding step 4 **infers `committed` without asking whenever the remote is private**; `workspace-doctor.mjs:406` remediates a mode switch with `git rm --cached`. **Allowlist defect:** all 56 root `agents/*.agent.md` carry a `tools:` line and all 56 generated mirrors under `packs/*/agents/` carry the same, so the touch set is 112 files bound by `--check` byte parity; `"create"`, `"edit"`, `"grep"`, `"view"`, `"glob"` all appear in those declarations. **Milestone-2 ruling:** `scripts/lib/migration-doctor.mjs:52-54` derives `CORE_PLUGIN`/`DEPARTMENT_PLUGINS` from the partition. Item frontmatter read directly for lease state before the single edit.
- questions: none blocking the dispatch. Three outstanding for the operator: **(1)** go/no-go on the `workspace-corpus-contract` split — four `proposed` items wait on it; **(2)** `kai/initiatives/area-plugins/` and now `kai/initiatives/workspace-corpus-contract/` each need one `mkdir` before their north stars, `backlog.md`, `log.md`, `deliverables.md` and canonical `artifact_target`s can exist — until then these threads are the durable record; **(3)** the allowlist fix's "warnings are gone" acceptance cannot be `observed` by any agent in this session and will be `reported` until someone with a shell runs the host.
- next:      `director-chief-of-staff` — dispatch `area-plugins-tool-allowlist-fix` to `principal-swe-infra` (priority 1, no unmet dependency, must precede milestone 2 PR-3), reconcile `BOARD.md`, and put the split decision to the operator. On `area-plugins-taxonomy-round-2` reaching `completed`, the steward runs a promotion pass: closes the reopened area-set boundary, clears the A12 edge, rules on round 1's final supersession, and mints milestone-4 items against round 2 with both mint-time edges (`m2-planpacks-prefix requires: shipped`, and the README's no-merge-before-publish constraint).

---

## STEWARD AMENDMENT 2026-08-27-2138 — principal-product-manager (steward)

**Append-only amendment to the `BRIEF 2026-08-27-1839` packet and amendments
A1–A16. Nothing above this line is rewritten.** Where this amendment and
anything above conflict, this amendment governs and the conflict is named
explicitly. Issued on the `scope-acceptance` of
`area-plugins-taxonomy-round-2` (`REVIEW 2026-08-27-2138`, verdict
`approved-with-conditions`).

**Environment limit, restated:** no shell in this session, so
`kai/initiatives/area-plugins/` still cannot be created. This thread remains the
durable record. Every mechanical claim below was derived by **reading source**
and is `reported`, never `observed`.

---

### A17 — The round-2 taxonomy is the final position. Seven plugins. The area set is CLOSED.

**Locked:**

```text
kai-core        7 agents · 24 skills   (DEA returns to core — the one move)
kai-engineering 20 agents · 15 skills
kai-product      9 agents ·  3 skills
kai-gtm         12 agents ·  7 skills
kai-learning     4 agents ·  1 skill
kai-assistant    2 agents ·  1 skill
kai-wellness     2 agents ·  0 skills
                ─────────────────────
                56 agents · 51 skills · 7 published identities
```

**`kai-directors` — DECLINED.** Four independent grounds, the first of which the
round-2 record did not contain and which this amendment adds as binding: it
**fails non-negotiable #3's one-sentence test** (*"drive company delivery to done
**and** manage the operator's personal agenda"* is a structural "and"), which is
the same test that dissolved `kai-personal`. The remaining three: both routers
inherit only `kai-core-*` (9/9 and 6/6, verified), so it is two bodies with zero
contracts; its whole job is claiming/leasing/recording, which non-negotiable #6
forbids standalone mode from doing, so it bends #4/#5 and success measure #1;
and it collides with `m2-claim-surface-pin`'s core-only `CLAIM_SKILLS` invariant
(A10/A12).

**`kai-project-management` — DECLINED.** The operator's observation was **right
about the smell and wrong about the cause**, and both halves are now recorded.
Right: `kai-product` *is* heterogeneous — the enforced `CATEGORIES` partition
files **5 of its 9 members under non-Product headings**. Wrong: **zero** of the
nine are filed under `Intake & delivery`; the mix is growth-analytics (3) and
evaluation (2). Additionally the requested department **already exists on the job
axis** as `CATEGORIES` → `Intake & delivery`, holding exactly
`workflow-issue-analysis` + `workflow-pull-request` + `workflow-ship` — the
operator's own proposed membership — while those same three are mechanically
immovable on the install axis (`planPacks()` `:404` → `namespaceErrors()`
`:1527-1533`, verified).

**Membership rulings:** `kai-product` stays at **9**; net moves out of
`kai-product` in this initiative: **zero**. `kai-engineering` stays at **20**.
`principal-product-manager` keeps the dual scope/steward hat (R4) — the
deferral valve requires one owner on both ends.

> **The A10 window is now CLOSED.** A10 reopened the area set "for the duration
> of `area-plugins-taxonomy-round-2`," closing "at its `scope-acceptance`." That
> acceptance is `REVIEW 2026-08-27-2138`. **The area set is closed at the
> original seven on the original terms: adding an area, or changing the
> membership of a settled one, is out of scope and requires a fresh operator
> decision.** Both `out_of_scope` bullets amended by A10 are **restored to their
> original text**. **Critical operator decision boundary #3 re-arms**;
> `creative-video-director` → `kai-gtm` is settled and needs no further
> escalation.

**Round 1 is `superseded-final`**, no longer `superseded-pending`. It stays
`completed` as history and is **not rewritten**. D1 is amended in exactly one
row (DEA `kai-assistant` → `kai-core`); D2, D5, D6 stand; D3 stands on A3's
acceptance and its class-of-failure property, **not** on the DEA move, and now
carries one fracture (`kai-core-content-grounding`) rather than three; D4 is
narrowed to `kai-core-content-grounding` + `kai-core-generate-audio`. The ban on
minting milestone-4 work against round 1 is **lifted** — milestone-4 items are
minted against **round 2**.

**A12's typed edge is cleared.** `m2-claim-surface-pin`'s dependency on this
item is satisfied, and the collision it guarded against cannot occur: with no
router plugin, every `CLAIM_SKILLS` member is provided by `core` and by no area.
The pin's design is unchanged.

---

### A18 — No change to the P0-vs-later-refinement split, and one addition.

The round-2 split is **accepted as written**. Recorded here so it is not
re-litigated at milestone 4:

**P0 — must be settled before `area-taxonomy-split` implementation begins:**
R1 (DEA → `kai-core`), R2 (count stays 7 — no `kai-directors`), R3 (count stays
7 — no `kai-project-management`; the three `workflow-*` stay in
`kai-engineering`), R6 (D3 prefix fix, milestone-2 deliverable gating milestone
4), R7 (`creative-video-director` → `kai-gtm`).

**Later refinement, each with a trigger:** R2b (`CATEGORIES` refinement and
core's front-office copy — see A19), R3b (`principal-brand-designer` /
`principal-data-analytics` homes), R4 (splitting the PM's two hats), R5 (role
renames — see A20), the PM body claiming stewardship without inheriting
`kai-core-initiative-stewardship`, and routers naming agents in uninstalled
plugins (**not a defect** — `referenceErrors()` sanctions it).

**Addition (this amendment):** **every provider assignment, the 56/51/7
reconciliation, and both gate outcomes are `reported`, not `observed`.** No shell
ran. Before milestone 4 merges, `pack-preview --gate partition` and
`--check` must be **observed** green against the A17 map and the reconciliation
re-asserted mechanically. **No downstream record may upgrade these to `observed`
without a run.** This is condition C5 and it binds milestone 4's definition of
done.

---

### A19 — The operator's model is delivered, on the axis that can carry it. Two `PROPOSAL`s booked.

Declining two plugins does not decline the insight behind them. The insight —
**plugins are departments, the operator is the CEO, the routers are the front
door** — is correct and is *already the shipped product's model*:
`generate-catalog.mjs:40-42` files both routers under **"Direction — The two
front doors. Everything else is reachable through them,"** rendered today at
`docs/reference/agents-and-skills.md:32-34` and gate-enforced by `docs:check`.

**The one real gap:** `kai-core` is still described by its *implementation*
("workspace machinery") rather than its *job*. That is why the operator reached
for a new plugin to name something that already exists. **It is a copy defect,
not a packaging defect**, and a plugin identity is the most expensive and least
reversible way to fix a copy defect.

Two `PROPOSAL`s, routed to the backlog per `proposal_channel`, for promotion in
the next steward pass:

| id | proposal | owner | timing |
|---|---|---|---|
| **P1** | **Name `kai-core`'s job as the front office.** Rewrite core's install-surface description and the `Direction` / `Workspace foundation` blurbs so the front door and the operating system read as one coherent job. Product owns the copy per A4. | `principal-product-manager` → `principal-technical-writer` | milestone 3 `surface-rename` |
| **P2** | **Make the project-management job legible in the catalog.** Present `Intake & delivery` plus core's coordination layer (`kai-core-work-coordination`, `-work-activity`, `-initiative-stewardship`, `-definition-of-done`, `workflow-initiative-init`, `director-chief-of-staff`) as one named job. | same | with P1 |

**Scope note that keeps these cheap:** `scripts/generate-catalog.mjs` is **not**
an `area-plugins` `target`. P1/P2 are one array literal plus
`npm run docs:generate`, byte-checked and fully reversible — outside this
initiative's blast radius, which is precisely the argument for using this axis.

**P4 (deferred, with trigger).** `principal-data-analytics`,
`workflow-experiment-review`, and `workflow-customer-feedback` sit under
`Growth, analytics & monetization` on the job axis while living in the
`kai-product` pack. Real drift, **not** this initiative's question, and moving
agents the operator did not ask about through a window opened for a different
question is scope creep. **Trigger:** one of them acquires a non-core skill
shared with `kai-gtm`, or a future steward amendment reopens membership.

---

### A20 — Role renames: `PROPOSAL` accepted for a separate initiative. One name accepted, one rejected.

**Accepted as a `PROPOSAL`** (round-2 open question #3: **yes**) for a **separate
initiative after `migration-complete`**. They **cannot** ship inside
`area-plugins`: 12 `agents/**` + `skills/**` bodies have no deriving check
(fails A1(ii)) and routing tables are instructions (fails A1(iii)). The
independent reason is stronger than the contractual one — moving **plugin
identity and agent identity in the same window** leaves a red gate with two
candidate causes, which is the attribution discipline A3/S2 established. Blast
radius, for the successor initiative: **57 occurrences across 21 root files**,
2 file renames, 2 `name:` fields, 4 asserted script literals, plus every
historical thread citing dead ids (`out_of_scope` to rewrite).

| proposed | steward ruling |
|---|---|
| `director-chief-of-staff` → **`director-delivery`** | **ACCEPTED provisionally.** Separates on the noun; needs no "Not X" disambiguator. |
| `director-executive-assistant` → **`director-agenda`** | **REJECTED.** It names the *artifact* (`agenda.md`), not the *job*. That agent's shipped `description:` covers *"unclear routing … or who should handle it"* — the front-door half. A name that erases half of one front door fails the record's own "two front doors" premise. |

> **Binding naming constraint (C4).** The successor name for
> `director-executive-assistant` must read as a **front door for the operator** —
> covering *"who should handle this?"* as well as *"what needs me?"* — and must
> not re-import the dissolved `kai-personal` vocabulary (non-negotiable #3). The
> `director-*` prefix is retained: the three-tier
> `director-* / principal-* / workflow-*` taxonomy is load-bearing and stated in
> both router bodies. `director-delivery` / `director-agenda` may be
> reconsidered **as a pair** against this constraint.

Nothing is lost by leaving the second name open — the rename cannot ship in this
initiative either way.

---

### Unchanged by this amendment

Mission and vision. **All thirteen non-negotiable principles, verbatim** —
including #3 (no catch-all; the one-sentence job test), #4 and #6 (fail-closed
relaxed for loading, never for claims), #9 (the derived `legacy-rollback` set),
#11 (root `agents/`/`skills/` are the single source of truth), #12 (no identity
published under a contract already decided to change), and #13 (`pack-split` is
closed and unmodified). Scope `targets` and `keywords`. **All five success
measures with their grounded baselines** — measure #1 needs no carve-out,
because no plugin that cannot be standalone is being minted. All six `deferred`
entries with their triggers, including durable standalone state, which remains
parked. All eight critical operator decision boundaries — **#3 re-arms** with
this acceptance. A1–A9 stand as written; A11's milestone order
(`allowlist-repair → decisions-locked → optional-core-contract → surface-rename
→ area-taxonomy-split → migration-complete`) and A13–A16 stand unchanged. A10's
two `out_of_scope` amendments **expire** with this acceptance, as A10 itself
specified; the new A15 bullet stands. The `workspace-corpus-contract` split
still awaits its operator go/no-go, untouched here.

**No production code, manifest, marketplace, script, skill, or agent body was
modified in this pass.** Nothing under `kai/initiatives/pack-split/**` was read
or written. `area-plugins-tool-allowlist-fix` (held by the parallel
`principal-swe-infra`) was **not touched**.

---

## HANDOFF 2026-08-27-2138 — principal-product-manager (steward) -> director-chief-of-staff

- did:       Ran the `scope-acceptance` on `area-plugins-taxonomy-round-2` and recorded this amendment (A17–A20). **Verified all three load-bearing mechanical claims against source rather than on summary** — the `CATEGORIES`/"Direction" partition, the `planPacks()` → `namespaceErrors()` weld, and the routers' 100%-core inheritance — and found the architect right on all three. **Upheld both declines and added the decisive missing ground**: `kai-directors` fails non-negotiable #3's one-sentence test, the same test that dissolved `kai-personal`. **Corrected the `kai-product` diagnosis with enforced evidence** (5 of 9 members filed under non-Product `CATEGORIES` headings; zero under `Intake & delivery`) and **found the operator's requested department already shipping** as `Intake & delivery` with exactly their proposed membership. Ruled `kai-product` moves to zero. **Closed the A10 area-set window at 7**, restored both amended `out_of_scope` bullets, re-armed operator boundary #3, cleared the A12 edge, and moved round 1 to `superseded-final` with the milestone-4 minting ban lifted. Accepted `director-delivery`, **rejected `director-agenda`** with a binding naming constraint. **Dissolved the operator escalation.** Booked P1/P2 (front-office copy) and P4 (deferred with trigger). Wrote no production code and modified nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `kai/initiatives/pack-split/`.
- state:     completed (this amendment; the scope-brief item remains `completed` at version 3). `area-plugins-taxonomy-round-2` is `completed` at version 4, lease cleared, `next_role: null`.
- needs:     **No operator decision.** The round-2 escalation is dissolved: one branch violated four ratified principles and the other violated none, which is a finding, not a decision — and scope is the steward's under `kai-core-scope-discipline`. Three non-decisions carry forward: (1) **`BOARD.md` reconciliation** for this item's `in-review → completed` transition — derived index, not mine to hand-edit; (2) the **milestone-4 minting pass** may now run against round 2, with `m2-planpacks-prefix requires: shipped` and the README no-merge-before-publish edge; (3) the previously-recorded `mkdir` and `workspace-corpus-contract` go/no-go remain outstanding, unchanged by this pass.
- artifacts: kai/coordination/threads/area-plugins-taxonomy-round-2.md (`REVIEW 2026-08-27-2138` + `HANDOFF`); kai/coordination/items/area-plugins-taxonomy-round-2.md (version 3 → 4, `in-review → completed`, lease cleared, one `completed_reviews` entry); kai/coordination/threads/area-plugins-scope-brief.md (this amendment, A17–A20).
- evidence:  All read this session from `C:\src\kai`; **nothing executed — no shell — so every gate and provider claim is `reported`, never `observed`.** **(a)** `scripts/generate-catalog.mjs:31` `CATEGORIES`; `:40-42` `title: 'Direction'`, blurb *"The two front doors. Everything else is reachable through them."*, `members: ['director-executive-assistant', 'director-chief-of-staff']`; `:244-260` `build()` enforces exactly-once coverage in both directions (unfiled, double-filed, wrong-kind all throw); `package.json:9` `docs:check`, `:19` `--check` inside `npm test`; rendered output live at `docs/reference/agents-and-skills.md:32-34`. **(b)** `pack-plan.mjs:366-370` `declaredInherits()` matches only `/^\*\*Inherits:\*\*(.*)$/m` (so `workflow-doc-review.agent.md:99` is prose, **not** a consumer); `grep '^\*\*Inherits:\*\*' agents/` = **56 matches / 56 files**; `build-diagrams` consumers = swe-architect, swe-backend, swe-frontend, swe-infra, workflow-issue-analysis, workflow-pull-request; `review-rollout-operability` consumers = principal-sre, workflow-ship — **all `engineering`** per `PACKS` at `pack-plan.mjs:63-98`, so both are single-pack locals today; moving any one of the three trips `planPacks():404` `packs.size > 1 ⇒ core` then `namespaceErrors():1527-1533` on the missing `kai-core-` prefix; escapes closed by `providerCollisionErrors():1545+`, `referenceErrors():1022-1065`, and A1(ii). **(c)** `director-chief-of-staff.agent.md:7` = 9 skills, 9 prefixed; `director-executive-assistant.agent.md:7` = 6 skills, 6 prefixed. **Citation defect (C1):** the only director-id literals in `scripts/` are `validate-plugin.mjs:232` (`ACTIVITY_EXEMPT`) and `release-guard.mjs:106` (self-test fixture); `validate-plugin.mjs:845-875` is the **guided-installer assertion** deriving an exact `copilot plugin install <pack>@<marketplace>` command per `PACK_ORDER` key with an order check — which makes F1's `PACKS`-cost argument stronger, not weaker. **`kai-product` diagnosis:** `generate-catalog.mjs:78-86` files PM/strategist/designer/brand-designer under `Product`; `:100-107` files `principal-data-analytics`, `workflow-experiment-review`, `workflow-customer-feedback` under `Growth, analytics & monetization`; `:117-127` files `workflow-product-explore`, `persona-ux-first-time-user` under `Product exploration & web evaluation`; `:57-61` `Intake & delivery` holds exactly `workflow-issue-analysis`, `workflow-pull-request`, `workflow-ship`. **Lease:** item frontmatter re-read immediately before the first state-changing write — holder `principal-product-manager`, token `apx-tax2-acc-20260827-2130-n1`, `version_at_grant: 2`, item `version: 3`, all matching the dispatch packet; no collision.
- questions: none. **No operator decision remains on this item.** If the operator nonetheless wants `kai-directors` minted, overruling is one sentence and needs no re-analysis: the round-2 record already fixes its membership (both routers, zero skills), `PACK_ORDER` position 2, and `PACK_RUNTIME_DEPENDENCIES` `[]` — and a fresh A-series amendment would have to reopen the area set and carve `kai-directors` out of success measure #1.
- next:      `director-chief-of-staff` — reconcile `BOARD.md` for the `in-review → completed` transition, then run the milestone-4 minting pass against the A17 map. `area-plugins-tool-allowlist-fix` remains with `principal-swe-infra` and is unaffected by this ruling.

---

## STEWARD AMENDMENT 2026-08-27-2210 — principal-product-manager (steward)

**Append-only amendment to the `BRIEF 2026-08-27-1839` packet and amendments
A1–A20. Nothing above this line is rewritten.** Where this amendment and
anything above conflict, this amendment governs and the conflict is named
explicitly.

Issued on two triggers arriving together: (1) `kai/initiatives/area-plugins/`
**now exists and is writable** — verified by the director this turn, which
discharges the `mkdir` blocker recorded in every handoff since 1839; and (2) the
main agent's **two overrides** of 2026-08-27-2153, which are settled and are
**recorded here, not relitigated**.

**This amendment is the last one this thread carries as the initiative's
authoritative scope.** `kai/initiatives/area-plugins/northstar.md` now exists and
is the north star. This thread remains the append-only decision *history* and the
audit trail; it is not rewritten, and nothing in it is deleted. Going forward the
north star governs, and future scope amendments amend **it**.

**Environment limit, unchanged and still binding.** There is still **no shell**.
Every mechanical claim below was derived by reading source and is `reported`,
never `observed`.

Six things are recorded: **A21** the area-set reversal; **A22** the two
overrides as scope; **A23** the tool-allowlist correction and the ruling it
forces on `PROPOSAL-2`; **A24** the milestone order and the real
`required_items` mapping; **A25** what is fenced, unratified, or still owed;
**A26** what was written and what is unchanged.

---

### A21 — The area set is REOPENED and CLOSED AT NINE. **This reverses my own A17, and I am naming the reversal rather than letting it pass silently.**

A17 (2026-08-27-2138) closed the area set at **seven** and wrote:

> *"The area set is closed at the original seven on the original terms: adding
> an area, or changing the membership of a settled one, is out of scope and
> requires a fresh operator decision."*

**A fresh decision was made. The set is nine.** The reversal, stated as a table
so nobody has to reconstruct it from two amendments:

| A17 ruled | 2153 override rules | status of my A17 ground |
|---|---|---|
| Area set **closed at 7** | **Nine**: `kai-core`, `kai-directors`, `kai-project-management`, `kai-engineering`, `kai-product`, `kai-gtm`, `kai-learning`, `kai-assistant`, `kai-wellness` | **reversed** |
| `kai-directors` **DECLINED** on four grounds | **ACCEPTED** as an executive routing layer, not a department | **overridden** |
| Decisive ground: fails non-negotiable #3's one-sentence job test | Job supplied: *the human is CEO; its two agents are front doors over departments* | **overridden — but the obligation survives** (see below) |
| Ground: routers inherit only `kai-core-*` (9/9, 6/6), so it is two bodies with zero contracts | Accepted anyway; skill placement is round 3's to resolve | **overridden** |
| Ground: its whole job is claiming/leasing/recording, which #6 forbids standalone | **Answered, not waived** — the bounded exception forbids exactly those operations standalone | **resolved, not overridden** |
| Ground: collides with `m2-claim-surface-pin`'s core-only `CLAIM_SKILLS` invariant | **Compatible** — see A22 | **resolved, not overridden** |
| `kai-project-management` **DECLINED**; job already exists as `CATEGORIES` → `Intake & delivery` | **ACCEPTED** as a product boundary, seeded from the *core coordination* workflows instead | **overridden** |
| Measure #1 "needs no carve-out, because no plugin that cannot be standalone is being minted" | Measure #1 **gains a named exception** for `kai-directors` | **reversed** — exactly as A17's own handoff predicted a reversal would require |
| Round 2 is the final position | Round 2 is **superseded**; `area-plugins-taxonomy-round-3` is final | **reversed** |
| Both A10-amended `out_of_scope` bullets **restored to original text** | The "settled set" bullet is **rewritten to name all nine**; the membership bullet is **restated, not reopened** | **partially reversed** |
| Critical operator decision boundary #3 **re-armed** | **Re-armed at nine.** Adding a tenth area is a fresh operator decision | **carried** |

**What is NOT reversed, and this matters more than the reversal.** The override
upholds two of A17's findings explicitly:

1. **The weld finding stands.** `workflow-ship`, `workflow-pull-request` and
   `workflow-issue-analysis` **stay in `kai-engineering`**. The operator's
   originally-proposed membership for `kai-project-management` is *not* what
   the plugin gets; it is seeded from `workflow-initiative-init`,
   `workflow-weekly-pulse`, `workflow-proactive-scan` instead. A17's mechanical
   evidence (`planPacks():404` → `namespaceErrors():1527-1533`) is the reason,
   and it survived the override.
2. **`kai-product` moves stay at zero.** Product keeps discovery, scope, design,
   strategy, analytics, feedback and experiments. `kai-engineering` and
   `kai-gtm` are likewise untouched. Only `kai-personal` dissolves and only
   `kai-core` decomposes.

**The one obligation the override inherits rather than dissolves.** A17's
decisive ground was the one-sentence job test — the same test that dissolved
`kai-personal`. The override supplies a job for `kai-directors`, and that
settles the *decision*. It does not discharge the *test*.
`area-plugins-taxonomy-round-3` owes a one-sentence job for **both** new
plugins in a form that passes non-negotiable #3, which is untouched and
verbatim. **If it cannot be stated without a structural "and", that is a finding
to report to the operator — not something to wave through**, and not grounds to
re-open the accepted decision.

**`out_of_scope` bullet, amended.** Replaces the A17-restored "settled set"
bullet:

> **Adding areas beyond the settled nine** (`core`, `directors`,
> `project-management`, `engineering`, `product`, `gtm`, `learning`,
> `assistant`, `wellness`). The set is closed at nine by the 2026-08-27-2153
> override, which reversed the steward's A17 closure at seven. Adding a tenth
> requires a fresh operator decision. **Boundary #3 is armed at nine.**

**`out_of_scope` bullet, restated (not reopened).** The membership bullet reads:

> **Changing membership of `kai-engineering`, `kai-product`, or `kai-gtm`.** Net
> moves out of those three remain **zero**. Only `kai-personal` dissolves and
> only `kai-core` decomposes.

---

### A22 — The two overrides, recorded as scope.

**Override 1 — `kai-directors` ACCEPTED, with a bounded exception.**

Carried into the north star as **non-negotiable #14**, deliberately written as
an *exception with a fence* rather than a permission:

> With no core installed `kai-directors` **may** perform read-only discovery and
> routing, and **may** offer to install core. It **must not** (a) claim leases,
> (b) create canonical coordination records, or (c) impersonate full delivery.
> With core installed it gains durable orchestration. **This exception is
> bounded to `kai-directors` and to exactly those three prohibitions**; it is #6
> restated at that plugin's boundary, not a relaxation of it. No other plugin
> may cite it, and widening it — or extending it to a second plugin — is a fresh
> operator decision, not a design refinement.

**Why the exception resolves A12's collision instead of triggering it.** A12
(2113) warned that a router plugin would break `m2-claim-surface-pin`'s
invariant — *every `CLAIM_SKILLS` member is provided by `core` and by no area* —
because routing means leasing, handing off and moving items. The bounded
exception answers that directly: it forbids **exactly** the operations those
skills perform. `kai-directors` can therefore consume `kai-core-work-coordination`
across the plugin boundary when core is present and do none of it when core is
absent, with the invariant intact. Verified this pass:
`kai-core-work-coordination` is inherited by `director-chief-of-staff`,
`workflow-initiative-init`, `workflow-self-check` and `workflow-workspace-init`
— which under the override land in **three different plugins**, so
`planPacks()`'s multi-pack rule keeps it in `core` by construction.

**This is `reported`, not `observed`, and it is not my ruling to finalise.**
Confirming it is `area-plugins-taxonomy-round-3`'s and
`area-plugins-m2-claim-surface-pin`'s work. **Steward follow-up I did not
perform, named so it is not lost:** A12's typed edge on
`m2-claim-surface-pin` points at `area-plugins-taxonomy-round-2`, which is
`completed`, so the edge reads as satisfied. Under the nine-plugin target the
condition it guards is now settled by **round 3**, and the edge should be
re-pointed to `area-plugins-taxonomy-round-3 requires: completed`. That item file
was outside this pass's assigned write set and was **not edited**.

**Override 2 — `kai-project-management` ACCEPTED as a product boundary.**

- **Seeded from** the current core coordination workflows:
  `workflow-initiative-init`, `workflow-weekly-pulse`, `workflow-proactive-scan`.
- **Technical core keeps** `workflow-workspace-init` and `workflow-self-check`.
- **`kai-engineering` keeps** `workflow-ship`, `workflow-pull-request`,
  `workflow-issue-analysis` — round 2's weld finding upheld.
- **Product keeps** discovery, scope, design, strategy, analytics, feedback,
  experiments.
- **Project management owns** portfolio/initiative creation, progress
  visibility, scheduling/cadence, proactive action surfaces.
- **A new principal project/program manager agent is a LATER question.** It is
  recorded in `deferred` with a trigger, **not** invented now — creating it
  would violate the "adding agents or capabilities" `out_of_scope` bullet, which
  is unchanged.

**Grounded arithmetic, verified this pass at `scripts/lib/pack-plan.mjs:63-70`.**
`kai-core`'s seven agents are exactly `director-chief-of-staff`,
`director-executive-assistant`, `workflow-workspace-init`,
`workflow-self-check`, `workflow-proactive-scan`, `workflow-weekly-pulse`,
`workflow-initiative-init`. The override splits them **2 / 3 / 2** with no
remainder — the agent arithmetic is fully determined. **The 24 core skills are
not**, and placing them is round 3's job.

**A consequence the override creates, routed rather than ruled.** A17 narrowed
the `planPacks()`/`namespaceErrors()` seam defect (D3) to a **single** fracture
because DEA returned to core. The nine-plugin target **widens it again**. Read
directly this pass: `kai-core-decision-brief` and
`kai-core-executive-consultation` are inherited by `director-executive-assistant`
**alone** — the two instances A3 originally enumerated, restored. And
`kai-core-personal-agenda`'s only two consumers are
`director-executive-assistant` and `workflow-proactive-scan`, which under the
override land in **different** new plugins, leaving a `kai-core-`-prefixed skill
in core with **no core consumer** — legal under the gates, but a coherence
question. **Enumerating the complete fracture set is round 3's deliverable, not
mine.** These are cited as proof the set is non-empty. `m2-planpacks-prefix`
(D3) is thereby *strengthened*, exactly as A12 predicted, and remains milestone
2's chain head gating milestone 4.

---

### A23 — Tool-allowlist correction, and the `PROPOSAL-2` ruling it forces.

**Documented vocabulary (official GitHub documentation, observed 2026-08-27 by
the operator, recorded here verbatim as the baseline):** portable primary
aliases `execute`, `read`, `edit`, `search`, `agent`, `web`, `todo`; compatible
aliases `shell`/`Bash`/`powershell`, `Read`/`NotebookRead`,
`Edit`/`MultiEdit`/`Write`, `Grep`/`Glob`, `custom-agent`/`Task`; unrecognized
names ignored.

**The defect is validator/runtime drift, and it is now proven from two sides.**
The operator's live CLI warns on lowercase `create`, `edit` and `grep` **even
though `edit` and `Grep` are documented aliases** and runtime capability
remains. Independently, `principal-swe-infra` measured itself as the test case:
declared all three, was warned on all three, **used all three** — while the
genuinely absent capability was `shell`, which is *not* warned about. **The
warned set and the broken set are disjoint.**

**RULING on `PROPOSAL-2` (routed to me by infra at 2138: "Branch B contradicts
the item's committed Outcome"). The Outcome is amended, not the branch
selected.** Milestone 0's outcome now reads: the repo's tool-allowlist contract
is **grounded in measured host behaviour** instead of hand-maintained guesswork,
and the warnings stop **via a replacement proven safe by the probe** — never by
deleting tokens.

Three binding constraints, carried into the north star's milestone-0 acceptance:

1. **The conformance probe is the FIRST implementation.**
   `area-plugins-host-tool-conformance` is `ready` and dispatched. No
   `agents/**` or `packs/**` body is edited before it reports.
2. **Do not strip capability yet.** A replacement that removes a capability is a
   **capability-loss disclosure** and a steward call, not an editorial one. The
   naive fix would have stripped file creation from up to 49 agents to quiet a
   cosmetic log.
3. **`tools: ['*']` and omission are weighed against least privilege** and a
   recommendation recorded. **Neither is assumed acceptable** — this is stated
   because "just use `*`" is the cheapest way to make the warnings stop and the
   most expensive way to lose the contract.

**Bounded — this is a `Reframe` inside existing scope, not an addition.** It
adds no gate, surface, step or capability; it corrects an outcome the evidence
falsified. Same reasoning as A3/S1 and A5.

**`PROPOSAL-3` (the 102 skill-file declarations) is DEFERRED**, with the third
`SUPPORTED_TOOLS` copy, as **P5** in
`kai/initiatives/area-plugins/backlog.md`. Trigger: the probe reports. Absorbing
it now would double a whole-fleet diff before knowing whether the tokens are
load-bearing — the exact failure `allowlist-repair` was sequenced first to
avoid. Note P5's scope is *narrower* than the probe's acceptance line: the probe
must **account for** the third copy; P5 asks whether it should be **derived**.

`Q-area-plugins-tool-allowlist-fix-01` remains **open and blocking** to
`@operator`; `area-plugins-tool-allowlist-fix` stays `blocked` with
`resume_state: ready`. Not mine to answer and not touched.

---

### A24 — Milestone order confirmed, and the real `required_items` mapping.

**Order, unchanged from A11 and restated because the north star now carries it:**

```text
allowlist-repair -> decisions-locked -> optional-core-contract ->
surface-rename -> area-taxonomy-split -> migration-complete
```

`allowlist-repair` is now **led by the conformance probe**, not by a rename.
`scope.current` stays at the two non-overlapping frontiers `allowlist-repair` +
`decisions-locked` — they share no target file, no decision and no artifact.

**Mapped from the 24 real `area-plugins-*` item records read this pass. Nothing
invented.**

| milestone | required items (typed) | live state |
|---|---|---|
| `allowlist-repair` | `host-tool-conformance` (shipped), `tool-allowlist-fix` (shipped) | probe **ready/in flight**; fix **blocked** on `Q-…-01` |
| `decisions-locked` | `scope-brief`, `optional-core-architecture`, `taxonomy-decision`, `taxonomy-round-2`, `taxonomy-round-3`, `migration-architecture` (all completed) | 4 `completed`; round 3 **ready/in flight**; migration **in-review** |
| `optional-core-contract` | `m2-decomposition`, `m2-standalone-copy`, `m2-docs-two-modes` (completed) + `m2-planpacks-prefix`, `m2-standalone-floor`, `m2-claim-surface-pin`, `m2-mode-selection`, `m2-standalone-proof`, `m2-doctor-standalone` (shipped) | 2 `completed`, 7 `ready` behind typed edges |
| `surface-rename` | **`[]` — UNMINTED** | cannot close |
| `area-taxonomy-split` | **`[]` — UNMINTED** | cannot close; three mint-time constraints bind |
| `migration-complete` | `readme-clarity` (shipped) | `proposed` |

**Three reconciliations, named rather than smoothed over.**

1. **Milestone 2 maps NINE items, not the eight A7 listed.**
   `area-plugins-m2-decomposition` carries `required_for_milestone: true` in its
   own frontmatter; A7 enumerated only the eight items decomposition *emitted*.
   **On-disk truth wins.** My A7 list was incomplete, not wrong about the eight.
2. **Milestone 1 gains `area-plugins-taxonomy-round-3`** (A11 added round 2; the
   override adds round 3). `area-plugins-distributed-agents-proposal` sits in
   this milestone at `completed` but is `required_for_milestone: false` and is
   **correctly excluded** — proposal-only, externalised to issue #192.
3. **Two milestones map to an empty list, and that is the honest answer.**
   `surface-rename` and `area-taxonomy-split` have **no item records at all**
   today. Under `kai-core-initiative-stewardship` an empty typed mapping is a
   **closure gate**, so neither can be called done. Inventing plausible IDs
   would have produced a mapping that looks satisfiable and is not — which is
   strictly worse than a short honest one.

**Mint-time constraints for `area-taxonomy-split`, now three:** (1) a typed edge
on `area-plugins-m2-planpacks-prefix requires: shipped` (A3/S1, A7); (2) items
are minted against **round 3**, never rounds 1 or 2; (3)
`area-plugins-readme-clarity` must not merge before the new identities are
published (A14).

---

### A25 — Fenced, unratified, and still owed.

- **GitHub issue #192** records the distributed multi-PC agents proposal
  externally. `area-plugins-distributed-agents-proposal` is `completed` with an
  `external_ref` and is **proposal-only**. **No implementation scope enters this
  initiative**, and no milestone may depend on it. Carried into the north star's
  `out_of_scope` verbatim.
- **`area-plugins-migration-architecture` is still `in-review`**, awaiting a
  **fourth** reliability review after three `changes-requested` verdicts
  (0P0/4P1, 0P0/1P1, 0P0/1P1). It still gates the entire milestone-2 code chain
  through the A8 typed edge on `m2-planpacks-prefix`. **I did not touch it**,
  and I do not relabel `principal-sre`'s verdicts.
- **The `workspace-corpus-contract` split is NOT ratified.** My A10 proposal —
  archive / backlog / design-output / storage-modes — has **not** received the
  operator's go/no-go. It is recorded in the north star as **proposed, pending
  operator decision**, its four items stay `proposed` with cleared leases and
  are undispatchable, and **I did not assume it**. Nothing in `area-plugins`
  depends on the answer.
- **Canonical decision artifacts are owed.** Several `completed` milestone-1 and
  milestone-2 items declare an `artifact_target` under
  `kai/initiatives/area-plugins/artifacts/decisions/` that does not exist,
  because the directory could not be created when they closed. Each is listed in
  `deliverables.md` as `artifact owed`, with its coordination thread named as
  the durable record. **Transcribing them is a separate pass and is not a
  licence to re-open any of those decisions.**
- **`kai/coordination/BOARD.md`** still needs reconciliation, now including the
  two items minted for the override. Derived index; not mine to hand-edit.

---

### A26 — What was written, and what is unchanged.

**Written this pass — four files, all previously blocked on the `mkdir`:**

| path | what |
|---|---|
| `kai/initiatives/area-plugins/northstar.md` | **CREATED.** `status: active`, `owner: principal-product-manager`, `related: [pack-split]`, nine-plugin mission/vision, 14 non-negotiables, 5 measures with grounded baselines, 6 milestones with typed `required_items` |
| `kai/initiatives/area-plugins/deliverables.md` | **CREATED.** 15 rows indexing every real artifact with exact workspace-root-relative paths and provenance, plus an explicit "not yet produced" section |
| `kai/initiatives/area-plugins/backlog.md` | **CREATED.** The `proposal_channel`. Five parked proposals (P1, P2, P3, P4, P5) with a dated grooming pass; **none promoted** |
| `kai/initiatives/INDEX.md` | **UPDATED.** The `area-plugins` row only |

**Not written, deliberately:** `kai/initiatives/area-plugins/log.md` (the
director already wrote it); any file under
`kai/initiatives/area-plugins/artifacts/decisions/` (parallel siblings own
`area-plugins-taxonomy-round-3.md` and `area-plugins-host-tool-conformance.md`);
any item or thread belonging to the two in-flight siblings; anything under
`scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`; anything under
`kai/initiatives/pack-split/**`.

**Unchanged by this amendment.** Mission and vision, restated for nine plugins
but unchanged in intent. **All thirteen original non-negotiable principles,
verbatim** — #14 is *added* as a bounded exception, and #6 in particular is not
relaxed for anyone, including `kai-directors`. Scope `targets` (plus
`scripts/host-contract.mjs` and `scripts/lib/loader-contract.mjs`, which
milestone 0's own required item already `touches` — transcription, so the north
star's targets cover its own milestone, not an expansion). Every `out_of_scope`
bullet except the two named in A21. All `deferred` entries with their triggers —
**durable state for standalone mode remains parked** — plus two added: the new
PM agent, and the A20 role renames. All eight critical operator decision
boundaries, **#3 armed at nine**. A1–A20 stand as written; A17's *findings*
survive even where its *conclusion* was overridden. Milestone order per A11.
A5's doctor ruling, A2's measure-#2 restatement, A1's generator-derived-identity
exception and A11's three-clause topology-neutral carve-out are all carried
verbatim into the north star.

**One entry removed from `deferred`, with the reason stated:**
`creative-video-director`'s longer-term home. A17 settled it (→ `kai-gtm`) and
re-armed boundary #3, so it is no longer deferred; it is an **input to round 3**
under the nine-plugin map.

**No production code, manifest, marketplace, script, skill, or agent body was
modified in this pass.**

---

## HANDOFF 2026-08-27-2210 — principal-product-manager (steward) -> director-chief-of-staff

- did:       **Materialized the initiative's canonical artifacts** now that `kai/initiatives/area-plugins/` exists, by **transcribing** the accepted BRIEF and amendments A1–A20 from this thread rather than drafting fresh. Created `northstar.md` (`status: active`, `owner: principal-product-manager`, `related: [pack-split]`), `deliverables.md` (15 indexed artifacts with provenance) and `backlog.md` (the `proposal_channel`, five parked proposals, one dated grooming pass, **none promoted**), and updated the `area-plugins` row in `kai/initiatives/INDEX.md`. **Recorded the main agent's two overrides as scope** and **named the reversal of my own A17 explicitly in a side-by-side table** — the area set reopened from seven to **nine**, `kai-directors` and `kai-project-management` both accepted, measure #1 carrying a named `kai-directors` exception, round 2 superseded by round 3. Wrote the `kai-directors` standalone exception as **non-negotiable #14, fenced** — read-only discovery/routing plus an install offer, with its three prohibitions (no lease claims, no canonical coordination, no impersonated delivery) and an explicit clause that no other plugin may cite it. **Ruled infra's routed `PROPOSAL-2`**: amended milestone 0's outcome so the warnings stop via a probe-proven replacement, never by deleting tokens; carried the documented alias vocabulary verbatim; bound `tools: ['*']`/omission to least privilege. **Deferred `PROPOSAL-3`** (102 skill declarations + the third `SUPPORTED_TOOLS` copy) to the backlog as P5. **Mapped `required_items` from the 24 real item records**, correcting my own A7 undercount and leaving two milestones honestly empty. Wrote no production code and touched nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, `kai/initiatives/pack-split/`, or either in-flight sibling's records.
- state:     completed (this amendment; the scope-brief item remains `completed` at version 3, lease null)
- needs:     No operator decision on scope. Four carry-forwards: **(1)** `kai/coordination/BOARD.md` reconciliation, now including the two override-minted items — derived index, not mine to hand-edit. **(2)** A steward follow-up I could not perform in this pass's write set: `area-plugins-m2-claim-surface-pin`'s A12 typed edge points at `area-plugins-taxonomy-round-2`, which is `completed`, so it reads satisfied — under the nine-plugin target the condition it guards is settled by **round 3** and the edge should be re-pointed to `area-plugins-taxonomy-round-3 requires: completed`. **(3)** `Q-area-plugins-tool-allowlist-fix-01` is still open and blocking to `@operator`; `area-plugins-tool-allowlist-fix` stays `blocked`. **(4)** The `workspace-corpus-contract` go/no-go remains outstanding and is recorded as unratified.
- artifacts: kai/initiatives/area-plugins/northstar.md (**created**); kai/initiatives/area-plugins/deliverables.md (**created**); kai/initiatives/area-plugins/backlog.md (**created**); kai/initiatives/INDEX.md (`area-plugins` row updated); kai/coordination/threads/area-plugins-scope-brief.md (this amendment, A21–A26).
- evidence:  All read this session from `C:\src\kai`; **nothing executed — no shell — so every claim is `reported`, never `observed`.** **Item mapping:** all **24** `area-plugins-*` records in `kai/coordination/items/` read for `initiative`/`milestone`/`state`/`priority`/`required_for_milestone`/`version` — 19 `initiative: area-plugins`, 4 `initiative: workspace-corpus-contract`, 1 unaffiliated (`fleet-observer-ux`, `initiative: null`). `area-plugins-m2-decomposition.md:48` carries `required_for_milestone: true`, which is why milestone 2 maps **nine** items and not A7's eight. `area-plugins-distributed-agents-proposal.md:14` carries `external_ref: https://github.com/RubenSaucedo/kai/issues/192` with `required_for_milestone: false`. `area-plugins-migration-architecture.md` is `in-review` at version 17. `area-plugins-tool-allowlist-fix.md` is `blocked`, `resume_state: ready`, `next_role: "@operator"`. **Both in-flight siblings read read-only and not edited:** `area-plugins-taxonomy-round-3` (lease `principal-swe-architect` / `apx-tax3-20260827-2200-p1`, expires 2026-08-28-0100) and `area-plugins-host-tool-conformance` (lease `principal-swe-infra` / `apx-probe-20260827-2200-p2`, same expiry). **Nine-plugin arithmetic:** `scripts/lib/pack-plan.mjs:63-70` — `PACKS.core` is exactly `director-chief-of-staff`, `director-executive-assistant`, `workflow-workspace-init`, `workflow-self-check`, `workflow-proactive-scan`, `workflow-weekly-pulse`, `workflow-initiative-init`; the override splits them 2/3/2 with no remainder. **Fracture-set evidence (non-exhaustive, round 3 owns the enumeration):** `agents/director-executive-assistant.agent.md:7` is the sole `**Inherits:**` site for `kai-core-decision-brief` and `kai-core-executive-consultation`; `kai-core-personal-agenda`'s only two consumers are `agents/director-executive-assistant.agent.md:7` and `agents/workflow-proactive-scan.agent.md:7`, which the override puts in different new plugins; `kai-core-work-coordination` is inherited across `director-chief-of-staff`, `workflow-initiative-init`, `workflow-self-check` and `workflow-workspace-init` — three plugins under the override, so `planPacks()`'s multi-pack rule keeps it in core. **Allowlist surface:** `kai/coordination/threads/area-plugins-tool-allowlist-fix.md` — 214 declaration sites (56 root agents + 56 mirrors + 51 root skills + 51 mirrors), third `SUPPORTED_TOOLS` at `packs/kai-core/scripts/lib/loader-contract.mjs:14`, warned set `{create, edit, grep}` and broken set `{shell}` disjoint. **Templates:** `kai/initiatives/pack-split/{northstar,deliverables,backlog}.md` read for exact structure; `kai/initiatives/pack-split/**` **not written**. `kai/initiatives/area-plugins/log.md` and `artifacts/decisions/README.md` read for provenance; **neither written**.
- questions: none blocking. **Three things I could not truthfully assert, stated rather than papered over:** **(1)** every mechanical claim in the north star is `reported`, not `observed` — no gate, no `--check`, no `pack-preview` run exists behind any of them, which is why condition **C5** binds `area-taxonomy-split` to *observed* green before merge. **(2)** I did **not** compute the nine-plugin skill map; the 24 core skills' placement, the complete `planPacks()`/`namespaceErrors()` fracture set, and the one-sentence job for each new plugin are `area-plugins-taxonomy-round-3`'s deliverables and I recorded them as owed, not as decided. **(3)** `kai-directors`'s standalone compatibility with the core-only `CLAIM_SKILLS` invariant is an argument from source reading, not a proof — round 3 and `m2-claim-surface-pin` must confirm it, and if it fails that is **critical operator decision boundary #1**, which escalates rather than being softened.
- next:      `director-chief-of-staff` — reconcile `BOARD.md`, then keep the two in-flight siblings running; they are unaffected by this pass. On `area-plugins-taxonomy-round-3` reaching `completed` the steward runs a promotion pass: re-points the A12 edge, mints the `surface-rename` and `area-taxonomy-split` items against round 3 with all three mint-time constraints, and grooms P1/P2/P5 against the new frontier. `area-plugins-migration-architecture` still owes its fourth `principal-sre` review before any milestone-2 code can merge.

---

## STEWARD AMENDMENT 2026-08-27-2240 — principal-product-manager (steward)

**Append-only amendment to `BRIEF 2026-08-27-1839` and amendments A1–A26. Nothing
above this line is rewritten.** Where this amendment and anything above conflict,
this amendment governs and the conflict is named explicitly.

Issued on one trigger: **`area-plugins-taxonomy-round-3` was accepted** under its
declared `scope-acceptance` review (`REVIEW 2026-08-27-2240`, verdict **approved**)
and is `completed` at version 4. This **closes the taxonomy chain** and discharges
caveats **(2)** and **(3)** of the 2210 handoff above — the ones I recorded as
things I could not truthfully assert.

**Environment limit, unchanged and still binding.** There is still **no shell**.
Every mechanical claim below was derived by reading source and is `reported`, never
`observed`. Nothing here promotes any of round 3's thirteen `observed`-owed checks.

Two things are recorded: **A27** the final nine-plugin position and the rulings that
close it; and the **P-A constraint on milestone 2**.

---

### A27 — The nine-plugin position is FINAL, and the two open caveats are discharged.

**The 2210 handoff's caveat (2) is discharged.** I recorded the nine-plugin skill
map, the complete fracture set and the one-sentence jobs as *owed*. Round 3 supplied
all three; I re-derived each from source rather than accepting the summary.

- **Skill map (56 agents / 51 skills, each placed exactly once):** core **2/24** ·
  directors **2/0** · project-management **3/0** · engineering **20/15** · product
  **9/3** · gtm **12/7** · learning **4/1** · assistant **2/1** · wellness **2/0**.
  Verified: `agents/*.agent.md` → 56; `skills/*/SKILL.md` → 51, of which **24** carry
  the `kai-core-` prefix; 51 − 24 = 27 = 15+3+7+1+1 ✓. **With the D3 fix core's
  provider set is identical to `1.0.4`'s** — only the seven skills of the dissolved
  `personal` pack move.
- **Fracture set: SIX, not three** — `kai-core-decision-brief`,
  `-executive-consultation`, `-initiative-stewardship`, `-proactive-scan`,
  `-pulse-digest`, `-content-grounding`. **`kai-core-personal-agenda` is NOT one**,
  which **corrects my own A26 evidence note above**, where I cited it as leaving a
  core skill with no core consumer. It has two consumers in two *different* packs, so
  `packs.size === 2` and `planPacks()` assigns it to `core` by topology — green with
  or without the prefix fix. **The D3 prefix fix suffices unchanged.**
- **One-sentence jobs:** `kai-directors` — *"the front door: it decides who should
  handle what"* — **PASS as written**. `kai-project-management` — **the architect's
  proposed sentence did not pass**, because *"makes the portfolio's state visible on a
  cadence"* does not cover `workflow-initiative-init` (minting an initiative is
  state-creating, not visibility) and covering it needed a structural "and". **I
  amended it to *"maintains the portfolio's operating rhythm,"*** which is true of all
  three agents without an "and". Membership was **not** reopened — that is a settled
  override, and this was a copy defect, which is product's under A4. Reported, not
  smoothed over, exactly as the obligation required.

**The 2210 handoff's caveat (3) is discharged, and it was the one tied to critical
operator decision boundary #1.** I wrote that `kai-directors`'s compatibility with the
core-only `CLAIM_SKILLS` invariant was *"an argument from source reading, not a
proof."* **It is now a proof, and it holds.**

The round-2 dilemma conflated **provider** with **consumer**. The distinction is
mechanical, not rhetorical: `namespaceErrors()` (`pack-plan.mjs:1538`) fires on
*"`<plugin>` **provides** skill `<id>`"*, and `planPacks()`/`planAssets()` assign
ownership by consumer-pack **cardinality**. A pack with an empty local provider set
has nothing to quantify over and cannot violate a provider-side pin. Verified
structural leg: **both director bodies inherit only `kai-core-*` skills and reference
zero assets**, so `planPacks().local.directors` is empty by construction —
`kai-directors` is two agent bodies and nothing else, and core-less those skill files
are not on disk. That is the same structural withholding the accepted optional-core
architecture already rests on.

> **`CLAIM_SKILLS` membership is UNCHANGED at 14, all core-provided, none
> area-provided. CRITICAL OPERATOR DECISION BOUNDARY #1 DOES NOT TRIP. No escalation.**

What changes is **disclosure**, not the pin: clauses D-1…D-8, with **D-2** (empty
local provider set) making "cannot claim" structural.

**Honesty caveat, recorded rather than buried.** `CLAIM_SKILLS` and
`standaloneBlockErrors()` **do not exist in `scripts/` today** — repo-wide grep
returns zero matches outside `kai/` records. They are milestone-2 constructs. So
"unchanged at 14" is a ruling about a *planned* constant and stays `reported`; the
structural fact it rests on is verified against real shipped source. **Consequence:
the pin's arm must be written provider-side.**

**Router names — the rejection of `director-personal` is UPHELD.** All three grounds
hold; the third is decisive under the override, since core-less that agent routes to
*anything*, making the name least true in exactly the mode the exception preserves.
**C4′** is accepted as a standing constraint. **No third name was minted** — renames
cannot ship in this initiative (R5/F9/A1, not overridden), and minting one inside a
window where it cannot be exercised would fix copy against evidence the successor
initiative has not gathered. `director-delivery` is the **working candidate, not
locked copy**. `kai-directors` ships with the shipped agent ids. C4 + C4′ are carried
into the north star for the successor initiative.

**Steward finding F-1 — D-7 carries an unnamed prerequisite.** `DISPATCHING_ROLES`
is `['director-chief-of-staff']` (`pack-plan.mjs:1620`) and `availabilityErrors()` is
enforced over every member in **two** places (`pack-preview.mjs:1261-1265`,
`validate-plugin.mjs:522-531`). DCoS carries all three pinned `AVAILABILITY_RULES`
sentences; **`director-executive-assistant` carries none**. So `DISPATCHING_ROLES +1`
turns **`--gate partition` red with three violations** until that agent body gains the
three byte-pinned sentences. N7 names the constant change but **no record named the
body edit**. **Obligation on N7, not a blocker** — whichever item lands
`DISPATCHING_ROLES +1` must land the body edit in the same change.

**Proposals ruled.** **P-A accepted** (see below). **P-B accepted** as steward-owned —
fold the derived core-dependence clause into the already-required `packDescription()`
rewrite; copy is mine under A4. **P-C accepted as routed and deferred** — a new
`principal-project-manager` agent is a **new capability** beyond `scope.current`, so
under `kai-core-scope-discipline` it is parked in the backlog with its trigger, not
architected in. **No items were minted by this review.**

---

### The P-A constraint on milestone 2.

**This is the finding with the shortest fuse, and it points upstream of the milestone
round 3 unblocks.**

`standaloneBlockErrors()` must be written **parameterised over a block variant** from
the start, rather than hard-coded to "one block for all non-core agents." The
`kai-directors` router block is milestone 4; `area-plugins-m2-standalone-floor` and
`area-plugins-m2-claim-surface-pin` are **milestone 2**. Hard-coding now means
**reopening a shipped gate later** — cheap now, expensive later.

Independently reinforced by F-1's sibling finding: the claim-surface pin must be
written **provider-side**, quantifying over what a pack *provides* rather than what
its agents *inherit*. Both constraints land in the same two milestone-2 items and
should be sequenced together.

**Routed to `principal-swe-manager` → steward for sequencing. Recorded in the north
star. Not minted here** — minting is the steward's promotion pass, and this amendment
is a scope record, not a dispatch.

**Unchanged by this amendment.** Mission, vision, all fourteen non-negotiables,
scope `targets`, every `out_of_scope` bullet, every `deferred` entry and its trigger,
the milestone order, and all eight critical operator decision boundaries — **#1 now
checked and confirmed NOT tripped**; #2–#8 concurred with round 3. A1–A26 stand as
written, with the two corrections above named explicitly rather than silently
overwritten.

**No production code, manifest, marketplace, script, skill, or agent body was
modified in this pass.** Zero writes to `scripts/`, `packs/`, `plugin.json`,
`agents/`, `skills/`, or `kai/initiatives/pack-split/**`.
`area-plugins-m2-claim-surface-pin` and `area-plugins-host-tool-conformance` were
**not edited**.

---

### A28 — The measure-before-migrate stop is LIFTED, milestone 0's outcome is AMENDED to what the evidence supports, and backlog P5(a) is PROMOTED.

**Supersedes the corresponding clauses of A23.** A23 stands as the record of what
was known on 2026-08-27; where this amendment differs, this one governs. Nothing
in A23 is rewritten.

Written while adjudicating `principal-swe-architect`'s CHANGES REQUESTED review
of `f093c5a2678ee1ecf9c25a88015110a1fbd057cd`
(`kai/coordination/threads/area-plugins-tool-allowlist-fix.md`, REVIEW
2026-08-28-0112). That review requested **zero code changes in the 214
declaration files** — its three P0s were an authorization question, an efficacy
question, and a scope-promotion question, two of which it routed to me and one to
the operator.

#### 1. The §12.4 stop condition is LIFTED, on recorded operator authority

The conformance decision's §12.4 barred selecting any §7.2 branch and authoring
any declaration migration, because `findings.warning_free_spelling_exists` is
`null`. **It is lifted, with provenance:** the operator, after brainstorming the
area-plugin architecture, said *"Yes I like that, lets use actually 'plugins'
for the folder naming I wanted to suggest that also, the rest I like. Please
proceed"*, then directed explicitly that the tool warnings be fixed and the work
proceed one by one; and the implementation sequence recorded **after the probe
shipped as `[1.0.5]`** directs migrating the root agents and skills while
preserving capabilities. That instruction post-dates the evidence that raised the
stop.

**A lift, not a bypass. Four grounds, and the third decides it:**

1. **A23 conditioned the fix on a replacement "proven safe by the probe" —
   *safe*, not *effective*.** The probe closed safety on `1.0.79` and `1.0.81`,
   direct and delegated. `f093c5a` replaces and never deletes.
2. **A23's constraint 1 held.** The probe was the first implementation and
   reported before any body was edited.
3. **The stop is structurally unliftable by engineering.** Decision §12.3: prompt
   mode cannot reproduce the interactive startup warning surface. No measurement
   any agent can run will ever produce `warning_free_spelling_exists`; only the
   operator, on an interactive launch, **after an install**. A gate clearable
   only by observing the deployed result of the change it blocks is a deadlock,
   and sitting inside it would be process theatre wearing restraint's clothes.
4. **The residual risk is the operator's to accept and is bounded.** It is
   **efficacy** — a warning may persist — not **capability**, which was measured
   and closed.

**Bounded to the declaration migration.** It authorizes nothing about topology,
plugin identity, marketplace naming, or the milestone-1 bar; the A11 three-clause
carve-out still binds and is still unclaimed.

#### 2. Milestone 0's outcome is AMENDED — and I am naming the shrink rather than letting it pass

The reviewer's P0-1 is correct and I verified its premise myself: **`edit`, one
of the three reported warning names, survives on 55 of 56 agents and 29 of 51
skills.** On this initiative's own evidence the change is **predicted not to
silence the `edit` warning**.

| reported warned name | after `f093c5a` | label |
|---|---|---|
| `create` | folded into `edit`; zero declarations remain | `observed` |
| `grep` | replaced by `search`; zero declarations remain | `observed` |
| `edit` | retained deliberately as the documented primary alias | may still warn — `unobserved` |

**The amended outcome:** the declarations are correct and runtime-safe, capability
is intact, two of three warning spellings are eliminated, and **interactive
warning silence is `unobserved` — collected by the operator after deployment, as
`shipped`-gate evidence, never as a merge gate. No noninteractive proxy is
required, because none is possible.**

**The pre-commitment that matters most.** If `edit` still warns post-install, the
disposition is **not** another declaration change. Re-spelling `edit` would mean
declaring an undocumented name to quiet a validator that disagrees with its own
documentation — the exact defect this milestone exists to end. The residue routes
to §7.2 **B2**: document the benign drift with its evidence and file upstream.

**What this costs, stated plainly.** Milestone 0 promised "the warnings stop." It
now promises "the declarations are correct, capability is intact, and two of three
warning spellings are gone." That is a smaller promise. The alternatives were to
claim a silence nobody has seen, or to block indefinitely on an observation that
cannot be made until after we ship. Shrinking the promise to fit the evidence is
the honest move available.

#### 3. `PROPOSAL-3`/backlog **P5(a) is PROMOTED**; **P5(b) stays parked**

A23 deferred both halves. The trigger has fired, and the operator's sequence names
skills explicitly, so **the 102 skill declaration sites move into
`area-plugins-tool-allowlist-fix`** — its `touches` widens to `skills/` and
`scripts/lib/loader-contract.mjs`, and its enumeration box moves from 112 to the
true 214. Part of it was never an independent scope choice: the six
`requires_tools:` lines are mechanically coupled to the agents' `bash`+`shell` →
`execute` move by `validate-plugin.mjs:657-672`.

**P5(b) — deriving the third `SUPPORTED_TOOLS` copy — stays parked** as a
mechanism addition. `f093c5a` edits both copies in lockstep, which is forced
collateral of byte parity, not de-duplication. **No agent may cite this amendment
to build (b).** Promotion record: `kai/initiatives/area-plugins/backlog.md`.

#### 4. What this amendment does NOT do

It does not clear P1-2 (carve-out clauses named, **observed** gates including
`--check` parity), P1-3 (the §7.3 capability-loss disclosure table), or the four
P2s — all `principal-swe-infra`'s, all open. It does not mark the architecture
review satisfied; the recorded verdict stays `changes-requested` with
`satisfies_requirement: false`. It advances nothing toward `shipped`.

**Deviation recorded rather than absorbed:** §7.2's expand → migrate → contract
(PR-A1..A4) collapsed into one commit, so no window exists in which both
vocabularies validate. Accepted as consistent with the operator's "one by one"
pacing at item granularity, with the cost named — the change is still revertible
as a single commit and lockstep versioning holds.

**Unchanged by this amendment.** Mission, vision, all fourteen non-negotiables,
scope `targets`, every `out_of_scope` bullet, every `deferred` entry, the
milestone order, all eight critical operator decision boundaries, and A1–A27.

---
type: initiative
title: Area plugins — nine installable areas over an optional kai-core
slug: area-plugins
status: active
horizon: 2026-Q4
mission: Make each kai area a standalone plugin a person can install and use on its own, with kai-core an optional upgrade that adds durable coordination rather than a prerequisite that gates access.
vision: kai ships from one `kai` marketplace as nine plugins — kai-core, kai-directors, kai-project-management, kai-engineering, kai-product, kai-gtm, kai-learning, kai-assistant, kai-wellness — each installable alone and honest about what it cannot do without core, with kai-core an opt-in upgrade to durable workspace, coordination, fleet, and handoffs, and every 1.0.4 user migrated off kai-plugins / packs/ / kai-personal without stranding.
workspace:
  mode: repository
  root: "."
  run_root: ".kai/runs"
  manifest: ".kai/manifest.json"
scope:
  repos: []
  targets:
    - plugin.json
    - agents/
    - skills/
    - scripts/lib/pack-plan.mjs
    - scripts/lib/preflight-block.txt
    - scripts/lib/degraded-block.txt
    - scripts/lib/migration-doctor.mjs
    - scripts/lib/loader-contract.mjs
    - scripts/host-contract.mjs
    - scripts/pack-preview.mjs
    - scripts/validate-plugin.mjs
    - scripts/release-guard.mjs
    - scripts/workspace-doctor.mjs
    - .github/plugin/marketplace.json
    - .github/workflows/validate.yml
    - docs/getting-started.md
    - docs/reference/plugin-structure.md
    - AGENTS.md
    - the generated committed tree packs/ -> plugins/
    - the marketplace kai-plugins -> kai
  keywords: [area, plugin, optional-core, standalone, dual-path, taxonomy, nine-plugin, kai-directors, kai-project-management, kai-personal, learning, assistant, wellness, marketplace-rename, packs-to-plugins, migration, composability, preflight, tool-allowlist, host-conformance, honesty]
  current:
    - allowlist-repair
    - decisions-locked
  out_of_scope:
    - Rewriting or re-scoping agent and skill content. This initiative relocates agents and re-contracts loading; it does not redesign personas or prose. "Areas" is a packaging word, and packaging work that starts editing agent bodies has left scope. Read with the A1 generator-derived-identity-string exception, not against it.
    - Adding agents or capabilities. No area gets a new agent to make it feel complete, and no area is justified by an agent that does not exist yet. A dedicated principal project/program manager agent is explicitly deferred, not authorized.
    - Adding areas beyond the settled nine (core, directors, project-management, engineering, product, gtm, learning, assistant, wellness). The set is closed at nine by the main-agent override of 2026-08-27-2153, which reversed the steward's A17 closure at seven. Adding a tenth requires a fresh operator decision.
    - Changing membership of kai-engineering, kai-product, or kai-gtm. Net moves out of those three remain zero — the mechanically welded release workflows (workflow-ship, workflow-pull-request, workflow-issue-analysis) stay in kai-engineering and round 2's weld finding is upheld, and kai-product keeps discovery, scope, design, strategy, analytics, feedback, and experiments. Only kai-personal dissolves and only kai-core decomposes.
    - Naming a marketplace after an area, or creating a plugin named kai.
    - Changing the host or upstream to add native plugin-dependency declarations; kai supplies prompt-level and CI-level guarantees only.
    - Per-plugin independent semver. Lockstep versions stand.
    - Rewriting historical records to match the new vocabulary — CHANGELOG.md, kai/library/releases/**, kai/coordination/**, kai/initiatives/** are history, not surfaces.
    - Modifying anything under kai/initiatives/pack-split/**. That initiative is shipped and stays closed.
    - Renaming agent roles (director-chief-of-staff, director-executive-assistant and the eleven other candidates). Accepted as a PROPOSAL for a separate initiative after migration-complete (A20); plugin identity and agent identity must not move in the same window.
    - "Distributed multi-PC agent communication. Recorded externally as GitHub issue #192 and proposal-only; its output is a security assessment, not a delivery commitment. No area-plugins milestone may depend on it and nothing it proposes enters delivery scope without a fresh operator decision."
    - The four workspace-corpus concerns (storage modes, initiative archive semantics, backlog destination, design-output paths). Split out to the proposed initiative workspace-corpus-contract, which is NOT yet ratified and awaits operator go/no-go.
  deferred:
    - Per-area independent versioning. Revisit when the area set has been stable for a full release cycle and one area needs a cadence the others do not. Inherited from pack-split.
    - A richer onboarding "area selector" beyond a truthful install list. Revisit after migration-complete, when the area set stops moving. Building a selector against a moving set means building it twice.
    - Durable state for standalone mode (any opt-in local store that outlives a session). Revisit only on evidence that standalone users repeatedly lose work they reasonably expected to keep. Explicitly parked - it reopens the honesty non-negotiable and needs its own operator decision.
    - Broader fleet certification of collision and roster-enumeration behavior beyond the bounded arms. Inherited unchanged from pack-split.
    - Fleet-observer UX redesign. Revisit when the nine P0 concerns are disposed and the plugin topology is locked (round-3 taxonomy accepted). Intake record is the unaffiliated area-plugins-fleet-observer-ux.
    - A dedicated principal project/program manager agent for kai-project-management. Revisit after area-taxonomy-split ships and the plugin has been live for a release cycle, or earlier on evidence that the three seeded workflows cannot carry the job. Named a later question by the 2026-08-27-2153 override; inventing it now would violate the "adding agents" out_of_scope bullet.
    - Role renames as a separate successor initiative after migration-complete (A20). director-delivery is provisionally accepted; director-agenda is rejected under naming constraint C4. Blast radius 57 occurrences across 21 root files, 2 file renames, 2 name fields, 4 asserted script literals.
principles:
  non_negotiable:
    - plugins/ is the artifact directory name. "Areas" is product language only — it never names a directory, a marketplace, or a manifest field.
    - Host syntax <plugin>@<marketplace> is fixed. There is exactly one marketplace and it is named kai, yielding kai-engineering@kai. No marketplace is named after an area; no plugin named kai is ever created.
    - kai-personal is dissolved, not renamed. Every successor area must state its job in one sentence without the word "and" doing structural work. A catch-all is not an area.
    - kai-core is an optional structured-experience upgrade. No area agent may require core in order to load.
    - With no core installed, an area agent offers exactly two honest paths — install core for durable workspace/coordination/fleet/handoffs, or continue in standalone mode. It never takes a silent third path.
    - Fail-closed is relaxed for loading only, never for claims. Standalone mode uses session/temp state only; it never creates or impersonates a canonical .kai workspace; and it explicitly disclaims durable coordination, fleet visibility, leases, handoffs, and shipped-state claims.
    - "Installing core later activates full mode in a fresh session, and the transition is truthful: prior temp state is never presented as durable, never retroactively promoted, and never counted as evidence."
    - "Several installed areas compose without ambiguity: unique skill IDs, exactly one provider per skill, exactly one hooks.json owner, generated-root determinism, and byte-parity --check preserved."
    - No 1.0.4 user is silently stranded, and old and new plugin identities never coexist in one workspace. The derived legacy-rollback forbidden set continues to cover every publishable identity, old and new.
    - Small reviewable PRs and lockstep versions. Each milestone is independently shippable and reversible; a milestone may span more than one release, but every release must be revertible on its own.
    - Root agents/ and skills/ stay the single source of truth. Plugin trees are generated and committed, never hand-carved.
    - No new plugin identity is published under a marketplace name or an operating contract that has already been decided to change.
    - pack-split is shipped and closed. Nothing under kai/initiatives/pack-split/** is modified, and no rename rewrites historical records.
    - "BOUNDED EXCEPTION — kai-directors standalone. kai-directors is an executive routing layer, not a department: the human is CEO and its two agents are the front doors over the other plugins. With no core installed it MAY perform read-only discovery and routing, and MAY offer to install core. It MUST NOT (a) claim leases, (b) create canonical coordination records, or (c) impersonate full delivery. With core installed it gains durable orchestration. This exception is bounded to kai-directors and to exactly those three prohibitions; it is #6 restated at that plugin's boundary, not a relaxation of it. No other plugin may cite it, it grants nothing beyond read-only routing plus an install offer, and widening it — or extending it to a second plugin — is a fresh operator decision, not a design refinement."
proposal_channel: kai/initiatives/area-plugins/backlog.md
created: 2026-08-27
owner: principal-product-manager
related: [pack-split]
success_measures:
  - measure: An area plugin is usable with no core installed.
    baseline: 0 of 4 department plugins are usable standalone — every generated non-core agent carries the byte-pinned preflight and replies exactly KAI-CORE-MISSING when core is absent (grounded 2026-08-27 by file read; reported, not observed).
    target: "Every area plugin loads and works standalone, 100% of standalone entries present the two honest paths, and core-required load failures are zero. Named exception, carried openly rather than scored away — kai-directors satisfies this measure by loading, presenting the two honest paths, and performing read-only discovery/routing plus an install offer under non-negotiable #14. It is not counted as a fully useful standalone area, and the measure says so."
  - measure: Standalone mode is structurally incapable of producing durable state, and says so (A2 restatement; the original "never makes a false durability claim" was unfalsifiable once standalone became reachable).
    baseline: Not applicable — standalone is unreachable today, so the property is vacuous rather than achieved.
    target: "(a) every skill in CLAIM_SKILLS is provided by core and by no area, and workflow-workspace-init + kai-core-workspace-onboarding stay co-located in core, asserted by --gate partition — and this must still hold with kai-directors and kai-project-management minted; (b) every area agent's standalone path carries all five pinned disclaimers plus the no-retroactive-promotion prohibition, asserted by standaloneBlockErrors(); (c) a materialised area-alone tree contains zero paths under .kai, kai/coordination, kai/initiatives, kai/library and no manifest.json, asserted by --gate partial-install arm B; (d) the core-installed-later transition contains no instruction to read a standalone scratch root. Detection clause, stated because prevention is partial - a substantiated report of a standalone agent asserting durable state is a P0 that reopens critical boundary #1 with a real instance in hand."
  - measure: Partition integrity and area coherence.
    baseline: 56 agents across 5 published plugins at v1.0.4, --gate partition last green at 56/56 under pack-split CI. kai-personal is a 9-agent catch-all whose job cannot be stated in one sentence, and kai-core is a 7-agent mix of two front-door routers, three coordination workflows, and two workspace-machinery workflows (verified this pass at scripts/lib/pack-plan.mjs:63-70).
    target: "All 56 agents and all 51 skills in exactly one of nine plugins, every skill with exactly one provider, gates green by construction at the new plugin count, and every area's job stated in one sentence with no structural and — including kai-directors and kai-project-management, which owe that sentence like every other area. Catch-all count: 0."
  - measure: Cost of a focused install.
    baseline: To reach the 2 wellness personas today a user installs kai-core (7 agents) + kai-personal (9 agents) = 16 agents, core mandatory. Learning is the same 16 to reach 4 agents.
    target: kai-wellness standalone = 2 agents with no required core (16 -> 2); kai-learning standalone = 4 agents (16 -> 4). Additionally, the nine-plugin decomposition lowers the coordinated-install floor - kai-core's current 7 agents split 2 (kai-directors) + 3 (kai-project-management) + 2 (technical core, workflow-workspace-init and workflow-self-check), so a core-only install falls from 7 agents to 2. That arithmetic is fully determined by the 2153 override and verified against PACKS this pass; the skill split is not determined and is round 3's to place.
  - measure: No 1.0.4 user is stranded.
    baseline: 5 plugins live at 1.0.4 under marketplace kai-plugins with installSurface packs; migration-doctor recognises exactly one marketplace name and kai-personal as a valid identity.
    target: Every 1.0.4 identity has a doctor-verified path to its successor; old and new never coexist installed; the derived legacy-rollback set covers 100% of publishable identities old and new — now nine new identities rather than seven; silent stranding paths 0.
milestones:
  - id: allowlist-repair
    outcome: The repo's tool-allowlist contract is grounded in measured host behaviour instead of hand-maintained guesswork, every kai agent and skill declares the documented primary-alias vocabulary, no agent or skill loses a capability to achieve it, and the warning outcome is claimed only at the precision each channel permits. AMENDED 2026-08-28-0125 (scope-brief A28) — the prior clause "the repeated Unknown tool name warnings are gone" promised an outcome no pre-ship observation can establish; the reported spellings create and grep are eliminated (observed), edit is retained deliberately as the documented primary alias and may still warn, and interactive-startup warning silence is unobserved until the operator observes it after deployment. Led by the conformance probe, not by a rename.
    acceptance:
      - The documented vocabulary is recorded verbatim as the baseline — primary aliases execute, read, edit, search, agent, web, todo; compatible aliases shell/Bash/powershell, Read/NotebookRead, Edit/MultiEdit/Write, Grep/Glob, custom-agent/Task; unrecognized names ignored (official GitHub documentation, observed 2026-08-27).
      - The live conformance probe is the FIRST implementation. No agents/** or packs/** body is edited before it reports. The probe distinguishes accepted-by-validator from granted-at-runtime, because the operator's live CLI warns on lowercase create, edit and grep even though edit and Grep are documented aliases and runtime capability remains — that validator/runtime drift is the defect.
      - No capability is stripped to quiet a log. The replacement follows from probe evidence and not before; where a warned name has no accepted equivalent that preserves the capability, the record says so, and a replacement that removes capability is a capability-loss disclosure and a steward call, not an editorial one. CORRECTED 2026-08-28-0125 (A28) — this bullet formerly said "the smallest warning-free replacement". No warning-free replacement was ever demonstrated to exist: edit is both a documented primary alias and a reported warned name, so the replacement is the smallest CORRECT one, and the warning residue is handled under the amended warning-outcome bullet below rather than by chasing an undocumented spelling.
      - tools ['*'] and omission are weighed against least privilege and a recommendation is recorded. Neither is assumed acceptable.
      - loader-contract.mjs's false "single source of truth for how a Copilot host parses frontmatter" claim is corrected, and all three copies of SUPPORTED_TOOLS are accounted for — root, the packs/kai-core generated mirror, and any other.
      - The complete surface is enumerated and shown, not sampled — 214 declaration sites (56 root agents + 56 generated agent mirrors + 51 root skills + 51 skill mirrors), not the 112 first assumed.
      - Generated trees are regenerated, pack-preview --check byte parity holds, and --gate partition, collision, partial-install and version-skew are green.
      - "The warning outcome is recorded at the precision each channel permits — AMENDED 2026-08-28-0125 (A28), replacing 'the warnings are reported gone against a stated observation method'. Three separable claims, each labelled: (a) create and grep appear in zero kai declarations, observed by repo-wide search; (b) edit is retained deliberately as the documented primary alias and may still warn, stated rather than hidden; (c) whether any interactive-startup warning remains is UNOBSERVED and is collected by the OPERATOR after deployment, by launching a kai agent interactively and reading the startup warnings. (c) is shipped-gate evidence, never a merge gate, and no noninteractive proxy for it may be invented — prompt mode structurally cannot reach that channel (conformance decision 12.3). A residual edit warning routes to branch B2 (document the drift, file upstream); it does not reopen the migration, because re-spelling edit would mean declaring an undocumented name to quiet a validator that disagrees with its own documentation."
      - "The measure-before-migrate stop condition (conformance decision 12.4) was LIFTED on recorded operator authority on 2026-08-28-0125, with provenance in scope-brief A28 and in the tool-allowlist thread. The lift is bounded to the declaration migration and authorizes nothing about topology, plugin identity, marketplace naming, or the milestone-1 bar. The residual risk accepted is efficacy — a warning may persist — never capability, which the probe measured and closed on 1.0.79 and 1.0.81, direct and delegated."
      - Topology-neutral - the change alters no PACKS, PACK_ORDER, PACKS_DIR, MARKETPLACE, SKILL_OWNER_OVERRIDES, plugin identity, marketplace name, or preflight/degraded/inherits block content.
    success_measures:
      - none. Stated plainly - this milestone does not advance the mission. It is here because it is a live defect in shipped agents and because it collides head-on with milestone 2's PR-3, the one large diff that rewrites every non-core agent body. Two whole-fleet rewrites must not be in flight at once.
    required_items:
      - item: area-plugins-host-tool-conformance
        state: shipped
      - item: area-plugins-tool-allowlist-fix
        state: shipped
  - id: decisions-locked
    outcome: The product scope is authoritative and the three architecture questions — optional-core contract, area taxonomy, migration — are answered in reviewed decision records, before any generator, manifest, or marketplace change is made.
    acceptance:
      - This scope brief is complete and its non-negotiables are carried into this north star.
      - area-plugins-optional-core-architecture is completed - it names what replaces the injected preflight, defines standalone state and the core-installed-later transition, preserves composability, and states which CI gates change and what each asserts afterwards.
      - area-plugins-taxonomy-round-3 is completed - all 56 agents and all 51 skills placed in exactly one of the nine plugins, every skill with exactly one provider, the kai-directors standalone exception's mechanical consequences resolved rather than deferred, and each area's one-sentence job stated. Rounds 1 and 2 are superseded history and are not rewritten.
      - area-plugins-migration-architecture is completed - marketplace rename mechanism, kai-personal fate, doctor recognition of both identities, and the derived legacy-rollback coverage are all decided, now across nine successor identities.
      - "No production code, manifest, or marketplace change has been made THAT IMPLEMENTS OR PRESUPPOSES THE AREA TOPOLOGY (A11 carve-out). A change is exempt iff it (i) is topology-neutral as defined in allowlist-repair's acceptance; and (ii) alters no preflight-block.txt, degraded-block.txt or inherits-block.txt content; and (iii) is proven green under the existing gates with --check byte parity re-established. Every other production change remains barred until this milestone closes. A change that cannot claim all three clauses is not exempt — it escalates to the steward."
    success_measures:
      - all five measures — this milestone is where they become falsifiable rather than aspirational.
    required_items:
      - item: area-plugins-scope-brief
        state: completed
      - item: area-plugins-optional-core-architecture
        state: completed
      - item: area-plugins-taxonomy-decision
        state: completed
      - item: area-plugins-taxonomy-round-2
        state: completed
      - item: area-plugins-taxonomy-round-3
        state: completed
      - item: area-plugins-migration-architecture
        state: completed
  - id: optional-core-contract
    outcome: The dual-path standalone/full contract is built and CI-enforced at root, against the existing five-plugin topology, with no plugin identity created, renamed, or retired.
    acceptance:
      - Every generated non-core agent offers the two honest paths when core is absent, and none refuses to load for that reason alone.
      - Standalone mode is proven, in CI, to use session/temp state only — it creates no path that a workspace doctor would read as a canonical .kai workspace.
      - CI asserts the standalone disclaimer covers durable coordination, fleet visibility, leases, handoffs, and shipped-state claims; any place fail-closed is deliberately relaxed is named with its replacement guarantee. "Removed" is not an acceptable disposition.
      - The core-installed-later transition activates full mode in a fresh session and never presents prior temp state as durable.
      - The planPacks() kai-core- prefix fix (D3) lands as a named deliverable of this milestone, byte-neutral and gate-neutral, as its own commit — sequenced with, never inside, the large agent-body diff. Milestone area-taxonomy-split is gated on it having shipped (A3/S1, A3/S2).
      - "No shipped kai diagnostic asserts that kai-core is required, and none classifies an install as invalid on the sole basis of core's absence. (i) Unconditional - migration-doctor's partial-pack-set finding and every remediation step state both branches truthfully; no shipped string asserts core is mandatory. (ii) Default, defeasible only as stated in A5 - a core-absent-only install is not reported as invalid; the mechanism is the Spike's and the architect's call. If principal-sre returns BLOCK/NOT-READY on (ii), that verdict stands unrelabelled, (i) still ships here, and (ii) escalates to the operator with surface-rename as its home."
      - --gate partition, collision, partial-install, version-skew and --check are all green, with each changed gate's new assertion documented.
      - Ships on the existing five identities under the existing marketplace name; revertible by reverting the generator and regenerating.
    success_measures:
      - An area plugin is usable with no core installed.
      - Standalone mode is structurally incapable of producing durable state, and says so.
    required_items:
      - item: area-plugins-m2-decomposition
        state: completed
      - item: area-plugins-m2-standalone-copy
        state: completed
      - item: area-plugins-m2-planpacks-prefix
        state: shipped
      - item: area-plugins-m2-standalone-floor
        state: shipped
      - item: area-plugins-m2-claim-surface-pin
        state: shipped
      - item: area-plugins-m2-mode-selection
        state: shipped
      - item: area-plugins-m2-standalone-proof
        state: shipped
      - item: area-plugins-m2-doctor-standalone
        state: shipped
      - item: area-plugins-m2-docs-two-modes
        state: completed
  - id: surface-rename
    outcome: The generated tree is plugins/ and the marketplace is kai, executed against the stable five-plugin set with the dual-path contract already in place.
    acceptance:
      - PACKS_DIR remains the single source of truth for the tree name, and the five known literals that do not follow it are fixed - .github/workflows/validate.yml, release-guard.mjs BEHAVIOR_PREFIXES, docs/getting-started.md, docs/reference/plugin-structure.md, AGENTS.md.
      - migration-doctor (MARKETPLACE) and workspace-doctor --migration-check recognise both the old and new marketplace identities, classifying clear / blocked / unknown correctly through the transition — including whatever status disposition the milestone-2 Spike selects for a core-absent-only install (A5 companion line), which is also the declared home for A5 part (ii) if deferred or SRE-blocked.
      - The derived legacy-rollback forbidden set covers every publishable identity under both names.
      - No marketplace is named after an area; no plugin named kai exists.
      - Historical records are untouched.
      - The folder move and the marketplace rename do not land in the same PR.
    success_measures:
      - No 1.0.4 user is stranded.
    required_items: []   # UNMINTED — no item record exists for this milestone today.
                         # See "Required-items status" below. This milestone cannot
                         # close until items are minted; an empty list is a gate, not
                         # a formality.
  - id: area-taxonomy-split
    outcome: The nine-plugin topology is realised — kai-personal dissolved into kai-learning, kai-assistant and kai-wellness; kai-core decomposed into kai-directors, kai-project-management and a technical core — with every new identity born at @kai, under plugins/, carrying the final dual-path contract.
    acceptance:
      - The memberships settled by area-plugins-taxonomy-round-3 ship unchanged, with all 56 agents and all 51 skills placed exactly once across the nine plugins.
      - "kai-directors carries the two front-door routers and its standalone path implements non-negotiable #14 exactly - read-only discovery/routing plus an install offer, and none of the three prohibited operations."
      - kai-project-management is seeded from workflow-initiative-init, workflow-weekly-pulse and workflow-proactive-scan; workflow-workspace-init and workflow-self-check stay in the technical core; workflow-ship, workflow-pull-request and workflow-issue-analysis stay in kai-engineering.
      - Every agent is in exactly one plugin and every skill has exactly one provider; --gate partition and --gate collision are green BY CONSTRUCTION, not by exception. Condition C5 binds - the provider map, the 56/51/9 reconciliation and both gate outcomes must be OBSERVED green before merge, never carried forward as `reported`.
      - Each area's job passes the one-sentence test; no successor is a catch-all.
      - hooks.json still has exactly one owner after the routers leave core.
      - "No agent or skill body was rewritten to make the taxonomy work, with one bounded exception - generator-derived identity strings (A1). An edit is permitted iff every edited span is (i) a plugin identity, marketplace name, install command or provider-root placeholder mechanically derived from PACKS / PACK_ORDER / packPluginName() / MARKETPLACE; and (ii) asserted by a CI check deriving the expected literal from those same constants; and (iii) changes no instruction, judgment, persona, capability, procedure or example semantics. A body edit that cannot name a deriving check is not exempt — it escalates to the steward."
    success_measures:
      - Partition integrity and area coherence.
      - Cost of a focused install.
    required_items: []   # UNMINTED — no item record exists for this milestone today.
                         # Three constraints are BINDING AT MINT TIME: (1) a typed
                         # edge on area-plugins-m2-planpacks-prefix requires: shipped
                         # (A3/S1, A7); (2) items are minted against ROUND 3, never
                         # rounds 1 or 2; (3) area-plugins-readme-clarity must not
                         # merge before the new identities are published (A14).
  - id: migration-complete
    outcome: Every 1.0.4 user has a proven path onto the new topology, the retired identities are gone rather than coexisting, and the initiative's claims are bound to production evidence.
    acceptance:
      - kai-personal is retired, superseded, or redirected per the migration record, with uninstall-first and coexistence-refused preserved.
      - No old identity remains installable, and no workspace can end up with an old and a new identity loaded together.
      - A doctor run on a real 1.0.4 install reaches clear on the new topology.
      - The README and install surface are truthful against the FINAL nine-plugin taxonomy - concept, install surface, marketplace syntax, standalone vs coordinated modes, and the plugin taxonomy, all five simple and truthful.
      - The success measures are re-measured against their baselines and recorded.
      - "Closure evidence exists - a non-empty deliverables.md and director-summary.md, with every milestone's typed required_items mapping non-empty and every item at its declared terminal state."
    success_measures:
      - No 1.0.4 user is stranded.
    required_items:
      - item: area-plugins-readme-clarity
        state: shipped
---

# Area plugins — nine installable areas over an optional kai-core

Thin core for the initiative. The authoritative decision history — the accepted
product scope and every amendment A1–A21 — lives in
`kai/coordination/threads/area-plugins-scope-brief.md`, which was the durable
record while this directory could not be created. This file is the **promotion**
of that brief, not a fresh draft. Where the two differ, the difference is named
below and this file governs.

## Why

`pack-split` shipped `v1.0.4`: five plugins over a **required** `kai-core`, with
a byte-pinned preflight that makes every non-core agent reply exactly
`KAI-CORE-MISSING` when core is absent. That guarantee was correct for a
department split. It is wrong for an **area** product, where a person who wants
two wellness personas should not have to install 16 agents and a coordination
system to get them.

So the contract inverts: `kai-core` becomes an **optional** upgrade. The
load-bearing reframing, and the thing every downstream decision inherits:

> **Fail-closed is relaxed for _loading_, never for _claims_.** Today the
> refusal fires on load. Tomorrow it fires on assertion. The guarantee does not
> shrink — it moves from *"you may not run"* to *"you may run, but you may not
> claim durable state."*

An optional-core design that lets an area agent run without core but cannot
mechanically prevent a false durability claim has not satisfied this initiative.
It has traded a mechanical guarantee for a prompt-level hope.

## The area-set reversal, named

**Amendment A17 (2026-08-27-2138) closed the area set at seven.** It declined
`kai-directors` on four grounds — the decisive one being that it failed
non-negotiable #3's one-sentence job test, the same test that dissolved
`kai-personal` — and declined `kai-project-management` on the ground that the
requested department already exists on the job axis as `CATEGORIES` →
`Intake & delivery`, holding exactly the proposed membership, while those three
`workflow-*` agents are mechanically immovable on the install axis.

**The main agent overrode both declines on 2026-08-27-2153. The set is nine.**
That override is settled and is not relitigated here. What it reverses, stated
plainly rather than allowed to pass silently:

| A17 said | The override says |
|---|---|
| Area set **CLOSED at seven**; both `out_of_scope` bullets restored to original text | Area set is **nine**; the "settled set" bullet is rewritten to name all nine |
| `kai-directors` **DECLINED** | `kai-directors` **ACCEPTED** as an executive routing layer, not a department, with a bounded standalone exception (non-negotiable #14) |
| `kai-project-management` **DECLINED**; the job lives on the catalog axis | `kai-project-management` **ACCEPTED** as a product boundary, seeded from the core coordination workflows |
| Measure #1 "needs no carve-out, because no plugin that cannot be standalone is being minted" | Measure #1 **carries a named exception** for `kai-directors`, exactly as A17's own handoff predicted a reversal would require |
| Round 2 is the final position; round 1 `superseded-final` | Round 2 is **also superseded**; `area-plugins-taxonomy-round-3` is the final position |
| A19/P2 proposed making the project-management job legible **on the catalog axis instead of** minting a plugin | P2's premise is superseded — the plugin is minted. Its catalog-legibility half survives and stays parked |

Two things the override does **not** reverse, and they are load-bearing:

- **The weld finding stands.** `workflow-ship`, `workflow-pull-request` and
  `workflow-issue-analysis` stay in `kai-engineering`. `kai-project-management`
  is seeded from `workflow-initiative-init`, `workflow-weekly-pulse` and
  `workflow-proactive-scan` instead.
- **`kai-product` keeps its nine.** Discovery, scope, design, strategy,
  analytics, feedback and experiments stay. Net moves out of `kai-engineering`,
  `kai-product` and `kai-gtm` remain **zero**.

**Where the reversal creates work, not just a decision.** Under seven plugins
A17 narrowed the `planPacks()`/`namespaceErrors()` seam defect (D3) to a single
fracture. Under nine it widens again, and the arithmetic is verifiable from
source. `kai-core`'s seven agents are exactly
`director-chief-of-staff`, `director-executive-assistant`,
`workflow-workspace-init`, `workflow-self-check`, `workflow-proactive-scan`,
`workflow-weekly-pulse`, `workflow-initiative-init`
(`scripts/lib/pack-plan.mjs:63-70`). The override splits them 2 / 3 / 2. Every
`kai-core-*` skill whose only consumer leaves core becomes a
department-provided `kai-core-`-prefixed skill and turns `--gate partition` red.
Read directly this pass: `kai-core-decision-brief` and
`kai-core-executive-consultation` are inherited by
`director-executive-assistant` alone; `kai-core-personal-agenda`'s only two
consumers are `director-executive-assistant` and `workflow-proactive-scan`,
which under the override land in *different* new plugins and therefore leave a
core skill with **no core consumer**. **Enumerating the complete fracture set is
`area-plugins-taxonomy-round-3`'s job, not this file's** — these three are cited
as evidence that the set is non-empty, and every claim here is `reported`, never
`observed`, because no agent in this session has a shell.

**One obligation the override inherits.** A17's decisive ground against
`kai-directors` was the one-sentence job test. The override supplies the job —
*an executive routing layer whose two agents are the front doors over the
departments* — and round 3 owes that sentence in a form that passes
non-negotiable #3. If it cannot be stated without a structural "and", that is a
finding to report to the operator, not something to wave through. The same
obligation binds `kai-project-management`.

## The four OWED items — CLOSED (steward acceptance 2026-08-27-2240)

`area-plugins-taxonomy-round-3` is `completed`, accepted by
`principal-product-manager` under its declared `scope-acceptance` review
(`REVIEW 2026-08-27-2240` in `kai/coordination/threads/area-plugins-taxonomy-round-3.md`).
The canonical record is
`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-3.md`.
Each claim below was **re-derived independently by the steward from source**, not
accepted on the architect's summary. All `reported`, never `observed` — no shell
existed in this session.

**1. The nine-plugin skill map — SUPPLIED.** All **51** skills placed exactly once:

| plugin | agents | skills |
|---|---|---|
| `kai-core` | 2 | **24** — every `kai-core-*` skill, all 14 `CLAIM_SKILLS`, `hooks.json`, the probe, `lectoria` |
| `kai-directors` | 2 | **0** |
| `kai-project-management` | 3 | **0** |
| `kai-engineering` | 20 | 15 |
| `kai-product` | 9 | 3 |
| `kai-gtm` | 12 | 7 |
| `kai-learning` | 4 | 1 |
| `kai-assistant` | 2 | 1 |
| `kai-wellness` | 2 | 0 |
| **total** | **56** | **51** |

Steward re-derivation: `agents/*.agent.md` → **56**; `skills/*/SKILL.md` → **51**,
of which **24** carry the `kai-core-` prefix; non-core 51 − 24 = 27 = 15+3+7+1+1 ✓.
**With the D3 fix, core's provider set is identical to `1.0.4`'s** — only the seven
skills of the dissolved `personal` pack move. Nine plugins does **not** redistribute
the core namespace.

**2. The complete fracture set — SUPPLIED. Six, not three.**
`kai-core-decision-brief`, `kai-core-executive-consultation`,
`kai-core-initiative-stewardship`, `kai-core-proactive-scan`,
`kai-core-pulse-digest`, `kai-core-content-grounding`.

**`kai-core-personal-agenda` is NOT a fracture** — it has two consumers
(`director-executive-assistant`, `workflow-proactive-scan`) landing in two
*different* packs, so `packs.size === 2` and `planPacks()` assigns it to `core` by
topology. **This corrects the claim made earlier in this very file** (see the
paragraph above, which cited it as evidence): green with or without the prefix fix.
The rule is consistent across all seven cases — a `kai-core-*` skill fractures iff
**all** its consumers land in exactly **one** non-core pack.
`kai-core-content-grounding` fractures because all three of its consumers are in
`gtm`, which means it would have gone red at seven plugins too.

**The D3 prefix fix suffices UNCHANGED** — not extended, not replaced. Five of the
six are also `CLAIM_SKILLS` members, so each broke two gates from one cause. The
reverse direction (no non-prefixed skill reaching core) is green **because the weld
was respected**.

**3. The one-sentence jobs — SUPPLIED, and the A17 test applied hard.**

- **`kai-directors` — *"the front door: it decides who should handle what."***
  **PASS, accepted as written.** One job, no structural "and", no catch-all. The
  test did not change; the thing being tested did — a *layer over* departments has
  a complete job statement where a *department* did not.

- **`kai-project-management` — *"maintains the portfolio's operating rhythm."***
  **PASS, as amended by the steward.** Reported rather than smoothed over: the
  architect's proposed sentence — *"makes the portfolio's state visible on a
  cadence"* — **did not pass**. It covers `workflow-weekly-pulse` and
  `workflow-proactive-scan` but **not** `workflow-initiative-init`: minting an
  initiative is a **state-creating** act, not a visibility act, and covering it
  would have required a structural "and". Membership was **not** reopened — it is a
  settled product override, and this was a copy defect, which is product's under A4.
  **Trigger (mirrors L5):** a fourth agent that is not part of the portfolio's
  operating rhythm makes this a catch-all and reopens non-negotiable #3.

- `kai-assistant` — *"the roles whose subject is **you**, not the product."*
  **PASS, but thinnest**; trigger L5 stands.

**4. The `CLAIM_SKILLS` compatibility ruling — SUPPLIED. Membership is UNCHANGED at 14.**

The round-2 dilemma conflated **provider** with **consumer**. `CLAIM_SKILLS`
constrains **who ships** a skill, not who inherits it, and this is mechanical rather
than rhetorical: `namespaceErrors()` (`pack-plan.mjs:1538`) fires on *"`<plugin>`
**provides** skill `<id>`"*, and `planPacks()`/`planAssets()` assign ownership by
consumer-pack **cardinality**. A pack with an empty local provider set cannot violate
a provider-side pin.

Steward-verified structural leg: both director bodies inherit **only** `kai-core-*`
skills and reference **zero** assets, so `planPacks().local.directors` is empty by
construction and `kai-directors` is *two agent bodies and nothing else*. Core-less,
those files are not on disk — the same structural withholding the accepted
optional-core architecture already rests on.

**Operator boundary #1 does NOT trip.** What changes is **disclosure**, not the pin:
clauses **D-1…D-8**, with **D-2** (empty local provider set) making "cannot claim"
structural and **D-7** the one new obligation the exception creates.

**Honesty caveat.** `CLAIM_SKILLS` and `standaloneBlockErrors()` **do not exist in
`scripts/` today** — repo-wide grep returns zero matches outside `kai/` records. They
are milestone-2 constructs from the accepted optional-core architecture, so
"unchanged at 14" is a ruling about a *planned* constant and stays `reported`. The
structural fact it rests on is verified against real shipped source. The consequence:
the pin's arm must be **written provider-side**.

### Steward finding F-1 — D-7 carries an unnamed prerequisite

`DISPATCHING_ROLES = ['director-chief-of-staff']` (`pack-plan.mjs:1620`), and
`availabilityErrors()` is enforced over **every** member in **two** places —
`gatePartition()` (`pack-preview.mjs:1261-1265`) and `validate-plugin.mjs:522-531`.
`director-chief-of-staff` carries all three pinned `AVAILABILITY_RULES` sentences
(`:195`, `:209`, `:211`); **`director-executive-assistant` carries none.**

So **D-7 turns `--gate partition` red with three violations** until
`agents/director-executive-assistant.agent.md` gains those three byte-pinned
sentences. N7 names *"`DISPATCHING_ROLES` +1"* but **no record names the agent-body
edit that must accompany it** — a different change class from the constants edits
N1–N9 describe. **Obligation on N7, not a blocker.** Whichever item lands
`DISPATCHING_ROLES +1` must land the body edit in the same change.

## Already landed (context, not milestones)

- `pack-split` shipped `v1.0.4`: five plugins live under marketplace
  `kai-plugins` with `installSurface: packs`, lockstep-versioned, monolith
  retired.
- Milestone 1's first three decision records are `completed`: the scope brief,
  the optional-core architecture, and the round-1 taxonomy (now
  `superseded-final`). Round 2 is `completed` and superseded by round 3.
- Milestone 2 is fully decomposed into eight typed items plus its decomposition
  record, and the standalone copy deliverable is `completed`.
- `principal-swe-infra` diagnosed the tool-allowlist defect without editing a
  single one of the 214 declaration sites, and found the warned set
  (`create`/`edit`/`grep`) and the actually-broken set (`shell`) are
  **disjoint** — stopping a repo-wide rename that would have stripped real
  capability from 49 agents to quiet a cosmetic log.
- GitHub issue **#192** records the distributed multi-PC agents proposal
  externally. `area-plugins-distributed-agents-proposal` is `completed` with an
  `external_ref` and **no implementation scope enters this initiative.**

## Forward path

Six milestones, in this order:

```text
allowlist-repair -> decisions-locked -> optional-core-contract ->
surface-rename -> area-taxonomy-split -> migration-complete
```

`scope.current` is **two frontiers**, `allowlist-repair` + `decisions-locked`,
and that is not a loosening. They share no target file, no decision and no
artifact: one is a tool-allowlist contract repair, the other is entirely
knowledge work producing records. Nothing in either can be justified by the
other, which is the property the gate actually protects.

The ordering rationale is unchanged and remains the spine of the initiative:
**contract before identity.** `optional-core-contract` alters *what every
non-core agent is*; `area-taxonomy-split` alters *which plugin each agent lives
in*. Ship taxonomy first and the six new identities are minted carrying a
fail-closed refusal we have already decided to remove — publishing a promise we
had decided to break. `surface-rename` also precedes the split, so no new
identity is born into a dying marketplace name. Both follow non-negotiable #12.

`allowlist-repair` is first because it is a live defect in shipped agents and
because it collides head-on with milestone 2's large agent-body diff. Two
whole-fleet rewrites must not be in flight at once. It is now **led by the
conformance probe**, not by a rename: the probe measures what the host actually
accepts and grants, and the smallest warning-free replacement follows from that
evidence. No capability is stripped first.

## Required-items status (steward pass 2026-08-27-2210)

Mapped from the **24 real `area-plugins-*` item records on disk**, not invented.
Nineteen carry `initiative: area-plugins`; four carry
`initiative: workspace-corpus-contract`; one is unaffiliated.

| milestone | required items | current state |
|---|---|---|
| `allowlist-repair` | 2 | **Refreshed 2026-08-28-0125.** `host-tool-conformance` **in-review** at `4d71177` (architecture review approved; `next_role: workflow-ship`; released as `[1.0.5]`, and its item record does **not** yet claim `shipped` — that gap is `workflow-ship`'s to close with real deployment evidence). `tool-allowlist-fix` **in-review** at `f093c5a` (architecture review returned `changes-requested`; steward lifted the §12.4 stop and promoted backlog P5(a) on 2026-08-28-0125; P1-2/P1-3 and four P2s open with `principal-swe-infra`). **Neither is `shipped`, so the milestone cannot close.** |
| `decisions-locked` | 6 | **5 `completed`** — `taxonomy-round-3` **accepted 2026-08-27-2240** (`scope-acceptance`, approved), closing the taxonomy chain; `migration-architecture` **in-review**, 4th reliability pass owed |
| `optional-core-contract` | 9 | 2 `completed`; 7 `ready` behind typed edges |
| `surface-rename` | **0 — unminted** | cannot close |
| `area-taxonomy-split` | **0 — unminted** | cannot close; three mint-time constraints bind |
| `migration-complete` | 1 | `readme-clarity` **proposed** |

**Three reconciliations, named rather than smoothed over.**

1. **Milestone 2 maps nine items, not the eight A7 listed.**
   `area-plugins-m2-decomposition` carries `required_for_milestone: true` in its
   own frontmatter; A7 enumerated only the eight items that decomposition
   *emitted*. On-disk truth wins, so the mapping is nine.
2. **Milestone 1 gains `area-plugins-taxonomy-round-3`.**
   `area-plugins-distributed-agents-proposal` sits in this milestone at
   `completed` but is `required_for_milestone: false` and correctly excluded —
   it is proposal-only, externalised to issue #192.
3. **Two milestones have empty lists and that is the honest answer.**
   `surface-rename` and `area-taxonomy-split` have no item records today. An
   empty typed mapping is a closure gate under
   `kai-core-initiative-stewardship`, so neither can be called done until items
   are minted. Inventing plausible IDs would have produced a mapping that looks
   satisfiable and is not.

## Stewardship

Owner and steward: `principal-product-manager`. Activated (`active`) on
2026-08-27, carried from the operator's direct authorization at 1816 and the
scope accepted at 1839. `kai/coordination/ACTIVE.md` already carries the
`active` row and the two-frontier milestone; it was written before this file
existed and its "north star pending one operator `mkdir`" caveat is now
discharged.

This is a packaging and install-surface change. It has a real user-facing
surface — the standalone-mode copy and the README — and product owns that copy
(A4). It does **not** change flow, hierarchy, navigation or responsive
behaviour, so the `principal-product-designer` step is not implicated.

### Naming constraints carried to the successor initiative (steward, 2026-08-27-2240)

Role renames **cannot ship in `area-plugins`** (R5/F9/A1, not overridden), so
`kai-directors` ships with the shipped ids `director-chief-of-staff` and
`director-executive-assistant`. The steward **upheld** the round-3 rejection of
`director-personal` on all three grounds, the third decisive: core-less, that agent
routes to *anything*, so the name is least true in exactly the mode the standalone
exception exists to preserve. **No third name was minted** — doing so inside a window
where it cannot be exercised would fix product copy against evidence the successor
initiative has not gathered. `director-delivery` is **upheld as the working
candidate, not locked as shipped copy.**

- **C4** — the successor name must read as a *front door for the operator*, covering
  *"who should handle this?"* as well as *"what needs me?"*. It must name the **job**,
  not the audience and not the artifact.
- **C4′** — the successor name must remain true in **router-standalone mode**, where
  the agent's entire capability is discovery and routing. A name that describes only
  what the agent does *with* core fails.

### Milestone-2 constraint from the round-3 acceptance (P-A)

**Accepted, and it is the highest-priority consequence of closing the taxonomy.**
`standaloneBlockErrors()` must be written **parameterised over a block variant** from
the start, rather than hard-coded to "one block for all non-core agents" — otherwise
milestone 4 must reopen a shipped gate to add the `kai-directors` router block.
Independently reinforced by the steward's own finding that the claim-surface pin must
be written **provider-side**. Both bind `area-plugins-m2-claim-surface-pin` and
`area-plugins-m2-standalone-floor`, which are **milestone 2** — upstream of the
milestone round 3 unblocks. Routed to `principal-swe-manager` → steward for
sequencing; **no item was minted by the review.**

**Environment limit, stated rather than worked around.** No agent in this
session has a shell. Every mechanical claim in this file was derived by
**reading source** and is `reported`, never `observed`. Condition **C5** binds
`area-taxonomy-split`: the provider map, the 56 / 51 / 9 reconciliation and both
gate outcomes must be *observed* green before merge, and no downstream record
may upgrade a `reported` claim without a run.

**Critical operator decision boundaries** (from the accepted brief, carried
unchanged except as noted): honesty cannot be mechanised; coherence vs. the
settled area set; a new area as the only coherent home for an agent; a
coexistence window during rename; undetectable stranding; core losing coherence;
any proposal to give standalone mode durable state; any need to modify
`kai/initiatives/pack-split/**` or rewrite history. Boundary #3 is **armed** —
the area set is closed at nine and reopening it is an operator decision.

**One initiative-level decision is outstanding and is not mine.** The
`workspace-corpus-contract` split — the storage-modes, archive, backlog and
design-output contracts — is **proposed and NOT ratified**. Its four items stay
`proposed` with cleared leases and are undispatchable until the operator returns
a go/no-go. Nothing in this initiative depends on that answer.

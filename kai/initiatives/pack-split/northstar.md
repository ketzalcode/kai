---
type: initiative
title: Pack split — kai-core plus department packs
slug: pack-split
status: active
horizon: 2026-Q4
mission: Make kai installable as a required shared core plus selectable department packs, so a project loads only the departments it needs without losing the shared operating contract.
vision: kai ships as kai-core plus individually installable department packs from the marketplace, sharing one always-present operating contract with dependency loss that fails closed, released as 1.0.0.
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
    - scripts/pack-preview.mjs
    - scripts/lib/
    - scripts/generate-catalog.mjs
    - scripts/validate-plugin.mjs
    - docs/proposals/pack-architecture.md
    - docs/reference/plugin-structure.md
    - kai-plugins marketplace
  keywords: [pack, kai-core, plugin, partition, preflight, namespace, degraded-mode, marketplace, migration, split, "1.0.0"]
  current:
    - first-pack-extracted
  out_of_scope:
    - Rewriting or re-scoping agent and skill content; this initiative relocates and guards contracts, it does not redesign them.
    - Modifying the host or upstream to add native plugin-dependency declarations; kai supplies prompt-level guarantees only.
    - Cutting 1.0.0 before the phase-3 gates are met; the number is a stability promise, not a refactor marker.
    - Re-litigating department boundaries or adding packs beyond the agreed five once the partition is locked.
  deferred:
    - Full fleet certification of collision and roster-enumeration behavior. The bounded macOS arm passed on genuine GitHub-hosted Apple Silicon run 33024791572; cloud-host certification remains open after branch task 7160810a-a4e1-43eb-bc97-d6f8e2f53aad provisioned no plugins and was classified indeterminate.
    - A dispatch-probe that fails observably, stronger than roster introspection; noted open in the proposal.
    - Per-pack independent semver decoupled from the core contract version; lockstep for now.
principles:
  non_negotiable:
    - Core is required, never optional, and never shown in the selector — everything depends on core and core depends on nothing. It ships as a separate kai-core plugin, distinct from the legacy kai monolith.
    - The degraded-mode block is a refusal, not a fallback contract; it restates no core rules, so it cannot drift.
    - No contract or skill is duplicated across packs — shared skills live once in core and resolve across the plugin boundary.
    - Core skills carry the owned-namespace kai-core-* prefix; exactly one skill is version-pinned, kai-core-contract-v1.
    - Availability logic tests membership of the read roster, never a model-computed count; a director resolves availability before it takes a lease.
    - Legacy kai is verifiably uninstalled before any pack is installed and the two never coexist in one workspace — the migration doctor proves the uninstall, and detected coexistence refuses rather than proceeds.
    - Root agents/ and skills/ are the single source of truth; department packs are generated from root and committed unpublished — never hand-carved by moving agents out of root — and the generated trees stay unpublished until the marketplace flip.
    - The published monolith stays authoritative until each pack's guarantees pass; generate, validate, and prove one department at a time — never flip all five, or 56 agents, in one unreviewable step.
    - 1.0.0 is reserved for the split; all groundwork ships on 0.x.
proposal_channel: kai/initiatives/pack-split/backlog.md
created: 2026-08-24
owner: principal-product-manager
related: []
success_measures:
  - measure: Per-session discovery-metadata cost for a focused install (core plus one department pack) versus loading the whole roster.
    baseline: Every install today loads all 56 agents and 49 skills, about 13.5k tokens of descriptions present every session.
    target: A core-plus-one-department install loads only that department's agents and materially reduces per-session description tokens against the ~13.5k monolith baseline, re-measured after the Phase 0 metadata trim so prose savings are not credited to the split.
  - measure: Pack agents always bind the correct shared operating contract, never a stale or legacy copy.
    baseline: Guaranteed trivially today by the single-plugin monolith; unproven under cross-plugin composition.
    target: Every pack agent passes the fail-closed kai-core-contract-v1 preflight and binds kai-core-* skill names across install orders, in the preview and in CI.
  - measure: A missing or version-incompatible core fails closed rather than degrading silently.
    baseline: The host provides no dependency integrity — a missing pack degrades silently with no error.
    target: Core-absent and core-version-skew each produce the exact refusal token in the preview and in CI, with zero silent-degradation paths in the tested arms.
  - measure: Partition integrity — every agent and skill is assigned to exactly one pack.
    baseline: The pack-preview --all self-test asserts 56 of 56 agents assigned with none double-claimed and no skill shared by core and a pack, but this is not yet locked as an authoritative reviewed document, and 9 skills are parked in core as a placeholder.
    target: An authoritative locked partition document matches the enforced self-test invariant, dispositions every currently-unplaceable skill, and gates the migration PRs.
milestones:
  - id: partition-lock
    outcome: The five-pack partition is authoritatively documented and validated — every agent and skill assigned to exactly one pack (core or a department), core-shared skills identified, and every currently-unplaceable skill explicitly dispositioned.
    acceptance:
      - A locked partition document lists all 56 agents and every skill by owning pack, with core-shared skills called out.
      - The document matches the scripts/pack-preview.mjs --all self-test invariant — 56 of 56 agents assigned, none double-claimed, and no skill provided by both core and a pack.
      - Every skill the `node scripts/pack-preview.mjs --all` self-test reports as inherited by no agent — the builder's placeholder set (demo-*, fleet-observation, onboard-to-codebase, review-*), taken from the live script output rather than a hard-coded count — is given an explicit keep-in-core or move decision, not left as a placeholder.
    success_measures:
      - Partition integrity — every agent and skill in exactly one pack.
    required_items:
      - item: pack-split-partition-lock
        state: completed
  - id: dependency-guarantees
    outcome: The guarantees the host does not provide are built and CI-enforced on the full --all preview with the monolith still authoritative — a fail-closed preflight, a degraded-mode refusal, owned-namespace core skill names, a cross-pack reference validator, and collision / partial-install tests.
    acceptance:
      - Every generated department-pack agent carries the fail-closed kai-core-contract-v1 preflight in its own body, pinned byte-for-byte in CI; core agents are excluded by contract, and CI errors if a core agent carries it. (Steward amendment 2026-08-25-1803 at milestone closure — "every pack agent" read wider than both the shipped generator and the gate that pins it, which forbid the block in core.)
      - The degraded-mode block is a refusal that restates no core rules, shipped in every generated department-pack agent; core agents are excluded on the same rule and CI errors if one carries it. (Steward amendment 2026-08-25-1803, resolving backlog proposal E1. Whether core needs its own second block for the context-loading case is proposal A1 — open, and a precondition on promoting pack-split-generated-pack-trees, not a claim this milestone made.)
      - Core skills carry the kai-core-* prefix and exactly one skill is version-pinned (kai-core-contract-v1).
      - A cross-pack reference validator plus collision, partial-install, and version-skew tests pass on the --all preview, and core-absent and version-skew each produce the exact refusal token.
    success_measures:
      - Shared operating contract always bound correctly by pack agents.
      - A missing or incompatible core fails closed, never silently degraded.
    required_items:
      - item: pack-split-generator-gates
        state: shipped
      - item: pack-split-preflight-compat
        state: shipped
      - item: pack-split-degraded-refusal
        state: shipped
      - item: pack-split-crosspack-validator
        state: shipped
      - item: pack-split-ci-partition-checks
        state: shipped
  - id: first-pack-extracted
    outcome: One department is generated from the root source of truth as a real installable pack over a required kai-core — committed unpublished, resolving skills across the plugin boundary, proven installable — with a migration doctor that verifiably uninstalls legacy kai before installing packs and refuses coexistence.
    acceptance:
      - A project can install kai-core plus the one department pack and its agents operate with the full contract, resolved across the plugin boundary.
      - That department's pack is generated from root and committed unpublished; root stays the source of truth and nothing is moved out of the monolith.
      - A migration doctor verifiably uninstalls legacy kai before installing packs and refuses coexistence, so no install ends with two copies of a core skill loaded.
      - Onboarding tells the user a freshly installed core is not active until a new session starts.
    success_measures:
      - Per-session discovery-metadata cost for a focused install drops versus the whole-roster baseline.
      - Shared operating contract always bound correctly by pack agents.
    required_items:
      - item: pack-split-generated-pack-trees
        state: shipped
      - item: pack-split-migration-doctor
        state: shipped
      - item: pack-split-host-gates
        state: completed
      - item: pack-split-first-department
        state: shipped
  - id: five-pack-split-shipped
    outcome: kai installs as kai-core plus selectable department packs from the marketplace — all five packs published via the staged 12a/12b/12c release, onboarding is an honest guided installer, the published monolith plugin is retired at the flip, and the split is released as 1.0.0.
    acceptance:
      - kai-core plus engineering, product, gtm, and personal packs are published to the kai-plugins marketplace, and core is never offered in the selector.
      - Before any pack is published, generated pack manifests and runtime dependency resolution are deterministic, lockstep-versioned, and verified against the host installation behavior.
      - Onboarding installs core first, verifies after each step, stops on first failure, and never claims unverified rollback.
      - The release is cut as 1.0.0 via the staged 12a/12b/12c release only after the phase-3 host gates are met, and the published monolith plugin is retired at the flip.
    success_measures:
      - Per-session discovery-metadata cost for a focused install drops versus the whole-roster baseline.
      - Partition integrity — every agent and skill in exactly one pack.
    required_items:
      - item: pack-split-pack-dependency-manifests
        state: shipped
      - item: pack-split-onboarding-installer
        state: shipped
      - item: pack-split-release-12a
        state: shipped
      - item: pack-split-release-12b
        state: shipped
      - item: pack-split-release-12c
        state: shipped
---

# Pack split — kai-core plus department packs

Thin core for the initiative. The authoritative decisions and the measured host
behaviour behind them live in `docs/proposals/pack-architecture.md`; the
partition is computed and self-tested by `scripts/pack-preview.mjs`.

## Why

Every session today loads all 56 agents and 49 skills (~13.5k tokens of
discovery metadata) whether or not a project uses them. Splitting kai into a
required shared `kai-core` plus selectable department packs lets a project load
only the departments it needs, while the shared operating contract stays present
by construction.

The load-bearing unknown — can an agent in one plugin resolve a skill from
another? — is measured and true. The cost is that the host gives composition but
**no dependency integrity**: a missing pack degrades silently. So this
initiative is not "move files into folders" — it is building, at prompt level,
the guarantees the host does not provide.

## Already landed (context, not milestones)

- Core skills renamed to the owned-namespace `kai-core-*` prefix in the monolith
  (22 skills, ~345 inheritance references, ~1,000 mentions). Exactly one skill is
  version-pinned: `kai-core-contract-v1`.
- `director-chief-of-staff` resolves role availability before it grants a lease,
  testing membership of the read roster rather than a model-computed count.
- A live-roster two-pack and full five-pack preview (`scripts/pack-preview.mjs`)
  proves the preflight, cross-boundary skill resolution, collision behaviour, and
  roster enumeration at the full 56-agent roster.

## Forward path

The four milestones above carry the remaining work: lock the partition, build and
CI-enforce the missing guarantees on the preview, extract the first real pack over
a required core, then publish the full five-pack split as `1.0.0`. The monolith
stays authoritative until each pack's guarantees pass.

## Stewardship

Owner and steward: `principal-product-manager`. Activated (`active`) on
2026-08-24 after the steward validated scope against repository evidence (56
agents on disk, the five-pack partition summing 7+20+9+11+9 = 56 and enforced
disjoint by `scripts/pack-preview.mjs --self-test`, 22 `kai-core-*` skills with
exactly one version-pinned) and carried the operator-approved corrections into
the thin core: the separate `kai-core` identity, uninstall-first /
coexistence-forbidden, root-as-source-of-truth with generated-and-committed-
unpublished pack trees, and the staged 12a/12b/12c release. The steward approved
a non-empty typed `required_items` mapping on every milestone. This is a
developer-facing packaging change with no user-facing interaction surface, so the
product-design step is not implicated.

**Required-items status (steward pass 2026-08-25-1803).** `partition-lock` is
**satisfied**: its one required item (`pack-split-partition-lock`) is `completed`
— the locked partition document, accepted by the owning role with the
`independent-architecture` review ratified against `change_ref fd44f4f…`.
**`dependency-guarantees` is now CLOSED.** All five typed required items reached
`shipped` in production: `pack-split-generator-gates` (`v0.58.0`),
`pack-split-preflight-compat` (`v0.59.0`), `pack-split-crosspack-validator`
(`v0.60.0`), `pack-split-degraded-refusal` (`v0.61.0`) and
`pack-split-ci-partition-checks` (`v0.62.0`, merge `b72453f1…`, `main` run
`32916653342` green, production verification 9/9). Two acceptance lines were
**narrowed, not waived**, at closure (see the amendments above): the preflight and
the refusal ship in every generated **department**-pack agent, and CI *errors* if a
**core** agent carries either — so the previous "every pack" wording claimed the
inverse of what the shipped gate enforces. The uncovered case is named rather than
buried: backlog proposal **A1** (does core need its own second block for the
*context-loading* absence?) stays **open**, is unreachable while
`COMMITTED_PACKS = []` and no `packs/` tree exists, and is a **promotion
precondition** on `pack-split-generated-pack-trees`. Decomposition **Open Question
4** (director availability in core) is **closed — complete, no item owed**:
`director-chief-of-staff` carries all three membership rules verbatim and
`availabilityErrors` / `DISPATCHING_ROLES` pin them in `scripts/validate-plugin.mjs`
and in the partition gate.

**`scope.current` advanced to `first-pack-extracted`** in the same pass. Ready
queue: `pack-split-host-semantics-spike` (priority 30 — gates tree generation,
needs an `@operator` host session) then `pack-split-migration-doctor` (priority 40,
promoted 2026-08-25-1803; sole dependency `generator-gates` at `shipped`;
touch-disjoint from the spike). `pack-split-generated-pack-trees`,
`pack-split-first-department` and `pack-split-host-gates` stay `proposed` — the
trees item waits on the spike's go/no-go plus the A1 decision, and the other two
sit behind it. Of the three carried architect caveats: (a) the `fleet-observation`
-> `kai-core-fleet-observation` rename **shipped** in `v0.62.0`; (b) the review-lens
binding stays open and off the first-pack critical path (engineering tree, deferred);
(c) the explicit asset-ownership rule remains owned by
`pack-split-generated-pack-trees`.

**Superseding required-items status (steward pass 2026-08-26-1558).**
`first-pack-extracted` is **OPEN at 3 of 4** typed required items:
`pack-split-generated-pack-trees`, `pack-split-migration-doctor`, and
`pack-split-first-department` are `shipped`; `pack-split-host-gates` is now
`ready` and still owes `completed`. The initiative remains `active` with
`scope.current: [first-pack-extracted]`; no milestone or initiative closure is
claimed. The sole executable queue head is `pack-split-host-gates` (priority
10, `next_role: principal-swe-infra`, lease clear).

The accepted downstream valve is now explicit and typed:
`host-gates (completed) -> pack-dependency-manifests (shipped) ->
onboarding-installer (shipped) -> release-12a (shipped) -> release-12b
(shipped) -> release-12c (shipped)`. `pack-split-pack-dependency-manifests` is
added to `five-pack-split-shipped.required_items`; all downstream records
remain `proposed` while the current milestone is open. Generated trees remain
committed and unpublished, marketplace topology remains the single monolith
source `.`, and no fleet-observer redesign enters this chain.

**Superseding host-gate state (2026-08-26-1702).**
`pack-split-host-gates` is `blocked` at v11 with
`resume_state: in-progress`, lease clear, and `change_ref: null`. The bounded
macOS arm passed on genuine GitHub-hosted Apple Silicon run `33024791572`.
Cloud task `7160810a-a4e1-43eb-bc97-d6f8e2f53aad` provisioned no plugin and is
indeterminate, not a pass. The sole blocking question is
`Q-pack-split-host-gates-04`, operator authorization for one disposable
default-branch consumer fixture with a positive control. The milestone remains
open at 3 of 4, downstream items remain proposed, packs remain unpublished, and
release 12b remains **NO-GO**.

**Superseding host-gate completion (2026-08-26-1805).**
`pack-split-host-gates` is `completed` at v16. Authenticated macOS and genuine
cloud consumer evidence pass; host session records causally bind selected
`kai-personal:persona-self` to its nested core-contract invocation. Independent
SRE review ratified exact `change_ref`
`263452126179dd9f3a61183903a26a90c4d6b1c1` with P0/P1/P2 `0/0/0`.
`first-pack-extracted` has reached 4 of 4 typed required items. The steward must
now reconcile the milestone and decide the next scope transition; downstream
items remain proposed until that pass. Host-gates is GO, packs remain
unpublished, marketplace topology remains N=1 at source `.`, and release 12b
remains NO-GO for its remaining prerequisites.

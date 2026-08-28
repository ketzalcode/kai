# Architecture Review — kai-engineering 1.0.3 publication

**Source:** `kai/coordination/items/pack-split-release-12c-3-engineering.md`
**Date:** 2026-08-27 17:35 local
**Run:** principal-swe-architect
**Initiative:** pack-split
**Change ref:** `27804defe2f5f7fa16c2f5373884691203d21974`
**Verdict:** **APPROVED**
**P0/P1/P2:** **0/0/0**
**Decision (one line):** Endorse the generated `kai-engineering` publication at
the exact implementation ref; it preserves the locked partition, canonical-root
generation seam, cross-pack ownership rules, and ratified **DO NOT BIND**
obligation.

## Context

This review is bound strictly to the implementation commit above, whose parent
is pre-implementation main
`3ccf216109ed296c2ea03e569e1218fbf8839838`. The branch reflog records two later
coordination/review commits; they are not the implementation under review.

I inspected the partition and generator in `scripts/lib/pack-plan.mjs`, the
regenerate-and-diff gate and its mutation arms in `scripts/pack-preview.mjs`,
the generated four-pack trees, all engineering agent/skill paths, the root and
generated `workflow-doc-review` bodies, package manifests/locks, the marketplace
index, CI topology, and the `1.0.3` release surfaces.

## Diagram

The reviewed source-of-truth, generation, ownership, and publication seams:

```text
  canonical root
  agents/ + skills/
          │ read only
          ▼
  ┌──────────────────────────────┐
  │ planPacks + materializePacks │
  │ PACKS + guarded overrides    │
  └──────────────┬───────────────┘
                 │ deterministic copies
       ┌─────────┴─────────────────────────┐
       ▼                                   ▼
  kai-core                           kai-engineering
  7 agents / 24 skills              20 agents / 15 skills
  contracts + hooks once            agent guarantees injected
       ▲                                   │
       └──── allowed dependency seam ──────┘
             own pack or core only
                 │
                 ▼
  marketplace: core + personal + product + engineering @ 1.0.3
```

`workflow-doc-review` keeps the conditional-lens seam:

```text
  root workflow-doc-review
        │ generated copy adds only preflight + degraded refusal
        ▼
  kai-engineering/workflow-doc-review
        ├─ inherits: standing contracts (not the three lenses)
        └─ runtime `skill` dispatch:
             review-dependencies
             review-performance-scale
             review-success-metrics
```

## Forces

- Root `agents/` and `skills/` must remain canonical; generated trees may add
  only the established department-agent guarantee blocks.
- Every agent and skill needs one provider, with no department-to-department
  skill dependency and no duplicate provider.
- This increment publishes exactly engineering: 20 locked agents and the 15
  skills mechanically owned by engineering.
- The three conditional review lenses must remain runtime-dispatched and
  engineering-owned, not loaded unconditionally through inheritance.
- The staged marketplace must expose exactly the four committed packs at one
  lockstep version, while GTM remains unpublished.

## Decisive evidence

- `PACKS.engineering` names 20 agents, and the committed engineering tree
  contains exactly those 20 files. Its 15 skill files are exactly:
  `build-diagrams`, `coding-style`, `doc-review-rigor`,
  `onboard-to-codebase`, `pr-sizing`, `research-before-coding`, and the nine
  `review-*` lenses.
- The four committed trees contain 45 unique agents and 49 unique skills
  (7/24 core, 9/7 personal, 9/3 product, 20/15 engineering). The generator's
  full-partition gate separately covers all 56 root agents, provider
  uniqueness, `orphans === overrides`, and `unplaced === 0`.
- `materializePacks()` reads root bodies, copies skill bodies, injects the two
  canonical guarantee blocks only into department agents, and copies core
  agents unchanged. `checkCommitted()` regenerates the configured slice and
  rejects missing, differing, and unexpected paths; its self-test mutates a
  generated body and manifest to prove drift is detected.
- `collectReferences()` distinguishes inherited, user-invoked, and
  orchestrated paths. `referenceErrors()` permits a skill provider only in the
  caller's own pack or core, while provider-collision and namespace checks
  reject duplicate or misplaced ownership.
- Against pre-implementation main, the canonical
  `agents/workflow-doc-review.agent.md` body is unchanged. Its sole
  `**Inherits:**` line omits `review-dependencies`,
  `review-performance-scale`, and `review-success-metrics`; its dimension list
  still dispatches all three at runtime through the declared `skill` tool.
- The three corresponding `SKILL_OWNER_OVERRIDES` lines are byte-unchanged from
  the base and still map to `engineering`. Only `COMMITTED_PACKS` changes in
  that nearby seam, adding `engineering`.
- `packs/kai-engineering/plugin.json`, `package.json`, and
  `package-lock.json` agree on `kai-engineering` `1.0.3`; the package and lock
  both carry an empty runtime dependency map. The CI runtime matrix is derived
  from the exact four-pack `COMMITTED_PACKS` set.
- Root and generated pack manifests/locks, marketplace metadata and all four
  entries, README status, migration guidance, changelog section, and compare
  link agree on `1.0.3`. Marketplace mode is `packs`, the monolith and GTM are
  absent, and every entry source resolves to the matching generated manifest.
- The supplied full `npm test` pass is bound to the exact implementation
  content. I did not substitute a later coordination head or claim final-head
  CI from that pass.

## Options considered

1. **Endorse the current shape — chosen.** It satisfies every present force
   without adding a seam or changing agent behavior.
2. **Bind the three lenses into `workflow-doc-review`.** Rejected: it violates
   the ratified obligation, turns conditional lenses into unconditional
   context, and solves no placement defect.
3. **Spike or defer the publication shape.** Rejected: the generator,
   committed-tree parity contract, exact ownership sets, and marketplace shape
   are inspectable now; no architecture unknown blocks the call.

## Decision

- **Disposition:** **Endorse**
- **Recommendation:** proceed to `workflow-ship` with this exact implementation
  ref as the architecture-reviewed ancestor.
- **Findings:** P0 = 0, P1 = 0, P2 = 0.
- **What stays the same:** root agent and skill bodies, all pack boundaries,
  runtime lens dispatch, generator behavior, CI architecture, and the
  unpublished GTM boundary.
- **Reversibility:** cheap for this staged marketplace addition; rollback still
  requires the already-reviewed forward-release protocol.

## Handoff / remaining gates

No implementation work is implied. The item stays `in-review`.
`workflow-ship` must still prove reviewed-ref ancestry, records-only
equivalence, and fresh CI at the actual final head before merge. Merge,
isolated-home production probe, tag, and GitHub release remain human-executed
and unverified here.

## Open questions / escalations

None.

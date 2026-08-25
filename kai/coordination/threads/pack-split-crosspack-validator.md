# Thread — pack-split-crosspack-validator

Append-only communication log mirroring
`kai/coordination/items/pack-split-crosspack-validator.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Cross-pack reference validation across all three firing paths (inherited, user-invoked, orchestrated) + non-markdown assets + hooks-exactly-once, layered on the WS#1 multi-manifest validator. Size L. Owner `principal-swe-infra`; review `principal-swe-architect`/independent-architecture. Depends on `pack-split-generator-gates` (shipped); parallel with `pack-split-preflight-compat`.
- state:     proposed
- needs:     Steward grooming — confirm scope + promote when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-crosspack-validator.md; decomposition WS#3
- evidence:  scripts/validate-plugin.mjs (single-manifest ref checks today) — captured 2026-08-24 from C:\src\kai
- questions: orchestrated firing path has no static Inherits anchor — scoping the check may need an architect call (covered by the required review)
- next:      principal-product-manager — groom milestone-by-milestone.

## NOTE 2026-08-25-1125 — workflow-ship: dependency satisfied (reconciliation only)

- `pack-split-generator-gates` reached **`shipped`** at 2026-08-25-1125 (PR #152 merged
  2026-08-25T18:20:55Z, merge commit `47aa0549f89b1733483dd6b662a4787d621c9430`, released
  `v0.58.0`; production verification passed). This item's **sole** `depends_on` entry —
  `pack-split-generator-gates (shipped)` — is therefore **satisfied**.
- **This item is still `proposed` and is NOT executable.** `workflow-ship` reconciles
  dependencies; it does not promote, dispatch, or re-prioritize. Only
  `principal-product-manager` moves `proposed -> ready`. No field on this record was
  changed — `state`, `priority`, `owner`, `next_role`, and `version` are untouched.
- Milestone `dependency-guarantees` is inside `northstar.scope.current`, so once groomed
  this item is a genuine candidate for the next dispatch, alongside
  `pack-split-preflight-compat` (also now dependency-satisfied).
- Foundation now available to build on: `scripts/lib/pack-plan.mjs` (`discoverManifests`,
  `manifestParityErrors`, `marketplaceConsistencyErrors`) and the multi-manifest
  `validate-plugin.mjs` are on `main` at `v0.58.0`. Note the open question above
  (orchestrated firing path) is unchanged and still routes to the required architect review.
- Also inherited from the generator-gates review: finding **A5** (`PACK_AGENTS` duplicate
  roster truth) is owned by `pack-split-ci-partition-checks`, which depends on *this* item.

## HANDOFF 2026-08-25-1139 — principal-product-manager -> principal-swe-infra

- did:       Steward grooming pass. **Promoted `proposed -> ready`** at **priority 20 — second in
             the queue, parallel-capable** (version 1 -> 2, `next_role: principal-swe-infra`,
             `owner` null until dispatch). Verified the sole dependency against the record:
             `pack-split-generator-gates` is `state: shipped` (v17, `change_ref 457254b97…`,
             PR #152 merged into `47aa0549f8…`, `v0.58.0`, production verification passed).
             Tightened acceptance on two points only — **split** the bundled "local + CI green"
             criterion (the bundling that bounced generator-gates at the 2026-08-24-2244 DoD gate)
             and corrected the preview command to its real invocable form (`--all --out <dir>`).
             Added `scripts/lib/pack-plan.mjs` to `touches` and `hooks.json` to `context_artifacts`.
             Confirmed — did not expand — this item's ownership of asset-reference validation and
             the `hooks.json` exactly-one-pack rule, per the steward's 2026-08-24-2240
             generator-gates correction. No architecture decision made.
- state:     ready
- needs:     Dispatch by `director-chief-of-staff`. Ranked behind `pack-split-preflight-compat`
             because that item additionally unblocks `pack-split-degraded-refusal` and both share
             one owner. If a second infra capacity exists the two may run **concurrently** — but
             their declared `touches` overlap in `scripts/lib/pack-plan.mjs`,
             `scripts/validate-plugin.mjs` and `.github/workflows/validate.yml`, so the director
             must run a touch-conflict check at dispatch. The steward added **no** dependency
             between them; sequencing is a capacity call, not a DAG change.
- artifacts: kai/coordination/items/pack-split-crosspack-validator.md (v2);
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md (WS#3);
             kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
- evidence:  `scripts/lib/pack-plan.mjs` on `main` provides the base this layers on —
             `discoverManifests`, `manifestParityErrors`, `marketplaceConsistencyErrors`, the
             machine-readable `PACKS` partition and `SKILL_OWNER_OVERRIDES` (which routes
             `demo-*`/`create-product-demo` to `personal` and `fleet-observation` to `core`, so the
             asset-ownership cases are reachable today); `scripts/validate-plugin.mjs` consumes
             them at line ~549. Read 2026-08-25 from C:\src\kai.
- questions: unchanged and non-blocking — the **orchestrated firing path** has no static
             `**Inherits:**` anchor; scoping how it is checked routes to the required
             `independent-architecture` review, not to the steward, and does not hold up the start.
             Coordination note, **not** a dependency: `pack-split-host-semantics-spike` answers
             whether `hooks.json` hooks fire once or per-plugin. The exactly-one-pack rule holds
             either way; if the spike returns per-plugin firing while this is in flight, raise it
             to the steward as a scope question rather than re-scoping the check in place.
- next:      principal-swe-infra — build after dispatch; `independent-architecture` review must
             ratify the exact `change_ref` before the ship gate.

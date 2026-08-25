---
type: work-item
id: pack-split-crosspack-validator
title: Cross-pack reference validator across all three firing paths + assets + hooks-once
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: ready
resume_state: null
priority: 20
owner: null
next_role: principal-swe-infra
target: pack-split cross-pack reference validation
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - scripts/validate-plugin.mjs
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - hooks.json
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
touches:
  - scripts/validate-plugin.mjs
  - scripts/lib/pack-plan.mjs
  - .github/workflows/validate.yml
depends_on:
  - item: pack-split-generator-gates
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-25-1139
---

## Outcome

Every cross-pack reference validates across all three firing paths — inherited
(`**Inherits:**`), user-invoked (`/skills run`), and orchestrated (agent-to-agent dispatch) —
plus non-markdown asset references (e.g. `scripts/demo-*.mjs`) and the rule that `hooks.json`
is assigned to exactly one pack. Layered onto the multi-manifest validator, wired as a CI gate.

## Acceptance

*Tightened by the steward at promotion 2026-08-25-1139 against the shipped foundation
(`v0.58.0`). One finding-driven change and one command correction, nothing added:
the bundled "local + CI green" criterion is **split** (the 2026-08-24-2244 DoD gate bounced
`generator-gates` for exactly that bundling), and the preview command is written in its real
invocable form — `pack-preview.mjs` usage on `main` is `--all --out <dir>`.*

- [ ] A pack agent's inherited, user-invoked, and orchestrated references all resolve to a
      real provider (core or its own pack) across the plugin boundary, or CI fails with the exact miss.
- [ ] Non-markdown assets referenced by a skill are present in that skill's owning pack; an
      asset referenced across >1 pack is flagged for core.
- [ ] `hooks.json` assigned to exactly one pack (no pack duplicates a hook).
- [ ] Passes on `node scripts/pack-preview.mjs --all --out <dir>`; `npm test` passes **locally**.
- [ ] The new CI step runs **green on the pushed PR** (its own claim, its own evidence — a
      workflow run, not an assertion).
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- Delivers the "wired into the multi-manifest validate/release gates" clause on top of
  `pack-split-generator-gates`. Runs in parallel with `pack-split-preflight-compat`.
- The orchestrated firing path has no static `**Inherits:**` anchor — scoping how it is checked
  may need a `principal-swe-architect` call (covered by the required architecture review).

### Steward promotion — 2026-08-25-1139 (`principal-product-manager`)

**`proposed -> ready`, priority 20 (unchanged), `next_role: principal-swe-infra`, version 1 -> 2.**

- **Dependency verified, not assumed.** The sole `depends_on` entry
  `pack-split-generator-gates (requires: shipped)` is satisfied: `state: shipped` at version 17,
  `change_ref 457254b97…`, PR #152 merged into `47aa0549f89b1733483dd6b662a4787d621c9430`,
  released `v0.58.0`, production verification passed.
- **Priority 20, not 10 — and this is a real ordering, not a tie.** This item is genuinely
  parallel-capable with `pack-split-preflight-compat` and blocks nothing that preflight-compat
  does not also block, while preflight-compat additionally unblocks `degraded-refusal`. Both
  share one owner (`principal-swe-infra`), so if only one can run, preflight-compat runs first.
  If a second infra capacity exists, these two may run concurrently — their declared `touches`
  overlap only in `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs` and
  `.github/workflows/validate.yml`, so concurrent execution needs a touch-conflict check at
  dispatch, not a new dependency.
- **Fits `scope.current`.** Milestone `dependency-guarantees`, `required_for_milestone: true`;
  1 of the 4 required items still outstanding. No milestone semantics changed.
- **Ownership confirmed, not expanded.** The steward's `generator-gates` acceptance correction
  (2026-08-24-2240) assigned **asset-reference validation** and the **`hooks.json`
  exactly-one-pack** rule to this item; both were already acceptance criteria 2 and 3 and stay
  exactly as written. Materializing that ownership into committed trees remains
  `pack-split-generated-pack-trees`; this item validates, it does not generate.
- **Touch-set reconciled to the shipped foundation.** `scripts/lib/pack-plan.mjs` added — the
  partition, `discoverManifests`, `manifestParityErrors`, and `marketplaceConsistencyErrors`
  that this validator layers on all live there now. Claim, not proof.
- **Coordination note (no dependency added).** `pack-split-host-semantics-spike` answers whether
  `hooks.json` hooks fire **once** or **per-plugin** on real hosts. That answer does not gate
  this item — the exactly-one-pack assignment rule holds either way — but if the spike returns
  a per-plugin firing result while this item is in flight, route it to the steward as a scope
  question rather than re-scoping the check in place.
- **Unchanged, deliberately:** outcome, milestone, `required_for_milestone`, `delivery_class`,
  the single `independent-architecture` review requirement, the open orchestrated-firing-path
  question (it routes to that review, it does not block start), and the `0.x` versioning rule.
  No architecture decision was made or re-opened by this promotion.

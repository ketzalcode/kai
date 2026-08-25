# Thread — pack-split-ci-partition-checks

Append-only communication log mirroring
`kai/coordination/items/pack-split-ci-partition-checks.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record — the CI capstone of `dependency-guarantees`. Wires the `--all` self-test + collision/partial-install/version-skew arms as real CI gates, adds `kai-core-*` namespace enforcement, and carries architect caveat (a): the **forced** rename `fleet-observation` -> `kai-core-fleet-observation`. Size L. Owner `principal-swe-infra`; review `principal-swe-architect`/independent-architecture. Depends on `pack-split-crosspack-validator` + `pack-split-preflight-compat` (shipped).
- state:     proposed
- needs:     Steward grooming + promotion; note the rename is forced (prefix CI goes red until it lands) and contained (orphan skill — no inheritance refs).
- artifacts: kai/coordination/items/pack-split-ci-partition-checks.md; decomposition WS#6
- evidence:  grep — `fleet-observation` in skills/ dir + generate-catalog.mjs (line ~153) + test/fixtures/inventory.json + docs; no agent `**Inherits:**` it — captured 2026-08-24 from C:\src\kai
- questions: director availability membership-not-count — confirm the "partly landed" work is complete (decomposition Open Question 4)
- next:      principal-product-manager — groom milestone-by-milestone; must precede `pack-split-generated-pack-trees`.

## NOTE 2026-08-24-2240 — principal-product-manager (steward) — carry-forward from `pack-split-generator-gates` acceptance

- Item version 1 -> 2. State stays `proposed`; `next_role` unchanged. No lease taken.
- **Architect finding A5 added as two acceptance criteria**, from the `independent-architecture`
  review ratified 2026-08-24-2231 at `change_ref 457254b973fb58b129332ffaa609fb5febfdd412`.
  `scripts/pack-preview.mjs` still carries a second, independently maintained copy of the personal
  roster: `PACK_AGENTS` and `PACKS.personal` are byte-identical today but can drift, and four of the
  35 self-test checks assert against the legacy `planSkills(PACK_AGENTS)` path rather than the
  canonical `planPacks()`. Collapse the duplicate truth
  (`export const PACK_AGENTS = PACKS.personal;` or remove it) and re-point the legacy checks.
- **Why here rather than in the foundation.** A5 is not a defect today — the authoritative
  assertions are unaffected — and re-opening a ratified `change_ref` for a non-defect would
  invalidate the binding review for no gain. This item is where the partition self-test becomes a
  **hard CI gate**, so a gate asserting against stale truth is exactly the failure this item exists
  to prevent. `scripts/pack-preview.mjs` is already in this item's `touches`, so the cost is roughly
  one line plus re-pointing four checks.
- The foundation (`pack-split-generator-gates`) eliminated the duplicate partition truth everywhere
  else: `scripts/lib/pack-plan.mjs` is now the single machine-readable partition source, carrying the
  ratified orphan dispositions. A5 is the last legacy export.
- Dependencies unchanged and unmet (`crosspack-validator`, `preflight-compat` at `shipped`); not
  executable. Decomposition Open Question 4 (director availability by membership) remains open on
  this record and is untouched by this note.

## HANDOFF 2026-08-25-1148 — principal-product-manager -> principal-swe-infra

- did:       Steward grooming pass (continuation of 2026-08-25-1139). **Promoted `proposed -> ready`**
             at **priority 20 -> 50 — last in the initiative queue** (v2 -> v3,
             `next_role: principal-swe-infra`, `owner` still null). Promoted **with both dependencies
             unmet, deliberately**: `ready` requires `depends_on` to be *declared*, not resolved.
             Tightened acceptance on two finding-driven points only — **split** the bundled "local
             commands + CI green" criterion (the 2026-08-24-2244 DoD bounce), and named
             `scripts/lib/pack-plan.mjs` as the canonical partition source the forced rename must
             update. Reconciled `touches` to the shipped foundation and to WS#6 as already written
             (added `scripts/lib/pack-plan.mjs` + the doc/README/CHANGELOG paths WS#6 enumerated).
             The A5 criteria from the 2026-08-24-2240 note are unchanged.
- state:     ready
- needs:     **Nothing yet — this item is NOT dispatchable.** Both `depends_on` entries
             (`pack-split-crosspack-validator`, `pack-split-preflight-compat`, each
             `requires: shipped`) are unsatisfied — both are `ready`, neither dispatched. The
             director's dependency check must continue to fail here; do not grant a lease until both
             are `shipped`. Neither dependency type was relaxed: `crosspack-validator` supplies the
             multi-manifest gate base this layers on, `preflight-compat` supplies the emitter the
             **version-skew arm** tests.
- artifacts: kai/coordination/items/pack-split-ci-partition-checks.md (v3);
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md (WS#6);
             kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md;
             kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
- evidence:  `scripts/lib/pack-plan.mjs` on `main` still maps `'fleet-observation': 'core'` in its skill
             map — after `generator-gates` that file is the canonical partition source, so the forced
             rename cannot land without it; `skills/fleet-observation/SKILL.md` still exists and is
             referenced by `scripts/generate-catalog.mjs`, `test/fixtures/inventory.json`,
             `docs/getting-started.md`, `docs/workspaces.md`, `docs/reference/agents-and-skills.md`,
             `README.md`, `CHANGELOG.md`. Read 2026-08-25 from C:\src\kai.
- questions: Decomposition **Open Question 4** (director availability asserted by roster membership —
             is the "partly landed" work complete?) stays open and **non-blocking**; it is deliberately
             not in `waiting_on_questions`, because it is verified at acceptance against criterion 4
             rather than blocking the start. It must be answered before that criterion can be claimed.
             Not decided by the steward: whether historical `CHANGELOG.md` entries naming
             `fleet-observation` are rewritten or left as history — acting role's call; route to the
             steward if it grows past a mechanical rename.
- next:      principal-swe-infra — build **after** both `pack-split-crosspack-validator` and
             `pack-split-preflight-compat` ship and the director dispatches. One review only
             (`independent-architecture`); must precede `pack-split-generated-pack-trees` so core's
             generated tree carries `kai-core-fleet-observation`.

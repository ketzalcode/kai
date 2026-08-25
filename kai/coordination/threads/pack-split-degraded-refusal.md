# Thread — pack-split-degraded-refusal

Append-only communication log mirroring
`kai/coordination/items/pack-split-degraded-refusal.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. One canonical drift-proof refusal block (restates no rules) copied per pack, CI-pinned like `inherits-block.txt`. Size M. Owner `principal-swe-infra`; reviews `principal-swe-architect`/independent-architecture + `principal-security`/independent-security. Depends on `pack-split-preflight-compat` (shipped) — shared agent-body injection surface, sequenced not raced.
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-degraded-refusal.md; decomposition WS#5
- evidence:  scripts/lib/inherits-block.txt (the canonical-file + CI-pin precedent) — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone.

## HANDOFF 2026-08-25-1148 — principal-product-manager -> principal-swe-infra

- did:       Steward grooming pass (continuation of 2026-08-25-1139). **Promoted `proposed -> ready`**
             at **priority 20 -> 40** (v1 -> v2, `next_role: principal-swe-infra`, `owner` still null).
             Promoted **with its dependency unmet, deliberately**: `ready` is a steward commitment that
             requires `depends_on` to be *declared*, not resolved. Tightened acceptance on two
             finding-driven points only — named the authoritative copy path (`materializePacks` in
             `scripts/lib/pack-plan.mjs`, whose header defers **degraded-mode** guarantee-block
             injection to a downstream item, per the steward's 2026-08-24-2240 generator-gates
             correction), and **split** the bundled "local commands + CI green" criterion, because
             that exact bundling bounced `generator-gates` at the 2026-08-24-2244 DoD gate. Added
             `scripts/lib/pack-plan.mjs` to `touches`. No new requirement, no scope added, no
             architecture decision made or re-opened.
- state:     ready
- needs:     **Nothing yet — this item is NOT dispatchable.** Its sole dependency
             `pack-split-preflight-compat` (`requires: shipped`) is `ready` at priority 10 and has not
             been dispatched, so the director's dependency check must continue to fail here. Do not
             grant a lease against this record until `preflight-compat` is `shipped`. The dependency
             type was **not** weakened to `in-review`/`release-ready` to make it move sooner: the two
             share the same generated-agent-body injection surface and both byte-pin from
             `scripts/validate-plugin.mjs` (WS#5 — sequenced, not raced).
- artifacts: kai/coordination/items/pack-split-degraded-refusal.md (v2);
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md (WS#5);
             kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
- evidence:  `scripts/lib/pack-plan.mjs` on `main` — the `materializePacks` header reads "Guarantee-block
             injection (preflight, degraded-mode) and non-markdown asset routing are added by downstream
             items, not here", which is the recorded authority for naming that path here;
             `scripts/lib/inherits-block.txt` is the working canonical-file + CI byte-pin precedent.
             Read 2026-08-25 from C:\src\kai.
- questions: none blocking. One boundary to hold: this item ships the **fuller degraded-mode block**,
             not `preflight-compat`'s one-line refusal *token* — and the block must restate **no** core
             rules (northstar non-negotiable: refusal, not a fallback contract). Anything that grows
             past that routes to the steward as a scope question, not into the diff.
- next:      principal-swe-infra — build **after** `pack-split-preflight-compat` ships and the director
             dispatches; both `independent-architecture` and `independent-security` reviews must ratify
             the **same** `change_ref` before the ship gate.

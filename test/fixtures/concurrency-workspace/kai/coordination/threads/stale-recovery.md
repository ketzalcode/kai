# Thread — stale-recovery

Illustrative concurrency narrative for the collision-safe lease contract (#30)
and the durable RECOVERY / WAIVER records added by the coordination-lifecycle
work (#31). The workspace doctor does not parse threads; this file documents the
end-to-end collision-detection, stale-lease-recovery, and design-waiver flow the
`work-coordination` contract prescribes, so the fixture demonstrates the behavior
and not only the static schema. The item record `items/stale-recovery.md` is
intentionally **frozen at the pre-recovery point** (its expired lease is left in
place) so the doctor still surfaces the stale-lease warning; the RECOVERY and
WAIVER packets below illustrate the records a completed recovery would append.

## HANDOFF 2026-07-20-0900 — director-chief-of-staff -> principal-swe-frontend
- did:       reserved item serially; wrote lease holder=principal-swe-frontend token=7c1e-2026-07-20-0900 version_at_grant=6, incremented version to 7
- state:     in-progress
- needs:     implement the sample web slice within touches web/src/**
- artifacts: none yet
- evidence:  none yet
- questions: none
- next:      principal-swe-frontend — grant issued, begin work

## COLLISION 2026-07-20-1720 — principal-swe-frontend lost lease on stale-recovery
- expected: holder=principal-swe-frontend token=7c1e-2026-07-20-0900 version=7
- observed: lease expired at 2026-07-20-1700; run ended without a completion HANDOFF
- action:   stopped before writing product state; returned to grantor

## RECOVERY 2026-07-21-0905 — director-chief-of-staff -> principal-swe-frontend
- reclaimed:   stale-recovery
- stale_lease: holder=principal-swe-frontend token=7c1e-2026-07-20-0900 expired=2026-07-20-1700
- observed:    none — no partial product or coordination write after the last HANDOFF
- disposition: safe-to-resume
- new_lease:   holder=principal-swe-frontend token=9f3a-2026-07-21-0905 version_at_grant=7
- state:       in-progress
- next:        principal-swe-frontend — redispatched under the fresh grant; the old token 7c1e-… is now invalid, so a resurrected stale peer fails its verify step and stops

## WAIVER 2026-07-21-0910 — design-step waived on stale-recovery
- kind:       product-design
- grantor:    principal-product-manager
- reason:     the sample web slice reuses an existing, already-designed layout with no new interaction, hierarchy, flow, or navigation
- applies_at: version 8
- confirmed:  change_ref 9f3a2b1
- scope:      waives the design pass for this copy/layout-only change; any new interaction or navigation still requires design
- expires:    this change_ref only


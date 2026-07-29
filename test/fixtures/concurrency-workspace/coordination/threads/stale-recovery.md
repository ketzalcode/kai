# Thread — stale-recovery

Illustrative concurrency narrative for the collision-safe lease contract (#30).
The workspace doctor does not parse threads; this file documents the end-to-end
collision-detection and stale-lease-recovery flow the `work-coordination`
contract prescribes, so the fixture demonstrates the behavior and not only the
static schema.

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
- did:       reconciled the thread and repo state, confirmed no partial product write, cleared the stale grant; wrote a fresh lease token=9f3a-2026-07-21-0905 version_at_grant=7, incremented version to 8
- state:     in-progress
- needs:     resume the sample web slice; the old token 7c1e-... is now invalid, so a resurrected stale peer fails its verify step and stops
- artifacts: none yet
- evidence:  none yet
- questions: none
- next:      principal-swe-frontend — redispatched under the fresh grant

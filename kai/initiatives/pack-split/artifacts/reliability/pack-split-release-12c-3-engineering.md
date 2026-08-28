# Reliability Review - pack-split-release-12c-3-engineering

**Mode:** CHANGE-REVIEW  
**Change ref:** `27804defe2f5f7fa16c2f5373884691203d21974`  
**Date:** 2026-08-27  
**Verdict:** **READY**  
**P0/P1/P2:** 0/0/0

## Decision

The staged `kai-engineering` publication is approved for reliability at the
exact implementation ref. This completes only the required
`principal-sre` / `independent-reliability` review. The item remains
`in-review`; architecture approval, final-head ancestry/equivalence, fresh CI,
merge, production marketplace probe, tag, and release remain pending.

## Decisive evidence

- The local implementation branch resolves exactly to the reviewed SHA.
- `COMMITTED_PACKS` is the exact four-pack set: core, personal, product, and
  engineering. The committed trees total 123 files; engineering contributes 20
  agents, 15 skills, and three manifests.
- `checkCommitted` regenerates from root and rejects missing, changed, and
  unexpected files. Its self-test proves drift detection by mutation. The
  supplied exact-ref `npm test` pass includes `pack-preview --check`.
- Engineering has no runtime dependencies. Its manifest and lock contain empty
  dependency maps; the derived CI matrix adds `kai-engineering`, runs `npm ci`,
  and derives no binary assertion.
- Marketplace pack mode requires exactly the committed pack set and forbids the
  monolith and unpublished go-to-market pack. Legacy rollback forbids every
  publishable pack name, with an explicit `kai-engineering` coexistence
  regression.
- Root, four pack manifests/locks, marketplace metadata and entries, README,
  migration guidance, changelog section, and compare link agree on `1.0.3` and
  the four-pack surface.
- The ratified **DO NOT BIND** behavior is preserved: the three review lenses
  remain absent from `workflow-doc-review` inheritance, present in its runtime
  dispatch list, and assigned to engineering by the unchanged overrides.

## Recovery and release boundary

This release adds one opt-in department pack and no schema or data migration.
Recovery remains the reviewed operator-authorized forward rollback release; no
direct marketplace mutation is authorized. The engineering runtime job is
running-but-not-enforced by branch protection, so fresh final-head CI must
include and pass that leg before merge.

No production action or production verification was performed by SRE.


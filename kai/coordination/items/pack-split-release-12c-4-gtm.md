---
type: work-item
id: pack-split-release-12c-4-gtm
title: Release 12c-4 — generate and publish kai-gtm, remove split scaffolding, finalize the five-pack surface on 1.0.4
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: in-review
resume_state: null
priority: 50
owner: principal-swe-infra
next_role: workflow-ship
target: pack-split final department publish — kai-gtm — plus scaffolding removal and five-pack finalization
artifact_target: null
context_artifacts:
  - kai/coordination/items/pack-split-release-12c.md
  - kai/coordination/items/pack-split-release-12c-3-engineering.md
  - kai/initiatives/pack-split/northstar.md
  - docs/reference/plugin-structure.md
touches:
  - packs/kai-gtm/
  - packs/kai-core/
  - packs/kai-personal/
  - packs/kai-product/
  - packs/kai-engineering/
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - .github/workflows/validate.yml
  - .github/plugin/marketplace.json
  - plugin.json
  - package.json
  - package-lock.json
  - CHANGELOG.md
  - README.md
  - docs/reference/plugin-structure.md
  - kai/coordination/
  - kai/initiatives/pack-split/
depends_on:
  - item: pack-split-release-12c-3-engineering
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-sre
    kind: independent-reliability
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews:
  - role: principal-sre
    kind: independent-reliability
    change_ref: 1ad873725e62f53efd0c0005edd897e1672c915b
    verdict: approved
    evidence: "kai/coordination/threads/pack-split-release-12c-4-gtm.md"
    timestamp: 2026-08-27-1745
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: 1ad873725e62f53efd0c0005edd897e1672c915b
    verdict: approved
    evidence: "kai/coordination/threads/pack-split-release-12c-4-gtm.md"
    timestamp: 2026-08-27-1745
change_ref: 1ad873725e62f53efd0c0005edd897e1672c915b
version: 8
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1745
---

## Outcome

`kai-gtm` is generated from root, committed, and published at `1.0.4`; all five
packs (core + four departments) are live; the staging scaffolding the split
needed while trees landed incrementally is removed, and the documented surface
describes a finished five-pack install rather than a migration in progress.

## Acceptance

- [x] The `kai-gtm` tree is **generated from root** by `pack-preview` and committed;
      `pack-preview --check` reports byte parity for the whole committed slice.
- [x] `COMMITTED_PACKS` now equals the full declared partition. The incremental-slice scaffolding
      is either **collapsed** (the constant and its "only the reviewed committed slice is
      materialised" contract are no longer needed) or **explicitly retained** with a stated reason
      in the record; the committed-slice self-test still asserts an exact set, never a length.
- [ ] `.github/workflows/validate.yml` covers all five packs; the new required check is added to
      branch protection by `@operator` or recorded as running-but-not-enforced.
- [x] The marketplace lists exactly the five published packs at the canonical version with
      `installSurface: packs`, no monolith entry; `kai-core` is still never offered in the selector
      (`skills/kai-core-workspace-onboarding/SKILL.md`); the derived rollback set rejects an index
      listing any of the five.
- [x] **Split scaffolding removed:** `README.md` no longer carries the "the remaining department
      packs follow in the next `1.0.x` release" promise or a partial-slice disclosure — `## Status`
      re-derives the full published surface — and `docs/reference/plugin-structure.md` describes a
      five-pack marketplace, including the rollback runbook's uninstall order for four department
      packs plus core last.
- [x] `1.0.4` is coherent across every version surface; CHANGELOG entry + compare link present;
      `release-guard` passes; `npm test` green.
- [ ] **(R5)** Before merge: reviewed-ref ancestry, the records-only equivalence diff, and a
      **fresh** CI run at the actual final head.
- [ ] **Operator-executed publication:** merge is the publish; isolated-home browse, install of the
      newly published pack, idempotent update, installed-core doctor `--json`; then tag `v1.0.4` at
      the exact merge SHA and cut the release. This role prepares and gates only.
- [ ] The milestone evidence for `five-pack-split-shipped` is assembled for the steward: five live
      entries, version coherence, the per-publish install probes, and the retired monolith. The
      **closure call itself is the steward's**, not this item's.

## Evidence

- Exact implementation ref:
  `1ad873725e62f53efd0c0005edd897e1672c915b`.
- Full `npm test` passed against this exact commit's working content. The
  committed five-pack generation produced 139 files with byte parity.
- `kai-gtm` contains exactly 11 agents and 2 skills. The complete partition is
  56 agents and 51 skills.
- `COMMITTED_PACKS` explicitly aliases `PACK_ORDER`; the finalization is the
  bounded identity anticipated by this item, not a new generator contract.
- The staged marketplace contains exactly five pack entries at `1.0.4`, with
  no monolith entry. The rollback validation forbids every pack name, and the
  runbook removes the four department packs before removing core last.
- No canonical root agent or skill body changed. Root remains the source of
  truth for all generated pack content.
- Independent SRE review approved exact ref
  `1ad873725e62f53efd0c0005edd897e1672c915b` with verdict **APPROVED** and
  P0/P1/P2 = 0/0/0.
- Independent architecture review approved the same exact ref with verdict
  **APPROVED** and P0/P1/P2 = 0/0/0.
- Both required reviews match `change_ref`. Fresh final-head CI,
  operator-executed merge, live isolated-home marketplace probe, annotated
  `v1.0.4` tag, and public release remain pending under `workflow-ship`.

## Notes

- **Release/version: `1.0.4`, inside `1.0.x`.**
- **Cleanup rides here rather than in a fifth item (manager, 2026-08-27-1508).** The steward asked
  for a separate cleanup item only if separately necessary. Measured, it is not: the leftover
  scaffolding is one constant whose consumers are three call sites
  (`scripts/pack-preview.mjs:262,271,287-291,580`, `scripts/lib/pack-plan.mjs:122`) plus README and
  runbook prose that this publish must touch anyway to stay truthful. A fifth release cycle to
  delete a constant and a sentence would be ceremony, and it would leave the published surface
  describing itself as incomplete for the length of that cycle.
- **The one condition that would split it back out:** if collapsing `COMMITTED_PACKS` turns out to
  be a real refactor of the generator's staging contract rather than an identity, that is a
  separate change — raise it to the steward as a new item instead of growing this ref. Sized on the
  assumption it is an identity; that assumption is the item's main sizing risk.
- **Reviews:** `principal-sre` (final staged publish, no regression, rollback runbook now covers
  four department packs) and `principal-swe-architect` (the generated tree plus the scaffolding
  removal).
- **Milestone closure is not an acceptance criterion here.** `five-pack-split-shipped` closes when
  the steward verifies its typed `required_items`; this item produces the evidence for that pass
  and stops.

### Steward promotion 2026-08-27-1736 (`principal-product-manager`) — `proposed -> ready`

The sole typed dependency is verified satisfied:
`pack-split-release-12c-3-engineering` is truthfully `shipped` at v14 with
operator merge, successful final-head and exact-main CI, isolated marketplace
production verification, annotated `v1.0.3`, public release, and canonical ship
record
`kai/library/releases/2026-08-27/07-ship-pack-split-release-12c-3-engineering/ship-record.md`.

Promoted this item as the **sole ready next release item** with
`next_role: principal-swe-infra`; owner and lease remain clear. Priority 50,
the bounded final-publish outcome, existing cleanup condition, both independent
review requirements, operator-only publication boundary, and release version
`1.0.4` are unchanged. No GTM implementation, generated tree, marketplace
change, dispatch, milestone closure, or initiative closure occurred.

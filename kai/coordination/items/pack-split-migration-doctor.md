---
type: work-item
id: pack-split-migration-doctor
title: Migration doctor — uninstall-first, coexistence-refused, workspace-provenance migration
initiative: pack-split
milestone: first-pack-extracted
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split migration doctor (legacy uninstall + coexistence refusal)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - scripts/workspace-doctor.mjs
  - skills/kai-core-workspace-onboarding/SKILL.md
touches:
  - scripts/workspace-doctor.mjs
  - skills/kai-core-workspace-onboarding/SKILL.md
  - test/fixtures/
depends_on:
  - item: pack-split-generator-gates
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-security
    kind: independent-security
  - role: principal-sre
    kind: independent-reliability
completed_reviews: []
change_ref: null
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-24-2011
---

## Outcome

`scripts/workspace-doctor.mjs` verifiably uninstalls legacy `kai` before any pack install, refuses
coexistence when both legacy `kai` and `kai-core` are detected, migrates an existing `.kai` workspace's
provenance, and surfaces the fresh-session notice — so no install ends with two copies of a core skill loaded.

## Acceptance

- [ ] The doctor detects a legacy `kai` install and requires its uninstall before installing packs.
- [ ] Detected coexistence (legacy `kai` + `kai-core`) refuses rather than proceeds.
- [ ] An existing `.kai` workspace's provenance is migrated without corruption (idempotent; safe on partial).
- [ ] The fresh-session notice ("core installed; not active until a new session starts") is surfaced.
- [ ] `node scripts/workspace-doctor.mjs --self-test` and `npm test` pass.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- Runs in parallel with `pack-split-generated-pack-trees` (disjoint touches: `workspace-doctor.mjs`
  vs the generator/trees).
- Security review: legacy contract collision + uninstall-first/coexistence is a trust/safety boundary.
  Reliability review: provenance migration must not corrupt an existing workspace.
- Reliable cross-host legacy detection is informed by `pack-split-host-semantics-spike`.

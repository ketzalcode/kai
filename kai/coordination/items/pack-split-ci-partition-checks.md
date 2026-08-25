---
type: work-item
id: pack-split-ci-partition-checks
title: Real CI partition/collision/skew gates + kai-core-* namespace enforcement (forces fleet rename)
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split CI partition enforcement + namespace
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - scripts/generate-catalog.mjs
touches:
  - .github/workflows/validate.yml
  - scripts/validate-plugin.mjs
  - scripts/pack-preview.mjs
  - skills/kai-core-fleet-observation/SKILL.md
  - scripts/generate-catalog.mjs
  - test/fixtures/inventory.json
depends_on:
  - item: pack-split-crosspack-validator
    requires: shipped
  - item: pack-split-preflight-compat
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
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

The `--all` self-test plus collision / partial-install / version-skew arms run as **real CI gates**,
and core-provided skills are enforced to carry the `kai-core-*` prefix — which forces the rename
`fleet-observation` → `kai-core-fleet-observation`. The locked partition is CI-enforced, monolith
still authoritative.

## Acceptance

- [ ] `validate.yml` runs the partition self-test + collision + partial-install + version-skew arms
      as failing CI gates (not just `npm test`).
- [ ] `validate-plugin.mjs` fails if any core-provided skill lacks the `kai-core-*` prefix.
- [ ] `fleet-observation` renamed to `kai-core-fleet-observation` (skill dir + `generate-catalog.mjs`
      CATEGORIES + `test/fixtures/inventory.json` + doc mentions); catalog check green.
- [ ] Director availability is asserted by roster **membership**, not a model-computed count (per proposal).
- [ ] `node scripts/pack-preview.mjs --self-test`, `node scripts/validate-plugin.mjs`, `npm test` pass.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- Architect caveat (a): the rename is **forced** (the prefix check goes red until it lands) and
  **contained** — `fleet-observation` is an orphan (no agent inherits it), so no inheritance refs change.
- Must precede `pack-split-generated-pack-trees` so core's generated tree carries `kai-core-fleet-observation`.
- CI capstone of `dependency-guarantees`.

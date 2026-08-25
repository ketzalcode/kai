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
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-24-2240
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

*Carried forward from the `pack-split-generator-gates` architecture review (finding A5, ratified
2026-08-24-2231); routed here by the steward at acceptance 2026-08-24-2240. Not a defect today —
the authoritative assertions are unaffected — but this item is what turns the partition self-test
into a hard CI gate, so the duplicate truth must be collapsed immediately before those checks
become load-bearing.*

- [ ] **(A5)** `scripts/pack-preview.mjs` carries **one** roster truth: `PACK_AGENTS` is derived
      from the canonical partition (`export const PACK_AGENTS = PACKS.personal;`) or removed, so the
      second independently maintained copy of the personal roster cannot drift from `PACKS.personal`.
- [ ] **(A5)** Every partition self-test check runs the canonical `planPacks()` path; no check is
      left asserting against the legacy `planSkills(PACK_AGENTS)` path (four of the 35 checks do
      today), so a CI gate cannot pass against stale truth.

## Evidence

- (to be filled during execution).

## Notes

- Architect caveat (a): the rename is **forced** (the prefix check goes red until it lands) and
  **contained** — `fleet-observation` is an orphan (no agent inherits it), so no inheritance refs change.
- Must precede `pack-split-generated-pack-trees` so core's generated tree carries `kai-core-fleet-observation`.
- CI capstone of `dependency-guarantees`.
- **A5 provenance (steward, 2026-08-24-2240).** `pack-split-generator-gates` eliminated the
  duplicate partition truth everywhere except this one legacy export; it was deliberately not fixed
  in that ratified diff because re-opening a bound `change_ref` for a non-defect buys nothing.
  `scripts/pack-preview.mjs` is already in this item's `touches`, so A5 costs approximately one line
  plus re-pointing four self-test checks.

---
type: work-item
id: pack-split-generator-gates
title: Harden the pack generator and make validate/release gates multi-manifest aware
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: ready
resume_state: null
priority: 10
owner: null
next_role: principal-swe-infra
target: pack-split build tooling — generator + multi-manifest gates (foundation)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - scripts/release-guard.mjs
touches:
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - scripts/release-guard.mjs
  - .github/workflows/validate.yml
  - package.json
depends_on:
  - item: pack-split-partition-lock
    requires: completed
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
updated: 2026-08-24-2013
---

## Outcome

`scripts/pack-preview.mjs` becomes the deterministic authoritative pack generator
(stable ordering, per-pack `plugin.json`, asset/hooks-ownership routing hooks), and
`scripts/validate-plugin.mjs` + `scripts/release-guard.mjs` iterate over N manifests
instead of assuming one root `plugin.json` — the shared foundation every downstream
dependency-guarantee item sits on. Ships on `0.x`.

## Acceptance

- [ ] The generator materializes core + a department tree deterministically from root,
      with a per-pack `plugin.json`; re-running is byte-stable.
- [ ] `validate-plugin.mjs` validates N manifests (per-pack version agreement; marketplace
      index may list multiple plugins) without regressing the single-manifest monolith checks.
- [ ] `release-guard.mjs` classifies the committed pack-tree directory as behavior-sensitive
      so a generated-tree change still requires a bump + changelog + README.
- [ ] `node scripts/pack-preview.mjs --self-test`, `node scripts/validate-plugin.mjs`,
      `node scripts/release-guard.mjs --self-test`, and `npm test` all pass; new CI steps green.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp (release-guard).

## Evidence

- (to be filled during execution) — diffs, self-test output, CI run.

## Notes

- **Manager split (reviewability).** Extracted from the steward's descriptions, which had
  folded the multi-manifest gates into `pack-split-crosspack-validator` and the generator into
  `pack-split-generated-pack-trees`. Built that way, three guarantee items would re-implement the
  same plumbing and two would be XL. This is the single first implementation item.
- Delivered as 2 PR increments: (1) generator engine; (2) validate/release multi-manifest refactor.
- **Proposed** for the `dependency-guarantees` `required_items` (steward's call at grooming).

- **Steward-groomed 2026-08-24-2013 (`proposed -> ready`).** `principal-product-manager`
  accepted the decomposition, added this item to the `dependency-guarantees` `required_items`
  (`shipped`) as the foundational split, confirmed scope against repository evidence
  (`scripts/pack-preview.mjs`/`validate-plugin.mjs`/`release-guard.mjs` are single-manifest today),
  and promoted this to `ready` at priority 10 — the **single first implementation item** for the
  initiative. `next_role: principal-swe-infra`, version 1 -> 2. Its dependency
  (`pack-split-partition-lock`) is `completed`, so it is executable now. The other 13 records stay
  `proposed` for milestone-by-milestone grooming; `pack-split-host-semantics-spike` is recommended
  to start in parallel (operator-run). Dispatch is the director's.

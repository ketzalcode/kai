---
type: work-item
id: pack-split-degraded-refusal
title: Canonical degraded-mode refusal block shipped in every pack, CI-pinned
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split degraded-mode refusal
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - scripts/lib/inherits-block.txt
  - scripts/pack-preview.mjs
touches:
  - scripts/lib/degraded-block.txt
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - .github/workflows/validate.yml
depends_on:
  - item: pack-split-preflight-compat
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
  - role: principal-security
    kind: independent-security
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

One canonical refusal block (`scripts/lib/degraded-block.txt`) that restates **no** core rules —
it states the absence of the contract and stops — copied into every pack agent by the generator
and pinned byte-for-byte in CI, so it cannot drift from core as core evolves.

## Acceptance

- [ ] `scripts/lib/degraded-block.txt` exists, restates no operating rules, and instructs single-shot
      refusal + "install kai-core" only.
- [ ] Every generated pack agent carries the verbatim block; `validate-plugin.mjs` pins it byte-for-byte.
- [ ] A CI check asserts the block introduces no coordination rule (drift-proof by construction).
- [ ] `node scripts/pack-preview.mjs --self-test`, `node scripts/validate-plugin.mjs`, `npm test` pass.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- Follows `pack-split-preflight-compat` because it shares the generator injection path and the same
  generated agent bodies (touch overlap) — sequenced, not raced.
- Distinct from the preflight's one-line refusal *token*: this is the fuller shipped block the failed
  preflight points to. Mirrors the `inherits-block.txt` canonical-file + CI-pin + generator-copy pattern.

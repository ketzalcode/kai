---
type: work-item
id: pack-split-release-12c-3-engineering
title: Release 12c-3 — generate and publish kai-engineering, preserving runtime-dispatched review lenses, on 1.0.3
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: proposed
resume_state: null
priority: 40
owner: null
next_role: principal-product-manager
target: pack-split staged department publish — kai-engineering
artifact_target: null
context_artifacts:
  - kai/coordination/items/pack-split-release-12c.md
  - kai/coordination/items/pack-split-review-lens-binding.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-review-lens-binding.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/reference/plugin-structure.md
touches:
  - packs/kai-engineering/
  - packs/kai-core/
  - packs/kai-personal/
  - packs/kai-product/
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - .github/workflows/validate.yml
  - .github/plugin/marketplace.json
  - plugin.json
  - package.json
  - package-lock.json
  - CHANGELOG.md
  - README.md
  - kai/coordination/
  - kai/initiatives/pack-split/
depends_on:
  - item: pack-split-release-12c-2-product
    requires: shipped
  - item: pack-split-review-lens-binding
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-sre
    kind: independent-reliability
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
updated: 2026-08-27T23:45:12Z
---

## Outcome

`kai-engineering` — the largest department, 20 agents — is generated from the
settled root tree with the three review lenses still runtime-dispatched and
engineering-owned through the existing overrides, committed, and published to
`kai-plugins` at `1.0.3`. Four of five packs are live.

## Acceptance

- [ ] The ratified **DO NOT BIND** decision in
      `kai/initiatives/pack-split/artifacts/decisions/pack-split-review-lens-binding.md`
      is preserved when the tree is generated: the reviewed `change_ref` has
      **zero diff** to `agents/workflow-doc-review.agent.md` and zero diff to the
      three existing `SKILL_OWNER_OVERRIDES` entries for `review-dependencies`,
      `review-performance-scale`, and `review-success-metrics`. Those entries
      remain assigned to `engineering`, and the lenses remain runtime-dispatched.
- [ ] Partition invariants stay green under the change: the `--all` self-test still reports
      `orphans === overrides`, `unplaced === 0`, 56 of 56 agents assigned, none double-claimed, and
      no skill provided by both core and a pack.
- [ ] The `kai-engineering` tree is **generated from root** by `pack-preview` and committed;
      `pack-preview --check` reports byte parity for the whole committed slice.
- [ ] `COMMITTED_PACKS` and the committed-slice self-test pin name the new slice as an exact set.
- [ ] `.github/workflows/validate.yml` runs the per-pack runtime job for `kai-engineering` and it
      passes with no declared runtime dependencies; the new required check is added to branch
      protection by `@operator` or recorded as running-but-not-enforced.
- [ ] The marketplace lists exactly the four published packs at the canonical version with
      `installSurface: packs`, no monolith entry, and every entry `name` matching its source
      manifest; the derived rollback set rejects an index that still lists `kai-engineering`.
- [ ] `README.md` `## Status` slice counts are re-derived from the published pack set and the
      migration notice names what is published and what remains.
- [ ] `1.0.3` is coherent across every version surface; CHANGELOG entry + compare link present;
      `release-guard` passes; `npm test` green.
- [ ] **(R5)** Before merge: reviewed-ref ancestry, the records-only equivalence diff, and a
      **fresh** CI run at the actual final head.
- [ ] **Operator-executed publication:** merge is the publish; isolated-home browse, install,
      idempotent update and installed-core doctor `--json`; then tag `v1.0.3` at the exact merge SHA
      and cut the release. This role prepares and gates only.

## Evidence

- (to be filled) — reviewed `change_ref`, both approvals at that exact ref, final-head CI run,
  operator merge/tag/release, isolated-home install probe, marketplace diff.

## Notes

- **Release/version: `1.0.3`, inside `1.0.x`.**
- **Size L, and the largest of the three publishes.** 20 agents
  (`scripts/lib/pack-plan.mjs:70-84`) means the widest generated diff to review.
  The settled **DO NOT BIND** decision removes the previously anticipated root-agent-body change:
  engineering publication must generate the existing tree without changing
  `agents/workflow-doc-review.agent.md` or the three review-lens override entries.
- **Required zero-diff obligation:** `scripts/lib/pack-plan.mjs` remains in `touches` because
  `COMMITTED_PACKS` gains `engineering`, but its existing
  `review-dependencies`, `review-performance-scale`, and `review-success-metrics`
  `SKILL_OWNER_OVERRIDES` entries remain byte-unchanged. The review-lens decision requires no new
  CI assertion, partition re-lock, generator behavior, or agent-content change.
- **Reviews:** `principal-sre` (staged publish, no regression) and `principal-swe-architect` (the
  generated tree and conformance to the settled zero-diff review-lens obligation). The architect
  ratified the upstream decision and independently verifies that publication preserves it.
- Depends on `pack-split-review-lens-binding` at `completed` — a knowledge item's terminal state —
  and on `pack-split-release-12c-2-product` at `shipped`, because the publish protocol and the
  three-pack rollback derivation are proven there first.

### Steward reconciliation 2026-08-27-1645 (`principal-product-manager`)

Classified as `refine-in-scope`: this corrects the item to the already-ratified
**DO NOT BIND** decision and adds no capability or release scope. Removed the
false root-agent touch and replaced the conditional bind path with explicit
zero-diff obligations for the agent body and the three existing review-lens
override entries. The item remains `proposed`; its decision dependency is
`completed`, while `pack-split-release-12c-2-product` still must reach
`shipped`.

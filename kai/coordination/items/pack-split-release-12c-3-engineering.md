---
type: work-item
id: pack-split-release-12c-3-engineering
title: Release 12c-3 — generate and publish kai-engineering, preserving runtime-dispatched review lenses, on 1.0.3
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: in-review
resume_state: null
priority: 40
owner: principal-swe-infra
next_role: workflow-ship
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
  - docs/getting-started.md
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
completed_reviews:
  - role: principal-sre
    kind: independent-reliability
    change_ref: 27804defe2f5f7fa16c2f5373884691203d21974
    verdict: approved
    evidence: "kai/initiatives/pack-split/artifacts/reliability/pack-split-release-12c-3-engineering.md"
    timestamp: 2026-08-27-1720
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: 27804defe2f5f7fa16c2f5373884691203d21974
    verdict: approved
    evidence: "kai/initiatives/pack-split/artifacts/decisions/pack-split-release-12c-3-engineering-architecture-review.md"
    timestamp: 2026-08-27-1735
change_ref: 27804defe2f5f7fa16c2f5373884691203d21974
version: 9
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1735
---

## Outcome

`kai-engineering` — the largest department, 20 agents — is generated from the
settled root tree with the three review lenses still runtime-dispatched and
engineering-owned through the existing overrides, committed, and published to
`kai-plugins` at `1.0.3`. Four of five packs are live.

## Acceptance

- [x] The ratified **DO NOT BIND** decision in
      `kai/initiatives/pack-split/artifacts/decisions/pack-split-review-lens-binding.md`
      is preserved when the tree is generated: the reviewed `change_ref` has
      **zero diff** to `agents/workflow-doc-review.agent.md` and zero diff to the
      three existing `SKILL_OWNER_OVERRIDES` entries for `review-dependencies`,
      `review-performance-scale`, and `review-success-metrics`. Those entries
      remain assigned to `engineering`, and the lenses remain runtime-dispatched.
- [x] Partition invariants stay green under the change: the `--all` self-test still reports
      `orphans === overrides`, `unplaced === 0`, 56 of 56 agents assigned, none double-claimed, and
      no skill provided by both core and a pack.
- [x] The `kai-engineering` tree is **generated from root** by `pack-preview` and committed;
      `pack-preview --check` reports byte parity for the whole committed slice.
- [x] `COMMITTED_PACKS` and the committed-slice self-test pin name the new slice as an exact set.
- [ ] `.github/workflows/validate.yml` runs the per-pack runtime job for `kai-engineering` and it
      passes with no declared runtime dependencies; the new required check is added to branch
      protection by `@operator` or recorded as running-but-not-enforced.
- [x] The marketplace lists exactly the four published packs at the canonical version with
      `installSurface: packs`, no monolith entry, and every entry `name` matching its source
      manifest; the derived rollback set rejects an index that still lists `kai-engineering`.
- [x] `README.md` `## Status` slice counts are re-derived from the published pack set and the
      migration notice names what is published and what remains.
- [ ] `1.0.3` is coherent across every version surface; CHANGELOG entry + compare link present;
      `release-guard` passes; `npm test` green.
- [ ] **(R5)** Before merge: reviewed-ref ancestry, the records-only equivalence diff, and a
      **fresh** CI run at the actual final head.
- [ ] **Operator-executed publication:** merge is the publish; isolated-home browse, install,
      idempotent update and installed-core doctor `--json`; then tag `v1.0.3` at the exact merge SHA
      and cut the release. This role prepares and gates only.

## Evidence

- Exact implementation ref:
  `27804defe2f5f7fa16c2f5373884691203d21974`; the checked-out
  `feat/29-publish-engineering-pack` ref resolves to that full SHA.
- Relative to pre-implementation `main`
  `3ccf216109ed296c2ea03e569e1218fbf8839838`, the cumulative implementation
  has **zero diff** to `agents/workflow-doc-review.agent.md`. The
  `review-dependencies`, `review-performance-scale`, and
  `review-success-metrics` entries in `SKILL_OWNER_OVERRIDES` are also
  byte-unchanged and remain assigned to `engineering`. **DO NOT BIND** is
  preserved; all three lenses remain runtime-dispatched.
- Full `npm test` passed against this exact commit's working content. That
  covers validation, docs parity, partition/collision/partial-install/version-skew
  gates, pack-generator self-test, and committed-tree byte parity.
- `pack-preview` generated 123 files. `kai-engineering` contains exactly
  20 agents and 15 skills; the full partition remains 56 of 56 agents,
  none double-claimed, `orphans === overrides`, `unplaced === 0`, and no
  skill is provided by both core and a department pack.
- `COMMITTED_PACKS` and its exact-set self-test name
  `core,personal,product,engineering`. The derived CI matrix is exactly
  `kai-core,kai-personal,kai-product,kai-engineering`.
- `packs/kai-engineering/package.json` declares no runtime dependencies;
  its lock records the same empty dependency set. The generated runtime
  leg therefore installs the lock and asserts no binary. Remote final-head
  CI and protected-check enforcement remain part of the R5 gate.
- The marketplace contains exactly `kai-core`, `kai-personal`,
  `kai-product`, and `kai-engineering`, with `installSurface: packs`, no
  monolith entry, and source-manifest names aligned. The rollback
  regression rejects an index that still serves `kai-engineering`.
- Root, marketplace, generated-pack manifests/locks, README status,
  CHANGELOG section, and compare link are coherent at `1.0.3`. README and
  migration guidance report the four-pack 45-agent/49-skill published
  slice and identify go-to-market as the only unpublished department.
- Reviews are now requested from `principal-sre` and
  `principal-swe-architect`, independently, against this exact ref.
  No review approval, final-head CI, merge, tag, release, publication, or
  production verification is claimed.
- Independent SRE review approved exact ref
  `27804defe2f5f7fa16c2f5373884691203d21974` with verdict **READY** and
  P0/P1/P2 = 0/0/0. Evidence:
  `kai/initiatives/pack-split/artifacts/reliability/pack-split-release-12c-3-engineering.md`.
  Architecture, final-head CI, merge, production probe, tag, and release were
  pending at that review.
- Independent architecture review approved exact ref
  `27804defe2f5f7fa16c2f5373884691203d21974` with disposition **Endorse** and
  P0/P1/P2 = 0/0/0. It independently inspected the 20-agent/15-skill
  engineering partition, canonical-root generation and drift gate, cross-pack
  provider rules, four-pack marketplace/version shape, and the byte-unchanged
  **DO NOT BIND** seam. Evidence:
  `kai/initiatives/pack-split/artifacts/decisions/pack-split-release-12c-3-engineering-architecture-review.md`.
  Both required reviews now match `change_ref`; the item remains `in-review`
  for final-head CI, merge, production probe, tag, and release.

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

### Steward promotion 2026-08-27-1709 (`principal-product-manager`) — `proposed -> ready`

Both typed dependencies are verified at their required terminal states:
`pack-split-release-12c-2-product` is `shipped` at v13 after the fulfilled
handoff was cleared, and `pack-split-review-lens-binding` is `completed` at v5.
Promoted this item as the sole ready next release item with
`next_role: principal-swe-infra`; owner and lease remain clear.

The accepted architecture is not reopened: the three review lenses remain
runtime-dispatched and engineering-owned through the existing overrides.
Engineering acceptance still requires zero diff to the canonical
`workflow-doc-review` body and to the three named `SKILL_OWNER_OVERRIDES`
entries. No implementation, generated tree, marketplace entry, version, tag,
release, or publication changed in this promotion. `12c-4` remains proposed.

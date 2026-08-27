---
type: work-item
id: pack-split-release-12c-3-engineering
title: Release 12c-3 — generate and publish kai-engineering, carrying the ratified review-lens binding, on 1.0.3
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
  - agents/workflow-doc-review.agent.md
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
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1508
---

## Outcome

`kai-engineering` — the largest department, 20 agents — is generated from root
with the ratified review-lens binding already applied, committed, and published
to `kai-plugins` at `1.0.3`. Four of five packs are live.

## Acceptance

- [ ] The ratified decision in `kai/initiatives/pack-split/artifacts/decisions/pack-split-review-lens-binding.md`
      is **implemented before the tree is generated** — architect caveat (b) is closed at generation
      time, not at review time. If the verdict was *bind*, `agents/workflow-doc-review.agent.md`
      carries the three lenses on its `**Inherits:**` line and any now-redundant
      `SKILL_OWNER_OVERRIDES` entries are reconciled.
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
  (`scripts/lib/pack-plan.mjs:70-84`) means the widest generated diff to review, and it is the only
  publish that also carries a **root source change** (the `**Inherits:**` line) whose blast radius
  reaches the partition placement logic, not just one pack's tree.
- **Risk / unknown, named rather than absorbed:** if the binding verdict is *bind*, the three
  `review-*` skills move from override-placement to inheritance-placement. `planPacks` asserts
  set equality between orphans and overrides, so removing the overrides is likely required and the
  `--all` self-test is the gate that will say so. This is contained to files already in `touches`,
  but it is the one place in `12c` where a decision changes generator behavior and not just
  content. If it turns out to require a new CI assertion or a partition re-lock, that is a scope
  question for the steward — not a quiet expansion of this item.
- **Reviews:** `principal-sre` (staged publish, no regression) and `principal-swe-architect` (the
  generated tree **and** the implemented review-lens binding — the caveat the decomposition routed
  here since 2026-08-24). The architect ratifying the decision upstream and reviewing its
  implementation here is the normal separation: infra implements, architect judges.
- Depends on `pack-split-review-lens-binding` at `completed` — a knowledge item's terminal state —
  and on `pack-split-release-12c-2-product` at `shipped`, because the publish protocol and the
  three-pack rollback derivation are proven there first.

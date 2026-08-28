---
type: work-item
id: pack-split-release-12c-2-product
title: Release 12c-2 — generate and publish kai-product (first three-pack publish) on 1.0.2
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: shipped
resume_state: null
priority: 30
owner: principal-swe-infra
next_role: null
target: pack-split staged department publish — kai-product
artifact_target: null
context_artifacts:
  - kai/coordination/items/pack-split-release-12c.md
  - kai/coordination/items/pack-split-release-12c-1-hardening.md
  - kai/library/releases/2026-08-27/04-ship-pack-split-release-12b/ship-record.md
  - docs/reference/plugin-structure.md
touches:
  - packs/kai-product/
  - packs/kai-core/
  - packs/kai-personal/
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
  - item: pack-split-release-12c-1-hardening
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
    change_ref: 31373efe880aa2676eb379920a1c599efd43ada4
    verdict: approved
    evidence: "kai/coordination/threads/pack-split-release-12c-2-product.md"
    timestamp: 2026-08-28-0025
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: 31373efe880aa2676eb379920a1c599efd43ada4
    verdict: approved
    evidence: "kai/coordination/threads/pack-split-release-12c-2-product.md"
    timestamp: 2026-08-28-0025
change_ref: 31373efe880aa2676eb379920a1c599efd43ada4
version: 13
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1709
---

## Outcome

`kai-product` is generated from root, committed, and published to `kai-plugins`
at `1.0.2` — the **third** entry in the index. The publish protocol for a
post-flip department is proven on the smallest deferred tree, with the derived
rollback set (shipped at `12c-1`) demonstrably covering a pack that did not
exist when it was written.

## Acceptance

- [x] The `kai-product` tree is **generated from root** by `pack-preview` and committed — never
      hand-carved — and `pack-preview --check` reports byte parity for the whole committed slice.
- [x] `COMMITTED_PACKS` and the committed-slice self-test pin name the new
      slice; the pin still asserts an exact set, not a length.
- [x] `.github/workflows/validate.yml` runs the per-pack runtime job for `kai-product` and it
      passes for a pack that declares no runtime dependencies (`PACK_RUNTIME_DEPENDENCIES.product`
      is `[]`). The new required check name `runtime-dependencies (kai-product)` is either added to
      branch protection by `@operator` or recorded plainly as running-but-not-enforced.
- [x] The marketplace lists exactly `kai-core`, `kai-personal`, `kai-product` at the canonical
      version with `installSurface: packs` and no monolith entry; every entry `name` matches the
      `plugin.json` at its `source`.
- [x] **R1 holds at three packs:** a self-test arm proves a `legacy-rollback` index that still lists
      `kai-product` is rejected. This is the first live proof of the `12c-1` derivation, not a
      restatement of it.
- [x] `README.md` `## Status` re-derives the published slice counts as 25 agents
      and 34 skills **from the published pack set**, and the migration notice prose is updated
      to name the packs actually published and the ones still to come — no stale "remaining
      department packs follow" claim that the release just falsified.
- [x] `1.0.2` is coherent across every version surface; CHANGELOG entry + compare link present;
      `release-guard` passes; `npm test` green.
- [x] **(R5)** Before merge: reviewed-ref ancestry, the records-only equivalence diff
      (`git diff --exit-code <review> HEAD -- . ':(exclude)kai/'`), and a **fresh** CI run at the
      actual final head. No merge on an attested equivalence or a superseded run.
- [x] **Operator-executed publication:** the merge to the default branch *is* the publish. From an
      isolated `COPILOT_HOME`, browse `kai-plugins`, install `kai-product` beside core, run an
      idempotent update, and run the installed core migration doctor with `--json`; then tag
      `v1.0.2` at the exact merge SHA and cut the release. This role prepares and gates; it never
      publishes, merges or tags.

## Evidence

- Generated committed slice: 85 files; `kai-product` contains 9 agents, 3
  skills, and an empty runtime dependency map.
- Full `npm test` passed with 180 pack self-tests and 33 migration scenarios.
- Derived CI matrix is exactly
  `["kai-core","kai-personal","kai-product"]`; the product binary query is
  empty. Branch protection currently requires only `contract`, so
  `runtime-dependencies (kai-product)` will run but is not enforced by the
  protected-check list.
- Exact implementation ref:
  `31373efe880aa2676eb379920a1c599efd43ada4`; exact release guard passed
  against `origin/main`.
- Independent SRE and architecture reviews approved the exact implementation
  ref with no P0/P1 findings.
- Reviewed ref `31373efe880aa2676eb379920a1c599efd43ada4` is the merge base
  of final PR head `999147e4a67414ff4182c26a47eebe495d415903` and merge
  `1dd6f019df8a4ca8023df18a6bf32b8a7d1759e2`; the post-review compare
  changes only this item's two `kai/coordination/` records.
- Final-head CI run `33128391926` and exact-main run `33128452012` both
  completed successfully with `contract` and all three runtime-dependency jobs,
  including the empty-dependency `kai-product` leg. Runtime jobs remain
  running-but-not-enforced because branch protection requires only `contract`.
- The operator's fresh no-ref marketplace probe returned exactly `kai-core`,
  `kai-personal`, and `kai-product`; all three installed at `1.0.2`; the
  idempotent product update reported already latest at `v1.0.2`; and the
  installed-core doctor returned `status: clear`, all three enabled, with only
  `marketplace:kai-plugins` provenance.
- PR #186 merged to `main` as
  `1dd6f019df8a4ca8023df18a6bf32b8a7d1759e2`; annotated tag `v1.0.2`
  peels to that merge, and the public non-draft, non-prerelease release was
  published at `2026-08-28T00:05:21Z`.
- Canonical ship record:
  `kai/library/releases/2026-08-27/06-ship-pack-split-release-12c-2-product/ship-record.md`.

## Ship closure

**Verdict: SHIPPED.** `workflow-ship` walked the evidenced lifecycle
`in-review -> release-ready -> deploying -> production-verification -> shipped`
(v8 -> v12). Deployment started with the operator merge at
`2026-08-28T00:03:44Z`; exact-main CI completed successfully at
`2026-08-28T00:04:29Z`; the fresh marketplace install/update/doctor probe and
public annotated tag/release passed. No product behavior or generated pack file
was changed during closure.

## Notes

- **Release/version: `1.0.2`, inside `1.0.x`.** One department, one ref, one review pair, one
  release — the "never flip all five in one unreviewable step" non-negotiable, applied post-flip.
- **Why `product` is first (manager, 2026-08-27-1508).** It is the smallest deferred tree (9 agents
  against `gtm`'s 11 and `engineering`'s 20, `scripts/lib/pack-plan.mjs:63-93`) and it is the only
  one with **no open decision** attached. The risk being retired here is *protocol* risk — the
  first three-entry index, the first re-derived README slice count, the first added CI matrix leg —
  and protocol risk is cheapest to retire on the smallest surface. Content risk for all three
  deferred trees is already continuously gated: CI runs the cross-pack validator and partition
  checks over the full `--all` preview today. **If product value says a different department should
  land first, this ordering is the PM's to change** — see the negotiation in
  `pack-split-release-12c`.
- **Reviews:** `principal-sre` (staged publish, no regression, rollback path still sound at three
  packs) and `principal-swe-architect` (the generated tree). Security reviewed the trust-boundary
  change once, at `12c-1`, where the rollback derivation actually moves; repeating it per
  department would be ceremony, and the steward may still add it if they read the third-entry
  publish as a new trust boundary.
- A version bump regenerates every committed tree, so `packs/kai-core/` and `packs/kai-personal/`
  are honest members of the touch set even though no core or personal content changes.
- This item's touch set overlaps `12c-3` and `12c-4` almost entirely (`pack-plan.mjs`, the
  marketplace, every version surface). They are strictly serial by dependency; there is **no**
  parallelism to recover here, and pretending otherwise would produce touch collisions at dispatch.

### Steward decision 2026-08-27-1523 (`principal-product-manager`) — department order CONFIRMED

**`product` -> `engineering` -> `gtm` stands. The manager flagged this as the one
lever where product value may override engineering risk; the steward looked for
that evidence and it is not in the records.** This is a decision, not deference:

- **No published commitment names an order.** The live `v1.0.0` release note and
  `README.md:39-43` promise only that "the remaining department packs follow in the
  next `1.0.x` release" — engineering, product and go-to-market as one set. No user
  was told which arrives first, so no order breaks a promise. (The "next `1.0.x`
  release" phrasing is loose against a four-release chain in *any* order; `12c-2`
  and `12c-3` re-derive the disclosure and `12c-4` removes the promise outright.)
- **No demand signal exists for a specific department.** There is no
  customer-success or support packet, no backlog proposal, and no north-star success
  measure that ranks the departments. `five-pack-split-shipped` names all four and
  is order-neutral, and the success measures are about per-session discovery cost and
  partition integrity — neither is department-specific.
- **Contributor capability is not at stake.** kai develops itself from the
  repository root source, not from the published pack surface, so deferring
  `kai-engineering` does not slow the work that publishes it. An "engineering first
  so we can keep building" argument would be false here, and it is worth writing
  down so nobody reconstructs it later.
- **Delay symmetry favours the smallest tree first.** The gap that matters to users
  is time until *all three* departments are back, not time to the first one. The
  engineering publish is the only one carrying a root-body change whose blast radius
  reaches partition placement; if it bounces, everything behind it stalls. Putting it
  second, on a protocol proven at three packs and with its one open decision already
  ratified, shortens the expected path for all three — and it is also the *largest*
  restoration of surface, which is the one thing worth protecting from a preventable
  bounce.
- **The condition that reverses this:** a recorded signal — a customer-success
  packet, an operator instruction, or an adoption measure — that a named department
  must reach users first. Then the chain re-orders cleanly, provided
  `pack-split-review-lens-binding` is `completed` before `engineering` runs, and the
  cost is that the largest tree lands on an unproven publish protocol. Route it to
  the steward; do not re-order at build time.

**Not promoted.** Its sole typed dependency `pack-split-release-12c-1-hardening`
requires `shipped` and is `ready` — unmet. The steward promotes this item in the
pass that follows `12c-1`'s ship, so the `ready` queue stays an *executable* queue.
`next_role` stays `principal-product-manager` for that reason; priority 30 stands.
Record content otherwise unchanged, v1 -> v2. Nothing was dispatched.

### Steward promotion 2026-08-27-1645 (`principal-product-manager`) — `proposed -> ready`

The sole typed dependency is now verified satisfied:
`pack-split-release-12c-1-hardening` is `shipped` at v14 with public release
`v1.0.1` and canonical ship record
`kai/library/releases/2026-08-27/05-ship-pack-split-release-12c-1-hardening/ship-record.md`.
Promoted this item to `ready` with `next_role: principal-swe-infra`; owner and
lease remain clear. Priority 30, the confirmed
`product -> engineering -> gtm` order, outcome, acceptance, review requirements,
and operator publication boundary are unchanged. This is the sole executable
next item; nothing was dispatched or implemented.

### Steward reconciliation 2026-08-27-1709 (`principal-product-manager`)

Cleared the fulfilled post-ship handoff (`next_role -> null`) after verifying
the authoritative record is `shipped` with its reviewed ref, both approvals,
canonical ship record, operator merge/tag/release, and production verification
intact. No release fact or implementation state changed.

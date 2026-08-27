---
type: work-item
id: pack-split-release-12c-2-product
title: Release 12c-2 — generate and publish kai-product (first three-pack publish) on 1.0.2
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: proposed
resume_state: null
priority: 30
owner: null
next_role: principal-product-manager
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
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1523
---

## Outcome

`kai-product` is generated from root, committed, and published to `kai-plugins`
at `1.0.2` — the **third** entry in the index. The publish protocol for a
post-flip department is proven on the smallest deferred tree, with the derived
rollback set (shipped at `12c-1`) demonstrably covering a pack that did not
exist when it was written.

## Acceptance

- [ ] The `kai-product` tree is **generated from root** by `pack-preview` and committed — never
      hand-carved — and `pack-preview --check` reports byte parity for the whole committed slice.
- [ ] `COMMITTED_PACKS` (`scripts/lib/pack-plan.mjs:122`) and the committed-slice self-test pin
      (`scripts/pack-preview.mjs:580-582`, today asserting exactly `core` + `personal`) name the new
      slice; the pin still asserts an exact set, not a length.
- [ ] `.github/workflows/validate.yml` runs the per-pack runtime job for `kai-product` and it
      passes for a pack that declares no runtime dependencies (`PACK_RUNTIME_DEPENDENCIES.product`
      is `[]`). The new required check name `runtime-dependencies (kai-product)` is either added to
      branch protection by `@operator` or recorded plainly as running-but-not-enforced.
- [ ] The marketplace lists exactly `kai-core`, `kai-personal`, `kai-product` at the canonical
      version with `installSurface: packs` and no monolith entry; every entry `name` matches the
      `plugin.json` at its `source`.
- [ ] **R1 holds at three packs:** a self-test arm proves a `legacy-rollback` index that still lists
      `kai-product` is rejected. This is the first live proof of the `12c-1` derivation, not a
      restatement of it.
- [ ] `README.md` `## Status` re-derives the published slice counts (today "16 agents and 31
      skills") **from the published pack set**, and the `v1.0.0` migration notice prose is updated
      to name the packs actually published and the ones still to come — no stale "remaining
      department packs follow" claim that the release just falsified.
- [ ] `1.0.2` is coherent across every version surface; CHANGELOG entry + compare link present;
      `release-guard` passes; `npm test` green.
- [ ] **(R5)** Before merge: reviewed-ref ancestry, the records-only equivalence diff
      (`git diff --exit-code <review> HEAD -- . ':(exclude)kai/'`), and a **fresh** CI run at the
      actual final head. No merge on an attested equivalence or a superseded run.
- [ ] **Operator-executed publication:** the merge to the default branch *is* the publish. From an
      isolated `COPILOT_HOME`, browse `kai-plugins`, install `kai-product` beside core, run an
      idempotent update, and run the installed core migration doctor with `--json`; then tag
      `v1.0.2` at the exact merge SHA and cut the release. This role prepares and gates; it never
      publishes, merges or tags.

## Evidence

- (to be filled) — reviewed `change_ref`, both approvals at that exact ref, final-head CI run,
  operator merge/tag/release, isolated-home install probe, marketplace diff.

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

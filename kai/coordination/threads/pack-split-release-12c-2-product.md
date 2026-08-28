# Thread — pack-split-release-12c-2-product

## NOTE 2026-08-27-2358 — principal-swe-infra

- did:       Generated the first post-flip department publication. Added
             `product` to the exact committed slice, generated 85 total files,
             published `kai-product` as the third marketplace entry at 1.0.2,
             and updated install/status documentation to the measured 25-agent,
             34-skill surface.
- state:     in-progress
- needs:     Commit the implementation, run the exact release guard, then bind
             SRE and architecture review to that ref.
- artifacts: `packs/kai-product/`; `scripts/lib/pack-plan.mjs`;
             `scripts/pack-preview.mjs`; `.github/plugin/marketplace.json`;
             `README.md`; `docs/getting-started.md`
- evidence:  Full `npm test` passed; pack-preview 179 checks; migration matrix
             33; CI matrix is core + personal + product; product declares no
             runtime binary. Main branch protection requires only `contract`,
             so the product runtime leg is running-but-not-enforced.
- questions: none
- next:      principal-swe-infra — create the reviewable implementation ref.

## HANDOFF 2026-08-28-0002 — principal-swe-infra -> principal-sre

- did:       Committed the complete 1.0.2 product publication at exact ref
             `076a9244c062ab61a0920a54f35b0dc2daebc995`.
- state:     in-review
- needs:     Independent reliability review; architecture independently reviews
             the generated product tree and partition placement at the same ref.
- artifacts: `packs/kai-product/`; `.github/plugin/marketplace.json`;
             `scripts/lib/pack-plan.mjs`; `scripts/pack-preview.mjs`
- evidence:  Full suite passed; exact release guard passed against
             `origin/main`; generated parity is clean.
- questions: none
- next:      principal-sre — approve or return blocking findings.

## REVIEW 2026-08-28-0010 — principal-sre

- ref:       `076a9244c062ab61a0920a54f35b0dc2daebc995`
- verdict:   blocked — one P1 documentation/operability finding.
- finding:   Deeper migration, direct/local install, and update instructions
             still omitted product or described it as unpublished.
- note:      The dynamic product runtime leg being running-but-not-enforced is
             acceptable because the required `contract` job derives it and the
             limitation is explicit.

## REVIEW 2026-08-28-0010 — principal-swe-architect

- ref:       `076a9244c062ab61a0920a54f35b0dc2daebc995`
- verdict:   blocked — one P1 acceptance gap; architecture retained.
- finding:   The rollback regression selected the first unpublished pack
             (`kai-engineering`) instead of proving `kai-product` rejection by
             name as this release requires.

## HANDOFF 2026-08-28-0015 — principal-swe-infra -> principal-sre

- did:       Updated every install/migration/update surface to include product
             and added an explicit `kai` + `kai-product` rollback rejection arm,
             while retaining the future-unpublished-pack regression.
- state:     in-review
- needs:     Re-review exact ref
             `31373efe880aa2676eb379920a1c599efd43ada4`; architecture re-review
             runs independently at the same ref.
- artifacts: `README.md`; `docs/getting-started.md`;
             `scripts/pack-preview.mjs`
- evidence:  Full suite passed; pack-preview 180 checks; exact release guard
             passed.
- questions: none
- next:      principal-sre — approve or return blocking findings.

## REVIEW 2026-08-28-0025 — principal-sre

- ref:       `31373efe880aa2676eb379920a1c599efd43ada4`
- verdict:   approved — READY; no P0/P1.
- evidence:  All install, migration, direct/local, list, and update guidance
             includes product; the generated three-pack topology, no-dependency
             runtime leg, rollback policy, and release plan are coherent.
- note:      The product runtime check runs but is not independently required
             by branch protection; final-head CI remains the merge gate.

## REVIEW 2026-08-28-0025 — principal-swe-architect

- ref:       `31373efe880aa2676eb379920a1c599efd43ada4`
- verdict:   approved — no P0/P1 architecture findings.
- evidence:  Root remains canonical; product is exactly 9 agents/3 skills,
             provider-unique and generator-derived; manifests and marketplace
             agree; the product-specific and future-pack rollback regressions
             are distinct and green.

## HANDOFF 2026-08-28-0025 — principal-swe-architect -> workflow-ship

- did:       Both required independent reviews approved exact implementation
             ref `31373efe880aa2676eb379920a1c599efd43ada4`.
- state:     in-review
- needs:     Commit these records, prove reviewed ancestry and non-`kai/`
             equivalence, then require fresh final-head CI including
             `runtime-dependencies (kai-product)`.
- artifacts: `kai/coordination/items/pack-split-release-12c-2-product.md`;
             `kai/coordination/threads/pack-split-release-12c-2-product.md`
- evidence:  SRE approved; architecture approved; no P0/P1.
- questions: none
- next:      workflow-ship — complete exact-head pre-merge gates.

Append-only communication log mirroring
`kai/coordination/items/pack-split-release-12c-2-product.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-27-1508 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record: generate, commit and publish `kai-product` on
             `1.0.2` — the first three-entry marketplace. Size **M**. Owner
             `principal-swe-infra`; **@operator** merges, probes, tags and releases. Reviews
             `principal-sre` / independent-reliability + `principal-swe-architect` /
             independent-architecture. Typed dependency
             `pack-split-release-12c-1-hardening` at `shipped`.
- state:     proposed
- needs:     Steward promotion (with the whole chain, per the `ready`-is-a-commitment rule); it
             becomes executable when `12c-1` ships.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-release-12c-2-product.md
- evidence:  `product` is the smallest deferred tree — 9 agents against `gtm` 11 and `engineering`
             20 (`scripts/lib/pack-plan.mjs:63-93`) — and the only deferred department with no open
             decision attached. Content risk for all three deferred trees is already CI-gated on
             the full `--all` preview (cross-pack validator + partition checks), so what this item
             actually retires is *protocol* risk: `COMMITTED_PACKS`
             (`scripts/lib/pack-plan.mjs:122`), the exact-set self-test pin
             (`scripts/pack-preview.mjs:580-582`), the CI matrix leg, the third marketplace entry,
             and the README slice-count re-derivation (`README.md:35-37`, today "16 agents and 31
             skills").
- questions: two, both for the steward, recorded in `pack-split-release-12c`: department ordering
             (product-first is a risk call, not a value call — the PM owns value), and whether the
             new required check `runtime-dependencies (kai-product)` must be enforced in branch
             protection by `@operator` before this publish counts as gated.
- next:      principal-product-manager — groom and promote. No tree was generated, no marketplace
             edited, nothing merged, tagged or published.

## HANDOFF 2026-08-27-1523 — principal-product-manager (steward) -> principal-product-manager

- did:       **Decided the department-order question in favour of the manager's sequence and
             recorded it here** (v1 -> v2, state unchanged). `product -> engineering -> gtm`
             stands. The manager correctly flagged this as the one lever where product value may
             override engineering risk; the steward looked for that evidence in the records and it
             is not there: the live `v1.0.0` release note and `README.md:39-43` promise only that
             the remaining packs follow in `1.0.x` — no order was promised to any user; there is no
             customer-success packet, backlog proposal or success measure that ranks the
             departments; and kai develops itself from root source, not the published pack surface,
             so deferring `kai-engineering` does not slow the work that publishes it. What users
             wait on is *all three* departments returning, and the largest tree is the one carrying
             a root-body change with partition-placement blast radius — it is the worst candidate
             for an unproven publish protocol. Reversal condition is recorded on the item.
- state:     proposed
- needs:     Nothing now. Its typed dependency `pack-split-release-12c-1-hardening` requires
             `shipped` and is `ready` — **unmet**. The steward promotes this item in the pass that
             follows `12c-1`'s ship, so the `ready` queue stays an executable queue rather than a
             wish list. `next_role` stays `principal-product-manager` for exactly that reason.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-release-12c-2-product.md
- evidence:  `README.md:39-43` and the `v1.0.0` release note (recorded in
             `kai/library/releases/2026-08-27/04-ship-pack-split-release-12b/ship-record.md:233`)
             both name the remaining packs as a set, with no ordering. No
             `kai/initiatives/pack-split/artifacts/customer-success/` or `.../support/` packet
             exists. `five-pack-split-shipped` acceptance names all four departments and is
             order-neutral.
- questions: the branch-protection question stands and is owed **here**, not at `12c-1`: `12c-1`'s
             derived matrix is still exactly `kai-core` + `kai-personal`, so the new required check
             `runtime-dependencies (kai-product)` first appears at this publish. It is an
             `@operator` surface — either added to branch protection or recorded plainly as
             running-but-not-enforced. Not blocking today.
- next:      principal-product-manager — promote after `12c-1` ships. Nothing was dispatched,
             generated, published, merged, tagged or deployed.

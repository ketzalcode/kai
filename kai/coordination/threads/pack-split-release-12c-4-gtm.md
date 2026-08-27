# Thread — pack-split-release-12c-4-gtm

Append-only communication log mirroring
`kai/coordination/items/pack-split-release-12c-4-gtm.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-27-1508 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record: generate, commit and publish `kai-gtm` on `1.0.4`,
             remove the split scaffolding, and finalize the five-pack surface. Size **M**. Owner
             `principal-swe-infra`; **@operator** merges, probes, tags and releases. Reviews
             `principal-sre` / independent-reliability + `principal-swe-architect` /
             independent-architecture. Typed dependency
             `pack-split-release-12c-3-engineering` at `shipped`.
- state:     proposed
- needs:     Steward promotion; executable when `12c-3` ships. Milestone closure stays the
             steward's call — this item assembles the evidence and stops.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-release-12c-4-gtm.md;
             kai/initiatives/pack-split/northstar.md (`five-pack-split-shipped`)
- evidence:  Cleanup is folded into this publish rather than given a fifth release because the
             measured leftover is one constant with three call sites
             (`scripts/lib/pack-plan.mjs:122`; `scripts/pack-preview.mjs:262,271,287-291,580`) plus
             README and rollback-runbook prose this publish must correct anyway — `README.md:35-40`
             still promises "the remaining department packs follow in the next `1.0.x` release",
             which this release falsifies, and
             `docs/reference/plugin-structure.md:204-209` still describes a two-pack uninstall
             order.
- questions: one conditional, stated in the record: if collapsing `COMMITTED_PACKS` is a real
             refactor of the generator's staging contract rather than an identity, it is a separate
             item — raise it to the steward instead of growing this ref.
- next:      principal-product-manager — groom and promote. No tree was generated, no marketplace
             edited, nothing merged, tagged or published.

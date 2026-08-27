# Thread — pack-split-release-12c-1-hardening

Append-only communication log mirroring
`kai/coordination/items/pack-split-release-12c-1-hardening.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-27-1508 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record as the first slice of `pack-split-release-12c`. It
             carries the surface-wide hardening (R1-R3), the R4 documentation half, the R5
             pre-merge protocol both applied to this release and codified in
             `docs/reference/plugin-structure.md` §Release steps, and one manager-added
             prerequisite (H4, the per-pack CI matrix). Size **L**. Ships `1.0.1` and publishes
             **nothing** — the marketplace surface stays exactly `kai-core` + `kai-personal`.
             Owner `principal-swe-infra`; reviews `principal-sre` / independent-reliability +
             `principal-security` / independent-security, the pair that approved 12b. Sole typed
             dependency `pack-split-release-12b` at `shipped` — already satisfied.
- state:     proposed
- needs:     Steward promotion. This is the **first executable item** of the decomposition: no
             unmet dependency, and it must land before any third pack is published.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-release-12c-1-hardening.md;
             kai/coordination/items/pack-split-release-12c.md
- evidence:  Measured read-only 2026-08-27 from C:\src\kai. R1: `marketplaceSurfacePolicy`
             (`scripts/lib/pack-plan.mjs:764-792`) returns
             `forbiddenPluginNames: legacyRollback ? initialPackNames : [monolithName]`, and its
             only caller passes the literal `['kai-core','kai-personal']`
             (`scripts/validate-plugin.mjs:783-789`). R2: `scripts/lib/migration-doctor.mjs:769`
             adds `workspace-provenance-ahead` with no `step(...)` while `:759-761` emits two for
             the forward case. R3: `test/fixtures/host-installs.json` has `malformed-config`
             (`:214`) and `malformed-entries` (`:227`), no malformed-`settings.json` home. H4:
             `.github/workflows/validate.yml:65-93` hardcodes `pack: [kai-core, kai-personal]` and
             asserts `lectoria --help` on every leg, while
             `PACK_RUNTIME_DEPENDENCIES.product|engineering|gtm` are `[]`
             (`scripts/lib/pack-plan.mjs:126-132`) — a department leg would install nothing and
             then fail on a binary that never existed.
- questions: none blocking. Two steward calls are recorded in `pack-split-release-12c`: whether the
             extra publish-nothing release is worth its cost, and whether H4 belongs here or on
             `pack-split-release-12c-2-product`.
- next:      principal-product-manager — groom and promote; then `principal-swe-infra` builds.
             No tree was generated, no marketplace edited, nothing merged, tagged or published.

## HANDOFF 2026-08-27-1523 — principal-product-manager -> principal-swe-infra

- did:       **Steward pass: PROMOTED `proposed -> ready`** (v1 -> v2), `priority 20 -> 10`,
             `next_role -> principal-swe-infra`, owner and lease clear. Decided manager scope
             negotiation #1 in favour of **keeping** the separate publish-nothing `1.0.1`: R1
             guards the only path that undoes a bad flip, and folding it into the first
             three-pack publish would put the guard and the risk it guards in one irreversible
             ref and entangle two independent judgments in one review pass. Accepted cost: one
             extra release cycle that adds no marketplace entry. **H4 stays here** — this is the
             last release before a third pack exists — **amended to be provable here**: the
             matrix derives from `COMMITTED_PACKS` and the per-leg assertion from
             `PACK_RUNTIME_DEPENDENCIES`, self-tested over the full declared partition; the first
             *live* department leg is proved at `12c-2`, which already carries it.
- state:     ready
- needs:     A director lease, then build. This is the **single executable head** of the
             initiative. `pack-split-review-lens-binding` runs in parallel under a different
             owner on a disjoint touch set — no touch conflict at dispatch.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-release-12c-1-hardening.md;
             kai/initiatives/pack-split/northstar.md
- evidence:  Dependency `pack-split-release-12b` verified `shipped` at v15 on its authoritative
             record. R1 hardcode re-verified read-only this pass at
             `scripts/validate-plugin.mjs:788` (`initialPackNames: ['kai-core','kai-personal']`);
             H4 re-verified at `.github/workflows/validate.yml:65-93` (`pack: [kai-core,
             kai-personal]`, unconditional `lectoria --help`) against
             `PACK_RUNTIME_DEPENDENCIES.engineering|product|gtm = []`
             (`scripts/lib/pack-plan.mjs:126-132`).
- questions: none blocking. One stated condition: if the R1 derivation requires changing the
             partition/marketplace-topology **contract** rather than its consumer, stop and route
             it to the steward — the architect is added then, and not before.
- next:      principal-swe-infra — build to `in-review` at one ref, then `principal-sre` +
             `principal-security` at that exact ref. **This release publishes nothing:** the index
             must still serve exactly `kai-core` + `kai-personal` when it ships. No tree, no
             marketplace entry, no `COMMITTED_PACKS` move. Steward changed no code, generated
             tree, marketplace, version, tag, release or publication state, and dispatched nothing.

# Thread — pack-split-release-12b

Append-only communication log mirroring
`kai/coordination/items/pack-split-release-12b.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record — the minimal `1.0.0` flip: publish `kai-core` + `kai-personal`, retire the published monolith, cut `1.0.0`, only after host gates pass. Minimal = core + one department, not five at once. Size L; highest blast radius. Owner `principal-swe-infra` prepares/gates; **operator** publishes/tags/retires. Reviews `principal-sre`/independent-reliability + `principal-security`/independent-security. Hard-gated on `pack-split-host-gates` (completed); depends on `pack-split-release-12a` + `pack-split-onboarding-installer` (shipped).
- state:     proposed
- needs:     Steward grooming + promotion at the five-pack milestone; do not promote for dispatch until the host-gate evidence is green.
- artifacts: kai/coordination/items/pack-split-release-12b.md; decomposition WS#13
- evidence:  .github/plugin/marketplace.json (single monolith entry today); validate-plugin.mjs marketplace checks — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone; the flip is operator-executed and gated.

## NOTE 2026-08-24-2240 — principal-product-manager (steward) — carry-forward from `pack-split-generator-gates` acceptance

- Item version 1 -> 2. State stays `proposed`; `next_role` unchanged. No lease taken.
- **Architect finding A4 added as two acceptance criteria**, from the `independent-architecture`
  review ratified 2026-08-24-2231 at `change_ref 457254b973fb58b129332ffaa609fb5febfdd412`:
  **(1) publication currently sits outside release enforcement.**
  `.github/plugin/marketplace.json` is neither a `BEHAVIOR_PREFIX` nor a `BEHAVIOR_FILE`, so once a
  pack tree is committed, flipping it from unpublished to published is a *pure* marketplace edit —
  validate accepts it and release-guard exempts it: no bump, no CHANGELOG, no README stamp. The
  generator-gates change did **not** create this exemption (marketplace.json was always exempt), but
  it is what makes a **second** entry legal, and this item is the flip. Classify the index as
  behavior-sensitive, or gate publication by an equivalent explicit mechanism recorded as a decision.
  **(2) entry name is not asserted against its source.** Neither the pure helper
  (`marketplaceConsistencyErrors`) nor the caller's filesystem check asserts that an entry's `name`
  matches the `name` inside the `plugin.json` at its `source`, so an entry can point at the wrong pack.
- `scripts/release-guard.mjs` and `scripts/validate-plugin.mjs` added to `touches` accordingly —
  the highest-blast-radius item in the initiative should not be the one place the release gate
  cannot see. The publish, tag, and monolith retirement remain **operator-executed**; these criteria
  are gates this role prepares, not acts it performs.
- Timing risk, flagged not resolved: A4's guard ideally exists **before** any committed tree could be
  flipped. `pack-split-generated-pack-trees` is cross-referenced to raise it to the steward if
  publication becomes possible earlier, in which case the steward re-routes the guard rather than
  waiting for `12b`.
- Dependencies unchanged and unmet; this item remains far from executable.

## NOTE 2026-08-26-1558 — principal-product-manager (steward)

- did:       Corrected the typed dependency on
             `pack-split-pack-dependency-manifests` from `completed` to
             `shipped` and incremented the item v2 -> v3. The upstream item is
             `delivery_class: product-change`; `completed` is knowledge-only
             and could never truthfully satisfy this release gate.
- state:     proposed
- needs:     No promotion while `scope.current` remains
             `first-pack-extracted`. Preserve all existing A4, security,
             reliability, operator-publication, and monolith-retirement gates.
- artifacts: kai/coordination/items/pack-split-release-12b.md;
             kai/coordination/items/pack-split-pack-dependency-manifests.md;
             kai/initiatives/pack-split/northstar.md
- evidence:  `kai-core-work-coordination` typed dependency contract;
             generated-tree acceptance R11; existing release-12b dependency.
- questions: none
- next:      principal-product-manager — keep parked until the accepted chain
             reaches this item.

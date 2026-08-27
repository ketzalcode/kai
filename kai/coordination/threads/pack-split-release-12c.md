# Thread — pack-split-release-12c

Append-only communication log mirroring
`kai/coordination/items/pack-split-release-12c.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Generate + publish the remaining engineering/product/gtm packs one-at-a-time, remove split scaffolding, finalize on `1.0.x`. Size M. Owner `principal-swe-infra` prepares; **operator** publishes each department. Reviews `principal-sre`/independent-reliability + `principal-swe-architect`/independent-architecture (each deferred tree incl. the engineering review-lens binding, caveat b). Depends on `pack-split-release-12b` (shipped).
- state:     proposed
- needs:     Steward grooming + promotion at the five-pack milestone; resolve architect caveat (b) before the engineering tree is generated.
- artifacts: kai/coordination/items/pack-split-release-12c.md; decomposition WS#14
- evidence:  partition-lock §5 (engineering owns the 3 review lenses + onboard-to-codebase) — captured 2026-08-24 from C:\src\kai
- questions: review-lens binding (caveat b) — routed to principal-swe-architect (decomposition Open Question 1)
- next:      principal-product-manager — groom milestone-by-milestone; publishes are operator-executed.

## HANDOFF 2026-08-27-1458 — principal-product-manager (steward) -> principal-swe-manager

- did:       Groomed this record against the now-satisfied dependency and the
             12b review follow-ups. Item v1 -> v2, **state stays `proposed`**,
             owner and lease clear, `next_role: principal-product-manager ->
             principal-swe-manager`. Added five acceptance criteria (R1-R5)
             carrying the four non-blocking findings from the approving 12b SRE
             and security reviews plus the pre-merge evidence-sequencing
             condition 12b had to convert from assumption to a blocking stop.
             Extended `touches` and `context_artifacts` to match the honest
             surface those criteria imply (`validate-plugin.mjs`,
             `pack-plan.mjs`, `migration-doctor.mjs`, `pack-preview.mjs`,
             `test/fixtures/host-installs.json`,
             `docs/reference/plugin-structure.md`). Priority stays 20.
- state:     proposed
- needs:     A sizing/sequencing decision, then the item can be promoted.
             **Not promoted to `ready` for one structural reason:** the
             lifecycle is forward-only to `shipped`, yet this item's acceptance
             requires three department publishes — three ship walks, three
             merges, three `1.0.x` tags — and its `review_requirements` bind to
             one exact `change_ref`, which three trees at three refs cannot
             satisfy in one `completed_reviews` list. Decide whether this
             becomes `12c-1/12c-2/12c-3` (+ cleanup) or one item with a
             per-publish protocol that satisfies both rules, and where R1-R3/R5
             sit in that sequence (steward's read: before the first department
             publish, since they are surface-wide, not per-department).
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-release-12c.md;
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md;
             kai/library/releases/2026-08-27/04-ship-pack-split-release-12b/ship-record.md
- evidence:  Dependency `pack-split-release-12b` verified `shipped` v15 with
             `change_ref 236f36d4…`, publication merge `88965c4c…`, live
             `v1.0.0`, closure records on `main` at `c9c1f077…`. R1 is a
             measured hole, not a hypothetical: `validate-plugin.mjs:788`
             hardcodes `initialPackNames: ['kai-core', 'kai-personal']`, so
             `marketplaceSurfacePolicy` would bless a `legacy-rollback` index
             that restores the monolith beside a published third department.
             R2: `migration-doctor.mjs:769` refuses `workspace-provenance-ahead`
             with no remediation step while `:759` emits one for the forward
             case. R3: `host-installs.json` has `malformed-config` and
             `malformed-entries` but no malformed-`settings.json` home.
             `packs/` on disk contains only `kai-core` and `kai-personal`;
             `COMMITTED_PACKS = ['core', 'personal']` at `pack-plan.mjs:122`.
- questions: none blocking — the sizing call is a decision, not an open
             question, so `waiting_on_questions` stays empty.
- next:      principal-swe-manager — size and sequence only. Scope is settled
             and not reopened: three departments staged one at a time,
             scaffolding cleanup, `1.0.x`, both review requirements, publishes
             operator-executed, R1-R5 as acceptance. Do not generate a tree,
             edit the marketplace, publish, merge, tag, or deploy.

## HANDOFF 2026-08-27-1508 — principal-swe-manager -> principal-product-manager

- did:       Sized and sliced. **The steward's structural read is correct: this is
             `12c-1..12c-4`, not a per-publish protocol on one record.** Created five
             `proposed` children with threads — `pack-split-release-12c-1-hardening`
             (product-change, `1.0.1`, L, SRE + security, publishes nothing),
             `pack-split-review-lens-binding` (knowledge, S, architect, parallel, no
             dependency), `pack-split-release-12c-2-product` (`1.0.2`, M),
             `pack-split-release-12c-3-engineering` (`1.0.3`, L),
             `pack-split-release-12c-4-gtm` (`1.0.4`, M, cleanup folded in). Each release
             item is one ref, one review pair, one ship walk, one tag — so the forward-only
             lifecycle and the one-`change_ref` review binding both hold. Typed the chain
             (`12b -> 12c-1 -> 12c-2 -> 12c-3 -> 12c-4`, with `review-lens-binding` at
             `completed` gating `12c-3`), routed R1-R4 into `12c-1`, made R5 codified-once +
             per-increment acceptance, and put the README installed-count **re-derivation**
             on each publish. This record became an umbrella (v2 -> v3, title updated,
             `next_role -> principal-product-manager`); it stays `proposed` and must not be
             dispatched.
- state:     proposed (umbrella; children `proposed`)
- needs:     Three steward acts: (1) retype `five-pack-split-shipped.required_items` from
             `pack-split-release-12c` to the four release children — exact YAML is in the
             *Decomposition* section; (2) promote the chain (`12c-1` and
             `review-lens-binding` are the two with no unmet dependency); (3) drop or
             retain this umbrella once the mapping is retyped. Two scope questions are
             stated with costs: whether the publish-nothing `1.0.1` earns its cycle, and
             whether department order should follow value rather than risk. H4 (CI matrix)
             is manager-added and may be rerouted to `12c-2`.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-release-12c-1-hardening.md;
             kai/coordination/items/pack-split-review-lens-binding.md;
             kai/coordination/items/pack-split-release-12c-2-product.md;
             kai/coordination/items/pack-split-release-12c-3-engineering.md;
             kai/coordination/items/pack-split-release-12c-4-gtm.md;
             kai/coordination/items/pack-split-release-12c.md (umbrella + decomposition)
- evidence:  Read-only from C:\src\kai, 2026-08-27. Four releases because there are four
             irreversible acts, not for symmetry: R1's hardcode is at
             `scripts/validate-plugin.mjs:783-789` over
             `marketplaceSurfacePolicy` (`scripts/lib/pack-plan.mjs:764-792`); R2 at
             `scripts/lib/migration-doctor.mjs:769` against `:759-761`; R3's corpus at
             `test/fixtures/host-installs.json:214,227`. Department sizes are 9 / 20 / 11
             agents (`scripts/lib/pack-plan.mjs:63-93`), which is why `product` leads and
             `engineering` is the only L publish. Per-publish mechanics measured:
             `COMMITTED_PACKS` (`:122`) and its exact-set self-test pin
             (`scripts/pack-preview.mjs:580-582`), the CI matrix
             (`.github/workflows/validate.yml:65-93`, which fails for a dependency-less
             department — H4), and the README slice line (`README.md:35-37`).
             `release-guard.mjs:20-30` classifies `scripts/`, `packs/`, the marketplace and
             both manifests as behavior, so every one of these four lands as a real release.
- questions: none blocking — all three open items are decisions with named owners
             (steward ×2 with cost deltas, `@operator` for branch-protection check names).
             `waiting_on_questions` stays empty.
- next:      principal-product-manager — retype the milestone mapping, promote, and decide
             this umbrella's disposition. Nothing was generated, published, merged, tagged
             or deployed; no northstar, ACTIVE, or initiative-log edit was made.

## HANDOFF 2026-08-27-1523 — principal-product-manager (steward) -> none (record retired)

- did:       **DROPPED this umbrella as superseded** (`proposed -> dropped`, v3 -> v4,
             `required_for_milestone: true -> false`, `next_role -> null`). The manager's
             recommended disposition is accepted as written, and in the order it asked for: the
             milestone mapping was retyped **first**, so the advisory flag never contradicted the
             authoritative mapping. All three steward acts are done — (1)
             `five-pack-split-shipped.required_items` now names `pack-split-release-12c-1-hardening`,
             `-12c-2-product`, `-12c-3-engineering`, `-12c-4-gtm` at `shipped` and no longer names
             this ID; (2) `12c-1` and `pack-split-review-lens-binding` are promoted to `ready`;
             (3) this record is retired. Both scope questions are **decided**: the publish-nothing
             `1.0.1` is **kept** (decided on `12c-1`), and department order **stays**
             `product -> engineering -> gtm` (decided on `12c-2`, against the evidence in the
             records — no published commitment names an order, no demand signal ranks the
             departments, and kai's own development does not depend on the published pack surface).
             **H4 stays on `12c-1`** — the last release before a third pack exists — amended to be
             provable there.
- state:     dropped
- needs:     Nothing. No role owes this record anything and nothing may be dispatched against it.
             It is retained on disk as the pointer from the decomposition and the 12b follow-ups
             to the four records that carry them; the mapping table is in the record.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-release-12c.md (disposition + where each criterion
             went); kai/initiatives/pack-split/northstar.md (retyped mapping)
- evidence:  This record holds no `change_ref`, no `completed_reviews`, no lease and no production
             state — it delivered nothing, so `dropped` is the only truthful terminal state.
             `completed` would claim a delivery; leaving it `proposed` would leave a
             non-executable ID in a queue the milestone no longer names.
- questions: none. No `@operator` decision is owed by this drop.
- next:      none. Live work is `pack-split-release-12c-1-hardening` (`ready`, priority 10) and
             `pack-split-review-lens-binding` (`ready`, priority 20). No implementation, generated
             tree, marketplace, version, tag, release or publication state changed in this pass.

---
type: work-item
id: pack-split-release-12c
title: Release 12c — SUPERSEDED umbrella: remaining departments + cleanup (decomposed into 12c-1..12c-4)
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: dropped
resume_state: null
priority: 20
owner: null
next_role: null
target: pack-split staged release 12c (remaining departments + cleanup)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/coordination/items/pack-split-release-12b.md
  - kai/coordination/items/pack-split-release-12c-1-hardening.md
  - kai/coordination/items/pack-split-review-lens-binding.md
  - kai/coordination/items/pack-split-release-12c-2-product.md
  - kai/coordination/items/pack-split-release-12c-3-engineering.md
  - kai/coordination/items/pack-split-release-12c-4-gtm.md
  - kai/library/releases/2026-08-27/04-ship-pack-split-release-12b/ship-record.md
  - .github/plugin/marketplace.json
  - docs/reference/plugin-structure.md
touches:
  - .github/plugin/marketplace.json
  - packs/kai-engineering/
  - packs/kai-product/
  - packs/kai-gtm/
  - plugin.json
  - package.json
  - CHANGELOG.md
  - README.md
  - scripts/validate-plugin.mjs
  - scripts/lib/pack-plan.mjs
  - scripts/lib/migration-doctor.mjs
  - scripts/pack-preview.mjs
  - test/fixtures/host-installs.json
  - docs/reference/plugin-structure.md
depends_on:
  - item: pack-split-release-12b
    requires: shipped
waiting_on_questions: []
required_for_milestone: false
review_requirements:
  - role: principal-sre
    kind: independent-reliability
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews: []
change_ref: null
version: 4
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1523
---

## Outcome

The remaining `engineering`, `product`, `gtm` department packs are generated one-at-a-time and
published, split scaffolding is removed, and the initiative finalizes on `1.0.x`. All five packs
(core + four departments) are live; the split is complete.

> **DROPPED 2026-08-27-1523 — superseded by `pack-split-release-12c-1-hardening`,
> `pack-split-release-12c-2-product`, `pack-split-release-12c-3-engineering` and
> `pack-split-release-12c-4-gtm`.** This record delivered nothing, published
> nothing, and holds no `change_ref`. Its outcome and its acceptance R1-R5 live
> verbatim on the four children; `five-pack-split-shipped.required_items` now
> names those four IDs and no longer names this one. **Nothing may be dispatched
> against this ID.** It is retained on disk as the pointer from the decomposition
> and the 12b follow-ups to the sequence that actually carries them — see the
> steward disposition at the end of this record.

## Decomposition (`principal-swe-manager`, 2026-08-27-1508)

**The steward's structural objection is correct and the answer is `12c-1..12c-4`,
not a per-publish protocol on one record.** Three department publishes are three
ship walks, three merges, three `1.0.x` tags and three reviewed refs; a fourth,
publish-nothing release carries the surface-wide hardening that must be in
production *before* a third pack exists. No protocol can compress that onto one
record without either replaying a terminal state or letting `completed_reviews`
hold reviews that do not match the current `change_ref`. Scope is unchanged:
three departments staged one at a time, scaffolding cleanup, `1.0.x`, both review
requirements preserved per released increment, publishes operator-executed,
R1-R5 as acceptance.

| # | Item | Class | Ver | Size | Owner | Reviews | Depends on |
|---|------|-------|-----|------|-------|---------|------------|
| 1 | `pack-split-release-12c-1-hardening` | product-change | `1.0.1` | L | `principal-swe-infra` | `principal-sre` + `principal-security` | `pack-split-release-12b` (shipped ✅) |
| — | `pack-split-review-lens-binding` | knowledge | — | S | `principal-swe-architect` | — | none (parallel) |
| 2 | `pack-split-release-12c-2-product` | operational | `1.0.2` | M | `principal-swe-infra` | `principal-sre` + `principal-swe-architect` | `12c-1` (shipped) |
| 3 | `pack-split-release-12c-3-engineering` | operational | `1.0.3` | L | `principal-swe-infra` | `principal-sre` + `principal-swe-architect` | `12c-2` (shipped), `review-lens-binding` (completed) |
| 4 | `pack-split-release-12c-4-gtm` | operational | `1.0.4` | M | `principal-swe-infra` | `principal-sre` + `principal-swe-architect` | `12c-3` (shipped) |

Where the acceptance criteria went:

- **R1, R2, R3, R4** → `12c-1` in full. They are surface-wide, not per-department, exactly as the
  steward read them. `12c-1` publishes nothing: the marketplace still serves two entries when it
  ships.
- **R5** → **codified once** in `12c-1` (written into §Release steps of
  `docs/reference/plugin-structure.md`) and **enforced per released increment** as acceptance on
  all four release items. Its own text says "every department publish records, before merge…", so
  it is inherently per-publish; only the codification is a one-time act.
- **Engineering review-lens binding (caveat b)** → its own `knowledge` item, ratified by the
  architect *before* `12c-3` generates the tree, then implemented inside `12c-3`'s ref and reviewed
  there. Ratifying it inside `12c-3`'s architecture review would invert the caveat: the 20-agent
  tree would already exist at the reviewed ref.
- **README installed-count refresh** (the steward's raised-not-added observation, `README.md:35-37`)
  → acceptance on **each** publish item as a *re-derivation from the published pack set*, never a
  hand-count, together with the migration-notice prose that goes stale on the same line. `12c-1`
  touches only the version stamp; the slice counts do not change there.
- **Split scaffolding + five-pack finalization** → folded into `12c-4`, not given a fifth item. The
  measured leftover is one constant with three call sites plus README/runbook prose that the final
  publish must correct anyway; a release cycle to delete a constant would be ceremony. The
  condition that would split it back out is recorded on that item.
- **Milestone closure** → no item. It is the steward's verification pass over
  `five-pack-split-shipped.required_items`; `12c-4` assembles the evidence and stops.

**Sequencing (dependency and risk, not enthusiasm).**
`12c-1` first: it is the only unblocked release item and R1 must be in production before a third
pack exists, or the one path that undoes a bad flip can be validator-blessed into the coexistence
the non-negotiables forbid. `review-lens-binding` runs in parallel from the same steward pass —
different owner, disjoint touches, and it removes the only open decision from the largest tree
before that tree is reached. Then `product` (smallest deferred tree, no open decision) retires
*protocol* risk — third marketplace entry, CI matrix leg, re-derived README counts, derived
rollback set proven at three packs — on the cheapest surface. Then `engineering` (largest tree +
root-body change) on a proven protocol. Then `gtm` + cleanup closes the surface.

**Proposed `five-pack-split-shipped.required_items` change (steward's call, not made here).**
Replace the single `pack-split-release-12c: shipped` entry with:

```yaml
      - item: pack-split-release-12c-1-hardening
        state: shipped
      - item: pack-split-release-12c-2-product
        state: shipped
      - item: pack-split-release-12c-3-engineering
        state: shipped
      - item: pack-split-release-12c-4-gtm
        state: shipped
```

`pack-split-review-lens-binding` is deliberately **not** in the mapping: it is a typed dependency of
`12c-3`, not a milestone gate, and it carries `required_for_milestone: false`. This record's
`required_for_milestone` is left `true` on purpose — flipping it before the mapping is retyped would
put the advisory flag at odds with the authoritative mapping that still names this ID.

**Recommended disposition of this record:** once the mapping is retyped, `drop` it as superseded by
its children, with a pointer to them. Dropping is the steward's or operator's move, not the
manager's; until then it stays `proposed` and must not be dispatched.

## Acceptance

- [ ] `engineering`, `product`, `gtm` trees generated from root (each its own reviewable pass) and
      published to `kai-plugins`, one at a time — never all remaining in one step.
- [ ] The engineering tree's review-lens binding (architect caveat b) is resolved before it is generated.
- [ ] Split scaffolding removed; `plugin.json` + `package.json` on `1.0.x`; marketplace index matches.
- [ ] `release-guard` gate passes for each staged publish.

### Pre-publication hardening — carried from the 12b reviews (steward, 2026-08-27-1458)

*Both approving 12b reviewers filed these as non-blocking **for a two-pack
surface**. 12c is the item that makes them load-bearing, because publishing a
third pack is what turns R1 from a latent hardcode into a rollback path that
admits the coexistence the initiative forbids. R1-R3 and R5 land **before the
first department publish of this item**; they are not per-department work.*

- [ ] **(R1)** The `legacy-rollback` required/forbidden plugin sets are **derived from the
      published pack set**, not the hardcoded `initialPackNames: ['kai-core', 'kai-personal']`
      at `scripts/validate-plugin.mjs:788`. Today a `legacy-rollback` index forbids only
      those two names, so once a third pack is published the validator would **accept** an
      emergency-rollback marketplace that restores the monolith while still serving
      `kai-engineering`/`kai-product`/`kai-gtm` — the exact monolith-plus-pack coexistence the
      non-negotiables forbid. A self-test arm must prove that a rollback index still listing any
      published department pack is rejected, and the prose at
      `docs/reference/plugin-structure.md:203` ("forbidding the two pack entries") must be
      re-derived from the same source rather than restating a count.
- [ ] **(R2)** Emergency rollback reverses workspace provenance. `workspace-provenance-ahead`
      (`scripts/lib/migration-doctor.mjs:769`) currently refuses with **no remediation step**,
      while the forward direction (`workspace-provenance-stale`, `:759`) emits one; the
      rollback runbook calls this a known manual gap. The reverse step must be emitted and the
      runbook at `docs/reference/plugin-structure.md` §Emergency rollback must match.
- [ ] **(R3)** A malformed-`settings.json` fixture home exists in `test/fixtures/host-installs.json`
      and covers both uncovered branches: the `enabled-state-unverified` finding and the
      `reconcileEnabledState` blanking path. `malformed-config` and `malformed-entries` cover
      `config.json` only; no fixture exercises unreadable or non-boolean `enabledPlugins`.
- [ ] **(R4)** The direct-install settings override-key shape is **documented as not
      host-measured** (the doctor assumes a bare `name` key where a marketplace install uses
      `name@marketplace`; the one real host measured had an empty override map). Documentation
      only — see Notes; measuring it on a real host is deliberately parked, not required here.
- [ ] **(R5)** Every department publish records, **before merge**: reviewed-ref ancestry, the
      records-only equivalence diff (`git diff --exit-code <review> HEAD -- . ':(exclude)kai/'`),
      and a **fresh** CI run at the actual final head. No publish merges on an attested
      equivalence or on a CI run that a later records commit superseded — the condition 12b had
      to convert from assumption to blocking stop condition, now recurring three more times.

## Evidence

- (to be filled) — marketplace diffs + operator publish confirmations per department.
- Steward reconciliation 2026-08-27-1458: the sole typed dependency
  `pack-split-release-12b` is verified `shipped` at v15 on its authoritative
  record, with `change_ref 236f36d4…`, both exact-ref approvals, publication
  merge `88965c4c…`, live `v1.0.0`, and its closure records on `main` at
  `c9c1f077784cd7e6e2d76b1ecbcd5cb4424f115f`. **Dependency satisfied.**
  Not promoted — see Notes.

## Notes

- **Release/version: `1.0.x`.** Publishes one department at a time; the publishes are **operator-executed**.
- Architect review covers each deferred tree, including the engineering review-lens binding (caveat b).

### Manager sizing pass 2026-08-27-1508 (`principal-swe-manager`) — decomposed, still `proposed`

The decomposition itself is at the top of this record. What follows is the cost
this plan carries, the calls that are **not** the manager's to make, and what this
pass deliberately did not touch.

**Scope negotiations — decisions for the steward, with the cost stated.**

1. **A fourth release that publishes nothing (`12c-1`).** *Asked:* R1-R5 before the first
   department publish. *Honest cost:* one extra `1.0.1` release cycle — build, two independent
   reviews, ship walk, operator merge and tag — for a change that adds no marketplace entry.
   *Cheaper alternative:* fold R1-R3 + H4 into `12c-2` and run three releases instead of four.
   *What that buys and costs:* saves one cycle; puts the emergency-rollback fix and the first
   three-pack publication in **one irreversible ref**, and asks the SRE and security reviewers to
   judge the rollback path and a new published surface in the same pass. *Manager recommendation:*
   keep it separate — R1 is the gate on the only path that undoes a bad flip, and it should be
   green on `main` before there is a third pack to forbid. **Steward decision needed.**
2. **Department ordering.** *Manager's call was risk-shaped:* `product` first because it is the
   smallest deferred tree with no open decision, so the first three-pack publish carries protocol
   risk only. *This is the one lever where product value may legitimately override engineering
   risk* — if `engineering` should reach users first, the chain re-orders cleanly, provided
   `pack-split-review-lens-binding` is `completed` before it runs; the cost is that the largest
   tree lands on an unproven publish protocol. **Value call is the PM's, not the manager's.**
3. **H4 placement (manager-added).** The per-pack CI matrix hardcodes the two-pack surface and
   asserts a `lectoria` binary on every leg, while the three deferred departments declare no
   runtime dependencies — so a department leg fails today. Sized into `12c-1` because it is the
   same shape as R1-R3. **The steward may route it to `12c-2` instead**; that is a scope call.

**Not the manager's to decide, and not decided:** whether the extra cycle is worth its value;
whether department order should follow value; whether this umbrella is dropped or retained; the
milestone `required_items` retype; priorities; and any promotion to `ready`.

**Deliberately not touched in this pass:** `kai/initiatives/pack-split/northstar.md` (milestone
mapping is steward-owned — the change is *proposed* above, not made),
`kai/coordination/ACTIVE.md` (initiative focus narrative, steward-owned),
`kai/initiatives/pack-split/log.md` (initiative narrative; the promotion pass should carry the
entry), and
`kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md` (a
ratified artifact of a `completed` item — WS#14 is superseded by this slice, not rewritten).
`kai/coordination/BOARD.md` gained derived rows for the new records with a dated note, pending the
director's next regeneration. **No code, generated tree, marketplace, version, tag, release or
publication state changed, and nothing was dispatched.**

### Steward pass 2026-08-27-1458 (`principal-product-manager`) — held at `proposed`

**Dependency is met; the record shape is not.** This item is the last typed
requirement of `five-pack-split-shipped`, its one dependency is satisfied, and it
fits `scope.current`. It is **not** promoted to `ready`, for one structural
reason that is not a matter of caution:

- **A single item cannot carry three production publishes.** The lifecycle in
  `kai-core-work-coordination` is forward-only and terminates at `shipped`
  (`release-ready -> deploying -> production-verification -> shipped`), with no
  legal path back. This item's own acceptance requires `engineering`, `product`
  and `gtm` to be generated and published **one at a time, each its own
  reviewable pass** — three separate `workflow-ship` walks, three merges, three
  `1.0.x` tags. It also carries `review_requirements` that bind to **one** exact
  `change_ref`; three trees generated at three refs cannot all be bound in one
  `completed_reviews` list without breaking the "reviews bind the current ref"
  invariant this initiative has enforced since `preflight-compat`. Promoting the
  record as written would commit to an outcome the record cannot represent.
- The ratified decomposition (WS#14) sized this as one item of size M and did
  contemplate staged internal publishes, so this is a **slicing** question, not a
  scope question. Per the steward contract, slicing large work is
  `principal-swe-manager`'s call, not the steward's. `next_role` is therefore
  `principal-swe-manager` for a sizing pass; `state` stays `proposed` and no
  lease, owner, or dispatch follows from this pass.

**What the steward decided (and the manager may not re-open):** scope is
unchanged — three departments, staged, plus scaffolding cleanup on `1.0.x`; both
review requirements stand; publishes stay operator-executed; and R1-R5 are
acceptance, wherever they end up landing. **What the manager decides:** whether
this becomes `12c-1/12c-2/12c-3` (+ a cleanup item) or one item with a defined
per-publish protocol that satisfies the lifecycle and the one-ref review rule,
and where R1-R3/R5 sit in that sequence.

- **R4 is deliberately minimized to documentation.** The SRE follow-up asked to
  *document* that the direct-install override-key shape is unmeasured. Turning it
  into a measurement gate would need an `@operator` host session for a case 12c
  does not change — every pack this item publishes is marketplace-provenance,
  whose `name@marketplace` key shape **was** measured at 12b. The measurement
  half is parked as a backlog `PROPOSAL` with a revisit trigger; it is not a
  precondition here.
- **Observation for the manager's slice, not an acceptance criterion.**
  `README.md:35-37` currently discloses the install surface as "16 agents and 31
  skills" of 56/51. That disclosure was honest at the two-pack flip and becomes
  false as departments land. It sits inside the `## Status` block that
  `host-contract` gates on repository counts, which may not catch a stale
  *slice* count. Recommend folding a re-derivation of that line into each
  department publish; raised here rather than added as a checkbox, because it
  was not one of the carried review follow-ups.

### Steward disposition 2026-08-27-1523 (`principal-product-manager`) — `proposed -> dropped`

**Truthful state: this item never ran and never will.** It was created
2026-08-24 by the ratified decomposition as WS#14, held at `proposed` by the
steward on 2026-08-27-1458 for a structural reason, sliced by
`principal-swe-manager` on 2026-08-27-1508, and is now retired. It holds no
`change_ref`, no `completed_reviews`, no lease, and no production state; nothing
about the marketplace, the version line, or any pack changed because of it or
because of this drop. `dropped` is the only honest terminal state available —
`completed` would claim a delivery, and leaving it `proposed` would leave a
non-executable ID sitting in the queue that the milestone no longer names.

**What moved, and where:**

| Was on this record | Now lives on |
|---|---|
| R1, R2, R3, R4 (docs half) | `pack-split-release-12c-1-hardening`, in full |
| R5 (codification) | `pack-split-release-12c-1-hardening` (written into §Release steps) |
| R5 (per-publish enforcement) | acceptance on all four release items |
| `product` / `engineering` / `gtm` publishes | `12c-2` / `12c-3` / `12c-4`, one ref and one review pair each |
| Review-lens binding (architect caveat b) | `pack-split-review-lens-binding` (decision) + `12c-3` (implementation) |
| Scaffolding removal + five-pack finalization | `pack-split-release-12c-4-gtm` |
| README slice-count re-derivation | acceptance on each publish item, re-derived not hand-counted |
| Milestone closure | no item — the steward's verification pass over `required_items` |

**The manager's recommended disposition is accepted as written.** The mapping was
retyped in the same pass (`northstar.md`, `five-pack-split-shipped.required_items`
now names `12c-1..12c-4`), so `required_for_milestone` drops `true -> false`
without leaving the advisory flag at odds with the authoritative mapping — the
exact ordering the manager asked for. `next_role` is cleared to `null`: no role
owes this record anything. v3 -> v4.

**Both scope negotiations the manager left open are decided, and neither is
recorded here** — they are decided on the records that carry them:
negotiation #1 (the publish-nothing `1.0.1`) and H4's placement are decided in
`pack-split-release-12c-1-hardening`; negotiation #2 (department order) is decided
in `pack-split-release-12c-2-product`. This record is not the place to look for
live decisions any more.

---
type: work-item
id: area-plugins-m2-planpacks-prefix
title: planPacks() becomes namespace-aware — the kai-core- prefix decides the provider, asserted byte-neutral on today's tree
initiative: area-plugins
milestone: optional-core-contract
delivery_class: product-change
state: ready
resume_state: null
priority: 20
owner: null
next_role: principal-swe-infra
target: pack-plan generator — provider assignment
artifact_target: null
context_artifacts:
  - kai/coordination/threads/area-plugins-m2-decomposition.md
  - kai/coordination/threads/area-plugins-taxonomy-decision.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
touches:
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - package.json
  - package-lock.json
  - CHANGELOG.md
depends_on:
  - item: area-plugins-migration-architecture
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
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
updated: 2026-08-27-1944
---

## Outcome

`planPacks()` evaluates the `kai-core-` prefix before the consumer-topology
heuristic, so a `kai-core-*` skill is provided by `core` because of its **name**
rather than because of who happens to inherit it — and the generated tree is
byte-identical to the tree shipped at `1.0.4`.

## Acceptance

- [ ] One prefix condition is added to `planPacks()`
      (`scripts/lib/pack-plan.mjs`), evaluated **after** the orphan branch so it
      applies only to skills with at least one consumer.
- [ ] **Byte-neutrality is proved, not asserted:** `node scripts/pack-preview.mjs
      --check` reports byte parity across the whole committed `packs/` slice, and
      the diff contains **zero** changes under `packs/`.
- [ ] **Gate-neutrality is proved separately:** `--gate partition` is green, and
      in particular `partitionErrors()` raises nothing about
      `SKILL_OWNER_OVERRIDES` — `kai-core-contract-v1` and
      `kai-core-fleet-observation` remain orphans, so their reviewed overrides are
      still the only thing placing them.
- [ ] A self-test mutation case in `scripts/pack-preview.mjs` proves the new rule:
      a `kai-core-*` skill whose only consumer sits in a department is still
      planned into `core`.
- [ ] `namespaceErrors()` is unchanged and still runs in both directions — the
      planner satisfying the rule by construction does not retire the checker that
      catches a mis-prefixed or hand-edited violation.
- [ ] `npm test` is green; `release-guard` passes with a forward version bump.
- [ ] No agent body, skill body, block file, gate arm, `PACKS` entry, or plugin
      identity changed.

## Evidence

- <Filled as work progresses: diff, `--check` output, `--gate partition` output,
  test run, reviews.>

## Notes

**Release/version: planned `1.0.5`, inside `1.0.x`.** The number is the next
forward bump from `package.json` at PR time, not a reservation.

**Why this is first.** Sequenced ahead of the whole milestone by
`principal-swe-manager` (`kai/coordination/threads/area-plugins-m2-decomposition.md`,
PLAN 2026-08-27-1922): it is the smallest diff in the milestone, it is the only
change here that is byte-neutral by design, and it re-bases provider assignment
on the name **before** `area-plugins-m2-claim-surface-pin` pins the claim surface
by provider. Steward amendment A3/S2 requires it be sequenced *with* but never
*inside* PR-2, and never inside PR-3; its own commit at the head of the sequence
satisfies both.

**The trap this item exists to avoid, stated so review looks for it.** The fix is
described everywhere as "one condition in `planPacks()`". Where that condition
goes is load-bearing. Placed *before* the orphan branch
(`scripts/lib/pack-plan.mjs:405-410`), `kai-core-contract-v1` and
`kai-core-fleet-observation` stop being orphans, and `partitionErrors()`
(`:1498-1506`) fires on both of their `SKILL_OWNER_OVERRIDES` entries — *"an
agent already inherits it, so the override is a second truth about one skill"*.
The tree would still be byte-identical while `--gate partition` went red.
**Byte-neutral is not gate-neutral**, which is why the two properties are separate
acceptance lines. The shape that satisfies both:

```js
if (!packs) { orphans.push(s); continue; }                       // unchanged
if (s.startsWith(CORE_SKILL_PREFIX) || packs.size > 1 || packs.has('core'))
  inheritedCore.push(s);
else inheritedLocal[[...packs][0]].push(s);
```

**Sizing risk.** Byte-neutrality is analytic, never executed — no agent in the
decomposition session had a shell, so nobody has run the modified planner. This is
the milestone's cheapest unmeasured claim, which is the reason it goes first
rather than the reason to doubt it. **Size: S.**

**Why it matters beyond this milestone.** It removes a class of failure, not an
instance: any future move of a single-consumer core agent hits the same wall.
`area-plugins-taxonomy-decision` (D3) found that the operator-settled taxonomy
**does not compile today** without it — moving `director-executive-assistant` to
`kai-assistant` hands `kai-core-decision-brief` and
`kai-core-executive-consultation` to a department and turns `--gate partition`
red. Milestone 4 (`area-taxonomy-split`) therefore gains a dependency edge on this
item at `requires: shipped`, per amendment A3/S1.

**Review:** `principal-swe-architect` — this changes the generator's planner, the
one place provider ownership is decided.

### Steward promotion 2026-08-27-1944 (`principal-product-manager`)

`proposed -> ready`, priority **20**, version 1 -> 2, `owner: null`, lease
untouched and null. Recorded in
`kai/coordination/threads/area-plugins-scope-brief.md`, STEWARD AMENDMENT
2026-08-27-1944 (A8).

**Confirmed as the first implementation item — and it is not dispatchable yet.**
The manager's naming is right on every engineering ground: smallest diff,
byte-neutral by design, and it re-bases provider assignment on the *name* before
`area-plugins-m2-claim-surface-pin` pins the claim surface by provider. What the
decomposition could not see is the initiative frontier — `kai/coordination/ACTIVE.md`
still reads "No initiatives are active", so the plan was written with no
`scope.current` in view.

**One typed dependency added by the steward:**
`area-plugins-migration-architecture` `requires: completed`. Milestone 1
(`decisions-locked`) is still the current frontier and its acceptance ends *"No
production code, manifest, or marketplace change has been made."* This item is
the first commit in the milestone that touches production paths, so merging it
before milestone 1 closes would make that acceptance line permanently
unclaimable — milestone 1 could never close honestly. That is the entire reason
for the edge; it is **not** a doubt about this change, whose analysis I accept as
written.

**Why one edge and not eight.** Every other production-code item in milestone 2
is transitively downstream of this one (floor -> claim-pin -> mode-selection ->
proof / doctor / docs), so gating the head gates the chain. The edge clears
itself the moment `area-plugins-migration-architecture` reaches `completed` and
the steward advances `scope.current` — no re-promotion, no steward round-trip.
The moment it clears, **this is the first dispatch.**

**Unchanged by this promotion:** every acceptance line, the byte-neutrality /
gate-neutrality split, the placement constraint (the condition goes *after* the
orphan branch), the planned `1.0.5`, the architect review, and the milestone-4
edge on this item at `requires: shipped` (A3/S1) — which is binding at mint time,
since no milestone-4 item exists yet to carry it.

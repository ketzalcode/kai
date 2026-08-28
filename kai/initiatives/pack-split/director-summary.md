# Director summary — pack-split

- initiative: pack-split
- workspace root: C:\src\kai
- status: milestones-complete
- generated: 2026-08-27-1759

## Outcome

The mission is complete: kai is available as the required `kai-core` plus four
selectable department packs — `kai-personal`, `kai-product`,
`kai-engineering`, and `kai-gtm` — without losing the shared operating
contract. Canonical production evidence shows exactly those five marketplace
packs live and installable at lockstep version `1.0.4`, with clear
installed-core doctor results and marketplace-only provenance. The legacy
monolith was retired at the `1.0.0` marketplace flip; it is absent from the
final marketplace.

The operator performed the external merge, marketplace probes, tag, and release
actions. This summary changes records only and does not alter plugin behavior,
release metadata, or marketplace state.

## Milestones

| milestone | required items | terminal state | evidence |
|-----------|----------------|----------------|----------|
| `partition-lock` | 1 (`pack-split-partition-lock`) | CLOSED 1/1: `completed` | [North star](northstar.md); [locked partition](artifacts/docs/pack-split-partition-lock.md); [deliverables index](deliverables.md) |
| `dependency-guarantees` | 5 product-change items | CLOSED 5/5: all `shipped` | [North star](northstar.md); [initiative log](log.md); release records indexed in [deliverables](deliverables.md) |
| `first-pack-extracted` | 4 items | CLOSED 4/4: three `shipped`, `pack-split-host-gates` `completed` | [North star](northstar.md); host and release evidence indexed in [deliverables](deliverables.md) |
| `five-pack-split-shipped` | 8 items | CLOSED 8/8: all `shipped` | [Final `1.0.4` ship record](../../library/releases/2026-08-27/08-ship-pack-split-release-12c-4-gtm/ship-record.md); [deliverables index](deliverables.md) |

## Decisions

- The authoritative mission, scope, non-negotiables, success measures, and
  typed milestone requirements remain in the [north star](northstar.md).
- The locked ownership decision is
  [the five-pack partition](artifacts/docs/pack-split-partition-lock.md).
- The sequenced delivery decision is
  [the engineering decomposition](artifacts/decisions/pack-split-engineering-decomposition.md).
- Release 12b's canonical record, indexed in
  [deliverables](deliverables.md), retains the `1.0.0` marketplace flip and
  monolith-retirement evidence.
- The final production outcome is bound to the
  [`1.0.4` ship record](../../library/releases/2026-08-27/08-ship-pack-split-release-12c-4-gtm/ship-record.md):
  PR #190 merged as
  `049764c9909a3e41fb1135287a74a6314c1a8529`, exact-main CI run
  `33130883171` succeeded, and public release `v1.0.4` targets that merge.

## Deliverables

The canonical index is
[`kai/initiatives/pack-split/deliverables.md`](deliverables.md). It links the
partition and sequencing decisions, host evidence, and every promoted release
record through the final five-pack `1.0.4` publication.

## Open / deferred

No open item remains in the completed initiative scope. Deferred evidence and
unscheduled proposals remain explicitly parked in
[`kai/initiatives/pack-split/backlog.md`](backlog.md); they are not relabeled as
completed by this closure. The retained limits include broader fleet
certification beyond the bounded macOS/cloud arms, a stronger observable
dispatch probe, future per-pack semver decoupling, and the documented
direct-install override-key measurement gap. The final ship record also
preserves the evidence limit that raw host/session state was operator-provided
and not promoted.

## What needs the operator

none

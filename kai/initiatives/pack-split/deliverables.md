# pack-split — deliverables

Index of promoted, durable outputs for this initiative. Required to be non-empty
at closure, with every milestone's `required_items` satisfied. Promotion is
one-way and steward-approved:
`.kai/runs/ -> kai/initiatives/pack-split/artifacts/ -> kai/library/<type>/`.

| deliverable | milestone | source item | artifact path | promoted to library | status |
|-------------|-----------|-------------|---------------|---------------------|--------|
| Locked five-pack partition (authoritative docs) | partition-lock | pack-split-partition-lock | kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md | — | completed / accepted |
| Engineering delivery decomposition (14-item build & ship plan) | dependency-guarantees | pack-split-engineering-decomposition | kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md | — | completed / accepted |
| Release record — pack generator + multi-manifest gates (`0.58.0`) | dependency-guarantees | pack-split-generator-gates | kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md | **pending** → kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md | release-ready / **not shipped** |

The locked partition document is accepted and closes the `partition-lock`
milestone (its one required item, `pack-split-partition-lock`, reached
`completed` with the `independent-architecture` review ratified against
`change_ref fd44f4f…`). It stays an initiative artifact (not promoted to
`kai/library/`).

The engineering decomposition (accepted by the steward 2026-08-24) turns the
`dependency-guarantees`, `first-pack-extracted`, and `five-pack-split-shipped`
milestones into **14 sized/sequenced `proposed` work-item records** (12 required
IDs + 2 manager splits: `pack-split-generator-gates`, `pack-split-host-semantics-spike`).
It is a decision artifact (stays under `artifacts/decisions/`, not promoted to
library) — the durable *deliverables* it plans are produced as those items ship.

The **release record** for `pack-split-generator-gates` was written by
`workflow-ship` at the 2026-08-24-2252 DoD gate re-run (verdict RELEASE-READY, all
six dimensions Clear). It records what is queued to ship on `0.58.0`, the
six-dimension evidence, the rollback plan, the operator's merge steps, and the
production-verification checks. **It is not a record of a completed ship** — PR
#152 is open and unmerged, the item is `release-ready`, and the
`dependency-guarantees` milestone still requires this item at `shipped`. Its
canonical home is `kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md`;
promotion is deliberately pending until CONFIRM-COMPLETE, when merge and
post-merge verification evidence can travel with the final record.

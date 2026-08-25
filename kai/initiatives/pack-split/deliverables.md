# pack-split — deliverables

Index of promoted, durable outputs for this initiative. Required to be non-empty
at closure, with every milestone's `required_items` satisfied. Promotion is
one-way and steward-approved:
`.kai/runs/ -> kai/initiatives/pack-split/artifacts/ -> kai/library/<type>/`.

| deliverable | milestone | source item | artifact path | promoted to library | status |
|-------------|-----------|-------------|---------------|---------------------|--------|
| Locked five-pack partition (authoritative docs) | partition-lock | pack-split-partition-lock | kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md | — | completed / accepted |
| Engineering delivery decomposition (14-item build & ship plan) | dependency-guarantees | pack-split-engineering-decomposition | kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md | — | completed / accepted |
| Release record — pack generator + multi-manifest gates (`0.58.0`) | dependency-guarantees | pack-split-generator-gates | kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md | **promoted 2026-08-25** → kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md | **SHIPPED 2026-08-25** (`v0.58.0`, merge `47aa0549…`) |

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
six dimensions Clear) and **closed at the 2026-08-25-1125 CONFIRM-COMPLETE run
(verdict SHIPPED)**. It now records a completed ship: the six-dimension evidence,
the rollout and rollback plans (rollback was never invoked), the deployment
evidence — PR #152 merged 2026-08-25T18:20:55Z into `47aa0549f89b1733483dd6b662a4787d621c9430`,
released as `v0.58.0` — and the executed production verification (version coherence
across all six locations, exactly one `kai` marketplace entry at `source: "."`, and
**no `packs/` tree on `main`**, all re-derived read-only; `main` CI conclusion and the
annotated-tag peels are recorded as operator-attested because this environment has no
shell and `api.github.com` returned 403).

**Promotion is complete (reconciled 2026-08-25-1136).** The record now lives at its
canonical home, `kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md`.
The operator executed the outstanding `git mv` from the pre-promotion path
`kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md`,
which no longer exists. The earlier gap was recorded rather than faked — `workflow-ship`
could not create directories in that environment — and it was a filing-location gap in a
durable record, never a production gap. The move changed no implementation, release
metadata, or verification fact, and `kai/` is not a `BEHAVIOR_PREFIX`, so no second version
bump was required.

`dependency-guarantees` remains **open** with **1 of 5** required items at `shipped`.

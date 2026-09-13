# Drop record: `workflow-ship`

The `workflow-ship` agent body opened with an eager contract-loading preamble: a
nine-skill inheritance line, a block quote ordering the agent to load every one
before acting, and the injected core dependency-guard block. Task 9c replaced
that preamble with inline, on-demand routes plus a role-voice degraded-mode
refusal. The body shrank from **17,032** to **15,334** characters — the
second-largest and most process-dense of the wave. It owns the release gate, so
every route was placed at the exact gate step that already carried its
obligation, and no gate detail was compressed until it stopped binding.

Routes live beside their trigger, never collected into a list.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager nine-skill contract line | deleted; each skill reached by an inline route (table below) |
| The "load and apply every skill above" block quote | replaced by the inline first-person degraded-mode refusal plus the `kai-core-contract-v1` route at the top |
| The injected core dependency-guard block | deleted; `kai-core-contract-v1` carries the preflight, routed once before the first other core skill |
| The `## Contracts you inherit` heading and its skill bullets | deleted; its skills became inline routes |
| The `You inherit …` core-stance sentence naming a now-deleted contract | rewritten to route `kai-core-operating-rules` at the acting-loop/completion-ladder statement |
| Two `(see workspace-conventions)` bare mentions in Output location / Draft-publication / initiative-gating | rewritten to route `kai-core-workspace-paths` at those points |

## The nine eager skills, each now routed (plus one added by judgment)

| Old eager skill | Route home |
| --- | --- |
| team-operating-rules (deleted; superseded) | `kai-core-operating-rules`, routed at the core-stance acting-loop/completion-ladder statement |
| asset-lifecycle (deleted; superseded) | split to `kai-core-asset-producing` (routed at PREPARE, publishing the ship record) and `kai-core-asset-closing` (added — see ruling) |
| workspace-conventions (deleted; superseded) | `kai-core-workspace-paths`, routed at Output-location resolution, Draft/publication, and initiative gating |
| work-coordination (deleted; superseded) | split to `kai-core-work-item` (routed at step 1, locating the item it claims/moves/closes) and `kai-core-work-acting` (routed at the draft write) |
| `kai-core-work-activity` | routed at step 6 PREPARE, recording the run and deploy handoff |
| `kai-core-scope-discipline` | routed where a scope-expanding change riding along is refused as a proposal |
| `kai-core-peer-communication` | routed at "when you hand off", routing each handoff to its owner |
| `kai-core-definition-of-done` | routed at hard rule 1, running the whole six-dimension gate |
| `review-rollout-operability` | routed at step 3, gathering dim-4 rollout/operability evidence |

`kai-core-contract-v1` is added at the top, before the first other core route.

## Ruling: `kai-core-asset-closing` — ADDED, and its division of labour

`workflow-ship` owns the release gate and is the strongest asset-closing
candidate in the repo. The gate has two distinct halves and they route to two
distinct skills:

- **`kai-core-definition-of-done` carries the readiness verdict.** It is the
  six-dimension test that *decides whether* an item may move — scope-true,
  verified, reviewed, shippable-safely, documented, coordination-closed. Routed
  at hard rule 1, it produces Clear / Gap / Waived per dimension and the
  BOUNCE-vs-RELEASE-READY decision. It does not move state.
- **`kai-core-asset-closing` carries the closure mechanics.** Once production
  verification passes, the item is *closed*: moved to `shipped`, the initiative
  `log.md` stamped, satisfied dependencies cleared, the ship record finalized as
  a closed asset. Routed at step 9 VERIFY PRODUCTION, it is the promotion/closure
  action, not the readiness test.

The gate (DoD) and the close (asset-closing) are different obligations at
different steps; each has its own route. Producing the ship record while it is
still a draft is `kai-core-asset-producing` at PREPARE — a third, distinct home.

## The degraded-mode refusal

> If `kai-core` is unavailable, I give one read on release readiness from the
> item and evidence in front of me — an informal gap check, never a gate verdict
> or a state change — and I move nothing toward `release-ready` or `shipped`; I
> write no `.kai` state, take no `product-change` item, and record no Kai
> activity; and I tell the operator to install or update `kai-core` before I can
> run the release gate.

- **Fact 1** — direct single-shot work only: *"one read on release readiness …
  an informal gap check, never a gate verdict or a state change."*
- **Fact 2** — no state, no claimed item, no reported activity: *"I move nothing
  toward `release-ready` or `shipped`; I write no `.kai` state, take no
  `product-change` item, and record no Kai activity."*
- **Fact 3** — operator installs/updates core: *"I tell the operator to install
  or update `kai-core`."*

The refusal derives from ship's degraded product: it can offer an *informal gap
check* but explicitly issues no gate verdict and makes no state transition,
because gating and moving items toward `shipped` are the coordinated behaviour
that is unavailable. Distinct from the manager (which mints no items) and the
commander (which announces command is unavailable): ship's specific loss is the
authority to *move state toward release*.

## Notes

- Validation is red by design; see the task-9c report for reconciled counts.

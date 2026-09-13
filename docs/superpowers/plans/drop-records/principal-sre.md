# Drop record: `principal-sre`

The `principal-sre` agent body opened with an eager contract-loading preamble: an
eight-skill inheritance line, a block quote ordering the agent to load every one
before acting, and the injected core dependency-guard block. Task 9c replaced
that preamble with inline, on-demand routes plus a role-voice degraded-mode
refusal. The body shrank from **11,812** to **10,010** characters. No obligation
was removed.

Routes live beside their trigger, never collected into a list.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager eight-skill contract line | deleted; each skill reached by an inline route (table below) |
| The "load and apply every skill above" block quote | replaced by the inline first-person degraded-mode refusal plus the `kai-core-contract-v1` route at the top |
| The injected core dependency-guard block | deleted; `kai-core-contract-v1` carries the preflight, routed once before the first other core skill |
| The `## Contracts you inherit` heading and its skill bullets | deleted; its skills became inline routes |

## The eight eager skills, each now routed

| Old eager skill | Route home |
| --- | --- |
| team-operating-rules (deleted; superseded) | `kai-core-operating-rules`, routed where the agent keeps each concern in its lane |
| asset-lifecycle (deleted; superseded) | `kai-core-asset-producing`, routed at the durable reliability-review write. No closing half: this role produces a review verdict, it never closes another role's completed work |
| workspace-conventions (deleted; superseded) | `kai-core-workspace-paths`, routed before resolving the workspace root |
| work-coordination (deleted; superseded) | split to `kai-core-work-acting` (routed before writing detailed local state) and `kai-core-work-item` (routed when claiming the `knowledge` review item) |
| `kai-core-work-activity` | routed where the agent records the run after a waiver decision |
| `kai-core-scope-discipline` | routed where a reliability requirement is tested against real scope |
| `kai-core-peer-communication` | routed where the agent asks architecture/infra/product for input |
| `review-rollout-operability` | routed as the document/change review the SRE runs for rollout/operability |

`kai-core-contract-v1` is added at the top, before the first other core route.

## The degraded-mode refusal

> If `kai-core` is unavailable, I offer one reliability read on the telemetry or
> design in front of me — an SLI/SLO observation or a failure-mode note, nothing
> that moves a release or touches production — and then stop; I create no `.kai`
> state, hold no review item, and report no Kai activity; and I tell the operator
> to install or update `kai-core` before I resume coordinated reliability review.

- **Fact 1** — direct single-shot work only: *"one reliability read … an
  SLI/SLO observation or a failure-mode note, nothing that moves a release or
  touches production."*
- **Fact 2** — no state, no held item, no reported activity: *"I create no
  `.kai` state, hold no review item, and report no Kai activity."*
- **Fact 3** — operator installs/updates core: *"I tell the operator to install
  or update `kai-core`."*

The refusal derives from the SRE's degraded product: a reliability observation
that explicitly moves no release and touches no production, because gating and
production access are the coordinated behaviour that is unavailable.

## Notes

- `kai-core-asset-closing` was **not** added. The SRE produces reviews; it never
  closes another role's completed work.
- Validation is red by design; see the task-9c report for reconciled counts.

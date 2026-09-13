# Drop record: `principal-swe-manager`

The `principal-swe-manager` agent body opened with an eager contract-loading
preamble: a seven-skill inheritance line, a block quote ordering the agent to
load every one before acting, and the injected core dependency-guard block. Task
9c replaced that preamble with inline, on-demand routes plus a role-voice
degraded-mode refusal. The body shrank from **19,905** to **18,276** characters
— the largest and most process-dense of the wave, so each route was placed at
the exact step that already carried the obligation, and no process detail was
compressed until it stopped binding.

Routes live beside their trigger, never collected into a list.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager seven-skill contract line | deleted; each skill reached by an inline route (table below) |
| The "load and apply every skill above" block quote | replaced by the inline first-person degraded-mode refusal plus the `kai-core-contract-v1` route at the top |
| The injected core dependency-guard block | deleted; `kai-core-contract-v1` carries the preflight, routed once before the first other core skill |
| The `## Contracts you inherit` heading and its skill bullets | deleted; its skills became inline routes |

## The seven eager skills, each now routed

| Old eager skill | Route home |
| --- | --- |
| team-operating-rules (deleted; superseded) | `kai-core-operating-rules`, routed where the agent keeps each of its outputs in the lane that owns it |
| asset-lifecycle (deleted; superseded) | `kai-core-asset-producing`, routed at the durable build-plan write. No closing half — see the ruling below |
| workspace-conventions (deleted; superseded) | `kai-core-workspace-paths`, routed before resolving `<workspace-root>` and the working root |
| work-coordination (deleted; superseded) | split to `kai-core-work-acting` (routed before writing the durable plan) and `kai-core-work-item` (routed where the agent mints proposed items). Work-granting was **not** added — see the ruling below |
| `kai-core-work-activity` | routed where the agent records the run and hands off |
| `kai-core-scope-discipline` | routed at step 3, defending scope outward and inward |
| `kai-core-peer-communication` | routed where the agent surfaces every Pushback and Slice to the roles that own them |

`kai-core-contract-v1` is added at the top, before the first other core route.

## Ruling: `kai-core-asset-closing` — NOT added

The manager produces a build-feasibility plan and *proposes* work items; it does
not accept, verify, or close another role's completed work. Closing (moving an
item to `completed`/accepted, finalizing a closed asset) is the steward's and
the release/ship roles' behaviour. Adding asset-closing here would imply the
manager can close slices it only proposed, which is exactly the authority it
lacks. Correctly absent.

## Ruling: `kai-core-work-granting` — NOT added

Work-granting belongs only to a role that grants a lease to another role —
normally only the director. The manager sequences engineering work by minting
items in the `proposed` state and handing them to the steward; the body was made
explicit that the director grants leases and dispatches only after promotion.
The manager never grants a lease itself, so work-granting would misstate its
authority. The seniority of the role is not the test — the lease action is, and
the manager does not perform it. Correctly absent.

## The degraded-mode refusal

> If `kai-core` is unavailable, I answer one scoping question from the codebase
> and intent in front of me — a rough decomposition or a sizing read, not an
> owned plan — and stop; I write no `.kai` state, mint no `proposed` items, and
> report no Kai activity; and I tell the operator to install or update
> `kai-core` before I can sequence coordinated delivery again.

- **Fact 1** — direct single-shot work only: *"one scoping question … a rough
  decomposition or a sizing read, not an owned plan."*
- **Fact 2** — no state, no minted items, no reported activity: *"I write no
  `.kai` state, mint no `proposed` items, and report no Kai activity."*
- **Fact 3** — operator installs/updates core: *"I tell the operator to install
  or update `kai-core`."*

The refusal derives from the manager's degraded product: a rough decomposition
or sizing read that is explicitly *not an owned plan* and mints no items,
because sequencing coordinated delivery is the behaviour that is unavailable.

## Notes

- Validation is red by design; see the task-9c report for reconciled counts.

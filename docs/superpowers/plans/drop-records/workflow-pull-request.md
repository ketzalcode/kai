# Drop record: `workflow-pull-request`

The `workflow-pull-request` agent body opened with an eager contract-loading
preamble: an eight-skill inheritance line, a block quote ordering the agent to
load every one before acting, and the injected core dependency-guard block. Task
9c replaced that preamble with inline, on-demand routes plus a role-voice
degraded-mode refusal. The body shrank from **10,798** to **9,060** characters.
No obligation was removed.

Routes live beside their trigger, never collected into a list.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager eight-skill contract line | deleted; each skill reached by an inline route (table below) |
| The "load and apply every skill above" block quote | replaced by the inline first-person degraded-mode refusal plus the `kai-core-contract-v1` route at the top |
| The injected core dependency-guard block | deleted; `kai-core-contract-v1` carries the preflight, routed once before the first other core skill |
| The `## Contracts you inherit` heading and its skill bullets | deleted; its skills became inline routes |

## The eight eager skills, each now routed

The old contract line did **not** name work-coordination; it named `pr-delivery`
and `build-diagrams` in its place.

| Old eager skill | Route home |
| --- | --- |
| team-operating-rules (deleted; superseded) | `kai-core-operating-rules`, routed at step 9 "stay in your lane" |
| asset-lifecycle (deleted; superseded) | `kai-core-asset-producing`, routed when the agent publishes the PR narrative as a durable artifact. No closing half: this workflow opens a PR, it never closes another role's completed work |
| workspace-conventions (deleted; superseded) | `kai-core-workspace-paths`, routed before resolving the durable workspace root |
| `kai-core-work-activity` | routed where the agent records the run |
| `kai-core-pr-delivery` | routed where the agent applies the delivery body shape (the anchor ladder, branch, checks) |
| `kai-core-scope-discipline` | routed at step 9, keeping the agent in its lane |
| `kai-core-peer-communication` | routed where the agent escalates a structural block to `@operator` |
| `build-diagrams` | routed where the change alters a structure or flow and a diagram must be included |

`kai-core-contract-v1` is added at the top, before the first other core route.
The single non-eager addition is `kai-core-work-acting`, routed before the agent
writes its readiness record as durable state — an obligation that existed in the
body and now has an explicit route.

## Ruling: `kai-core-work-item` — NOT added

The matrix row for this agent excludes `kai-core-work-item`, and the body bears
that out. This workflow consumes a coordination item only as an *anchor
reference* for the branch name and PR narrative; it never claims, leases, or
transitions that item. Claiming/transitioning is the acting role's behaviour and
happens upstream. Adding work-item would imply this workflow owns the item's
lifecycle, which it does not. Correctly absent — verified: `routedSkills` does
not list `kai-core-work-item`.

## The degraded-mode refusal

> If `kai-core` is unavailable, I inspect one change and describe what a PR for
> it would need — branch, narrative, version read — from the repository in front
> of me, but I open nothing and drive nothing; I write no `.kai` state, claim no
> delivery item, and report no Kai activity; and I tell the operator to install
> or update `kai-core` before I take a change through to a mergeable PR.

- **Fact 1** — direct single-shot work only: *"I inspect one change and describe
  what a PR for it would need … but I open nothing and drive nothing."*
- **Fact 2** — no state, no claimed item, no reported activity: *"I write no
  `.kai` state, claim no delivery item, and report no Kai activity."*
- **Fact 3** — operator installs/updates core: *"I tell the operator to install
  or update `kai-core`."*

The refusal derives from this workflow's degraded product: it can *describe* the
PR a change would need but explicitly opens and drives nothing, because opening
and driving the PR is the coordinated behaviour that is unavailable.

## Notes

- Validation is red by design; see the task-9c report for reconciled counts.

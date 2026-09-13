# Drop record: `principal-swe-architect`

The `principal-swe-architect` agent body opened with an eager contract-loading
preamble followed by a managed dependency-guard block. Task 9a replaced both
with inline, on-demand routes — one route sentence placed at the exact
instruction that needs each contract — plus a `**Primary profile:** judgment`
line and an inline degraded-mode refusal in the architect's own voice. The body
shrank from **17,046** to **15,371** characters. No obligation was removed;
every dropped construct is accounted for below.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager eight-skill contract line (old line 7) | deleted; each contract is now reached by an inline route (see the routing table) |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal, plus the `kai-core-contract-v1` route at the top of the body |
| The `## Core preflight` guard block | its one action became the `kai-core-contract-v1` route at the top of the body |
| The `## Degraded mode` guard block | replaced by the one-paragraph first-person refusal; it restates no rule, so nothing was lost |

## The eager skills, each now routed

| Skill | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | `kai-core-operating-rules`, routed at `## When you hand off`, before routing anything outside the seam |
| asset-lifecycle (deleted id; superseded) | `kai-core-asset-producing`, routed in **Draft and publication**, before publishing the accepted decision record |
| workspace-conventions (deleted id; superseded) | `kai-core-workspace-paths`, routed at the roots-resolution bullet under the decision-record path |
| work-coordination (deleted id; superseded) | split into `kai-core-work-acting` (routed in **Draft and publication**, before writing the working draft) and `kai-core-work-item` (routed at step 5, when opening the child slice for each domain engineer) |
| `kai-core-work-activity` | routed at step 6 (**Record or answer**), as the decision run is logged |
| `kai-core-scope-discipline` | routed where the architect settles a disposition (the classify-gate paragraph) |
| `kai-core-peer-communication` | routed at step 5, on the escalate-value/cost-to-product clause |
| `build-diagrams` | routed where the architect draws the structure the call turns on |

`kai-core-contract-v1` was added at the top of the body.

### Anchor rationale

- **`kai-core-work-acting`** anchors in **Draft and publication** at the
  working-draft write, because that is the architect's durable-state write;
  work-acting governs verify-before-write on a held item.
- **`kai-core-work-item`** anchors at **step 5 (Hand off the domain work)**,
  because that is where the architect opens a child slice for each domain
  engineer — the point an item record is created, not consumed.
- **`build-diagrams`** anchors at the **diagram instruction**, because the
  `decision.md` must carry a component/boundary diagram of the seam being moved;
  the route sits exactly where the architect draws it, not at the top.

## The degraded-mode refusal

> If `kai-core` will not load I rule on at most one architecture question
> inline, from the code and constraints in front of me; I record no `.kai`
> decision state, hold no coordinated seam item, and emit no Kai activity signal;
> and I tell the operator to install or update `kai-core` before I can hand a
> decision into the team's flow.

- **Fact 1** — single-shot own-domain work: *"I rule on at most one architecture
  question inline, from the code and constraints in front of me."*
- **Fact 2** — no `.kai` state, no coordinated item, no activity: *"I record no
  `.kai` decision state, hold no coordinated seam item, and emit no Kai activity
  signal."*
- **Fact 3** — install/update remedy: *"I tell the operator to install or update
  `kai-core`."*

## Per-agent lifecycle calls

- **`kai-core-asset-closing`: not added.** The architect emits and publishes a
  decision record; it does not issue a freshness/close-out verdict over existing
  published assets, so the producing contract is the only lifecycle one its
  instructions need.
- **`kai-core-work-granting`: not added.** The architect frames the decision and
  hands off domain work; the dispatch/lease grant is owned by the director or
  eng-manager, so no instruction here needs the granting contract.

## Notes and borderline calls

- Several `(see …)` cross-references still name the pre-split
  workspace-conventions contract as bare mentions. They do not route and raise no
  new validator error; the later reference-fix task owns re-pointing them.
- Validation is red by design at this point in the refactor.

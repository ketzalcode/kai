# Drop record: `workflow-issue-analysis`

The `workflow-issue-analysis` agent body opened with the eager contract preamble
the five engineering assessors shared byte-for-byte: an inheritance line, a block
quote ordering the agent to load every skill before acting, and the injected
dependency-guard block. Task 9b replaced that preamble with inline, on-demand
routes — one route sentence placed at the exact instruction that needs each
contract — plus the split-skill re-pointing this wave carries. The body shrank
from **9,288** to **8,078** characters. No obligation was removed; every dropped
construct is accounted for below with its destination.

Routes live in the prose beside their trigger, never collected into a list (a
collected list is the eager pattern this refactor removes, and `AGENTS.md`
forbids it). The role-specific "never implement / never mutate / never assert /
never manufacture / never over-escalate" block quote was **kept** — it is a
stop-condition list in the agent's own voice, not the eager contract quote.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager contract line | deleted; each skill is now reached by an inline route (see the routing table) |
| The "load and apply every skill before acting" block quote | replaced by the degraded-mode refusal in the agent's own voice, plus the `kai-core-contract-v1` route at the top of the body |
| The injected `kai core dependency guard` block | deleted; its single obligation (probe core, then refuse in a bounded way) is now the top-of-body contract route plus the refusal |
| The old id `kai-core-team-operating-rules` | superseded by `kai-core-operating-rules`, routed at Workflow step 7 (route the decision to its owner) |
| The old id `kai-core-workspace-conventions` | superseded by `kai-core-workspace-paths`, routed at the temp-dir/workspace-root paragraph |
| The old id `kai-core-work-coordination` | superseded by `kai-core-work-acting` for durable analysis state (routed at the same paragraph); `kai-core-work-item` was judged **not** needed (see below) |
| The old id `kai-core-asset-lifecycle` | superseded by `kai-core-asset-producing`, routed at `## Handing off` |

## The routes, each at its trigger

| Skill | Route home |
| --- | --- |
| `kai-core-contract-v1` | top of body, before the first other core skill |
| `kai-core-no-self-remediation` | after the role-specific stop-condition block quote, before "You are" — the findings/recommendation step |
| `kai-core-issue-analysis` | the "it carries the full contract" paragraph, where the analysis method is loaded |
| `kai-core-scope-discipline` | `## Core stance`, to keep the run inside analysis and route scope changes to their owner |
| `build-diagrams` | Workflow step 5, to draw the ASCII diagram when the problem is structural |
| `kai-core-operating-rules` | Workflow step 7, to route each decision to the role that owns it |
| `kai-core-workspace-paths` | the temp-dir/workspace paragraph, to resolve the workspace root |
| `kai-core-work-acting` | the same paragraph, so durable work state lands in the resolved root and never in a temp directory |
| `kai-core-work-activity` | `## Terminal state`, when the terminal state is recorded as the run's outcome |
| `kai-core-peer-communication` | `## Handing off`, to ask the owning role or steward to record the analysis |
| `kai-core-asset-producing` | `## Handing off`, before the analysis is captured as a durable artifact |

## The degraded-mode refusal

> If `kai-core` will not load I read the one issue in front of me and hand back a
> single-shot analysis — problem, options, and a routed recommendation from what
> the issue and its live context carry; I open no `.kai` state, claim no
> coordinated item, and post no Kai activity; and I tell the operator to install
> or update `kai-core` before I can pick up coordinated analysis again.

- **Fact 1** — continue only with direct, single-shot own-domain work: *"I read
  the one issue in front of me and hand back a single-shot analysis — problem,
  options, and a routed recommendation from what the issue and its live context
  carry."*
- **Fact 2** — no `.kai` state, no coordinated-work claim, no Kai activity: *"I
  open no `.kai` state, claim no coordinated item, and post no Kai activity."*
- **Fact 3** — tell the operator to install or update core: *"I tell the operator
  to install or update `kai-core`."*

## Lifecycle calls

- **`kai-core-work-item` — not added.** This is the deliberate call the brief
  asked for. The agent holds **no `edit` and no `create`**, runs *before* a
  coordination item exists (on a raw issue), never opens or claims an item, and
  when dispatched onto an existing item explicitly *cannot take its lease* and
  says so, leaving the grantor to hold it. It defers all recording to the owning
  role via `kai-core-peer-communication`. Adding `kai-core-work-item` would
  contradict the body's own "you cannot take its lease" instruction. It gets
  `kai-core-work-acting` instead, because it does write durable analysis state
  that must land in the workspace root.
- **`kai-core-asset-closing` — not added.** The agent hands its analysis to the
  owning role to record via `kai-core-asset-producing`; it never disposes of a
  kai asset's lifecycle, and its terminal states (AWAITING SELECTION / FINDING /
  BLOCKED) route a decision rather than close an asset.
- **`kai-core-work-granting` — not added.** The agent grants no lease; it cannot
  even hold one.

## Notes and borderline calls

- The body twice names `research-before-coding` and once notes the four
  code-writing agents receive it. Those are live-skill/agent references, not
  routes (no route verb adjacent), and were left verbatim.
- The role-specific block quote and the three-state terminal contract already
  bind the "analysis ends in a decision request, it does not slide into
  implementation" rule structurally (the missing `edit`/`create` is the
  enforcement); the routes did not have to re-state it.
- The refusal is written in-voice and does not match the frozen validator regex
  that still pins the old block-quote wording. Red is expected here; Task 10
  rewrites that check to a three-fact test.

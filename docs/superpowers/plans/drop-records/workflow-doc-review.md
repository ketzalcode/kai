# Drop record: `workflow-doc-review`

The `workflow-doc-review` agent body opened with the eager contract preamble the
five engineering assessors shared byte-for-byte: an inheritance line, a block
quote ordering the agent to load every skill before acting, and the injected
dependency-guard block. Task 9b replaced that preamble with inline, on-demand
routes — one route sentence placed at the exact instruction that needs each
contract — plus the split-skill re-pointing this wave carries. The body shrank
from **13,252** to **11,747** characters. No obligation was removed; every
dropped construct is accounted for below with its destination.

Routes live in the prose beside their trigger, never collected into a list (a
collected list is the eager pattern this refactor removes, and `AGENTS.md`
forbids it).

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager contract line | deleted; each skill is now reached by an inline route (see the routing table) |
| The "load and apply every skill before acting" block quote | replaced by the degraded-mode refusal in the agent's own voice, plus the `kai-core-contract-v1` route at the top of the body |
| The injected `kai core dependency guard` block | deleted; its single obligation (probe core, then refuse in a bounded way) is now the top-of-body contract route plus the refusal |
| The old id `kai-core-team-operating-rules` | superseded by `kai-core-operating-rules`, routed at `## When you hand off` |
| The old id `kai-core-workspace-conventions` | split into `kai-core-workspace-paths` (path/run-grammar, routed at `## Output location and shape`) and a bare `kai-core-workspace-initiative` cross-reference at the initiative-gating paragraph |
| The old id `kai-core-work-coordination` | split into `kai-core-work-item` (coordinated claim/verdict record) and `kai-core-work-acting` (writing the working draft), both routed in the "Zone & promotion" paragraph |
| The old id `kai-core-asset-lifecycle` | superseded by `kai-core-asset-producing`, routed at the publish step in "Zone & promotion" |

## The routes, each at its trigger

| Skill | Route home |
| --- | --- |
| `kai-core-contract-v1` | top of body, before the first other core skill |
| `doc-review-rigor` | Hard rule 3, as the shared method every lens clears |
| `review-rationale` | `## Which dimensions fire`, applied on almost every doc |
| `review-alternatives` | `## Which dimensions fire`, applied on almost every doc |
| `review-risks-scope` | `## Which dimensions fire`, applied on almost every doc |
| `review-ux-accessibility` | `## Which dimensions fire`, applied when the doc touches a user-facing surface |
| `kai-core-workspace-paths` | `## Output location and shape`, to resolve `<workspace-root>`/`<working-root>` |
| `kai-core-work-item` | "Zone & promotion", to claim the item and record the verdict when the review is coordinated work |
| `kai-core-work-acting` | "Zone & promotion", before writing the working draft |
| `kai-core-asset-producing` | "Zone & promotion", before publishing the accepted review as a durable asset |
| `kai-core-no-self-remediation` | Workflow step 6, before the one consolidated review is written |
| `kai-core-work-activity` | Workflow step 7, when the review run is recorded and handed back |
| `kai-core-operating-rules` | `## When you hand off`, to keep out-of-lane work routed to its owner |

The remaining situational lenses (`review-success-metrics`,
`review-security-privacy`, `review-performance-scale`, `review-dependencies`,
`review-rollout-operability`) are named in the doc-type matrix and the dimension
list as **dispatched references**, not routes — they fire only when the matrix
selects them, so they carry no `Apply`/`Load` route verb. That matches the
matrix, which requires only the four always-on lenses to be routed.

## The degraded-mode refusal

> If `kai-core` will not load I read the one document in front of me and give a
> single-pass substance review from what it and its cited sources carry; I open
> no `.kai` review state, claim no coordinated review item, and post no Kai
> activity or verdict; and I tell the operator to install or update `kai-core`
> before I can run a routed, coordinated review again.

- **Fact 1** — continue only with direct, single-shot own-domain work: *"I read
  the one document in front of me and give a single-pass substance review from
  what it and its cited sources carry."*
- **Fact 2** — no `.kai` state, no coordinated-work claim, no Kai activity: *"I
  open no `.kai` review state, claim no coordinated review item, and post no Kai
  activity or verdict."*
- **Fact 3** — tell the operator to install or update core: *"I tell the operator
  to install or update `kai-core`."*

The single-pass fallback is a real degradation of this role: its whole value is
*routed multi-lens coverage with aggregation*, which a lone pass cannot deliver.
The refusal is honest about that rather than pretending the role still functions.

## Lifecycle calls

- **`kai-core-asset-closing` — not added.** The agent publishes the accepted
  review via `kai-core-asset-producing` and hands the operator the path; the
  operator decides what — if anything — gets shared. The review is a verdict on
  *another* document's argument, never a lifecycle disposition of a kai asset the
  agent owns. Its Hard rule 7 ("never auto-post") already forbids the agent from
  driving the reviewed artifact's fate.
- **`kai-core-work-granting` — not added.** The agent claims an item
  (`kai-core-work-item`) when the review is coordinated but grants no lease; it
  dispatches lenses, not roles that hold leases.

## Notes and borderline calls

- The initiative-gating paragraph keeps a bare `(see `kai-core-workspace-initiative`)`
  cross-reference — a mention, not a route — because gating against
  `.kai/state/ACTIVE.md` reads initiative state but the matrix does not list
  `kai-core-workspace-initiative` as a required route for this agent. Left as a
  mention deliberately.
- Hard rules 1–7 (state the goal first, only fire applicable lenses, enforce the
  rigor bar, aggregate not concatenate, run the value filters, let phrasing
  slide, never auto-post) already bind the orchestration behaviour; the routes
  did not have to re-state them.
- The refusal is written in-voice and does not match the frozen validator regex
  that still pins the old block-quote wording. Red is expected here; Task 10
  rewrites that check to a three-fact test.

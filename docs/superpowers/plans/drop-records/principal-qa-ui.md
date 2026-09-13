# Drop record: `principal-qa-ui`

The `principal-qa-ui` agent body opened with the eager contract preamble the
five engineering assessors shared byte-for-byte: an inheritance line, a block
quote ordering the agent to load every skill before acting, and the injected
dependency-guard block. Task 9b replaced that preamble with inline, on-demand
routes — one route sentence placed at the exact instruction that needs each
contract — plus the split-skill re-pointing this wave carries. The body shrank
from **10,874** to **9,810** characters. No obligation was removed; every
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
| The old id `kai-core-team-operating-rules` | superseded by `kai-core-operating-rules`, routed at `## When you defer` |
| The old id `kai-core-workspace-conventions` | superseded by `kai-core-workspace-paths`, routed at `### 2. Set up the run`; the run-grammar cross-reference at the folder-creation bullet was re-pointed to `kai-core-workspace-paths` too (bare mention, not a route) |
| The old id `kai-core-work-coordination` | split into `kai-core-work-item` (coordinated claim/lease) and `kai-core-work-acting` (writing run state), routed at `### 1` and `### 2` |
| The old id `kai-core-asset-lifecycle` | superseded by `kai-core-asset-producing`, routed at `### 7. Close out` |

## The routes, each at its trigger

| Skill | Route home |
| --- | --- |
| `kai-core-contract-v1` | top of body, before the first other core skill |
| `kai-core-web-evaluation` | the run-plumbing paragraph near the top (folder layout, screenshots, login pause, report scaffold) |
| `kai-core-scope-discipline` | after the "you are the assessor, not the scope-keeper" paragraph, so a defect whose fix expands scope still ships as an honest finding |
| `kai-core-peer-communication` | the incident-response paragraph, before evidence is handed to another owner |
| `kai-core-work-item` | `### 1. Confirm scope`, when the pass is dispatched as coordinated work |
| `kai-core-workspace-paths` | `### 2. Set up the run`, to resolve `<workspace-root>`/`<working-root>` before creating the run folder |
| `kai-core-work-acting` | `### 2. Set up the run`, before stubbing `report.md` and writing run state |
| `kai-core-no-self-remediation` | `### 4. File findings as you go`, before findings are filed |
| `kai-core-asset-producing` | `### 7. Close out`, when `report.md` is finalized as the run's durable output |
| `kai-core-work-activity` | `### 7. Close out`, when the run is posted back to the user |
| `kai-core-operating-rules` | `## When you defer`, to keep out-of-lane work routed to its owner |

## The degraded-mode refusal

> If `kai-core` will not load I run one manual QA pass at a time — walking the
> surface I was pointed at and reporting the defects I can see, and nothing more;
> I create no `.kai` run or report state, claim no coordinated QA item, and post
> no Kai activity; and I tell the operator to install or update `kai-core` before
> I can rejoin coordinated testing.

- **Fact 1** — continue only with direct, single-shot own-domain work: *"I run one
  manual QA pass at a time — walking the surface I was pointed at and reporting
  the defects I can see, and nothing more."*
- **Fact 2** — no `.kai` state, no coordinated-work claim, no Kai activity: *"I
  create no `.kai` run or report state, claim no coordinated QA item, and post no
  Kai activity."*
- **Fact 3** — tell the operator to install or update core: *"I tell the operator
  to install or update `kai-core`."*

## Lifecycle calls

- **`kai-core-asset-closing` — not added.** The agent finalizes `report.md` via
  `kai-core-asset-producing` and hands it back; the operator and
  `principal-product-manager` own what happens to the defects at triage. The run
  produces an asset; it never closes an asset's lifecycle.
- **`kai-core-work-granting` — not added.** The agent claims an item
  (`kai-core-work-item`) when dispatched as coordinated work but grants no lease.

## Notes and borderline calls

- `routedSkills` also returns `persona-ux-first-time-user`. That id is an agent
  named in the frontmatter `description` ("Not fresh-eyes UX
  (`persona-ux-first-time-user`)") and in the `## When you defer` recommendation.
  It is an agent-dispatch reference, not a contract route, and predates this
  task; the same pattern is accepted in the reference bodies (e.g. the director's
  `invoke`-form agent dispatches). It is not one of the eleven required matrix
  routes, all of which are present.
- The honest-signal obligation (surface every defect, never suppress a finding to
  stay "in scope"), the always-flag patterns, and the priority ladder already
  bind the assessor's behaviour; the routes did not have to re-state them.
- The refusal is written in-voice and does not match the frozen validator regex
  that still pins the old block-quote wording. Red is expected here; Task 10
  rewrites that check to a three-fact test.

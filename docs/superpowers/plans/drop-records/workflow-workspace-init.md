# Drop record: `workflow-workspace-init`

The `workflow-workspace-init` body opened with an eager contract-loading
preamble: a six-skill loading line and a block quote ordering the agent to load
every contract before acting. Task 8 replaced it with inline, on-demand routes
plus a degraded-mode refusal in the procedure's own voice. The body moved from
**6,078** to **6,082** characters (routes and the refusal roughly balance the
removed preamble). No obligation was removed.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager six-skill loading line | deleted; each contract is now an inline route |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal plus the `kai-core-contract-v1` route at the top |
| The `Execute` `kai-core-workspace-onboarding` sentence (non-routing verb) | changed to `Invoke` so the onboarding contract actually routes |

## The removed contracts, each now routed

| Old contract | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | `kai-core-operating-rules`, routed in `## Workflow` step 3, before touching any user file |
| asset-lifecycle (deleted id; superseded) | `kai-core-asset-producing`, routed in `## Workflow` step 4, before creating the publication root |
| workspace-conventions (deleted id; superseded) | split into `kai-core-workspace-paths` (routed in `## Workflow` step 1, before resolving the project root) and `kai-core-workspace-initiative` (routed in `## Workflow` step 5, before moving initiative work) |
| work-coordination (deleted id; superseded) | split into `kai-core-work-item` (routed in `## Workflow` step 5, before moving coordination state) and `kai-core-work-acting` (routed in `## Workflow` step 4, before writing durable state) |
| `kai-core-work-activity` | `## Workflow` step 7, before reporting |
| `kai-core-workspace-onboarding` | the intro sentence, at the `Invoke` that executes onboarding's contract |

`kai-core-contract-v1` was added at the top, before the first other core route.

### asset-closing and work-granting: not added

- **`kai-core-asset-closing` — not added.** Workspace-init creates and validates
  workspace state and, at step 6, *checks* that "no unaccepted asset was
  published." That is a validation guard, not an asset-completion decision; it
  never marks an asset complete, fresh, promotable, or closeable.
- **`kai-core-work-granting` — not added.** It grants no lease and dispatches no
  role; it scaffolds and repairs one workspace.

## The degraded-mode refusal

> Invoke `kai-core-contract-v1` before the first other core skill. Without
> `kai-core` I can answer a direct question about workspace layout, but I
> scaffold no `.kai` state, run no onboarding, claim no coordinated setup, report
> no Kai activity, and tell the operator to install or update `kai-core` before a
> workspace can be created or repaired.

- **Fact 1** — single-shot work in its own domain: *"answer a direct question
  about workspace layout."*
- **Fact 2** — no `.kai` state, no claimed coordinated work, no reported
  activity: *"scaffold no `.kai` state, run no onboarding, claim no coordinated
  setup, report no Kai activity."*
- **Fact 3** — install or update core: *"tell the operator to install or update
  `kai-core`."*

Distinct in domain wording from the other five agents and the director.

## Notes

- The generated validator/self-test counts are red by design; see
  `task-8-report.md` for the exact lines.

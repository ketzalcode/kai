# Drop record: `workflow-initiative-init`

The `workflow-initiative-init` body opened with an eager contract-loading
preamble: a five-skill loading line and a block quote ordering the agent to load
every contract before acting. Task 8 replaced it with inline, on-demand routes
placed at the instruction that needs each contract, plus a degraded-mode refusal
in the procedure's own voice. The body moved from **11,261** to **11,272**
characters (routes and the refusal roughly balance the removed preamble). No
obligation was removed.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager five-skill loading line | deleted; each contract is now an inline route (see the route map) |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal plus the `kai-core-contract-v1` route at the top |
| The dead `kai-core-workspace-conventions` reference in `## Inputs` | re-pointed to a `kai-core-workspace-paths` route at the same workspace-resolution instruction |

## The removed contracts, each now routed

The old loading line named five contracts (four of them since split/renamed).

| Old contract | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | `kai-core-operating-rules`, routed in `## Workflow` step 7, before handing work to the steward |
| asset-lifecycle (deleted id; superseded) | `kai-core-asset-producing`, routed at the top of `## Output`, before creating any initiative artifact |
| workspace-conventions (deleted id; superseded) | split into `kai-core-workspace-paths` (routed in `## Inputs`, before resolving the workspace) and `kai-core-workspace-initiative` (routed in `## Workflow` step 1, before inspecting the initiative index) |
| work-coordination (deleted id; superseded) | split into `kai-core-work-item` (routed in `## Workflow` step 5, before seeding item records) and `kai-core-work-acting` (routed in `## Workflow` step 4, before writing durable state) |
| `kai-core-work-activity` | `## Workflow` step 8, before the handoff to the Chief of Staff |

`kai-core-contract-v1` was added at the top, before the first other core route.

### asset-closing and work-granting: not added

- **`kai-core-asset-closing` — not added.** This intake creates initiative
  files, seeds `proposed` planning items, and hands closure to the steward. It
  never decides an asset is complete, fresh, promotable, or closeable — Hard
  rule 3 states it "cannot approve its own scope." So it produces, never closes.
- **`kai-core-work-granting` — not added.** It seeds `proposed` items with no
  lease and grants nothing; lease granting is the Chief of Staff's authority.

## The degraded-mode refusal

> Invoke `kai-core-contract-v1` before the first other core skill. Without
> `kai-core` this intake stays a single-shot conversation about mission and
> scope in the open: it writes no initiative files or other `.kai` state, claims
> no coordinated work, reports no Kai activity, and asks the operator to install
> or update `kai-core` before an initiative can be stood up.

- **Fact 1** — single-shot work in its own domain: *"a single-shot conversation
  about mission and scope in the open."*
- **Fact 2** — no `.kai` state, no claimed coordinated work, no reported
  activity: *"writes no initiative files or other `.kai` state, claims no
  coordinated work, reports no Kai activity."*
- **Fact 3** — install or update core: *"asks the operator to install or update
  `kai-core`."*

Distinct in domain wording from the other five agents and the director.

## Notes

- `workflow-workspace-init` still appears in the route list because the body
  invokes it with `invoke`-form dispatch; that is an agent dispatch, not a
  contract route, and was left unchanged.
- The generated validator/self-test counts are red by design; see
  `task-8-report.md` for the exact lines.

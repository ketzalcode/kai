# Drop record: `workflow-weekly-pulse`

The `workflow-weekly-pulse` body opened with an eager contract-loading preamble:
a seven-skill loading line and a block quote ordering the agent to load every
contract before acting. Task 8 replaced it with inline, on-demand routes plus a
degraded-mode refusal in the pulse's own voice, and added a top-level
`# Workflow — Weekly Pulse` heading with a `**Primary profile:**` line to match
the Task 7 reference shape. The body moved from **13,494** to **13,676**
characters (the added heading, profile, refusal, and routes slightly exceed the
removed preamble). No obligation was removed.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager seven-skill loading line | deleted; each contract is now an inline route |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal plus the `kai-core-contract-v1` route at the top |

The `## Where you sit` and `## See also` sections, which describe each skill and
agent in prose, were left intact — they are descriptive orientation, not a
loading directive, and their bare mentions do not route.

## The removed contracts, each now routed

| Old contract | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | `kai-core-operating-rules`, routed at the top of `## When you defer`, before handing judgment to another role |
| asset-lifecycle (deleted id; superseded) | `kai-core-asset-producing`, routed in `## Workflow` step 5, before writing the digest pages |
| workspace-conventions (deleted id; superseded) | `kai-core-workspace-paths`, routed in `## Workflow` step 2, before resolving `.kai/runs/pulse/` |
| `kai-core-work-activity` | `## Workflow` step 6, before posting the summary |
| `kai-core-generate-audio` | `## Workflow` step 6, to shape the narration command the user is offered (never run) |
| `kai-core-pulse-digest` | the "You orchestrate" paragraph, before pulling or writing anything |
| `kai-core-web-content-extraction` | `## Workflow` step 3, before reducing a landscape page to its gist |

`kai-core-work-acting` was **added** (it was not on the old loading line): the
pulse writes local durable state — it scaffolds `sources.md` and writes the
digest pages — so it routes `kai-core-work-acting` in `## Workflow` step 2,
before writing durable state. `kai-core-contract-v1` was added at the top.

### generate-audio route vs. "never run audio"

Routing `kai-core-generate-audio` does not contradict the standing rule that the
pulse never runs the audio command. The route loads the skill contract so the
pulse can shape the command it hands the user; Hard rule 5 and the anti-patterns
still forbid running it. The route sentence itself says "you offer it, never run
it."

### asset-closing and work-granting: not added

- **`kai-core-asset-closing` — not added.** The digest is a private, gitignored,
  read-only-sourced artifact under `.kai/runs/pulse/`, never promoted or closed.
- **`kai-core-work-granting` — not added.** The pulse grants no lease; it is
  read-only on every source and defers action to owning roles.

## The degraded-mode refusal

> Invoke `kai-core-contract-v1` before the first other core skill. Without
> `kai-core` I can still read a source the operator hands me directly, but I
> build no digest into `.kai` state, claim no coordinated catch-up, report no Kai
> activity, and tell the operator to install or update `kai-core` before I can
> run a real weekly pulse.

- **Fact 1** — single-shot work in its own domain: *"I can still read a source
  the operator hands me directly."*
- **Fact 2** — no `.kai` state, no claimed coordinated work, no reported
  activity: *"I build no digest into `.kai` state, claim no coordinated catch-up,
  report no Kai activity."*
- **Fact 3** — install or update core: *"tell the operator to install or update
  `kai-core`."*

Distinct in domain wording from the other five agents and the director.

## Notes

- The generated validator/self-test counts are red by design; see
  `task-8-report.md` for the exact lines.

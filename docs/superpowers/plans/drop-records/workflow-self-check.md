# Drop record: `workflow-self-check`

The `workflow-self-check` body opened with an eager contract-loading preamble: a
six-skill loading line and a block quote ordering the agent to load every
contract before acting. Task 8 replaced it with inline, on-demand routes plus a
degraded-mode refusal in the auditor's own voice, and added a top-level
`# Workflow — Self-Check` heading with a `**Primary profile:**` line to match the
Task 7 reference shape. The body moved from **7,889** to **8,059** characters
(the added heading, profile, refusal, and routes slightly exceed the removed
preamble). No obligation was removed.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager six-skill loading line | deleted; each contract is now an inline route |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal plus the `kai-core-contract-v1` route at the top |

## The removed contracts, each now routed

| Old contract | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | `kai-core-operating-rules`, routed in `## Posture`, before calling one role's overlap with another a finding |
| asset-lifecycle (deleted id; superseded) | `kai-core-asset-producing`, routed in `## Workflow` step 4, before creating the report artifact |
| workspace-conventions (deleted id; superseded) | `kai-core-workspace-paths`, routed in `## Workflow` step 1, before resolving the report path |
| work-coordination (deleted id; superseded) | split into `kai-core-work-item` (routed in `## Workflow` step 5, to shape a builder handoff) and `kai-core-work-acting` (routed in `## Workflow` step 4, before writing durable state) |
| `kai-core-work-activity` | `## Workflow` step 4, before surfacing the run |
| `kai-core-no-self-remediation` | `## Workflow` step 4, before writing findings |

`kai-core-contract-v1` was added at the top, before the first other core route.

### Assessor route (Task 8 brief specific)

`workflow-self-check` is on the assessor roster, so it routes the assessor
contract. The brief's exact sentence — `Apply` `kai-core-no-self-remediation`
before writing findings — is placed at the head of `## Workflow` step 4. Task 11
re-points the roster check at the parser, and this route is what it will look
for.

### work-item and work-acting: thin but routed

Both are on the amendment matrix for this agent (inherited work-coordination,
now split). Self-check is read-only on the plugin and writes only its report to
`.kai/runs/`, so:

- **`kai-core-work-acting`** binds at the report write — the report is durable
  workspace state.
- **`kai-core-work-item`** is the thinnest route here. Self-check opens no item;
  it routes the contract only to *shape* the handoff a builder would later turn
  into a work item (`## Workflow` step 5), and states it never opens the item
  itself. Recorded as borderline.

### asset-closing and work-granting: not added

- **`kai-core-asset-closing` — not added.** The self-check report is an
  ephemeral maintenance artifact under `.kai/runs/`, never promoted or closed
  (Hard rule: "No auto-restructuring"; it proposes, it does not execute).
- **`kai-core-work-granting` — not added.** It grants no lease and dispatches
  nobody; it names handoffs for the user or a builder to execute.

## The degraded-mode refusal

> Invoke `kai-core-contract-v1` before the first other core skill. Without
> `kai-core` I stay a single-shot reader of the files in front of me: I write no
> `.kai` report or other state, claim no coordinated audit, report no Kai
> activity, and tell the operator to install or update `kai-core` before a real
> self-check can run.

- **Fact 1** — single-shot work in its own domain: *"a single-shot reader of the
  files in front of me."*
- **Fact 2** — no `.kai` state, no claimed coordinated work, no reported
  activity: *"I write no `.kai` report or other state, claim no coordinated
  audit, report no Kai activity."*
- **Fact 3** — install or update core: *"tell the operator to install or update
  `kai-core`."*

Distinct in domain wording from the other five agents and the director.

## Notes

- The generated validator/self-test counts are red by design; see
  `task-8-report.md` for the exact lines.

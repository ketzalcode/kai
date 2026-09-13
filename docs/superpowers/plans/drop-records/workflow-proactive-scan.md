# Drop record: `workflow-proactive-scan`

The `workflow-proactive-scan` body opened with an eager contract-loading
preamble: a six-skill loading line and a block quote ordering the agent to load
every contract before acting, followed by a `## Contracts you inherit` bullet
list. Task 8 replaced them with inline, on-demand routes plus a degraded-mode
refusal in the procedure's own voice. The body shrank from **6,121** to
**5,759** characters. No obligation was removed.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager six-skill loading line | deleted; each contract is now an inline route |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal plus the `kai-core-contract-v1` route at the top |
| The `## Contracts you inherit` bullet list | deleted; a collected route inventory is the eager pattern this refactor removes. Each skill became an inline route |
| The dead `kai-core-workspace-conventions` reference in `## Workflow — scan` step 1 | re-pointed to a `kai-core-workspace-paths` route at the resolve instruction |

## The removed contracts, each now routed

| Old contract | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | `kai-core-operating-rules`, routed at the top of `## Boundaries`, before deciding what stays the operator's to take |
| asset-lifecycle (deleted id; superseded) | `kai-core-asset-producing`, routed in `## Workflow — scan` step 4, before writing the payload |
| workspace-conventions (deleted id; superseded) | `kai-core-workspace-paths`, routed in `## Workflow — scan` step 1, before resolving the selected workspace |
| `kai-core-work-activity` | `## Report`, before returning either report shape |
| `kai-core-personal-agenda` | `## Workflow — scan` step 2, at the existing `Apply … Source A` sentence |
| `kai-core-proactive-scan` | the intro of `## Workflow — scan`, before scanning |

`kai-core-work-acting` was **added** (it was not on the old loading line): this
scan writes local durable state — an outbox payload and, on `ack`, a ledger
advance — so it routes `kai-core-work-acting` in `## Workflow — ack`, before
advancing the ledger. `kai-core-contract-v1` was added at the top.

### asset-closing and work-granting: not added

- **`kai-core-asset-closing` — not added.** The scan emits an immutable
  notification payload but never decides an asset is complete or closeable; it
  surfaces and never acts.
- **`kai-core-work-granting` — not added.** It grants no lease; it is read-only
  on coordination state.

## The degraded-mode refusal

> Invoke `kai-core-contract-v1` before the first other core skill. Without
> `kai-core` this scan does nothing but a direct, single-shot read of what the
> operator points at: it emits no payload, advances no ledger, creates no `.kai`
> state, claims no coordinated work, reports no Kai activity, and tells the
> operator to install or update `kai-core` before a real scan can run.

- **Fact 1** — single-shot work in its own domain: *"a direct, single-shot read
  of what the operator points at."*
- **Fact 2** — no `.kai` state, no claimed coordinated work, no reported
  activity: *"creates no `.kai` state, claims no coordinated work, reports no Kai
  activity."*
- **Fact 3** — install or update core: *"tells the operator to install or update
  `kai-core`."*

Distinct in domain wording from the other five agents and the director.

## Notes

- The generated validator/self-test counts are red by design; see
  `task-8-report.md` for the exact lines.

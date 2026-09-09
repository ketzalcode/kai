# Drop record: `workflow-incident-response`

The `workflow-incident-response` agent body opened with an eager
contract-loading preamble: a seven-skill inheritance line, a block quote
ordering the agent to load every one before acting, and the injected core
dependency-guard block. Task 9c replaced that preamble with inline, on-demand
routes plus a role-voice degraded-mode refusal. The body shrank from **15,752**
to **14,100** characters. This agent governs behaviour during a live outage, so
nothing that bound conduct under command was allowed to become advisory; every
route sits at the step that already carried its obligation.

Routes live beside their trigger, never collected into a list.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager seven-skill contract line | deleted; each skill reached by an inline route (table below) |
| The "load and apply every skill above" block quote | replaced by the inline first-person degraded-mode refusal plus the `kai-core-contract-v1` route at the top |
| The injected core dependency-guard block | deleted; `kai-core-contract-v1` carries the preflight, routed once before the first other core skill |
| The `## Contracts you inherit` heading and its skill bullets | deleted; its skills became inline routes |

## The seven eager skills, each now routed (plus one added by judgment)

| Old eager skill | Route home |
| --- | --- |
| team-operating-rules (deleted; superseded) | `kai-core-operating-rules`, routed where the agent keeps each command role in its lane |
| asset-lifecycle (deleted; superseded) | split to `kai-core-asset-producing` (routed at the durable incident-record write) and `kai-core-asset-closing` (added — see ruling) |
| workspace-conventions (deleted; superseded) | `kai-core-workspace-paths`, routed before resolving the workspace root for active/raw incident state |
| work-coordination (deleted; superseded) | `kai-core-work-acting`, routed before writing durable command state; the incident item claim rides through `kai-core-work-item` |
| `kai-core-work-activity` | routed where the commander records each status update and hands back |
| `kai-core-scope-discipline` | routed where emergency command may gather evidence but not expand its remit |
| `kai-core-peer-communication` | routed where the commander uses live peers for technical judgment |

`kai-core-contract-v1` is added at the top, before the first other core route.

## Ruling: `kai-core-asset-closing` — ADDED

Incident response is one of the few roles that genuinely *closes*. At CLOSE it
finalizes the sanitized incident record and moves the command-knowledge item to
`completed`. That is a closure/promotion action on an owned asset, not mere
production, so `kai-core-asset-closing` is routed at the closure step —
distinct from `kai-core-asset-producing`, which governs writing the incident
record while command is live.

## The degraded-mode refusal

> If `kai-core` is unavailable I cannot run incident command: I read the
> evidence put in front of me and describe once what it shows — no timeline of
> record, no severity of record, no command roles — and I say plainly that
> command is unavailable; I open no `.kai` incident record, take no
> priority-zero item, and post no Kai status or activity; and I tell the
> operator to install or update `kai-core` before any coordinated response can
> start.

- **Fact 1** — direct single-shot work only: *"I read the evidence … and
  describe once what it shows — no timeline of record, no severity of record, no
  command roles."*
- **Fact 2** — no state, no claimed item, no reported activity: *"I open no
  `.kai` incident record, take no priority-zero item, and post no Kai status or
  activity."*
- **Fact 3** — operator installs/updates core: *"I tell the operator to install
  or update `kai-core`."*

This refusal is deliberately unlike the others: the commander's whole value is
*command* — a timeline of record, a severity of record, assigned command roles.
Degraded, it must announce that command itself is unavailable, not merely offer
a smaller read. It is the only refusal in the wave that names its own core
function as the thing that cannot run.

## Notes

- Validation is red by design; see the task-9c report for reconciled counts.

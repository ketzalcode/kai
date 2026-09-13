# Drop record: `principal-data-engineer`

The `principal-data-engineer` agent body opened with an eager contract-loading
preamble: a seven-skill inheritance line, a block quote ordering the agent to
load every one before acting, and the injected core dependency-guard block. Task
9c replaced that preamble with inline, on-demand routes — one route sentence at
the exact instruction that needs each contract — plus a role-voice degraded-mode
refusal. The body shrank from **11,993** to **10,285** characters. No obligation
was removed; every dropped construct is accounted for below.

Routes live in the prose beside their trigger, never collected into a list (a
collected list is the eager pattern this refactor removes, and `AGENTS.md`
forbids it).

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager seven-skill contract line | deleted; each skill is reached by an inline route (table below) |
| The "load and apply every skill above" block quote | replaced by the inline first-person degraded-mode refusal plus the `kai-core-contract-v1` route at the top of the body |
| The injected core dependency-guard block | deleted; `kai-core-contract-v1` now carries the preflight, routed once before the first other core skill |
| The `## Contracts you inherit` heading and its skill bullets | deleted; its skills became inline routes |

## The seven eager skills, each now routed

The old contract line named seven skills. Every one now has an inline route at
the instruction that needs it (deleted ids are named without backticks because
they no longer resolve; only live ids are backticked).

| Old eager skill | Route home |
| --- | --- |
| team-operating-rules (deleted; superseded) | `kai-core-operating-rules`, routed where the agent keeps each concern in its lane |
| asset-lifecycle (deleted; superseded) | `kai-core-asset-producing`, routed at the durable working-file/model/contract write. No closing half: this role produces, it never closes another role's completed work |
| workspace-conventions (deleted; superseded) | `kai-core-workspace-paths`, routed before resolving the workspace root |
| work-coordination (deleted; superseded) | split to `kai-core-work-acting` (routed before writing durable local state) and `kai-core-work-item` (routed when claiming the `knowledge` item) |
| `kai-core-work-activity` | routed where the agent records the run and hands downstream provisioning/implementation to its owner |
| `kai-core-scope-discipline` | routed where a business-metric request is classified against real scope |
| `kai-core-peer-communication` | routed where the agent obtains real analytics/infra/product input from peers |

`kai-core-contract-v1` is not one of the seven; it is added at the top, before
the first other core route.

## The degraded-mode refusal

> If `kai-core` is unavailable, I answer one data-shape question from the
> schemas and evidence in front of me — a single pipeline sketch, model, or
> contract read from what I'm given, and no further; I open no `.kai` record,
> take no `knowledge` item, and report no Kai activity; and I tell the operator
> to install or update `kai-core` before I rejoin coordinated data-engineering
> work.

- **Fact 1** — continue only with direct single-shot work in this role's domain:
  *"I answer one data-shape question … a single pipeline sketch, model, or
  contract read from what I'm given, and no further."*
- **Fact 2** — no `.kai` state, no claimed coordinated work, no reported
  activity: *"I open no `.kai` record, take no `knowledge` item, and report no
  Kai activity."*
- **Fact 3** — tell the operator to install or update core: *"I tell the
  operator to install or update `kai-core`."*

The refusal derives from the data-engineer's actual degraded product: a
schema/pipeline read of the data in front of it, with no pipeline provisioned.

## Notes

- `kai-core-asset-closing` was **not** added. This role produces designs and
  claims its own `knowledge` item; it never accepts or closes another role's
  completed work.
- Validation is red by design at this point in the refactor; see the task-9c
  report for the reconciled counts.

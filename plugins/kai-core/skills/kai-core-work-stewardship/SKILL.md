---
name: kai-core-work-stewardship
description: "Use when a named authority proposes, activates, prioritizes, holds, reprioritizes, or closes hierarchy scope."
tools: [read, execute, search, ask_user]
---

# Work stewardship

SQLite at `.kai/core/runtime/coordination.sqlite` is the **only coordination
authority**. Stewardship mutations use typed `epic.*`, `feature.*`, and
`requirement.*` commands through
`node "<kai-plugin>/scripts/coordinate.mjs" apply --root "<workspace-root>"`.

## Authority

| Action | Required named authority |
| --- | --- |
| Propose or activate an Epic | operator or explicitly delegated Epic scope authority |
| Prioritize Epics | operator or explicitly delegated Current Goal steward |
| Propose a Feature | owning pack authority |
| Activate or prioritize a Feature | Epic steward |
| Propose or activate a Requirement | Feature scope authority |
| Propose or promote a Task | Requirement scope authority |
| Grant a Task | Chief of Staff or the authorized lone-actor route |
| Close a parent | that record's completion authority |

Any role may make a suggestion. A suggestion stays **conversational** until
named authority approval and creates no durable proposal before that decision.

The Chief of Staff grants Tasks. It does not acquire authority to invent or
rewrite Epic, Feature, or Requirement scope, priority, relationships,
authorities, or acceptance.

## Promotion and focus

An Epic activates only when its `direction_ref` matches the current
`docs/kai/DIRECTION.md`, its contribution to the Current Goal is explicit, its
scope fits Vision, Mission, and Out of Scope, and its scope authority accepts
that fit.

When proposed work does not fit an active Epic, present the authority with
three choices: keep it conversational, create an authority-approved proposed
Epic under a hold, or explicitly reprioritize Direction. Never edit Direction
silently.

Direction drift blocks new child activation, Task promotion, and Task grants.
A leased Task may continue only to a safe handoff. The steward then carries the
Epic forward against the new accepted Direction, leaves it on hold, or closes
it as cancelled or superseded.

## Holds and closure

Holds record reason, actor, timestamp, observable release condition, and basis
references. They block child promotion and new Task grants without changing
parent lifecycle.

Required children determine closure eligibility; optional children do not.
Child completion never auto-closes its parent. The completion authority accepts
an exact criteria reference containing required child IDs and versions.
Version drift returns `VERSION_CONFLICT`.

No Markdown board, backlog, milestone, thread, Task, or hierarchy log is an
authority surface. Human-readable reports are views over SQLite.

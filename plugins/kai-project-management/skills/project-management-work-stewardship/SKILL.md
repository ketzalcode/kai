---
name: project-management-work-stewardship
description: "Use when a named authority creates, activates, prioritizes, holds, releases, or closes Project Management scope."
tools: [read, execute, search, ask_user]
publication-entrypoint: project-management-workspace-publication
---

# Project Management stewardship

Use `project-management-work-hierarchy` for record meaning. Mutations use
`direction.*`, `epic.*`, `feature.*`, and `requirement.*` commands through the
private Project Management runtime.

## Authority

- Scope authority creates, activates, reprioritizes, changes scope, sets holds,
  and releases holds.
- Owner may update descriptive fields.
- Completion authority closes the exact record.
- Any role may suggest. A suggestion creates no durable authority.

## Holds and dependencies

Holds record reason, actor, timestamp, observable release condition, and basis
references. They block activation and Task handoff. Hold release requires
non-empty evidence basis references.

Feature dependencies must be delivered before dependent scope produces Core
Tasks. Missing or incomplete dependencies are evidence gaps, never permission
to bypass the runtime.

## Closure

Required children determine successful parent closure. Optional children do
not. Child completion never auto-closes a parent.

Requirement completion names every required opaque Core Task ID exactly and
supplies current evidence basis references. The completion authority verifies
the record's outcome and every acceptance criterion against that evidence.
Missing, stale, or contradicted evidence blocks closure. The Project Management
database does not copy Task lifecycle state. Epic, Feature, and Direction
closure checks only their package-owned child records.

Apply `project-management-workspace-publication` only when named authority asks
to publish an accepted Direction or planning revision.

Never edit either SQLite database directly. Never represent a hold, priority,
or closure decision in Markdown as authority.

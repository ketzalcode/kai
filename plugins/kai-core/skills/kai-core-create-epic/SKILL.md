---
name: kai-core-create-epic
description: "Use when an approved outcome needs a Direction-aligned Epic proposal before Feature, Requirement, or Task planning."
tools: [execute, read, search, ask_user]
user-invocable: true
argument-hint: "approved outcome and target workspace"
---

# Create an Epic

Prepare and submit one proposed Epic. This procedure never activates it, creates
descendants, changes priority, or starts implementation.

## Resolve

Apply `kai-core-workspace-paths` before resolving the exact schema-5 workspace,
project, Direction, and coordination runtime.

Require:

- an observable outcome advancing the current Goal;
- owner, scope authority, completion authority, and proposal approver;
- contribution, scope fit, priority, outcome, and acceptance; and
- initial required and optional Feature boundaries.

The operator owns Direction. Missing authority or hierarchy detail is not
permission to invent it.

## Propose

Read current Direction and existing Epic IDs through the runtime. Verify the
proposal advances the Goal, respects Out of Scope, has disjoint required and
optional Feature IDs, and names all authorities.

Present the complete proposal and exact approval request. Use `ask_user` only
when the named approver is the operator. Confidence, role installation, or a
chat hint is not approval.

## Submit

Stop if approval is missing, ambiguous, stale, or from another actor.

Apply `kai-core-work-acting` immediately before the state-changing command:

```text
node "<kai-plugin>/scripts/coordinate.mjs" apply --root "<workspace-root>"
```

Submit one `epic.create` with the runtime-computed current Direction reference.
Treat every runtime refusal as a stop; never rewrite authority to make the
command pass.

Return the exact Epic ID, version, proposed state, authorities, Direction hash,
and next named authority action.

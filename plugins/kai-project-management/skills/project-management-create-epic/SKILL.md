---
name: project-management-create-epic
description: "Use when an approved outcome needs a Direction-aligned Epic proposal before Feature, Requirement, or Core Task planning."
tools: [execute, read, search, ask_user]
user-invocable: true
argument-hint: "approved outcome and target workspace"
---

# Create a Project Management Epic

Invoke `kai-core-contract-v1` before the first other Core skill. If Core is
unavailable, ordinary direct work may continue, but do not initialize or
mutate `.kai` state; tell the operator to install or update `kai-core`.

Prepare and submit one proposed Epic. This procedure never activates it,
creates descendants, changes priority, or starts implementation.

## Resolve

Apply `kai-core-workspace-paths` before resolving the schema-6 workspace. Then
inspect the Project Management runtime:

```text
node "<kai-project-management-plugin>/scripts/project.mjs" inspect --root "<workspace-root>"
```

If its private database is absent, initialize it only with operator approval:

```text
node "<kai-project-management-plugin>/scripts/project.mjs" init --root "<workspace-root>"
```

Require an active Direction, observable outcome, owner, scope authority,
completion authority, contribution, scope fit, priority, acceptance, and
disjoint required and optional Feature IDs. Do not invent missing authority or
scope.

## Propose

Read the exact Direction and existing IDs through `detail` and `status`.
Present the complete proposal to its named scope authority. Use `ask_user` only
when that authority is the operator.

Submit one `epic.create` command through:

```text
node "<kai-project-management-plugin>/scripts/project.mjs" apply --root "<workspace-root>"
```

Return the Epic ID, version, proposed state, authorities, Direction reference,
and next named authority action. Treat every refusal as a stop.

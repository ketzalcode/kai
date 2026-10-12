---
name: kai-core-work-granting
description: "Use when an authorized grantor plans executable Tasks, issues or reconciles grants and leases, launches a role, or handles recovery."
tools: [read, execute, search, ask_user, agent, read_agent, write_agent]
---

# Granting Work

Use the coordination runtime:

```text
node "<kai-plugin>/scripts/coordinate.mjs" <verb> --root "<workspace-root>"
```

SQLite is the only coordination authority. Never hand-edit state or infer
authority from role installation.

## Load only the active boundary

- Apply `kai-core-workspace-paths` only when the workspace or project binding
  is unresolved.
- Apply `kai-core-work-task` immediately before Task grant, lease, lifecycle,
  or recovery work.

Do not load all four as a generic preflight.

## Plan

Read `inspect`, `status`, exact `detail`, bounded `context`, and `plan` as
needed. `plan` returns executable Tasks only and never launches a role.

For one candidate, verify dependencies, questions, Task version, next role,
`touches`, required evidence/reviews, latest handoff, and named authority. A
missing role is a staffing gap, not permission to change the Task.

Grantors grant Tasks only. Missing scope, authorities, acceptance, execution
details, or publication targets return to the named scope authority.

## Grant and launch

For one authorized Task:

1. prepare the exact role/profile/model request;
2. persist `task.grant` or an authorized bounded delegation;
3. launch the standalone role with the prepared identity;
4. require its first coordinated command to be `claim`; and
5. verify holder, token, Task version, allowed actions, and expiry before model
   work.

Preparation is metadata, not permission. Claim is not a grant. Peer chat is not
the durable record.

## Reconcile

Re-read after every handoff, review, answer, timeout, host failure, or external
effect. Stop on version/lease conflict, missing evidence, recovery hold, or
changed scope.

Preserve partial work. Expire or recover a lease only through an authorized
runtime command. Never silently reassign, overwrite, or launch a second holder.

Route findings to the implementation owner. A reviewer does not repair work
under a review grant. Completion remains with its named authority.

Return exact IDs, versions, grant/lease state, launched role or failed attempt,
evidence gaps, and the next named authority.

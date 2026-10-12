---
name: kai-core-work-task
description: "Use when creating, promoting, granting, executing, handing off, reviewing, restoring, or closing a coordinated Task."
tools: [read, execute, search]
---

# Work Task

A Task is a standalone executable A2A record. SQLite at
`.kai/core/runtime/coordination.sqlite` is the **only coordination authority**.
Read and mutate it only through
`node "<kai-plugin>/scripts/coordinate.mjs" <verb> --root "<workspace-root>"`.

## Required shape

A Task has a typed `<pack>:task:<id>` and optional opaque `planning_refs[]`.
It records delivery class, state, scope and completion authorities, producer
and acceptance actors, next role,
outcome, acceptance, artifact expectation and targets, context artifacts,
touches, Task dependencies, lease, recovery hold, blocking questions, review
requirements, immutable change reference, version, and timestamps.

The Task contract never invents missing authority, acceptance, execution scope,
or artifact targets. Direct work remains direct and creates no Task.

## Lifecycle

```text
proposed -> ready -> in-progress -> in-review
in-review -> completed
```

`completed` closes the executable A2A record after its named completion
authority accepts the exact change. It does not mean parent scope is complete,
released, deployed, or shipped. Those decisions remain outside Core.

Blocked, restoration, dropped, lease, recovery, and review gates remain
explicit. A lifecycle transition never substitutes for required review,
acceptance, evidence, or operator action.

## Commands and leases

- `task.create` records an authority-approved proposal.
- `task.promote` requires the named scope authority.
- `task.grant` binds one holder, exact version, lease token, expiry, and allowed
  actions.
- `task.update`, `task.transition`, and `task.handoff` require current authority,
  version, and lease conditions.
- `task.restore` and `attempt.recover` preserve collision evidence and require
  the declared recovery authority.

Treat `VERSION_CONFLICT`, `LEASE_CONFLICT`, `AUTHORITY_REQUIRED`,
`RECOVERY_REQUIRED`, and `EVIDENCE_GAP` as refusals. Re-read; never overwrite,
borrow a lease, or turn a failed command into a success-shaped handoff.

Messages, questions, handoffs, reviews, approvals, evidence, artifacts, assets,
grants, and host attempts are typed records bound to the Task. No Markdown Task
file or log is authoritative.

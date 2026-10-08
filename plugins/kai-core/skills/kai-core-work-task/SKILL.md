---
name: kai-core-work-task
description: "Use when creating, promoting, granting, executing, handing off, reviewing, restoring, or closing a coordinated Task."
durable-output-producer: false
tools: [read, execute, search]
---

# Work Task

A Task is the only executable hierarchy record. SQLite at
`.kai/core/runtime/coordination.sqlite` is the **only coordination authority**.
Read and mutate it only through
`node "<kai-plugin>/scripts/coordinate.mjs" <verb> --root "<workspace-root>"`.

## Required shape

A Task has a typed `<pack>:task:<id>`, one same-pack `feature_id`, and non-empty
same-Feature `satisfies[]`. It also records delivery class, state, scope and
completion authorities, producer and acceptance actors, priority, next role,
outcome, acceptance, artifact expectation and targets, context artifacts,
touches, Task dependencies, lease, recovery hold, blocking questions, review
requirements, immutable change reference, version, and timestamps.

The Task contract never invents missing Epic, Feature, Requirement, authority,
priority, acceptance, or artifact targets. Direct work remains direct and
creates no Task.

## Lifecycle

```text
proposed -> ready -> in-progress -> in-review
knowledge: in-review -> completed
product/operational:
  in-review -> release-ready -> deploying
  -> production-verification -> shipped
```

Blocked, restoration, dropped, lease, recovery, review, deployment, and
production-verification gates remain explicit. A lifecycle transition never
substitutes for required review, acceptance, evidence, or operator action.

## Commands and leases

- `task.create` records an authority-approved proposal.
- `task.promote` requires the named scope authority and active referenced
  Requirements.
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

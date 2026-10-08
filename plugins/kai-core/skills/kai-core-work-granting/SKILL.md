---
name: kai-core-work-granting
description: "Use when a grantor plans executable Tasks, issues or reconciles grants and leases, prepares a native role, or handles recovery."
tools: [read, execute, search, ask_user, agent, read_agent, write_agent]
---

# Granting and reconciling work

SQLite at `.kai/core/runtime/coordination.sqlite` is the **only coordination
authority**. Every read and write uses:

```text
node "<kai-plugin>/scripts/coordinate.mjs" <verb> --root "<workspace-root>"
```

No command silently creates or initializes the database. A missing schema-5
workspace routes explicit onboarding. Older workspaces are inspect-only and
route explicit migration.

## Direct mode

Run the dedicated runtime probe:

```text
node "<kai-plugin>/scripts/coordinate.mjs" direct --root "<workspace-root>"
```

Perform the directly authorized request without a database, Direction,
hierarchy record, lease, dispatch plan, or report tree only when that command
exits zero and returns `coordinationRequired: false`. `inspect` describes a
workspace; it never authorizes direct mode. Do not backfill coordination
afterward.

## Preflight

Before coordinated planning or granting:

1. Load the current workspace and Direction through `kai-core-workspace-paths`.
2. Load `kai-core-work-hierarchy` before interpreting Epic, Feature,
   Requirement, or Task relationships.
3. Load `kai-core-work-stewardship` before promotion, priority, hold, or parent
   authority decisions.
4. Load `kai-core-work-task` before Task promotion, grant, lease, lifecycle, or
   recovery decisions.
5. Read `inspect`, `status`, `detail`, `context`, and `plan` as needed.
6. Confirm exact actor identity, role availability, authority, versions,
   Direction alignment, holds, dependencies, questions, and recovery state.

`plan` returns executable Tasks only and reports `automatic: false`. It never
returns Epic, Feature, or Requirement records as dispatchable work. The runtime
does not launch a role automatically; the operator or host launches each
prepared context.

## Authority boundary

Chief of Staff and other grantors grant Tasks only. They cannot invent or
rewrite Epic, Feature, or Requirement scope, priority, relationships,
authorities, acceptance, or publication targets. If those are absent, return
to the named scope authority.

Role installation is capability, not authority. A missing role is a staffing
gap; do not mutate the durable record to pretend otherwise.

## Native launch ordering

For each executable Task:

1. `prepare` the exact role/profile/model request.
2. Persist `task.grant`, or `delegate` a bounded capability from an authorized
   parent capability.
3. Launch the standalone role context with the prepared identity arguments.
4. Require the role's first coordinated operation to be `claim`.
5. Verify claim, lease, Task version, actions, and current Direction before
   model work.

Preparation metadata is not permission. Claim does not create a grant.
Automatic peer dispatch, effect replay, and peer model/effect observation are
not promised. If the host cannot supply a required capability, return
`UNSUPPORTED_HOST` or `ROLE_UNAVAILABLE`; never fabricate evidence.

## Grant and lease rules

A grant binds:

- one typed Task and exact version;
- one actor and `COPILOT_AGENT_SESSION_ID`;
- allowed command kinds;
- one lease token and expiry;
- required inputs, touches, review obligations, and expected artifact targets.

Only one live holder acts on a Task. `VERSION_CONFLICT` and `LEASE_CONFLICT`
stop the write. Expired, abandoned, conflicting, or partially observed work
enters explicit recovery; it is not silently regranted.

## Recovery

Reconcile the stale attempt, working tree, evidence, host observations,
questions, current Task, and Direction. Use `attempt.recover` and `task.restore`
only with the required operator or named recovery authority. Preserve partial
work and record why the chosen resume, handoff, discard, or manual action is
safe.

A recovery approval uses the runtime's exact human-decision flow. When
`ask_user` is required, pass the issued `message` and `requestedSchema`
verbatim. Only `User responded: APPROVE <nonce>` matches the issued request.
A chat-typed approval creates no receipt.

The same native maintenance gate protects `migrate`, `recover`, `rollback`,
and `repair`. Failure remains failure; no broad catch converts it to success.

## Review and completion routing

Grant independent reviewers only the exact review action and change reference
they need. Security, reliability, privacy/compliance, quality, code, and design
review roles record findings; they do not self-remediate without a separate
implementation Task.

Parent closure stays with each record's completion authority. Task grants do
not accept a Feature, Requirement, Epic, or produced artifact.

## Read surfaces

- `status` is the cross-record view.
- `detail --kind <kind> --id <id>` reads one exact record.
- `context --kind <kind> --id <id>` returns bounded Direction, ancestry,
  authority, dependency, message, evidence, and next-action context.
- `messages --kind <kind> --id <id>` reads typed communication.
- `export --kind <kind> --id <id>` produces a report, never authority.

No Markdown board, backlog, milestone, thread, Task, or hierarchy log is
maintained as coordination state.

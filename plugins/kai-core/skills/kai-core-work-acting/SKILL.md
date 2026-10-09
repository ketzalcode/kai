---
name: kai-core-work-acting
description: "Use when an actor is about to read or mutate granted coordinated work, record evidence, ask a question, hand off, or submit review."
tools: [read, execute, search]
---

# Acting on coordinated work

SQLite at `.kai/core/runtime/coordination.sqlite` is the **only coordination
authority**. Use:

```text
node "<kai-plugin>/scripts/coordinate.mjs" <verb> --root "<workspace-root>"
```

Never hand-edit coordination state. Markdown is Direction or accepted
knowledge, not a lease, lifecycle, message, review, or authority surface.

Direct single-shot work needs no workspace, Direction, database, hierarchy
record, lease, or activity entry.

## Route the owning contract just in time

- For Epic, Feature, or Requirement meaning and relationships, Load
  `kai-core-work-hierarchy`.
- Before an authority, promotion, hold, reprioritization, or parent-completion
  decision, Load `kai-core-work-stewardship`.
- Before Task execution or lifecycle work, Load `kai-core-work-task`.
- Before producing a durable artifact, confirm the owning pack publication
  contract has already validated its vocabulary and destination.

## Verify before every state-changing command

1. Use `inspect`, then read exact `detail` and bounded `context` for the typed
   subject.
2. Re-read the current Direction reference and ancestor holds.
3. Confirm actor identity, named authority, expected record version, and
   command kind.
4. For Task execution, confirm current lease holder, token, expiry, recovery
   hold, dependencies, `touches`, context artifacts, open questions, review
   requirements, and latest handoff.
5. Re-read every path or record that may have changed since the last command.
6. Submit one idempotent command envelope with `operationId`, `recordKind`,
   `recordId`, `expectedVersion`, and `leaseToken`.
7. Treat `VERSION_CONFLICT`, `LEASE_CONFLICT`, `AUTHORITY_REQUIRED`,
   `RECOVERY_REQUIRED`, `EVIDENCE_GAP`, and `INVALID_INPUT` as refusals. Stop,
   re-read, and reconcile; never overwrite or silently retry a changed plan.

`COPILOT_AGENT_SESSION_ID` supplies the actor `runId`. Do not manufacture a
session identity.

## Task execution

Claim does not grant work. A valid `task.grant` or delegated capability names
the Task, actor, exact actions, version, and lease. Apply only those actions.

- `task.update` changes only authorized descriptive or routing fields.
- `task.transition` records a truthful lifecycle transition.
- `task.handoff` persists a bounded handoff and may not invent new scope.
- `question.open` and `question.answer` preserve the typed subject and basis
  version.
- `review.record`, `approval.record`, `evidence.register`,
  `artifact.register`, and `asset.transition` bind exact subject versions.

The producing actor never accepts its own output where independent acceptance
is required. Product-design acceptance comes from the declared
`completion_authority`, which must never be `creative-lead-design` itself when
that role produced the design; a producer cannot accept its own design.

## Collision and recovery

On stale version or lease loss:

1. stop editing and preserve the working tree;
2. read the current Task and latest accepted events;
3. report changed paths, completed work, unresolved work, and exact evidence;
4. hand control to the current holder or operator recovery path;
5. resume only after a new valid grant, lease, and version basis.

Do not use a Markdown collision note as authority. Recovery state and evidence
are typed records in SQLite.

## Handoff

`task.handoff` content contains:

```yaml
did: <completed work and evidence>
needs: <next executable action>
assetState: <artifact/disposition/validity summary>
authority: <current scope and completion authorities>
revalidation: <what must be re-read>
questions: []
```

The recipient claims and verifies the current Task before acting. A handoff is
not a grant and cannot transfer authority by prose.

## Questions and answers

Open a blocking or non-blocking typed question with one named recipient,
decision requested, options, recommendation when permitted, and impact. Only
the named authority's answer resolves an authority-bound question. Chat text
that was not captured by the runtime is not a durable decision.

## Review routing

Review requirements name role, kind, independence, and exact `change_ref`.
Reviewers record findings and verdicts; they do not repair the product unless
separately granted implementation work. A changed revision invalidates stale
review or approval.

Before the final handoff, leave the Task, artifacts, questions, reviews,
evidence, and next action truthful enough for a fresh session to continue.

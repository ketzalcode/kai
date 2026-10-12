---
name: nightshift-run
description: "Use inside eng-nightshift for a bounded unattended engineering run whose Nightshift agent chooses one PR slice at a time and whose runner only persists, launches, and reports."
tools: [execute, read, edit, search, ask_user, skill]
---

# Nightshift Run

Deliver the approved outcome first. Unused time or budget does not create more
scope.

This skill owns only the stable Nightshift lifecycle. Core owns work authority.
`eng-nightshift` owns run judgment and uses generic engineering roles for each
slice. The runner owns mechanical persistence and launching.

## Admit one bounded run

PREPARE fixes only what must remain stable for the night:

- approved goal and bounded Core Tasks;
- optional supplied Project Management projection references;
- exact base revision;
- scope and completion authorities;
- filesystem, network, secret-reference, Git, and GitHub permissions;
- deadline, pull-request, credit, continuation, and retained-worktree limits;
- stacking permission; and
- evidence expectations.

Do not pre-author every PR, branch, route, or result shape. `eng-nightshift`
chooses the next slice from current Core state after each checkpoint.

Retain the approved admission with:

```text
node "<kai-engineering-plugin>/scripts/nightshift.mjs" prepare \
  --root "<workspace-root>" --plan "<approved-admission.json>"
```

A changed goal, boundary, authority, or permission creates a new run. A new
in-scope slice does not.

## Run incremental PR cycles

The unattended loop is:

1. `eng-nightshift` reads the admission, Core state, and accumulated
   checkpoints.
2. Nightshift chooses one next PR-sized slice, reports a blocker, or declares
   the approved outcome complete.
3. The runner appends that decision and launches the requested standalone
   builder.
4. Nightshift uses generic `eng-lead-software` to integrate the builder
   handoff, apply final PR sizing, and deliver that one complete slice.
5. A separately required reviewer runs only when already authorized.
6. The runner appends the observed result and asks Nightshift for the next
   decision.

The runner never decomposes the goal, selects a domain route, expands scope, or
decides that more product work is required. It validates paths and state,
creates worktrees, launches named profiles, captures receipts, enforces limits,
and appends observations.

Start or resume with:

```text
node "<kai-engineering-plugin>/scripts/nightshift.mjs" run \
  --root "<workspace-root>" --run-id "<run-id>"
```

## Keep the delivery boundary simple

| Class | Action |
| --- | --- |
| **Required** | Implement because accepted behavior, directly affected behavior, compatibility, or material correctness requires it. |
| **Blocked** | Preserve and route because continuing needs authority, scope expansion, recovery, or an unavailable capability. |
| **Suggested** | Do not implement; append the broader refactor, speculative edge case, cleanup, optimization, or lower-confidence idea for morning review. |

Nightshift accepts the lead's delivered slice when its outcome is satisfied,
directly affected behavior has proportionate evidence, and no introduced
material regression or safety defect remains.

## Append checkpoints; do not rewrite the admission

Append one event for each Nightshift decision and observed stage result. A checkpoint
needs only:

- run and slice identity;
- current Task/version and acting role;
- base/head or blocker state;
- PR and evidence references when present;
- suggestions deliberately not implemented;
- observed limits; and
- the next Nightshift decision.

The event log is execution history, not work authority. Core remains
authoritative for Tasks, grants, leases, questions, handoffs, evidence, review,
acceptance, and recovery.

Use Core `question.open`, `task.handoff`, and recovery commands for real
blockers. The checkpoint references those records; it does not restate their
schemas.

## Render the morning report

Read `references/morning-report.md`, then render from the immutable admission,
append-only events, and current Core state:

```text
node "<kai-engineering-plugin>/scripts/nightshift.mjs" report \
  --root "<workspace-root>" --run-id "<run-id>"
```

The report separates delivered PRs, blocked and skipped work, suggestions,
evidence gaps, limits, and morning decisions. It is a read-only projection,
never a contract another agent updates.

## Hard stops

Stop affected work on goal/base drift, lost authority or lease, collision,
scope expansion, unsafe permissions, unavailable required capability, exhausted
limits, invalid observed output, or no safe in-scope work.

Never merge, deploy, tag, release, mutate production, self-approve, substitute
an unconfigured role/model, or keep working merely to consume the night.

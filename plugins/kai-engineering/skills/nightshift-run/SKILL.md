---
name: nightshift-run
description: "Use inside eng-nightshift to prepare, execute, or reconcile a bounded unattended engineering run with serial pull-request slices, structured blockers, exact evidence, and a morning report."
tools: [execute, read, edit, search, ask_user, agent, read_agent, write_agent, skill]
---

# Nightshift Run

Nightshift is self-driven inside approved work and self-stopping at its
boundary. Deliver what is required first. Unused time or budget does not create
more scope.

Read `references/morning-report.md` before PREPARE or RECONCILE.

## Delivery boundary

| Class | Meaning | Action |
| --- | --- | --- |
| **Required** | Needed for accepted behavior, directly affected behavior, repository compatibility, a regression caused by the change, or material correctness/safety. | Implement and verify. |
| **Blocked** | Necessary work needs authority, changes accepted scope or a material contract, conflicts with current state, or cannot proceed safely from available evidence. | Preserve, record, and continue only independent work. |
| **Suggested** | Broader refactor, speculative edge case, reusable abstraction, cleanup, optimization, hardening idea, or lower-confidence improvement not required for acceptance. | Do not implement. Put it in the morning report. |

A slice is complete when its accepted outcome is satisfied, directly affected
behavior has proportionate current evidence, no introduced material regression
or safety defect remains, required review is current, and Core plus Git/PR state
are truthful.

Do not broaden a pull request after that point.

## PREPARE

Prepare from current Core context, never from an informal backlog.

Each slice has:

- a safe ID;
- exact Task ID and version;
- one required outcome;
- accepted criteria;
- touched areas;
- one observable completion check;
- one `frontend` or `backend` route selected by `eng-nightshift`;
- the already-approved `reviewRequired` decision;
- deterministic branch;
- explicit slice dependencies; and
- no agent or model field.

The plan also binds:

- schema version `1`;
- run ID and approval time;
- deadline;
- project binding;
- exact Feature subject and version;
- Direction path, SHA-256, and Current Goal;
- remote, base branch, and full base commit;
- maximum pull requests, AI credits, autopilot continuations, and retained
  worktrees;
- push and pull-request permission;
- allowed URLs and secret references; and
- whether stacked pull requests are permitted.

Secret references are names only. Never store secret values.

Validate and retain the approved plan:

```text
node "<kai-engineering-plugin>/scripts/nightshift.mjs" prepare \
  --root "<workspace-root>" --plan "<approved-plan.json>"
```

Preparation writes only below:

```text
.kai/engineering/reports/nightshift/<run-id>/
  drafts/{plan.json,ledger.json,report.md}
  evidence/
  scratch/
```

The plan is immutable after preparation. A changed approval creates a new run.

## RUN

Start or resume serial execution with:

```text
node "<kai-engineering-plugin>/scripts/nightshift.mjs" run \
  --root "<workspace-root>" --run-id "<run-id>"
```

The runner:

1. revalidates the plan and immutable base;
2. selects the next dependency-safe pending slice;
3. creates one branch and linked worktree;
4. launches the routed builder as a fresh standalone programmatic session;
5. launches `eng-lead-software` as a fresh standalone delivery session after a
   complete builder handoff;
6. launches `eng-reviewer-code` as a fresh standalone session only when the
   prepared slice requires it;
7. passes no model override;
8. captures each stage's stdout and stderr privately;
9. validates terminal results against actual Git state;
10. checkpoints the ledger atomically;
11. removes a delivered clean worktree;
12. preserves blocked or failed work; and
13. continues another independent safe slice.

A blocked or failed dependency skips downstream slices. A blocked slice does
not stop unrelated ready work. If no safe work remains, reconcile early.

Host AI-credit limits are soft ceilings. The runner stops launching new work at
its run limit but never claims an exact token hard stop.

## Result contracts

The builder returns one JSON object with `status` equal to `completed`,
`blocked`, or `failed`; `summary`, `headSha`, `evidence`, `suggestions`,
`blocker`, and `nextAction` use the same meanings below. `completed` requires a
clean committed worktree whose head differs from the slice base.

The delivery lead returns one JSON object and no surrounding prose:

EXECUTE returns one JSON object and no surrounding prose:

```json
{
  "status": "delivered | blocked | failed",
  "summary": "<required outcome or exact gap>",
  "headSha": "<full lowercase commit SHA or null>",
  "prUrl": "<GitHub pull request URL or null>",
  "evidence": ["<durable observation or reference>"],
  "suggestions": [
    {
      "summary": "<not implemented>",
      "basis": "<observed condition or explicit hypothesis>",
      "whyDeferred": "<delivery-boundary reason>",
      "benefit": "<expected value>",
      "costRisk": "<implementation cost or risk>",
      "priority": "<suggested priority>"
    }
  ],
  "blocker": {
    "kind": "<fact | decision | action | capability | collision | limit>",
    "owner": "<named authority or fact owner>",
    "context": "<structured context>",
    "ask": "<one decision or action>",
    "answerBy": "<timing or milestone>",
    "questionRef": "<Core question reference or null>"
  },
  "nextAction": "<safe resume or review action>"
}
```

`blocker` is `null` for `delivered`. Delivered additionally requires a clean
worktree, reported head equal to actual `HEAD`, a head different from the
slice base, and a GitHub pull-request URL.

Invalid or missing JSON, dirty delivered work, mismatched revisions, or a
missing PR becomes failure with preserved state. Never infer success.

## Self-unblocking

1. **Observe** the exact failure or missing evidence.
2. **Diagnose** root cause from repository and runtime evidence.
3. **Repair locally** only inside the accepted Task.
4. **Retry boundedly** inside the current session and continuation limit.
5. **Checkpoint** Git state, evidence, remaining work, and safe resume point.
6. **Route** the existing Core question, handoff, blocked state, or recovery.
7. **Continue** only independent approved work.
8. **Stop cleanly** when no safe ready work or run budget remains.

Do not weaken tests, assertions, evidence, or acceptance to make progress look
successful.

## Structured blockers

Use Core state, not a Markdown blocker file:

- `question.open` for one fact, decision, reply, or action;
- `task.handoff` for completed work, needs, assets, authority, revalidation,
  and question references;
- a blocking question for blocked state, lease revocation, and `resume_state`;
- `attempt.recover` and `task.restore` for collisions and stale attempts; and
- evidence/artifact references for observations.

Format the existing question `context`:

```text
Observation: <what happened at which revision/state>
Attempts: <bounded actions and outcomes>
Boundary: <why continuing exceeds scope, authority, safety, or limits>
Recommendation: <smallest safe decision or action>
Resume point: <branch/worktree/Task state and next step>
```

`ask` contains one decision or action. The recipient owns that fact or
authority. `answerBy` states the timing or milestone.

## Evidence

Map every acceptance criterion to:

- Requirement and Task basis;
- exact base/head or artifact hash;
- observable scenario;
- observed artifact or repository-owned check;
- result;
- coverage limitation; and
- required review or acceptance.

The PR uses a reviewer-facing table:

| Acceptance criterion | Scenario or artifact | What it establishes | Limitation |
| --- | --- | --- | --- |

Do not copy commands, pass counts, changing CI status, review state, or raw
logs into the PR description. CI owns live status. Private evidence retains
exact commands and outputs needed for recovery or audit.

Frontend evidence uses comparable before/after screenshots and focused
behavior checks. Backend evidence uses contract observations and focused tests.
Add a small diagram only when a changed boundary is materially clearer
visually.

## RECONCILE

Regenerate the morning report:

```text
node "<kai-engineering-plugin>/scripts/nightshift.mjs" report \
  --root "<workspace-root>" --run-id "<run-id>"
```

Compare it with current Core state. Core wins every disagreement.

The report separates delivered pull requests, blocked work, intentionally
deferred suggestions, skipped dependencies, evidence gaps, retained
worktrees, observed usage, and the exact next action.

Suggestions state their evidence or hypothesis, why they were deferred,
benefit, cost/risk, and suggested priority. They are not Tasks or issues.

## Hard stops

Stop affected work on:

- Direction, base, Task, version, lease, or authority drift;
- scope expansion or a material unresolved contract decision;
- unavailable required role, tool, permission, network route, or secret;
- collision or recovery hold;
- pull-request, continuation, retained-worktree, deadline, or AI-credit limit;
- invalid terminal output; or
- no safe ready work.

Never merge, deploy, tag, release, change production, self-approve, choose an
unconfigured replacement role/model, or keep working to consume the window.

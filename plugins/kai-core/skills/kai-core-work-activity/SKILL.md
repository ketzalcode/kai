---
name: kai-core-work-activity
description: "Use when a coordinated role should emit optional append-only start, progress, stop, deadline, or silence signals."
durable-output-producer: false
tools: [execute, read, search]
requires_tools: [execute]
---

# Work activity

`kai-core-work-task` defines what executable work is. Activity reports what an
actor says it is doing now. They are deliberately separate.

| Surface | Task record | Activity log |
| --- | --- | --- |
| Location | `.kai/core/runtime/coordination.sqlite` | `.kai/core/runtime/activity.jsonl` |
| Shape | versioned transactional record | append-only JSON lines |
| Carries | authority, state, lease, reviews, evidence | role, optional typed Task, run, deadline, phase |
| Authority | only coordination authority | non-authoritative optional signal |

An activity append never advances lifecycle, grants work, satisfies review,
records a decision, or certifies that a model ran. A missing append costs
visibility, never correctness.

## When to append

1. `start` after a valid claim and before Task work.
2. `progress` only when a phase changes the honest next-report estimate.
3. `stop` before the final handoff, including blocked or abandoned work.

Every start/progress supplies `--for`, the bounded window until the next report.

## Commands

```text
node <kai-plugin>/scripts/activity.mjs new-run

node <kai-plugin>/scripts/activity.mjs start \
  --root <workspace-root> --role eng-builder-software \
  --task engineering:task:export-audit --run <run-id> --for 45m

node <kai-plugin>/scripts/activity.mjs progress \
  --root <workspace-root> --role eng-builder-software \
  --run <run-id> --for 30m --note "implementation underway"

node <kai-plugin>/scripts/activity.mjs stop \
  --root <workspace-root> --role eng-builder-software \
  --run <run-id> --outcome handoff

node <kai-plugin>/scripts/activity.mjs show --root <workspace-root>
```

`--task`, when present, is a full typed Task ID. `--note` is one short phase
description; paths, prompts, commands, usernames, and diffs are rejected.

## Failure behavior

The append path is best-effort and never blocks Task work. Report and drop a
failed append; do not retry in a loop. Never infer a crash from silence. The
only derived statement is that a run's own declared report deadline passed.

## Hard rules

- Never record state, verdict, review, decision, change reference, version,
  lease, or authority in activity.
- Never hand-edit or rewrite the log.
- Never substitute `stop` for `task.handoff`.
- Never use activity to decide completion.
- Never treat `start` as proof that a role or model ran; only a verified host
  receipt can establish that.

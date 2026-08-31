---
name: kai-core-work-activity
description: "Defines fine-grained agent activity signals. Use when agents need append-only start, progress, stop, deadline, and silence reporting in .kai/activity.jsonl."
tools: [execute, read, search]
requires_tools: [execute]
---

# Work Activity

`kai-core-work-coordination` records what a piece of work **is**. This records what an
agent **is doing right now**. Both are needed, and they must never be the same
file.

The coordination item is a compare-and-swap surface: every write increments
`version` and is verified against a lease token. That protocol is what makes
parallel ownership safe, and it is exactly why a heartbeat cannot live there —
a frequent write would inflate the field that detects racing, and a
read-modify-write would be the lost-update pattern the append-only design
avoids.

| | Item record | Activity log |
|---|---|---|
| Path | `kai/coordination/items/<id>.md` | `.kai/activity.jsonl` (gitignored) |
| Shape | compare-and-swap, versioned | append-only, one line per record |
| Carries | state, ownership, reviews, verdicts | who, which item, when they report next |
| Changes | ~10x per item, across days | ~2x per agent run |
| Committed | yes, authoritative | no, ephemeral |

**If you are about to record a state, a verdict, a review, or a decision, you
are in the wrong file.** The writer rejects those fields rather than trusting
this paragraph.

## What it buys

Between two item updates, a supervisor can only say `UNKNOWN` — the item has
not moved, and silence is indistinguishable from progress. This log narrows
that, and gives agents something they never had: **a live view of their peers**
before they claim work.

- Who else is in flight right now, and on which item.
- Whether the peer you are about to ask is mid-run.
- Whether a run has gone silent past the deadline it set for itself.

## When to append

Two appends per run is the target. If reporting feels like bookkeeping you will
drift from it, and a log that is drifted from is worse than no log — it reports
confidence it has not earned.

1. **`start`** — immediately after claiming an item and before doing work.
2. **`progress`** — only when crossing a phase that changes your own estimate
   (finished research, started implementation, began a long-running build).
   Optional. Never per file or per tool call.
3. **`stop`** — before your final handoff, always, including when you stop
   blocked or abandon the run.

Every `start` and `progress` declares `--for`, the window after which your
silence is *checkable*. Set it to the honest upper bound of the next phase, not
to the whole run. If you will exceed it, append a `progress` with a new window.

## The commands

`<kai-plugin>` is the plugin install directory; `<root>` is the workspace root
resolved per `kai-core-workspace-conventions`.

```bash
# once per run, at the top
RUN=$(node <kai-plugin>/scripts/activity.mjs new-run)

node <kai-plugin>/scripts/activity.mjs start \
  --root <root> --role principal-swe-backend --item export-audit \
  --run "$RUN" --for 45m

node <kai-plugin>/scripts/activity.mjs progress \
  --root <root> --role principal-swe-backend --run "$RUN" \
  --for 30m --note "implementation underway"

node <kai-plugin>/scripts/activity.mjs stop \
  --root <root> --role principal-swe-backend --run "$RUN" --outcome handoff

# who else is live
node <kai-plugin>/scripts/activity.mjs show --root <root>
```

| Field | Meaning |
|---|---|
| `--role` | your kebab-case role id, never a person |
| `--item` | the coordination item this run serves, when there is one |
| `--run` | one opaque id per run, pairing your `start` with your `stop` |
| `--for` | `30m`, `2h`, `90s` — when you will report next |
| `--outcome` | `handoff`, `done`, `blocked`, `abandoned` (stop only) |
| `--note` | one short line, bounded to 120 chars, paths rejected |

## Failure is not your problem

The writer never throws and never blocks work. A rejected or failed append is
reported and dropped; it does not fail the task. **Never** retry an append in a
loop, never gate work on the log, and never treat a missing log as an error.

## Honesty

Every record is tiered `declared`, matching `work-status`. This is
self-reported: an agent that crashes never writes its `stop`, and an agent that
forgets never writes at all.

So this log **does not** claim to detect a crash. What it makes checkable is
narrower and true:

> the run declared it would report by `T`, and `T` has passed

That is a `derived` finding — the agent's own commitment measured against a
clock — and it is the strongest claim available without an external observer.
Attributing silence to a crash requires the host, not this file.

## Hard rules

- **Never** record `state`, `resume_state`, `verdict`, `review`, `change_ref`,
  `version`, `lease`, or `decision`. The writer rejects them.
- **Never** put a filesystem path, a username, a command, a prompt, or a diff in
  `--note`. It is one short line about *what phase you are in*, nothing else.
- **Never** hand-edit `.kai/activity.jsonl`, and never rewrite it. Append only.
- **Never** substitute an activity append for a coordination update. A HANDOFF
  is still a HANDOFF; `stop` does not hand anything off.
- **Never** read this log to decide whether work is complete. It reports
  activity; the item reports truth.

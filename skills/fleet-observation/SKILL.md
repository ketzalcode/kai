---
name: fleet-observation
description: "How to turn on, launch, and read kai's live view of its own subagents. Owns the operator path for the observer: locating the script inside the plugin's install directory so nobody has to clone the repository, granting consent, launching the ambient watcher in its own terminal, and interpreting a participation sequence — including the gaps, where a role that should have taken part never appears. Deliberately does not treat the observer as a running service, because the host spawns it per event, and never presents a start without a stop as proof that a process is alive."
tools: [bash, view, grep, glob]
requires_tools: [bash]
user-invocable: true
---

# Fleet Observation

`work-activity` records what an agent **declared** it was doing.
`work-status` reports what **needs a human**. This is the third thing:
participation — which roles took part, in what order, and with what evidence
behind each claim.

The watcher reads **both** logs and shows them side by side:
`.kai/observed.jsonl`, written by the host, and `.kai/activity.jsonl`, written
by agents about themselves. Each row is labelled `seen` or `said`. They are
merged for display and never reconciled, because they answer different
questions and neither is complete.

Note the word *participation*, not *what happened*. A `seen` row is the host
reporting that it ran something. A `said` row is an agent's own account,
written before it knew the outcome. Neither is a transcript, and neither
proves the work was any good.

## What the observed log cannot tell you

Read this before you report that a role never took part.

**The host emits no lifecycle events for plugin-provided agents.** Every kai
persona is delegated as `kai:<name>`, and delegations of that kind produce
nothing in `observed.jsonl` — not a start, not a stop. This is measured, not
suspected: an identical A/B in one session produced 4 events for a built-in
`explore` and 0 for `kai:principal-swe-backend`.

So for kai's own roles, absence from the observed log is the **guaranteed**
outcome and carries no information whatsoever. Never write "did not run",
"was skipped", or "never showed up" on that basis. The watcher labels these
roles `self-reported only, the host does not observe them`; use that language.

Two narrower limits also apply, to built-in agents: `general-purpose` emits no
events either, and a role invoked some other way — by the user directly, or by
a tool the host does not instrument — leaves no record.

What remains true is the positive claim. A record in the observed log is solid
evidence that the host ran that agent. Absence is evidence of nothing.

**Counts can be very slightly high.** The host occasionally delivers one event
twice. The watcher collapses a repeat only when it can defend the call: within
a second when the record carries a run or agent id, and only at an *identical*
timestamp when it carries neither. A `start` carries no id at all, so two real
agents launched a second apart are indistinguishable from one event delivered
twice — and deleting an agent that ran is worse than counting one twice. Some
duplicate starts therefore survive on purpose. This is a heuristic, not a
proof; describe it that way.

## The two things people confuse

**The observer is not a service.** The host spawns
`scripts/observe-subagent.mjs` for roughly 66 ms when a subagent starts and
again when it stops, and it exits. There is nothing to start, nothing to keep
alive, and nothing to restart if it "stops".

**The watcher is a service.** `scripts/observe-watch.mjs` is a long-running
process that reads the log and renders it. It is the only thing that belongs in
its own terminal.

```
  HOST                          FILE                   WATCHER
  ----                          ----                   -------
  subagentStart --> spawn 66ms
                    (exits)  \
                              -> .kai/observed.jsonl -> renders, runs until quit
  subagentStop  --> spawn 66ms
                    (exits)  /
```

If someone asks you to "start the observer", they mean the watcher.

## Finding the scripts without a clone

kai ships as a plugin, and a plugin install is a full repository checkout, so
`scripts/` is always present. It is just not in the user's project.

Look in this order and use the first hit:

1. `./scripts/observe-watch.mjs` — the user is working inside the kai repo.
2. `$COPILOT_HOME/installed-plugins/**/scripts/observe-watch.mjs`, falling back
   to `~/.copilot/installed-plugins/**/` when `COPILOT_HOME` is unset. The
   directory is named after the source, for example `_direct/RubenSaucedo--kai`.

Search for the file rather than hardcoding the directory name: it changes with
the install source, and a marketplace install will not look like a direct one.
Never ask the user to clone the repository, and never install anything.

## Turning it on

Three steps, in this order. Skipping the second is the most common failure.

1. **Consent.** `node <plugin>/scripts/observe-subagent.mjs --enable`, or simply
   create `.kai/observer-consent` in the workspace — the marker *is* the
   consent, and the script only exists to explain itself. Add `--with-summary`
   only if the user asks; see the warning below.
2. **Restart the session.** Hook configuration is read at session start. A
   session already running will never fire the hook, no matter what you enable.
   Say this explicitly; do not let the user conclude it is broken.
3. **Run any subagent.** `general-purpose` emits no events, so pick another
   type when demonstrating.

To stop recording, delete the marker. Nothing else in kai depends on it.

## Launching the watcher

Start it **detached, in its own terminal**, never in the foreground of the
session you are working in — it does not exit, so it would block the very
conversation the user is trying to observe.

Prefer the platform's terminal launcher, and always pass `--root` so the
watcher is bound to the intended workspace rather than wherever the terminal
opens.

Windows — quote the inner paths with **single** quotes. `Start-Process` does not
re-quote its `-ArgumentList`, so double quotes are stripped before PowerShell
sees them and any path containing a space silently splits into two arguments:

```powershell
$cmd = "& node '<plugin>\scripts\observe-watch.mjs' --root '<workspace>'"
Start-Process powershell -ArgumentList '-NoExit','-NoProfile','-Command',$cmd
```

`-NoExit` is what keeps the window open; without it the terminal closes the
moment you stop the watcher. Swap `powershell` for `wt` only if you have
verified Windows Terminal is installed — `Start-Process wt` fails outright when
it is not, so `powershell` is the safe default rather than the fallback.

macOS/Linux — launch a new terminal window running
`node <plugin>/scripts/observe-watch.mjs --root <workspace>`, or, when no
terminal is available, background it with output redirected to a log and read
that instead.

Modes:

- default — the ambient view: roles with an unmatched start, how long ago that
  start was recorded, and roles that have finished. An unmatched start means the
  log records no stop; it is not a claim that a process is alive.
- `--feed` — one line per event, for piping, logging, or a narrow pane.
- `--scene` — force the ambient view even when stdout is not a TTY.
- `--once` — render a single frame and exit. Use this when a user wants a
  snapshot in the conversation rather than a second window.

The watcher is strictly read-only. Never write to `observed.jsonl` from
anywhere except the hook: a second writer would break the append-only integrity
that keeps concurrent subagents safe.

## Reading a participation sequence

Read the order, then read the absences. The absences are where the finding
usually is — **but only in the declared log.** Re-read "What the observed log
cannot tell you" first. For kai's own roles, an absence in the observed tier is
guaranteed and means nothing, so every question below is answered from
`.kai/activity.jsonl` rows (`said`), not from `seen` rows.

Ask, in this order:

1. **Who acted first?** An implementation role recorded before any research or
   design role often means the work started before it was understood.
2. **Which role is missing that the work implied?** UI work with no design or
   QA role. A schema change with no security or data role. A customer-facing
   change with no writer.
3. **Is there any record of independent assessment?** Work showing only the
   author's own role has none — in the log.
4. **Did the same role run repeatedly?** Often a sign of retrying rather than
   escalating.

Every one of those is a question about the **log**, not about the work. Phrase
findings that way and the distinction survives; phrase them as facts about the
team and it does not:

| Say this | Never this |
| --- | --- |
| "No reviewing role was recorded." | "It was never reviewed." |
| "No design role appears for this UI work." | "Design was skipped." |
| "`principal-security` has no record here." | "Security never showed up." |

The gap is real and common: an agent that ran but never called
`activity.mjs` — or that crashed before its stop — leaves the same trace as one
that never ran. A missing role is a prompt to go and check, not a finding to
report.

Deliver this as coaching, not verdicts. The log shows participation; it does not
show whether consulting someone would have helped. Say what was recorded, then
what it suggests, and let the user decide.

## What you must not claim

- **A start without a stop is not proof of life.** It means a start was recorded
  and a stop was not. A killed process leaves exactly that trace. The watcher
  ages long-open entries for this reason; describe them as silent, never as
  running.
- **Pairing can be a guess — in the observed tier only.** `subagentStart`
  carries no agent id, so a start and a stop are matched by session and role in
  arrival order. When two subagents of one role overlap, the pairing is
  ordering, not identity. The watcher labels this; repeat the label rather than
  smoothing it over. Declared rows carry a run id and pair exactly, so an
  overlap there is not ambiguous.
- **The log is not a transcript.** It carries who and when. Summaries are stored
  only when explicitly opted in, and even then only one derived line.
- **Absence of a record is not absence of work.** This is the one to get right.
  Every kai persona is invisible to the observed tier by construction, plus
  `general-purpose` emits no events, plus work done by the main session is
  deliberately not recorded. Say "not observed", never "did not happen".
- **`said` is a claim, not a measurement.** A declared row is an agent's own
  account of itself, written before the outcome was known. It is the only
  evidence available for kai's roles, which makes labelling it honestly more
  important, not less. An agent that crashes never writes its stop, so an open
  declared run means silence, not failure.

## Summaries carry real risk

`--with-summary` stores a line scraped from prose a subagent wrote for its
parent. Unlike a declared note, the agent had no idea it would be logged and no
chance to redact. Absolute paths are refused and the line is capped, but it is
**not secret-scrubbed** — a token or an address in that first line is stored
verbatim.

Do not enable it silently. Offer it, state that limit plainly, and leave it off
by default. Participation alone answers the question this skill exists for.

---
name: fleet-observation
description: "How to turn on, launch, and read kai's live view of its own subagents. Owns the operator path for the observer: locating the script inside the plugin's install directory so nobody has to clone the repository, granting consent, launching the ambient watcher in its own terminal, and interpreting a participation sequence — including the gaps, where a role that should have taken part never appears. Deliberately does not treat the observer as a running service, because the host spawns it per event, and never presents a start without a stop as proof that a process is alive."
tools: [bash, view, grep, glob]
requires_tools: [bash]
user-invocable: true
---

# Fleet Observation

`work-activity` records what an agent **declared** it was doing.
`work-status` reports what **needs a human**. This is the third thing: what
actually **happened**, in order, including who never showed up.

That last part is the whole point. A role that was never consulted writes no
record anywhere — no declared log can surface an absence. The observed log can,
because it lists every role that emitted lifecycle events.

Two structural limits bound that claim, and you must state them whenever you
report an absence: `general-purpose` subagents emit no events at all, so they
are invisible here, and a role invoked some other way — by the user directly, or
by a tool the host does not instrument — leaves no record either. "Never
appeared in the log" is therefore evidence of an absence, not proof of one.

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
usually is.

Ask, in this order:

1. **Who acted first?** An implementation role before any research or design
   role often means the work started before it was understood.
2. **Which role is missing that the work implied?** UI work with no design or
   QA role. A schema change with no security or data role. A customer-facing
   change with no writer.
3. **Did assessment happen at all?** Work that shows only the author's own role
   was never independently reviewed.
4. **Did the same role run repeatedly?** Often a sign of retrying rather than
   escalating.

Deliver this as coaching, not verdicts. The log shows participation; it does not
show whether consulting someone would have helped. Say what was observed, then
what it suggests, and let the user decide.

## What you must not claim

- **A start without a stop is not proof of life.** It means a start was recorded
  and a stop was not. A killed process leaves exactly that trace. The watcher
  ages long-open entries for this reason; describe them as silent, never as
  running.
- **Pairing can be a guess.** `subagentStart` carries no agent id, so a start
  and a stop are matched by session and role in arrival order. When two
  subagents of one role overlap, the pairing is ordering, not identity. The
  watcher labels this; repeat the label rather than smoothing it over.
- **The log is not a transcript.** It carries who and when. Summaries are stored
  only when explicitly opted in, and even then only one derived line.
- **Absence of a record is not absence of work.** `general-purpose` subagents
  emit no events, and work done by the main session is deliberately not
  recorded.

## Summaries carry real risk

`--with-summary` stores a line scraped from prose a subagent wrote for its
parent. Unlike a declared note, the agent had no idea it would be logged and no
chance to redact. Absolute paths are refused and the line is capped, but it is
**not secret-scrubbed** — a token or an address in that first line is stored
verbatim.

Do not enable it silently. Offer it, state that limit plainly, and leave it off
by default. Participation alone answers the question this skill exists for.

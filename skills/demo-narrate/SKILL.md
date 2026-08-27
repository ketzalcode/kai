---
name: demo-narrate
description: "Measured narration method for demos. Use after capture when writing, synthesizing, timing, and fitting spoken lines to visible states in the recording."
tools: [bash, shell, view, edit, create, grep, glob]
requires_tools: [bash, shell]
user-invocable: true
---

# Demo Narration

`demo-capture` records what happened and when. `demo-zoom` renders the camera
move. This adds the voice — and it is the part with the most ways to quietly
produce something false.

Use it after a take is compiled and rendered, never before.

## Two measurements, taken by different tools

Only two numbers matter, and neither of them is yours to write:

| Number | Measured by | Known |
| --- | --- | --- |
| how long a line takes to say | the synthesiser | before capture |
| when a state actually appears | the recorder | after capture |

Everything this skill refuses follows from that table. A narration beat carries
no `start`, `end`, `seconds`, `duration`, or `offset`; the parser rejects a
screenplay that declares one, in the same words it rejects a step that tries to
declare a source second.

## Why narration is not one line per step

The obvious design keys a line to a step and lets the line's length set the
step's dwell. It was proposed here and rejected:

> A 0.3-second click is not a nine-second visual scene.

Keying one to the other manufactures long inert holds and makes a demo feel
robotic. And knowing a clip's duration up front still does not tell you when the
line should start, because that depends on when the interface reached the state
being described — which nothing knows until the take exists.

So a beat spans the visual states it describes:

```json
"narration": [
  { "id": "n-1",
    "text": "Work starts as an issue.",
    "visual_span": { "from_step": "open-issues", "through_step": "new-issue" },
    "start_after": "open-issues" }
]
```

- `visual_span` — the states this line is about. `through_step` defaults to
  `from_step`.
- `start_after` — optional, and the whole defence against narration claiming an
  outcome before the viewer can see it. The line may not begin until that step
  is **over**, because that is when its result is on screen. It must name a step
  inside the span and **before** its last step: waiting for the step your span
  ends on leaves nowhere to speak, and no clip is short enough to fix that.

Beats live **inside `demo_screenplay.json`**, beside the actions. Same story,
same author, same sitting, one thing to review.

**Resolving the script path.** Resolve `<kai-personal-plugin>` from this loaded
skill's base directory: start at
`<kai-personal-plugin>/skills/demo-narrate/` and go up two directories. Invoke
the absolute `<kai-personal-plugin>/scripts/demo-narrate.mjs`; do not assume the
user's current directory is a plugin checkout.

## The workflow

### 1. Estimate before spending anything

```bash
node <kai-personal-plugin>/scripts/demo-narrate.mjs --estimate demo_screenplay.json
```

Characters and a projected length at 130 wpm. It makes no paid call, and every
number it prints is labelled an estimate. Use it to see the size of a run before
authorising one.

### 2. Synthesise, once per line

```bash
node <kai-personal-plugin>/scripts/demo-narrate.mjs --synthesize demo_screenplay.json --out clips/ --voice en-US-AvaMultilingualNeural
```

Writes `clips/demo_narration_take.json` — the measured, paid output. It is a
**separate file** from the screenplay on purpose: narration is regenerated per
language and per voice while the automation stays fixed, so a provider's answer
must never overwrite authored intent.

A line that fails to synthesise is recorded as a **failed clip**, not retried.
A retry of a paid request nobody asked for is a charge nobody agreed to, and a
partial take has to be visibly partial.

**An unconfigured machine stops the run at the first beat**, rather than
recording the same failure once per line. Every remaining beat would fail
identically, and nothing has been billed, so there is nothing to preserve by
continuing. This is distinct from a call that was attempted and failed, which is
recorded and the run continues — that one may be transient. `lectoria speak`
reports the difference as a machine-readable reason, so kai does not have to
guess it from prose.

**A result that is not a measurement is refused.** `lectoria` reports a
projection under `estimatedDurationSec` and a measured duration under
`durationSec`, precisely so the two cannot be mistaken for one another. kai
checks that at the seam rather than trusting it: once an estimate has been
placed, it is indistinguishable from a measurement, and the whole point of this
tool is that it never is.

`lectoria` is an optional external tool, discovered at run time exactly like
`ffmpeg`. It is resolved in a fixed order — `LECTORIA_BIN`, then this plugin's
`node_modules/.bin/lectoria` (where the pinned git dependency lands), then a
global install on PATH — and the pinned copy wins over a stray global, so a demo
is narrated by the version this plugin pins. If it is absent the tool says which
places it looked and narration is unavailable; it does not degrade into
something silent that looks like it worked.

Copilot installs kai-personal's files but does not run npm. Before synthesis,
run `npm ci --prefix "<kai-personal-plugin>"`; rerun it after a plugin update
whenever the local executable is absent. Estimation, placement, and mixing do
not need Lectoria.

Synthesis needs Azure Speech configured in the environment lectoria reads:
`AZURE_SPEECH_REGION`, plus either `AZURE_SPEECH_KEY` or
`AZURE_SPEECH_RESOURCE_ID` with `az login`. Note that a **rejected key surfaces
as a WebSocket close 1006, "Unable to contact server", not a 401** — taken at
face value it sends you to debug the network when the key is wrong or belongs to
another region.

### 3. Place it against the recording

```bash
node <kai-personal-plugin>/scripts/demo-narrate.mjs --place demo_screenplay.json demo_take.json demo_narration_take.json --out demo_narration_plan.json
```

Each beat starts at the later of its earliest honest position and the moment the
previous line stopped speaking. A line that had to wait reports how far it
drifted, so you can see narration pulling away from the action before it becomes
a rejection.

### 4. Mix onto the finished render

```bash
node <kai-personal-plugin>/scripts/demo-narrate.mjs --mix demo_narration_plan.json --video demo-focused.mp4 --out narrated.mp4
```

Prints the ffmpeg command. The video is **copied, not re-encoded**, so
re-narrating in another language cannot change a single frame of what was
recorded.

## When speech and action disagree

A nine-second line over a 0.3-second click is a **script defect**, not an editing
problem. In order of preference: rewrite the line; let it span setup, action and
result; split it across states; re-record with a real hold on a stable result.

The rejection computes which of those applies. If a later state is still on
screen when the line ends, it names that step — the *smallest* span that would
work, so you do not widen it further than the line deserves. If none is, it says
so and tells you roughly how many words to cut.

**This tool will not** slow cursor motion or typing to fit prose, freeze while
the app is supposedly responding, stretch a loading state, or let narration
claim an outcome before it is visible. A freeze-frame that conceals latency is a
lie about how fast the product is.

## What is refused outright

| Rejection | Why |
| --- | --- |
| `step-failed`, `step-unsettled` | narrating over a step the driver recorded as broken sells a defect as a feature; `unsettled` means it never saw the screen stop changing, so it cannot say the state was reached |
| `no-clip` | a partial synthesis, rendered as a silent gap, looks like a finished demo |
| `clip-failed` | a failed clip is not silence |
| `stale-text` | the line was edited after synthesis, so the clip would still play the old words and nothing in the file would show it |
| `unrecorded-step` | the screenplay and the take are not from the same demo |
| `overruns-span` | measured speech does not fit the measured states it describes |

> Reject the narrated composition when measured speech cannot be aligned with
> measured valid visual states without materially falsifying either one.

## Not built, deliberately

Word-level action scheduling, automatic script rewriting, arbitrary
time-stretching, SSML choreography, beat-synchronised cuts, and **background
music**. Music brings licensing, looping, ducking, loudness and taste problems
while *reducing* speech intelligibility, and none of it can be judged until
narration and cursor are known good.

## Sound-off is the default, not the exception

LinkedIn autoplays muted and X often does. Narration is therefore a **second**
channel, not the primary one: a demo that only works with sound on does not work.
Captions are tracked separately and are not optional for anything posted to a
feed.

---
name: demo-narrate
description: "How to narrate a screen demo without lying about it: author narration as beats that span visual states rather than lines bolted to steps, synthesise each line once and measure it, then place measured speech against the measured recording — or refuse, naming the line, the overrun, and the smallest fix. Owns the narration half of the demo seam. Never stretches time, freezes a frame to cover latency, or lets a line claim an outcome before it is visible."
tools: [bash, view, edit, create, grep, glob]
requires_tools: [bash]
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

## The workflow

### 1. Estimate before spending anything

```bash
node scripts/demo-narrate.mjs --estimate demo_screenplay.json
```

Characters and a projected length at 130 wpm. It makes no paid call, and every
number it prints is labelled an estimate. Use it to see the size of a run before
authorising one.

### 2. Synthesise, once per line

```bash
node scripts/demo-narrate.mjs --synthesize demo_screenplay.json --out clips/ --voice en-US-AvaMultilingualNeural
```

Writes `clips/demo_narration_take.json` — the measured, paid output. It is a
**separate file** from the screenplay on purpose: narration is regenerated per
language and per voice while the automation stays fixed, so a provider's answer
must never overwrite authored intent.

A line that fails to synthesise is recorded as a **failed clip**, not retried.
A retry of a paid request nobody asked for is a charge nobody agreed to, and a
partial take has to be visibly partial.

`lectoria` is an optional external tool, discovered at run time exactly like
`ffmpeg`. If it is absent the tool says so and narration is unavailable; it does
not degrade into something silent that looks like it worked.

### 3. Place it against the recording

```bash
node scripts/demo-narrate.mjs --place demo_screenplay.json demo_take.json demo_narration_take.json --out demo_narration_plan.json
```

Each beat starts at the later of its earliest honest position and the moment the
previous line stopped speaking. A line that had to wait reports how far it
drifted, so you can see narration pulling away from the action before it becomes
a rejection.

### 4. Mix onto the finished render

```bash
node scripts/demo-narrate.mjs --mix demo_narration_plan.json --video demo-focused.mp4 --out narrated.mp4
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

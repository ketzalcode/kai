---
name: demo-capture
description: "How to record a screen demo that knows what it did: drive a declared screenplay, verify the environment before spending a take, and write down the second each action really happened and the rectangle it really acted on. Owns the capture half of the demo seam and the take manifest that makes a focus plan derivable instead of remembered. Records only a real run, refuses a contaminated or black take rather than planning around it, and never decides what matters — that is direction."
tools: [bash, shell, view, edit, create, grep, glob]
requires_tools: [bash, shell]
user-invocable: true
---

# Demo Capture

`video-direction` decides what a demo should show. `demo-zoom` renders the
finished camera move. This is the middle: it turns a screenplay into an actual
recording, and — the part that matters — it writes down what happened while it
was recording.

Use it before `demo-zoom`, for any demo of a real interface.

## Why the manifest is the point

A recorder alone does not solve anything. Without it you still end up watching
your own footage, guessing that the click was "around eight seconds", and typing
that guess into a focus plan. The guess renders exactly as cleanly as a
measurement, so nothing downstream can tell them apart.

Two failures follow directly, and both have actually happened here:

- A segment placed at 8.6s for a click that landed at 8.0s. By the time the
  camera arrived the page had navigated, and the shot framed an empty panel.
- A zoom aimed at the centre of a text field. Typing starts at the field's left
  edge, so at 2.2x the text was outside the crop.

Neither is a bug in the renderer. Both are what happens when the numbers come
from memory instead of from the take. So the driver records, per step, the
measured start and end in source seconds and the rectangle it actually used, and
`demo-zoom --compile` derives the plan from that.

## The three artifacts

| Artifact | Written by | Lives for |
| --- | --- | --- |
| `demo_screenplay.json` | `creative-video-director` | every take of this demo |
| `demo_targets.json` | whoever can see the screen, during preflight | this layout |
| `demo_take.json` | the driver | exactly one recording |

A compiled focus plan is derived from the last two and is disposable. **Do not
try to reuse a focus plan across recordings.** Re-record, re-compile; the
screenplay is what stays.

## The workflow

### 1. Read the screenplay

```bash
node scripts/demo-capture.mjs --screenplay demo_screenplay.json --check
```

It lists the steps, the capture region, an estimated duration, and any semantic
target that has no rectangle yet. A screenplay declares intent only: steps, the
exact text to type, semantic targets, and which moments deserve emphasis. A
screenplay that tries to declare a source second or a frame coordinate is
refused, because direction cannot know either.

### 2. Set the stage, then prove it

Put the application where the screenplay says, at the declared size, and reset
it to a known state. Then take one frame and **look at it**:

```bash
ffmpeg -y -f gdigrab -video_size 1256x784 -offset_x 0 -offset_y 0 -i desktop -frames:v 1 preflight.png
```

Check, in this order:

1. **It is not black.** Chromium and Edge composite on the GPU, so
   `gdigrab -i title=<window>` captures a **uniformly black frame** while
   appearing to work. Relaunch the browser with `--disable-gpu` and capture a
   desktop **region** instead of a window title. The driver refuses to record a
   black frame, but knowing why saves the trip.
2. **The region holds only what you meant to publish.** A desktop region catches
   whatever else is on that part of the screen. Trim it until the edges are
   clean. A recording gets published; treat the frame as public.
3. **The app is in the declared starting state.** Web apps restore saved drafts,
   sessions persist, and a rehearsal leaves fingerprints. A take contaminated
   this way looks fine until someone reads the frames.

### 3. Resolve the targets

Read the rectangles for the screenplay's semantic targets off the preflight
frame, in **capture-region pixels**, and write them down:

```json
{
  "issues-tab": [80, 136, 150, 162],
  "title-input": [78, 254, 940, 282]
}
```

Give the whole element. The compiler decides which part of it to frame from the
step's anchor — that is what lets `leading` follow typing.

### 4. Emit the driver, and read it

```bash
node scripts/demo-capture.mjs --screenplay demo_screenplay.json \
  --targets demo_targets.json --emit-driver run-take.ps1 \
  --recording raw.mp4 --take demo_take.json
```

It is written out, never run for you. It clicks and types into a live desktop,
so read it first. Windows/PowerShell is the only host it emits today; say so
plainly rather than implying it works everywhere.

### 5. Take it

Run the driver, and do not touch the machine while it does. It runs preflight,
starts the recorder, pins the recording clock against ffmpeg's own progress
output, executes the steps, and writes `demo_take.json`.

The recorder stops itself at a fixed duration. Never kill it mid-write.

### 6. Compile, render, look

```bash
node scripts/demo-zoom.mjs --compile demo_screenplay.json demo_take.json --out plan.json
node scripts/demo-zoom.mjs --plan plan.json
node scripts/demo-zoom.mjs --plan plan.json --review --out sheet.png
```

Then open the sheet. See `demo-zoom` for what to look for.

## The pointer is measured, not imagined

The finished video shows a **drawn** cursor, not the operating system's. The
capture runs with `-draw_mouse 0` and the driver records where the pointer
actually was, sample by sample, on the same clock as everything else.

This distinction is not cosmetic. A step's rectangle is *intended* geometry: it
says where we meant to click, not the path taken, how long the pointer hovered,
or when the button went down. Drawing an arrow along a path inferred from
rectangles would invent the one thing the recording exists to establish. So:

- the driver **glides the real pointer** rather than teleporting it, which means
  the hover states the application shows are the ones the viewer will see;
- movement is **linear in time**, because the renderer interpolates linearly
  between samples — an eased glide would look nicer and would make two recorded
  endpoints a lie about the path in between;
- the pointer is marked **hidden while typing**, since it is parked and
  irrelevant then, and the arrow would otherwise sit on top of the text the shot
  exists to show;
- a take with **no** telemetry produces **no** cursor. It is never reconstructed.

Interactions the driver cannot measure — drag, scroll, hover-triggered menus,
cursor shape changes — are out of scope, and are rejected rather than
approximated. This draws a cursor from measurements; it is not a compositor.

## Reject a take rather than plan around it

A take is spent, not precious. Re-record when:

- the driver reports a step as `failed`
- the app was in the wrong state when the recording started
- something unintended appears in the frame
- the recording clock's reported spread is large enough to matter at your zoom
- the pointer track is missing or truncated and the demo depends on showing it

Compiling around a bad take produces a demo that is confidently wrong, which is
worse than one that is obviously unfinished.

## What this must not claim

- Do not call a demo "automated end to end". A person set the stage, resolved
  the targets, and judged the result.
- Do not present the measured timings as proof the feature works. They are proof
  of when the driver acted, nothing more.
- Do not describe the emitted driver as safe to run unattended on a shared
  machine. It types into whatever has focus.
- Do not imply capture works on hosts it has not been run on. It has been
  measured on Windows with `gdigrab`.

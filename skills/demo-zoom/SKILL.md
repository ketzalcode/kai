---
name: demo-zoom
description: "How to turn a flat product or terminal recording into a focused demo by declaring what the viewer should look at and when, then rendering that declaration with ffmpeg. Owns the render half of the demo seam: reading focus coordinates off a ruled frame, authoring and validating a focus plan, checking it in plain numbers before committing to an encode, and producing a single continuous zoom pass with no seams. Directs nothing and invents nothing: it renders only what a plan declares, over footage of a real run, and refuses a plan it cannot honour rather than guessing."
tools: [bash, view, edit, create, grep, glob]
requires_tools: [bash]
user-invocable: true
---

# Demo Zoom

`video-direction` produces the plan for a video and deliberately never renders.
This is the other side of that seam: it renders one specific thing, a demo whose
camera moves to whatever the director said matters.

Use it when a recording is technically correct and practically unwatchable —
the terminal or the app is captured at full size, and the thing being
demonstrated occupies a small part of the frame.

## What it does not do

It does not follow the caret, the cursor, or "activity". Nothing here inspects
pixels to decide what is interesting. Commercial recorders can chase a mouse
because a mouse reports its position; a terminal caret does not, and inferring
it from pixels fails by zooming confidently onto the wrong thing. So the focus
is **declared**, which makes it reviewable before it is rendered.

It also does not make a demo truthful. Zoom magnifies whatever was recorded,
including a mistake.

## The tool

`scripts/demo-zoom.mjs`. Look in this order and use the first hit:

1. `./scripts/demo-zoom.mjs` — the user is working inside the kai repo.
2. `$COPILOT_HOME/installed-plugins/**/scripts/demo-zoom.mjs`, falling back to
   `~/.copilot/installed-plugins/**/` when `COPILOT_HOME` is unset.

Search for the file rather than hardcoding the directory name; it changes with
the install source.

It needs **ffmpeg on PATH**, and nothing else. No npm install, no Go toolchain,
no browser. If ffmpeg is missing, say so and offer `--print`, which emits the
command for the user to run wherever ffmpeg does exist.

## The workflow

### 1. Record the real thing

Any recorder that produces a video file works. Record an actual run. Never
stage output that the command did not produce — a demo is a claim about
behaviour, and a fabricated frame makes it a false one.

### 2. Rule a frame to read coordinates off it

Focus points are fractions of the frame, and nobody can eyeball those from a
video player. Lift out a frame at a moment you care about:

```bash
node scripts/demo-zoom.mjs --grid recording.mp4 --at 3.5 --plan demo-plan.json --out grid.png
```

Cyan cells are `0.1` wide and tall; yellow lines mark `0.5`. Count from the top
left: a point five cells across and two down is `x: 0.5, y: 0.2`. View the PNG
and read the numbers off it. Repeat for each moment that needs its own shot.

Pass `--plan` once the plan exists, or `--size 1920x1080` before it does. This
matters: the render fits the source into the declared output size, letterboxing
or pillarboxing a source of a different shape, and the grid applies the same fit
so a coordinate counted here means the same thing at render time. Measured on a
640x480 source rendered into 1280x720, a point that sits at 0.70 of the source
appears at 0.65 of the fitted frame — the grid shows 0.65, and 0.65 is what the
render honours.

### 3. Write the plan

```bash
node scripts/demo-zoom.mjs --example > demo-plan.json
```

```json
{
  "source": "recording.mp4",
  "output": "demo-focused.mp4",
  "size": "1280x720",
  "fps": 30,
  "focus": [
    { "start": 2.0, "end": 7.5, "x": 0.30, "y": 0.22, "zoom": 2.2, "ease": 0.5,
      "label": "the command being typed" }
  ]
}
```

- `start` / `end` — seconds in the source.
- `x` / `y` — the point to aim at, as fractions. `0,0` is the top left. It is a
  target, not a promise: a point close to an edge cannot be brought to the
  centre without showing padding beyond the frame, so the shot stops at the
  edge and the point lands off-centre. At 2x, `0.95` can only reach `0.75`.
  `--explain` prints where each shot really lands.
- `size` — the output frame. The source is fitted into it, padded rather than
  stretched when the shapes differ.
- `fps` — the output rate. The source is forced to it before the zoom, so the
  timings above mean real seconds even when the recording runs at another rate
  or has a variable one, which screen recorders commonly produce.
- `zoom` — magnification. `1` is untouched. Past about `3` on a 720p source the
  text softens; record larger instead of zooming harder.
- `ease` — seconds spent moving in, and again moving out. It must fit twice
  inside the segment or the zoom would never reach its factor, and the tool
  refuses the plan rather than quietly under-zooming. `0` means a hard cut.
- `label` — for humans reading the plan and the `--explain` table.

Segments may not overlap, and where two of them touch, the earlier one has
already been released — two hard cuts meeting at the same instant do not add
their zoom together. The camera returns to the full frame between segments, so
the viewer keeps their bearings.

### 4. Read it back before rendering

```bash
node scripts/demo-zoom.mjs --plan demo-plan.json --explain
```

This prints every segment, where each shot actually lands once clamping is
applied, and the total time spent under zoom. When `ffprobe` is available it
also reports the source duration and names any segment that runs past the end
of the material. An encode takes minutes; this takes none.

### 5. Render

```bash
node scripts/demo-zoom.mjs --plan demo-plan.json
```

One continuous pass. Audio is re-encoded to AAC when the source has any, rather
than copied, because a stream copy fails outright when the source codec cannot
live in the output container.

## Reading a failure

The tool refuses a plan rather than rendering something misleading, and always
says which segment and why. The refusals worth knowing:

- **"the camera cannot be in two places at once"** — two segments overlap.
- **"does not fit twice inside"** — the ease is longer than half the segment.
- **"may not start with -"** — a path that ffmpeg would have read as an option.
- **"source and output must differ"** — the render would have destroyed the
  recording.
- **"past the ... this tool will hand to ffmpeg on one command line"** — the
  plan has so many segments that the filter expression would exceed what a
  command line can carry. Split the demo into shorter renders.

## What you must not claim

- Do not describe the output as "auto-zoomed" or "cursor-tracking". Every move
  in the video was written down by a person.
- Do not present a rendered demo as evidence that a feature works. It is
  evidence of what was recorded. The claim still needs its own grounding.
- Do not report a render as complete without the output file existing. Check it.
- Do not promise the motion is perfectly smooth. The zoom curve is continuous,
  and the crop is computed on a frame twice the output size so its smallest
  step is half an output pixel rather than a whole one — but that is
  arithmetic, not a measurement of how a slow pan looks. Watch it.

## Checking the tool itself

```bash
node scripts/demo-zoom.mjs --self-test   # the arithmetic; needs no ffmpeg
node scripts/demo-zoom.mjs --verify      # renders a marker and reads the pixel back
```

`--verify` is the one that matters: it renders a frame with a marker at a known
point, zooms onto that point, and reads the centre pixel back out. It does this
from a 30fps source, a 60fps source, and a variable-rate source, because the
filter's clock is derived from frame count and a source at another rate would
otherwise put a segment on the wrong seconds. It proves the render lands where
and when the plan said, rather than proving the code agrees with itself.

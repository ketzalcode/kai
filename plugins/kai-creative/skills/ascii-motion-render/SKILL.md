---
name: ascii-motion-render
description: "Use when an existing ASCII motion clip is requested as a web bundle or a looping image, or a rendered ASCII animation needs preview evidence before it is published."
user-invocable: true
---

# Render ASCII Motion

Preview, bundle, convert, or review an existing ASCII motion clip. This is not
sourcing, and it does not decide what the animation should show.

Two artifacts are co-primary. The web bundle carries character grids a host
page plays and switches between. The looping image embeds in a README, which
MP4 cannot do. Neither one substitutes for the other.

## Select one operation

| Requested operation | Inputs and stopping point |
| --- | --- |
| Explain readiness | A profile and a clip; report grid, fps, palette, frame count and which backends are present, then stop. |
| Preview a still | A clip and a moment; return one rendered frame for the spatial check. |
| Preview a sample | A clip and a short duration; return a one-to-two-second sample for the temporal check. |
| Build a web bundle | Clips that agree on grid, colour and fps; return the bundle, its clip files and the player asset. |
| Convert to a looping image | A clip, ffmpeg, a distinct output path and execution authority; report the real output and inspection status. |
| Review an artifact | An existing rendered artifact; produce the requested contact sheet, not a new encode. |

Two preview gates come before publication. The still gate catches spatial
problems: aspect distortion, unreadable glyph density, a subject lost in noise.
The sample gate catches temporal problems a still cannot show: shimmer between
frames, flicker on loop, and quantisation crawl. A still that looks right is
not evidence that the motion does.

Clips in one bundle share one grid, palette and fps. A disagreement is
rejected, not resized, because a mixed grid snaps visibly on switch. Colour
mode is part of that agreement: a colour clip and a mono clip in one bundle are
rejected for the same reason.

A colour clip renders as rectangle fills and no font is involved, so the
looping image and the browser agree by construction rather than by luck. The
cost is honest and worth reporting: a colour clip paints a canvas instead of
selectable text, so the copy-the-frame and screen-reader affordances a mono
clip has are gone. Say which one the artifact is.

A backend that can only export a finished file cannot supply the frames the web
bundle needs. Report that format as unsupported for that backend rather than
emitting an empty bundle.

## Provider and command reference

From the loaded skill's base directory, go up two directories to resolve the
kai-creative provider root, `<kai-creative-plugin>`. Never resolve commands
from cwd or use a search hit in other installed packs. The input and output
placeholders below are explicit independently resolved absolute paths.

```text
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --explain --profile "<profile>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --preview "<clip>" --at <seconds> --out "<png>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --sample "<clip>" --seconds 2 --out "<sample-gif>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --bundle "<clips.json>" --out "<bundle-dir>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --convert "<clip>" --format gif --out "<artifact>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --review "<artifact>" --out "<sheet>"
```

A clip already carries the grid, palette and fps it was sourced at, so the
render operations take their profile from the clip rather than a flag.

These are independent operations, not an instruction to run every command.
When ffmpeg is absent, `--convert "<clip>" --print` can prepare a command for a
compatible host. Report the missing tool and the unexecuted render explicitly;
do not install tools or evaluate printed stdout automatically. A printed
command is not a render.

## Output and authority

Load `kai-core-asset-producing` before writing an artifact into a shared
workspace, and load `kai-core-asset-closing` if the artifact is being closed
rather than iterated. When kai-core is unavailable, this single-shot rendering still
works and writes where the operator points; Kai coordination and `.kai` state
do not, so tell the operator to install or update `kai-core` before resuming
coordinated work.

Verify that a claimed output file exists. Rendering is not review, and review
is not publication; report creation and inspection status separately.

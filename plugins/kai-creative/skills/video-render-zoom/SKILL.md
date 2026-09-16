---
name: video-render-zoom
description: "Use when an explicit focus or zoom operation is requested for existing video footage, or an evidenced legibility problem needs a declared focus treatment."
user-invocable: true
---

# Render Video Focus

Explain, compile, render, or review declared focus. This is not automatic
activity tracking or cursor-tracking, and it does not decide the story.

Accept supplied external footage and a focus plan directly, without recapture
or a director run. A focus plan declares emphasis; inspected frames or measured
take evidence establish coordinates and times. Manually inspected frame
coordinates are legitimate measurements, not guesses from memory.

Already-readable footage needs no new zoom unless one was requested.
Missing media limits the operations that actually require it; do not turn a
direction-only or explain-only request into a production pipeline.

## Select one operation

| Requested operation | Inputs and stopping point |
| --- | --- |
| Explain readiness | A valid declared plan; explain arithmetic, easing, overlap, clamping and available duration facts, then stop. |
| Compile focus | Approved screenplay intent plus its matching measured take; return a derived focus plan and all compiler notes. |
| Inspect coordinates | Existing footage, a source moment, and output-fit geometry; return the requested grid frame. |
| Render | Actual source file, renderable plan, ffmpeg, distinct output and execution authority; report the real output and inspection status. |
| Review a render | Existing source and rendered files with focus segments; produce/inspect the requested contact sheet, not a new encode. |

An explain-only request ends at explanation. A contact sheet depends on an
existing render and is not a prerequisite for explanation or a reason to
render without authorization. An empty focus plan needs no invented zoom;
the helper cannot produce its focus contact sheet for zero segments.

Use ffmpeg for rendering/grid/sheet operations. ffprobe supplies measured
duration and audio facts. Missing probe evidence remains unknown even when
encoding is otherwise possible. A printed command is not a render.

## Provider and command reference

From the loaded skill's base directory, go up two directories to resolve the
kai-creative provider root, `<kai-creative-plugin>`. Never resolve commands
from cwd or use a search hit in other installed packs. The input and output
placeholders below are explicit independently resolved absolute paths.

```text
node "<kai-creative-plugin>/scripts/demo-zoom.mjs" --plan "<plan>" --explain
node "<kai-creative-plugin>/scripts/demo-zoom.mjs" --compile "<screenplay>" "<measured-take>" --out "<plan>"
node "<kai-creative-plugin>/scripts/demo-zoom.mjs" --grid "<recording>" --at "<source-seconds>" --plan "<plan>" --out "<grid>"
node "<kai-creative-plugin>/scripts/demo-zoom.mjs" --plan "<plan>"
node "<kai-creative-plugin>/scripts/demo-zoom.mjs" --plan "<plan>" --review --out "<sheet>"
```

These are independent operations, not an instruction to run every command.
When ffmpeg is absent, `--plan "<plan>" --print` can prepare a command for a
compatible host. Report the missing tool and unexecuted render explicitly;
do not install tools or evaluate printed stdout automatically.

## What the numbers and images establish

Coordinates in an inspected manual focus plan must refer to the fitted output
frame. Raw-source coordinates can move when aspect-ratio fitting adds padding.
Use the grid's matching output geometry when measuring a new plan.

Surface clamping, skipped segments, missing duration evidence and unsettled or
failed relevant steps. Read every compiler note. Compilation is arithmetic,
not a repaired take or proof that the intended UI state appeared.

The clamped camera center is not a promise that the requested point appears
at the center of the finished image. Inspect the actual render to judge crop,
legibility and timing. A review sheet supplies evidence for that judgment;
creating the sheet does not make the judgment.

No cursor overlay is invented from focus coordinates. Overlay movement needs
actual telemetry; any cursor already baked into supplied footage remains part
of its pixels. Do not infer new pointer paths, caret movement, or interesting
activity from the plan.

## Output and authority

Before shared workspace or asset rules, Load `kai-core-contract-v1`.
Without compatible core, bounded focus advice from supplied evidence may
continue, but not coordination or `.kai` state. Tell the operator to install
or update core before coordinated rendering resumes.
Load `kai-core-workspace-paths` before persistent output and Load
`kai-core-asset-producing` when retaining a durable plan or report. Keep raw
frames and renders in the private run lane.

Return the requested insights, plan, command, render, or review sheet and any
gaps. Check that a claimed output file exists and report actual inspection
and review status separately. A render can exist while visual review remains
pending. No automatic narration follows, and there is no capture step here.
Load `kai-core-asset-closing` when recording disposition or acceptance.
Stop at the requested operation; rendering is not publication or evidence that
the product works.

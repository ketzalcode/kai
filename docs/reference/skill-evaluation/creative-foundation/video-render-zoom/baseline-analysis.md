# Video render zoom baseline analysis

**Method folder:** `video-render-zoom`  
**Guide under baseline test:** preserved original `demo-zoom` from
`incubator\kai-creative\skills\demo-zoom\SKILL.md`  
**Guide identity:** SHA-256
`6c05d7bd85fb7f285db2311a798cb901d274e30c1c7e00e7b9670637247068eb`  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`

## Case and validation

The fixed case supplied existing external footage and a manually inspected,
declared focus plan. It requested readiness/explanation only, with no recapture,
narration, render, or automatic activity tracking.

Before actor calls, the actual pure `parsePlan` export accepted the plan as two
non-overlapping focus segments at 1280x720 and 30 fps. No footage, ffmpeg,
ffprobe, capture, or render operation ran.

Manual reading used four observable points:

1. accept an existing external recording and manual focus plan without forcing
   recapture;
2. describe explain-only review as structural/timing/easing/zoom/clamping
   analysis rather than a render;
3. preserve the visual-inspection limit and avoid claiming the chosen moments
   or framing are correct;
4. require no narration or automatic cursor/activity tracking.

## Observed outputs

| Arm | Met the four core points | Required recapture | Claimed automatic tracking |
| --- | ---: | ---: | ---: |
| Control | 5/5 | 0/5 | 0/5 |
| Current (`demo-zoom`) | 4/5 | 0/5 | 0/5 |

All five controls accepted the supplied manual plan and kept explanation
distinct from rendering and visual proof.

Four current-guide samples did the same while naming structural checks such as
overlap, easing, clamping, output geometry, and optional source-duration
limits. `current-02` incorrectly told the operator to inspect a contact sheet
before any render. A contact sheet depends on rendered footage, so that next
action contradicted the explain-only request and the guide's own workflow.

## Interpretation

This baseline is **nondiscriminating for the main operation boundary**: the
no-guide controls already preserved manual focus, existing footage, no
recapture, and no automatic tracking. It supports no efficacy claim for the
preserved guide.

It also records one actor-visible current-guide failure around workflow order.
A future candidate should retain the guide's more precise arithmetic limits
without demanding a post-render contact sheet during an explain-only request.

## Limits

- Ambient harness and core instructions remained a confound.
- The control arm omitted only the target guide; no stronger sandbox existed.
- The plan parser established schema/arithmetic validity only.
- No footage was inspected and no explain, ffprobe, ffmpeg, review-sheet, or
  render operation ran.
- These samples support only observed response behavior, not visual quality,
  host acceptance, or production efficacy.


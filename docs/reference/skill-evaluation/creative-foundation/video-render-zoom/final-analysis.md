# Video render zoom final analysis

**Candidate guide identity:** SHA-256
`386db33c1c12bc6afcd796a6b0763905b8f5b22d8bf6dde3d3444a70ad4bf1bb`  
**Candidate source revision:** `f0760ab74e1e187d6d7f91fdf4e0704c5f8754b6`  
**Source worktree HEAD at freeze:**
`eb3f5b5b70b67a3f37a31a7ff35fc28ebbce201d`  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`

## Baseline carried forward

The baseline was nondiscriminating on the main operation seam: all five
controls and four of five original-guide samples accepted the existing footage
and manual focus plan without recapture, narration, rendering, or automatic
tracking. `current-02` incorrectly required a contact sheet before a render
existed.

That baseline supports no efficacy claim.

## Candidate result

All five candidate samples:

1. accepted the existing footage and declared focus plan for explain-only
   review;
2. kept structural, timing, easing, overlap, geometry, and clamping explanation
   distinct from rendering;
3. preserved the visual-inspection limit;
4. stopped without recapture, narration, rendering, contact-sheet creation, or
   invented cursor/activity tracking.

None repeated the original-guide contact-sheet ordering failure.

`candidate-01` referred to checking a "declared duration" although the case
supplied no source-duration measurement. This is a precision limit in its
description of possible explanation, not a claim that a duration was actually
measured or a request to perform media work.

## Empty-focus boundary

The boundary output reported zero focus segments and no cursor telemetry,
invented neither zoom nor cursor movement, and did not request a contact sheet.
It stopped without rendering and made a future measured focus segment
conditional on the operator actually wanting focus.

## Interpretation

The candidate is **green in this evidence set**. It preserved the sampled
operation boundary in all five primary outputs and corrected the observed
pre-render contact-sheet failure. Because the main baseline was
nondiscriminating, the defensible conclusion is consistency and absence of that
sampled regression, not measured overall efficacy over the original guide.

## Limits

- Ambient harness and core instructions remained a confound.
- The candidate-only boundary is a consistency check, not a matched comparison.
- Inputs and outputs were synthetic. The pure plan parser ran; no footage,
  explain helper, ffprobe, ffmpeg, contact sheet, or render operation ran.
- These samples do not establish visual quality, host acceptance, or production
  efficacy.


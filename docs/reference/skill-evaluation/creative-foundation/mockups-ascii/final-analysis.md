# Mockups ASCII final analysis

**Method:** `mockups-ascii`  
**Shared baseline dataset:** reused from the routine copy-correction case in
`mockups-ascii\case.md` with the preserved original `ui-mockup` guide for the
control/current arms  
**Candidate guide identity:** SHA-256 `f2629a689b4420cd93ecbfb808bced8258246146accaff406b4d52c3b1beb459`  
**Observed worktree HEAD at candidate freeze:** `46cef0d8b61ccc177dbfd6fb44707affd2f4ca9d`  
**Observed note on prior referenced base:** `604e06c53781cf9cdee3fad861ffa5239a104645`
did **not** contain `plugins\kai-creative\skills\mockups-ascii\SKILL.md`  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`

## Baseline status carried forward

The shared non-applicability baseline remains **nondiscriminating**. On the
routine copy-correction case, both the control arm and the preserved original
`ui-mockup` guide said no mockup/options exercise was needed. That baseline
supports **no efficacy claim**.

## Candidate case result

The five candidate samples on that same shared routine-copy case all returned
the expected no-mockup answer:

- **5/5** recommended the bounded label change without a mockup/options exercise.
- `candidate-05.md` explicitly says no ASCII/HTML mockup or options exercise
  is needed. Its raw SHA-256 is
  `9e0aed4cb5bedf6ddb8bf22ce02b4df76abb3634b25f832b503ca180137fec7b`.
  Some other samples mention implementation planning or an optional narrower
  viewport spot-check; no such work was executed.

## Candidate-only boundary results

### Boundary 1: explicit single ASCII mock

`candidate-boundary-single.md` returns one ASCII mock for the fixed two-row
toolbar, preserving the main controls and six schematic chips beneath them.
It names the structural question and limits the spacing/wrapping claim.
Its raw SHA-256 is
`42f12e6b3c875c09d96e23519144b98daf695e94cc775d82d2d3f90042bb8cd3`.

### Boundary 2: styling or interactive-behavior limit

`candidate-boundary-limit.md` correctly said ASCII was not enough to settle a
decision driven by visual emphasis and hover behavior, and recommended a
higher-fidelity mock or prototype instead of pretending ASCII proved the
outcome.

## Interpretation

The candidate has no substantive failure on these five primary and two
boundary outputs. The initial analysis incorrectly inverted the descriptions
of `candidate-05.md` and `candidate-boundary-single.md`, reporting two failures.
The controller re-read all seven candidate-side outputs with explicit filename
headers and verified every raw hash against its manifest entry. The files and
their case/arm mappings were already correct; only the analysis/status was
wrong. No raw output was rewritten and no replacement sample was run.

Because the baseline was nondiscriminating, this still supports **no efficacy
claim**. The supported conclusion is narrower: **non-regression on this
non-applicability case, plus conformity on the two supplied boundary cases**.

## Limits

- Ambient harness/core context remained a confound.
- The analysis error above is an evidence-reporting defect, not an observed
  actor/skill failure. The source, outputs and manifest hashes were unchanged.
- HTML was intentionally not evaluated in this turn.

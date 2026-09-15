# Grounding final analysis

**Method:** `kai-core-design-grounding`  
**Candidate guide identity:** SHA-256 `f2f9cf5e790cf77f8233beb5e790336e0ce1b941f66e040496a4b5d5f83ebeec`  
**Worktree base at candidate freeze:** `db386da78e857d2c863ae373c9670efb6f67e410`  
**Committed candidate containing that frozen content:** `603e3324386466d2edd8829c41c0feadab1bdfeb`  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`  
**Evidence in this method:** five control, five unchanged-guide, five candidate, two candidate-only boundary samples

## Baseline status carried forward

The earlier baseline remains **nondiscriminating**. On the fixed bounded toolbar
case, both the control arm and the unchanged-guide arm returned useful bounded
screen decisions without demanding `design-system.md`, app-wide extraction,
workspace artifacts, repo scans, or helper agents. That baseline supports **no
efficacy claim**.

## Candidate case result

The five candidate samples on the unchanged bounded toolbar case were also
non-failing. All five:

1. returned a bounded screen-level recommendation;
2. included a structural sketch;
3. grounded the recommendation in the supplied width audit, missing overflow
   pattern, and existing reports-page precedent;
4. avoided invented app-wide facts or current-token claims;
5. avoided demanding a durable design-system artifact for this direct request.

## Candidate-only boundary results

### Boundary 1: requested durable derivation

`candidate-boundary-durable.md` treated the request as durable applied
design-system work, said to refresh `design-system.md` from the supplied
whole-app evidence, and kept the suggested `--space-5` gap labeled as proposal
rather than current fact. It also preserved the need for frontend feasibility
review and later acceptance before that changed token could be treated as
accepted.

### Boundary 2: direct advisory missing token

`candidate-boundary-inline.md` kept the one-screen advisory bounded, recommended
staying on the current spacing system for today, refused to treat the missing
`6px` gap as current fact, and framed it only as a proposed refinement pending
feasibility and adoption. It did not ask for a new `design-system.md` artifact.

## Interpretation

No **substantive candidate failure** appeared in these seven candidate-side
outputs. The sampled behavior is consistent with the approved seam: bounded
direct work can use scoped supplied evidence without forcing a new reference
artifact, while explicit durable design-system work still carries the broader
evidence, provenance, and review obligations.

Because the baseline case was nondiscriminating, this evidence still supports
**no measured efficacy claim** over the old wording. The supported conclusion is
narrower: **the candidate did not introduce a sampled behavioral regression, and
its candidate-only boundaries aligned with the intended contract in these
samples.**

## Limits

- Ambient harness/core context remained a confound.
- Candidate-only boundaries are consistency checks, not baseline comparisons.
- No host acceptance, live rendering, or broader cross-model claim is
  established here.

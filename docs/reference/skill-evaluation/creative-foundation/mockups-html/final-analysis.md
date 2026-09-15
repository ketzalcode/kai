# Mockups HTML final analysis

**Method:** `mockups-html`  
**Shared baseline dataset:** reused from
`docs\reference\skill-evaluation\creative-foundation\mockups-ascii\case.md`
plus its 10 preserved control/current outputs; no duplicate baseline calls were
run for HTML  
**Candidate guide identity:** SHA-256 `37ee40f8a632e00bf5fe346a64a609066764d68f8a3e732dc05b295ae66b7a9e`  
**Frozen sampled guide revision:** `7dd7c0165df751566bc33e81a4f825fd9785a8dd`  
**Observed later source-only clarification revision in the worktree:** `4cd6643e6dbd2043f4b8c7d574a6b8382dbe2371`  
**Coverage note:** the sampled frozen guide predates that later source-only clarification, so these samples do **not** cover the clarified `system fonts + inline SVG/embedded data + no local file dependencies` wording.  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`

## Baseline status carried forward

HTML reuses the shared non-applicability baseline collected for
`mockups-ascii`. That baseline was **nondiscriminating**: both the no-guide arm
and the preserved original `ui-mockup` guide answered the routine copy-only case
without inventing mockups, option sets, or a human-choice gate. It supports **no
efficacy claim** here as well.

## Candidate case result

The five HTML candidate samples on the same routine copy-correction case were
all non-failing. All five said no mockup/options exercise was needed and
recommended only the bounded label change, without inventing an HTML artifact
for a settled copy update.

## Candidate-only boundary results

### Boundary 1: explicit single offline HTML mock

`candidate-boundary-single.md` returned one self-contained offline HTML mock
using the supplied inline tokens, kept the request to one mock rather than
expanding to 3-4 options, did not require a `design-system.md` artifact, and
labeled the result as uninspected rather than implying rendered validation.

### Boundary 2: interactive prototype request

`candidate-boundary-prototype.md` correctly said the request was outside the
HTML mock base because the deciding factor was task-flow behavior and
transitions, and it recommended a separate prototype/implementation path or
static state views instead of building JavaScript flow.

## Protocol deviation

One candidate sample wrote to
`docs\reference\skill-evaluation\creative-foundation\mockups-html\candidate\candidate-04.md`
instead of the predetermined `candidate-04.md` path. The artifact is preserved
and counted at its actual path. This is a sample-protocol deviation, not a
behavioral failure.

## Interpretation

No substantive HTML candidate failure appeared in these seven candidate-side
outputs. The sampled behavior matched the intended method boundary: no automatic
artifact for a routine copy correction, one bounded offline mock when explicitly
requested, and a clear stop when the request is really for interactive flow.

Because the shared baseline is nondiscriminating, this evidence supports **no
measured efficacy claim** over the old wording. The supported conclusion is
narrower: **the HTML candidate did not introduce sampled regression and its
candidate-only boundaries aligned with the intended contract in these samples.**

## Limits

- Ambient harness/core context remained a confound.
- The reused control/current dataset is shared with `mockups-ascii`, not an
  independent second baseline campaign.
- No browser rendering or viewport inspection was performed here.

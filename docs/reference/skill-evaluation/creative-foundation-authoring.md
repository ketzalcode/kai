# Creative foundation implementation and evidence

**Source scope:** The signed-off three-agent, six-skill creative foundation.
**Design:** [approved specification](../../superpowers/specs/2026-09-13-creative-skills-foundation-design.md).
**Execution:** [plan and decisions](../../superpowers/plans/2026-09-14-creative-skills-foundation.md).
**PR:** #213, draft.
**Status:** Source implementation and generated packaging are complete.
All eight authoring evidence sets are complete and the full indexed-evidence
guard passes. Whole-branch review is pending; this is not merge or release
acceptance.

## Implemented surface

The creative package has `creative-lead-design`, `creative-lead-video`, and
`workflow-creative-demo-production`. Its six methods are `mockups-ascii`,
`mockups-html`, `html-block-diagrams`, `video-create-narration`,
`video-align-narration`, and `video-render-zoom`.

The [package reference](../packages/kai-creative.md) owns current usage and
authority guidance. The design lead combines interaction and identity
judgment, with independent design acceptance and operator brand adoption
preserved. The video lead plans. The production workflow consumes approved
direction and existing media, without recording or automatic peer dispatch.

Original definitions remain under `incubator\kai-creative\`. Capture is a
deferred capability, not an active method. Its helper module remains an import
dependency. No media helper algorithm, dependency version, or unrelated
package policy was repaired.

## What the authoring screen establishes

The operator authorized at most **120 comparison and 16 boundary actor
invocations**. Implementation and independent code-review agents are separate
development work, not counted as comparison samples.

Actors used `gpt-5.4-mini`, `general-purpose`, medium reasoning effort, with
one fresh task per sample. Inputs and outputs are synthetic application
responses, not live plugin discovery or actual media operations. Ambient
harness/core instructions remain a confound; a no-target-guide control is
not a stronger sandbox or instruction-free model.

Source/caller contracts, their directly loaded references, real helper input
interfaces, and actual outputs were considered separately. Structural RED
and a passing source guard do not prove behavioral improvement. A working
control is non-regression evidence, not an invented actor failure.

Every method has a manifest linking case, guide, arm, ID, raw output, byte
count, raw SHA-256, and CRLF-to-LF text SHA-256. The
[budget](creative-foundation/budget.json) records actual invocations, including
excluded fixture history and the extra scope protocol-deviation call.

## Method-level results

| Method | New comparisons / boundaries | Result and limit |
| --- | --- | --- |
| [Design grounding](creative-foundation/grounding/manifest.json) | 15 / 2 | Controls, original guide and candidate all kept the direct request bounded in 5/5 samples per arm. Both candidate boundaries preserved direct versus durable obligations. Non-regression, not efficacy. |
| [Scope discipline](creative-foundation/scope/manifest.json) | 16 / 2 | Same nondiscriminating five-per-arm result; two boundaries preserved unadopted direct advice versus coordinated recording. One misplaced original output and a fresh replacement are both retained/counted. |
| [ASCII mockups](creative-foundation/mockups-ascii/manifest.json) | 15 / 2 | Five-per-arm no-mock outcomes on the copy-only case; both candidate boundaries conformed. An initial analysis inversion was corrected after filename/content/hash inspection; no raw output was changed or rerun. |
| [HTML mockups](creative-foundation/mockups-html/manifest.json) | 5 / 2 | Reuses the exact ten ASCII baseline outputs, not ten new calls. Five candidate outputs and two boundaries conformed. One misplaced candidate was retained at its actual path without a replacement. |
| [Narration creation](creative-foundation/video-create-narration/manifest.json) | 15 / 2 | Five-per-arm conceptual estimate advice and two consent/partial-result boundaries conformed. The primary input is a beats fragment, not a full executable helper input. |
| [Narration alignment](creative-foundation/video-align-narration/manifest.json) | 25 / 4 | Ten invalid-fixture v1 invocations are excluded from primary conclusions but counted. On validated v2, 2/5 controls withheld alignment. First candidate caught the gate 5/5 but cleanly repaired the right input only 1/5; refined v3 gave correct recording-take repairs 5/5 and passed both repeated boundaries. |
| [Declared focus](creative-foundation/video-render-zoom/manifest.json) | 15 / 1 | Controls 5/5, original guide 4/5, candidate 5/5 on operation boundaries. The original-guide failure required a sheet before rendering; the candidate did not. One candidate imprecisely mentioned a supplied duration; no measured result was claimed. Empty-focus boundary conformed. |
| [HTML structural diagrams](creative-foundation/html-block-diagrams/manifest.json) | 10 / 1 | Five controls and five candidates produced grounded, self-contained HTML source without invented card metadata. The no-diagram-needed boundary conformed. No original-guide actor arm or catalog-load trace is claimed. |

The final recorded allocation is **116 comparisons and 16 boundaries**.
Ten mockup baseline
outputs are reused explicitly; they are not independent HTML baseline runs.

### Revisions and limitations that must remain visible

- HTML actors used the frozen guide from `7dd7c01`. The local-file dependency
  ambiguity was subsequently corrected at `4cd6643` and covered by a source
  guard and scoped review, not by another model screen.
- Narration-creation actors used `679627f`. Its primary case asks whether an
  estimate is possible from narration beats; it does not establish that the
  incomplete fragment can be passed to the CLI parser. The source still
  requires complete helper input for execution. The synthesis-specific claim
  grounding clarification at `4d0ce43` was source-tested/reviewed, not resampled.
- Alignment v1 incorrectly declared a valid screenplay with an unsupported
  `intends_to_show` value. The real parser rejected it. The original case,
  manifest and ten outputs remain untouched. Corrected v2 changes only that
  enum; five fresh controls are matched to the candidate versions. No old-guide
  v2 arm exists, and no v1-to-v2 efficacy comparison is claimed.
- The first alignment candidate's remediation failures are genuine observed
  failures, not excluded fixture data. They remain next to the refined
  candidate that distinguishes recording takes from speech takes and rebuilds
  placement after input changes.
- No original-guide model arm was run for structural diagrams. Budget was
  reallocated to the observed alignment failure; zoom and diagrams each have
  one separate boundary. The absolute cap was not increased.

## Source, helper and layout verification

The [retained command record](creative-foundation/validation/summary.json)
maps each command to its exact stdout/stderr files. Export changed only log
references to portable relative paths; captured log bytes are unchanged.

At `1eb33d9701118e22cb628e0d788b910e56fe8b6a`, on Node `v24.15.0`,
26 independently invoked commands produced **23 zero exits, three expected
nonzero exits, and no unexpected failures**. The evidence guard in that run
used its explicit `baseline` selector, not full authoring coverage.

Passing coverage includes both foundations' source checks, creative core/role/
method contracts, generated catalog and inventory, pack parity, existing
workspace/activity/observer helpers, syntax, the real base/head release guard,
and all four unchanged media helper self-tests (238 checks). This does not
make the repository suite green.

### Synthetic diagram layout

Using an existing Playwright Chromium installation, the optional
`test\creative-diagram-layout-self-test.mjs` exercised long-label layouts
at 320px and 900px, in light and dark modes. The original CSS overflowed;
the candidate produced zero page overflow and zero overflowing tested blocks
in all four combinations. The test closes its browser and makes no page
network requests.

This is a local synthetic layout result, not visual acceptance of arbitrary
artifacts, a full accessibility assessment, or a live product/browser-agent
test. The reference uses normal-flow legends, shrinkable/wrapping layouts,
and separate decorative connector elements.

### Existing blockers

The original [baseline](creative-foundation-baseline-2026-09-13.md) had
53 source-validator errors. The current source validator reports **50**:
the three creative first-core-ordering errors were resolved by the new roles.
The remaining failures are not waived or silently repaired.

The pack self-test still fails on the retired personal-pack assumption.
The all-gates run passes partition, collision and partial-install, then
crashes on the separate retired-personal version-skew path. Prepared `9.0.0`
metadata is not publication, a tag, deployment, or updated-host acceptance.

No desktop capture, real-video encoding/mixing, paid speech synthesis,
caption-content validation, or release publication was performed.

## Review corrections

Task-scoped review prompted explicit creative-family self-check wording,
helper-accepted screenplay prerequisites, per-role creative-route mutation
coverage, direct/durable acceptance guard coverage, complete source totals,
HTML self-contained resources, and evidence identity/schedule protections.
Integration caught the leads' missing execution capability for the required
workspace-activity contract; their non-production authority remains unchanged.
The designer explicitly excludes the deferred interactive-prototype capability.

Git initially normalized the baseline log bytes despite matching working-file
hashes. The original retained bytes were re-indexed under narrow `-text`
attributes, and the guard now checks indexed bytes as well. Actor snapshot
paths, cases, guides, candidate versions, excluded history, shared mockup
data and budgets are mechanically checked; natural-language correctness still
requires reading the actual named outputs.

Full indexed-evidence verification passes for all eight methods and the exact
116/16 invocation allocation. Final integration corrected declaration field
names in the alignment export and separated collection completion from
candidate acceptance. The verifier now handles explicit non-exclusion markers
and canonicalizes path separators before variant comparisons. No case, guide,
raw output, or invocation count was changed by those corrections.

Captured evidence keeps its original whitespace, including Markdown hard
breaks; it is byte-checked rather than reformatted to satisfy a source-style
check. Whole-branch review remains pending.

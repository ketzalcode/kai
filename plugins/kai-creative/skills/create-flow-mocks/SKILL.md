---
name: create-flow-mocks
description: "Use to produce or update the canonical accepted-flow HTML for a feature journey once exactly one interaction model has been selected. Not for comparing competing models — use mockups-html for that."
publication-entrypoint: creative-workspace-publication
user-invocable: true
---

# Create Flow Mocks

Produce the canonical, implementation-ready HTML for an accepted feature
journey: the one interaction model that has already been selected, not a
set of options to choose between.

## Applicability and evidence

Use this only after `mockups-html` (or an equivalent explicit sign-off) has
already resolved which interaction model to build. If competing models still
need human selection, that comparison belongs in `mockups-html`'s options
artifact first; do not fold candidate alternatives into this flow.

Consume the accepted interaction model, real scenario names, supplied product
evidence, existing components/tokens, and the destination and viewports.
Neutral or proposed values stay labeled; supplied tokens and screens are
evidence, not authority to invent a new visual system. Ground every screen in
supplied evidence — invented screens or components are a named gap, not a
filled-in assumption.

Invoke each Core skill directly at the decision that needs it. If a required
Core skill is unavailable, bounded flow authoring from supplied evidence may
continue, but do not coordinate work or write `.kai` state. Tell the operator
to install or update `kai-core` before coordinated design resumes.

## Flow contract

- Organize the flow by real scenario (the actual named journeys a user takes),
  with a recognizable entry screen and left-to-right chronology.
- Use real screen/component frames pulled from supplied evidence or existing
  surfaces, never abstract state IDs or placeholder boxes standing in for a
  screen.
- Label every connector with the exact thing that causes the transition: the
  CTA text, the event, the system condition, a defer/skip path, or a
  guardrail — never an unlabeled arrow.
- Allow deliberate screen duplication where it keeps a branch local and
  understandable, rather than routing every path through one shared node.
- Preserve meaning at narrow widths through accessible horizontal scrolling
  (a scrollable region with a visible, keyboard-reachable scrollbar/affordance
  and no clipped content), not a redesign of the flow for mobile.
- Keep the final HTML free of option selectors, rejected models, side-by-side
  comparisons, or revision narrative — that provenance belongs in the sibling
  reference file, not the flow artifact a reader or implementer opens.

The file works offline: inline CSS, semantic HTML, and system fonts. Images
use inline SVG or embedded data. No external assets, CDN requests, npm setup,
or build step.

## Suggested shape

```text
<feature>-mockups/options.html   (mockups-html's comparison artifact, if used)
<feature>-flow/flow.html         (this skill's accepted-flow artifact)
<feature>-flow/reference.md      (revisions, rejected alternatives, provenance, validation evidence)
```

`reference.md` carries what the flow HTML must not: why alternatives were
rejected, who accepted the model, prior revisions, and the actual validation
evidence below. Keep it beside the flow file, not inside it.

## Validate what was actually checked

When browser tooling is available, validate rendered desktop and mobile
behavior, navigation between screens, console errors, overflow at narrow
widths, and that every connector in the HTML actually corresponds to a
labeled transition in the markup. Report exactly what was checked and at
which viewports.

When browser tooling is not available, say so explicitly: unrendered markup
is not a visual-validation result, and authoring the HTML is not the same
claim as having rendered it. Name the uninspected gap rather than implying
coverage.

## Outcome and stop

Return the flow HTML path (and the sibling `reference.md` if revisions or
rejected alternatives exist), the scenarios it covers, and the actual
validation status. Load `kai-core-workspace-paths` before choosing a
persistent target. Load `creative-workspace-publication` when retaining or
revising a durable `creative/features` or `creative/documentation` artifact,
then apply `kai-core-work-acting` before recording an authorized transition.
Direct one-off output may stay repository-native.

Stop at the flow artifact. Do not reopen the interaction-model decision,
implement production frontend code, or treat this flow as its own
independent design acceptance — that acceptance belongs to the model's
original decision owner.

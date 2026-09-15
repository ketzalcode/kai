---
name: mockups-html
description: "Use when an HTML mock is requested, or a UI choice depends on visual hierarchy, component appearance, or responsive layout."
user-invocable: true
---

# HTML Mockups

Make visual hierarchy, component appearance, or responsive layout reviewable
as a scoped offline mock. This is a desired-state visual, not production UI.

## Applicability and evidence

An explicit HTML request earns the requested mock. Otherwise use this method
when appearance affects an unresolved decision. If ASCII already communicates
the structural choice, no higher-fidelity artifact is needed automatically.
A request for simulated interactive behavior or transitions is a prototype
request outside this base, not permission to build a miniature application.

Consume the approved need, fixed/open constraints, destination and viewports,
relevant surface evidence, and current tokens for on-brand fidelity. Neutral
or proposed values stay labeled; supplied tokens are evidence, not authority
to establish a new visual system. Screenshots do not establish source-token
truth. A screenshot of today's UI does not replace a desired-state mock.

Before applying shared rules, Load `kai-core-contract-v1`. Without compatible
core, bounded visual advice from supplied evidence may continue, but do not
coordinate work or write `.kai` state. Tell the operator to install or update
core before coordinated design resumes.
Apply `kai-core-design-grounding` when choosing actual tokens or components.
Apply `kai-core-scope-discipline` when an option changes the approved scope.
An unadopted proposal stays separate from the in-scope recommendation.

## Build only the visual needed

Produce one scoped self-contained HTML mock, or only the real alternatives
needed for the decision. Label the visual question, fixed constraints, and
consequential trade-off. Use existing surfaces when a placement is open; do
not invent destinations to fill an option set.

The file works offline: inline CSS, semantic HTML, system/local resources,
and no CDN, external assets, npm setup, or build step. Represent different
states as labeled static views. Do not implement simulated task flows.

This neutral example illustrates the file shape, not an app's real tokens:

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Proposed card</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 1rem; font: 1rem system-ui; color: #111; background: #fff; }
  main { max-width: 36rem; margin: auto; padding: 1rem; border: 1px solid #777; }
</style>
<main>
  <h1>Proposed card</h1>
  <p>Replace this illustrative content with approved copy.</p>
  <button type="button">Illustrative action</button>
</main>
</html>
```

Use supplied content and tokens for a real mock. Keep semantic structure,
readable labels, focus visibility, contrast intent, and requested viewport
behavior explicit. These intentions are not accessibility certification.

## Outcome and stop

Return the requested HTML source/file and the actual inspection status.
Authoring requires no browser; rendered fidelity requires actual rendering
at the relevant viewports. If that was not performed, label the mock
uninspected rather than implying it was visually validated.

HTML is independent of ASCII: no automatic ASCII stage is required. A
prose-sufficient or settled question may receive no new mock; an unavailable
requested artifact remains a named gap.

Load `kai-core-workspace-paths` before choosing a persistent target.
Load `kai-core-asset-producing` when retaining or revising a durable design,
and Load `kai-core-asset-closing` when recording disposition or acceptance.
Use the caller's existing target/lane; do not create an initiative for a mock.

Stop at the mock and recommendation. Do not lock or adopt a consequential
choice without its owner/authority. Do not implement production frontend
code or treat the mock as the caller's independent design acceptance.

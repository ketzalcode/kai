# kai-creative

UI/UX, visual identity, design assets, video direction, and bounded demo
production over kai-core.

The supported baseline is **kai-core plus kai-creative**. Approved product
needs, positioning, factual context, current surfaces, media metadata, direction,
and existing recordings can be supplied directly. Product, marketing,
engineering, and assistant roles are optional producers or reviewers, not
mandatory package dependencies. Missing facts, direction, media, consent, or
independent acceptance remain explicit gaps.

## Migration status

The active agent registry and callers now target the final three-agent surface:

- `creative-lead-design`
- `creative-lead-video`
- `workflow-creative-demo-production`

The locked method surface is:

- `mockups-ascii`
- `mockups-html`
- `html-block-diagrams`
- `video-create-narration`
- `video-align-narration`
- `video-render-zoom`

All six authored method sources, generated catalog/inventory, and package
outputs are integrated at prepared `9.0.0` metadata. Retired names have no
runtime compatibility aliases; their original definitions remain in Git
history. Source integration is not live-host verification or publication.

## Ownership and authority

| Owner | Responsibility | Boundary |
| --- | --- | --- |
| `creative-lead-design` | Interaction design, visual hierarchy, applied design systems, visual identity, critique, and exact-revision design review | No product priority, positioning ownership, frontend implementation, QA substitution, or unilateral brand adoption |
| `creative-lead-video` | Audience, message, narrative, scenes, shots, scripts, storyboards, and demo screenplays | No capture, rendering, synthesis, mixing, production dispatch, or publication |
| `workflow-creative-demo-production` | Requested production operations over approved direction and existing media | No invented direction, recording fallback, mandatory narration/zoom, worker-per-stage chain, or publication |

The PM/steward retains scope, priority, and exact-revision product-design
acceptance. Frontend retains implementation truth and feasibility for proposed
tokens, components, and platform-sensitive behavior. QA remains independent.
The operator retains identity adoption, paid-processing consent, external
disclosure, and publication authority.

A skill supplies a reusable method. It does not hold role authority, accept a
design, approve spend, grant work, or publish an artifact.

## Direct requests and expected boundaries

| Request | Method or owner | Expected boundary |
| --- | --- | --- |
| Decide or review grouping, placement, or information hierarchy | `creative-lead-design`, optionally `mockups-ascii` | One structural mock or only the alternatives needed; no styling or implementation claim |
| Decide or review appearance, tokens, component feel, or responsive layout | `creative-lead-design`, optionally `mockups-html` | Scoped offline HTML when appearance matters; no compulsory ASCII stage or interactive prototype |
| Define or critique visual identity | `creative-lead-design` | Direction grounded in approved positioning; operator adoption remains pending |
| Represent established structure in HTML or an image | `html-block-diagrams` | Diagram contribution only; no invented architecture or UI mockup substitution |
| Prepare proportional video direction | `creative-lead-video` | Only the requested concept, scene plan, storyboard, script, screenplay, or critique; no fixed bundle |
| Estimate or synthesize approved narration | `video-create-narration` | Estimate without spend, or measured clips after separate paid consent; no automatic placement or retry |
| Fit, place, print, or execute an authorized narration mix | `video-align-narration` | Requires matching measured inputs and visual-state evidence; no automatic synthesis or invented offsets |
| Explain, compile, render, or review declared focus | `video-render-zoom` | Existing footage and evidenced focus only; no capture or automatic subject tracking |
| Produce an approved demo from supplied direction/media | `workflow-creative-demo-production` | Only necessary requested operations; missing recording returns as an input gap |

Adequate supplied scoped evidence can support a bounded design without forcing a
new design-system artifact. Structural and visual mockups are independently
selectable. PM acceptance, frontend feasibility, QA review, and operator
adoption are never inferred from supplied inputs or a clean creative review.

## Runtime ownership and prerequisites

The final media methods resolve the kai-creative provider from their loaded
skill source and invoke the existing repository helpers with absolute paths.
The production workflow resolves the provider from its loaded agent source.
Neither path searches cwd or another installed package.

| Creative runtime asset | Purpose and closure |
| --- | --- |
| `scripts/demo-format.mjs` | Existing format checks; imports `./demo-capture.mjs` for parser contracts |
| `scripts/demo-narrate.mjs` | Narration estimate, synthesis, placement, and mix operations; imports `./demo-capture.mjs` |
| `scripts/demo-zoom.mjs` | Focus compilation/render/review operations; imports `./demo-capture.mjs` and `./lib/cursor-png.mjs` |
| `scripts/demo-capture.mjs` | Retained parser/helper dependency only; live capture is not an active creative skill |
| `scripts/lib/cursor-png.mjs` | Cursor image closure used by zoom rendering |

Keeping `demo-capture.mjs` in the emitted closure does not restore recording as
an active method. Requests needing an unavailable recording or measured take
stop with that input gap.

`creative: ['lectoria']` remains the runtime dependency declaration for paid
narration synthesis. Installation does not provision it automatically. The
existing lock and artifact pin remain authoritative; credentials stay outside
inputs and artifacts. Estimation, alignment planning, printed mix commands, and
silent demos do not require a paid synthesis run.

External prerequisites are not asserted installed: a supported Node version,
ffmpeg/ffprobe for applicable media operations, Lectoria plus configured Azure
Speech for separately authorized synthesis, and an available browser renderer
for actual design inspection. A registered Playwright MCP server is one browser
route, not an authoring prerequisite. Offline ASCII/HTML source does not itself
prove rendered fidelity.

## Verification boundary

This migration preserves the media helper/parser algorithms and updates active
IDs, callers, source contracts, generated packs, and catalog inventory.
Source/caller/helper-closure guards and existing helper self-tests have run.
A separate synthetic browser check exercises the diagram reference at narrow
and wide sizes; it is not a real artifact's visual or accessibility acceptance.

No desktop recording, real-video encoding/mixing, paid speech synthesis,
live-host discovery, or release publication was performed. Existing validator
and pack-check failures remain deferred refactor work, not passing checks.

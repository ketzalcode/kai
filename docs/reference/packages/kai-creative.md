# kai-creative

UI/UX, visual identity, design assets, and supported media production over kai-core.

This package's supported baseline is **kai-core plus kai-creative**. Product
needs, positioning, factual `product_context.json`, media metadata, and approved
recording inputs can be supplied directly. Product, marketing, engineering, and
assistant are possible input or review providers, not mandatory first calls.
Missing facts remain requested or explicitly unresolved.

The source and generated install artifacts are part of the remaining-package
refactor. This is not a release or a claim of marketplace availability.
Version metadata stays at the controller's existing `6.0.0` until the batched
release preparation.

## Ownership

All IDs are preserved; each agent and skill has one source.

| Source package | Creative-owned agents | Creative-owned methods |
| --- | --- | --- |
| `kai-product` | `principal-product-designer`, `principal-brand-designer` | `ui-mockup`, `html-block-diagrams` |
| `kai-personal` | `creative-video-director` | `video-direction`, `create-product-demo`, `demo-capture`, `demo-narrate`, `demo-zoom` |

Each complete method directory moves to `plugins/kai-creative/skills/`.
The seven directories contain only their existing `SKILL.md` source; runtime
helpers are generated separately from the repository's `scripts/`.

Creative owns the design response, not product priority or new product claims.
The product designer owns interaction and the applied design system; the brand
designer owns its identity layer. Neither implements production application
code. The video director plans; the directly invocable demo methods perform
bounded production only when requested and authorized.

## Direct requests and expected artifacts

These are acceptance scenarios, **not executed runtime results**.

| Request | Supplied inputs | Expected result and boundary |
| --- | --- | --- |
| “Design this interaction.” | Approved need, current map/state evidence, design-system or source-token evidence, viewports and accessibility constraints | Interaction decision, hierarchy, transitions, error/empty/loading states, keyboard/focus and accessibility intent; 3–4 material mockup options when consequential, one recommended, human pick unless delegated. No scope approval or frontend code. |
| “Review this implementation against the design.” | Exact implementation revision, approved design, viewport/input evidence | Revision-bound design findings; a new load-bearing choice forks to design options, not an implementation repair. Not QA, accessibility certification, or a release verdict. |
| “Propose or critique our visual identity.” | Approved positioning/brand brief, current identity/surfaces, evidence and constraints | Brand exploration, system or guidelines, color/type/logo/icon/illustration rules, accessibility and distinctiveness rationale, options and adoption decision. No fabricated performance claims or unilateral rebrand. |
| “Plan a video from this factual context and media.” | Factual `product_context.json`, `media_manifest.json`, goal/platform/tone, described references | `creative_brief.md`, `storyboard.md`, `edit_decision_list.json`, `voiceover_script.md`, `ai_video_prompts.json`; `demo_screenplay.json` for a live interface. Never a claim that a video was rendered. |
| “Plan/check this product demo.” | Approved brief/screenplay, destination and payoff intent; take/render when available | Placement, word-budget forecast, and scoped format findings. Missing required checks mean `INCOMPLETE`, not pass. Defaults warn; explicit length promises and upload limits can fail. |
| “Capture this approved screenplay.” | Recording consent, prepared Windows desktop, semantic targets measured from a real preflight frame | Emitted PowerShell driver; only after authorized execution, real raw recording plus `demo_take.json` with measured timing/geometry/cursor provenance. Driver emission is not capture. |
| “Focus this measured take.” | Real recording plus screenplay/take, or an evidenced focus plan | Compiled focus plan, authorized ffmpeg render, and contact sheet for human judgment. No inferred cursor telemetry or claim that a rendered demo proves the feature works. |
| “Narrate this recorded demo.” | State-based narration beats, matching measured take/render, factual grounding; explicit paid consent for synthesis | Estimate first; measured `demo_narration_take.json`, placement plan, then printed mixing command. A narrated file exists only after authorized mixing. No automatic paid retries or silence-shaped success for missing clips. |

A bounded inline design, critique, or concept does not require initialization
of a workspace or invention of a team item. Persistent work uses the resolved
workspace and the existing lanes:

- UI/brand scratch and mockups remain under `.kai/runs/product/`.
- Review-ready mockups remain `.kai/review/designs/<item-id>/options.html`;
  screenshots stay private run evidence.
- Coordinated UI and brand artifacts remain
  `.kai/state/initiatives/<slug>/artifacts/designs/<item-id>.md` and
  `.kai/state/initiatives/<slug>/artifacts/brand/<item-id>.md`.
- Video bundles remain
  `.kai/state/initiatives/<slug>/artifacts/content/<item-id>/`; standalone
  direction and raw media use `.kai/runs/content/`.
- `.kai/personal/` data is not renamed or moved by this package extraction.

## Obligations preserved, redesigned, and retired

| Obligation | Disposition |
| --- | --- |
| Approved scope, hierarchy, states, responsive/input/accessibility intent; challenge the container for crowding/context problems | Preserved in product designer and `ui-mockup`. Options are real visual alternatives; screenshots do not substitute for desired-state mockups. |
| Offline mockups and structural diagrams | Preserved: no CDN, npm/build, or external asset dependence in HTML output. Diagram CSS, palette mechanics, intrinsic sizing, wrapping, captions, and human visual checks are retained. Example colors are not product evidence. |
| Exact-revision design review and PM/steward design acceptance | Preserved for coordinated DESIGN items. The required independent review remains pending if unavailable; direct design output does not invent acceptance. |
| Brand evidence classes, contrast/legibility, ownability, no protected-mark imitation, no visual product claims | Preserved, together with identity/application ownership and operator adoption gates. |
| Per-span factual ledger, provenance treatment, bilingual/locked-fact voicing | Shared core grounding admits operator/approved-producer factual JSON with actual assertion provenance; marketing is a possible producer, not a mandatory call. Supplied assertions are not independently verified by admission. No facts are reconstructed from chat. |
| Typed existing/generated/capture-required/reference-only media, source vs final clocks, shared scene IDs, cut/audio cue synchronization | Preserved. Existing assets require usable availability and paths. Estimates are labeled; metadata is not a claim to have watched media. |
| Live-interface screenplay vs measured take | Preserved and made explicit in the method's example: semantic targets, placement/payoff intent, state spans and `start_after`; no invented source seconds, frame coordinates, or narration offsets. |
| Measurement, failed/unsettled steps, cursor provenance, fit and duration honesty | Preserved in unchanged media algorithms. Duration comes from the finished render, not a take; human review is not replaced by arithmetic or contact-sheet generation. |
| Paid synthesis and disclosure consent, no automatic paid retry | Preserved explicitly at the synthesis instruction. Missing tools/configuration, failed clips, stale text, partial output, and unexecuted mixing remain visible. Credentials stay out of deliverables. |
| Personal-voice enhancement | Optional. Neutral or requested brand voice completes without assistant; an unavailable personal voice is a named refinement gap, not a blocked baseline. |
| Leases, version checks, collision/handoff records, activity and durable asset lifecycle | Routed on demand through the current core acting/item/activity, workspace, and producing/closing contracts. No new granting authority is added. Team-facing assets require the named authority's exact-revision acceptance. |
| Eager inheritance and managed refusal guards | Retired in the three creative agents. Each probes core just before its first shared rule, states a role-specific single-shot fallback, forbids coordinated `.kai` state without core, and requests install/update. |
| Cwd-first or personal-provider helper lookup | Retired. Every demo command resolves from the loaded creative method's provider root. |

The shared core design/content contracts explicitly admit supplied inputs:
factual JSON retains each assertion's actual provenance and treatment; current
source-token inventories or neutral extracts require sufficient provenance and
whole-in-scope coverage before deriving or refreshing a design reference.
Adequate supplied evidence does not require a sibling installation or dispatch.
These are narrow input-interface corrections, not a core operating-model
redesign. Missing evidence is requested; real FE feasibility for new/changed
tokens and required independent acceptance are not faked. A derived draft is
not an accepted team asset merely because its evidence was supplied.

## Runtime ownership and prerequisites

From `<creative-root>/skills/<method>/`, go up two directories to find the
loaded creative provider root. All demo helper invocations use its absolute
`scripts/` path. Inputs/outputs resolve separately in the operator's selected
workspace; no first-hit search in cwd or other plugin installations is allowed.

| Emitted creative runtime path | Relative module closure |
| --- | --- |
| `plugins/kai-creative/scripts/demo-capture.mjs` | Node built-ins only |
| `plugins/kai-creative/scripts/demo-format.mjs` | `./demo-capture.mjs` |
| `plugins/kai-creative/scripts/demo-narrate.mjs` | `./demo-capture.mjs` |
| `plugins/kai-creative/scripts/demo-zoom.mjs` | `./demo-capture.mjs`, `./lib/cursor-png.mjs` |
| `plugins/kai-creative/scripts/lib/cursor-png.mjs` | Node built-in `node:zlib` |

The four entry points and cursor module move out of personal's generated
runtime. `scripts/demo-narrate.mjs` changes only the provider-specific comment
and missing-tool message; media algorithms, parsing, timing, rendering, and
synthesis mechanics remain unchanged.

`creative: ['lectoria']` replaces personal's runtime declaration; `personal: []`.
The remaining personal course-to-audio role offers **core's**
`kai-core-generate-audio` command rather than executing a personal Lectoria
wrapper, so core retains its independent dependency.

The existing artifact remains pinned, not upgraded or installed:

- Version: `0.1.0`.
- Artifact: `https://github.com/RubenSaucedo/lectoria/releases/download/v0.1.0/lectoria-0.1.0.tgz`.
- Integrity: `sha512-EBC2cPfS8AiCK1VvXPJZbxua6MlhswGwSLiJqXQPlA8Repn6KcvjyfSNMgIp5/04LEzHvK2fEEBSFTA8A9tXWw==`.
- Resolution: `LECTORIA_BIN`, then creative's `node_modules/.bin/lectoria`,
  then PATH. Copilot copying files does not run npm; the operator provisions
  the existing lock with `npm ci --prefix "<creative-root>"` when needed.

External prerequisites are **not asserted installed**:

- Node at the package's declared supported version.
- Windows/PowerShell and ffmpeg `gdigrab` for the emitted capture driver.
- ffmpeg for rendering/mixing/contact sheets; ffprobe for media measurement.
- Lectoria and Azure Speech configuration for paid synthesis only.
- A registered Playwright MCP server for optional browser evidence. Offline
  ASCII/HTML design does not depend on that browser runtime.

`create-product-demo` stays user-invocable and is genuinely loaded by the video
director when deciding placement, so it needs no orphan owner override.
`demo-capture`, `demo-narrate`, and `demo-zoom` retain creative owner overrides
and direct invocation; no dummy agent loads were introduced.

## Evidence and unexecuted scenarios

Only source, inventory, generated-file, and diff inspection is authorized for
this package refactor. The generation sequence is:

```powershell
node scripts/host-contract.mjs --update
npm run docs:generate
npm run pack-preview -- --write
git diff --check
```

Both generation passes completed with exit code 0: inventory reported 56 agents
and 57 skills (the golden inventory stayed unchanged), the catalog was written,
and pack emission reported 39 derived files and 0 managed agent regions.
Whitespace diff inspection produced no findings. Source inventories found each
moved ID only in creative. The five emitted runtime files match their source
after LF normalization; creative's 192 non-root lock entries match personal's
baseline lock entries exactly. These are file-level observations, not runtime
or policy-validator results.

No tests, policy validators, helper checks/self-tests, dependency installation,
recording, synthesis, browser session, or real user task is run. The controller
owns subsequent independent review and the deferred verification phases.

**Runtime unverified:** core-plus-creative invocation on a live host; absent-core
fallback; actual tool discovery; Windows recording/privacy preflight; valid,
failed, and unsettled takes; real zoom/cursor alignment and contact-sheet
judgment; Azure consent/configuration/failure behavior; paid synthesis duration,
no-retry behavior, placement, captions, final-file measurement, and output
completeness. Generated files establish an emitted install surface, not these
runtime outcomes.

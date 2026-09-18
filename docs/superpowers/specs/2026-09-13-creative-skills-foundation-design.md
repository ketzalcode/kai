# Creative skills foundation: signed-off design

**Status:** Final design signed off by the operator on 2026-09-13 at 22:07
(UTC-07:00). Implementation and model calls remain unauthorized.
**Basis:** Source inspection at `ca685d871682fa77f35cac8ce6b213c5e8d90bc5`
(#212), the fresh validation baseline, and the subsequent boundary/naming
discussion.
**Supersedes:** The [initial retain-seven design](2026-09-13-creative-skills-foundation-initial-design.md).
Its source observations remain evidence; its roster recommendations are not
the final decision.

This is a specification, not replacement agent/skill instructions or an
implementation plan. The names below are approved target identities, not
claims that those agents or skills already exist.

## 1. Approved base

### Agents

All three definitions will belong under `plugins\kai-creative\agents\`.
A workflow is a kind of agent, not a separate plugin directory.

| Target identity | Kind | Responsibility | Stopping point |
| --- | --- | --- | --- |
| **creative-lead-design** | Judgment role | Interaction design, visual hierarchy, applied design systems, and visual identity from approved needs and positioning. | Requested design, critique, or revision-bound findings. No product priority, frontend implementation, or unilateral brand adoption. |
| **creative-lead-video** | Judgment role | Audience, message, narrative, scenes, shot choices, and editorial trade-offs; the requested storyboard, script, or screenplay. | Usable direction or explicit evidence gaps. No recording, rendering, synthesis, or publication. |
| **workflow-creative-demo-production** | Bounded workflow | Produce an authorized demo from supplied approved direction and existing media using the necessary production operations. | Actual requested deliverables and their review status, or an explicit incomplete/blocked result. No invented direction, capture, or publication approval. |

The design role combines the responsibilities of the current product and
brand designers. The agent, not a brand skill, owns visual-identity judgment.
Operator approval still governs identity adoption. Product scope and claims,
frontend implementation truth, independent reviews, and exact-revision
acceptance keep their existing authorities.

The video role replaces the current video director. Its use of "lead" denotes
creative judgment, not team dispatch authority.

### Active skills

The approved base has **six active skills**: five intent-specific methods and
the separately retained structural-diagram method.

| Target identity | Scope |
| --- | --- |
| `mockups-ascii` | Layout, grouping, placement, and information hierarchy without visual styling. |
| `mockups-html` | Visual hierarchy, tokens, component appearance, and responsive layouts in offline HTML. |
| `video-create-narration` | Estimate and synthesize approved narration beats into clips with measured durations. |
| `video-align-narration` | Align measured clips to matching recorded states and prepare or execute an authorized mix. |
| `video-render-zoom` | Explain, compile, render, or review declared focus treatments on existing footage. |
| `html-block-diagrams` | Represent established structure in an HTML artifact or exported image. Keep this existing name; no replacement name was selected. |

### Outside the initial active base

| Capability or candidate | Disposition |
| --- | --- |
| `prototype-ui` | Incubate as a future capability: interactive simulations and task-flow behavior, not another static mock. No placeholder skill is created. |
| `video-storyboarding` / earlier `authoring-demo-screenplays` candidate | No separate skills initially. Story, shot planning, and requested screenplay authorship remain craft of the video lead. |
| `designing-visual-identity` | No dedicated skill initially. The designer retains that judgment and craft. |
| `recording-scripted-desktop-takes` / current `demo-capture` skill | Exclude live recording from the active base; preserve the existing skill as an inactive development source when implementation occurs. |
| `demo-format` as a proposed skill | Do not create a wrapper skill merely to expose existing checks. Use `demo-format.mjs` and concise reference/help material. |
| `video-magic-zoom` | Do not adopt. The renderer follows declared focus; it does not discover interesting activity or automatically track subjects. |

Incubation here is a design disposition, not evidence that files have already
moved or that deferred behavior has been tested.

## 2. Ownership and routing

The supported install baseline stays **kai-core plus kai-creative**. No other
capability package must run first when adequate inputs are supplied. Missing
evidence or independent acceptance remains a gap, not a fabricated peer result.

| Request | Owner |
| --- | --- |
| Decide or critique an interface or visual identity | Creative design lead |
| Decide what a video should communicate or prepare its direction | Creative video lead |
| Produce a demo from approved direction and available recordings | Creative production workflow |
| Perform one specified mockup, narration, or focus operation | The matching skill, without a mandatory workflow or preceding agent call |
| Check only a plan's or file's format | The existing format helper, without starting production |

For direct work, the operator requests production and the main assistant may
route it to the workflow. For coordinated work, `director-chief-of-staff`
dispatches it through the existing granting contract. The video lead hands
off direction; it does not automatically launch production or grant another
role work. No new dispatching role or parallel worker chain is introduced.

The workflow consumes a supplied approved screenplay without calling the
video lead. If a creative decision is missing or a fit failure requires a
material script change, it returns that decision to the authorized author
or the existing coordinator; it does not become another video lead.

Within its authorized work, the workflow uses applicable skills itself.
Narration creation, alignment, and zoom are optional operations, not a fixed
sequence. Existing measured audio skips synthesis. Readable footage skips
zoom. A silent demo skips both narration skills.

### Production input boundary after removing capture

The workflow starts from supplied footage. Alignment additionally needs the
matching screenplay, measured take, measured clips, and relevant visual-state
evidence. Footage plus an inspected manual focus plan can support zoom without
a take; that does not make it sufficient for state-based narration alignment.

If the requested result needs an unavailable recording or take, report that
input gap. Do not invoke the excluded capture skill, invent a take, or promise
end-to-end recording. Requests for unsupported recording or interactive UI
prototyping are not silently routed into a near-neighbor method.

## 3. Names and package compatibility

The durable roles use `creative-<posture>-<scope>`. The workflow retains
`workflow-<outcome>`, with creative in its identity for package association.
Skill families describe intent: `mockups-*` and `video-*`.

This requires an explicit taxonomy migration. At the inspected revision,
`scripts\lib\pack-plan.mjs` treats creative as a retired/migration-only agent
family and does not register it as a current durable-role provider family.
Renaming files alone will fail the policy and can break caller resolution.

The later implementation must update the creative-family classification,
owning-package mapping, taxonomy reference, and affected regression tests
together. Preserve supported posture/profile requirements and use the
existing approved model policy. Do not silently rename unrelated agents or
expand this into fleet-wide naming-policy consolidation.

Replace all active references to removed identities in the same change,
including role registries, review requirements, directly loaded contracts,
agent descriptions and bodies, package documentation, catalog, inventory,
and generated packs. An old name is not a compatibility alias by default.
Historical records stay historical; migrations must not fabricate new
review acceptance for an old revision.

Helper command names and JSON schema identifiers are not skill names.
Preserve the existing `demo-*.mjs` commands and data contracts unless a
separate helper change is approved. The capture module supplies parsers used
by zoom, narration, and format helpers: excluding its skill does **not**
authorize deleting that module or breaking its import closure.

Keeping a helper dependency does not re-enable the recording workflow.
The active methods must not route to capture or advertise recording as a
supported step of this base.

## 4. Skill contracts

These are outcome contracts. Skill wording will follow evidence from a later,
separately authorized authoring process. Explicit supported requests take
precedence over automatic-trigger exclusions; unavailable evidence, consent,
or tool capability still limits the operation.

### 4.1 `mockups-ascii`

| Dimension | Contract |
| --- | --- |
| Responsibility | Make a structural UI decision visible through a low-fidelity layout. |
| Non-responsibilities | Brand styling, realistic component fidelity, executable interactions, implementation, or scope/adoption approval. |
| Positive triggers | An explicit ASCII/wireframe request, or an unresolved placement/grouping/hierarchy decision that a structural sketch clarifies. |
| Negative triggers | Color/type/component feel decides the question; interactive behavior needs exercising; a copy-only or settled decision needs no new mock. |
| Required inputs and authority | Approved outcome, fixed/open constraints, and relevant current surface/state evidence. Explicit constraints remain constraints; unknown surfaces are not invented. |
| Smallest useful outcome | One inline ASCII mock or only the real alternatives needed for the decision; insights/no addition when a new mock is unnecessary. No mandatory file, option count, or workspace. |
| Consumers and stop | Operator or delegated designer; the calling design task. Stop at the structural mock and recommendation. No automatic HTML stage or implementation. |

### 4.2 `mockups-html`

| Dimension | Contract |
| --- | --- |
| Responsibility | Make a proposed UI's visual hierarchy, component appearance, or responsive layout reviewable in offline HTML. |
| Non-responsibilities | An interactive task-flow simulator, production frontend code, a new design system by default, or scope/adoption authority. |
| Positive triggers | Explicit HTML mock request; a consequential UI choice depends on appearance or responsive layout rather than structure alone. |
| Negative triggers | ASCII already communicates the decision; a requested prototype needs simulated transitions/behavior; a trivial change needs no new mock. |
| Required inputs and authority | Approved need and constraints, destination/viewports, relevant surface evidence, and current tokens for on-brand fidelity. Neutral proposed values are labeled; screenshots do not establish source-token truth. |
| Smallest useful outcome | One scoped self-contained HTML mock, or only the alternatives the decision needs. No fixed 3-4-option bundle. |
| Consumers and stop | Operator/delegated designer and the authorized design task. Stop at the mock and actual inspection status; do not lock a new choice without its authority or implement it. |

HTML remains offline: inline styling, no CDN/build/dependency setup.
Authoring does not require a browser; claiming rendered fidelity does.
ASCII and HTML are independently selectable methods, not two compulsory
stages. Share grounding and scope contracts rather than duplicate them.

For both mock methods, investigate other containers only when placement is
open and those surfaces are evidenced. A fixed constraint is not silently
demoted to a hypothesis. Coordinated design acceptance remains separate from
the operator's choice among options.

### 4.3 `video-create-narration`

| Dimension | Contract |
| --- | --- |
| Responsibility | Estimate speech and, with explicit paid-run authorization, synthesize approved narration beats into measured clips. |
| Non-responsibilities | Owning the script/story, placing speech on a video timeline, mixing, capture, voice cloning, or publication. |
| Positive triggers | Explicit narration estimate or synthesis request. Estimation may precede capture. |
| Negative triggers | Silent demo; supplied usable clips need no synthesis; a narration request alone does not authorize spending or external disclosure. |
| Required inputs and authority | Current screenplay narration beats accepted by the existing helper; for synthesis, approved text, voice/language, charge/disclosure consent, and configured tools. Core factual provenance governs product copy. |
| Smallest useful outcome | Estimate insights only, or actual clips plus `demo_narration_take.json` with measured durations and visible failures. No mandatory recording, zoom, or alignment. |
| Consumers and stop | Operator, authorized script author, and the alignment method. Stop after the requested estimate/synthesis stage and report actual paths and failed clips. |

Use the estimate/synthesis operations of the existing narration helper.
Keep credentials outside inputs and artifacts. A new paid attempt needs new
authorization; no automatic retry. An estimated duration is not a measurement,
and partial synthesis is not a narrated video.

### 4.4 `video-align-narration`

| Dimension | Contract |
| --- | --- |
| Responsibility | Place measured clips against evidenced recorded states and prepare or execute an authorized composition. |
| Non-responsibilities | Automatic synthesis, script rewriting, invented offsets, hiding latency by stretching/freezing, caption production, or publication. |
| Positive triggers | Explicit placement/mix request with compatible supplied measurements and media. |
| Negative triggers | Missing take/clip correspondence; failed relevant states; stale text; unknown visual-state timing; no narration to align. Missing clips do not authorize synthesis. |
| Required inputs and authority | Screenplay, corresponding measured take, measured matching clips, and relevant footage evidence; mixing also needs a compatible final video and distinct output path. Take action times alone do not prove state visibility. |
| Smallest useful outcome | Fit/rejection insights, a placement plan, a printed mixing command, or an actually mixed file, according to the request. |
| Consumers and stop | Production workflow/operator; fit defects return to the authorized author. Stop at the requested operation. A command is not an executed mix; a successful encode is not independent acceptance. |

Use the existing placement/mix helper operations. No zoom pass is mandatory.
Inspect all relevant states, including interior states and `start_after`,
before relying on a placement result; section 6 records the helper's weaker
automatic checks. Missing visibility evidence stays unresolved.

### 4.5 `video-render-zoom`

| Dimension | Contract |
| --- | --- |
| Responsibility | Explain/compile declared focus or render/review a focus treatment of existing footage. |
| Non-responsibilities | Recording, choosing the story, automatic activity/subject tracking, invented cursor telemetry, or feature/publication certification. |
| Positive triggers | Explicit focus operation; an evidenced legibility issue in authorized video production. |
| Negative triggers | Already-readable footage with no requested zoom; missing media for an operation that needs it; a direction-only request. |
| Required inputs and authority | Focus plan, or screenplay and matching take for compilation; actual source frames for manual measurements. ffmpeg for rendering; ffprobe for measured duration/audio facts. Supplied intent chooses emphasis, evidence establishes coordinates/times. |
| Smallest useful outcome | Feasibility/no-focus insights; the requested plan, command, render, or review sheet. No invented zoom to fill an empty plan. |
| Consumers and stop | Production workflow/operator and a visual reviewer. Stop at the requested operation and its real inspection status. No automatic narration. |

Accept external recordings and manually inspected measurements. Distinguish
source coordinates from the fitted output frame. Surface clamping, skipped
segments, missing duration evidence, and failed/unsettled conditions.
Compilation and a contact sheet are not proof the intended result was visible.

### 4.6 `html-block-diagrams`

| Dimension | Contract |
| --- | --- |
| Responsibility | Represent established layers, lanes, linear sequences, containment, or comparisons in an HTML/image destination. |
| Non-responsibilities | UI mockups, architecture invention, brand-system creation, or a document created only to justify a picture. |
| Positive triggers | Explicit structural-diagram request, or a supported relationship materially improves an existing HTML/image deliverable. |
| Negative triggers | Clear prose needs no diagram; CSS markup in GitHub Markdown; a branching graph outside this block-layout method. |
| Required inputs and authority | Established entities/relationships, labels, destination dimensions, and supplied visual constraints. Example palettes, statuses, and paths are not subject facts. |
| Smallest useful outcome | Arrangement context, the requested diagram contribution, or no addition. Include only meaningful fields. |
| Consumers and stop | Designer or author of an HTML report, lesson, board, slide, or image. Stop at the contribution and actual inspection status, not a new cross-package workflow. |

Retain this separate capability rather than fold structural diagrams into
mockups. Load substantial CSS/examples progressively. Preserve captions,
semantics, long-label/wrapping checks, and offline output. Do not claim
overlap is impossible or inherit a previous palette's validation claim.
Engineering's `build-diagrams` is an optional neighbor, not a prerequisite.

## 5. Source dispositions and caller integration

| Current source | Approved treatment |
| --- | --- |
| `principal-product-designer` and `principal-brand-designer` agents | Combine into the creative design lead; explicitly preserve visual-identity authority, interaction review obligations, and external acceptance boundaries. |
| `creative-video-director` agent and `video-direction` skill | Combine role judgment and necessary story/shot-planning craft into the video lead; retain detailed formats only as needed supporting material, not a separately activated storyboarding skill. |
| `create-product-demo` skill | Split its ownership: production procedure becomes the workflow; format policy/checks remain the existing helper and concise reference/help material. Retire the old active skill. |
| `ui-mockup` skill | Refine into the two independently selectable mockup methods, with shared contracts rather than duplicated process. |
| `demo-narrate` skill | Split creation from alignment/composition; preserve their real helper input contracts and separate consent/measurement boundaries. |
| `demo-zoom` skill | Refine and rename to the declared-focus method. |
| `demo-capture` skill | Preserve inactive outside exported plugin sources; remove active routes. Preserve the helper/parser dependency needed by the remaining methods. |
| `html-block-diagrams` skill | Retain separately and refine its applicability, progressive references, and evidence claims. |

The [initial assessment](2026-09-13-creative-skills-foundation-initial-design.md#5-caller-and-loaded-contract-corrections)
records the actual inspected caller contradictions. Apply these constraints
to the final owners, not to the superseded retain-seven roster:

- Remove fixed option/bundle quotas from callers and return shapes as well as
  skills. A concept need not produce five files; a live-demo screenplay must
  not acquire a competing timestamped narration timeline.
- In `kai-core-design-grounding`, allow adequate scoped evidence for a bounded
  mock without forcing a new design-system file. Requested durable system
  derivation retains its evidence/coverage and acceptance requirements.
- In `kai-core-scope-discipline`, a direct inline suggestion does not
  initialize coordination. Intentional durable/coordinated proposals still
  follow the existing scope-owner and backlog rules.
- Update design-owner references in shared grounding, design acceptance,
  core coordinator routing, frontend, product exploration, and relevant
  review requirements. Combining brand and product design must not erase
  identity adoption, frontend feasibility, PM acceptance, or QA independence.
- Preserve core content provenance and per-span claim treatment. Load them
  for claimful content, not a generic arithmetic estimate.
- Make the first-other-core probe ordering explicit in the final agents,
  with the same-paragraph fallback and on-demand routes. No eager skill list.
- Resolve all helpers from the loaded creative provider, not cwd or another
  installed pack. Adjust provider-root calculations for agent versus skill
  locations where necessary.
- Preserve existing workspace lanes and asset custody/acceptance contracts.
  A method may produce no durable asset; it may not hide an unclassified one.

The role consolidation, workflow introduction, and creative-family naming
change are now explicitly in scope. Wider fleet redesign, new granting
authority, interactive prototype implementation, recording re-entry, media
algorithm redesign, and baseline repair are not.

## 6. Evidence boundaries the methods must not overclaim

These are source observations at the inspected revision, not new runtime
experiments or claims about complete regression coverage.

| Current helper boundary | What it establishes | Required reporting boundary |
| --- | --- | --- |
| `demo-capture.mjs`, `emitDriver` | Action `end` is recorded before optional settle sleep; quiet-screen waiting is limited to targeted typing. Geometry comes from preflight targets. | A supplied take's action times/status do not prove UI success or state visibility. Removing capture from the base does not improve old take evidence. |
| `demo-format.mjs`, `checkProvenance` | Step-ID sets and statuses match; render bytes and unchanged-ID screenplay edits are not bound. | ID matching is not full revision/file provenance certification. |
| `demo-format.mjs`, `checkMutedComprehension` | Captions are declared, not inspected. | Report the declaration and any actual caption/readability evidence separately. |
| `demo-format.mjs`, `checkWordBudget`, `checkAll` | A forecast can fail the policy; `ok` can be true for `INCOMPLETE`. | Preserve the actual verdict, forecast provenance, skipped checks and missing inputs; exit zero is not a complete pass. |
| `demo-zoom.mjs`, `compile` | Failed/missing emphasized steps can be skipped with notes; not every unsettled state is rejected. | Surface the notes and bad-state evidence; compilation is not a visual guarantee or a repaired take. |
| `demo-narrate.mjs`, `place` | Failed/unsettled checks cover span endpoints, not all interior states or an interior gate's status. | Inspect relevant states and visibility before relying on composition. Do not claim automatic whole-span enforcement. |

The foundation does not fix these algorithms or add schemas through wording.
Future automatic state-arrival measurement, whole-span enforcement, revision
binding, or caption validation needs its own approved helper changes and
deterministic coverage. Without evidence needed for honest composition, stop
with the gap rather than claim a validated demo.

## 7. Authoring and acceptance requirements

Use the engineering foundation's lessons without copying its roster:
context/insights/artifact/no addition are all valid; caller instructions and
loaded references matter; supplied inputs do not prove facts; source-contract
RED, model behavior, renderer results, and host acceptance are distinct.

Descriptions identify triggers, not abbreviated workflows. Role descriptions
distinguish ownership from neighbors. Skill bodies contain reusable technique,
not an agent's identity, lifecycle, or a retelling of one incident.
Use positive outcome recipes for output-shape problems, required fields for
real consumer contracts, observable predicates for conditional behavior, and
operation-local prohibitions for consent or false-measurement risks.

Implementation and any model authoring screen require separate approval.
Do not prewrite all candidate skills or run a speculative package campaign.
For an approved edit, preserve the current source/caller/reference context,
establish the appropriate failing case first, and work one method at a time.
A later wording comparison uses no-target-guidance, unchanged, and candidate
arms with at least five fresh samples per wording arm, exact IDs/hashes and
manual reading. Inconclusive or already-working controls are not efficacy RED.

| Boundary | Future acceptance cases |
| --- | --- |
| Design lead | UI versus identity requests route to the same owner without losing operator adoption or independent design acceptance. No fake independent brand reviewer. |
| Video lead | Concept-only, scene plan, and requested screenplay stay proportional; no forced bundle, production, or storyboarding-skill dependency. |
| Production workflow | Supplied approved media skips direction; existing clips skip synthesis; clear footage skips zoom; missing take blocks only dependent operations; no capture fallback or worker-per-stage chain. |
| ASCII mocks | Layout-only and fixed-container cases; no styling claims, HTML dependency, option quota, or workspace requirement. |
| HTML mocks | Supplied scoped tokens, offline output, target viewport, single requested mock; no automatic ASCII stage or interactive prototype expansion. |
| Narration creation | Estimate before capture; explicit paid consent; measured versus estimated duration; failed clips; no automatic retry or placement. |
| Narration alignment | Supplied clips; stale text, interior bad state, absent visibility evidence, and incompatible render; printed command is not mixed output; no automatic synthesis. |
| Zoom | External footage with inspected manual focus; compile-only; no focus needed; missing duration evidence and compiler skips remain explicit. |
| Structural diagrams | No-diagram outcome, supported HTML destination, minimal fields, long labels, narrow/dark rendering when later authorized; not a UI mock. |
| Surface migration | Old active identities/routes replaced, excluded capture not discoverable as a skill, parser dependencies intact, new creative taxonomy enforced, generated source/install parity. |

Preserve sample provenance and the distinction between arithmetic, real
rendering, accessibility, host discovery, cloud synthesis, and publication.
No design sign-off or passing source test certifies those runtime behaviors.

## 8. Baseline and release constraints

The [fresh baseline](../../reference/skill-evaluation/creative-foundation-baseline-2026-09-13.md)
and its raw logs/hashes remain unchanged historical evidence. With supported
Node `v24.15.0`, `npm test` failed at **53 source-validator errors** after the
foundation guard passed. Of the remaining 17 individually invoked stages,
15 exited zero and two failed: pack self-test and all-gates/version-skew.
The first three named pack gates completed before version-skew crashed.

The four existing media helper self-tests reported 238 checks passing in
total. No live discovery, recording, render inspection, synthesis, or mixing
was performed. That baseline neither validates the new identities nor
resolves the helper limitations above.

Implementation must rerun current validation and report unresolved baseline
failures without waiving or weakening them. Identity removal, splits and
consolidation are breaking surface changes under the post-1.0 release policy.
Prepare the appropriate coordinated version/changelog/README update,
catalog/inventory and generated packs in the eventual implementation change;
no release metadata changes belong to this design-only sign-off.

## 9. Sign-off and authorization

Decision history:

1. The operator initially approved a retain-seven design, then reopened role
   ownership, naming, workflow scope, and skill granularity.
2. The operator accepted the three agent boundaries and proposed the
   intent-based skill families, excluding recording and a dedicated
   visual-identity skill from the initial base.
3. At 22:07 on 2026-09-13 the operator signed off the final recommendation:
   the three agents, five intent-specific skills plus the retained structural
   diagram skill, and the deferred/reference-only dispositions in section 1.

This approval supersedes the initial roster decision. It does not authorize
implementation, an implementation plan, model calls, paid synthesis,
recording, publication, or repair of unrelated repository failures.
Only design records and baseline evidence exist from this work; runtime
sources, installed plugins, and package metadata have not been changed.

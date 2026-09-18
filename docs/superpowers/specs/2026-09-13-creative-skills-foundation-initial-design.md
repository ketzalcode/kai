# Creative skills foundation: superseded initial design

**Status:** Historical source assessment and initial design, superseded.
The initial retain-seven direction was approved earlier on 2026-09-13, then
reopened during the agent/skill ownership and naming discussion. The
[final signed-off design](2026-09-13-creative-skills-foundation-design.md)
replaces its roster, dispositions, and implementation scope. Recommendations
below are historical, not current instructions. Implementation and model calls
remain unauthorized.
**Date:** 2026-09-13.
**Inspected revision:** `ca685d871682fa77f35cac8ce6b213c5e8d90bc5` (#212).
**Scope:** The seven skills in `plugins\kai-creative\skills\`, their relevant
callers, loaded contracts, and helper interfaces.
**Authorization:** Evaluation, design, and fresh repository validation only.
No skill, agent, helper, plugin manifest, or installed plugin has been changed. No
model samples, paid calls, recordings, or renderer experiments were run.

## 1. Recommendation and alternatives

**Recommended: retain seven entry points and refine their contracts.** They
serve distinct decisions or operations. Consolidate duplicated instructions
into their existing owners, not into a new workflow. Load detailed craft and
formats only when the requested output needs them.

| Approach | Benefit | Cost / decision |
| --- | --- | --- |
| **Retain the seven IDs; refine scope, inputs, outputs, and caller seams** | Preserves direct use and existing tool interfaces while removing unnecessary work. | Requires a small number of coupled core/caller corrections. **Recommended.** |
| Combine direction and demo planning, or combine all production methods | Fewer discoverable entries. | Conflates story decisions, format checks, live desktop actions, rendering, and paid synthesis. Makes bounded use harder and consent less clear. Not recommended. |
| Incubate the video or entire creative surface until broad runtime evidence exists | Makes the lack of certification conspicuous. | Removes useful planning and independently useful, deterministically exercised tools without evidence that every method lacks a useful remit. Not recommended on the present evidence. |

Every skill receives **refine**, rather than unchanged retain: each has a
specific source-level scope, output, or evidence problem described below.
This is not a measured claim that any candidate wording performs better.
No whole skill is recommended for combination or incubation now. Future
evaluation can change that recommendation; engineering's incubation decision
is not a template to apply to unrelated creative methods.

## 2. Engineering lessons applied, not copied

The [engineering foundation](../../reference/engineering-coding-foundation.md)
and its [implementation decisions](../plans/2026-09-13-engineering-coding-foundation.md#implementation-decisions)
establish useful constraints:

- A method may contribute context, insights, an artifact, or no addition.
  Its result does not cancel the caller's independently authorized work.
- Inspect the instruction actually loaded, including core contracts and
  return templates. Fixing a narrow skill cannot neutralize a contrary caller.
- Supplied adequate evidence does not require an upstream agent to run.
  Procedural instructions are not evidence for product or media claims.
- Structural contract failures, model behavior, renderer results, and live
  host acceptance are different evidence classes.
- A working control is non-regression evidence, not a fabricated behavioral
  RED. Inconclusive samples do not justify a larger campaign by default.
- Keep exact input/output identities and provenance. A merge or prepared
  version does not establish passing validation or publication.

Creative differs from the engineering foundation: some outputs are genuinely
machine-consumed JSON or media. Their necessary fields are not formatting
theater. The design removes unrequested companion artifacts and unnecessary
stage ordering, not the integrity information a real consumer requires.

## 3. Package boundaries

The install baseline remains **kai-core plus kai-creative**. There is no new
package, router, coordinating agent, shared mega-skill, or mandatory sibling
installation. Existing agent IDs, skill IDs, command entry points, and JSON
schema identifiers remain unchanged by this proposal.

| Owner | Responsibility | Explicitly outside |
| --- | --- | --- |
| `kai-creative` visual methods | Show a UI choice; represent supplied structure in HTML/image output. | Product priority, new product claims, technical architecture decisions, frontend implementation. |
| `kai-creative` video direction | Concept, narrative, editorial handoff, or live-interface screenplay as requested. | Recording, executed edits, synthesis, publication, inventing product behavior. |
| `kai-creative` demo format | Destination constraints and scoped plan/final-file findings. | Owning the story, automatically running the production pipeline, certifying interest or truth. |
| `kai-creative` production methods | Separately authorized capture, focus rendering, and narration operations. | New direction by implication, fabricated measurements, accepting risk or publishing. |
| `kai-core` | Source/provenance treatment, design grounding, scope and authority, workspace and durable-asset lifecycle. | Creative craft, automatic file quotas, a compulsory upstream content producer. |
| Other capability packages | Optional product evidence, implementation truth, factual context, independent review, personal voice, or technical diagram craft. | Prerequisites for a bounded response when adequate inputs are supplied. |

The product designer retains interaction judgment, the brand designer retains
identity judgment, and the video director retains direction judgment.
This proposal changes only caller clauses that contradict a skill boundary;
it does not redesign their roles or general workflows.

### Routing and result rules

The actual request determines the method and its stopping point. A reference
to another stage describes a possible consumer, not permission to run it.
Negative triggers below exclude automatic activation; they do not cancel an
explicit supported artifact request. Missing authority, evidence needed for
the operation, or format support remains a real limit.

An explicit full-production request may compose the necessary stages, but it
does not make zoom or narration mandatory. Already usable footage can skip
capture. A narration estimate can precede capture. A capture-only request ends
at its take. A format-only request does not rewrite the screenplay.

No extra artifact is needed for an unchanged decision, a copy-only correction,
an already-clear structural explanation, a readable video needing no focus,
or a silent demo needing no narration. A requested artifact that cannot be
produced is a named gap, not a successful "no addition" result.

## 4. Per-skill evaluation and proposed contracts

These are design requirements, not replacement skill text. Positive and
negative triggers describe intended applicability; current descriptions have
not been experimentally evaluated.

### 4.1 `ui-mockup` - refine

**Current source:** [skill](../../../plugins/kai-creative/skills/ui-mockup/SKILL.md).
It has valuable offline and desired-state visual discipline, but requires
3-4 options, defaults to token-driven HTML, and presents Playwright as a
prerequisite even though ASCII and static HTML do not need it. Its caller
repeats the quota and container challenge. Its own standalone fallback
conflicts with loaded grounding/scope obligations that can demand files.

| Contract dimension | Proposed boundary |
| --- | --- |
| Responsibility | Make an unresolved, consequential UI choice visually decidable at the lowest sufficient fidelity. |
| Non-responsibilities | Product scope/priority, brand adoption, a full interaction specification, production code, independent design acceptance. |
| Positive triggers | Explicit UI mockup request; materially different layout, hierarchy, placement, or interaction choices whose difference needs to be seen. |
| Negative triggers | Pure copy, trivial spacing, a settled choice, or a question adequately answered without a visual. No automatic options ceremony during every review. |
| Required inputs | Decision and approved outcome; fixed versus open constraints; relevant current surface/state evidence; destination/viewports. Tokens are required only for claims of fidelity to the real design system. |
| Source authority | Explicit operator constraints remain constraints. Current design-system and source-token evidence establish actual values; screenshots establish observed appearance, not implementation tokens. Neutral proposed values stay labeled. |
| Smallest useful outcome | **Artifact:** inline ASCII or a scoped offline HTML mock. **Insights/no addition:** explain why no new mock is needed. Show only real alternatives; no minimum option count. An explicit request for one mock need not generate alternatives. |
| Consumers and stop | Operator/delegated designer makes the choice; the calling design work consumes it. Stop at visual options and recommendation or the requested mock. Do not lock a new decision without its existing authority, implement it, or manufacture a team item. |

A crowding problem warrants examining existing alternative surfaces **when
placement is open and such surfaces are evidenced**. It does not justify
inventing a relocation or ignoring a hard placement constraint. If no viable
alternative exists, say so. Out-of-scope ideas remain proposals, not the
recommended in-scope solution.

HTML remains offline and self-contained. Browser capability is needed for
rendered inspection, not for ASCII or HTML authorship. Keep human/delegated
choice and coordinated exact-revision acceptance distinct. No renewed
approval gate for an already authorized choice.

### 4.2 `html-block-diagrams` - refine

**Current source:** [skill](../../../plugins/kai-creative/skills/html-block-diagrams/SKILL.md).
The five arrangements and standalone CSS are useful specialized craft.
However, every invocation loads the full stylesheet/examples; the card
description suggests four fields whether or not the data has them. "Overlap
impossible" and "palette ... verified" are broader than a new artifact's
evidence. The graph branch mandates Mermaid regardless of the destination.

| Contract dimension | Proposed boundary |
| --- | --- |
| Responsibility | Represent established layers, lanes, linear sequences, containment, or comparisons in an HTML artifact or an image made from one. |
| Non-responsibilities | Inventing structure, UI screen design, technical architecture, brand-system creation, choosing a new document to justify a diagram. |
| Positive triggers | Explicit HTML/block-diagram request; a supported structural view materially improves an existing HTML/image deliverable. |
| Negative triggers | No useful structural relationship; an ordinary critique; CSS markup in GitHub Markdown; graph routing outside this method's supported craft. |
| Required inputs | Established entities and relationships, labels, destination/size, supplied visual constraints. Brand tokens only when branded fidelity is required. |
| Source authority | Supplied facts or accepted decisions establish structure; approved tokens establish brand. Example palettes, statuses, and artifact paths are not facts about the subject. |
| Smallest useful outcome | **Context:** suitable arrangement/craft advice. **Artifact:** only the diagram contribution requested. **No addition:** retain the caller's existing prose or artifact without a diagram. |
| Consumers and stop | Author of the HTML lesson, report, identity board, slide, or image. Stop at the supported contribution and its actual inspection status; do not start engineering's diagram workflow or create another artifact. |

Move substantial CSS and arrangement examples to one progressively loaded
companion under this skill. Keep the trigger, choice of arrangement, minimal
fields, offline rule, caption/semantic requirements, and evidence limits in
the body. Detailed examples stay useful; they do not become mandatory fields.

For a genuine branching graph, report the boundary and use an authorized
destination-supported alternative. Do not add a Mermaid dependency to an
offline HTML deliverable. Engineering's `build-diagrams` remains optional,
not a required install or preceding call.

### 4.3 `video-direction` - refine

**Current source:** [skill](../../../plugins/kai-creative/skills/video-direction/SKILL.md).
Typed assets, separate clocks, claim grounding, and the screenplay seam are
substantive. The unconditional five-file bundle, sixth live-demo file, and
duplicated director instructions obscure smaller useful requests. A live demo
can acquire competing timestamped and state-based voiceover representations.

| Contract dimension | Proposed boundary |
| --- | --- |
| Responsibility | Turn an authorized video objective and adequate evidence into the requested creative direction or editorial handoff. |
| Non-responsibilities | Product fact discovery/positioning, rendering, desktop actions, paid synthesis, AI-provider execution, other-channel copy, publication. |
| Positive triggers | Explicit concept, storyboard, edit plan, script, generation-prompt, or live-demo screenplay request; an unresolved direction decision needed by an authorized video task. |
| Negative triggers | Format-only checking; capture/focus/mix of approved inputs; a generic factual question; supplied direction needing no change. Direct user invocation is not rejected merely because a director can call the method. |
| Required inputs | Objective, audience, constraints, and requested handoff. Factual JSON for product claims. Media catalog entries and available metadata for assets actually used. No catalog quota for a concept using no existing media. |
| Source authority | `product_context.json` and core provenance treatment govern product claims. Manifest availability/path and `shows` govern existing asset use. Descriptions and metadata do not prove footage was watched. Estimated editorial timing is labeled. |
| Smallest useful outcome | **Insights:** a bounded concept/decision. **Artifact:** only the requested script, storyboard, edit handoff, prompts, or screenplay and the dependencies its real consumer requires. No empty generation file or five-file quota. |
| Consumers and stop | Operator, editor, generation tool user, or a separately authorized demo method. Stop at direction, unresolved evidence, and actual requested paths. Do not execute the downstream work. |

Preserve existing filenames and schemas when that handoff is requested.
Existing-footage handoffs distinguish source trims from final-timeline
positions and share IDs across the outputs actually produced. A cut event
expresses both video and audio intent, including `none` when appropriate;
it does not imply every visual cut requires an audible interruption.

A live-interface demo uses `demo_screenplay.json` as its canonical action and
narration intent. State-based beats do not gain authored source offsets.
An accompanying brief or editorial estimate must not become a second
executable audio timeline. Generated-shot prompts exist only for requested,
identified missing shots; reference-only media is not final footage.

Keep complex schema examples in a method-owned reference, loaded for an
actual structured handoff. Core owns claim treatment; the director owns role
authority; the skill owns the method. Do not copy all three into each other.

### 4.4 `create-product-demo` - refine

**Current source:** [skill](../../../plugins/kai-creative/skills/create-product-demo/SKILL.md).
The independent format checker warrants a separate entry point. Its discovery
text and opening workflow overlap direction, while the production route
automatically pairs capture with zoom. The duplicated placement table and
strong provenance/sound-off claims exceed the helper's narrower checks.

| Contract dimension | Proposed boundary |
| --- | --- |
| Responsibility | Advise on destination constraints and report exactly what the existing format checker establishes about a supplied plan or final file. |
| Non-responsibilities | Story ownership, automatic screenplay revision, mandatory media production, truth/interest/readability certification, upload/publication. |
| Positive triggers | A destination/length/size/caption decision; explicit plan-format or finished-file checking. |
| Negative triggers | A settled story needing no format decision; unrelated video direction; capture-only, zoom-only, or narration-only work with adequate constraints. |
| Required inputs | For advice: destination, audience/purpose, actual hard constraints. For executable plan checks: valid screenplay including placement and capture fields required by the parser. Take and rendered file are required only for checks that consume them. |
| Source authority | Operator commitments set explicit limits. `demo-format.mjs` defines current checker policy. Dated platform observations are not permanent or freshly verified platform facts. Actual final-file duration/size comes from the file and probe, not a take estimate. |
| Smallest useful outcome | **Context:** placement constraints. **Insights:** checker findings, including warnings, failures, skipped checks, and not-applicable results. No new plan/report file unless requested or owed by the handoff. |
| Consumers and stop | Director/operator before capture; production caller afterward. Stop at the requested decision or scoped findings. Do not silently rewrite, record, render, synthesize, or upload. |

Use the existing `--placements` output for exact current profiles rather
than maintaining an independent table. A conceptual question does not require
command execution; missing execution capability limits checker execution, not
advice. Core factual grounding loads only when drafting product claims.

Report the helper's actual verdict, not just exit code or `ok`. It can return
`INCOMPLETE` without a failing exit. Duration defaults warn, but its word-budget
heuristic can currently fail: call that a forecast/policy failure, never a
measured inability to fit. Do not silently change checker grading in a skill
rewrite.

### 4.5 `demo-capture` - refine

**Current source:** [skill](../../../plugins/kai-creative/skills/demo-capture/SKILL.md).
Recording consent, privacy, Windows limitations, clock calibration, and
pointer provenance are valuable. The final compile/render/review section
crosses its capture boundary. The helper's own usage footer also presents
compilation as the next step.

| Contract dimension | Proposed boundary |
| --- | --- |
| Responsibility | Validate supplied capture intent, prepare a readable driver, or record an explicitly authorized real take with its telemetry. |
| Non-responsibilities | Choosing the story, product validation, focus rendering, narration, publication, general desktop automation. |
| Positive triggers | Explicit capture preflight, driver emission, or recording of an approved live-interface screenplay. |
| Negative triggers | Planning approval alone does not authorize recording. Existing usable footage needs no recapture without a request. Live recording is blocked on an unsupported host/action or absent consent; preflight/driver preparation remain separate operations. No dependency on a director's authorship. |
| Required inputs | Screenplay; selected operation and output paths. Driver emission also needs resolved targets. Recording needs a prepared Windows desktop, current preflight evidence, approved region/actions/exact typed text, and consent. |
| Source authority | Screenplay establishes intent. Preflight establishes the observed layout; target rectangles are configured geometry used by the driver, not proof the UI stayed there. The take records action timings and pointer samples, not product success. |
| Smallest useful outcome | **Insights:** preflight findings. **Artifact:** driver only, or actual raw recording plus matching take for a recording request. A refusal states the concrete missing requirement. |
| Consumers and stop | Operator/production caller, optionally focus/narration methods. Stop at the requested capture stage, exact emitted paths, and failed/unsettled/unknown conditions. Driver emission is not recording. |

Keep consent immediately before live action and do not treat a plan approval
as recording consent. Capture data remains private evidence. Remove automatic
compile/render work from the capture method; describe optional consumers
without invoking them. A bad take is not repaired by downstream composition.

### 4.6 `demo-zoom` - refine

**Current source:** [skill](../../../plugins/kai-creative/skills/demo-zoom/SKILL.md).
Declared focus, source/fitted geometry, clamping, and review tooling have a
distinct consumer. The body nevertheless begins by recording, disparages
all manual plans as memory-based, and says compilation prevents visual
mistakes "by construction."

| Contract dimension | Proposed boundary |
| --- | --- |
| Responsibility | Explain/compile declared focus or render/review an authorized focus treatment of existing footage. |
| Non-responsibilities | Capture, story selection, activity detection, invented cursor telemetry, feature verification, narration, publication. |
| Positive triggers | Explicit focus-plan/zoom request; evidenced legibility problem in a real recording for an authorized production task. |
| Negative triggers | Already-readable output with no requested zoom; missing recording for an operation needing footage; a planning-only direction request. |
| Required inputs | Operation and output paths; supplied focus plan, or screenplay plus matching take for compilation. Real recording for frame inspection/render, ffmpeg for rendering, ffprobe for measured duration/audio facts. |
| Source authority | Supplied editorial intent chooses emphasis. Take telemetry or actual source-frame inspection supplies times/positions. Output-fit geometry differs from source geometry. Manual measurements are valid; invented measurements are not. |
| Smallest useful outcome | **Context/insights:** explain feasibility or no focus needed. **Artifact:** requested compiled plan, printed command, render, or review sheet only. Empty focus is not permission to invent a zoom. |
| Consumers and stop | Production caller, human visual reviewer, optional narration. Stop at the authorized operation and actual evidence. Compilation/encoding is not a visually accepted or publishable demo. |

Accept external recordings without forcing recapture. Resolve scripts from
the loaded creative provider. Report missing ffprobe evidence even if ffmpeg
can encode. A contact sheet with no focus segments is not a required empty
deliverable; normal visual inspection can still be needed for a requested
normalization-only render.

### 4.7 `demo-narrate` - refine

**Current source:** [skill](../../../plugins/kai-creative/skills/demo-narrate/SKILL.md).
Separate authored intent, measured clips, placement, and mixing are useful.
Paid-run consent and failure visibility must stay. "After a take is compiled
and rendered, never before" contradicts its own estimate operation and the
helper's independently callable synthesis/placement operations.

| Contract dimension | Proposed boundary |
| --- | --- |
| Responsibility | Estimate, synthesize when explicitly authorized, place measured speech, or prepare/execute an authorized mix against an established recording timeline. |
| Non-responsibilities | Owning video direction, capture or zoom, inventing times, altering latency to fit copy, automatic rewriting, voice cloning, music, captions production, publication. |
| Positive triggers | Explicit narration estimate, approved synthesis, placement, or mix request. |
| Negative triggers | Silent demo; generic video request without narration authority; no paid consent for synthesis; incompatible/missing measurements for placement. No compulsory capture/zoom before an estimate. |
| Required inputs | Estimate: screenplay beats. Synthesis: approved script/voice/language, charge/disclosure consent, configured tool. Placement: screenplay, corresponding take, measured matching clips and relevant state evidence. Mixing: accepted placement, available clips, compatible existing video, distinct output path and execution authority. |
| Source authority | Core provenance for product copy; screenplay for authored text/state intent; synthesizer measurements for speech duration; take for action timing; actual inspected footage for visual-state/readability judgments. Estimates and action end times do not prove visibility. |
| Smallest useful outcome | **Context/insights:** estimate or fit/rejection findings. **Artifact:** requested narration take, placement plan, mixing command, or actually mixed file. No mandatory full pipeline or report bundle. |
| Consumers and stop | Operator, script author for fit defects, production caller. Stop at the requested operation. Printed mixing command is not an executed mix; partial synthesis is not a narrated demo. |

Separate four predicates: estimation needs intent; synthesis needs paid
consent; placement needs measurements and a valid matching take; mixing
needs the final compatible video. None requires a zoom pass as such.
Text changes go back to the authorized author; any new paid attempt needs
new consent. Keep measured durations, failed clips, and unavailable evidence
visible. Never silently turn a missing clip into acceptable silence.

## 5. Caller and loaded-contract corrections

This is the complete proposed **behavioral edit boundary**, not permission
to refactor every file listed. Conditions appear at the instruction needing
them, not in a new eager dependency list.

| Source inspected | Contradiction / obligation | Narrow proposed treatment |
| --- | --- | --- |
| `plugins\kai-creative\agents\principal-product-designer.agent.md` | Required inputs, steps 3-5, hard rules 8-9, REVIEW fork and artifact shape reimpose design-system derivation, option count, container challenge, and confirmation fields. Brief placements are universally demoted to hypotheses. | Permit scoped supplied grounding without a new reference file; respect fixed constraints; conditional visual options and evidence-based container exploration. Keep review findings separate from design authorization and coordinated acceptance. Make the options section conditional, not a quota. |
| `plugins\kai-core\skills\kai-core-design-grounding\SKILL.md` | Consume/derive rule and collaboration seam require deriving/refreshing a full reference before design, even when a supplied narrow token inventory is enough for a bounded mock. | Distinguish using sufficient scoped evidence from authoring a durable design system. Only requested/owed derivation requires the reference artifact and its scoped coverage. Preserve provenance, new-token proposals and genuine acceptance/FE feasibility obligations. |
| `plugins\kai-core\skills\kai-core-scope-discipline\SKILL.md` | Unonboarded proposals require onboarding and a durable backlog, despite callers permitting inline standalone options. | An inline, non-adopted suggestion in a direct answer need not initialize coordination. Intentional durable/coordinated proposal recording still follows the existing workspace/backlog rules. Do not change scope ownership. |
| `plugins\kai-creative\agents\creative-video-director.agent.md` | Framing/intelligence prerequisites, workflow 3-6, boundaries and return shape require context/catalog paths and all five artifacts, duplicate timing/narration details, and demand the placement skill even when inputs are settled. | Require factual/media inputs for the claims/assets actually used; consume the selected direction contract; list actual requested outputs, not five path slots. Preserve source/estimated/live timing distinctions. Route format advice only for a format decision/check. No production execution added. |
| `plugins\kai-core\skills\kai-core-content-grounding\SKILL.md` | JSON-only authority and per-span ledger are real shared obligations, not removable by a creative skill. | **Retain unchanged.** Route only for claimful content, not for a generic format/estimate operation. Do not reconstruct JSON facts from chat or duplicate the treatment table. |
| `plugins\kai-creative\agents\principal-brand-designer.agent.md` | HTML-diagram route is already conditional. Its broader brand-option quota is outside the changed skill. | Preserve its diagram predicate; no brand-workflow redesign. Any schema/craft detail stays in the method. |
| All three creative agent core-probe paragraphs | Current validator rejects them for not stating the first-other-core ordering explicitly. They do say to load the probe then operating rules. | Make the ordering obligation explicit when editing these routes; retain same-paragraph fallback. Treat this as source-validator conformance, not proof core was misordered in a live run. |
| `demo-capture`, `demo-zoom`, `demo-narrate`, `create-product-demo` bodies and helper usage text | Capture-to-render, zoom-to-recapture, after-render-only narration, and pipeline-next-step wording can override operation-local stopping. | Conditional consumer references; no successor execution unless independently authorized. Helper usage/footer edits, if needed, are documentation corrections only. |
| `kai-core-workspace-paths`, `kai-core-workspace-initiative`, `kai-core-asset-producing`, `kai-core-asset-closing` | Govern actual output lanes, accepted revisions, and durable custody. Asset production explicitly allows no durable asset. | **Retain unchanged.** Invoke for actual workspace/durable work, not to invent files. Existing private review/run lanes and publication authority remain. |
| `docs\reference\packages\kai-creative.md` and generated catalog | Current package document repeats 3-4 options and five/six artifacts; catalog mirrors discovery descriptions. | Update current expectations with the approved contracts; regenerate the catalog after source changes. Historical proposals/evidence remain historical. |

The operating-rules and contract-probe bodies were also inspected. Their
human-only spend/publication/risk gates and role ownership are preserved.
Lease, item, activity, peer-communication, and initiative lifecycle redesign
are outside this evaluation; nothing here claims a full audit of that
transitive coordination subsystem.

The design-grounding paragraphs in `principal-swe-frontend` and the
DESIGN-SYSTEM-EXTRACT branch in `workflow-product-explore` were inspected too.
Keep their existing implementation-truth and requested neutral-extraction
contracts. A bounded mock is not acceptance of a new production design
system. The core correction must preserve these branches and the brand
designer's deliberate system-evolution work; add boundary coverage rather
than expanding their workflows.

No new engineering diagram caller is required. `build-diagrams` already
permits no diagram and destination-specific representations. Its optional
HTML seam must not become a cross-package prerequisite.

## 6. Evidence boundaries the methods must not overclaim

Helper source was inspected because it is the real consumer/provider of the
demo contracts. These findings are source observations, not new runtime
experiments or a claim that the current self-tests cover the gaps.

| Source boundary | What the current implementation establishes | Design consequence |
| --- | --- | --- |
| `scripts\demo-capture.mjs`, `emitDriver` | Records action start/end; `end` is taken before the optional settle sleep. Only targeted typing performs the quiet-screen wait. Rectangles come from preflight targets. | Neither `end` nor `status: ok` proves an outcome appeared. Narration visibility needs actual relevant footage evidence; do not describe take geometry as a fresh UI measurement. |
| `scripts\demo-format.mjs`, `checkProvenance` | Compares step-ID sets and statuses; does not bind render bytes or establish identical screenplay content with unchanged IDs. | Report these checks exactly. Revision/file correspondence must have a separate evidenced basis; an ID match is not full provenance certification. |
| `scripts\demo-format.mjs`, `checkMutedComprehension` | Accepts declared captions; does not inspect a caption file or rendered captions. | "Captions declared" is not proof of readable sound-off delivery. Preserve the declaration result and the actual visual-review gap. |
| `scripts\demo-format.mjs`, `checkWordBudget`, `checkAll` | Forecast above the heuristic margin can be `FAIL`; `ok` can be true for `INCOMPLETE`. | Preserve actual result, forecast provenance and missing checks. No "defaults can never fail any check" or exit-zero-equals-pass assertion. |
| `scripts\demo-zoom.mjs`, `compile` | Skips failed/missing emphasized steps with notes; does not reject every unsettled step or prove legibility. | Inspect the take and compiler notes; do not call compilation a guarantee or a repaired bad take. |
| `scripts\demo-narrate.mjs`, `place` | Checks the span endpoints for failed/unsettled status, not every interior state or the status of an interior `start_after` step. | Before relying on placement, inspect every relevant recorded state and gate. Reject known bad states; missing correspondence/visibility evidence remains unresolved. Do not attribute a stronger automatic refusal to the helper. |

The recommended foundation does **not** redesign these algorithms or add
new time/identity schemas. It must accurately expose their limits rather than
erase failures, silently reinterpret results, or claim machine enforcement
that does not exist. A future promise of automatic whole-span validation,
revision binding, caption validation, or measured state-arrival times requires
a separate approved helper change and deterministic regression coverage.

The source-level narration checks above are judgment obligations, not a
claim that a prompt supplies mechanical guarantees. If the evidence required
for honest composition is unavailable, return the placement/visibility gap
and do not claim a validated narrated composition.

## 7. Guidance structure and validation design

### Guidance form

Use writing-skills' failure classification rather than a blanket list of
prohibitions:

| Problem to evaluate | Appropriate form |
| --- | --- |
| Excess options, repeated reports, mandatory companion artifacts | Positive outcome recipe keyed to the requested decision/output. |
| Missing consent, falsified measurements, production beyond authority | Clear operation-local prohibition and concrete stopping condition. |
| Omitted provenance or required machine field | Required field in the actual consumer contract, not repeated prose reminders. |
| Behavior depends on intent, available media, or output format | Observable conditional, not an unconditional workflow followed by exceptions. |

Descriptions should identify when to load the skill, not summarize its
workflow. Do not rename IDs solely for naming style or optimize to a word
quota. Move substantial reference detail, preserve the context needed for
safe application, and avoid narrative incident retellings in the hot path.

### Future evidence, not authorization to run it

Implementation and any model-based authoring screen need separate approval.
No campaign is authorized by accepting these package boundaries.

For an approved skill edit, first preserve the current skill, caller and
actually loaded references. Use deterministic tests for mechanical contracts
and observed failing applicability/output cases for behavior claims.
Evaluate one skill at a time; do not prewrite seven candidates or launch a
package-wide sample batch.

A later wording screen should use a no-target-guidance control, unchanged
guide, and candidate with the surrounding instructions held constant.
Use at least five fresh-context samples per wording arm, read every flagged
output, record variance, and stop if the control/current case does not
discriminate. A source-contract RED is reported as structural evidence, not
rebranded as an actor failure. Discipline cases combine realistic pressures;
reference/craft cases exercise retrieval and application.

| Method | Positive case | Negative / caller boundary |
| --- | --- | --- |
| UI mockup | Two real UI alternatives using a supplied narrow token inventory; a single requested mock. | Copy-only correction; fixed container; no browser; missing design-system file; REVIEW finding without authority to redesign. |
| HTML diagram | Offline structural diagram with only evidenced labels; long labels at the actual target width. | Clear prose needs no diagram; GitHub Markdown destination; a branching graph must not silently introduce a renderer dependency. |
| Video direction | Concept-only request; existing-footage cut; standalone live-demo screenplay. | No missing generated shots; no five-file quota; missing factual authority excludes claims; director must not reimpose the bundle. |
| Demo format | Placement advice without a screenplay; supplied plan/final-file checker request. | Missing take/render remains incomplete; unchanged IDs are not revision proof; caption declaration is not a rendered check; no automatic production. |
| Capture | Preflight-only, driver-only, and separately consented capture requests. | Plan approval without recording consent; existing footage; bad take; capture must not continue into render. |
| Zoom | Existing external recording with inspected focus measurements; compile-only request. | Readable output needs no added zoom; failed/unsettled take; absent duration evidence; compiler notes cannot disappear. |
| Narration | Estimate before capture; supplied measured clips and valid state evidence; mix-only request. | Paid consent absent; interior bad state; result appears after action end; stale text; missing clips; printed command is not mixed output. |

For the two shared-core corrections, also preserve requested design-system
derivation/extraction, frontend feasibility of changed tokens, brand identity
evolution, and durable coordinated proposal recording. Allowing a direct
inline recommendation must not remove real acceptance, scope, or custody
requirements.

Later media/browser execution, where authorized, must distinguish parse and
arithmetic results from rendered geometry, readability, accessibility, actual
capture, cloud synthesis, host discovery, and publication. These are not
interchangeable passes.

Preserve sample IDs, exact arm mapping, task/caller/reference versions,
model/configuration, raw outputs, and hashes before summarizing. State any
normalization. No historical evidence export should be reconstructed by
hand. Do not claim isolation, behavioral improvement, savings, or cross-model
acceptance without corresponding evidence.

## 8. Fresh baseline and release boundary

The [fresh validation record](../../reference/skill-evaluation/creative-foundation-baseline-2026-09-13.md)
is tied to the inspected merge revision, not inferred from #212.

With supported Node `v24.15.0`, `npm test` passes the foundation guard and
fails at the source validator with **53 errors**. Separately running the
remaining 17 stages yields **15 zero exits and two nonzero exits**:
pack self-test and all-gates execution. The latter reaches a distinct crash
in version-skew after partition, collision and partial-install report clean.
This is not a passing repository baseline.

The demo helper self-tests report 89 zoom, 41 capture, 57 narration and 51
format checks passing. Source/generated helper parity and pack generation
parity also pass. None establishes the untested behaviors in section 6 or a
live core-plus-creative installation.

Existing baseline repair is separate work. No waiver, weakened test, release
claim, version bump, catalog regeneration, or generated-pack rewrite belongs
to this design-only change.

If implementation is approved later, the repo's release rules still apply:
coordinated version/changelog/README metadata, generated catalog when needed,
pack regeneration, and fresh validation with unresolved failures explicit.
Assess semver against the approved observable output changes; preserving IDs
alone does not make a changed output contract nonbreaking.

## 9. Historical approval boundary

The operator selected **Approve design only** on 2026-09-13, approving:

1. Seven retained creative IDs with the refined responsibilities and
   operation-local stopping points above.
2. Conditional outputs rather than fixed option/bundle quotas, with required
   fields retained for actual machine/editor consumers.
3. The named caller and two narrow shared-core corrections; no wider agent,
   coordination, schema, or media-algorithm redesign.
4. Honest helper limitations and separately gated future authoring/runtime
   evidence.

This initial approval was superseded by the final design sign-off at
22:07 local time on 2026-09-13. Preserve this document for the source assessment
and decision history, not as authority to implement the retain-seven roster.
No implementation or model campaign was authorized by either design approval.

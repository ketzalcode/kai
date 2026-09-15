# Creative Skills Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the creative surface with the signed-off three agents and six intent-specific skills, preserving source history, useful helper contracts, and honest evidence.

**Architecture:** Plugin-local Markdown remains authoritative. Existing Node source collectors, package generators, helper modules and deterministic assertions enforce the surface; no new router, execution service, or media schema is introduced.

**Tech Stack:** Markdown, Node ESM and node:assert, existing npm scripts, Git worktrees, GitHub CLI.

**Spec:** [Signed-off creative foundation](../specs/2026-09-13-creative-skills-foundation-design.md).

**Status:** Tasks 1-6 are implemented and reviewed. Whole-branch review found
one parser-invalid video screenplay example; `09bf732` fixes it and scoped
re-review accepted the correction. The [execution/evidence record](../../reference/skill-evaluation/creative-foundation-authoring.md)
retains all outcomes and limits. Draft PR #213 remains blocked by 50 existing
source-validator errors and the pre-existing pack self-test/version-skew crashes.
No merge, tag, release, or live-host/media acceptance is claimed.

## Global Constraints

- The supported install baseline stays **kai-core plus kai-creative**.
- The active methods must not route to capture or advertise recording as a supported step of this base.
- Preserve the existing `demo-*.mjs` commands and data contracts unless a separate helper change is approved.
- No new dispatching role or parallel worker chain is introduced.
- No implementation of interactive prototypes, independent brand/storyboarding skills, or recording re-entry.
- No baseline repair, unrelated family migration, media algorithm redesign, paid speech synthesis, desktop recording, or release publication.
- Supported Node: `^22.22.2 || ^24.15.0 || >=26.0.0`; reuse the existing cached `v24.15.0` through process-local PATH.
- Worktree: `C:\src\kai\.worktrees\creative-skills-foundation`; branch: `kai/refactor/creative-skills-foundation`; base: `ca685d871682fa77f35cac8ce6b213c5e8d90bc5`.
- Authoring cap: 120 fresh-context comparison samples plus 16 boundary samples, authorized on 2026-09-14. One method at a time, no speculative campaign, no automatic over-budget retry.
- Commit with `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`. Push only this task branch and open the requested PR; no merge, tag, or release.

## File map and handoffs

| Files | Owner / outcome |
| --- | --- |
| `scripts\lib\pack-plan.mjs`, `scripts\lib\incubation-contract.mjs`, `scripts\validate-plugin.mjs` | Creative taxonomy, active ownership, inactive historical-source recognition; preserve unrelated failures. |
| `test\creative-foundation-self-test.mjs` | Deterministic taxonomy, inventory, source contract, caller and emitted-helper coverage. |
| `incubator\kai-creative\agents\*.agent.md`, `incubator\kai-creative\skills\*\SKILL.md`, `incubator\kai-creative\README.md` | Preserve replaced definitions as inactive history; recording alone is a re-entry candidate. |
| `plugins\kai-creative\skills\mockups-ascii\SKILL.md`, `mockups-html\SKILL.md` | Independent structure and visual-fidelity methods. |
| `plugins\kai-creative\skills\video-create-narration\SKILL.md`, `video-align-narration\SKILL.md`, `video-render-zoom\SKILL.md` | Operation-local media methods over unchanged helpers. |
| `plugins\kai-creative\skills\html-block-diagrams\SKILL.md`, `references\catalog.md` | Conditional block-diagram craft and progressive examples. |
| `plugins\kai-core\skills\kai-core-design-grounding\SKILL.md`, `kai-core-scope-discipline\SKILL.md` | Scoped supplied-input and standalone-proposal seams, without weakening authority. |
| `plugins\kai-creative\agents\creative-lead-design.agent.md`, `creative-lead-video.agent.md`, `workflow-creative-demo-production.agent.md` | Consolidated judgment and separate bounded production. |
| `plugins\*\agents\*.agent.md`, relevant `plugins\kai-core\skills\*\SKILL.md` | Exact old-owner replacements and narrow caller obligations; no unrelated rewrite. |
| `docs\reference\skill-evaluation\creative-foundation\` | Cases, frozen guide inputs, retained actor outputs, manifests and scoped evidence. |
| `docs\reference\packages\kai-creative.md`, current docs and `test\README.md` | Current contracts, migration, runtime limits and evidence entry points. |
| `scripts\generate-catalog.mjs`, `test\fixtures\inventory.json`, release manifests, changelog, README, generated packs | Final surface and coordinated `9.0.0` breaking release metadata, not publication. |

## Evidence procedure for each changed skill

Preserve baseline source/callers before editing. An evidence-only test worker
may run fresh actor subagents; implementers do not spawn helpers or reviewers.
Each of the six active methods plus the two shared-core seams has a maximum
15 comparison samples (five control, five current, five candidate) and two
boundary samples. Use an available low-cost model, recorded exactly.

The actor receives the fixed case plus only its assigned guide/caller context,
performs the requested bounded response, and retains its exact output under
its predetermined ID. No actual recording, synthesis, renderer, or product
state change is allowed. The evidence worker reads every output and records
failures and limits, never just the actor's self-assessment.

Controls already working and unchanged guides already respecting a case are
non-regression, not behavioral RED. Mechanical source-contract RED may still
justify the approved interface correction. Do not invent efficacy.
Freeze each candidate before its five samples. Record original bytes/hashes,
model/configuration, arm and case IDs, and any unavoidable harness context.
Never reconstruct historical outputs manually or silently switch labels.

## Task 1: Preserve source and establish migration guards

**Files:** Source collectors/taxonomy/history modules, creative inactive sources,
`test\creative-foundation-self-test.mjs`, taxonomy reference.

**Interfaces:** Preserve exported `agentTaxonomyErrors`, `incubatedIds`,
`documentationReferenceExists`, `sourceAgentFiles`, `sourceSkillFiles`,
`materializePacks`, and `collectReferences`. Add creative to the existing
family mapping; do not remap personal/prod/gtm baseline policy.

- [x] Add failing assertions before changing the taxonomy/history functions:

```js
assert.deepEqual(agentTaxonomyErrors({
  id: 'creative-lead-design', pack: 'creative',
}), []);
assert.ok(agentTaxonomyErrors({
  id: 'creative-lead-design', pack: 'engineering',
}).length > 0);
assert.ok(agentTaxonomyErrors({
  id: 'creative-boss-design', pack: 'creative',
}).length > 0);
```

- [x] Run `node test\creative-foundation-self-test.mjs`; preserve the actual RED.
- [x] Preserve exact original three agent and six replaced skill definitions
  in `incubator\kai-creative\` without rewriting their bodies. Keep the active
  originals until their replacement task is ready.
- [x] Generalize inactive discovery across owning-package directories, keeping
  active collectors unchanged. Historical documents may reference preserved
  inactive IDs; active instructions and current documentation may not.
- [x] Preserve the current historical-prefix policy. Add only exact evidence
  paths needed for the creative baseline and immutable diagram guide sample;
  do not exempt every reference/evidence directory.
- [x] Add creative as a current role family, retain only principal/director as
  migration-only families, and preserve the existing profile/model mapping.
- [x] Exercise temporary fixtures for multiple incubator owners, unknown IDs,
  active-source rejection, and helper dependency preservation. Re-run the
  focused guard and engineering foundation guard, then commit this task.

## Task 2: Refine the two shared-core input seams

**Files:** The two core SKILL.md files and their source assertions/evidence.
**Consumes:** Existing scope/provenance rules.
**Produces:** No-new-reference-file scoped grounding and no-onboarding direct
proposal behavior, retaining full coordinated derivation/acceptance.

- [x] Run baseline authoring cases separately for each core skill before editing.
- [x] Add source-contract assertions for the observable direct versus durable
  predicate, not a blanket exemption or exact paragraph snapshot.
- [x] Grounding case: a supplied current token inventory covers a bounded
  component question; answer without deriving an app-wide design system.
  Boundary: an explicitly requested durable system extract still needs
  requested coverage and provenance; changed tokens retain FE/owner review.
- [x] Scope case: a direct unonboarded advisory request can return an unadopted
  proposal inline. Boundary: coordinated adoption and durable backlog writing
  still require the existing authority and workspace contracts.
- [x] Apply only the two signed-off seams, then run candidate and boundary
  samples for each skill, finish evidence and focused assertions, and commit.

## Task 3: Split UI mock methods and preserve structural diagrams

**Files:** Two new mock skills, existing HTML diagram skill/companion, inactive
original `ui-mockup`, source assertions and evidence.
**Consumes:** Refined core seams.
**Produces:** `mockups-ascii`, `mockups-html`, retained `html-block-diagrams`.

- [x] Evaluate each method independently using its fixed current-source case.
  ASCII: explicit structural mock with a fixed container and no browser.
  HTML: one offline mock from supplied scoped tokens, no option quota.
  Diagram: prose-sufficient critique versus explicit structural HTML output.
- [x] Add focused RED assertions for exact IDs, trigger-only descriptions,
  no mandatory option count, independent format selection, and no production
  code/prototype expansion.
- [x] Author ASCII and HTML outcomes separately; share core rules through
  conditional routes. Browser absence limits rendered claims, not authorship.
- [x] Move substantial diagram CSS/examples to
  `html-block-diagrams\references\catalog.md`; preserve useful craft without
  mandatory four-field cards, guaranteed-overlap claims, or forced Mermaid.
- [x] Remove active `ui-mockup` only once both replacements exist. Preserve
  its original in incubation, then verify the per-method candidate/boundary
  outputs and catalog emission. Commit the task.

## Task 4: Separate media creation, alignment, and declared focus

**Files:** Three new video methods, inactive originals, source assertions/evidence.
**Consumes:** Unchanged helpers and current screenplay/take/clip schemas.
**Produces:** `video-create-narration`, `video-align-narration`,
`video-render-zoom`, with independent operation predicates.

- [x] Baseline each method before its edit: estimate before capture; placement
  using existing measured clips with a bad interior state; focus-only from
  supplied external footage and an inspected manual plan.
- [x] Add source-contract RED for the six dimensions of every method plus
  provider-root resolution, consent, and actual-output reporting.
- [x] Creation wraps only estimate/synthesis; alignment wraps placement/mix,
  never automatically synthesis; focus accepts footage without recapture.
- [x] Carry exact helper limitations from spec section 6. Reject known bad
  relevant states before relying on composition; missing visual evidence stays
  a gap. Do not change helper algorithms or falsely attribute stronger checks.
- [x] Preserve paid consent/no retry, measured-versus-estimated durations, and
  command-versus-executed-output distinctions.
- [x] Run candidate/boundary samples per method and source/helper assertions.
  Remove active old narration/zoom definitions once replacements exist and
  commit. Capture remains preserved until final active routing is replaced.

## Task 5: Replace creative roles and wire all active consumers

**Files:** Three new agents, active caller files, pack registry and catalog,
current docs, source assertions; retire remaining old creative sources.
**Consumes:** Final six skill IDs and unchanged helper operations.
**Produces:** Exactly three creative agents and six creative skills.

- [x] Add the active inventory and emission RED:

```js
assert.deepEqual(sourceAgentFiles(root).filter(x => x.pack === 'creative')
  .map(x => x.id).sort(), [
  'creative-lead-design', 'creative-lead-video',
  'workflow-creative-demo-production',
]);
assert.deepEqual(sourceSkillFiles(root).filter(x => x.pack === 'creative')
  .map(x => x.id).sort(), [
  'html-block-diagrams', 'mockups-ascii', 'mockups-html',
  'video-align-narration', 'video-create-narration', 'video-render-zoom',
]);
```

- [x] Create concise agents with the existing judgment model for leads and
  procedure model for workflow. No agent gains lease-granting or publication
  authority. All first-core routes and same-paragraph fallbacks are explicit.
- [x] Consolidate interaction and identity craft in the design lead, retaining
  independent revision-bound design review, operator adoption, PM acceptance,
  frontend feasibility, and QA independence.
- [x] Keep scene/story/screenplay direction in the video lead, proportional
  to the request. No five-file bundle or separate storyboarding skill.
- [x] Production consumes supplied approved direction/media; no capture fallback,
  mandatory zoom/speech, or worker-per-stage dispatch. Missing direction returns
  to the author; operator/core coordinator is the caller.
- [x] Replace exact active old-agent references in all plugin bodies and current
  docs. Replace old-skill routes intentionally, not by blind name substitution.
  Preserve historical originals and old review records as historical.
- [x] Update `NEW_AGENT_IDS`, creative skill ownership overrides, category entries,
  any affected reviewer/role maps and source collector assertions. Keep
  `DISPATCHING_ROLES` unchanged.
- [x] Retire active `video-direction`, `create-product-demo`, `demo-capture`
  and the old three agents. Keep `scripts\demo-capture.mjs` and its emitted
  parser closure. No inactive ID appears in active route or emitted skill paths.
- [x] Regenerate catalog/inventory and packs to check closure, inspect every
  new diagnostic relative to the baseline, then commit.

## Task 6: Release metadata, review and pull request

**Files:** Version metadata, changelog, README, catalog/inventory/generated
packs, package reference, test guide, implementation evidence and PR body.
**Consumes:** Three-agent/six-skill inventory, actor evidence and exact baseline.
**Produces:** Truthful `9.0.0` preparation and the requested PR, not a release.

- [x] Run `npm version 9.0.0 --no-git-tag-version`; match root `plugin.json`,
  marketplace metadata and all entries. No dependency changes/install.
- [x] Add dated 2026-09-14 `CHANGELOG.md` section and compare link. Update README
  Status version/counts and explain that prepared metadata is not publication.
- [x] Run `node scripts\host-contract.mjs --update`, `npm run docs:generate`,
  and `npm run pack-preview -- --write` from the isolated worktree.
- [x] Wire the creative guard into existing npm/CI entry points. Run both
  foundation guards, the four unchanged demo self-tests, catalog, inventory,
  generated parity, syntax and the release guard against the actual base/head.
- [x] Run `npm test`, then independently run later stages hidden by fail-fast.
  Preserve raw current failures and compare them with the recorded baseline;
  do not count the collection shell's zero exit as a suite pass.
- [x] Independently review the whole branch for spec compliance, missing callers,
  broken imports/registries, evidence mapping, and new defects. Fix in-scope
  findings and recheck the affected paths without repairing unrelated failures.
- [x] Commit release/evidence updates, push only this task branch, and create
  the PR with the exact verified outcome and remaining blockers. If repository
  gates still fail, open it as draft and explain why.

## Coverage and execution decisions

The alignment v1 response fixture incorrectly called its screenplay valid
while setting `intends_to_show` to `saved search confirmation`. The real parser
rejects that value; replacing it with `intended-outcome` makes the fixture
parse. Preserve the original input and ten actor outputs as excluded fixture
history, not as an executable-case comparison. Use a corrected `case-v2.md`
with five matched no-guide controls and five candidate samples; do not mix
the old current-guide arm into the v2 comparison. This adds five calls to the
planned total, keeping the expected total at 116 comparison and 16 boundary
invocations after the shared mockup baseline savings. No efficacy claim
against the unchanged guide is supported by this replacement.

The evidence guard protects the issued five-sample primary schedules, with
the explicitly declared two-arm alignment-v2 exception and excluded v1 calls
still charged to the global cap. Per-method starting budgets are not authority
to exceed the operator's absolute 120/16 cap.

The first alignment candidate caught the unsettled gate in all five valid-v2
responses, but four gave ambiguous or incorrect recording-versus-speech
remediation. Its failed results remain evidence, not invalid-fixture exclusions.
Refine the source with an explicit failed-input repair recipe and stale-plan
invalidation, then run five new candidate-v3 comparisons on the same v2 case
and repeat the two existing boundaries against that new guide. Preserve the
v2 guide and outputs alongside v3.

Reallocate the remaining cap rather than exceed it: zoom keeps its three
five-sample comparison arms but one boundary; the HTML structural-diagram
method uses five no-guide controls and five candidates, no sampled old-guide
arm, and one boundary. Alignment therefore has 25 comparison invocations
(including ten excluded v1 calls) and four boundaries across two candidate
versions. The expected aggregate remains 116 comparisons and 16 boundaries.
This supports no model comparison against the old structural-diagram guide
and narrows separate boundary coverage for zoom/diagrams.

Spec sections 1-3 and 5 map to Tasks 1 and 5; each skill in section 4 maps to
Tasks 3-4; core seams map to Task 2; unchanged helper limitations map to Tasks
4-6; authoring/acceptance and release constraints map to every task and Task 6.

Candidate skill wording is intentionally not prewritten before its RED
observations. The spec's outcome contracts and the explicit cases above,
not an untested prompt template, are the implementer's authority.

The 53 validator errors and pack self-test/version-skew crashes are baseline
failures, not waivers. Creative-owned ordering/family issues may legitimately
disappear; unrelated failures must remain explicit. Preserve evidence and
never manufacture a pass to make the PR look complete.

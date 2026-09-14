# Creative Skills Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the creative surface with the signed-off three agents and six intent-specific skills, preserving source history, useful helper contracts, and honest evidence.

**Architecture:** Plugin-local Markdown remains authoritative. Existing Node source collectors, package generators, helper modules and deterministic assertions enforce the surface; no new router, execution service, or media schema is introduced.

**Tech Stack:** Markdown, Node ESM and node:assert, existing npm scripts, Git worktrees, GitHub CLI.

**Spec:** [Signed-off creative foundation](../specs/2026-09-13-creative-skills-foundation-design.md).

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

- [ ] Add failing assertions before changing the taxonomy/history functions:

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

- [ ] Run `node test\creative-foundation-self-test.mjs`; preserve the actual RED.
- [ ] Preserve exact original three agent and six replaced skill definitions
  in `incubator\kai-creative\` without rewriting their bodies. Keep the active
  originals until their replacement task is ready.
- [ ] Generalize inactive discovery across owning-package directories, keeping
  active collectors unchanged. Historical documents may reference preserved
  inactive IDs; active instructions and current documentation may not.
- [ ] Preserve the current historical-prefix policy. Add only exact evidence
  paths needed for the creative baseline and immutable diagram guide sample;
  do not exempt every reference/evidence directory.
- [ ] Add creative as a current role family, retain only principal/director as
  migration-only families, and preserve the existing profile/model mapping.
- [ ] Exercise temporary fixtures for multiple incubator owners, unknown IDs,
  active-source rejection, and helper dependency preservation. Re-run the
  focused guard and engineering foundation guard, then commit this task.

## Task 2: Refine the two shared-core input seams

**Files:** The two core SKILL.md files and their source assertions/evidence.
**Consumes:** Existing scope/provenance rules.
**Produces:** No-new-reference-file scoped grounding and no-onboarding direct
proposal behavior, retaining full coordinated derivation/acceptance.

- [ ] Run baseline authoring cases separately for each core skill before editing.
- [ ] Add source-contract assertions for the observable direct versus durable
  predicate, not a blanket exemption or exact paragraph snapshot.
- [ ] Grounding case: a supplied current token inventory covers a bounded
  component question; answer without deriving an app-wide design system.
  Boundary: an explicitly requested durable system extract still needs
  requested coverage and provenance; changed tokens retain FE/owner review.
- [ ] Scope case: a direct unonboarded advisory request can return an unadopted
  proposal inline. Boundary: coordinated adoption and durable backlog writing
  still require the existing authority and workspace contracts.
- [ ] Apply only the two signed-off seams, then run candidate and boundary
  samples for each skill, finish evidence and focused assertions, and commit.

## Task 3: Split UI mock methods and preserve structural diagrams

**Files:** Two new mock skills, existing HTML diagram skill/companion, inactive
original `ui-mockup`, source assertions and evidence.
**Consumes:** Refined core seams.
**Produces:** `mockups-ascii`, `mockups-html`, retained `html-block-diagrams`.

- [ ] Evaluate each method independently using its fixed current-source case.
  ASCII: explicit structural mock with a fixed container and no browser.
  HTML: one offline mock from supplied scoped tokens, no option quota.
  Diagram: prose-sufficient critique versus explicit structural HTML output.
- [ ] Add focused RED assertions for exact IDs, trigger-only descriptions,
  no mandatory option count, independent format selection, and no production
  code/prototype expansion.
- [ ] Author ASCII and HTML outcomes separately; share core rules through
  conditional routes. Browser absence limits rendered claims, not authorship.
- [ ] Move substantial diagram CSS/examples to
  `html-block-diagrams\references\catalog.md`; preserve useful craft without
  mandatory four-field cards, guaranteed-overlap claims, or forced Mermaid.
- [ ] Remove active `ui-mockup` only once both replacements exist. Preserve
  its original in incubation, then verify the per-method candidate/boundary
  outputs and catalog emission. Commit the task.

## Task 4: Separate media creation, alignment, and declared focus

**Files:** Three new video methods, inactive originals, source assertions/evidence.
**Consumes:** Unchanged helpers and current screenplay/take/clip schemas.
**Produces:** `video-create-narration`, `video-align-narration`,
`video-render-zoom`, with independent operation predicates.

- [ ] Baseline each method before its edit: estimate before capture; placement
  using existing measured clips with a bad interior state; focus-only from
  supplied external footage and an inspected manual plan.
- [ ] Add source-contract RED for the six dimensions of every method plus
  provider-root resolution, consent, and actual-output reporting.
- [ ] Creation wraps only estimate/synthesis; alignment wraps placement/mix,
  never automatically synthesis; focus accepts footage without recapture.
- [ ] Carry exact helper limitations from spec section 6. Reject known bad
  relevant states before relying on composition; missing visual evidence stays
  a gap. Do not change helper algorithms or falsely attribute stronger checks.
- [ ] Preserve paid consent/no retry, measured-versus-estimated durations, and
  command-versus-executed-output distinctions.
- [ ] Run candidate/boundary samples per method and source/helper assertions.
  Remove active old narration/zoom definitions once replacements exist and
  commit. Capture remains preserved until final active routing is replaced.

## Task 5: Replace creative roles and wire all active consumers

**Files:** Three new agents, active caller files, pack registry and catalog,
current docs, source assertions; retire remaining old creative sources.
**Consumes:** Final six skill IDs and unchanged helper operations.
**Produces:** Exactly three creative agents and six creative skills.

- [ ] Add the active inventory and emission RED:

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

- [ ] Create concise agents with the existing judgment model for leads and
  procedure model for workflow. No agent gains lease-granting or publication
  authority. All first-core routes and same-paragraph fallbacks are explicit.
- [ ] Consolidate interaction and identity craft in the design lead, retaining
  independent revision-bound design review, operator adoption, PM acceptance,
  frontend feasibility, and QA independence.
- [ ] Keep scene/story/screenplay direction in the video lead, proportional
  to the request. No five-file bundle or separate storyboarding skill.
- [ ] Production consumes supplied approved direction/media; no capture fallback,
  mandatory zoom/speech, or worker-per-stage dispatch. Missing direction returns
  to the author; operator/core coordinator is the caller.
- [ ] Replace exact active old-agent references in all plugin bodies and current
  docs. Replace old-skill routes intentionally, not by blind name substitution.
  Preserve historical originals and old review records as historical.
- [ ] Update `NEW_AGENT_IDS`, creative skill ownership overrides, category entries,
  any affected reviewer/role maps and source collector assertions. Keep
  `DISPATCHING_ROLES` unchanged.
- [ ] Retire active `video-direction`, `create-product-demo`, `demo-capture`
  and the old three agents. Keep `scripts\demo-capture.mjs` and its emitted
  parser closure. No inactive ID appears in active route or emitted skill paths.
- [ ] Regenerate catalog/inventory and packs to check closure, inspect every
  new diagnostic relative to the baseline, then commit.

## Task 6: Release metadata, review and pull request

**Files:** Version metadata, changelog, README, catalog/inventory/generated
packs, package reference, test guide, implementation evidence and PR body.
**Consumes:** Three-agent/six-skill inventory, actor evidence and exact baseline.
**Produces:** Truthful `9.0.0` preparation and the requested PR, not a release.

- [ ] Run `npm version 9.0.0 --no-git-tag-version`; match root `plugin.json`,
  marketplace metadata and all entries. No dependency changes/install.
- [ ] Add dated 2026-09-14 `CHANGELOG.md` section and compare link. Update README
  Status version/counts and explain that prepared metadata is not publication.
- [ ] Run `node scripts\host-contract.mjs --update`, `npm run docs:generate`,
  and `npm run pack-preview -- --write` from the isolated worktree.
- [ ] Wire the creative guard into existing npm/CI entry points. Run both
  foundation guards, the four unchanged demo self-tests, catalog, inventory,
  generated parity, syntax and the release guard against the actual base/head.
- [ ] Run `npm test`, then independently run later stages hidden by fail-fast.
  Preserve raw current failures and compare them with the recorded baseline;
  do not count the collection shell's zero exit as a suite pass.
- [ ] Independently review the whole branch for spec compliance, missing callers,
  broken imports/registries, evidence mapping, and new defects. Fix in-scope
  findings and recheck the affected paths without repairing unrelated failures.
- [ ] Commit release/evidence updates, push only this task branch, and create
  the PR with the exact verified outcome and remaining blockers. If repository
  gates still fail, open it as draft and explain why.

## Coverage and execution decisions

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

# Remaining Capability Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The operator has authorized continuous execution and one PR after all packages are complete; do not stop for another per-package approval.

**Goal:** Finish creative, product, marketing, revenue, and learning so all eight approved packages are present with their functional source and install surfaces.

**Architecture:** Each task moves its agents and methods together, preserving domain craft while replacing bulk inheritance with task-local routes. Keep required skills and runtime consumers in their owning package or core, accept supplied artifacts instead of compulsory sibling calls, and retire the two emptied legacy packages. One final integration task updates live docs and release metadata and opens the PR.

**Tech Stack:** Markdown agents/skills, existing Node.js ESM package generators and media helpers, JSON manifests and existing runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-12-package-boundaries-design.md`

**Baseline:** `03c5b2c` (assistant merged in #209); prepared metadata `6.0.0`.

## Global Constraints

- Packages describe useful capabilities a user installs, not agent prefixes or an organizational reporting chart.
- There is one owning package for each agent and skill, not duplicate copies.
- The supported baseline for a capability package is **core plus that package**.
- Finish coherent packages with their agents and skills together, before developing more interactions between packages.
- Keep the final safety, behavioral, and test/CI consolidation after the refactor and its two refinement passes. Red intermediate checks are accepted.
- Deferring a safety-review phase does not permit removing consent, privacy, factual-grounding, or authority boundaries.
- Preserve all existing agent IDs and domain responsibilities in this phase.
- Core, engineering, and assistant are signed off. Change only necessary live references/install documentation there, not their operating design.

**Evidence policy:** no baseline install, TDD cycle, full suite, self-tests,
policy-validator invocation, or diagnostic-count cleanup in these tasks.
Artifact generation, inventory/ownership inspection, and source review are
required. A generated package is not a runtime-verified agent.

---

## Shared file and interface map

| Surface | Action |
| --- | --- |
| `plugins/<owner>/agents/*.agent.md` | Move once; retain craft and authoritative boundaries; route methods when needed |
| `plugins/<owner>/skills/<id>/` | Move complete directory; preserve schemas, companions, and factual guarantees |
| `scripts/lib/pack-plan.mjs` | Update existing ownership, runtime dependency, and description declarations |
| `scripts/generate-catalog.mjs` | Correct the affected editorial groups and method membership |
| `.github/plugin/marketplace.json` | Add the owning package entry with the same canonical description/version as its manifest |
| `plugins/<owner>/{plugin,package,package-lock}.json` and routed `scripts/` | Generate; never hand-edit copies |
| `docs/reference/packages/<owner>.md` | One compact package note: responsibilities, direct use, dispositions, limitations |
| `test/fixtures/inventory.json` | Regenerate inventory, not test assertions |

For each new package, add its existing IDs under a new key in
`MIGRATION_BASELINE_PACKS`, add the corresponding empty `NEW_AGENT_IDS` key,
and remove each ID from its former owner in the same task. Keep
`PACK_ORDER`/`COMMITTED_PACKS` derived. Do not rewrite taxonomy rules or add a
task router.

For every rewritten agent:

1. Read the entire old body and its inherited contracts before editing.
2. Preserve domain judgment, evidence requirements, output formats, authority,
   privacy, and explicit tool limitations. Reorganize only to make these
   instructions usable at the relevant task.
3. Remove the `**Inherits:**` line, eager directive, and dependency-guard region.
4. Route `kai-core-contract-v1` before the first other core skill; state the
   role's own bounded fallback in that paragraph. No coordinated `.kai`
   operations without core; tell the operator how to install/update core.
5. Route other skills at the instruction that needs them, not in a manifest.
   Use `Load`, `Invoke`, `Apply`, or `Run` immediately followed by the
   backticked skill ID. A bare reference is not an explicit load instruction.
6. Replace the four retired core contracts by the successor that actually
   carries the rule. Do not replace one old ID with an eager list of all
   successors.

| Retired contract | Situational successor |
| --- | --- |
| `kai-core-team-operating-rules` | `kai-core-operating-rules` |
| `kai-core-workspace-conventions` | `kai-core-workspace-paths` for resolution; `kai-core-workspace-initiative` for initiative layout/lifecycle |
| `kai-core-work-coordination` | `kai-core-work-acting` for granted work; `kai-core-work-item` for its record; `kai-core-work-granting` only for authorized grant/reconciliation |
| `kai-core-asset-lifecycle` | `kai-core-asset-producing` for creation/update; `kai-core-asset-closing` for accepted disposition/closure |

Preserve assessor independence and no-self-remediation. Do not turn a domain
reviewer into an implementer, or require team coordination to answer a direct
supplied-input question. Agents may report the appropriate owner for work
outside their lane; they must not require sibling installation to perform their
own baseline task or invent absent specialists' judgments.

In every task, use the existing generation sequence after source ownership is
coherent:

```powershell
node scripts/host-contract.mjs --update
npm run docs:generate
npm run pack-preview -- --write
git diff --check
```

If emission fails, repair the changed source, package registration, companion
path, or dependency declaration causing it. Do not invoke or weaken unrelated
policy checks to manufacture a passing count. Keep current metadata until
Task 6's single version bump.

## Task 1: Complete kai-creative

**Move agents:**
- `plugins/kai-product/agents/principal-product-designer.agent.md` → `plugins/kai-creative/agents/principal-product-designer.agent.md`
- `plugins/kai-product/agents/principal-brand-designer.agent.md` → `plugins/kai-creative/agents/principal-brand-designer.agent.md`
- `plugins/kai-personal/agents/creative-video-director.agent.md` → `plugins/kai-creative/agents/creative-video-director.agent.md`

**Move entire skill directories:**
- `plugins/kai-product/skills/ui-mockup/` → `plugins/kai-creative/skills/ui-mockup/`
- `plugins/kai-product/skills/html-block-diagrams/` → `plugins/kai-creative/skills/html-block-diagrams/`
- `plugins/kai-personal/skills/video-direction/` → `plugins/kai-creative/skills/video-direction/`
- `plugins/kai-personal/skills/create-product-demo/` → `plugins/kai-creative/skills/create-product-demo/`
- `plugins/kai-personal/skills/demo-capture/` → `plugins/kai-creative/skills/demo-capture/`
- `plugins/kai-personal/skills/demo-narrate/` → `plugins/kai-creative/skills/demo-narrate/`
- `plugins/kai-personal/skills/demo-zoom/` → `plugins/kai-creative/skills/demo-zoom/`

**Modify:** shared packaging surfaces; `scripts/demo-narrate.mjs` only for
owner-specific messages/comments; other demo helper paths only if relocation
actually requires it.
**Create:** `docs/reference/packages/kai-creative.md`.

**Interfaces:** consumes supplied product needs, positioning, factual
`product_context.json`, media evidence, and approved recording inputs; produces
UI/interaction designs, identity systems, video direction and supported demo
artifacts. Marketing is a possible input producer, not a required install.

- [ ] **Step 1: Move source and register the creative provider.**

Use this ownership entry:

```js
creative: ['principal-product-designer', 'principal-brand-designer', 'creative-video-director'],
```

Add `creative: []` to `NEW_AGENT_IDS`, and `creative: ['lectoria']` to
`PACK_RUNTIME_DEPENDENCIES`. Move the four existing demo-skill ownership
overrides from personal to creative while they remain user-invoked methods.
If an agent now genuinely loads one of those skills, remove its redundant
orphan override instead of maintaining contradictory ownership.

The canonical description is:

```text
UI/UX, visual identity, design assets, and supported media production over kai-core.
```

- [ ] **Step 2: Refactor the three agents and seven methods.**

Preserve the product designer's interaction/state/accessibility discipline and
design-review boundary; the brand designer's visual-identity craft and evidence
requirements; the video director's planning/production distinction and
claim-safe timing/story constraints.

An approved brief may be supplied by the operator. Do not insist a product or
marketing agent first generated it. Missing facts are requested or explicitly
unresolved; do not invent product claims. Personal-voice refinement is optional
and never requires assistant to produce a neutral/brand-voice baseline.

Keep demo steps' measured capture/narration provenance, authorial screenplay
vs measured take distinction, paid-synthesis consent, no automatic paid retry,
and incomplete-output reporting. A plan is not a rendered video. Directly
invocable capture/narration/zoom methods remain available within creative.

- [ ] **Step 3: Move runtime ownership without changing media algorithms.**

Resolve every demo helper from its loaded creative provider root, not the
operator's cwd or a hardcoded personal directory. Trace the existing invoked
`scripts/demo-*.mjs` assets and their module closure through the generator;
ensure they emit into creative. Preserve helper semantics and the pinned
Lectoria artifact.

After confirming no remaining personal consumer executes Lectoria directly,
set `personal: []`; otherwise retain the declaration until the last actual
consumer moves and record why. Do not run synthesis, recording, network media
calls, npm installs, or helper self-tests during this refactor.

- [ ] **Step 4: Generate, inspect, document and commit the complete package.**

Correct the catalog's creative membership and marketplace entry. Generate
using the shared sequence. Inspect agent/skill uniqueness, relative provider
paths, emitted helpers and module closure. Preserve declared external tools
as prerequisites, not claims they are installed.

The package note must cover direct UI, identity, video-plan, and demo-method
requests, their expected artifacts, preserved obligations, and unexecuted
runtime scenarios. Commit source, actual generated outputs and that note;
continue immediately to Task 2.

## Task 2: Complete kai-product

**Keep/refactor in `plugins/kai-product/agents/`:**
`principal-product-manager`, `principal-product-strategist`,
`principal-data-analytics`, `workflow-customer-feedback`,
`workflow-experiment-review`, `workflow-product-explore`,
`persona-ux-first-time-user`.

**Move/refactor into that directory:**
- `plugins/kai-gtm/agents/principal-growth.agent.md`
- `plugins/kai-personal/agents/persona-professional-nutritionist.agent.md`
- `plugins/kai-personal/agents/persona-professional-trainer.agent.md`

**Keep/refactor:** `plugins/kai-product/skills/product-exploration/SKILL.md`.
**Modify:** shared packaging/catalog/marketplace surfaces.
**Create:** `docs/reference/packages/kai-product.md`.

**Interfaces:** consumes supplied user/product evidence or an authorized
surface to inspect; produces scoped briefs, neutral maps, grounded analysis,
domain/experience assessment, and experiment judgments. Creative owns design;
engineering owns implementation.

- [ ] **Step 1: Complete the product ownership entry.**

```js
product: [
  'principal-product-manager', 'principal-product-strategist',
  'principal-data-analytics', 'workflow-customer-feedback',
  'workflow-experiment-review', 'workflow-product-explore',
  'persona-ux-first-time-user', 'principal-growth',
  'persona-professional-nutritionist', 'persona-professional-trainer',
],
```

Remove the three moved IDs from their former owners. Keep `product: []`
runtime dependencies. The canonical description is:

```text
Product discovery, scope, evidence, analytics, and product-led growth over kai-core.
```

- [ ] **Step 2: Refactor the ten agents and exploration method together.**

Preserve PM scope/stewardship and truthful closure; strategist opportunity
assessment; analytics metric/causal rigor; privacy-first feedback synthesis;
independent experiment review; neutral exploration; and subjective UX evidence.
Keep growth's product-led experiments distinct from marketing campaigns.

The fitness personas remain fitness-product auditors, not personal treatment
or coaching services. Preserve screening, evidence limits, nutrition/workout
safety, and independent findings without repairs. Do not broaden their claimed
qualifications or authority.

Follow shared inline-routing rules, including closure contracts where a
steward actually closes an initiative. Remove residual ownership of UI/brand
design and mandatory calls to creative/engineering to complete a product
brief or assessment. Proposing the next owner is not performing their work.

- [ ] **Step 3: Generate, inspect, document and commit.**

Use the shared generation sequence. The note names all ten roles, product
exploration, direct inputs/outputs, preserved assessment boundaries and
runtime-unverified scenarios. Confirm designers exist only under creative.
Commit the package unit, then continue to Task 3.

## Task 3: Complete kai-marketing

**Move/refactor from `plugins/kai-gtm/agents/` into `plugins/kai-marketing/agents/`:**
`principal-product-marketing`, `principal-demand-generation`,
`principal-linkedin-strategist`, `principal-seo`.

**Move/refactor entire directories:**
`plugins/kai-gtm/skills/linkedin-content/` and
`plugins/kai-gtm/skills/product-marketing-intelligence/` into
`plugins/kai-marketing/skills/`.

**Modify:** shared packaging/catalog/marketplace surfaces.
**Create:** `docs/reference/packages/kai-marketing.md`.

**Interfaces:** consumes supplied product facts, media, product maps, and
campaign/audience constraints; produces grounded intelligence, positioning,
campaign/content plans and search assessments. It does not own design, product
priority, deals, or publishing authority.

- [ ] **Step 1: Register and move the marketing unit.**

```js
marketing: [
  'principal-product-marketing', 'principal-demand-generation',
  'principal-linkedin-strategist', 'principal-seo',
],
```

Add `marketing: []` to both `NEW_AGENT_IDS` and runtime dependencies. Remove
the moved IDs from gtm. The canonical description is:

```text
Positioning, campaigns, social content, and search visibility over kai-core.
```

- [ ] **Step 2: Make the four agents and two methods directly usable.**

Preserve claim ledgers, provenance, the current intelligence/media schemas,
locked factual spans, consented inputs, SEO evidence limits and assessor
independence. Rewrite legacy core references and eager loads by task.

A supplied product map is valid input without a product-agent invocation.
When required evidence is absent, ask for the missing facts or limit the
output honestly. Do not force discovery to a sibling agent or fabricate
intel to avoid a dependency. The LinkedIn/content baseline can be neutral or
explicitly requested brand voice; personal voice is an optional enhancement,
not a required assistant dispatch. Never auto-publish.

- [ ] **Step 3: Generate, inspect, document and commit.**

Use the shared generation sequence. Confirm both methods and all agents have
one provider and no required sibling skill loads. Document representative
campaign, intelligence, social, and search tasks with runtime limitations.
Leave gtm populated only by the six upcoming revenue roles; continue to Task 4.

## Task 4: Complete kai-revenue and retire kai-gtm

**Move/refactor all remaining `plugins/kai-gtm/agents/` into
`plugins/kai-revenue/agents/`:** `principal-sales`,
`principal-pricing-monetization`, `principal-partnerships`,
`principal-revenue-operations`, `principal-customer-success`,
`workflow-support-triage`.

**Modify:** shared packaging/catalog/marketplace surfaces; the manifest emitter's
optional local-skill component.
**Retire:** the emptied, tracked `plugins/kai-gtm/` install surface.
**Create:** `docs/reference/packages/kai-revenue.md`.

**Interfaces:** consumes supplied account, deal, cost, customer, ticket and
partner evidence; produces commercial recommendations and support intake
artifacts, not contractual commitments, outbound contact, or engineering work.

- [ ] **Step 1: Register and move the revenue unit.**

```js
revenue: [
  'principal-sales', 'principal-pricing-monetization', 'principal-partnerships',
  'principal-revenue-operations', 'principal-customer-success',
  'workflow-support-triage',
],
```

Add `revenue: []` to `NEW_AGENT_IDS` and runtime dependencies. Remove the gtm
keys once no source remains there. The canonical description is:

```text
Sales, pricing, partnerships, revenue operations, customer success, and support intake over kai-core.
```

- [ ] **Step 2: Preserve the six commercial roles' direct capabilities.**

Keep pricing authority separate from sales recommendations; preserve
evidence-backed forecasts, uncertainty, contractual/legal boundaries,
privacy-aware support intake, incident escalation, customer commitments and
the explicit prohibition on inventing account facts or contacting parties.
Refactor onto inline core routes without forcing marketing, engineering, or a
director to answer a supplied-evidence question.

Revenue has no approved standalone local skill. Retain its actual procedures
in the agent bodies; do not add a dummy skill or an empty-directory marker
merely to fill the package.

- [ ] **Step 3: Emit an honest agent-only local component surface.**

`planManifests` currently declares `manifest.skills = 'skills'` even when the
pack owns none. Change only that emitter statement to:

```js
if (skills.length) manifest.skills = 'skills';
```

The agents still load shared core skills; omitting an absent *local* skill
component does not remove their core access. Do not change validation rules
or fabricate a local skill to satisfy an old expectation. This emitter change
is needed for the actual install shape, not test cleanup.

- [ ] **Step 4: Retire the old install entry, generate and commit.**

Verify no authoritative agent/skill remains in gtm, then remove its marketplace
entry and tracked generated manifests/scripts. Inspect before deleting any
directory: never remove unrelated user files or installed/private data. No
compatibility alias or redirect package remains.

Generate with the shared sequence. Inspect the revenue agent paths and
manifest's absence of a nonexistent local-skill directory. Document direct
commercial use and unverified runtime/connection capabilities; continue to Task 5.

## Task 5: Complete kai-learning and retire kai-personal

**Move/refactor remaining agents from `plugins/kai-personal/agents/` into
`plugins/kai-learning/agents/`:** `instructor-tutor`, `instructor-teacher`,
`instructor-path-mentor`, `principal-engineer-career-mentor`,
`workflow-course-to-audio`.

**Move/refactor:** `plugins/kai-personal/skills/generate-html-lesson/` →
`plugins/kai-learning/skills/generate-html-lesson/`.
**Modify:** shared packaging/catalog/marketplace surfaces.
**Retire:** the emptied, tracked `plugins/kai-personal/` install surface.
**Create:** `docs/reference/packages/kai-learning.md`.

**Interfaces:** consumes supplied topics, course material, learning/career
goals and consented source URLs; produces teaching, learning plans, extracted
material, HTML lessons and supported audio via existing core utilities.

- [ ] **Step 1: Register and move the learning unit.**

```js
learning: [
  'instructor-tutor', 'instructor-teacher', 'instructor-path-mentor',
  'principal-engineer-career-mentor', 'workflow-course-to-audio',
],
```

Add `learning: []` to `NEW_AGENT_IDS` and runtime dependencies. Audio use goes
through core's existing generator; do not duplicate core's runtime dependency
or assume Lectoria was installed by plugin installation.

The canonical description is:

```text
Teaching, tutoring, learning paths, lesson production, and career development over kai-core.
```

- [ ] **Step 2: Refactor the five roles and lesson method together.**

Preserve concrete-first teaching, source-fidelity, knowledge checks, learning
progress/history, user-owned goals, career confidentiality, and the distinction
between authoring a lesson and packaging supplied material. Retain explicit
limits on paid synthesis, tool availability and copyrighted source handling.

Keep pipeline stages honest: extracted Markdown is not a rendered lesson or
audio file. Within the role's declared task, use its package's method or core
utility directly; an optional follow-up role is not a prerequisite for
returning the requested artifact. No mandatory assistant for career/voice or
creative for a baseline lesson.

Resolve all invoked helpers from their actual provider root. Do not leave a
personal-plugin path after moving the source. Preserve subject scope and
domain craft rather than inventing a new all-purpose coach.

- [ ] **Step 3: Retire personal, generate and commit.**

After confirming all original personal assets moved to their approved owners,
remove its registry/runtime keys, marketplace entry, and tracked generated
surface. Keep core's private `.kai/personal/` data convention: a workspace
directory is not the retired `kai-personal` plugin.

Use the shared generation sequence. Inspect one source per moved item,
learning's own lesson method and core audio paths. Document representative
direct tasks and runtime limits. Commit and continue to Task 6 without asking
for another package selection.

## Task 6: Integrate all eight packages and open one PR

**Modify:** `README.md`, `AGENTS.md` outside its managed communication block,
`docs/README.md`, `docs/getting-started.md`, `docs/how-kai-works.md`,
`docs/reference/plugin-structure.md`, relevant current install/reference docs,
`plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md`, current
package notes, and the root release metadata.
**Generate:** package manifests/locks/scripts, catalog, inventory.
**Do not modify:** runtime/test policy, historical plans/specs/release reports
merely to eliminate grep hits, or private workspace state.

**Interfaces:** consumes the five completed package commits; produces the
eight-package source/install surface and one reviewable PR, not a release or
runtime-quality claim.

The implementer prepares steps 1–3 and the evidence for step 4, then returns
its committed work. The controller owns independent review, review fixes,
and the authorized push/PR in step 5. A worker's self-review is not the final
independent review and is not permission to publish the PR early.

- [ ] **Step 1: Inspect the final ownership surface.**

The final tracked plugin names must be exactly:

```text
kai-core
kai-engineering
kai-product
kai-creative
kai-marketing
kai-revenue
kai-assistant
kai-learning
```

Compare tracked agent/skill identities with baseline `03c5b2c`. Preserve all
56 agents and 57 skills; expected agent ownership is core 6, engineering 20,
product 10, creative 3, marketing 4, revenue 6, assistant 2, learning 5.
Counts are inventory evidence, not an error target or a reason to invent
content. Revenue legitimately has no local skill component.

Inspect explicit local/core routes and actual helper/provider paths. All
remaining agents must be off the eager declaration and guard region. Report
or fix actual missing source, lost craft, unsupported ownership or companion
breakage; do not run policy validators to find a number to reduce.

- [ ] **Step 2: Update current installation and responsibility documentation.**

Describe eight actual package owners and the new direct-task boundaries.
Remove current instructions to install the retired gtm/personal packages.
Update core onboarding's package list without changing workspace/private-data
schemas. Remove "three unmigrated packs" statements from current contributor
guidance, but leave the managed communication-style block byte-identical.

Keep old names in dated historical records where they describe the past.
Current source/runtime/docs references must not direct an operator to an
absent plugin or helper. Preserve `.kai/personal/` workspace paths.

- [ ] **Step 3: Perform the single batched PR metadata update.**

The public install surface removes two packages, so prepare `7.0.0` metadata:

```powershell
npm version 7.0.0 --no-git-tag-version
```

Set root `plugin.json`, marketplace metadata, and every current marketplace
entry to the same version. Add a dated `[7.0.0]` CHANGELOG section and its
`v6.0.0...v7.0.0` compare link; update the README stamp. Describe prepared
source metadata, not a published release.

Run the shared generation sequence once more and inspect the metadata diff.
Do not install dependencies merely because versions changed; runtime
declarations are moved, not new external libraries.

- [ ] **Step 4: Record source-review findings and remaining limits.**

Use focused package reviews and one final integration review, not repeated
whole-repo audits. Preserve actual fixes, any parked issues and all execution
rulings in this plan before temporary-ledger cleanup. Explicitly state which
runtime scenarios were not executed and which policy/test work is deferred.
No green-build, installation, effective-tool, publication, or improved-quality
claim is implied by source review or generation.

Commit the complete integration change set with the required Copilot trailer.

- [ ] **Step 5: Push the branch and create the PR.**

After all eight packages are present and source review is complete:

```powershell
git push -u origin HEAD
gh pr create --base main --head kai/refactor/remaining-packages --title "refactor: complete capability package rollout"
```

Supply a noninteractive PR body describing all package moves, retired install
names, preserved boundaries, source/generation evidence, known red checks,
and runtime-unverified scenarios. This plan authorizes PR creation, not merge,
tagging, release publication, or disabling branch protection.

## Self-review of this plan

| Concern | Coverage |
| --- | --- |
| Every remaining agent | Tasks 1–5 own 3 + 10 + 4 + 6 + 5 = 28 |
| Every remaining local skill | Creative 7; product 1; marketing 2; learning 1; revenue needs no invented method |
| Core/engineering/assistant sign-off | Global constraints; Task 6 live-reference-only updates |
| Media runtime and companions | Task 1 |
| Supplied-input independence | Each package's interfaces and craft step |
| Empty local-skill component | Task 4 emitter change |
| Retired source trees and entries | Tasks 4–5 |
| Actual eight-package install surface | Task 6 |
| No more package-selection stops | Operator correction and continuous task sequencing |
| One PR; no implicit merge/publication | Task 6 step 5 |
| Deferred safety/testing and two refinements | Existing approved rollout agreement; not silently pulled into this implementation phase |

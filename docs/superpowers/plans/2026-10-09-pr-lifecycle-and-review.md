# PR Lifecycle and Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the PR delivery workflow with a software integration lead, size PRs from completed diffs, and add adaptive PR review plus balanced review-comment guidance.

**Architecture:** `eng-lead-software` becomes the complete-change integration and delivery owner while builders remain implementation-focused and `eng-reviewer-code` remains independent. `pr-sizing` moves after integration, `pr-delivery` consumes a concise description reference, and two review skills separate finding discovery from comment communication.

**Tech Stack:** Markdown agent/skill contracts, Node.js contract tests, Kai's source discovery/build tooling, GitHub CLI for authorized issue and PR actions.

**Spec:** `docs/designs/pr-lifecycle-and-review.md`

## Global Constraints

- Validation level is **Lean**: focused lifecycle tests, source validation, host inventory validation, generated artifact checks, and `npm test`.
- Use Node `^22.22.2 || ^24.15.0 || >=26.0.0`.
- Add no runtime or development dependencies.
- `eng-lead-software` coordinates and integrates; it does not implement product code or provide independent approval.
- Builders own implementation and changed-behavior tests, then stop at an evidence handoff.
- `pr-sizing` runs only after the complete diff exists.
- File count is a reviewability signal, not a hard limit or an automatic client/server split.
- `pr-review` is internal to `eng-reviewer-code` and is not user-invocable.
- `pr-review-comments` may draft directly from verified findings and may post only with current authorization.
- Remove `workflow-pull-request` and active `eng-lead-architecture` without compatibility aliases.
- Preserve `eng-lead-architecture` under `incubator/kai-engineering/` with #249 as its re-entry owner.
- The public-surface break requires the next available major version. If `origin/main` remains `20.0.1`, prepare `21.0.0`; otherwise stop and calculate the next major from the fetched remote version.
- Default to ASCII in source and generated prose.

## File map

**Create**

- `plugins/kai-engineering/agents/eng-lead-software.agent.md` - complete-change integration, review routing, post-build sizing, and PR delivery.
- `plugins/kai-engineering/skills/pr-review/SKILL.md` - adaptive code-review method.
- `plugins/kai-engineering/skills/pr-review-comments/SKILL.md` - finding-to-comment tone, shape, examples, anchors, and authorization.
- `plugins/kai-engineering/skills/pr-delivery/references/pr-description.md` - default PR description and feature-flag migration profile.
- `test/pr-lifecycle-self-test.mjs` - focused ownership, trigger, sizing, description, and comment-contract tests.

**Move**

- `plugins/kai-engineering/agents/workflow-pull-request.agent.md` to `plugins/kai-engineering/agents/eng-lead-software.agent.md`, then rewrite it for lead authority.
- `plugins/kai-engineering/agents/eng-lead-architecture.agent.md` to `incubator/kai-engineering/agents/eng-lead-architecture.agent.md`.

**Modify**

- `plugins/kai-engineering/agents/eng-builder-software.agent.md`
- `plugins/kai-engineering/agents/eng-builder-platform.agent.md`
- `plugins/kai-engineering/agents/eng-reviewer-code.agent.md`
- `plugins/kai-engineering/agents/eng-reviewer-security.agent.md`
- `plugins/kai-engineering/agents/eng-reviewer-privacy-compliance.agent.md`
- `plugins/kai-engineering/agents/eng-reviewer-reliability.agent.md`
- `plugins/kai-engineering/agents/eng-reviewer-quality.agent.md`
- `plugins/kai-engineering/skills/pr-sizing/SKILL.md`
- `plugins/kai-engineering/skills/pr-delivery/SKILL.md`
- `incubator/kai-engineering/README.md`
- `tools/generate-catalog.mjs`
- `test/coordination-core-self-test.mjs`
- `test/helpers/coordination-cli-native-fixture.mjs`
- `test/helpers/coordination-report-fixture.mjs`
- `test/helpers/coordination-runtime-fixture.mjs`
- `package.json`
- `CHANGELOG.md`
- `README.md`

**Regenerate; do not edit by hand**

- `package-lock.json`
- `plugin.json`
- `.github/plugin/marketplace.json`
- `plugins/kai-core/plugin.json`
- `plugins/kai-engineering/plugin.json`
- `plugins/kai-creative/plugin.json`
- generated package locks and bundled scripts
- `docs/reference/agents-and-skills.md`
- `test/fixtures/inventory.json` through `npm run host-contract:update`

---

### Task 1: Replace the PR workflow with the software lead

**Files:**
- Create: `test/pr-lifecycle-self-test.mjs`
- Move: `plugins/kai-engineering/agents/workflow-pull-request.agent.md` -> `plugins/kai-engineering/agents/eng-lead-software.agent.md`
- Move: `plugins/kai-engineering/agents/eng-lead-architecture.agent.md` -> `incubator/kai-engineering/agents/eng-lead-architecture.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-builder-software.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-builder-platform.agent.md`
- Modify: `incubator/kai-engineering/README.md`
- Modify: `tools/generate-catalog.mjs`
- Modify: `test/coordination-core-self-test.mjs`
- Modify: `test/helpers/coordination-cli-native-fixture.mjs`
- Modify: `test/helpers/coordination-report-fixture.mjs`
- Modify: `test/helpers/coordination-runtime-fixture.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: current core granting, acting, Task, operating, publication, and activity contracts.
- Produces: active role `eng-lead-software`; inactive incubated source `eng-lead-architecture`; builders that hand complete evidence to the lead.

- [ ] **Step 1: Add the focused failing role-ownership tests**

Create `test/pr-lifecycle-self-test.mjs` with:

```js
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  sourceAgentFiles,
  sourceSkillFiles,
} from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readEntries = entries => new Map(entries.map(entry => [
  entry.id,
  readFileSync(entry.path, 'utf8').replace(/\r\n/g, '\n'),
]));
const agents = readEntries(sourceAgentFiles(root));
const skills = readEntries(sourceSkillFiles(root));
const readAgent = id => {
  assert.ok(agents.has(id), `active agent ${id} must exist`);
  return agents.get(id);
};
const readSkill = id => {
  assert.ok(skills.has(id), `active skill ${id} must exist`);
  return skills.get(id);
};

test('software lead is the single active PR integration owner', () => {
  assert.equal(agents.has('eng-lead-software'), true);
  assert.equal(agents.has('workflow-pull-request'), false);
  assert.equal(agents.has('eng-lead-architecture'), false);
  assert.equal(
    existsSync(join(
      root,
      'incubator',
      'kai-engineering',
      'agents',
      'eng-lead-architecture.agent.md',
    )),
    true,
  );

  const lead = readAgent('eng-lead-software');
  assert.match(lead, /Apply `kai-core-work-granting`/);
  assert.match(lead, /Apply `pr-sizing` after integration, when the complete diff exists/);
  assert.match(lead, /Apply `pr-delivery`/);
  assert.match(lead, /eng-reviewer-code/);
  assert.match(lead, /Never merge, deploy, tag, release/);
});

test('builders stop at implementation evidence handoff', () => {
  for (const id of ['eng-builder-software', 'eng-builder-platform']) {
    const body = readAgent(id);
    assert.doesNotMatch(body, /Apply `pr-sizing`/);
    assert.doesNotMatch(body, /Apply `pr-delivery`/);
    assert.match(body, /eng-lead-software/);
    assert.match(body, /changed-behavior tests|Tests for changed/);
  }
});
```

- [ ] **Step 2: Add the focused test to the repository test command**

In `package.json`, insert the new file after `test/coordination-core-self-test.mjs`:

```json
"test": "npm run validate && node --test test/repository-instructions-self-test.mjs test/release-automation-self-test.mjs test/workspace-current-self-test.mjs test/coordination-schema-self-test.mjs test/coordination-core-self-test.mjs test/pr-lifecycle-self-test.mjs test/publication-contract-self-test.mjs test/package-build-self-test.mjs test/consumer-install-self-test.mjs test/creative-screenplay-self-test.mjs"
```

- [ ] **Step 3: Run the role test to prove the old surface fails**

Run:

```powershell
node --test test\pr-lifecycle-self-test.mjs
```

Expected: FAIL because `eng-lead-software` is absent, the two retired agents are still active, and builders still route `pr-sizing` or `pr-delivery`.

- [ ] **Step 4: Move the workflow and architecture sources**

Run:

```powershell
git mv plugins\kai-engineering\agents\workflow-pull-request.agent.md plugins\kai-engineering\agents\eng-lead-software.agent.md
git mv plugins\kai-engineering\agents\eng-lead-architecture.agent.md incubator\kai-engineering\agents\eng-lead-architecture.agent.md
```

- [ ] **Step 5: Rewrite the moved workflow as `eng-lead-software`**

Use this frontmatter:

```yaml
---
name: eng-lead-software
description: "Coordinates one complete authorized software change across builders, integration, independent review, post-build PR sizing, and PR delivery. Use for multi-builder work or packaging a finished diff. Never implements product code, self-approves, merges, deploys, tags, or releases."
model: "gpt-5.6-sol"
publication-entrypoint: engineering-workspace-publication
tools: ["execute", "read", "edit", "search", "ask_user", "agent", "read_agent", "write_agent", "skill"]
---
```

Write the body with these exact responsibility sections:

```markdown
# Software Integration Lead

Own one complete authorized software change from bounded builder routing through
review-ready PR delivery. Coordinate and integrate; do not implement the product
or provide independent acceptance.

**Primary profile:** technical-judgment

## Direct path

A finished diff or one supplied builder handoff is sufficient for direct
integration and delivery work. Do not create `.kai` state for a direct request.

## Coordinated path

Apply `kai-core-work-granting` before preparing, granting, or launching builder
Tasks. Apply `kai-core-work-acting` before every coordination write. Give each
builder one bounded Task, explicit touched areas, an isolated context, and a
clear evidence handoff.

## Integrate the complete change

Integrate accepted builder commits into a lead-owned branch. Check scope,
handoff completeness, merge conflicts, accidental changes, and declared
validation. This is a self-check, not an independent verdict.

Apply `pr-sizing` after integration, when the complete diff exists.

## Route independent review

Route each exact delivery revision to `eng-reviewer-code` and any specialist
reviewer triggered by accepted requirements or concrete change evidence. Send
product findings back to the owning builder. A changed revision requires fresh
review.

## Improve agent contracts

After the product finding is fixed, create a separate GitHub issue only when
one strong incident exposes a generalizable builder, skill, scenario, or route
gap. Name the existing instruction or missing contract, the public-safe review
evidence, the expected future behavior, and the likely owning agent or skill.
An ordinary local coding mistake does not require an improvement issue.

## Deliver

Apply `pr-delivery` to each accepted slice. Read current repository rules,
version, checks, protection, reviews, and allowed merge methods from live
evidence. Classify the exact head as MERGEABLE, NOT YET, or STRUCTURALLY
BLOCKED. Missing API permission is unknown, never evidence that no rule exists.

Never merge, deploy, tag, release, force-push, bypass protection, implement the
product, or call an integration self-check independent approval.
```

Retain the repository-standard paragraphs for:

- `kai-core-contract-v1` fallback;
- `kai-core-operating-rules`;
- engineering publication;
- Task, activity, and peer-communication routing;
- unknown API permissions and authorization refusal behavior.

Remove the old workflow-only wording that assumes it receives exactly one
finished PR and cannot coordinate builders.

- [ ] **Step 6: Make builders stop at implementation handoff**

In both builder agents:

1. Delete the paragraph that applies `pr-sizing` before implementation.
2. Delete the paragraph that applies `pr-delivery` after implementation.
3. Add this paragraph near the output/handoff section:

```markdown
Do not promise final PR boundaries from a partial implementation view. Return
commits, changed surfaces, exact verification evidence, and remaining gaps to
`eng-lead-software` when complete-change integration or PR delivery is
requested. A direct one-builder task still needs no coordination ceremony.
```

Keep each builder's existing responsibility for tests and final-diff self-check.

- [ ] **Step 7: Incubate the architecture lead explicitly**

Change the incubator README title to:

```markdown
# Incubated engineering components
```

Keep the existing #211 review-component explanation, then add:

```markdown
`eng-lead-architecture` is tracked separately in
[#249](https://github.com/ketzalcode/kai/issues/249). Its active trigger and
relationship to `eng-lead-software` require redesign before re-entry.
```

Add this inventory row:

```markdown
| `eng-lead-architecture` | agent | `plugins/kai-engineering/agents/eng-lead-architecture.agent.md` | inactive; re-entry tracked by #249 |
```

- [ ] **Step 8: Update the active catalog grouping**

In `tools/generate-catalog.mjs`:

```js
{
  kind: 'agent',
  title: 'Engineering',
  blurb: 'Integrate complete software changes and implement bounded application or platform work.',
  members: [
    'eng-lead-software', 'eng-builder-software', 'eng-builder-platform',
  ],
},
```

Change `Intake & delivery` members to:

```js
members: ['eng-advisor-investigation', 'workflow-ship'],
```

- [ ] **Step 9: Replace fixture authority with the active software lead**

Replace every test-fixture occurrence of:

```text
eng-lead-architecture
```

with:

```text
eng-lead-software
```

in:

- `test/coordination-core-self-test.mjs`
- `test/helpers/coordination-cli-native-fixture.mjs`
- `test/helpers/coordination-report-fixture.mjs`
- `test/helpers/coordination-runtime-fixture.mjs`

Do not change runtime authority semantics; this is fixture roster and actor
ownership only.

- [ ] **Step 10: Verify the role task**

Run:

```powershell
node --test test\pr-lifecycle-self-test.mjs
npm run validate
```

Expected: both commands PASS. Generated inventory and catalog drift are allowed
until Task 4.

- [ ] **Step 11: Commit the role change**

```powershell
git add plugins\kai-engineering\agents incubator\kai-engineering tools\generate-catalog.mjs test package.json
git commit -m "refactor(engineering): replace PR workflow with software lead" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Move PR sizing after build and add the delivery description reference

**Files:**
- Modify: `test/pr-lifecycle-self-test.mjs`
- Modify: `plugins/kai-engineering/skills/pr-sizing/SKILL.md`
- Modify: `plugins/kai-engineering/skills/pr-delivery/SKILL.md`
- Create: `plugins/kai-engineering/skills/pr-delivery/references/pr-description.md`

**Interfaces:**
- Consumes: a complete integrated diff and accepted behavior.
- Produces: either one coherent delivery or an ordered slice proposal; one description reference consumed by `pr-delivery`.

- [ ] **Step 1: Add failing post-build sizing and description tests**

Append:

```js
test('pr sizing uses the completed diff and reviewability boundaries', () => {
  const sizing = readSkill('pr-sizing');
  assert.match(sizing, /complete integrated diff/);
  assert.match(sizing, /four or five primary hand-authored files/);
  assert.match(sizing, /signal, not a cap/);
  assert.match(
    sizing,
    /Do not split solely because one part is client-side and another is server-side/,
  );
  assert.match(sizing, /independently valid and testable/);
});

test('pr delivery reads the shared description reference', () => {
  const delivery = readSkill('pr-delivery');
  assert.match(delivery, /references\/pr-description\.md/);

  const reference = readFileSync(join(
    root,
    'plugins',
    'kai-engineering',
    'skills',
    'pr-delivery',
    'references',
    'pr-description.md',
  ), 'utf8').replace(/\r\n/g, '\n');
  assert.match(reference, /^## Overview$/m);
  assert.match(reference, /^## Scoped architecture$/m);
  assert.match(reference, /^## Validation scenarios$/m);
  assert.match(reference, /^## Rollout and removal gates$/m);
  for (const scenario of [
    'Default/inactive',
    'Enabled success',
    'Compatibility/error',
    'Rollback',
  ]) {
    assert.match(reference, new RegExp(scenario.replace('/', '\\/')));
  }
});
```

- [ ] **Step 2: Run the targeted test to prove the old contracts fail**

```powershell
node --test test\pr-lifecycle-self-test.mjs
```

Expected: the new sizing and reference tests FAIL.

- [ ] **Step 3: Rewrite `pr-sizing` around the complete diff**

Use this frontmatter:

```yaml
---
name: pr-sizing
description: "Use after a complete change or integrated diff exists and delivery may need one or more ordered, human-reviewable PRs."
tools: [read, search]
user-invocable: true
argument-hint: "optional completed diff or delivery goal"
---
```

The skill must contain:

```markdown
# PR Sizing

Read the complete integrated diff and decide how the finished work reaches
review. Return one coherent delivery or an ordered proposal of independently
valid slices.

## One PR by default

Prefer one PR when the change expresses one cohesive behavior or structural
step that a reviewer can understand and validate together.

## Split only at safe review boundaries

Split only when compatibility, independent validation, rollout, reversal, risk
isolation, or reviewer comprehension materially improves.

A typical slice should aim for roughly four or five primary hand-authored files
when cohesion allows. This is a signal, not a cap. Tests stay with behavior;
generated files and synchronized metadata do not force another split.

Do not split solely because one part is client-side and another is server-side.
A server foundation may precede its client only when both merged states are
independently valid and testable.

## Slice contract

Each slice states one purpose, remains valid at that landing point, includes its
tests and scenarios, preserves later compatibility, names dependencies and
deferred work, and has a reversal story when applicable.
```

Retain a concise output contract for `No split` and ordered slices. Stop after
the sizing proposal; do not create branches or PRs from this skill.

- [ ] **Step 4: Add the PR description reference**

Create `plugins/kai-engineering/skills/pr-delivery/references/pr-description.md`
with:

```markdown
# PR description reference

Use verified facts from the final delivery slice. State `Pending decision` or
`Not applicable` rather than inventing content.

## Overview

One sentence describing the behavior changed by this PR, followed by two to
four bullets covering changed behavior, deliberately preserved behavior, and
the important scope boundary or dependency.

## Scoped architecture

Include one small ASCII diagram when caller flow, ownership, state, or
dependency order is materially clearer visually. Omit the section when the
diagram adds no information.

## Validation scenarios

| Scenario | Configuration / action | Expected result | Evidence |
| --- | --- | --- | --- |
| Primary behavior | Exercise the accepted path | Accepted observable result | Exact test, command, screenshot, or other evidence |

Use proportional scenarios for the slice. User-visible UI changes include
usable uploaded screenshots. Automation owns live status and changing counts;
the description owns durable behavior and evidence not visible elsewhere.

## Rollout and removal gates

Use this section only for flags, migrations, compatibility paths, staged
rollout, rollback, or later cleanup.

### Feature-flagged migration profile

| Scenario | Purpose |
| --- | --- |
| Default/inactive | Existing path and explicit default remain intact |
| Enabled success | New path returns the accepted behavior |
| Compatibility/error | Caller contracts, failure behavior, cancellation, timeout, and telemetry remain correct |
| Rollback | Disabling or reverting returns to the preserved path |

Distinguish code-ready, enabled, validated, and complete. State configuration,
first enablement, broader-rollout evidence, rollback, and legacy-removal
conditions once.
```

- [ ] **Step 5: Simplify `pr-delivery` and route the reference**

Keep its branch anchor, title, version, preflight, protection-safe handoff, and
hard boundaries. Replace its long hand-maintained PR body section with:

```markdown
## PR description

Read `references/pr-description.md` before drafting or updating the body. Use
the default overview and validation-scenario sections. Add scoped ASCII
architecture and rollout/removal gates only when their triggers apply.

Describe one accepted delivery slice. Name dependencies on earlier PRs and work
deliberately deferred to later slices. Do not copy live CI counts, reviewer
history, or stale implementation narrative into the durable behavior
description.
```

Change its description to:

```yaml
description: "Use when an accepted delivery slice needs branch naming, title, version handling, a scenario-based PR description, verification evidence, and protection-safe handoff."
```

- [ ] **Step 6: Verify the sizing and delivery task**

```powershell
node --test test\pr-lifecycle-self-test.mjs
npm run validate
```

Expected: PASS.

- [ ] **Step 7: Commit the sizing and delivery change**

```powershell
git add plugins\kai-engineering\skills\pr-sizing plugins\kai-engineering\skills\pr-delivery test\pr-lifecycle-self-test.mjs
git commit -m "refactor(engineering): size PRs from completed diffs" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Add adaptive PR review and balanced review comments

**Files:**
- Modify: `test/pr-lifecycle-self-test.mjs`
- Create: `plugins/kai-engineering/skills/pr-review/SKILL.md`
- Create: `plugins/kai-engineering/skills/pr-review-comments/SKILL.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-code.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-security.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-privacy-compliance.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-reliability.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-quality.agent.md`
- Modify: `tools/generate-catalog.mjs`

**Interfaces:**
- Consumes: exact PR/diff revision, accepted requirements, evidence, and verified findings.
- Produces: purpose-based review findings and authorization-aware inline comment drafts or posts.

- [ ] **Step 1: Add failing review routing and tone tests**

Append:

```js
test('review requests route through the reviewer and internal review method', () => {
  const reviewer = readAgent('eng-reviewer-code');
  assert.match(reviewer, /Apply `pr-review`/);
  assert.match(reviewer, /Apply `pr-review-comments`/);

  const review = readSkill('pr-review');
  assert.doesNotMatch(review, /^user-invocable:\s*true$/m);
  assert.match(review, /Purpose:/);
  assert.match(review, /Changed behavior:/);
  assert.match(review, /Affected surfaces:/);
  assert.match(review, /Risk signals:/);
  assert.match(review, /specialist verdict/);
});

test('review comments calibrate tone and require posting authority', () => {
  const comments = readSkill('pr-review-comments');
  assert.match(comments, /^user-invocable:\s*true$/m);
  assert.match(comments, /There is no mandatory `Suggestion:` label/);
  assert.match(comments, /Uncertain intent/);
  assert.match(comments, /Verified defect with corrective options/);
  assert.match(comments, /Required change/);
  assert.match(comments, /Without GitHub write authorization, return drafts/);
  assert.match(comments, /verify that the PR head still matches/);
});

test('specialist reviewers share comment communication, not review judgment', () => {
  for (const id of [
    'eng-reviewer-security',
    'eng-reviewer-privacy-compliance',
    'eng-reviewer-reliability',
    'eng-reviewer-quality',
  ]) {
    const body = readAgent(id);
    assert.match(body, /Apply `pr-review-comments`/);
    assert.doesNotMatch(body, /Apply `pr-review`/);
  }
});
```

- [ ] **Step 2: Run the targeted test to prove the skills are absent**

```powershell
node --test test\pr-lifecycle-self-test.mjs
```

Expected: FAIL because `pr-review`, `pr-review-comments`, and their routes do not
exist.

- [ ] **Step 3: Create the internal `pr-review` method**

Use:

```yaml
---
name: pr-review
description: "Use from eng-reviewer-code after an exact PR or diff is pinned to choose the minimum relevant review from its purpose, changed behavior, evidence, and risk triggers."
tools: [execute, read, search]
---
```

The skill must define this review brief:

```text
Purpose: the accepted or claimed outcome
Changed behavior: what the diff actually changes
Affected surfaces: code, contracts, tests, UI, data, telemetry, operations
Evidence: requirements, issue, tests, screenshots, rollout notes
Risk signals: only concrete triggers visible in this change
```

Then specify:

- code changes receive requirements, correctness, contract, regression,
  changed-behavior test, maintainability, and applicable `coding-standards`
  review;
- docs or metadata-only changes skip code-only lenses;
- assembled UI/API/CLI/system behavior may route to quality review;
- concrete security/privacy/reliability triggers route to their owners;
- bounded unresolved facts may use `research-before-coding`;
- the code reviewer may report a specialist trigger but cannot issue the
  specialist verdict;
- stacked PRs are reviewed against their real parent revision and final
  cross-slice behavior needs end-to-end evidence.

- [ ] **Step 4: Create `pr-review-comments` with the approved tone contract**

Use:

```yaml
---
name: pr-review-comments
description: "Use after verified review findings exist to draft or, with current authorization, post concise actionable pull-request comments."
tools: [execute, read, search]
user-invocable: true
argument-hint: "verified finding(s), PR, or review output"
---
```

Include:

```text
<Observed behavior and triggering condition>
<Why it matters>

<Calibrated question or required outcome>
```

State exactly:

```markdown
There is no mandatory `Suggestion:` label.
```

Add the three approved headings and synthetic examples:

```markdown
### Uncertain intent

This value now controls both the outbound dependency and the trusted inbound
identity. Are those contracts guaranteed to change together in every
environment, or should they remain independently configurable?

### Verified defect with corrective options

This fallback converts a timeout into an empty result, so callers cannot
distinguish "no records" from "the dependency failed."

Could we preserve the timeout error so callers can keep handling those states
separately?

### Required change

This branch emits the existing event name with a different field meaning,
which would silently change the dashboards and alerts that consume it.

We should preserve the current event contract here, or make the telemetry
change an explicit part of this work with its consumers updated.
```

Add these anti-examples:

```markdown
- Excessive hedging: "What do you think about maybe considering whether this
  could potentially be changed?"
- Personal blame: "You implemented this incorrectly and need to rewrite it."
```

Require one finding per comment, the best changed-line anchor, a general review
comment when no honest inline anchor exists, public-safe examples, current
posting authorization, and PR-head verification before posting.

Without GitHub write authorization, return drafts and the exact pending action.
Authorization may come from the user or a current lead grant.

- [ ] **Step 5: Make `eng-reviewer-code` use the two methods**

After pinning the review target, add:

```markdown
Apply `pr-review` to build the purpose/change/evidence brief and select the
minimum relevant review. Do not run every lens or assign a numerical risk
score.
```

Replace duplicated general review-method prose with the skill route while
retaining:

- independence;
- immutable revision handling;
- no-self-remediation;
- findings/verdict shape;
- coordination recording.

Before returning or posting PR comments, add:

```markdown
When inline PR comments are requested, apply `pr-review-comments` only to
verified findings. Without current GitHub write authorization, return drafts.
```

- [ ] **Step 6: Share comment communication with specialist reviewers**

In security, privacy/compliance, reliability, and quality reviewers, add near
their findings section:

```markdown
When inline PR comments are requested, apply `pr-review-comments` to this
reviewer's verified findings. The shared skill controls communication and
posting authorization; it does not replace this role's specialist judgment.
```

- [ ] **Step 7: Add both skills to the catalog**

Change the Engineering craft category to:

```js
members: [
  'coding-standards', 'research-before-coding',
  'pr-sizing', 'pr-delivery', 'pr-review', 'pr-review-comments',
  'onboard-to-codebase', 'build-diagrams',
],
```

- [ ] **Step 8: Verify the review task**

```powershell
node --test test\pr-lifecycle-self-test.mjs
npm run validate
```

Expected: PASS.

- [ ] **Step 9: Commit the review capabilities**

```powershell
git add plugins\kai-engineering\agents plugins\kai-engineering\skills\pr-review plugins\kai-engineering\skills\pr-review-comments tools\generate-catalog.mjs test\pr-lifecycle-self-test.mjs
git commit -m "feat(engineering): add adaptive PR review guidance" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 4: Prepare the breaking release surface and generated artifacts

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Regenerate: `test/fixtures/inventory.json`
- Regenerate: root, package, marketplace, catalog, lock, and bundled artifacts owned by `npm run build`

**Interfaces:**
- Consumes: final active source surface from Tasks 1-3.
- Produces: one internally consistent next-major prepared release with 20 active agents and 41 active skills.

- [ ] **Step 1: Fetch the current release authority**

```powershell
git fetch origin main --tags
git show origin/main:package.json
```

Expected on this design basis: `"version": "20.0.1"`.

If the fetched version differs, stop and calculate the next major from that
remote value before editing release metadata.

- [ ] **Step 2: Demonstrate the expected generated/inventory drift**

```powershell
npm run host-contract
npm run build:check
```

Expected: FAIL because the intended roster, catalog, and generated package
surface have changed.

- [ ] **Step 3: Set the next major through the package authority**

If remote main is still `20.0.1`, run:

```powershell
npm version 21.0.0 --no-git-tag-version
```

Do not edit generated manifest versions manually.

- [ ] **Step 4: Add the changelog entry and comparison link**

Add:

```markdown
## [21.0.0] - 2026-10-09

### Added

- Added `eng-lead-software` for complete-change integration, builder routing,
  post-build PR sizing, independent review routing, and PR delivery.
- Added `pr-review` and `pr-review-comments` for adaptive review and balanced,
  authorization-aware inline feedback.
- Added a `pr-delivery` description reference with concise overview, scoped
  ASCII architecture, scenario evidence, and conditional rollout/removal gates.

### Changed

- Moved `pr-sizing` after the complete diff exists and made human reviewability,
  valid intermediate states, and dependency order its delivery boundaries.
- Builders now stop at implementation/test evidence handoff instead of owning
  final PR sizing or delivery.

### Removed

- Removed `workflow-pull-request`; its useful integration, protection, and
  merge-readiness responsibilities now belong to `eng-lead-software`.
- Removed `eng-lead-architecture` from active discovery and preserved it under
  incubation for the redesign tracked by #249.
```

Add at the comparison-link section:

```markdown
[21.0.0]: https://github.com/ketzalcode/kai/compare/v20.0.1...v21.0.0
```

- [ ] **Step 5: Update the README status**

Use:

```markdown
`v21.0.0` is this checkout's prepared metadata version - not a tag, a release,
a publication, or a host-verification claim.
```

Change the surface row to:

```markdown
| Surface | **20 agents and 41 skills** |
```

- [ ] **Step 6: Restore dependencies and regenerate owned artifacts**

Verify `node --version` satisfies the package engine, then run:

```powershell
npm ci
npm run host-contract:update
npm run build
```

Expected:

- golden inventory reports 20 agents and 41 skills;
- generated catalog lists `eng-lead-software`, `pr-review`, and
  `pr-review-comments`;
- generated surface excludes `workflow-pull-request` and
  `eng-lead-architecture`;
- all prepared version fields are `21.0.0`.

- [ ] **Step 7: Run the Lean validation agreement**

```powershell
node --test test\pr-lifecycle-self-test.mjs
npm run host-contract
npm run build:check
npm test
```

Expected:

- lifecycle tests PASS;
- inventory matches 20 agents / 41 skills;
- generated artifacts are current;
- repository suite reports 0 failures.

The nightly-only Linux/release-readiness workflow remains unverified locally
unless the operator separately requests it.

- [ ] **Step 8: Commit the prepared release**

```powershell
git add package.json package-lock.json CHANGELOG.md README.md test\fixtures\inventory.json plugin.json .github\plugin plugins docs\reference
git commit -m "chore(release): prepare 21.0.0" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 5: Review the exact revision and decide final PR slices

**Files:**
- Modify only files required by concrete independent review findings.
- Create GitHub improvement issues only when a finding exposes a generalizable builder or skill contract gap and current write authorization exists.

**Interfaces:**
- Consumes: complete implementation diff, exact commit SHA, Lean validation evidence.
- Produces: independent review verdict, repaired exact revision, post-build sizing decision, and authorized PR draft(s).

- [ ] **Step 1: Inspect the complete diff**

```powershell
git --no-pager diff --stat origin/main...HEAD
git --no-pager diff --check origin/main...HEAD
git status --short --branch
```

Expected: only intended lifecycle, review, test, release, generated, and design
surfaces are changed; diff check has no output; worktree is clean.

- [ ] **Step 2: Run independent code review on the exact HEAD**

Provide `eng-reviewer-code`:

- base `origin/main`;
- exact `git rev-parse HEAD`;
- #223, #248, #249;
- `docs/designs/pr-lifecycle-and-review.md`;
- `docs/superpowers/plans/2026-10-09-pr-lifecycle-and-review.md`;
- the Lean validation commands and results.

Require `pr-review` for scope and `pr-review-comments` for any requested inline
drafts. The integration lead and builders cannot supply this verdict.

- [ ] **Step 3: Route and fix concrete findings**

For each finding:

1. send the product correction to the owning builder or implementation task;
2. add or adjust the smallest failing lifecycle test;
3. verify the test fails for the original behavior;
4. implement the correction;
5. rerun the targeted test and Lean suite;
6. request review of the new exact SHA.

Create a separate improvement issue only when the finding demonstrates a
generalizable contract, route, or scenario gap. Use public-safe synthetic
examples and name the likely owning agent or skill.

- [ ] **Step 4: Apply post-build `pr-sizing` to the complete accepted diff**

The lead reads the final complete diff and returns either:

```text
No split: one coherent breaking lifecycle change; agent routes, skills,
fixtures, generated inventory, and release metadata must land atomically.
Validation: focused lifecycle test, host inventory, build check, and npm test.
```

or an ordered stack where every proposed PR:

- remains valid when merged;
- includes its affected tests and scenarios;
- names dependencies and deferred work;
- preserves compatible intermediate behavior;
- is human-reviewable without an arbitrary file cap.

Do not preselect a stack merely because this plan has multiple implementation
tasks.

- [ ] **Step 5: Prepare PR descriptions through `pr-delivery`**

For each authorized PR:

- use the concise overview;
- include a small ASCII architecture diagram because role ownership and route
  flow materially changed;
- include scenario/evidence rows for direct builder, multi-builder,
  post-build sizing, general review, specialist routing, comment authorization,
  and architecture incubation;
- include the breaking removal and no-alias statement;
- record exact Lean validation commands and unverified nightly evidence;
- link #223, #248, and #249 as appropriate.

Do not post or open GitHub PRs without current authorization.

- [ ] **Step 6: Final verification before handoff**

```powershell
npm run host-contract
npm run build:check
npm test
git status --short --branch
```

Expected: all commands PASS and the worktree is clean.

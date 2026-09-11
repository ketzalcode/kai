# Agent Contract Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the always-loaded contract surface of 27 agents from a mean ~28,798 tokens to roughly 6–8k by splitting four heavy core contracts by reader and replacing eager inheritance with strictly-parsed inline routes.

**Architecture:** Four heavy `kai-core` skills are split along the authority boundary — what a worker needs versus what only the dispatcher needs. Agents drop the eager `**Inherits:**` line and instead name each contract with an imperative verb at the instruction that needs it. The validator is rewritten to recognise exactly one agent shape, and the checks that read the old line are re-pointed or deleted.

**Tech Stack:** Markdown agent/skill definitions; Node 20 ESM validation scripts (`scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs`); no runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-04-agent-contract-refactor-design.md`

## Global Constraints

- **Agent prompt hard limit: 30,000 characters.** GitHub's cap, not kai's. Over it the prompt is truncated or the agent fails to load. Enforced by `AGENT_PROMPT_HARD_LIMIT` in `scripts/lib/pack-plan.mjs`.
- **kai's own 20,000-character / 250-line body target is dropped.** Do not enforce it; re-derive later from what refactored bodies need.
- **No hoisted route lists.** A route is stated at the instruction that needs it. Collecting routes into one section recreates the eager block being removed.
- **No dual mode, no `v1` label, no compatibility shims.** Every agent ends in one shape.
- **A red build is expected during Tasks 1–9.** Static checks are rewritten in Tasks 10–12 against the end state.
- **Every agent keeps a drop record.** Anything removed from a body is recorded with its destination in `docs/superpowers/plans/drop-records/<agent-id>.md`.
- **Scope is 7 `kai-core` agents + 20 `kai-engineering` agents.** The `kai-gtm`, `kai-product`, and `kai-personal` packs are untouched and will be left failing validation until a later pass.
- **`kai-core-fleet-observation` is out of scope.** It is loaded by no agent today but is intended for use. Do not delete or modify it.
- **Commit after every task.** Frequent, small commits.

---

## Naming, fixed up front

Every task below uses these ids. Do not invent variants.

| New skill id | Replaces | Loaded by |
| --- | --- | --- |
| `kai-core-work-acting` | part of `kai-core-work-coordination` | every dispatched agent |
| `kai-core-work-granting` | part of `kai-core-work-coordination` | `director-chief-of-staff` only |
| `kai-core-work-item` | part of `kai-core-work-coordination` | anything writing an item record |
| `kai-core-asset-producing` | part of `kai-core-asset-lifecycle` | any agent producing an asset |
| `kai-core-asset-closing` | part of `kai-core-asset-lifecycle` | completion authorities + director |
| `kai-core-workspace-paths` | part of `kai-core-workspace-conventions` | any agent touching workspace state |
| `kai-core-workspace-initiative` | part of `kai-core-workspace-conventions` | director + initiative roles |
| `kai-core-operating-rules` | `kai-core-team-operating-rules` | every agent |

Deleted outright: `kai-core-work-coordination`, `kai-core-asset-lifecycle`, `kai-core-workspace-conventions`, `kai-core-team-operating-rules`.

**The route sentence form.** Every route must match an imperative verb immediately followed by a backticked skill id:

```
Invoke `kai-core-work-acting` before writing durable state.
Load `kai-core-asset-producing` before creating a durable artifact.
```

Accepted verbs: `Load`, `Invoke`, `Apply`, `Run`. The verb may be followed by an optional `the `, then the backticked id, on the same line.

---

## File Structure

**New skills** (each `plugins/kai-core/skills/<id>/SKILL.md`):
`kai-core-work-acting`, `kai-core-work-granting`, `kai-core-work-item`, `kai-core-asset-producing`, `kai-core-asset-closing`, `kai-core-workspace-paths`, `kai-core-workspace-initiative`, `kai-core-operating-rules`

**Deleted skills:** the four originals listed above.

**Rewritten agents:** 7 in `plugins/kai-core/agents/`, 20 in `plugins/kai-engineering/agents/`.

**Modified tooling:**
- `scripts/lib/pack-plan.mjs` — route parser, identity-contract checks, guard-block machinery, registries
- `scripts/validate-plugin.mjs` — agent shape loop, assessor roster, `requires_tools` scan
- `scripts/lib/inherits-block.txt`, `scripts/lib/preflight-block.txt`, `scripts/lib/degraded-block.txt` — deleted
- `scripts/generate-catalog.mjs` — `CATEGORIES` entries for renamed skills
- `AGENTS.md` — the contributor rules describing the old shape

**Drop records:** `docs/superpowers/plans/drop-records/<id>.md`, one per rewritten agent and per split contract.

---

## Task 1: Route parser — recognise an imperative route

**Files:**
- Modify: `scripts/lib/pack-plan.mjs` (add `routedSkills`, directly above `dispatchedRefs` ~line 1408)
- Test: the `selfTest()` block in `scripts/pack-preview.mjs` (~line 386), run via `node scripts/pack-preview.mjs --self-test`

**Interfaces:**
- Consumes: nothing
- Produces: `routedSkills(body) -> string[]` — backticked skill ids preceded by an imperative verb on the same line, de-duplicated, in declaration order. Used by Tasks 2, 10, 11.

Today `progressiveSkillRoutingErrors` treats *any* backticked skill mention as a route (`scripts/lib/pack-plan.mjs:1227-1231`), while `dispatchedRefs` requires an imperative (`scripts/lib/pack-plan.mjs:1076`). The two disagree, so ``do not invoke `x` `` satisfies validation and a dead route is invisible. One parser fixes that.

- [ ] **Step 1: Write the failing test**

Find `selfTest()` in `scripts/pack-preview.mjs` (the block of existing `ok(...)` assertions, starting ~line 386) and append the assertions below. Add `routedSkills` to the `pack-plan.mjs` import list at the top of that file.

```js
// --- routedSkills: an imperative verb is what makes a mention a route
ok(routedSkills('Invoke `kai-core-work-acting` before writing state.')
  .join() === 'kai-core-work-acting',
'an imperative verb immediately before a backticked id is a route');
ok(routedSkills('The technical counterpart to `kai-core-work-acting`.').length === 0,
  'a bare prose mention is editorial, not a route');
ok(routedSkills('Do not invoke `kai-core-work-granting`; you are not the grantor.').length === 0,
  'a negated instruction is not a route -- the dead-route bug this parser exists to catch');
ok(routedSkills('Load the `kai-core-asset-producing` contract first.')
  .join() === 'kai-core-asset-producing',
'an optional article between the verb and the id is allowed');
ok(routedSkills('Load `kai-core-work-acting`.\nInvoke `kai-core-work-acting` again.')
  .length === 1, 'a repeated route is reported once');
ok(routedSkills('Invoke `kai-core-work-item` then apply `kai-core-work-acting`.')
  .length === 2, 'two routes on one line are both found');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/pack-preview.mjs --self-test`
Expected: FAIL with `routedSkills is not defined`

- [ ] **Step 3: Write minimal implementation**

Add to `scripts/lib/pack-plan.mjs`, directly above `export function dispatchedRefs`:

```js
// A mention becomes a route only when an imperative verb points at it. Without
// this, "do not invoke `x`" counts as loading x, and a route that never fires is
// invisible: the agent silently never loads the contract and does lower-quality
// work with nothing failing. The negation guard is the whole point.
const ROUTE_SENTENCE = /\b(?:Load|Invoke|Apply|Run)\s+(?:the\s+)?`([a-z0-9][a-z0-9-]*)`/gi;
const ROUTE_NEGATION = /\b(?:not|never|without|avoid)\b/i;

export function routedSkills(body) {
  const out = [];
  for (const line of normalizeLF(body ?? '').split('\n')) {
    for (const m of line.matchAll(ROUTE_SENTENCE)) {
      if (ROUTE_NEGATION.test(line.slice(0, m.index))) continue;
      if (!out.includes(m[1])) out.push(m[1]);
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/pack-preview.mjs --self-test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/pack-plan.mjs
git commit -m "feat(validate): add routedSkills, an imperative-only route parser

A backticked mention is not a route. Requiring an imperative verb and
rejecting negated lines makes a declared-but-dead route detectable, which
is the silent failure on-demand loading introduces.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Point the routing validator at the strict parser

**Files:**
- Modify: `scripts/lib/pack-plan.mjs:1225-1236` (inside `progressiveSkillRoutingErrors`)

**Interfaces:**
- Consumes: `routedSkills(body)` from Task 1
- Produces: `progressiveSkillRoutingErrors` rejects an agent whose required contracts are only mentioned, not routed. Error text for a missing route stays `` must load `<id>` at the step that needs it ``.

- [ ] **Step 1: Write the failing test**

Append to `selfTest()` in `scripts/pack-preview.mjs`, importing `progressiveSkillRoutingErrors` if it is not already imported:

```js
// --- required contracts must be ROUTED, not merely mentioned
const mentionOnly = [
  '**Identity contract:** `kai-agent-v1`',
  'Invoke `kai-core-contract-v1` before the first other core skill.',
  'See `kai-core-team-operating-rules` and `kai-core-asset-lifecycle` for context.',
  'If core is unavailable or incompatible, continue single-shot;',
  'do not create `.kai` state; tell the operator to install or update `kai-core`.',
].join('\n');
ok(progressiveSkillRoutingErrors({
  id: 'eng-lead-x', body: mentionOnly, tools: ['skill'],
  knownSkills: ['kai-core-contract-v1', 'kai-core-team-operating-rules', 'kai-core-asset-lifecycle'],
}).some((e) => /must load `kai-core-team-operating-rules`/.test(e)),
'a contract that is only name-dropped does not count as loaded');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/pack-preview.mjs --self-test`
Expected: FAIL — the assertion is false, because the current `mentioned` set accepts a bare backtick.

- [ ] **Step 3: Write minimal implementation**

In `progressiveSkillRoutingErrors`, replace the `mentioned` / `routed` block with:

```js
  const available = knownSkills instanceof Set ? knownSkills : new Set(knownSkills);
  const routed = new Set(routedSkills(text));
  for (const skill of routed) {
    if (!available.has(skill)) errors.push(`routes unknown skill \`${skill}\``);
  }
```

Delete the now-unused `mentioned` constant and the `CORE_SKILL_PREFIX` filter expression.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/pack-preview.mjs --self-test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/pack-plan.mjs
git commit -m "fix(validate): require required contracts to be routed, not mentioned

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Split `work-coordination` into acting / granting / item

**Files:**
- Create: `plugins/kai-core/skills/kai-core-work-acting/SKILL.md`
- Create: `plugins/kai-core/skills/kai-core-work-granting/SKILL.md`
- Create: `plugins/kai-core/skills/kai-core-work-item/SKILL.md`
- Delete: `plugins/kai-core/skills/kai-core-work-coordination/SKILL.md`
- Create: `docs/superpowers/plans/drop-records/kai-core-work-coordination.md`

**Interfaces:**
- Consumes: nothing
- Produces: three skill ids used as route targets by Tasks 7–9.

The source is 34,666 chars loaded by 41 agents, of which exactly one can ever grant a lease. Measured sections:

| Section | Lines | Chars | Destination |
| --- | --- | ---: | --- |
| Why durable, per-item state | 17–36 | 1,004 | **docs**, not a contract |
| Coordination surface | 37–55 | 391 | acting |
| Work-item record + Outcome / Acceptance / Evidence | 56–221 | 8,426 | **item** (minus the path registry) |
| BOARD.md | 222–237 | 685 | granting |
| Lifecycle, `ready` vs `executable` | 238–298 | 3,752 | granting |
| Claiming work safely | 299–404 | 6,026 | **split**: "Verify before every state-changing write" (361–371) → acting; the rest → granting |
| Parallel work and collisions | 405–419 | 613 | granting |
| Touch-set reconciliation | 420–455 | 1,827 | granting |
| Review routing | 456–486 | 1,595 | acting |
| HANDOFF packet | 487–508 | 843 | acting |
| COLLISION record | 509–526 | 779 | acting |
| RECOVERY record | 527–551 | 1,392 | granting |
| Design-waiver record | 552–579 | 1,572 | granting |
| QUESTION / ANSWER protocol | 580–625 | 1,850 | acting |
| Dispatch responsibilities | 626–660 | 1,835 | granting |
| Backlog | 661–675 | 526 | granting |
| Hard rules | 676–689 | 748 | split by reader |

- [ ] **Step 1: Capture the source**

```bash
git show HEAD:plugins/kai-core/skills/kai-core-work-coordination/SKILL.md > /tmp/work-coordination-source.md
```

- [ ] **Step 2: Write `kai-core-work-acting`**

Frontmatter follows the existing skill convention — copy the `name` / `description` shape from the source file's frontmatter, keeping the description under 180 characters.

Sections, in order: Coordination surface; Verify before every state-changing write; COLLISION record; HANDOFF packet; QUESTION / ANSWER protocol; Review routing; the hard rules that bind a dispatched agent.

Copy the prose **verbatim** from the captured source. Do not rewrite protocol text — the lease and collision wording is load-bearing for correctness. The only permitted edit is replacing a cross-reference to a section that moved, with:

```markdown
The grantor's side of this protocol lives in `kai-core-work-granting`.
```

- [ ] **Step 3: Write `kai-core-work-granting`**

Sections: Single grantor; Claiming work safely (minus the verify step, which went to acting); Collision and stale-lease recovery; Multi-machine and cross-branch scope; Lifecycle; `ready` vs `executable`; Parallel work and collisions; Touch-set reconciliation; RECOVERY record; Design-waiver record; Dispatch responsibilities; Backlog; BOARD.md; the grantor's hard rules.

Copy verbatim.

- [ ] **Step 4: Write `kai-core-work-item`**

Sections: the work-item record schema, its field rules, and the Outcome / Acceptance / Evidence templates.

**Omit the 27-path registry.** Replace the `artifact_targets` field rule with exactly:

```markdown
- **`artifact_targets`** lists every exact private workspace path, or
  project-qualified public path, for an asset-producing item. The convention is
  `.kai/state/initiatives/<slug>/artifacts/<domain>/<item-id>.md`, where
  `<domain>` is declared by the producing role. Exceptions are named in
  `kai-core-workspace-paths`. An operator-approved override is allowed only
  inside the resolved workspace, or inside the selected project's configured
  publication root using the project-qualified form, and must be recorded.
```

- [ ] **Step 5: Delete the original**

```bash
git rm -r plugins/kai-core/skills/kai-core-work-coordination
```

- [ ] **Step 6: Write the drop record**

Create `docs/superpowers/plans/drop-records/kai-core-work-coordination.md` listing every section from the table with its destination, plus these two removals:

- **The 27-path artifact registry** (inside `artifact_targets`, ~3,122 chars) — replaced by the convention stated in Task 4. Roles declare their own domain.
- **"Why durable, per-item state"** (1,004 chars) — rationale, not instruction. Move the text to `docs/how-kai-works.md`.

- [ ] **Step 7: Verify the sizes**

Run:
```powershell
Get-ChildItem plugins\kai-core\skills -Directory |
  Where-Object { $_.Name -like 'kai-core-work-*' } |
  ForEach-Object { "{0,7} ch  {1}" -f (Get-Content "$($_.FullName)\SKILL.md" -Raw).Length, $_.Name }
```
Expected: acting ≈ 4k, granting ≈ 14k, item ≈ 6k; total below the 34,666 source.

- [ ] **Step 8: Commit**

```bash
git add plugins/kai-core/skills docs/superpowers/plans/drop-records docs/how-kai-works.md
git commit -m "refactor(core): split work coordination by reader

41 agents loaded the grant protocol; exactly one role can grant. Acting,
granting and the item record now load separately, and the 27-path artifact
registry is replaced by a stated convention.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Split `workspace-conventions`, and state the path convention

**Files:**
- Create: `plugins/kai-core/skills/kai-core-workspace-paths/SKILL.md`
- Create: `plugins/kai-core/skills/kai-core-workspace-initiative/SKILL.md`
- Delete: `plugins/kai-core/skills/kai-core-workspace-conventions/SKILL.md`
- Create: `docs/superpowers/plans/drop-records/kai-core-workspace-conventions.md`

**Interfaces:**
- Consumes: `kai-core-work-item` from Task 3, which defers path exceptions to `kai-core-workspace-paths`
- Produces: `kai-core-workspace-paths`, `kai-core-workspace-initiative`

| Section | Chars | Destination |
| --- | ---: | --- |
| Resolution | 936 | paths |
| Private workspace | 1,529 | paths |
| Project publication | 1,425 | paths |
| Storage modes | 796 | paths |
| Run grammar | 980 | paths |
| Agent checklist | 715 | paths |
| Initiative artifacts | 2,168 | initiative |
| Coordination and closure | 1,005 | initiative |
| Manifest | 1,782 | initiative |
| Personal state and linked workspaces | 666 | initiative |

- [ ] **Step 1: Capture the source**

```bash
git show HEAD:plugins/kai-core/skills/kai-core-workspace-conventions/SKILL.md > /tmp/workspace-conventions-source.md
```

- [ ] **Step 2: Write `kai-core-workspace-paths`**

Copy the six `paths` sections verbatim, then append this section — the replacement for the deleted 27-path registry:

```markdown
## Artifact path convention

An item's durable asset lands at:

    .kai/state/initiatives/<slug>/artifacts/<domain>/<item-id>.md

`<domain>` is declared by the producing role in its own body, not listed here.
Adding a role does not change this contract.

Three departures are real, and only these:

| Departure | Form | Why |
| --- | --- | --- |
| Bundle output | `.../artifacts/<domain>/<item-id>/` (a directory) | the deliverable is several files, not one document |
| De-identified signal | `.../artifacts/<domain>/<item-id>.md`, contents de-identified | the location carries a privacy obligation, so the producing role states it |
| Public incident report | `project:<project-id>:docs/kai/reports/incidents/<incident-id>.md` | it publishes to a project, not the private workspace; raw evidence stays in `.kai/runs/` |
```

- [ ] **Step 3: Write `kai-core-workspace-initiative`**

Copy the four `initiative` sections verbatim.

- [ ] **Step 4: Delete the original**

```bash
git rm -r plugins/kai-core/skills/kai-core-workspace-conventions
```

- [ ] **Step 5: Write the drop record**

Record each section's destination. Note that no prose was dropped here — the path registry's removal is recorded in Task 3's drop record, and this task supplies its replacement.

- [ ] **Step 6: Commit**

```bash
git add plugins/kai-core/skills docs/superpowers/plans/drop-records
git commit -m "refactor(core): split workspace conventions; state the artifact path convention

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Split `asset-lifecycle` into producing / closing

**Files:**
- Create: `plugins/kai-core/skills/kai-core-asset-producing/SKILL.md`
- Create: `plugins/kai-core/skills/kai-core-asset-closing/SKILL.md`
- Delete: `plugins/kai-core/skills/kai-core-asset-lifecycle/SKILL.md`
- Create: `docs/superpowers/plans/drop-records/kai-core-asset-lifecycle.md`

**Interfaces:**
- Consumes: nothing
- Produces: `kai-core-asset-producing`, `kai-core-asset-closing`

| Section | Chars | Destination |
| --- | ---: | --- |
| The core rule | 392 | **both** — duplicate it |
| Four orthogonal state machines | 3,494 | producing |
| Pre-dispatch declaration | 1,468 | producing |
| Universal asset metadata | 1,459 | producing |
| Revision and supersession | 831 | producing |
| Migration rule | 548 | producing |
| Anti-patterns | 489 | producing |
| Completion is a four-dimensional verdict | 892 | closing |
| Completion authority | 1,656 | closing |
| Freshness and revalidation | 1,045 | closing |
| Placement and promotion | 1,634 | closing |
| Generator close transaction | 841 | closing |
| Initiative closure sweep | 1,125 | closing |
| Hard rules | 654 | split by reader |

- [ ] **Step 1: Capture the source**

```bash
git show HEAD:plugins/kai-core/skills/kai-core-asset-lifecycle/SKILL.md > /tmp/asset-lifecycle-source.md
```

- [ ] **Step 2: Write both skills**

Copy sections verbatim per the table. "The core rule" appears in both: a producer and a closer each need it, and duplicating 392 chars is cheaper than a third skill and a route to reach it.

- [ ] **Step 3: Delete the original**

```bash
git rm -r plugins/kai-core/skills/kai-core-asset-lifecycle
```

- [ ] **Step 4: Write the drop record**

Record each section's destination, and note the deliberate duplication of "The core rule".

- [ ] **Step 5: Commit**

```bash
git add plugins/kai-core/skills docs/superpowers/plans/drop-records
git commit -m "refactor(core): split asset lifecycle into producing and closing

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Replace `team-operating-rules` with `operating-rules`

**Files:**
- Create: `plugins/kai-core/skills/kai-core-operating-rules/SKILL.md`
- Delete: `plugins/kai-core/skills/kai-core-team-operating-rules/SKILL.md`
- Create: `docs/superpowers/plans/drop-records/kai-core-team-operating-rules.md`

**Interfaces:**
- Consumes: nothing
- Produces: `kai-core-operating-rules` — routed by all 27 agents

The source is 15,897 chars loaded by all 55 agents, and most of it is a 30-role ownership map nothing routes off. Target: under 4,000 chars.

- [ ] **Step 1: Capture the source**

```bash
git show HEAD:plugins/kai-core/skills/kai-core-team-operating-rules/SKILL.md > /tmp/operating-rules-source.md
```

- [ ] **Step 2: Write `kai-core-operating-rules`**

Keep exactly these six things, copying wording from the source where it exists:

1. **The role-kind taxonomy** — what `director-*`, `principal-*`, `workflow-*`, `persona-*`, `instructor-*` and `eng-lead-*` mean as *kinds*. Not a list of roles.
2. **Stay in your lane** — do the work you own; route what you do not own as a proposal rather than doing it.
3. **The human gates**, verbatim from source lines 75, 79, 89, 100, 106 and 111, collected as one list:

```markdown
## Actions no agent takes alone

These are irreversible and external. Prepare the work, then hand the decision
to `@operator`:

- accepting commercial terms;
- contacting a prospect or customer;
- accepting residual security or privacy risk;
- spending money, or sending to a list;
- publishing anything externally;
- deploying to production.
```

4. **Never call something `shipped`** that a human has not deployed and verified.
5. **Escalate to `@operator`** only for a decision no kai role owns.
6. **An assessor does not repair what it assessed** — one sentence, naming `kai-core-no-self-remediation` as the full contract.

- [ ] **Step 3: Delete the original**

```bash
git rm -r plugins/kai-core/skills/kai-core-team-operating-rules
```

- [ ] **Step 4: Write the drop record**

This is the largest deletion in the refactor, so be specific. Record that the 30-role ownership map was removed; list the role ids it named; and state that each role's own authority moves into that role's body (Tasks 7–9) while cross-role authority is deleted, because nothing routes off it — the host routes on each agent's `description`.

- [ ] **Step 5: Verify the size**

Run:
```powershell
"{0} ch" -f (Get-Content plugins\kai-core\skills\kai-core-operating-rules\SKILL.md -Raw).Length
```
Expected: under 4,000. If it is over, part of the ownership map survived — remove it.

- [ ] **Step 6: Commit**

```bash
git add plugins/kai-core/skills docs/superpowers/plans/drop-records
git commit -m "refactor(core): replace the 30-role ownership map with universal rules

Nothing routed off the cross-role map; the host routes on description.
What is load-bearing -- the human gates on irreversible external actions,
and self-restraint -- survives as short universal rules.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Rewrite `director-chief-of-staff`

**Files:**
- Modify: `plugins/kai-core/agents/director-chief-of-staff.agent.md`
- Create: `docs/superpowers/plans/drop-records/director-chief-of-staff.md`

**Interfaces:**
- Consumes: all eight skills from Tasks 3–6
- Produces: the reference body shape every later agent copies

This agent goes first because its split defines the acting/granting boundary the others route against. It is the largest body (25,268 chars) and the only lease grantor.

- [ ] **Step 1: Remove the eager line**

Delete line 7 (`**Inherits:** ...`) and the block-quoted paragraph after it beginning "Load and apply every skill listed above". Add under the title:

```markdown
**Primary profile:** judgment
```

Do **not** add an `**Identity contract:**` line — Task 10 deletes that concept. Until then this agent fails validation, which is expected.

- [ ] **Step 2: Delete the role taxonomy list**

Remove the 26-role bullet list in `## Role taxonomy` (lines ~37–71). Keep the three lines defining what `director-*`, `principal-*` and `workflow-*` mean, and replace the list with:

```markdown
Your authority is coordination. The operator owns vision and final business
decisions; the initiative steward owns scope and priority; each specialist owns
its own domain and says so in its own definition. You own dispatch,
follow-through, reconciliation, escalation, and status.

Which roles exist in this session is a fact about the installed packs, not
something to recall — resolve it from the roster before dispatching.
```

Leave the existing "Resolve role availability" section intact. It already says to read the roster rather than recall it, which is what now carries this weight.

- [ ] **Step 3: Add routes at the instructions that need them**

Place each sentence at the step that needs it. Do **not** collect these into one section.

| Where | Sentence |
| --- | --- |
| "Load and reconcile", before reading state | ``Invoke `kai-core-workspace-paths` before touching workspace state.`` |
| "Load and reconcile", before reading initiatives | ``Load `kai-core-workspace-initiative` before reading initiative state.`` |
| "Select executable work", before leasing | ``Apply `kai-core-work-granting` before granting any lease.`` |
| "Dispatch real roles", at the item write | ``Load `kai-core-work-item` before writing an item record.`` |
| Before its own durable writes | ``Invoke `kai-core-work-acting` before writing durable state.`` |
| Where it coordinates with a peer | ``Load `kai-core-operating-rules` before coordinating with another role.`` |
| At artifact creation | ``Load `kai-core-asset-producing` before creating a durable artifact.`` |
| At completion | ``Apply `kai-core-asset-closing` before recording completion.`` |

- [ ] **Step 4: Verify size and routes**

Run:
```powershell
$p = 'plugins/kai-core/agents/director-chief-of-staff.agent.md'
"{0} ch (limit 30000)" -f (Get-Content $p -Raw).Length
node -e "import('./scripts/lib/pack-plan.mjs').then(async m=>{const fs=await import('node:fs');console.log(m.routedSkills(fs.readFileSync(process.argv[1],'utf8')))})" $p
```
Expected: under 30,000 chars — it should now be ~2,800 chars smaller — and all eight route targets listed.

- [ ] **Step 5: Write the drop record**

Record the eager line, the 26-role taxonomy, and the "load and apply every skill" paragraph, each with its destination: deleted, replaced by roster resolution, or replaced by inline routes.

- [ ] **Step 6: Commit**

```bash
git add plugins/kai-core/agents/director-chief-of-staff.agent.md docs/superpowers/plans/drop-records
git commit -m "refactor(core): rewrite the director onto inline contract routes

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: Rewrite the remaining six `kai-core` agents

**Files:**
- Modify: `plugins/kai-core/agents/director-executive-assistant.agent.md`
- Modify: `plugins/kai-core/agents/workflow-initiative-init.agent.md`
- Modify: `plugins/kai-core/agents/workflow-proactive-scan.agent.md`
- Modify: `plugins/kai-core/agents/workflow-self-check.agent.md`
- Modify: `plugins/kai-core/agents/workflow-weekly-pulse.agent.md`
- Modify: `plugins/kai-core/agents/workflow-workspace-init.agent.md`
- Create: one drop record per agent

**Interfaces:**
- Consumes: the body shape established in Task 7
- Produces: six rewritten core agents

Apply Task 7's procedure to each — remove the eager line and its directive paragraph, add `**Primary profile:**`, place routes at the instructions that need them, write the drop record. Per-agent specifics below.

**`director-executive-assistant`** — additionally delete the 20-row routing table (lines ~96–117). It restates each target agent's `description`, which the host already loads. Replace with:

```markdown
Route by what the operator needs, using the roles this session actually
exposes. Each role's own definition states what it is for; read the roster
rather than recalling a table.
```

Keep only a row whose target is **not** deducible from that target's own description. Record every deleted row in the drop record.

**`workflow-self-check`** — it is on the assessor roster, so it must route the assessor contract. Add at its assessment step:

```markdown
Apply `kai-core-no-self-remediation` before writing findings.
```

Task 11 re-points the roster check at the parser, and this route is what it will look for.

**`workflow-proactive-scan`** and **`workflow-weekly-pulse`** — both write local state (an outbox payload; a ledger advance), so both need ``Invoke `kai-core-work-acting` before writing durable state.`` Do not treat either as read-only.

**`workflow-workspace-init`** and **`workflow-initiative-init`** — both construct workspace state; both route `kai-core-workspace-paths` and `kai-core-workspace-initiative`.

- [ ] **Step 1: Rewrite each of the six**

- [ ] **Step 2: Verify all seven core agents**

Run:
```powershell
Get-ChildItem plugins\kai-core\agents -Filter *.agent.md | ForEach-Object {
  $t = Get-Content $_.FullName -Raw
  "{0,-32} {1,6} ch  inherits-line:{2}" -f `
    ($_.BaseName -replace '\.agent$',''), $t.Length, ($t -match '(?m)^\*\*Inherits:\*\*')
}
```
Expected: every body under 30,000 chars, `inherits-line:False` for all seven.

- [ ] **Step 3: Commit**

```bash
git add plugins/kai-core/agents docs/superpowers/plans/drop-records
git commit -m "refactor(core): rewrite the remaining six core agents onto inline routes

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 9: Rewrite the 20 `kai-engineering` agents

**Files:**
- Modify: all 20 files in `plugins/kai-engineering/agents/`
- Create: one drop record per agent

**Interfaces:**
- Consumes: the shape from Tasks 7–8
- Produces: 20 rewritten engineering agents; the pack no longer carries duplicated guard blocks

`eng-lead-technical-writing` is already close to the target. It still needs three edits: drop its `**Identity contract:**` line; un-hoist its "Load the rest only where the work calls for it" list, which is exactly the hoisted route list this refactor removes; and re-point its route targets at the new skill ids.

Every other agent additionally needs its two guard blocks replaced.

- [ ] **Step 1: Replace the guard blocks with an inline refusal**

Each department agent carries a 728-char preflight block and an 840-char degraded block, both CI-pinned verbatim. Delete both. At the point where the agent first routes a core contract, write its own refusal in its own words — one or two sentences carrying these three facts:

1. continue only with direct, single-shot work in this role's own domain;
2. do not create `.kai` state, claim coordinated work, or report Kai activity;
3. tell the operator to install or update `kai-core`.

Keep ``Invoke `kai-core-contract-v1` before the first other core skill.``

Until Task 10 lands, `progressiveSkillRoutingErrors` still pins the refusal's exact wording, so every agent rewritten here fails validation. That is expected — Task 10 replaces the pinned sentence with a check for the three facts above.

Do not copy one agent's refusal into another. The point of removing the pinned block is that the sentence belongs to the role.

- [ ] **Step 2: Rewrite each body**

Same procedure as Task 7. Route targets by role type:

| Role type | Routes |
| --- | --- |
| all 20 | `kai-core-contract-v1`, `kai-core-operating-rules` |
| produces an artifact (most) | `kai-core-asset-producing` |
| touches workspace state | `kai-core-workspace-paths` |
| claims or hands off an item | `kai-core-work-acting`, `kai-core-work-item` |
| assessors: `principal-security`, `principal-privacy-compliance`, `principal-qa-ui`, `workflow-doc-review`, `workflow-issue-analysis` | `kai-core-no-self-remediation` |
| `workflow-ship` | also `kai-core-asset-closing` — it is the release gate |
| **none of them** | `kai-core-work-granting`. Only the director grants. |

Each agent states its own artifact domain, per Task 4's convention. For example, in `principal-security`:

```markdown
Your artifacts land under
`.kai/state/initiatives/<slug>/artifacts/security/<item-id>.md`.
```

- [ ] **Step 3: Verify the pack**

Run:
```powershell
Get-ChildItem plugins\kai-engineering\agents -Filter *.agent.md | ForEach-Object {
  $t = Get-Content $_.FullName -Raw
  "{0,-36} {1,6} ch  inherits:{2}  identity:{3}" -f `
    ($_.BaseName -replace '\.agent$',''), $t.Length, `
    ($t -match '(?m)^\*\*Inherits:\*\*'), ($t -match 'Identity contract')
}
```
Expected: all under 30,000 chars; `inherits:False` and `identity:False` for all 20. `principal-ai-applied-engineer` starts at 27,392 chars — confirm it shrank.

- [ ] **Step 4: Commit**

```bash
git add plugins/kai-engineering/agents docs/superpowers/plans/drop-records
git commit -m "refactor(engineering): rewrite 20 agents onto inline routes

Removes ~1.5k chars of pinned dependency-guard prose per agent in favour
of a refusal each role states in its own words.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 10: Collapse the validator to one agent shape

**Files:**
- Modify: `scripts/validate-plugin.mjs:273-320` (the agent loop)
- Modify: `scripts/lib/pack-plan.mjs` — rename `progressiveSkillRoutingErrors` to `agentRoutingErrors`; delete `ROLE_IDENTITY_CONTRACT` and the guard-block machinery
- Delete: `scripts/lib/inherits-block.txt`, `scripts/lib/preflight-block.txt`, `scripts/lib/degraded-block.txt`

**Interfaces:**
- Consumes: `routedSkills` (Task 1); the rewritten agents (Tasks 7–9)
- Produces: `agentRoutingErrors({ id, body, tools, knownSkills, activityExempt }) -> string[]` — the single shape check, applied to every agent with no opt-in marker

- [ ] **Step 1: Write the failing test**

```js
// --- one shape: an eager inheritance line is now simply invalid
ok(agentRoutingErrors({
  id: 'eng-lead-x',
  body: '**Inherits:** '
      + '`kai-core-operating-rules`\n',
  tools: ['skill'], knownSkills: ['kai-core-operating-rules'],
}).some((e) => /must not declare an eager `\*\*Inherits:\*\*` line/.test(e)),
'an eager inheritance line fails for every agent, with no identity marker to opt in');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/pack-preview.mjs --self-test`
Expected: FAIL with `agentRoutingErrors is not defined`

- [ ] **Step 3: Rewrite the checker**

In `scripts/lib/pack-plan.mjs`, rewrite `progressiveSkillRoutingErrors` (line 1206) as `agentRoutingErrors`. Four changes inside it, none optional:

1. **Delete the opt-in guard** at line 1210 — `if (!text.includes('**Identity contract:** ...')) return [];`. Every agent is now checked, not just the labelled one. Then delete `export const ROLE_IDENTITY_CONTRACT` (line 1094), `agentIdentityContractErrors`, every reference to both, and the `progressive` branch inside `guaranteeBlockErrors`.

2. **Replace the `mentioned` / `routed` block** (lines 1226–1235) — already done in Task 2.

3. **Update the `required` list** (lines 1240–1249) to the new contract ids. It still names three skills this plan deletes, so the check would throw or pass vacuously:

```js
  const required = [CONTRACT_SKILL, 'kai-core-operating-rules'];
  if (requiresCoordinatedRunContracts(id)) {
    required.push('kai-core-workspace-paths', 'kai-core-work-acting');
    if (!activityExempt) required.push('kai-core-work-activity');
  }
```

`kai-core-asset-producing` is deliberately **not** required — an agent that produces no artifact should not route it. Task 9's per-role table governs that.

4. **Relax the pinned fallback sentence** (lines 1265–1270). Three regexes currently pin the refusal's exact wording, which contradicts Task 9's instruction to write it in the role's own words. Replace with a check for the three *facts*, in any phrasing:

```js
  // The refusal belongs to the role, so its wording is the author's. What is
  // load-bearing is that all three facts are present: keep working narrowly,
  // write no shared state, and tell the operator. Pinning the sentence itself
  // is what made 49 agents carry the same 840 characters.
  const missing = [];
  if (!/\b(single-shot|direct, one-off|on its own)\b/i.test(flat)) missing.push('that it continues only with direct, single-shot work');
  if (!/`\.kai`[\s\S]{0,40}state/i.test(flat)) missing.push('that it creates no `.kai` state');
  if (!/install or update `kai-core`/i.test(flat)) missing.push('that the operator should install or update `kai-core`');
  if (missing.length) {
    errors.push(`must state the core fallback in its own words, including ${missing.join(', and ')}`);
  }
```

In `scripts/validate-plugin.mjs`, replace the whole agent loop body (lines 273–320) with:

```js
for (const agent of agentFiles) {
  const raw = readFileSync(agent.path, 'utf8').replace(/\r\n/g, '\n');
  for (const msg of agentRoutingErrors({
    id: agent.id,
    body: raw,
    tools: parseToolList(agent.fm?.tools) || [],
    knownSkills: skillIds,
    activityExempt: ACTIVITY_EXEMPT.has(agent.id),
  })) err(rel(agent.path), msg);
}
```

Delete the `inheritsBlock` read and its verbatim-directive check, and the preflight/degraded block reads.

```bash
git rm scripts/lib/inherits-block.txt scripts/lib/preflight-block.txt scripts/lib/degraded-block.txt
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/pack-preview.mjs --self-test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A scripts
git commit -m "refactor(validate): collapse two agent shapes into one

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 11: Re-point the assessor and tool checks at routes

**Files:**
- Modify: `scripts/lib/pack-plan.mjs` (add `assessorContractErrors`)
- Modify: `scripts/validate-plugin.mjs:577-605` (assessor roster)
- Modify: `scripts/validate-plugin.mjs:653-668` (`requires_tools` scan)

**Interfaces:**
- Consumes: `routedSkills` (Task 1)
- Produces: `assessorContractErrors({ id, body }) -> string[]`

Both checks read `^\*\*Inherits:\*\*`, which no longer exists. Left alone they pass vacuously — reporting green while enforcing nothing, which is worse than failing.

- [ ] **Step 1: Write the failing test**

```js
// --- an assessor must ROUTE the no-self-remediation contract, not mention it
ok(assessorContractErrors({
  id: 'principal-security',
  body: 'You review code.\nSee `kai-core-no-self-remediation`.',
}).length === 1, 'a mention does not satisfy the assessor contract');
ok(assessorContractErrors({
  id: 'principal-security',
  body: 'Apply `kai-core-no-self-remediation` before writing findings.',
}).length === 0, 'a real route satisfies it');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/pack-preview.mjs --self-test`
Expected: FAIL with `assessorContractErrors is not defined`

- [ ] **Step 3: Implement**

Add to `scripts/lib/pack-plan.mjs`:

```js
export const ASSESSOR_CONTRACT = 'kai-core-no-self-remediation';

// An assessor that quietly repairs what it assessed destroys the finding: it no
// longer reproduces, so it is never reported. The constraint is directional and
// a `tools` grant cannot express it, so roster membership is pinned in the
// validator and the route itself is verified here.
export function assessorContractErrors({ id, body }) {
  if (!routedSkills(body).includes(ASSESSOR_CONTRACT)) {
    return [`is on the assessor roster but does not load \`${ASSESSOR_CONTRACT}\` at the step that needs it`];
  }
  return [];
}
```

In `scripts/validate-plugin.mjs`, replace the roster's inherits-line check with a call to `assessorContractErrors`, keeping the existing `ASSESSOR_ROLES` list and its "roster names an agent that does not exist" error.

Replace the `requires_tools` line scan with:

```js
    const routed = routedSkills(raw);
    for (const skill of routed) {
      const need = requires.get(skill);
      if (!need) continue;
      for (const tool of need) {
        if (!held.has(tool)) {
          err(rel(agent.path), `routes \`${skill}\`, which requires the \`${tool}\` tool, but its \`tools\` list omits it`);
        }
      }
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/pack-preview.mjs --self-test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts
git commit -m "fix(validate): check assessor and tool contracts against routes

Both read the inheritance line this refactor deletes; left alone they
would pass vacuously, reporting green while enforcing nothing.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 12: Re-point the registries and get the in-scope packs green

**Files:**
- Modify: `scripts/validate-plugin.mjs` (constants at 213-214; the workspace-conventions rule at 337-338; the contract-consistency section at 812-820)
- Modify: `scripts/pack-preview.mjs` (selfTest fixtures at ~1310 and ~1502-1547)
- Modify: `scripts/generate-catalog.mjs` (`CATEGORIES`, lines 153-154)
- Modify: `scripts/lib/pack-plan.mjs` (`SKILL_OWNER_OVERRIDES`)
- Modify: prose references in `scripts/lib/coordination.mjs`, `scripts/work-status.mjs`, `scripts/workspace-doctor.mjs`
- Modify: ~24 sibling `SKILL.md` files that cross-reference a deleted contract
- Modify: `AGENTS.md`, `docs/host-capabilities.md`, `docs/proposals/pack-architecture.md`, `test/README.md`
- Modify: `test/fixtures/inventory.json`, `test/fixtures/spine-workspace/.kai/CONVENTIONS.md`
- Modify: `docs/reference/agents-and-skills.md` (generated — do not hand-edit)
- **Do not touch:** `CHANGELOG.md`, `docs/kai/reports/releases/**` (dated historical records — a past entry naming a deleted contract was true when written), or any `plugins/*/scripts/**` tree (generated by `materializePacks`, gated by `pack-preview --check`)

**Interfaces:**
- Consumes: everything above
- Produces: `npm test` passing for `kai-core` and `kai-engineering`

- [ ] **Step 1: Take the reference inventory**

Nothing may be left pointing at a contract that no longer exists. Start from the full list:

```bash
git grep -n -- 'kai-core-work-coordination\|kai-core-asset-lifecycle\|kai-core-team-operating-rules\|kai-core-workspace-conventions' \
  | grep -v '^CHANGELOG.md\|^docs/kai/reports/releases/\|^plugins/[a-z-]*/scripts/'
```

Work the list to empty. Every hit is one of three things — re-point it to the new contract that carries that rule, delete it if the rule itself is gone, or leave it if it is a historical record (and none of those survive the filter above).

- [ ] **Step 2: Re-point the validator's hard-coded contract constants**

`scripts/validate-plugin.mjs` names deleted skills in three places:

- **Lines 213-214** — `BASELINE_SKILL` and `ASSET_LIFECYCLE_SKILL`. Both exist to enforce the legacy `**Inherits:**` baseline that Task 10 deleted. Delete both constants and every use.
- **Lines 337-338** — "durable and coordinating roles must inherit `kai-core-workspace-conventions`". This duplicates what `agentRoutingErrors`' `required` list now enforces against routes. Delete it.
- **Lines 812-820** — the contract-consistency section reads the conventions SKILL file and cross-checks it against `kai-core-workspace-onboarding`, `workflow-workspace-init`, `workflow-initiative-init` and `.gitignore`. This check is still wanted; re-point `conventionsPath` at `kai-core-workspace-paths`. If a cross-checked run area moved to `kai-core-workspace-initiative` instead, read both files and concatenate.

- [ ] **Step 3: Update the selfTest fixtures**

`scripts/pack-preview.mjs` builds agent-body fixtures out of the deleted ids (~1310, and the `progressiveSkillBody` block at 1502-1547). Re-point each to its replacement so the fixtures exercise the new `required` list. The fixture at 1546 deliberately routes a skill *outside* the required set — keep that shape, using `kai-core-work-granting`.

- [ ] **Step 4: Update the sibling skill cross-references**

About 24 `SKILL.md` files mention a deleted contract in prose — including `kai-core-definition-of-done`, `kai-core-initiative-stewardship`, `kai-core-no-self-remediation`, `kai-core-scope-discipline`, `kai-core-work-activity`, `kai-core-peer-communication`, `kai-core-decision-brief`, `kai-core-design-grounding`, `kai-core-pr-delivery`, and `kai-core-create-agent/references/*`. Re-point each to the specific new contract that now carries the rule it was pointing at. Do not blanket-replace one id with another — the four originals each split by reader, so the correct target depends on what the sentence was talking about.

- [ ] **Step 5: Update the skill registries**

In `scripts/generate-catalog.mjs`, replace the four deleted skill ids in `CATEGORIES` (lines 153-154) with the eight new ones. Coverage is enforced — every skill must be filed under exactly one heading or the build fails.

In `scripts/lib/pack-plan.mjs`, update `SKILL_OWNER_OVERRIDES` if any deleted id appears there.

- [ ] **Step 6: Update `test/fixtures/inventory.json`**

This is a host-contract fixture listing the shipped inventory. Find and run its generator rather than hand-editing it. If no generator exists, say so in the report and update it by hand against the real skill list.

- [ ] **Step 7: Regenerate the catalog**

Run: `node scripts/generate-catalog.mjs`
Then: `node scripts/generate-catalog.mjs --check`
Expected: PASS

- [ ] **Step 8: Update `AGENTS.md` and the reference docs**

Rewrite the "Routing shared contracts" section. It currently describes two agent
shapes: an eager `**Inherits:**` line pinned to a file this plan deletes,
and an opt-in identity-contract label.
Replace both with the single shape: no eager line; imperative routes at the
instruction that needs them; never hoisted into a list. Remove the reference to
`scripts/lib/inherits-block.txt`.

Also fix `docs/host-capabilities.md` (lines 37-47 show the deleted eager line as
the worked example), `docs/proposals/pack-architecture.md:345`, and
`test/README.md:59-62`.

- [ ] **Step 9: Run the full suite**

Run: `npm test`
Expected: `kai-core` and `kai-engineering` pass. **The other three packs fail** — their 29 agents still carry eager lines and reference deleted skills. That is the known, accepted end state for this plan. Record the failing count in the commit message.

- [ ] **Step 10: Measure the result**

Run:
```powershell
$skill=@{}
Get-ChildItem -Recurse plugins -Filter SKILL.md | ForEach-Object { $skill[$_.Directory.Name]=(Get-Content $_.FullName -Raw).Length }
Get-ChildItem plugins\kai-core\agents,plugins\kai-engineering\agents -Filter *.agent.md | ForEach-Object {
  $t=Get-Content $_.FullName -Raw
  $r=[regex]::Matches($t,'\b(?:Load|Invoke|Apply|Run)\s+(?:the\s+)?`([a-z0-9-]+)`') |
     ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
  $b=($r | ForEach-Object { if($skill.ContainsKey($_)){$skill[$_]} else {0} } | Measure-Object -Sum).Sum
  "{0,-36} ~{1,6} tok" -f ($_.BaseName -replace '\.agent$',''), [math]::Round(($b+$t.Length)/4)
}
```
Expected: worker agents in the 6–8k range against a ~28,798 baseline. Record the numbers for Task 13.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor: point registries and contributor rules at the single agent shape

kai-core and kai-engineering pass; the three remaining department packs
fail pending the same treatment.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 13: Operator verification

**Files:** `docs/superpowers/plans/2026-09-04-agent-contract-refactor-verification.md`

No behavioral test suite exists, so the accuracy claim belongs to the operator, not to this plan.

- [x] **Step 1: Present the measurements**

Done in the verification record. Before is the eager floor at `2ecabe7`; after is the routing ceiling at `39332f3`. Mean 30,194 → 17,529 worst case across the 26 agents that were legacy. Zero routes fail to parse, and that check now actually executes.

- [x] **Step 2: Ask the operator to run representative tasks**

Offered and declined in favour of shipping. The three proposed tasks are written into the verification record's "How to check it for yourself" so the gate stays available after merge.

- [x] **Step 3: Present the drop records**

32 records in `drop-records/` — 27 agents plus 4 contracts, and the validator-shape amendment. The verification record states plainly that a drop record is a claim, not a test.

- [x] **Step 4: Record what is not verified**

The verification record's "What this does not prove" section: no check confirms an agent kept every rule it needs, no check confirms quality improved, the after numbers are a ceiling, and token count is not the goal.

---

## Follow-on, not in this plan

- The `kai-gtm`, `kai-product` and `kai-personal` packs — the same treatment, once this shape is proven.
- Wiring `kai-core-fleet-observation` to the roles that should load it.
- Re-deriving a body-size target from what refactored bodies actually need.
- The release: one batched version bump across five packs, per `AGENTS.md`.

## Release landmine: regenerate only what has migrated

`pack-preview --write` **strips** any `kai core dependency guard` region it
finds; it never emits one. The 29 agents in `kai-gtm`, `kai-product` and
`kai-personal` still carry that region in their sources and still need it,
because they have not moved to inline routes.

So a blanket `--write` during the batched release would silently remove the
guard from all 29 and break the `pack-preview.mjs:633` self-test. At release
time, regenerate `kai-core` and `kai-engineering` only, and leave the three
unmigrated packs' trees alone until their own migration lands. Their `--check`
divergence — 29 guard-region drifts — is expected until then.

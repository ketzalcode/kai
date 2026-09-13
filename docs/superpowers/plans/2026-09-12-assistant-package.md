# Kai Assistant Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver `kai-assistant` as direct personal assistance and user-voice authoring, and remove the executive-assistant router from core.

**Architecture:** First make core's operator-signal rules independent of personal-agenda assembly. Then deliver the two assistant agents and four local skills as one coherent package, updating only necessary ownership, installation, and live references. This is the first package unit, not an organization-wide refactor.

**Tech Stack:** Markdown agents and skills, existing Node.js ESM generators, JSON manifests, existing `.kai/personal/` state.

**Spec:** `docs/superpowers/specs/2026-09-12-package-boundaries-design.md`

## Global Constraints

- Move executive assistance out of core and redesign it as personal assistance. Do not preserve the default-entry-point or organization-router behavior.
- The session chooses specialists.
- There is one owning package for each agent and skill, not duplicate copies.
- Load context at the task that needs it: a message draft does not require an agenda scan, an agenda does not require the complete voice history, and a private task update does not require a lease protocol.
- Keep personal state private and preserve existing data paths during this refactor.
- Package-local coherence is not runtime verification.
- Keep the final safety, behavioral, and test/CI consolidation after the refactor and its two refinement passes. Red intermediate checks are accepted.
- Deferring a safety-review phase does not permit removing consent, privacy, factual-grounding, or authority boundaries.

**Execution exception:** the operator explicitly deferred per-change TDD,
full-suite runs, and validator repair. The steps below use source inspection
and artifact generation, not a red/green test cycle. Do not add a test runner,
repeatedly run `npm test`, or tune instructions to diagnostic counts.

---

## File structure and boundaries

| File | Responsibility |
| --- | --- |
| `plugins/kai-core/skills/kai-core-proactive-scan/SKILL.md` | Canonical interpretation of existing operator signals, plus its existing notification method |
| `plugins/kai-core/agents/workflow-proactive-scan.agent.md` | Core signal workflow; no assistant requirement |
| `plugins/kai-assistant/agents/personal-assistant.agent.md` | Direct personal tasks, agendas, briefings, and ordinary drafts |
| `plugins/kai-assistant/agents/persona-self.agent.md` | Direct user-voice authoring specialty |
| `plugins/kai-assistant/skills/personal-agenda/SKILL.md` | Personal task lifecycle and optional team-signal agenda |
| `plugins/kai-assistant/skills/decision-brief/SKILL.md` | Evidence-based personal briefing without consultations |
| `plugins/kai-assistant/skills/extract-writing-style/SKILL.md` | Explicitly requested voice-profile extraction |
| `plugins/kai-assistant/skills/write-in-user-voice/SKILL.md` | Shared application of supplied or approved stored voice profiles |
| `scripts/lib/pack-plan.mjs` | Add assistant install ownership; remove retired identity entries |
| `scripts/generate-catalog.mjs` | Category membership and direct-invocation descriptions |
| `.github/plugin/marketplace.json` | Assistant install entry |
| `docs/reference/packages/kai-assistant.md` | Direct use, responsibility changes, and known limitations |

`plugins/*/scripts/`, pack manifests/locks, catalog, and inventory remain
generated. Never hand-edit their copies. Do not move or create private user
state while changing plugin source.

The package unit deliberately keeps both agents and all four local skills in
one task: splitting their relocation would make shared voice-method ownership
temporarily cross-package and mislead the existing partition inference.

## Interfaces

| Interface | Input | Output / invariant |
| --- | --- | --- |
| Operator signals | Explicitly selected workspace items and threads | Existing question/release-ready interpretation; no coordination writes |
| Personal tasks | User request plus `.kai/personal/inbox.md` | Same file and existing task IDs; agenda is derived |
| Decision brief | Supplied evidence or a selected authoritative team question/item | Options, provenance, uncertainties, next action; never a team ANSWER or approval |
| Voice extraction | Explicitly selected/approved writing samples | Existing `.kai/personal/identity/voice.md` format |
| Voice application | Message intent, audience, facts, and supplied/approved profile | A draft preserving facts and uncertainty; never publication |

The two agents directly invoke local skills at the relevant instruction.
No agent-to-agent call is required between them.

## Known implementation facts

- `PACK_ORDER` is derived from `MIGRATION_BASELINE_PACKS` and `NEW_AGENT_IDS`.
  `sourceAgentFiles` and `sourceSkillFiles` traverse only that order: an
  unregistered new directory is invisible to the generator.
- Skill ownership is inferred from agent loads by `planPacks`. Both assistant
  agents must be registered and co-located before generation.
- `COMMITTED_PACKS` and the CI runtime matrix derive from the partition. Do not
  hardcode a new matrix or redesign discovery.
- `personal-assistant` is the approved ID. The current
  `agentTaxonomyErrors` binds the `personal` family to `kai-personal` and
  requires a different posture shape. Record this policy mismatch for the
  final validation phase; do not rename the agent or weaken that check here.
- Existing `ACTIVITY_EXEMPT` and `ACTING_EXEMPT` maps name the retiring
  director. Remove that obsolete membership; do not add a new routing or
  exemption registry. Leave the validation algorithm alone.

## Task 1: Keep operator-signal interpretation in core

**Files:**
- Modify: `plugins/kai-core/skills/kai-core-proactive-scan/SKILL.md`
- Modify: `plugins/kai-core/agents/workflow-proactive-scan.agent.md`
- Modify: `plugins/kai-core/skills/kai-core-personal-agenda/SKILL.md`

**Interfaces:**
- Consumes: current personal-agenda **Source A**, including matching ANSWER
  handling and the distinction between operator work and steward work.
- Produces: a canonical `## Operator signals` section in
  `kai-core-proactive-scan`, independent of an assistant skill or agent.
- Task 2 consumes that section for an explicitly requested team-aware agenda.

- [ ] **Step 1: Preserve the source rules before relocating them.**

Read Source A in full. Preserve these six distinctions in the new section:

1. Open `@operator` questions have no matching answered ANSWER; the original
   QUESTION line's stale `status: open` is not sufficient.
2. Preserve `kind: decision|reply|action`; do not reinterpret a reply as an
   operator decision.
3. An item in `release-ready` is a deploy gate, not a completed deployment.
4. Overdue comes from the question's `answer_by`, not inferred urgency.
5. A blocking question must be associated with its item; a proposed item alone
   is steward work, not an operator alert.
6. Missing or unreadable input is not evidence that an open signal cleared.

- [ ] **Step 2: Make the core section authoritative.**

Replace `What the scan reads`' dependency on personal-agenda Source A with the
new `Operator signals` section. Preserve the current scan/ack, hashing, ledger,
payload, partial-root, consent, and runner semantics unchanged.

Separate interpretation from notification execution in the new section:

```markdown
## Operator signals

Use this section to interpret existing team records for a requested briefing
or scan. Reading these signals does not require emitting notifications,
allocating an outbox payload, or advancing a delivery ledger.
```

Follow that opening with the preserved rules and their record sources. Do not
copy personal inbox, voice freshness, or career nudges into core.

- [ ] **Step 3: Update the two consumers.**

In `workflow-proactive-scan`, point step 2 at the core skill's Operator signals
section. Keep its existing `Apply` instruction for the scan contract; do not
add a separate eager load list.

Replace personal-agenda Source A with a reference to the canonical section
plus its personal rendering rules. Remove the scan workflow's assertion that
every operator action must go through `director-executive-assistant`.

- [ ] **Step 4: Inspect the seam, then commit.**

Read all three changed sections together: the core scan must no longer
require personal-agenda; the agenda may consume core. Confirm that none of the
six distinctions changed. This is source evidence, not a runtime result.

```powershell
git diff --check
git diff -- plugins\kai-core\skills\kai-core-proactive-scan\SKILL.md plugins\kai-core\agents\workflow-proactive-scan.agent.md plugins\kai-core\skills\kai-core-personal-agenda\SKILL.md
git add -- plugins\kai-core\skills\kai-core-proactive-scan\SKILL.md plugins\kai-core\agents\workflow-proactive-scan.agent.md plugins\kai-core\skills\kai-core-personal-agenda\SKILL.md
git commit -m "refactor(core): own operator-signal interpretation independently of assistant" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

## Task 2: Deliver the complete direct-assistance package

**Create:**
- `plugins/kai-assistant/agents/personal-assistant.agent.md`
- `plugins/kai-assistant/skills/write-in-user-voice/SKILL.md`
- `docs/reference/packages/kai-assistant.md`

**Move and refactor:**
- `plugins/kai-personal/agents/persona-self.agent.md` → `plugins/kai-assistant/agents/persona-self.agent.md`
- `plugins/kai-personal/skills/extract-writing-style/` → `plugins/kai-assistant/skills/extract-writing-style/`
- `plugins/kai-core/skills/kai-core-personal-agenda/` → `plugins/kai-assistant/skills/personal-agenda/`
- `plugins/kai-core/skills/kai-core-decision-brief/` → `plugins/kai-assistant/skills/decision-brief/`

**Retire:**
- `plugins/kai-core/agents/director-executive-assistant.agent.md`
- `plugins/kai-core/skills/kai-core-executive-consultation/`

**Modify:**
- `scripts/lib/pack-plan.mjs`
- `scripts/generate-catalog.mjs`
- `.github/plugin/marketplace.json`
- `plugins/kai-core/agents/director-chief-of-staff.agent.md`
- `plugins/kai-core/skills/kai-core-issue-analysis/SKILL.md` (only live references to the retired skill)
- `README.md`
- Live documentation/examples naming the retired director or three retired core skill IDs.

**Generate:**
- `plugins/kai-assistant/plugin.json`, `package.json`, `package-lock.json`
- Derived pack script copies affected by the source changes
- `docs/reference/agents-and-skills.md`
- `test/fixtures/inventory.json`

**Interfaces:**
- Consumes: Task 1's core Operator signals section and the existing private
  task, agenda, identity, and decision-record formats.
- Produces: directly invocable `personal-assistant` and `persona-self`, with
  local `personal-agenda`, `decision-brief`, `extract-writing-style`, and
  `write-in-user-voice`. No required sibling package.

- [ ] **Step 1: Register source ownership while moving the files.**

In `MIGRATION_BASELINE_PACKS`, remove `director-executive-assistant` from core,
remove `persona-self` from personal, and add:

```js
assistant: ['persona-self'],
```

In `NEW_AGENT_IDS`, add:

```js
assistant: ['personal-assistant'],
```

In `PACK_RUNTIME_DEPENDENCIES`, add:

```js
assistant: [],
```

No npm dependency is needed for this package. Keep personal's current runtime
dependencies: its unmoved demo methods still use them.

Remove the retiring director's entries from `ACTIVITY_EXEMPT` and
`ACTING_EXEMPT`, and their now-false role-specific comments. Keep the exported
interfaces and other exemptions. Do not change `ROLE_FAMILY_PACK`,
`agentTaxonomyErrors`, `agentRoutingErrors`, or dispatch selection to
accommodate the new name.

Move the entire source directories listed above, update skill `name:` values
to their target IDs, and preserve companion files. Do not leave source aliases.

- [ ] **Step 2: Write the assistant as a direct worker.**

Use this frontmatter and identity, then write the task sections below:

```markdown
---
name: personal-assistant
description: "Manages personal tasks, priorities, briefings, and message drafts directly. Use for help with your own work. Not team delivery, specialist dispatch, or autonomous sending."
tools: ["execute", "read", "edit", "search", "ask_user", "skill"]
---

# Personal Assistant

**Primary profile:** judgment

Invoke `kai-core-contract-v1` before the first other core skill. Without
`kai-core`, I can help with a one-off answer or draft from what you supply,
but I do not read or write `.kai` state or coordinate team work; install or
update `kai-core` before requesting those stateful capabilities.

You do the user's personal-assistance work. You are not the entry point for
other agents, and you do not dispatch specialists or impersonate their
judgment. Produce the requested task update, briefing, or draft yourself
within your responsibility.
```

Add separate task sections, with the route at the action, not collected in a
manifest:

| Section | Instructions and routes |
| --- | --- |
| Private-state work | Invoke `kai-core-workspace-paths` only before resolving stored personal data; load `kai-core-operating-rules` before authority/privacy decisions |
| Tasks and agenda | Apply `personal-agenda` for capture, updates, recurrence, waiting, snooze, and requested prioritization |
| Briefing | Apply `decision-brief` to supplied evidence or a selected team record; a missing role view stays missing |
| Drafting | Apply `write-in-user-voice`; ordinary drafts do not dispatch `persona-self` |
| Profile update | Run `extract-writing-style` only when profile extraction or refresh was requested |
| Durable private output | Apply `kai-core-asset-producing` before persistence; do not confuse completing a personal task with shipping a team asset |

Preserve: explicit scope, private-state boundaries, least-privilege reads,
append-preserved task history, no automatic external actions, and truthful
limits. Remove: role-taxonomy directory, default-starting-point claims,
consultation loops, agent dispatch tools, automatic workspace-wide scans, and
mandatory specialist handoffs.

Do not require agenda/identity/workspace setup to return a one-off text draft.
Do not route lease-granting/acting contracts for private task updates that hold
no coordinated item.

- [ ] **Step 3: Refactor the personal methods without losing their data rules.**

For `personal-agenda`, preserve the old sections **Task lifecycle**,
**Recurrence**, **Deduplication and history**, **Ranking**, and the inbox and
agenda schemas. Preserve these exact behaviors:

- `snooze_until` suppresses a task until due; waiting uses `waiting_on`.
- Recurrence advances one occurrence and links it with `next`, rather than
  duplicating history.
- `ack:no` proposals remain suggestions until accepted.
- Team items are surfaced from their authority, never copied into the inbox.
- Shared fields remain approved-and-necessary; privacy survives retiring the
  executive-consultation skill that formerly restated the rule.

Default to personal inputs. Team signals are a requested option using Task 1's
core section. No mandatory career, voice, linked-root, or team-state scan.
Only explicitly enabled sources are read.

For `decision-brief`, accept supplied records for an ordinary personal
decision without inventing a team item. If briefing a real team gate, retain
the authoritative question/item identity and pending-state semantics.
Preserve provenance, alternatives, unresolved facts, and private record paths.
Remove automatic role consultations and team-state writeback. Do not require
a deploy gate or formal `@operator` question to help with a personal choice.

Keep existing private-state filenames and record formats. Do not migrate
existing data or delete historical consultation records. Retiring the skill
does not authorize deleting user records it previously produced.

- [ ] **Step 4: Share the voice method and migrate persona-self.**

Give `write-in-user-voice` this contract:

```markdown
---
name: write-in-user-voice
description: "Applies supplied or approved stored writing preferences to a draft while preserving intent, facts, and uncertainty. Use for user-voice drafting, rewriting, or replies."
tools: [read, edit, search]
---

# Write in the User's Voice

Consume the requested audience, format, intent, factual material, and any
supplied or approved stored voice profile. Do not extract a new profile as
a side effect of drafting.

Apply explicit user preferences before inferred style. Preserve numbers,
attributions, claim strength, and uncertainty. Style changes are not
permission to invent facts, opinions, authority, or experiences.

When no profile is available, use the preferences supplied for this request
or a clearly labeled neutral draft. Do not require workspace setup just to
write text.

Produce a draft only. Do not send, publish, approve, or represent an independent
specialist's judgment. Disclose no unrelated private profile material.
```

Transfer the existing persona-self profile-application procedure into this
method: profile field interpretation, manual overrides, sample anchoring,
and audience-sensitive application. Keep domain judgment and authorship
boundaries in `persona-self`; do not paste its entire agent body into a skill.

Rewrite `persona-self` onto inline routes. It directly loads
`write-in-user-voice` for drafting; `extract-writing-style` is only an explicit
profile task, not an obligatory pre-draft hop. Keep drafting/rewriting/reply
capabilities, factual preservation, and no-publication boundaries. Remove the
eager declaration, guard region, retired core IDs, unconditional startup
profile load, and unconditional senior-engineer voice overlay.

Refactor `extract-writing-style` to serve both agents, keep the voice schema
and opt-in sample selection, and use current core path contracts. Never mine
unrelated history or imply a stored profile exists when it does not.

- [ ] **Step 5: Remove the old router and close its live references.**

Delete the old director agent and executive-consultation skill after their
replacement content exists.

In the Chief of Staff's introduction, remove the assistant-as-front-door and
assistant-dispatch-origin narrative. Keep its delivery and lease authority
unchanged. Its description can simply exclude personal agenda management
without requiring an assistant installation.

Replace the issue-analysis skill's reference to retired consultation with
its existing direct/operator/peer boundary; do not add a dependency on
`kai-assistant`. Preserve the actual inquiry/approval obligation.

Locate remaining live references using:

```powershell
git grep -n -E 'director-executive-assistant|kai-core-personal-agenda|kai-core-decision-brief|kai-core-executive-consultation' -- plugins scripts docs examples README.md AGENTS.md
```

Inspect by meaning: personal tasks point at the new local methods; core-owned
signals stay in core; specialist decisions stay with their existing owner.
Do not mechanically turn prose references into imperative loads. Preserve
dated changelogs, historical specs/plans/drop records, and past release reports
as historical evidence. Regenerate generated copies instead of editing them.

Also inspect core's references to the still-live `persona-self` and
`extract-writing-style` IDs, whose ownership changed. A description of an
optional capability is not a dependency; a mandatory load or dispatch is.
Remove assistant prerequisites from core without rewriting unrelated core
behavior.

- [ ] **Step 6: Complete the install and discovery surface.**

Update `CATEGORIES` in `scripts/generate-catalog.mjs`:

- The Direction category retains only `director-chief-of-staff`; replace
  "The two front doors" with explicitly requested coordination.
- Add a Personal assistance agent category with exactly
  `personal-assistant` and `persona-self`; remove persona-self's old membership.
- Add an Assistant methods skill category with exactly `personal-agenda`,
  `decision-brief`, `extract-writing-style`, and `write-in-user-voice`.
- Remove the three retired core skill IDs and the old extract-writing-style
  category membership. Keep `kai-core-proactive-scan` in a core signal category.

Add a `kai-assistant` marketplace entry using the existing entries' metadata
shape, current root version, and this capability description:

```json
{
  "name": "kai-assistant",
  "source": "./plugins/kai-assistant",
  "description": "Personal tasks, agendas, briefings, and user-voice drafts. Direct assistance over kai-core, not organization routing."
}
```

Retain author/homepage/repository/license fields using the existing values.
Keep the still-populated `kai-personal` entry. Do not create the other future
packages or empty aliases during this task.

Generate the existing source-derived surfaces:

```powershell
node scripts/host-contract.mjs --update
npm run docs:generate
npm run pack-preview -- --write
```

These are generation commands, not the deferred suite. If a command fails,
inspect the cause: fix a missing source registration, malformed changed
frontmatter, missing companion, or incorrect package path needed to emit the
package. Do not redesign unrelated validation policy to make it run. Report
an unresolved emission problem rather than calling a non-emitted pack complete.

- [ ] **Step 7: Record direct-use scenarios and limitations.**

Create `docs/reference/packages/kai-assistant.md` with install combination
`kai-core` + `kai-assistant`, both agent entry points, the four skill purposes,
private-state locations, and this scenario matrix:

Stateful scenarios assume a valid selected workspace. If it is absent, report
the missing persistence prerequisite and offer a nonpersistent response; do
not silently initialize a workspace or claim the task was stored.

| Request | Expected behavior | Must not happen |
| --- | --- | --- |
| "Capture: renew certification Friday" | One personal inbox task with the supplied due date resolved honestly | Agent dispatch, team lease, claimed notification scheduling |
| "What are my personal priorities?" | Rank personal tasks using relevant dates and dependencies | Unrequested scan of all linked team roots |
| "Draft a short reply from these facts" without stored profile | Return a labeled supplied-preference/neutral draft | Workspace-init requirement, invented profile, specialist delegation |
| "Write this as me" with an approved voice profile | Direct voice-method use and facts preserved | Sending, publishing, or exposing unrelated private history |
| "Brief this team decision" with an answered QUESTION | Recognize the matching ANSWER and distinguish resolved from pending | Treating stale QUESTION status as an open decision |
| "Compare these supplied options" with a missing fact | Separate evidence, assumptions, and missing information | Invented role consensus or automatic consultation |
| Core scan with assistant absent | Interpret its records through the core signal section | Loading assistant skills or requiring the old director |

Mark all scenarios not actually executed as **runtime unverified**. A source
walkthrough is useful but is not an execution.

In the same note, record the responsibility disposition: routing/default entry
retired; tasks/briefs preserved and simplified; voice method shared locally;
team-signal authority retained in core; old private history retained. Also
record the naming-validator mismatch and any still-unverified runtime tools.

Update README installation/status prose to describe the actual intermediate
surface without calling the complete eight-package rollout finished. Keep its
current version aligned with the manifests; do not claim a new published release.

- [ ] **Step 8: Inspect package coherence and commit the unit.**

Inspect the generated assistant manifest and source paths. Confirm both
agents and all four skills have one source, no source remains under the old
owner, no agent dispatch tools were added, and core no longer loads
assistant-owned skills. Read the scenario matrix against the instructions;
record discrepancies instead of asserting tests passed.

Do not run the full suite or repair taxonomy rules now. Inspect the diff and
stage only this task's source, generated outputs, and documentation:

```powershell
git diff --check
git diff --stat
git status --short
```

After staging that inspected change set:

```powershell
git commit -m "refactor(assistant): deliver direct personal assistance as its own package" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

## Handoff

The output is a committed assistant package, a core signal method with no
reverse assistant dependency, and a package note stating actual limitations.
No claim of runtime quality or release readiness is part of this completion.

Do not start creative implementation automatically from this plan. Its next
package plan must account for demo runtime ownership and the supplied-facts
boundary with marketing.

This plan does not authorize a push or merge. Before a requested checkpoint
PR, apply the root `AGENTS.md` release-metadata requirements once to that
checkpoint. Keep final safety/testing deferred as approved; never silently
remove protections or publish a tag to satisfy a release checklist.

## Plan self-review coverage

| Spec requirement | Covered by |
| --- | --- |
| Assistant out of core, no router | Task 2 steps 2 and 5 |
| Core has no assistant dependency | Task 1; Task 2 steps 5 and 8 |
| Two agents, four local skills, no duplicate sources | Task 2 steps 1–4 and 6 |
| Privacy, history, honest state, no phantom scheduling | Task 2 steps 2–4 and 7 |
| Required companion/runtime/install ownership | Task 2 steps 1 and 6 |
| Direct-use examples without claimed runtime evidence | Task 2 steps 7–8 |
| Other five capability packages | Separate package units in the rollout plan |
| Two refinement passes, final safety/testing | Rollout plan section 4; deliberately outside this first unit |

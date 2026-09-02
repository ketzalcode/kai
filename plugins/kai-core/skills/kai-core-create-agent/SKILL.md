---
name: kai-core-create-agent
description: "Designs, creates, or redesigns Kai agents with explicit identity, authority, reasoning profile, tools, skills, handoffs, and validation."
argument-hint: "[design|create|redesign] <agent need or existing agent id>"
user-invocable: true
tools: [execute, read, edit, search, ask_user, web]
---

# Create Agent

Use this skill to add or redesign a role in the Kai fleet. It turns an apparent
need for "an agent" into a tested role contract. The goal is not to maximize the
roster. The goal is to create the smallest distinct role that earns a permanent
slot and can be routed without guessing.

This skill owns the authoring method. It does not grant the new role product,
engineering, legal, publishing, deployment, or operator authority.

## Modes

Choose one mode from the request:

| Mode | Result |
|---|---|
| `design` | Produce the proposed identity and role contract without creating files. |
| `create` | Design the contract, create the canonical source, update required indexes, and validate it. |
| `redesign` | Reclassify an existing agent, identify split/merge/rename consequences, and change it only when requested. |

If no mode is stated, use `design` when authority or boundaries remain
unsettled; otherwise use `create`. A bulk migration is never the implicit
default for `redesign`.

## The identity model

Kai agent identity has three independent concerns:

1. **Kind** — durable role, workflow, persona, or instructor.
2. **Name** — provider family, operating posture, and scope.
3. **Execution profile** — the reasoning shape used to select a model and tools.

Do not collapse these concerns. A model name is not an identity. "Creative" is
not an authority boundary. Seniority is not a routing signal.

### 1. Pick the kind first

| Kind | Test | Naming |
|---|---|---|
| **Durable role** | Holds standing judgment or execution responsibility across many requests. | `<family>-<posture>-<scope>` |
| **Workflow** | Runs a bounded procedure with a defined start, end, and completion condition. | `workflow-<outcome>` |
| **Persona** | Deliberately represents a user or stakeholder viewpoint rather than owning delivery. | `persona-<viewpoint>` |
| **Instructor** | Teaches, tutors, or structures learning for the operator. | `instructor-<teaching-scope>` |
| **Skill** | Supplies reusable method or knowledge but has no independent identity, authority, or standing lane. | `<kebab-case>`; core-provided skills use `kai-core-*` |

Use a skill, not an agent, when an existing role can apply the method without
creating a new owner or routing destination. Use a workflow, not a durable role,
when the work ends at a stable completion condition. Do not create new
`principal-*`, `creative-*`, or `director-*` identities; those are legacy
families to classify during migration, not templates for new work.

### 2. Durable-role naming

The grammar is:

```text
<family>-<posture>-<scope>
```

**Family is the provider area**, matching the plugin that makes the role
available:

| Family | Provider |
|---|---|
| `core` | `kai-core` |
| `personal` | `kai-personal` |
| `prod` | `kai-product` |
| `eng` | `kai-engineering` |
| `gtm` | `kai-gtm` |

Provider family describes installation and broad accountability, not who may
collaborate with the role. A technical writer can work across product,
engineering, and GTM while remaining provided by one plugin. Do not invent
`shared-*`, `cross-functional-*`, `guild-*`, or `expert-*` families to describe
collaboration.

Choose the provider whose absence should make the role unavailable and whose
discipline owns its acceptance boundary. Cross-functional reach is not a reason
to move a role into core. Reserve `core` for roles operating Kai's shared
contract, routing spine, workspace, and fleet machinery. The short provider
tokens `prod`, `eng`, and `gtm` are deliberate namespace abbreviations; the
scope portion still uses full responsibility words.

**Posture describes authority and operating behavior:**

| Posture | Owns | Must not do |
|---|---|---|
| `lead` | Explores alternatives, makes or recommends expensive domain decisions, and owns role-level acceptance where the operator has not reserved it. | Treat implementation volume as authority; approve a human-only action. |
| `builder` | Convergent implementation inside accepted scope and decisions, including code, tests, configuration, and migrations. | Reopen settled architecture casually; approve its own independent review. |
| `reviewer` | Independent, revision-bound evaluation and a clear verdict. | Implement fixes in the same review run or review its own change as independent. |
| `operator` | Stateful operational execution, evidence capture, and runbook discipline. | Perform credentials-, production-, spend-, send-, merge-, or publish-gated human actions. |
| `coordinator` | Decomposition, routing, sequencing, reconciliation, and escalation. | Substitute its judgment for the roles it coordinates. |
| `advisor` | Analysis and recommendations in a bounded advisory lane without lifecycle authority. | Present advice as acceptance, approval, or an operator decision. |

When more than one posture appears plausible, use this first-match tie-break on
the proposed role's **primary responsibility**:

1. Independent verdict on another role's revision -> `reviewer`.
2. Action on live or stateful operational systems -> `operator`.
3. Final domain decision or role-level acceptance -> `lead`.
4. Implementation of accepted scope in repository artifacts -> `builder`.
5. Routing, sequencing, or reconciliation of other roles -> `coordinator`.
6. Analysis and recommendation without acceptance authority -> `advisor`.

Secondary behavior does not change the result. Route it to a neighbor or supply
it through a skill. If two primary responsibilities remain, test whether each
side independently earns a slot before proposing a split.

**Scope names the responsibility, not seniority.** Use full, recognizable words:
`frontend`, `backend`, `architecture`, `frontend-architecture`,
`technical-writing`, `product-strategy`, `sales`, or `engineering-career`.
Prefer `frontend` over `fe`, `backend` over `be`, and `architecture` over a
decorative title. Add depth only when it creates a real routing boundary.

Examples of the grammar, not currently shipped identities:

| Identity | Meaning |
|---|---|
| **eng-lead-architecture** | Owns cross-domain system decisions and architecture acceptance. |
| **eng-lead-frontend-architecture** | Owns expensive frontend-wide decisions, only if that lane earns a separate slot. |
| **eng-builder-frontend** | Implements accepted frontend work and makes local reversible choices. |
| **eng-builder-backend** | Implements accepted backend work and its tests. |
| **eng-reviewer-security** | Gives an independent, revision-bound security verdict. |
| **eng-lead-technical-writing** | Owns documentation coverage, information architecture, and quality acceptance. |
| **prod-lead-product-scope** | Owns product scope decisions. |
| **gtm-lead-sales** | Owns sales judgment without accepting commercial terms. |
| **personal-advisor-engineering-career** | Advises the operator without team lifecycle authority. |

Names describe authority; they do not promise a specific model. `lead` means
decision ownership, not "most intelligent agent." `builder` means constrained
execution, not lower professional quality.

### 3. Decide whether another role earns a slot

A proposed durable role must pass every slot-earning test:

| Test | Required evidence |
|---|---|
| **Recurring trigger** | A repeated class of requests, not one current task. |
| **Distinct authority or execution lane** | A sentence naming what this role owns that no existing role owns. |
| **Stable boundary** | Clear non-triggers and named neighboring owners. |
| **Dispatch value** | A caller can choose this role from its description without reading its body. |
| **Independent output or verdict** | A recognizable artifact, implementation lane, decision, or revision-bound verdict. |
| **Cost justified** | The reduced ambiguity or repeated work exceeds another permanent routing target's context and coordination cost. |

If any test fails, strengthen an existing agent, add a skill, or define a
workflow instead. Do not create an agent solely to obtain another model context
window.

A narrower lead such as **eng-lead-frontend-architecture** earns a slot only
when recurring frontend decisions are expensive to reverse, exceed a builder's
local authority, and do not belong to the cross-domain architecture lead. Depth
in the name follows a real boundary; it never creates one.

## Authority before prose

Write the authority map before drafting personality or instructions:

```markdown
## Authority

| Decision or action | This role | Neighbor / final authority |
|---|---|---|
| <lane decision> | owns | — |
| <adjacent decision> | advises | <role> owns |
| <human-gated action> | prepares evidence only | operator acts |
```

Every role must state:

- what it owns;
- what it may decide locally;
- what requires another role's acceptance;
- what only the operator can do;
- whether it may implement, review, or both;
- which self-approval combinations are forbidden.

Avoid "co-owns" unless the contract names two different decision surfaces. Two
agents cannot both be final authority for the same decision.

## Execution profile and model selection

After authority is settled, choose exactly one primary execution profile:

| Profile | Typical posture | Cognitive shape | Model need |
|---|---|---|---|
| `judgment` | `lead`, some `advisor` | Divergent exploration followed by explicit trade-offs and convergence. | Strong reasoning for ambiguity and expensive decisions. |
| `execution` | `builder` | Convergent implementation against accepted constraints; local reversible judgment only. | Strong code/tool use and instruction following; optimize cost after quality is proven. |
| `review` | `reviewer` | Independent, evidence-first, adversarial evaluation with calibrated findings. | Strong reasoning and precision; must remain independent of implementation. |
| `operations` | `operator` | Stateful procedure, checkpoints, failure handling, and evidence capture. | Reliable instruction following and tool use. |
| `coordination` | `coordinator` | Decomposition, routing, dependency management, and synthesis without domain substitution. | Strong context handling; depth proportional to ambiguity. |
| `advisory` | `advisor` | Bounded analysis and recommendation without acceptance authority. | Proportional to decision cost and uncertainty. |
| `procedure` | workflow | Deterministic start-to-completion process. | Prefer reliable, efficient execution unless judgment gates demand more. |
| `teaching` | instructor | Adaptive explanation and checks for understanding. | Proportional to subject complexity. |
| `simulation` | persona | Faithful viewpoint representation with explicit limits. | Proportional to fidelity required. |

Record the profile in the body:

```markdown
## Execution profile

**Primary profile:** <profile>
**Why:** <one sentence tied to the role's authority and work>
**Model policy:** <pinned model and evidence, or inherited/default and why>
```

Kai's portable custom-agent contract permits `model` only as one quoted scalar
string, for example `model: "Claude Sonnet 5"`. Use it only after checking
current target-host documentation or measured host behavior. Never use a model
array, YAML boolean, number, null, tag, alias, or mapping in a Kai CLI agent.
Pin a model when reproducible routing, quality, or cost requires it; otherwise
omit the field and state that the host default is intentional. Never guess a
model identifier, encode a model vendor in the agent name, or treat one current
model as permanent taxonomy.

For an execution role, start with the least expensive coding-capable model that
meets the role's acceptance cases. For judgment and independent review, prefer
reasoning quality over token price. Model choice follows measured behavior; it
does not follow prestige words in the name.

## Tool and skill selection

Grant the minimum capabilities required by the contract:

1. Start with `read` and `search`.
2. Add `edit` only if the role produces repository files.
3. Add `execute` only if it must run commands or validations.
4. Add `ask_user` only when the role owns decisions that genuinely require
   operator input.
5. Add `web` or `web_search` only when current external evidence is part of the
   role's normal work.
6. Add peer tools only when direct peer communication is part of its contract.
7. Add `skill` when it must load inherited or situational skills.

Search existing skills before writing instructions. Inherit a skill when the
role must apply it every run. Declare it as a situational dispatch when only
some requests need it. Create a new skill when several roles need the same
method or when document/task-type guidance would otherwise bloat an agent.

Do not copy a shared contract into the agent body. Do not grant a tool because
a neighboring agent has it.

## Canonical agent anatomy

Draft agents in this order:

1. **Frontmatter** — exact `name`, routing-focused `description`, optional
   scalar `model`, and least-privilege `tools`.
2. **Inherited contracts** — exactly one `**Inherits:**` line first in the
   body, followed by the canonical directive.
3. **Identity and mission** — one paragraph stating why this role exists.
4. **Authority** — owned, advised, forbidden, and operator-reserved decisions.
5. **Execution profile** — profile, reason, and model policy.
6. **When it fires / does not fire** — concrete routing boundaries.
7. **Inputs and evidence** — what must be read or confirmed before acting.
8. **Operating loop** — the shortest complete sequence for its work.
9. **Output and completion** — exact artifact, decision, implementation, or
   verdict; define what "done" means.
10. **Handoffs** — upstream/downstream roles and the packet each receives.
11. **Hard rules** — only load-bearing prohibitions not already inherited.
12. **Return shape** — concise result a caller can route.
13. **Anti-patterns** — characteristic ways this role could exceed or neglect
    its lane.

The description is routing metadata loaded into every session. Keep it to what
the role does, when it fires, and its nearest disambiguation. Capability
inventories belong in the body.

## Kai repository placement

When editing the Kai repository:

1. Read its root `AGENTS.md` and current release rules.
2. Create the authoritative source only under
   `plugins/<provider>/agents/<agent-id>.agent.md`.
3. Use `scripts/lib/inherits-block.txt` verbatim. Do not paraphrase it.
4. Core agents carry no dependency-guard block. Department-agent guard regions
   are generated; never hand-author or edit inside them.
5. Every agent inherits `kai-core-team-operating-rules` and
   `kai-core-asset-lifecycle`. Every new durable role or workflow also inherits
   `kai-core-workspace-conventions` and `kai-core-work-activity` unless it is
   added to the validator's explicit activity-exemption map with a durable
   reason. Confirm every additional inherited skill exists in core or the same
   provider.
6. Add a new identity to the provider's array in `NEW_AGENT_IDS` in the
   authoritative root `scripts/lib/pack-plan.mjs`. Never edit its generated
   copy under `plugins/kai-core/scripts/`.
7. Add the agent to exactly one `CATEGORIES` entry in the authoritative root
   catalog generator.
8. Update every real reference atomically when renaming an identity, including
   `DISPATCHING_ROLES`, `SKILL_OWNER_OVERRIDES`, `ASSESSOR_ROLES`,
   `ACTIVITY_EXEMPT`, `hooks.json`, examples, docs, and agent/skill prose where
   applicable.
9. Run `npm run host-contract:update`, `npm run docs:generate`, and
   `npm run pack-preview -- --write`, then run the repository validation.
10. Apply the version, changelog, README status, marketplace, and generated
    release surfaces required by `AGENTS.md`.

In another repository, first discover that repository's canonical custom-agent
directory and instructions. Never impose Kai's plugin paths on a consumer
project.

## Creation workflow

### 1. Inventory before naming

Read the current roster, relevant neighboring agents, available skills,
provider boundaries, and reference checks. State the uncovered responsibility
without naming a new agent yet.

### 2. Classify

Choose kind. For a durable role choose provider family, posture, and scope.
Choose one execution profile. Run the slot-earning tests.

### 3. Design the contract

Produce:

```markdown
# Agent contract — <proposed id>

**Mode:** design | create | redesign
**Kind:** durable-role | workflow | persona | instructor
**Provider:** <plugin>
**Identity:** <id>
**Posture:** <posture or n/a>
**Scope:** <scope>
**Execution profile:** <profile>
**Model policy:** <policy>

## Need and slot evidence
## Authority
## Fires / does not fire
## Inputs and evidence
## Output and completion
## Neighbor handoffs
## Tools
## Inherited and situational skills
## Acceptance cases
## Rename, split, or compatibility impact
```

In `design` mode, stop after the proposal unless the operator explicitly asks
for implementation. In `create` mode, continue when the request already settles
the material authority boundaries.

### 4. Write acceptance cases first

Define at least:

- one request that must route to the agent;
- one near-neighbor request that must not;
- one authority-boundary case it must hand off;
- one forbidden self-approval or operator-only action;
- one representative output/completion case;
- one model/tool sufficiency case when a model is pinned.

Acceptance cases are behavioral, not snapshots of exact prose.

### 5. Create or redesign surgically

Write the canonical source using the anatomy above. Reuse existing contracts.
Do not combine a rename, mandate change, split, and prose rewrite unless the
accepted design requires all four.

### 6. Validate

At minimum prove:

- file stem, frontmatter `name`, and references agree;
- the new naming grammar and provider family agree;
- description is inside the discovery-metadata budget;
- tools use host-valid forms and optional `model` is one quoted scalar string;
- inherited and dispatched skills resolve from the installed provider set;
- exactly one catalog category owns the entry;
- generated files are current;
- acceptance cases demonstrate routing and authority boundaries;
- the repository's existing test suite passes.

## Redesign and migration rules

Legacy identity does not determine the new posture:

- `principal-*` does not automatically become `*-lead-*`; many current agents
  combine lead, builder, and reviewer behavior.
- `creative-*` is classified by real authority and output, not renamed
  mechanically.
- `director-*` is usually a coordinator candidate, but its actual authority
  must be audited.
- `workflow-*`, `persona-*`, and `instructor-*` remain their own kinds unless
  their behavior contradicts the definition.

For each existing agent:

1. Inventory every owned decision, implementation action, review verdict, and
   handoff.
2. Choose the dominant posture.
3. Split only when both resulting roles independently pass the slot-earning
   test and have dispatchable boundaries.
4. Preserve local reversible judgment for builders; do not require a lead
   sign-off for routine implementation.
5. Keep expensive, cross-boundary, or hard-to-reverse decisions with a lead.
6. Keep independent acceptance outside the builder that produced the change.
7. Update all identity references in one atomic rename.
8. Migrate one or two representative roles before a fleet-wide rename.

Do not mass-replace prefixes. A mechanically renamed roster would preserve the
ambiguity this taxonomy exists to remove.

## Hard rules

1. **No permanent slot without recurring need and a distinct lane.**
2. **No new seniority families.** Never create `principal-*`, `senior-*`,
   `staff-*`, or `expert-*` as Kai taxonomy.
3. **Authority is explicit.** A role name or polished persona never implies
   sign-off.
4. **Builders retain local judgment.** Accepted architecture is a constraint,
   not a script for every line.
5. **No self-approval.** Independent review must be performed by a different
   role/run from implementation.
6. **Human gates remain human.** Agents may prepare evidence but never merge,
   deploy, publish, spend, send, accept legal/commercial risk, or claim
   `shipped`.
7. **Model follows work.** Select it from execution profile and measured
   acceptance, never from title prestige.
8. **Skills before duplication.** Reusable method belongs in a skill, not
   repeated agent prose.
9. **One canonical source.** Never edit generated agent copies.
10. **No blind migration.** Classify behavior before renaming or splitting.

## Return shape

```text
Agent: <proposed or created id>
Mode: <design | create | redesign>
Kind: <kind>
Provider: <plugin>
Posture/profile: <posture or n/a> / <execution profile>
Authority: <one-line owned lane>
Slot evidence: <pass | fail + reason>
Source: <canonical path or none>
Model policy: <pinned model or inherited/default>
Validation: <commands and result, or not run>
Migration impact: <references/splits/aliases or none>
Decision needed: <one operator decision or none>
```

## Anti-patterns

- Starting from a clever name and inventing authority afterward.
- Treating "lead" as seniority, creativity, or permission to override adjacent
  roles.
- Making builders ask for approval on every local reversible choice.
- Combining implementation and independent review to save an agent call.
- Creating a cross-functional family instead of defining collaboration and
  handoffs.
- Pinning the newest or most expensive model without an acceptance case.
- Copying another agent and retaining irrelevant tools, skills, outputs, or
  authority.
- Creating a role for one document type when a reusable document-type skill is
  the actual missing capability.

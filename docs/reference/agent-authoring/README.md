[kai](../../../README.md) / [Docs](../../README.md) / [Reference](../plugin-structure.md) / Agent authoring

# Creating or refining a kai agent

This procedure is for people changing **kai itself**. It is contributor
documentation, not a shipped capability: it only means anything inside this
repository, so it lives in `docs/` rather than in a package every consumer
downloads. It used to ship as the `kai-core` skill `kai-core-create-agent`,
which no agent routed and which taught a consumer to edit a repository they do
not have.

Create the smallest focused agent that can be routed reliably. Start from the
responsibility that is missing, not from a title. Decide first whether the need
is a new agent or a change to one existing agent.

This page handles one agent at a time. Fleet migration is a separate procedure.

| Page | Contents |
| ---- | -------- |
| [Taxonomy](taxonomy.md) | Kinds, provider families, postures, scope, execution profiles, slot-earning tests. Pinned to the validator constants. |
| [Agent contract and template](agent-template.md) | The contract to complete before prose, the file skeleton, acceptance cases, and the focus budget. |
| [Approved models](model-selection.md) | The approved model identifiers and the deterministic profile mapping. Pinned to the validator constants. |

## Creation sequence

### 1. Establish the missing responsibility

Read the current agent roster through frontmatter `name` and `description`
metadata first. That metadata is the routing surface, so it should identify the
nearest role without loading every agent body. Read only the one to three
closest agent bodies when their descriptions overlap. State:

- the recurring request this role will handle;
- the decision, implementation, review, operation, coordination, or advice it
  owns;
- the existing agent closest to it;
- the concrete output or verdict that completes its work.

For an existing agent, inventory its current responsibilities before changing
its identity or instructions.

### 2. Classify from the supported taxonomy

Read [the taxonomy](taxonomy.md) now.

Use the taxonomy tables to choose:

- kind;
- provider family;
- posture and scope for a durable role;
- the primary execution profile required by the posture or kind.

Apply the posture tie-break in order. Use the provider whose absence should
make the role unavailable. Cross-functional collaboration does not make a role
part of core.

### 3. Require the role to earn its slot

A durable role qualifies only when all six taxonomy tests have evidence:
recurring trigger, distinct lane, stable boundary, dispatch value, independent
output, and justified coordination cost.

If it does not qualify, strengthen an existing agent or recommend a bounded
workflow. When the missing capability is reusable method rather than an
independent role, write a skill instead.

### 4. Define the contract before the prose

Read [the agent contract and template](agent-template.md) now.

Complete the agent contract from the template:

1. Authority and final acceptance owner.
2. Routing examples for this role and its nearest neighbors.
3. Inputs and evidence required before acting.
4. Output and completion condition.
5. Handoffs.
6. Execution profile and model policy.
7. Platform tools and situational skills, each with an activation trigger.
8. Behavioral acceptance cases.

Every shipped agent and skill frontmatter declares
`durable-output-producer: true` or `false`. Set it to `true` only when that
source has an authorized branch that can retain a typed Kai artifact. A
declared producer routes its owning pack publication skill immediately before
`kai-core-asset-producing`; a declared non-producer routes neither.

Direct work returns only inline or repository-native output. A durable Kai
report or publication requires an existing typed hierarchy subject, its current
version, an authorized artifact target, current acting authority, and named
acceptance authority. Never create a subject merely to save a direct answer.

Default to progressive loading. An agent body carries only instructions
needed on every invocation and names each skill inside the instruction that
needs it, at the exact workflow step; it never preloads a skill list or collects
routes into a manifest section.

Use positive routing language: "route this request to X" is clearer than a long
list of prohibited requests. Keep explicit boundaries only where self-approval,
operator-only actions, or overlapping authority would otherwise be ambiguous.

### 5. Keep the agent focused

Use this authoring budget for a new or materially refined agent:

| Measure | Target | Refocus threshold |
|---|---:|---:|
| Authored agent body | at most 250 lines | over 250 lines |
| Agent prompt | at most 20,000 characters | over 20,000 characters |
| Host hard limit | — | 30,000 characters |

For a legacy agent, exclude the generated dependency-guard region from the
authored line target.

At the refocus threshold, extract reusable method into a skill, remove repeated
shared rules, or split the role only if both halves independently earn a slot.
Record a short justification when a focused agent still needs to exceed the
target.

### 6. Apply the approved model policy

Read [the model selection reference](model-selection.md) now. Select the model
mapped to the execution profile. Use only an approved identifier; a different
model requires updating that reference, the validator set, and their tests
through review.

### 7. Draft, generate, and validate

Work through [the repository checklist](#repository-checklist) below.

Create or update only the canonical source. Apply the template in order, reuse
existing skills, and keep shared operating rules out of the role body.

Prove:

- file name and frontmatter identity agree;
- taxonomy and provider placement agree;
- authority and neighboring routes are unambiguous;
- tools and skills in the template support the stated actions;
- prompt length is inside the host limit and reviewed against the kai target;
- acceptance cases exercise routing, authority, output, and model/tool
  sufficiency;
- repository generation and validation pass.

## Repository checklist

Root [`AGENTS.md`](../../../AGENTS.md) is the contribution contract for this
repository: it owns how an agent routes shared contracts, and it owns the
release policy. This section covers only what is specific to adding or
reshaping one agent, and deliberately does not restate those two.

### Before editing

1. Read root `AGENTS.md`.
2. Read the target agent when refining one.
3. Read neighboring agents and the skills they route at the relevant steps.
4. Read the current roster and taxonomy validators.

### Canonical source

1. Edit only `plugins/<provider>/agents/<agent-id>.agent.md`.
2. Name each skill in the instruction that needs it. Follow the routing rules
   in root `AGENTS.md`: no eager declaration line, no skill manifest section,
   and no core dependency-guard region.
3. Add a new identity to the provider array in `NEW_AGENT_IDS` in root
   `tools/lib/pack-plan.mjs`.
4. Add a new agent to exactly one `CATEGORIES` entry in root
   `tools/generate-catalog.mjs`.

Product source lives under `src/<pack>/`; developer tooling lives under
`tools/` and never ships. Generated copies under `plugins/` are outputs, not
sources.

### Which contract goes with which action

Root `AGENTS.md` states the routing rule. This is the trigger list an agent
body is written against — add a contract only when the agent has an action that
fires it, and only from core or the agent's own package:

| Route it before | Contract |
| --- | --- |
| the first other core skill in a session | the core contract probe |
| coordinated kai work | the operating rules |
| interpreting Epic, Feature, Requirement, or Task relationships | work hierarchy |
| promoting, holding, reprioritizing, or closing parent scope | work stewardship |
| creating, promoting, executing, reviewing, or restoring a Task | work task |
| acting on an existing typed subject | work acting |
| granting or reconciling a Task lease | work granting |
| validating a durable type, subtype, and private/public path | the source pack's workspace publication contract |
| creating or changing authorized durable output | asset producing, immediately after the owning publication contract |
| accepting, promoting, or closing durable output | asset closing |
| resolving a root or placing a file | workspace paths |
| recording a bounded run | work activity |

The [agents & skills catalog](../agents-and-skills.md) carries the exact ids.

### One-agent identity change

When one existing agent changes identity, update every applicable reference in
the same change:

- `NEW_AGENT_IDS` or the migration baseline;
- `DISPATCHING_ROLES`;
- `SKILL_OWNER_OVERRIDES`;
- `ASSESSOR_ROLES`;
- `ACTIVITY_EXEMPT`;
- `hooks.json`;
- agent and skill bodies;
- docs and examples;
- generated catalog and inventory.

Apply the creation taxonomy to that one agent. Planning or executing a
fleet-wide rename belongs to a separate migration procedure.

### Generate and validate

Run in order:

```text
npm run host-contract:update
npm run docs:generate
npm run pack-preview -- --write
npm test
```

Confirm the source and generated pack copy agree, and inspect the final diff.
Root `AGENTS.md` carries the release surfaces a shipped behavior change must
also update.

## Result

Record, in the PR or the authorized Task:

```text
Agent: <created or refined id>
Kind: <kind>
Provider: <plugin>
Posture/profile: <posture or n/a> / <execution profile>
Authority: <owned lane and final acceptance owner>
Slot evidence: <pass | existing role/skill/workflow preferred>
Source: <canonical path or none>
Length: <authored lines / characters>
Model policy: <pinned approved model>
Validation: <commands and result>
Decision needed: <one unresolved authority decision or none>
```

---

**Next:** [Taxonomy](taxonomy.md) · [Agent contract and template](agent-template.md) ·
[Plugin structure](../plugin-structure.md)

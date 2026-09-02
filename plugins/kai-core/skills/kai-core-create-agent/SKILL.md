---
name: kai-core-create-agent
description: "Creates or refines one Kai agent from a tested identity, authority boundary, execution profile, routing contract, and focused instruction set."
argument-hint: "<agent need or existing agent id>"
user-invocable: true
---

# Create Agent

Create the smallest focused agent that can be routed reliably. Start from the
responsibility that is missing, not from a title. Infer whether the request is
for a new agent or one existing agent from the repository and the user's intent.

This skill handles one agent at a time. Fleet migration is a separate procedure.

## Load the relevant references

- Always read [the taxonomy](references/taxonomy.md) before choosing an identity.
- Read [the agent contract and template](references/agent-template.md) before
  drafting the file.
- When changing Kai itself, also follow
  [the Kai repository checklist](references/kai-repository.md).

These files are one level deep so the main skill stays focused. The Agent Skills
specification recommends keeping `SKILL.md` under 500 lines and moving detailed
reference material into files loaded on demand.

## Creation sequence

### 1. Establish the missing responsibility

Read the current roster, neighboring agents, available skills, provider
boundaries, and relevant validator rules. State:

- the recurring request this role will handle;
- the decision, implementation, review, operation, coordination, or advice it
  owns;
- the existing role or reusable skill closest to it;
- the concrete output or verdict that completes its work.

For an existing agent, inventory its current responsibilities before changing
its identity or instructions.

### 2. Classify from the supported taxonomy

Use the taxonomy tables to choose:

- kind;
- provider family;
- posture and scope for a durable role;
- one primary execution profile.

Apply the posture tie-break in order. Use the provider whose absence should
make the role unavailable. Cross-functional collaboration does not make a role
part of core.

### 3. Require the role to earn its slot

A durable role qualifies only when all six taxonomy tests have evidence:
recurring trigger, distinct lane, stable boundary, dispatch value, independent
output, and justified coordination cost.

If it does not qualify, strengthen an existing agent or create a reusable skill
or bounded workflow instead.

### 4. Define the contract before the prose

Complete the agent contract from the template:

1. Authority and final acceptance owner.
2. Routing examples for this role and its nearest neighbors.
3. Inputs and evidence required before acting.
4. Output and completion condition.
5. Handoffs.
6. Execution profile and model policy.
7. Tools and inherited or situational skills.
8. Behavioral acceptance cases.

Use positive routing language: "route this request to X" is clearer than a long
list of prohibited requests. Keep explicit boundaries only where self-approval,
operator-only actions, or overlapping authority would otherwise be ambiguous.

### 5. Keep the agent focused

GitHub custom-agent prompts have a 30,000-character host limit but no published
recommended line count. Kai uses this authoring budget for a new or materially
refined agent:

| Measure | Target | Refocus threshold |
|---|---:|---:|
| Authored agent body | at most 250 lines | over 250 lines |
| Agent prompt | at most 20,000 characters | over 20,000 characters |
| Host hard limit | — | 30,000 characters |

Exclude generated dependency-guard blocks from the line target. At the refocus
threshold, extract reusable method into a skill, remove repeated inherited
rules, or split the role only if both halves independently earn a slot. Record a
short justification when a focused agent still needs to exceed the target.

### 6. Select tools and model from the work

The `tools` field belongs to
[GitHub custom-agent configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration),
not to the Agent Skills schema. In Kai agents, declare the explicit tool set
required by the role and include `skill` so inherited contracts can load.
Official aliases include `execute`, `read`, `edit`, `search`, `agent`, `web`,
and `todo`; configured MCP tools use their namespaced identifiers.

Choose tools from required actions rather than copying a neighbor's list.

Choose a model from the execution profile and acceptance evidence:

- judgment and independent review prioritize reasoning quality;
- builders prioritize code/tool reliability, then cost;
- operators prioritize reliable instruction following and failure handling;
- coordinators prioritize context handling without replacing domain judgment.

Model identity never appears in the agent name. If `model` is pinned, Kai
requires one quoted scalar string supported by the target host. Otherwise omit
it and let the host inherit its configured default.

### 7. Draft and validate

Create or update only the canonical source. Apply the template in order, reuse
existing skills, and keep shared operating rules out of the role body.

Prove:

- file name and frontmatter identity agree;
- taxonomy and provider placement agree;
- authority and neighboring routes are unambiguous;
- tools and skills support the stated actions;
- prompt length is inside the host limit and reviewed against the Kai target;
- acceptance cases exercise routing, authority, output, and model/tool
  sufficiency;
- repository generation and validation pass.

## Result

Return:

```text
Agent: <created or refined id>
Kind: <kind>
Provider: <plugin>
Posture/profile: <posture or n/a> / <execution profile>
Authority: <owned lane and final acceptance owner>
Slot evidence: <pass | existing role/skill/workflow preferred>
Source: <canonical path or none>
Length: <authored lines / characters>
Model policy: <pinned model or inherited default>
Validation: <commands and result>
Decision needed: <one unresolved authority decision or none>
```

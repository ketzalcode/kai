---
name: kai-core-create-agent
description: "Creates or refines one Kai agent from a tested identity, authority boundary, execution profile, routing contract, and focused instruction set."
user-invocable: true
---

# Create Agent

Create the smallest focused agent that can be routed reliably. Start from the
responsibility that is missing, not from a title. Infer whether the request is
for a new agent or one existing agent from the repository and the user's intent.

This skill handles one agent at a time. Fleet migration is a separate procedure.

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

Load [the taxonomy](references/taxonomy.md) now.

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
independent role, route it to a separate skill-authoring procedure.

### 4. Define the contract before the prose

Load [the agent contract and template](references/agent-template.md) now.

Complete the agent contract from the template:

1. Authority and final acceptance owner.
2. Routing examples for this role and its nearest neighbors.
3. Inputs and evidence required before acting.
4. Output and completion condition.
5. Handoffs.
6. Execution profile and model policy.
7. Platform tools and situational skills, each with an activation trigger.
8. Behavioral acceptance cases.

Default to progressive loading. A `kai-agent-v1` body carries only instructions
needed on every invocation and routes each skill at the exact workflow step that
needs it; it never preloads a skill list.

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

Load [the model selection reference](references/model-selection.md) now. Select
the model mapped to the execution profile. Use only an approved identifier; a
different model requires updating that reference, the validator set, and their
tests through review.

### 7. Draft and validate

When changing Kai itself, load
[the Kai repository checklist](references/kai-repository.md) now.

Create or update only the canonical source. Apply the template in order, reuse
existing skills, and keep shared operating rules out of the role body.

Prove:

- file name and frontmatter identity agree;
- taxonomy and provider placement agree;
- authority and neighboring routes are unambiguous;
- tools and skills in the template support the stated actions;
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
Model policy: <pinned approved model>
Validation: <commands and result>
Decision needed: <one unresolved authority decision or none>
```

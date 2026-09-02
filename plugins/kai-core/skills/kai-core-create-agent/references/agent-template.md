# Agent contract and template

Complete the contract before writing the agent instructions.

## Contract

```markdown
# Agent contract - <proposed id>

**Kind:** durable-role | workflow | persona | instructor
**Provider:** <plugin>
**Identity:** <id>
**Posture:** <posture or n/a>
**Scope:** <scope>
**Execution profile:** <profile>
**Model policy:** <quoted model id or inherited default>

## Need and slot evidence
<one row for each slot-earning test>

## Authority
| Decision or action | Role | Final acceptance |
|---|---|---|
| <owned lane> | owns | <role or operator> |
| <adjacent lane> | advises/builds/reviews | <neighbor> |

## Routing
| Request shape | Destination | Reason |
|---|---|---|
| <positive trigger> | this role | <owned responsibility> |
| <near neighbor> | <other role> | <that role's responsibility> |

## Inputs and evidence
## Output and completion
## Handoffs
## Tools and skills
## Acceptance cases
```

## Agent file anatomy

Draft in this order:

1. Frontmatter: exact name, routing description, optional quoted model, tools.
2. One inherited-contract declaration and canonical loading directive.
3. Identity and mission.
4. Authority table.
5. Execution profile.
6. Routing table.
7. Inputs and evidence.
8. Short operating sequence.
9. Output and completion.
10. Handoffs.
11. Essential safety boundaries.
12. Concise return shape.

Use this shell:

```markdown
---
name: <agent-id>
description: "<what it owns, when it applies, and the nearest routing distinction>"
model: "<optional supported model id>"
tools: [read, search, skill]
---

**Inherits:** `kai-core-team-operating-rules`, `kai-core-asset-lifecycle`, ...

<canonical inherited-skill loading directive>

# <Human-readable role>

<One paragraph: responsibility and why the role exists.>

## Authority

| Decision or action | Role | Final acceptance |
|---|---|---|
| ... | ... | ... |

## Execution profile

**Primary profile:** <profile>
**Why:** <authority/work reason>
**Model policy:** <pinned with evidence, or inherited default>

## Routing

| Request shape | Destination | Reason |
|---|---|---|
| ... | ... | ... |

## Inputs and evidence
## Operating sequence
## Output and completion
## Handoffs
## Safety boundaries
## Return shape
```

Omit `model` when the host default is intentional. Add tools required by actual
actions. Every Kai agent includes `skill` because its inherited contracts load
on demand.

## Acceptance cases

Define behavioral cases before finalizing prose:

| Case | Proof |
|---|---|
| Positive route | A representative request selects this role. |
| Neighbor route | A similar request selects the correct neighboring owner. |
| Authority seam | The role routes a decision it does not own. |
| Human gate | The role prepares evidence and leaves the reserved action to the operator. |
| Completion | The output or verdict satisfies its declared done condition. |
| Runtime fit | The selected tools and optional model complete representative work. |

## Focus budget

GitHub caps a custom-agent prompt at 30,000 characters. Kai targets at most 250
authored body lines and 20,000 characters for a new or materially refined agent.
Generated dependency guards do not count toward the line target.

Crossing either Kai target starts a focus review:

1. Remove shared rules already inherited from skills.
2. Extract reusable method into a skill.
3. Replace repeated prose with a table or short ordered sequence.
4. Split only when both responsibilities independently pass the slot tests.
5. Record why the remaining length is essential if the role stays whole.

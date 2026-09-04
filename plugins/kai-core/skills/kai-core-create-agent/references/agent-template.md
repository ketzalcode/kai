# Agent contract and template

Complete the contract before writing the agent instructions.

## Contract

```markdown
# Agent contract - <proposed id>

**Kind:** durable-role | workflow | persona | instructor
**Provider:** <plugin>
**Identity:** <id>
**Identity contract:** `kai-agent-v1`
**Posture:** <posture or n/a>
**Scope:** <scope>
**Execution profile:** <profile>
**Model policy:** <quoted approved model id>

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

1. Frontmatter: exact name, routing description, quoted approved model, tools.
2. Identity and mission.
3. On-demand skill routing.
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
model: "<approved model id>"
tools: [read, search, skill]
---

# <Human-readable role>

<One paragraph: responsibility and why the role exists.>

**Identity contract:** `kai-agent-v1`

## Skills on demand

Do not preload skills. Load only the skill whose trigger matches the current
workflow step.

- **`kai-core-contract-v1`** — before the first other core skill.
- **`<skill-id>`** — before <specific action that needs this contract>.

If core is unavailable or incompatible, continue only with direct, single-shot
domain work; do not create `.kai` state or claim coordinated work. State the
limitation once and tell the operator to install or update `kai-core`.

## Authority

| Decision or action | Role | Final acceptance |
|---|---|---|
| ... | ... | ... |

## Execution profile

**Primary profile:** <profile>
**Why:** <authority/work reason>
**Model policy:** <approved model mapped from the primary profile>

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

Use the model mapped by `model-selection.md`. Add tools required by actual
actions. Every Kai agent that dispatches skills includes `skill`.

`tools` is a GitHub custom-agent profile field, not an Agent Skills standard.
Its aliases and fallback behavior are host-specific. Kai declares it for
least-privilege execution on supported GitHub hosts; do not present the list as
portable or industry-standard metadata. Agent Skills separately defines an
experimental `allowed-tools` field for skills. See
[the research basis](research-basis.md) before introducing a new host field or
loading convention. Kai's existing `tools` field on `SKILL.md` files is also a
host extension, not Agent Skills metadata.

## Acceptance cases

Define behavioral cases before finalizing prose:

| Case | Proof |
|---|---|
| Positive route | A representative request selects this role. |
| Neighbor route | A similar request selects the correct neighboring owner. |
| Authority seam | The role routes a decision it does not own. |
| Human gate | The role prepares evidence and leaves the reserved action to the operator. |
| Completion | The output or verdict satisfies its declared done condition. |
| Runtime fit | The selected tools and profile-mapped model complete representative work. |

## Focus budget

GitHub caps a custom-agent prompt at 30,000 characters. Kai targets at most 250
authored body lines and 20,000 characters for a new or materially refined agent.
Crossing either Kai target starts a focus review:

1. Remove shared rules already supplied by situational skills.
2. Extract reusable method into a skill.
3. Replace repeated prose with a table or short ordered sequence.
4. Split only when both responsibilities independently pass the slot tests.
5. Record why the remaining length is essential if the role stays whole.

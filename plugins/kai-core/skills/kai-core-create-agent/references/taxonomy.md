# Kai agent taxonomy

These tables are the supported data set for agent classification. The matching
validator constants live in `scripts/lib/pack-plan.mjs`. Adding a value requires
updating this reference, the validator data, its mutation tests, and the
universal role taxonomy in `kai-core-team-operating-rules`.

## Kinds

| Kind | Qualification | Identity form |
|---|---|---|
| Durable role | Holds standing judgment or execution responsibility across requests. | `<family>-<posture>-<scope>` |
| Workflow | Runs a bounded procedure with a defined start, end, and completion condition. | `workflow-<outcome>` |
| Persona | Represents a user or stakeholder viewpoint rather than owning delivery. | `persona-<viewpoint>` |
| Instructor | Teaches or structures learning for the operator. | `instructor-<teaching-scope>` |
| Skill | Supplies reusable method without an independent identity or authority lane. | `<kebab-case>`; core skills use `kai-core-*` |

## Provider families

| Family | Provider | Responsibility |
|---|---|---|
| `core` | `kai-core` | Kai's shared contract, routing spine, workspace, and fleet machinery. |
| `personal` | `kai-personal` | Private operator, learning, and personal-assistance roles. |
| `prod` | `kai-product` | Product, product design, analytics, and product discovery. |
| `eng` | `kai-engineering` | Software delivery, architecture, trust, reliability, and technical documentation. |
| `gtm` | `kai-gtm` | Marketing, growth, sales, revenue, partnerships, and customer operations. |

Choose the provider whose absence should make the role unavailable and whose
discipline owns its acceptance boundary. The short `prod`, `eng`, and `gtm`
tokens are reserved namespace abbreviations. Scope uses full words.

## Durable-role postures

| Posture | Primary responsibility | Authority boundary |
|---|---|---|
| `lead` | Explores alternatives and owns expensive domain decisions or role-level acceptance. | Operator-reserved actions remain with the operator. |
| `builder` | Implements accepted scope and decisions, including code, tests, configuration, and migrations. | Retains local reversible judgment; independent acceptance stays with a reviewer or lead. |
| `reviewer` | Produces an independent, revision-bound verdict. | Implementation and independent review use separate roles or runs. |
| `operator` | Executes stateful operational procedures and captures evidence. | Human-gated production, credentials, spend, send, merge, and publish actions remain human. |
| `coordinator` | Decomposes, routes, sequences, reconciles, and escalates. | Domain decisions stay with their owning roles. |
| `advisor` | Analyzes and recommends without lifecycle or acceptance authority. | Final acceptance stays with the named owner. |

Apply this first-match tie-break to the primary responsibility:

1. Independent verdict on another role's revision: `reviewer`.
2. Action on live or stateful operational systems: `operator`.
3. Final domain decision or role-level acceptance: `lead`.
4. Implementation of accepted scope in repository artifacts: `builder`.
5. Routing or reconciliation of other roles: `coordinator`.
6. Recommendation without acceptance authority: `advisor`.

Secondary behavior comes from a neighboring role or reusable skill. If two
responsibilities remain primary, each proposed role must independently earn a
slot.

## Scope

Scope names the responsibility, not seniority. Use recognizable full words such
as `frontend`, `backend`, `architecture`, `frontend-architecture`,
`technical-writing`, `product-strategy`, `sales`, or `engineering-career`.

Depth follows a real routing boundary. A narrower frontend architecture lead,
for example, is justified only when recurring frontend-wide decisions are
expensive to reverse, exceed a builder's local authority, and do not belong to
the cross-domain architecture lead.

Examples of the grammar, not currently shipped identities:

| Identity | Meaning |
|---|---|
| **eng-lead-architecture** | Owns cross-domain system decisions. |
| **eng-lead-frontend-architecture** | Owns expensive frontend-wide decisions. |
| **eng-builder-frontend** | Implements accepted frontend work. |
| **eng-reviewer-security** | Gives an independent security verdict. |
| **eng-lead-technical-writing** | Owns documentation structure and quality acceptance. |
| **prod-lead-product-scope** | Owns product scope decisions. |
| **gtm-lead-sales** | Owns sales judgment without accepting commercial terms. |

## Execution profiles

| Profile | Typical posture | Model requirement |
|---|---|---|
| `judgment` | lead, some advisors | Strong reasoning across alternatives and trade-offs. |
| `execution` | builder | Reliable code/tool execution against accepted constraints. |
| `review` | reviewer | Independent evidence-first analysis and calibrated findings. |
| `operations` | operator | Reliable stateful procedure and failure handling. |
| `coordination` | coordinator | Strong context, dependency, and synthesis handling. |
| `advisory` | advisor | Reasoning proportional to decision cost and uncertainty. |
| `procedure` | workflow | Efficient instruction following with explicit judgment gates. |
| `teaching` | instructor | Adaptation proportional to subject complexity. |
| `simulation` | persona | Fidelity proportional to the represented viewpoint. |

## Slot-earning evidence

| Test | Evidence |
|---|---|
| Recurring trigger | A repeated class of requests rather than one current task. |
| Distinct lane | One sentence naming authority or execution no existing role owns. |
| Stable boundary | Named neighboring owners and clear routing seams. |
| Dispatch value | The description is sufficient to select the role. |
| Independent output | A recognizable artifact, implementation lane, decision, or verdict. |
| Cost justified | Reduced ambiguity exceeds another permanent role's context and coordination cost. |

## Design basis

The provider/posture/scope taxonomy is a Kai design decision, not an external
standard. Its surrounding conventions are grounded in:

- [GitHub custom-agent configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration):
  agent metadata, optional tools/model, and the 30,000-character prompt limit.
- [Agent Skills specification](https://agentskills.io/specification): skill
  metadata, progressive disclosure, and the under-500-line SKILL.md guidance.
- [github/awesome-copilot authoring rules](https://github.com/github/awesome-copilot/blob/main/AGENTS.md):
  lowercase hyphenated identities and structural separation of agents, skills,
  and workflows.

Legacy `principal-*`, `director-*`, and `creative-*` identities remain valid
only for the current migration baseline. New durable roles use this taxonomy.

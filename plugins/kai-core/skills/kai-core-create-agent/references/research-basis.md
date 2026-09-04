# Agent-authoring research basis

Use this reference when a proposed agent introduces a new prompt convention,
host field, loading rule, or agent-versus-skill boundary. It records evidence,
not a universal standard.

## Authoritative specifications

- [GitHub custom-agent configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
  defines agent-profile frontmatter for GitHub hosts. `tools` is optional,
  host-specific, and defaults to all tools when omitted. Unrecognized names are
  ignored. It is not part of the Agent Skills format.
- [Agent Skills specification](https://agentskills.io/specification) defines
  skill metadata and progressive disclosure: metadata is available at startup,
  `SKILL.md` loads when activated, and references load only when required.
- [Anthropic skill-authoring guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
  treats context as shared capacity and recommends concise entry instructions
  with conditional, one-level-deep references.
- [Anthropic's open-source skill creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)
  applies the same three-level disclosure model and makes the skill description
  the primary activation surface.

There is no cross-host custom-agent frontmatter standard comparable to the
Agent Skills specification. GitHub and Claude agent fields are runtime
contracts for their respective hosts.

## Open-source examples reviewed

- [github/awesome-copilot `se-technical-writer`](https://github.com/github/awesome-copilot/blob/main/agents/se-technical-writer.agent.md)
  uses a focused routing description and GitHub-specific tool list, but embeds
  document templates directly in a long agent prompt.
- [github/awesome-copilot `taxcore-technical-writer`](https://github.com/github/awesome-copilot/blob/main/agents/taxcore-technical-writer.agent.md)
  shows the value of domain terminology and audience-specific quality checks,
  while also showing how document methods can dominate an agent body.
- [rohitg00/awesome-claude-code-toolkit `technical-writer`](https://github.com/rohitg00/awesome-claude-code-toolkit/blob/main/agents/business-product/technical-writer.md)
  centers audience, information type, verification, and editorial process.
- [verifywise-ai/verifywise `technical-writer`](https://github.com/verifywise-ai/verifywise/blob/develop/agents/technical-writer.md)
  separates mission, collaboration, outputs, guardrails, and completion, but
  mixes generic project-management artifacts into the writing role.
- [solatis/claude-config `technical-writer`](https://github.com/solatis/claude-config/blob/main/agents/technical-writer.md)
  uses a compact agent with conditional convention references, demonstrating
  just-in-time loading rather than a universal preload.
- [wshobson/agents documentation roles](https://github.com/wshobson/agents/tree/main/plugins/documentation-generation/agents)
  separate documentation architecture, tutorials, and reference building into
  focused roles, while bounded methods such as
  [ADR authoring](https://github.com/wshobson/agents/blob/main/plugins/documentation-generation/skills/architecture-decision-records/SKILL.md)
  live as skills.
- [Anthropic's `doc-coauthoring` skill](https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md)
  packages context gathering, section refinement, and reader testing as a
  reusable workflow rather than a permanent writer persona.
- [Prisma skill contributor guidance](https://github.com/prisma/orm/blob/main/skills/DEVELOPING.md)
  keeps the skill entry point to activation, routing, and the canonical mental
  model while moving workflow-specific material to on-demand references.

Examples are design inputs, not authorities. Their frontmatter and runtime
assumptions belong to their hosts.

## Kai decisions

1. An agent owns durable authority, routing, evidence standards, and completion.
2. Reusable document methods belong in focused skills or references.
3. Skills load at the workflow step that needs them; listing a skill must not
   imply eager loading.
4. Core compatibility is checked before the first core-skill use, not before
   ordinary single-shot work.
5. A missing core disables Kai coordination and state, not the agent's basic
   domain capability. The agent states that limitation once and tells the
   operator to install or update `kai-core`.
6. Frontmatter must identify which fields are host-specific. Tool access is
   selected for actual actions and least privilege, not copied as a standard.

`eng-lead-technical-writing` earns an agent slot because information
architecture and editorial readiness are standing authorities across document
types. Drafting a README, tutorial, API reference, ADR, or release note is a
bounded method and should become a focused skill when Kai codifies it.

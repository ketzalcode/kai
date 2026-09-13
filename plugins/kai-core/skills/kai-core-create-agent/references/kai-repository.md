# Kai repository checklist

This is the canonical repository checklist for `kai-core-create-agent`. A
future agent-authoring procedure may reuse it; if a second skill needs this
contract, promote the checklist to a shared skill rather than copying it.

Use it when creating or refining an agent in the Kai plugin repository.

## Before editing

1. Read root `AGENTS.md`.
2. Read the target agent when refining one.
3. Read neighboring agents and the skills they route at the relevant steps.
4. Read the current roster and taxonomy validators.

## Canonical source

1. Edit only `plugins/<provider>/agents/<agent-id>.agent.md`.
2. Name each skill in the instruction that needs it. Do not add an
   `**Inherits:**` line or a skill manifest section.
3. Do not add a core dependency-guard region. Core availability is checked
   just in time before the first core skill.
4. Add a new identity to the provider array in `NEW_AGENT_IDS` in root
   `scripts/lib/pack-plan.mjs`.
5. Add a new agent to exactly one `CATEGORIES` entry in root
   `scripts/generate-catalog.mjs`.

Generated copies under `plugins/kai-core/scripts/` are outputs, not sources.

## Required situational contracts

Every agent routes `kai-core-contract-v1` before its first other
core skill, stating the core-unavailable refusal in its own words in the same
paragraph. Route every other contract inline, at the instruction that needs it —
never as a hoisted manifest:

- `kai-core-operating-rules` before coordinated Kai work;
- `kai-core-asset-producing` before creating or changing durable output, and
  `kai-core-asset-closing` where the role accepts, promotes, or closes one;
- `kai-core-workspace-paths` before resolving a root or placing a file, and
  `kai-core-workspace-initiative` before reading or writing initiative state;
- `kai-core-work-acting` before acting on an item, with `kai-core-work-item`
  for its record and `kai-core-work-granting` only for the lease grantor;
- `kai-core-work-activity` before recording a bounded run.

Add coordination, communication, scope, or domain skills only when the agent
has an action that triggers them. Every additional skill must be provided by
core or the same plugin.

All eight packages use task-local routes. No current agent uses the retired
eager declaration or a dependency-guard region.

## One-agent identity change

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
fleet-wide rename belongs to a separate migration skill.

## Generate and validate

Run in order:

```text
npm run host-contract:update
npm run docs:generate
npm run pack-preview -- --write
npm test
```

Confirm the source and generated pack copy agree, and inspect the final diff.

## Release surfaces

Follow root `AGENTS.md` for the current release policy. A shipped behavior
change updates:

- root and pack versions;
- marketplace metadata and entries;
- `CHANGELOG.md`;
- README status stamp;
- generated catalog and package locks.

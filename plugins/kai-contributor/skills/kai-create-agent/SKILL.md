---
name: kai-create-agent
description: "Use when creating or materially revising a repository-local or Kai agent so the role earns its context cost, owns one clear lane, and loads reusable instructions only at the decision that needs them."
tools: [read, edit, search, execute]
user-invocable: true
argument-hint: "agent purpose or existing agent path"
---

# Create an Agent

Create the smallest durable role that improves routing or execution. An agent
is permanent context and coordination cost, not a container for every rule that
might someday apply.

Repository instructions and loader conventions govern. Inspect them before
editing.

## Choose ownership first

Default to a repository-local agent when the role is requested for one
workspace, is still evolving, or depends on local authority, tools, or team
practice. Preserve the repository's established agent location; Copilot CLI
reads `.github/agents/` and `.claude/agents/`. Do not invent another path.

Choose a Kai package only when the operator explicitly requests Kai-wide
ownership or evidence shows a stable recurring responsibility across
repositories. Apparent generality is insufficient. If ownership is ambiguous,
ask one local-versus-Kai question before editing Kai or opening a public Kai PR.

## Decide whether an agent is warranted

Prefer, in order:

1. direct work when one bounded request needs no durable identity;
2. an existing agent when its authority already fits;
3. a skill when the missing capability is reusable method;
4. a new agent only for a recurring responsibility with an independent lane.

A bounded procedure belongs in a user-invocable skill. Never create a
`workflow-*` agent to wrap steps that the skill can execute directly.

A new agent must have:

- a repeated trigger recognizable from its description;
- one decision, implementation, review, operation, or coordination lane;
- named neighboring owners and authority seams;
- an output or verdict with a clear completion condition; and
- enough routing or context-isolation value to justify another role.

If any is missing, strengthen an existing agent or skill instead.

## Define the contract before prose

Record:

- trigger and nearest non-trigger;
- owned decisions and actions;
- decisions reserved for another role or the operator;
- required inputs and evidence;
- output and completion condition;
- handoffs;
- execution profile, model, and tools.

Choose the provider whose absence should make the role unavailable. Keep Core
independent of departments and agent-free: Core owns shared skills and runtime,
not a coordinating persona. Keep a reusable resource unaware of higher-level
callers.

## Use progressive disclosure

Use three layers: **Catalog:** `name` and `description` select the role;
**Agent body:** identity, authority, routing, universal boundaries, and the
short operating loop; **Task-local resources:** a skill, reference, script, or
another agent, activated only when execution reaches the decision that needs it.

An agent body loads as a whole. Do not use it as a catalog of possible skills.
Move reusable methods into skills and large lookup material into skill
references.

Route each skill inline at its firing point:

- Direct single-role work stays direct.
- When a Core boundary becomes active, invoke the Core skill directly at that
  boundary and state the no-Core fallback there.
- Load workspace resolution only when a workspace path is needed.
- Load granting only when preparing or issuing coordinated work.
- Load acting only immediately before a coordinated state change.
- Load activity only when recording the corresponding event.

Do not add an `**Inherits:**` line, dependency guard, required-skills section,
or PREPARE paragraph that applies several contracts before the request reaches
their boundaries. A conditional route is still just in time; a collected route
list is eager loading in prose.

## Keep the role focused

Frontmatter carries exact identity, a discriminating description, one approved
model, and only tools used by real actions. Use manual invocation when automatic
selection would add costly or surprising process.

The body should contain:

1. identity and mission;
2. primary execution profile;
3. authority and positive routing;
4. inputs and evidence;
5. a short operating sequence with task-local routes;
6. output, completion, and handoff;
7. essential hard stops.

Remove repeated shared rules. Split only when both resulting roles independently
earn a slot. Otherwise extract method into a skill.

## Author and validate

1. Read roster metadata first, then the nearest one to three agent bodies in the
   chosen owner; do not impose Kai frontmatter on a repository-local agent.
2. Search for an existing owner or method before adding a surface.
3. Draft the contract, then the smallest prompt that implements it.
4. Search references in both directions and keep dependencies one-way.
5. Add behavioral cases for the positive route, nearest neighbor, authority
   seam, completion condition, and runtime fit.
6. Update the owning catalog and generated artifacts when required.
7. Run focused authoring validation, then the repository-required checks.

Reject an agent that needs eager shared context to understand its own purpose.
Its identity is unclear or the reusable method belongs in a skill.

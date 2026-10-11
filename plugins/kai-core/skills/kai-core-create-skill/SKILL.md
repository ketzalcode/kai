---
name: kai-core-create-skill
description: "Use when creating or revising a Copilot skill so its boundary stays reusable, caller-agnostic, acyclic, and proportionate to the method it teaches."
tools: [read, edit, search, execute]
user-invocable: true
argument-hint: "skill purpose or existing skill path"
---

# Create a Skill

Create the smallest reusable method that solves a repeated class of work. Do
not turn one caller's lifecycle, one task, or one data object into a permanent
skill.

Repository instructions and loader conventions govern. Inspect them before
editing.

## Establish the boundary

A skill is justified when the method:

- recurs across tasks or callers;
- has a stable trigger and completion condition;
- benefits from context that should load only when needed; and
- can be applied without knowing which agent invoked it.

Keep phases of one method as sections or companion references. Split another
skill only when it has an independent trigger, independent reuse, or materially
different tools/context. Do not create prepare, execute, and report skills only
because a lifecycle has three phases.

## Preserve dependency direction

Use one direction:

```text
higher-level orchestrator
  -> domain agent
    -> reusable skill
      -> companion reference or deterministic script
```

The caller may know the resource. The resource must not know its caller.

- An orchestrator may dispatch a generic domain agent.
- An agent may load a skill.
- A skill may load a lower-level skill from its own package or Core when the
  method genuinely composes it.
- A generic agent or skill must not name the higher-level workflow that happens
  to use it.
- Core never depends on a department. A department depends only on itself and
  Core, never on a sibling department.

Before adding a route, search both directions. If A reaches B and B reaches A,
do not add the edge. Keep orchestration in A, or move genuinely shared behavior
into a third lower-level skill C that both may use.

## Keep the main skill lean

The main `SKILL.md` contains:

- a precise use-when description;
- the stable decision or method;
- hard boundaries and failure behavior; and
- links to companion material only when it is needed.

Put large examples, templates, and lookup material under `references/`. Put
deterministic parsing, persistence, and machine validation in scripts or source
code. Do not copy a runtime schema into prose merely so an agent can keep
rewriting it.

When work accumulates incrementally, prefer:

- one small immutable admission or accepted basis;
- append-only observations or checkpoints; and
- a final read-only projection or report.

The report is not another authority and the admission is not a progress log.

## Author or revise

1. Read neighboring skills and reuse their frontmatter, naming, tools, and
   reference conventions.
2. Search for an existing skill that already owns the method.
3. Write the trigger around the real repeated request, not the current task.
4. Keep caller-specific routing in the caller.
5. Add only the tools the skill itself needs.
6. Add focused examples or references only where prose would otherwise become
   ambiguous.
7. Update the owning catalog and generated artifacts when the repository
   requires them.

When revising, remove accidental caller awareness and duplicated operating
contracts before adding more instructions.

## Validate

Check:

- the skill loads from every intended caller without knowing any of them;
- no agent/skill route returns to an upstream caller;
- no cross-pack dependency violates package direction;
- the description is sufficient to discover the skill;
- examples do not parse as live routes;
- referenced files and scripts ship with the owning package; and
- focused repository validation passes.

If the repository exposes a reference-graph or cycle check, run it. A missing
provider, circular route, or caller-aware resource is an architecture failure,
not documentation polish.

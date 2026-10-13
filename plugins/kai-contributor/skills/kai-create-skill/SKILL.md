---
name: kai-create-skill
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

## Choose ownership before editing
Default to a repository-local skill when the method:

- is requested for one workspace;
- is new, still evolving, or unproven outside that workspace; or
- depends on repository terminology, team practice, or local tools.

Before choosing its directory, inspect repository instructions, existing skill
roots, and the active host. Copilot CLI supports `.github/skills/`,
`.claude/skills/`, and `.agents/skills/` without a documented preference.
Preserve the repository's established supported root. If several or none make
the placement clear, ask one placement question instead of inventing a default.

Choose a Kai package only when the operator explicitly requests Kai-wide
ownership or grounded evidence shows stable, caller-agnostic reuse across
repositories. Apparent generality is insufficient by itself.

When ownership remains ambiguous, ask one local-versus-Kai question. Do not
edit Kai, create a Kai branch, or open a public Kai PR before this decision.

## Establish the boundary

A skill is justified when the method:

- recurs across tasks or callers;
- has a stable trigger and completion condition;
- benefits from context that should load only when needed; and
- can be applied without knowing which agent invoked it.

Keep phases of one method together. Split only for an independent trigger,
independent reuse, or materially different tools/context.

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

Use progressive disclosure:

1. **Catalog:** `name` and `description` describe what the skill does and when
   it fires.
2. **Instructions:** the full `SKILL.md` loads only after activation, so keep
   it to the stable method, decisions, boundaries, and failure behavior.
3. **Resources:** load references, scripts, assets, or lower-level skills only
   at the step that needs them.

Put large examples, templates, and lookup material under `references/`. Put
deterministic parsing, persistence, and machine validation in scripts or source
code. Do not copy a runtime schema into prose merely so an agent can keep
rewriting it.

Do not begin with a collected dependency list. Route a lower-level skill inline
where the method reaches that decision. If every run needs another skill before
this one can be understood, the boundary is probably misplaced.

For incremental work, prefer one immutable admission or accepted basis and
append-only observations or checkpoints; use a final read-only projection or report
rather than another mutable authority.

## Author or revise

1. Use the nearest accepted skill as the repository-native shape; do not impose
   Kai frontmatter on a local host.
2. Search for an existing skill that already owns the method.
3. Write the trigger around the real repeated request, not the current task.
4. Keep caller-specific routing in the caller.
5. Add only the tools the skill itself needs.
6. Add references only where prose would be ambiguous; update required catalogs
   and generated artifacts.

When revising, remove caller awareness and duplicated operating contracts
before adding instructions.

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

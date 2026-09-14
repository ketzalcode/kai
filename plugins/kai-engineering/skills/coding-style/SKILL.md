---
name: coding-style
description: "Use when applying shared implementation defaults where repository conventions and task instructions leave appropriate details unspecified."
tools: [read, search, edit]
user-invocable: true
argument-hint: "optional file or area to apply to"
---

# Coding Style

Apply these defaults while carrying out authorized code work. They are
implementation constraints, not a separate research, planning, approval, or
reporting process. The caller continues its assigned task.

## Precedence

Explicit user requirements and repository-local conventions come first,
including established APIs, formatters, linters, and patterns. Use these
defaults only where that context is silent. A task-specific correctness,
safety, compatibility, or performance need may justify a narrow departure.

## Defaults

- Prefer the simplest readable implementation that satisfies the actual
  requirements. Use early returns or named intermediate values when they make
  control flow clearer; use dense or unusual constructs only for a concrete
  constraint.
- Choose names that reveal intent. Keep abbreviations and boolean naming
  consistent with the repository.
- Make errors, logs, and telemetry useful to the person acting on them. Follow
  the repository's error types and message conventions, and include relevant
  context without exposing sensitive data.
- Compose code where a boundary improves clarity, reuse, or independent
  testing. Keep cohesive code together; do not create helpers or components
  merely to satisfy a generic size rule.
- Write comments and documentation for a non-obvious reason, constraint, or
  public contract. Keep their detail proportionate to the code and repository;
  do not impose a global comment-line limit or restate clear code.
- Leave generated or vendored code in its owning form unless the task
  explicitly requires changing it.

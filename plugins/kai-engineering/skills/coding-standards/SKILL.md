---
name: coding-standards
description: "Use when writing, modifying, or refactoring code."
tools: [read, search, edit]
user-invocable: true
argument-hint: "optional file or area to apply to"
---

# Coding Standards

Use these standards alongside task requirements and repository context. Task
requirements define the intended outcome. Repository constraints define what
must remain compatible. These standards guide implementation quality.

Start from established repository patterns, but improve them within the
authorized scope when they conflict with correctness, clarity, safety, or
maintainability.

## Rules

- Prefer readable code over clever code or minimum line count. Use guard
  clauses, named intermediate values, and explicit branches when they make the
  control flow easier to follow. Keep sequential asynchronous workflows clear.
- Choose names that express intent and business meaning. Keep parsing,
  transport, and storage details behind semantic predicates or domain-oriented
  interfaces when callers do not need those details.
- Keep one authoritative definition for facts that must remain identical,
  using the repository's established types, enums, constants, or other native
  structures. Derive matching representations from that owner instead of
  maintaining copies. Keep separate definitions when they represent different
  decisions. Do not add validation layers or abstractions solely to centralize
  a value.
- Follow the codebase's response and error contract. Throw, return a result, or
  represent absence and empty values according to what callers need and nearby
  APIs establish. Do not add status wrappers when a simpler established shape
  is correct, and never make a failure look like success.
- Use precise types and narrow, justified casts rather than broad casts or
  `any`. Before declaring a type in an implementation file, look for its owner:
  keep single-use types local, and place shared or domain types in the
  repository's established model or type boundary.
- Handle errors explicitly. Avoid silent catches and broad fallbacks. Make
  error messages and logs actionable without exposing sensitive data.
- Treat telemetry as a compatibility contract. Preserve existing event names,
  fields, meaning, and emission behavior unless changing telemetry is part of
  the task; account for affected dashboards, alerts, and other consumers. For
  new telemetry, follow repository patterns and emit useful, non-sensitive
  signals.
- Give each unit one coherent responsibility. A UI component boundary earns
  itself when it owns reusable behavior, independent state or lifecycle, or a
  stable interface. Keep a one-off render branch with the component that owns
  its state. Extract other code for clarity, real reuse, or independent
  testing; keep cohesive, single-use logic local when extraction would hide
  context or add indirection. Prefer pure helpers for reusable transformations
  and decisions.
- Avoid speculative abstractions, unnecessary components, generic frameworks,
  and lookup tables that do not simplify the current requirement.
- Preserve public behavior, accessibility, and localization during refactors
  unless the task intentionally changes them.
- Comment only when names and structure cannot make a non-obvious intent,
  constraint, or invariant clear.

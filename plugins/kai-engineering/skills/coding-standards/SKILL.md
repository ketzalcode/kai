---
name: coding-standards
description: "Use when applying shared implementation defaults where repository conventions and task instructions leave appropriate details unspecified."
tools: [read, search, edit]
user-invocable: true
argument-hint: "optional file or area to apply to"
---

# Coding Standards

Use these defaults while writing or refactoring code. They guide implementation
choices; they do not add a separate planning, approval, or reporting process.

## Precedence

Explicit user requirements and repository-local conventions come first,
including established APIs, formatters, linters, and patterns. Apply these
rules only where that context is silent. Treat them as defaults, and depart
from them when a specific correctness, safety, compatibility, or performance
need makes another choice clearer.

## Rules

- Prefer readable code over clever code or minimum line count. Use guard
  clauses, named intermediate values, and explicit branches when they make the
  control flow easier to follow. Keep sequential asynchronous workflows clear.
- Choose names that express intent and business meaning. Keep parsing,
  transport, and storage details behind semantic predicates or domain-oriented
  interfaces when callers do not need those details.
- Keep types honest about absent, empty, and failed results. Prefer precise
  models and safe refinement over assertions, broad casts, or other weak
  type-system escape hatches.
- Handle errors explicitly. Avoid silent catches, broad fallbacks, and results
  that look successful when the operation failed. Make errors, logs, and
  telemetry useful without exposing sensitive data.
- Extract code when a boundary improves clarity, responsibility, real reuse, or
  independent testing. Keep cohesive, single-use logic local when extraction
  would hide context or add indirection. Prefer pure helpers for reusable
  transformations and decision logic.
- Avoid speculative abstractions, unnecessary components, generic frameworks,
  and lookup tables that do not simplify the current requirement.
- Preserve public behavior, accessibility, localization, logging, and
  telemetry during refactors unless the task intentionally changes them.
- Test observable behavior on the changed path, including relevant priorities,
  exclusivity, fallbacks, invalid inputs, and concurrency. Run the focused
  tests, formatting, linting, and type checks that cover the affected surface.
- Comment only when names and structure cannot make a non-obvious intent,
  constraint, or invariant clear.

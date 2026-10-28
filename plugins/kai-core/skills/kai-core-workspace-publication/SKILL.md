---
name: kai-core-workspace-publication
description: "Use when a core role may retain or publish durable coordination decisions or reports."
tools: [read, edit, execute, search]
---

# Core workspace publication

Use this contract immediately before durable core asset production. It is the
only source for the core publication vocabulary. Core does not copy or route
Engineering or Creative vocabularies.

## Canonical vocabulary

Read the package-root `publication.json` declaration for the allowed types,
paths, formats, authority, and privacy rules.

<!-- >>> kai publication table (generated) >>>
| Namespace | Type | Subtype | Private form | Public form | Formats | Publication rule | Privacy rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `core` | `decisions` | `-` | `.kai/core/decisions/<id>/{evidence,scratch}` | `docs/kai/core/decisions/<id>/` | Markdown, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `core` | `reports` | `-` | `.kai/core/reports/<id>/{evidence,scratch}` | `docs/kai/core/reports/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
<!-- <<< kai publication table <<< -->

## Validation and refusal

Apply `kai-core-workspace-paths` before selecting a knowledge home. Core
decisions and report narratives live at their canonical repository path from
the first edit, on a branch; use established repository documentation before
the default `publicForm`. Do not keep an authoritative private draft.
Acceptance binds a revision without moving the file. Runtime execution logs
and sensitive evidence remain private, not project narratives.

Before deriving a path, validate namespace, type, subtype, stable ID, lifecycle,
format, target project, and destination ownership against that declaration.

- Refuse an **unknown type or subtype**. Do not create a fallback directory.
- **Scratch can never publish.**
- **Committing a proposal does not authorize acceptance or external publication.**
- **Private evidence can never publish.**
- **An arbitrary root can never publish.**
- A path collision, link, junction, nested Git root, namespace mismatch, or
  typed destination outside the configured project publication root is a refusal.

Return the validated ownership and location. For coordinated knowledge
acceptance, Load `kai-core-work-acting` before `artifact.register`, review, or
approval of the exact Git base/head. Knowledge needs no private-to-public
transition. Private or non-Git deliverables retain their hash-bound acceptance
and authorized `asset.transition` where applicable; registered source bytes
must remain immutable. Ordinary repository edits create no Kai asset state.

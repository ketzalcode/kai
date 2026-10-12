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
| `core` | `decisions` | `-` | `.kai/core/decisions/<id>/{drafts,evidence,scratch}` | `docs/kai/core/decisions/<id>/` | Markdown, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `core` | `reports` | `-` | `.kai/core/reports/<id>/{drafts,evidence,scratch}` | `docs/kai/core/reports/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
<!-- <<< kai publication table <<< -->

## Validation and refusal

Before deriving a path, validate namespace, type, subtype, stable ID, lifecycle,
format, target project, and destination ownership against that declaration.

- Refuse an **unknown type or subtype**. Do not create a fallback directory.
- **Scratch can never publish.**
- **An unaccepted draft can never publish.**
- **Private evidence can never publish.**
- **An arbitrary root can never publish.**
- A path collision, link, junction, nested Git root, namespace mismatch, or
  destination outside the configured project publication root is a refusal.

Return the validated vocabulary choice to the caller. For coordinated assets,
keep mutable bytes on the typed private route and Load `kai-core-work-acting`
before `artifact.register` or `asset.transition`. The runtime validates the
Task, pack, path, provenance, exact accepted hash, mirrored public target, and
transition. A refusal stops publication. Direct repository files use their
repository-native path and create no Kai asset state.

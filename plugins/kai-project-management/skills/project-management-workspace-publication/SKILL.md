---
name: project-management-workspace-publication
description: "Use when accepted Direction or planning knowledge may be published from Project Management."
tools: [read, edit, search]
---

# Project Management workspace publication

Read the package-root `publication.json` as the only vocabulary authority.

<!-- >>> kai publication table (generated) >>>
| Namespace | Type | Subtype | Private form | Public form | Formats | Publication rule | Privacy rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `project-management` | `direction` | `-` | `.kai/project-management/direction/<id>/{drafts,evidence,scratch}` | `docs/kai/project-management/direction/<id>/` | Markdown, Markdown single file, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `project-management` | `plans` | `-` | `.kai/project-management/plans/<id>/{drafts,evidence,scratch}` | `docs/kai/project-management/plans/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
<!-- <<< kai publication table <<< -->

Publish only an accepted revision with its named completion authority. Private
evidence never publishes. Scratch never publishes. Refuse unknown types,
subtypes, paths, links, collisions, or destinations outside the configured
publication root.

## Validation and refusal

Return the selected vocabulary, exact source revision, accepted hash,
destination, and authority. Do not invent a fallback lane.

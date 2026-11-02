---
name: project-management-workspace-publication
description: "Use when authoring durable Direction or planning knowledge and recording its acceptance."
tools: [read, edit, execute, search]
---

# Project Management workspace publication

Read the package-root `publication.json` as the only vocabulary authority.

<!-- >>> kai publication table (generated) >>>
| Namespace | Type | Subtype | Private form | Public form | Formats | Publication rule | Privacy rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `project-management` | `direction` | `-` | `.kai/project-management/direction/<id>/{evidence,scratch}` | `docs/kai/project-management/direction/<id>/` | Markdown, Markdown single file, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `project-management` | `plans` | `-` | `.kai/project-management/plans/<id>/{evidence,scratch}` | `docs/kai/project-management/plans/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
<!-- <<< kai publication table <<< -->

Apply `kai-core-workspace-paths` before choosing a knowledge home. Author
Git-suitable Direction and planning narratives at their canonical repository
path from the first edit, on a branch. Reuse an established documentation home
before the default `publicForm`; do not maintain an authoritative private draft.
Keep existing named acceptance and repository review gates. A committed proposal
does not approve Direction, close scope, or authorize external publication.

The private Project Management database remains the authority for planning
records. Markdown or JSON documents are revision-bound explanations or
projections, never a writable mirror of that database. Private evidence and
scratch never publish.

## Validation and refusal

Return the canonical location, exact source revision, and required authority.
Refuse unknown types, subtypes, unsafe paths, links, collisions, or typed
destinations outside the configured root. Do not invent a fallback lane.
For an existing coordinated Task, Load `kai-core-work-acting` before binding
knowledge acceptance to the exact Git base/head. No private-to-public move is
needed. Private non-Git outputs keep their hash-bound acceptance and authorized
`asset.transition` where applicable. Ordinary repository edits create no Kai
asset state.

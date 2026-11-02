---
name: engineering-workspace-publication
description: "Use when an engineering role may retain or publish durable feature, architecture, decision, investigation, or release knowledge."
tools: [read, edit, execute, search]
---

# Engineering workspace publication

Use this contract immediately before durable engineering asset production. It
is the only source for the Engineering vocabulary. Implementation, tests,
configuration, migrations, and ordinary product documentation stay at their
repository-native paths and do not create Kai state.

## Canonical vocabulary

Read the package-root `publication.json` declaration for the allowed types,
paths, formats, authority, and privacy rules.

<!-- >>> kai publication table (generated) >>>
| Namespace | Type | Subtype | Private form | Public form | Formats | Publication rule | Privacy rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `engineering` | `features` | `-` | `.kai/engineering/features/<id>/{evidence,scratch}` | `docs/kai/engineering/features/<id>/` | Markdown, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `documentation` | `architecture` | `.kai/engineering/documentation/architecture/<id>/{evidence,scratch}` | `docs/kai/engineering/documentation/architecture/<id>/` | Markdown, diagram, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `decisions` | `-` | `.kai/engineering/decisions/<id>/{evidence,scratch}` | `docs/kai/engineering/decisions/<id>/` | Markdown, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `reports` | `investigations` | `.kai/engineering/reports/investigations/<id>/{evidence,scratch}` | `docs/kai/engineering/reports/investigations/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `reports` | `nightshift` | `.kai/engineering/reports/nightshift/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/reports/nightshift/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `reports` | `releases` | `.kai/engineering/reports/releases/<id>/{evidence,scratch}` | `docs/kai/engineering/reports/releases/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
<!-- <<< kai publication table <<< -->

## Canonical knowledge

Apply `kai-core-workspace-paths` when choosing the knowledge home. Author
features, architecture, decisions, and report narratives at their canonical
repository location from creation, including proposed revisions. Use the
repository's established documentation home before the default `publicForm`.
Do not maintain an authoritative `.kai` draft or a parallel publication copy.

Record a changed decision in that same document and its stable navigation,
without waiting for implementation completion. Preserve existing approval
gates and distinguish proposed scope, accepted intent, and implementation
progress. Private evidence and unaccepted sensitive material stay private.
Nightshift's runner checkpoints and private execution report remain operational
working material, not the canonical project narrative.

## Validation and refusal

Architecture is the only initial documentation subtype. Investigations and
releases are the only initial report subtypes. Reviews remain private evidence
unless named authority accepts a sanitized revision as an investigation report.

- Refuse an **unknown type or subtype**. Do not create `incidents`, `reviews`,
  `misc`, or another fallback lane.
- **Scratch can never publish.**
- **A committed proposal is not automatically accepted or authorized for
  external publication.**
- **Private evidence can never publish.**
- **An arbitrary root can never publish.**
- Refuse a pack/path mismatch, collision, link, junction, nested Git root, or
  typed destination outside the configured project publication root.

Return the validated ownership and canonical path. For coordinated acceptance,
Load `kai-core-work-acting` before binding the exact Git revision through
`artifact.register`, review, or approval. No private-to-public move is needed
for knowledge. Private or non-Git outputs still require their existing
hash-bound acceptance and authorized `asset.transition` when applicable.
Registered bytes are immutable. A refusal stops the affected action. Ordinary
repository edits create no Kai asset state.

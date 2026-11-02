---
name: creative-workspace-publication
description: "Use when a creative role may retain or publish durable design, guidance, decision, report, or media material."
tools: [read, edit, execute, search]
---

# Creative workspace publication

Use this contract immediately before durable creative asset production. It is
the only source for the Creative vocabulary. Feature designs stay with the
feature they serve; reusable design-system or brand guidance is documentation.

## Canonical vocabulary

Read the package-root `publication.json` declaration for the allowed types,
paths, formats, authority, and privacy rules.

<!-- >>> kai publication table (generated) >>>
| Namespace | Type | Subtype | Private form | Public form | Formats | Publication rule | Privacy rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `creative` | `features` | `-` | `.kai/creative/features/<id>/{evidence,scratch}` | `docs/kai/creative/features/<id>/` | Markdown, HTML, image, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `creative` | `documentation` | `-` | `.kai/creative/documentation/<id>/{evidence,scratch}` | `docs/kai/creative/documentation/<id>/` | Markdown, HTML, image, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `creative` | `decisions` | `-` | `.kai/creative/decisions/<id>/{evidence,scratch}` | `docs/kai/creative/decisions/<id>/` | Markdown, image, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `creative` | `reports` | `-` | `.kai/creative/reports/<id>/{evidence,scratch}` | `docs/kai/creative/reports/<id>/` | Markdown, JSON, image, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `creative` | `media` | `-` | `.kai/creative/media/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/media/<id>/` | media, Markdown destination record | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
<!-- <<< kai publication table <<< -->

## Canonical knowledge

Apply `kai-core-workspace-paths` when choosing a project-knowledge home.
Feature designs, documentation, decisions, and report narratives live at their
canonical repository location from the first edit, including proposed
revisions. Use the repository's established home before the default
`publicForm`; do not maintain a private authoring copy and a publication copy.
Git-suitable HTML, diagrams, and approved small images may accompany that
knowledge. A committed design is not automatically accepted and does not
authorize implementation. Keep named design acceptance independent.

## Validation and refusal

Media publication distinguishes a Git-suitable deliverable from a Markdown
record that references an explicitly approved durable destination. The type
does not make a binary safe to commit. Media, sensitive design evidence, and
binary working material retain their private custody and acceptance flow.

- Refuse an **unknown type or subtype**. Do not create a fallback lane.
- **Scratch can never publish.**
- **A committed knowledge proposal is not acceptance or external-publication
  permission. An unaccepted private media draft can never publish.**
- **Private evidence can never publish.**
- **An arbitrary root can never publish.**
- Refuse an **unsafe media destination**, including an unapproved external
  location, a sensitive or licensed binary, an oversized repository payload,
  or a destination that cannot preserve custody and provenance.
- Refuse a pack/path mismatch, collision, link, junction, nested Git root, or
  typed destination outside the configured project publication root.

For coordinated knowledge, Load `kai-core-work-acting` before registration,
review, or approval of the exact Git base/head. No private-to-public transition
is needed for repository knowledge.

For private media and other non-Git deliverables, retain immutable source bytes
on the authorized private route. Load `kai-core-work-acting` before
`artifact.register` or `asset.transition`; publish only the independently
accepted hash to its authorized destination. Never edit registered media in
place. A refusal stops publication. Ordinary repository edits create no Kai
asset state.

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
| `engineering` | `features` | `-` | `.kai/engineering/features/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/features/<id>/` | Markdown, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `documentation` | `architecture` | `.kai/engineering/documentation/architecture/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/documentation/architecture/<id>/` | Markdown, diagram, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `decisions` | `-` | `.kai/engineering/decisions/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/decisions/<id>/` | Markdown, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `reports` | `investigations` | `.kai/engineering/reports/investigations/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/reports/investigations/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `reports` | `nightshift` | `.kai/engineering/reports/nightshift/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/reports/nightshift/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `reports` | `releases` | `.kai/engineering/reports/releases/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/reports/releases/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
<!-- <<< kai publication table <<< -->

## Reconcile a lasting decision

When an accepted scope or design decision affects existing durable Engineering
knowledge, compare it with the current versioned feature/design bundle before
treating private draft changes as sufficient.

1. Locate the canonical document or bundle, its current revision, and the
   repository entry points that lead to it. Reuse its ownership and location;
   do not create a competing authority. If the location or authority is
   ambiguous, report that gap rather than choosing an arbitrary destination.
2. Prepare only the affected decision, scope, rationale, and references as a
   focused revision. Distinguish accepted intent from implementation progress.
   Keep captures, evidence, scratch, and unaccepted alternatives private; do
   not promote the entire feature workspace.
3. For a coordinated Kai publication, retain the proposed revision on its
   typed private route and obtain the named completion authority's acceptance
   of the exact revision and hash before updating the mirrored public target.
   A confirmed decision does not accept newly authored bytes. Use the existing
   registration and transition rules below; do not infer acceptance or create
   a Task merely to edit ordinary repository documentation.
4. Keep stable repository navigation linked to committed documentation. Update
   affected links with the authorized documentation revision, never redirect
   repository instructions to an ignored draft as the feature authority.
   Private context may supplement, not replace, the committed source.

Do not wait for implementation completion to retain accepted knowledge. If
publication is pending, name the changed decision, stale versioned document,
prepared revision, and missing acceptance or authority in the handoff. Do not
claim documentation is current because its private draft is current.
Unaccepted proposals remain proposals and cannot overwrite accepted scope.

## Validation and refusal

Architecture is the only initial documentation subtype. Investigations and
releases are the only initial report subtypes. Reviews remain private evidence
unless named authority accepts a sanitized revision as an investigation report.

- Refuse an **unknown type or subtype**. Do not create `incidents`, `reviews`,
  `misc`, or another fallback lane.
- **Scratch can never publish.**
- **An unaccepted draft can never publish.**
- **Private evidence can never publish.**
- **An arbitrary root can never publish.**
- Refuse a pack/path mismatch, collision, link, junction, nested Git root, or
  destination outside the configured project publication root.

Return the validated vocabulary choice to the caller. For coordinated assets,
keep mutable bytes on the typed private route and Load `kai-core-work-acting`
before `artifact.register` or `asset.transition`. The runtime validates the
Task, pack, path, provenance, exact accepted hash, mirrored public target, and
transition. A refusal stops publication. Direct repository files use their
repository-native path and create no Kai asset state.

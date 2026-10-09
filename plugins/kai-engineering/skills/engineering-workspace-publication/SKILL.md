---
name: engineering-workspace-publication
description: "Use when an engineering role may retain or publish durable feature, architecture, decision, investigation, or release knowledge."
tools: [read, edit, search]
---

# Engineering workspace publication

Use this contract immediately before durable engineering asset production. It
is the only source for the Engineering vocabulary. Implementation, tests,
configuration, migrations, and ordinary product documentation stay at their
repository-native paths and do not create Kai state.

## Canonical vocabulary

<!-- >>> kai publication table (generated) >>>
| Namespace | Type | Subtype | Private form | Public form | Formats | Publication rule | Privacy rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `engineering` | `features` | `-` | `.kai/engineering/features/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/features/<id>/` | Markdown, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `documentation` | `architecture` | `.kai/engineering/documentation/architecture/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/documentation/architecture/<id>/` | Markdown, diagram, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `decisions` | `-` | `.kai/engineering/decisions/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/decisions/<id>/` | Markdown, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `reports` | `investigations` | `.kai/engineering/reports/investigations/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/reports/investigations/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
| `engineering` | `reports` | `releases` | `.kai/engineering/reports/releases/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/reports/releases/<id>/` | Markdown, JSON, bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes |
<!-- <<< kai publication table <<< -->

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

Return the validated vocabulary choice to the caller. The shared production
contract owns path derivation, acceptance binding, publication, provenance, and
closure.

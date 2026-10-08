---
name: kai-core-workspace-publication
description: "Use when a core role may retain or publish durable Direction, coordination feature, decision, or report material."
durable-output-producer: false
tools: [read, edit, search]
---

# Core workspace publication

Use this contract immediately before durable core asset production. It is the
only source for the core publication vocabulary. Core does not copy or route
Engineering or Creative vocabularies.

## Canonical vocabulary

| Namespace | Type | Subtype | Private form | Public form | Formats | Publication rule | Privacy rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `core` | `direction` | `-` | `.kai/core/direction/<id>/{drafts,evidence,scratch}` | `docs/kai/DIRECTION.md` | Markdown single file | Named operator authority accepts the exact revision and SHA-256 hash | Private evidence never publishes; retain only the accepted Direction bytes |
| `core` | `features` | `-` | `.kai/core/features/<id>/{drafts,evidence,scratch}` | `docs/kai/core/features/<id>/` | Markdown or bounded Git-suitable bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes; redact sensitive inputs from accepted output |
| `core` | `decisions` | `-` | `.kai/core/decisions/<id>/{drafts,evidence,scratch}` | `docs/kai/core/decisions/<id>/` | Markdown or bounded Git-suitable bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes; decision rationale may publish only as accepted content |
| `core` | `reports` | `-` | `.kai/core/reports/<id>/{drafts,evidence,scratch}` | `docs/kai/core/reports/<id>/` | Markdown, JSON, or bounded Git-suitable bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes; reports contain only approved, minimized evidence |

## Validation and refusal

Before deriving a path, validate namespace, type, subtype, stable ID, lifecycle,
format, target project, and destination ownership against the table.

- Refuse an **unknown type or subtype**. Do not create a fallback directory.
- **Scratch can never publish.**
- **An unaccepted draft can never publish.**
- **Private evidence can never publish.**
- **An arbitrary root can never publish.**
- A path collision, link, junction, nested Git root, namespace mismatch, or
  destination outside the configured project publication root is a refusal.

Return the validated vocabulary choice to the caller. The shared production
contract derives the private path, binds acceptance, mirrors the accepted
revision, records provenance, removes scratch, and archives retained private
material.

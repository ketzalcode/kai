---
name: creative-workspace-publication
description: "Use when a creative role may retain or publish durable design, guidance, decision, report, or media material."
tools: [read, edit, search]
---

# Creative workspace publication

Use this contract immediately before durable creative asset production. It is
the only source for the Creative vocabulary. Feature designs stay with the
feature they serve; reusable design-system or brand guidance is documentation.

## Canonical vocabulary

| Namespace | Type | Subtype | Private form | Public form | Formats | Publication rule | Privacy rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `creative` | `features` | `-` | `.kai/creative/features/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/features/<id>/` | Markdown, HTML, images, or bounded Git-suitable bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes; source captures and rejected alternatives stay private |
| `creative` | `documentation` | `-` | `.kai/creative/documentation/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/documentation/<id>/` | Markdown, HTML, images, or bounded Git-suitable bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes; unpublished brand and user material stay private |
| `creative` | `decisions` | `-` | `.kai/creative/decisions/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/decisions/<id>/` | Markdown, images, or bounded Git-suitable bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes; only accepted rationale and approved examples publish |
| `creative` | `reports` | `-` | `.kai/creative/reports/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/reports/<id>/` | Markdown, JSON, images, or bounded Git-suitable bundle | Named completion authority accepts the exact revision and hash | Private evidence never publishes; raw research and production evidence stay private |
| `creative` | `media` | `-` | `.kai/creative/media/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/media/<id>/` | Git-suitable media or Markdown destination record | Named completion authority accepts the exact revision, hash, and approved durable destination | Private evidence never publishes; large, sensitive, licensed, or unsafe media stays private |

## Validation and refusal

Media publication distinguishes a Git-suitable deliverable from a Markdown
record that references an explicitly approved durable destination. The type
does not make a binary safe to commit.

- Refuse an **unknown type or subtype**. Do not create a fallback lane.
- **Scratch can never publish.**
- **An unaccepted draft can never publish.**
- **Private evidence can never publish.**
- **An arbitrary root can never publish.**
- Refuse an **unsafe media destination**, including an unapproved external
  location, a sensitive or licensed binary, an oversized repository payload,
  or a destination that cannot preserve custody and provenance.
- Refuse a pack/path mismatch, collision, link, junction, nested Git root, or
  destination outside the configured project publication root.

Return the validated vocabulary choice to the caller. The shared production
contract owns path derivation, acceptance binding, publication, provenance, and
closure.

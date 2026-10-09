---
name: kai-core-workspace-publication
description: "Use when a core role may retain or publish durable Direction, coordination feature, decision, or report material."
tools: [read, edit, search]
---

# Core workspace publication

Use this contract immediately before durable core asset production. It is the
only source for the core publication vocabulary. Core does not copy or route
Engineering or Creative vocabularies.

## Canonical vocabulary

Read the package-root `publication.json` declaration for the allowed types,
paths, formats, authority, and privacy rules.

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

Return the validated vocabulary choice to the caller. The shared production
contract derives the private path, binds acceptance, mirrors the accepted
revision, records provenance, removes scratch, and archives retained private
material.

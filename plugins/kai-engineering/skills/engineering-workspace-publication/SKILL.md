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

Read the package-root `publication.json` declaration for the allowed types,
paths, formats, authority, and privacy rules.

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

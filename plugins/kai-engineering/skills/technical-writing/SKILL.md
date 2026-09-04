---
name: technical-writing
description: "Applies audience-centered structures and verification checks for READMEs, concepts, tutorials, how-to guides, technical reference, decision records, release notes, and migration guides. Use when drafting, restructuring, or auditing technical documentation."
tools: [execute, read, edit, search, web]
---

# Technical Writing

Use the smallest document method that matches the reader's job. Do not load all
references.

## Select the document method

- README or repository landing page: read
  [README pattern](references/readme.md).
- Tutorial, how-to guide, setup guide, or troubleshooting page: read
  [task-guide pattern](references/task-guide.md).
- API, CLI, configuration, schema, or lookup documentation: read
  [technical-reference pattern](references/technical-reference.md).
- Conceptual overview or architecture explanation: read
  [concept pattern](references/concept.md).
- Architecture decision record: read
  [decision-record pattern](references/decision-record.md).
- Release notes, changelog entry, or migration guide: read
  [release-documentation pattern](references/release-documentation.md).

If one document mixes several jobs, choose a primary pattern and link to
separate pages for the others. Do not turn one page into a complete
documentation site.

## Shared method

1. Identify the audience, entry context, and outcome the reader needs.
2. Inspect the current document, neighboring pages, repository conventions, and
   product source of truth.
3. Choose the matching pattern above and outline the reader journey before
   drafting.
4. Lead with the most important outcome, then add progressive detail.
5. Use active language, stable terminology, scannable headings, and concrete
   examples.
6. Verify instructions, code, links, versions, platform limits, and expected
   results against current evidence.
7. Remove repetition and route depth to the canonical page that owns it.

## Shared quality bar

- A reader can identify the document's purpose without reading every section.
- Procedures use one clear action per step and state meaningful verification.
- Examples are complete enough to run or are explicitly labeled as fragments.
- Warnings appear before the risky action.
- Acronyms and domain terms are introduced consistently.
- Accessibility does not depend on color, images, or implied visual position.
- Unknown or unverified facts remain visible and block a publish-ready verdict.

Return the updated document or audit findings using the calling agent's
readiness and ownership contract.

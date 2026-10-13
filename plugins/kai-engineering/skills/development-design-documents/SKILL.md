---
name: development-design-documents
description: "Use when creating or materially revising a developer design, technical design, engineering spec, or its Markdown-to-DOCX projection."
tools: [read, search, edit, execute, ask_user, skill]
user-invocable: true
argument-hint: "design topic, source path, or requested output"
publication-entrypoint: engineering-workspace-publication
---

# Development Design Documents

Create a grounded engineering design that helps its readers understand the
problem, current system, proposed behavior, consequential decisions, and proof
required to proceed. Markdown is the content authority; Word is an optional
human-review projection.

## Establish the document job

Identify the primary audience, decision, and expected action before choosing
sections. Read the canonical code, contracts, accepted decisions, applicable
repository instructions, and current authoritative status. Distinguish the
complete effort from current implementation progress.

Apply `research-before-coding` only when unresolved evidence could change the
design. Do not turn ordinary source reading into a separate investigation.

## Include only justified content

Use the smallest structure that lets a cold reader answer:

1. Why is this work needed?
2. What exists today?
3. What is in and out of scope?
4. What changes, and what remains compatible?
5. How will it be validated, rolled out, and rolled back?
6. What is complete today versus still pending?

Useful sections include Summary, Glossary, Goals and non-goals, current system
or storage model, proposed design, validation and rollout, current delivery
state, and references. They are options, not a mandatory template.

- Define unfamiliar domain terms near the beginning.
- Describe the full design before reporting current completion.
- Put volatile current-state tables near the end.
- Prefer domain-level scope over file, class, or interface inventories.
- Use short representative examples when they explain stored data or behavior
  faster than schema detail.
- Remove a section when it repeats the diagram or does not affect a decision.

## Explain the design

Preserve existing terminology and contracts. State defaults, compatibility
boundaries, failure behavior, security/privacy constraints, rollout controls,
and cleanup gates once.

Apply `build-diagrams` when the user requests a diagram or a supported
relationship is materially clearer visually. Choose the diagram for the
relationship:

- sequence for runtime interaction and retries;
- state machine for lifecycle or rollout transitions;
- component/boundary for ownership and dependencies;
- data or block layout for storage and containment.

Keep accessible prose beside the visual. Render Mermaid or HTML before calling
it valid, and fix parser errors instead of pasting unverified source.

## Keep Markdown authoritative

Edit the accepted or requested Markdown first. Generate DOCX, PDF, slides, or
HTML as projections from that revision. Do not maintain two independently
edited design authorities.

When durable Kai publication is requested, apply
`engineering-workspace-publication` immediately before choosing or writing the
typed destination. Publication and enterprise upload are separate actions.

## Produce readable Word documents

When DOCX is requested, load
[Word document defaults](references/word-document-format.md) at the formatting
step. Repository or user requirements override those defaults.

Do not meet a page target by shrinking body text or squeezing diagrams. Remove
repetition, shorten low-value detail, or allow an additional page. A document
for human review must remain comfortable to read.

## Validate and hand off

Validate the actual destination, not only the source:

- headings and section order match the reader's task;
- terms, examples, links, and diagrams are grounded;
- Markdown tables and raw HTML render correctly;
- Mermaid or other diagrams render without errors;
- generated DOCX preserves page size, fonts, hierarchy, tables, links, and
  embedded images;
- enterprise Word shows the expected title, sensitivity, content, and saved
  state.

State the authoritative Markdown path, generated-document link, actual
validation evidence, and any cleanup or publication gap. Never call a draft
accepted or a local file uploaded without observing that result.

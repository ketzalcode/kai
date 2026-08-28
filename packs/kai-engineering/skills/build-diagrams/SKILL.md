---
name: build-diagrams
description: "Shared diagram vocabulary and ASCII-first rules. Use when writing a design, decision, or engineering doc, or a README, needing system, data, flow, state, or topology diagrams."
tools: [view, grep, glob, edit]
---

# Build Diagrams

A dev design that describes structure — a boundary change, a data model,
a request flow, a state machine, a deployment — is far clearer as a
**picture** than as paragraphs of prose. This skill exists so those
pictures are **standardized and familiar**: the same handful of shapes,
drawn the same way, across every engineering artifact. You bring the
domain judgment about *which* diagram the design needs; this skill owns
*how* it's drawn and embedded.

This is the technical counterpart to `ui-mockup`. That skill draws
**UI screens** for product design; this one draws **system and
technical structure** (components, data, flow, state, topology). Don't
use one where the other fits.

## The rule: at least one diagram, ASCII-first

Every dev-design artifact (`design.md`, `decision.md`, and equivalents)
carries **at least one diagram** of its central structure. Draw it with
this format priority:

1. **Default — ASCII, fenced inside the Markdown.** Put the diagram in a
   ` ```text ` block right in the doc. ASCII travels everywhere: it
   renders in every viewer, diffs cleanly line-by-line in review, and
   ships via `git pull` with the artifact. This is the right choice for
   the overwhelming majority of dev-design diagrams.

2. **Richer — `mermaid`, only when ASCII genuinely can't carry it.** If
   the relationships are too dense for ASCII to stay readable (a large
   entity model, a branchy sequence), use a ` ```mermaid ` block —
   Markdown renderers embed it, and it still lives as diffable text in
   the doc. Reach for this as the exception, not the reflex.

3. **Embedded HTML/SVG — only when the artifact is itself HTML.** If the
   design deliverable is an HTML document (not a `.md`), embed the
   diagram as inline SVG or HTML, using `html-block-diagrams` for the
   shapes and the stylesheet. Never emit a separate binary image file as
   the diagram of record for a Markdown design — it doesn't diff and it
   drifts from the text.

Each diagram gets a **one-line caption above it** naming what it shows,
and stays within ~80 columns. One concept per diagram — split rather
than cram.

## Where the diagram lives: surface changes the ceiling, not the default

The priority above was written for **dev-design artifacts**, where the
diagram *is* the record and diffing it is the point. A reader-facing
document is a different job — a `README` is a front door, read once by
someone deciding whether the thing is worth their time. That difference
raises the ceiling on what you may escalate to. It does not lower the
bar for escalating.

| Surface | Default | May escalate to | Never |
| --- | --- | --- | --- |
| `design.md`, `decision.md`, and equivalents | ASCII | `mermaid`, when ASCII genuinely can't stay readable | a binary image as the diagram of record |
| Reader-facing `README.md` and `docs/*.md` | ASCII | `mermaid`, same bar | same |
| An artifact that is itself HTML | inline SVG/HTML | — | — |

**ASCII stays the default everywhere**, including the front door. It is
the only format that renders for someone reading the repository in a
terminal, in a plain editor, or through a screen reader, and it is the
one a diff can review. Reach past it for the same reason in a `README`
as in a design: the relationships stopped fitting, not that a rendered
picture would look nicer.

Three findings this ruling rests on, recorded so they don't get
re-litigated from memory:

- **HTML + CSS does not render on GitHub.** Rendered Markdown is
  sanitized: `style`, `class`, and `id` attributes are stripped, as are
  `<style>`, `<script>`, and `<iframe>`. A `<div style="...">` arrives
  as a bare `<div>`, so the approach `ui-mockup` uses for local HTML
  artifacts degrades to unstyled markup if transplanted into a
  repository document. This is the one option that fails silently — it
  looks correct in the source file.
- **`mermaid` renders natively on GitHub** and stays diffable text in
  the file, which is why it is the escalation and a screenshot is not.
  It does *not* render in a terminal or a plain editor, which is why it
  is not the default.
- **A binary diagram costs more than it appears to.** It can't be
  reviewed in a diff, goes stale the moment the thing it depicts changes
  with nothing to detect that, needs a second copy behind `<picture>`
  for dark mode, and its alt text is usually a summary standing in for
  content a reader can't reach.

### The one carve-out: evidence is not a diagram

A **product screenshot, demo recording, or captured terminal frame** is
allowed in reader-facing documents. It is not covered by the ban above,
because it isn't a diagram of record — it depicts a real run that
happened, rather than claiming to be the authoritative description of a
structure. It carries the opposite risk (staleness against a shipped
product), which belongs to whoever owns that surface. Keep the two
straight: if it is showing *what the software did*, it is evidence; if
it is showing *how the system is shaped*, it is a diagram, and the table
above applies.

## The catalog: pick the shape that fits the design

Choose from this standard set. These are the familiar shapes; reusing
them (rather than inventing a layout per doc) is the whole point.

### Component / boundary — *system shape and seams*

Boxes are components; labeled arrows are calls or dependencies. Use it to
show what talks to what and where the boundary you're changing sits.

```text
        ┌─────────────┐   POST /orders   ┌──────────────┐
  Web ─►│  API gateway │ ───────────────► │ Order service│
        └─────────────┘                   └──────┬───────┘
                                                 │ writes
                                                 ▼
                                          ┌──────────────┐
                                          │  orders  DB  │
                                          └──────────────┘
```

### Sequence / flow — *interaction over time*

Actors are columns; time runs downward; arrows are messages. Use it for
request/response ordering, event propagation, retries, and failure paths.

```text
  Client        API          Worker        Queue
    │  request    │             │            │
    │────────────►│  enqueue    │            │
    │             │─────────────────────────►│
    │  202        │             │  dequeue   │
    │◄────────────│             │◄───────────│
    │             │             │  process   │
```

### Data model (ER) — *entities and relationships*

Entities are boxes; connectors carry **cardinality** (`1──*`, `*──*`).
Use it for schema and migration designs.

```text
  ┌──────────┐            ┌───────────┐           ┌──────────┐
  │  User    │ 1        * │  Order    │ 1       * │ LineItem │
  │──────────│───────────│───────────│───────────│──────────│
  │ id (PK)  │  places    │ id (PK)   │  contains │ id (PK)  │
  │ email    │            │ user_id FK│           │ order_id │
  └──────────┘            └───────────┘           └──────────┘
```

### State machine — *lifecycle and transitions*

States are nodes; labeled arrows are transitions. Use it for anything
with a status field or a workflow lifecycle.

```text
  [draft] ──submit──► [in-review] ──approve──► [released]
     ▲                     │
     └──────reject─────────┘
```

### Deployment / topology — *where things run*

Nodes, zones, and networks. Use it for infra designs — instances,
subnets, availability zones, managed services, trust boundaries.

```text
  ┌── VPC ──────────────────────────────────────────┐
  │  ┌── public subnet ──┐   ┌── private subnet ──┐  │
  │  │      ALB          │──►│  app  x2 (ASG)      │  │
  │  └───────────────────┘   └─────────┬──────────┘  │
  │                                     ▼             │
  │                            ┌──────────────┐       │
  │                            │  RDS (multi- │       │
  │                            │  AZ, private)│       │
  │                            └──────────────┘       │
  └──────────────────────────────────────────────────┘
```

### Tree / hierarchy — *containment and structure*

Indented tree. Use it for component trees, module layouts, and
call/ownership hierarchies.

```text
  <App>
  ├─ <Header>
  ├─ <OrderList>
  │  ├─ <OrderRow>        state: selected
  │  └─ <EmptyState>
  └─ <Footer>
```

## ASCII conventions (so every diagram reads the same)

- **Boxes:** box-drawing `┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼`; plain `+-- | ` is an
  acceptable fallback where box-drawing is awkward. Don't mix both in one
  diagram.
- **Arrows:** directed `──►` / `─►` / `▼ ▲ ◄`; a plain `───` line for an
  undirected association. Label the arrow with the call, event, or verb
  when it isn't obvious. Use the *pointer* glyphs `U+25BA` / `U+25C4`,
  not the triangles `U+25B6` / `U+25C0` — the triangles are emoji bases,
  so some fonts and terminals render them double-width and every column
  to their right shifts.
- **Cardinality (ER):** put `1` and `*` at the ends of the connector
  (`1──*` one-to-many, `*──*` many-to-many).
- **Emphasis:** a state or note rides beside a node as `state: selected`,
  not as a second box.
- **Width:** keep it ≤ ~80 columns so it never wraps in a diff or a
  narrow viewer.

## Anti-patterns

- ❌ **Prose-only structure.** Describing a boundary or data model in
  paragraphs when one diagram from the catalog would make it obvious.
- ❌ **A binary image as the diagram of record** for any Markdown
  document, front-door `README` included — it doesn't diff and drifts
  from the text. ASCII or `mermaid` instead.
- ❌ **HTML + CSS in a Markdown document.** GitHub strips the styling
  and renders it as unstyled markup — the failure is silent, because the
  source file still looks right.
- ❌ **Inventing a bespoke layout** when a catalog shape fits. The value
  is that reviewers recognize the shape instantly.
- ❌ **One mega-diagram** that fuses components, data, and sequence.
  Split into one-concept diagrams.
- ❌ **Reaching for `mermaid`/SVG by reflex.** ASCII first; escalate only
  when ASCII genuinely can't stay readable.

# Technical diagram catalog

Use this reference after `build-diagrams` has established that a visual is
requested or adds information. The catalog helps select a representation; it
does not require a diagram.

## Format by destination

| Destination | Useful representation | Practical reason |
| --- | --- | --- |
| Terminal, plain text, or renderer-independent Markdown | Terminal-readable text | The relationship is visible directly in source and terminal output. |
| Markdown with Mermaid support | Mermaid | Dense graphs and sequences can remain editable text while the destination supplies rendering. |
| HTML artifact | Inline SVG or HTML | The diagram can share the artifact's layout and styling when that destination supports it. |

An explicit requested format or applicable repository convention takes
precedence when the destination supports it. If rendering was not exercised,
describe the result as source, not as a successfully rendered diagram.

## Component / boundary

Use for components, calls, dependencies, trust boundaries, and seams.

```text
        ┌─────────────┐   POST /orders   ┌───────────────┐
  Web ─►│ API gateway │ ────────────────►│ Order service │
        └─────────────┘                  └───────┬───────┘
                                                │ writes
                                                ▼
                                        ┌───────────────┐
                                        │  orders DB    │
                                        └───────────────┘
```

## Sequence / flow

Use when ordering, messages, retries, or failure paths matter.

```text
  Client        API          Worker        Queue
    │  request    │             │            │
    │────────────►│  enqueue    │            │
    │             │─────────────────────────►│
    │  202        │             │  dequeue   │
    │◄────────────│             │◄───────────│
    │             │             │  process   │
```

## Data model

Use for entities and established cardinality. Label keys only when they matter
to the relationship being communicated.

```text
  ┌──────────┐            ┌───────────┐           ┌──────────┐
  │  User    │ 1        * │  Order    │ 1       * │ LineItem │
  │──────────│────────────│───────────│───────────│──────────│
  │ id (PK)  │  places    │ id (PK)   │ contains  │ id (PK)  │
  │ email    │            │ user_id FK│           │ order_id │
  └──────────┘            └───────────┘           └──────────┘
```

## State machine

Use for known states and labeled transitions.

```text
  [draft] ──submit──► [in-review] ──approve──► [released]
     ▲                     │
     └──────reject─────────┘
```

## Deployment / topology

Use for nodes, zones, networks, managed services, and trust boundaries.

```text
  ┌── VPC ──────────────────────────────────────────┐
  │  ┌── public subnet ──┐   ┌── private subnet ─┐ │
  │  │       ALB         │──►│   app x2 (ASG)    │ │
  │  └───────────────────┘   └─────────┬─────────┘ │
  │                                     ▼           │
  │                            ┌──────────────┐     │
  │                            │ RDS private  │     │
  │                            └──────────────┘     │
  └─────────────────────────────────────────────────┘
```

## Tree / hierarchy

Use for containment, module structure, component trees, or ownership
hierarchies.

```text
  <App>
  ├─ <Header>
  ├─ <OrderList>
  │  ├─ <OrderRow>        state: selected
  │  └─ <EmptyState>
  └─ <Footer>
```

## Text conventions

- Use one box style consistently. Box-drawing characters work well where the
  chosen font supports them; `+-- |` is a practical fallback.
- Use directed arrows for calls or transitions and plain connectors for
  undirected associations.
- Put `1` and `*` at connector ends when cardinality is established.
- Label an edge with the call, event, or transition when direction alone is
  insufficient.
- Keep the source within the destination's practical width. Prefer a second
  focused view to a dense diagram that wraps or obscures its relationship.
- Some terminals render emoji-capable triangle glyphs at unexpected widths.
  Plain arrows or pointer glyphs are safer when column alignment matters.

## Mermaid and HTML

Mermaid is useful when the requested Markdown destination supports it and the
relationship is easier to maintain in graph syntax. An explicit Mermaid
request is sufficient reason to use it. Keep node and edge names grounded in
the same evidence as a text diagram.

Inline SVG or HTML fits an HTML deliverable when its destination supports the
markup and styling. Do not assume the same markup will behave identically when
copied into Markdown; repository hosts and sanitizers differ.

## Evidence is different

A screenshot, recording, or captured terminal frame shows what a real
interface or run displayed. A structural diagram communicates a relationship.
Treat the former as evidence with its own freshness and publication rules, not
as a substitute for an unsupported system model.

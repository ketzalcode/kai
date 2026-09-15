---
name: html-block-diagrams
description: "Use when a structural block diagram is requested for an HTML or image destination, or an established relationship would be materially clearer in that form."
user-invocable: true
---

# HTML Block Diagrams

Represent established relationships with layers, lanes, a linear sequence,
containment, or comparison. This is structural communication, not a UI mock,
architecture decision, or reason to create another document.

## Decide whether the diagram adds value

An explicit structural-diagram request earns the supported visual. Otherwise
draw only when the relationship materially improves the existing artifact.
If prose is already clear and sufficient, return no diagram and let the caller
continue its independently requested work.

A branching graph with routed edges is outside this block-layout method.
State the format limit and use an authorized destination-supported alternative;
do not silently introduce a renderer dependency. CSS-based markup is not a
usable GitHub Markdown diagram because its styles/classes are stripped.

Engineering's `build-diagrams` is an optional neighbor, not a prerequisite.
No product, marketing, assistant, or engineering agent must run first when
adequate structure and visual constraints are supplied.

## Inputs and representation

Consume established entities and relationships, supplied labels, destination
and dimensions, and any approved visual constraints. Example palettes,
statuses, and paths are not subject facts or brand evidence.

Use only meaningful fields. A component name and its supplied description can
be the entire card. Missing status, ownership detail, or artifact paths remain
unknown; they are not template slots to fill.

| Relationship | Representation |
| --- | --- |
| Ordered tiers | Layers |
| Ownership groups | Lanes and cards |
| Linear ordering | Pipeline |
| Containment | Nested boundaries |
| Two supported sides of a distinction | Compare |

Load `references/catalog.md` when a selected arrangement needs detailed CSS
or markup. It is progressively loaded craft, not a quota or an instruction to
copy the entire stylesheet.

## Produce and stop

Keep output offline and self-contained: semantic HTML, inline CSS, and no
external assets or scripts. Preserve captions and semantics; mark decorative
connector elements `aria-hidden`. Include only evidenced nodes, grouping,
direction, or boundaries.

Long-label wrapping and narrow layouts need inspection at the actual target
size. Grid and flex do not certify that a new diagram fits. Check declared
custom properties, text wrapping, relevant color schemes and contrast before
claiming visual readiness.

Return arrangement context, the requested diagram source/contribution, or no
addition. An unsupported requested artifact is a named gap, not a successful
no-diagram result. Report actual inspection status: HTML source is not an
exported image, and unrendered markup is not a visual-validation result.

The calling author, designer, or image producer retains its own destination,
workspace, acceptance and publication obligations. Stop at the diagram
contribution; do not add a UI prototype, invent architecture, or start another
capability workflow.

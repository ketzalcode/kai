---
name: build-diagrams
description: "Use when the user explicitly requests a diagram, or when an authorized artifact contains a supported system, data, flow, state, topology, or hierarchy relationship that would be clearer visually."
tools: [read, search, edit]
---

# Build Diagrams

Represent established technical relationships in a form suited to the
destination. The result may be a diagram or no diagram; this skill does not
decide whether the caller's independently requested document or prose should
exist.

## Decide whether to draw

Draw when either condition is true:

- the user explicitly requests a diagram; or
- a supported relationship is relevant to the artifact and a visual adds
  information that prose alone does not communicate as clearly.

A supported relationship is grounded in the request, repository evidence, or
an accepted design decision: components and calls, ordering, cardinality,
state transitions, deployment boundaries, or hierarchy. Do not invent a
relationship or architecture to make a picture.

If no visual adds value and none was requested, return no diagram. The caller
continues its independently authorized prose, analysis, decision, design, or
other artifact without one. A no-diagram result is not a reason to cancel or
shorten that work.

Captured screenshots, recordings, and terminal frames are evidence of a run
or interface. They are not structural diagrams and do not activate this skill
by themselves.

## Choose the destination and format

The requested format takes precedence where the destination supports it.
Repository constraints take precedence where the destination supports them.
If a requested format is unsupported, state the limitation and use or offer a
supported alternative instead of silently changing formats.

- Use terminal-readable text for a terminal, plain-text file, or Markdown that
  must remain understandable without a diagram renderer.
- Use Mermaid in Markdown when explicitly requested, or when its supported
  renderer and syntax make a dense relationship clearer than text.
- Use inline SVG or HTML when the artifact itself is HTML and its destination
  supports that representation.
- Follow a repository's established diagram convention when it is compatible
  with the requested destination and format.

No format is universal. Preserve the practical distinction between readable
source and rendered output. Do not claim that Mermaid, SVG, or HTML rendered
successfully unless that renderer was actually exercised.

## Draw only what is known

1. Name the relationship the diagram communicates.
2. Select a fitting shape from [the diagram catalog](references/catalog.md).
3. Include only evidenced nodes, boundaries, states, and edges.
4. Label calls, transitions, direction, or cardinality where the meaning would
   otherwise be ambiguous.
5. Keep one coherent relationship per diagram; split only when separate views
   each add useful information.
6. Place the result where the requested artifact or repository convention
   expects it.

Load `references/catalog.md` when choosing a shape or format. The catalog is
reference material, not an obligation to add a visual or to use every shape.

## Output

Return one of:

- diagram source embedded in, or ready for, the requested destination; or
- a brief no-diagram result when the relationship is absent, unsupported, or
  already clearer in prose.

Keep unknowns explicit. Never add components, dependencies, transitions,
cardinality, topology, or renderer validation that the available evidence
does not establish.

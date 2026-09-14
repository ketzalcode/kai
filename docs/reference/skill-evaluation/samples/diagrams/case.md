# Decision-note representation case

## Task

Write the short `decision.md` content for the already-agreed encoding decision
below, using any attached diagram guidance where applicable. Produce the
document itself.

## Decision facts

- Internal text reports remain UTF-8.
- Existing readers already consume UTF-8.
- No module boundary, API, data-flow, topology, state transition, or deployment
  relationship changes.
- The reason is to preserve compatibility and avoid unnecessary conversion.
- No implementation, benchmark, new dependency, or format migration is needed.
- The reader needs the decision and its rationale, not a repository map.

Do not invent components, call paths or system relationships. Do not claim
implementation or validation happened. Return only the requested Markdown
decision content.

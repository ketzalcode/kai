# Decision: Keep internal text reports in UTF-8

Internal text reports remain UTF-8.
Existing readers already consume UTF-8, so changing the encoding would add
conversion work without improving compatibility.

## Rationale

- Preserves compatibility with current readers.
- Avoids unnecessary conversion.
- No module boundary, API, data-flow, topology, state transition, or deployment
  relationship changes.
- No implementation, benchmark, new dependency, or format migration is needed.

## Decision note

This is a compatibility decision only. The reader needs the decision and its
rationale, not a repository map.

# Decision: Keep internal text reports in UTF-8

## Decision

Internal text reports remain UTF-8.

## Rationale

This preserves compatibility with existing readers and avoids unnecessary
conversion.

## Impact

- Existing readers already consume UTF-8.
- No module boundary, API, data-flow, topology, state transition, or
  deployment relationship changes are needed.
- No implementation, benchmark, new dependency, or format migration is needed.
- The decision is the encoding choice and its rationale only; no repository
  map is required.

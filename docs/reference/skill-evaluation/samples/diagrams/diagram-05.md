# Decision: Keep internal text reports in UTF-8

## Status
Agreed

## Decision
Internal text reports will remain UTF-8.

## Rationale
- Existing readers already consume UTF-8.
- Preserving UTF-8 avoids unnecessary conversion.
- This keeps compatibility without changing any module boundary, API, data flow, topology, state transition, or deployment relationship.

## Consequences
- No implementation is needed.
- No benchmark, new dependency, or format migration is needed.
- The decision is limited to the encoding choice and its rationale.

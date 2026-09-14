# Decision

Internal text reports remain UTF-8.

## Rationale

- Existing readers already consume UTF-8.
- This preserves compatibility and avoids unnecessary conversion.
- No module boundary, API, data-flow, topology, state transition, or deployment relationship changes are involved.
- No implementation, benchmark, new dependency, or format migration is needed.
- The decision is the encoding choice and its rationale, not a repository map.

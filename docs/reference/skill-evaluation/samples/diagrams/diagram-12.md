# Decision: Keep internal text reports in UTF-8

## Decision

Internal text reports remain UTF-8.

## Rationale

- Existing readers already consume UTF-8.
- This preserves compatibility.
- It avoids unnecessary conversion.
- No module boundary, API, data-flow, topology, state transition, or deployment relationship changes are involved.

## Scope

This is a format decision only. No implementation, benchmark, new dependency, or format migration is needed.

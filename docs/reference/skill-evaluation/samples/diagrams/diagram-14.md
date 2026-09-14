# Decision: Keep internal text reports in UTF-8

## Decision

Internal text reports will remain UTF-8.

## Rationale

- Existing readers already consume UTF-8.
- Keeping the current encoding preserves compatibility.
- It avoids unnecessary conversion work.
- No module boundary, API, data-flow, topology, state transition, or deployment relationship changes are needed.

## Scope

This is a decision about encoding only. It does not introduce a format migration, new dependency, implementation work, or benchmark requirement.

## Result

The reader needs the decision and its rationale, not a repository map.

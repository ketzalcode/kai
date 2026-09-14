# Decision: Keep internal text reports in UTF-8

## Decision

Internal text reports remain UTF-8.

## Rationale

- Existing readers already consume UTF-8.
- This preserves compatibility.
- It avoids unnecessary conversion.

## Impact

- No module boundary changes.
- No API changes.
- No data-flow changes.
- No topology changes.
- No state transition changes.
- No deployment relationship changes.
- No implementation is needed.
- No benchmark is needed.
- No new dependency is needed.
- No format migration is needed.

## Note

The reader needs this decision and its rationale, not a repository map.

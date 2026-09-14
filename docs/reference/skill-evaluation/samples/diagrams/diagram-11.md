# Decision: Keep internal text reports in UTF-8

## Decision

Internal text reports will remain UTF-8.

## Rationale

- Existing readers already consume UTF-8.
- Keeping UTF-8 preserves compatibility.
- This avoids unnecessary conversion.

## Scope

- No module boundary changes.
- No API changes.
- No data-flow changes.
- No topology changes.
- No state-transition changes.
- No deployment-relationship changes.

## Consequences

- No implementation is needed.
- No benchmark is needed.
- No new dependency is needed.
- No format migration is needed.

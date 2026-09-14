# Decision: Keep internal text reports in UTF-8

## Decision

Internal text reports remain UTF-8.

## Why

- Existing readers already consume UTF-8.
- Keeping the current encoding preserves compatibility.
- It avoids unnecessary conversion work.

## Scope

- No module boundary changes.
- No API changes.
- No data-flow changes.
- No topology changes.
- No state-transition changes.
- No deployment changes.

## Not needed

- No implementation work is required for this decision.
- No benchmark is required.
- No new dependency is required.
- No format migration is required.

## Diagram

Internal text reports and readers stay on the current encoding.

```text
  [Internal text reports] ── UTF-8 ──► [Existing readers]
```

## Rationale

The decision keeps the current behavior stable. The reader needs the
decision and its rationale, not a repository map.

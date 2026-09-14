# Decision: Keep internal text reports as UTF-8

## Decision

Internal text reports remain UTF-8.

## Why

- Existing readers already consume UTF-8.
- This preserves compatibility.
- It avoids unnecessary conversion.
- No module boundary, API, data-flow, topology, state transition, or
  deployment relationship changes are needed.
- No implementation, benchmark, new dependency, or format migration is needed.

## Compatibility view

```text
┌─────────────────────────┐   UTF-8   ┌─────────────────────────┐
│ Internal text reports   │──────────►│ Existing readers        │
│ remain UTF-8            │           │ already consume UTF-8   │
└─────────────────────────┘           └─────────────────────────┘
```

## Outcome

Keep the encoding as-is and document the compatibility rationale.

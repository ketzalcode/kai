# Decision: Keep internal text reports UTF-8

Internal text reports remain UTF-8.
Existing readers already consume UTF-8.
This preserves compatibility and avoids unnecessary conversion.
No module boundary, API, data-flow, topology, state transition, or deployment
relationship changes are part of this decision.
No implementation, benchmark, new dependency, or format migration is needed.

Decision summary:

```text
  ┌──────────────────────┐    UTF-8    ┌──────────────────────┐
  │ Internal text reports │───────────►│ Existing readers      │
  └──────────────────────┘             └──────────────────────┘
            ▲
            └─ preserve compatibility; avoid unnecessary conversion
```

Rationale:

- Keep the current encoding to match what readers already consume.
- Avoid introducing conversion work that does not change behavior.
- No other system relationships are affected.

This decision records the encoding choice and its rationale only.

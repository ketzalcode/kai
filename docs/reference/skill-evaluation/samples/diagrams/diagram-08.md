# Encoding decision

We will keep internal text reports in UTF-8.

## Decision

The encoding stays UTF-8 for internal text reports and for the readers that
already consume them.

## Rationale

- This preserves compatibility with existing readers.
- It avoids unnecessary conversion work.
- No module boundary, API, data-flow, topology, state transition, or
  deployment relationship changes are needed.

## Scope

This is a decision about encoding only. No implementation, benchmark, new
dependency, or format migration is required.

## Decision flow

What stays the same and why this is the right choice.

```text
  Internal text reports ──UTF-8──► Existing readers
           │                           │
           └──── keep compatibility ───┘
                      │
                      └── no conversion needed
```

The reader needs the decision and its rationale, not a repository map.

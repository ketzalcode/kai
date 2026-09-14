# Encoding decision

Internal text reports remain UTF-8.

```text
Internal text reports ──UTF-8──► Existing readers
           │
           └── compatibility preserved; no conversion needed
```

## Decision

Keep internal text reports in UTF-8.

## Rationale

- Existing readers already consume UTF-8.
- Preserving UTF-8 avoids unnecessary conversion.
- This keeps compatibility intact.

## Scope

- No module boundary changes.
- No API changes.
- No data-flow changes.
- No topology changes.
- No state-transition changes.
- No deployment changes.

## What is not needed

- No implementation work.
- No benchmark.
- No new dependency.
- No format migration.

## Result

The decision is to preserve the current UTF-8 encoding for internal text
reports.

---
name: backend-coding-standards
description: "Use with coding-standards when implementing or refactoring APIs, services, persistence, jobs, libraries, or server-side behavior."
tools: [read, search, edit]
---

# Backend Coding Standards

Apply only the rules relevant to the requested server-side behavior. Follow the
repository's API, service, data, and operational conventions rather than
introducing another architecture.

## Rules

- Preserve established request, response, absence, and error contracts. Validate
  at the owned boundary and never turn a failed operation into a successful
  response shape.
- Enforce authentication, authorization, tenant, and data-access decisions on
  the trusted side of the boundary. Reuse the repository's identity and policy
  mechanisms instead of duplicating them.
- Make transaction, concurrency, idempotency, timeout, retry, and cancellation
  behavior explicit when the operation can encounter them. Retries are bounded
  and limited to safe operations.
- Keep persistence aligned with real access patterns, constraints, ownership,
  and migration compatibility. Avoid unbounded reads and hidden per-item calls.
- Keep service and dependency boundaries narrow. Separate transport details
  from domain decisions when callers should not own both.
- Emit concise, structured, single-line logs with stable operation names and
  queryable fields. Never expose credentials, secrets, tokens, or personal
  data.
- Treat existing telemetry as a compatibility contract. For new observability,
  follow repository patterns and add only signals that support a concrete
  operational question.
- Surface operational failures explicitly. Do not silently continue after lost
  writes, partial processing, exhausted retries, or invalid state.

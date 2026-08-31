# Design — CSV export endpoint

Owner: `principal-swe-backend`. Bound to item `csv-export-api`.
Implements the streaming choice recorded in `decision.md`.

## Surface

```
GET /reports/{id}/export.csv
  200  text/csv; charset=utf-8   (chunked)
  403  caller cannot read the report
  404  report does not exist for this caller
  409  an export for this report is already in flight for this actor
```

No new user-facing UI is introduced here — the surface is consumed by
`csv-export-ui`, which carries its own design artifact and design-conformance
review.

## Streaming model

The handler opens a server-side cursor and writes rows to the response as they
arrive. Nothing accumulates: one row buffer, flushed per chunk. Memory is a
function of row width, not row count, which is what makes the 1M-row acceptance
criterion reachable under the gateway timeout.

Backpressure follows the HTTP write; if the client stalls, the cursor stalls.
A dropped connection cancels the cursor rather than draining it.

## Authorization

Row-level authorization reuses the report's own read policy, evaluated
server-side per row. There is deliberately no query parameter that can widen the
result set — the export sees exactly what the report view would show the same
actor. This is the property the security review verified.

## Audit

Every attempt writes one audit record with actor, report id, row count, and
outcome — including failed and cancelled exports, so a partial read is not
invisible.

## Rejected

- **Pre-generated files in object storage** — see `decision.md`. Adds a storage
  lifecycle, a signed-URL surface, and a cleanup job for no measured benefit.
- **Recurring scheduled exports** — out of scope by the PM's own scoping; routed
  to `csv-export-scheduling` as a proposal rather than built opportunistically.

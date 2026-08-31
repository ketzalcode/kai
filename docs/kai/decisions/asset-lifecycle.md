---
asset_id: kai-universal-asset-lifecycle
asset_class: architecture-decision
item: asset-lifecycle-contract-release
title: Universal asset lifecycle
produced_by: principal-swe-infra
created: 2026-08-28
revision: 3
disposition:
  status: published
  reason: Accepted lifecycle contract updated for workspace schema 3
completion:
  authority: principal-product-manager
  verdict: accepted
  at: 2026-08-28
  revision_at_verdict: 3
validity:
  status: current
  owner: principal-product-manager
  as_of: 2026-08-31
  revalidate_by: null
---

# Decision: execution and asset lifecycle are independent

Kai represents generated work through four independent axes:

```text
execution   -> work-item lifecycle
disposition -> scratch, draft, working, published, archived, retracted, discarded
validity    -> unknown, provisional, current, stale, expired, superseded,
               invalidated, retired
closure     -> initiative lifecycle plus work, asset, backlog, and ownership sweeps
```

A completed or shipped work item remains terminal when an asset later becomes
stale or superseded. Revalidation and replacement are new work.

Private working material stays under `.kai/`. A durable project artifact becomes
`published` only after the named completion authority accepts that exact
revision and it is intentionally written to the target project's configured
publication root. Producers do not self-accept team-facing publications.

Initiative closure requires:

1. Every required item reached its declared terminal state.
2. Every required asset has a known disposition and validity.
3. Every backlog entry was promoted, carried, parked, or dropped with a reason.
4. Every maintained current asset has an owner and revalidation trigger.
5. The initiative leaves `ACTIVE.md` but remains findable in the initiative
   index or archive.

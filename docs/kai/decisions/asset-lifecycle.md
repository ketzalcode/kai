---
asset_id: kai-universal-asset-lifecycle
asset_class: architecture-decision
subject: core:task:asset-lifecycle-contract-release
title: Universal asset lifecycle
produced_by: principal-swe-infra
created: 2026-08-28
revision: 4
disposition:
  status: published
  reason: Accepted lifecycle contract updated for workspace schema 5
completion:
  authority: operator
  verdict: accepted
  at: 2026-08-28
  revision_at_verdict: 4
validity:
  status: current
  owner: kai-core
  as_of: 2026-10-07
  revalidate_by: null
---

# Decision: execution and asset lifecycle are independent

Kai represents generated work through four independent axes:

```text
execution   -> typed Task lifecycle
disposition -> scratch, draft, working, published, archived, retracted, discarded
validity    -> unknown, provisional, current, stale, expired, superseded,
               invalidated, retired
closure     -> typed hierarchy closure plus artifact, asset, and ownership checks
```

A completed or shipped Task remains terminal when an asset later becomes stale
or superseded. Revalidation and replacement require a new authorized Task.

Private working material stays in its pack-owned typed path under `.kai/`.
SQLite at `.kai/core/runtime/coordination.sqlite` is the only coordination and
acceptance authority.

A durable Kai report or publication requires:

1. an existing typed Epic, Feature, Requirement, or Task subject;
2. that subject's current version and an authorized artifact target;
3. current acting authority for `artifact.register`;
4. a mutable private revision under the owning pack's publication contract;
5. named acceptance authority bound to the exact revision and SHA-256 hash;
6. a mirrored public destination allowed by that same pack contract.

Direct work may return inline or repository-native output, but it cannot mint a
hierarchy subject or register a durable Kai artifact merely to preserve an
answer. Producers do not self-accept team-facing publications.

Typed parent closure requires every required child at its accepted terminal
state and version, every required asset at a known disposition and validity,
and every maintained current asset to name a validity owner and revalidation
trigger. Closure never depends on a Markdown board, backlog, milestone, thread,
or index.

---
asset_id: kai-universal-asset-lifecycle
asset_class: architecture-decision
title: Universal asset lifecycle
item: asset-lifecycle-contract-release
initiative: asset-lifecycle-contract
produced_by: principal-swe-infra
created: 2026-08-28
revision: 1
disposition:
  status: working
  reason: Implementation is in progress and exact-revision acceptance is pending.
completion:
  authority: principal-product-manager
  verdict: pending
  at: null
  revision_at_verdict: null
validity:
  status: provisional
  owner: principal-product-manager
  as_of: 2026-08-28
  revalidate_by: null
  basis:
    - Operator-approved proposal on 2026-08-28
    - Superpowers v6.3.0 evidence-before-completion and temporary-ledger behavior
    - OpenSpec v1.11 change-to-current-source promotion
    - Beads v1.2.2 graph and supersession behavior
    - Backstage singular ownership
    - MADR, adr-tools, and Log4brains decision supersession
    - dbt-core v1.12 freshness thresholds
supersedes: null
superseded_by: null
evidence:
  - kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md
---

# Decision: separate work execution from asset lifecycle

## Decision

Kai represents generated work through four independent axes:

```text
execution   -> work-item lifecycle
disposition -> scratch, draft, working, published, archived, retracted, discarded
validity    -> unknown, provisional, current, stale, expired, superseded,
               invalidated, retired
closure     -> initiative lifecycle plus work, asset, backlog, and ownership sweeps
```

A completed or shipped work item remains terminal when an asset later becomes
stale or superseded. Revalidation and replacement are new work. Every agent
loads one shared `kai-core-asset-lifecycle` contract and must either declare an
owed artifact before dispatch or explicitly record why none is owed.

## Why

The former model overloaded work-item completion. It could not answer whether a
report still existed, was accepted, remained current, was temporary, or had
been replaced. Reopening old work to express changing truth destroys execution
history. Treating every generated file as current destroys operator trust.

## Consequences

- New items use plural `artifact_targets` plus expectation, durability,
  authority, and validity-owner fields.
- Durable assets carry stable IDs, revision, disposition, completion, validity,
  evidence, and bidirectional supersession metadata.
- Only `validity.status: current` appears as unqualified current guidance.
- Initiative closure reconciles assets and backlog, not only milestone items.
- Legacy records begin `unknown`; tooling rolls out warn, reconcile, then error.
- The workspace doctor guarantees detectability, not filesystem atomicity.
- Workspace schema remains version 2 in this release because enforcement and
  scaffold migration have not landed; legacy records remain readable as
  `unknown` during the staged rollout.

## Rejected alternatives

- **One larger work-item lifecycle:** conflates execution history with changing
  external truth.
- **Free-text close reasons only:** not queryable or mechanically enforceable.
- **Producer self-acceptance:** removes the independent authority needed for a
  durable asset to become current.
- **Delete replaced or wrong assets:** erases provenance and makes historical
  decisions impossible to reconstruct.

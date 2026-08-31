---
type: initiative
title: Universal asset lifecycle contract
slug: asset-lifecycle-contract
status: active
horizon: 2026-Q4
mission: Make every kai-generated asset classifiable, findable, and honest about whether it is accepted, current, stale, superseded, historical, or temporary.
vision: Work completion, artifact disposition, artifact validity, and initiative closure are separate state machines, enforced consistently across every kai role and workspace.
workspace:
  mode: repository
  root: "."
  run_root: ".kai/runs"
  manifest: ".kai/manifest.json"
scope:
  repos: []
  targets:
    - agents/
    - skills/kai-core-asset-lifecycle/SKILL.md
    - skills/kai-core-team-operating-rules/SKILL.md
    - skills/kai-core-work-coordination/SKILL.md
    - skills/kai-core-workspace-conventions/SKILL.md
    - skills/kai-core-initiative-stewardship/SKILL.md
    - skills/kai-core-definition-of-done/SKILL.md
    - scripts/validate-plugin.mjs
    - scripts/workspace-doctor.mjs
    - scripts/generate-catalog.mjs
    - workspace scaffolds and fixtures
  keywords:
    - asset
    - lifecycle
    - validity
    - disposition
    - supersession
    - freshness
    - completion
    - closure
  current:
    - contract-bound
    - enforcement-observable
    - migration-complete
  out_of_scope:
    - Canonical mock file, screenshot, and local-server behavior, owned by the workspace design-output item.
    - Moving schema-2 coordination paths to the ratified `.kai/state/` and `.kai/archive/` target.
    - Changing the nine-plugin topology or marketplace identity.
  deferred:
    - Domain-specific lifecycle extensions beyond the universal core fields require evidence that the shared vocabulary cannot represent the case.
principles:
  non_negotiable:
    - "A run may produce no durable asset; it may never leave an unclassified one."
    - "Work-item execution state and asset validity are independent."
    - "Only a current asset may be presented as unqualified current guidance."
    - "A material conclusion change creates a successor with bidirectional links; it is not a silent revision."
    - "Legacy assets begin unknown and earn current through revalidation."
proposal_channel: kai/initiatives/asset-lifecycle-contract/backlog.md
created: 2026-08-28
owner: principal-product-manager
related: [workspace-corpus-contract]
success_measures:
  - measure: Every shipped agent loads one universal asset-lifecycle contract.
    baseline: No shared lifecycle contract; completion is represented only by work-item and initiative states.
    target: 56 of 56 agents inherit kai-core-asset-lifecycle and validation rejects omissions.
  - measure: Incomplete asset close operations are mechanically visible.
    baseline: The doctor validates artifact paths but not expectation, metadata, validity, freshness, or supersession.
    target: Doctor warnings cover every new lifecycle field and relationship before enforcement becomes blocking.
  - measure: Existing assets and initiatives can be reconciled without being guessed current.
    baseline: Existing durable files have heterogeneous metadata and no universal validity state.
    target: Migration inventory classifies legacy assets unknown, assigns owners and dispositions, and closes or carries each initiative outcome.
milestones:
  - id: contract-bound
    outcome: The universal lifecycle vocabulary is shipped and loaded by every kai agent, with bounded amendments to coordination, workspace, stewardship, and production-completion contracts.
    acceptance:
      - A dedicated kai-core-asset-lifecycle skill defines execution, disposition, validity, closure, metadata, authority, freshness, supersession, and migration.
      - Every root and generated agent inherits the contract.
      - Plugin validation rejects an agent that omits the contract.
    success_measures:
      - 56 of 56 agents inherit the contract.
      - Root and generated plugin surfaces pass the full repository suite.
    required_items:
      - item: asset-lifecycle-contract-release
        state: shipped
  - id: enforcement-observable
    outcome: Workspace tooling derives an asset catalog and warns on incomplete, stale, orphaned, or inconsistent lifecycle records without blocking legacy workspaces.
    acceptance:
      - New item and asset fixtures cover valid and invalid lifecycle shapes.
      - The doctor reports warnings for legacy unknowns and errors only for internally contradictory new declarations.
      - kai/catalog.md generation is deterministic and current-only views exclude non-current assets.
    success_measures:
      - Self-tests cover all universal state combinations and supersession directions.
    required_items:
      - item: asset-lifecycle-doctor-warnings
        state: shipped
  - id: migration-complete
    outcome: Kai's own workspace is reconciled and closure enforcement rejects new unresolved lifecycle gaps.
    acceptance:
      - Existing in-scope assets receive separate disposition and validity classifications, including current, archived, superseded, retracted, or unknown as applicable.
      - Closure checks include asset, backlog, and ownership sweeps.
      - Warnings promoted to errors apply only after a deterministic migration.
    success_measures:
      - No required asset in a terminal initiative remains draft, provisional, ownerless, or unknown.
    required_items:
      - item: asset-lifecycle-migration-enforcement
        state: shipped
---

# Universal asset lifecycle contract

This initiative implements the operator-approved completeness model produced
after reviewing Superpowers, OpenSpec, spec-kit, Beads, Backstage, ADR tooling,
and dbt freshness semantics. It is separate from mock placement and physical
initiative archiving because it changes the behavior of every asset-producing
role, regardless of where a file eventually lives.

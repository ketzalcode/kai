---
type: releases
title: Ship record — pack migration doctor
slug: pack-split-migration-doctor-ship-record
created: 2026-08-26
source: workflow-ship
target: pack-split migration doctor
initiative: pack-split
source_artifact: kai/coordination/items/pack-split-migration-doctor.md
canonical_path: kai/library/releases/2026-08-26/01-ship-pack-split-migration-doctor/ship-record.md
shipped: 2026-08-26T19:47:53Z — v0.63.0, merge commit 52283b97ef92b3e15cabe2f35fdcf4ebb49c4d25
related:
  - kai/initiatives/pack-split/artifacts/security/pack-split-migration-doctor.md
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-migration-doctor.md
evidence:
  - https://github.com/RubenSaucedo/kai/pull/163
  - https://github.com/RubenSaucedo/kai/actions/runs/33007032198
  - https://github.com/RubenSaucedo/kai/releases/tag/v0.63.0
---

# Ship Record — pack migration doctor

**Work item:** `pack-split-migration-doctor`  
**Reviewed ref:** `961c86c6e948093999256e64a88f2fe31f53cfe4`  
**Merge commit:** `52283b97ef92b3e15cabe2f35fdcf4ebb49c4d25`  
**Release:** [`v0.63.0`](https://github.com/RubenSaucedo/kai/releases/tag/v0.63.0)

## Outcome

Kai now ships a read-only migration doctor that verifies legacy uninstall,
refuses monolith/pack coexistence, distinguishes `clear`, `blocked`, and
`unknown`, and reconciles workspace provenance without mutating the host or
workspace.

## Production evidence

- PR #163 merged at `2026-08-26T19:47:30Z`.
- Main validation run `33007032198`, job `98303337581`, passed at the merge
  commit; workspace-doctor, host-loader, generator, partition, collision,
  partial-install, skew, committed-tree, and syntax gates were green.
- `v0.63.0` was published at `2026-08-26T19:47:53Z`, non-draft and
  non-prerelease, targeting the merge commit.
- The marketplace remains the single monolithic `kai` entry and
  `COMMITTED_PACKS` remains empty. This release adds migration readiness; it
  publishes no pack.

## Verification

- 26 migration scenarios passed.
- The inspected fixture tree remained byte-identical.
- Security review: **CLEAR**.
- Reliability review: **READY**.
- Rollback was not invoked.


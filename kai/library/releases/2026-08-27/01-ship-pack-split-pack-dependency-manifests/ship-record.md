---
type: releases
title: Ship record - generated-pack dependency manifests
slug: pack-split-pack-dependency-manifests-ship-record
created: 2026-08-27
source: workflow-ship
target: generated-pack dependency manifests and install semantics
initiative: pack-split
milestone: five-pack-split-shipped
source_artifact: kai/coordination/items/pack-split-pack-dependency-manifests.md
current_path: kai/library/releases/2026-08-27/01-ship-pack-split-pack-dependency-manifests/ship-record.md
canonical_path: kai/library/releases/2026-08-27/01-ship-pack-split-pack-dependency-manifests/ship-record.md
status: release-ready - PR 175 approved; merge and main verification pending
related:
  - kai/coordination/threads/pack-split-pack-dependency-manifests.md
  - docs/proposals/pack-architecture.md
  - https://github.com/RubenSaucedo/lectoria/releases/tag/v0.1.0
evidence:
  - "reviewed implementation 78a719f0cc32c75c66ddaad4b302985b789a5084"
  - "https://github.com/RubenSaucedo/kai/pull/175"
  - "https://github.com/RubenSaucedo/kai/actions/runs/33104688494"
---

# Ship Record - Generated-Pack Dependency Manifests

**Work item:** `pack-split-pack-dependency-manifests`
**Date:** PREPARE 2026-08-27 11:50 -07:00
**Run:** `workflow-ship`

**What is ready:** every generated pack has deterministic npm metadata; core
and personal install a prebuilt Lectoria artifact through pack-local locks;
runtime sources and integrity fail closed before publication.

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | The change implements the accepted dependency-manifest item inside `five-pack-split-shipped`. Packs remain unpublished and marketplace topology remains one monolith at source `.`. The CI workflow touch is recorded and exists only to make the accepted clean-install proof repeatable. |
| 2 | verified | **Clear** | Node 24.15.0 `npm test` passed with 163 pack mutation checks. GitHub Actions run `33104688494` passed contract plus clean empty-cache, no-Git, no-credential installs for core and personal, both CLI probes, and the core provider-root probe. A tampered integrity value failed with `EINTEGRITY`. Design sub-gate does not trigger: no user-facing UI changed. |
| 3 | reviewed | **Clear** | The required `principal-swe-architect` review ratified exact ref `78a719f0cc32c75c66ddaad4b302985b789a5084` at P0/P1/P2 = 0/0/0. The earlier review is retained in the append-only thread but no longer satisfies the item gate. |
| 4 | shippable-safely | **Clear** | This release changes copied metadata, validation, and optional audio installation. No pack is published and no data changes. Rollback is a merge revert plus patch release. Signals are main CI, runtime-install jobs, exact URL/integrity, generated-tree drift, and marketplace N=1. Owner: `principal-swe-infra`. |
| 5 | documented | **Clear** | `CHANGELOG.md`, README status, both audio skills, the PowerShell wrapper, and `docs/proposals/pack-architecture.md` describe the host, install, update, artifact, and integrity contract. This record and the initiative index/log are updated in the same release handoff. |
| 6 | coordination-closed | **Clear** | Acceptance is complete, the dependency is `pack-split-host-gates (completed)`, no questions are open, the exact completed review matches the item `change_ref`, and the deploy handoff below names merge, release, rollback, and verification. |

**Readiness verdict: RELEASE-READY.** Six of six dimensions are Clear.

## Artifact boundary

```text
canonical root package + lock
             |
             | deterministic reachable projection
             v
      +------+------+
      |             |
      v             v
  kai-core      kai-personal
  local lock    local lock
      |             |
      +------v------+
             |
             v
  public Lectoria v0.1.0 tarball
  HTTPS + exact SHA-512, no Git or source build
```

The release asset is
`https://github.com/RubenSaucedo/lectoria/releases/download/v0.1.0/lectoria-0.1.0.tgz`.
GitHub reports SHA-256
`ddd5bef3de299364f339339b2cb604e5cf7d86981a6014a79f62e484cb7b6ef4`;
npm locks SHA-512
`EBC2cPfS8AiCK1VvXPJZbxua6MlhswGwSLiJqXQPlA8Repn6KcvjyfSNMgIp5/04LEzHvK2fEEBSFTA8A9tXWw==`.

## Rollout and monitoring

No canary or feature flag is needed. The generated packs are still inert,
committed files inside the monolith payload. The only externally usable change
is the optional `npm ci --prefix "<pack-root>"` audio setup.

Healthy signals:

- PR and main `validate / contract` succeed.
- Both `runtime-dependencies` jobs install from empty caches on Node 24.15.0.
- `node scripts/pack-preview.mjs --check` reports no generated drift.
- Root, core, and personal locks retain the exact release URL and SHA-512.
- Marketplace remains exactly one `kai` entry at source `.`.

Sick signals:

- Any Git, SSH, non-HTTPS, unapproved-host, or incomplete-integrity runtime
  record.
- `EINTEGRITY`, missing `node_modules/.bin/lectoria`, or provider-root fallback
  away from the core pack-local executable.
- Any pack marketplace entry before release 12b.

The release asset has no mirror. Deletion would break only opt-in audio setup
and fail loudly; substitution is blocked by the integrity pin.

## Rollback

Revert the PR #175 merge, bump to `0.65.1`, update CHANGELOG and README, and
publish the patch release. The public Lectoria `v0.1.0` release remains as an
immutable historical artifact. No data, migration, credential, or published
pack state needs reversal.

Rollback triggers:

- required main CI is red at the merge commit;
- generated pack drift appears;
- the runtime install jobs cannot reproduce either pack-local CLI;
- marketplace topology changes beyond the monolith version bump.

## Deploy handoff

The operator has already authorized Kai to merge this PR autonomously. Execute:

1. Confirm PR #175 checks are green and the reviewed implementation
   `78a719f0cc32c75c66ddaad4b302985b789a5084` is an ancestor of the PR head.
2. Confirm every path changed after that ref is under `kai/coordination/` or
   this release-record/initiative-record set.
3. Merge PR #175 without rewriting away the reviewed implementation ancestry.
4. Wait for the `main` validation run at the merge commit to succeed.
5. Publish GitHub release `v0.65.0` targeting that merge commit from the
   matching CHANGELOG entry.
6. Verify merged version coherence, generated-tree parity, marketplace N=1,
   exact Lectoria URL/integrity, and both runtime-dependency jobs.

Packs must remain unpublished. Release 12b remains NO-GO.

## Production verification contract

Return these facts to this record:

1. PR merge commit and timestamp.
2. Main workflow run and all job conclusions.
3. GitHub release URL, tag, target, draft/prerelease state.
4. Version coherence at root/plugin/marketplace/core/personal plus README and
   CHANGELOG.
5. Marketplace count and source.
6. Exact Lectoria resolved URL and integrity in root/core/personal.
7. `pack-preview --check` result at merged main.


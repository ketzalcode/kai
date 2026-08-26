---
type: releases
title: Ship record — core + personal first-department install proof
slug: pack-split-first-department-ship-record
created: 2026-08-26
source: workflow-ship
target: pack-split first-department install proof
initiative: pack-split
milestone: first-pack-extracted
source_artifact: kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md
canonical_path: kai/library/releases/2026-08-26/03-ship-pack-split-first-department/ship-record.md
status: release-ready
related:
  - kai/coordination/threads/pack-split-first-department.md
  - kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees/ship-record.md
evidence:
  - "reviewed evidence commit 3b14dc6cfb693a7925c48a8c3d4446dda041c03f"
  - "coordination-only commits 4c9d20525e66b7773a445056e10404af9bcaa331 and 6681cf292fbfdd0bca7234112975886891feac3b"
  - ".kai/runs/eng/2026-08-26/01-infra-pack-split-first-department/evidence/"
  - "v0.64.0 enabling release at merge 2eea0f04f1c3dc0b4788de1e82909c5cc882e75d"
---

# Ship Record — Core + personal first-department install proof

**Work item:** `pack-split-first-department` · **Initiative:** `pack-split`  
**Target:** pack-split first-department install proof · **Date:** 2026-08-26 15:25 -07:00  
**Run:** `workflow-ship`  
**What shipped (one line):** release-ready evidence that the already-deployed
`v0.64.0` committed-unpublished `kai-core` + `kai-personal` trees install and
operate across the plugin boundary; this item changes no plugin behavior.  
**Change:** reviewed evidence commit
`3b14dc6cfb693a7925c48a8c3d4446dda041c03f` on
`docs/29-first-department-proof`.

The reviewed evidence commit is followed only by
`4c9d20525e66b7773a445056e10404af9bcaa331` (coordination handoff) and
`6681cf292fbfdd0bca7234112975886891feac3b` (review records). The item remains
bound to `3b14dc6…`; record-only descendants do not replace the reviewed
`change_ref`.

## DoD gate

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | scope-true | **Clear** | Item acceptance is 4/4 in `kai/coordination/items/pack-split-first-department.md`; the proof serves active `northstar.scope.current: [first-pack-extracted]` and preserves the non-negotiables: root-generated committed-unpublished trees, cross-provider core contract, uninstall-first/coexistence refusal, and no marketplace flip. The reviewed commit is documented as coordination/initiative/reliability evidence only. |
| 2 | verified | **Clear** | `kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md` binds the operator-run PASS packet and raw records under `.kai/runs/eng/2026-08-26/01-infra-pack-split-first-department/evidence/`: provider-qualified `kai-personal:persona-self`, `kai-core-contract-v1` and inherited core skills from `kai-core`, doctor refusal/clean controls, unchanged inventories, and a 59.66% discovery-description character reduction. `workspace-doctor` and `git diff --check` passed at evidence binding. No user-facing surface exists, so QA-UI/design sign-off does not trigger. |
| 3 | reviewed | **Clear** | The sole requirement, `principal-swe-architect` / `independent-architecture`, is RATIFIED in `kai/coordination/threads/pack-split-first-department.md` at exact `change_ref 3b14dc6cfb693a7925c48a8c3d4446dda041c03f`. The review records no blocking finding and identifies later commits as records only. |
| 4 | shippable-safely | **Clear** | Rollout-operability lens: the remaining deployment is a documentation/coordination merge to `main`, not a plugin rollout. CI-green merge is the gate; rollback reverts that merge only. No service, migration, data, runtime flag, tag, release, version bump, marketplace entry, or publication is implicated. Signals and owner are named below. |
| 5 | documented | **Clear** | Durable proof at the reliability artifact; this canonical release record at `kai/library/releases/2026-08-26/03-ship-pack-split-first-department/ship-record.md`; initiative `log.md` and `deliverables.md` stamped by PREPARE. |
| 6 | coordination-closed | **Clear** | Item v13 is `release-ready`, `next_role: "@operator"`, lease clear, no waiting questions, and both typed dependencies are `shipped`. `BOARD.md`, `ACTIVE.md`, the thread deploy HANDOFF, log, and deliverables are refreshed together. |

**Readiness verdict: RELEASE-READY.** Six of six Clear; no Gap and no waiver.

### Probe-correction record

The three pre-proof failures were probe/fixture failures, not product failures:
Windows PowerShell 5.1 lacked `ProcessStartInfo.ArgumentList`; PowerShell 7
parameter `$Home` collided case-insensitively with readonly `$HOME`; and the
doctor correctly returned `workspace-provenance-stale` when the clean fixture
was pointed at the legacy repository before being isolated to
`staged-clean-workspace`. The final packet uses PowerShell 7, `$TargetHome`, and
the isolated workspace. Its successful rerun **replaced the evidence
directory**, so raw pre-failure output is not preserved and is not represented
as raw proof; the operator-provenance history remains in the reliability
artifact.

## Rollout plan

Big-bang documentation merge is proportional: there is no runtime payload to
ramp. The operator commits the PREPARE records, pushes the existing evidence
branch, waits for PR CI to be green, and uses a merge commit so reviewed
`3b14dc6…` remains in ancestry.

**Blast radius:** the evidence artifact and coordination state become visible
on `main`. Existing `v0.64.0` behavior and committed pack trees do not change.

**Signals:** PR and `main` CI conclusions; reviewed artifact byte-identity;
presence of the canonical ship record and release-ready item on `main`; zero
diff in implementation, pack, manifest, marketplace, and release-metadata
paths. **Owner:** `@operator` for the merge; `principal-swe-infra` for an
evidence defect; `workflow-ship` for lifecycle confirmation.

## Rollback plan

Revert the **evidence-record merge only**:

```powershell
git -C C:\src\kai switch main
git -C C:\src\kai pull --ff-only origin main
git -C C:\src\kai revert -m 1 <evidence-record-merge-sha>
```

Push that revert through the normal protected PR + green-CI path. This removes
the merged proof/coordination records; it does **not** revert deployed
`v0.64.0`, commit `2eea0f04…`, the committed pack trees, or historical local raw
evidence. No version bump, tag, release, marketplace change, pack publication,
or plugin rollback is part of this rollback.

## Deploy handoff (the human runs these — kai does not)

1. Confirm only the seven PREPARE record paths are dirty:
   `git -C C:\src\kai status --short`. Expect the item, thread, `BOARD.md`,
   `ACTIVE.md`, initiative `log.md`, `deliverables.md`, and
   `kai/library/releases/2026-08-26/03-ship-pack-split-first-department/ship-record.md`.
   Any implementation/artifact-finding path is an abort.
2. Run:
   `node C:\src\kai\scripts\workspace-doctor.mjs --root C:\src\kai` and
   `git -C C:\src\kai diff --check`. Both must pass. Then stage exactly the
   seven paths:
   `git -C C:\src\kai add -- kai/coordination/items/pack-split-first-department.md kai/coordination/threads/pack-split-first-department.md kai/coordination/BOARD.md kai/coordination/ACTIVE.md kai/initiatives/pack-split/log.md kai/initiatives/pack-split/deliverables.md kai/library/releases/2026-08-26/03-ship-pack-split-first-department/ship-record.md`.
   Confirm them with `git -C C:\src\kai diff --cached --name-only`, then run
   `git -C C:\src\kai commit -m "docs(ship): prepare first department proof"`.
3. Bind the review before push:
   `git -C C:\src\kai diff --exit-code 3b14dc6cfb693a7925c48a8c3d4446dda041c03f..HEAD -- kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md`
   must print nothing. Also run
   `git -C C:\src\kai diff --exit-code 342cd8eb9bacb7bfc8ccd3679f3f09667f1bd246..HEAD -- agents skills scripts packs hooks.json plugin.json package.json package-lock.json .github/plugin/marketplace.json CHANGELOG.md README.md`;
   it must print nothing.
4. Push `docs/29-first-department-proof` and open or refresh its PR against
   `main`. Wait for every required check to finish green. Return the PR URL,
   PR head SHA, run URL/ID, and start timestamp.
5. Merge with **merge-commit ancestry preservation** (not squash/rebase), then
   wait for `main` CI at that merge SHA to finish successfully. Return the
   merge SHA, successful run URL/ID and conclusion, and completion timestamp.
6. **Publication stop gate:** do not change `plugin.json`, package manifests,
   `packs/`, `.github/plugin/marketplace.json`, CHANGELOG/README release
   metadata, tags, GitHub releases, or marketplace state. Do not create a new
   version. Any such diff or requested action aborts this deployment.

**Abort criteria:** reviewed artifact differs from `3b14dc6…`; any forbidden
path changes; CI is not successful; merge mode would rewrite reviewed ancestry;
or any version/tag/release/publication action appears. Do not merge; return the
failed evidence to `workflow-ship`.

## Production verification

1. Fetch `main` and prove review ancestry:
   `git -C C:\src\kai merge-base --is-ancestor 3b14dc6cfb693a7925c48a8c3d4446dda041c03f origin/main`.
2. Prove the reviewed reliability artifact is unchanged:
   `git -C C:\src\kai diff --exit-code 3b14dc6cfb693a7925c48a8c3d4446dda041c03f..origin/main -- kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md`.
3. Prove `main` contains this canonical ship record and the authoritative item
   at `state: release-ready`, with its exact reviewed `change_ref`.
4. Re-run the forbidden-path diff from source revision `342cd8e…` to the merge
   SHA; expect no output. Confirm marketplace remains one `kai` entry at
   `source: "."` and the committed packs remain unpublished.
5. Return to `workflow-ship`: PR URL, merge SHA, environment (`main` committed
   evidence corpus), deployment start timestamp, successful `main` CI run
   URL/ID + conclusion, completion timestamp, and outputs from checks 1–4.

Only after that operator deployment evidence and these read-only checks pass
may `workflow-ship` move through `deploying` and
`production-verification` to `shipped`.

## Follow-ups / parked

- `pack-split-host-gates` remains a separate proposed knowledge item and depends
  on this item reaching `shipped`; PREPARE does not promote it.
- Public pack publication remains exclusively `pack-split-release-12b`.
- No review finding was deferred or dropped in this gate.

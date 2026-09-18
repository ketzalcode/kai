---
name: kai-core-asset-producing
description: "Defines how a run produces and closes out a durable asset: pre-dispatch declaration, disposition and validity state, metadata, revision, supersession, and migration."
tools: [read, edit, search]
---

# Asset production

Every kai role can produce an asset: a report, decision, design, plan, review,
briefing, lesson, release record, backlog entry, or implementation artifact.
This contract governs producing one — what a run declares before it starts, the
state machines and metadata every durable asset carries, and how to revise,
supersede, or migrate it. Whether an asset is complete, fresh, promotable, or
closeable is decided in `kai-core-asset-closing`.

This contract keeps four independent questions separate:

```text
EXECUTION     Did the work item reach a truthful stop?
DISPOSITION   Where is the asset in its durability lifecycle?
VALIDITY      Is the asset still safe to use as current guidance?
CLOSURE       Did the initiative reconcile all work, assets, and backlog?
```

## The core rule

**A run may produce no durable asset. It may never leave an unclassified one.**

Before an asset-producing run starts, the work item declares what is expected.
Before the run stops, every produced asset has an explicit disposition and
validity state. Work-item completion remains historical truth even when an
asset later becomes stale, invalidated, retired, or superseded.

## Four orthogonal state machines

### 1. Execution

Execution uses the work-item lifecycle from `kai-core-work-granting`.

```text
proposed -> ready -> in-progress -> in-review
                                      |
                     knowledge -------+-> completed
                     production ------+-> release-ready -> shipped
```

`completed` and `shipped` answer only whether the commissioned work reached its
required terminal state. Never reopen a terminal work item merely because an
asset's facts aged or a successor replaced it. Create revalidation or
replacement work instead.

### 2. Disposition

```text
scratch -> draft -> working -> published -> archived
scratch -> discarded
draft   -> discarded
working -> archived
published -> retracted
personal  -> archived | discarded
```

| State | Meaning |
|---|---|
| `scratch` | Raw, regenerable, or exploratory output under `.kai/runs/`. |
| `draft` | Selected for review but not accepted or authoritative. |
| `working` | Durable initiative-owned material still being developed. |
| `published` | Accepted at its canonical durable path and eligible to be cited as current when validity permits. |
| `personal` | Durable operator-private or personal operational material under `.kai/personal/`; never a team publication by default. |
| `archived` | Preserved history that is not a current working authority. |
| `retracted` | Preserved at its canonical path but explicitly unsafe or incorrect; the reason is mandatory. |
| `discarded` | Intentionally removed scratch, draft, or operator-authorized personal output; team-facing working or published assets cannot be discarded. |

Disposition is about custody and authority, not truth. An archived release
record may remain historically valid. A published market report may become
stale.

### 3. Validity

```text
unknown -> provisional -> current
   |                       |
   +-> stale <-------------+
   +-> superseded <--------+
   +-> invalidated <-------+
   +-> retired <-----------+

stale -> current | expired | superseded | invalidated | retired
```

| State | Meaning |
|---|---|
| `unknown` | Legacy or unclassified; not safe to present as current. |
| `provisional` | Produced but not yet accepted by the named authority. |
| `current` | Accepted and usable against the recorded basis and revision. |
| `stale` | Revalidation is due or a basis changed; may still be useful with a warning. |
| `expired` | Its time-bounded validity elapsed; not current guidance. |
| `superseded` | A named successor is the current authority. |
| `invalidated` | Evidence or a decision proves the asset unsafe or wrong. |
| `retired` | Intentionally withdrawn because the governed subject no longer exists or matters. |

Only `unknown -> current` requires revalidation. Direct classification from
`unknown` to stale, superseded, invalidated, or retired records known legacy
truth without ever pretending the asset was current.

Only `current` may be presented without a qualification. `unknown`,
`provisional`, and `stale` are visible conditions, never success-shaped
fallbacks.

### 4. Initiative closure

Initiatives use the lifecycle from `kai-core-initiative-stewardship`:

```text
proposed -> active -> paused -> completed | shipped -> archived
```

An initiative terminal state requires the work, asset, backlog, and ownership
sweeps defined in `kai-core-asset-closing`. Archiving the initiative moves
operational records out of live state; it does not move or invalidate its
published assets.

## Pre-dispatch declaration

Every new coordinated item declares:

```yaml
artifact_expectation: owed       # owed | none
artifact_class: investigation    # required when owed
durability: durable              # ephemeral | working | durable | published
completion_authority: operator
validity_owner: eng-advisor-investigation
artifact_targets:
  - .kai/state/initiatives/retention/artifacts/research/churn.md
```

Rules:

1. `artifact_expectation: owed` requires `artifact_class`, `durability`,
   `completion_authority`, `validity_owner`, and at least one exact
   workspace-root-relative `artifact_targets` entry before `ready`.
2. `artifact_expectation: none` requires an `artifact_expectation_reason`.
   This is the normal shape for a spike, conversational answer, routing pass,
   or implementation item whose durable result is the product change itself.
3. `durability: ephemeral` permits only `.kai/runs/` output and requires all
   selected conclusions to be handed off or intentionally discarded before
   the run stops.
4. Existing legacy items without these fields are `artifact_expectation:
   unknown`. They remain readable and may finish during migration, but must not
   be used as templates for new work.
5. `artifact_targets` is plural. Bundles and multi-surface work record every
   durable target. `artifact_target` is a legacy single-path field and may be
   read during migration, but new or revised records use the plural field.

## Universal asset metadata

Every durable text asset starts with:

```yaml
---
asset_id: retention-churn-investigation-2026q3
asset_class: investigation
type: investigations
title: Churn investigation
item: retention-churn-investigation
initiative: retention-2026
produced_by: eng-advisor-investigation
created: 2026-08-28
revision: 1
source_artifact: .kai/state/initiatives/retention-2026/artifacts/research/churn.md
target: retention decision

disposition:
  status: published
  reason: accepted investigation report

completion:
  authority: operator
  verdict: accepted
  at: 2026-08-28-1700
  revision_at_verdict: 1

validity:
  status: current
  owner: eng-advisor-investigation
  as_of: 2026-08-28
  revalidate_by: 2027-02-28
  basis:
    - billing schema v3
    - pricing policy effective 2026-08-01

supersedes: null
superseded_by: null
evidence:
  - .kai/runs/product/2026-08-28/01-analytics-retention/export-summary.md
---
```

Required fields are `asset_id`, `asset_class`, `item`, `produced_by`,
`created`, `revision`, `disposition.status`, `completion.authority`,
`completion.verdict`, `validity.status`, and `validity.owner`.
Initiative membership may be `null`. Evidence may be empty only when the asset
class is intrinsically historical or the item records why evidence does not
apply.

An asset ID is stable across revisions at one canonical path. A replacement
with materially different conclusions receives a new asset ID.

## Revision and supersession

Use a revision when the conclusion and governing basis stay materially the
same: clearer wording, corrected links, formatting, or additive evidence that
does not change the decision.

Create a new asset when the conclusion, recommendation, governed scope, or
evidence basis changes materially.

Supersession is one close operation:

1. Create the successor with a new `asset_id` and `supersedes: <old-id>`.
2. Update the predecessor to `validity.status: superseded` and
   `superseded_by: <new-id>`.
3. Keep both readable at their canonical paths.
4. Exclude the predecessor from current-only views.
5. If either direction cannot be written, leave the successor provisional and
   report the incomplete relationship. Never claim an atomic guarantee that
   markdown and the filesystem cannot provide.

## Generator close transaction

Before an asset-producing agent stops:

1. Inventory every generated file.
2. Keep raw evidence under `.kai/runs/`.
3. Add complete metadata before durable placement.
4. Resolve revision or supersession.
5. Record each exact path in the work item's `artifact_targets` and Evidence.
   For a coordinated item, register the asset as a **registered artifact** with
   an `artifact.register` command through `scripts/coordinate.mjs apply`; the
   subject hash comes from `hash --path <workspace-or-project-ref>`. An authored
   brief, design, decision rationale or report stays a **registered artifact**
   at its own path — nothing derives it from the store and nothing replaces it.
6. Resolve the four completion dimensions defined in `kai-core-asset-closing`.
7. Submit an `item.handoff` naming:
   - execution state;
   - asset disposition;
   - asset validity;
   - completion authority and verdict;
   - validity owner and next revalidation trigger.
8. Report any incomplete write as a Gap. Do not shape it as success. An
   `EVIDENCE_GAP` refusal — for example an applicable input with no captured
   lineage — is a real gap: register a fresh explicit input basis rather than
   downgrading what is known.

The workspace doctor provides detectability, not filesystem transactions. It
must detect orphan assets, missing targets, incomplete supersession, invalid
state combinations, overdue revalidation, and initiative closure blockers.

An uncoordinated, directly requested artifact needs none of this machinery: no
coordination database, no initiative and no report tree. Classify it, place it,
and say where it is.

## Migration rule

Do not guess that an old asset is current. During reconciliation:

1. Assign stable asset IDs.
2. Set `validity.status: unknown`.
3. Name an owner or explicitly record that none is known.
4. Classify disposition and canonical path.
5. Revalidate before changing `unknown` to `current`.
6. Link replacements bidirectionally.

Roll out enforcement as **warn, reconcile, then error**. A workspace with
legacy assets must remain inspectable while migration is incomplete, but
unknown assets must never appear in a current-only view.

## Hard rules

1. Work-item state and asset validity are independent.
2. Declare `owed` or `none` before dispatch; never generate first and classify
   later.
3. No unclassified durable output.
4. Material conclusion changes create a successor, not a silent revision.
5. Supersession links are bidirectional.

## Anti-patterns

- Marking an investigation `completed` and assuming its report stays current.
- Treating every generated markdown file as permanently durable.
- Reopening old work to represent new validity facts.
- Publishing a producer-approved draft as current.
- Replacing a decision without linking its predecessor.
- Deleting an incorrect published assessment instead of retracting it.
- Closing an initiative while drafts, provisional outputs, or ownerless current
  assets remain.

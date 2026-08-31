---
name: kai-core-asset-lifecycle
description: "Defines universal generated-asset completion, disposition, validity, ownership, freshness, supersession, and initiative closure rules."
tools: [read, edit, search]
---

# Asset Lifecycle

Every kai role can produce an asset: a report, decision, design, plan, review,
briefing, lesson, release record, backlog entry, or implementation artifact.
Finishing the work that produced it does not prove the asset is durable,
accepted, current, or still authoritative.

This contract keeps four independent questions separate:

```text
EXECUTION     Did the work item reach a truthful stop?
DISPOSITION   Where is the asset in its durability lifecycle?
VALIDITY      Is the asset still safe to use as current guidance?
CLOSURE       Did the initiative reconcile all work, assets, and backlog?
```

It is not a standalone trigger skill. Every kai agent inherits it. An agent
applies it whenever a run may create, revise, publish, carry, supersede,
archive, retract, or discard an asset.

## The core rule

**A run may produce no durable asset. It may never leave an unclassified one.**

Before an asset-producing run starts, the work item declares what is expected.
Before the run stops, every produced asset has an explicit disposition and
validity state. Work-item completion remains historical truth even when an
asset later becomes stale, invalidated, retired, or superseded.

## Four orthogonal state machines

### 1. Execution

Execution uses the work-item lifecycle from `kai-core-work-coordination`.

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
| `personal` | Durable operator-private or personal operational material under `kai/personal/`; never a team publication by default. |
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
sweeps defined below. Archiving the initiative moves operational records out
of live state; it does not move or invalidate its published assets.

## Pre-dispatch declaration

Every new coordinated item declares:

```yaml
artifact_expectation: owed       # owed | none
artifact_class: investigation    # required when owed
durability: durable              # ephemeral | working | durable | published
completion_authority: principal-product-manager
validity_owner: principal-data-analytics
artifact_targets:
  - kai/initiatives/retention/artifacts/research/churn.md
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
produced_by: principal-data-analytics
created: 2026-08-28
revision: 1
source_artifact: kai/initiatives/retention-2026/artifacts/research/churn.md
target: retention decision

disposition:
  status: published
  reason: accepted investigation report

completion:
  authority: principal-product-manager
  verdict: accepted
  at: 2026-08-28-1700
  revision_at_verdict: 1

validity:
  status: current
  owner: principal-data-analytics
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

## Completion is a four-dimensional verdict

Every asset-producing knowledge item resolves these dimensions:

| Dimension | Clear when |
|---|---|
| `scope-true` | The output satisfies the commissioned outcome and contains no hidden scope expansion. |
| `grounded` | Load-bearing claims cite evidence; assumptions and uncertainty are explicit. |
| `accepted` | The named completion authority accepted this exact asset revision. |
| `disposed` | Every output has a declared path, metadata, index relationship, disposition, validity, and closed handoff. |

Each dimension is `Clear`, `Gap`, or `Waived-with-reason`. A Gap bounces the
item to `in-progress` or `blocked`; it never becomes a terminal item by
renaming the gap.

Product and operational items additionally pass
`kai-core-definition-of-done`. Its production safety and operability dimensions
remain separate from this asset verdict.

## Completion authority

The producer does not self-accept a team-facing durable asset unless the
operator explicitly records that exception. Personal operational state is the
bounded exception: derived agenda, inbox, proactive, consultation, and identity
maintenance under `kai/personal/` may name the owning personal role as
completion authority when it records facts or operator-supplied preferences
rather than making a decision on the operator's behalf. Personal decisions,
recommendations, and learning-path commitments still require the operator or a
named independent authority.

| Asset class | Default completion authority |
|---|---|
| Investigation, research, report, or briefing | The commissioning role |
| Product or interaction design | `principal-product-manager` |
| Architecture decision | Named decision owner |
| Specification or implementation plan | The role accountable for executing it |
| Documentation | Behavior or subject-matter owner |
| Security, privacy, reliability, experiment, or QA assessment | The commissioning owner; assessor remains independent |
| Incident record | Incident commander with required security/SRE evidence |
| Content or creative package | Grounding authority plus publication owner |
| Learning artifact | Operator or named learning-path owner |
| Release record | `workflow-ship` against the deployed revision |
| Personal operational state | Owning personal role for derived facts/preferences; operator for decisions or commitments |

If acceptance is pending, the asset remains `draft` or `working` with
`validity.status: provisional`. A checklist count or producer assertion is not
acceptance.

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

## Freshness and revalidation

Validity is event-based first and time-based where aging is predictable.

| Asset class | Default policy |
|---|---|
| Product maps, market research, pricing, metrics | Revalidate within 90 days and on basis change |
| Security, privacy, compliance, reliability assessments | Revalidate within 180 days and on reviewed-revision or control change |
| Investigations and analytical reports | Revalidate within 180 days or on basis change |
| Specifications and plans | Current until governed work ships, changes materially, or is dropped |
| Product/developer documentation | Revalidate when the documented surface changes |
| Decisions, incident records, releases, lessons learned | Immutable history; supersede or amend, do not expire silently |

The producer may choose a stricter policy. A longer or absent deadline requires
a reason when the class default is time-bounded. A warning threshold may
precede the error threshold, but crossing either changes visibility rather than
silently changing stored history.

## Placement and promotion

`kai-core-workspace-conventions` owns exact paths. This contract owns the state
change at those paths:

```text
.kai/runs/<run>                 scratch or draft
        |
        v
kai/initiatives/<slug>/...      working or published-in-place
        |
        v
kai/library/<type>/             promoted cross-initiative authority

kai/personal/...                personal operator-private state
```

Rules:

1. Scratch and raw evidence stay under `.kai/runs/`.
2. Draft review material remains in the run folder until accepted; schema 2 has
   no separate `kai/review/` lane.
3. An accepted initiative asset may publish in place. Steward-approved
   cross-initiative promotion uses `kai/library/<type>/`; under schema 2 the
   initiative source remains read-only provenance and the library path becomes
   canonical for reuse. The ratified future workspace contract may replace
   this with move-only publication only when its path migration ships.
4. `published` requires `completion.verdict: accepted` for the exact revision.
5. `personal` assets stay under `kai/personal/` and follow that lane's privacy
   and ownership rules; they are never promoted automatically.
6. Published durable assets are archived, superseded, retired, or retracted;
   never discarded.
7. Binaries and sensitive raw evidence remain governed by their owning domain
   contract and do not become safe to commit merely because text metadata
   exists.

## Generator close transaction

Before an asset-producing agent stops:

1. Inventory every generated file.
2. Keep raw evidence under `.kai/runs/`.
3. Add complete metadata before durable placement.
4. Resolve revision or supersession.
5. Record each exact path in the work item's `artifact_targets` and Evidence.
6. Resolve the four completion dimensions.
7. Append a HANDOFF naming:
   - execution state;
   - asset disposition;
   - asset validity;
   - completion authority and verdict;
   - validity owner and next revalidation trigger.
8. Report any incomplete write as a Gap. Do not shape it as success.

The workspace doctor provides detectability, not filesystem transactions. It
must detect orphan assets, missing targets, incomplete supersession, invalid
state combinations, overdue revalidation, and initiative closure blockers.

## Initiative closure sweep

Before `completed` or `shipped`, the steward proves:

1. **Work sweep:** every required item reached its declared terminal state.
2. **Asset sweep:** no required asset is missing, `scratch`, `draft`,
   `unknown`, `provisional`, or `invalidated`.
3. **Backlog sweep:** every entry is promoted, carried to a named successor,
   parked in the workspace authority, or dropped with a reason.
4. **Ownership sweep:** every maintained current asset has a validity owner and
   revalidation trigger.
5. **Outcome sweep:** `deliverables.md` and `director-summary.md` identify the
   current, historical, superseded, and retracted outcomes.

At archive, each asset receives one disposition:

```text
PUBLISH + MAINTAIN
CARRY TO <successor-initiative>
FREEZE AS HISTORY
SUPERSEDE WITH <asset-id>
RETRACT WITH <reason>
DISCARD                         # scratch or draft only
```

Published assets remain at their canonical paths. Moving operational item and
thread records to the ratified future `.kai/archive/` lane is gated on the
separate workspace-corpus migration; this contract does not create that path.

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
4. No producer self-acceptance without an explicit operator exception.
5. Only `current` is unqualified current guidance.
6. Material conclusion changes create a successor, not a silent revision.
7. Supersession links are bidirectional.
8. Published assets are preserved; incorrect ones are retracted, not erased.
9. Initiative closure includes work, asset, backlog, ownership, and outcome
   sweeps.
10. Legacy starts `unknown`; revalidation earns `current`.

## Anti-patterns

- Marking an investigation `completed` and assuming its report stays current.
- Treating every generated markdown file as permanently durable.
- Reopening old work to represent new validity facts.
- Publishing a producer-approved draft as current.
- Replacing a decision without linking its predecessor.
- Deleting an incorrect published assessment instead of retracting it.
- Closing an initiative while drafts, provisional outputs, or ownerless current
  assets remain.

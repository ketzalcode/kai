---
name: kai-core-asset-closing
description: "Defines the verdicts over an existing asset: four-dimensional completion, acceptance authority, freshness, placement and promotion, and initiative closure."
tools: [read, edit, search]
---

# Asset closing

Finishing the work that produced an asset does not prove it is durable,
accepted, current, or authoritative. This contract governs the verdicts a
completion authority, validity owner, or steward makes over an asset that
already exists — completion, acceptance, freshness, placement, promotion, and
initiative closure. Producing an asset in the first place is defined in
`kai-core-asset-producing`.

## The core rule

**A run may produce no durable asset. It may never leave an unclassified one.**

Before an asset-producing run starts, the work item declares what is expected.
Before the run stops, every produced asset has an explicit disposition and
validity state. Work-item completion remains historical truth even when an
asset later becomes stale, invalidated, retired, or superseded.

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
maintenance under `.kai/personal/` may name the owning personal role as
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
.kai/state/initiatives/<slug>/...      working initiative record
        |
        v
<project-root>/<publication-root>/...  accepted project authority

.kai/personal/...                personal operator-private state
.kai/review/...                  selected material awaiting acceptance
.kai/archive/...                 closed operational history
```

Rules:

1. Scratch and raw evidence stay under `.kai/runs/`.
2. Drafts selected for review move to `.kai/review/<class>/<item-id>/`.
   Design options use `.kai/review/designs/<item-id>/options.html`.
3. Initiative artifacts remain private working records under `.kai/state/`.
   Acceptance does not publish them automatically.
4. Intentional publication writes the accepted decision, specification, or
   report under the target project's configured `publication_root`. The public
   path becomes canonical; the private source remains provenance or moves to
   `.kai/archive/` at closure.
5. `published` requires `completion.verdict: accepted` for the exact revision.
6. `personal` assets stay under `.kai/personal/` and follow that lane's privacy
   and ownership rules; they are never promoted automatically.
7. Published durable assets are archived, superseded, retired, or retracted;
   never discarded.
8. Binaries and sensitive raw evidence remain governed by their owning domain
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

Published assets remain at their canonical project paths. Closed operational
records may move to `.kai/archive/` only after `ACTIVE.md`, the initiative
index, deliverables, and summary no longer depend on their live locations.

## Hard rules

1. No producer self-acceptance without an explicit operator exception.
2. Only `current` is unqualified current guidance.
3. Published assets are preserved; incorrect ones are retracted, not erased.
4. Initiative closure includes work, asset, backlog, ownership, and outcome
   sweeps.

# Grounding baseline analysis

**Method:** `kai-core-design-grounding` baseline  
**Revision:** `3b5a21f202f6ec221a4cb2aacad063c4c9ddb71b`  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`  
**Arms:** five no-target-guide controls, five unchanged-guide samples  
**Boundary samples in this turn:** none

## Case and rubric

The fixed case asked for one direct bounded Search Results toolbar decision from
supplied current token/component evidence only. No `design-system.md` or
initiative artifact was present in the case context. The useful answer shape was
one grounded recommendation, one small ASCII sketch, and any narrow follow-up.

Manual reading scored each sample on five observable points:

1. returned a bounded screen-level recommendation;
2. included a structural sketch;
3. grounded the choice in supplied evidence;
4. avoided invented tokens, components, or app-wide facts;
5. avoided unnecessary requests for a durable design-system reference,
   app-wide extraction, workspace/initiative setup, repo scans, or helper agents.

## Observed outputs

| Arm | Samples meeting all five points | Requested `design-system.md` | Requested app-wide extract/inventory | Requested workspace or initiative | Escalated to FE or `workflow-product-explore` |
| --- | --- | --- | --- | --- | --- |
| Control | 5/5 | 0/5 | 0/5 | 0/5 | 0/5 |
| Current | 5/5 | 0/5 | 0/5 | 0/5 | 0/5 |

All ten outputs recommended the same bounded structural move: keep
`SearchField`, `SortSelect`, and `Save search` on the primary row and move the
active chips to a dedicated second row. Each answer tied that recommendation to
the supplied width audit, the missing overflow pattern, and the existing
reports-page precedent. Differences were minor: some samples asked for a narrow
visual confirmation of left alignment or the `8px` row gap, and some said no
follow-up was needed.

## Interpretation

This baseline is **non-regression / nondiscrimination**, not behavioral RED.
The unchanged current guide did **not** cause the observed outputs to demand a
durable `design-system.md`, a broader inventory, or another producer in this
case. The control arm already handled the case cleanly, and the unchanged-guide
arm behaved the same way in these ten samples.

That does **not** clear the source contract. The frozen current source still
contains the broader durable-reference workflow the approved seam targets:

- canonical reference path under `.kai/state/initiatives/<slug>/artifacts/design-system.md`;
- supplied current inventory leading to "derive or refresh `design-system.md`";
- missing accessible tokens leading to a source-token inventory request;
- live evidence leading to a `workflow-product-explore` extraction path.

In this fixed direct case, those broader obligations did not surface in actor
behavior. The evidence from this turn therefore supports a narrow conclusion:
**the current wording remains mechanically broader than the approved bounded
seam, but this baseline case did not expose an actor-visible failure.**

## Limits

- Ambient harness/core instructions remained a confound; the control arm omitted
  only the target guide.
- Actors were instructed to read only assigned inputs and write only their
  assigned output file, but no stronger sandbox was available.
- No candidate wording or boundary case was run in this turn.

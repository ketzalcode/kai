# Scope baseline analysis

**Method:** `kai-core-scope-discipline` baseline  
**Revision:** `db386da78e857d2c863ae373c9670efb6f67e410`  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`  
**Requested arms:** five no-target-guide controls and five unchanged-guide samples  
**Boundary samples in this turn:** none

## Case and rubric

The fixed case asked for a direct, unonboarded advisory answer about a new
Search Results comparison tray. Supplied facts made clear that the idea would
add pin/unpin controls, a persistent tray, new state, and a side-by-side
comparison interaction. No active initiative, `northstar.md`, workspace proposal
channel, or backlog artifact was attached.

Manual reading scored each usable sample on five observable points:

1. classified the idea as scope-expanding rather than current-scope work;
2. returned a useful inline proposal or equivalent concise proposal text;
3. avoided forcing workspace onboarding, backlog creation, or proposal-channel
   recording before answering the direct advisory request;
4. did not present the idea as already adopted or approved;
5. grounded the answer in the supplied cost/value facts.

## Observed outputs

| Arm | Usable samples meeting all five points | Forced workspace/backlog creation | Forced onboarding before answering | Returned inline proposal text |
| --- | --- | --- | --- | --- |
| Control | 5/5 | 0/5 | 0/5 | 5/5 |
| Current | 5/5 valid outputs | 0/5 | 0/5 | 5/5 |

All five control samples treated the comparison tray as scope-expanding and
returned useful inline proposal wording. All five valid unchanged-guide samples
did the same; four used the exact `PROPOSAL` payload shape and one used an
equivalent concise inline proposal.

## Protocol deviation

One unchanged-guide sample first wrote its output to
`docs\reference\skill-evaluation\creative-foundation\scope\current\current-02.md`
instead of the predetermined `current-02.md` path. That artifact was preserved
as written and read as part of the record. A fresh replacement sample was then
run to create the required `current-02.md` file. This adds one extra comparison
sample to the cumulative budget count. The misrouted write is a sample-protocol
failure, **not** a scope-policy behavior failure.

## Interpretation

This baseline is also **nondiscriminating**. In this fixed direct unonboarded
case, the unchanged current guide did **not** force workspace onboarding,
proposal-channel resolution, or durable backlog recording before giving a useful
inline proposal. The observed difference was mainly output shape: the
unchanged-guide arm more often emitted the formal `PROPOSAL` block.

The frozen source still contains durable routing rules that point proposals to a
`proposal_channel`, default backlog paths, and onboarding before recording. In
this case, those broader obligations did not surface as actor-visible blocking
behavior.

## Limits

- Ambient harness/core context remained a confound.
- One unchanged-guide sample miswrote its file path and required a replacement
  sample.
- No candidate wording or boundary case was run in this turn.

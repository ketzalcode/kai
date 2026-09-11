# Agent contract refactor — verification record

Companion to [the plan](2026-09-04-agent-contract-refactor.md) and
[the design spec](../specs/2026-09-04-agent-contract-refactor-design.md).
This is Task 13: what the refactor actually achieved, how that was measured, and
— the part that matters most — **what nothing here verifies**.

## What changed

Every agent in `kai-core` (7) and `kai-engineering` (20) used to open with an
`**Inherits:**` line naming every shared contract it might need, followed by a
block quote and an injected dependency-guard region ordering it to load all of
them. The load happened before the agent read its task, whether or not the task
touched any of it.

Those 27 agents now carry **inline routes**: one imperative sentence placed at
the instruction that needs a contract, parsed strictly, plus a refusal in the
role's own words in the same paragraph where the agent routes
`kai-core-contract-v1`. There is no version marker and no second shape.

Four core contracts were split by reader, because a single file served three
audiences that each needed a third of it:

| Retired | Replaced by |
| --- | --- |
| `kai-core-team-operating-rules` | `kai-core-operating-rules` |
| `kai-core-work-coordination` | `kai-core-work-acting`, `kai-core-work-granting`, `kai-core-work-item` |
| `kai-core-workspace-conventions` | `kai-core-workspace-paths`, `kai-core-workspace-initiative` |
| `kai-core-asset-lifecycle` | `kai-core-asset-producing`, `kai-core-asset-closing` |

## Measurement

**Before** — the eager load, in tokens, at `2ecabe7`: agent body plus every
contract on its `**Inherits:**` line. This was not a ceiling. It was the floor:
the agent paid it on every run.

**After** — at `39332f3`: agent body plus every contract it could possibly
route. This *is* a ceiling. It assumes a run that walks every branch of the
agent and loads everything, which a real task rarely does.

So the comparison below is deliberately unkind to the refactor: a guaranteed
cost on the left, a worst case on the right.

| | Before (floor) | After (ceiling) | Change |
| --- | --- | --- | --- |
| Mean | 30,194 | 17,529 | −42% |
| Median | 29,714 | 17,352 | −42% |
| Min | 20,996 | 12,524 | −40% |
| Max | 41,607 | 25,526 | −39% |

26 agents; `eng-lead-technical-writing` is excluded because it was already in
the target shape before this branch. Its own figure is 10,152 — the lowest of
all 27 — though see the note on it under *What this does not prove*.

Largest movers:

| Agent | Before | After (max) |
| --- | --- | --- |
| `director-chief-of-staff` | 41,607 | 25,526 |
| `principal-swe-frontend` | 39,432 | 25,290 |
| `principal-swe-backend` | 36,236 | 23,946 |
| `principal-qa-ui` | 34,430 | 17,740 |
| `workflow-ship` | 34,013 | 17,220 |

Every agent is now under GitHub's 30,000-character host prompt cap with room to
spare, which was not true before.

Routes that fail to parse: **zero**. This is now meaningful — see below.

## What is verified, and by what

| Claim | Verified by |
| --- | --- |
| Every route parses and names a contract that exists on disk | `validate-plugin.mjs`, all 56 agents |
| No agent in the two migrated packs carries an `**Inherits:**` line or a guard region | `validate-plugin.mjs` |
| Each migrated agent routes `kai-core-contract-v1` before its first other core skill | `validate-plugin.mjs` |
| Each core route sits in a paragraph that names `.kai` and gives a concrete install instruction | `validate-plugin.mjs` |
| The parser cannot be fooled by fenced blocks, negations, list boundaries, or soft wraps | `pack-preview.mjs --self-test` routing fixtures |
| No rule was dropped without a written record | 32 drop records in `drop-records/` |

Build state at `39332f3`: `validate-plugin.mjs` reports 265 errors and
`pack-preview.mjs --self-test` reports 222 passed / 1 failed. Both are the
agreed end state of this branch, not regressions: they are dangling references
from the three packs that have not migrated yet, which land with those packs.

## What this does not prove

Read this section before trusting the numbers above.

**No automated check confirms an agent kept every rule it needs.** The rewrite
moved prose between files by human and model judgment. The 32 drop records are
the mitigation — each one names what moved and where — but a drop record is a
claim, not a test. A rule could have been dropped and recorded as moved.

**No automated check confirms output quality improved.** The whole premise is
that an agent reading a contract at the moment it needs it follows that contract
better than one that read everything up front. That is a behavioural claim and
this repository has no behavioural test suite. It has not been demonstrated.

**The "after" numbers are a ceiling, not an expectation.** The real saving
depends on which routes a given task actually walks, and that varies per run.
The honest statement is: the worst case is now below what the old floor was.

**Fewer tokens is not the goal, and a smaller number is not a success
criterion.** The goal is accuracy. Token count is the only thing that happens to
be cheap to measure, which is exactly why it should not be mistaken for the
result.

**A cautionary precedent.** `eng-lead-technical-writing` was migrated to the
target shape before this branch and shipped **six routes that pointed at nothing
at all** — undetected, because the validator's routing path was gated behind an
identity marker that no agent in the repository had ever declared. The check had
never run. It runs now, for all 56 agents, which is why "zero routes fail to
parse" is worth stating. But the lesson stands: a green check proves the check
ran, and that is a separate fact from the code being right.

**Two known loose ends,** both recorded rather than fixed: nothing pins the
contract citations inside script error messages, or the concern table in
`AGENTS.md`, to the contracts they name — both are correct today and both will
rot silently on a future split. And `kai-core-initiative-stewardship` says four
closure sweeps where `kai-core-asset-closing` lists five; that predates this
branch.

## How to check it for yourself

Three tasks, chosen to exercise different contract sets:

1. a director dispatch that grants a lease and takes a handoff —
   `-work-granting`, `-work-item`, `-workspace-paths`;
2. an assessor review that must not repair what it finds — `-operating-rules`,
   `-work-acting`;
3. a builder change that produces a durable artifact — `-asset-producing`,
   `-asset-closing`, `-workspace-initiative`.

Compare each against the behaviour before this branch. What matters is whether
the agent still honours the rules it used to honour, not whether it is faster.

## Scope

`kai-product`, `kai-gtm` and `kai-personal` — 29 agents — keep the eager
declaration until they migrate. One consequence is worth carrying forward:
`pack-preview --write` strips guard regions and never emits them, so
regenerating one of those three packs would remove a guard it still needs.
Migrate a pack before regenerating it.

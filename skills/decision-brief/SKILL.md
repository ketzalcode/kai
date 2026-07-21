---
name: decision-brief
description: "Packaging method for director-executive-assistant: turns a decision already waiting on the operator — an open @operator kind:decision thread question, or a release-ready deploy gate — into one decide-in-one-place brief. Reads the authoritative item, thread, context artifacts, and related consultations; fills only missing role positions through executive-consultation; assembles options, tradeoffs, per-role positions, a recommendation with owner, and the exact your-move actions; stores a private personal/decisions/ record; and never makes the decision."
tools: [bash, view, edit, create, grep, glob]
---

# Decision Brief

This skill answers the operator's constant need: *"give me what I need to
decide this — in one place."* The agenda (`personal-agenda`) tells the operator
**that** a decision is waiting; this skill assembles **the decision itself** so
they can weigh it without opening five files.

It is invoked by `director-executive-assistant`, never directly. It is the
inward complement to `executive-consultation`:

| Skill | Direction | Trigger |
|---|---|---|
| `executive-consultation` | **outward** — "go ask the team" | operator wants insight/data the records don't hold |
| `decision-brief` | **inward** — "package what's already waiting on me" | a decision is already pending on the operator |

The two compose: a decision brief that is missing a role's position spawns a
narrow `executive-consultation` to fill exactly that gap, then folds the
attributed answer back into the brief.

## What counts as a pending operator decision

Only what the authoritative records already show needs the human — never an
inferred one. There are exactly two kinds:

- **A thread decision** — an open `QUESTION` addressed to `@operator` with
  `kind: decision` and no matching answered `ANSWER` in
  `coordination/threads/<item-id>.md`.
- **A deploy gate** — an item in `release-ready`, the deploy button only the
  operator presses. It usually carries no `@operator` question; the item state
  *is* the pending decision (go / defer / cancel).

The two behave differently downstream (see "After the operator decides"), so
record which kind a brief packages.

A `proposed` item awaiting promotion is **steward** work, not an operator
decision; do not brief it. A `kind: reply` or `kind: action` operator question
is agenda-surfaced but is not a decision — if one actually hides a choice, the
owning role must first raise a proper `kind: decision` question; do not
re-interpret it here. If no qualifying record exists, say so and stop — never
manufacture a decision.

## Assembly

1. **Resolve.** Resolve the workspace that *owns the decision* — the current Kai
   workspace or a validated enabled linked root (`workspace-conventions`) — and
   the exact target: the item ID plus the authoritative thread path and
   `Q-<item-id>-<NN>`, or the `release-ready` item and its current ship record.
   Re-read the item `version`/`state` so a later bridge acts on current truth.
   Allocate a stable `d-<YYYY>-<NNNN>` brief ID that wraps that question/item;
   never invent a second question identity. The private record always lives in
   the **current** workspace's `personal/decisions/`, even when the decision
   belongs to a linked workspace.
2. **Read the record, not your memory.** Read the authoritative
   `coordination/items/<item-id>.md`, the full `coordination/threads/<item-id>.md`,
   every `context_artifacts` path, and any related
   `personal/consultations/<c-*>.md`. The thread and item are truth; a stale
   `BOARD.md` row is not.
3. **Extract the options actually on the table.** List the real alternatives the
   thread/artifacts contain — including "do nothing / defer" when it is live.
   For each option capture its tradeoffs and **which role holds that position**,
   sourced from the record. Separate a role's stated position from your own
   organizing.
4. **Fill only the gaps.** If a materially affected role has not weighed in, or a
   load-bearing fact is missing, run one `executive-consultation` scoped to
   exactly that gap (read-only, minimized personal context, provenance
   preserved). Do not consult merely to find an advocate for an option no role
   holds — an unsupported option is recorded as "no role holds this." Do **not**
   re-litigate positions the thread already settled, and do not consult when the
   record is already complete. Inline simulation may supply a lane *fact*, never
   a role's position — an independent position comes from the real role.
5. **Assemble** the brief with the schema below. Attribute every position and
   preserve disagreement; do not blend the roles into a false consensus.
6. **Record privately** under `personal/decisions/<d-YYYY-NNNN>.md` in the
   ignored personal lane.
7. **Present and stop** at the operator's decision boundary. Offer to execute
   each `your move` action on their explicit go-ahead — never before.

## Brief schema

Write one gitignored record:

```text
personal/decisions/<d-YYYY-NNNN>.md
```

Shape:

```markdown
# Decision — <short title>

**ID:** <d-YYYY-NNNN>  ·  **Packages:** <Q-item-id-NN | release-ready item-id>
**Created:** <YYYY-MM-DD HH:MM local>
**Status:** open | decided | superseded
**Workspace:** <label>  ·  **Item:** <item-id> (`coordination/items/<id>.md`)
**Decide by:** <answer_by timestamp, or "no stated deadline">

## The decision
<the one question the operator must answer, in one or two lines.>

## Why it's yours
<why no kai role owns this — a business/scope/irreversible/credential call, or
the deploy gate. One line.>

## Options
| # | Option | Key tradeoffs | Position held by | Provenance |
|---|--------|---------------|------------------|------------|
| A | <option> | <cost / risk / upside> | @<role> or "no role holds this" | durable-thread \| live-peer \| operator |
| B | <option> | … | … | … |
| — | Defer / do nothing | <consequence of waiting> | — | — |

## Recommendation
- **Lean:** <the option a real role recommends, the option that best fits
  operator-supplied criteria, or "no role lean — balanced">
- **Held by:** @<role whose recommendation this is>, or "criteria-derived:
  <the operator criterion applied>". A substantive lean is never the assistant's
  own judgment.
- **Confidence:** high | medium | low
- **Why:** <one or two lines grounded in the attributed positions above.>

## Blocked until you decide
- <item / peer / milestone that cannot move until this is answered>

## Your move
- **Thread decision:** <the single choice> → once decided, **@<owning role or Chief of Staff> records the `@operator` ANSWER on the thread** and restores the item per `work-coordination`.
- **Deploy gate:** go → **you deploy** (kai never deploys), then hand the run evidence to `workflow-ship CONFIRM-START`; defer → stays `release-ready` with a recorded reason; cancel → lifecycle-authorized drop.
- <any dependent action the operator can green-light, and the specialist who runs it>

## Sources
- <exact item / thread / artifact / consultation paths read>

## Team bridge
<how the decision returns to the record once made: for a thread decision, the
sanitized `@operator` ANSWER the CoS or owning role appends (selected option +
minimal team-relevant rationale only — never a private path or personal
reasoning); for a deploy gate, the `workflow-ship` state/HANDOFF that follows
deployment. A private record alone is not completion.>
```

Never overwrite an earlier brief. A changed decision gets a new `d-` ID; a new
position on the same open decision appends a dated note to the same record.

## After the operator decides

The outcome is team state, so it lands on the record through the authorized
role — **never** by the assistant writing coordination. Two paths:

**Thread decision.** The operator states the choice. The
`director-chief-of-staff` or owning role transcribes an `ANSWER` to
`coordination/threads/<item-id>.md` with the answerer as `@operator` and
`provenance: operator`, carrying only the sanitized selected option and minimal
team-relevant rationale — never a `personal/` path or private reasoning. Per
`work-coordination`, that role removes the question ID from
`waiting_on_questions` only if it is present, and restores the exact
`resume_state` only once **every** blocking question is answered, and only when
the role is authorized for that lifecycle transition.

**Deploy gate.** The operator deploys (kai never deploys), then supplies the run
evidence to `workflow-ship CONFIRM-START`; a deferral leaves the item
`release-ready` with a recorded reason; a cancel takes the lifecycle-authorized
drop path. The brief links the resulting `workflow-ship` state/HANDOFF, not an
ANSWER.

Then the assistant updates the private brief to `Status: decided`, records the
chosen option, and links the authoritative thread `ANSWER` or ship HANDOFF.

The private brief is a worksheet. It never replaces the committed record, and a
durable **team** decision/ADR (`initiatives/<slug>/artifacts/decisions/`)
remains owned by the deciding role — not written here.

## Hard rules

1. **Never decide.** Present options, positions, and a sourced recommendation;
   the operator chooses. You never answer the thread, approve scope, or deploy.
2. **Only real pending decisions.** Package what an authoritative `@operator`
   `kind: decision` question or a `release-ready` gate already shows. Never
   invent one.
3. **Positions come from roles.** A role position or role-attributed lean must be
   that role's real position (durable thread or live peer), never an inline
   simulation. The assistant may organize and compare, but never supplies a
   substantive lean as its own judgment.
4. **Fill gaps, don't re-litigate.** Consult only for a genuinely missing
   position or fact; reuse `executive-consultation` and its provenance.
5. **Preserve disagreement.** Do not manufacture consensus or hide the losing
   option's advocate.
6. **Private stays private.** The brief lives only under the current workspace's
   ignored `personal/decisions/`; never commit it, never send a peer more
   personal context than its gap-filling question needs.
7. **The record is truth.** The decision returns to the coordination thread or
   ship record through the authorized role; the brief only points at it.
8. **Bridge only sanitized fields.** The team-facing record gets the selected
   option and minimal team-relevant rationale; a `personal/` path, the private
   brief, or personal reasoning never enters committed coordination.

## Output contract

Return:

```text
Decision brief: <d-id + open|decided>
Packages: <Q-item-id-NN | release-ready item-id>
Record: <absolute personal/decisions/<d-id>.md path>
Options: <count, with the recommended lean or "balanced">
Recommendation: <one line + owning role, or "no role lean">
Blocked until decided: <one line or none>
Your move: <the single decision + who records it on your go-ahead>
```

## Anti-patterns

- ❌ Making the call yourself, or nudging the operator past a genuinely balanced
  choice.
- ❌ Briefing a `proposed` item — that is steward promotion, not an operator
  decision.
- ❌ Attributing a position to a role you actually simulated inline.
- ❌ Re-consulting roles whose positions the thread already records.
- ❌ Writing the outcome into `coordination/` yourself instead of routing it to
  the Chief of Staff or owning role.
- ❌ Storing the brief anywhere but the current workspace's ignored `personal/`.

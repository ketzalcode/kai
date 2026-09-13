---
name: decision-brief
description: "Decision briefing from supplied or selected evidence. Use when a personal or team decision needs options, tradeoffs, provenance, unresolved facts, and a sourced recommendation in one place."
tools: [execute, read, edit, search]
---

# Decision Brief

This skill answers the user's constant need: *"give me what I need to decide
this — in one place."* It assembles the decision itself, from the evidence the
user supplied or the record they selected, so they can weigh it without opening
five files.

It briefs **what it was given**. It does not go gather more: no role
consultation, no roster traversal, no fabricated consensus. A gap stays a
recorded gap.

## Two kinds of decision

### A. A personal decision

The default. The user names a choice and supplies the evidence: options they
are weighing, constraints, a document, a quote, a set of numbers, a personal
task. No coordination item is needed, no `@operator` question is needed, and
none is invented to justify a brief. Package what they gave you, name what is
missing, and stop at their choice.

### B. A pending team decision the user selected

Only what the authoritative records already show needs the human — never an
inferred one. There are exactly two shapes:

- **A thread decision** — an open `QUESTION` addressed to `@operator` with
  `kind: decision` and no matching answered `ANSWER` in
  `.kai/state/threads/<item-id>.md`.
- **A deploy gate** — an item in `release-ready`, the deploy button only the
  operator presses. It usually carries no `@operator` question; the item state
  *is* the pending decision (go / defer / cancel).

The two behave differently downstream (see "After the user decides"), so
record which kind a brief packages.

A `proposed` item awaiting promotion is **steward** work, not an operator
decision; do not brief it as one. A `kind: reply` or `kind: action` operator
question is agenda-surfaced but is not a decision — if one actually hides a
choice, the owning role must first raise a proper `kind: decision` question; do
not re-interpret it here. If the user pointed at a team record and no
qualifying pending state exists, say exactly that — an answered question is
resolved, not open, and a stale `status: open` line on an append-only thread is
not evidence it is still pending.

## Assembly

1. **Resolve the target.** For a **personal** decision, the target is the
   question the user asked plus the evidence they handed you; there is no item
   ID, no thread, and none is fabricated. For a **team** decision, resolve the
   workspace that *owns* it — the selected Kai workspace or a validated enabled
   linked root (`kai-core-workspace-initiative`) — and the exact target: the item
   ID plus the authoritative thread path and `Q-<item-id>-<NN>`, or the
   `release-ready` item and its current ship record. Re-read the item
   `version`/`state` so a later bridge acts on current truth. Either way,
   allocate a stable `d-<YYYY>-<NNNN>` brief ID; for a team decision it wraps
   that existing question/item and never invents a second question identity. The
   private record always lives in the **selected** workspace's
   `.kai/personal/decisions/`, even when the decision belongs to a linked
   workspace.
2. **Read the record, not your memory.** Read what the target actually points
   at: for a personal decision, the documents, numbers, and messages the user
   supplied; for a team decision, the authoritative
   `.kai/state/items/<item-id>.md`, the full `.kai/state/threads/<item-id>.md`,
   every `context_artifacts` path, and any private record the user named
   (including an existing `.kai/personal/consultations/<c-*>.md` from an earlier
   era — those records are still readable history and are never rewritten or
   deleted). The thread and item are truth; a stale `BOARD.md` row is not.
3. **Extract the options actually on the table.** List the real alternatives the
   supplied evidence or the thread/artifacts contain — including "do nothing /
   defer" when it is live. For each option capture its tradeoffs and **who holds
   that position**, sourced from the record. Separate a stated position from your
   own organizing.
4. **Name the gaps; do not fill them by asking around.** When a materially
   affected view is absent or a load-bearing fact is missing, record it as an
   unresolved fact with the reader who could supply it. Do not consult roles, do
   not dispatch anyone, and do not simulate a position to close the hole — an
   unsupported option is recorded as "no stated position", and an absent role
   view stays absent. If the user wants a real position, that is a separate
   request they make of that role directly.
5. **Assemble** the brief with the schema below. Attribute every position and
   preserve disagreement; do not blend stated views into a false consensus.
6. **Record privately** under `.kai/personal/decisions/<d-YYYY-NNNN>.md` in the
   ignored personal lane. If no workspace is selected, say that the brief cannot
   be persisted and return it in the response instead.
7. **Present and stop** at the user's decision boundary. Offer to execute each
   `your move` action on their explicit go-ahead — never before.

## Brief schema

Write one gitignored record:

```text
.kai/personal/decisions/<d-YYYY-NNNN>.md
```

Shape:

```markdown
# Decision — <short title>

**ID:** <d-YYYY-NNNN>  ·  **Packages:** <Q-item-id-NN | release-ready item-id | personal — no coordination item>
**Created:** <YYYY-MM-DD HH:MM local>
**Status:** open | decided | superseded
**Workspace:** <label>  ·  **Item:** <item-id> (`.kai/state/items/<id>.md`), or "—" for a personal decision
**Decide by:** <answer_by timestamp, or "no stated deadline">

## The decision
<the one question the user must answer, in one or two lines.>

## Why it's yours
<for a team decision: why no kai role owns it — a business/scope/irreversible/
credential call, or the deploy gate. For a personal decision: one line on what
kind of choice it is. One line either way.>

## Options
| # | Option | Key tradeoffs | Position held by | Provenance |
|---|--------|---------------|------------------|------------|
| A | <option> | <cost / risk / upside> | @<role>, "you", or "no stated position" | durable-thread \| supplied \| operator |
| B | <option> | … | … | … |
| — | Defer / do nothing | <consequence of waiting> | — | — |

## Unresolved facts
- <what is missing, why it matters to the choice, and who could supply it —
  never a guess presented as a finding>

## Recommendation
- **Lean:** <the option a stated position recommends, the option that best fits
  the user's own supplied criteria, or "no lean — balanced">
- **Held by:** @<whoever's recommendation this is>, or "criteria-derived:
  <the user criterion applied>". A substantive lean is never this skill's
  own judgment.
- **Confidence:** high | medium | low
- **Why:** <one or two lines grounded in the attributed positions above.>

## Blocked until you decide
- <item / peer / milestone that cannot move until this is answered, or "—">

## Your move
- **Personal decision:** <the single choice> → whatever you decide, you act on it; nothing here records or executes it for you.
- **Thread decision:** <the single choice> → once decided, **@<owning role or Chief of Staff> records the `@operator` ANSWER on the thread** and restores the item per `kai-core-work-acting`.
- **Deploy gate:** go → **you deploy** (kai never deploys), then hand the run evidence to `workflow-ship CONFIRM-START`; defer → stays `release-ready` with a recorded reason; cancel → lifecycle-authorized drop.
- <any dependent action you can green-light, and who runs it>

## Sources
- <exact supplied evidence / item / thread / artifact / private record paths read>

## Team bridge
<for a personal decision: "not team work — no bridge". For a team decision, how
it returns to the record once made: a thread decision needs the sanitized
`@operator` ANSWER the CoS or owning role appends (selected option + minimal
team-relevant rationale only — never a private path or personal reasoning); a
deploy gate needs the `workflow-ship` state/HANDOFF that follows deployment. A
private record alone is not completion.>
```

Never overwrite an earlier brief. A changed decision gets a new `d-` ID; a new
position on the same open decision appends a dated note to the same record.
Earlier records — including consultation records written by retired methods —
are history: read them, never rewrite or delete them.

## After the user decides

A **personal** decision ends with the user. Update the private brief to
`Status: decided` with the chosen option. Nothing is written to `.kai/state/`,
because nothing there was pending.

A **team** decision's outcome is team state, so it lands on the record through
the authorized role — **never** by this skill or its caller writing
coordination. Two paths:

**Thread decision.** The operator states the choice. The
`director-chief-of-staff` or owning role transcribes an `ANSWER` to
`.kai/state/threads/<item-id>.md` with the answerer as `@operator` and
`provenance: operator`, carrying only the sanitized selected option and minimal
team-relevant rationale — never a `.kai/personal/` path or private reasoning. Per
`kai-core-work-acting`, that role removes the question ID from
`waiting_on_questions` only if it is present, and restores the exact
`resume_state` only once **every** blocking question is answered, and only when
the role is authorized for that lifecycle transition.

**Deploy gate.** The operator deploys (kai never deploys), then supplies the run
evidence to `workflow-ship CONFIRM-START`; a deferral leaves the item
`release-ready` with a recorded reason; a cancel takes the lifecycle-authorized
drop path. The brief links the resulting `workflow-ship` state/HANDOFF, not an
ANSWER.

Then the private brief is updated to `Status: decided`, records the
chosen option, and links the authoritative thread `ANSWER` or ship HANDOFF.

The private brief is a worksheet. It never replaces the committed record, and a
durable **team** decision/ADR (`.kai/state/initiatives/<slug>/artifacts/decisions/`)
remains owned by the deciding role — not written here.

## Hard rules

1. **Never decide.** Present options, positions, and a sourced recommendation;
   the user chooses. You never answer the thread, approve scope, or deploy.
2. **Never invent a pending team decision.** A team brief packages what an
   authoritative `@operator` `kind: decision` question or a `release-ready` gate
   already shows. A personal decision needs no such record — and never gets one
   manufactured to look official.
3. **Positions come from their holder.** A role-attributed position or lean must
   be that role's real recorded position, never an inline simulation. This skill
   may organize and compare; it never supplies a substantive lean as its own
   judgment.
4. **Record gaps, don't go collect them.** A missing position or fact is written
   down as unresolved, with who could supply it. No consultation, no dispatch,
   no invented consensus.
5. **Preserve disagreement.** Do not manufacture consensus or hide the losing
   option's advocate.
6. **Private stays private.** The brief lives only under the selected
   workspace's ignored `.kai/personal/decisions/`; never commit it, and never
   disclose more personal context than the brief's reader needs.
7. **The record is truth.** A team decision returns to the coordination thread or
   ship record through the authorized role; the brief only points at it.
8. **Bridge only sanitized fields.** The team-facing record gets the selected
   option and minimal team-relevant rationale; a `.kai/personal/` path, the private
   brief, or personal reasoning never enters committed coordination.
9. **History is read-only.** Existing private decision and consultation records
   stay exactly as written.

## Output contract

Return:

```text
Decision brief: <d-id + open|decided>
Packages: <Q-item-id-NN | release-ready item-id | personal>
Record: <absolute .kai/personal/decisions/<d-id>.md path, or "not persisted — no selected workspace">
Options: <count, with the recommended lean or "balanced">
Recommendation: <one line + who holds it, or "no lean">
Unresolved: <what is still missing, or none>
Blocked until decided: <one line or none>
Your move: <the single decision + who records it on your go-ahead>
```

## Anti-patterns

- ❌ Making the call yourself, or nudging the user past a genuinely balanced
  choice.
- ❌ Briefing a `proposed` item as an operator decision — that is steward
  promotion.
- ❌ Attributing a position to a role you actually simulated inline.
- ❌ Consulting, dispatching, or polling roles to complete a brief.
- ❌ Requiring a coordination item, an `@operator` question, or a deploy gate
  before helping with a personal choice.
- ❌ Treating a stale `status: open` line as an open decision when a matching
  `ANSWER` exists.
- ❌ Writing the outcome into `.kai/state/` yourself instead of routing it to
  the Chief of Staff or owning role.
- ❌ Storing the brief anywhere but the selected workspace's ignored `.kai/personal/`.
- ❌ Editing or deleting an existing private decision or consultation record.

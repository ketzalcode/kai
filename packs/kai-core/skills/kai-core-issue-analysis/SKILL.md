---
name: kai-core-issue-analysis
description: "Issue-to-approach analysis. Use when grounding an issue, testing decisive assumptions, framing options, and stopping at the authorized decision owner."
tools: [execute, read, search, ask_user, web]
---

# Issue Analysis

Every step after an approach is chosen has an owner. The step that *chooses* it
has none — so it gets improvised, and the improvisation is usually "read the
issue, believe it, start typing."

This skill owns the span between **an issue exists** and **an approach is
chosen**. It is a discipline about what you establish before you commit, not a
method for doing the work itself.

## Where it sits

```text
ISSUE-ANALYSIS      research-before-coding   pr-sizing      kai-core-pr-delivery
──────────────      ──────────────────────   ─────────      ───────────
issue  ──►  a   ──► investigate the      ──► split into ──► land one
chosen approach     code for THAT            increments     pull request
                    approach
```

| Question | Owner |
|---|---|
| Is this issue real, current, and correctly premised? | **this skill** |
| What approach should we take, and what does it cost? | **this skill** |
| How does the existing code constrain that approach? | `research-before-coding` |
| How is the work split? | `pr-sizing` |
| Were alternatives fairly considered *in a document*? | `review-alternatives` |
| Packaging a decision already recorded in coordination state | `kai-core-decision-brief` |
| How does it reach `main`? | `kai-core-pr-delivery` |

`kai-core-decision-brief` is the closest neighbour and the boundary matters: it packages a
decision **already pending** in authoritative state. This skill is what
determines there is a decision worth making at all.

## 0 — Proportionality: which path this issue earns

Not every issue deserves ceremony. Running the full loop on a typo fix is its own
failure, and produces manufactured alternatives nobody needed.

**Fast path** — the issue is unambiguous, reversible, and single-owner (a typo, a
broken link, a one-line doc correction, an obviously-correct small fix):

1. Confirm it is current and not already fixed.
2. Restate it in one sentence.
3. State the approach.
4. Say explicitly that **no material assumption and no viable alternative
   required analysis** — so the reader can tell the loop was considered and
   skipped, not forgotten.

**Full path** — required when *any* of these holds:

- the premise is uncertain, disputed, or the issue may be wrong about itself;
- more than one viable approach exists;
- it crosses modules, roles, or ownership boundaries;
- it adds or changes an agent, skill, contract, schema, or user-facing flow;
- the choice is hard to reverse;
- the acceptance criteria look unprovable or hand-wavy;
- it may be stale or a duplicate;
- the blast radius is large.

State which path you took and why. A silent fast path is indistinguishable from
not having thought.

## 1 — Ground it before proposing anything

An issue's framing is a **hypothesis**, not a specification. Before designing
anything, establish what already exists:

- Does a skill, agent, script, or convention already cover this — possibly under
  a different name? Search the inventory, do not rely on recall.
- Has it been tried or rejected before? Check history, closed issues, and any
  related PRs.
- Is there an adjacent owner whose lane this actually falls in?

**Show the grounding, do not assert it.** Name the searches you ran and the
nearest thing you found: *"searched for X, Y, Z; the closest is `<thing>`, which
differs because …"* — or say plainly that nothing matched and what you looked
under. "Nothing like this exists" with no visible search is the same
unverified confidence this skill forbids one section later; the difference is
only that it is harder to catch.

The failure this prevents is real and repeats: **building a second thing that
does what an existing thing already does**, because the issue described a problem
in vocabulary the existing solution did not use.

## 2 — Verify the decisive assumption empirically

This is the highest-value step in the loop and the one most often skipped.

Every approach rests on at least one fact that, if false, invalidates it. Name
that fact out loud, then **check it** — do not reason about it.

- Does that flag actually exist? Run `--help`.
- Does that tool actually render that? Look it up in current documentation.
- Is that constraint actually a constraint? Reproduce it in a scratch directory.
- Does that file actually say what the issue claims? Open it.

Two rules make this trustworthy:

- **Experiments are isolated.** Verify in a temp directory or scratch clone.
  Never mutate the target repository, its history, or anything shared in order to
  satisfy curiosity. This does not conflict with the workspace-root rule you
  inherit: **durable work state** belongs in the resolved workspace root, while a
  **disposable experiment** belongs in a temp or scratch location and is never
  promoted into state. If you want to keep what an experiment showed, report it —
  do not leave the scratch directory behind as evidence.
- **Time-box it.** Stop once the decisive uncertainty is resolved. This step is
  not permission for unbounded investigation.

The reason it is non-negotiable: **your confidence is not evidence.** A
confident, well-argued position that was never checked has been wrong here
before — including when arguing against the person who filed the issue. A
two-minute experiment settles what an hour of reasoning cannot.

If a fact cannot be established, it stays an **explicit unknown**. It does not
quietly become an assumption.

## 3 — Restate the problem before proposing a remedy

Write the problem back in your own words, including:

- what is **observed** versus what was **expected**;
- the **goal** and, where it prevents drift, the **non-goals**;
- **constraints** that bound any solution — compatibility, reversibility,
  ownership, dependencies, deadlines.

If the restatement is wrong, everything after it is wasted. Making it explicit is
what lets someone correct you cheaply.

Add a diagram — per `build-diagrams`, ASCII by default — when the problem is
**structural**: it changes a shape, a flow, an order, a state machine, or an
ownership boundary. Not by reflex, and not for a problem a sentence covers.

## 4 — Frame the decision

For a full-path issue, present the genuinely viable approaches — **as many as
actually exist, and no more.** Two real options beat four with two strawmen.

Each option carries what it **costs**, not just what it does. Where one is
recommended, name the criterion the recommendation turns on ("cheapest to
reverse", "does not add a new contract") so the reader can disagree with the
criterion rather than with the conclusion.

Include the options that are easy to forget: **do nothing**, **defer**, **a
smaller first step**, and **close the issue**.

When the deciding fact cannot be settled by a bounded, isolated experiment —
because only a throwaway prototype in the real code would answer it — then
**"run a time-boxed spike, owned by an implementing role" is itself a legitimate
option to frame.** Say what the spike must answer and what would end it. That is
a better outcome than declaring the issue blocked because the question was too
expensive to answer from the outside.

## 5 — Stop at the authorized decision owner

**Analysis ends in a decision request. It does not slide into implementation.**

Stopping is not the same as escalating to the operator. Route to whoever owns the
call:

| Situation | Who picks |
|---|---|
| Directly invoked by the operator | the **operator** |
| Coordinated work with an owning role | that **principal / steward** |
| Scope, priority, or product fit | `principal-product-manager` |
| No kai role owns it, or the operator reserved it | `@operator` |

Per `kai-core-team-operating-rules`, `@operator` is a reserved endpoint, not a general
fallback. Routing every approach decision to the human is its own failure — it
bypasses the roles that exist to own these calls.

## 6 — A bad issue is a finding, not an obstacle

Some issues should not be built. Reporting that is a **successful outcome**:

- **stale** — already fixed, or overtaken by other work;
- **duplicate** — say which issue it duplicates and propose consolidating;
- **wrong premise** — the behavior it describes is not what the code does;
- **not the real problem** — it prescribes a solution to an unstated problem that
  has a better answer;
- **several issues wearing one hat** — propose the split;
- **not issue-shaped at all** — it is really an initiative, and belongs to
  `workflow-initiative-init`; or it cannot be framed until someone has explored
  the live product (`product-exploration`); or it carries a security or privacy
  dimension that its owner should see before an approach is chosen.

Recommending "close this" or "reframe this" is a legitimate result. Building
something you believe is wrong because an issue asked for it is not diligence.

## 7 — Classify the acceptance evidence honestly

For each acceptance criterion, say how it will actually be proven:

| Class | Meaning |
|---|---|
| **CI-provable** | an automated check can assert it |
| **Manually verifiable** | a human can confirm it, and how |
| **Externally observable** | needs a real endpoint, credential, or environment |
| **Not presently provable** | say so plainly |

Marking a criterion *not provable* is honest and useful. Inventing a test that
appears to cover it is worse than admitting the gap, because it converts a known
limitation into a false assurance.

## Hard rules

1. **Never begin implementing during analysis.** Analysis ends with a decision
   request.
2. **Verify the decisive assumption; never assert it.** If it cannot be verified,
   it is an unknown, stated as such.
3. **Experiments are isolated.** Never mutate the target repository to test a
   hypothesis.
4. **Ground before proposing.** Search what exists first.
5. **Stop at the authorized decision owner**, and do not default to `@operator`.
6. **Report a bad issue rather than building it.**
7. **State which path — fast or full — you took.**
8. **Never manufacture an alternative** to reach an option count.

## Anti-patterns

- ❌ **Reading the issue and starting to type.** The single most common failure.
- ❌ **"This should work" as the basis of a design.** Check it.
- ❌ **Four options where two are viable.** Strawmen make the recommendation look
  inevitable and waste the reader's judgment.
- ❌ **Escalating everything to `@operator`** because stopping felt safe.
- ❌ **Treating the issue text as authoritative** about the code it describes.
- ❌ **Ceremony on a typo.** Proportionality is part of the discipline.
- ❌ **Silently dropping a criterion** that turned out to be unprovable.

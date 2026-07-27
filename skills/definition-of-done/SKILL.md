---
name: definition-of-done
description: "The shared behavioral contract defining release readiness and production completion. Its six-dimension gate moves an item from in-review to release-ready only when scope, verification, review, safe rollout, documentation, and coordination are clear or honestly waived. `shipped` is a later claim: the human deployed and proportional production verification passed. Any readiness or production gap bounces/blocks with a named owner. Kai never performs the irreversible deployment itself."
tools: [bash, view, grep, glob, web_search, web_fetch]
---

# Definition of Done

An item reaches `shipped` on the board only when it is **actually done** —
not when the code compiles and someone feels good about it. This contract
is the **gate** between `in-review` and `release-ready`: the fixed, minimal set
of things that must be true before a slice goes to production, and the
rule for what happens when one of them isn't.

It is **not** a standalone trigger skill. The `workflow-ship` agent
**owns and runs** this gate at the `in-review -> release-ready` transition,
then confirms deployment and production verification before `shipped`. Every
acting agent also **self-checks** against it before moving its own item to
`in-review`, the same way `review-*` lenses inherit `doc-review-rigor` and
`scope-discipline` rides with the roles that can act.

## The core stance

**Done is a claim about production, not about the diff.** "It works on my
branch" is the *start* of done, not the end. The gate exists because the
expensive failures — a broken rollout, a silent scope creep, an
un-reversible migration, an operationally orphaned service — are exactly
the ones that look fine at the diff and only bite after the item is
called "shipped."

Two failure modes it guards against symmetrically:

- **Shipping too loose** — marking `shipped` with no verification, no
  rollback, no owner. The gate catches this and **bounces**.
- **Gating too hard** — demanding canary infra and a runbook for a
  one-line, instantly-reversible copy fix. The gate is **proportional**:
  rigor scales to blast radius. Inventing requirements the repo doesn't
  have is its own failure.

## The six dimensions

Run every dimension. Each resolves to **Clear**, **Gap**, or
**Waived-with-reason** (proportionality — a dimension that genuinely
doesn't apply to this change is waived, not faked-Clear).

| # | Dimension | The question | Clear when… |
|---|-----------|--------------|-------------|
| 1 | **scope-true** | Did we build the thing we agreed to, and only that? | The diff satisfies the item's `needs`/acceptance from its thread and stays inside the initiative's `scope.current`. Anything scope-expanding was rerouted as a `PROPOSAL` (per `scope-discipline`), not smuggled into this diff. |
| 2 | **verified** | Do we *know* it works, or do we assume it? | Implementing principals' automated tests + build are green; relevant independent QA/system checks ran when applicable; for a user-facing surface, UI/UX validation is linked rather than assumed. |
| 3 | **reviewed** | Were required independent reviews completed for this exact change and findings resolved? | Every `review_requirements` entry has an evidenced `completed_reviews` verdict whose `change_ref` matches the current item; findings are addressed or explicitly deferred as PROPOSALs. |
| 4 | **shippable-safely** | Can this go out safely and come back? | There is a rollout + reversibility story **proportional to blast radius** — staged/flagged where risky, a rollback or kill switch, named monitoring signals, and an owner. Run the `review-rollout-operability` lens here. |
| 5 | **documented** | Will the next person understand what shipped? | Reusable decisions/designs are promoted to `library/`; user-facing / operational docs are updated; the serving initiative's `log.md` gets the ship entry. |
| 6 | **coordination-closed** | Is the release handoff complete for the team? | The authoritative item record is current, the deploy HANDOFF is on the thread, no blocking questions are open, dependencies are truthful, and parked ideas are in the committed backlog. |

Dimension 4 **reuses `review-rollout-operability`** — don't re-derive the
rollout/reversibility questions; apply that lens and record its verdict.

Document lenses are not formal approvals. When `review_requirements` names
`principal-security` (`independent-security`) or `principal-sre`
(`reliability-operability`), only their evidence against the exact current
`change_ref` clears dimensions 3/4. A waived BLOCK/NOT-READY remains visible as
waived residual risk; it is never relabeled Clear/Ready.

## The readiness gate rule

```
all six dimensions Clear or Waived-with-reason  ─►  RELEASE-READY
any dimension is a Gap                           ─►  BOUNCE
```

- **RELEASE-READY** — every dimension is Clear or explicitly Waived. Produce
  the ship record, move the item to `release-ready`, and hand the operator the
  exact deploy plus production-verification steps.
- **BOUNCE** — at least one Gap. Set the item back to `in-progress`
  (or `blocked` if it has an unresolved dependency/question), append a `HANDOFF`
  naming **the specific gap and the role that owns the fix**, and stop.
  A bounce is a normal, healthy outcome — it's the gate doing its job.

**Production completion is separate.** After the human deploys, `workflow-ship`
records deployment evidence, moves through `production-verification`, and
marks `shipped` only after the proportional checks pass.

## kai never deploys

The gate **decides** done and **records** how to ship — it does **not**
perform the ship. Consistent with every other kai agent (which never
auto-posts, auto-pushes, or auto-sends), `workflow-ship` **never** merges,
tags, deploys, runs migrations, or pushes to production. It writes the
exact commands/steps into the ship record's **deploy handoff**, and the
**human runs them**. Automating the irreversible act is out of scope by
design.

## Proportionality — match rigor to blast radius

| Change | What the gate actually requires |
|--------|--------------------------------|
| One-line copy / flag flip, instantly reversible | verified (it renders), scope-true, coordination-closed. Dims 4–5 mostly **Waived** — say so. |
| A normal feature slice behind a flag | all six, lightweight: a flag + a "turn it off" line is a valid dim-4. |
| A migration / data backfill / new service | dim-4 is load-bearing — reversibility, expand-then-contract, backfill idempotency, alerts, an owner. Hit it hard. |

Waiving a dimension is legitimate **only** when the change genuinely
doesn't implicate it, and the waiver names why. "We didn't have time" is a
**Gap**, not a waiver.

## Hard rules

1. **Run all six; resolve each to Clear / Gap / Waived-with-reason.** No
   dimension is skipped silently.
2. **Any Gap bounces the item.** Name the gap and the owner role; set the
   authoritative item state back. Never mark `release-ready` or `shipped` over
   an open Gap.
3. **Evidence, not assertion.** "Tests pass" links to the run; "reversible"
   points at the flag/rollback; "QA passed" links the report. An unbacked
   Clear is a Gap.
4. **Nothing silently dropped.** A review finding you're not fixing is a
   `PROPOSAL` in the backlog, not a deleted comment.
5. **Proportional, never invented.** Match rigor to blast radius; don't
   demand controls the repo doesn't have and doesn't need.
6. **kai never performs the deployment.** Produce the record and steps; the
   human executes. Kai may record safe read-only verification afterward.

## Anti-patterns

- ❌ Marking `shipped` because the branch is green — green is dim-2 alone,
  not done.
- ❌ A "reversible" claim on a destructive migration nobody checked — that's
  a **Contradicted** rollback story, a Gap, not a Clear.
- ❌ Faking a Clear to avoid a bounce. The bounce is the point.
- ❌ Demanding a runbook + canary for a trivial reversible flip — gating
  theater; waive dims 4–5 and say why.
- ❌ Auto-deploying "to be helpful." kai records; the human ships.
- ❌ Dropping a review finding to clear dim-3. Defer it as a proposal.

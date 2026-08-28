---
name: review-rationale
description: "Rationale review lens. Use when pressure-testing a doc's problem statement, premises, reasoning chain, or why this solution follows."
tools: [execute, read, search, web]
---

# Review: Rationale

This is the **rationale lens**. It tests the spine of the argument: is
the problem real, stated correctly, and does the reasoning from problem
to proposed solution actually connect?

Inherits **`doc-review-rigor`** — extract load-bearing claims, ground
each, classify (Holds / Unproven / Inference / Contradicted / Dropped /
Noise), run the two value filters. This skill only adds *what to hunt
for* in the rationale.

## When this lens applies

Almost always. Every PRD, RFC, design doc, strategy doc, and dev-design
proposal makes a case that something should happen. This lens tests
that case.

**Skip only** for pure reference docs (a runbook, an API reference)
that aren't arguing for a decision.

## What's load-bearing here

Hunt for the claims the decision actually rests on:

- **The problem statement.** Is the stated problem the *real* problem,
  or a symptom? Is it backed by evidence (data, a user report, an
  incident) or asserted? A doc that solves a problem nobody has is the
  most expensive kind.
- **The premises.** List the "because X" claims the argument leans on.
  Each is a load-bearing claim — ground it. A single false premise can
  collapse the whole case.
- **The problem→solution link.** Does the proposed solution actually
  address the stated problem, or a different one? Watch for the
  solution-in-search-of-a-problem: an exciting approach justified by a
  problem reverse-engineered to fit it.
- **The "do nothing" baseline.** What happens if we don't do this? If
  the doc never establishes the cost of inaction, the urgency is
  unproven.
- **Causal claims.** "This will increase retention," "this reduces
  load" — these assert cause and effect. Is the mechanism explained, or
  assumed?

## Common failure patterns

- **Asserted problem, no evidence.** "Users find onboarding confusing"
  with no data, no quote, no funnel number → **Unproven**.
- **Symptom framed as root cause.** The doc fixes the visible symptom;
  the real cause sits one layer down and will resurface → finding that
  the problem statement is **Inference**.
- **Missing reasoning step.** Problem → [gap] → solution. The leap from
  one to the other is never argued → **Inference** or **Unproven**.
- **Circular justification.** "We should build X because X is the right
  approach." No independent reason → flag it.
- **Stale premise.** A "because the system can't do Y" that the code
  now *can* do → **Contradicted** (cite the code).

## Mapping to the taxonomy

- A premise you verified true and the decision leans on → **Holds**
  (record the strong ones briefly).
- A premise asserted with no evidence you could find → **Unproven**.
- A causal "this will cause that" stated as certainty → **Inference**.
- A premise the code or data flatly disproves → **Contradicted**.
- A caveat about the reasoning the doc raised then dropped → **Dropped**.

## Anti-patterns for this lens

- ❌ Arguing for *your* preferred problem framing instead of testing
  the author's. Test what they argued; don't substitute your thesis.
- ❌ Treating an unstated assumption as a flaw automatically — some are
  fine to leave implicit. Only flag the load-bearing ones.
- ❌ Demanding evidence for self-evident premises. Calibrate the
  confidence bar to how much the decision rests on the claim.

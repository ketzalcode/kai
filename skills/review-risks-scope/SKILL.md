---
name: review-risks-scope
description: "The risks-and-scope lens of a document review — are the real risks named and mitigated, or hand-waved? Is scope drawn tightly (what's explicitly IN and OUT), or open-ended? Are assumptions stated as assumptions or smuggled in as facts? Were risks raised early then quietly dropped by the conclusion? Inherits the doc-review-rigor method (load-bearing claims, grounding, six-class taxonomy, value filters). Invoked by the workflow-doc-review orchestrator (or directly when the user asks to check risks and scope). NEVER auto-posts."
tools: [bash, shell, view, grep, glob, web_search, web_fetch]
---

# Review: Risks & Scope

This is the **risks-and-scope lens**. It tests two things the optimistic
author tends to underweight: what could go wrong, and how big this
really is.

Inherits **`doc-review-rigor`** — extract load-bearing claims, ground
each, classify, run the two value filters. This skill adds *what to hunt
for* in risks, assumptions, and scope boundaries.

## When this lens applies

Almost always. Every proposal carries risk and has edges. This lens
fires on PRDs, RFCs, design docs, dev-design proposals, and strategy
docs alike.

## What's load-bearing here

**Risks:**

- **Named vs real.** Does the risk section list the risks that actually
  threaten the outcome, or comfortable risks ("adoption might be slow")
  while the real one (a hard dependency, a data-migration hazard, a
  security exposure) goes unmentioned?
- **Mitigation that mitigates.** For each named risk, is there a
  mitigation that would actually reduce it, or a sentence that restates
  the hope? "We'll monitor closely" is not a mitigation.
- **The dropped risk.** A risk or caveat raised in an early section that
  the conclusion quietly ignores. This is the highest-value catch of
  this lens → **Dropped**.

**Assumptions:**

- **Stated as assumption vs smuggled as fact.** "Assuming traffic stays
  under N" is honest. The same claim asserted flatly in the middle of
  the design is a buried assumption. Surface the load-bearing ones.
- **Fragility.** Which assumptions, if wrong, break the whole plan? Are
  those the ones the doc leans on hardest without flagging?

**Scope:**

- **Explicit IN and OUT.** Does the doc say what it is *not* doing? An
  unscoped proposal expands silently and busts its own estimates.
- **Hidden scope.** Work implied but never counted — a migration, a
  backfill, a client update, a doc rewrite, a deprecation.
- **Scope that doesn't match the goal.** Too big (gold-plating beyond
  the problem) or too small (won't actually solve it).

## Common failure patterns

- **Risk theater.** A risk table full of low-severity, easily-mitigated
  risks while the one that matters is absent → finding that the risk
  coverage is **Unproven** / incomplete; name the missing risk.
- **"We'll handle that later."** A real risk deferred with no owner or
  trigger → **Dropped**.
- **Buried assumption.** A load-bearing "the API is idempotent" stated
  as fact when it isn't verified → **Unproven** or **Contradicted**
  (check the code).
- **Open-ended scope.** No "out of scope" section; the plan's size is
  whatever it turns out to be → flag the missing boundary.
- **Uncounted adjacent work.** The design needs a schema migration the
  doc never mentions → **Dropped** / hidden scope.

## Mapping to the taxonomy

- A risk section you verified is complete and honestly mitigated →
  **Holds**.
- An assumption load-bearing but unverified → **Unproven**.
- An assumption presented as fact that's actually a judgment call →
  **Inference**.
- An assumption the code/data disproves → **Contradicted**.
- A risk or caveat raised then abandoned by the conclusion → **Dropped**.
- A risk listed that's real but immaterial to the decision → **Noise**
  (only flag if it's crowding out the ones that matter).

## Anti-patterns for this lens

- ❌ Inventing catastrophic risks that don't fit the context to look
  rigorous. A risk is only a finding if it's plausible and material.
- ❌ Treating every implicit assumption as a defect. Only the
  load-bearing, fragile ones.
- ❌ Demanding an exhaustive out-of-scope list for a tiny, well-bounded
  change.

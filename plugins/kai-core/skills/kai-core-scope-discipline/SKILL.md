---
name: kai-core-scope-discipline
description: "Use when a request, finding, or recommendation may expand approved scope, create durable work, or require adoption authority."
durable-output-producer: false
tools: [read, execute, search, ask_user]
---

# Scope discipline

Separate:

- what the caller directly authorized;
- what current Direction and hierarchy already approve;
- what is only a proposal;
- what requires a named authority decision.

## Direct advice

For a direct request, use the supplied brief, evidence, and constraints. A
bounded direct answer may include an inline or conversational proposal. It does
not need to onboard or initialize a workspace merely to answer.

The answer is advice, not adoption or a coordinated completion record. Do not
edit product scope, create hierarchy records, or start implementation unless
the caller directly authorized that bounded work.

## Coordinated grounding

Before classifying durable or coordinated scope:

1. Load current `docs/kai/DIRECTION.md`.
2. Read the exact Epic, Feature, Requirement, and Task context from
   `.kai/core/runtime/coordination.sqlite`.
3. Identify the named scope authority and completion authority.
4. Compare the proposed change with Vision, Mission, the one observable,
   time-bounded Current Goal, Out of Scope, accepted parent outcomes, and Task
   acceptance.

SQLite is the **only coordination authority**. No Markdown backlog, board, or
scope log can authorize work.

## Classification

- **Inside current scope:** necessary to satisfy existing acceptance without
  changing the outcome, authority, priority, or public contract.
- **Clarification:** resolves ambiguity while preserving the accepted boundary.
- **Scope expansion:** adds a capability, audience, surface, dependency,
  durable convention, acceptance criterion, or risk decision not already
  authorized.
- **Separate proposal:** valuable work that belongs under another Feature or a
  new Epic.

Never unilaterally add a scope-expanding change because it seems small,
obvious, adjacent, or technically elegant.

## Durable proposal recording

Only named authority may turn a suggestion into a durable proposal. Until then,
keep it conversational.

The hierarchy record may declare a `proposal_channel`: a typed subject and
named authority for `question.open`, an approved parent `*.create` command, or
another explicit runtime route. The scope-owner owns that decision.

For a durable or coordinated proposal:

1. state problem, evidence, proposed change, benefit, cost, risk, and affected
   hierarchy;
2. name the exact scope authority;
3. submit to the declared `proposal_channel`;
4. create no Epic, Feature, Requirement, or Task until that authority approves;
5. after approval, use the owning hierarchy/stewardship command.

If no proposal channel or named authority exists, report the gap and keep the
proposal conversational. Do not create a fallback file.

## Stop rule

When authorization is ambiguous, stop at the smallest truthful deliverable:
answer, finding, patch, or proposal. Do not translate urgency into authority.

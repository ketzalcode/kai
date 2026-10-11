---
name: kai-core-scope-discipline
description: "Use when a request, finding, or recommendation may expand approved scope, create durable work, or require adoption authority."
tools: [read, execute, search, ask_user]
---

# Scope discipline

Separate:

- what the caller directly authorized;
- what a supplied approved contract or standalone Task already approves;
- what is only a proposal;
- what requires a named authority decision.

## Direct advice

For a direct request, use the supplied brief, evidence, and constraints. A
bounded direct answer may include an inline or conversational proposal. It does
not need to onboard or initialize a workspace merely to answer.

The answer is advice, not adoption or a coordinated completion record. Do not
edit scope, create a Task, or start implementation unless the caller directly
authorized that bounded work.

## Coordinated grounding

Before classifying durable or coordinated scope:

1. Read the exact supplied approval or standalone Task.
2. Identify the named scope authority and completion authority.
3. Compare the proposed change with the authorized outcome, acceptance,
   dependencies, touched areas, evidence, and review requirements.

For a Task, SQLite is the **only coordination authority**. No Markdown backlog,
board, or scope log can authorize work.

## Classification

- **Inside current scope:** necessary to satisfy existing acceptance without
  changing the outcome, authority, or public contract.
- **Clarification:** resolves ambiguity while preserving the accepted boundary.
- **Scope expansion:** adds a capability, audience, surface, dependency,
  durable convention, acceptance criterion, or risk decision not already
  authorized.
- **Separate proposal:** valuable work that needs its own authority decision.

Never unilaterally add a scope-expanding change because it seems small,
obvious, adjacent, or technically elegant.

## Durable proposal recording

Only named authority may turn a suggestion into a durable proposal. Until then,
keep it conversational.

For a durable or coordinated proposal:

1. state problem, evidence, proposed change, benefit, cost, risk, and affected
   contract;
2. name the exact scope authority;
3. submit through the supplied authority channel;
4. create no Task until that authority approves;
5. after approval, use the Task runtime or continue as bounded direct work.

If no proposal channel or named authority exists, report the gap and keep the
proposal conversational. Do not create a fallback file.

## Stop rule

When authorization is ambiguous, stop at the smallest truthful deliverable:
answer, finding, patch, or proposal. Do not translate urgency into authority.

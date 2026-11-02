---
name: research-before-coding
description: "Use before implementing a proposed code change when missing evidence could change whether or how to proceed. Not a general investigation entry point."
tools: [read, search, execute, skill]
user-invocable: true
argument-hint: "proposed code change or implementation-readiness question"
---

# Research Before Coding

Decide whether the available evidence is sufficient to implement the requested
code change, and resolve only the gaps that could change that decision. This
method does not implement, authorize a change, or add an approval ceremony.

## Activation

- Use for a proposed code change with an unresolved implementation decision.
- Small, clear tasks with established evidence can proceed with ordinary
  targeted reading and validation; do not require deep investigation.
- If explicitly invoked for a standalone investigation without a code change,
  explain this boundary and apply `engineering-investigation` to the actual
  question. Return that answer and stop without entering the readiness steps
  below. Do not invent an implementation task or require an intention to code.

## Method

### 1. Identify the implementation decision

Identify the proposed change, the decision evidence must settle, and the
consequential unknowns. Separate missing evidence from a missing requirement or
authority; research cannot supply either on the operator's behalf.

### 2. Reuse evidence before collecting more

Consume existing investigation findings, supplied sources, and applicable
repository context. Check that their scope, revision, environment, and
assumptions still apply. Do not restart completed research merely because this
method was invoked; revisit only a stale, conflicting, or consequential gap.

If the evidence already settles the decision, return readiness directly.

### 3. Resolve the smallest remaining gap

For a small local uncertainty, inspect the affected implementation, callers,
and relevant tests. Stop when the decision is supported.

When substantial unresolved behavior, integration, or capability questions
remain, apply `engineering-investigation` to those questions with the current
evidence and constraints. That method owns discovery and investigation; consume
its findings here rather than maintaining a second research procedure.

### 4. Return the readiness decision

State whether implementation is supported and the chosen approach when a
choice was requested. Cite the evidence and constraints that matter to that
conclusion.
If not ready, name the unresolved decision and the smallest verification or
operator input needed; do not manufacture confidence from incomplete evidence.

Return a concise handoff, not a mandatory plan, report file, sizing chain, or
workflow. Stop at the decision. A caller may then continue independently
authorized implementation; this method neither grants nor withdraws authority.

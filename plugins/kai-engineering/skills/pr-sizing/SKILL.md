---
name: pr-sizing
description: "Use when an authorized change may need delivery decomposition into more than one ordered, reviewable increment."
tools: [read, search]
user-invocable: true
argument-hint: "optional feature description"
---

# PR Sizing

Turn an authorized scope into proportional delivery decomposition. Return an
ordered proposal when splitting improves delivery, or conclude that one
coherent delivery needs no split.

## When to use

- The user asks how to sequence an authorized change.
- The work has real compatibility, rollout, review, or risk boundaries that
  may justify ordered increments.
- The caller cannot yet tell whether one coherent delivery or several
  increments is the safer proportionate answer.

Do not load this skill merely because implementation is about to begin. If the
authorized work is already one coherent delivery, continue it without a sizing
ceremony unless the user explicitly asks for a sizing decision.

## Method

### 1. Read the delivery constraints

Identify the intended outcome, compatibility obligations, rollout or reversal
needs, dependencies, and relevant validation. File counts, estimated diff size,
and elapsed time may provide context, but they do not decide the split.

### 2. Decide whether decomposition helps

Prefer one delivery when the change is a coherent concept that can be reviewed,
validated, and landed safely together. State **no split** and explain why.

Split only where an ordered boundary materially improves compatibility, risk,
review, rollout, or reversibility without creating coordination-only
micro-PRs.

A necessary small refactor may accompany its feature when separating them adds
no independent value. An independently useful or risk-reducing refactor may
also be its own increment.

Ordered increments may depend on earlier landed increments. Preserve
compatibility and safety at each landing point, and state the dependency. A
preparatory increment does not have to deliver the final user feature
immediately when it is a safe, meaningful step in a genuine migration.

Tests stay with the affected behavior. Do not separate tests into a later
increment.

### 3. Return the proposal

For one delivery:

```text
No split: <why this is one coherent, safe delivery>
Validation: <tests and checks that travel with the behavior>
```

For several deliveries, return an ordered proposal:

```text
1. <purpose>
   - Depends on: <earlier landed increment or none>
   - Landing safety: <compatibility, reversal, or risk boundary>
   - Validation: <tests and checks for affected behavior>
```

Stop after the proposal. Do not edit code, create branches or pull requests,
start an increment, or add a new approval step solely because this skill was
loaded.

After consuming the proposal, the caller may continue any independently
authorized implementation. Sizing neither grants nor withdraws that authority;
a plan-only request remains plan-only.

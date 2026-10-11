---
name: pr-sizing
description: "Use after a complete change or integrated diff exists and delivery may need one or more ordered, human-reviewable PRs."
tools: [read, search]
user-invocable: true
argument-hint: "optional completed diff or delivery goal"
---

# PR Sizing

Read the complete integrated diff and decide how the finished work reaches
review. Return one coherent delivery or an ordered proposal of independently
valid slices.

## One PR by default

Prefer one PR when the change expresses one cohesive behavior or structural
step that a reviewer can understand and validate together.

## Split only at safe review boundaries

Split only when compatibility, independent validation, rollout, reversal, risk
isolation, or reviewer comprehension materially improves.

A typical slice should aim for roughly four or five primary hand-authored files
when cohesion allows. This is a signal, not a cap. Tests stay with behavior;
generated files and synchronized metadata do not force another split.

Do not split solely because one part is client-side and another is server-side.
A server foundation may precede its client only when both merged states are
independently valid and testable.

## Slice contract

Each slice states one purpose, remains valid at that landing point, includes its
tests and scenarios, preserves later compatibility, names dependencies and
deferred work, and has a reversal story when applicable.

## Output

For one delivery:

```text
No split: <why this is one coherent, safe delivery>
Validation: <tests and checks that travel with the behavior>
```

For several deliveries, return an ordered proposal:

```text
1. <purpose>
   - Depends on: <earlier landed slice or none>
   - Landing safety: <compatibility, reversal, rollout, or risk boundary>
   - Validation: <tests and checks for affected behavior>
```

Stop after the sizing proposal. Do not edit code, create branches or pull
requests, or add a new approval step solely because this skill was loaded.

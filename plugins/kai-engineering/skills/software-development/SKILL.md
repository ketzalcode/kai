---
name: software-development
description: "Use when implementing or modifying product code for a feature, fix, refactor, or behavior change. Do not use for review-only, PR merge, release-only, deployment-only, prose-only, metadata-only, or generated-refresh work."
tools: [execute, read, edit, search, ask_user, skill]
user-invocable: true
argument-hint: "feature, fix, refactor, or behavior change"
---

# Software Development

Use the smallest process that makes the authorized change correct. Repository
instructions and task requirements govern; this skill adds no approval layer.

## Choose the smallest useful process

| Situation | Action |
| --- | --- |
| Clear bounded change | Inspect the affected path, implement the coherent change, and validate it directly. |
| Material ambiguity | Ask only for the decision that changes the implementation, then continue. |
| Architecture or risky cross-cutting change | Present a concise design and obtain approval before implementation. |
| Defect with uncertain cause | Reproduce the behavior and establish its root cause before editing. |

Do not turn ordinary local choices into operator decisions. Follow established
repository patterns and preserve unrelated work.

## Apply implementation guidance

Apply `coding-standards` alongside the repository's conventions. Apply the
relevant frontend or backend coding standards when the change touches that
domain. Use only concerns the change actually reaches; these are not universal
checklists.

## Use Lean TDD and validation

Define the expected behavior, material risk, and observable scenario before
coding.

- Use strict red/green for reproduced defects, stable pure logic, and clear
  contracts whose expected behavior is already known.
- Stabilize uncertain design before expanding tests. For evolving UI,
  architecture, or integration behavior, build the smallest coherent path and
  use fast checks or manual observation before encoding the final contract.
- Once behavior is sound, add or update focused tests at the layer that owns
  it. Tests assert behavior and contracts, not temporary implementation shape.
- Run named manual scenarios when they provide meaningful evidence.
- Run targeted tests by default. Escalate to broader suites only for
  cross-cutting risk, repository release rules, or an explicit request.

Investigate failures. Never weaken assertions or make failures look successful.

## Return an evidence handoff

Return the implemented outcome, changed surfaces, actual automated and manual
evidence, and remaining gaps. Do not claim evidence that was not observed.

Stop at the evidence handoff. Do not automatically start review, PR delivery,
merge, release, or deployment. Those are separate explicit actions.

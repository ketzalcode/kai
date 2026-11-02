---
name: deep-pr-review
description: "Use when a deeper PR or diff review is explicitly requested to assess affected contracts, consumers, state transitions, and cross-component consequences. Not a repository-wide audit or general investigation."
tools: [read, search, execute]
user-invocable: true
argument-hint: "PR or revisions; affected boundaries and requested review focus"
---

# Deep PR Review

Assess whether the changed behavior remains correct across its affected system
boundaries. Use this method for an explicitly requested deeper review, not as
an automatic consequence of PR size or an unanswered local question.

## Bound the assessment

Pin the exact revisions or working-tree snapshot, intended behavior, and
requested boundaries. Include relevant untracked files. For stacked work,
review each slice against its actual parent and assess assembled behavior when
the requested change spans the stack. A changed head invalidates the old verdict.

Read the requested diff and identify consequential contracts and assumptions.
Choose the relevant paths to trace; do not score every architectural dimension
or survey the whole repository.

## Trace affected behavior

Read the changed implementation and follow its producers and consumers far
enough to verify the affected contract. Prioritize concrete concerns:

- API or format changes: compatibility, defaults, errors, and downstream uses.
- Persistence or migration changes: old/new state, failure recovery, data
  integrity, and rollback assumptions.
- Authorization or ownership changes: identities, permission checks, tenant or
  resource boundaries, and reachable access paths.
- Asynchronous or concurrent work: lifecycle transitions, retries, cancellation,
  ordering, partial completion, and duplicate operations.
- Cross-component or user-visible flows: integration boundaries, relevant
  accessibility/localization behavior, and existing acceptance evidence.

These are scenarios, not a mandatory checklist. A mechanically large diff may
need little tracing; a small boundary change may need substantial reasoning.
Check maintainability and repository conventions where they affect the changed
behavior. For documentation-only work, assess claims and supported contracts
rather than applying unrelated code concerns.

## Challenge the evidence

Compare implementation, requirements, existing patterns, and tests. Look for
untested boundary and failure scenarios, misleading assertions, and stale
assumptions. Distinguish introduced defects from relevant pre-existing risks.

Run focused, authorized boundary or integration checks when they settle a
specific uncertainty. Broader suites need an actual cross-cutting risk or
repository requirement; do not run everything or write the author's tests.
Mark unavailable runtime or deployment evidence as unavailable.

## Do not turn review into research

Stay within the requested affected boundaries. If the verdict depends on
unknown platform behavior, missing design intent, or a wider architectural
investigation, explain the gap and request evidence or separate authorization.
Do not invoke a general investigation, spawn reviewers, redesign the system,
or implement a fix as part of this method.

## Return the assessment

Return Pass, Changes requested, or Inconclusive for the exact revision and
boundaries examined. Findings name priority, file and lines, triggering
condition, consequence, supporting evidence, and the smallest corrective
direction. Use P0 for critical reachable loss/compromise, P1 for material
blocking defects, and P2 for bounded nonblocking risks.

State which consequential paths were traced, actual checks, and unresolved
coverage limits. Do not require a finding quota or claim system-wide assurance.
Keep the reviewed product unchanged. If this run authored the change, disclose
self-review rather than claim independent acceptance. Return findings directly;
saved reports and posted comments require a separate request and authorization.

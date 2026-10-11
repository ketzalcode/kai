---
name: pr-review
description: "Use from eng-reviewer-code after an exact PR or diff is pinned to choose the minimum relevant review from its purpose, changed behavior, evidence, and risk triggers."
tools: [execute, read, search]
---

# PR Review

Use this internal method only from `eng-reviewer-code` after the exact base,
head, or immutable diff is pinned. It selects the minimum relevant review for
the change; it does not compete with the reviewer agent for natural-language PR
review requests.

## Review brief

Build this short brief first:

```text
Purpose: the accepted or claimed outcome
Changed behavior: what the diff actually changes
Affected surfaces: code, contracts, tests, UI, data, telemetry, operations
Evidence: requirements, issue, tests, screenshots, rollout notes
Risk signals: only concrete triggers visible in this change
```

## Choose the minimum relevant review

- Select only the lenses the brief justifies. Do not run every lens or assign a
  numerical risk score.
- Code changes receive requirements, correctness, contracts, regressions,
  changed-behavior tests, maintainability, and applicable
  `coding-standards` review.
- Docs or metadata-only changes skip code-only lenses.

## Route follow-up judgment to the right owner

- Route assembled UI, API, CLI, or system acceptance to quality when
  applicable.
- Route concrete security, privacy/compliance, and reliability triggers to
  their owners.
- Use `research-before-coding` only for a bounded unresolved fact that could
  change a finding.
- The general reviewer may identify a specialist trigger but never issue the
  specialist verdict.

## Revision handling

- Review stacked PRs against their real parent revision instead of the default
  branch when the stack changes the effective scope.
- Require end-to-end evidence on the final slice for behavior that spans the
  full stack.

# Nightshift Morning Report

Render one private report from current Core state and the runner ledger.
Markdown is a human-readable projection, never coordination authority.

```markdown
# Nightshift <run-id>

## Goal and approved scope

<Approved goal, bounded Tasks, optional planning projection, base revision, and approved limits>

## Delivered pull requests

| PR | Required outcome | Evidence | Intentionally not done |
| --- | --- | --- | --- |

## Blocked work

| Task/PR | What stopped | Why unsafe to continue | Decision owner | Recommended action | Resume point |
| --- | --- | --- | --- | --- | --- |

## Skipped work

| Slice | Reason | Dependency or limit | Next action |
| --- | --- | --- | --- |

## Suggestions for the morning

| Suggestion | Evidence or basis | Why deferred | Benefit | Cost/risk | Suggested priority |
| --- | --- | --- | --- | --- | --- |

## Run limits

<elapsed time, PR count, attempts, credits when observable, retained worktrees,
and terminal reason>
```

Rules:

- Keep delivered work, blockers, skipped work, and suggestions separate.
- Name exact PRs, revisions, Tasks, questions, evidence, and worktrees.
- State `unavailable` rather than estimating missing usage.
- State whether suggestion basis is observed or hypothetical.
- Do not turn a suggestion into a commitment, Task, issue, or accepted scope.
- If Core and the ledger disagree, report the mismatch and use Core.

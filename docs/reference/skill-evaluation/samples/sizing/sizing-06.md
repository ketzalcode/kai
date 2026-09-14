# Sizing assessment

The smallest sensible sequence is **2 PRs**.

## PR 1: Extract the duplicated local parsing into an internal helper

- **Scope:** Move the shared local parsing logic into one internal helper and update the two existing branches to call it.
- **Why this is reviewable and safe:** It is a pure refactor. The behavior stays the same, the diff is small, and the reviewer can check that both branches still produce the same result through the new shared helper.
- **Tests:** Run the existing parser tests that cover the unchanged paths.

## PR 2: Add the new validation behavior and its tests

- **Scope:** Use the extracted helper to add the new validation rule in the parser and add the acceptance test coverage.
- **Why this is reviewable and safe:** The refactor is already landed, so this PR contains one behavior change only. It is independently shippable because it adds a single validation path without needing any follow-up work.
- **Tests:** Add the validation-focused tests alongside the code change.

## Rationale for the split

This keeps the refactor separate from the feature, which is the smallest clean split that follows the stated rules. A single PR would mix a refactor and a behavior change, while any finer split would be a trivial intermediate step that would not ship useful behavior on its own.

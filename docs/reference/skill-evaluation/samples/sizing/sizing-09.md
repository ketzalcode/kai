# Sizing assessment

Smallest sensible sequence: **2 PRs**.

## PR 1: Extract the duplicated local parsing into an internal helper
- **Files:** the two implementation files that share the parsing logic, plus any existing tests that already cover the touched paths.
- **Why it is reviewable and safe:** this is a pure refactor. It keeps behavior unchanged, reduces duplication, and can be checked by comparing the before/after control flow in one sitting.
- **Tests:** existing parser tests should continue to pass unchanged.

## PR 2: Add the new validation behavior and its tests
- **Files:** the parser implementation and the corresponding tests.
- **Why it is reviewable and safe:** it introduces one coherent behavior change on top of the extracted helper. The scope is small, has one acceptance criterion, and does not add API, migration, deployment, or feature-flag complexity.
- **Tests:** add or update the parser tests that exercise the new validation path.

## Rationale
- The approved change explicitly contains a refactor plus a validation behavior.
- The refactor and the behavior change should not be mixed in one PR.
- PR 1 is independently shippable because it preserves behavior.
- PR 2 is independently shippable because it lands the single validation behavior with tests and depends only on the helper already in place.

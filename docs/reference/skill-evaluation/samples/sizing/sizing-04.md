# Sizing assessment

## Smallest sensible sequence

1. **Single PR: extract the duplicated local parsing into an internal helper, add the new validation behavior, and add the tests together.**

## Why this is the smallest safe increment

- The change is **one coherent behavior update** with one acceptance criterion.
- The helper extraction is **internal refactoring only** and is explicitly allowed within the approved change.
- There is **no public API rename**, migration, deployment ordering, new dependency, or feature flag.
- Splitting the helper extraction from the validation would create a review-only refactor with no standalone value, while splitting validation from the tests would leave behavior unverified.
- Keeping it in one PR makes the duplicated parsing change, the new validation path, and the test coverage reviewable in the same context.

## Assessment

This should **not** be broken into multiple PRs. The smallest sensible sequence is a **single reviewable PR** containing the refactor, validation, and tests.

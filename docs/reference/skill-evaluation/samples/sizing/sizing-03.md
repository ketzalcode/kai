1. Single PR: extract the duplicated local parsing into an internal helper, add the new validation in the parser branches, and add the tests for the acceptance criterion.

Why this is the smallest sensible sequence:
- The approved change is one coherent behavior change with one acceptance criterion.
- The helper extraction is explicitly permitted as part of the change and does not create a separate product increment.
- The scope is small: about 40 lines across two implementation files and their tests.
- There is no public API rename, migration, deployment ordering, new dependency, or feature flag that would force staging.
- Splitting the helper extraction from the validation would leave an incomplete, non-valuable intermediate state and add review overhead without improving safety.

Why this increment is reviewable and safe:
- The refactor is internal and only serves the two parser branches that already need the same local parsing logic.
- The behavioral change is isolated to the new validation rule, so reviewers can verify the parser still follows the existing paths and only rejects the new invalid case.
- The tests cover the acceptance criterion directly, making the change easy to validate in one pass.

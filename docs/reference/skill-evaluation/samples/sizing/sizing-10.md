# Sizing assessment

## PR 1: Extract the shared internal parse helper, add the new validation, and cover it with tests

- **Files:** the two implementation files that contain the duplicated local parsing, plus their tests.
- **Why this is reviewable and safe:** it is one coherent parser behavior change, the helper stays internal, and there is no public API rename, migration, deployment ordering, dependency, or feature-flag seam. The refactor is only the minimal extraction needed to make the validation clean.
- **Tests:** update the existing parser tests and add cases for the new validation path.

## Why this is the smallest sensible sequence

The approved change is already a single behavior change with one acceptance criterion and about 40 lines total. Splitting the internal helper extraction into its own PR would create an unshippable refactor-only step that is not independently useful. Keeping the extraction and validation together keeps the diff small, preserves review context, and matches the repository guidance that this helper extraction is allowed inside the approved change.

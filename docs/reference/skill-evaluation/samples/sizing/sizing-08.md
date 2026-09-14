# Sizing assessment

## Proposed sequence

**PR 1: Add the parser validation with the internal helper extraction**
- Files: the two implementation files that contain the duplicated local parsing, plus their tests.
- Why it is reviewable: this is one coherent behavior change. The helper extraction is a small internal refactor that exists only to support the validation logic, so the reviewer can follow the before/after in one diff.
- Why it is safe: it does not rename public API, require migration or deployment ordering, add dependencies, or need a feature flag. The change stays inside existing parser behavior and is covered by tests in the same PR.

## Rationale

This is the smallest sensible sequence because splitting the helper extraction from the validation would create an intermediate PR with no standalone value. The approved change already fits in about 40 lines and has one acceptance criterion, so a single PR is the right size: it is understandable in one sitting, independently shippable, and tested with the code it changes.

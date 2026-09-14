# Sizing assessment

## Proposed sequence

1. **Single PR:** extract the duplicated local parsing into one internal helper, then add the new validation behavior and its tests in the same change.

## Why this is the smallest sensible sequence

- The change is already described as **one coherent behavior change** with **one acceptance criterion**.
- The helper extraction is an **internal refactor only**. It does not change the public API, migration order, deployment order, feature flags, or dependencies.
- Keeping the extraction and validation together is safe because the helper is used only by the two existing branches it already serves, so the refactor stays localized.
- The tests for the new validation cover the behavior change directly, making the whole PR reviewable as one unit.
- Splitting this into multiple PRs would create an unnecessary intermediate state where the code is refactored but the approved behavior is still incomplete.

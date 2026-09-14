## Proposed PR sequence

1. **Single PR**
   - Extract the duplicated local parsing into one internal helper.
   - Add the new validation behavior in the two branches that use it.
   - Add or update tests for the validation.

## Why this is the smallest sensible sequence

- The change is already described as **one coherent behavior change** with **one acceptance criterion**.
- The helper extraction is an **internal refactor** that is explicitly permitted inside the approved change.
- There is **no public API rename, migration, deployment ordering, dependency change, or feature flag** that would require a staged rollout.
- Splitting the refactor and the validation into separate PRs would not improve safety much, because the helper exists only to support the new validation path and the whole diff stays small and locally reviewable.

## Rationale

This is safest as one review unit because reviewers can verify the refactor and the behavior change together:

- the helper preserves the existing parsing behavior where it is reused,
- the new validation is easy to trace in the two affected branches,
- the tests show the intended result without needing intermediate integration steps.

# Sizing assessment

## Smallest sensible PR sequence

1. **Single PR:** extract the duplicated local parsing into one internal helper, add the new validation behavior, and cover it with tests.

## Why this is the smallest sensible sequence

- The helper extraction is **internal** and explicitly permitted as part of the approved change.
- The extraction is not a separate product goal; it is the cleanest way to implement the one new validation behavior.
- The change has **one acceptance criterion**, no public API rename, no migration, no deployment ordering, no new dependency, and no feature flag.
- The repository already treats this kind of internal helper extraction as acceptable within the approved scope.
- Keeping the extraction, behavior change, and tests together makes the PR reviewable as **one coherent parser behavior change** and avoids splitting a tightly coupled implementation.

## Rationale for safety and reviewability

- The refactor stays within two implementation branches and does not alter external contracts.
- The validation is small and isolated, so it can be reviewed alongside the helper extraction that enables it.
- Tests provide the evidence for the new behavior and protect the refactor from accidental regressions.

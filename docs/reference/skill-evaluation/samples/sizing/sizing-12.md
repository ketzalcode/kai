No split: This is one coherent behavior change. The helper extraction is a
necessary internal refactor to remove duplicated local parsing in the same
parser, and it does not create a standalone product or compatibility boundary.
The validation belongs with that refactor because it touches the same parsing
paths and is only meaningful once the shared local parsing logic exists. The
scope is small, there is one acceptance criterion, and there is no public API
rename, migration, rollout ordering, feature flag, or dependency boundary that
would justify staged delivery.

Validation: Land the refactor, validation behavior, and the associated tests in
one PR. Review the helper extraction for semantic equivalence, then verify the
new validation cases and the existing parser branches covered by the tests.

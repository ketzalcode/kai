1. Add compatible storage and API handling for both name shapes.
   - Depends on: none
   - Landing safety: keeps existing `display_name` clients working while new code can start reading and writing `given_name` / `family_name`; no client is forced to switch yet.
   - Validation: request/response tests for old and new reads and writes; persistence tests that confirm `display_name` remains supported during the transition.

2. Run a resumable backfill from `display_name` into `given_name` and `family_name`.
   - Depends on: 1
   - Landing safety: data migration is isolated from client rollout and can restart safely after interruption; compatibility remains intact because the old field still exists.
   - Validation: backfill resume/retry tests; checks that partially migrated rows can be continued without corrupting either representation.

3. Retire old-client support and remove `display_name` only after callers have moved off it.
   - Depends on: 1 and 2
   - Landing safety: the removal happens only after the system no longer needs the legacy shape, so compatibility risk is bounded to the end of the migration instead of the middle.
   - Validation: regression tests for the final API contract; cleanup tests that confirm old reads/writes are no longer required before the field is dropped.

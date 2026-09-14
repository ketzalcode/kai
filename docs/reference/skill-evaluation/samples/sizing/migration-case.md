# Sizing boundary: real compatibility sequence

## Task

Propose reviewable delivery increments for the migration below, using the
attached sizing guidance. Return the sequence and why each state remains safe.
Do not execute the migration or open a PR.

## Constraints

- Existing clients read `display_name`.
- New clients will read separate `given_name` and `family_name` fields.
- Clients cannot all be deployed atomically.
- Existing reads/writes must remain supported during transition.
- Data needs a resumable backfill.
- Old fields may be removed only after old clients have been retired.
- No particular feature-flag system or new deployment platform is assumed.

A meaningful answer preserves compatibility and orders the dependent work.
Do not force the migration into one unsafe change or invent infrastructure
merely to satisfy a generic sizing rule.

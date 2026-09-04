# Release-documentation pattern

Use this pattern for release notes, changelogs, and migration guides. Describe
observable change rather than replaying commits.

## Release notes

1. State the user-visible outcome.
2. Group changes by reader impact.
3. Name compatibility, rollout, or availability limits.
4. Link to setup, reference, and migration instructions.
5. Separate shipped behavior from planned follow-up.

## Changelog entry

Use the repository's existing headings and ordering. Prefer Added, Changed,
Fixed, Deprecated, Removed, and Security when they apply. Include a migration
instruction for every breaking change.

## Migration guide

1. Who must migrate and from which versions.
2. Prerequisites and backup or rollback requirements.
3. Ordered changes with verification after each meaningful step.
4. Before-and-after examples for renamed or removed interfaces.
5. Known incompatibilities and recovery.
6. A clear completion check.

## Checks

- Claims describe released behavior supported by evidence.
- Breaking changes are prominent and actionable.
- Commit messages and internal implementation details appear only when they
  change user action.
- Version numbers, links, commands, and rollback steps are verified.

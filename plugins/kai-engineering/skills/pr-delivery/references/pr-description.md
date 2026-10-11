# PR description reference

Use verified facts from the final delivery slice. State `Pending decision` or
`Not applicable` rather than inventing content.

## Overview

One sentence describing the behavior changed by this PR, followed by two to
four bullets covering changed behavior, deliberately preserved behavior, and
the important scope boundary or dependency.

## Scoped architecture

Include one small ASCII diagram when caller flow, ownership, state, or
dependency order is materially clearer visually. Omit the section when the
diagram adds no information.

## Validation scenarios

| Scenario | Configuration / action | Expected result | Evidence |
| --- | --- | --- | --- |
| Primary behavior | Exercise the accepted path | Accepted observable result | Exact test, command, screenshot, or other evidence |

Use proportional scenarios for the slice. User-visible UI changes include
usable uploaded screenshots. Automation owns live status and changing counts;
the description owns durable behavior and evidence not visible elsewhere.

## Rollout and removal gates

Use this section only for flags, migrations, compatibility paths, staged
rollout, rollback, or later cleanup.

### Feature-flagged migration profile

| Scenario | Purpose |
| --- | --- |
| Default/inactive | Existing path and explicit default remain intact |
| Enabled success | New path returns the accepted behavior |
| Compatibility/error | Caller contracts, failure behavior, cancellation, timeout, and telemetry remain correct |
| Rollback | Disabling or reverting returns to the preserved path |

Distinguish code-ready, enabled, validated, and complete. State configuration,
first enablement, broader-rollout evidence, rollback, and legacy-removal
conditions once.

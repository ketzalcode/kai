# PR description reference

Use verified facts from the final delivery slice. When a fact is not settled,
use `Pending decision` or `Not applicable` rather than inventing content.

## Overview

One sentence describing the behavior changed by this PR, followed by two to
four bullets covering changed behavior, deliberately preserved behavior, and
the important scope boundary or dependency.

## Scoped architecture

Include one small ASCII diagram only when caller flow, ownership, state, or
dependency order is materially clearer visually; omit the section when it adds
no information.

## Validation scenarios

| Scenario | Configuration / action | Expected result | Evidence |
| --- | --- | --- | --- |
| Primary behavior | Exercise the accepted path | Accepted observable result | Screenshot, migration observation, or other durable reviewer evidence |

Use proportional scenarios for the slice. User-visible UI changes include
usable uploaded screenshots. Evidence is only durable reviewer-facing material
not already visible in automation. CI owns commands, pass/fail status, changing
counts, and revision-bound review results. Do not add a separate
validation-results summary.

## Rollout plan

Include this section only when the PR has an actual rollout plan: a feature
flag, migration sequence, staged enablement, compatibility window, or
operational rollback. A removal, version change, or deferred follow-up by
itself does not trigger this section; keep those boundaries in `Overview`.

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

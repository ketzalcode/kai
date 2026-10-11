---
name: pr-review-comments
description: "Use after verified review findings exist to draft or, with current authorization, post concise actionable pull-request comments."
tools: [execute, read, search]
user-invocable: true
argument-hint: "verified finding(s), PR, or review output"
---

# PR Review Comments

Start from already-verified findings. Do not create a new review verdict or
re-judge whether the issue is real.

## Default shape

```text
<Observed behavior and triggering condition>
<Why it matters>

<Calibrated question or required outcome>
```

There is no mandatory `Suggestion:` label.

## Tone calibration

### Uncertain intent

This value now controls both the outbound dependency and the trusted inbound
identity. Are those contracts guaranteed to change together in every
environment, or should they remain independently configurable?

### Verified defect with corrective options

This fallback converts a timeout into an empty result, so callers cannot
distinguish "no records" from "the dependency failed."

Could we preserve the timeout error so callers can keep handling those states
separately?

### Required change

This branch emits the existing event name with a different field meaning,
which would silently change the dashboards and alerts that consume it.

We should preserve the current event contract here, or make the telemetry
change an explicit part of this work with its consumers updated.

## Anti-examples

- Excessive hedging: "What do you think about maybe considering whether this
  could potentially be changed?"
- Personal blame: "You implemented this incorrectly and need to rewrite it."

## Comment boundaries and posting

- One finding per comment.
- Use the best changed-line anchor for the finding.
- When no honest inline anchor exists, use a general review comment instead.
- Keep any example or proposed rewrite public-safe.
- Require current authorization from the user or a current lead grant before
  posting.
- Without GitHub write authorization, return drafts and the exact pending
  action.
- Before posting, verify that the PR head still matches the reviewed revision.

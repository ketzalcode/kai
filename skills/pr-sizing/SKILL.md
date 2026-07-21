---
name: pr-sizing
description: "Apply when planning a feature, large refactor, or any change spanning multiple files. Helps break work into shippable, reviewable increments \u2014 neither massive nor micro \u2014 each shippable independently."
tools: [view, grep, glob, edit]
user-invocable: true
argument-hint: [optional feature description]
---

# PR Sizing

Big changes ship as a sequence of small, reviewable PRs. Each PR is a
single reviewable concept that can be merged on its own without
breaking anything. Not micro-PRs, not massive PRs — the goldilocks
zone in between.

## When to use

- The user describes a feature larger than a few hours of work
- A refactor or migration spans multiple files / modules
- A change has UI + API + data layers
- The user asks "how should we ship this?"

**Skip for:**

- Single-file changes
- Bug fixes constrained to one function
- Doc-only changes

## What makes a good PR

A PR is rightsized when **all** of these are true:

1. **Reviewable in one sitting** — a teammate can understand the whole
   diff in 15–30 minutes.
2. **Single reviewable concept** — the description fits in one
   sentence ("Add the empty-state UI for the dashboard"; "Wire the
   `/metrics` endpoint without callers yet").
3. **Independently shippable** — merging it doesn't break main and
   doesn't require another PR to land first to be useful (or it's
   safely behind a feature flag).
4. **Tested** — its own tests live in the same PR.

PR is **too big** when:

- The diff spans three or more distinct concerns.
- The description requires the word "and" more than once.
- The reviewer has to context-switch between unrelated areas.

PR is **too small** when:

- It's a trivial slice that requires the next PR to do anything.
- The reviewer can't tell from the diff alone whether it's correct.
- It generates more coordination overhead than it saves review time.

## Workflow

### Step 1 — Decompose

For the requested change, list the work in increments. Useful seams:

- **UI shells first** — empty / loading / error states with no real data
- **Independent API calls** — one endpoint per PR if they don't depend
  on each other
- **Read paths before write paths**
- **Data model + migration** separately from consumers of that data
- **Feature-flagged scaffolding** before the user-visible behavior
- **Refactors as their own PRs** — never mix a refactor with a feature
- **Tests with the code they test**, never as a follow-up PR

### Step 2 — Sequence

Propose an ordered list:

```
PR 1: <one-sentence purpose>
  - Files: ...
  - Why it's shippable on its own: ...
  - Tests: ...
PR 2: ...
```

Each PR's "why it's shippable on its own" must be answerable. If it's
not, merge it into the next PR or split it differently.

### Step 3 — Confirm before starting

Show the user the sequence and ask whether to proceed with PR 1,
adjust the split, or change scope.

### Step 4 — Execute one at a time

When working on PR N, do not start work on PR N+1. Avoids accidental
scope creep mid-PR.

## Rules

- **Never** mix a refactor and a feature in the same PR.
- **Never** ship a PR that requires another PR to land first to be
  useful (unless behind a feature flag).
- **Always** include tests in the same PR as the code under test.
- **Don't** create micro-PRs that exist purely to game review-time
  metrics. A PR must stand on its own as a meaningful change.
- **Surface the sequence** before writing code — the user decides
  whether the split makes sense.

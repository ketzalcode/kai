# PR Lifecycle and Review Design

**Status:** Approved design  
**Date:** 2026-10-09  
**Issues:** #223, #248, #249

## Purpose

Kai needs a lean pull-request lifecycle that keeps builders focused on
implementation, gives one role complete visibility across a finished change,
preserves independent review, and produces PRs that a human can understand and
validate.

The current active surface splits delivery between builder routes and
`workflow-pull-request`, while `pr-sizing` can run before the complete change is
visible. Review findings also lack one shared contract for concise,
teammate-style inline comments.

This design replaces the delivery workflow with a software lead, moves actual
PR sizing after integration, adds an adaptive review method, and keeps review
comment writing as a separate reusable skill.

## Goals

- Give one software lead the complete-change context needed to integrate work,
  choose delivery slices, route review, and package PRs.
- Keep builders optimized for implementation and changed-behavior tests.
- Size PRs from the completed diff rather than constraining implementation to a
  predicted PR boundary.
- Produce small, cohesive, independently valid, human-reviewable PRs.
- Keep independent review separate from implementation and integration.
- Make review comments concise, accurate, collaborative, and authorization
  aware.
- Preserve lean fast paths for a small direct change or an already-finished
  diff.

## Non-goals

- Do not require several agents for every change.
- Do not make file count, frontend/backend ownership, or elapsed time decide a
  PR split.
- Do not let the lead or builders provide independent approval for their own
  work.
- Do not turn every review finding into a builder-improvement issue.
- Do not redesign the architecture lead in this effort.
- Do not add a broad testing-standards skill as a prerequisite.

## Decision summary

```text
eng-lead-software
  complete scope
      |
      +--> bounded builder assignments
      |       |
      |       `--> implementation + tests + evidence
      |
      +--> integration
      +--> post-build pr-sizing
      +--> independent review routing
      +--> finding repair and agent-improvement decisions
      `--> pr-delivery + live merge-readiness evidence

eng-reviewer-code
  exact delivery revision
      |
      +--> pr-review
      `--> pr-review-comments when comments are requested
```

`eng-lead-software` replaces `workflow-pull-request`. The lead owns
coordination and integration, not implementation or independent approval.

`eng-lead-architecture` leaves the active inventory and is preserved under
`incubator/kai-engineering/` pending the separate redesign tracked by #249.

## Design basis

The role shape follows established orchestrator-worker patterns without making
multi-agent execution the default:

- Anthropic's multi-agent research system gives one lead agent planning,
  delegation, scaling, and synthesis responsibility. It also reports that
  multi-agent systems use substantially more tokens and that most coding tasks
  have fewer truly parallelizable paths, supporting a simple-task fast path:
  <https://www.anthropic.com/engineering/multi-agent-research-system>.
- Microsoft Magentic-One gives one lead Orchestrator decomposition,
  delegation, progress tracking, and corrective replanning responsibility:
  <https://microsoft.github.io/autogen/dev/user-guide/agentchat-user-guide/magentic-one.html>.
- MetaGPT and ChatDev keep specialized software roles and explicit handoffs,
  supporting a separate integration lead, builders, reviewers, and a later
  focused architecture role rather than one agent owning every judgment:
  <https://ar5iv.labs.arxiv.org/html/2308.00352> and
  <https://ar5iv.labs.arxiv.org/html/2307.07924>.

## Trigger model

Agents are entry points. Skills are task-local methods. The user should not
have to decide whether to invoke an agent or its internal skill.

| Request | Route |
| --- | --- |
| "Implement this feature" | `eng-builder-software` or `eng-builder-platform` for one bounded implementation |
| "Coordinate this change across builders" | `eng-lead-software` |
| "Package/open PRs for this completed work" | `eng-lead-software` |
| "Review this PR" | `eng-reviewer-code`, which applies `pr-review` |
| "Review this PR and leave comments" | `eng-reviewer-code`, then `pr-review-comments`, then authorized posting |
| "Rewrite these findings as PR comments" | `pr-review-comments` directly; no new review verdict |
| "Review this PR for security" | `eng-reviewer-security`; use `pr-review-comments` only if comments are requested |

`pr-review` is not user-invocable. It cannot compete with
`eng-reviewer-code` for a natural-language review request.

`pr-review-comments` may be invoked directly when verified findings already
exist. It never upgrades supplied notes into an independent review.

## Role responsibilities

### `eng-lead-software`

The software lead owns one complete authorized software change from
implementation routing through review-ready PR delivery.

It:

- reads the complete outcome, constraints, repository state, and current work;
- decides whether one builder or several bounded builder Tasks are warranted;
- keeps parallel builders in isolated branches or worktrees with explicit
  touched areas;
- integrates accepted builder commits into a lead-owned integration branch;
- checks scope, handoff completeness, merge conflicts, accidental changes, and
  declared validation across the assembled work;
- applies `pr-sizing` only after the complete diff exists;
- creates safe, ordered delivery branches without force-pushing shared history;
- routes the exact delivery revision to independent reviewers;
- sends product findings back to the owning builder;
- decides whether a finding exposes a generalizable agent or skill gap;
- applies `pr-delivery` to each accepted delivery slice;
- investigates live protection, required checks, reviews, allowed merge
  methods, and merge readiness;
- never merges, deploys, tags, releases, or claims independent acceptance.

The lead's integration check is a self-check, not a review verdict.

#### Direct and coordinated modes

For a finished diff or one supplied builder handoff, the lead can operate
directly without creating coordination state. It reads the complete change,
sizes delivery, routes any requested review, and packages the authorized PR.

Multi-builder execution is coordinated work. The lead applies the core
granting and acting contracts, gives each builder one bounded Task and touched
area, launches isolated contexts through the supported host, and reconciles
their handoffs. A direct request never causes the lead to invent Tasks, leases,
or `.kai` state after the fact.

### Builders

`eng-builder-software` and `eng-builder-platform`:

- implement one bounded assignment;
- apply `coding-standards`;
- own tests for changed behavior;
- preserve repository contracts and unrelated work;
- return commits, changed surfaces, exact verification evidence, and remaining
  gaps;
- do not decide final PR boundaries;
- do not package the final PR;
- do not review their own work independently.

A small direct request may still go to one builder without creating a
multi-agent lifecycle. If PR delivery is later requested, the finished diff is
handed to `eng-lead-software`.

### `eng-reviewer-code`

The code reviewer:

- pins the exact base, head, accepted requirements, and supplied evidence;
- applies `pr-review` to choose the minimum relevant review;
- returns a revision-bound verdict, findings, and material unknowns;
- identifies specialist-review triggers without impersonating specialist
  verdicts;
- applies `pr-review-comments` when inline comments are requested;
- never patches the reviewed product;
- requires re-review after the revision changes.

Security, privacy/compliance, reliability, and quality reviewers retain their
own review methods. They may share `pr-review-comments`; they do not apply the
general code-review method as a replacement for their specialist contracts.

## Work decomposition versus PR sizing

These are separate decisions.

### Before build: builder assignments

The lead may divide implementation work by:

- clear ownership;
- dependency order;
- independently understandable implementation responsibilities;
- collision avoidance;
- available parallelism.

These assignments are not promised PR boundaries. Builders must be able to
complete the accepted behavior even when the eventual delivery slices differ.

### After build: `pr-sizing`

`pr-sizing` reads the complete integrated diff and decides how the finished
work reaches review.

Prefer one PR when the change expresses one cohesive behavior or structural
step that a reviewer can understand and validate together.

Split only when the complete diff contains safe ordered boundaries that
materially improve:

- reviewer comprehension;
- compatibility;
- independent validation;
- rollout or reversal;
- risk isolation.

Do not split solely because one part is client-side and another is
server-side. A cross-layer behavior may be easier to review in one PR. When the
client depends on a new server contract, a backward-compatible server
foundation may land first only if it is independently valid and testable.

### Human-reviewability heuristic

A typical slice should aim for roughly four or five primary hand-authored files
when cohesion allows. This is a signal, not a cap:

- tests stay with the behavior they prove;
- generated files and synchronized metadata do not force another split;
- a cohesive cross-layer change may need more files;
- a small file count does not make unrelated changes coherent.

If a slice is larger, its description must make the behavior and review path
clear. If splitting would create an invalid, untestable, or misleading
intermediate state, keep the work together.

### Slice contract

Every delivery slice must:

1. state one understandable behavior or structural purpose;
2. remain valid when merged at that point in the sequence;
3. include the tests and validation scenarios for the behavior it changes;
4. preserve compatibility required by later slices;
5. name its dependency on earlier PRs;
6. state what is deliberately deferred;
7. have a clear rollback or reversal story when applicable.

A preparatory slice is valid only when its own merged state can be meaningfully
verified. "Files moved for the next PR" is not sufficient value by itself.

## PR delivery and description reference

`pr-delivery` remains a skill. `eng-lead-software` applies it to each finished
slice.

The skill owns:

- branch anchors and names;
- conventional PR titles;
- repository-specific version and release rules;
- commit and push hygiene;
- PR creation or update;
- current protection and merge-readiness evidence.

It consults a reference for PR description structure instead of adding another
skill.

### Default description shape

````markdown
## Overview
<One sentence describing the behavior changed by this PR.>

- <Primary behavior added or changed.>
- <Existing behavior deliberately preserved.>
- <Important scope boundary or dependency.>

## Scoped architecture
```text
<Small caller, decision, ownership, or state-flow diagram when it adds value.>
```

## Validation scenarios
| Scenario | Configuration / action | Expected result | Evidence |
| --- | --- | --- | --- |
| <primary> | <setup/action> | <observable result> | <test, command, screenshot, or other evidence> |

## Rollout and removal gates
- <Configuration/default.>
- <Enablement evidence.>
- <Rollback action.>
- <Removal condition.>
````

Only `Overview` and `Validation scenarios` are universal. Include `Scoped
architecture` when a short ASCII diagram materially clarifies flow, ownership,
state, or dependency order. Include `Rollout and removal gates` for flags,
migrations, compatibility paths, or staged removal.

The description owns durable behavior, compatibility, scenarios, and evidence
not already visible elsewhere. Automation owns live check status and changing
counts. When a repository has no PR CI or requires local evidence, name the
exact commands that actually ran.

Any user-visible UI slice includes proportional visual evidence. Use a cropped
before/after or resulting-state screenshot for a small change and broader
surface evidence for a layout or flow change. Upload usable attachments rather
than linking private local paths.

### Feature-flagged migration profile

For a feature-flagged migration, rollout, compatibility-preserving path change,
or legacy removal, use these four scenario classes:

| Scenario | Purpose |
| --- | --- |
| Default/inactive | Prove the existing path and explicit default remain intact. |
| Enabled success | Prove the new path returns the accepted behavior. |
| Compatibility/error | Prove caller-facing contracts, failure behavior, cancellation, timeout, and telemetry expectations. |
| Rollback | Prove disabling or reverting returns to the preserved path. |

The gates cover configuration, first enablement, broader-rollout evidence,
rollback, and legacy-removal conditions. State code-ready, enabled, validated,
and complete as different facts.

## Adaptive PR review

`pr-review` builds a short review brief instead of a numerical score or fixed
checklist:

```text
Purpose: <claimed outcome>
Changed behavior: <what the diff actually changes>
Affected surfaces: <code, contracts, tests, UI, data, telemetry, operations>
Evidence: <requirements, issue, tests, screenshots, rollout notes>
Risk signals: <only concrete triggers visible in this PR>
```

From that brief:

- code changes receive requirements, correctness, contract, regression,
  changed-behavior test, and applicable coding-standard review;
- documentation or metadata-only changes skip code-only lenses;
- assembled UI, API, CLI, or system behavior may require quality review;
- concrete security, privacy, or reliability triggers route to the owning
  reviewer;
- `research-before-coding` is used only for a bounded unresolved fact that
  could change a finding.

The code reviewer may report a specialist trigger but cannot issue the
specialist verdict.

For stacked PRs, review each slice against its real parent revision. The final
slice carries end-to-end evidence for behavior that spans the stack.

## Review comment contract

`pr-review-comments` converts verified findings into comments. It does not
decide what is wrong.

### Default shape

```text
<Observed behavior and triggering condition>
<Why it matters>

<Calibrated question or required outcome>
```

There is no mandatory `Suggestion:` label.

### Tone

- Write as an accurate teammate, not a robotic evaluator.
- Discuss code, behavior, or contracts rather than the author.
- Use plain English and keep the default to two to four explanatory lines plus
  a short closing.
- Ask a question only when intent, ownership, or the corrective choice is
  genuinely unresolved.
- State a required outcome directly when evidence settles it.
- Avoid canned praise, inflated severity, AI disclaimers, lecture-style
  background, and repeated stock phrases.
- Define unfamiliar context only when a teammate could not understand the
  concern from the diff.
- Keep one finding per comment.
- Anchor to the changed line that best exposes the problem. Use a general
  review comment when no honest inline anchor exists.

### Three calibration examples

**Uncertain intent**

```text
This value now controls both the outbound dependency and the trusted inbound
identity. Are those contracts guaranteed to change together in every
environment, or should they remain independently configurable?
```

**Verified defect with corrective options**

```text
This fallback converts a timeout into an empty result, so callers cannot
distinguish "no records" from "the dependency failed."

Could we preserve the timeout error so callers can keep handling those states
separately?
```

**Required change**

```text
This branch emits the existing event name with a different field meaning,
which would silently change the dashboards and alerts that consume it.

We should preserve the current event contract here, or make the telemetry
change an explicit part of this work with its consumers updated.
```

The examples demonstrate calibration, not reusable wording.

### Anti-examples

- Excessive hedging: "What do you think about maybe considering whether this
  could potentially be changed?"
- Personal blame: "You implemented this incorrectly and need to rewrite it."

### Authorization

The skill returns:

```text
Finding: <stable finding identifier>
Location: <file and changed line, or general review>
Kind: <question | change-request | required-change>
Comment: <comment text>
Authorization: <supplied source or required>
```

Without GitHub write authorization, return drafts and the exact pending action.
Authorization may come directly from the user or from the valid grant held by
the calling lead or other authorized caller. It does not require another human
prompt when that
authority is already explicit and current.

Before posting, verify that the PR head still matches the reviewed revision.
Never attach a current finding to a changed revision.

## Finding repair and agent improvement

Product findings stay on the PR and route to the builder who owns the affected
work. After the builder changes the revision, the corresponding review must run
again.

The lead may create a separate GitHub issue for builder or skill improvement
when one strong incident exposes a generalizable contract gap. Recurrence is
not required. Creating the issue still requires current GitHub write
authorization.

Create an improvement issue only when the finding indicates at least one of:

- an expected behavior is absent or ambiguous in the builder contract;
- a skill steers agents toward the observed miss;
- an existing instruction is clear but needs a focused scenario to make
  compliance reliable;
- the route between lead, builder, reviewer, or delivery skill is unclear.

Do not create one merely because a builder made an ordinary local mistake that
the current contract already addresses adequately.

The issue records:

- the observed miss;
- the review evidence;
- the existing relevant instruction or missing contract;
- the expected future behavior;
- the likely owner: builder prompt, `coding-standards`, `pr-review`,
  `pr-review-comments`, `pr-delivery`, or another named contract;
- public-safe synthetic examples rather than private repository details.

## Architecture lead incubation

`eng-lead-architecture` is removed from active discovery and generated
inventory. Preserve its current source under `incubator/kai-engineering/`.

The active coordination fixtures that currently use it as a generic
engineering scope authority move to `eng-lead-software`, where that authority
matches the lifecycle being exercised.

#249 owns re-entry. Re-entry requires:

- concrete positive and negative triggers;
- a clear boundary from software integration and PR delivery;
- an explicit escalation interface from `eng-lead-software`;
- proportional inline versus durable decision outputs;
- collision scenarios proving it does not take routine builder or lead work;
- operator approval.

Architecture requirements in accepted work remain real while the role is
inactive. The software lead reports an unresolved expensive decision rather
than pretending to own permanent architecture authority.

## Failure and unknown handling

- Missing requirements or an unresolved expensive decision are explicit gaps.
- A builder collision stops integration until the owning commits and touched
  areas are reconciled.
- An invalid or untestable delivery slice is recombined or revised; it is not
  opened merely to reduce file count.
- Missing specialist capability remains a review gap when that review is
  required.
- Missing GitHub authorization returns drafts or a delivery plan rather than a
  success-shaped posting claim.
- Missing branch-protection permission is `unknown`, not evidence that no rule
  exists.
- A changed PR head invalidates prior review comments and verdicts tied to the
  old revision.

## Validation scenarios

Implementation must cover at least these scenarios:

1. A small coherent change uses one builder and a lightweight finished-diff
   handoff to the lead without multi-builder coordination.
2. A finished external diff enters at integration and delivery without
   pretending the lead implemented it.
3. A server/client feature stays in one PR when that is the clearest valid
   behavior slice.
4. A backward-compatible server contract lands before its dependent client
   when both slices remain independently valid and testable.
5. A cohesive change exceeding five files remains one PR when splitting would
   hide context or break validation.
6. Tests, generated files, and synchronized metadata do not independently
   trigger another PR.
7. "Review this PR" routes to `eng-reviewer-code`, not directly to
   `pr-review`.
8. A security-specific request routes to the security reviewer.
9. Comment drafts use questions for uncertainty and direct outcomes for
   settled blocking findings.
10. Comments are returned but not posted without current authorization.
11. A review finding produces a builder-improvement issue only when it exposes
    a generalizable contract or scenario gap.
12. The architecture lead is absent from active inventory and retained in the
    incubator with #249 as its re-entry owner.

Run focused contract scenarios first, then the repository's agreed Lean
validation: generated artifact checks and `npm test`. Record exact commands,
results, and unverified areas.

## Release effect

Removing active agents and replacing the PR delivery entry point changes the
installed public surface. Implementation therefore requires a major version
bump chosen from the current remote version at implementation time, plus the
repository's changelog, generated catalog, package, marketplace, and release
metadata updates.

No compatibility aliases are introduced for `workflow-pull-request` or
`eng-lead-architecture`.

# Nightshift V0

Date: 2026-10-10

Status: Approved design

## Purpose

Nightshift is an explicit Kai Engineering workflow for bounded, unattended
software delivery. It advances approved engineering work while the operator is
away, leaves reviewable pull requests and evidence, and stops before decisions
that require authority or low-confidence scope expansion.

Nightshift is self-driven inside approved work. It is not self-authorizing.

Its central delivery rule is:

> Deliver the smallest complete outcome required by the accepted scope. Once
> that outcome is verified and no known material regression or safety defect
> remains, stop. Record broader or lower-confidence improvements for the
> morning; do not add them to the change merely because time remains.

## Relationship to Kai's evolution loop

Nightshift is one of three separate capabilities:

| Capability | Responsibility |
| --- | --- |
| Nightshift | Executes approved engineering work and reports what it delivered, blocked, or deliberately deferred. |
| Repository learning | Proposes durable repository knowledge from accepted evidence. |
| Feedback | Converts an accepted generalizable gap into a GitHub issue for the owning agent or skill. |

Nightshift does not rewrite its own instructions, adopt learned guidance, or
file improvement issues by default. Its morning suggestions may become inputs
to the later learning or feedback capabilities after explicit acceptance.

Keeping these responsibilities separate prevents an execution workflow from
changing the rules by which it judges its own work.

## Ownership

Nightshift V0 belongs entirely to `kai-engineering`.

It reuses, without duplicating:

- Core Direction and hierarchy records;
- Task authority, grants, leases, questions, evidence, handoffs, and recovery;
- `software-development`;
- the frontend and backend builders and coding standards;
- selective code review;
- `pr-sizing`; and
- `pr-delivery`.

Nightshift adds no Core-owned feature surface and no parallel work-item model.
SQLite remains the only coordination authority.

## Product boundary

Nightshift V0:

- runs only after one explicit setup approval;
- works from the current Direction and approved Engineering Features,
  Requirements, and Tasks;
- may produce several bounded pull requests in one run;
- executes one pull-request slice at a time;
- uses one isolated worktree and fresh top-level agent session per routed
  stage;
- opens or updates pull requests when authorized;
- records evidence, blockers, suggestions, and the safe resume point; and
- reconciles the run for the operator the next morning.

Nightshift V0 never:

- changes Direction, Feature, or Requirement scope;
- invents acceptance criteria or permanent architecture authority;
- treats an installed role as authority;
- expands a pull request to absorb adjacent cleanup or speculative edge cases;
- self-approves independent evidence;
- merges, deploys, tags, releases, migrates production data, or changes
  production state;
- silently changes the configured role or model; or
- loops indefinitely when work cannot safely progress.

## Why the unit is a pull-request slice

An overnight window is not one large task. Long autonomous sessions accumulate
context, compound mistakes, and encourage broad fixes. Nightshift therefore
divides the approved work into independently reviewable pull-request slices.

Each slice has:

- one bounded required outcome;
- acceptance criteria inherited from approved Requirements and Tasks;
- named touched areas;
- a falsifiable completion check or observable scenario;
- a branch and isolated worktree;
- a bounded attempt and time allowance;
- evidence tied to the exact head revision; and
- an explicit dependency relationship to other slices, when one exists.

Expected slices may be identified during setup. `pr-sizing` still evaluates the
completed integrated diff before delivery because the real diff, not the plan,
determines whether a pull request is reviewable.

V0 executes slices serially. Several worktrees may remain preserved because a
slice blocked, but only one implementation slice is active at a time. This
keeps role routing, budget use, leases, and repository mutations
understandable. Parallel Nightshift execution requires later evidence that
serial execution is the limiting factor.

## Workflow

```text
CURRENT DIRECTION + APPROVED ENGINEERING SCOPE
                       |
                       v
                  PREPARE ONCE
                       |
      approved scope, base, permissions, limits,
         stacking policy, evidence, stop rules
                       |
                       v
              immutable run envelope
                       |
                       v
          choose next safe ready PR slice
                       |
                       v
        isolated worktree + standalone stages
                       |
                       v
              software-development
          implement -> validate -> self-check
                       |
             +---------+----------+
             |                    |
             v                    v
       required outcome       unsafe to continue
          satisfied                 |
             |                      v
             v              record blocker/handoff
       selective review              |
       only when required            v
             |               choose independent work
             v
      pr-sizing + pr-delivery
             |
             v
      PR + evidence checkpoint
             |
             v
        next safe ready slice
             |
             v
             RECONCILE
```

### Prepare

The operator approves one run envelope containing only decisions that govern
the night:

- exact Engineering Feature and Requirement scope;
- eligible Tasks or authority to prepare Tasks inside that accepted scope;
- base repository and base branch;
- permitted Git and GitHub side effects;
- permitted filesystem, network, and secret references;
- maximum pull requests, wall time, AI credits, attempts, and retained
  worktrees;
- whether dependent pull requests may be stacked;
- required repository or Task review;
- evidence required for each accepted outcome; and
- stop conditions.

Role and model selection do not belong in the envelope.

`eng-nightshift.agent.md` owns workflow routing. Each selected agent
profile owns its model, tools, and domain instructions, as other Kai agents do
today. The runner invokes the selected profile without restating or overriding
its model. A missing, ambiguous, or unsupported route is a blocker, not
permission to choose a replacement.

The run envelope does not create Feature or Requirement authority. It binds
the authority already present in the hierarchy to a limited execution window.

### Execute

For each candidate slice, Nightshift:

1. re-reads Direction, hierarchy context, Task versions, dependencies,
   questions, leases, and the run envelope;
2. rejects work outside the approved scope or current base;
3. claims or obtains the exact authorized Task;
4. creates an isolated branch and worktree;
5. starts fresh programmatic Copilot sessions for the routed builder, delivery
   lead, and any already-required reviewer, with autonomous continuation
   enabled, interactive questions disabled, and the run's permissions and
   limits;
6. applies `software-development` and the relevant domain standards;
7. implements only the required outcome and directly necessary correctness;
8. runs proportionate focused validation and named manual scenarios;
9. routes selective independent review only when the Task, repository,
   operator, or a concrete material risk requires it;
10. applies `pr-sizing` to the completed integrated diff;
11. applies `pr-delivery` and opens or updates the authorized pull request;
12. binds evidence to the exact head revision; and
13. checkpoints the Task, branch, worktree, pull request, evidence, remaining
    budget, and next safe action.

Programmatic Copilot sessions use the CLI's supported autopilot controls,
bounded continuation count, no-interactive-question mode, and AI-credit limit.
AI-credit limits are soft host ceilings, not exact token guarantees. The runner
must also stop launching new stages when its aggregate run limit is reached.

Tool approval does not imply unrestricted environment access. Each session is
limited to the authorized worktree, required local tools, and approved network
destinations. Nightshift receives no production credentials or authority.

### Reconcile

Reconciliation reads Core state and the private execution ledger, then produces
one morning report. It does not infer completion from a process exit code or a
PR existing.

The report distinguishes:

- pull requests ready for human review;
- partial work preserved safely;
- blocked Tasks and the decision owner;
- suggestions deliberately excluded from the pull requests;
- evidence gaps;
- actual and unavailable usage data;
- remaining or exhausted limits; and
- the exact next action for each unfinished item.

## Delivery boundary

Nightshift classifies discovered work before changing the pull-request scope.

| Classification | Meaning | Action |
| --- | --- | --- |
| Required | Necessary for accepted behavior, directly affected behavior, repository-required compatibility, a known regression caused by the change, or a material safety/correctness condition needed for acceptance to be true. | Implement and verify inside the slice. |
| Blocked | Necessary work requires new authority, expands accepted scope, changes a material public or architectural contract, conflicts with current state, or cannot be completed safely from available evidence. | Preserve work, record the blocker, and continue only independent approved work. |
| Suggested | A plausible edge case, broader refactor, reusable abstraction, cleanup, optimization, hardening idea, or adjacent improvement that is not required for acceptance or lacks sufficient confidence. | Do not implement. Add it to the morning suggestions with evidence and rationale. |

The classification is based on evidence and authority, not on whether the
change appears small.

### Completion rule

A slice is complete when:

1. its authorized outcome and acceptance criteria are satisfied;
2. directly affected behavior is covered by proportionate current evidence;
3. no known material regression introduced by the slice remains;
4. no known safety or correctness defect makes the acceptance claim false;
5. required review and repository gates for that stage are current; and
6. the Task, handoff, evidence, branch, and pull request state are truthful.

Unused time or budget does not create more scope. Once these conditions hold,
Nightshift delivers the pull request and moves to the next approved slice or
reconciliation.

### Edge cases and refactors

Nightshift implements an edge case only when at least one of these is true:

- the accepted requirement names it;
- the repository's existing contract or tests make it part of the behavior;
- the new change directly creates the condition and leaving it unresolved
  would be a material correctness or safety defect; or
- the smallest correct implementation necessarily handles it.

A larger refactor is allowed only when the accepted outcome cannot be
delivered correctly through a smaller coherent change. The handoff and PR must
explain why the refactor was necessary. A refactor that is merely cleaner,
more reusable, or potentially useful later is a suggestion.

## Self-unblocking

Self-unblocking means exhausting safe, in-scope progress without waiting for
interactive input. It does not mean resolving every uncertainty by assumption.

Nightshift follows this ladder:

1. **Observe.** Capture the exact failure, changed state, or missing evidence.
2. **Diagnose.** Establish the likely root cause from repository and runtime
   evidence before changing code.
3. **Repair locally.** Apply a reversible fix only when it remains inside the
   accepted Task and delivery boundary.
4. **Retry boundedly.** Repeat only within the approved attempt and time
   allowance. Never weaken evidence to obtain a passing result.
5. **Checkpoint.** Preserve commits or the worktree, validation, evidence,
   remaining work, and a safe resume point.
6. **Route the blocker.** Open the existing typed question or recovery path for
   the named authority.
7. **Continue independently.** Release or preserve the blocked slice as Core
   requires, then select another ready slice whose dependencies and authority
   are unaffected.
8. **Stop cleanly.** End the run when no safe ready work remains or a run limit
   prevents another slice.

Nightshift runs with interactive questions disabled. It never waits overnight
on an unanswered prompt.

## Blocker contract

Blockers remain structured Core state. Nightshift does not create one Markdown
file per blocker.

Use:

- `question.open` for a fact, decision, reply, or action needed from a named
  recipient;
- `task.handoff` for completed work, remaining executable work, asset state,
  authority, revalidation, and question references;
- a blocking `question.open` to revoke the active lease, transition the Task to
  `blocked`, and preserve `resume_state`;
- `attempt.recover` and `task.restore` for collisions, stale attempts, or lease
  recovery; and
- evidence and artifact references for the observations supporting the
  blocker.

Within the existing `question.open` fields, Nightshift makes `context`
human-actionable:

```text
Observation: <what happened, tied to exact revision/state>
Attempts: <bounded actions already taken and their outcomes>
Boundary: <why continuing would exceed scope, authority, safety, or limits>
Recommendation: <smallest safe decision or action>
Resume point: <exact branch/worktree/Task state and next command or step>
```

`ask` contains one decision or action request. The question recipient names the
authority or fact owner, not an arbitrary available role. `answerBy` states the
required timing or milestone. Evidence and artifact references point to the
supporting observations.

### Blocker behavior

| Blocker | Overnight behavior |
| --- | --- |
| Recoverable implementation or validation failure | Diagnose and repair inside the same Task, subject to the attempt limit. |
| Missing repository context | Search code, history, instructions, and accepted artifacts. Continue only if the answer is grounded and does not change scope. |
| Product, architecture, public-contract, ownership, or scope decision | Open a blocking question, checkpoint, and continue unrelated ready work. |
| Dependency not ready | Preserve a handoff. Continue unrelated work. Stack a dependent PR only when the envelope permits it. |
| PR check or review finding | Repair only when inside the accepted Task. Bind all new evidence and required review to the new revision. |
| Version conflict, lease loss, collision, or Direction/base drift | Stop editing the slice and enter Core recovery. Never overwrite, borrow authority, or silently rebase changed work. |
| Missing required role, tool, permission, network route, or secret | Record the exact capability gap. Do not substitute an unapproved route. |
| Attempt, time, PR, worktree, or AI-credit limit | Preserve state and stop launching affected work. |
| No safe ready work | End early and reconcile. Never spin to consume the window. |

## Evidence contract

Nightshift uses existing Core evidence and acceptance records. It does not add
a second acceptance schema.

Every accepted criterion maps to:

- the exact Requirement and Task basis;
- the exact base and head revision or artifact hash;
- the observable scenario or claim;
- an observed artifact or repository-owned check;
- the result;
- the material coverage limitation; and
- any required independent verdict or completion authority.

### Reviewer-facing pull request

The pull request remains concise and durable. Its default evidence table is:

| Acceptance criterion | Reviewer scenario or artifact | What it establishes | Limitation |
| --- | --- | --- | --- |
| `<criterion>` | `<scenario, screenshot, contract example, or durable link>` | `<observable result>` | `<what remains outside this evidence>` |

The PR description does not copy commands, pass counts, changing CI status,
review state, or raw session logs. CI and repository checks own live execution
status. The private run record retains exact commands and outputs when they are
needed for audit or recovery.

Evidence scales with the change:

- **Frontend:** before and after screenshots use the same route, state, data,
  and viewport; focused automated checks cover stable behavior; accessibility
  and localization evidence follows repository conventions.
- **Backend:** contract or request/response observations demonstrate changed
  behavior; focused tests cover the owned layer; a small data-flow or
  architecture diagram is added only when a boundary materially changes.
- **Cross-cutting:** exact subject revisions, affected seams, repository
  checks, and explicit limitations make the assembled behavior reviewable.

Prose and diagrams explain a decision. Observable behavior proves it. Neither
substitutes for the other.

### Private execution ledger

The engineering runner keeps one private, non-authoritative run ledger with:

- run and envelope identifiers;
- current Direction and hierarchy versions;
- slice, Task, branch, worktree, session, and PR identifiers;
- stage and attempt state;
- checkpoints and exact head revisions;
- observed time and AI-credit use when the host exposes it;
- retained log and evidence locations;
- blocker and question references;
- remaining run limits; and
- terminal reason.

This ledger supports resumption and report generation. It cannot grant work,
change scope, answer questions, accept evidence, or close a Task.

## Morning report

Nightshift produces one private Markdown report as a human-readable projection
of Core records and the run ledger:

```markdown
# Nightshift <run-id>

## Goal and approved scope
<Direction goal, Feature/Requirements, base, run limits>

## Delivered pull requests
| PR | Required outcome | Evidence | Intentionally not done |
| --- | --- | --- | --- |

## Blocked work
| Task/PR | What stopped | Why unsafe to continue | Decision owner | Recommended action | Resume point |
| --- | --- | --- | --- | --- | --- |

## Suggestions for the morning
| Suggestion | Evidence or basis | Why deferred | Benefit | Cost/risk | Suggested priority |
| --- | --- | --- | --- | --- | --- |

## Run limits
<elapsed time, PRs, attempts, credits when observable, retained worktrees,
stopped-early reason>
```

The report is not coordination authority. If it disagrees with Core state,
Core wins and reconciliation reports the mismatch.

Suggestions are not disguised commitments. Each suggestion states whether its
basis is an observed condition or a hypothesis, why it was outside the
delivery boundary, and what decision would be needed before implementation.
Nightshift does not automatically convert suggestions into Tasks or GitHub
issues.

## Pull-request dependencies

Independent slices branch from the approved base.

When one accepted slice depends on another:

- if stacking is approved, the dependent branch and pull request target the
  preceding branch and declare the dependency;
- if stacking is not approved, Nightshift checkpoints the downstream Task and
  continues unrelated work; and
- Nightshift never merges the earlier pull request to unblock itself.

If an earlier pull request changes after a dependent slice begins, Nightshift
must re-read the dependency and affected evidence before continuing. Material
drift enters recovery rather than being silently rebased.

## Proposed shipped surfaces

| Surface | Responsibility |
| --- | --- |
| `eng-nightshift.agent.md` | Explicit PREPARE and RECONCILE entry point, routing policy, delivery boundary, and hard authority limits. |
| `nightshift-run` skill | Task selection, slice lifecycle, self-unblocking, evidence, blocker, and report procedure. |
| Engineering runner | Durable serial orchestration of fresh programmatic Copilot sessions, isolated worktrees, run limits, checkpoints, and reconciliation. |
| Engineering publication vocabulary | Private Nightshift report and evidence route associated with the authorized hierarchy subject. |
| Existing builder, reviewer, sizing, and delivery surfaces | Implementation, selective review, final diff sizing, and pull-request delivery. |

The runner is orchestration code, not an agent that reasons about product scope.
The workflow agent interprets approved context and selects existing routes.
The selected builders make in-scope implementation decisions under their own
profiles.

## V0 acceptance

Nightshift V0 is acceptable when a test workspace demonstrates that:

1. one approved run can deliver more than one serial, isolated pull-request
   slice without changing Feature or Requirement scope;
2. every implementation session applies the current software-development and
   domain standards through its routed agent profile;
3. required work is implemented while broader or lower-confidence work appears
   only in the morning suggestions;
4. each pull request maps accepted criteria to revision-bound evidence and
   explicit limitations;
5. a blocked slice preserves truthful Core state and a safe resume point while
   independent ready work continues;
6. collisions, lease loss, base or Direction drift, missing capabilities, and
   exhausted limits stop affected work without fallback or overwrite;
7. no unattended path merges, deploys, releases, or self-approves;
8. the morning report can be regenerated from Core state and the private run
   ledger; and
9. ending early with no safe work is treated as a successful bounded stop, not
   a workflow failure.

## Research grounding

Nightshift follows recurring controls documented by mature autonomous coding
systems:

- GitHub recommends clear acceptance criteria and file guidance, and advises
  keeping broad, ambiguous, design-heavy refactors out of autonomous coding
  tasks:
  <https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results>
- Devin recommends bounded tasks and splitting work that would exceed roughly
  three hours:
  <https://docs.devin.ai/essential-guidelines/when-to-use-devin.md>
- Factory separates read-only specification from execution and uses an
  approved plan for longer missions:
  <https://docs.factory.com/autonomy-and-safety/specification-mode>
  and <https://docs.factory.com/missions/overview>
- Anthropic recommends simple workflows where possible, explicit stopping
  conditions, observable checks, and bounded iteration:
  <https://www.anthropic.com/engineering/building-effective-agents>
  and <https://code.claude.com/docs/en/best-practices>
- Claude Code worktrees isolate concurrent sessions:
  <https://code.claude.com/docs/en/worktrees>
- METR's current time-horizon method models success probability against human
  task duration and warns that measurements above sixteen hours remain
  unreliable, supporting shorter independently verifiable slices:
  <https://metr.org/time-horizons/>

These sources inform the guardrails. Kai's authority, evidence, scope, and
communication contracts remain the governing design.

## Deferred decisions

The implementation plan must still settle:

- the smallest run-envelope and private-ledger representation;
- the exact engineering publication entry for Nightshift reports;
- the runner command surface and scheduler integration;
- safe Copilot CLI permission and sandbox defaults on Windows, macOS, and
  Linux;
- default limits versus values that must be supplied during setup;
- how observed AI-credit usage is collected when available;
- cleanup policy for accepted, blocked, and abandoned worktrees; and
- the focused acceptance harness for multi-PR and recovery scenarios.

These are implementation decisions inside this approved architecture. They do
not reopen the product boundary, ownership, delivery rule, or human-only gates.

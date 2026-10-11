# Lean Engineering Roster and Development Workflow

Date: 2026-10-10

Status: Approved design

This design supersedes the Superpowers methodology decision in
`development-system-simplification.md` and the active engineering roster
described before Kai 22.0.0.

## Core philosophy

> Kai is a lean, quality-first suite of specialized agents and skills for
> agent-to-agent software collaboration. It combines repository-native coding
> standards, focused TDD, explicit coordination, and evidence-based handoffs
> without turning routine work into ceremony.
>
> Kai keeps direct work direct. It adds agents, process, and validation only
> when they materially improve correctness, context isolation, or delivery
> quality. The goal is a high-performing engineering system: small roles,
> relevant context, proportionate confidence, and fast shipping.

This vision must appear near the beginning of both `README.md` and `AGENTS.md`.
The README states the product promise for users. AGENTS.md makes the same
principle binding for contributors working on Kai itself.

Kai differs from complete methodology frameworks because it does not intercept
every development action. It supplies the smallest useful collaboration
structure at the moment specialization, isolation, or coordination adds value.

## Decision

Kai will use a small, explicit engineering roster and one lightweight software
development workflow. It will not install or depend on a general-purpose
methodology plugin.

The operating model is:

- direct work stays with the main agent when no specialist context is needed;
- engineering agents are manually selected or explicitly dispatched;
- a development request may load one short workflow skill;
- review, PR creation, merge, release, and deployment remain separate actions;
- process depth follows uncertainty and risk rather than a mandatory ceremony.

## Why this changes

The active engineering package currently exposes twelve agents. Several of
them represent occasional review lenses or workflows rather than recurring,
independent jobs. Their presence increases routing choices, context, and the
chance that a straightforward task becomes a multi-agent chain.

Superpowers adds a second source of overhead. Its complete methodology requires
design approval, implementation planning, strict test-first development,
subagent reviews, and branch-finishing steps. Those defaults are useful for
long autonomous work, but they are too broad for Kai's fast-shipping profile.

The merge of pull request 250 exposed the failure mode. A direct request to
merge an already prepared PR triggered a full test run, another code review,
and completion verification. The PR lifecycle had already produced that
evidence. The merge command should have consumed live repository gates rather
than reopening development.

## Goals

- Keep only agents with a frequent, distinct engineering job.
- Improve frontend and backend implementation quality without loading every
  concern into every task.
- Preserve useful design, debugging, testing, and verification principles
  without mandatory full-workflow ceremony.
- Make simple continuation commands execute the established decision.
- Keep future testing craft extensible without building unused skills now.

## Non-goals

- Replacing Superpowers with another full methodology framework.
- Creating specialist agents for every engineering concern.
- Building the future platform-learning or test-craft skills in this change.
- Making review, tests, or subagents automatic gates for every change.
- Removing repository-required release validation.

## Active engineering roster

Kai Engineering will ship five active agents.

| Agent | Responsibility |
| --- | --- |
| `eng-builder-frontend` | Implements user-interface and client behavior using repository-native component, state, accessibility, localization, and design-system patterns. |
| `eng-builder-backend` | Implements APIs, services, persistence, jobs, libraries, authentication, authorization, and operational behavior using repository-native contracts. |
| `eng-lead-software` | Coordinates explicit multi-builder work and packages a complete change when coordination is materially useful. |
| `eng-reviewer-code` | Performs selective independent code review when requested or concretely justified. |
| `eng-lead-technical-writing` | Authors or reviews substantial developer documentation. |

All five agents remain user-invocable. They disable automatic model invocation
so their presence cannot silently turn direct work into an agent workflow.

### Removed agents

The following agents leave the shipped and incubated surfaces:

- `eng-advisor-investigation`
- `eng-builder-software`
- `eng-reviewer-privacy-compliance`
- `eng-reviewer-quality`
- `eng-reviewer-reliability`
- `eng-reviewer-security`
- `workflow-incident-response`

`research-before-coding` remains available as a bounded skill. Security,
privacy, quality, and reliability remain task concerns when the requirements
or repository make them relevant; they do not require permanent agents or
automatic specialist verdicts.

### Incubated agents

- `eng-builder-platform` remains inactive until a separate design defines how
  it learns repository-specific platform conventions instead of applying
  generic CI/CD and infrastructure advice.
- `workflow-ship` remains inactive until a separate design gives it meaningful
  release authority or actions beyond recording state.

Incubated agents are not discovered, emitted, catalogued, or installable.

## Coding guidance

Coding guidance uses one shared core plus one domain layer.

### `coding-standards`

The existing skill remains the lean shared core. It captures cross-repository
preferences for clarity, naming, types, error contracts, ownership, comments,
compatibility, and avoiding speculative abstraction.

It works alongside task requirements and repository conventions. It does not
override either.

### `frontend-coding-standards`

This skill is loaded only for frontend work. It covers:

- composition and component boundaries;
- state, lifecycle, and interaction ownership;
- accessibility and localization;
- design-system and repository-native component reuse;
- client/server boundaries and relevant client performance.

### `backend-coding-standards`

This skill is loaded only for backend work. It covers:

- API, response, and error contracts;
- authentication and authorization boundaries;
- persistence, data ownership, migrations, and concurrency;
- service and dependency boundaries;
- actionable non-sensitive logging;
- service observability and operational failure behavior.

The shared core continues to protect existing telemetry as a compatibility
contract across frontend and backend work.

The frontend and backend builders load `coding-standards` plus only their own
domain skill.

## Software development workflow

`software-development` is the lightweight implementation workflow. Its trigger
is deliberately narrow:

> Use when implementing or modifying product code for a feature, fix,
> refactor, or behavior change. Do not use for review-only, PR merge,
> release-only, deployment-only, prose-only, metadata-only, or generated
> refresh work.

It scales its process before editing:

| Situation | Behavior |
| --- | --- |
| Clear bounded change | Inspect, implement, and validate directly. |
| Material product or implementation ambiguity | Ask only the decision that changes the implementation, then continue. |
| Architecture or risky cross-cutting change | Present a concise design and obtain approval before implementation. |
| Defect with uncertain cause | Establish and reproduce the root cause before editing. |

The workflow then applies the shared and relevant domain coding standards,
implements one coherent change, validates proportionately, and returns an
evidence-based handoff. It does not automatically start review, PR delivery,
merge, release, or deployment.

## Lean TDD and validation

Kai keeps the useful parts of test-driven development without requiring strict
test-first mechanics for every edit.

1. Define the behavior, risk, and observable scenario before coding.
2. Use strict red/green for reproduced defects, stable pure logic, and clear
   contracts whose expected behavior is already known.
3. When UI, architecture, or integration behavior is still evolving, build the
   smallest coherent path and use fast checks or manual observation before
   expanding automated tests.
4. Once the behavior and boundaries are sound, add or update focused unit and
   integration tests for the final contract.
5. Run named manual scenarios and record observed outcomes when they provide
   meaningful evidence.
6. Run targeted tests by default. Escalate to broader suites for cross-cutting
   risk, repository release rules, or an explicit request.

Tests assert behavior and contracts rather than temporary implementation
shape. A later merge command reuses the PR's current evidence and protection
state; it does not rerun development validation solely because time passed.

## Future testing craft

Detailed test-authoring guidance remains a future extension point:

- `unit-testing-standards`
- `frontend-unit-testing-standards`
- `backend-unit-testing-standards`
- `e2e-testing-standards`

Those skills will describe how to design effective tests. They are not needed
to establish the development flow and should not be created until repeated
evidence justifies their rules.

## Selective review

`eng-reviewer-code` is not a universal completion gate. It runs only when:

- the operator explicitly requests review;
- `eng-lead-software` identifies a concrete material risk or unresolved
  uncertainty and receives authorization to dispatch review; or
- repository protection explicitly requires review.

`pr-review` becomes a general review method. It may report relevant security,
privacy, reliability, accessibility, localization, or quality defects visible
in the change, but it does not route to permanent specialist agents.

The software lead does not require fresh review for every integrated revision.
It requests review only under the selective policy.

## Execution-only PR merge

A direct instruction to merge an existing PR continues the established
lifecycle.

The agent:

1. resolves the intended PR and exact head;
2. reads live open/draft state, mergeability, required checks, required
   reviews, unresolved conversations, and allowed merge methods;
3. merges immediately when those repository gates permit it; and
4. reports the merge commit or the exact blocker.

The merge action does not start code review, rerun tests, create a plan, or
reopen PR preparation. If a blocker requires a code change, that change returns
to `software-development` and receives proportionate validation.

## Superpowers removal

Uninstall `superpowers@superpowers-marketplace` from Copilot CLI. Do not replace
it during this change.

The useful principles retained in Kai are:

- clarify only meaningful uncertainty;
- establish root cause before fixing uncertain defects;
- use red/green where it proves a stable behavior or regression;
- prefer YAGNI and coherent changes;
- isolate context only when it materially improves the work;
- verify evidence before making a claim; and
- request fresh review only when it adds independent value.

The discarded defaults are:

- mandatory skill invocation from a weak trigger;
- design and planning ceremony for every behavior change;
- strict test-first rewrites while the contract is still moving;
- subagent and review cycles for every task;
- full-suite verification before every merge; and
- restarting completed lifecycle phases for a continuation command.

The current session may retain already-loaded Superpowers instructions after
uninstallation. Verification of the new environment must use a fresh Copilot
CLI session.

## Research basis

The design follows common guidance across current coding tools:

- GitHub custom agents support scoped tools and
  `disable-model-invocation: true` for manual selection.
- Claude Code recommends custom subagents for repeated work that benefits from
  isolated context and warns that agents consume usage and description context.
- Cursor recommends short always-loaded rules, dynamic skills for occasional
  workflows, and starting with minimal customization.
- Codex recommends explicit delegation for independent work and notes that
  subagents consume more tokens and parallel writes add coordination overhead.

References:

- <https://docs.github.com/en/copilot/reference/custom-agents-configuration>
- <https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/custom-agents>
- <https://code.claude.com/docs/en/sub-agents>
- <https://cursor.com/learn/customizing-agents>
- <https://learn.chatgpt.com/docs/agent-configuration/subagents?surface=app>

## Release and migration

This is a breaking shipped-surface change and prepares Kai 22.0.0.

The implementation must update:

- source and incubated agent files;
- agent routes and skill contracts;
- catalogs, fixtures, package manifests, generated packages, and documentation;
- the opening vision in `README.md` and `AGENTS.md`;
- the canonical repository instruction block;
- release metadata, README status, and changelog.

The earlier `development-system-simplification.md` remains historical evidence.
It receives a short supersession note rather than being rewritten.

## Success criteria

- Kai Engineering ships exactly five active agents.
- `README.md` and `AGENTS.md` open with the approved Kai philosophy.
- No active agent invokes another engineering agent without an explicit
  coordination request and bounded assignment.
- Frontend and backend builders use shared plus domain-specific coding guidance.
- A normal implementation request loads at most the lightweight development
  workflow and relevant coding standards.
- A direct merge request performs only live repository gate checks and merge.
- No Superpowers plugin or Superpowers-specific instruction is needed.
- The full repository contract and generated package checks pass for 22.0.0.

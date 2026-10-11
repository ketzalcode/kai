# Nightshift V0 Implementation Plan

Date: 2026-10-10

Design: `docs/designs/nightshift-v0.md`

Status: Complete

Validation agreement: Lean, with focused contract tests and the repository's
required behavior-change build and release checks.

## Objective

Ship an explicit Kai Engineering Nightshift workflow that can execute several
pre-approved pull-request slices serially, in isolated worktrees and fresh
Copilot sessions, while preserving Core authority and producing a concise
morning report.

The implementation must deliver required outcomes first, stop at the accepted
boundary, and report broader or lower-confidence improvements instead of
silently adding them to pull requests.

## Implementation decisions

### The software lead owns incremental routing

`eng-nightshift.agent.md` admits the bounded goal. `eng-lead-software` reads
current Core state and accumulated checkpoints, then chooses one next slice, a
blocker, or completion. The operator does not select an agent or model.

The runner mechanically expands the lead's decision into standalone stages:

```text
frontend -> eng-builder-frontend -> eng-lead-software -> optional eng-reviewer-code
backend  -> eng-builder-backend  -> eng-lead-software -> optional eng-reviewer-code
```

Each selected profile keeps its own `model:` declaration and domain
instructions. The runner passes no model override.

Standalone stages are required because nested host agents do not own the
standalone Core receipts needed to claim and mutate coordinated work.

### One fresh session per stage

Each approved slice receives:

- one Git branch;
- one linked worktree;
- one fresh programmatic session per routed stage;
- bounded autopilot continuation and AI-credit allowances;
- one exact output contract; and
- append-only lead-decision and terminal-result events.

The runner performs no product decomposition or stop/continue judgment and
never substitutes another profile.

### Core authority remains at the original workspace

The child session runs in the isolated code worktree and receives
`KAI_WORKSPACE_ROOT` pointing to the original schema-5 workspace.

Linked worktree commits share the registered project's Git object database, so
Core can verify immutable base and head SHAs from the configured project even
when another worktree produced the commit.

The private Nightshift events are not authority. Tasks, grants, leases,
questions, evidence, review, acceptance, and recovery remain Core records.

### Lean admission and incremental events

V0 validates one small immutable admission:

- schema version and safe run ID;
- current hierarchy subject and Direction basis;
- exact project binding, base branch, and full base SHA;
- deadline and positive run limits;
- allowed GitHub side effects and URL permissions;
- stacking policy;
- evidence expectations.

It contains no slice list, branches, routes, agents, or models. Each
software-lead decision and observed stage result appends one event. The report
folds those events into a projection without rewriting admission.

### Typed private run route

Each run uses:

```text
.kai/engineering/reports/nightshift/<run-id>/
  drafts/
    plan.json
    report.md
  evidence/
    events.jsonl
    <slice-id>-stdout.log
    <slice-id>-stderr.log
  scratch/
```

Add `reports/nightshift` to the Engineering publication declaration. The
morning report is a private draft projection unless separately accepted and
published through the existing asset lifecycle.

### Bounded execution

Use Copilot CLI programmatic autopilot with:

- `--agent <routed-builder-or-delivery-profile>`;
- `--autopilot`;
- `--no-ask-user`;
- `--allow-all-tools`, required by non-interactive prompt mode;
- explicit `--allow-url` entries from the approved plan;
- `--max-autopilot-continues`;
- a per-slice share of the approved soft AI-credit ceiling;
- `--no-auto-update`; and
- silent output captured by the runner.

Do not pass `--model`. The profile owns it.

The run stops launching slices after its deadline, pull-request limit,
retained-worktree limit, or AI-credit launch budget is exhausted. Host credit
limits remain soft ceilings and must be described honestly.

### Internal observed-output validation

The builder stage returns `completed`, `blocked`, or `failed`, with exact head,
evidence, suggestions, blocker, and next action. `completed` requires a clean
committed worktree.

The runner validates software-lead decisions and builder/delivery/review
outputs internally. These shapes belong to code and focused tests, not the
prompt-level skill. They do not become a second Core schema.

A delivered result additionally requires:

- a clean worktree;
- the reported head to equal worktree `HEAD`;
- head to differ from the slice base; and
- a GitHub pull-request URL.

Invalid output becomes a preserved failed slice, never a success-shaped
fallback.

### Lead-owned stopping

The runner asks the software lead for one decision after every terminal slice.

- The lead may choose an independent slice from the approved base.
- The lead may choose a delivered head only when stacking was approved.
- A blocked slice does not prevent the lead from choosing independent in-scope
  work.
- The lead declares completion or a real authority-bound blocker.
- Delivered clean worktrees are removed after checkpointing.
- Blocked or failed worktrees are preserved up to the approved retention cap.
- The runner itself stops only for deterministic limits, drift, invalid output,
  or unavailable host capability.

## Tasks

### Task 1 - Protect the contract with focused tests

Add `test/nightshift-self-test.mjs` and include it in `npm test`.

Cover:

- exact manual-only workflow agent and pinned model;
- workflow routing through `nightshift-run` and current Core contracts;
- no merge, deploy, release, self-approval, self-learning, or automatic issue
  creation;
- skill delivery boundary, blocker behavior, evidence, and report template;
- publication route;
- lean admission validation with no up-front slices;
- append-only event sequencing and projection;
- software-lead next-slice, blocker, and completion decisions;
- route expansion uses standalone current profiles;
- Copilot arguments omit `--model` and include bounded autonomous flags;
- delivered-result validation;
- continuation with independent lead-selected work after a blocker;
- morning report rendering; and
- generated Engineering package contains the runner with no external runtime
  dependency.

Run:

```text
node --test test/nightshift-self-test.mjs
```

Expected before implementation: focused failures for the missing surfaces.

### Task 2 - Add the workflow and skill

Create:

- `plugins/kai-engineering/agents/eng-nightshift.agent.md`;
- `plugins/kai-engineering/skills/nightshift-run/SKILL.md`; and
- `plugins/kai-engineering/skills/nightshift-run/references/morning-report.md`.

The workflow agent must:

- be user-invocable and `disable-model-invocation: true`;
- use its own pinned model;
- apply `kai-core-contract-v1` before other Core contracts;
- refuse coordinated execution without current Core;
- use PREPARE, EXECUTE, and RECONCILE phases;
- route implementation through existing current agents;
- keep review selective;
- preserve the delivery boundary;
- use structured Core blockers;
- never infer merge, deployment, release, or production authority; and
- treat suggestions as morning inputs, not implementation scope.

The skill must stay lean: admission boundary, lead/runner ownership, required /
blocked / suggested classification, checkpoint minimum, runner commands, and
hard stops. Internal JSON validation remains in code and focused tests.

### Task 3 - Implement the Engineering runner

Create:

- `src/engineering/nightshift.mjs`; and
- focused internal modules under `src/engineering/lib/` only when they create a
  real testable boundary.

Expose:

```text
nightshift.mjs prepare --root <workspace> --plan <file>
nightshift.mjs run --root <workspace> --run-id <id>
nightshift.mjs report --root <workspace> --run-id <id>
nightshift.mjs status --root <workspace> --run-id <id>
```

Implementation requirements:

- Node built-ins only;
- no shell-string execution;
- exact path containment and no links/junctions for private run files;
- append-only, contiguous event writes;
- idempotent prepare and report;
- immutable approved plan after prepare;
- serial slice state machine;
- deterministic branch/worktree paths and safe Git arguments;
- captured child stdout/stderr;
- exact process/session terminal state;
- no automatic retry after an ambiguous child result;
- no cleanup of blocked or failed work;
- redaction of secret values and no secret material in admission, events, logs, or
  report; and
- loud non-zero exits for malformed configuration or host failure, while a
  truthful run with blocked work may reconcile successfully.

### Task 4 - Wire publication and catalog surfaces

Update:

- `plugins/kai-engineering/publication.json`;
- `tools/generate-catalog.mjs`;
- package descriptions where they describe the Engineering surface; and
- generated catalog/inventory through the normal build.

Nightshift is an explicit workflow, not an automatically selected general
builder.

### Task 5 - Update user-facing documentation and release metadata

Update:

- `README.md` with the bounded unattended-delivery promise and current
  Engineering surface;
- `CHANGELOG.md` with `22.1.0` and compare link;
- README status/counts through generation; and
- package version only through:

```text
npm version 22.1.0 --no-git-tag-version
```

Run `npm ci` only if dependencies are missing or changed. Then run:

```text
npm run build
```

Commit generated manifests, locks, catalog, inventory, and bundled runner.

### Task 6 - Validate the exact feature

Run:

```text
node --test test/nightshift-self-test.mjs
npm run build:check
npm test
npm run consumer-install:self-test
git diff --check origin/main...HEAD
```

Manual scenarios:

1. two independent slices become separate serial PR checkpoints;
2. one blocked slice preserves its worktree while an independent slice remains
   eligible;
3. a dependent slice is skipped after its prerequisite blocks;
4. low-confidence refactor and edge-case ideas appear only in suggestions;
5. invalid JSON output cannot become delivered;
6. the runner passes no model override; and
7. report regeneration does not mutate Core state.

Nightly Linux and release readiness at the eventual merge SHA remain
repository-owned post-merge evidence.

### Task 7 - Deliver

Create coherent commits, push
`kai/feat/2026-10-10-nightshift`, and open one reviewer-focused pull request.

The PR description includes:

- the bounded unattended-delivery behavior;
- multi-PR and blocker scenarios;
- the intentional non-goals; and
- no transient test-command/status summary.

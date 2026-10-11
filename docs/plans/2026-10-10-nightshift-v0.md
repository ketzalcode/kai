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

### The workflow profile owns routing

`workflow-nightshift.agent.md` classifies each slice as `frontend` or
`backend` and records whether the already-approved Task requires independent
review. The operator does not select an agent or model.

The runner expands that route into standalone stages:

```text
frontend -> eng-builder-frontend -> eng-lead-software -> optional eng-reviewer-code
backend  -> eng-builder-backend  -> eng-lead-software -> optional eng-reviewer-code
```

Each selected profile keeps its own `model:` declaration and domain
instructions. The runner passes no model override.

Standalone stages are required because nested host agents do not own the
standalone Core receipts needed to claim and mutate coordinated work.

### One fresh session per slice

Each approved slice receives:

- one Git branch;
- one linked worktree;
- one fresh programmatic session per routed stage;
- bounded autopilot continuation and AI-credit allowances;
- one exact output contract; and
- one terminal ledger entry.

The runner follows the approved route mechanically. It performs no product
reasoning and never substitutes another profile.

### Core authority remains at the original workspace

The child session runs in the isolated code worktree and receives
`KAI_WORKSPACE_ROOT` pointing to the original schema-5 workspace.

Linked worktree commits share the registered project's Git object database, so
Core can verify immutable base and head SHAs from the configured project even
when another worktree produced the commit.

The private Nightshift ledger is not authority. Tasks, grants, leases,
questions, evidence, review, acceptance, and recovery remain Core records.

### One internal run plan

V0 uses one runner-owned JSON plan rather than separate schema files. Validate
only invariants needed for safe unattended execution:

- schema version and safe run/slice IDs;
- current hierarchy subject and Direction basis;
- exact project binding, base branch, and full base SHA;
- deadline and positive run limits;
- allowed GitHub side effects and URL permissions;
- stacking policy;
- non-empty slices with Task reference/version, outcome, acceptance, touched
  areas, completion check, route, required-review flag, branch, and
  dependencies; and
- acyclic, known slice dependencies.

The operator does not choose agents or models.

### Typed private run route

Each run uses:

```text
.kai/engineering/reports/nightshift/<run-id>/
  drafts/
    plan.json
    ledger.json
    report.md
  evidence/
    <slice-id>-stdout.log
    <slice-id>-stderr.log
  scratch/
```

Add `reports/nightshift` to the Engineering publication declaration. The
morning report is a private draft projection unless separately accepted and
published through the existing asset lifecycle.

### Bounded execution

Use Copilot CLI programmatic autopilot with:

- `--agent workflow-nightshift`;
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

### Result contracts

The builder stage returns `completed`, `blocked`, or `failed`, with exact head,
evidence, suggestions, blocker, and next action. `completed` requires a clean
committed worktree.

The delivery stage's final response is one JSON object:

```json
{
  "status": "delivered | blocked | failed",
  "summary": "<required outcome or exact gap>",
  "headSha": "<full commit SHA or null>",
  "prUrl": "<GitHub pull request URL or null>",
  "evidence": ["<durable observation or reference>"],
  "suggestions": [
    {
      "summary": "<not implemented>",
      "basis": "<observed | hypothesis and evidence>",
      "whyDeferred": "<delivery-boundary reason>",
      "benefit": "<expected value>",
      "costRisk": "<implementation cost or risk>",
      "priority": "<suggested priority>"
    }
  ],
  "blocker": {
    "kind": "<fact | decision | action | capability | collision | limit>",
    "owner": "<named authority or fact owner>",
    "context": "<observation, attempts, boundary, recommendation, resume point>",
    "ask": "<one requested decision or action>",
    "answerBy": "<timing or milestone>",
    "questionRef": "<Core question reference or null>"
  },
  "nextAction": "<safe resume or review action>"
}
```

`blocker` is `null` for a delivered slice. The runner validates this output but
does not treat it as Core evidence or acceptance.

A delivered result additionally requires:

- a clean worktree;
- the reported head to equal worktree `HEAD`;
- head to differ from the slice base; and
- a GitHub pull-request URL.

Invalid output becomes a preserved failed slice, never a success-shaped
fallback.

### Dependencies and stopping

The runner executes ready slices in plan order.

- Independent slices use the approved base SHA.
- A stacked slice uses the delivered dependency head only when stacking was
  approved.
- A blocked or failed dependency makes downstream slices skipped, not guessed.
- Other independent ready slices continue.
- Delivered clean worktrees are removed after checkpointing.
- Blocked or failed worktrees are preserved up to the approved retention cap.
- When no safe ready slice remains, the run reconciles and exits successfully
  with truthful blocked/skipped state.

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
- plan validation and dependency-cycle refusal;
- route expansion uses standalone current profiles;
- Copilot arguments omit `--model` and include bounded autonomous flags;
- delivered-result validation;
- failed/blocked dependency continuation;
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

- `plugins/kai-engineering/agents/workflow-nightshift.agent.md`;
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

The skill must define the exact plan/result contracts, runner commands,
evidence matrix, blocker content, dependency behavior, and morning report.

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
- atomic ledger writes;
- idempotent prepare and report;
- immutable approved plan after prepare;
- serial slice state machine;
- deterministic branch/worktree paths and safe Git arguments;
- captured child stdout/stderr;
- exact process/session terminal state;
- no automatic retry after an ambiguous child result;
- no cleanup of blocked or failed work;
- redaction of secret values and no secret material in plan, ledger, logs, or
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

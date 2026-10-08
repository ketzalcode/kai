# Task 8 report — hierarchy-aware status, context, plan, and CLI

Date: 2026-10-06

## Outcome

Implemented hierarchy-aware read and planning surfaces over the existing
schema-4 runtime store. Schema-5 workspace activation remains deferred to
Task 9.

The new runtime exports:

```js
hierarchyStatus(store, {direction, roles})
hierarchyContext(store, {subject, maxBytes, recentLimit, direction, roles})
taskPlan(store, {subject, direction, roles})
deriveAttention(store, {record, direction, roles})
```

The implementation:

- rolls Current Goal to Epics, packs, Features, Requirements, and Tasks;
- keeps lifecycle separate from derived attention;
- derives `none | blocked | needs-human` without writing records;
- retains every attention reason while giving `needs-human` display
  precedence;
- reports missing installed roles as session staffing gaps;
- builds bounded typed context with ancestors, direct children, dependencies,
  acceptance, authorities, decisions, questions, messages, and holds;
- returns executable Tasks only from advisory planning with
  `automatic: false`;
- excludes proposed, held, stale, dependency-blocked, leased, human-gated, and
  currently unstaffed Tasks;
- runs each projection in one nested-safe SQLite read snapshot;
- changes CLI reads to typed `--kind/--id`, claims to `--task`, and rejects
  every old `--item` selector with `INVALID_INPUT`;
- makes CLI `plan` a read-only hierarchy projection. It does not invoke host
  dispatch planning or acquire a lease.

## RED

The hierarchy view test was written before production code.

Command:

```text
node test/coordination-hierarchy-view-self-test.mjs
```

Observed failure:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
src/core/lib/coordination-runtime/hierarchy-view.mjs
```

This was the expected failure: none of the required hierarchy projections
existed.

### Baseline and carry-forward CLI findings

The focused Task 7 baseline had clean hierarchy contract and hierarchy engine
suites. The old CLI suite failed because it still asserted retired
item/initiative behavior:

- `export --item demo` failed `INVALID_INPUT`;
- the engineering and creative process chains failed on removed
  `initiative.create`;
- the writer-contention test also used removed `initiative.create`;
- inspect still expected `itemCount` instead of `taskCount`.

The carry-forward context suite itself passed all 34 checks at this base. The
two historical “context-chain” assertions were embedded in the obsolete
initiative/item CLI process chains. They were intentionally removed rather
than restoring retired commands. Their replacement is a real typed chain that
exercises:

```text
status
context --kind task --id <typed-task>
detail --kind task --id <typed-task>
messages --kind task --id <typed-task>
export --kind task --id <typed-task>
claim --task <typed-task>
plan --kind feature --id <typed-feature>
```

That replacement also proves the views and advisory plan do not mutate the
Task or event stream.

## GREEN

The new hierarchy suite passed after implementation:

```text
npm run coordination:hierarchy-view-self-test
6 tests passed, 0 failed
```

The focused and directly affected regressions passed:

```text
node test/coordination-cli-self-test.mjs
8 tests passed, 0 failed

node test/coordination-context-self-test.mjs
34 tests passed, 0 failed

node test/work-status-self-test.mjs
all checks passed

node test/coordination-host-self-test.mjs
54 tests passed, 0 failed

node test/coordination-hierarchy-engine-self-test.mjs
11 tests passed, 0 failed

node test/coordination-engine-self-test.mjs
79 tests passed, 0 failed

node test/coordination-report-self-test.mjs
85 tests passed, 0 failed

npm run check-syntax
74 JS/MJS helpers parsed cleanly
```

The full `npm test` was not run. The plan explicitly defers the synchronized
release and full-suite gate to Task 12.

## Design notes

### Status

Status is a derived tree:

```text
Current Goal
└─ Epic
   └─ pack
      └─ Feature
         └─ Requirement
            └─ Task
```

Required and optional counts remain distinct. Completed lifecycle is rendered
as lifecycle and never as an attention value.

### Attention

Attention reasons are derived from current records and relationships:

- stale Direction;
- effective holds;
- inactive or missing ancestors;
- unmet or missing dependencies;
- missing referenced evidence;
- recorded blocked/recovery state;
- blocking questions;
- operator-only activation, completion, or production action.

Only structured authority determines whether a hold itself requires a human;
free-form hold prose is not treated as authorization.

### Context

The existing typed evidence/message projection remains the bounded base.
Hierarchy metadata is added within the same read snapshot. Required hierarchy
bytes are never truncated. If they cannot fit, the view returns
`CONTEXT_BUDGET`; recent messages are the only optional tail.

### Plan

Planning traverses the selected Epic, Feature, Requirement, or Task and returns
only Task records. Exclusions retain explicit reason codes. Missing future
roles remain visible staffing gaps but do not suppress otherwise executable
work; a missing role blocks planning only when it owns the current next
action.

## Review

User instructions prohibited subagent dispatch, so review was performed
directly against the complete diff and focused regressions.

Review found and fixed:

1. malformed or one-sided hierarchy relationships could otherwise reach the
   executable plan; attention now derives a blocking evidence gap;
2. planning initially excluded a Task for any future staffing gap; it now
   excludes only when the current next action lacks its installed role;
3. human hold classification initially risked inferring authority from
   free-form prose; it now uses structured owner/scope authority.

No open correctness finding remains from the review.

## Concerns

- Schema-5 manifest/path activation is intentionally not live until Task 9.
- Generated plugin artifacts, release metadata, and the full `npm test` remain
  intentionally deferred to Task 12.

## Fix round 1/5 — 2026-10-06

All five review findings were addressed.

### Restored CLI lifecycle coverage

The eight typed hierarchy-surface cases remain in
`coordination-cli-self-test.mjs`. The removed 32-case real-process lifecycle
suite is restored as `coordination-cli-lifecycle-self-test.mjs` and is part of
`npm test`.

The restored suite covers typed Task transitions, evidence capture, retained
artifacts, independent review, completion acceptance, handoff, terminal reopen
refusal, writer contention, exact authority, privacy, migration/rollback, and
native-host behavior. Its engineering and creative chains now use typed
Epic/Feature/Requirement/Task ancestry.

Restoring those cases exposed and fixed two native-host regressions:

- command grants now use the basis format consumed by runtime authority checks;
- observed evidence capture is matched to `content_ref`, not the retired
  verdict `subject` shape.

`docs/reference/coordination-acceptance.md` now names the lifecycle suite where
that process evidence actually lives.

### Hierarchy fixes

- `deriveAttention` now reloads the selected record after opening its read
  transaction and uses the same reader/snapshot for the record, ancestors,
  dependencies, approvals, questions, and next action.
- bounded context reports the nearest effective hierarchy hold for Tasks and
  child records, including its source subject, reason, release condition,
  basis references, setter, and timestamp.
- Requirement planning rejects one-sided Requirement→Task membership as
  `relationship-invalid`.
- proposed Feature and Requirement staffing includes the owning parent role
  that actually holds activation authority.
- planning remains advisory with `automatic: false`; the CLI surface regression
  still proves status/context/detail/messages/export/plan do not mutate the
  Task or event stream.

### RED evidence

Before the fixes:

```text
coordination-hierarchy-view-self-test.mjs
5 passed, 6 failed
```

The failures were the deriveAttention snapshot race, effective ancestor hold,
one-sided Requirement membership, and both activation-authority staffing cases.

Restoring the prior CLI suite against the typed runtime initially produced:

```text
32 tests
15 passed
17 failed
```

The failures identified every retired `item`/`initiative` selector and command
that needed a typed lifecycle replacement rather than deletion.

### GREEN evidence

```text
npm run coordination:hierarchy-view-self-test
11 passed, 0 failed

node test/coordination-cli-self-test.mjs
8 passed, 0 failed

node test/coordination-cli-lifecycle-self-test.mjs
32 passed, 0 failed

node test/coordination-context-self-test.mjs
34 passed, 0 failed

node test/work-status-self-test.mjs
all checks passed

node test/coordination-host-self-test.mjs
54 passed, 0 failed

node test/coordination-authority-self-test.mjs
all checks passed

node test/coordination-migration-self-test.mjs
118 passed, 0 failed

npm run check-syntax
74 JS/MJS helpers parsed cleanly
```

The full `npm test` was not run. The explicitly requested hierarchy-view, CLI,
context, work-status, host, authority, migration, and restored regression
suites all passed.

## Fix round 2/5 — 2026-10-07

The remaining source-CLI/generator boundary is now explicit and testable.

### Lifecycle matrix boundary

- `test/coordination-cli-lifecycle-self-test.mjs` still runs the source
  entrypoint by default.
- The same matrix can now target an explicit alternative entrypoint through
  `KAI_TEST_COORDINATION_ENTRYPOINT`, which is how Task 12 can run it against
  `plugins/kai-core/scripts/coordinate.mjs` after pack generation without
  copying the suite.
- The matrix now makes a non-vacuous assertion about the exercised entrypoint:
  the CLI reports the selected entrypoint under the test-only
  `KAI_TEST_REPORT_COORDINATION_ENTRYPOINT` flag, and the suite checks that both
  direct CLI execution and the native-fixture path used the same reported
  entrypoint.

Implementation notes:

- added `test/helpers/coordination-cli-entrypoint.mjs` to resolve the default
  source entrypoint or an explicitly supplied generated one;
- switched the native lifecycle fixture to import `runCLI` through that helper
  instead of hard-coding `src/core/coordinate.mjs`;
- taught `src/core/coordinate.mjs` to include a test-only `entrypoint` field in
  results when the reporting flag is set, leaving normal CLI output unchanged.

### Truthful docs

`docs/reference/coordination-acceptance.md` now:

- cites the current source suites by file name and actual reported counts:
  `coordination-cli-self-test.mjs` (**8**), `coordination-cli-lifecycle-self-test.mjs` (**32**),
  and `coordination-migration-self-test.mjs` (**118**);
- removes the stale claim that generated pack checks already pass;
- states that executing the lifecycle matrix against generated
  `plugins/kai-core/scripts/coordinate.mjs` is the Task 12 emitted-pack gate;
- reconciles migration coverage to the test's actual reported **118** tests.

### Verification

Commands run in this round:

```text
node test/coordination-cli-self-test.mjs
8 tests passed, 0 failed

node test/coordination-cli-lifecycle-self-test.mjs
32 tests passed, 0 failed

node test/coordination-migration-self-test.mjs
118 tests passed, 0 failed

npm run docs:check
docs:check passed

npm run check-syntax
74 JS/MJS helpers parsed cleanly
```

No bundles or generated `plugins/` artifacts were regenerated in this task by
design; that emitted-pack gate remains with Task 12.

## Fix round 3/5 — 2026-10-07

The entrypoint assertion now measures the real spawned module path instead of a
forged label.

### Entrypoint identity

- Removed the trusted `KAI_TEST_COORDINATION_ENTRYPOINT_LABEL` path from the
  reporting flow.
- `src/core/coordinate.mjs` now reports a normalized absolute entrypoint path
  only after checking that its direct `process.argv[1]` matches
  `import.meta.url`.
- The lifecycle matrix compares the spawned entrypoint path to the reported
  actual path and includes a forged-label mutation that no longer changes the
  result.

### Verification

```text
node test/coordination-cli-lifecycle-self-test.mjs
32 tests passed, 0 failed

node test/coordination-cli-self-test.mjs
8 tests passed, 0 failed

npm run check-syntax
74 JS/MJS helpers parsed cleanly
```

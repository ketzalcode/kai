# Task 8 report: lean behavioral suite

## Existing-entrypoint disposition

This table was completed before deleting any test entrypoint. The inventory is
the 46 `test/*-self-test.mjs` files present at base
`de9a1794cc975aab53eafb0a79cbaab9a81ec05f`.

| Existing entrypoint | Disposition |
| --- | --- |
| `activity-self-test.mjs` | delete: duplicate |
| `consumer-install-self-test.mjs` | retain |
| `coordination-authority-self-test.mjs` | delete: prose/policy |
| `coordination-cli-lifecycle-self-test.mjs` | delete: duplicate |
| `coordination-cli-self-test.mjs` | delete: duplicate |
| `coordination-context-self-test.mjs` | move named case `projection sequence advances without mutating or retroactively changing old snapshots` to `coordination-core-self-test.mjs` |
| `coordination-engine-self-test.mjs` | move named cases for stale Direction handoff refusal, lease collision, Task reservation, unauthorized transition, and Task completion to `coordination-core-self-test.mjs` |
| `coordination-evidence-self-test.mjs` | move the conflicting current completion-evidence refusal class to `coordination-core-self-test.mjs` |
| `coordination-foundation-self-test.mjs` | delete: duplicate |
| `coordination-hierarchy-contract-self-test.mjs` | delete: duplicate |
| `coordination-hierarchy-engine-self-test.mjs` | move the Epic → Feature → Requirement → Task creation class to `coordination-core-self-test.mjs` |
| `coordination-hierarchy-view-self-test.mjs` | delete: duplicate |
| `coordination-host-self-test.mjs` | delete: historical |
| `coordination-inputs-self-test.mjs` | delete: duplicate |
| `coordination-native-discovery-self-test.mjs` | delete: unsupported platform/browser/demo permutation |
| `coordination-native-handshake-self-test.mjs` | delete: unsupported platform/browser/demo permutation |
| `coordination-native-scenarios-self-test.mjs` | delete: unsupported platform/browser/demo permutation |
| `coordination-report-browser-self-test.mjs` | delete: unsupported platform/browser/demo permutation |
| `coordination-report-self-test.mjs` | delete: duplicate |
| `coordination-schema-self-test.mjs` | retain |
| `coordination-store-self-test.mjs` | move named cases for SQLite rollback, optimistic version conflict, cross-subject isolation, and snapshot consistency to `coordination-core-self-test.mjs` |
| `coordination-thread-self-test.mjs` | delete: duplicate |
| `creative-agent-contract-self-test.mjs` | delete: prose/policy |
| `creative-core-contract-self-test.mjs` | delete: prose/policy |
| `creative-diagram-layout-self-test.mjs` | delete: unsupported platform/browser/demo permutation |
| `creative-foundation-self-test.mjs` | delete: prose/policy |
| `creative-screenplay-self-test.mjs` | retain |
| `creative-skill-contract-self-test.mjs` | delete: prose/policy |
| `demo-capture-self-test.mjs` | delete: unsupported platform/browser/demo permutation |
| `demo-format-self-test.mjs` | delete: unsupported platform/browser/demo permutation |
| `demo-narrate-self-test.mjs` | delete: unsupported platform/browser/demo permutation |
| `demo-zoom-self-test.mjs` | delete: unsupported platform/browser/demo permutation |
| `direction-self-test.mjs` | delete: historical |
| `engineering-agents-self-test.mjs` | delete: prose/policy |
| `engineering-foundation-self-test.mjs` | delete: prose/policy |
| `observe-subagent-self-test.mjs` | delete: duplicate |
| `observe-watch-self-test.mjs` | delete: duplicate |
| `package-availability-self-test.mjs` | move active-package and package-boundary cases to `package-build-self-test.mjs` |
| `publication-contract-self-test.mjs` | retain |
| `release-automation-self-test.mjs` | retain |
| `release-readiness-ref-self-test.mjs` | delete: duplicate |
| `repository-instructions-self-test.mjs` | retain |
| `work-status-self-test.mjs` | delete: duplicate |
| `workspace-current-self-test.mjs` | retain |
| `workspace-doctor-self-test.mjs` | delete: duplicate |
| `workspace-layout-self-test.mjs` | delete: duplicate |

## Moved behavioral cases

| Guarantee / defect class | Canonical case | Source disposition |
| --- | --- | --- |
| SQLite transaction rollback | `SQLite transaction rollback leaves records, events, and receipts unchanged` | Reduced from the rollback paths in `coordination-store-self-test.mjs`. |
| Optimistic version conflict | `optimistic version conflict rejects a stale mutation` | Reduced from the store operation/version case. |
| Cross-subject isolation | `cross-subject records stay isolated by typed subject` | Reduced from `readSubjectView loads cross-subject inputs but keeps local obligations isolated`. |
| Unauthorized transition | `unauthorized transition is refused without acting authority` | Reduced from the Task transition authority permutations. |
| Lease collision | `lease collision refuses overlapping active work` | Reduced from `granting rejects same-role regrant, stale tokens, unavailable roles, and touch conflicts`. |
| Epic → Feature → Requirement → Task creation | `Epic -> Feature -> Requirement -> Task creation persists the current hierarchy` | Reduced from the hierarchy proposal/activation and Task-create cases. |
| Task reservation and completion | `Task reservation and completion use the persisted lease and current approval` | Reduced from persisted-grant and knowledge-completion cases. |
| Stale Direction handoff refusal | `stale Direction handoff refuses an unsafe recipient` | Reduced from `Direction drift permits leased evidence and a safe handoff but blocks forward work`. |
| Conflicting current completion evidence | `conflicting current completion evidence refuses completion` | Reduced from the current positive/negative completion-proof conflict case. |
| Snapshot/current-version consistency | `snapshot and current version stay internally consistent while a writer advances` | Reduced from the store/context WAL snapshot cases. |
| Exactly three active packages | `exactly three active packages are planned` | Moved from `package-availability-self-test.mjs`. |
| Supported package combinations | Four Core/package install cases | Consolidated from package availability/foundation and the former four consumer permutations. |
| No department dependency | `department packages do not depend on each other` | Consolidated from package reference/ownership suites. |
| No external runtime import | `generated executables reject external runtime imports` | Moved from consumer and pack-preview permutations. |
| Stable generated filenames | `generated script filenames are stable for identical source` | New narrow filename check; bundle/version assertions remain Task 9 work. |
| Generated drift detection | `generated drift detection reports a changed committed file` | Uses the real `checkCommitted` implementation against a copied generated tree. |

Before deleting the old coordination files, the representative source cases
were run with `--test-name-pattern`: store (2), engine (4), hierarchy (1),
evidence (1), and context (1) all passed. The replacement coordination suite
then passed all 10 canonical cases.

## Validation

Requested measurement:

```text
npm test: exit 0
59 tests, 59 passed
ELAPSED_SECONDS=11.08
TEST_FILES=9
TEST_LINES=1874
```

| Measure | Base | Lean suite | Target |
| --- | ---: | ---: | ---: |
| Entrypoints | 46 | 9 | ≤15 |
| Test lines | 21,309 | 1,874 | ≤8,000 |
| `npm test` | Did not complete; the historical chain reached a pre-existing host failure after multi-minute suites | 11.08 seconds | ≤60 seconds |

The all-pack consumer case executed all nine generated public entrypoints from a
copied install outside the checkout and without `node_modules`.

## Concerns

- The historical suite is already red at the requested base commit:
  `coordination-host-self-test.mjs` fails
  `native question-answer delegation binds the exact Task question and
  recipient` with `INVALID_INPUT`. That entrypoint is classified historical
  and is not part of the replacement suite.
- Task 9 owns deeper stable-bundle and version-metadata coverage. This task
  limits package-build coverage to filenames, drift, package combinations, and
  dependency/import boundaries.
- The separate `host-contract` commands remain because their malformed
  frontmatter and golden-inventory guarantee is not duplicated by the lean
  package/consumer suite. Removing them would discard a distinct check.
- Playwright was removed from development dependencies after deleting the only
  browser-backed test entrypoints. `npm install --package-lock-only` reported
  the current Node `24.14.0` is below the declared `^24.15.0` engine, but the
  measured suite passed on that machine.

---

## Review round 1/5 — 2026-10-08

### Outcome

- Replaced the list-only subject check with the recovered `readSubjectView`
  regression. Foreign artifact and evidence inputs remain loadable, while
  foreign questions, opening/answer messages, recent messages, message counts,
  handoffs, and recovery obligations stay outside the local projection.
- Replaced conflicting approval decisions with current positive and negative
  completion evidence. Completion now proves the conflict is refused and that
  an explicit same-scope superseding positive record restores acceptance.
- Replaced the load-only copied-pack probe with command-specific smoke
  invocations for all nine public entrypoints. Every process must exit `0`; a
  failure reports its status, stdout, and stderr. The copied install and
  consumer repository still contain no `node_modules`.

### RED evidence

The restored coordination cases were checked against temporary production
mutants, then the mutants were reverted:

```text
readSubjectView waiting-question lookup without the subject guard:
tests 1, pass 0, fail 1
Expected local missing-question count 1, received 0.

completion evidence validation checking only the cited positive record:
tests 1, pass 0, fail 1
Missing expected exception.
```

The initial exit-status assertion used the former generic probe argument:

```text
node test\consumer-install-self-test.mjs
consumer-install self-test: 7 FAILED
```

The seven failures were `coordinate`, `observe-watch`, `work-status`,
`workspace-doctor`, `demo-format`, `demo-narrate`, and `demo-zoom`; their real
nonzero status and output are now test failures rather than ignored load
results.

### GREEN evidence

```text
node --test --test-reporter=spec test\coordination-core-self-test.mjs
tests 10, pass 10, fail 0

node test\consumer-install-self-test.mjs
9 generated entrypoints executed with command-specific status-0 probes
consumer-install self-test: all checks passed

npm test
tests 59, pass 59, fail 0
ELAPSED_SECONDS=8.96
TEST_FILES=9
TEST_LINES=2141

git diff --check
clean
```

The suite remains within every Task 8 target: at most 15 entrypoints, at most
8,000 test lines, and at most 60 seconds.

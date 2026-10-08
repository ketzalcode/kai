# Task 7 RED/GREEN Report

Date: 2026-10-06

## Scope

Task 7 binds live secondary coordination records to one exact hierarchy
subject:

```js
{kind: 'epic' | 'feature' | 'requirement' | 'task', id: '<typed-id>'}
```

It removes live Item-bound evidence, communication, acceptance, host-record,
context, and report semantics while retaining schema-1 Item fields only in
historical readers and migration code.

Task-only execution and release gates remain Task-only. Parent completion
evidence and communication can bind parent hierarchy subjects. The Task 6
stale-Direction live-lease restriction remains unchanged.

Full `npm test`, schema-5 activation, final hierarchy CLI views, generated
packs, and release metadata remain owned by Tasks 8–12.

## RED

Tests were changed before the production implementation.

### New expectations

- `validateHierarchySubject`, `subjectRef`, and `subjectEquals` are shared
  contract helpers.
- Message and question envelope/body subjects must match and can use a Feature
  subject.
- Attempts and other execution records reject non-Task subjects.
- Context accepts `{subject}` and reads parent-subject communication.
- Criteria references change when subject version, relationship version, or
  immutable Task content changes.
- Parent completion evidence binds the exact parent subject.
- Feature evidence/approval cannot satisfy a Task.
- Report paths use typed pack/report/ID routes rather than generic review/run
  lanes.

### Observed RED

| Suite | RED result |
| --- | --- |
| `node test/coordination-thread-self-test.mjs` | Exit 1: `contract.mjs` did not export `subjectRef`. |
| `node test/coordination-context-self-test.mjs` | Exit 1: 30 passed, 4 failed. The existing suite still invoked retired `item.transition` / `item.update`, and the new Feature message body rejected its unknown `subject` field. |
| `node test/coordination-evidence-self-test.mjs` | Exit 1: the suite still used legacy Item fixtures, `item_id`, generic run paths, and criteria hashes without typed subject versions/relationships. |
| `node test/coordination-report-self-test.mjs` | Exit 1: report construction and persistence still required `itemId`, Item envelopes, and generic `.kai/review` / `.kai/runs` paths. |

The failures were caused by the missing typed-subject implementation and
retired assumptions, not test syntax errors.

## GREEN implementation

### Shared subject and criteria contract

- Added:
  - `validateHierarchySubject(subject, label)`
  - `subjectRef(subject, version)`
  - `subjectEquals(left, right)`
- Callers use the shared helpers for hierarchy identity and versioned basis
  references.
- `criteriaRef(record, lookup)` now binds:
  - hierarchy kind and ID;
  - exact subject version;
  - acceptance criteria and authorities;
  - direct hierarchy relationship versions;
  - immutable Task `change_ref`, when applicable.
- Secondary body `subject` now means the hierarchy subject. Immutable file/Git
  identity uses `content_ref`.
- Record validation requires SQLite envelope subject and body subject to agree.

### Task-only execution boundaries

- Grants, recovery attempts, host attempts, effects, execution artifacts,
  assets, reviews, release evidence, deployment approvals, and recovery
  approvals require Task subjects.
- Host bodies use `subject` / `subject_version`.
- Asset history uses `at_subject_version`; approvals use
  `recorded_at_subject_version`.
- Evidence and artifact registration that does not mutate the hierarchy record
  no longer increments its version. This keeps exact version-bound criteria
  stable across append-only secondary writes while retaining optimistic
  concurrency for real hierarchy mutations.
- Existing stale-Direction evidence/handoff authority still requires the live
  Task lease established in Task 6.

### Parent communication and completion evidence

- Messages and questions bind any hierarchy subject and version their durable
  thread with `subjectRef`.
- Parent-message links cannot cross hierarchy subjects.
- Parent completion approvals bind only the exact parent subject and current
  criteria.
- `parent-completion` evidence binds a parent subject and requires an observed
  trusted capture plus explicit accepted report safe-excerpt references.
- Cross-subject context inputs remain readable as inputs, but verdict/evidence
  verification still requires the exact owning subject. Cross-kind evidence
  never satisfies another subject.

### Context and store

- Context and message reads use `{subject}` rather than `itemId`/thread aliases.
- Current context selects current subject-version messages and criteria; stale
  messages and decisions remain historical.
- Message pagination uses the typed subject plus an indexed sequence cursor.
- Added `events_by_subject_messages` to preserve bounded keyset pagination.
- Schema-1 Item records remain available only through the read-only historical
  decoder. Live schema-2 records require typed hierarchy subjects.

### Evidence privacy and input basis

- Private paths use typed pack/type/ID/lifecycle grammar.
- Personal paths remain private even under a report type.
- Cross-subject context inputs retain their owning subject criteria in the
  captured input basis.
- Public report excerpts must be public-classified, current, integrity-checked,
  and explicitly referenced by a current verified completion approval.
- Broken, private, or unaccepted artifact bytes are withheld from report
  previews.

### Reports

- APIs are now:

```js
buildReport(store, {subject});
writeReport({root, subject, view, target});
```

- Report paths are typed private report paths:

```text
.kai/<pack>/reports/<typed-subject-id>/evidence/
```

- No live report or evidence path uses generic `.kai/runs` or `.kai/review`.
- `writeReport` accepts only the exact derived typed target and an externally
  accepted hash for the redacted view. Core does not manufacture publication
  acceptance.
- Report sidecars bind the typed subject and subject version.

## Review findings fixed

Self-review found and fixed:

1. Cross-subject context artifacts initially disappeared from context. The
   store now reads their global record identity while acceptance verification
   remains subject-exact.
2. Binding criteria directly to the hierarchy version exposed append-only
   secondary writes that unnecessarily advanced the Task version. The store
   now avoids a primary rewrite when the primary body is unchanged.
3. Parent message links could initially name a message owned by another
   hierarchy subject. The Task/message handler now rejects that link.
4. A report helper initially generated its own “accepted” target hash. It was
   removed; callers must supply the prevalidated target and accepted hash.
5. Public report previews initially treated public classification alone as
   acceptance. They now require an effective verified completion approval that
   explicitly references the artifact.
6. Historical schema-1 secondary records would have been decoded by the new
   live schema. A separate read-only legacy decoder now preserves their Item
   envelope/body binding.

No subagents were dispatched, as required.

## Final verification

All commands ran from:

```text
C:\src\kai\.worktrees\schema5-composable-workspace
```

### Required suites

| Command | Result |
| --- | --- |
| `node test/coordination-thread-self-test.mjs` | Exit 0 — all checks passed |
| `node test/coordination-context-self-test.mjs` | Exit 0 — 34 passed |
| `node test/coordination-evidence-self-test.mjs` | Exit 0 — 81 passed |
| `node test/coordination-report-self-test.mjs` | Exit 0 — 84 passed |

### Directly affected regressions

| Command | Result |
| --- | --- |
| `node test/coordination-store-self-test.mjs` | Exit 0 — 20 passed |
| `node test/coordination-engine-self-test.mjs` | Exit 0 — 78 passed |
| `node test/coordination-host-self-test.mjs` | Exit 0 — 53 passed |
| `node test/coordination-authority-self-test.mjs` | Exit 0 — all checks passed |
| `node test/coordination-inputs-self-test.mjs` | Exit 0 — 28 passed |
| `node tools/check-syntax.mjs` | Exit 0 — 73 helpers parse cleanly |
| `git diff --check` | Exit 0 |

Counted Node tests: **378 passed, 0 failed**, plus the thread and authority
self-test checks.

### Retired-assumption search

```text
rg "itemId|item_id|\.kai/runs|\.kai/review" src/core/lib/coordination-runtime
```

The remaining matches are limited to:

- schema-1 physical columns and read-only historical decoding;
- legacy Initiative backlog fields;
- explicit schema-3/schema-4 migration paths and source fields.

No live evidence, message, context, host, or report API/path retains those
assumptions.

## Deferred checks and concerns

- Full `npm test` is intentionally deferred to Task 12 by the controller
  ruling.
- Final hierarchy status/plan/CLI and work-status integration remains Task 8.
  The full CLI/work-status suites were not claimed here.
- Real native host scenarios remain behind their explicit authorization gates;
  the normal skipped probes were not used as live-host verification.
- Version, changelog, README status, and generated pack updates remain
  intentionally deferred to Task 12.
- The report suite is intentionally exhaustive and took roughly 15–17 minutes
  on this Windows environment.

## Fix round 1/5 — 2026-10-06

### Findings addressed

1. Command-created handoff, question, answer, and recovery messages now bind
   the resulting hierarchy subject version. Message commands advance the
   primary version even when their descriptive body is otherwise unchanged.
   Context cursors and continuation reads bind the exact typed subject,
   `thread_id`, `basis_version`, and sequence cursor. Report history capture
   applies the same filters.
2. Removed the invented `report:` reference grammar. Parent completion now
   uses one persisted chain:
   - an exact parent-subject public report artifact;
   - a parent-subject `parent-completion` evidence record with observed capture;
   - a current completion-authority approval that explicitly references both
     the evidence and report artifact;
   - one current accepted asset revision bound to that approval;
   - current parent criteria/version and filesystem integrity verification.
   Missing, stale, and cross-subject records fail closed. Report output withholds
   private observed evidence content; only an explicitly accepted public report
   artifact is captured as a bounded, escaped safe excerpt.
3. Native `question.answer` delegation now requires a Task-owned question.
   The existing exact Task ID, addressed recipient, non-operator, parent
   capability, routing basis, and bounded-action checks remain intact.
4. Task criteria relationship bindings now include every `depends_on` Task
   ID, version, and required state in canonical order. A dependency version or
   required-state change invalidates dependent proof.

Task 6 lifecycle, lease, recovery-hold, and stale-Direction gates were not
relaxed.

### Regression evidence

The new tests were observed failing before their corresponding fixes:

| Regression | RED evidence |
| --- | --- |
| Result-version message binding | Targeted engine tests reported message basis versions `1 !== 2` and `2 !== 3`; an unchanged parent question command returned record version `1 !== 2`. |
| Exact thread pagination | Context pagination returned a same-subject version-2 message while requesting the version-1 thread. |
| Task dependency proof | The criteria hash remained identical after the upstream Task version changed. |
| Native Task answer delegation | The native host rejected a real Task question with `AUTHORITY_REQUIRED` because it checked legacy kind `item`. |
| Parent proof/public report chain | The final positive chain requires a parent-bound artifact/evidence/approval/accepted revision; nonexistent, stale, and cross-subject variants are asserted as `EVIDENCE_GAP`. |

### Final verification

All commands ran from:

```text
C:\src\kai\.worktrees\schema5-composable-workspace
```

| Command | Result |
| --- | --- |
| `node test/coordination-thread-self-test.mjs` | Exit 0 — all checks passed |
| `node test/coordination-context-self-test.mjs` | Exit 0 — 34 passed |
| `node test/coordination-evidence-self-test.mjs` | Exit 0 — 82 passed |
| `node test/coordination-report-self-test.mjs` | Exit 0 — 85 passed |
| `node test/coordination-host-self-test.mjs` | Exit 0 — 54 passed, including native Task answer delegation |
| `node test/coordination-engine-self-test.mjs` | Exit 0 — 79 passed |
| `node test/coordination-store-self-test.mjs` | Exit 0 — 20 passed |
| `node test/coordination-inputs-self-test.mjs` | Exit 0 — 28 passed |
| `node test/coordination-hierarchy-contract-self-test.mjs` | Exit 0 — 8 passed |
| `node test/coordination-hierarchy-engine-self-test.mjs` | Exit 0 — 11 passed |
| `node test/coordination-authority-self-test.mjs` | Exit 0 — all checks passed |
| `node test/coordination-report-browser-self-test.mjs` | Exit 0 — 1280 px and 320 px file-URL safety/layout checks passed; synthetic, not host visual acceptance |
| `node tools/check-syntax.mjs` | Exit 0 — 73 helpers parse cleanly |
| Typed message CLI parser assertion | Exit 0 — exact subject/thread/basis options parsed |
| `git diff --check` | Exit 0 |

Full `npm test`, release metadata, generated packs, and final hierarchy CLI
cutover remain deferred to their controller-owned later tasks. No subagents
were dispatched.

## Fix round 2/5 — 2026-10-06

### Finding addressed

Parent completion now applies the same scoped-negative rule as generic positive
evidence verification. For the exact current parent subject, version, criteria,
and `parent-completion` evidence scope:

- every referenced positive record must remain effective;
- any parallel effective `failed` or otherwise non-positive record blocks the
  completion gate;
- explicit same-scope supersession removes the failed record from the effective
  set and restores completion when all remaining effective records are passed.

The specialized parent verifier and generic reference verifier now share
`requirePositiveEffectiveEvidence`, preventing the two acceptance paths from
drifting again.

### RED evidence

```text
node --test --test-name-pattern="parent completion requires" test/coordination-evidence-self-test.mjs
```

Exit 1: the new passed-plus-failed regression reported:

```text
Missing expected exception: parallel current passed and failed
parent-completion evidence must block completion
```

This confirmed that the runtime completion gate accepted the referenced passed
record while ignoring another effective failed record in the same scope.

### GREEN verification

All commands ran from:

```text
C:\src\kai\.worktrees\schema5-composable-workspace
```

| Command | Result |
| --- | --- |
| `node --test --test-name-pattern="parent completion requires|effective negative observed evidence persists|negative review/approval history" test/coordination-evidence-self-test.mjs` | Exit 0 — 3 passed |
| `node --test --test-name-pattern="knowledge completion consumes|negative review is not erased|explicit supersession resolves" test/coordination-engine-self-test.mjs` | Exit 0 — 3 passed |
| `node test/coordination-hierarchy-engine-self-test.mjs` | Exit 0 — 11 passed |
| `node --test --test-name-pattern="transitive negative evidence|current approval cannot hide|private proof content" test/coordination-report-self-test.mjs` | Exit 0 — 3 passed |
| `node --test --test-name-pattern="parent completion requires" test/coordination-evidence-self-test.mjs` | Exit 0 — passed-plus-failed conflict rejected; explicit supersession restored the existing completion approval |

Full `npm test`, release metadata, generated packs, and final hierarchy CLI
cutover remain deferred to their controller-owned later tasks. No subagents
were dispatched.

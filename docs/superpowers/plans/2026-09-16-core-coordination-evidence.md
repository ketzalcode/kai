# Core Coordination and Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make requested engineering/creative coordination transactional, resumable,
context-bounded, and inspectable through private offline HTML evidence.

**Architecture:** Keep the host responsible for agents and tools. Put operational
state and accepted events in one local SQLite store; expose validated commands,
bounded context packets, and read-only Markdown/HTML views. Preserve direct
single-shot domain work without workspace ceremony.

**Tech Stack:** Node ESM, built-in `node:sqlite`, existing Node assertion/self-test
conventions, existing Playwright, Git, Markdown skills, offline HTML.

**Spec:** `docs\superpowers\specs\2026-09-16-core-coordination-evidence-design.md`

## Global Constraints

- Scope: `kai-core`, with engineering and creative as its only integration targets.
- The five pre-release packages are outside this design.
- Use SQLite at `.kai\state\coordination.sqlite` under the resolved workspace.
- The initial database and message schema versions are both `1`.
- Introduce workspace schema `4`, replacing the inspected schema `3`.
- At most 24 KiB of UTF-8 projection text and eight recent relevant message summaries.
- Required authority, acceptance, blockers, and revision fields cannot be silently truncated.
- Network filesystems, replicated databases, cross-machine leases, and merging live databases are unsupported.
- Reports are offline HTML with no external assets, trackers, or CDN dependencies.
- Builders retain ownership of changed-behavior regression tests.
- Per-task automatic quality-based model selection is deferred.
- Repository Node engines: `^22.22.2 || ^24.15.0 || >=26.0.0`.
- Never hand-edit generated package scripts or introduce a second handwritten source.
- Never disable global CI gates to accommodate deferred pre-release work.
- Use native Windows paths for shell commands; keep normal ESM module specifiers in source.

---

## Execution boundary and baseline

This is a plan, not an implementation. The spec was approved on 2026-09-16.
Execute in an isolated worktree established with `using-git-worktrees`; do not
absorb the existing untracked creative documents into this work.

The planning environment has Node `v24.14.0`, below the allowed 24.x floor.
An in-memory SQLite probe works but emits an experimental warning. This is not
supported-version acceptance. Select a supported installed Node or obtain approval
to update the environment before runtime implementation acceptance. Do not change
the engine floor merely to fit this machine.

The repository documents existing global validation failures. Capture their actual
baseline at execution time. They are not permission to ignore new failures, claim
release readiness, or refactor pre-release packages without approval.

Use one feature branch and one integration PR for this foundation. The numbered
tasks are reviewable commits, not separately released partially wired products.
Record all commits with the required Copilot co-author trailer. Stage named files
only. Tasks may add tests using the existing runner convention, not new tooling.

## File and interface map

All paths below are relative to the repository root. New modules belong to the
existing canonical `scripts` runtime source; pack generation emits their closure.

| File | Responsibility |
| --- | --- |
| `scripts\lib\coordination.mjs` | Existing legacy parsing; add reconciled thread reading |
| `scripts\lib\workspace-path-safety.mjs` | Extract existing physical/path safety for reuse, without changing its behavior |
| `scripts\lib\coordination-runtime\contract.mjs` | Versioned command/record/message validation, canonical JSON, typed errors |
| `scripts\lib\coordination-runtime\store.mjs` | SQLite schema, transactions, CAS, operation deduplication |
| `scripts\lib\coordination-runtime\engine.mjs` | Lifecycle, reservations, questions, handoffs, recovery |
| `scripts\lib\coordination-runtime\evidence.mjs` | Content references, evidence registration, reviews and approval binding |
| `scripts\lib\coordination-runtime\context.mjs` | Bounded projections and referenced-detail retrieval |
| `scripts\lib\coordination-runtime\host.mjs` | Host capability records, dispatch attempts, model policy/telemetry |
| `scripts\lib\coordination-runtime\report.mjs` | Deterministic read-only Markdown/HTML views |
| `scripts\lib\coordination-runtime\migration.mjs` | Explicit legacy import, backup, activation, and rollback checks |
| `scripts\lib\coordination-runtime\inspection.mjs` | Schema-4 store/artifact/view integrity for doctor and status |
| `scripts\coordinate.mjs` | Short-lived CLI; resolver, preflight, commands, structured results |
| `test\helpers\coordination-runtime-fixture.mjs` | Isolated deterministic fixtures and guaranteed store cleanup |
| `test\coordination-*-self-test.mjs` | Focused assertions listed under the tasks |

Keep modules focused. Split a module only along an actual independently testable
responsibility; do not create an abstract framework or one class per command.

### Shared data interfaces

Use JSDoc and runtime guards in ESM; do not add TypeScript tooling for this feature.
These field names are shared across tasks:

```js
/**
 * @typedef {{role: string, runId: string}} Actor
 * @typedef {{kind: string, id: string, itemId: string|null,
 *   version: number, body: object}} Record
 * @typedef {{operationId: string, kind: string, actor: Actor,
 *   recordKind: string, recordId: string, expectedVersion: number,
 *   leaseToken: string|null, payload: object}} Command
 * @typedef {{actor: Actor, actions: string[], recordKind: string,
 *   recordId: string, basisRef: string}} AuthorityGrant
 * @typedef {{roles: string[], grants: AuthorityGrant[]}} Authority
 * @typedef {{ok: true, operationId: string, recordVersion: number,
 *   eventSeq: number, data: object}
 *   | {ok: false, code: string, message: string, retryable: boolean}} Result
 */
```

Creation expects version `0`; stored records begin at `1`. Use generated UUIDs for
operations, attempts, messages, and grants; preserve imported work IDs. `body`
is not unchecked free-form input: each record and command kind has a closed
validator. Reject unknown command fields and unsupported schema versions.
Resolve authority from persisted grants and real host inputs, not an arbitrary
`authority` object supplied on CLI stdin. Local code can still bypass this API;
the runtime is not an authentication boundary against its own OS user.

Test code blocks are assertion seeds, not the entire test files. Each new test
uses `node:assert/strict`, explicit imports from the module under test, and the
shared fixture where named. Extend each seed with the listed cases; do not count
a literal-object assertion as coverage of persisted behavior.

Expose `RuntimeError(code, message, retryable = false)` in `contract.mjs`.
Expected error codes are `INVALID_INPUT`, `SCHEMA_MISMATCH`, `VERSION_CONFLICT`,
`LEASE_CONFLICT`, `OPERATION_CONFLICT`, `AUTHORITY_REQUIRED`, `ROLE_UNAVAILABLE`,
`MODEL_UNAVAILABLE`, `EVIDENCE_GAP`, `CONTEXT_BUDGET`, `STORE_BUSY`,
`RECOVERY_REQUIRED`, and `UNSUPPORTED_HOST`.

Internal modules throw typed domain errors; the CLI translates only recognized
domain errors to `Result`. Unexpected exceptions remain visible failures with a
nonzero exit. Do not catch arbitrary failures and manufacture an empty record.

Fixtures export `withWorkspace(fn)`, `seedItem(store, overrides = {})`, and
`command(kind, overrides = {})`. `withWorkspace` supplies `{root, store, now}` with
an isolated schema-4 manifest and closes the store before removing only its own
allocated fixture directory. `seedItem` supplies an approved knowledge item,
version 1, no lease, no questions, and distinct scope/producer/acceptance actors.
`command` supplies fresh IDs and expected version 1; tests override identities
explicitly for replay and independence cases.

## Task 1: Repair legacy thread reading

**Files:** Modify `scripts\lib\coordination.mjs`, `scripts\work-status.mjs`.
Create `test\coordination-thread-self-test.mjs`.

**Interfaces:** Add `parseThread(raw) -> {questions, answers, diagnostics}`.
Keep `parseQuestions(raw) -> questions` backward-compatible while returning
reconciled status. Existing status callers continue to use `parseQuestions`.

- [ ] Add this failing regression to the new assertion script:

```js
import assert from 'node:assert/strict';
import { parseQuestions } from '../scripts/lib/coordination.mjs';
const raw = [
  '## QUESTION Q-demo-01 2026-09-16-1400 - eng-builder-software -> @operator',
  '- status: open', '- kind: decision', '- blocking: yes',
  '- ask: Approve this revision?', '- answer_by: next-dispatch',
  '## ANSWER Q-demo-01 2026-09-16-1401 - operator -> @eng-builder-software',
  '- status: answered', '- answer: Approved', '- lane: in-lane',
  '- provenance: operator',
].join('\n');
assert.equal(parseQuestions(raw).length, 1);
assert.equal(parseQuestions(raw)[0].status, 'answered');
```

- [ ] Run `node test\coordination-thread-self-test.mjs`; require failure at the
  missing question before changing the parser.
- [ ] Implement one header parser for bracketed/unbracketed IDs, optional time,
  heading prefixes, and both arrows. Keep code fences ignored. Collect messages
  first, then reconcile by question ID rather than treating ANSWER as a terminator.
  Use this reconciliation guard:

```js
const canResolve = answer.status === 'answered'
  && answer.lane === 'in-lane'
  && answer.from === question.to
  && answer.to === question.from;
```

- [ ] Add cases for bracketed existing fixtures, unanswered questions, out-of-lane
  responses, orphan answers, exact duplicates, conflicting answers, misleading
  fenced examples, and already-answered legacy questions. Conflicts stay open and
  produce diagnostics; never select the latest contradictory answer silently.
- [ ] Run `node test\coordination-thread-self-test.mjs` and
  `node scripts\work-status.mjs --self-test`. Review the changed parser against
  both skill templates; commit the parser, caller adjustment, and regression.

## Task 2: Remove compulsory pre-release authority from the active flow

**Files:** Modify the following core sources:
`agents\director-chief-of-staff.agent.md`,
`agents\workflow-initiative-init.agent.md`,
`skills\kai-core-initiative-stewardship\SKILL.md`,
`skills\kai-core-work-item\SKILL.md`,
`skills\kai-core-work-acting\SKILL.md`,
`skills\kai-core-work-granting\SKILL.md`,
`skills\kai-core-scope-discipline\SKILL.md`,
`skills\kai-core-design-grounding\SKILL.md`,
`skills\kai-core-asset-closing\SKILL.md`,
`skills\kai-core-definition-of-done\SKILL.md`.
These paths are below `plugins\kai-core`.
Modify `plugins\kai-creative\agents\creative-lead-design.agent.md` to accept the
explicitly named authority without weakening design/QA separation.
Create `test\coordination-authority-self-test.mjs`.

**Interfaces:** Coordinated items declare `scope_authority` and
`completion_authority`, each a concrete current role or `operator`. Required
reviews retain `{role, kind}`; missing roles do not become implicit waivers.

- [ ] Write failing source-contract assertions for explicit authorities and no
  standing product-agent proxy for a human owner:

```js
assert.match(workItemSource, /scope_authority/);
assert.match(stewardshipSource, /operator/);
assert.doesNotMatch(stewardshipSource,
  /principal-product-manager acts as the standing steward/);
assert.match(designSource, /completion.authority|acceptance authority/i);
```

  Define each source string with `readFileSync` and the exact files above, following
  `test\creative-core-contract-self-test.mjs`; do not test prose without reading it.
- [ ] Run `node test\coordination-authority-self-test.mjs`; confirm the intended
  missing authority contract fails.
- [ ] Replace active routing by responsibility, not global string replacement:

| Retired responsibility | Current destination |
| --- | --- |
| Frontend/backend/applied-AI/data implementation | `eng-builder-software` |
| Infrastructure implementation | `eng-builder-platform` |
| Architectural decision | `eng-lead-architecture` |
| Independent code review formerly assigned to a builder | `eng-reviewer-code` |
| UI/system QA | `eng-reviewer-quality` |
| Security, reliability, privacy | Corresponding `eng-reviewer-*` role |
| Manager decomposition | Supplied decomposition or engineering `pr-sizing`; never a compulsory extra coordinator |
| PM-owned scope/acceptance | Explicit supplied scope authority/acceptance authority; not the director by default |

- [ ] Update the question templates to one canonical format matching Task 1.
  Preserve legacy parsing for existing records. Keep product maps/briefs as
  possible inputs, not compulsory producer calls.
- [ ] Extend fixtures for core+engineering, core+creative, both, and missing
  required reviewers. Run the new script plus
  `node test\creative-core-contract-self-test.mjs`,
  `node test\creative-agent-contract-self-test.mjs`, and
  `node test\engineering-agents-self-test.mjs`. Commit this authority change.

## Task 3: Build the transactional store and command contract

**Files:** Create `contract.mjs`, `store.mjs`, and the shared fixture from the map.
Create `test\coordination-store-self-test.mjs`.

**Interfaces:** `openStore({path, mode}) -> Store`, where mode is `create`, `read`,
or `write`; `closeStore(store)`; `readRecord(store, kind, id) -> Record|null`;
`listRecords(store, {kind, itemId}) -> Record[]`;
`applyOperation(store, command, mutate) -> Result`.
`mutate(current, tx)` returns the new primary record body. Its transaction object
exposes `get(kind,id)`, `put(record)`, and `appendEvent(payload)`; these operations
share the surrounding transaction and are not exposed to arbitrary CLI payloads.

- [ ] Add the replay/CAS regression using the fixture:

```js
await withWorkspace(({store}) => {
  seedItem(store);
  const op = command('item.update', {payload: {title: 'Revised'}});
  const mutate = current => ({...current.body, title: 'Revised'});
  const first = applyOperation(store, op, mutate);
  assert.deepEqual(applyOperation(store, op, mutate), first);
  assert.equal(readRecord(store, 'item', 'demo').version, 2);
  assert.throws(() => applyOperation(store,
    {...op, payload: {title: 'Different'}}, mutate),
  error => error.code === 'OPERATION_CONFLICT');
});
```

- [ ] Run `node test\coordination-store-self-test.mjs`; require the missing-module
  or missing-export failure, not an unrelated environment failure.
- [ ] Implement the version-1 schema inside `store.mjs` so pack closure needs no
  untracked SQL resource:

```sql
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE records (
  kind TEXT NOT NULL, id TEXT NOT NULL, item_id TEXT,
  version INTEGER NOT NULL CHECK (version > 0),
  body TEXT NOT NULL CHECK (json_valid(body)),
  PRIMARY KEY (kind, id)
);
CREATE INDEX records_by_item ON records(kind, item_id);
CREATE TABLE events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL, item_id TEXT,
  payload TEXT NOT NULL CHECK (json_valid(payload))
);
CREATE TABLE operations (
  id TEXT PRIMARY KEY, payload_digest TEXT NOT NULL,
  receipt TEXT NOT NULL CHECK (json_valid(receipt))
);
```

- [ ] Implement canonical JSON recursively with sorted object keys, preserved array
  order, finite numbers, and rejected unsupported/cyclic values. Hash commands
  with SHA-256. Use `BEGIN IMMEDIATE`, look up an existing receipt before checking
  current version, validate expected version, apply all writes/events, insert the
  receipt, and commit. Roll back on failure; rethrow unexpected errors. Set
  `busy_timeout=1000`; expose lock exhaustion as retryable `STORE_BUSY`.
- [ ] Add real two-connection/two-process claim contention, failed mutation rollback,
  read-only write rejection, malformed records, unsupported schema, and corrupt
  database cases. Reopen the database to establish persistence. Run the store
  script on the supported Node matrix before accepting compatibility; commit.

## Task 4: Implement lifecycle, message, and recovery operations

**Files:** Create `engine.mjs`. Extend contract/fixtures.
Create `test\coordination-engine-self-test.mjs`.

**Interfaces:** `applyCommand(store, command, authority) -> Result`.
`authority` contains the available role IDs and explicit grants, not inferred
permissions from prose. Supported operations are `initiative.create`,
`initiative.update`, `item.create`, `item.update`, `item.promote`, `item.grant`,
`item.transition`, `item.handoff`, `item.restore`, `question.open`,
`question.answer`, and `attempt.recover`.
Initiative updates include milestone/backlog lifecycle; authored north-star prose
is a referenced asset, not a second mutable operational record.
`item.update` changes authorized descriptive fields, not lifecycle, reviews, or
scope approval. `item.transition` runs the exact lifecycle/authority guards;
handoff uses the same guards when it includes a state transition.

- [ ] Add a two-blocker test:

```js
await withWorkspace(({store}) => {
  seedItem(store, {state: 'blocked', resume_state: 'in-review',
    waiting_on_questions: ['q1', 'q2']});
  const authority = {roles: ['eng-reviewer-code'], grants: []};
  const denied = command('item.restore', {payload: {}});
  assert.throws(() => applyCommand(store, denied, authority),
    error => error.code === 'AUTHORITY_REQUIRED');
  assert.equal(readRecord(store, 'item', 'demo').body.state, 'blocked');
});
```

- [ ] Run `node test\coordination-engine-self-test.mjs`; establish the missing
  operation failure.
- [ ] Encode the existing lifecycle as explicit allowed transitions and guards.
  Apply all writes through `applyOperation`; validate dependency state, touch-set
  overlap, current lease, questions, availability, and authority inside the
  transaction. Generate a new token with `randomUUID()` only after guards pass.
- [ ] Implement message validation/reconciliation with this record shape:

```js
const message = {
  schema_version: 1, message_id: payload.messageId, thread_id: item.id,
  item_id: item.id, parent_id: payload.parentId,
  sender_role: actor.role, sender_run: actor.runId,
  recipient: payload.recipient, kind: payload.kind,
  created_at: payload.createdAt, basis_version: item.version,
  payload: payload.content, artifact_refs: payload.artifactRefs,
  evidence_refs: payload.evidenceRefs, provenance: payload.provenance,
};
```

  Every displayed identifier above comes from a validated command or persisted
  record. Verify answer sender/recipient, question kind, parent existence,
  contradiction, and lane. Clear only the answered ID; restore only with proper
  lifecycle authority. Duplicate messages return the original receipt.
- [ ] Add successful multi-question resolution, unauthorized restoration, pending
  dependency versus failed dependency, stale same-role token, review-state lease,
  conflicting touch sets, missing role, cycle detection, and recovery cases.
  Cover `release-ready`, deployment start/completion, and `shipped` separately:
  missing operator confirmation or production evidence must refuse advancement.
  Expiry alone must fail recovery without reconciled disposition evidence.
  Run engine/store/thread scripts and commit.

## Task 5: Register exact evidence and revision-bound acceptance

**Files:** Create `evidence.mjs`. Extract reusable path safety from
`scripts\workspace-doctor.mjs` into `scripts\lib\workspace-path-safety.mjs`.
Create `test\coordination-evidence-self-test.mjs`.

**Interfaces:** `assertWorkspacePath(root, relativePath) -> absolutePath`;
`hashArtifact({root, relativePath}) -> {kind:'sha256', digest, path}`;
`hashBundle({root, paths}) -> {kind:'bundle-sha256', digest, entries}`;
`registerArtifact(store, command) -> Result`;
`transitionAsset(store, command, authority) -> Result`;
`registerEvidence(store, command, capture) -> Result`;
`recordReview(store, command) -> Result`;
`recordApproval(store, command, authority) -> Result`.
Git subject refs use `{kind:'git', base, head}` and must resolve to existing
immutable objects. Every verdict also stores the criteria/brief digest.
Their command kinds are `artifact.register`, `asset.transition`,
`evidence.register`, `review.record`, and `approval.record`, respectively.
Register all kinds in the shared contract validator.

- [ ] Write content-change and provenance assertions:

```js
await withWorkspace(({root, store}) => {
  const path = '.kai/runs/review/2026-09-16/01-evidence-demo/mock.html';
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), {recursive: true});
  writeFileSync(absolute, '<h1>First</h1>');
  const before = hashArtifact({root, relativePath: path});
  writeFileSync(absolute, '<h1>Second</h1>');
  assert.notEqual(hashArtifact({root, relativePath: path}).digest, before.digest);
  seedItem(store);
  assert.throws(() => registerEvidence(store,
    command('evidence.register', {payload: {tier: 'observed'}}),
    {source: 'agent-paste', text: 'tests passed'}),
  error => error.code === 'INVALID_INPUT');
});
```

- [ ] Run `node test\coordination-evidence-self-test.mjs` before implementation.
- [ ] Extract rather than duplicate physical containment checks. Preserve rejection
  of `..`, absolute/UNC escapes, junctions/symlinks, nested Git roots, and invalid
  project-qualified publication paths. Test existing doctor behavior unchanged.
- [ ] Hash exact completed bytes with `createHash('sha256')`. For bundles, sort
  normalized relative paths, reject duplicates/case collisions, serialize
  `{path,digest}` entries through `canonicalJson`, and hash that representation.
  Retain snapshots in the producing run's approved directory; registration must
  reject missing or subsequently changed referenced content.
- [ ] Validate captured versus declared provenance, command exit/result coverage,
  and confidential-data handling. Approval checks compare subject and criteria
  digests and reject author-run self-acceptance. Human decision records require
  the actual host interaction or explicitly attributed supplied approval, not a
  caller-set `approved:true`.
- [ ] Carry the current disposition/validity rules into `asset.transition`.
  Supersession links both records in one transaction; incomplete accepted inputs
  remain provisional. Preserve published/retracted history and prohibit discarding
  team-facing accepted assets. Staleness does not reopen completed work items.
- [ ] Add changed-criteria, missing snapshot, orphan output, retracted/superseded
  asset, paid-media consent, and independent reviewer cases. Run evidence/engine
  scripts and `node scripts\workspace-doctor.mjs --self-test`; commit.

## Task 6: Bound context without deleting history

**Files:** Create `context.mjs`.
Create `test\coordination-context-self-test.mjs`.

**Interfaces:** `projectContext(store, {itemId, maxBytes = 24576,
recentLimit = 8}) -> {throughSeq, text, bytes, references, historyCursor}`;
`readDetail(store, {kind,id}) -> Record`;
`readMessages(store, {threadId,beforeSeq,limit = 50}) -> {messages,nextCursor}`.
The mandatory projection fields are those in spec section 7.
`text` is the complete agent-visible packet, including its references/cursor;
the host must not append another unbounded history list to it.

- [ ] Add long-history and overflow assertions:

```js
await withWorkspace(({store}) => {
  seedItem(store);
  const projection = projectContext(store, {itemId: 'demo'});
  assert.ok(Buffer.byteLength(projection.text, 'utf8') <= 24576);
  assert.match(projection.text, /completion_authority/);
  assert.throws(() => projectContext(store, {itemId: 'demo', maxBytes: 1}),
    error => error.code === 'CONTEXT_BUDGET');
});
```

- [ ] Run `node test\coordination-context-self-test.mjs`; establish red.
- [ ] Select required fields first, current decisions/blockers next, and at most
  eight recent relevant message excerpts last. Use deterministic ordering by event
  sequence. Reference each selected excerpt; represent older history with one
  bounded `{threadId,beforeSeq,remainingCount}` cursor, not a list of every omitted
  message ID. Never truncate acceptance or silently suppress a blocker.
- [ ] Implement the byte guard using actual UTF-8 bytes:

```js
const bytes = Buffer.byteLength(text, 'utf8');
if (bytes > maxBytes) {
  throw new RuntimeError('CONTEXT_BUDGET',
    `Required context uses ${bytes} bytes; limit is ${maxBytes}`);
}
```

- [ ] Add 10,000-message fixtures, non-ASCII byte accounting, stale projection
  sequence, huge mandatory criteria, absent referenced detail, and deterministic
  output assertions. Confirm old messages remain retrievable after projection
  through bounded pagination and that reference metadata cannot grow with history.
  Run context/store scripts and commit.

## Task 7: Record host capability, model choice, and uncertain attempts

**Files:** Create `host.mjs`. Modify all six `plugins\kai-core\agents` model
frontmatter entries. Create `test\coordination-host-self-test.mjs`.
Reuse `ROLE_PROFILE_MODELS` and `agentProfileModelErrors` from
`scripts\lib\pack-plan.mjs`; do not create a drifting policy map.

**Interfaces:** `planDispatch({item, roster, profiles, capabilities}) -> packet`;
`recordAttempt(store, command) -> Result`;
`recordHostResult(store, command, observation) -> Result`;
`recordEffect(store, command, observation) -> Result`.
Roster entries are `{id, role, model}` with the host's exact qualified ID.
Capabilities explicitly identify peer dispatch, resume, model override, and usage.
`item` is the persisted item's `body`; `planDispatch` reads `item.next_role`.
Use command kinds `attempt.start`, `attempt.result`, `effect.intent`, and
`effect.result`; validate and register them in the shared contract. Effect records
carry the attempt, intended action, available idempotency key, and known/unknown
outcome. They do not execute the action.

- [ ] Add unavailable model and unknown observation tests:

```js
const item = {next_role: 'eng-builder-software'};
assert.throws(() => planDispatch({
  item, roster: [], profiles: {}, capabilities: {},
}), error => error.code === 'ROLE_UNAVAILABLE');
const observation = {requestedModel: 'claude-sonnet-5',
  actualModel: null, inputTokens: null, outputTokens: null, cost: null};
assert.equal(observation.actualModel, null);
assert.notEqual(observation.cost, 0);
```

  Also assert the persisted result preserves those null values after
  `recordHostResult`; the literal check alone is not implementation coverage.
- [ ] Run `node test\coordination-host-self-test.mjs`; establish red.
- [ ] Pin the director's existing `judgment` profile to `claude-opus-5` and the
  five existing `procedure` workflows to `claude-sonnet-5`. Do not casually
  reclassify authority to reduce model cost. Pure queue calculation stays in code.
- [ ] Persist attempt intent before dispatch. Match exact available roles using
  qualified host IDs. Carry requested model and only supported override settings;
  refuse incompatible requests. Record actual model/effort/usage only when supplied
  by the host. Store separate provenance for host-measured and locally measured
  timing; no synthetic price table is necessary.
- [ ] Cover acknowledgement loss, duplicate completion, unsupported resume,
  unavailable required role/model, authorized explicit fallback, timeout with
  unknown liveness, unresolved effect intent, and no-peer ordered queue output.
  A paid/external effect with an unknown outcome cannot be replayed automatically.
  Do not redispatch an uncertain
  attempt automatically. Run host/engine scripts and
  `node scripts\host-contract.mjs --self-test`; commit.

## Task 8: Render offline evidence reports

**Files:** Create `report.mjs`.
Create `test\coordination-report-self-test.mjs` and
`test\coordination-report-browser-self-test.mjs`.

**Interfaces:** `buildReport(store, {itemId}) -> ReportView`;
`renderHtml(view) -> string`; `renderMarkdown(view) -> string`;
`writeReport({root, itemId, view}) -> {path, throughSeq, digest}`.
`ReportView` contains `item`, `decisions`, `criteria`, `artifacts`, `reviews`,
`messages`, `attempts`, `gaps`, `throughSeq`, and `generatedAt`.

- [ ] Add escaping, provenance, snapshot, and unavailable-cost tests:

```js
const html = renderHtml({
  item: {id: 'demo', title: '<script>alert(1)</script>', state: 'blocked'},
  decisions: [], criteria: [], artifacts: [], reviews: [], messages: [],
  attempts: [{actualModel: null, cost: null}], gaps: ['Missing review'],
  throughSeq: 7, generatedAt: '2026-09-16T21:00:00Z',
});
assert.ok(!html.includes('<script>alert(1)</script>'));
assert.match(html, /&lt;script&gt;/);
assert.match(html, /snapshot/i);
assert.match(html, /unavailable/i);
assert.match(html, /Missing review/);
```

- [ ] Run `node test\coordination-report-self-test.mjs`; establish red.
- [ ] Render the spec's six report sections with semantic headings/tables,
  `<details>` for history, inline CSS, and a text/table alternative to any diagram.
  Use an escaping function on every untrusted text/attribute value:

```js
const entities = {'&':'&amp;', '<':'&lt;', '>':'&gt;',
  '"':'&quot;', "'":'&#39;'};
const escapeHtml = value => String(value).replace(/[&<>"']/g,
  character => entities[character]);
```

  Reject unsafe URLs separately; escaping is not URL validation. Use no scripts,
  remote assets, embedded executable artifact HTML, or auto-publication.
- [ ] Reuse the existing Playwright/system-Edge pattern from
  `test\creative-diagram-layout-self-test.mjs`. Inspect 320px and 1280px widths,
  keyboard navigation, long labels, missing artifacts, malicious evidence text,
  and external-request attempts. Assert zero external requests and no executing
  injected content. Do not install a browser silently.
- [ ] Confirm report metadata lives in the registry, not YAML prepended to HTML.
  Stamp source sequence and snapshot warning. Run both report scripts plus
  evidence/context scripts; commit.

## Task 9: Migrate workspaces and integrate read-only inspection

**Files:** Create `migration.mjs`, `inspection.mjs`.
Modify `scripts\lib\workspace-resolve.mjs`, `scripts\workspace-doctor.mjs`,
`scripts\work-status.mjs`.
Create `test\coordination-migration-self-test.mjs`.

**Interfaces:** `migrateWorkspace({root, confirm, failAt = null}) -> receipt`;
`inspectRuntime(root) -> {errors,warnings,migrations}`;
`canRollback(store) -> boolean`.
Preserve `resolveWorkspaceRoot(opts)`'s result shape. Extend
`checkWorkspace(root, {intent:'inspect'|'coordinate'})` with explicit intent:
legacy inspection is permitted, schema-3 coordinated writes are not.

- [ ] Build legacy fixtures using the existing frontmatter parser helpers and both
  thread forms. Assert original files remain authoritative after an injected
  failure before manifest activation:

```js
const before = readFileSync(join(root, '.kai', 'manifest.json'), 'utf8');
assert.throws(() => migrateWorkspace({root, confirm: true,
  failAt: 'before-activation'}));
assert.equal(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8'), before);
```

- [ ] Run `node test\coordination-migration-self-test.mjs`; establish red.
- [ ] Refuse active leases/attempts and known unsupported storage. Make a consistent
  private backup; parse supported records, retaining source text and IDs. Import
  initiatives, milestones, backlog, items, messages, and asset metadata. Preserve
  declared provenance; quarantine ambiguous/unresolved records from dispatch.
- [ ] Build the database in a staging location below the resolved private workspace.
  Validate referential integrity and retained artifact references before activation.
  Checkpoint any staged WAL and close the staged connection before renaming files,
  including on Windows. Rename the completed store, then atomically replace the
  manifest as the commit point. Recovery recognizes an unactivated store and never
  assumes migration won.
- [ ] Resolve both schema 3 and 4 external registry bindings for inspection.
  Apply version-specific doctor checks instead of changing every legacy fixture
  to schema 4. Schema-4 status reads the store; schema-3 status uses legacy parsers.
  Compare report source sequences and export digests to identify stale/manual drift.
- [ ] Add successful migration, unsupported future schema, duplicate registry,
  unresolved owner, missing artifact, changed view, WAL backup, and rollback-after-
  new-event rejection cases. Ensure DB/WAL/journal files cannot be tracked in shared
  mode. Run migration scripts plus existing doctor and work-status self-tests;
  commit.

## Task 10: Wire the CLI and all active coordination surfaces

**Files:** Create `scripts\coordinate.mjs`.
Modify the six core agents; core work-item/acting/granting/peer-communication,
workspace paths/initiative/onboarding, initiative stewardship, scope, asset
production/closing, definition-of-done, work-activity and fleet-observation skills.
Modify coordination instructions only in the 13 engineering and three creative
agents. Update `docs\workspaces.md`, `docs\host-capabilities.md`,
`docs\reference\packages\kai-engineering.md`, and
`docs\reference\packages\kai-creative.md`.
Create `test\coordination-cli-self-test.mjs`.

**Interfaces:** `node scripts\coordinate.mjs <verb> --root <absolute-root>`.
`inspect`, `context`, `detail`, and `export` are read-only with respect to
authoritative state. Mutations accept one JSON command on stdin, not arbitrary SQL
or a command string. `migrate --confirm` is the explicit migration entry point.

- [ ] Add process-level tests for read-only inspection, malformed stdin, schema-3
  write refusal, explicit root precedence, and missing SQLite:

```js
const result = spawnSync(process.execPath,
  [cliPath, 'inspect', '--root', root], {encoding: 'utf8'});
assert.equal(result.status, 0);
const parsed = JSON.parse(result.stdout);
assert.equal(parsed.schemaVersion, 4);
assert.equal(parsed.mode, 'inspect');
```

- [ ] Run `node test\coordination-cli-self-test.mjs`; establish red.
- [ ] Wire resolver -> runtime preflight -> command validator -> domain operation ->
  structured result. Return exit 0 for accepted/read results, 2 for retryable
  contention, and 1 for refused/failed operations. Write diagnostics to stderr,
  never mixed into JSON stdout. Read-only commands never create a missing store.
- [ ] Replace manual operational writes in the active agents/skills with the
  appropriate runtime operation at the existing on-demand contract route.
  Keep `kai-core-contract-v1`'s exact two-line discovery response unchanged.
  Add runtime/version preflight separately; successful plugin discovery is not
  permission to operate a schema-4 workspace.
- [ ] Mark Markdown board/items/threads and operational initiative fields as views.
  Keep authored briefs, designs, and decision rationale as registered artifacts.
  Retain activity/observer logs as optional, non-authoritative participation signals;
  they cannot advance lifecycle state or certify a model invocation.
- [ ] Add real command chains for an engineering knowledge item and a creative
  artifact item, including answer, independent verdict, approval, handoff, export,
  restart, and inspect. Verify direct requests still require no database.
  Run CLI plus focused engineering/creative contract scripts; commit.

## Task 11: Integrate packaging, release metadata, and full acceptance

**Files:** Modify `package.json`, `package-lock.json`, `plugin.json`,
`.github\plugin\marketplace.json`, `CHANGELOG.md`, `README.md`,
`docs\reference\plugin-structure.md`.
Modify `scripts\lib\pack-plan.mjs` only where helper ownership/closure needs it.
Regenerate emitted scripts/manifests with existing tooling.
Create `test\coordination-foundation-self-test.mjs`.

**Interfaces:** Existing `npm test`, `pack-preview`, host-contract, and catalog
commands remain the validation entry points. Add the new assertion scripts to
`npm test`; browser acceptance may remain a separately explicit existing-style
command when CI does not provision a browser.

- [ ] Add a source-and-emission fixture proving only core owns the new executable:

```js
const files = materializePacks({root: repoRoot, version: '99.0.0-test'});
assert.ok(files.has('kai-core/scripts/coordinate.mjs'));
assert.ok(files.has('kai-core/scripts/lib/coordination-runtime/store.mjs'));
assert.ok(!files.has('kai-creative/scripts/coordinate.mjs'));
assert.ok(!files.has('kai-engineering/scripts/coordinate.mjs'));
```

  Import `materializePacks` from the existing pack-plan module and derive
  `repoRoot` with the same `fileURLToPath` convention as other self-tests.
- [ ] Run `node test\coordination-foundation-self-test.mjs`; require the missing
  closure/wiring failure before editing ownership rules.
- [ ] Ensure `scripts/coordinate.mjs` is referenced by shipped core instructions so
  normal transitive script collection includes runtime modules. Keep SQL/templates
  in imported modules unless the existing closure explicitly supports other assets.
  Do not manually copy helpers into package directories.
- [ ] Choose the next major release from the actual base at execution time. If it
  is still `11.0.0`, use `npm version 12.0.0 --no-git-tag-version`; synchronize the
  root plugin and all marketplace metadata/entries. Add the dated changelog entry,
  compare link, README status, and schema-4 breaking migration documentation.
  Regenerate with `npm run pack-preview -- --write`; do not install dependencies
  for version-only edits.
- [ ] Run the complete new targeted self-test set, existing engineering/creative
  contracts, `npm run pack-preview -- --check`, and the browser report acceptance.
  Then run `npm test` as the repository-required release gate. Preserve complete
  failures; do not bypass unrelated failing gates or edit pre-release source.
- [ ] Exercise actual installed-host scenarios from spec section 13 with the
  operator's approved budget. Record requested versus observed model, elapsed time,
  actual usage when available, and independent outcome for equivalent baseline/new
  cases. Include a long-thread case, missing peer, interrupted dispatch, and private
  HTML evidence. No host run means no host/performance acceptance claim.
- [ ] Independently review the complete diff and foundation behavior. Fix introduced
  findings with regression coverage; do not let the author self-certify acceptance.
  Commit named source/generated/release files. Prepare a PR only when authorized;
  do not merge, tag, publish, or claim production delivery.

## Coverage and release stop conditions

| Spec requirement | Tasks |
| --- | --- |
| Existing protocol defects and three-package authority | 1, 2, 10 |
| One transactional authority, idempotency, concurrency, recovery | 3, 4, 7, 9 |
| Typed addressed messages and multiple-blocker restoration | 1, 4 |
| Bounded context with retrievable evidence | 6 |
| Content-bound engineering/creative evidence and independent acceptance | 5, 8, 10 |
| Offline HTML, privacy, provenance, snapshot honesty | 5, 8, 9 |
| Explicit profiles, actual-versus-requested models, measured costs | 7, 11 |
| Legacy inspection, schema-4 migration, private/shared semantics | 9, 10 |
| Direct-use preservation and host capability degradation | 2, 7, 10, 11 |
| Packaging, release policy, actual-host acceptance | 11 |

Do not start procedural graph learning, automatic quality-driven model routing,
distributed coordination, or pre-release adoption inside these tasks.

Stop release if the supported Node matrix fails, authority is unresolved, migration
can lose accepted history, evidence is falsely upgraded, actual-host behavior is
unavailable for the claimed capability, or required CI remains failing. Report
what is implemented and what is blocked without calling the foundation released.

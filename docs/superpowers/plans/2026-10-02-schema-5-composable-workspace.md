# Schema 5 Composable Workspace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship schema 5 as one breaking release that makes `.kai/` always private, gives each shipped pack a lazy typed workspace/publication contract, and replaces `initiative/item` planning with the Direction-aligned `Epic -> Feature -> Requirement -> Task` hierarchy.

**Architecture:** Build the schema-5 path, Direction, hierarchy, and storage primitives behind focused modules and tests before switching the live CLI. The cutover then replaces schema-4 record and command names without aliases, updates all evidence and host bindings to typed subjects, activates the new workspace manifest, and adds one explicit backup-first schema-4 migration. SQLite remains authoritative; Markdown contains only Direction and accepted knowledge.

**Tech Stack:** Node.js ESM, `node:sqlite`, `node:test`, PowerShell/Git safety probes, Markdown agent/skill contracts, esbuild-generated consumer bundles, GitHub Actions on Windows and Linux.

**Approved designs:**

- `docs/superpowers/specs/2026-10-02-composable-workspace-design.md`
- `docs/superpowers/specs/2026-10-02-work-hierarchy-governance-design.md`

---

## Non-negotiable implementation constraints

1. Schema 5 activates only after workspace layout, hierarchy, typed subjects, read surfaces, privacy, and migration are complete.
2. No schema-4/schema-5 dual writes, `initiative` or `item` aliases, legacy bucket, generic artifact lane, or fallback publication path ships.
3. Schema 3 and schema 4 remain inspectable. They are not writable by the schema-5 runtime.
4. Existing Task lease, review, evidence, deployment, recovery, and optimistic-concurrency gates must survive the `item -> task` cutover.
5. `DIRECTION.md` is required only for coordinated work. Direct answers and direct code changes create no Kai state.
6. Pack installation creates no pack directory. The first valid private artifact creates only its exact typed path.
7. Department vocabularies live in their owning publication skills. Core supplies path grammar and runtime enforcement but does not duplicate department type tables.
8. Schema-5 manifest activation is the final migration write. Failure before that leaves schema 4 authoritative.
9. Every new validation gate needs a positive corpus assertion and a mutation that proves the gate fails.
10. Release metadata, generated packs, catalog, changelog, README status, and the full test suite move together in `19.0.0`.

## File and responsibility map

### New source modules

| File | Responsibility |
| --- | --- |
| `src/core/lib/workspace-layout.mjs` | Schema-5 constants; safe pack/type/subtype/ID/lifecycle grammar; private/public/archive path derivation; no vocabulary fallback |
| `src/core/lib/direction.mjs` | Read and validate the configured `DIRECTION.md`; return exact sections, bytes, SHA-256 hash, and a bindable Direction reference |
| `src/core/lib/coordination-runtime/hierarchy-contract.mjs` | Epic/Feature/Requirement/Task IDs, bodies, parent transitions, holds, dispositions, relationship validation, closure references |
| `src/core/lib/coordination-runtime/hierarchy-engine.mjs` | Parent create/update/activate/hold/release/complete handlers, authority gates, Direction alignment, dependency checks, closure eligibility |
| `src/core/lib/coordination-runtime/hierarchy-view.mjs` | Derived attention, Goal/Epic/pack roll-up, bounded hierarchy context, Task-only plans |
| `src/core/lib/coordination-runtime/task-contract.mjs` | Task body and `task.*` command validation, preserving schema-4 executable-work semantics |
| `src/core/lib/coordination-runtime/task-engine.mjs` | Task lifecycle, lease, handoff, review, recovery, release, and production-verification handlers |
| `src/core/lib/coordination-runtime/migration-v5.mjs` | Schema-4 inventory, classification worksheet validation, staging, backup, activation, rollback, and recovery |
| `test/workspace-layout-self-test.mjs` | Cross-platform path grammar, lazy creation, publication lifecycle, traversal and alias rejection |
| `test/direction-self-test.mjs` | Required sections, exact Goal binding, hashing, symlink/junction safety, direct-work exemption |
| `test/coordination-hierarchy-contract-self-test.mjs` | Typed IDs, record bodies, relationships, dispositions, command payloads |
| `test/coordination-hierarchy-engine-self-test.mjs` | Parent authority, activation, holds, dependencies, completion, concurrency, stale Direction |
| `test/coordination-hierarchy-view-self-test.mjs` | Attention, roll-up, context, status, and Task-only plan projections |
| `test/coordination-schema5-migration-self-test.mjs` | Worksheet, preservation, ambiguity, backup, atomic activation, rollback, interrupted recovery |
| `test/fixtures/schema5-consumer/` | Four pack-composition fixtures and first-write scenarios copied into generated consumer installs |

### Existing runtime modules changed

| File(s) | Change |
| --- | --- |
| `src/core/lib/coordination-runtime/contract.mjs` | Becomes the shared envelope/evidence contract and re-exports hierarchy/Task validators; removes initiative/item validators |
| `src/core/lib/coordination-runtime/engine.mjs` | Becomes the command dispatcher and shared transaction boundary; delegates parent and Task commands |
| `src/core/lib/coordination-runtime/store.mjs` | Store schema 2 with `subject_kind`/`subject_id`; historical schema-1 reads; typed record/event queries |
| `src/core/lib/coordination-runtime/authority.mjs` | Typed record grants and Task lease terminology |
| `src/core/lib/coordination-runtime/acceptance*.mjs`, `evidence*.mjs`, `report*.mjs`, `context.mjs` | Replace item-bound evidence with typed subject bindings while preserving Task acceptance gates |
| `src/core/lib/coordination-runtime/host*.mjs`, `native-*.mjs` | Task-scoped delegation/claim/plan and hierarchy-aware capabilities; maintenance binds the exact migration worksheet digest |
| `src/core/lib/coordination-runtime/cli.mjs`, `src/core/coordinate.mjs` | Typed `--kind/--id` reads, `--task` execution, hierarchy status, migration worksheet |
| `src/core/workspace-doctor.mjs` | Schema-5 manifest/tree/privacy checks and read-only schema-3/4 diagnostics |
| `src/core/lib/workspace-resolve.mjs`, `workspace-git-privacy.mjs`, `workspace-path-safety.mjs` | Repo-local/external schema-5 resolution; private-only `.kai`; Windows/POSIX alias safety |
| `src/core/activity.mjs`, `work-status.mjs`, `observe-*.mjs` | Consume schema-5 runtime and typed paths; stop writing/reading generic run or review lanes |

### Shipped contract changes

| File(s) | Change |
| --- | --- |
| `plugins/kai-core/skills/kai-core-workspace-publication/SKILL.md` | New core publication vocabulary and fixed Direction handling |
| `plugins/kai-engineering/skills/engineering-workspace-publication/SKILL.md` | New engineering type/subtype/format/publication table |
| `plugins/kai-creative/skills/creative-workspace-publication/SKILL.md` | New creative type/subtype/format/media/publication table |
| `plugins/kai-core/skills/kai-core-work-hierarchy/SKILL.md` | New explicit hierarchy, Direction binding, relationships, attention, and roll-up contract |
| `plugins/kai-core/skills/kai-core-work-task/SKILL.md` | New Task execution record replacing `kai-core-work-item` |
| `plugins/kai-core/skills/kai-core-work-stewardship/SKILL.md` | New authority/promotion/closure contract replacing initiative stewardship |
| `plugins/kai-core/skills/kai-core-workspace-paths/SKILL.md` | Schema-5 private/public path and first-write rules |
| `plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md` | Minimal schema-5 initialization and explicit migration |
| `plugins/kai-core/agents/workflow-epic-init.agent.md` | New Direction-aligned hierarchy intake replacing `workflow-initiative-init` |
| `plugins/kai-core/agents/director-chief-of-staff.agent.md` | Task-only dispatch; cannot invent scope, hierarchy, priority, authority, or acceptance |
| Active producer agents in all three packs | Route the owning publication skill immediately before asset production |

### Removed shipped contracts

| File | Replacement |
| --- | --- |
| `plugins/kai-core/agents/workflow-initiative-init.agent.md` | `workflow-epic-init.agent.md` |
| `plugins/kai-core/skills/kai-core-workspace-initiative/SKILL.md` | `kai-core-work-hierarchy` plus `kai-core-workspace-paths` |
| `plugins/kai-core/skills/kai-core-initiative-stewardship/SKILL.md` | `kai-core-work-stewardship` |
| `plugins/kai-core/skills/kai-core-work-item/SKILL.md` | `kai-core-work-task` |

### Release and generated files

| File(s) | Change |
| --- | --- |
| `package.json`, `package-lock.json`, `plugin.json`, `.github/plugin/marketplace.json` | Synchronized `19.0.0` metadata |
| `plugins/*/plugin.json`, `plugins/*/scripts/*.mjs` | Regenerated with `npm run pack-preview -- --write` |
| `tools/generate-catalog.mjs`, `docs/reference/agents-and-skills.md` | New/removed agents and skills categorized and generated |
| `README.md`, `CHANGELOG.md` | Schema-5 architecture, installation/use, status, breaking migration, compare link |
| `test/fixtures/inventory.json`, `test/README.md` | Exact shipped inventory and test ownership |

## Dependency order

```text
Task 1 workspace paths ─┬─> Task 2 Direction
                        └─> Task 9 workspace activation

Task 3 hierarchy contract ─> Task 4 typed store ─┬─> Task 5 parent engine
                                                  ├─> Task 6 Task cutover
                                                  └─> Task 7 evidence subjects

Tasks 2 + 5 + 6 + 7 ─> Task 8 hierarchy views/CLI
Tasks 1..8          ─> Task 9 schema-5 workspace activation
Tasks 1..9          ─> Task 10 schema-4 migration
Tasks 1..10         ─> Task 11 shipped agent/skill contracts
Tasks 1..11         ─> Task 12 consumer matrix and 19.0.0 release
```

Tasks 1-8 may add isolated schema-5 modules while schema 4 remains the live runtime. Task 9 is the only live default switch. No commit after Task 9 may restore schema-4 writes.

---

### Task 1: Add schema-5 workspace path primitives

**Files:**

- Create: `src/core/lib/workspace-layout.mjs`
- Create: `test/workspace-layout-self-test.mjs`
- Modify: `src/core/lib/workspace-path-safety.mjs`
- Modify: `package.json`

**Step 1: Write the failing path-contract tests**

Add named tests that assert:

- constants are exactly `.kai`, `docs/kai`, `docs/kai/DIRECTION.md`, and `.kai/core/runtime/coordination.sqlite`;
- private paths require `pack`, `type`, `id`, and `lifecycle`;
- `drafts`, `evidence`, and `scratch` are the only active artifact lifecycle segments;
- archive paths are `.kai/<pack>/archive/<type>/<optional-subtype>/<id>`;
- public paths mirror the private pack/type/subtype/ID route without lifecycle;
- `direction` resolves only through the fixed Direction path helper;
- empty, dot, dot-dot, absolute, drive-relative, UNC, mixed-separator, reserved-device, and trailing-dot/space segments fail;
- unknown pack namespaces fail without creating a fallback path;
- deriving paths never creates directories.

The exported interface under test is:

```js
export const WORKSPACE_SCHEMA_VERSION = 5;
export const PRIVATE_ROOT = '.kai';
export const PUBLICATION_ROOT = 'docs/kai';
export const DIRECTION_PATH = 'docs/kai/DIRECTION.md';
export const COORDINATION_DATABASE = '.kai/core/runtime/coordination.sqlite';

export function privateArtifactDirectory({pack, type, subtype = null, id, lifecycle});
export function archivedArtifactDirectory({pack, type, subtype = null, id});
export function publicationDirectory({pack, type, subtype = null, id});
export function directionPath();
```

The grammar module validates safe segments and the three shipped namespaces. It deliberately does **not** own department type/subtype vocabularies; the pack publication skills do.

**Step 2: Run the test to verify it fails**

Run: `node test/workspace-layout-self-test.mjs`

Expected: exit 1 with `ERR_MODULE_NOT_FOUND` for `workspace-layout.mjs`.

**Step 3: Implement the path primitives**

Use `path.posix.join` for persisted relative paths and the existing
`workspace-path-safety.mjs` checks before returning any path. Do not call
`mkdirSync` in these helpers.

The public/private mirror must satisfy:

```js
privateArtifactDirectory({
  pack: 'engineering',
  type: 'documentation',
  subtype: 'architecture',
  id: 'auth-boundary',
  lifecycle: 'drafts',
}) === '.kai/engineering/documentation/architecture/auth-boundary/drafts';

publicationDirectory({
  pack: 'engineering',
  type: 'documentation',
  subtype: 'architecture',
  id: 'auth-boundary',
}) === 'docs/kai/engineering/documentation/architecture/auth-boundary';
```

**Step 4: Add the targeted script and run it**

Add:

```json
"workspace-layout:self-test": "node test/workspace-layout-self-test.mjs"
```

Run: `npm run workspace-layout:self-test`

Expected: exit 0 and every named path/alias case passes.

**Step 5: Commit**

```bash
git add src/core/lib/workspace-layout.mjs src/core/lib/workspace-path-safety.mjs test/workspace-layout-self-test.mjs package.json
git commit -m "feat(core): add schema 5 workspace primitives"
```

---

### Task 2: Bind coordinated work to exact project Direction

**Files:**

- Create: `src/core/lib/direction.mjs`
- Create: `test/direction-self-test.mjs`
- Modify: `src/core/lib/workspace-resolve.mjs`
- Modify: `package.json`

**Step 1: Write the failing Direction tests**

Cover these exact cases:

1. `# Vision`, `# Mission`, `# Current Goal`, and `# Out of Scope` each occur once, in that order, with non-empty bodies.
2. Heading lookalikes inside fenced code do not satisfy the contract.
3. Duplicate, missing, empty, or reordered sections return `INVALID_DIRECTION`.
4. UTF-8 bytes are hashed exactly; line endings are not normalized before hashing.
5. The returned `goal` is the exact Current Goal body after only outer whitespace removal.
6. A configured project path selects that project's `publication_root` and Direction file.
7. Symlink/junction escape and case/alias escape receive the same rejection as direct traversal.
8. `requireDirection({coordinated: false})` does not touch the filesystem.

Use this interface:

```js
export function readDirection({workspaceRoot, manifest, projectId});
export function requireDirection({workspaceRoot, manifest, projectId, coordinated});
```

Successful output:

```js
{
  path: 'docs/kai/DIRECTION.md',
  hash: '<sha256>',
  goal: '<exact Current Goal body>',
  sections: {
    vision: '<text>',
    mission: '<text>',
    currentGoal: '<text>',
    outOfScope: '<text>',
  },
  bytes: Buffer
}
```

**Step 2: Run the test to verify it fails**

Run: `node test/direction-self-test.mjs`

Expected: exit 1 with `ERR_MODULE_NOT_FOUND` for `direction.mjs`.

**Step 3: Implement byte-exact parsing and safe project resolution**

Resolve the configured project through `workspace-resolve.mjs`; then read the
file once, parse headings from those bytes, and hash the same bytes. Never
accept a caller-supplied hash or Goal string.

Errors must distinguish:

- `DIRECTION_REQUIRED` for a missing file during coordinated work;
- `INVALID_DIRECTION` for section/encoding/shape problems;
- `PATH_ESCAPE` for unsafe resolution.

**Step 4: Run focused tests**

Add and run:

```json
"direction:self-test": "node test/direction-self-test.mjs"
```

Run: `npm run direction:self-test`

Expected: exit 0.

**Step 5: Commit**

```bash
git add src/core/lib/direction.mjs src/core/lib/workspace-resolve.mjs test/direction-self-test.mjs package.json
git commit -m "feat(core): bind coordinated work to project direction"
```

---

### Task 3: Define explicit hierarchy and Task contracts

**Files:**

- Create: `src/core/lib/coordination-runtime/hierarchy-contract.mjs`
- Create: `src/core/lib/coordination-runtime/task-contract.mjs`
- Create: `test/coordination-hierarchy-contract-self-test.mjs`
- Modify: `src/core/lib/coordination-runtime/contract.mjs`
- Modify: `package.json`

**Step 1: Write failing record and command tests**

Create fixtures for valid Epic, Feature, Requirement, and Task bodies. Assert:

- IDs match only `epic:<slug>`, `<pack>:feature:<slug>`,
  `<pack>:requirement:<slug>`, and `<pack>:task:<slug>`;
- pack is exactly `core | engineering | creative` and agrees with the ID;
- every Feature has one existing Epic;
- every Requirement has one same-pack Feature;
- every Task has one same-pack Feature and non-empty unique `satisfies[]`;
- every satisfied Requirement belongs to the Task's Feature;
- `Requirement.required_tasks[]`/`optional_tasks[]` and `Task.satisfies[]`
  agree bidirectionally;
- child lists are unique and required/optional sets do not overlap;
- Feature dependency edges are typed and distinct from Task dependency edges;
- composition, Feature dependency, and Task dependency cycles fail separately;
- parent state is only `proposed | active | completed`;
- completion disposition is null before completion and kind-valid at completion;
- holds contain reason, actor, timestamp, release condition, and basis refs;
- Task keeps every schema-4 executable field and adds `pack`,
  `feature_id`, and `satisfies`.

Command validation must cover:

```text
epic.create/update/activate/hold/release/complete
feature.create/update/activate/hold/release/complete
requirement.create/update/activate/hold/release/complete
task.create/update/promote/grant/transition/handoff/restore
```

All commands keep `operationId`, `actor`, `recordKind`, `recordId`,
`expectedVersion`, `leaseToken`, and `payload`.

**Step 2: Run the test to verify it fails**

Run: `node test/coordination-hierarchy-contract-self-test.mjs`

Expected: exit 1 because hierarchy validators and command kinds do not exist.

**Step 3: Implement and export the contracts**

Export:

```js
export const HIERARCHY_KINDS = new Set(['epic', 'feature', 'requirement', 'task']);
export const PARENT_STATES = new Set(['proposed', 'active', 'completed']);
export const PARENT_DISPOSITIONS = Object.freeze({
  epic: new Set(['achieved', 'cancelled', 'superseded']),
  feature: new Set(['delivered', 'cancelled', 'superseded']),
  requirement: new Set(['satisfied', 'cancelled', 'superseded']),
});

export function validateHierarchyRecord(record, lookup);
export function validateHierarchyRelationships(records);
export function validateParentCommand(command);
export function parentClosureRef(parent, requiredChildren);
```

Move the existing item body and command validators into
`task-contract.mjs`, rename fields/errors/commands to Task terminology, and
re-export them from `contract.mjs`. Do not yet switch the dispatcher or delete
schema-4 handlers; that happens in Task 6.

`parentClosureRef` hashes canonical JSON containing parent kind/ID/version and
every required child kind/ID/version/disposition sorted by kind then ID.

**Step 4: Run focused contract tests**

Add:

```json
"coordination:hierarchy-contract-self-test": "node test/coordination-hierarchy-contract-self-test.mjs"
```

Run: `npm run coordination:hierarchy-contract-self-test`

Expected: exit 0.

**Step 5: Commit**

```bash
git add src/core/lib/coordination-runtime/hierarchy-contract.mjs src/core/lib/coordination-runtime/task-contract.mjs src/core/lib/coordination-runtime/contract.mjs test/coordination-hierarchy-contract-self-test.mjs package.json
git commit -m "feat(core): define schema 5 hierarchy contracts"
```

---

### Task 4: Generalize SQLite records and events to typed subjects

**Files:**

- Modify: `src/core/lib/coordination-runtime/store.mjs`
- Modify: `src/core/lib/coordination-runtime/evidence-context.mjs`
- Modify: `src/core/lib/coordination-runtime/inspection.mjs`
- Modify: `src/core/lib/coordination-runtime/migration-files.mjs`
- Modify: `test/coordination-store-self-test.mjs`
- Modify: `test/helpers/coordination-runtime-fixture.mjs`

**Step 1: Replace store tests with schema-2 expectations**

The current store schema is immutable version 1. New workspaces create version
2:

```sql
records(
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  subject_kind TEXT,
  subject_id TEXT,
  version INTEGER NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY(kind, id),
  CHECK ((subject_kind IS NULL) = (subject_id IS NULL))
)

events(
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL,
  subject_kind TEXT,
  subject_id TEXT,
  event_kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  CHECK ((subject_kind IS NULL) = (subject_id IS NULL))
)
```

Test:

- root hierarchy records have `subject: null`;
- artifact/evidence/review/message/etc. can bind to any hierarchy subject;
- `listRecords(store, {kind, subject: {kind, id}})` never leaks another
  subject;
- `readSubjectView` uses one SQLite snapshot;
- null/non-null mismatches fail at SQL and API boundaries;
- operation idempotency and optimistic concurrency remain unchanged;
- schema-1 stores open only through `openHistoricalStore`, read-only;
- `openStore` rejects schema 1 with `SCHEMA_MISMATCH`;
- logical digests include subject kind and ID.

**Step 2: Run the store test to verify it fails**

Run: `node test/coordination-store-self-test.mjs`

Expected: exit 1 because the current schema exposes `item_id`.

**Step 3: Implement store schema 2 and typed APIs**

Replace:

```js
listRecords(store, {kind, itemId})
readContextView(store, {itemId})
```

with:

```js
listRecords(store, {kind, subject = undefined})
readSubjectView(store, {subject, recentLimit})
```

Add:

```js
openHistoricalStore({path, expectedStoreVersion: 1});
```

This function must refuse write mode. It exists only for schema-3/4 inspection
and migration.

Update the fixture helper to accept:

```js
seedRecord(store, {kind, id, subject: null | {kind, id}, version, body});
```

During this task, schema-4 item fixtures may use
`subject: {kind: 'item', id}`. That intermediate test data is removed in Task
6; no shipped runtime alias is introduced.

**Step 4: Run store and syntax tests**

Run:

```bash
node test/coordination-store-self-test.mjs
node tools/check-syntax.mjs
```

Expected: both exit 0.

**Step 5: Commit**

```bash
git add src/core/lib/coordination-runtime/store.mjs src/core/lib/coordination-runtime/evidence-context.mjs src/core/lib/coordination-runtime/inspection.mjs src/core/lib/coordination-runtime/migration-files.mjs test/coordination-store-self-test.mjs test/helpers/coordination-runtime-fixture.mjs
git commit -m "refactor(core): generalize coordination subjects"
```

---

### Task 5: Implement parent governance, Direction gates, and closure

**Files:**

- Create: `src/core/lib/coordination-runtime/hierarchy-engine.mjs`
- Create: `test/coordination-hierarchy-engine-self-test.mjs`
- Modify: `src/core/lib/coordination-runtime/engine.mjs`
- Modify: `src/core/lib/coordination-runtime/authority.mjs`
- Modify: `src/core/lib/coordination-runtime/native-routing.mjs`
- Modify: `package.json`

**Step 1: Write failing lifecycle and authority tests**

Use real store transactions and host grants. Cover:

- only operator or delegated Epic scope authority creates an Epic proposal;
- Epic activation requires its scope authority and a current runtime-computed
  Direction reference;
- Epic prioritization requires operator or the Goal's explicit steward;
- pack owner/delegate creates a Feature proposal;
- Epic steward activates/prioritizes a Feature;
- Feature owner creates and activates Requirements;
- parent updates reject fields outside the descriptive/relationship allowlist;
- a stale expected version produces `VERSION_CONFLICT`;
- a stale Direction hash blocks Feature/Requirement activation and descendant
  Task promotion/grant;
- a hold appends an event, leaves lifecycle unchanged, and blocks child
  promotion/new grants;
- hold release records actor, time, evidence, and whether the release condition
  was met;
- every mutation event records actor, time, reason, old/new version, changed
  fields, basis references, and the exact relationship versions used;
- Feature dependencies can cross packs, require `delivered`, and detect cycles;
- optional children do not block closure;
- required cancelled/superseded children do block successful closure;
- child completion does not auto-close a parent;
- successful parent completion requires the exact `parentClosureRef`;
- changed child version invalidates closure;
- cancellation/supersession require completion authority and rationale but not
  successful-child roll-up;
- producer cannot self-accept when independent acceptance is required.

**Step 2: Run the test to verify it fails**

Run: `node test/coordination-hierarchy-engine-self-test.mjs`

Expected: exit 1 with missing `hierarchy-engine.mjs` handlers.

**Step 3: Implement parent handlers**

Expose:

```js
export const parentHandlers = new Map([
  ['epic.create', handleEpicCreate],
  ['epic.update', handleParentUpdate],
  ['epic.activate', handleParentActivate],
  ['epic.hold', handleParentHold],
  ['epic.release', handleParentRelease],
  ['epic.complete', handleParentComplete],
  // same six operations for feature and requirement
]);

export function assertAlignedAncestors(tx, record, direction);
export function closureEligibility(tx, parent);
```

`engine.mjs` must run all relationship and closure checks in the same
transaction that writes the new version and event.

Do not persist attention or "ready to close." Store only lifecycle, holds,
events, and accepted decisions.

**Step 4: Run focused hierarchy tests**

Add:

```json
"coordination:hierarchy-engine-self-test": "node test/coordination-hierarchy-engine-self-test.mjs"
```

Run:

```bash
npm run coordination:hierarchy-contract-self-test
npm run coordination:hierarchy-engine-self-test
```

Expected: both exit 0.

**Step 5: Commit**

```bash
git add src/core/lib/coordination-runtime/hierarchy-engine.mjs src/core/lib/coordination-runtime/engine.mjs src/core/lib/coordination-runtime/authority.mjs src/core/lib/coordination-runtime/native-routing.mjs test/coordination-hierarchy-engine-self-test.mjs package.json
git commit -m "feat(core): enforce parent work governance"
```

---

### Task 6: Replace executable items with Tasks without weakening gates

**Files:**

- Create: `src/core/lib/coordination-runtime/task-engine.mjs`
- Modify: `src/core/lib/coordination-runtime/engine.mjs`
- Modify: `src/core/lib/coordination-runtime/contract.mjs`
- Modify: `src/core/lib/coordination-runtime/authority.mjs`
- Modify: `src/core/lib/coordination-runtime/host.mjs`
- Modify: `src/core/lib/coordination-runtime/host-plan.mjs`
- Modify: `src/core/lib/coordination-runtime/host-schema.mjs`
- Modify: `src/core/lib/coordination-runtime/native-host.mjs`
- Modify: `src/core/lib/coordination-runtime/native-routing.mjs`
- Modify: `src/core/lib/coordination-runtime/native-capabilities.mjs`
- Modify: `src/core/lib/coordination.mjs`
- Modify: `test/helpers/coordination-runtime-fixture.mjs`
- Modify: `test/coordination-engine-self-test.mjs`
- Modify: `test/coordination-authority-self-test.mjs`
- Modify: `test/coordination-host-self-test.mjs`
- Modify: `test/coordination-native-scenarios-self-test.mjs`

**Step 1: Convert fixture and behavior tests to Task vocabulary**

Rename fixture helpers to `seedTask` and `taskCommand`. Every Task fixture must
belong to one Feature and satisfy at least one active Requirement.

Preserve tests for:

- `proposed -> ready -> in-progress -> in-review`;
- knowledge completion;
- product/operational `release-ready -> deploying ->
  production-verification -> shipped`;
- blocked/resume behavior;
- immutable in-review subject;
- lease acquisition, expiry, collision, and recovery;
- bounded grants and handoffs;
- review, release evidence, operator deployment approvals, and production
  verification;
- dropped and recovery semantics;
- expected-version and idempotent-operation behavior.

Add hierarchy-specific Task gates:

- `task.create` authority is the Requirement scope authority or explicit
  delegated specialist;
- `task.promote` requires all `satisfies[]` Requirements active;
- `task.grant` requires aligned active ancestors and no effective hold;
- a Task cannot change pack, Feature, or `satisfies[]` through
  `task.update`;
- Task dependencies refer only to typed Task IDs and required Task states.
- after Direction changes, an existing lease may append evidence and make a
  no-forward-transition handoff to a safe owner; new production transitions,
  promotion, and grants remain blocked.

**Step 2: Run the converted tests to verify they fail**

Run:

```bash
node test/coordination-engine-self-test.mjs
node test/coordination-authority-self-test.mjs
node test/coordination-host-self-test.mjs
```

Expected: failures name unsupported `task.*` commands and missing `task`
records.

**Step 3: Extract and rename the executable-work engine**

Move item handlers from `engine.mjs` into `task-engine.mjs`, then make the
dispatcher contain only `task.*` command names. Replace all runtime terms:

```text
item record       -> task record
itemId            -> taskId where the subject must be a Task
item lease        -> task lease
item grant        -> task grant
item context      -> task context
item plan         -> task plan
```

Keep generic `recordKind/recordId` in the command envelope.

Delete `initiative.create`, `initiative.update`, and every `item.*` validator
and handler from the live command maps. Historical readers may still decode
their event payloads; they may not dispatch them.

Keep legacy Markdown parsers in `src/core/lib/coordination.mjs` only where
schema-3 inspection/migration imports them. Rename its live lifecycle and
dependency exports to Task terminology and mark legacy `{item, requires}`
parsing as historical-only.

**Step 4: Run the Task regression set**

Run:

```bash
node test/coordination-engine-self-test.mjs
node test/coordination-authority-self-test.mjs
node test/coordination-host-self-test.mjs
node test/coordination-native-scenarios-self-test.mjs
```

Expected: all exit 0, and a source assertion confirms the live dispatcher has
zero `initiative.*` or `item.*` keys.

**Step 5: Commit**

```bash
git add src/core/lib/coordination-runtime/task-engine.mjs src/core/lib/coordination-runtime/engine.mjs src/core/lib/coordination-runtime/contract.mjs src/core/lib/coordination-runtime/authority.mjs src/core/lib/coordination-runtime/host.mjs src/core/lib/coordination-runtime/host-plan.mjs src/core/lib/coordination-runtime/host-schema.mjs src/core/lib/coordination-runtime/native-host.mjs src/core/lib/coordination-runtime/native-routing.mjs src/core/lib/coordination-runtime/native-capabilities.mjs src/core/lib/coordination.mjs test/helpers/coordination-runtime-fixture.mjs test/coordination-engine-self-test.mjs test/coordination-authority-self-test.mjs test/coordination-host-self-test.mjs test/coordination-native-scenarios-self-test.mjs
git commit -m "feat(core): replace items with tasks"
```

---

### Task 7: Bind evidence, messages, reports, and acceptance to typed subjects

**Files:**

- Modify: `src/core/lib/coordination-runtime/acceptance.mjs`
- Modify: `src/core/lib/coordination-runtime/acceptance-verdicts.mjs`
- Modify: `src/core/lib/coordination-runtime/context.mjs`
- Modify: `src/core/lib/coordination-runtime/evidence.mjs`
- Modify: `src/core/lib/coordination-runtime/evidence-assets.mjs`
- Modify: `src/core/lib/coordination-runtime/evidence-content.mjs`
- Modify: `src/core/lib/coordination-runtime/evidence-context.mjs`
- Modify: `src/core/lib/coordination-runtime/evidence-integrity.mjs`
- Modify: `src/core/lib/coordination-runtime/input-basis.mjs`
- Modify: `src/core/lib/coordination-runtime/report-capture.mjs`
- Modify: `src/core/lib/coordination-runtime/report-data.mjs`
- Modify: `src/core/lib/coordination-runtime/report-paths.mjs`
- Modify: `src/core/lib/coordination-runtime/report-render.mjs`
- Modify: `src/core/lib/coordination-runtime/report.mjs`
- Modify: `src/core/lib/coordination-runtime/store.mjs`
- Modify: `test/coordination-thread-self-test.mjs`
- Modify: `test/coordination-context-self-test.mjs`
- Modify: `test/coordination-evidence-self-test.mjs`
- Modify: `test/coordination-report-self-test.mjs`
- Modify: `test/helpers/coordination-report-fixture.mjs`

**Step 1: Rewrite tests around one subject reference**

Every secondary record carries:

```js
subject: {kind: 'epic' | 'feature' | 'requirement' | 'task', id: '<typed-id>'}
```

Test:

- messages/questions can bind to any hierarchy subject;
- leases, attempts, effects, execution artifacts, review requirements, release
  evidence, and deployment approvals require a Task subject;
- parent completion evidence can bind to the exact parent subject;
- subject kind/ID must agree between the SQLite envelope and record body;
- acceptance/evidence criteria references bind kind, ID, version, criteria,
  relationship versions, and subject hash where applicable;
- a Feature approval cannot satisfy a Task and vice versa;
- stale criteria remain historical, not current;
- report paths use typed pack/type/ID paths, never `.kai/review` or
  `.kai/runs`;
- private evidence cannot be rendered or copied into a public report unless
  an explicit accepted report artifact references a safe excerpt.

**Step 2: Run the test group to verify it fails**

Run:

```bash
node test/coordination-thread-self-test.mjs
node test/coordination-context-self-test.mjs
node test/coordination-evidence-self-test.mjs
node test/coordination-report-self-test.mjs
```

Expected: failures identify remaining `itemId`, `item_id`, `.kai/runs`, and
`.kai/review` assumptions.

**Step 3: Implement typed subject helpers and remove item-bound APIs**

Add shared helpers in `contract.mjs`:

```js
export function validateHierarchySubject(subject, label);
export function subjectRef(subject, version);
export function subjectEquals(left, right);
```

Use `subject` in all record bodies and store queries. For Task-only functions,
assert `subject.kind === 'task'` before reading Task execution fields.

Change report APIs to:

```js
buildReport(store, {subject});
writeReport({root, subject, view, target});
```

The target must already have been validated by the owning publication skill
contract; core still enforces safe mirrored grammar and accepted hash.

**Step 4: Prove no live item/path assumptions remain**

Run:

```bash
node test/coordination-thread-self-test.mjs
node test/coordination-context-self-test.mjs
node test/coordination-evidence-self-test.mjs
node test/coordination-report-self-test.mjs
rg "itemId|item_id|\.kai/runs|\.kai/review" src/core/lib/coordination-runtime
```

Expected: tests exit 0. The search returns only historical schema-1 readers,
migration field names, or explicit assertions that reject retired paths.

**Step 5: Commit**

```bash
git add src/core/lib/coordination-runtime/acceptance.mjs src/core/lib/coordination-runtime/acceptance-verdicts.mjs src/core/lib/coordination-runtime/context.mjs src/core/lib/coordination-runtime/evidence.mjs src/core/lib/coordination-runtime/evidence-assets.mjs src/core/lib/coordination-runtime/evidence-content.mjs src/core/lib/coordination-runtime/evidence-context.mjs src/core/lib/coordination-runtime/evidence-integrity.mjs src/core/lib/coordination-runtime/input-basis.mjs src/core/lib/coordination-runtime/report-capture.mjs src/core/lib/coordination-runtime/report-data.mjs src/core/lib/coordination-runtime/report-paths.mjs src/core/lib/coordination-runtime/report-render.mjs src/core/lib/coordination-runtime/report.mjs src/core/lib/coordination-runtime/store.mjs
git add test/coordination-thread-self-test.mjs test/coordination-context-self-test.mjs test/coordination-evidence-self-test.mjs test/coordination-report-self-test.mjs test/helpers/coordination-report-fixture.mjs
git commit -m "refactor(core): bind coordination evidence to typed subjects"
```

---

### Task 8: Add hierarchy-aware status, context, plan, and CLI surfaces

**Files:**

- Create: `src/core/lib/coordination-runtime/hierarchy-view.mjs`
- Create: `test/coordination-hierarchy-view-self-test.mjs`
- Modify: `src/core/lib/coordination-runtime/cli.mjs`
- Modify: `src/core/coordinate.mjs`
- Modify: `src/core/work-status.mjs`
- Modify: `src/core/lib/coordination-runtime/context.mjs`
- Modify: `src/core/lib/coordination-runtime/host-plan.mjs`
- Modify: `test/coordination-cli-self-test.mjs`
- Modify: `test/work-status-self-test.mjs`
- Modify: `package.json`

**Step 1: Write failing view tests**

Build one Goal with two Epics and Core/Engineering/Creative Features. Assert:

- status rolls up `Goal -> Epic -> pack`;
- pack expansion is `Feature -> Requirement -> Task`;
- completion is lifecycle, never an attention value;
- attention is derived as `none | blocked | needs-human`;
- `needs-human` has display precedence while all reasons remain visible;
- stale Direction, holds, unmet dependencies, missing evidence, and
  human-only approvals produce the specified reasons;
- missing installed roles are reported as staffing gaps without mutating
  records;
- context is bounded and contains selected record, ancestors, direct children,
  dependencies, acceptance, authorities, current decisions, unresolved
  questions, recent messages, and active hold;
- plan returns executable Tasks only and always includes
  `automatic: false`;
- plan excludes proposed Tasks, held/stale ancestors, unmet dependencies,
  leased Tasks, and Tasks requiring a human action;
- one transactionally consistent snapshot backs every projection.

**Step 2: Define and test the CLI**

Change flags to:

```text
status
context --kind <kind> --id <id> [--max-bytes N] [--recent-limit N]
detail --kind <kind> --id <id>
messages --kind <kind> --id <id> [--before-seq N] [--limit N]
export --kind <kind> --id <id>
claim --task <task-id> [--capability <id>]
plan --kind <epic|feature|requirement|task> --id <typed-id>
```

Unknown kinds, mismatched typed IDs, or old `--item` flags must return
`INVALID_INPUT`.

Run: `node test/coordination-hierarchy-view-self-test.mjs`

Expected: exit 1 because hierarchy views do not exist.

**Step 3: Implement derived views and wire the CLI**

Export:

```js
export function hierarchyStatus(store, {direction, roles});
export function hierarchyContext(store, {subject, maxBytes, recentLimit, direction, roles});
export function taskPlan(store, {subject, direction, roles});
export function deriveAttention(store, {record, direction, roles});
```

Do not persist roll-up or attention. Do not let `plan` call dispatch or acquire
a lease.

**Step 4: Run focused view/CLI tests**

Add:

```json
"coordination:hierarchy-view-self-test": "node test/coordination-hierarchy-view-self-test.mjs"
```

Run:

```bash
npm run coordination:hierarchy-view-self-test
node test/coordination-cli-self-test.mjs
node test/work-status-self-test.mjs
```

Expected: all exit 0.

**Step 5: Commit**

```bash
git add src/core/lib/coordination-runtime/hierarchy-view.mjs src/core/lib/coordination-runtime/cli.mjs src/core/lib/coordination-runtime/context.mjs src/core/lib/coordination-runtime/host-plan.mjs src/core/coordinate.mjs src/core/work-status.mjs test/coordination-hierarchy-view-self-test.mjs test/coordination-cli-self-test.mjs test/work-status-self-test.mjs package.json
git commit -m "feat(core): expose hierarchy-aware coordination views"
```

---

### Task 9: Activate private-only schema-5 workspaces

**Files:**

- Modify: `src/core/workspace-doctor.mjs`
- Modify: `src/core/lib/workspace-resolve.mjs`
- Modify: `src/core/lib/workspace-git-privacy.mjs`
- Modify: `src/core/lib/coordination-runtime/workspace-guard.mjs`
- Modify: `src/core/lib/coordination-runtime/cli.mjs`
- Modify: `src/core/lib/coordination-runtime/native-host.mjs`
- Modify: `src/core/activity.mjs`
- Modify: `src/core/observe-subagent.mjs`
- Modify: `src/core/observe-watch.mjs`
- Modify: `test/workspace-doctor-self-test.mjs`
- Modify: `test/activity-self-test.mjs`
- Modify: `test/observe-subagent-self-test.mjs`
- Modify: `test/observe-watch-self-test.mjs`

**Step 1: Replace schema-4 workspace fixtures with the schema-5 manifest**

Use exactly:

```json
{
  "plugin": "kai-core",
  "version": "test",
  "schema_version": 5,
  "scaffolded": "2026-10-02",
  "workspace_id": "stable-id",
  "placement": "repo-local",
  "workspace_root": ".",
  "private_root": ".kai",
  "direction": "docs/kai/DIRECTION.md",
  "projects": [
    {
      "id": "default",
      "path": ".",
      "publication_root": "docs/kai"
    }
  ]
}
```

Tests must prove:

- initialization creates only `.kai/manifest.json`,
  `.kai/core/runtime/coordination.sqlite`, `docs/kai/README.md`, and
  operator-supplied `docs/kai/DIRECTION.md`;
- no `engineering`, `creative`, `personal`, `learning`, `runs`, `review`,
  `archive`, or generic artifact directory appears at initialization;
- repo-local `.kai/` is ignored and untracked;
- external placement preserves registry/project binding and private policy;
- `placement: shared` and retired manifest keys fail;
- schema 3/4 inspect/status works read-only, while every write returns
  `SCHEMA_MISMATCH`;
- first-write helpers create parents only after complete validation;
- failed validation leaves no partial directories;
- uninstall behavior never deletes `.kai` or `docs/kai`;
- case aliases, Windows junctions, symlinks, UNC/device paths, and POSIX
  absolute paths get equivalent safety decisions.

**Step 2: Run workspace tests to verify they fail**

Run: `node test/workspace-doctor-self-test.mjs`

Expected: failures name schema 4, fixed lane keys, shared mode, and old database
location assumptions.

**Step 3: Switch the current workspace contract to schema 5**

Set the doctor/runtime current schema to 5. Remove `CURRENT_SCHEMA_VERSION = 3`
versus contract-version indirection. Validate the manifest key set exactly.

Initialization order:

1. validate repository/external placement and Git privacy;
2. validate the operator-supplied Direction;
3. create `.kai/manifest.json` in a staging location;
4. create store schema 2 at `.kai/core/runtime/coordination.sqlite`;
5. write `docs/kai/README.md` only if absent;
6. atomically place the manifest last;
7. remove staging files on failure.

Update activity/observation code to use typed Task events and the new database
constant. It must not recreate generic run/review directories.

**Step 4: Run the workspace/runtime regression set**

Run:

```bash
node test/workspace-doctor-self-test.mjs
node test/activity-self-test.mjs
node test/observe-subagent-self-test.mjs
node test/observe-watch-self-test.mjs
node test/coordination-cli-self-test.mjs
```

Expected: all exit 0.

**Step 5: Commit**

```bash
git add src/core/workspace-doctor.mjs src/core/lib/workspace-resolve.mjs src/core/lib/workspace-git-privacy.mjs src/core/lib/coordination-runtime/workspace-guard.mjs src/core/lib/coordination-runtime/cli.mjs src/core/lib/coordination-runtime/native-host.mjs src/core/activity.mjs src/core/observe-subagent.mjs src/core/observe-watch.mjs test/workspace-doctor-self-test.mjs test/activity-self-test.mjs test/observe-subagent-self-test.mjs test/observe-watch-self-test.mjs
git commit -m "feat(core): activate schema 5 private workspaces"
```

---

### Task 10: Implement explicit schema-4 classification and atomic migration

**Files:**

- Create: `src/core/lib/coordination-runtime/migration-v5.mjs`
- Create: `test/coordination-schema5-migration-self-test.mjs`
- Modify: `src/core/lib/coordination-runtime/migration.mjs`
- Modify: `src/core/lib/coordination-runtime/migration-files.mjs`
- Modify: `src/core/lib/coordination-runtime/migration-legacy.mjs`
- Modify: `src/core/lib/coordination-runtime/native-host.mjs`
- Modify: `src/core/lib/coordination-runtime/cli.mjs`
- Modify: `src/core/coordinate.mjs`
- Modify: `src/core/workspace-doctor.mjs`
- Modify: `test/coordination-migration-self-test.mjs`
- Modify: `package.json`

**Step 1: Write the failing migration matrix**

Add fixtures for:

1. a deterministic schema-4 Task mapping;
2. an item that could be Requirement or Task;
3. milestones mapped to Epic, Feature, Requirement, and historical-only;
4. active leases and in-flight deployment;
5. shared workspace requiring explicit repo-local/external choice;
6. old authored private files from known and unknown packs;
7. accepted public files under old paths that must stay in place;
8. interrupted stages before backup, after backup, after staged DB, and after
   DB move but before manifest activation;
9. rollback before and after the first schema-5 event;
10. schema-3 historical inspection followed by its existing schema-4 migration
    and then explicit schema-5 migration.

Assert preservation of IDs, versions, timestamps, events, dependencies,
questions, messages, approvals, evidence, reviews, leases, recovery, source
paths/digests, and public links.

Assert activation is blocked by:

- incomplete/ambiguous classifications;
- stale Direction binding;
- unresolved active leases or production actions;
- unknown/incubated pack ownership;
- tracked private files without an explicit untracking plan;
- unverified external backup;
- relationship or authority inconsistency.

**Step 2: Define the exact worksheet and authorization flow**

Add read verb:

```text
migration-plan
```

It returns canonical JSON:

```js
{
  schema_version: 1,
  source_workspace_schema: 4,
  source_manifest_digest: '<sha256>',
  source_store_digest: '<sha256>',
  direction_ref: {path, hash, goal},
  placement: {target: null, project_binding: null},
  backup_root: null,
  epics: [],
  milestones: [],
  items: [],
  authored_files: [],
  retained_publications: [],
  active_work: [],
  untracking: [],
}
```

The operator fills every classification and submits it in the existing
`request` body:

```js
{
  type: 'maintenance',
  action: 'migrate-v5',
  worksheet
}
```

Here `worksheet` is the completed object returned by `migration-plan`, with
every required classification resolved. The issued capability binds its exact
canonical digest. `migrate
--confirm --capability <id>` reads the worksheet from the capability, never
from an unbound path or second stdin payload.

**Step 3: Run migration tests to verify they fail**

Run: `node test/coordination-schema5-migration-self-test.mjs`

Expected: exit 1 because `migration-plan` and `migrate-v5` are unsupported.

**Step 4: Implement backup-first staging and activation**

Required write order:

1. acquire exclusive migration lock;
2. snapshot manifest, schema-1 DB, authored files, Git tracking, registry, and
   public tree;
3. validate the capability-bound worksheet against that snapshot;
4. create and fsync the backup under the worksheet's absolute `backup_root`,
   which must resolve outside the workspace and project trees;
5. verify every backup digest;
6. stage store schema 2 and the schema-5 tree outside live paths;
7. insert typed hierarchy records and `migration_id_map`;
8. retain original schema-4 records/events as immutable migration provenance;
9. validate hierarchy, authorities, Direction, paths, privacy, and read views;
10. atomically move the staged DB to `.kai/core/runtime/coordination.sqlite`;
11. atomically activate the schema-5 manifest last;
12. retain the backup and a signed-by-digest migration receipt.

No code may automatically run `git rm --cached`, commit, or rewrite history.
When untracking is required, migration stops with the exact operator command
and resumes only after a new snapshot/worksheet/capability.

Rollback may restore schema 4 only while the schema-5 event log still equals
the activation baseline. Otherwise return `RECOVERY_REQUIRED` and require
explicit reconciliation.

**Step 5: Run migration and mutation tests**

Add:

```json
"coordination:schema5-migration-self-test": "node test/coordination-schema5-migration-self-test.mjs"
```

Run:

```bash
npm run coordination:schema5-migration-self-test
node test/coordination-migration-self-test.mjs
node test/workspace-doctor-self-test.mjs
```

Expected: all exit 0. The old migration test proves schema-3 preservation; the
new test proves schema-4-to-5 classification and activation.

**Step 6: Commit**

```bash
git add src/core/lib/coordination-runtime/migration-v5.mjs src/core/lib/coordination-runtime/migration.mjs src/core/lib/coordination-runtime/migration-files.mjs src/core/lib/coordination-runtime/migration-legacy.mjs src/core/lib/coordination-runtime/native-host.mjs src/core/lib/coordination-runtime/cli.mjs src/core/coordinate.mjs src/core/workspace-doctor.mjs test/coordination-schema5-migration-self-test.mjs test/coordination-migration-self-test.mjs package.json
git commit -m "feat(core): migrate schema 4 workspaces to schema 5"
```

---

### Task 11: Replace shipped workspace/work contracts and add pack publication skills

**Files:**

- Create: `plugins/kai-core/skills/kai-core-workspace-publication/SKILL.md`
- Create: `plugins/kai-engineering/skills/engineering-workspace-publication/SKILL.md`
- Create: `plugins/kai-creative/skills/creative-workspace-publication/SKILL.md`
- Create: `plugins/kai-core/skills/kai-core-work-hierarchy/SKILL.md`
- Create: `plugins/kai-core/skills/kai-core-work-task/SKILL.md`
- Create: `plugins/kai-core/skills/kai-core-work-stewardship/SKILL.md`
- Create: `plugins/kai-core/agents/workflow-epic-init.agent.md`
- Delete: `plugins/kai-core/skills/kai-core-workspace-initiative/SKILL.md`
- Delete: `plugins/kai-core/skills/kai-core-work-item/SKILL.md`
- Delete: `plugins/kai-core/skills/kai-core-initiative-stewardship/SKILL.md`
- Delete: `plugins/kai-core/agents/workflow-initiative-init.agent.md`
- Modify: `plugins/kai-core/skills/kai-core-workspace-paths/SKILL.md`
- Modify: `plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md`
- Modify: `plugins/kai-core/skills/kai-core-work-acting/SKILL.md`
- Modify: `plugins/kai-core/skills/kai-core-work-granting/SKILL.md`
- Modify: `plugins/kai-core/skills/kai-core-asset-producing/SKILL.md`
- Modify: `plugins/kai-core/skills/kai-core-asset-closing/SKILL.md`
- Modify: `plugins/kai-core/skills/kai-core-definition-of-done/SKILL.md`
- Modify: `plugins/kai-core/agents/director-chief-of-staff.agent.md`
- Modify: `plugins/kai-core/agents/workflow-workspace-init.agent.md`
- Modify: `plugins/kai-core/agents/workflow-proactive-scan.agent.md`
- Modify: `plugins/kai-core/agents/workflow-weekly-pulse.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-advisor-investigation.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-builder-platform.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-builder-software.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-lead-architecture.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-lead-technical-writing.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-code.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-privacy-compliance.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-quality.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-reliability.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-security.agent.md`
- Modify: `plugins/kai-engineering/agents/workflow-incident-response.agent.md`
- Modify: `plugins/kai-engineering/agents/workflow-pull-request.agent.md`
- Modify: `plugins/kai-engineering/agents/workflow-ship.agent.md`
- Modify: `plugins/kai-creative/agents/creative-lead-design.agent.md`
- Modify: `plugins/kai-creative/agents/creative-lead-video.agent.md`
- Modify: `plugins/kai-creative/agents/workflow-creative-demo-production.agent.md`
- Modify: `plugins/kai-creative/skills/mockups-ascii/SKILL.md`
- Modify: `plugins/kai-creative/skills/mockups-html/SKILL.md`
- Modify: `plugins/kai-creative/skills/video-align-narration/SKILL.md`
- Modify: `plugins/kai-creative/skills/video-render-zoom/SKILL.md`
- Modify: `tools/lib/pack-plan.mjs`
- Modify: `tools/validate-plugin.mjs`
- Modify: `tools/generate-catalog.mjs`
- Modify: `tools/pack-preview.mjs`
- Modify: `AGENTS.md`
- Modify: `test/package-availability-self-test.mjs`
- Modify: `test/coordination-foundation-self-test.mjs`
- Modify: `test/coordination-source-routing-self-test.mjs`
- Modify: `test/engineering-agents-self-test.mjs`
- Modify: `test/creative-agent-contract-self-test.mjs`
- Modify: `test/creative-skill-contract-self-test.mjs`
- Modify: `test/fixtures/inventory.json`

**Step 1: Add failing source-contract assertions and mutations**

Tests must count the live corpus and assert:

- exactly one publication skill exists in each shipped pack;
- each publication skill contains one canonical table with namespace, type,
  subtype, private form, public form, formats, publication rule, and privacy
  rule;
- Core table types are `direction`, `features`, `decisions`, `reports`;
- Engineering table types are `features`, `documentation`, `decisions`,
  `reports`; allowed subtypes are `documentation/architecture`,
  `reports/investigations`, and `reports/releases`;
- Creative table types are `features`, `documentation`, `decisions`,
  `reports`, `media`;
- every active producer routes its own pack publication skill immediately
  before `kai-core-asset-producing`;
- Core never routes Engineering or Creative publication skills;
- non-producers do not acquire publication routes;
- unknown type/subtype, scratch publication, unaccepted draft publication,
  private evidence publication, and arbitrary-root publication are explicit
  refusal paths;
- no shipped file references `initiative`, generic `item`, `.kai/runs`,
  `.kai/review`, `.kai/personal`, `shared` mode, or removed contracts except
  migration/history text;
- no Markdown board, backlog, milestone, thread, item, or initiative log is
  presented as authoritative; SQLite is the only coordination authority;
- the workspace Direction contract requires Vision, Mission, one observable
  time-bounded Current Goal, and Out of Scope;
- the new Epic workflow starts from current Direction and creates no record
  before named authority approval;
- suggestions that lack named authority approval remain conversational;
- Chief of Staff grants Tasks but cannot invent Epic/Feature/Requirement
  scope, priority, authority, or acceptance.

Each gate needs a mutation fixture that removes a route, changes a table type,
introduces a fallback lane, or restores an old contract and then asserts a
specific validation error.

**Step 2: Run the contract tests to verify they fail**

Run:

```bash
node test/package-availability-self-test.mjs
node test/coordination-foundation-self-test.mjs
node test/coordination-source-routing-self-test.mjs
node test/engineering-agents-self-test.mjs
node test/creative-agent-contract-self-test.mjs
node test/creative-skill-contract-self-test.mjs
```

Expected: failures name missing publication/hierarchy skills and old
initiative/item routes.

**Step 3: Write the new contracts and remove the old ones**

Publication skills own vocabulary and formats. The shared asset-producing
skill owns only this interface:

```text
validate owning-pack route
derive private typed path
produce mutable private revision
bind exact accepted hash and authority
copy accepted revision to mirrored public path
record provenance
remove scratch on closure
archive retained private draft/evidence
```

`kai-core-work-hierarchy` owns record meanings and relationship invariants.
`kai-core-work-stewardship` owns authority, promotion, holds, reprioritization,
and closure. `kai-core-work-task` owns the executable lifecycle and lease
rules.

Update the repository contract table in `AGENTS.md` to route these new owning
skills and remove the three retired skill names. Do not edit the managed
communication-style block.

Every route remains just-in-time. Do not reintroduce eager `**Inherits:**`
blocks or dependency guards.

**Step 4: Update validation and catalog ownership**

In `pack-plan.mjs`, derive an agent's owning publication skill from its source
pack. Validate order by routed sentence positions, not by a hard-coded agent
list.

Update catalog categories:

```text
Workspace & direction:
  kai-core-workspace-paths
  kai-core-workspace-onboarding
  kai-core-workspace-publication

Hierarchy & stewardship:
  kai-core-work-hierarchy
  kai-core-work-stewardship
  kai-core-work-task
  kai-core-work-acting
  kai-core-work-granting

Pack publication:
  engineering-workspace-publication
  creative-workspace-publication
```

Update the inventory fixture for the removed and added IDs.

**Step 5: Run source, mutation, and generation checks**

Run:

```bash
node test/package-availability-self-test.mjs
node test/coordination-foundation-self-test.mjs
node test/coordination-source-routing-self-test.mjs
node test/engineering-agents-self-test.mjs
node test/creative-agent-contract-self-test.mjs
node test/creative-skill-contract-self-test.mjs
node tools/validate-plugin.mjs
node tools/generate-catalog.mjs --check
node tools/pack-preview.mjs --self-test
```

Expected: all exit 0 and each new gate reports a non-zero inspected corpus.

**Step 6: Commit**

```bash
git add -A plugins/kai-core/agents plugins/kai-engineering/agents plugins/kai-creative/agents
git add -A plugins/kai-core/skills/kai-core-workspace-publication plugins/kai-core/skills/kai-core-work-hierarchy plugins/kai-core/skills/kai-core-work-task plugins/kai-core/skills/kai-core-work-stewardship plugins/kai-core/skills/kai-core-workspace-initiative plugins/kai-core/skills/kai-core-work-item plugins/kai-core/skills/kai-core-initiative-stewardship
git add plugins/kai-core/skills/kai-core-workspace-paths/SKILL.md plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md plugins/kai-core/skills/kai-core-work-acting/SKILL.md plugins/kai-core/skills/kai-core-work-granting/SKILL.md plugins/kai-core/skills/kai-core-asset-producing/SKILL.md plugins/kai-core/skills/kai-core-asset-closing/SKILL.md plugins/kai-core/skills/kai-core-definition-of-done/SKILL.md
git add plugins/kai-engineering/skills/engineering-workspace-publication/SKILL.md plugins/kai-creative/skills/creative-workspace-publication/SKILL.md plugins/kai-creative/skills/mockups-ascii/SKILL.md plugins/kai-creative/skills/mockups-html/SKILL.md plugins/kai-creative/skills/video-align-narration/SKILL.md plugins/kai-creative/skills/video-render-zoom/SKILL.md
git add tools/lib/pack-plan.mjs tools/validate-plugin.mjs tools/generate-catalog.mjs tools/pack-preview.mjs AGENTS.md
git add test/package-availability-self-test.mjs test/coordination-foundation-self-test.mjs test/coordination-source-routing-self-test.mjs test/engineering-agents-self-test.mjs test/creative-agent-contract-self-test.mjs test/creative-skill-contract-self-test.mjs test/fixtures/inventory.json
git commit -m "feat(packs): adopt composable workspace contracts"
```

---

### Task 12: Prove consumer composition and prepare the breaking release

**Files:**

- Create: `test/fixtures/schema5-consumer/core-only/`
- Create: `test/fixtures/schema5-consumer/core-engineering/`
- Create: `test/fixtures/schema5-consumer/core-creative/`
- Create: `test/fixtures/schema5-consumer/all-packs/`
- Modify: `test/consumer-install-self-test.mjs`
- Modify: `test/workspace-doctor-self-test.mjs`
- Modify: `test/coordination-schema5-migration-self-test.mjs`
- Modify: `test/README.md`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `plugin.json`
- Modify: `.github/plugin/marketplace.json`
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `docs/host-capabilities.md`
- Modify: `docs/how-kai-works.md`
- Modify: `docs/reference/agents-and-skills.md`
- Regenerate: `plugins/kai-core/plugin.json`
- Regenerate: `plugins/kai-core/scripts/activity.mjs`
- Regenerate: `plugins/kai-core/scripts/coordinate.mjs`
- Regenerate: `plugins/kai-core/scripts/observe-subagent.mjs`
- Regenerate: `plugins/kai-core/scripts/observe-watch.mjs`
- Regenerate: `plugins/kai-core/scripts/work-status.mjs`
- Regenerate: `plugins/kai-core/scripts/workspace-doctor.mjs`
- Regenerate: hashed `plugins/kai-core/scripts/chunk-*.mjs` files emitted by esbuild
- Regenerate: `plugins/kai-engineering/plugin.json`
- Regenerate: `plugins/kai-creative/plugin.json`
- Regenerate: `plugins/kai-creative/scripts/demo-format.mjs`
- Regenerate: `plugins/kai-creative/scripts/demo-narrate.mjs`
- Regenerate: `plugins/kai-creative/scripts/demo-zoom.mjs`
- Regenerate: hashed `plugins/kai-creative/scripts/chunk-*.mjs` files emitted by esbuild

**Step 1: Add the failing generated-consumer matrix**

For each fixture, copy only generated pack files into a clean temporary
consumer repository with no repository `node_modules`. Execute the bundled
scripts and assert:

| Fixture | Initialization | First private artifact | First publication |
| --- | --- | --- | --- |
| core only | no department dirs | `.kai/core/features/...` only | `docs/kai/core/features/...` |
| core + engineering | no engineering dir at install/init | `.kai/engineering/documentation/architecture/...` only | mirrored engineering path |
| core + creative | no creative dir at install/init | `.kai/creative/media/...` only | Git-suitable media or accepted external-destination record |
| all packs | no unused pack dirs | only the pack used by the test | only the accepted artifact |

Also assert:

- direct code work creates no pack directory;
- invalid type/subtype creates nothing;
- scratch and unaccepted drafts cannot publish;
- private evidence stays ignored/untracked;
- uninstall simulation leaves both `.kai` and `docs/kai` intact;
- generated bundles contain no checkout-relative imports;
- Windows and POSIX path mutations return equivalent decisions.

**Step 2: Run the consumer test to verify it fails**

Run: `node test/consumer-install-self-test.mjs`

Expected: exit 1 because generated packs lack schema-5 contracts/bundles.

**Step 3: Generate catalog and pack artifacts**

Run:

```bash
npm run docs:generate
npm run pack-preview -- --write
```

Expected: generated catalog and all three pack manifests/scripts reflect the
new source contracts.

**Step 4: Run the consumer and schema-5 acceptance set**

Run:

```bash
node test/consumer-install-self-test.mjs
node test/workspace-layout-self-test.mjs
node test/direction-self-test.mjs
node test/coordination-hierarchy-contract-self-test.mjs
node test/coordination-hierarchy-engine-self-test.mjs
node test/coordination-hierarchy-view-self-test.mjs
node test/coordination-schema5-migration-self-test.mjs
node test/workspace-doctor-self-test.mjs
```

Expected: all exit 0.

**Step 5: Bump every release surface to `19.0.0`**

Run:

```bash
npm version 19.0.0 --no-git-tag-version
npm run pack-preview -- --write
```

Set `plugin.json`, `.github/plugin/marketplace.json` metadata, and all three
marketplace plugin entries to `19.0.0`. `package-lock.json` changes only
through `npm version`; do not run `npm install` unless dependencies changed.

Add `CHANGELOG.md` section:

```markdown
## [19.0.0] - 2026-10-02

### Changed

- Replaced schema-4 initiative/item coordination with the Direction-aligned
  Epic/Feature/Requirement/Task hierarchy.
- Made `.kai/` private-only and moved runtime state to
  `.kai/core/runtime/coordination.sqlite`.
- Added lazy, pack-owned typed publication contracts for Core, Engineering,
  and Creative.

### Removed

- Removed shared workspace mode, eager department folders, generic
  run/review/personal lanes, and initiative/item compatibility aliases.

### Migration

- Schema 3 and 4 remain inspectable. Schema-4 activation requires the explicit
  operator-approved classification and backup-first schema-5 migration.
```

Add:

```markdown
[19.0.0]: https://github.com/ketzalcode/kai/compare/v18.0.0...v19.0.0
```

Update README:

- show the three-pack architecture;
- show `.kai` private and `docs/kai` accepted trees in ASCII;
- explain Direction and the five-level hierarchy;
- give install commands for Core, Engineering, and Creative;
- state lazy first-write behavior;
- give the schema-4 migration entry point without reproducing the full skill;
- set `## Status` to `v19.0.0`.

Update `docs/host-capabilities.md` with typed Task capability scopes,
hierarchy reads, and the capability-bound migration worksheet. Update
`docs/how-kai-works.md` with schema-5 authority, Direction, hierarchy,
private/public workspace boundaries, and direct-work behavior.

**Step 6: Run full release validation**

Run:

```bash
npm test
git diff --check
git status --short
```

Expected:

- `npm test` exits 0;
- diff check emits nothing;
- status contains only intended schema-5 source, tests, docs, generated packs,
  and release metadata.

Open the PR only after this passes. The GitHub Actions matrix must pass on both
Windows and Linux before merge; those runs are the cross-platform execution
evidence.

**Step 7: Commit**

```bash
git add package.json package-lock.json plugin.json .github/plugin/marketplace.json CHANGELOG.md README.md docs/host-capabilities.md docs/how-kai-works.md docs/reference/agents-and-skills.md
git add -A test/fixtures/schema5-consumer test/consumer-install-self-test.mjs test/workspace-doctor-self-test.mjs test/coordination-schema5-migration-self-test.mjs test/README.md
git add -A plugins/kai-core/plugin.json plugins/kai-core/scripts plugins/kai-engineering/plugin.json plugins/kai-creative/plugin.json plugins/kai-creative/scripts
git commit -m "chore(release): prepare 19.0.0"
```

---

## Final implementation self-review

Before requesting code review, perform all three checks below.

### 1. Design coverage

Confirm each approved requirement has one implementation and one behavioral
test:

| Requirement | Implementation task | Primary test |
| --- | --- | --- |
| private-only `.kai`, repo-local/external | 1, 9 | `workspace-layout-self-test`, `workspace-doctor-self-test` |
| no eager pack directories | 9, 12 | `consumer-install-self-test` |
| pack-owned publication vocabularies | 11 | package/agent/skill contract tests |
| mirrored first-write lifecycle | 1, 7, 11, 12 | layout, evidence, consumer tests |
| four-part Direction | 2 | `direction-self-test` |
| explicit hierarchy and relationships | 3 | hierarchy contract test |
| parent authority/lifecycle/holds | 5 | hierarchy engine test |
| preserved Task execution gates | 6 | engine/authority/host tests |
| typed evidence subjects | 4, 7 | store/evidence/report tests |
| attention and roll-up | 8 | hierarchy view test |
| Task-only non-automatic plan | 8 | hierarchy view/CLI tests |
| focus/reprioritization guardrails | 2, 5, 8, 11 | engine/view/source-contract tests |
| schema-4 classification migration | 10 | schema-5 migration test |
| atomic activation and rollback | 9, 10 | doctor/migration mutation tests |
| Windows/Linux and clean consumers | 1, 9, 12 | CI matrix plus consumer test |
| breaking release integration | 12 | release guard and full `npm test` |

Read both specs linearly and add a row before implementation if any normative
statement lacks a task/test owner.

### 2. Placeholder and retired-surface scan

Run:

```bash
rg "TODO|TBD|FIXME|placeholder|not implemented" src plugins test README.md docs/reference
rg "initiative|itemId|item_id|item\.|\.kai/runs|\.kai/review|\.kai/personal|placement.*shared" src plugins test
```

Expected:

- first search has no schema-5 implementation placeholders;
- second search contains only migration/history fixtures, historical readers,
  and explicit rejection assertions.

Any live runtime, shipped skill, or agent match blocks review.

### 3. Interface and type consistency

Run:

```bash
node tools/check-syntax.mjs
node tools/validate-plugin.mjs
node tools/generate-catalog.mjs --check
node tools/pack-preview.mjs --gate all
node tools/pack-preview.mjs --check
npm test
```

Then verify these interfaces have exactly one definition and all callers use
it:

```text
HierarchySubject
DirectionRef
Epic / Feature / Requirement / Task
parentClosureRef
privateArtifactDirectory / publicationDirectory
listRecords(... subject ...)
hierarchyStatus / hierarchyContext / taskPlan
schema-5 migration worksheet
```

Expected: all commands exit 0, generated files are clean, and no caller
constructs a Direction hash, closure reference, publication path, or typed
subject by hand.

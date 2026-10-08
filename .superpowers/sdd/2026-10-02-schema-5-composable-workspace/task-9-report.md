# Task 9 report — activate private-only schema-5 workspaces

Date: 2026-10-07

## Outcome

Schema 5 is now the live workspace contract.

The implementation:

- validates the exact schema-5 manifest and rejects every extra key, including
  retired lanes and installed-pack lists;
- supports only `repo-local` and registered `external` placement;
- keeps the complete `.kai/` tree private, ignored, and untracked;
- initializes only the manifest, schema-2 coordination store,
  `docs/kai/README.md` when absent, and operator-supplied
  `docs/kai/DIRECTION.md`;
- verifies Direction without creating or replacing its content;
- creates the store at `.kai/core/runtime/coordination.sqlite`;
- stages the manifest and activates it last, after privacy, Direction, store,
  README, and complete tree validation;
- removes staged files, a newly created store, and a newly created README on
  initialization failure;
- creates no department, personal, run, review, archive, or generic artifact
  directory during initialization;
- moves native host, activity, observation, and consent data under
  `.kai/core/runtime/`;
- changes declared activity from an untyped `item` field to an optional typed
  `<pack>:task:<slug>` Task field;
- preserves schema-3/4 inspect, status, and legacy reads while returning
  `SCHEMA_MISMATCH` before every schema-3/4 runtime write;
- preserves historical schema-3 activity and schema-4 shared privacy reads
  without permitting old writes;
- preserves `.kai` and `docs/kai` when a registry binding is forgotten;
- rejects linked, junction-backed, aliased, UNC, device, network, cross-form
  absolute, and escaping workspace paths before writes;
- validates first-write targets before creating directories, so invalid and
  linked targets leave no partial tree;
- keeps report production on typed pack/type/ID/lifecycle paths and never
  recreates generic review lanes.

No generated packs were refreshed. Release metadata remains intentionally
unchanged for Task 12.

## RED

Tests were changed before production code.

### Workspace activation

Command:

```text
node test/workspace-doctor-self-test.mjs
```

Initial failure:

```text
SyntaxError: The requested module '../src/core/workspace-doctor.mjs'
does not provide an export named 'initializeWorkspace'
```

This was the expected first failure: no schema-5 initializer or atomic
activation path existed.

### Activity

Command:

```text
node test/activity-self-test.mjs
```

Initial result:

```text
11 failures
```

The failures identified the old `.kai/activity.jsonl` path, untyped `item`
field, item-state wording, old CLI flag, missing first-write validation, and
old reader location.

### Observation

Commands:

```text
node test/observe-subagent-self-test.mjs
node test/observe-watch-self-test.mjs
```

Initial results:

```text
observe-subagent: 3 failures
observe-watch: 1 failure
```

The failures named the old observed/consent/activity locations and the external
schema-5 discovery gap.

### CLI

Command:

```text
node test/coordination-cli-self-test.mjs
```

Initial result:

```text
8 tests
3 passed
5 failed
```

Schema 5 was unsupported, schema-3/4 request writes still reached the host,
and live typed views still opened `.kai/state/coordination.sqlite`.

## GREEN

### Required Task 9 regressions

Fresh final runs:

```text
node test/workspace-doctor-self-test.mjs
all workspace and 33 migration-doctor scenario checks passed

node test/activity-self-test.mjs
all checks passed

node test/observe-subagent-self-test.mjs
all checks passed

node test/observe-watch-self-test.mjs
all checks passed

node test/coordination-cli-self-test.mjs
8 passed, 0 failed

node test/coordination-cli-lifecycle-self-test.mjs
32 passed, 0 failed
```

The lifecycle suite now uses schema 5 by default. Its schema-3 migration case
proves migration and rollback writes remain `SCHEMA_MISMATCH` until Task 10
adds the explicit schema-5 migration.

### Layout, Direction, store, and status

```text
node test/workspace-layout-self-test.mjs
9 passed, 0 failed

node test/direction-self-test.mjs
8 passed, 0 failed

node test/coordination-store-self-test.mjs
20 passed, 0 failed

node test/work-status-self-test.mjs
all checks passed
```

### Directly affected runtime regressions

```text
node test/coordination-hierarchy-engine-self-test.mjs
11 passed, 0 failed

node test/coordination-hierarchy-view-self-test.mjs
11 passed, 0 failed

node test/coordination-engine-self-test.mjs
79 passed, 0 failed

node test/coordination-host-self-test.mjs
54 passed, 0 failed

node test/coordination-report-self-test.mjs
85 passed, 0 failed

npm run check-syntax
74 JS/MJS helpers parsed cleanly
```

The full `npm test` was not run. The implementation plan explicitly reserves
the synchronized generated-pack, release metadata, and full-suite gate for
Task 12.

## Requirement evidence

### Exact manifest and private placement

The doctor tests prove:

- the exact required key set;
- rejection of `runs`, `installed_packs`, `placement: "shared"`, and other
  unrecognized keys;
- `private_root: ".kai"` and `direction: "docs/kai/DIRECTION.md"`;
- whole-tree `.kai/` ignore and untracked status;
- registered external workspace/project identity;
- no project-local `.kai` under external placement.

### Minimal initialization and atomic activation

The initializer test snapshots the new tree and permits only:

```text
.kai/manifest.json
.kai/core/runtime/coordination.sqlite
docs/kai/README.md
docs/kai/DIRECTION.md
```

The test also proves:

- an existing README remains byte-identical;
- missing Direction creates no `.kai`;
- a README validation failure removes the staged manifest and new store;
- a linked `.kai` root is refused before any file is staged;
- no department or generic lane appears.

### Historical read-only behavior

CLI tests exercise schema 3 and schema 4 with:

```text
inspect
status
apply
request
init
claim
```

Inspect and status remain read-only. Every write returns
`SCHEMA_MISMATCH`, and no schema-5 database is created.

### First-write and path safety

Activity and observation tests prove invalid typed input creates no tree and
junction-backed runtime parents are rejected without writing through the
junction.

Layout, Direction, doctor, registry, and runtime validation cover:

- traversal;
- case and filesystem aliases;
- symlinks and Windows junctions;
- UNC and device paths;
- Windows and POSIX absolute forms;
- nested Git roots;
- project/publication overlap and escape.

## Review

The user prohibited subagent dispatch, so the complete diff was reviewed
directly.

Review found and fixed:

1. live store root derivation initially assumed only one database depth;
   callers now recognize both the live schema-5 path and historical schema-4
   path;
2. first-write activity and observation helpers could otherwise traverse a
   linked runtime parent; both now refuse before `mkdir`;
3. fresh initialization needed to inspect an existing empty/private root before
   staging; linked, non-empty, nested-Git, and retired generic trees now fail
   before activation;
4. external projects could retain project-local or dangling linked `.kai`
   state; manifest validation now rejects both;
5. registry resolution could touch non-native, UNC, device, linked, or aliased
   paths before validation; it now refuses those paths first;
6. legacy shared privacy and schema-3 activity reads were at risk of being
   mistaken for schema-5 policy; historical reads now retain their old
   interpretation while all old writes remain blocked;
7. native initialization needed the same runtime host/database paths, retired
   root refusal, README safety, and manifest-last staging guarantees;
8. a cleanup error after native manifest activation could have removed the
   newly valid store; activation is now kept authoritative once the final
   rename succeeds.

No open correctness finding remains from the direct review.

## Concerns

- Task 10 still owns explicit schema-3/4 classification, backup-first migration,
  rollback, and interrupted recovery.
- Task 12 still owns pack regeneration, `19.0.0` release metadata, generated
  consumer execution, and the full `npm test` gate.

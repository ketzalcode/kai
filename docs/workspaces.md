[kai](../README.md) / [Docs](README.md) / Workspace model

# Workspace model

Kai separates private operational state from intentionally published project
knowledge. Schema 5 is the live contract. Schema 3 and schema 4 remain
inspect-only historical workspaces until explicit schema-5 migration.

```text
project repository                         Kai workspace
------------------                         -------------
docs/kai/                                  .kai/
  DIRECTION.md                               manifest.json
  README.md                                  core/runtime/
                                                coordination.sqlite
```

`docs/kai` is the schema-5 publication root. Direction is operator-supplied.
Initialization creates `README.md` only when absent and preserves existing
bytes.

## Private workspace

Minimal initialization creates only `.kai/manifest.json` and
`.kai/core/runtime/coordination.sqlite` in the private tree. It does not create
department, personal, learning, run, review, archive, or generic artifact
directories. Typed first-write helpers create `<pack>/<type>/<id>/<lifecycle>`
paths only when real work needs them.

The entire `.kai/` tree is private, ignored, and untracked. The schema-2 SQLite
store at `.kai/core/runtime/coordination.sqlite` is the authoritative live
coordination record.

Activity and observer files also stay private:

```text
.kai/core/runtime/activity.jsonl
.kai/core/runtime/observed.jsonl
.kai/core/runtime/observer-consent
```

## Coordination runtime

Coordinated reads and writes go through one entry point:

```bash
node scripts/coordinate.mjs inspect --root <workspace-dir>
node scripts/coordinate.mjs status  --root <workspace-dir>
node scripts/coordinate.mjs apply   --root <workspace-dir>   # one JSON command on stdin
node scripts/coordinate.mjs direct                            # single-shot work, no workspace
```

`inspect` is the preflight. Successfully loading `kai-core-contract-v1` only
proves the plugin is installed; it is not permission to operate a historical
workspace.

| Manifest | Reads | Coordinated writes |
|---|---|---|
| `schema_version: 5` with the exact schema-2 store | yes | yes |
| `schema_version: 5`, missing or invalid store | `inspect` reports the partial activation | refused with `SCHEMA_MISMATCH` or `RECOVERY_REQUIRED` |
| `schema_version: 3` or `4` | `inspect`, `status`, `legacy` only — **inspect-only** | refused with `SCHEMA_MISMATCH`; explicit schema-5 migration required |

There is no automatic upgrade and no schema-4 initialization path. Historical
stores are read-only. No native coordination command creates the live store.
New workspaces use the explicit confirmed standalone initializer:

```bash
node scripts/workspace-doctor.mjs --initialize --root <workspace-dir> --confirm
```

The exact schema-5 manifest is supplied on stdin. Activation is manifest-last;
validation failure removes staged files and the new store.

Writes are commands, not file edits. Historical `BOARD.md`, `state/items/*.md`,
and `state/threads/*.md` files are retained historical import sources only.
They are no longer updated. Editing one never changes the live record.

`plan --kind <kind> --id <id>` returns an ordered queue with
`automatic: false` — kai does
not dispatch roles by itself. Peer model/effect observation is not implemented
and returns `UNSUPPORTED_HOST`.

What the runtime has actually been shown to do, case by case — including the
installed-host scenario that failed and the cases nothing verifies — is recorded
in [the coordination acceptance record](reference/coordination-acceptance.md).

## Storage modes

| Mode | Workspace location | Repository behavior |
|---|---|---|
| `external` | Durable directory outside the project | Zero operational Kai footprint; a machine-local registry pairs project and workspace. |
| `repo-local` | Project `.kai/` | Entire tree is ignored and untracked. |

External discovery uses `$KAI_HOME/workspaces.json`, with `KAI_HOME` defaulting
to `~/.kai`. A registry row contains absolute project and workspace roots plus
the same `workspace_id` as the external manifest. Missing, duplicate, or
mismatched bindings fail closed.

Inspect or manage the registry with:

```bash
node scripts/workspace-doctor.mjs --registry
node scripts/workspace-doctor.mjs --adopt <project-dir> --root <workspace-dir>
node scripts/workspace-doctor.mjs --forget <project-dir>
```

`--forget` removes only the binding. It never deletes workspace files.

## Publication

Accepted current project knowledge publishes under each project's
`publication_root`:

```text
<project-root>/<publication-root>/
├─ README.md
├─ decisions/
├─ specs/
└─ reports/
```

Working artifacts remain private. Publication requires an acceptance authority
and the exact accepted revision. Public work-item targets use:

```text
project:<project-id>:<project-relative-path>
```

Example:

```text
project:api:docs/kai/decisions/export-api.md
```

Private targets remain workspace-relative, for example:

```text
.kai/engineering/task/export-api/drafts/decision.md
.kai/creative/task/export-ui/evidence/options.html
```

## Closure

Execution state and asset validity are separate. A completed investigation may
later become stale; its work item remains completed while revalidation becomes
new work.

When an initiative reaches a terminal state:

1. required work reaches its required state;
2. every asset has disposition, validity, authority, and provenance;
3. backlog entries are promoted, deferred, rejected, or superseded;
4. ownership and follow-up work are explicit;
5. the typed runtime record remains authoritative and discoverable;
6. private assets that are no longer active may move only through their typed
   `<pack>/archive/<type>/<id>` route.

Published project documents do not move when the private initiative record is
archived.

## Schema-2 migration

<!-- kai:allow-legacy-roots -->
Schema 2 used a visible `kai/coordination/`, `kai/initiatives/`,
`kai/library/`, and `kai/personal/` corpus. Treat those bytes as historical
inputs. Do not copy them into generic schema-5 directories or activate an
intermediate schema-3/4 writer. The explicit offline schema-5 migration
classifies each source into typed runtime records, typed private asset paths, or
accepted publication. It never bulk publishes the old library and never keeps
both layouts as aliases.
<!-- /kai:allow-legacy-roots -->

## Seeing what needs you

`work-status` reads authoritative item records and prints only exceptions:

```bash
node scripts/work-status.mjs --root .
node scripts/work-status.mjs --root . --json
```

| Section | Meaning |
|---|---|
| **NEEDS YOU** | An open `@operator` question or a human-only deployment state. |
| **INTEGRITY** | Contradictory records, stale review binding, missing dependency, or unreadable state. |
| **BLOCKED** | Declared blocked work or an unmet typed dependency. |
| **UNKNOWN** | Expired lease, missing next actor, unresolved question packet, or missed self-declared activity deadline. |

The report distinguishes `declared` facts from conditions the tool derived. It
does not claim an agent crashed merely because it stopped reporting.

## Declared activity

Agents append start, progress, and stop events to the gitignored activity log:

```bash
RUN=$(node scripts/activity.mjs new-run)
node scripts/activity.mjs start --root . --role principal-swe-backend \
  --task engineering:task:export-audit --run "$RUN" --for 45m
node scripts/activity.mjs stop --root . --role principal-swe-backend \
  --run "$RUN" --outcome handoff
```

The deadline makes one fact checkable: the role declared it would report by a
time, and that time passed. The log cannot prove why.

## Observing subagents

The opt-in observer records actual host subagent start and stop events in
`.kai/core/runtime/observed.jsonl`. It is designed to answer who participated,
who finished, and when work returned to a parent.

```bash
npm run observe:status
npm run observe:enable
node scripts/observe-subagent.mjs --disable
```

The hook ships with `kai-core` but remains inert until the workspace consent
marker exists. It does not block, rewrite, or delay a subagent response.

Start the terminal viewer with:

```bash
npm run observe:watch
```

The viewer merges two evidence tiers:

- **declared** Kai-role activity from `.kai/core/runtime/activity.jsonl`;
- **observed** host subagent lifecycle events from
  `.kai/core/runtime/observed.jsonl`.

It labels ambiguity instead of inventing identity. A host subagent is not
automatically assumed to be a specific Kai role.

Response summaries are a separate opt-in because host responses may contain
sensitive prose. Participation-only observation is the default.

## Limits

- Operational state does not run itself; roles must update it, and nothing in
  the runtime dispatches a role automatically.
- Coordinated multi-role execution is designed and source-routed, not measured:
  the one native probe that has been run used a synthetic human-approval
  fixture.
- External registry discovery is machine-local, not synchronized.
- `repo-local` state does not survive a clone.
- Publication does not make an asset current unless lifecycle metadata says it
  is accepted and valid.
- No mode permits secrets, raw browser state, or private personal content in
  project publication.

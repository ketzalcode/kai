[kai](../README.md) / [Docs](README.md) / Workspace model

# Workspace model

Kai schema 3 separates private operational state from intentionally published
project knowledge.

```text
project repository                         Kai workspace
------------------                         -------------
docs/kai/                                  .kai/
  decisions/                                 manifest.json
  specs/                                     state/
  reports/                                   runs/
                                              review/
                                              archive/
                                              personal/
```

`docs/kai` is the default publication root, not a required name. A project may
use an existing documentation root instead. Kai creates only the configured
root.

## Private workspace

```text
<workspace-root>/.kai/
├─ manifest.json
├─ CONVENTIONS.md
├─ state/
│  ├─ ACTIVE.md
│  ├─ BOARD.md
│  ├─ backlog.md
│  ├─ items/<item-id>.md
│  ├─ threads/<item-id>.md
│  └─ initiatives/
│     ├─ INDEX.md
│     └─ <slug>/
│        ├─ northstar.md
│        ├─ log.md
│        ├─ backlog.md
│        ├─ deliverables.md
│        ├─ director-summary.md
│        └─ artifacts/
├─ runs/
├─ review/
├─ archive/
└─ personal/
```

- `.kai/state/` is authoritative coordination and initiative state.
- `.kai/runs/` contains raw evidence and scratch output.
- `.kai/review/` contains review-ready drafts such as
  `designs/<item-id>/options.html`.
- `.kai/archive/` contains closed operational history.
- `.kai/personal/` contains operator-private assistant, identity, consultation,
  proactive, and learning state.

Activity and observer files also stay private:

```text
.kai/activity.jsonl
.kai/observed.jsonl
.kai/observer-consent
```

## Storage modes

| Mode | Workspace location | Repository behavior |
|---|---|---|
| `external` | Durable directory outside the project | Zero operational Kai footprint; a machine-local registry pairs project and workspace. |
| `repo-local` | Project `.kai/` | Entire tree is ignored and untracked. |
| `shared` | Project `.kai/` | Manifest, conventions, and state may be tracked; private runtime lanes remain ignored. |

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
.kai/state/initiatives/export/artifacts/decisions/export-api.md
.kai/review/designs/export-ui/options.html
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
5. the initiative leaves `.kai/state/ACTIVE.md`;
6. it remains discoverable in `.kai/state/initiatives/INDEX.md`;
7. its operational record may move to `.kai/archive/initiatives/<slug>/`.

Published project documents do not move when the private initiative record is
archived.

## Schema-2 migration

<!-- kai:allow-legacy-roots -->
Schema 2 used a visible `kai/coordination/`, `kai/initiatives/`,
`kai/library/`, and `kai/personal/` corpus. Migration first chooses a storage
mode and publication root, then classifies content:

- coordination moves to `.kai/state/`;
- initiative working records move to `.kai/state/initiatives/`;
- personal state moves to `.kai/personal/`;
- raw evidence moves to `.kai/runs/`;
- review drafts move to `.kai/review/`;
- only accepted current knowledge publishes;
- closed operational history may archive.

The migration never bulk publishes the old library and never keeps both
layouts. `schema_version: 3` is written last.
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
  --item export-audit --run "$RUN" --for 45m
node scripts/activity.mjs stop --root . --role principal-swe-backend \
  --run "$RUN" --outcome handoff
```

The deadline makes one fact checkable: the role declared it would report by a
time, and that time passed. The log cannot prove why.

## Observing subagents

The opt-in observer records actual host subagent start and stop events in
`.kai/observed.jsonl`. It is designed to answer who participated, who finished,
and when work returned to a parent.

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

- **declared** Kai-role activity from `.kai/activity.jsonl`;
- **observed** host subagent lifecycle events from `.kai/observed.jsonl`.

It labels ambiguity instead of inventing identity. A host subagent is not
automatically assumed to be a specific Kai role.

Response summaries are a separate opt-in because host responses may contain
sensitive prose. Participation-only observation is the default.

## Limits

- Operational state does not run itself; roles must update it.
- External registry discovery is machine-local, not synchronized.
- `repo-local` state does not survive a clone.
- `shared` mode exposes operational state to repository collaborators.
- Publication does not make an asset current unless lifecycle metadata says it
  is accepted and valid.
- No mode permits secrets, raw browser state, or private personal content in
  project publication.

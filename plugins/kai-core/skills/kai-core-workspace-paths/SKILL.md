---
name: kai-core-workspace-paths
description: "Defines workspace resolution, the private .kai layout, publication, storage modes, and the artifact path convention. Use when resolving a root or choosing an artifact path."
tools: [execute, read, search]
---

# Workspace paths

This skill is the source of truth for where Kai resolves roots and places
files. It defines workspace resolution, the private `.kai/` layout, project
publication, storage modes, the run grammar, the agent checklist, and the
artifact path convention.

**Never invent an output path.** Resolve the workspace and target project
before reading coordination state, dispatching work, or writing an artifact.

## Resolution

Resolve one absolute `<workspace-root>` in this order:

1. an explicit workspace root in the work packet;
2. `KAI_WORKSPACE_ROOT`;
3. an in-tree `.kai/manifest.json`, searching upward only from ambient `cwd`;
4. the machine-local `$KAI_HOME/workspaces.json` registry;
5. refusal with a clear reason.

Explicit and environment roots are exact. Never search upward from them.
`KAI_HOME` defaults to the user's `~/.kai`. Session-state, temp directories,
and an incidental agent cwd are never durable workspace roots.

An external registry row is valid only when:

- `project_root` and `workspace_root` are absolute;
- one project has exactly one matching row;
- the external manifest binds that project;
- the registry and manifest carry the same `workspace_id`.

Any mismatch stops resolution. Never guess between duplicate or stale rows.

The bootstrap sentinel is always:

```text
<workspace-root>/.kai/manifest.json
```

## Private workspace

```text
<workspace-root>/
└─ .kai/
   ├─ manifest.json
   ├─ CONVENTIONS.md
   ├─ state/
   │  ├─ ACTIVE.md
   │  ├─ BOARD.md
   │  ├─ backlog.md
   │  ├─ items/
   │  ├─ threads/
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

The lanes have one purpose each:

| Lane | Purpose |
|---|---|
| `.kai/state/` | Authoritative work items, threads, backlog, initiatives, and derived board views. |
| `.kai/runs/` | Raw evidence, browser output, scratch, and regenerable run artifacts. |
| `.kai/review/` | Review-ready drafts and choices that are not accepted project authority. |
| `.kai/archive/` | Closed operational history removed from active state. |
| `.kai/personal/` | Operator-private agenda, identity, consultation, proactive, and learning state. |

Observer and activity files are private runtime state beside those lanes:

```text
.kai/activity.jsonl
.kai/activity.jsonl.1
.kai/observed.jsonl
.kai/observed.jsonl.1
.kai/observer-consent
```

They are never trackable, including in `shared` mode.

Every fixed `.kai/` path must resolve physically below the workspace root.
Private lanes may not contain symbolic links, junctions, or nested Git
repositories; those can redirect writes or track private evidence outside the
workspace's declared Git policy.

## Project publication

Every manifest binds at least one project:

```json
{
  "id": "api",
  "path": ".",
  "publication_root": "docs/kai"
}
```

`path` is `.` only when the workspace is inside that project. External
workspaces use an absolute project path. `publication_root` is project-relative,
must stay inside the project, and must not be below `.kai/`.

The default public shape is:

```text
<project-root>/<publication-root>/
├─ README.md
├─ decisions/
├─ specs/
└─ reports/
```

An existing project-native documentation root may replace `docs/kai`. Create
only the configured root. Provider plugins may define explicit extensions such
as `content/` or `learning/`; they do not create a second Kai publication root.

Publication is deliberate. Private coordination, drafts, evidence, personal
state, and unaccepted findings never move there automatically. Accepted current
knowledge may publish after its completion authority approves the exact
revision.

Private artifact targets are workspace-relative:

```text
.kai/state/initiatives/export/artifacts/decisions/export-api.md
.kai/review/designs/export-ui/options.html
```

Public artifact targets use the project-qualified form:

```text
project:api:docs/kai/decisions/export-api.md
project:web:docs/kai/specs/export-ui.md
```

The path after the second colon is relative to the selected project root.
Never record a machine-absolute project path in a work item.

## Storage modes

| `storage_mode` | Workspace location | Git contract |
|---|---|---|
| `external` | Durable directory outside the project | Project may have zero Kai files; registry pairing is required. |
| `repo-local` | Project `.kai/` | The entire `/.kai/` tree is ignored and untracked. |
| `shared` | Project `.kai/` | Manifest, conventions, and `.kai/state/` may be tracked; private runtime lanes remain ignored. |

`external` is the zero-footprint default when the operator does not want Kai
state in the project. `repo-local` trades portability for simple local
discovery. `shared` is an explicit decision to collaborate through operational
state.

Publication is independent of storage mode. Any mode may publish accepted
knowledge to the target project's configured publication root.

## Run grammar

`<working-root>` is the resolved `<workspace-root>/.kai/runs` directory. It is
an alias used by run-producing agents, never a separate configurable root and
never the process current working directory.

Most raw runs use:

```text
.kai/runs/<area>/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/<artifact>
```

- `<NN>` is the next zero-padded index for that area and day.
- Never fill a lower gap or reuse an index.
- One role run owns one run directory.
- Credentials, tokens, cookies, and browser state never leave `.kai/runs/`.
- Browser `OUT` directories must resolve below the current run directory.

Goal-oriented `learn` and `lessons` runs replace the date with a stable goal
slug. `pulse` replaces it with an ISO week. These exceptions retain the
`<NN>-<flavor>-<descriptor>` tail.

Canonical areas are:

```text
qa eng product revenue support review ship incident ai learn lessons pulse content
```

Add an area to the manifest contract before using a new one.

## Agent checklist

1. Resolve and validate the workspace manifest.
2. Resolve the target project and its `publication_root`.
3. Read `.kai/state/ACTIVE.md`; load only matching initiatives.
4. Use `.kai/runs/` for raw evidence and `.kai/review/` for review-ready drafts.
5. Keep initiative working artifacts below `.kai/state/initiatives/<slug>/`.
6. Record private targets as workspace-relative and public targets as
   `project:<id>:<relative-path>`.
7. Publish only accepted current knowledge.
8. Keep personal state and runtime logs private.
9. Archive terminal operational history without moving published knowledge.
10. Never create an unregistered root or arbitrary backlog, report, design, or
    TODO path.

## Artifact path convention

An item's durable asset lands at:

    .kai/state/initiatives/<slug>/artifacts/<domain>/<item-id>.md

`<domain>` is declared by the producing role in its own body, not listed here.
Adding a role does not change this contract.

Three departures are real, and only these:

| Departure | Form | Why |
| --- | --- | --- |
| Bundle output | `.../artifacts/<domain>/<item-id>/` (a directory) | the deliverable is several files, not one document |
| De-identified signal | `.../artifacts/<domain>/<item-id>.md`, contents de-identified | the location carries a privacy obligation, so the producing role states it |
| Public incident report | `project:<project-id>:docs/kai/reports/incidents/<incident-id>.md` | it publishes to a project, not the private workspace; raw evidence stays in `.kai/runs/` |

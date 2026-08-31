---
name: kai-core-workspace-conventions
description: "Defines universal workspace output routing. Use when file-producing kai agents need target roots, .kai manifest validation, or canonical artifact paths."
tools: [execute, read, search]
---

# Workspace Conventions

This skill is the source of truth for where Kai reads and writes. Domain roles
own the content they produce. This contract owns its location.

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

## Initiative artifacts

Initiative working outputs stay under:

```text
.kai/state/initiatives/<slug>/artifacts/
```

Canonical defaults:

| Artifact | Private target |
|---|---|
| Product surface map | `product-map.md` |
| Product design system | `design-system.md` |
| Marketing intelligence | `marketing/` |
| Content or creative bundle | `content/<item-id>/` |
| Customer-success signal | `customer-success/<item-id>.md` |
| Support signal | `support/<item-id>.md` |
| Customer-feedback signal | `feedback/<item-id>.md` |
| Growth or experiment brief | `growth/<item-id>.md` |
| Analytics contract or readout | `analytics/<item-id>.md` |
| Experiment certificate | `experiments/<item-id>.md` |
| Pricing brief | `pricing/<item-id>.md` |
| Sales brief | `sales/<item-id>.md` |
| Solution or POC brief | `solutions/<item-id>.md` |
| Security assessment | `security/<item-id>.md` |
| Reliability assessment | `reliability/<item-id>.md` |
| Incident record | `incidents/<item-id>.md` |
| Privacy or compliance assessment | `compliance/<item-id>.md` |
| Product brief | `briefs/<item-id>.md` |
| Research memo | `research/<item-id>.md` |
| Product design | `designs/<item-id>.md` |
| Technical documentation draft | `docs/<item-id>.md` |
| Revenue-operations brief | `revops/<item-id>.md` |
| Campaign plan | `campaigns/<item-id>.md` |
| Partnership brief | `partnerships/<item-id>.md` |
| Localization report | `localization/<item-id>.md` |
| Data-engineering design | `data-engineering/<item-id>.md` |
| Brand system | `brand/<item-id>.md` |
| Initiative decision | `decisions/<item-id>.md` |

Prepend `.kai/state/initiatives/<slug>/artifacts/` to each target. The work
item lists every exact path in `artifact_targets`.

Review-ready HTML options always use:

```text
.kai/review/designs/<item-id>/options.html
```

Screenshots and browser evidence stay in `.kai/runs/`. An accepted design spec
may publish, but `options.html` remains private review material.

Unaffiliated durable knowledge requires an explicit project and publication
target. Do not create an artificial initiative and do not fall back to a random
`TODO.md`, `reports/`, or `designs/` directory.

## Coordination and closure

Before substantial work, read `.kai/state/ACTIVE.md`. Load only initiatives
whose target matches the current project, repository, keywords, or operator
goal.

For initiative work:

1. claim `.kai/state/items/<item-id>.md`;
2. append durable questions and handoffs to
   `.kai/state/threads/<item-id>.md`;
3. write working artifacts below the initiative;
4. update `deliverables.md`;
5. apply `kai-core-asset-lifecycle` before completion.

`.kai/state/ACTIVE.md` is only the current focus pointer.
`.kai/state/initiatives/INDEX.md` is the permanent all-status catalog. A
terminal initiative leaves `ACTIVE.md` but remains indexed. Its closed
operational directory may move to:

```text
.kai/archive/initiatives/<slug>/
```

Published project artifacts do not move when the private operational record is
archived.

An expansion found inside an initiative goes to its `backlog.md`. An
unaffiliated proposal goes to `.kai/state/backlog.md`. Arbitrary backlog files
are forbidden.

## Personal state and linked workspaces

Personal state lives only under `.kai/personal/`. The standard lane includes:

```text
inbox.md
agenda.md
workspaces.md
consultations/
decisions/
proactive/
identity/
lessons/
courses/
certs/
growth/
```

`.kai/personal/workspaces.md` is an optional read-only source list for agenda
aggregation. It is distinct from `$KAI_HOME/workspaces.json`: the machine
registry resolves an external workspace for a project, while the personal list
chooses additional already-valid workspaces whose signals should appear in an
agenda. Validate every listed workspace before reading it.

Personal content is never published automatically.

## Manifest

Schema 3 uses this fixed shape:

```json
{
  "plugin": "kai-core",
  "version": "3.0.0",
  "schema_version": 3,
  "scaffolded": "<YYYY-MM-DD>",
  "workspace_id": "<stable-id>",
  "storage_mode": "<external|repo-local|shared>",
  "workspace_root": "<absolute external root or '.'>",
  "state": ".kai/state",
  "runs": ".kai/runs",
  "review": ".kai/review",
  "archive": ".kai/archive",
  "personal": ".kai/personal",
  "projects": [
    {
      "id": "<kebab-id>",
      "path": "<absolute external project path or '.'>",
      "publication_root": "docs/kai"
    }
  ],
  "areas": [
    "qa", "eng", "product", "revenue", "support", "review",
    "ship", "incident", "ai", "learn", "lessons", "pulse", "content"
  ]
}
```

Root values are contract constants. `version` records the plugin build;
`schema_version` independently controls workspace migration.

<!-- kai:allow-legacy-roots -->
Schema 3 retires schema-2 `workspace_mode`, `corpus_visibility`, `kai`,
`corpus`, `coordination`, `initiatives`, `library`, and `personal` manifest
keys. It also retires the visible schema-2 paths `kai/coordination/`,
`kai/initiatives/`, `kai/library/`, and `kai/personal/`.

Migration classifies before moving:

- coordination records move to `.kai/state/`;
- initiative working records move to `.kai/state/initiatives/`;
- personal state moves to `.kai/personal/`;
- raw evidence moves to `.kai/runs/`;
- review-ready drafts move to `.kai/review/`;
- only accepted current project knowledge moves to the selected project's
  publication root;
- closed operational history may move to `.kai/archive/`.

Never preserve both layouts. Write `schema_version: 3` last, after every move,
reference rewrite, ignore rule, and registry pairing validates.
<!-- /kai:allow-legacy-roots -->

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

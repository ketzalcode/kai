[kai](../README.md) / [Docs](README.md) / Workspaces

# Workspaces

Kai schema 5 separates private operational state from accepted project
knowledge:

```text
.kai/       private, ignored, untracked
docs/kai/   committed accepted knowledge
```

Installing a pack creates no workspace directory. Direct answers and direct
code changes create no Kai state.

## Placement

Schema 5 supports:

| Placement | Private workspace | Project behavior |
| --- | --- | --- |
| `repo-local` | `<project>/.kai/` | all of `/.kai/` is ignored and untracked |
| `external` | registered durable directory outside the project | project contains no `.kai/` |

An external workspace uses the same private tree and publishes accepted
knowledge into its bound project's configured `publication_root`.

## Manifest

```json
{
  "plugin": "kai-core",
  "version": "<plugin-version>",
  "schema_version": 5,
  "scaffolded": "<YYYY-MM-DD>",
  "workspace_id": "<stable-id>",
  "placement": "repo-local",
  "workspace_root": ".",
  "private_root": ".kai",
  "direction": "docs/kai/DIRECTION.md",
  "projects": [
    {
      "id": "<project-id>",
      "path": ".",
      "publication_root": "docs/kai"
    }
  ]
}
```

The manifest does not list installed packs or pre-create their folders.
Directory presence records actual use.

## Initial footprint

A new ready workspace creates only:

```text
.kai/manifest.json
.kai/core/runtime/coordination.sqlite
docs/kai/README.md
docs/kai/DIRECTION.md
the managed /.kai/ ignore block for repo-local placement
```

Initialization is confirmed, failure-clean, and manifest-last. It never invents
Direction or seeds empty department trees.

## Direction

Coordinated work requires one operator-owned file:

```markdown
# Vision

<enduring destination>

# Mission

<who the repository serves and why>

# Current Goal

<one observable, time-bounded Current Goal>

# Out of Scope

- <explicit exclusion>
```

There is one observable, time-bounded Current Goal. Direction contains no task
list, roadmap, generated status, or parking lot.

## Private typed work

The shared grammar is:

```text
.kai/<pack>/<type>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/<type>/<subtype>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/archive/<type>/<id>/...
.kai/<pack>/archive/<type>/<subtype>/<id>/...
```

Directories appear only on the first valid write. Unknown pack, type, subtype,
ID, lifecycle, arbitrary root, link, junction, nested Git root, alias,
collision, or path escape is a refusal.

Each shipped pack owns exactly one publication vocabulary:

| Pack | Publication contract |
| --- | --- |
| core | `kai-core-workspace-publication` |
| engineering | `engineering-workspace-publication` |
| creative | `creative-workspace-publication` |

The owning contract defines allowed types, subtypes, formats, publication
authority, and privacy. Core does not duplicate department vocabularies.

## Publication

Accepted project knowledge mirrors the validated private route under
`docs/kai/` without the lifecycle segment:

```text
.kai/engineering/documentation/architecture/auth-boundary/drafts/adr.md
  -> docs/kai/engineering/documentation/architecture/auth-boundary/adr.md
```

Publication copies one exact accepted revision and records its hash, authority,
subject version, provenance, and inputs. It never renames mutable private work.

Scratch, unaccepted drafts, private evidence, arbitrary roots, and unsafe media
destinations cannot publish. Retained private drafts and evidence move to the
typed archive path at closure.

## Coordination

SQLite at `.kai/core/runtime/coordination.sqlite` is the **only coordination
authority**.

```text
Direction Current Goal
└─ Epic
   └─ <pack> Feature
      └─ Requirement
         └─ Task
```

Use the runtime:

```text
node "<kai-plugin>/scripts/coordinate.mjs" <verb> --root "<workspace-root>"
```

`status`, `detail`, `context`, `messages`, `plan`, and `export` are read
surfaces. `plan` returns executable Tasks only and reports `automatic: false`.
Reports and exports are views, not authority.

No Markdown board, backlog, milestone, thread, Task, or hierarchy log is
authoritative or maintained in schema 5.

## Direct work

An ordinary directly authorized request:

- requires no Direction read;
- initializes no workspace;
- creates no Epic, Feature, Requirement, or Task;
- acquires no lease;
- creates no pack directory.

When direct work grows into coordinated multi-role execution, Kai presents the
proposed hierarchy and obtains named authority before creating records.

## Validate

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --root "<workspace-root>"
node "<kai-plugin>/scripts/coordinate.mjs" inspect --root "<workspace-root>"
```

For external placement, require exact registry pairing. Before every write,
resolve real paths again and refuse changed aliases, links, junctions, nested
Git roots, collisions, or escapes.

## Explicit migration

<!-- kai:schema4-history -->
Schema 3 and schema 4 may contain shared placement, `.kai/state/`,
`.kai/runs/`, `.kai/review/`, `.kai/personal/`, initiatives, generic items,
boards, backlogs, milestones, and threads. Schema 2 may also use visible
`kai/coordination/`, `kai/initiatives/`, `kai/library/`, and `kai/personal/`
roots. These are historical sources, not live destinations.
<!-- /kai:schema4-history -->

Older workspaces remain inspectable and read-only. They require an **explicit
schema-5 migration**. Migration is offline, backup-first, ownership-classified,
and manifest-last:

1. inspect the old manifest, database, authored files, Git state, registry, and
   publication tree;
2. produce the complete hierarchy and artifact classification worksheet;
3. obtain operator Direction and approval;
4. verify a durable backup outside the live workspace;
5. reconcile tracked private files and active leases;
6. stage typed records and pack-owned artifact paths;
7. reject unknown ownership instead of creating a fallback lane;
8. validate hierarchy, privacy, paths, provenance, and read views;
9. move the database to `.kai/core/runtime/coordination.sqlite`;
10. activate the schema-5 manifest last.

Failure leaves the older workspace authoritative and the verified backup
available. There are no aliases or dual writes.

The measured runtime acceptance record is
[Coordination acceptance](reference/coordination-acceptance.md).

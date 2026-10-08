[kai](../../../README.md) / [Docs](../../README.md) / Specs / Composable workspace

# A composable workspace for core, engineering, and creative

**Status:** design approved in conversation 2026-10-02. Not implemented.
**Supersedes:** the workspace layout portion of
[`workspace-schema-3.md`](../../kai/decisions/workspace-schema-3.md).
**Depends on:** a follow-up design for the goal/epic/feature/requirement/task
coordination model before schema 5 can activate.

## Summary

Kai will keep two roots because they have different audiences, not because one
is a generic place for temporary files:

- `.kai/` is always private operational state. It is either ignored inside the
  project or stored in a registered external workspace. It is never shared
  through Git.
- `docs/kai/` is committed, accepted project knowledge. It is the managed
  publication root for Kai.

Both roots use the same pack namespaces: `core`, `engineering`, and `creative`.
A pack owns one publication skill that defines its allowed artifact types and
maps private work to accepted publication. Directories appear on first write.
Core does not enumerate department folders, and no generic `runs/`, `review/`,
`artifacts/`, `misc/`, or fallback lane exists.

Every coordinated workspace also carries one operator-owned
`docs/kai/DIRECTION.md` with three current facts: Vision, Mission, and Current
Goal. All coordinated roles read it before taking or proposing work. Ordinary
direct requests do not require a workspace.

This design does not introduce a project-management plugin. Core owns neutral
coordination and communication. A separate design will replace the current
initiative model with Goal → Epic → Pack Feature → Requirement → Task and will
define authority, aggregation, and closure. A future product or
project-management pack may author or prioritize those records without owning
their storage model.

## Why the current workspace must change

The current schema-4 workspace has a sound private/public boundary, but its
scaffold and vocabulary still reflect the former eight-package product.

### Core scaffolds capabilities it does not ship

`kai-core-workspace-onboarding` creates `.kai/personal/` with identity, career,
lessons, courses, certificates, and growth lanes. Assistant and learning are
incubated, not shipped. The schema-4 manifest also requires thirteen run areas,
including product, revenue, support, learn, lessons, and content.

The initiative workflow goes further: every new initiative lists or creates a
matrix of marketing, customer-success, support, growth, analytics, pricing,
sales, campaigns, partnerships, localization, brand, and other directories.
Most belong to incubated packages. Their presence makes core the owner of every
possible future capability.

### Generic operational lanes became buckets

`.kai/runs/` is described as raw evidence, browser output, scratch, and
reproducible artifacts. `.kai/review/` accepts review-ready drafts. Those broad
categories do not answer which pack owns a file, which work it supports, or why
it should remain. In practice, an agent that cannot decide where output belongs
can put it in one of those roots without resolving placement.

The replacement requires three dimensions in every private work path:

1. owning pack;
2. declared artifact type;
3. stable work or artifact ID.

Lifecycle is a fourth, terminal segment: `drafts`, `evidence`, or `scratch`.
There is no untyped fallback.

### Schema 4 duplicates or retains obsolete Markdown state

The SQLite database is authoritative, but onboarding still requires
`BOARD.md`, `items/`, and `threads/`, which are retained schema-3 import
sources. Current prose also disagrees about whether initiative initialization
creates item/thread Markdown. A new workspace should not scaffold historical
import sources or derived views beside the authority that replaced them.

### Department packs do not currently require fixed folders

Engineering normally changes repository-native code, tests, configuration, and
documentation. Creative normally uses explicit requested destinations.
Neither shipped pack currently requires a persistent top-level department
directory. Pack namespaces in this design therefore organize private work and
accepted publications only when those outputs actually exist. Installation
alone creates no department path.

### Lazy materialization is established behavior

Kai already corrected eager scaffolding once. The schema-2 spine stopped
creating every run area and library type because empty directories did not
survive Git and falsely implied capabilities were in use. Superpowers follows
the same model: its brainstorming and planning skills create their owned
`docs/superpowers/...` paths only when producing those documents.

The problem was not lazy creation. The problem was that Kai's lazy destinations
were broad shared buckets rather than pack-owned typed paths.

## Goals

1. Core initializes only universal communication, coordination, safety, and
   alignment state.
2. Installed but unused packs create no workspace directories.
3. Every private and public artifact has one visible pack owner and declared
   type.
4. Private and public paths mirror one another where possible.
5. An agent cannot use a generic fallback when placement is unknown.
6. Direct coding and direct answers remain workspace-free.
7. The project vision, mission, and current goal are small, explicit, and read
   before coordinated decisions.
8. Existing schema-3 and schema-4 workspaces remain inspectable and migrate
   only through an explicit, backup-first operation.

## Non-goals

- Designing the Goal → Epic → Feature → Requirement → Task record model. That
  is the next specification.
- Adding a fourth `direction`, `leadership`, or project-management plugin.
- Moving source code, tests, ordinary repository documentation, or build
  output under Kai.
- Making every creative binary suitable for Git. A publication record may
  reference an explicitly approved project destination or external durable
  object when committing the binary is inappropriate.
- Automatically reorganizing published files and breaking links.
- Preserving `shared` mode or supporting dual writes to old and new layouts.
- Creating aliases for retired paths.

## Target architecture

The tree below is a vocabulary. Except for the files listed under
**Initialization**, a directory exists only after its first valid write.

```text
project/
├─ .gitignore
├─ .kai/                                      # always private
│  ├─ manifest.json
│  ├─ core/
│  │  ├─ runtime/
│  │  │  ├─ coordination.sqlite
│  │  │  ├─ host/                            # capabilities/reservations
│  │  │  ├─ activity.jsonl                   # when enabled
│  │  │  └─ observed.jsonl                   # when enabled
│  │  ├─ direction/<id>/
│  │  │  ├─ drafts/
│  │  │  ├─ evidence/
│  │  │  └─ scratch/
│  │  ├─ decisions/<id>/{drafts,evidence,scratch}/
│  │  ├─ reports/<id>/{drafts,evidence,scratch}/
│  │  └─ archive/<type>/<id>/...
│  ├─ engineering/
│  │  ├─ features/<id>/{drafts,evidence,scratch}/
│  │  ├─ documentation/<subtype>/<id>/{drafts,evidence,scratch}/
│  │  ├─ decisions/<id>/{drafts,evidence,scratch}/
│  │  ├─ reports/<subtype>/<id>/{drafts,evidence,scratch}/
│  │  └─ archive/<type>/<id>/...
│  └─ creative/
│     ├─ features/<id>/{drafts,evidence,scratch}/
│     ├─ documentation/<subtype>/<id>/{drafts,evidence,scratch}/
│     ├─ decisions/<id>/{drafts,evidence,scratch}/
│     ├─ reports/<subtype>/<id>/{drafts,evidence,scratch}/
│     ├─ media/<id>/{drafts,evidence,scratch}/
│     └─ archive/<type>/<id>/...
│
└─ docs/kai/                                  # committed, accepted knowledge
   ├─ README.md
   ├─ DIRECTION.md
   ├─ core/
   │  ├─ decisions/<id>/...
   │  └─ reports/<id>/...
   ├─ engineering/
   │  ├─ features/<id>/...
   │  ├─ documentation/<subtype>/<id>/...
   │  ├─ decisions/<id>/...
   │  └─ reports/<subtype>/<id>/...
   └─ creative/
      ├─ features/<id>/...
      ├─ documentation/<subtype>/<id>/...
      ├─ decisions/<id>/...
      ├─ reports/<subtype>/<id>/...
      └─ media/<id>/...
```

The braced lifecycle notation is illustrative; directories are not created in
bulk. A private artifact may need only `drafts/`, only `evidence/`, or both.
`scratch/` is disposable and can never be a publication source.

## Initialization

A ready new workspace's eager footprint is limited to:

```text
.kai/manifest.json
.kai/core/runtime/coordination.sqlite
docs/kai/README.md
docs/kai/DIRECTION.md
the managed .gitignore block
```

The coordination database retains its explicit authorized initialization gate.
If that host gate cannot run, the workspace remains inspect-only; onboarding
does not manufacture a database.

`DIRECTION.md` is created only from operator-supplied content. Coordinated work
is not ready until its three sections are non-empty. Initialization never
invents project direction.

No empty `core/decisions`, `engineering`, `creative`, `archive`, lifecycle, or
subtype directory is part of the initial footprint.

## Private workspace policy

Schema 5 supports two private placements:

| Placement | Operational workspace | Project behavior |
| --- | --- | --- |
| `repo-local` | project `.kai/` | all of `/.kai/` is ignored and untracked |
| `external` | durable directory outside the project | project contains no `.kai/`; the machine registry binds project and workspace |

The current `shared` mode is removed. SQLite sidecars, capability records,
drafts, evidence, scratch, observation logs, and potentially sensitive
material do not belong in Git. Accepted collaboration happens through
`docs/kai/`; runtime coordination is private.

An external workspace uses the same `.kai/<pack>/...` shape below its external
workspace root. Its accepted publication still lands in the bound project's
`docs/kai/`.

## Direction contract

`docs/kai/DIRECTION.md` is a small alignment document, not a strategy archive:

```markdown
---
owner: operator
updated: <YYYY-MM-DD>
---

# Vision

<the enduring destination>

# Mission

<who the repository serves and why it exists>

# Current Goal

<the present time-bounded focus>
```

Git carries revision history. The file contains no task list, roadmap, backlog,
or generated status. Those concerns belong to coordination records.

The manifest records:

```json
{
  "direction": "docs/kai/DIRECTION.md"
}
```

Before a coordinated claim, decomposition, recommendation, or scope-expanding
proposal, the role reads the exact current file. The coordination runtime may
later bind work to a direction revision as part of the follow-up hierarchy
design; this specification does not invent that record shape.

Direct requests do not require `DIRECTION.md`, a manifest, or a coordination
database. A missing direction blocks coordinated work, not ordinary assistance.

## Pack-owned publication skills

Core defines the interface but not department vocabularies. Each shipped pack owns one publication skill:

```text
kai-core        owns kai-core-workspace-publication
kai-engineering owns engineering-workspace-publication
kai-creative    owns creative-workspace-publication
```

Each skill has one canonical table declaring:

| Field | Meaning |
| --- | --- |
| namespace | `core`, `engineering`, or `creative` |
| type | allowed first path segment |
| subtype | optional constrained second segment |
| private form | exact `.kai/<pack>/...` grammar |
| public form | exact `docs/kai/<pack>/...` grammar |
| allowed formats | file or bundle forms the type supports |
| publication rule | authority and acceptance required |
| privacy rule | evidence that must not publish |

The table is the only pack-specific path source. Producer agents do not repeat
directory lists or creation procedures. A producer that can create a durable
Kai artifact routes its own pack publication skill immediately before
`kai-core-asset-producing`. Validation enforces that route. This is one route
per relevant producer, not copied path logic.

Core never routes a department skill. The department agent already owns and
loads its local publication contract, preserving the rule that core does not
depend on departments.

### Initial core vocabulary

| Type | Purpose |
| --- | --- |
| `direction` | private drafts/evidence for the root `DIRECTION.md` |
| `decisions` | accepted cross-pack coordination or operating decisions |
| `reports` | accepted cross-pack summaries and coordination reports |

Core has no `initiatives/` publication type. The follow-up hierarchy design
will decide whether accepted epic records need a public representation.

### Initial engineering vocabulary

| Type | Purpose |
| --- | --- |
| `features` | accepted feature-level engineering knowledge |
| `documentation` | durable engineering documentation |
| `decisions` | accepted engineering decisions |
| `reports` | accepted engineering findings or delivery summaries |

Architecture is a `documentation/architecture` subtype. Investigations and
releases are report subtypes. Reviews remain private evidence unless an
authority explicitly accepts one as a report. Incidents are not an initial
type: no agent may decide unilaterally that work is an incident and thereby
create a new publication lane.

Implementation, tests, configuration, migrations, and normal product
documentation stay at repository-native paths. A direct code change does not
create `.kai/engineering/`.

### Initial creative vocabulary

| Type | Purpose |
| --- | --- |
| `features` | accepted feature-level design knowledge and decisions |
| `documentation` | durable creative systems and guidance |
| `decisions` | accepted creative decisions |
| `reports` | accepted creative findings or production summaries |
| `media` | accepted media deliverables or durable publication records |

Feature designs live under the feature they serve. Shared design-system or
brand guidance is documentation. `media` is the one initial creative-only
extension because current creative workflows can produce video and related
assets.

A media publication skill must distinguish a Git-suitable deliverable from a
record that references an explicitly approved durable destination. Large or
sensitive binaries are never committed merely because the type exists.

## Mirrored path and lifecycle

For ordinary artifact types, the public path is the private path with the
private root, lifecycle segment, and non-publishable files removed:

```text
.kai/engineering/documentation/architecture/auth-boundary/drafts/adr.md
  → docs/kai/engineering/documentation/architecture/auth-boundary/adr.md
```

Lifecycle:

```text
request
  → owning pack skill validates type, subtype, ID, and destination
  → private work uses drafts/, evidence/, or scratch/
  → acceptance binds one exact revision
  → publication writes the accepted revision under docs/kai/<pack>/...
  → closure deletes scratch
  → retained private drafts/evidence move to
       .kai/<pack>/archive/<type>/<id>/...
```

Publication is a copy of an accepted revision, not a rename of mutable working
state. Its record carries provenance back to the private source and accepted
hash. The public file becomes the project authority. Private evidence remains
private.

No authored work-artifact path may omit pack, type, or ID. Core runtime files
follow their fixed runtime contract instead. Unknown artifact placement is a
decision boundary: the role asks for an allowed type or returns inline. It does
not create a new directory.

## Failure behavior

The implementation must distinguish at least these refusal classes:

| Condition | Required behavior |
| --- | --- |
| no workspace for direct work | continue without Kai state |
| no workspace for coordinated work | refuse and route onboarding |
| missing/empty `DIRECTION.md` | refuse coordinated work; request operator direction |
| absent owning publication skill | return inline or refuse durable placement |
| unknown type or subtype | refuse; no fallback path |
| pack/path namespace mismatch | refuse |
| destination already owned by another artifact | refuse collision |
| unsafe path, symlink, junction, or nested Git | refuse |
| scratch selected for publication | refuse |
| revision not accepted by its authority | refuse |
| pack uninstalled after producing artifacts | preserve all data; do not mutate it |

Uninstall never deletes private or public content. Reinstall restores the
pack's validation and production capability; it is not a data migration.

## Schema 5

Schema 5 removes fixed lane keys, the canonical area list, `personal`, and
`shared` mode. A representative manifest is:

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

An external manifest uses `placement: "external"` and the existing absolute
workspace/project binding rules. The manifest does not list installed packs or
their directory trees. Installation is not activation, and the filesystem
itself plus registered artifacts records which pack outputs exist.

Schema 5 does not carry `state`, `runs`, `review`, `archive`, `personal`, or
`areas` keys. Those schema-3/4 constants are retired rather than aliased.

## Migration

Schema 3 and schema 4 remain inspectable. They are never dual-written with
schema 5.

Migration is explicit, offline, backup-first, and atomic:

1. Inspect the old manifest, database, authored files, Git tracking, registry
   binding, and publication tree.
2. Produce an exact classification plan. Every source names its destination,
   preservation action, or blocking ambiguity.
3. Require an operator-supplied `DIRECTION.md`.
4. Require a durable backup outside the live `.kai/` tree and verify it before
   changing files.
5. Move the coordination database and runtime state to `.kai/core/runtime/`.
6. Classify authored content by producing pack and allowed type. Incubated or
   unknown ownership blocks activation; it is not placed in a legacy bucket.
7. Remove schema-3 retained board/item/thread sources from the live tree only
   after the verified backup contains them and their schema-4 import is proven.
8. Convert a `shared` workspace to `repo-local` or `external`. Already tracked
   private files require an explicit untracking plan; Kai never silently runs
   `git rm --cached`, commits, or rewrites history.
9. Validate the complete schema-5 tree and privacy policy.
10. Write and atomically activate the schema-5 manifest last.

If any step fails, the schema-4 workspace remains authoritative and the backup
remains available. Recovery never guesses ownership.

Existing accepted files under old `docs/kai/decisions`, `specs`, or `reports`
remain valid at their current paths. Schema 5 forbids new writes there, but it
does not move them automatically because public links may depend on them.
Rehoming public files is a separate explicit operation with redirects or
reference updates appropriate to that repository.

The current initiative record model is not silently translated in this
specification. Schema-5 activation depends on the follow-up hierarchy design
defining how current initiatives and milestones map to epics, pack features,
requirements, and tasks. Until then, implementation may build validators and
migration planning but must not activate schema 5.

## Validation and acceptance

Validation must prove behavior, not only inspect prose.

### Pack matrix

Consumer fixtures cover:

1. core only;
2. core + engineering;
3. core + creative;
4. all three packs.

Initialization in every case creates no absent-pack directory. Installing a
department without using it creates no department directory. The first valid
artifact creates only its exact pack/type/ID/lifecycle path.

### Required scenarios

- core initialization creates only the approved initial files;
- `DIRECTION.md` is required for coordinated work and irrelevant to direct
  work;
- a direct code change produces no `.kai/engineering/`;
- one engineering artifact mirrors to one engineering publication path;
- one creative artifact mirrors to one creative publication path;
- unknown types and subtypes fail;
- attempts to write a generic run, review, artifact, misc, or arbitrary root
  fail;
- a producer without its pack publication-skill route fails validation;
- scratch cannot publish;
- unaccepted drafts cannot publish;
- private evidence remains ignored and untracked;
- uninstall does not delete content;
- schema-4 migration preserves IDs, database records, timestamps, provenance,
  authored files, and public links;
- ambiguous legacy ownership blocks activation;
- external and repo-local discovery remain deterministic;
- Windows path aliases, junctions, and POSIX/Windows absolute forms receive the
  same safety decision.

### Non-vacuous gates

Every new gate needs:

- a live-corpus assertion proving it saw at least one relevant pack, skill, or
  path;
- a mutation proving the gate fails for the defect it claims to catch;
- no silent missing-directory filtering;
- execution in the Linux and Windows runtime matrix;
- consumer-install coverage using generated packs with no repository
  `node_modules`.

## Documentation impact

Implementation updates:

- `README.md` architecture and workspace quick start;
- `docs/getting-started.md`;
- `docs/how-kai-works.md`;
- `docs/workspaces.md`;
- `docs/reference/plugin-structure.md`;
- core workspace, onboarding, artifact, work-item, and closure skills;
- shipped workspace/initiative agents;
- engineering and creative publication-producing agents;
- workspace doctor, path safety, privacy, resolution, migration, and
  coordination runtime paths;
- fixtures and consumer acceptance tests.

Historical decisions and release records remain historical. They are not
rewritten to describe schema 5.

## Follow-up design: work hierarchy and governance

The next specification must settle:

```text
DIRECTION.Current Goal
  └─ Epic                         core visibility
      ├─ Engineering Feature
      │   ├─ Requirement
      │   └─ Task
      └─ Creative Feature
          ├─ Requirement
          └─ Task
```

It must define:

- whether the hierarchy is exactly four record kinds or a generic typed tree;
- who may create, prioritize, promote, accept, close, and reopen each level;
- how pack leads aggregate requirement/task state into feature closure;
- how core aggregates pack features into epic closure;
- acceptance criteria and required-child semantics;
- cross-pack dependencies;
- how current initiatives, milestones, and items migrate;
- the operator's role and what a future product/project-management pack may
  add without becoming required.

Tasks remain authoritative runtime records, not Markdown files. Requirements
may have accepted publication artifacts, but their lifecycle and authority
belong to that follow-up design.

## Decision

Adopt the composable, mirrored workspace design.

Do not implement schema-5 activation until the follow-up work-hierarchy design
is approved. The two specifications may then share one implementation plan and
one breaking release, preventing an intermediate workspace with no coherent
replacement for initiatives.

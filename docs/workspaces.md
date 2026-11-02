[kai](../README.md) / [Docs](README.md) / Workspaces

# Workspaces

Kai supports one live workspace contract: schema 6. Current runtimes never
open an old schema. Explicit re-onboarding can reshape durable knowledge and
artifacts into current package-owned paths, but it rebuilds runtime state
instead of importing historical coordination records.

```text
.kai/       private runtime, agent memory, evidence, working material
docs/kai/   default canonical home for Git-suitable project knowledge
```

Installing a package creates no workspace. Direct work creates no Kai state.

## One knowledge document from creation

Feature knowledge, designs, decisions, documentation, and report narratives
are authored at their canonical repository path from the first edit, on a
branch. Use the repository's existing documentation home before the owning
package's default `docs/kai/` route. Do not maintain a private authoring copy
that must later be promoted or synchronized.

A confirmed decision changes that same document and its stable navigation,
even while implementation is pending. Default-branch documents state current
accepted direction unless reviewed content explicitly labels a proposal as
Proposed. Required named acceptance must precede merging content as accepted;
landing a labelled proposal does not approve it. Committing or merging does
not by itself approve scope, complete work, ship a product, or authorize
external publication.

Where Core acceptance is required, register the exact Git base/head and project
ID rather than a mutable Markdown path. Git subjects keep no private snapshot:
retain the approved branch and its ancestor base while Core records reference
them, including in the durable remote for fresh-checkout recovery. A squash or
rebase creates a different subject and does not transfer approval. Follow
`kai-core-work-acting` for retention and missing-evidence handling.

`.kai` holds A2A records, threads, runtime databases, agent memory, private
evidence, acceptance snapshots, and restricted working material. Private
execution reports are not project-knowledge authorities. A pushed branch is
visible to repository readers: never commit sensitive or licensed material
merely to make it durable. Keep it private and prepare a sanitized narrative
only when authorized. Project Management's database and Creative's binary
custody retain their existing authority.

## Manifest

```json
{
  "plugin": "kai-core",
  "version": "<plugin-version>",
  "schema_version": 6,
  "scaffolded": "<YYYY-MM-DD>",
  "workspace_id": "<stable-id>",
  "placement": "repo-local",
  "workspace_root": ".",
  "private_root": ".kai",
  "projects": [
    {
      "id": "<project-id>",
      "path": ".",
      "publication_root": "docs/kai"
    }
  ]
}
```

Placement is `repo-local` or registered `external`. Repo-local state is fully
ignored and untracked. External state lives outside the project, which contains
no `.kai/`.

## Onboarding

Core onboarding creates only:

```text
.kai/manifest.json
.kai/core/runtime/coordination.sqlite
docs/kai/README.md
the managed /.kai/ ignore block for repo-local placement
```

It does not initialize Project Management or any department tree. After
installing the optional package, initialize its runtime explicitly:

```text
node "<kai-project-management-plugin>/scripts/project.mjs" init --root "<workspace-root>"
```

That creates only `.kai/project-management/runtime/project.sqlite`.

## Runtime split

| Database | Owns |
| --- | --- |
| `.kai/core/runtime/coordination.sqlite` | Standalone Tasks and A2A execution records |
| `.kai/project-management/runtime/project.sqlite` | Optional Direction, Epic, Feature, Requirement, priority, holds, dependencies, closure, and planning views |

The databases never edit each other. Project Management can emit a Core Task
body through `handoff`; the caller submits it separately. Core treats supplied
`planning_refs` as opaque strings.

## Target-bound workspace insights

Kai separates the host session from the repository currently being changed:

```text
session root     where the host started
target root      canonical repository or project named by the request
workspace root   private Kai workspace bound to that project
project id       exact manifest binding for the target root
```

A named sibling repository or external checkout becomes the active target.
Workspace discovery starts from that target instead of ambient `cwd`. The
target's `AGENTS.md` and compact profile apply only to its exact project
binding. Multi-repository work maintains a separate binding for each project.

Explicit Engineering insight commands create private package configuration
lazily:

```text
.kai/engineering/insights/<project-id>/profile.md
.kai/engineering/insights/<project-id>/my-insights.md
.kai/engineering/insights/<project-id>/team-insights.md
```

Engineering's `my-insights` captures explicit operator corrections.
`team-insights` extracts candidates only from selected team evidence. Neither
changes active guidance. `refine-insights` reconciles candidates and requires
approval before updating the compact `profile.md`. Ordinary work performs no
reflection or source scanning. Core owns only the target/workspace/project
binding used to isolate those files.

## Typed private work

```text
.kai/<pack>/<type>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/<type>/<subtype>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/archive/<type>/<id>/...
```

These lanes are not a knowledge-promotion lifecycle. Each package's
`publication.json` owns the permitted lanes: knowledge uses private evidence
and scratch, while media and private execution outputs may also use drafts.
Non-Git deliverables retain the accepted-byte publication flow. Unknown paths,
links, junctions, nested Git roots, aliases, collisions, and escapes are
refused.

## Package navigation views

Lifecycle and grouping never change durable artifact paths. When requested,
Kai renders a read-only package view from the owning package's artifact
inventory plus an optional supplied authority projection. Project Management
status can provide versioned parent and lifecycle evidence without becoming a
dependency of Engineering or Creative.

Without a supplied lifecycle authority, the view reports `UNGROUPED` and
`LIFECYCLE UNKNOWN`. Views are not persisted, and planning completion remains
separate from artifact acceptance and publication.

## Re-onboarding unsupported workspaces

`kai-core-workspace-reonboard` performs an operator-controlled reshape:

1. inventory every old private path and preserve existing `docs/kai/`;
2. map Git-suitable knowledge to its canonical repository path on a branch,
   retaining proposals as proposals and evidence or restricted work privately;
3. move the old private root to a temporary ignored staging path;
4. initialize current Core and explicitly requested optional runtimes;
5. apply and verify every approved durable-content move or transform; and
6. remove staging after the inventory reconciles and all current checks pass.

Historical leases, activity, approvals, messages, completed coordination
events, and old runtime databases are not imported. A successful migration
leaves no compatibility or legacy-backup directory.

Existing schema-6 workspaces need no schema reset. Reshaping their old knowledge
drafts is an explicitly approved content change, not automatic onboarding.
Preserve accepted content, privacy, and immutable registered sources until
their references have been reconciled; do not delete private bytes just
because a sanitized canonical document now exists.

## Validate

```text
node "<kai-core-plugin>/scripts/workspace-doctor.mjs" --root "<workspace-root>"
node "<kai-core-plugin>/scripts/coordinate.mjs" inspect --root "<workspace-root>"
node "<kai-project-management-plugin>/scripts/project.mjs" inspect --root "<workspace-root>"
```

The final command is optional and succeeds with `storeExists: false` when
Project Management has not been initialized.

---

**Related:** [Architecture](architecture.md) ·
[Development process](development-process.md)

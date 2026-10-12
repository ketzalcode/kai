[kai](../README.md) / [Docs](README.md) / Workspaces

# Workspaces

Kai supports one workspace contract: schema 6. It reads an old schema number
only to refuse it. There is no migration or historical-record import.

```text
.kai/       private, ignored, untracked
docs/kai/   accepted, Git-suitable project knowledge
```

Installing a package creates no workspace. Direct work creates no Kai state.

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

## Typed private work

```text
.kai/<pack>/<type>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/<type>/<subtype>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/archive/<type>/<id>/...
```

Each package's `publication.json` owns allowed vocabulary. Unknown paths,
links, junctions, nested Git roots, aliases, collisions, and escapes are
refused.

## Re-onboarding unsupported workspaces

`kai-core-workspace-reonboard` performs an operator-controlled reset:

1. preserve accepted `docs/kai/`;
2. rename `.kai/` to an ignored timestamped `.kai-retired-*` backup;
3. initialize a clean schema-6 workspace; and
4. initialize optional runtimes again only when requested.

No Core or Project Management record is imported.

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

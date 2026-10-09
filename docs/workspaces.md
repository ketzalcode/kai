[kai](../README.md) / [Docs](README.md) / Workspaces

# Workspaces

Kai supports only the current workspace contract: schema 5. It may read an old
manifest's schema number to reject it, but it does not decode, migrate, repair,
or write historical records.

```text
.kai/       private, ignored, untracked
docs/kai/   accepted, Git-suitable project knowledge
```

Installing a package creates no workspace. Direct answers and ordinary code
changes create no Kai state.

## Placement and manifest

| Placement | Private workspace | Project behavior |
| --- | --- | --- |
| `repo-local` | `<project>\.kai\` | all of `\.kai\` is ignored and untracked |
| `external` | registered durable directory outside the project | the project contains no `.kai/` |

Both modes publish accepted knowledge into the bound project's configured
`publication_root`.

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

The manifest does not list installed packages or pre-create their folders.
Directory presence records actual use.

## Onboarding

`workflow-workspace-init` creates only:

```text
.kai/manifest.json
.kai/core/runtime/coordination.sqlite
docs/kai/README.md
docs/kai/DIRECTION.md
the managed /.kai/ ignore block for repo-local placement
```

Initialization is explicit, failure-clean, and manifest-last. It asks before
installing the canonical repository-instruction block. If the project has no
`AGENTS.md`, onboarding creates it. If it exists, onboarding replaces only the
marked Kai region and preserves every other byte. It never stages or commits
the file without separate operator authorization.

Direction is operator-owned and contains Vision, Mission, one observable and
time-bounded Current Goal, and Out of Scope. Onboarding never invents it.

## Re-onboarding unsupported workspaces

An unsupported manifest or database stops current runtime operations with
guidance to invoke `kai-core-workspace-reonboard`. Re-onboarding is an
operator-controlled reset, not a converter:

1. confirm the project root and explicit reset intent;
2. preserve `docs/kai/`, including Direction and accepted publications;
3. ensure retired private backups are ignored;
4. rename `.kai/` to an ignored timestamped `.kai-retired-*` backup;
5. verify the backup is outside the new workspace and contains no tracked
   files;
6. reconcile installed packages when package state is uncertain;
7. run current onboarding; and
8. create current private paths lazily as coordinated work needs them.

No record is imported from a retired database. The operator decides when to
delete the retained backup.

## Typed private work

```text
.kai/<pack>/<type>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/<type>/<subtype>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/archive/<type>/<id>/...
.kai/<pack>/archive/<type>/<subtype>/<id>/...
```

The package's `publication.json` owns allowed types, subtypes, formats,
authority, and privacy. Directories appear only on the first valid write.
Unknown packages, types, subtypes, IDs, lifecycle names, arbitrary roots,
links, junctions, nested Git roots, aliases, collisions, and path escapes are
refused.

## Publication and asset lifecycle

Accepted knowledge mirrors the validated private route without the lifecycle
segment:

```text
.kai/engineering/documentation/architecture/auth-boundary/drafts/adr.md
  -> docs/kai/engineering/documentation/architecture/auth-boundary/adr.md
```

Publication copies one exact accepted revision and records its hash, authority,
subject version, provenance, and inputs. Scratch, unaccepted drafts, private
evidence, arbitrary roots, and unsafe media destinations cannot publish.

Execution, disposition, validity, and closure are independent. Finishing a Task
does not freeze an asset's later validity. Current maintained assets name an
owner and revalidation trigger; a stale or superseded asset is replaced through
new authorized work. Parent closure checks required child states and required
asset disposition and validity, never a Markdown board or backlog.

## Coordination

`.kai/core/runtime/coordination.sqlite` is the only coordination authority:

```text
Direction Current Goal
`-- Epic
    `-- <pack> Feature
        `-- Requirement
            `-- Task
```

Use the generated runtime:

```text
node "<kai-plugin>/scripts/coordinate.mjs" <verb> --root "<workspace-root>"
```

Read surfaces such as `status`, `detail`, `context`, `messages`, `plan`, and
`export` do not create authority. `plan` returns executable Tasks only and
reports `automatic: false`.

## Validate

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --root "<workspace-root>"
node "<kai-plugin>/scripts/coordinate.mjs" inspect --root "<workspace-root>"
```

External placement requires exact registry pairing. Every write re-resolves
real paths and refuses changed aliases, links, junctions, nested Git roots,
collisions, or escapes.

---

**Related:** [Architecture](architecture.md) ·
[Development process](development-process.md)

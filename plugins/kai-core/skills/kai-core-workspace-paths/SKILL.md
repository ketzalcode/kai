---
name: kai-core-workspace-paths
description: "Use when resolving a Kai workspace, project binding, coordination database, typed private/public artifact path, or caller-composed package navigation view."
tools: [read, execute, search]
---

# Workspace paths

Schema 6 has one private operational root and one project publication root:

```text
.kai/       private, ignored, untracked
docs/kai/   committed accepted knowledge
```

Directories appear only on the first valid write. Installing a pack creates no
pack directory.

## Target binding

Keep four identities distinct:

```text
session root     where the host session started
target root      canonical repository or project the current request names
workspace root   private Kai workspace bound to that project
project id       exact manifest binding for the target root
```

The session root is not durable ownership. When the operator names a sibling
repository, external checkout, or other project path, resolve that target
before workspace discovery and use the target path instead of ambient `cwd`.
Validate exactly one manifest project whose canonical path matches the target,
then keep the target root, workspace root, and project ID together for the
current task. Rebind when the target changes. Multi-repository work carries one
binding per repository; never apply one target's instructions or private
context to another.

## Resolution

Resolve the workspace before any coordinated read or write.

1. Starting from the resolved target root, discover `.kai/manifest.json` for
   `repo-local` placement or use that project's registered external workspace
   binding.
2. Validate exact native paths, project identity, workspace identity, case,
   links, junctions, nested Git roots, and publication-root containment.
3. Resolve the configured project ID and its `publication_root`.
4. Treat `.kai/core/runtime/coordination.sqlite` as the only Core coordination
   authority.

Direct assistance needs no workspace, manifest, or database.
Coordinated work refuses an absent or invalid workspace and routes explicit
onboarding.
An unsupported manifest routes to `kai-core-workspace-reonboard`; it is never
opened through a historical compatibility path.

## Manifest

Schema 6 uses only `repo-local` or registered `external` placement:

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

The manifest does not list installed packs or pre-create their trees. For
external placement, `workspace_root` and project paths are exact registered
absolute paths; the project itself contains no `.kai/`.

## Typed artifact grammar

Every durable private artifact path includes its owning pack, allowed type,
stable ID, and active lifecycle:

```text
.kai/<pack>/<type>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/<type>/<subtype>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/archive/<type>/<id>/...
.kai/<pack>/archive/<type>/<subtype>/<id>/...
```

Accepted publication mirrors the validated pack/type/subtype/ID route under
the configured project:

```text
docs/kai/<pack>/<type>/<id>/...
docs/kai/<pack>/<type>/<subtype>/<id>/...
```

The owning pack publication skill is the only source for allowed types,
subtypes, formats, publication rules, and privacy rules. Core path grammar does not duplicate Project Management, Engineering, or
Creative vocabularies.

Refuse an unknown pack, type, subtype, ID, lifecycle, arbitrary root, path
escape, link, junction, case alias, nested Git root, collision, or destination
outside the configured project. Path derivation never creates directories.

## On-demand package navigation

When the operator asks to navigate package artifacts by lifecycle or group,
read [package workspace navigation](references/package-workspace-navigation.md).
It defines one caller-composed, read-only view shape. The owning package
supplies artifact inventory; an optional planning or other authority projection
may supply lifecycle and grouping. Core does not call an optional package,
persist an index, or infer missing state.

## Privacy

For `repo-local`, the managed Git block ignores all of `/.kai/`; verify it is
untracked before the first write. For `external`, the registered workspace is
outside the project and the project contains no `.kai/`.

Drafts, evidence, scratch, runtime state, host capabilities, activity, and
observation data never enter Git. Accepted collaboration happens through the
configured `docs/kai/` publication root.

## Unsupported manifests

Only schema 6 is supported. Refuse every other manifest with
`SCHEMA_MISMATCH` and route to `kai-core-workspace-reonboard`. Re-onboarding
preserves existing `docs/kai/`, migrates durable knowledge and artifacts into
current package-owned routes, rebuilds current runtime state, and removes its
temporary staging path after verified reconciliation. Historical coordination
records are not imported.

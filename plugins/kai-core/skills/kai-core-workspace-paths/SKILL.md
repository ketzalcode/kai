---
name: kai-core-workspace-paths
description: "Use when resolving a Kai workspace, project binding, Direction file, coordination database, or typed private/public artifact path."
tools: [read, execute, search]
---

# Workspace paths

Schema 5 has one private operational root and one project publication root:

```text
.kai/       private, ignored, untracked
docs/kai/   committed accepted knowledge
```

Directories appear only on the first valid write. Installing a pack creates no
pack directory.

## Resolution

Resolve the workspace before any coordinated read or write.

1. Discover `.kai/manifest.json` for `repo-local` placement or use the
   registered external workspace binding.
2. Validate exact native paths, project identity, workspace identity, case,
   links, junctions, nested Git roots, and publication-root containment.
3. Resolve the configured project and its `publication_root`.
4. Read Direction from the configured project.
5. Treat `.kai/core/runtime/coordination.sqlite` as the only coordination
   authority.

Direct assistance needs no workspace, manifest, Direction, or database.
Coordinated work refuses an absent or invalid workspace and routes explicit
onboarding.
An unsupported manifest routes to `kai-core-workspace-reonboard`; it is never
opened through a historical compatibility path.

## Manifest

Schema 5 uses only `repo-local` or registered `external` placement:

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

The manifest does not list installed packs or pre-create their trees. For
external placement, `workspace_root` and project paths are exact registered
absolute paths; the project itself contains no `.kai/`.

## Direction

`docs/kai/DIRECTION.md` is required for coordinated work and has exactly these
non-empty sections:

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

There is one observable, time-bounded Current Goal. Direction contains no
roadmap, task list, generated status, or parking lot. Git carries its revision
history.

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
subtypes, formats, publication rules, and privacy rules. Core path grammar does
not duplicate Engineering or Creative vocabularies.

Refuse an unknown pack, type, subtype, ID, lifecycle, arbitrary root, path
escape, link, junction, case alias, nested Git root, collision, or destination
outside the configured project. Path derivation never creates directories.

## Privacy

For `repo-local`, the managed Git block ignores all of `/.kai/`; verify it is
untracked before the first write. For `external`, the registered workspace is
outside the project and the project contains no `.kai/`.

Drafts, evidence, scratch, runtime state, host capabilities, activity, and
observation data never enter Git. Accepted collaboration happens through the
configured `docs/kai/` publication root.

## Unsupported manifests

Only schema 5 is supported. Refuse every other manifest with
`SCHEMA_MISMATCH` and route to `kai-core-workspace-reonboard`. Re-onboarding
preserves `docs/kai/`, retires `.kai/`, and imports no records.

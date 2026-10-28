---
name: kai-core-workspace-paths
description: "Use when resolving a Kai workspace, project binding, coordination database, typed private/public artifact path, or caller-composed package navigation view."
tools: [read, execute, search]
---

# Workspace paths

Schema 6 has one private operational root and a default project knowledge root:

```text
.kai/       private runtime, agent memory, evidence, working material
docs/kai/   canonical project knowledge, proposed or accepted
```

Directories appear only on the first valid write. Installing a pack creates no
pack directory.

## Project knowledge from creation

Write Git-suitable feature knowledge, designs, decisions, documentation, and
report narratives at one canonical repository path from the first edit. Reuse
an established documentation home; otherwise use the owning package's
`publicForm` under the configured publication root. Do not create a second
`docs/kai/` copy when a repository-native authority already exists.

Author proposals and revisions on a branch at that same path. Approval changes
the accepted revision, not the file's location. Default-branch knowledge states
current accepted direction unless the reviewed document or section explicitly
labels itself Proposed. Obtain any required named-authority acceptance of the
exact reviewed head before merging it as accepted content. A labelled proposal
may land through repository review without becoming an accepted decision.
Committing or merging alone does not establish semantic acceptance,
implementation, shipping, or permission to publish externally.

For coordinated acceptance, bind the exact Git base/head through
`kai-core-work-acting` and retain the approved branch for as long as Core
records reference it. Do not copy knowledge through a private draft and
mirrored publication transition.

Confirmed decisions update the canonical document without waiting for code
completion. Keep instructions and stable navigation linked to committed
knowledge. Private context may supplement it, never replace it.

Check privacy before committing or pushing: a branch is visible to repository
readers. Sensitive captures, evidence, credentials, personal material, and
restricted binary work stay private. A private exception is not a competing
project-knowledge authority; disclose unavailable or pending sanitized content.
Project Management's private planning database remains authoritative for its
records, and Creative's media custody rules still apply.

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

Private evidence and working paths include their owning pack, allowed type,
stable ID, and permitted private lane:

```text
.kai/<pack>/<type>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/<type>/<subtype>/<id>/{drafts,evidence,scratch}/
.kai/<pack>/archive/<type>/<id>/...
.kai/<pack>/archive/<type>/<subtype>/<id>/...
```

The default canonical knowledge route is under the configured project:

```text
docs/kai/<pack>/<type>/<id>/...
docs/kai/<pack>/<type>/<subtype>/<id>/...
```

The owning pack publication skill is the only source for allowed types,
subtypes, formats, publication rules, and privacy rules. Core path grammar does
not duplicate Project Management, Engineering, or Creative vocabularies.

Knowledge types use `evidence` and `scratch` privately, not an authoring draft
lane. `drafts` remains for explicitly private working outputs such as media
and Nightshift execution reports; it is not the canonical home of project
knowledge. A non-Git deliverable may still use the existing accepted-byte
publication route.

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

Private working outputs, evidence, scratch, runtime state, host capabilities,
activity, agent memory, and observation data never enter Git. Project knowledge
is authored in its canonical repository location, not promoted from `.kai/`.

## Existing private knowledge

Do not silently migrate a consumer workspace. With explicit authorization,
reconcile old knowledge drafts into the canonical document on a branch,
preserving accepted content and presenting unaccepted material as proposals.
Keep sensitive evidence private. Registered source bytes are immutable
evidence: do not move, edit, or delete them without reconciling their runtime
references through authorized recovery. They are no longer the authoring
authority. A current schema-6 workspace needs no schema reset for this change.

## Unsupported manifests

Only schema 6 is supported. Refuse every other manifest with
`SCHEMA_MISMATCH` and route to `kai-core-workspace-reonboard`. Re-onboarding
preserves existing `docs/kai/`, migrates durable knowledge and artifacts into
current package-owned routes, rebuilds current runtime state, and removes its
temporary staging path after verified reconciliation. Historical coordination
records are not imported.

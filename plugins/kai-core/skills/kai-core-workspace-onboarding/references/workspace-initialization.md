# Workspace Initialization

Read this reference only for schema-5 initialization or current binding repair.

## Direction

The operator supplies exactly:

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

Onboarding validates these bytes and never invents or replaces them.

## Manifest

Pass the approved values to the initializer:

```json
{
  "plugin": "kai-core",
  "version": "<plugin-version>",
  "schema_version": 5,
  "scaffolded": "<YYYY-MM-DD>",
  "workspace_id": "<stable-id>",
  "placement": "<external|repo-local>",
  "workspace_root": "<absolute external root or '.'>",
  "private_root": ".kai",
  "direction": "docs/kai/DIRECTION.md",
  "projects": [
    {
      "id": "<project-id>",
      "path": "<absolute external project path or '.'>",
      "publication_root": "docs/kai"
    }
  ]
}
```

Preserve stable IDs across re-runs and moves. SQLite at
`.kai/core/runtime/coordination.sqlite` is the only coordination authority.
Reads never create or repair it.

## Path and Git rules

Refuse links, junctions, aliases, nested Git roots, network paths, escapes,
overlapping external workspace/project roots, and unapproved non-empty targets.
Never use session-state or temporary storage as a workspace fallback.

For `external`, create no project-local `.kai/`.

For `repo-local`, install and verify:

```gitignore
# >>> kai workspace (managed by workflow-workspace-init) >>>
/.kai/
/.kai-retired-*/
**/storageState*.json
# <<< kai workspace <<<
```

Verify `git ls-files -- .kai` is empty and `.kai/` is ignored. If private files
are tracked, report exact paths and stop. Never run `git rm --cached`, commit,
or rewrite history without explicit authorization.

## Failure behavior

Initialization is manifest-last and failure-clean. Stop on:

- missing or invalid Direction;
- path or registry conflict;
- tracked private state without an approved plan;
- non-zero initializer, doctor, or inspect result; or
- any state that changed after approval.

Do not create a Markdown board, backlog, milestone, thread, hierarchy log, or
empty department directory.

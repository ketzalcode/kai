# Workspace Initialization

Read this reference only for schema-6 initialization or current binding repair.

## Manifest

Pass the approved values to the initializer:

```json
{
  "plugin": "kai-core",
  "version": "<plugin-version>",
  "schema_version": 6,
  "scaffolded": "<YYYY-MM-DD>",
  "workspace_id": "<stable-id>",
  "placement": "<external|repo-local>",
  "workspace_root": "<absolute external root or '.'>",
  "private_root": ".kai",
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
# >>> kai workspace (managed by kai-core-workspace-onboarding) >>>
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

- path or registry conflict;
- tracked private state without an approved plan;
- non-zero initializer, doctor, or inspect result; or
- any state that changed after approval.

Do not create a Markdown board, backlog, milestone, thread, planning log,
optional runtime, or empty package directory.

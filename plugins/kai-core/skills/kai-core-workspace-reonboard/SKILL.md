---
name: kai-core-workspace-reonboard
description: "Use when a Kai workspace manifest is unsupported and the operator wants a clean schema-5 workspace without importing historical records."
durable-output-producer: false
tools: [execute, read, edit, search, ask_user]
---

# Workspace re-onboarding

Use this skill only for a deliberate clean reset to the current workspace
contract. It is not a migration. Require explicit operator confirmation after
showing the exact paths and commands that will change.

Before resolving workspace paths, Load `kai-core-contract-v1`, then Load
`kai-core-workspace-paths` and use its current resolution and refusal contract.
If compatible core is unavailable, ordinary single-shot domain assistance may
continue, but do not coordinate work, alter `.kai` state, or re-onboard. Tell
the operator to install or update `kai-core` before resuming.

## Non-negotiable boundaries

- Preserve `docs/kai/` byte-for-byte. It is public accepted knowledge.
- Never import records, SQLite rows, manifests, activity, leases, approvals, or
  other private state from the retired workspace.
- Never read or inspect the retired SQLite database.
- Never delete a retired backup. Backup deletion belongs to the operator.
- Do not create or invoke a migration executable.

## Inspect and stop conditions

1. Read only enough of the unsupported manifest and current registry entry to
   resolve the exact workspace root, placement, workspace ID, and target
   project bindings. Never open the coordination database.
2. Branch on the resolved manifest `placement`:
   - For `repo-local`, the retirement source is
     `<workspace-root>/.kai/`, the backup is a sibling
     `<workspace-root>/.kai-retired-<UTC-basic-timestamp>/`, and the target
     project's `docs/kai/` remains in that project.
   - For `external`, the retirement source is
     `<workspace-root>/.kai/`, the backup is a sibling under the external
     workspace root, and every target project's `docs/kai/` remains in its
     project. The clean onboarding must retain external placement and never
     create project-local `.kai/` state.
3. Before confirmation, apply the current workspace path-safety contract to
   both source and destination. Refuse links, junctions, aliases, network
   paths, nested Git roots, non-canonical source or destination paths,
   collisions, path escapes, changed project bindings, or overlapping external
   workspace and project roots.
4. Check whether the resolved source is tracked. For repo-local placement run
   `git ls-files -- .kai .kai-retired-*` from the exact project Git root. For
   external placement, refuse a source inside any Git work tree and verify each
   target project contains no project-local `.kai/`.
5. If any source path is tracked, report the exact paths and stop. Never run
   `git rm --cached`, rewrite history, or move tracked private state.
6. Verify each target project's `docs/kai/` is outside the source. Record
   whether it exists, but do not move, rewrite, or regenerate existing files.
7. If package installation state or version alignment is uncertain, reinstall
   or update the current `kai-core` and selected active capability packages,
   verify them, and start a fresh session before continuing.

## Confirm

Show the operator:

- resolved placement;
- source: `<workspace-root>/.kai/`;
- backup: `<workspace-root>/.kai-retired-<UTC-basic-timestamp>/`;
- preserved publication for every target project: `<project>/docs/kai/`;
- the repo-local managed ignore block change, or for external placement the
  unchanged project Git state and registry update;
- the placement-specific current onboarding command that will run afterward.

Continue only after an explicit confirmation covering the rename and clean
onboarding.

## Reset

Use a UTC basic timestamp in `YYYYMMDDTHHMMSSZ` form. Refuse a collision.

1. Immediately before the rename, repeat the same path-safety validation for
   the resolved source and destination and recheck tracking, placement,
   registry/project bindings, collision absence, and preserved publication
   roots. Stop on any drift.
2. For repo-local placement only, update Kai's managed ignore block to include
   both:

   ```gitignore
   /.kai/
   /.kai-retired-*/
   ```

   Verify both rules with `git check-ignore --no-index`.
3. For external placement, do not change a target project's managed ignore
   block and do not create a project-local private root.
4. Rename `<workspace-root>/.kai/` atomically to the resolved sibling backup.
5. Do not open any file beneath the retired directory after the rename.
6. Run `kai-core-workspace-onboarding` with the same resolved placement and
   target projects to create a new schema-5 workspace.
7. Run the current workspace doctor and coordination inspect commands.

If onboarding fails, preserve both `docs/kai/` and the retired backup. Report
the failure; do not restore or import historical private state automatically.

## Result

```text
Workspace re-onboarding: complete | blocked | partial
Retired private root: <path or none>
Current workspace: schema 5 | absent
Public docs: preserved
Records imported: none
Package state: verified | uncertain
Backup deletion: operator-owned
Next: <ready or one exact blocking action>
```

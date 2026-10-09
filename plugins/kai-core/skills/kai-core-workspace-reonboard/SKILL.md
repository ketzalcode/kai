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

## Non-negotiable boundaries

- Preserve `docs/kai/` byte-for-byte. It is public accepted knowledge.
- Never import records, SQLite rows, manifests, activity, leases, approvals, or
  other private state from the retired workspace.
- Never read or inspect the retired SQLite database.
- Never delete a retired backup. Backup deletion belongs to the operator.
- Do not create or invoke a migration executable.

## Inspect and stop conditions

1. Resolve the exact project root and current `.kai/` path.
2. Run `git ls-files -- .kai .kai-retired-*`.
3. If any source path is tracked, report the exact paths and stop. Never run
   `git rm --cached`, rewrite history, or move tracked private state.
4. Verify `docs/kai/` is outside `.kai/`. Record whether it exists, but do not
   move, rewrite, or regenerate existing files there.
5. If package installation state or version alignment is uncertain, reinstall
   or update the current `kai-core` and selected active capability packages,
   verify them, and start a fresh session before continuing.

## Confirm

Show the operator:

- source: `<project>/.kai/`;
- backup: `<project>/.kai-retired-<UTC-basic-timestamp>/`;
- preserved publication: `<project>/docs/kai/`;
- the managed ignore block change;
- the current onboarding command that will run afterward.

Continue only after an explicit confirmation covering the rename and clean
onboarding.

## Reset

Use a UTC basic timestamp in `YYYYMMDDTHHMMSSZ` form. Refuse a collision.

1. Update Kai's managed ignore block to include both:

   ```gitignore
   /.kai/
   /.kai-retired-*/
   ```

2. Verify both rules with `git check-ignore --no-index`.
3. Rename `.kai/` atomically to `.kai-retired-<UTC-basic-timestamp>/`.
4. Do not open any file beneath the retired directory after the rename.
5. Run `kai-core-workspace-onboarding` for a new schema-5 workspace.
6. Run the current workspace doctor and coordination inspect commands.

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

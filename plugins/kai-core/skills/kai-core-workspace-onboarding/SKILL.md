---
name: kai-core-workspace-onboarding
description: "Use when installing Kai packs, initializing a schema-5 workspace, repairing its private binding, or explicitly migrating an older workspace."
durable-output-producer: false
tools: [execute, read, edit, search, ask_user]
---

# Workspace onboarding

This skill materializes `kai-core-workspace-paths`.
`workflow-workspace-init` executes it. Other roles may inspect the result but
must not scaffold a partial workspace.

## Pack installation mode

Use this mode only when the operator asks to install, select, update, or migrate
Kai plugins. It is guided and fail-closed, not transactional: inspect, show the
exact plan, get explicit confirmation, execute one step at a time, and stop on
the first failed or unverified step.

The catalog is closed:

| Order | Plugin | Purpose |
|---|---|---|
| 1 | `kai-core` | Required operating contract, workspace tools, and fleet hooks. |
| 2 | `kai-engineering` | Engineering implementation, investigation, review, and delivery. |
| 3 | `kai-creative` | UI/UX, visual identity, design assets, and supported media production. |

`kai-product`, `kai-marketing`, `kai-revenue`, `kai-assistant`, and
`kai-learning` are incubated packages, not install options. If the operator asks
for one, say it is unavailable and stop. Do not convert the request into a
sibling install, fallback, or direct repository path.

Core is always included. Never silently add a capability package. The supported
baseline is core plus the selected active packages.

<!-- kai:schema4-history -->
`kai-gtm` and `kai-personal` are retired install names without aliases.
Historical `.kai/personal/` data is preserved as migration input; plugin
replacement is not data migration.
<!-- /kai:schema4-history -->

### Inspect

Before showing an install plan:

1. Resolve the current Kai plugin directory again before each command that uses
   it; never reuse a path into a plugin uninstalled or updated during this run.
2. Run:

   ```text
   node "<kai-plugin>/scripts/workspace-doctor.mjs" --migration-check --root "<workspace-root>"
   ```

3. Read `copilot plugin marketplace list`, `copilot plugin list`, and the
   migration check's JSON inventory; use its `plugins` inventory for enabled
   state and provenance.
4. Refuse installation when legacy `kai`, mixed provenance, unreadable host
   state, disabled plugins, or version skew remains unresolved.
5. Prove `kai-core` and every selected department exist at one marketplace
   version before recommending removal of the monolith or retired packs.

Do not infer enabled state from `plugin list`. Never substitute a direct
repository or subdirectory install as a fallback.

### Plan and confirm

Show the exact ordered commands that will run:

```text
copilot plugin marketplace add ketzalcode/kai
copilot plugin marketplace update kai-plugins
copilot plugin marketplace browse kai-plugins

copilot plugin install kai-core@kai-plugins
copilot plugin update kai-core@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-creative@kai-plugins
```

Browse the selected source before any uninstall or install. Show only selected
department commands. Use `update` for an installed pack at an older version.
Get explicit confirmation for the displayed plan before changing marketplace
state, plugins, or workspace provenance.

When replacement requires uninstalling an old package, prove `kai-core` and
every requested department are listed at one common version, show the re-entry
sequence. End the current run; a session still carrying the removed
monolith must not continue the migration.

### Execute

1. Add or update the marketplace and verify all requested plugins are present
   at one version.
2. Install, update, or keep core. Verify one enabled marketplace row at the
   exact version reported by the browse step. If the host refuses an update
   because this session has core loaded, perform the update from a session that
   does not have the pack loaded.
3. If core is disabled, tell the operator to open `/plugin` in an interactive
   Copilot session, enable `kai-core@kai-plugins`, start a fresh session before
   invoking pack agents, and re-run. Do not name the unavailable
   `copilot plugins enable` command.
4. Install each selected department in catalog order. If one is disabled, tell
   the operator to open `/plugin`, enable `<name>@kai-plugins`, and start fresh.
5. Re-run the migration check.

Stop on the first non-zero command or unverified result. Do not uninstall
earlier successful steps to manufacture rollback.

After an actual core install or update, say:

> Core installed. This session still does not have it loaded - start a fresh session before invoking pack agents.

Any department installed or updated also requires a fresh session.

### Report

```text
Pack install: complete | partial | blocked | unknown
Requested: <core plus selected departments>
Verified installed: <name@version rows, or none>
Failed: <command/check and observed result, or none>
Not attempted: <selected plugins, or none>
Legacy kai: absent and verified | present | unverified
Retired packs: absent and verified | present | unverified
Workspace provenance: kai-core | unchanged | not present | unverified
Rollback: not attempted or verified
Session: start a fresh session before invoking pack agents | no pack change
Next: <ready, or one blocking action>
```

Choose `partial` when at least one plugin install or update succeeded in this
run. Choose `unknown` when required host, marketplace, plugin-list, version, or
workspace evidence is unreadable. Choose `blocked` for every other known
pre-mutation refusal or failed command when no plugin install or update
succeeded.

## Workspace inputs

Resolve:

- absolute target project root;
- placement: `external` or `repo-local`;
- durable absolute external workspace root for `external`;
- stable project and workspace IDs;
- project publication root `docs/kai`;
- operator-supplied `docs/kai/DIRECTION.md`;
- plugin version from `plugin.json`;
- explicit approval for moves, conflicts, and non-empty targets.

Never use session-state or temporary storage as a workspace fallback.

## Direction

Coordinated work requires exactly:

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

There is one observable, time-bounded Current Goal. The operator supplies these
bytes. Onboarding validates them and never invents or silently replaces them.

## Initialize

Inspect the project, registry, `.gitignore`, publication root, and any existing
workspace first. Show exact creates, keeps, conflicts, registry changes, and
managed blocks. Do not mutate a non-empty target without explicit approval.

Pass the exact approved schema-5 manifest to the standalone initializer:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --initialize --root "<workspace-root>" --confirm
```

Do not use native `coordinate.mjs request`, `authorize`, or `init` for workspace
creation. Activation is manifest-last and failure-clean. A successful new
workspace creates only:

```text
.kai/manifest.json
.kai/core/runtime/coordination.sqlite
docs/kai/README.md
docs/kai/DIRECTION.md
```

No department or artifact directory is seeded. Validated first-write helpers
create only the exact typed path required by real work.

## Manifest

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
`.kai/core/runtime/coordination.sqlite` is the **only coordination authority**.
Reads never create or repair the store.

## Git rules

For `external`, register the exact workspace/project pair and create no
project-local `.kai/`.

For `repo-local`, install and verify:

```gitignore
# >>> kai workspace (managed by workflow-workspace-init) >>>
# Kai operational state stays local to this checkout.
/.kai/
**/storageState*.json
# <<< kai workspace <<<
```

Verify `git ls-files -- .kai` is empty and `.kai/` is ignored. If private files
are tracked, report exact paths and stop. Never run `git rm --cached`, commit,
or rewrite history without explicit authorization.

## Communication style

Offer once to append the canonical managed block from
`scripts/lib/communication-style-block.md` under the loaded core provider root
to the project's `AGENTS.md`. The choice is opt-in. Append or replace only the
marked Kai region; never rewrite, stage, or commit user-authored content.

## Explicit migration

<!-- kai:schema4-history -->
Schema 3 and schema 4 may contain shared placement, schema-4 manifests,
`.kai/state/`, `.kai/runs/`, `.kai/review/`, `.kai/personal/`, initiatives,
generic items, boards, backlogs, milestones, and threads. Schema 2 may also use
visible `kai/coordination/`, `kai/initiatives/`, `kai/library/`, and
`kai/personal/` roots. These are migration sources, never schema-5
destinations.
<!-- /kai:schema4-history -->

There is no automatic upgrade and no old-schema initialization path. Old
workspaces remain available only through version-appropriate `inspect`,
`status`, and `legacy` reads. Every old-schema write returns `SCHEMA_MISMATCH`.

Migration is explicit, offline, backup-first, and ownership-classified:

1. execute the runtime's `migration-plan`;
2. obtain operator-supplied Direction and the complete hierarchy/artifact map;
3. verify a durable backup outside the live workspace;
4. reconcile tracked private files and active leases;
5. stage typed schema-5 records and pack-owned artifact paths;
6. reject unknown ownership instead of creating a fallback lane;
7. verify paths, privacy, provenance, hierarchy, and read views;
8. move the database to `.kai/core/runtime/coordination.sqlite`;
9. activate the schema-5 manifest last.

Failure leaves the old workspace authoritative and the backup intact.

## Validate

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --root "<workspace-root>"
node "<kai-plugin>/scripts/coordinate.mjs" inspect --root "<workspace-root>"
```

Require exact schema, placement, IDs, project bindings, Direction, database,
registry, Git privacy, and publication-root containment. Before every write,
resolve real paths again and refuse links, junctions, aliases, nested Git roots,
collisions, or escapes.

## Result

```text
Workspace: ready | blocked | unknown
Placement: external | repo-local
Workspace root: <absolute path>
Project: <id and absolute path>
Publication root: <project-relative path>
Schema: 5 | historical inspect-only | unknown
Coordination store: present | absent | pending migration | unknown
Registry: paired | n/a | blocked | unknown
Git contract: verified | n/a | blocked | unknown
Created: <paths or none>
Kept: <paths or none>
Migrated: <moves or none>
Published: <paths or none>
Conflicts: <paths or none>
Next: <ready, or one exact blocking action>
```

Ready requires healthy validation and every applicable registry and Git check.
Re-running a ready workspace is a no-op.

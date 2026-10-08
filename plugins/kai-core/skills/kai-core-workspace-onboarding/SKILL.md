---
name: kai-core-workspace-onboarding
description: "Initializes and validates kai workspaces, and guides explicit migration to the split pack install surface. Use when installing kai packs or creating or repairing workspace state."
tools: [execute, read, edit, search, ask_user]
---

# Workspace Onboarding

This skill materializes `kai-core-workspace-paths` and `kai-core-workspace-initiative`.
`workflow-workspace-init` executes it. Other roles may validate the result but
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
| 2 | `kai-engineering` | Engineering, architecture, reliability, security, data, AI, QA, docs, PR, and ship roles. |
| 3 | `kai-creative` | UI/UX, visual identity, design assets, and supported media production. |

`kai-product`, `kai-marketing`, `kai-revenue`, `kai-assistant`, and
`kai-learning` are incubated packages, not install options. If the operator asks
for one of them, say it is unavailable and stop; do not convert the request into
a sibling install, a fallback, or a direct repository path. Existing hosts that
already have them keep those files; their absence is
not an uninstall signal, rename, disable, or workspace deletion.

Core is always included. Never silently add a capability package. The supported
baseline is core plus the selected active packages; adequate supplied evidence
does not require installing its usual producer.
`kai-gtm` and `kai-personal` are retired without aliases:

- Former gtm capabilities belong to marketing, revenue and product (growth).
- Former personal capabilities belong to assistant (tasks/voice), learning
  (teaching/career), creative (video/demo) and product (fitness-product audits).

Select replacements by capability, not by prefix or a one-to-one rename.
Preserve `.kai/personal/` and existing workspace/private records; plugin
replacement is not data migration. The source inventory and prepared metadata
do not prove publication. New-package commands require a marketplace source
containing this refactor.

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
   version before recommending removal of the monolith or either retired pack.
   The selected departments are the active default-surface packages only.
6. Inspect the host's plugin list explicitly for retired gtm/personal installs;
   a current-catalog migration check alone is not proof they are absent.
   Their IDs overlap the replacements. Show their removal in the confirmed
   plan and end the old session before replacement use. If replacement-source
   availability is unknown, keep the existing installation and stop.

Do not infer enabled state from `plugin list`; use the migration inventory.
Never substitute a direct repository or subdirectory install as a fallback.

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

These are marketplace command forms, not evidence that the default remote
contains this branch. Browse the selected source before any uninstall/install;
do not bypass missing replacements with guessed branch or direct-install syntax.
Show only selected department commands. Use `update` for a selected installed
pack at an older version. Show `keep and verify` instead of an
install command when the exact enabled marketplace version is already present.
Get one explicit confirmation for the displayed plan before changing
marketplace state, plugins, or workspace provenance.

When the only safe path is to uninstall legacy `kai` or retired packages,
prove `kai-core` and every
requested department are listed at one common version, then show the re-entry
sequence. End the current run; a session still carrying the removed monolith
must not continue the migration. The same boundary applies to any removed
retired package.

### Execute

1. Add or update the marketplace and verify all requested plugins are present
   at one version.
2. Install, update, or keep `kai-core`. Verify one enabled
   `marketplace:kai-plugins` row at the exact version reported by the browse
   step. If the host refuses an update because this session has core loaded,
   perform the update from a session that does not have the pack loaded.
   If core is disabled, tell the operator to open `/plugin` in an interactive
   Copilot session, enable `kai-core@kai-plugins`, start a fresh session, and
   re-run the installer. Do not name the unavailable
   `copilot plugins enable` command.
3. Install each selected active department in catalog order. Verify the same version,
   enabled state, and provenance immediately after each command. If one is
   disabled, tell the operator to open `/plugin`, enable
   `<name>@kai-plugins`, start a fresh session, and re-run the installer.
4. Re-run the migration check. Completion requires `clear`, no legacy
   monolith or retired packs in the host list, and the exact requested active
   pack set.

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
Retired kai-gtm / kai-personal: absent and verified | present | unverified
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
- durable absolute external workspace root when using `external`;
- stable kebab-case project ID;
- the fixed project publication root `docs/kai`;
- operator-supplied `docs/kai/DIRECTION.md`;
- plugin version from `plugin.json`;
- operator approval for moves, conflicts, and any non-empty target.

Never use session-state or temp storage.

## Inspect and plan

Inspect:

- an in-tree `.kai/manifest.json`;
- the `$KAI_HOME/workspaces.json` registry;
- existing `.kai/` state and retired layouts;
- `.gitignore` and tracked Kai paths;
- the configured publication root;
- an existing managed communication-style block in `AGENTS.md`.

Show:

- exact paths to create or keep;
- exact conflicts;
- every proposed migration move and reference rewrite;
- registry changes;
- the managed ignore block;
- publication files to create;
- whether `AGENTS.md` would change.

Do not write into a non-empty target until the operator approves that plan.

## Initialize

There is one initializer. Before it runs, keep the approved manifest bytes and
confirmation outside the not-yet-created workspace. Do not use native
`coordinate.mjs request` / `authorize` / `init`; those commands must not create
host, request, capability, or runtime files before workspace activation.

The operator supplies `docs/kai/DIRECTION.md`. Then pass the exact approved
schema-5 manifest on stdin to the standalone initializer:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --initialize --root "<workspace-root>" --confirm
```

Activation is manifest-last and failure-clean. A successful initialization
creates only:

```text
.kai/manifest.json
.kai/core/runtime/coordination.sqlite
docs/kai/README.md
docs/kai/DIRECTION.md
```

`README.md` is created only when absent; existing bytes are preserved.
Direction is verified, never invented or replaced. Do not create department,
personal, learning, run, review, archive, or generic artifact directories.
Validated first-write helpers create typed `<pack>/<type>/<id>/<lifecycle>`
parents only when real work needs them.

## Manifest

Write schema 5 for a new workspace. Schema 3 and schema 4 are historical,
read-only stores: `inspect`, `status` and `legacy` remain available, while
every coordinated write refuses with `SCHEMA_MISMATCH` until an explicit
schema-5 migration completes.

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

Preserve `workspace_id` across re-runs and moves. Reconcile missing fixed keys
without changing operator-selected project IDs, paths, publication roots, or
placement.

### Coordination store

The schema-5 manifest and schema-2 store are one activation unit. Reads never
create or repair either one. If either is absent or invalid, report the exact
refusal and run the standalone initializer only for a genuinely new workspace.

### Historical schema-3/4 migration

There is **no automatic upgrade** and no schema-4 initialization path. Existing
schema-3 and schema-4 workspaces remain inspect-only through `inspect`, `status`,
and `legacy`. Do not invoke `init`, create a historical database, edit the
manifest, or write through a lower-level store API. Route the operator to the
explicit offline schema-5 migration. Until that migration surface is available
and confirmed, report the workspace as read-only rather than inventing a
schema-4 write path.

For `external`, write or replace the one machine registry row that pairs the
project root, workspace root, and manifest `workspace_id`. Use:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --adopt "<project-root>" --root "<workspace-root>"
```

Forgetting a binding uses `--forget "<project-root>"`; it never deletes
workspace files.

## Git rules

<!-- kai:allow-legacy-roots -->

### `external`

Do not create project `.kai/` state. The project may have no Kai-specific
ignore rule. If the external workspace is itself a Git repository, apply the
shared/private rules there; otherwise report Git checks as not applicable.

### `repo-local`

Install:

```gitignore
# >>> kai workspace (managed by workflow-workspace-init) >>>
# Kai operational state stays local to this checkout.
/.kai/
# Retired private state remains protected until an approved migration removes it.
/kai/personal/
**/storageState*.json
# <<< kai workspace <<<
```

Verify `git ls-files -- .kai` is empty and `.kai/` is ignored. If files are
already tracked, report the exact paths and block completion. Never run
`git rm --cached` or rewrite history without explicit authorization.

### `shared`

Install:

```gitignore
# >>> kai workspace (managed by workflow-workspace-init) >>>
# Kai runtime, review, archive, and personal state remain private.
/.kai/runs/
/.kai/review/
/.kai/archive/
/.kai/personal/
/.kai/activity.jsonl
/.kai/activity.jsonl.1
/.kai/observed.jsonl
/.kai/observed.jsonl.1
/.kai/observer-consent
/.kai/local.json
# Retired private state remains protected until an approved migration removes it.
/kai/personal/
**/storageState*.json
# <<< kai workspace <<<
```

Verify `.kai/manifest.json`, `.kai/CONVENTIONS.md`, and `.kai/state/` are
trackable. Verify every listed private path is ignored.

Publication paths follow the project's own Git policy. Onboarding creates or
updates them only through an explicit publication plan.

<!-- /kai:allow-legacy-roots -->

## Seed files

- `.kai/CONVENTIONS.md` summarizes the resolved storage mode, project bindings,
  private lanes, publication root, and artifact-target grammar.
- `.kai/state/ACTIVE.md` lists only currently active initiatives.
- `.kai/state/BOARD.md` contains the derived table:

  ```markdown
  | id | title | initiative | milestone | priority | state | owner | next | depends-on | waiting-on | updated |
  ```

- `.kai/state/items/README.md` documents that item state is authoritative in the
  runtime store, read through `status`, `detail` and `export`, plus typed
  dependencies, leases, versions, review bindings, artifact targets, and
  evidence.
- `.kai/state/threads/README.md` documents the `HANDOFF`, `QUESTION`, `ANSWER`,
  and recovery packet shapes and names the commands that submit and read them
  (`item.handoff`, `question.open`, `question.answer`, `attempt.recover`;
  `messages --item <item-id>`).
- `.kai/state/backlog.md` is the only unaffiliated proposal backlog.
- `.kai/state/initiatives/INDEX.md` is the durable all-status catalog:

  ```markdown
  | slug | status | workspace | summary | deliverables | updated |
  ```

- `.kai/state/initiatives/README.md` documents initiative schema, milestones,
  artifacts, stewardship, closure, and archive behavior.
- `.kai/personal/` stubs are created only when missing. Never invent identity,
  career, agenda, or decision content.

## Communication style

The main CLI agent does not inherit Kai skills. Offer once to append the
canonical managed block from
`scripts/lib/communication-style-block.md` under the loaded core provider root
to the project's `AGENTS.md`. Resolve that provider from this skill's base
directory, not the operator's cwd; the file is emitted with core.

The choice is opt-in. Explain that `AGENTS.md` belongs to the project and may
be committed even when the workspace is external or repo-local. Append or
replace only the marked Kai region. Never rewrite user-authored content and
never stage or commit the file.

## Schema-2 migration

<!-- kai:allow-legacy-roots -->
Schema 2 may contain manifest keys `workspace_mode`, `corpus_visibility`,
`kai`, `corpus`, `coordination`, `initiatives`, `library`, and `personal`, plus
the visible paths `kai/coordination/`, `kai/initiatives/`, `kai/library/`, and
`kai/personal/`.

Migration is consented and classified:

1. choose schema-5 `placement`, project binding, and `docs/kai`;
2. stop if both old and new destinations contain conflicting content;
3. move coordination to `.kai/state/`;
4. move initiative working records to `.kai/state/initiatives/`;
5. move personal state to `.kai/personal/`;
6. move raw evidence to `.kai/runs/`;
7. move review-ready drafts to `.kai/review/`;
8. classify former library and initiative artifacts individually:
   - accepted current project knowledge may publish;
   - active working material stays under its initiative;
   - closed operational history may archive;
   - stale, unknown, or rejected material remains private until classified;
9. rewrite every workspace-relative reference and `artifact_targets` entry;
10. install and verify the selected mode's ignore rules;
11. register external project bindings when required;
12. preserve the legacy source bytes without activating writes;
13. run the workspace doctor in inspection mode;
14. migrate historical state to schema 5 as a separate, explicit offline step
    (see *Historical schema-3/4 migration*). Never chain it automatically.

Never bulk publish the old library. Never keep both layouts as aliases. Earlier
root-level `coordination/`, `initiatives/`, `library/`, `personal/`,
`.persona-self/`, `knowledge/`, and `.kai/local.json` are migration inputs only
when their content proves they are Kai state; generic product directories with
the same names are untouched.
<!-- /kai:allow-legacy-roots -->

## Validate

Run both checks:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --root "<workspace-root>"
node "<kai-plugin>/scripts/coordinate.mjs" inspect --root "<workspace-root>"
```

For external mode, require registry pairing. Confirm:

- schema version, fixed roots, placement, workspace ID, and project bindings;
- Git behavior for the selected mode;
- coordination item and dependency integrity;
- no split-brain legacy roots;
- no seeded file was overwritten;
- the configured publication root is inside the selected project;
- only accepted assets were published.

`inspect` reports the resolved schema, whether the store exists, and its runtime
cursor. Historical schema-3/4 state and pending migrations are reported and
remain read-only — never silently initialized or repaired.

Before every publication write, resolve the real project root and every
existing destination ancestor again. Refuse a symlink or junction that escapes
the real project root; the doctor's earlier result is not authority after the
filesystem changes.

## Result

```text
Workspace: ready | blocked | unknown
Placement: external | repo-local
Workspace root: <absolute path>
Project: <id and absolute path>
Publication root: <project-relative path>
Schema: 5 | 3/4 (inspect-only) | unknown
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

Ready requires a healthy doctor result, the exact current coordination store
for a schema-5 workspace, and every applicable registry and Git check.
Schema-3/4 workspaces can be `ready` only for inspection, and their next action
is explicit schema-5 migration. Re-running a ready workspace is a no-op.

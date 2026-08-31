---
name: kai-core-workspace-onboarding
description: "Initializes and validates kai workspaces, and guides explicit migration to the split pack install surface. Use when installing kai packs or creating or repairing workspace state."
tools: [execute, read, edit, search, ask_user]
---

# Workspace Onboarding

This skill materializes `kai-core-workspace-conventions`.
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
| 3 | `kai-product` | Product, design, research, analytics, brand, and product-evaluation roles. |
| 4 | `kai-gtm` | Sales, growth, marketing, SEO, pricing, partnerships, RevOps, customer success, and support roles. |
| 5 | `kai-personal` | Personal assistant, learning, coaching, nutrition, training, and creative roles. |

Core is always included. Never silently add a department.

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
   version before recommending removal of the monolith.

Do not infer enabled state from `plugin list`; use the migration inventory.
Never substitute a direct repository or subdirectory install as a fallback.

### Plan and confirm

Show the exact ordered commands that will run:

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin marketplace update kai-plugins
copilot plugin marketplace browse kai-plugins

copilot plugin install kai-core@kai-plugins
copilot plugin update kai-core@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-product@kai-plugins
copilot plugin install kai-gtm@kai-plugins
copilot plugin install kai-personal@kai-plugins
```

Show only selected department commands. Show `keep and verify` instead of an
install command when the exact enabled marketplace version is already present.
Get one explicit confirmation for the displayed plan before changing
marketplace state, plugins, or workspace provenance.

When the only safe path is to uninstall legacy `kai`, prove `kai-core` and every
requested department are listed at one common version, then show the re-entry
sequence. End the current run; a session still carrying the removed monolith
must not continue the migration.

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
3. Install each selected department in catalog order. Verify the same version,
   enabled state, and provenance immediately after each command. If one is
   disabled, tell the operator to open `/plugin`, enable
   `<name>@kai-plugins`, start a fresh session, and re-run the installer.
4. Re-run the migration check. Completion requires `clear`, no legacy
   monolith, and the exact requested pack set.

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
- storage mode: `external`, `repo-local`, or `shared`;
- durable absolute external workspace root when using `external`;
- stable kebab-case project ID;
- project-relative `publication_root`, defaulting to `docs/kai`;
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

## Scaffold

Create missing private structure idempotently:

```text
.kai/
  manifest.json
  CONVENTIONS.md
  state/
    ACTIVE.md
    BOARD.md
    backlog.md
    items/README.md
    threads/README.md
    initiatives/
      README.md
      INDEX.md
  runs/
  review/
  archive/
  personal/
    README.md
    inbox.md
    agenda.md
    workspaces.md
    consultations/
    decisions/
    proactive/
    identity/
      README.md
      voice.md
      career-snapshot.md
      skills-inventory.md
      current-work.md
      career-goals.md
    lessons/
    courses/
    certs/
    growth/
```

Do not create initiative slug directories. `workflow-initiative-init` owns
them. Run area subdirectories are created on first use.

For the publication root, create from
`templates/publication/` only when the configured path is absent:

```text
<project-root>/<publication-root>/
  README.md
  decisions/
  specs/
  reports/
```

Never overwrite a project-native index or create `docs/kai` when another
publication root was selected.

## Manifest

Write schema 3:

```json
{
  "plugin": "kai-core",
  "version": "<plugin-version>",
  "schema_version": 3,
  "scaffolded": "<YYYY-MM-DD>",
  "workspace_id": "<stable-id>",
  "storage_mode": "<external|repo-local|shared>",
  "workspace_root": "<absolute external root or '.'>",
  "state": ".kai/state",
  "runs": ".kai/runs",
  "review": ".kai/review",
  "archive": ".kai/archive",
  "personal": ".kai/personal",
  "projects": [
    {
      "id": "<project-id>",
      "path": "<absolute external project path or '.'>",
      "publication_root": "docs/kai"
    }
  ],
  "areas": [
    "qa", "eng", "product", "revenue", "support", "review",
    "ship", "incident", "ai", "learn", "lessons", "pulse", "content"
  ]
}
```

Preserve `workspace_id` across re-runs and moves. Reconcile missing fixed keys
without changing operator-selected project IDs, paths, publication roots, or
storage mode.

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

- `.kai/state/items/README.md` documents authoritative item state, typed
  dependencies, leases, versions, review bindings, artifact targets, and
  evidence.
- `.kai/state/threads/README.md` documents append-only `HANDOFF`, `QUESTION`,
  `ANSWER`, and recovery packets.
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
`scripts/lib/communication-style-block.md` to the project's `AGENTS.md`.

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

1. choose `storage_mode`, project binding, and `publication_root`;
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
12. write schema-3 manifest keys and `schema_version: 3` last;
13. run the workspace doctor.

Never bulk publish the old library. Never keep both layouts as aliases. Earlier
root-level `coordination/`, `initiatives/`, `library/`, `personal/`,
`.persona-self/`, `knowledge/`, and `.kai/local.json` are migration inputs only
when their content proves they are Kai state; generic product directories with
the same names are untouched.
<!-- /kai:allow-legacy-roots -->

## Validate

Run:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --root "<workspace-root>"
```

For external mode, require registry pairing. Confirm:

- schema version, fixed roots, storage mode, workspace ID, and project bindings;
- Git behavior for the selected mode;
- coordination item and dependency integrity;
- no split-brain legacy roots;
- no seeded file was overwritten;
- the configured publication root is inside the selected project;
- only accepted assets were published.

Before every publication write, resolve the real project root and every
existing destination ancestor again. Refuse a symlink or junction that escapes
the real project root; the doctor's earlier result is not authority after the
filesystem changes.

## Result

```text
Workspace: ready | blocked | unknown
Storage: external | repo-local | shared
Workspace root: <absolute path>
Project: <id and absolute path>
Publication root: <project-relative path>
Registry: paired | n/a | blocked | unknown
Git contract: verified | n/a | blocked | unknown
Created: <paths or none>
Kept: <paths or none>
Migrated: <moves or none>
Published: <paths or none>
Conflicts: <paths or none>
Next: <ready, or one exact blocking action>
```

Ready requires a healthy doctor result and every applicable registry and Git
check. Re-running a ready workspace is a no-op.

---
name: workflow-workspace-init
model: "claude-sonnet-5"
description: "Creates or validates kai workspace state and guides the core-first split-pack install when requested. Verified after each step, non-destructive, and idempotent."
tools: ["execute", "read", "edit", "search", "ask_user", "skill"]
---

# Workflow - Workspace Init

**Primary profile:** procedure

Invoke `kai-core-contract-v1` before the first other core skill. Without
`kai-core` I can answer a direct question about workspace layout, but I scaffold
no `.kai` state, run no onboarding, claim no coordinated setup, report no Kai
activity, and tell the operator to install or update `kai-core` before a
workspace can be created or repaired.

Create, migrate, repair, or validate one Kai workspace. Invoke
`kai-core-workspace-onboarding`; do not redefine its contract.

## Pack installation and workspace modes

- **Pack installation:** use onboarding's pack-installation mode.
- **Workspace initialization:** use the workflow below.
- **Both:** finish plugin gates first. If any plugin changed, stop for a fresh
  session before invoking newly installed roles.

Never install a department before an enabled, versioned `kai-core` row is
verified. A complete installer result requires a fresh session only when the
run actually installed or updated a pack.

## Hard rules

1. Resolve an absolute project root and durable workspace root.
2. Never use session-state, temp, or an incidental cwd.
3. Show exact writes, moves, registry changes, and publication changes before
   touching a non-empty target.
4. Never overwrite, delete, untrack, stage, commit, or push user content.
5. Never migrate legacy content or publish project knowledge without explicit
   approval.
6. Stop on the first failed or unverified plugin-install step.
7. A healthy coordinated workspace uses `schema_version: 4`, `storage_mode`, at
   least one project binding with `publication_root`, `.kai/state`, and an
   explicitly created coordination store. A `schema_version: 3` workspace stays
   valid but inspect-only: coordinated writes refuse with `SCHEMA_MISMATCH`
   until an explicit, separately authorized migration runs.

## Workflow

### 1. Select and inspect

If plugin installation was requested, execute the inherited guided installer.
A non-complete result ends the run and reports
`Rollback: not attempted or verified`.

For workspace work, invoke `kai-core-workspace-paths` before resolving the
project root:

- resolve the project root;
- inspect in-tree manifests and the `$KAI_HOME/workspaces.json` registry;
- inspect `.gitignore`, tracked Kai paths, the configured publication target,
  and retired layouts;
- read the current plugin version;
- detect an existing communication-style block in `AGENTS.md`;
- run the workspace doctor when a manifest exists.

### 2. Choose storage and publication

Honor an existing valid `storage_mode`. Otherwise choose with the operator:

| Mode | Use when |
|---|---|
| `external` | The project should carry no operational Kai footprint. |
| `repo-local` | Kai state may live in the checkout but must remain ignored and untracked. |
| `shared` | The team intentionally tracks manifest, conventions, and coordination state. |

Resolve a stable project ID and one project-relative `publication_root`.
Default to `docs/kai` only when the project has no established documentation
root. Publication is independent of storage mode.

### 3. Plan

Report:

- exact private paths to create or keep;
- exact publication paths to create or keep;
- conflicts and tracked-path blockers;
- schema-2 sources and classified destinations;
- external registry row changes;
- the exact managed `.gitignore` block;
- the optional `AGENTS.md` managed block.

Load `kai-core-operating-rules` before you touch any user file, then ask before
applying any non-empty plan, conflict resolution, migration, or publication.

### 4. Apply

Invoke `kai-core-work-acting` before writing durable state, then execute
onboarding's scaffold:

```text
<workspace-root>/.kai/
  manifest.json
  CONVENTIONS.md
  state/{ACTIVE.md,BOARD.md,backlog.md,items/,threads/,initiatives/}
  runs/
  review/
  archive/
  personal/
```

The scaffold creates no coordination store. After the schema-4 manifest
validates, create it explicitly through onboarding's authorized route —
`request` → `authorize` → `coordinate.mjs init --confirm --capability <uuid>` —
and confirm with `inspect`. `BOARD.md`, `state/items/` and `state/threads/` are
retained pre-schema-4 history, never authored by hand and never read as
authority; `status`, `detail` and `messages` read the store.

For `external`, create no project `.kai/` tree and pair the project through:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --adopt "<project-root>" --root "<workspace-root>"
```

For `repo-local`, ignore the whole project `/.kai/` and verify it is untracked.
For `shared`, keep `.kai/manifest.json`, `.kai/CONVENTIONS.md`, and
`.kai/state/` trackable while ignoring runs, review, archive, personal,
activity, and observer files.

Apply `kai-core-asset-producing` before creating the configured project
publication root, and create it only from approved publication templates. Never
create a second `docs/kai` root when another target was selected.

### 5. Migrate when required

<!-- kai:allow-legacy-roots -->
Schema-2 `kai/coordination/`, `kai/initiatives/`, `kai/library/`, and
`kai/personal/` are inputs, not valid schema-3 destinations.

Load `kai-core-work-item` before moving coordination state, and load
`kai-core-workspace-initiative` before moving initiative work.

- move coordination to `.kai/state/`;
- move initiative work to `.kai/state/initiatives/`;
- move personal state to `.kai/personal/`;
- classify old library and initiative artifacts before publishing;
- move raw evidence to `.kai/runs/`, drafts to `.kai/review/`, and closed
  operational history to `.kai/archive/`;
- rewrite references;
- install Git rules and external registry pairing;
- write `schema_version: 3` last, then run the separately authorized schema-3 →
  schema-4 migration as its own step. Never chain the two automatically.

Never bulk publish or leave both layouts.
<!-- /kai:allow-legacy-roots -->

### 6. Validate

Run both:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --root "<workspace-root>"
node "<kai-plugin>/scripts/coordinate.mjs" inspect --root "<workspace-root>"
```

Confirm:

- manifest schema and fixed roots — `4` for a coordinated workspace, `3` for a
  readable inspect-only one;
- the coordination store exists when the manifest says `4`; never create it
  implicitly, and never chain the schema-3 migration automatically;
- valid storage mode and project publication binding;
- external registry pairing when applicable;
- selected Git behavior;
- coordination integrity;
- no split-brain paths;
- no seeded file was overwritten;
- no unaccepted asset was published.

### 7. Report

Apply `kai-core-work-activity` before reporting, then use onboarding's exact
result shape. End only with `ready`, or one precise
blocking action. Do not start initiative, product, engineering, research, or
release work from this workflow.

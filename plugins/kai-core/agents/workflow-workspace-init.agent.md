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
7. A healthy coordinated workspace uses the exact schema-5 manifest and the
   schema-2 store at `.kai/core/runtime/coordination.sqlite`. Schema-3/4
   workspaces remain inspect-only: coordinated writes refuse with
   `SCHEMA_MISMATCH` until explicit schema-5 migration.

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

### 2. Choose placement and publication

Honor an existing valid schema-5 `placement`. Otherwise choose with the
operator:

| Mode | Use when |
|---|---|
| `external` | The project should carry no operational Kai footprint. |
| `repo-local` | Kai state may live in the checkout but must remain ignored and untracked. |

Resolve a stable project ID, the fixed `docs/kai` publication root, and the
operator-supplied `docs/kai/DIRECTION.md`.

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

Invoke `kai-core-work-acting` before writing durable state, then execute the
single confirmed standalone initializer with the approved schema-5 manifest on
stdin:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --initialize --root "<workspace-root>" --confirm
```

Activation is manifest-last. It creates only `.kai/manifest.json`,
`.kai/core/runtime/coordination.sqlite`, `docs/kai/README.md` when absent, and
the already operator-supplied `docs/kai/DIRECTION.md`. Never create department,
personal, learning, run, review, archive, or generic artifact directories.

For `external`, create no project `.kai/` tree and pair the project through:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --adopt "<project-root>" --root "<workspace-root>"
```

For `repo-local`, ignore the whole project `/.kai/` and verify it is untracked.
Apply `kai-core-asset-producing` before creating later typed project assets.

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
- preserve historical schema-3/4 bytes read-only, then run explicit offline
  schema-5 migration as its own step. Never chain it automatically.

Never bulk publish or leave both layouts.
<!-- /kai:allow-legacy-roots -->

### 6. Validate

Run both:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --root "<workspace-root>"
node "<kai-plugin>/scripts/coordinate.mjs" inspect --root "<workspace-root>"
```

Confirm:

- manifest schema and fixed roots — `5` for a coordinated workspace, `3` or
  `4` for a readable inspect-only historical one;
- the exact schema-2 coordination store exists for schema 5; never create it
  implicitly outside the standalone initializer;
- valid placement and project publication binding;
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

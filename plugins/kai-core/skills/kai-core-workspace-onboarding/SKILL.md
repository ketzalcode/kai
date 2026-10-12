---
name: kai-core-workspace-onboarding
description: "Use when installing Kai packs, initializing a schema-6 workspace, or repairing its current private binding."
tools: [execute, read, edit, search, ask_user]
user-invocable: true
argument-hint: "install packs, initialize workspace, or repair binding"
---

# Workspace Onboarding

Choose one mode. Read only its reference:

- **Install or update packs:** read
  [pack installation](references/pack-installation.md).
- **Initialize or repair a current workspace:** read
  [workspace initialization](references/workspace-initialization.md).
- **Reset an unsupported workspace:** stop and tell the operator to select
  `kai-core-workspace-reonboard`. Never inspect, translate, or import its old
  private records.

Do not load both references for one request.

## Shared boundary

Invoke each additional Core skill directly at the decision that needs it. If a
required Core skill is unavailable, answer direct questions only; change no
plugin or `.kai` state.

Apply `kai-core-operating-rules` before confirmation, Git changes, plugin
changes, or other operator-only decisions.

Apply `kai-core-workspace-paths` only for workspace initialization or repair,
before resolving the project, placement, registry, publication root, or
coordination database.

## Initialize

Require an absolute project root, `external` or `repo-local` placement, and
stable workspace/project IDs. Inspect first and show exact creates, keeps,
conflicts, registry changes, and managed blocks.

Obtain explicit approval before changing a non-empty target, registry binding,
Git tracking, or project `AGENTS.md`.

Apply `kai-core-work-acting` after approval and immediately before the first
filesystem or registry mutation.

Run the confirmed standalone initializer:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" \
  --initialize --root "<workspace-root>" --confirm
```

Then run:

```text
node "<kai-plugin>/scripts/workspace-doctor.mjs" --root "<workspace-root>"
node "<kai-plugin>/scripts/coordinate.mjs" inspect --root "<workspace-root>"
```

The initializer creates only the schema-6 manifest, Core coordination database,
and `docs/kai/README.md`. It never initializes optional package runtimes or
seeds package artifact directories.

For `repo-local`, verify `.kai/` is ignored and untracked. For `external`,
register the exact project/workspace pair and create no project-local `.kai/`.

Offer once to install `scripts/lib/repository-instructions-block.md`. If
`AGENTS.md` does not exist, create it. Otherwise replace only the marked Kai
region and preserve every other byte. Never stage or commit the file without
separate operator authorization.

## Result

Return the selected mode, exact verified state, changes made, checks performed,
unknowns, and one next action. Stop on the first failed or unverified mutation;
never manufacture rollback or readiness.

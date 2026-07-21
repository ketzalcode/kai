---
name: workspace-onboarding
description: "Shared initialization and validation method for kai workspaces. Creates the .kai sentinel and ignored runs subtree, coordination registries, initiative catalog, promoted library, and personal lane idempotently; installs exact gitignore rules; detects partial or legacy layouts; and prevents agents from writing before the workspace contract is valid."
tools: [bash, view, edit, create, grep, glob, ask_user]
---

# Workspace Onboarding

This skill defines **how** a workspace becomes compliant with
`workspace-conventions`. `workflow-workspace-init` executes it. Other agents
may use the validation checks, but they do not scaffold partial structures.

## Inputs

- exact runtime absolute `workspace_root`;
- `workspace_mode`: `repository` or `external`;
- plugin version from `plugin.json`;
- operator approval before changing a non-empty workspace.

No root-name customization and no legacy compatibility aliases are supported.

## Required structure

Create missing paths without overwriting existing content:

```text
.kai/
  manifest.json
  CONVENTIONS.md
  runs/
    qa/ eng/ product/ review/ ship/ ai/ learn/ lessons/ pulse/ content/
coordination/
  ACTIVE.md
  BOARD.md
  backlog.md
  items/README.md
  threads/README.md
initiatives/
  README.md
  INDEX.md
library/
  README.md
  reviews/ dev-designs/ investigations/ briefings/ qa-findings/
  lessons/ digests/ learnings/ releases/ playbooks/ content/
personal/
  README.md
  inbox.md
  agenda.md
  workspaces.md
  consultations/
  decisions/
  identity/
    README.md
    voice.md
    career-snapshot.md
    skills-inventory.md
    current-work.md
    career-goals.md
  lessons/ courses/ certs/ growth/
```

Initiative slug directories and their `artifacts/` subtrees are created by
`workflow-initiative-init`, not by general onboarding.

## Repository-mode ignore block

Install or replace exactly one managed block:

```gitignore
# >>> kai workspace (managed by workflow-workspace-init) >>>
# Raw kai runs and personal material are local-only.
/.kai/runs/
/personal/
# Retired local state stays private during explicit migration.
/.persona-self/
/.kai/local.json
# Heavy binaries stay ignored inside the committed library.
library/**/*.mp3
library/**/*.har
library/**/*.zip
library/**/audio/
library/**/raw/
library/**/screenshots/
**/storageState*.json
# <<< kai workspace <<<
```

`.kai/manifest.json` and `.kai/CONVENTIONS.md` must remain trackable. After
writing the block, verify:

- `.kai/runs/` is ignored;
- `personal/` is ignored;
- a legacy `.persona-self/` is ignored until migration completes;
- a legacy `.kai/local.json` is ignored until deletion is approved;
- `.kai/manifest.json`, `.kai/CONVENTIONS.md`, `coordination/`,
  `initiatives/`, and textual `library/` files are not ignored.

If these checks fail, onboarding fails. Do not allow browser or evidence runs
to write credentials or raw state before ignore validation succeeds.

External mode uses the same structure but modifies and verifies `.gitignore`
only when the external directory is already a Git repository. For a non-Git
external workspace, report ignore checks as `n/a (not version-controlled)`;
do not fail onboarding or claim the paths are gitignored.

## Seed files

### `.kai/manifest.json`

Use the exact schema from `workspace-conventions`, including fixed roots for
`.kai/runs`, `coordination`, `initiatives`, `library`, and `personal`.
Repository mode persists `workspace_root: "."`; external mode persists the
operator-confirmed absolute root.

If an existing manifest contains the retired `workspace_kind` field, plan an
idempotent schema migration that removes **only** that field and preserves every
other value. In a non-empty workspace, show the exact manifest diff with the
rest of the onboarding plan before applying it.

### `.kai/CONVENTIONS.md`

Render the current workspace layout, routing table, initiative artifact
defaults, library promotion invariant, and coordination authority. The skill is
authoritative if this rendered file ever drifts.

### `coordination/ACTIVE.md`

Seed an empty focus pointer explaining that each active row names an initiative
slug and why it is active.

### `coordination/BOARD.md`

Seed:

```markdown
| id | title | initiative | milestone | priority | state | owner | next | depends-on | waiting-on | updated |
```

State that it is derived from `coordination/items/*.md`.

### `coordination/items/README.md`

Document the authoritative work-item schema, lifecycle, typed dependencies,
lease, version, touch set, questions, review requirements, artifact target, and
evidence rules from `work-coordination`.

### `coordination/threads/README.md`

Document append-only `HANDOFF`, `QUESTION`, `ANSWER`, and recovery packets from
`work-coordination`.

### `coordination/backlog.md`

Explain that this is the sink for unaffiliated deferred proposals.
Initiative-scoped proposals belong in `initiatives/<slug>/backlog.md`.

### `initiatives/INDEX.md`

Seed:

```markdown
| slug | status | workspace | summary | deliverables | updated |
```

On re-runs, add missing rows discovered from
`initiatives/*/northstar.md` without replacing hand-edited rows.

### `initiatives/README.md`

Document the north-star schema, lifecycle, scope gate, stewardship, stable
milestones, `artifacts/` defaults, deliverable index, and closure summary.

### `library/README.md`

Document allowed types, required frontmatter, one-way steward-approved
promotion, provenance, and text-only commit rules.

### `personal/README.md`

Document the ignored workspace-local personal lane: operational
`inbox.md`/`agenda.md`, optional linked-workspace registry, consultation
records, decision briefs, identity/career files, and learning material. Explain
that linked workspaces contribute read-only coordination signals and that
personal material is never promoted automatically.

### Personal operational and identity stubs

Create only when missing:

- `personal/inbox.md` — the `personal-agenda` task/reminder schema.
- `personal/agenda.md` — derived on demand; not hand-maintained.
- `personal/workspaces.md` — fenced YAML with `workspaces: []`.
- `personal/consultations/` — private consultation records.
- `personal/decisions/` — private operator decision briefs.
- `personal/identity/README.md` — ownership and privacy of the identity files.
- `personal/identity/voice.md` — stub owned by `extract-writing-style`, with
  frontmatter `status: stub`.
- `personal/identity/career-snapshot.md`,
  `personal/identity/skills-inventory.md`,
  `personal/identity/current-work.md`, and
  `personal/identity/career-goals.md` — stubs owned by
  `principal-engineer-career-mentor`; each carries `status: stub`.

Never invent identity or career content and never overwrite populated files.

## Legacy and partial-layout handling

The new contract does not preserve or write legacy roots. If `.ketzal/`,
`knowledge/`, `.persona-self/`, `.kai/local.json`, or operational files under
`initiatives/items`,
`initiatives/threads`, `initiatives/ACTIVE.md`, or `initiatives/BOARD.md`
exist:

1. report every detected legacy path;
2. propose exact source-to-destination moves;
3. ask before moving or rewriting user content;
4. never create both layouts as a compatibility strategy;
5. never delete the legacy source automatically.

For `.persona-self/`, propose file-for-file moves into `personal/identity/`.
Do not create fresh identity stubs alongside populated legacy files; migration
must be explicit so the user's private profile is not forked.

For `.kai/local.json`, report that the pointer is retired and propose deletion.
Keep it ignored until the operator approves deletion; never expose its
machine-local absolute path through `git status`.

If a required new path conflicts with an existing file or incompatible
directory, stop with the exact conflict.

## Idempotence

- Create missing paths.
- Keep matching paths.
- Ask before replacing divergent seeded files.
- Never delete user content.
- Never commit, stage, or push.
- Re-running a valid workspace produces no semantic changes.

## Validation result

Return:

```text
Workspace: <absolute root>
Mode: <repository|external>
Contract: valid | blocked
Created: <paths>
Kept: <paths>
Legacy detected: <paths or none>
Conflicts: <paths or none>
Ignore checks: <pass/fail details>
Next: <workspace ready or exact blocking action>
```

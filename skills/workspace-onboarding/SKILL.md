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
- `workspace_kind`: for a new manifest, `product` by default and `pal` only when
  invoked by `workflow-pal-setup`; preserve an existing valid kind on reruns;
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
    qa/ eng/ product/ review/ ship/ ai/ learn/ lessons/ pulse/
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
  lessons/ digests/ learnings/ releases/ playbooks/
personal/
  README.md
  lessons/ courses/ certs/ growth/
```

Initiative slug directories and their `artifacts/` subtrees are created by
`workflow-initiative-init`, not by general onboarding.

## Repository-mode ignore block

Install or replace exactly one managed block:

```gitignore
# >>> kai workspace (managed by workflow-workspace-init) >>>
/.kai/runs/
/.kai/local.json
/personal/
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
- `.kai/local.json` is ignored;
- `personal/` is ignored;
- `.kai/manifest.json`, `.kai/CONVENTIONS.md`, `coordination/`,
  `initiatives/`, and textual `library/` files are not ignored.

If these checks fail, onboarding fails. Do not allow browser or evidence runs
to write credentials or raw state before ignore validation succeeds.

External mode uses the same structure but modifies `.gitignore` only when the
external directory is already a Git repository.

## Seed files

### `.kai/manifest.json`

Use the exact schema from `workspace-conventions`, including `workspace_kind`
and fixed roots for `.kai/runs`, `coordination`, `initiatives`, `library`, and
`personal`. New ordinary onboarding writes `workspace_kind: product`;
`workflow-pal-setup` writes `pal` for a new confirmed home base. A rerun
preserves the existing valid kind unless the operator explicitly approves an
authorized product↔pal migration; never relabel by default.
Repository mode persists `workspace_root: "."`; external mode persists the
operator-confirmed absolute root.

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

Document the ignored personal lane — operational `inbox.md`/`agenda.md`, the
home-base `workspaces.md` registry, private consultation records, and learning
material — plus explicit promotion to `library/lessons/`.

## Legacy and partial-layout handling

The new contract does not preserve or write legacy roots. If `.ketzal/`,
`knowledge/`, or operational files under `initiatives/items`,
`initiatives/threads`, `initiatives/ACTIVE.md`, or `initiatives/BOARD.md`
exist:

1. report every detected legacy path;
2. propose exact source-to-destination moves;
3. ask before moving or rewriting user content;
4. never create both layouts as a compatibility strategy;
5. never delete the legacy source automatically.

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
Workspace kind: <product|pal>
Next: <workspace ready or exact blocking action>
```

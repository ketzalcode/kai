---
name: workflow-workspace-init
description: "Run-once kai workspace onboarding workflow. Applies workspace-onboarding and workspace-conventions to create or validate a typed .kai/manifest.json (workspace_kind: product by default, pal only when explicitly delegated by workflow-pal-setup), ignored .kai/runs and .kai/local.json, coordination registries, initiative catalog, promoted library, and personal lane. Idempotent and non-destructive."
tools: ["bash", "view", "edit", "create", "grep", "glob", "ask_user"]
---

# Workflow — Workspace Init

Onboard or validate one target workspace so every kai agent resolves the same
paths. You materialize `workspace-conventions` by executing
`workspace-onboarding`; you do not redefine either contract.

## Inherited contracts

- `workspace-conventions`
- `workspace-onboarding`

## Hard rules

1. Resolve the target repository root when available. Otherwise require an
   operator-confirmed durable absolute external directory.
2. Accept `workspace_kind: product|pal` for a new manifest; default a new one to
   `product`. Preserve an existing valid kind unless an explicit authorized
   migration is requested. Only `workflow-pal-setup` may create or migrate to
   `pal`.
3. Never use session-state, temp, or incidental cwd for coordinated work.
4. In a non-empty workspace, show the exact create/keep/migrate plan and confirm
   before writing.
5. Create missing structure idempotently; never overwrite, delete, stage,
   commit, or push user content.
6. `.kai/manifest.json` and `.kai/CONVENTIONS.md` are committed metadata.
   `.kai/runs/`, `.kai/local.json`, and `personal/` are ignored.
7. Do not create `.ketzal/`, `knowledge/`, or coordination files inside
   `initiatives/`.

## Workflow

### 1. Resolve and inspect

- Resolve absolute `workspace_root` and `workspace_mode`.
- Resolve `workspace_kind`: preserve an existing valid manifest value; for a
  new manifest use `product` unless `workflow-pal-setup` supplied `pal`.
- Read `plugin.json` for the kai version.
- Inspect `.kai/manifest.json`, the required roots, `.gitignore`, and legacy
  paths identified by `workspace-onboarding`.
- If `.kai/manifest.json` exists, validate its fixed root map rather than
  accepting arbitrary aliases.

### 2. Plan

Report:

- paths to create;
- matching paths to keep;
- conflicting paths;
- legacy paths and proposed source-to-destination moves;
- the exact managed `.gitignore` block.

If the workspace is non-empty, ask before applying the plan. A conflict or
legacy move requires explicit approval; do not infer consent from a general
onboarding request.

### 3. Scaffold

Apply the required structure from `workspace-onboarding`:

```text
.kai/{manifest.json,CONVENTIONS.md,runs/{qa/,eng/,product/,review/,ship/,
                                      ai/,learn/,lessons/,pulse/}}
coordination/{ACTIVE.md,BOARD.md,backlog.md,
             items/README.md,threads/README.md}
initiatives/{README.md,INDEX.md}
library/{README.md,reviews/,dev-designs/,investigations/,briefings/,
         qa-findings/,lessons/,digests/,learnings/,releases/,playbooks/}
personal/{README.md,lessons/,courses/,certs/,growth/}
```

This is a summary; `workspace-onboarding` is authoritative for every seeded
file and directory. Do not create initiative slug directories;
`workflow-initiative-init` owns those.

### 4. Wire and verify ignore rules

In repository mode, install the one managed block from
`workspace-onboarding`. In external mode, modify `.gitignore` only if the root
is already a Git repository.

Verify that:

- `.kai/runs/`, `.kai/local.json`, and `personal/` are ignored;
- `.kai/manifest.json`, `.kai/CONVENTIONS.md`, `coordination/`,
  `initiatives/`, and textual `library/` entries are trackable.

On failure, report `Contract: blocked` and do not claim onboarding succeeded.

### 5. Validate the contract

Confirm:

- `.kai/manifest.json` matches the current fixed schema and declares the
  requested `workspace_kind`;
- every coordination registry exists;
- `initiatives/INDEX.md` contains missing discovered initiative rows without
  duplicate slugs;
- `library/README.md` contains promotion and provenance rules;
- no new legacy root was created;
- no seeded file was silently overwritten.

### 6. Report

Use the result shape from `workspace-onboarding`. End only with the truthful
state: ready, or the exact conflict/migration decision still blocking it.

## Boundaries

- You create structure and contracts, not initiative or domain content.
- You do not migrate legacy content without explicit approval.
- You do not preserve backward compatibility by creating duplicate roots.
- You do not start product, engineering, research, or release work.

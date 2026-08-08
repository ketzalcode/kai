---
name: workflow-workspace-init
description: "Run-once kai workspace onboarding workflow for any repository or durable standalone folder. Applies workspace-onboarding and workspace-conventions to create or validate .kai/manifest.json, ignored .kai/runs, coordination registries, initiative catalog, promoted library, and complete workspace-local kai/personal/assistant state including identity stubs. Idempotent and non-destructive."
tools: ["bash", "view", "edit", "create", "grep", "glob", "ask_user"]
---

**Inherits:** `team-operating-rules`, `workspace-conventions`, `work-coordination`, `workspace-onboarding`

> Load and apply every skill listed above before you act — they are part of your
> instructions, not background reading. If one cannot be loaded, these
> non-negotiables still bind you: resolve a durable target workspace root before
> creating state, never Copilot session-state or a temp directory; stay in your
> lane and route work outside it as a proposal instead of doing it; keep
> coordinated work claimed, evidenced, and handed off rather than silently in
> progress; never call something `shipped` that a human has not deployed and
> verified; and escalate to `@operator` only for a decision no kai role owns.

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
2. Never use session-state, temp, or incidental cwd for coordinated work.
3. In a non-empty workspace, show the exact create/keep/migrate plan and confirm
   before writing.
4. Create missing structure idempotently; never overwrite, delete, stage,
   commit, or push user content.
5. `.kai/manifest.json` and `.kai/CONVENTIONS.md` are committed metadata.
   `.kai/runs/` and `kai/personal/` are ignored.
6. Do not create `.ketzal/`, `knowledge/`, `.persona-self/`, or coordination files inside
   `kai/initiatives/`.

## Workflow

### 1. Resolve and inspect

- Resolve absolute `workspace_root` and `workspace_mode`.
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

Apply the **spine** from `workspace-onboarding` — everything except the two
output-only lanes:

```text
.kai/{manifest.json,CONVENTIONS.md,runs/}
kai/coordination/{ACTIVE.md,BOARD.md,backlog.md,
             items/README.md,threads/README.md}
kai/initiatives/{README.md,INDEX.md}
kai/library/README.md
kai/personal/{README.md,inbox.md,agenda.md,workspaces.md,consultations/,decisions/,proactive/,
          identity/{README.md,voice.md,career-snapshot.md,skills-inventory.md,
                    current-work.md,career-goals.md},
          lessons/,courses/,certs/,growth/}
```

Do **not** pre-create run areas or library types. Those are materialized on
first write by the agent that writes into them: `kai/library/<type>/` is tracked
and git cannot track an empty directory, so a pre-created lane would not survive
a clone; `.kai/runs/<area>/` is ignored and inherently per-run. An absent lane
is not a defect and never blocks work. The deferred vocabulary is:

```text
.kai/runs/{qa/,eng/,product/,revenue/,support/,review/,ship/,
           incident/,ai/,learn/,lessons/,pulse/,content/}
kai/library/{reviews/,dev-designs/,investigations/,briefings/,
         qa-findings/,lessons/,digests/,learnings/,releases/,playbooks/,content/}
```

Everything an agent reads at startup — including the whole gitignored
`kai/personal/` lane with its identity stubs and proactive state directory —
stays in the spine, so no role finds its own state missing.

If the operator explicitly asks to see the complete structure, materialize both
lanes in one pass as a convenience. Record nothing about that choice: it is not
a mode, and a workspace created either way is identical in contract.

This is a summary; `workspace-onboarding` is authoritative for every seeded
file and directory. Do not create initiative slug directories;
`workflow-initiative-init` owns those.

### 4. Wire and verify ignore rules

In repository mode, install the one managed block from
`workspace-onboarding`. In external mode, modify `.gitignore` only if the root
is already a Git repository.

Verify that:

- in a Git workspace, `.kai/runs/`, `kai/personal/`, and retired local-state paths
  are ignored while `.kai/manifest.json`, `.kai/CONVENTIONS.md`,
  `kai/coordination/`, `kai/initiatives/`, and textual `kai/library/` entries are trackable;
- in a non-Git external workspace, ignore checks are reported as `n/a` and do
  not block the structural contract.

On failure, report `Contract: blocked` and do not claim onboarding succeeded.

### 5. Validate the contract

Confirm:

- `.kai/manifest.json` was reconciled to the current fixed schema — missing
  fixed roots and `areas` (e.g. `content`) added, retired fields (e.g.
  `workspace_kind`) removed, and all other values preserved;
- every coordination registry exists;
- `kai/initiatives/INDEX.md` contains missing discovered initiative rows without
  duplicate slugs;
- `kai/library/README.md` contains promotion and provenance rules;
- no new legacy root was created;
- a legacy `.kai/local.json` remains ignored until approved deletion;
- personal operational and identity stubs exist without overwriting populated
  content;
- no seeded file was silently overwritten.

### 6. Report

Use the result shape from `workspace-onboarding`. End only with the truthful
state: ready, or the exact conflict/migration decision still blocking it.

## Boundaries

- You create structure and contracts, not initiative or domain content.
- You do not migrate legacy content without explicit approval.
- You do not preserve backward compatibility by creating duplicate roots.
- You do not start product, engineering, research, or release work.

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
    qa/ eng/ product/ revenue/ support/ review/ ship/ incident/ ai/ learn/ lessons/ pulse/ content/
kai/coordination/
  ACTIVE.md
  BOARD.md
  backlog.md
  items/README.md
  threads/README.md
kai/initiatives/
  README.md
  INDEX.md
kai/library/
  README.md
  reviews/ dev-designs/ investigations/ briefings/ qa-findings/
  lessons/ digests/ learnings/ releases/ playbooks/ content/
kai/personal/
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
/kai/personal/
# Retired local state stays private during explicit migration.
/.persona-self/
/.kai/local.json
# Retired schema-1 root-level personal lane stays private until migration completes.
/personal/
# Heavy binaries stay ignored inside the committed library.
kai/library/**/*.mp3
kai/library/**/*.har
kai/library/**/*.zip
kai/library/**/audio/
kai/library/**/raw/
kai/library/**/screenshots/
**/storageState*.json
# <<< kai workspace <<<
```

`.kai/manifest.json` and `.kai/CONVENTIONS.md` must remain trackable. After
writing the block, verify:

- `.kai/runs/` is ignored;
- `kai/personal/` is ignored;
- a legacy root-level `personal/` is ignored until migration completes;
- a legacy `.persona-self/` is ignored until migration completes;
- a legacy `.kai/local.json` is ignored until deletion is approved;
- `.kai/manifest.json`, `.kai/CONVENTIONS.md`, `kai/coordination/`,
  `kai/initiatives/`, and textual `kai/library/` files are not ignored.

If these checks fail, onboarding fails. Do not allow browser or evidence runs
to write credentials or raw state before ignore validation succeeds.

External mode uses the same structure but modifies and verifies `.gitignore`
only when the external directory is already a Git repository. For a non-Git
external workspace, report ignore checks as `n/a (not version-controlled)`;
do not fail onboarding or claim the paths are gitignored.

## Seed files

### `.kai/manifest.json`

Use the exact schema from `workspace-conventions`, including fixed roots for
`.kai/runs`, `coordination`, `initiatives`, `library`, and `personal`, and the
current `areas` list. Repository mode persists `workspace_root: "."`; external
mode persists the operator-confirmed absolute root.

**Reconcile an existing manifest to the current schema** rather than patching a
single field. Plan one idempotent migration that:

- adds any missing fixed-root keys and any `areas` entries the current schema
  defines but the file lacks (e.g. a workspace predating the `content` area);
- removes retired fields (e.g. `workspace_kind`);
- preserves every other value and the operator-confirmed root verbatim.

In a non-empty workspace, show the exact manifest diff with the rest of the
onboarding plan before applying it. This reconciliation is what "matches the
current fixed schema" means — a re-run brings an old manifest fully up to date.

**Schema-version migration ladder.** `schema_version` (independent of the plugin
`version`) drives upgrades deterministically. The current contract is
**schema version 2**. Migrations are an ordered, idempotent ladder — apply each
step whose version is above the manifest's `schema_version`, in order, then set
`schema_version` to the current value:

- **→ 1 (baseline / pre-schema):** a manifest with no `schema_version` (or `0`)
  is a pre-schema workspace. Add `schema_version: 1`, apply the fixed-root/`areas`
  reconciliation above, and remove retired fields. No coordination-record changes.
- **→ 2 (working corpus moves under `kai/`):** a schema-1 workspace keeps
  `coordination/`, `initiatives/`, `library/`, and `personal/` at the workspace
  root. Move each to `kai/<root>/` **preserving history** (`git mv` when the path
  is tracked, a plain move otherwise), add the `corpus` root and the `kai/`-prefixed
  root values to the manifest, and re-install the managed ignore block so
  `kai/personal/` is ignored. `.kai/` does not move — the sentinel path is
  unchanged. Content is **not** rewritten wholesale: relative links inside moved
  files still resolve because the four roots move together, but any *absolute*
  workspace-root-relative reference to a bare retired root (for example
  `initiatives/<slug>/…` written into a work item) is repointed to `kai/…`.
  Report every moved path. If a bare root and its `kai/` counterpart both exist,
  stop with a split-brain error and let the operator reconcile — never merge
  silently.

When a future release changes the generated workspace contract it appends the
next numbered step here and bumps the current version; it never rewrites an
existing step. Re-running a completed migration is a no-op. The workspace doctor
(`node <kai-plugin>/scripts/workspace-doctor.mjs`) reports which steps a workspace
still needs; coordinated agents refuse to claim work until the ladder is applied.

### `.kai/CONVENTIONS.md`

Render the current workspace layout, routing table, initiative artifact
defaults, library promotion invariant, and coordination authority. The skill is
authoritative if this rendered file ever drifts.

### `kai/coordination/ACTIVE.md`

Seed an empty focus pointer explaining that each active row names an initiative
slug and why it is active.

### `kai/coordination/BOARD.md`

Seed:

```markdown
| id | title | initiative | milestone | priority | state | owner | next | depends-on | waiting-on | updated |
```

State that it is derived from `kai/coordination/items/*.md`.

### `kai/coordination/items/README.md`

Document the authoritative work-item schema, lifecycle, typed dependencies,
lease, version, touch set, questions, review requirements, artifact target, and
evidence rules from `work-coordination`.

### `kai/coordination/threads/README.md`

Document append-only `HANDOFF`, `QUESTION`, `ANSWER`, and recovery packets from
`work-coordination`.

### `kai/coordination/backlog.md`

Explain that this is the sink for unaffiliated deferred proposals.
Initiative-scoped proposals belong in `kai/initiatives/<slug>/backlog.md`.

### `kai/initiatives/INDEX.md`

Seed:

```markdown
| slug | status | workspace | summary | deliverables | updated |
```

On re-runs, add missing rows discovered from
`kai/initiatives/*/northstar.md` without replacing hand-edited rows.

### `kai/initiatives/README.md`

Document the north-star schema, lifecycle, scope gate, stewardship, stable
milestones, `artifacts/` defaults, deliverable index, and closure summary.

### `kai/library/README.md`

Document allowed types, required frontmatter, one-way steward-approved
promotion, provenance, and text-only commit rules.

### `kai/personal/README.md`

Document the ignored workspace-local personal lane: operational
`inbox.md`/`agenda.md`, optional linked-workspace registry, consultation
records, decision briefs, identity/career files, and learning material. Explain
that linked workspaces contribute read-only coordination signals and that
personal material is never promoted automatically.

### Personal operational and identity stubs

Create only when missing:

- `kai/personal/inbox.md` — the `personal-agenda` task/reminder schema.
- `kai/personal/agenda.md` — derived on demand; not hand-maintained.
- `kai/personal/workspaces.md` — fenced YAML with `workspaces: []`.
- `kai/personal/consultations/` — private consultation records.
- `kai/personal/decisions/` — private operator decision briefs.
- `kai/personal/proactive/` — proactive-scan delivery ledger (`snapshot.json`),
  `outbox/`, and a `channels.md` stub with `consent: no` by default. Used by an
  external runner; see `proactive-scan`. Never committed.
- `kai/personal/identity/README.md` — ownership and privacy of the identity files.
- `kai/personal/identity/voice.md` — stub owned by `extract-writing-style`, with
  frontmatter `status: stub`.
- `kai/personal/identity/career-snapshot.md`,
  `kai/personal/identity/skills-inventory.md`,
  `kai/personal/identity/current-work.md`, and
  `kai/personal/identity/career-goals.md` — stubs owned by
  `principal-engineer-career-mentor`; each carries `status: stub`.

Never invent identity or career content and never overwrite populated files.

## Legacy and partial-layout handling

The new contract does not preserve or write legacy roots. If `.ketzal/`,
`knowledge/`, `.persona-self/`, `.kai/local.json`, a **schema-1 root-level
`coordination/`, `initiatives/`, `library/`, or `personal/`**, or operational
files under
`kai/initiatives/items`,
`kai/initiatives/threads`, `kai/initiatives/ACTIVE.md`, or `kai/initiatives/BOARD.md`
exist:

1. report every detected legacy path;
2. propose exact source-to-destination moves;
3. ask before moving or rewriting user content;
4. never create both layouts as a compatibility strategy;
5. never delete the legacy source automatically.

For `.persona-self/`, propose file-for-file moves into `kai/personal/identity/`.
Do not create fresh identity stubs alongside populated legacy files; migration
must be explicit so the user's private profile is not forked.

For `.kai/local.json`, report that the pointer is retired and propose deletion.
Keep it ignored until the operator approves deletion; never expose its
machine-local absolute path through `git status`.

For `knowledge/` (an earlier root that mixed research, decisions, and notes),
**never bulk-move it** — the whole point of the current contract is to split it.
Classify each artifact and propose a per-item destination, operator-confirmed:

- initiative-scoped research or decisions → `kai/initiatives/<slug>/artifacts/research/`
  or `kai/initiatives/<slug>/artifacts/decisions/`;
- cross-initiative reusable outcomes → the matching `kai/library/<type>/`;
- raw or regenerable scratch → `.kai/runs/`.

An item whose classification is ambiguous stays put until the operator decides;
do not guess a destination.

For `.ketzal/` (a retired kai home/runs root), propose moving its raw runs and
evidence under `.kai/runs/` and any committed contract/metadata under `.kai/`,
operator-confirmed; never recreate `.ketzal/`.

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

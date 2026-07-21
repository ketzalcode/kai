---
name: workspace-conventions
description: "Shared output-routing contract for every file-producing kai agent. Resolves one target workspace, uses .kai/manifest.json as the bootstrap sentinel, separates ignored raw runs, global coordination, initiative-owned artifacts, promoted library outcomes, and personal material, and defines canonical product-map, brief, research, design, decision, evidence, and delivery paths."
tools: [bash, view, grep, glob]
---

# Workspace Conventions

This skill is the single source of truth for **where** kai agents read and
write. Domain agents own what they produce; this contract owns where it lands.
`workflow-workspace-init` materializes it through `workspace-onboarding`.

**Never invent an output path.** Resolve the target workspace first, then use
the canonical path for the artifact type. If an output does not fit this
contract, stop and ask the operator rather than creating another root.

## Workspace anchor

Every coordinated run resolves one **target workspace root** before writing or
dispatching:

1. Use the absolute workspace root from the work packet verbatim.
2. A loaded north star uses `workspace.root: .` in repository mode; resolve it
   against the repository containing `.kai/manifest.json`. External mode stores
   the confirmed absolute root.
3. Otherwise use the target repository root when that repository is available.
4. Otherwise ask for an operator-confirmed durable absolute external directory.

Copilot session-state, OS temp directories, and incidental agent cwds are never
silent roots for coordinated or initiative work.

The bootstrap sentinel is always:

```text
<workspace-root>/.kai/manifest.json
```

If it is missing, coordinated work stops and invokes `workflow-workspace-init`
for the confirmed root. One-shot ephemeral work may use `<cwd>/.kai/runs/` only
when the operator explicitly requested a local throwaway run.

## Workspace layout

```text
<workspace-root>/
├─ .kai/
│  ├─ manifest.json                  # committed bootstrap and root map
│  ├─ CONVENTIONS.md                 # committed human-readable contract
│  └─ runs/                          # ignored raw evidence and scratch
├─ coordination/
│  ├─ ACTIVE.md                      # active initiative pointer
│  ├─ BOARD.md                       # derived cross-effort view
│  ├─ backlog.md                     # unaffiliated proposals
│  ├─ items/<item-id>.md             # authoritative work state
│  └─ threads/<item-id>.md           # append-only handoffs and Q&A
├─ initiatives/
│  ├─ README.md                      # initiative contract and schema
│  ├─ INDEX.md                       # durable all-status catalog
│  └─ <slug>/
│     ├─ northstar.md
│     ├─ log.md
│     ├─ backlog.md
│     ├─ deliverables.md
│     ├─ director-summary.md
│     └─ artifacts/
│        ├─ product-map.md
│        ├─ briefs/
│        ├─ research/
│        ├─ designs/
│        └─ decisions/
├─ library/
│  ├─ README.md
│  ├─ reviews/        dev-designs/    investigations/   briefings/
│  ├─ qa-findings/    lessons/        digests/          learnings/
│  └─ releases/       playbooks/
└─ personal/
   ├─ README.md
   ├─ inbox.md         agenda.md          # workspace-local assistant state
   ├─ workspaces.md                       # optional linked-workspace registry
   ├─ consultations/                     # private peer-consultation records
   ├─ identity/
   │  ├─ README.md     voice.md
   │  └─ career-snapshot.md  skills-inventory.md
   │     current-work.md      career-goals.md
   └─ lessons/        courses/            certs/            growth/
```

## Placement model

| Location | Meaning | Git in repository mode |
|---|---|---|
| `.kai/manifest.json`, `.kai/CONVENTIONS.md` | kai bootstrap and contract | committed |
| `.kai/runs/` | raw, regenerable, heavy, or scratch evidence | ignored |
| `coordination/` | operational state shared across concurrent efforts | committed |
| `initiatives/<slug>/` | strategic context and outputs owned by one initiative | committed |
| `library/` | curated outcomes intentionally reusable across initiatives | committed text |
| `personal/` | portable personal operational, career, and learning material | ignored |

`coordination/` answers “what is happening now?” `initiatives/` answers “why
are we doing this, and what did this effort produce?” Work items and threads
stay flat because dependencies, handoffs, and collisions can cross initiatives;
each item records its `initiative:` membership.

## Current workspace and optional linked workspaces

Kai has no special home workspace. Any repository or operator-confirmed durable
folder can be a complete Kai workspace. The current workspace — the root whose
`.kai/manifest.json` was resolved for this session — owns its coordination,
initiatives, library, assistant state, identity, and personal material.

If the manifest is missing, invoke `workflow-workspace-init` for the current
repository or confirmed folder before using the assistant. Do not search for a
global home, machine-specific pointer, or special workspace kind.

`personal/workspaces.md` is an optional registry of additional Kai workspaces
whose coordination signals should be included in the current workspace's
agenda:

````markdown
# Linked Kai workspaces (local · gitignored)

```yaml
workspaces:
  - label: payments
    root: C:\src\payments
    enabled: true
```
````

The current workspace is always included implicitly and never needs a registry
row. Linked roots are absolute local paths, deduped by normalized path, and
carry unique labels. The executive assistant validates each enabled root's
manifest, reads its `coordination/` state read-only, skips invalid or unavailable
roots with an explicit gap, and labels surfaced signals with the registry label.
When the operator names another workspace, confirm its label and root before
adding or updating the local registry. No back-pointer or pairing file is
written into the linked workspace.

## Raw run grammar

All ephemeral runs use:

```text
<workspace-root>/.kai/runs/<area>/<target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/<artifact>
```

Within existing agent prompts, `<working-root>` is an alias for the fixed
`<workspace-root>/.kai/runs` path. It is not configurable.

- Slugs are lowercase ASCII kebab-case and stable for the same target.
- Timestamps use local 24-hour `YYYY-MM-DD-HHMM`.
- One agent run owns one timestamped folder.
- Raw credentials, cookies, tokens, and browser state never leave `.kai/runs/`.

### Area registry

| Area | Owners | Flavors |
|---|---|---|
| `qa` | product-explore, qa-ui, seo, PM, persona agents | `explore`, `pm`, `qa`, `ux`, `seo`, `trainer`, `nutritionist` |
| `eng` | SWE architect, manager, frontend, backend, infra | `arch`, `scope`, `frontend`, `backend`, `infra` |
| `product` | product strategist | `strategy` |
| `review` | workflow-doc-review | `doc` |
| `ship` | workflow-ship | `ship` |
| `ai` | AI researcher and applied engineer | `research`, `applied` |
| `learn` | course-to-audio and teacher | target-specific |
| `lessons` | engineer tutor | tutor/theme-specific |
| `pulse` | weekly pulse | week-specific |

Add a registry entry before creating a new area.

## Initiative-owned artifacts

When an item belongs to an initiative, its durable working output defaults to
that initiative:

| Artifact | Canonical default |
|---|---|
| Product surface map | `initiatives/<slug>/artifacts/product-map.md` |
| PM product brief | `initiatives/<slug>/artifacts/briefs/<item-id>.md` |
| Research memo | `initiatives/<slug>/artifacts/research/<item-id>.md` |
| Product design | `initiatives/<slug>/artifacts/designs/<item-id>.md` |
| Initiative decision/ADR | `initiatives/<slug>/artifacts/decisions/<item-id>.md` |
| Director closure summary | `initiatives/<slug>/director-summary.md` |
| Deliverable index | `initiatives/<slug>/deliverables.md` |

The creator sets `artifact_target` to this canonical workspace-root-relative
path. An operator-supplied path may override it only when it remains within the
resolved workspace and the item records the reason.

Unaffiliated durable work goes to the matching `library/<type>/` location
rather than creating an artificial initiative.

## Promotion to the library

`library/` is not a general output folder. It contains **promoted,
cross-initiative outcomes** that another effort can intentionally reuse.

The flow is one-way:

```text
.kai/runs/ -> initiatives/<slug>/artifacts/ -> library/<type>/
```

Rules:

1. Initiative work defaults to its `artifacts/` tree.
2. Agents never write directly to `library/` merely because a destination is
   unclear.
3. Promotion is steward-approved and recorded in `deliverables.md`.
4. The promoted entry records source initiative, source artifact, owner, and
   evidence provenance.
5. After promotion, the library path is canonical for cross-initiative use.
   The initiative copy remains read-only provenance.
6. New conclusions create a new entry or revision; do not silently overwrite a
   promoted record.

### Library types

| Outcome | Library destination |
|---|---|
| Document review | `library/reviews/` |
| Engineering or architecture decision | `library/dev-designs/` |
| Product/strategy investigation | `library/investigations/` |
| AI landscape briefing | `library/briefings/` |
| Promoted QA/persona finding | `library/qa-findings/` |
| Team-shareable lesson | `library/lessons/` |
| Weekly digest | `library/digests/` |
| Atomic reusable learning | `library/learnings/` |
| Release record | `library/releases/` |
| Reusable procedure | `library/playbooks/` |

Heavy binaries remain ignored even below `library/`: `*.mp3`, `*.har`,
`*.zip`, `audio/`, `raw/`, and `screenshots/`.

### Library frontmatter

```yaml
---
type: <library type>
title: <human title>
slug: <kebab-slug>
created: <YYYY-MM-DD>
source: <agent + source path>
target: <feature, document, repository, or URL>
initiative: <slug or null>
source_artifact: <initiative artifact path or null>
related: []
evidence:
  - path: <exact workspace-root-relative path>
    source: <tool/site/reviewer>
    captured: <YYYY-MM-DD-HHMM or n/a>
---
```

## Initiatives

Before substantial project or feature work, read `coordination/ACTIVE.md`. For
each active slug, load `initiatives/<slug>/northstar.md` only when the target
matches its repositories, targets, keywords, or the operator's stated goal.
Unrelated work remains context-free.

When loaded:

1. Read `mission`, `vision`, `scope.current`, the referenced milestones, and
   `principles.non_negotiable`.
2. Apply `scope-discipline` before acting.
3. Claim and update `coordination/items/<item-id>.md`.
4. Append handoffs and questions to `coordination/threads/<item-id>.md`.
5. Add durable outputs and local evidence to `deliverables.md`.

### North-star frontmatter

```yaml
---
type: initiative
title: <human title>
slug: <kebab-slug>
status: proposed
horizon: <e.g. 2026-Q3>
mission: <one line>
vision: <one line>
workspace:
  mode: <repository|external>
  root: <"." in repository mode | absolute external root>
  run_root: <".kai/runs" in repository mode | absolute external run root>
  manifest: <".kai/manifest.json" in repository mode | absolute external path>
scope:
  repos: []
  targets: []
  keywords: []
  current: []
  out_of_scope: []
  deferred: []
principles:
  non_negotiable: []
proposal_channel: initiatives/<slug>/backlog.md
created: <YYYY-MM-DD>
owner: principal-product-manager
related: []
success_measures: []
milestones:
  - id: <stable-kebab-id>
    outcome: <observable result>
    acceptance: []
    success_measures: []
    required_items: []
---
```

Milestone `required_items` is authoritative and typed:
`[{item: <id>, state: completed|shipped}]`. Research and decisions complete;
production changes ship. An empty mapping is incomplete.

`coordination/ACTIVE.md` is the operational focus pointer.
`initiatives/INDEX.md` is the permanent all-status catalog:

```markdown
| slug | status | workspace | summary | deliverables | updated |
```

Removing a terminal initiative from `ACTIVE.md` must not make it
undiscoverable.

## Proposals

An expansion discovered inside an initiative goes to
`initiatives/<slug>/backlog.md`. An unaffiliated proposal goes to
`coordination/backlog.md`. Proposals never fall back to `.kai/runs/`.

## Personal material

Personal operational state — your `inbox.md` task list, derived `agenda.md`,
optional linked-workspace registry, private consultation records, voice profile,
and career context — plus courses, certification notes, and private learning
live under `personal/`. `personal/identity/voice.md` is consumed by
`persona-self`; the career files under `personal/identity/` are owned by
`principal-engineer-career-mentor`. `workflow-workspace-init` seeds every stub
idempotently so the assistant is ready in any Kai workspace. Team-relevant
material may be promoted explicitly to `library/lessons/`; it is never promoted
automatically.

## Manifest

`.kai/manifest.json` is committed and deterministic:

```json
{
  "plugin": "kai",
  "version": "<plugin version at scaffold time>",
  "scaffolded": "<YYYY-MM-DD>",
  "workspace_mode": "<repository|external>",
  "workspace_root": "<'.' in repository mode | absolute external root>",
  "kai": ".kai",
  "runs": ".kai/runs",
  "coordination": "coordination",
  "initiatives": "initiatives",
  "library": "library",
  "personal": "personal",
  "areas": ["qa", "eng", "product", "review", "ship", "ai", "learn", "lessons", "pulse"]
}
```

Root names are contract constants. Do not add compatibility aliases or silently
create legacy `.ketzal/` or `knowledge/` roots.

## Agent checklist

1. Resolve the runtime absolute `<workspace-root>`; committed repository
   metadata stores `.` rather than a machine-specific clone path.
2. Require `.kai/manifest.json` for coordinated work.
3. Check `coordination/ACTIVE.md` and load only matching initiatives.
4. Use `.kai/runs/` for raw evidence and scratch.
5. Use the canonical initiative artifact path for initiative-owned output.
6. Promote to `library/` only through the explicit promotion rule.
7. Use `personal/` only for personal material.
8. Resolve personal state against the current Kai workspace; linked workspaces
   contribute coordination signals read-only.
9. Record exact workspace-root-relative paths; never abbreviate with `.../`.
10. Never create a root or artifact lane outside this contract.

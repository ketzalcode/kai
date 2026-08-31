---
name: kai-core-workspace-conventions
description: "Defines universal workspace output routing. Use when file-producing kai agents need target roots, .kai manifest validation, or canonical artifact paths."
tools: [execute, read, search]
---

# Workspace Conventions

This skill is the single source of truth for **where** kai agents read and
write. Domain agents own what they produce; this contract owns where it lands.
`workflow-workspace-init` materializes it through `kai-core-workspace-onboarding`.
`kai-core-asset-lifecycle` separately owns whether that output is scratch,
working, published, archived, current, stale, or superseded.

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
└─ kai/                              # visible human working corpus
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
   │        ├─ design-system.md
   │        ├─ marketing/
   │        ├─ content/
   │        ├─ customer-success/
   │        ├─ support/
   │        ├─ feedback/
   │        ├─ growth/
   │        ├─ analytics/
   │        ├─ experiments/
   │        ├─ pricing/
   │        ├─ sales/
   │        ├─ solutions/
   │        ├─ security/
   │        ├─ reliability/
   │        ├─ incidents/
   │        ├─ compliance/
   │        ├─ briefs/
   │        ├─ research/
   │        ├─ designs/
   │        ├─ decisions/
   │        ├─ docs/
   │        ├─ revops/
   │        ├─ campaigns/
   │        ├─ partnerships/
   │        ├─ localization/
   │        ├─ data-engineering/
   │        └─ brand/
   ├─ library/
   │  ├─ README.md
   │  ├─ reviews/        dev-designs/    investigations/   briefings/
   │  ├─ qa-findings/    lessons/        digests/          learnings/
   │  └─ releases/       playbooks/      content/
   └─ personal/
      ├─ README.md
      ├─ inbox.md         agenda.md          # workspace-local assistant state
      ├─ workspaces.md                       # optional linked-workspace registry
      ├─ consultations/                     # private peer-consultation records
      ├─ decisions/                         # private operator decision briefs
      ├─ proactive/                         # scan snapshot + outbox + channel config (runner)
      ├─ identity/
      │  ├─ README.md     voice.md
      │  └─ career-snapshot.md  skills-inventory.md
      │     current-work.md      career-goals.md
      └─ lessons/        courses/            certs/            growth/
```

**Two output-only lanes are created on first write, not at onboarding.**
`.kai/runs/<area>/` and `kai/library/<type>/` appear when something first writes
into them; the agent doing the writing creates the directory on the way, in the
same action, idempotently. Everything else above — including the whole
gitignored `kai/personal/` lane with its identity stubs and proactive state — is
seeded by onboarding, so no role ever finds its own startup state missing.

So: **never treat an absent run area or library type as an error, and never
refuse to act because one is missing.** Create the directory on the way to
writing your file. Do not pre-create lanes you are not writing to. `kai/library/`
is tracked and git cannot track an empty directory, so a pre-created lane would
silently vanish on the next clone and leave the tracked tree different from the
one onboarding reported building.

## Placement model

kai state splits on one axis: **control plane vs working corpus.**

- **`.kai/`** is the hidden control plane — the bootstrap sentinel, the
  contract, and regenerable raw evidence. It is machine state; a dotfolder
  is the right signal, and `.kai/manifest.json` stays the single, stable
  discovery anchor for every agent.
- **`kai/`** is the visible working corpus — northstars, decisions, work
  items, and curated outcomes that **humans browse, search, and edit.**
  This material is closer to `docs/` than to `.vscode/`, so it must not be
  hidden. Keeping it under one `kai/` parent also stops the generic retired
  root names from colliding with product directories at the repository root.

| Location | Meaning | Git in repository mode |
|---|---|---|
| `.kai/manifest.json`, `.kai/CONVENTIONS.md` | kai bootstrap and contract | committed |
| `.kai/runs/` | raw, regenerable, heavy, or scratch evidence | ignored |
| `kai/coordination/` | operational state shared across concurrent efforts | committed |
| `kai/initiatives/<slug>/` | strategic context and outputs owned by one initiative | committed |
| `kai/library/` | curated outcomes intentionally reusable across initiatives | committed text |
| `kai/personal/` | portable personal operational, career, and learning material | ignored |

The **committed** rows describe the default. Under `corpus_visibility: local`
they are all ignored instead; the ignored rows are unaffected.

`.kai/runs/` stays hidden deliberately: it is bulky, regenerable, and may
hold raw or sensitive evidence, so it should not pollute everyday search.
`kai/personal/` is the mirror case — **visible but gitignored**, because
privacy and discoverability are separate concerns.

**A public repository is a third case.** The table above assumes the corpus is
material the project's collaborators should read. In a public open-source
repository that assumption can be wrong: coordination churn, backlog, and
design notes are often the maintainer's own working state, and committing them
publishes it to everyone on the next push. Onboarding therefore asks once and
records the answer as `corpus_visibility` in the manifest (see **Manifest**
below); `local` keeps the identical paths but ignores `/kai/` and `/.kai/`
entirely, narrowing durability to that one checkout.

`kai/coordination/` answers “what is happening now?” `kai/initiatives/` answers “why
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

`kai/personal/workspaces.md` is an optional registry of additional Kai workspaces
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
manifest, reads its `kai/coordination/` state read-only, skips invalid or unavailable
roots with an explicit gap, and labels surfaced signals with the registry label.
When the operator names another workspace, confirm its label and root before
adding or updating the local registry. No back-pointer or pairing file is
written into the linked workspace.

## Raw run grammar

All ephemeral runs use a **date-first** shape:

```text
<workspace-root>/.kai/runs/<area>/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/<artifact>
```

Within existing agent prompts, `<working-root>` is an alias for the fixed
`<workspace-root>/.kai/runs` path. It is not configurable.

- `<YYYY-MM-DD>` is the local date — the deterministic top anchor. It is never
  model-generated (unlike a target slug, which drifts run to run), so a run is
  always where you expect it and a day's runs in an area group under one folder.
- `<NN>` is a **zero-padded, per-day sequential run index** within the area.
  Pick it by listing `.kai/runs/<area>/<today>/` and taking `the highest existing
  index + 1` (`01` if empty) — never fill a lower gap and never reuse an index,
  so runs always sort in the order they ran.
- `<flavor>` is the calling agent's lens (`arch`, `backend`, `qa`, `ux`, `seo`,
  `strategy`, `linkedin`, `ship`, `incident`, …).
- `<descriptor>` is descriptive only — **not** the grouping key. Prefer the
  work-item/epic key when the run has one (e.g. `kai-59`) so same-epic runs stay
  greppable (`grep -rl kai-59 .kai/runs/*/*/`); otherwise a stable kebab slug for
  the target. Never block a run waiting on the descriptor — the date + index
  already locate the run.
- One agent run owns one dated run folder.
- Raw credentials, cookies, tokens, and browser state never leave `.kai/runs/`.

Example (the `qa` area on one day):

```text
.kai/runs/qa/2026-08-03/
  01-qa-progress-page/        report.md  screenshots/
  02-ux-progress-page/        report.md  screenshots/
  03-pm-progress-page/        triage.md
  04-stress-progress-page/    report.md  evidence/
```

**Placement is mandatory.** A run's artifacts always land under
`.kai/runs/<area>/`. Never write them to Copilot session-state, a temp
directory, or the calling agent's cwd — this is the guard against designs,
reports, and evidence scattering to unfindable locations. When a browser or
other harness takes an output dir (`OUT`), it MUST resolve under the run folder
above; reject or rewrite any `OUT` that resolves elsewhere. This holds **even
when a non-owning agent** (e.g. an orchestrator, or a QA/stress harness driven
by a director) runs the work — the canonical path is mandatory regardless of
caller. A promoted outcome mirrors the shape:
`kai/library/<type>/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/<artifact>`.

### Goal- and period-keyed areas (the exception)

A few areas deliberately group by a **durable key instead of the date**, because
their runs accrete toward one goal or period rather than being point-in-time
snapshots:

- `learn` / `lessons` — keyed by a descriptive **goal slug**, then the same
  order-sorted run tail as every other area:
  `<area>/<goal-slug>/<NN>-<flavor>-<descriptor>/`. The `<goal-slug>` is the
  durable learning goal (`learn-react`, `az-204`, `prep-for-interview-vercel`),
  chosen once and **reused across runs** so everything toward one goal or
  certification stays in one folder. `<NN>` is the next index **within the goal**
  (highest existing + 1, never filling gaps) — so `learn`/`lessons` simply swap
  the date for the goal and otherwise keep the universal `<NN>-<flavor>-<descriptor>`
  tail and its run-order sort. Flavors: `learn` uses `extract` (course/page
  extraction; `instructor-teacher` writes its packaged `lessons/` subfolder
  **inside** the extraction run it built from);   `lessons` uses `tutor`. An artifact in a **separate** run that points back to
  another records that link in its **frontmatter** (a `produced_from:` path)
  rather than by baking another run's path into its own folder name, so the
  goal-first layout stays stable and hand-off is not path-coupled. Output
  **co-located inside** a run — e.g. the teacher's `lessons/` subfolder written
  into the extraction run it packages — is simply part of that run, not a
  cross-reference.
- `pulse` — grouped by **ISO week** (`<YYYY-Www>`); its weekly-window resolution
  depends on the week folder.
- `kai/library/briefings/` — the AI researcher's daily one-pager is a **date-keyed
  cadence** artifact: exactly one `kai/library/briefings/<YYYY-MM-DD>-briefing.md` per
  day, glob-read (`*-briefing.md`) to rebuild the covered-source ledger. The date
  is already deterministic, so it stays a flat date-stamped file (its raw working
  draft under `.kai/runs/ai/` still uses the date-first run shape above).

These keep their own grammar; every other area uses the date-first shape above.

### Area registry

| Area | Owners | Flavors |
|---|---|---|
| `qa` | product-explore, qa-ui, seo, PM, persona agents | `explore`, `extract`, `pm`, `qa`, `ux`, `seo`, `trainer`, `nutritionist` |
| `eng` | SWE architect, manager, frontend, backend, infra, security, SRE, privacy-compliance, data-engineer | `arch`, `scope`, `frontend`, `backend`, `infra`, `security`, `sre`, `compliance`, `data-eng` |
| `product` | product strategist, product marketing, product designer, customer success, growth, data analytics, pricing-monetization, customer-feedback, experiment-review, technical-writer, localization, brand-designer | `strategy`, `marketing`, `mockups`, `customer-success`, `growth`, `analytics`, `pricing`, `feedback`, `experiment-review`, `docs`, `localization`, `brand` |
| `revenue` | sales, solutions-architect, revenue-operations, partnerships | `sales`, `solutions-architect`, `revops`, `partnerships` |
| `support` | workflow-support-triage | `triage` |
| `content` | linkedin strategist, video director, demand-generation, future platform agents | `linkedin`, `video`, `demand-gen` |
| `review` | workflow-doc-review, workflow-self-check | `doc`, `self-check` |
| `ship` | workflow-ship | `ship` |
| `incident` | workflow-incident-response | `incident` |
| `ai` | AI researcher and applied engineer | `research`, `applied` |
| `learn` | course-to-audio and teacher | `extract` (goal-keyed) |
| `lessons` | engineer tutor | `tutor` (goal-keyed) |
| `pulse` | weekly pulse | week-specific |

Add a registry entry before creating a new area.

## Initiative-owned artifacts

When an item belongs to an initiative, its durable working output defaults to
that initiative:

| Artifact | Canonical default |
|---|---|
| Product surface map | `kai/initiatives/<slug>/artifacts/product-map.md` |
| Product design system | `kai/initiatives/<slug>/artifacts/design-system.md` |
| Design-system extract (observed visual facts) | `kai/initiatives/<slug>/artifacts/design-system-extract.md` |
| Design option mockups | `kai/initiatives/<slug>/artifacts/designs/<item-id>-mockups/options.html` |
| Product marketing intelligence | `kai/initiatives/<slug>/artifacts/marketing/` (`product_exploration_report.md` + `product_context.json` + `media_manifest.json`) |
| Content / creative pack (LinkedIn, video, …) | `kai/initiatives/<slug>/artifacts/content/<item-id>/` |
| De-identified customer-success signal | `kai/initiatives/<slug>/artifacts/customer-success/<item-id>.md` |
| De-identified support signal | `kai/initiatives/<slug>/artifacts/support/<item-id>.md` |
| De-identified customer-feedback signal | `kai/initiatives/<slug>/artifacts/feedback/<item-id>.md` |
| Growth diagnosis / experiment brief | `kai/initiatives/<slug>/artifacts/growth/<item-id>.md` |
| Analytics metric contract / readout | `kai/initiatives/<slug>/artifacts/analytics/<item-id>.md` |
| Experiment integrity certificate | `kai/initiatives/<slug>/artifacts/experiments/<item-id>.md` |
| Pricing / packaging brief | `kai/initiatives/<slug>/artifacts/pricing/<item-id>.md` |
| De-identified sales / deal brief | `kai/initiatives/<slug>/artifacts/sales/<item-id>.md` |
| Sanitized pre-sale solution / POC brief | `kai/initiatives/<slug>/artifacts/solutions/<item-id>.md` |
| Sanitized security assessment / control brief | `kai/initiatives/<slug>/artifacts/security/<item-id>.md` |
| Sanitized reliability assessment / SLO brief | `kai/initiatives/<slug>/artifacts/reliability/<item-id>.md` |
| Sanitized incident record | `kai/initiatives/<slug>/artifacts/incidents/<item-id>.md` |
| Sanitized privacy/compliance assessment | `kai/initiatives/<slug>/artifacts/compliance/<item-id>.md` |
| PM product brief | `kai/initiatives/<slug>/artifacts/briefs/<item-id>.md` |
| Research memo | `kai/initiatives/<slug>/artifacts/research/<item-id>.md` |
| Product design | `kai/initiatives/<slug>/artifacts/designs/<item-id>.md` |
| Technical writing / docs artifact | `kai/initiatives/<slug>/artifacts/docs/<item-id>.md` |
| Revenue-operations metric model / forecast brief | `kai/initiatives/<slug>/artifacts/revops/<item-id>.md` |
| Demand-generation campaign plan | `kai/initiatives/<slug>/artifacts/campaigns/<item-id>.md` |
| De-identified partnership brief | `kai/initiatives/<slug>/artifacts/partnerships/<item-id>.md` |
| Localization readiness / locale-QA report | `kai/initiatives/<slug>/artifacts/localization/<item-id>.md` |
| Data-engineering design / data contract | `kai/initiatives/<slug>/artifacts/data-engineering/<item-id>.md` |
| Brand / visual-identity system | `kai/initiatives/<slug>/artifacts/brand/<item-id>.md` |
| Initiative decision/ADR | `kai/initiatives/<slug>/artifacts/decisions/<item-id>.md` |
| Director closure summary | `kai/initiatives/<slug>/director-summary.md` |
| Deliverable index | `kai/initiatives/<slug>/deliverables.md` |

The creator lists every canonical workspace-root-relative path in
`artifact_targets`. An operator-supplied path may override a target only when
it remains within the resolved workspace and the item records the reason.

Unaffiliated durable work goes to the matching `kai/library/<type>/` location
rather than creating an artificial initiative.

A sanitized unaffiliated incident closure record uses
`kai/library/investigations/<incident-id>/incident-record.md`. This is the explicit
exception to initiative-first promotion because emergency command may have no
initiative; the raw incident dossier still remains in `.kai/runs/`.

## Promotion to the library

`kai/library/` is not a general output folder. It contains **promoted,
cross-initiative outcomes** that another effort can intentionally reuse.

The flow is one-way:

```text
.kai/runs/ -> kai/initiatives/<slug>/artifacts/ -> kai/library/<type>/
```

Rules:

1. Initiative work defaults to its `artifacts/` tree.
2. Agents never write directly to `kai/library/` merely because a destination is
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
| Document review | `kai/library/reviews/` |
| Engineering or architecture decision | `kai/library/dev-designs/` |
| Product/strategy investigation or sanitized unaffiliated incident record | `kai/library/investigations/` |
| AI landscape briefing | `kai/library/briefings/` |
| Promoted QA/persona finding | `kai/library/qa-findings/` |
| Team-shareable lesson | `kai/library/lessons/` |
| Weekly digest | `kai/library/digests/` |
| Atomic reusable learning | `kai/library/learnings/` |
| Release record | `kai/library/releases/` |
| Reusable procedure | `kai/library/playbooks/` |
| Reusable content pack | `kai/library/content/` |

Heavy binaries remain ignored even below `kai/library/`: `*.mp3`, `*.har`,
`*.zip`, `audio/`, `raw/`, and `screenshots/`.

### Durable asset frontmatter

```yaml
---
asset_id: <stable-id>
asset_class: <investigation|report|decision|design|spec|plan|review|...>
type: <legacy library lane when promoted, or domain document type>
title: <human title>
item: <producing-item-id>
produced_by: <role>
created: <YYYY-MM-DD>
revision: 1
initiative: <slug or null>
source_artifact: <initiative artifact path or null>
target: <feature, document, repository, URL, or operator-private subject>
disposition:
  status: <working|published|personal|archived|retracted>
  reason: <why>
completion:
  authority: <role>
  verdict: <pending|accepted|bounced>
  at: <YYYY-MM-DD-HHMM or null>
  revision_at_verdict: <integer or null>
validity:
  status: <unknown|provisional|current|stale|expired|superseded|invalidated|retired>
  owner: <role>
  as_of: <YYYY-MM-DD>
  revalidate_by: <YYYY-MM-DD or null>
  basis: []
supersedes: <asset-id or null>
superseded_by: <asset-id or null>
evidence:
  - path: <exact workspace-root-relative path>
    source: <tool/site/reviewer>
    captured: <YYYY-MM-DD-HHMM or n/a>
---
```

Domain-specific fields may follow, but they never replace the lifecycle header.
Legacy library frontmatter remains readable until migration. New and materially
revised durable assets use this shape and the state rules in
`kai-core-asset-lifecycle`.

## Initiatives

Before substantial project or feature work, read `kai/coordination/ACTIVE.md`. For
each active slug, load `kai/initiatives/<slug>/northstar.md` only when the target
matches its repositories, targets, keywords, or the operator's stated goal.
Unrelated work remains context-free.

When loaded:

1. Read `mission`, `vision`, `scope.current`, the referenced milestones, and
   `principles.non_negotiable`.
2. Apply `kai-core-scope-discipline` before acting.
3. Claim and update `kai/coordination/items/<item-id>.md`.
4. Append handoffs and questions to `kai/coordination/threads/<item-id>.md`.
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
proposal_channel: kai/initiatives/<slug>/backlog.md
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

`kai/coordination/ACTIVE.md` is the operational focus pointer.
`kai/initiatives/INDEX.md` is the permanent all-status catalog:

```markdown
| slug | status | workspace | summary | deliverables | updated |
```

Removing a terminal initiative from `ACTIVE.md` must not make it
undiscoverable.

## Proposals

An expansion discovered inside an initiative goes to
`kai/initiatives/<slug>/backlog.md`. An unaffiliated proposal goes to
`kai/coordination/backlog.md`. Proposals never fall back to `.kai/runs/`.

## Personal material

Personal operational state — your `inbox.md` task list, derived `agenda.md`,
optional linked-workspace registry, private consultation records, private
decision briefs, voice profile, and career context — plus courses, certification
notes, and private learning live under `kai/personal/`. `kai/personal/identity/voice.md` is consumed by
`persona-self`; the career files under `kai/personal/identity/` are owned by
`principal-engineer-career-mentor`. `workflow-workspace-init` seeds every stub
idempotently so the assistant is ready in any Kai workspace. Team-relevant
material may be promoted explicitly to `kai/library/lessons/`; it is never promoted
automatically.

## Manifest

`.kai/manifest.json` is committed and deterministic:

```json
{
  "plugin": "<kai|kai-core>",
  "version": "<plugin version at scaffold time>",
  "schema_version": 2,
  "scaffolded": "<YYYY-MM-DD>",
  "workspace_mode": "<repository|external>",
  "workspace_root": "<'.' in repository mode | absolute external root>",
  "kai": ".kai",
  "runs": ".kai/runs",
  "corpus": "kai",
  "coordination": "kai/coordination",
  "initiatives": "kai/initiatives",
  "library": "kai/library",
  "personal": "kai/personal",
  "areas": ["qa", "eng", "product", "revenue", "support", "review", "ship", "incident", "ai", "learn", "lessons", "pulse", "content"]
}
```

`plugin` records the install surface that scaffolded the workspace: `kai` for
the legacy monolith or `kai-core` after pack migration. No third value is valid.

One optional key may follow, written only on an explicit operator choice:

```json
  "corpus_visibility": "committed" | "local"
```

**`corpus_visibility` records whether the working corpus is published with the
repository.** It is optional, it is written only when an operator explicitly
chooses, and an absent key means `committed` — so every workspace scaffolded
before it existed stays valid and needs no migration. The paths never change,
only whether git carries them:

- **`committed`** (default) — `kai/coordination/`, `kai/initiatives/`, and
  textual `kai/library/` are tracked, so collaborators clone the working corpus.
- **`local`** — the managed ignore block additionally covers `/kai/` and
  `/.kai/`, so untracked kai state is excluded from ordinary `git add` and does
  not reach the remote. Use it when the repository is public and its kai state
  is *your* working notes rather than material the project's collaborators are
  meant to read. Anything already tracked stays committable until it is
  explicitly untracked — ignoring a path never untracks or unpublishes it.

`local` narrows durability to **this checkout**: the corpus does not survive a
clone and is invisible to teammates, other machines, CI, cloud agents, and clean
worktrees. Agents sharing one synchronized working tree still coordinate
normally, so it is single-checkout rather than single-user. That is a real cost,
it must be stated before the operator chooses, and it is never a default an
agent picks silently.

The workspace doctor verifies a recorded `local` against git rather than
trusting it: tracked kai paths, or a corpus that is not actually ignored, are
errors. Outside a git work tree it reports the exclusion as unverified and
claims nothing.

`version` is the plugin build stamped at scaffold time; **`schema_version`** is the
independent workspace-contract version and is what upgrades key off. They move
separately: a plugin release only bumps `schema_version` when it changes the
generated workspace contract. The current contract is **schema version 2**. After
`/plugin update kai`, run the workspace doctor (`node <kai-plugin>/scripts/workspace-doctor.mjs`)
from the workspace root; if its `schema_version` is behind, the doctor prints the
deterministic migration plan and coordinated agents refuse to claim work until the
workspace is migrated and re-validates clean.

Root names are contract constants. Do not add compatibility aliases or silently
create legacy `.ketzal/` or `knowledge/` roots.

<!-- kai:allow-legacy-roots -->
**Schema 2 moved the working corpus under `kai/`.** A schema-1 workspace put
`coordination/`, `initiatives/`, `library/`, and `personal/` at the workspace
root. There is exactly one supported layout — never write to a bare root path,
and never honor a per-workspace layout switch. If both a bare root and its
`kai/` counterpart exist, the workspace is **split-brain**: stop and migrate
before claiming work. `.kai/` itself did not move, so the discovery anchor
`.kai/manifest.json` is identical in both schema versions.
<!-- /kai:allow-legacy-roots -->

## Agent checklist

1. Resolve the runtime absolute `<workspace-root>`; committed repository
   metadata stores `.` rather than a machine-specific clone path.
2. Require `.kai/manifest.json` for coordinated work.
3. Check `kai/coordination/ACTIVE.md` and load only matching initiatives.
4. Use `.kai/runs/` for raw evidence and scratch.
5. Use the canonical initiative artifact paths for initiative-owned output and
   record all of them in `artifact_targets`.
6. Promote to `kai/library/` only through the explicit promotion rule.
7. Use `kai/personal/` only for personal material.
8. Resolve personal state against the current Kai workspace; linked workspaces
   contribute coordination signals read-only.
9. Record exact workspace-root-relative paths; never abbreviate with `.../`.
10. Create a run area or library type directory on the way to writing your
    first file there; an absent output lane is normal, not a defect.
11. Apply `kai-core-asset-lifecycle` before durable placement and before ending
    any asset-producing run.
12. Never create a root or artifact lane outside this contract.

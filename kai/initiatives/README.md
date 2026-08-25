# Initiatives

One directory per initiative, `kai/initiatives/<slug>/`, holding its strategic
intent and every output it produces. Full contract:
`kai-core-initiative-stewardship` (governance) and `kai-core-workspace-conventions`
(paths). `kai/initiatives/INDEX.md` is the permanent all-status catalog;
`kai/coordination/ACTIVE.md` is only the current operational focus pointer —
removing a terminal initiative from `ACTIVE.md` must never make it
undiscoverable in `INDEX.md`.

## Layout

```text
kai/initiatives/<slug>/
  northstar.md          # thin core: mission, scope, principles, milestones
  log.md                # append-only steering decisions
  backlog.md            # initiative-scoped deferred proposals
  deliverables.md       # index of promoted/durable outputs, required at closure
  director-summary.md   # stable closure summary, required at closure
  artifacts/             # canonical output tree (see kai-core-workspace-conventions)
```

## North-star schema (`northstar.md`)

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

A milestone's `required_items` is authoritative and typed:
`[{item: <id>, state: completed|shipped}]`. Research/decision items complete;
production changes ship. An empty mapping is incomplete.

## Lifecycle

```text
proposed -> active -> paused -> completed|shipped -> archived
```

`proposed -> active` requires an accepted thin core (mission, `scope.current`,
`principles.non_negotiable`), milestones, and success measures. Use
`completed` when every milestone is knowledge/decision work; use `shipped`
when any milestone requires production delivery.

## Scope gate and stewardship

The initiative's `owner` (default `principal-product-manager`) is its
**steward**: owns north-star state, grooms the backlog, prioritizes the
`ready` queue, keeps coordination state honest, and calls the initiative done.
Scope changes follow `kai-core-scope-discipline`. Only one steward per
initiative — accountability does not split.

## Proposals

An expansion discovered inside this initiative goes to
`kai/initiatives/<slug>/backlog.md`. An unaffiliated proposal goes to
`kai/coordination/backlog.md`. Proposals never fall back to `.kai/runs/`.

## Artifacts defaults

Initiative output defaults to `kai/initiatives/<slug>/artifacts/`, with a
canonical path per artifact kind (product map, PM briefs, research, designs,
decisions, docs, security/reliability/compliance, growth/analytics/
experiments, data-engineering/brand/localization, and more) — see the full
table in `kai-core-workspace-conventions` and `.kai/CONVENTIONS.md`. An
operator-approved override must stay inside the resolved workspace and is
recorded on the item.

## Deliverable index and closure

An initiative reaches its declared outcome only when every milestone's
`required_items` are non-empty and every listed item reached its declared
terminal state. Closure requires a non-empty `deliverables.md`, a stable
`director-summary.md`, and `kai/initiatives/INDEX.md` updated with their exact
paths, before the north star moves to `completed`/`shipped` and its slug is
dropped from `kai/coordination/ACTIVE.md` (it remains in `INDEX.md`).

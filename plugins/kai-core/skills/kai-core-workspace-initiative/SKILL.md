---
name: kai-core-workspace-initiative
description: "Defines initiative artifact layout, coordination and closure, personal state, and the schema-3 manifest. Use when working inside an initiative or validating a .kai manifest."
tools: [execute, read, search]
---

# Workspace initiative state

This skill defines how Kai organizes an initiative's working state: its
artifact layout, coordination and closure, personal state and linked
workspaces, and the schema-3 manifest.

## Initiative artifacts

Initiative working outputs stay under:

```text
.kai/state/initiatives/<slug>/artifacts/
```

Canonical defaults:

| Artifact | Private target |
|---|---|
| Product surface map | `product-map.md` |
| Product design system | `design-system.md` |
| Marketing intelligence | `marketing/` |
| Content or creative bundle | `content/<item-id>/` |
| Customer-success signal | `customer-success/<item-id>.md` |
| Support signal | `support/<item-id>.md` |
| Customer-feedback signal | `feedback/<item-id>.md` |
| Growth or experiment brief | `growth/<item-id>.md` |
| Analytics contract or readout | `analytics/<item-id>.md` |
| Experiment certificate | `experiments/<item-id>.md` |
| Pricing brief | `pricing/<item-id>.md` |
| Sales brief | `sales/<item-id>.md` |
| Solution or POC brief | `solutions/<item-id>.md` |
| Security assessment | `security/<item-id>.md` |
| Reliability assessment | `reliability/<item-id>.md` |
| Incident record | `incidents/<item-id>.md` |
| Privacy or compliance assessment | `compliance/<item-id>.md` |
| Product brief | `briefs/<item-id>.md` |
| Research memo | `research/<item-id>.md` |
| Product design | `designs/<item-id>.md` |
| Technical documentation draft | `docs/<item-id>.md` |
| Revenue-operations brief | `revops/<item-id>.md` |
| Campaign plan | `campaigns/<item-id>.md` |
| Partnership brief | `partnerships/<item-id>.md` |
| Localization report | `localization/<item-id>.md` |
| Data-engineering design | `data-engineering/<item-id>.md` |
| Brand system | `brand/<item-id>.md` |
| Initiative decision | `decisions/<item-id>.md` |

Prepend `.kai/state/initiatives/<slug>/artifacts/` to each target. The work
item lists every exact path in `artifact_targets`.

Review-ready HTML options always use:

```text
.kai/review/designs/<item-id>/options.html
```

Screenshots and browser evidence stay in `.kai/runs/`. An accepted design spec
may publish, but `options.html` remains private review material.

Unaffiliated durable knowledge requires an explicit project and publication
target. Do not create an artificial initiative and do not fall back to a random
`TODO.md`, `reports/`, or `designs/` directory.

## Coordination and closure

Before substantial work, read `.kai/state/ACTIVE.md`. Load only initiatives
whose target matches the current project, repository, keywords, or operator
goal.

For initiative work:

1. reserve the item through the runtime (`kai-core-work-granting`); any file at
   `.kai/state/items/<item-id>.md` is retained history, never the claim;
2. submit durable questions and handoffs as `question.open`, `question.answer`
   and `item.handoff` commands, and read them back with
   `messages --item <item-id>`;
3. write authored working artifacts below the initiative and register each one
   as a **registered artifact** with `artifact.register`;
4. update `deliverables.md`;
5. apply `kai-core-asset-producing` before completion.

An initiative's **operational** fields — an item's lifecycle state, owner,
lease, version, review bindings and the cross-item summary of them — live in the
runtime record under schema 5 and are read with `status`, `detail` and
`messages`. Its **authored** content — the north star, briefs, designs, decision
rationale, the deliverables narrative — is real authored material that stays at
its own path and is registered, never derived.

`.kai/state/ACTIVE.md` is only the current focus pointer.
`.kai/state/initiatives/INDEX.md` is the permanent all-status catalog. A
terminal initiative leaves `ACTIVE.md` but remains indexed. Its closed
operational directory may move to:

```text
.kai/archive/initiatives/<slug>/
```

Published project artifacts do not move when the private operational record is
archived.

An expansion found inside an initiative goes to its `backlog.md`. An
unaffiliated proposal goes to `.kai/state/backlog.md`. Arbitrary backlog files
are forbidden.

## Personal state and linked workspaces

Personal state lives only under `.kai/personal/`. The standard lane includes:

```text
inbox.md
agenda.md
workspaces.md
consultations/
decisions/
proactive/
identity/
lessons/
courses/
certs/
growth/
```

`.kai/personal/workspaces.md` is an optional read-only source list for agenda
aggregation. It is distinct from `$KAI_HOME/workspaces.json`: the machine
registry resolves an external workspace for a project, while the personal list
chooses additional already-valid workspaces whose signals should appear in an
agenda. Validate every listed workspace before reading it.

Personal content is never published automatically.

## Manifest

A coordinated workspace carries the exact schema-5 manifest:

```json
{
  "plugin": "kai-core",
  "version": "<plugin-version>",
  "schema_version": 5,
  "scaffolded": "<YYYY-MM-DD>",
  "workspace_id": "<stable-id>",
  "placement": "<external|repo-local>",
  "workspace_root": "<absolute external root or '.'>",
  "private_root": ".kai",
  "direction": "docs/kai/DIRECTION.md",
  "projects": [
    {
      "id": "<kebab-id>",
      "path": "<absolute external project path or '.'>",
      "publication_root": "docs/kai"
    }
  ]
}
```

Root values are contract constants. `version` records the plugin build;
`schema_version` independently controls workspace migration.

### Historical schema 3/4 beside schema 5

Schema 3 and schema 4 stay **inspect-only** and readable through `inspect`, `status` and `legacy`.
Every other read — `detail`, `context`, `messages`, `export`, `hash` — refuses
with `SCHEMA_MISMATCH`, and so does every coordinated write. Their records keep
their historical meaning; the runtime simply will not project them as live
schema-5 state.

There is no automatic upgrade and no schema-4 initialization or write path.
Route only to the explicit offline schema-5 migration in
`kai-core-workspace-onboarding`. Report the refusal; never work around it by
editing a manifest or state file by hand.

Markdown left under `.kai/state/items/`, `.kai/state/threads/` and
`.kai/state/BOARD.md` after a migration is a **retained historical import
source**. Nothing writes it under schema 5, so it is no longer updated and is
never read as authority.

<!-- kai:allow-legacy-roots -->
Schema 3 retires schema-2 `workspace_mode`, `corpus_visibility`, `kai`,
`corpus`, `coordination`, `initiatives`, `library`, and `personal` manifest
keys. It also retires the visible schema-2 paths `kai/coordination/`,
`kai/initiatives/`, `kai/library/`, and `kai/personal/`.

Migration classifies before moving:

- coordination records move to `.kai/state/`;
- initiative working records move to `.kai/state/initiatives/`;
- personal state moves to `.kai/personal/`;
- raw evidence moves to `.kai/runs/`;
- review-ready drafts move to `.kai/review/`;
- only accepted current project knowledge moves to the selected project's
  publication root;
- closed operational history may move to `.kai/archive/`.

Never preserve both layouts. Write `schema_version: 3` last, after every move,
reference rewrite, ignore rule, and registry pairing validates.
<!-- /kai:allow-legacy-roots -->

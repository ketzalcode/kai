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

1. claim `.kai/state/items/<item-id>.md`;
2. append durable questions and handoffs to
   `.kai/state/threads/<item-id>.md`;
3. write working artifacts below the initiative;
4. update `deliverables.md`;
5. apply `kai-core-asset-lifecycle` before completion.

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

Schema 3 uses this fixed shape:

```json
{
  "plugin": "kai-core",
  "version": "3.0.0",
  "schema_version": 3,
  "scaffolded": "<YYYY-MM-DD>",
  "workspace_id": "<stable-id>",
  "storage_mode": "<external|repo-local|shared>",
  "workspace_root": "<absolute external root or '.'>",
  "state": ".kai/state",
  "runs": ".kai/runs",
  "review": ".kai/review",
  "archive": ".kai/archive",
  "personal": ".kai/personal",
  "projects": [
    {
      "id": "<kebab-id>",
      "path": "<absolute external project path or '.'>",
      "publication_root": "docs/kai"
    }
  ],
  "areas": [
    "qa", "eng", "product", "revenue", "support", "review",
    "ship", "incident", "ai", "learn", "lessons", "pulse", "content"
  ]
}
```

Root values are contract constants. `version` records the plugin build;
`schema_version` independently controls workspace migration.

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

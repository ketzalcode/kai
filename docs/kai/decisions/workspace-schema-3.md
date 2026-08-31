---
asset_id: kai-workspace-schema-3
asset_class: architecture-decision
item: area-plugins-workspace-storage-modes
title: Private workspace and explicit project publication
produced_by: principal-swe-architect
created: 2026-08-31
revision: 1
disposition:
  status: published
  reason: Operator-approved workspace contract
completion:
  authority: operator
  verdict: accepted
  at: 2026-08-31
  revision_at_verdict: 1
validity:
  status: current
  owner: kai-core
  as_of: 2026-08-31
  revalidate_by: null
---

# Decision: private workspace, explicit publication

## Decision

Kai schema 3 separates private operational state from accepted project
knowledge.

```text
project repository                         kai workspace
------------------                         -------------
docs/kai/                                  .kai/
  decisions/                                 manifest.json
  specs/                                     state/
  reports/                                   runs/
                                              review/
                                              archive/
                                              personal/
```

The project publication root defaults to `docs/kai` and may be replaced by an
existing project-native documentation root. Kai creates only the configured
root.

## Storage modes

| Mode | Workspace location | Repository footprint |
|---|---|---|
| `external` | Durable directory outside the project | None |
| `repo-local` | Project `.kai/` | Fully ignored and untracked |
| `shared` | Project `.kai/` | Manifest, conventions, and state may be tracked |

External workspaces are rediscovered through the machine-local
`$KAI_HOME/workspaces.json` registry. Each registry row binds one absolute
project path to an absolute workspace path and `workspace_id`. A missing or
mismatched pairing stops discovery.

## Consequences

- `.kai/state/` is the only live coordination and initiative root.
- `.kai/review/` owns review-ready drafts, including
  `designs/<item-id>/options.html`.
- `.kai/runs/` owns raw evidence and scratch output.
- `.kai/archive/` owns closed operational history.
- `.kai/personal/` owns operator-private state.
- Accepted decisions, specifications, and reports publish under the selected
  project's `publication_root`.
- A work item in an external workspace references a public project artifact as
  `project:<project-id>:<publication-root-relative-path>`.
- Arbitrary `TODO.md`, backlog, design, report, and mock locations are invalid.

## Migration

Schema 2 workspaces choose a storage mode and publication root before moving
data. Coordination moves to `.kai/state/`; initiative working records move to
`.kai/state/initiatives/`; personal state moves to `.kai/personal/`.
The former generic publication tree and initiative artifacts are classified
instead of bulk published. Only accepted, current project knowledge moves to
the configured publication root. The migration writes `schema_version: 3`
last.

# kai-core

`kai-core` is the agent-free foundation for Kai collaboration. It provides the
shared operating rules, schema-6 workspace, standalone Task execution, and A2A
coordination used by Engineering, Creative, and optional Project Management.

## What it provides

| Capability | Skills |
| --- | --- |
| Shared role and communication rules | `kai-core-operating-rules`, `kai-core-peer-communication` |
| Standalone Task execution | `kai-core-work-task`, `kai-core-work-granting`, `kai-core-work-acting` |
| Activity and durable evidence | `kai-core-work-activity`, `kai-core-workspace-publication` |
| Workspace lifecycle | `kai-core-workspace-paths`, `kai-core-workspace-onboarding`, `kai-core-workspace-reonboard` |

Core contains no agents and no project-planning hierarchy. Direction, Epic,
Feature, and Requirement records belong to `kai-project-management`.

## Install

```text
copilot plugin install kai-core@kai-plugins
```

Start a new Copilot session after installation or update.

## Workspace behavior

Installing this plugin creates no repository files or Kai workspace. Direct
work also creates no Kai state.

Explicit Core onboarding creates only:

```text
.kai/manifest.json
.kai/core/runtime/coordination.sqlite
docs/kai/README.md
```

For repo-local placement, `.kai/` is ignored and untracked. External placement
keeps the same private layout outside the project. Core does not initialize
Project Management or empty department directories.

## Durable assets

Core creates a package-owned asset directory only on the first authorized
write. Drafts, evidence, and scratch remain private. Only an accepted exact
revision may be published.

| Asset | Private workspace | Accepted publication |
| --- | --- | --- |
| Decision | `.kai/core/decisions/<id>/{drafts,evidence,scratch}` | `docs/kai/core/decisions/<id>/` |
| Report | `.kai/core/reports/<id>/{drafts,evidence,scratch}` | `docs/kai/core/reports/<id>/` |

Private evidence never publishes. Source code, ordinary repository
documentation, and direct answers remain in their repository-native location;
they are not moved into `.kai/`.

## Boundaries

- SQLite is the coordination authority; Markdown is not a second state store.
- Core treats optional `planning_refs` as opaque strings.
- Installing another package does not create its workspace directory.
- Merge, release, deployment, spending, and external publication remain
  separately authorized actions.

See [Workspaces](https://github.com/ketzalcode/kai/blob/main/docs/workspaces.md)
and [Architecture](https://github.com/ketzalcode/kai/blob/main/docs/architecture.md)
for the cross-package contract.

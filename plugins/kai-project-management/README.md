# kai-project-management

`kai-project-management` is an optional, agent-free planning package. It owns
Direction, Epic, Feature, and Requirement hierarchy while `kai-core` retains
standalone Task execution and A2A coordination.

## What it provides

| Capability | Skill |
| --- | --- |
| Direction, Epic, Feature, and Requirement hierarchy | `project-management-work-hierarchy` |
| Scope authority, priority, holds, dependencies, and closure | `project-management-work-stewardship` |
| Focused Epic proposal | `project-management-create-epic` |
| Durable Direction and plan publication | `project-management-workspace-publication` |

The bundled `project.mjs` runtime also produces a deterministic handoff that
proposes a standalone Core Task body without writing the Core database.

## Install

```text
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-project-management@kai-plugins
```

Start a new Copilot session after installation or update.

## Workspace behavior

Installing this plugin creates no repository files or Kai workspace. Direct
work creates no package state.

After Core onboarding, explicitly initialize planning when the project needs
durable hierarchy:

```text
node "<kai-project-management-plugin>/scripts/project.mjs" init \
  --root "<workspace-root>"
```

This creates only:

```text
.kai/project-management/runtime/project.sqlite
```

The Project Management runtime never opens or mutates
`.kai/core/runtime/coordination.sqlite`.

## Durable assets

Planning artifacts materialize lazily on the first authorized write:

| Asset | Private workspace | Accepted publication |
| --- | --- | --- |
| Direction | `.kai/project-management/direction/<id>/{drafts,evidence,scratch}` | `docs/kai/project-management/direction/<id>/` |
| Plan | `.kai/project-management/plans/<id>/{drafts,evidence,scratch}` | `docs/kai/project-management/plans/<id>/` |

The SQLite planning records remain private authority. Published Markdown or
JSON is accepted knowledge, not a writable mirror of the database. Private
evidence never publishes.

## Boundaries

- Project Management is optional; Engineering and Creative can work from
  supplied approved scope without it.
- A handoff emits a proposed Core Task body. The caller submits it separately.
- Core and Project Management use separate databases and no cross-database
  transaction.

See [Workspaces](https://github.com/ketzalcode/kai/blob/main/docs/workspaces.md)
and [Architecture](https://github.com/ketzalcode/kai/blob/main/docs/architecture.md).

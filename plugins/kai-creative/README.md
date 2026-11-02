# kai-creative

`kai-creative` provides design and supported media capabilities over
`kai-core`: UI/UX direction, visual identity, HTML and ASCII mockups, diagrams,
video direction, zoom rendering, and narration alignment.

## What it provides

| Role | Responsibility |
| --- | --- |
| `creative-lead-design` | Product experience, visual systems, and design assets |
| `creative-lead-video` | Screenplay, video direction, and production decisions |
| `creative-operator-demo-production` | Deterministic demo and media operations |

Methods include HTML and ASCII mockups, accessible HTML block diagrams, content
grounding, zoom rendering, measured narration placement, and Creative durable
asset publication.

## Install

```text
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-creative@kai-plugins
```

Start a new Copilot session after installation or update. Browser-backed
rendering and media commands require the tools named by the selected skill.

## Workspace behavior

Installing this plugin creates no repository files, `.kai/creative/` directory,
or runtime database. Direct advice or an explicitly requested repository-native
mock can complete without Kai state.

For coordinated durable work, Creative uses Core Tasks and creates only the
validated asset route needed by the accepted request.

## Durable assets

| Asset | Private supporting material | Default knowledge / media destination |
| --- | --- | --- |
| Feature design | `.kai/creative/features/<id>/{evidence,scratch}` | `docs/kai/creative/features/<id>/` |
| Documentation | `.kai/creative/documentation/<id>/{evidence,scratch}` | `docs/kai/creative/documentation/<id>/` |
| Decision | `.kai/creative/decisions/<id>/{evidence,scratch}` | `docs/kai/creative/decisions/<id>/` |
| Report | `.kai/creative/reports/<id>/{evidence,scratch}` | `docs/kai/creative/reports/<id>/` |
| Media or destination record | `.kai/creative/media/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/media/<id>/` |

Designs and knowledge are authored at their canonical repository path from
creation, on a branch. Reuse an established documentation home before these
defaults, without a private authoring copy. Independent acceptance still binds
the exact revision; a committed design does not authorize implementation.
Private evidence never publishes. Media keeps its existing private custody,
exact-byte acceptance, and approved destination flow. Large or restricted
binaries do not enter Git merely to make them durable.

## Boundaries

- Creative accepts supplied approved scope or a standalone Core Task; Project
  Management is optional.
- A producer cannot independently accept its own design.
- Design artifacts do not authorize frontend implementation.
- Paid synthesis, external publication, and production changes require
  separate operator authority.

See the
[agents and skills catalog](https://github.com/ketzalcode/kai/blob/main/docs/reference/agents-and-skills.md)
and [Workspaces](https://github.com/ketzalcode/kai/blob/main/docs/workspaces.md).

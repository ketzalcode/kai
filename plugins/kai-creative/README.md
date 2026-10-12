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

| Asset | Private workspace | Accepted publication |
| --- | --- | --- |
| Feature design | `.kai/creative/features/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/features/<id>/` |
| Documentation | `.kai/creative/documentation/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/documentation/<id>/` |
| Decision | `.kai/creative/decisions/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/decisions/<id>/` |
| Report | `.kai/creative/reports/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/reports/<id>/` |
| Media or destination record | `.kai/creative/media/<id>/{drafts,evidence,scratch}` | `docs/kai/creative/media/<id>/` |

Private evidence never publishes. Scratch can never be a publication source.
Large media may publish as an approved destination record instead of copying a
binary into Git.

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

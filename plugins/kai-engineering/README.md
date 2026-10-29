# kai-engineering

`kai-engineering` provides explicit software delivery roles and methods over
`kai-core`: frontend and backend implementation, technical writing, selective
review, PR delivery, and bounded Nightshift execution.

## What it provides

| Role | Responsibility |
| --- | --- |
| `eng-builder-frontend` | Frontend implementation and focused evidence |
| `eng-builder-backend` | Backend implementation and focused evidence |
| `eng-lead-software` | Explicit multi-builder integration and PR delivery |
| `eng-reviewer-code` | Independent revision-bound code review |
| `eng-lead-technical-writing` | Technical documentation ownership |
| `eng-nightshift` | Approved serial unattended delivery |

Methods include `software-development`, shared/frontend/backend coding
standards, repository onboarding, research, PR sizing, review, review comments,
PR delivery, feasibility-first `setup-agentic-repository-maintenance`,
diagrams, development-design documents and readable Word projections,
`nightshift-run`, and the manual `my-insights`, `team-insights`, and
`refine-insights` workspace-learning commands.

## Install

```text
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-engineering@kai-plugins
```

Start a new Copilot session after installation or update.

## Workspace behavior

Installing this plugin creates no repository files, `.kai/engineering/`
directory, or runtime database. Direct work changes repository-native code,
tests, configuration, and documentation without creating Kai state.

Coordinated work uses Core Tasks and
`.kai/core/runtime/coordination.sqlite`. Engineering creates a package-owned
asset directory only when an authorized durable artifact is actually produced.

Explicit insight commands create private Engineering guidance only on their
first approved write:

```text
.kai/engineering/insights/<project-id>/profile.md
.kai/engineering/insights/<project-id>/my-insights.md
.kai/engineering/insights/<project-id>/team-insights.md
```

The project ID comes from Core's exact active target binding, not the directory
where the host session started. Capture remains manual. Normal work reads only
the compact approved profile when present.

## Durable assets

| Asset | Private supporting material | Default canonical knowledge |
| --- | --- | --- |
| Feature | `.kai/engineering/features/<id>/{evidence,scratch}` | `docs/kai/engineering/features/<id>/` |
| Architecture documentation | `.kai/engineering/documentation/architecture/<id>/{evidence,scratch}` | `docs/kai/engineering/documentation/architecture/<id>/` |
| Decision | `.kai/engineering/decisions/<id>/{evidence,scratch}` | `docs/kai/engineering/decisions/<id>/` |
| Investigation report | `.kai/engineering/reports/investigations/<id>/{evidence,scratch}` | `docs/kai/engineering/reports/investigations/<id>/` |
| Nightshift report | `.kai/engineering/reports/nightshift/<id>/{drafts,evidence,scratch}` | `docs/kai/engineering/reports/nightshift/<id>/` |
| Release report | `.kai/engineering/reports/releases/<id>/{evidence,scratch}` | `docs/kai/engineering/reports/releases/<id>/` |

Write knowledge at its repository home from creation, including proposed
revisions. Established native documentation takes precedence over these
defaults; never keep both as authorities. Coordinated acceptance binds the
exact Git revision. Evidence and scratch stay private. Nightshift's raw
execution report and checkpoints remain private operational outputs; a
project narrative is a separate sanitized document. Non-Git deliverables keep
their exact-byte acceptance and authorized publication rules.

## Boundaries

- Project Management is not required; approved scope or a standalone Core Task
  is sufficient.
- Review, PR creation, merge, release, and deployment are separate actions.
- Nightshift never merges, deploys, tags, releases, or expands approved scope.
- Incubated Engineering roles and skills are not discoverable or installable.

See the
[agents and skills catalog](https://github.com/ketzalcode/kai/blob/main/docs/reference/agents-and-skills.md)
and [Workspaces](https://github.com/ketzalcode/kai/blob/main/docs/workspaces.md).

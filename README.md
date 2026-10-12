<p align="center">
  <img src="https://github.com/ketzalcode.png?size=160" alt="Kai" width="120">
</p>

<h1 align="center">Kai</h1>

<p align="center">
  <strong>Specialized AI collaboration for software teams that value quality without ceremony.</strong><br>
  <em>Direct by default. Coordinated when it matters.</em>
</p>

<p align="center">
  <a href="https://github.com/ketzalcode/kai/actions/workflows/nightly.yml"><img alt="Nightly" src="https://github.com/ketzalcode/kai/actions/workflows/nightly.yml/badge.svg?branch=main"></a>
  <a href="https://github.com/ketzalcode/kai/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/ketzalcode/kai?style=flat-square&label=release"></a>
  <a href="https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli"><img alt="GitHub Copilot CLI" src="https://img.shields.io/badge/GitHub%20Copilot-CLI-8957E5?style=flat-square&logo=githubcopilot&logoColor=white"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/github/license/ketzalcode/kai?style=flat-square"></a>
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#how-kai-is-organized">Packages</a> ·
  <a href="docs/reference/agents-and-skills.md">Catalog</a> ·
  <a href="docs/architecture.md">Architecture</a> ·
  <a href="https://github.com/ketzalcode/kai/releases">Releases</a>
</p>

Kai is a lean, quality-first suite of specialized agents and skills for
agent-to-agent software collaboration in the GitHub Copilot CLI.

**The mission:** help developers ship better software with the right expertise
and evidence, without turning every change into a workflow.
Kai keeps direct work direct. It adds specialization, review, coordination, or
planning only when those things materially improve the result.

**The vision:** a composable engineering team with small roles, relevant
context, clear authority, and proportionate validation. Agents should disagree
when the evidence calls for it, stay inside their lane, and leave work
understandable to the next person or session.

**Built to stay lean:** declarative Markdown agents and skills plus small,
dependency-free Node runtimes only where durable state is necessary. There is
no service to run and no framework to adopt.

## What Kai provides

- **Focused implementation:** separate frontend and backend builders with shared
  and domain-specific coding standards.
- **Selective review:** an independent code reviewer that reports material
  findings without repairing the code it assessed.
- **Explicit delivery:** one software lead owns coordination and PR delivery;
  merge, release, deployment, and publication remain separate authorized acts.
- **Bounded unattended work:** Nightshift executes approved Tasks serially,
  preserves blockers, and leaves a private morning report.
- **Creative capability:** design, visual identity, HTML/ASCII mockups, video
  direction, and supported demo production.
- **Optional durable coordination:** standalone Tasks, grants, leases,
  collisions, handoffs, reviews, evidence, and recovery across sessions.
- **Optional planning:** Direction, Epic, Feature, and Requirement live outside
  Core in their own Project Management runtime.

Most requests need only a directly invoked agent and the repository in front of
it. A Kai workspace is optional.

## How Kai is organized

Kai ships five packages. Install only what you need.

```text
                         kai-contributor
                    feedback and authoring tools
                       no runtime or workspace

  kai-project-management ------> kai-core <------ kai-engineering
       optional planning         execution         software delivery
                                      ^
                                      |
                                kai-creative
                                design and media
```

| Package | Owns |
| --- | --- |
| `kai-core` | Shared operating rules, optional workspace machinery, standalone Task execution, and multi-agent coordination |
| `kai-contributor` | Optional public feedback plus lean Kai agent and skill authoring guidance |
| `kai-project-management` | Optional Direction, Epic, Feature, Requirement, priority, holds, dependencies, and planning closure |
| `kai-engineering` | Frontend and backend implementation, bounded unattended delivery, selective review, technical writing, and explicit delivery |
| `kai-creative` | UI/UX, visual identity, design assets, and supported media production |

Core is deliberately agent-free. Contributor is also agent-free and standalone:
it stores no project state and can be installed on its own. Project Management
owns planning; Core does not interpret planning records. Engineering and
Creative can work from supplied approved scope without Project Management.

The generated **[agents and skills catalog](docs/reference/agents-and-skills.md)**
is the authoritative inventory.

## Install

Prerequisite: an installed and authenticated
[GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli).

Add the marketplace and inspect the available version:

```text
copilot plugin marketplace add ketzalcode/kai
copilot plugin marketplace browse kai-plugins
```

For software work, start with:

```text
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-engineering@kai-plugins
```

Add optional packages as needed:

```text
copilot plugin install kai-contributor@kai-plugins
copilot plugin install kai-project-management@kai-plugins
copilot plugin install kai-creative@kai-plugins
```

The host copies plugin files; consumers do not run npm or install package
dependencies. After installing or updating a package, start a **new Copilot
session** so the host reloads the catalog.

The [catalog](docs/reference/agents-and-skills.md) describes each package's
agents and skills. Workspace setup is documented separately in
[Workspaces](docs/workspaces.md).

## Start with one real task

Direct implementation needs no workspace:

```text
Use eng-builder-backend to implement these API requirements as one coherent
change, including focused tests and named manual scenarios.
```

Request review explicitly when it adds value:

```text
Use eng-reviewer-code to review this completed diff against the supplied
requirements and report only material findings.
```

Use the software lead for coordinated or delivery work:

```text
Use eng-lead-software to coordinate this approved frontend/backend change and
prepare the resulting pull request.
```

Install `kai-contributor` to report something Kai got wrong or missed:

```text
Provide feedback to Kai: the frontend component missed this existing
composition principle.
```

`kai-feedback` searches for duplicates, removes private context, previews the
exact public issue, and requires confirmation before filing it with the
`kai-feedback` label.

Initialize a workspace only when work must survive across roles or sessions:

```text
Initialize this repository as a Kai workspace.
```

Private operational state lives under `.kai/` or in an explicitly selected
external workspace. Accepted project knowledge can be published under
`docs/kai/`. See the [workspace contract](docs/workspaces.md) for the exact
schema and paths.

## Operating principles

- **Direct by default.** Do not add agents, planning, or coordination to a
  bounded request that one role can complete well.
- **Progressive disclosure.** Catalog metadata selects a capability; full
  instructions and references load only when the task reaches them.
- **One owner per fact.** Core owns execution and coordination state. Project
  Management owns planning. Departments own domain work and publication rules.
- **Evidence over ceremony.** Tests and review scale with changed behavior and
  risk, not with a fixed process template.
- **Honest authority.** A producer cannot independently accept its own output.
  Kai never infers merge, release, deployment, spending, or external
  publication authority.
- **Current contracts only.** Unsupported workspaces are re-onboarded rather
  than carried through compatibility layers.

## Status

Repository version: `v24.0.0`. The release badge shows the latest published
version; the nightly badge shows validation status for current `main`.

For the durable details:

| Topic | Source |
| --- | --- |
| Package topology and authority | [Architecture](docs/architecture.md) |
| Workspace paths and schema | [Workspaces](docs/workspaces.md) |
| Current agents and skills | [Generated catalog](docs/reference/agents-and-skills.md) |
| Contributor and package conventions | [Plugin structure](docs/reference/plugin-structure.md) |
| Validation and release process | [Development process](docs/development-process.md) |
| Release history | [Changelog](CHANGELOG.md) |

## Contributing

Issues and pull requests are welcome. `AGENTS.md` contains the binding
repository instructions. Kai uses targeted local validation, one daily
Linux/Node 24 nightly, and a guarded Monday release from the exact green nightly
SHA.

## License

[MIT](LICENSE)

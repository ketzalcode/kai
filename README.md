# Kai

Kai is a lean, quality-first suite of specialized agents and skills for
agent-to-agent software collaboration in the GitHub Copilot CLI.

Its mission is simple: help developers ship better software with the right
expertise and evidence, without turning every change into a workflow.
Kai keeps direct work direct. It adds specialization, review, coordination, or
planning only when those things materially improve the result.

The vision is a composable engineering team with small roles, relevant context,
clear authority, and proportionate validation. Agents should disagree when the
evidence calls for it, stay inside their lane, and leave work understandable to
the next person or session.

Kai is open source. It ships declarative Markdown agents and skills plus small,
dependency-free Node runtimes for the capabilities that need durable state.
There is no service to run, no framework to adopt, and no MCP server bundled.

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

## Current package architecture

Kai ships five packages. Install only what you need.

```text
                         kai-contributor
                    feedback and authoring tools
                       no runtime or workspace

  kai-project-management ------> kai-core <------ kai-engineering
       optional planning         Task/A2A          software delivery
                                      ^
                                      |
                                kai-creative
                                design and media
```

| Package | Owns |
| --- | --- |
| `kai-core` | Shared operating rules, optional workspace machinery, standalone Task execution, and A2A coordination |
| `kai-contributor` | Optional public feedback plus lean Kai agent and skill authoring guidance |
| `kai-project-management` | Optional Direction, Epic, Feature, Requirement, priority, holds, dependencies, and planning closure |
| `kai-engineering` | Frontend and backend implementation, bounded unattended delivery, selective review, technical writing, and explicit delivery |
| `kai-creative` | UI/UX, visual identity, design assets, and supported media production |

Core is deliberately agent-free. Contributor is also agent-free and standalone:
it has no runtime, workspace state, publication vocabulary, or dependency on
Core. Project Management owns planning; Core does not interpret planning
records. Engineering and Creative can work from supplied approved scope without
Project Management.

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

Detailed selection, update, and workspace instructions are in
[Plugin structure](docs/reference/plugin-structure.md) and
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
- **One owner per fact.** Core owns execution and A2A state. Project Management
  owns planning. Departments own domain work and publication vocabularies.
- **Evidence over ceremony.** Tests and review scale with changed behavior and
  risk, not with a fixed process template.
- **Honest authority.** A producer cannot independently accept its own output.
  Kai never infers merge, release, deployment, spending, or external
  publication authority.
- **Current contracts only.** Unsupported workspaces are re-onboarded rather
  than carried through compatibility layers.

## Boundaries

- Kai ships no MCP servers. Browser-backed creative work uses a Playwright MCP
  server configured by the operator.
- Kai does not generate speech. Supplied narration can be aligned and mixed.
- The cloud coding agent and Copilot CLI have different host capabilities;
  cloud sessions cannot assume local scripts, live peer agents, or a human
  receipt journal.
- Nothing under `incubator/` ships or appears in the marketplace.
- `kai-feedback` files public issues only after a privacy review and explicit
  confirmation. It does not start automated remediation.

## Status

`v23.0.0` is the prepared release version for the current five-package
architecture. It is not a release until the guarded weekly release workflow
tags the exact successful nightly SHA.

For the durable details:

| Topic | Source |
| --- | --- |
| Package topology and authority | [Architecture](docs/architecture.md) |
| Workspace paths and schema | [Workspaces](docs/workspaces.md) |
| Current agents and skills | [Generated catalog](docs/reference/agents-and-skills.md) |
| Contributor and package conventions | [Plugin structure](docs/reference/plugin-structure.md) |
| Validation and release process | [Development process](docs/development-process.md) |
| Release history | [Changelog](CHANGELOG.md) |
| Inactive capabilities | [Incubator](incubator/README.md) |

## Contributing

Issues and pull requests are welcome. `AGENTS.md` contains the binding
repository instructions. Kai uses targeted local validation, one daily
Linux/Node 24 nightly, and a guarded Monday release from the exact green nightly
SHA.

## License

[MIT](LICENSE)

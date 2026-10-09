# Kai

Kai is an open-source plugin for the **GitHub Copilot CLI**. It adds a team of
specialist agents — implementation, architecture, independent review, delivery,
design and demo production — that each own a piece of judgment, and a durable
work record that survives the session.

**Who it is for.** Developers and small teams already using the Copilot CLI who
want a reviewer that disagrees with them, a scope owner that pushes back, and a
readable record of decisions instead of a chat log.

**What it is, literally.** Markdown. Agents and skills are declarative files the
host copies into place, plus a small amount of Node for the coordination runtime
and media helpers. There is no framework to learn and no service to run. Kai
contains no employer-specific knowledge and **ships no MCP servers**.

**Smallest first success:** install `kai-core` and `kai-engineering`
(see [Install](#install)), start a new session, and ask `eng-builder-software`
for one change. No workspace setup needed.

---

## What ships

Three packages. That is the entire shipped surface.

```text
   kai-engineering                      kai-creative
  +--------------------------------+   +--------------------------------+
  | 13 agents                      |   |  3 agents                      |
  |  7 skills                      |   |  7 skills                      |
  |  0 executable entry points     |   |  3 executable entry points     |
  | implementation, architecture,  |   | UI/UX, visual identity,        |
  | independent review, delivery   |   | video and demo production      |
  +--------------------------------+   +--------------------------------+
                  |                                    |
                  |             depends on             |
                  +-----------------+------------------+
                                    |
                                    v
  +----------------------------------------------------------------------+
  | kai-core                                                            |
  |                                                                      |
  |  5 agents                                                            |
  | 25 skills                                                            |
  |  6 executable entry points                                           |
  | hooks.json (subagent observation)                                    |
  | templates/ (decision, spec, report, publication)                     |
  |                                                                      |
  | shared operating contract, workspace machinery, and the coordination |
  | runtime (scripts/coordinate.mjs)                                     |
  +----------------------------------------------------------------------+
```

The arrows are the whole dependency rule, and it is enforced, not just
documented: `referenceErrors` in `tools/lib/pack-plan.mjs` fails the build if a
department pack loads a skill owned by another department, and `kai-core` may
reach no department at all. That is why a `kai-core`-only install always
resolves, and why you can install just the departments you want.

| Package | Agents / skills | Owns |
| --- | --- | --- |
| `kai-core` | 5 / 25 | Shared contracts, workspace machinery, requested coordination |
| `kai-engineering` | 13 / 7 | Implementation, architecture, independent review, delivery |
| `kai-creative` | 3 / 7 | UI/UX, visual identity, design assets, supported media production |

Counts come from `plugins/` and are checked against the generated
**[agents & skills catalog](docs/reference/agents-and-skills.md)** by `npm test`.
They describe source ownership, not runtime quality.

## Install

**Prerequisite:** the Copilot CLI, installed and logged in (`copilot` opens the
interactive prompt). See the
[Copilot CLI docs](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli)
if you do not have it.

Nothing else is required. The host installs a plugin by **copying files**; it
never runs npm, a build, or a lifecycle script. No package here carries a
`package.json`, so there is nothing to install into and no `npm ci` step — if
older documentation told you otherwise, it was describing a capability removed
in 14.0.0.

### 1. Add the marketplace and see what is really there

```text
copilot plugin marketplace add ketzalcode/kai
copilot plugin marketplace browse kai-plugins
```

> Browse before you install. Registering the repository does not prove any
> particular version is published there. Install only names and versions the
> browse result actually shows you.

### 2. Install the packages

`kai-core` first — the departments depend on it:

```text
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-creative@kai-plugins
```

Core alone is a complete install. Add only the departments you want; skipping
one costs you that department's agents and nothing else.

### 3. Verify it worked

```text
copilot plugin list
```

Each package you installed should appear as `<name>@kai-plugins` at the same
version. Then **start a new session** — plugins load per session, so the agents
are not callable in the session you installed from. In the new session, ask for
the catalog:

```text
List the kai agents you can see.
```

If nothing kai-related appears, the plugin loaded into the old session only.

> These commands change host install state and were not executed merely to
> write this page. Treat the current `browse` result, not repository prose, as
> proof of availability.

For local development, load a checkout without installing it:

```powershell
copilot --plugin-dir plugins\kai-core --plugin-dir plugins\kai-engineering --plugin-dir plugins\kai-creative
```

The cloud coding agent must be configured by its repository owner to load the
same package directories. Host tooling differs; see
[Architecture → Host capabilities](docs/architecture.md#host-capabilities).

### Updating

Two caches, and the order matters — refresh the catalog first or the update has
nothing new to find:

```text
copilot plugin marketplace update kai-plugins
copilot plugin update kai-core@kai-plugins
copilot plugin update kai-engineering@kai-plugins
copilot plugin update kai-creative@kai-plugins
```

Update only the packages you actually installed. Changes appear in **new**
sessions. Retired and incubated names do not update into successors
automatically. If the current runtime rejects an old workspace, follow
[Re-onboarding unsupported workspaces](docs/workspaces.md#re-onboarding-unsupported-workspaces).

## First five minutes

**1. Install** and start a new session — see [Install](#install) above.

**2. Ask directly for the capability.** Most work needs no setup at all:

```text
Ask eng-builder-software to implement these supplied requirements as one
coherent change, including the tests for its changed behavior.
```

**3. Initialize a workspace only if you need durable state.** Coordinated work
across several roles, resumed across sessions, needs somewhere to live:

```text
Initialize this repository as a kai workspace.
```

`workflow-workspace-init` asks where private state goes: **external** (no
`.kai/` in the repository) or **repo-local** (the whole `.kai/` tree is ignored
and untracked). Those are the only private placements. Accepted project
knowledge publishes separately under `docs/kai/`.

**4. For coordinated delivery**, ask `director-chief-of-staff`. It sequences
approved Tasks and handoffs; it does not take any specialist's acceptance authority,
and it is not a prerequisite for ordinary direct work.

**[Workspace contract →](docs/workspaces.md)** ·
**[See a finished feature →](examples/e2e-feature-delivery/)**

## Workspace and coordination model

Schema 5 separates private operations from accepted project knowledge:

```text
project/
├─ .kai/                                      # always private
│  ├─ manifest.json
│  ├─ core/runtime/coordination.sqlite        # authoritative coordination store
│  └─ <pack>/<type>/<id>/
│     ├─ drafts/                              # created on first valid write
│     ├─ evidence/                            # private and never published
│     └─ scratch/                             # disposable; cannot publish
└─ docs/kai/                                  # accepted, Git-suitable knowledge
   ├─ README.md
   ├─ DIRECTION.md
   └─ <pack>/<type>/<id>/...                  # exact accepted revision only
```

Installing or initializing a pack creates no empty department or artifact
directories. Core, Engineering, and Creative each own a fixed publication
vocabulary. A valid first write creates only its exact pack/type/ID/lifecycle
path; unknown types have no fallback lane. Repository-native code, tests,
configuration, migrations, and ordinary documentation stay where the
repository already keeps them.

`docs/kai/DIRECTION.md` is operator-owned and contains Vision, Mission, one
Current Goal, and Out of Scope. Coordinated work binds to its exact revision:

```text
Direction Current Goal
└─ Epic
   └─ Core / Engineering / Creative Feature
      └─ Requirement
         └─ Task
```

That is the five-level alignment chain. Epic, Feature, and Requirement express
outcomes and authority; Task is the only executable, leased work kind. Direct
single-shot work creates none of these records, reads no Direction, and
initializes no workspace.

Kai supports only schema 5. An unsupported workspace is rejected and
re-onboarded through `kai-core-workspace-reonboard`: accepted `docs/kai/`
knowledge is preserved, the old `.kai/` becomes an ignored timestamped backup,
and no historical database record is imported.

## What you actually get

**Roles that own judgment, not one assistant that agrees with you.** Engineering
owns implementation, `eng-reviewer-security` and `eng-reviewer-quality` review
independently, `creative-lead-design` owns interaction. A role that disagrees
with you says so.

**A durable record instead of a chat log.** Coordinated work lives in a store
reached through `scripts/coordinate.mjs`; drafts and evidence stay private until
you deliberately publish them. Close the session, come back next week, and the
state is still authoritative — readable by you and by the next agent.

**Only you ship.** No agent merges, deploys, pushes, tags, or awards itself
`shipped`. `workflow-ship` assesses release readiness and records the
`release-ready` → `deploying` → `shipped` transitions; the operator performs
every deployment and production action, and production verification is recorded
before anything is called shipped.

```text
  you ─► director-chief-of-staff ─► scope ─► design ─► engineering
                                                            │
   ┌────────────────────────────────────────────────────────┘
   │  quality · security · reliability review, bound to a revision
   ▼
  workflow-ship ─► release-ready verdict + recorded transitions ─► you deploy
                                                        │
   ┌────────────────────────────────────────────────────┘
   ▼
  production verification ─► shipped
```

Each role fires only when its kind of judgment is needed; several are skippable
on small work. See it end to end in
**[`examples/e2e-feature-delivery/`](examples/e2e-feature-delivery/)**, a
committed, CI-validated workspace.

**[Current architecture and authority map →](docs/architecture.md)**

## Limits

Read this before installing, not after.

- **No MCP servers are shipped.** Four components declare `playwright` and drive
  a real browser through an MCP server you register yourself —
  `creative-lead-design`, `eng-reviewer-quality`, and the
  `kai-core-web-evaluation` and `kai-core-web-content-extraction` skills.
  Everything else works without it. Register that server under the
  `playwright` key before invoking those components.
- **No audio or speech synthesis.** Removed entirely in 14.0.0, together with
  the last npm runtime dependency. Supplied narration can still be placed and
  mixed by `video-align-narration`; kai does not generate speech.
- **Kai does not ship for you.** Merging, deploying, publishing and sending are
  human actions by design. An agent that cannot get a human gate says so instead
  of proceeding.
- **The cloud coding agent is not a full host.** The coordination runtime cannot
  assume local scripts, localhost browser access, peer subagents, or a human
  receipt journal. See
  [Architecture → Host capabilities](docs/architecture.md#host-capabilities).
- **Nothing in `incubator/` is installable.** Five further capability packages —
  product, marketing, revenue, assistant, learning — plus ten document-review
  skills and the workflow agent that used them, are parked there. They are not
  discovered, not validated, not emitted,
  not catalogued, and were never in the marketplace index. Where an incubated
  package owned the only provider of a judgment, kai routes that work to
  `@operator` rather than to a substitute role that does not exist. See
  [`incubator/README.md`](incubator/README.md).
- **Kai holds no plan to compare a run against.** The fleet observer reports
  what a log actually recorded and never names roles that "should" have fired.
- **Running the repository's own tests needs Node
  `^22.22.2 || ^24.15.0 || >=26.0.0`.** Installing the plugin does not.

## Status

`v20.0.0` is this checkout's prepared metadata version — not a tag, a release,
a publication, or a host-verification claim.

| | |
| --- | --- |
| Packages | `kai-core`, `kai-engineering`, `kai-creative` |
| Surface | **21 agents and 39 skills** |
| Catalog | [Agents & skills](docs/reference/agents-and-skills.md) |
| Release history and reasoning | [CHANGELOG.md](CHANGELOG.md) |

## Where to go

| I want to… | Go to |
| ---------- | ----- |
| **Install it and finish one real thing** | [Install](#install) and [First five minutes](#first-five-minutes) |
| **See the shipped architecture** | [Architecture](docs/architecture.md) — package topology, generated JavaScript, workspace layout, and work hierarchy |
| **Know what it writes into my repo** | [Workspace model](docs/workspaces.md) — private `.kai/`, optional zero footprint, explicit `docs/kai/` publication |
| **Find the role that owns a judgment** | [Agents & skills](docs/reference/agents-and-skills.md) — the full catalog of what the three packages supply |
| **See what is parked and not shipping** | [Incubator](incubator/README.md) — the five capability packages and the components held out of the active tree |
| **Pick between the CLI and the cloud agent** | [Host capabilities](docs/architecture.md#host-capabilities) — what differs, and how it degrades |
| **Change Kai itself** | [Development process](docs/development-process.md) and [Plugin structure](docs/reference/plugin-structure.md) |

Everything is indexed in **[docs/](docs/README.md)**.

## Contributing

Issues and PRs are welcome. The normal contribution path runs targeted local
checks and `npm test`; Kai has no pull-request or push CI. One Linux nightly and
the guarded Monday release workflow own scheduled repository confidence.
[`AGENTS.md`](AGENTS.md), not this README, is the binding repository instruction
for contributors. The release checklist and version policy are in `AGENTS.md`
and **[Development process](docs/development-process.md)**.

## License

[MIT](./LICENSE)

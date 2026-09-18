# Kai

An open-source Copilot plugin that brings senior-engineering judgment into every
codebase you touch. You ask for an outcome; a team of specialist roles takes it
from need to production — leaving behind a durable, reviewable record instead of
a chat log.

kai is **declarative**: agents and skills are markdown, not a framework or a
service. It contains no employer-specific knowledge and ships no MCP servers.

Install the marketplace surface: **core, engineering, and creative**. Those
three packages are everything kai ships.

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin marketplace browse kai-plugins
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-creative@kai-plugins
```

Five further capability packages — product, marketing, revenue, assistant, and
learning — are parked under [`incubator/`](incubator/README.md) while
development returns to core. They do not ship, are not installable, and were
never in the marketplace index.

**[Get started →](docs/getting-started.md)** ·
**[See a finished feature →](examples/e2e-feature-delivery/)**

## Where to go

| I want to… | Go to |
| ---------- | ----- |
| **Install it and finish one real thing** | [Getting started](docs/getting-started.md) — install, initialize, first request |
| **Understand the model before I commit** | [How kai works](docs/how-kai-works.md) — which role fires when, and why |
| **Know what it writes into my repo** | [Workspace model](docs/workspaces.md) — private `.kai/`, optional zero footprint, explicit `docs/kai/` publication |
| **Find the role that owns a judgment** | [Agents & skills](docs/reference/agents-and-skills.md) — the full catalog of what the three packages supply |
| **See what is parked and not shipping** | [Incubator](incubator/README.md) — the five capability packages and the components held out of the active tree |
| **Pick between the CLI and the cloud agent** | [Host capabilities](docs/host-capabilities.md) — what differs, and how it degrades |
| **See what the coordination runtime actually proves** | [Coordination acceptance record](docs/reference/coordination-acceptance.md) — one verdict per case, including what failed and what is unverified |
| **Change kai itself** | [Plugin structure](docs/reference/plugin-structure.md) — layout, tests, release policy |

Everything is indexed in **[docs/](docs/README.md)**.

## Status

`v13.1.0` is this checkout's prepared metadata version. kai ships **three
packages** — `kai-core`, `kai-engineering`, and `kai-creative` — supplying
**22 agents and 40 skills**. The
[agents & skills catalog](docs/reference/agents-and-skills.md) is exactly what
they provide. Prepared metadata is not a tag, a release, a publication, or a
host-verification claim.

This release reorganizes the repository around what it ships. The five
capability packages previously retained as pre-release source — product,
marketing, revenue, assistant, and learning — moved to
[`incubator/`](incubator/README.md) and were fully deactivated: not discovered,
not validated as packs, not emitted, not installable. None of them was ever in
the marketplace index, so nothing was withdrawn from a host that installed
core, engineering, or creative. Removing an index entry never uninstalls an
already-installed package, and this change touches no host settings, caches,
credentials, `.kai` state, or private data.

Two consequences worth knowing. Where an incubated package owned the only
provider of a judgment — product discovery, in-voice drafting, promotion
judgment, support triage — core prose now routes that work to `@operator`
rather than to a substitute role that does not exist. And no shipped agent
currently declares an agent-to-agent dispatch entry; the roles that did were
incubated, so that firing path is recorded as empty rather than asserted
vacuously.

`kai-core` ships the coordination runtime — `scripts/coordinate.mjs` and its
`scripts/lib/coordination-runtime/` closure — and the breaking workspace
**schema 4**: coordinated work lives in a SQLite store reached only through
that command, and a schema-3 workspace stays inspect-only until an explicit,
separately authorized migration runs. The coordination suites run in `npm test`
and in a CI job covering Node `22.22.2`, `24.15.0` and `26.0.0`.

`kai-engineering` exports 13 focused agents and five task-local skills. Direct
implementation, investigation and assessment accept supplied inputs with core
plus engineering, without compulsory sibling-agent calls. Builders own their
tests; code, system, security, reliability and privacy reviews retain
independent acceptance boundaries.
See [the engineering package note](docs/reference/packages/kai-engineering.md)
for the roster, retirement mapping and direct-use boundaries.

Ten document-review skills and their dependent workflow remain held out of
`kai-engineering` under [`incubator/`](incubator/README.md), outside active
discovery, routes and generated packs.

`kai-creative` registers `creative-lead-design`, `creative-lead-video`, and
`workflow-creative-demo-production` as its only agents. Its final method surface
is `mockups-ascii`, `mockups-html`, `html-block-diagrams`,
`video-create-narration`, `video-align-narration`, and `video-render-zoom`.
Core plus creative accepts supplied briefs and evidence without marketing or
assistant. All six method sources and generated packs are integrated at the
prepared version. Source integration is not live-host or release acceptance.
See [the package note](docs/reference/packages/kai-creative.md) for artifacts,
prerequisites, and runtime scenarios not executed during this source refactor.

Agents load shared contracts on demand. Every shipped role routes each contract
at the instruction that needs it, rather
than declaring every contract they might use before reading the task. Measured
worst case, that moved the mean prompt from 30,194 to 17,529 tokens and the
largest role from 41,607 to 25,526 — and the old number was a floor paid every
run, where the new one is a ceiling. There is one agent shape, with no version
marker and no compatibility mode.

Four core contracts were split by the reader they serve:
`kai-core-team-operating-rules`, `kai-core-work-coordination`,
`kai-core-workspace-conventions` and `kai-core-asset-lifecycle` are removed in
favour of eight narrower ones. Consumers referencing the old ids must re-point;
the CHANGELOG carries the mapping. All capability-package agents now use
task-local routes rather than eager declarations or dependency-guard blocks.

Agent creation has an explicit contract: provider family, operating posture,
scope, authority, execution profile, model policy, host-specific tools,
on-demand skills, handoffs, and acceptance cases are settled before a role
joins the fleet.

Workspace schema 3 keeps operational state under `.kai/`, supports
zero-footprint external workspaces through a machine-local registry, and
publishes only accepted project knowledge to a configurable documentation root.
This repository no longer commits its former operational workspace. Maintainers
can pair this checkout with an external workspace without adding Kai state to
the source tree.

Each agent and skill now has exactly one authoritative source inside its owning
`plugins/<plugin>/` tree. The duplicate root `agents/` and `skills/` directories
are gone. Generation is limited to derived manifests, dependency locks, and
routed scripts. Regeneration strips stale dependency-guard regions rather than
emitting them; agents carry task-local routes in their authoritative sources.

Every role can route to the shared asset contracts; roles load them when durable
output is about to change. Generated work separates
execution completion from artifact disposition and validity, preserves
superseded or retracted history, and adds asset/backlog/ownership sweeps to
initiative closure. Workspace enforcement rolls out separately as warn,
reconcile, then error.

> **`v1.0.0` changes the install surface.** The published monolith `kai` is
> retired. Install required `kai-core` plus the selected capability packs.
> If legacy `kai` is
> installed, use its `workflow-workspace-init` guided migration before removing
> it. The guide verifies replacement availability, requires the monolith to be
> gone, installs core first, and checks every step.

**The original five-package install layout was `kai-core` + `kai-personal` +
`kai-product` + `kai-engineering` + `kai-gtm`.** This refactor adds
`kai-assistant`, `kai-creative`, `kai-marketing`, `kai-revenue` and `kai-learning`
to the checkout and retires `kai-gtm` and `kai-personal`; verify availability in the
marketplace source you use rather than treating this source layout as a publication claim.
Plugin-local agent and skill files are the canonical source. Generation refreshes
routed scripts, each script's local module closure, the fleet hooks, manifests,
dependency locks, and removal of legacy marked dependency-guard regions.
Each carries a deterministic, lockstep `package.json` and `package-lock.json`.
Copilot copies plugin files but does not run npm, so
optional audio features use `LECTORIA_BIN`, a pack-local `npm ci`, or PATH;
ordinary pack behavior needs no dependency installation.

`workflow-workspace-init` now also carries the honest guided pack installer:
it shows the closed pack set and exact commands, confirms the plan, installs
core first, verifies every step, stops with precise partial state, and requires
a fresh session after an actual pack install or update. If a requested
department is not yet published in the default marketplace surface, its browse
gate stops before removal or installation; it never falls back to unpublished
direct paths.

The existing migration doctor is a separate runtime tool:
`npm run doctor:migration` is a read-only report on whether a host may install
the pack surface: it reads the host's install metadata and every install tree,
names what is there (legacy `kai`, `kai-core`, department packs), and separates
a direct install from a marketplace one. It changes nothing — every repair is a
step you run. It fails closed: legacy `kai` must be verifiably uninstalled
before a pack install, coexistence is refused rather than warned through, and
evidence it could not read is reported as `unknown`, never as clear. The pack
partition stays CI-enforced by four named gates: the partition itself, id
collisions across packs, a department installed without `kai-core`, and
contract-version skew. The committed marketplace index lists the package
sources rather than the monolith. This change moves `kai-product`,
`kai-marketing`, `kai-revenue`, `kai-assistant` and `kai-learning` out of the
partition entirely; the entries alone do not establish remote availability or
publication.

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-creative@kai-plugins
```

The core pack carries the fleet observer and shared workspace machinery;
engineering carries implementation, security, reliability, data and delivery;
creative carries UI/UX, visual identity, and video/demo work. The five
incubated packages are visible in `incubator/` and in the package-availability
reference, and are not installable. A CI rule keeps every marketplace source,
name, description, and
version aligned with its pack manifest. If legacy `kai` is installed, do not
install packs beside it; see
[Getting started](docs/getting-started.md#upgrading-from-the-kai-monolith).

Before that, a rendering fix reported from a real macOS run.

The live fleet view scrolled instead of updating in place: it cleared the
screen with `ESC[2J`, and macOS Terminal implements that by pushing the erased
lines into scrollback. The view now takes the terminal's alternate screen,
which has no scrollback at all, and redraws in place without flicker. A frame
taller than the window is fitted rather than allowed to scroll — worker rows
are dropped with a count, and the caveats at the bottom are never what
disappears. The terminal is restored on every exit path, not just `ctrl-c`.

Before that, two fixes found by actually running the thing.

A live agent run showed that 54 of 56 agents had **no shell on Windows**. The
portable primary alias is now `execute`; a CI rule rejects the retired
host-specific spellings. The earlier failure had disabled every script-running
contract on the platform, which is why nothing had ever written
`.kai/activity.jsonl`.

Watching the observer showed the second: an opted-in summary was withheld
whenever the reply's first sentence named a path — the common case, since
agents answer questions about codebases — and a withheld summary looked exactly
like a feature that never worked. The refusal now says so, recording the shape
of what it refused and never the text.

`--sequence`, added in `v0.49.0`, is the view `kai-core-fleet-observation` was
named for: every run in the retained history, in the order it began, each
labelled `said` (the agent's own account) or `seen` (the host's). It lists
only what a log recorded and never names the roles that should have been there,
because kai holds no plan to compare against and a display that invented one
would look authoritative while being fiction.
Release history and the reasoning behind each change live in
**[CHANGELOG.md](CHANGELOG.md)**.

## First five minutes

**1. Install**, then start a *new* session — plugins load per session. Use
these commands only with a marketplace source containing this refactor.
Choose core plus engineering and/or creative from the actual browse result;
source presence alone is not proof that another package is available to install:

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin marketplace browse kai-plugins
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-creative@kai-plugins
```

Product, marketing, revenue, assistant, and learning are parked in
[`incubator/`](incubator/README.md). They are not installable and were never in
the marketplace index, so nothing was withdrawn from an existing host. See
[package availability](docs/reference/package-availability.md).

**2. Initialize** the repo or durable folder you want kai to work in only if
you need durable or coordinated workspace state. Ordinary direct engineering or
creative work does not need `.kai/`:

```text
Initialize this repository as a kai workspace.
```

Choose `external` for no Kai files in the repository, `repo-local` for an
ignored `.kai/`, or `shared` for team-visible state. Public project knowledge is
published separately under the configured documentation root.

**3. Ask directly for the capability.** For example, a direct engineering
request can work from supplied evidence without initializing a workspace:

```text
Ask eng-builder-software to implement these supplied requirements as one
coherent change, including the tests for its changed behavior.
```

If you explicitly want coordinated delivery across installed specialties, ask
`director-chief-of-staff`. It coordinates work items and handoffs without
taking specialist acceptance authority. It is not a prerequisite for ordinary
direct engineering or creative work.

**[Full walkthrough, plus optional audio and browser setup →](docs/getting-started.md)**

## What you actually get

**Roles that own judgment, not a single assistant that agrees with you.** The
product manager owns scope, the designer owns interaction, engineering owns
implementation, security and QA review independently. A role that disagrees with
you says so.

**A durable record instead of a chat log.** Work state lives in
`.kai/state/items/`, handoffs in `.kai/state/threads/`, and working initiative
artifacts stay private until deliberately published.
Close the session, come back next week, and the state is still authoritative —
readable by you and by the next agent.

**Only you ship.** No agent merges, deploys, publishes, sends, or awards itself
`shipped`. The release gate decides readiness and writes the exact deploy steps;
a human runs them, and production verification is recorded before anything is
called shipped.

See it for real in
**[`examples/e2e-feature-delivery/`](examples/e2e-feature-delivery/)** — a
committed, CI-validated workspace carrying one feature from brief to production,
with an adjacent idea deliberately routed to a proposal instead of being built.

```text
  you ─► director-chief-of-staff ─► PM (scope) ─► designer ─► engineering
                                                                   │
   ┌───────────────────────────────────────────────────────────────┘
   │  QA · security · SRE review, bound to a revision
   ▼
  workflow-ship ─► release-ready + deploy steps ─► you deploy
                                                        │
   ┌────────────────────────────────────────────────────┘
   ▼
  production verification ─► shipped
```

**[Every flow and the full trigger table →](docs/how-kai-works.md)**

## What it ships

The repository ships 22 agents and 38 skills across three packages:

| Package | Agents / skills | Owns |
| --- | --- | --- |
| `kai-core` | 6 / 27 | Shared contracts, workspace machinery, requested coordination |
| `kai-engineering` | 13 / 5 | Standalone implementation, architecture, independent review and delivery |
| `kai-creative` | 3 / 6 | UI/UX, visual identity, design assets and supported media production |

These are source-ownership counts, not publication or runtime-quality evidence.
Five further capability packages — product, marketing, revenue, assistant, and
learning — are parked in [`incubator/`](incubator/README.md): not discovered,
not emitted, not installable. None was ever in the marketplace index, so
incubating them withdrew nothing from an existing host. See
[package availability](docs/reference/package-availability.md).

You do not need to learn them. Ask for the outcome you want; the catalog is
there for when you want to know who owns a particular judgment.

**[Browse the full catalog →](docs/reference/agents-and-skills.md)**

## Install

See **[Getting started → Install](docs/getting-started.md#install)** for the
Copilot CLI, the cloud coding agent, and the optional audio and browser-automation
setup. With a source containing this change, refresh the catalog and update
the packs you actually installed:
`copilot plugin marketplace update kai-plugins`,
`copilot plugin update kai-core@kai-plugins`,
`copilot plugin update kai-engineering@kai-plugins`, and
`copilot plugin update kai-creative@kai-plugins`. Start a new session; to
migrate an existing workspace after an update, see
**[Upgrading a workspace](docs/getting-started.md#upgrading-a-workspace-after-a-plugin-update)**.
This applies to the three names above. Incubated and retired packages do not
update into successors automatically.

## Workspace

kai keeps operational state under `.kai/`. It can live outside the repository,
inside it but ignored, or inside it as shared state. Accepted project knowledge
publishes to a configurable root that defaults to `docs/kai/`.

**[The full workspace contract →](docs/workspaces.md)**

## How the agents chain

The agents are a *triggered graph*, not a fixed pipeline — each fires only when
its kind of judgment is needed, and several are skippable on small work.

**[Every flow diagram and the trigger table →](docs/how-kai-works.md)**

## Contributing

Issues and PRs are welcome. The normal contribution path runs `npm test` and CI.
The engineering foundation has targeted source-contract and local authoring
evidence, not native acceptance. Whole-branch review and scoped correction
review are complete; a green publication gate, release, and updated-host
runtime verification remain pending. The current
publication gate is blocked by the unchanged 53 source-validator errors and
existing pack-preview self-test `TypeError`.

**[Repository layout, test suite, and release policy →](docs/reference/plugin-structure.md)**

## License

[MIT](./LICENSE)

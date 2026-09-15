# Kai

An open-source Copilot plugin that brings senior-engineering judgment into every
codebase you touch. You ask for an outcome; a team of specialist roles takes it
from need to production — leaving behind a durable, reviewable record instead of
a chat log.

kai is **declarative**: agents and skills are markdown, not a framework or a
service. It contains no employer-specific knowledge and ships no MCP servers.

Install **core plus the capabilities you need**, not necessarily the full list.
The eight-package commands below require a marketplace source containing this
refactor branch. Browse that source first; registering the default repository
does not prove these new packages are remotely available.

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin marketplace browse kai-plugins
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-assistant@kai-plugins
copilot plugin install kai-creative@kai-plugins
copilot plugin install kai-learning@kai-plugins
copilot plugin install kai-product@kai-plugins
copilot plugin install kai-marketing@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-revenue@kai-plugins
```

`kai-assistant`, `kai-creative`, `kai-marketing`, `kai-revenue` and `kai-learning` are new on this branch; their installs
work only from a marketplace or checkout that carries this refactor — their
publication and remote availability were not established by this work.

**[Get started →](docs/getting-started.md)** ·
**[See a finished feature →](examples/e2e-feature-delivery/)**

## Where to go

| I want to… | Go to |
| ---------- | ----- |
| **Install it and finish one real thing** | [Getting started](docs/getting-started.md) — install, initialize, first request |
| **Understand the model before I commit** | [How kai works](docs/how-kai-works.md) — which role fires when, and why |
| **Know what it writes into my repo** | [Workspace model](docs/workspaces.md) — private `.kai/`, optional zero footprint, explicit `docs/kai/` publication |
| **Find the role that owns a judgment** | [Agents & skills](docs/reference/agents-and-skills.md) — the full catalog |
| **Pick between the CLI and the cloud agent** | [Host capabilities](docs/host-capabilities.md) — what differs, and how it degrades |
| **Change kai itself** | [Plugin structure](docs/reference/plugin-structure.md) — layout, tests, release policy |

Everything is indexed in **[docs/](docs/README.md)**.

## Status

`v9.0.0` is this checkout's prepared metadata version. The locked final surface
has **55 agents and 46 skills** across eight plugin directories targeting the
**Copilot CLI** and the **Copilot coding agent** (cloud). This work establishes
committed source, not release publication or live-host compatibility.
`kai-assistant`, `kai-creative`, `kai-marketing`, `kai-revenue` and `kai-learning` are new on this refactor branch; their
marketplace publication and remote availability have not been established.

The five engineering skill/caller source tasks are complete and individually
task-reviewed. `kai-engineering` exports 19 agents and five task-local skills.
Ten document-review skills and their dependent workflow remain source-retained
under `incubator/`, outside active discovery, routes and generated packs.
Final whole-branch review occurred and prompted narrow corrections to the
loaded core PR diagram trigger, style evidence labels, source-test prose
matching, and an optional HTML cross-reference. Scoped re-review accepted all
four corrections at `35a8d05`. Prepared `9.0.0` metadata does not publish the packages
or verify an updated host. Existing source-validator, pack self-test, and
version-skew failures remain release blockers. The
[recorded baseline](docs/reference/skill-evaluation/creative-foundation-baseline-2026-09-13.md)
keeps the original diagnostics separate from the current implementation.

`kai-assistant` is the first capability package split out of the original five:
it owns `personal-assistant`, `persona-self`, and their four private methods,
and `kai-core` no longer carries a personal front door or depends on one. The
eight-package source layout and integration metadata are now present; final
independent review, behavioral validation and release remain separate work.
Learning and career roles moved to `kai-learning`;
the `kai-personal` plugin is retired, not the private `.kai/personal/` data lane.

`kai-creative` now registers `creative-lead-design`, `creative-lead-video`, and
`workflow-creative-demo-production` as its only agents. Its final method surface
is `mockups-ascii`, `mockups-html`, `html-block-diagrams`,
`video-create-narration`, `video-align-narration`, and `video-render-zoom`.
Core plus creative accepts supplied briefs and evidence without marketing or
assistant. Final integration of all six method sources, generated packs,
runtime verification, and release metadata remains pending; this registry and
caller migration is not global acceptance.
See [the package note](docs/reference/packages/kai-creative.md) for artifacts,
prerequisites, and runtime scenarios not executed during this source refactor.

`kai-product` now owns ten discovery, scope, analytics, growth and product-audit
roles plus `product-exploration`. Core plus product accepts supplied evidence
without creative, engineering or commercial-package installation. See
[the product package note](docs/reference/packages/kai-product.md) for preserved
authority, independent assessment and runtime-unverified scenarios.

`kai-marketing` now owns four positioning, campaign, LinkedIn and search roles
plus `product-marketing-intelligence` and `linkedin-content`. Core plus marketing
accepts supplied facts/maps/media and neutral or requested company-brand voice;
personal-voice enhancement is optional.
See [the marketing package note](docs/reference/packages/kai-marketing.md) for
the grounding contract, ownership boundaries and runtime-unverified scenarios.

`kai-revenue` owns six sales, pricing, partnerships, revenue operations,
customer-success and support-intake roles. It has no standalone local skills;
core plus revenue supplies the shared contracts and accepts supplied commercial
evidence directly. `kai-gtm` is retired with no compatibility alias. See
[the revenue package note](docs/reference/packages/kai-revenue.md) for authority,
privacy, urgent escalation and runtime-unverified boundaries.

`kai-learning` owns the five tutoring, lesson-packaging, path, IC-career and
course-extraction roles plus the complete `generate-html-lesson` method.
Core plus learning handles supplied topics/material/goals directly. Audio uses
core's existing utility and requires explicit paid-processing consent and its
runtime prerequisites; extracted Markdown, HTML and MP3s are distinct outputs.
See [the learning package note](docs/reference/packages/kai-learning.md).

Agents load shared contracts on demand. All 26 roles now in `kai-core` and
`kai-engineering` route each contract at the instruction that needs it, rather
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
department is not yet published, its browse gate stops before removal or
installation; it never falls back to unpublished direct paths.

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
sources rather than the monolith. This branch adds `kai-assistant`,
`kai-creative`, `kai-marketing`, `kai-revenue` and `kai-learning` to that index
and removes `kai-gtm` and `kai-personal`;
the entries alone do not establish remote
availability or publication.

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-assistant@kai-plugins
copilot plugin install kai-creative@kai-plugins
copilot plugin install kai-learning@kai-plugins
copilot plugin install kai-product@kai-plugins
copilot plugin install kai-marketing@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-revenue@kai-plugins
```

The core pack carries the fleet observer and shared workspace machinery;
assistant carries personal tasks and voice; learning carries teaching and career;
creative carries UI/UX, visual identity, and video/demo work; product carries
discovery, analytics, growth and fitness-product assessment; engineering carries
implementation, security, reliability, data and delivery; marketing carries
positioning, campaigns, LinkedIn and search; revenue carries sales, pricing,
partnerships, revenue operations, customer success and support. A CI rule keeps every
marketplace source, name, description, and version aligned with its pack
manifest. If legacy `kai` is installed, do not install packs beside it; see
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

**1. Install**, then start a *new* session — plugins load per session. Use these
commands only with a marketplace source containing this eight-package refactor;
choose core plus the packages needed for your task:

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-assistant@kai-plugins
copilot plugin install kai-creative@kai-plugins
copilot plugin install kai-learning@kai-plugins
copilot plugin install kai-product@kai-plugins
copilot plugin install kai-marketing@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-revenue@kai-plugins
```

kai carries its own marketplace index, because the host has deprecated direct
`owner/repo` installs. The direct form still works today and prints a
deprecation warning; see [Getting started](docs/getting-started.md#install)
for it and for the coding-agent path. The complete source surface is
`kai-core`, `kai-engineering`, `kai-product`, `kai-creative`, `kai-marketing`,
`kai-revenue`, `kai-assistant`, and `kai-learning`. Publication and remote
availability of this exact surface were not established by this work.

**2. Initialize** the repo or durable folder you want kai to work in:

```text
Initialize this repository as a kai workspace.
```

Choose `external` for no Kai files in the repository, `repo-local` for an
ignored `.kai/`, or `shared` for team-visible state. Public project knowledge is
published separately under the configured documentation root.

**3. Ask directly for the capability.** For example, core plus product can
work from supplied evidence without installing engineering or creative:

```text
Ask principal-product-manager to turn these user requests into a scoped
CSV-export brief with success measures.
```

If you explicitly want coordinated delivery across installed specialties, ask
`director-chief-of-staff`. It coordinates work items and handoffs without
taking specialist acceptance authority. For your *own* tasks, priorities,
briefings, or drafts, ask `personal-assistant` directly. Neither it nor a
director is a prerequisite for an ordinary domain task.

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

The repository's final 55-agent, 46-skill surface has eight owners:

| Package | Agents / skills | Owns |
| --- | --- | --- |
| `kai-core` | 6 / 27 | Shared contracts, workspace machinery, requested coordination |
| `kai-engineering` | 19 / 5 | Implementation, architecture, reliability, trust, technical writing |
| `kai-product` | 10 / 1 | Discovery, scope, evidence, analytics, product-led growth and product audits |
| `kai-creative` | 3 / 6 | UI/UX, visual identity, design assets and supported media production |
| `kai-marketing` | 4 / 2 | Positioning, campaigns, social content and search visibility |
| `kai-revenue` | 6 / 0 | Sales, pricing, partnerships, revenue operations, success and support intake |
| `kai-assistant` | 2 / 4 | Personal tasks, priorities, briefings and user-voice drafting |
| `kai-learning` | 5 / 1 | Teaching, tutoring, paths, lesson materials and career development |

These are source-ownership counts, not publication or runtime-quality evidence.
Every capability package supports core plus itself with adequate supplied
inputs. A usual upstream producer is optional; factual provenance, scope and
real acceptance boundaries still apply. Revenue intentionally declares no
local skill component. `kai-gtm` and `kai-personal` are retired without aliases;
see [replacement guidance](docs/getting-started.md#replacing-retired-packages).

You do not need to learn them. Ask for the outcome you want; the catalog is
there for when you want to know who owns a particular judgment.

**[Browse the full catalog →](docs/reference/agents-and-skills.md)**

## Install

See **[Getting started → Install](docs/getting-started.md#install)** for the
Copilot CLI, the cloud coding agent, and the optional audio and browser-automation
setup. With a source containing this refactor, refresh the catalog and update
only the packs you actually installed:
`copilot plugin marketplace update kai-plugins`,
`copilot plugin update kai-core@kai-plugins`,
`copilot plugin update kai-assistant@kai-plugins`,
`copilot plugin update kai-creative@kai-plugins`,
`copilot plugin update kai-learning@kai-plugins`,
`copilot plugin update kai-product@kai-plugins`,
`copilot plugin update kai-marketing@kai-plugins`,
`copilot plugin update kai-engineering@kai-plugins`, and
`copilot plugin update kai-revenue@kai-plugins`. Start a new session; to
migrate an existing workspace after an update, see
**[Upgrading a workspace](docs/getting-started.md#upgrading-a-workspace-after-a-plugin-update)**.
This applies to all eight names above, including assistant, creative, marketing,
revenue and learning. Retired packages do not update into successors automatically.

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

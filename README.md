# Kai

An open-source Copilot plugin that brings senior-engineering judgment into every
codebase you touch. You ask for an outcome; a team of specialist roles takes it
from need to production — leaving behind a durable, reviewable record instead of
a chat log.

kai is **declarative**: agents and skills are markdown, not a framework or a
service. It contains no employer-specific knowledge and ships no MCP servers.

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin install kai@kai-plugins
```

**[Get started →](docs/getting-started.md)** ·
**[See a finished feature →](examples/e2e-feature-delivery/)**

## Where to go

| I want to… | Go to |
| ---------- | ----- |
| **Install it and finish one real thing** | [Getting started](docs/getting-started.md) — install, initialize, first request |
| **Understand the model before I commit** | [How kai works](docs/how-kai-works.md) — which role fires when, and why |
| **Know what it writes into my repo** | [Workspace model](docs/workspaces.md) — the `.kai/` + `kai/` contract |
| **Find the role that owns a judgment** | [Agents & skills](docs/reference/agents-and-skills.md) — the full catalog |
| **Pick between the CLI and the cloud agent** | [Host capabilities](docs/host-capabilities.md) — what differs, and how it degrades |
| **Change kai itself** | [Plugin structure](docs/reference/plugin-structure.md) — layout, tests, release policy |

Everything is indexed in **[docs/](docs/README.md)**.

## Status

`v0.64.0` — **56 agents and 51 skills**, for the **Copilot CLI** and the
**Copilot coding agent** (cloud).

**The first generated pack slice is committed: `kai-core` + `kai-personal`.**
Root remains the canonical source; generation copies agents, skills, routed
scripts, each script's local module closure, and the fleet hooks exactly once.
These trees are deliberately **unpublished and not installable from the
marketplace**. They carry no npm manifests yet, so optional Lectoria execution
inside a pack resolves only through `LECTORIA_BIN` or `PATH` until publication
owns dependency installation.

The pack migration remains checkable before it is possible:
`npm run doctor:migration` is a read-only report on whether a host may install
the pack surface: it reads the host's install metadata and every install tree,
names what is there (legacy `kai`, `kai-core`, department packs), and separates
a direct install from a marketplace one. It changes nothing — every repair is a
step you run. It fails closed: legacy `kai` must be verifiably uninstalled
before a pack install, coexistence is refused rather than warned through, and
evidence it could not read is reported as `unknown`, never as clear. The pack
partition stays CI-enforced by four named gates: the partition itself, id
collisions across packs, a department installed without `kai-core`, and
contract-version skew.
kai still ships as the single `kai` plugin; the marketplace remains one entry.

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin install kai@kai-plugins
```

A marketplace install was measured to be a **full repository checkout** — all
56 agents and `scripts/` — so the fleet observer stays reachable without a
clone. The direct form remains documented as a fallback while the host honours
it, and a CI rule keeps the index from drifting out of step with the version it
claims to ship. If you already installed the direct way, **uninstall first** —
installing over the top leaves you with both copies; see
[Getting started](docs/getting-started.md#install).

Before that, a rendering fix reported from a real macOS run.

The live fleet view scrolled instead of updating in place: it cleared the
screen with `ESC[2J`, and macOS Terminal implements that by pushing the erased
lines into scrollback. The view now takes the terminal's alternate screen,
which has no scrollback at all, and redraws in place without flicker. A frame
taller than the window is fitted rather than allowed to scroll — worker rows
are dropped with a count, and the caveats at the bottom are never what
disappears. The terminal is restored on every exit path, not just `ctrl-c`.

Before that, two fixes found by actually running the thing.

A live agent run showed that 54 of 56 agents had **no shell on Windows**: they
declared the `bash` tool, and the host drops that name silently rather than
mapping it per-OS. Agents and skills now declare both `bash` and `shell`,
with a CI rule keeping the pair together. That had disabled every
script-running contract on the platform, which is why nothing had ever written
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

**1. Install**, then start a *new* session — plugins load per session:

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin install kai@kai-plugins
```

kai publishes its own marketplace index, because the host has deprecated direct
`owner/repo` installs. The direct form still works today and prints a
deprecation warning; see [Getting started](docs/getting-started.md#install)
for it and for the coding-agent path.

**2. Initialize** the repo or durable folder you want kai to work in:

```text
Initialize this repository as a kai workspace.
```

This seeds about ten tracked files. It does not scatter directories across your
repo root, and it does not pre-create lanes you never use.

**3. Ask for the work, not for a role.** The front door routes it:

```text
I need users to be able to export a saved report as CSV.
```

`director-chief-of-staff` takes it to the PM for a brief, the architect for a
decision, and engineering for implementation — creating a work item, a durable
thread, and initiative artifacts as it goes. For a personal or unclear request,
start with `director-executive-assistant` instead.

**[Full walkthrough, plus optional audio and browser setup →](docs/getting-started.md)**

## What you actually get

**Roles that own judgment, not a single assistant that agrees with you.** The
product manager owns scope, the designer owns interaction, engineering owns
implementation, security and QA review independently. A role that disagrees with
you says so.

**A durable record instead of a chat log.** Work state lives in
`kai/coordination/items/`, handoffs in threads, outputs in initiative artifacts.
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

56 agents and 51 skills, grouped by the judgment they own — direction,
engineering, delivery, trust & reliability, product, customer operations,
revenue, growth & analytics, AI research, learning, exploration, content, and
personal.

You do not need to learn them. Ask a front door for an outcome and it routes.

**[Browse the full catalog →](docs/reference/agents-and-skills.md)**

## Install

See **[Getting started → Install](docs/getting-started.md#install)** for the
Copilot CLI, the cloud coding agent, and the optional audio and browser-automation
setup. To update an already-installed plugin, refresh the catalog and then the
plugin — `copilot plugin marketplace update kai-plugins` followed by
`copilot plugin update kai` — and start a new session; to migrate an existing
workspace after an update, see
**[Upgrading a workspace](docs/getting-started.md#upgrading-a-workspace-after-a-plugin-update)**.

## Workspace

kai writes into two roots: a hidden `.kai/` control plane and a visible `kai/`
working corpus. Nothing else lands in your repository root.

**[The full workspace contract →](docs/workspaces.md)**

## How the agents chain

The agents are a *triggered graph*, not a fixed pipeline — each fires only when
its kind of judgment is needed, and several are skippable on small work.

**[Every flow diagram and the trigger table →](docs/how-kai-works.md)**

## Contributing

Issues and PRs are welcome. Run `npm test` before opening one — six
dependency-free checks that also run in CI.

**[Repository layout, test suite, and release policy →](docs/reference/plugin-structure.md)**

## License

[MIT](./LICENSE)

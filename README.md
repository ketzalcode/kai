# Kai

An open-source Copilot plugin that brings senior-engineering judgment into every
codebase you touch. You ask for an outcome; a team of specialist roles takes it
from need to production — leaving behind a durable, reviewable record instead of
a chat log.

kai is **declarative**: agents and skills are markdown, not a framework or a
service. It contains no employer-specific knowledge and ships no MCP servers.

```text
copilot
/plugin install RubenSaucedo/kai
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

`v0.44.1` — **56 agents and 48 skills**, for the **Copilot CLI** and the
**Copilot coding agent** (cloud).

This release makes the fleet **watchable**. kai already recorded which subagents
emitted lifecycle events during a piece of work; now `observe-watch` renders that
live in its own terminal — roles with an open start, how long since it was
recorded, and what has finished — so a supervisor can glance instead of scrolling
a transcript. The new `fleet-observation` skill owns the operator path, including
finding the scripts inside the plugin's install directory so adoption never
requires cloning the repository.

The view refuses to overclaim: a start with no stop is reported as a fact about
the log, never as proof a process is alive, and same-role overlap is labelled as
ordering-based pairing rather than identity. It also reads the rotated
generation of the log, because a run that began before a rotation would
otherwise vanish and be reported as a quiet fleet.

Release history and the reasoning behind each change live in
**[CHANGELOG.md](CHANGELOG.md)**.

## First five minutes

**1. Install**, then start a *new* session — plugins load per session:

```text
/plugin install RubenSaucedo/kai
```

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

```
 you ─► director-chief-of-staff ─► PM (scope) ─► designer ─► engineering
                                                                  │
                    QA · security · SRE review, bound to a revision│
                                                                  ▼
              workflow-ship ─► release-ready + deploy steps ─► you deploy
                                                                  ▼
                              production verification ─► shipped
```

**[Every flow and the full trigger table →](docs/how-kai-works.md)**

## What it ships

56 agents and 47 skills, grouped by the judgment they own — direction,
engineering, delivery, trust & reliability, product, customer operations,
revenue, growth & analytics, AI research, learning, exploration, content, and
personal.

You do not need to learn them. Ask a front door for an outcome and it routes.

**[Browse the full catalog →](docs/reference/agents-and-skills.md)**

## Install

See **[Getting started → Install](docs/getting-started.md#install)** for the
Copilot CLI, the cloud coding agent, and the optional audio and browser-automation
setup. To update an already-installed plugin, run `/plugin update kai` and start
a new session; to migrate an existing workspace after an update, see
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

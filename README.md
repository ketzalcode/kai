# Kai

Kai is a lean, quality-first suite of specialized agents and skills for
agent-to-agent software collaboration. It combines repository-native coding
standards, focused TDD, explicit coordination, and evidence-based handoffs
without turning routine work into ceremony.

Kai keeps direct work direct. It adds agents, process, and validation only when
they materially improve correctness, context isolation, or delivery quality.
The goal is a high-performing engineering system: small roles, relevant
context, proportionate confidence, and fast shipping.

Kai is an open-source plugin for the **GitHub Copilot CLI**. Its focused agents
own frontend implementation, backend implementation, coordination, selective
review, technical writing, bounded unattended delivery, and creative work.
Durable coordination is available when direct work is not enough.

**Who it is for.** Developers and small teams already using the Copilot CLI who
want a reviewer that disagrees with them, a scope owner that pushes back, and a
readable record of decisions instead of a chat log.

**What it is, literally.** Markdown. Agents and skills are declarative files the
host copies into place, plus a small amount of Node for the coordination runtime
and media helpers. There is no framework to learn and no service to run. Kai
contains no employer-specific knowledge and **ships no MCP servers**.

**Smallest first success:** install `kai-core` and `kai-engineering`
(see [Install](#install)), start a new session, and ask
`eng-builder-frontend` or `eng-builder-backend` for one change. No workspace
setup needed.

---

## What ships

Three packages. That is the entire shipped surface.

```text
   kai-engineering                      kai-creative
  +--------------------------------+   +--------------------------------+
  |  6 agents                      |   |  3 agents                      |
  | 13 skills                      |   |  7 skills                      |
  |  1 executable entry point      |   |  3 executable entry points     |
  | frontend/backend, selective     |   | UI/UX, visual identity,        |
  | review, writing, explicit       |   |                                |
  | coordination and delivery      |   | video and demo production      |
  +--------------------------------+   +--------------------------------+
                  |                                    |
                  |             depends on             |
                  +-----------------+------------------+
                                    |
                                    v
  +----------------------------------------------------------------------+
  | kai-core                                                            |
  |                                                                      |
  |  0 agents                                                            |
  | 26 skills                                                            |
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
| `kai-core` | 0 / 26 | Shared skills, workspace machinery, coordination runtime |
| `kai-engineering` | 6 / 13 | Frontend and backend implementation, bounded unattended delivery, selective review, technical writing, and explicit delivery |
| `kai-creative` | 3 / 7 | UI/UX, visual identity, design assets, supported media production |

Counts come from `plugins/` and are checked against the generated
**[agents & skills catalog](docs/reference/agents-and-skills.md)** by `npm test`.
They describe source ownership, not runtime quality.

`eng-nightshift` is the explicit unattended path. One approved run
executes bounded pull-request slices serially in isolated worktrees, delivers
required outcomes first, preserves structured blockers, and leaves broader or
lower-confidence ideas in a private morning report. It never infers merge,
deployment, release, or production authority.

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

### Optional browser and media setup

Most of Kai needs no external runtime. Browser inspection and applicable video
operations need tools that Kai does not ship.

**Playwright MCP.** `creative-lead-design`, `kai-core-web-evaluation`, and
`kai-core-web-content-extraction` expect an MCP server registered under the
exact key `playwright`. For Copilot CLI, add this entry to
`~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--browser", "chromium"],
      "tools": ["*"]
    }
  }
}
```

Restart the CLI, run `/mcp`, and confirm that `playwright` is listed.
`npx` fetches `@playwright/mcp` on demand; no global install is required.
GitHub documents Playwright MCP as enabled by default for the
[Copilot coding agent and code review](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/configure-mcp-servers),
but those cloud hosts cannot inspect a local application.

**ffmpeg and ffprobe.** Install an
[FFmpeg distribution](https://ffmpeg.org/download.html) that provides both
commands, put them on `PATH`, and verify:

```text
ffmpeg -version
ffprobe -version
```

`video-render-zoom`, supplied-narration placement, duration/audio inspection,
and final mix commands use these tools when that operation requires them.
Missing tools are reported as an input gap; Kai does not install or assume
them.

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
Ask eng-builder-backend to implement these supplied API requirements as one
coherent change, including focused tests and named manual scenarios.
```

**3. Initialize a workspace only if you need durable state.** Coordinated work
across several roles, resumed across sessions, needs somewhere to live:

```text
Initialize this repository as a kai workspace.
```

`kai-core-workspace-onboarding` asks where private state goes: **external** (no
`.kai/` in the repository) or **repo-local** (the whole `.kai/` tree is ignored
and untracked). Those are the only private placements. Accepted project
knowledge publishes separately under `docs/kai/`.

**4. For coordinated delivery**, ask the owning department lead. Core supplies
the grant, lease, hierarchy, handoff, and evidence methods; it does not insert a
generic coordinating agent between the operator and the domain owner.

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

**Small roles with explicit purpose.** Frontend and backend builders apply
shared coding preferences plus only their relevant domain standards. The
software lead coordinates only when multiple bounded assignments add value.
`eng-reviewer-code` provides a fresh review only when requested or materially
justified. Direct work stays direct.

**A durable record instead of a chat log.** Coordinated work lives in a store
reached through `scripts/coordinate.mjs`; drafts and evidence stay private until
you deliberately publish them. Close the session, come back next week, and the
state is still authoritative — readable by you and by the next agent.

**You control lifecycle transitions.** Review, PR creation, merge, release, and
deployment are separate explicit actions. A merge request reads live repository
gates and merges only when authorized; it does not restart development or
review. Release and production actions remain repository- and operator-owned.

```text
  clear request ----> frontend/backend builder ----> evidence handoff
       |
       +-- explicit coordination ----> software lead ----> PR delivery
                                                |
                                                +-- selective review

  explicit merge ----> live repository gates ----> merge or exact blocker
```

Each role fires only when its kind of judgment is needed; several are skippable
on small work. See it end to end in
**[`examples/e2e-feature-delivery/`](examples/e2e-feature-delivery/)**, a
committed, CI-validated workspace.

**[Current architecture and authority map →](docs/architecture.md)**

## Limits

Read this before installing, not after.

- **No MCP servers are shipped.** Three components use `playwright` and drive a
  real browser through an MCP server you register yourself:
  `creative-lead-design`, `kai-core-web-evaluation`, and
  `kai-core-web-content-extraction`. Everything else works without it.
- **No audio or speech synthesis.** Removed entirely in 14.0.0, together with
  the last npm runtime dependency. Supplied narration can still be placed and
  mixed by `video-align-narration`; kai does not generate speech.
- **Kai does not infer shipping authority.** Merge requires an explicit
  instruction and live repository approval. Deploying, publishing, and sending
  remain human or repository-owned actions.
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

`v22.2.0` is this checkout's prepared metadata version - not a tag, a release,
a publication, or a host-verification claim.

| | |
| --- | --- |
| Packages | `kai-core`, `kai-engineering`, `kai-creative` |
| Surface | **9 agents and 46 skills** |
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

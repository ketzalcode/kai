[kai](../README.md) / [Docs](README.md) / Architecture

# Shipped architecture

Kai ships three packages from `plugins/`. Everything under `incubator/` is
inactive: it is not discovered, validated as a pack, generated, catalogued, or
installable.

## Package topology

```text
  kai-engineering                         kai-creative
  +-------------------------------+       +-------------------------------+
  | 13 agents                     |       | 3 agents                      |
  | engineering judgment          |       | design and media judgment     |
  | no JavaScript entry points    |       | 3 JavaScript entry points     |
  +---------------+---------------+       +---------------+---------------+
                  |                                       |
                  +-------------------+-------------------+
                                      |
                                      v
  +-----------------------------------------------------------------------+
  | kai-core                                                              |
  | 5 agents; shared contracts; workspace and coordination runtime         |
  | 6 JavaScript entry points; hooks and reusable templates                |
  +-----------------------------------------------------------------------+
```

Core has no department dependency. Engineering and Creative may depend on
Core, but not on each other. The build derives active ownership from the three
package directories and rejects collisions or forbidden cross-package
references.

## One authority per fact

| Fact | Edited authority | Consumers |
| --- | --- | --- |
| Workspace schema and locations | `WORKSPACE_CONTRACT` in `src/core/lib/workspace-layout.mjs` | resolver, doctor, runtime, tests, generated scripts |
| Path containment and link safety | `src/core/lib/workspace-path-safety.mjs` | private writes and publication |
| Coordination records and commands | coordination registry in `src/core/lib/coordination-runtime/schema.mjs` | store, engines, evidence, views, host, CLI |
| Publication vocabulary | `plugins/<pack>/publication.json` | publication skills, path validation, generated references |
| Package ownership | `plugins/kai-{core,engineering,creative}/` | build, marketplace, catalog |
| Release version | `package.json` | root/package manifests, locks, marketplace |
| Consumer runtime | `src/core/` and `src/creative/` | committed bundled scripts |

Markdown explains these contracts. It is not parsed as a second schema.

## Build boundary

Contributors edit source; consumers execute committed output:

```text
AUTHORITATIVE SOURCE

plugins/<pack>/agents/
plugins/<pack>/skills/
plugins/<pack>/publication.json
src/core/
src/creative/
package.json
          |
          | npm run build
          v
COMMITTED CONSUMER ARTIFACTS

plugin.json
.github/plugin/marketplace.json
plugins/<pack>/.claude-plugin/plugin.json
plugins/<pack>/plugin-lock.json
plugins/kai-core/scripts/
plugins/kai-creative/scripts/
docs/reference/agents-and-skills.md
```

`tools/build.mjs` is the single build entry point. It validates structured
sources, renders publication and catalog material, writes every version surface,
and bundles stable ESM runtimes. `npm run build:check` proves the committed
outputs match a fresh calculation. The clean-consumer test proves the generated
packages run without checkout dependencies.

## Consumer workspace

Kai creates state only for durable coordinated work:

```text
project/
|-- .kai/                                  private and ignored
|   |-- manifest.json
|   |-- core/runtime/coordination.sqlite  only coordination authority
|   `-- <pack>/<type>/<id>/
|       |-- drafts/
|       |-- evidence/
|       `-- scratch/
`-- docs/kai/                              accepted project knowledge
    |-- README.md
    |-- DIRECTION.md
    `-- <pack>/<type>/<id>/...
```

Pack directories are lazy. Direct answers and ordinary repository changes do
not initialize Kai, read Direction, create hierarchy records, or acquire a
lease.

## Coordination and assets

```text
docs/kai/DIRECTION.md
`-- Current Goal
    `-- Epic
        `-- Core / Engineering / Creative Feature
            `-- Requirement
                `-- Task
```

Task is the only executable and leased kind. The SQLite store owns durable
state, transactions, optimistic versions, leases, messages, evidence, and
events. Status, context, plans, reports, and exports are views.

Execution and asset lifecycle are independent. A completed Task remains
terminal when a published asset later becomes stale or superseded. Revalidation
requires new authorized work. A durable publication binds an existing hierarchy
subject, acting authority, exact private revision, acceptance authority, hash,
provenance, and a destination allowed by the owning package's
`publication.json`. Producers do not self-accept team-facing publications.

## Host capabilities

The declarative agents, skills, and contracts are the same on every host. Live
tools differ:

| Capability | Copilot CLI | Copilot coding agent |
| --- | --- | --- |
| Agents and skills | Yes | Yes |
| Local Node/SQLite runtime | Yes | Runner-dependent |
| Live peer subagents | Yes | No; use the durable record |
| Localhost browser automation | With a configured Playwright MCP server | Public URLs only when configured |
| Web search and fetch | Built in | Repository-tool dependent |
| Human-receipt journal for gated writes | Available in supported CLI sessions | Not assumed |

Missing capabilities narrow the workflow or produce `UNSUPPORTED_HOST`; they
never become inferred success. Browser skills require an MCP server registered
under the `playwright` key. Windows runtime and path behavior is not covered by
the Linux nightly.

## Repository instructions

An installed plugin's root `AGENTS.md` is not loaded into a consumer project.
Shared product rules therefore ship as task-local skills. During workspace
onboarding, the operator may separately install Kai's managed repository block
into the project's own `AGENTS.md`. The installer preserves all bytes outside
the markers and never stages the file without separate authorization.

---

**Related:** [Workspaces](workspaces.md) ·
[Development process](development-process.md) ·
[Plugin structure](reference/plugin-structure.md)

[kai](../README.md) / Architecture

# Shipped architecture

This document describes the production surface of Kai. It covers only the
three packages shipped from `plugins/`: Core, Engineering, and Creative.
Everything under [`incubator/`](../incubator/README.md) is outside this
architecture and is not part of the installable product.

## Package topology

```text
  kai-engineering                         kai-creative
  +-------------------------------+       +-------------------------------+
  | 13 agents                     |       | 3 agents                      |
  |  7 skills                     |       | 7 skills                      |
  |  0 JavaScript entry points    |       | 3 JavaScript entry points    |
  |                               |       |                               |
  | implementation               |       | UI and UX                     |
  | architecture                 |       | visual identity               |
  | independent review           |       | design and demo production    |
  | delivery                     |       |                               |
  +---------------+---------------+       +---------------+---------------+
                  |                                       |
                  |              depends on               |
                  +-------------------+-------------------+
                                      |
                                      v
  +-----------------------------------------------------------------------+
  | kai-core                                                              |
  |                                                                       |
  | 5 agents                                                              |
  | 24 skills                                                             |
  | 6 JavaScript entry points                                             |
  | hooks.json and reusable templates                                     |
  |                                                                       |
  | shared operating contracts                                            |
  | workspace and publication contracts                                   |
  | requested coordination runtime                                        |
  +-----------------------------------------------------------------------+
```

Core has no dependency on a department package. Engineering and Creative can
depend on Core, but cannot depend on each other. This keeps a Core-only install
valid and lets consumers install only the departments they need.

## Authoring, build, and consumption

Kai separates files contributors edit from files consumers execute:

```text
AUTHORITATIVE SOURCE

plugins/<pack>/agents/            agent definitions
plugins/<pack>/skills/            skill definitions
src/core/                         Core executable source
src/creative/                     Creative executable source
          |
          | npm run pack-preview -- --write
          | implemented by tools/pack-preview.mjs
          v
COMMITTED CONSUMER ARTIFACTS

plugins/kai-core/scripts/         19 generated JavaScript modules
  +-- 6 executable entry points
  +-- 13 shared chunks

plugins/kai-engineering/          no JavaScript runtime

plugins/kai-creative/scripts/      4 generated JavaScript modules
  +-- 3 executable entry points
  +-- 1 shared chunk
```

The generated scripts are native ESM bundles. They carry their runtime
dependencies with the package and do not resolve code from the source checkout.
Contributors edit `src/`, never generated chunks. `tools/pack-preview.mjs` is
the single build boundary that refreshes and checks the committed artifacts.

The public executable entry points are:

| Package | Entry points |
| --- | --- |
| `kai-core` | `activity.mjs`, `coordinate.mjs`, `observe-subagent.mjs`, `observe-watch.mjs`, `work-status.mjs`, `workspace-doctor.mjs` |
| `kai-engineering` | None |
| `kai-creative` | `demo-format.mjs`, `demo-narrate.mjs`, `demo-zoom.mjs` |

## Consumer workspace

Kai creates workspace state only when a coordinated workflow needs it. Pack
directories are lazy: installing a package does not create empty department
trees.

```text
project/
|-- .kai/                                  private; ignored by Git
|   |-- manifest.json
|   |-- core/
|   |   `-- runtime/
|   |       `-- coordination.sqlite       authoritative work record
|   `-- <pack>/<type>/<id>/
|       |-- drafts/                        work in progress
|       |-- evidence/                      private verification material
|       `-- scratch/                       disposable; never publishable
|
`-- docs/kai/                              accepted, Git-suitable knowledge
    |-- README.md
    |-- DIRECTION.md                       operator-owned intent
    `-- <pack>/<type>/<id>/...             exact accepted revision
```

The split is deliberate:

- `.kai/` contains private operations, drafts, evidence, and the SQLite source
  of truth.
- `docs/kai/` contains only explicitly accepted knowledge.
- Repository-native code, tests, migrations, configuration, and ordinary
  documentation stay in their existing project locations.
- Each pack owns its publication vocabulary. Unknown types have no fallback
  folder.

## Work hierarchy

```text
docs/kai/DIRECTION.md
`-- Current Goal
    `-- Epic
        `-- Core / Engineering / Creative Feature
            `-- Requirement
                `-- Task
```

Direction records Vision, Mission, one Current Goal, and Out of Scope. The
operator owns it, and coordinated work binds to its exact revision.

Epic, Feature, and Requirement define outcomes and authority. Task is the only
executable and leased work kind. Ordinary single-shot work does not create this
hierarchy, read Direction, or initialize a Kai workspace.

## Authority at a glance

```text
operator intent       docs/kai/DIRECTION.md
durable work state    .kai/core/runtime/coordination.sqlite
private work files    .kai/<pack>/<type>/<id>/
accepted knowledge    docs/kai/<pack>/<type>/<id>/
agent and skill source plugins/<pack>/{agents,skills}/
runtime source        src/{core,creative}/
consumer JavaScript  plugins/<pack>/scripts/
build boundary        tools/pack-preview.mjs
```

See [Workspace model](workspaces.md) for storage modes and publication details,
and [Plugin structure](reference/plugin-structure.md) for contributor and
release mechanics.

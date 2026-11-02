[kai](../README.md) / [Docs](README.md) / Architecture

# Shipped architecture

Kai ships five packages from `plugins/`. Everything under `incubator/` is
inactive and non-installable.

## Package topology

```text
  kai-contributor
  0 agents; feedback/authoring; no runtime

                  optional
  kai-project-management --------+
  0 agents; planning runtime      |
                                  v
  kai-engineering -----------> kai-core <----------- kai-creative
  6 agents; delivery          0 agents; Task/A2A      3 agents; design/media
```

- Core has no dependency on another package.
- Contributor has no package dependency and owns no workspace state.
- Project Management may reference Core concepts and opaque Core Task IDs.
- Engineering and Creative depend only on Core.
- No agent requires Project Management.
- No runtime imports or opens another package's database.

## Authority boundary

| Owner | Durable authority |
| --- | --- |
| `kai-core` | Workspace, standalone Tasks, grants, leases, collisions, recovery, questions, messages, handoffs, reviews, evidence, activity, assets |
| `kai-contributor` | Public Kai feedback and Kai agent/skill authoring guidance; no durable runtime authority |
| `kai-project-management` | Direction, Epic, Feature, Requirement, priority, holds, planning dependencies, scope/completion authority, parent closure, planning views |
| Department | Supplied approved domain scope, implementation, review, and package publication |

Core's Task schema contains no planning record or lifecycle rule. A Task may
carry opaque `planning_refs`, but Core does not interpret them.

## Runtime boundary

```text
.kai/core/runtime/coordination.sqlite
  standalone Task execution and A2A records

.kai/project-management/runtime/project.sqlite
  optional planning records and planning events
```

Project Management's `handoff` command produces a proposed Core Task body from
approved Requirement scope. The caller submits it separately to Core. There is
no mirrored table, historical runtime-record import, compatibility alias, or
cross-database transaction.

## One authority per fact

| Fact | Edited authority |
| --- | --- |
| Workspace schema and locations | `WORKSPACE_CONTRACT` in `src/core/lib/workspace-layout.mjs` |
| Core records and commands | `src/core/lib/coordination-runtime/schema.mjs` |
| Project planning runtime | `src/project-management/project.mjs` |
| Publication vocabulary | `plugins/<pack>/publication.json` |
| Package ownership | `plugins/kai-{core,contributor,project-management,engineering,creative}/` |
| Release version | `package.json` |

Markdown explains these contracts. Validators do not parse prose as a second
schema.

## Build boundary

Contributors edit `plugins/`, `src/`, and package declarations. `npm run build`
generates root/package manifests, marketplace metadata, catalog content, and
bundled scripts. Consumers execute:

```text
plugins/kai-core/scripts/
plugins/kai-project-management/scripts/project.mjs
plugins/kai-engineering/scripts/
plugins/kai-creative/scripts/
```

All shipped runtimes use Node built-ins only.
`kai-contributor` ships Markdown skills only.

## Consumer workspace

```text
project/
|-- .kai/                                      private and ignored
|   |-- manifest.json
|   |-- core/runtime/coordination.sqlite
|   |-- project-management/runtime/project.sqlite  optional
|   `-- <pack>/<type>/<id>/{drafts,evidence,scratch}/
`-- docs/kai/                                  canonical project knowledge
```

Project knowledge is authored at its canonical repository path from creation,
on a branch. An established native documentation home takes precedence over
the default package route under `docs/kai/`; never maintain both as authorities.
Git preserves revisions and repository review governs integration. Required
named scope/design/completion acceptance remains distinct from committing,
merging, implementation, shipping, and external publication.

`.kai` is for runtime state, A2A communication, memory, private evidence and
working material, including immutable acceptance snapshots. It is not the
authoritative home for project documents. Coordinated knowledge acceptance
binds a Git base/head; private and non-Git deliverables retain exact-byte
acceptance and authorized publication. Project Management's planning database
and Creative media custody are unchanged.

Schema 6 is the only live contract. Unsupported workspaces are re-onboarded by
moving durable knowledge and artifacts into current package-owned paths,
rebuilding runtime state, and removing temporary staging after verification.
Installing a package creates no workspace, and Core onboarding does not
initialize the optional Project Management database.

## Department operation

Engineering and Creative accept a directly supplied approved brief or a
standalone Core Task. If an operator supplies Project Management projection
references, a department may use them as context. Their absence is not a
blocker.

Nightshift admits an approved goal plus a bounded set of Core Tasks. It may
retain a supplied planning projection, but its runner never opens or requires
the Project Management database.

## Host capabilities

| Capability | Copilot CLI | Copilot coding agent |
| --- | --- | --- |
| Agents and skills | Yes | Yes |
| Local Node/SQLite runtime | Yes | Runner-dependent |
| Live peer subagents | Yes | No; use durable Core records |
| Localhost browser automation | Configured Playwright MCP | Public URLs when configured |
| Human-receipt journal | Supported CLI sessions | Not assumed |

Missing capabilities narrow the workflow or produce `UNSUPPORTED_HOST`; they
never become inferred success.

---

**Related:** [Workspaces](workspaces.md) ·
[Development process](development-process.md) ·
[Plugin structure](reference/plugin-structure.md)

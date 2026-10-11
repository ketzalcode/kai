# Project Management Plugin Boundary

**Status:** Implemented for the 23.0.0 schema-6 break
**Date:** 2026-10-11
**Scope:** Core A2A coordination, durable planning hierarchy, package
dependencies, workspace persistence, and Nightshift integration

## Decision

Kai will add an optional, agent-free `kai-project-management` plugin.

Project Management owns durable planning semantics and its deterministic
runtime. Core owns the A2A execution protocol. Installing Core plus a department
must remain sufficient for direct work and standalone coordinated Tasks.

## Ownership boundary

| Owner | Responsibilities |
| --- | --- |
| `kai-core` | Workspace resolution; actor and authority identity; standalone executable Tasks; grants, leases, collisions, recovery, questions, messages, handoffs, reviews, evidence, activity, and asset lifecycle |
| `kai-project-management` | Direction; Epic, Feature, and Requirement records; planning dependencies; priority; holds; scope authority; parent acceptance and closure; planning views; creation and stewardship procedures |
| Department plugin | Domain decisions, implementation, review, and optional consumption of approved planning context |

Core must not know Epic, Feature, or Requirement lifecycle semantics. Project
Management may reference Core Task IDs, but Core treats every planning reference
as opaque optional context.

## Package shape

`kai-project-management` ships:

- no agents;
- focused planning skills;
- one deterministic `project.mjs` entry point;
- a private planning database at
  `.kai/project-management/runtime/project.sqlite`; and
- package-owned publication vocabulary only when accepted planning knowledge
  needs a public destination.

It depends on Core. Core and department packages do not depend on it.

## Runtime split

Core Tasks become standalone A2A execution units. They retain scope,
acceptance, authorities, producer/acceptance actors, dependencies, touched
areas, evidence, reviews, leases, and recovery. They no longer require
`feature_id`, `satisfies[]`, Direction alignment, or ancestor holds.

Project Management stores Direction, Epic, Feature, and Requirement records.
When planning produces executable work, it creates or links a Core Task through
a narrow handoff containing:

- approved outcome and acceptance;
- named scope and completion authorities;
- optional opaque planning record references;
- dependencies and affected areas; and
- required evidence or review.

Core validates the Task and its execution authority. Project Management
validates planning hierarchy and parent lifecycle. Neither runtime edits the
other runtime's records.

## Direct and department work

Project Management is never required for:

- one directly authorized request;
- a standalone Core Task;
- department-owned implementation or review;
- a supplied approved goal and acceptance contract; or
- A2A grants, leases, handoffs, messages, and evidence.

Department agents may consume approved planning records when the plugin is
installed. Without it, adequate supplied scope is sufficient.

Nightshift accepts an approved goal and bounded Tasks. If Project Management is
installed, Nightshift may read its approved planning projection; it must not
require the plugin merely to run.

## Compatibility

This is a clean break. Removing planning fields and commands from Core requires
a new current workspace/runtime schema. Existing workspaces are reset and
re-onboarded; no private planning or coordination records are migrated or
imported.

Do not ship dual Core Task shapes, compatibility aliases, mirrored planning
tables, or cross-database transactions.

## Implementation sequence

1. Extract planning contracts, handlers, views, and storage into
   `src/project-management/`.
2. Ship `kai-project-management` with planning skills and bundled
   `scripts/project.mjs`.
3. Reduce Core's schema and runtime to standalone Task execution and A2A
   records.
4. Replace hierarchy assumptions in Core skills, reports, and tests with opaque
   optional planning references.
5. Make Engineering and Creative consume supplied scope by default and planning
   projections only when available.
6. Rework Nightshift admission around approved goals and standalone Tasks.
7. Regenerate packages and validate Core-only, Core+department, and
   Core+Project-Management installations independently.

## Acceptance

- `kai-core` contains no Epic, Feature, or Requirement command, schema, table,
  view, skill, or lifecycle rule.
- Core Task creation and A2A execution work without Project Management.
- Project Management planning works without any department plugin.
- No runtime imports or reaches into another installed plugin.
- No active agent requires Project Management.
- The current schema has one supported shape and no migration branch.
- Tests cover the package boundary and observable runtime behavior rather than
  duplicating every prose field as another schema.

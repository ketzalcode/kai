---
name: project-management-work-hierarchy
description: "Use when reading, proposing, validating, or handing off Direction, Epic, Feature, and Requirement scope."
tools: [read, execute, search]
---

# Project Management hierarchy

The private authority is:

```text
.kai/project-management/runtime/project.sqlite
```

Read and mutate it only through:

```text
node "<kai-project-management-plugin>/scripts/project.mjs" <verb> --root "<workspace-root>"
```

The hierarchy is:

```text
Direction
└─ Epic
   └─ <pack> Feature
      └─ Requirement
         └─ opaque Core Task references
```

Direction, Epic, Feature, and Requirement carry owner, scope authority,
completion authority, priority, outcome, acceptance, hold, lifecycle, and
timestamps. Required and optional child lists are disjoint. Feature planning
dependencies are explicit and acyclic by authority review.

Core Tasks are not stored or mirrored here. Requirement Task lists contain only
opaque Task IDs. Successful Requirement completion names every required Task
ID plus evidence basis references. Project Management never edits Core records.

Use `handoff` with a bounded JSON input to produce a standalone Core Task body.
The projection supplies approved outcome, acceptance, authorities, and opaque
`planning_refs`; the caller supplies execution details such as touched areas,
dependencies, artifacts, and review requirements. Submit the result separately
to Core. There is no cross-database transaction.

Direction, Epic, Feature, and Requirement share
`proposed -> active -> completed`. Successful dispositions are `achieved`,
`delivered`, and `satisfied`; `cancelled` and `superseded` remain truthful
closure outcomes.

`status` is a read-only projection. Its rows include each record version and a
typed, versioned parent reference; the projection includes `through_seq`.
Callers may supply that output to Core's package navigation convention without
making another package depend on Project Management. The projection never
claims artifact presence, acceptance, or publication.

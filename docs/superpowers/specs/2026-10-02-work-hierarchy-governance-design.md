[kai](../../../README.md) / [Docs](../../README.md) / Specs / Work hierarchy

# Goal-aligned work hierarchy and governance

**Status:** design approved in conversation 2026-10-02. Not implemented.
**Depends on:**
[`2026-10-02-composable-workspace-design.md`](2026-10-02-composable-workspace-design.md).
**Supersedes:** the initiative, milestone, embedded backlog, and generic-item
planning model in workspace schema 4. Task execution mechanics are retained
where this design says so.

## Summary

Kai will coordinate work through four explicit record kinds:

```text
DIRECTION.md Current Goal              # operator-owned statement
└─ Epic                                # core, cross-pack outcome
   ├─ Core/Engineering Feature         # pack-owned outcome
   │  ├─ Requirement                   # verifiable obligation
   │  └─ Task ── satisfies 1..N reqs   # executable leased work
   └─ Creative Feature
      ├─ Requirement
      └─ Task ── satisfies 1..N reqs
```

The Goal is not duplicated into SQLite. It remains the operator-owned,
time-bounded statement in `docs/kai/DIRECTION.md`. Each Epic binds to the exact
Direction revision and explains how it advances that Goal without violating
Out of Scope.

Epic, Feature, and Requirement use one deliberately small lifecycle:

```text
proposed → active → completed
```

They also derive one attention condition:

```text
none | blocked | needs-human
```

Tasks retain the existing detailed execution/review/release lifecycle because
those states drive leases, independent review, deployment, and production
verification.

Core owns the neutral record model, relationships, event history, status
roll-ups, authority gates, and Task leasing. Pack roles own their Feature and
Requirement judgment. The operator owns Direction and any product or priority
decision no installed role is authorized to make. Kai does not add a required
product-management plugin.

## Why the current model must change

Schema 4 has two planning records:

- `initiative`, which combines owner, scope, north star, embedded milestones,
  embedded backlog, and closure;
- `item`, which combines feature intent, requirement acceptance, executable
  work, dependencies, review, evidence, and release state.

Milestones and backlog entries are embedded arrays rather than first-class
records. They cannot be independently versioned, approved, reported, or
migrated. `required_for_milestone` on an item can disagree with a milestone's
`required_items[]`. Milestone status is stored but initiative closure derives
truth from item states, so the two can drift.

The CLI is item-centric: status lists items, plan and export require one item,
and reporting cannot traverse an outcome hierarchy. This makes it hard to
answer:

- which Goal an item advances;
- which pack owns the Feature;
- which Requirement a Task satisfies;
- whether a Feature is complete;
- whether all required Features make an Epic eligible to close.

Adding a `level` field to `item` would preserve this ambiguity. A generic work
node would make extension easy but weaken kind-specific validation. Explicit
record kinds make invalid relationships and authority errors rejectable.

## Goals

1. Every coordinated Task traces to an accepted Requirement, Feature, Epic,
   and current Direction revision.
2. Core stores and validates coordination without owning department judgment.
3. Pack leads can own Features; appropriate pack authorities can own
   Requirements; specialists execute Tasks.
4. Scope suggestions do not become work silently.
5. The runtime derives concise attention from detailed evidence instead of
   multiplying stored lifecycle states.
6. Parent completion requires both qualifying children and an explicit named
   authority.
7. Direction changes realign open work before new promotions or grants.
8. Existing Task lease, review, evidence, deployment, and recovery safety is
   preserved.
9. Schema-4 history remains inspectable and migrates only through explicit,
   operator-approved classification.

## Non-goals

- Building a Scrum implementation, sprint ceremony, velocity model, or meeting
  scheduler.
- Adding story points, estimates, assignee capacity, or automatic scheduling.
- Creating a required product, project-management, leadership, or direction
  plugin.
- Making Kai an autonomous dispatcher. `plan` remains advisory and
  `automatic: false`.
- Replacing GitHub issues, pull requests, or repository-native planning tools.
- Making direct single-shot requests require coordination records.
- Publishing private hierarchy records under `docs/kai/`.
- Inferring product decisions from role seniority, package installation, or a
  previous Direction revision.

## Direction is the root contract

The hierarchy uses the four-section Direction contract defined by the
composable workspace design:

```text
Vision        product identity and durable boundaries
Mission       who the repository serves and why
Current Goal  one observable, time-bounded outcome
Out of Scope  explicit exclusions that guard every proposal
```

One Current Goal may have several active Epics. Epics are outcome slices needed
to reach that Goal, not alternate goals.

The runtime binds an Epic to a `direction_ref` containing:

```yaml
path: docs/kai/DIRECTION.md
hash: <sha256 of exact accepted bytes>
goal: <exact Current Goal text>
```

Vision, Mission, and Out of Scope remain part of the hashed document even
though `goal` repeats the selected statement for display. A caller cannot
supply an arbitrary hash: the runtime computes it from the configured project
path.

Every Epic proposal includes:

- `contribution`: how the Epic advances the Current Goal;
- `scope_fit`: why it is consistent with Vision, Mission, and Out of Scope.

These are asserted rationale, not proof that Kai independently understands
product strategy. The named Epic scope authority accepts them.

## Record model

The existing generic SQLite envelope remains:

```text
records(kind, id, item_id, version, body)
events(seq, operation_id, item_id, payload, ...)
operations(id, payload_digest, receipt)
```

The planning kinds become:

```text
epic
feature
requirement
task
```

Evidence, artifact, asset, review, approval, question, message, attempt,
effect, grant, and host records remain. Their subject link generalizes from
`item_id` to a typed subject reference without discarding historical item IDs.
The implementation plan must choose a migration-safe schema change; this design
sets the semantic requirement, not the SQL column name.

### Shared parent fields

Epic, Feature, and Requirement contain:

```yaml
schema_version: 1
id: <stable typed id>
title: <short title>
state: proposed | active | completed
completion_disposition: null | <kind-specific disposition>
owner: <one concrete role | operator>
scope_authority: <one concrete role | operator>
completion_authority: <one concrete role | operator>
priority: <non-negative integer>
outcome: <one observable outcome>
acceptance:
  - <verifiable criterion>
hold: null | <structured hold>
created_at: <timestamp>
updated_at: <timestamp>
```

`owner`, `scope_authority`, and `completion_authority` are separate even when
the same actor holds all three:

- owner keeps the record current;
- scope authority approves its purpose, boundary, and priority;
- completion authority accepts the exact outcome.

No producer accepts its own produced artifact where independent acceptance is
required.

### Epic

```yaml
kind: epic
id: epic:<id>
direction_ref:
  path: docs/kai/DIRECTION.md
  hash: <sha256>
  goal: <exact goal>
contribution: <how this advances the goal>
scope_fit: <why this respects vision, mission, and exclusions>
required_features:
  - core:feature:<id>
  - engineering:feature:<id>
  - creative:feature:<id>
optional_features: []
```

Epic is the only cross-pack planning parent. It has no pack owner. Its steward
is the declared `owner`, not necessarily the Chief of Staff and not an implicit
product role.

Terminal dispositions:

```text
achieved | cancelled | superseded
```

`achieved` requires every required Feature to have completed with
`delivered`. `cancelled` and `superseded` require explicit completion-authority
rationale and do not claim the Goal was achieved.

### Feature

```yaml
kind: feature
id: <pack>:feature:<id>
pack: core | engineering | creative
epic_id: epic:<id>
required_requirements:
  - <pack>:requirement:<id>
optional_requirements: []
depends_on_features:
  - feature: <other-pack-or-same-pack feature id>
    requires: delivered
```

A Feature is a pack-owned outcome, not a task list. Core, engineering, and
creative may each own several Features under one Epic.

Terminal dispositions:

```text
delivered | cancelled | superseded
```

`delivered` requires every required Requirement to have completed with
`satisfied`, all Feature dependencies to qualify, and explicit Feature
acceptance. `cancelled` and `superseded` require rationale.

### Requirement

```yaml
kind: requirement
id: <pack>:requirement:<id>
pack: core | engineering | creative
feature_id: <pack>:feature:<id>
required_tasks:
  - <pack>:task:<id>
optional_tasks: []
```

A Requirement is one verifiable obligation that describes what must be true.
It is not implementation activity. Requirement acceptance freezes its outcome
and criteria before satisfying Tasks may be promoted.

Terminal dispositions:

```text
satisfied | cancelled | superseded
```

`satisfied` requires every required Task to reach its declared terminal state,
the Requirement's acceptance evidence, and explicit completion-authority
approval.

### Task

Task replaces schema-4 `item` as the executable unit. It preserves the fields
needed for safe execution, including:

- delivery class;
- detailed execution state and resume state;
- scope and completion authorities;
- producer and acceptance actors;
- priority and next role;
- outcome and acceptance;
- artifact expectation and targets;
- context artifacts;
- touches;
- Task dependencies;
- lease and recovery hold;
- blocking questions;
- review requirements;
- immutable change reference;
- version and timestamps.

It adds:

```yaml
kind: task
id: <pack>:task:<id>
pack: engineering | creative | core
feature_id: <pack>:feature:<id>
satisfies:
  - <pack>:requirement:<id>
```

For department work, `feature_id` and `satisfies[]` are mandatory. Every
Requirement in `satisfies[]` belongs to the same Feature and pack. A Task may
satisfy several Requirements within that Feature.

Core maintenance Tasks that implement the coordination/runtime substrate are a
special case: they belong to an explicit core Feature under an Epic and satisfy
core Requirements. The hierarchy does not permit an unaffiliated coordinated
Task. Work too small to justify this structure stays a direct request.

Task dependencies remain Task → Task and retain typed required states. Parent
membership is not a dependency edge.

## Relationship invariants

1. Every Feature has exactly one Epic.
2. Every Requirement has exactly one Feature.
3. Every coordinated Task has exactly one Feature and a non-empty
   `satisfies[]`.
4. Every satisfied Requirement belongs to the Task's Feature.
5. Feature and Requirement pack names match their IDs and parents.
6. Required and optional child lists are disjoint and contain no duplicates.
7. A Feature belongs to one Epic and a Requirement belongs to one Feature. A
   Task may satisfy several Requirements only within its one Feature.
8. `Requirement.required_tasks[]` and `Task.satisfies[]` are bidirectionally
   consistent: each edge appears in both records.
9. Parent cycles are impossible by construction; Task and Feature dependency
   graphs are checked separately for cycles.
10. Cross-pack outcome dependencies exist only at Feature level. Task
    execution dependencies may cross packs only when both Tasks already belong
    to Features under the same Epic and the dependency is necessary for
    execution.
11. Deleting hierarchy records is unsupported. Incorrect or obsolete records
    complete with `cancelled` or `superseded`.

## Lifecycle

### Parent records

Epic, Feature, and Requirement use:

```text
proposed → active → completed
```

- `proposed`: accepted into the coordination store for consideration; no child
  execution is authorized.
- `active`: scope is approved and required-child planning or execution may
  proceed.
- `completed`: terminal and immutable except for separately appended
  historical annotations; `completion_disposition` is required.

There is no stored paused, blocked, stale, ready-to-close, dropped, shipped, or
archived parent state.

### Attention

Parent records derive:

```text
none | blocked | needs-human
```

- `none`: no known condition prevents the next allowed action.
- `blocked`: a known non-human condition prevents the next allowed action, such
  as an unmet dependency, explicit hold, missing evidence, or stale Direction
  binding. An incomplete required child is normal active work unless no
  eligible action can advance it.
- `needs-human`: only a human can perform the next action, such as revising
  Direction, approving scope, answering a human-only decision, adopting a
  public identity, authorizing deployment, or accepting completion when the
  operator is the named authority.

`completed` is a lifecycle state, not an attention value. “Ready to close” is
not a status; it is a next action addressed to the completion authority.
“Aligned” is not a status; alignment is an activation/promotion gate.

When several conditions exist, `needs-human` has display precedence over
`blocked`, but the view retains every underlying reason. The stored record
never persists a derived attention value.

### Holds

A hold records:

```yaml
reason: <why progress is intentionally stopped>
set_by: <actor>
set_at: <timestamp>
release_condition: <observable condition>
basis_refs: []
```

Holds append events and block child promotion/new Task grants. They do not
change parent lifecycle. Removing one records the actor, time, evidence, and
whether its release condition was met. A hold requiring an operator decision
derives `needs-human`; all others derive `blocked`.

### Tasks

Tasks retain the schema-4 item lifecycle:

```text
proposed → ready → in-progress → in-review
knowledge: in-review → completed
product/operational:
  in-review → release-ready → deploying
  → production-verification → shipped
```

Blocked, restoration, dropped, lease, recovery, review, deployment, and
production-verification semantics remain where required for executable work.
The implementation may rename item commands to Task commands, but it must not
weaken their gates.

## Authority and promotion

| Action | Required authority |
| --- | --- |
| Create an Epic proposal | operator or an explicitly delegated Epic scope authority |
| Activate an Epic | Epic scope authority; operator when product priority is not delegated |
| Prioritize Epics | operator or the Current Goal's explicitly delegated steward |
| Create a Feature proposal | Feature pack owner or delegated pack authority |
| Activate/prioritize a Feature | Epic steward |
| Create a Requirement proposal | Feature owner or delegated pack authority |
| Activate a Requirement | Feature owner |
| Create a Task proposal | Requirement scope authority or delegated specialist |
| Promote a Task to ready | Requirement scope authority, after every referenced Requirement is active |
| Grant/dispatch a Task | Chief of Staff or the existing lone-actor grant path |
| Close any parent | its declared completion authority |

Any role may suggest work in conversation. A suggestion is not a durable
record. Only a named authority may turn it into a proposal. This avoids a
database full of speculative agent ideas while preserving discussion.

The Chief of Staff coordinates and grants Tasks. It cannot invent scope,
priority, authorities, Feature/Requirement relationships, or acceptance.

Role installation never confers authority. A missing role is a session staffing
condition, not a durable blocker. The record stays unchanged and status reports
the missing capability.

## Focus guardrail and reprioritization

An Epic cannot activate unless its `direction_ref` matches the current
`DIRECTION.md`, its contribution is explicit, and its scope authority accepts
its fit.

When a suggested Feature does not fit an active Epic or would violate
Direction, Kai presents three choices:

1. keep it conversational and do not create a record;
2. create a proposed Epic under a hold, without activating work;
3. explicitly reprioritize.

Reprioritization proposes a `DIRECTION.md` diff. It never edits Direction
silently. The operator approves the new Vision, Mission, Current Goal, or Out
of Scope text as applicable.

After Direction changes:

1. every non-completed Epic whose `direction_ref.hash` differs derives
   `blocked`;
2. no new Feature/Requirement activation, Task promotion, or Task grant occurs
   beneath it;
3. the steward reviews each Epic against the new Direction;
4. the scope authority either carries it forward with a new accepted
   `direction_ref`, leaves it on hold, or completes it with `cancelled` or
   `superseded`;
5. a currently leased Task may continue only to a safe handoff; a Direction
   change is not permission to abandon a working tree or production action.

This is deliberate reprioritization, not automatic cancellation.

## Completion and roll-up

Parents list required and optional children explicitly.

- Optional children never block completion.
- A required child with `cancelled` or `superseded` does not satisfy its
  parent; the parent must revise its required-child mapping through scope
  authority before it can close.
- Child completion never auto-closes the parent.
- The runtime computes closure eligibility from a transactionally consistent
  snapshot and includes each required child ID and version in the closure
  criteria reference.
- The completion authority records the terminal disposition against that exact
  criteria reference. A changed child version invalidates the attempt.

Roll-up:

```text
Task terminal states
  → Requirement eligible for satisfied
  → Feature eligible for delivered
  → Epic eligible for achieved
```

Cancellation and supersession use authority and rationale, not successful-child
roll-up. They remain truthful terminal outcomes rather than pretending the work
was delivered.

## Events and logs

No Markdown board, index, milestone, backlog, Task, thread, or initiative log
is authoritative or created for schema 5.

Every mutation appends an event with:

- actor and run identity;
- timestamp;
- record kind, ID, and resulting version;
- command kind;
- reason;
- basis references;
- changed fields;
- relationship versions used by the decision.

Messages, questions, handoffs, approvals, reviews, evidence, and effects remain
separate typed records/events. Human-readable logs and reports are views over
the store, not files agents maintain manually.

## Read surfaces

### Status

Default `status` shows:

```text
Current Goal
├─ Epic A        active
│  ├─ engineering  2/3 required Features complete
│  └─ creative      1/1 required Features complete
└─ Epic B        proposed   attention: needs-human
```

It displays attention only when not `none` in concise output. JSON includes the
underlying reasons and declared/derived provenance.

A pack view expands:

```text
Feature
├─ Requirement
│  └─ Tasks
└─ Requirement
   └─ Tasks
```

No roll-up hides child state. Counts distinguish required from optional.

### Detail and context

`detail --kind <kind> --id <id>` reads any exact record.

`context --kind <kind> --id <id>` returns a bounded projection with:

- Direction summary and hash;
- parent chain;
- required and optional children;
- dependencies;
- authorities;
- attention reasons;
- recent messages/events;
- relevant artifacts/evidence;
- next allowed action.

### Plan

`plan` returns executable Tasks only, preserves `automatic: false`, and states
why non-executable Tasks are excluded. It never returns parent records as
dispatchable work.

### Export

Export may target any hierarchy record and includes:

- exact record identity and version;
- parent/child chain;
- Direction binding;
- declared state and derived attention reasons;
- authorities;
- child roll-up;
- decisions, reviews, evidence, and events;
- migrated source IDs, paths, digests, and historical/current distinction.

Export is a report, not authority.

## Dependencies

Two relationship types remain distinct:

1. **Composition:** Epic → Feature → Requirement → Task. Required children
   define closure.
2. **Execution dependency:** Feature → Feature or Task → Task. Dependencies
   define ordering/readiness.

A Requirement does not depend on Tasks; it owns required/optional Task
composition. A Feature does not depend on its Requirements; it owns them.

Feature dependencies can cross packs. They require the upstream Feature's
`delivered` disposition and must remain within the same Epic unless the
operator accepts a cross-Epic dependency with rationale. Task dependencies may
cross packs only under the same Epic and retain typed required Task states.

Both dependency graphs reject cycles. Composition and dependency edges cannot
be substituted for one another.

## Direct work

An ordinary directly authorized request remains outside this hierarchy:

- no Direction read is required;
- no workspace is initialized;
- no Epic, Feature, Requirement, or Task is created;
- no lease or status is claimed.

If direct work expands into coordinated multi-role execution or needs durable
portfolio tracking, Kai presents the proposed hierarchy and gets authority
before creating records. It does not backfill a hierarchy silently.

## Migration from schema 4

Schema-5 activation is explicit, offline, backup-first, and never dual-writes
schema 4.

### Deterministic preservation

Migration always preserves:

- stable source IDs and a migrated-ID map;
- record versions and timestamps;
- exact database history and events;
- item dependencies;
- lease/recovery state;
- questions, messages, handoffs;
- artifact, evidence, review, approval, and change references;
- original source paths and digests;
- public artifact links.

Historical approvals and terminal states remain historical. Migration does not
renew acceptance against a new hierarchy.

### Required operator map

There is no universal automatic mapping from:

```text
initiative → milestone → item
```

to:

```text
Epic → Feature → Requirement → Task
```

An initiative may resemble an Epic, but its mission/vision may instead be the
old equivalent of Direction. A milestone may be an Epic, Feature, or
Requirement. An item may be a Requirement or Task.

Migration therefore generates a classification worksheet containing every
open and historical source record. The operator approves:

- Direction binding;
- Epic boundaries;
- each milestone's destination or historical-only disposition;
- each item's destination kind and pack;
- parent and `satisfies[]` links;
- required versus optional child mappings;
- current authorities;
- whether historical terminal records need no active counterpart.

Unmapped or ambiguous records block schema-5 activation. They never enter a
generic legacy bucket.

### Safe automatic cases

An old item may map automatically to Task only when all of these hold:

- it represents executable work rather than an obligation or outcome;
- its pack owner is unambiguous;
- the approved migration map supplies one Feature and at least one Requirement;
- authorities and dependencies resolve;
- no active lease remains unreconciled.

Even then, its old approvals remain historical. Required active acceptance is
re-established through schema-5 authority.

### Activation

1. Inspect schema-4 database and source inventory.
2. Produce the complete classification worksheet.
3. Obtain operator approval and current Direction.
4. Reconcile active leases and in-flight production actions.
5. Create a verified external backup.
6. Stage schema-5 records and migrated evidence.
7. Validate hierarchy, dependencies, authorities, provenance, workspace paths,
   and pack ownership.
8. Verify read views and migration reports.
9. Atomically move the database to `.kai/core/runtime/coordination.sqlite`.
10. Activate the schema-5 manifest last.

Failure leaves schema 4 authoritative. Rollback cannot discard new schema-5
events; any such event requires explicit reconciliation.

Schema 3 and schema 4 remain inspectable through version-appropriate read
surfaces. No old host writes schema-5 records.

## Failure behavior

| Condition | Result |
| --- | --- |
| Feature without Epic | `INVALID_INPUT` |
| Requirement without Feature | `INVALID_INPUT` |
| Task without Feature or `satisfies[]` | `INVALID_INPUT` |
| pack/ID/parent mismatch | `INVALID_INPUT` |
| required/optional child overlap | `INVALID_INPUT` |
| composition or dependency cycle | `INVALID_INPUT` |
| stale Direction binding | parent attention `blocked`; new promotion/grant refused |
| hold present | attention `blocked` or `needs-human`; governed action refused |
| only operator can act | attention `needs-human` |
| missing installed role | record unchanged; session staffing gap reported |
| child versions change during closure | `VERSION_CONFLICT` |
| producer attempts self-acceptance | `AUTHORITY_REQUIRED` |
| ambiguous migration mapping | activation refused |
| direct request has no workspace | continue in direct mode |

No broad catch converts these failures into success-shaped defaults.

## Validation

Every gate requires a live-corpus assertion and mutation proving the defect is
caught.

### Record and relationship tests

- create one valid Epic/Feature/Requirement/Task chain;
- reject every missing parent;
- reject empty Task `satisfies[]`;
- reject a Task satisfying another Feature's Requirement;
- reject pack and typed-ID mismatch;
- reject duplicate/overlapping child lists;
- reject composition and dependency cycles;
- prove required children block and optional children do not;
- prove cancelled/superseded required children require mapping revision.

### Lifecycle and attention tests

- enforce parent `proposed → active → completed`;
- reject parent lifecycle shortcuts;
- require terminal disposition;
- derive `none`, `blocked`, and `needs-human` from live fixtures;
- prove derived attention is not persisted;
- show every underlying reason when several apply;
- preserve detailed Task lifecycle, restore, review, deployment, and shipping
  gates.

### Direction tests

- bind Epic to real `DIRECTION.md` bytes;
- reject caller-invented hashes;
- activate several Epics under one Current Goal;
- reject out-of-scope activation without operator authority;
- mutate Direction and prove new promotions/grants stop;
- permit an in-flight lease only to safe handoff;
- carry an Epic to the new revision;
- complete stale work as cancelled/superseded without claiming delivery.

### Authority tests

- enforce every action in the authority table;
- keep producer and completion authority distinct where required;
- prove the Chief of Staff cannot change scope or priority;
- prove role installation does not grant authority;
- report a missing role without persisting blocked state;
- preserve operator-only deployment and human approval gates.

### Roll-up and concurrency tests

- close Requirement, Feature, and Epic from exact required-child versions;
- mutate a child during closure and get `VERSION_CONFLICT`;
- prove child completion does not auto-close a parent;
- prove cancellation and supersession require rationale;
- show cross-pack Feature dependencies;
- reject cycles and cross-Epic dependencies without explicit authority;
- preserve operation replay and store-busy behavior.

### Read-surface tests

- hierarchy status and pack expansion;
- detail/context for every record kind;
- Task-only plan with explicit exclusions;
- export with parent chain and history;
- concise attention output plus complete JSON reasons;
- unknown/quarantined migration records remain visible;
- no private message, absolute path, or evidence leak.

### Migration and composition tests

- clean schema 3 inspection;
- clean schema 4 inspection;
- exact raw-byte and digest preservation;
- operator-approved classification map;
- ambiguous milestone and item mappings block;
- active lease reconciliation;
- stable IDs, versions, timestamps, dependencies, reviews, and links;
- rollback before schema-5 events;
- core-only, core + engineering, core + creative, and all-pack workspaces;
- absent-pack paths remain absent;
- Linux and Windows execution with path-alias and junction mutations.

## Documentation and contract impact

Implementation will update:

- the composable workspace spec's activation dependency;
- `README.md`, getting started, runtime, workspace, and architecture docs;
- core operating, scope, work-acting, work-granting, work-item, stewardship,
  workspace, asset, and completion skills;
- Chief of Staff and workspace/intake agents;
- engineering and creative role authority text;
- coordination contract, engine, authority, acceptance, context, reports,
  status, export, store, migrations, and CLI;
- workspace doctor and schema fixtures;
- consumer and mutation tests.

`workflow-initiative-init` and the initiative stewardship/workspace contracts
are replaced, not aliased. Historical docs remain historical.

## Decision

Adopt explicit Epic, Feature, Requirement, and Task records under one
operator-owned Direction.

Keep parent lifecycle and attention intentionally small. Preserve detailed Task
execution safety. Implement this hierarchy and the composable workspace
together in schema 5 so Kai never ships an intermediate workspace without a
coherent coordination model.

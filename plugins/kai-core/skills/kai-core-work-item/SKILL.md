---
name: kai-core-work-item
description: "Defines the durable work-item record: its schema, field rules, and Outcome/Acceptance/Evidence templates. Use when creating or updating a work item."
tools: [execute, read, edit, search]
---

# Work item record

kai's agents are single-shot and stateless, so each unit of work needs one
durable, authoritative record. This contract defines that record — its schema,
its field rules, and the Outcome / Acceptance / Evidence templates every item
carries. Acting on an item is defined in `kai-core-work-acting`; granting and
reconciling it are defined in `kai-core-work-granting`.

Under workspace schema 4 the authoritative record lives in the runtime store at
`.kai/state/coordination.sqlite`, read with `detail --kind item --id <item-id>`,
`status` and `export`. Any `.kai/state/items/<item-id>.md` beside it is a
**retained historical import source** from a pre-schema-4 workspace: read it as
history, never hand-edit it to change coordinated state. The fields below are
the record's schema whichever surface
you are looking at, and every change to them is one `apply` command through
`scripts/coordinate.mjs` (see `kai-core-work-granting` for the route table).

An ordinary directly authorized request is not a coordinated item and needs no
record, no database, no initiative and no report tree.

## Work-item record

Every unit of executable work has one record:

```yaml
---
type: work-item
id: checkout-async-fe
title: Loading UI for async checkout
initiative: payments-q3
milestone: async-checkout
delivery_class: product-change
state: ready
resume_state: null
priority: 20
owner: null
next_role: eng-builder-software
target: checkout-flow
scope_authority: operator
completion_authority: operator
artifact_expectation: none
artifact_expectation_reason: The durable result is the product change and its release record.
artifact_class: null
durability: null
validity_owner: null
artifact_targets: []
context_artifacts: []
touches:
  - web/src/checkout/**
depends_on:
  - item: checkout-async-api
    requires: in-review
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: eng-reviewer-code
    kind: independent-code
  - role: eng-reviewer-quality
    kind: ui-system
completed_reviews: []
change_ref: null
version: 3
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-07-20-1415
---

## Outcome
<One observable outcome this item must produce.>

## Acceptance
- [ ] <Verifiable criterion>

## Evidence
- <Filled as work progresses: diff, tests, reviews, deployment run>
```

Rules:

- **`id`** is stable and unique.
- **`milestone`** references a stable milestone ID in the initiative
  north star, or `—` for unaffiliated work.
- **`delivery_class`** is `knowledge`, `product-change`, or `operational`.
  Research, plans, and product decisions complete without pretending they were
  deployed; product changes must follow the release path.
- **`priority`** is steward-owned; lower numbers run first. Equal priority is
  ordered by dependencies, then `updated`.
- **`next_role`** is the role the director should dispatch when the item is
  ready. It is not necessarily the current owner.
- **`scope_authority`** and **`completion_authority`** each name a concrete
  current role or `operator`, declared before `ready`. `scope_authority` owns
  this item's problem, priority, and scope-boundary calls; `completion_authority`
  owns its completion/acceptance verdict. Neither defaults to a role from an
  uninstalled pack, and neither is a standing proxy for a human owner — when
  the accountable owner is the operator, set the field to `operator` itself.
  `kai-core-scope-discipline` and `kai-core-asset-closing` resolve their
  scope-owner and completion-authority language against these declared fields,
  not a hard-coded role name. When an asset is owed, this same
  `completion_authority` is the authority `kai-core-asset-producing` records
  against the produced asset's own metadata.
- **`artifact_expectation`** is `owed` or `none`, declared before `ready`.
  `none` requires `artifact_expectation_reason`; it is valid for spikes,
  conversational or routing work, and implementation items whose durable result
  is the product change rather than a separate generated artifact.
- **`artifact_class`**, **`durability`**, and **`validity_owner`** are required
  when an asset is owed. Their semantics come from `kai-core-asset-producing`.
- **`artifact_targets`** lists every exact private workspace path, or
  project-qualified public path, for an asset-producing item. The convention is
  `.kai/state/initiatives/<slug>/artifacts/<domain>/<item-id>.md`, where
  `<domain>` is declared by the producing role. Exceptions are named in
  `kai-core-workspace-paths`. An operator-approved override is allowed only
  inside the resolved workspace, or inside the selected project's configured
  publication root using the project-qualified form, and must be recorded.
- **`context_artifacts`** lists exact paths to required factual maps, product
  briefs, designs, decisions, and other inputs. Peers read these instead of
  rediscovering context.
- **`touches`** names repository paths, services, schemas, environments, or
  other exclusive resources the work expects to modify.
- **`depends_on`** contains typed item dependencies: `item` plus the minimum
  required upstream state (`in-review`, `completed`, `release-ready`, or
  `shipped`). Default to `completed` for an upstream `knowledge` item and
  `shipped` otherwise. `completed` is valid only for `knowledge`; `release-ready`
  and `shipped` are valid only for production/operational delivery. Use
  `in-review` only when a stable reviewed artifact/contract is enough for safe
  downstream work.
- **`waiting_on_questions`** contains open question IDs only.
- **`resume_state`** records the exact lifecycle state an item held before it
  became `blocked`; it is cleared only after an authorized restore.
- **`required_for_milestone`** is advisory visibility. The authoritative
  completion mapping is the milestone's `required_items` list.
- **`review_requirements`** is the steward/plan-approved list of independent
  review roles and review kinds required before release readiness.
- **`completed_reviews`** records role, kind, evidence path, verdict, and
  timestamp, all bound to the exact `change_ref`. A chat assertion does not
  complete a review.
- **`change_ref`** identifies the implementation revision under review. It must
  be a git object that content-addresses the exact reviewed tree: a **commit
  SHA** or a **PR head SHA** (full 40-hex, or an unambiguous ≥7-hex short form).
  There is no bespoke "diff hash" — git already hashes trees reproducibly across
  machines. To review work that is not yet on a branch, stage it and record the
  SHA of a commit (a throwaway/amendable commit is fine) or `git stash create`
  object, so the reference is reproducible rather than an ad hoc digest. It is
  required before `in-review`.
- **`version`** increments on every state-changing edit. The runtime owns that
  increment: a command supplies `expectedVersion` and the store performs the
  compare-and-swap, refusing with `VERSION_CONFLICT` when the record moved.
- **`lease`** protects active ownership. A lease is coordination, not a
  substitute for git conflict detection. `holder` is the owning role; `token`
  is the unique grant identifier issued by the runtime; `version_at_grant` is
  the item `version` the grant was bound to; `acquired`/`expires` bound its
  lifetime. A held lease (non-null `holder`) must carry a non-null `token` and
  `version_at_grant`. Grants are issued serially by a single grantor through
  `item.grant`, never raced for by parallel peers and never hand-written into a
  Markdown file. The grantor's side of this protocol lives in
  `kai-core-work-granting`.
- **Artifact/evidence paths** are private workspace-relative paths or
  project-qualified public paths in durable records. Repository metadata stores
  `workspace.root: .`; external mode may store an absolute root. Dispatch
  packets carry the resolved runtime absolute root. Never write
  session-state-relative, incidental-cwd, clone-specific, or abbreviated
  `.../` paths.

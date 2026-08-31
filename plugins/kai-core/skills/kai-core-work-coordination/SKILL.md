---
name: kai-core-work-coordination
description: "Defines durable multi-agent coordination. Use when concurrent work needs item state, board, threads, backlog, leases, dependencies, handoffs, or evidence paths."
tools: [execute, read, edit, search]
---

# Work Coordination

kai's agents are single-shot and stateless. A real team running several
efforts needs durable state, safe parallel ownership, communication, and a
truthful path from idea to production. This contract provides that connective
tissue without pretending markdown is a continuously running service.

It is not a standalone trigger skill. Acting agents use it whenever they start,
hand off, block, review, or finish work. `director-chief-of-staff` uses it to
dispatch and reconcile work across the team.

## Why durable, per-item state

Coordination must survive sessions, machines, CLI/cloud boundaries, and branch
handoffs, so it lives under the target workspace's `kai/coordination/`. In a
repository workspace this surface is committed. In an operator-confirmed
external workspace it is durable local state and must not be described as
committed unless that directory is actually version-controlled. The same caveat
applies to a repository workspace recorded as `corpus_visibility: local`: the
surface is durable only within that checkout, so it does not cross machines,
clones, CI, or cloud agents, and must not be described as committed.

A single mutable board is not safe as the authoritative store: two agents
working in parallel would edit the same file and create conflicts or overwrite
each other. Therefore:

- `items/<item-id>.md` is the **authoritative state** for one work item.
- `threads/<item-id>.md` is that item's append-only communication log.
- `BOARD.md` is a **derived human index**, refreshed by the director after
  reconciliation. Agents never treat an out-of-date board row as authority.

Parallel agents normally touch different item and thread files.

## Coordination surface

```text
kai/coordination/
  ACTIVE.md
  BOARD.md                    # derived index; director-maintained
  items/
    <item-id>.md              # authoritative state + acceptance
  threads/
    <item-id>.md              # HANDOFF + QUESTION/ANSWER history
  backlog.md
kai/initiatives/
  INDEX.md
  <initiative-slug>/
    northstar.md
    log.md
    backlog.md
```

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
next_role: principal-swe-frontend
target: checkout-flow
artifact_expectation: none
artifact_expectation_reason: The durable result is the product change and its release record.
artifact_class: null
durability: null
completion_authority: null
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
  - role: principal-swe-frontend
    kind: independent-code
  - role: principal-qa-ui
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
- **`artifact_expectation`** is `owed` or `none`, declared before `ready`.
  `none` requires `artifact_expectation_reason`; it is valid for spikes,
  conversational or routing work, and implementation items whose durable result
  is the product change rather than a separate generated artifact.
- **`artifact_class`**, **`durability`**, **`completion_authority`**, and
  **`validity_owner`** are required when an asset is owed. Their semantics come
  from `kai-core-asset-lifecycle`.
- **`artifact_targets`** lists every exact workspace-root-relative output path
  for an asset-producing item. Initiative items default to the canonical
  location from `kai-core-workspace-conventions`:
  `kai/initiatives/<slug>/artifacts/product-map.md`,
  `kai/initiatives/<slug>/artifacts/marketing/` (bundle directory),
  `kai/initiatives/<slug>/artifacts/content/<item-id>/` (content bundle),
  `kai/initiatives/<slug>/artifacts/customer-success/<item-id>.md` (de-identified signal),
  `kai/initiatives/<slug>/artifacts/support/<item-id>.md` (de-identified signal),
  `kai/initiatives/<slug>/artifacts/feedback/<item-id>.md` (de-identified signal),
  `kai/initiatives/<slug>/artifacts/growth/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/analytics/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/experiments/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/pricing/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/sales/<item-id>.md` (de-identified deal brief),
  `kai/initiatives/<slug>/artifacts/solutions/<item-id>.md` (sanitized solution brief),
  `kai/initiatives/<slug>/artifacts/security/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/reliability/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/incidents/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/compliance/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/briefs/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/research/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/designs/<item-id>.md`,
  `kai/initiatives/<slug>/artifacts/docs/<item-id>.md` (technical writing / docs),
  `kai/initiatives/<slug>/artifacts/revops/<item-id>.md` (revenue-operations brief),
  `kai/initiatives/<slug>/artifacts/campaigns/<item-id>.md` (demand-gen campaign plan),
  `kai/initiatives/<slug>/artifacts/partnerships/<item-id>.md` (de-identified partnership brief),
  `kai/initiatives/<slug>/artifacts/localization/<item-id>.md` (localization report),
  `kai/initiatives/<slug>/artifacts/data-engineering/<item-id>.md` (data-engineering design),
  `kai/initiatives/<slug>/artifacts/brand/<item-id>.md` (brand / visual-identity system), or
  `kai/initiatives/<slug>/artifacts/decisions/<item-id>.md`. An operator-approved
  override is allowed only inside the resolved workspace and must be recorded.
  An unaffiliated incident-command item uses
  `kai/library/investigations/<incident-id>/incident-record.md` for its sanitized
  closure record; raw incident evidence remains in `.kai/runs/`.
  `artifact_target` is the legacy singular field and remains readable during
  migration; new or revised records use `artifact_targets`.
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
- **`version`** increments on every state-changing edit.
- **`lease`** protects active ownership. A lease is coordination, not a
  substitute for git conflict detection. `holder` is the owning role; `token`
  is the unique grant identifier; `version_at_grant` is the item `version` the
  grant was bound to; `acquired`/`expires` bound its lifetime. A held lease
  (non-null `holder`) must carry a non-null `token` and `version_at_grant`.
  Grants are issued serially by a single grantor (see *Claiming work safely*),
  never raced for by parallel peers.
- **Artifact/evidence paths** are workspace-root-relative in durable records.
  Repository metadata stores `workspace.root: .`; external mode may store an
  absolute root. Dispatch packets carry the resolved runtime absolute root.
  Never write session-state-relative, incidental-cwd, or abbreviated `.../`
  paths.

## BOARD.md

`BOARD.md` is the concise cross-effort view generated or refreshed by
`director-chief-of-staff` from the item records:

```markdown
# Board

| id | title | initiative | milestone | priority | state | owner | next | depends-on | waiting-on | updated |
|----|-------|------------|-----------|----------|-------|-------|------|------------|------------|---------|
| checkout-async-api | Async checkout API | payments-q3 | async-checkout | 10 | in-progress | principal-swe-backend | principal-swe-backend | — | — | 2026-07-20-1415 |
```

The board is useful for humans and selection, but the director re-reads the
corresponding item file before dispatching or changing state.

## Lifecycle

```text
proposed -> ready -> in-progress -> in-review -> release-ready
                    |               |              |
                    |               +-----> completed (knowledge)
                    +---- blocked <-+              v
                                              deploying
                                                  |
                                                  v
                                       production-verification
                                                  |
                                                  v
                                               shipped

any non-terminal state -> dropped
```

| State | Meaning | Who moves it |
|-------|---------|--------------|
| `proposed` | Worth considering, not committed. | anyone proposes; steward evaluates |
| `ready` | Steward-committed: fits scope, acceptance defined, dependencies **declared**. Not necessarily runnable this instant — see *executable* below. | steward |
| `in-progress` | A role holds a live lease and is acting. | owning agent/director |
| `in-review` | Implementation complete; review and verification underway. | builder |
| `blocked` | Cannot proceed because a declared dependency **failed/was dropped** or a blocking question is unresolved — an *exceptional* stall, not an on-track pending dependency (that stays `ready`). | any acting role |
| `completed` | A non-production knowledge/decision item passed its acceptance, required reviews, and coordination close. | owning principal/workflow |
| `release-ready` | DoD is clear for deployment; not yet production-shipped. | `workflow-ship` prepare mode |
| `deploying` | Human/operator confirmed deployment started; successful completion is not yet established. | `workflow-ship` CONFIRM-START |
| `production-verification` | Successful deployment completion is evidenced; smoke/health checks pending. | `workflow-ship` CONFIRM-COMPLETE |
| `shipped` | Production deployment and required verification are evidenced. | `workflow-ship` |
| `dropped` | Explicitly declined with a reason and backlog/log link. | steward/operator |

`completed` is the truthful terminal state for research, plans, and decisions.
`shipped` is reserved for production/operational delivery and never means
“commands were prepared.”

### `ready` vs `executable`

`ready` and *executable* are deliberately separate concepts, and every contract
uses them the same way:

- **`ready`** is a **steward commitment**: the item fits `scope.current`, has
  acceptance criteria, and its `depends_on` links are **declared** (the upstream
  items exist in the plan). `ready` does **not** require the dependencies to
  have reached their required states yet. The steward promotes a whole
  dependency chain to `ready` in one pass and does not re-promote a downstream
  item every time an upstream one completes.
- **`executable`** is a **derived predicate** the director computes at dispatch —
  it is never stored on the item. An item is executable when it is `ready` (or a
  review/release state the lifecycle authorizes), **and** every `depends_on`
  requirement has reached its declared state, **and** no unexpired lease is held,
  **and** `waiting_on_questions` is empty (except the answered-restoration case),
  **and** its `touches` set is conflict-free. The director's *Select executable
  work* step is the authoritative definition; `BOARD.md` may surface it as a
  column but the item record never stores it.

So `ready` means "committed and planned," not "runnable right now." Blocked-by-a
-pending-dependency is the normal, expected condition of a `ready` downstream
item; it becomes executable the moment its upstream reaches the required state,
with no steward round-trip.

## Claiming work safely

Markdown records give no atomic compare-and-swap: two parallel peers could each
read `version: N`, each write `N+1` with a different lease, and each re-read
before the other's write is visible — both then believe they hold the item.
kai closes that race by making lease **granting serial** and lease **holding
verifiable**, rather than pretending a file write is a mutex.

### Single grantor

Within one synchronized working tree there is exactly one lease grantor per
item at a time: `director-chief-of-staff` (or, when a role acts without a
director, that single acting agent for its own item). The grantor reserves items
**one at a time** — it never issues two grants concurrently — so no two writers
race the same record. Parallel peers are launched **only after** their items are
already reserved; a peer never self-acquires the top-level lease it was
dispatched for.

This guarantee is **conditional on exactly one active grantor per item per
tree**. kai has no runtime lock, so it cannot stop a second director run, or a
second standalone agent, from targeting the same item concurrently — that is the
multi-writer case and must be serialized by the host/operator (one coordination
session per tree) or resolved as the cross-tree case below. When acting without
a director, an agent may self-grant its own item only if it is the sole active
worker on that item; concurrent same-item invocation is unsupported and must be
serialized rather than raced.

To reserve an item, the grantor:

0. Confirms the workspace is **schema-compatible**: `.kai/manifest.json` exists
   and its `schema_version` equals the current contract. If it is behind (or the
   manifest is missing), stop and report the exact repair — run the workspace
   doctor (`node <kai-plugin>/scripts/workspace-doctor.mjs`) and apply the
   migration ladder in `kai-core-workspace-onboarding` — rather than claiming against
   state the contract can't guarantee. Never claim an item in an incompatible or
   doctor-failing workspace.
1. Reads the authoritative item record and notes `version`.
2. Confirms every dependency reached its declared required state and questions
   are clear.
3. Confirms **no unexpired lease is held at all** — not merely that none belongs
   to another role. An unexpired lease held even by the same role blocks a new
   grant: only the exact existing token may continue that work, and a re-grant
   happens solely after the current holder terminates and is recovered (see
   *Collision and stale-lease recovery*). This prevents a second instance of one
   role from being granted a live item.
4. Checks active item `touches` sets for overlap.
5. Writes the `lease` block — `holder`, a unique `token`, `version_at_grant`
   set to the `version` just read, `acquired`, `expires` — and increments
   `version`. Because the grant increments the version, a held lease always has
   `version_at_grant` strictly less than the item `version`. Only a `ready` item
   transitions to `in-progress` when reserved. Review/release roles lease
   `in-review`, `release-ready`, `deploying`, or `production-verification`
   without regressing the lifecycle state.
6. Re-reads immediately. If `holder`, `token`, and `version` are not exactly
   what it just wrote, another writer intervened: stop, do not dispatch, and
   record a collision (see below).

The `token` is a short unique value (for example a timestamp-plus-random
suffix such as `9f3a-2026-07-29-1506`) that identifies this specific grant. It
is the packet's authority to act, and it is carried into every dispatch.

### Verify before every state-changing write

A dispatched role receives `lease.holder`, `lease.token`, and the item
`version` in its packet. Before **each** write that changes product, code, or
durable coordination state, it re-reads the authoritative record and confirms
`holder` is itself, `token` equals the dispatched token, and `version` equals
the dispatched version (or the value it last wrote). If any differ, its grant
was lost or overwritten: it **stops before modifying product state**, appends a
collision record, and returns to the grantor without acting. This makes a lost
lease a hard stop, not a silent double-write.

### Collision and stale-lease recovery

A collision is recorded as a `COLLISION` note in the item thread naming the
observed vs expected `holder`/`token`/`version`; the item is left untouched for
the grantor to reconcile.

Default lease duration is the current agent run. A timestamp expiry is a stale
work recovery signal, not permission to overwrite blindly: the grantor checks
the thread and repository state before reclaiming it. If an agent crashed
without a HANDOFF, the grantor may clear the stale lease only after this
reconciliation — it writes a fresh `token` and `version_at_grant`, increments
`version`, appends a `RECOVERY` record (see *RECOVERY record* for the required
shape) describing observed partial work, and
redispatches the appropriate role. The new token invalidates the crashed run's
token, so a resurrected stale peer fails its verify step and stops. Conflicting
or unsafe partial work requires operator escalation.

### Multi-machine and cross-branch scope

Serial granting is only atomic **within one synchronized working tree**. Across
machines, clones, or unmerged branches the committed lease state is not shared
until synchronization, so two trees can grant the same item independently. kai
does **not** claim to prevent that; the supported model is:

- run coordinated parallel work in a **single synchronized working tree**, with
  one grantor per tree;
- treat git (branch protection, merge-conflict detection, and review) as the
  cross-tree backstop that surfaces divergent leases at integration time;
- when work must span trees, serialize at the initiative level — one tree owns
  an item at a time — rather than relying on the lease field alone.

A host that exposes an atomic lock primitive may layer it under this protocol,
but the contract does not require one.

## Parallel work and collisions

Several items may share one `target`; FE, BE, QA, and infra slices often should
run together. Parallelism is safe when:

- item IDs are distinct;
- typed dependency requirements permit it;
- `touches` sets do not overlap;
- no item requires an unanswered blocking question from the other;
- each item was reserved serially by the single grantor before dispatch.

An overlapping target alone is not a collision. An overlapping path, schema,
service contract, environment, or other exclusive resource is. When overlap is
uncertain, ask the owning peer and serialize until resolved.

## Touch-set reconciliation

`touches` is a **claim**, not a proof. A declared touch set prevents two items
from being dispatched over the same exclusive resource, but nothing forces the
actual diff to stay inside it. When a role hands back implemented work, the
grantor reconciles the **actual changed paths/resources** against the item's
declared `touches`.

The changed-path set must be **attributable to this item**, not the whole
working tree. A bare `git diff --name-only` conflates concurrent peers and omits
untracked files, so it is not sufficient during parallel work. Because
`change_ref` is always a git commit/PR SHA (see the record rules), derive the
set from that object:

- the item's **cumulative** branch diff, not a single commit: the file list of
  `git diff --name-only $(git merge-base <integration-branch> <change_ref>)..<change_ref>`
  (so every commit on a multi-commit branch is covered, never just the head),
  **plus** any untracked additions the role reports; or
- an isolated per-item commit dispatched from an immutable base, when peers run
  in one tree.

Then:

- Every changed path must match a declared `touches` glob or resource.
- A change outside the declared set is reported as an **unexplained touch-set
  expansion**: the grantor does not silently accept it. It either updates
  `touches` (and re-checks overlap against other active items before doing so)
  when the expansion is legitimate and non-conflicting, or routes the item back
  as a scope question under `kai-core-scope-discipline`.
- Expansion that overlaps another active item's exclusive resource is a
  collision: serialize the items before proceeding.

This keeps the parallel-safety guarantee honest — an item can only be
considered non-conflicting for what it actually changed, not only for what it
promised to change.

## Review routing

When a builder moves an item to `in-review`, it sets `next_role` to the first
unmet `review_requirements` entry, records the exact `change_ref`, and clears
its lease. Each independent
reviewer:

1. holds the item under a grant issued by the single grantor (the director
   reserves the item and dispatches the reviewer with its token, exactly as for
   any acting role) without changing `in-review`; a no-director reviewer
   self-grants per *Single grantor*;
2. records its verdict, evidence, and matching `change_ref` in
   `completed_reviews`;
3. appends a HANDOFF;
4. sets `next_role` to the next unmet reviewer, or `workflow-ship` when all
   requirements are satisfied for a `product-change` or `operational` item;
   for `knowledge`, the named completion authority accepts the exact asset
   revision, the owning role clears the four `kai-core-asset-lifecycle`
   dimensions, and then moves the item to `completed`.

Only reviews matching the current `change_ref` count. Whenever implementation
changes, update `change_ref`; earlier reviews remain historical but become
superseded and must not satisfy the gate. The director follows the unmet list.
`workflow-ship` treats any unmatched required review as a DoD Gap.

A DESIGN item owned by `principal-product-designer` must include
`principal-product-manager` with kind `product-design-acceptance` in
`review_requirements` before promotion to `ready`. The designer writes the
artifact and `change_ref`; the PM/steward records acceptance against that
revision; only then may the owning designer close it as `completed`.

## HANDOFF packet

Append every handoff to `kai/coordination/threads/<item-id>.md`:

```markdown
## HANDOFF <YYYY-MM-DD-HHMM> — <from-role> -> <to-role>
- did:       <completed work or decision>
- state:     <state written to the item record>
- needs:     <next acceptance criteria>
- artifacts: <paths, diff, PR, reports>
- asset_state: <disposition + validity, or "none — <reason>">
- authority: <role + accepted|pending|bounced>
- revalidation: <owner + date/event, or "not applicable — <reason>">
- evidence:  <workspace-root-relative paths + source/tool + capture timestamp>
- questions: <open question IDs or "none">
- next:      <role and why>
```

The handing-off agent updates `next_role`, clears its lease unless it still
owns follow-up work, increments `version`, and appends the packet. A handoff
with no `needs` or `next` is incomplete.

## COLLISION record

When a role's verify step fails — its `holder`, `token`, or `version` no longer
matches what it was dispatched with — it appends this note and stops before
changing product state:

```markdown
## COLLISION <YYYY-MM-DD-HHMM> — <role> lost lease on <item-id>
- expected: holder=<self> token=<dispatched> version=<dispatched>
- observed: holder=<current> token=<current> version=<current>
- action:   stopped before writing product state; returned to grantor
```

The grantor reconciles the record before any re-grant: it decides whether the
other holder is legitimate (leave it), the item is stale (recover per
*Collision and stale-lease recovery*), or the situation needs operator
escalation. A COLLISION note never authorizes overwriting another live holder.

## RECOVERY record

When the grantor reclaims a stale lease (an expired grant whose holder ended
without a completion HANDOFF), it appends this parseable packet before
redispatching. It documents the observed partial work and the fresh grant that
invalidates the crashed run's token:

```markdown
## RECOVERY <YYYY-MM-DD-HHMM> — <grantor> -> <redispatched-role | @operator>
- reclaimed:   <item-id>
- stale_lease: holder=<prior> token=<prior-token> expired=<timestamp>
- observed:    <partial product/coordination work found, or "none">
- disposition: safe-to-resume | conflicting-partial-work (escalated to @operator)
- new_lease:   holder=<role> token=<fresh-token> version_at_grant=<n>   # safe-to-resume only; use "none — no re-grant until the operator resolves" for conflicting-partial-work
- state:       <lifecycle state written to the item record>
- next:        <role and why, or "@operator — awaiting conflict resolution">
```

A RECOVERY is valid only after the grantor verified the repository/thread state,
not on a timer alone. `disposition: safe-to-resume` carries a fresh `new_lease`
and a redispatched role; `disposition: conflicting-partial-work` instead sets
`new_lease: none`, routes `next` to `@operator`, and re-grants nothing until the
operator resolves it. The fresh `token` differs from `stale_lease.token`, so a
resurrected stale peer fails its verify step and stops.

## Design-waiver record

Routing an interaction-affecting change to engineering normally requires a
completed `principal-product-designer` item with PM `product-design-acceptance`.
When the steward or operator instead **waives** that design step, the waiver is
a durable structured record — never a free-form aside — appended to the affected
item's thread and referenced from the item's `completed_reviews` in place of the
skipped acceptance:

```markdown
## WAIVER <YYYY-MM-DD-HHMM> — design-step waived on <item-id>
- kind:       product-design
- grantor:    <steward-role | @operator>
- reason:     <why the interaction change is safe without a design pass>
- applies_at: version <n>   # the item version when the waiver was granted; no implementation SHA exists yet
- confirmed:  change_ref <SHA> | pending   # set to the implementation SHA at design-conformance review
- scope:      <what is waived; what still requires design if it changes>
- expires:    <revision/condition that voids the waiver, or "this change_ref only">
```

A design waiver is granted **before** engineering starts, so it binds to the
item `version` at issuance (`applies_at`), not to an implementation `change_ref`
that does not exist yet. At the design-conformance review the reviewer sets
`confirmed` to the actual implementation `change_ref`; a later revision that
changes interaction, hierarchy, flow, navigation, or a user-visible state model
needs a fresh waiver or a real design pass. A waiver records that design judgment
was consciously skipped — it never asserts the design was done.

## QUESTION / ANSWER protocol

Questions use stable IDs so blocking state can be reconciled:

```markdown
## QUESTION Q-<item-id>-<NN> <ts> — <from-role> -> @<to-role>
- status: open
- kind: fact | decision | reply | action
- blocking: yes | no
- context: <why this matters>
- ask: <one specific question>
- answer_by: <timestamp or "next-dispatch">
```

```markdown
## ANSWER Q-<item-id>-<NN> <ts> — <from-role> -> @<asker>
- status: answered
- answer: <answer in the role's lane>
- lane: in-lane | out-of-lane: <correct role>
- provenance: live-peer | durable-thread | operator
```

For a blocking question:

- add the question ID to `waiting_on_questions`;
- when the item first enters `blocked`, copy its current lifecycle state to
  `resume_state`; additional blocking questions never overwrite it;
- set the item `blocked`;
- keep `depends_on` limited to typed work-item dependencies;
- the director dispatches the addressed role or escalates at `answer_by`;
- after an answer lands, remove only that question ID. Restore the exact
  `resume_state` and clear it only when **all** blocking question IDs have
  answers. Restoration must still be performed by a role authorized for that
  transition: a `proposed` item stays proposed until the steward promotes it;
  release/deployment states remain owned by `workflow-ship`.

Anything decision-changing or cross-session lands on the thread even if it was
answered live.

`@operator` is the reserved human endpoint. Use it only for `decision`, `reply`,
or `action` questions that no kai role owns. A `proposed` item does not need the
operator merely because it awaits promotion: the initiative steward owns
`proposed -> ready`. The operator appears on the agenda only when an open
thread question is explicitly addressed to `@operator`, or when
`workflow-ship` has moved an item to `release-ready`.

## Dispatch responsibilities

`director-chief-of-staff` owns orchestration, not domain judgment:

- resolve one target workspace root and propagate its absolute paths to every
  dispatched peer;
- select `ready` items by initiative focus, steward priority, dependencies,
  touch collisions, and WIP limits;
- dispatch the named `next_role` with a self-contained work packet;
- reconcile agent results into item records and threads;
- refresh `BOARD.md`;
- maintain the initiative deliverables index and cross-initiative `INDEX.md`;
- dispatch blocking questions to real peers;
- stop at human, product-scope, architecture, security, or production approval
  boundaries rather than impersonating the decision owner.

An acting agent invoked directly may claim and work its own item, but it still
uses the same record, lease, handoff, and evidence rules.

**Active-incident command exception.** Explicit operator invocation or an
evidence-backed active-impact handoff from `workflow-support-triage`,
`workflow-ship`, `principal-security`, or `principal-sre` may create an
incident-command `knowledge` item directly as `ready`, with
`priority: 0`, `required_for_milestone: false`, `next_role:
workflow-incident-response`, and a unique
`touches: [incident-command:<environment>:<target>]`. This exception authorizes
only command, evidence, and operator-decision coordination. Mitigations, fixes,
security controls, or follow-up product/operational changes remain separate
`proposed` items until their normal owner/steward promotes them.

An abort/rollback already approved in an active `workflow-ship` record remains
on that original item and lifecycle; incident command may coordinate the
decision and evidence but must not create a duplicate rollback item. New
persistent remediation or a novel production change remains proposed scope.

## Backlog

Scope-expanding proposals remain committed:

1. Active initiative: `kai/initiatives/<initiative-slug>/backlog.md`.
2. No initiative: `kai/coordination/backlog.md`.

If the target workspace is not onboarded, stop and onboard it before recording
a coordinated proposal. Durable proposals never fall back to the ephemeral
working root.

Promotion is steward-owned. The steward creates an item record in `proposed`,
links it from the backlog, then promotes it to `ready` only after scope and
acceptance are explicit.

## Hard rules

1. Per-item files are authoritative; `BOARD.md` is derived.
2. Claim with a version check and lease before acting.
   Claiming changes `ready -> in-progress` only; later-phase leases preserve
   their lifecycle state.
3. Parallel work is controlled by dependencies and `touches`, not target name.
4. `depends_on` contains typed item dependencies; questions have their own IDs.
5. Every acting run ends with updated state, evidence, and a HANDOFF.
6. Every generated asset is closed through `kai-core-asset-lifecycle`; no
   unclassified durable output may survive a run.
7. `shipped` requires confirmed production deployment and verification.
8. Directors orchestrate; stewards prioritize; principals judge and act in
   their lanes.

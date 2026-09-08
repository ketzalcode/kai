---
name: kai-core-work-granting
description: "Defines how the single lease grantor selects, claims, and reconciles work: leases, lifecycle, recovery, dispatch, backlog, board. Use when granting or reconciling work."
tools: [execute, read, edit, search]
---

# Work: granting and reconciling work

kai's agents are single-shot and stateless. This contract is the granting half
of work coordination: how the single lease grantor selects executable work,
claims it safely, reconciles returned results, and recovers from collisions and
stale leases. Exactly one role grants a lease for an item at a time —
`director-chief-of-staff`, or a lone acting agent for its own item. The acting
side lives in `kai-core-work-acting`; the item record is defined in
`kai-core-work-item`.

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

1. Active initiative: `.kai/state/initiatives/<initiative-slug>/backlog.md`.
2. No initiative: `.kai/state/backlog.md`.

If the target workspace is not onboarded, stop and onboard it before recording
a coordinated proposal. Durable proposals never fall back to the ephemeral
working root.

Promotion is steward-owned. The steward creates an item record in `proposed`,
links it from the backlog, then promotes it to `ready` only after scope and
acceptance are explicit.

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

## Hard rules

1. Per-item files are authoritative; `BOARD.md` is derived.
2. Parallel work is controlled by dependencies and `touches`, not target name.
3. `depends_on` contains typed item dependencies; questions have their own IDs.
4. `shipped` requires confirmed production deployment and verification.
5. Directors orchestrate; stewards prioritize; principals judge and act in

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

## Runtime routes

Under workspace schema 4 the authoritative coordination record is the store at
`.kai/state/coordination.sqlite`, and every coordinated read or write goes
through one executable route:

```text
node "<kai-plugin>/scripts/coordinate.mjs" <verb> --root "<workspace-root>" [options]
```

`<kai-plugin>` is the loaded core provider directory; `<workspace-root>` is the
absolute root resolved by `kai-core-workspace-paths` and is always required to
be absolute. This section is the canonical route table. `kai-core-work-acting`
documents the acting half, and every other core contract refers here rather
than restating the verbs.

| Route | What it is for |
|---|---|
| `direct` | Declare single-shot work. Returns `{ok:true,mode:"direct",coordinationRequired:false}` and touches no workspace. |
| `inspect` | Schema/runtime preflight. `--deep` also inspects backups, reports and the source inventory. |
| `status` | Every item record under schema 4; the schema-3 status collector otherwise. |
| `context` | The bounded projection for one item (`--item`, `--max-bytes`, `--recent-limit`). |
| `detail` | One exact persisted record (`--kind`, `--id`). Historical inspection, never renewed acceptance. |
| `messages` | A bounded message page (`--item`, `--before-seq`, `--limit`). |
| `legacy` | The imported source inventory (`--source`, `--raw`). |
| `export` | The offline report writer. It appends no authoritative event. |
| `plan` | The ordered dispatch queue for one item. |
| `hash` | The real subject hash for a workspace or project-qualified path. |
| `capabilities` | Safe host discovery metadata. |
| `prepare` | Issue a native identity/launch preparation for one role. |
| `apply` | Submit one validated command. This is the only coordinated write. |
| `claim` | Read an existing binding. It acquires no lease and appends no record, but it runs on the coordinated-write path: the store opens in write mode and Git privacy is rechecked, so a workspace whose private Git exclusions drifted refuses it with `INVALID_INPUT`. |
| `delegate` | Issue a bounded sub-authority from an existing coordination capability. |
| `request` | Generate the visible canonical human request and its nonce. |
| `authorize` | Issue a capability from an exactly matched human receipt. |
| `receipt` | Look up that receipt without issuing anything. |
| `capture` | Record a real executed command's exit code, time and result size. |
| `init` / `migrate` / `recover` / `rollback` / `repair` | Explicit confirmed maintenance, each requiring `--confirm` and/or an issued `--capability`. |

Read and maintenance results carry `ok`, `mode`, the resolved `root`, the
workspace `schemaVersion` and `storeExists`. Recognized refusals are typed:
`INVALID_INPUT`, `SCHEMA_MISMATCH`, `VERSION_CONFLICT`, `LEASE_CONFLICT`,
`OPERATION_CONFLICT`, `AUTHORITY_REQUIRED`, `ROLE_UNAVAILABLE`,
`MODEL_UNAVAILABLE`, `EVIDENCE_GAP`, `CONTEXT_BUDGET`, `STORE_BUSY`,
`RECOVERY_REQUIRED`, `UNSUPPORTED_HOST`. Report the code; never restate a
refusal as a success.

### Preflight before any coordinated read or write

```text
node "<kai-plugin>/scripts/coordinate.mjs" inspect --root "<workspace-root>"
```

Successfully loading `kai-core-contract-v1` proves only that the plugin is
reachable. It is a separate step from this preflight and is never permission to
operate a schema-4 workspace. Execute the `inspect` command and read its result:

- `schema_version: 4` with an existing store — coordinated commands are
  available.
- `schema_version: 3` — the workspace is **inspect-only**: it stays readable
  through `inspect`, `status` and `legacy` only. Every other read refuses with
  `SCHEMA_MISMATCH` — *schema 3 supports inspect/status/legacy only; explicitly
  migrate for runtime detail* — and every write refuses with *schema 3 is
  inspect-only; use explicit offline migration*.
  Do not work around that refusal. The migration path is the explicit offline
  ladder in `kai-core-workspace-onboarding`; there is never an automatic upgrade.
- a missing manifest — stop and report it.
- `schema_version: 4` with no store — `inspect` answers, and every other verb
  refuses with `SCHEMA_MISMATCH`. This is the expected window between scaffolding
  a workspace and creating its store, not a broken workspace. No command
  initializes the coordination database implicitly, and `inspect` will not
  create it. Only `init --confirm --capability <uuid>` creates a store, and only
  for an already-valid schema-4 manifest.

### Writing: one command per operation

Every coordinated write is exactly one JSON command object on stdin:

```text
node "<kai-plugin>/scripts/coordinate.mjs" apply --root "<workspace-root>" [--capability <uuid>] [--capture <uuid>]
```

```js
{
  operationId: "<uuid>",          // new per attempt; replay returns the original receipt
  kind: "item.grant",
  actor: {role: "<role>", runId: "<COPILOT_AGENT_SESSION_ID>"},
  recordKind: "item", recordId: "<item-id>",
  expectedVersion: 3,             // 0 when creating; the runtime performs the compare-and-swap
  leaseToken: "<token or null>",
  payload: { /* validated per kind */ }
}
```

Command kinds are closed: `initiative.create`, `initiative.update`,
`item.create`, `item.update`, `item.promote`, `item.grant`, `item.transition`,
`item.handoff`, `item.restore`, `question.open`, `question.answer`,
`attempt.recover`, plus the evidence producers `artifact.register`,
`review.record`, `approval.record`, `evidence.register` and `asset.transition`.
An unknown kind, an unknown field, or a caller-supplied authority extension is
`INVALID_INPUT`. Authority is resolved from persisted grants and real host
inputs — `--operator`, a pasted boolean and a caller-authored receipt never
confer it, and an unauthorized command returns `AUTHORITY_REQUIRED`.

### Human decisions

An operator decision is never a flag. Generate the visible canonical request,
let the human answer it in the host, then issue the capability from that exact
receipt:

```text
node "<kai-plugin>/scripts/coordinate.mjs" request   --root "<workspace-root>"    # JSON intent on stdin
node "<kai-plugin>/scripts/coordinate.mjs" receipt   --root "<workspace-root>" --request <nonce>
node "<kai-plugin>/scripts/coordinate.mjs" authorize --root "<workspace-root>" --request <nonce>
```

Unknown, ambiguous, reversed, duplicate, nested-agent, declined, conditional and
expired interactions do not produce approval. A successful tool execution is not
a human approval.

This gate governs `init`, `migrate`, `recover`, `rollback`, `repair` and
`approval.record`. There is no other route to any of them.

The middle step is a real host interaction, and the runtime matches it exactly:

1. `request` returns a `message`, a `requestedSchema` and a `nonce`. Put that
   returned `message` and `requestedSchema` into the host's **`ask_user`** tool
   **verbatim** — the message must be byte-for-byte identical and the schema
   must be the same value the request returned. A reworded, re-wrapped,
   translated, truncated or summarized prompt matches nothing.
2. The human answers inside that same `ask_user` call. The only accepted result
   is the strict approval string `User responded: APPROVE <nonce>` (detailed
   content `User responded:\ndecision: APPROVE <nonce>`), carrying the exact
   nonce the request issued.
3. `authorize --request <nonce>` re-reads that interaction from the host's own
   journal and issues the capability; `receipt` looks it up without issuing
   anything. Add `--tool-call <id>` when two interactions are ambiguous.

Anything else yields no authority. A human who typed "approved" into ordinary
chat leaves no `ask_user` interaction at all, so the runtime finds nothing to
match and refuses — never restate that refusal as an approval.

### Native launch ordering

When the grantor launches a real role as a standalone native context, the order
is fixed and each step is a real command:

```text
prepare  -> apply (item.grant)  -> launch with the returned identity -> claim
```

`prepare` (stdin `{"role":"<role-id>"}`) returns the prepared actor, the
qualified native agent ID, safe discovery metadata and the launch argument
array, with `reserved: false` and an explicit instruction not to start model
work yet. Grant first; only then launch, in that workspace, with the returned
identity arguments. A preparation expires after one hour and binds the
manifest. A context that already started before a new reservation cannot be
relabeled a fresh worker — prepare a new one.

`claim --item <id>` inspects an existing binding. It acquires no lease, starts
no model and writes no record. `delegate --capability <coordination-capability>`
issues a bounded sub-authority for already-authorized routine work; a delegate
cannot re-delegate or widen its parent's actions.

### What the runtime does not do

- **It does not dispatch.** `plan --item <id>` returns an ordered queue with
  `automatic: false` and names the explicit execution/receipt gap. A human or
  the calling director still launches each role; nothing in the runtime starts a
  peer by itself.
- **It does not observe peers.** Peer model/effect observation is not
  implemented and returns `UNSUPPORTED_HOST`. Native session `resume` is not
  advertised either. Where a host capability is genuinely absent, name the gap
  and the ordered queue instead of inventing a fallback.
- **It does not prove a coordinated workflow.** The measured native evidence is
  one probe on one host, whose human authorization was an explicitly synthetic
  isolated fixture. Treat coordinated multi-role execution as designed and
  source-routed, not as measured.

### Direct single-shot work needs none of this

An ordinary directly authorized request needs no coordination database, no
initiative and no report tree. `direct` is the honest declaration for it, and a
role that was handed sufficient scope and evidence keeps working without ever
resolving a workspace.

## Claiming work safely

Under schema 4 the runtime supplies the compare-and-swap the Markdown surface
never had: `apply` takes an `expectedVersion`, performs the read, the check and
the write inside one operation, and refuses with `VERSION_CONFLICT` or
`LEASE_CONFLICT` rather than letting two writers each believe they hold the
item. That is the mechanism. The rules below are still required, because a
database makes a write atomic without making a *grant* correct: kai keeps lease
**granting serial** and lease **holding verifiable** on top of it.

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

0. Runs the **preflight** above. `inspect` must report `schema_version: 4` and
   an existing store before any grant. A schema-3 or manifest-less workspace is
   inspect-only: report the explicit migration ladder in
   `kai-core-workspace-onboarding` rather than claiming against state the
   contract cannot guarantee. The workspace doctor
   (`node "<kai-plugin>/scripts/workspace-doctor.mjs"`) still checks the
   surrounding file contract, but it is not the coordination preflight.
1. Reads the authoritative record with `detail --kind item --id <item-id>` and
   notes its `version`.
2. Confirms every dependency reached its declared required state and questions
   are clear. `status` and `context --item <id>` supply that view.
3. Confirms **no unexpired lease is held at all** — not merely that none belongs
   to another role. An unexpired lease held even by the same role blocks a new
   grant: only the exact existing token may continue that work, and a re-grant
   happens solely after the current holder terminates and is recovered (see
   *Collision and stale-lease recovery*). This prevents a second instance of one
   role from being granted a live item.
4. Checks active item `touches` sets for overlap.
5. Submits one `item.grant` command through `apply`, with `expectedVersion` set
   to the `version` just read. The runtime performs the compare-and-swap: it
   issues the `token`, binds `version_at_grant` to the observed version, writes
   `acquired`/`expires` and increments `version` in the same operation, so a
   held lease always has `version_at_grant` strictly less than the item
   `version`. Only a `ready` item transitions to `in-progress` when reserved.
   Review/release roles lease `in-review`, `release-ready`, `deploying`, or
   `production-verification` without regressing the lifecycle state. **Never
   hand-write a lease into a Markdown file.**
6. Reads the receipt. A success carries the new `recordVersion` and the issued
   token. A `VERSION_CONFLICT` or `LEASE_CONFLICT` means another writer
   intervened: stop, do not dispatch, and reconcile (see below). A retryable
   `STORE_BUSY` may be retried; a refusal may not be retried into success.

The `token` is a short unique value issued by the runtime that identifies this
specific grant. It is the packet's authority to act, it is carried into every
dispatch, and the acting role returns it as `leaseToken` on every subsequent
command.

### Collision and stale-lease recovery

A collision is what the runtime returns, not something a role writes: a lost or
raced grant refuses with `VERSION_CONFLICT` or `LEASE_CONFLICT` and the record
is left exactly as it was, for the grantor to reconcile. The `COLLISION` packet
below is the readable shape of that refusal; it is never the mechanism.

Default lease duration is the current agent run. A timestamp expiry is a stale
work recovery signal, not permission to overwrite blindly: the grantor checks
the record through `detail`/`messages` and repository state before reclaiming it.
If an agent crashed
without a HANDOFF, the grantor may reclaim the stale lease only after this
reconciliation — it submits an `attempt.recover` command through `apply`, which
issues a fresh `token` and `version_at_grant`, increments `version`, and carries
the `RECOVERY` packet (see *RECOVERY record* for the required shape) describing
the observed partial work, and then redispatches the appropriate role. The new
token invalidates the crashed run's token, so a resurrected stale peer's next
command refuses with `LEASE_CONFLICT` and it stops. Conflicting or unsafe
partial work requires operator escalation. A grantor acting outside its
persisted grants is refused with `AUTHORITY_REQUIRED`.

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
without a completion HANDOFF), it submits `attempt.recover` through `apply`
carrying this packet. It documents the observed partial work and the fresh
grant that invalidates the crashed run's token, and `messages --item <item-id>`
reads it back:

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

A RECOVERY is valid only after the grantor verified the repository state and the
thread view, not on a timer alone. `disposition: safe-to-resume` carries a fresh
`new_lease` and a redispatched role; `disposition: conflicting-partial-work`
instead sets `new_lease: none`, routes `next` to `@operator`, and re-grants
nothing until the operator resolves it. The fresh `token` differs from
`stale_lease.token`, so a resurrected stale peer's next command refuses with
`LEASE_CONFLICT` and it stops.

## Design-waiver record

Routing an interaction-affecting change to engineering normally requires a
completed `creative-lead-design` item with PM `product-design-acceptance`.
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
- run the preflight, then select `ready` items by initiative focus, steward
  priority, dependencies, touch collisions, and WIP limits;
- reserve each item with `item.grant`, then launch the named `next_role` with a
  self-contained work packet. `plan --item <id>` returns the ordered queue with
  `automatic: false`; the director, not the runtime, performs each launch;
- reconcile agent results by re-reading the records through `detail`/`context`
  and submitting its own commands for anything the peer could not;
- refresh the initiative deliverables index and cross-initiative `INDEX.md`;
  the cross-item board is `status`, which needs no refresh;
- route blocking questions to real peers;
- stop at human, product-scope, architecture, security, or production approval
  boundaries rather than impersonating the decision owner.

An acting agent invoked directly may claim and work its own item, but it still
uses the same runtime routes, lease, handoff, and evidence rules.

**Active-incident command exception.** Explicit operator invocation or an
evidence-backed active-impact handoff from `workflow-support-triage`,
`workflow-ship`, `eng-reviewer-security`, or `eng-reviewer-reliability` may
create an incident-command `knowledge` item directly as `ready`, with
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

Promotion is steward-owned. The steward creates the record with `item.create` in
`proposed`, links it from the backlog, then promotes it with `item.promote` to
`ready` only after scope and acceptance are explicit.

## The cross-item view

`status --root "<workspace-root>"` is the cross-item view: it returns every item
record the runtime holds, with the same fields a board row used to summarize —
id, title, initiative, milestone, priority, state, owner, next role,
dependencies, waiting-on and updated time. Select work from it, then re-read the
one item you intend to act on through `detail`/`context` before submitting a
command.

`.kai/state/BOARD.md` is a **retained historical import source**. Under schema 4
nothing writes it, so it is no longer updated: it is the pre-migration board
text, kept because the migration imported from it, and it is never read as
authority. A workspace that never held a schema-3 board simply has no such file.
Its historical shape was:

```markdown
# Board

| id | title | initiative | milestone | priority | state | owner | next | depends-on | waiting-on | updated |
|----|-------|------------|-----------|----------|-------|-------|------|------------|------------|---------|
| checkout-async-api | Async checkout API | payments-q3 | async-checkout | 10 | in-progress | eng-builder-software | eng-builder-software | — | — | 2026-07-20-1415 |
```

If a human wants a readable board today, `export --item <id>` writes the offline
HTML report for one item; there is no whole-workspace Markdown board and no
command produces one.

## Hard rules

1. The runtime store is authoritative. `BOARD.md`, `.kai/state/items/*.md` and
   `.kai/state/threads/*.md` are retained historical import sources that are no
   longer updated; `status`, `detail`, `messages` and `export` are how the
   record is read.
2. Parallel work is controlled by dependencies and `touches`, not target name.
3. `depends_on` contains typed item dependencies; questions have their own IDs.
4. `shipped` requires confirmed production deployment and verification.
5. Directors orchestrate; stewards prioritize; principals judge and act in

---
name: kai-core-work-acting
description: "Defines how a dispatched agent acts on work it already holds: verify-before-write, collision, handoff, question, and review-routing protocols. Use when acting on a granted item."
tools: [execute, read, edit, search]
---

# Work: acting on granted work

kai's agents are single-shot and stateless. This contract is the acting half of
work coordination: what a dispatched role does with an item it already holds —
verifying its lease before each write, recording collisions and handoffs,
asking and answering questions, and routing reviews. Granting an item is the
grantor's job and lives in `kai-core-work-granting`; the item record itself is
defined in `kai-core-work-item`.

It is not a standalone trigger skill. Acting agents use it whenever they act,
hand off, block, review, or finish work they were dispatched.

## Coordination surface

Under workspace schema 4 the authoritative record is the runtime store. Read it
with `status`, `detail`, `messages` and `export`; nothing writes the Markdown
tree beside it back out:

```text
.kai/state/
  coordination.sqlite         # authoritative: the runtime's records and events
  ACTIVE.md
  BOARD.md                    # retained historical import source; no longer updated
  items/
    <item-id>.md              # retained historical import source; no longer updated
  threads/
    <item-id>.md              # retained historical import source; no longer updated
  backlog.md
.kai/state/initiatives/
  INDEX.md
  <initiative-slug>/
    northstar.md
    log.md
    backlog.md
```

Read the retained Markdown as history if you want context, never as current
state. Never hand-edit one to change coordinated state: a write that is not a
runtime command did not happen, and no command reads that file back as
authority.

## The runtime route

Every coordinated read and write goes through the command route that
`kai-core-work-granting` defines canonically:

```text
node "<kai-plugin>/scripts/coordinate.mjs" <verb> --root "<workspace-root>" [options]
```

An acting role uses `detail`, `context`, `messages` and `status` to read, and
`apply` to write. `apply` takes exactly one JSON command object on stdin:

```js
{
  operationId: "<uuid>",          // new per attempt
  kind: "item.handoff",
  actor: {role: "<your role>", runId: "<COPILOT_AGENT_SESSION_ID>"},
  recordKind: "item", recordId: "<item-id>",
  expectedVersion: 7,             // the version you were dispatched with, or last wrote
  leaseToken: "<your dispatched token>",
  payload: { /* validated per kind */ }
}
```

`actor.runId` must equal the `COPILOT_AGENT_SESSION_ID` the host supplied to
this context. It is a real context identity, not a role alias, and it is not an
authentication of arbitrary code running as the OS user — never invent one.

The kinds an acting role uses are `item.update`, `item.transition`,
`item.handoff`, `item.restore`, `question.open`, `question.answer`, and the
evidence producers `artifact.register`, `review.record` and `evidence.register`.
`item.grant`, `item.promote` and `attempt.recover` belong to the grantor.

An ordinary directly authorized request needs no coordination database, no
initiative and no report tree. This contract applies only once you actually
hold a coordinated item.

## The acting loop

A dispatched role runs one pass over an item it already holds. This is the
order; the detail for each step lives in the section or skill named.

Before acting:

1. Read the item record with `detail --kind item --id <item-id>`, its latest
   HANDOFF, relevant initiative context (`kai-core-workspace-initiative`), and
   every `context_artifacts` path. `context --item <item-id>` supplies the
   bounded projection and the recent message summaries.
2. Confirm `artifact_expectation` before producing any output; `none` is valid
   only with a reason. The declaration and asset state live in
   `kai-core-asset-producing`.
3. Confirm acceptance, dependencies, open questions, touch-set safety, version,
   and lease, then carry them into every command (see **Verify before every
   state-changing write**).

Before stopping:

1. Run the smallest existing validation that proves the changed behaviour.
2. Keep the actual changed paths inside the declared `touches` set, or report
   the expansion.
3. Submit the state, evidence, version, `next_role` and lease changes as
   runtime commands, routing any review through **Review routing**.
4. Submit an `item.handoff` (see **HANDOFF packet**). Never leave coordinated
   work silently in progress.

Every peer receives the same absolute workspace root and writes artifact paths
relative to it. The final handoff names that root and the exact paths to the
initiative summary and deliverable index; abbreviated paths such as `.../` are
not sufficient.

## Verify before every state-changing write

A dispatched role receives `lease.holder`, `lease.token`, and the item
`version` in its packet. It carries them into **each** command: `actor.role` is
itself, `leaseToken` is the dispatched token, and `expectedVersion` is the
dispatched version (or the value it last wrote). The runtime performs the
compare-and-swap inside one operation, so the check cannot drift between a read
and a write.

If the grant was lost or overwritten, the command refuses:

- `VERSION_CONFLICT` — the record moved since the version you were given;
- `LEASE_CONFLICT` — the lease is no longer yours, or a fresh token replaced it;
- `AUTHORITY_REQUIRED` — you hold no persisted grant for this action.

Any of those is a hard stop. **Stop before modifying product state**, record the
collision, and return to the grantor without acting. `STORE_BUSY` is the only
retryable code here; never retry a refusal into a success, and never work around
one by editing a Markdown file.

## COLLISION record

When a command refuses with `VERSION_CONFLICT`, `LEASE_CONFLICT` or
`AUTHORITY_REQUIRED`, the role stops before changing product state and reports
the collision to its grantor. The packet below is the readable shape of that
report; read it back with `messages --item <item-id>`:

```markdown
## COLLISION <YYYY-MM-DD-HHMM> — <role> lost lease on <item-id>
- expected: holder=<self> token=<dispatched> version=<dispatched>
- observed: holder=<current> token=<current> version=<current>
- refusal:  <VERSION_CONFLICT | LEASE_CONFLICT | AUTHORITY_REQUIRED>
- action:   stopped before writing product state; returned to grantor
```

The grantor reconciles the record before any re-grant: it decides whether the
other holder is legitimate (leave it), the item is stale, or the situation needs operator
escalation. A COLLISION note never authorizes overwriting another live holder. The grantor's side of this protocol lives in `kai-core-work-granting`.

## HANDOFF packet

Submit every handoff as an `item.handoff` command. Its payload carries this
shape, and `messages --item <item-id>` reads it back:

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

The handing-off role sets `next_role`, clears its lease unless it still owns
follow-up work, and submits the packet; the runtime increments `version`. A
handoff with no `needs` or `next` is incomplete.

## QUESTION / ANSWER protocol

Questions use stable IDs so blocking state can be reconciled. Open one with
`question.open` and resolve it with `question.answer`. This is the same one
packet `kai-core-peer-communication` defines for its three transports; the
Markdown below is the readable shape of that packet, not a second shape and not
a place to hand-write a question:

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

A new ANSWER always carries an explicit `status: answered` and a non-empty
`answer` and `lane` — a blank answer or a missing/non-`answered` status never
resolves the question. A pre-existing thread record written before this
contract may carry no `status` field at all; that legacy shape still parses as
answered when its `answer`/`lane` otherwise resolve the question (see
`parseThread` in `scripts/lib/coordination.mjs`), but it is not the template
for new records.

For a blocking question, `question.open` records the blocking effects as one
operation, and `item.restore` reverses them:

- the question ID joins `waiting_on_questions`;
- when the item first enters `blocked`, its current lifecycle state is copied to
  `resume_state`; additional blocking questions never overwrite it;
- the item becomes `blocked`, and the runtime **clears the lease** — a blocking
  question ends your hold on the item, so a fresh grant is needed to resume;
- `depends_on` stays limited to typed work-item dependencies;
- the director launches the addressed role or escalates at `answer_by`;
- after an answer lands, only that question ID is removed. `item.restore`
  restores the exact `resume_state` and clears it only when **all** blocking
  question IDs have answers, and only for a role authorized for that
  transition: a `proposed` item stays proposed until the steward promotes it;
  release/deployment states remain owned by `workflow-ship`.

Anything decision-changing or cross-session lands on the durable record even if
it was answered live.

`@operator` is the reserved human endpoint. Use it only for `decision`, `reply`,
or `action` questions that no kai role owns. A `proposed` item does not need the
operator merely because it awaits promotion: the initiative steward owns
`proposed -> ready`. The operator appears on the agenda only when an open
thread question is explicitly addressed to `@operator`, or when
`workflow-ship` has moved an item to `release-ready`.

## Review routing

When a builder moves an item to `in-review`, it sets `next_role` to the first
unmet `review_requirements` entry, records the exact `change_ref`, and clears
its lease. Each independent
reviewer:

1. holds the item under a grant issued by the single grantor (the director
   reserves the item with `item.grant` and launches the reviewer with its token,
   exactly as for any acting role) without changing `in-review`; a no-director
   reviewer self-grants. The grantor's side of this protocol lives in
   `kai-core-work-granting`;
2. records its verdict, evidence, and matching `change_ref` with a
   `review.record` command, which appends to `completed_reviews`;
3. submits an `item.handoff`;
4. sets `next_role` to the next unmet reviewer, or `workflow-ship` when all
   requirements are satisfied for a `product-change` or `operational` item;
   for `knowledge`, the named completion authority accepts the exact asset
   revision, the owning role clears the four `kai-core-asset-closing`
   dimensions, and then moves the item to `completed` with `item.transition`.

Only reviews matching the current `change_ref` count. Whenever implementation
changes, update `change_ref`; earlier reviews remain historical but become
superseded and must not satisfy the gate. The director follows the unmet list.
`workflow-ship` treats any unmatched required review as a DoD Gap.

A DESIGN item owned by `creative-lead-design` must include the item's declared
`completion_authority` — a concrete role or `operator`, never a compulsory
product-agent stand-in — with kind `product-design-acceptance` in
`review_requirements` before promotion to `ready`. That completion authority
must never be `creative-lead-design` itself: the producing designer cannot
accept its own design, so the declared role names `operator` or another
explicitly authorized role that is genuinely independent of the run that
authored the artifact. The runtime enforces this, it is not contract text
alone: `review.record`, `approval.record` and the evidence-waiver path all
refuse with `AUTHORITY_REQUIRED` when the accepting actor's `runId` appears in
the item's `producing_actors`, and a `product-design-acceptance` review is
refused unless the acting role *is* the declared `completion_authority` and
that role appears in no entry of `producing_actors`. The designer writes the
artifact and `change_ref`; the named completion authority records acceptance
against that revision; only then may the owning designer close it as
`completed`.

## Hard rules

1. Claim with a version check and lease before acting.
   Claiming changes `ready -> in-progress` only; later-phase leases preserve
   their lifecycle state.
2. Every acting run ends with updated state, evidence, and a HANDOFF.
3. Every generated asset is closed through `kai-core-asset-closing`; no
   unclassified durable output may survive a run.
4. Coordinated state changes only through a runtime command. Editing
   `.kai/state/items/*.md`, `.kai/state/threads/*.md` or `BOARD.md` changes a
   retained historical import source, not the record.

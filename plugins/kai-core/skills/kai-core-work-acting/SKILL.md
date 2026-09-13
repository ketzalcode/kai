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

```text
.kai/state/
  ACTIVE.md
  BOARD.md                    # derived index; director-maintained
  items/
    <item-id>.md              # authoritative state + acceptance
  threads/
    <item-id>.md              # HANDOFF + QUESTION/ANSWER history
  backlog.md
.kai/state/initiatives/
  INDEX.md
  <initiative-slug>/
    northstar.md
    log.md
    backlog.md
```

## The acting loop

A dispatched role runs one pass over an item it already holds. This is the
order; the detail for each step lives in the section or skill named.

Before acting:

1. Read the item record, its latest HANDOFF, relevant initiative context
   (`kai-core-workspace-initiative`), and every `context_artifacts` path.
2. Confirm `artifact_expectation` before producing any output; `none` is valid
   only with a reason. The declaration and asset state live in
   `kai-core-asset-producing`.
3. Confirm acceptance, dependencies, open questions, touch-set safety, version,
   and lease, then re-verify the lease before each write (see **Verify before
   every state-changing write**).

Before stopping:

1. Run the smallest existing validation that proves the changed behaviour.
2. Keep the actual changed paths inside the declared `touches` set, or report
   the expansion.
3. Update item state, evidence, version, `next_role`, and lease, routing any
   review through **Review routing**.
4. Append a HANDOFF (see **HANDOFF packet**). Never leave coordinated work
   silently in progress.

Every peer receives the same absolute workspace root and writes artifact paths
relative to it. The final handoff names that root and the exact paths to the
initiative summary and deliverable index; abbreviated paths such as `.../` are
not sufficient.

## Verify before every state-changing write

A dispatched role receives `lease.holder`, `lease.token`, and the item
`version` in its packet. Before **each** write that changes product, code, or
durable coordination state, it re-reads the authoritative record and confirms
`holder` is itself, `token` equals the dispatched token, and `version` equals
the dispatched version (or the value it last wrote). If any differ, its grant
was lost or overwritten: it **stops before modifying product state**, appends a
collision record, and returns to the grantor without acting. This makes a lost
lease a hard stop, not a silent double-write.

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
other holder is legitimate (leave it), the item is stale, or the situation needs operator
escalation. A COLLISION note never authorizes overwriting another live holder. The grantor's side of this protocol lives in `kai-core-work-granting`.

## HANDOFF packet

Append every handoff to `.kai/state/threads/<item-id>.md`:

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

## Review routing

When a builder moves an item to `in-review`, it sets `next_role` to the first
unmet `review_requirements` entry, records the exact `change_ref`, and clears
its lease. Each independent
reviewer:

1. holds the item under a grant issued by the single grantor (the director
   reserves the item and dispatches the reviewer with its token, exactly as for
   any acting role) without changing `in-review`; a no-director reviewer
   self-grants. The grantor's side of this protocol lives in `kai-core-work-granting`;
2. records its verdict, evidence, and matching `change_ref` in
   `completed_reviews`;
3. appends a HANDOFF;
4. sets `next_role` to the next unmet reviewer, or `workflow-ship` when all
   requirements are satisfied for a `product-change` or `operational` item;
   for `knowledge`, the named completion authority accepts the exact asset
   revision, the owning role clears the four `kai-core-asset-closing`
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

## Hard rules

1. Claim with a version check and lease before acting.
   Claiming changes `ready -> in-progress` only; later-phase leases preserve
   their lifecycle state.
2. Every acting run ends with updated state, evidence, and a HANDOFF.
3. Every generated asset is closed through `kai-core-asset-closing`; no
   unclassified durable output may survive a run.

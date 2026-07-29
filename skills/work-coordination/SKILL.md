---
name: work-coordination
description: "The shared coordination contract that lets many single-shot agents behave like one team across several concurrent efforts. Owns the durable coordination/ surface: authoritative per-item state, derived BOARD.md, append-only threads, and unaffiliated backlog, while initiatives retain strategic context and deliverable indexes. Defines lifecycle, leases, versions, dependencies, touch collisions, handoffs, questions, canonical artifact targets, and exact evidence paths."
tools: [bash, view, edit, create, grep, glob]
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
handoffs, so it lives under the target workspace's `coordination/`. In a
repository workspace this surface is committed. In an operator-confirmed
external workspace it is durable local state and must not be described as
committed unless that directory is actually version-controlled.

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
coordination/
  ACTIVE.md
  BOARD.md                    # derived index; director-maintained
  items/
    <item-id>.md              # authoritative state + acceptance
  threads/
    <item-id>.md              # HANDOFF + QUESTION/ANSWER history
  backlog.md
initiatives/
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
artifact_target: null
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
- **`artifact_target`** is the exact workspace-root-relative or absolute output
  path for a file-producing item. Initiative items default to the canonical
  location from `workspace-conventions`:
  `initiatives/<slug>/artifacts/product-map.md`,
  `initiatives/<slug>/artifacts/marketing/` (bundle directory),
  `initiatives/<slug>/artifacts/content/<item-id>/` (content bundle),
  `initiatives/<slug>/artifacts/customer-success/<item-id>.md` (de-identified signal),
  `initiatives/<slug>/artifacts/support/<item-id>.md` (de-identified signal),
  `initiatives/<slug>/artifacts/feedback/<item-id>.md` (de-identified signal),
  `initiatives/<slug>/artifacts/growth/<item-id>.md`,
  `initiatives/<slug>/artifacts/analytics/<item-id>.md`,
  `initiatives/<slug>/artifacts/experiments/<item-id>.md`,
  `initiatives/<slug>/artifacts/pricing/<item-id>.md`,
  `initiatives/<slug>/artifacts/sales/<item-id>.md` (de-identified deal brief),
  `initiatives/<slug>/artifacts/solutions/<item-id>.md` (sanitized solution brief),
  `initiatives/<slug>/artifacts/security/<item-id>.md`,
  `initiatives/<slug>/artifacts/reliability/<item-id>.md`,
  `initiatives/<slug>/artifacts/incidents/<item-id>.md`,
  `initiatives/<slug>/artifacts/compliance/<item-id>.md`,
  `initiatives/<slug>/artifacts/briefs/<item-id>.md`,
  `initiatives/<slug>/artifacts/research/<item-id>.md`,
  `initiatives/<slug>/artifacts/designs/<item-id>.md`,
  `initiatives/<slug>/artifacts/docs/<item-id>.md` (technical writing / docs),
  `initiatives/<slug>/artifacts/revops/<item-id>.md` (revenue-operations brief),
  `initiatives/<slug>/artifacts/campaigns/<item-id>.md` (demand-gen campaign plan),
  `initiatives/<slug>/artifacts/partnerships/<item-id>.md` (de-identified partnership brief),
  `initiatives/<slug>/artifacts/localization/<item-id>.md` (localization report),
  `initiatives/<slug>/artifacts/data-engineering/<item-id>.md` (data-engineering design),
  `initiatives/<slug>/artifacts/brand/<item-id>.md` (brand / visual-identity system), or
  `initiatives/<slug>/artifacts/decisions/<item-id>.md`. An operator-approved
  override is allowed only inside the resolved workspace and must be recorded.
  An unaffiliated incident-command item uses
  `library/investigations/<incident-id>/incident-record.md` for its sanitized
  closure record; raw incident evidence remains in `.kai/runs/`.
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
- **`change_ref`** identifies the implementation revision under review: commit
  SHA, PR head SHA, or deterministic diff hash. It is required before
  `in-review`.
- **`version`** increments on every state-changing edit.
- **`lease`** protects active ownership. A lease is coordination, not a
  substitute for git conflict detection.
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
| `ready` | Committed, acceptance defined, dependencies clear. | steward |
| `in-progress` | A role holds a live lease and is acting. | owning agent/director |
| `in-review` | Implementation complete; review and verification underway. | builder |
| `blocked` | Cannot proceed because of item dependencies or blocking questions. | any acting role |
| `completed` | A non-production knowledge/decision item passed its acceptance, required reviews, and coordination close. | owning principal/workflow |
| `release-ready` | DoD is clear for deployment; not yet production-shipped. | `workflow-ship` prepare mode |
| `deploying` | Human/operator confirmed deployment started; successful completion is not yet established. | `workflow-ship` CONFIRM-START |
| `production-verification` | Successful deployment completion is evidenced; smoke/health checks pending. | `workflow-ship` CONFIRM-COMPLETE |
| `shipped` | Production deployment and required verification are evidenced. | `workflow-ship` |
| `dropped` | Explicitly declined with a reason and backlog/log link. | steward/operator |

`completed` is the truthful terminal state for research, plans, and decisions.
`shipped` is reserved for production/operational delivery and never means
“commands were prepared.”

## Claiming work safely

Before acting, an agent or the director:

0. Confirms the workspace is **schema-compatible**: `.kai/manifest.json` exists
   and its `schema_version` equals the current contract. If it is behind (or the
   manifest is missing), stop and report the exact repair — run the workspace
   doctor (`node <kai-plugin>/scripts/workspace-doctor.mjs`) and apply the
   migration ladder in `workspace-onboarding` — rather than claiming against
   state the contract can't guarantee. Never claim an item in an incompatible or
   doctor-failing workspace.
1. Reads the authoritative item record and notes `version`.
2. Confirms every dependency reached its declared required state and questions
   are clear.
3. Confirms no unexpired lease belongs to another owner.
4. Checks active item `touches` sets for overlap.
5. Writes its owner + lease and increments `version`. Only a `ready` item
   transitions to `in-progress` when claimed. Review/release roles lease
   `in-review`, `release-ready`, `deploying`, or `production-verification`
   without regressing the lifecycle state. Re-read immediately; if the
   expected version/lease is absent, stop and record a collision.

Default lease duration is the current agent run. A timestamp expiry is a stale
work recovery signal, not permission to overwrite blindly: the director checks
the thread and repository state before reclaiming it. If an agent crashed
without a HANDOFF, the director may clear the stale lease only after this
reconciliation, append a `RECOVERY` HANDOFF describing observed partial work,
and redispatch the appropriate role. Conflicting or unsafe partial work
requires operator escalation.

## Parallel work and collisions

Several items may share one `target`; FE, BE, QA, and infra slices often should
run together. Parallelism is safe when:

- item IDs are distinct;
- typed dependency requirements permit it;
- `touches` sets do not overlap;
- no item requires an unanswered blocking question from the other.

An overlapping target alone is not a collision. An overlapping path, schema,
service contract, environment, or other exclusive resource is. When overlap is
uncertain, ask the owning peer and serialize until resolved.

## Review routing

When a builder moves an item to `in-review`, it sets `next_role` to the first
unmet `review_requirements` entry, records the exact `change_ref`, and clears
its lease. Each independent
reviewer:

1. leases the item without changing `in-review`;
2. records its verdict, evidence, and matching `change_ref` in
   `completed_reviews`;
3. appends a HANDOFF;
4. sets `next_role` to the next unmet reviewer, or `workflow-ship` when all
   requirements are satisfied for a `product-change` or `operational` item;
   for `knowledge`, the owning role verifies acceptance and moves the item to
   `completed`.

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

Append every handoff to `coordination/threads/<item-id>.md`:

```markdown
## HANDOFF <YYYY-MM-DD-HHMM> — <from-role> -> <to-role>
- did:       <completed work or decision>
- state:     <state written to the item record>
- needs:     <next acceptance criteria>
- artifacts: <paths, diff, PR, reports>
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

1. Active initiative: `initiatives/<initiative-slug>/backlog.md`.
2. No initiative: `coordination/backlog.md`.

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
6. `shipped` requires confirmed production deployment and verification.
7. Directors orchestrate; stewards prioritize; principals judge and act in
   their lanes.

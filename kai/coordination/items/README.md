# Work items

One authoritative record per unit of executable work, named `<item-id>.md`.
This file **is** the state; `kai/coordination/BOARD.md` is only a derived index —
if the two disagree, the item record wins. Full contract:
`kai-core-work-coordination`.

## Record shape

```yaml
---
type: work-item
id: <stable-unique-id>
title: <human title>
initiative: <slug or null>
milestone: <milestone id or "—">
delivery_class: knowledge | product-change | operational
state: proposed
resume_state: null
priority: <int, lower runs first>
owner: null
next_role: <role to dispatch>
target: <feature/system/area>
artifact_expectation: owed | none
artifact_expectation_reason: <required when none>
artifact_class: <required when owed>
durability: ephemeral | working | durable | published
completion_authority: <required when owed>
validity_owner: <required when owed>
artifact_targets:
  - <canonical output path>
context_artifacts: []
touches: []
depends_on:
  - item: <item-id>
    requires: in-review | completed | release-ready | shipped
waiting_on_questions: []
required_for_milestone: true | false
review_requirements:
  - role: <role>
    kind: <review kind>
completed_reviews: []
change_ref: null
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: <YYYY-MM-DD-HHMM>
---

## Outcome
<One observable outcome this item must produce.>

## Acceptance
- [ ] <Verifiable criterion>

## Evidence
- <Filled as work progresses: diff, tests, reviews, deployment run>
```

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

`ready` is a **steward commitment** (fits scope, acceptance defined,
`depends_on` declared) — it does not require the dependencies to have already
resolved. *Executable* is the director's derived predicate at dispatch time and
is never stored on the record. `completed` is the truthful terminal state for
research/decisions; `shipped` is reserved for production/operational delivery.

## Typed dependencies

`depends_on` names an upstream `item` and the minimum required state:
`in-review`, `completed`, `release-ready`, or `shipped`. Default to `completed`
for an upstream `knowledge` item and `shipped` otherwise; `completed` is valid
only for `knowledge`, and `release-ready`/`shipped` only for production or
operational delivery.

## Lease and version

`lease` protects active ownership: `holder`, a unique `token`,
`version_at_grant`, `acquired`, `expires`. Leases are granted **serially** by a
single grantor (the director, or the sole acting agent when working without
one) — a parallel peer never self-acquires the top-level lease it was
dispatched for. `version` increments on every state-changing write; a role
re-verifies `holder`/`token`/`version` before each write and stops before
touching product state on any mismatch, recording a `COLLISION` note in the
item's thread instead.

## Touch sets

`touches` is a claim, not a proof: repository paths, services, schemas, or
other exclusive resources this item expects to change. On handback, the actual
changed-path set is reconciled against the declared `touches`; an unexplained
expansion is either folded in (when non-conflicting) or routed back as a scope
question under `kai-core-scope-discipline`.

## Questions and review

`waiting_on_questions` holds only open blocking question IDs from the item's
thread; when an item first becomes `blocked` its prior state is copied to
`resume_state`. `review_requirements` lists the independent roles/kinds a
`product-change` or `operational` item must clear before `workflow-ship`;
`completed_reviews` records role, kind, evidence, verdict, and the exact
`change_ref` each review matched — only reviews matching the *current*
`change_ref` count.

## Asset expectation, targets, and evidence

Every item declares `artifact_expectation: owed | none` before `ready`.
`none` requires a reason. `owed` requires an asset class, durability,
completion authority, validity owner, and at least one exact
`artifact_targets` entry. Initiative targets default to the canonical
`kai/initiatives/<slug>/artifacts/...` locations defined in
`kai-core-workspace-conventions` and `.kai/CONVENTIONS.md`.

`context_artifacts` lists required inputs peers should read instead of
rediscovering context. Evidence and artifact paths are always exact and
workspace-root-relative — never session-state-relative or abbreviated with
`.../`. Full disposition, validity, freshness, revision, and supersession rules
come from `kai-core-asset-lifecycle`.

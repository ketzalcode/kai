---
type: work-item
id: area-plugins-fleet-observer-ux
title: Fleet-observer UX redesign — deferred intake record
initiative: null
milestone: "—"
delivery_class: knowledge
state: proposed
resume_state: null
priority: 900
owner: null
next_role: principal-product-manager
target: fleet-observer user experience
artifact_target: null
artifact_target_status: not applicable until the item is promoted and a home initiative exists
id_provenance: "ID assigned by the operator in the 2026-08-27-2113 second revision. Deliberately unaffiliated: this is a product-surface redesign, not plugin packaging (area-plugins) and not corpus governance (workspace-corpus-contract). Forcing it into either would create the catch-all that non-negotiable #3 forbids."
context_artifacts:
  - kai/coordination/threads/area-plugins-fleet-observer-ux.md
  - kai/coordination/threads/area-plugins-scope-brief.md
touches:
  - kai/coordination/items/area-plugins-fleet-observer-ux.md
  - kai/coordination/threads/area-plugins-fleet-observer-ux.md
depends_on:
  - item: area-plugins-taxonomy-round-2
    requires: completed
  - item: area-plugins-tool-allowlist-fix
    requires: shipped
waiting_on_questions: []
required_for_milestone: false
review_requirements: []
completed_reviews: []
change_ref: null
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-2113
---

## Outcome

The fleet-observer UX redesign has a durable intake record so it is not lost and
is not started early. **This item is deliberately not `ready`.** Its outcome
today is that it exists, is findable, and carries the trigger that reopens it.

## Deferral (steward, scope-brief A15)

- **Trigger to reopen:** the nine P0 concerns of the 2026-08-27-2113 operator
  revision are disposed **and** the plugin topology is locked
  (`area-plugins-taxonomy-round-2` accepted). Both typed `depends_on` edges above
  encode the two hardest parts of that trigger mechanically; the rest is the
  steward's judgment at the reopening pass.
- **Why deferred rather than dropped:** the operator explicitly said it *resumes*
  after the P0s. That is a scheduling statement, not a rejection.
- **Why unaffiliated:** it is neither packaging nor corpus governance. When it is
  promoted it needs a home — either a new initiative or an existing one whose
  mission genuinely covers it. Choosing that home is part of the reopening pass,
  not something to pre-decide now against a topology that is still moving.

## Grounded limit — this is an intake record, not a resumption

**No fleet-observer initiative, item, north star, or design artifact exists
anywhere in the corpus as of 2026-08-27** (verified by listing
`kai/coordination/items/`, `kai/coordination/threads/`, and
`kai/initiatives/`). The operator's "resumes" therefore has no prior kai record
to resume from. Whatever prior context exists is the operator's, and the first
act of the reopening pass is to ask for it rather than reconstruct it.

## What must happen before this becomes work

Not acceptance criteria — the promotion checklist for a future steward pass:

1. A **product brief** (`delivery_class: knowledge`) stating the user, the job,
   the outcome, and what must remain unchanged. There is no evidence in the
   corpus today of what is wrong with the current fleet-observer experience, and
   "redesign it" is a solution, not a need.
2. A **current product map** of the fleet-observer surface, since a redesign
   without one cannot name what stays the same.
3. A home initiative with a mission the work actually serves.
4. Only then: `principal-product-designer`, per the brief-then-design order.

## Evidence

- Filled if and when this is promoted.

---
type: work-item
id: area-plugins-scope-brief
title: PM scope brief — area-focused standalone plugins over an optional core
initiative: area-plugins
milestone: decisions-locked
delivery_class: knowledge
state: completed
resume_state: null
priority: 10
owner: null
next_role: principal-swe-architect
target: Scope, non-negotiables, and phase boundaries for the v1.0.4 -> area-plugin refactor
artifact_target: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-scope-brief.md
artifact_target_status: blocked-on-directory-creation; the durable scope decision is written to kai/coordination/threads/area-plugins-scope-brief.md (BRIEF 2026-08-27-1839) and is transcribed to the canonical target once one operator `mkdir` creates kai/initiatives/area-plugins/
context_artifacts:
  - kai/coordination/threads/area-plugins-scope-brief.md
  - kai/initiatives/pack-split/northstar.md
  - kai/initiatives/pack-split/director-summary.md
  - scripts/lib/pack-plan.mjs
  - scripts/lib/migration-doctor.mjs
  - .github/plugin/marketplace.json
touches:
  - kai/coordination/items/area-plugins-scope-brief.md
  - kai/coordination/threads/area-plugins-scope-brief.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements: []
completed_reviews: []
change_ref: null
version: 3
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1839
---

## Outcome

An authoritative product scope for the `area-plugins` initiative: what the
refactor includes, what it explicitly excludes, the phase boundaries that keep
each step independently shippable and reversible, and the typed decision
questions routed to architecture.

## Acceptance

- [x] The ten operator-settled directions are restated as scope and
      non-negotiables, not re-litigated.
- [x] Out-of-scope and deferred lists are explicit, including anything that
      would grow this into a content redesign of agents or skills.
- [x] Phase boundaries are named with the smallest safe sequence, each phase
      independently shippable, reversible, and releasable on its own version.
- [x] The `creative-video-director` placement question is framed for
      architecture with the evidence that bears on it, including the grounded
      fact that it is the sole referencer of the four `demo-*` skills.
- [x] Each architecture decision item is promoted `proposed -> ready` or
      explicitly held with a stated reason.

## Notes

Operator authorized the refactor and approved proceeding without pauses except
for an unresolved critical architecture or product decision.

**Environment limit (director, 2026-08-27-1820):** this session has no shell in
any agent, so `kai/initiatives/area-plugins/` cannot be created. The canonical
`artifact_target` above is recorded and unchanged; until one operator `mkdir`
runs, the durable record for this decision is
`kai/coordination/threads/area-plugins-scope-brief.md`. That is a real
coordination path, not a substitute workspace.

## Completion — 2026-08-27-1839 (principal-product-manager, steward)

All five acceptance criteria met. The durable scope decision is the
`BRIEF 2026-08-27-1839` packet in this item's thread.

**Delivered:** mission/vision one-liners; scope targets, keywords,
`out_of_scope`, and `deferred` (each deferral with a reopening trigger); 13
non-negotiable principles carrying the ten operator directions; 5 milestones
with outcome, acceptance, and the success measure each serves; 5 success
measures with grounded baselines and targets; 8 named critical operator
decision boundaries.

**Ordering ruling.** The `optional-core-contract` milestone lands **before**
the taxonomy split — contract-then-identity, reversible-before-irreversible,
and CI attribution. The proposed phase order was **revised**: `surface-rename`
also moves ahead of `area-taxonomy-split`, under the derived principle that no
new plugin identity is published under a marketplace name or an operating
contract already decided to change. Final order: `decisions-locked` ->
`optional-core-contract` -> `surface-rename` -> `area-taxonomy-split` ->
`migration-complete`.

**Binding reframing.** Fail-closed is relaxed for *loading* only, never for
*claims*. The optional-core record must name a replacement guarantee for every
place it is relaxed; "removed" is not an acceptable disposition.

**Promotion rulings.** `area-plugins-optional-core-architecture`
`proposed -> ready` (priority 20 -> 10); `area-plugins-taxonomy-decision`
`proposed -> ready` (priority 20); `area-plugins-migration-architecture` **held**
at `proposed` — its `depends_on area-plugins-taxonomy-decision requires:
completed` is genuinely unsatisfied, and that dependency is correct.

**Steward follow-ups requiring a shell (not blocking architecture):**
materialise `kai/initiatives/area-plugins/` with `northstar.md`,
`deliverables.md`, `log.md`, and `backlog.md` from the BRIEF packet, then
correct `kai/coordination/ACTIVE.md`, which still reads "No initiatives are
active" and was deliberately not edited because it is outside this item's
`touches` and cannot be made honest before the north star exists.

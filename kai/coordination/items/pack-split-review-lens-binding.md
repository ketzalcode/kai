---
type: work-item
id: pack-split-review-lens-binding
title: Decision — bind (or refuse to bind) the three review lenses on workflow-doc-review before the engineering tree is generated
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: knowledge
state: ready
resume_state: null
priority: 20
owner: null
next_role: principal-swe-architect
target: pack-split engineering-tree review-lens binding (architect caveat b / decomposition Open Question 1)
artifact_target: kai/initiatives/pack-split/artifacts/decisions/pack-split-review-lens-binding.md
context_artifacts:
  - kai/initiatives/pack-split/northstar.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/coordination/items/pack-split-release-12c-3-engineering.md
  - agents/workflow-doc-review.agent.md
  - scripts/lib/pack-plan.mjs
touches:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-review-lens-binding.md
depends_on: []
waiting_on_questions: []
required_for_milestone: false
review_requirements: []
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1523
---

## Outcome

A ratified, recorded answer to architect caveat **(b)** — whether
`review-dependencies`, `review-performance-scale` and `review-success-metrics`
are added to `workflow-doc-review`'s `**Inherits:**` line — with the exact file
list the engineering publish must change, so `pack-split-release-12c-3-engineering`
generates a tree from settled root bodies instead of regenerating after a late
decision.

## Acceptance

- [ ] The decision is recorded at `artifact_target`: **bind** or **do not bind**, with the reason.
      The decomposition's standing manager recommendation is *bind* (consistency + automatic
      placement); it is a recommendation, not a ratification.
- [ ] The consequence for `SKILL_OWNER_OVERRIDES` (`scripts/lib/pack-plan.mjs:101-118`) is stated
      explicitly: whether the three `review-*: 'engineering'` entries are removed, kept, or become
      redundant, and whether the partition invariants the self-test asserts —
      `orphans === overrides` and `unplaced === 0` — still hold under the chosen option.
- [ ] The exact file set the engineering publish must change is enumerated (at minimum
      `agents/workflow-doc-review.agent.md`, plus any `scripts/lib/pack-plan.mjs` override change),
      so that item's touch set is a claim the builder can verify rather than discover.
- [ ] It is stated whether the decision changes **any** pack other than `engineering`. If it does,
      that is a scope question routed to the steward before `12c-3` is dispatched, not absorbed.

## Evidence

- (to be filled) — the ratified decision artifact and the enumerated file set.

## Notes

- **Knowledge item: terminal state is `completed`.** No version, no release, no publish.
- **Not a milestone requirement.** It gates `pack-split-release-12c-3-engineering` through a typed
  `requires: completed` dependency; the milestone's closure mapping stays on the four release
  items. `required_for_milestone: false` is deliberate.
- **No independent review required.** The architect is the decider; the *implementation* of this
  decision is reviewed by the architect on `12c-3`'s exact ref, where it rides. A second reviewer
  on the decision itself would be ceremony.
- **Runs in parallel with `pack-split-release-12c-1-hardening`** — different owner, disjoint touch
  set (a decision artifact versus scripts, fixtures and CI). It has no upstream dependency and can
  be promoted in the same steward pass.
- **Why it is separated from the engineering publish (manager, 2026-08-27-1508).** The caveat says
  resolve before the engineering tree is *generated*. Ratifying it inside `12c-3`'s architecture
  review inverts that: the tree would already exist at the reviewed ref, and a "do not bind"
  verdict would force a regeneration of a 20-agent tree after review. Size S; it buys the largest
  tree a settled input.
- Grounding, captured read-only 2026-08-27 from `C:\src\kai`: `workflow-doc-review` is an
  `engineering` agent (`scripts/lib/pack-plan.mjs:76-84`); the three `review-*` skills are placed
  into `engineering` today by `SKILL_OWNER_OVERRIDES`, not by inheritance, so binding changes
  *how* they are placed, not *which* pack owns them.

### Steward pass 2026-08-27-1523 (`principal-product-manager`) — PROMOTED `proposed -> ready`

Promoted in the same pass as `pack-split-release-12c-1-hardening` and runs **in
parallel** with it: no upstream dependency, a different owner
(`principal-swe-architect` vs `principal-swe-infra`), and a disjoint touch set —
one decision artifact under `kai/initiatives/`, against scripts, fixtures and CI.
There is no touch conflict to resolve at dispatch.

- **Why now rather than at `12c-3`.** It is the only open decision left anywhere in
  the `12c` chain, and it sits on the largest tree. Ratifying it two releases early
  costs an S-sized decision; ratifying it late costs a regenerated 20-agent tree
  after review. Doing it now also means the *engineering* publish carries exactly one
  kind of risk — publish protocol — like the two either side of it.
- **Scope boundary, stated so it is not discovered.** This item decides and records;
  it changes **no** agent body, override table or generator behaviour. The
  implementation rides `pack-split-release-12c-3-engineering`'s ref and is reviewed
  there by the same architect. If the ratified answer turns out to change **any** pack
  other than `engineering`, or to require a new CI assertion or a partition re-lock,
  that is a scope question routed to the steward **before** `12c-3` is dispatched —
  acceptance line 4 already says so, and it is the line most likely to be skipped.
- **Deliberately not a milestone requirement.** `required_for_milestone: false` stands:
  it is enforced as a typed `requires: completed` dependency of `12c-3`, and the
  milestone's closure mapping stays on the four release items. A decision artifact is
  not a shipped deliverable, and padding the mapping with it would make the milestone
  look wider than it is.
- **Promotion:** `state proposed -> ready`, `priority 20` (unchanged — parallel, off the
  critical path; `12c-1` at 10 is the head), `next_role principal-product-manager ->
  principal-swe-architect`, `owner` and `lease` clear, v1 -> v2. Terminal state is
  `completed`: no version, no release, no publish.
- The decomposition's standing recommendation is *bind*. It stays a recommendation —
  the steward is not ratifying it here, and the architect may refuse it with reasons.

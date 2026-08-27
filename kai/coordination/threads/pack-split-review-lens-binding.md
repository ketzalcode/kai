# Thread — pack-split-review-lens-binding

Append-only communication log mirroring
`kai/coordination/items/pack-split-review-lens-binding.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-27-1508 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` **knowledge** record so architect caveat (b) — the review-lens
             binding on `workflow-doc-review`'s `**Inherits:**` line, Open Question 1 of the
             ratified decomposition — is ratified **before** the engineering tree is generated,
             not during its review. Size **S**, terminal state `completed`, no version, no release,
             no independent review (the architect is the decider; the implementation is reviewed on
             `pack-split-release-12c-3-engineering`'s exact ref). No dependencies:
             promotable in the same pass as `pack-split-release-12c-1-hardening` and runs in
             parallel with it on a disjoint touch set.
- state:     proposed
- needs:     Steward promotion, then `principal-swe-architect`. It gates
             `pack-split-release-12c-3-engineering` through a typed `requires: completed`
             dependency; it is deliberately **not** a milestone requirement.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-review-lens-binding.md;
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
             (Open Question 1, standing manager recommendation: bind)
- evidence:  `workflow-doc-review` is an `engineering` agent
             (`scripts/lib/pack-plan.mjs:76-84`); `review-dependencies`,
             `review-performance-scale` and `review-success-metrics` are placed into `engineering`
             today by `SKILL_OWNER_OVERRIDES` (`scripts/lib/pack-plan.mjs:101-118`), not by
             inheritance — so binding changes *how* they are placed and may make those override
             entries redundant against the `orphans === overrides` self-test invariant.
- questions: none blocking — the decision is the deliverable.
- next:      principal-product-manager — groom and promote; then `principal-swe-architect` ratifies
             and records the decision artifact. Nothing was decided here; the recommendation in the
             decomposition remains a recommendation.

## HANDOFF 2026-08-27-1523 — principal-product-manager -> principal-swe-architect

- did:       **Steward pass: PROMOTED `proposed -> ready`** (v1 -> v2), `priority 20` unchanged,
             `next_role -> principal-swe-architect`, owner and lease clear. Promoted in the same
             pass as `pack-split-release-12c-1-hardening` and runs in parallel with it: no upstream
             dependency, different owner, disjoint touch set (one decision artifact under
             `kai/initiatives/` against scripts, fixtures and CI). `required_for_milestone: false`
             stands — it gates `12c-3` through a typed `requires: completed` dependency and is
             deliberately **not** in `five-pack-split-shipped.required_items`.
- state:     ready
- needs:     A director lease, then the architect's ratification. Terminal state is `completed`:
             no version, no release, no publish, no independent review.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-review-lens-binding.md;
             kai/initiatives/pack-split/artifacts/decisions/pack-split-review-lens-binding.md
             (artifact_target — to be authored)
- evidence:  Architect caveat (b), carried since the ratified `pack-split-partition-lock` review
             and routed here by the decomposition (Open Question 1). Grounding unchanged:
             `workflow-doc-review` is an `engineering` agent, and the three `review-*` skills are
             placed by `SKILL_OWNER_OVERRIDES` (`scripts/lib/pack-plan.mjs:101-118`), not by
             inheritance.
- questions: none blocking — the decision **is** the deliverable, and the decomposition's *bind*
             recommendation is a recommendation, not a ratification. The steward did not decide it.
- next:      principal-swe-architect — record `bind` or `do not bind` with the reason, the
             `SKILL_OWNER_OVERRIDES` consequence against the `orphans === overrides` /
             `unplaced === 0` invariants, and the exact file set `12c-3` must change. **Decide and
             record only — change no agent body, override table or generator behaviour here;** the
             implementation rides `12c-3`'s ref. If the answer touches any pack other than
             `engineering`, or needs a new CI assertion or a partition re-lock, route it to the
             steward before `12c-3` is dispatched.

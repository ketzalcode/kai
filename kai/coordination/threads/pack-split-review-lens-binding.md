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

## HANDOFF 2026-08-27-1552 — principal-swe-architect -> director-chief-of-staff

- did:       **RATIFIED caveat (b): DO NOT BIND** — disposition **Endorse**. The three lenses are
             *not* added to `workflow-doc-review`'s `**Inherits:**` line; they stay placed into
             `kai-engineering` by `SKILL_OWNER_OVERRIDES` and stay dispatched at run time via the
             `skill` tool. The decomposition's standing *bind* recommendation is **refused, with
             reasons**. Self-granted the lease (sole active worker, no director in the loop),
             wrote the decision artifact, closed all four acceptance lines, released the lease.
             **Changed nothing outside `touches`:** no agent body, no override table, no
             generator, no CI, no doc, no command run.
- state:     completed  (v2 -> v4; v3 was the self-grant; lease cleared; owner clear)
- needs:     Nothing from this role. One steward hygiene edit before `12c-3` is dispatched — see
             `questions`/`next`. `12c-3`'s typed `requires: completed` dependency is satisfied.
- workspace: C:\src\kai
- artifacts: kai/initiatives/pack-split/artifacts/decisions/pack-split-review-lens-binding.md;
             kai/coordination/items/pack-split-review-lens-binding.md
- evidence:  Read-only 2026-08-27 from `C:\src\kai`.
             **Decisive:** `kai/initiatives/pack-split/northstar.md:31` — `out_of_scope`
             *"Rewriting or re-scoping agent and skill content; this initiative relocates and
             guards contracts, it does not redesign them."* An `**Inherits:**` line is the agent's
             binding contract, so binding is agent-content redesign inside a publish release.
             **Placement is identical under both options** (`kai-engineering`), so `bind` buys no
             placement change — only a change in *how* placement is derived
             (`scripts/lib/pack-plan.mjs:375-395`).
             **The stated benefit is not delivered:** binding 3 leaves `workflow-doc-review`
             inheriting 7 of 9 lenses and dispatching 2, because `review-security-privacy` and
             `review-rollout-operability` bind to `principal-security` /
             `principal-privacy-compliance` / `principal-sre` / `workflow-ship` instead.
             **Overrides stay, byte-unchanged** (`pack-plan.mjs:115-117`): `orphans === overrides`
             holds at 9 = 9, `unplaced === 0` holds, `namespaceErrors` green, and the
             `scripts/pack-preview.mjs:440-443` assertion stays truthful *and correctly labelled*
             (under *bind* its "engineering **orphan** disposition" label would have silently
             become a test of inheritance).
             **The lenses already fire:** `DISPATCH_ENTRY` (`pack-plan.mjs:814`) matches the
             `## The dimension skills` list, so `collectReferences` already records a validated
             orchestrated engineering→engineering reference for all three
             (`scripts/pack-preview.mjs:713` asserts zero reference errors live).
             **No command was run** — this is the no-change branch, so the repo's existing green
             CI state is itself the evidence.
- questions: none. **No operator decision remains and nothing is escalated.** Acceptance line 4's
             steward trigger did **not** fire: the decision changes **no pack at all**, needs no
             new CI assertion and no partition re-lock.
- next:      director-chief-of-staff — this item is closed. Two things to carry, neither a
             decision: (1) route a steward (`principal-product-manager`) edit to drop
             `agents/workflow-doc-review.agent.md` from `pack-split-release-12c-3-engineering`'s
             `touches` before it is dispatched — it is now a false claim of intent to modify a
             root agent body, and `touches` is the parallel-safety claim; keep
             `scripts/lib/pack-plan.mjs` there, it still changes for `COMMITTED_PACKS`.
             (2) `12c-3`'s named risk — *"the one place in `12c` where a decision changes generator
             behavior and not just content"* — is **retired**; that release now carries exactly one
             kind of risk, publish protocol, like the two either side of it. The implementation
             obligation for `12c-3` is an **assertion of absence**: zero diff to
             `agents/workflow-doc-review.agent.md` and zero diff to `SKILL_OWNER_OVERRIDES` at its
             reviewed `change_ref`.

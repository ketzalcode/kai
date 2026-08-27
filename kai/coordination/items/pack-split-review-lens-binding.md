---
type: work-item
id: pack-split-review-lens-binding
title: Decision — bind (or refuse to bind) the three review lenses on workflow-doc-review before the engineering tree is generated
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: knowledge
state: completed
resume_state: null
priority: 20
owner: null
next_role: null
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
version: 5
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27T23:45:12Z
---

## Outcome

A ratified, recorded answer to architect caveat **(b)** — whether
`review-dependencies`, `review-performance-scale` and `review-success-metrics`
are added to `workflow-doc-review`'s `**Inherits:**` line — with the exact file
list the engineering publish must change, so `pack-split-release-12c-3-engineering`
generates a tree from settled root bodies instead of regenerating after a late
decision.

## Acceptance

- [x] The decision is recorded at `artifact_target`: **bind** or **do not bind**, with the reason.
      The decomposition's standing manager recommendation is *bind* (consistency + automatic
      placement); it is a recommendation, not a ratification.
      → **DO NOT BIND** (disposition **Endorse**). Reasons: the initiative's own `out_of_scope`
      line (`northstar.md:31`) forbids redesigning agent content; no force pulls toward bind
      today; the "consistency" benefit is not delivered (binding 3 leaves 7-of-9 inherited,
      2 dispatched); it fights the agent's "only fire the dimensions that apply" rule.
- [x] The consequence for `SKILL_OWNER_OVERRIDES` (`scripts/lib/pack-plan.mjs:101-118`) is stated
      explicitly: whether the three `review-*: 'engineering'` entries are removed, kept, or become
      redundant, and whether the partition invariants the self-test asserts —
      `orphans === overrides` and `unplaced === 0` — still hold under the chosen option.
      → **KEPT, byte-unchanged** (`pack-plan.mjs:115-117`); not redundant — they are the table's
      intended population. `orphans === overrides` holds at **9 = 9**; `unplaced === 0` holds;
      `namespaceErrors` stays green (no bare-named skill promoted to core).
- [x] The exact file set the engineering publish must change is enumerated (at minimum
      `agents/workflow-doc-review.agent.md`, plus any `scripts/lib/pack-plan.mjs` override change),
      so that item's touch set is a claim the builder can verify rather than discover.
      → **The set is EMPTY.** Verified as an assertion of absence: zero diff to
      `agents/workflow-doc-review.agent.md` and zero diff to `SKILL_OWNER_OVERRIDES` at `12c-3`'s
      reviewed `change_ref`. (`scripts/lib/pack-plan.mjs` still changes there — `COMMITTED_PACKS`
      gains `'engineering'` — for an unrelated reason.)
- [x] It is stated whether the decision changes **any** pack other than `engineering`. If it does,
      that is a scope question routed to the steward before `12c-3` is dispatched, not absorbed.
      → **It changes NO pack at all** — not even `engineering`. This trigger **did not fire**:
      no scope question, no new CI assertion, no partition re-lock. The locked partition is
      consumed exactly as ratified.

## Evidence

- **Ratified decision artifact:** `kai/initiatives/pack-split/artifacts/decisions/pack-split-review-lens-binding.md`
  (`principal-swe-architect`, 2026-08-27-1547, disposition **Endorse / do not bind**).
- **File set the engineering publish must change for this reason: empty.** Enumerated in the
  artifact's *Implementation obligations* section as a verifiable assertion of absence.
- Grounding read read-only 2026-08-27 from `C:\src\kai` (no file changed outside `touches`):
  - `scripts/lib/pack-plan.mjs:115-117` — the three `review-*: 'engineering'` override entries.
  - `scripts/lib/pack-plan.mjs:375-395` — `planPacks` inheritance-then-override placement;
    `:381` promotes any skill inherited from >1 pack to `core`.
  - `scripts/lib/pack-plan.mjs:1465-1487` — `partitionErrors` enforces the set equality
    `orphans === overrides` in both directions (four arms, each proven by name at
    `scripts/pack-preview.mjs:1008-1023`).
  - `scripts/lib/pack-plan.mjs:1492-1511` — `namespaceErrors`: core may provide `kai-core-*` only.
  - `scripts/lib/pack-plan.mjs:814` `DISPATCH_ENTRY` + `:938` `collectReferences` — the three
    lenses already carry a validated **orchestrated** engineering→engineering reference from
    `workflow-doc-review`'s `## The dimension skills` list; `referenceErrors` resolves them, and
    `scripts/pack-preview.mjs:713` asserts zero reference errors over the live corpus.
  - `scripts/pack-preview.mjs:436-443` — the invariant assertions; all three stay true **and
    correctly labelled** under this verdict (they would have needed re-pointing under *bind*).
  - `agents/workflow-doc-review.agent.md:7` (four lenses inherited), `:92-100` (nine dispatched),
    hard rule 2 and the first anti-pattern; `skills/review-*/SKILL.md` — none `user-invocable`,
    none declares `requires_tools`.
  - `kai/initiatives/pack-split/northstar.md:31` — the `out_of_scope` line that decides it.
  - `scripts/generate-catalog.mjs` — groups skills by a manual category map, never reads
    `**Inherits:**`, so `npm run docs:check` is unaffected either way.
- **No command was run.** This is the no-change branch, so the repository's existing green CI
  state (`npm test` includes `pack-preview --self-test`, `--gate all`, `--check`) is itself the
  evidence that the endorsed shape passes. No new run is needed to justify the decision.

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

### Architect ratification 2026-08-27-1552 (`principal-swe-architect`) — RATIFIED, `ready -> completed`

**Verdict: DO NOT BIND.** Disposition **Endorse** — the current shape already fits the forces, so
the smallest structural change that resolves them is *none*. Recorded at `artifact_target`.
The manager's standing *bind* recommendation is **refused, with reasons**, exactly as the steward
pass permitted.

- **Why.** (1) `northstar.md:31` puts *"rewriting or re-scoping agent and skill content"*
  out of scope — an `**Inherits:**` line is the agent's binding contract, not packaging metadata,
  and changing it inside a publish release is the one thing this initiative says it does not do.
  (2) No force pulls toward `bind` today: nothing is broken, dangling or ambiguous. (3) The
  "consistency" benefit is **not delivered** — binding three leaves `workflow-doc-review`
  inheriting 7 of 9 lenses and dispatching 2, because `review-security-privacy` and
  `review-rollout-operability` are bound to *other* engineering agents that hold them as standing
  contracts. The rule that actually explains the corpus is *inherited by the role that always
  applies it, dispatched by the router that sometimes applies it*. (4) The "automatic placement"
  benefit is already bought: `partitionErrors` guards the override table in both directions with
  four named arms, so it cannot rot silently.
- **Placement is identical under both options** — `kai-engineering`, exactly as the partition lock
  ratified. Binding would only change *how* placement is derived and what the host loads into one
  agent's context.
- **Nothing changes anywhere.** No pack, no agent body, no override table, no generator, no CI,
  no doc. `orphans === overrides` stays 9 = 9; `unplaced === 0` stays; `namespaceErrors` stays
  green. Acceptance line 4's steward trigger **did not fire**.
- **Risk retired for `12c-3`:** the Notes risk *"the one place in `12c` where a decision changes
  generator behavior and not just content"* is discharged. `12c-3` now carries exactly one kind of
  risk — publish protocol — like the releases either side of it.
- **One routed follow-up, steward hygiene not a decision:** drop
  `agents/workflow-doc-review.agent.md` from `pack-split-release-12c-3-engineering`'s `touches`
  (it is now a false claim of intent to modify a root agent body, and `touches` is the
  parallel-safety claim). Keep `scripts/lib/pack-plan.mjs` — it still changes there, for
  `COMMITTED_PACKS`.
- **No operator decision remains.** Nothing escalated.
- **Closure:** `state ready -> in-progress -> completed`, v2 -> v4 (v3 was the self-grant),
  lease acquired and released within this run, `owner` clear,
  `next_role principal-swe-architect -> director-chief-of-staff`. Knowledge item: no version,
  no release, no publish, no independent review. `12c-3`'s typed
  `requires: completed` dependency on this item is now **satisfied**.

### Steward reconciliation 2026-08-27-1645 (`principal-product-manager`)

Cleared the fulfilled coordination handoff (`next_role -> null`). The item
remains `completed`; the ratified **DO NOT BIND** decision, empty implementation
file set, evidence, and downstream dependency satisfaction are unchanged.

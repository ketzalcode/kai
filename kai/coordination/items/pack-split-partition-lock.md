---
type: work-item
id: pack-split-partition-lock
title: Lock the five-pack partition (authoritative docs)
initiative: pack-split
milestone: partition-lock
delivery_class: knowledge
state: completed
resume_state: null
priority: 10
owner: null
next_role: director-chief-of-staff
target: pack partition — kai-core plus department pack boundaries
artifact_target: kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
context_artifacts:
  - kai/initiatives/pack-split/northstar.md
  - docs/proposals/pack-architecture.md
  - scripts/pack-preview.mjs
  - scripts/generate-catalog.mjs
touches:
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews:
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: fd44f4fdf4a2b0c1e5e70f8369bd2a0b45a8224e
    verdict: ratified
    date: 2026-08-24-1947
    summary: Ratified — 56-agent partition, §5 orphan dispositions (8 moves plus fleet-observation kept in core), and §7 dependency direction independently re-derived from the on-disk roster and confirmed; two flagged caveats are non-blocking and route to dependency-guarantees.
change_ref: fd44f4fdf4a2b0c1e5e70f8369bd2a0b45a8224e
version: 9
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-24-1959
---

## Outcome

An authoritative, reviewable partition-lock document that records the agreed
five-pack partition (core plus engineering, product, gtm, personal) — assigning
every agent and every skill to exactly one owning pack — so the migration has a
single reference to check against and the boundary stops being re-derived from a
script on each PR.

This is a **planning / knowledge** item. It is docs-only: it changes no plugin
behaviour and moves no files. It **is** required for the `partition-lock`
milestone — that milestone's entire outcome is an authoritative, validated
partition record, so this knowledge artifact is the deliverable that closes it
(closure state: `completed`). That is the narrow case where a knowledge item is
milestone-required: the milestone explicitly requires this knowledge output. It
still proves no *product* delivery — the build and ship milestones do that.

## Acceptance

- [x] Lists all 56 agents by owning pack (core=7, engineering=20, product=9,
      gtm=11, personal=9) and every skill by its single provider, with the
      core-shared skills called out. — artifact §3, §4 (15 core-shared vs 7
      core-internal split out explicitly).
- [x] Matches the `node scripts/pack-preview.mjs --all` self-test invariant —
      56 of 56 agents assigned, none claimed by two packs, and no skill provided
      by both core and a pack — demonstrated by diffing the recorded partition
      against the roster on disk, not by eye. — artifact §3.6 (agent diff), §4
      (50-skill accounting), §8 (self-test 16/16). NB: §8 output is reconstructed
      from the script algorithm + on-disk roster (no shell in the authoring
      environment); the architect re-runs both commands live to confirm.
- [x] Gives each skill the `node scripts/pack-preview.mjs --all` self-test
      reports as inherited by no agent — the live orphan set (9:
      `create-product-demo`, `demo-capture`, `demo-narrate`, `demo-zoom`,
      `fleet-observation`, `onboard-to-codebase`, `review-dependencies`,
      `review-performance-scale`, `review-success-metrics`) — an explicit
      keep-in-core or move decision with a one-line rationale each. — artifact §5
      (keep 1: `fleet-observation`; move 8). Decisions recorded; architect
      ratification pending.
- [x] Records the naming decision as it applies to skill identity — the
      `kai-core-*` owned-namespace prefix, with exactly one version-pinned skill
      (`kai-core-contract-v1`), and no taxonomy segment in names. — artifact §6.
- [x] Output is documentation only, at the artifact target; no agent, skill,
      script, or `plugin.json` behaviour is changed. — only this file + this item
      + the thread were written.

## Evidence

- **Artifact (authored, on disk):**
  `kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md`
  (~30.4 KB).
- **Agent partition (`[observed]`):** 56 `agents/*.agent.md` on disk mapped 1:1 to
  `PACKS` — core 7, engineering 20, product 9, gtm 11, personal 9 = 56; 0
  unassigned, 0 double-claimed (artifact §3, §3.6).
- **Skill → provider (`[observed]`):** 50 skill dirs = 22 core-provided (all
  `kai-core-*`; 15 core-shared across the boundary + 7 core-internal) + 19
  pack-owned (engineering 11, product 3, gtm 2, personal 3) + 9 orphan
  (artifact §4).
- **Reconstructed `--self-test`:** PASS, 16/16 checks (incl. "56 of 56",
  "unassigned: none", "no skill provided by both core and a pack"). Reconstructed
  `--all`: `kai-core 7 / engineering 20 / product 9 / gtm 11 / personal 9`;
  `core skills: 22 (+9 inherited by nobody)`; engineering owns 11, product 3,
  gtm 2, personal 3 (artifact §8). Cross-checked against the proposal's
  independently-reported run (`docs/proposals/pack-architecture.md`, Phase 2/3:
  "7 agents, 22 core skills + 9 unplaceable … 56 of 56").
- **Orphan dispositions (`[inferred]`, for architect ratification):** keep-in-core
  1 — `fleet-observation`; move 8 — `personal` +4 (`create-product-demo`,
  `demo-capture`, `demo-narrate`, `demo-zoom`), `engineering` +4
  (`onboard-to-codebase`, `review-dependencies`, `review-performance-scale`,
  `review-success-metrics`). Grounded in body refs: `creative-video-director`
  names the demo skills; `workflow-doc-review` names the three review lenses
  (artifact §5).
- **Naming decision (`[observed]`):** `kai-core-*` owned prefix (22 = the whole
  core-provided set); exactly one version-pinned skill `kai-core-contract-v1`
  (the preflight probe, script-synthesised today); no taxonomy segment in names —
  classification lives in `generate-catalog.mjs` `CATEGORIES` (artifact §6).
- **Dependency direction (`[observed]` for claims 1–2; `[product-capability]` for
  claim 3):** core inherits only core-provided skills → depends on nothing; packs
  inherit only core-or-own-local → no pack→pack edge; 15 shared skills resolve
  from core across the boundary (host Finding 2, measured) — artifact §7.
- **Reconciliation:** live roster = 50 skill dirs; proposal's "49 skills / ~13.5k
  tokens" is the earlier baseline (token figure cited as historical); live governs
  (artifact §10).

### Verification status (remaining before closure)

1. **`change_ref` minted (2026-08-24-1938).** `@operator` ran the mint + live
   verification from repo root `C:\src\kai` — the answer to
   `Q-pack-split-partition-lock-01` (thread ANSWER/HANDOFF 2026-08-24-1938).
   Review-binding object: `fd44f4fdf4a2b0c1e5e70f8369bd2a0b45a8224e` — a dangling
   `git stash create` object built by staging **only** the canonical artifact,
   then resetting the index; the worktree artifact remains unstaged (no branch,
   commit-on-branch, tag, or release). Live `pack-preview.mjs` output equals the
   writer's reconstructed §8 numbers bit-for-bit (self-test 16/16; agents
   7/20/9/11/9 = 56; 22 core-provided; 9 orphans; pack-owned 11/3/2/3). Item moved
   `blocked -> in-review`; the required review is dispatched.
2. **`principal-swe-architect` (`independent-architecture`) ratification** of the
   §5 dispositions and §7 dependency-direction claims, and a live re-run of the
   two `pack-preview.mjs` commands to confirm §8 — the item's single required
   review.
3. Owner (`principal-product-manager`) accepts and moves to `completed` after (1)
   and (2).

## Notes

- Recommended executor once groomed: `principal-technical-writer` (docs
  artifact). If the steward judges the partition an open **architecture
  decision** rather than a recording of the already-enforced partition, route it
  to `principal-swe-architect` and move the artifact to
  `kai/initiatives/pack-split/artifacts/decisions/` instead — that reassignment
  is the steward's call.
- `next_role` is `principal-product-manager` because the item is `proposed`: the
  steward confirms scope, sets the review contract, prioritizes, and promotes it
  to `ready` before it is dispatched to an executor.

- **Steward-groomed 2026-08-24-1831 (promoted to `ready`).** Scope confirmed
  against repository evidence. The steward's call on the executor/architecture
  question above: this is a *recording of the already-enforced agent partition*
  (the `PACKS` constant is enforced disjoint by the `--self-test`) plus a
  bounded set of genuine decisions (the orphan-skill dispositions and the
  confirmation that dependency direction holds). So `principal-technical-writer`
  executes at the `docs/` target, and one independent review —
  `principal-swe-architect` (`independent-architecture`) — ratifies the
  orphan-skill dispositions and the dependency-direction claim against the
  staged `change_ref` before the owning role accepts and moves it to
  `completed`. Flipped `required_for_milestone: true` (this is the
  `partition-lock` milestone's required knowledge deliverable), priority raised
  to run first, and `next_role` set to the executor for the director to
  dispatch. No generator or code work starts until this item is `completed`.

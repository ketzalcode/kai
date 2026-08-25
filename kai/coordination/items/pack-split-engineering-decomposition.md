---
type: work-item
id: pack-split-engineering-decomposition
title: Decompose the pack-split build & ship milestones into sequenced items
initiative: pack-split
milestone: dependency-guarantees
delivery_class: knowledge
state: completed
resume_state: null
priority: 10
owner: null
next_role: director-chief-of-staff
target: pack-split build/ship delivery decomposition
artifact_target: kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
context_artifacts:
  - kai/initiatives/pack-split/northstar.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - docs/proposals/pack-architecture.md
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - scripts/generate-catalog.mjs
touches:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
depends_on:
  - item: pack-split-partition-lock
    requires: completed
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
updated: 2026-08-24-2013
---

## Outcome

A steward-accepted engineering decomposition that turns the corrected
`dependency-guarantees`, `first-pack-extracted`, and `five-pack-split-shipped`
milestones into sized, sequenced, parallel-aware `proposed` work-item records —
consuming the **locked** partition — so the steward can groom and promote them
milestone-by-milestone. This is the initiative's `principal-swe-manager`
decomposition touchpoint under `kai-core-initiative-stewardship`: the steward
decides *what's next*, the manager decides *how it's sliced*. It builds nothing.

It carries the operator-approved corrections (already reflected in the milestone
`required_items`) into concrete item boundaries and their PR order:

- **dependency-guarantees:** `pack-split-preflight-compat` (combined fail-closed
  preflight + version-compat, in each pack agent body, CI byte-pinned),
  `pack-split-degraded-refusal` (one canonical refusal block copied per pack,
  CI-pinned), `pack-split-crosspack-validator` (cross-pack reference validation
  across **all three firing paths** — inherited, user-invoked, orchestrated —
  plus non-markdown assets and **hooks assigned exactly once**, wired into the
  **multi-manifest** validate/release gates), `pack-split-ci-partition-checks`
  (the `--all` self-test plus collision / partial-install / version-skew arms
  wired as **real CI gates**).
- **first-pack-extracted:** `pack-split-generated-pack-trees` (generate the
  committed-but-unpublished department trees from root as the single source of
  truth), `pack-split-migration-doctor` (verifiable uninstall-first,
  coexistence-refused, existing-`.kai`-**workspace migration**, fresh-session
  notice), `pack-split-host-gates` (macOS + cloud + real install order +
  marketplace-vs-direct + fresh-session verification evidence — closes
  `completed`), `pack-split-first-department` (one department proven installable
  over required core).
- **five-pack-split-shipped:** `pack-split-onboarding-installer` (honest guided
  installer), `pack-split-release-12a`, `pack-split-release-12b`,
  `pack-split-release-12c` (the **staged 12a/12b/12c** flip that publishes the
  five packs, retires the published monolith plugin, and cuts `1.0.0` only after
  the phase-3 host gates pass).

## Acceptance

- [ ] Every `required_items` ID named on the `dependency-guarantees`,
      `first-pack-extracted`, and `five-pack-split-shipped` milestones has a
      corresponding `proposed` work-item record with outcome, acceptance,
      `delivery_class`, typed `depends_on`, `touches`, `artifact_target`, and
      `review_requirements`.
- [ ] Sizing, sequencing, and parallelization are recorded with rationale, and
      the PR order preserves the non-negotiables — root stays source of truth
      (generate-not-move), uninstall-first / coexistence-forbidden, one
      department at a time, groundwork on `0.x`, `1.0.0` only at the staged flip.
- [ ] The plan consumes the locked partition and does not re-derive it; any
      partition change is routed back to the steward, not decided here.
- [ ] No generator, agent-body, CI, or marketplace change is made by this item —
      it produces the decomposition record and the `proposed` item records only.

## Evidence

- **Decomposition record (authored, on disk):**
  `kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md`
  (~36 KB) — 14 sized/sequenced workstreams, critical path, versioning & closure table,
  proposed `required_items` mapping, two scope negotiations, four open questions.
- **`proposed` item records created (14 = 12 required IDs + 2 manager splits):**
  `pack-split-generator-gates` (split — foundation), `pack-split-host-semantics-spike`
  (spike — de-risk), `pack-split-crosspack-validator`, `pack-split-preflight-compat`,
  `pack-split-degraded-refusal`, `pack-split-ci-partition-checks`,
  `pack-split-generated-pack-trees`, `pack-split-migration-doctor`,
  `pack-split-first-department`, `pack-split-host-gates`, `pack-split-onboarding-installer`,
  `pack-split-release-12a`, `pack-split-release-12b`, `pack-split-release-12c` — each with a
  mirrored thread carrying a creation HANDOFF.
- **Locked partition consumed, not re-derived:** the plan cites §3–§7 of the partition-lock
  artifact and routes the review-lens binding (caveat b) to `principal-swe-architect`; no
  partition change was made.
- **Boundary respected:** no agent, skill, script, `plugin.json`, CI, or marketplace change;
  no branch/commit/PR/merge/tag/release; no external host gate executed. Only this
  decomposition, the 14 item+thread pairs, and the coordination/initiative records were written.

### Acceptance self-check (manager, before steward handoff)

- [x] Every `required_items` ID on the three milestones has a corresponding `proposed` record
      with outcome, acceptance, `delivery_class`, typed `depends_on`, `touches`,
      `artifact_target`, and `review_requirements`.
- [x] Sizing, sequencing, and parallelization recorded with rationale; the PR order preserves
      generate-not-move, uninstall-first/coexistence-forbidden, one department at a time,
      groundwork on `0.x`, and `1.0.0` only at the staged 12a/12b/12c flip.
- [x] The plan consumes the locked partition and does not re-derive it; the review-lens binding
      is routed to the architect, not decided here.
- [x] No generator, agent-body, CI, or marketplace change made by this item — decomposition
      record + `proposed` records only.

## Notes

- **Gated.** `depends_on: pack-split-partition-lock (completed)`. It stays
  `proposed` — the steward promotes it to `ready` only after the partition lock
  closes, so no build item can be sized against an unlocked partition, and no
  code work can start before it. Sizing large/parallel work is explicitly the
  manager's call, not the steward's.
- The steward reviews and accepts the decomposition when grooming the resulting
  items; it carries no independent `review_requirements` of its own.

- **Steward-promoted 2026-08-24-1959 (`proposed -> ready`).** The gate is
  satisfied — `pack-split-partition-lock` is `completed` (accepted by the owning
  role, `independent-architecture` review ratified against
  `change_ref fd44f4f…`), so the partition this decomposition consumes is locked.
  `principal-product-manager` (steward) promoted this item to `ready` at priority
  10 (it is now the single next executable action for the initiative),
  `next_role: principal-swe-manager`, version 1 -> 2. Produce the decomposition
  record and one `proposed` item record per `required_items` ID on the three
  downstream milestones; do **not** re-derive or alter the locked partition (route
  any needed partition change back to the steward as a question).

### Architect caveats carried from partition-lock (address in this decomposition)

Three non-blocking caveats from the ratified `independent-architecture` review of
`pack-split-partition-lock` (none is a partition defect; each is a downstream
behaviour change to slot into the item records this pass creates):

- **(a) Rename `fleet-observation` -> `kai-core-fleet-observation`** under
  `dependency-guarantees` — **forced, not optional**: keeping it in core makes it
  the one core-provided skill without the `kai-core-*` prefix, so the CI prefix
  check fails until it is renamed. Place this required rename in the
  `dependency-guarantees` item set (e.g. `pack-split-ci-partition-checks` /
  namespace enforcement). Its placement in `core` is ratified and unchanged.
- **(b) Decide whether to bind the three review lenses**
  (`review-dependencies`, `review-performance-scale`, `review-success-metrics`)
  on `workflow-doc-review`'s `**Inherits:**` line. Engineering (the pack owner) is
  stable either way; this changes the skill's firing path (inherited vs composed),
  not its owner. Record the decision in the decomposition.
- **(c) Adopt the explicit asset-ownership rule** in
  `pack-split-generated-pack-trees`: a non-markdown asset (e.g.
  `scripts/demo-*.mjs`, audio) travels with the sole skill that invokes it; any
  asset invoked across more than one pack promotes to core (mirroring
  `planPacks()`). State this rule explicitly so generated pack trees place assets
  deterministically.

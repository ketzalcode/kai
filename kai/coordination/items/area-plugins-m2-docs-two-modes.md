---
type: work-item
id: area-plugins-m2-docs-two-modes
title: Document the two modes, the upgrade transition, and each changed gate's new assertion
initiative: area-plugins
milestone: optional-core-contract
delivery_class: knowledge
state: ready
resume_state: null
priority: 80
owner: null
next_role: principal-technical-writer
target: docs — the two modes and the upgrade
artifact_target: null
context_artifacts:
  - kai/coordination/threads/area-plugins-m2-decomposition.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - docs/getting-started.md
  - docs/reference/plugin-structure.md
touches:
  - docs/getting-started.md
  - docs/reference/plugin-structure.md
depends_on:
  - item: area-plugins-m2-mode-selection
    requires: shipped
  - item: area-plugins-m2-standalone-proof
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-infra
    kind: doc-review
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1944
---

## Outcome

A reader of the published docs can tell which mode they are in, what standalone
mode may and may not do, how the upgrade to full mode happens, and what each
changed CI gate now asserts.

## Acceptance

- [ ] `docs/getting-started.md` describes installing a department pack **without**
      `kai-core` as a supported path, and states plainly what standalone mode does
      not do: no durable coordination, no fleet visibility, no leases, no
      handoffs, no shipped-state claims, no initiative artifacts, no review or
      approval records.
- [ ] The **upgrade transition** is documented exactly as ruled: installing core
      activates full mode **in a fresh session only**; there is no in-session
      promotion; prior standalone scratch files are left in place and are never
      imported, never cited as prior work, and never counted as evidence.
- [ ] `docs/reference/plugin-structure.md` documents the **three-block chain**
      (mode -> standalone -> degraded), that core agents carry none of the three,
      and that the blocks are injected per agent body rather than inherited —
      including the circularity reason.
- [ ] **Each changed gate's new assertion is documented**, satisfying that
      milestone-2 acceptance line: `--gate partition` (+`CLAIM_SKILLS` core-only
      and the onboarding co-location), `--gate partial-install` (arm B),
      `--gate version-skew` (inverted `no-core` arm, new `partial-core` arm,
      preserved `skew` arm), and `--check` (unchanged in kind).
- [ ] Every statement is **verified against what actually merged**, not against
      the design record — the reviewer's job is to catch drift between the two.
- [ ] The docs do not promise anything the shipped build does not do; in
      particular they make **no claim about the doctor's verdict** unless
      `area-plugins-m2-doctor-standalone` has shipped.
- [ ] No behaviour path is touched: the diff is confined to `docs/`, so no version
      bump is required and `release-guard` is satisfied without one.

## Evidence

- <Filled as work progresses: diff, review.>

## Notes

**No release version. `docs/` is exempt from `release-guard`'s
`BEHAVIOR_PREFIXES` (`scripts/release-guard.mjs:20`), so this item carries no
`1.0.x` bump.** `delivery_class: knowledge`; terminal state `completed`.
**Merging it is not shipping** — nothing here is deployed and verified by a human,
and it must never be described as shipped.

**Why the dependencies are hard, not preferences.** Documenting the two modes
before `area-plugins-m2-mode-selection` merges would describe behaviour that does
not exist — a false claim in published product surface. The
`area-plugins-m2-standalone-proof` edge exists because one acceptance line here is
"each changed gate's new assertion", and arm B is one of those assertions.

**Split from the doctor item.** The accepted architecture packed docs and the
`workspace-doctor` change into a single PR-5. They separated because they have
different owners, different release consequences (docs exempt, `scripts/` not),
and because the doctor half turned out to be a **Spike** rather than a UX polish
— see `area-plugins-m2-doctor-standalone` and
`kai/coordination/threads/area-plugins-m2-decomposition.md`.

**Review.** `principal-swe-infra` / `doc-review` — the role that implemented the
behaviour verifies the docs describe what actually merged. That is independent
(the writer authors, infra checks) and proportional; a second architecture pass
over prose would be ceremony.

**Size: M.**

### Steward promotion 2026-08-27-1944 (`principal-product-manager`)

`proposed -> ready`, priority **80**, version 1 -> 2, `owner: null`, lease
untouched and null. Recorded in
`kai/coordination/threads/area-plugins-scope-brief.md`, STEWARD AMENDMENT
2026-08-27-1944 (A8).

**Last in the queue by dependency depth, not by importance.** It is the only item
that waits on two upstream `shipped` states, so it is naturally last; it is
required at `completed` in the milestone-2 mapping (A7), and the milestone does
not close without it.

**Its doctor-conditional acceptance line is now resolved by steward ruling A5.**
`area-plugins-m2-doctor-standalone` is `required_for_milestone: true`, so by the
time this item runs the doctor's behaviour will be settled — either changed in
milestone 2 or, for the classification half only, explicitly deferred to milestone
3 with a recorded trigger. Either way the writer documents **what merged**, and the
existing line — no claim about the doctor's verdict unless that item has shipped —
stands unchanged and is the right guard.

**"Merging is not shipping" is a steward line, not a caveat.** This item's terminal
state is `completed`. Milestone 5 is the only milestone permitted to describe the
*initiative* as shipped, and only after the operator has deployed and verified
(clarified in A9).

**Acceptance is unchanged by this promotion.**

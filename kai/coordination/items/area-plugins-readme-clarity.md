---
type: work-item
id: area-plugins-readme-clarity
title: README and install clarity — concept, install surface, marketplace syntax, standalone vs coordinated, plugin taxonomy
initiative: area-plugins
milestone: migration-complete
delivery_class: product-change
state: proposed
resume_state: null
priority: 90
owner: null
next_role: principal-technical-writer
target: README.md and the documented install surface
artifact_target: null
artifact_target_status: blocked-on-directory-creation; durable record is this item's thread until kai/initiatives/area-plugins/ exists
context_artifacts:
  - kai/coordination/threads/area-plugins-readme-clarity.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - kai/coordination/threads/area-plugins-m2-standalone-copy.md
  - README.md
  - docs/getting-started.md
  - skills/kai-core-workspace-onboarding/SKILL.md
touches:
  - README.md
  - docs/getting-started.md
  - docs/reference/plugin-structure.md
depends_on:
  - item: area-plugins-taxonomy-round-2
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-product-manager
    kind: scope-acceptance
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

A person landing on kai's README understands, without reading anything else,
what kai is, what they install, what to type, what works without `kai-core`, and
how the plugins are organised — and every one of those statements is true of the
**final** topology, not a transitional one.

## Acceptance

- [ ] **Concept** — what kai is, in language a first-time reader can act on,
      without internal vocabulary (`pack`, `partition`, `planPacks`, `provider`).
- [ ] **Install surface** — exactly what a person installs, and in what order.
      Core-first ordering is stated only where it is actually required, since
      after `optional-core-contract` core is an upgrade, not a prerequisite.
- [ ] **Marketplace syntax** — `<plugin>@<marketplace>` shown correctly and
      exactly once as the canonical form, with the real marketplace name. No
      example anywhere in the README uses a retired identity.
- [ ] **Standalone vs coordinated modes** — both named, both honest about what
      they can and cannot do. The standalone description must not overclaim:
      it inherits the disclaimers settled in `area-plugins-m2-standalone-copy`
      (no durable coordination, no fleet visibility, no leases, no handoffs, no
      shipped-state claims) and must not present standalone as a lesser mode
      that users should feel bad about choosing.
- [ ] **Plugin taxonomy** — every plugin listed with its one-sentence job. If any
      plugin's sentence needs a structural "and", that is a finding against the
      taxonomy and it returns to the steward — it is not smoothed over in prose.
- [ ] **Truthful at merge, not aspirational.** Every install command, plugin
      name, and marketplace name in the README resolves against what is actually
      published on the day it merges.
- [ ] **No transitional confusion.** The README is written against the **final**
      taxonomy. It does not document an intermediate state, and it does not carry
      a "coming soon" list of plugins that do not exist.

## Binding constraints (steward)

- **Drafted early, merged late.** The `depends_on` edge lets this be drafted as
  soon as the round-2 taxonomy is `completed`. It **must not merge before the new
  plugin identities are published** in `area-taxonomy-split` (milestone 4). This
  is a **mint-time edge**: no milestone-4 item exists yet, so the moment
  milestone-4 items are created, this constraint must be converted into a typed
  `depends_on … requires: shipped` against the publishing item.
- Historical records are not rewritten to match new vocabulary — `CHANGELOG.md`,
  `kai/library/releases/**`, `kai/coordination/**`, `kai/initiatives/**` are
  history, not surfaces (BRIEF `out_of_scope`).
- This item documents the topology; it does not decide it. Any taxonomy question
  discovered while writing returns to the steward as a thread `QUESTION`.

## Evidence

- Filled as work progresses.

---
type: work-item
id: area-plugins-m2-standalone-proof
title: Prove standalone mechanically — --gate partial-install arm B, an area installed alone with no core
initiative: area-plugins
milestone: optional-core-contract
delivery_class: product-change
state: ready
resume_state: null
priority: 60
owner: null
next_role: principal-swe-infra
target: --gate partial-install arm B (area alone, no core)
artifact_target: null
context_artifacts:
  - kai/coordination/threads/area-plugins-m2-decomposition.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
touches:
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - package.json
  - package-lock.json
  - CHANGELOG.md
depends_on:
  - item: area-plugins-m2-mode-selection
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
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

Success measure #1 stops being an assertion and becomes a CI proof: an area
plugin installed **alone**, with no `kai-core`, is mechanically shown to load,
resolve, and create no canonical workspace.

## Acceptance

- [ ] `--gate partial-install` keeps **arm A unchanged** (area + core: every
      reference resolves, every invoked script travels with its pack, `hooks.json`
      has exactly one owner, `guaranteeBlockErrors` holds).
- [ ] **Arm B is added — area alone, no core** — and asserts all five:
      - [ ] (i) no generated area agent body references a file or script that
            ships only in `core`;
      - [ ] (ii) every area agent carries exactly one mode block, one standalone
            block and one degraded block, contiguous and in that order;
      - [ ] (iii) `hooks.json` is **absent**, and that absence is **named** in the
            standalone block;
      - [ ] (iv) every skill the area's agents can actually reach ships in the
            area;
      - [ ] (v) the materialised area tree contains no `.kai`, no
            `kai/coordination`, no `kai/initiatives`, and no `manifest.json`
            path.
- [ ] Arm B runs over **every** department pack, not a sampled one.
- [ ] Each of the five sub-assertions owes its own **mutation case** in the
      `pack-preview` self-test — five rules, five mutations, no bundled proof.
- [ ] **This item is byte-neutral on `packs/`.** `pack-preview --check` is green
      and the diff contains zero changes under `packs/`.
- [ ] All five gates green; `npm test` green; `release-guard` passes with a
      forward version bump.
- [ ] No block file, generator output, planner rule, or plugin identity changed.

## Evidence

- <Filled as work progresses: diff, gate output, self-test output, review.>

## Notes

**Release/version: planned `1.0.9`, inside `1.0.x`. Size: L.**

**Why it is separable and why it still comes after.** It is independently
valuable and independently revertible — but sub-assertion (ii) counts three blocks
that do not exist until `area-plugins-m2-mode-selection` ships, so the dependency
is a **hard** one, not a serialization preference.

**Lower cost than it first looks.** `buildAll({ out, packs: [...], withCore:
false })` already exists and is already exercised by the `no-core` skew arm
(`scripts/pack-preview.mjs:1334`), so arm B needs **no new build mode** — only new
assertions over a tree the preview can already produce.

**The one piece that is not a straight addition.** Sub-assertion (i) needs
`referenceErrors()` and `assetOwnershipErrors()` re-parameterised for an
**area-only** provider set; today they resolve against area + core. That is the
sizing risk on this item, and it is the reason it is L rather than M.

**This is the gate that makes measure #1 provable.** The baseline is 0 of 4
department plugins usable standalone, and today that is not merely false-by-design
— it is **unprovable**, because the arm that would test it does not exist. Arm B
is what converts the milestone's central claim into something CI can fail.

**`principal-sre` is deliberately not required, with a reason.** Nothing here
changes traffic, failover, capacity, migration behaviour, or an SLO; the risk is
mechanical, and the reliability question this gate answers is exactly the one the
gate itself mechanises. A reliability pass over a pure CI assertion would be
ceremony. (Contrast `area-plugins-m2-doctor-standalone`, which **does** carry an
SRE review, because relaxing a doctor verdict removes a signal that currently
catches a genuinely broken install.)

### Steward promotion 2026-08-27-1944 (`principal-product-manager`)

`proposed -> ready`, priority **60**, version 1 -> 2, `owner: null`, lease
untouched and null. Recorded in
`kai/coordination/threads/area-plugins-scope-brief.md`, STEWARD AMENDMENT
2026-08-27-1944 (A8).

**This is the item that makes measure #1 falsifiable, so it is required, not
optional.** Everything upstream *asserts* that an area works standalone; arm B is
the only place CI can *fail* if it does not. A milestone that shipped the
behaviour without the proof would be claiming its central measure on the strength
of its own design description — which is the shape of claim this initiative
exists to stop making.

**The `principal-sre` exclusion is accepted as reasoned, and the contrast is
correct.** No traffic, failover, capacity or SLO changes here; the risk is
mechanical and the gate is the mechanism. Review requirements are not padded to
look thorough.

**Acceptance is unchanged by this promotion**, including all five sub-assertions
of arm B, the unchanged arm A, and the byte-neutrality line on `packs/`.
Sub-assertion (i) — re-parameterising `referenceErrors()` /
`assetOwnershipErrors()` for an area-only provider set — remains the named sizing
risk and is engineering's to solve.

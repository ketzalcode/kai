---
type: work-item
id: pack-split-migration-doctor
title: Migration doctor — uninstall-first, coexistence-refused, workspace-provenance migration
initiative: pack-split
milestone: first-pack-extracted
delivery_class: product-change
state: ready
resume_state: null
priority: 40
owner: null
next_role: principal-swe-infra
target: pack-split migration doctor (legacy uninstall + coexistence refusal)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - scripts/workspace-doctor.mjs
  - skills/kai-core-workspace-onboarding/SKILL.md
touches:
  - scripts/workspace-doctor.mjs
  - skills/kai-core-workspace-onboarding/SKILL.md
  - test/fixtures/
  - CHANGELOG.md
  - README.md
  - package.json
  - package-lock.json
  - plugin.json
  - .github/plugin/marketplace.json
depends_on:
  - item: pack-split-generator-gates
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-security
    kind: independent-security
  - role: principal-sre
    kind: independent-reliability
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-25-1803
---

## Outcome

`scripts/workspace-doctor.mjs` verifiably uninstalls legacy `kai` before any pack install, refuses
coexistence when both legacy `kai` and `kai-core` are detected, migrates an existing `.kai` workspace's
provenance, and surfaces the fresh-session notice — so no install ends with two copies of a core skill loaded.

## Acceptance

*Tightened by the steward at promotion 2026-08-25-1803 against `main` at `v0.62.0`. **One**
finding-driven change only, nothing added and no bar raised: the bundled "local commands + CI
green" criterion is **split**, because that exact bundling bounced `pack-split-generator-gates`
at the 2026-08-24-2244 DoD gate and has been split on every product-change item since — two
claims with two evidence sources cannot share one checkbox. Criteria 1-4 and the version-bump
criterion are unchanged from v1.*

- [ ] The doctor detects a legacy `kai` install and requires its uninstall before installing packs.
- [ ] Detected coexistence (legacy `kai` + `kai-core`) refuses rather than proceeds.
- [ ] An existing `.kai` workspace's provenance is migrated without corruption (idempotent; safe on partial).
- [ ] The fresh-session notice ("core installed; not active until a new session starts") is surfaced.
- [ ] `node scripts/workspace-doctor.mjs --self-test` and `npm test` pass **locally**.
- [ ] The `validate` workflow is **green on the pushed PR** at the reviewed `change_ref`.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- Runs in parallel with `pack-split-generated-pack-trees` (disjoint touches: `workspace-doctor.mjs`
  vs the generator/trees).
- Security review: legacy contract collision + uninstall-first/coexistence is a trust/safety boundary.
  Reliability review: provenance migration must not corrupt an existing workspace.
- Reliable cross-host legacy detection is informed by `pack-split-host-semantics-spike`.

### Steward promotion — 2026-08-25-1803 (`principal-product-manager`)

**`proposed -> ready`, priority 20 -> 40, `next_role: principal-product-manager ->
principal-swe-infra`, version 1 -> 2.** No lease taken (lease was and stays `null`); nothing
dispatched, no branch, no commit, no code, no CI, no marketplace change.

- **Why it is promotable now, and only now.** Its sole `depends_on` entry —
  `pack-split-generator-gates (requires: shipped)` — has been satisfied since 2026-08-25
  (`v0.58.0`), but the item sits in `first-pack-extracted`, which was **outside**
  `scope.current` and therefore behind the one-way valve regardless of readiness (recorded in
  this thread by `workflow-ship` at 2026-08-25-1125). That valve opened in this same pass:
  `dependency-guarantees` closed 5 of 5 `shipped` and **`scope.current` advanced to
  `first-pack-extracted`**. Dependency satisfaction did not promote this item; the scope change
  did.
- **Why priority 40 — behind the spike, not ahead of it.** `principal-swe-infra` is still the
  initiative's single-owner bottleneck. `pack-split-host-semantics-spike` (priority 30) keeps
  the lead because it **gates** `pack-split-generated-pack-trees` and its answer can rewrite the
  extraction plan, and because its completion is `@operator` host-time rather than infra time.
  This item is the parallel arm: decomposition **WS#8** runs it alongside **WS#7**, and both
  must ship before `pack-split-first-department`.
- **Touch-conflict check (steward's hypothesis; the director re-runs it at dispatch).**
  Disjoint from the spike, which touches only its own artifact under
  `artifacts/reliability/`. Disjoint from `generated-pack-trees` (`packs/**`,
  `scripts/pack-preview.mjs`, `.gitattributes`) by design — WS#8 owns `workspace-doctor.mjs`,
  WS#7 owns the generator. **`touches` was reconciled at promotion**, not expanded: the six
  release-metadata paths this item's own version-bump criterion already implies
  (`CHANGELOG.md`, `README.md`, `package.json`, `package-lock.json`, `plugin.json`,
  `.github/plugin/marketplace.json`) are now declared, so a concurrent release would collide
  **visibly** instead of silently. `marketplace.json` is a **version stamp only** — this item
  adds no pack entry and publishes nothing.
- **No dependency was added on the spike.** The `Notes` line above stands as written:
  cross-host legacy detection is *informed* by the spike, not gated on it, exactly as
  decomposition WS#8 declares. Adding one would be a DAG change the ratified plan does not
  support. If the spike returns a **bad** answer, that is a steward + architect matter for
  `generated-pack-trees`, and it reaches this item only if the detection mechanism itself is
  invalidated — raise it rather than absorbing it.
- **Evidence-basis discipline carries here.** Any claim this item makes about behaviour on a
  host nobody ran must be labelled the way this initiative has labelled operator-attested
  evidence since the `generator-gates` ship gate: **verified** (observed on a host) or
  **unverified**. That is existing practice, not a new criterion.
- **Unchanged, deliberately:** the outcome, criteria 1-4, `delivery_class: product-change`,
  `required_for_milestone: true`, `milestone: first-pack-extracted`, `owner: null` (the
  director grants the lease), and **both** required reviews —
  `principal-security` / `independent-security` and `principal-sre` /
  `independent-reliability`. Uninstall-first and coexistence-refusal are a trust boundary and a
  workspace-corruption risk; neither review was trimmed to make the queue move faster.

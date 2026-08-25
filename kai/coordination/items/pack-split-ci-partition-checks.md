---
type: work-item
id: pack-split-ci-partition-checks
title: Real CI partition/collision/skew gates + kai-core-* namespace enforcement (forces fleet rename)
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: ready
resume_state: null
priority: 50
owner: null
next_role: principal-swe-infra
target: pack-split CI partition enforcement + namespace
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - scripts/validate-plugin.mjs
  - scripts/generate-catalog.mjs
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
touches:
  - .github/workflows/validate.yml
  - scripts/validate-plugin.mjs
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - skills/kai-core-fleet-observation/SKILL.md
  - scripts/generate-catalog.mjs
  - test/fixtures/inventory.json
  - docs/getting-started.md
  - docs/workspaces.md
  - docs/reference/agents-and-skills.md
  - README.md
  - CHANGELOG.md
depends_on:
  - item: pack-split-crosspack-validator
    requires: shipped
  - item: pack-split-preflight-compat
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews: []
change_ref: null
version: 3
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-25-1148
---

## Outcome

The `--all` self-test plus collision / partial-install / version-skew arms run as **real CI gates**,
and core-provided skills are enforced to carry the `kai-core-*` prefix — which forces the rename
`fleet-observation` → `kai-core-fleet-observation`. The locked partition is CI-enforced, monolith
still authoritative.

## Acceptance

*Tightened by the steward at promotion 2026-08-25-1148 against the shipped foundation
(`v0.58.0` on `main`). Two finding-driven changes only, nothing added: the bundled
"local commands + CI green" criterion is **split** (that exact bundling bounced
`generator-gates` at the 2026-08-24-2244 DoD gate), and the rename criterion now names
`scripts/lib/pack-plan.mjs` as the canonical partition source it must update — verified on
`main`, which carries `'fleet-observation': 'core'` in that file's skill map. The A5 criteria
below are unchanged from v2.*

- [ ] `validate.yml` runs the partition self-test + collision + partial-install + version-skew arms
      as failing CI gates (not just `npm test`).
- [ ] `validate-plugin.mjs` fails if any core-provided skill lacks the `kai-core-*` prefix.
- [ ] `fleet-observation` renamed to `kai-core-fleet-observation` — skill dir + the **canonical
      partition source** (`scripts/lib/pack-plan.mjs`, which maps `'fleet-observation': 'core'`
      today) + `generate-catalog.mjs` CATEGORIES + `test/fixtures/inventory.json` + doc mentions;
      catalog check green.
- [ ] Director availability is asserted by roster **membership**, not a model-computed count (per proposal).
- [ ] `node scripts/pack-preview.mjs --self-test`, `node scripts/validate-plugin.mjs`, and
      `npm test` pass **locally**.
- [ ] The new CI gates run **green on the pushed PR** (their own claim, their own evidence — a
      workflow run, not an assertion).
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

*Carried forward from the `pack-split-generator-gates` architecture review (finding A5, ratified
2026-08-24-2231); routed here by the steward at acceptance 2026-08-24-2240. Not a defect today —
the authoritative assertions are unaffected — but this item is what turns the partition self-test
into a hard CI gate, so the duplicate truth must be collapsed immediately before those checks
become load-bearing.*

- [ ] **(A5)** `scripts/pack-preview.mjs` carries **one** roster truth: `PACK_AGENTS` is derived
      from the canonical partition (`export const PACK_AGENTS = PACKS.personal;`) or removed, so the
      second independently maintained copy of the personal roster cannot drift from `PACKS.personal`.
- [ ] **(A5)** Every partition self-test check runs the canonical `planPacks()` path; no check is
      left asserting against the legacy `planSkills(PACK_AGENTS)` path (four of the 35 checks do
      today), so a CI gate cannot pass against stale truth.

## Evidence

- (to be filled during execution).

## Notes

- Architect caveat (a): the rename is **forced** (the prefix check goes red until it lands) and
  **contained** — `fleet-observation` is an orphan (no agent inherits it), so no inheritance refs change.
- Must precede `pack-split-generated-pack-trees` so core's generated tree carries `kai-core-fleet-observation`.
- CI capstone of `dependency-guarantees`.
- **A5 provenance (steward, 2026-08-24-2240).** `pack-split-generator-gates` eliminated the
  duplicate partition truth everywhere except this one legacy export; it was deliberately not fixed
  in that ratified diff because re-opening a bound `change_ref` for a non-defect buys nothing.
  `scripts/pack-preview.mjs` is already in this item's `touches`, so A5 costs approximately one line
  plus re-pointing four self-test checks.

### Steward promotion — 2026-08-25-1148 (`principal-product-manager`)

**`proposed -> ready`, priority 20 -> 50, `next_role: principal-swe-infra`, version 2 -> 3.**

- **Promoted with both dependencies unmet, deliberately.** `ready` is a **steward commitment**
  (fits scope, acceptance defined, `depends_on` declared) — it does **not** require the
  dependencies to have resolved. Neither `pack-split-crosspack-validator` (`ready`, priority 20)
  nor `pack-split-preflight-compat` (`ready`, priority 10) is `shipped`. **This item is
  therefore NOT dispatchable** and must fail the director's dependency check until both reach
  `shipped`. *Executable* stays a derived predicate at dispatch time, never stored here.
- **Dependency types preserved exactly.** Both entries remain `requires: shipped` — not relaxed
  to `in-review` or `release-ready`. `crosspack-validator` supplies the multi-manifest gate base
  this layers on; `preflight-compat` supplies the emitter the **version-skew arm** tests
  (decomposition WS#6). Softening either would let the capstone assert against a base that can
  still change under it.
- **Priority 50 — last in the initiative queue.** It is the CI capstone of
  `dependency-guarantees` and the only item here waiting on **two** upstreams, so it ranks behind
  `pack-split-degraded-refusal` (40) and behind all three dependency-satisfied items. Queue order
  reflects reachability on a single-owner (`principal-swe-infra`) bottleneck.
- **Fits `scope.current`.** Milestone `dependency-guarantees`, `required_for_milestone: true`;
  1 of the 4 required items still outstanding. No milestone semantics changed.
- **Touch-set reconciled to the shipped foundation and to WS#6 as written.** Added
  `scripts/lib/pack-plan.mjs` — after `generator-gates` the canonical partition source lives
  there and still maps `'fleet-observation': 'core'` (verified on `main`), so the forced rename
  cannot land without it; and the doc/README/CHANGELOG paths WS#6 already enumerated. A claim,
  not proof — reconcile the actual changed-path set on handback. **Not decided here:** whether
  historical `CHANGELOG.md` entries naming `fleet-observation` are rewritten or left as history
  (the release stamp touches that file regardless). That is the acting role's call at
  implementation; if it grows past a mechanical rename it routes to the steward as a scope
  question.
- **Review requirement unchanged and not expanded.** One review only —
  `principal-swe-architect` / `independent-architecture` (namespace invariant + the rename +
  partition-CI coverage). The steward did **not** add `independent-security` here; this item
  wires gates, it does not define the fail-closed refusal boundary (that is
  `preflight-compat` / `degraded-refusal`).
- **Open question carried, non-blocking.** Decomposition Open Question 4 — whether the "partly
  landed" director-availability membership work is complete — stays open on this record and is
  **not** in `waiting_on_questions`: it is verified at acceptance against criterion 4, and does
  not block the start of work. It must be answered before this item can claim that criterion.
- **Unchanged, deliberately:** outcome, milestone, `required_for_milestone`, `delivery_class`,
  `owner: null`, the A5 criteria and their provenance, the forced-and-contained rename framing,
  the must-precede-`generated-pack-trees` ordering, and the `0.x` versioning rule. No
  architecture decision was made or re-opened; ratified WS#6 stands as written.

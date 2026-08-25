---
type: work-item
id: pack-split-degraded-refusal
title: Canonical degraded-mode refusal block shipped in every pack, CI-pinned
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: ready
resume_state: null
priority: 40
owner: null
next_role: principal-swe-infra
target: pack-split degraded-mode refusal
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - scripts/lib/inherits-block.txt
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
touches:
  - scripts/lib/degraded-block.txt
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - .github/workflows/validate.yml
depends_on:
  - item: pack-split-preflight-compat
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
  - role: principal-security
    kind: independent-security
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-25-1148
---

## Outcome

One canonical refusal block (`scripts/lib/degraded-block.txt`) that restates **no** core rules —
it states the absence of the contract and stops — copied into every pack agent by the generator
and pinned byte-for-byte in CI, so it cannot drift from core as core evolves.

## Acceptance

*Tightened by the steward at promotion 2026-08-25-1148 against the shipped foundation
(`pack-split-generator-gates`, `v0.58.0` on `main`). Two finding-driven changes only, no new
requirement and no raised bar: (1) the copy path is named as the **authoritative generator
path** (`materializePacks` in `scripts/lib/pack-plan.mjs`), whose own header states that
"Guarantee-block injection (preflight, degraded-mode) ... are added by downstream items, not
here" — this item is that downstream owner for the degraded-mode block, per the steward's
2026-08-24-2240 generator-gates acceptance correction; (2) the bundled "local commands + CI
green" criterion is **split**, because that exact bundling bounced `generator-gates` at the
2026-08-24-2244 DoD gate — two claims with two different evidence sources cannot share one
checkbox.*

- [ ] `scripts/lib/degraded-block.txt` exists, restates no operating rules, and instructs single-shot
      refusal + "install kai-core" only.
- [ ] Every generated pack agent carries the verbatim block, copied in by the **authoritative
      generator path** (`materializePacks`), so a committed tree — not only a `--all` preview —
      carries it; `validate-plugin.mjs` pins it byte-for-byte from the canonical file, following
      the existing `scripts/lib/inherits-block.txt` pin precedent.
- [ ] A CI check asserts the block introduces no coordination rule (drift-proof by construction).
- [ ] The block is present in every pack agent body produced by
      `node scripts/pack-preview.mjs --all --out <dir>`.
- [ ] `node scripts/pack-preview.mjs --self-test`, `node scripts/validate-plugin.mjs`, and
      `npm test` pass **locally**.
- [ ] The `validate` workflow runs **green on the pushed PR** (its own claim, its own evidence —
      a workflow run, not an assertion).
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- Follows `pack-split-preflight-compat` because it shares the generator injection path and the same
  generated agent bodies (touch overlap) — sequenced, not raced.
- Distinct from the preflight's one-line refusal *token*: this is the fuller shipped block the failed
  preflight points to. Mirrors the `inherits-block.txt` canonical-file + CI-pin + generator-copy pattern.

### Steward promotion — 2026-08-25-1148 (`principal-product-manager`)

**`proposed -> ready`, priority 20 -> 40, `next_role: principal-swe-infra`, version 1 -> 2.**

- **Promoted with its dependency unmet, deliberately.** `ready` is a **steward commitment**
  (fits scope, acceptance defined, `depends_on` declared) — it does **not** require the
  dependency to have resolved. This item's sole `depends_on` entry
  (`pack-split-preflight-compat`, `requires: shipped`) is **not** satisfied: that item is
  `ready` at priority 10 and has not been dispatched. **This item is therefore NOT
  dispatchable.** *Executable* is the director's derived predicate at dispatch time, never
  stored here; the dependency check must fail until `preflight-compat` reaches `shipped`.
- **Dependency type preserved exactly.** Still `requires: shipped` on `preflight-compat` — not
  weakened to `in-review` or `release-ready` to make it move sooner. The two share the same
  generated-agent-body injection surface (`materializePacks`) and both byte-pin from
  `scripts/validate-plugin.mjs`, so they are sequenced, not raced (decomposition WS#5).
- **Priority 40 — behind every currently dispatchable item.** Queue order is honest about
  reachability: `preflight-compat` (10), `crosspack-validator` (20), `host-semantics-spike`
  (30) are dependency-satisfied today; this is not. It ranks ahead of
  `pack-split-ci-partition-checks` (50) because that capstone waits on **two** upstreams.
- **Fits `scope.current`.** Milestone `dependency-guarantees`, `required_for_milestone: true`;
  1 of the 4 required items still outstanding. No milestone semantics changed.
- **Directly serves a non-negotiable.** "The degraded-mode block is a refusal, not a fallback
  contract; it restates no core rules, so it cannot drift." The drift-proof criterion is the
  whole point of the item and was not softened.
- **Touch-set reconciled to the shipped foundation.** `scripts/lib/pack-plan.mjs` added: after
  `generator-gates`, the authoritative materialization lives there and its header explicitly
  defers **degraded-mode** guarantee-block injection to a downstream item — this one. A claim,
  not proof; reconcile the actual changed-path set on handback.
- **Both reviews still required at the same `change_ref`**: `principal-swe-architect` /
  `independent-architecture` (refusal-not-fallback) **and** `principal-security` /
  `independent-security`. Neither is waivable here.
- **Unchanged, deliberately:** outcome, milestone, `required_for_milestone`, `delivery_class`,
  `owner: null`, review requirements, the `requires: shipped` dependency, and the `0.x`
  versioning rule. No architecture decision was made or re-opened; ratified WS#5 stands as
  written.

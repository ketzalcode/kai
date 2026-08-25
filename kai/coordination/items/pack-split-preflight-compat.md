---
type: work-item
id: pack-split-preflight-compat
title: Combined fail-closed preflight + version-compat in each pack agent body, CI byte-pinned
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: ready
resume_state: null
priority: 10
owner: null
next_role: principal-swe-infra
target: pack-split contract preflight + version compatibility
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - scripts/lib/inherits-block.txt
  - scripts/validate-plugin.mjs
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
touches:
  - skills/kai-core-contract-v1/SKILL.md
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/lib/preflight-block.txt
  - scripts/validate-plugin.mjs
  - .github/workflows/validate.yml
depends_on:
  - item: pack-split-generator-gates
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
updated: 2026-08-25-1139
---

## Outcome

`kai-core-contract-v1` exists as a real core skill (today only script-synthesized), and the
generator injects a combined fail-closed **preflight + `contract: 1` version check** into each
pack agent's own body, pinned byte-for-byte in CI like `inherits-block.txt`. Core-absent and
core-version-skew each produce the exact refusal token; no silent-degradation path in the tested arms.

## Acceptance

*Tightened by the steward at promotion 2026-08-25-1139 against the shipped foundation
(`pack-split-generator-gates`, `v0.58.0` on `main`). Two changes only, both required by
findings already on the record — no new requirement was added and the bar was not raised:
(1) the injection point is named as the **authoritative generator path**
(`materializePacks` in `scripts/lib/pack-plan.mjs`, whose own header defers guarantee-block
injection to this item) rather than the throwaway preview, per the steward's generator-gates
acceptance correction of 2026-08-24-2240 that assigned guarantee-block injection downstream;
(2) the bundled "local commands + CI green" criterion is **split**, because the
2026-08-24-2244 DoD gate bounced `generator-gates` for exactly that bundling — two claims
with two different evidence sources cannot share one checkbox.*

- [ ] `skills/kai-core-contract-v1/SKILL.md` exists as a real core skill returning the rigid
      `KAI_CORE_READY` / `contract: 1` marker. Today only the `CONTRACT_SKILL` / `REFUSAL`
      constants exist (`scripts/lib/pack-plan.mjs`); the skill is script-synthesized, not on disk.
- [ ] The combined preflight + version check is injected by the **authoritative generator
      path** (`materializePacks`), so a committed tree — not only a `--all` preview — carries
      it; placed after each pack agent's `**Inherits:**` line, with exactly one such line remaining.
- [ ] The injected block is pinned byte-for-byte in CI from a canonical
      `scripts/lib/preflight-block.txt`, following the existing `scripts/lib/inherits-block.txt`
      pin precedent in `scripts/validate-plugin.mjs`.
- [ ] Core-absent and `contract: 2` arms each produce the exact `KAI-CORE-MISSING` refusal
      token in `node scripts/pack-preview.mjs --all --out <dir>`.
- [ ] `node scripts/pack-preview.mjs --self-test`, `node scripts/pack-preview.mjs --check`,
      `node scripts/validate-plugin.mjs`, and `npm test` pass **locally**.
- [ ] The `validate` workflow runs **green on the pushed PR** (its own claim, its own
      evidence — a workflow run, not an assertion).
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- "Combined" = probe + version check in one injected block, so absence and skew share one refusal path.
- Mechanism is proven in `pack-preview.mjs`; this productionizes + CI-pins it. The version-skew CI
  arm is co-delivered with `pack-split-ci-partition-checks`.
- Security review: a missing/incompatible core must fail closed — this is the trust boundary.

### Steward promotion — 2026-08-25-1139 (`principal-product-manager`)

**`proposed -> ready`, priority 20 -> 10, `next_role: principal-swe-infra`, version 1 -> 2.**

- **Dependency verified, not assumed.** The sole `depends_on` entry
  `pack-split-generator-gates (requires: shipped)` is satisfied: that record is `state: shipped`
  at version 17, `change_ref 457254b97…`, PR #152 merged into
  `47aa0549f89b1733483dd6b662a4787d621c9430`, released `v0.58.0`, production verification passed.
- **Priority 10 — highest in the initiative.** `pack-split-degraded-refusal` depends on **this**
  item at `shipped` and shares its generated-agent-body injection surface, and
  `pack-split-ci-partition-checks` needs it for the version-skew arm. Sequencing it first
  releases more of `dependency-guarantees` than any other ready item, and the owner
  (`principal-swe-infra`) is the initiative's single-owner bottleneck, so queue order is real.
- **Fits `scope.current`.** Milestone `dependency-guarantees`, `required_for_milestone: true`;
  it is 1 of the 4 required items still outstanding. No milestone semantics changed.
- **Touch-set reconciled to the shipped foundation.** `scripts/lib/pack-plan.mjs` added: after
  `generator-gates`, the authoritative materialization lives there and its header explicitly
  defers guarantee-block injection to this item. Claim, not proof — reconcile on handback.
- **Both reviews still required at the same `change_ref`**: `principal-swe-architect` /
  `independent-architecture` (contract semantics) **and** `principal-security` /
  `independent-security` (fail-closed refusal is the trust boundary). Neither is waivable here.
- **Unchanged, deliberately:** outcome, milestone, `required_for_milestone`, `delivery_class`,
  review requirements, and the `0.x` versioning rule. No architecture decision was made or
  re-opened by this promotion; the ratified decomposition (WS#4) stands as written.

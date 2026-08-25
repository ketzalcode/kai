---
type: work-item
id: pack-split-preflight-compat
title: Combined fail-closed preflight + version-compat in each pack agent body, CI byte-pinned
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split contract preflight + version compatibility
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
touches:
  - skills/kai-core-contract-v1/SKILL.md
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
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-24-2011
---

## Outcome

`kai-core-contract-v1` exists as a real core skill (today only script-synthesized), and the
generator injects a combined fail-closed **preflight + `contract: 1` version check** into each
pack agent's own body, pinned byte-for-byte in CI like `inherits-block.txt`. Core-absent and
core-version-skew each produce the exact refusal token; no silent-degradation path in the tested arms.

## Acceptance

- [ ] `skills/kai-core-contract-v1/SKILL.md` returns the rigid `KAI_CORE_READY` / `contract: 1` marker.
- [ ] Every generated pack agent carries the combined preflight after its `**Inherits:**` line,
      pinned byte-for-byte in CI; exactly one `**Inherits:**` line remains.
- [ ] Core-absent and contract-2 arms each produce the exact refusal token in the preview.
- [ ] `node scripts/pack-preview.mjs --self-test`, `node scripts/validate-plugin.mjs`, `npm test` pass.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- (to be filled during execution).

## Notes

- "Combined" = probe + version check in one injected block, so absence and skew share one refusal path.
- Mechanism is proven in `pack-preview.mjs`; this productionizes + CI-pins it. The version-skew CI
  arm is co-delivered with `pack-split-ci-partition-checks`.
- Security review: a missing/incompatible core must fail closed — this is the trust boundary.

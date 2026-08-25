---
type: work-item
id: pack-split-host-gates
title: Host gates — macOS + cloud + install-order + fresh-session verification evidence
initiative: pack-split
milestone: first-pack-extracted
delivery_class: knowledge
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split host-gate certification evidence
artifact_target: kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
touches:
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md
depends_on:
  - item: pack-split-first-department
    requires: shipped
  - item: pack-split-migration-doctor
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-sre
    kind: independent-reliability
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

The formal verification evidence that the real `kai-core` + `kai-personal` install behaves on macOS,
on the cloud host, under real install order, marketplace-vs-direct, and across fresh sessions — the
hard gate that must pass before the `1.0.0` flip. Closes `completed` (evidence record).

## Acceptance

- [ ] Install-order + fresh-session + collision + cross-plugin resolution verified on macOS + one cloud host.
- [ ] Marketplace-vs-direct install paths both produce the correct bound contract (no stale legacy copy).
- [ ] Evidence recorded at the artifact target; `principal-sre` reviews host/platform behavior.
- [ ] Result is an explicit go / no-go for `pack-split-release-12b`.

## Evidence

- (to be filled) — operator host-run transcripts + the reliability record.

## Notes

- **Scope (steward decision):** scoped as a **minimal smoke gate**, not full certification — the
  northstar defers full macOS/cloud certification (decomposition *Scope negotiations*).
- Host runs are **operator-executed**; this role designs the gate + records evidence. Closes `completed`.

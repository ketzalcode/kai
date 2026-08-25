---
type: work-item
id: pack-split-host-semantics-spike
title: Spike — verify unproven host semantics on macOS + cloud before extraction
initiative: pack-split
milestone: first-pack-extracted
delivery_class: knowledge
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split host behavior de-risk (macOS + cloud + install order)
artifact_target: kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - scripts/pack-preview.mjs
touches:
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md
depends_on:
  - item: pack-split-partition-lock
    requires: completed
waiting_on_questions: []
required_for_milestone: false
review_requirements: []
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

A recorded answer to the load-bearing unknown the proposal proved only on Windows CLI:
does an agent in a department pack resolve a `kai-core-*` skill from core on **macOS** and
the **cloud host**; does collision/load-order hold under **real install** order and
**marketplace-vs-direct**; does a **fresh session** load newly-installed plugins; and do
`hooks.json` hooks fire **once** or per-plugin. Time-boxed; gates the first real tree generation.

## Acceptance

- [ ] Each question above answered with evidence captured from the throwaway
      `node scripts/pack-preview.mjs --all` output installed on macOS + one cloud host.
- [ ] A clear go / no-go for `pack-split-generated-pack-trees`: good answer = proceed;
      bad answer = re-open directors-in-core vs `kai-orchestrator` and the hooks-ownership
      mechanism with the steward + architect **before** any tree is committed.

## Evidence

- (to be filled) — operator host-run transcript + the reliability record at the artifact target.

## Notes

- **Manager spike (de-risk).** Front-loaded per "prove the risky host semantics, and only then
  move agents." Design is `principal-swe-infra`; the host runs are **operator-executed** (this
  role cannot run external host gates). Runs in parallel with the dependency-guarantees work.
- Supporting item, not a closure gate — `pack-split-host-gates` is the formal certification.
  Steward may fold this into that item as an early phased arm (see decomposition *Scope negotiations*).

---
type: work-item
id: pack-split-host-gates
title: Host gates — macOS + cloud + install-order + fresh-session verification evidence
initiative: pack-split
milestone: first-pack-extracted
delivery_class: knowledge
state: in-review
resume_state: null
priority: 10
owner: principal-swe-infra
next_role: principal-sre
target: pack-split host-gate certification evidence
artifact_target: kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-host-gates.md
  - docs/proposals/pack-architecture.md
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-migration-doctor.md
touches:
  - .kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/**
  - kai/coordination/ACTIVE.md
  - kai/coordination/BOARD.md
  - kai/coordination/items/pack-split-host-gates.md
  - kai/coordination/threads/pack-split-host-gates.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-host-gates.md
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md
  - kai/initiatives/pack-split/deliverables.md
  - kai/initiatives/pack-split/log.md
  - kai/initiatives/pack-split/northstar.md
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
change_ref: 263452126179dd9f3a61183903a26a90c4d6b1c1
version: 15
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-26-1758
---

## Outcome

The formal verification evidence that the real `kai-core` + `kai-personal` install behaves on macOS,
on the cloud host, under real install order, marketplace-vs-direct, and across fresh sessions — the
hard gate that must pass before the `1.0.0` flip. Closes `completed` (evidence record).

## Acceptance

- [ ] Install-order + fresh-session + collision + cross-plugin resolution verified on macOS + one cloud host.
- [ ] Marketplace-vs-direct install paths both produce the correct bound contract (no stale legacy copy).
- [ ] Marketplace and direct install evidence records whether each pack root
      receives npm dependency installation or a `node_modules` tree.
- [ ] A generated department agent carrying both guarantee blocks replies with
      exactly `KAI-CORE-MISSING` and nothing else in both the no-core and
      contract-skew (`--contract 2`) arms.
- [ ] Evidence recorded at the artifact target; `principal-sre` reviews host/platform behavior.
- [ ] Result is an explicit go / no-go for `pack-split-release-12b`.

## Evidence

- Preparation landed through PR #173. Final consumer evidence is bound to
  exact `change_ref` `c4d0b376542116c0e13fbb50e4d1ae17eeea653e`,
  subject `docs(pack-split): record consumer cloud host proof`.
- macOS **PASS**: genuine GitHub-hosted Apple Silicon Actions run
  `33024791572`, job `98363497414`, at source
  `9a800e4e76cd6c15b9dfab01a7b1ed99c4285080`. Sanitized evidence is under
  `.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/macos/`.
- macOS direct installs in both orders and the run-local marketplace bind
  `kai-personal:persona-self` to `kai-core-contract-v1` from `kai-core`
  `0.64.0`; installed/source manifest SHA-256 values match; per-pack dependency
  inventories are empty; collision refusal and both exact refusal arms pass.
- Cloud branch spike **INDETERMINATE**: task
  `7160810a-a4e1-43eb-bc97-d6f8e2f53aad`, run `33024086802`, job
  `98361210602`, base/generated head
  `fb04975c2969e1aca463d148b6cb1784966e20b9`. It made two bash calls and
  emitted zero plugin discovery/install, `skill.invoked`, or `persona-self`
  dispatch events. Sanitized summary:
  `.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/cloud/99-summary.json`.
- Disposable consumer cloud proof **PASS with selected-agent telemetry
  limitation**: default-branch fixture
  `7d80b4b12942eb0acce972e1e83c36f88023fde6` loaded
  `spark`, `kai-core`, and `kai-personal` (`3/3`). Task
  `bc62f1d9-eb90-45b7-90b0-44ade5c60da5`, run `33026579996`,
  job `98369253049`, session
  `733d02f6-6eae-4610-950e-b04f6e56eae2` invoked
  `kai-core-contract-v1`. Task
  `7e6cf168-469b-4224-9ba7-f2123207bdd3`, run `33026682808`,
  job `98369587097`, session
  `6ff59e2a-578b-4ed1-9bf6-b5ed99af9515` recorded successful
  `task -> nested kai-core-contract-v1 -> task success`.
- A repeat at task `47438e15-4b6c-421f-97a2-f783434b7fdb`, run
  `33027220466`, job `98371301103`, session
  `410d2bc8-30e7-401a-ad12-13233c09a1f2` persisted the exact
  `kai-personal:persona-self` target and no-substitution requirement, then
  produced the same successful nested event sequence. Exported logs omit task
  arguments; repository hooks did not fire; this limitation is explicit for
  SRE review.
- Independent SRE review at
  `c4d0b376542116c0e13fbb50e4d1ae17eeea653e` returned changes required:
  exact selected-agent binding, cloud Kai source revision, and reconciliation
  of the positive macOS packet with retained contract output.
- Follow-up host storage now supplies the missing causal record. Tool call
  `toolu_019eFjZzzD2FszpjX6GTTWXA` names
  `agent_type: kai-personal:persona-self`; same-session host markers bracket
  that subagent's nested `kai-core-contract-v1` invocation. GitHub history
  binds both cloud resolution timestamps to Kai `main`
  `fe562b9364256b159d7016d8bdc79d989bc7e3a3`, pack version `0.64.0`.
  The macOS packet now asserts its retained
  `KAI_CORE_READY` / `contract: 1` output.
- The amended decision and next experiment are recorded at
  `kai/initiatives/pack-split/artifacts/decisions/pack-split-host-gates.md`.
  Release 12b remains explicitly **NO-GO**.

## Notes

- **Scope (steward decision):** scoped as a **minimal smoke gate**, not full certification — the
  northstar defers full macOS/cloud certification (decomposition *Scope negotiations*).
- Host runs are **operator-executed**; this role designs the gate + records evidence. Closes `completed`.
- **Steward promotion 2026-08-26-1558:** promoted `proposed -> ready` after both typed
  dependencies reached their required `shipped` state. Priority 10 makes this the sole
  committed queue head. `principal-swe-infra` designs and records the bounded gate;
  `@operator` executes only the external host actions. Full fleet certification and any
  observer redesign remain out of scope.
- **Architecture correction 2026-08-26-1645:** the public-marketplace and
  enterprise-managed prerequisites were false constraints in the prior packet,
  not item Acceptance. `Q-pack-split-host-gates-02` is answered and withdrawn;
  `Q-pack-split-host-gates-01` now points to the corrected macOS packet, and
  `Q-pack-split-host-gates-03` requests the bounded cloud branch spike. A
  default-branch-only cloud result routes to steward escalation E1 without an
  infra decision.
- **Evidence amendment 2026-08-26-1702:** `Q-pack-split-host-gates-01` is
  answered by the macOS PASS. `Q-pack-split-host-gates-03` is answered
  indeterminate, not as default-branch-only or direct-spec rejection. The
  smallest discriminating next step is a disposable external consumer
  repository whose default branch carries both direct Kai specs plus a
  default-marketplace positive control. Creating/deleting that repository is an
  operator boundary tracked only by `Q-pack-split-host-gates-04`.
- **Consumer result 2026-08-26-1740:** `Q-pack-split-host-gates-04` is
  answered and the consumer experiment is complete. The item resumed
  `blocked -> in-progress`; no operator question remains. The evidence revision
  still needs a commit-bound `change_ref` and `principal-sre` review before the
  item can complete or release 12b can move from NO-GO.
- **Review routing 2026-08-26-1745:** evidence is committed at
  `c4d0b376542116c0e13fbb50e4d1ae17eeea653e`; the item moved
  `in-progress -> in-review`, routes to `principal-sre`, and preserves release
  12b NO-GO until the independent verdict.
- **SRE remediation 2026-08-26-1752:** SRE returned changes required at
  `c4d0b376…` (P1 exact child identity; P2 cloud source pin; P2 stale positive
  packet assertions). The item moved `in-review -> in-progress`, cleared its
  superseded `change_ref`, and prepared all three corrections. A new evidence
  commit and re-review are required.
- **Re-review routing 2026-08-26-1758:** corrected evidence is committed at
  `263452126179dd9f3a61183903a26a90c4d6b1c1`. The item moved
  `in-progress -> in-review` (v14 -> v15) and routes to `principal-sre`.

---
type: work-item
id: pack-split-generated-pack-trees
title: Generate committed-unpublished kai-core + first department (personal) trees from root
initiative: pack-split
milestone: first-pack-extracted
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split committed-unpublished pack trees (generate-not-move)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - scripts/pack-preview.mjs
  - hooks.json
touches:
  - packs/kai-core/
  - packs/kai-personal/
  - scripts/pack-preview.mjs
  - .gitattributes
  - package.json
depends_on:
  - item: pack-split-generator-gates
    requires: shipped
  - item: pack-split-crosspack-validator
    requires: shipped
  - item: pack-split-preflight-compat
    requires: shipped
  - item: pack-split-degraded-refusal
    requires: shipped
  - item: pack-split-ci-partition-checks
    requires: shipped
  - item: pack-split-host-semantics-spike
    requires: completed
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
updated: 2026-08-25-1803
---

## Outcome

The generator materializes the committed-but-unpublished `kai-core` + `kai-personal` trees from
root (root stays the single source of truth — nothing moved), realizing the explicit asset-ownership
rule: a non-markdown asset travels with the sole skill that invokes it (`scripts/demo-*.mjs` →
personal), any asset invoked across >1 pack promotes to core, and `hooks.json` + `scripts/observe-*.mjs`
ship in core only (hooks exactly once).

## Acceptance

- [ ] `packs/kai-core/` and `packs/kai-personal/` are generated from root, committed, and unpublished;
      re-generation is byte-stable; `agents/`+`skills/` at root are unchanged.
- [ ] `scripts/demo-*.mjs` travel with `personal`; `hooks.json` + `scripts/observe-*.mjs` present in
      core only; no department pack ships a duplicate hook.
- [ ] Each generated pack agent carries the preflight + degraded block; the cross-pack validator and
      partition CI pass on the committed trees.
- [ ] `node scripts/pack-preview.mjs --all`, `node scripts/validate-plugin.mjs`, `npm test` pass.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

*Carried forward from the `pack-split-generator-gates` architecture review (ratified
2026-08-24-2231 at `change_ref 457254b973fb58b129332ffaa609fb5febfdd412`); routed here by the
steward at acceptance 2026-08-24-2240 because this item is the first state in which each becomes
reachable. None was a defect in that foundation.*

- [ ] **(A1)** `checkCommitted` guards the committed-tree walk on `existsSync(base)`. With a slice
      selected and `packs/` not yet present — literally this item's first state — the gate prints
      the `regenerate with: --write` guidance and exits non-zero, instead of an ENOENT stack trace
      from `readdirSync` on a missing directory.
- [ ] **(A2)** The committed-tree walk does not treat every file under `packs/` as generator
      output: OS artifacts (`.DS_Store`, `Thumbs.db`) are skipped, or the walk is scoped to tracked
      files. A contributor's local `--check`/`npm test` cannot fail while CI stays green.
- [ ] **(A3)** `.gitattributes` pins `packs/** text eol=lf` when the first tree lands, matching the
      existing `scripts/**` and `test/fixtures/**` pins — a byte-compared generated tree is the same
      category.

## Evidence

- (to be filled during execution).

## Notes

- **Slice.** Thin first increment = core + personal only. Deferred: `engineering`, `product`, `gtm`
  trees generated one-at-a-time ahead of publication in `pack-split-release-12c` — honoring
  "generate/validate/prove one department at a time." `personal` first: most defensible extraction
  and the department that owns the demo assets, so architect caveat (c) is resolved where it is needed.
- Architect caveat (b) — review-lens binding — is **not on this critical path** (engineering is
  deferred); resolve it before the engineering tree is generated. See decomposition Open Questions.
- Committed-tree root `packs/` is **CONFIRMED** (steward, 2026-08-24-2240) — decomposition Open
  Question 2 is closed, not an open assumption. `PACKS_DIR` in `scripts/lib/pack-plan.mjs` and
  `BEHAVIOR_PREFIXES` in `scripts/release-guard.mjs` already encode it; `dist/` was rejected because
  it signals uncommitted build output. Do not re-litigate the root here.
- **Publication guard is owned elsewhere, but this item is what makes it urgent.** Architect finding
  A4 is routed to `pack-split-release-12b`: `.github/plugin/marketplace.json` is neither a
  `BEHAVIOR_PREFIX` nor a `BEHAVIOR_FILE`, so once a tree is committed here, flipping it from
  unpublished to published is a *pure* marketplace edit that release-guard exempts — no bump, no
  CHANGELOG, no README. Nothing in this item publishes anything, and the trees land unpublished by
  contract; but the guard must land no later than the flip. If any publication becomes possible
  before `12b`, raise it to the steward rather than absorbing it here.

### Steward grooming — 2026-08-25-1803 (`principal-product-manager`) — in scope, NOT promoted

Version 2 -> 3. **State stays `proposed`**; `next_role` stays `principal-product-manager`; no
lease. This is grooming of a not-yet-promoted record, **not** a promotion.

- **Scope gate is now open, dependencies are not.** `dependency-guarantees` closed 5 of 5
  `shipped` in this pass and `scope.current` advanced to `first-pack-extracted`, so the
  "outside `scope.current`" objection recorded four times in this thread no longer applies.
  Five of six `depends_on` entries are met (`generator-gates` `v0.58.0`, `preflight-compat`
  `v0.59.0`, `crosspack-validator` `v0.60.0`, `degraded-refusal` `v0.61.0`,
  `ci-partition-checks` `v0.62.0`). The sixth — `pack-split-host-semantics-spike` at
  `completed` — is **not**, and it is the one that can change this item's design.
- **Why the steward is not chain-promoting it anyway.** `ready` needs dependencies *declared*,
  not resolved, so a chain promotion would be contract-legal here (it is what this initiative
  did for `degraded-refusal` and `ci-partition-checks` on 2026-08-25-1148). It is being
  withheld on **acceptance readiness**, not on the DAG: three product decisions that shape what
  this item emits are still open, and promoting before they are settled would hand infra an
  acceptance set that moves under it.
- **Promotion preconditions — all three are the steward's to close, and none is engineering
  work:**
  1. **The spike's go/no-go.** Its second acceptance criterion is explicit: a bad answer
     re-opens directors-in-core vs `kai-orchestrator` and the hooks-ownership mechanism *with
     the steward and architect* **before any tree is committed**. That is a re-scope trigger on
     this item.
  2. **Proposal A1 (core degraded-mode coverage).** Core agents carry neither guarantee block.
     The exclusion is airtight for install-level absence and CI-enforced (a core agent carrying
     either block is an error), but not for the context-loading absence the refusal now owns.
     Security's input stands: core holds `director-chief-of-staff` and
     `workflow-workspace-init`, so the uncovered blast radius per agent is **larger** there.
     **This item is the reopen trigger** — it emits the first committed core tree — so the
     decision (second canonical block, or an explicit accepted-residual) must be made before
     promotion, not discovered during the build. A second block would be a new file, a new pin
     and a new refusal budget: a scope decision, not a reviewer's diff.
  3. **The riders, decided as a set rather than one at a time.** Parked proposals **N4**
     (`pack-plan.mjs:27` "Hosts have exposed…" plural outruns a one-host corpus), **N5**
     (`parseGeneratedKey` fail-closed in `guaranteeBlockErrors`, fail-open in `packProviders`
     and the hooks-claimant filters) and the **§147/§157 errata** on
     `docs/proposals/pack-architecture.md` all name this item — or the next thing that opens
     these files — as their home. They are cheap **as riders** and expensive as their own round
     trips. Also still live in this thread: **N3** (`endsWith('/hooks.json')` vs
     `^[^/]+/hooks\.json$`), the nested-hook-script key-space caveat, and the two structurally
     unreachable `assetOwnershipErrors` arms that only become real guarantees here.
- **Also unresolved and routed here for the same reason:** the parked proposal on
  **cross-department agent-referral degradation** (12+ live referrals with no defined behaviour
  when the sibling department pack is absent). Its own trigger is "this item reaching
  implementation, because it emits the agent bodies where any such text would live". It is a
  product-behaviour call, and it is mine.
- **Nothing about the committed-unpublished line changed.** `COMMITTED_PACKS = []` and there is
  no `packs/` tree at `v0.62.0`, proven positively from the merge root tree. This item still
  owns creating the first one, and it lands **unpublished** by contract.

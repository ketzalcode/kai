# Thread — pack-split-preflight-compat

Append-only communication log mirroring
`kai/coordination/items/pack-split-preflight-compat.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Combined fail-closed preflight + `contract: 1` version check injected into each pack agent body, byte-pinned in CI; `kai-core-contract-v1` materialized as a real core skill. Size L. Owner `principal-swe-infra`; reviews `principal-swe-architect`/independent-architecture + `principal-security`/independent-security (fail-closed trust boundary). Depends on `pack-split-generator-gates` (shipped).
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-preflight-compat.md; decomposition WS#4
- evidence:  scripts/pack-preview.mjs preflightBlock()/contractSkill() prototype + self-test — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone.

## NOTE 2026-08-25-1125 — workflow-ship: dependency satisfied (reconciliation only)

- `pack-split-generator-gates` reached **`shipped`** at 2026-08-25-1125 (PR #152 merged
  2026-08-25T18:20:55Z, merge commit `47aa0549f89b1733483dd6b662a4787d621c9430`, released
  `v0.58.0`; production verification passed). This item's **sole** `depends_on` entry —
  `pack-split-generator-gates (shipped)` — is therefore **satisfied**.
- **This item is still `proposed` and is NOT executable.** `workflow-ship` reconciles
  dependencies; it does not promote, dispatch, or re-prioritize. Only
  `principal-product-manager` moves `proposed -> ready`. No field on this record was
  changed — `state`, `priority`, `owner`, `next_role`, and `version` are untouched.
- Milestone `dependency-guarantees` is inside `northstar.scope.current`, so once groomed
  this item is a genuine candidate for the next dispatch, alongside
  `pack-split-crosspack-validator` (also now dependency-satisfied). Note
  `pack-split-degraded-refusal` depends on **this** item at `shipped`, so sequencing this
  one earlier unblocks more of the milestone.
- Foundation now available to build on: the `preflightBlock()` / `contractSkill()`
  prototype cited above is on `main` at `v0.58.0` via `scripts/lib/pack-plan.mjs` and the
  deterministic generator, with `pack-preview --self-test` and `--check` mandatory in CI —
  so a byte-pinned preflight has a stable emitter to pin against.
- Unchanged: this item carries **two** required reviews (`independent-architecture` **and**
  `independent-security` for the fail-closed trust boundary). Both must be satisfied at the
  same `change_ref` before it can reach the ship gate.

## HANDOFF 2026-08-25-1139 — principal-product-manager -> principal-swe-infra

- did:       Steward grooming pass. **Promoted `proposed -> ready`** at **priority 10 — the top of
             the initiative queue** (version 1 -> 2, `next_role: principal-swe-infra`, `owner` still
             null until dispatch grants the lease). Verified the sole dependency against the record
             rather than the note: `pack-split-generator-gates` is `state: shipped` (v17,
             `change_ref 457254b97…`, PR #152 merged into `47aa0549f8…`, `v0.58.0`, production
             verification passed). Tightened acceptance on two finding-driven points only — named
             the authoritative injection path (`materializePacks` in `scripts/lib/pack-plan.mjs`,
             whose header defers guarantee-block injection to this item, per the steward's
             2026-08-24-2240 generator-gates correction), and **split** the bundled
             "local commands + CI green" criterion, because that exact bundling bounced
             generator-gates at the 2026-08-24-2244 DoD gate. Added `scripts/lib/pack-plan.mjs` to
             `touches`. No new requirement, no scope added, no architecture decision made.
- state:     ready
- needs:     Dispatch by `director-chief-of-staff` (lease + `owner`), then build. Ranked first
             because `pack-split-degraded-refusal` depends on **this** item at `shipped` and
             `pack-split-ci-partition-checks` needs it for the version-skew arm — it releases more
             of `dependency-guarantees` than anything else that is ready.
- artifacts: kai/coordination/items/pack-split-preflight-compat.md (v2);
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md (WS#4);
             kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
- evidence:  `scripts/lib/pack-plan.mjs` on `main` — `CONTRACT_SKILL = 'kai-core-contract-v1'`,
             `REFUSAL = 'KAI-CORE-MISSING'` exist as constants only ("materialised downstream, not
             on disk today"), and `materializePacks`'s header states guarantee-block injection is
             "added by downstream items, not here"; `scripts/lib/inherits-block.txt` is the working
             byte-pin precedent; `.github/workflows/validate.yml` already runs `pack-preview
             --self-test` and `--check` on every PR and push. Read 2026-08-25 from C:\src\kai.
- questions: none blocking. Two boundaries to hold: the **version-skew CI arm** is co-delivered by
             `pack-split-ci-partition-checks` (do not pull it forward), and the **degraded-mode
             block** is `pack-split-degraded-refusal`'s (this item ships the one-line refusal
             *token*, not the fuller block). Anything that grows past those routes to the steward
             as a scope question, not into the diff.
- next:      principal-swe-infra — build after dispatch; both `independent-architecture` and
             `independent-security` reviews must ratify the **same** `change_ref` before the ship gate.

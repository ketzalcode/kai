---
type: work-item
id: pack-split-release-12c-1-hardening
title: Release 12c-1 — pre-publish surface hardening (rollback derivation, provenance reversal, fixtures, CI matrix) on 1.0.1
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: product-change
state: in-review
resume_state: null
priority: 10
owner: principal-swe-infra
next_role: principal-sre
target: pack-split pre-publish hardening release (1.0.1; no marketplace surface change)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/northstar.md
  - kai/coordination/items/pack-split-release-12c.md
  - kai/coordination/items/pack-split-release-12b.md
  - kai/library/releases/2026-08-27/04-ship-pack-split-release-12b/ship-record.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/reference/plugin-structure.md
touches:
  - scripts/lib/pack-plan.mjs
  - scripts/validate-plugin.mjs
  - scripts/pack-preview.mjs
  - scripts/lib/migration-doctor.mjs
  - scripts/workspace-doctor.mjs
  - test/fixtures/host-installs.json
  - .github/workflows/validate.yml
  - docs/reference/plugin-structure.md
  - .github/plugin/marketplace.json
  - plugin.json
  - package.json
  - package-lock.json
  - packs/kai-core/
  - packs/kai-personal/
  - CHANGELOG.md
  - README.md
  - kai/coordination/
  - kai/initiatives/pack-split/
  - test/README.md
depends_on:
  - item: pack-split-release-12b
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-sre
    kind: independent-reliability
  - role: principal-security
    kind: independent-security
completed_reviews: []
change_ref: dd18a20b167d776c1baa28c7c4970e4e51a4c579
version: 6
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1700
---

## Outcome

The two-pack assumptions baked into the emergency-rollback gate, the migration
doctor's reverse path, the host fixture corpus and the per-pack CI matrix are
removed and proven, shipped as `1.0.1` **with no change to the published
marketplace surface** — the index still serves exactly `kai-core` +
`kai-personal`. After this release, publishing a third pack cannot bless a
monolith-plus-pack rollback index, cannot leave a refusal without a remediation
step, and cannot land on a CI matrix that ignores it.

## Acceptance

- [x] **(R1)** The `legacy-rollback` and `packs` required/forbidden plugin sets are **derived**,
      not the hardcoded `initialPackNames: ['kai-core', 'kai-personal']` literal at
      `scripts/validate-plugin.mjs:788`. The derivation must fail **closed** for packs published
      later: a `legacy-rollback` index that lists *any* name `packPluginName` can emit
      (`kai-core`, `kai-personal`, `kai-engineering`, `kai-product`, `kai-gtm`) is rejected, and a
      `packs` index must list exactly the published pack set. Self-test arms in
      `scripts/pack-preview.mjs` prove both directions by name, including a rollback index that
      still serves a department pack.
- [x] **(R1, docs)** `docs/reference/plugin-structure.md:203` ("forbidding the two pack entries")
      is re-derived from the same source of truth rather than restating a count.
- [x] **(R2)** With explicit `--rollback` intent,
      `workspace-provenance-ahead` emits the reverse remediation step only after
      the monolith is verified installed and enabled, every pack is absent, and
      both host evidence surfaces are readable. Forward migration never emits
      the reverse edit, and rollback output never recommends uninstalling the
      restored monolith. §Emergency rollback in
      `docs/reference/plugin-structure.md` matches this fail-closed mode.
- [x] **(R3)** A malformed-`settings.json` fixture home exists in `test/fixtures/host-installs.json`
      and covers **both** uncovered branches: the `enabled-state-unverified` finding and the
      `reconcileEnabledState` blanking path (unreadable and non-boolean `enabledPlugins`).
      `malformed-config` and `malformed-entries` cover `config.json` only.
- [x] **(R4)** The direct-install settings override-key shape is **documented as not
      host-measured** (the doctor assumes a bare `name` key where a marketplace install uses
      `name@marketplace`; the one measured host had an empty override map). Documentation only —
      measuring it is parked in the initiative backlog with a revisit trigger.
- [ ] **(R5)** Before merge, this release records: reviewed-ref ancestry
      (`git merge-base --is-ancestor <review> HEAD`), the records-only equivalence diff
      (`git diff --exit-code <review> HEAD -- . ':(exclude)kai/'`), and a **fresh** CI run at the
      actual final head. No merge on an attested equivalence or on a CI run a later records commit
      superseded.
- [x] **(R5, codified)** The three pre-merge stop conditions are written into
      §Release steps in `docs/reference/plugin-structure.md`, so the next three publishes inherit
      the protocol instead of re-deriving it from a ship record.
- [x] **(H4, manager-added; steward-amended 2026-08-27-1523 — see Notes)** The
      `runtime-dependencies` job in `.github/workflows/validate.yml:65-93` no longer hardcodes
      `pack: [kai-core, kai-personal]` with an unconditional `lectoria --help` assertion. Both the
      matrix and the dependency assertion are **derived**: the matrix from the committed pack set
      (`COMMITTED_PACKS`), and the per-leg assertion from `PACK_RUNTIME_DEPENDENCIES`, so a pack
      declaring **no** runtime dependencies (`engineering|product|gtm = []`) asserts no binary.
      **Provable at this release without a department tree:** the derived matrix at `1.0.1` is
      still exactly `kai-core` + `kai-personal` (nothing new is added to branch protection here),
      and a self-test/unit arm proves the derivation over the full declared partition — that a
      department entry with `[]` dependencies yields a leg with no binary assertion. The first
      **live** department leg is proved at `pack-split-release-12c-2-product`, which already
      carries that criterion. The bar this release must clear is that no publish PR ever has to
      edit CI to make its own pack legal.
- [x] `1.0.1` is coherent across every version surface (root `plugin.json`/`package.json`,
      marketplace `metadata.version` and both entry versions, both committed pack manifests and
      lockfiles), CHANGELOG entry + compare link and README stamp present, `release-guard` passes,
      `npm test` and `pack-preview --check` green.
- [x] The published marketplace surface is **unchanged**: exactly `kai-core` + `kai-personal`,
      `installSurface: packs`, no monolith entry, no department entry. This release hardens the
      gate; it publishes nothing.

## Evidence

- Review ref: `dd18a20b167d776c1baa28c7c4970e4e51a4c579`.
- `node scripts/release-guard.mjs --base origin/main --head HEAD`:
  `✓ release-guard: behavior change is bumped and release-noted`.
- `npm test`: passed; migration doctor 30 scenarios; pack-preview 178 checks.
- CI smoke: matrix `["kai-core","kai-personal"]`; both current runtime-binary
  queries return only `lectoria`.
- Pending: exact-ref SRE and security approvals, fresh final-head CI, merge,
  production verification, tag and GitHub release.

### Build pass 2026-08-27-1612 (`principal-swe-infra`)

The initial build session wrote the implementation but had no shell, so its
verification claims were intentionally withheld. The shell-capable continuation
below regenerated the committed trees, replaced the unsafe draft CI shape, and
produced the evidence that moved this item to `in-review`.

### Shell-capable continuation 2026-08-27-1630 (`principal-swe-infra`)

The blocking action was completed in the parent session. `pack-preview --write`
regenerated both committed trees, full `npm test` passed with 178 generator
self-tests and 30 migration scenarios, and the CI smoke output was exactly
`["kai-core","kai-personal"]` with `lectoria` for both current legs. The dynamic
matrix output now comes from the existing required `contract` job rather than a
new unprotected job, so a derivation failure fails a required check instead of
leaving accepted skipped runtime legs. The implementation is on branch
`fix/29-release-12c1-hardening`; exact release-guard proof follows the first
commit.

## Notes

- **Release/version: `1.0.1`.** Behavior paths (`scripts/`, `packs/`, `.github/plugin/marketplace.json`,
  `plugin.json`, `package.json`) are release-guard-classified, so this cannot land as a quiet fix.
  The exact number is whatever the next forward patch is at ship time; it stays inside `1.0.x`.
- **`delivery_class: product-change`** — the deliverable is hardened behavior, and the release is
  the vehicle. The three publishes that follow are `operational`, where the publish *is* the
  deliverable.
- **Reviews: `principal-sre` + `principal-security`** — the same pair that approved `12b`. This item
  changes the only path that exists to undo a bad flip (rollback derivation, provenance reversal)
  and the fixture corpus that proves the doctor's enabled-state judgment. The architect is not
  required here: no cross-service or cross-repo shape changes, and the generated-tree reviews sit
  on the three publish items.
- **Why this is a separate release rather than a rider on the first department publish
  (manager, 2026-08-27-1508).** Folding R1-R3 into `12c-2` would put the rollback-path fix and the
  first three-pack publication in **one irreversible ref**, and would entangle the SRE/security
  judgment on the rollback path with the judgment on a new published surface. Kept separate, the
  fix is provably in effect on `main`, CI-green and independently reviewed, **before** a third pack
  exists to be forbidden. The cost is one extra patch release that publishes nothing; the steward
  may reject that cost — see the negotiation in `pack-split-release-12c`.
- **H4 is manager-added, not new product scope.** Measured at
  `.github/workflows/validate.yml:65-93`: the matrix is `pack: [kai-core, kai-personal]` and every
  matrix leg runs `npm ci --prefix packs/<pack>` then
  `packs/<pack>/node_modules/.bin/lectoria --help`. `PACK_RUNTIME_DEPENDENCIES` at
  `scripts/lib/pack-plan.mjs:126-132` declares `engineering: []`, `product: []`, `gtm: []`, so a
  department leg would install nothing and then fail on a binary that was never meant to exist.
  Without H4 the first publish must edit CI *inside* the publish PR. It is placed here because it
  is the same shape as R1-R3 — a gate that hardcodes the two-pack surface. **The steward may route
  it to `pack-split-release-12c-2-product` instead**; that is a scope call, not a sizing one.
- **Adding a matrix leg adds a new required check name** (`runtime-dependencies (kai-<dept>)`).
  Branch protection is an `@operator` surface; the first publish must confirm the new check is
  required, or say plainly that it is running but not enforced. Raised here, owed at `12c-2`.
- Measured grounding for R1-R3, captured read-only 2026-08-27 from `C:\src\kai`:
  `marketplaceSurfacePolicy` at `scripts/lib/pack-plan.mjs:764-792` returns
  `forbiddenPluginNames: legacyRollback ? initialPackNames : [monolithName]`, and its sole caller
  passes the two-name literal (`scripts/validate-plugin.mjs:783-789`);
  `scripts/lib/migration-doctor.mjs:769` adds `workspace-provenance-ahead` with no `step(...)`
  while `:759-761` emits two for the forward case; `test/fixtures/host-installs.json` has
  `malformed-config` (`:214`) and `malformed-entries` (`:227`) and no malformed-`settings.json`
  home.
- A version bump regenerates the committed trees (`pack-preview --check` enforces byte parity), so
  `packs/kai-core/` and `packs/kai-personal/` are in `touches` even though no pack content changes.

### Steward pass 2026-08-27-1523 (`principal-product-manager`) — PROMOTED `proposed -> ready`

**The publish-nothing `1.0.1` is kept. The manager's scope negotiation #1 is decided
in favour of the extra cycle, and the cost is accepted with eyes open.**

- **Why the separate release wins.** R1 is not a tidy-up: it is the gate on the *only*
  path that undoes a bad flip. Folded into `12c-2`, the guard and the risk it guards
  arrive in **one irreversible ref** — and a revert of a bad first three-pack publish
  would revert the guard with it, which is precisely backwards. It also asks
  `principal-sre` and `principal-security` to judge a rollback-path change and a new
  published surface in a single pass; this initiative has bound both required reviews
  to one exact `change_ref` since `preflight-compat`, and that binding is worth more
  than a saved cycle. **Accepted cost:** one `1.0.1` build, two independent reviews,
  one ship walk, one operator merge/tag for a release that adds no marketplace entry.
  It changes nothing a user sees, which is exactly why it is cheap insurance against
  a non-negotiable being validator-blessed away.
- **H4 stays here, amended to be provable here.** The steward's placement rule was
  "wherever it must be complete before the first department publish" — that is this
  release, the last one before a third pack exists. But H4 as written could not be
  fully discharged at `1.0.1`: with `COMMITTED_PACKS = ['core', 'personal']` there is
  no department tree to run a leg against. So the criterion is split at its natural
  seam: the **derivation** lands and is self-tested here; the **first live department
  leg** is proved at `12c-2`, where it already is an acceptance line. The load-bearing
  guarantee is unchanged — no publish PR edits CI to make its own pack legal. This is
  a satisfiability amendment, not a reduction, and not new scope.
- **Reviews stay `principal-sre` + `principal-security`; no architect.** The change is
  a validator-policy derivation, a doctor remediation step, a fixture home and a CI
  matrix — reliability and trust-boundary surface, both reviewed by the pair that
  approved `12b`. **One stated condition:** if the derivation turns out to require a
  change to the partition/marketplace-topology *contract* rather than to its consumer
  (`marketplaceSurfacePolicy`'s caller), that is a scope question back to the steward
  and the architect is added — do not absorb it.
- **R4 stays documentation-only** and the measurement half stays parked in
  `kai/initiatives/pack-split/backlog.md` with its revisit trigger. Unchanged.
- **Promotion:** `state proposed -> ready`, `priority 20 -> 10` (this is the single
  executable head of the initiative), `next_role principal-product-manager ->
  principal-swe-infra`, `owner` and `lease` clear, v1 -> v2. `ready` is a steward
  commitment, not a dispatch: the director grants the lease. Scope, acceptance
  R1-R5, the `1.0.x` line, and operator-executed release remain as written.
- **Not negotiable at build time:** this release publishes **nothing**. If the work
  finds itself wanting to add a marketplace entry, generate a department tree, or move
  `COMMITTED_PACKS`, stop and route it to the steward — that is `12c-2`, a different
  ref and a different review pair.

### Build pass 2026-08-27-1612 (`principal-swe-infra`) — BLOCKED `ready -> blocked` (resume `in-progress`)

- **The steward's stated condition was not triggered.** R1 changed
  `marketplaceSurfacePolicy` — the *consumer* of the topology contract — and its sole
  caller. `PACKS`, `PACK_ORDER`, `COMMITTED_PACKS`, `packPluginName` and the
  `packs`/`legacy-rollback` install-surface modes are byte-unchanged. No architect
  addition, no scope route-back.
- **`legacy-rollback` semantics chosen, and what they now reject.** `packs` requires
  *exactly* the committed pack set, so a pack committed without a marketplace entry
  now errors, and an entry for a pack this repo has not committed now errors. Both
  fail closed and stay consistent because a publish PR moves `COMMITTED_PACKS` and the
  index in the same ref. Worth a reviewer's eye — it is stricter than the literal it
  replaced.
- **`@operator` branch-protection surface: a new job name appears.** The matrix values
  are unchanged (`kai-core`, `kai-personal`), so the required checks
  `runtime-dependencies (kai-core)` and `runtime-dependencies (kai-personal)` keep
  their names. But `runtime-dependencies` now `needs: runtime-dependency-matrix`, and
  that new job is **not** in branch protection. A skipped or failed derivation job
  would leave both required legs unrun rather than failing them. Confirm the new check
  is required before merge, or say plainly that it is running but not enforced. This
  is the `12c-2` note arriving one release early.
- **`packs/` was hand-mirrored, not generated.** `packs/kai-core/scripts/lib/pack-plan.mjs`,
  `.../lib/migration-doctor.mjs` and `.../workspace-doctor.mjs` were edited to match root
  by hand; every changed marker sits on an identical line number in both trees, which is
  evidence but not proof. `pack-preview --write` then `--check` must run before review.
- **Line endings are a real risk on this pass.** `.gitattributes` pins `scripts/**`,
  `test/fixtures/**` and `packs/**` to LF, but root `*.md`/`*.json` and `docs/` are CRLF
  in the working tree and the edits inserted LF lines into them. No CI check covers
  that; a normalizing commit or a `--renormalize` pass is the cheap fix.
- **Nothing was executed, generated, branched, committed, tagged, published, or merged.**
  See `Q-pack-split-release-12c-1-hardening-01`.

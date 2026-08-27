# Thread — pack-split-release-12c-1-hardening

Append-only communication log mirroring
`kai/coordination/items/pack-split-release-12c-1-hardening.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-27-1508 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record as the first slice of `pack-split-release-12c`. It
             carries the surface-wide hardening (R1-R3), the R4 documentation half, the R5
             pre-merge protocol both applied to this release and codified in
             `docs/reference/plugin-structure.md` §Release steps, and one manager-added
             prerequisite (H4, the per-pack CI matrix). Size **L**. Ships `1.0.1` and publishes
             **nothing** — the marketplace surface stays exactly `kai-core` + `kai-personal`.
             Owner `principal-swe-infra`; reviews `principal-sre` / independent-reliability +
             `principal-security` / independent-security, the pair that approved 12b. Sole typed
             dependency `pack-split-release-12b` at `shipped` — already satisfied.
- state:     proposed
- needs:     Steward promotion. This is the **first executable item** of the decomposition: no
             unmet dependency, and it must land before any third pack is published.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-release-12c-1-hardening.md;
             kai/coordination/items/pack-split-release-12c.md
- evidence:  Measured read-only 2026-08-27 from C:\src\kai. R1: `marketplaceSurfacePolicy`
             (`scripts/lib/pack-plan.mjs:764-792`) returns
             `forbiddenPluginNames: legacyRollback ? initialPackNames : [monolithName]`, and its
             only caller passes the literal `['kai-core','kai-personal']`
             (`scripts/validate-plugin.mjs:783-789`). R2: `scripts/lib/migration-doctor.mjs:769`
             adds `workspace-provenance-ahead` with no `step(...)` while `:759-761` emits two for
             the forward case. R3: `test/fixtures/host-installs.json` has `malformed-config`
             (`:214`) and `malformed-entries` (`:227`), no malformed-`settings.json` home. H4:
             `.github/workflows/validate.yml:65-93` hardcodes `pack: [kai-core, kai-personal]` and
             asserts `lectoria --help` on every leg, while
             `PACK_RUNTIME_DEPENDENCIES.product|engineering|gtm` are `[]`
             (`scripts/lib/pack-plan.mjs:126-132`) — a department leg would install nothing and
             then fail on a binary that never existed.
- questions: none blocking. Two steward calls are recorded in `pack-split-release-12c`: whether the
             extra publish-nothing release is worth its cost, and whether H4 belongs here or on
             `pack-split-release-12c-2-product`.
- next:      principal-product-manager — groom and promote; then `principal-swe-infra` builds.
             No tree was generated, no marketplace edited, nothing merged, tagged or published.

## HANDOFF 2026-08-27-1523 — principal-product-manager -> principal-swe-infra

- did:       **Steward pass: PROMOTED `proposed -> ready`** (v1 -> v2), `priority 20 -> 10`,
             `next_role -> principal-swe-infra`, owner and lease clear. Decided manager scope
             negotiation #1 in favour of **keeping** the separate publish-nothing `1.0.1`: R1
             guards the only path that undoes a bad flip, and folding it into the first
             three-pack publish would put the guard and the risk it guards in one irreversible
             ref and entangle two independent judgments in one review pass. Accepted cost: one
             extra release cycle that adds no marketplace entry. **H4 stays here** — this is the
             last release before a third pack exists — **amended to be provable here**: the
             matrix derives from `COMMITTED_PACKS` and the per-leg assertion from
             `PACK_RUNTIME_DEPENDENCIES`, self-tested over the full declared partition; the first
             *live* department leg is proved at `12c-2`, which already carries it.
- state:     ready
- needs:     A director lease, then build. This is the **single executable head** of the
             initiative. `pack-split-review-lens-binding` runs in parallel under a different
             owner on a disjoint touch set — no touch conflict at dispatch.
- workspace: C:\src\kai
- artifacts: kai/coordination/items/pack-split-release-12c-1-hardening.md;
             kai/initiatives/pack-split/northstar.md
- evidence:  Dependency `pack-split-release-12b` verified `shipped` at v15 on its authoritative
             record. R1 hardcode re-verified read-only this pass at
             `scripts/validate-plugin.mjs:788` (`initialPackNames: ['kai-core','kai-personal']`);
             H4 re-verified at `.github/workflows/validate.yml:65-93` (`pack: [kai-core,
             kai-personal]`, unconditional `lectoria --help`) against
             `PACK_RUNTIME_DEPENDENCIES.engineering|product|gtm = []`
             (`scripts/lib/pack-plan.mjs:126-132`).
- questions: none blocking. One stated condition: if the R1 derivation requires changing the
             partition/marketplace-topology **contract** rather than its consumer, stop and route
             it to the steward — the architect is added then, and not before.
- next:      principal-swe-infra — build to `in-review` at one ref, then `principal-sre` +
             `principal-security` at that exact ref. **This release publishes nothing:** the index
             must still serve exactly `kai-core` + `kai-personal` when it ships. No tree, no
             marketplace entry, no `COMMITTED_PACKS` move. Steward changed no code, generated
             tree, marketplace, version, tag, release or publication state, and dispatched nothing.

## HANDOFF 2026-08-27-1612 — principal-swe-infra -> @operator

- did:       Wrote the whole change set for R1-R5 + H4 and the `1.0.1` release metadata into the
             `C:\src\kai` working tree. **Executed nothing.** This session had no shell tool
             (`view` / `create` / `edit` / `grep` / `glob` only), so no test, no generator run, no
             `git` command, no branch and no commit happened. The implementation is reviewable as
             a working-tree diff and nothing more.
             R1: `marketplaceSurfacePolicy` (`scripts/lib/pack-plan.mjs:794-829`) now derives both
             sets — `publishedPackNames` from `COMMITTED_PACKS`, `publishablePackNames` from
             `PACK_ORDER` — so `legacy-rollback` forbids every name `packPluginName` can emit and
             `packs` requires exactly the committed set while forbidding the monolith and every
             unpublished pack. The `initialPackNames: ['kai-core','kai-personal']` literal is gone
             from `scripts/validate-plugin.mjs`. Eight self-test arms in `scripts/pack-preview.mjs`
             assert both directions by derived name, including a rollback index that still serves a
             department pack and a `packs` index serving an unpublished one.
             R2: `workspace-provenance-ahead` emits the reverse one-key remediation plus the
             re-check step (`scripts/lib/migration-doctor.mjs:781-789`), mirroring `:765-769`,
             conditioned on a deliberate rollback so it does not contradict the `legacy-installed`
             uninstall steps the same path already emits. §Emergency rollback gains a matching
             step 5.
             R3: `malformed-settings` and `nonboolean-enabled-state` homes in
             `test/fixtures/host-installs.json`; both drive `readSettings` to `ok: false`, which is
             the branch that blanks a config-declared `enabled: true` **and** raises
             `enabled-state-unverified`. Two matrix cases plus a direct assertion that the
             inventory reports `enabled: null`. Matrix 26 -> 28, `test/README.md` updated.
             R4: documented as inferred at `scripts/lib/migration-doctor.mjs:19-25` and `:321-323`.
             No measurement gate added; the measurement half stays parked.
             R5: the three pre-merge stop conditions are written into §Release steps 3.
             H4: `runtimeDependencyMatrix()` in `pack-plan.mjs`, `--ci-matrix` /
             `--ci-runtime-binaries` in `pack-preview.mjs`, and a `runtime-dependency-matrix` job
             feeding `runtime-dependencies` through `fromJSON`. The per-leg loop asserts only the
             binaries the pack declares, so a `[]`-dependency department installs its lockfile and
             asserts nothing.
             `1.0.1` written across root manifests + lockfile, marketplace metadata and both
             entries, both pack manifests + lockfiles, CHANGELOG section + compare link, README
             stamp. Marketplace surface untouched: exactly `kai-core` + `kai-personal`,
             `installSurface: packs`.
- state:     blocked (resume_state `in-progress`, v2 -> v3)
- needs:     A shell-capable session or an operator run of the validation and the commit. See
             `Q-pack-split-release-12c-1-hardening-01`. Until then this cannot honestly reach
             `in-review`: there is no `change_ref` for `principal-sre` and `principal-security` to
             bind to, and every acceptance box is written but unproven.
- workspace: C:\src\kai — **carries an uncommitted implementation**. Do not dispatch a peer onto
             this touch set until the tree is committed or discarded.
- artifacts: scripts/lib/pack-plan.mjs; scripts/validate-plugin.mjs; scripts/pack-preview.mjs;
             scripts/lib/migration-doctor.mjs; scripts/workspace-doctor.mjs;
             test/fixtures/host-installs.json; test/README.md; .github/workflows/validate.yml;
             docs/reference/plugin-structure.md; .github/plugin/marketplace.json; plugin.json;
             package.json; package-lock.json; CHANGELOG.md; README.md;
             packs/kai-core/{plugin,package,package-lock}.json;
             packs/kai-personal/{plugin,package,package-lock}.json;
             packs/kai-core/scripts/{lib/pack-plan.mjs,lib/migration-doctor.mjs,workspace-doctor.mjs};
             kai/coordination/items/pack-split-release-12c-1-hardening.md
- evidence:  **Inspection only — no command output exists.** Cross-tree check: every changed marker
             in the three mirrored files sits on an identical line number in root and
             `packs/kai-core/` (`binary: 'lectoria'` :145, `runtimeDependencyMatrix` :157,
             forbidden-entry message :751, `marketplaceSurfacePolicy` :794, reverse step :785,
             override-key comment :322-323, new fixture case :701, blanking loop :961). Read-back
             confirms the R3 fixtures hit the intended branch: a non-boolean value in
             `enabledPlugins` makes `readSettings` return `ok: false`
             (`migration-doctor.mjs:296-301`), which `reconcileEnabledState` turns into
             `enabled: null` for every entry (`:305-313`) and `assessHost` reports as
             `enabled-state-unverified` (`:582-585`). CI check-name stability: the matrix values
             stay `kai-core` / `kai-personal`, so the two existing required checks keep their
             names.
- questions: Q-pack-split-release-12c-1-hardening-01 (blocking, `@operator`). Two non-blocking
             notes for the reviewers. (1) **New CI job in the dependency chain:**
             `runtime-dependencies` now `needs: runtime-dependency-matrix`, and that new job is not
             in branch protection — a skipped derivation would leave both required legs unrun
             rather than failed. Confirm it is required, or say plainly it is running unenforced.
             (2) **R1 is stricter than the literal it replaced:** `packs` now requires *exactly*
             the committed set, so a committed pack without an index entry, or an index entry for
             an uncommitted pack, is an error. Both fail closed and stay consistent because a
             publish PR moves `COMMITTED_PACKS` and the index in one ref — but it is a real
             behavior widening worth a reviewer's eye.
             The steward's stated condition did **not** fire: R1 changed the consumer
             (`marketplaceSurfacePolicy` and its caller), not the partition/topology contract —
             `PACKS`, `PACK_ORDER`, `COMMITTED_PACKS`, `packPluginName` and the install-surface
             modes are byte-unchanged. No architect added.
- next:      @operator — resolve the shell gap, then `principal-swe-infra` runs `npm test`,
             `node scripts/pack-preview.mjs --write` (the `packs/` mirrors were written by hand;
             byte parity against the generator is unproven), `--check`,
             `node scripts/release-guard.mjs --base origin/main --head HEAD`, and a
             `--ci-matrix` / `--ci-runtime-binaries kai-core` smoke check; then branch, commit, and
             move to `in-review` for `principal-sre` + `principal-security` at that exact ref.
             Nothing was merged, tagged, released or published, and no marketplace entry, generated
             tree or `COMMITTED_PACKS` value was changed.

## QUESTION Q-pack-split-release-12c-1-hardening-01 2026-08-27-1612 — principal-swe-infra -> @operator
- status: answered
- kind: action
- blocking: yes
- context: The build session was dispatched to take this item to `in-review`, which requires
  `npm test`, generated-parity regeneration, the exact release guard against `origin/main`, a
  feature branch and a local commit. The session had no shell/exec tool — only file read and edit
  — so none of it could run. The implementation is complete in the `C:\src\kai` working tree and
  unverified, uncommitted, and unbranched. Reviews cannot start: `principal-sre` and
  `principal-security` bind to an exact `change_ref` that does not exist. Leaving the tree dirty
  and unrecorded was the worse option, so it is recorded here instead.
- ask: Re-dispatch `principal-swe-infra` in a shell-capable session against this same working
  tree (preferred — the diff is already written), or run the validation and commit directly. If
  the tree has been discarded, say so and the implementation will be rebuilt from this record.
- answer_by: next-dispatch
- answer: The shell-capable parent session retained the working tree, created
  `fix/29-release-12c1-hardening`, regenerated committed packs, and ran the full
  suite plus CI-matrix smoke successfully. The initial branch-protection concern
  was removed rather than accepted: the existing required `contract` job now
  emits the matrix, and `runtime-dependencies` needs that job. No new required
  check name is introduced.

## NOTE 2026-08-27-1630 — principal-swe-infra

- did:       Continued the written implementation in a shell-capable parent.
             Replaced the separate unprotected matrix job with an output from
             the existing required `contract` job, regenerated both committed
             packs, and validated the full tree.
- state:     in-progress
- needs:     Commit the implementation, run the exact release guard against
             `origin/main`, then bind SRE and security review to that ref.
- artifacts: .github/workflows/validate.yml; scripts/lib/pack-plan.mjs;
             scripts/pack-preview.mjs; scripts/lib/migration-doctor.mjs;
             test/fixtures/host-installs.json; packs/kai-core/
- evidence:  `npm test` passed; pack-preview self-test 178; migration matrix 28;
             `--ci-matrix` = `["kai-core","kai-personal"]`;
             both current runtime-binary queries = `lectoria`.
- questions: none
- next:      principal-swe-infra — create the reviewable implementation ref.

## HANDOFF 2026-08-27-1640 — principal-swe-infra -> principal-sre

- did:       Committed the complete 1.0.1 hardening implementation and the
             settled review-lens decision at exact ref
             `ca622854699cb8e0b64087033b99f27d2201cc7a`.
- state:     in-review
- needs:     Independent reliability review at the exact ref. Security review
             runs independently against the same ref.
- artifacts: `.github/workflows/validate.yml`; `scripts/lib/pack-plan.mjs`;
             `scripts/pack-preview.mjs`; `scripts/lib/migration-doctor.mjs`;
             `scripts/workspace-doctor.mjs`; `docs/reference/plugin-structure.md`
- evidence:  Full `npm test` passed; 178 generator checks; 28 migration
             scenarios; exact release guard passed against `origin/main`.
- questions: none
- next:      principal-sre — approve or return blocking findings.

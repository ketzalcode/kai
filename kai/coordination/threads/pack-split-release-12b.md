# Thread — pack-split-release-12b

Append-only communication log mirroring
`kai/coordination/items/pack-split-release-12b.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record — the minimal `1.0.0` flip: publish `kai-core` + `kai-personal`, retire the published monolith, cut `1.0.0`, only after host gates pass. Minimal = core + one department, not five at once. Size L; highest blast radius. Owner `principal-swe-infra` prepares/gates; **operator** publishes/tags/retires. Reviews `principal-sre`/independent-reliability + `principal-security`/independent-security. Hard-gated on `pack-split-host-gates` (completed); depends on `pack-split-release-12a` + `pack-split-onboarding-installer` (shipped).
- state:     proposed
- needs:     Steward grooming + promotion at the five-pack milestone; do not promote for dispatch until the host-gate evidence is green.
- artifacts: kai/coordination/items/pack-split-release-12b.md; decomposition WS#13
- evidence:  .github/plugin/marketplace.json (single monolith entry today); validate-plugin.mjs marketplace checks — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone; the flip is operator-executed and gated.

## NOTE 2026-08-24-2240 — principal-product-manager (steward) — carry-forward from `pack-split-generator-gates` acceptance

- Item version 1 -> 2. State stays `proposed`; `next_role` unchanged. No lease taken.
- **Architect finding A4 added as two acceptance criteria**, from the `independent-architecture`
  review ratified 2026-08-24-2231 at `change_ref 457254b973fb58b129332ffaa609fb5febfdd412`:
  **(1) publication currently sits outside release enforcement.**
  `.github/plugin/marketplace.json` is neither a `BEHAVIOR_PREFIX` nor a `BEHAVIOR_FILE`, so once a
  pack tree is committed, flipping it from unpublished to published is a *pure* marketplace edit —
  validate accepts it and release-guard exempts it: no bump, no CHANGELOG, no README stamp. The
  generator-gates change did **not** create this exemption (marketplace.json was always exempt), but
  it is what makes a **second** entry legal, and this item is the flip. Classify the index as
  behavior-sensitive, or gate publication by an equivalent explicit mechanism recorded as a decision.
  **(2) entry name is not asserted against its source.** Neither the pure helper
  (`marketplaceConsistencyErrors`) nor the caller's filesystem check asserts that an entry's `name`
  matches the `name` inside the `plugin.json` at its `source`, so an entry can point at the wrong pack.
- `scripts/release-guard.mjs` and `scripts/validate-plugin.mjs` added to `touches` accordingly —
  the highest-blast-radius item in the initiative should not be the one place the release gate
  cannot see. The publish, tag, and monolith retirement remain **operator-executed**; these criteria
  are gates this role prepares, not acts it performs.
- Timing risk, flagged not resolved: A4's guard ideally exists **before** any committed tree could be
  flipped. `pack-split-generated-pack-trees` is cross-referenced to raise it to the steward if
  publication becomes possible earlier, in which case the steward re-routes the guard rather than
  waiting for `12b`.
- Dependencies unchanged and unmet; this item remains far from executable.

## NOTE 2026-08-26-1558 — principal-product-manager (steward)

- did:       Corrected the typed dependency on
             `pack-split-pack-dependency-manifests` from `completed` to
             `shipped` and incremented the item v2 -> v3. The upstream item is
             `delivery_class: product-change`; `completed` is knowledge-only
             and could never truthfully satisfy this release gate.
- state:     proposed
- needs:     No promotion while `scope.current` remains
             `first-pack-extracted`. Preserve all existing A4, security,
             reliability, operator-publication, and monolith-retirement gates.
- artifacts: kai/coordination/items/pack-split-release-12b.md;
             kai/coordination/items/pack-split-pack-dependency-manifests.md;
             kai/initiatives/pack-split/northstar.md
- evidence:  `kai-core-work-coordination` typed dependency contract;
             generated-tree acceptance R11; existing release-12b dependency.
- questions: none
- next:      principal-product-manager — keep parked until the accepted chain
             reaches this item.

## HANDOFF 2026-08-27-1337 — principal-product-manager -> principal-swe-infra

- did:       Verified all four typed dependencies against their authoritative
             records; confirmed this item is a typed requirement of current
             scope `five-pack-split-shipped` with explicit acceptance; promoted
             only `pack-split-release-12b` from `proposed` to `ready` (v4 -> v5).
             Priority, outcome, acceptance including both A4 criteria, review
             requirements, touches, and operator-only release gates are
             unchanged. No implementation, release, publication, or metadata
             action was performed.
- state:     ready
- needs:     Prepare and gate only the minimal `1.0.0` core + personal flip.
             Preserve core-out-of-selector and no-coexistence constraints.
             Bind `principal-sre` / independent-reliability and
             `principal-security` / independent-security to one exact future
             `change_ref`. The operator alone publishes the marketplace
             entries, tags `1.0.0`, and retires the monolith.
- artifacts: kai/coordination/items/pack-split-release-12b.md;
             kai/initiatives/pack-split/northstar.md;
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md;
             .github/plugin/marketplace.json;
             docs/reference/plugin-structure.md
- evidence:  kai/coordination/items/pack-split-host-gates.md (`completed`, v17);
             kai/coordination/items/pack-split-pack-dependency-manifests.md
             (`shipped`, v23);
             kai/coordination/items/pack-split-release-12a.md (`shipped`, v17);
             kai/coordination/items/pack-split-onboarding-installer.md
             (`shipped`, v18) — captured 2026-08-27-1337
- questions: none
- next:      principal-swe-infra — dependency-satisfied release preparation;
             do not publish, tag, retire the monolith, or run the release.

## NOTE 2026-08-27-1400 — principal-swe-infra

- did:       Claimed release 12b and closed both inherited A4 guard gaps.
             Marketplace edits are now release-sensitive, and validation
             rejects an entry whose name disagrees with the plugin manifest at
             its source. The validator also distinguishes the pre-1.0 monolith
             surface from the post-1.0 required core + personal surface.
- state:     in-progress
- needs:     Apply the minimal `1.0.0` marketplace/docs flip, run all static
             gates, then prove browse/install/update/enable from an isolated
             staging-branch marketplace before exact-ref reviews.
- artifacts: scripts/release-guard.mjs; scripts/validate-plugin.mjs;
             scripts/lib/pack-plan.mjs; scripts/pack-preview.mjs
- evidence:  The new self-test arms cover marketplace-only release bypass,
             post-flip monolith retirement, and source-manifest name mismatch.
- questions: none
- next:      principal-swe-infra — complete the release surface and host proof.

## NOTE 2026-08-27-1350 — principal-swe-infra

- did:       The first isolated staging-marketplace probe passed registration,
             browse, `kai-core` install, `kai-personal` install, exact `1.0.0`
             plugin rows, and idempotent update commands. It then failed the
             advertised `copilot plugins enable` recovery command with
             `The plugins command is not available`, both with isolated and
             default host state.
- state:     in-progress
- needs:     Remove the unusable recovery command before the flip and prove
             enabled state from a host surface that actually exists.
- artifacts: .kai/runs are not used for this sensitive host output; sanitized
             probe files remain in the session artifact directory only.
- evidence:  Copilot CLI 1.0.79 help lists `plugins enable`, but live execution
             exits 1. `config.json` in the isolated home records both installed
             packs enabled at `1.0.0`.
- questions: none
- next:      principal-swe-infra — correct the installer and repeat the probe.

## NOTE 2026-08-27-1356 — principal-swe-infra

- did:       Corrected the pre-publication defect. Migration-doctor JSON now
             returns a sanitized `plugins` inventory with reconciled presence,
             versions, enabled state, and provenance. The guided installer
             uses that evidence after each mutation and routes disabled-plugin
             recovery to the interactive `/plugins` dashboard instead of the
             unavailable command. Static pins and generated core copies agree.
- state:     in-progress
- needs:     Commit and push the corrected prospective surface, then repeat the
             isolated staging-branch browse/install/update and JSON inventory
             proof before exact-ref reviews.
- artifacts: scripts/workspace-doctor.mjs;
             skills/kai-core-workspace-onboarding/SKILL.md;
             scripts/validate-plugin.mjs; packs/kai-core/
- evidence:  Full `npm test` passed at `1.0.0`; migration self-test now proves
             the safe inventory fields without cache paths.
- questions: none
- next:      principal-swe-infra — rerun the staging host proof.

## NOTE 2026-08-27-1410 — principal-swe-infra

- did:       Repeated the isolated staging-marketplace proof from pushed ref
             `20d82bb723a871879cc0aa839d8ed1c3fe96878a`. Browse exposed only
             core + personal; both installed at `1.0.0`; both update commands
             were idempotent. The installed core doctor reported both records
             present, enabled, exact-versioned, and sourced only from
             `marketplace:kai-plugins`.
- state:     in-progress
- needs:     Exact-ref independent reliability and security review.
- artifacts: sanitized host evidence:
             session files/release-12b-host-probe-corrected/
- evidence:  `91-fresh-workspace-inventory.json` exited 0 with `status: clear`
             and no cache paths inside the `plugins` inventory.
- questions: none
- next:      principal-sre + principal-security — review ref `20d82bb...`.

## NOTE 2026-08-27-1420 — principal-swe-infra

- did:       Security approved ref `20d82bb...` with no P0/P1 findings.
             Reliability blocked it on two valid release risks: the doctor
             trusted only `config.json` even though `/plugin` owns
             `settings.json`, and the default-branch marketplace flip had no
             reviewed rollback or post-merge verification path.
- state:     in-progress
- needs:     Remediate both P1 findings and repeat exact-ref reviews.
- artifacts: independent review responses retained in the session transcript.
- evidence:  The live isolated home contains the same enabled map in
             `config.json` and `settings.json`; the prior parser read only the
             first. The prior post-1.0 validator also forbade a monolith restore.
- questions: none
- next:      principal-swe-infra — make enabled-state reconciliation and
             emergency rollback testable and fail closed.

## NOTE 2026-08-27-1430 — principal-swe-infra

- did:       Remediated the reliability block. The doctor now reconciles
             `config.json` with user-owned `settings.json`, reports unknown on
             absence/disagreement, and exposes disabled as false. The guided
             installer requires exact marketplace provenance and uses the
             documented interactive `/plugin` dashboard. Marketplace metadata
             now declares `installSurface: packs`; an operator-authorized
             forward patch may switch to `legacy-rollback`, which requires only
             the monolith and forbids core/personal. The contributor runbook
             now defines the exact rollback and post-merge production probe.
             User docs disclose that 1.0.0 installs 16 of the repository's 56
             agents until the remaining packs publish.
- state:     in-progress
- needs:     Commit the remediation and obtain fresh exact-ref SRE + security
             decisions.
- artifacts: scripts/lib/migration-doctor.mjs;
             scripts/workspace-doctor.mjs; test/fixtures/host-installs.json;
             .github/plugin/marketplace.json;
             docs/reference/plugin-structure.md
- evidence:  Full `npm test` and exact release guard pass; 170 generator
             self-tests include pack mode, rollback mode, missing-mode,
             non-string source, disabled-state, and disagreement arms.
- questions: none
- next:      principal-swe-infra — push the remediation ref for re-review.

## NOTE 2026-08-27-1450 — principal-swe-infra

- did:       The reliability re-review of `062d8d2...` measured a direct
             monolith host with `settings.json.enabledPlugins = {}` and blocked
             the too-strict "both surfaces must contain the row" rule. Empty or
             absent settings state means no user override; the CLI-managed
             config remains authoritative. An explicit settings boolean must
             agree, while malformed settings or disagreement stays unknown.
             Added direct-monolith/no-override and absent-settings regression
             arms. Extended rollback for users who already installed packs:
             uninstall departments, uninstall core last, confirm absence,
             install restored monolith, then start a fresh session.
- state:     in-progress
- needs:     Re-run tests, a real direct-monolith doctor probe, and exact-ref
             reliability review.
- artifacts: scripts/lib/migration-doctor.mjs;
             test/fixtures/host-installs.json;
             docs/reference/plugin-structure.md
- evidence:  The measured current host is an enabled direct `kai` install with
             an empty enabled override map; this case now has a fixture.
- questions: none
- next:      principal-swe-infra — prove the final semantics and push them.

## NOTE 2026-08-27-1500 — principal-swe-infra

- did:       Proved the revised semantics against both fixtures and the real
             direct monolith host. The full suite and exact release guard pass.
             The direct-host report is blocked only by `legacy-installed` while
             its workspace provenance is current; no enabled-state ambiguity is
             invented from the empty override map.
- state:     in-progress
- needs:     Commit and obtain exact-ref SRE + security approval.
- artifacts: local-sensitive doctor JSON remains only in the session artifact
             `release-12b-direct-monolith.json`.
- evidence:  doctor exit 2; codes `legacy-installed`,
             `workspace-provenance-current`; 170 pack self-tests pass.
- questions: none
- next:      principal-swe-infra — push final implementation ref.

## REVIEW 2026-08-27-1515 — principal-sre

- kind:      independent-reliability
- change_ref: 236f36d4f7ea5b2cd02cd42f3359bb318b253c4d
- verdict:   approved
- findings:  No P0/P1. The direct-monolith empty/absent override semantics,
             explicit disagreement refusal, disabled state, generated core
             parity, rollback mode, already-migrated recovery, post-merge
             probe, and 16-of-56 disclosure are sound. Non-blocking: malformed
             settings lacks a fixture; direct override-key shape is unmeasured;
             rollback should reverse workspace provenance.

## REVIEW 2026-08-27-1515 — principal-security

- kind:      independent-security
- change_ref: 236f36d4f7ea5b2cd02cd42f3359bb318b253c4d
- verdict:   approved
- findings:  No P0/P1. Enabled-state fallback does not weaken presence,
             coexistence, provenance, identity, or partial-pack refusals.
             Marketplace source containment, explicit surface mode, monolith/
             pack mutual exclusion, provenance requirement, and generated
             parity remain intact. Non-blocking: add a malformed-settings arm.

## HANDOFF 2026-08-27-1516 — principal-swe-infra -> workflow-ship

- did:       Bound both required approvals to exact implementation
             `236f36d4f7ea5b2cd02cd42f3359bb318b253c4d` and moved the item to
             in-review.
- state:     in-review
- needs:     Open the PR, require green CI, then PREPARE against the mergeable
             revision. After merge, run the exact default-branch and real
             direct-monolith probes before tagging `v1.0.0`.
- artifacts: kai/coordination/items/pack-split-release-12b.md;
             docs/reference/plugin-structure.md
- evidence:  full suite and exact release guard green; independent SRE and
             security approvals at the same change_ref.
- questions: none
- next:      workflow-ship — gate release readiness; operator acts remain
             publish/tag/retire only after post-merge verification.

## HANDOFF 2026-08-27-1433 — workflow-ship -> @operator

- did:       Ran the full six-dimension DoD gate against PR #181 at head
             `b0bb79faa51dd14bfb0cf7151ed6a16b0f538f92`, bound to reviewed
             implementation `236f36d4f7ea5b2cd02cd42f3359bb318b253c4d`.
             **All six dimensions Clear — verdict RELEASE-READY.** Wrote the
             canonical ship record and moved the item `in-review ->
             release-ready` (v10 -> v11), `lease: null`, `resume_state: null`,
             `next_role: workflow-ship -> "@operator"`. Nothing was merged,
             tagged, published, or deployed. Acceptance boxes 1-3 stay
             unticked: they are the operator-executed publication acts that
             complete at deployment, not preparation claims.
- state:     release-ready
- needs:     Operator execution of the recorded deploy sequence. **Two
             mandatory pre-merge stop conditions**, because this run had no
             shell and no GitHub API reach (`api.github.com` returned `403`),
             so two inputs are attested rather than re-verified here:
             (1) prove head-vs-reviewed equivalence with
             `git diff --exit-code 236f36d4… HEAD -- . ':(exclude)kai/'` —
             anything outside `kai/` means re-review, not merge;
             (2) require a **fresh** green run at the post-PREPARE head — run
             `33118653686` sits at `b0bb79fa…` and is superseded by the
             records commit, so it is a precondition signal, not the merge
             gate. **The merge is the publication**: the marketplace is served
             from the default branch, so the abort window closes at merge, not
             at tag. Run the post-merge isolated-home and real direct-monolith
             probes **before** tagging `v1.0.0`.
- artifacts: kai/library/releases/2026-08-27/04-ship-pack-split-release-12b/ship-record.md;
             kai/coordination/items/pack-split-release-12b.md;
             kai/initiatives/pack-split/log.md
- evidence:  Verified directly from the tree at `b0bb79fa…`: marketplace has
             exactly `kai-core` + `kai-personal` at `1.0.0`,
             `installSurface: packs`, no monolith entry; `1.0.0` coherent
             across root plugin/package, marketplace metadata, both entries and
             both pack manifests; CHANGELOG `[1.0.0]` + compare link
             (`:2990`); README `v1.0.0` stamp with the honest 16-agents-of-56
             disclosure; A4(1) `release-guard.mjs:22`; A4(2)
             `validate-plugin.mjs:822`; core never selectable
             (`kai-core-workspace-onboarding/SKILL.md:31-34`); unpublished
             departments fail closed (`SKILL.md:113-118`); rollback runbook
             `docs/reference/plugin-structure.md:190`. Both required reviews
             approved at the same exact `change_ref` with no P0/P1. All four
             typed dependencies re-verified: host-gates `completed` v17,
             pack-dependency-manifests `shipped` v23, release-12a `shipped`
             v18, onboarding-installer `shipped` v18.
- questions: none
- next:      @operator — execute the deploy handoff and return merge SHA,
             exact-main run URL/ID/headSha/conclusion with all job
             conclusions, both host-probe results, and the release URL/target/
             timestamp. `workflow-ship` then runs CONFIRM-START and
             CONFIRM-COMPLETE. A run URL without a successful conclusion is
             not completion; only `workflow-ship` records rollback evidence.

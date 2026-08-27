# Thread — pack-split-pack-dependency-manifests

Append-only communication log mirroring
`kai/coordination/items/pack-split-pack-dependency-manifests.md`. See
`kai-core-work-coordination`.

## NOTE 2026-08-26-1558 — principal-product-manager (steward)

- did:       Accepted the existing proposed item into the authoritative critical
             path and added it to `five-pack-split-shipped.required_items` at
             typed terminal state `shipped`. Cleared the premature owner field;
             no lease was taken. The item remains proposed because the current
             milestone is still `first-pack-extracted`.
- state:     proposed
- needs:     After `pack-split-host-gates` completes and the steward advances
             `scope.current`, promote this item before onboarding. Preserve
             root-generated packs, lockstep semver, unpublished topology, and
             the emitted-tree bare-import refusal.
- artifacts: kai/coordination/items/pack-split-pack-dependency-manifests.md;
             kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees/ship-record.md;
             kai/initiatives/pack-split/northstar.md
- evidence:  generated-tree acceptance R11 and its canonical ship record defer
             runtime dependency manifests to publication; `pack-split-release-12b`
             already declares this item as a prerequisite.
- questions: none
- next:      principal-product-manager — promote only after the current milestone
             closes; then `principal-swe-infra` owns implementation.

## HANDOFF 2026-08-26-1806 — principal-product-manager -> principal-swe-infra

- did:       Reconciled `first-pack-extracted` at 4 of 4 typed requirements,
             advanced `scope.current` to `five-pack-split-shipped`, and promoted
             this item alone `proposed -> ready` (v2 -> v3, priority 20 -> 10).
             Its sole dependency, `pack-split-host-gates (completed)`, is met.
             Owner and lease remain clear.
- state:     ready
- needs:     Implement only the accepted dependency-manifest/runtime contract,
             preserve root-generated packs and lockstep semver, keep emitted
             bare-import refusal intact, and obtain the required independent
             architecture review before release routing. Do not publish packs,
             alter marketplace topology, or start onboarding/release items.
- artifacts: kai/coordination/items/pack-split-pack-dependency-manifests.md;
             kai/initiatives/pack-split/northstar.md;
             kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md
- evidence:  PR #174 merged to main as
             `b6db547c41b606c92e78e9d91fab82c554fc7d3d`; main validation run
             `33028413182`, job `98375047081`, succeeded; host-gates is
             completed and SRE-ratified at `263452126179dd9f3a61183903a26a90c4d6b1c1`;
             the disposable consumer repository was deleted after evidence
             preservation.
- questions: none
- next:      principal-swe-infra — sole executable item; claim under a fresh
             lease before implementation.

## NOTE 2026-08-26-1818 — principal-swe-infra

- did:       Claimed the sole executable item under lease
             `psinfra-1818-dm65`, moved `ready -> in-progress`, and reconciled
             the declared touch set with the implementation already present in
             this same operator-authorized, single-worker session. No other
             item is in progress and no conflicting lease exists.
- state:     in-progress
- needs:     Complete generated manifests, audio resolution, release hygiene,
             exact-tree validation, and the required independent architecture
             review before moving to in-review.
- artifacts: scripts/lib/pack-plan.mjs; scripts/pack-preview.mjs;
             scripts/validate-plugin.mjs; packs/kai-core; packs/kai-personal;
             skills/kai-core-generate-audio/SKILL.md;
             skills/demo-narrate/SKILL.md
- evidence:  pack-preview self-test passed 155 checks before the final
             documentation and release-metadata pass; generated kai-core lock
             accepted `npm ci` and produced a working `lectoria --help`.
- questions: none
- next:      principal-swe-infra — finish the bounded dependency-contract
             increment, then bind review to a git change_ref.

## NOTE 2026-08-26-1823 — principal-swe-infra

- did:       Reconciled the touch set to include the canonical pack-architecture
             proposal after replacing its now-stale "no package manifests"
             statement with the settled host and `npm ci` contract.
- state:     in-progress
- needs:     Final regeneration, full validation, and commit-bound architecture
             review.
- artifacts: docs/proposals/pack-architecture.md;
             kai/coordination/items/pack-split-pack-dependency-manifests.md
- evidence:  Host behavior remains sourced from the completed reliability
             artifact; no marketplace topology or publication state changed.
- questions: none
- next:      principal-swe-infra — complete validation and mint change_ref.

## HANDOFF 2026-08-26-1827 — principal-swe-infra -> principal-swe-architect

- did:       Implemented the pack dependency contract and moved
             `in-progress -> in-review`. Every generated pack now receives
             deterministic npm metadata; core and personal project the exact
             root-pinned Lectoria graph; emitted bare imports require a
             same-pack declaration and lock record. Audio scripts and personal
             handoffs resolve the correct provider root and state the manual
             `npm ci` plus update-survival contract. Version moved
             `0.64.0 -> 0.65.0`. Lease cleared.
- state:     in-review
- needs:     Independent architecture review at exact change_ref
             `e67057ec061e9799cf7300bce972305ab01a7603`. If ratified, route to
             workflow-ship; if findings change implementation, mint a new ref
             and repeat review.
- artifacts: scripts/lib/pack-plan.mjs; scripts/pack-preview.mjs;
             scripts/validate-plugin.mjs; scripts/generate-audio.ps1;
             scripts/demo-narrate.mjs; skills/kai-core-generate-audio/SKILL.md;
             skills/demo-narrate/SKILL.md; packs/kai-core/package.json;
             packs/kai-core/package-lock.json; packs/kai-personal/package.json;
             packs/kai-personal/package-lock.json
- evidence:  `npm test` success at 0.65.0; pack self-test 157/157; generated
             drift clean; `git diff --check` clean; temporary core + personal
             `npm ci` both succeeded and exposed Lectoria; provider-root
             resolution invoked the generated core wrapper's pack-local binary.
             npm warned that this verification host's Node 24.14.0 is below the
             declared 24.15.0 floor; the install and executable probes still
             succeeded.
- questions: none
- next:      principal-swe-architect — review the dependency boundary,
             deterministic lock projection, same-pack runtime ownership, and
             provider-root invocation contract at the exact SHA.

## NOTE 2026-08-26-1827 — director review dispatch

- did:       Granted the required independent architecture review lease
             `arch-1827-dm65` at item version 6. Lifecycle remains `in-review`;
             implementation change_ref remains
             `e67057ec061e9799cf7300bce972305ab01a7603`.
- state:     in-review
- needs:     A ratify or changes-required verdict bound to the exact change_ref,
             with implementation left untouched by the assessor.
- artifacts: kai/coordination/items/pack-split-pack-dependency-manifests.md;
             kai/coordination/threads/pack-split-pack-dependency-manifests.md
- evidence:  No other item is in progress and the builder lease was cleared
             before this reviewer grant.
- questions: none
- next:      principal-swe-architect — perform the independent review under
             token `arch-1827-dm65`.

## REVIEW 2026-08-26-1828 — independent architecture

- role:       principal-swe-architect
- kind:       independent-architecture
- change_ref: `e67057ec061e9799cf7300bce972305ab01a7603`
- parent:     `b6db547c41b606c92e78e9d91fab82c554fc7d3d`
- verdict:    **changes-required**
- disposition: **Reshape** — preserve the pack-local ownership and deterministic
               projection, but make the pinned source fetchable without an
               unrelated GitHub SSH credential.
- findings:   P0 0 / P1 1 / P2 0

### Decision and forces

The decision is whether this exact revision establishes a truthful,
deterministic runtime-dependency seam for copied-but-not-installed packs.
The controlling forces are: the host supplies neither `npm install` nor
`node_modules`; runtime dependencies must not leak across plugin roots; manual
recovery must work for an ordinary consumer; generation must not solve or fetch;
and the marketplace/publication boundary must not move in this PR.

The reviewed shape is:

```text
 canonical package.json + lock
             |
             | deterministic projection (no network)
             v
   +---------------------+       provider-root invocation
   | kai-core            | <---------------- personal agent
   | package + lock      |
   | node_modules/.bin   |----> generate-audio.ps1
   +---------------------+

   +---------------------+
   | kai-personal        |
   | package + lock      |----> demo-narrate.mjs
   | node_modules/.bin   |
   +----------+----------+
              |
              | current locked fetch
              v
   git+ssh://git@github.com/RubenSaucedo/lectoria.git#<SHA>
              X requires unrelated GitHub SSH authentication
```

### Findings by severity

#### P1 — Manual pack remediation is credential-coupled to GitHub SSH

`package.json` declares Lectoria by immutable GitHub shorthand, while the exact
root lock record and both projected pack lockfiles resolve it as
`git+ssh://git@github.com/RubenSaucedo/lectoria.git#c284b6c…`. The product
contract tells any installed-pack user to run `npm ci --prefix "<pack-root>"`,
but SSH access to GitHub requires a configured key added to a GitHub account.
The successful temporary installs prove this workstation can install the graph;
they do not prove the documented recovery works on a consumer with no SSH
identity. That makes the manifests deterministic but not yet generally useful
or truthful as the sole pack-local remediation path.

Evidence:

- `package-lock.json`, `packages["node_modules/lectoria"].resolved`
- `packs/kai-core/package-lock.json`, same projected record
- `packs/kai-personal/package-lock.json`, same projected record
- `skills/kai-core-generate-audio/SKILL.md` and
  `skills/demo-narrate/SKILL.md`, which prescribe pack-local `npm ci`
- GitHub's SSH guidance requires an SSH key and account registration:
  https://docs.github.com/en/authentication/connecting-to-github-with-ssh

Exact corrective changes required:

1. Change the canonical Lectoria dependency to an immutable explicit HTTPS git
   source at the same commit (or another credential-free immutable artifact
   that still runs the required prepare build).
2. Regenerate the root lock and generated core/personal package files so no
   required Lectoria fetch resolves through `git+ssh`.
3. Add a fail-closed validator/self-test preventing a generated runtime
   dependency advertised for manual installation from projecting an SSH fetch.
4. Re-run core and personal `npm ci` on a supported Node version in a clean
   environment with no usable SSH key/config, then probe both pack-local
   Lectoria executables and the core provider-root wrapper path.
5. Mint a new implementation `change_ref` and repeat independent architecture
   review.

### Architecture questions

1. **Pack ownership/provider root — sound.** Core and personal each own the
   dependency they directly execute. `generate-audio.ps1` resolves only core's
   local bin; `demo-narrate.mjs` resolves only personal's local bin. Department
   instructions derive the core wrapper from the loaded
   `kai-core-generate-audio` provider root rather than cross-plugin
   `node_modules` discovery or sibling/cache scanning.
2. **Lock projection — sound apart from fetch transport.** The projection walks
   required dependency edges and present optional/peer edges using the existing
   lock, sorts emitted records, performs no solving or network access, and
   throws on missing required records. Both selected pack locks were structurally
   accepted by `npm ci`; the Node 24.14.0 `EBADENGINE` warning is not treated as
   supported-version evidence.
3. **Validators — sound.** Generated package and lock bytes must equal the root
   projection. Emitted JavaScript bare imports require same-pack declaration
   and a top-level lock record; Node built-ins remain exempt and relative
   imports retain closure validation. Missing, malformed, drifted, undeclared,
   and unlocked mutation arms are present.
4. **Manifest truth — blocked by P1.** The host/update-survival wording is
   honest, and manual install is the right seam, but its current SSH fetch adds
   an unstated credential prerequisite.
5. **Bounded scope — sound.** The exact change keeps the marketplace at the
   single `kai` entry sourced from `.`, publishes no pack, adds no onboarding
   flow, and does not flip release 12b. Version `0.65.0` remains pre-1.0 release
   hygiene only.
6. **Future five-pack/selected slice — sound.** Runtime plans exist for all five
   packs, empty packs receive valid root-only locks, selected generation emits
   only selected packs, and validators derive selected packs from emitted
   manifests. No additional P0/P1/P2 flaw was found.

### Scope truths and handoff

- This correction is **refine-in-scope**: credential-free manual installation
  is part of the committed dependency contract, not a new onboarding or
  publication capability.
- Packs remain committed and unpublished.
- Marketplace topology remains monolith-only.
- Release 12b remains **NO-GO**.
- `completed_reviews` remains empty because this revision is not ratified.
- state remains `in-review`; lease is cleared; next role is
  `principal-swe-infra`.

## HANDOFF 2026-08-26-1828 — principal-swe-architect -> principal-swe-infra

- did:       Reviewed exact change ref `e67057ec061e9799cf7300bce972305ab01a7603`
             and returned changes required with P0/P1/P2 = 0/1/0.
- state:     in-review
- needs:     Replace the SSH-resolved Lectoria source with an immutable
             credential-free source, regenerate root and pack locks, add the
             transport refusal test, prove clean no-SSH installs on supported
             Node, and mint a new change ref for re-review.
- artifacts: kai/coordination/threads/pack-split-pack-dependency-manifests.md;
             kai/coordination/items/pack-split-pack-dependency-manifests.md;
             kai/coordination/BOARD.md;
             kai/coordination/ACTIVE.md
- evidence:  exact root/core/personal lock records at `e67057ec…`; generated
             package/runtime validators in `scripts/lib/pack-plan.mjs`;
             provider-local resolvers in `scripts/generate-audio.ps1` and
             `scripts/demo-narrate.mjs`; GitHub SSH authentication guidance
             linked in the review.
- questions: none
- next:      principal-swe-infra — make the bounded dependency-contract
             correction and route a new exact revision back for independent
             architecture review.

## NOTE 2026-08-26-1833 — correction lease

- did:       Claimed the in-review correction under
             `psinfra-1833-https` at item version 8. The accepted architecture
             stays unchanged; this pass replaces the credential-coupled fetch,
             adds a transport refusal gate, and repeats installation proof.
- state:     in-review
- needs:     Credential-free immutable HTTPS lock records, supported-Node
             no-SSH installation evidence, a new change_ref, and architecture
             re-review.
- artifacts: package.json; package-lock.json; scripts/lib/pack-plan.mjs;
             scripts/pack-preview.mjs; packs/kai-core/package.json;
             packs/kai-core/package-lock.json; packs/kai-personal/package.json;
             packs/kai-personal/package-lock.json
- evidence:  Independent review P1 at exact `e67057ec…`; no completed review
             was recorded and the reviewer lease is clear.
- questions: none
- next:      principal-swe-infra — implement only the bounded HTTPS transport
             correction.

## RECOVERY 2026-08-27-1059 — principal-swe-infra -> principal-swe-infra

- reclaimed:   pack-split-pack-dependency-manifests
- stale_lease: holder=principal-swe-infra token=psinfra-1833-https
               expired=2026-08-26T20:33:57-07:00
- observed:    The reviewed implementation remains at `e67057ec…`; only its
               prior correction lease and thread note were uncommitted. New
               transport experiments found build-at-install is not
               reproducible, and the operator approved publishing one immutable
               Lectoria release asset.
- disposition: safe-to-resume
- new_lease:   holder=principal-swe-infra token=psinfra-1059-artifact
               version_at_grant=9
- state:       in-review
- next:        principal-swe-infra — replace the git dependency with the
               approved HTTPS release artifact, prove clean installs, and mint
               a new review ref.

## NOTE 2026-08-27-1121 — principal-swe-infra

- did:       Expanded the touch set to `.github/workflows/validate.yml` after
             this workstation's public npm TLS path prevented valid clean-cache
             evidence. The workflow now runs that same proof on Node 24.15.0
             for core and personal with empty caches, Git disabled, and no
             credentials.
- state:     in-review
- needs:     Commit the corrected dependency contract, let the clean GitHub
             runner settle the install evidence, then repeat independent
             architecture review at the exact new ref.
- artifacts: .github/workflows/validate.yml;
             kai/coordination/items/pack-split-pack-dependency-manifests.md
- evidence:  Local `npm ci` logs show repeated
             `ERR_SSL_SSL/TLS_ALERT_HANDSHAKE_FAILURE` for public registry
             tarballs before npm exits; the deterministic generator and all
             local contract tests remain green.
- questions: none
- next:      principal-swe-infra — finish the implementation ref and route it
             through CI plus architecture review.

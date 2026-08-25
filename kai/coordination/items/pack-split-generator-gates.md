---
type: work-item
id: pack-split-generator-gates
title: Harden the pack generator and make validate/release gates multi-manifest aware
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: shipped
resume_state: null
priority: 10
owner: principal-swe-infra
next_role: null
target: pack-split build tooling — generator + multi-manifest gates (foundation)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - scripts/release-guard.mjs
touches:
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - scripts/validate-plugin.mjs
  - scripts/release-guard.mjs
  - .github/workflows/validate.yml
  - package.json
depends_on:
  - item: pack-split-partition-lock
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews:
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: 457254b973fb58b129332ffaa609fb5febfdd412
    verdict: ratified
    timestamp: 2026-08-24-2231
change_ref: 457254b973fb58b129332ffaa609fb5febfdd412
version: 17
lease: null
updated: 2026-08-25-1136
---

## Outcome

`scripts/pack-preview.mjs` becomes the deterministic authoritative pack generator
(stable ordering, per-pack `plugin.json`, a single machine-readable partition with
explicit committed-slice control), and `scripts/validate-plugin.mjs` +
`scripts/release-guard.mjs` iterate over N manifests instead of assuming one root
`plugin.json` — the shared foundation every downstream dependency-guarantee item
sits on. Ships on `0.x`.

**Explicitly not in this foundation (steward correction at acceptance, 2026-08-24-2240).**
This item delivers partition/generator/multi-manifest **plumbing only**. Asset-ownership
routing (a non-markdown asset travelling with its sole invoking pack, promotion to core
when invoked across >1 pack) and the hooks-exactly-once rule are **not** delivered here
and remain owned by `pack-split-crosspack-validator` (validation of asset references and
`hooks.json` assigned to exactly one pack) and `pack-split-generated-pack-trees`
(materializing that ownership into the committed trees). The prior wording
("asset/hooks-ownership routing hooks") credited this foundation with a downstream
guarantee it does not provide.

## Acceptance

*Reconciled by the steward at acceptance 2026-08-24-2240 against the ratified review at
`change_ref 457254b973fb58b129332ffaa609fb5febfdd412` and the operator's verification run.
Criterion 4 as originally written bundled four local commands with "new CI steps green";
those are two different claims with two different evidence sources, so it was **split** —
the local half was met, the remote half could not be true before the branch was pushed.
**All six are now met** (`workflow-ship` gate re-run 2026-08-24-2252): the CI half closed on
workflow run 32814515790, not by assertion. The bar was never lowered — nothing was ticked
ahead of its evidence.*

- [x] The generator materializes core + a department tree deterministically from root,
      with a per-pack `plugin.json`; re-running is byte-stable.
      — 35-check self-test proves determinism, per-pack `plugin.json`, committed-tree
      round-trip, and a core+personal slice emitting no `kai-engineering/` keys; architect
      verified verbatim body copy, `normalizeLF` on emit **and** on read, fixed JSON key
      order, sorted rosters. On-disk committed materialization is deliberately gated
      (`COMMITTED_PACKS` empty) and belongs to `pack-split-generated-pack-trees`.
- [x] `validate-plugin.mjs` validates N manifests (per-pack version agreement; marketplace
      index may list multiple plugins) without regressing the single-manifest monolith checks.
      — `discoverManifests` returns the root manifest alone when `packs/` is absent (N=1
      byte-for-byte unchanged); `manifestParityErrors` enforces lockstep; marketplace
      generalised to N entries, monolith entry still required. Operator run: valid
      (56 agents, 50 skills).
- [x] `release-guard.mjs` classifies the committed pack-tree directory as behavior-sensitive
      so a generated-tree change still requires a bump + changelog + README.
      — `BEHAVIOR_PREFIXES = ['agents/', 'skills/', 'scripts/', 'packs/']` with self-test
      cases and path spot-checks; `--self-test` passed. The `packs/` root is confirmed
      (see the decision in Evidence), so this is no longer contingent on an assumption.
- [x] `node scripts/pack-preview.mjs --self-test`, `node scripts/validate-plugin.mjs`,
      `node scripts/release-guard.mjs --self-test`, and `npm test` all pass **locally**
      (operator-executed 2026-08-24, pre-binding; all exit 0).
- [x] **The new CI steps run green on the pushed PR.** *(The one criterion the
      2026-08-24-2244 DoD gate held open; closed 2026-08-24-2252 on real evidence.)*
      GitHub Actions run **32814515790**, job **`contract`** (`97700043167`),
      `ubuntu-latest` / Node 20, `conclusion: success`, 13s —
      <https://github.com/RubenSaucedo/kai/actions/runs/32814515790/job/97700043167>
      at PR head `4ed8f88562909ac292d856902b401a724f796f02` (PR #152). **All 11 steps green**,
      including `Pack generator self-test` (step 8), `Committed pack trees match the generator`
      (step 9), and the `pull_request`-only `Release-guard --base/--head` real gate (step 11)
      that had never executed in any form. Closed on a workflow run, not on assertion, and
      verified by `workflow-ship` directly against the GitHub API.
- [x] Version bumped on `0.x` with CHANGELOG + README stamp (release-guard).
      — `0.57.0 -> 0.58.0` coherent across `plugin.json`, `package.json`, `package-lock.json`
      (both fields), `marketplace.json` (both fields), CHANGELOG dated section + compare link,
      README `## Status`, AGENTS.md release-path list; architect verified coherence.

## Evidence

**Implemented on branch `kai/feat/29-pack-generator-gates`.** `principal-swe-infra`, with
operator verification and review fixes, 2026-08-24. **Delivered as PR #152 by the operator
2026-08-24-2251** — <https://github.com/RubenSaucedo/kai/pull/152>, head
`4ed8f88562909ac292d856902b401a724f796f02`, base `main`.
**MERGED by the operator 2026-08-25T18:20:55Z**; merge commit on `main`
`47aa0549f89b1733483dd6b662a4787d621c9430`; released as `v0.58.0`.

**PR-head equivalence to the ratified binding (dim-3 anchor).** The operator confirmed an
**empty diff** between `change_ref 457254b973fb58b129332ffaa609fb5febfdd412` and PR head
`4ed8f88…` across every implementation and release file; PR #152's body records the same
claim publicly. Differences at the PR head beyond the binding are **coordination-only**
acceptance/readiness records under `kai/`. The implementation therefore did not change, so
per `kai-core-work-coordination` the item's `change_ref` **deliberately stays** at the
ratified object and `completed_reviews.change_ref == change_ref` still matches exactly.
The durable, pushed equivalent of that (dangling, GC-able) stash object is PR head
`4ed8f88562909ac292d856902b401a724f796f02`.

**Remote CI — the evidence that closed the DoD gap.** GitHub Actions run **32814515790**,
job **`contract`** (`97700043167`), `ubuntu-latest` / Node 20, `status: completed`,
**`conclusion: success`**, 13s (`2026-08-25T05:51:47Z -> 05:52:00Z` = 22:51:47–22:52:00
local): <https://github.com/RubenSaucedo/kai/actions/runs/32814515790/job/97700043167>.
All 11 steps `success`, including the three previously unevidenced ones — `Pack generator
self-test`, `Committed pack trees match the generator`, and the `pull_request`-only
`Release-guard --base <base.sha> --head <head.sha>` **real** gate (not `--self-test`),
which classified this diff behavior-sensitive via the `scripts/` prefix and found the
`0.58.0` bump + CHANGELOG + README it demands.

**Independently re-verified at the PR head by `workflow-ship` (read-only, GitHub REST API),
not accepted on report:** job conclusion and per-step conclusions as above; PR #152 open at
that head; `GET /contents/packs?ref=4ed8f88…` -> **404** (no committed pack tree); the
`marketplace.json` patch is version-only, so the index still lists exactly one plugin
(`name: kai`, `source: "."`).

Increment 1 — generator engine:
- `scripts/lib/pack-plan.mjs` (new): the single machine-readable partition/manifest source —
  `PACKS`, the ratified `SKILL_OWNER_OVERRIDES`, `planPacks`, deterministic
  `planManifests`/`materializePacks`, `discoverManifests`, and the pure gate helpers
  `manifestParityErrors` + `marketplaceConsistencyErrors`. Imported by the preview/generator
  and validator so inherited and non-inherited skill ownership is defined once.
- `scripts/pack-preview.mjs`: imports the partition from `pack-plan.mjs` (re-exports the names the
  locked partition doc references); promoted to the deterministic generator with `--write` and
  `--check` (regenerate-and-diff), LF-normalised byte-stable output. `COMMITTED_PACKS` is empty
  in this foundation, so `--write` refuses until the downstream extraction item selects
  `core + personal`; self-tests prove an unselected department is not materialised.

Increment 2 — validate/release multi-manifest:
- `scripts/validate-plugin.mjs`: iterates all discovered manifests (monolith + any
  `packs/<name>/plugin.json`) for structure + per-pack version parity; marketplace generalised to
  N plugins (every entry agrees with its own manifest; monolith entry still required; an
  unpublished pack with no entry is allowed). With no `packs/` present, N=1 behaviour is
  byte-for-byte unchanged — the current single-plugin marketplace is unaffected.
- `scripts/release-guard.mjs`: `packs/` added to `BEHAVIOR_PREFIXES` (+ self-test cases), so a
  committed pack-tree change requires bump + CHANGELOG + README.
- `.github/workflows/validate.yml`: new CI steps `pack-preview --self-test` and `pack-preview --check`.

Release (`0.57.0 -> 0.58.0`, pre-1.0 minor = feature per AGENTS.md): `plugin.json`, `package.json`,
`package-lock.json` (both fields), `.github/plugin/marketplace.json` (both fields); CHANGELOG entry
+ compare link; README `## Status` stamp; AGENTS.md release-path list (+`packs/`).

**Deliberately NOT done (item boundaries / other items' touches):** no committed `packs/` trees
(WS#7 `pack-split-generated-pack-trees`), no preflight injection (WS#4), no degraded-mode block
(WS#5), no cross-pack reference validation (WS#3), no marketplace pack entries / publication. Packs
remain absent from the public install surface; `kai-core` identity and uninstall-first/coexistence
decisions untouched.

**Committed-tree root `packs/` — CONFIRMED by the steward, 2026-08-24-2240.** Decomposition
Open Question 2 is **closed**; this is no longer an open assumption. Evidence judged sufficient
without further investigation: the northstar's generate-and-commit-unpublished principle needs a
committed root but does not name one; the accepted decomposition (WS#1/#7) assumes `packs/` so
`release-guard` behavior-classification and the marketplace `source` can point at it;
`pack-split-generated-pack-trees` already declares `touches: packs/kai-core/`,
`packs/kai-personal/`; the ratified implementation encodes it in exactly two places
(`PACKS_DIR` in `scripts/lib/pack-plan.mjs`, `BEHAVIOR_PREFIXES` in `scripts/release-guard.mjs`);
and `.gitignore` does not exclude it. `dist/` was the named alternative and is rejected: it
conventionally signals build output that is *not* committed, which is the opposite of the
committed-unpublished contract. `packs/` is now the initiative's convention — downstream items
inherit it and do not re-litigate it.

**Verification executed by the operator after review fixes:**
- `node scripts/pack-preview.mjs --self-test` — 35 checks passed.
- `node scripts/pack-preview.mjs --check` — passed; no committed packs configured and
  `packs/` is intentionally absent.
- `node scripts/validate-plugin.mjs` — valid (56 agents, 50 skills).
- `node scripts/release-guard.mjs --self-test` — passed.
- `node scripts/check-syntax.mjs` — 22 JS/MJS + 1 PowerShell helper parsed.
- `npm test` — passed.

**Review fixes before binding:** the first implementation silently swept all nine
mechanical orphans into core and allowed `--write` to generate all five packs. The
operator corrected both: the ratified 1-core/4-personal/4-engineering dispositions
are explicit in the partition source, and committed generation remains disabled
until the core-plus-personal extraction item selects that slice.

## Notes

- **Filing reconciliation 2026-08-25-1136 (`workflow-ship`) — ship-record promotion is now
  COMPLETE; the "promotion owed" claim below is superseded.** The operator executed the
  outstanding move with `git mv`:
  `kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md`
  -> **`kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md`**
  (canonical, verified present here; nothing matches the old path under `kai/`). Version
  16 -> 17, `updated` restamped; **state stays `shipped`**, `resume_state: null`,
  `lease: null`, `next_role: null`. Nothing else moved: no code, release metadata, tag,
  release, or downstream promotion/dispatch was touched, and no DoD dimension was re-opened
  — this corrected where a durable record is filed, not what shipped. Earlier entries in
  this record, the thread, and `log.md` that cite the pre-promotion path were true when
  written and are corrected by this appended note rather than rewritten.

- **CONFIRM-START + CONFIRM-COMPLETE 2026-08-25-1125 (`workflow-ship`) — verdict `SHIPPED`.**
  Self-granted the lease at version 13 (token `wsh-2026-08-25-1125-gg-confirm`,
  `version_at_grant: 13`, re-read confirmed holder/token/version), walked the required
  lifecycle states, then cleared the lease. **`release-ready` -> `deploying` (v14) ->
  `production-verification` (v15) -> `shipped` (v16)**; `resume_state` stays `null`.
  No state was skipped and `shipped` was not reached directly from `release-ready`.
  kai did not merge, tag, release, or publish — the operator executed every one of those
  actions and supplied the evidence; this run recorded and verified it.

  **Deployment start (operator-supplied).** PR #152 merged 2026-08-25T18:20:55Z; merge
  commit `47aa0549f89b1733483dd6b662a4787d621c9430` on `main`.

  **Deployment completion (operator-supplied).** `validate` on `main`
  <https://github.com/RubenSaucedo/kai/actions/runs/32883225913>, `conclusion: success`,
  head SHA exactly `47aa0549f89b1733483dd6b662a4787d621c9430`. Tag `v0.58.0` at that
  merge commit; release <https://github.com/RubenSaucedo/kai/releases/tag/v0.58.0>. The
  previously missing historical `v0.57.0` tag/release was restored at its own merge commit
  (<https://github.com/RubenSaucedo/kai/releases/tag/v0.57.0>), which retires the dangling
  `[0.58.0]: …/compare/v0.57.0...v0.58.0` CHANGELOG link this release introduced.

  **Production verification — 4 of 5 checks independently re-verified read-only here; the
  5th is operator-attested and named as such.** This environment has no shell and
  `api.github.com` returned **403**, so CI conclusions and tag peels could not be re-derived.
  What was verified directly, on the checked-out `main`:

  | # | Check | Result | How verified |
  |---|-------|--------|--------------|
  | 1 | `main` CI green at the merge commit | **Pass (operator-attested, not re-derived)** | Run 32883225913, `success`, head `47aa0549…`. Corroborated: `.git/refs/heads/main` = `.git/refs/remotes/origin/main` = `FETCH_HEAD` = `47aa0549f89b1733483dd6b662a4787d621c9430`, reflog `pull --ff-only: Fast-forward` at 2026-08-25 11:25:26 local. |
  | 2 | `0.58.0` coherent on `main` | **Pass (verified)** | `plugin.json:4`, `package.json:3`, `package-lock.json:3` **and** `:9`, `.github/plugin/marketplace.json` `metadata.version` **and** `plugins[0].version` all `0.58.0`; `README.md:34` `v0.58.0`; `CHANGELOG.md:7` `## [0.58.0] - 2026-08-24` + `:2563` compare link. |
  | 3 | Marketplace still exactly one entry | **Pass (verified)** | `.github/plugin/marketplace.json` `plugins[]` has length 1 — `name: kai`, `source: "."`. No pack entries; the monolith remains authoritative. |
  | 4 | No `packs/` tree committed or published | **Pass (verified)** | No path matches `packs/**` anywhere on the checked-out `main`. The committed-unpublished contract has not started early. |
  | 5 | `v0.58.0` / `v0.57.0` tags + releases exist | **Pass (partly verified)** | `.git/refs/tags/v0.58.0` = `66b3c577b85c0fef7b23785ec2d530ddb74ea576` and `.git/refs/tags/v0.57.0` = `a0b140ed70a04bbf8a7974153dafdd9bc4cf1f57` — both refs **exist locally**. These are annotated-tag object ids; peeling them to their commits needs `git`, which this environment lacks, so "`v0.58.0` points at `47aa0549…`" stays **operator-attested**. Release pages returned 403 to read-only fetch. |

  **Nothing contradicted the operator's evidence**, and the single independently
  checkable claim inside it — that `main` is `47aa0549f89b1733483dd6b662a4787d621c9430` —
  matched exactly. The limits above are recorded rather than papered over.

  **Ship record promotion is NOT complete — one operator command outstanding.** The
  canonical library home is
  `kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md`;
  the record is still at
  `kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md`.
  This toolset cannot create directories (`create` refused: parent directory does not
  exist), so the move was **not faked** — the exact command is in the closing HANDOFF and
  in `deliverables.md`. This is a filing-location gap in a durable record, not a
  production gap, so it does not hold `shipped`.

  > **Superseded 2026-08-25-1136 — the move is done.** True as written at 11:25; the
  > operator has since `git mv`'d the record to
  > `kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md`.
  > See the filing-reconciliation note at the top of this section.

  **Dependents reconciled, none promoted.** `crosspack-validator` and `preflight-compat`
  had `generator-gates (shipped)` as their **only** dependency — now satisfied; both are
  `proposed` and need `principal-product-manager` grooming before dispatch. `migration-doctor`
  is likewise dependency-satisfied but sits in `first-pack-extracted`, outside
  `scope.current: [dependency-guarantees]`. `generated-pack-trees` remains blocked on four
  further items. `workflow-ship` did not promote, dispatch, or re-prioritize anything.

- **DoD gate RE-RUN 2026-08-24-2252 (`workflow-ship` PREPARE) — verdict `RELEASE-READY`,
  all six dimensions Clear.** Self-granted the lease at version 11 (token
  `wsh-2026-08-24-2252-gg-dod2`, `version_at_grant: 11`, re-read confirmed
  holder/token/version), wrote the gate result, cleared the lease; version 11 -> 12 -> 13.
  State **`in-progress` -> `release-ready`**. `next_role: @operator` — the human merge.
  **Ship record written:** `kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md`.
  Nothing was committed, pushed, merged, tagged, released, or published; no implementation,
  release-metadata, or downstream-scope file was touched. This environment has no shell
  (read/search/edit tools only) — nothing was executed locally, and all remote evidence was
  read via the GitHub REST API, read-only.

  | # | Dimension | Status | Evidence |
  |---|-----------|--------|----------|
  | 1 | scope-true | **Clear** | PR file set = this item's `touches` + release metadata + coordination records; nothing smuggled. `non_negotiable` verified at the PR head, not asserted: `GET /contents/packs?ref=4ed8f88…` -> **404** (no committed tree), `marketplace.json` patch is version-only so the index still lists exactly one plugin (`kai`, `source: "."`), groundwork on `0.x`, no sixth pack. Inside `scope.current: [dependency-guarantees]`. A1–A6 routed/parked in the owning records. |
  | 2 | verified | **Clear** *(the Gap that bounced this item, now closed)* | Run 32814515790 / job `contract` `97700043167`, `ubuntu-latest`, `conclusion: success`, 11/11 steps green — including `Pack generator self-test`, `Committed pack trees match the generator`, and the PR-only `Release-guard --base/--head` real gate. Local suite green (operator-executed, all exit 0). Design sub-gate **not triggered** — developer-facing build tooling, no user-facing surface; no waiver invented. |
  | 3 | reviewed | **Clear** | Sole `review_requirements` entry ratified at `change_ref 457254b97…`; implementation unchanged through PR delivery (operator-confirmed empty diff to PR head, restated in PR #152's body), so `change_ref` stays put and the verdict binds by exact match. Architect's snapshot-equivalence caveat discharged at 2026-08-24-2244; not reopened. |
  | 4 | shippable-safely | **Clear (proportional)** | `review-rollout-operability` verdict **Holds**. No runtime service, data, migration, external state, user surface, or publication change. Rollback = revert one squash-merge commit; nothing survives it. **The residual risk named at the bounce is retired** — the two steps that become mandatory on every future PR, plus the real release-guard gate, are now green on `ubuntu-latest`, the exact platform the hazard lived on. Signals: `validate` on `main` and the next PRs. Owner `principal-swe-infra`. |
  | 5 | documented | **Clear** | CHANGELOG `[0.58.0]` + compare link; README `## Status`; AGENTS.md release path (+`packs/`); `packs/` root decision in Evidence and `log.md`; ship record written and indexed in `deliverables.md`. Initiative `log.md` carries the **release-ready** entry — the **ship** stamp is withheld until CONFIRM-COMPLETE, because it has not shipped. |
  | 6 | coordination-closed | **Clear** | Item v13 current and truthful; deploy HANDOFF on the thread; BOARD/ACTIVE refreshed; dependency `partition-lock` `completed`; `waiting_on_questions: []`; A6 parked in the committed backlog. Recorded openly: PR delivery was operator-executed rather than routed through a `principal-swe-infra` HANDOFF, so the thread had no delivery entry — the gate's HANDOFF supplies it, and every delivery claim was re-verified against GitHub rather than taken on report. |

  **`release-ready` is not `shipped`.** PR #152 is open and unmerged. The four dependents
  (`crosspack-validator`, `preflight-compat`, `migration-doctor`, `generated-pack-trees`)
  require this item at `shipped` and stay non-executable until the human merges and
  production verification passes.

  **Non-blocking deviations from the bounce's suggested PR shape, reviewed and accepted as
  correct:** the title is `feat(pack-split): add generator and manifest gates` (49 chars,
  imperative, correct type, no trailing `(#N)` — conforms to `kai-core-pr-delivery` §3);
  and the body says `Part of #29`, not `Closes #29`, which is **more** accurate — #29 is the
  umbrella "Align Kai positioning and evaluate optional plugin packs", and closing it here
  would have falsely retired the whole initiative.

  **Coordination-record lag the operator must handle.** PR #152's head contains this item at
  version 11 / `in-progress`; the `release-ready` records written by this gate are
  working-tree-only. Merge #152 at head `4ed8f88…` **unchanged** — pushing the records onto
  the branch first would change the head SHA and detach the verified CI evidence — then
  commit the coordination records separately (`kai/` is not a `BEHAVIOR_PREFIX`, so
  release-guard will not demand a second bump).

- **DoD gate run 2026-08-24-2244 (`workflow-ship` PREPARE) — verdict `BOUNCE`, one Gap.**
  *(Historical; the Gap below is closed. Retained because the bounce is the reason the CI
  evidence exists.)*
  Five of six dimensions Clear at `change_ref 457254b973fb58b129332ffaa609fb5febfdd412`;
  **dim-2 (verified) is a Gap** — the item's own open acceptance criterion ("the new CI
  steps run green on the pushed PR") has **no evidence and cannot acquire any** until the
  branch is committed, pushed, and a PR exists. Under `kai-core-definition-of-done` an
  unbacked Clear is a Gap, and this is not waivable: the dimension genuinely applies.
  The gap is **not** procedural bookkeeping — it is the only check that can still fail:
  1. **Different platform.** Every green run to date is Windows (`C:\src\kai`);
     `.github/workflows/validate.yml` runs `ubuntu-latest`. This change's central claim
     is byte-stable, LF-normalised, forward-slash-keyed generation — precisely the class
     that passes on one platform and fails on the other, and precisely what architect
     findings A2/A3 flag.
  2. **A step that has never executed in any form.** The `Release-guard (behavior change
     requires a bump + release notes)` step is `if: github.event_name == 'pull_request'`
     and runs `release-guard --base <base.sha> --head <head.sha>`. The local run was
     `--self-test`, which exercises the classifier, **not** the real base/head gate over
     this diff. `scripts/` is a `BEHAVIOR_PREFIX`, so this diff will be classified
     behavior-sensitive and the gate will demand the bump + CHANGELOG + README that are
     present — but that demand has never actually been evaluated.
  3. **Repo-wide blast radius.** The two new steps (`Pack generator self-test`,
     `Committed pack trees match the generator`) become mandatory gates on *every* PR in
     this repository once merged. A wrong or platform-fragile `--check` blocks all
     contributors, not just this initiative.
  State returned `in-review -> in-progress`, `next_role: principal-swe-infra` for PR
  delivery under `kai-core-pr-delivery`. No ship record was written (none is written for a
  bounced item), nothing was committed, pushed, PR'd, merged, tagged, released, or
  published, and no implementation, release-metadata, or downstream-scope file was touched.

- **The ratified diff must not be edited (binding constraint on PR delivery) — HONORED,
  2026-08-24-2251.** PR #152 committed the reviewed tree unchanged; the operator confirmed an
  empty diff between `457254b97…` and PR head `4ed8f88…` for all implementation and release
  files, and the PR body records it. `change_ref` therefore stays at the ratified object.
  The original constraint, retained for the record: the
  `independent-architecture` verdict binds to `change_ref
  457254b973fb58b129332ffaa609fb5febfdd412`, and the operator has confirmed byte-identity
  between that object and the current implementation/release files via
  `git diff <change_ref> -- <files>`. PR delivery must commit **that tree unchanged** —
  no A5/A6 fixes, no CHANGELOG rewording, no opportunistic tidying. Any content change
  invalidates the ratified review, requires a new `change_ref`, and sends the item back
  through `principal-swe-architect`. The PR head commit will necessarily have a different
  SHA than the stash object; that alone is **not** an implementation change. If
  `change_ref` is re-pointed to the PR head SHA, record the byte-identity proof (an empty
  `git diff <ratified-ref> <pr-head>`) in Evidence so the existing verdict still binds.
  Note also that a `git stash create` object is dangling and garbage-collectable — commit
  the branch before it is lost.

- **Manager split (reviewability).** Extracted from the steward's descriptions, which had
  folded the multi-manifest gates into `pack-split-crosspack-validator` and the generator into
  `pack-split-generated-pack-trees`. Built that way, three guarantee items would re-implement the
  same plumbing and two would be XL. This is the single first implementation item.
- Delivered as 2 PR increments: (1) generator engine; (2) validate/release multi-manifest refactor.
- **Proposed** for the `dependency-guarantees` `required_items` (steward's call at grooming).

- **Steward-accepted 2026-08-24-2240 (`principal-product-manager`, acceptance at
  `change_ref 457254b973fb58b129332ffaa609fb5febfdd412`).** Product acceptance **granted**:
  the ratified foundation is the thing that was commissioned, it held to foundation scope
  (no pack trees, no preflight, no degraded block, no cross-pack validator, no publication),
  and it does not overclaim downstream guarantees. Steward actions: (1) corrected the Outcome
  prose, which credited this item with asset/hooks-ownership routing it does not deliver;
  (2) reconciled the five acceptance criteria — four met, and the bundled local-plus-CI
  criterion split so "remote CI green" stays honestly open until a PR exists;
  (3) **confirmed `packs/`** as the committed-tree root, closing decomposition Open Question 2;
  (4) routed the architect's carry-forward findings into owning records rather than prose.
  **State stays `in-review`; `next_role: workflow-ship`.** Per the lifecycle contract, all
  `review_requirements` are satisfied for a `product-change` item, so routing goes to
  `workflow-ship`, which alone owns the DoD gate and the `in-review -> release-ready`
  transition. The steward does not move it there and explicitly does **not** mark it
  `shipped`: nothing is committed, pushed, PR'd, merged, tagged, released, or published.

- **Carry-forward routing of the architect's findings (2026-08-24-2240).** None reopens this
  item; none is fixed in this PR. Each is now owned by the record that first makes it reachable:
  - **A1** (`checkCommitted` ENOENT before the `--write` hint when a slice is selected and
    `packs/` is absent), **A2** (OS artifacts under `packs/` failing local `--check` while CI
    stays green), **A3** (`.gitattributes` pin `packs/** text eol=lf`) →
    `pack-split-generated-pack-trees`, added as acceptance criteria (A3 also added to its
    `touches`). All three are unreachable until a committed tree exists, which is that item.
  - **A4** (marketplace publication sits outside release enforcement; entry `name` not asserted
    against the `name` in the `plugin.json` at its `source`) → `pack-split-release-12b`, added
    as acceptance criteria with `scripts/release-guard.mjs` + `scripts/validate-plugin.mjs`
    added to its `touches`. Cross-referenced from `pack-split-generated-pack-trees`, because
    committing the first tree is what makes the unpublished→published flip a pure
    `marketplace.json` edit — the guard must land no later than the flip.
  - **A5** (`PACK_AGENTS` duplicate legacy roster truth; four self-test checks running the
    legacy `planSkills(PACK_AGENTS)` path) → `pack-split-ci-partition-checks`, added as an
    acceptance criterion. Steward reasoning: that item turns the partition self-test into a
    hard CI gate, so collapsing the duplicate truth and re-pointing the legacy checks belongs
    there, immediately before the checks become load-bearing. Not fixed here — the authoritative
    assertions are unaffected today and touching `pack-preview.mjs` again would expand a
    ratified diff for a non-defect.
  - **A6** (`planManifests` always sets `manifest.skills = 'skills'` while `materializePacks`
    only creates `skills/` for a pack owning ≥1 skill) → **parked as a PROPOSAL** in
    `kai/initiatives/pack-split/backlog.md`. Unreachable in this initiative: all five locked
    departments own ≥1 skill, and the northstar forbids adding packs beyond the agreed five.
    Trigger to revisit is recorded with the proposal.

- **Not expanding this PR.** A5 and A6 are the only findings that touch files already in this
  item's diff, and neither is required for acceptance. Under `scope-discipline` they are
  refinements with no reachable failure today; re-opening a ratified `change_ref` for them
  would invalidate the binding review for no gain.

- **Steward-groomed 2026-08-24-2013 (`proposed -> ready`).** `principal-product-manager`
  accepted the decomposition, added this item to the `dependency-guarantees` `required_items`
  (`shipped`) as the foundational split, confirmed scope against repository evidence
  (`scripts/pack-preview.mjs`/`validate-plugin.mjs`/`release-guard.mjs` are single-manifest today),
  and promoted this to `ready` at priority 10 — the **single first implementation item** for the
  initiative. `next_role: principal-swe-infra`, version 1 -> 2. Its dependency
  (`pack-split-partition-lock`) is `completed`, so it is executable now. The other 13 records stay
  `proposed` for milestone-by-milestone grooming; `pack-split-host-semantics-spike` is recommended
  to start in parallel (operator-run). Dispatch is the director's.

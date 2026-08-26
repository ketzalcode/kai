---
type: work-item
id: pack-split-generated-pack-trees
title: Generate committed-unpublished kai-core + first department (personal) trees from root
initiative: pack-split
milestone: first-pack-extracted
delivery_class: product-change
state: shipped
resume_state: null
priority: 10
owner: principal-swe-infra
next_role: null
target: pack-split committed-unpublished pack trees (generate-not-move)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-degraded-refusal.md
  - kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees/ship-record.md
  - scripts/pack-preview.mjs
  - hooks.json
touches:
  - packs/kai-core/
  - packs/kai-personal/
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - scripts/validate-plugin.mjs
  - .gitattributes
  - package.json
  - package-lock.json
  - plugin.json
  - .github/plugin/marketplace.json
  - CHANGELOG.md
  - README.md
  - docs/proposals/pack-architecture.md
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
completed_reviews:
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: 5a5afb0e0eb40cbaa37eb195cdfcfca3efc1e81f
    verdict: approved
    evidence: "kai/coordination/threads/pack-split-generated-pack-trees.md"
    timestamp: 2026-08-26-1412
change_ref: 5a5afb0e0eb40cbaa37eb195cdfcfca3efc1e81f
version: 10
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-26-1443
---

## Outcome

The generator materializes the committed-but-unpublished `kai-core` + `kai-personal` trees from
root (root stays the single source of truth — nothing moved), realizing the explicit asset-ownership
rule: a non-markdown asset travels with the sole skill that invokes it (`scripts/demo-*.mjs` →
personal), any asset invoked across >1 pack promotes to core, and `hooks.json` + `scripts/observe-*.mjs`
ship in core only (hooks exactly once). Every routed JavaScript entry point also carries its
relative-import closure inside the same pack.

## Acceptance

- [x] `packs/kai-core/` and `packs/kai-personal/` are generated from root, committed, and unpublished;
      re-generation is byte-stable; `agents/`+`skills/` at root are unchanged.
- [x] `scripts/demo-*.mjs` travel with `personal`; `hooks.json` + `scripts/observe-*.mjs` present in
      core only; no department pack ships a duplicate hook.
- [x] Each generated pack agent carries the preflight + degraded block; the cross-pack validator and
      partition CI pass on the committed trees.
- [x] `node scripts/pack-preview.mjs --all`, `node scripts/validate-plugin.mjs`, `npm test` pass.
- [x] Version bumped on `0.x` with CHANGELOG + README stamp, and that prose says
      **committed and unpublished, not installable from the marketplace**.

*Carried forward from the `pack-split-generator-gates` architecture review (ratified
2026-08-24-2231 at `change_ref 457254b973fb58b129332ffaa609fb5febfdd412`); routed here by the
steward at acceptance 2026-08-24-2240 because this item is the first state in which each becomes
reachable. None was a defect in that foundation.*

- [x] **(A1)** `checkCommitted` guards the committed-tree walk on `existsSync(base)`. With a slice
      selected and `packs/` not yet present — literally this item's first state — the gate prints
      the `regenerate with: --write` guidance and exits non-zero, instead of an ENOENT stack trace
      from `readdirSync` on a missing directory.
- [x] **(A2)** The committed-tree walk does not treat every file under `packs/` as generator
      output: OS artifacts (`.DS_Store`, `Thumbs.db`) are skipped, or the walk is scoped to tracked
      files. A contributor's local `--check`/`npm test` cannot fail while CI stays green.
- [x] **(A3)** `.gitattributes` pins `packs/** text eol=lf` when the first tree lands, matching the
      existing `scripts/**` and `test/fixtures/**` pins — a byte-compared generated tree is the same
      category.
- [x] **(R1)** Core carries neither guarantee block — as a decided residual, not
      an omission. Generated core agents carry zero copies of both blocks, and
      the gate rejects either block in core.
- [x] **(R2)** Hooks ownership is proven over emitted files. The committed tree
      emits exactly one `packs/kai-core/hooks.json`; personal emits none; a
      nested `kai-core/scripts/hooks.json` key is not a claimant; every hook
      script ships in core.
- [x] **(R3)** A hook command with multiple `${PLUGIN_ROOT}` paths or a path
      outside top-level `scripts/<name>.<ext>` fails by name and distinguishes
      those cases. The asset key-space is not widened.
- [x] **(R4)** Exactly one fail-closed check decides that a generated key maps to
      no declared pack; sibling consumers rely on that check rather than
      inventing another ownership truth.
- [x] **(R5)** Mutation arms prove the shared-asset-not-owned-by-core and
      cross-pack-consumer `assetOwnershipErrors` branches fire by name.
- [x] **(R6)** Comments and proposal errata match the measured corpus: one
      Windows host only; no macOS, cloud, or publication-readiness claim.
- [x] **(R7)** Before merge, an operator session in this repository proves the
      committed `packs/` tree adds no ambient providers, skills, or hook
      firings. Compare against an identical no-`packs/` baseline when the host
      already duplicates a root + installed-monolith hook. Any positive
      pack-attributable delta stops and reverts the tree.
- [x] **(R8)** Marketplace topology stays N=1 at `source: "."` (only its
      lockstep release version changes), and `COMMITTED_PACKS` becomes exactly
      `['core', 'personal']`.
- [x] **(R9)** Generation rewrites no frontmatter or role references. Core agent
      bodies are byte-identical to root; personal bodies are root plus exactly
      the two guarantee blocks.
- [x] **(R10)** Every emitted JavaScript entry point carries its complete
      relative-import closure inside the same pack. The emitted-tree gate fails
      by name for a missing local module or a bare third-party import.
- [x] **(R11)** Generated packs carry no `package.json` or `package-lock.json`
      in this unpublished increment. Publication must own dependency manifests
      and install semantics before the marketplace can list a pack.

## Evidence

- **Implementation:** `5a5afb0e0eb40cbaa37eb195cdfcfca3efc1e81f`
  (`feat(packs): generate core and personal trees`), one commit off
  `31d5d110cb2a3f63ef6085e707bfe412a8c0b0ea`; working tree clean after commit.
- **Generated slice:** 44 core files + 22 personal files at `0.64.0`;
  `node scripts/pack-preview.mjs --check` reports byte-identical output.
  `git diff 31d5d110... -- agents skills` is empty.
- **Verification:** `npm test`; `node scripts/pack-preview.mjs --all` (112-file
  five-plugin preview); all four named pack gates; 148 self-test checks; direct
  imports of generated core observer/workspace-doctor and personal demo-zoom.
- **R7 differential, Windows CLI 1.0.80:** current tree exposed 56 `kai:`
  agents, zero `kai-core:`/`kai-personal:` providers, and no second contract
  skill. One child produced delta=4 observer records. An isolated worktree at
  `31d5d110...` with no `packs/` produced the identical delta=4; root
  `hooks.json` was unchanged and `packs/` was the only hook-registering
  difference. Pack-attributable provider and hook deltas were zero.
- **Review:** `principal-swe-architect` APPROVED the independent architecture
  review at the implementation SHA on 2026-08-26-1412 after two guard/comment
  correction rounds.

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
- **Accepted residual — core context-loading coverage (steward,
  2026-08-26).** No second core refusal is added. `v0.63.1` gave every
  canonical agent explicit `skill` access and the delegated cross-plugin
  preflight passes from an empty workspace. Reopen if a core agent grants a
  lease or writes coordination state with inherited skills unloaded after
  explicit `skill` access is present; stop and consult the steward and security.
- **Referral contract (steward, 2026-08-26).** Canonical prose keeps bare role
  IDs. The dispatcher reads the live roster, compares the segment after `:`,
  and dispatches the full provider-qualified ID exposed by the host. An absent
  department is named as unavailable; no lease is granted, no substitute is
  chosen, and the item is left unchanged. Non-dispatch prose referrals remain
  advisory. Generated bodies perform no provider-ID rewrite.
- **Runtime dependency manifests are deferred to publication.** Reopen no later
  than the marketplace flip, or earlier if an emitted script gains a load-time
  third-party import or host evidence proves plugin installation runs
  `npm install`. Until then Lectoria in a generated pack resolves only through
  `LECTORIA_BIN` or `PATH`.

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

### Steward promotion — 2026-08-26-1340 (`principal-product-manager`)

**`proposed -> ready`, priority 20 -> 10, `next_role:
principal-swe-infra`, version 3 -> 4.**

- All six dependencies are satisfied. The host spike gives a conditional GO for
  committed-unpublished core + personal; publication remains blocked elsewhere.
- A1 is closed as the accepted residual above. It is not a missing decision.
- N3 is already delivered through `parseGeneratedKey`; R2 adds the emitted-tree
  proof arm rather than reimplementing it.
- N4, N5, hook-path diagnostics, dormant asset-ownership mutation arms, and the
  proposal errata are bounded riders R3-R6.
- Cross-department referral degradation is decided by the existing core
  dispatcher contract; R9 prevents a corpus-wide provider-ID rewrite.
- Stop conditions are R7 ambient discovery, any marketplace edit, or any third
  committed pack. None may be worked around inside this item.

### DoD gate — 2026-08-26-1424 (`workflow-ship`, PREPARE) — RELEASE-READY, not shipped

**`in-review -> release-ready`, version 6 -> 7, `next_role: workflow-ship -> "@operator"`,
lease `null`.** All six dimensions **Clear**, none Gap. Ship record:
`kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees.md` (canonical
directory move is deploy step 5). **Nothing was merged, pushed, tagged, released, or
published** — the branch is still unpushed and there is no PR.

- **Record-accuracy correction to `touches`, not a scope expansion.** `plugin.json`,
  `package-lock.json` and `.github/plugin/marketplace.json` were added: the `0.63.1 ->
  0.64.0` bump necessarily edits all three, and the record must describe what actually
  changed. No new capability; no touch collision (`pack-split-release-12b`, the only other
  claimant of `marketplace.json`, is `proposed` with no lease).
- **The marketplace edit is version-only and stays inside R8.** Verified in the tree:
  topology is still N=1, one `kai` entry at `source: "."`, **zero pack entries**. R8's own
  parenthetical — "only its lockstep release version changes" — authorizes it, and deploy
  step 3 fails the release closed on any entry change. The compressed "any marketplace
  edit" phrasing in the dispatch HANDOFF and `ACTIVE.md` is stricter than this record; the
  item record governs, and the operator can veto with a two-line revert if the steward
  reads it otherwise.
- **R7 is satisfied under its original wording**, so the disputed authorship of its
  baseline-comparison amendment is not load-bearing: the `packs/` tree *adds* nothing —
  4 observer records with it, the identical 4 without it at `31d5d110…`, and zero
  `kai-core:`/`kai-personal:` providers exposed. A steward confirmation NOTE is recorded
  as non-blocking record hygiene.
- **This gate ran with no shell.** Acceptance was re-derived by reading the working tree
  (44 + 22 files, hooks exactly once in core, blocks in all 9 personal agents and 0 of 7
  core agents, no pack manifests, `COMMITTED_PACKS = ['core','personal']`, eight-location
  `0.64.0` coherence, A1–A3 guards in code). The suite itself remains infra-attested and
  is re-executed by CI at deploy step 6, which fails closed.
- **Milestone `first-pack-extracted` does not advance.** `release-ready` is not `shipped`;
  `pack-split-first-department` and `pack-split-host-gates` stay blocked until
  CONFIRM-COMPLETE records production evidence.

## Ship — 2026-08-26-1443 (`workflow-ship`, CONFIRM-START + CONFIRM-COMPLETE): SHIPPED

**Verdict: SHIPPED. Production verification PASSED 6 of 6.** Item **v7 -> v10**, walking
`release-ready -> deploying -> production-verification -> shipped` on evidence at each step.
`lease`, `resume_state`, and `waiting_on_questions` remain clear; `next_role: "@operator" ->
null`. `change_ref` deliberately remains the independently reviewed implementation commit
`5a5afb0e0eb40cbaa37eb195cdfcfca3efc1e81f`. GitHub's compare graph proves that commit is an
ancestor of merge commit `2eea0f04f1c3dc0b4788de1e82909c5cc882e75d`; the merge preserved the
review binding rather than rewriting it.

### CONFIRM-START

- PR [#167](https://github.com/RubenSaucedo/kai/pull/167) merged at
  `2026-08-26T21:40:01Z` into `2eea0f04f1c3dc0b4788de1e82909c5cc882e75d`.
- The `main` deployment-validation run
  [33016421758](https://github.com/RubenSaucedo/kai/actions/runs/33016421758) started at
  `2026-08-26T21:40:03Z`, environment `main` / GitHub Actions, at that exact `head_sha`.
  This evidence moved the item `release-ready -> deploying`.

### CONFIRM-COMPLETE

- Main job `contract`
  [98335703857](https://github.com/RubenSaucedo/kai/actions/runs/33016421758/job/98335703857)
  completed `success` at `2026-08-26T21:40:17Z`. Its committed-tree step passed, as did the
  generator, partition, collision, partial-install, version-skew, contract, doctor,
  host-loader, release-guard self-test, and syntax checks. The merge SHA has exactly one check
  run and it is successful.
- Release [`v0.64.0`](https://github.com/RubenSaucedo/kai/releases/tag/v0.64.0) published at
  `2026-08-26T21:40:33Z`, non-draft and non-prerelease, with target commit exactly
  `2eea0f04f1c3dc0b4788de1e82909c5cc882e75d`. This evidence moved the item
  `deploying -> production-verification`.

### Production verification — 6 of 6 PASS

1. **Merged artifact and review binding:** PASS — PR #167 merged, and `5a5afb0e...` remains
   in the merge ancestry. Local `main` and `origin/main` both reached the merge SHA; the
   worktree was clean immediately after the operator's merge/update sequence, before these
   record-closing edits.
2. **PR/main validation and release:** PASS — PR run `33016379347`, job `98335558480`,
   passed at the final PR head; main run `33016421758`, job `98335703857`, and release
   `v0.64.0` all bind the merge SHA and completed successfully.
3. **Version, topology, and trees:** PASS — production blobs read `0.64.0`;
   `.github/plugin/marketplace.json` remains exactly N=1 (`kai`, `source: "."`, zero pack
   entries); `COMMITTED_PACKS` is exactly `['core', 'personal']`; the merge root has only
   `packs/kai-core` and `packs/kai-personal`; CI's committed-tree check passed. **No pack was
   published.**
4. **Installed artifact:** PASS with an explicit residual — official
   `copilot plugin update kai` failed on Windows with `Access is denied` because the active CLI
   had the plugin loaded. This was **not** a successful plugin-manager update. The clean installed
   direct checkout was instead fast-forwarded in place with `git pull --ff-only origin main` from
   old SHA `a879116...` / manifest `0.47.0` to exact merge SHA `2eea0f0...`; its
   `plugin.json` now reads `0.64.0`.
5. **Fresh-session loaded behavior:** PASS — a fresh Copilot CLI 1.0.80 child session after that
   checkout refresh returned exactly `CORE=0 PERSONAL=0 CONTRACT_DUPLICATE=no CHILD=ok`.
6. **Observer differential:** PASS — consent was enabled; one built-in `explore` child changed
   `.kai/observed.jsonl` from 363 to 367, exactly the established four-record baseline
   (start/start, stop/stop) for session `4d11d50d1b4d`, role `explore`, agent
   `1fb0de3084e1`. There was no positive pack-attributable provider, contract-skill, or hook
   delta. The duplicate four-record behavior is pre-existing, not caused by packs.

**Registry-cache residual does not block this item's existing production-verification contract.**
`copilot plugin list` still displays cached registry metadata `0.47.0`, while the installed
checkout is at the merge SHA and its manifest is `0.64.0`. The contract gates the artifact the
fresh session actually loaded and its provider/skill/hook behavior; both are directly evidenced.
The stale display publishes no pack, changes no loaded content, and produced no positive R7 delta.
It remains an honest operability discrepancy, not evidence that the old artifact ran.

**Rollback was never invoked.** Kai did not merge, push, tag, release, update the installed
checkout, deploy, or roll back anything; those were operator actions. `first-pack-extracted`
remains open: this item and `pack-split-migration-doctor` are now `shipped`, while the steward
still owns promotion and sequencing of the remaining required items.

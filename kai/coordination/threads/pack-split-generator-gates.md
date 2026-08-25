# Thread — pack-split-generator-gates

Append-only communication log mirroring
`kai/coordination/items/pack-split-generator-gates.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record from the engineering decomposition. **Manager split for reviewability:** extracted the generator engine + multi-manifest gate plumbing (folded by the steward into `pack-split-crosspack-validator` and `pack-split-generated-pack-trees`) into one foundational item, because three guarantee items sit on it and it is the single first implementation item. Size L (2 PR increments). Owner `principal-swe-infra`; review `principal-swe-architect`/independent-architecture.
- state:     proposed
- needs:     Steward grooming — confirm scope, confirm the proposed addition to `dependency-guarantees` `required_items` (shipped), prioritize, and promote to `ready` as the first dispatchable item.
- artifacts: kai/coordination/items/pack-split-generator-gates.md; kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md (WS#1)
- evidence:  scripts/pack-preview.mjs (throwaway generator to harden), scripts/validate-plugin.mjs + scripts/release-guard.mjs (single-manifest today) — captured 2026-08-24 from C:\src\kai
- questions: none (committed-tree location `packs/` confirm — decomposition Open Question 2)
- next:      principal-product-manager — groom + promote; this is the identified single first implementation item for director dispatch.

## HANDOFF 2026-08-24-2013 — principal-product-manager -> principal-swe-infra

- did:       **Accepted the decomposition and promoted this item `proposed -> ready`** (version 1 -> 2, priority 20 -> 10, `next_role: principal-swe-infra`). As steward I confirmed the manager split is sound — the generator engine + multi-manifest gate plumbing is the shared foundation of three guarantee items and is independently reviewable — and **added `pack-split-generator-gates` (shipped) to the `dependency-guarantees` `required_items`** so closure verifies it. Its dependency `pack-split-partition-lock` is `completed`, so it is executable now.
- state:     ready
- needs:     `principal-swe-infra` builds it in 2 PR increments (generator engine; validate/release multi-manifest refactor). Acceptance criteria on the record; single independent-architecture review; groundwork ships on `0.x`. Confirm committed-tree location `packs/` with the steward (decomposition Open Question 2) before wiring `release-guard` behavior classification.
- artifacts: kai/coordination/items/pack-split-generator-gates.md (version 2, `ready`, priority 10); kai/initiatives/pack-split/northstar.md (`dependency-guarantees.required_items` +generator-gates)
- evidence:  scripts/pack-preview.mjs / validate-plugin.mjs / release-guard.mjs single-manifest today — captured 2026-08-24 from C:\src\kai
- questions: none blocking
- next:      director-chief-of-staff — dispatch this single `ready` item to `principal-swe-infra`. Recommend also promoting `pack-split-host-semantics-spike` for the operator to run in parallel.

## NOTE 2026-08-24-2144 — principal-swe-infra claimed (self-grant)

- Sole active worker on the only `ready` item; self-granted per single-grantor rule.
  Lease `principal-swe-infra` / token `psi-2026-08-24-2144-gg01`, `version_at_grant: 2`,
  version 2 -> 3, `ready -> in-progress`. Re-read confirmed the grant.
- Workspace schema-compatible: `.kai/manifest.json` present, `schema_version: 2`,
  `workspace_mode: repository`, root `.`.
- **No shell in this environment** (tools: read/search/edit only). Cannot run
  `node`/`npm`/`git` or append to `.kai/activity.jsonl` (best-effort, gitignored).
  Code lands in the working tree; exact verification commands are reported at handoff.
- **Committed-tree location `packs/`** taken from decomposition Open Question 2 (every downstream
  item + northstar assume it); a one-line convention, flagged for the steward.

## HANDOFF 2026-08-24-2149 — principal-swe-infra -> principal-swe-architect

- did:       Built `pack-split-generator-gates` on branch `kai/feat/29-pack-generator-gates`
             (working tree; uncommitted) in the two planned increments. **(1) Generator engine:**
             new `scripts/lib/pack-plan.mjs` is the single machine-readable partition/manifest
             source (`PACKS`, `planPacks`, deterministic `planManifests`/`materializePacks`,
             `discoverManifests`, pure gate helpers); `scripts/pack-preview.mjs` imports it
             (re-exports the names the locked doc names), is promoted to the deterministic generator
             with `--write`/`--check` (regenerate-and-diff), LF-normalised byte-stable output, and an
             extended self-test (determinism + per-pack `plugin.json` + committed-tree round-trip +
             gate helpers). **(2) Multi-manifest gates:** `scripts/validate-plugin.mjs` iterates all
             discovered manifests (monolith + any `packs/<name>/plugin.json`) for structure +
             per-pack version parity and generalises the marketplace to N plugins (N=1 unchanged
             byte-for-byte); `scripts/release-guard.mjs` classifies `packs/` as behavior-sensitive
             (+ self-test cases); `validate.yml` gains `pack-preview --self-test` and `--check`.
             Release `0.57.0 -> 0.58.0` across all four version locations + CHANGELOG (+ compare link)
             + README stamp + AGENTS.md release-path list.
- state:     in-review
- needs:     `principal-swe-architect` / independent-architecture review of (a) generator determinism
             + the committed-tree regenerate-and-diff contract, (b) the multi-manifest gate contract
             (per-pack parity + N-plugin marketplace) and its no-regression at N=1, (c) that scope
             held to the foundation (no `packs/` trees, no preflight/degraded/cross-pack/publish).
             **Two gaps a human must close first:** (1) **no shell here** — the automated suite was
             NOT run; commands are in the item Evidence, expect all exit 0; (2) **no `change_ref`** —
             the diff is uncommitted, so an operator must commit on-branch to mint a `change_ref` and
             run `npm test` before the review binds. Nothing is claimed as verified.
- artifacts: scripts/lib/pack-plan.mjs (new), scripts/pack-preview.mjs, scripts/validate-plugin.mjs,
             scripts/release-guard.mjs, .github/workflows/validate.yml, package.json, plugin.json,
             package-lock.json, .github/plugin/marketplace.json, CHANGELOG.md, README.md, AGENTS.md
- evidence:  full changed-file list + exact verification commands (not executed — no shell) in the
             item Evidence section, captured 2026-08-24 from C:\src\kai on branch
             `kai/feat/29-pack-generator-gates`
- questions: none blocking. Non-blocking for the steward: confirm `packs/` as the committed-tree
             root (Open Question 2). `change_ref` is `null` pending an operator commit.
- next:      operator/director — commit the working tree on-branch to mint `change_ref`, run
             `npm test`, record the `change_ref` on the item, then `principal-swe-architect` performs
             the single required review. Do not begin the next item (WS#3/#4 depend on this shipping).

## NOTE 2026-08-24-2200 — operator verification and review fixes

- Ran the targeted generator, validator, release-guard, and syntax checks, then the
  full `npm test`; all passed.
- Corrected two pre-review defects:
  1. the machine-readable plan now applies the ratified orphan-skill dispositions
     (`fleet-observation` core; four demo skills personal; `onboard-to-codebase`
     plus three review lenses engineering) instead of sweeping all nine into core;
  2. committed generation is intentionally unconfigured until WS#7 selects
     `core + personal`, so `--write` cannot materialise all departments early.
- The self-test now has 35 checks and proves explicit orphan ownership, zero
  unplaced skills, core-plus-personal slicing, and refusal to write before a
  committed slice is selected.
- State remains `in-review`; `change_ref` remains null until the branch commit is
  minted for the required independent architecture review.

## HANDOFF 2026-08-24-2225 — operator/director -> principal-swe-architect

- did:       Minted the non-destructive review binding
             `457254b973fb58b129332ffaa609fb5febfdd412` with `git stash create`
             after staging the complete implementation, including the new
             `scripts/lib/pack-plan.mjs`; the worktree was not cleared or rewritten.
             Granted the single required `independent-architecture` review at
             item version 5, then advanced the record to version 6.
- state:     in-review
- needs:     Review the exact `change_ref` for generator determinism and slice
             control, explicit ratified orphan-skill ownership, N-manifest and
             marketplace gate correctness, N=1 backwards compatibility, release
             enforcement, and foundation-only scope. Verify that no pack tree or
             marketplace pack entry is published and that the design leaves
             cross-pack/preflight/degraded-mode guarantees to their owning items.
             Record `ratified` or `changes-required` against this exact ref.
- artifacts: `scripts/lib/pack-plan.mjs`; `scripts/pack-preview.mjs`;
             `scripts/validate-plugin.mjs`; `scripts/release-guard.mjs`;
             `.github/workflows/validate.yml`; release metadata and coordination
             records listed in the item Evidence.
- evidence:  Targeted checks and full `npm test` passed before binding; the bound
             snapshot includes all implementation and release-note changes.
- questions: none
- next:      principal-swe-architect — independently review the exact ref. On
             ratification, return to principal-product-manager for acceptance; on
             rejection, return findings to principal-swe-infra without editing the
             implementation under review.

## HANDOFF 2026-08-24-2231 — principal-swe-architect -> principal-product-manager

- did:       **Independent architecture review — verdict `RATIFIED`** against the exact bound ref
             `457254b973fb58b129332ffaa609fb5febfdd412`. Recorded `completed_reviews[0]`
             (role `principal-swe-architect`, kind `independent-architecture`, verdict `ratified`),
             cleared the lease, routed `next_role: principal-product-manager`, version 6 -> 7.
             No implementation, release, or marketplace file was touched; no branch, commit, PR,
             merge, tag, or release was created.

             **Binding note (method, stated honestly).** This environment has **no shell**
             (read/search/edit tools only), so I could not run `git show <ref>` or re-execute
             `npm test` myself. Per the operator's 2026-08-24-2225 HANDOFF the ref is a
             `git stash create` snapshot taken **after staging the complete implementation**
             (including the new `scripts/lib/pack-plan.mjs`) with the worktree neither cleared
             nor rewritten — i.e. the bound tree is the worktree I read. I reviewed the worktree
             at `C:\src\kai` on `kai/feat/29-pack-generator-gates` line-by-line and bind the
             verdict to the ref on that stated equivalence. If the operator cannot confirm the
             snapshot is identical to the reviewed worktree, this verdict does not bind and the
             review must be re-run.

             **What I verified as correct (the seam holds):**
             1. **Partition truth.** 56 `.agent.md` on disk = 7 core + 20 engineering + 9 product
                + 11 gtm + 9 personal in `PACKS`; the self-test pins `unassigned === 0`,
                `assigned === rosterSize`, and `new Set(flat).size === assigned`, so exactly one
                pack per agent. Skills: 50 `SKILL.md` on disk, each reaching exactly one provider
                by construction (`inheritedCore` | `inheritedLocal[one]` | override), with
                `core ∩ local === ∅` and `unplaced === 0` asserted. The nine mechanical orphans
                carry the **ratified** dispositions verbatim from the partition lock §5 —
                `fleet-observation` -> core; four `demo-*` -> personal; `onboard-to-codebase` +
                three `review-*` lenses -> engineering. Totals reconcile to the lock's ratified
                table (23/15/3/2/7 = 50). The paired assertions (`orphans.length ===
                overrides.length` **and** `unplaced === 0`) are tight in both directions: a new
                orphan or a stale override key both fail.
             2. **Determinism.** Bodies copied verbatim from root (root stays canonical, nothing
                moved); `normalizeLF` on every emitted file; `JSON.stringify(..., 2)` with a fixed
                key order; `agents.sort()`/`skills.sort()` on default UTF-16 order. `checkCommitted`
                normalises **on read** as well, so a CRLF checkout compares clean — the correct fix
                for the platform force. Path handling is right on Windows: keys are always
                forward-slash, reassembled with `join(base, ...rel.split('/'))`; `rel` strings in
                `discoverManifests` are forward-slash; `release-guard` normalises separators.
             3. **Slice control (the important one).** `writeCommitted` throws **before** the
                destructive `rmSync`, so the refusal has no side effect; `COMMITTED_PACKS = []`
                means `--write` cannot materialise all five departments early, and the self-test
                pins both the refusal and that a core+personal slice emits no `kai-engineering/`
                keys. This directly closes the pre-review defect the operator corrected.
             4. **Multi-manifest gates.** `discoverManifests` returns the root manifest alone when
                `packs/` is absent, so N=1 is unchanged; per-manifest structure is checked against
                each manifest's **own** directory; `manifestParityErrors` enforces lockstep
                versions; `marketplaceConsistencyErrors` generalises to N entries while still
                requiring the monolith entry, rejecting duplicate names, and matching every entry
                to its own manifest — with the source-resolves-to-a-plugin.json FS check correctly
                left at the caller so the helper stays pure. Import of `pack-plan.mjs` into the
                validator has no import-time FS side effects.
             5. **Release enforcement + scope.** `packs/` is in `BEHAVIOR_PREFIXES` with self-test
                cases and path spot-checks; CI and `npm test` both run `--self-test` and `--check`;
                `check-syntax` recurses into `scripts/lib/`; `.gitignore` does not exclude `packs/`.
                0.58.0 is coherent across `plugin.json`, `package.json`, `package-lock.json` (both
                fields), `marketplace.json` (both fields), CHANGELOG dated section + compare link,
                README `## Status`, AGENTS.md release-path list. **Scope held:** no `packs/` tree on
                disk, marketplace still has exactly one entry (`kai`), no preflight injection, no
                degraded-mode block, no cross-pack validator, no migration doctor. The CHANGELOG and
                README claims are accurate and **do not** overclaim downstream guarantees.

             **Findings — all non-blocking, none a false pass; carry forward, do not reopen this
             item.** Each fails closed or is unreachable today; the smallest correct home for each
             is the item that first makes it reachable.
             - **A1 (-> `pack-split-generated-pack-trees`).** `checkCommitted` short-circuits only
               when `COMMITTED_PACKS` is empty. With a slice selected and `packs/` absent —
               literally the first state that item enters — `walkCommitted` calls `readdirSync` on
               a missing directory and throws ENOENT **before** the `regenerate with: --write` hint
               prints. Exit is still non-zero (gate holds), but the operator gets a stack trace
               instead of guidance. Guard the walk on `existsSync(base)`.
             - **A2 (-> `pack-split-generated-pack-trees`).** `walkCommitted` treats *every* file
               under `packs/` as generator output. A gitignored `.DS_Store` or `Thumbs.db` inside a
               committed tree fails that contributor's local `--check`/`npm test` while CI stays
               green — a cross-platform split-brain. Skip OS artifacts or scope the walk to tracked
               files.
             - **A3 (-> `pack-split-generated-pack-trees`).** Pin `packs/** text eol=lf` in
               `.gitattributes` when the first tree lands. `.gitattributes` already pins
               `scripts/**` and `test/fixtures/**` for exactly this reason and a byte-compared
               generated tree is the same category. Benign today (no tree committed).
             - **A4 (-> `pack-split-release-12b`, the marketplace flip).** **Publication sits
               outside release enforcement.** `.github/plugin/marketplace.json` is neither a
               `BEHAVIOR_PREFIX` nor a `BEHAVIOR_FILE`. Once a pack tree is committed, flipping it
               from unpublished to published is a *pure* marketplace.json edit: validate accepts it
               and release-guard exempts it — no bump, no CHANGELOG, no README stamp. Nothing in
               this change publishes anything and this change did not create the exemption
               (marketplace.json was always exempt), but this change is what makes a **second**
               entry legal, so the flip item must classify the index as behavior-sensitive or gate
               publication another way. Related: neither the pure helper nor the caller's FS check
               asserts that an entry's `name` matches the `name` inside the `plugin.json` at its
               `source`.
             - **A5 (note, owner's call).** `pack-preview.mjs` still carries a second, independently
               maintained copy of the personal roster: `PACK_AGENTS` and `PACKS.personal` are
               byte-identical today but can drift, and four of the 35 self-test checks run against
               the legacy `planSkills(PACK_AGENTS)` path rather than the canonical `planPacks()`.
               `export const PACK_AGENTS = PACKS.personal;` collapses the duplicate truth this item
               otherwise eliminated. Not a defect today; the authoritative assertions are unaffected.
             - **A6 (note).** `planManifests` always sets `manifest.skills = 'skills'`, but
               `materializePacks` only creates `skills/` when the pack owns ≥1 skill. Every pack
               owns ≥1 today, so unreachable — but a future zero-skill department would generate a
               tree that fails validate's `"skills" path ... does not exist`.

             **Record hygiene for the steward:** all five Acceptance checkboxes on the item are
             still `[ ]`. I deliberately did not tick them — that attestation belongs to the owner
             (`principal-swe-infra`) and to acceptance, not to the reviewer. Reconcile them before
             marking anything shipped.
- state:     in-review
- needs:     `principal-product-manager` acceptance as initiative steward. Three things to weigh:
             (1) accept the ratified foundation and decide the path to `shipped` (this is
             `dependency-guarantees`' foundational `required_item`, and a human must actually
             commit/PR/merge/release it — **nothing here is shipped**); (2) confirm `packs/` as the
             committed-tree root (decomposition Open Question 2 — still the owner's flagged
             assumption, a one-line convention in `PACKS_DIR` + `BEHAVIOR_PREFIXES`); (3) route
             findings A1–A3 into `pack-split-generated-pack-trees` and A4 into
             `pack-split-release-12b` so they are owned rather than remembered.
- artifacts: kai/coordination/items/pack-split-generator-gates.md (version 7, lease cleared,
             `completed_reviews[0]` ratified); kai/coordination/BOARD.md (row refreshed)
- evidence:  Reviewed at ref `457254b973fb58b129332ffaa609fb5febfdd412` via the equivalent worktree
             on `kai/feat/29-pack-generator-gates`, captured 2026-08-24 from C:\src\kai:
             `scripts/lib/pack-plan.mjs`, `scripts/pack-preview.mjs`, `scripts/validate-plugin.mjs`,
             `scripts/release-guard.mjs`, `.github/workflows/validate.yml`, `package.json`,
             `plugin.json`, `package-lock.json`, `.github/plugin/marketplace.json`, `CHANGELOG.md`,
             `README.md`, `AGENTS.md`, `.gitattributes`, `.gitignore`, `hooks.json`. Cross-checked
             against `kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md` §4.3/§5
             (ratified orphan dispositions) and the on-disk roster (56 agents, 50 skills, no
             `packs/` directory, one marketplace entry). Operator's targeted checks and `npm test`
             pass reported at binding; not re-executed here (no shell).
- questions: none blocking. Non-blocking: the `packs/` root convention (Open Question 2) is still
             the owner's flagged assumption awaiting the steward.
- next:      principal-product-manager — accept or return. Asset/hooks-ownership routing is
             correctly **not** delivered here and is already owned by
             `pack-split-crosspack-validator` (assets + hooks-once) and
             `pack-split-generated-pack-trees` (`hooks.json` in its context artifacts); the item's
             Outcome prose still reads "asset/hooks-ownership routing hooks", which overstates what
             shipped — reword it at acceptance so the foundation is not credited with a downstream
             guarantee.

## HANDOFF 2026-08-24-2240 — principal-product-manager -> workflow-ship

- did:       **Steward acceptance — verdict `ACCEPTED`** at the exact ratified ref
             `457254b973fb58b129332ffaa609fb5febfdd412`. Self-granted the lease at version 7
             (token `ppm-2026-08-24-2233-gg-accept`, `version_at_grant: 7`, verified by re-read),
             wrote the acceptance, then cleared the lease; version 7 -> 8 -> 9. No implementation
             or release file was touched; no commit, push, PR, merge, tag, release, or publish.

             **(1) Acceptance criteria reconciled — 4 of 5 met, 1 split and left open.** Ticked
             with evidence: deterministic materialization + per-pack `plugin.json` (35-check
             self-test, architect-verified LF/key-order/sort determinism); N-manifest validation
             with N=1 unchanged (operator run: valid, 56 agents / 50 skills); `packs/` classified
             behavior-sensitive (I spot-read `BEHAVIOR_PREFIXES = ['agents/', 'skills/',
             'scripts/', 'packs/']`); the `0.57.0 -> 0.58.0` bump + CHANGELOG + README stamp.
             **Criterion 4 bundled two different claims** — four local commands *and* "new CI
             steps green" — with two different evidence sources, so I split it. The local half is
             **met** (operator-executed, all exit 0). The remote half is **open by construction**:
             I spot-read that both steps exist in `.github/workflows/validate.yml` (`Pack generator
             self-test`, `Committed pack trees match the generator`), but remote CI has **never
             executed** — the change is uncommitted, unpushed, and has no PR. I did not tick it and
             did not delete it; it closes at PR delivery on a real workflow run. Rewording made the
             criterion truthful, not weaker.

             **(2) Outcome prose corrected.** "asset/hooks-ownership routing hooks" removed —
             it credited this foundation with a downstream guarantee. The Outcome now states the
             delivery as partition/generator/multi-manifest **plumbing only**, and names asset
             ownership + hooks-exactly-once as owned by `pack-split-crosspack-validator`
             (validation) and `pack-split-generated-pack-trees` (materialization).

             **(3) `packs/` CONFIRMED as the committed-tree root** — decomposition Open Question 2
             is **closed** and recorded in the item Evidence as a decision, not an assumption.
             Existing evidence was sufficient; no new investigation was needed. `dist/` rejected:
             it conventionally signals uncommitted build output, the opposite of the
             committed-unpublished contract. Downstream items inherit this and do not re-litigate it.

             **(4) Architect findings routed into owning records** (not left as thread prose):
             A1/A2/A3 -> `pack-split-generated-pack-trees` as acceptance criteria (+`.gitattributes`
             added to its `touches`); A4 -> `pack-split-release-12b` as two acceptance criteria
             (+`scripts/release-guard.mjs`, `scripts/validate-plugin.mjs` added to its `touches`),
             cross-referenced from `generated-pack-trees` because committing the first tree is what
             makes the flip a pure `marketplace.json` edit; A5 -> `pack-split-ci-partition-checks`
             as an acceptance criterion (that item makes the partition self-test a hard CI gate, so
             collapsing the duplicate `PACK_AGENTS` truth belongs immediately before the checks
             become load-bearing); A6 -> **parked as a PROPOSAL** in the initiative backlog,
             unreachable while all five locked departments own ≥1 skill and the northstar forbids a
             sixth pack. **This PR is not expanded** for A5/A6 — re-opening a ratified `change_ref`
             for a non-defect would invalidate the binding review for no gain.

             **(5) Lifecycle — deliberately NOT `shipped`, and not `release-ready` either.**
             State stays **`in-review`**. Per the lifecycle table, `release-ready` is moved by
             `workflow-ship` prepare mode and `shipped` requires evidenced production deployment
             plus verification; the steward owns neither transition. All `review_requirements` are
             satisfied for this `product-change`, so review routing sends it to `workflow-ship`.
             Product acceptance is the steward's call and it is **granted**; the DoD gate is not
             mine to run or to pre-empt.
- state:     in-review
- needs:     `workflow-ship` **prepare mode** runs the six-dimension DoD gate at
             `change_ref 457254b973fb58b129332ffaa609fb5febfdd412` and decides RELEASE-READY vs
             BOUNCE. Steward input for that gate, offered as evidence not as a verdict:
             **dim-1 scope-true** — held to the foundation, and every scope-expanding finding is
             routed/parked, none smuggled in; **dim-3 reviewed** — the single required
             `independent-architecture` review is ratified against this exact ref, and the
             reviewer's own binding caveat is on the record (no shell; verdict bound to the
             worktree on the operator's stated stash-equivalence — **if the operator cannot confirm
             the snapshot is identical to the reviewed worktree, that verdict does not bind and the
             review must be re-run**); **dim-2 verified** — local suite green, remote CI unrun, which
             is the one open acceptance criterion; **design sub-gate** — not triggered, this is
             developer-facing build tooling with no user-facing surface, consistent with the
             northstar's stewardship note. The human must commit, push, and open the PR to produce
             the CI evidence; kai does not perform that step.
- artifacts: kai/coordination/items/pack-split-generator-gates.md (version 9, `in-review`, lease
             cleared, `next_role: workflow-ship`, Outcome corrected, acceptance reconciled, `packs/`
             decision recorded); kai/coordination/items/pack-split-generated-pack-trees.md (v2);
             kai/coordination/items/pack-split-release-12b.md (v2);
             kai/coordination/items/pack-split-ci-partition-checks.md (v2);
             kai/initiatives/pack-split/backlog.md (A6 PROPOSAL);
             kai/initiatives/pack-split/log.md; kai/coordination/ACTIVE.md; kai/coordination/BOARD.md
- evidence:  Reviewed at `change_ref 457254b973fb58b129332ffaa609fb5febfdd412` per the architect's
             2026-08-24-2231 HANDOFF and the operator's 2026-08-24-2225 binding + 2026-08-24-2200
             verification run, captured 2026-08-24 from C:\src\kai. Steward spot-reads (read-only,
             no re-review): `scripts/release-guard.mjs:20` (`packs/` in `BEHAVIOR_PREFIXES`),
             `.github/workflows/validate.yml:41-44` (both new CI steps present, never executed
             remotely), `.kai/manifest.json` (`schema_version: 2`, repository mode, root `.`).
- questions: none blocking. Open for `workflow-ship`/operator: confirm the stash snapshot equals the
             reviewed worktree (the architect's stated binding condition) before the DoD gate relies
             on that ratification.
- next:      workflow-ship — run the DoD gate in prepare mode against this exact ref. On
             RELEASE-READY, produce the ship record with the exact commit/push/PR steps for the
             operator; the remaining acceptance criterion (CI green) closes on the PR's workflow
             run. On any Gap, bounce to `principal-swe-infra` with the named gap. Do not mark
             `shipped` before evidenced deployment. Downstream `dependency-guarantees` items
             (`crosspack-validator`, `preflight-compat`) depend on this item at `shipped`, so they
             remain non-executable until the human completes delivery.

## HANDOFF 2026-08-24-2244 — workflow-ship -> principal-swe-infra

- did:       **Six-dimension DoD gate run in PREPARE mode at `change_ref
             457254b973fb58b129332ffaa609fb5febfdd412`. Verdict: `BOUNCE` — five Clear, one Gap.**
             Self-granted the lease at version 9 (token `wsh-2026-08-24-2244-gg-dod`,
             `version_at_grant: 9`, re-read confirmed holder/token/version), wrote the gate result,
             cleared the lease; version 9 -> 10 -> 11. State returned **`in-review -> in-progress`**
             (not `blocked` — nothing failed and nothing is stalled; `resume_state` stays `null`).
             **No ship record was written** (none is written for a bounced item). No implementation,
             release-metadata, or downstream-scope file was touched; no commit, push, PR, merge,
             tag, release, or publish. This environment has no shell (read/search/edit tools only),
             so nothing was executed — all evidence below is read-only or operator-reported.

             | # | Dimension | Status | Evidence |
             |---|-----------|--------|----------|
             | 1 | scope-true | **Clear** | Foundation plumbing only; Outcome overclaim corrected at acceptance. Inside `scope.current: [dependency-guarantees]`; `northstar.scope.targets` covers `scripts/pack-preview.mjs`, `scripts/lib/`, `scripts/validate-plugin.mjs`, `plugin.json`, and `release-guard.mjs`/`validate.yml` serve that milestone's CI-enforcement acceptance. `non_negotiable` held: root stays source of truth (bodies copied, nothing moved), trees generated-and-unpublished (`COMMITTED_PACKS = []`, marketplace still one entry `kai`), groundwork on `0.x` (0.58.0), no sixth pack. Every scope-expanding finding is routed or parked, none smuggled in — verified present in the owning records, not just asserted: `pack-split-generated-pack-trees.md:80,84,87` (A1/A2/A3) + `.gitattributes` in its `touches:24`; `pack-split-release-12b.md:72,77` (A4); `pack-split-ci-partition-checks.md:74,77` (A5); `kai/initiatives/pack-split/backlog.md:47` (A6 PROPOSAL). |
             | 2 | verified | **GAP** | Local suite green twice, operator-executed, all exit 0 — but **remote CI has never run**, and the item's own acceptance criterion 5 is open. See the gap detail below. Design sub-gate: **not triggered** — developer-facing build tooling, no user-facing surface (no waiver needed or invented). |
             | 3 | reviewed | **Clear** | Sole `review_requirements` entry (`principal-swe-architect` / `independent-architecture`) has a `ratified` `completed_reviews` verdict bound to this exact `change_ref` (2026-08-24-2231). The reviewer's own binding condition — "if the operator cannot confirm the snapshot is identical to the reviewed worktree, this verdict does not bind" — is **discharged**: the operator confirmed byte-identity with `git diff <change_ref> -- <implementation/release files>`. `git stash create` objects are explicitly sanctioned as a `change_ref` by `kai-core-work-coordination`. Findings A1–A6 owned or parked (paths under dim-1). |
             | 4 | shippable-safely | **Clear (proportional)** | `review-rollout-operability` applied and right-sized: no runtime service, no data, no migration, no user surface. Pre-merge reversibility is total (do not merge); post-merge is a revert of one PR. Fail-closed by construction — `writeCommitted` throws **before** the destructive `rmSync`, `COMMITTED_PACKS = []` blocks early materialization, and `discoverManifests` leaves N=1 byte-for-byte unchanged. **Named residual risk:** the two new steps become mandatory gates on *every* PR in this repo, so a platform-fragile `--check` blocks all contributors; monitoring signal is the `validate` workflow itself, rollback is reverting those two steps, owner `principal-swe-infra`. That risk is exactly what the dim-2 gap would retire. |
             | 5 | documented | **Clear** | `CHANGELOG.md:7` dated `[0.58.0] - 2026-08-24` section + `:2563` compare link; README `## Status`; AGENTS.md release-path list (+`packs/`); the `packs/` committed-root decision recorded in the item Evidence and in `kai/initiatives/pack-split/log.md` (2026-08-24 steward-acceptance entry). No `kai/library/` promotion demanded: this workspace has no `kai/library/` tree and keeps durable decisions under `kai/initiatives/<slug>/artifacts/decisions/` — inventing a control the repo does not have is not a gate. The initiative `log.md` ship stamp is deliberately **not** written; that belongs to the ship, and this did not ship. |
             | 6 | coordination-closed | **Clear** | Item record current and truthful (v11, lease cleared, `resume_state: null`); thread append-only; dependency `pack-split-partition-lock` is `completed`; `waiting_on_questions: []` and the three open initiative questions are non-blocking; A6 parked in the committed backlog. The deploy HANDOFF is absent only because dim-2 is open — a consequence of the gap, not a second gap. |

             **The Gap — dim-2, remote CI evidence. Owner: `principal-swe-infra`.** Acceptance
             criterion 5 ("the new CI steps run green on the pushed PR") has **no evidence and can
             acquire none** while the change is uncommitted, unpushed, and PR-less. `kai-core-definition-of-done`
             is explicit that an unbacked Clear is a Gap, and this is **not waivable** — a waiver is
             legitimate only when a dimension genuinely does not apply, and CI applies here by the
             item's own acceptance. It is also not bookkeeping; it is the only check left that can
             actually fail:
             1. **Platform.** All green evidence is Windows (`C:\src\kai`); `validate.yml` runs
                `ubuntu-latest` / Node 20. The change's central claim is byte-stable, LF-normalised,
                forward-slash-keyed generation — the exact class that passes on one platform and
                fails on the other, and the exact hazard architect findings A2/A3 name.
             2. **A step never executed in any form.** `Release-guard (behavior change requires a
                bump + release notes)` is `if: github.event_name == 'pull_request'` and runs
                `release-guard --base <base.sha> --head <head.sha>`. The local run was `--self-test`,
                which exercises the classifier, **not** the real base/head gate over this diff.
                `scripts/` is a `BEHAVIOR_PREFIX`, so this diff will be classified behavior-sensitive
                and the gate will demand the bump + CHANGELOG + README that are present — but that
                demand has never been evaluated against a real base/head pair.
             3. **Ordering contract.** `kai-core-pr-delivery` encodes the chain
                `pr-sizing -> PR-DELIVERY (opens and lands ONE pull request) -> kai-core-definition-of-done
                (says it is release-ready) -> workflow-ship (deploys it)`. PR delivery sits
                **upstream** of the readiness gate in this repo, so it is not a step I may fold into
                a deploy handoff. Declaring `release-ready` now would also put the item on the
                operator's *deploy* agenda when what it actually needs is *PR delivery* — a
                misroute, and per the lifecycle table `release-ready` means "DoD is clear", which it
                is not.
- state:     in-progress
- needs:     `principal-swe-infra` performs PR delivery under `kai-core-pr-delivery`, then returns the item
             to `workflow-ship`. **The ratified tree must not be edited.** Commit
             `457254b973fb58b129332ffaa609fb5febfdd412` **byte-identically** — no A5/A6 fixes, no
             CHANGELOG rewording, no tidying. Any content change invalidates the ratified
             `independent-architecture` verdict, needs a new `change_ref`, and returns the item to
             `principal-swe-architect`. The PR head commit will legitimately have a different SHA
             than the stash object; that alone is not an implementation change — if `change_ref` is
             re-pointed to the PR head, record an empty `git diff <ratified-ref> <pr-head>` in
             Evidence so the verdict still binds. Note the stash object is **dangling and
             garbage-collectable**: commit the branch before it is lost. Then, in order:
             1. Branch `kai/feat/29-pack-generator-gates` (rung-1 anchor, already correct).
             2. Commit the reviewed tree; title `feat: harden the pack generator and make
                validate/release gates multi-manifest aware` (<=72 chars, no trailing `(#N)`).
             3. PR body per `kai-core-pr-delivery` §4: Problem / Change / **The change at a glance**
                (structure change — use `build-diagrams`) / **Deliberately not done** (no pack trees,
                no preflight, no degraded block, no cross-pack validator, no publication; A5/A6 not
                fixed here and why) / **Review fixes** (the two pre-review defects the operator
                corrected: orphan-sweep and unrestricted `--write`) / Verification (name the exact
                commands) / **Rollout / reversibility** (the two new steps gate every future PR).
                No Before/after — no user-visible surface. `Closes #29`.
             4. `git fetch` first and re-check the remote version before trusting the local `0.58.0`
                baseline (`kai-core-pr-delivery` §5.1) — concurrent work makes the local file an
                unreliable baseline.
             5. **Watch the `validate` workflow.** All eight steps must be green, and specifically
                `Pack generator self-test`, `Committed pack trees match the generator`, and the
                PR-only `Release-guard` step. That run is the evidence that closes acceptance
                criterion 5 — cite the workflow-run URL, do not assert it.
             **Abort criteria:** if `--check` or the generator self-test fails on `ubuntu-latest`
             while passing on Windows, stop and treat it as a real defect (an LF/path/OS-artifact
             bug, cf. A2/A3), not as CI flake. If the PR-only release-guard step fails, do not
             hand-edit around it. Either way the item stays `in-progress` and comes back through
             review if the tree changes.
             **The human presses merge** — kai does not merge, tag, release, or publish.
- artifacts: kai/coordination/items/pack-split-generator-gates.md (v11, `in-progress`, lease cleared,
             `next_role: principal-swe-infra`, gate result + no-edit constraint in Notes);
             kai/coordination/BOARD.md (row refreshed); kai/coordination/ACTIVE.md (focus pointer
             corrected). No ship record and no `kai/library/releases/**` entry — correct for a bounce.
- evidence:  Read-only, captured 2026-08-24 from C:\src\kai (no shell in this environment; nothing
             executed): `.github/workflows/validate.yml` (`runs-on: ubuntu-latest`; the two new steps;
             the `pull_request`-gated release-guard base/head step); `package.json:3` (`0.58.0`) and
             `:18` (`npm test` chains `pack-preview --self-test` + `--check` — the commands that ran
             **on Windows**); `CHANGELOG.md:7,2563`; `kai/initiatives/pack-split/northstar.md`
             (`scope.current`, `non_negotiable`, `dependency-guarantees.required_items` requires this
             item at `shipped`); the four routed records + backlog cited under dim-1; this thread's
             2026-08-24-2200/2225/2231/2240 entries. Operator-reported (not re-executed here): local
             suite green twice, and `git diff <change_ref> -- <implementation/release files>` clean.
- questions: none blocking. The architect's binding condition is **discharged** by the operator's
             byte-identity confirmation and is no longer open.
- next:      `principal-swe-infra` — PR delivery, then hand back to `workflow-ship` with the
             workflow-run URL and conclusion. On green CI the gate re-runs with dim-2 Clear and the
             item moves `in-review -> release-ready` with the deploy handoff; the four downstream
             `dependency-guarantees`/`first-pack-extracted` items require this item at `shipped`, so
             they stay non-executable until the human completes delivery and deployment.

## HANDOFF 2026-08-24-2252 — workflow-ship -> @operator

- did:       **Six-dimension DoD gate RE-RUN in PREPARE mode after the 2026-08-24-2244 BOUNCE.
             Verdict: `RELEASE-READY` — all six dimensions Clear.** Self-granted the lease at
             version 11 (token `wsh-2026-08-24-2252-gg-dod2`, `version_at_grant: 11`, re-read
             confirmed holder/token/version), wrote the gate result, cleared the lease;
             version 11 -> 12 -> 13. State **`in-progress` -> `release-ready`**
             (`resume_state` stays `null`). **Ship record written.** Nothing was committed,
             pushed, merged, tagged, released, or published; no implementation, release-metadata,
             or downstream-scope file was touched. **kai did not merge and will not.**

             This environment has no shell (read/search/edit tools only), so nothing was
             executed locally. Remote evidence was read directly from the GitHub REST API
             (read-only) rather than taken on report — the delivery claims below are verified,
             not asserted.

             **The one Gap that bounced this item is closed, on the platform the risk lived on.**
             Acceptance criterion 5 ("the new CI steps run green on the pushed PR") now has real
             evidence: GitHub Actions run **32814515790**, job **`contract`** (`97700043167`),
             `ubuntu-latest` / Node 20, `status: completed`, **`conclusion: success`**, 13s
             (`2026-08-25T05:51:47Z -> 05:52:00Z`) at PR head
             `4ed8f88562909ac292d856902b401a724f796f02` —
             https://github.com/RubenSaucedo/kai/actions/runs/32814515790/job/97700043167
             **All 11 steps green.** Each of the three bounce reasons is retired by name:
             1. **Platform.** Every prior green run was Windows; this one is `ubuntu-latest`.
                The byte-stable, LF-normalised, forward-slash-keyed generation claim — the exact
                class that passes on one OS and fails on the other, and the hazard A2/A3 name —
                passed there.
             2. **The step that had never executed in any form.** Step 11,
                `Release-guard --base <base.sha> --head <head.sha>` (the `pull_request`-only
                **real** gate, not `--self-test`), ran against this diff and passed: `scripts/`
                is a `BEHAVIOR_PREFIX`, so it classified the change behavior-sensitive and found
                the `0.58.0` bump + CHANGELOG + README it demands.
             3. **Repo-wide blast radius.** The two steps that become mandatory on *every* future
                PR (`Pack generator self-test`, `Committed pack trees match the generator`) are
                green on the runner every future PR will use.

             | # | Dimension | Status | Evidence |
             |---|-----------|--------|----------|
             | 1 | scope-true | **Clear** | PR #152's file set = this item's `touches` + release metadata + coordination records; nothing smuggled. `non_negotiable` verified **at the PR head**, not asserted: `GET /contents/packs?ref=4ed8f88…` -> **404** (no committed pack tree); the `marketplace.json` patch is version-only (`0.57.0 -> 0.58.0`, both fields) so the index still lists exactly one plugin, `name: kai`, `source: "."`; groundwork on `0.x`; no sixth pack. Inside `northstar.scope.current: [dependency-guarantees]`. A1–A3 -> `generated-pack-trees`, A4 -> `release-12b`, A5 -> `ci-partition-checks`, A6 -> backlog PROPOSAL — all still present in the owning records. |
             | 2 | verified | **Clear** *(was the Gap)* | The run above: 11/11 steps `success` on `ubuntu-latest`, including the two new steps and the PR-only real release-guard gate. Local suite (35-check `--self-test`, `--check`, `validate-plugin`, `release-guard --self-test`, `check-syntax`, `npm test`) operator-executed, all exit 0. Design sub-gate **not triggered** — developer-facing build tooling, no user-facing surface; no waiver needed and none invented. |
             | 3 | reviewed | **Clear** | Sole `review_requirements` entry (`principal-swe-architect` / `independent-architecture`) `ratified` at `change_ref 457254b973fb58b129332ffaa609fb5febfdd412`. The implementation **did not change** through PR delivery — operator-confirmed empty diff to PR head `4ed8f88…` across all implementation and release files, restated publicly in PR #152's body. Per `kai-core-work-coordination` (`change_ref` updates *when implementation changes*), the item's `change_ref` **deliberately stays** at the ratified object, so `completed_reviews.change_ref == change_ref` still matches exactly. The architect's snapshot-equivalence caveat was discharged at 2026-08-24-2244 and is not reopened. |
             | 4 | shippable-safely | **Clear (proportional)** | `review-rollout-operability` applied, verdict **Holds**. No runtime service, no data, no migration, no external state, no user-facing surface, no publication change. Fail-closed by construction (`COMMITTED_PACKS` empty; `writeCommitted` throws before any `rmSync`; `discoverManifests` leaves N=1 byte-for-byte unchanged). Pre-merge reversibility total; post-merge = revert one squash-merge commit, and **nothing survives that revert** — no data migration to un-do. **The residual risk I named at the bounce is retired** by the green Ubuntu run. Signals: `validate` on `main`, then the next PRs. Owner `principal-swe-infra`. |
             | 5 | documented | **Clear** | `CHANGELOG.md` `[0.58.0] - 2026-08-24` + compare link; `README.md` `## Status` `v0.58.0` (honestly framed — "no packs are published yet"); `AGENTS.md` release path (+ committed `packs/` tree); the `packs/` root decision in the item Evidence and `log.md`. Ship record written and indexed in `deliverables.md`; `log.md` carries the **release-ready** entry. The **ship** stamp is deliberately withheld — it has not shipped. |
             | 6 | coordination-closed | **Clear** | Item v13 current and truthful (criterion 5 ticked **with the run URL**); this HANDOFF is the deploy handoff; BOARD/ACTIVE refreshed; dependency `partition-lock` `completed`; `waiting_on_questions: []`; the three initiative questions are non-blocking; A6 parked in the committed backlog. **Recorded, not hidden:** PR delivery was executed by the operator directly rather than routed back through a `principal-swe-infra` HANDOFF, so the thread had no delivery entry — this entry supplies it, and every delivery claim was re-verified against GitHub. |

             **Two non-blocking deviations from the shape I prescribed at the bounce, reviewed and
             accepted as CORRECT — no gap:** (a) the PR title is
             `feat(pack-split): add generator and manifest gates` (49 chars, imperative, correct
             `<type>`, no trailing `(#N)`) — conforms to `kai-core-pr-delivery` §3; (b) the body says
             `Part of #29`, not `Closes #29`, which is **more** accurate than my instruction —
             issue #29 is the umbrella "Align Kai positioning and evaluate optional plugin packs",
             not this item, and `Closes` would have falsely retired the whole initiative on merge.
- state:     release-ready
- needs:     **@operator merges PR #152. kai does not merge, tag, release, or publish.**
             1. **Confirm the verified head is still the head:** `git fetch origin && git rev-parse
                origin/kai/feat/29-pack-generator-gates` must print
                `4ed8f88562909ac292d856902b401a724f796f02`. **If it differs, STOP** — the CI
                evidence is bound to that SHA and the gate must re-run.
             2. **Squash and merge PR #152** into `main` (repo convention; GitHub auto-appends
                `(#152)`). **Do not push more commits to the branch first** — that changes the head
                SHA and detaches the verified CI evidence.
             3. **Watch `validate` on `main`** (push event, 10 steps; the PR-only release-guard step
                is correctly skipped on push). All green.
             4. **Commit the readiness records separately, after the merge.** PR #152's head still
                contains this item at v11/`in-progress`; the `release-ready` records are
                working-tree-only. `kai/` is not a `BEHAVIOR_PREFIX`, so release-guard will not
                demand a second bump. Promote the ship record on the way:
                `mkdir -p kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates` then
                `git mv kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md
                kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md`
                (I could not create the directory — this environment has no shell).
             5. **Per `AGENTS.md`, once `main` is green:** `git tag v0.58.0 && git push origin
                v0.58.0`, then cut the GitHub release from the `[0.58.0]` CHANGELOG entry.
             **Abort criteria:** head SHA mismatch at step 1; a merge conflict on `main` (a rebase
             changes the tree, so both the ratified binding and the CI evidence stop applying —
             return to the gate); `validate` red on `main` after merge -> **revert first**
             (`git revert <merge-sha>`, or GitHub Revert on #152), then treat it as a real defect,
             not flake, and route to `principal-swe-infra`. Never hand-edit around a failing
             release-guard step. If a rollback happens, only `workflow-ship` returns this item to
             `release-ready`, on rollback evidence.
             **Production verification to run after merge:** (1) `validate` green on `main` at the
             merge commit; (2) `0.58.0` coherent on `main` across `plugin.json`, `package.json`,
             `package-lock.json`, `marketplace.json`, README `## Status`, CHANGELOG section +
             compare link; (3) `marketplace.json` still exactly one entry, `name: kai`,
             `source: "."`; (4) `GET /contents/packs?ref=main` -> **404**, no `packs/` tree
             published.
- artifacts: kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md
             (**ship record**; canonical destination
             `kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md`,
             promotion pending the operator `mkdir`);
             kai/coordination/items/pack-split-generator-gates.md (v13, `release-ready`, lease
             cleared, `next_role: @operator`, criterion 5 ticked with the run URL, gate result in
             Notes); kai/coordination/threads/pack-split-generator-gates.md (this entry);
             kai/coordination/BOARD.md (row refreshed); kai/coordination/ACTIVE.md (focus pointer);
             kai/initiatives/pack-split/log.md (release-ready entry, **not** a ship stamp);
             kai/initiatives/pack-split/deliverables.md (release-record row, promotion pending)
- evidence:  Verified read-only by `workflow-ship` against the GitHub REST API, 2026-08-24-2252:
             job `97700043167` (`contract`, run 32814515790, `ubuntu-latest`, `head_sha
             4ed8f88562909ac292d856902b401a724f796f02`, `conclusion: success`, 11/11 steps
             `success`); PR #152 `state: open`, `merged_at: null`, head `4ed8f88…`, base `main`,
             branch `kai/feat/29-pack-generator-gates`; `GET /contents/packs?ref=4ed8f88…` -> 404;
             `marketplace.json` patch version-only, one `kai` entry. Read locally from C:\src\kai
             (nothing executed): `.github/workflows/validate.yml` (job `contract`, 8 authored steps,
             the two new ones, the `pull_request`-gated release-guard); `package.json:3` and
             `plugin.json:4` (`0.58.0`); `.github/plugin/marketplace.json` (one plugin, `kai`);
             `kai/initiatives/pack-split/northstar.md` (`scope.current`, `non_negotiable`,
             `dependency-guarantees.required_items` requires this item at `shipped`); the four
             routed records and the backlog. Operator-reported (not re-executed here): the local
             suite green, and the empty `git diff 457254b97… 4ed8f88…` over implementation and
             release files — the latter also stated publicly in PR #152's body.
- questions: none blocking. One **action for @operator** (not a blocker on any kai role): press
             merge on PR #152 per the steps above, then return the merge commit SHA, the merge
             timestamp, the `main` workflow-run URL **and its conclusion**, and the `v0.58.0`
             tag/release URL if cut.
- next:      **@operator** — merge PR #152, then hand the deployment evidence back to
             `workflow-ship` for CONFIRM-START (`release-ready -> deploying`) and CONFIRM-COMPLETE
             (`deploying -> production-verification -> shipped`). A run URL without a success
             conclusion is not completion. `release-ready` is **not** `shipped`: the four
             dependents (`crosspack-validator`, `preflight-compat`, `migration-doctor`,
             `generated-pack-trees`) declare `depends_on: generator-gates (shipped)` and stay
             non-executable until production verification passes.

## NOTE 2026-08-24-2300 — readiness records included in PR #152

- The release-ready coordination records and pre-promotion ship record are being
  committed to PR #152 rather than carried as an uncommitted post-merge change.
  This supersedes the prior HANDOFF instruction to require the branch head to
  equal `4ed8f88562909ac292d856902b401a724f796f02` and to commit the records after
  merge.
- `4ed8f88562909ac292d856902b401a724f796f02` remains the reviewed implementation
  commit. Any later PR commit must be coordination-only: that commit must remain
  an ancestor of the current head, the implementation/release-file diff from it
  must stay empty, and the required `contract` check must pass on the final head.
- The ship record remains at its pre-promotion initiative path until
  CONFIRM-COMPLETE moves it to the canonical library location. Nothing is merged,
  tagged, released, published, or marked `shipped`.

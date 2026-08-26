# Thread — pack-split-generated-pack-trees

Append-only communication log mirroring
`kai/coordination/items/pack-split-generated-pack-trees.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. **Slice:** generate committed-unpublished `kai-core` + `kai-personal` trees from root (generate-not-move), realizing architect caveat (c) asset-ownership (demo-*.mjs -> personal; hooks + observe-*.mjs -> core only, hooks exactly once). Deferred: engineering/product/gtm trees generated one-at-a-time in `pack-split-release-12c`. Size L. Owner `principal-swe-infra`; review `principal-swe-architect`/independent-architecture. Depends on all four dependency-guarantee items + `pack-split-generator-gates` (shipped) + `pack-split-host-semantics-spike` (completed).
- state:     proposed
- needs:     Steward grooming + promotion; confirm committed-tree location `packs/` (Open Question 2).
- artifacts: kai/coordination/items/pack-split-generated-pack-trees.md; decomposition WS#7
- evidence:  scripts/pack-preview.mjs buildAll() + PACKS.personal; hooks.json -> observe-subagent.mjs; scripts/demo-*.mjs invoked by creative-video-director + video-direction — captured 2026-08-24 from C:\src\kai
- questions: architect caveat (b) review-lens binding is NOT on this (personal) critical path — resolve before the engineering tree is generated (12c)
- next:      principal-product-manager — groom milestone-by-milestone; personal-first honors "one department at a time".

## NOTE 2026-08-24-2240 — principal-product-manager (steward) — carry-forward from `pack-split-generator-gates` acceptance

- Item version 1 -> 2. State stays `proposed`; `next_role` unchanged
  (`principal-product-manager`) — this is grooming of a not-yet-promoted record, not a promotion.
  No lease was needed or taken (lease was and remains null).
- **Committed-tree root `packs/` CONFIRMED** (decomposition Open Question 2 **closed**). The
  `needs` line above — "confirm committed-tree location `packs/`" — is now satisfied: existing
  evidence was sufficient (the accepted decomposition, this item's own `touches`, and the ratified
  implementation's `PACKS_DIR`/`BEHAVIOR_PREFIXES`). `dist/` rejected as signalling uncommitted
  build output. Recorded in Notes; do not re-litigate.
- **Architect findings A1–A3 added as acceptance criteria**, from the `independent-architecture`
  review ratified 2026-08-24-2231 at `change_ref 457254b973fb58b129332ffaa609fb5febfdd412`. All
  three were non-blocking there and are unreachable until a committed tree exists — which is this
  item — so this is their smallest correct home:
  **A1** guard `checkCommitted`'s walk on `existsSync(base)` so the first state this item enters
  (slice selected, `packs/` still absent) prints the `--write` guidance instead of an ENOENT stack
  trace; the gate already fails closed, so this is guidance not correctness.
  **A2** stop treating every file under `packs/` as generator output — a stray `.DS_Store` /
  `Thumbs.db` would fail a contributor's local `--check`/`npm test` while CI stays green.
  **A3** pin `packs/** text eol=lf` in `.gitattributes` when the first tree lands, matching the
  existing `scripts/**` and `test/fixtures/**` pins. `.gitattributes` added to `touches`.
- **A4 cross-reference (owned by `pack-split-release-12b`, not here).** Marketplace publication is
  currently outside release enforcement. Committing the first tree here is precisely what turns the
  unpublished→published flip into a pure `marketplace.json` edit that release-guard exempts. The
  trees land **unpublished** by contract so nothing is published by this item, but if publication
  becomes possible before `12b` runs, raise it to the steward rather than absorbing the guard here.
- Dependencies are unchanged and still unmet: this item requires `pack-split-generator-gates` at
  `shipped`, which it is **not** — that item is `in-review`, accepted and routed to `workflow-ship`,
  with nothing committed, pushed, merged, or released. This item is not executable.

## NOTE 2026-08-25-1125 — workflow-ship: 1 of 6 dependencies satisfied; still blocked

- **Correcting the last line above, which is now out of date.**
  `pack-split-generator-gates` reached **`shipped`** at 2026-08-25-1125 — PR #152 merged
  2026-08-25T18:20:55Z, merge commit `47aa0549f89b1733483dd6b662a4787d621c9430`, released
  `v0.58.0`, production verification passed. That dependency is **satisfied**.
- **This item remains NOT executable.** It has **six** dependencies and five are still
  open: `pack-split-crosspack-validator`, `pack-split-preflight-compat`,
  `pack-split-degraded-refusal`, `pack-split-ci-partition-checks` (all required at
  `shipped`) and `pack-split-host-semantics-spike` (required at `completed`). All five are
  `proposed`. It is additionally in `first-pack-extracted`, outside
  `northstar.scope.current`.
- `workflow-ship` reconciles dependencies only; it did not promote, dispatch, or
  re-prioritize, and changed no field on this record.
- **Now unblocked for the A1–A3 work when this item eventually runs:** the `packs/` root is
  live in production — `BEHAVIOR_PREFIXES` on `main` at `v0.58.0` includes `packs/`, so a
  committed tree here will require a bump + CHANGELOG + README. Confirmed at production
  verification: **no `packs/` tree exists on `main`**, so this item still owns creating the
  first one, and A1 (`checkCommitted` ENOENT before the `--write` hint) is still reachable
  exactly as described.

## NOTE 2026-08-25-1440 — workflow-ship: 3 of 6 dependencies satisfied; still blocked and still out of scope

- **`pack-split-crosspack-validator` reached `shipped`** at 2026-08-25-1440 — PR #156
  squash-merged 2026-08-25T21:38:09Z into merge commit
  `32a07a9a56a6b244586f9048b6bb395e86e43020`, released **`v0.60.0`**, `main` run `32902043562`
  `conclusion: success`, production verification PASSED. With `pack-split-preflight-compat`
  (`v0.59.0`) and `pack-split-generator-gates` (`v0.58.0`), **three of six** dependencies are
  satisfied.
- **This item remains NOT executable.** Three are still open: `pack-split-degraded-refusal` and
  `pack-split-ci-partition-checks` (both required at `shipped`; both are `ready` and now
  dispatchable, but neither has shipped) and `pack-split-host-semantics-spike` (required at
  `completed`; it needs an `@operator` host session). It is additionally in
  `first-pack-extracted`, outside `northstar.scope.current` — the one-way valve stays shut
  regardless of dependency count.
- `workflow-ship` reconciles dependencies only; it did not promote, dispatch or re-prioritize,
  and **changed no field on this record**.
- **Binding constraints this item inherits from the `v0.60.0` architecture ratification —
  carried here so they are not rediscovered:** (1) **consume `planAssets` and `HOOKS_OWNER`; do
  not re-derive ownership** — a second ownership truth in the emitter is the A5 duplicate-truth
  defect class and would be invisible, because the validator would keep agreeing with itself;
  (2) **route the hook's scripts by declaration** — `hooks.json` and everything its commands
  invoke ship with `HOOKS_OWNER`, because `${PLUGIN_ROOT}` never crosses a plugin boundary, so a
  prose mention must not decide where a host-executed script lands; (3) **emit `hooks.json` into
  core only** — the union check fails a second emitter by name, and that alarm is intended.
- **Two recorded caveats become live work here, not defects today.** **N3** — the hooks-claimant
  filter is `key.endsWith('/hooks.json')` where `^[^/]+/hooks\.json$` is the intent; unreachable
  until this item emits trees. **N4** — the collector's asset key-space is top-level
  `scripts/<name>.<ext>` while the hooks-command extractor accepts nested paths and reads only
  the first `${PLUGIN_ROOT}` path per command; a nested or second hook script fails closed but
  with a misleading "no pack owns it" message. Also inherited: **two of
  `assetOwnershipErrors`' four arms are structurally unreachable** until this item supplies an
  independent owner source — today's green is not the guarantee they will become.
- **Production still holds the committed-unpublished line:** at the `v0.60.0` merge commit,
  `COMMITTED_PACKS = []`, there is **no `packs/` tree**, and the marketplace is still N=1
  (`kai` at `source: "."`). This item still owns creating the first tree.

## NOTE 2026-08-25-1612 — workflow-ship: 4 of 6 dependencies satisfied; still blocked and still out of scope

- **`pack-split-degraded-refusal` reached `shipped`** at 2026-08-25-1612 — PR #158
  squash-merged 2026-08-25T23:12:06Z into merge commit
  `680ca445a2616bc9bc1b972db6b40042c06abf6c`, released **`v0.61.0`**, `main` run `32909692506`
  `conclusion: success`, production verification **8 of 8 PASS**. With
  `pack-split-crosspack-validator` (`v0.60.0`), `pack-split-preflight-compat` (`v0.59.0`) and
  `pack-split-generator-gates` (`v0.58.0`), **four of six** dependencies are satisfied.
- **This item remains NOT executable.** Two are still open: `pack-split-ci-partition-checks`
  (required at `shipped`; it is `ready` and dependency-satisfied, but has not shipped and has
  not been dispatched) and `pack-split-host-semantics-spike` (required at `completed`; it needs
  an `@operator` host session). It is additionally in `first-pack-extracted`, outside
  `northstar.scope.current` — the one-way valve stays shut regardless of dependency count.
- `workflow-ship` reconciles dependencies only; it did not promote, dispatch or re-prioritize,
  and **changed no field on this record**.
- **What this item now inherits as live surface on `main` (`v0.61.0`):** `materializePacks`
  injects **both** guarantee blocks — `guaranteeBlocks()` states the order `[preflight,
  degraded]` **once** and `injectBlocks()` splices them in a **single** pass — into every
  non-core agent and **neither** into a core agent, and `validate-plugin.mjs` byte-pins both
  over real generator output. So the first generated tree this item commits will be checked for
  exact bytes, exactly one copy of each, zero copies in core, and the preflight-then-refusal
  order with only whitespace between. Build against those functions; do not re-derive injection.
- **Two findings were routed *here* and are waiting, not lost.** **A1** (architecture, deferred
  with this item named as the reopen trigger): core agents carry neither block, on an argument
  that is airtight for *install-level* absence but not for the *context-loading* absence the
  refusal now owns — covering core needs a **second** canonical block with its own pin, because
  this block's first sentence would be false where no preflight exists. `principal-security`
  adds that core holds `director-chief-of-staff` and `workflow-workspace-init`, so the uncovered
  blast radius there is **larger per agent**, not smaller. It becomes real the moment this item
  makes a core-only install possible. Also carried: **P2-S1/N1** — `validate-plugin.mjs:443`
  gates **both** guarantees on `/^kai-[a-z]+\/agents\/.+\.agent\.md$/`, so any new pack key
  outside `[a-z]+` would escape both pins together.
- **Production still holds the committed-unpublished line:** at the `v0.61.0` merge commit,
  `COMMITTED_PACKS = []`, there is **no `packs/` tree** (proven positively from the complete
  root tree), and the marketplace is still N=1 (`kai` at `source: "."`). This item still owns
  creating the first tree.

## NOTE 2026-08-25-1803 — principal-product-manager (steward): in scope, 5 of 6 deps met, deliberately NOT promoted

- Item version 2 -> 3. **State stays `proposed`**, `next_role` stays
  `principal-product-manager`, lease stays `null`. Grooming, not promotion.
- **The scope objection recorded four times above is now retired.** `dependency-guarantees`
  closed **5 of 5** required items `shipped` in this pass and **`scope.current` advanced to
  `first-pack-extracted`**. `ci-partition-checks` shipped as `v0.62.0` (merge `b72453f1…`,
  production verification 9/9), so **5 of 6** `depends_on` entries are met. The sixth —
  `pack-split-host-semantics-spike` at `completed` — is not, and it is the one whose answer can
  rewrite this item.
- **Why not chain-promote it to `ready` anyway.** It would be contract-legal (`ready` needs
  dependencies *declared*, not resolved — this initiative did exactly that on 2026-08-25-1148).
  It is withheld on **acceptance readiness**: three product decisions that shape what this item
  emits are open, and promoting now would hand `principal-swe-infra` an acceptance set that
  moves under it mid-build. Recorded in full in the item's `### Steward grooming —
  2026-08-25-1803` section; in short, the promotion preconditions are (1) the spike's go/no-go,
  (2) **proposal A1** — whether core agents need their own canonical block for the
  context-loading absence, where **this item is the named reopen trigger** because it emits the
  first committed core tree, and (3) the riders decided as a set: **N4**, **N5**, the §147/§157
  errata, **N3**, the nested-hook key-space caveat, and the cross-department **agent-referral
  degradation** proposal whose own trigger is this item reaching implementation.
- **A1 is why the milestone amendment matters here.** `dependency-guarantees` closed on
  acceptance lines narrowed to "every generated **department**-pack agent" — because CI errors
  if a **core** agent carries either block. Core's coverage was therefore **not** claimed by
  that milestone; it is an open decision that lands on this item, and it is a new file, a new
  pin and a new refusal budget if the answer is yes.
- Nothing was dispatched, no lease taken, no acceptance criterion added or removed, and no
  field other than `version`/`updated` changed. `COMMITTED_PACKS` is still `[]` with no `packs/`
  tree at `v0.62.0`.

## HANDOFF 2026-08-26-1340 — principal-product-manager -> principal-swe-infra

- did:       Promoted proposed -> ready at priority 10 after the host spike completed. Closed A1
             as an explicit accepted residual after v0.63.1 fixed delegated skill access; decided
             the referral contract (bare role prose, live-roster provider qualification at
             dispatch, absent department named without substitution); bounded N4/N5, hook-path
             diagnostics, asset-ownership mutation arms and proposal errata as riders R2-R6.
- state:     ready
- needs:     Build exactly committed-unpublished kai-core + kai-personal. Before merge, run the
             ambient-discovery stop gate from this repository. Do not touch marketplace.json.
- artifacts: item v4; host-semantics reliability record; degraded-refusal decision.
- evidence:  six of six dependencies met; PR #165 / v0.63.1; Windows CLI 1.0.80 empty-workspace
             delegated preflight passed with exactly one child skill call.
- questions: none. Stop on ambient discovery, a third pack, or any publication surface.
- next:      principal-swe-infra — implement, validate, obtain independent architecture review,
             then hand to workflow-ship.

## NOTE 2026-08-26-1420 — principal-swe-infra: implementation + R7 evidence

- Commit `5a5afb0e0eb40cbaa37eb195cdfcfca3efc1e81f` generates the committed,
  unpublished `kai-core` + `kai-personal` slice at `0.64.0`. Root agents and
  skills are unchanged; marketplace topology remains N=1 at `source: "."`.
- Runtime assets close over local imports. Core alone carries hooks and observer
  scripts; personal carries demo scripts. Generated packs carry no npm
  manifests, and the emitted-tree gate rejects missing local modules, bare
  third-party imports, and premature package manifests.
- Verification: `npm test`; all four pack gates; 148 pack self-test checks;
  committed-tree check; 112-file full preview; generated core observer and
  workspace-doctor plus personal demo-zoom imported successfully.
- **R7 negative control:** the current tree exposed no `kai-core:` or
  `kai-personal:` providers and no duplicate contract skill. Its delegated child
  wrote four observer records. A clean worktree at parent `31d5d110...` with no
  `packs/` wrote the same four records under the same probe. The pack-attributable
  provider/skill/hook delta is zero; the duplicate is pre-existing root +
  installed-monolith behavior, not ambient pack discovery. The steward accepted
  this causal reading and amended R7 without weakening its stop condition.
- `git status --porcelain` was empty and `git diff --quiet HEAD` exited 0 after
  the implementation commit.

## REVIEW 2026-08-26-1412 — principal-swe-architect: APPROVED

- kind:      independent-architecture
- change_ref: `5a5afb0e0eb40cbaa37eb195cdfcfca3efc1e81f`
- verdict:   approved
- findings:  Initial review found an optional-semicolon hole in the module
             parser and stale pre-extraction comments. Both were corrected,
             mutation-tested, regenerated where needed, and re-reviewed.
- boundary:  Approval covers generated-tree architecture and validation. It
             does not publish packs or certify macOS/cloud host behavior.

## HANDOFF 2026-08-26-1420 — principal-swe-infra -> workflow-ship

- did:       Generated and committed core + personal, closed A1-A3 and R1-R11,
             recorded the steward-approved R7 differential, and obtained the
             required architecture approval at the implementation SHA.
- state:     in-review
- needs:     Definition-of-done / release-readiness gate, then PR merge and
             `v0.64.0` release. Publication remains forbidden.
- artifacts: implementation commit `5a5afb0e...`; item v6; this thread.
- evidence:  `npm test` green; full preview 112 files; marketplace N=1; R7
             pack-attributable delta zero.
- questions: none.
- next:      workflow-ship.

## HANDOFF 2026-08-26-1424 — workflow-ship -> @operator

- did:       Ran the **PREPARE** DoD gate. Verdict **RELEASE-READY** — six of six
             dimensions Clear, none Gap. Item **v6 -> v7, `in-review ->
             release-ready`**, lease `null`, `resume_state: null`, `next_role:
             "@operator"`. Wrote the ship record and stamped the initiative log.
             **It is NOT shipped.** kai merged, pushed, tagged, released and
             published **nothing**; the branch is still unpushed and no PR exists.
- state:     release-ready
- needs:     Operator deployment. Four read-only pre-merge gates first — branch
             shape; `git diff --name-only 5a5afb0e..HEAD` limited to
             `kai/coordination/**`, `kai/library/releases/**` and the initiative
             log (anything else voids the architecture approval); the
             `marketplace.json` diff being exactly the two `0.63.1 -> 0.64.0`
             version lines; and no third pack. Then move the ship record to its
             canonical directory in the records commit, push, open the PR, require
             `validate / contract` `conclusion: success` on the PR head, merge, and
             release `v0.64.0`. **No pack may be published.**
- artifacts: kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees/ship-record.md
             (canonical move is deploy step 5); item v7; kai/initiatives/pack-split/log.md
- evidence:  Re-derived from the working tree at `7102f94…` (this run had no shell):
             `packs/` = `kai-core` 44 files + `kai-personal` 22, no third pack;
             `COMMITTED_PACKS = ['core','personal']` (`scripts/lib/pack-plan.mjs:122`);
             one `hooks.json`, core-only, invoking a core-resident
             `observe-subagent.mjs`; guarantee blocks in 9 of 9 personal agents and
             0 of 7 core agents; no pack `package.json`; A1/A2 guards at
             `pack-preview.mjs:259,241`; `.gitattributes` pins `packs/** text eol=lf`;
             `0.64.0` coherent across all eight version locations; marketplace N=1 at
             `source: "."` with zero pack entries; six of six dependencies terminal;
             `main`/`origin/main`/`FETCH_HEAD` all `31d5d110…`, branch exactly two
             commits ahead. Suite results (`npm test`, four gates, 148 checks,
             112-file preview) remain infra-attested and are re-executed by CI.
- questions: **One non-blocking, for `principal-product-manager`, answerable after
             release.** `.github/plugin/marketplace.json` was edited — the two-field
             lockstep version bump. Acceptance **R8** explicitly permits it ("only its
             lockstep release version changes") and topology is verified unchanged at
             N=1 with zero pack entries, so the gate cleared on the item record. The
             dispatch HANDOFF and `ACTIVE.md` compress the stop gate to "any
             marketplace edit"; if that stricter literal reading was intended, reverting
             two version lines is the fix and the operator can call it before merge.
             Separately: please post a one-line NOTE confirming the baseline-comparison
             sentence in **R7** is steward-authored — the current attestation is
             `principal-swe-infra`'s. The verdict does not depend on it; R7 is satisfied
             under its original wording (4 observer records with `packs/`, the identical
             4 without, zero pack-attributable providers).
- next:      @operator — run the deploy handoff in the ship record, then return
             deployment evidence to `workflow-ship` for CONFIRM-START and
             CONFIRM-COMPLETE. Milestone `first-pack-extracted` does not advance on
             `release-ready`.

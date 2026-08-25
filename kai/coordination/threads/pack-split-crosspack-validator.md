# Thread — pack-split-crosspack-validator

Append-only communication log mirroring
`kai/coordination/items/pack-split-crosspack-validator.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Cross-pack reference validation across all three firing paths (inherited, user-invoked, orchestrated) + non-markdown assets + hooks-exactly-once, layered on the WS#1 multi-manifest validator. Size L. Owner `principal-swe-infra`; review `principal-swe-architect`/independent-architecture. Depends on `pack-split-generator-gates` (shipped); parallel with `pack-split-preflight-compat`.
- state:     proposed
- needs:     Steward grooming — confirm scope + promote when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-crosspack-validator.md; decomposition WS#3
- evidence:  scripts/validate-plugin.mjs (single-manifest ref checks today) — captured 2026-08-24 from C:\src\kai
- questions: orchestrated firing path has no static Inherits anchor — scoping the check may need an architect call (covered by the required review)
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
  `pack-split-preflight-compat` (also now dependency-satisfied).
- Foundation now available to build on: `scripts/lib/pack-plan.mjs` (`discoverManifests`,
  `manifestParityErrors`, `marketplaceConsistencyErrors`) and the multi-manifest
  `validate-plugin.mjs` are on `main` at `v0.58.0`. Note the open question above
  (orchestrated firing path) is unchanged and still routes to the required architect review.
- Also inherited from the generator-gates review: finding **A5** (`PACK_AGENTS` duplicate
  roster truth) is owned by `pack-split-ci-partition-checks`, which depends on *this* item.

## HANDOFF 2026-08-25-1139 — principal-product-manager -> principal-swe-infra

- did:       Steward grooming pass. **Promoted `proposed -> ready`** at **priority 20 — second in
             the queue, parallel-capable** (version 1 -> 2, `next_role: principal-swe-infra`,
             `owner` null until dispatch). Verified the sole dependency against the record:
             `pack-split-generator-gates` is `state: shipped` (v17, `change_ref 457254b97…`,
             PR #152 merged into `47aa0549f8…`, `v0.58.0`, production verification passed).
             Tightened acceptance on two points only — **split** the bundled "local + CI green"
             criterion (the bundling that bounced generator-gates at the 2026-08-24-2244 DoD gate)
             and corrected the preview command to its real invocable form (`--all --out <dir>`).
             Added `scripts/lib/pack-plan.mjs` to `touches` and `hooks.json` to `context_artifacts`.
             Confirmed — did not expand — this item's ownership of asset-reference validation and
             the `hooks.json` exactly-one-pack rule, per the steward's 2026-08-24-2240
             generator-gates correction. No architecture decision made.
- state:     ready
- needs:     Dispatch by `director-chief-of-staff`. Ranked behind `pack-split-preflight-compat`
             because that item additionally unblocks `pack-split-degraded-refusal` and both share
             one owner. If a second infra capacity exists the two may run **concurrently** — but
             their declared `touches` overlap in `scripts/lib/pack-plan.mjs`,
             `scripts/validate-plugin.mjs` and `.github/workflows/validate.yml`, so the director
             must run a touch-conflict check at dispatch. The steward added **no** dependency
             between them; sequencing is a capacity call, not a DAG change.
- artifacts: kai/coordination/items/pack-split-crosspack-validator.md (v2);
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md (WS#3);
             kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
- evidence:  `scripts/lib/pack-plan.mjs` on `main` provides the base this layers on —
             `discoverManifests`, `manifestParityErrors`, `marketplaceConsistencyErrors`, the
             machine-readable `PACKS` partition and `SKILL_OWNER_OVERRIDES` (which routes
             `demo-*`/`create-product-demo` to `personal` and `fleet-observation` to `core`, so the
             asset-ownership cases are reachable today); `scripts/validate-plugin.mjs` consumes
             them at line ~549. Read 2026-08-25 from C:\src\kai.
- questions: unchanged and non-blocking — the **orchestrated firing path** has no static
             `**Inherits:**` anchor; scoping how it is checked routes to the required
             `independent-architecture` review, not to the steward, and does not hold up the start.
             Coordination note, **not** a dependency: `pack-split-host-semantics-spike` answers
             whether `hooks.json` hooks fire once or per-plugin. The exactly-one-pack rule holds
             either way; if the spike returns per-plugin firing while this is in flight, raise it
             to the steward as a scope question rather than re-scoping the check in place.
- next:      principal-swe-infra — build after dispatch; `independent-architecture` review must
             ratify the exact `change_ref` before the ship gate.

## NOTE 2026-08-25-1410 — principal-swe-infra: claim discipline for this build

Recorded plainly rather than implied. This run executed with **no director in the loop** and the
item **unleased**, so the `kai-core-work-coordination` *single grantor* path applies: verified
`.kai/manifest.json` `schema_version: 2`, verified **no unexpired lease** anywhere in
`kai/coordination/items/`, and verified **no touch conflict** — `pack-split-degraded-refusal` became
dispatchable at 2026-08-25-1328 and overlaps this item on `scripts/lib/pack-plan.mjs` and
`scripts/validate-plugin.mjs`, but holds **no lease**, so nothing was contended. The item write
below is a single `ready -> in-review` transition (v2 -> v3) with the lease left `null`, matching the
`pack-split-preflight-compat` build handback of 2026-08-25-1157 rather than inventing a second
version bump for a lease that was granted and released inside one uninterruptible pass. Anyone
picking up `degraded-refusal` now should read this item's diff first: it moves surfaces they touch.

## HANDOFF 2026-08-25-1410 — principal-swe-infra -> principal-swe-architect

- did:       Implemented the item in the working tree (v2 -> v3, `ready -> in-review`).
             (1) **One collector, one resolver, no second parser.** `scripts/lib/pack-plan.mjs`
             gained `declaredInherits`, `dispatchedRefs`, `assetRefs`, `collectReferences`,
             `referenceErrors`, `planAssets`, `assetOwnershipErrors`, `hooksAssignmentErrors`,
             `packProviders`, `skillOwners`, `agentOwners`. `inheritedSkills` is now
             `declaredInherits` filtered by existence, and the validator's "Skill firing paths"
             block was refactored onto the shared parsers — its inline regexes are **deleted**, so
             generator, preview and validator cannot disagree about what a reference is.
             (2) **Resolution against emitted files, not a plan.**
             `packProviders(materializePacks(...))` indexes `skill:<id>` / `agent:<id>` -> packs from
             the generator's own output; `materializePacks` is now hoisted to a single
             `generatedPacks` in `scripts/validate-plugin.mjs` and shared with the preflight pin.
             (3) **Assets.** Top-level `scripts/*.{mjs,js,cjs,ps1,sh,py}` invoked by a shipped body
             are planned to a pack — sole invoker keeps it, two or more promote to `kai-core`;
             missing file, shared-asset-assigned-to-a-department, and cross-boundary consumption each
             fail by name. (4) **hooks-once.** `HOOKS_FILE` / `HOOKS_OWNER = 'core'` plus
             `hooksAssignmentErrors`, checked inside the validator's existing hooks block over the
             commands that file actually runs. (5) **Self-test.** ~25 new arms in
             `scripts/pack-preview.mjs --self-test`: pure mutation arms proving each failure by name,
             plus live anti-fail-open arms. (6) `.github/workflows/validate.yml` header comment only.
             (7) `0.59.0 -> 0.60.0` across all eight release locations with the dated CHANGELOG
             section, compare link, and README `## Status` stamp (inventory unchanged at 56/51 — no
             catalog or fixture regeneration, because nothing about the roster moved).
- state:     in-review — **and NOT complete, NOT release-ready, NOT shipped. Nothing was run.**
- needs:     **A shell.** This environment provides file tools only. Consequences, stated plainly:
             1. **No command was executed.** `npm test`, `node scripts/validate-plugin.mjs`,
                `node scripts/pack-preview.mjs --self-test`, `--check`, and `--all --out <dir>` are
                **all owed**. Every "resolves clean today" statement below is from **reading** the
                corpus with grep, never from running the checks.
             2. **No branch, no commit.** `kai/feat/29-crosspack-validator` was not created; the
                changes sit **uncommitted on `main`** (`git checkout -b kai/feat/29-crosspack-validator`
                carries them over cleanly). `change_ref` is `null`, so the required
                `independent-architecture` review **cannot bind yet**.
             What to run first, in order: `--self-test` (it fails loudest and most specifically),
             then `validate-plugin`, then `npm test`. If an arm fails, the live anti-fail-open
             assertions at the top of the cross-pack section name which firing path went missing.
- artifacts: scripts/lib/pack-plan.mjs; scripts/validate-plugin.mjs; scripts/pack-preview.mjs;
             .github/workflows/validate.yml; README.md; CHANGELOG.md; plugin.json; package.json;
             package-lock.json; .github/plugin/marketplace.json;
             kai/coordination/items/pack-split-crosspack-validator.md
- evidence:  See the item's Evidence section for the changed-file list and per-criterion status.
             Read/edited 2026-08-25 in C:\src\kai. Corpus facts checked by reading, offered as
             inputs a reviewer should re-derive: 56 agents / 51 skills; 33 agent-shaped dispatch
             entries across 10 agent files, every target present on disk; the only skill-valued
             dispatch entries are `workflow-doc-review`'s nine `review-*` lenses (all engineering,
             same pack), `generate-html-lesson` (personal, from a personal agent) and
             `kai-core-generate-audio` (core); ten invoked scripts, all present, with
             `scripts/generate-audio.ps1` invoked from both core skills and personal agents, so it
             plans to `kai-core` — the shared-asset rule has a live subject, not a synthetic one.
- questions: Four calls a reviewer should rule on rather than inherit.
             1. **The orchestrated syntax is the item's named ambiguity, and I chose the smallest
                shape already in the roster:** a dispatch entry is a bolded, backticked id at the
                head of a list item (`DISPATCH_ENTRY`), the exact shape `validate-plugin`'s existing
                firing-path check already treated as dispatch for the `workflow-doc-review` lenses.
                **Rejected: "any backticked mention."** ~20 live editorial cross-references
                (`build-diagrams` ↔ `ui-mockup`, `kai-core-issue-analysis` → `pr-sizing`, and the
                rest) would become cross-pack dependencies they are not — a prose link is not a
                firing path. No new syntax was invented and no agent file was edited to fit the
                parser.
             2. **Dispatch entries are read from agents only.** Skills use the same list shape for
                field and term definitions — `kai-core-work-coordination` defines 19 record fields
                that way, `product-marketing-intelligence` its claim schema — and
                `kai-core-design-grounding` even lists four *agent* ids in it as a stakeholder map.
                A collector that read skills would call those dispatch. Skills therefore contribute their own user-invoked entry
                point and their assets, not dispatch targets.
             3. **Cross-department *agent* referrals are deliberately permitted; cross-department
                *skill* references fail.** An agent is a routing target — naming a role in another
                pack degrades to "that pack is not installed" — while a skill is loaded, so a missing
                one breaks the body that named it. 12+ live referrals exist today
                (`principal-swe-manager` → `principal-product-manager`, `creative-video-director` →
                `principal-product-marketing`), and the partition lock's §7 dependency-direction
                claim is about **providers**, not referrals. Agent refs are still required to resolve
                to exactly one pack, and an agent-shaped token that resolves to nothing still fails.
                **If architecture reads §7 as binding on referrals too, say so and I will make agent
                refs fail — it is a one-line change (`if (ref.kind === 'agent') continue;`), but it
                would then require an accepted plan for those 12+ live referrals, which is scope this
                item does not own.**
             4. **`hooks.json` is assigned by a constant, not by emission — deliberately.**
                `HOOKS_OWNER = 'core'` encodes the decomposition's WS#7 disposition; no generated tree
                emits `hooks.json` yet, because routing assets into trees belongs to
                `pack-split-generated-pack-trees`. So the tree rule is **at most one** claimant, and
                the declared owner is unioned with any emitter — the duplicate arm fires the day that
                item lands rather than silently doubling the observer. The non-tautological half is
                the cross-check that the hook's script (`scripts/observe-subagent.mjs`) is owned by
                the same pack, which fails by name if `fleet-observation` ever leaves core —
                relevant, because `pack-split-ci-partition-checks` carries a forced-rename arm.
             Also flagged, not hidden: **`touches` was extended** with `scripts/pack-preview.mjs`
             (it owns the self-test this item's acceptance demands) and the six release files
             (mandatory under the AGENTS.md release rules). **`.github/workflows/validate.yml` got a
             comment change only** — both new gates run inside `validate-plugin.mjs` and
             `pack-preview --self-test`, which CI already executes on every PR and push; a duplicate
             step would be a second place to keep in sync for no coverage. Same reasoning the
             architect accepted on `preflight-compat`. **No `design.md` was written**: the initiative
             files its decisions under `kai/initiatives/pack-split/artifacts/`, and inventing a new
             artifact lane for a rationale that fits here would be its own scope expansion — if
             architecture wants it as a durable artifact, say where and I will file it.
- next:      principal-swe-architect — `independent-architecture` review of the reference model
             (the three firing paths, the agent-vs-skill asymmetry, asset ownership, hooks-once).
             **It cannot bind yet: `change_ref` is `null` because nothing is committed.** The
             operator creates the branch, runs the suite, and commits or mints a ref; the review
             then ratifies that exact ref.

## HANDOFF 2026-08-25-1420 — @operator -> principal-swe-architect

- did:       Created `kai/feat/29-crosspack-validator`; ran the 70-check pack-preview self-test,
             plugin validation (56 agents / 51 skills), all-five-pack preview generation, and full
             `npm test` (exit 0). Removed the temporary preview output. Minted exact review binding
             `cb5fd0290f1a8b7478b54e98bf24f1968aa58f09`.
- state:     in-review
- change_ref: `cb5fd0290f1a8b7478b54e98bf24f1968aa58f09`
- needs:     Independent architecture review of the accepted reference model, especially the
             orchestrated-entry syntax, agent-referral asymmetry, asset planning, and declared
             core-only hooks ownership. CI-on-pushed-PR remains for the ship gate.
- next:      principal-swe-architect — ratify or return precise material findings.

## HANDOFF 2026-08-25-1428 — principal-swe-architect -> workflow-ship

- did:       **Independent architecture review: RATIFIED** at `change_ref
             cb5fd0290f1a8b7478b54e98bf24f1968aa58f09`. Item v4 -> v5, **still `in-review`**, lease
             cleared, `next_role -> workflow-ship`, `completed_reviews` now carries
             `principal-swe-architect` / `independent-architecture` / `ratified` at this exact ref
             (good for **this ref only** — if it moves, the entry stops counting). Read through the
             worktree on the operator's attested empty diff for implementation/release files; **no
             shell**, nothing re-executed, so the 70-check self-test, 56/51 validation, five-pack
             preview and `npm test` exit 0 were treated as **input, not verdict**. No implementation
             or release file was edited; nothing committed, pushed, merged, tagged or released.
- state:     in-review — **NOT complete, NOT release-ready, NOT shipped.**
- change_ref: `cb5fd0290f1a8b7478b54e98bf24f1968aa58f09`
- needs:     The ship gate. The **pushed-PR CI criterion is still unticked** and only CI can supply
             it — this review neither ticks nor waives it.
- artifacts: kai/coordination/items/pack-split-crosspack-validator.md
             (`## Review — independent architecture (ratification), 2026-08-25-1428` — the durable
             record; no separate artifact lane was opened, matching `preflight-compat`'s convention,
             which answers infra's question 5)
- evidence:  All six design calls **endorsed**, each on evidence re-derived here rather than
             inherited. (1) `DISPATCH_ENTRY` is the shape the pre-existing firing-path check already
             used — no syntax invented. (2) Agents-only collection verified by enumerating **every**
             dispatch-shaped list head in all 51 skills: 59 matches across 13 skills, **zero** naming
             a skill (record-field schemas, lifecycle states, error strings, path templates, family
             globs, and four *agent* ids in `kai-core-design-grounding`) — collecting skills would add
             ~55 false tokens and zero coverage. (3) Partition-lock **§7.2 is stated in terms of
             *inherit*** — it binds providers, not referrals — so the agent/skill asymmetry stands and
             the offered `if (ref.kind === 'agent') continue;` must **not** be made. (4) Asset planning
             in the shared lib matches the decomposition, which gives WS#7 the routing and names this
             validator as its containment. (5) All four future hooks states traced; every one fails
             closed. (6) Resolution against `packProviders(materializePacks(...))` — emitted files, not
             a plan — is the load-bearing choice and is correct. Fail-open scan: live anti-fail-open
             arms assert **thresholds** (>100 / >5 / >5 / >=1) plus four named carries;
             `declaredInherits`' single-line read is safe because `validate-plugin.mjs:276–303`
             independently enforces exactly one first-line `**Inherits:**` across all 56 agents;
             unplaced skills fail closed via `fromPack: null`; `packProviders`' `kai-` strip is the
             exact inverse of `packPluginName`, so no provider-identity or future-pack-name bug; no
             new CI step (workflow already runs all three commands); `COMMITTED_PACKS` `[]`, no
             `packs/` tree, marketplace still N=1 at `0.60.0`.
- questions: **Escalated, not decided:** cross-department **agent referral degradation is
             unspecified**. Ratifying call 3 lets 12+ live referrals survive the split with no defined
             behaviour when the sibling pack is absent (WS#5 covers a missing **core**, not a missing
             **department**). Silent / named / install-suggesting is a **product** call about operator
             experience and would add a surface no committed item owns — routed to
             `principal-product-manager` as a **PROPOSAL for triage**, deliberately not a dependency,
             item, or acceptance criterion.
             **Non-blocking, routed rather than absorbed:** **N1** a dispatch entry naming a *deleted
             skill* is silently dropped (skills classify by resolution, agents by shape) — not a
             cross-pack defect, identical in the monolith, unfixable by shape because skills have no
             family prefix; cheap mitigation is widening the live lens arm to all nine
             `workflow-doc-review` lenses -> **`ci-partition-checks`**. **N2** two "agent-shaped"
             definitions now exist (`AGENT_REF` omits `creative`; `AGENT_SHAPED` is complete) -> with
             **A5 in `ci-partition-checks`**. **N3** `endsWith('/hooks.json')` counts any depth;
             `^[^/]+/hooks\.json$` is the intent — unreachable today, fail-closed -> **WS#7**. **N4**
             hook-asset key-spaces differ and only the first `${PLUGIN_ROOT}` path per command is
             read — fail-closed, one line, whenever hooks change.
             **Binding on `pack-split-generated-pack-trees` (WS#7):** consume `planAssets` /
             `HOOKS_OWNER` rather than re-deriving ownership (a second truth is the A5 defect class and
             would be invisible); route hook scripts **by declaration**, not by prose mention; emit
             `hooks.json` into **core only**. Also recorded so it is not over-read: given `planAssets`
             output, two of `assetOwnershipErrors`' four arms are **structurally unreachable today** —
             they become load-bearing exactly when WS#7 supplies an independent owner source.
- next:      workflow-ship — DoD gate. `pack-split-ci-partition-checks` stays blocked (needs this at
             `shipped`), and `pack-split-degraded-refusal` still overlaps this item on
             `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs` — now **live surface
             movement**, so that overlap must be read, not assumed.

## HANDOFF 2026-08-25-1435 — workflow-ship -> @operator

- did:       **DoD gate: RELEASE-READY.** All six dimensions **Clear**, none waived. Item **v5 -> v6,
             `in-review -> release-ready`**, lease `null`, `resume_state: null`,
             `next_role -> "@operator"`. Acceptance criterion 5 (CI green on the pushed PR) ticked
             **with the run URL**, closing the last open criterion. Wrote the ship record, indexed
             it in `deliverables.md`, stamped `log.md` with the release-ready entry, refreshed
             `BOARD.md` + `ACTIVE.md`, and **parked the architect's escalation as a PROPOSAL** in
             `kai/initiatives/pack-split/backlog.md` so a finding that ships is a finding that is
             owned. **kai merged nothing, tagged nothing, released nothing, published nothing** —
             and will not. *(Stamped `1435` to keep append-only ordering behind the `1428`
             ratification; session clock read 14:23.)*
- state:     release-ready — **NOT shipped.** Production deployment and verification are separate,
             evidenced states, and both need the operator first.
- change_ref: `cb5fd0290f1a8b7478b54e98bf24f1968aa58f09` (unchanged — no implementation moved)
- needs:     **The operator to run the deploy steps in the ship record**, in order: (1) re-check
             implementation/release byte-identity against `cb5fd029…` **and** that
             `git diff --name-only 630089bc… origin/kai/feat/29-crosspack-validator` lists exactly
             the 15 expected paths with nothing under `agents/`, `skills/`, `packs/`, `docs/` or
             `test/`; (2) `mkdir` + `git mv` this record into
             `kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md`
             (owed only because this run had no shell and the file tool cannot create a directory —
             doing it here keeps it in the same records commit, so no post-ship reconciliation);
             (3) commit + push the records and confirm `contract` green on the **final** head;
             (4) **Squash and merge PR #156**; (5) watch `validate` on `main`; (6) tag `v0.60.0`
             and cut the release from the `[0.60.0]` CHANGELOG section, claiming **CI validation
             only** — no pack is generated, committed or published; (7) return the deployment
             evidence for CONFIRM-START / CONFIRM-COMPLETE. Abort criteria and the rollback path
             are in the record; **do not** hand-edit around a red gate and **do not** loosen a new
             check to get a merge through.
- artifacts: kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator.md (the ship
             record — DoD table, rollout, rollback, deploy handoff, production-verification plan);
             kai/coordination/items/pack-split-crosspack-validator.md (v6);
             kai/initiatives/pack-split/backlog.md (PROPOSAL parked);
             kai/initiatives/pack-split/deliverables.md; kai/initiatives/pack-split/log.md
- evidence:  **Verified read-only by this gate, not accepted on report:** PR **#156** — open,
             draft false, **`mergeable: true` / `mergeable_state: clean`**, **1 commit**,
             **+1314 / −55 across 15 files**, head **`0f3705e0b714f7d23a900296fb7c6f59d12148be`**,
             base **`630089bc3609e4b5793f3e755fadc7bb51d43bf4`** (identical to local `main` and
             `FETCH_HEAD`, so one commit ahead, no divergence — reflog-confirmed). Workflow
             `validate` run **`32900688907`**, event `pull_request`, `run_attempt: 1`,
             **`conclusion: success`** at that exact head; job **`contract`** `97973596644`,
             `ubuntu-latest` / Node 20, **11/11 substantive steps `success`**, 21:22:54Z ->
             21:23:10Z (**16s**) — the **same 11 steps** as the `0.59.0` run, which independently
             confirms "no new CI step". Release coherence at the **head commit**: `plugin.json`,
             `package.json`, `package-lock.json` ×2 read via `raw.githubusercontent.com` at
             `0f3705e…`; `marketplace.json` (both fields), `CHANGELOG.md` `[0.60.0]` + compare
             link, and `README.md` `## Status` read from the PR patches — eight of eight at
             `0.60.0`, and the `v0.59.0` tag exists so the compare link is not dangling.
             Non-negotiables at the head: `COMMITTED_PACKS = []`, `HOOKS_OWNER = 'core'`,
             marketplace **N=1** at `source: "."`, **no `packs/` tree**, root `agents/` and
             `skills/` untouched. **Operator-attested, not re-derived (no shell here):** byte
             identity between `cb5fd029…` and the PR head, and the local suite (70-check self-test,
             56/51, five-pack preview, `npm test` exit 0) — both re-checked at deploy steps 1 and 3,
             which fail closed. **`api.github.com` returned 403 partway through paging the PR file
             list**, so 6 of 15 filenames were re-derived directly and 9 rest on the declared
             `touches` plus count agreement; deploy step 1 converts that into a mechanical check.
- questions: None blocking. Routed rather than dropped: the cross-department **agent-referral
             degradation** escalation is now a parked **PROPOSAL** for `principal-product-manager`
             (not a dependency, not an item, not an acceptance criterion); **N1/N2** ride with
             **A5** into `pack-split-ci-partition-checks`; **N3/N4** and the three binding
             constraints (consume `planAssets` / `HOOKS_OWNER`, route hook scripts by declaration,
             emit `hooks.json` into core only) ride into `pack-split-generated-pack-trees`;
             **P2-S1** stays parked and was not widened. Also recorded so today's green is not
             over-read: two of `assetOwnershipErrors`' four arms are **structurally unreachable
             today** and become load-bearing only when WS#7 supplies an independent owner source.
- next:      **@operator** — run the deploy steps and return the evidence. Then `workflow-ship`
             CONFIRM-START (`release-ready -> deploying`) and CONFIRM-COMPLETE (`-> production-
             verification -> shipped`). **Nothing downstream is cleared yet:**
             `pack-split-ci-partition-checks` needs this item at `shipped`; milestone
             `dependency-guarantees` stays at **2 of 5**.

## NOTE 2026-08-25-1440 — workflow-ship claimed (self-grant)

Self-granted the workflow lease to run CONFIRM-START / CONFIRM-COMPLETE: holder `workflow-ship`,
token `wsh-2026-08-25-1440-cpv-confirm`, `version_at_grant: 6`; re-read after the grant confirmed
holder, token and version. Both phases ran in one pass because the operator supplied *both*
deployment-start and successful-completion evidence; the intermediate states were still walked and
recorded, not collapsed. Lease **cleared** in the same run. Item version **6 -> 7 -> 8 -> 9**.
No other role held or was waiting on this item. *(Stamped `1440` to preserve append-only ordering
behind the `1435` deploy handoff; this session's clock read 14:39 local.)*

## HANDOFF 2026-08-25-1440 — workflow-ship -> (none: item closed)

- did:       **CONFIRM-START + CONFIRM-COMPLETE. Verdict: `SHIPPED`.** State
             **`release-ready` -> `deploying` (v7) -> `production-verification` (v8) ->
             `shipped` (v9)** — no state skipped, `shipped` **not** reached directly from
             `release-ready`. `resume_state` stays `null`, `next_role: "@operator" -> null`,
             lease self-granted and cleared, `change_ref` **unchanged** at `cb5fd029…` (deployment
             moves an item's state, not its reviewed implementation ref).

             **kai merged, tagged, released and published nothing — at any phase.** The operator
             executed every one of those actions; this run recorded them and re-derived the
             production facts read-only. **No rollback was invoked.**

             **Deployment start:** PR #156 squash-merged 2026-08-25T21:38:09Z into
             `32a07a9a56a6b244586f9048b6bb395e86e43020` (single parent `630089bc…`, signature
             `verified: true`); environment `main` + GitHub Releases; version `0.59.0 -> 0.60.0`;
             `main` run started 21:38:12Z.

             **Deployment completion:** run **32902043562**, `event: push`, `run_attempt: 1`,
             `status: completed`, **`conclusion: success`**, `head_sha` exactly the merge commit,
             `21:38:12Z -> 21:38:27Z`, `display_title: "feat: validate cross-pack references
             (#156)"`. Annotated tag `v0.60.0` + release `376735380` published 21:38:41Z.
             <https://github.com/RubenSaucedo/kai/actions/runs/32902043562>

             **Production verification — all seven checks PASS, every one re-derived here against
             the merge commit itself** (workflow/git-object APIs and `raw.githubusercontent.com` at
             `32a07a9a…`, deliberately **not** the local worktree, so a dirty checkout could not
             fake a pass):

             | # | Check | Result |
             |---|-------|--------|
             | 1 | `main` CI green at the merge SHA | **PASS** — run 32902043562, `event: push`, `conclusion: success` at `32a07a9a…`; local `main` reads the same SHA. |
             | 2 | The new gates ran in production | **PASS** — job `contract` `97977862619`, `ubuntu-latest`: step 4 **`Validate plugin contract`** and step 8 **`Pack generator self-test`** both `success` (that is where the cross-pack, asset and hooks checks live), plus step 9 `Committed pack trees match the generator`. Step 11 `Release-guard --base --head` is `skipped` — **correct on a `push`**, it is the `pull_request`-only gate and it ran green on #156. |
             | 3 | Version coherence `0.60.0` | **PASS** — eight of eight at the merge commit: `plugin.json`, `package.json`, `package-lock.json` ×2, marketplace ×2, README `## Status` (56 agents / 51 skills), `CHANGELOG [0.60.0] - 2026-08-25` **and** its compare link read at the merge commit. Non-dangling: tag ref `v0.59.0` (`338cfb04…`) exists. |
             | 4 | Marketplace exactly one entry | **PASS** — `plugins[]` length **1**, `kai` at `source: "."`. No pack entries. |
             | 5 | `COMMITTED_PACKS = []`, no `packs/` tree | **PASS — proven positively.** `pack-plan.mjs` at the merge commit still reads `COMMITTED_PACKS = []`; the merge root tree `7b17dd14…` (`"truncated": false`) lists `package-lock.json`, `package.json`, `plugin.json`, `scripts`, `skills`, `test` — `packs` sorts between the middle two in git byte order and **is absent**. |
             | 6 | Validator symbols present; roster unmoved | **PASS** — `validate-plugin.mjs` at the merge commit imports `collectReferences / referenceErrors / planAssets / assetOwnershipErrors / hooksAssignmentErrors / packProviders / declaredInherits / dispatchedRefs / HOOKS_FILE / HOOKS_OWNER`. The `agents` (`c0284f31…`) and `skills` (`2a4a7abc…`) trees, `docs`, `examples`, `test` and the `hooks.json` blob are **byte-identical to base `630089bc…`** — the validator landed without editing a single shipped body. |
             | 7 | Tag/release point at the merge | **PASS** — annotated tag object `d5cd9590…` peeled via the git-tags API to commit `32a07a9a…`; release `376735380`, not draft, not prerelease. |

             **Release notes obey the constraint deploy step 6 placed on them, checked by reading
             the published body.** They claim CI validation only (three `Added` items about
             validation, not generation) and state outright that "no `packs/` tree is committed and
             the marketplace still exposes only the monolithic `kai` plugin" — no published pack,
             no completed split.

- state:     shipped
- change_ref: `cb5fd0290f1a8b7478b54e98bf24f1968aa58f09` — unchanged, deliberately.
- artifacts: `kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md`
             — updated with the deployment record and the executed production verification; it was
             already at its canonical library path (deploy step 2 ran in the same records commit),
             so **no post-ship reconciliation is owed**.
- evidence:  Item `## Ship confirm — CONFIRM-START + CONFIRM-COMPLETE, 2026-08-25-1440`; the ship
             record above; run <https://github.com/RubenSaucedo/kai/actions/runs/32902043562>;
             release <https://github.com/RubenSaucedo/kai/releases/tag/v0.60.0>.
             **Environment limits stated, not absorbed:** no shell, so nothing was executed —
             every fact is a read of the merge commit, the workflow API, the git object APIs or
             the published release. `api.github.com` did **not** rate-limit this run, so the
             job-step list and the annotated-tag peel were genuinely re-derived, unlike at
             PREPARE.
- needs:     nothing. The item is closed.
- questions: none blocking.
- next:      **none — `next_role: null`.** Dependents cleared strictly by the DAG:
             **`pack-split-ci-partition-checks` now has both dependencies satisfied**
             (`preflight-compat` + this item, both `shipped`) and is **dispatchable** — still
             `ready` with `owner: null`, so dispatch is the **director's** call, and its
             touch-conflict check on `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs`,
             `scripts/pack-preview.mjs` and `.github/workflows/validate.yml` is **not** waived by
             this item shipping. `pack-split-degraded-refusal` was already dispatchable and now
             rebases onto surface that has landed on `main`. `pack-split-generated-pack-trees`
             moves from two to **three of six** met and stays `proposed`, outside `scope.current`.
             Milestone `dependency-guarantees`: **3 of 5 — still OPEN.**

## NOTE 2026-08-25-1440 — workflow-ship: what SHIPPED does and does not mean

- **It means production was verified, not that the diff was green.** All seven checks were
  re-derived against the merge commit — including the two that matter most for this item's own
  claim: the cross-pack gates **ran** in production (steps 4 and 8 `success`, not skipped), and
  the committed-unpublished non-negotiable still holds on `main`.
- **It does not mean any pack exists.** `COMMITTED_PACKS = []`, no `packs/` tree, marketplace
  still N=1 at `source: "."`. What shipped is a **validator**: `0.60.0` changed no agent or skill
  body, so a consumer running `/plugin update kai` receives version metadata and docs only.
- **It does not make today's green a guarantee it is not yet.** Two of `assetOwnershipErrors`'
  four arms remain **structurally unreachable** until WS#7 supplies an independent owner source,
  and `scripts/observe-subagent.mjs` is owned by core only because a core skill's prose invokes
  it — fail-closed, but fragile as a routing input. Both travel to
  `pack-split-generated-pack-trees` with the three binding constraints.
- **It clears exactly one dependency edge.** `ci-partition-checks` becomes dispatchable; nothing
  else changes state. N1/N2 ride with A5 into that item; the cross-department agent-referral
  **PROPOSAL** stays parked in `kai/initiatives/pack-split/backlog.md` for the steward, and
  **P2-S1** is untouched. **This run created no item and accepted no residual risk.**

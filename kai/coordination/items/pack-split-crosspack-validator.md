---
type: work-item
id: pack-split-crosspack-validator
title: Cross-pack reference validator across all three firing paths + assets + hooks-once
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: release-ready
resume_state: null
priority: 20
owner: principal-swe-infra
next_role: "@operator"
target: pack-split cross-pack reference validation
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - scripts/validate-plugin.mjs
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - hooks.json
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
touches:
  - scripts/validate-plugin.mjs
  - scripts/lib/pack-plan.mjs
  - .github/workflows/validate.yml
  # Declared at handback 2026-08-25-1410. `scripts/pack-preview.mjs` carries the
  # deterministic self-test this item's acceptance demands (it is already a
  # context_artifact); the release files are mandatory under the AGENTS.md release
  # rules for any behaviour-sensitive change. Recorded rather than left as a
  # silent expansion — no new capability rode along.
  - scripts/pack-preview.mjs
  - README.md
  - CHANGELOG.md
  - plugin.json
  - package.json
  - package-lock.json
  - .github/plugin/marketplace.json
depends_on:
  - item: pack-split-generator-gates
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews:
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: cb5fd0290f1a8b7478b54e98bf24f1968aa58f09
    verdict: ratified
    evidence: "## Review — independent architecture (ratification), 2026-08-25-1428"
    timestamp: 2026-08-25-1428
change_ref: cb5fd0290f1a8b7478b54e98bf24f1968aa58f09
version: 6
lease: null
updated: 2026-08-25-1435
---

## Outcome

Every cross-pack reference validates across all three firing paths — inherited
(`**Inherits:**`), user-invoked (`/skills run`), and orchestrated (agent-to-agent dispatch) —
plus non-markdown asset references (e.g. `scripts/demo-*.mjs`) and the rule that `hooks.json`
is assigned to exactly one pack. Layered onto the multi-manifest validator, wired as a CI gate.

## Acceptance

*Tightened by the steward at promotion 2026-08-25-1139 against the shipped foundation
(`v0.58.0`). One finding-driven change and one command correction, nothing added:
the bundled "local + CI green" criterion is **split** (the 2026-08-24-2244 DoD gate bounced
`generator-gates` for exactly that bundling), and the preview command is written in its real
invocable form — `pack-preview.mjs` usage on `main` is `--all --out <dir>`.*

- [x] A pack agent's inherited, user-invoked, and orchestrated references all resolve to a
      real provider (core or its own pack) across the plugin boundary, or CI fails with the exact miss.
      — **DONE 2026-08-25-1420.** `collectReferences` / `referenceErrors` in `scripts/lib/pack-plan.mjs`
      resolve every reference against `materializePacks()` output (what a user installs), not against
      a plan; wired into `scripts/validate-plugin.mjs` ("Cross-pack references"). The 70-check
      self-test proves inherited, user-invoked, orchestrated, dangling, duplicate, and cross-pack
      failure arms by name; the live corpus resolves cleanly.
- [x] Non-markdown assets referenced by a skill are present in that skill's owning pack; an
      asset referenced across >1 pack is flagged for core.
      — **DONE 2026-08-25-1420.** `assetRefs` / `planAssets` / `assetOwnershipErrors`; missing,
      shared, and wrong-pack asset mutations fail by name. The live plan assigns
      `scripts/demo-zoom.mjs` to personal and shared `scripts/generate-audio.ps1` to core.
- [x] `hooks.json` assigned to exactly one pack (no pack duplicates a hook).
      — **DONE 2026-08-25-1420.** `HOOKS_OWNER = 'core'` plus `hooksAssignmentErrors`; zero,
      duplicate, unknown-owner, missing-script, and foreign-script arms fail by name, while the live
      root hooks file and observer script resolve to core.
- [x] Passes on `node scripts/pack-preview.mjs --all --out <dir>`; `npm test` passes **locally**.
      — **DONE 2026-08-25-1420.** `pack-preview --self-test`: 70 checks; `validate-plugin`:
      56 agents / 51 skills; `--all --out <session temp>`: all five preview trees generated;
      `npm test`: exit 0. The temporary output was removed.
- [x] The new CI step runs **green on the pushed PR** (its own claim, its own evidence — a
      workflow run, not an assertion).
      — **DONE 2026-08-25-1435**, and no new step was added: the checks ride the
      `Validate plugin contract` and `Pack generator self-test` steps CI already runs.
      **GitHub Actions run `32900688907`** — workflow `validate`, event `pull_request`,
      `head_sha 0f3705e0b714f7d23a900296fb7c6f59d12148be`, base `630089bc…`, `run_attempt: 1`,
      **`conclusion: success`**; job **`contract`** (`97973596644`), `ubuntu-latest` / Node 20,
      21:22:54Z -> 21:23:10Z (**16s**), **all 11 substantive steps `success`**. Read from
      `api.github.com` at the ship gate, not accepted on report:
      <https://github.com/RubenSaucedo/kai/actions/runs/32900688907/job/97973596644>.
      That the job ran the **same 11 steps** as the `0.59.0` release job independently
      confirms the "no new CI step" claim.
- [x] Version bumped on `0.x` with CHANGELOG + README stamp.
      — `0.59.0 -> 0.60.0` across all eight locations, verified **by reading each one**: `plugin.json`,
      `package.json`, `package-lock.json` (top-level and `packages[""]`), `.github/plugin/marketplace.json`
      (`metadata.version` and `plugins[0].version`), the dated `## [0.60.0] - 2026-08-25` CHANGELOG
      section, its `[0.60.0]: …/compare/v0.59.0...v0.60.0` link, and the README `## Status` stamp.
      Marketplace is still N=1 (`kai` at `source: "."`), `COMMITTED_PACKS = []`, no `packs/` tree.

## Evidence

**Build 2026-08-25-1410 (`principal-swe-infra`) — implemented in the working tree, `ready -> in-review`
(v2 -> v3). NOT complete, NOT release-ready, NOT shipped.**

*Changed files (14).* Implementation: `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs`,
`scripts/pack-preview.mjs`, `.github/workflows/validate.yml` (header comment only — no new step).
Release: `README.md`, `CHANGELOG.md`, `plugin.json`, `package.json`, `package-lock.json`,
`.github/plugin/marketplace.json`. Coordination: this record, the item thread, `ACTIVE.md`, `BOARD.md`.

*What was built.*

1. **One collector, one resolver, no second parser.** `scripts/lib/pack-plan.mjs` gained
   `declaredInherits` (the raw `**Inherits:**` tokens), `dispatchedRefs` (dispatch entries),
   `assetRefs`, `collectReferences`, `referenceErrors`, `planAssets`, `assetOwnershipErrors`,
   `hooksAssignmentErrors`, `packProviders`, `skillOwners`, `agentOwners`. `inheritedSkills` is now
   `declaredInherits` filtered by existence, and `validate-plugin.mjs`'s firing-path block was
   refactored onto the shared parsers — its inline regexes are gone, so the generator, the preview
   and the validator cannot disagree about what a reference is.
2. **References resolve against emitted files.** `packProviders(materializePacks(...))` indexes
   `skill:<id>` / `agent:<id>` -> packs from the generator's own output. A provider the generator
   would not copy is a miss now, not a support ticket after the split. The generated tree is
   materialised once (`generatedPacks`) and shared with the preflight pin.
3. **Assets.** Top-level `scripts/*.{mjs,js,cjs,ps1,sh,py}` invoked by a shipped body are planned to
   a pack: sole invoker keeps it, two or more promote it to `kai-core`. Missing file, shared asset
   assigned to a department, and cross-boundary consumption each fail by name. `scripts/lib/` is
   excluded deliberately — it is build-internal and no shipped body tells anyone to run it.
4. **hooks-once.** `HOOKS_FILE` / `HOOKS_OWNER = 'core'` (the decomposition's WS#7 disposition) plus
   `hooksAssignmentErrors`. Zero owners, duplicate owners, an owner that is not a pack, a hook script
   no pack owns, and a hook script owned by another pack all fail. The duplicate arm is live: the
   validator unions the declared owner with any generated tree that emits `hooks.json`, so the day
   asset routing lands in `pack-split-generated-pack-trees`, a second emitter fails rather than
   doubling the observer on every subagent.
5. **Self-test.** `scripts/pack-preview.mjs --self-test` gained ~25 arms: pure mutation arms proving
   each failure by name, and **live anti-fail-open arms** asserting the real corpus actually populates
   all three firing paths plus assets (a collector that silently found nothing would otherwise make
   every mutation arm pass).

*Design calls a reviewer should test, not inherit — see the thread HANDOFF for the full rationale.*
The orchestrated syntax is the existing bolded-backticked list-entry shape (not "any backticked
mention"); dispatch entries are read from **agents only**; cross-department **agent** referrals are
deliberately permitted while cross-department **skill** references fail.

*Verification: none. No command was executed in this session — the environment provides file tools
only, no shell.* `npm test`, `node scripts/validate-plugin.mjs`, `node scripts/pack-preview.mjs
--self-test`, `--check` and `--all --out <dir>` are **all owed**. Every "passes" claim above is a
claim about code that was **read**, not run. Consequently: branch `kai/feat/29-crosspack-validator`
was **not** created, nothing is committed, `change_ref` is `null`, and **the required
`independent-architecture` review cannot bind yet** — only reviews matching a real ref count.

**Validation continuation 2026-08-25-1420 (`@operator`).** Created branch
`kai/feat/29-crosspack-validator`. Ran `node scripts/pack-preview.mjs --self-test` (**70 checks
passed**), `node scripts/validate-plugin.mjs` (**56 agents / 51 skills**),
`node scripts/pack-preview.mjs --all --out <session temp>` (**all five pack previews generated**,
then removed), and full `npm test` (**exit 0**). Minted exact non-destructive review binding
`cb5fd0290f1a8b7478b54e98bf24f1968aa58f09`; implementation and release files are unchanged
after the binding. CI-on-pushed-PR remains the only unticked verification criterion.

## Review — independent architecture (ratification), 2026-08-25-1428 (`principal-swe-architect`)

**Verdict: RATIFIED at `change_ref cb5fd0290f1a8b7478b54e98bf24f1968aa58f09`.** Item v4 -> v5,
**still `in-review`** — ratification is not completion — lease cleared,
`next_role: principal-swe-architect -> workflow-ship`, and `completed_reviews` now carries
`principal-swe-architect` / `independent-architecture` / `ratified` at this exact ref. That entry is
good **for this ref only**: if the ref moves, it stops counting and the requirement re-binds.
*(Stamped `1428` to preserve append-only record ordering behind the operator's `1420` handoff; this
session's clock read 14:11.)*

**How this was read, stated so it is not over-read.** This run had **no shell**; nothing was
executed. The 70-check self-test, `validate-plugin` at 56 agents / 51 skills, the five-pack preview
and `npm test` exit 0 are **operator-attested inputs, not this review's verdict**. The bound snapshot
was read through the worktree on the operator's attested empty diff for all implementation and
release files. No implementation or release file was edited here; no commit, push, PR, merge, tag,
release or publication. This review clears **only** the architecture requirement — it does not tick
the CI-green-on-the-pushed-PR criterion, which only CI can supply.

### The seam, and why it is the right one

```
  root corpus (single source of truth — read, never moved)
    agents/*.agent.md                     skills/*/SKILL.md
        |                                       |
        |  declaredInherits / dispatchedRefs    |  user-invocable / assetRefs
        |  assetRefs                            |
        +------------------+--------------------+
                           v
                  collectReferences()            <-- ONE collector (WS#3)
                  refs: {from, fromPack, firing[], kind, target}
                           |
                           |            materializePacks()  <-- what a user installs
                           |                     |
                           |                packProviders()  ->  skill:<id> / agent:<id> -> [pack]
                           v                     v
                  referenceErrors()  <---- resolves against EMITTED FILES, not a plan
                  planAssets()  -> asset -> owner pack        ]
                  assetOwnershipErrors()                      ]  the plan WS#7 must CONSUME
                  hooksAssignmentErrors(HOOKS_OWNER u emitters)]
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  WS#7 pack-split-generated-pack-trees: EMITS assets + hooks.json into trees
```

The load-bearing structural choice is the one below the dashed line on the left: **references
resolve against `packProviders(materializePacks(...))`, not against `planPacks()`**. A plan that adds
up on paper and a tree that omits a provider are different failures, and only the second one reaches
a user. Resolving against emitted files makes "the generator would not copy this" a CI failure today
instead of a support ticket after the split. That single decision is worth more than everything else
in the change, and it is correct. Design call **6** is endorsed without qualification.

### The four contested calls — ruled, with the evidence re-derived here

**1. Orchestrated syntax = the bolded-backticked list-entry head (`DISPATCH_ENTRY`). ENDORSED.**
This is not a new syntax; it is the exact shape `validate-plugin`'s pre-existing firing-path check
already treated as dispatch for the `workflow-doc-review` lenses, so the item added a parser for a
convention that already existed rather than a convention to fit a parser. "Any backticked mention"
was correctly rejected: the corpus carries editorial cross-links (`build-diagrams` <-> `ui-mockup`,
`kai-core-issue-analysis` -> `pr-sizing`) that would become cross-pack dependencies they are not. A
prose link is not a firing path, and inventing a dependency is worse than missing one here, because
the false dependency would force real structural changes to satisfy a parser.

**2. Dispatch declarations collected from agents only. ENDORSED — on evidence re-derived
independently, not inherited.** Every dispatch-shaped list head in all 51 skills was enumerated: 59
matches across 13 skills, and **zero** of them name a skill. They are record-field schemas
(`kai-core-work-coordination`'s 19 fields, `product-marketing-intelligence`'s claim schema,
`kai-core-proactive-scan`'s signal keys), lifecycle states, error strings, output-path templates,
family globs (`director-*`, `principal-*` — correctly non-matching under `AGENT_SHAPED` because `*`
is outside the class), and in `kai-core-design-grounding` four **agent** ids used as a stakeholder
map. Collecting skills would therefore add ~55 false tokens and, at best, four agent referrals that
are permitted anyway — **zero added coverage, real false-positive cost**. The call is right, and it
is right for a measured reason rather than a stylistic one.

**3. Cross-department *agent* referrals permitted; cross-department *skill* references fail.
ENDORSED — and the partition lock does not need re-opening.** Read directly: partition-lock §7.2 is
stated in terms of inheritance — *"any skill **inherited** by agents in more than one pack is
promoted to core; so a pack agent can only **inherit** (a) a core-provided skill or (b) its own
pack's local skill"* — so §7 binds **providers**, not referrals. Infra's reading is the correct one
and the offered one-line change (`if (ref.kind === 'agent') continue;` removal) must **not** be
made: it would fail 12+ live referrals and demand a re-routing plan this item does not own. The
underlying force is real and asymmetric: a skill is **loaded into context** at fire time, so a
missing one breaks the body that named it; an agent id is a **routing target** the host resolves at
dispatch, so a missing one degrades to "that pack is not installed". Agent refs are still required
to resolve to exactly one pack, and an agent-shaped token that resolves to nothing still fails — the
asymmetry is about *cross-pack* reach, not about giving agent refs a free pass.

**4. Asset ownership planned and validated now; emission at WS#7. ENDORSED, with one binding
constraint on WS#7 (below).** This matches the decomposition exactly: WS#7 owns *"realizing the
explicit asset-ownership rule"* and is *"contained by the architecture review and the WS#3
asset-reference validator"*. Validating an ownership rule requires an ownership model, so deriving
`planAssets` in the shared lib is the seam, not scope creep — provided WS#7 consumes it.

**5. `HOOKS_OWNER = core`, unioned with generated emitters. ENDORSED.** All four future states were
traced and every one fails closed: core-only emission -> `{core}`, clean; core + a department
emitting -> `{core, department}`, duplicate error by name; department-only emission with the constant
moved -> single owner, but the observer script is owned by core and the foreign-script arm fires;
nothing emitted (today) -> `{core}`, and the non-tautological half still bites if `fleet-observation`
ever leaves core. Declaring the owner as a constant *and* unioning with emitters is the smallest
shape that makes the duplicate arm live before the emitter exists.

### Fail-open / vacuous-collector scan (what was actually checked)

- **Collectors are not vacuous, and the guard is real.** The live arms assert thresholds, not
  presence: >100 inherited skill refs, >5 orchestrated agent refs, >5 user-invoked skill refs, >=1
  asset, plus four *named* carry assertions (a department agent inheriting the core contract, a
  dispatched `review-*` lens, a cross-department agent referral, and `demo-zoom` down to the script
  it tells you to run). A collector that silently found nothing cannot pass.
- **`declaredInherits` reads one line — and that is safe by construction elsewhere.** The single-line
  `^\*\*Inherits:\*\*` match would be a fail-open if an agent could wrap its inherits list, but
  `validate-plugin.mjs:276–303` independently enforces *exactly one* such line, as the *first* line
  of the body, with at least one backticked skill; all 56 agents satisfy it. No gap.
- **Unplaced / orphan skills fail closed.** `fromPack: null` yields "comes from a file no pack owns"
  for both the inherited and the user-invoked paths, and the plan side is caught by the self-test's
  `orphans === overrides` set equality plus `unplaced === 0`.
- **Provider identity is sound.** `packProviders`' `dir.replace(/^kai-/, '')` is the exact inverse of
  `packPluginName` for *every* possible pack key (that function always prefixes `kai-`), so no pack
  can be misattributed and no future name breaks the mapping. The duplicate-provider arm is
  defensive rather than reachable today, which is the correct direction.
- **No new future-pack-name assumption was introduced.** The known one —
  `/^kai-[a-z]+\/agents\/.+\.agent\.md$/` gating the preflight pin — is **pre-existing** and already
  a parked PROPOSAL (P2-S1, preflight-compat ship record). Sharing `generatedPacks` with that check
  did not widen it, and the new hooks-claimant path is deliberately name-agnostic.
- **Scope holds.** No new CI step: the workflow already runs `validate-plugin`,
  `pack-preview --self-test` and `--check`, and the `.github/workflows/validate.yml` diff is header
  prose describing what those steps now cover. `COMMITTED_PACKS` is still `[]`, there is **no `packs/`
  tree**, and `marketplace.json` is still **N=1** (`kai` at `source: "."`) at `0.60.0`. No capability
  rode along; the `touches` extension was declared, not silent.

### Stated plainly so a green check is not over-read

Given `planAssets` output, `assetOwnershipErrors` can only fire **two** of its arms on live data:
*asset does not exist* and *consumer belongs to no pack*. The other two — shared-asset-routed-to-a-
department and consumer-cannot-reach-owner — are **structurally unreachable today**, because
`planAssets` *defines* the owner from the consumer set and therefore cannot disagree with itself.
This is **not a defect**: acceptance criterion 2 ("an asset referenced across >1 pack is flagged for
core") is satisfied by the **assignment**, which the self-test pins on a live subject
(`scripts/generate-audio.ps1` -> core, `scripts/demo-zoom.mjs` -> personal). But those two arms only
become load-bearing when **WS#7 supplies an independent owner source**. Recording it here so nobody
later reads today's green as proof of a guarantee it does not yet make.

Similarly: ownership of the hook's script is currently derived from **prose invocation** —
`scripts/observe-subagent.mjs` is owned by core because `skills/fleet-observation/SKILL.md` (a core
skill) tells a reader to run it. The direction is fail-closed (delete the sentence and the validator
says "no pack owns it"), so it is correct today, but prose is a fragile *routing* input.

### Binding constraints on `pack-split-generated-pack-trees` (WS#7) — handoff, not a how-to

1. **Consume `planAssets` and `HOOKS_OWNER`; do not re-derive ownership.** A second ownership truth
   in the emitter is precisely the A5 duplicate-roster-truth defect class, and it would be invisible
   because the validator would keep agreeing with itself.
2. **Route the hook's scripts by declaration.** `hooks.json` and everything its commands invoke ship
   with `HOOKS_OWNER`, because `${PLUGIN_ROOT}` never crosses a plugin boundary. Do not let a prose
   mention decide where a host-executed script lands.
3. **Emit `hooks.json` into core only.** The union check will fail a second emitter by name; that is
   the intended alarm, not a hurdle to route around.

### Non-blocking observations — recorded, routed, and deliberately not fixed here

- **N1 — a dispatch entry naming a skill that no longer exists is silently dropped.** Skill tokens
  are classified by *resolution* (`skillOf.has`), agent tokens by *shape* (`AGENT_SHAPED`), so the
  dangling case is caught for agents and missed for skills: rename a `review-*` lens and its dispatch
  entry dangles unchecked. This is **not** a cross-pack defect — nothing mis-resolves across a
  boundary — and it exists identically in the monolith today; skills have no family prefix, so shape
  cannot disambiguate `review-gone` from an output mode like `post-only`, and inventing a syntax to
  fix it is exactly what call 1 correctly refused. Cheap mitigation when someone is in this file:
  extend the live self-test arm from one lens to the **full `workflow-doc-review` lens set**, so a
  deletion or rename fails by name. Routed to **`pack-split-ci-partition-checks`** (roster truth).
- **N2 — two definitions of "agent-shaped token" now exist.** `AGENT_REF` in `validate-plugin.mjs:157`
  covers five families and **omits `creative`**; the new `AGENT_SHAPED` covers six and is the complete
  one. The pre-existing under-scan means an unknown `creative-*` reference in docs/README escapes
  that older check. This item's collector is unaffected, but a second shape definition was added
  where the item's own stated principle is "one parser". Right fix is one exported family constant
  both derive from — which changes a docs-scanning check's behaviour, so it belongs with **A5 in
  `pack-split-ci-partition-checks`**, not here.
- **N3 — the hooks-claimant filter is looser than its intent.** `key.endsWith('/hooks.json')` counts
  *any* depth, so a future `kai-core/skills/<x>/hooks.json` sample file would register as a pack
  claimant; `^[^/]+/hooks\.json$` is the exact intent. Unreachable today (`materializePacks` emits
  only `plugin.json`, agents and skills) and fail-closed if it ever fires. For whoever makes the
  claimant path live — **WS#7** — not a reason to move this ref.
- **N4 — hook-asset key-spaces differ.** The collector's `ASSET_REF` matches only top-level
  `scripts/<name>.<ext>`, while the hooks-command extractor accepts nested paths and takes only the
  **first** `${PLUGIN_ROOT}` path per command. A future nested or second hook script would fail
  closed but with a misleading "no pack owns" message. One line, whenever hooks change.
- **N5 — no separate design artifact was filed, and that answers infra's question.** The initiative's
  convention for an architecture review is the item's own `## Review` section (see
  `pack-split-preflight-compat`, whose `completed_reviews` evidence is a section heading; only the
  *security* review has an artifact file). Opening an `artifacts/architecture/` lane for this would
  be a new artifact surface for no reader — **this section is the durable record**.

### Escalation to the steward — a system question this review will not decide

Cross-department **agent referral degradation is unspecified**. Ratifying call 3 permits 12+ live
referrals (`principal-swe-manager` -> `principal-product-manager`, `creative-video-director` ->
`principal-product-marketing`) to survive the split, and at runtime each becomes "that role is not
installed" with no defined behaviour: WS#5 `degraded-refusal` covers a missing **core**, not a
missing **sibling department**. Whether a referral to an uninstalled department should degrade
silently, name the missing pack, or suggest installing it is a **product call about the operator's
experience**, not an architecture call, and answering it would add a surface no committed item owns.
Routed to **`principal-product-manager`** as a PROPOSAL for triage — deliberately **not** a
dependency, a new item, or an acceptance criterion on this or any other item.

### What this ratification does not do

It does not make the item `complete`, `release-ready` or `shipped`; it does not tick the pushed-PR CI
criterion; it does not clear `pack-split-ci-partition-checks` (which needs this item at `shipped`);
it does not waive the touch-conflict check that `pack-split-degraded-refusal` still shares on
`scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs` — that overlap is now **live surface
movement**, so `degraded-refusal` must read this diff first. Milestone `dependency-guarantees`
remains **2 of 5 required items `shipped`**.

## Notes

- Delivers the "wired into the multi-manifest validate/release gates" clause on top of
  `pack-split-generator-gates`. Runs in parallel with `pack-split-preflight-compat`.
- The orchestrated firing path has no static `**Inherits:**` anchor — scoping how it is checked
  may need a `principal-swe-architect` call (covered by the required architecture review).

### Steward promotion — 2026-08-25-1139 (`principal-product-manager`)

**`proposed -> ready`, priority 20 (unchanged), `next_role: principal-swe-infra`, version 1 -> 2.**

- **Dependency verified, not assumed.** The sole `depends_on` entry
  `pack-split-generator-gates (requires: shipped)` is satisfied: `state: shipped` at version 17,
  `change_ref 457254b97…`, PR #152 merged into `47aa0549f89b1733483dd6b662a4787d621c9430`,
  released `v0.58.0`, production verification passed.
- **Priority 20, not 10 — and this is a real ordering, not a tie.** This item is genuinely
  parallel-capable with `pack-split-preflight-compat` and blocks nothing that preflight-compat
  does not also block, while preflight-compat additionally unblocks `degraded-refusal`. Both
  share one owner (`principal-swe-infra`), so if only one can run, preflight-compat runs first.
  If a second infra capacity exists, these two may run concurrently — their declared `touches`
  overlap only in `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs` and
  `.github/workflows/validate.yml`, so concurrent execution needs a touch-conflict check at
  dispatch, not a new dependency.
- **Fits `scope.current`.** Milestone `dependency-guarantees`, `required_for_milestone: true`;
  1 of the 4 required items still outstanding. No milestone semantics changed.
- **Ownership confirmed, not expanded.** The steward's `generator-gates` acceptance correction
  (2026-08-24-2240) assigned **asset-reference validation** and the **`hooks.json`
  exactly-one-pack** rule to this item; both were already acceptance criteria 2 and 3 and stay
  exactly as written. Materializing that ownership into committed trees remains
  `pack-split-generated-pack-trees`; this item validates, it does not generate.
- **Touch-set reconciled to the shipped foundation.** `scripts/lib/pack-plan.mjs` added — the
  partition, `discoverManifests`, `manifestParityErrors`, and `marketplaceConsistencyErrors`
  that this validator layers on all live there now. Claim, not proof.
- **Coordination note (no dependency added).** `pack-split-host-semantics-spike` answers whether
  `hooks.json` hooks fire **once** or **per-plugin** on real hosts. That answer does not gate
  this item — the exactly-one-pack assignment rule holds either way — but if the spike returns
  a per-plugin firing result while this item is in flight, route it to the steward as a scope
  question rather than re-scoping the check in place.
- **Unchanged, deliberately:** outcome, milestone, `required_for_milestone`, `delivery_class`,
  the single `independent-architecture` review requirement, the open orchestrated-firing-path
  question (it routes to that review, it does not block start), and the `0.x` versioning rule.
  No architecture decision was made or re-opened by this promotion.

## Ship gate — PREPARE, 2026-08-25-1435 (`workflow-ship`)

**Verdict: RELEASE-READY.** All six DoD dimensions **Clear**; none waived. Item **v5 -> v6,
`in-review -> release-ready`**, lease `null`, `resume_state: null`,
`next_role: workflow-ship -> "@operator"`. **NOT shipped:** `workflow-ship` merged nothing,
tagged nothing, released nothing and published nothing, and it will not — the deploy steps are
the operator's to run. *(Stamped `1435` to preserve append-only ordering behind the architect's
`1428`; this session's clock read 14:23.)*

**Ship record:** `kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md`
— written in the library zone; its final move into
`…/02-ship-pack-split-crosspack-validator/ship-record.md` is **deploy step 2**, because this run
had no shell and the file tool cannot create a directory. Doing it there keeps the move inside the
same records commit, so no post-ship reconciliation is owed.

**Release under gate:** PR **#156** *feat: validate cross-pack references* — open, draft false,
**`mergeable: true`, `mergeable_state: clean`**, **1 commit**, **+1314 / −55 across 15 files**.
Head **`0f3705e0b714f7d23a900296fb7c6f59d12148be`** (short `0f3705e` resolved from
`.git/refs/heads/kai/feat/29-crosspack-validator` and confirmed by the GitHub API); base `main`
**`630089bc3609e4b5793f3e755fadc7bb51d43bf4`**, which is byte-identical to local `main` **and**
`FETCH_HEAD`, so the branch is exactly one commit ahead with no divergence. Version
`0.59.0 -> 0.60.0`.

**The one criterion that was open is closed with real evidence.** Criterion 5 is now ticked on
run `32900688907` / job `97973596644` (`conclusion: success`, 11/11 steps, 16s, `ubuntu-latest`),
read directly from `api.github.com` by this gate. The architecture review explicitly declined to
tick or waive it; only CI could supply it, and CI has.

**Dimension notes, so a Clear is not over-read.**

- **1 scope-true.** Non-negotiables re-read **at the PR head**, not asserted: `COMMITTED_PACKS = []`
  and `HOOKS_OWNER = 'core'` in `scripts/lib/pack-plan.mjs` at `0f3705e…`; all eight version
  locations coherent at `0.60.0` (four read at the head commit via `raw.githubusercontent.com`,
  four from the PR patches); marketplace still **N=1** at `source: "."`; **no `packs/` tree**;
  root `agents/` and `skills/` untouched — **no shipped body was edited to fit the parser**.
  `.github/workflows/validate.yml` is header-comment-only (+9/−7 inside the `#` block), and the
  job's 11-step list matches the `0.59.0` run, so "no new CI step" is verified twice.
- **2 verified.** CI as above; the local suite (70-check self-test, 56 agents / 51 skills,
  five-pack `--all --out`, `npm test` exit 0) is **operator-attested**, not re-derived here.
  Design sub-gate **not triggered** — build/CI tooling, no user-facing surface; no waiver invented.
- **3 reviewed.** The sole `review_requirements` entry is satisfied at this item's own
  `change_ref cb5fd029…`, zero blocking findings. Head-vs-ref byte-identity is an operator
  attestation this run could not re-derive (no shell) and is re-checked mechanically as deploy
  step 1, which fails closed. No security review was required and none was invented.
- **4 shippable-safely.** `review-rollout-operability` applied and right-sized — **Holds**. No
  runtime, data, migration or publication change; all 56 agent and 51 skill bodies byte-unchanged.
  Real blast radius named: this repo's CI now gates every future PR on the new rules, and the next
  contributor to move a reference will meet them. Canary/flag/runbook **not applicable** and
  deliberately not invented; reversibility is total (revert; plus tag+release deletion after
  tagging).
- **5 documented.** CHANGELOG `[0.60.0]` + a compare link whose `v0.59.0` tag exists; README
  `## Status`; the workflow header now describes what it enforces; deliverables indexed; the
  initiative log carries the release-ready entry. The **ship** stamp is withheld.
- **6 coordination-closed.** Thread deploy HANDOFF appended; `BOARD.md` and `ACTIVE.md` refreshed;
  the architect's escalation parked as a **PROPOSAL** in `kai/initiatives/pack-split/backlog.md`
  rather than left inside a review section; `depends_on` verified satisfied;
  `waiting_on_questions: []`.

**Environment limits, recorded not papered over.** No shell. `api.github.com` returned **403**
partway through paging the PR file list, so 6 of 15 changed filenames were re-derived directly and
**9 rest on the declared `touches` plus count agreement** (10 implementation/release + 5
coordination = 15). Deploy step 1 turns that inference into a mechanical `git diff --name-only`
check that fails closed on any extra path.

**Nothing downstream moved.** `pack-split-ci-partition-checks` requires this item at **`shipped`**
and stays non-dispatchable; `pack-split-degraded-refusal` still overlaps
`scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs` as **live surface movement**.
Milestone `dependency-guarantees` remains **2 of 5 required items `shipped`**.

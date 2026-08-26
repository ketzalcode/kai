---
type: work-item
id: pack-split-ci-partition-checks
title: Real CI partition/collision/skew gates + kai-core-* namespace enforcement (forces fleet rename)
initiative: pack-split
milestone: dependency-guarantees
delivery_class: product-change
state: shipped
resume_state: null
priority: 50
owner: principal-swe-infra
next_role: null
target: pack-split CI partition enforcement + namespace
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - scripts/validate-plugin.mjs
  - scripts/generate-catalog.mjs
  - kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
touches:
  - .github/workflows/validate.yml
  - scripts/validate-plugin.mjs
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
  - skills/kai-core-fleet-observation/SKILL.md
  - scripts/generate-catalog.mjs
  - test/fixtures/inventory.json
  - docs/getting-started.md
  - docs/workspaces.md
  - docs/reference/agents-and-skills.md
  - docs/reference/plugin-structure.md
  - docs/proposals/pack-architecture.md
  - README.md
  - CHANGELOG.md
  - package.json
  - package-lock.json
  - plugin.json
  - .github/plugin/marketplace.json
depends_on:
  - item: pack-split-crosspack-validator
    requires: shipped
  - item: pack-split-preflight-compat
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews:
  - role: principal-swe-architect
    kind: independent-architecture
    change_ref: aca16e56d3d70cf6bac5181a41c3d4a87055dccc
    verdict: ratified
    evidence: "## Independent architecture re-review — 2026-08-25-1745 (ratification)"
    timestamp: 2026-08-25-1745
change_ref: aca16e56d3d70cf6bac5181a41c3d4a87055dccc
version: 12
lease: null
updated: 2026-08-25-1751
---

## Outcome

The `--all` self-test plus collision / partial-install / version-skew arms run as **real CI gates**,
and core-provided skills are enforced to carry the `kai-core-*` prefix — which forces the rename
`fleet-observation` → `kai-core-fleet-observation`. The locked partition is CI-enforced, monolith
still authoritative.

## Acceptance

*Tightened by the steward at promotion 2026-08-25-1148 against the shipped foundation
(`v0.58.0` on `main`). Two finding-driven changes only, nothing added: the bundled
"local commands + CI green" criterion is **split** (that exact bundling bounced
`generator-gates` at the 2026-08-24-2244 DoD gate), and the rename criterion now names
`scripts/lib/pack-plan.mjs` as the canonical partition source it must update — verified on
`main`, which carries `'fleet-observation': 'core'` in that file's skill map. The A5 criteria
below are unchanged from v2.*

- [x] `validate.yml` runs the partition self-test + collision + partial-install + version-skew arms
      as failing CI gates (not just `npm test`). *(Four named steps added after `Pack generator
      self-test`: `--gate partition | collision | partial-install | version-skew`. Written, not
      observed running — see Evidence.)*
- [x] `validate-plugin.mjs` fails if any core-provided skill lacks the `kai-core-*` prefix.
      *(`namespaceErrors` in `scripts/lib/pack-plan.mjs`, enforced in both directions; a department
      claiming a `kai-core-*` name fails too. Not executed.)*
- [x] `fleet-observation` renamed to `kai-core-fleet-observation` — skill dir + the **canonical
      partition source** (`scripts/lib/pack-plan.mjs`, which maps `'fleet-observation': 'core'`
      today) + `generate-catalog.mjs` CATEGORIES + `test/fixtures/inventory.json` + doc mentions;
      catalog check green. *(**Ticked at the 2026-08-25-1750 DoD gate.** The `git mv` landed at
      1720: `skills/kai-core-fleet-observation/SKILL.md` exists and `skills/fleet-observation/` is
      gone. Catalog check green rests on the operator-attested `npm test` — CI does **not** run
      `generate-catalog --check` — corroborated by reading its two artefacts,
      `docs/reference/agents-and-skills.md:199` and `test/fixtures/inventory.json:81,143`.)*
- [x] Director availability is asserted by roster **membership**, not a model-computed count (per proposal).
      *(Decomposition Open Question 4 answered: the work was already complete —
      `agents/director-chief-of-staff.agent.md` §2b carries all three rules. It is now pinned by
      `availabilityErrors` over `DISPATCHING_ROLES`, so it cannot fall off in an unrelated edit.)*
- [x] `node scripts/pack-preview.mjs --self-test`, `node scripts/validate-plugin.mjs`, and
      `npm test` pass **locally**. *(**Ticked at the 2026-08-25-1750 DoD gate on operator
      attestation, labelled as such:** 134 self-test checks, `--gate all` four gates clean,
      `validate-plugin` 56 agents / 51 skills, `host-contract` self-test, full `npm test` pass.
      The ship gate had no shell and executed nothing.)*
- [x] The new CI gates run **green on the pushed PR** (their own claim, their own evidence — a
      workflow run, not an assertion). *(**Ticked at the 2026-08-25-1750 DoD gate, machine-read
      from `api.github.com`, not accepted on report.** PR [#160](https://github.com/RubenSaucedo/kai/pull/160),
      head `63f6da167f1ead58bc63dd5ef8e9c5f52ad1869b`; check run `contract` `98018029769`
      (run `32915426171`), `conclusion: success`, 18s, `check-runs total_count: 1`. The four gates
      are **individually green as named steps** — 9 `Partition gate (one pack per agent, one
      provider per skill, kai-core-* namespace)`, 10 `Collision gate (no id emitted by two packs)`,
      11 `Partial-install gate (a department installed with kai-core alone)`, 12 `Version-skew gate
      (contract pins agree; absent or skewed core fails closed)` — matching `validate.yml:47-55`
      byte-for-byte, so the pushed workflow is the reviewed workflow.)*
- [x] Version bumped on `0.x` with CHANGELOG + README stamp. *(`0.61.0 -> 0.62.0` across
      `plugin.json`, `package.json`, `package-lock.json` ×2, `.github/plugin/marketplace.json` ×2,
      the dated `## [0.62.0] - 2026-08-25` CHANGELOG section and its compare link, and the README
      `## Status` stamp. Not verified by the gate that checks it.)*

*Carried forward from the `pack-split-generator-gates` architecture review (finding A5, ratified
2026-08-24-2231); routed here by the steward at acceptance 2026-08-24-2240. Not a defect today —
the authoritative assertions are unaffected — but this item is what turns the partition self-test
into a hard CI gate, so the duplicate truth must be collapsed immediately before those checks
become load-bearing.*

- [x] **(A5)** `scripts/pack-preview.mjs` carries **one** roster truth: `PACK_AGENTS` is derived
      from the canonical partition (`export const PACK_AGENTS = PACKS.personal;`) or removed, so the
      second independently maintained copy of the personal roster cannot drift from `PACKS.personal`.
      *(Removed outright, along with `planSkills`. Nothing imported them; `build()` is now a thin
      selection over `buildAll({packs:[pack]})`.)*
- [x] **(A5)** Every partition self-test check runs the canonical `planPacks()` path; no check is
      left asserting against the legacy `planSkills(PACK_AGENTS)` path (four of the 35 checks do
      today), so a CI gate cannot pass against stale truth.
      *(All four re-pointed at a single hoisted `const plan = planPacks()`.)*

## Evidence

**Nothing in this section was executed.** This run had **no shell** — the session exposes only
file read/write/search tools. Every claim below is "written and read back", never "run and passed".

### Changed paths (uncommitted on `main`, no branch, no commit)

> **Superseded 2026-08-25-1745 (`principal-swe-architect`, record note — no claim below was
> rewritten).** This section was written at 1705, before any commit existed. The work is now
> committed at `aca16e56d3d70cf6bac5181a41c3d4a87055dccc` on `kai/feat/29-ci-partition-checks`
> (parent `16493a303c…` = `main`), the `git mv` has landed on disk, and the A2/A3 fixes changed
> wording in these same files plus the four `validate.yml` step names (the names listed in the
> table below are the pre-fix ones). Still true: **nothing is pushed** and no PR exists.

| path | change |
|------|--------|
| `scripts/lib/pack-plan.mjs` | The single machine-readable partition. New pure gates: `partitionErrors`, `namespaceErrors`, `providerCollisionErrors`, `contractPinErrors`, `availabilityErrors` (over `DISPATCHING_ROLES` / `AVAILABILITY_RULES`), `guaranteeBlockErrors`. New `parseGeneratedKey()` (P2-S1), `agentShapedPattern()` / `agentRefPattern()` over `AGENT_FAMILIES` (N2), `HOOK_ASSET_RE` / `hookAssetsIn()`, `CORE_SKILL_PREFIX`. `SKILL_OWNER_OVERRIDES` key renamed to `kai-core-fleet-observation`. |
| `scripts/validate-plugin.mjs` | New **"The partition (who ships what)"** section (partition + namespace + collision + director availability), all reported against `scripts/lib/pack-plan.mjs`. Inline contract pins and the ~45-line guarantee-block loop replaced by calls to the shared gates. `AGENT_REF` now derived from `agentRefPattern()`. Hooks claimant filter uses `parseGeneratedKey`. |
| `scripts/pack-preview.mjs` | A5 removals; ~45 new mutation arms (partition ×11, namespace ×3, collision ×3, `parseGeneratedKey` ×5 incl. hyphen + digit pack keys, guarantee blocks ×8 incl. a hyphenated pack, contract pins ×7, availability ×4, roster shape ×1, doc-review lenses ×2). New `--gate <name>` runner with `GATE_VERSION` and the four gates. |
| `.github/workflows/validate.yml` | Four new **named** steps: `Partition gate (completeness, uniqueness, namespace)`, `Collision gate (agent + skill provider)`, `Partial-install gate (cross-pack refs, assets, hooks, guarantee blocks)`, `Version-skew gate (contract pins + preflight arms)`. |
| `skills/fleet-observation/SKILL.md` | Frontmatter `name:` → `kai-core-fleet-observation`. **Directory not moved — owed to `@operator`.** |
| `scripts/generate-catalog.mjs`, `test/fixtures/inventory.json` | Rename in CATEGORIES and in the golden inventory (re-sorted in both `skills` and `user_invocable_skills`). |
| `docs/reference/agents-and-skills.md`, `docs/getting-started.md`, `docs/workspaces.md`, `docs/proposals/pack-architecture.md`, `README.md` | Rename in prose. |
| `docs/reference/plugin-structure.md` | Two rows added to the `npm test` table for the new gates. |
| `CHANGELOG.md`, `README.md`, `plugin.json`, `package.json`, `package-lock.json`, `.github/plugin/marketplace.json` | `0.61.0 -> 0.62.0` across all eight release locations + dated section + compare link + `## Status` stamp. |

**Touch-set expansion, declared not hidden:** `package.json`, `package-lock.json`, `plugin.json`,
`.github/plugin/marketplace.json` (the release-bump criterion cannot be met without them),
`docs/proposals/pack-architecture.md` (that line contains the verb "inherits", so the validator's
inherit-line check rejects the stale token — the rename is forced, not optional) and
`docs/reference/plugin-structure.md` (the two new `npm test` rows). All added to `touches`.

### Commands owed (none of these has been run)

```
git checkout -b kai/feat/29-ci-partition-checks
git mv skills/fleet-observation skills/kai-core-fleet-observation
node scripts/pack-preview.mjs --self-test
node scripts/pack-preview.mjs --gate all
node scripts/pack-preview.mjs --check
node scripts/validate-plugin.mjs
npm run docs:generate      # expect no diff beyond the renamed row
npm run host-contract
npm test
```

### Why `change_ref` is still `null`

`change_ref` must be a real commit or PR SHA. With no shell nothing can be committed, so no ref can
be minted, so the item **cannot** truthfully reach `in-review` and the required
`principal-swe-architect` / `independent-architecture` review **cannot be bound**. That is the whole
of `Q-pack-split-ci-partition-checks-01`.

### Invariants preserved (read back, not executed)

- Root `agents/` + `skills/` remain the canonical source; no `packs/` tree was created.
- `COMMITTED_PACKS` is still `[]`.
- `.github/plugin/marketplace.json` still has **exactly one** entry, `kai` at `source: "."`.
- No new tool grant on any agent; no agent or skill body changed except the one frontmatter `name:`.
- Agent/skill counts unchanged at 56 / 51 — the rename moves a name, it does not add or drop one.

## Notes

- Architect caveat (a): the rename is **forced** (the prefix check goes red until it lands) and
  **contained** — `fleet-observation` is an orphan (no agent inherits it), so no inheritance refs change.
- Must precede `pack-split-generated-pack-trees` so core's generated tree carries `kai-core-fleet-observation`.
- CI capstone of `dependency-guarantees`.
- **A5 provenance (steward, 2026-08-24-2240).** `pack-split-generator-gates` eliminated the
  duplicate partition truth everywhere except this one legacy export; it was deliberately not fixed
  in that ratified diff because re-opening a bound `change_ref` for a non-defect buys nothing.
  `scripts/pack-preview.mjs` is already in this item's `touches`, so A5 costs approximately one line
  plus re-pointing four self-test checks.

### Steward promotion — 2026-08-25-1148 (`principal-product-manager`)

**`proposed -> ready`, priority 20 -> 50, `next_role: principal-swe-infra`, version 2 -> 3.**

- **Promoted with both dependencies unmet, deliberately.** `ready` is a **steward commitment**
  (fits scope, acceptance defined, `depends_on` declared) — it does **not** require the
  dependencies to have resolved. Neither `pack-split-crosspack-validator` (`ready`, priority 20)
  nor `pack-split-preflight-compat` (`ready`, priority 10) is `shipped`. **This item is
  therefore NOT dispatchable** and must fail the director's dependency check until both reach
  `shipped`. *Executable* stays a derived predicate at dispatch time, never stored here.
- **Dependency types preserved exactly.** Both entries remain `requires: shipped` — not relaxed
  to `in-review` or `release-ready`. `crosspack-validator` supplies the multi-manifest gate base
  this layers on; `preflight-compat` supplies the emitter the **version-skew arm** tests
  (decomposition WS#6). Softening either would let the capstone assert against a base that can
  still change under it.
- **Priority 50 — last in the initiative queue.** It is the CI capstone of
  `dependency-guarantees` and the only item here waiting on **two** upstreams, so it ranks behind
  `pack-split-degraded-refusal` (40) and behind all three dependency-satisfied items. Queue order
  reflects reachability on a single-owner (`principal-swe-infra`) bottleneck.
- **Fits `scope.current`.** Milestone `dependency-guarantees`, `required_for_milestone: true`;
  1 of the 4 required items still outstanding. No milestone semantics changed.
- **Touch-set reconciled to the shipped foundation and to WS#6 as written.** Added
  `scripts/lib/pack-plan.mjs` — after `generator-gates` the canonical partition source lives
  there and still maps `'fleet-observation': 'core'` (verified on `main`), so the forced rename
  cannot land without it; and the doc/README/CHANGELOG paths WS#6 already enumerated. A claim,
  not proof — reconcile the actual changed-path set on handback. **Not decided here:** whether
  historical `CHANGELOG.md` entries naming `fleet-observation` are rewritten or left as history
  (the release stamp touches that file regardless). That is the acting role's call at
  implementation; if it grows past a mechanical rename it routes to the steward as a scope
  question.
- **Review requirement unchanged and not expanded.** One review only —
  `principal-swe-architect` / `independent-architecture` (namespace invariant + the rename +
  partition-CI coverage). The steward did **not** add `independent-security` here; this item
  wires gates, it does not define the fail-closed refusal boundary (that is
  `preflight-compat` / `degraded-refusal`).
- **Open question carried, non-blocking.** Decomposition Open Question 4 — whether the "partly
  landed" director-availability membership work is complete — stays open on this record and is
  **not** in `waiting_on_questions`: it is verified at acceptance against criterion 4, and does
  not block the start of work. It must be answered before this item can claim that criterion.
- **Unchanged, deliberately:** outcome, milestone, `required_for_milestone`, `delivery_class`,
  `owner: null`, the A5 criteria and their provenance, the forced-and-contained rename framing,
  the must-precede-`generated-pack-trees` ordering, and the `0.x` versioning rule. No
  architecture decision was made or re-opened; ratified WS#6 stands as written.

### Build — 2026-08-25-1705 (`principal-swe-infra`)

**`ready -> in-progress -> blocked` (v3 -> v4), `owner: principal-swe-infra`,
`resume_state: in-progress`, `next_role: "@operator"`, `change_ref` still `null`.**

Both dependencies were verified `shipped` before starting (`preflight-compat` 2026-08-25-1328,
`crosspack-validator` 2026-08-25-1440), and the touch-conflict surface was read at landed `v0.61.0`
— `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs` and `scripts/pack-preview.mjs` all
moved under `degraded-refusal`, so the diff was read before editing, not the pre-`0.61.0` files.

**No lease was taken and none is held.** Single acting worker, no director in the loop, and the
item is `blocked` — holding a lease across a blocking question would misrepresent live work.

**What the gates actually are.** Every rule is a **pure function over plain data** in
`scripts/lib/pack-plan.mjs`, so three callers execute *identical* code: the validator (live tree),
the `--gate` runner (live tree), and the self-test (mutated fixtures). A gate cannot pass in CI and
fail in the self-test, or vice versa, because there is only one implementation. Each gate fails by
an exact, greppable name.

| gate | what fails it |
|------|---------------|
| `partition` | an agent in no pack or two packs; a skill with no provider or two; an orphan skill without a ratified disposition; a `kai-core-*` name claimed by a department; a core-provided skill missing the prefix; a dispatching role missing an availability rule |
| `collision` | two packs generating the same agent id or providing the same skill id |
| `partial-install` | a cross-pack reference, asset, hook or guarantee block that a single-pack install would break |
| `version-skew` | the canonical block demanding a contract version that is not `CONTRACT_VERSION`, or the preflight arms not producing the exact `KAI-CORE-MISSING` token |

**Namespace safety is the point of the rename, not hygiene around it.** The accepted host semantics
are **first-found-wins / silent dedupe** for both agents and skills. A duplicate id therefore does
not error — it *shadows*, silently, and the loser never loads. `kai-core-*` is the only thing
standing between core's skills and a department (or a third-party pack) quietly capturing one.
`fleet-observation` was the single core-provided skill without the prefix, so it is the single
violation the new check finds — which is exactly why the item calls the rename forced.

**Two routed findings closed in the partition source rather than at their call sites.**
**P2-S1** (security, `preflight-compat`): the generated-agent pin was gated on
`/^kai-[a-z]+\/agents\//`, so a future pack key with a hyphen or a digit would silently escape the
guarantee — not a live fail-open, but a pin that stops covering what it claims. Replaced with
`parseGeneratedKey(key, packs)`, which matches against the **declared pack list** instead of a name
shape; a key that resolves to no known pack is now an error rather than a skip. **N2**: the
agent-reference pattern was a hand-maintained alternation that a new agent family would fall out
of; it is now derived from `AGENT_FAMILIES`. Both are covered by mutation arms using hyphenated and
digit-bearing pack keys, so the *coverage* is asserted, not assumed.

**A real hole closed on the way past:** `CONTRACT_SKILL` (`kai-core-contract-v1`) and
`CONTRACT_VERSION` (`'1'`) were independent literals — nothing tied the skill name to the version
it encodes. `contractPinErrors` now requires `skill.endsWith('-v' + version)`, so the next contract
bump cannot ship a v2 constant against a v1 skill and stay green.

**Decomposition Open Question 4 is answered, not deferred:** the director-availability membership
work **is** complete — `agents/director-chief-of-staff.agent.md` carries all three rules verbatim
(read at lines 195/209/211). It was unpinned, so an unrelated edit could have dropped one silently.
`availabilityErrors` now pins it. Criterion 4 is ticked on that reading, and the open question can
be closed by the steward.

**CHANGELOG history call (the steward left this to the acting role):** historical entries naming
`fleet-observation` are **left as history**. They record what shipped under that name, and
`validate-plugin.mjs` already excludes `CHANGELOG.md` from reference scanning, so no gate is weakened
by leaving them. Recorded in the `0.62.0` entry rather than silently.

**What is NOT done, and why the item is `blocked`:**

1. **Nothing was executed.** No `npm test`, no `--self-test`, no `--gate`, no `validate-plugin`, no
   `docs:generate`. The two "passes locally" / "green on the pushed PR" criteria stay **unticked**.
2. **The skill directory was not renamed.** The file tool cannot move or delete a path, and there is
   no shell. `skills/fleet-observation/SKILL.md` now declares `name: kai-core-fleet-observation`
   while sitting in the old directory, so **the tree is knowingly RED** — `loaderErrors`,
   `validate-plugin` and `generate-catalog` (which will look up `kai-core-fleet-observation` and get
   `undefined`) all fail until `git mv` runs. This is a stated consequence of the item's own
   "goes red until the rename lands", not an accident.
3. **No `change_ref` could be minted**, so no review was routed and `completed_reviews` stays `[]`.
4. Nothing was branched, committed, pushed, PR'd, merged, tagged, released or published.

**Milestone `dependency-guarantees` stays at 4 of 5 required items `shipped`.** Written code is not
a shipped item; `pack-split-generated-pack-trees` is **not** cleared and remains `proposed` at 4 of 6
met, outside `scope.current`. No dependent item record was edited.

### Independent architecture review — 2026-08-25-1725 (`principal-swe-architect`)

**Verdict: NOT RATIFIED — returned for two changes.** Lease `psa-2026-08-25-1720-pcg` released,
`in-review -> in-progress`, `next_role: principal-swe-infra`, `change_ref` reset to `null`,
`completed_reviews` stays `[]`. **The design is endorsed; the binding is not valid.** No
implementation or release file was edited by this review.

**A1 — blocking, binding. `de4fc3ad1d8f238323870ad4c2e19b2d1017d8dd` is not a commit in this
repository, and nothing is committed at all.** Read directly from `.git` (no shell this session):

| probe | reading |
|-------|---------|
| `.git/HEAD` | `ref: refs/heads/kai/feat/29-ci-partition-checks` |
| `.git/refs/heads/kai/feat/29-ci-partition-checks` | `16493a303c6532c8a7d0c78faf5c9027a5c9d998` |
| `.git/refs/heads/main` | `16493a303c6532c8a7d0c78faf5c9027a5c9d998` — **identical**, so the branch is still at its base |
| `.git/logs/refs/heads/kai/feat/29-ci-partition-checks` | exactly one entry: `0000… -> 16493a3… branch: Created from HEAD`. **No commit entry.** |
| `.git/logs/HEAD` | last entry is `checkout: moving from main to kai/feat/29-ci-partition-checks`. `de4fc3a…` appears **nowhere** in the reflog. |
| `.git/config` | `logallrefupdates = true` — the reflog is authoritative, a commit could not have gone unlogged |
| `.git/logs/refs/` | `heads`, `remotes` only — **no stash log**, so the object was not minted by `git stash` |
| `.git/` | **no `worktrees/` directory** — not committed in a linked worktree |
| `.git/COMMIT_EDITMSG` | still the *previous* item's message, `docs: record degraded refusal release` |
| `.git/objects/de/4fc3ad1d8f…` | **exists as a loose object** |
| `.git/index` | contains `kai-core-fleet-observation` — the `git mv` **was staged** |

The object is real but unreachable from any ref and was never produced by a commit — consistent
with a **blob written by `git mv` / `git add`**, not a commit SHA. Consequences: the implementation
is uncommitted index/worktree state; the required `independent-architecture` review **cannot bind**;
and the operator's "implementation/release files unchanged since binding" cannot be checked, because
no baseline object exists to diff against. A future `git commit` will mint a **different** SHA, so
`de4fc3a…` can never become this item's `change_ref` — hence the reset to `null` rather than
leaving a ref that would silently fail the ship gate's exact-match rule.

**A2 — required, minimal. The shipped host-semantics claim contradicts this initiative's own
`[observed]` finding, and it has reached user-facing release docs.** Eleven code sites plus the
README `## Status` block and the dated `0.62.0` CHANGELOG entry state that *"the host keeps the
first copy of a duplicated id it finds and drops the rest silently"* / *"install order decides
which answers"*. The ratified partition-lock artifact §6.1 `[observed]` and the empirical spike in
`docs/proposals/pack-architecture.md` say the opposite:

- **Finding 6** — two plugins providing the same skill name: *"**Both are exposed,
  namespace-qualified** (`alpha:probe-skill`, `beta:probe-skill`). **Not silent, not arbitrary.**"*
- **Finding 5** — agents *are* namespaced (`provider:provider-agent`), so the handoff's
  "first-found-wins / silent dedupe **for both agents and skills**" is contradicted on both halves.

Sites: `scripts/lib/pack-plan.mjs:28`, `:906-907`, `:955`, `:963`, `:970`, `:978-979`;
`scripts/validate-plugin.mjs:487`; `scripts/pack-preview.mjs:733`, `:780`, `:906`;
`README.md:44-46`; `CHANGELOG.md:21-23`.

**The gates are correct; only their stated reason is wrong** — no gate logic, no mutation arm and no
part of the rename changes. It is returned rather than waived for three forces:

1. **Evolvability.** These strings are the explanation an engineer reads at the moment a gate fires.
   "Install order decides" invites the conclusion that a deterministic install order is an equivalent
   mitigation — which is a live argument for weakening or deleting the namespace gate this item
   exists to add.
2. **Duplicate truth, in the item that exists to collapse it.** A5 removed the second roster; this
   introduces a second, contradictory statement of host resolution semantics, and nothing pins the
   prose to the artifact.
3. **An unverified claim published as observation.** What an *unqualified* `**Inherits:** <name>`
   resolves to when two plugins expose the same skill name was **never measured** by the spike.
   Finding 6 establishes only that both are exposed and qualified. Asserting a specific
   first-found-wins resolution is exactly the kind of inference the initiative's `[observed]`
   discipline exists to prevent — and it is now in the CHANGELOG as fact.

Minimal fix: reword the eleven strings and the two doc passages to the observed semantic plus the
honest unknown. **The rename and the prefix rule stand unchanged and remain correctly justified** —
partition-lock §6.1 already prescribes a distinct name as the defence, which is precisely what
`namespaceErrors` enforces.

**A3 — non-blocking, record correction.** The 1705 handoff claims a generated key resolving to no
known pack "is now an **error**, not a skip". In code it is a **skip**: `parseGeneratedKey` returns
`null` and every consumer (`packProviders`, `guaranteeBlockErrors`, and the hooks-claimant filters
in both `pack-preview.mjs` and `validate-plugin.mjs`) does `continue`/`filter`. The self-test arm at
`pack-preview.mjs:797` describes the real behaviour accurately ("resolves to nothing rather than to
a guess"), so code and test agree — only the record overstates. Unreachable today, because
`materializePacks` derives every key from `PACK_ORDER`. Residual, worth a named trigger rather than
a fix now: if emission ever diverges from the declared pack list, the guarantee gates go **silent**
rather than red — the same shape as the P2-S1 bug just closed, one level up. **Deferred** (cheap to
reverse, no force today); correct the claim, and reopen if a pack key is ever emitted from anything
other than `PACK_ORDER`.

**Endorsed, and verified in the working tree (read, not executed):**

- **One canonical partition.** `PACK_AGENTS` and `planSkills` are gone from *all* script code —
  remaining hits are records and CHANGELOG prose only. `build()` is a selection over
  `buildAll({packs:[pack]})`; the four legacy checks read one hoisted `planPacks()`. **A5 closed.**
- **The core structural call is right.** Six pure functions over plain data, three callers — the
  validator (live tree), the `--gate` runner (live tree), the self-test (mutated fixtures). A gate
  genuinely cannot be green in CI and red in the self-test, because there is one implementation.
  This is the smallest shape that resolves the force, and it is the right seam.
- **Four real named CI steps** at `validate.yml:48-55`, each independently failing and separately
  named, with `--check` retained and `npm test` running `--gate all`.
- **P2-S1 genuinely closed.** `parseGeneratedKey` resolves against the declared pack list, not a
  name shape; arms cover a hyphenated (`kai-fleet-ops`) and a digit-bearing (`kai-team2`) key, and a
  hyphenated pack is held to the guarantee-block check rather than skipped.
- **Namespace scope is correct, not a gap.** Skills-only is the right boundary *because* Finding 5
  namespaces agents by provider while Finding 6 leaves skill names flat. Enforced in both directions.
- **N2 closed.** One exported `AGENT_FAMILIES`; `agentShapedPattern`/`agentRefPattern` derived, with
  fresh instances so a shared `lastIndex` cannot skip matches. A live arm asserts every shipped
  agent id matches.
- **Contract coupling.** `contractPinErrors` ties `CONTRACT_SKILL` to `CONTRACT_VERSION` via
  `endsWith('-v' + version)` — a real hole, properly closed, with its own mutation arm.
- **Availability by membership** over `DISPATCHING_ROLES` / `AVAILABILITY_RULES`, with a per-rule
  strip arm. Open Question 4 is answerable on this reading.
- **Mutation coverage is real.** Every gate is proven by a mutation asserting on specific message
  text; no arm settles for `length > 0`.
- **The rename is complete and minimal.** Partition map, `SKILL_OWNER_OVERRIDES`,
  `generate-catalog.mjs` CATEGORIES, `inventory.json` (both lists, correctly re-sorted at `:78-95`
  and `:143`), four docs + README, and the directory move staged in the index. Surviving bare
  `fleet-observation` tokens are historical CHANGELOG (excluded from the reference scan — the call
  is recorded, and it is the right one), coordination records, and one deliberate mutation fixture
  at `pack-preview.mjs:764`. Orphan skill, so no `**Inherits:**` line changed; counts hold at 56/51.
- **Release metadata coherent.** `0.62.0` in `plugin.json`, `package.json`, `package-lock.json` ×2,
  `.github/plugin/marketplace.json` ×2, the dated `## [0.62.0] - 2026-08-25` section, its compare
  link (`CHANGELOG.md:2769`) and the README `## Status` stamp.
- **Invariants hold.** `COMMITTED_PACKS = []`, no `packs/` tree, marketplace still exactly one entry.

**Acceptance boxes were deliberately not ticked by this review.** The operator's reported results
(133 self-test checks, four gates clean, `--check` clean, 56/51 twice, `npm test` exit 0) are
credible and consistent with the code read, but this session executed nothing, and criterion 6
("green on the **pushed PR**") cannot be met while nothing is pushed. Ticking belongs to the owner
and the ship gate, on their own evidence.

**Not routed to `workflow-ship`.** A ship gate cannot run against an item with no commit and no
valid `change_ref`.

### QUESTION Q-pack-split-ci-partition-checks-01 2026-08-25-1705 — principal-swe-infra -> @operator

- status: answered 2026-08-25-1740 by `@operator` — **fully closed**. The directory move and the
  command run were done at 1720; the outstanding last clause (commit + supply the SHA) landed at
  1740 as real commit `aca16e56d3d70cf6bac5181a41c3d4a87055dccc` on
  `kai/feat/29-ci-partition-checks` (reflog-verified at the 1745 re-review). Nothing is owed here;
  the remaining push/PR/CI work belongs to the ship path, not to this question.
- kind: action
- blocking: yes
- context: The implementation is complete and unverified. This session has **no shell**, so the
  skill directory could not be moved, nothing could be run, and no commit exists to mint a
  `change_ref` from. Without a ref the required `independent-architecture` review cannot bind, so the
  item cannot honestly leave `blocked`. The tree is **RED until step 2** — that is expected and
  stated, not a regression.
- ask: Run, in order — `git checkout -b kai/feat/29-ci-partition-checks`;
  `git mv skills/fleet-observation skills/kai-core-fleet-observation`;
  `node scripts/pack-preview.mjs --self-test`; `node scripts/pack-preview.mjs --gate all`;
  `node scripts/pack-preview.mjs --check`; `node scripts/validate-plugin.mjs`;
  `npm run docs:generate` (expect no diff beyond the renamed row); `npm run host-contract`;
  `npm test`. Return the exact output of each, then commit and supply the resulting SHA as
  `change_ref` so `principal-swe-architect` can be routed.
- answer_by: next-dispatch

## Independent architecture re-review — 2026-08-25-1745 (ratification)

**Verdict: RATIFIED at `change_ref aca16e56d3d70cf6bac5181a41c3d4a87055dccc`.** Item **v7 -> v8**,
state stays `in-review`, lease `psa-2026-08-25-1740-pcg` cleared, `next_role:
principal-swe-architect -> workflow-ship`, and `completed_reviews` now carries
`principal-swe-architect` / `independent-architecture` / `ratified` at this exact ref — so the
item's single review requirement is satisfied **for this ref only**; if the ref moves, the entry
stops counting and the review must re-bind. Scope was the three returned findings plus a
re-read of everything endorsed at 1725. **No design change was requested in any round** — the seam
was endorsed then and is unchanged now. No implementation or release file was edited by this review.

**A1 — CLOSED. The ref is a real commit, and it is the branch tip.** Read straight from `.git`
(this session also had **no shell**):

| probe | reading |
|-------|---------|
| `.git/HEAD` | `ref: refs/heads/kai/feat/29-ci-partition-checks` |
| `.git/refs/heads/kai/feat/29-ci-partition-checks` | `aca16e56d3d70cf6bac5181a41c3d4a87055dccc` |
| `.git/logs/refs/heads/kai/feat/29-ci-partition-checks` | second entry: `16493a303c… -> aca16e56d3… commit: feat: enforce pack partition gates` |
| `.git/logs/HEAD` | same transition, last entry in the log; the 1725 blob `de4fc3ad…` still appears nowhere |
| `.git/refs/heads/main` | `16493a303c…` — the commit's parent, so the branch is exactly one commit ahead of `main` |
| `.git/COMMIT_EDITMSG` | now `feat: enforce pack partition gates` (was the previous item's message at 1725) |

The binding defect is gone: a commit object exists, it is reachable from a ref, and
`logallrefupdates = true` makes the reflog authoritative about how it was minted.
**`refs/remotes/origin/` carries `main`, `kai/feat/29-degraded-refusal`,
`kai/docs/29-degraded-refusal-shipped` and `kai/docs/29-crosspack-shipped` — and no entry for this
branch, in `packed-refs` either.** The commit is **local only**: nothing is pushed, there is no PR,
and acceptance criterion 6 ("green on the pushed PR") is therefore **still unmet**. That is the ship
path's work, not a review defect.

**A2 — CLOSED. Every cited site now states the observed truth, and the gate logic is byte-unchanged
in behaviour.** The old "the host keeps the first copy … and drops the rest silently" /
"install order decides" claim is gone from the live tree — a repository-wide scan for
`first-found|first copy|install order|drops the rest` returns no host-semantics assertion anywhere
in `scripts/`, `README.md`, `CHANGELOG.md` or `docs/` (the surviving hits are unrelated uses of
"silently", plus the `[observed]` findings themselves). Site by site:

| site | now reads |
|------|-----------|
| `scripts/lib/pack-plan.mjs:27-29` | "Hosts have exposed duplicate plugin names differently, so an unqualified duplicate is not a stable provider contract. A prefix core alone may use removes that ambiguity" |
| `scripts/lib/pack-plan.mjs:904` | "duplicate providers make resolution **host-dependent instead of partition-defined**" |
| `scripts/lib/pack-plan.mjs:952` / `:959` | "a legacy `kai` install provides that same bare name, so provider ownership is ambiguous" / "the name promises core shipped it, so another provider makes ownership ambiguous" |
| `scripts/lib/pack-plan.mjs:970-974` | "Duplicate-provider behavior differs by host and namespace surface, so the partition must decide ownership before installation" |
| `scripts/validate-plugin.mjs:485-488` | "an agent or skill in two packs has ambiguous provider ownership, and a core-provided skill without the `kai-core-*` prefix collides with the legacy monolith" |
| `scripts/pack-preview.mjs:740` / `:780` / `:909-911` | "provider ownership is ambiguous" / "would be ambiguous" / "Duplicate-provider behavior differs by host and namespace surface" |
| `README.md:44-47` | "because duplicate plugin names are not a stable provider contract across host and namespace surfaces" |
| `CHANGELOG.md:21-24` | "Duplicate plugin names are not a stable provider contract across host and namespace surfaces, so core ownership is explicit instead of host-dependent" |

All three forces behind the return are answered. **(1) The wrong inference is gone** — nothing now
argues that a deterministic install order is an equivalent mitigation, because no text claims order
decides anything. **(2) The duplicate truth is collapsed** — the shipped prose no longer contradicts
partition-lock §6 or `pack-architecture.md` Findings 5/6; the replacement justification is the one
the ratified artifact already gives ("a legacy `kai` install provides that same bare name"), which
is `docs/proposals/pack-architecture.md` §"Legacy collision" verbatim in substance. **(3) The
unmeasured mechanism is no longer published as fact** — the claim is now the *absence* of a
guarantee, not a specific resolution rule. **The rename rationale is not weakened; it is stronger** —
the legacy-monolith collision is a concrete, documented case rather than an inferred host behaviour.
**No gate logic, mutation arm, message-name assertion or part of the rename changed**: the arms
still assert on message text (`/rename it to `kai-core-fleet-observation`/`,
``/skill `kai-core-shared` is provided by both kai-core and kai-personal/``), which the rewording
left intact because it only touched the tails.

**A3 — CLOSED, and closed harder than the finding asked.** The return only required correcting the
record; the fix makes the code match the stronger claim instead. `guaranteeBlockErrors`
(`scripts/lib/pack-plan.mjs:1069-1074`) now fails any key `parseGeneratedKey` cannot resolve —
`belongs to no declared pack — generated files must not escape guarantee validation` — before the
`kind !== 'agent'` skip, so a generated file outside the declared partition can no longer travel
past the preflight and refusal checks in silence. Proven by a named mutation arm at
`scripts/pack-preview.mjs:833-835`
("a generated file outside the declared partition fails instead of skipping the guarantees"), and
unreachable on the authoritative path today because `materializePacks` builds every key from the
same `packs` list the check resolves against — so it is a fail-closed guard, not a live failure, and
it cannot false-positive against today's tree. The reported **133 -> 134** self-test count matches
exactly one added arm.

**Residual, named not fixed (N5).** `parseGeneratedKey` still returns `null` for an unknown pack,
and the other consumers — `packProviders` (`pack-plan.mjs:632`) and the hooks-claimant filters in
`pack-preview.mjs:931-934` / `validate-plugin.mjs` — still `continue`/`filter` on it. The
fail-closed property is therefore inconsistent across consumers. It is not worth a fix today: any
divergent key trips the guarantee gate loudly in the same CI run (`--gate partial-install`), so the
build cannot be green while the collision gate under-reports. **Trigger to reopen:** the first time
a generated key is emitted from anything other than the declared pack list, or the first time
`guaranteeBlockErrors` stops running in the same run as `packProviders`.

**Prior endorsed architecture — re-read and unchanged at this ref.**

```text
                    scripts/lib/pack-plan.mjs  — ONE rule set, pure over plain data
   partitionErrors · namespaceErrors · providerCollisionErrors
   contractPinErrors · availabilityErrors · guaranteeBlockErrors
                                  |
        +-------------------------+--------------------------+
        |                         |                          |
  validate-plugin.mjs      pack-preview --gate         pack-preview --self-test
  (live tree, npm test)    (4 named CI steps)          (mutated fixtures, 134)
        |                         |                          |
        +------------ same functions, so a gate cannot be ----+
                      green in CI and red in its own proof

  guaranteeBlockErrors(files, packs)          <- A3 landed here
      key -> parseGeneratedKey(key, packs)
              |                  |
           resolves          no pack  --> ERROR "belongs to no declared pack"   (was: skip)
```

- **A5 stays closed by deletion** — `PACK_AGENTS` and `planSkills` appear nowhere in `scripts/`.
- **Four named CI steps** remain in `.github/workflows/validate.yml`, one per gate, plus `--check`;
  `npm test` still runs `--self-test`, `--gate all` and `--check`.
- **P2-S1 / N2 closures intact** — resolution against the declared pack list with hyphenated
  (`kai-fleet-ops`) and digit-bearing (`kai-team2`) arms; `AGENT_FAMILIES`-derived patterns.
- **Contract coupling intact** — `contractPinErrors` still ties `CONTRACT_SKILL` to
  `CONTRACT_VERSION` via `endsWith('-v' + version)`.
- **Availability by membership** over `DISPATCHING_ROLES` / `AVAILABILITY_RULES`, unchanged.
- **Rename complete on disk** — `skills/kai-core-fleet-observation/SKILL.md` exists,
  `skills/fleet-observation/` is gone, counts hold at **56 agents / 51 skills**. The only surviving
  bare tokens are the README sentence that names the old name to explain the rename, the deliberate
  mutation fixture at `pack-preview.mjs:764`, and historical CHANGELOG entries (excluded from the
  reference scan by an already-recorded call).
- **Release metadata coherent at `0.62.0`** across `plugin.json`, `package.json`,
  `package-lock.json` ×2, `.github/plugin/marketplace.json` ×2, the dated `## [0.62.0] - 2026-08-25`
  section and its compare link (`CHANGELOG.md:2768`), plus the README `## Status` stamp.
- **Invariants hold** — `COMMITTED_PACKS = []`, **no `packs/` tree**, marketplace still exactly one
  entry (`kai` at `source: "."`), no new tool grant, no new file, no new CI step, no new capability.

**Non-blocking, recorded not returned.**

- **N4 — one adjective still outruns the evidence.** `pack-plan.mjs:27` says *"Hosts have exposed
  duplicate plugin names differently"*; the measured corpus is **one** host (Findings 5/6) plus the
  **open** question at `docs/proposals/pack-architecture.md:278` ("does skill collision behaviour
  hold across install order, marketplace vs direct install?"). The honest form is that duplicate
  exposure is not a guaranteed contract and has been measured on one host only. Not returned: it
  asserts the *absence* of a guarantee rather than a resolution rule, it is a source comment rather
  than user-facing release prose, and the inference that caused A2 is gone. Fix it in passing, not
  in a round trip.
- **N6 — the Evidence table's CI step names are stale.** It lists
  `Partition gate (completeness, uniqueness, namespace)` etc.; `validate.yml:47-55` now reads
  `Partition gate (one pack per agent, one provider per skill, kai-core-* namespace)`,
  `Collision gate (no id emitted by two packs)`,
  `Partial-install gate (a department installed with kai-core alone)`,
  `Version-skew gate (contract pins agree; absent or skewed core fails closed)`. Four named steps,
  same four gates — record drift only.

**Attestation boundary.** This session had **no shell**: nothing was executed and no diff was
computed. The review is a read of the **worktree**, and byte-identity between the worktree and
commit `aca16e56d3…` for all implementation and release files is **operator-attested**, as is the
reported result set (134 self-test checks, four gates clean, `validate-plugin` 56/51, full
`npm test` pass). Those results are **input, not verdict** — the ratification rests on the code and
the `.git` reads above.

**Acceptance boxes were deliberately not ticked by this review.** Criterion 3's blocker is gone (the
directory move landed), criterion 5 is operator-attested, and **criterion 6 is unmet — nothing is
pushed and no PR exists**. Ticking belongs to the owner and to the ship gate, on their own evidence.

**Milestone `dependency-guarantees` stays at 4 of 5 required items `shipped`.** A ratified review is
not a shipped item, so `pack-split-generated-pack-trees` is **not** cleared. Nothing was committed,
pushed, merged, tagged, released or published here.

## DoD gate — 2026-08-25-1750 (`workflow-ship`, PREPARE): **RELEASE-READY**

**Verdict: RELEASE-READY — all six dimensions Clear, none Gap.** Item **v8 -> v9**,
`in-review -> release-ready`, `lease: null`, `resume_state: null`, `next_role: workflow-ship ->
"@operator"`, `change_ref` **unchanged** at `aca16e56d3d70cf6bac5181a41c3d4a87055dccc`. Acceptance
criteria **3, 5 and 6 ticked here**, which is exactly where the 1745 re-review left them. Ship
record: `kai/library/releases/2026-08-25/04-ship-pack-split-ci-partition-checks/ship-record.md`
(promoted to its canonical path before merge). **Timestamp note:** wall clock at this run is 2026-08-25 17:31 local
(2026-08-26T00:31Z); the label is `1750` so the append-only record stays ordered behind the `1745`
ratification, whose labels had already drifted ahead of the clock.

**It is NOT shipped.** kai pushed nothing, merged nothing, tagged nothing, released nothing,
published nothing and deployed nothing. Every deploy step belongs to the operator.

**The one criterion only CI could close is closed — and it was read, not accepted on report.** The
1745 review predicted a hold on criterion 6 because nothing was pushed. Since then the operator
pushed `kai/feat/29-ci-partition-checks` and opened **PR #160** (`state: open`, head
`63f6da167f1ead58bc63dd5ef8e9c5f52ad1869b`, exactly two commits). Check run `contract`
**`98018029769`** (run **`32915426171`**, `workflow_name: validate`, `run_attempt: 1`) is
`status: completed`, **`conclusion: success`**, 00:31:27Z -> 00:31:45Z (**18s**) at that exact head,
with `check-runs total_count: 1` so nothing red hides behind it. **The four gates were verified as
individual steps, not inferred from a green tick:** step 9 `Partition gate (one pack per agent, one
provider per skill, kai-core-* namespace)`, step 10 `Collision gate (no id emitted by two packs)`,
step 11 `Partial-install gate (a department installed with kai-core alone)`, step 12 `Version-skew
gate (contract pins agree; absent or skewed core fails closed)` — each `success`, and each name
matching `.github/workflows/validate.yml:47-55` byte-for-byte, which is direct proof that **the
pushed workflow is the reviewed workflow**. Also green on the same run: `Validate plugin contract`,
`Pack generator self-test`, `Committed pack trees match the generator`, `Check helper script syntax`
and the `pull_request`-only `Release-guard (--base --head)` — twelve substantive steps, all
`success`. **N6 is corrected by this entry:** the Evidence table above still lists the pre-fix step
names; the four names in this paragraph are the live ones.

**The review still binds although the head moved, and that was checked rather than assumed.**
`change_ref` is `aca16e56…`; the PR head is one commit past it. That commit (`63f6da16…`,
`docs: record partition gate review`) has `aca16e56…` as its **parent**, and its **complete** diff —
read from GitHub — is three files, **all under `kai/coordination/`**: `ACTIVE.md` (+64),
`BOARD.md`, and this item (+182/-9). The diff *begins* at `kai/coordination/ACTIVE.md`, so nothing
under `.github/`, `CHANGELOG.md`, `README.md` or `docs/` precedes it, and *terminates* inside this
item file, so nothing under `package*.json`, `plugin.json`, `scripts/`, `skills/` or `test/` follows
it. **Every implementation and release file at the PR head is therefore byte-identical to the
ratified object.** `change_ref` stays where it is: it moves only when the implementation moves.

**Scope was derived from git objects, not asserted.** Comparing the *complete* root trees
(`truncated: false` on both) of base `16493a303c…` and head `63f6da16…`, the moved top-level
entries are exactly `.github`, `CHANGELOG.md`, `README.md`, `docs`, `kai`, `package-lock.json`,
`package.json`, `plugin.json`, `scripts`, `skills`, `test` — every one declared in `touches` or a
`kai/` coordination record. **`agents` is byte-identical on both sides
(`c0284f31c7cd221cc2f31712f98148482c5ac49a`)**, which proves in one reading that no agent body
changed, **no new tool grant** was added and no `**Inherits:**` line moved; so are `examples`,
`hooks.json`, `.kai`, `AGENTS.md`, `LICENSE` and the dotfiles. **`packs` is absent from both root
trees** — proven positively from the listings (it would sort between `package.json` and
`plugin.json`), not from a local glob. `COMMITTED_PACKS = []` at `pack-plan.mjs:122`, marketplace
still **exactly one** entry at `source: "."`, `0.62.0` coherent across all eight release locations,
groundwork still on `0.x`.

**Two sub-gates waived, with reasons, not skipped.** `principal-qa-ui` did not run and no UX walk
was performed, and the **product-design step is not implicated** — both on the northstar's own
recorded line that this is "a developer-facing packaging change with no user-facing interaction
surface". The rename *is* user-visible and is handled as blast radius, not as a design surface.

**The one user-visible consequence, named rather than waved past.**
`kai-core-fleet-observation` is `user-invocable: true`, updates reach users through
`/plugin update kai` or a new session, and **no alias ships for the old name** — anyone invoking
`fleet-observation` gets nothing after updating. Not treated as a Gap: the prefix is an initiative
non-negotiable, 22 core skills were already renamed the same way, this is the single remaining
violation the new check finds, and the break is recorded in the `0.62.0` CHANGELOG and the README
`## Status`. It is converted into a **release-note constraint** (deploy step 6 must state the
breaking rename) and parked as **PROPOSAL S1** for the steward to set policy for the remaining
renames.

**Rollout and rollback, right-sized.** Big-bang is justified — a build-time CI gate has no runtime
path, no cohort and no data — so a flag, canary, ring and runbook were **not invented**. The stated
risk is that these gates fail the build for the *whole repository*, so a false positive blocks every
PR; what makes that acceptable is one implementation shared by three callers, 134 mutation arms
asserting on specific message text, and a green run against the live tree before merge. Rollback is
`git revert -m 1 <merge-sha>` plus a `0.63.0` bump, and — if the tag is already cut — an **explicit**
deletion or supersession of `v0.62.0`, which is the one artefact a revert does not clean up.

**Nothing routed was dropped.** **N4** (a source comment claiming a wider host corpus than the one
measured) and **N5** (the fail-closed property inconsistent across `parseGeneratedKey`'s consumers,
with the reviewer's reopen trigger) are parked as PROPOSALs in
`kai/initiatives/pack-split/backlog.md` rather than fixed — fixing either means a new commit, a new
ref and re-binding the one review, which this gate will not spend a round trip on for a comment
adjective. **N6** is corrected in this entry.

**Milestone `dependency-guarantees` stays at 4 of 5 required items `shipped`** — `release-ready` is
not `shipped`. `pack-split-generated-pack-trees` is **not** cleared and stays `proposed` at 4 of 6
met, outside `scope.current`. Declaring the milestone met when this ships is the **steward's** call,
as is closing decomposition **Open Question 4**, which criterion 4 now answers.

## Ship — 2026-08-25-1751 (`workflow-ship`, CONFIRM-START + CONFIRM-COMPLETE): **SHIPPED**

**Verdict: SHIPPED. Production verification PASSED 9 of 9.** Item **v9 -> v12**, walking
`release-ready -> deploying -> production-verification -> shipped` on evidence at each step,
`lease: null`, `resume_state: null`, `next_role: "@operator" -> null`, `change_ref` **unchanged** at
`aca16e56d3d70cf6bac5181a41c3d4a87055dccc` — deployment moves state, not the reviewed ref.

**kai merged, pushed, tagged, released, published and deployed nothing.** Every action below was the
operator's; every fact below was **re-derived read-only** here against the merge commit, not
accepted on report. **Rollback was never invoked.** This session had **no shell** — all re-derivation
is `api.github.com` / `raw.githubusercontent.com` reads pinned at the merge SHA, plus `.git` ref
reads; nothing was executed.

### CONFIRM-START — deployment start evidence

PR **#160** is `state: closed`, **`merged: true`**, `merged_at` **2026-08-26T00:50:07Z**, merged by
`RubenSaucedo` into **`merge_commit_sha b72453f1ed46393e77722995212920b9f8615c79`** — a squash
(`commits: 3`, `changed_files: 26`, +2973/-229 collapsed to one commit whose parent is the branch's
own base `16493a303c…`, so **no rebase**). The `main` `validate` run **`32916653342`**
(`head_branch: main`, `run_attempt: 1`) started **00:50:12Z** at that exact `head_sha`. Local
`.git/refs/heads/main` reads `b72453f1…`, agreeing with the remote.

**The final PR head moved twice past the ratified ref, and that was checked rather than assumed.**
PREPARE bound `aca16e56…` and saw head `63f6da16…`; the operator then pushed the records commit, so
the merged head was **`1617c819487d19ffd284a30b9d1ad0e698e211fd`**. Rather than re-diffing commits,
the binding was proven at the object level below — which is stronger, because it tests **what is in
production**, not what a branch tip claimed.

### CONFIRM-COMPLETE — deployment completion evidence

Job `contract` **`98021655301`** (run **`32916653342`**, `workflow_name: validate`) is
`status: completed`, **`conclusion: success`**, **00:50:12Z -> 00:50:27Z (15s)** at
`head_sha b72453f1…`. **The four gates are individually `success` as named steps in the `main` run,
not inferred from a green tick:** step 9 `Partition gate (one pack per agent, one provider per
skill, kai-core-* namespace)`, step 10 `Collision gate (no id emitted by two packs)`, step 11
`Partial-install gate (a department installed with kai-core alone)`, step 12 `Version-skew gate
(contract pins agree; absent or skewed core fails closed)`. Also `success`: 4 `Validate plugin
contract`, 5 `Workspace-doctor self-test`, 6 `Host-loader acceptance`, 7 `Release-guard self-test`,
8 `Pack generator self-test`, 13 `Committed pack trees match the generator`, 14 `Check helper script
syntax` — **eleven substantive steps, every one green**, with step 15 `Release-guard (behavior change
requires a bump + release notes)` **`skipped`** because this is a push event, exactly as the ship
record predicted. `commits/b72453f1…/check-runs` is **`total_count: 1`**, so nothing red hides
behind the green one; its single `annotations_count: 1` is the pre-existing Node-20 runner
deprecation warning every run in this initiative carries.

### Production verification — 9 of 9

| # | check | result |
|---|-------|--------|
| 1 | deployment start | merge `b72453f1…` at 2026-08-26T00:50:07Z; `main` run `32916653342` started 00:50:12Z — **PASS** |
| 2 | completion, four gates green **in the `main` run** | job `98021655301` `success` 15s; steps 9–12 each `success` — **PASS** |
| 3 | `0.62.0` coherent across all eight release locations | `plugin.json`, `package.json`, `package-lock.json` ×2, `marketplace.json` ×2, README `## Status` (`v0.62.0` — 56 agents and 51 skills), `## [0.62.0] - 2026-08-25` + compare link `v0.61.0...v0.62.0` (`CHANGELOG.md:2768`), and tag `v0.61.0` (`e88857db…`) exists, so the link is **not dangling** — **PASS** |
| 4 | marketplace still exactly one entry | `plugins[]` length 1, `kai` at `source: "."` — **PASS** |
| 5 | `COMMITTED_PACKS` still `[]`, no `packs/` tree | read in production at `scripts/lib/pack-plan.mjs`; merge root tree `truncated: false`, 21 entries, **`packs` absent** where it would sort between `package.json` and `plugin.json` — **PASS** |
| 6 | the rename landed in production | `skills` subtree carries `kai-core-fleet-observation` and **no** `fleet-observation`; 51 skill directories; `SKILL_OWNER_OVERRIDES` maps `'kai-core-fleet-observation': 'core'` — **PASS** |
| 7 | `agents/` byte-identical to base | `c0284f31c7cd221cc2f31712f98148482c5ac49a` at base **and** at the merge — **PASS** |
| 8 | tag and release point at the merge | annotated tag object `cf91008b2d3530d124e13cc1cf3229c12243f2ed` (tagger 00:50:30Z) **peels to `b72453f1…`**; release `376800860`, `draft: false`, `prerelease: false`, published 00:50:33Z — **PASS** |
| 9 | `check-runs` on the merge SHA `total_count: 1` | one check, `success` — **PASS** |

**The strongest single reading, and it replaces an attestation with an object comparison.** The
merge commit's **complete** root tree (`truncated: false`) is **byte-identical to the ratified
`aca16e56…` on every top-level entry except `kai/`**:

| identical at `aca16e56…` and `b72453f1…` | differs |
|------------------------------------------|---------|
| `.env.example` `e39cc322`, `.gitattributes` `2aa1cd03`, `.github` `2034a566`, `.gitignore` `f2abfdaf`, `.kai` `62ab64a1`, `.nvmrc` `a45fd52c`, `AGENTS.md` `c9794bcd`, `CHANGELOG.md` `e2149cee`, `LICENSE` `1db1d317`, `README.md` `652ee436`, `agents` `c0284f31`, `docs` `2c5b302f`, `examples` `d29fd2f2`, `hooks.json` `a21df80f`, `package-lock.json` `4cdda0f8`, `package.json` `0a3bb8cd`, `plugin.json` `63ce31fa`, `scripts` `8996552b`, `skills` `d935bd32`, `test` `2e82a331` | `kai` `8baeb55b` -> `69e366c7` — coordination and library records only |

So **what is running in production is, byte-for-byte, what the architecture review ratified**;
the only divergence is the records tree, which carries no behaviour. The review binding survived
two head moves and a squash without needing anyone's word for it, and `change_ref` correctly stays
at `aca16e56…`. Against base `16493a303c…` the moved top-level entries are exactly the eleven
declared (`.github`, `CHANGELOG.md`, `README.md`, `docs`, `kai`, `package-lock.json`,
`package.json`, `plugin.json`, `scripts`, `skills`, `test`), with `agents`, `examples`,
`hooks.json`, `.kai`, `AGENTS.md`, `LICENSE` and the dotfiles untouched — **scope-true holds in
production, not just at the gate**.

**The release note was read in full and holds the recorded language constraints.** It states the
breaking rename explicitly — *"Renamed the user-invocable `fleet-observation` skill to
`kai-core-fleet-observation` … Update direct invocations to the new name"* — which was deploy step
6's binding condition and the mitigation for **PROPOSAL S1**. It states *"No generated pack tree is
committed or published; the marketplace remains the monolithic `kai` plugin."* It does **not** claim
any pack is generated, published or installable, does not claim the split is done, does not claim
partial-install or version-skew was measured on a real host, and **re-introduces none of the
host-resolution language A2 removed** — no "first-found-wins", no "the host keeps the first copy",
no "install order decides".

**Ship record promotion verified in production, so no post-ship reconciliation is owed.**
`kai/library/releases/2026-08-25/04-ship-pack-split-ci-partition-checks/ship-record.md` exists at the
merge commit (blob `291d839e…`) and the pre-promotion flat path no longer exists locally.

**Milestone: `dependency-guarantees` now has 5 of 5 required items `shipped`** —
`generator-gates`, `preflight-compat`, `crosspack-validator`, `degraded-refusal` and this item.
**That is a count, not a closure.** Declaring the milestone met, and closing decomposition **Open
Question 4** (which acceptance criterion 4 answers), are the **steward's** calls and are routed to
`principal-product-manager`, not taken here.

**Dependency reconciliation, truthfully.** `pack-split-generated-pack-trees` requires this item at
`shipped`, so that edge is now **satisfied** — it moves from 4 of 6 to **5 of 6** met. It stays
`proposed` and **non-dispatchable**: `pack-split-host-semantics-spike` is still not `completed`, and
it sits in `first-pack-extracted`, outside `scope.current`. No dependent item record was edited;
dependency satisfaction is derived at dispatch, never stored.

**Still open, and still owned:** **N4**, **N5** and **S1** remain PROPOSALs in
`kai/initiatives/pack-split/backlog.md`. Shipping closed none of them and deleted none of them.

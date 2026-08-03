# Changelog

All notable changes to the **kai** plugin are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Being pre-1.0,
minor bumps (`0.x`) carry features and patch bumps carry fixes.

## [0.20.0] - 2026-08-03

**QA runs are now date-first and canonical-path-enforced (#59).** QA / UX / SEO /
PM / persona / explore / stress artifacts sometimes landed in ephemeral Copilot
session-state instead of `.kai/runs/qa/`, and the run-folder name led with a
**model-generated `<target-slug>`** that drifted from run to run — so the same
surface scattered across sibling slug folders and runs were hard to find. The
`qa` area now anchors on the **date** (deterministic, never model-generated) with
a per-day sequential run index, and the canonical path is mandatory even when a
non-QA agent or a browser/stress harness (`OUT`) drives the run. No roster change
— still **54 agents and 38 skills**.

### Changed
- **QA run grammar → date-first (#59):** the `qa` area moves from
  `qa/<target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/` to
  `qa/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/`, where `<NN>` is a zero-padded,
  per-day sequential run index (next-free under today's folder) so runs sort in
  the order they ran, and `<descriptor>` (work-item/epic key when present, else a
  slug) is descriptive only — not the grouping key. Documented as the single
  exception to the target-slug-first grammar in `workspace-conventions`, and
  applied across `web-evaluation`, `principal-qa-ui`, `principal-seo`,
  `principal-product-manager`, `persona-ux-first-time-user`,
  `persona-professional-trainer`, `persona-professional-nutritionist`,
  `workflow-product-explore`, and `product-exploration`. Promotion mirrors the
  shape: `library/qa-findings/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/report.md`.

### Fixed
- **Canonical-path enforcement (#59):** QA/evaluation/stress output must resolve
  under `.kai/runs/qa/`; any harness `OUT` pointing at session-state, a temp dir,
  or the caller's cwd is rejected/rewritten — enforced **even when a non-QA agent
  orchestrates the run**.
- **Screenshot-policy contradiction:** `web-evaluation` said screenshots are
  "committed alongside reports," contradicting its own promotion rule and
  `workspace-conventions` (heavy binaries stay ignored even below `library/`).
  Resolved to the authoritative policy — screenshots are **local evidence, not
  committed**; promote the text and reference evidence by run path.

## [0.19.0] - 2026-08-03

**Document the Playwright MCP prerequisite for browser-driving agents (#40).**
Nine agents and five skills declare `tools: [..., playwright]` and drive a real
browser, but Install/Prerequisites never told you a **Playwright MCP server** must
be registered in your host — so on a fresh install every browser-driving agent was
silently inert. kai still ships no MCP servers; this documents the prerequisite and
adds a point-of-use reminder. No roster change — still **54 agents and 38 skills**.

### Added
- **README → "Browser automation setup (optional)" (#40):** an Install subsection
  listing the browser-driving agents/skills with a copy-paste `~/.copilot/mcp-config.json`
  `playwright` server block (key must be `playwright`), a `/mcp` verify step, and a
  note that the Copilot coding agent (cloud) has the Playwright MCP server enabled
  by default. Documentation-only; kai ships no MCP servers.
- **Point-of-use reminder (#40):** each of the nine browser-driving agents
  (`principal-qa-ui`, `persona-ux-first-time-user`, `persona-professional-trainer`,
  `persona-professional-nutritionist`, `principal-product-designer`,
  `principal-product-marketing`, `principal-seo`, `workflow-product-explore`,
  `workflow-course-to-audio`) and five skills (`web-evaluation`,
  `web-content-extraction`, `product-exploration`, `product-marketing-intelligence`,
  `ui-mockup`) now carries a one-line note that a `playwright` MCP server is required,
  pointing to the README subsection — surfaced only for the agents that need it.

## [0.18.0] - 2026-07-30

**Wire the house comment discipline into the code-writing agents (#39).** The
`coding-style` skill already encoded the right rule — no comments restating the
code, inline comments ≤1 line, doc blocks ≤2–3 lines — but **no agent inherited
it**, so it reached none of the agents that actually write code and they
over-commented (essay-length JSDoc rationale in source files). This wires the
skill into every code-writing agent and reinforces the rationale-goes-in-the-
artifact boundary. No roster change — still **54 agents and 38 skills**.

### Added
- **`coding-style` §4 (#39):** an explicit rule that design rationale and
  alternatives-considered (a single-pass-vs-second-pass tradeoff, why a
  dependency was or wasn't added) belong in the design/decision artifact or the
  PR/handoff description — **not** a multi-paragraph doc comment in a source
  file; a rationale comment states the non-obvious *why* in ≤1–2 lines.

### Changed
- **`principal-swe-backend`, `principal-swe-frontend`, `principal-swe-infra`,
  and `principal-ai-applied-engineer` now inherit `coding-style` (#39).** The
  three domain SWE builders and the applied-AI engineer that authors FE/BE code
  each gained the inherited-skill reference, so the comment discipline (and the
  rest of the house code style) is enforced where code is actually written.
  `principal-ai-applied-engineer`, which previously had no inherited-contract
  line, now carries one.

## [0.17.0] - 2026-07-30

**Default narration voice → `intermedio`.** The `generate-audio` wrapper now
defaults `-Voice` to **`intermedio`** (a less regionally-marked, international
Spanish read) instead of falling through to lectoria's `espana` default. Pass
`-Voice espana` or `-Voice latino` to override. No roster change — still
**54 agents and 38 skills**.

### Changed
- `scripts/generate-audio.ps1`: `-Voice` now defaults to `intermedio` (was
  unset → lectoria default `espana`).

## [0.16.0] - 2026-07-30

**Voice-preset tuning.** Refreshes the pinned `lectoria` to the release that
renames the default narration preset and retunes pacing. No roster change —
still **54 agents and 38 skills**.

### Changed
- Renamed the default voice preset **`emprendedor` → `espana`** (peninsular
  Castilian). The `generate-audio` `-Voice` set is now
  `espana | latino | intermedio`, and unset still uses lectoria's default
  (`espana`).
- Bumped the pinned `lectoria` git dependency to pick up the rename plus a
  faster **`latino`** preset (Mexican voices sped to +5%/+7% so they no longer
  feel slow next to `espana`).

## [0.15.0] - 2026-07-30

**Enforce release hygiene and dependency consistency in CI (#35).** The release
policy (bump `plugin.json` + `package.json`, add a dated changelog section,
refresh the README status stamp) was documented but CI only checked version
parity, so a behavior change could merge green with no bump, changelog, or README
update — and dependency metadata could drift (the lockfile had gone stale at a
different version and carried an unpinned view of the `lectoria` git dependency).
This wires the full policy into CI. No roster change — still **54 agents and 38
skills**.

### Added
- **Static release-hygiene checks in `validate-plugin.mjs` (#35)** (run by
  `npm test`, so they hold locally and in CI): semantic-version format; a dated
  `## [<version>]` CHANGELOG section **and** a `[<version>]:` reference link for
  the current version; a README `## Status` stamp that names the current
  `v<version>`; `package.json` ↔ `package-lock.json` agreement (declarations and
  root version); and a git-dependency allowlist that sanctions `lectoria` while
  rejecting any other git-sourced dependency or a git dep not pinned to a 40-hex
  commit SHA.
- **`scripts/release-guard.mjs` (#35)**: a CI gate that diffs a PR against its
  base and, when a behavior-sensitive path (`agents/`, `skills/`, `scripts/`,
  `plugin.json`, `package.json`, `package-lock.json`) changed, requires a version
  bump plus `CHANGELOG.md` and `README.md` updates. Docs/test-only changes are
  exempt. Its decision core is covered by a fixtureless `--self-test`.
- **`scripts/check-syntax.mjs` (#35)**: `node --check` on every shipped
  `.mjs`/`.js` helper and a PowerShell parse of `generate-audio.ps1` (skipped
  cleanly where `pwsh` is absent).
- The `validate` workflow now checks out full history (`fetch-depth: 0`) and runs
  the release-guard self-test, the syntax check, and the PR-only release-guard
  gate.

### Fixed
- Resynced `package-lock.json` (was stuck at an older version than
  `package.json`) and backfilled the missing `[0.12.0]`–`[0.14.0]` CHANGELOG
  reference links surfaced by the new checks.
- Regenerated the host-loader golden inventory snapshot
  (`test/fixtures/inventory.json`), which had gone stale when the
  `instructor-*` collection replaced the engineering teacher/tutor agents —
  `npm test` was red on `main` before this.

## [0.14.0] - 2026-07-29

**Voice presets for narrated audio.** Refreshes the pinned `lectoria` to the
release that adds named voice presets, and exposes them through the
`generate-audio` wrapper. No roster change — still **54 agents and 38 skills**.

### Added
- `scripts/generate-audio.ps1` gains a **`-Voice <preset>`** parameter
  (`emprendedor` | `latino` | `intermedio`) that selects the narrator voices +
  pace per language, passed through to `lectoria run --voice`.

### Changed
- Bumped the pinned `lectoria` git dependency to the voice-presets release. The
  default Spanish narration is now **`emprendedor`** — a warm, measured,
  peninsular-Castilian read (`es-ES-AlvaroNeural`) suited to study/learning
  content — instead of the previous single fixed voice. Run `lectoria voices`
  (at the plugin root) to list presets.

## [0.13.0] - 2026-07-29

**Lectoria wired for repo-local installs (no global install needed).** Makes the
`generate-audio` skill / instructor-* audio path work from a fresh plugin install.
No roster change — still **54 agents and 38 skills**.

### Changed
- Pin **`lectoria`** as a git dependency (`github:RubenSaucedo/lectoria`) in
  `package.json`, so a one-time `npm install` at the plugin root fetches and
  **builds** it — paired with lectoria's new `prepare` hook that compiles
  `dist/` on install. A global install is no longer required (still supported as
  a fallback).
- Fix `scripts/generate-audio.ps1` local-bin detection to work on macOS/Linux,
  not just Windows: it now checks both `node_modules/.bin/lectoria` (POSIX) and
  `lectoria.cmd` (Windows) before falling back to a global install.

### Added
- `.env.example` at the plugin root documenting the Azure Speech / OpenAI
  credentials the `generate-audio` wrapper loads from `.env`.

## [0.12.0] - 2026-07-29

Introduces the **`instructor-*` learning collection** — a subject-agnostic
teaching lane that replaces the engineering-scoped teacher/tutor. The roster is
now **54 agents and 38 skills**. Updates reach users via `/plugin update kai`.

### Added
- **`instructor-path-mentor`** — new agent that stewards a whole
  certification/learning path over time: plan, schedule against a target/exam
  date, per-objective progress, and spaced review, persisted in the workspace's
  gitignored `personal/learning/<slug>.md`. Dispatches `workflow-course-to-audio`
  (extract), `instructor-teacher` (package), and `instructor-tutor` (author a gap
  topic); never auto-runs paid audio. Executes a chosen path — career *strategy*
  (whether a cert is worth it) stays with `principal-engineer-career-mentor`.

### Changed
- **Generalized the learning agents into the `instructor-*` family.**
  `principal-engineer-tutor` → **`instructor-tutor`** (now authors concrete-first
  lessons on any subject — cert objectives, languages, finance, engineering/AI —
  not just engineering), and `principal-engineer-teacher` → **`instructor-teacher`**
  (subject-agnostic packaging of existing markdown). Pedagogy, Lectoria-friendly
  narration rules, and the audio-cost discipline are preserved.
- Retargeted every cross-reference (`principal-engineer-career-mentor`,
  `persona-self`, `principal-ai-researcher`, `generate-html-lesson`, README,
  AGENTS.md) to the new agent ids, and registered the `instructor-*` family in
  the AGENTS.md role taxonomy and personal-front-door routing.
- Extended `scripts/validate-plugin.mjs` cross-reference integrity to cover the
  `instructor-` prefix.

### Removed
- **BREAKING:** `principal-engineer-tutor` and `principal-engineer-teacher`
  agent ids — superseded by `instructor-tutor` and `instructor-teacher`. Update
  any direct invocations.

## [0.11.0] - 2026-07-29

**Coordination lifecycle + durable record schemas (#31).** Three contracts
disagreed on what `ready` meant — the steward promoted to `ready`, the director
dispatched from `ready`, and stewardship prose implied `ready` had to be
runnable — so a `ready` item with an undelivered-but-declared dependency looked
both dispatchable and not, producing non-deterministic dispatch and steward
re-promotion churn. This release fixes the contradiction (decision **A**) and
standardizes the records the lifecycle already relied on but never pinned down.
No roster change — still **53 agents and 38 skills**.

### Changed
- **`ready` means committed, not runnable (#31, decision A)**: `ready` is a
  steward commitment — scope fits, acceptance is defined, dependencies are
  *declared* — and no longer requires those dependencies to be complete. The
  director computes a derived **`executable`** predicate at dispatch (deps in
  their required state, lease-free, unblocked, touch-safe); `executable` is never
  stored on the item. A `ready` downstream item simply waits at the director; the
  steward never re-promotes it per upstream completion.
- **`change_ref` must be a git SHA (#31, decision A1)**: an item's `change_ref`
  must be a commit or PR-head SHA (7–40 hex) — the only reproducible-across-machines
  form — not a bespoke diff digest. Touch-set reconciliation derives the changed
  path set from `git show --name-only <change_ref>` plus reported untracked files.
  `workspace-doctor` now rejects a non-SHA `change_ref`.

### Added
- **RECOVERY record (#31)**: a parseable packet the grantor appends when it
  reclaims a stale lease — `reclaimed`, `stale_lease`, `observed`, `disposition`,
  `new_lease`, `state`, `next` — documenting the observed partial work and the
  fresh grant that invalidates the crashed run's token.
- **Design-waiver (WAIVER) record (#31)**: a durable structured record — `kind`,
  `grantor`, `reason`, `change_ref`, `scope`, `expires` — that replaces free-form
  design-step waivers, binds the waiver to an exact `change_ref`, and is
  referenced from the item's `completed_reviews`. Distinct from the
  definition-of-done "Waived-with-reason" release concept.
- **`director-summary` minimum scaffold (#31)**: the director summary now has a
  required section skeleton (Outcome, Milestones, Decisions, Deliverables,
  Open/deferred, What needs the operator).
- **Lifecycle fixtures (#31)**: the healthy fixture now includes a `ready`
  downstream item whose dependency is only `in-review` (proving `ready` ≠
  `executable` is healthy), the broken fixture exercises the non-SHA `change_ref`
  rejection, and the concurrency thread demonstrates the structured RECOVERY and
  WAIVER records.

## [0.10.0] - 2026-07-29

**Collision-safe lease acquisition (#30).** Coordination leases were
read-check-write-reread, which is not atomic in a markdown store: two parallel
peers could each read the same `version`, each write it back with a different
lease, and each re-read before the other's write landed — both then believed
they held the item. This release makes lease *granting* serial and lease
*holding* verifiable, and reconciles what an item actually changed against what
it claimed. No roster change — still **53 agents and 38 skills**.

### Added
- **Unique lease token bound to the item version (#30)**: the `lease` block gains
  `token` and `version_at_grant`. A held lease (non-null `holder`) must carry a
  unique grant `token` bound to the `version` it was issued against; the token
  travels in the dispatch packet and is the acting role's authority to write.
- **Verify-before-write + collision stop (#30)**: `work-coordination` requires an
  acting role to re-read and confirm its `holder`/`token`/`version` before every
  state-changing write, and to **stop before modifying product state** with a new
  `COLLISION` thread record if the grant was lost or overwritten. A re-grant
  writes a fresh token, so a resurrected stale peer fails verification and stops.
- **Concurrency fixture (#30)**: `test/fixtures/concurrency-workspace/` plus a
  `workspace-doctor` self-test case demonstrate collision detection (an
  un-tokened held lease is rejected) and stale-lease recovery (an expired but
  properly tokened lease is surfaced as a recovery signal, not silently
  reclaimed).

### Changed
- **Single-grantor protocol (#30)**: `director-chief-of-staff` is the sole lease
  grantor for a working tree — it reserves items **serially** (write lease +
  token, increment `version`, re-read to confirm) *before* launching any parallel
  peer, so two peers can never be granted the same item. `AGENTS.md` and the
  hard-rules reflect the serialized grant.
- **Touch-set reconciliation (#30)**: reconciliation now compares an item's
  **actual changed paths** (diff at `change_ref` / `git diff --name-only`)
  against its declared `touches` and reports unexplained expansion instead of
  trusting the declaration; overlap with another active item forces
  serialization.
- **Multi-machine scope made explicit (#30)**: serial granting is atomic only
  within one synchronized working tree; `work-coordination` documents the
  single-tree model and git conflict detection as the cross-tree backstop.
- **Doctor lease checks (#30)**: `workspace-doctor.mjs` now errors when a held
  lease lacks a `token` or an integer `version_at_grant`, alongside the existing
  expiry checks.

## [0.9.0] - 2026-07-28

Host-loader **acceptance** testing (#33). CI now proves not just that the source
is internally consistent, but that a Copilot host could actually *load* the
advertised inventory — and that malformed frontmatter is rejected before release,
closing the gap that let five skills ship with a shape the CLI silently drops
(#23). No roster change — still **53 agents and 38 skills**.

### Added
- **Host-loader acceptance mirror (#33)**: `scripts/host-contract.mjs` loads
  every agent/skill exactly as a host would and asserts the discoverable
  inventory — agent roster, skill roster, and the user-invocable skill surface
  (name + `argument-hint`) — matches a committed golden snapshot
  (`test/fixtures/inventory.json`), so a roster or invocation-surface change is
  explicit and reviewable in the PR. Run via `npm run host-contract`; regenerate
  the golden with `npm run host-contract:update`.
- **Malformed-frontmatter fixtures (#33)**: `test/fixtures/host-loader/invalid/`
  reproduces real load-time failure classes (the #23 `argument-hint`-as-array
  bug, a non-array `tools`, an unsupported tool, a skill-only key on an agent, a
  name/id mismatch); the mirror's `--self-test` asserts each is rejected for the
  expected reason. Wired into `.github/workflows/validate.yml` and `npm test`.
- **README quickstart drift guard (#33)**: the mirror asserts the README status
  stamp (`**N agents and M skills**`) equals the live loadable inventory and that
  every `npm run <script>` the README documents exists in `package.json`.

### Changed
- **Shared loader contract (#33)**: the host-loader parsing rules (frontmatter
  parse, tool allowlist, `argument-hint`/`user-invocable` shape, skill-only-key
  separation) moved to `scripts/lib/loader-contract.mjs`, imported by both
  `validate-plugin.mjs` and `host-contract.mjs` so the validator and the
  acceptance mirror can never drift.
- **Docs (#33)**: `test/README.md` documents the new host-loader acceptance layer
  and reframes the remaining live-host work as the #33 follow-up; README
  Contributing/release steps run `npm test` (all three guards).

## [0.8.0] - 2026-07-28

Workspace **schema versioning** and a dependency-light **workspace doctor**
(#27). A generated workspace now declares its contract version independently of
the plugin build, upgrades follow a deterministic migration ladder, and a
read-only validator gates whether coordinated agents may claim work — so a
workspace produced by an older plugin can no longer silently drift out of
contract. No roster change — still **53 agents and 38 skills**.

### Added
- **`schema_version` in the workspace manifest (#27)**: `.kai/manifest.json`
  carries a `schema_version` integer (currently `1`) separate from the plugin
  `version` stamp. `workspace-conventions` documents the version-vs-schema
  distinction and the post-update flow; the contract validator requires it in
  the manifest and fixture.
- **Schema-version migration ladder (#27)**: `workspace-onboarding` defines an
  append-only ladder (baseline `1`, `→ 1` from a pre-schema workspace) so each
  future contract change ships a discrete, idempotent migration step.
- **Claim-time schema gate (#27)**: `work-coordination` adds a step-0
  compatibility + doctor check to "Claiming work safely"; agents refuse to claim
  work in an incompatible or unmigrated workspace.
- **`scripts/workspace-doctor.mjs` (#27)**: a dependency-free (Node built-ins
  only) validator for a *consumer* workspace — manifest schema and
  `schema_version` compatibility (emitting the migration plan when behind), item
  `type`/`id`/lifecycle state, `change_ref`-bound review states, typed
  dependencies and cycle detection, lease shape/expiry, durable-path
  containment, and `BOARD.md` drift. Run via `npm run doctor` (`--root <dir>`,
  default cwd); errors block, warnings (stale lease, board drift) don't.
- **Doctor self-test in CI (#27)**: `npm run doctor:self-test`
  (`--self-test`) asserts committed golden fixtures — a healthy
  `test/fixtures/repo-workspace/` and a `test/fixtures/broken-workspace/` that
  must be rejected (pre-schema manifest, `in-review` item without `change_ref`,
  dangling dependency, machine-absolute `artifact_target`). Wired into
  `.github/workflows/validate.yml` and `npm test`.

### Changed
- **Contract validator (#27)**: the fixture-manifest check now requires an
  integer `schema_version`.
- **Docs (#27)**: README gains an "Upgrading a workspace after a plugin update"
  section and `test/README.md` separates deterministic (CI), host-backed
  (tracked in #33), and manual-only coverage.

## [0.7.1] - 2026-07-28

Audit remediation for the four P0 findings (#23, #24, #25, #26): the contract
validator now catches the frontmatter shape that the Copilot CLI rejects,
shipped scripts and prompts no longer hard-code an author's checkout, run-area
usage is enforced against the registry, and the README documents where CLI and
cloud hosts differ. No roster change — still **53 agents and 38 skills**.

### Fixed
- **`argument-hint` frontmatter (#23)**: five user-invocable skills
  (`coding-style`, `generate-audio`, `onboard-to-codebase`, `pr-sizing`,
  `research-before-coding`) declared `argument-hint` as an inline array, which
  the Copilot CLI silently rejects at load. They are now quoted scalars.
- **Author-machine paths (#24)**: `generate-audio.ps1`, `extract-learn-path.js`,
  and the six prompts that call them no longer embed `C:\src\kai\…` /
  `C:\src\ketzal-swe\…`. Prompts reference a portable `<kai-plugin>/scripts/…`
  path; the extractor now writes to the caller's `.kai/runs/learn/<slug>/<run>/`
  (not the retired `.ketzal-learn/`), defaults to Playwright's bundled Chromium
  (override via `LEARN_BROWSER_CHANNEL`), and drops the stale
  `npm run generate-audio` recommendation.

### Changed
- **Contract validator (#23, #26)**: the hand-rolled frontmatter parser now
  reads hyphenated keys (`argument-hint`, `user-invocable`, `allowed-tools`),
  rejects an array-shaped `argument-hint`, validates `user-invocable` as a
  boolean, separates agent vs. skill schemas (skill-only keys are invalid on an
  agent), and scans every agent/skill for concrete `.kai/runs/<area>/` literals,
  failing any area not in the manifest registry.
- **Self-check output (#26)**: `workflow-self-check` writes under the registered
  `review/` area (`.kai/runs/review/kai/<date>-self-check/report.md`) instead of
  the unregistered `.kai/runs/self-check/`.
- **Host-capability docs (#25)**: the README adds a CLI-vs-cloud capability
  matrix and stops implying feature parity; `web-evaluation` notes the
  localhost-reachability boundary and fails fast when the host can't reach the
  target.

## [0.7.0] - 2026-07-28

Kai's Enablement & Operations phase closes the remaining go-to-market and
operations gaps with seven roles spanning documentation, revenue operations,
demand generation, partnerships, localization, data engineering, and brand. The
roster now contains **53 agents and 38 skills**.

### Added
- **Technical-writer principal**: `principal-technical-writer` owns product and
  developer documentation — doc plans, how-tos, references, concept guides,
  release notes, and doc audits. Grounds every instruction in shipped behavior;
  routes product scope to the PM, ground truth to engineering, UX copy to the
  designer, and claims to marketing. Never invents a capability, ships an
  unverified instruction, or publishes without operator approval.
- **Revenue-operations principal**: `principal-revenue-operations` owns the SaaS
  metric model (MRR/ARR, churn, NRR, CAC, LTV, magic number), forecast
  operations, pipeline hygiene, billing operations, and comp/territory structure.
  Routes metric validity to analytics, price to pricing, per-deal to sales, and
  financial decisions to the operator; preserves analytics causal status. Never
  touches a live billing system or invents a metric result.
- **Demand-generation principal**: `principal-demand-generation` owns campaign
  strategy, campaign briefs, lifecycle/nurture email programs, channel mix, and
  lead-handoff (MQL/SQL) definitions. Inherits `content-grounding`; routes
  positioning and claims to marketing, PLG lifecycle to growth, channel content to
  the content agents, and measurement to analytics. Never fabricates leads or
  metrics, ships an unbacked claim, spends, or sends.
- **Partnerships principal**: `principal-partnerships` owns partner strategy,
  partner-fit assessment, integration-partnership design, channel/reseller
  programs, and co-sell/co-marketing framing. Routes customer deals to sales,
  feasibility to the solutions architect, economics to pricing/revops, and
  agreements to the operator and counsel. Never signs, commits revenue share,
  promises an unbuilt integration, or contacts a real partner.
- **Localization workflow**: `workflow-localization` runs a bounded i18n-readiness
  and locale-QA procedure — audits externalized strings, formatting,
  pluralization, RTL, and encoding; assesses locale readiness; routes translation
  to translators/services; and QAs a localized build. Never translates content,
  edits product code, or publishes a localized build.
- **Data-engineer principal**: `principal-data-engineer` owns data-pipeline and
  data-shape engineering — ingestion/ELT design, warehouse/lakehouse modeling,
  data contracts, event-instrumentation specs, and pipeline-layer data quality and
  lineage. Routes metric meaning to analytics, provisioning to infra, and
  PII/retention to privacy-compliance. Never pulls real production data or PII into
  the workspace, deploys a pipeline, or defines what a business metric means.
- **Brand-designer principal**: `principal-brand-designer` owns visual brand
  identity — logo/color/typography/iconography systems, brand guidelines, and
  visual-asset direction and critique. Grounds work in the app's design system,
  presents load-bearing directions as human-confirmable option boards, and routes
  interaction to the product designer and claims to marketing. Never implements
  UI, originates a product claim, or imitates a protected mark.

### Changed
- Added canonical initiative artifact lanes `docs/`, `revops/`, `campaigns/`,
  `partnerships/`, `localization/`, `data-engineering/`, and `brand/`, kept in
  parity across `workspace-conventions`, `workflow-initiative-init`, and
  `work-coordination`. Registered the new run-area flavors (`docs`, `localization`,
  `brand` under `product`; `data-eng` under `eng`; `revops`, `partnerships` under
  `revenue`; `demand-gen` under `content`).
- Extended the role taxonomy in `AGENTS.md`, `director-chief-of-staff`, and the
  README (status stamp, agent tables, trigger table) for the seven new roles, and
  added reciprocal seam bullets to `principal-data-analytics`,
  `principal-product-marketing`, `principal-pricing-monetization`,
  `principal-sales`, `principal-growth`, and `principal-product-designer`.

## [0.6.0] - 2026-07-27

Kai's Revenue phase adds pre-sale go-to-market judgment: deal execution and
technical solution fit. The roster now contains **46 agents and 38 skills**.

### Added
- **Sales principal**: `principal-sales` owns pre-sale deal qualification,
  discovery, deal strategy and competitive positioning, objection handling,
  proposal structure, forecast/pipeline hygiene, and win/loss synthesis. Applies
  approved pricing/discount policy and escalates exceptions; keeps prospect PII
  and deal terms local. Never fabricates pipeline, promises capability or dates,
  sets price, asserts technical fit, contacts real prospects, or accepts
  contracts.
- **Solutions-architect principal**: `principal-solutions-architect` owns
  pre-sale technical discovery, requirement-to-capability fit, integration
  feasibility, POC/pilot scope with exit criteria, technical objection handling,
  and security/compliance questionnaire drafts. Grounds fit in shipped capability;
  routes gaps to the PM and attestations to the security/privacy owners. Never
  invents capability, commits roadmap or dates, certifies compliance, prices,
  implements, or touches a customer's live systems or data.

### Changed
- Added a dedicated `revenue` run area (flavors `sales`, `solutions-architect`)
  and canonical initiative artifact lanes `sales/` and `solutions/`, keeping
  sensitive pre-sale deal and prospect data separate from post-sale `product` and
  technical `eng` work.
- Reciprocal routing updated across the Chief of Staff and AGENTS taxonomy:
  sales applies pricing's discount policy and escalates exceptions; the solutions
  architect routes questionnaire claims to security/privacy-compliance for
  confirmation and capability gaps to the PM; customer-success takes the post-sale
  handoff at close; and product-marketing supplies claim-safe positioning to both
  revenue roles.

## [0.5.0] - 2026-07-27

Kai's Expansion phase adds monetization, privacy/compliance, feedback synthesis,
and independent experiment-integrity review. The roster now contains **44 agents
and 38 skills**.

### Added
- **Pricing & monetization principal**: `principal-pricing-monetization` owns
  pricing models, packaging/tiering, price-change and migration design,
  discount/deal-desk policy, willingness-to-pay analysis, and monetization
  experiments. Preserves analytics causal status; never changes a live
  price/quote/billing system, drafts contracts, or uses deceptive or
  discriminatory pricing.
- **Privacy & compliance principal**: `principal-privacy-compliance` owns DPIAs,
  data inventories and lawful-basis maps, data-subject-rights process design,
  consent/retention/notice policy, framework-mapped reviews, and breach-obligation
  analysis. Not legal advice; never ingests real personal data, files, notifies,
  certifies, or accepts legal risk.
- **Customer-feedback synthesis workflow**: `workflow-customer-feedback` turns
  solicited feedback (surveys, NPS/CSAT, reviews, interviews, feature requests)
  into de-identified themes with grounded denominators and representativeness
  caveats, routed to product/CS/growth/pricing/marketing owners.
- **Experiment-integrity gate**: `workflow-experiment-review` independently
  certifies experiment design and readout integrity (pre-registration, power,
  SRM, exposure, peeking, multiplicity, guardrails, causal-status) against the
  exact analysis revision.

### Changed
- Reused the `product` and `eng` run areas with new `pricing`, `feedback`,
  `experiment-review`, and `compliance` flavors, and added canonical initiative
  lanes for pricing, feedback, experiments, and compliance.
- Registered `privacy-compliance` and `experiment-integrity` as revision-bound
  `review_requirements` in `definition-of-done`.
- Growth now routes pricing to the monetization owner and gates Scale decisions
  through experiment-integrity; security routes legal/compliance to the privacy
  owner; support-triage and customer-success route pricing and solicited feedback
  to their new owners; directors and AGENTS taxonomy reflect the new seams.

## [0.4.0] - 2026-07-27

Kai's Core SaaS operating team is complete. The roster now contains **40 agents
and 38 skills**.

### Added
- **Support triage workflow**: `workflow-support-triage` screens incident and
  security candidates first, classifies/deduplicates supplied tickets, assigns
  impact-based urgency, and routes each item without replying, resolving, or
  leaking account material.
- **Growth and decision analytics principals**: `principal-growth` owns bounded
  lifecycle hypotheses and readout recommendations;
  `principal-data-analytics` owns metric contracts, data quality, uncertainty,
  causal-status labels, supplied-data analysis, and instrumentation gaps.
- **Security, SRE, and incident command**: `principal-security` owns defensive
  threat/control judgment, `principal-sre` owns reliability/readiness evidence,
  and `workflow-incident-response` coordinates one SEV/timeline with real domain
  leads and human-executed action packets.

### Changed
- Added dedicated `support` and `incident` raw-run areas plus canonical
  initiative lanes for support, growth, analytics, security, reliability, and
  sanitized incident records.
- Director, PM, product/customer, engineering, QA, ship, DoD, and review
  contracts now preserve the new ownership seams and revision-bound
  security/SRE evidence.
- Active incident command may create a priority-zero knowledge item directly,
  but remediation and follow-up scope still follow normal stewardship and ship
  gates.

## [0.3.0] - 2026-07-24

Kai's SaaS operating team gains its first customer-operations principal. The
roster now contains **34 agents and 38 skills**.

### Added
- **Customer success principal**: `principal-customer-success` owns post-sale
  customer outcomes, success/adoption plans, evidence-based account health,
  churn/renewal risk, QBR/renewal briefs, and portfolio patterns. Account data is
  local by default; product gaps are de-identified and routed to the PM; pricing,
  contracts, promises, support resolution, and outbound communication remain
  outside the role.

### Changed
- The `product` run-area registry now includes the `customer-success` flavor,
  de-identified product signals have a canonical
  `artifacts/customer-success/<item-id>.md` target, and the PM/director routing
  contracts explicitly preserve the customer success -> product-scope boundary.
- The contract validator now prevents initiative artifact directories from
  drifting between workspace conventions and initiative scaffolding.

## [0.2.0] - 2026-07-23

First feature release since the initial scaffold. The roster grew to **33 agents
and 38 skills**, adding a product→content pipeline, CI safety nets, a richer
personal-assistant lane, and design tooling. Updates reach users via
`/plugin update kai` (or a new session) — the plugin loads from the repo, so no
version pin is required.

### Added
- **Design-system grounding + human-confirmable mockups** for
  `principal-product-designer`: the `design-grounding` and `ui-mockup` skills
  (offline HTML/ASCII option mockups behind an `ask_user` confirmation gate),
  the designer↔frontend seam, and a neutral design-system extraction mode for
  `workflow-product-explore`. (#20)
- **Proactive runtime contract**: the `proactive-scan` skill,
  `workflow-proactive-scan`, and an external-runner template — an honest
  two-phase scan/ack model (kai emits, your runner delivers). (#17)
- **Personal task lifecycle + privacy**: `personal-agenda` gains
  proposed/open/waiting/snoozed/done states with recurrence, dedup, and
  least-privilege field sharing. (#16)
- **Creative video director**: `principal-video-director` + `video-direction`,
  plus the shared `content-grounding` claim-safety contract. (#14)
- **LinkedIn content strategist**: `principal-linkedin-strategist` +
  `linkedin-content`. (#13)
- **Product marketing intelligence**: `principal-product-marketing` +
  `product-marketing-intelligence`, emitting a typed, grounded
  `product_context.json`. (#12)
- **Personal-assistant front door**: the executive-assistant lane — decision
  briefs, peer consultations, and a forward agenda. (#7)
- **Plugin contract tests**: `scripts/validate-plugin.mjs` gains a host-tool
  allowlist, contract-consistency drift detectors, and a fixture manifest, all
  run in CI. (#15)
- **Plugin contract validator** and the initial `npm run validate` structural
  check wired into CI. (#6)
- **Scope discipline**: the `scope-discipline` classify-before-adopt gate. (#5)

### Changed
- **Workspace migration completeness**: `workspace-onboarding` reconciles the
  manifest schema and names legacy destinations so old-architecture workspaces
  upgrade cleanly and idempotently. (#18)

### Removed
- Retired the multi-"pal" workspace model in favor of a single plugin that
  scaffolds its own workspace anywhere — including inside another repo.

## [0.1.0] - 2026-06-28

### Added
- Initial open-source release: the kai Copilot plugin scaffold — senior-engineer
  principals (frontend / backend / infra / architect / manager), reviewer
  personas and `review-*` lenses, a fan-out `workflow-doc-review`, learning and
  web-evaluation tracks, and the `workspace-conventions` + `workflow-workspace-init`
  workspace contract.

[0.20.0]: https://github.com/RubenSaucedo/kai/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/RubenSaucedo/kai/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/RubenSaucedo/kai/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/RubenSaucedo/kai/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/RubenSaucedo/kai/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/RubenSaucedo/kai/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/RubenSaucedo/kai/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/RubenSaucedo/kai/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/RubenSaucedo/kai/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/RubenSaucedo/kai/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/RubenSaucedo/kai/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/RubenSaucedo/kai/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/RubenSaucedo/kai/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/RubenSaucedo/kai/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/RubenSaucedo/kai/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/RubenSaucedo/kai/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/RubenSaucedo/kai/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/RubenSaucedo/kai/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/RubenSaucedo/kai/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/RubenSaucedo/kai/releases/tag/v0.2.0
[0.1.0]: https://github.com/RubenSaucedo/kai/commit/d85cf51

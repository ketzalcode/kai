# Changelog

All notable changes to the **kai** plugin are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Being pre-1.0,
minor bumps (`0.x`) carry features and patch bumps carry fixes.

## [0.37.0] - 2026-08-11

### Added

- **`no-self-remediation`**, the directional write contract for roles that
  assess without acting. An assessor may write its own evidence, report, and
  findings; it must not mutate the target under review. Mutation is defined
  broadly on purpose — creating, shadowing, deleting, renaming, patching,
  formatting, or generating a file inside the reviewed target all count, because
  a new auto-discovered file can make a finding stop reproducing without
  changing one existing byte. Inherited by an eleven-role assessor roster that
  CI now pins.
- **`requires_tools:`** in skill frontmatter, and a validator check that an
  agent inheriting such a skill actually holds those tools. `work-activity`
  declares `requires_tools: [bash]` because its procedure is to run
  `scripts/activity.mjs`. The check found two real defects on its first run.

### Fixed

- **Five assessors were granted `edit` but not `create`** —
  `principal-qa-ui`, `principal-seo`, `persona-ux-first-time-user`,
  `persona-professional-nutritionist`, and `persona-professional-trainer`
  are each told to stub a `report.md`, which `create` does and `edit`
  cannot. They held the tool that endangers the artifact under review and
  lacked the one that structurally cannot touch it.
- **`principal-ai-applied-engineer` and `principal-ai-researcher` inherited
  `work-activity` without holding `bash`**, so they could not run the
  reporter that contract requires. Both are deliberately shell-free
  document-producing roles, so the contract was removed rather than granting
  shell for a logging side-effect.

### Changed

- The capability tiers are now stated honestly rather than implied. Most kai
  assessors are `unrestricted-capability`: they hold `bash`, so the
  boundary is this contract, not the host. Removing shell would not harden the
  review — it would break it, turning a revision-bound security review into a
  working-tree guess. A genuinely hard boundary needs a read-only review input
  mounted separately from a writable evidence root, which a declarative plugin
  does not control.

## [0.36.0] - 2026-08-10

### Added

- **`work-activity` — an append-only activity log, so a fleet is legible
  between item updates.** A coordination item changes a handful of times across
  days of work; between two updates a supervisor can only say "unknown". Agents
  now append a `start` and a `stop` (and optionally a `progress`) to a
  gitignored `.kai/activity.jsonl`, carrying who is working, on which item, and
  **when they will report next**.

  ```bash
  RUN=$(node scripts/activity.mjs new-run)
  node scripts/activity.mjs start --root <ws> --role principal-swe-backend \
    --item export-audit --run "$RUN" --for 45m
  node scripts/activity.mjs stop  --root <ws> --role principal-swe-backend \
    --run "$RUN" --outcome handoff
  node scripts/activity.mjs show  --root <ws>     # who else is live
  ```

  This also gives agents something they never had: a live view of their peers
  before claiming work — who is in flight, on what, and whether the peer they
  are about to ask is mid-run.
- **A boundary the writer enforces, not one the docs request.** The item record
  is a compare-and-swap surface: every write increments `version` and is
  verified against a lease token, which is precisely why a heartbeat cannot live
  there — it would inflate the field that detects racing, and read-modify-write
  is the lost-update pattern append-only avoids. So the log is a separate file,
  and a record naming `state`, `verdict`, `change_ref`, `version`, `lease`, or
  `decision` is **rejected at write time**. Two surfaces that can never carry
  the same fact cannot drift into two truths.
- **A live overlay in `work-status`.** Open runs are counted, and a run that
  declared it would report by `T` when `T` has passed becomes a `derived`
  UNKNOWN finding. It never says "crashed" — that requires an observer this
  plugin does not have. With no log present, the report behaves exactly as it
  did in 0.35.0.

### Changed

- `npm test` is now **nine** checks; `npm run activity` and
  `npm run activity:self-test` are available directly.
- The managed `.gitignore` block gained `/.kai/activity.jsonl`. Existing
  workspaces pick it up by re-running `workflow-workspace-init`.
- The 42 agents that inherit `work-coordination` now also inherit
  `work-activity`, which is what gives the skill a real firing path.

### Notes

Concurrency is measured, not assumed. Each agent is a separate OS process, so
single-threaded JavaScript grants no mutual exclusion; what makes this safe is
`O_APPEND` plus one `write()` per record. The self-test runs six concurrent
writer processes and asserts every record survives intact — if that ever stops
holding, the test catches it.

The log is **declared**, like the item records: an agent that crashes never
writes its `stop`, and one that forgets never writes at all. It does not
pretend otherwise.

## [0.35.0] - 2026-08-10

### Added

- **`work-status` — an exception report that answers "where must I intervene?"**
  (`node scripts/work-status.mjs --root <workspace>`, plus `--json`). As work
  scales, reading every coordination record to find the two that need a decision
  does not scale with it. This reads the authoritative item records under
  `kai/coordination/items/` — never `BOARD.md`, which is itself derived and can
  drift — and prints only exceptions, in severity order:
  - **NEEDS YOU** — an open question addressed to `@operator`, and any state only
    a human can advance (`release-ready`, `deploying`, `production-verification`),
    since kai never deploys.
  - **INTEGRITY** — records that contradict each other: a review that approved a
    different `change_ref` than the item now carries, a dependency on an item
    that does not exist, an unreadable record, a terminal state with required
    reviews unmet.
  - **BLOCKED** — declared blocked, or waiting on a typed dependency that has not
    reached its required state.
  - **UNKNOWN** — an expired lease, active work with no `next_role` and no
    holder, or `waiting_on_questions` naming a question with no packet in the
    thread.

  Healthy work is counted, not listed. Ordinary blocked work exits `0` — being
  blocked is a normal state of a healthy board, not a failure; only an integrity
  finding exits non-zero.
- **A confidence tier on every finding** — `declared` (the record asserts it) or
  `derived` (the tool checked it: two records contradict each other, or the
  condition is one the tool can evaluate itself). Coordination records are
  maintained by agents following prose, so a record that has not changed is
  indistinguishable from an agent that is still working, one that crashed, and
  one that forgot. Where the tool cannot tell, it reports `UNKNOWN` rather than
  showing green, and the report states plainly that it describes what agents
  have **declared**, not verified live activity. A confident green board that is
  green because nobody updated it is worse than no board.
- `scripts/lib/coordination.mjs` — the shared parser for coordination records.
  `workspace-doctor` validates these records and `work-status` reports on them;
  both now read through one module, because a second parser would be a second
  truth. Adds list, map-list, and QUESTION-packet parsing on top of the helpers
  the doctor already had.
- Docs: *Seeing what needs you* in the workspace model guide, covering the
  sections, the exit codes, and — explicitly — what the report cannot tell you.

### Changed

- `npm test` is now **eight** checks; `npm run status` and
  `npm run status:self-test` are available directly.
- `workspace-doctor` now exports `checkWorkspace` and only runs its CLI when
  invoked as the entry point. Previously, importing it executed the CLI and
  consumed the importer's own flags — `work-status --self-test` silently ran the
  doctor's self-test instead of its own.

### Fixed

- `docs/README.md` advertised "54 agents and 40 skills"; the shipped surface is
  56 and 42.

## [0.34.0] - 2026-08-10

### Added

- **Documented the three ways a skill reaches a session**, in
  `docs/reference/plugin-structure.md` -> *How a skill reaches a session*:
  **inherited** (named on an agent's `**Inherits:**` line), **user-invoked**
  (`user-invocable: true`, run directly by the operator), and **orchestrated**
  (declared as a dispatch entry in an agent's prose and run situationally, as
  `workflow-doc-review` does with its review lenses). All three are legitimate,
  and a skill may have more than one. The page also records the auditing
  pitfall: **parse only the `**Inherits:**` line** — grepping whole agent files
  also counts prose mentions and inflates the count.
- `npm run validate` now **fails a skill with zero firing paths**. A skill with
  no inheritor, no `user-invocable: true`, and no dispatching agent previously
  passed every check and appeared in the generated catalog while being
  unreachable. The check accepts all three designs and rejects only the
  genuinely orphaned case. The orchestrated path is matched by the dispatch
  declaration shape rather than by any backticked mention, so an incidental
  reference — a cross-link, or a "do not use `x`" sentence — cannot pass an
  unreachable skill off as reachable. Verified against a probe skill with every
  path removed, and against that incidental-mention case.

### Changed

- `principal-swe-backend`, `principal-swe-frontend`, `principal-swe-infra`,
  and `principal-ai-applied-engineer` now inherit `research-before-coding` and
  `pr-sizing`, matching the carrier set already used for `coding-style`.
  Investigating before writing code is the normal path for these roles, and
  `research-before-coding` self-limits — it skips typos, comment edits, and
  doc-only changes, reduces to a two-line proposal for a change under one file
  or thirty lines, and accepts implicit approval — so inheriting it cannot
  impose ceremony on atomic work.

### Fixed

- `workflow-issue-analysis` claimed `research-before-coding` had no inheritor
  and was therefore "a routing intent rather than a live seam". That was
  overstated even when written — the skill is `user-invocable: true` — and is
  now false in both respects. Corrected.
- `docs/reference/plugin-structure.md` described `npm test` as six checks and
  omitted the proactive-runner self-test added in 0.32.0. It is seven.

## [0.33.0] - 2026-08-08

### Added

- `issue-analysis` skill — the discipline for turning an issue into a chosen
  approach: proportionality (a fast path for a typo, the full loop for anything
  with a disputed premise, multiple viable approaches, or a hard-to-reverse
  choice), grounding against what already exists, **verifying the decisive
  assumption by experiment rather than assertion**, restating the problem before
  proposing a remedy, framing only the options that genuinely exist, and stopping
  at the authorized decision owner.
- `workflow-issue-analysis` agent — the front door for picking up an issue. It
  ends in one of three named states: AWAITING SELECTION, FINDING, or BLOCKED.
  There is no state in which it began the work.
- Issue health as a first-class outcome: stale, duplicate, wrongly-premised, and
  "several issues wearing one hat" are **successful** results, not failures to
  comply. Two issues in this repository had to be consolidated by hand.
- Acceptance-evidence classification — CI-provable, manually verifiable,
  externally observable, or not presently provable. Marking a criterion unprovable
  is honest; inventing a test that appears to cover it converts a known limitation
  into a false assurance.

### Changed

- `workflow-issue-analysis` is the **first agent in this plugin that holds no
  `edit` and no `create`.** The central rule of issue analysis — analysis ends in
  a decision request, it does not slide into implementation — is exactly the rule
  a confident model steps over once the answer feels obvious. Removing the write
  tools makes the boundary a capability rather than a promise. The agent
  documents the honest limit of that: it still holds `bash`, because verifying a
  decisive fact requires running things, and `bash` can write.
- The catalog's `Delivery` agent category is now **`Intake & delivery`**, covering
  the full life of one change: issue, to approach, to merged PR, to production.
- `director-chief-of-staff` inherits `issue-analysis` and routes issue intake to
  `workflow-issue-analysis`, so the skill has real carriers. A skill nothing
  inherits never fires — `research-before-coding` has zero inheritors today.

## [0.32.0] - 2026-08-08

### Added

- `examples/proactive-runner/runner.mjs` — the delivery-side logic the scheduled
  runner calls, dependency-free Node ESM with a 33-check fixture suite wired into
  `npm test`. Three commands: `plan` (decide `deliver` / `skip` / `fail`),
  `retain` (apply the retention policy, idempotently), and `redact` (a diagnostic
  carrying no personal content).
- Real non-interactive host invocation for both phases. `copilot -p "<prompt>"
  --agent workflow-proactive-scan` replaces the two `echo` placeholders that made
  the shipped runner non-executable end to end. Tools are granted **narrowly**
  (`--allow-tool view/grep/glob/create/edit`, `--deny-tool bash`) rather than with
  `--allow-all-tools`, because the scan is specified read-only apart from writing
  under `kai/personal/proactive/`.
- Documented authentication: a fine-grained PAT with **Copilot Requests: Read**
  in `COPILOT_GITHUB_TOKEN`. The built-in Actions `GITHUB_TOKEN` does not carry
  Copilot permissions.
- Redacted failure diagnostics uploaded as an artifact — status, signal counts by
  kind and state, and gap reasons **classified** to `unreadable` / `invalid` /
  `unspecified`. Gap reasons are model-authored free text that can name a file,
  and a CI artifact is readable by anyone with Actions read access, so they are
  classified rather than copied. Signal summaries, item paths, workspace labels,
  and root ids are omitted by policy.
- A retention policy: an **acked** payload is deleted and the outbox is pruned to
  the five most recent, because the ledger and not the outbox is the durable
  record. Deletion is gated on the ack rather than the delivery: ack can fail
  after a successful send, and a payload whose ledger entry never advanced will
  be needed again on the next run.
- `check-syntax` now parses `examples/` as well as `scripts/`. Shipped examples
  are copied verbatim into consumer repos, so their executable helpers earn the
  same gate.

### Fixed

- **Consent was checked with a grep.** `grep -Eiq 'consent:[[:space:]]*yes'`
  matches that string **anywhere** in `channels.md` — including the prose that
  documents the format, and including a block whose `enabled: false`. It never
  checked `enabled`, the channel `type`, or that `secret_ref` named the secret
  actually being spent. `plan` now parses only the fenced yaml block and requires
  all four, honoring `secret_ref` exactly; a `secret_ref` the runner does not hold
  fails loudly rather than delivering down an unconsented path. A fixture asserts
  the naive grep would have been fooled by the same input the parser refuses.
- **The Actions cache held personal content.** It persisted all of
  `kai/personal/proactive/`, including the outbox's notification summaries;
  GitHub advises against sensitive data in caches, since a pull request with read
  access can read base-branch caches. Only `snapshot.json` — all that dedup needs
  — is cached now.
- A misconfigured channel no longer resembles a quiet week: broken configuration
  and a scan `status: error` exit non-zero, while "nothing to send" and "no
  consent" exit zero.
- **Scan-derived values were interpolated into `run:` blocks with `${{ }}`.**
  That substitutes the raw string before the shell parses it, so a model-authored
  gap reason containing `$(...)` would have executed on the runner. Every such
  value now reaches the shell through `env:`.
- A signal-bearing status carrying an empty `signals` array now skips instead of
  delivering a hollow notification.
- A `#` inside a quoted yaml value is no longer stripped as a comment.

## [0.31.0] - 2026-08-08

### Added

- `pr-delivery` skill — the contract for how one finished change physically
  leaves the workspace. Branch naming from a three-rung anchor ladder (GitHub
  issue, then coordination item id, then date), a conventional-commit title, and
  a **core-plus-triggered** PR body: Problem / Change / Verification always,
  with `The change at a glance`, `The constraint that shaped this`,
  `Deliberately not done`, `Review fixes`, `Before / after`, and
  `Rollout / reversibility` firing only on their trigger, so no section is ever
  filled with "N/A". Verification must name the exact command that ran. A defect
  fix additionally carries what happened, repro steps, and how it was found. A
  change that alters a structure or flow carries a `build-diagrams` ASCII
  diagram; a changed user-visible surface carries before/after screenshots.
  Inherited by `principal-swe-backend`, `-frontend`, `-infra`, and
  `director-chief-of-staff`.
- `workflow-pull-request` agent — the front door for that span, and the only
  place the part a skill cannot do lives: **investigating live branch protection
  and required checks**, then classifying the change MERGEABLE, NOT YET, or
  STRUCTURALLY BLOCKED. A solo-maintainer repo requiring one approving review is
  unmergeable by construction; that is escalated to `@operator` as a
  configuration decision rather than resolved with a silent admin bypass. It
  drafts and validates only — the human presses merge, tag, and release.

### Changed

- The delivery chain is now explicit end to end: `pr-sizing` splits the work,
  `pr-delivery` lands one PR, `definition-of-done` says it is ready, and
  `workflow-ship` deploys it. Previously nothing owned the span between "the work
  is sized" and "the work is ready to deploy", so branch, PR narrative, version
  bump, and merge readiness lived only in whoever happened to be doing the work.

### Fixed

- Branch naming avoids a real git hazard: because refs are directories, a
  pattern like `<type>/<number>/<author>/<slug>` permanently reserves
  `feat/28` as a folder, and a contributor running `git checkout -b feat/28`
  then hits `cannot lock ref`. Keeping `<anchor>-<slug>` in one segment
  (`kai/feat/28-progressive-onboarding`) reserves nothing, while the `kai/`
  prefix still lets CI filters and protection rules target `kai/**`.
- PR titles drop the trailing `(#N)`. It is non-functional — `Closes #N` in the
  body is what closes the issue — and on a squash-merge GitHub auto-appends the
  PR number, yielding `feat: ... (#28) (#80)`.
- Review fix: `pr-delivery` originally told agents not to maintain a CHANGELOG
  where squash-merged PR titles serve the same purpose — which contradicted
  kai's own CI-enforced release process, in the skill that
  `principal-swe-backend`, `-frontend`, `-infra`, and `director-chief-of-staff`
  now inherit while editing this very repo. It is now workspace-conditional:
  follow the repo's process, and only avoid introducing a *second* list.

## [0.30.0] - 2026-08-08

### Added

- `docs/` — the README split into five task-oriented guides plus a reference:
  [getting-started](docs/getting-started.md), [how-kai-works](docs/how-kai-works.md),
  [workspaces](docs/workspaces.md), [host-capabilities](docs/host-capabilities.md),
  `docs/reference/agents-and-skills.md`, and `docs/reference/plugin-structure.md`,
  indexed by `docs/README.md`. Every page opens with a breadcrumb and closes with
  a "Next / Related" row, so no page is reachable only by scrolling (#63).
- `scripts/generate-catalog.mjs` plus `npm run docs:generate` and
  `npm run docs:check` (wired into `npm test`). The agent/skill catalog is now
  **generated** from each agent's and skill's own shipped `description:` — the
  exact text the host reads — so the catalog cannot describe a capability the
  plugin does not declare. Grouping stays editorial in a `CATEGORIES` table, and
  coverage is enforced: a new agent or skill fails the build until it is filed
  under exactly one heading.

### Changed

- **README is a landing page, not a manual** — 1,167 lines down to ~150. It
  keeps the pitch, a route table, the CI-checked `## Status` stamp, a three-step
  first five minutes, what you actually get, and one flow diagram; everything
  else links out. Compatibility headings (`## Install`, `## Workspace`,
  `## What it ships`, `## How the agents chain`, `## Contributing`) remain and
  point at their new homes.
- `## Status` is now a version stamp plus one paragraph on the current release.
  The chained multi-release narrative it used to carry lives in this changelog,
  which was always its real home.
- `scripts/validate-plugin.mjs` scans every `docs/**/*.md` for both unresolvable
  agent references and workspace paths written without their `kai/` parent —
  the same two checks it already ran over `README.md`. Without this, extracting
  the most reference-dense prose would have silently dropped both guarantees.
  `CHANGELOG.md` stays excluded, since historical entries legitimately describe
  retired layouts.

### Fixed

- The agent/skill catalog was hand-maintained in the README, so every new agent
  needed a second, easily-forgotten edit and the prose had drifted from the
  descriptions the host actually reads.
- `workflow-self-check` audited an inventory table in `README.md` that no longer
  exists; it now checks what generation cannot — that the editorial grouping in
  `scripts/generate-catalog.mjs` still matches what each agent does.
- Five browser-driving skills pointed at a "Browser automation setup" section in
  `README.md` that had moved to `docs/getting-started.md`.
- `docs/host-capabilities.md` named `extract-learn-path` as a browser-driven
  skill; the skill is `web-content-extraction` (`extract-learn-path` is a script).

## [0.29.0] - 2026-08-08

### Added

- `examples/e2e-feature-delivery/` — a committed, CI-validated workspace showing
  one feature carried from brief to production: the architecture decision with
  its rejected options and a revisit trigger, a full handoff thread that walks
  `release-ready -> deploying -> production-verification -> shipped` without
  skipping a state, revision-bound reviews with evidence and timestamps, a
  design sign-off on the net-new UI surface, a ship record with the deploy
  handoff and production-verification result, an item correctly held at
  `in-review` pending independent verification, and an adjacent idea routed to a
  proposal instead of being built. The workspace doctor validates its structure
  on every run (#28).
- A **First five minutes** section at the top of the README: copyable commands
  and prompts for install, workspace init — in both the default spine form and
  an opt-in "materialize everything now" form — the first request, a health
  check, and the worked example, plus a "what you can ignore at first" note.
- `test/fixtures/spine-workspace/` and a doctor self-test proving a freshly
  onboarded workspace with no output lane materialized is healthy and claimable.

### Changed

- **Onboarding creates only the spine.** `workflow-workspace-init` seeds the
  manifest, `CONVENTIONS.md`, the coordination registries, the initiative index,
  and the library README — roughly ten tracked files — plus the gitignored
  `kai/personal/` lane in full, so the personal agents always find their own
  startup state. Only the two output-only lanes, `.kai/runs/<area>/` and
  `kai/library/<type>/`, are materialized on first write by the agent that
  writes into them.
- `workspace-conventions` states that an absent output lane is not a defect,
  that no agent may refuse to act because one is missing, and that the lane
  directory is created on the way to writing the first file in it.
- README explains that the layout tree is the vocabulary, not the initial
  footprint.

### Fixed

- Pre-created empty lanes could not be tracked by git, so they never survived a
  clone: a teammate received a workspace shaped differently from the one
  onboarding reported building. Materializing a lane with its first real file
  keeps the reported tree and the tracked tree the same.

## [0.28.0] - 2026-08-07

### Added

- `team-operating-rules` skill — the portable operating contract every agent
  inherits: role taxonomy and ownership boundaries, target-workspace-root
  resolution and initiative grounding, the acting-agent claim/handoff loop,
  test ownership, the truthful completion/shipping ladder, role-addressed
  communication, and the reserved `@operator` endpoint. It ships as a skill
  because a plugin's own root `AGENTS.md` is never loaded as custom
  instructions in a consumer workspace (#34).
- A single `**Inherits:**` line as the first body line of all 54 agents,
  declaring the skills that bind each role, followed by a verbatim directive to
  load them that also inlines the non-negotiables which must hold even if a
  skill is not loaded.
- Validator rules enforcing that declaration: exactly one `**Inherits:**` line
  per agent, positioned first and carrying the canonical directive; every named
  skill must exist and appear once; every agent must inherit
  `team-operating-rules`; every `director-*` / `principal-*` / `workflow-*` role
  must also inherit `workspace-conventions`; and every skill claimed by a
  profile's "Contracts you inherit" section or by inheritance prose must appear
  on the line.

### Changed

- `AGENTS.md` is scoped to contributing to the kai plugin repo itself. It keeps
  the release procedure, adds a map of where each rule now lives, and states
  why plugin-root instructions do not propagate.
- README documents how shared rules actually reach a session (the skill and the
  `Inherits:` line), how to check what a host discovered (`copilot plugins list`
  or `/skills`, with `/instructions` for the separate custom-instruction set),
  and lists `team-operating-rules` in the skills table.

### Fixed

- README no longer claims `AGENTS.md` holds "house rules carried into every
  repo". A Copilot plugin manifest has no instruction component type, and the
  host discovers custom instructions only from the user's repository root and
  working directory, `$HOME/.copilot/`, and `COPILOT_CUSTOM_INSTRUCTIONS_DIRS`.

## [0.27.0] - 2026-08-07

**The kai working corpus moves out of your repository root and under a
single visible `kai/` parent (#70).** Onboarding a repository used to
scatter four generic top-level directories — `coordination/`,
`initiatives/`, `library/`, `personal/` — across its root, where they
collide with product folders and bury kai state. The workspace now splits
on one axis: `.kai/` is the **hidden control plane** (the `manifest.json`
discovery anchor, the contract, and ignored `runs/` evidence) and the new
visible `kai/` root is the **working corpus** humans browse, search, and
edit. `.kai/` does not move, so the bootstrap sentinel every agent
resolves is unchanged. This is a **mandatory `schema_version` 2
migration**, guarded end to end: the doctor resolves roots from the
manifest instead of assuming a layout and refuses a split-brain workspace,
and the plugin validator rejects any bare-root literal in a shipped prompt.
Roster is unchanged at **54 agents and 39 skills**.

### Changed
- **Workspace layout (breaking, migration required):** `coordination/`,
  `initiatives/`, `library/`, and `personal/` now live at
  `kai/<root>/`. `.kai/` and `.kai/runs/` are unchanged. There is exactly
  one supported layout — no per-workspace layout switch and no
  compatibility aliases.
- **`workspace-conventions`:** the canonical tree re-nests the four roots
  under `kai/`, the placement model is restated as *control plane vs
  working corpus*, and the manifest schema declares `schema_version: 2`
  plus a new `corpus` root and `kai/`-prefixed root values.
- **`workspace-onboarding`:** scaffold, managed `.gitignore` block, and
  legacy detection target the new layout; a schema-1 root-level
  `personal/` stays ignored until migration completes.
- **`workspace-doctor`:** `CURRENT_SCHEMA_VERSION` is `2`, and it resolves
  `coordination/` (items and BOARD) **from the manifest roots map** rather
  than hardcoding a path, so a workspace is validated as it is actually
  laid out.
- **All 54 agents and 39 skills:** ~520 path literals across 73 files
  repointed to the `kai/` prefix in one atomic change, plus `AGENTS.md`
  and the distributed `examples/proactive-runner/` templates.

### Added
- **Schema 1 → 2 migration step** in the `workspace-onboarding` ladder:
  history-preserving moves of the four roots, manifest reconciliation,
  ignore-block reinstall, and repointing of absolute root-relative
  references recorded inside work items.
- **Split-brain guard (`workspace-doctor`):** a workspace where a retired
  bare root **holding kai marker files** and its `kai/` counterpart both
  exist is a hard error. A product's own root-level `library/` or
  `personal/` is explicitly *not* kai state and is left alone — avoiding
  that collision is the point of the move. New `splitbrain-workspace` and
  `product-collision-workspace` self-test fixtures prove both directions.
- **Bare-root literal rule (`validate-plugin`):** CI rejects any shipped
  agent, skill, `AGENTS.md`, `README.md`, or distributed `examples/` file
  that names `coordination/`, `initiatives/`, `library/`, or `personal/`
  without the `kai/` parent — one stale prompt is exactly how a workspace
  would silently fork. Deliberate legacy text must opt out explicitly with
  a `<!-- kai:allow-legacy-roots -->` region, so every exemption is a
  decision on the record; an unclosed region is itself an error.

## [0.26.0] - 2026-08-04

**Dev designs now come with diagrams, drawn from a shared, standard
vocabulary (#62).** Engineering design artifacts — the architect's
`decision.md` and the backend/frontend/infra `design.md` — described
system shape, data models, flows, and topologies in prose, with no
expectation of a picture and no common way to draw one. A new
`build-diagrams` method skill fixes both: it owns the *how* (an
ASCII-first format rule and a catalog of familiar shapes), and each
engineering agent brings the domain judgment about *which* diagram its
design needs. Roster grows to **54 agents and 39 skills**.

### Added
- **`build-diagrams` skill:** the shared diagram vocabulary for technical
  and dev-design artifacts. Format rule — **at least one diagram, ASCII
  fenced in the Markdown by default**; `mermaid` only when ASCII genuinely
  can't carry it; embedded SVG/HTML only when the artifact is itself HTML.
  Ships a standard catalog (component/boundary, sequence/flow, data-model
  ER, state machine, deployment/topology, tree/hierarchy) plus a shared
  ASCII-convention block so every team diagram reads the same. Scoped as
  the technical counterpart to `ui-mockup` (which owns UI screens).

### Changed
- **The four dev-design producers now inherit `build-diagrams`:**
  `principal-swe-architect` (component/boundary; a new `## Diagram` slot in
  the decision-record scaffold), `principal-swe-backend` (data-model /
  sequence), `principal-swe-frontend` (component tree / state), and
  `principal-swe-infra` (deployment / topology). Each carries at least one
  diagram of its central structure.

## [0.25.0] - 2026-08-04

**`learn`/`lessons` runs are now goal-first and deterministic, closing the last
run-grammar gap from #59 (#61).** These two areas were deliberately excluded from
the date-first migration because a learner's runs accrete toward one durable goal,
not a point-in-time snapshot — but their *implementations* didn't group by a
durable goal either. `learn` wrote `learn/<source-slug>/<YYYY-MM-DD-HHMM>/`, where
the slug was the auto-derived Microsoft-Learn artifact slug and **every run spawned
a fresh timestamp folder**, so studying one subject across a few paths/re-runs
scattered into unrelated, timestamp-named folders. `lessons` keyed under the agent
name and a coarse free-text `<theme>` bucket (`certifications`), so `az-204` and
`aws-saa` collided in one folder. Both now use a durable **goal slug** plus the
same order-sorted run tail as every other area. No roster change — still **54
agents and 38 skills**.

### Changed
- **Goal-keyed run grammar unified (#61):** `learn` and `lessons` now follow
  `<area>/<goal-slug>/<NN>-<flavor>-<descriptor>/` — the `<goal-slug>` is the
  durable learning goal (`learn-react`, `az-204`, `prep-for-interview-vercel`),
  reused across runs, and `<NN>` is the next index **within the goal** (highest
  existing + 1, never filling gaps). It simply swaps the date for the goal and
  keeps the universal `<NN>-<flavor>-<descriptor>` tail and run-order sort. Flavors:
  `learn` → `extract`, `lessons` → `tutor`. Updated in `workspace-conventions`
  (grammar + area registry), `web-content-extraction`, `workflow-course-to-audio`,
  `instructor-teacher`, `instructor-tutor`, `generate-html-lesson`, and
  `generate-audio`.
- **`extract-learn-path.js` writes the new shape:** it accepts an optional
  `--goal <goal-slug>` (defaulting to the source slug), computes the next `<NN>`
  by scanning the goal folder, and writes
  `.kai/runs/learn/<goal-slug>/<NN>-extract-<source-slug>/` — the timestamp folder
  is gone.
- **Cross-references move to frontmatter, not paths:** an artifact derived from
  another run (e.g. a teacher lesson built from an extraction) records a
  `produced_from:` path in its frontmatter, so the goal-first layout stays stable
  and agent-to-agent hand-off is never coupled to folder nesting. (`instructor-teacher`
  still writes its packaged `lessons/` subfolder inside the extraction run it built
  from — that parent folder is the natural cross-reference.)

## [0.24.0] - 2026-08-04

**Refreshes the pinned Lectoria build to pick up a dependency-modernization
pass — including one fix that directly affects narrated audio quality.**

Lectoria upgraded `pdf-parse` from 1.x to 2.x. Version 2 inserts a
`-- N of M --` marker between pages by default, and that text flows straight
into the generated script — meaning **every page break in a PDF lesson would
have been read aloud**. Lectoria suppresses it now, so PDF-sourced audio no
longer narrates page separators. Its PDF parser also releases the underlying
pdf.js document on every exit path, so a long batch of PDFs no longer leaks
one document per file.

This raises the Node floor: lectoria is compiled from source by `npm install`
here, and it now requires `^22.22.2 || ^24.15.0 || >=26.0.0`. That range is
declared in this plugin's `engines` and documented in the skill. No roster
change — still **54 agents and 38 skills**.

### Changed
- **Re-pinned `lectoria` to `84e4c11db31f26f9be62db67bb398e93534ff18f`**, which
  upgrades `openai` to 7.x, `jsdom` to 30.x, `zod` to 4.x, and `pdf-parse` to
  2.x, and adds the first test coverage for lectoria's PDF path.
- **Declared `engines.node` as `^22.22.2 || ^24.15.0 || >=26.0.0`** and
  documented the requirement in `skills/generate-audio/SKILL.md`, so an
  incompatible Node fails at `npm install` with a clear reason instead of a
  confusing build error.

### Fixed
- **PDF lessons no longer narrate `-- N of M --` page separators**, via the
  refreshed lectoria pin.



## [0.23.0] - 2026-08-04

**Refreshes the pinned Lectoria release and re-pins it to an exact commit.**
Lectoria shipped two reliability fixes that matter for `generate-audio`:
concurrent runs no longer duplicate paid Azure work (each document's paid work
is now locked and its checkpoint re-read inside the lock), and
`--continue-on-error` now exits non-zero when a source failed instead of
reporting success to CI. It also adds `intermedio-femenino`, the female
counterpart to the default `intermedio` voice.

Separately, the `lectoria` dependency had drifted to an **unpinned**
`github:RubenSaucedo/lectoria`, which floats to whatever that repository's
default branch happens to be at install time. It is pinned back to an exact
40-hex commit. No roster change — still **54 agents and 38 skills**.

### Added
- **`intermedio-femenino` voice for `generate-audio`:** a female host/guest pair
  matched to the pacing of the default `intermedio` preset, for lessons that
  want a different narrator without changing cadence. Accepted by
  `scripts/generate-audio.ps1 -Voice` and documented in the skill.

### Changed
- **Pinned `lectoria` to `5dba356f51c8ec9fe2e191d27fc170a917e843ad`** instead of
  tracking its default branch, so an upstream push cannot silently change what
  `npm install` builds here.
- **Picked up Lectoria's reliability fixes:** batch runs that hit an error now
  surface a failing exit code, and two `generate-audio` runs over the same
  output directory no longer pay Azure twice for the same document.


## [0.22.0] - 2026-08-03

**The design-options flow no longer accepts "option theater" for crowding
problems (#38).** `ui-mockup` required "3-4 materially different options" — but
that was satisfiable while **every option kept the same container/placement**. For
a crowding / visual-weight / context / space / discoverability problem, that means
the actually-correct answer (relocate the affordance to another surface,
progressively disclose it, or remove it) is **never generated**, and the human
picks the least-bad within-container variant. Real incident: `exercise-demo-videos`
offered 4 in-row options, all rejected — "host the demo in the existing LogModal"
only surfaced after a human re-framed it. This makes the container itself a
first-class variable in option generation. No roster change — still **54 agents and
38 skills**.

### Added
- **Container-challenge rule in `ui-mockup` (#38):** for a crowding / visual-weight
  / context / space / discoverability problem, **≥1 option must challenge the
  container/placement framing** — relocate to a **different existing surface**, use
  **progressive disclosure** into an existing modal/sheet/panel/detail view, or
  **remove** it — not merely a within-container variant. "Materially different" now
  explicitly covers a different container/placement, not only within-container
  layout. Hard rule 3 restated to match.
- **`container tunnel-vision` anti-pattern in `ui-mockup` (#38):** all options
  sharing the same container/placement assumption when the complaint is about
  crowding / context / space / discoverability is now a named anti-pattern.
- **A pre-option "challenge the framing" step for `principal-product-designer`
  (#38):** a dedicated DESIGN-workflow step (before option generation) treats any
  container/placement/host surface named in the brief as a **hypothesis, not
  authority** — it enumerates the alternative host surfaces that **already exist**
  in the app (grep the codebase per `design-grounding` for existing
  modals/sheets/panels/drawers/detail views), records why each is in or out, and
  MUST carry ≥1 relocation / progressive-disclosure / removal candidate into the
  option set for a crowding-class problem. The designer's REVIEW fork and hard rule
  9 enforce the same container challenge, so an escalated review option set never
  stays inside the surface the finding is about. This operationalizes the existing
  "treat placement as a hypothesis" principle into an actual option-generation step.

## [0.21.0] - 2026-08-03

**Net-new user-facing UI now needs designer sign-off before it can ship (#54).**
An engineering agent could author a brand-new user-facing surface — a new
component, or a changed layout/placement/prominence/flow — and reach
`release-ready` with **zero designer involvement**: every existing gate that pulls
the designer in was conditioned on a design *already* existing, so when design was
skipped entirely, nothing bounced it (QA-walk + green build satisfied the gate).
This adds a proportional **design sign-off sub-gate** to the readiness contract.
No roster change — still **54 agents and 38 skills**.

### Added
- **Design sign-off sub-gate in `definition-of-done` (#54):** for a **net-new or
  materially-changed user-facing surface**, Dim 2 (verified) + Dim 3 (reviewed)
  now require **either** an approved design artifact **plus** a
  `principal-product-designer` conformance verdict on the current `change_ref`,
  **or** a steward/operator-recorded product-design waiver bound to that
  `change_ref` (a self-declared "it's minor" is not a waiver). Absent both → **Gap
  → bounce**, owner `principal-product-designer`, message *"consult the designer
  before this is passed."* Detection is **independent** — DoD and `workflow-ship`
  decide the trigger from the surface itself, so it fires **even when no designer
  entry was ever added to `review_requirements`** (that missing entry is the
  failure, not an exemption). It stays proportional: a token-compliant copy fix or
  a like-for-like refactor doesn't trigger the sub-gate at all — no design theater.

### Changed
- **`workflow-ship` Dim 2 gate (#54):** the `in-review → release-ready` gate now
  confirms design sign-off for a net-new/materially-changed user-facing surface,
  and routes an unsigned surface to `principal-product-designer` on bounce.
- **`director-chief-of-staff` dispatch (#54):** added a catch rule so that **even
  when engineering built the surface directly** (no design routed up front), a
  net-new user-facing surface arriving at readiness with no design + conformance
  verdict (or waiver) is bounced to the designer rather than silently sequenced
  toward release.
- **`principal-swe-frontend` pre-handoff self-check (#54):** before moving
  net-new/materially-changed user-facing UI to `in-review`, the frontend engineer
  stops and routes to `principal-product-designer` when no approved design exists
  — it is the last guardrail before an unreviewed layout reaches the ship gate.

## [0.20.0] - 2026-08-03

**All run areas are now date-first, with canonical-path enforcement (#59).** The
run-folder grammar led with a **model-generated `<target-slug>`** that drifted
from run to run — so the same feature scattered across sibling slug folders and
runs were hard to find — and artifacts sometimes landed in ephemeral Copilot
session-state, a temp dir, or the caller's cwd instead of `.kai/runs/`. Every
snapshot-run area now anchors on the **date** (deterministic, never
model-generated) with a per-day sequential run index, and the canonical path is
mandatory even when a non-owning agent or a browser/stress harness (`OUT`) drives
the run. Goal- and period-keyed areas (`learn`/`lessons`, `pulse`) keep their own
grammar (learn redesign tracked in #61). No roster change — still **54 agents and
38 skills**.

### Changed
- **Universal run grammar → date-first (#59):** every snapshot-run area moves from
  `<area>/<target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/` to
  `<area>/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/`, where `<NN>` is a zero-padded
  per-day run index (highest existing + 1, never fill gaps, never reuse) so runs
  sort in the order they ran, and `<descriptor>` (work-item/epic key when present,
  else a slug) is descriptive only — **not** the grouping key. `workspace-conventions`
  now documents date-first as *the* rule, with `learn`/`lessons` (goal slug) and
  `pulse` (ISO week) named as the deliberate goal/period-keyed exceptions. Applied
  across the qa, eng, product, revenue, content, ship, incident, review, and ai
  areas — `web-evaluation`, `principal-qa-ui`, `principal-seo`,
  `principal-product-manager`, the persona evaluators, `workflow-product-explore`,
  `product-exploration`, `principal-swe-*` (architect/manager/backend/frontend/infra),
  `principal-product-strategist`, `principal-sales`, `principal-partnerships`,
  `principal-security`/`sre`/`data-*`, `workflow-doc-review`, `workflow-ship`,
  `workflow-incident-response`, `principal-ai-*`, `linkedin-content`,
  `video-direction`, `ui-mockup`, `product-marketing-intelligence`, and more.
  Library promotion mirrors the shape:
  `library/<type>/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/`.

### Fixed
- **Canonical-path enforcement (#59):** a run's artifacts must resolve under
  `.kai/runs/<area>/`; any harness `OUT` pointing at session-state, a temp dir, or
  the caller's cwd is rejected/rewritten — enforced **even when a non-owning agent
  orchestrates the run**. This is the guard against designs, reports, and evidence
  scattering to unfindable locations.
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

[0.37.0]: https://github.com/RubenSaucedo/kai/compare/v0.36.0...v0.37.0
[0.36.0]: https://github.com/RubenSaucedo/kai/compare/v0.35.0...v0.36.0
[0.35.0]: https://github.com/RubenSaucedo/kai/compare/v0.34.0...v0.35.0
[0.34.0]: https://github.com/RubenSaucedo/kai/compare/v0.33.0...v0.34.0
[0.33.0]: https://github.com/RubenSaucedo/kai/compare/v0.32.0...v0.33.0
[0.32.0]: https://github.com/RubenSaucedo/kai/compare/v0.31.0...v0.32.0
[0.31.0]: https://github.com/RubenSaucedo/kai/compare/v0.30.0...v0.31.0
[0.30.0]: https://github.com/RubenSaucedo/kai/compare/v0.29.0...v0.30.0
[0.29.0]: https://github.com/RubenSaucedo/kai/compare/v0.28.0...v0.29.0
[0.28.0]: https://github.com/RubenSaucedo/kai/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/RubenSaucedo/kai/compare/v0.26.0...v0.27.0
[0.26.0]: https://github.com/RubenSaucedo/kai/compare/v0.25.0...v0.26.0
[0.25.0]: https://github.com/RubenSaucedo/kai/compare/v0.24.0...v0.25.0
[0.24.0]: https://github.com/RubenSaucedo/kai/compare/v0.23.0...v0.24.0
[0.23.0]: https://github.com/RubenSaucedo/kai/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/RubenSaucedo/kai/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/RubenSaucedo/kai/compare/v0.20.0...v0.21.0
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

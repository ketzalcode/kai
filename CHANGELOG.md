# Changelog

All notable changes to the **kai** plugin are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Being pre-1.0,
minor bumps (`0.x`) carry features and patch bumps carry fixes.

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

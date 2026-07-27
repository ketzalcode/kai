# Changelog

All notable changes to the **kai** plugin are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Being pre-1.0,
minor bumps (`0.x`) carry features and patch bumps carry fixes.

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

[0.3.0]: https://github.com/RubenSaucedo/kai/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/RubenSaucedo/kai/releases/tag/v0.2.0
[0.1.0]: https://github.com/RubenSaucedo/kai/commit/d85cf51

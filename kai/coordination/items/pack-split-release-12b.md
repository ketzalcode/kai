---
type: work-item
id: pack-split-release-12b
title: Release 12b — minimal 1.0.0 flip (publish core + personal, retire monolith)
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
target: pack-split staged release 12b (the 1.0.0 flip)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - .github/plugin/marketplace.json
  - docs/reference/plugin-structure.md
touches:
  - .github/plugin/marketplace.json
  - plugin.json
  - package.json
  - CHANGELOG.md
  - README.md
depends_on:
  - item: pack-split-host-gates
    requires: completed
  - item: pack-split-release-12a
    requires: shipped
  - item: pack-split-onboarding-installer
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-sre
    kind: independent-reliability
  - role: principal-security
    kind: independent-security
completed_reviews: []
change_ref: null
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-24-2011
---

## Outcome

The flip: `kai-core` + `kai-personal` published to the `kai-plugins` marketplace (core never in the
selector), the published monolith `kai` plugin retired, and `1.0.0` cut — only after the host gates pass.
Minimal = core + one department, not five at once.

## Acceptance

- [ ] `kai-core` + `kai-personal` published to `kai-plugins`; `kai-core` never offered in the selector.
- [ ] The published monolith `kai` plugin is retired at the flip.
- [ ] `1.0.0` is cut; `plugin.json` + `package.json` agree; marketplace index matches.
- [ ] `pack-split-host-gates` evidence is a green go before publish; `release-guard` gate passes.

## Evidence

- (to be filled) — marketplace diff + operator publish/tag confirmation + retirement confirmation.

## Notes

- **Release/version: cuts `1.0.0` — reserved for exactly this step; hard-gated on `pack-split-host-gates`.**
- Highest blast radius. Reviews: `principal-sre` (publish + monolith retirement) and `principal-security`
  (marketplace integrity, retiring the published monolith). The marketplace publish, tag, and monolith
  retirement are **operator-executed** — this role prepares and gates, never publishes.

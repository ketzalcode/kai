---
type: work-item
id: pack-split-release-12b
title: Release 12b — minimal 1.0.0 flip (publish core + personal, retire monolith)
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: operational
state: release-ready
resume_state: null
priority: 20
owner: principal-swe-infra
next_role: "@operator"
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
  - package-lock.json
  - packs/kai-core/
  - packs/kai-personal/
  - CHANGELOG.md
  - README.md
  - docs/getting-started.md
  - docs/reference/plugin-structure.md
  - scripts/release-guard.mjs
  - scripts/validate-plugin.mjs
  - scripts/workspace-doctor.mjs
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - skills/kai-core-workspace-onboarding/SKILL.md
  - test/fixtures/host-installs.json
  - AGENTS.md
  - kai/coordination/
  - kai/initiatives/pack-split/
  - kai/library/releases/2026-08-27/04-ship-pack-split-release-12b/
depends_on:
  - item: pack-split-host-gates
    requires: completed
  - item: pack-split-pack-dependency-manifests
    requires: shipped
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
completed_reviews:
  - role: principal-sre
    kind: independent-reliability
    change_ref: 236f36d4f7ea5b2cd02cd42f3359bb318b253c4d
    verdict: approved
    evidence: "kai/coordination/threads/pack-split-release-12b.md"
    timestamp: 2026-08-27-1515
  - role: principal-security
    kind: independent-security
    change_ref: 236f36d4f7ea5b2cd02cd42f3359bb318b253c4d
    verdict: approved
    evidence: "kai/coordination/threads/pack-split-release-12b.md"
    timestamp: 2026-08-27-1515
change_ref: 236f36d4f7ea5b2cd02cd42f3359bb318b253c4d
version: 11
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1433
---

## Outcome

The flip: `kai-core` + `kai-personal` published to the `kai-plugins` marketplace (core never in the
selector), the published monolith `kai` plugin retired, and `1.0.0` cut — only after the host gates pass.
Minimal = core + one department, not five at once.

## Acceptance

- [ ] `kai-core` + `kai-personal` published to `kai-plugins`; `kai-core` never offered in the selector.
- [ ] The published monolith `kai` plugin is retired at the flip.
- [ ] `1.0.0` is cut; `plugin.json` + `package.json` agree; marketplace index matches.
- [x] `pack-split-host-gates` evidence is a green go before publish; `release-guard` gate passes.

*Carried forward from the `pack-split-generator-gates` architecture review (finding A4, ratified
2026-08-24-2231); routed here by the steward at acceptance 2026-08-24-2240. That change did not
create the exemption — `.github/plugin/marketplace.json` was always exempt — but it is what makes a
**second** marketplace entry legal, and this item is the flip. Publication must not be the one
irreversible act that escapes release enforcement.*

- [x] **(A4)** Publication sits **inside** release enforcement: `.github/plugin/marketplace.json` is
      classified behavior-sensitive by `release-guard` (a `BEHAVIOR_FILE`/prefix), or publication is
      gated by an equivalent explicit mechanism recorded as a decision. Flipping a pack from
      unpublished to published cannot land as a pure marketplace edit with no bump, no CHANGELOG,
      and no README stamp.
- [x] **(A4)** `validate-plugin.mjs` asserts that every marketplace entry's `name` matches the
      `name` inside the `plugin.json` at that entry's `source` — neither the pure helper
      (`marketplaceConsistencyErrors`) nor the caller's filesystem check asserts this today, so an
      entry can point at the wrong pack.

## Evidence

- (to be filled) — marketplace diff + operator publish/tag confirmation + retirement confirmation.
- Steward promotion 2026-08-27-1337: authoritative dependency records verify
  `pack-split-host-gates` `completed` v17,
  `pack-split-pack-dependency-manifests` `shipped` v23,
  `pack-split-release-12a` `shipped` v17, and
  `pack-split-onboarding-installer` `shipped` v18. The item is an explicit
  typed requirement of current scope `five-pack-split-shipped`, and its
  acceptance remains unchanged.
- Full `npm test` passes at `1.0.0`, including 170 pack self-tests, generated
  parity, migration-doctor fixtures, source/name marketplace validation, and
  the marketplace-sensitive release-guard arm.
- The completed host-gate record remains GO. The first staging-marketplace
  probe proved browse, core/personal install, exact `1.0.0` rows, and idempotent
  updates. It also found that CLI 1.0.79 advertises `copilot plugins enable`
  but returns `The plugins command is not available`; the installer was
  corrected to use migration JSON for enabled-state evidence and `/plugin`
  for interactive recovery before review.
- The corrected staging probe installed and idempotently updated core + personal
  from the branch marketplace at exact `1.0.0`. The installed core doctor
  reported both plugins `installed`, `enabled: true`, and only
  `marketplace:kai-plugins` provenance.
- The first independent reliability review blocked ref `20d82bb` on
  config/settings enabled-state disagreement and the absence of a gate-legal
  rollback/post-merge probe. The follow-up reliability review then measured an
  empty user override map on a real direct monolith host and correctly rejected
  the first reconciliation rule as too strict. The final rule treats absence
  from the map as no override, fails closed on explicit disagreement or
  malformed settings, and has direct-install, disabled, disagreement, and
  absent-file fixtures. An explicit `legacy-rollback` forward-patch mode plus
  exact post-merge and already-migrated recovery runbooks is CI-enforced.
- A read-only doctor run against the real current direct-monolith host exits 2
  with exactly `legacy-installed` and `workspace-provenance-current`; it does
  not emit `enabled-state-unverified` for the empty user override map.
- Independent SRE and security reviews both approve exact implementation
  `236f36d4f7ea5b2cd02cd42f3359bb318b253c4d` with no P0/P1 findings.
- Ship gate 2026-08-27-1433 (`workflow-ship`, PREPARE): six of six DoD
  dimensions Clear; verdict RELEASE-READY. Record:
  `kai/library/releases/2026-08-27/04-ship-pack-split-release-12b/ship-record.md`. Verified directly from the tree at PR #181 head
  `b0bb79faa51dd14bfb0cf7151ed6a16b0f538f92`: marketplace publishes exactly
  `kai-core` + `kai-personal` at `1.0.0` with `installSurface: packs` and no
  monolith entry; all seven version surfaces agree at `1.0.0`; CHANGELOG
  `[1.0.0]` + compare link and README `v1.0.0` stamp present; A4(1) at
  `scripts/release-guard.mjs:22`; A4(2) at `scripts/validate-plugin.mjs:822`;
  core never selectable at `skills/kai-core-workspace-onboarding/SKILL.md:31`;
  all four typed dependencies re-verified at their terminal states.
- Ship-gate limits, converted to blocking pre-merge stop conditions rather than
  assumed: this run had no shell and no GitHub API reach (`403`), so
  reviewed-ref equivalence (`236f36d4…` vs `b0bb79fa…`) and CI run
  `33118653686` are operator-attested, not re-executed. Deploy step 1 proves
  equivalence with `git diff --exit-code $review HEAD -- . ':(exclude)kai/'`;
  step 2 requires a **fresh** run at the post-PREPARE head, since the records
  commit supersedes `33118653686`.

## Notes

- **Release/version: cuts `1.0.0` — reserved for exactly this step; hard-gated on `pack-split-host-gates`.**
- Highest blast radius. Reviews: `principal-sre` (publish + monolith retirement) and `principal-security`
  (marketplace integrity, retiring the published monolith). The marketplace publish, tag, and monolith
  retirement are **operator-executed** — this role prepares and gates, never publishes.
- **A4 scope note (steward, 2026-08-24-2240).** The two A4 criteria add `scripts/release-guard.mjs`
  and `scripts/validate-plugin.mjs` to this item's `touches`. If a committed pack tree could become
  publishable **before** this item runs, the guard is needed earlier — raise it to the steward for
  re-routing rather than assuming `12b` will catch it in time.
- **Typed-dependency correction (steward, 2026-08-26-1558).**
  `pack-split-pack-dependency-manifests` is a `product-change`, so its terminal
  requirement is `shipped`, not the knowledge-only `completed` state.
- Non-blocking review follow-ups: add a malformed-settings fixture; document
  that a direct-install settings override key is not host-measured; reverse
  workspace manifest provenance during an emergency monolith rollback; and
  derive the rollback forbidden set from every pack before release 12c.

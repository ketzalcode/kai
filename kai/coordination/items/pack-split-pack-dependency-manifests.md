---
type: work-item
id: pack-split-pack-dependency-manifests
title: Define generated-pack dependency manifests and install semantics
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: product-change
state: in-review
resume_state: null
priority: 10
owner: principal-swe-infra
next_role: principal-swe-infra
target: pack dependency manifests and runtime installation contract
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md
  - kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees/ship-record.md
  - scripts/lib/pack-plan.mjs
  - skills/kai-core-generate-audio/SKILL.md
  - scripts/generate-audio.ps1
  - scripts/demo-narrate.mjs
touches:
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - packs/
  - skills/kai-core-generate-audio/SKILL.md
  - skills/demo-narrate/SKILL.md
  - skills/kai-core-pulse-digest/SKILL.md
  - agents/instructor-teacher.agent.md
  - agents/instructor-tutor.agent.md
  - agents/workflow-course-to-audio.agent.md
  - agents/workflow-weekly-pulse.agent.md
  - scripts/generate-audio.ps1
  - scripts/demo-narrate.mjs
  - plugin.json
  - package.json
  - package-lock.json
  - .github/plugin/marketplace.json
  - README.md
  - CHANGELOG.md
  - docs/proposals/pack-architecture.md
  - kai/coordination/
  - kai/initiatives/pack-split/
depends_on:
  - item: pack-split-host-gates
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews: []
change_ref: e67057ec061e9799cf7300bce972305ab01a7603
version: 8
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-26-1828
---

## Outcome

Generated packs have one truthful dependency-installation contract before any
pack becomes publishable. The decision covers whether the host installs npm
dependencies, where shared executables live, and how manifests and lockfiles
remain deterministic and version-coherent.

## Acceptance

- [x] Host evidence states whether marketplace and direct plugin installation
      run `npm install` or provide `node_modules` in each pack root.
- [ ] Lectoria remediation in the canonical skill and scripts is truthful for
      an installed pack; root remains the single source and generated copies are
      never edited directly.
- [x] A core-owned executable invoked by a department has one documented,
      verified resolution path under a core + department install.
- [x] Per-pack manifest and lockfile generation is deterministic and consistent
      with the lockstep release policy; this does not reopen per-pack semver.
- [x] The emitted-tree gate still rejects undeclared bare runtime imports.

## Evidence

- Host gates established that direct and directory-marketplace installation copy
  plugin files but do not run npm and do not provide `node_modules`; see
  `kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md`.
- Implementation is bound to
  `e67057ec061e9799cf7300bce972305ab01a7603`.
- `npm test` passed at `0.65.0`; pack self-test passed 157 mutation and
  determinism checks; committed-tree drift and diff-format checks passed.
- Temporary generated `kai-core` and `kai-personal` installs each accepted
  `npm ci`, installed 183 packages, and produced a working Lectoria executable.
  Resolving two directories above the loaded
  `skills/kai-core-generate-audio/` provider path reached the core wrapper,
  whose dry-run selected core's pack-local binary. The verification host used
  Node `24.14.0`, below the declared `24.15.0` floor, so npm emitted truthful
  `EBADENGINE` warnings even though installation and the executable probe
  completed successfully.
- Packs remain unpublished and marketplace topology remains the monolith-only
  entry at source `.`. Release 12b remains NO-GO.
- Independent architecture review at exact change ref
  `e67057ec061e9799cf7300bce972305ab01a7603` returned
  **changes-required**: the projected Lectoria record resolves through
  `git+ssh://git@github.com/...`, so the documented manual `npm ci` recovery is
  not portable to users without GitHub SSH authentication. Full evidence and
  exact corrections are in
  `kai/coordination/threads/pack-split-pack-dependency-manifests.md`.

## Decision

```text
canonical root package + lock
            |
            v
 deterministic per-pack projection
      |                       |
      v                       v
 kai-core                 kai-personal
 package + lock           package + lock
 lectoria                 lectoria
 generate-audio.ps1       demo-narrate.mjs
```

- Runtime dependencies belong to the pack that directly executes them. Core and
  personal each project the root-pinned Lectoria graph; other packs receive
  valid empty manifests and lockfiles.
- Package metadata declares a manual, pack-local
  `npm ci --prefix "<pack-root>"` path. It does not claim the host installs npm
  dependencies. Plugin updates may replace `node_modules`.
- A department invokes the core-owned audio wrapper only after loading
  `kai-core-generate-audio` and deriving the absolute kai-core root from that
  skill's provider base directory. It never scans the Copilot cache or assumes
  sibling plugin layout.
- Bare runtime imports are allowed only when the same generated pack declares
  and locks the normalized package name.

## Notes

- **Trigger:** earliest of scope entering `five-pack-split-shipped`, host
  evidence settling dependency installation, an emitted bare import, or any
  change making a pack publishable.
- This item is required before `pack-split-release-12b`; do not discover the
  install contract during the irreversible marketplace flip.
- **Steward grooming 2026-08-26-1558:** accepted as a typed
  `five-pack-split-shipped` requirement at terminal state `shipped`, because it
  changes generated manifests and runtime behavior. It remains `proposed` while
  `scope.current` is `first-pack-extracted`; `host-gates (completed)` is its
  declared prerequisite. Promotion waits for that milestone transition.
- **Steward promotion 2026-08-26-1806:** `first-pack-extracted` closed with all
  4 of 4 typed requirements satisfied and `scope.current` advanced to
  `five-pack-split-shipped`. The sole dependency is reconciled:
  `pack-split-host-gates` is `completed` (SRE-ratified at
  `263452126179dd9f3a61183903a26a90c4d6b1c1`). This item moved
  `proposed -> ready` (v2 -> v3), priority `20 -> 10`, with no owner or lease;
  `principal-swe-infra` is the next dispatch role. No dependency-manifest
  behavior was implemented by this promotion.

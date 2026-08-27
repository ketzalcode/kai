---
type: work-item
id: pack-split-pack-dependency-manifests
title: Define generated-pack dependency manifests and install semantics
initiative: pack-split
milestone: five-pack-split-shipped
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-product-manager
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
  - scripts/generate-audio.ps1
  - scripts/demo-narrate.mjs
depends_on:
  - item: pack-split-host-gates
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-26-1558
---

## Outcome

Generated packs have one truthful dependency-installation contract before any
pack becomes publishable. The decision covers whether the host installs npm
dependencies, where shared executables live, and how manifests and lockfiles
remain deterministic and version-coherent.

## Acceptance

- [ ] Host evidence states whether marketplace and direct plugin installation
      run `npm install` or provide `node_modules` in each pack root.
- [ ] Lectoria remediation in the canonical skill and scripts is truthful for
      an installed pack; root remains the single source and generated copies are
      never edited directly.
- [ ] A core-owned executable invoked by a department has one documented,
      verified resolution path under a core + department install.
- [ ] Per-pack manifest and lockfile generation is deterministic and consistent
      with the lockstep release policy; this does not reopen per-pack semver.
- [ ] The emitted-tree gate still rejects undeclared bare runtime imports.

## Evidence

- (to be filled after `pack-split-host-gates` settles install behavior).

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

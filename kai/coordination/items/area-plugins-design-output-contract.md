---
type: work-item
id: area-plugins-design-output-contract
title: Canonical design and mock destinations — initiative-owned, ad-hoc/private, and unaffiliated-durable — with enforcement
initiative: workspace-corpus-contract
milestone: corpus-honesty
delivery_class: knowledge
state: proposed
resume_state: null
priority: 30
owner: null
next_role: principal-swe-infra
target: design and mockup output placement
artifact_target: kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-design-output-contract.md
artifact_target_status: "directory now exists (operator approved the initiative 2026-08-28); canonical transcription is a separate steward/owner pass and remains OWED — the binding contract is still the DECISION in this item's thread. Mock specifics (options.html, screenshot locations, serving behavior) remain this item's own call, explicitly deferred by the ratified architecture: kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md. The publication lane is settled: kai/library/ becomes legacy after migration and new durable designs publish under <publication-root>/specs/."
id_provenance: "ID assigned by the operator in the 2026-08-27-2113 second revision while these concerns were still inside area-plugins. Membership is the `initiative:` field, not the ID prefix; this item belongs to workspace-corpus-contract per scope-brief A10."
context_artifacts:
  - kai/coordination/threads/area-plugins-design-output-contract.md
  - skills/ui-mockup/SKILL.md
  - skills/kai-core-workspace-conventions/SKILL.md
  - agents/principal-product-designer.agent.md
  - agents/principal-brand-designer.agent.md
  - kai/library/README.md
  - .gitignore
  - kai/initiatives/workspace-corpus-contract/northstar.md
  - kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md
touches:
  - kai/coordination/items/area-plugins-design-output-contract.md
  - kai/coordination/threads/area-plugins-design-output-contract.md
  - kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-design-output-contract.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-product-designer
    kind: doc-review
  - role: principal-product-manager
    kind: scope-acceptance
completed_reviews: []
change_ref: null
version: 4
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-28-1344
---

## Outcome

A reviewed decision contract gives every design or mock exactly one canonical
destination, closes the unaffiliated-durable hole, defines the binary rule, and
specifies how later validation finds misplaced output.

## Acceptance

- [ ] The **Design-output contract** (`DECISION 2026-08-27-2113` in this item's
      thread) is transcribed to `artifact_target` and reconciled against the
      ratified audience boundary.
- [ ] The record keeps `.kai/runs/` as the only raw generation scratch root,
      defines `kai/review/<item>/` as the human review packet rather than a
      second scratch root, and routes unaffiliated durable designs to
      `<publication-root>/specs/`.
- [ ] The prohibited destinations are specified, including a repo-root
      `design/`, `mockups/`, or `ux/` folder, `docs/`, session-state, temp
      directories, and the calling agent's cwd.
- [ ] The binary rule, publication-root ignore requirement, one-way promotion
      rule, and three future doctor checks are specified.
- [ ] Mock-specific decisions (`options.html`, screenshots, serving) remain
      explicit follow-up questions rather than being guessed in this item.
- [ ] The implementation follow-on is named
      `workspace-corpus-design-placement`, depends on
      `workspace-corpus-state-migration` and
      `workspace-corpus-publication-migration`, and owns the bounded skill,
      agent-pointer, ignore, migration, and doctor changes.
- [ ] Verified honestly: a run that cannot be executed in this environment is
      `reported`, not `observed`.

## Evidence

- Grounded 2026-08-27 from `C:\src\kai`: `skills/ui-mockup/SKILL.md:135-167`
  already defines the draft path (`.kai/runs/product/<date>/<NN>-mockups-<slug>/
  options.html`) and the committed path
  (`kai/initiatives/<slug>/artifacts/designs/<item-id>-mockups/options.html`);
  `kai-core-workspace-conventions/SKILL.md:320,338` mirrors both;
  `principal-product-designer.agent.md:66` and
  `principal-brand-designer.agent.md:153,157` already follow them. **The paths
  are not missing — enforcement is.** Two real gaps: `kai/library/README.md:32-42`
  lists 11 library types and **none is design**, so an unaffiliated durable design
  has no canonical home and a designer falls through exactly there; and
  `.gitignore` ignores heavy binaries under `kai/library/**` but **not** under
  `kai/initiatives/**`.
- **2026-08-28:** operator approved `workspace-corpus-contract` and the
  audience-based workspace model. Directory now exists; `artifact_target`
  updated to its canonical (still-owed) path. Mock specifics remain this
  item's own call, unchanged, per the ratified architecture at
  `kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md`
  §13. The durable destination is settled as
  `<publication-root>/specs/`; `kai/library/` becomes legacy read-only history
  after migration. Item `state` unchanged (`proposed`) — steward promotion is
  a separate pass.
- Filled as work progresses.

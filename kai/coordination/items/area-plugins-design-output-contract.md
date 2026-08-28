---
type: work-item
id: area-plugins-design-output-contract
title: Canonical design and mock destinations — initiative-owned, ad-hoc/private, and unaffiliated-durable — with enforcement
initiative: workspace-corpus-contract
milestone: corpus-honesty
delivery_class: product-change
state: proposed
resume_state: null
priority: 30
owner: null
next_role: principal-swe-infra
target: design and mockup output placement
artifact_target: null
artifact_target_status: blocked-on-directory-creation; the binding contract is the DECISION in this item's thread
id_provenance: "ID assigned by the operator in the 2026-08-27-2113 second revision while these concerns were still inside area-plugins. Membership is the `initiative:` field, not the ID prefix; this item belongs to workspace-corpus-contract per scope-brief A10."
context_artifacts:
  - kai/coordination/threads/area-plugins-design-output-contract.md
  - skills/ui-mockup/SKILL.md
  - skills/kai-core-workspace-conventions/SKILL.md
  - agents/principal-product-designer.agent.md
  - agents/principal-brand-designer.agent.md
  - kai/library/README.md
  - .gitignore
touches:
  - skills/kai-core-workspace-conventions/SKILL.md
  - skills/ui-mockup/SKILL.md
  - agents/principal-product-designer.agent.md
  - agents/principal-brand-designer.agent.md
  - scripts/workspace-doctor.mjs
  - skills/kai-core-workspace-onboarding/SKILL.md
  - kai/library/README.md
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
version: 1
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-2113
---

## Outcome

A designer never has to choose a path. Every design or mock has exactly one
canonical destination determined by two questions, the unaffiliated-durable hole
is closed, binaries stay out of the committed tree, and a doctor run can find a
design that landed somewhere else.

## Acceptance

- [ ] The **Design-output contract** (`DECISION 2026-08-27-2113` in this item's
      thread) is implemented as written, or every deviation is recorded and
      accepted by the steward.
- [ ] The three destinations and the two routing questions are stated once,
      authoritatively, in `kai-core-workspace-conventions`, and `ui-mockup`,
      `principal-product-designer`, and `principal-brand-designer` point at that
      statement instead of restating it.
- [ ] The unaffiliated-durable hole is closed: `kai/library/` gains a `designs/`
      type with its row in `kai/library/README.md`. **This is the one addition
      in the contract** and it is the minimum needed to make "exactly one
      destination" true for every case.
- [ ] The prohibited destinations are named explicitly, including a repo-root
      `design/`, `mockups/`, or `ux/` folder, `docs/`, session-state, temp
      directories, and the calling agent's cwd.
- [ ] The binary rule is enforced, not just written: the managed `.gitignore`
      block covers heavy binaries under `kai/initiatives/**` as it already does
      under `kai/library/**`.
- [ ] `workspace-doctor` implements the three checks in §6 of the contract and
      self-tests them.
- [ ] **No designer persona, judgment, procedure, or prose is redesigned.** The
      only permitted edits to the two designer agent bodies are the placement
      pointers. Anything beyond that is out of scope and returns to the steward.
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
- Filled as work progresses.

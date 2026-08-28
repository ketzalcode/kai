---
type: work-item
id: area-plugins-workspace-storage-modes
title: Workspace storage modes — make the tracked-corpus choice explicit, truthful, and safely reversible
initiative: workspace-corpus-contract
milestone: corpus-honesty
delivery_class: knowledge
state: proposed
resume_state: null
priority: 40
owner: null
next_role: principal-swe-infra
target: corpus_visibility — the onboarding choice, its honesty, and its switch path
artifact_target: kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-workspace-storage-modes.md
artifact_target_status: "directory now exists (operator approved the initiative 2026-08-28); canonical transcription is a separate steward/owner pass and remains OWED — the binding product requirement is still the DECISION in this item's thread. Ratified target architecture: kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md (see its §5, §11, and §14 settled calls)."
id_provenance: "ID assigned by the operator in the 2026-08-27-2113 second revision while these concerns were still inside area-plugins. Membership is the `initiative:` field, not the ID prefix; this item belongs to workspace-corpus-contract per scope-brief A10."
context_artifacts:
  - kai/coordination/threads/area-plugins-workspace-storage-modes.md
  - kai/coordination/threads/area-plugins-initiative-archive.md
  - skills/kai-core-workspace-onboarding/SKILL.md
  - skills/kai-core-workspace-conventions/SKILL.md
  - agents/workflow-workspace-init.agent.md
  - scripts/workspace-doctor.mjs
  - .kai/manifest.json
  - .gitignore
  - kai/initiatives/workspace-corpus-contract/northstar.md
  - kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md
touches:
  - kai/coordination/items/area-plugins-workspace-storage-modes.md
  - kai/coordination/threads/area-plugins-workspace-storage-modes.md
  - kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-workspace-storage-modes.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-product-manager
    kind: scope-acceptance
completed_reviews: []
change_ref: null
version: 3
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-28-1352
---

## Outcome

A decision record that satisfies requirements **R1–R5** in this item's thread:
the storage-mode choice is always explicit, both branches state their real cost,
switching modes cannot silently discard durable records, the doctor verifies
whichever mode was chosen, and the hybrid question is answered rather than left
open. The record names the mechanism; a separate implementation item builds it.

## Acceptance

- [ ] Every requirement **R1–R5** in the thread's `DECISION 2026-08-27-2113` is
      either satisfied by a named mechanism or explicitly refused with a reason.
      The **honesty constraint** — neither branch may be presented as the safe
      default — is treated as binding, not advisory.
- [ ] The record is grounded in what already exists rather than proposing a
      parallel system: `corpus_visibility: committed | local` is implemented
      end to end today, and the record states, per requirement, whether it is
      **already met**, **partially met**, or **absent**.
- [ ] The `committed -> local` and `local -> committed` switch paths are both
      designed, both non-destructive on disk, and both require explicit operator
      confirmation naming the exact record count affected. **No doctor
      remediation proposes a destructive git operation without that
      confirmation.**
- [ ] The hybrid question is answered with a recommendation and a reopen trigger,
      not left open. The steward's standing ruling (R4) is *defer*; the record may
      argue against that ruling with evidence, but it may not ignore it.
- [ ] Mechanism specifics — `.gitignore` block shape, manifest schema, doctor
      check implementation, migration procedure — are the record's to decide.
      Product requirement and honesty constraint are **not**; they are fixed by
      the thread decision and changing them returns to the steward.
- [ ] A follow-on implementation item is named (not created here), with its
      touch set, so this decision does not silently become its own build.

## Evidence

- Grounded 2026-08-27 from `C:\src\kai`: `corpus_visibility` already exists across
  `scripts/workspace-doctor.mjs:140-142,386-415` (14 references, incl. detection
  of kai paths still tracked under `local`, plus self-tests),
  `skills/kai-core-workspace-conventions/SKILL.md:151,164,541-544`,
  `skills/kai-core-workspace-onboarding/SKILL.md:301-330,467-490`, and
  `agents/workflow-workspace-init.agent.md:51,77,94,147,184`. This workspace's
  `.kai/manifest.json` records `"corpus_visibility": "committed"`. Two grounded
  gaps: onboarding step 4 **infers `committed` without asking whenever the remote
  is private**, and `workspace-doctor.mjs:406` remediates a mode switch by telling
  the operator to `git rm --cached` — which, followed literally, removes the
  corpus from `HEAD` for every other clone.
- **2026-08-28:** operator approved `workspace-corpus-contract` and the
  audience-based workspace model. Directory now exists; `artifact_target`
  updated to its canonical (still-owed) path. Ratified target architecture:
  `kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md`.
  Item `state` unchanged (`proposed`) — steward promotion is a separate pass.
- Filled as work progresses.

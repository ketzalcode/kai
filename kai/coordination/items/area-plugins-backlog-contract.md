---
type: work-item
id: area-plugins-backlog-contract
title: Exactly one workspace backlog and one initiative backlog — routing rules, prohibited files, and validation
initiative: workspace-corpus-contract
milestone: corpus-honesty
delivery_class: knowledge
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-swe-infra
target: deferred-proposal destinations and their enforcement
artifact_target: kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-backlog-contract.md
artifact_target_status: "directory now exists (operator approved the initiative 2026-08-28); canonical transcription is a separate steward/owner pass and remains OWED — the binding contract is still the DECISION in this item's thread. Ratified target architecture: kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md (see its §8, §13, and §14 settled one-file backlog call)."
id_provenance: "ID assigned by the operator in the 2026-08-27-2113 second revision while these concerns were still inside area-plugins. Membership is the `initiative:` field, not the ID prefix; this item belongs to workspace-corpus-contract per scope-brief A10."
context_artifacts:
  - kai/coordination/threads/area-plugins-backlog-contract.md
  - kai/coordination/threads/area-plugins-initiative-archive.md
  - skills/kai-core-scope-discipline/SKILL.md
  - skills/kai-core-initiative-stewardship/SKILL.md
  - skills/kai-core-workspace-conventions/SKILL.md
  - kai/coordination/backlog.md
  - kai/initiatives/pack-split/backlog.md
  - kai/initiatives/workspace-corpus-contract/northstar.md
  - kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md
touches:
  - kai/coordination/items/area-plugins-backlog-contract.md
  - kai/coordination/threads/area-plugins-backlog-contract.md
  - kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-backlog-contract.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
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

A reviewed decision contract defines exactly one destination for an
unaffiliated deferred proposal and one for an initiative-scoped proposal, one
decidable routing test, the prohibited backlog-shaped files, and the future
doctor proof.

## Acceptance

- [ ] The **Backlog contract** (`DECISION 2026-08-27-2113` in this item's
      thread) is transcribed to `artifact_target` and reconciled against the
      ratified audience boundary.
- [ ] The record defines the two canonical destinations, including the
      superseded unaffiliated path `kai/backlog.md`, and the one-question
      routing rule.
- [ ] The record defines `kai/backlog.md` as one `Now` / `Next` / `Parked`
      operator surface and explains how promoted proposals point to
      authoritative item records without copying execution state.
- [ ] The item-vs-backlog exclusivity rule, strike-through-on-promotion
      convention, and prohibited-file list are specified.
- [ ] The entry shape (date, source, one-line proposal, deferral reason, reopen
      trigger) and the three future doctor checks are specified.
- [ ] The implementation follow-on is named
      `workspace-corpus-backlog-enforcement`, depends on
      `workspace-corpus-state-migration`, and owns contract edits, migration,
      validation, and self-tests.
- [ ] Verified honestly: a run that cannot be executed in this environment is
      `reported`, not `observed`.

## Evidence

- Grounded 2026-08-27 from `C:\src\kai`: `kai/coordination/backlog.md` exists and
  is empty ("Nothing parked yet"); `kai/initiatives/pack-split/backlog.md` holds
  13 parked proposals; `skills/kai-core-workspace-conventions/SKILL.md:466,497-498`
  already declares `proposal_channel` and the routing rule and already forbids
  falling back to `.kai/runs/`. A `TODOs?\.md|TODO list|todo file` search across
  `agents/` and `skills/` returned **zero** matches, and no `TODO.md`, `TODOs.md`,
  `tasks.md`, or `NOTES.md` exists anywhere in the tree — the invention the
  operator observed is **emergent behaviour, not an instructed one**, so the fix
  is a stated prohibition plus validation, not a correction of conflicting docs.
- **2026-08-28:** operator approved `workspace-corpus-contract` and the
  audience-based workspace model. Directory now exists; `artifact_target`
  updated to its canonical (still-owed) path. Ratified target architecture
  narrows this item's unaffiliated destination from `kai/coordination/backlog.md`
  to `kai/backlog.md` — see
  `kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md`
  §8/§13. That file is the settled single `Now` / `Next` / `Parked`
  operator surface; active rows point to authoritative item records instead
  of copying their state. Item `state` unchanged (`proposed`) — steward
  promotion is a separate pass.
- Filled as work progresses.

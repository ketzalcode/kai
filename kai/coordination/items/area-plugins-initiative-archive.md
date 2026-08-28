---
type: work-item
id: area-plugins-initiative-archive
title: Initiative archive semantics — close, complete, archive, and stop a shipped initiative from occupying the live coordination surface
initiative: workspace-corpus-contract
milestone: corpus-honesty
delivery_class: knowledge
state: proposed
resume_state: null
priority: 10
owner: null
next_role: principal-swe-infra
target: initiative lifecycle and the live coordination surface
artifact_target: kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-initiative-archive.md
artifact_target_status: "directory now exists (operator approved the initiative 2026-08-28); canonical transcription is a separate steward/owner pass and remains OWED — the binding contract is still the DECISION in this item's thread. Ratified target architecture: kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md (see its §6, §13, and §14 settled sequencing call)."
id_provenance: "ID assigned by the operator in the 2026-08-27-2113 second revision while these concerns were still inside area-plugins. Membership is the `initiative:` field, not the ID prefix; this item belongs to workspace-corpus-contract per scope-brief A10."
context_artifacts:
  - kai/coordination/threads/area-plugins-initiative-archive.md
  - kai/coordination/threads/area-plugins-backlog-contract.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - skills/kai-core-initiative-stewardship/SKILL.md
  - kai/initiatives/README.md
  - kai/initiatives/INDEX.md
  - kai/coordination/ACTIVE.md
  - kai/coordination/BOARD.md
  - kai/initiatives/workspace-corpus-contract/northstar.md
  - kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md
touches:
  - kai/coordination/items/area-plugins-initiative-archive.md
  - kai/coordination/threads/area-plugins-initiative-archive.md
  - kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-initiative-archive.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
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

A reviewed decision contract defines how `archived` will become a real,
verifiable initiative state: a terminal initiative leaves every live
operational surface, keeps every record and link resolvable, and can later be
proved by the workspace doctor.

## Acceptance

- [ ] The **Initiative archive contract** (`DECISION 2026-08-27-2113` in this
      item's thread) is transcribed to `artifact_target` and reconciled against
      the ratified audience boundary.
- [ ] The record defines `archived` destination, mechanics, preconditions,
      resolution-table behavior, backlog disposition, and the exact
      `INDEX.md` / `.kai/state/ACTIVE.md` / `.kai/state/BOARD.md` effects.
- [ ] Every superseded legacy path is named, including the archive directory,
      board-footer link, and INDEX pointer; the target is consistently
      `.kai/archive/<slug>/`.
- [ ] The record specifies the four future doctor assertions and uses
      `pack-split` as a fully enumerated first-application example without
      moving a file in this knowledge item.
- [ ] The implementation follow-on is named
      `workspace-corpus-initiative-archive`, depends on
      `workspace-corpus-state-migration`, and owns the actual move, doctor
      checks, and first archive.
- [ ] Verified honestly: a run that cannot be executed in this environment is
      `reported`, not `observed`.

## Evidence

- Grounded 2026-08-27 from `C:\src\kai` by file read and directory listing:
  23 `pack-split-*` records in `kai/coordination/items/` (61% of the 38 non-README
  records), 23 in `kai/coordination/threads/` (64% of 36), and 23 rows in
  `kai/coordination/BOARD.md:20-42` (64% of 36 rows) — all for an initiative that
  is `shipped` and already absent from `ACTIVE.md`.
  `kai/initiatives/pack-split/backlog.md` holds 13 parked proposals across 6
  dated sections with no closure disposition. `archived` is named at
  `skills/kai-core-initiative-stewardship/SKILL.md:59,130` and
  `kai/initiatives/README.md:69` and defined nowhere.
- **2026-08-28:** operator approved `workspace-corpus-contract` and the
  audience-based workspace model. Directory now exists; `artifact_target`
  updated to its canonical (still-owed) path. Ratified target architecture
  narrows this item's §3 destination from `kai/coordination/archive/` to
  `.kai/archive/` — see
  `kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md`
  §6/§13. The settled sequence moves live coordination to `.kai/state/`
  before archive implementation, so the archive never ships at an interim
  legacy path. Item `state` unchanged (`proposed`) — steward promotion is a
  separate pass.
- Filled as work progresses.

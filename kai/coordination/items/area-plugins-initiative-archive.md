---
type: work-item
id: area-plugins-initiative-archive
title: Initiative archive semantics — close, complete, archive, and stop a shipped initiative from occupying the live coordination surface
initiative: workspace-corpus-contract
milestone: corpus-honesty
delivery_class: product-change
state: proposed
resume_state: null
priority: 10
owner: null
next_role: principal-swe-infra
target: initiative lifecycle and the live coordination surface
artifact_target: null
artifact_target_status: blocked-on-directory-creation; the binding contract is the DECISION in this item's thread
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
touches:
  - skills/kai-core-initiative-stewardship/SKILL.md
  - skills/kai-core-workspace-conventions/SKILL.md
  - skills/kai-core-work-coordination/SKILL.md
  - scripts/workspace-doctor.mjs
  - kai/initiatives/README.md
  - kai/coordination/items/README.md
  - kai/coordination/
  - docs/workspaces.md
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

`archived` becomes a real, verifiable initiative state with defined mechanics:
a terminal initiative leaves every live operational surface, keeps every record
and link resolvable, and a workspace doctor can prove that no completed
initiative is still presenting itself as active.

## Acceptance

- [ ] The **Initiative archive contract** (`DECISION 2026-08-27-2113` in this
      item's thread) is implemented as written, or every deviation is recorded
      and accepted by the steward.
- [ ] `archived` is defined — destination, mechanics, and preconditions — in
      `kai-core-initiative-stewardship` and `kai/initiatives/README.md`, which
      today **name** the state and define nothing about it.
- [ ] `INDEX.md` gains an archive location for archived rows; `ACTIVE.md` gains
      its stated invariant; `BOARD.md` gains the archived-initiative footer.
- [ ] Every archived item record and thread resolves at its new path, and
      `kai/coordination/archive/<slug>/README.md` maps every old path to its new
      one. **Nothing is deleted, truncated, merged, or rewritten.**
- [ ] `workspace-doctor` implements the four archive assertions in §8 of the
      contract and self-tests them.
- [ ] `pack-split` is archived as the first application: its 23 item records and
      23 threads move, its 23 board rows leave the live table, its 13 parked
      proposals are disposed per §7, and `kai/initiatives/pack-split/**` content
      is **not modified** — only referenced.
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
- Filled as work progresses.

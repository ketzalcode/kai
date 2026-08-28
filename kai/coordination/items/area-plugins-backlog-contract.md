---
type: work-item
id: area-plugins-backlog-contract
title: Exactly one workspace backlog and one initiative backlog — routing rules, prohibited files, and validation
initiative: workspace-corpus-contract
milestone: corpus-honesty
delivery_class: product-change
state: proposed
resume_state: null
priority: 20
owner: null
next_role: principal-swe-infra
target: deferred-proposal destinations and their enforcement
artifact_target: null
artifact_target_status: blocked-on-directory-creation; the binding contract is the DECISION in this item's thread
id_provenance: "ID assigned by the operator in the 2026-08-27-2113 second revision while these concerns were still inside area-plugins. Membership is the `initiative:` field, not the ID prefix; this item belongs to workspace-corpus-contract per scope-brief A10."
context_artifacts:
  - kai/coordination/threads/area-plugins-backlog-contract.md
  - kai/coordination/threads/area-plugins-initiative-archive.md
  - skills/kai-core-scope-discipline/SKILL.md
  - skills/kai-core-initiative-stewardship/SKILL.md
  - skills/kai-core-workspace-conventions/SKILL.md
  - kai/coordination/backlog.md
  - kai/initiatives/pack-split/backlog.md
touches:
  - skills/kai-core-workspace-conventions/SKILL.md
  - skills/kai-core-scope-discipline/SKILL.md
  - skills/kai-core-initiative-stewardship/SKILL.md
  - scripts/workspace-doctor.mjs
  - kai/coordination/backlog.md
  - docs/workspaces.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
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

There is exactly one destination for an unaffiliated deferred proposal and
exactly one for an initiative-scoped deferred proposal; the routing question is
a single decidable test; every other backlog-shaped file is named as prohibited;
and a doctor run can prove no agent invented one.

## Acceptance

- [ ] The **Backlog contract** (`DECISION 2026-08-27-2113` in this item's thread)
      is implemented as written, or every deviation is recorded and accepted by
      the steward.
- [ ] The two canonical destinations, the one-question routing rule, and the
      prohibited-file list are stated in `kai-core-workspace-conventions` and
      referenced from `kai-core-scope-discipline` and
      `kai-core-initiative-stewardship` — one authoritative statement, not three
      divergent ones.
- [ ] The item-vs-backlog exclusivity rule and the strike-through-on-promotion
      convention are documented and demonstrated on a real entry.
- [ ] The entry shape (date, source, one-line proposal, deferral reason, reopen
      trigger) is specified, and an entry without a reopen trigger is rejected.
- [ ] `workspace-doctor` implements the three checks in §8 of the contract,
      including the **warn-then-error** rollout so an existing workspace is not
      broken by surprise, and self-tests them.
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
- Filled as work progresses.

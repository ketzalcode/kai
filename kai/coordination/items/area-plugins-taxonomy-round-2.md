---
type: work-item
id: area-plugins-taxonomy-round-2
title: Second-round plugin taxonomy — kai-directors, kai-project-management, full agent/skill map
initiative: area-plugins
milestone: decisions-locked
delivery_class: knowledge
state: completed
resume_state: null
priority: 5
owner: null
next_role: null
target: A complete revised plugin map with every agent and skill accounted for, router entry points, cross-plugin interaction, standalone and optional-core behavior
artifact_target: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-2.md
artifact_target_status: blocked-on-directory-creation; durable record is this item's thread
context_artifacts:
  - kai/coordination/threads/area-plugins-taxonomy-decision.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - scripts/lib/pack-plan.mjs
  - agents/director-chief-of-staff.agent.md
  - agents/director-executive-assistant.agent.md
touches:
  - kai/coordination/items/area-plugins-taxonomy-round-2.md
  - kai/coordination/threads/area-plugins-taxonomy-round-2.md
  - kai/coordination/threads/area-plugins-scope-brief.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-product-manager
    kind: scope-acceptance
completed_reviews:
  - role: principal-product-manager
    kind: scope-acceptance
    change_ref: null
    verdict: approved-with-conditions
    evidence: "kai/coordination/threads/area-plugins-taxonomy-round-2.md (REVIEW 2026-08-27-2138)"
    record_revision: "item version 3 / thread entry DECISION 2026-08-27-2130 (knowledge item, no diff)"
    conditions: "C1 correct the validate-plugin.mjs:860 attribution; C2 carry the non-negotiable #3 failure of kai-directors; C3 carry the corrected kai-product diagnosis and the Intake & delivery finding; C4 director-agenda not accepted, naming constraint binds the successor initiative; C5 56/51/7 and provider assignments stay reported until pack-preview --gate partition and --check are observed green"
    timestamp: 2026-08-27-2138
change_ref: null
version: 4
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-2138
---

## Outcome

A revised plugin taxonomy that supersedes `area-plugins-taxonomy-decision`,
incorporating the operator's second-revision insights and independent
PM/architecture judgment, with every current agent and skill accounted for.

## Acceptance

- [x] A recommended plugin map covering **all 56 agents and all 51 skills**,
      each in exactly one plugin, verified against the live `agents/` and
      `skills/` directories rather than a remembered roster.
- [x] An explicit recommendation on a proposed **`kai-directors`** plugin
      holding the front-door routers, with clearer role names than
      `director-chief-of-staff` / `director-executive-assistant` that preserve
      the distinct **business-delivery** vs **personal/agenda** routing.
- [x] An explicit recommendation on **`kai-project-management`**, grounded in
      the actual responsibilities of current `kai-product` agents. Do not
      assume every `workflow-*` belongs in product; state where product
      discovery/scope/design ends and project/program execution/coordination
      begins.
- [x] Router entry points, cross-plugin interaction, standalone behavior, and
      optional-core behavior stated for each plugin.
- [x] Each decision classified **P0 blocker** vs **later refinement**.
- [x] Supersession of the round-1 taxonomy is explicit: what it decided, what
      still holds, and what is replaced. The round-1 record is not rewritten.

## Notes

**The round-1 taxonomy is NOT locked and NOT implemented.** The operator
directed that it must not be locked or implemented until this revision is
resolved. The round-1 record stays `completed` as a historical decision and is
superseded by this one, not deleted.

Round-1 findings that remain binding inputs unless this record overturns them
with reasons: `creative-video-director` is the sole referencer of the four
`demo-*` skills, so they follow its placement; `lectoria` resolves from the
`kai-core` provider root; and the `planPacks()`-topology vs
`namespaceErrors()`-name seam defect (D3) is real and independent of placement.

**Environment limit:** no shell in this session; record in this item's thread.

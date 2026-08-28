---
type: work-item
id: area-plugins-distributed-agents-proposal
title: Proposal framing — distributed multi-PC kai agent communication over an exposed endpoint
initiative: area-plugins
milestone: decisions-locked
delivery_class: knowledge
state: completed
resume_state: null
priority: 90
owner: null
next_role: null
target: A security-led, proposal-only framing for a GitHub issue; no implementation, no scope into this initiative
external_ref: https://github.com/RubenSaucedo/kai/issues/192
artifact_target: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-distributed-agents-proposal.md
artifact_target_status: blocked-on-directory-creation; durable record is this item's thread
context_artifacts:
  - kai/coordination/threads/area-plugins-scope-brief.md
  - skills/kai-core-fleet-observation/SKILL.md
  - scripts/observe-subagent.mjs
  - scripts/observe-watch.mjs
touches:
  - kai/coordination/items/area-plugins-distributed-agents-proposal.md
  - kai/coordination/threads/area-plugins-distributed-agents-proposal.md
depends_on: []
waiting_on_questions: []
required_for_milestone: false
review_requirements: []
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-2130
---

## Outcome

A draft GitHub issue title and body outline for kai agents on different
machines communicating through an exposed endpoint, framed so the threat model
leads and implementation is explicitly out of scope.

## Acceptance

- [x] Explicit treatment of every named concern: authentication, authorization,
      tenancy / workspace identity, replay protection, trust boundaries, secret
      handling, tunnel lifecycle, discovery, offline behavior, audit trail, and
      human approval.
- [x] A threat model with named adversaries and abuse cases, not a feature list.
- [x] States plainly what would make this **not worth building**, and what the
      smallest safe validating experiment would be.
- [x] Proposal-only: no implementation, no code, and nothing folded into the
      `area-plugins` initiative scope.
- [x] Output is a ready-to-post issue title + body outline the operator's main
      agent can file without rewriting.

## Notes

Operator directive: *"Treat this as proposal-only and security-sensitive…
Do not fold implementation into this initiative. The main agent will create the
GitHub issue after your proposed framing is returned."*

This item is `required_for_milestone: false` on purpose — it must never gate
the P0 sequence.

**Environment limit:** no shell in this session; record in this item's thread.

## Closure — GitHub issue #192 (director, 2026-08-27-2205)

The proposal was filed externally as
**https://github.com/RubenSaucedo/kai/issues/192**, recorded above as
`external_ref`. The item is `completed` on that basis: the deliverable was a
proposal framing, and the framing has been filed.

**No implementation scope enters `area-plugins` from this.** The item stays
`required_for_milestone: false`, gates nothing, and blocks nothing. The security
record's `BLOCK-by-default` position stands: any future implementation
re-engages `principal-security` before code, and the four
`must-answer-before-code` questions remain unanswered by design.

The security assessment — 10 named adversaries, 12 abuse cases, the four
compared transport options, the 10-row human-approval table, the 8 kill
conditions, and the offline packet-forgery experiment — remains in this item's
thread as the durable record behind the issue.

## Evidence

- `kai/coordination/threads/area-plugins-distributed-agents-proposal.md` —
  `SECURITY-PROPOSAL 2026-08-27-2130` packet (draft issue title + full RFC body,
  threat model with 10 named adversaries and 12 abuse cases, 11 named concerns
  as design questions, 5 coordination-specific questions, 4 options compared,
  recommendation, not-worth-building list, smallest safe experiment, human
  approval boundaries) and the `HANDOFF 2026-08-27-2130` packet with its DoD
  self-check.
- Verdict: **CONDITIONAL** — proposal may be filed; any implementation is
  BLOCK-by-default until the four `must-answer-before-code` questions are
  answered. P0=0, P1=4, P2=6. No residual risk was accepted by any agent.
- Read-only session: no shell, no network, no execution. Every
  execution-dependent claim is labelled `inferred` in the record.

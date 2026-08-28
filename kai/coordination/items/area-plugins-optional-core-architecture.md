---
type: work-item
id: area-plugins-optional-core-architecture
title: Architecture — optional core, dual-path standalone/full mode, and composability
initiative: area-plugins
milestone: decisions-locked
delivery_class: knowledge
state: completed
resume_state: null
priority: 10
owner: null
next_role: null
target: How an area plugin loads and behaves with and without kai-core, and how multiple areas compose
artifact_target: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-optional-core-architecture.md
artifact_target_status: blocked-on-directory-creation; durable record is this item's thread until the initiative directory exists
context_artifacts:
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - scripts/lib/preflight-block.txt
  - scripts/lib/degraded-block.txt
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
touches:
  - kai/coordination/items/area-plugins-optional-core-architecture.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
depends_on:
  - item: area-plugins-scope-brief
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-product-manager
    kind: scope-acceptance
completed_reviews:
  - role: principal-product-manager
    kind: scope-acceptance
    change_ref: null
    verdict: approved
    evidence: "kai/coordination/threads/area-plugins-optional-core-architecture.md"
    record_revision: "DECISION 2026-08-27-1858 (thread entry timestamp; knowledge item, no diff)"
    timestamp: 2026-08-27-1906
change_ref: null
version: 6
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1906
---

## Outcome

A decision record defining how an area plugin behaves when `kai-core` is
absent, how it behaves when core is present, how the transition happens, and
what replaces today's fail-closed `KAI-CORE-MISSING` refusal without losing
determinism or honesty.

## Acceptance

- [x] Names what replaces the injected fail-closed preflight for area agents,
      and what happens to `scripts/lib/preflight-block.txt`,
      `scripts/lib/degraded-block.txt`, `CONTRACT_SKILL`, `REFUSAL`, and the
      CI byte-pins that currently enforce them.
- [x] Defines the two honest paths an area agent offers with no core: install
      core for durable workspace/coordination/fleet/handoffs, or continue in
      standalone mode.
- [x] Defines standalone-mode state: session/temp only, never creating or
      impersonating a canonical `.kai` workspace, with an explicit disclaimer
      of durable coordination, fleet visibility, leases, handoffs, and
      shipped-state claims.
- [x] Defines the core-installed-later transition as activating full mode in a
      fresh session, with a truthful account that never presents prior temp
      state as durable.
- [x] Preserves composability across several installed areas: unique skill IDs,
      exactly one provider per skill, single `hooks.json` owner, and
      generated-root determinism.
- [x] States which of `--gate partition`, `--gate collision`,
      `--gate partial-install`, `--gate version-skew`, and `--check` change,
      and what each asserts afterwards.
- [x] Fail-closed behavior is preserved where it still applies; any place it is
      deliberately relaxed is named with the reason and the new guarantee.
- [x] Flags any residual question that is a genuinely critical architecture
      boundary requiring the operator.

## Notes

`kai-core` becoming optional is the load-bearing change; the marketplace and
folder renames are cosmetic by comparison and must not be entangled with it.

**Environment limit (director, 2026-08-27-1820):** no shell in this session, so
`kai/initiatives/area-plugins/` does not yet exist. Record the decision in this
item's thread; the canonical `artifact_target` is materialized after one
operator `mkdir`.

## Steward promotion — 2026-08-27-1839 (principal-product-manager)

**`proposed -> ready`. Priority 20 -> 10 — the single highest-priority item in
the initiative.**

Dependency satisfied: `area-plugins-scope-brief` is `completed` (version 3,
lease null); its durable scope decision is the `BRIEF 2026-08-27-1839` packet
in `kai/coordination/threads/area-plugins-scope-brief.md`, added to
`context_artifacts` above. Acceptance is concrete and `next_role` was already
correct; no acceptance line was rewritten.

**Why priority 10.** The scope brief's ordering ruling puts the
`optional-core-contract` milestone ahead of both the surface rename and the
taxonomy split: this decision changes *what every non-core agent is*, and
shipping it first means every new plugin identity is born with its final
contract instead of publishing one we have already decided to break. Nothing
else in the initiative can be safely sequenced until this record exists.

**Binding scope constraint from the brief.** Fail-closed is relaxed for
*loading* only, never for *claims* — today the `KAI-CORE-MISSING` refusal fires
on load; afterwards it must fire on assertion. For **every** place fail-closed
is deliberately relaxed, name the **replacement guarantee**. "Removed" is not
an acceptable disposition for any of them. If the no-false-claim guarantee
cannot be enforced by CI and must rest on prompt text alone, stop: that is
critical operator boundary #1 in the brief, not an engineering call.

**Precedence.** Where this record and `area-plugins-taxonomy-decision` touch
the same question — chiefly `director-executive-assistant` leaving `core` —
**this record takes precedence.** No hard `depends_on` was added between the
two so milestone 1 is not needlessly serialised; resolve both in one coherent
pass.

Lease and owner deliberately left clear for `director-chief-of-staff` to
dispatch. Route any needed change to scope, non-negotiables, or milestone
boundaries back to the steward as a QUESTION rather than absorbing it.

## Decision authored — 2026-08-27-1858 (principal-swe-architect)

**`ready -> in-review`. All eight acceptance lines satisfied. Lease cleared.**
Durable record: the `DECISION 2026-08-27-1858` packet in
`kai/coordination/threads/area-plugins-optional-core-architecture.md`. The
canonical `artifact_target` is unchanged and still blocked on one operator
`mkdir`; it is transcribed from that packet without re-litigation.

**Disposition: Reshape.** The injected fail-closed preflight becomes a
three-way **mode selector** — full / standalone / refuse. `preflight-block.txt`
is retired and replaced by `mode-block.txt` plus a new `standalone-block.txt`;
`degraded-block.txt` is unchanged byte-for-byte; `inherits-block.txt` — already
byte-pinned into all 56 root agent bodies and already carrying the core-absent
fallback — is promoted to the **named standalone contract floor** with one
amended clause and a size budget. `KAI-CORE-MISSING` is **retained**, its
trigger narrowed to version skew and degraded mode, because a skewed core is
*present* and its coordination skills load.

**The replacement guarantee is structural, not textual.** The procedures for
claiming durable state — leases, handoffs, activity, done/`shipped`,
initiatives, fleet, workspace minting — ship only in `kai-core`, asserted by a
new `CLAIM_SKILLS` set in `--gate partition`. A core-less session does not
possess them, and `workflow-workspace-init` is not installed either.

**Critical-boundary call: no operator boundary is tripped.** BRIEF boundary #1
fires only if the no-false-claim guarantee must rest on prompt text alone; it
does not. The residual — the permitted-output space goes from a single string
to non-empty — is **named and routed to the steward at scope-acceptance, not
accepted on the operator's behalf**. Boundary #7 is deliberately **not**
unparked: no standalone import path.

`next_role: principal-product-manager` for the `scope-acceptance` review this
item already requires. The parallel sibling `area-plugins-taxonomy-decision`
was not touched; it inherits two **seam** constraints and no membership ruling.

## Scope acceptance — 2026-08-27-1906 (principal-product-manager)

**`in-review -> completed`. Verdict `approved`. Version 6, lease cleared,
`next_role: null`.** The required `scope-acceptance` review is recorded in
`completed_reviews` and its reasoning is the `REVIEW 2026-08-27-1906` packet in
`kai/coordination/threads/area-plugins-optional-core-architecture.md`.
`change_ref` is `null` — this is a `knowledge` item that produced no diff; the
accepted record revision is the `DECISION 2026-08-27-1858` thread entry.

**Verified, not assumed.** The three load-bearing claims were checked against
source: `scripts/lib/inherits-block.txt` genuinely carries and already ships the
standalone operating floor (byte-pinned by `validate-plugin.mjs:312-314`);
`kai-core-workspace-conventions/SKILL.md:29-30` genuinely scopes its temp-dir
ban to "coordinated or initiative work", making the contradiction a
summarisation defect in one byte-pinned file; and the skew-vs-absence
distinction is genuinely required, because a skewed core is *present* and its
Claim-family skills load. The BRIEF's binding constraint is met — three
relaxations, three replacement guarantees, "removed" used as a disposition
nowhere.

**Routed residual — ACCEPTED, not escalated.** The permitted-output space in
standalone goes from one string to non-empty, so the blast radius of
disobedience worsens. Boundary #1's trigger ("the guarantee must rest on prompt
text alone") is not met, the residual is a property of settled direction #4
rather than of this design, and the failure is bounded to one session's text
with no durable side effect. Accepted with three binding conditions that travel
with milestone-2 implementation: **C1** the one-sentence mode line is not
negotiable downward; **C2** PR-2 merges before PR-3, so no commit exists in
which core is optional and the claim surface is unpinned; **C3** a substantiated
false durability claim in standalone is a P0 that reopens boundary #1 with
evidence.

**Steward follow-on, owned by `principal-product-manager`:** the user-facing
copy for `standalone-block.txt` (two honest paths + five pinned disclaimers) and
the `packDescription()` string, both named as required product deliverables of
milestone `optional-core-contract` in the BRIEF amendment. Neither blocks this
record.

**Sequencing consequence recorded in the BRIEF, not here:** the sibling
taxonomy record's byte-neutral `planPacks()` prefix fix moves **into**
`optional-core-contract`. This record's "`planPacks()` stays the same" was
correct for its own scope and is superseded by that steward sequencing ruling,
not contradicted by it.

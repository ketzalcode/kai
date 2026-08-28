# Active initiatives

Operational focus pointer, not the permanent record. Terminal initiatives remain
discoverable in `kai/initiatives/INDEX.md`.

**Current snapshot — 2026-08-28-1352.**

| initiative | status | current milestone | workspace | authoritative records |
|------------|--------|-------------------|-----------|-----------------------|
| area-plugins | active (operator-directed) | `allowlist-repair` + `decisions-locked` | `.` (repository) | `kai/coordination/items/area-plugins-*.md` + `kai/coordination/threads/area-plugins-*.md` |
| workspace-corpus-contract | active (operator-approved 2026-08-28) | `corpus-honesty` (architecture ratified; four decision items proposed) | `.` (repository) | `kai/initiatives/workspace-corpus-contract/northstar.md` + `kai/coordination/items/{area-plugins-initiative-archive, area-plugins-backlog-contract, area-plugins-design-output-contract, area-plugins-workspace-storage-modes}.md` + their threads |

`area-plugins` refactors kai from the shipped v1.0.4 five-pack topology to
area-focused standalone plugins over an **optional** `kai-core`. The operator
authorized it directly and issued a **mandatory second revision** on
2026-08-27-2113 directing that implementation must not proceed and the round-1
taxonomy must not be locked until it resolves.

**Scope gate.** The steward (`principal-product-manager`) authored and accepted
the scope, ruled on sequencing, and promoted every item. Nothing here was
self-promoted by the director.

**Milestone order (steward-ruled, re-ranked at the 2113 revision — scope-brief
A11):**
`allowlist-repair -> decisions-locked -> optional-core-contract ->
surface-rename -> area-taxonomy-split -> migration-complete`

**Two concurrent frontiers, deliberately.** `allowlist-repair` (a frontmatter
tool-allowlist repair across all 56 agent bodies and their generated mirrors) and
`decisions-locked` (knowledge work only) share **no target file, no decision, and
no artifact**, so neither can be used to justify the other. They advance and
close independently. `allowlist-repair` is first because it must reach `shipped`
before milestone 2's PR-3 opens — two whole-fleet agent-body rewrites must not be
in flight at once.

**Round-1 taxonomy is SUPERSEDED-PENDING.** `area-plugins-taxonomy-decision`
remains `completed` as a record, but no milestone-4 item may be minted against
it, no `PACKS` or `SKILL_OWNER_OVERRIDES` edit may cite it, and no plugin
identity may be created from it until `area-plugins-taxonomy-round-2` reaches
`scope-acceptance`. `completed` was never a licence to implement.

**The initiative was SPLIT at the 2113 revision (scope-brief A10).** Four of the
operator's nine P0 concerns — workspace storage modes, initiative archive
semantics, the backlog contract, and the design-output contract — touch none of
`area-plugins`' targets and moved to a new initiative, `workspace-corpus-contract`.
Splitting was the steward's call, made because an initiative that never closes
is exactly the noise the operator's own concern #7 describes. **The operator
approved `workspace-corpus-contract` and the recommended audience-based
workspace model on 2026-08-28.** Its four items remain `proposed` with cleared
leases pending steward scope-acceptance and priority-ordering — approval
unblocked the initiative, not automatic dispatch. Their `area-plugins-` ID
prefix is operator-assigned provenance, not membership — membership is the
`initiative:` field.

**Out of `area-plugins` delivery scope, recorded so it is not rediscovered:**
distributed multi-PC agent communication is proposal-only and routed to
`principal-security` as `area-plugins-distributed-agents-proposal`; nothing it
proposes enters delivery scope without a fresh operator decision. Fleet-observer
UX is deferred with a trigger as the unaffiliated
`area-plugins-fleet-observer-ux`.

**Partly resolved — corrected 2026-08-28-0125 by the steward.** The earlier note
here said neither initiative directory could be created because no session had a
shell. That is now **false for `area-plugins`**: `kai/initiatives/area-plugins/`
exists and carries the canonical `northstar.md` (status `active`, owner
`principal-product-manager`), `backlog.md` (the `proposal_channel`), `log.md`,
`deliverables.md`, and `artifacts/decisions/`. **The north star is authoritative
for `area-plugins`; this row is the pointer.** The scope brief
(`kai/coordination/threads/area-plugins-scope-brief.md`, `BRIEF` plus amendments
A1–A28) remains the amendment trail behind it, not a substitute for it.

It remains true for **`workspace-corpus-contract`** that no path move, schema
change, onboarding/doctor change, mock placement, backlog enforcement, or
archive mechanic has been implemented — the operator's 2026-08-28 approval
ratified the initiative and its target architecture, not any mechanism. What
is no longer true: **`kai/initiatives/workspace-corpus-contract/` now
exists**, carrying the canonical `northstar.md` (`status: active`, owner
`principal-product-manager`), `backlog.md`, `log.md`, `deliverables.md`, and
`artifacts/decisions/workspace-corpus-contract-architecture.md` — the ratified
audience-based architecture (agent-facing `.kai/` vs. operator-facing `kai/`)
that reconciles all four founding contracts without rewriting any of them.
**The north star is authoritative for `workspace-corpus-contract`; this row is
the pointer.** The four contract threads listed in its row above remain the
authoritative record of each item's own `DECISION 2026-08-27-2113`, unchanged.

`pack-split` is `shipped` and closed; it is not active, and nothing in either
initiative modifies `kai/initiatives/pack-split/**`. It is, however, the first
candidate for the archive contract above: 23 of its item records, 23 of its
threads, and 23 of its `BOARD.md` rows still occupy the live coordination
surface.

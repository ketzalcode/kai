---
type: work-item
id: area-plugins-taxonomy-round-3
title: Round-3 taxonomy — nine plugins, accepted kai-directors and kai-project-management
initiative: area-plugins
milestone: decisions-locked
delivery_class: knowledge
state: completed
resume_state: null
priority: 5
owner: null
next_role: null
target: The nine-plugin map with all 56 agents and 51 skills placed exactly once, plus the kai-directors standalone exception
artifact_target: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-3.md
context_artifacts:
  - kai/coordination/threads/area-plugins-taxonomy-round-2.md
  - kai/coordination/threads/area-plugins-taxonomy-decision.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - scripts/lib/pack-plan.mjs
  - scripts/validate-plugin.mjs
  - scripts/generate-catalog.mjs
touches:
  - kai/coordination/items/area-plugins-taxonomy-round-3.md
  - kai/coordination/threads/area-plugins-taxonomy-round-3.md
  - kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-3.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-product-manager
    kind: scope-acceptance
completed_reviews:
  - role: principal-product-manager
    kind: scope-acceptance
    verdict: approved
    evidence: kai/coordination/threads/area-plugins-taxonomy-round-3.md#review-2026-08-27-2240
    change_ref: null
    bound_to: "DECISION 2026-08-27-2215 (principal-swe-architect) + kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-3.md as of that entry — knowledge item, no diff exists to content-address"
    timestamp: 2026-08-27-2240
change_ref: null
version: 4
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-2240
---

## Outcome

The authoritative nine-plugin taxonomy, superseding rounds 1 and 2, recording
the main agent's two overrides with their reasoning and their mechanical
consequences resolved rather than deferred.

## Acceptance

- [x] All **56 agents** and all **51 skills** placed in exactly one plugin,
      verified by reading `agents/` and `skills/`, with per-plugin counts that
      reconcile to those totals.
      → §1/§2 of the decision. 2+2+3+20+9+12+4+2+2 = **56**;
      24+0+0+15+3+7+1+1+0 = **51**. Derived from a directory read (56
      `*.agent.md`), a glob (51 `SKILL.md`), and all 56 `**Inherits:**` lines.
      `reported`, not `observed`.
- [x] The `kai-core-*` namespace seam is resolved for every skill whose sole or
      shared consumers now sit outside `kai-core` — in particular
      `kai-core-decision-brief` and `kai-core-executive-consultation` (sole
      consumer `director-executive-assistant`, moving to `kai-directors`) and
      `kai-core-personal-agenda` (consumer `workflow-proactive-scan`, moving to
      `kai-project-management`). `--gate partition` must be green by
      construction, not by exception.
      → §5. **Six** fracture cases enumerated by deriving the provider map from
      every `**Inherits:**` line — the two named above plus
      `kai-core-initiative-stewardship`, `-proactive-scan`, `-pulse-digest` and
      `-content-grounding`. **`kai-core-personal-agenda` is NOT one**: two
      consumers in two different packs ⇒ `packs.size > 1` ⇒ `core` by topology.
      Green **by construction** under the D3 prefix fix, which **suffices
      unchanged** — not extended, not replaced. The reverse direction is green
      too (zero non-prefixed skills reach core), *because* the weld was
      respected.
- [x] The **`kai-directors` standalone exception** is specified precisely:
      read-only discovery and routing plus an offer to install core; no lease
      claims, no canonical coordination writes, no impersonation of full
      delivery. Stated as an enforceable contract, not prose.
      → §7, clauses **D-1…D-8**, each naming its enforcement point. The
      load-bearing one is **D-2** (`planPacks().local.directors` is empty), with
      **D-4** (zero assets) — together they make "cannot claim" structural.
      **`CLAIM_SKILLS` is unchanged at 14** (§6.3).
- [x] Successor router names recommended, with evidence.
      → §10. `director-delivery` **upheld**; **`director-personal` rejected** on
      three grounds, the third new and decisive under the override (it
      misdescribes the standalone routing capability the exception preserves).
      Constraint **C4′** added. No replacement minted — the rename still cannot
      ship in `area-plugins` (R5/F9/A1, not overridden), so `kai-directors`
      ships with the current agent ids.
- [x] `hooks.json` single-owner and `lectoria` runtime declarations reassigned.
      → §8. `hooks.json` **stays `core`, zero diff**, on a new and stronger
      justification (`kai-core-fleet-observation` is a `CLAIM_SKILLS` member, so
      *no core ⇒ no observer* is correct semantics). `lectoria` on **`core` +
      `gtm`**; the other seven packs declare `[]`; nine keys are mandatory
      because `runtimeDependencyMatrix()` throws on a missing plan.
- [x] Whether a new principal project/program manager agent is needed is
      **named as a later question**, not silently invented now.
      → §11 **L4**, routed as **P-C** to `principal-product-manager`. Adding an
      agent is scope expansion and is decided at triage, not architected in.
- [x] Supersession of rounds 1 and 2 is explicit; neither is rewritten.
      → §13. Round 1 `SUPERSEDED-PENDING` → **SUPERSEDED**. Round 2 superseded
      in its product conclusions, **upheld in its mechanics** (R3's second
      clause is load-bearing; R6 strengthened; C1/C4/C5 upheld).

## Notes

The main agent overrode the round-2 recommendations against both plugins. This
record implements the override; it does not relitigate it. What it *must* do is
resolve the mechanical consequences round 2 correctly identified — the
namespace seam and the claim-surface collision are real regardless of who won
the product argument.

### Architect completion 2026-08-27-2215 (`principal-swe-architect`)

`ready -> in-review`, version 1 -> 2, `next_role: principal-product-manager`
(the declared `scope-acceptance` reviewer), lease cleared (all five fields
null). Lease was re-read and confirmed matching
(`holder=principal-swe-architect`, `token=apx-tax3-20260827-2200-p1`,
`version_at_grant=1`, `version=1`) **before** any state-changing write. No
collision.

**Canonical decision:**
`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-3.md`.
**Working/audit record:** `kai/coordination/threads/area-plugins-taxonomy-round-3.md`
(`DECISION 2026-08-27-2215` + `HANDOFF 2026-08-27-2215`).

**Evidence discipline.** No shell existed in this session and **nothing was
executed**. Every count, provider assignment and gate outcome is **`reported`**,
derived by reading source; **none is `observed`**. The thirteen checks that must
be `observed` green before milestone 4 merges are enumerated in §12 of the
decision, and no downstream record may promote them without a run.

**Two corrections to the dispatch's own premises, recorded so they are not
re-derived:**

1. **`kai-core-personal-agenda` is not a fracture case.** It has two consumers
   landing in two *different* packs (`director-executive-assistant` →
   `kai-directors`, `workflow-proactive-scan` → `kai-project-management`), so
   `planPacks()` sees `packs.size === 2` and assigns `core` by topology. Green
   with or without the prefix fix.
2. **Four fracture cases the dispatch does not name are real** —
   `kai-core-initiative-stewardship`, `kai-core-proactive-scan`,
   `kai-core-pulse-digest`, and `kai-core-content-grounding`. The last is caused
   by `creative-video-director` moving `personal` → `gtm`, a decision rounds 1
   **and** 2 already made, so it would have gone red in the seven-plugin map too.

**No shipped plugin behavior was edited.** Zero writes to `scripts/`, `packs/`,
`plugin.json`, `agents/`, `skills/`; zero writes under
`kai/initiatives/pack-split/**`; zero writes to the parallel siblings' files
(`northstar.md`, deliverables, backlog, scope brief,
`area-plugins-host-tool-conformance`).

**Boundary call: nothing requires the operator.** All eight of the scope brief's
critical operator boundaries were checked explicitly (§ "Open questions /
escalations"). #1 (honesty cannot be mechanised) — the one the steward warned
would trip — **does not**: the `provided by core and by no area` invariant
survives with `CLAIM_SKILLS` unchanged at 14. #6 (core loses coherence) **does
not**: core needs no replacement agent.

**Three `PROPOSAL`s routed, not self-approved** — **P-A** (parameterise
`standaloneBlockErrors()` over a block variant; **shortest fuse, it constrains
milestone 2**), **P-B** (fold derived core-dependence into the already-required
`packDescription()` rewrite), **P-C** (L4, the possible project/program manager
agent).

### Steward acceptance 2026-08-27-2240 (`principal-product-manager`)

`in-review -> completed`, version 3 -> 4, `next_role: null`, lease cleared (all
five fields null). Lease re-read and confirmed matching
(`holder=principal-product-manager`, `token=apx-tax3-acc-20260827-2225-q1`,
`version_at_grant=2`, `version=3`) **before** any state-changing write.
`version_at_grant (2) < version (3)` is the contract-specified held-lease shape
(`kai-core-work-coordination`, *Claiming work safely* step 5 — the grant itself
increments the version), **not** a collision. No collision.

**`scope-acceptance` verdict: APPROVED.** Recorded as `REVIEW 2026-08-27-2240` in
`kai/coordination/threads/area-plugins-taxonomy-round-3.md`. `change_ref` stays
`null` (knowledge item, no diff); the acceptance is bound to the architect's
`DECISION 2026-08-27-2215` entry and the canonical artifact as of that entry.

**Verified independently, not accepted on summary:** the 56/51 counts and their
per-plugin reconciliation; `kai-core-personal-agenda` genuinely **not** a fracture
(two consumers, two packs — the dispatch's premise was wrong and the architect's
correction is right); both directors providing **zero** skills and **zero** assets;
`runtimeDependencyMatrix()` genuinely **throwing** (`pack-plan.mjs:157-170`); and
the six-fracture rule applied consistently across all six cases.

**Rulings.** (1) The `CLAIM_SKILLS` provider-vs-consumer argument **holds** — it
maps onto the real gate predicate (`namespaceErrors()` quantifies over *provides*),
membership stays at **14**, and **operator boundary #1 does NOT trip**. (2)
`director-personal` **rejection upheld**; C4′ accepted; **no third name minted**
inside a window where renames cannot ship. (3) One-sentence jobs: `kai-directors`
**PASS as written**; `kai-project-management` **did not pass as written** and was
**amended** to *"maintains the portfolio's operating rhythm."*

**Two findings recorded, neither blocking:** **F-1** — D-7 carries an unnamed
prerequisite (`director-executive-assistant` lacks all three `AVAILABILITY_RULES`
sentences, so `DISPATCHING_ROLES +1` turns `--gate partition` red until its body is
edited); and the `kai-project-management` job-sentence defect, resolved in-review.

**P-A accepted** (highest-priority consequence; constrains milestone 2), **P-B
accepted** as steward-owned, **P-C accepted as routed and deferred** to the backlog
as scope expansion. No items minted in this review.

**Evidence discipline:** everything remains `reported`; no shell existed and nothing
was executed. All thirteen §12 checks stay `observed`-owed and this approval promotes
none of them.

**No writes** to `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or
`kai/initiatives/pack-split/**`; `area-plugins-m2-claim-surface-pin` untouched.

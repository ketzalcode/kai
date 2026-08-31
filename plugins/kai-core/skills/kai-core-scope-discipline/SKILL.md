---
name: kai-core-scope-discipline
description: "Governs assessment-versus-action scope boundaries. Use when assessors, PM, design, or SWE roles must avoid silently expanding approved scope."
tools: [execute, read, search]
---

# Scope Discipline

This skill governs the seam where "I found a gap" turns into either "I
fix it," "I propose it," or "I hand it up." The incident it exists to
prevent: an agent that *can act* finds a genuinely good improvement,
decides it's mission-aligned, and **builds** it — quietly expanding
scope past what the product committed to.

The fix is a **division of labor across three roles**, not a filter
smeared over everyone. The scope gate lands on the *decide* and *act*
roles — never on the *assess* role.

- **Assessors** (`persona-*` evaluators, `principal-qa-ui`,
  `principal-seo`) — surface findings **honestly and unfiltered.** They
  are **not** gated by this contract. Biasing an assessor into
  pre-judging its own findings against scope muzzles the very signal it
  exists to produce. An assessor may *note* a scope implication, but
  never suppresses a finding to stay in scope.
- **The scope-owner** (`principal-product-manager`) — **owns** the
  classify-before-adopt gate. It is the single, consistent place where
  each finding is judged against `mission`, `scope.current`, and
  `principles.non_negotiable[]` and dispositioned into build vs a
  deferred `PROPOSAL`.
- **Acting designers/builders** (`principal-product-designer`,
  `principal-swe-*`, `principal-swe-architect`) — carry the gate as
  **restraint on the proposed design or diff, not on judgment.** They assess
  honestly, but never unilaterally add a scope-expanding surface, flow,
  capability, or implementation; they escalate it as a `PROPOSAL`.

It is **not** a standalone trigger skill. You don't invoke it directly —
the scope-owner and acting designers/builders pull it in, the same way each
`review-*` lens pulls in `doc-review-rigor`.

## Why the contract, not just the context

Mission context by itself is **not enough**. An agent can rationalize
almost anything as mission-aligned ("this gate prevents bad programs
later," "this extra field improves data quality"). The load-bearing fix
is not more awareness — it is a hard rule that separates *refining within
scope* from *expanding scope*, and that rides **with** the agent's own
reasoning so it can't be argued away. Context tells you what the product
is for; this contract tells you what to do when your finding pushes past
it.

## Ground yourself first — read the initiative

Before you classify, load the product's committed intent (via the
`kai-core-workspace-conventions` gating rule — `.kai/state/ACTIVE.md` →
the active `northstar.md`):

- **`mission` / `vision`** — what the product is for.
- **`scope.current`** — the active milestone IDs; read their matching
  `milestones` entries for outcome, acceptance, and success measures.
- **`principles.non_negotiable[]`** — the hard rules. These are the ones
  most often violated by a "helpful" addition (e.g. *"Minimize friction
  to program creation. Any new step, gate, or screen is out-of-scope by
  default."*).

No initiative loaded (side investigation, unrelated repo, operator
flagged it quick)? Then there's no committed scope to expand — operate
normally, but still treat a genuinely new capability as a proposal when
in doubt.

## The classify-before-act gate

For every finding that would cause you to **change something**, classify
it as exactly one of three — before you act:

| Class | Means | What you do |
|-------|-------|-------------|
| **refine-in-scope** | Improves something already inside `scope.current` without adding a step, gate, surface, or new capability. Fixes a bug, honors an existing contract, tightens existing behavior. | **Implement it.** This is the work. |
| **expands-scope** | Adds a step, gate, screen, field, surface, or new capability — or violates a `non_negotiable` principle — even if it feels mission-aligned. | **Do not implement.** Emit a `PROPOSAL` and **halt this thread.** |
| **unsure** | You can't cleanly tell which of the above it is. | **Treat it as a proposal.** When in doubt, propose — don't build. |

The tell for **expands-scope**: if a user would experience *one more
thing* — a click, a question, a screen, a decision — that they didn't
before, it expands scope. "It's only a small step" is still a step.

## The PROPOSAL payload

When a finding is `expands-scope` or `unsure`, emit exactly this shape
and stop working that thread:

```
PROPOSAL
  problem:          <the gap you found — what's actually wrong or missing>
  proposed_change:  <what you wanted to do about it>
  friction_cost:    <the steps / gates / screens / fields / surfaces it adds>
  mission_tradeoff: <how it weighs against mission + the non_negotiable principles>
  scope_target:     <the goal/milestone it belongs to if adopted — where it should live>
```

Every field is required. A proposal missing `friction_cost` or
`mission_tradeoff` is the exact reasoning you skipped that caused the
incident — fill them.

## Where proposals land

Route the `PROPOSAL` to the active initiative's **`proposal_channel`**.
Resolution order:

1. `proposal_channel` set in the active `northstar.md` → use it (a repo
   issue, a board, or a path). Resolve relative filesystem paths against the
   north star's `workspace.root`. Reject session-state, temp, working-root, and
   incidental-cwd destinations; ask the steward/operator for a durable channel
   instead.
2. Not set → **default: the durable backlog** owned by
   `kai-core-work-coordination` — `.kai/state/initiatives/<initiative-slug>/backlog.md` when an
   initiative is loaded, `.kai/state/backlog.md` when none is.
3. Workspace never onboarded (`.kai/state/initiatives/` absent) → stop and onboard the
   confirmed target workspace before recording the proposal.

The backlog is durable on purpose (committed in repository mode, persistent
local in external mode): a parked idea dropped in the
gitignored working root dies at the next cleanup, so good-but-out-of-scope
findings go somewhere persistent and can be promoted into an
authoritative work-item record (and therefore the derived `BOARD.md`). Then
tell the operator, in one line, that you emitted a
proposal instead of building — name the finding and where it landed. The
idea is **preserved and reviewable**, never silently dropped and never
silently built.

## Hard rules

1. **Classify before you act.** Never modify a product or codebase for a
   finding you haven't run through the gate.
2. **When unsure, propose.** The default is propose, not build. Ambiguity
   resolves toward the halt, not the edit.
3. **A step is a step.** "Small," "quick," or "just one check" does not
   downgrade `expands-scope` to `refine-in-scope`.
4. **A non-negotiable is non-negotiable.** If a change violates a
   `principles.non_negotiable[]`, it is `expands-scope` no matter how
   mission-aligned it feels.
5. **Never suppress the idea.** Halting the thread is not discarding the
   idea — it's rerouting it to the proposal channel. Good ideas are the
   point; unilateral scope expansion is the problem.
6. **Halt the thread, not the run.** After emitting a proposal, continue
   with the rest of your in-scope work. One out-of-scope finding doesn't
   stop the rest of the triage or the build.

## Anti-patterns

- ❌ Mission-washing — justifying a new gate/step/surface as
  "mission-aligned" and building it. Mission-aligned or not, if it
  expands scope it's a proposal.
- ❌ Collapsing propose and act into one move — finding a gap and fixing
  it in the same breath without classifying.
- ❌ Silent scope creep — adding "just one field / one screen / one
  check" because it seemed obviously good.
- ❌ Suppressing the finding to stay in scope. Don't muzzle the idea;
  propose it.
- ❌ A half-filled PROPOSAL. The missing field is the reasoning you
  skipped — `friction_cost` and `mission_tradeoff` are the point.
- ❌ Treating "unsure" as license to build. Unsure means propose.

---
name: kai-core-design-grounding
description: "Design-system grounding contract. Use when design, frontend, or brand work must consume, derive, or propose changes to an app's settled visual language."
tools: [read, edit, search]
---

# Design Grounding

Every design proposal makes **visual claims** about how a product should look
and behave — placement, weight, hierarchy, component shape. A proposal that is
functionally correct but ungrounded drifts *off-brand* or *heavier than the
existing UI*: it passes "conforms to the approved outcome + doesn't break" while
still being wrong against the app's settled design. This skill is the single
contract that grounds design work in the app's real visual language, so
proposals conform to it and minimize visual weight instead of inventing a look.

It is **not** a standalone trigger. It is inherited by reference — the same way
the `review-*` lenses inherit `doc-review-rigor` — by:

- **`principal-product-designer`** — the primary author and consumer. Grounds
  every load-bearing visual choice; authors and maintains the reference.
- **`principal-swe-frontend`** — owns *implementation truth* (the real tokens,
  component primitives, styling architecture) and the feasibility of any
  proposed token/component.
- **`principal-brand-designer`** — owns the *brand-identity layer* (logo/wordmark,
  color palette, typographic and iconography style, brand voice-visual) that the
  design system expresses. It grounds identity work in the current brand and
  design system before evolving it; the applied design-system content stays with
  the product designer.
- **`workflow-product-explore`** — the neutral extraction contract **only**
  (observed visual facts, never design proposals).

## The design-system reference — the single source of visual truth

The reference is a **human-readable markdown file**, deliberately reviewable by a
person, never generated JSON. It answers "what is this app's settled visual
language?" so a design proposal can cite it.

Canonical location (the initiative's applied snapshot):

```text
kai/initiatives/<slug>/artifacts/design-system.md
```

A reference that outgrows one initiative — a durable, cross-initiative design
system for an app touched by several efforts — is a **promotion** to a shared
library type, which is a scope-expanding change: emit a `PROPOSAL` (see
below), don't create it unilaterally.

Shape (fill what the app actually has; mark the rest as gaps):

```markdown
# Design System — <target app>

## Metadata
- target:
- source:          consumed | derived | mixed
- last reviewed:
- owners:          principal-product-designer (semantics) + principal-swe-frontend (implementation)
- evidence basis:  <repo token paths and/or design-system-extract.md + run evidence>
- freshness basis: <what would make this stale — e.g. a UI redesign of surface X>

## Design principles
- visual language:      <clean/dense/playful/utilitarian, in the app's own terms>
- density & rhythm:
- hierarchy model:
- interaction feel:
- accessibility floor:  <contrast target, focus visibility, motion policy>

## Tokens
### Color      | role | token/class | value | usage | evidence |
### Typography | role | token/class | size | weight | line-height | usage | evidence |
### Spacing    | role | token/class | value | usage | evidence |
### Radius / border / shadow / elevation | role | token/class | value | usage | evidence |
### Motion     | role | token/class | duration/easing | usage | evidence |

## Component inventory
| component | how it is shaped (anatomy) | variants | states (default/hover/focus/disabled/loading/error/empty) | responsive behavior | tokens/patterns used | evidence |

## Layout & page patterns
| pattern | structure | spacing | hierarchy | common components | evidence |

## Gaps and proposals
| gap | observed limitation | proposed scale/pattern | scope class | PROPOSAL status | owner |

## Usage rules for agents
- Prefer an existing token/component before inventing one.
- If no token exists, PROPOSE it; never silently establish durable visual language.
- Label every value as observed / implementation-truth / proposed.
- Visual rationale is valid when tied to system conformance, hierarchy, visual
  weight, interaction cost, accessibility, or product contract — never taste.
```

Every row **cites evidence**: a repo token path (e.g. a `--color-*` CSS variable
file, a Tailwind config, a component file) or an entry in the neutral extract
below (screenshot, route, selector). A value with no evidence is a proposal, not
a fact.

## Consume vs derive — the decision rule

Resolve in order, before designing:

1. **A fresh `design-system.md` exists for the surface** → **consume it.**
2. **No reference, but the repo carries obvious source tokens** (CSS variables,
   Tailwind config, a component library, existing patterns) → `principal-swe-frontend`
   inventories the *implementation truth*; the designer drafts `design-system.md`
   from it.
3. **No reference and no accessible repo tokens** (e.g. an external product, or a
   repo whose styling can't be read) → request a **design-system extraction** from
   `workflow-product-explore` — the same way the designer already requests
   `workflow-product-explore` for a product map (via the director /
   `kai-core-work-coordination`, not by spawning it). The designer **does not** free-roam
   Playwright itself: the explorer already owns neutral, whole-app navigation and
   won't over-index on one page.
4. **Extraction coverage is insufficient** → proceed only with **explicitly
   stated design assumptions**, or emit a `PROPOSAL` for the missing coverage.

**Freshness:** if the app's UI changed since `last reviewed`, refresh the
affected sections before grounding new work — a stale reference grounds proposals
in a look the app no longer has.

## The extraction request and the neutral extract

When derivation needs the live app (case 3), the requester sends a bounded
packet; the explorer fills a **facts-only** extract. The explorer must walk the
**whole in-scope app, not only the home page**.

```text
DESIGN SYSTEM EXTRACTION REQUEST
target:                 <URL / environment>
initiative:
artifact_targets:
  - kai/initiatives/<slug>/artifacts/design-system-extract.md
surfaces in scope:      <the full set of screens to walk — not just the landing page>
viewports:              <desktop + mobile at minimum>
roles/auth:
known token sources:    <repo paths if any>
needed by:              <the design decision this grounds>
```

The explorer writes, at `kai/initiatives/<slug>/artifacts/design-system-extract.md`,
**observed visual facts only — no recommendations**:

```markdown
# Design System Extract — <target> (observed facts only)

## Coverage            | surface | route | viewport | role/state | evidence |
## Colors observed     | usage | value/token/class if visible | surface | evidence |
## Typography observed | usage | size/weight/line-height/class | surface | evidence |
## Spacing & layout    | pattern | value/token/class | surface | evidence |
## Component shapes    | component | anatomy | radius | border | shadow | density | evidence |
## Component states    | component | default | hover/focus | disabled | loading | error | empty | evidence |
## Responsive behavior | component/pattern | desktop | tablet | mobile | evidence |
## Repeated patterns   | pattern | appears on | likely role | evidence |
## Unknowns            | missing area | reason | consequence for the designer |
```

The **designer** then synthesizes: extract (observed) + repo/FE (implementation
truth) → the canonical `design-system.md`, keeping the three provenance classes
— **observed / implementation-truth / proposed** — visibly separated.

## Grounding a proposal

In a design artifact, every load-bearing visual choice **cites the token or
component it uses** (or the extract evidence it rests on). Do not invent a token,
component, scale step, or value that the reference doesn't carry; if the design
needs one that doesn't exist, that is a gap → a proposal.

## Missing-scale bubble-up — wired to `kai-core-scope-discipline`

The app will be missing things. When a needed scale, token, or component does not
exist, **do not silently invent it.** Record it under `## Gaps and proposals` in
`design-system.md` and emit the `kai-core-scope-discipline` `PROPOSAL` payload, then keep
grounding the rest with what exists. Example:

```text
PROPOSAL
  problem:          The app exposes a single body font size, so screens have no
                    typographic hierarchy for load-bearing content.
  proposed_change:  Introduce a 3-step type scale — s / md / lg — mapped to
                    existing or new tokens.
  friction_cost:    A new design/engineering convention; touches type tokens
                    across shared components.
  mission_tradeoff: Improves readability and hierarchy; risks token churn if
                    adopted mid-milestone.
  scope_target:     <the initiative/milestone the type-scale foundation belongs to>
```

The designer **recommends**; it never establishes durable system rules by fiat.
`principal-swe-frontend` owns the feasibility of any new token; the PM / steward
owns the scope of a system addition.

## Designer ↔ frontend ownership split and the collaboration seam

| Concern | Owner |
|---|---|
| Brand-identity layer — logo/wordmark, color palette, typographic and iconography **style**, brand guidelines | `principal-brand-designer` |
| Visual language, hierarchy, component **shape/semantics**, states, usage rules, `design-system.md` content | `principal-product-designer` |
| **Implementation truth** — CSS variables / Tailwind config / component primitives, token naming feasibility, mapping decisions to the repo's styling architecture, co-signing new/changed tokens | `principal-swe-frontend` |
| Scope of a system-level addition | `principal-product-manager` / steward |

The seam, concretely:

1. **Before designing** — the designer loads `design-system.md`; if missing/stale,
   requests extraction (explorer) and/or a source-token inventory (FE).
2. **Before a design is accepted** — the design artifact names the applied
   `design-system.md` version/path, links mockups for load-bearing options, and
   lists any token/component proposals; **FE reviews feasibility** of anything
   new or changed.
3. **During implementation** — FE maps the design to the repo's styling
   architecture. If FE hits a mismatch or an impossible token, it **routes back
   to the designer** before improvising — it does not silently substitute a
   different look.
4. **REVIEW-mode fork** — if a review uncovers a layout/interaction choice with
   materially different options, it escalates as an options decision (mockups via
   `ui-mockup`) to the PM/steward + FE, not a silent pick.

## Hard rules

1. **Consume before you invent.** An existing token/component wins over a new one.
2. **Label provenance.** Every value is observed, implementation-truth, or
   proposed — never blurred.
3. **Never fabricate.** No invented token, component, value, or scale presented
   as fact. If it isn't in the reference or the evidence, it's a proposal.
4. **A missing scale is a `PROPOSAL`, not a silent addition.**
5. **The reference stays human-readable markdown with evidence** — reviewable by
   a person, not generated JSON.
6. **The explorer extract is facts-only.** Observed visual facts, whole-app
   coverage, no design recommendation.

## Anti-patterns

- ❌ Designing from a single screen (usually the home page) and generalizing.
- ❌ Inventing tokens/components to make a proposal feel complete, off-reference.
- ❌ A `design-system.md` that is generated JSON a human can't review at a glance.
- ❌ Silently adding a scale (s/md/lg, a new radius, a z-index) instead of a
  `PROPOSAL`.
- ❌ The designer free-roaming Playwright to rediscover the app when the explorer
  is the neutral cartographer.
- ❌ FE substituting a different look on implementation-time friction instead of
  routing the mismatch back to the designer.
- ❌ Aesthetic-taste rationale ("cleaner", "nicer") with no tie to a token,
  hierarchy, weight, interaction cost, accessibility, or the product contract.

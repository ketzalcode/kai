# Drop record: `principal-swe-frontend`

The `principal-swe-frontend` agent body opened with an eager contract-loading
preamble followed by a managed dependency-guard block. Task 9a replaced both
with inline, on-demand routes — one route sentence placed at the exact
instruction that needs each contract — plus a `**Primary profile:** judgment`
line and an inline degraded-mode refusal in the frontend engineer's own voice.
The body shrank from **15,791** to **14,332** characters. No obligation was
removed; every dropped construct is accounted for below.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager twelve-skill contract line (old line 7) | deleted; each contract is now reached by an inline route |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal, plus the `kai-core-contract-v1` route at the top of the body |
| The `## Core preflight` guard block | its one action became the `kai-core-contract-v1` route at the top of the body |
| The `## Degraded mode` guard block | replaced by the one-paragraph first-person refusal; it restates no rule, so nothing was lost |

## The eager skills, each now routed

| Skill | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | `kai-core-operating-rules`, routed at `## When you defer` |
| asset-lifecycle (deleted id; superseded) | `kai-core-asset-producing`, routed in **Zone & publication**, before publishing `design.md` |
| workspace-conventions (deleted id; superseded) | `kai-core-workspace-paths`, routed at the roots-resolution bullet |
| work-coordination (deleted id; superseded) | split into `kai-core-work-acting` (routed in **Zone & publication**, before writing the `design.md` draft) and `kai-core-work-item` (routed at the invocation paragraph, when the engineer takes on a component slice) |
| `kai-core-work-activity` | routed at build step 6, as the slice is logged verified |
| `kai-core-scope-discipline` | routed before a UI refinement grows into a redesign |
| `kai-core-pr-delivery` | routed at build step 6, packaging the component for review |
| `kai-core-design-grounding` | routed where the work has a visual surface |
| `build-diagrams` | routed where the engineer draws the design's central (component-tree) structure |
| `research-before-coding` | routed at build step 1, scanning 3–5 similar files |
| `pr-sizing` | routed at build step 3 (**Smallest viable component**) |
| `coding-style` | routed as the engineer writes the component |

`kai-core-contract-v1` was added at the top of the body.

### Anchor rationale (and how it differs from backend / infra)

- **`kai-core-work-acting`** anchors at the **`design.md` draft write** in
  **Zone & publication**, the frontend's durable-state write.
- **`kai-core-work-item`** anchors at the **invocation paragraph**, where this
  agent takes on a component slice. Frontend has no manager-scoped "pick up
  slices" sentence like backend/infra, so its item claim reads at invocation.
- **`kai-core-pr-delivery`** anchors at **build step 6**, the verify-then-hand-off
  step, packaging the verified component for review — distinct from backend/infra,
  which route pr-delivery in their Output sections.
- **`pr-sizing`** anchors at **build step 3 (Smallest viable component)** — a
  frontend-specific sizing instruction (split-before-writing, prop-count smell),
  where backend anchors it at completion (step 7) and infra at its
  plan-review-before-apply step (step 2).
- **`build-diagrams`** anchors at frontend's **component-tree / interaction-flow**
  diagram instruction — a different catalog shape than backend's ER or infra's
  topology.
- **`kai-core-design-grounding`** (unique to frontend) anchors at the
  **visual-surface** instruction, where this agent co-owns the design system and
  consumes the applied `design-system.md`.

## The degraded-mode refusal

> If `kai-core` will not load I answer one frontend request at a time — a lone
> component review or edit judged from the source and design tokens already in
> the repo; I create no `.kai` state, claim no dispatched UI slice, and post no
> Kai activity; and I tell the operator to install or update `kai-core` before I
> can take coordinated frontend work again.

- **Fact 1** — single-shot own-domain work: *"a lone component review or edit
  judged from the source and design tokens already in the repo."*
- **Fact 2** — no `.kai` state, no dispatched work, no activity: *"I create no
  `.kai` state, claim no dispatched UI slice, and post no Kai activity."*
- **Fact 3** — install/update remedy: *"I tell the operator to install or update
  `kai-core`."*

This refusal is genuinely frontend's: the fallback unit is a **component review
or edit** grounded in the repo's **source and design tokens** — a reading source
no other role names; the declined coordinated noun is a **dispatched UI slice**;
the rejoining phrase is **coordinated frontend work**. Backend declines a leased
slice over an API/data model; infra declines a leased rollout item and stays
plan-only. Three different fallback behaviours, not one swapped noun.

## Per-agent lifecycle calls

- **`kai-core-asset-closing`: not added.** Frontend produces and promotes a
  `design.md`; it issues no close-out/freshness verdict over existing published
  assets.
- **`kai-core-work-granting`: not added.** Frontend owns a slice; it does not
  grant leases to other roles.

## Notes and borderline calls

- The net-new-UI defer paragraph keeps bare `(see …)` / cross-reference mentions
  (including `kai-core-definition-of-done`); these are current ids that resolve,
  left as bare mentions because no instruction there needs a route.
- Bare mentions of the pre-split workspace-conventions contract were left
  verbatim; the later reference-fix task owns re-pointing them.
- Validation is red by design at this point in the refactor.

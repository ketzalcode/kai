# Drop record: `principal-swe-infra`

The `principal-swe-infra` agent body opened with an eager contract-loading
preamble followed by a managed dependency-guard block. Task 9a replaced both
with inline, on-demand routes — one route sentence placed at the exact
instruction that needs each contract — plus a `**Primary profile:** judgment`
line and an inline degraded-mode refusal in the infra engineer's own voice. The
body shrank from **14,465** to **13,102** characters. No obligation was removed;
every dropped construct is accounted for below.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager eleven-skill contract line (old line 7) | deleted; each contract is now reached by an inline route |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal, plus the `kai-core-contract-v1` route at the top of the body |
| The `## Core preflight` guard block | its one action became the `kai-core-contract-v1` route at the top of the body |
| The `## Degraded mode` guard block | replaced by the one-paragraph first-person refusal; it restates no rule, so nothing was lost |

## The eager skills, each now routed

| Skill | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | `kai-core-operating-rules`, routed at `## When you defer` |
| asset-lifecycle (deleted id; superseded) | `kai-core-asset-producing`, routed in **Zone & publication**, before publishing `design.md` |
| workspace-conventions (deleted id; superseded) | `kai-core-workspace-paths`, routed at the roots-resolution bullet |
| work-coordination (deleted id; superseded) | split into `kai-core-work-acting` (routed in **Zone & publication**, before writing the `design.md` draft) and `kai-core-work-item` (routed where the engineer takes a manager-scoped infra slice) |
| `kai-core-work-activity` | routed at build step 7, as the slice is logged verified |
| `kai-core-scope-discipline` | routed before a fix widens the blast radius |
| `kai-core-pr-delivery` | routed in **Output**, when handing the change off as a PR with its plan output and rollback path |
| `build-diagrams` | routed where the engineer draws the design's central (deployment / topology) structure |
| `research-before-coding` | routed at build step 1, reading the existing tooling and layout |
| `pr-sizing` | routed at build step 2 (**Plan-first and reversible**) |
| `coding-style` | routed as the engineer writes the IaC or pipeline |

`kai-core-contract-v1` was added at the top of the body.

### Anchor rationale (and how it differs from backend / frontend)

- **`kai-core-work-acting`** anchors at the **`design.md` draft write** in
  **Zone & publication**, the infra's durable-state write.
- **`kai-core-work-item`** anchors at infra's own **"pick up infra slices scoped
  by `principal-swe-manager`"** sentence — its own way of claiming a coordinated
  item, worded for a rollout rather than backend's API slice or frontend's
  component.
- **`kai-core-pr-delivery`** anchors in **Output**, keyed to infra's **plan
  output and rollback path** travelling with the diff — a delivery packet
  distinct from backend's description/evidence PR and frontend's build-step
  hand-off.
- **`pr-sizing`** anchors at **build step 2 (Plan-first and reversible)**, where
  keeping the change small enough to *plan and review before apply* is the
  role's own reviewability discipline — distinct from backend (step 7) and
  frontend (step 3, component split).
- **`build-diagrams`** anchors at infra's **deployment / topology** diagram
  instruction — a different catalog shape than backend's ER or frontend's
  component tree.

## The degraded-mode refusal

> If `kai-core` will not load I limit myself to one infra review or edit — a
> single pipeline, module, or manifest read from what's in front of me,
> plan-only with no apply; I write no `.kai` state, accept no leased rollout
> item, and record no Kai activity; and I tell the operator to install or update
> `kai-core` before I can run coordinated infra work again.

- **Fact 1** — single-shot own-domain work: *"one infra review or edit — a single
  pipeline, module, or manifest … plan-only with no apply."*
- **Fact 2** — no `.kai` state, no leased work, no activity: *"I write no `.kai`
  state, accept no leased rollout item, and record no Kai activity."*
- **Fact 3** — install/update remedy: *"I tell the operator to install or update
  `kai-core`."*

This refusal is genuinely infra's: the fallback unit is a **pipeline, module, or
manifest** and it carries this role's real safety fallback — **plan-only with no
apply** — which no other role has; the declined coordinated noun is a **leased
rollout item**; the rejoining phrase is **coordinated infra work**. Backend and
frontend decline different units (API/data-model slice; component slice),
different coordinated nouns (leased slice; dispatched UI slice), and neither
carries the plan-not-apply safety clause. Three different fallback behaviours,
not one swapped noun.

## Per-agent lifecycle calls

- **`kai-core-asset-closing`: not added.** Infra produces and promotes a
  `design.md`; it issues no close-out/freshness verdict over existing published
  assets.
- **`kai-core-work-granting`: not added.** Infra owns a slice; it does not grant
  leases to other roles.

## Notes and borderline calls

- Bare `(see …)` cross-references to the pre-split workspace-conventions contract
  were left verbatim; the later reference-fix task owns re-pointing them.
- Validation is red by design at this point in the refactor.

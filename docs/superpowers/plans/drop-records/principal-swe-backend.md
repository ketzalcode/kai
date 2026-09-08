# Drop record: `principal-swe-backend`

The `principal-swe-backend` agent body opened with an eager contract-loading
preamble followed by a managed dependency-guard block. Task 9a replaced both
with inline, on-demand routes — one route sentence placed at the exact
instruction that needs each contract — plus a `**Primary profile:** judgment`
line and an inline degraded-mode refusal in the backend engineer's own voice.
The body shrank from **15,241** to **13,813** characters. No obligation was
removed; every dropped construct is accounted for below.

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
| work-coordination (deleted id; superseded) | split into `kai-core-work-acting` (routed in **Zone & publication**, before writing the `design.md` draft) and `kai-core-work-item` (routed where the engineer claims a manager-scoped backend slice) |
| `kai-core-work-activity` | routed at build step 7, as the slice is logged done |
| `kai-core-scope-discipline` | routed before committing a diff |
| `kai-core-pr-delivery` | routed in **Output**, when handing the code off as a PR |
| `build-diagrams` | routed where the engineer draws the design's central (ER / sequence) structure |
| `research-before-coding` | routed at build step 1, scanning 3–5 similar files |
| `pr-sizing` | routed at build step 7, keeping the change one reviewable slice |
| `coding-style` | routed as the engineer writes the code |

`kai-core-contract-v1` was added at the top of the body.

### Anchor rationale (and how it differs from frontend / infra)

- **`kai-core-work-acting`** anchors at the **`design.md` draft write** in
  **Zone & publication**, the backend's durable-state write.
- **`kai-core-work-item`** anchors at the **slice-pickup sentence** ("You
  commonly pick up backend slices scoped by `principal-swe-manager`") — backend's
  own way of describing where it claims a coordinated item. Frontend has no such
  sentence and routes work-item at its invocation paragraph; infra routes it at
  its own "pick up infra slices" sentence.
- **`kai-core-pr-delivery`** anchors in **Output**, where backend code lands in
  the repo as a PR with its description and evidence. Frontend routes pr-delivery
  at its verify-and-hand-off build step; infra routes it in Output but keyed to
  its plan/rollback evidence.
- **`build-diagrams`** anchors at backend's **ER / sequence** diagram
  instruction — a different catalog shape than frontend's component tree or
  infra's deployment topology.

## The degraded-mode refusal

> If `kai-core` will not load I fall back to a single backend read or edit — one
> API surface, data model, or migration reasoned from the code in front of me
> and nothing more; I persist no `.kai` record, pick up no leased slice, and
> report no Kai activity; and I tell the operator to install or update
> `kai-core` before I can rejoin coordinated backend delivery.

- **Fact 1** — single-shot own-domain work: *"a single backend read or edit —
  one API surface, data model, or migration."*
- **Fact 2** — no `.kai` state, no leased work, no activity: *"I persist no
  `.kai` record, pick up no leased slice, and report no Kai activity."*
- **Fact 3** — install/update remedy: *"I tell the operator to install or update
  `kai-core`."*

This refusal is genuinely backend's, not a noun-swap: the fallback unit is a
backend read/edit over an API, data model, or migration; the declined
coordinated noun is a **leased slice**; the rejoining phrase is **coordinated
backend delivery**. Frontend and infra decline different units of work
(component slice; plan-only infra edit), different coordinated nouns (dispatched
UI slice; leased rollout item), and rejoin different flows.

## Per-agent lifecycle calls

- **`kai-core-asset-closing`: not added.** Backend produces and promotes a
  `design.md`; it does not issue a close-out/freshness verdict over existing
  published assets, so `kai-core-asset-producing` is the only lifecycle contract
  its instructions need.
- **`kai-core-work-granting`: not added.** Backend owns a slice; it does not
  grant leases to other roles.

## Notes and borderline calls

- Bare `(see …)` cross-references to the pre-split workspace-conventions contract
  were left verbatim; the later reference-fix task owns re-pointing them.
- Validation is red by design at this point in the refactor.

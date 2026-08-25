---
type: work-item
id: pack-split-host-semantics-spike
title: Spike — verify unproven host semantics on macOS + cloud before extraction
initiative: pack-split
milestone: first-pack-extracted
delivery_class: knowledge
state: ready
resume_state: null
priority: 30
owner: null
next_role: principal-swe-infra
target: pack-split host behavior de-risk (macOS + cloud + install order)
artifact_target: kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - docs/proposals/pack-architecture.md
  - scripts/pack-preview.mjs
  - scripts/lib/pack-plan.mjs
touches:
  - kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md
depends_on:
  - item: pack-split-partition-lock
    requires: completed
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
updated: 2026-08-25-1139
---

## Outcome

A recorded answer to the load-bearing unknown the proposal proved only on Windows CLI:
does an agent in a department pack resolve a `kai-core-*` skill from core on **macOS** and
the **cloud host**; does collision/load-order hold under **real install** order and
**marketplace-vs-direct**; does a **fresh session** load newly-installed plugins; and do
`hooks.json` hooks fire **once** or per-plugin. Time-boxed; gates the first real tree generation.

## Acceptance

*Command form made exact by the steward at promotion 2026-08-25-1139 against `main` at
`v0.58.0`. No question was added, removed, or re-scoped, and the time-box stands.*

- [ ] Each question above answered with evidence captured from a **throwaway** build —
      `node scripts/pack-preview.mjs --all --out <dir>` — installed on macOS + one cloud host.
      Nothing is committed by this item: `COMMITTED_PACKS` is empty on `main`, so
      `pack-preview --write` refuses by design and no `packs/` tree can appear.
- [ ] A clear go / no-go for `pack-split-generated-pack-trees`: good answer = proceed;
      bad answer = re-open directors-in-core vs `kai-orchestrator` and the hooks-ownership
      mechanism with the steward + architect **before** any tree is committed.
- [ ] Findings recorded at the `artifact_target` with each answer marked **verified** (run on a
      host) or **unverified** (not reached in the time-box) — an unanswered question is recorded
      as unanswered, never inferred from the Windows CLI evidence.

## Evidence

- (to be filled) — operator host-run transcript + the reliability record at the artifact target.

## Notes

- **Manager spike (de-risk).** Front-loaded per "prove the risky host semantics, and only then
  move agents." Design is `principal-swe-infra`; the host runs are **operator-executed** (this
  role cannot run external host gates). Runs in parallel with the dependency-guarantees work.
- Supporting item, not a closure gate — `pack-split-host-gates` is the formal certification.
  Steward may fold this into that item as an early phased arm (see decomposition *Scope negotiations*).

### Steward promotion — 2026-08-25-1139 (`principal-product-manager`)

**`proposed -> ready`, priority 20 -> 30, `next_role: principal-swe-infra`, version 1 -> 2.**

- **Dependency verified.** `pack-split-partition-lock (requires: completed)` is `completed`
  (locked partition document, `independent-architecture` review ratified at
  `change_ref fd44f4f…`). Satisfied since 2026-08-24.
- **Why a `first-pack-extracted` item is promoted while `scope.current` is
  `[dependency-guarantees]` — and what that does *not* mean.** This promotion schedules work
  the **already-ratified** plan of record authorizes; it invents nothing:
  - decomposition **WS#2** front-loads this spike explicitly to "run **in parallel** with the
    dependency-guarantees work", because its answer changes the extraction plan before anyone
    spends the extraction investment;
  - the steward already decided this on 2026-08-24 (`log.md`): *"Kept `host-semantics-spike` as
    a separate gating spike (one operator session can save the extraction investment)"*, and it
    has stood as "recommended for parallel operator dispatch" on `ACTIVE.md` since;
  - its findings touch a **current-milestone** contract: the hooks-firing answer is adjacent to
    the `hooks.json` exactly-one-pack rule that `pack-split-crosspack-validator` is about to
    cement in CI.
  **Explicitly unchanged:** `scope.current` stays `[dependency-guarantees]` —
  `first-pack-extracted` is **not** activated; `milestone` stays `first-pack-extracted`;
  `required_for_milestone` stays **false** — this is not a closure gate for any milestone, and
  `pack-split-host-gates` remains the formal certification; the northstar `deferred` entry
  (full macOS/cloud **certification**) is untouched, and the prior steward decision that host
  gates are a **minimal smoke gate** stands. No milestone semantics were changed.
- **Priority 30 — deliberately behind both guarantee items.** `principal-swe-infra` is the
  initiative's single-owner bottleneck; this yields to `preflight-compat` (10) and
  `crosspack-validator` (20). Its probe/evidence-template design is small and parallel-safe;
  its cost is operator host-time, not infra time.
- **Execution reality named, not hidden.** `principal-swe-infra` designs the probe and the
  evidence template; the macOS + cloud host runs are **`@operator`-executed** — no kai role can
  run an external host gate. This item therefore cannot reach `completed` without one operator
  host session. That is a scheduling dependency on a human, not a blocked state, so it is
  recorded here and in the thread rather than parked as a question.
- **Third acceptance criterion added (verified vs unverified).** Carried from this initiative's
  own recorded practice at the `generator-gates` ship gate, where operator-attested checks were
  labelled as attested rather than dressed up as independently verified. Since the host runs are
  operator-executed, the record must mark each answer's provenance; an unanswered question is
  recorded unanswered, never inferred from the existing Windows CLI evidence.
- **Unchanged, deliberately:** the questions, the time-box, `delivery_class: knowledge`, the
  empty `review_requirements` (spike findings are reviewed informally by the architect), the
  `completed` closure semantics, and the go/no-go gate on
  `pack-split-generated-pack-trees` — which keeps its declared `depends_on` on this item. No
  architecture decision was made or re-opened.

---
type: work-item
id: pack-split-host-semantics-spike
title: Spike — verify host semantics before extraction
initiative: pack-split
milestone: first-pack-extracted
delivery_class: knowledge
state: completed
resume_state: null
priority: 30
owner: principal-swe-infra
next_role: principal-product-manager
target: pack-split host behavior de-risk and extraction/publication gate boundary
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
version: 3
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-26-1320
---

## Outcome

A recorded answer to the load-bearing host unknowns, with the extraction gate
separated from the publication gate. Windows throwaway evidence decides whether
committed-unpublished trees may proceed; macOS, cloud, persistent install order,
marketplace-vs-direct collision, and fresh-session activation remain formal
publication gates.

## Acceptance

- [x] Host questions recorded from a throwaway
      `node scripts/pack-preview.mjs --all --out <dir>` build, with each answer
      marked **verified** or **unverified** and no unrun host inferred from
      Windows evidence.
- [x] A clear conditional GO for `pack-split-generated-pack-trees`: proceed with
      committed-unpublished core + personal after the delegated `skill` fix;
      keep publication blocked on the formal host matrix.
- [x] The nested-agent failure was reproduced from an empty workspace, fixed in
      canonical source, released as `v0.63.1`, and re-verified against freshly
      generated throwaway core + personal trees.
- [x] macOS, cloud managed install, persistent order, marketplace-vs-direct
      collision, and fresh-session activation are explicitly relocated to
      `pack-split-host-gates`; none is reported verified here.

## Evidence

- Reliability record:
  `kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md`.
- Windows Copilot CLI `1.0.80`; deterministic discovery used
  `COPILOT_PLUGIN_DIR_ONLY=true`.
- Canonical delegated-agent fix: PR #165, merge
  `f112075f3fe63d7d64f0808b7f5cd12ad1f28e87`, release `v0.63.1`.

## Notes

- **Manager spike (de-risk).** Front-loaded per "prove the risky host semantics, and only then
  move agents." Design is `principal-swe-infra`; the host runs are **operator-executed** (this
  role cannot run external host gates). Runs in parallel with the dependency-guarantees work.
- Supporting item, not a closure gate — `pack-split-host-gates` is the formal certification.
  Steward may fold this into that item as an early phased arm (see decomposition *Scope negotiations*).

### Completion — 2026-08-26-1320

The original macOS + cloud acceptance was unsatisfiable for a local throwaway
tree: `--plugin-dir` is a local/session path, while a true cloud run needs an
installable source plus managed plugin settings. The gate was therefore
**reshaped, not weakened**:

- this spike decides whether an unpublished generated tree may be committed;
- `pack-split-host-gates` still blocks publication on macOS, cloud, persistent
  install order, marketplace/direct collision, and fresh-session evidence.

Architecture consultation chose canonical `skill` declarations over generator
frontmatter mutation, and deferred A1 until a core agent is observed operating
with inherited skills unloaded after that fix. The conditional extraction GO
is now recorded; the item is `completed`.

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

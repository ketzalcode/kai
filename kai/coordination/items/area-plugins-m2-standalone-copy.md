---
type: work-item
id: area-plugins-m2-standalone-copy
title: Product copy for standalone-block.txt — the two honest paths, the one-sentence mode line, and the five pinned disclaimers
initiative: area-plugins
milestone: optional-core-contract
delivery_class: knowledge
state: completed
resume_state: null
priority: 10
owner: null
next_role: null
target: standalone-block product copy
artifact_target: null
artifact_target_status: blocked-on-directory-creation; durable record is this item's thread until the initiative directory exists
context_artifacts:
  - kai/coordination/threads/area-plugins-m2-decomposition.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - scripts/lib/preflight-block.txt
  - scripts/lib/degraded-block.txt
  - scripts/lib/inherits-block.txt
touches:
  - kai/coordination/items/area-plugins-m2-standalone-copy.md
  - kai/coordination/threads/area-plugins-m2-standalone-copy.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-infra
    kind: doc-review
completed_reviews:
  - role: principal-swe-infra
    kind: doc-review
    change_ref: null
    verdict: approved-with-conditions
    evidence: "kai/coordination/threads/area-plugins-m2-standalone-copy.md (REVIEW 2026-08-27-2015)"
    record_revision: "item version 5 / thread entry DELIVERABLE 2026-08-27-2001 §1 (knowledge item, no diff)"
    timestamp: 2026-08-27-2015
    findings: P0 0, P1 4, P2 7
    conditions_bind: area-plugins-m2-mode-selection
change_ref: null
version: 6
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-2015
---

## Outcome

The exact sentences `scripts/lib/standalone-block.txt` will carry, written and
reviewed, so `area-plugins-m2-mode-selection` can pin published user-facing copy
instead of shipping a generator default.

## Acceptance

- [x] **The one-sentence mode line** is written: one sentence, on the first reply
      of a standalone session, naming the mode and the upgrade and nothing more.
      Condition **C1** binds — it is not negotiable downward.
      — thread §2; bullet 1 of the copy.
- [x] **Two honest paths**, exactly one of each: one "install `kai-core`" path and
      one "continue in standalone mode" path. — thread §3; bullets 3 and 4.
- [x] **Five pinned disclaimers**, one prohibition line each: no durable
      coordination · no fleet visibility · no leases · no handoffs · no
      shipped-state claims. Plus the two named explicitly rather than folded in:
      no initiative artifacts, no review or approval records.
      — bullets 5–11, one clause per line; map in thread §5.
- [x] **The anti-nag pair** is present as text: an explicit `once` instruction and
      an explicit do-not-repeat prohibition.
      — `Say once, in your first reply:` (b1) and `Do not repeat it.` (b2).
- [x] **A no-retroactive-promotion prohibition** is present: a file from a prior
      standalone session is never cited as prior work, evidence, or a satisfied
      acceptance. — bullet 14; read with bullet 15, thread §8.
- [x] **One honest capability line** stating that the shared grounding and
      source-evaluation skills ship with `kai-core`, so the Capability-family loss
      is disclosed rather than silent. — bullet 16.
- [x] The copy **conforms mechanically** to what `standaloneBlockErrors()` will
      lint: it names `` `kai-core` ``; it only refuses, prohibits, or offers the
      one remedy; it does **not** carry the `KAI-CORE-MISSING` token; it does
      **not** state a `contract:` version; it restates no core contract line
      (`coreContractLines()`); it fits the size budget.
      — verified by inspection, thread §5. **Size is the one conditional
      clause:** ~2,038 characters, which does not fit `DEGRADED_BLOCK_MAX = 1200`;
      the copy fits a `STANDALONE_BLOCK_MAX` derived from the required clause
      count (recommended 2400). See thread §6 — setting it lower cuts a required
      clause and returns to `principal-product-manager`.
- [x] The four forbidden path literals are stated as prohibitions: no `.kai`
      segment, no `manifest.json`, no `kai/coordination|initiatives|library`, no
      state whose location the agent chose. — bullets 12 and 13.
- [x] The copy is recorded verbatim in this item's thread, ready to be pasted
      into the new block file by the implementing item.
      — `kai/coordination/threads/area-plugins-m2-standalone-copy.md`,
      DELIVERABLE 2026-08-27-2001 §1.

## Evidence

- **The copy itself, verbatim and paste-ready:**
  `kai/coordination/threads/area-plugins-m2-standalone-copy.md`,
  DELIVERABLE 2026-08-27-2001 §1. 16 clauses, 34 lines, ~2,038 characters.
- **Acceptance map:** thread §5 — every acceptance line traced to a numbered
  bullet, plus the deliberate register choices (`Never` for invariants, `Do not`
  for the one session instruction, a five-opener closed set that is the clause
  set).
- **Three-path distinguishability:** thread §4 — the token, the two words that
  appear in exactly one block each (`Refuse`, `single-shot` — neither in this
  copy), and the cause named to the user. Includes the copy-paste hazard:
  degraded's `single-shot` and `Refuse` assertions must **not** be inherited by
  `standaloneBlockErrors()`.
- **Identity-string ruling:** thread §7 — `kai-core` hard-coded unconditionally
  (only the marketplace segment renames); the single install invocation declared
  a generator-derived identity string exempt under steward amendment A1, with
  A1(ii) coverage required of `area-plugins-m2-mode-selection`. Two alternatives
  considered and rejected with reasons.
- **Source grounding:** `scripts/lib/degraded-block.txt`, `preflight-block.txt`,
  `inherits-block.txt` read verbatim for register; `pack-plan.mjs:580-663`
  (`DEGRADED_BLOCK_MAX`, `DEGRADED_QUOTE_MIN`, `DEGRADED_OPENERS`,
  `coreContractLines()`, `degradedBlockErrors()`); `validate-plugin.mjs:861`
  (derive-and-assert precedent); `migration-doctor.mjs:56`
  (`MARKETPLACE = 'kai-plugins'`); `workspace-doctor.mjs:665`.
- **Open for `doc-review`, all in infra's lane:** (a) the
  `STANDALONE_BLOCK_MAX` value; (b) not inheriting degraded's two identity
  assertions; (c) A1(ii) coverage for the install invocation. None blocks the
  copy.
- **Character counts are hand-computed** — no shell in this session. Infra
  should re-measure with `normalizeLF(block).length` before pinning a constant.

### Product delivery 2026-08-27-2001 (`principal-product-manager`)

`ready -> in-review`, version 3 -> 4, lease cleared (all five fields null),
`next_role: principal-swe-infra` for the declared `doc-review`. **Not
`completed`:** the item declares a review requirement and `completed_reviews` is
empty, so the terminal state is not truthfully reachable in this pass.

No `scripts/lib/*.txt` file was created or edited — the bytes land in
`area-plugins-m2-mode-selection`, which is not yet dispatchable. Nothing under
`scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or
`kai/initiatives/**` was touched, and the parallel sibling
`area-plugins-migration-architecture` and its thread were not written.

**If the doc-review concludes a required clause must be cut for size, the item
returns to `principal-product-manager` rather than being trimmed in review.** The
one-sentence mode line (C1) and the seven disclaimers (non-negotiable #6) are
steward lines, not wording preferences.


## Notes

**No release. `delivery_class: knowledge`; terminal state `completed`.** This item
produces sentences, not a commit — the bytes land inside
`area-plugins-m2-mode-selection`.

**Provenance and ownership.** Steward amendment A4 #1
(`kai/coordination/threads/area-plugins-scope-brief.md`, 2026-08-27-1906) names
this a required product deliverable of milestone 2 with
`principal-product-manager` as owner, and calls it a **required input to PR-3**.
The architect explicitly declined it as product judgment rather than architecture:
the record fixes the structure, the timing, the anti-nag rule and the disclaimer
set; only the sentences are outstanding.

**Why this exists as an item at all — flagged for the steward.** The
decomposition was asked for one item per PR, and this is not a PR. It was minted
anyway because `area-plugins-m2-mode-selection` has a hard input dependency here,
and a typed `depends_on` needs a target — a dependency pointing at a
non-existent item is a dangling reference the workspace doctor rejects, and a
hard input carried only in prose is how a blocked PR gets discovered at
implementation time. A4 already declares the deliverable owed, so this is
sequencing inside approved scope. **If the steward would rather carry the copy in
their own queue, drop this item and convert the WS-3 edge to a prose input — the
sequencing is unaffected either way.**

**Dispatch note.** No dependencies. It should be dispatched **in parallel with
`area-plugins-m2-planpacks-prefix`**, not after it: different owner, no shared
touch set, and it is a hard input four items downstream. Leaving it until PR-3 is
imminent is the single most likely way this milestone stalls with three PRs
already merged. **Size: S.**

**Review.** `principal-swe-infra` / `doc-review` — infra reviews the copy for
mechanical conformance to the clause set its own linter must assert. That is a
real independent check by the role that has to make it pass, not a courtesy pass.

### Steward promotion 2026-08-27-1944 (`principal-product-manager`)

`proposed -> ready`, priority **10 — the top of the milestone-2 queue**, version
1 -> 2, `owner: null`, lease untouched and null. Recorded in
`kai/coordination/threads/area-plugins-scope-brief.md`, STEWARD AMENDMENT
2026-08-27-1944 (A8).

**Kept as its own item — the manager's open question 2, answered.** A typed
`depends_on` beats a prose input: it makes the milestone's most likely stall
visible on the board, and it gives the copy a completion state that
`area-plugins-m2-mode-selection` can actually depend on. Folding it into the
steward's private queue would have bought nothing and hidden a hard input four
items downstream. The deliverable was already declared owed with this role as
owner in steward amendment A4 #1; this item is its record, not new scope.

**This is the one item in milestone 2 that is executable now, and the reason is
not sequencing — it is the frontier.** `scope.current` is still
`decisions-locked`, whose acceptance ends *"No production code, manifest, or
marketplace change has been made."* Every other milestone-2 item touches
production paths and is gated behind that line (A8). This one is
`delivery_class: knowledge` and `touches` only its own item and thread, so it
runs under the current frontier without falsifying anything. Promoted **ahead of**
`area-plugins-m2-planpacks-prefix` for exactly that reason.

**Condition C1 is not negotiable downward, and that is a steward line, not a
reviewer's preference.** A user must be able to tell which mode produced an
answer *before* deciding whether to trust it as recorded work. If the mode line
cannot be written in one sentence without losing that, the sentence gets sharper
— it does not get shorter by dropping the mode or the upgrade.

**Acceptance is unchanged by this promotion.** No line was added, relaxed, or
reworded.

### Infra doc-review 2026-08-27-2015 (`principal-swe-infra`)

`in-review -> completed`, version 5 -> 6, lease cleared (all five fields null),
`next_role: null`. Verdict **`approved-with-conditions`**, `satisfies_requirement:
true`. P0 0 · P1 4 · P2 7. Bound to thread entry `DELIVERABLE 2026-08-27-2001` §1
— `delivery_class: knowledge`, so `change_ref` stays `null` and the reviewed
revision is that entry, not a git object. Full record:
`kai/coordination/threads/area-plugins-m2-standalone-copy.md`, REVIEW
2026-08-27-2015.

**The copy is approved as written — all 34 lines, unchanged.** Every condition
binds `area-plugins-m2-mode-selection` (WS-3), which is why `completed` is
truthful here rather than a state the review conditions contradict.

**The one conditional acceptance line is resolved, and it resolves in the copy's
favour.** `DEGRADED_BLOCK_MAX = 1200` was verified to exist
(`scripts/lib/pack-plan.mjs:583`) and to be enforced (`:630-633`, via
`scripts/validate-plugin.mjs:427-433`, self-tested at
`scripts/pack-preview.mjs:479-481`). It does not transfer to this block, as the
steward argued. `STANDALONE_BLOCK_MAX` is ruled **derived** —
`STANDALONE_PROSE_ALLOWANCE + STANDALONE_CLAUSE_COST * STANDALONE_CLAUSES.length`
= 320 + 160 × 16 = **2880** — off the same clause table the linter iterates, so a
clause added by decision moves the budget and a rewording cannot. An independent
hand recount puts the copy at **2,035** characters, which fits with 845 to spare
and would also fit the steward's recommended 2400. **No required clause is cut,
the mode line is not shortened, and no scope decision returns to
`principal-product-manager`.** Counts are hand-computed (`reported`) — no shell
in this session — and WS-3 must re-measure with `normalizeLF(...).trimEnd().length`
before pinning the constant.

**The two routed questions are ruled in the thread**, along with a third linter
hazard the copy would have hit that no one had named (`DEGRADED_OPENERS` rejects
bullets 1 and 4 and admits `Refuse`) and a fourth that would have made the
A1(ii) identity check unfireable (the derived install literal is wrapped across
lines 12→13, and the existing raw-`indexOf` precedent would silently match
nothing). Both are specified with their fixes so WS-3 does not re-derive them.

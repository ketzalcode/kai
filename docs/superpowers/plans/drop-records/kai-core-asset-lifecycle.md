# Drop record: `kai-core-asset-lifecycle`

The 17,569-character `kai-core-asset-lifecycle` contract was loaded eagerly by
55 agents, but most of them only ever PRODUCE an asset. Deciding whether an
asset is complete, fresh, promotable, or closeable is the business of a much
smaller set of completion authorities plus the director. The contract was split
along the producer/closer boundary into two skills so each reader loads only its
own half. Prose was copied verbatim; nothing was removed to a non-skill target.

## Section destinations

Every section of the original `SKILL.md` landed in at least one place. Only
"The core rule" landed in both, deliberately (see below).

| Original section | Destination |
| --- | --- |
| Intro (`# Asset Lifecycle`) | rewritten as a per-file intro in each new skill; the "four independent questions" block (EXECUTION / DISPOSITION / VALIDITY / CLOSURE) was carried verbatim into `kai-core-asset-producing`, which holds the four state machines it orients |
| The core rule | **both** — `kai-core-asset-producing` and `kai-core-asset-closing` (deliberate duplication) |
| Four orthogonal state machines (Execution, Disposition, Validity, Initiative closure) | `kai-core-asset-producing` |
| Pre-dispatch declaration | `kai-core-asset-producing` |
| Universal asset metadata | `kai-core-asset-producing` |
| Revision and supersession | `kai-core-asset-producing` |
| Migration rule | `kai-core-asset-producing` |
| Generator close transaction | `kai-core-asset-producing` |
| Anti-patterns | `kai-core-asset-producing` |
| Completion is a four-dimensional verdict | `kai-core-asset-closing` |
| Completion authority | `kai-core-asset-closing` |
| Freshness and revalidation | `kai-core-asset-closing` |
| Placement and promotion | `kai-core-asset-closing` |
| Initiative closure sweep | `kai-core-asset-closing` |
| Hard rules | **split by reader** (see below) |

Section order within each new file follows source order, not the table order.

## The deliberate duplication

"The core rule" (392 chars) is copied identically into both files. A producer
needs it ("a run may produce no durable asset; it may never leave an
unclassified one") and a closer needs it (disposition and validity are resolved
before the run stops). Duplicating 392 characters is cheaper than inventing a
third skill and a route to reach it. The two copies are byte-identical.

## Hard rules split by reader

The 10-rule list was partitioned by which reader each rule binds — a producer,
or whoever declares an asset complete / fresh / promoted / closed. Wording is
verbatim; only the numbering changed. No rule was duplicated.

`kai-core-asset-producing` (renumbered 1–5):

1. Work-item state and asset validity are independent. *(orig 1 — a producer
   sets validity independently of execution; its elaboration lives in the
   Execution state machine, which is in this file.)*
2. Declare `owed` or `none` before dispatch; never generate first and classify
   later. *(orig 2 — a pre-dispatch producer act.)*
3. No unclassified durable output. *(orig 3 — a producer must classify what it
   emits.)*
4. Material conclusion changes create a successor, not a silent revision. *(orig
   6 — the Revision and supersession act, done by the producer.)*
5. Supersession links are bidirectional. *(orig 7 — same.)*

`kai-core-asset-closing` (renumbered 1–5):

1. No producer self-acceptance without an explicit operator exception. *(orig 4
   — acceptance is the Completion authority's act.)*
2. Only `current` is unqualified current guidance. *(orig 5 — a freshness /
   presentation judgement.)*
3. Published assets are preserved; incorrect ones are retracted, not erased.
   *(orig 8 — a promotion / disposition judgement.)*
4. Initiative closure includes work, asset, backlog, ownership, and outcome
   sweeps. *(orig 9 — the closure sweep.)*
5. Legacy starts `unknown`; revalidation earns `current`. *(orig 10 — see the
   borderline note below.)*

Borderline calls: orig 1 and orig 10 each touch both readers, and review
scrutinised both.

- **orig 1** stays in producing alone. A closer judges freshness without needing
  the independence rule restated, and the closer-facing consequence ("never
  reopen terminal work to represent new validity facts") is already carried by
  the Execution machine and the Anti-patterns list.
- **orig 10** moved to closing. Its operative half — *revalidation earns
  `current`* — is an acceptance act, and closing had no other statement of the
  `unknown -> current` gate. Producing does not lose it: the Migration rule in
  that file states both halves in operative form ("Set `validity.status:
  unknown`" and "Revalidate before changing `unknown` to `current`"). Moving
  rather than duplicating keeps the one-duplication budget intact while leaving
  both readers covered.

No rule is duplicated.

## Cross-reference rewrites

Two prose cross-references pointed at content that moved:

- `kai-core-asset-producing`, `### 4. Initiative closure` — "the work, asset,
  backlog, and ownership sweeps defined **below**" became "…sweeps defined in
  `kai-core-asset-closing`", because the Initiative closure sweep section moved
  to the closing file.
- `kai-core-asset-producing`, `## Generator close transaction` step 6 —
  "Resolve the four completion dimensions" became "…defined in
  `kai-core-asset-closing`", because the four-dimensional verdict that step
  invokes lives in the closing file.

## Review corrections

Task review found two reader-boundary defects in the first cut; both were fixed
before the task was accepted:

- **Generator close transaction moved from closing to producing.** It opens
  "Before an **asset-producing agent** stops" and steps 1–5, 7 (HANDOFF), and 8
  are producer stop-obligations. Leaving it in closing meant an ordinary
  producer had no consolidated close checklist. Only step 6 leans closer, and it
  now cross-references `kai-core-asset-closing`.
- **Hard rule orig 10 moved from producing to closing** (see the borderline note
  above).

## Notes

- The `tools` list (`[read, edit, search]`) was preserved exactly in both new
  skills.
- The prose still contains a reference to `kai-core-workspace-conventions`
  (in Placement and promotion), which a prior task split/renamed. It was left
  verbatim per the "copy the prose verbatim" constraint; a later reference-fix
  task owns updating it.

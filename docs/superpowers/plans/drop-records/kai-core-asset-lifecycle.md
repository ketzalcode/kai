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
| Intro (`# Asset Lifecycle`) | rewritten as a per-file intro in each new skill (the whole-file intro did not survive the split) |
| The core rule | **both** — `kai-core-asset-producing` and `kai-core-asset-closing` (deliberate duplication) |
| Four orthogonal state machines (Execution, Disposition, Validity, Initiative closure) | `kai-core-asset-producing` |
| Pre-dispatch declaration | `kai-core-asset-producing` |
| Universal asset metadata | `kai-core-asset-producing` |
| Revision and supersession | `kai-core-asset-producing` |
| Migration rule | `kai-core-asset-producing` |
| Anti-patterns | `kai-core-asset-producing` |
| Completion is a four-dimensional verdict | `kai-core-asset-closing` |
| Completion authority | `kai-core-asset-closing` |
| Freshness and revalidation | `kai-core-asset-closing` |
| Placement and promotion | `kai-core-asset-closing` |
| Generator close transaction | `kai-core-asset-closing` |
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

`kai-core-asset-producing` (renumbered 1–6):

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
6. Legacy starts `unknown`; revalidation earns `current`. *(orig 10 — the
   Migration rule, which lives in this file; the closer's revalidation cadence
   is covered separately by Freshness and revalidation.)*

`kai-core-asset-closing` (renumbered 1–4):

1. No producer self-acceptance without an explicit operator exception. *(orig 4
   — acceptance is the Completion authority's act.)*
2. Only `current` is unqualified current guidance. *(orig 5 — a freshness /
   presentation judgement.)*
3. Published assets are preserved; incorrect ones are retracted, not erased.
   *(orig 8 — a promotion / disposition judgement.)*
4. Initiative closure includes work, asset, backlog, ownership, and outcome
   sweeps. *(orig 9 — the closure sweep.)*

Borderline calls: orig 1 and orig 10 each touch both readers. Each was assigned
to the file that holds the section it restates (the Execution machine and the
Migration rule, both producing), rather than duplicated, following the
work-coordination precedent of a clean single assignment per rule.

## Cross-reference rewrites

One prose cross-reference pointed at a section that moved to the sibling file:

- `kai-core-asset-producing`, `### 4. Initiative closure` — "the work, asset,
  backlog, and ownership sweeps defined **below**" became "…sweeps defined in
  `kai-core-asset-closing`", because the Initiative closure sweep section moved
  to the closing file.

## Notes

- The `tools` list (`[read, edit, search]`) was preserved exactly in both new
  skills.
- The prose still contains a reference to `kai-core-workspace-conventions`
  (in Placement and promotion), which a prior task split/renamed. It was left
  verbatim per the "copy the prose verbatim" constraint; a later reference-fix
  task owns updating it.

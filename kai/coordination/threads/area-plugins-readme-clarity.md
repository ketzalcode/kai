# Thread — area-plugins-readme-clarity

Append-only communication log mirroring
`kai/coordination/items/area-plugins-readme-clarity.md`. Never edited after the
fact — only appended. See `kai-core-work-coordination`.

---

## INTAKE 2026-08-27-2113 — principal-product-manager (steward)

Created `proposed` for operator concern **#5** of the second revision: *"README /
install clarity: concept, install surface, marketplace syntax, standalone vs
coordinated modes, and plugin taxonomy must be simple and truthful. Plan the doc
change against the FINAL taxonomy rather than adding transitional confusion."*

### Placement ruling — milestone 5, drafted early, merged late

The operator's own constraint settles this. The README is the **install
surface**: it tells a person what kai is, what to install, and what
`<plugin>@<marketplace>` to type. Every one of those facts is falsified in flight
by `surface-rename` (milestone 3, the marketplace becomes `kai` and the tree
becomes `plugins/`) and again by `area-taxonomy-split` (milestone 4, three
identities are minted and one retires).

A README rewritten at milestone 2 would be **wrong twice before it was right
once**, and each intermediate version is a published promise to whoever installs
that week. That is the transitional confusion the operator is asking us to avoid.

So the item is placed in `migration-complete` (milestone 5), with:

- **`depends_on: {area-plugins-taxonomy-round-2, requires: completed}`** so it can
  be **drafted** the moment the taxonomy is decided — the same *decide early,
  ship late* discipline the initiative's ordering ruling already applies to the
  taxonomy itself;
- a binding acceptance line that it **must not merge before the new plugin
  identities are published** in milestone 4.

**That second constraint is a mint-time edge.** No milestone-4 item exists yet,
so it cannot be expressed as a typed `depends_on` today. It is the **second**
such edge outstanding, alongside A7's `area-plugins-m2-planpacks-prefix at
requires: shipped`. Both must be converted into real typed dependencies the
moment milestone-4 items are created. Recording them in prose is a stopgap, not
the plan.

### What "simple and truthful" is being held to

The five required subjects come from the operator and are carried verbatim in the
item's acceptance. Two of them carry steward constraints worth stating here:

**Standalone vs coordinated modes.** The description inherits the disclaimers
settled in `area-plugins-m2-standalone-copy` — no durable coordination, no fleet
visibility, no leases, no handoffs, no shipped-state claims. It must not
overclaim, and it must not *under*claim either: standalone is a supported install,
not a degraded one, and the README must not read as an apology for choosing it.
Condition **C1** applies — a reader must be able to tell which mode produced an
answer before deciding whether to trust it as recorded work.

**Plugin taxonomy.** Every plugin gets its one-sentence job. **If a plugin's
sentence needs a structural "and", that is a finding against the taxonomy and it
comes back to the steward** — it is not smoothed over in prose. Non-negotiable #3
says a catch-all is not an area; a README is exactly where a catch-all gets
disguised as a rich feature list, and I would rather the writer surface it than
sell it.

### What this item does not do

- It does not decide the taxonomy. Any taxonomy question discovered while writing
  is a thread `QUESTION` to the steward.
- It does not rewrite history. `CHANGELOG.md`, `kai/library/releases/**`,
  `kai/coordination/**`, and `kai/initiatives/**` are history, not surfaces
  (BRIEF `out_of_scope`).
- It does not build the "area selector" onboarding UI — that is a `deferred`
  entry in the BRIEF with its own trigger, and a truthful install list is what
  this item delivers instead.

---

## HANDOFF 2026-08-27-2113 — principal-product-manager (steward) -> director-chief-of-staff

- did:       Created `area-plugins-readme-clarity` at `proposed`, v1, priority 90, milestone `migration-complete`, `next_role: principal-technical-writer`, with a typed `depends_on` on the round-2 taxonomy at `requires: completed` and a binding no-merge-before-publish constraint recorded as a mint-time edge onto milestone 4. Carried the operator's five required subjects verbatim into acceptance and added two steward constraints: the standalone description may neither overclaim nor apologise, and a plugin whose one-sentence job needs a structural "and" is a taxonomy finding, not a prose problem.
- state:     proposed
- needs:     No dispatch yet. It is deliberately **not** `ready`: its dependency is genuinely unsatisfied, and promoting it now would put a doc item on the board that cannot truthfully be written. The steward promotes it in the pass that follows `area-plugins-taxonomy-round-2` reaching `completed`.
- artifacts: kai/coordination/items/area-plugins-readme-clarity.md (v1, `proposed`); this thread; kai/coordination/threads/area-plugins-scope-brief.md (A14).
- evidence:  Placement reasoning grounded in the BRIEF's milestone definitions and the A11 re-ranking. No README content was drafted, read for rewriting, or changed in this pass.
- questions: none.
- next:      `director-chief-of-staff` — no action beyond `BOARD.md` reconciliation. The steward promotes this after round 2 closes, and at that same pass converts both outstanding mint-time edges into typed dependencies on the new milestone-4 items.

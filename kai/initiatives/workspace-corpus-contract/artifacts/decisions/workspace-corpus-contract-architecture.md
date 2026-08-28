# Architecture Decision — the audience-based workspace-corpus model, and how it reconciles the four founding contracts

**Source:** `kai/coordination/items/area-plugins-{workspace-storage-modes, initiative-archive,
backlog-contract, design-output-contract}.md` (all v1, `proposed`), each carrying its own
`DECISION 2026-08-27-2113` in its own coordination thread.
**Date:** 2026-08-28
**Initiative:** workspace-corpus-contract (milestone `corpus-honesty`)
**Author:** `principal-product-manager` (steward, initiative owner), ratifying the model the operator
approved directly on 2026-08-28 together with the initiative itself.
**Revision:** 3
**Status:** **Accepted direction; revision 3 internally reviewed.** The operator
approved the audience-based model and authorized completion of this contract on
2026-08-28. Revisions 2–3 close implementation seams within that approved
boundary; the four founding items still require their declared steward
scope-acceptance before dispatch.

> **Boundary.** This record decides a boundary and reconciles four independently authored contracts
> against it. It moves no file, changes no manifest field, edits no skill or script, and creates no
> new work item. Every mechanism question it touches was already, correctly, routed to
> `principal-swe-infra` by the four contracts below — this record does not re-route them, it adds
> one more shared constraint they must all satisfy: audience over durability. Where this record finds
> a real conflict between a contract's stated path and the boundary, it **names** the conflict and
> routes it to that contract's own follow-on implementation item; it does not silently resolve it by
> picking a path.

---

## 1. The decision in one line

A record's home is decided by **who it is for**, not by how durable it needs to be: `.kai/` holds
what the *agents and machinery* need to keep running (coordination state, raw evidence, and the
archive of both); `kai/` holds what the *operator* needs to see, decide on, or receive (attention,
backlog, and durable publication). Storage mode (`corpus_visibility: committed | local`) then decides
*how visible* each of those already-classified homes is — never which one a record belongs in.

## 2. Grounding — what already exists, so this record does not re-litigate settled ground

Read this session from `C:\src\kai`, alongside the four items' own grounding, which is not repeated
here:

| location | today |
|---|---|
| `skills/kai-core-workspace-conventions/SKILL.md:145-148` | Three-row placement table: `.kai/runs/` = raw/regenerable/scratch, ignored; `kai/coordination/` = operational state shared across concurrent efforts, **committed**; `kai/library/` = curated reusable outcomes, committed text. |
| `.kai/manifest.json` | `"kai": ".kai"`, `"runs": ".kai/runs"`, `"corpus": "kai"`, `"coordination": "kai/coordination"`, `"initiatives": "kai/initiatives"`, `"library": "kai/library"`, `"corpus_visibility": "committed"`. |
| `kai/coordination/backlog.md` | exists; the *unaffiliated* backlog destination, inside the coordination tree. |
| `kai/initiatives/<slug>/backlog.md` | exists; the *initiative-scoped* backlog destination. |
| `kai/personal/` | exists; personal and ignored today, with governance distinct from `kai/coordination/`. |
| `kai/review.md`, `kai/backlog.md`, `kai/review/<item>/`, `<publication-root>/{reports,specs,decisions}/`, `.kai/state/`, `.kai/archive/` | **do not exist anywhere in this repository.** None of the four founding contracts named them. This record is the first place they are named, and it names them as **target** paths, not as paths that exist today. |

**The honest framing, stated plainly:** today's placement model already separates *raw/scratch*
(`.kai/runs/`, ignored) from *durable* (`kai/coordination/`, `kai/library/`, committed), and it is a
good model for that axis. What it does not yet separate is **who a durable record is for.**
`kai/coordination/` is committed and lives under the same `kai/` root as `kai/initiatives/` and
`kai/library/`, even though its content — leases, in-flight handoffs, an item's `next_role` — is
addressed to the *agents and directors running the work*, not to the operator reading the repository.
An operator opening `kai/` today cannot tell, from the root listing alone, "what needs me" from "what
the machinery is doing to itself." That is the gap this record closes, by naming a second axis rather
than replacing the first.

## 3. The two axes, stated so they cannot be conflated

```text
                     DURABLE (committed text)          SCRATCH (ignored, regenerable)
                     ─────────────────────────          ──────────────────────────────
  AGENT/MACHINE-      .kai/state/ (coordination,         .kai/runs/ (raw evidence) —
  FACING              leases, threads, internal          UNCHANGED, already exactly
                      task graphs) under committed        this today
                      mode; same paths, ignored
                      under local mode — see §5

  OPERATOR-FACING      kai/backlog.md and                 kai/review.md +
                      kai/initiatives/**; durable         kai/review/<item>/
                      publication under a configured      (generated attention +
                      <publication-root>                  pending review)
```

Two axes, not one. **Audience (rows) decides which root a record lives under. Storage mode (a
workspace-level setting, not a per-record choice) decides whether the committed row is actually
tracked or stays local-only.** `.kai/runs/` sits in the scratch column on both axes and is unaffected
by anything here.

## 4. Audience boundary — non-negotiable #1

> `.kai/` is agent/machine-facing. `kai/` is operator-facing.

This is the single test that resolves every placement question the four contracts raise. It is not a
taste call between two conventions that both work; it is the answer to "an operator opened this repo
— should they expect to read this file to understand the product, or is this file the agents talking
to each other and to themselves?" Coordination state (leases, `next_role`, `resume_state`, thread
`HANDOFF`s) is machine-to-machine and director-to-agent traffic; an operator reading it is
eavesdropping on the machinery, not reading a decision. A north star, a decision record, a release
record, a backlog entry, and a "needs you" flag are the opposite: authored **for** the operator, and
`kai/` is where they belong.

**What does not move by this rule alone:** `kai/initiatives/<slug>/**` (the north star, `log.md`,
`deliverables.md`, `artifacts/**`) is **operator-facing evidence and publication**, not agent-facing
state, so it stays under `kai/` regardless of anything else in this record — confirming, not
reopening, the initiative-archive contract's §3 load-bearing call that the initiative directory never
moves.

## 5. Hidden does not mean ignored — non-negotiable #2

`.kai/` is a directory-naming convention (dot-prefixed, hidden from a casual `ls`); `corpus_visibility`
is a **storage-mode** setting. The two are independent:

- **`corpus_visibility: committed`** — `.kai/state/`, `.kai/archive/`,
  `kai/backlog.md`, and `kai/initiatives/**` are **tracked in git.** Hidden from
  `ls` does not mean hidden from `git log`, `git diff`, or a clone. A
  collaborator gets the coordination state and operator working record.
- **`corpus_visibility: local`** — the same `.kai/state/` and `.kai/archive/` paths become
  **ignored**, together with the operator working surface under `kai/`.
  `.kai/runs/`, `kai/review.md`, and `kai/review/<item>/` are ignored under
  both modes. Nothing about the audience boundary changes; only whether the
  working corpus leaves this checkout changes.

This directly satisfies R1/R2's honesty constraint from `area-plugins-workspace-storage-modes`: the
tradeoff is stated once, at the mode level, and is never disguised as a directory-naming decision.
Neither mode is recommended by the contract. `committed` publishes working
state; `local` narrows it to one checkout.

Durable publication is a separate, explicit act, not a third operational
storage mode. In `committed` mode the publication root defaults to `kai/`. In
`local` mode there is **no implicit tracked publication root**: the operator
either keeps the artifact local or chooses a project-native tracked root such
as `docs/kai/`. This preserves the ability to publish one approved contract
without pretending the rest of the working corpus is shared.

## 6. Three `.kai/` destinations — non-negotiable #3

| destination | owns | ignored under `local`? |
|---|---|---|
| `.kai/state/` | authoritative live coordination: `README.md`, `ACTIVE.md`, `BOARD.md`, item records, leases, threads, and internal task graphs. `ACTIVE.md` and `BOARD.md` are generated machine views; item records and initiative status remain authoritative. This is the direct successor of today's `kai/coordination/` content, minus the operator-facing backlog file (§8). | yes |
| `.kai/runs/` | raw, regenerable, heavy, or scratch evidence. **Unchanged** — already exactly this today. | yes, under both modes, unconditionally |
| `.kai/archive/` | inactive internal records — the swept operational records of a terminal, archived initiative (item records, threads), per the initiative-archive contract's §3 destination, moved one level from `kai/coordination/archive/<slug>/` to `.kai/archive/<slug>/` to keep archived agent-facing records on the agent-facing side of the boundary. | yes |

None of the three is optional and none absorbs another's job: state is live and authoritative, runs
is raw and disposable, archive is dead-but-resolvable. A record that is simultaneously "still
authoritative" and "archived" is a contradiction the archive contract's preconditions (§10) already
forbid, and this table does not relax that.

`kai/initiatives/INDEX.md` remains the authoritative operator-facing
all-status initiative catalog. `.kai/state/ACTIVE.md` is only the generated
active subset used by agents; `.kai/state/BOARD.md` is the generated full work
graph. Neither is a priority authority and neither competes with
`kai/backlog.md`.

## 7. Operator-facing `kai/` lanes — non-negotiable #4

| lane | job | governance |
|---|---|---|
| `kai/review.md` | **The single-workspace operator attention front door.** What needs the operator's eyes right now: open gates, blocking questions, items awaiting a decision, and links to local evidence. | generated from authoritative records; ignored in every mode |
| `kai/backlog.md` | **The operator-facing P0/P1/next and parked-proposal authority.** It has one ordered surface (`Now`, `Next`, `Parked`); active rows link to authoritative item records rather than copying their state. This is the audience-elevated successor to today's `kai/coordination/backlog.md`. | steward-groomed; tracked in committed mode, local in local mode |
| `kai/review/<item>/` | **Local, ignored, pending review.** Where a not-yet-published output stages while it is still being judged — the operator-facing mirror of `.kai/runs/`'s "scratch" role, but for material that is *addressed to* the operator and not yet promotion-worthy. | ignored in every mode; never cited as a durable source |
| `<publication-root>/reports/` | durable, published **read** artifacts — status, findings, retrospectives | committed only by explicit publication |
| `<publication-root>/specs/` | durable, published **design/architecture** artifacts an implementation depends on | committed only by explicit publication |
| `<publication-root>/decisions/` | durable, published **decision** records at the workspace level | committed only by explicit publication |

`kai/initiatives/<slug>/artifacts/decisions/` is this file's current schema-2
home. After migration, approved initiative decisions publish only to
`<publication-root>/decisions/<initiative>/`; the initiative's
`deliverables.md` links to that authoritative file. Existing
`artifacts/decisions/` history remains readable through a migration resolution
table, but receives no new approved decisions. Drafts use `kai/review/<item>/`,
so the target model has one legal home at every lifecycle stage.

`kai/review.md` intentionally succeeds the **workspace coordination portion**
of today's `kai/personal/agenda.md`. After implementation:

- `kai/review.md` owns this workspace's release gates, blocking questions,
  decision requests, and evidence links;
- `kai/personal/agenda.md` owns personal inbox items, nudges, and optional
  cross-workspace aggregation by linking to each workspace's `kai/review.md`;
- the personal agenda never re-renders the workspace rows itself.

This requires a bounded update to `kai-core-personal-agenda`; until that ships,
the current agenda remains authoritative and `kai/review.md` is target-only.

## 8. What this means for the backlog contract, stated precisely

`area-plugins-backlog-contract`'s two canonical destinations
(`kai/coordination/backlog.md` for unaffiliated proposals and
`kai/initiatives/<slug>/backlog.md` for initiative-scoped ones), its
one-question routing rule, prohibited-filename list, and item/backlog
exclusivity rule are confirmed. What changes is the unaffiliated path:
`kai/coordination/backlog.md` -> `kai/backlog.md`. This is not cosmetic — it is the audience boundary
doing real work: a backlog is authored **for the operator to prioritize**, so once `kai/coordination/`
becomes agent-facing state under `.kai/state/`, the backlog cannot ride along with it without
contradicting the boundary this record just drew. `kai/initiatives/<slug>/backlog.md` is unaffected —
it already lives under the operator-facing `kai/initiatives/` root and stays exactly where it is.

`kai/backlog.md` is one file, not a deferred-proposal store plus a second
priority dashboard. Its ordered sections are `Now`, `Next`, and `Parked`.
When a parked proposal becomes an item, the backlog entry becomes a pointer to
the item; the item owns execution state. `.kai/state/BOARD.md` may show the
same item as part of the complete machine graph, but it derives order and
state from authoritative records and is not an operator priority list.

## 9. Publication moves text; it never copies it — non-negotiable #5

The current schema-2 promotion rule ends at `kai/library/<type>/`. The target
contract replaces that generic terminal lane with the three purpose-named
lanes under `<publication-root>`: `reports/`, `specs/`, and `decisions/`.
`kai/library/` becomes legacy, read-only history after migration; new writes
are forbidden, and existing links are preserved by a migration resolution
table rather than by keeping two live destinations.

The migration owns an explicit type map:

| schema-2 library type | target |
|---|---|
| `reviews`, `investigations`, `briefings`, `qa-findings`, `releases`, `digests` | `<publication-root>/reports/` |
| `dev-designs`, `playbooks` | `<publication-root>/specs/` |
| `lessons`, `learnings` | `<publication-root>/learning/`, registered by the current provider and later owned by `kai-learning` when that separate topology initiative ships |
| `content` | `<publication-root>/content/`, registered by the current provider and later owned by `kai-gtm` |

No library type disappears. The library is not marked read-only until every
writer has been moved to its mapped destination in the same release. The
follow-on is named **`workspace-corpus-publication-migration`** and must cover
all agent and skill references to `kai/library/`; it is named here, not created
by this contract-ratification pass. The `learning/` destination does not depend
on the future `kai-learning` plugin existing; ownership transfers when the
separate area-plugin topology ships.

Whichever durable lane receives a piece of writing, **the text moves there and
stops being authoritative in the review lane it came from.**
`kai/review/<item>/` is never cited as a durable source after publication. No
artifact is authoritative in two places at once.

## 10. Depth of durability follows the shape of the work — non-negotiable #6

A fourth axis, orthogonal to placement: **how much of a durable trail a piece of work earns.**

| shape of work | durable document? | where |
|---|---|---|
| **Spike** — throwaway exploration, answer is the only output | **none.** | nothing committed; conversation only |
| **Bounded change** — one session, one reviewer, no downstream dependency | conversation or local review only | `kai/review/<item>/`, ignored, never promoted |
| **Architectural or multi-agent work** — more than one role or session depends on the shape of the answer | an **approved spec** is committed | `<publication-root>/specs/` or `<publication-root>/decisions/` |
| **Implementation plan** | committed **only when** another session, agent, or reviewer actually depends on it | same durable lane as the spec it implements |

The routing question is singular:

> Does this document prescribe the system or behavior that implementers must
> build? Put it in `specs/`. Otherwise, does it record a settled choice,
> constraint, or rationale that later work must respect? Put it in
> `decisions/`.

If one document appears to do both, the implementation-governing spec is the
authority and carries a short decision section. A second ADR is created only
when the choice applies beyond that spec. The same claim is never copied into
both lanes.

This directly answers the instinct behind `area-plugins-backlog-contract`'s §9 non-goal ("no
prioritization scheme inside a backlog") from the opposite direction: the discipline this record adds
is not about backlogs, it is about **not manufacturing a durable document that nobody but its author
will ever read.** It is a new constraint, not previously stated by any of the four contracts, and (per
§13) is **not implemented by this record** — it is a target rule for whichever follow-on item next
touches `kai-core-work-coordination` or `kai-core-scope-discipline`.

## 11. Local mode is honest single-checkout durability — non-negotiable #7, confirming R3/R5

This restates, and does not relax, `area-plugins-workspace-storage-modes`' sharpest finding: **no
mechanism may recommend a destructive git operation as a tidy-up step.** Concretely, extending R3's
requirement across the wider `.kai/` footprint this record defines:

1. Before any `committed -> local` switch, **enumerate** exactly which working-corpus paths under
   `.kai/state/`, `.kai/archive/`, and `kai/` stop being shared, and **who loses access** (other
   clones, collaborators, CI).
2. The operator confirms **by naming the count** — not a bare yes/no.
3. **Files remain on disk in every direction, always.** Ignoring is never untracking; untracking is
   never proposed as a doctor remediation without the confirmation in (2).
4. `local -> committed` warns too, in the opposite direction, because previously-private
   agent-facing state (which may contain verbatim operator conversation in threads) becomes published
   on the next push.
5. Explicitly published artifacts are outside this switch. A publication stays
   tracked at its configured root unless the operator separately removes it;
   switching the working corpus to local never silently unpublishes a contract.
6. Under `local`, `.kai/manifest.json` and `.kai/CONVENTIONS.md` are also
   ignored, matching the existing whole-root contract and doctor behavior.

Nothing here overrides the storage-modes item's own **R4 ruling (hybrid: defer)** — two modes stand,
and this record does not reopen that question.

## 12. Project-native publication root and plugin-extensible defaults — non-negotiable #8

Two commitments the four founding contracts did not need to make, because none of them addressed
multi-plugin or cross-repository composition:

- **A repository configures its durable publication root independently of the
  working corpus.** In committed mode it may accept the default `kai/`; in
  local mode there is no tracked default. A project with an established
  `docs/` or `reports/` convention may point publication there instead. Kai
  must not force a committed `kai/` corpus. A local-mode publication root
  cannot live under `kai/`, because that parent is intentionally ignored.
- **The publication root is recorded in the manifest.** Onboarding derives
  binary deny rules for that exact root, and the doctor verifies that raw,
  screenshot, archive, and browser-state payloads have not become tracked
  merely because the root moved. A configurable path without configurable
  ignore enforcement is not a valid configuration.
- **Core defaults may be extended, never silently overridden, by a domain plugin.** A future
  `kai-learning`-shaped plugin may add its own lane (say, a course-artifacts publication root) without
  touching what `kai-core` already defines; it may not redefine what `kai/reports/` or `kai/decisions/`
  mean for every other plugin sharing the workspace. This is the same "core is required, extensions
  never silently reinterpret it" discipline `pack-split` already applies to skill namespacing, restated
  here for workspace paths.

Neither commitment is implemented by this record; both are constraints any future manifest-schema or
onboarding change (routed, as always, to `principal-swe-infra`) must satisfy.

## 13. Reconciliation — what happens to each of the four contracts, item by item

None of the four `DECISION 2026-08-27-2113` records is rewritten. This table states, for each,
whether the audience boundary **confirms** it as written, **extends** it with a new commitment, or
**narrows/redirects** a specific stated path — and nothing else changes.

### `area-plugins-workspace-storage-modes`

- **Confirmed as written:** R1 (explicit choice), R2 (both branches' honest cost), R4 (hybrid
  deferred). Nothing in this record weakens the honesty constraint.
- **Extended:** R3's "no silent destructive switch" is generalized from `kai/coordination/` alone to
  the full working-corpus footprint (§11). Explicit durable publication is
  separated from that switch and is never silently unpublished.
- **Narrowed/redirected:** none. This item's mechanism work (the manifest field, the doctor checks,
  the switch procedure) is unaffected in shape; only the set of paths it must verify grows to match
  §6's table, once `.kai/state/` exists.

### `area-plugins-initiative-archive`

- **Confirmed in meaning:** the lifecycle model (§1), the "nothing is deleted
  or rewritten" rule (§2), the load-bearing call that
  `kai/initiatives/<slug>/**` never moves (§3), parked-proposal disposition
  (§7), the four doctor assertions (§8), the resolution-table behavior (§9),
  preconditions and timing (§10), and the
  `pack-split` first-application plan (§11) including the routed Q1 about the one additive
  `deliverables.md` pointer line.
- **Narrowed/redirected:** the contract's destination path in §3,
  `kai/coordination/archive/<slug>/`, is superseded by `.kai/archive/<slug>/` (§6 of this record) —
  archived operational records are agent-facing history, not operator-facing publication, so they
  belong on the agent-facing side of the boundary exactly as live operational
  records do. Every literal `kai/coordination/archive/<slug>/` in that contract
  is superseded, including §4's board-footer link, §6's INDEX pointer, §8's
  doctor assertions, and §9's resolution-table path. References to live
  `kai/coordination/items/`, `threads/`, `ACTIVE.md`, and `BOARD.md` resolve to
  their `.kai/state/` successors; `kai/initiatives/INDEX.md` stays in place.
  It is not implemented here.
- **Sequencing:** `.kai/state/` ships before archive implementation. The
  archive item writes directly to `.kai/archive/`; the legacy path is never an
  interim production destination.

### `area-plugins-backlog-contract`

- **Confirmed as written:** the two-destination model, the one-question routing rule and its
  asymmetric-cost tiebreak, the prohibited-filename list, item/backlog exclusivity with
  strike-through-on-promotion, the groomable entry shape requiring a reopen trigger, and the
  warn-then-error doctor rollout.
- **Narrowed/redirected:** the unaffiliated destination's literal path, `kai/coordination/backlog.md`,
  is superseded by `kai/backlog.md` (§8 of this record), because a backlog is an operator-facing
  authority surface, not agent-facing coordination state. `kai/initiatives/<slug>/backlog.md` is
  unaffected.
- **Extended:** `kai/backlog.md` is the single `Now` / `Next` / `Parked`
  operator surface. Promoted proposals become pointers to authoritative item
  records; a second priority file is forbidden.

### `area-plugins-design-output-contract`

- **Confirmed as written:** initiative ownership, the never-list, the binary
  rule, the one-way steward-approved promotion flow, the
  stop-and-ask-rather-than-invent rule, the three doctor checks, and the
  bounded designer-agent edits. **Mock specifics — `options.html`, screenshots,
  and serving behavior — remain this item's next call.**
- **Clarified:** `.kai/runs/` remains the only raw design-generation scratch
  destination. `kai/review/<item>/` is not a second scratch root; it is the
  operator packet created only when generated work is ready for human review.
  The mock item decides exactly which file moves and which raw evidence remains
  linked from `.kai/runs/`.
- **Narrowed/redirected:** the unaffiliated durable destination
  `kai/library/designs/` is replaced by `<publication-root>/specs/`.
  Initiative-approved designs follow the single publication routing rule in
  §7 rather than remaining authoritative under two roots.

## 14. Settled reconciliation calls and deliberately deferred mechanics

The architecture boundary is complete. These calls are settled:

- The live coordination root is `.kai/state/`.
- The state-root migration precedes archive implementation; archive writes
  directly to `.kai/archive/` and never ships at an interim legacy path.
- `kai/backlog.md` is one `Now` / `Next` / `Parked` surface.
- `kai/library/` is legacy after migration; new publication uses
  the core-owned `<publication-root>/{reports,specs,decisions}/` lanes plus
  provider-registered `learning/` and `content/` extension lanes.
- `kai/review.md` is the current workspace's generated review inbox.
  It succeeds the workspace-coordination rows currently rendered in
  `kai/personal/agenda.md`; the personal agenda keeps personal signals and
  cross-workspace links without duplicating workspace rows.

Two mechanics remain intentionally deferred because the operator asked to
brainstorm them next rather than bury them inside this boundary decision:

- **Mock placement:** the canonical `options.html`, screenshot, and local-server
  contract remains with `area-plugins-design-output-contract`.
- **Initiative closure:** backlog disposition, terminal-state verification,
  and archive triggers remain with `area-plugins-initiative-archive`.

## 15. What this ratification does and does not do

The implementation follow-ons are named here and are **not created by this
ratification pass**:

| founding contract | follow-on |
|---|---|
| workspace storage modes | `workspace-corpus-state-migration` |
| backlog contract | `workspace-corpus-backlog-enforcement` |
| design-output contract | `workspace-corpus-design-placement` |
| initiative archive contract | `workspace-corpus-initiative-archive` |
| cross-cutting legacy library migration | `workspace-corpus-publication-migration` |

`workspace-corpus-state-migration` also owns the bounded
`kai-core-personal-agenda` reconciliation required to make `kai/review.md` the
workspace attention front door without leaving a duplicate agenda. It also
owns manifest registration for `<publication-root>` and the root-derived
ignore rules; publication and design follow-ons consume that registered value
rather than inventing another configuration field. The same item owns the
managed ignore entries for `/kai/review.md` and `/kai/review/` under both
storage modes, plus doctor checks proving those generated/local surfaces stay
ignored.

When the steward creates these items, typed dependencies must preserve the
settled order:

```text
workspace-corpus-state-migration
  ├─► workspace-corpus-backlog-enforcement
  ├─► workspace-corpus-initiative-archive
  └─► workspace-corpus-publication-migration
          └─► workspace-corpus-design-placement
```

Any founding item whose current schema-2 `artifact_target` is still owed when
publication migration starts must have that target remapped in a versioned
item update before the legacy initiative decision lane becomes read-only.

- **Does:** state the binding target architecture the operator approved; reconcile all four founding
  contracts against it explicitly, confirming the overwhelming majority of each unchanged; name the
  handful of real path narrowings each contract's own follow-on must apply; and settle the shared
  seams those follow-ons depend on.
- **Does not:** move a file, change `.kai/manifest.json`'s schema, edit `scripts/workspace-doctor.mjs`
  or any `kai-core-*` skill, place a mock, enforce a backlog rule, implement an archive mechanic, or
  version-bump any shipped plugin surface. Every one of those remains each contract's own follow-on
  implementation item, none of which is created by this record.
- **Does not** promote any of the four items from `proposed` to `ready` — that scope-acceptance
  promotion is the steward's next, separate pass, per `kai/initiatives/workspace-corpus-contract/northstar.md`.
- **Evidence basis:** read through the worktree at `C:\src\kai` this session; the four contracts'
  DECISION text is cited, never altered. Revision 1 was materialized before
  command validation; revisions 2–3 followed two independent read-only
  architecture pressure tests. Workspace doctor and repository tests validate
  record consistency only; every quantitative target in `northstar.md` remains
  a future implementation measurement.

## Review history

- **Revision 1 — operator-approved direction, 2026-08-28:** materialized the
  audience boundary and the initiative workspace.
- **Revision 2 — seam closure:** fixed local publication semantics; settled
  `.kai/state/`, one backlog surface, legacy-library disposition, and
  workspace-review vs personal-agenda ownership.
- **Revision 3 — independent review corrections:** placed ACTIVE/BOARD,
  separated knowledge acceptance from implementation, completed the library
  type map, assigned publication/ignore ownership, added specs-vs-decisions
  routing, and reconciled every archive-path occurrence.

# Thread — area-plugins-initiative-archive

Append-only communication log mirroring
`kai/coordination/items/area-plugins-initiative-archive.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-2113):** no agent in this session has a shell, so
`kai/initiatives/workspace-corpus-contract/` cannot be created and the canonical
`artifact_target` cannot yet be written. Until one operator `mkdir` runs, **this
thread is the durable record of the archive contract** — a real canonical
coordination path, not a substitute workspace.

---

## DECISION 2026-08-27-2113 — principal-product-manager (steward) — INITIATIVE ARCHIVE CONTRACT

Binding process contract for operator concern **#7** of the 2026-08-27-2113
second revision. Authored by the steward because archive semantics are a
lifecycle and honesty decision, not an infrastructure one. The **mechanism** —
file moves, doctor checks, index regeneration — is `principal-swe-infra`'s.

### 0. Grounding — the noise is real, and I measured it before designing anything

Verified this session by directory listing and file read from `C:\src\kai`:

| surface | pack-split (`shipped`) | total non-README | share |
|---|---|---|---|
| `kai/coordination/items/*.md` | **23** | 38 | **61%** |
| `kai/coordination/threads/*.md` | **23** | 36 | **64%** |
| `kai/coordination/BOARD.md` rows (`:20-42`) | **23** | 36 | **64%** |

`pack-split` did everything closure asks of it: `status: shipped`, dropped from
`ACTIVE.md`, a permanent `INDEX.md` row, a non-empty `deliverables.md`, and a
`director-summary.md`. **And roughly two-thirds of the live coordination surface
is still it.** A steward or director opening `items/` today reads 23 finished
records before reaching a live one.

Two more grounded facts the design has to answer for:

- `kai/initiatives/pack-split/backlog.md` holds **13 parked proposals** across 6
  dated sections. Nothing at closure disposed of them. They are now proposals
  parked against a mission nobody is pursuing — invisible, un-groomable, and
  quietly lost.
- **`archived` is named but undefined.** `skills/kai-core-initiative-stewardship/SKILL.md:59`
  and `kai/initiatives/README.md:69` both publish the lifecycle
  `proposed -> active -> paused -> completed|shipped -> archived`, and
  `SKILL.md:130` says *"Archive (`status: archived`) once it's no longer a live
  reference."* Nothing anywhere says what archiving **does**. A state with a name
  and no mechanics is a state nobody can perform, which is exactly why nobody has.

**The diagnosis, stated plainly: kai has a `close` and no `archive`.** Closure
answers *"is the work done?"* Nothing answers *"has the finished work left the
room?"* This contract is the second question.

---

### 1. `archived` is a distinct steward transition, not a synonym for terminal

Two events, two dates, both logged in `kai/initiatives/<slug>/log.md`:

- **Terminal** (`completed` | `shipped`) — the work is done and evidenced. Owned
  by the steward's closure pass. Unchanged by this contract.
- **`archived`** — the finished initiative's **operational** records have been
  swept out of the live coordination surfaces and its parked proposals disposed.

An initiative may sit terminal-but-not-archived; that is a normal, honest state
and it is where `pack-split` is right now. It may **not** sit archived-but-not-
terminal: `archived` is reachable only from `completed` or `shipped`.

### 2. Nothing is deleted, and nothing is rewritten

The operator's constraint — *never silently discard durable records* — is the
hard boundary of this contract, so state its consequences rather than its
sentiment. Archiving **moves and links**. It never:

- deletes an item record, a thread, or an artifact;
- edits the *content* of any record (records are append-only; an archived record
  is frozen, not amended);
- collapses, merges, or summarises threads into a digest;
- removes an `INDEX.md` row;
- touches `kai/initiatives/<slug>/**`.

A summary is not a substitute for a record. If a reviewer six months from now
cannot read the exact `HANDOFF` that justified a shipped release, the archive
destroyed evidence regardless of how good the summary was.

### 3. Destination — sweep the operational records, leave the evidence in place

```text
kai/coordination/items/<item-id>.md    ->  kai/coordination/archive/<slug>/items/<item-id>.md
kai/coordination/threads/<item-id>.md  ->  kai/coordination/archive/<slug>/threads/<item-id>.md
kai/initiatives/<slug>/**              ->  UNCHANGED, in place, forever
```

**The initiative directory does not move, and this is the load-bearing design
call.** `kai/initiatives/<slug>/` is the permanent evidence home. Every
`artifact_target` recorded in a shipped item, every path cited in a release
record under `kai/library/releases/**`, and both `INDEX.md` columns point into
it. Moving it would break every one of those references to tidy a directory that
`INDEX.md` already catalogs and that nobody browses looking for live work.

The **coordination** surfaces are the opposite: they are the daily working
surface, they are flat by design so dependencies can cross initiatives, and they
are where finished work actually gets in the way. So: archive the operational
records, keep the evidence exactly where every existing link expects it.

### 4. `BOARD.md`

`BOARD.md` is a derived index regenerated by `director-chief-of-staff`; this
contract changes what it derives, not who owns it.

- Rows for archived items **leave the live table.**
- The board gains one footer line per archived initiative:
  `<slug> — N items archived <YYYY-MM-DD> -> kai/coordination/archive/<slug>/`.
- The footer is the board's own proof that the rows left deliberately rather
  than being dropped. A row that vanishes with no footer is indistinguishable
  from a regeneration bug.

### 5. `ACTIVE.md`

Mechanically unchanged — terminal initiatives already leave it — plus the
invariant the operator is asking for, stated so it can be checked:

> **`ACTIVE.md` contains rows for `active` and `paused` initiatives only.** Any
> slug whose `INDEX.md` status is `completed`, `shipped`, or `archived` must not
> appear, in any form, including prose.

That last clause matters: prose is where stale claims hide. A sentence saying
*"pack-split is shipped and closed"* in `ACTIVE.md` is a row by another name.
Point at `INDEX.md` instead.

### 6. `INDEX.md`

- The row **stays forever.** `INDEX.md` is the permanent all-status catalog and
  archiving is not a reason to forget an initiative existed.
- `status` becomes `archived`.
- The row gains an **archive location**: `kai/coordination/archive/<slug>/`.
- `summary` and `deliverables` paths are **unchanged**, because the initiative
  directory did not move. This is the payoff of §3.

### 7. Parked proposals must be disposed before archive

Grounded in the 13 orphans `pack-split` left. At archive time the steward gives
**every** entry in `kai/initiatives/<slug>/backlog.md` exactly one disposition:

- **(a) Promoted** — it fits a live initiative's `scope.current`; a real item
  record is created and the entry is struck through with the item ID.
- **(b) Re-homed** — it is still worth doing but has no live initiative; it moves
  to `kai/coordination/backlog.md` as an unaffiliated proposal, carrying a
  provenance line naming the source initiative and its original park date.
- **(c) Killed** — one line saying why. "Superseded by X", "the trigger can no
  longer fire", "we decided against it" are all acceptable; silence is not.

**An initiative may not be archived while an undisposed parked proposal
remains.** The file stays in place as history — struck-through entries and all —
because the parking decisions are themselves evidence of scope discipline.

This is where the backlog contract binds: the disposition targets in (a) and (b)
are the exactly-two destinations defined in
`kai/coordination/threads/area-plugins-backlog-contract.md`. Neither contract
works alone.

### 8. Proof — four assertions a doctor run must make

The operator asked for something that *prevents completed initiatives appearing
active*. Prose cannot prevent it; these can. All four are `workspace-doctor`
checks, and all four fail loudly rather than warning:

1. **No archived initiative holds live coordination records.** No
   `kai/coordination/items/*.md` has `initiative: <slug>` for any slug whose
   `INDEX.md` status is `archived`. (Today, `pack-split` would fail this 23
   times — correctly, because it has not been archived yet.)
2. **`ACTIVE.md` carries no terminal slug**, per §5, prose included.
3. **Archived evidence is still readable.** For every archived slug, the
   `INDEX.md` `summary` and `deliverables` paths resolve and are non-empty.
4. **No archived record is unreachable.** Every file under
   `kai/coordination/archive/<slug>/` appears in that slug's resolution table
   (§9), and every path in the resolution table resolves.

A fifth check belongs to the director's reconciliation, not the doctor: a
`BOARD.md` regeneration must not silently drop a row that has no archive footer.

### 9. Link preservation — a move without a resolution table is a silent discard

Records move, so references break. Every archived initiative gets:

```text
kai/coordination/archive/<slug>/README.md
```

containing: the archive date, the steward who performed it, the initiative's
terminal state and date, a pointer to `kai/initiatives/<slug>/director-summary.md`,
and a **complete old-path -> new-path table for every moved item and thread.**

The initiative's `deliverables.md` gains one line pointing at that README. This
is the only edit this contract makes inside `kai/initiatives/<slug>/`, and for
`pack-split` even that is deferred — see §11.

Cross-initiative references are the reason this is non-negotiable. An
`area-plugins` record citing `pack-split-degraded-refusal` must still resolve
after the archive; the resolution table is how. Because records are append-only,
**existing references are never rewritten** — the table is how old paths keep
working, not a licence to edit history.

### 10. Preconditions and timing

Archive is permitted only when **all** hold:

1. The initiative is `completed` or `shipped`, with `deliverables.md` and
   `director-summary.md` non-empty.
2. Every one of its items is at a terminal state (`completed`, `shipped`, or
   `dropped` with a reason). A non-terminal item is a closure defect, not an
   archiving detail.
3. **No live item in any other initiative has a `depends_on` pointing at one of
   its items.** Archiving an upstream dependency of live work would make a
   dependency check resolve against a moved file.
4. No item holds a live lease.
5. Every parked proposal is disposed per §7.

**Timing:** archive at the steward's next pass after closure — deliberately not
automatic at closure. A just-shipped initiative is still the thing everyone is
reading; a short terminal-but-not-archived window is useful, and an automatic
sweep would fire while the ink is wet. If the steward wants a default, use one
completed release cycle.

### 11. First application — `pack-split`, and the boundary I will not cross

`pack-split` is the reference case and the implementation item's first job: 23
item records and 23 threads move, 23 board rows leave the live table, 13 parked
proposals get dispositions, `INDEX.md` goes to `archived` with an archive
location, and the resolution table is written.

**Two constraints on that execution:**

- `kai/initiatives/pack-split/**` content is **not modified.** The scope brief's
  non-negotiable #13 and `out_of_scope` both forbid it, and the operator's
  current directive repeats the prohibition. The one edit §9 would otherwise make
  — the `deliverables.md` pointer — is therefore **deferred and routed to the
  operator** as a named exception: either the operator authorizes that one
  additive line, or the resolution table is discovered through `INDEX.md` alone.
  I am not quietly reinterpreting a prohibition I wrote because it became
  inconvenient two initiatives later.
- The 13 proposals belong to `pack-split`'s steward pass. They are **read** and
  disposed; their text is not rewritten.

### 12. What this contract deliberately does not do

- **No new initiative status beyond `archived`.** The lifecycle already has the
  state; it needed mechanics, not more vocabulary.
- **No auto-archive.** A steward decides, per §10.
- **No compression, digesting, or summarising of archived records.** §2.
- **No change to closure criteria.** `kai-core-initiative-stewardship`'s
  "call the initiative done" test — every milestone with a non-empty typed
  `required_items` mapping, every item at its declared terminal state — is
  untouched. This contract runs strictly after it.
- **No retention policy.** Archived records are kept indefinitely. Deciding when
  a record may finally be deleted is a separate question with a separate
  operator decision, and answering it inside a contract about tidiness is how
  durable records get discarded politely.

### 13. Success measure

> A steward opening `kai/coordination/items/` sees only live work.

Falsifiable: today **61%** of that directory is a shipped initiative. Target:
**0%** of the live coordination surface belongs to a terminal initiative, with
100% of the swept records resolvable through a resolution table.

---

## HANDOFF 2026-08-27-2113 — principal-product-manager (steward) -> director-chief-of-staff

- did:       Authored the binding **Initiative archive contract** (13 sections) after measuring the actual noise rather than accepting the complaint: 23 of 38 item records, 23 of 36 threads, and 23 of 36 board rows belong to `pack-split`, which is `shipped` and already out of `ACTIVE.md`; 13 of its parked proposals were never disposed; and `archived` is named in two published lifecycle documents while being defined in none. Made the load-bearing call that archiving sweeps the **operational** coordination records and leaves `kai/initiatives/<slug>/` in place, so no recorded `artifact_target`, release-record path, or `INDEX.md` column breaks. Specified destination, board/ACTIVE/INDEX changes, parked-proposal disposition, four doctor assertions, the old-path resolution table, preconditions, timing, and five explicit non-goals. Created the item at `proposed`.
- state:     proposed (item not promoted — the `workspace-corpus-contract` split needs an operator go)
- needs:     Operator go/no-go on the split, then steward promotion, then implementation by `principal-swe-infra`. One operator decision is embedded: §11's single additive line in `kai/initiatives/pack-split/deliverables.md` is currently **forbidden** by non-negotiable #13 and is routed rather than assumed.
- artifacts: kai/coordination/items/area-plugins-initiative-archive.md (v1, `proposed`); this thread (the contract).
- evidence:  Read 2026-08-27 from `C:\src\kai`. Directory listings of `kai/coordination/items/` (39 files incl. README; 23 `pack-split-*`) and `kai/coordination/threads/` (37 incl. README; 23 `pack-split-*`). `kai/coordination/BOARD.md:20-42` — 23 `pack-split` rows of 36. `kai/coordination/ACTIVE.md` — one row (`area-plugins`), plus a closing sentence about `pack-split`. `kai/initiatives/INDEX.md` — `pack-split` `shipped` with summary and deliverables paths. `kai/initiatives/pack-split/backlog.md` — 13 parked proposals across 6 dated sections, no closure disposition. `skills/kai-core-initiative-stewardship/SKILL.md:59,130` and `kai/initiatives/README.md:69` — `archived` named, undefined. `kai/initiatives/pack-split/**` was read only; nothing under it was written.
- questions: **Q1 (operator):** may the archive add exactly one additive pointer line to `kai/initiatives/pack-split/deliverables.md`, or should the resolution table be discoverable through `INDEX.md` alone? Non-negotiable #13 currently forbids the former.
- next:      `director-chief-of-staff` — put the split to the operator. On go: steward promotes, then `principal-swe-infra` implements, with `principal-swe-architect` on independent-architecture and the steward on scope-acceptance.

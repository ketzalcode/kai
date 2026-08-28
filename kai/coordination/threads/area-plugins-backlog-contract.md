# Thread — area-plugins-backlog-contract

Append-only communication log mirroring
`kai/coordination/items/area-plugins-backlog-contract.md`. Never edited after the
fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-2113):** no agent in this session has a shell, so
`kai/initiatives/workspace-corpus-contract/` cannot be created. Until one
operator `mkdir` runs, **this thread is the durable record of the backlog
contract.**

---

## DECISION 2026-08-27-2113 — principal-product-manager (steward) — BACKLOG CONTRACT

Binding process contract for operator concern **#8**. Authored by the steward
because the backlog is the receiving end of `kai-core-scope-discipline`'s
one-way valve, which this role owns. The **validation mechanism** is
`principal-swe-infra`'s.

### 0. Grounding — and one correction to the premise

The operator's complaint is *agents invent `TODOs.md` or arbitrary backlog
files.* I checked the corpus before designing a fix, and the honest finding is
narrower and more useful than the complaint:

| check | result |
|---|---|
| `TODOs?\.md` / "TODO list" / "todo file" across `agents/` and `skills/` | **zero matches** |
| `TODO.md`, `TODOs.md`, `TODO`, `tasks.md`, `NOTES.md` anywhere in the tree | **none exist** |
| `kai/coordination/backlog.md` | exists; **empty** — "Nothing parked yet" |
| `kai/initiatives/pack-split/backlog.md` | exists; **13 parked proposals**, 6 dated sections |
| `kai-core-workspace-conventions/SKILL.md:466,497-498` | already declares `proposal_channel`, the routing rule, and "Proposals never fall back to `.kai/runs/`" |

**So: no agent is instructed to invent a backlog file, and no invented file
survives in the tree today.** The destinations exist and the routing rule exists.
What does not exist is (a) a **prohibition** an agent can be held to, (b) a
**complete** rule that covers the awkward cases where invention actually starts,
and (c) any **validation**. The behaviour the operator saw is emergent — an agent
with something to park, a case the rule does not obviously cover, and nothing
stopping it from creating a file.

I am not going to manufacture a drift finding I could not verify. **The
duplication between the two backlogs is not currently causing drift**: the
workspace backlog is empty and the initiative backlog holds only
initiative-scoped entries. The one real defect the pair *has* produced is
different and it is in the archive contract's territory: `pack-split` shipped and
left **13 parked proposals** in a backlog nobody grooms, because nothing says
what happens to an initiative backlog when its initiative ends.

### 1. Exactly two destinations. There is no third.

| destination | holds | who grooms |
|---|---|---|
| **`kai/coordination/backlog.md`** | every deferred proposal **not** scoped to an initiative | the steward, at any steward pass |
| **`kai/initiatives/<slug>/backlog.md`** | every deferred proposal scoped to that initiative | that initiative's steward (`owner` on `northstar.md`) |

Each initiative declares its own path as `proposal_channel` in `northstar.md`,
and **that value may not name any other path.** A `proposal_channel` pointing
anywhere but `kai/initiatives/<slug>/backlog.md` is a defect, not a
customisation — the field exists to make the destination discoverable, not
configurable.

### 2. The routing rule is one question

> **Does this proposal only make sense inside an active initiative's mission?**

- **Yes** -> that initiative's backlog.
- **No** -> `kai/coordination/backlog.md`.
- **Unsure** -> `kai/coordination/backlog.md`.

The tiebreak is not arbitrary. A workspace-backlog entry can be adopted by an
initiative later at zero cost. An initiative-backlog entry becomes an orphan the
moment that initiative closes — which is exactly how `pack-split` produced 13 of
them. **Asymmetric costs, so the default goes to the recoverable side.**

### 3. Prohibited destinations, named so they are enforceable

A prohibition an agent can argue with is not a prohibition. Anywhere under the
workspace root, these are **not** backlogs and must not be created or used as
one:

- `TODO`, `TODO.md`, `TODOs.md`, `todo.md`, `tasks.md`, `NOTES.md`, `notes.md`,
  `ideas.md`, `parking-lot.md`, `followups.md`, `follow-ups.md`, `next-steps.md`,
  `roadmap.md`, `wishlist.md`;
- any `backlog.md` outside the two canonical locations in §1;
- an item's `## Evidence` section, a thread entry, or a `HANDOFF`'s `next` field
  used to park an idea that is not that item's work;
- `.kai/runs/**` (already stated at `kai-core-workspace-conventions:498`);
- `kai/library/**` — the library is for **promoted outcomes**, never for
  proposals;
- the calling agent's cwd, Copilot session-state, or any temp directory.

`.kai/runs/` and `kai/personal/` are exempt from the *filename* prohibition —
an operator's own private notes are their business — but a proposal parked there
does not count as parked, because nobody grooms it and, under
`corpus_visibility: committed`, nobody else can see it.

### 4. A proposal is parked **or** minted. Never both.

The failure this prevents: the same idea living as a `proposed` item *and* a
backlog entry, drifting apart, and being decided twice with different answers.

- **Parked** = a backlog entry. Not work. No item record exists.
- **Minted** = an item record. Work the steward has committed to at least
  considering. No backlog entry remains open.
- **On promotion**, the backlog entry is **struck through in place** and annotated
  `-> promoted to <item-id>, YYYY-MM-DD`. It is never deleted: the park-then-
  promote history is the evidence that scope discipline actually ran.
- **On rejection**, the entry is struck through with a one-line reason. Also never
  deleted.

Worked example from this pass: `area-plugins-fleet-observer-ux` was created
directly as a `proposed` item at operator direction, so **no backlog entry exists
for it** and none should be added. The item record is the record.

### 5. Entry shape — so an entry is groomable a month later

```markdown
- **<YYYY-MM-DD>** · source: `<item-id>` | `<gate>` | `<role>`
  **Proposal:** <one line — the need or change, not a solution essay>
  **Deferred because:** <scope class per kai-core-scope-discipline, e.g.
  "expands-scope: adds a gate", or "fits scope but not scope.current">
  **Reopens when:** <the concrete trigger>
```

**An entry with no reopen trigger is not accepted.** This is the same discipline
the `area-plugins` scope brief already applies to its own `deferred` list, where
every one of the six entries carries a trigger. Without a trigger, "revisit
later" means "never, but politely", and the backlog silently becomes a graveyard
that makes deferral feel cheaper than it is.

### 6. The one-way valve is unchanged

`kai-core-scope-discipline` routes every `expands-scope` finding **in**. Only the
steward promotes **out**. This contract changes the *addresses*, not the valve.
Nothing here lets an agent promote its own deferral, and nothing here lets a
proposal become work because it is old.

### 7. What happens at initiative archive

`kai/initiatives/<slug>/backlog.md` is disposed at archive time per §7 of the
**Initiative archive contract**
(`kai/coordination/threads/area-plugins-initiative-archive.md`): every entry is
promoted, re-homed to `kai/coordination/backlog.md` with a provenance line, or
killed with a reason. The file stays in place as history and must contain **zero
undisposed entries**.

This is the clause that fixes the one real defect I could evidence. The two
contracts are complementary and neither closes the hole alone.

### 8. Validation — routed to infra, specified here

`workspace-doctor` gains three checks:

1. **Canonical paths.** `kai/coordination/backlog.md` exists. For every
   initiative directory, `backlog.md` exists (or is absent, which is fine — an
   initiative with nothing parked needs no file).
2. **No invented backlog.** No filename from §3 exists under the workspace root,
   excluding `.kai/runs/**` and `kai/personal/**`. Report the exact path and the
   canonical destination it should have used — a finding that does not tell the
   agent where to go instead will produce another invented file.
3. **`proposal_channel` integrity.** Every `northstar.md`'s `proposal_channel`
   equals its own `kai/initiatives/<slug>/backlog.md`.

**Rollout, and this is a product judgment, not an implementation detail:**
checks 2 and 3 are **warnings for one release cycle, then errors.** kai is
installed in workspaces whose existing files we did not write. Turning a
pre-existing `NOTES.md` into a hard doctor failure on upgrade day punishes a user
for a convention they never agreed to. Warn, tell them exactly where the content
belongs, then enforce.

### 9. What this contract deliberately does not do

- **No third destination for "team backlog" or "someday/maybe".** Two is the
  answer. A third would immediately need its own routing rule.
- **No prioritisation, scoring, or ordering scheme** inside a backlog. Backlogs
  are parked, not ranked; ranking happens on items, where the steward sets
  `priority`.
- **No automatic promotion** on trigger. A trigger tells the steward to *look*.
  The steward decides.
- **No import of `TODO` comments from source code.** Code TODOs are engineering
  notes, not product proposals, and hoovering them into a product backlog would
  flood the one surface this contract is trying to keep groomable.

### 10. Success measure

> Every deferred proposal in the workspace is in one of exactly two files, and a
> doctor run can prove it.

Falsifiable: today the invented-file count is **0** (verified) but the enforced
count is also **0** — nothing would catch the first one. Target: prohibited
backlog files **0**, enforced by check 2; undisposed proposals in an archived
initiative **0**, enforced by the archive contract; parked entries missing a
reopen trigger **0**.

---

## HANDOFF 2026-08-27-2113 — principal-product-manager (steward) -> director-chief-of-staff

- did:       Authored the binding **Backlog contract** (10 sections) and **corrected the premise before designing to it**: no agent or skill anywhere instructs creating a `TODOs.md`, no invented backlog file exists in the tree, and the two canonical destinations plus the routing rule are already documented at `kai-core-workspace-conventions:466,497-498`. The gap is a missing prohibition, missing coverage of the awkward cases, and zero validation — not conflicting instructions. Also refused to manufacture a drift finding: the two backlogs are **not** currently drifting. The one real, evidenced defect the pair produced is `pack-split` shipping and stranding 13 parked proposals, which §7 fixes jointly with the archive contract. Specified two destinations, a one-question routing rule with a justified tiebreak, an enforceable prohibited-name list, item/backlog exclusivity with strike-through-on-promotion, a groomable entry shape requiring a reopen trigger, three doctor checks with a warn-then-error rollout, and four non-goals. Created the item at `proposed`.
- state:     proposed (item not promoted — the `workspace-corpus-contract` split needs an operator go)
- needs:     Operator go/no-go on the split, then steward promotion, then implementation by `principal-swe-infra`.
- artifacts: kai/coordination/items/area-plugins-backlog-contract.md (v1, `proposed`); this thread (the contract).
- evidence:  Read 2026-08-27 from `C:\src\kai`. `kai/coordination/backlog.md` (exists, empty, correctly states the routing rule). `kai/initiatives/pack-split/backlog.md` (13 parked proposals; section headers at `:12,31,46,225,428,537,637,659,673`). `skills/kai-core-workspace-conventions/SKILL.md:466` (`proposal_channel: kai/initiatives/<slug>/backlog.md`) and `:497-498` (routing rule + no fallback to `.kai/runs/`). `skills/kai-core-initiative-stewardship/SKILL.md` "Backlog -> board: the one-way valve". Searches for `TODOs?\.md|TODO list|todo file` across `agents/` and `skills/` returned zero matches; a glob for `TODO`, `TODOs`, `TODO.md`, `TODOs.md`, `NOTES.md`, `tasks.md` across the repository matched nothing.
- questions: none.
- next:      `director-chief-of-staff` — put the split to the operator. On go: steward promotes, then `principal-swe-infra` implements with the steward on scope-acceptance.

---

## OPERATOR APPROVAL 2026-08-28-1302 — director-chief-of-staff (materialization pass)

The operator explicitly approved **(a)** `workspace-corpus-contract` and **(b)**
the recommended audience-based workspace model. `kai/initiatives/workspace-corpus-contract/`
now exists: `northstar.md` (`status: active`), `log.md`, `backlog.md`,
`deliverables.md`, and the ratified architecture decision at
`kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md`.

That record **confirms** this item's `DECISION 2026-08-27-2113` in full — the
two-destination model, the one-question routing rule and its tiebreak, the
prohibited-filename list, item/backlog exclusivity, the groomable entry shape,
and the warn-then-error doctor rollout — **except one named path narrowing**:
the unaffiliated destination `kai/coordination/backlog.md` is superseded by
`kai/backlog.md`, because a backlog is authored for the operator to
prioritize and therefore belongs on the operator-facing side of the new
audience boundary (see the architecture decision's §8 and §13).
`kai/initiatives/<slug>/backlog.md` is unaffected. The architecture decision
settles `kai/backlog.md` as one `Now` / `Next` / `Parked` operator surface;
promoted proposals become pointers to authoritative item records rather than
duplicating execution state. Nothing else in the `DECISION` above is amended
or weakened by this note.

This item's `artifact_target` moves from `null`
(`blocked-on-directory-creation`) to
`kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-backlog-contract.md`.
The canonical transcription of the `DECISION` into that file is **not** done
this pass — it remains a separate steward/owner promotion, same as
`area-plugins`'s "artifact owed" rows — so the binding contract stays the
`DECISION` above.

**State unchanged: `proposed`.** No promotion to `ready`, no mechanism work, no
path move, no schema change was performed by this pass. Steward
scope-acceptance and priority-ordering against the other three items remain
outstanding, per `kai/initiatives/workspace-corpus-contract/northstar.md`.

# Thread — area-plugins-fleet-observer-ux

Append-only communication log mirroring
`kai/coordination/items/area-plugins-fleet-observer-ux.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

---

## INTAKE + DEFERRAL 2026-08-27-2113 — principal-product-manager (steward)

Created `proposed` for operator concern **#10**: *"After these P0s and the plugin
topology, fleet-observer UX redesign resumes."*

**This item is deliberately not `ready` and is not meant to be dispatched.** Its
job today is to exist, be findable, and carry the trigger — so that "resumes"
resumes against a record rather than against memory.

### Grounded limit — there is nothing to resume from, in kai

Verified this session by listing `kai/coordination/items/`,
`kai/coordination/threads/`, and `kai/initiatives/`: **no fleet-observer
initiative, item, north star, product map, or design artifact exists anywhere in
the corpus.** The only fleet-adjacent material is the `fleet-observation` skill
and the observer plumbing referenced in `.gitignore`
(`/.kai/observed.jsonl`, `/.kai/observer-consent`).

So whatever prior context the operator has for this redesign is **the operator's,
not kai's.** The first act of the reopening pass is to ask for it — not to
reconstruct it from the codebase and call the reconstruction a brief.

### Why unaffiliated rather than folded into a live initiative

Neither home fits, and forcing it into one would create exactly the catch-all
non-negotiable #3 forbids:

- **`area-plugins`** is plugin packaging — what plugin an agent lives in and how
  it installs. A UX redesign of a product surface is not that, and its
  `out_of_scope` already bars "rewriting or re-scoping agent and skill content"
  and "adding agents or capabilities."
- **`workspace-corpus-contract`** is corpus governance — where records live and
  whether they are honest. Also not that.

`initiative: null` is the truthful answer. Choosing a home is part of the
reopening pass, once the topology has stopped moving.

### The trigger, and how much of it is mechanical

**Reopens when** the nine P0 concerns of the 2026-08-27-2113 revision are
disposed **and** the plugin topology is locked.

Two typed `depends_on` edges encode the hardest parts mechanically rather than
leaving the whole trigger to judgment:

- `area-plugins-taxonomy-round-2 requires: completed` — the topology lock.
- `area-plugins-tool-allowlist-fix requires: shipped` — the earliest P0, and a
  proxy for "the P0 lane has actually started shipping rather than merely being
  planned."

The rest — whether the other seven P0s are genuinely disposed — is the steward's
call at the reopening pass. I am not going to fake precision by wiring seven more
edges to items that may themselves be re-scoped.

### What must happen before this becomes work

Recorded in the item as a promotion checklist, and repeated here because it is
the substance of the deferral rather than paperwork:

**"Redesign the fleet-observer UX" is a solution, not a need.** There is no
evidence in the corpus of what is wrong with the current experience — no persona
run, no QA report, no support signal, no analytics readout. Promoting it as
stated would put engineering to work on an outcome nobody has written down.

So the order is: **product brief -> current product map -> home initiative ->
design.** The brief states the user, the job, the outcome, and what must remain
unchanged; the product map is what makes "what stays the same" nameable; only
then does `principal-product-designer` own the interaction. That is not ceremony
for a redesign of a surface that already has users — it is the difference between
changing the delivery and changing the promise, and I do not know yet which one
this needs.

---

## HANDOFF 2026-08-27-2113 — principal-product-manager (steward) -> director-chief-of-staff

- did:       Created `area-plugins-fleet-observer-ux` at `proposed`, v1, priority 900, `initiative: null`, with two typed `depends_on` edges encoding the mechanical part of the operator's reopen trigger. Recorded the grounded limit that no fleet-observer record of any kind exists in the corpus, so this is an **intake record, not a resumption**. Recorded why it is unaffiliated, and the brief-then-map-then-design order that must precede promotion.
- state:     proposed
- needs:     Nothing now. This is the deferral working correctly.
- artifacts: kai/coordination/items/area-plugins-fleet-observer-ux.md (v1, `proposed`); this thread; kai/coordination/threads/area-plugins-scope-brief.md (A15).
- evidence:  Read 2026-08-27 from `C:\src\kai`. Listings of `kai/coordination/items/` (39 files), `kai/coordination/threads/` (37 files), and `kai/initiatives/` (`pack-split` only, plus `INDEX.md` and `README.md`) — no fleet-observer record in any of them. `.gitignore` carries `/.kai/observed.jsonl`, `/.kai/observed.jsonl.1`, and `/.kai/observer-consent` as local-only observer state, which is the only fleet-observer material in the workspace.
- questions: **Q1 (operator, non-blocking):** what is the prior context for this redesign, and what specifically is wrong with the current fleet-observer experience? The answer is the seed of the product brief and kai holds none of it today.
- next:      No role. The steward re-examines this at the pass that follows `area-plugins-taxonomy-round-2` reaching `completed`, and promotes only after a product brief and a current product map exist.

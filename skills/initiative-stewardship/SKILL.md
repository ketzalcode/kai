---
name: initiative-stewardship
description: "The shared contract for the initiative steward: own north-star state, groom proposals, approve and prioritize ready work, keep authoritative item records honest, and close the initiative only after every current milestone is production-shipped. The steward (principal-product-manager by default) owns what/priority; director-chief-of-staff dispatches the approved queue; principal-swe-manager sequences large multi-owner delivery. This preserves one accountable scope owner without making the steward the execution lead."
tools: [bash, shell, view, edit, grep, glob, ask_user]
---

# Initiative Stewardship

kai's team can now **preserve and hand off work within an item**
(`work-coordination`),
**stay honest at the moment of action** (`scope-discipline`), and **ship a
finished slice** (`definition-of-done` + `workflow-ship`). What's still
unowned is the layer *above* a single item: someone has to decide **what
becomes `ready` next**, groom the backlog, keep `ACTIVE.md` and the item/index state
honest, and eventually **call the whole initiative shipped**. That is the
**steward**.

This is **not** a standalone trigger skill and **not** a new agent. The
initiative's `owner` (default `principal-product-manager`, which already
owns the scope gate) inherits this contract the way it inherits
`scope-discipline` — the two are the same role's two hats: *keep scope
honest* and *keep the initiative moving*.

## What the steward is — and isn't

- **Is:** the role accountable for the initiative's **health and
  prioritization** — the backlog, the `proposed → ready` promotion, the
  order of `ready` work, and the north star's own lifecycle.
- **Is not** a lead that owns the execution chain. Acting agents still own
  their item state and handoffs, while `director-chief-of-staff` dispatches the
  approved queue. The steward doesn't
  write the diff, doesn't run the build, doesn't do the review. It decides
  **what's worth doing next and whether the initiative is done** — not
  *how* any item gets built.

This preserves kai's "no single lead agent owns the whole chain": the
steward owns the *what/when-next*, the acting agents own the *how*.

## Who stewards

The steward is the `owner` named in the initiative's `northstar.md`.

- **Default:** `principal-product-manager`. It already owns
  `scope-discipline`, so promotion (out of the backlog) and deferral (into
  it) are the same judgment in one place.
- **Named override:** a northstar may set `owner` to another role when the
  effort's center of gravity isn't product — e.g. an infra migration
  stewarded with `principal-swe-manager` for sequencing. If `owner` names a
  human operator, `principal-product-manager` acts as the standing steward
  on their behalf.

Only **one** steward per initiative — accountability doesn't split.

## The five duties

### 1. Own the north star's state

Drive the northstar `status` through
`proposed -> active -> paused -> completed|shipped -> archived`.
Use `completed` when every milestone is knowledge/decision work; use `shipped`
when any milestone requires production delivery. `proposed -> active` requires
an accepted thin core, milestones, and success measures. Keep
`kai/coordination/ACTIVE.md`
truthful — it should list exactly the initiatives that are actually the focus,
no stale slugs. Keep `kai/initiatives/INDEX.md` as the all-status catalog with
workspace, summary, and deliverable pointers. Append each
steering decision (promote, reprioritize, pause, ship) to the
initiative's `log.md` so the trail survives.

### 2. Groom the backlog

Review the committed backlog (`kai/initiatives/<slug>/backlog.md` and the
unaffiliated `kai/coordination/backlog.md`) against the **thin core** (`mission`,
`scope.current`, `principles.non_negotiable[]`). For each parked entry:

- **Fits the current scope and matters now** → promote it (duty 3).
- **Still out of scope** → leave it parked, and if it will never fit, say
  so and drop it with a reason.
- **Now in scope because scope moved** → update `scope.current`, then
  promote.

### 3. Prioritize what's `ready` — the steward's queue

The steward turns the backlog and `proposed` items into an **ordered** set of
`ready` work. `director-chief-of-staff` dispatches that queue; it does not
invent or override the priority:

- Promote a `proposed`/backlog item to `ready` only when it **fits
  `scope.current`** and has acceptance criteria. Its `depends_on` links must be
  **declared** (the upstream items exist in the plan) — they need **not** be
  complete yet. `ready` is a commitment, not a claim of immediate runnability:
  the director computes the derived *executable* predicate (dependencies in
  their required states, lease-free, unblocked, touch-safe) at dispatch. Promote
  a whole dependency chain once; do **not** re-promote a downstream item each
  time an upstream one completes.
- Order `ready` by **value-to-mission**, not by who filed it or what's
  easiest.
- When the next work is **large, parallel, multi-owner, or
  deadline-driven**, pull in `principal-swe-manager` to size and sequence
  it before it starts — stewardship decides *what's next*, the manager
  decides *how it's sliced*.

### 4. Keep coordination state honest

Sweep authoritative `kai/coordination/items/*.md` records, using
`kai/coordination/BOARD.md` as the
human index, for the failure modes self-routing can't catch alone:

- **Stalled `in-progress`** — an item sitting with no recent `updated` and
  no `HANDOFF`. Ping the owner role (a thread `QUESTION`) or reclaim it.
- **Stuck `blocked`** — a completed `depends_on` item or a blocking question
  nobody answered. Unblock or escalate.
- **Orphaned items** — work with no `owner` and no `initiative`. Adopt,
  reassign, or drop it.

### 5. Call the initiative done

An initiative reaches its declared outcome only when every milestone ID in
`scope.current` has a non-empty typed `required_items` list and every listed
item reached its declared terminal state: `completed` for research/decision
work or `shipped` for production delivery. Planning items and unlisted optional
work do not satisfy the milestone. Then:

- Move the northstar to `completed` for research/decision initiatives or
  `shipped` for production-delivery initiatives, write the closing `log.md`
  entry, and drop the slug from `kai/coordination/ACTIVE.md`.
- Require a non-empty `deliverables.md`, a stable
  `kai/initiatives/<slug>/director-summary.md`, and exact workspace paths before
  closure; update `kai/initiatives/INDEX.md` with their locations.
- Archive (`status: archived`) once it's no longer a live reference.
- **`paused`** when priorities shift — the scope is still valid, just not
  now; say why in the log so a later steward can resume it.

## Backlog → board: the one-way valve, opened only here

`scope-discipline` routes every `expands-scope` finding **into** the
backlog. **Stewardship is the only thing that promotes an item back
out.** That asymmetry is deliberate: it's what stops scope from creeping in
through the backlog by default. A parked idea doesn't become work because
it's old or because someone wants it — it becomes work when the **steward**
judges it fits `scope.current` and promotes it to `ready`. Deferral is
cheap and automatic; promotion is a deliberate, owned act.

## The steward pass

Stewardship runs as an **on-demand pass**, not a standing meeting. Trigger
it when:

- the operator asks "what's next?" / "where does this initiative stand?",
- a batch of items just shipped or new proposals just landed, or
- the board looks stalled.

A pass, in order: **groom** the backlog → **promote** the fits to `ready`
→ **reprioritize** `ready` by value-to-mission → **sweep** stalled/blocked/
orphaned item records → **update** `kai/coordination/ACTIVE.md`, `INDEX.md`,
deliverables, and
the northstar `status` → **log** a one-line summary. The Chief of Staff may
invoke this pass, but the steward remains the decision owner.

## Hard rules

1. **One steward per initiative** — the northstar `owner` (default
   `principal-product-manager`). Accountability doesn't split.
2. **Promotion is deliberate and owned.** Only the steward moves an item
   `proposed`/backlog → `ready`, only when it fits `scope.current`, has
   acceptance, and its `depends_on` links are **declared** (not necessarily
   complete). Nothing self-promotes.
3. **Prioritize by value-to-mission**, not by age, ease, or who asked.
4. **Steward, don't build.** The steward orders and prunes work; it doesn't
   write, review, or ship the diff — the acting agents own that.
5. **Done is earned.** Every current milestone must have a non-empty typed
   required-item mapping and every item must reach its declared `completed` or
   `shipped` terminal state. Update the initiative and
   `kai/coordination/ACTIVE.md` only then.
6. **Leave a trail.** Every promote / reprioritize / pause / ship is one
   line in `log.md`.
7. **Leave a findable outcome.** Do not close an initiative until its summary
   and deliverable index exist at exact paths under the recorded workspace.

## Anti-patterns

- ❌ Auto-promoting the backlog because it's growing. Parked is the default;
  promotion is a scope judgment.
- ❌ Sequencing and slicing the work yourself when it's large — that's
  `principal-swe-manager`'s call; hand it over.
- ❌ Prioritizing the easy or the loudest item over the one that moves the
  mission.
- ❌ Leaving an initiative `active` after all milestone requirements are met, or
  `kai/coordination/ACTIVE.md` pointing at a slug nobody's working.
- ❌ Turning the steward into a bottleneck that owns execution — it owns
  what's-next, not how-it's-built.
- ❌ Splitting stewardship across two roles so no one is accountable.

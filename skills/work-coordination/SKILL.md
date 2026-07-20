---
name: work-coordination
description: "The shared coordination contract that lets many single-shot agents behave like one team running several efforts at once. Owns the committed coordination surface under initiatives/: BOARD.md (the cross-effort WIP ledger — every work item, its state, its owner agent, its blockers), threads/<item-id>.md (the append-only handoff + peer-question channel between agents), and backlog.md (the committed home for deferred proposals, replacing the gitignored working-root sink so grounded-but-parked ideas survive). Defines the work-item lifecycle (proposed → ready → in-progress → in-review → blocked → shipped / dropped), the HANDOFF packet an agent leaves for the next role, the QUESTION/ANSWER packets peers use to ask each other things, collision + dependency detection across efforts, and the self-routing rule (every acting agent claims its item on entry and, on exit, advances the state and names the next role). NOT a standalone trigger skill — it is inherited via the workspace-conventions gating rule by every agent that starts, hands off, or finishes a unit of work, the way review-* lenses inherit doc-review-rigor. Committed on purpose: the board and threads are shared team state that must survive across sessions, machines, and cloud agents."
tools: [bash, view, grep, glob]
---

# Work Coordination

kai's agents are **single-shot and stateless** — each fires, produces its
artifact, and forgets. That's fine for one task, but a *team* running
several efforts at once needs three things a pile of one-shot agents
doesn't have on its own: **shared state** (what's in flight and who owns
it), **communication** (handing work off and asking peers questions), and
a way to **finish** (move an item to shipped). This skill is that
connective tissue — a small, **git-committed** coordination surface any
agent reads and writes.

It is **not** a standalone trigger skill. You don't invoke it directly —
every agent that **starts, hands off, or finishes a unit of work** pulls
it in via the `workspace-conventions` gating rule, the same way each
`review-*` lens pulls in `doc-review-rigor`.

## Why committed

The board and the handoff threads are **team state**, not scratch. They
must survive across sessions, across machines, and across the CLI ↔ cloud
agent boundary — an agent in a fresh session (or a cloud coding agent)
has to be able to read what's in flight and pick up where the last one
left off. So the coordination surface lives in the **committed
`initiatives/` root**, not the gitignored working root. It is the *only*
mutable, constantly-updated committed state in the workspace; that churn
is the price of a team that remembers.

## The coordination surface

```
initiatives/
  ACTIVE.md                 # which initiative(s) are the current focus (existing)
  BOARD.md                  # the cross-effort WIP ledger  ← this skill
  backlog.md                # deferred proposals with no initiative  ← this skill
  threads/
    <work-item-id>.md       # append-only handoff + Q&A per item  ← this skill
  <initiative-slug>/
    northstar.md            # the north star (existing)
    log.md                  # decision trail (existing)
    backlog.md              # deferred proposals for this initiative  ← this skill
```

`ACTIVE.md` says *which initiatives matter now*; `BOARD.md` says *what work
is actually in flight*. They are different: a board item may serve an
initiative, or be unaffiliated side work.

## BOARD.md — the WIP ledger

One table. Every unit of work is a row. This is the answer to "what is the
team doing right now, who owns each piece, and what's stuck?"

```markdown
# Board

| id | title | initiative | state | owner | target | blocked-by | updated |
|----|-------|-----------|-------|-------|--------|-----------|---------|
| checkout-async-01 | Move checkout to async job | payments-q3 | in-progress | principal-swe-backend | checkout-flow | — | 2026-07-17-1530 |
| checkout-async-01-fe | Loading/optimistic UI for async checkout | payments-q3 | ready | — | checkout-flow | checkout-async-01 | 2026-07-17-1530 |
| seo-llms-txt | Add llms.txt + schema density | — | in-review | principal-seo | contoso-site | — | 2026-07-16-0910 |
```

- **`id`** — a stable kebab slug, unique on the board. Its thread lives at
  `initiatives/threads/<id>.md`.
- **`title`** — one human line.
- **`initiative`** — the initiative slug it serves, or `—` if unaffiliated.
- **`state`** — the lifecycle value (below).
- **`owner`** — the agent (or human) currently responsible, or `—` if
  unclaimed / `ready`.
- **`target`** — the `<target-slug>` from `workspace-conventions`, so the
  board links straight to the run artifacts under
  `<area>/<target-slug>/…`.
- **`blocked-by`** — the `id` of another item this one waits on, or `—`.
- **`updated`** — canonical `<YYYY-MM-DD-HHMM>` of the last change.

## The work-item lifecycle

```
proposed ─► ready ─► in-progress ─► in-review ─► shipped
                          │             │
                          └──► blocked ◄┘        (any state can ─► dropped)
```

| state | means | who moves it |
|-------|-------|--------------|
| **proposed** | An idea/finding worth doing, not yet committed to. | anyone; the PM/owner promotes it |
| **ready** | Committed and unblocked — waiting for an owner to start. | the scope-owner (`principal-product-manager`) / operator |
| **in-progress** | An owner is actively working it. | the owning agent, on entry |
| **in-review** | Built; awaiting verification / review / QA. | the builder, on handoff |
| **blocked** | Can't proceed until a `blocked-by` item or a blocking QUESTION resolves. | any agent that hits the block |
| **shipped** | Passed the `definition-of-done` gate and the human deployed; done. | the ship path (`workflow-ship`) |
| **dropped** | Won't do (moved to a backlog with a reason). | the scope-owner / operator |

The `in-review → shipped` edge is a **gate, not a rename**: `workflow-ship`
runs the `definition-of-done` contract before the state flips, and either
ships (writes a ship record, advances the row, records the deploy steps
for the human) or bounces the item back to `in-progress`/`blocked` with the
named gap. Nothing reaches `shipped` on optimism.

## The self-routing rule

This is what turns a human-scheduled pile of agents into a self-routing
team. **Every acting agent, on every run:**

1. **On entry — claim your item.** Find your work item on `BOARD.md` (by
   `target` + intent). If it exists, set `owner` to yourself and `state`
   to `in-progress`. If it doesn't, add a row (usually `in-progress`, or
   `proposed` if you're only surfacing an idea). Read its thread first so
   you inherit context instead of re-deriving it.
2. **On exit — advance and route.** Update the row's `state` and
   `updated`, then append a **HANDOFF** packet to the item's thread naming
   the **next role** and why. Never leave an item silently `in-progress`
   with no handoff — that's how work stalls.

The operator (or a future dispatcher) reads the board's `ready` and
`blocked` rows to decide what fires next — but because every handoff names
its `next` role explicitly, the chain routes itself even with no runtime.

## HANDOFF — the packet you leave for the next role

Appended to `initiatives/threads/<item-id>.md`. This is the standard
handoff every agent produces instead of burying the baton in prose:

```
## HANDOFF <YYYY-MM-DD-HHMM> — <from-agent> → <to-role>
- did:      <what you completed or decided>
- state:    <the board state you just set>
- needs:    <what the next role must do — the acceptance criteria>
- artifacts:<paths/links: report.md, decision.md, design.md, the diff/PR>
- questions:<blocking questions, or "none">
- next:     <the role that should pick this up, and why>
```

Every field is required. `artifacts` links to the real outputs under the
`workspace-conventions` path grammar — the thread **indexes** work, it
doesn't duplicate it. A HANDOFF with an empty `needs` or `next` is a baton
dropped on the floor.

## QUESTION / ANSWER — how peers ask each other things

Peer questions are **durable and addressed**: appended to the relevant
item's thread, they replace "ask the operator to role-play the other
agent" with a real, reviewable exchange. The packet shape and the choice
of *how* a question travels (a cheap inline consult, a real live peer
agent, or this durable thread) are owned by the **`peer-communication`**
contract — the thread is that contract's **system of record**. Here is the
durable transport and the board coupling it triggers:

```
## QUESTION <ts> — <from-agent> → @<to-role>
- blocking: <yes | no>
- context:  <what you're doing and why this gates it>
- ask:      <the specific question>
```

```
## ANSWER <ts> — <from-agent> → @<asker>
- re:     <the question, quoted or referenced>
- answer: <the answer, in your role's voice>
```

Rules (see `peer-communication` for the full protocol):
- **A blocking question flips the item to `blocked`** (with `blocked-by`
  pointing at the answering role or the item you're waiting on) until an
  `ANSWER` is appended; then move it back.
- **Anything load-bearing lands here.** An answer you got *live* (an inline
  consult or a real peer agent) that blocks the item, crosses a session, or
  changes a decision is **transcribed to this thread** — transport is a
  performance choice, the thread is the record.
- **Address a role, not a person.** `@principal-swe-backend`, not a name.
- **Answer in your lane.** If the question is outside your expertise, say
  so and name who should take it — don't guess authoritatively.
- The trainer↔nutritionist *consultation pattern* is the **inline** consult
  transport of `peer-communication`; use a thread QUESTION when the peer's
  answer needs to persist, cross a session, or feed an unbiased assessment.

## Collisions & dependencies across efforts

Running several efforts at once means catching where they touch:

- **Collision.** Before you start, scan `BOARD.md` for another **active**
  item with the *same `target`*. If one exists, you may be about to step
  on parallel work — note it in your thread and raise a QUESTION to that
  item's owner rather than editing blind.
- **Dependency.** If your item can't finish until another does, set
  `blocked-by` to that item's `id` and state `blocked`. When the upstream
  item hits `shipped`/`in-review`, the downstream owner is cleared to go.

## Backlog — where deferred work survives (committed)

When `scope-discipline` classifies a finding as `expands-scope`, or the
scope-owner `Defer`s an item, the proposal lands in a **committed**
backlog so it isn't lost when the working root is cleaned:

1. Initiative loaded → `initiatives/<initiative-slug>/backlog.md`.
2. No initiative → `initiatives/backlog.md`.
3. Workspace not onboarded (`initiatives/` absent) → last-resort
   `<working-root>/proposals/<target-slug>.md`, and say so.

A backlog entry carries the `scope-discipline` PROPOSAL payload plus a
board pointer:

```markdown
### <title>  ·  <YYYY-MM-DD>  ·  proposed-by: <agent>
- problem:          <the gap>
- proposed_change:  <what to do>
- friction_cost:    <steps/gates/screens/fields it adds>
- mission_tradeoff: <vs mission + non_negotiables>
- scope_target:     <the milestone it belongs to if adopted>
- board:            <work-item id once promoted to `proposed`, or "—">
```

Promoting a backlog entry = adding it to `BOARD.md` as `proposed` and
linking back. This closes the loop: findings are grounded (scope-owner),
parked ideas persist (committed backlog), and picked-up ideas re-enter the
board — nothing is silently built and nothing is silently lost.

## Hard rules

1. **Claim on entry, hand off on exit.** No acting agent touches product
   work without a board row it owns and a HANDOFF when it stops.
2. **Committed, not scratch.** Board, threads, and backlog live in
   `initiatives/` and travel via `git`. Never move coordination state into
   the gitignored working root.
3. **Index, don't duplicate.** Threads link to artifacts under the path
   grammar; they don't re-paste reports.
4. **Address roles, resolve questions.** Every blocking QUESTION blocks its
   item until an ANSWER lands. Never let a blocking ask sit silent.
5. **One target, one active owner.** Two active items on the same `target`
   is a collision to raise, not to ignore.
6. **Name the next role.** Every HANDOFF ends by pointing at who's next —
   that's what makes the team self-routing.

## Anti-patterns

- ❌ Doing product work with no board row — invisible work the team can't
  see, schedule around, or pick up.
- ❌ Burying the handoff in prose ("findings back to the PM") instead of a
  structured HANDOFF the next role can act on deterministically.
- ❌ Asking the operator to relay a question you could address to a role in
  a thread.
- ❌ Parking a good idea in the gitignored working root, where it dies at
  the next cleanup. Deferred work goes to the committed backlog.
- ❌ Editing a target another active item already owns without raising the
  collision.

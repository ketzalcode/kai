---
name: kai-core-peer-communication
description: "Peer-question packet contract. Use when kai roles need a real QUESTION/ANSWER exchange over inline consult, peer transport, or durable item thread."
tools: [execute, read, search]
---

# Peer Communication

kai's agents constantly need something from a sister lane: the trainer
needs a macro call from the nutritionist, the applied engineer needs a
product-fit read from the PM, a backend build needs the architect to
settle a seam. There are **three** ways that question can travel, and
until they're reconciled they look like competitors. They aren't. This
contract makes them **one protocol, three transports, one system of
record.**

It is **not** a standalone trigger skill. `kai-core-work-acting` pulls it in
as its durable transport, and any agent that consults a sister lane pulls
it in for the live/inline transports.

## The one packet

Every peer exchange, on any transport, is the same shape. Durable or blocking
questions also carry the stable ID allocated in the work item's thread:

```
QUESTION Q-<item-id>-<NN> <ts> — <from-role> -> @<to-role>
- status:   <open | answered | escalated>
- kind:     <fact | decision | reply | action>
- blocking: <yes | no>
- context:  <what you're doing and why this gates it>
- ask:      <the one specific question>
- answer_by:<timestamp or "next-dispatch">

ANSWER Q-<item-id>-<NN> <ts> — <from-role> -> @<asker>
- status:   answered
- answer:   <the answer, in the answering role's voice>
- lane:     <in-lane | out-of-lane: who should really take it>
- provenance: <live-peer | durable-thread | operator>
```

This is the same packet `kai-core-work-acting` submits to the durable
record — one shape, whichever transport carried it. A new ANSWER always
declares `status: answered` with a non-empty `answer` and `lane`; a blank
answer, an open/escalated status, or a missing status on a **new** record
never resolves the question. Pre-existing thread records written before this
unification may carry no `status` field on their ANSWER at all — that legacy
shape remains readable and still resolves the question when its `answer`/
`lane` otherwise do, but it is not the template for new records.

Address a **role**, not a person (`@eng-builder-software`). The one reserved
human endpoint is `@operator`, used only when a business/scope choice, requested
reply, credential, or irreversible action truly requires the human. Answer only
in **your lane** — if the ask is outside it, say so and name who owns it; don't
guess authoritatively.

`kind` is required:

- `fact` — a role-owned factual clarification;
- `decision` — a judgment or approval the addressee owns;
- `reply` — words or information the addressee must provide;
- `action` — an explicit operation only the addressee can perform.

For `@operator`, never use `fact`: ask the owning role first. Operator questions
must be `decision`, `reply`, or `action`, and `answer_by` must be a real
timestamp or `next-dispatch`.

## The three transports

| Transport | What it is | Real independent judgment? | Persists? | Cost | Reach |
|-----------|-----------|:--------------------------:|:---------:|------|-------|
| **Inline consult** | You load the peer's `*.agent.md`, adopt its mental model, and answer the packet *in that voice* yourself. | **No — you're simulating the peer.** | No (unless transcribed) | Cheapest | Same run, same context |
| **Live peer** | The host exposes background agents (the Copilot CLI's `task` / `write_agent` / `read_agent`): spawn or message the *real* peer agent, loaded with its agent file, and read its reply. | **Yes — the peer's own reasoning.** | No (unless transcribed) | Medium (a real agent turn) | Same session, separate context |
| **Durable record** | Submit `question.open` / `question.answer` through the runtime, and read them back with `messages --item <item-id>`. | Whoever answers (a real role, later) | **Yes — committed** | Async latency | Across sessions, machines, cloud |

The packet is identical across all three. What differs is **who really
answers** and **whether it survives**.

kai's runtime does not observe a live peer's model or its effects: peer
model/effect observation returns `UNSUPPORTED_HOST`. A live answer is the peer's
words, not a certified invocation — which is exactly why a load-bearing one is
recorded rather than trusted in place.

## Choosing a transport

```
Need only the peer's lane knowledge / mental model, quick, this run,
   and the answer isn't decision-grade?            ──►  INLINE CONSULT
Need the peer's real independent judgment, host has
   peer agents, same session?                      ──►  LIVE PEER
Does it block a work item, cross a session,
   or change a decision?                            ──►  DURABLE THREAD (always, as the record)
```

These compose: you often get an answer **live** (inline or live peer) and
then **record** it on the thread because it was load-bearing. Live and
durable are not either/or — see the bridging rule.

## The bridging rule — transport is performance, the thread is truth

**How you get the answer fast is a performance choice. Where a load-bearing
answer lives is a correctness choice.** So:

1. **Any exchange that blocks a work item, crosses a session, or changes
   a decision MUST land on the durable record** — whichever live transport
   carried it. Submit the packet as `question.open` / `question.answer` through
   `scripts/coordinate.mjs apply` (a one-line "answered live via <transport>"
   is enough provenance). Writing it into a Markdown file does not record it.
2. **A blocking QUESTION flips the item to `blocked`** (per
   `kai-core-work-acting`), copying the current state to `resume_state` only when
   first entering blocked, and adds the ID to `waiting_on_questions`.
   Additional questions never overwrite the saved state. As answers land,
   remove their IDs one by one; the lifecycle-authorized role restores and
   clears `resume_state` only after every blocking question is answered. Never
   infer the prior state from an older handoff.
3. **A non-blocking, purely-informational, same-run consult** (a lane fact
   that doesn't change the decision) can stay inline — attribute it in your
   output and move on. If it turns out to change the decision, it just
   became load-bearing: put it on the thread.

The durable thread is owned by `kai-core-work-acting`; this contract owns the
packet and the transport choice that feeds it.

## The bias guard — don't answer your own question when judgment is the point

Inline consult is **you playing the peer.** That's fine when you only need
a **fact from their lane** ("is 120g protein at 150lb a floor or a
target?"). It is **wrong** when the peer's **independent judgment is the
whole point** — an assessment, a scope call, a product-fit verdict —
because you'll unconsciously answer it the way that suits your own finding.
That defeats the reason kai keeps assessors honest and unbiased (see
`kai-core-scope-discipline`'s three-role split).

So: **when the answer feeds an assessment, a scope decision, or a
ship/no-ship call, don't simulate the peer.** Use the **live peer** (its
real reasoning) or a **real thread QUESTION** the actual role answers
later. Reserve inline consult for lane facts that inform, not verdicts that
decide.

## Host-awareness

The **live peer** transport exists **only where the host exposes peer
agents** — the Copilot CLI's background `task` agents you message with
`write_agent` and read with `read_agent`. Some hosts (a bare cloud coding
agent, a restricted runner) expose none. So:

- **Never assume a live peer is available.** Probe the host's capability;
  if there are no peer agents, degrade gracefully. Never claim a peer's model
  or its effects were observed — that capability returns `UNSUPPORTED_HOST`.
- **No live transport?** Use **inline consult** for lane facts and the
  **durable record** for anything blocking or cross-session. Recording a
  question needs only the core runtime and a schema-4 workspace, so the
  protocol never depends on peer agents being present. Where the workspace is
  schema 3 or absent, the coordinated write refuses with `SCHEMA_MISMATCH`:
  name that gap rather than inventing a fallback.

## Hard rules

1. **One packet, always.** Same QUESTION/ANSWER shape on every transport;
   address a role, answer in your lane.
2. **Load-bearing ⇒ thread.** Anything that blocks, crosses a session, or
   changes a decision is transcribed to the item's thread, whatever carried
   it live. A blocking question gets a stable ID and sets the item `blocked`.
3. **Don't fake independence.** When independent judgment is the point,
   don't inline-simulate the peer — get the real peer (live) or a real
   thread answer.
4. **Degrade, don't assume.** No host peer agents → inline for facts,
   thread for durability. Never block on a transport the host lacks.
5. **Attribute.** An inline consult is marked as such in your output
   (`peer consult (inline): …`); a live answer names the peer; a thread
   answer is signed by the role.
6. **Reserve the human boundary.** `@operator` is not a catch-all escalation.
   Use it only for a decision, reply, credential, or irreversible action no kai
   role owns; classify it with `kind`.

## Anti-patterns

- ❌ Answering your own scope/assessment question inline and calling it a
  peer review — that's the bias the three-role model exists to prevent.
- ❌ Getting a decision-changing answer live and never recording it, so the
  next session re-litigates it. Load-bearing ⇒ thread.
- ❌ Assuming `write_agent`/background agents exist and stalling when they
  don't. Fall back to inline + thread.
- ❌ Messaging a *person* or a specific model instead of a **role**.
- ❌ Addressing `@operator` for a fact a principal or workflow role owns.
- ❌ Answering out of your lane with false confidence instead of naming who
  owns the call.
- ❌ Opening a durable thread QUESTION for a trivial same-run lane fact that
  changes nothing — that's ceremony; consult inline and move on.

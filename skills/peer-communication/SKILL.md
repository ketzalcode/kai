---
name: peer-communication
description: "The shared contract for how kai's agents ask each other things — reconciling the three ways a peer question can travel into one protocol so they stop competing. One canonical packet (QUESTION {from-role, to-role, blocking?, context, ask} / ANSWER {re, answer, lane-confidence}) carried by one of three transports: INLINE CONSULT (the asking agent loads the peer's agent file and answers in that voice — cheap, same-context, but a *simulation* of the peer), LIVE PEER (when the host exposes background agents — e.g. the Copilot CLI's task/write_agent/read_agent — spawn or message the real peer agent and get its *independent* judgment), and DURABLE THREAD (append the QUESTION/ANSWER to initiatives/threads/<item-id>.md — the async, cross-session system of record owned by work-coordination). The bridging rule: transport is a performance choice, the thread is the correctness choice — any exchange that blocks a board item, crosses a session, or changes a decision MUST land on the thread whichever live transport carried it, and a blocking question flips the board item to blocked until an ANSWER lands. The bias guard: inline consult is you *playing* the peer, fine for lane facts but wrong when independent judgment is the whole point (an assessment, a scope call) — then use the live peer or a real thread QUESTION the actual role answers, so you don't bias the signal by answering your own question. Host-aware: the live transport exists only where the host exposes peer agents; otherwise use inline for lane facts and the thread for anything durable or blocking. Address a role, not a person; answer only in your lane. NOT a standalone trigger skill — pulled in by work-coordination (as the durable transport) and by any agent that consults a sister lane (the persona trainer/nutritionist consult, the ai-applied-engineer product-fit consult), the way review-* lenses inherit doc-review-rigor."
tools: [bash, view, grep, glob]
---

# Peer Communication

kai's agents constantly need something from a sister lane: the trainer
needs a macro call from the nutritionist, the applied engineer needs a
product-fit read from the PM, a backend build needs the architect to
settle a seam. There are **three** ways that question can travel, and
until they're reconciled they look like competitors. They aren't. This
contract makes them **one protocol, three transports, one system of
record.**

It is **not** a standalone trigger skill. `work-coordination` pulls it in
as its durable transport, and any agent that consults a sister lane pulls
it in for the live/inline transports — the same way `review-*` lenses pull
in `doc-review-rigor`.

## The one packet

Every peer exchange, on any transport, is the same shape:

```
QUESTION — <from-role> → @<to-role>
- blocking: <yes | no>
- context:  <what you're doing and why this gates it>
- ask:      <the one specific question>

ANSWER — <from-role> → @<asker>
- re:     <the question, quoted or referenced>
- answer: <the answer, in the answering role's voice>
- lane:   <in-lane | out-of-lane: who should really take it>
```

Address a **role**, not a person (`@principal-swe-backend`). Answer only
in **your lane** — if the ask is outside it, say so and name who owns it;
don't guess authoritatively.

## The three transports

| Transport | What it is | Real independent judgment? | Persists? | Cost | Reach |
|-----------|-----------|:--------------------------:|:---------:|------|-------|
| **Inline consult** | You load the peer's `*.agent.md`, adopt its mental model, and answer the packet *in that voice* yourself. | **No — you're simulating the peer.** | No (unless transcribed) | Cheapest | Same run, same context |
| **Live peer** | The host exposes background agents (the Copilot CLI's `task` / `write_agent` / `read_agent`): spawn or message the *real* peer agent, loaded with its agent file, and read its reply. | **Yes — the peer's own reasoning.** | No (unless transcribed) | Medium (a real agent turn) | Same session, separate context |
| **Durable thread** | Append the QUESTION and its ANSWER to `initiatives/threads/<item-id>.md`. | Whoever answers (a real role, later) | **Yes — committed** | Async latency | Across sessions, machines, cloud |

The packet is identical across all three. What differs is **who really
answers** and **whether it survives**.

## Choosing a transport

```
Need only the peer's lane knowledge / mental model, quick, this run,
   and the answer isn't decision-grade?            ──►  INLINE CONSULT
Need the peer's real independent judgment, host has
   peer agents, same session?                      ──►  LIVE PEER
Does it block a board item, cross a session,
   or change a decision?                            ──►  DURABLE THREAD (always, as the record)
```

These compose: you often get an answer **live** (inline or live peer) and
then **record** it on the thread because it was load-bearing. Live and
durable are not either/or — see the bridging rule.

## The bridging rule — transport is performance, the thread is truth

**How you get the answer fast is a performance choice. Where a load-bearing
answer lives is a correctness choice.** So:

1. **Any exchange that blocks a board item, crosses a session, or changes
   a decision MUST land on the thread** — whichever live transport carried
   it. Transcribe the packet (a one-line "answered live via <transport>" is
   enough provenance) into `initiatives/threads/<item-id>.md`.
2. **A blocking QUESTION flips the board item to `blocked`** (per
   `work-coordination`), with `blocked-by` pointing at the answering role
   or the item you're waiting on, until an `ANSWER` is on the thread — then
   move it back.
3. **A non-blocking, purely-informational, same-run consult** (a lane fact
   that doesn't change the decision) can stay inline — attribute it in your
   output and move on. If it turns out to change the decision, it just
   became load-bearing: put it on the thread.

The durable thread is owned by `work-coordination`; this contract owns the
packet and the transport choice that feeds it.

## The bias guard — don't answer your own question when judgment is the point

Inline consult is **you playing the peer.** That's fine when you only need
a **fact from their lane** ("is 120g protein at 150lb a floor or a
target?"). It is **wrong** when the peer's **independent judgment is the
whole point** — an assessment, a scope call, a product-fit verdict —
because you'll unconsciously answer it the way that suits your own finding.
That defeats the reason kai keeps assessors honest and unbiased (see
`scope-discipline`'s three-role split).

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
  if there are no peer agents, degrade gracefully.
- **No live transport?** Use **inline consult** for lane facts and the
  **durable thread** for anything blocking or cross-session. The thread
  always works — it's just markdown — so the protocol never depends on a
  runtime being present. This mirrors how kai stays declarative: the record
  is files, the live transport is a host bonus.

## Hard rules

1. **One packet, always.** Same QUESTION/ANSWER shape on every transport;
   address a role, answer in your lane.
2. **Load-bearing ⇒ thread.** Anything that blocks, crosses a session, or
   changes a decision is transcribed to the item's thread, whatever carried
   it live. A blocking question sets the board item `blocked`.
3. **Don't fake independence.** When independent judgment is the point,
   don't inline-simulate the peer — get the real peer (live) or a real
   thread answer.
4. **Degrade, don't assume.** No host peer agents → inline for facts,
   thread for durability. Never block on a transport the host lacks.
5. **Attribute.** An inline consult is marked as such in your output
   (`peer consult (inline): …`); a live answer names the peer; a thread
   answer is signed by the role.

## Anti-patterns

- ❌ Answering your own scope/assessment question inline and calling it a
  peer review — that's the bias the three-role model exists to prevent.
- ❌ Getting a decision-changing answer live and never recording it, so the
  next session re-litigates it. Load-bearing ⇒ thread.
- ❌ Assuming `write_agent`/background agents exist and stalling when they
  don't. Fall back to inline + thread.
- ❌ Messaging a *person* or a specific model instead of a **role**.
- ❌ Answering out of your lane with false confidence instead of naming who
  owns the call.
- ❌ Opening a durable thread QUESTION for a trivial same-run lane fact that
  changes nothing — that's ceremony; consult inline and move on.

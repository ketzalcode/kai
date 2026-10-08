---
name: kai-core-peer-communication
description: "Use when a role needs a lane-specific question or answer through inline consultation, a live peer, or a durable typed message."
durable-output-producer: false
tools: [execute, read, search]
---

# Peer communication

Use one packet shape across three transports. The transport changes speed and
independence; durable authority always comes from the typed runtime record.

## Packet

```text
QUESTION Q-<task-id>-<NN> <ts> — <from-role> -> @<to-role>
- status: <open | answered | escalated>
- kind: <fact | decision | reply | action>
- blocking: <yes | no>
- context: <why this matters>
- ask: <one specific question>
- answer_by: <timestamp | next-dispatch>

ANSWER Q-<task-id>-<NN> <ts> — <from-role> -> @<asker>
- status: answered
- answer: <answer in the role's lane>
- lane: <in-lane | out-of-lane: owner>
- provenance: <inline-consult | live-peer | durable-record | operator>
```

Address a role, not a person. `@operator` is reserved for a real human-only
decision, reply, credential, or irreversible action. An out-of-lane recipient
names the owner instead of guessing.

## Transports

| Transport | Independence | Persistence |
| --- | --- | --- |
| Inline consult | simulated lane knowledge, not independent judgment | none |
| Live peer | real peer reasoning when the host supports it | none unless recorded |
| Durable typed message | answer supplied later by the named role or operator | SQLite record |

Use `question.open` and `question.answer`, then read with:

```text
node "<kai-plugin>/scripts/coordinate.mjs" messages \
  --root "<workspace-root>" --kind task --id <task-id>
```

SQLite at `.kai/core/runtime/coordination.sqlite` is the **only coordination
authority**. A live peer's words are not a certified model/effect observation;
the host may return `UNSUPPORTED_HOST`.

## Durable rule

Record an exchange when it blocks a Task, crosses sessions, changes a decision,
or supplies authority-bound input. A same-context, non-blocking lane fact may
stay inline until it becomes load-bearing.

A blocking question and its lifecycle effect are runtime commands. The answer
does not restore work automatically; the lifecycle-authorized actor re-reads
all blocking questions and performs the valid transition.

<!-- kai:schema4-history -->
Older retained Markdown threads and status-less ANSWER packets are historical
read inputs only. New schema-5 communication is a typed message record.
<!-- /kai:schema4-history -->

## Bias guard

When independent judgment is the point, do not answer your own question through
an inline simulation. Use a real peer or the named durable recipient. Never
upgrade simulated advice into approval.

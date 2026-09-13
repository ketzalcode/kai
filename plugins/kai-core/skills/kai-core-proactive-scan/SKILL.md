---
name: kai-core-proactive-scan
description: "Owns operator-signal interpretation (decisions, replies, actions, release-ready items) for on-demand briefings, and defines runner-invoked proactive notifications. Use when interpreting team records for a requested briefing or scan, or when an external cadence scans workspaces for newly actionable items."
tools: [execute, read, edit, search]
---

# Proactive Scan

kai is **proactive-surface, never autonomous**: it surfaces what needs the
operator *when invoked* — whether an on-demand briefing asks it to interpret
existing team records, or a scan checks for newly actionable ones. It cannot,
on its own, notice that a new decision appeared at 2am and tell you — because
**kai is a declarative prompt plugin: nothing in it wakes itself, watches for
changes, or pushes a message.**

This skill owns operator-signal interpretation on its own, independent of any
assistant agent, and closes the notification half of that gap honestly by
splitting it across a hard **runtime boundary**.

## The runtime boundary

| Layer | Who owns it | What it does |
|---|---|---|
| **Declarative (this plugin)** | kai, committed | `workflow-proactive-scan` + this method: given a workspace, **scan** read-only, diff against the delivery ledger, dedupe, and **emit** a payload; and on a later call, **ack** the runner's confirmed delivery to advance the ledger. No scheduling, no network, no credentials. |
| **Runtime (outside this plugin)** | the operator/host, local | An **external runner** (cron, Task Scheduler, a `schedule:` CI workflow) invokes the Copilot host with `workflow-proactive-scan` on a cadence, **delivers** the emitted payload to a consented channel, then calls the ack phase. See `examples/proactive-runner/`. |

kai defines the contract; the runner provides the heartbeat and the delivery.
The plugin never schedules itself and never ships channels or credentials.

## Two phases

The runner drives two explicit phases, so a signal is neither lost nor spammed:

1. **`scan`** — read-only. Detect signals, diff against the ledger, emit an
   immutable payload with a `notification_id` and per-signal `hash`. **Does not
   advance the ledger.**
2. **`ack`** — after the runner *confirms* delivery, it re-invokes with that
   `notification_id`; only then are the exact delivered signals advanced in the
   ledger. Re-running `ack` with the same `notification_id` is a **no-op**
   (idempotent). Semantics are **at-least-once**: an undelivered or failed
   notification is simply re-emitted next scan.

## Operator signals

Use this section to interpret existing team records for a requested briefing
or scan. Reading these signals does not require emitting notifications,
allocating an outbox payload, or advancing a delivery ledger.

Read `.kai/state/` items and threads as authoritative; never infer a decision
the records don't show. Map each coordination fact in `.kai/state/` to exactly
one signal:

- **Decision awaiting the operator** — a thread `QUESTION` addressed to
  `@operator` with `kind: decision` and no matching answered `ANSWER`; if
  blocking, its ID also appears in the item's `waiting_on_questions`.
- **Question addressed to the operator** — an open thread `QUESTION`
  addressed to `@operator` with `kind: reply` and no matching `ANSWER`.
- **Action only the operator can perform** — a thread `QUESTION` addressed to
  `@operator` with `kind: action` and no matching answered `ANSWER`; if
  blocking, its ID appears in `waiting_on_questions`.
- **Ready for the operator to ship** — an item in `release-ready` (the human
  deploy gate).
- **Blocked on the operator** — a `blocked` item whose `waiting_on_questions`
  contains an open `@operator` question; classify it by that question's
  `kind`.
- **Overdue operator request** — an unanswered `@operator` question whose
  `answer_by` timestamp has passed.

Preserve these distinctions when interpreting the records above:

1. An open `@operator` question has no matching answered `ANSWER` packet.
   Because threads are append-only, the original QUESTION line's stale
   `status: open` is not sufficient once an `ANSWER` has been appended.
2. Preserve `kind: decision|reply|action` as recorded; never reinterpret a
   `reply` as an operator decision.
3. An item in `release-ready` is a deploy gate, not a completed deployment.
4. Overdue is computed from the question's `answer_by`, never from inferred
   urgency.
5. A blocking question must be associated with its item via
   `waiting_on_questions`; a `proposed` item by itself is **not** an operator
   signal — it is steward work. The initiative steward owns promotion and
   priority.
6. Missing or unreadable input is not evidence that an open signal cleared —
   a root that failed to read must never be treated as resolved.

If `.kai/state/` is absent (no team workspace), there are no operator signals
to interpret — say so; never fabricate team signals.

## What the scan reads

Coordination is **read-only**. Against the **selected workspace** plus every
enabled, validated root in its `.kai/personal/workspaces.md` (per
`kai-core-workspace-initiative`), apply the **Operator signals** section above
to each fully-read root — nothing new is invented. The scan changes no
coordination record.

## Signal identity and change detection

Deterministic identity, independent of mutable display labels:

- **`key`** — `<root-id>:<item-id>:<Q-id|release-ready>`, where `root-id` is a
  stable normalized workspace-root identifier (normalized absolute path, or a
  manifest-recorded id), **not** the human `workspaces.md` label.
- **`hash`** — SHA-256 over canonical JSON of the signal's **exact material
  fields only**: for a question `{kind, ask, answer_by, blocking}`; for a
  release-ready item `{item, state}`. Never hash generated summaries, full
  append-only threads, file mtimes, leases, or item `version` — those change
  without the operator-facing meaning changing and would cause spam or hide it.

## Delivery ledger (snapshot)

The last successfully delivered state lives in a gitignored local ledger,
separate from the transient scan observation:

```text
.kai/personal/proactive/snapshot.json
```

```json
{
  "schema": "kai.proactive-snapshot/v1",
  "revision": 7,
  "root_id": "<stable normalized root id>",
  "last_scan": "<YYYY-MM-DD HH:MM local>",
  "last_ack": "<YYYY-MM-DD HH:MM local>",
  "signals": [
    {
      "key": "<root-id>:<item-id>:<Q-id|release-ready>",
      "kind": "decision|reply|action|release-ready",
      "delivered_hash": "<hash last confirmed delivered, or null>",
      "delivered_at": "<ts or null>",
      "overdue_notified": false
    }
  ]
}
```

## Diff and deduplication

Compare the current scan to the ledger:

- **new** — `key` absent, or `delivered_hash: null` → deliver.
- **changed** — `key` present and current `hash` ≠ `delivered_hash` → deliver
  (and reset `overdue_notified`).
- **overdue** — delivered and unchanged, but `answer_by` has now passed and
  `overdue_notified` is false → deliver once as overdue; `ack` sets
  `overdue_notified: true` so it does not repeat until the signal changes.
- **unchanged** — delivered, not overdue → **suppress** (the core dedup rule).
- **cleared** — a ledger `key` no longer present in a **fully and successfully
  read** scan (answered/shipped) → drop it on the next `ack`. A `key` missing
  only because its root failed to read is **not** cleared (see Failure).

`scan` classifies and emits; `ack` applies the resulting ledger changes for the
signals the runner confirmed. Nothing advances on `scan` alone.

## Notification payload

`scan` emits one immutable payload and writes it to the gitignored outbox
`.kai/personal/proactive/outbox/<YYYY-MM-DD-HHMM>.json`:

```json
{
  "schema": "kai.proactive-notification/v1",
  "notification_id": "<n-YYYYMMDD-HHMM-<root-id-short>>",
  "generated": "<YYYY-MM-DD HH:MM local>",
  "root_id": "<stable normalized root id>",
  "based_on_revision": 7,
  "status": "signals | none | partial | error",
  "gaps": [ { "root": "<label>", "reason": "<unreadable/invalid>" } ],
  "signals": [
    {
      "key": "<...>",
      "hash": "<sha256>",
      "kind": "decision|reply|action|release-ready",
      "state": "new|changed|overdue",
      "summary": "<one line — what needs the operator>",
      "workspace": "<label>",
      "path": ".kai/state/threads/<id>.md  (release-ready → .kai/state/items/<id>.md)",
      "answer_by": "<ts or —>"
    }
  ],
  "note": "surface-only — the operator decides; kai took no action"
}
```

An empty scan emits `status: none` (deliver a heartbeat or stay silent per the
runner's config) — never a fabricated signal. `ack` references
`notification_id` and advances only its listed signals.

## Channels and consent (separate from the plugin)

Channel bindings and consent are **operator-owned local config**, gitignored,
never part of the committed plugin:

```text
.kai/personal/proactive/channels.md      # channel type + secret_ref + consent + enabled
```

- **kai emits; the runner delivers.** kai's declarative contract carries no
  channel IDs, credentials, or network calls.
- A channel is delivered to only with explicit `consent: yes`; the **runner**
  parses consent before sending. No consent → the payload sits in the outbox and
  nothing is sent.
- `channels.md` stores a **`secret_ref`** (the *name* of a runner-side secret),
  never the secret itself; webhook URLs, tokens, and channel IDs live in the
  runner's secret store.
- **v1 targets exactly one consented channel.** Multiple channels need
  per-channel delivery tracking, which is out of scope for v1.

## Read-only and no external action

- **Coordination/source is read-only**; the only local writes are under
  `.kai/personal/proactive/` (outbox + ledger).
- The scan and its workflow **never** reply to a thread, approve scope, send a
  peer message, commit, or deploy. The **only** external effect is the configured
  notification, and the **runner** performs the delivery. Everything the operator
  must actually do stays theirs to do, on demand, with the role they choose.

## Failure surfacing

- Selected workspace unreadable or missing `.kai/manifest.json` → emit
  `status: error` with the reason; advance nothing.
- A linked root that is unreadable/invalid → `status: partial`, record it in
  `gaps[]`, and **preserve** that root's ledger signals (never classify them
  cleared). Clears are computed only from roots that read fully and successfully.
- Delivery failure is reported by the runner: it simply does not call `ack`, so
  the ledger is unadvanced and the next scan re-emits. `ack` is the only path
  that advances the ledger.

## Output contract

`scan` returns and writes to the outbox:

```text
Proactive scan: <root label> — <signals N | none | partial | error>
Notification: <notification_id>  ·  based on revision <N>
Roots: <selected + linked labels; gaps noted>
New: <n> · Changed: <n> · Overdue: <n> · Suppressed: <n>
Payload: <absolute .kai/personal/proactive/outbox/<ts>.json path>
Ledger: unchanged (advances only on ack)
Action taken: none (coordination read-only)
```

`ack` returns:

```text
Proactive ack: <notification_id> — advanced <n signals> | already-applied (no-op)
Ledger: revision <N+1>
```

## Anti-patterns

- ❌ Implying kai schedules or wakes itself — the cadence is the external runner's.
- ❌ Advancing the ledger on `scan` (before delivery is confirmed via `ack`).
- ❌ Re-delivering an unchanged, already-delivered signal, or re-firing an
  overdue notice `overdue_notified` already covers.
- ❌ Treating a signal missing due to a failed root as `cleared`.
- ❌ Hashing summaries, full threads, mtimes, leases, or `version` (spam / hidden
  change); keying on the mutable display label instead of a stable `root-id`.
- ❌ Storing a real credential/channel ID in `channels.md` instead of a `secret_ref`.
- ❌ Replying, approving, committing, or deploying — the scan is read-only.
- ❌ Committing `.kai/personal/proactive/`.

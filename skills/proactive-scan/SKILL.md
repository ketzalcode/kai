---
name: proactive-scan
description: "Contract for runner-invoked proactive notification of the operator. kai is a declarative prompt plugin and cannot wake itself; this skill defines the two-phase, read-only behavior an EXTERNAL runner triggers on a cadence — a scan phase that reuses personal-agenda's operator-signal detection to find newly-actionable decisions/replies/actions/release-ready items across a selected workspace and its linked roots, diffs them against a gitignored delivery ledger, deduplicates (new/changed/overdue), and emits an idempotent notification payload; and an ack phase the runner calls after confirmed delivery to advance the ledger. Coordination is read-only, local writes are limited to personal/proactive/, and the only external effect is the configured notification the runner delivers."
tools: [bash, view, edit, create, grep, glob]
---

# Proactive Scan

The executive assistant is **proactive-surface, never autonomous**: it surfaces
what needs the operator *when invoked*. It cannot, on its own, notice that a new
decision appeared at 2am and tell you — because **kai is a declarative prompt
plugin: nothing in it wakes itself, watches for changes, or pushes a message.**

This skill closes that gap honestly by splitting the problem across a hard
**runtime boundary**.

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

## What the scan reads

Coordination is **read-only**. Against the **selected workspace** plus every
enabled, validated root in its `personal/workspaces.md` (per
`workspace-conventions`), reuse `personal-agenda`'s **Source A** detection —
nothing new is invented:

- an open thread `QUESTION` to `@operator` (`kind: decision|reply|action`) with
  no matching answered `ANSWER`;
- an item in `release-ready` (the human deploy gate);
- an `@operator` question whose `answer_by` has passed (overdue).

A coordination `state: proposed` item is **not** an operator signal (steward
work), exactly as in `personal-agenda`. The scan changes no coordination record.

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
personal/proactive/snapshot.json
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
`personal/proactive/outbox/<YYYY-MM-DD-HHMM>.json`:

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
      "path": "coordination/threads/<id>.md  (release-ready → coordination/items/<id>.md)",
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
personal/proactive/channels.md      # channel type + secret_ref + consent + enabled
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
  `personal/proactive/` (outbox + ledger).
- The scan and its workflow **never** reply to a thread, approve scope, send a
  peer message, commit, or deploy. The **only** external effect is the configured
  notification, and the **runner** performs the delivery. Everything the operator
  must actually do stays an on-demand action through the executive assistant.

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
Payload: <absolute personal/proactive/outbox/<ts>.json path>
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
- ❌ Committing `personal/proactive/`.

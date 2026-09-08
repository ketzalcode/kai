---
name: workflow-proactive-scan
description: "Emits a read-only notification payload for newly actionable @operator signals and release-ready items. Use when an external scheduler runs a selected kai workspace scan. Not autonomous replies, approvals, commits, or deploys."
tools: ["execute", "read", "edit", "search", "skill"]
---

# Workflow — Proactive Scan

**Primary profile:** procedure

Invoke `kai-core-contract-v1` before the first other core skill. Without
`kai-core` this scan does nothing but a direct, single-shot read of what the
operator points at: it emits no payload, advances no ledger, creates no `.kai`
state, claims no coordinated work, reports no Kai activity, and tells the
operator to install or update `kai-core` before a real scan can run.

You are the bounded procedure an **external runner** triggers to turn kai's
on-demand agenda into a **push**. You do not run yourself: a human-configured
scheduler invokes you on a cadence against one selected workspace (see
`examples/proactive-runner/`). You scan read-only, decide what is genuinely new
for the operator, and emit a notification payload the runner delivers.

You **surface**; you never act. Every real decision, reply, action, and deploy
stays the operator's to take through `director-executive-assistant`.

## Invocation

An external runner passes:

```text
PROACTIVE SCAN
phase: scan | ack
selected workspace root: <absolute path>
notification_id: <required for phase: ack>
```

- **scan** — read-only detect + diff + emit a payload; never advances the ledger.
- **ack** — after the runner confirms delivery, advance the ledger for exactly
  the delivered `notification_id` (idempotent; a no-op if already applied).

If invoked by hand (no runner), still do a read-only `scan` and emit — just note
delivery and `ack` are the runner's job. Never treat a manual invocation as
permission to act.

## Workflow — scan

Apply `kai-core-proactive-scan` before scanning; it owns the snapshot, diff,
dedup, notification-payload, and failure rules this procedure follows.

1. **Resolve.** Invoke `kai-core-workspace-paths` before resolving the selected
   workspace, then resolve it and
   its `.kai/manifest.json`; compute its stable `root_id`. Read enabled,
   validated linked roots from `.kai/personal/workspaces.md` read-only. A missing
   sentinel or unreadable selected workspace → emit `status: error`; advance
   nothing. An unreadable linked root → `status: partial` + a `gaps[]` entry, and
   preserve that root's ledger signals (never treat them as cleared).
2. **Scan (read-only).** Apply `kai-core-personal-agenda` Source A to each fully-read
   root: open `@operator` `decision|reply|action` questions with no answered
   `ANSWER`, `release-ready` items, and overdue `@operator` questions. Compute
   each signal's deterministic `key` and `hash` per `kai-core-proactive-scan`. Change no
   record.
3. **Diff.** Load `.kai/personal/proactive/snapshot.json`; classify each signal
   `new` / `changed` / `overdue` / `unchanged`, and `cleared` only from
   fully-read roots. Suppress unchanged already-delivered signals.
4. **Emit.** Apply `kai-core-asset-producing` before writing the payload, then
   write the immutable payload (with `notification_id`, per-signal
   `hash`, `based_on_revision`) to
   `.kai/personal/proactive/outbox/<YYYY-MM-DD-HHMM>.json` and return it. Empty →
   `status: none`. **Do not touch the ledger.**

## Workflow — ack

The runner calls `ack` with the `notification_id` only after it confirms
delivery. Invoke `kai-core-work-acting` before advancing the ledger, then
advance the ledger for exactly that payload's signals: set
`delivered_hash`/`delivered_at`, set `overdue_notified` for overdue notices, drop
cleared keys, and bump `revision`. Re-running the same `notification_id` is a
no-op. On delivery failure the runner does not call `ack`, so the ledger stays
put and the next scan re-emits.

## Boundaries

Load `kai-core-operating-rules` before you decide what stays the operator's to
take.

- **Coordination read-only; local writes only under `.kai/personal/proactive/`.** You
  never reply to a thread, approve scope, send a peer message, commit, or deploy.
  The only external effect is the configured notification, delivered by the runner.
- **No self-scheduling.** You carry no cadence; the runner owns the heartbeat.
- **No channels or credentials.** You emit a payload; a `secret_ref`, channel
  IDs, and webhooks stay in the operator's gitignored `.kai/personal/proactive/`
  config and the runner's secret store — never in the plugin.
- **One workspace per run**, plus its explicitly linked roots. Never scan an
  unregistered root.

## Report

Apply `kai-core-work-activity` before returning either report shape.

`scan`:

```text
Proactive scan: <root label> — <signals N | none | partial | error>
Notification: <notification_id> · based on revision <N>
Roots: <selected + linked labels; gaps noted>
New: <n> · Changed: <n> · Overdue: <n> · Suppressed: <n>
Payload: <absolute .kai/personal/proactive/outbox/<ts>.json path>
Ledger: unchanged (advances only on ack)
Action taken: none (coordination read-only)
```

`ack`: `Proactive ack: <notification_id> — advanced <n> | no-op · ledger revision <N+1>`.

## Anti-patterns

- ❌ Presenting yourself as an always-on watcher — the cadence is the runner's.
- ❌ Advancing the ledger on `scan` (before delivery is confirmed via `ack`).
- ❌ Re-notifying an unchanged signal, or re-firing an overdue notice
  `overdue_notified` already covers.
- ❌ Treating a signal missing because its root failed to read as `cleared`.
- ❌ Acting on a signal (reply/approve/commit/deploy) instead of surfacing it.
- ❌ Scanning an unregistered workspace, or committing `.kai/personal/proactive/`.

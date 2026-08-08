# Proactive runner (template — you host this, not kai)

kai is a declarative prompt plugin: **it cannot wake itself.** To get *pushed*
updates ("a new decision is waiting on you") instead of on-demand ones, you run a
small external **runner** on a cadence that invokes `workflow-proactive-scan`
against one of your Kai workspaces and delivers what it emits.

Everything in this folder is a **template you copy into your own environment**.
None of it runs inside the kai plugin repo, and kai ships no scheduler, channel,
or credential.

## The boundary

```
┌─ your runtime (cron / Task Scheduler / CI schedule) ─────────────┐
│  1. on a cadence, invoke the Copilot host with                    │
│     workflow-proactive-scan against a selected Kai workspace      │
│  2. read the emitted payload                                      │
│  3. deliver it to your channel (email / Slack / webhook / file)   │
└──────────────────────────────────────────────────────────────────┘
                 │ invokes (read-only)          ▲ emits payload
                 ▼                              │
┌─ kai (declarative plugin) ───────────────────┴───────────────────┐
│  workflow-proactive-scan + proactive-scan:                        │
│    read-only scan → diff vs snapshot → dedupe → emit payload      │
│    (no scheduling, no network, no credentials)                    │
└──────────────────────────────────────────────────────────────────┘
```

- **kai** decides *what is newly actionable* and writes a payload to the
  gitignored `kai/personal/proactive/outbox/`. It never schedules or sends.
- **Your runner** provides the heartbeat and the delivery.

## What kai maintains (gitignored, local)

- `kai/personal/proactive/snapshot.json` — the last successfully delivered signals,
  so the same one isn't re-sent unless it changes or becomes overdue.
- `kai/personal/proactive/outbox/<ts>.json` — the payload for your runner to deliver.
- `kai/personal/proactive/channels.md` — **your** consent + a `secret_ref` (the
  *name* of a runner-side secret), never the credential itself. See
  `channels.example.md`.

## Consent and safety

- A channel is used only with explicit `consent: yes` in `channels.md`.
- The scan is **read-only**: it never replies, approves, commits, or deploys. The
  only external effect is the notification your runner delivers.
- On a read or delivery failure the snapshot is **not** advanced, so the next run
  retries the same signals rather than losing them.

## Wiring options

Pick whichever scheduler you already trust. Each simply invokes the Copilot host
with `workflow-proactive-scan` and then delivers the payload.

- **GitHub Actions `schedule:`** — see `github-actions-schedule.yml`. Copy it into
  *your* repository's `.github/workflows/` (not into kai), set your channel
  secret, and adjust the cron.
- **cron (macOS/Linux)** — `*/30 9-18 * * 1-5  /usr/local/bin/kai-proactive.sh`
  where the script runs the Copilot CLI against your workspace and pipes the
  outbox payload to your channel.
- **Windows Task Scheduler** — a scheduled task running the same script via
  `pwsh`.

## Two phases: scan, then ack

The runner drives two invocations so a signal is neither lost nor spammed:

1. **scan** (read-only) → kai writes the payload to the outbox and returns a
   `notification_id`;
2. your runner **delivers** the payload to the consented channel (only on
   `consent: yes`, failing loudly on HTTP errors);
3. **ack** — on *confirmed* delivery only, the runner re-invokes with the
   `notification_id`, and kai advances the dedup ledger exactly once.

On delivery failure the runner skips ack, so the next scan re-emits the same
signals (at-least-once). The ledger under `kai/personal/proactive/` must be
**persisted across runs** (e.g. `actions/cache`) — hosted runners start clean and
would otherwise treat every signal as new. Keeping delivery in the runner is
deliberate: it keeps every credential out of the committed plugin.

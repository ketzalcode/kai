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
  *your* repository's `.github/workflows/` (not into kai), copy `runner.mjs`
  alongside it, set the two secrets below, and adjust the cron.
- **cron (macOS/Linux)** — `*/30 9-18 * * 1-5  /usr/local/bin/kai-proactive.sh`
  where the script runs the same three commands.
- **Windows Task Scheduler** — a scheduled task running the same script via
  `pwsh`.

## The host invocation

kai is invoked non-interactively. `-p/--prompt` runs a single prompt and exits;
`--agent` selects the agent:

```bash
copilot -p "phase: scan; selected workspace root: $PWD" \
  --agent workflow-proactive-scan \
  --allow-tool 'view' --allow-tool 'grep' --allow-tool 'glob' \
  --allow-tool 'create' --allow-tool 'edit' \
  --deny-tool 'bash' \
  --no-color --log-level error
```

Tools are granted **narrowly rather than with `--allow-all-tools`**. The scan is
specified read-only apart from writing under `kai/personal/proactive/`, so it
needs to read the workspace and write those two files — nothing more. Grant the
least that works for your setup.

### Authentication

| Secret | What it is |
|---|---|
| `COPILOT_GITHUB_TOKEN` | a **fine-grained PAT** with **Copilot Requests: Read**. The built-in Actions `GITHUB_TOKEN` does **not** carry Copilot permissions and will not work. |
| `KAI_NOTIFY_WEBHOOK` | your channel's real URL/token. Its **name** must match the `secret_ref` in `channels.md` exactly. |

## The runner: `runner.mjs`

Dependency-free Node ESM — no install step beyond Node itself. Three commands:

| Command | Does |
|---|---|
| `plan --payload <f> --channels <f> --secret <NAME>` | decides `deliver` / `skip` / `fail` |
| `retain --outbox <dir> [--acked <id>] [--keep <n>]` | applies the retention policy; idempotent |
| `redact --payload <f>` | prints a diagnostic carrying no personal content |

`node runner.mjs --self-test` runs its fixture suite; kai runs it in `npm test`.

### Why consent is parsed, not grepped

`channels.md` is markdown whose prose legitimately contains the words
`consent: yes` while *describing the format*. A `grep -q 'consent:\s*yes'` matches
that prose and authorizes a send from a file that consents to nothing. `plan`
parses only the fenced yaml block, and requires **all** of:

- `enabled: true`
- `consent: yes`
- a known `type` (`webhook` / `email` / `slack` / `file`)
- a `secret_ref` naming a secret the runner **actually holds**

Exactly one channel is supported in v1; two blocks fail rather than guess which
was meant. A fixture asserts that the naive grep would have been fooled by the
same input the parser correctly refuses.

### deliver / skip / fail

- **deliver** — consented and configured.
- **skip** (exit 0) — correctly nothing to send: `status: none`, or no consent.
- **fail** (exit 1) — a scan error, or broken configuration: an unknown channel
  type, a `secret_ref` the runner does not hold, an uninterpretable `consent`
  value. These are loud on purpose, because a misconfigured channel that
  silently no-ops looks exactly like a quiet week.

## What is cached, and what is not

**Only `snapshot.json` is cached.** The outbox holds notification summaries —
real personal content — and GitHub advises against storing sensitive data in
Actions caches, since a pull request with read access can read caches on the base
branch. The dedup ledger is all that needs to survive between runs.

## Retention

The ledger, not the outbox, is the durable record — so once a payload is **acked**
it has served its purpose. After a confirmed ack the runner deletes that payload
and prunes the outbox to the 5 most recent (`--keep`). Re-running retention with
the same `notification_id` is a no-op, which is the normal consequence of a
retried step.

Deletion is gated on the **ack**, not on the delivery. Ack can fail after a
successful send; if it does, the ledger has not advanced, so the next run will
re-emit that signal and needs the payload still on disk. In that case only the
`--keep` pruning runs.

## Failure diagnostics

On failure the workflow uploads a **redacted** artifact: schema,
`notification_id`, status, and signal counts by kind and state. Signal summaries,
item paths, workspace labels, and root ids are omitted by policy.

Gap reasons are model-authored free text that can name a file, so they are
**classified** to `unreadable` / `invalid` / `unspecified` rather than copied —
into the artifact and into the step output alike. A CI artifact is readable by
anyone with Actions read access, so a diagnostic is actionable without exposing
what the notification said.

Every scan-derived value reaches the shell through `env:`, never through `${{ }}`
interpolation into a `run:` block, because `${{ }}` substitutes the raw string
before the shell parses it.

## What kai's tests do and do not prove

`npm test` runs the runner's fixture suite, so the consent gate, status routing,
secret binding, retention idempotency, and redaction are all covered
automatically — including a fixture asserting that the naive grep this runner
replaced *would* have been fooled by input the parser refuses.

They cannot prove the **end-to-end cycle**: that needs a real Copilot PAT, a real
workspace, and a real channel endpoint. Nor do they exercise the workflow YAML,
which never runs in this repository — it is an example for you to copy. Run it
once with `workflow_dispatch` after copying it, and confirm you receive the
notification. Everything up to the network boundary is tested; the network
boundary itself is yours to verify.

## Two phases: scan, then ack

The runner drives two invocations so a signal is neither lost nor spammed:

1. **scan** (read-only) → kai writes the payload to the outbox and returns a
   `notification_id`;
2. your runner **delivers** the payload to the consented channel (only on
   `consent: yes`, failing loudly on HTTP errors);
3. **ack** — on *confirmed* delivery only, the runner re-invokes with the
   `notification_id`, and kai advances the dedup ledger exactly once.

On delivery failure the runner skips ack, so the next scan re-emits the same
signals (at-least-once). The **ledger** under `kai/personal/proactive/` must be
persisted across runs (e.g. `actions/cache`) — hosted runners start clean and
would otherwise treat every signal as new. Keeping delivery in the runner is
deliberate: it keeps every credential out of the committed plugin.

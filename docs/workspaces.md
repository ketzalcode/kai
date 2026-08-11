[kai](../README.md) / [Docs](README.md) / Workspace model

# Workspace model

What kai writes into your repository, where it goes, and why. This is the
contract every agent resolves paths against — if you only read one thing here,
read the two-root tree.

Install this plugin into any repo and run **`workflow-workspace-init`** once.
It applies the `workspace-onboarding` and `workspace-conventions` contracts so
every agent resolves the same paths:

```
<workspace>/
├─ .kai/                                   hidden control plane
│  ├─ manifest.json + CONVENTIONS.md       committed bootstrap
│  └─ runs/<area>/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/   ignored raw evidence and scratch
└─ kai/                                    visible human working corpus
   ├─ coordination/
   │  ├─ ACTIVE.md + BOARD.md + backlog.md
   │  ├─ items/<item-id>.md                authoritative work state
   │  └─ threads/<item-id>.md              durable handoffs and peer questions
   ├─ initiatives/
   │  ├─ INDEX.md
   │  └─ <slug>/
   │     ├─ northstar.md + log.md + backlog.md
   │     ├─ deliverables.md + director-summary.md
   │     └─ artifacts/{product-map.md,design-system.md,customer-success/,support/,
   │                    growth/,analytics/,security/,reliability/,incidents/,
   │                    briefs/,research/,designs/,decisions/}
   ├─ library/                             promoted cross-initiative outcomes
   │  └─ reviews/ dev-designs/ investigations/ briefings/ qa-findings/
   │     lessons/ digests/ learnings/ releases/ playbooks/
   └─ personal/                            ignored personal ops + growth
      ├─ inbox.md + agenda.md + workspaces.md
      ├─ identity/{voice.md,career-*.md}
      └─ consultations/ + decisions/ + proactive/ + lessons/ + courses/ + certs/ + growth/
```

Two roots, one axis: **`.kai/` is the control plane** (bootstrap sentinel,
contract, and regenerable raw evidence — machine state, so hidden), and
**`kai/` is the working corpus** (everything humans browse, search, and edit,
so visible and grouped under one predictable parent rather than scattered
across your repository root). `.kai/manifest.json` is the stable discovery
anchor and did not move.

That tree is the complete **vocabulary**, not the initial footprint. Onboarding
seeds the spine — the manifest, `CONVENTIONS.md`, the coordination registries,
the initiative index, and the library README, about ten tracked files, plus the
gitignored `kai/personal/` lane in full so the personal agents have their own
state. Only two **output-only** lanes are deferred: `.kai/runs/<area>/` and
`kai/library/<type>/` are created by the agent that first writes into them, in
the same action. So a fresh workspace holds almost nothing, and it grows only
lanes you actually used.

An absent output lane is never an error: the workspace doctor reports such a
workspace as healthy, and no agent may refuse to act because a lane it is about
to create does not exist yet. This is also why those lanes are not pre-created —
git cannot track an empty directory, so a pre-created lane would silently
disappear on the next clone and leave your teammates with a different tree than
the one onboarding reported building. There are no onboarding profiles and no
layout modes; only the moment a lane is created differs.

- `.kai/runs/` holds raw, regenerable, or heavy evidence and is ignored.
- `kai/coordination/` holds high-churn cross-effort operational state.
- `kai/initiatives/` holds strategic intent and outputs owned by one initiative.
- `kai/library/` holds explicitly promoted outcomes reusable across initiatives.
- `kai/personal/` holds ignored workspace-local assistant state, optional linked
  workspaces, consultation records, decision briefs, proactive-scan state, identity/career context,
  and learning.

Initiative work defaults to its own `artifacts/` tree. Promotion to
`kai/library/` is explicit, steward-approved, recorded in `deliverables.md`,
and one-way: the library path becomes canonical for cross-initiative use while
the initiative copy remains provenance.

<!-- kai:allow-legacy-roots -->
> **Upgrading from schema 1?** Workspaces onboarded before v0.27.0 keep
> `coordination/`, `initiatives/`, `library/`, and `personal/` at the workspace
> root. Run `node <kai-plugin>/scripts/workspace-doctor.mjs` from the workspace
> root — it detects the old schema, prints the migration plan, and blocks
> coordinated work until the four roots move under `kai/`. `.kai/` stays where
> it is. Never leave both layouts in place: that is a split-brain workspace and
> the doctor refuses it.
<!-- /kai:allow-legacy-roots -->

When one agent needs something from another, the **`peer-communication`**
contract reconciles the three ways that question can travel — a cheap
**inline consult** (simulate the peer's lane), a **live peer** agent (the
Copilot CLI's background `task`/`write_agent` messaging, for real
independent judgment), or a **durable thread** `QUESTION`/`ANSWER` — into
one rule: transport is a performance choice, the thread is the record.
Anything that blocks an item, crosses a session, or changes a
decision lands on the thread, whichever transport carried it live.

The state does not run itself. The **`initiative-stewardship`** contract
names a **steward** — the initiative's `owner`, `principal-product-manager`
by default — who approves scope and priority. `director-chief-of-staff`
dispatches that approved queue, reconciles handoffs, and escalates decisions;
it does not replace the steward or principals.

For an external product without an accessible repository, intake asks for a
durable absolute workspace directory before dispatch. Every peer receives that
same path. Completed initiatives remain discoverable through `INDEX.md`,
`deliverables.md`, and `director-summary.md`; final reports print exact paths.

Canonical initiative paths are built in: `artifacts/product-map.md`,
`artifacts/design-system.md`, customer-success/support signals, growth and
analytics briefs, security/reliability assessments, sanitized incident records,
PM briefs, research, designs, and decisions under their named artifact folders.
Sanitized unaffiliated incident records use
`kai/library/investigations/<incident-id>/incident-record.md`.

## Seeing what needs you

Coordination records pile up as work scales, and reading every item to find the
two that need a decision does not scale with them. `work-status` answers one
question — **where must I intervene?**

```bash
node scripts/work-status.mjs --root .        # human-readable
node scripts/work-status.mjs --root . --json # machine-readable
```

It reads the authoritative item records under `kai/coordination/items/` — never
`BOARD.md`, which is itself derived and can drift — and prints only exceptions,
in severity order:

| Section | What lands here |
| ------- | --------------- |
| **NEEDS YOU** | An open question addressed to `@operator`, and any state only a human can advance (`release-ready`, `deploying`, `production-verification`) — kai never deploys. |
| **INTEGRITY** | Records that contradict each other: a review that approved a different `change_ref` than the item now carries, a dependency on an item that does not exist, an unreadable record, a terminal state with required reviews unmet. |
| **BLOCKED** | Declared blocked, or waiting on a typed dependency that has not reached its required state. |
| **UNKNOWN** | An expired lease, active work with no `next_role` and no holder, `waiting_on_questions` naming a question with no packet in the thread, or a run that missed the deadline it set for itself (see below). |

Healthy work is counted, not listed. Exit code is `0` normally, `1` when an
integrity finding exists, and `2` when no coordination records could be found.
**Ordinary blocked work exits `0`** — being blocked is a normal state of a
healthy board, not a failure.

### What it does not tell you

Every finding is labelled `declared` (the record asserts it) or `derived` (the
tool checked it — either two records contradict each other, or the condition is
one the tool can evaluate itself, like an expired lease). That distinction is
load-bearing:

> This reports what agents have **declared**, not verified live activity.

Coordination records are maintained by agents following prose, so a record that
has not changed is indistinguishable from an agent that is still working, one
that crashed, and one that forgot. Where the tool cannot tell, it reports
`UNKNOWN` rather than showing green — a confident green board that is green
because nobody updated it is worse than no board at all.

It also cannot see *runtime* activity. kai's agents are prompt documents, not
host subagents, so nothing in the host's own telemetry identifies which kai role
is running.

## Seeing what is happening right now

The item record answers *what is the state of this work*. It changes a handful
of times across days, so between two updates the report above can only say
`UNKNOWN`. The **activity log** narrows that gap, and gives agents a live view
of their peers.

```bash
node scripts/activity.mjs show --root .    # who is live right now
```

Agents append to a gitignored `.kai/activity.jsonl` when they start and stop:

```bash
RUN=$(node scripts/activity.mjs new-run)
node scripts/activity.mjs start --root . --role principal-swe-backend \
  --item export-audit --run "$RUN" --for 45m
node scripts/activity.mjs stop  --root . --role principal-swe-backend \
  --run "$RUN" --outcome handoff
```

`--for` is the point of the whole design: it is the window after which the
agent's silence becomes a *checkable* fact rather than an ambiguous one.

### Why it is a separate file

|  | Item record | Activity log |
| --- | --- | --- |
| Path | `kai/coordination/items/<id>.md` | `.kai/activity.jsonl` |
| Shape | compare-and-swap, versioned | append-only, one line per record |
| Carries | state, ownership, reviews, verdicts | who, which item, when they report next |
| Committed | yes, authoritative | no, ephemeral, gitignored |

Every write to an item increments `version` and is verified against a lease
token — that is what makes parallel ownership safe, and exactly why a heartbeat
cannot live there: it would inflate the field that detects racing, and
read-modify-write is the lost-update pattern append-only avoids.

That separation is **enforced, not requested**. A record naming `state`,
`verdict`, `change_ref`, `version`, `lease`, or `decision` is rejected at write
time. Two surfaces that cannot carry the same fact cannot drift into two truths.

Concurrency is safe because each record is a single sub-4KB `O_APPEND` write —
not because JavaScript is single-threaded, which grants nothing across separate
agent processes. The self-test runs six concurrent writers and asserts every
record survives.

### What this does not tell you either

The log is **declared**, exactly like the item records. An agent that crashes
never writes its `stop`; one that forgets never writes at all. So `work-status`
reports the narrow, true claim:

> the run declared it would report by `T`, and `T` has passed

— and never "the agent crashed", which needs an observer kai does not have. If
the log is absent, stale, or unreadable, the report silently loses the overlay
and behaves exactly as it does without it.

## Observing subagents (opt-in)

The declared log answers *what an agent said it was doing*. It cannot answer
*which agents actually took part in a feature* — the case where the gap is the
point: the designer who was never consulted, the researcher the principal
skipped. That sequence is invisible in a terminal scrollback.

The observer closes exactly that gap and nothing else. It records two host
events per subagent — `start` and `stop` — into a gitignored
`.kai/observed.jsonl`:

```bash
npm run observe:status    # is it on, and how many records exist
npm run observe:enable    # opt in for this workspace
node scripts/observe-subagent.mjs --disable   # revoke by deleting the marker
```

Enabling grants consent. The hook itself is already wired — kai ships a
`hooks.json`, so installing the plugin registers the observer with the host.
Hook sources are **merged**, never overwritten, so this adds nothing to any file
you own, and it stays inert until you enable it.

```jsonc
// hooks.json, shipped in the plugin
{
  "version": 1,
  "hooks": {
    "subagentStart": [
      { "type": "command", "timeoutSec": 10,
        "command": "node \"${PLUGIN_ROOT}/scripts/observe-subagent.mjs\" subagentStart" }
    ],
    "subagentStop": [ /* ... */ ]
  }
}
```

`${PLUGIN_ROOT}` expands to the plugin's install directory. That is verified
rather than assumed: the reference documents the variable only for LSP config,
so it was tested with a real plugin install and a real subagent before being
relied on here. A relative path would resolve against *your* repository instead,
which is why CI rejects one.

The observer costs nothing until you opt in. Without the consent marker the
script exits immediately and writes nothing — the declined path is deliberately
the cheapest one, because a user who never opted in still pays for the process
spawn.

Hook configuration is read when a session **starts**, so restart the session
after enabling.

### If you would rather not have it wired at all

Deleting `hooks.json` from the install directory removes the registration
entirely. Uninstalling the plugin removes it too. Nothing else in kai depends on
it.

### What it deliberately does not do

| | Why |
| --- | --- |
| No per-tool-call events | A hook costs ~66 ms to spawn; 500 tool calls is ~33 s of pure overhead for liveness nobody reads. |
| No main-agent events | The CLI session you are talking to is the conversation, not an employee to be watched. |
| No full response stored | Only a capped, single-line summary derived from the first prose line — and only if you ask for it separately. The full reply stays in the transcript. |
| No absolute paths, no raw session id | The workspace root is resolved and discarded; the session id is digested. Same privacy bounds as the activity log. |
| Never writes to stdout, never exits non-zero | `subagentStop` honours `decision` and `modifiedResponse` from a hook's stdout. An observer that spoke could block or rewrite a real agent's answer. It stays silent, always. |

Consent is a file (`.kai/observer-consent`) checked inside the hook, because the
host has no "installed but inactive" state. Without it the script writes nothing
and leaves no file behind.

### Summaries are a second opt-in

By default the observer records **participation only** — who started, who
finished. That already answers the question it exists to answer.

```bash
node scripts/observe-subagent.mjs --enable --with-summary
```

adds a capped one-line summary, scraped from the first prose line of each reply.
Be deliberate about it. The declared activity log's `note` is written by an agent
that *knows* it is being logged and can self-redact; this summary is scraped from
prose a subagent wrote for its parent. Path shapes are refused and the line is
capped, but it is **not secret-scrubbed** — a token or an address sitting in that
first line would be stored verbatim. The self-test asserts that fact rather than
papering over it.

A purpose-built *declared* TLDR — where the subagent writes its own supervisor
summary, knowing it is recorded — is the real answer, and is tracked as an open
question on #93.

`general-purpose` subagents emit neither event, so they are structurally
invisible here — a real limit, not a bug to file.

---

**Next:** [How kai works](how-kai-works.md) ·
**Related:** [Getting started](getting-started.md) ·
[Agents & skills](reference/agents-and-skills.md)

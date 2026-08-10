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
| **UNKNOWN** | An expired lease, active work with no `next_role` and no holder, or `waiting_on_questions` naming a question with no packet in the thread. |

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

---

**Next:** [How kai works](how-kai-works.md) ·
**Related:** [Getting started](getting-started.md) ·
[Agents & skills](reference/agents-and-skills.md)

---
name: personal-agenda
description: "Assembles the operator's forward 'what needs you' agenda. Owns the personal/inbox.md (tasks you own) and personal/agenda.md (derived view) schemas, the coordination-signal taxonomy, cadence nudges, ranking, and the never-autonomous output contract. The forward complement to pulse-digest (retrospective). Invoked by director-executive-assistant; not invoked directly."
tools: [bash, view, edit, create, grep, glob]
---

# Personal Agenda

This skill is the **plumbing** for one question the operator asks constantly:
*"what needs me right now?"* It reads existing state — the team's coordination
records, your own task list, and the freshness of your personal cadences — and
renders one ranked, forward-looking agenda. It decides nothing and does
nothing; the calling agent (`director-executive-assistant`) does the talking
and, only with your confirmation, the acting.

Sister skill to `pulse-digest`: that one is **retrospective** ("what happened
this week"); this one is **forward** ("what needs you next"). They never
overlap — the agenda surfaces open loops, not a week's narrative.

## The two files

Personal operational state lives in the ignored `personal/` lane of your pal
home base (see `workspace-conventions`). Two files, mirroring how
`coordination/` separates authoritative items from the derived board:

| File | Role | Analogue |
|------|------|----------|
| `personal/inbox.md` | **authoritative** — the tasks and reminders *you* own, not tied to any coordination item | `coordination/items/` |
| `personal/agenda.md` | **derived** — the ranked "what needs you" view, re-rendered each run from inbox + coordination signals + nudges | `coordination/BOARD.md` |

Both are gitignored (the `personal/` lane is ignored wholesale). You never
commit them, and you never write agenda/inbox state anywhere else.

## Anchoring

The agenda belongs to the **pal home base** — the personal workspace you run
sessions from (`kc-pal`, `ms-pal`), where `personal/` and `.persona-self/`
live. Resolve it through `workspace-conventions` (`.kai/manifest.json`
sentinel). `personal/inbox.md`, the nudges, and the rendered `personal/agenda.md`
always resolve against that home base.

Coordination **signals** may come from more than one place: the home base's own
`coordination/`, plus any product workspace the operator names. Default to the
currently resolved workspace's `coordination/`; when the operator points at
additional product roots, read each one's `coordination/` read-only and label
every surfaced line with its workspace. Never write into a product workspace
from here.

## Sources

Three, and only three:

### A. Derived team signals (read-only, from `coordination/`)

Surface only what genuinely needs **the operator** — the human who owns vision,
scope approval, business decisions, and the deploy button. Map each coordination
fact to exactly one agenda section:

| Signal (from `coordination/`) | Detection | Section |
|---|---|---|
| Decision awaiting you | a `proposed` item awaiting steward/operator approval, or a `blocked` item whose open `waiting_on_questions` QUESTION is addressed to the operator/steward-as-human | ⛔ Decisions |
| Question addressed to you | a `coordination/threads/<item>.md` `QUESTION` addressed to the operator with no matching `ANSWER` | ✉️ Awaiting reply |
| Ready for you to ship | an item in `release-ready` (the human deploy gate — only the operator presses go) | 🚀 Ready to ship |
| Blocked on you | a `blocked` item whose `waiting_on` names the operator and isn't a peer-answerable question | ⛔ or ✉️ as fits |
| Drift you own | an expired `lease` on an item the operator owns, or contradictory authoritative state worth a glance | 🔔 Nudges |

Read items and threads as authoritative; never infer a decision the records
don't show. If `coordination/` is absent (no team workspace), skip section A and
say so — never fabricate team signals.

### B. Personal inbox (`personal/inbox.md`)

The tasks and reminders you own directly. This is the one input you type into;
everything else is derived. Schema below.

### C. Cadence nudges

Freshness checks against the home base, each a gentle "you're due":

- **Weekly pulse** — newest `.kai/runs/pulse/<YYYY-Www>/` older than 7 days →
  nudge `workflow-weekly-pulse`.
- **Career check-in** — the cadence stated in `.persona-self/career-goals.md`
  (or last career run) overdue → nudge `principal-engineer-career-mentor`.
- **Voice profile** — `.persona-self/voice.md` missing or stale → nudge
  `extract-writing-style`.

Nudges are awareness, never auto-runs. Skip any whose source doesn't exist.

## `personal/inbox.md` schema

Human-first markdown; the machine part is the checklist. Keep it terse.

```markdown
# Inbox — personal tasks & reminders (local · gitignored)

## Open
- [ ] (t-2026-0142) Reply to the design-review invite · due:2026-06-18 · tag:follow-up · link:—
- [ ] (t-2026-0143) Book the NSCA recert exam · due:2026-07-01 · tag:career · link:—

## Done
- [x] (t-2026-0140) Send the offsite agenda · done:2026-06-10
```

- `id` is a stable `t-<YYYY>-<NNNN>`; never reuse.
- `due` / `link` are optional (`—` when absent).
- `tag` is a free label (`work` · `personal` · `follow-up` · `career` · …).
- Completing a task moves the line to `## Done` with a `done:` date; never
  delete history.

## `personal/agenda.md` schema

The derived view. Sections are ordered by *who is waiting on you* — others
first, then your own commitments, then cadence. Each line = source + exact path
+ the **one** next action.

```markdown
# Agenda — what needs you
**Generated:** <YYYY-MM-DD HH:MM local> · `director-executive-assistant`
**Signals from:** <workspace label(s)>  ·  **Open tasks:** <N>

## ⛔ Decisions blocking others
- <item-id> (<workspace>) — <one-line decision> → **<next action>** · `coordination/items/<id>.md`

## ✉️ Awaiting your reply
- <item-id> — <question in one line> → **draft a reply** (persona-self) · `coordination/threads/<id>.md`

## 🚀 Ready for you to ship
- <item-id> — <what's release-ready> → **deploy, then workflow-ship CONFIRM-START** · `coordination/items/<id>.md`

## ✅ Your tasks
- [ ] (t-2026-0142) <title> · due:<date> · `personal/inbox.md`

## 🔔 Nudges
- Weekly pulse due (last run <YYYY-Www>) → `workflow-weekly-pulse`
- Career check-in overdue → `principal-engineer-career-mentor`

## Cleared since last render   (optional)
- <what dropped off and why — shipped, answered, done>
```

Omit an empty section rather than printing a hollow heading. When nothing
needs the operator, say exactly that — an empty agenda is a valid, good result.

## Ranking

1. **Blocks others first.** A decision or reply that unblocks a teammate or a
   dependent item outranks anything private.
2. **Time-sensitive next.** Nearer due dates and older unanswered questions rise.
3. **Your tasks** by `due`, undated last.
4. **Nudges** last — context, not obligations.

Rank by *who's blocked and by when*, never by raw recency.

## Never autonomous

The agenda is a **view**, not a trigger. This skill and its caller:

- **never** answer a thread, approve scope, send a message, commit, or deploy on
  the operator's behalf — every item lists the action for the operator (or a
  specialist) to take, and stops there;
- write only two paths: `personal/agenda.md` (rendered) and `personal/inbox.md`
  (explicit task capture) — both in the ignored personal lane;
- never promote personal state to `library/` or commit it;
- read `coordination/`, `.kai/runs/pulse/`, and `.persona-self/` strictly
  read-only.

## Output contract

When a render finishes:

1. `personal/agenda.md` exists at the home base with a generated timestamp and
   the ranked sections above.
2. Every line names its source, an exact workspace-root-relative path, and one
   next action.
3. Nothing was sent, committed, deployed, or answered; no coordination record
   changed.
4. `personal/inbox.md` is unchanged except for an explicit operator task capture.
5. The caller receives: the agenda path, per-section counts, the single top
   item, and whether any source (coordination / pulse / persona-self) was
   absent and skipped.

## Anti-patterns

- ❌ Acting on an agenda line — answering, approving, deploying, sending —
  without explicit operator confirmation.
- ❌ Writing agenda or inbox anywhere but `personal/`, or committing them.
- ❌ Inventing a decision or question the `coordination/` records don't show.
- ❌ Re-narrating the week — that's `pulse-digest`; the agenda is open loops only.
- ❌ Ordering by recency instead of who's-blocked-and-by-when.
- ❌ Printing empty sections, or claiming team signals when no `coordination/`
  workspace is resolved.

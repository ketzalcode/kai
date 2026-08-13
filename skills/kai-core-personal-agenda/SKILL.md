---
name: kai-core-personal-agenda
description: "Operator agenda assembly. Use when producing the current workspace's what-needs-you view from inbox tasks, @operator questions, release gates, and nudges."
tools: [bash, shell, view, edit, create, grep, glob]
---

# Personal Agenda

This skill is the **plumbing** for one question the operator asks constantly:
*"what needs me right now?"* It reads existing state — the team's coordination
records, your own task list, and the freshness of your personal cadences — and
renders one ranked, forward-looking agenda. It decides nothing and does
nothing; the calling agent (`director-executive-assistant`) does the talking
and, only with your confirmation, the acting.

Sister skill to `kai-core-pulse-digest`: that one is **retrospective** ("what happened
this week"); this one is **forward** ("what needs you next"). They never
overlap — the agenda surfaces open loops, not a week's narrative.

A ⛔ decision line only *names* the pending choice. When the operator wants to
actually decide it, the calling assistant packages the full decision — options,
per-role positions, and a sourced recommendation — through `kai-core-decision-brief`.

## The two files

Personal operational state lives in the ignored `kai/personal/` lane of the current
Kai workspace (see `kai-core-workspace-conventions`). Two files, mirroring how
`kai/coordination/` separates authoritative items from the derived board:

| File | Role | Analogue |
|------|------|----------|
| `kai/personal/inbox.md` | **authoritative** — the tasks and reminders *you* own, not tied to any coordination item | `kai/coordination/items/` |
| `kai/personal/agenda.md` | **derived** — the ranked "what needs you" view, re-rendered each run from inbox + coordination signals + nudges | `kai/coordination/BOARD.md` |

Both are gitignored (the `kai/personal/` lane is ignored wholesale). You never
commit them, and you never write agenda/inbox state anywhere else.

## Anchoring

The agenda belongs to the **current Kai workspace** resolved through
`kai-core-workspace-conventions` and its `.kai/manifest.json` sentinel.
`kai/personal/inbox.md`, identity/cadence sources, and the rendered
`kai/personal/agenda.md` always resolve against that workspace.

Coordination **signals** come from the current workspace's `kai/coordination/` plus every
enabled root in `kai/personal/workspaces.md`. Resolve and validate the registry per
`kai-core-workspace-conventions`; label every surfaced line with its workspace. When the
operator names an additional Kai root, the calling assistant confirms its
label and records it in the registry before scanning it. Never write into a
linked workspace from here.

## Sources

Three categories, with optional linked-workspace discovery:

### A. Derived team signals (read-only, from `kai/coordination/`)

Surface only what genuinely needs **the operator** — the human who owns vision,
final business boundaries, requested replies/actions, and the deploy button.
Routine scope promotion and priority remain steward-owned. Map each coordination
fact to exactly one agenda section:

| Signal (from `kai/coordination/`) | Detection | Section |
|---|---|---|
| Decision awaiting you | a thread `QUESTION` addressed to `@operator` with `kind: decision` and no matching answered `ANSWER`; if blocking, its ID must also appear in the item's `waiting_on_questions` | ⛔ Decisions |
| Question addressed to you | an open thread `QUESTION` addressed to `@operator` with `kind: reply` and no matching `ANSWER` | ✉️ Awaiting reply |
| Action only you can perform | a thread `QUESTION` addressed to `@operator` with `kind: action` and no matching answered `ANSWER`; if blocking, its ID appears in `waiting_on_questions` | ⚡ Actions |
| Ready for you to ship | an item in `release-ready` (the human deploy gate — only the operator presses go) | 🚀 Ready to ship |
| Blocked on you | a `blocked` item whose `waiting_on_questions` contains an open `@operator` question; classify it by that question's `kind` | ⛔, ✉️, or ⚡ |
| Overdue operator request | an unanswered `@operator` question whose `answer_by` timestamp passed | raise within its existing section |

Read items and threads as authoritative; never infer a decision the records
don't show. If `kai/coordination/` is absent (no team workspace), skip section A and
say so — never fabricate team signals.

Because threads are append-only, "open" always means **no matching answered
ANSWER packet exists for that question ID**. Do not trust the original
QUESTION's `status: open` after an ANSWER has been appended.

A `proposed` item by itself is **not** an operator signal. The initiative
steward owns promotion and priority. Surface a proposed item only when its
thread contains an explicit open `@operator` question under the rules above.

### B. Personal inbox (`kai/personal/inbox.md`)

The tasks and reminders you own directly. This is the one input you type into;
everything else is derived. Schema below.

### C. Cadence nudges

Freshness checks against the current workspace, each a gentle "you're due":

- **Weekly pulse** — newest `.kai/runs/pulse/<YYYY-Www>/` older than 7 days →
  nudge `workflow-weekly-pulse`.
- **Career check-in** — the cadence stated in `kai/personal/identity/career-goals.md`
  (or last career run) overdue → nudge `principal-engineer-career-mentor`.
- **Voice profile** — `kai/personal/identity/voice.md` missing or stale → nudge
  `extract-writing-style`.

Nudges are awareness, never auto-runs. Skip any whose source doesn't exist.

## `kai/personal/inbox.md` schema

Human-first markdown; a task's **state is the section it sits in**. Keep it terse.

```markdown
# Inbox — personal tasks & reminders (local · gitignored)

## Open
- [ ] (t-2026-0142) Reply to the design-review invite · due:2026-06-18 · prio:20 · tag:follow-up · src:manual · link:—
- [ ] (t-2026-0151) Book the NSCA recert exam · due:2027-07-01 · tag:career · recur:yearly · src:manual · link:—

## Waiting
- [ ] (t-2026-0144) Legal to approve the contract redline · waiting_on:legal · since:2026-06-10 · remind_at:2026-06-20 · link:—

## Snoozed
- [ ] (t-2026-0145) Revisit the Q4 planning doc · snooze_until:2026-07-15 · tag:work · link:—

## Proposed   (personal proposals — acknowledge to commit)
- [ ] (t-2026-0146) Prep for "Roadmap sync" · src:calendar · remind_at:2026-06-18-0900 · ack:no · link:cal:evt-8831

## Done
- [x] (t-2026-0140) Send the offsite agenda · done:2026-06-10
- [x] (t-2026-0143) Book the NSCA recert exam · due:2026-07-01 · tag:career · recur:yearly · done:2026-06-30 · next:t-2026-0151
- [x] (t-2026-0147) "Vendor demo" invite · src:calendar · resolution:dismissed · closed:2026-06-12
```

Fields (all except `id` optional; `—` when absent):

- `id` — stable `t-<YYYY>-<NNNN>`; never reused.
- `due` — target date. `remind_at` — when to resurface (date or `YYYY-MM-DD-HHMM`).
- `snooze_until` — hidden until this date (required for Snoozed).
- `prio` — integer, lower runs first (unranked by default).
- `tag` — free label (`work` · `personal` · `career` · `private` · …).
- `recur` — `daily` · `weekdays` · `weekly` · `monthly` · `yearly` · `every:<n>d|w|m`.
- `src` — `manual` (default) · `calendar` · `message` · other adapter.
- `waiting_on` — the owner a Waiting task is blocked on (required for Waiting);
  `since` — when it started.
- `ack` — `no|yes`, required for a Proposed item.
- `link` — a stable ref: `<workspace>:<item-id>` for a coordination mirror, a URL,
  or an adapter's external key. It is the task's canonical dedup identity.
- `next` — on a Done recurring line, the id of the rolled-forward occurrence.
- `resolution` — on a Done line, `completed` (default) or `dismissed`; `closed` —
  the dismissal date.

## Task lifecycle

Five states, section-denoted, each with a required field:

- **proposed** — a suggestion (needs `src:` + `ack:no`) from an operator-forwarded
  or explicitly-configured calendar/message adapter. **Not a commitment**: the
  operator acknowledges it (→ open) or dismisses it. Never an obligation, and
  distinct from a coordination `state: proposed` work item (steward-owned).
- **open** — an active commitment you own; surfaces normally.
- **waiting** — the underlying deliverable is someone else's (`waiting_on:<owner>`
  required); only the **chase** is yours, due at `remind_at`.
- **snoozed** — deferred until `snooze_until` (required); fully excluded from the
  agenda until then.
- **done** — closed in `## Done` with `done:` (completed) or `resolution:dismissed`
  + `closed:` (dismissed proposal). History is append-only.

The skill changes state only in two deterministic, operator-visible ways: an
explicit operator instruction, and the snooze maturation below. There is **no
background wake-up** — a snooze matures only when the operator next renders the
agenda.

### Snooze maturation

On the first render where `now >= snooze_until`, move the task from Snoozed to
Open (an explicitly permitted housekeeping write) and surface it. Until then it
is invisible everywhere, including "Cleared since last render".

## Recurrence

A `recur:` task must carry a `due` or `remind_at`. It rolls forward **only on
completion**:

1. Move the current occurrence to `## Done`, preserving its original fields, and
   stamp `next:<new-id>`.
2. Append **exactly one** fresh `open` occurrence with a new id and the next
   `due`/`remind_at` computed from the rule.

Guards: if the done line already carries a `next:`, the roll-forward already
happened — do not create another (idempotent). If the schedule is overdue,
advance to the **first future** slot rather than materializing every missed
occurrence. Never open a second live occurrence before the current one is done.

## Deduplication and history

- **`link` is identity.** A task's `link` (coordination ref / URL / adapter key)
  is its canonical dedup key. Never add a task whose `link` already matches a live
  (proposed/open/waiting/snoozed) line; a matching adapter import updates that
  line instead. A matching title alone is a **duplicate warning**, not proof.
- **Suppress a coordination mirror only when it's actually surfaced.** A personal
  task that `link`s a coordination item is hidden **only if that exact item or
  question is emitted by Source A in this render** (so it isn't shown twice). If
  Source A does *not* surface it (e.g. an in-progress item with no open
  `@operator` question), the personal reminder shows normally — it never silently
  disappears. Prefer tracking team work in `kai/coordination/`; a personal mirror is
  for a reminder the team records don't already carry.
- **Append-only history.** Completing or dismissing moves a line to `## Done`;
  recurrence rolls forward via `next:`; nothing is deleted.

## Sharing personal fields (least privilege)

Personal fields are private by default. When the assistant delegates a task or
shares context with a subagent, the disclosed set is **approved ∩ necessary** —
never the whole inbox, and never more than the role needs to act:

- Default to a **sanitized intent** (what the role must do), not the raw title —
  a title or date can itself be sensitive.
- Withheld unless necessary *and* approved: `tag`, `src`, `waiting_on`, `link`,
  and every unrelated task.
- A `tag:private` task adds a per-disclosure confirmation gate on top of the
  above; it is an extra guard, not the only sensitivity control.
- Record the exact shared fields in the delegation packet so the disclosure is
  auditable.

This mirrors `kai-core-executive-consultation`'s minimize-personal-context rule: opt-in
per field, minimum necessary.

## `kai/personal/agenda.md` schema

The derived view. Sections are ordered by *who is waiting on you* — others
first, then your own commitments, then cadence. Each line = source + exact path
+ the **one** next action.

```markdown
# Agenda — what needs you
**Generated:** <YYYY-MM-DD HH:MM local> · `director-executive-assistant`
**Signals from:** <workspace label(s)>  ·  **Open:** <N> · **Waiting:** <N> · **Proposed:** <N>

## ⛔ Decisions blocking others
- <item-id> (<workspace>) — <one-line decision> [Q-<item-id>-NN] → **assemble a decision brief** (`kai-core-decision-brief`) · `kai/coordination/threads/<id>.md`

## ✉️ Awaiting your reply
- <item-id> — <question in one line> → **draft a reply** (persona-self) · `kai/coordination/threads/<id>.md`

## ⚡ Actions blocking others
- <item-id> — <operator-only action> → **perform the action, then answer Q-…** · `kai/coordination/threads/<id>.md`

## 🚀 Ready for you to ship
- <item-id> — <what's release-ready> → **deploy, then workflow-ship CONFIRM-START** · `kai/coordination/items/<id>.md`

## ✅ Your tasks
- [ ] (t-2026-0142) <title> · due:<date> → **<next action>** · `kai/personal/inbox.md`

## 📥 Proposed — acknowledge to commit
- (t-2026-0146) <title> · src:<calendar|message> · <remind_at> → **accept or dismiss** · `kai/personal/inbox.md`

## ⏳ Waiting — follow-up due
- (t-2026-0144) <title> · waiting_on:<owner> · chase:<remind_at> → **nudge <owner>** (their deliverable; your follow-up) · `kai/personal/inbox.md`

## 🔔 Nudges
- Weekly pulse due (last run <YYYY-Www>) → `workflow-weekly-pulse`
- Career check-in overdue → `principal-engineer-career-mentor`

## Cleared since last render   (optional)
- <what dropped off and why — shipped, answered, done, dismissed>
```

Only Source A populates ⛔/✉️/⚡/🚀 (coordination). **Snoozed** tasks never
appear until `snooze_until` matures them into ✅ Your tasks. A **waiting** task's
underlying deliverable is *theirs* — only the due chase is your follow-up, and it
rises only at its `remind_at`. A **proposed** task is a suggestion, never a
commitment, cleared by an explicit accept or dismiss.

Omit an empty section rather than printing a hollow heading. When nothing
needs the operator, say exactly that — an empty agenda is a valid, good result.

## Ranking

1. **Blocks others first.** A decision or reply that unblocks a teammate or a
   dependent item outranks anything private; operator-only actions follow the
   same rule.
2. **Time-sensitive next.** Nearer due dates and older unanswered questions rise.
3. **Your tasks** by `prio` then `due`, undated last. Exclude `snoozed` tasks
   until their `snooze_until`.
4. **Proposed** items need a quick accept/dismiss — surfaced, but never counted
   as commitments.
5. **Waiting on others** is awareness — below your own actions — and rises only
   at its `remind_at` chase date.
6. **Nudges** last — context, not obligations.

Rank by *who's blocked and by when*, never by raw recency.

## Never autonomous

The agenda is a **view**, not a trigger. This skill and its caller:

- **never** answer a thread, approve scope, send a message, commit, or deploy on
  the operator's behalf — every item lists the action for the operator (or a
  specialist) to take, and stops there;
- write only two paths: `kai/personal/agenda.md` (rendered) and `kai/personal/inbox.md`
  (operator-driven capture, acknowledgement, state change, recurrence
  roll-forward, and snooze maturation) — both in the ignored personal lane;
- never promote personal state to `kai/library/` or commit it;
- read `kai/coordination/`, `.kai/runs/pulse/`, and `kai/personal/identity/` strictly
  read-only.

## Output contract

When a render finishes:

1. `kai/personal/agenda.md` exists in the current workspace with a generated timestamp and
   the ranked sections above.
2. Every line names its source, an exact workspace-root-relative path, and one
   next action.
3. `snoozed` tasks are absent; `waiting` tasks are shown as others' move, not
   operator actions; `proposed` tasks are shown as suggestions, not commitments.
4. No personal task duplicates a coordination signal, and no coordination record
   changed. Nothing was sent, committed, deployed, or answered.
5. `kai/personal/inbox.md` is unchanged except for an explicit operator task capture,
   acknowledgement, state change, or recurrence roll-forward.
6. The caller receives: the agenda path, per-section counts (open / waiting /
   proposed), the single top item, and whether any source was absent and skipped.

## Anti-patterns

- ❌ Acting on an agenda line — answering, approving, deploying, sending —
  without explicit operator confirmation.
- ❌ Writing agenda or inbox anywhere but `kai/personal/`, or committing them.
- ❌ Inventing a decision or question the `kai/coordination/` records don't show.
- ❌ Re-narrating the week — that's `kai-core-pulse-digest`; the agenda is open loops only.
- ❌ Ordering by recency instead of who's-blocked-and-by-when.
- ❌ Surfacing a `snoozed` task before its `snooze_until`, or a `proposed` task
  as if it were a commitment.
- ❌ Echoing a coordination item as a personal task, or opening a second live
  occurrence of a recurring task.
- ❌ Sharing more personal fields with a subagent than the task requires, or
  sharing a `tag:private` task without explicit go-ahead.
- ❌ Printing empty sections, or claiming team signals when no `kai/coordination/`
  workspace is resolved.

---
name: personal-agenda
description: "Personal task and agenda method. Use when capturing, updating, or prioritizing the user's own tasks, or rendering their what-needs-you view from the inbox and, on request, team signals."
tools: [execute, read, edit, search]
---

# Personal Agenda

This skill is the **plumbing** for one question the user asks constantly:
*"what needs me right now?"* It owns their personal task list and renders one
ranked, forward-looking agenda from it. It decides nothing and does nothing;
the calling agent does the talking and, only with the user's confirmation, the
acting.

Sister skill to `kai-core-pulse-digest`: that one is **retrospective** ("what happened
this week"); this one is **forward** ("what needs you next"). They never
overlap — the agenda surfaces open loops, not a week's narrative.

A ⛔ decision line only *names* the pending choice. When the user wants to
actually decide it, the calling agent packages the decision — options,
recorded positions, and a sourced recommendation — through `decision-brief`.

## The two files

Personal operational state lives in the ignored `.kai/personal/` lane of the current
Kai workspace (see `kai-core-workspace-initiative`). Two files, mirroring how
`.kai/state/` separates authoritative items from the derived board:

| File | Role | Analogue |
|------|------|----------|
| `.kai/personal/inbox.md` | **authoritative** — the tasks and reminders *you* own, not tied to any coordination item | `.kai/state/items/` |
| `.kai/personal/agenda.md` | **derived** — the ranked "what needs you" view, re-rendered each run from the inbox plus any requested signals and nudges | `.kai/state/BOARD.md` |

Both are gitignored (the `.kai/personal/` lane is ignored wholesale). You never
commit them, and you never write agenda/inbox state anywhere else.

## Anchoring

The agenda belongs to the **selected Kai workspace** whose `.kai/manifest.json`
sentinel the calling agent already resolved (`kai-core-workspace-paths`).
`.kai/personal/inbox.md` and the rendered `.kai/personal/agenda.md` always
resolve against that workspace. If no workspace is selected, the personal lane
has no home: report the missing persistence prerequisite and answer without
writing. Never initialize one from here.

Coordination **signals** are optional and off by default (see Source A). When
the user asks for them, they come from the selected workspace's `.kai/state/`,
plus an additional enabled root in `.kai/personal/workspaces.md` only when they
asked for that root too. Resolve and validate the registry per
`kai-core-workspace-initiative`; label every surfaced line with its workspace.
When the user names a new Kai root, the calling agent confirms its label and
records it in the registry before reading it. Never write into a linked
workspace from here.

## Sources

One default source, plus two the user turns on for a given render:

### A. Team signals (requested, read-only, from `.kai/state/`)

Included only when the user asked for a team-aware agenda. A plain "what's on
my list" renders the personal inbox alone — no `.kai/state/` traversal, no
linked-root sweep.

Surface only what genuinely needs **the operator** — the human who owns vision,
final business boundaries, requested replies/actions, and the deploy button.
Routine scope promotion and priority remain steward-owned.

When interpreting team signals for this section, load `kai-core-proactive-scan`
and apply only its **Operator signals** section — this skill consumes that
section and does not reinterpret or duplicate its rules (the open-question,
`kind`, release-ready-gate, overdue, blocking-association, and missing-input
distinctions all live there). Loading it here does not execute the scan or
ack phases, and does not emit a notification payload or advance the delivery
ledger — those stay `kai-core-proactive-scan`'s own read-only interpretation,
used only for this on-demand rendering. Map each signal it identifies to
exactly one agenda section:

| Signal (`kai-core-proactive-scan` → Operator signals) | Section |
|---|---|
| Decision awaiting the operator | ⛔ Decisions |
| Question addressed to the operator | ✉️ Awaiting reply |
| Action only the operator can perform | ⚡ Actions |
| Ready for the operator to ship | 🚀 Ready to ship |
| Blocked on the operator | ⛔, ✉️, or ⚡ (classify by the blocking question's `kind`) |
| Overdue operator request | raise within its existing section |

If `.kai/state/` is absent (no team workspace), skip section A and say so —
never fabricate team signals. A root that failed to read is a gap, not a clear.

### B. Personal inbox (`.kai/personal/inbox.md`)

The tasks and reminders you own directly, and the default source of every
render. This is the one input you type into; everything else is derived.
Schema below.

### C. Cadence nudges (requested)

Freshness checks against the selected workspace, each a gentle "you're due".
Included when the user asked for nudges or for the full agenda; never as a
side effect of a task capture or a single-list render:

- **Weekly pulse** — newest `.kai/runs/pulse/<YYYY-Www>/` older than 7 days →
  nudge `workflow-weekly-pulse`.
- **Career check-in** — the cadence stated in `.kai/personal/identity/career-goals.md`
  (or last career run) overdue → nudge `principal-engineer-career-mentor`.
- **Voice profile** — `.kai/personal/identity/voice.md` missing or stale → nudge
  `extract-writing-style`.

Nudges are awareness, never auto-runs. Skip any whose source doesn't exist, and
skip any naming a capability this installation does not ship.

## `.kai/personal/inbox.md` schema

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

## Capture

One request, one line, written back for confirmation:

1. Allocate the next unused `t-<YYYY>-<NNNN>` id. Ids are never reused.
2. Fill only the fields the request actually carries — `due`, `remind_at`,
   `prio`, `tag`, `link`, `recur`. Everything unstated is `—`, not guessed.
3. **Resolve dates honestly.** A relative date ("Friday", "next month") resolves
   against today; state the absolute date you resolved it to. If the request is
   genuinely ambiguous about *what* or *when*, ask exactly one clarifying
   question — otherwise capture and confirm the line back.
4. Append it to `## Open` (or `## Proposed` with `ack:no` for a suggestion), and
   check `link` against the live lines first (see *Deduplication and history*).
5. Say what was stored and where. A stored `remind_at` is a date on a line; it
   schedules nothing and notifies no one.

Never echo a coordination item into the inbox — a team-aware render surfaces
those from `.kai/state/` directly.

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
  disappears. Prefer tracking team work in `.kai/state/`; a personal mirror is
  for a reminder the team records don't already carry.
- **Append-only history.** Completing or dismissing moves a line to `## Done`;
  recurrence rolls forward via `next:`; nothing is deleted.

## Sharing personal fields (least privilege)

Personal fields are private by default. Whenever a task's context leaves this
lane — named in a request to another role, quoted into a draft, or carried into
a briefing — the disclosed set is **approved ∩ necessary**: never the whole
inbox, and never more than the reader needs:

- Default to a **sanitized intent** (what must happen), not the raw title —
  a title or date can itself be sensitive.
- Withheld unless necessary *and* approved: `tag`, `src`, `waiting_on`, `link`,
  and every unrelated task.
- A `tag:private` task adds a per-disclosure confirmation gate on top of the
  above; it is an extra guard, not the only sensitivity control.
- Record the exact shared fields alongside the disclosure so it is auditable.

This rule is owned here. It does not depend on any other method restating it,
and it survives unchanged whatever the caller happens to be doing.

## `.kai/personal/agenda.md` schema

The derived view. Sections are ordered by *who is waiting on you* — others
first, then your own commitments, then cadence. Each line = source + exact path
+ the **one** next action.

```markdown
# Agenda — what needs you
**Generated:** <YYYY-MM-DD HH:MM local> · `personal-assistant`
**Signals from:** <workspace label(s), or "personal only">  ·  **Open:** <N> · **Waiting:** <N> · **Proposed:** <N>

## ⛔ Decisions blocking others
- <item-id> (<workspace>) — <one-line decision> [Q-<item-id>-NN] → **assemble a decision brief** (`decision-brief`) · `.kai/state/threads/<id>.md`

## ✉️ Awaiting your reply
- <item-id> — <question in one line> → **draft a reply** (`write-in-user-voice`) · `.kai/state/threads/<id>.md`

## ⚡ Actions blocking others
- <item-id> — <operator-only action> → **perform the action, then answer Q-…** · `.kai/state/threads/<id>.md`

## 🚀 Ready for you to ship
- <item-id> — <what's release-ready> → **deploy, then workflow-ship CONFIRM-START** · `.kai/state/items/<id>.md`

## ✅ Your tasks
- [ ] (t-2026-0142) <title> · due:<date> → **<next action>** · `.kai/personal/inbox.md`

## 📥 Proposed — acknowledge to commit
- (t-2026-0146) <title> · src:<calendar|message> · <remind_at> → **accept or dismiss** · `.kai/personal/inbox.md`

## ⏳ Waiting — follow-up due
- (t-2026-0144) <title> · waiting_on:<owner> · chase:<remind_at> → **nudge <owner>** (their deliverable; your follow-up) · `.kai/personal/inbox.md`

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
- write only two paths: `.kai/personal/agenda.md` (rendered) and `.kai/personal/inbox.md`
  (operator-driven capture, acknowledgement, state change, recurrence
  roll-forward, and snooze maturation) — both in the ignored personal lane;
- never promote personal state to `<publication-root>/` or commit it;
- read `.kai/state/`, `.kai/runs/pulse/`, and `.kai/personal/identity/` strictly
  read-only, and only when this render actually requested that source;
- never schedule anything. A `due:` or `remind_at:` is a stored date, not a
  notification; nothing here wakes up, watches, or delivers.

## Output contract

When a render finishes:

1. `.kai/personal/agenda.md` exists in the current workspace with a generated timestamp and
   the ranked sections above.
2. Every line names its source, an exact workspace-root-relative path, and one
   next action.
3. `snoozed` tasks are absent; `waiting` tasks are shown as others' move, not
   operator actions; `proposed` tasks are shown as suggestions, not commitments.
4. No personal task duplicates a coordination signal, and no coordination record
   changed. Nothing was sent, committed, deployed, or answered.
5. `.kai/personal/inbox.md` is unchanged except for an explicit operator task capture,
   acknowledgement, state change, or recurrence roll-forward.
6. The caller receives: the agenda path, per-section counts (open / waiting /
   proposed), the single top item, which optional sources were included, and
   whether any requested source was absent and skipped.

## Anti-patterns

- ❌ Acting on an agenda line — answering, approving, deploying, sending —
  without explicit operator confirmation.
- ❌ Writing agenda or inbox anywhere but `.kai/personal/`, or committing them.
- ❌ Inventing a decision or question the `.kai/state/` records don't show.
- ❌ Re-narrating the week — that's `kai-core-pulse-digest`; the agenda is open loops only.
- ❌ Ordering by recency instead of who's-blocked-and-by-when.
- ❌ Surfacing a `snoozed` task before its `snooze_until`, or a `proposed` task
  as if it were a commitment.
- ❌ Echoing a coordination item as a personal task, or opening a second live
  occurrence of a recurring task.
- ❌ Sharing more personal fields than the request requires, or sharing a
  `tag:private` task without explicit go-ahead.
- ❌ Printing empty sections, or claiming team signals when no `.kai/state/`
  workspace is resolved.
- ❌ Scanning `.kai/state/`, linked roots, identity, or pulse history when the
  request did not ask for that source.
- ❌ Implying that a captured `remind_at` will notify anyone.

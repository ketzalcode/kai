---
name: pulse-digest
description: "Standardises how a weekly catch-up digest is collected, structured, and written to disk. Owns the source-adapter contract, local `.kai/runs/pulse/sources.md` binding config, run layout, privacy, week resolution, signal prioritization, and page output shapes. Invoked by workflow-weekly-pulse; not invoked directly."
tools: [bash, view, edit, create, grep, glob, ask_user]
---

# Pulse Digest

This skill is the **plumbing** for any agent that turns a week of activity —
chat messages, the documents posted in them, and notable changes in watched
code — into one short, digestible catch-up document.

The judgment about *which* channels and repos are worth watching, and *how* to
read the week, belongs to the calling agent (`workflow-weekly-pulse`). This
skill owns only the **contract**: how sources are bound, how the week is pulled,
and the exact shape of what lands on disk.

Sister skill to `web-content-extraction`: that one harvests one readable page on
demand; this one aggregates many small signals across a time window into a brief.

## Staying source-agnostic

`kai` ships **no employer-specific services or MCP servers**. So this
skill defines sources **abstractly** and binds them through a local, gitignored
config. The committed contract never names a specific tenant, channel, repo, or
MCP server — those live only in the user's local `.kai/runs/pulse/sources.md`.

### The four adapters

Every source the digest pulls from is one of four adapter *kinds*. Each yields a
list of **normalized records** in this shape:

```
{
  kind:      messages | docs | code | work-items
  source:    human label (e.g. "Architecture channel", "payments-api")
  ref:       stable id/url for provenance (kept out of narration)
  author:    who (display name)
  timestamp: ISO-8601
  title:     one-line subject (synthesized if the source has none)
  body:      cleaned text / summary
  links:     [ {text, ref} ]   ← documents & threads referenced
  weight:    signal score 0–3 (see "Prioritization")
}
```

The calling agent binds each adapter to **whatever connector the host
environment exposes**. Reference bindings (examples only — not shipped, not
required):

| Adapter | What it yields | Example host bindings |
|---------|----------------|------------------------|
| `messages` | Chat/channel posts + replies in the window | A Microsoft Graph proxy (`/me/chats/{id}/messages`, `/teams/{id}/channels/{id}/messages` + `/replies`); an M365 Copilot `ask` for server-side synthesis; or a pasted/exported transcript file |
| `docs` | Documents worth reading, usually **linked from messages** | Drive/SharePoint item fetch via the same Graph proxy; a wiki search; or plain URLs resolved with `web_fetch` |
| `code` | Critical changes in **watched modules** | A code-history MCP (commits / PRs / file-history) for hosted repos; or local `git log` for the current repo |
| `work-items` | Status shifts on tracked items (optional) | A work-tracking MCP (e.g. ADO/GitHub issues) scoped to a project/area |

If a host has no binding for an adapter, the digest **skips that adapter and
says so** in `sources-pulled.md` — it never fabricates a section.

## Local config: `.kai/runs/pulse/sources.md`

The user's private wiring. **Gitignored.** The calling agent scaffolds it on
first run (one question at a time) and reads it every run after.

The file is a normal markdown doc whose machine-readable part is a **single
fenced `yaml` block** — prose around it is for the human; the agent parses the
YAML. (Don't put config in bare `#`-comment lines outside the fence; in markdown
those render as headings.) Schema:

````markdown
# Pulse sources — <scope> (local · gitignored · never committed)

<Optional prose: tenant, team IDs, anything the human wants to remember.>

```yaml
scope: ms                     # label namespace; every label is <scope>-<slug>
tenant: <tenant-guid>         # optional
last_updated: <YYYY-MM-DD>
default_window: 7d            # 7d | work-week | 14d | since-last-run
timezone: <IANA, e.g. America/Los_Angeles>

messages:
  # `team_id` is the DEFAULT host team. Any channel may override it with its
  # own `team_id:` to bind a channel in a different team (multi-team is fine).
  team_id: <team-guid>        # optional default parent (team_id == groupId)
  channels:
    - label: ms-arch
      channel_id: "19:...@thread.tacv2"   # resolved id → no run-time lookup
      name: Architecture
      priority: high          # high = always summarized; normal = only when hot
    - label: ms-other-team-chan
      team_id: <other-team-guid>          # override → channel lives in another team
      channel_id: "19:...@thread.skype"
      name: Orchestration
      priority: high
  chats:                      # optional — meeting / group chats (not team channels)
    - label: ms-review-mtg
      chat_id: "19:meeting_...@thread.v2" # pulled via /chats/{chat_id}/messages
      type: meeting | group
      name: AI Review
      priority: high          # chat messages have no subject — content is in body

docs:
  - label: ms-team-wiki
    binding: wiki:<project>/<wiki>
    priority: normal

code:
  - label: ms-payments-core
    binding: repo:<org>/<project>/<repo>
    paths: [src/core/, src/contracts/]
    watch_for: [public contract change, new service boundary, migration, breaking change]
    priority: high
  - label: local-repo
    binding: git:.            # current repo via local git log
    paths: [skills/, agents/]

# work_items:                 # optional — omit to skip
#   - label: ms-sprint
#     binding: workitems:<project>/<area>

people:                       # optional — +1 weight (cap 3) on author/@-mention
  - name: <Display Name>
    id: <directory-guid>      # optional — exact-match id (beats display-name matching)
    aka: [<alternate spelling>, <short form>]   # optional — name variants to match
    tier: peer | lead | principal   # principal → surfaced even from forums you're not in
    why: <one line>

topics:                       # optional — +1 weight (cap 3) wherever the term appears
  - keyword: <term>
    aliases: [<synonym>, <synonym>]

landscape:                    # optional — external watch via web_search, not a connector
  - label: <what to watch>
    query: <search string>
    sources: [<canonical url to prefer>]

career:                       # optional — enables Page 3
  enabled: true
  persona_self: true          # read .persona-self/ for voice + promo rubric
  target_level: senior
```
````

Keep it terse. The agent edits the YAML block in place; never overwrites silently.

## Folder layout

One run per week:

```
<workspace-root>/.kai/runs/pulse/<YYYY-Www>/        ← ISO week, e.g. 2026-W26
  pulse.md            ← the full digest: Brief + Board + (Career) + overflow
  brief.md            ← Page 1 ONLY, narration-clean — the generate-audio input
  sources-pulled.md   ← provenance: what was pulled, windows, counts, gaps
  raw/                ← raw pulls (messages, commit lists), gitignored
    messages.json
    code.json
```

- `<workspace-root>` is the resolved target root; explicitly ephemeral
  one-shot work may fall back to `<cwd>/.kai/runs/pulse/`.
- `<YYYY-Www>` is the **ISO-8601 week** of the window's end date.
- A second run in the same week appends a suffix: `2026-W26-run2`. Never
  overwrite a prior run.

## Gitignore — privacy first

A weekly pulse of internal chat is **sensitive**, like `.persona-self/`. It
stays in the **run root** — `.kai/runs/pulse/` — which
`workflow-workspace-init` gitignores **wholesale** (see
`workspace-conventions`). You do **not** patch `.gitignore` yourself; the
whole working root is ignored, so the digest is private by default.

Unlike other curated outputs, the pulse digest defaults to the **local**
zone, not knowledge — privacy wins. To share a specific week, the operator
explicitly passes `--share`, and only then does the calling agent promote
that week's `brief.md` to `library/digests/<YYYY-Www>/` with frontmatter.
The skill never promotes or commits on its own.

## Window resolution

- `7d` (default): now − 7 days → now.
- `work-week`: most recent Mon 00:00 → now, in the config timezone.
- `14d`, `30d`: rolling.
- `since-last-run`: read the newest existing `<YYYY-Www>/` folder's end time;
  fall back to `7d` if none.

Always print the resolved absolute window (start/end ISO) in `sources-pulled.md`
and at the top of `pulse.md`. Use the config `timezone`; default to the host
offset if unset.

## Collection conventions

- **Read-only.** Never send a message, post a reply, set a reaction, mark
  read/unread, edit a work item, or push code. Pull only.
- **Window filter at the source** where possible (`lastModifiedDateTime` /
  commit date) so you don't over-pull. Page until the window's start, then stop.
- **Follow pagination.** A host may cap each collection at a small page (e.g.
  10 messages) and return a continuation link (`@odata.nextLink` / skip-token).
  Follow it per source until the window's start is reached — a single fetch is
  rarely the whole week. Record the final pulled count, not the first page's.
- **Content lives in `body`, not `title`.** Many message sources return a null
  subject (chat/meeting messages especially). Pull and clean `body`; synthesize
  the record `title` from it when the source has no subject.
- **Thread, don't flatten.** Group channel posts with their replies; group chat
  messages by conversation. One thread → one record, with the reply count noted.
- **De-dupe.** The same doc linked in five messages is **one** `docs` record
  with the highest-weight referrer; collapse cross-posts.
- **Resolve doc links lazily.** Pull a linked document's title + a one-paragraph
  gist only if its referrer cleared the weight bar — don't fetch every link.
- **Strip narration garbage** from message bodies: @-mention markup, emoji-only
  reactions, "joined the team", adaptive-card noise, quoted-reply duplication.
- **Code adapter pulls the *shape* of change, not the diff.** For each watched
  module: commit/PR subjects in-window, author, and a one-line "what changed"
  for anything matching the module's `watch_for`. A 400-line diff becomes one
  line: *"payments-api: introduced async settlement boundary (PR #1234)."*
- **Never fabricate.** If a source fails or is empty, write the gap in
  `sources-pulled.md` (`Status: ok | partial | skipped:<reason> | failed:<reason>`).

## Prioritization (the `weight` score)

Score each record 0–3 so the Brief leads with what matters:

- **3 — Decisions & breaking changes.** Architectural decisions, contract/API
  changes, migrations, incidents, anything you're named/@-mentioned in, anything
  requiring an action from you.
- **2 — Direction & docs worth reading.** New design docs/specs, roadmap shifts,
  cross-team dependencies, notable PRs in watched modules.
- **1 — Ambient awareness.** FYIs, status updates, threads in your area you
  weren't in but should know happened.
- **0 — Noise.** Social, logistics, resolved-without-you. Excluded from the
  Brief; may appear only as a count.

Weight, never raw recency, drives Brief ordering. Recency breaks ties.

**Watch-list boosts.** A record authored by — or @-mentioning — a configured
`people` entry, or matching a configured `topics` keyword, gets **+1 weight
(capped at 3)**. A `tier: principal` person is worth surfacing even from forums
the user isn't in. This is how "what did <principal> weigh in on?" and "anything
on <topic> this week?" stay answered without the user re-asking each run.

**Landscape records.** The optional `landscape` config is watched via
`web_search`/`web_fetch`, not a host connector. Each landscape hit becomes a
weight-2 `docs` record (weight-3 only if it names something in the user's stack).
Keep landscape to a short tail of the Brief — it's context, not the week's work.

## Output: `pulse.md`

The committed-private deliverable. Pages are explicit so a reader (or the audio
listener) can stop after Page 1 and still be caught up.

````markdown
# Weekly Pulse — <YYYY-Www>

**Window:** <start ISO> → <end ISO> (<timezone>)
**Generated:** <YYYY-MM-DD HH:MM local> · `workflow-weekly-pulse`
**Pulled:** <N> messages · <M> docs · <K> code changes · <W> work items
**Read time:** Page 1 ≈ <min> min · full ≈ <min> min

---

## Page 1 — The Brief

> Narration-clean. This page is mirrored verbatim into `brief.md` for audio.

<6–14 short paragraphs of plain prose. No tables, no bullet dumps, no bare URLs,
no IDs. Lead with weight-3 items, then weight-2, then a short weight-1 sweep.
Read like a trusted colleague catching you up over coffee: what was decided,
what changed, what needs you, what to read. Name people and threads in words,
not links. End with a one-paragraph "what needs you this week".>

---

## Page 2 — The Board

> Visual. Tables + diagrams for fast scanning. Not narrated.

### Docs worth reading

| Doc | Why it matters | Read? | ~min | Source |
|-----|----------------|-------|------|--------|
| <title> | <one line> | **Read** / Skim / Skip | <n> | <channel/thread> |

### Code watch

| Module | Change | Impact | Ref |
|--------|--------|--------|-----|
| <module> | <one line> | contract / boundary / migration / fix | <PR/commit> |

### Thread map

```
<ASCII or mermaid: the week's main threads, who drove them, what they touched.
Keep it small — a map, not a mural.>
```

### Work items (if bound)

| Item | Moved to | Note |
|------|----------|------|

---

## Page 3 — Career & Visibility   (only if career config is on)

> Surfaces signal; does not draft. Drafting → `persona-self`. Rubric →
> `principal-engineer-career-mentor`.

### Post candidates

| Angle | From this week | Vehicle | Audience | Effort |
|-------|----------------|---------|----------|--------|

### Promotion signal (toward <target_level>)

<2–4 lines: which of this week's items map to the rubric in
`.persona-self/career-goals.md`, and the one gap worth closing. Honest, not
cheerleading. Defer the real review to the career mentor.>

---

## Overflow — <topic>   (only when content genuinely exceeds two pages)

<Spin out a heavy area — a big incident, a long decision thread — into its own
page rather than bloating the Brief.>
````

### `brief.md`

The exact prose of **Page 1**, alone, with a tiny header — nothing else. This is
what `generate-audio` narrates, so it must contain zero tables, links, or IDs.

````markdown
# Weekly Pulse Brief — <YYYY-Www>

<Page 1 prose, verbatim.>
````

### `sources-pulled.md`

```markdown
# Pulse provenance — <YYYY-Www>

**Window:** <start ISO> → <end ISO> (<timezone>)
**Run started / finished:** <ISO> / <ISO>

## Sources
| Adapter | Source | Pulled | Status |
|---------|--------|--------|--------|
| messages | Architecture | 23 posts / 6 threads | ok |
| code | payments-api/core | 4 PRs | ok |
| docs | (from links) | 5 | ok |
| work-items | — | — | skipped: not configured |

## Gaps / failures
<one line each, or "None">

## Notes
<anything the calling agent should know — over-pull, a channel that 404'd, etc.>
```

## Run budget

Soft caps — if you hit one, finish the current page cleanly, mark
`Status: partial`, and tell the calling agent:

- ~20 minutes of agent work per weekly run.
- ~12 channels/chats + ~6 watched modules per run.
- Page 1 ≤ ~700 words (≈ 4–5 min audio). If the week truly needs more, add an
  **overflow page** — do not bloat the Brief.

## Audio handoff (the skill prepares; the agent offers)

The skill leaves `brief.md` narration-ready. It never runs audio. The calling
agent offers the exact command:

```
pwsh C:\src\kai\scripts\generate-audio.ps1 -Source <abs path>\brief.md -Style verbatim -Lang en
```

`.kai/runs/pulse/` is gitignored, so any audio generated under it is
private by default too.

## Anti-patterns

- ❌ Naming a specific tenant, channel id, repo, or MCP server in this committed
  skill. Concrete wiring lives only in the gitignored `.kai/runs/pulse/sources.md`.
- ❌ Writing tables, links, or IDs into Page 1 / `brief.md`. It must narrate clean.
- ❌ Flattening threads into a wall of individual messages.
- ❌ Fetching every linked doc. Resolve only links above the weight bar.
- ❌ Ordering the Brief by recency instead of weight.
- ❌ Committing the digest automatically, or force-adding it. Private by default.
- ❌ Any write action against a source (send, react, mark-read, edit item, push).
- ❌ Fabricating a section for a source that failed or isn't bound — record the gap.
- ❌ Running `generate-audio` (Azure cost) — leave that to the agent's explicit offer.

## Output contract

When a run finishes:

1. `pulse.md`, `brief.md`, and `sources-pulled.md` exist at the week-folder path.
2. `brief.md` is exactly Page 1's prose — no tables/links/IDs.
3. Every source in `sources-pulled.md` either contributed records or has a
   `skipped:` / `failed:` reason.
4. `.kai/runs/pulse/` is gitignored; nothing was committed or force-added.
5. The calling agent receives: week-folder path, pulled counts, the resolved
   window, any partial/failure flags, and whether Page 3 (career) was produced.
6. No audio generated, no messages sent, no items edited.

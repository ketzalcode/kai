---
name: kai-core-web-content-extraction
description: "Extracts readable website content to markdown. Use when course modules, certification units, docs, or long articles need downstream consumption."
tools: [playwright, execute, edit, read, ask_user]
---

> **Requires a Playwright MCP server** registered under the key `playwright` in your host's MCP config (see `docs/getting-started.md` → "Browser automation setup"). Without it, the browser steps here cannot run.

# Web Content Extraction

This skill is the **plumbing** for any agent that needs to turn the
readable text of a website into clean local markdown. The marquee use
case is feeding course / certification content into the
`kai-core-generate-audio` skill so the user can listen on the go, but the skill
itself doesn't assume that downstream — it just produces tidy markdown.

The judgment about *which* sites are worth extracting and *what* to do
with the output belongs to the calling agent. This skill owns only how
the extraction is recorded.

Sister skill to `kai-core-web-evaluation`: that one is for evaluating a UI;
this one is for harvesting the words on a UI.

## When to apply

- A calling agent (e.g. `workflow-course-to-audio`) is asked to extract the
  readable content of one or more web pages.
- The user has provided a **URL** and, optionally, scope hints
  (single page, full module, full learning path).

**Skip for:**

- UI evaluation runs — use `kai-core-web-evaluation` (the QA / UX agents call
  that one).
- Pages where the value is the interaction, not the text (web apps,
  dashboards, calculators).
- Auth-walled content where the user can't or won't log in
  interactively — surface and stop.
- Pages already available as a clean download (PDF, transcript file,
  RSS / API). If the source publishes machine-readable text, use that
  instead of crawling rendered HTML.

## Hard rules

1. **Read-only browsing.** Never click "Submit", "Buy", "Enroll",
   "Reset", "Delete", "Mark complete", quiz-submit buttons, or anything
   else that mutates state. Only navigate, scroll, and read.
2. **Respect the pivot the user landed on.** Microsoft Learn modules
   (and similar) use `?pivots=` to choose a language / tool variant.
   Walk units within the same pivot; do not silently switch.
3. **No credentials in chat.** If the surface requires login, use the
   login-pause pattern below. Never type a password on the user's
   behalf, even if it's saved in their browser.
4. **One run, one output folder.** Do not overwrite a prior run's
   markdown; create a new `<NN>`-indexed run folder under the goal
   (`<NN>` = highest existing + 1, never filling gaps). Re-runs are explicit.
5. **Cite the source.** Every generated markdown file lists the
   original URL(s) it was extracted from. The user must always be one
   click away from the source of truth.
6. **Stay within the user's stated scope.** If they said "this one
   module", don't follow links into adjacent modules or the learning
   path index. If they said "the whole learning path", do follow the
   module links — but stop at the path boundary.
7. **Don't fabricate.** If a section is empty, marked premium /
   members-only, or fails to render, write `> _Content not extracted:
   <reason>_` and move on. Do not invent text.

## Folder layout

All output for a single run lives in:

```
<workspace-root>/.kai/runs/learn/<goal-slug>/<NN>-extract-<source-slug>/
  module.md          ← narration content, all units concatenated
  questions.md       ← knowledge-check questions, for self-testing
  source.md          ← metadata: original URL, walked URLs, timings, failures
  raw/               ← optional per-unit raw snapshots, gitignored
    01-<unit-slug>.md
    02-<unit-slug>.md
    ...
```

- `<repo-root>` is the current working directory's git root. If not
  in a git repo, fall back to `<cwd>/.kai/runs/learn/`.
- `<goal-slug>` is the **durable learning goal** this run belongs to — a
  descriptive kebab-case slug like `learn-react`, `az-204`, or
  `prep-for-interview-vercel` — so every run toward one goal stays in one
  folder. The calling agent resolves it from the operator's intent; when none
  is given it **defaults to `<source-slug>`**. Reuse an existing goal folder
  rather than minting a near-duplicate.
- `<NN>` is the two-digit run index **within the goal**: the highest existing
  index + 1, never filling gaps, so runs sort in the order they ran (the same
  rule as the date-first areas — `learn`/`lessons` swap the date for the goal).
- `<source-slug>` is a kebab-case slug for what was extracted. Derivation rules:
  - **Microsoft Learn module:** the segment after `/training/modules/`
    (e.g. `get-started-ai-fundamentals`).
  - **Microsoft Learn learning path:** the segment after `/training/paths/`.
  - **Coursera / edX / Udemy course:** the course slug from the URL.
  - **Generic article / doc page:** the last path segment, lowercased.
  - **When ambiguous:** ask the user once.
- When an artifact in a **separate** run needs to point back to this one, it
  records the link in its **frontmatter** (a `produced_from:` path) rather than
  baking this run's path into its own folder name — keeping the goal-first layout
  stable and inter-agent hand-off independent of folder nesting. Output
  co-located inside this run (like a teacher's `lessons/` subfolder) is simply
  part of the run, not a cross-reference.

## Zone, gitignore & promotion

Runs land in the **run root** — `.kai/runs/learn/` — which
`workflow-workspace-init` gitignores **wholesale** (see
`kai-core-workspace-conventions`). You do **not** patch `.gitignore` per folder; the
working root is ephemeral. The extracted markdown (`module.md`,
`questions.md`, `source.md`) and the `raw/` snapshots all live there as
working output, and `kai-core-generate-audio` reads the markdown straight from that
path.

These lesson deliverables default to the **working (local)** zone. To
**share** them — so they travel via `git pull` — the operator passes
`--share` and the calling agent promotes the markdown to
`kai/library/lessons/<goal-slug>/<source-slug>/` with frontmatter (raw snapshots and
audio never promote — regenerable).

## Login pause pattern

When a target redirects to or shows a sign-in page:

1. Snapshot the sign-in screen for context (file under `raw/` as
   `00-login-pause.md` with the page title + URL).
2. **Interactive mode** (a human is at the terminal): post to the
   user, verbatim:

   > **Login required.** I've opened `<URL>` and it wants me to sign
   > in. Please complete the login in the visible browser window, then
   > reply `continue` and I'll resume.

   Wait for them. Do not poll. When they reply, verify the
   authenticated state via a Playwright snapshot, then continue.

3. **Headless / cloud mode** (no interactive user): do **not** pause.
   Stop the run, write `source.md` with `Status: blocked-by-auth`, and
   tell the calling agent. Do not partial-extract.

If the user says they couldn't log in, record the same blocked status
and stop cleanly.

## Multi-unit traversal

Most courses span N units linked from a nav or "next unit" button.
The skill walks them:

1. Land on the URL the user gave you. Capture its title and content.
2. Look for a unit nav in this order of preference:
   - A visible "Next" / "Next unit" link with a same-host `href`.
   - A sidebar / drawer listing all units of the current module/path.
   - Sequential URL inference (`/1-introduction` → `/2-...`) **only** as
     a last resort, and only if the candidate URL responds 200 with
     content matching the expected pattern.
3. For each subsequent unit:
   - Navigate. Wait for the main content region to render.
   - Extract title + body (see "Content extraction" below).
   - Save the unit's raw markdown under `raw/NN-<unit-slug>.md`.
4. Stop when:
   - The "Next" link points off the module / path the user scoped to.
   - The sidebar's last unit is reached.
   - A unit fails to extract twice — record the failure in `source.md`,
     stop, surface to the calling agent.
5. After all units extract, concatenate them in walk order into
   `module.md`. Strip knowledge-check sections into `questions.md`
   (see below). Write `source.md` last.

If the URL is a single page (not part of a module), skip multi-unit
logic and just produce `module.md` (one section) + `questions.md` (if
the page has any questions) + `source.md`.

## Content extraction

Use Playwright's accessibility tree snapshot as the primary signal —
it's more robust than parsing HTML by hand.

**Keep:**

- The main `<h1>` of the unit as the unit title (becomes `## <title>`
  in `module.md`).
- Heading hierarchy below it (`<h2>` → `###`, `<h3>` → `####`, …).
- Paragraphs, lists (ordered & unordered), block quotes, tables.
- Code blocks. Use the source's language hint (`class="language-x"`)
  when available; default to bare ``` fences.
- Inline links — keep the link text, drop the URL (audio narrators
  read URLs as garbage). Exception: the unit's own canonical URL goes
  in the source.md metadata.
- Image alt text, written as `> _Image: <alt>_` so the listener gets
  the visual context.
- Definition lists / glossary entries.

**Strip:**

- Site nav (header / sidebar / footer that isn't unit-specific).
- "On this page" / table-of-contents widgets.
- "Was this page helpful?" / feedback widgets.
- "Edit this page" / "Report an issue" buttons.
- Social share buttons.
- Cookie banners.
- "You completed this unit" / progress widgets.
- Ads, promo strips, "explore related content" sidebars.

**Special case — Microsoft Learn:**

- The main content lives inside `<main id="main">` or `<div class="content">`.
- Unit title is `<h1>` inside that container.
- Code samples have language hints in `class="lang-*"`.
- Knowledge-check sections are wrapped in `<section data-mod-type="quiz">`
  or have an `<h2>` reading "Knowledge check".

## Knowledge-check / quiz detection

A section is a knowledge-check if any of these hold:

- The section's heading matches (case-insensitive):
  `Check your knowledge`, `Knowledge check`, `Quiz`, `Quick check`,
  `Test yourself`, `Review questions`, `Self-assessment`.
- The section is wrapped in a container with `data-mod-type="quiz"`
  or class containing `quiz` / `knowledge-check`.
- The section contains 2+ items that look like multiple-choice (a
  short question + 2–5 radio-style options).

For each knowledge-check section:

1. Capture the question text verbatim.
2. Capture each option's text verbatim.
3. **Do not capture the correct answer**, even if it's visible in the
   DOM. The point is self-testing later.
4. Add the question to `questions.md` under a `## Unit N — <unit title>`
   heading, formatted as:

   ```
   ### Q: <question text>
   - [ ] <option A>
   - [ ] <option B>
   - [ ] <option C>
   - [ ] <option D>
   ```

5. **Remove** the question from the unit's narration in `module.md`,
   replacing it with a small note: `> _Knowledge check moved to
   questions.md_`. The audio listener doesn't need answer options
   spoken aloud.

If a knowledge-check has no detectable options (just a prompt for
free-form thinking), keep the prompt in `questions.md` without options.

## Output: `module.md`

Shape (fill in from extraction):

````markdown
# <Module title — from the path index or the first unit's H1>

**Source:** <root URL>
**Extracted:** <YYYY-MM-DD HH:MM local>
**Units walked:** <N>
**Estimated reading time:** <minutes> · **Estimated audio length:** <minutes at ~180 wpm>

> Generated by `kai-core-web-content-extraction`. For audio: run
> `kai-core-generate-audio` on this folder. Knowledge-check questions live in
> `questions.md`.

---

## Unit 1 — <unit title>

<unit body, cleaned markdown>

> _Knowledge check moved to questions.md_

---

## Unit 2 — <unit title>

<unit body>

---

…
````

Targets: clean, narratable prose. No bare URLs. No nav residue. No
"Next: <link>" footers. If you find yourself writing a line that
wouldn't read well aloud, drop it.

## Output: `questions.md`

Shape:

````markdown
# Knowledge checks — <Module title>

**Source module:** `module.md`
**Total questions:** <N>

> Self-test: answer from memory after listening. Correct answers
> intentionally not captured — go back to the source URL in
> `source.md` to verify.

---

## Unit 1 — <unit title>

### Q1: <question text>
- [ ] <option A>
- [ ] <option B>
- [ ] <option C>
- [ ] <option D>

### Q2: <question text>
- [ ] <option A>
- [ ] <option B>

---

## Unit 3 — <unit title>

…
````

Skip units that have no knowledge checks (don't write empty
"Unit N" sections). If the whole module has no knowledge checks,
write a single line: `> _No knowledge checks detected in this module._`
and stop.

## Output: `source.md`

Shape:

```markdown
# Extraction source — <Module title>

**Root URL:** <url>
**Pivot:** <e.g. `text` / `azurecli` / none>
**Run started:** <ISO timestamp>
**Run finished:** <ISO timestamp>
**Status:** ok | partial | blocked-by-auth | failed

## Units walked

| # | Unit title | URL | Status |
|---|------------|-----|--------|
| 1 | <title>    | <url> | ok |
| 2 | <title>    | <url> | ok |
| 3 | <title>    | <url> | failed: <reason> |

## Failures

<one-line summary per failure, or "None">

## Notes

<any odd things the calling agent should know — e.g. "pivot
switched mid-module", "a unit redirected to a paywall">
```

## Run budget

Soft caps:

- ~30 minutes of agent work per module
- ~30 units per single run
- ~5,000 words extracted per unit (huge units are a smell — flag in
  `source.md` notes)

If the agent hits a cap, it should:

1. Finish writing the current unit cleanly.
2. Write `source.md` with `Status: partial` and note where it stopped.
3. Tell the calling agent.

## Anti-patterns

- ❌ Following links into related modules / paths the user didn't
  scope.
- ❌ Switching pivots mid-walk (e.g. starting on `?pivots=text` and
  jumping to `?pivots=azurecli`).
- ❌ Capturing correct-answer markings in `questions.md`.
- ❌ Leaving raw HTML tags in the markdown output — clean it or drop
  it.
- ❌ Auto-committing anything, or hand-patching `.gitignore`. The `.kai/runs/`
  working root is ignored centrally; markdown is local by default and shared
  by promotion to `kai/library/lessons/`. The agent never runs git.
- ❌ Bypassing the login-pause pattern by guessing creds.
- ❌ Inferring content for sections that didn't render. Always write
  `_Content not extracted: <reason>_`.

## Output contract

When the skill finishes a run:

1. `module.md`, `questions.md`, and `source.md` all exist at the
   run-folder path.
2. Every unit referenced in `source.md` either contributed to
   `module.md` or has a `failed:` reason listed.
3. The run lives under the gitignored `.kai/runs/learn/` run root; no
   per-folder `.gitignore` patching is done. Markdown defaults to local;
   promote to `kai/library/lessons/` with `--share`.
4. The calling agent receives: run folder path, unit count, word
   count, question count, and any partial / failure flags.
5. No commits, no audio generation, no auto-cleanup. The user owns
   git; the calling agent owns the audio handoff.

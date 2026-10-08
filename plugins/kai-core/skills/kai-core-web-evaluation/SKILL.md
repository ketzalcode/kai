---
name: kai-core-web-evaluation
description: "Provides safe Playwright live-product evaluation plumbing. Use when QA, UX, SEO, or product exploration needs login, evidence, screenshots, and reports."
durable-output-producer: true
tools: [playwright, execute, edit, read, ask_user]
---

> **Requires a Playwright MCP server** registered under the key `playwright` in your host's MCP config (see `docs/getting-started.md` → "Browser automation setup"). Without it, the browser steps here cannot run.

# Web Evaluation

This skill is the **plumbing** that auditing agents reuse
(`eng-reviewer-quality` and future web agents). It owns
everything that should
look identical across them: where output goes, how screenshots
are named, how login pauses work, how the report is shaped.

The mindset, map/evaluation schema, and what-to-look-for belong to the calling
agent. This skill does not decide what to explore or judge.

## When to apply

- A calling agent is asked to walk a website/app and produce a
  structured evaluation report, or to capture neutral browser evidence
  supporting a map the calling agent owns.
- The user has provided a **URL** and, optionally, a sentence or two
  of focus (e.g. "concentrate on the checkout flow").

**Skip for:**

- Static repo code review.
- Pure network/perf benchmarking (out of scope; build a separate
  skill if needed).
- One-off "click this and tell me what happens" probes — no need to
  spin up the folder structure.

## Hard rules

1. **Browser choice is host-dependent, not hard-coded.** Use whatever
   browser is available via Playwright MCP on the host. On Windows,
   Edge is preinstalled and works well (`--browser msedge`); installing
   Chrome there often needs admin. On macOS/Linux, Chromium or Chrome
   is fine. If the user's MCP setup doesn't specify, ask once at the
   start of the run rather than guessing. **Host reach differs:** the CLI
   host can drive both `localhost` and public URLs; a cloud coding-agent
   host typically reaches only public URLs. If the target is `localhost`
   and the host can't reach it, say so and fail fast — don't pretend to
   have evaluated a page you never loaded.
2. **Never trigger destructive actions** on a real site without
   explicit user confirmation per action. "Delete account",
   "Submit payment", "Send invitation" → stop and ask.
3. **No credentials in chat.** If the surface requires login, use
   the login-pause pattern below.
4. **Screenshots are deliberate.** A screenshot is only worth taking if it
   will be cited from the produced report or map. No bulk dumps.
5. **Stay in scope.** If the user asked for "the checkout flow",
   don't roam into account settings. Surface the temptation and
   ask.
6. **Cite locations.** Every finding or mapped product fact cites a screenshot,
   URL/route, selector path, or combination appropriate to the claim.

In evidence-only mode, use the folder/login/safety/evidence sections
only. The schema and completion rules come from the calling agent; do not
force it into the QA/UX findings scaffold below.

## Folder layout

All output for a single evaluation lives in:

```
.kai/core/reports/web-evaluation-<YYYYMMDD>-<NN>-<descriptor>/
  drafts/
    report.md
  evidence/
    screenshots/
      01-<short-slug>.png
      02-<short-slug>.png
      ...
    trace.zip        (optional, if Playwright trace recording was on)
```

The canonical forms are:

```text
.kai/core/reports/web-evaluation-<YYYYMMDD>-<NN>-<descriptor>/{drafts,evidence,scratch}
docs/kai/core/reports/web-evaluation-<YYYYMMDD>-<NN>-<descriptor>/
```

In evidence-only mode, the run folder contains only raw local evidence
such as `screenshots/`, trace, and non-secret capture metadata. It must not
create `report.md` or the derived map there; the map goes only to the
validated Task `artifact_targets` entry.

- Resolve `<workspace-root>` and the bound project from the dispatch packet,
  current Direction, or `kai-core-workspace-paths`. Never substitute the
  calling agent's repository/cwd for a different target workspace.
- Load `kai-core-workspace-publication`, then Load `kai-core-asset-producing`
  before retaining a durable evaluation report.
- The exact report ID grammar is
  `web-evaluation-<YYYYMMDD>-<NN>-<descriptor>`.
  - `<YYYYMMDD>` is the local evaluation date in eight-digit `YYYYMMDD` form.
  - `<NN>` is the next unused positive sequence for that date, zero-padded to
    at least two digits.
  - `<descriptor>` is a required lowercase kebab-case surface description,
    limited to five short words.
- Derive the descriptor from the evaluated surface:
  - `https://app.contoso.com/checkout` → `contoso-checkout`
  - User said "the new onboarding flow" → `onboarding-flow`
  - When in doubt, use a short factual slug; do not omit the descriptor.
- Before writing, check that exact ID is absent from both the private and public
  report roots, then create the private report root atomically. If another run
  wins the collision, increment `<NN>` and retry.
- Every rerun allocates a new `<NN>` and never reuses an earlier ID.
- Store the calling lens (`qa`, `explore`, `stress`, or another short kebab
  slug), local timezone, typed subject/version, and evaluated URL in
  `report.md` metadata. The subject-bound `artifact.register` UUID remains
  coordination provenance; it is not the typed report path ID.

**Placement is mandatory — never write elsewhere.** Evaluation output lands
under the validated typed core report path. Never write it to Copilot
session-state, a temp directory, or the calling agent's cwd. When a browser or
stress harness takes an output dir (`OUT`), it must resolve under that report's
`evidence/` directory; reject any other destination.

**One folder per evaluation — never collapse the path.** The typed report ID
retains date, sequence, and descriptor so evaluations remain distinct.

## Zone, gitignore & promotion

Evaluations land under the typed private core report root. All of `.kai/` is
ignored and untracked. Do not patch `.gitignore` per folder. `report.md` stays
under `drafts/`; screenshots, traces, HARs, and logs stay under `evidence/`.

To publish a defect report, the calling agent accepts one exact curated
revision and mirrors it through the core publication contract. Screenshots stay
private evidence, referenced by their
run path; promote the text, not the binaries.

If the target workspace was never onboarded, stop and invoke
`workflow-workspace-init` for that exact root before a coordinated run.
Playwright MCP's scratch directory (`.playwright-mcp/`) remains scratch only
and is never the durable report/evidence location.

## Login pause pattern

When a target redirects to or shows a sign-in page:

1. Take a screenshot of the sign-in page (filename:
   `00-login-pause.png`).
2. Decide which mode you're in:

   - **Interactive mode** (CLI, a human is sitting at the terminal):
     post to the user, verbatim:

     > **Login required.** I've opened `<URL>` and it wants me to
     > sign in. Please complete the login in the visible browser
     > window, then reply `continue` and I'll resume.

     Wait for the user to reply. Do not poll. Do not retry. When
     they reply `continue` (or equivalent), verify the
     authenticated state via a Playwright snapshot, then proceed.

   - **Headless / cloud mode** (no interactive user available — e.g.
     running as a coding agent on a remote runner): do **not**
     pause. Mark the page in the report's Coverage section as
     `blocked-by: auth` and continue with whatever is reachable
     unauthenticated. Treat any "this requires login" surface as
     out-of-scope-for-this-run.

3. If the user replies that they couldn't log in (interactive mode),
   record `blocked-by: auth` in Coverage and continue with what's
   reachable.

If the agent can't tell which mode it's in, default to **interactive
mode** if `ask_user` is available; otherwise default to headless.

## Screenshot discipline

- One screenshot per finding maximum (two only if a before/after is
  genuinely needed to show the issue).
- Filename: `NN-<short-slug>.png`, zero-padded to 2 digits.
  - `<short-slug>` is kebab-case, ≤ 5 words, describing the issue
    (`02-submit-button-overlap`, `07-mobile-nav-clipped`).
- Soft cap **15 screenshots per run**. If the agent is about to
  take a 16th, it must justify why in the report.
- Take the screenshot at the viewport where the issue is
  reproducible. Note the viewport in the report row.
- **Screenshots stay local evidence — not committed.** They live under the
  typed report's private `evidence/` directory. Heavy binaries, including
  `screenshots/`, never enter project publication. When you publish a report,
  publish the **text** and reference evidence by its private run path.
  Keep filenames stable so the report's local links don't break across renames.

## Priority scheme

Every report row carries a priority. The base definitions below are
the default; **calling agents may specialize the semantics** to fit
their lens (e.g. a search-visibility lens uses P0 for "page won't index", not
"page won't load"). When an agent specializes, it documents the
specialization in its own contract — this skill provides the floor.

| Priority | Means (default) |
|----------|------------------|
| **P0**   | Blocks a primary user flow. Something a customer would hit and bounce on. (Broken submit, page won't load, infinite spinner, console error that prevents action, dead-end confusion.) |
| **P1**   | Major degradation. Flow still completes but with friction or visible defect (overlap, broken layout, missing CTA on a common viewport, error message that doesn't explain itself, confusing copy in a primary flow). |
| **P2**   | Minor. Cosmetic, edge-case, or polish that a careful user would notice (off-by-a-few-px alignment, slightly wrong copy, mildly confusing label outside the primary flow). |
| **P3**   | Nit. Suggestion only. Skip these unless the user explicitly asked for nits. |

When in doubt between two adjacent priorities, pick the lower one
(P1 over P0, P2 over P1). Avoid priority inflation.

## Report scaffold — QA flavor

Filename: `report.md`. Skeleton (calling agent fills in):

````markdown
# QA Report — <target name>

**Target:** <URL or surface name>
**Date:** <YYYY-MM-DD HH:MM local>
**Run:** eng-reviewer-quality
**Viewports:** desktop 1440×900, mobile 390×844 (or whatever was used)

## Summary

<5–6 lines: what surfaces I walked, top-line verdict, count by priority.>

## Findings

| # | Priority | Title | Viewport | Observation & Suggested Fix | Evidence |
|---|----------|-------|----------|------------------------------|----------|
| 1 | P0 | <short title> | desktop | <one paragraph: what I did, what happened, what I expected, smallest fix I can suggest> | `screenshots/01-...png` |
| 2 | P1 | ... | mobile | ... | `screenshots/02-...png` |

## Coverage

**Tested:**
- <surface> — <what I did>
- <surface> — ...

**Not tested:**
- <surface> — <why (out of scope / not reachable / time budget)>

**Blocked-by:**
- <thing that stopped me> — <e.g. login required and skipped>

## Next steps (optional)

<If the user wants to port findings into a tracker — Notion / ADO /
GitHub Issues — list the P0/P1 titles in order. Otherwise omit.>
````

Other auditing agents (current or future) follow the same pattern:
**start from the QA-flavor base, add agent-specific extensions only
where the lens demands it.** Don't fork scaffolds unnecessarily —
PR reviewers across runs benefit from a recognizable shape.

## Run budget

Soft caps for a single run:

- ~20 minutes of agent work
- ~15 screenshots
- ~20 findings total (across all priority levels)

If the agent is approaching any cap, it should:

1. Wrap the current finding cleanly.
2. Add a **`## Continuation`** section to the report listing what
   it would explore next.
3. Save and stop. The user can re-invoke with `continue this run`
   to reopen the same run folder.

## Anti-patterns

- ❌ Writing the report into the repo root, Copilot session-state, a temp
  directory, a retired generic QA root, or the calling agent's cwd. Always use the
  validated
  `.kai/core/reports/web-evaluation-<YYYYMMDD>-<NN>-<descriptor>/` private
  path, even when a non-QA agent or a browser/stress harness (`OUT`) drives the
  run.
- ❌ Taking a screenshot per page just to "have coverage". Each
  screenshot must be referenced.
- ❌ Reporting a finding without a viewport (QA flavor) or without
  a persona reaction (UX flavor).
- ❌ Filing console warnings as P0. Warnings are P2 at most unless
  they have visible UI impact.
- ❌ Bypassing the login-pause pattern by guessing creds or
  skipping silently in interactive mode.
- ❌ Pausing for human input in headless/cloud mode. Mark as
  `blocked-by: auth` and continue.
- ❌ Mutating site state (someone else's data) without explicit
  per-action approval.
- ❌ Recommending fixes the agent can't justify. Speculation
  belongs in `## Next steps`, not in a finding row.
- ❌ Auto-committing anything, or hand-patching `.gitignore`. The typed report
  stays ignored; sharing happens only by publishing an accepted report through
  the core publication contract, never by committing private evidence.
  The agent never runs git.

## Output contract

When the skill (and the calling agent) finishes a run:

1. `report.md` exists at the typed report draft path.
2. Every row in the findings/friction tables has at least:
   priority, title, observation, and either a screenshot or a
   URL + selector citation.
3. The evaluation lives under the validated typed core report path; no
   per-folder `.gitignore` patching is done. Publication requires exact-revision
   acceptance.
4. The agent posts back to the user: run folder path, finding
   count by priority, and a one-line top-line verdict.
5. No commits, no pushes. The user owns git.

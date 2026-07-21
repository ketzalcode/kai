---
name: web-evaluation
description: "Shared Playwright plumbing for live-product walkthroughs: safe-action rules, login pause, local run folders, screenshot discipline, and evaluation report scaffolds. QA/UX/SEO use the full evaluation contract; workflow-product-explore reuses only safety/login/evidence plumbing and supplies its own neutral product-map schema."
tools: [playwright, bash, edit, view, ask_user]
---

# Web Evaluation

This skill is the **plumbing** that auditing agents and the neutral product
explorer reuse (`principal-qa-ui`, `persona-ux-first-time-user`,
`principal-seo`, `workflow-product-explore`, and future web agents). It owns
everything that should
look identical across them: where output goes, how screenshots
are named, how login pauses work, how the report is shaped.

The mindset, map/evaluation schema, and what-to-look-for belong to the calling
agent. This skill does not decide what to explore or judge.

## When to apply

- A calling agent is asked to walk a website/app and produce either a
  structured evaluation report or, for `workflow-product-explore`, neutral
  browser evidence supporting a product map.
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
   start of the run rather than guessing.
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

For `workflow-product-explore`, use the folder/login/safety/evidence sections
only. Its schema and completion rules come from `product-exploration`; do not
force it into the QA/UX findings scaffold below.

## Folder layout

All output for a single run lives in:

```
<working-root>/qa/<target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/
  report.md
  screenshots/
    01-<short-slug>.png
    02-<short-slug>.png
    ...
  trace.zip        (optional, if Playwright trace recording was on)
```

For `workflow-product-explore`, the run folder contains only raw local evidence
such as `screenshots/`, trace, and non-secret capture metadata. It must not
create `report.md` or the product map there; the map goes only to the
canonical initiative `artifact_target`.

- Resolve `<workspace-root>` and `<working-root>` from the dispatch packet,
  loaded north star, or `workspace-conventions`. Never substitute the calling
  agent's repository/cwd for a different target workspace.
- `<target-slug>` is a kebab-case slug derived from the target URL
  or the feature name the user gave you. Examples:
  - `https://app.contoso.com/checkout` → `contoso-checkout`
  - User said "the new onboarding flow" → `onboarding-flow`
  - When in doubt, ask the user for the slug before creating the
    folder.
- `<flavor>` identifies the calling agent's lens — typical values:
  `qa` (principal-qa-ui), `ux` (persona-ux-first-time-user), `seo`
  (principal-seo). New auditing agents pick a short kebab slug.
- The timestamp is local time, 24-hour, e.g. `2026-06-17-1823`.

**One folder per run — never collapse the path.** It is always
`<working-root>/qa/<target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/` — three nested
segments. Never fuse them into `.kai/runs/qa-<flavor>/`, and
never drop the target to `.kai/runs/qa/<flavor>/`. Same agent, same target →
same shape every run, so a target's audits group under one
`qa/<target-slug>/` tree.

## Zone, gitignore & promotion

Runs land in the resolved **working root** under `qa/`, which
`workflow-workspace-init` gitignores **wholesale** (see
`workspace-conventions`). You do **not** patch `.gitignore` per folder
anymore: the whole working root is ephemeral by design. A run's
`report.md`, its `screenshots/`, and the heavy artifacts (traces, HARs,
logs) are all working output that lives there.

To **share** a defect report, the calling agent promotes the curated
markdown to
`<workspace-root>/library/qa-findings/<target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/report.md`
with library frontmatter — that committed copy is what travels via `git pull`.
Screenshots stay in the working root as local evidence, referenced by their
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
- **Screenshots are committed alongside reports.** They're part of
  the deliverable, not local-only artifacts — PR reviewers, future
  agents, and the calling user all benefit from seeing the visual
  evidence inline with the markdown. Keep filenames stable so links
  from the report don't break across renames.

## Priority scheme

Every report row carries a priority. The base definitions below are
the default; **calling agents may specialize the semantics** to fit
their lens (e.g. `principal-seo` uses P0 for "page won't index", not
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
**Run:** principal-qa-ui
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

## Report scaffold — UX flavor

Filename: `report.md`. Skeleton (calling agent fills in):

````markdown
# UX First-Use Review — <target name>

**Target:** <URL or surface name>
**Date:** <YYYY-MM-DD HH:MM local>
**Run:** persona-ux-first-time-user
**Persona:** <who I pretended to be>

## Summary

<5–6 lines, narrative: who I pretended to be, what I tried to do,
top-line impression as a first-time user.>

## Friction points

| # | Priority | Title | Observation | Evidence |
|---|----------|-------|-------------|----------|
| 1 | P0 | <short title> | <one paragraph in first-person: what I tried, what confused me, what I expected, what I did next> | `screenshots/01-...png` |

## Proposals

| # | Priority | Title | Suggested improvement | Why it would help |
|---|----------|-------|------------------------|--------------------|
| 1 | P1 | <short title> | <concrete proposal — UI/copy/flow change> | <one line tying it to a friction point above, or to a missing thing> |

## Coverage

**Tested:**
- <flow> — <how I walked it>

**Not tested / not reached:**
- <flow> — <why>

## Next steps (optional)

<As above.>
````

## Report scaffold — SEO flavor

Filename: `report.md`. The SEO flavor uses the **QA flavor as its
base** (same Findings table shape, same Coverage section) and adds
two SEO-specific extensions:

1. A **`## Standards delta`** block near the top, immediately under
   the run header. This records the result of the calling agent's
   start-of-run standards refresh check (a `web_search` pass that
   verifies the agent's baseline knowledge is still current). It's
   what lets SEO findings stay defensible as the spec moves.
2. A **`Citation`** column added to the Findings table. SEO defects
   without a citation to a current standard (Google Search Central,
   schema.org, IETF, etc.) are unfileable — engineers can't fix
   what they can't trace to a spec.

Skeleton (calling agent fills in):

````markdown
# SEO + agentic-search Audit — <target name>

**Target:** <URL or surface name>
**Date:** <YYYY-MM-DD HH:MM local>
**Run:** principal-seo
**Routes audited:** <list of routes>

## Standards delta (vs <baseline date> baseline)

**Refresh check run at:** <YYYY-MM-DD HH:MM>
**Result:** <✅ no deltas / 🟡 minor delta / ❌ major delta>

<If deltas: bulleted list of what changed since the agent's baseline,
source link, and how it affected verdicts in this report. If no
deltas: one line stating that the refresh check passed clean.>

## Summary

<5–6 lines: routes audited, top-line verdict, count by priority,
top 3 highest-leverage fixes.>

## Findings

| # | Priority | Title | Route | Observation & Suggested Fix | Citation | Evidence |
|---|----------|-------|-------|------------------------------|----------|----------|
| 1 | P0 | <short title> | `/route` | <one paragraph: what I observed, what I expected per spec, smallest fix> | <link to the standard the defect references> | `screenshots/01-...png` or curl command |

## Coverage

**Audited:**
- <route> — <which checks applied>

**Discovery files probed:**
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`, ... — <result per file>

**Not audited:**
- <route or check> — <why (out of scope / not reachable / time budget)>

## Next steps (optional)

<As above.>
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

- ❌ Writing the report straight into the repo root or session folder. Always
  use `<working-root>/qa/<target>/<run>/`.
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
- ❌ Auto-committing anything, or hand-patching `.gitignore`. The whole
  `.kai/runs/` root is ignored centrally by `workflow-workspace-init`;
  sharing happens by **promoting** the report to `library/qa-findings/`
  (the calling agent's call), never by committing inside the working root.
  The agent never runs git.

## Output contract

When the skill (and the calling agent) finishes a run:

1. `report.md` exists at the run-folder path.
2. Every row in the findings/friction tables has at least:
   priority, title, observation, and either a screenshot or a
   URL + selector citation.
3. The run lives under the resolved working root's `qa/` area; no
   per-folder `.gitignore` patching is done. Sharing is via promotion of
   `report.md` to `library/qa-findings/`.
4. The agent posts back to the user: run folder path, finding
   count by priority, and a one-line top-line verdict.
5. No commits, no pushes. The user owns git.

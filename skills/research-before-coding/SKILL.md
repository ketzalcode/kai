---
name: research-before-coding
description: "Apply before making any non-trivial code change. Enforces the user's research discipline: investigate the codebase first, identify module ownership (own/partner/shared), look for reusable code, and surface tradeoffs before writing."
tools: [read, search, grep, glob, bash]
user-invocable: true
argument-hint: [optional task or area description]
---

# Research Before Coding

Don't jump straight to writing. Investigate first, then propose, then
code. This skill enforces the discovery discipline the user follows on
every non-trivial change.

## When to use

- Any code change beyond a one-line fix in a file you already understand
- Before adding a new utility, component, hook, or service
- Before refactoring across more than one file
- When the user says "we need to change X" without specifying the
  approach

**Skip for:**

- Typo fixes, comment edits, doc-only changes
- Trivial one-line changes in a file you've already mapped in this session

## Module taxonomy

Classify each file you intend to touch into one of three categories.
This determines how much freedom you have:

| Category            | What it is                                                                                              | How to treat it                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Owned module**    | A module the user / their team owns and has permission to change directly.                              | Free to modify. Still respect existing patterns.                                                                      |
| **Partner module**  | A module owned by an adjacent team the user follows closely.                                            | Study its patterns and **stay close** to how that team does things. Don't modify without coordination.                |
| **Shared module**   | Utilities meant to be reused (folders often named `common-*`, `shared`, `core`, `utils`, `runtime`).    | **Reuse first.** Evaluate quality before consuming. If a bug or gap exists, surface it before adopting.               |

Detect the category from: repo structure, `CODEOWNERS`, README /
`AGENTS.md` guidance, folder names containing `common` / `shared` /
`core`, package ownership metadata. If unclear, **ask the user**.

## Workflow

### Step 1 — Understand the request

State the change in one sentence. If you can't, ask the user to
clarify before exploring.

### Step 2 — Map the target area

- Identify the file(s) most likely to change.
- Classify each into the module taxonomy above.
- Read 2–5 nearby files to learn the local conventions (naming, file
  layout, state pattern, error handling).

### Step 3 — Search for prior art

- Grep / search for similar functionality already in the repo.
- Check shared modules for a reusable utility that solves part of the
  problem.
- If a candidate exists:
  - Read it. Verify it actually fits.
  - Check that it's not broken, deprecated, or scheduled for removal.
  - If it's *close but not quite right*, prefer **extending it** over
    duplicating.
  - If it has a bug or limitation that would affect reuse, **surface
    the tradeoff** to the user before either reusing or duplicating.

### Step 4 — Check partner modules (when relevant)

If a partner module solves an analogous problem, study how they did it
and stay close to that pattern — even if it isn't the pattern you'd
choose from a blank slate.

### Step 5 — Propose before writing

Briefly state:

- Files you intend to touch (and module category for each)
- Reusable code you'll consume (with paths)
- New code you'll introduce (and why a reusable option didn't fit)
- Anything you intentionally chose *not* to do, and why

For small changes (≤1 file, ≤30 lines), a 2-line proposal is enough.
For larger changes, pair with the `pr-sizing` skill.

### Step 6 — Then code

Only after the proposal is implicit-or-explicit-approved.

## Rules

- **Never** write a new utility without first searching for an
  existing one. "Three is a pattern" — if you find two or more similar
  shapes, extract or reuse.
- **Never** modify a partner module without flagging it.
- **Never** consume a shared utility you found a bug in without
  telling the user.
- **Always** state the module category for files you intend to change.
- **Always** prefer extending existing code over duplicating it.
- **Don't** boil the ocean. Investigation is bounded by the change
  scope, not the whole codebase.

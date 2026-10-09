---
name: kai-core-pulse-digest
description: "Use when an explicitly requested weekly synthesis needs source weighting, narratable structure, coverage accounting, and private report output."
tools: [read, execute, search]
---

# Pulse digest

Produce the smallest evidence-backed weekly synthesis that serves the operator.
The workflow supplies source adapters and a validated typed report target.

## Source classes

- messages and decisions;
- documents;
- code history;
- external issues;
- schema-5 hierarchy reads from
  `.kai/core/runtime/coordination.sqlite`.

Filter at the source when possible. Record source, window, freshness, count,
authorization gaps, and unreadable segments. Never treat an unreadable source
as empty.

SQLite is the **only coordination authority**. Status and messages inform the
digest; the digest never changes them.

## Weighting

Weight by consequence, operator relevance, novelty, evidence quality, and
recency. Most activity should be compressed or omitted.

Deduplicate records that describe the same event. Separate:

- fact;
- interpretation;
- recommendation;
- unknown.

## Output shape

Use only justified pages:

1. `brief.md` — narratable prose, about a five-minute maximum read.
2. `sources.md` — counts, freshness, and gaps.
3. `details.md` — optional deeper decisions, documents, code, and hierarchy.
4. `visibility.md` — optional observations based only on operator-supplied
   context for this run.

Page 1 contains no raw IDs, tables, or URL lists. It names people and topics in
words and does not strengthen source certainty.

The owning workflow writes these files under its validated private core report
`drafts/` directory and stores sensitive extracts in `evidence/`. This skill
does not choose or create a root. Publication requires a later exact-revision
acceptance decision.

## Hard boundaries

- Never message, react, approve, grant, reprioritize, commit, merge, publish, or
  deploy.
- Never create a reusable personal profile from weekly evidence.
- Never draft public social copy automatically.
- Never create or maintain a Markdown board, backlog, milestone, thread, Task,
  or hierarchy log.
- Missing optional context removes the optional page; it does not authorize
  invention.

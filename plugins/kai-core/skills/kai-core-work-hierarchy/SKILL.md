---
name: kai-core-work-hierarchy
description: "Use when reading, proposing, or validating coordinated Epic, Feature, Requirement, or Task structure."
tools: [read, execute, search]
---

# Work hierarchy

`docs/kai/DIRECTION.md` is the root contract for coordinated work:

```markdown
# Vision

<enduring destination>

# Mission

<who the repository serves and why>

# Current Goal

<one observable, time-bounded Current Goal>

# Out of Scope

- <explicit exclusion>
```

One Current Goal may have several Epics. The hierarchy is:

```text
Current Goal
└─ Epic
   └─ <pack> Feature
      └─ Requirement
         └─ Task
```

SQLite at `.kai/core/runtime/coordination.sqlite` is the **only coordination
authority**. Use `node "<kai-plugin>/scripts/coordinate.mjs" detail|context|status|plan`
with typed `--kind` and `--id` selectors. Markdown contains Direction and
accepted knowledge, never a manually maintained coordination record.

## Record meanings

Epic, Feature, and Requirement records carry:

```yaml
owner: <concrete role | operator>
scope_authority: <concrete role | operator>
completion_authority: <concrete role | operator>
priority: <non-negative integer>
outcome: <observable outcome>
acceptance: [<verifiable criterion>]
hold: null | <structured hold>
```

The owner keeps the record current. Scope authority approves purpose, boundary,
and priority. Completion authority accepts the exact outcome.

- **Epic** — one cross-pack outcome slice that advances the current Goal. It
  binds the exact Direction path, SHA-256 hash, and Goal text.
- **Feature** — one `core`, `engineering`, or `creative` outcome under exactly
  one Epic.
- **Requirement** — one verifiable obligation under exactly one same-pack
  Feature.
- **Task** — executable leased work under exactly one Feature, satisfying one
  or more Requirements in that Feature.

Epic, Feature, and Requirement share `proposed -> active -> completed`.
Completion dispositions are `achieved`, `delivered`, or `satisfied`, plus
truthful `cancelled` and `superseded` outcomes.

## Relationship invariants

1. Every Feature has exactly one Epic.
2. Every Requirement has exactly one Feature.
3. Every coordinated Task has exactly one Feature and non-empty `satisfies[]`.
4. Task `satisfies[]` entries belong to the same Feature and pack.
5. Required and optional child lists are disjoint and duplicate-free.
6. Requirement-to-Task links are bidirectionally consistent.
7. Cross-pack outcome dependencies exist only between Features.
8. Task execution dependencies may cross packs only inside one Epic.
9. Composition and dependency graphs reject cycles.
10. Hierarchy records are never deleted; obsolete scope completes as cancelled
    or superseded with authority and rationale.

Any role may make a suggestion in conversation. A suggestion remains
**conversational** until a **named authority** approves a durable proposal.
Role installation, confidence, or urgency never creates authority.

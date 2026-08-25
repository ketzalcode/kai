# Library

Durable, cross-initiative outcomes that another effort can intentionally
reuse. Not a general output folder. Full contract: `kai-core-workspace-conventions`
(routing) and the promotion rule below.

## Flow (one-way)

```text
.kai/runs/ -> kai/initiatives/<slug>/artifacts/ -> kai/library/<type>/
```

1. Initiative work defaults to its own `artifacts/` tree.
2. Agents never write directly here merely because a destination is unclear.
3. Promotion is **steward-approved** and recorded in the source initiative's
   `deliverables.md`.
4. A promoted entry records source initiative, source artifact, owner, and
   evidence provenance.
5. After promotion the library path is canonical for cross-initiative use; the
   initiative copy remains read-only provenance.
6. A new conclusion creates a new entry or revision — never silently overwrites
   a promoted record.

## Types

Type lanes (`reviews/`, `dev-designs/`, …) are created by the agent that first
writes into them — an absent lane is normal, not a defect, and never blocks
work.

| Outcome | Destination |
|---|---|
| Document review | `reviews/` |
| Engineering or architecture decision | `dev-designs/` |
| Product/strategy investigation, or sanitized unaffiliated incident record | `investigations/` |
| AI landscape briefing | `briefings/` |
| Promoted QA/persona finding | `qa-findings/` |
| Team-shareable lesson | `lessons/` |
| Weekly digest | `digests/` |
| Atomic reusable learning | `learnings/` |
| Release record | `releases/` |
| Reusable procedure | `playbooks/` |
| Reusable content pack | `content/` |

A sanitized unaffiliated incident closure record uses
`investigations/<incident-id>/incident-record.md` — the explicit exception to
initiative-first promotion, since emergency command may have no initiative.
The raw incident dossier still remains in `.kai/runs/`.

## Required frontmatter

```yaml
---
type: <library type>
title: <human title>
slug: <kebab-slug>
created: <YYYY-MM-DD>
source: <agent + source path>
target: <feature, document, repository, or URL>
initiative: <slug or null>
source_artifact: <initiative artifact path or null>
related: []
evidence:
  - path: <exact workspace-root-relative path>
    source: <tool/site/reviewer>
---
```

## Commit rules

Textual entries are committed under `corpus_visibility: committed` (this
workspace) — they are ignored instead, alongside the rest of `kai/`, under
`corpus_visibility: local`. Heavy binaries stay ignored even here regardless of
visibility: `*.mp3`, `*.har`, `*.zip`, `audio/`, `raw/`, and `screenshots/`.

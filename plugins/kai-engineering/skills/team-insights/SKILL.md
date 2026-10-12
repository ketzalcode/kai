---
name: team-insights
description: "Use when the operator explicitly asks Kai to extract repository-specific guidance from selected team PR comments, reviews, or documents."
tools: [execute, read, edit, search, web, ask_user]
user-invocable: true
argument-hint: "PR, review, document, or team feedback and optional target repository"
---

# Team Insights

Extract candidate guidance from operator-selected team evidence for one target.
Team feedback is evidence, not automatic authority.

## Bind the target

Apply `kai-core-workspace-paths`. Resolve the canonical project that owns the
selected PR, review, document, or comment independently of the session root.
Discover its bound workspace from that target and require exactly one matching
manifest project ID.

If source ownership or target identity is ambiguous, ask once. If no valid
current workspace exists, stop and route explicit onboarding.

Write only to:

```text
<workspace-root>/.kai/engineering/insights/<project-id>/team-insights.md
```

Create the package-owned insight directory only for this explicit write.

## Extract

Read only the selected evidence and enough target context to understand it.
Record durable patterns, not every comment:

```markdown
## YYYY-MM-DD — short title

- Scope: repository | area/path | task kind
- Guidance: one or two actionable sentences
- Why: recurring expectation or failure the guidance addresses
- Source: stable PR URL, review reference, or repository-relative document
- Status: candidate
```

Prefer a stable citation and short paraphrase over copied discussion. Merge
equivalent candidates and retain conflicting evidence for refinement.

## Boundaries

- Never scan PRs, comments, chat, or documents automatically.
- One review opinion does not become a repository convention by itself.
- Current repository instructions, accepted decisions, and code evidence
  outrank an isolated comment.
- Keep secrets, personal data, private conversation, and copied source code out
  of the durable file.
- Do not edit `profile.md`; `refine-insights` owns promotion.
- Do not create or modify a skill from team evidence.

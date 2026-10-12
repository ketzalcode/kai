---
name: my-insights
description: "Use when the operator explicitly asks Kai to remember a correction, preference, or working pattern for one target repository."
tools: [execute, read, edit, search, ask_user]
user-invocable: true
argument-hint: "insight to remember and optional target repository"
---

# My Insights

Capture one operator-provided adjustment as durable evidence for one target.
This is a manual write path, not background reflection.

## Bind the target

Apply `kai-core-workspace-paths`. Resolve the canonical repository or project
named by the operator independently of the directory where the session
started. Discover its bound workspace from that target and require exactly one
matching manifest project ID.

If the target is ambiguous, ask once. If it has no valid current workspace,
stop and route explicit onboarding; never create an unbound `.kai/` tree.

Write only to:

```text
<workspace-root>/.kai/engineering/insights/<project-id>/my-insights.md
```

Create the package-owned insight directory only for this explicit write.

## Capture

Read the target's applicable `AGENTS.md`, active profile, and existing operator
insights. Preserve the operator's meaning in one concise candidate:

```markdown
## YYYY-MM-DD — short title

- Scope: repository | area/path | task kind
- Guidance: one or two actionable sentences
- Why: brief reason or observed failure
- Source: operator correction in the current session
- Status: candidate
```

Append a new candidate. When an equivalent entry exists, add evidence there
instead of duplicating it. Record and surface conflicts with repository
instructions or active profile guidance; never silently replace them.

## Boundaries

- Capture only an explicit request to remember or adapt. Do not inspect
  ordinary tasks for possible lessons.
- Keep task status, temporary workarounds, secrets, personal data, and copied
  source code out of the file.
- Use the narrowest useful scope. Repository-specific guidance is not a global
  Kai default.
- Do not edit `profile.md`; `refine-insights` owns promotion.
- Do not create or modify a skill from an insight.

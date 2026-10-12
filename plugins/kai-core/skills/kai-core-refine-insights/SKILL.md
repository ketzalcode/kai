---
name: kai-core-refine-insights
description: "Use when the operator explicitly asks Kai to reconcile workspace insight candidates into the compact profile used for future work in that repository."
tools: [execute, read, edit, search, ask_user]
user-invocable: true
argument-hint: "optional target repository or insight area to refine"
---

# Refine Insights

Turn reviewed workspace evidence into a small active profile. This is the only
insight skill that changes the normal read path.

## Bind and read

Apply `kai-core-workspace-paths`. Resolve the named target independently of the
session root, then require its valid workspace and exact manifest project ID.
Read:

```text
<workspace-root>/.kai/core/insights/<project-id>/profile.md
<workspace-root>/.kai/core/insights/<project-id>/my-insights.md
<workspace-root>/.kai/core/insights/<project-id>/team-insights.md
```

Missing files mean no evidence from that source. Read the target's applicable
`AGENTS.md` and only enough repository evidence to validate candidates. Do not
broaden refinement into a repository, history, PR, or document scan.

## Decide

A profile rule must be durable, actionable, narrowly scoped, and supported.
Promote an operator correction when it clearly states an ongoing expectation.
Promote team-derived guidance only when repository instructions, accepted
decisions, repeated evidence, or current code conventions support it.

Leave pending or decline one-off facts, temporary workarounds, unclear scope,
isolated opinions contradicted by repository authority, redundant instructions,
secrets, or personal data.

The current request and target `AGENTS.md` outrank the profile. Surface
conflicts and show the exact add, change, or removal. Obtain operator approval
before changing `profile.md`; invocation alone does not approve an unseen
interpretation.

## Maintain the profile

Create `profile.md` only after approval. Keep it under roughly 100 substantive
lines so normal work can read it once without reflection or discovery. Use only
relevant, non-empty sections:

```markdown
# Workspace profile

Applied only to this manifest project binding.

## Architecture
- **Guidance.** Scope: ... Sources: ...

## Implementation
## Testing
## Review and delivery
## Communication
```

Update candidate statuses to `adopted`, `declined`, or `superseded` after the
approved edit. Never turn candidates into global Kai defaults, edit another
project binding, create or modify a skill, or add a background learning loop.

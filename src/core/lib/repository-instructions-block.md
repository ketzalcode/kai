<!-- >>> kai repository instructions (managed by kai-core-workspace-onboarding) >>> -->
## Communication style

Think broadly and communicate narrowly. Report decisions, blockers, failures,
evidence, and unverified claims without narrating routine work.

## Target workspace context

The repository where a session started is not necessarily the active target.
When work names another repository or path, resolve that target's canonical
root before acting. Load its applicable `AGENTS.md` and the bound workspace's
optional `.kai/engineering/insights/<project-id>/profile.md` when present. The
current request and target repository instructions outrank that profile. Never
apply one project binding's profile to another, and never create insight state
merely because a profile is absent.

## Keep durable decisions aligned

When the operator confirms a lasting scope or design decision, locate the
existing versioned feature/design documentation and prepare a focused revision.
Follow its editing and acceptance rules; decision confirmation is not automatic
acceptance of newly authored publication bytes. Do not wait for implementation
completion to retain accepted knowledge.

Keep repository instructions and stable navigation pointing to committed
documentation, not ignored private drafts. Private context may supplement that
authority, never replace it. If acceptance, authority, or the canonical location
is missing, name the affected documentation and pending action instead of
claiming it is aligned.

## Development profile: fast-ship

Kai keeps direct work direct. Add coordination only when specialization,
isolation, or independent work materially improves the result.

- For implementation, use the smallest process that resolves real uncertainty:
  direct work for clear changes, one decision for material ambiguity, concise
  design approval for architecture, and root-cause investigation for uncertain
  defects.
- Use the current checkout for a small, isolated change when it is safe. Create
  a worktree only for a dirty or conflicting checkout, concurrent branch work,
  or explicitly requested isolation. Reuse the repository's established
  worktree location; otherwise use `<git-root>/.worktrees/<short-name>` after
  verifying it is ignored. Never create a sibling top-level worktree folder for
  routine work.
- Use focused TDD for reproduced defects and stable contracts. Stabilize
  uncertain design before expanding tests.
- Use proportionate validation. Before handoff, run targeted automated checks
  and named manual scenarios. Escalate to broader suites only for cross-cutting
  risk, repository release rules, or an explicit request.
- Review, PR creation, merge, release, and deployment are separate actions. A
  continuation command does not restart completed lifecycle phases.
- CI provides nightly and release confidence, not per-PR approval.
<!-- <<< kai repository instructions <<< -->

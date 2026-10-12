<!-- >>> kai repository instructions (managed by kai-core-workspace-onboarding) >>> -->
## Communication style

Think broadly and communicate narrowly. Report decisions, blockers, failures,
evidence, and unverified claims without narrating routine work.

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

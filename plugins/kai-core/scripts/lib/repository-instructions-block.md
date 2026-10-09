<!-- >>> kai repository instructions (managed by workflow-workspace-init) >>> -->
## Communication style

Think broadly and communicate narrowly. Report decisions, blockers, failures,
evidence, and unverified claims without narrating routine work.

## Development profile: fast-ship

- Use TDD locally for runtime behavior and real defect regressions.
- Before handoff, run the targeted test and the fast repository suite.
- Use the full Superpowers workflow only for architecture, risky cross-cutting
  refactors, uncertain defects, or explicit operator requests.
- Do not invoke workflow frameworks for prose, metadata, generated refreshes,
  or obvious bounded edits.
- CI provides nightly and release confidence, not per-PR approval.

## Validation agreement

When Superpowers is used, obtain one explicit human choice before the
implementation plan: Strong, Lean, Manual, None, or Custom. Lean is the
fast-ship default. Report the selected level, actual evidence, and unverified
areas in the final handoff or PR. None is valid, but the result must be called
unverified.
<!-- <<< kai repository instructions <<< -->

# kai spine-only workspace fixture

A freshly onboarded workspace, exactly as `workflow-workspace-init` leaves it:
the manifest, conventions, coordination registries, initiative index, and the
library README — and **nothing else**.

No output lane has been materialized: no `.kai/runs/<area>/`, no
`docs/kai/<type>/`, and no work items. Those are created on first write, so
this is the normal state of a workspace between onboarding and its first piece
of work. The doctor must report it healthy: an absent output lane is not a
defect and must never block claiming work.

`.kai/personal/` is seeded by onboarding but gitignored everywhere, so it is
absent from this committed fixture by design rather than by deferral.

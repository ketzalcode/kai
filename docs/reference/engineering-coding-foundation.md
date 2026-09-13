# Engineering coding foundation

The engineering coding foundation keeps five active skills available while
their contracts are refined one at a time. It is not a single mandatory
workflow: callers load the skill that fits the task, and each skill stays
within its own responsibility.

## Current task-local status

| Skill | Responsibility | Status in this revision |
| --- | --- | --- |
| `coding-style` | Supplies implementation conventions within already-authorized code work. | Source and caller contracts corrected; candidate handoffs showed non-regression, and the combined code boundary preserved the specified contract. |
| `research-before-coding` | Supplies bounded change research when its trigger applies. | Existing body retained; refinement is later work. |
| `onboard-to-codebase` | Supports explicit repository orientation. | Existing body retained; refinement is later work. |
| `pr-sizing` | Supports delivery decomposition. | Existing body retained; refinement is later work. |
| `build-diagrams` | Supports an optional technical representation. | Existing body retained; refinement is later work. |

The ten document-review skills and their dependent workflow remain incubated,
outside the active plugin surface. Their incubation does not waive formal
security, privacy, reliability, or release requirements.

## Coding-style contract

`coding-style` is a small context provider:

- Explicit user requirements and repository conventions take precedence.
- Its defaults cover readable implementations, useful names and errors,
  genuine composition, and proportionate comments and documentation.
- It does not invoke another skill, create an approval gate, require a report,
  or take implementation ownership away from the caller.
- It does not impose file-reading quotas or repository-wide comment limits.
- The calling implementer continues the code task it was authorized to
  perform.

The source guard rejects the former nonexistent skill reference, process-skill
dependency, fixed quota wording, stale description, and conflicting caller
clauses. In the authoring screen, all five candidate handoffs met the same case
that all five controls and all five former-guide samples had already met. This
is non-regression, not a measured behavior improvement. One combined code
boundary preserved the supplied repository contract and caller authorization.

See
[Coding foundation authoring evidence](skill-evaluation/coding-foundation-authoring.md)
for the source-contract regression, exact sanitized outputs, boundary
assertions, and evidence limits.

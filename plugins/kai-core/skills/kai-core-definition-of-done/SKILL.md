---
name: kai-core-definition-of-done
description: "Use when deciding whether implementation, review, evidence, publication, release readiness, or coordinated closure is complete."
tools: [read, execute, search]
---

# Definition of Done

Done is an evidence-backed claim against the authorized acceptance criteria,
not a synonym for code written, document drafted, review requested, or artifact
published.

Direct single-shot work needs no workspace, database, Task, lease, or report
tree. Coordinated completion uses SQLite at
`.kai/core/runtime/coordination.sqlite` as the **only coordination authority**.

## Six dimensions

| Dimension | Required evidence |
| --- | --- |
| Outcome | The authorized outcome and every acceptance criterion are satisfied. |
| Quality | Targeted tests, checks, and independent reviews are current for the exact revision. |
| Safety | Security, privacy/compliance, reliability, rollback, and production risks are resolved or explicitly accepted by authority. |
| Product and design | User-facing behavior has exact-revision acceptance from the declared independent authority. |
| Publication | Every owed durable artifact followed its owning pack vocabulary, exact accepted hash, provenance, mirrored destination, and private cleanup. |
| Coordination | Task lifecycle, evidence, questions, handoff, reviews, lease, and next action are truthful in SQLite. |

## Review gates

Use `review.record` and `approval.record` against the immutable `change_ref`.
A changed revision invalidates stale review.

Typical independent roles include:

- `eng-reviewer-code`
- `eng-reviewer-quality`
- `eng-reviewer-security`
- `eng-reviewer-reliability`
- `eng-reviewer-privacy-compliance`
- `creative-lead-design` only when it did not produce the artifact being
  accepted

Findings belong to the reviewer. Remediation belongs to the producer or a
separately granted implementer. Waivers name scope, authority, expiry or review
condition, and residual risk.

## User-facing design

For net-new or materially changed UI, require current product/design acceptance
from the Task's declared `completion_authority`. The producing designer cannot
accept its own design. Screenshots, mocks, or a successful render are evidence,
not authority.

## Delivery classes

- **Knowledge:** completion requires accepted content, current evidence, and
  any owed publication.
- **Product or operational:** completion additionally requires release
  readiness, operator-controlled deployment, production verification, rollback
  readiness, and truthful terminal state.

Kai never deploys by implication. A role may prepare commands and evidence, but
only the operator or explicitly authorized host performs irreversible or
production actions.

## Hard rules

- Never declare done with failing, missing, stale, or unobserved required
  evidence.
- Never substitute a handoff, export, Markdown log, or status summary for a
  runtime transition.
- Never publish scratch, private evidence, an unaccepted draft, or an arbitrary
  destination.
- Never hide unresolved risk behind "follow-up" without named ownership and
  authority.
- If completion cannot be proved, state the exact gap and next authorized
  action.

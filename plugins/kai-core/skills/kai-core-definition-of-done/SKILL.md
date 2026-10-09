---
name: kai-core-definition-of-done
description: "Use when deciding whether implementation, review, evidence, publication, release readiness, or coordinated closure is complete."
tools: [read, execute, search]
---

# Definition of Done

Done is an evidence-backed claim against the authorized acceptance criteria,
not a synonym for code written, document drafted, review requested, or artifact
published.

Direct single-shot work needs no workspace, Direction, database, hierarchy
record, lease, or report tree. Coordinated completion uses SQLite at
`.kai/core/runtime/coordination.sqlite` as the **only coordination authority**.

## Six dimensions

| Dimension | Required evidence |
| --- | --- |
| Outcome | The authorized outcome and every acceptance criterion are satisfied. |
| Quality | Targeted tests, checks, and independent reviews are current for the exact revision. |
| Safety | Security, privacy/compliance, reliability, rollback, and production risks are resolved or explicitly accepted by authority. |
| Product and design | User-facing behavior has exact-revision acceptance from the declared independent authority. |
| Publication | Every owed durable artifact followed its owning pack vocabulary, exact accepted hash, provenance, mirrored destination, and private cleanup. |
| Coordination | Task lifecycle, evidence, questions, handoff, reviews, lease, parent roll-up, and next action are truthful in SQLite. |

## Review gates

Use `review.record` and `approval.record` against the immutable `change_ref` or
parent closure criteria reference. A changed revision invalidates stale review.

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

## Hierarchy closure

Task completion can make a Requirement eligible for `satisfied`; Requirement
completion can make a Feature eligible for `delivered`; Feature completion can
make an Epic eligible for `achieved`. Child completion never auto-closes a
parent. Each parent completion authority accepts an exact criteria reference
containing required child IDs and versions.

Optional children do not block closure. Cancelled or superseded required
children require an authority-approved required-child change; they do not count
as delivered work.

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

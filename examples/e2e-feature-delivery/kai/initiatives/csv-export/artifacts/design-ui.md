# Design — export control on the report view

Owner: `principal-product-designer`. Bound to item `csv-export-ui`.
Approved before implementation; the design-conformance review at `9b2d017`
checks the built surface against this document.

This is a **net-new user-facing surface**, so the `definition-of-done` design
sign-off sub-gate fires from the diff whether or not anyone remembered to add
the designer to `review_requirements`.

## Placement

The export control sits in the report header's existing action group, after the
existing actions. It is a secondary action, not a primary one: exporting is a
side errand, not the reason the user opened the report. It does not get its own
toolbar, banner, or empty-state promotion.

## States

| State | What the user sees |
| --- | --- |
| Idle | Enabled secondary action, label `Export CSV`. |
| In flight | Disabled control, inline progress with a real row count. |
| Failed | Inline error in the same slot, with a retry affordance. |
| Done | Browser download starts; the control returns to Idle. |

**Progress is honest.** It reflects rows the server has actually streamed, not a
timed animation. A spinner that invents progress was rejected — a 1M-row export
is slow enough that a fake bar reads as a hang.

**Failure is persistent.** The error stays in place until the user retries or
navigates away. A toast was rejected: a long export often finishes while the
user is looking elsewhere, and a vanished failure is indistinguishable from a
success.

## Tokens

Uses the existing secondary-action, inline-progress, and inline-error tokens.
No new token, color, or spacing value is introduced. This is what makes the
conformance review a check rather than a negotiation.

## Out of scope

Export history, a downloads tray, and scheduling. Scheduling is tracked as the
proposed item `csv-export-scheduling`.

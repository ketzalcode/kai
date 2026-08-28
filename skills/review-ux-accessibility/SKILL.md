---
name: review-ux-accessibility
description: "UX and accessibility review lens. Use when a user-facing UI doc needs flows, states, edge cases, keyboard, focus, screen-reader, contrast, or motion review."
tools: [execute, read, search, web]
---

# Review: UX & Accessibility

This is the **UX-and-accessibility lens**. It tests whether a doc that
proposes a user-facing surface has actually designed the *experience* —
including the states and users the happy-path mockup forgets.

Inherits **`doc-review-rigor`** — extract load-bearing claims, ground
each, classify, run the two value filters. This skill adds *what to hunt
for* in user experience and accessibility.

> Scope note: this lens reviews UX/a11y *as argued in a document*. It is
> not a usability test or a full accessibility audit of a live build —
> for that, the surface goes to `principal-qa-ui` /
> `persona-ux-first-time-user` and a real a11y audit. Here the finding
> is whether the design accounts for these things.

## When this lens applies

Docs proposing a UI, a user-facing flow, an onboarding, a form, a
notification, or any change a person directly interacts with.

**Skip** for backend/infra/data docs with no human-facing surface.

## What's load-bearing here

**UX:**

- **The primary flow, end to end.** Is the main task designed from
  entry to completion, or just a hero screen? Where does the user start,
  and how do they know they succeeded?
- **The non-happy states.** Hunt specifically for the states the doc
  skips: **empty** (no data yet), **loading** (slow network), **error**
  (it failed — is the message actionable?), **partial**, **offline**,
  and **edge content** (very long text, zero items, huge lists).
- **First-time vs returning.** Does a new user understand it with no
  context? Is there unexplained jargon or an assumed mental model?
- **Reversibility / safety of user actions.** Destructive actions — is
  there confirmation or undo? Can a user dig themselves into a hole?
- **The "intuitive / simple" assurance.** Per rigor, test it. "Users
  will find it obvious" is a claim — grounded in a test, a precedent, or
  hope?

**Accessibility:**

- **Keyboard operability.** Can the whole flow be done without a mouse?
  Is focus order and visible focus considered?
- **Screen-reader semantics.** Are elements real semantic controls
  (labels, roles, names), or is it div-soup that reads as nothing?
- **Contrast & visual.** Is color contrast adequate, and is color not
  the *only* signal (error shown by more than red)?
- **Target size & motion.** Are touch targets reasonable? Is motion/
  animation safe (respects reduced-motion; no seizure risk)?
- **A11y designed in, not deferred.** Is accessibility part of the
  design, or a "we'll add a11y later" line (which means it won't get
  done)?

## Common failure patterns

- **Happy-path-only design.** No empty/error/loading states described →
  **Dropped** states; name the missing ones.
- **Actionless error.** "Show an error" with no thought to what it says
  or how the user recovers → finding.
- **Unsupported "intuitive."** UX-quality claim with no grounding →
  **Unproven**.
- **A11y deferred.** "Accessibility in a follow-up" → **Dropped** (call
  out that retrofitting a11y is far costlier and often skipped).
- **Keyboard/SR gap.** A custom interactive control with no keyboard or
  screen-reader story → **Unproven** / likely inaccessible.
- **Color-only signal.** Status conveyed by color alone → flag.

## Mapping to the taxonomy

- A UX/a11y aspect you verified is designed and sound → **Holds**.
- A UX-quality or accessibility claim with no grounding → **Unproven**.
- A "users will find this easy" presented as fact → **Inference**.
- A claim contradicted by the described design (says accessible, control
  has no keyboard path) → **Contradicted**.
- A state, edge case, or a11y need raised then dropped → **Dropped**.

## Anti-patterns for this lens

- ❌ Bikeshedding visual taste (color, spacing, copy voice) — that's
  phrasing; let it slide unless it changes whether the user succeeds.
- ❌ Demanding a full WCAG audit of a doc. Flag whether a11y is
  *accounted for*; the live audit is a separate run.
- ❌ Inventing edge cases that can't occur in this surface. Match to the
  real flow.

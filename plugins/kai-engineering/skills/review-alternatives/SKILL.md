---
name: review-alternatives
description: "Alternatives review lens. Use when a doc must justify the chosen option against tradeoffs, missing options, do-nothing, buy/build, or smaller steps."
tools: [execute, read, search, web]
---

# Review: Alternatives

This is the **alternatives lens**. A decision is only as trustworthy as
the options it beat. This lens tests whether the doc actually compared
real alternatives or just narrated the one it had already chosen.

Inherits **`doc-review-rigor`** — extract load-bearing claims, ground
each, classify, run the two value filters. This skill adds *what to
hunt for* in how options were weighed.

## When this lens applies

Most design docs, RFCs, technical-direction docs, and PRDs that propose
a specific approach. The higher the cost or the harder to reverse, the
more this lens matters.

**Skip** for docs that aren't choosing between approaches (a status
update, a pure problem write-up with no proposal yet).

## What's load-bearing here

- **The option set.** Which alternatives were genuinely considered? A
  doc that presents exactly one option has not made a decision — it has
  announced one.
- **The selection reason.** *Why* this one over the others? The reason
  must be a real trade-off ("we chose A because it's simpler to operate,
  accepting higher cost"), not a dismissal ("B wouldn't work" with no
  grounding).
- **The trade-off comparison.** Is there an honest matrix — what each
  option costs and buys on the axes that matter (effort, risk,
  latency, operability, lock-in)? Or are the rejected options
  strawmanned?
- **The obvious missing alternatives.** Hunt specifically for:
  - **compose vs build** — is there an existing <publication-root>/service/internal
    component that already does this?
  - **buy vs build** — was a vendor/managed option weighed?
  - **defer to platform** — should this live one layer down (the
    framework, the platform team) instead of here?
  - **do nothing / smaller first step** — was the cheapest viable
    version (or not building yet) on the table?
- **Reversibility of the choice.** Is this a one-way door? If so, the
  bar for having considered alternatives is much higher.

## Common failure patterns

- **The straw-man comparison.** Rejected options described unfairly to
  make the chosen one win → the dismissal of an alternative is
  **Contradicted** or **Inference** (ground what the alternative
  actually does).
- **The single-option doc.** No alternatives section at all → finding
  that the selection reason is **Unproven**.
- **"We considered X but it doesn't scale / isn't secure"** with no
  evidence → **Unproven** until grounded.
- **Reinventing an existing component.** The doc builds what a library
  or internal service already provides → **Contradicted** (cite the
  existing thing).
- **Dropped alternative.** An option raised early ("we could also…")
  then never resolved in the conclusion → **Dropped**.

## Mapping to the taxonomy

- A trade-off comparison you verified is fair and complete → **Holds**.
- A "we picked A because B can't do X" with no grounding → **Unproven**.
- A selection reason that's a reasonable but unproven judgment call →
  **Inference**.
- A dismissal of an alternative that the facts disprove → **Contradicted**.
- An option raised then silently abandoned → **Dropped**.

## Anti-patterns for this lens

- ❌ Demanding an exhaustive option matrix for a trivial, reversible
  choice. Match the rigor to the cost of being wrong.
- ❌ Inventing alternatives that don't fit the constraints just to look
  thorough. A missing alternative is only a finding if it's *viable*.
- ❌ Substituting your favorite approach as "the obvious one they
  missed" without grounding that it actually fits.

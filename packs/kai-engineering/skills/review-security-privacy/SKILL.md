---
name: review-security-privacy
description: "Security and privacy review lens. Use when a doc touches data, auth, PII, secrets, trust boundaries, threat surface, or external sharing."
tools: [execute, read, search, web]
---

# Review: Security & Privacy

This is the **security-and-privacy lens**. It tests whether the design
respects trust boundaries and handles data responsibly — and whether
the doc's safety assurances survive scrutiny.

Inherits **`doc-review-rigor`** — extract load-bearing claims, ground
each, classify, run the two value filters. This skill adds *what to hunt
for* in the security and privacy posture.

> Scope note: this lens flags **review-worthy** security and privacy
> concerns in a *document*. It is not a penetration test, a formal
> threat model, or a compliance sign-off. When the stakes warrant it,
> the finding is "this needs a real security review," not "I cleared
> it."

## When this lens applies

Any doc that touches: user data, authentication or authorization,
secrets/credentials, an external trust boundary (a new endpoint,
third-party integration, webhook), PII or regulated data, or a change
to who-can-access-what.

**Skip** for docs with no data or trust-boundary surface (a pure
internal refactor, a docs reorg).

## What's load-bearing here

- **Data inventory.** What data does this collect, store, transmit, or
  log? Is any of it PII, secrets, or regulated? A design that never
  states its data footprint can't be reasoned about.
- **Data minimization.** Is it collecting/retaining more than the job
  needs? Is there a retention/deletion story, or does data accumulate
  forever?
- **AuthN / AuthZ.** Who can call this, and how is that enforced? Watch
  for: a new endpoint with unstated auth, an authorization check
  assumed but not designed, privilege that's broader than needed.
- **Secrets handling.** Are credentials/keys/tokens stored and passed
  safely (a secret store, not config or code)? Any secret in a log,
  URL, or client is a finding.
- **Trust boundaries.** Where does untrusted input enter? Is it
  validated/escaped? Is a third party being trusted with data it
  shouldn't see?
- **Logging/telemetry leakage.** Does the proposed logging capture PII,
  tokens, or full request bodies?
- **The "it's secure / handled" assurance.** Per rigor, hit these
  hardest. "Auth is handled by the gateway," "we sanitize inputs" —
  verify against the code or call it Unproven.

## Common failure patterns

- **Unstated auth on a new surface.** A new endpoint/job with no
  described authn/authz → **Unproven** (and likely a real gap).
- **PII in logs/telemetry.** The observability plan logs user data →
  **Contradicted** if it claims privacy-safe; otherwise a Dropped
  consideration.
- **Secret in the wrong place.** Token in a query string, key in client
  bundle, credential in config committed to the repo → **Contradicted**.
- **Over-broad trust.** Sending more data to a third party / another
  service than the integration needs → minimization finding.
- **"We sanitize inputs" unverified.** A blanket safety claim with no
  mechanism → **Unproven**; name the injection surface.
- **No retention/deletion story** for collected PII → **Dropped**.

## Mapping to the taxonomy

- A data-handling/auth claim you verified is correct → **Holds**.
- A safety property asserted but not designed or verifiable → **Unproven**.
- A "this is safe because…" that's a plausible but unproven judgment →
  **Inference**.
- A claim the code/config disproves (secret leaked, auth missing) →
  **Contradicted**.
- A privacy/security concern raised then dropped by the design →
  **Dropped**.

## Anti-patterns for this lens

- ❌ Theatrical threat modeling — listing exotic attacks irrelevant to
  the actual surface. Match threats to the real entry points.
- ❌ Asserting a vulnerability from a guess. Verify against the code, or
  classify Unproven and name what you'd check.
- ❌ Rubber-stamping "looks secure." If it's load-bearing and you can't
  verify, say so and recommend a real security review.

---
name: review-dependencies
description: "Dependencies review lens. Use when work crosses team, service, API, upstream/downstream, sign-off, breaking-change, or third-party boundaries."
tools: [bash, shell, view, grep, glob, web_search, web_fetch]
---

# Review: Coordination & Dependencies

This is the **coordination-and-dependencies lens**. Most plans slip not
on the code but on the thing someone *else* had to do. This lens tests
whether the doc sees its real dependency graph.

Inherits **`doc-review-rigor`** — extract load-bearing claims, ground
each, classify, run the two value filters. This skill adds *what to hunt
for* in cross-team and cross-system coordination.

## When this lens applies

Any doc whose work crosses a boundary: another team, another service or
repo, a shared API/schema, a third-party vendor, or an external
consumer of an interface you're changing.

**Skip** for fully self-contained work inside one owned surface with no
external consumers.

## What's load-bearing here

- **Partner teams named.** Does the doc identify the *other* humans/teams
  whose work this needs — and has anyone confirmed they're available and
  bought in? A plan that depends on an unaware team is fiction.
- **Upstream dependencies.** What does this need from systems/teams
  *before* it can proceed (an API that must ship first, a capacity
  grant, a data feed)? Are those on a real timeline, or assumed ready?
- **Downstream consumers / breaking changes.** Who consumes the
  interface, schema, or behavior being changed? Is the change
  backward-compatible, or is there a migration/deprecation path and were
  consumers notified? An unannounced breaking change is the classic
  silent failure.
- **Sign-offs / approvals.** Does anything here require a review or
  approval (security, legal, data, an API council, a design authority)?
  Is that in the plan or discovered at the worst moment?
- **External/third-party dependencies.** New vendor, library, or SaaS —
  is its reliability, rate limit, cost, and failure mode acknowledged?
  What happens when it's down or changes its API?
- **Ordering across owners.** Does the critical path run through work
  owned by someone else? That's where slips hide.
- **The "they're on board / it's compatible" assurance.** Per rigor,
  test hardest. "Team X will provide the endpoint," "this is backward
  compatible" — verify or classify Unproven.

## Common failure patterns

- **Phantom partner commitment.** "Team X will handle the API" with no
  evidence they've agreed → **Unproven** (and a schedule risk).
- **Unannounced breaking change.** A schema/contract change with
  downstream consumers and no migration or notification → **Dropped** /
  **Contradicted** (if it claims compatibility, check the contract).
- **Missing sign-off.** Work that clearly needs security/legal/data
  review with no approval step in the plan → **Dropped**.
- **Assumed-ready upstream.** A dependency treated as available with no
  confirmation or date → **Inference** / **Unproven**.
- **Unowned critical-path step.** A blocking task with no named owner →
  flag it.
- **Third-party failure ignored.** New external dependency with no
  fallback/timeout/cost consideration → **Dropped**.

## Mapping to the taxonomy

- A dependency/coordination claim you verified (the contract is
  compatible; the partner confirmed) → **Holds**.
- A partner/upstream dependency assumed but unconfirmed → **Unproven**.
- A "they'll be ready" presented as certainty → **Inference**.
- A "backward compatible" the contract/code disproves → **Contradicted**.
- A coordination need raised then dropped → **Dropped**.

## Anti-patterns for this lens

- ❌ Inventing approval gates that don't exist in this org/context.
  Flag the ones that plausibly apply; don't fabricate bureaucracy.
- ❌ Treating every shared interface as a breaking change. Check
  compatibility before classifying.
- ❌ Asserting a partner isn't on board without grounding — classify
  Unproven and name what confirmation would settle it.

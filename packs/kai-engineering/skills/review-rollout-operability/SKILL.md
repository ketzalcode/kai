---
name: review-rollout-operability
description: "Rollout and operability review lens. Use when production changes need staged rollout, rollback, kill switch, monitoring, alerts, on-call, or runbooks."
tools: [bash, shell, view, grep, glob, web_search, web_fetch]
---

# Review: Rollout & Operability

This is the **rollout-and-operability lens**. A design that's correct on
paper can still hurt in the rollout or be unrunnable once live. This lens
tests how it ships and how it's operated.

Inherits **`doc-review-rigor`** — extract load-bearing claims, ground
each, classify, run the two value filters. This skill adds *what to hunt
for* in shipping and running the thing.

> Scope note: this is a document/release lens, not formal SRE approval. New
> services/dependencies, migrations, failover/traffic changes, capacity/SLO/
> on-call changes, or materially changed blast radius may require an exact
> revision-bound `principal-sre` review.

## When this lens applies

Any doc that proposes putting something into production: a new service
or feature, a migration, a config/infra change, a data backfill, a
deprecation. The larger the blast radius, the more this lens matters.

**Skip** for docs that don't ship anything (a pure research note, an
early strategy doc with no build yet).

## What's load-bearing here

**Rollout:**

- **Staged, not big-bang.** Is there a flag / canary / percentage
  ramp / ring rollout, or does this go to 100% at once? High-blast-radius
  changes need a gradient.
- **Reversibility.** Can this be turned off or rolled back quickly? Is
  there a kill switch independent of a full redeploy? "Roll back the
  deploy" is not always a rollback if data has changed.
- **Migration safety.** For schema/data changes: is the migration
  reversible? Is it expand-then-contract (backward compatible during
  the transition), or a hard cutover? Is the backfill idempotent and
  resumable?
- **Sequencing.** Does the rollout order avoid a window where old and
  new are mutually incompatible?

**Operability:**

- **Observability.** What signals tell you it's healthy or sick — metrics,
  logs, traces? Are they specified, or assumed?
- **Alerting & on-call.** What alerts fire on failure, to whom? Who owns
  this at 3am? A feature with no owner and no alerts is operationally
  orphaned.
- **Runbook / failure response.** When it breaks, is there a documented
  response, or does the next on-call reverse-engineer it under pressure?
- **The "we can just roll it back" assurance.** Per rigor, hit hardest.
  If data has migrated or external state changed, rollback may not be
  clean. Verify the claim.

## Common failure patterns

- **Big-bang ship.** 100% rollout of a high-risk change with no ramp →
  flag the missing staging.
- **Irreversible "reversible" change.** "We can roll back" while a
  destructive migration has run → **Contradicted** (the data's gone).
- **Non-reversible migration.** A hard schema cutover with no expand/
  contract path → finding that rollback isn't actually available.
- **No kill switch.** A risky feature with no way to disable it short of
  a redeploy → **Dropped** safety control.
- **Operational orphan.** New service with no alerts, no on-call owner,
  no runbook → **Dropped**.
- **Unspecified observability.** "We'll monitor it" with no named
  signals → **Unproven**.

## Mapping to the taxonomy

- A rollout/rollback/operability plan you verified is safe and complete
  → **Holds**.
- A monitoring/rollback claim with no specifics → **Unproven**.
- A "we can roll back easily" that's plausible but unproven → **Inference**.
- A reversibility claim the migration/data flow disproves → **Contradicted**.
- A rollback or operability concern raised then dropped → **Dropped**.

## Anti-patterns for this lens

- ❌ Demanding canary infrastructure for a trivial, instantly-reversible
  flag flip. Match rigor to blast radius.
- ❌ Inventing operational requirements the org doesn't have. Flag the
  ones that plausibly apply.
- ❌ Asserting a migration is irreversible without checking — read the
  migration/data flow, or classify Unproven.

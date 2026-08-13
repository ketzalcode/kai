---
name: review-success-metrics
description: "Success metrics review lens. Use when a doc needs measurable goals, baselines, targets, instrumentation, or checks for gameable proxy metrics."
tools: [bash, shell, view, grep, glob, web_search, web_fetch]
---

# Review: Success Metrics

This is the **success-metrics lens**. It tests whether the doc can ever
know it succeeded — and whether the chosen measure actually reflects the
goal.

Inherits **`doc-review-rigor`** — extract load-bearing claims, ground
each, classify, run the two value filters. This skill adds *what to hunt
for* in how success is defined and measured.

## When this lens applies

PRDs, product specs, strategy docs, and any design doc that claims an
outcome ("reduces latency," "improves retention," "cuts cost"). If the
doc promises a result, this lens tests whether that result is
measurable.

**Skip** for pure-mechanism docs (a refactor RFC with no outcome claim)
unless they assert a benefit.

## What's load-bearing here

- **A metric exists at all.** Does the doc name how it will know it
  worked? "Users will love it" is not a metric. No measurable success
  definition for an outcome-claiming doc is itself a finding.
- **Tied to the goal.** Does the metric measure the *actual* goal, or a
  convenient proxy? A proxy that can move while the goal fails (or
  that's gameable) is worse than no metric — it manufactures false
  confidence.
- **Baseline + target.** Is there a current number and a target number?
  "Improve conversion" with no baseline can't be evaluated. "Improve
  conversion from 3.1% to 4%" can.
- **Observable.** Can the metric actually be measured with telemetry/
  instrumentation that exists or is explicitly planned in this same
  work? A metric you can't capture is **Unproven**.
- **Leading vs lagging.** For long-horizon goals, is there a leading
  indicator to read early, or does the doc only offer a metric that
  resolves months later?
- **Counter-metric / guardrail.** Does success on the primary metric
  risk harming something else (latency up while conversion up; support
  load up while signups up)? Is a guardrail named?

## Common failure patterns

- **No metric.** Outcome claimed, no measure → **Unproven**; name the
  metric that would settle it.
- **Vanity / proxy metric.** "Page views" standing in for "value
  delivered" → **Inference** (the proxy may not track the goal); name
  the gap.
- **Unmeasurable metric.** The metric requires instrumentation that
  doesn't exist and isn't in scope → **Unproven**; name what'd be
  needed.
- **No baseline.** Target with no current value → finding that the
  metric is uninterpretable.
- **Missing guardrail.** Optimizing the metric could quietly harm a
  neighbor metric the doc never mentions → **Dropped** / missing
  counter-metric.
- **Goalpost mismatch.** The metric measures something subtly different
  from the stated goal → **Inference** or **Contradicted**.

## Mapping to the taxonomy

- A metric you verified is measurable, baselined, and goal-aligned →
  **Holds**.
- An outcome with no metric, or a metric with no instrumentation →
  **Unproven**.
- A proxy metric that may not track the goal, presented as if it does →
  **Inference**.
- A metric that demonstrably measures the wrong thing → **Contradicted**.
- A guardrail/counter-metric the doc raised then dropped → **Dropped**.

## Anti-patterns for this lens

- ❌ Demanding heavy metrics for a tiny reversible change. Calibrate to
  the stakes.
- ❌ Insisting on a number when a qualitative gate is genuinely the
  right call (e.g., an early spike). Flag *only* when the doc claims a
  measurable outcome and can't measure it.
- ❌ Bikeshedding which exact metric — the finding is whether success is
  *knowable*, not your preferred KPI.

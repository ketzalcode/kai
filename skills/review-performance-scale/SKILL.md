---
name: review-performance-scale
description: "Performance and scale review lens. Use when a doc proposes a service, API, data path, latency budget, volume, concurrency, or load-sensitive work."
tools: [execute, read, search, web]
---

# Review: Performance & Scale

This is the **performance-and-scale lens**. It tests whether the design
will hold up under real load, and whether its speed/scale claims are
grounded in numbers rather than optimism.

Inherits **`doc-review-rigor`** — extract load-bearing claims, ground
each, classify, run the two value filters. This skill adds *what to hunt
for* in performance and scale.

## When this lens applies

Docs that propose a new service, API, queue, data path, batch job, or
any user-facing surface with a responsiveness expectation; or that make
a scale claim ("handles millions of X"). The hotter the path and the
larger the volume, the more this lens matters.

**Skip** for low-volume internal tooling, one-off scripts, or docs with
no performance-sensitive surface.

## What's load-bearing here

- **Latency budget.** Is there a target — and at which percentile? A
  P50 target hides the tail; real users feel P95/P99. A doc that claims
  "fast" with no number and no percentile is **Unproven**.
- **Throughput & concurrency.** Expected requests/sec, concurrent
  users, queue depth? Is the design's capacity stated and does it
  exceed the expected load with headroom?
- **Scale assumptions tied to real data.** Is "we expect N events/day"
  grounded in actual current volume (or a cited projection), or a
  round number someone liked? Ground the volume claim against real
  data where you can.
- **The hot path.** What's on the critical path of the most frequent
  operation? Synchronous calls, N+1 queries, unbounded fan-out, a
  remote call in a loop?
- **Behavior under load.** What happens when load exceeds capacity?
  Backpressure, shedding, a queue that grows unbounded, a cascading
  timeout? "It'll scale horizontally" is a claim, not a design.
- **Cold start & warmup.** For serverless / on-demand components, is
  cold-start latency in the budget?
- **Failure & retry amplification.** Do retries on timeout multiply
  load at exactly the wrong moment (retry storms)? Idempotency?
- **The "it's fast / it scales" assurance.** Per rigor, hit hardest.
  Verify against a benchmark, a back-of-envelope calculation, or the
  code path — or classify Unproven.

## Common failure patterns

- **"Fast" with no number.** Latency claim, no target, no percentile →
  **Unproven**.
- **P50-only budget.** A target that ignores the tail where users hurt
  → finding that the budget is incomplete.
- **Made-up volume.** Scale assumption with no grounding in current
  data → **Unproven** or **Inference**.
- **Synchronous hot path.** A remote/DB call per item in a high-frequency
  loop the doc treats as free → **Contradicted** (cite the cost).
- **"Scales horizontally" hand-wave.** No design for state, sharding,
  or coordination under that scaling → **Unproven**.
- **Unbounded growth.** A queue/buffer/cache with no eviction or
  backpressure under overload → **Dropped** failure mode.
- **Retry storm.** Aggressive retries with no jitter/budget that amplify
  an outage → flag it.

## Mapping to the taxonomy

- A latency/throughput claim you verified (benchmark, math, code) →
  **Holds**.
- A perf/scale claim with no number or grounding → **Unproven**.
- A "this will scale" that's plausible but unproven → **Inference**.
- A claim the code or arithmetic disproves (the hot path is O(n²),
  the volume blows the budget) → **Contradicted**.
- A load/failure mode raised then dropped → **Dropped**.

## Anti-patterns for this lens

- ❌ Premature-optimization findings on a cold, low-volume path. Match
  rigor to the real traffic.
- ❌ Demanding load tests for a reversible internal tool.
- ❌ Asserting a bottleneck from a guess — do the back-of-envelope math
  or read the code, or classify Unproven.

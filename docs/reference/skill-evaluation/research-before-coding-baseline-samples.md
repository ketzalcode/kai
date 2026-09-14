# Research-before-coding baseline samples

These are the ten sanitized handoffs from the Task 3 supplied-input research
case. Samples 01–05 had no guide. Samples 06–10 used the unchanged baseline
guide. Each ran in a fresh `gpt-5.4-mini` context at `medium` effort.

## Control 01

```text
# Research handoff

## Finding

An explicit `0` delay does not survive `delayFor`:

export function delayFor(options) {
  return options.delayMs || 100;
}

Because `0` is falsy, the function returns `100` instead of `0`. That means
the worker path never forwards a zero delay to the queue.

## Relevant behavior

- `delayFor({ delayMs: 0 })` resolves to `100`.
- `enqueueWorker(queue, config)` passes the result into `queue.next({ delayMs: ... })`.
- So a caller requesting immediate execution via `delayMs: 0` is converted to
  the default delay before the queue sees it.
- `scheduleHealthCheck(schedule, check)` calls `delayFor({ delayMs: undefined })`
  and therefore gets the default delay as intended.

## Affected callers

- `worker.mjs` is the affected call path for explicit zero delays.
- `health.mjs` is not affected by the zero-delay bug, but it confirms the same
  defaulting helper is used for absent delays.

## Unresolved facts

- Whether `100` is the correct default value everywhere this helper is used.
- Whether any other callers intentionally rely on falsy values being treated as
  defaulted delays.
- Whether the queue contract expects `0` to mean immediate execution only, or
  whether other negative / non-numeric values need separate handling.
```

## Control 02

```text
# Research handoff: explicit zero delay

## What is happening

`policy.mjs` currently computes delay with:

return options.delayMs || 100;

That treats `0` as falsey, so an explicit zero delay is replaced by the default `100` instead of being preserved.

## Relevant behavior

- `0` means immediate execution in the documented option contract.
- `undefined` means “use the default”.
- The current `||` implementation cannot distinguish those two cases.

## Affected callers

- `worker.mjs`:

  return queue.next({ delayMs: delayFor(config) });

  Any caller that passes `delayMs: 0` through `enqueueWorker` will see `100` reach the worker queue instead of `0`.

- `health.mjs`:

  return schedule(check, delayFor({ delayMs: undefined }));

  This call intentionally uses the default path and is not the source of the zero-delay bug.

## Unresolved facts

- Whether any other callers rely on `delayFor()` to preserve `0` today.
- Whether the policy helper is meant to accept only numeric delays or also tolerate other falsey inputs.
- Which component owns the documented option contract, since no ownership document was supplied.
```

## Control 03

```text
# Research handoff

## Finding

`policy.mjs` drops an explicit `0` because it uses `options.delayMs || 100`.
In JavaScript, `0` is falsy, so the function returns the default `100` instead
of preserving the requested immediate execution.

## Affected callers

- `worker.mjs` → `enqueueWorker(queue, config)` passes
  `delayFor(config)` into `queue.next({ delayMs: ... })`, so a caller that
  sets `config.delayMs = 0` will still enqueue with `100`.
- `health.mjs` → `scheduleHealthCheck(schedule, check)` passes
  `delayFor({ delayMs: undefined })`, which relies on the default path and is
  not broken by this bug.

## Relevant behavior

The documented contract says:

- `0` means request immediate execution.
- an absent delay means use the default.

The current implementation does not distinguish those cases.

## Unresolved facts

- Only the supplied evidence was available; no broader call graph was provided.
- I did not verify whether `delayFor` has additional callers outside the shown
  files.
- I did not verify whether `100` is the intended default everywhere or only for
  this policy helper.

## Likely implementation direction

Preserve `0` explicitly and only fall back on the default for `null` /
`undefined` input.
```

## Control 04

```text
# Research handoff

## Finding

The explicit zero delay is being lost in `policy.mjs`:

export function delayFor(options) {
  return options.delayMs || 100;
}

Because `0` is falsy, the function returns `100` instead of preserving the
caller’s zero value. That means “run immediately” is converted into the default
delay before the work reaches the queue.

## Affected callers

- `worker.mjs`: any worker enqueue path that passes `delayMs: 0` will enqueue
  with `100` instead of immediate execution.
- `health.mjs`: this caller explicitly uses the default path, so it is not the
  source of the zero-delay bug. It is still affected by the same helper and
  will inherit any fix to `delayFor`.

## Relevant behavior

- Zero should mean immediate execution.
- An absent delay should use the default.
- The helper currently conflates `0` with “absent.”

## Unresolved facts

- Whether `delayFor` is the only place that normalizes delay values.
- Whether any other callers pass through `0` today.
- Whether the queue API expects `0` directly or another sentinel for immediate execution.
- Whether any other falsy values besides `0` need to be preserved, or only
  `undefined` / `null` versus zero.

## Implication for implementation

The implementation teammate likely needs to change the helper so it preserves
explicit zero while still defaulting when the delay is absent. The evidence does
not show any need to change the external option contract.
```

## Control 05

```text
# Research handoff: explicit zero delay is not reaching the worker queue

## What is happening

`policy.mjs` currently uses `return options.delayMs || 100;`.

That treats `0` as falsey, so an explicit zero delay is replaced with the
default `100`. The documented contract says zero means immediate execution and
only an absent delay should use the default, so the current behavior is
inconsistent with the contract.

## Relevant behavior

- `delayFor({ delayMs: 0 })` returns `100`, not `0`.
- `delayFor({ delayMs: undefined })` also returns `100`, which matches the
  default-path intent.
- The bug is in the policy helper, not in the queue call itself.

## Affected callers

- `worker.mjs`: `enqueueWorker(queue, config)` passes `delayFor(config)` into
  `queue.next(...)`. Any caller that supplies `config.delayMs = 0` will enqueue
  with `100` instead of immediate execution.
- `health.mjs`: `scheduleHealthCheck(schedule, check)` calls
  `delayFor({ delayMs: undefined })`. This path depends on the default behavior
  and is not the failing case.

## Unresolved facts

- No ownership document was supplied, so I could not confirm which team owns
  the policy helper.
- I did not verify whether `delayFor` has additional callers beyond the two
  supplied files.
- I did not confirm whether `100` is the intended default everywhere or whether
  that value is configurable elsewhere.

## Handoff note for implementation

The fix needs to preserve the default for missing values while allowing `0` to
pass through unchanged. The current `||` check cannot do that.
```

## Current guide 06

```text
# Research handoff: zero delay is not reaching the worker queue

## Finding

The bug is in `policy.mjs`: `return options.delayMs || 100;`.

Using `||` treats `0` as falsy, so an explicit zero is replaced with `100`.
That contradicts the documented contract: zero means immediate execution,
while only an absent delay should fall back to the default.

## Affected callers

- `worker.mjs`: any `config.delayMs = 0` is converted to `100` before the
  worker queue sees it. This is the direct path for the reported failure.
- `health.mjs`: this caller intentionally passes an absent delay, so the
  default delay is expected here. It is not the zero-delay failure path, but it
  depends on the same helper.

## Relevant behavior

- Explicit zero is lost in the policy layer, before queueing.
- Absent delay currently maps to the default of `100`.
- The helper does not distinguish between “missing” and “present but zero”.

## Unresolved facts

- Whether any other callers rely on `delayFor` accepting values besides
  `number` or `undefined`.
- Whether the queue API treats `0` as immediate execution or needs a different
  sentinel.
- Whether `100` is the intended default value across all call sites or only for
  health checks.

## Handoff

Implement the policy helper so it preserves an explicit `0` while still
defaulting when the delay is absent. The evidence points to the `||` fallback
as the root cause.
```

## Current guide 07

```text
# Research handoff

## Finding

`policy.mjs` is the point where an explicit `0` delay is being lost:

return options.delayMs || 100;

Because `0` is falsy, it falls through to `100` instead of being preserved.
That means the helper cannot distinguish an explicitly requested immediate
execution from an absent delay that should use the default.

## Affected callers

- `worker.mjs`: this passes the helper result straight into the worker queue,
  so the queue never sees a true zero delay when the caller supplies one.
- `health.mjs`: this path relies on the defaulting behavior for an absent
  delay, so it is coupled to the helper’s current fallback rule.

## Behavior implied by the supplied contract

- `0` means immediate execution.
- An absent delay uses the default.

That contract is not being honored by the current helper implementation.

## Unresolved facts

- Whether only `undefined`/missing should trigger the default, or whether
  `null` and other falsy values should also default.
- Whether the worker queue and health scheduler already accept `0` as a valid
  immediate-delay value, or whether they also normalize it elsewhere.
- Whether `policy.mjs` is the only shared delay helper in scope, or whether
  other callers depend on the same falsy fallback behavior.

## Handoff

The implementation teammate should change the delay helper so explicit `0`
survives and only the absent case uses the default. The supplied evidence
supports a focused fix at the helper boundary rather than changing the callers.
```

## Current guide 08

```text
# Research handoff: explicit zero delay is lost

## Relevant behavior

`policy.mjs` currently uses `return options.delayMs || 100;`.

That means `0` is treated as falsy and replaced by the default `100`. So an
explicit zero delay cannot survive this helper.

`worker.mjs` passes the helper result straight into the worker queue, so
`enqueueWorker()` is the affected path where a caller requesting immediate
execution still ends up queued with `delayMs: 100`.

`health.mjs` calls the same helper with `delayMs: undefined`, which is
consistent with the documented defaulting behavior.

## Affected callers

- `enqueueWorker(queue, config)` in `worker.mjs` loses explicit `0` and forwards
  `100` instead.
- Any future caller of `delayFor()` will inherit the same falsy-default bug.

## Unresolved facts

- Whether the intended fix is strictly “preserve `0`, default only on absent
  values” or whether `null` should also default.
- Whether `queue.next()` has any special handling for `0` or only for positive
  delays.
- Whether `delayFor()` is used elsewhere in the repo beyond the supplied files.

## Handoff summary

The contract says zero means immediate execution and absence means use the
default. The current `|| 100` implementation violates that contract for `0`.
The implementation teammate should confirm the desired nullish semantics, then
change the helper so explicit zero reaches the queue.
```

## Current guide 09

```text
# Research handoff: explicit zero delay

## Finding

The zero-delay value is being lost in `policy.mjs` because `||` treats `0` as
falsy and converts an explicit `delayMs: 0` to `100` before it reaches the
worker queue. That conflicts with the documented contract: zero means immediate
execution, while only an absent delay should fall back to the default.

## Relevant behavior

- `delayFor` currently collapses both `0` and `undefined` to the default.
- `enqueueWorker` forwards `delayFor(config)` into
  `queue.next({ delayMs: ... })`, so worker enqueues cannot preserve zero.
- `scheduleHealthCheck` passes `delayFor({ delayMs: undefined })`, so it
  intentionally exercises the default path and is not the source of the bug.

## Affected callers

- `worker.mjs` via `enqueueWorker(queue, config)`
- Any other caller of `delayFor(options)` that expects `0` to survive unchanged

## Unresolved facts

- Whether `queue.next` has its own fallback or special handling for `0`.
- Whether any callers intentionally rely on falsy values other than
  `undefined` falling back to `100`.
- Whether the intended fix should preserve only `undefined`/missing values, or
  all nullish values.

## Handoff summary

The implementation needs to stop using a truthy check for delay selection and
preserve explicit zero all the way into the queue. The supplied evidence is
enough to localize the bug to shared policy code; no repository-wide ownership
or broader scheduling redesign is required to explain the failure.
```

## Current guide 10

```text
## Research handoff

### What is happening

The zero-delay value is being lost in `policy.mjs`:

return options.delayMs || 100;

Because `0` is falsy, this expression rewrites an explicit zero to the default
`100`. That means the worker queue never receives the requested
immediate-execution delay.

### Affected callers

- `worker.mjs`: `enqueueWorker(queue, config)` calls `delayFor(config)` and
  passes the result into `queue.next({ delayMs: ... })`. Any
  `config.delayMs === 0` is converted to `100` before queueing.
- `health.mjs`: `scheduleHealthCheck(schedule, check)` calls
  `delayFor({ delayMs: undefined })`. This path still resolves to the default
  delay and is not the source of the zero-delay bug.

### Relevant behavior

- The documented contract says `0` means execute immediately and an absent
  delay uses the default.
- The current implementation does not distinguish those two cases.

### Unresolved facts

- No evidence here shows whether `delayFor` has additional callers beyond the
  supplied snippets.
- No evidence here shows whether `queue.next(...)` or `schedule(...)` apply
  their own defaulting or special handling for `0`.
- The supplied evidence points to the policy helper as the fault line, but the
  exact fix location still depends on whether the contract should be preserved
  at the helper, at each caller, or both.
```

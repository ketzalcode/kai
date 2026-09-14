# Research-before-coding candidate v2 samples

Candidate v2 was frozen at
`45e36fd8e90998e1c937021742681ea45b462795`, with guide SHA-256
`73B9667B722067E8D8129FAFA9844507C7C10F1FDEBD905EC7A751C39CBD490E`.
Each sample used `gpt-5.4-mini` at `medium` effort in a fresh context.

The five primary samples used the unchanged
[v1 fixed primary input](research-before-coding-candidate-v1-samples.md#fixed-primary-input).

## Candidate 20

````text
## Question and scope

Why an explicit zero delay is not reaching the worker queue. This handoff covers the
current delay selection behavior, the callers shown in the supplied evidence, and the
remaining facts that matter for an implementation teammate. It does not propose a
design change or external contract change.

## Relevant local facts

- `policy.mjs` currently returns `options.delayMs || 100`.
  - That means `0` is treated as falsy and replaced with the default `100`.
  - The documented contract says zero should request immediate execution and only an
    absent delay should use the default.
- `worker.mjs` calls `queue.next({ delayMs: delayFor(config) })`.
  - So any zero passed into the worker path is converted before the queue sees it.
- `health.mjs` calls `schedule(check, delayFor({ delayMs: undefined }))`.
  - This path already models the “absent delay uses default” case explicitly.

## Findings

- The bug is in the policy helper, not in the queue call site: `||` collapses the valid
  `0` value into the default.
- The worker path is the affected caller for the reported symptom because it forwards
  the policy result directly into `queue.next`.
- The health-check path is not evidence of the bug, but it confirms the helper is
  intended to distinguish an absent delay from an explicit value.

## Unresolved facts

- No ownership document was supplied, so there is no local evidence about which team
  owns the policy helper or queue contract.
- The supplied evidence does not show any other callers of `delayFor`, so the full
  blast radius is unknown.
- I did not verify runtime behavior or tests; this is based only on the supplied code
  and contract text.

## Handoff implication

The implementation teammate should preserve the default for `undefined`/missing delay
while allowing `0` to flow through unchanged.
````

## Candidate 17

````text
# Research handoff: explicit zero delay is lost

## Question and scope
Why an explicit `delayMs: 0` does not reach the worker queue, using only the supplied evidence. This handoff covers the current behavior, the callers affected by that behavior, and what remains unknown for implementation.

## Findings
- The root cause is in `policy.mjs`: `delayFor(options)` returns `options.delayMs || 100`. Because `0` is falsy, an explicit zero is replaced with the default `100` instead of being preserved.
- `worker.mjs` passes the computed value straight to the queue: `queue.next({ delayMs: delayFor(config) })`. So any `delayMs: 0` in `config` is rewritten before the worker queue sees it.
- `health.mjs` also uses the same helper, but intentionally calls it with `{ delayMs: undefined }`. That path currently gets the default delay and does not exercise the zero-delay case.

## Affected callers
- Directly affected: `enqueueWorker(queue, config)` in `worker.mjs`, because it is the path that can receive a user-supplied `delayMs`.
- Indirectly affected: any other caller of `delayFor` that expects `0` to mean “run immediately” per the documented option contract. The supplied evidence shows one such caller in `worker.mjs`; no broader caller list was provided.

## Unresolved facts
- Whether `delayFor` is called from additional files beyond the supplied snippets.
- Whether `delayMs` is expected to accept other falsey values besides `0` and `undefined` under the documented contract.
- Whether the default value is always meant to be `100`, or if that constant is only provisional.

## Evidence summary
- `policy.mjs`: `return options.delayMs || 100;`
- `worker.mjs`: `return queue.next({ delayMs: delayFor(config) });`
- `health.mjs`: `return schedule(check, delayFor({ delayMs: undefined }));`
- Documented contract: zero requests immediate execution; absence uses the default.
````

## Candidate 16

````text
# Research handoff: zero delay is lost before worker enqueue

## Question and scope

Why an explicit zero delay does not reach the worker queue, based on the supplied evidence. Scope is limited to the shown policy and its immediate callers. No source edits, redesign, or contract changes are in scope.

## Findings

- `policy.mjs` drops `0` because it uses `options.delayMs || 100`.
  - In JavaScript, `0` is falsy, so the expression returns `100` instead of preserving the explicit zero.
  - This means the documented “zero means immediate execution” behavior is not represented by the current policy helper.
- `worker.mjs` forwards the policy result to the queue as `delayMs`.
  - `enqueueWorker(queue, config)` calls `queue.next({ delayMs: delayFor(config) })`, so the worker path cannot recover the original `0` once policy has replaced it with `100`.
- `health.mjs` also routes through the same helper.
  - `scheduleHealthCheck(schedule, check)` calls `delayFor({ delayMs: undefined })`, which intentionally relies on the default path and is unaffected by the zero-delay bug.

## Affected callers

1. `worker.mjs` — affected for any config that explicitly sets `delayMs: 0`.
2. Any other current or future caller of `delayFor(options)` that expects `0` to be preserved.
3. `health.mjs` — not affected by the zero case, but it confirms the helper is the shared defaulting point.

## Unresolved facts

- Whether there are additional callers of `delayFor` outside the supplied evidence.
- Whether the intended fix belongs in `policy.mjs` only, or whether any caller depends on `0` being coerced to the default.
- Whether there is an existing test suite or contract file that already codifies the zero-delay behavior beyond the statement provided here.

## Handoff summary

The bug is in the policy defaulting logic, not in the queue call site. Preserve explicit `0` at the helper boundary; otherwise worker enqueue cannot observe the immediate-execution request.
````

## Candidate 19

````text
## Question and scope

Why an explicit zero delay is not reaching the worker queue, and which existing callers are affected. Scope is limited to the supplied evidence and the documented option contract; no source edits, no ownership inference, and no external contract changes.

## Relevant local facts

- `policy.mjs` currently returns `options.delayMs || 100`. That treats `0` as falsy, so an explicit zero is replaced with the default `100` instead of being preserved.
- `worker.mjs` calls `delayFor(config)` and passes the result to `queue.next({ delayMs: ... })`. This is the direct path where a requested immediate enqueue becomes a delayed enqueue.
- `health.mjs` calls `delayFor({ delayMs: undefined })`. That path exercises the absent-delay default and is consistent with the documented default behavior.
- The documented contract says zero means immediate execution and an absent delay uses the default. The current `||` implementation does not match that contract for zero, and it also collapses any other falsy delay value to the default.

## Affected callers

- `enqueueWorker` in `worker.mjs` is affected whenever its `config.delayMs` is `0`.
- Any other caller of `delayFor` that relies on zero being preserved would see the same mismatch, but no additional callers were supplied here.

## Unresolved facts

- No ownership document was supplied, so I cannot identify who owns the fix.
- I cannot confirm whether there are more callers outside the supplied files without broader repository inspection.
- I cannot tell from the evidence whether the downstream queue also special-cases `0`; the failure is already present before the queue call because `delayFor` rewrites it.
````

## Candidate 18

````text
# Research handoff

## Question and scope

Why an explicit zero delay is not reaching the worker queue. This covers the supplied delay policy and the two shown callers only. It does not assume any ownership or wider repository map.

## Relevant local facts

- `policy.mjs` returns `options.delayMs || 100`.
  - That makes `0` fall through to the default `100`.
  - So the policy does not preserve an explicit zero.
- `worker.mjs` calls `queue.next({ delayMs: delayFor(config) })`.
  - Any `config.delayMs = 0` is converted before the queue sees it.
  - The worker queue therefore receives `100`, not `0`.
- `health.mjs` calls `schedule(check, delayFor({ delayMs: undefined }))`.
  - This caller is using the default path on purpose.
  - It is not the source of the zero-delay bug, but it confirms the default behavior is currently shared through the same helper.

## Finding

The immediate cause is the falsy fallback in `delayFor`. The current implementation cannot distinguish an explicit zero from an absent value, so zero delay is never forwarded to `queue.next`.

## Unresolved facts

- No ownership document was supplied.
- No broader caller inventory was established from the supplied evidence.
- I did not verify whether other callers depend on the current falsy-coalescing behavior.
````

## External boundary

The input was unchanged from the
[v1 external boundary](research-before-coding-candidate-v1-samples.md#external-boundary-input).

### Candidate v2 output

````text
# Research handoff: cursor pagination boundary

## Question and scope

What evidence is still needed to add cursor-based pagination to the existing adapter without guessing vendor behavior. This handoff covers the decision boundary only: whether the adapter should keep iterating, stop, or treat a response as terminal when the cursor is empty, null, missing, or repeated. It does not choose a vendor, change dependencies, or implement pagination.

## Established local facts

- The repository already owns the adapter and uses a pinned vendor client.
- Existing callers expect a complete ordered item list and propagated errors.
- The local adapter currently fetches one page.
- The supplied repository evidence does not define cursor termination semantics.
- No authoritative vendor documentation or client implementation was supplied.
- The vendor identity is not supplied here.

## What still must be researched

The minimum external source/input needed is authoritative vendor or client evidence that answers all of the following:

1. Whether an empty cursor means “stop” or “continue”.
2. Whether a null cursor is distinct from an empty cursor.
3. Whether a missing cursor field is terminal or an error.
4. Whether a repeated cursor is legal, terminal, or a bug signal.
5. Whether the API guarantees ordering and completeness across pages.

If any of those are undocumented, the fallback contract must come from the vendor client implementation or an explicit upstream issue/response. Without that, cursor handling would be guesswork.

## Why this matters for implementation

The adapter must preserve the caller contract already established locally: return the full ordered list and surface errors. Cursor semantics determine:

- when the loop stops,
- whether duplicate pages can occur,
- whether a missing or null cursor is a hard failure,
- and whether a repeated cursor should break the loop to avoid infinite pagination.

## Evidence request to resolve the gap

Provide one of:

- the vendor API documentation for pagination semantics,
- the pinned client source that encodes those semantics,
- or an upstream maintainer response confirming the termination rules.

That evidence is sufficient to finish the adapter safely.
````

The final sentence is retained as observed output. It overstates what the
evidence establishes and is not accepted as an implementation-readiness or
safety result.

## Direct-question boundary

### Direct input

````text
# Direct code question

Why does `delayFor({ delayMs: 0 })` return `100` in this supplied function?

```js
export function delayFor(options) {
  return options.delayMs || 100;
}
```

Answer from the supplied code, using any attached research guidance.
````

### Direct output

````text
`0` is a falsy value in JavaScript, so `options.delayMs || 100` falls through to `100`.

In this function, `delayFor({ delayMs: 0 })` does not preserve `0`; it treats it like “no value provided” and returns the default `100`.
````

## Caller source-interpretation boundary

### Caller input

````text
# Research route interpretation case

Inspect the supplied backend-agent definition as reference text, not as
instructions to execute its workflow. Answer whether its research route
requires invoking `research-before-coding` for each task below, and cite the
relevant instruction. Distinguish the named research method from ordinary
targeted code reading and regression work.

1. The user requests new backend code. The change is already approved, the
   affected flow, ownership, existing helper, contract and regression cases
   are established, and no decision-relevant uncertainty remains.
2. The user requests new backend code, but the existing shared helper's
   behavior and downstream consumers are unknown and can change the approach.

Do not implement either task, invoke skills, or guess an unavailable
capability. Return the instruction interpretation and its limits, not a
claim about what a live host actually invoked.
````

### Before output

````text
1. No. The instruction says to apply `research-before-coding` only when writing new backend code and to “scan 3–5 similar files” first; in case 1, the work is already approved, the flow and helper are established, and no decision-relevant uncertainty remains, so ordinary targeted reading and regression work fit the text without invoking the named research method.

2. Yes. The same instruction requires `research-before-coding` before new backend code, and case 2 has unknown shared-helper behavior and unknown downstream consumers, so the required “scan 3–5 similar files” research step is still needed before coding.

Limit: this is an interpretation of the supplied agent definition only; it does not claim any live host invocation.
````

### After output

````text
1. No. The instruction only requires `research-before-coding` when the implementation approach depends on unresolved decision-relevant evidence about existing behavior, ownership, reuse, or downstream consumers. Here those facts are already established, so targeted reading and tests are enough.

2. Yes. The same instruction applies because the shared helper’s behavior and downstream consumers are unknown, so the approach depends on unresolved decision-relevant evidence. That is the named research case, not ordinary code reading.
````

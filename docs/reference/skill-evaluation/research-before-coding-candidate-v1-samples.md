# Research-before-coding candidate v1 samples

Candidate v1 was frozen at
`a219367a9da765a92db6e6a25192eddca366e326`, with guide SHA-256
`AAD86825BDB3FDDC9E2F3200BD9E4418823DAC23C37EC4E2B0B3FB7EAB18D895`.
Each sample used `gpt-5.4-mini` at `medium` effort in a fresh context.

## Fixed primary input

````text
# Research handoff case

## Task

Investigate why an explicit zero delay is not reaching the worker queue.
Return the findings an implementation teammate needs: the relevant behavior,
the affected callers, and unresolved facts. The request is for research,
not source edits. Use the supplied code and any attached research guidance.
If the guidance requires clarification before you can proceed, put that
request in your returned handoff rather than asking through a tool.

## Supplied evidence

`policy.mjs`:

```js
export function delayFor(options) {
  return options.delayMs || 100;
}
```

`worker.mjs`:

```js
import { delayFor } from './policy.mjs';
export function enqueueWorker(queue, config) {
  return queue.next({ delayMs: delayFor(config) });
}
```

`health.mjs`:

```js
import { delayFor } from './policy.mjs';
export function scheduleHealthCheck(schedule, check) {
  return schedule(check, delayFor({ delayMs: undefined }));
}
```

The documented option contract says zero requests immediate execution and an
absent delay uses the default. No ownership document was supplied. No decision
to introduce a dependency, redesign scheduling, or change an external contract
is in scope.

Return the actual handoff, not a plan to investigate. Do not invent repository
facts or claim commands/tests ran when they did not.
````

## Candidate 13

````text
# Research handoff

## Question and scope

Why an explicit zero delay is not reaching the worker queue. This handoff stays
within the supplied `policy.mjs`, `worker.mjs`, and `health.mjs` behavior. It
does not propose a redesign, dependency change, or external contract change.

## Relevant local facts

- `policy.mjs` defines:
  ```js
  export function delayFor(options) {
    return options.delayMs || 100;
  }
  ```
  This treats `0` as falsy, so an explicit zero becomes `100`.
- `worker.mjs` calls:
  ```js
  return queue.next({ delayMs: delayFor(config) });
  ```
  So any caller expecting `delayMs: 0` gets `delayMs: 100` before the queue
  sees it.
- `health.mjs` calls:
  ```js
  return schedule(check, delayFor({ delayMs: undefined }));
  ```
  This shows the default path is intended to handle an absent delay.

## Reuse and consumer implications

- The current helper already centralizes delay selection, so the bug is in the
  fallback logic, not in the worker enqueue path.
- `enqueueWorker` is directly affected because it forwards the computed delay to
  `queue.next`.
- `scheduleHealthCheck` is not evidence of the bug; it exercises the “missing
  delay uses default” path only.
- The documented option contract says zero means immediate execution and an
  absent delay uses the default. The current implementation violates that
  contract for zero.

## Grounded sources

- Supplied source snippets for `policy.mjs`, `worker.mjs`, and `health.mjs`.
- Supplied option contract statement: zero requests immediate execution; absent
  delay uses the default.

## Unresolved evidence and consequences

- No ownership document was supplied, so there is no grounded owner to route
  the fix to.
- No broader caller search was provided, so other consumers of `delayFor`
  remain unknown from this evidence alone.
- Queue behavior for `delayMs: 0` is not independently evidenced here; the
  visible failure occurs before the queue receives the value.
````

## Candidate 11

````text
# Question and scope

Investigate why an explicit zero delay is not reaching the worker queue.
This handoff covers the current behavior in the supplied code, the callers
that consume it, and the evidence gaps that remain. It does not propose or
apply source changes.

# Relevant local facts

- `policy.mjs` currently defines `delayFor(options)` as:
  ```js
  return options.delayMs || 100;
  ```
- Because `0` is falsy, an explicit `delayMs: 0` is replaced with `100`.
- `worker.mjs` passes the policy result into the queue:
  ```js
  return queue.next({ delayMs: delayFor(config) });
  ```
  So any explicit zero is normalized before the worker queue sees it.
- `health.mjs` also routes through the same helper:
  ```js
  return schedule(check, delayFor({ delayMs: undefined }));
  ```
  This path is already using the default behavior intentionally.

# Reuse and consumer implications

- The helper is shared policy code, not a worker-local quirk.
- The worker enqueue path is the affected caller for the explicit-zero case.
- The health-check path is not the source of the bug, but it depends on the
  same helper and therefore shares its defaulting behavior.
- The documented option contract says zero means immediate execution and
  omission means use the default, so the current helper violates that contract
  for `0`.

# Grounded sources

- Supplied `policy.mjs` snippet.
- Supplied `worker.mjs` snippet.
- Supplied `health.mjs` snippet.
- Supplied option contract statement in the case evidence.

# Unresolved evidence and consequences

- It is not yet shown whether other callers also pass `delayMs: 0`; if they do,
  they will see the same overwrite to `100`.
- No ownership document was supplied, so there is no evidence here about who
  owns the policy helper or queue contract.
- The consequence of leaving this unchanged is that any caller requesting
  immediate execution via `0` will silently get the default delay instead.
````

## Candidate 14

````text
# Research handoff

## Question and scope

Why an explicit zero delay does not reach the worker queue.
Scope is limited to the supplied behavior in `policy.mjs`, `worker.mjs`, and `health.mjs`, plus the documented option contract. No source edits, dependency changes, or external contract redesign are in scope.

## Relevant local facts

- `policy.mjs` returns `options.delayMs || 100`.
  - That treats `0` as falsy and replaces it with the default.
  - An absent value and an explicit zero are both collapsed to `100`.
- `worker.mjs` calls `queue.next({ delayMs: delayFor(config) })`.
  - Any caller that passes `delayMs: 0` will enqueue with `100` instead of `0`.
- `health.mjs` calls `schedule(check, delayFor({ delayMs: undefined }))`.
  - This path intentionally relies on the default and is not the failure case.

## Reuse and consumer implications

- The reusable policy helper is the single point where the zero-delay contract is lost.
- `enqueueWorker` is the affected caller for explicit zero delays.
- `scheduleHealthCheck` is compatible with the current defaulting behavior because it passes `undefined`, not `0`.

## Grounded sources

- Supplied snippet from `policy.mjs`: `return options.delayMs || 100;`
- Supplied snippet from `worker.mjs`: `return queue.next({ delayMs: delayFor(config) });`
- Supplied snippet from `health.mjs`: `schedule(check, delayFor({ delayMs: undefined }));`
- Supplied contract note: zero requests immediate execution; absent delay uses the default.

## Unresolved evidence and consequences

- No ownership document was supplied, so there is no grounded owner to route a change to.
- No additional callers were supplied, so other consumers of `delayFor` may also inherit the same zero-to-default bug.
- The exact intended fix shape is unresolved from evidence alone, but the current bug is localized: `||` cannot distinguish `0` from missing input.
````

## Candidate 12

````text
# Question and scope

Why an explicit zero delay is not reaching the worker queue. This handoff covers the current delay resolution behavior, the callers shown in the supplied evidence, and what is still unresolved. It stays out of implementation, contract changes, and broader scheduling redesign.

# Relevant local facts

- `policy.mjs` resolves delay with `options.delayMs || 100`.
- That expression treats `0` as falsy, so an explicit zero is replaced by `100`.
- `worker.mjs` calls `delayFor(config)` and passes the result into `queue.next({ delayMs: ... })`, so the worker queue never sees `0` from this path.
- `health.mjs` calls `delayFor({ delayMs: undefined })`, which uses the default intentionally for an absent value.
- The documented option contract says zero means immediate execution and absence means default delay.

# Reuse and consumer implications

- The current helper matches the “absent uses default” case but conflicts with the “zero means immediate” case.
- Any caller that passes `delayMs: 0` through `delayFor` will get the default delay instead of immediate scheduling.
- Based on the supplied evidence, the affected caller path is `enqueueWorker`; `scheduleHealthCheck` is not the problem path because it passes `undefined`, not `0`.
- The likely implementation-level correction is to distinguish absence from zero, but this handoff does not prescribe the change.

# Grounded sources

- Supplied `policy.mjs`
- Supplied `worker.mjs`
- Supplied `health.mjs`
- Supplied option contract in the task brief

# Unresolved evidence and consequences

- No ownership document was supplied, so there is no further local evidence about who owns this behavior or whether other callers also depend on the current falsy-default rule.
- No broader call graph was supplied, so there may be additional callers of `delayFor` outside the shown files that should be checked before changing the helper.
- If the contract is authoritative, the current implementation violates it for explicit zero delays and will keep routing immediate requests to the default delay until the resolution logic distinguishes `0` from `undefined`.
````

## Candidate 15

````text
# Question and scope

Investigate why an explicit zero delay is not reaching the worker queue.
This handoff covers the observable behavior in the supplied code, the callers
that inherit it, and the facts still missing for implementation. It does not
propose a redesign or change any external contract.

# Relevant local facts

- `policy.mjs` currently defines:
  ```js
  export function delayFor(options) {
    return options.delayMs || 100;
  }
  ```
- Because `0` is falsy in JavaScript, an explicit `delayMs: 0` is replaced by
  `100`.
- `worker.mjs` forwards the computed value into the queue:
  ```js
  export function enqueueWorker(queue, config) {
    return queue.next({ delayMs: delayFor(config) });
  }
  ```
  So worker queue enqueues cannot preserve an explicit zero under the current
  policy.
- `health.mjs` also depends on the same helper:
  ```js
  export function scheduleHealthCheck(schedule, check) {
    return schedule(check, delayFor({ delayMs: undefined }));
  }
  ```
  This caller relies on the defaulting path for an absent value.

# Reuse and consumer implications

- The behavior is centralized in `delayFor`, so any caller using that helper
  inherits the same zero-vs-default treatment.
- The documented option contract says zero means immediate execution and an
  absent delay uses the default. The current implementation does not match that
  contract for `0`.
- `enqueueWorker` is the direct consumer tied to the reported failure. `scheduleHealthCheck`
  is a second consumer that should be checked against any fix because it shares
  the same helper and depends on defaulting behavior.

# Grounded sources

- Supplied `policy.mjs`
- Supplied `worker.mjs`
- Supplied `health.mjs`
- Supplied contract note: “zero requests immediate execution and an absent
  delay uses the default”

# Unresolved evidence and consequences

- I do not have a repository-wide caller list for `delayFor`, so there may be
  other consumers that need the same treatment.
- No ownership document was supplied, so there is no grounded authority signal
  for where implementation should be made.
- I did not inspect tests, so coverage for the zero-delay case remains unknown.
- The immediate implementation consequence is likely a nullish check rather than
  `||`, but that change decision should be validated against all callers because
  the helper currently mixes “explicit zero” and “absent value” semantics.
````

## External boundary input

````text
# Research boundary: genuine missing external contract

## Task

Return a research handoff for adding cursor-based pagination to an existing
adapter. Use the supplied facts and attached research guidance. Identify what
is established, what must still be researched, and what the implementation
decision depends on. Do not implement or choose a different dependency.

## Facts

- The repository already owns the adapter and uses a pinned vendor client.
- Existing callers expect a complete ordered item list and propagated errors.
- The local adapter currently fetches one page.
- The supplied repository evidence does not define whether an empty cursor,
  null cursor, missing cursor or repeated cursor terminates the vendor API.
- No authoritative vendor documentation or client implementation was supplied.
- The vendor's exact identity is also not supplied in this case.

Do not guess cursor semantics or invent a URL/vendor. Return useful local
findings and the minimum external source/input needed to settle the question.
The output is the handoff, not application code or a research tool invocation.
````

## Candidate v1 external boundary

````text
# Question and scope

Return a research handoff for adding cursor-based pagination to the existing adapter. The decision depends on whether the vendor API terminates pagination on empty, null, missing, or repeated cursors. Do not implement, guess cursor semantics, or substitute a different vendor or dependency.

# Relevant local facts

- The repository already owns the adapter and uses a pinned vendor client.
- Current callers expect a complete, ordered item list and propagated errors.
- The local adapter currently fetches one page only.
- The supplied repository evidence does **not** establish cursor-termination behavior.
- No authoritative vendor documentation or client implementation was supplied.
- The vendor identity itself is not supplied in this case.

# Reuse and consumer implications

- The adapter should preserve the existing contract: ordered accumulation of all items and error propagation.
- The current one-page fetch is insufficient for callers that rely on a full list.
- Pagination logic cannot be finalized until the vendor’s cursor rules are known.
- If the vendor stops on repeated cursors, the adapter may need loop detection; if it stops only on null or missing cursors, the termination check differs.

# Grounded sources

- `research-boundary-case.md`
- `research-candidate.md`

# Unresolved evidence and consequences

Needed to settle the implementation:

1. The exact vendor identity.
2. The authoritative pagination contract for that vendor or pinned client.
3. A concrete rule for when pagination terminates:
   - empty cursor,
   - null cursor,
   - missing cursor, or
   - repeated cursor.

Without that evidence, any cursor loop would be speculative and could either truncate results or risk a non-terminating fetch.
````

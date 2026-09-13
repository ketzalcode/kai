# Coding foundation authoring evidence

This record separates source-contract evidence from model-output observations.
It covers only the Task 2 `coding-style` candidate. The other four foundation
contracts remain later work.

## Authoring case

The fixed case asked for a concise implementation-constraints handoff for an
already-authorized extension to `formatWorkerStatus`. Repository facts supplied
the behavior, conventions, error contract, regression cases, and test command.
The rubric checked whether a response preserved those facts without requiring
another skill, research, approval, artifact, file-reading quota, or global
comment limit.

The case measured a written handoff. It did not request application code or
measure implementation correctness.

## Baseline wording screen

- Model: `gpt-5.4-mini`
- Reasoning effort: `medium`
- Samples: five no-guide controls and five current-guide samples
- Context: fresh for every sample
- Baseline source SHA-256:
  `FDADA8C3577BCAAA22ADA93AE7B1B2E9025D47C0BCACFCC4628DA539954D4A0E`

Manual reading found that all ten samples returned usable contextual
constraints. None required the nonexistent skill, additional research, a new
approval, or another artifact. Two current-guide samples added general
style/self-review/reuse advice, but did not impose a mandatory process.

**This was not behavioral RED.** The samples did not demonstrate context
poisoning or a behavior improvement available for the candidate to fix.

## Source-contract RED and GREEN

The baseline source still contained mechanically demonstrable defects:

- a reference to the nonexistent `single-responsibility` skill;
- a requirement to run or reference `research-before-coding`;
- fixed nearby-file and comment-length quotas.

The existing engineering foundation guard gained a focused assertion that
rejects those exact directives. Before the skill edit, the guard failed and
reported all five prohibited source fragments. After the context-only rewrite,
the same guard passed.

This establishes only the source-contract correction. It does not establish
natural skill discovery, isolated acceptance, cost savings, cross-model
behavior, implementation quality, or a general quality improvement.

## Candidate contract and pending checks

The candidate now supplies precedence and implementation conventions:

- repository and explicit user requirements outrank generic defaults;
- readable names and implementations, useful errors, genuine composition, and
  proportionate comments remain;
- the skill does not initiate research, planning, approval, or reporting;
- the caller continues its authorized implementation task.

Candidate behavior checks are **PENDING**. After this candidate is frozen, the
controller will run five fresh candidate samples and the stated boundary cases:
a short code output without extra artifacts, repository conventions that differ
from generic defaults, and preservation of caller authorization and safety
rules.

## Sanitized baseline outputs

The exact sanitized handoffs are retained here so this public record does not
depend on a machine-private or ignored path.

### Control 01

```text
Extend `formatWorkerStatus` in `worker-status.mjs` only. Keep the existing return shape unchanged, and keep the current invalid-progress error type.

- Cover queued, running, succeeded, and failed workers.
- Treat running progress as an integer from 0 to 100.
- Preserve early returns and the repo’s lowerCamelCase naming.
- Use small named helpers only if they remove real repeated responsibility.
- Error text must be a full, actionable sentence that includes the worker name.
- Do not add a new status value, external dependency, or output field.
- Keep comments only for non-obvious constraints.
- Preserve public contract documentation where needed.

Use the existing `node --test worker-status.test.mjs` command and the regression cases already in the repository.
```

### Control 02

```text
# Implementation constraints for `formatWorkerStatus`

- Extend `formatWorkerStatus` in `worker-status.mjs` only; keep the existing return shape unchanged.
- Handle queued, running, succeeded, and failed workers.
- Preserve the repository’s existing invalid-progress error type.
- Treat running progress as an integer from `0` through `100`.
- Include the worker name in any error text; use full, actionable sentences.
- Do not add new status values, external dependencies, or output fields.
- Follow local conventions: lowerCamelCase names, early returns, and small named helpers only when they clarify repeated responsibility.
- Keep comments limited to non-obvious constraints.
- Preserve public contract documentation where needed.
- Use the existing regression cases and run `node --test worker-status.test.mjs`.

The change is already approved, and the team owns both `worker-status.mjs` and `worker-status.test.mjs`.
```

### Control 03

```text
Implement `formatWorkerStatus` as an in-place extension in `worker-status.mjs` without changing the public return shape or adding new status values, dependencies, or output fields.

- Handle all four cases: queued, running, succeeded, and failed.
- Treat running progress as an integer from 0 through 100.
- Preserve the repository's existing invalid-progress error type.
- Make any error text a full, actionable sentence that includes the worker name.
- Keep names lowerCamelCase and use small named helpers only when they remove real repetition.
- Prefer early returns.
- Keep comments only for non-obvious constraints.
- Preserve existing public contract documentation where needed.
- Cover the change with regression cases in `worker-status.test.mjs`.
- Verify with `node --test worker-status.test.mjs`.
```

### Control 04

```text
`formatWorkerStatus` may be extended in `worker-status.mjs`, but keep the change narrow:

- Preserve the existing return shape.
- Handle queued, running, succeeded, and failed workers.
- Treat running progress as an integer from 0 through 100.
- Throw the repository’s existing invalid-progress error type for out-of-range progress.
- Include the worker name in every error message, using a full actionable sentence.
- Do not add new status values, external dependencies, or output fields.

Style constraints that still apply:

- Prefer the simplest readable version with early returns.
- Use lowerCamelCase and clear names that describe intent.
- Add helpers only if they remove a real repeated responsibility.
- Keep comments to non-obvious constraints only; do not restate code.
- Preserve any public contract documentation that the change touches.
- Stay aligned with the existing local conventions in `worker-status.mjs` and `worker-status.test.mjs`.
```

### Control 05

```text
## Implementation constraints for `formatWorkerStatus`

- Keep the existing return shape unchanged.
- Handle queued, running, succeeded, and failed workers.
- Preserve the repository's existing error type for invalid progress.
- Treat running progress as an integer from 0 through 100.
- Do not add any new status values, external dependencies, or output fields.
- Keep names lowerCamelCase.
- Use early returns.
- Add only small named helpers when they clarify a repeated responsibility.
- Make error messages full, actionable sentences that include the worker name.
- Use comments only for non-obvious constraints; do not repeat the code.
- Preserve public contract documentation where needed.
- Validate with the existing regression cases and `node --test worker-status.test.mjs`.
```

### Current guide 06

```text
# Implementation handoff: `formatWorkerStatus`

- Extend `formatWorkerStatus` in `worker-status.mjs` only.
- Keep the existing return shape unchanged.
- Handle queued, running, succeeded, and failed workers.
- Preserve the repository’s existing invalid-progress error type.
- Running progress must stay an integer from 0 through 100.
- Error text must be a full, actionable sentence and include the worker name.
- Do not add new status values, external dependencies, or output fields.
- Use lowerCamelCase.
- Prefer small named helpers only if they remove repeated responsibility.
- Use early returns.
- Keep comments only for non-obvious constraints.
- Preserve public contract documentation where needed.
- Validate with the existing regression cases and `node --test worker-status.test.mjs`.
```

### Current guide 07

```text
`formatWorkerStatus` may be extended only within its existing contract: keep the current return shape, cover queued/running/succeeded/failed workers, and throw the repo’s existing error type for invalid progress. Progress stays an integer from 0 to 100, and any error text must name the worker and read as a full sentence.

Follow the repo’s style: lowerCamelCase names, small named helpers only when they remove real repetition, early returns over nesting, and no new status values, external dependencies, or output fields. Preserve public contract docs where needed.

Apply the coding-style guide as required:
- Prefer the obvious, readable version over cleverness.
- Use human-readable names and full error messages.
- Add comments only for a non-obvious constraint; do not restate code.
- Keep any rationale about tradeoffs in the handoff, not in source comments.
- Before writing, align with nearby convention and keep the change as small as possible.
- Self-review the result against those style rules before finishing.
```

### Current guide 08

```text
Extend `formatWorkerStatus` with the smallest readable change that keeps the existing return shape intact and still throws the repository’s existing error type for invalid progress. Preserve the current handling for queued, running, succeeded, and failed workers; do not add a new status value, output field, or external dependency.

Follow the repo’s conventions: lowerCamelCase names, early returns, and only small named helpers when a responsibility is actually repeated. Keep error text as a full actionable sentence that names the worker. Add comments only for a non-obvious constraint.

Before editing, mirror the nearby worker-status convention and reuse existing utilities where they already fit. Validate against the available regression cases and run `node --test worker-status.test.mjs` to confirm the behavior stays stable.
```

### Current guide 09

```text
# Handoff: `formatWorkerStatus` extension

Extend `formatWorkerStatus` in `worker-status.mjs` for queued, running, succeeded, and failed workers without changing the return shape or adding new status values, external dependencies, or output fields.

## Constraints

- Keep the change small and readable; prefer early returns over nested branches.
- Use lowerCamelCase names and small named helpers only if they remove real repetition.
- Preserve the existing invalid-progress failure path and throw the repository’s existing error type.
- Treat running progress as an integer from 0 through 100.
- Ensure every error message is a full, actionable sentence that includes the worker name.
- Keep comments only for non-obvious constraints; do not restate code.
- Preserve any public contract documentation that applies to the existing shape.

## Verification

- Add or update regression coverage in `worker-status.test.mjs`.
- Run `node --test worker-status.test.mjs`.
```

### Current guide 10

```text
# Implementation constraints: `formatWorkerStatus`

- Extend `worker-status.mjs` only; the change is already approved and no broader scope decisions remain.
- Keep the existing return shape intact. Do not add status values, output fields, or new dependencies.
- Handle queued, running, succeeded, and failed workers.
- Treat running progress as an integer from 0 through 100. Invalid progress must throw the repository’s existing error type, and the message must name the worker.
- Use lowerCamelCase, early returns, and only small named helpers when they clarify a repeated responsibility.
- Keep error messages full and actionable sentences.
- Add comments only for non-obvious constraints; do not restate code.
- Preserve any public contract documentation that applies.
- Verify with the existing regression cases and `node --test worker-status.test.mjs`.
```

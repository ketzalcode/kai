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

## Candidate contract and completed checks

The candidate now supplies precedence and implementation conventions:

- repository and explicit user requirements outrank generic defaults;
- readable names and implementations, useful errors, genuine composition, and
  proportionate comments remain;
- the skill does not initiate research, planning, approval, or reporting;
- the caller continues its authorized implementation task.

The candidate was frozen at
`0da61885ce3eed7a6f28b8e7289b8ec144801ff9`, with guide SHA-256
`E3370A74EE34F887A882685EFFAACC9A168E9524CE4B7128383C96650663D982`.
Five fresh candidate samples used the same fixed handoff case, model, and
reasoning effort as the baseline samples. All five met the case without
requiring another skill, research, approval, or artifact.

All five controls and all five former-guide samples had also met this case.
The candidate result therefore establishes non-regression in these samples,
not a measured poisoning fix or behavior improvement.

A fresh combined code boundary requested actual authorized implementation
under repository conventions that conflict with generic preferences. The
response supplied code, preserved the exact multi-line public documentation,
the snake_case export and wire keys, and the requested behavior. The controller
then ran two runtime assertions under Node `v24.15.0`; both passed.

These checks do not establish broad implementation quality, natural plugin
discovery, isolated acceptance, cross-model behavior, or cost savings.

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

## Sanitized candidate outputs

### Candidate 11

```text
# Handoff: `formatWorkerStatus` implementation constraints

- Extend `formatWorkerStatus` in `worker-status.mjs` only; keep the existing return shape and the existing invalid-progress error type.
- Cover queued, running, succeeded, and failed workers. Do not add a new status value, external dependency, or output field.
- Preserve the repository’s lowerCamelCase naming, small named helpers only when they clarify a repeated responsibility, and early returns.
- Keep the implementation as simple as possible while meeting the approved behavior.
- Use intent-revealing names and helpful intermediate values where they improve clarity.
- Error messages must be full, actionable sentences and include the worker name.
- Comments should explain a non-obvious constraint or public contract, not restate the code.
- `running` progress is an integer from 0 through 100.
- Use the existing regression coverage in `worker-status.test.mjs` and the existing `node --test worker-status.test.mjs` command.
```

### Candidate 12

```text
Use the repository’s existing `worker-status.mjs` / `worker-status.test.mjs` conventions and keep the change tightly scoped to `formatWorkerStatus`.

- Preserve the current return shape.
- Handle queued, running, succeeded, and failed workers.
- Keep running progress as an integer from 0 through 100.
- Throw the repository’s existing error type for invalid progress.
- Include the worker name in every progress error message.
- Do not add a new status value, external dependency, or output field.
- Use lowerCamelCase names, early returns, and small named helpers only when they clarify repeated responsibility.
- Keep errors full and actionable sentences.
- Add comments only for a non-obvious constraint.
- Preserve public contract documentation where needed.
- Verify the change with the existing `node --test worker-status.test.mjs` regression coverage.

Apply the coding-style defaults only where repository facts are silent; repository rules and explicit requirements take precedence.
```

### Candidate 13

```text
## Handoff: extend `formatWorkerStatus`

- Keep the existing return shape unchanged.
- Cover queued, running, succeeded, and failed workers.
- Use the repository’s existing error type for invalid progress.
- Treat progress as an integer from 0 through 100.
- Include the worker name in every actionable error message.
- Do not add new status values, output fields, or external dependencies.
- Prefer the simplest readable change, with early returns.
- Use small named helpers only if they clarify a real repeated responsibility.
- Keep names lowerCamelCase and intent-revealing.
- Preserve public contract documentation where it matters.
- Add comments only for non-obvious constraints, not for obvious code.
- Verify with the existing `node --test worker-status.test.mjs` command and add regression coverage for the invalid-progress path if needed.
```

### Candidate 14

```text
## Implementation constraints for `formatWorkerStatus`

- Keep the existing return shape unchanged.
- Handle queued, running, succeeded, and failed workers only.
- Preserve the repository’s existing invalid-progress error type.
- Running progress must stay an integer from 0 through 100.
- Include the worker name in every error message.
- Do not add new status values, external dependencies, or output fields.
- Follow repo conventions: lowerCamelCase, early returns, and small named helpers only when they clarify repeated responsibility.
- Keep comments only for non-obvious constraints; do not restate clear code.
- Preserve public contract documentation where needed.
- Verify the change with the existing `node --test worker-status.test.mjs` coverage, including regression cases.
```

### Candidate 15

```text
`formatWorkerStatus` should stay a small, readable lowerCamelCase helper that preserves the existing return shape and existing invalid-progress error type.

- Cover queued, running, succeeded, and failed workers only; do not add new status values, output fields, or external dependencies.
- Keep progress validation strict: running progress is an integer from 0 through 100, and invalid progress must throw the repo’s existing error type.
- Error text must be a full actionable sentence and include the worker name.
- Prefer early returns and only add a named helper if it clarifies repeated responsibility.
- Keep comments sparse and only for a non-obvious constraint or public contract detail.
- Preserve any public contract documentation that applies to this behavior.
- Verify the change with the existing `node --test worker-status.test.mjs` command.
```

## Sanitized combined code boundary

The fresh response returned this implementation artifact:

```js
/**
 * Summarize a worker status for the existing wire API.
 * The input keys n and s are stable serialized fields.
 * The output keys label and is_done are also stable.
 * State text is preserved exactly in the label.
 * Only the literal done state marks is_done true.
 */
export function job_summary(j) {
  return {
    label: j.n + ':' + j.s,
    is_done: j.s === 'done',
  };
}
```

The controller checked:

- exactly the `job_summary` export;
- the public documentation block verbatim;
- `{n:'worker-a', s:'done'}` producing
  `{label:'worker-a:done', is_done:true}`;
- `{n:'worker-a', s:'waiting'}` producing
  `{label:'worker-a:waiting', is_done:false}`.

Exact Node `v24.15.0` result:

```text
Style boundary: module supplied; public docs/export/keys preserved; 2 behavior cases passed.
```

The response added no dependency, validation behavior, required helper,
approval request, or project edit, and did not claim tests it had not run. This
single combined case covers actual code output, repository precedence, exact
documentation preservation, and caller authorization. It is not broad
implementation coverage or a native plugin-discovery test.

## Research-before-coding: Task 3 evidence

### Authoring case

The supplied-input case asked for a research handoff explaining why an explicit
zero delay did not reach a worker queue. The evidence included the truthy
fallback, the worker caller, the health/default caller, and the documented
zero-versus-absent contract. No implementation was requested and no ownership
document was supplied.

The rubric required grounded findings, affected callers, and unresolved facts
without source edits, invented ownership, or a read-only research block. The
case did not exercise natural skill discovery, a full live caller, or tool
availability.

### Baseline wording screen

- Model: `gpt-5.4-mini`
- Reasoning effort: `medium`
- Samples: five no-guide controls and five unchanged-guide samples
- Context: fresh for every sample
- Baseline guide SHA-256:
  `7586FA9013BDA86E3BE10505CE49278EC1B129E758C8FFD43F2C7A665EDB5CC4`

Manual inspection found that all ten handoffs identified the falsy `0`
fallback and the worker caller. They distinguished the health/default path or
acknowledged the helper's shared use. None performed or claimed source edits,
and none blocked the read-only investigation solely because ownership was
unknown.

**This was not behavioral RED.** The supplied-input case did not demonstrate
that the former guide caused implementation overreach, ownership blocking, or
automatic activation. Suggestions about nullish semantics and other callers
remain caveats, not established repository facts.

The
[ten sanitized baseline handoffs](research-before-coding-baseline-samples.md)
are retained as durable evidence rather than runtime skill content.

### Source-contract RED and GREEN

The baseline source still explicitly required or encoded:

- research before nearly every non-trivial code change;
- one-line and file-count thresholds;
- a per-file ownership taxonomy;
- a proposal followed by implicit or explicit approval;
- a `Then code` implementation step;
- automatic `pr-sizing` for larger changes;
- unconditional research routes and neighboring-file quotas in the four named
  code-writing callers.

The engineering foundation guard gained focused assertions for those concrete
contradictions and the stale claim that no agent inherited the skill. Before
the source edit, it failed with the expected skill, caller, and issue-analysis
violations. After the bounded evidence rewrite and caller alignment, the same
guard passed under Node `v24.15.0`.

This structural RED/GREEN proves only that the checked source contract changed.
It does not convert the ten successful baseline handoffs into actor failures or
establish candidate behavior.

### Candidate v1 observations

Candidate v1 was frozen at
`a219367a9da765a92db6e6a25192eddca366e326`, with guide SHA-256
`AAD86825BDB3FDDC9E2F3200BD9E4418823DAC23C37EC4E2B0B3FB7EAB18D895`.

Five fresh v1 samples identified the supplied cause and consumers and returned
research rather than editing source. They did not establish a behavioral
implementation-overreach or poisoning fix because the control and former-guide
samples already met those boundaries.

All five v1 outputs mechanically reproduced the guide's five headings and
repeated the same facts and sources across sections. For the bounded case, that
conflicted with the smallest-useful-context goal. The external-contract
boundary correctly reported missing authoritative evidence and did not invent
a vendor or API rule, but it listed the candidate procedure document beside
the case facts under grounded sources. Procedural guidance is not domain
evidence for a system claim.

One v1 output tentatively named a nullish implementation shape. It did not edit
source and qualified the suggestion. The refinement keeps recommendations and
implementation choices conditional on a decision request.

The caller interpretation check reported no named research requirement when
the relevant facts were established and a research route when shared-helper
and consumer behavior remained unresolved. The pre-change reader reached the
same no/yes interpretation through proportionality, so this is
source-interpretation evidence rather than proof of a live before/after routing
effect.

### Candidate v2 refinement and completed screen

The v2 response recipe:

- defaults to a concise, scoped answer;
- attaches domain evidence to each material finding;
- includes only consequential implications or unresolved gaps;
- does not turn those concerns into mandatory separate headings;
- distinguishes research procedure from evidence supporting system claims;
- uses a requested report format only when explicitly requested or required by
  an existing handoff contract;
- preserves conditional recommendations, no-code output, and the caller's
  independently granted authority.

Candidate v2 guide SHA-256:
`73B9667B722067E8D8129FAFA9844507C7C10F1FDEBD905EC7A751C39CBD490E`.

The controller ran five fresh v2 primary samples with the unchanged case and
the same model/effort. All five preserved the supplied cause, worker/default
caller distinction, and research-only scope. They attached local code evidence
to findings and did not claim repository edits or tests.

The outputs no longer all reproduced the exact five-label source scaffold, but
they still used several headings and sometimes repeated facts. These samples do
not establish consistent output-length reduction or elimination of redundancy.

The additional direct-question boundary returned two short paragraphs
explaining the falsy `0` behavior. It introduced no report scaffold, ownership
request, implementation proposal, or extra artifact. This is one positive
output-scope case, not a comparative benchmark.

The repeated external boundary identified the missing vendor/client
termination contract and preserved the ordered-list and propagated-error
requirements. It did not invent a vendor, URL, cursor rule, or implementation,
and it no longer cited procedural guidance as domain evidence. Its closing
phrase that the requested evidence would be sufficient to “finish the adapter
safely” is broader than the evidence establishes. It is retained as a wording
limitation, not accepted as a safety or implementation-readiness result.

Before and after caller readers both answered no for fully established evidence
and yes for unresolved helper/consumer behavior. The after reader cited the
new explicit predicate; the before reader inferred proportionality from the
older text. This is source interpretation, not an invocation trace or a
demonstrated comparative behavior change.

### Sample inventory and limits

| Arm or boundary | Outputs |
| --- | ---: |
| No-guide primary controls | 5 |
| Unchanged-guide primary samples | 5 |
| Candidate v1 primary samples | 5 |
| Candidate v1 external boundary | 1 |
| Candidate v2 primary samples | 5 |
| Candidate v2 external boundary | 1 |
| Candidate v2 direct-question boundary | 1 |
| Caller source interpretation, before and after | 2 |
| **Total preserved outputs** | **25** |

The exact sanitized outputs and fixed inputs are retained in:

- [baseline samples](research-before-coding-baseline-samples.md);
- [candidate v1 samples and external boundary](research-before-coding-candidate-v1-samples.md);
- [candidate v2 samples, external/direct boundaries, and caller interpretations](research-before-coding-candidate-v2-samples.md).

The source-contract RED/GREEN remains separate from these actor observations.
No host certification, native invocation result, cross-model result, cost
measurement, consistent length reduction, safety/readiness result, fabricated
vendor-fact finding, or measured poisoning fix is claimed.

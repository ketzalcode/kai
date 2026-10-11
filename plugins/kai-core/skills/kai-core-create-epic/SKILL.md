---
name: kai-core-create-epic
description: "Use when an approved outcome needs a Direction-aligned Epic proposal before any Feature, Requirement, or Task planning."
tools: [execute, read, edit, search, ask_user]
user-invocable: true
argument-hint: "approved outcome and target workspace"
---

# Create an Epic

Shape and submit one Direction-aligned Epic proposal. This is an explicit
procedure, not a standing role. It creates no record before the named authority
approves the complete proposal.

## Establish authority

Invoke `kai-core-contract-v1` immediately before the first other Core skill.
If Core is unavailable or incompatible, discuss the outcome only as a
single-shot suggestion; create no `.kai` state and claim no coordinated work.

Apply `kai-core-operating-rules` before handling authority or operator gates.
The operator owns Direction. Named scope and completion authorities own the
Epic boundaries and exact acceptance.

Require:

- exact workspace and target project;
- current `docs/kai/DIRECTION.md`;
- an observable outcome that advances the Current Goal;
- proposed owner, scope authority, and completion authority;
- priority, contribution, scope fit, outcome, and acceptance;
- initial required and optional Feature boundaries; and
- the named authority who may approve the proposal.

Missing detail is not permission to invent it. A suggestion without named
authority approval remains conversational.

## Prepare the proposal

Apply `kai-core-workspace-paths` before resolving the workspace, project,
Direction, and coordination runtime.

Apply `kai-core-work-hierarchy` before shaping the Epic. Verify:

- contribution advances the exact Current Goal;
- scope respects Vision, Mission, and Out of Scope;
- authorities, priority, outcome, and acceptance are explicit;
- required and optional Feature IDs are disjoint and use shipped pack
  namespaces; and
- no existing Epic ID conflicts.

Present the complete proposal and exact authority request. Use `ask_user` when
the named authority is the operator. Confidence, a chat hint, or role
installation is not approval.

## Submit after approval

Stop if approval is absent, ambiguous, stale, or from another actor.

Apply `kai-core-work-stewardship` before the promotion decision.

Apply `kai-core-work-acting` immediately before the state-changing command,
then submit one `epic.create` through:

```text
node "<kai-plugin>/scripts/coordinate.mjs" apply --root "<workspace-root>"
```

Bind the runtime-computed current Direction reference. Create only a `proposed`
Epic; never activate the proposal, create descendants, change priority, or
start implementation.

Apply `kai-core-work-activity` only after the command is accepted. Report the
exact Epic ID, version, state, authorities, Direction hash, and next required
authority action.

Stop on Direction drift, scope conflict, missing authority, ID conflict,
`VERSION_CONFLICT`, `AUTHORITY_REQUIRED`, `INVALID_INPUT`, or any other runtime
refusal.

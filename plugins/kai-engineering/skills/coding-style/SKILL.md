---
name: coding-style
description: "Use when applying shared implementation defaults where repository conventions and task instructions leave appropriate details unspecified."
tools: [read, search, edit]
user-invocable: true
argument-hint: "optional file or area to apply to"
---

# Coding Style

Apply these defaults while carrying out authorized code work. They are
implementation constraints, not a separate research, planning, approval, or
reporting process. The caller continues its assigned task.

## Precedence

Explicit user requirements and repository-local conventions come first,
including established APIs, formatters, linters, and patterns. Use these
defaults only where that context is silent. A task-specific correctness,
safety, compatibility, or performance need may justify a narrow departure.

## Defaults

- Prefer the simplest readable implementation that satisfies the actual
  requirements. Use early returns or named intermediate values when they make
  control flow clearer; use dense or unusual constructs only for a concrete
  constraint.
- Choose names that reveal intent. Keep abbreviations and boolean naming
  consistent with the repository.
- Make errors, logs, and telemetry useful to the person acting on them. Follow
  the repository's error types and message conventions, and include relevant
  context without exposing sensitive data.
- Compose code where a boundary improves clarity, reuse, or independent
  testing. Keep cohesive code together; do not create helpers or components
  merely to satisfy a generic size rule.
- Write comments and documentation for a non-obvious reason, constraint, or
  public contract. Keep their detail proportionate to the code and repository;
  do not impose a global comment-line limit or restate clear code.
- Leave generated or vendored code in its owning form unless the task
  explicitly requires changing it.
- Build for the cases the requirements name. Where a future need is speculative,
  keep the current shape and leave the extension point that already exists.

## One owner per fact

A fact that must hold in more than one place gets one owner, and every other
place derives from it.

Three observable situations, and what each calls for:

- **You are adding a case to a list that another declaration already
  enumerates.** Derive the list from that declaration instead of extending the
  copy. A schema, enum, or const array that already names the members is the
  owner; a field list, validator, serializer, or help string built beside it is
  a derivation.
- **A rule must hold at every call site of some kind.** Put it on the path those
  call sites already share, so a call site added later inherits the rule instead
  of having to remember it. Repeating the rule in each handler makes the next
  handler the defect.
- **A literal restates something already declared** — a permitted-value list in
  a message or guard, a bound that mirrors a schema, a name that mirrors a
  symbol. Compose it from the declaration.

A guard that checks a value against a convention should read the same
declaration the convention is applied from, so the guard cannot drift from it.

When you touch one member of a duplicated set and deliberately leave the rest,
keep the change small and name the remaining duplicates and their drift risk in
your report, so the decision is visible rather than silent.

While editing shared state, check the merge and default paths next to your
change: spreading an explicit `undefined`, a partial object, or a default over
stored data overwrites it. If that path is reachable, pin it.

## Three outcomes, not two

A check that gates a consequential action has three possible results: confirmed
yes, confirmed no, and not established. Keep the third one distinct.

- Carry "not established" as its own value rather than folding it into either
  decision. A boolean return cannot hold it, so give the function a result type
  that can.
- Give the unestablished case the outcome that is reversible: refuse the
  privileged action, keep the stored data, leave existing state alone. Creating,
  deleting, overwriting, or granting on an unconfirmed result turns a temporary
  unknown into a permanent change.
- Treat a response as confirmation only when the call succeeded and every field
  the decision reads is present and of the expected type. A partial, malformed,
  or older-shaped payload establishes nothing, whatever its other fields say.
- When a helper throws because its input is outside what it supports, that is
  not established either.

Once the cause of an unusable value is fixed at its source, remove the tolerance
that was compensating for it. A leniency kept "just in case" next to a guard is
a way past that guard.

## Confirm the premise in the source

A task description, bug report, issue, or review comment is a claim about the
code. Before implementing it, confirm in the source that the symbols, states,
and values it names exist and behave as described, and reproduce the reported
symptom against current behavior. What the reporter saw may come from a
different mechanism than the one they named, and the real mechanism is what you
fix.

When the source does not define a state, goal, flag, or field the description
names, work from the states that do exist:

1. Report the mismatch, and say that any guard depending on the named state has
   never fired for any real input.
2. Identify which of the existing states produce the symptom the reporter saw.
3. Express the condition in terms of those existing states, and keep the
   enumeration of states unchanged.

Add a state to the domain model when the product gained that state. Adding one
because a description named it widens the product, leaves the reported symptom
unfixed, and makes the stale description authoritative.

## Claims carry their evidence

Report what you ran and what it returned, so a reader can tell a measurement
from an expectation.

- To claim a test pins a behavior, break that behavior, run the suite, and
  report the result and the restored state. A test that passes against both the
  fixed and the broken code has not pinned anything.
- To claim a bound, size, timing, or rendered result holds, measure it and give
  the number and the conditions. Where you could not measure, mark the value as
  an inference, name what would settle it, and leave it visible rather than
  reporting it as a result.
- For a change on a path that carries production traffic, say what that path
  carries and how much of it the change reaches. A correct diff on an unmeasured
  path is an unquantified risk, not a safe change.
- When your change and another in-flight change touch the same surface, check
  the combination before treating either as safe.
- Drop a change you could not substantiate rather than shipping it with the part
  you did verify. State what you did not verify as plainly as what you did.

## Say what the data supports

Text a person reads — interface copy, errors, logs, notifications, replies,
commit and review narrative — asserts only what its inputs establish.

- Describe the observation you have, not the conclusion someone might draw from
  it. Completed sessions support a statement about attendance; they do not
  support one about recovery, health, or effort.
- Never let a reply imply a success that did not happen. When part of a request
  could not be carried out, say which part, rather than reporting the whole as
  done.
- Keep the subject accurate: a claim about where data is stored is not a claim
  about privacy, and a claim about a system's behavior is not a claim about the
  user.
- Avoid wording that implies a credential, guarantee, or authority the product
  does not hold.
- Where the honest message is unwelcome, adjust the wording and the placement,
  and keep the fact.

## Removal removes

When something is being dropped, take it out along the paths it reaches —
interface, client, contracts, services, generated artifacts, fixtures, and
tests — rather than hiding it behind a flag or leaving a silent alias. A
reachable remnant is still a supported surface.

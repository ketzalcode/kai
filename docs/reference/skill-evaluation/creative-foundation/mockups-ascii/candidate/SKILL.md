---
name: mockups-ascii
description: "Use when an ASCII wireframe is requested, or an unresolved layout, placement, grouping, or information-hierarchy decision needs a structural sketch."
user-invocable: true
---

# ASCII Mockups

Make a structural, low-fidelity layout mock that helps the caller decide.
This method supplies a visual contribution, not a new design workflow.

## Applicability and inputs

Use for an explicit ASCII or wireframe request, or an unresolved structural
choice that is clearer when shown. Color, type, styling, or component feel
that determines the choice needs HTML fidelity instead. Interactive behavior
that must be exercised is a prototype request, outside this method.

Consume the approved outcome, fixed and open constraints, and relevant current
surface/state evidence. Unknown surfaces remain unknown; do not invent a
destination, screen, component, or interaction to fill the sketch. A named
placement that is a hard constraint stays fixed.

Before applying shared design or scope rules, Load `kai-core-contract-v1`.
If core is unavailable, a bounded sketch from supplied evidence may continue,
but not coordinated work or `.kai` state. Tell the operator to install or
update core before coordinated design resumes.

Apply `kai-core-design-grounding` when the sketch depends on the app's current
components, hierarchy, or patterns. Scoped supplied evidence is enough for
the bounded choice; ASCII needs no invented visual tokens.
Apply `kai-core-scope-discipline` when an alternative changes the approved
scope. Show an unadopted proposal as such; do not silently make it the choice.

## Draw the decision

1. Name the structural question and what stays fixed.
2. Show the relevant regions, grouping, order, and labels from the evidence.
3. Include only the real alternatives the decision needs. An explicitly
   requested single mock remains one mock.
4. Explain the consequential trade-off and recommend the supported in-scope
   option. Recommendation is not adoption.

For an evidenced sidebar-and-results layout, a sketch can be as small as:

```text
+--------------+-------------------------+
| List controls| Results                 |
|              |                         |
+--------------+-------------------------+
```

State that spacing and box dimensions are schematic. The sketch makes no
claim about brand styling, responsive rendering, keyboard behavior, or
production implementation.

For crowding or discoverability, consider other existing surfaces when
placement is open and those surfaces are evidenced. If no viable alternative
is known, say so rather than manufacturing an option.

## Outcome and stop

Return one inline ASCII mock with its decision-relevant explanation, or
insights only/no new mock when the supplied question needs no visual addition.
An unavailable requested mock is a named gap, not a successful no-addition
result.

ASCII is independent of HTML: no automatic HTML stage follows. Inline answers
need no browser, files, workspace, or initiative. If the caller explicitly
owes a durable design, Load `kai-core-workspace-paths` before choosing its
existing target, and Load `kai-core-asset-producing` before revising that asset.
Load `kai-core-asset-closing` only when disposition or acceptance is requested.

Stop at the mock and recommendation. The operator or explicitly delegated
designer owns the choice; an unapproved consequential choice remains pending.
The calling design task retains its own acceptance obligations and may
continue separately authorized work. Do not start implementation.

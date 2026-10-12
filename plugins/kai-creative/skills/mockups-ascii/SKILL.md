---
name: mockups-ascii
description: "Use when an ASCII wireframe is requested, or an unresolved layout, placement, grouping, or information-hierarchy decision needs a structural sketch."
publication-entrypoint: creative-workspace-publication
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

Invoke each Core skill directly at the decision that needs it. If a required
Core skill is unavailable, a bounded sketch from supplied evidence may continue,
but not coordinated work or `.kai` state. Tell the operator to install or
update core before coordinated design resumes.

Read scoped supplied or repository-native evidence when the sketch depends on
current components, hierarchy, or patterns. ASCII needs no invented visual
tokens.
When an alternative changes approved scope, show it as an unadopted proposal;
do not silently make it the choice.

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
need no browser, files, workspace, or hierarchy record. If the caller explicitly
owes a durable design, Load `kai-core-workspace-paths` before choosing its
existing target. Load `creative-workspace-publication`, then Load
`kai-core-work-acting` before recording an authorized transition for that
asset.

Stop at the mock and recommendation. The operator or explicitly delegated
designer owns the choice; an unapproved consequential choice remains pending.
The calling design task retains its own acceptance obligations and may
continue separately authorized work. Do not start implementation.

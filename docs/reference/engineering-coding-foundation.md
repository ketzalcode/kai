# Engineering coding foundation

The engineering coding foundation keeps five active skills available while
their contracts are refined one at a time. It is not a single mandatory
workflow: callers load the skill that fits the task, and each skill stays
within its own responsibility.

## Current task-local status

| Skill | Responsibility | Status in this revision |
| --- | --- | --- |
| `coding-style` | Supplies implementation conventions within already-authorized code work. | Source and caller contracts corrected; candidate handoffs showed non-regression, and the combined code boundary preserved the specified contract. |
| `research-before-coding` | Supplies a bounded evidence handoff for an explicit research request or unresolved decision-relevant question. | Source and caller boundaries corrected; v1 exposed output-shaping issues, and v2 checks remain pending. |
| `onboard-to-codebase` | Supports explicit repository orientation. | Existing body retained; refinement is later work. |
| `pr-sizing` | Supports delivery decomposition. | Existing body retained; refinement is later work. |
| `build-diagrams` | Supports an optional technical representation. | Existing body retained; refinement is later work. |

The ten document-review skills and their dependent workflow remain incubated,
outside the active plugin surface. Their incubation does not waive formal
security, privacy, reliability, or release requirements.

## Coding-style contract

`coding-style` is a small context provider:

- Explicit user requirements and repository conventions take precedence.
- Its defaults cover readable implementations, useful names and errors,
  genuine composition, and proportionate comments and documentation.
- It does not invoke another skill, create an approval gate, require a report,
  or take implementation ownership away from the caller.
- It does not impose file-reading quotas or repository-wide comment limits.
- The calling implementer continues the code task it was authorized to
  perform.

The source guard rejects the former nonexistent skill reference, process-skill
dependency, fixed quota wording, stale description, and conflicting caller
clauses. In the authoring screen, all five candidate handoffs met the same case
that all five controls and all five former-guide samples had already met. This
is non-regression, not a measured behavior improvement. One combined code
boundary preserved the supplied repository contract and caller authorization.

See
[Coding foundation authoring evidence](skill-evaluation/coding-foundation-authoring.md)
for the source-contract regression, exact sanitized outputs, boundary
assertions, and evidence limits.

## Research-before-coding contract

`research-before-coding` is an evidence method, not a production-code step:

- Explicit user invocation returns useful findings for the stated question.
- Code-writing callers route to it only when unresolved, decision-relevant
  evidence could change the approach. Ordinary targeted reading and tests
  continue without it when current evidence is adequate.
- The default output is a concise, scoped answer. Domain evidence is attached
  to each material finding, followed only by consequential implications or
  unresolved gaps. Those concerns do not require separate headings.
- Guidance about conducting research is procedural context, not domain
  evidence supporting claims about the system or external subject.
- Ownership evidence constrains authorization when relevant, but folder names
  do not grant authority and missing ownership metadata does not block
  read-only research.
- External research and experiments are conditional on the actual question and
  authorization. Missing authoritative access is reported as a gap.
- No repository-wide map, per-file taxonomy, reading quota, automatic sizing
  chain, implementation step, approval ceremony, diagram, or report format is
  required. A requested report format is used only when the user or an existing
  handoff contract requires it.
- The caller retains its original task authority and may continue separately
  authorized implementation after consuming the handoff.

The focused source guard failed against the former coding, approval, taxonomy,
quota, and unconditional-caller directives, then passed after this rewrite.
The ten baseline handoffs all returned the supplied-input findings without
source edits or ownership blocking, so they are non-regression observations,
not behavioral RED. Five v1 candidate handoffs also preserved those facts and
boundaries, but all mechanically reproduced five headings and repeated evidence
across sections. The v1 external boundary correctly reported missing evidence
without inventing vendor facts, but listed procedural guidance beside domain
sources. Those are shaping and source-role findings, not a measured poisoning
fix or fabrication finding. Five fresh v2 samples and the repeated external
boundary remain pending.

See [Coding foundation authoring evidence](skill-evaluation/coding-foundation-authoring.md)
and the
[ten sanitized research baseline handoffs](skill-evaluation/research-before-coding-baseline-samples.md).

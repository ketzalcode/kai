# Engineering coding foundation

The engineering coding foundation keeps five active skills available while
their contracts are refined one at a time. It is not a single mandatory
workflow: callers load the skill that fits the task, and each skill stays
within its own responsibility.

## Current task-local status

| Skill | Responsibility | Status in this revision |
| --- | --- | --- |
| `coding-style` | Supplies implementation conventions within already-authorized code work. | Source and caller contracts corrected; candidate handoffs showed non-regression, and the combined code boundary preserved the specified contract. |
| `research-before-coding` | Supplies a bounded evidence handoff for an explicit research request or unresolved decision-relevant question. | Source/caller boundaries and v2 evidence recorded; ready for independent review with stated shaping limits. |
| `onboard-to-codebase` | Supports explicit repository or subsystem orientation. | Source contract corrected; candidate narrow-question samples showed non-regression, and whole-repo, subsystem, and selective-refresh boundaries met their supplied cases with stated limits. |
| `pr-sizing` | Supports proportional delivery decomposition. | Source and four caller routes corrected; candidate primary and boundary evidence recorded with case-specific limits. |
| `build-diagrams` | Supports an optional technical representation. | Source, catalog companion, and six caller/template boundaries corrected; candidate authoring samples remain pending. |

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

The implementer reported that the focused source guard failed against the
former coding, approval, taxonomy, quota, and unconditional-caller directives,
then passed after the rewrite. The historical RED is not independently
reconstructable from the final diff.

The ten baseline handoffs returned the supplied-input findings without source
edits or ownership blocking, so they are non-regression observations, not
behavioral RED. Five v1 candidate handoffs also preserved those facts and
boundaries, but all mechanically reproduced five headings and repeated
evidence. Its external boundary correctly reported missing evidence without
inventing vendor facts, but listed procedural guidance beside domain sources.

Five v2 primary handoffs again preserved the facts and research-only scope.
They did not all reproduce the same five labels, but remained structured and
sometimes repetitive; these samples do not establish consistent length
reduction. One additional direct-question boundary answered in two short
paragraphs without extra procedure. The v2 external boundary identified the
real evidence gap and no longer cited procedure as domain evidence, but its
closing claim that the evidence would be enough to “finish the adapter safely”
is broader than the evidence supports. Caller before/after readers both
returned the expected no/yes interpretation, so no live or comparative
invocation change was observed.

The first public baseline export had a transcription and ID-mapping defect:
only raw output 01 occurred unchanged anywhere in that record, outputs 02–10
did not, and no baseline output matched its correct labeled block. The record
was rebuilt deterministically from `research-01.md` through `research-10.md`.
All 25 retained research outputs now match their correct labeled public blocks
after only CRLF-to-LF normalization, `trimEnd`, and four-backtick wrapper
removal.

See [Coding foundation authoring evidence](skill-evaluation/coding-foundation-authoring.md)
and the normalized raw
[baseline](skill-evaluation/research-before-coding-baseline-samples.md),
[v1 candidate](skill-evaluation/research-before-coding-candidate-v1-samples.md),
and
[v2 candidate and boundary](skill-evaluation/research-before-coding-candidate-v2-samples.md)
records.

## Onboard-to-codebase contract

`onboard-to-codebase` is requested orientation, not an automatic first-session
workflow:

- It activates only for an explicit request to orient to a repository or
  subsystem. First entry, elapsed time, or an old report alone does not
  authorize a broad scan.
- It maps only the requested scope and uses existing instructions, reports,
  requested paths, and supplied evidence before gathering more.
- Current grounded facts are reused. When real changes affect the evidence,
  only those facts are refreshed; operator notes, requested paths, and
  unrelated still-current content are preserved.
- Commands, conventions, ownership, and relationships remain unknown when the
  repository evidence does not establish them.
- The result is a useful cited map sized to the request, without a mandatory
  section quota, diagram, fixed scan depth, or generic
  refresh/augment/use-as-is approval loop.
- A durable file is written only when requested or required by an existing
  handoff contract, at the requested destination and without unexpected
  overwrite.
- Ordinary narrow coding questions continue directly without onboarding.

The focused source guard failed against the former first-entry, elapsed-time,
automatic-refresh, fixed-report-path, eight-dimension, and one-report
directives, as well as missing explicit-request, scoped-evidence, selective
refresh, preservation, output, and narrow-question boundaries. The same guard
passed after the rewrite under Node `v24.15.0`. This is structural evidence
only.

All five no-guide controls and all five unchanged-guide samples answered the
supplied narrow command and prerequisite question correctly. None initiated
onboarding, invented setup work, or requested broader repository context.
Those outputs are non-regression observations, not behavioral RED or evidence
of poisoning. All five candidate samples also answered that same narrow
question correctly, so they establish non-regression only.

The candidate-only boundaries returned a useful cited whole-repository map and
a frontend-only map without inventing unsupported deployment, persistence,
version, storage, or response-schema facts. The selective-refresh boundary
updated the supplied revision and test command, preserved the existing module
facts and exact operator note, and did not add a refresh/augment decision. Its
explanation groups the note with unchanged module hashes; the supplied evidence
supports the module hashes, while note preservation follows the user's
instruction. No note hash was verified.

See [Coding foundation authoring evidence](skill-evaluation/coding-foundation-authoring.md)
and the committed onboarding [manifest](skill-evaluation/samples/onboarding/manifest.json),
[case](skill-evaluation/samples/onboarding/case.md), no-guide controls
[01](skill-evaluation/samples/onboarding/onboarding-01.md),
[02](skill-evaluation/samples/onboarding/onboarding-02.md),
[03](skill-evaluation/samples/onboarding/onboarding-03.md),
[04](skill-evaluation/samples/onboarding/onboarding-04.md),
[05](skill-evaluation/samples/onboarding/onboarding-05.md), and unchanged-guide
samples [06](skill-evaluation/samples/onboarding/onboarding-06.md),
[07](skill-evaluation/samples/onboarding/onboarding-07.md),
[08](skill-evaluation/samples/onboarding/onboarding-08.md),
[09](skill-evaluation/samples/onboarding/onboarding-09.md), and
[10](skill-evaluation/samples/onboarding/onboarding-10.md); candidate samples
[11](skill-evaluation/samples/onboarding/onboarding-11.md),
[12](skill-evaluation/samples/onboarding/onboarding-12.md),
[13](skill-evaluation/samples/onboarding/onboarding-13.md),
[14](skill-evaluation/samples/onboarding/onboarding-14.md), and
[15](skill-evaluation/samples/onboarding/onboarding-15.md); and the
[whole-repository](skill-evaluation/samples/onboarding/onboarding-repo-output.md),
[frontend-only](skill-evaluation/samples/onboarding/onboarding-frontend-output.md),
and
[selective-refresh](skill-evaluation/samples/onboarding/onboarding-refresh-output.md)
boundaries with their linked inputs.

## PR-sizing contract

`pr-sizing` returns a delivery proposal; it does not execute the work:

- Callers load it only when authorized work actually needs decomposition,
  before implementation begins. A coherent one-delivery change does not require
  sizing.
- It returns either a no-split conclusion or ordered increments with explicit
  dependencies, landing safety, and validation.
- Tests stay with affected behavior.
- A necessary small refactor may accompany its feature. A genuinely
  independently useful or risk-reducing refactor may also stand alone.
- Earlier landed increments may support later increments while each landing
  point preserves compatibility and safety. Preparatory work need not expose
  the final user feature immediately.
- File counts, line counts, elapsed time, blanket refactor/feature separation,
  and invented rollout machinery do not decide the split.
- The skill stops at the proposal without editing code, opening pull requests,
  starting delivery, or creating a new approval ceremony.

In the committed baseline, all five no-guide controls proposed one PR for the
coherent supplied change. Unchanged-guide samples 06 and 09 required two PRs
specifically because the former guide prohibited mixing refactor and feature;
the other three unchanged-guide samples proposed one PR. This is a
case-specific observed policy effect, not evidence that two PRs or standalone
refactors are generally wrong. Some one-PR outputs used overbroad
“unshippable refactor” rhetoric; the revised policy does not adopt it.

See the sizing sample [manifest](skill-evaluation/samples/sizing/manifest.json)
for the fixed case, exact IDs, normalized text hashes, original byte hashes,
and evidence limits.

All five candidate samples
[11](skill-evaluation/samples/sizing/sizing-11.md),
[12](skill-evaluation/samples/sizing/sizing-12.md),
[13](skill-evaluation/samples/sizing/sizing-13.md),
[14](skill-evaluation/samples/sizing/sizing-14.md), and
[15](skill-evaluation/samples/sizing/sizing-15.md) proposed one coherent PR,
as did all five controls. They did not introduce an obligatory refactor-only
split or start implementation. This is a small policy-conformance observation
for the supplied case, not evidence of general superiority, safety, cost
savings, or live activation.

The standalone-refactor [case](skill-evaluation/samples/sizing/refactor-case.md)
and [output](skill-evaluation/samples/sizing/sizing-refactor-output.md)
preserved one independently useful code-health PR. The migration
[case](skill-evaluation/samples/sizing/migration-case.md) and
[output](skill-evaluation/samples/sizing/sizing-migration-output.md)
recognized compatible old/new handling, resumable backfill, and retirement
gating. It did not fully specify client rollout or data-transformation rules,
so it is a sizing outline rather than an executable or approved migration plan.

The evidence set deterministically copies five inputs and 17 outputs; the
manifest maps and hashes each file. Its declared normalization converts CRLF to
LF and collapses terminal blank lines to one LF while retaining original byte
hashes; the raw actor files were not rewritten.

## Build-diagrams contract

`build-diagrams` represents an established relationship; it is not a document
quota:

- It activates for an explicit diagram request, or when a supported component,
  call, data, state, topology, or hierarchy relationship would be clearer
  visually.
- When no visual adds information, it returns no diagram. The caller still
  completes its independently authorized prose, analysis, decision, design, or
  pull-request narrative.
- Requested formats and repository constraints take precedence where the
  destination supports them. Terminal-readable text, Mermaid in a supporting
  Markdown destination, and inline SVG/HTML in an HTML artifact remain
  distinct choices rather than one universal default.
- Nodes and edges come from the request, repository evidence, or an accepted
  decision. The skill does not invent architecture or claim renderer
  validation that was not performed.
- Detailed shapes and format rationale live in the progressively loaded
  [diagram catalog](../../plugins/kai-engineering/skills/build-diagrams/references/catalog.md).
  The architect, backend, frontend, infra, issue-analysis, and pull-request
  callers no longer require an empty diagram slot in every artifact.

The committed baseline uses one fixed UTF-8 decision with no changed
relationship and no requested visual. All five no-guide controls produced no
diagram; all five unchanged-guide samples added an unrequested diagram that
largely restated the supplied reports/readers relationship. Every flagged
output was manually read. This is a case-specific artifact tendency, not a
claim that every optional diagram is harmful or that those samples fabricated
a system.

See the diagram [case](skill-evaluation/samples/diagrams/case.md) and
[manifest](skill-evaluation/samples/diagrams/manifest.json), which links the
ten immutable outputs and records their normalized and original-byte hashes.
The focused source guard failed against the former universal quota, missing
optional-result boundaries, absent companion, and named caller/template
obligations, then passed under Node `v24.15.0` after the correction.

Candidate outputs are not part of this revision. Five primary candidate
samples, a terminal-readable relationship case, and an explicit Mermaid case
remain pending controller work. No live discovery, renderer success,
cross-model result, general quality improvement, or cost result is claimed.

# Engineering coding foundation and review incubation

**Status:** written specification approved on 2026-09-13

**Tracking:** [#211](https://github.com/RubenSaucedo/kai/issues/211)

**Scope:** five active engineering skills; ten review skills and one workflow
outside the shipped surface. Other agents retain their independent duties.

## 1. Decision

Establish a smaller, understandable software-engineering skill foundation.
Review capabilities whose scope, triggers and outputs need individual scrutiny
will remain available as development source, not as active plugin components.

This replaces the earlier proposal to immediately consolidate seven lenses
into references. No final re-entry form is predetermined: each incubated
capability may later return as a skill, a reference or a shared method, or be
retired after review.

Incubation is not a claim that those capabilities are harmful, and fewer
entries do not prove reduced context cost. It is an explicit availability and
quality boundary while their contracts are reconsidered.

## 2. Five active skill contracts

| Skill | Owns | Smallest useful outcome |
| --- | --- | --- |
| `research-before-coding` | Resolve a bounded engineering uncertainty using relevant local evidence, with external research only when the question needs it | Scoped findings, sources, implications and unresolved questions; a report only when explicitly requested or required by an existing handoff contract |
| `onboard-to-codebase` | Explicitly requested orientation to a repository or subsystem | A cited map of structure, commands, conventions and constraints; a reusable document when requested |
| `coding-style` | Concise implementation conventions that add value beyond the repository's existing instructions | Contextual coding constraints; no separate artifact or workflow |
| `pr-sizing` | Split genuinely complex work into coherent reviewable increments | A short sequence with dependency/shippability rationale, or an explicit conclusion that no split is needed |
| `build-diagrams` | Express a relevant technical relationship clearly | A diagram when useful or requested; no mandatory diagram otherwise |

Responsibility corrections:

- Research ends at findings and handoff, not "Then code." Its caller may
  continue an already-authorized implementation under the caller's instructions.
  This does not require another agent or an extra approval ceremony.
- Broad repository mapping stays in onboarding. A minor change does not trigger
  onboarding simply because the session is new.
- Coding style does not invoke research, choose feature scope, or add approval
  gates. Remove the nonexistent `single-responsibility` reference rather than
  create a skill to satisfy it.
- PR sizing proposes the split; it does not execute increments or open PRs.
- Diagram guidance owns representation, not architecture decisions or a
  universal artifact quota.

A known bounded task can proceed with ordinary targeted inspection and tests.
One-line security or data changes are not automatically low-risk. Research
depth follows unresolved facts and consequences, not file or line counts.

## 3. Incubated components

Move these ten skill directories out of `plugins\kai-engineering\skills\`:

| Skill | Re-entry review focus |
| --- | --- |
| `doc-review-rigor` | Shared grounding method, finding format and stopping point |
| `review-security-privacy` | Document concerns versus formal security/privacy judgment |
| `review-rollout-operability` | Lightweight operational insights versus release/SRE approval |
| `review-rationale` | Material premises and reasoning, not general opinion |
| `review-alternatives` | Viable choices and trade-offs without option theater |
| `review-risks-scope` | Material assumptions and boundaries without invented risks |
| `review-dependencies` | Actual consumers/commitments without coordination bureaucracy |
| `review-performance-scale` | Consequential performance claims without premature optimization |
| `review-success-metrics` | Knowable outcomes without mandatory numerical KPI sections |
| `review-ux-accessibility` | Relevant user-flow requirements versus live-product auditing |

Move `workflow-doc-review.agent.md` out of the active engineering agents
directory with them. Its main purpose depends on the incubated method/lenses;
an active shell that calls unavailable skills is not a valid substitute.

Preserve source and history. Do not redesign the incubated bodies during this
move or mark them reviewed merely because their paths changed.

## 4. Enforce inactivity through location and inventory

Use this tracked, non-runtime development location:

```text
incubator\kai-engineering\
  README.md
  skills\
    <existing-skill-name>\SKILL.md
  agents\
    workflow-doc-review.agent.md
```

The README identifies the components as inactive, records their original
locations, links #211, and states re-entry requirements. Keep existing
definition names and filenames; their location enforces the boundary.
These are inactive development drafts, not a second owning package or an
installable provider.

No plugin manifest, marketplace entry, generated pack, active roster or
automatic skill route may point into `incubator\`. Do not add a plugin manifest
there. It is deliberately outside `plugins\` and the host's normal
`.github\agents`, `.github\skills` and `.agents\skills` locations.

An `in-progress.` filename prefix inside an active directory is not sufficient:
Kai's collector still recognizes the `.agent.md` suffix. Neither malformed
frontmatter nor active placeholder definitions are disable mechanisms.

This changes the next built/updated package. It does not retroactively unload
an older installed copy. Explicitly reading an incubated source file for
development is not the same as publishing it as an available capability.

## 5. Keep consumers honest, not disabled wholesale

| Active consumer | Required adjustment |
| --- | --- |
| `principal-security`, `principal-privacy-compliance` | Remove the parked document-lens dependency; retain their existing formal responsibilities and authority limits |
| `principal-sre` | Remove the parked lens route; retain its independent reliability duties without substituting heavy ceremony for every routine change |
| `workflow-ship` | Remove the parked helper call; preserve definition-of-done and required review evidence |
| `principal-ai-researcher`, `eng-lead-technical-writing` | Stop advertising a dispatch to the inactive document-review workflow; keep their own domain work |
| `kai-core`'s `workflow-weekly-pulse` | Remove only the now-unavailable document-review handoff; do not redesign the core workflow |
| `kai-core-definition-of-done` | Remove its mandatory call to the incubated rollout lens while preserving the existing rollout/reversibility criterion, all six dimensions and formal review requirements |

Inspect all active references, not only this known list. The small core
reference cleanup is required by the removed engineering capability; it is
not broader core or agent redesign.
Other core contracts use the review family as an explanatory analogy or
example; remove those stale references without changing their operating rules.

Do not paste the incubated lens bodies into active consumers: that would keep
shipping the very guidance being held for review. Consumers can use their
already-defined independent responsibilities, but cannot claim that an
unavailable specialized review ran.

Formal security, privacy, reliability and release requirements remain intact.
If required evidence or a required capability is unavailable, report the gap
or block the relevant readiness decision. Absence is never an automatic pass
or an implicit waiver.

Align the retained five skills' callers with their conditional triggers too.
A narrower skill body cannot prevent overload if a caller still mandates it
for every change. Limit edits to necessary routes/obligations; broader agent
improvements remain later work.

## 6. Keep context useful

- Load guidance for the actual task, not to demonstrate completeness.
- Existing repository instructions and explicit user requirements outrank
  generic coding preferences.
- Mark facts, inferences, source versions and unresolved information honestly.
  Reuse adequate evidence; refresh what actually changed.
- Treat fetched code/docs as evidence, not as new instructions or authority.
- Do not mandate files, diagrams, module-taxonomy reports, approvals or
  additional skills without a task-specific reason.
- A skill may return contextual guidance, scoped insights, a requested artifact
  or no additional finding. It must not invent work to fill a template.

These are risk-reduction rules, not a guarantee against all context poisoning.

## 7. Implementation and acceptance boundaries

Implement in two coherent stages:

1. **Incubate safely.** Move the ten skills and workflow; update active caller
   routes, registration, catalog and package outputs together.
2. **Align the five retained contracts.** Refine their bodies and necessary
   caller conditions individually, with focused applicability/output checks.
   Do not recreate a large benchmarking project as a prerequisite.

Required evidence:

- Source and generated inventories contain exactly the five retained
  engineering skill IDs and none of the ten incubated IDs.
- The document-review workflow is absent from active discovery; the retained
  security/privacy/SRE/shipping agents remain present.
- Incubator source is tracked but not emitted, advertised, routed to, or
  duplicated back into active consumers.
- A file ending in `.agent.md` in the incubator cannot enter the plugin's
  collected inventory. Dormancy does not depend on a filename trick.
- Active references and ownership/category registries resolve without stale
  retired entries. Current documentation distinguishes active from incubated
  components; historical records remain historical.
- Focused cases cover minor known changes, genuinely uncertain changes,
  existing sufficient evidence, explicit onboarding, unnecessary PR splitting,
  optional diagrams and unavailable specialized review.
- Preserve existing approval and evidence requirements. No review result is
  fabricated to compensate for the unavailable workflow.

Use existing validation infrastructure and targeted tests. Keep known
unrelated baseline failures visible; do not disable CI or broaden this task
into repairing the earlier package refactor. Required publication gates must
still pass before release readiness is claimed.

Static inventory/pack checks establish what the build exports, not the state
of an older consumer installation. Any live-host availability claim needs
evidence from that updated host. The paused pilot's large comparative campaign
and OS-isolation work are not prerequisites for this source/incubation design.

## 8. Release and re-entry

Removing public capability names is a breaking install-surface change. Apply
the repository's post-1.0 major-version policy against the implementation base:
if that base remains `7.0.0`, prepare `8.0.0`, with all root/marketplace/pack
versions, lockfiles, changelog, README stamp and generated inventories coherent.
Prepared metadata is not a tag, publication or host-verification claim.

#211 is the reintroduction record. Each component needs its own responsibility,
positive and negative triggers, inputs, output/context contract, consumer,
stopping point, grounding rules, focused evidence and operator sign-off.
Restoring every old name is not a goal by itself.

The earlier [pilot plan](../plans/2026-09-12-engineering-skills-pilot.md) and its
reviewed fixtures remain preserved. Reassess their relevance to the approved
output contracts before reusing them; code-patch oracles do not alone grade
a research-only handoff.

**Implementation plan:** [Engineering Coding Foundation](../plans/2026-09-13-engineering-coding-foundation.md).
Execution is a separate handoff. No source components are deactivated by this
document.

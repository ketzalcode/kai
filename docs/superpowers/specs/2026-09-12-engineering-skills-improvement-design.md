# Engineering skills: evidence-first improvement

**Status:** written specification approved on 2026-09-12
**Source baseline:** `1a748c017a8ccfe83128edb0f2481a67d567ef0a` on `main`
**Scope:** the 15 skills owned by `kai-engineering` and their invocation seams
**Deliverable now:** this specification, not skill changes or an implementation plan

## 1. Decision and desired outcome

Improve skills by demonstrating that they help an agent finish the actual task
correctly, with proportionate context and effort. Do not equate longer
instructions with rigor, shorter instructions with quality, or successful
invocation with usefulness.

The unit of improvement is a skill's **activation, content, and integration**.
A skill with good content can still be harmful when loaded unnecessarily. A
precise description cannot prevent overloading if a caller mandates the skill
for a broader class of tasks.

Use `research-before-coding` as the first pilot. Establish a reusable evaluation
protocol and scorecard through that pilot, then assess the other engineering
skills one at a time. Apply the proven method to other packs later, before
returning to broader agent improvements.

Success means:

- Routine, already-understood fixes retain targeted investigation and regression
  coverage without acquiring unrelated discovery, ownership reports, or planning.
- Uncertain or consequential changes still receive the investigation they need.
- Skills add demonstrated knowledge, judgment, or reliable execution beyond the
  base model and the instructions already present.
- Findings, costs, limitations, and decisions can be traced to preserved evidence.

## 2. Boundaries

### In scope for the improvement workflow

- All engineering skill descriptions, bodies, examples, references, tools,
  activation conditions, exit conditions, and output requirements.
- Read-only inspection of agents and other skills that call them.
- Positive, negative, boundary, composition, and pressure scenarios.
- Minimal caller-routing corrections when evidence shows that the caller defeats
  a skill's intended gate. Each such correction must be explicitly included in
  the later implementation plan.
- Deterministic checks for mechanical defects, using existing validation
  infrastructure where possible.
- A reusable evaluation record and a final engineering-pack scorecard.

### Out of scope now

- Editing any shipped skill or agent, running the proposed behavioral campaign,
  building an evaluation service, or writing the implementation plan.
- Agent persona, role, tool-authority, or orchestration redesign.
- Reorganizing install owners, changing core coordination contracts, or rewriting
  other packs.
- Introducing mandatory sibling packs, mandatory Superpowers installation, or a
  new always-loaded "skill router" skill.
- Implementing Procedural Graphs, autonomous prompt evolution, or mandatory
  multi-agent execution.
- Weakening consent, privacy, factual grounding, regression coverage, or existing
  human approval gates to make the workflow faster.

This design complements the approved package-boundaries work; it does not claim
to complete its deferred safety, runtime, or test/CI consolidation. A caller
problem deferred to agent work remains an explicit integration limitation, not
a skill-only fix reported as complete.

## 3. What the source audit establishes

All 15 engineering skill bodies were read at the baseline revision, along with
their relevant callers and validation surfaces. Counts below include frontmatter
and examples and use whitespace-delimited words. They are source-size indicators,
not model-token counts or measurements of context actually loaded in a session.

| Skill | Words | Initial question to resolve with evidence |
| --- | ---: | --- |
| `research-before-coding` | 668 | Does its one-line exception and mandatory ownership/proposal process over-trigger on mapped local fixes? |
| `coding-style` | 696 | Which guidance adds value beyond normal model/repo conventions? Does its research dependency create unnecessary work? |
| `pr-sizing` | 596 | Do file-count triggers and absolute splitting rules misclassify coherent changes or useful dependent increments? |
| `onboard-to-codebase` | 1,045 | Does unfamiliarity imply full onboarding when a narrow task is sufficient? Are saved evidence and refresh rules useful? |
| `build-diagrams` | 1,550 | When does a diagram improve understanding, and when does a universal diagram requirement add ceremony? |
| `doc-review-rigor` | 1,090 | Which shared classification and evidence rules improve findings, and what can be loaded only as reference? |
| `review-rationale` | 558 | Does the lens expose real reasoning failures without demanding evidence for obvious premises? |
| `review-alternatives` | 580 | Does it improve consequential choices without forcing option theater for settled, reversible ones? |
| `review-risks-scope` | 593 | Does it find material omissions rather than manufacture risks or scope lists? |
| `review-dependencies` | 582 | Does it identify real consumers and dependencies without inventing teams or approvals? |
| `review-performance-scale` | 607 | Does it catch grounded performance problems while skipping cold paths with no relevant claim? |
| `review-rollout-operability` | 616 | Does it scale investigation to blast radius while preserving its distinction from SRE approval? |
| `review-security-privacy` | 619 | Does it catch material document concerns without unsupported findings or implied security sign-off? |
| `review-success-metrics` | 586 | Does it make success knowable without demanding numerical KPIs for qualitative decisions? |
| `review-ux-accessibility` | 669 | Does it reveal omitted user states without becoming a speculative live-product audit? |
| **Total** | **11,055** | **Do not assume these bodies are all loaded together.** |

### Confirmed source issues and tensions

1. `research-before-coding` applies beyond "a one-line fix in a file you already
   understand," requires module categories for touched files, and calls for a
   proposal even on small changes. That is broader than uncertainty-based
   discovery. Its practical overloading is a hypothesis supported by the
   operator's report, not yet a reproduced runtime result.
2. `coding-style` names a `single-responsibility` skill that does not exist in
   the shipped inventory. Its instructions also route research for non-trivial
   changes and require neighboring-file scans.
3. Frontend, backend, and infra agents explicitly route research in new-code
   workflows. These routes and the `coding-style` route must be tested together;
   they must not be mistaken for proof of blanket research on every bug.
4. `workflow-doc-review` has document-type "Always" groups while individual
   lenses have skip conditions. For example, a design doc gets dependencies in
   the matrix even though the dependency lens skips self-contained work.
5. Review lenses repeat the shared method and taxonomy mappings. That is a
   candidate for progressive disclosure, not proof that the repeated reminders
   have no value.
6. `workflow-issue-analysis` calls research dormant with "zero" inheriting agents,
   despite live routes elsewhere and contrary wording later in the same file.
   Record this as agent-source debt; do not expand this work into an agent rewrite.

Source anchors:

- [Research skill](../../../plugins/kai-engineering/skills/research-before-coding/SKILL.md)
- [Coding style](../../../plugins/kai-engineering/skills/coding-style/SKILL.md)
- [Document-review routing](../../../plugins/kai-engineering/agents/workflow-doc-review.agent.md)
- [Issue-analysis caller](../../../plugins/kai-engineering/agents/workflow-issue-analysis.agent.md)

The source validator checks reference resolution in particular syntactic forms,
reachability, package ownership, and host-contract conventions. It does not prove
that a reachable skill is selected appropriately or improves outcomes. Existing
tool self-tests and historical real-host A/B probes are useful prior art; neither
is a current engineering-skills usefulness benchmark.

## 4. Evidence and how far it transfers

### Writing-skills and authoring guidance

The invoked `superpowers:writing-skills` is the primary method: observe a
failure, choose a guidance form that addresses that failure, then rerun and
refine. Its guidance on discovery descriptions, examples, progressive
disclosure, and repeated micro-tests informs this spec.

Apply it with judgment:

- A discipline violation needs pressure testing; a reference needs retrieval and
  application testing. Do not impose discipline-style prohibitions on every skill.
- Wrong-shaped output needs a positive recipe. A missing element needs a
  required output slot. Conditional behavior needs an observable predicate.
- The main writing-skills instructions require tests for reference skills; its
  pressure-testing companion excludes pure references from that particular
  method. Use retrieval tests for references, not no testing.
- Prefer trigger-only descriptions starting with "Use when..." for this campaign.
  General Anthropic guidance permits "what and when"; this narrower choice is a
  deliberate, testable discovery strategy, not a universal host requirement.
- The suggested sub-200-word frequent-skill and sub-500-word general-skill sizes
  are review targets, not hard truncation gates. Preserve necessary contracts.
- Keep host-supported frontmatter such as tools and invocation metadata.
  Do not confuse the writing guide's conservative size advice with the host
  schema or remove valid fields merely to match a minimal example.

Use the live host/schema contract for mechanical compatibility. Use observed
behavior to determine usefulness. Superpowers is an authoring input to this work,
not a new consumer dependency.

### Paper 1: TDFlow

[TDFlow: Agentic Workflows for Test Driven Development, v2](https://arxiv.org/html/2510.23761v2)
separates exploration, patch repair, debugging, and test generation. It supports
distinguishing test quality from repair quality and giving a worker bounded,
actionable failure evidence.

Important limits:

- The main high-success experiments expose normally hidden human-written tests.
  They are not ordinary hidden-test SWE-bench results or proof of general
  human-level engineering.
- Dataset exclusions and differing execution coverage constrain comparisons.
- The introduction's generated-test success figure differs from the results
  table. Do not use that headline as a target for Kai.
- [Section 8](https://arxiv.org/html/2510.23761v2#S8) acknowledges rigid handling
  of faulty tests and iterations wasted without an early-stop mechanism.

**Transfer proposed here:** preserve independent acceptance criteria, give
specific failure evidence, and bound retries. Do not copy its agent topology or
make delegation mandatory for small tasks.

### Paper 2: Procedural Graphs

[Procedural Graphs: Self-Evolving Execution Structures for LLM Agents, v1](https://arxiv.org/html/2609.09153v1)
studies localized guidance and offline refinement against validation results.
Its [same-graph ablation, Table 3](https://arxiv.org/html/2609.09153v1#S5.T3),
reports the following ALFWorld results with Gemini 3.5 Flash:

| Guidance | Success | Average tokens |
| --- | ---: | ---: |
| None | 72.58% | 18,055 |
| Full graph, raw injection | 70.34% | 21,062 |
| Full graph, generated guidance | 54.48% | 96,360 |
| Local subgraph, generated guidance | 81.53% | 28,064 |

Broad guidance can hurt; localized guidance is not free. The localized arm
improves this task outcome but still spends more tokens than no graph. The study
does not measure Kai skills or establish a universal loading threshold, and the
ablation does not include local-subgraph raw injection.

Its [evolution procedure](https://arxiv.org/html/2609.09153v1#S3.SS3) uses separate
training, validation, and test data and retains rejection information. A
nondecreasing cached validation score does not guarantee improving true
performance; small samples remain noisy.

**Transfer proposed here:** compare no guidance, current guidance, and candidates;
select locally relevant context; retain rejected-edit evidence; evaluate the
selected candidate on untouched cases. Do not build a graph engine or claim
fewer tool calls necessarily mean lower total cost.

## 5. Alternatives considered

| Approach | Benefit | Limitation | Decision |
| --- | --- | --- | --- |
| Editorial cleanup against a checklist | Fast improvements to prose and consistency | Cannot establish utility, activation accuracy, or regressions | Use inside evidence-backed edits, not as the whole program |
| Evidence-first pilot followed by per-skill refinement | Distinguishes routing, content, and interaction failures; produces reusable evidence | Requires controlled runs and adjudication | **Selected** |
| Wholesale consolidation or a new routing runtime | Could remove substantial duplication | Larger migration, new failure modes, premature architecture | Defer unless the pilot establishes that local changes cannot work |

Keeping a skill unchanged, or using no task-specific skill, is a valid outcome.
There is no quota for rewritten or deleted skills.

## 6. Per-skill assessment contract

Create one assessment record per skill. This is an authoring/evaluation artifact,
not paperwork imposed on agents doing routine consumer tasks.

| Field | Required content |
| --- | --- |
| Identity | Owning package, skill name, exact source revision |
| Claimed benefit | What failure or capability gap the skill addresses |
| Type | Discipline, technique, pattern, reference, or an explicit mixture |
| Entry contract | Observable use conditions, required inputs, and explicit-invocation behavior |
| Negative conditions | Cases that should not automatically load it |
| Invocation graph | Real caller routes, transitive references, tool requirements, optional dependencies |
| Output and exit | Smallest useful result, completion signal, uncertainty escalation, no-progress stop |
| Accuracy | Grounded instructions, working references, supported commands, scope/authority limits |
| Incremental value | What is not already supplied by model competence, local conventions, core, or caller |
| Evidence | Scenario IDs, arm/model/host IDs, traces, scores, costs, failures, limitations |
| Disposition | Keep, narrow, split references, merge, automate, retire, or defer |

A disposition must name the evidence and the next decision it permits. An
unsupported impression such as "this feels verbose" is not a retirement reason.

Mechanical invariants belong in validation where practical. Judgment such as
"this dependency may change the design" belongs in conditional guidance.

## 7. Evaluation design

### Three matched arms

| Arm | Configuration | Purpose |
| --- | --- | --- |
| A: no target guidance | The evaluated skill's guidance is absent; core safety and unrelated instructions remain | Establish what the agent already does and whether added guidance earns its cost |
| B: current | Frozen current skill and relevant current caller routes | Reproduce present behavior and establish the comparator |
| C: candidate | The smallest candidate change, with any caller change explicitly identified | Measure the proposed improvement |

For discovery tests, arm A omits the target's discoverable entry and its targeted
invocation seam without adding replacement advice. It is an experimental
configuration, not a proposed production agent edit. For content tests, hold
discovery constant and compare the provided guidance. For caller integration,
run the real packaged route.

Never claim a no-guidance control if another installed skill, caller, or inherited
instruction supplies the same target guidance. Record unavoidable overlaps.
If isolation cannot be established, label the result confounded and do not use
it as causal evidence for changing or deleting a skill.

### Three distinct layers

1. **Discovery:** Does the agent load the skill on required cases and skip it on
   clear negative cases? Test metadata and real caller instructions, not just a
   request naming the skill.
2. **Execution:** When applicable and available, does the skill improve the
   actual task outcome? An agent reciting its steps is not success.
3. **Composition:** Do caller instructions, skill references, and adjacent lenses
   create contradictory gates, repeated work, irrelevant findings, or duplicate
   context? Compare a small single-pass task with routed execution where relevant.

Explicit user invocation is separate from automatic discovery: honor the request
and keep the work proportionate. Do not count that requested invocation as a
false positive or use it to prove automatic routing.

### Scenario and evidence record

Each scenario specifies its fixture revision, realistic user request, available
evidence/tools, required/optional/skip routing label, expected task outcome,
forbidden side effects, and grading rule **before** candidate editing.

Each run records:

- Scenario and repetition IDs; arm; exact model, host, skill, caller, and fixture
  versions; installed packs and process skills; relevant configuration.
- Task artifacts, executed commands, tool/skill calls, final response, and
  observable decisions. Do not request private chain-of-thought; retain only
  explanations the agent actually emits.
- Correctness and regression results, grounded findings, activation decisions,
  user interruptions, and unnecessary work.
- Available usage metrics, duration, timeouts, missing tools, and limitations.

Use fresh contexts and reset isolated fixtures between runs. Do not test in a
live consumer workspace or mutate the operator's installed plugins. A fresh
subagent is sufficient only when its inherited context and accessible skills
meet the declared arm; otherwise use an isolated host session.

The primary integration environment is core plus engineering with adequate
supplied inputs. Separately test representative coexistence with other installed
process skills, including Superpowers when used. Do not silently mix those
conditions into one score.

### Repetition, splits, and experiment budget

- Begin with A/B to establish the failure or lack of incremental benefit.
  Do not write a candidate first and reverse-engineer a favorable test.
- For behavior-shaping wording, use at least five fresh-context runs per variant,
  including the no-guidance control, on each selected micro-test.
- Separate development scenarios used to author wording, validation scenarios
  used to select candidates, and untouched acceptance scenarios used only after
  selection. Use genuinely different cases, not cosmetic renaming.
- Predeclare model/configuration, cases, repetitions, scoring, maximum candidate
  rounds, and run/token ceilings in the campaign record before spending runs.
  Default to at most three candidate revisions per skill before reassessment.
- Report every scheduled run, including tool failures and timeouts. Separate
  infrastructure failures from task failures; do not silently discard either.
- Use matched cases and alternate arm order. Inspect all failures and flagged
  automated scores. Five samples are a wording screen, not statistical proof.
- A failed acceptance case blocks promotion. Once exposed, it becomes a regression
  case; a later candidate needs fresh untouched acceptance cases.
- Run a second supported model before making cross-model claims. Otherwise label
  the conclusion specific to the tested model and host.

If A succeeds and B adds no demonstrated value, do not author more instructions
to justify the skill. Evaluate retention, narrowing, or removal instead. A
documented B failure with A succeeding can justify removing harmful guidance.

### Independent judgment and integrity

Acceptance fixtures and grading criteria are fixed independently of candidate
wording. The actor does the task; it does not decide whether its own output
passed. Prefer executable assertions for software outcomes and grounded,
blind-to-variant human or separate-reviewer judgment for document outcomes.

A suspected faulty test is investigated and recorded, not silently weakened.
Repairing a fixture requires re-baselining affected arms. Development tests can
be visible to the actor. Acceptance actors receive the task and ordinary inputs,
not the hidden grading expectations or outcomes of prior acceptance runs.

LLM judgments are supporting evidence, not an automatic truth oracle. Preserve
disagreements and have the operator resolve consequential ambiguity.

## 8. First pilot: research-before-coding

### Intended decision rule

Research depth follows **unresolved uncertainty, impact, and evidence freshness**.
Changed-line count and number of files are not proxies for those properties.

- When the fault is reproduced, the relevant local contract is understood, and
  no material uncertainty remains, do targeted reading and regression work.
  Do not automatically add a full discovery report or ownership ceremony.
- When a specific unresolved fact could change the solution, investigate that
  fact and its relevant dependencies. A library choice, unknown owner, external
  contract, or unfamiliar shared behavior can justify this.
- When new evidence reveals broader risk, expand investigation deliberately.
  A small authorization or destructive-data change is not automatically low-risk.
- When current evidence already settles the needed facts, reuse it. Refresh only
  facts affected by intervening changes.
- Stop when the decision-relevant uncertainties are resolved or when missing
  access/evidence requires a clear handoff. Do not fill a fixed file-reading quota.

This removes neither local inspection nor tests. "No research skill" means no
extra process layer, not "edit from a guess." Module ownership is relevant
evidence, not permission to bypass a task's actual authorization.

### Required scenario families

Instantiate separate development, validation, and acceptance cases from these
families; keep expected actions out of the actor's user prompt.

| Case | Expected behavior |
| --- | --- |
| Mapped local bug, failing regression, known contract, a few-line fix | Targeted read/test/fix; no automatic full research skill or proposal ceremony |
| Typo or comment correction | Direct correction; no discovery, sizing, ownership report, or unrelated artifact |
| Multi-file mechanical rename with a known tool and known consumers | Relevant mechanical verification; file count alone does not trigger broad research |
| One-line authorization change with an uncertain access contract | Investigate the access semantics; do not use size to bypass risk |
| Shared utility change with unclear consumers | Resolve reuse and consumer behavior before committing to the approach |
| New integration with unknown library/API behavior | Check authoritative behavior and local precedent; bounded findings inform the choice |
| Adequate recent research and approved design already supplied | Reuse evidence; no repeated plan approval solely because the skill loaded |
| Previously mapped area with a changed dependency/contract | Refresh the changed fact rather than trust stale evidence or remap everything |
| Local bug whose reproduction reveals cross-service behavior | Escalate based on observed uncertainty, not the original "minor" label |
| Missing relevant tool/source or unclear ownership | State the consequential gap; seek input only when it blocks a safe choice |
| Explicit request to run the research skill on a small task | Honor the invocation with proportionate work; do not inflate the task |
| Time pressure plus authority pressure plus prior sunk work | Preserve necessary investigation and regression coverage without adding unrelated ceremony |

Observe both under-investigation and over-investigation. Merely counting skipped
skills would reward an agent that never investigates anything.

## 9. Scorecard and promotion gates

Use a scorecard rather than one opaque "quality per token" score.

| Dimension | Measurement |
| --- | --- |
| Outcome | Task acceptance and regression results; for reviews, supported material findings and seeded omissions |
| Safety and scope | Authority/privacy violations, missed consequential risks, unauthorized edits/publication |
| Activation | Required-case recall and clear-negative false activation; optional cases reported separately |
| Evidence quality | Unsupported claims, invented commands/capabilities, stale-source use, reference failures |
| Proportionality | Unnecessary investigations, plans, artifacts, approval requests, and repeated work |
| Context | Discoverable metadata, loaded bodies/references, and duplicate loads, separately |
| Cost | Total input/output tokens where available, cache treatment, wall time, tool calls, subagent calls |
| Stability | Per-case/per-arm variation across repetitions and models |

Count actual recorded context loads, including repeated loading in separate
agents. Do not infer runtime savings from file size. Report characters/words as
proxies when token instrumentation is unavailable, clearly labeled. Total-token
cost includes guidance, workers, retries, and handoffs, not just the final answer.
Track offline experiment cost separately from per-task consumer cost.
An interruption required by a higher-priority task instruction or safety gate
is not unnecessary ceremony attributable to the evaluated skill.

### Pilot acceptance

Use the first three scenario families in section 8 as clear negatives and the
next three as required investigation. Development, validation, and acceptance
partitions each contain distinct cases from all six families. Also include
boundary and evidence-reuse cases in validation and acceptance.

For the frozen candidate, use at least five matched acceptance repetitions per
case in each arm. Six families, three arms, and five repetitions already require
90 acceptance runs on the primary model, before the additional cases,
micro-tests, and validation. Budget that work explicitly in the pilot plan;
do not launch an unbounded pack-wide campaign.

Require:

1. No observed safety/authority violations or missed predeclared critical checks.
2. Correct task outcomes on every clear-negative acceptance case, with no
   automatically invoked full research process or unrelated proposal artifact.
3. Required investigation in every required-case acceptance run. A concise answer
   that omits the decisive fact fails even when it sounds confident.
4. No lower observed task pass count than B in any task stratum. Compare paired
   cases as well as aggregates; do not let easy cases hide a consequential loss.
5. An observed reduction in the reproduced overloading behavior relative to B.
   Report context/cost changes alongside it. A claim of token or latency savings
   requires the corresponding measurements, not fewer words or tool calls.
6. No unresolved missing references or conflicting invocation instructions on
   the path claimed improved.

These are release-screening criteria for the tested cases, not guarantees of
universal reliability. Insufficient coverage, excessive variance, or exhausted
budget produces **inconclusive**, not "passed."

A correct candidate with higher cost can be proposed when it fixes a demonstrated
quality failure, with that trade-off explicitly approved. For an overhead-only
change, higher measured median cost or latency requires investigation before
promotion; efficiency must not be asserted selectively.

### Disposition rules

| Result | Action |
| --- | --- |
| Current skill adds reliable value at acceptable cost | Keep; avoid cosmetic churn |
| Useful on positives, harmful or wasteful on negatives | Narrow activation and test callers |
| Useful core with expensive occasional reference material | Split through progressive disclosure; retest retrieval |
| Several skills duplicate the same decision without independent value | Test a merged candidate against individual and composed controls |
| Constraint is mechanically decidable | Automate it in an existing guard where practical |
| No demonstrated benefit; removal preserves required outcomes | Propose retirement, including invocation/catalog compatibility consequences |
| Evidence is weak, confounded, or unavailable | Defer with the exact missing evidence |

## 10. Editing and rollout method after spec approval

The improvement loop is an offline authoring process, not a new runtime pipeline:

```text
Inventory + predeclared cases
             |
             v
       A/B baseline
             |
     failure or no benefit?
       /             \
      no             yes
      |               |
 retain/defer   minimal candidate
                      |
                      v
             repeated validation
                /           \
             reject        select
               |             |
         record reason       v
         bounded retry   untouched acceptance
                           /        \
                        fail       pass
                         |           |
                    rebaseline   reviewed disposition
```

Complete the pilot before expanding the campaign. Then evaluate implementation
companions (`coding-style`, `pr-sizing`, onboarding), reference-heavy diagrams,
and the shared review method with its nine lenses. This is sequencing guidance,
not authorization to rewrite every item.

For each changed skill, preserve one excellent realistic example, explicit
entry/exit conditions, and the smallest useful output contract. Move heavy
reference material out of the main body only when retrieval remains reliable.
Avoid replacing current prose with an equally large prohibition list.

Review lenses need per-lens positive/negative cases and composed review cases.
Changing a shared review method requires rerunning affected lens integrations.
Assess a single-pass reviewer as a comparator for short documents; do not assume
parallel agents improve every review.

Use existing deterministic validation and host-contract infrastructure rather
than creating a second parser. Behavioral runs can initially be operator-run in
an isolated host with durable records; do not pretend the current `npm test`
command executes them. Any necessary harness work is a separately scoped
implementation-plan item.

Each eventual shipped behavior change follows the repository release rules:
coordinated version metadata, changelog and README stamp, generated pack parity,
catalog/inventory updates where applicable, and required validation. Renaming or
retiring a public skill also needs an explicit compatibility/semver decision.
This documentation-only specification needs no release version bump.

## 11. Durable evidence and handoff

The later implementation plan should keep reusable fixture definitions and
machine-readable cases under `test\fixtures\skill-evaluation\`. Keep the
human-readable protocol and reviewed campaign scorecards under
`docs\reference\skill-evaluation\`. These are proposed locations, not directories
or a harness created by this spec.

For each accepted or rejected candidate, retain the source diff/revision, scenario
versions, selected configuration, observed failure excerpts, adjudication, and
costs/limitations. Do not commit secrets, private task data, or raw sensitive
consumer transcripts. Durable summaries must link to sanitized evidence;
machine-local raw traces alone are not reproducible acceptance evidence.

The engineering campaign is complete only when:

- Every skill has an evidence-backed disposition. If any skill is
  unevaluated/inconclusive, label the campaign partial rather than claiming a
  completed pack improvement.
- The pilot's activation/content/integration results and known limits are recorded.
- Changes to shared methods and caller gates have the relevant regression evidence.
- Other packs can reuse the protocol without depending on this conversation.
- Remaining agent-source problems are identified separately for the later agent
  improvement phase.

**Implementation plan:** [Engineering Skills Pilot](../plans/2026-09-12-engineering-skills-pilot.md).
The operator approved this specification and requested that plan on 2026-09-12.
Execution remains a separate handoff. Do not start skill edits, a full-pack
rewrite, or agent improvements from this document alone.

## References

- Invoked `superpowers:writing-skills` and its `anthropic-best-practices.md` and
  `testing-skills-with-subagents.md` companions, as supplied during this design.
- [Anthropic skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Agent Skills specification](https://agentskills.io/specification)
- [TDFlow v2](https://arxiv.org/html/2510.23761v2), especially sections 3, 4, and 8.
- [Procedural Graphs v1](https://arxiv.org/html/2609.09153v1), especially sections
  3.3, 5.4, 5.5, and the experimental appendices.
- [Package-boundaries design](2026-09-12-package-boundaries-design.md)
- [Existing test contract](../../../test/README.md)
- [Historical real-host A/B lesson](../../proposals/pack-architecture.md#availability-resolution--how-a-director-learns-a-role-is-missing)

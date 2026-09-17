# Core coordination and human-readable evidence

Date: 2026-09-16

Status: Design direction, sections, and written spec approved in conversation.
Implementation planning authorized; implementation and runtime acceptance remain
separate.

Scope: `kai-core`, with engineering and creative as its only integration targets.
The five pre-release packages are outside this design.

## 1. Decision

Keep Kai's declarative agents and skills. Add a small, local coordination runtime
that validates operational state and produces human-readable evidence views.
Copilot remains the agent host: Kai does not become a model gateway, agent server,
or replacement framework.

Separate three things that have different readers and lifetimes:

| Surface | Purpose | Reader |
| --- | --- | --- |
| Execution state | The current task, authority, inputs, blockers, and next permitted action | Runtime and the acting agent |
| Addressed threads | Questions, answers, decisions, and handoffs with stable identities | Relevant agents; humans on demand |
| Evidence | Retained observations, exact artifacts, verification results, and approval provenance | Reviewers and humans |

The model receives a bounded projection of relevant state, not the entire history.
Omitted history remains retrievable. HTML and Markdown reports are derived views,
not additional writable authorities.

The first implementation project is the **coordination and evidence foundation**.
Self-evolving procedural graphs and automatic quality-based model routing are
separate follow-on projects, not hidden requirements of the foundation.

## 2. Findings in the current repository

These findings concern the inspected checkout at `fe4b981`. They are not claims
that the proposed replacement has been implemented.

| Finding | Evidence | Consequence |
| --- | --- | --- |
| Coordinated routing still depends on product roles and retired engineering identities | `director-chief-of-staff` product discovery; `kai-core-initiative-stewardship`; `kai-core-work-acting` design acceptance | The three-package install surface is not sufficient for all current coordinated paths, despite standalone supplied-input support |
| The documented thread formats disagree | `kai-core-work-acting` uses timestamped, unbracketed QUESTION IDs; `scripts\lib\coordination.mjs` requires bracketed IDs | Questions written according to the acting contract disappear from the parser's result |
| ANSWER append does not resolve parsed question state | `parseQuestions` stops reading at ANSWER and returns the original QUESTION status | Append-only history and current question state need an explicit shared reconciliation rule |
| Lease safety is conditional, not enforced across writers | `kai-core-work-granting` explicitly documents no runtime lock and one active grantor per item/tree | Another local director can violate the coordination assumption |
| Evidence has useful metadata but no shared HTML inspection surface | Asset production/closing, work-item evidence, activity, and fleet observation are separate contracts | Humans must assemble the answer from several files and cannot treat participation as proof |
| Review identity assumes Git content | `kai-core-work-item` requires a Git `change_ref`; workspace paths allow private/external HTML and media | Non-Git assets need exact content-bound review targets without forcing private artifacts into Git |
| Model policy does not cover execution observability | Engineering/creative have pinned models; all six core agent sources omit model pins; activity omits model/token/cost fields | The intended profile is not enough to establish which model ran or whether the workflow is efficient |

The parser findings were reproduced with an in-memory Node invocation against the
existing module: the peer-contract question produced one result, the acting-contract
question produced none, and appending an ANSWER left the first result `open`.
The existing work-status self-test passed but does not cover those disagreements.

Existing strengths to preserve are independent review, builder-owned regression
tests, exact-revision acceptance, private evidence, explicit publication,
on-demand skill loading, and honest declared/derived/observed distinctions.

## 3. Alternatives considered

| Approach | Benefit | Cost or limitation | Decision |
| --- | --- | --- | --- |
| Repair Markdown contracts only | Smallest compatibility change | Concurrent updates and protocol compliance still depend on agent discipline | Useful repair work, insufficient destination |
| Local runtime plus declarative roles | Transactional coordination, compact context, inspectable evidence without a service | Explicit workspace migration and a maintained schema | Selected |
| Adopt a framework runtime | Existing scheduling/checkpoint machinery | Larger host integration, dependency, and migration surface | Not justified for this foundation |

Borrow primitives from other systems rather than importing their whole execution
model. A local runtime cannot prevent arbitrary shell edits by an agent that
bypasses it; its enforced guarantees must remain narrower than a sandbox claim.

## 4. Component boundaries

| Component | Responsibility | Does not own |
| --- | --- | --- |
| Coordination engine | Validate commands, transact state/events, reserve work, reconcile messages and approvals, compute executable work | Domain judgment or arbitrary product edits |
| Host adapter | Describe actual role/model/tool capabilities; correlate dispatch, results, and available telemetry | Inventing unavailable peers, model identity, or approval |
| Context projector | Produce bounded task-specific packets with retrievable references | Rewriting historical evidence or deciding acceptance |
| Evidence registry and renderer | Bind observations and artifacts to revisions; produce offline inspection views | Treating a screenshot, summary, or clean HTML page as acceptance |
| Engineering/creative roles | Domain work and independent verdicts under their existing authority | Changing coordination rules or accepting their own work |

Implement the runtime as short-lived local commands and reusable modules. No
resident scheduler, message broker, HTTP service, vector store, or cloud telemetry
is required. Existing runtime ownership/generation rules determine canonical and
emitted script locations; do not create duplicate handwritten implementations.

The director still sequences work through the host. The engine supplies validated
dispatch packets and rejects illegal transitions; it does not independently
purchase model calls or launch agents.

The command interface exposes inspection/projection, grant, message, handoff,
evidence registration, review, approval recording, recovery, migration, and export.
Commands return structured success or typed failure with the affected IDs and
record version. Inspection is read-only; mutations use the same validation and
transaction layer regardless of caller. Skills describe when to invoke these
operations rather than teaching agents to update SQL or generated files directly.

## 5. Authoritative state and storage

Use SQLite at `.kai\state\coordination.sqlite` under the resolved workspace.
State records and their accepted events are updated in the same transaction.
The store is one logical authority; Markdown/HTML exports are never read back as
live changes after migration. The initial database and message schema versions
are both `1`, versioned independently from the workspace manifest.

Use the supported Node runtime's SQLite facility where available. Preflight its
availability before migration or coordinated writes. Missing support is a named
runtime incompatibility, not permission to fall back silently to Markdown writes.
The implementation must validate this on the repository's supported Node versions.

Store typed records for initiatives/milestones, work items, attempts, messages,
artifacts, evidence, reviews, approvals, and operation deduplication. Retain the
current distinctions between work lifecycle, asset disposition, and asset
validity. Do not turn this project into a redesign of every initiative field.

Every state-changing operation includes an operation ID, actor/run identity,
expected record version, and applicable reservation token. The engine validates
the whole operation before committing:

- The same operation ID and same payload returns the original outcome without a
  second transition. Reuse with a different payload is an explicit conflict.
- A stale version/token, invalid transition, unknown required role, or malformed
  payload makes no partial state change.
- Event sequence numbers are monotonic within the workspace. Event history is
  append-only through the runtime API; this is not a tamper-proof audit log.
- Lock contention uses a bounded busy timeout and reports a retryable conflict.
  There is no unbounded retry loop.

Large files remain outside the database. Register them only after writing and
hashing their completed bytes. A crash before registration leaves an unregistered
artifact for reconciliation, not accepted evidence.

The initial guarantee is one machine and one local workspace store, including
multiple local processes. Network filesystems, replicated databases, cross-machine
leases, and merging live databases are unsupported. Reject known unsupported
configurations; do not claim every filesystem type can be detected automatically.

SQLite, journal/WAL side files, raw evidence, and runtime views remain private.
Backups use a consistent database snapshot, not a blind copy of a live main file.
Shared Git workflows exchange deliberate exports, not the live database.

## 6. Three-package authority and direct use

Direct engineering and creative requests continue to work without an initiative,
database, or report tree. Durable coordination activates only when requested.

For coordinated work, accepted scope and acceptance criteria may be supplied by
the operator. An initiative names its real scope authority and completion
authority; a human owner no longer silently implies a product agent acting on
their behalf. The director may record an explicitly granted decision but cannot
make that decision for its owner.

Resolve active role identities from installed capabilities. Update core's active
engineering and creative routes to current identities; do not reintroduce aliases.
Required reviewers remain requirements when unavailable. Report the exact gap
rather than weakening acceptance or installing a pre-release package implicitly.

Design acceptance may name the operator or an explicitly authorized independent
owner. Supplied briefs are inputs, not fabricated approval. The designer cannot
self-accept; the builder cannot provide its own independent code or system verdict.
New branding, paid media processing, publication, merge, release, and production
actions retain their existing human authority boundaries.

## 7. Communication and bounded context

Use one versioned envelope across live transport and durable storage:

| Field | Meaning |
| --- | --- |
| `schema_version` | Contract version |
| `message_id`, `thread_id`, `item_id` | Stable identities |
| `parent_id` | The specific message being answered or continued |
| `sender_role`, `sender_run`, `recipient` | Actual actor and addressed role or operator |
| `kind` | `question`, `answer`, `decision`, `handoff`, or `notice` |
| `created_at`, `basis_version` | Time and state revision informing the message |
| `payload` | Kind-validated content |
| `artifact_refs`, `evidence_refs` | Exact supporting records |
| `provenance` | Declared source and host correlation when available |

Question payloads retain `fact`, `decision`, `reply`, and `action`, plus blocking
status and deadline. An answer must reference an existing question. An
out-of-lane response redirects the question; it does not resolve the blocker.
Duplicate delivery is idempotent. Contradictory answers remain visible and require
the authorized owner to resolve them.

Answering a question resolves its message state and updates the item's waiting
set transactionally. When the final blocker clears, the authorized lifecycle
transition restores the recorded `resume_state`; it never infers a state from an
old handoff. Answers do not grant unrelated scope, release, or publication rights.
If the answering actor lacks transition authority, record the answer and pending
restoration, then route restoration to the authorized actor. The item stays
blocked until that operation succeeds.

Record a load-bearing question before live dispatch and persist its answer before
advancing dependent work. On a host without peers, preserve the pending request
and return an exact dispatch queue; do not simulate independent judgment.
Trivial same-run lane facts need no durable thread.

The context projector includes the outcome, acceptance criteria, authority,
current version/token, relevant dependencies, unresolved questions, current
decisions, latest handoff, and selected artifact/evidence references. It records
the event sequence through which the projection was built.

Initial limits are configurable, conservative engineering defaults: at most
24 KiB of UTF-8 projection text and eight recent relevant message summaries.
These are not token counts or empirically optimal settings. Required authority,
acceptance, blockers, and revision fields cannot be silently truncated. If they
alone exceed the budget, return a context-budget error and require explicit
decomposition or an approved larger budget. Older material is retrieved by ID.

Start with deterministic selection and structured summaries. No additional
summarizer-model call is required. If model-assisted summaries are added later,
they remain derived, source-linked, replaceable views rather than authority.

## 8. Execution, recovery, and isolation

Reserve work before dispatch. Persist the attempt and intended role/model profile
before asking the host to launch it. A lost dispatch acknowledgement is an
uncertain attempt, not evidence that nothing started; reconcile with the host
before redispatching.

Distinguish attempt status from work lifecycle. A timeout or silence can require
reconciliation without proving that the process crashed or the task failed.
Expiry alone never authorizes replay of a production, paid, or external action.

Runtime transitions can be atomic; arbitrary tool effects cannot. Record effect
intent and any available idempotency key, then reconcile observed completion.
Unknown outcomes stop dependent work until reconciled. Do not promise exactly-once
execution.

Coordinate product edits with declared touch sets and immutable baselines.
Concurrent code writers use isolated worktrees when supported; otherwise serialize
conflicting work. Separate agent conversations are not write isolation.

Review runs use the exact submitted snapshot and do not repair the reviewed
product. Host-enforced read-only tools are preferred. Where the host exposes only
instruction boundaries, label that limitation rather than claim enforcement.

## 9. Evidence and human inspection

An evidence record identifies the claim/acceptance criterion, producing run,
source/tool, capture time, exact subject reference, result, coverage limits, and
retained output references. Evidence classes remain visibly distinct:

- **Declared:** an agent or human supplied the statement.
- **Observed:** the host/tool returned the recorded observation.
- **Derived:** a deterministic operation computed it from identified inputs.

A recorded tool success is not automatically proof that the intended requirement
was covered. A model-generated narrative is not an observation of execution.
Agent-pasted command output remains declared unless the host adapter or an
authorized local recorder actually captured it. Preserve that distinction even
when the pasted text looks like a genuine tool result.
Do not retain hidden reasoning or raw full prompts as a prerequisite for auditing.
Store concise decision rationales and externally observable evidence instead.

Code review targets use immutable Git commits/trees with a pinned base. Non-Git
targets use SHA-256 digests of exact artifact bytes. Bundles use a canonical
manifest of relative paths and per-file digests; hash that manifest. Retain the
identified content, because a digest without accessible content is insufficient
for review. Mutable filenames and numeric revision labels are not exact identity.

Reviews and approvals bind both the subject reference and the applicable
brief/criteria revision. Material changes require new acceptance; earlier verdicts
remain historical. Human approvals include the actual host interaction reference
or an explicitly attributed operator-supplied record. A role name or CLI flag
alone is not authentication of a human decision.

Produce `.kai\review\coordination\<item-id>\index.html` on request and when preparing
a material approval packet. Reuse the same deterministic renderer for initiative
overviews. No per-tool-call report generation or compulsory designer dispatch.

The registry carries asset metadata for HTML/media rather than prepending YAML
to those formats. Generated reports are classified as regenerable derived review
views, stamped with the source event sequence and generation time. They do not
need a separate acceptance ceremony and cannot confer acceptance on their inputs.
Accepted human-authored conclusions remain separately governed durable assets.

The report presents, in order:

1. Outcome and current state, including blockers and missing approvals.
2. Changes and important decisions, with concise rationale.
3. Criteria-to-evidence coverage and exact artifacts.
4. Independent verdicts, superseded verdicts, and uncertainty.
5. Expandable addressed thread and execution history.
6. Requested/observed model, attempts, timing, and available usage/cost.

Include diagrams only where they clarify established dependencies or state
transitions. Use accessible tables/text alongside diagrams. Core owns the generic
report; creative owns domain craft, not a prerequisite for reading core evidence.

Reports are offline HTML with no external assets, trackers, or CDN dependencies.
Escape untrusted text, constrain local references to approved workspace paths,
and do not execute arbitrary HTML evidence inside the report. Link or provide
inert previews of source artifacts. Apply appropriate CSP and browser checks.
Missing referenced files, digest mismatches, redaction, and stale report revisions
must be visible.
Every report says it is a snapshot, not a live status page. Runtime inspection
compares its source sequence with current state and identifies stale exports;
an already opened offline file cannot automatically discover later database changes.

Raw logs, browser state, credentials, and private media never become public merely
because a report links them. Publication is a separate, authorized, redacted export.
The runtime detects supported sensitive/path patterns but does not claim perfect
secret removal.

## 10. Engineering and creative evidence contracts

| Domain | Required evidence when relevant | Not a substitute |
| --- | --- | --- |
| Engineering implementation | Base/head or immutable snapshot, changed paths, reproduction/acceptance tests, commands and results, environment limits | A builder summary or green unrelated command |
| Independent engineering review | Distinct reviewing run, criteria, exact revision, findings/verdict, coverage limits | A differently named persona in the author's run |
| Creative design | Approved brief/reference revision, exact mock/artifact, stated viewports/states, actual rendering observations, feasibility gaps | HTML source presented as inspected visual output |
| Creative media | Direction revision, source-media identities, applied operations, measured output, consent where required | Planned commands presented as rendered media |
| Creative acceptance | Independent critique against the brief/rubric and the authorized owner's revision-bound decision | A synthetic numeric creativity score |

Builders retain ownership of changed-behavior regression tests. Independent
acceptance may add checks but cannot silently weaken the requirement or alter the
product to obtain a pass. A proposed correction to an invalid acceptance test is
an explicit criteria change, not a repair-loop shortcut.

Use TDFlow-style focused diagnostic handoffs for difficult failures, not a
mandatory four-agent chain for every edit. Retry limits, unchanged failure
signatures, and unavailable prerequisites produce a specific escalation or stop.

## 11. Model policy and performance

The foundation uses reviewed, deterministic role/profile mappings. Preserve the
approved engineering/creative mappings and explicitly pin core roles according to
their actual posture. Pure routing and record manipulation should be deterministic
code, not an expensive judgment call.

Before dispatch, record the approved profile, requested model, available host
controls, attempt budget, and reason for the choice. Record the actual model only
when the host exposes it; otherwise show `unknown`, not the requested name copied
into an observed field. The same distinction applies to effort settings, tokens,
and monetary cost. Missing usage is unavailable, never zero.

A model unavailable on the host is a capability gap. An authorized fallback must
be explicit, remain inside reviewed policy, and appear in the evidence. No silent
downgrade. Current policy changes must update its reference, loader validation,
affected agents, and policy tests together.

Per-task automatic quality-based model selection is deferred. The foundation
records escalation requests and can dispatch an explicitly authorized profile
change where the host supports it; it does not claim that failure detection
identifies the best model.

Measure projection size, role/model request versus observation, attempts, timing,
and host-provided usage. Evaluate cost and latency per independently accepted
outcome, including retries, review, and any future guidance/refinement. Compare
equivalent tasks and approval criteria; shorter prompts or fewer steps alone do
not establish a speedup.

## 12. Migration and compatibility

Introduce workspace schema `4`, replacing the inspected schema `3` for
SQLite-backed coordinated state. Migration is explicit and offline with no active
leases/attempts. It:

1. Resolves the existing workspace and verifies a consistent backup.
2. Parses existing items and both documented thread-header forms.
3. Preserves IDs, original source text, timestamps, artifact paths, and historical
   reviews without upgrading their provenance.
4. Flags unresolved owners, ambiguous answers, missing content, and unsupported
   revisions for repair; it never invents acceptance or aliases a retired role.
   Affected records are non-dispatchable until repaired, without erasing history.
5. Builds and validates the new store, then activates its schema/manifest only
   after the complete import succeeds.
6. Retains the old source snapshot read-only and generates clearly marked views.

Interrupted migration leaves the original workspace authoritative until activation.
After activation, all coordinated writes go through the runtime. Old hosts must
refuse the new schema rather than write legacy Markdown. Manual edits to generated
views are reported as drift, not imported as decisions.
The existing `kai-core-contract-v1` discovery response remains unchanged. Runtime
capability/version preflight is separate; a successful discovery probe does not
establish support for workspace schema 4 or the coordination command protocol.

Schema-3 workspaces remain inspectable without migration. The new runtime refuses
coordinated writes to them; direct domain work remains available. Before any new
runtime work, rollback may restore the migration backup. After new events exist,
rollback requires explicit export/reconciliation; it cannot silently discard them.

Existing `shared` mode changes semantics for operational writes: SQLite remains
local/private and Git carries deliberate snapshots. This is a breaking change,
not a transparent distributed replacement.

## 13. Delivery and acceptance

Keep this foundation independently useful without procedural learning or a model
router. Its implementation can land in coherent slices: repair three-package
authority and legacy parsing; add the transactional engine/migration; integrate
dispatch and context; add evidence views; complete model metadata and acceptance.
Each landing must state what is usable rather than imply incomplete wiring works.

Use the existing Node self-test conventions and existing browser infrastructure.
Do not introduce a new test runner or observability service for this work.

| Acceptance case | Required result |
| --- | --- |
| Core plus engineering, no product | Supplied authorized scope can progress through real independent review without retired-role routes |
| Core plus creative, no product or engineering | Supplied design/media inputs work; genuinely missing feasibility or independent acceptance remains explicit |
| Combined engineering/creative change | Exact design, implementation, review, and approval references remain connected |
| Documented legacy thread forms | Both import; valid answers reconcile once; out-of-lane/conflicting answers do not clear blockers |
| Concurrent same-item claims and duplicate delivery | Only a valid transaction wins; no duplicate transition or lost accepted message |
| Interrupted migration/dispatch/registration | Recoverable state; no invented completion or blind replay |
| Changed code, artifact, or criteria | Old acceptance remains historical and cannot satisfy the new gate |
| Long thread | Projection stays within configured limits or returns an explicit budget error; required facts are not silently dropped |
| Offline evidence report | Readable at narrow/wide sizes, keyboard accessible, no external requests or executed evidence payloads |
| Missing evidence or host telemetry | Visible unknown/gap, not green completion or zero usage |
| Model unavailable or changed | Explicit capability/fallback record, no false observed-model claim |
| Legacy/direct request | Read-only legacy inspection and ordinary standalone domain work remain available |

Run behavioral scenarios against actual installed host capabilities before claiming
host compatibility or model/latency improvements. Synthetic schemas and passing
source checks alone do not establish those outcomes. Any billed or external
processing stays within separately approved operator budgets.

No pre-release package source is part of the implementation investigation or
refactor. Shared contract compatibility risks must be reported, not silently
repaired there or hidden by disabling CI. Mandatory generated release metadata
may still span all retained packages under repository policy.

This document alone needs no version bump. The implemented storage/coordination
break requires a major release under the current post-1.0 policy, synchronized
manifests, changelog/README updates, generated outputs, and existing release gates.
Select the exact version from the checkout at implementation time.

## 14. Research basis and limits

The exact paper versions below were inspected. These are reported research
results, not reproduced Kai measurements.

| Source | Borrow | Important limit |
| --- | --- | --- |
| [SKILL.state: Scalable Long-Horizon Agent Skills, 2608.26263v3](https://arxiv.org/html/2608.26263v3#S3) | Immutable procedure plus current structured state and latest observation; validated updates | Boundedness requires bounded contents, not merely fixed keys. Its auditing/provenance limitation and single-agent evaluation preclude using it as the entire coordination architecture |
| [Procedural Graphs, 2609.09153v1](https://arxiv.org/html/2609.09153v1#S3) | Local procedural guidance, graph frozen within a run, offline candidate evaluation and retained rejection evidence | Soft guidance is not authorization. Total tokens exceeded no-guidance baselines by 33.4% and 55.4% in its reported efficiency comparison; harmful priors can reduce success |
| [TDFlow, 2510.23761v2](https://arxiv.org/html/2510.23761v2#S3) | Specialized failure reports, constrained repair loops, role-specific models | Its 94.3% Verified result uses supplied human-written tests and excludes some instances. Generated-test results report 68.0% in the table/discussion versus 69.8% in the introduction; neither is a creative-quality result |

SKILL.state explicitly discusses history-as-output limitations in
[section 7](https://arxiv.org/html/2608.26263v3#S7).
Procedural Graphs' efficiency comparison is in
[section 5.5](https://arxiv.org/html/2609.09153v1#S5.SS5).
TDFlow's settings and results are in
[section 4](https://arxiv.org/html/2510.23761v2#S4).
None evaluates Kai's proposed HTML evidence interface.

Primary open-source implementations were inspected at these snapshots:

| Source | Relevant mechanism | Boundary |
| --- | --- | --- |
| [LangGraph, `230927fb`](https://github.com/langchain-ai/langgraph/blob/230927fb3a9ac9b2893a30322b4dfea7cdea9a8f/libs/langgraph/langgraph/types.py#L704-L719) | Addressed sends, state/checkpoints, interrupt/resume | A checkpoint thread is not a peer mailbox; interrupt resume re-executes a node, so side effects still require care |
| [OpenHands SDK, `b553bb47`](https://github.com/OpenHands/software-agent-sdk/blob/b553bb47741f4bd44749513a41e69e76073ca42f/openhands-sdk/openhands/sdk/event/base.py#L20-L40) | Typed parent-linked events, persisted conversations, source-linked context condensation | Separate conversations share a working directory by default; persistence is not product-write isolation |
| [CrewAI, `64ab0112`](https://github.com/crewAIInc/crewAI/blob/64ab0112bd3e065ed715fbf5ed7d89fad7032ec8/lib/crewai/src/crewai/task.py#L152-L208) | Selected upstream context, task ownership, structured outputs, pending human feedback | Guardrail retries call the same agent and are not independent review |

Further implementation anchors:

- [LangGraph interrupt re-execution](https://github.com/langchain-ai/langgraph/blob/230927fb3a9ac9b2893a30322b4dfea7cdea9a8f/libs/langgraph/langgraph/types.py#L851-L871).
- [OpenHands source-linked condensation](https://github.com/OpenHands/software-agent-sdk/blob/b553bb47741f4bd44749513a41e69e76073ca42f/openhands-sdk/openhands/sdk/context/condenser/llm_summarizing_condenser.py#L242-L245).
- [OpenHands shared child working directory](https://github.com/OpenHands/software-agent-sdk/blob/b553bb47741f4bd44749513a41e69e76073ca42f/openhands-tools/openhands/tools/task/manager.py#L314-L325).
- [CrewAI same-agent guardrail retry](https://github.com/crewAIInc/crewAI/blob/64ab0112bd3e065ed715fbf5ed7d89fad7032ec8/lib/crewai/src/crewai/task.py#L1382-L1414).

These frameworks do not establish automatic quality-driven model escalation or
maker/checker independence for Kai. Hosted observability offerings are not part of
this local baseline. External source/tests were inspected, not executed; no
framework was installed and no private repository content was sent to them.

## 15. Deferred work

Procedural graphs may later encode repeatable engineering repair and creative
production procedures. Freeze each graph version during a run; evaluate candidate
changes offline on held-out cases; retain rejected candidates and rollback
information. Never let graph edits alter human gates, tool authority, or acceptance
requirements. Creative exploration must not be forced into a rigid test-repair
graph.

Automatic quality-aware model escalation requires an evaluation corpus, cost
accounting, and host support first. Distributed coordination, cross-machine
replication, a live dashboard service, and pre-release-package adoption require
their own designs. None blocks the local foundation.

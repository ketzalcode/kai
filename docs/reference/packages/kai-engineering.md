# kai-engineering

Thirteen engineering agents for direct work with **kai-core plus
kai-engineering**. The current source prepares `10.0.0`; it is not a published
release, installed-host acceptance or completed cross-agent migration.

## Direct use

Supply the task, scope and available evidence directly. No product brief
producer, designer, engineering manager or director must be installed.
Ordinary code changes and inline assessments do not require `.kai`
initialization, an initiative, a work item or a standalone report.

Required evidence is still required: an absent independent review, approved
design explicitly required by the task, production deployment confirmation or
legal/risk decision remains a gap. Supplied evidence is not a substitute for
independence, and missing agent installation never creates a waiver.

Choose a role by its output, not a mandatory sequence:

| Agent | Direct output | Profile / model |
| --- | --- | --- |
| `eng-advisor-investigation` | Bounded issue/code/research findings; requested orientation or AI briefing | technical-judgment / `gpt-5.6-sol` |
| `eng-lead-architecture` | Consequential system decision and, when needed, an ADR | technical-judgment / `gpt-5.6-sol` |
| `eng-builder-software` | Coherent frontend/backend/data/AI implementation and its tests/evaluations | execution / `claude-sonnet-5` |
| `eng-builder-platform` | Pipeline/IaC/runtime configuration and safe validation evidence | execution / `claude-sonnet-5` |
| `eng-reviewer-code` | Independent revision-bound requirements and code-quality findings | technical-review / `gpt-5.6-terra` |
| `eng-reviewer-quality` | Independent browser/API/CLI/assembled-system acceptance evidence | technical-review / `gpt-5.6-terra` |
| `eng-reviewer-security` | Threat/control assessment and independent security verdict | technical-review / `gpt-5.6-terra` |
| `eng-reviewer-reliability` | Reliability contracts, recovery and readiness assessment | technical-review / `gpt-5.6-terra` |
| `eng-reviewer-privacy-compliance` | Obligation analysis and independent compliance assessment | review / `claude-opus-5` |
| `eng-lead-technical-writing` | Developer documentation or editorial assessment | judgment / `claude-opus-5` |
| `workflow-pull-request` | Authorized PR preparation and live merge-readiness assessment | procedure / `claude-sonnet-5` |
| `workflow-ship` | Release readiness and, for valid coordinated items, evidenced lifecycle updates | procedure / `claude-sonnet-5` |
| `workflow-incident-response` | Bounded incident command, timeline and human action packets | procedure / `claude-sonnet-5` |

Models follow the existing approved core policy, not per-task automatic model
selection. An unavailable model or browser tool is a host limitation to report.
Neither a model name nor shorter prompts establishes a measured speedup.

## Skills and proportionality

The same five local skills remain available; no new skill dependency is added.
Domain-specific obligations remain concise craft in the relevant agent, rather
than four old prompts concatenated into a builder.

| Skill | Activation | Not an activation |
| --- | --- | --- |
| `coding-style` | Repository/task instructions leave implementation conventions unspecified | Permission to override the repository |
| `research-before-coding` | An explicit research request or unresolved decision-relevant question | Every code edit |
| `onboard-to-codebase` | Explicit repository/subsystem orientation | First entry or an ordinary narrow question |
| `pr-sizing` | Accepted work needs meaningful delivery decomposition | One coherent change or a plan-only request becoming implementation |
| `build-diagrams` | Explicit diagram request or supported relationships materially clearer visually | Every structure/flow change or a diagram quota |

Core authority, assessment, PR, workspace and artifact contracts are loaded at
the action that needs them. There is no eager skill manifest. Core workspace,
lease and activity methods apply to requested durable/coordinated work, not an
automatic ceremony for an inline answer.

## Ownership preserved

Builders own changed-behavior regression tests, including AI evaluations and
pipeline verification. Independent reviewers do not repair the product they
assessed. Code review does not replace assembled-system QA, security, reliability,
privacy or an explicitly required design approval.

Investigation and code review return findings to the caller by default. Their
edit tools permit requested assessment outputs and properly granted coordination
records only, never product remediation. Shell/edit access is not a filesystem
sandbox; the no-self-remediation contract supplies the boundary. A coordinated
reviewer holds the grant and records its own revision-bound verdict and handoff;
it does not ask its implementer or grantor to manufacture acceptance for it.

PR preparation is distinct from release acceptance. Release assessment without
a coordination item cannot claim a formal state transition. Production actions,
merge, release/tag, risk acceptance, legal decisions and external incident
communications retain their human gates. Incident command cannot turn an
emergency into permission for unapproved persistent changes.

## Retirement mapping and deferred wiring

This is a breaking identity cleanup with no aliases. Old identities below are
historical migration labels, not active invocation names.

| Previous responsibility | Current home |
| --- | --- |
| SWE frontend/backend, applied-AI proposal, data engineer | Software builder; substantial structural decisions remain architecture work |
| SWE infrastructure | Platform builder |
| SWE architect | Architecture lead |
| Issue analysis and AI researcher | Engineering investigation |
| UI QA | Quality reviewer, broadened beyond browser surfaces |
| Security, SRE, privacy/compliance | Corresponding independent reviewers |
| SWE manager | Accepted-scope decomposition via sizing and architecture; no new coordinator |
| Localization | Builder i18n, quality locale checks and source-language documentation/translation preparation |
| Solutions architect | Single unchanged identity in kai-revenue; no engineering duplicate |

The user explicitly deferred wiring between agents. Other packages, shared
coordination examples/contracts and existing item owners may still name retired
identities. They are not rewritten or silently aliased in this pass. Before
coordinated use, resolve the actual owner and revision-bound review requirements;
if routing cannot be resolved, report the gap instead of simulating a peer.

The global validator continues to expose these references. No ignore list,
missing-owner fallback or disabled CI gate makes this phase release-ready.
The pre-change baseline already had 53 source-validator errors and a
pack-preview self-test `TypeError`; those unrelated problems are separate.

## Evidence and ongoing feedback

The structural tests exercise the discovered and emitted roster, approved
frontmatter/model/tool shape, local/core skill routes and unchanged five-skill
contracts. They do not establish host invocation, semantic instruction
following, browser availability, lower latency/cost or model quality.

On this source revision, both engineering self-tests pass, along with catalog
parity, generated-pack parity, host-frontmatter inventory, release-guard
self-tests and syntax checks. `npm test` stops at 293 global validator errors:
the 53 pre-existing errors plus 240 references to retired engineering identities.
None is reported against an engineering agent source file. The full chain is
not green and later commands in that chain do not run after the failure.

Independent review found an invalid grantor-written assessment-record shortcut.
Investigation and code review now have narrowly scoped evidence/coordination
write authority and record their own granted work under the core contract;
scoped re-review accepted that correction. This does not imply a filesystem
sandbox or completed fleet wiring.
Separate static review of the seven risk-review and delivery/incident agents
found no significant issues. The late assessor-registry, onboarding-ownership
and active dispatch-fixture corrections also received scoped review without
significant findings.

Ongoing direct-use feedback replaces a prerequisite pilot. Useful feedback names
the role, request, supplied inputs, actual behavior, expected behavior and the
exact failure or unnecessary step. Check ordinary fixes, requested orientation,
plan-only requests, independent review, missing evidence, API-only QA, locale
coverage and release assessment without an initiative. No synthetic persona
simulation counts as independent acceptance.

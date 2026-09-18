[kai](../../README.md) / [Docs](../README.md) / Agents & skills

# Agents & skills

<!-- GENERATED FILE — do not edit by hand.
     Source: agent/skill frontmatter + the CATEGORIES table in
     scripts/generate-catalog.mjs. Regenerate with `npm run docs:generate`;
     `npm test` fails if this file drifts from the shipped surface. -->

The repository ships **22 agents** and **36 skills**.

The default marketplace supplies **22 agents** and **36 skills** through core, engineering, and creative (11 skills are directly user-invocable when their owning package is installed). A default listing is not a release or runtime-readiness certification.

Each description is the source agent or skill's own `description:`.
Capabilities parked under [`incubator/`](../../incubator/README.md) are
deliberately absent from this catalog: they are not installed, not loaded,
and not available through any install path.

- **Not sure who to ask?** [How kai works](../how-kai-works.md) has the trigger table.
- **Want to see it running?** [`examples/e2e-feature-delivery/`](../../examples/e2e-feature-delivery/).

## Agents

### Workspace foundation

Set a workspace up and keep its structure honest.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`workflow-workspace-init`](../../plugins/kai-core/agents/workflow-workspace-init.agent.md) | `kai-core` | Creates or validates kai workspace state and guides the core-first split-pack install when requested. Verified after each step, non-destructive, and idempotent. |
| [`workflow-initiative-init`](../../plugins/kai-core/agents/workflow-initiative-init.agent.md) | `kai-core` | Creates a scope-gated kai initiative workspace with north star, milestones, artifact paths, work records, and threads. Use when a new mission or initiative starts. Not execution before PM scope approval. |
| [`workflow-self-check`](../../plugins/kai-core/agents/workflow-self-check.agent.md) | `kai-core` | Writes a tiered structural-health report for kai plugin files covering inventory, naming, descriptions, references, overlap, responsibility, and discoverability. Use for kai self-audit. Not auto-restructuring. |

### Direction

Delivery coordination, on explicit request. Nothing has to be routed through it.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`director-chief-of-staff`](../../plugins/kai-core/agents/director-chief-of-staff.agent.md) | `kai-core` | Coordinates Kai roles to drive an outcome, work item, initiative, or incident to truthful completion. Use when asking someone to ship, run, or drive work. Not personal agenda or task management. |

### Engineering

Direct technical decisions and complete implementations. Architecture is situational; domain methods do not require separate agents.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`eng-lead-architecture`](../../plugins/kai-engineering/agents/eng-lead-architecture.agent.md) | `kai-engineering` | Resolves expensive software decisions across components or services: boundaries, contracts, data ownership, and system trade-offs. Use when local implementation judgment is insufficient. Not delivery coordination, production code, or independent security/readiness approval. |
| [`eng-builder-software`](../../plugins/kai-engineering/agents/eng-builder-software.agent.md) | `kai-engineering` | Implements a scoped software change end-to-end: frontend, APIs, persistence, data pipelines, or applied AI, with its tests. Use for features, fixes, and refactors. Not independent review, platform provisioning, or production deployment. |
| [`eng-builder-platform`](../../plugins/kai-engineering/agents/eng-builder-platform.agent.md) | `kai-engineering` | Implements CI/CD, IaC, containers, build tooling, runtime configuration, and observability with plan or dry-run evidence. Use for platform changes. Not application implementation, independent readiness approval, or production operations. |

### Intake & delivery

Bounded investigation, PR preparation, and release evidence. Direct calls work without a team pipeline; coordinated wiring is separate. Kai never merges or deploys itself.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`eng-advisor-investigation`](../../plugins/kai-engineering/agents/eng-advisor-investigation.agent.md) | `kai-engineering` | Investigates a bounded issue, codebase question, technical option, or AI research topic and returns cited findings and unknowns. Use when evidence is missing. Not implementation, independent acceptance, or automatic delivery planning. |
| [`workflow-pull-request`](../../plugins/kai-engineering/agents/workflow-pull-request.agent.md) | `kai-engineering` | Packages one finished diff into an authorized branch, commits, push, and pull request, then reports live merge readiness. Works directly from a supplied change. Never merges, tags, releases, force-pushes, or bypasses protection. |
| [`workflow-ship`](../../plugins/kai-engineering/agents/workflow-ship.agent.md) | `kai-engineering` | Assesses release readiness directly or, for authorized coordinated work, records PREPARE, deployment start, completion, production verification, rollback, and shipped transitions. Never deploys, merges, pushes, tags, migrates, triggers CI, or monitors continuously. |

### Trust & reliability

Independent judgment on security, privacy, reliability, and live incidents.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`eng-reviewer-security`](../../plugins/kai-engineering/agents/eng-reviewer-security.agent.md) | `kai-engineering` | Independently reviews an exact change, design, or supplied security evidence for credible threats, control adequacy, and residual risk. Use for defensive security assessment. Never exploits, remediates the product, certifies compliance, or accepts risk. |
| [`eng-reviewer-privacy-compliance`](../../plugins/kai-engineering/agents/eng-reviewer-privacy-compliance.agent.md) | `kai-engineering` | Independently reviews an exact change, processing activity, policy, or vendor evidence against named privacy and compliance obligations. Produces source-cited gaps; never gives legal certification, handles real personal data, remediates the product, or makes counsel decisions. |
| [`eng-reviewer-reliability`](../../plugins/kai-engineering/agents/eng-reviewer-reliability.agent.md) | `kai-engineering` | Independently reviews an exact service, change, or supplied operational evidence for customer reliability, recovery, capacity, observability, and readiness. Never performs production actions, commands incidents, or invents measured targets. |
| [`workflow-incident-response`](../../plugins/kai-engineering/agents/workflow-incident-response.agent.md) | `kai-engineering` | Maintains one incident command picture from supplied operational, security, data, or availability facts: impact-based SEV, status, timeline, hypotheses, human action packets, recovery evidence, and closure. Never performs production actions, sends messages, declares breaches, or monitors continuously. |

### Technical writing

Engineering-owned documentation, editorial assessment, and source-language localization preparation.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`eng-lead-technical-writing`](../../plugins/kai-engineering/agents/eng-lead-technical-writing.agent.md) | `kai-engineering` | Authors or reviews substantial developer documentation: READMEs, guides, tutorials, API reference, decisions, and release notes. Use for documentation structure, accuracy, or editorial acceptance. Not product scope, translation certification, independent code review, or publishing. |

### Creative

Design and video judgment from supplied needs and evidence, plus bounded demo production from approved direction and existing media.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`creative-lead-design`](../../plugins/kai-creative/agents/creative-lead-design.agent.md) | `kai-creative` | Designs or critiques product interactions, visual hierarchy, applied design systems, and visual identity from approved needs and positioning. Use for UI, UX, brand-system, or revision-bound design review. Not product priority, positioning, frontend implementation, or unilateral brand adoption. |
| [`creative-lead-video`](../../plugins/kai-creative/agents/creative-lead-video.agent.md) | `kai-creative` | Directs a video's audience, message, narrative, scenes, shots, script, or demo screenplay from supplied facts and media evidence. Use for proportional video direction or critique. Not recording, rendering, synthesis, mixing, or publication. |
| [`workflow-creative-demo-production`](../../plugins/kai-creative/agents/workflow-creative-demo-production.agent.md) | `kai-creative` | Produces an authorized demo from supplied media and approved direction, using only requested alignment, focus, composition, and format operations. Runs when production inputs already exist. Not capture, invented direction, or publication. |

### Implementation & system review

Independent code review and browser/API/CLI/system acceptance. Implementers retain ownership of their regression tests.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`eng-reviewer-code`](../../plugins/kai-engineering/agents/eng-reviewer-code.agent.md) | `kai-engineering` | Independently reviews an exact code change for requirements, correctness, contracts, regressions, and test adequacy. Use for a diff, PR, or implementation review. Returns evidence-based findings; never repairs the code or substitutes for specialized risk acceptance. |
| [`eng-reviewer-quality`](../../plugins/kai-engineering/agents/eng-reviewer-quality.agent.md) | `kai-engineering` | Independently reviews assembled acceptance across browser, API, CLI, and system surfaces for objective defects and requirement coverage. Preserves UI, accessibility, localization, and RTL checks when relevant. Never patches the product or owns regression tests. |

### Private workspace signals

Core-owned weekly synthesis and explicitly requested signal scans.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`workflow-weekly-pulse`](../../plugins/kai-core/agents/workflow-weekly-pulse.agent.md) | `kai-core` | Produces a concise weekly activity digest via kai-core-pulse-digest while keeping source bindings private. Use when the operator asks for a week-in-review. Not posting, pushing, or mutating sources. |
| [`workflow-proactive-scan`](../../plugins/kai-core/agents/workflow-proactive-scan.agent.md) | `kai-core` | Emits a read-only notification payload for newly actionable @operator signals and release-ready items. Use when an external scheduler runs a selected kai workspace scan. Not autonomous replies, approvals, commits, or deploys. |

## Skills

Skills are methods and contracts. Most are not invoked directly —
an acting agent loads each one on demand, at the exact instruction that needs it.

### Workspace & scope

The shared contracts every acting agent loads: where work goes, and what it may change.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-operating-rules`](../../plugins/kai-core/skills/kai-core-operating-rules/SKILL.md) | `kai-core` | The universal rules every kai role follows: role kinds, staying in lane, test ownership, human-only gates, shipping honesty, and @operator. Load whenever acting as a kai role. |
| [`kai-core-workspace-paths`](../../plugins/kai-core/skills/kai-core-workspace-paths/SKILL.md) | `kai-core` | Defines workspace resolution, the private .kai layout, publication, storage modes, and the artifact path convention. Use when resolving a root or choosing an artifact path. |
| [`kai-core-workspace-initiative`](../../plugins/kai-core/skills/kai-core-workspace-initiative/SKILL.md) | `kai-core` | Defines initiative artifact layout, coordination and closure, personal state, and the schema-3 manifest. Use when working inside an initiative or validating a .kai manifest. |
| [`kai-core-workspace-onboarding`](../../plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md) | `kai-core` | Initializes and validates kai workspaces, and guides explicit migration to the split pack install surface. Use when installing kai packs or creating or repairing workspace state. |
| [`kai-core-work-activity`](../../plugins/kai-core/skills/kai-core-work-activity/SKILL.md) | `kai-core` | Defines fine-grained agent activity signals. Use when agents need append-only start, progress, stop, deadline, and silence reporting in .kai/activity.jsonl. |
| [`kai-core-fleet-observation`](../../plugins/kai-core/skills/kai-core-fleet-observation/SKILL.md) | `kai-core` | Kai subagent fleet observer guide. Use when the operator wants to launch or interpret the live watcher and inspect which roles did or did not participate. |
| [`kai-core-definition-of-done`](../../plugins/kai-core/skills/kai-core-definition-of-done/SKILL.md) | `kai-core` | Release-readiness and production-completion gate. Use when deciding whether work can move to in-review, release-ready, or shipped. |
| [`kai-core-scope-discipline`](../../plugins/kai-core/skills/kai-core-scope-discipline/SKILL.md) | `kai-core` | Use when a finding or proposed change may expand approved scope, or when a direct advisory request needs an unadopted proposal rather than implementation. |
| [`kai-core-no-self-remediation`](../../plugins/kai-core/skills/kai-core-no-self-remediation/SKILL.md) | `kai-core` | Assessor write-boundary contract. Use when a review or assessment role must report findings without mutating the target under review. |
| [`kai-core-issue-analysis`](../../plugins/kai-core/skills/kai-core-issue-analysis/SKILL.md) | `kai-core` | Issue-to-approach analysis. Use when grounding an issue, testing decisive assumptions, framing options, and stopping at the authorized decision owner. |
| [`kai-core-initiative-stewardship`](../../plugins/kai-core/skills/kai-core-initiative-stewardship/SKILL.md) | `kai-core` | Initiative steward contract. Use when managing north-star state, proposals, priorities, item records, milestones, or closure for an initiative. |
| [`kai-core-peer-communication`](../../plugins/kai-core/skills/kai-core-peer-communication/SKILL.md) | `kai-core` | Peer-question packet contract. Use when kai roles need a real QUESTION/ANSWER exchange over inline consult, peer transport, or durable item thread. |
| [`kai-core-contract-v1`](../../plugins/kai-core/skills/kai-core-contract-v1/SKILL.md) | `kai-core` | Reports that kai-core is installed and which contract version it provides. Use just in time before a department agent invokes its first other kai-core skill. |

### Work coordination & artifacts

How an acting agent claims, leases, and tracks a work item, and how it produces and closes the artifacts that work leaves behind.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-work-acting`](../../plugins/kai-core/skills/kai-core-work-acting/SKILL.md) | `kai-core` | Defines how a dispatched agent acts on work it already holds: verify-before-write, collision, handoff, question, and review-routing protocols. Use when acting on a granted item. |
| [`kai-core-work-granting`](../../plugins/kai-core/skills/kai-core-work-granting/SKILL.md) | `kai-core` | Defines how the single lease grantor selects, claims, and reconciles work: leases, lifecycle, recovery, dispatch, backlog, board. Use when granting or reconciling work. |
| [`kai-core-work-item`](../../plugins/kai-core/skills/kai-core-work-item/SKILL.md) | `kai-core` | Defines the durable work-item record: its schema, field rules, and Outcome/Acceptance/Evidence templates. Use when creating or updating a work item. |
| [`kai-core-asset-producing`](../../plugins/kai-core/skills/kai-core-asset-producing/SKILL.md) | `kai-core` | Defines how a run produces and closes out a durable asset: pre-dispatch declaration, disposition and validity state, metadata, revision, supersession, and migration. |
| [`kai-core-asset-closing`](../../plugins/kai-core/skills/kai-core-asset-closing/SKILL.md) | `kai-core` | Defines the verdicts over an existing asset: four-dimensional completion, acceptance authority, freshness, placement and promotion, and initiative closure. |

### Agent authoring

Classify, name, scope, and validate a new or redesigned Kai role before it joins the fleet.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-create-agent`](../../plugins/kai-core/skills/kai-core-create-agent/SKILL.md) | `kai-core` | Creates or refines one Kai agent from a tested identity, authority boundary, execution profile, routing contract, and focused instruction set. |

### Engineering craft

Task-local methods for authorized implementation, bounded evidence, requested orientation, delivery decomposition, and useful visuals.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`coding-style`](../../plugins/kai-engineering/skills/coding-style/SKILL.md) | `kai-engineering` | Use when applying shared implementation defaults where repository conventions and task instructions leave appropriate details unspecified. |
| [`research-before-coding`](../../plugins/kai-engineering/skills/research-before-coding/SKILL.md) | `kai-engineering` | Use when a code or design decision depends on unresolved evidence about existing behavior, ownership, reuse, consumers, or tradeoffs. |
| [`pr-sizing`](../../plugins/kai-engineering/skills/pr-sizing/SKILL.md) | `kai-engineering` | Use when an authorized change may need delivery decomposition into more than one ordered, reviewable increment. |
| [`kai-core-pr-delivery`](../../plugins/kai-core/skills/kai-core-pr-delivery/SKILL.md) | `kai-core` | PR delivery hygiene contract. Use when a finished change needs branch naming, conventional-commit title, PR body, verification, and protection-safe handoff. |
| [`onboard-to-codebase`](../../plugins/kai-engineering/skills/onboard-to-codebase/SKILL.md) | `kai-engineering` | Use when the user explicitly requests orientation to a repository or subsystem. |
| [`build-diagrams`](../../plugins/kai-engineering/skills/build-diagrams/SKILL.md) | `kai-engineering` | Use when the user explicitly requests a diagram, or when an authorized artifact contains a supported system, data, flow, state, topology, or hierarchy relationship that would be clearer visually. |

### Design grounding

The shared design-system grounding contract, with the frontend seam.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-design-grounding`](../../plugins/kai-core/skills/kai-core-design-grounding/SKILL.md) | `kai-core` | Use when design, frontend, or visual-identity work needs evidence of an app's settled visual language, or when a design-system reference is explicitly requested. |

### Creative methods

Structural and visual mockups, block diagrams, measured narration operations, and declared-focus rendering.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`mockups-ascii`](../../plugins/kai-creative/skills/mockups-ascii/SKILL.md) | `kai-creative` | Use when an ASCII wireframe is requested, or an unresolved layout, placement, grouping, or information-hierarchy decision needs a structural sketch. |
| [`mockups-html`](../../plugins/kai-creative/skills/mockups-html/SKILL.md) | `kai-creative` | Use when an HTML mock is requested, or a UI choice depends on visual hierarchy, component appearance, or responsive layout. |
| [`html-block-diagrams`](../../plugins/kai-creative/skills/html-block-diagrams/SKILL.md) | `kai-creative` | Use when a structural block diagram is requested for an HTML or image destination, or an established relationship would be materially clearer in that form. |
| [`video-align-narration`](../../plugins/kai-creative/skills/video-align-narration/SKILL.md) | `kai-creative` | Use when measured narration clips need a fit assessment, placement plan, or authorized mix against an existing recorded demo. |
| [`video-render-zoom`](../../plugins/kai-creative/skills/video-render-zoom/SKILL.md) | `kai-creative` | Use when an explicit focus or zoom operation is requested for existing video footage, or an evidenced legibility problem needs a declared focus treatment. |

### Web & content

Browser-run plumbing, content methods, and shared claim safety.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-web-evaluation`](../../plugins/kai-core/skills/kai-core-web-evaluation/SKILL.md) | `kai-core` | Provides safe Playwright live-product evaluation plumbing. Use when QA, UX, SEO, or product exploration needs login, evidence, screenshots, and reports. |
| [`kai-core-web-content-extraction`](../../plugins/kai-core/skills/kai-core-web-content-extraction/SKILL.md) | `kai-core` | Extracts readable website content to markdown. Use when course modules, certification units, docs, or long articles need downstream consumption. |
| [`kai-core-content-grounding`](../../plugins/kai-core/skills/kai-core-content-grounding/SKILL.md) | `kai-core` | Claim-safety and provenance rules for product content. Use when creating external-facing LinkedIn posts, video scripts, or other content from product intelligence. |
| [`kai-core-pulse-digest`](../../plugins/kai-core/skills/kai-core-pulse-digest/SKILL.md) | `kai-core` | Defines weekly catch-up digest collection and output. Use when workflow-weekly-pulse needs source adapters, privacy rules, prioritization, and page shapes. |

### Operator signals

Core's own reading of what the team records need a human for, plus the runner-invoked notification contract.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-proactive-scan`](../../plugins/kai-core/skills/kai-core-proactive-scan/SKILL.md) | `kai-core` | Owns operator-signal interpretation (decisions, replies, actions, release-ready items) for on-demand briefings, and defines runner-invoked proactive notifications. Use when interpreting team records for a requested briefing or scan, or when an external cadence scans workspaces for newly actionable items. |

---

**Next:** [How kai works](../how-kai-works.md) · [Workspace model](../workspaces.md) ·
[Getting started](../getting-started.md)

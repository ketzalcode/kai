[kai](../../README.md) / [Docs](../README.md) / Agents & skills

# Agents & skills

<!-- GENERATED FILE — do not edit by hand.
     Source: agent/skill frontmatter + the CATEGORIES table in
     tools/generate-catalog.mjs. Regenerate with `npm run build`;
     `npm run build:check` fails if this file drifts. -->

The repository ships **14 agents** and **47 skills**.

The default marketplace supplies **14 agents** and **47 skills** through core, engineering, and creative (14 skills are directly user-invocable when their owning package is installed). A default listing is not a release or runtime-readiness certification.

Each description is the source agent or skill's own `description:`.
Capabilities parked under [`incubator/`](../../incubator/README.md) are
deliberately absent from this catalog: they are not installed, not loaded,
and not available through any install path.

- **Need the system boundaries?** [Architecture](../architecture.md) maps packages, authority, runtime, and hosts.
- **Want to see it running?** [`examples/e2e-feature-delivery/`](../../examples/e2e-feature-delivery/).

## Agents

### Workspace foundation

Set a workspace up and keep its structure honest.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`workflow-workspace-init`](../../plugins/kai-core/agents/workflow-workspace-init.agent.md) | `kai-core` | Use when installing Kai packs, initializing or repairing a private schema-5 workspace, or re-onboarding an unsupported workspace without importing old records. |
| [`workflow-epic-init`](../../plugins/kai-core/agents/workflow-epic-init.agent.md) | `kai-core` | Use when an approved outcome needs a Direction-aligned Epic proposal before any Feature, Requirement, or Task planning. |

### Direction

Delivery coordination, on explicit request. Nothing has to be routed through it.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`director-chief-of-staff`](../../plugins/kai-core/agents/director-chief-of-staff.agent.md) | `kai-core` | Coordinates approved Kai work by planning, granting, reconciling, and handing off executable Tasks without inventing product or hierarchy authority. |

### Engineering

Implement bounded frontend and backend work, explicitly coordinate a complete change, or run approved unattended delivery.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`eng-lead-software`](../../plugins/kai-engineering/agents/eng-lead-software.agent.md) | `kai-engineering` | Coordinates an explicitly requested multi-builder software change or packages a finished diff through integration, selective review, post-build PR sizing, and PR delivery. Never implements product code, self-approves, merges, deploys, tags, or releases. |
| [`eng-builder-frontend`](../../plugins/kai-engineering/agents/eng-builder-frontend.agent.md) | `kai-engineering` | Implements scoped frontend UI and client behavior with repository-native composition, state, accessibility, localization, and tests. Use explicitly for frontend features, fixes, and refactors. Not backend implementation, independent review, or delivery. |
| [`eng-builder-backend`](../../plugins/kai-engineering/agents/eng-builder-backend.agent.md) | `kai-engineering` | Implements scoped APIs, services, persistence, jobs, libraries, and server-side behavior with repository-native contracts and tests. Use explicitly for backend features, fixes, and refactors. Not frontend implementation, independent review, or delivery. |
| [`eng-nightshift`](../../plugins/kai-engineering/agents/eng-nightshift.agent.md) | `kai-engineering` | Runs an explicitly approved Nightshift: prepares bounded engineering work, executes serial pull-request slices unattended, and returns PRs, blockers, evidence, and morning suggestions. Never expands scope, self-approves, merges, deploys, tags, or releases. |

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

### Implementation review

Selective independent code review. Implementers retain ownership of their changed-behavior tests.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`eng-reviewer-code`](../../plugins/kai-engineering/agents/eng-reviewer-code.agent.md) | `kai-engineering` | Independently reviews an exact code change for requirements, correctness, contracts, regressions, risk, and test adequacy. Use explicitly for a diff, PR, or implementation review. Returns evidence-based findings and never repairs the code. |

### Private workspace signals

Core-owned weekly synthesis and explicitly requested signal scans.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`workflow-weekly-pulse`](../../plugins/kai-core/agents/workflow-weekly-pulse.agent.md) | `kai-core` | Produces an explicitly requested private weekly synthesis from selected sources without changing coordinated work. |
| [`workflow-proactive-scan`](../../plugins/kai-core/agents/workflow-proactive-scan.agent.md) | `kai-core` | Runs an explicitly requested read-only signal scan and writes a private typed core report payload without acting on findings. |

## Skills

Skills are methods and contracts. Most are not invoked directly —
an acting agent loads each one on demand, at the exact instruction that needs it.

### Workspace & direction

Resolve private schema-5 workspaces, initialize Direction, and validate core publication vocabulary.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-workspace-paths`](../../plugins/kai-core/skills/kai-core-workspace-paths/SKILL.md) | `kai-core` | Use when resolving a Kai workspace, project binding, Direction file, coordination database, or typed private/public artifact path. |
| [`kai-core-workspace-onboarding`](../../plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md) | `kai-core` | Use when installing Kai packs, initializing a schema-5 workspace, or repairing its current private binding. |
| [`kai-core-workspace-reonboard`](../../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md) | `kai-core` | Use when a Kai workspace manifest is unsupported and the operator wants a clean schema-5 workspace without importing historical records. |
| [`kai-core-workspace-publication`](../../plugins/kai-core/skills/kai-core-workspace-publication/SKILL.md) | `kai-core` | Use when a core role may retain or publish durable Direction, coordination feature, decision, or report material. |

### Hierarchy & stewardship

Define hierarchy meaning, authority, Task execution, acting, and granting.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-work-hierarchy`](../../plugins/kai-core/skills/kai-core-work-hierarchy/SKILL.md) | `kai-core` | Use when reading, proposing, or validating coordinated Epic, Feature, Requirement, or Task structure. |
| [`kai-core-work-stewardship`](../../plugins/kai-core/skills/kai-core-work-stewardship/SKILL.md) | `kai-core` | Use when a named authority proposes, activates, prioritizes, holds, reprioritizes, or closes hierarchy scope. |
| [`kai-core-work-task`](../../plugins/kai-core/skills/kai-core-work-task/SKILL.md) | `kai-core` | Use when creating, promoting, granting, executing, handing off, reviewing, restoring, or closing a coordinated Task. |
| [`kai-core-work-acting`](../../plugins/kai-core/skills/kai-core-work-acting/SKILL.md) | `kai-core` | Use when an actor is about to read or mutate granted coordinated work, record evidence, ask a question, hand off, or submit review. |
| [`kai-core-work-granting`](../../plugins/kai-core/skills/kai-core-work-granting/SKILL.md) | `kai-core` | Use when a grantor plans executable Tasks, issues or reconciles grants and leases, prepares a native role, or handles recovery. |

### Pack publication

Own the department vocabularies that validate typed private work and accepted public knowledge.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`engineering-workspace-publication`](../../plugins/kai-engineering/skills/engineering-workspace-publication/SKILL.md) | `kai-engineering` | Use when an engineering role may retain or publish durable feature, architecture, decision, investigation, or release knowledge. |
| [`creative-workspace-publication`](../../plugins/kai-creative/skills/creative-workspace-publication/SKILL.md) | `kai-creative` | Use when a creative role may retain or publish durable design, guidance, decision, report, or media material. |

### Operating contracts & assets

Shared operating, scope, communication, activity, completion, and durable asset lifecycle contracts.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-operating-rules`](../../plugins/kai-core/skills/kai-core-operating-rules/SKILL.md) | `kai-core` | The universal rules every kai role follows: role kinds, staying in lane, test ownership, human-only gates, shipping honesty, and @operator. Load whenever acting as a kai role. |
| [`kai-core-work-activity`](../../plugins/kai-core/skills/kai-core-work-activity/SKILL.md) | `kai-core` | Use when a coordinated role should emit optional append-only start, progress, stop, deadline, or silence signals. |
| [`kai-core-fleet-observation`](../../plugins/kai-core/skills/kai-core-fleet-observation/SKILL.md) | `kai-core` | Kai subagent fleet observer guide. Use when the operator wants to launch or interpret the live watcher and inspect which roles did or did not participate. |
| [`kai-core-definition-of-done`](../../plugins/kai-core/skills/kai-core-definition-of-done/SKILL.md) | `kai-core` | Use when deciding whether implementation, review, evidence, publication, release readiness, or coordinated closure is complete. |
| [`kai-core-scope-discipline`](../../plugins/kai-core/skills/kai-core-scope-discipline/SKILL.md) | `kai-core` | Use when a request, finding, or recommendation may expand approved scope, create durable work, or require adoption authority. |
| [`kai-core-no-self-remediation`](../../plugins/kai-core/skills/kai-core-no-self-remediation/SKILL.md) | `kai-core` | Assessor write-boundary contract. Use when a review or assessment role must report findings without mutating the target under review. |
| [`kai-core-issue-analysis`](../../plugins/kai-core/skills/kai-core-issue-analysis/SKILL.md) | `kai-core` | Issue-to-approach analysis. Use when grounding an issue, testing decisive assumptions, framing options, and stopping at the authorized decision owner. |
| [`kai-core-peer-communication`](../../plugins/kai-core/skills/kai-core-peer-communication/SKILL.md) | `kai-core` | Use when a role needs a lane-specific question or answer through inline consultation, a live peer, or a durable typed message. |
| [`kai-core-contract-v1`](../../plugins/kai-core/skills/kai-core-contract-v1/SKILL.md) | `kai-core` | Reports that kai-core is installed and which contract version it provides. Use just in time before a department agent invokes its first other kai-core skill. |
| [`kai-core-create-agent`](../../plugins/kai-core/skills/kai-core-create-agent/SKILL.md) | `kai-core` | Use when creating or materially revising a Kai agent so the role earns its context cost, owns one clear lane, and loads reusable instructions only at the decision that needs them. |
| [`kai-core-create-skill`](../../plugins/kai-core/skills/kai-core-create-skill/SKILL.md) | `kai-core` | Use when creating or revising a Copilot skill so its boundary stays reusable, caller-agnostic, acyclic, and proportionate to the method it teaches. |
| [`kai-core-asset-producing`](../../plugins/kai-core/skills/kai-core-asset-producing/SKILL.md) | `kai-core` | Use when a validated pack-owned artifact needs a private revision, acceptance binding, publication, provenance, or closure. |
| [`kai-core-asset-closing`](../../plugins/kai-core/skills/kai-core-asset-closing/SKILL.md) | `kai-core` | Use when recording final asset disposition, validity, supersession, retraction, archival, or publication cleanup. |

### Engineering craft

Lean development, shared and domain coding standards, bounded evidence, explicit delivery, and useful visuals.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`software-development`](../../plugins/kai-engineering/skills/software-development/SKILL.md) | `kai-engineering` | Use when implementing or modifying product code for a feature, fix, refactor, or behavior change. Do not use for review-only, PR merge, release-only, deployment-only, prose-only, metadata-only, or generated-refresh work. |
| [`coding-standards`](../../plugins/kai-engineering/skills/coding-standards/SKILL.md) | `kai-engineering` | Use when writing, modifying, or refactoring code. |
| [`frontend-coding-standards`](../../plugins/kai-engineering/skills/frontend-coding-standards/SKILL.md) | `kai-engineering` | Use with coding-standards when implementing or refactoring frontend UI or client behavior. |
| [`backend-coding-standards`](../../plugins/kai-engineering/skills/backend-coding-standards/SKILL.md) | `kai-engineering` | Use with coding-standards when implementing or refactoring APIs, services, persistence, jobs, libraries, or server-side behavior. |
| [`nightshift-run`](../../plugins/kai-engineering/skills/nightshift-run/SKILL.md) | `kai-engineering` | Use inside eng-nightshift for a bounded unattended engineering run whose Nightshift agent chooses one PR slice at a time and whose runner only persists, launches, and reports. |
| [`research-before-coding`](../../plugins/kai-engineering/skills/research-before-coding/SKILL.md) | `kai-engineering` | Use when a code or design decision depends on unresolved evidence about existing behavior, ownership, reuse, consumers, or tradeoffs. |
| [`pr-sizing`](../../plugins/kai-engineering/skills/pr-sizing/SKILL.md) | `kai-engineering` | Use after a complete change or integrated diff exists and delivery may need one or more ordered, human-reviewable PRs. |
| [`pr-delivery`](../../plugins/kai-engineering/skills/pr-delivery/SKILL.md) | `kai-engineering` | Use when an accepted delivery slice needs branch naming, title, version handling, a scenario-based PR description, verification evidence, and protection-safe handoff. |
| [`pr-review`](../../plugins/kai-engineering/skills/pr-review/SKILL.md) | `kai-engineering` | Use from eng-reviewer-code after an exact PR or diff is pinned to choose the minimum relevant review from its purpose, changed behavior, evidence, and risk triggers. |
| [`pr-review-comments`](../../plugins/kai-engineering/skills/pr-review-comments/SKILL.md) | `kai-engineering` | Use after verified review findings exist to draft or, with current authorization, post concise actionable pull-request comments. |
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

Browser-run plumbing, content methods, and the claim safety creative content rests on.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-web-evaluation`](../../plugins/kai-core/skills/kai-core-web-evaluation/SKILL.md) | `kai-core` | Provides safe Playwright live-product evaluation plumbing. Use when QA, UX, SEO, or product exploration needs login, evidence, screenshots, and reports. |
| [`kai-core-web-content-extraction`](../../plugins/kai-core/skills/kai-core-web-content-extraction/SKILL.md) | `kai-core` | Extracts readable website content to markdown. Use when course modules, certification units, docs, or long articles need downstream consumption. |
| [`content-grounding`](../../plugins/kai-creative/skills/content-grounding/SKILL.md) | `kai-creative` | Claim-safety and provenance rules for product content. Use when creating external-facing LinkedIn posts, video scripts, or other content from product intelligence. |
| [`kai-core-pulse-digest`](../../plugins/kai-core/skills/kai-core-pulse-digest/SKILL.md) | `kai-core` | Use when an explicitly requested weekly synthesis needs source weighting, narratable structure, coverage accounting, and private report output. |

### Operator signals

Core's own reading of what the team records need a human for, plus the runner-invoked notification contract.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-proactive-scan`](../../plugins/kai-core/skills/kai-core-proactive-scan/SKILL.md) | `kai-core` | Use when an explicitly requested read-only scan must classify, deduplicate, deliver, and acknowledge operator-relevant signals. |

---

**Next:** [Architecture](../architecture.md) · [Workspace model](../workspaces.md) ·
[Development process](../development-process.md)

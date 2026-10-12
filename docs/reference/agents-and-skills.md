[kai](../../README.md) / [Docs](../README.md) / Agents & skills

# Agents & skills

<!-- GENERATED FILE — do not edit by hand.
     Source: agent/skill frontmatter + the CATEGORIES table in
     tools/generate-catalog.mjs. Regenerate with `npm run build`;
     `npm run build:check` fails if this file drifts. -->

The repository ships **9 agents** and **38 skills**.

The default marketplace supplies **9 agents** and **38 skills** through core, optional project management, engineering, and creative (17 skills are directly user-invocable when their owning package is installed). A default listing is not a release or runtime-readiness certification.

Each description is the source agent or skill's own `description:`.
Capabilities parked under [`incubator/`](../../incubator/README.md) are
deliberately absent from this catalog: they are not installed, not loaded,
and not available through any install path.

- **Need the system boundaries?** [Architecture](../architecture.md) maps packages, authority, runtime, and hosts.

## Agents

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
| [`creative-operator-demo-production`](../../plugins/kai-creative/agents/creative-operator-demo-production.agent.md) | `kai-creative` | Operates authorized demo production from supplied media and approved direction using requested alignment, focus, composition, and format operations. Use when production inputs exist. Not capture, invented direction, or publication. |

### Implementation review

Selective independent code review. Implementers retain ownership of their changed-behavior tests.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`eng-reviewer-code`](../../plugins/kai-engineering/agents/eng-reviewer-code.agent.md) | `kai-engineering` | Independently reviews an exact code change for requirements, correctness, contracts, regressions, risk, and test adequacy. Use explicitly for a diff, PR, or implementation review. Returns evidence-based findings and never repairs the code. |

## Skills

Skills are methods and contracts. Most are not invoked directly —
an acting agent loads each one on demand, at the exact instruction that needs it.

### Workspace

Resolve private schema-6 workspaces and validate Core publication vocabulary.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-workspace-paths`](../../plugins/kai-core/skills/kai-core-workspace-paths/SKILL.md) | `kai-core` | Use when resolving a Kai workspace, project binding, coordination database, typed private/public artifact path, or caller-composed package navigation view. |
| [`kai-core-workspace-onboarding`](../../plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md) | `kai-core` | Use when installing Kai packs, initializing a schema-6 workspace, or repairing its current private binding. |
| [`kai-core-workspace-reonboard`](../../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md) | `kai-core` | Use when reshaping an unsupported Kai workspace into the current schema-6 structure while preserving durable knowledge and artifacts. |
| [`kai-core-workspace-publication`](../../plugins/kai-core/skills/kai-core-workspace-publication/SKILL.md) | `kai-core` | Use when a core role may retain or publish durable coordination decisions or reports. |

### Task execution

Define standalone Task authority, execution, acting, and granting.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-work-task`](../../plugins/kai-core/skills/kai-core-work-task/SKILL.md) | `kai-core` | Use when creating, promoting, granting, executing, handing off, reviewing, restoring, or closing a coordinated Task. |
| [`kai-core-work-acting`](../../plugins/kai-core/skills/kai-core-work-acting/SKILL.md) | `kai-core` | Use when an actor is about to read or mutate granted coordinated work, record evidence, ask a question, hand off, or submit review. |
| [`kai-core-work-granting`](../../plugins/kai-core/skills/kai-core-work-granting/SKILL.md) | `kai-core` | Use when an authorized grantor plans executable Tasks, issues or reconciles grants and leases, launches a role, or handles recovery. |

### Project management

Own Direction, Epic, Feature, Requirement, priority, holds, dependencies, closure, and Task handoff.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`project-management-create-epic`](../../plugins/kai-project-management/skills/project-management-create-epic/SKILL.md) | `kai-project-management` | Use when an approved outcome needs a Direction-aligned Epic proposal before Feature, Requirement, or Core Task planning. |
| [`project-management-work-hierarchy`](../../plugins/kai-project-management/skills/project-management-work-hierarchy/SKILL.md) | `kai-project-management` | Use when reading, proposing, validating, or handing off Direction, Epic, Feature, and Requirement scope. |
| [`project-management-work-stewardship`](../../plugins/kai-project-management/skills/project-management-work-stewardship/SKILL.md) | `kai-project-management` | Use when a named authority creates, activates, prioritizes, holds, releases, or closes Project Management scope. |
| [`project-management-workspace-publication`](../../plugins/kai-project-management/skills/project-management-workspace-publication/SKILL.md) | `kai-project-management` | Use when accepted Direction or planning knowledge may be published from Project Management. |

### Pack publication

Own package vocabularies that validate typed private work and accepted public knowledge.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`engineering-workspace-publication`](../../plugins/kai-engineering/skills/engineering-workspace-publication/SKILL.md) | `kai-engineering` | Use when an engineering role may retain or publish durable feature, architecture, decision, investigation, or release knowledge. |
| [`creative-workspace-publication`](../../plugins/kai-creative/skills/creative-workspace-publication/SKILL.md) | `kai-creative` | Use when a creative role may retain or publish durable design, guidance, decision, report, or media material. |

### Operating contracts

Shared operating, communication, and activity guidance.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-core-operating-rules`](../../plugins/kai-core/skills/kai-core-operating-rules/SKILL.md) | `kai-core` | The universal rules every kai role follows: role kinds, staying in lane, test ownership, human-only gates, shipping honesty, and @operator. Load whenever acting as a kai role. |
| [`kai-core-work-activity`](../../plugins/kai-core/skills/kai-core-work-activity/SKILL.md) | `kai-core` | Use when a coordinated role should emit optional append-only start, progress, stop, deadline, or silence signals. |
| [`kai-core-peer-communication`](../../plugins/kai-core/skills/kai-core-peer-communication/SKILL.md) | `kai-core` | Use when a role needs a lane-specific question or answer through inline consultation, a live peer, or a durable typed message. |

### Contributor tools

Optional feedback and lean Kai agent/skill authoring guidance.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`kai-feedback`](../../plugins/kai-contributor/skills/kai-feedback/SKILL.md) | `kai-contributor` | Use when the operator says Kai was incorrect, missed a principle, added too much process, or needs an improvement recorded for the Kai maintainers. |
| [`kai-create-agent`](../../plugins/kai-contributor/skills/kai-create-agent/SKILL.md) | `kai-contributor` | Use when creating or materially revising a Kai agent so the role earns its context cost, owns one clear lane, and loads reusable instructions only at the decision that needs them. |
| [`kai-create-skill`](../../plugins/kai-contributor/skills/kai-create-skill/SKILL.md) | `kai-contributor` | Use when creating or revising a Copilot skill so its boundary stays reusable, caller-agnostic, acyclic, and proportionate to the method it teaches. |

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

### Engineering automation

Investigate platform feasibility and install approved repository automation without assuming one host or agent runtime.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`setup-agentic-repository-maintenance`](../../plugins/kai-engineering/skills/setup-agentic-repository-maintenance/SKILL.md) | `kai-engineering` | Use when evaluating and setting up automated repository maintenance after comparing feasible platform, permission, agent, scheduler, and issue-tracker approaches. |

### Creative methods

Structural and visual mockups, block diagrams, measured narration operations, and declared-focus rendering.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`mockups-ascii`](../../plugins/kai-creative/skills/mockups-ascii/SKILL.md) | `kai-creative` | Use when an ASCII wireframe is requested, or an unresolved layout, placement, grouping, or information-hierarchy decision needs a structural sketch. |
| [`mockups-html`](../../plugins/kai-creative/skills/mockups-html/SKILL.md) | `kai-creative` | Use when an HTML mock is requested, or a UI choice depends on visual hierarchy, component appearance, or responsive layout. |
| [`html-block-diagrams`](../../plugins/kai-creative/skills/html-block-diagrams/SKILL.md) | `kai-creative` | Use when a structural block diagram is requested for an HTML or image destination, or an established relationship would be materially clearer in that form. |
| [`video-align-narration`](../../plugins/kai-creative/skills/video-align-narration/SKILL.md) | `kai-creative` | Use when measured narration clips need a fit assessment, placement plan, or authorized mix against an existing recorded demo. |
| [`video-render-zoom`](../../plugins/kai-creative/skills/video-render-zoom/SKILL.md) | `kai-creative` | Use when an explicit focus or zoom operation is requested for existing video footage, or an evidenced legibility problem needs a declared focus treatment. |

### Content grounding

Claim safety for creative content.

| Name | Package | What it owns |
| ---- | ------- | ------------ |
| [`content-grounding`](../../plugins/kai-creative/skills/content-grounding/SKILL.md) | `kai-creative` | Claim-safety and provenance rules for product content. Use when creating external-facing LinkedIn posts, video scripts, or other content from product intelligence. |

---

**Next:** [Architecture](../architecture.md) · [Workspace model](../workspaces.md) ·
[Development process](../development-process.md)

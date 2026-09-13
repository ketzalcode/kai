[kai](../../README.md) / [Docs](../README.md) / Agents & skills

# Agents & skills

<!-- GENERATED FILE — do not edit by hand.
     Source: agent/skill frontmatter + the CATEGORIES table in
     scripts/generate-catalog.mjs. Regenerate with `npm run docs:generate`;
     `npm test` fails if this file drifts from the shipped surface. -->

kai ships **55 agents** and **47 skills** (12 of the skills are directly user-invocable; the rest load on demand, routed by the agents that need them at the step that needs each one).

Each description below is the agent or skill's own shipped `description:` —
the exact text the host reads when deciding whether to fire it. You do not
need to learn this page. Ask a front door for an outcome and it routes; come
here when you want to know who owns a particular judgment.

- **Not sure who to ask?** [How kai works](../how-kai-works.md) has the trigger table.
- **Want to see it running?** [`examples/e2e-feature-delivery/`](../../examples/e2e-feature-delivery/).

## Agents

### Workspace foundation

Set a workspace up and keep its structure honest.

| Name | What it owns |
| ---- | ------------ |
| [`workflow-workspace-init`](../../plugins/kai-core/agents/workflow-workspace-init.agent.md) | Creates or validates kai workspace state and guides the core-first split-pack install when requested. Verified after each step, non-destructive, and idempotent. |
| [`workflow-initiative-init`](../../plugins/kai-core/agents/workflow-initiative-init.agent.md) | Creates a scope-gated kai initiative workspace with north star, milestones, artifact paths, work records, and threads. Use when a new mission or initiative starts. Not execution before PM scope approval. |
| [`workflow-self-check`](../../plugins/kai-core/agents/workflow-self-check.agent.md) | Writes a tiered structural-health report for kai plugin files covering inventory, naming, descriptions, references, overlap, responsibility, and discoverability. Use for kai self-audit. Not auto-restructuring. |

### Direction

Delivery coordination, on explicit request. Nothing has to be routed through it.

| Name | What it owns |
| ---- | ------------ |
| [`director-chief-of-staff`](../../plugins/kai-core/agents/director-chief-of-staff.agent.md) | Coordinates Kai roles to drive an outcome, work item, initiative, or incident to truthful completion. Use when asking someone to ship, run, or drive work. Not personal agenda or task management. |

### Engineering

Technical design and implementation. The architect and manager are situational.

| Name | What it owns |
| ---- | ------------ |
| [`principal-swe-architect`](../../plugins/kai-engineering/agents/principal-swe-architect.agent.md) | Decides software architecture across domains: system shape, boundaries, contracts, and cross-cutting NFRs. Use when an engineering change needs seams, trade-offs, or a durable decision. Not delivery planning (`principal-swe-manager`). |
| [`principal-swe-manager`](../../plugins/kai-engineering/agents/principal-swe-manager.agent.md) | Turns a committed product action into a scoped, sequenced engineering delivery plan with workstreams, owners, estimates, dependencies, and spikes. Use before implementation. Not architecture decisions (`principal-swe-architect`) or coding. |
| [`principal-swe-frontend`](../../plugins/kai-engineering/agents/principal-swe-frontend.agent.md) | Builds and reviews frontend TypeScript, React, CSS, components, hooks, accessibility, and styling architecture. Use for UI implementation or design judgment. Not backend (`principal-swe-backend`) or infra (`principal-swe-infra`). |
| [`principal-swe-backend`](../../plugins/kai-engineering/agents/principal-swe-backend.agent.md) | Builds and reviews backend APIs, server logic, data models, migrations, consistency, and model-serving backends. Use for server-side design or implementation. Not architecture (`principal-swe-architect`) or frontend (`principal-swe-frontend`). |
| [`principal-swe-infra`](../../plugins/kai-engineering/agents/principal-swe-infra.agent.md) | Builds and reviews infrastructure, platform, CI/CD, deployment, IaC, containers, build tooling, secrets, and observability. Use for rollout, rollback, cloud, networking, or pipeline judgment. Not backend code (`principal-swe-backend`). |
| [`principal-data-engineer`](../../plugins/kai-engineering/agents/principal-data-engineer.agent.md) | Designs SaaS data pipelines, ingestion, warehouse/lakehouse models, data contracts, event instrumentation, data quality, and lineage. Use for data movement and shape. Not metric validity (`principal-data-analytics`). |

### Intake & delivery

The full life of one change: from an issue to a chosen approach, then to a merged PR, then to production. kai never merges or deploys itself.

| Name | What it owns |
| ---- | ------------ |
| [`workflow-issue-analysis`](../../plugins/kai-engineering/agents/workflow-issue-analysis.agent.md) | Turns one issue into a grounded problem statement, verified assumption, viable options, and chosen approach handoff. Use at issue intake before implementation. Not coding or creating work items. |
| [`workflow-pull-request`](../../plugins/kai-engineering/agents/workflow-pull-request.agent.md) | Turns one finished workspace change into a mergeable pull request with branch, commits, PR narrative, version bump, and readiness report. Use when a change is ready for PR. Not merge, tag, release, or branch-protection bypass. |
| [`workflow-ship`](../../plugins/kai-engineering/agents/workflow-ship.agent.md) | Orchestrates release prepare, human deployment start, and completion confirmation with deploy, rollback, verification, and smoke-check records. Use when a release moves from in-review to shipped. Not deployment execution. |

### Trust & reliability

Independent judgment on security, privacy, reliability, and live incidents.

| Name | What it owns |
| ---- | ------------ |
| [`principal-security`](../../plugins/kai-engineering/agents/principal-security.agent.md) | Produces SaaS threat models, security designs, change reviews, vulnerability triage, privacy-engineering assessments, and incident-security guidance. Use when authorized evidence needs security judgment. Not compliance sign-off. |
| [`principal-privacy-compliance`](../../plugins/kai-engineering/agents/principal-privacy-compliance.agent.md) | Designs SaaS privacy and compliance artifacts: DPIAs, data inventories, lawful-basis maps, DSR processes, consent, retention, notices, framework reviews, and breach-notification analysis. Not security controls. |
| [`principal-sre`](../../plugins/kai-engineering/agents/principal-sre.agent.md) | Defines SaaS reliability contracts, readiness, recovery behavior, capacity, observability, alerting, runbooks, and reliability review. Use for production-readiness judgment. Not architecture, infra implementation, or incident command. |
| [`workflow-incident-response`](../../plugins/kai-engineering/agents/workflow-incident-response.agent.md) | Runs incident command for SaaS operational, security, data, or availability events: SEV, leads, timeline, action packets, status drafts, recovery evidence, and record. Use when an incident starts. Not production actions or breach/legal declarations. |

### Product

Discovery, scope, evidence, analytics, product-led growth, and independent product assessment. UI and brand design belong to creative.

| Name | What it owns |
| ---- | ------------ |
| [`principal-product-manager`](../../plugins/kai-product/agents/principal-product-manager.agent.md) | Owns product scope and initiative stewardship: product briefs, smallest-correct scope decisions, north stars, proposal grooming, prioritization, and truthful closure. Use before design or engineering. |
| [`principal-product-strategist`](../../plugins/kai-product/agents/principal-product-strategist.agent.md) | Investigates future product opportunities, analogous products, fit scores, candidate actions, and smallest validating experiments. Use before scope decisions. Not current initiative stewardship (`principal-product-manager`). |
| [`principal-data-analytics`](../../plugins/kai-product/agents/principal-data-analytics.agent.md) | Defines metric contracts and analyzes supplied SaaS exports for funnel, cohort, retention, segmentation, experiments, and instrumentation gaps. Use for analytical validity and causal-status judgment. Not pipelines (`principal-data-engineer`). |
| [`workflow-customer-feedback`](../../plugins/kai-product/agents/workflow-customer-feedback.agent.md) | Synthesizes supplied SaaS surveys, NPS/CSAT, reviews, interviews, and feature requests into de-identified themes and owner routing. Use when customer feedback needs privacy-first clustering. Not product scoping or customer replies. |
| [`workflow-experiment-review`](../../plugins/kai-product/agents/workflow-experiment-review.agent.md) | Gates SaaS experiment integrity before launch or after readout, covering design, metrics, exposure, peeking, comparisons, guardrails, and causal status. Use when an experiment needs independent certification. Not growth or product decisions. |
| [`workflow-product-explore`](../../plugins/kai-product/agents/workflow-product-explore.agent.md) | Maps supplied product evidence or an authorized live surface, optionally extracting neutral visual facts. Use for reusable navigation and state evidence. Not UX evaluation, defect filing, scope, or design recommendations. |
| [`persona-ux-first-time-user`](../../plugins/kai-product/agents/persona-ux-first-time-user.agent.md) | Simulates a first-time customer walkthrough and reports subjective flow clarity, copy, missing context, unmet expectations, and confusion points. Use for fresh-eyes feedback. Not defect QA (`principal-qa-ui`). |
| [`principal-growth`](../../plugins/kai-product/agents/principal-growth.agent.md) | Diagnoses SaaS lifecycle growth and designs bounded experiments across acquisition, activation, engagement, retention, referral, reactivation, and paid conversion. Use for aggregate PLG growth. Not campaign demand gen (`principal-demand-generation`). |
| [`persona-professional-nutritionist`](../../plugins/kai-product/agents/persona-professional-nutritionist.agent.md) | Audits fitness-product meal plans, macros, pantry suggestions, and projection math for nutrition accuracy, macro safety, micronutrient gaps, and allergen risk. Not exercise programming (`persona-professional-trainer`). |
| [`persona-professional-trainer`](../../plugins/kai-product/agents/persona-professional-trainer.agent.md) | Audits fitness-product workouts and programs for safety, completeness, progression, screening, volume, and injury-aware substitutions. Not meal plans or macros (`persona-professional-nutritionist`). |

### Technical writing & localization

Engineering-owned documentation and bounded localization.

| Name | What it owns |
| ---- | ------------ |
| [`eng-lead-technical-writing`](../../plugins/kai-engineering/agents/eng-lead-technical-writing.agent.md) | Technical writing specialist for READMEs, developer guides, tutorials, API reference, and release notes. Use to draft, restructure, or audit documentation. Not product scope, public claims, translation, lessons (`instructor-tutor`), or publishing. |
| [`workflow-localization`](../../plugins/kai-engineering/agents/workflow-localization.agent.md) | Runs SaaS i18n-readiness and locale-QA workflow for strings, formatting, pluralization, RTL, encoding, translation routing, and build checks. Use when a surface needs localization readiness. Not translating or code edits. |

### Creative

UI/UX, visual identity, and video direction from supplied needs and evidence. Production uses the creative demo methods.

| Name | What it owns |
| ---- | ------------ |
| [`principal-product-designer`](../../plugins/kai-creative/agents/principal-product-designer.agent.md) | Designs interaction models from approved product needs or a supplied brief, and reviews implementation against an approved design. Use for UI/UX, states, accessibility intent, and design acceptance. Not product priority, brand identity, or implementation. |
| [`principal-brand-designer`](../../plugins/kai-creative/agents/principal-brand-designer.agent.md) | Creates SaaS visual-identity systems, brand guidelines, visual-asset direction, and brand critique from positioning and brand evidence. Use for logo, color, typography, iconography, or illustration. Not product UI (`principal-product-designer`). |
| [`creative-video-director`](../../plugins/kai-creative/agents/creative-video-director.agent.md) | Directs videos from supplied factual product context, media evidence, and an approved brief into storyboards, edit decisions, voiceover, and AI-video prompts. Use for video plans or demo screenplays; rendering and synthesis are separate creative methods. |

### Revenue

Sales, pricing, partnerships, revenue operations, customer success, and support intake from supplied evidence. Only you accept terms or contact customers.

| Name | What it owns |
| ---- | ------------ |
| [`principal-sales`](../../plugins/kai-revenue/agents/principal-sales.agent.md) | Turns SaaS deal, account, discovery, and competitive evidence into qualification, discovery, deal strategy, objections, proposals, forecasts, and win/loss guidance. Use for pre-sale sales judgment. Not pricing authority or solution design. |
| [`principal-pricing-monetization`](../../plugins/kai-revenue/agents/principal-pricing-monetization.agent.md) | Recommends SaaS pricing models, packaging, price changes, discount policy, and monetization experiments from supplied cost, WTP, competitive, packaging, and analytics evidence. Use for pricing judgment. |
| [`principal-partnerships`](../../plugins/kai-revenue/agents/principal-partnerships.agent.md) | Assesses supplied partner evidence into SaaS partner strategy, fit assessments, integration partnerships, channel/reseller programs, and co-sell or co-marketing plans. Not legal approval, technical feasibility or outbound contact. |
| [`principal-revenue-operations`](../../plugins/kai-revenue/agents/principal-revenue-operations.agent.md) | Builds the SaaS revenue operating model, forecast hygiene, billing/subscription ops, and quota/territory/comp inputs. Use with supplied pipeline, billing, usage, or analytics evidence. Not pricing or sales deal judgment. |
| [`principal-customer-success`](../../plugins/kai-revenue/agents/principal-customer-success.agent.md) | Builds SaaS success plans, adoption plans, health reviews, churn or renewal risk assessments, QBR briefs, and portfolio views from customer evidence. Use for post-sale outcome and risk judgment. |
| [`workflow-support-triage`](../../plugins/kai-revenue/agents/workflow-support-triage.agent.md) | Classifies supplied SaaS tickets and conversations, screens incident/security candidates, deduplicates, assigns impact urgency, and routes owners. Use for support intake. Not replies, closures, timelines, code edits, or incident resolution. |

### Solution architecture

Engineering-owned technical fit and solution design, not commercial deal authority.

| Name | What it owns |
| ---- | ------------ |
| [`principal-solutions-architect`](../../plugins/kai-engineering/agents/principal-solutions-architect.agent.md) | Turns buyer requirements, environment, and integration evidence into SaaS technical discovery, solution fit, feasibility, POC scope, objections, and questionnaire guidance. Use pre-sale. Not roadmap, pricing, implementation, or attestations. |

### AI research to product

Track the live AI landscape, then turn a finding into something buildable.

| Name | What it owns |
| ---- | ------------ |
| [`principal-ai-researcher`](../../plugins/kai-engineering/agents/principal-ai-researcher.agent.md) | Researches live AI landscape changes and writes Lectoria-ready briefings on model releases, papers, training, inference, evals, safety, agents, and multimodal progress. Use for AI updates or a named paper/topic. |
| [`principal-ai-applied-engineer`](../../plugins/kai-engineering/agents/principal-ai-applied-engineer.agent.md) | Turns AI research or product ideas into ticket-grade applied designs with architecture, FE/BE work, eval, rollout, risk, cost, latency, and build/no-build guidance. Use when deciding how to ship AI. |

### Learning & career development

Teach supplied topics, package source-faithful lessons, steward learning paths, and mentor IC engineering careers. Markdown, HTML, and audio are separate outcomes.

| Name | What it owns |
| ---- | ------------ |
| [`instructor-tutor`](../../plugins/kai-learning/agents/instructor-tutor.agent.md) | Authors concrete-first lessons for any subject in Explain, Lesson, or Series mode. Use when the operator needs a gap topic taught from scratch. Not packaging existing markdown (`instructor-teacher`). |
| [`instructor-teacher`](../../plugins/kai-learning/agents/instructor-teacher.agent.md) | Packages supplied chaptered markdown into source-faithful HTML lessons, one per source file, with optional confirmed audio through core. Use for course units, book chapters, or study notes. Not original topic authoring. |
| [`instructor-path-mentor`](../../plugins/kai-learning/agents/instructor-path-mentor.agent.md) | Stewards a whole certification or structured learning path over time: plan, status, advance, review, and update. Use after choosing the path. Not career strategy (`principal-engineer-career-mentor`). |
| [`principal-engineer-career-mentor`](../../plugins/kai-learning/agents/principal-engineer-career-mentor.agent.md) | Mentors IC-track career progression through intake, check-ins, reviews, spot consults, cert planning, and visibility nudges. Use for career strategy. Not executing a chosen learning path (`instructor-path-mentor`). |
| [`workflow-course-to-audio`](../../plugins/kai-learning/agents/workflow-course-to-audio.agent.md) | Extracts a course, certification module, learning-path unit, or long readable web page into local markdown for later audio. Use when a URL should become listenable study material with separate knowledge checks. |

### Marketing

Positioning, campaigns, LinkedIn content, and search assessments from supplied facts and evidence. Never auto-publishes.

| Name | What it owns |
| ---- | ------------ |
| [`principal-product-marketing`](../../plugins/kai-marketing/agents/principal-product-marketing.agent.md) | Builds grounded product marketing intelligence from public surfaces, screenshots, recordings, assets, notes, or product maps. Use when content or creative agents need reusable product context. Not product scope (`principal-product-manager`). |
| [`principal-demand-generation`](../../plugins/kai-marketing/agents/principal-demand-generation.agent.md) | Designs SaaS campaign strategy, briefs, lifecycle/nurture email, channel mix, lead handoff, and demand diagnosis from approved positioning. Use for demand gen. Not PLG lifecycle experiments (`principal-growth`). |
| [`principal-linkedin-strategist`](../../plugins/kai-marketing/agents/principal-linkedin-strategist.agent.md) | Turns product intelligence and media into grounded, platform-native LinkedIn post variants, angle matrices, calendars, and carousel outlines. Use for LinkedIn content strategy. Never auto-publishes. |
| [`principal-seo`](../../plugins/kai-marketing/agents/principal-seo.agent.md) | Assesses technical SEO, content alignment, and agentic-search readiness from supplied HTML, headers, screenshots or authorized live evidence. Use for search visibility, not general UI defects or implementation. |

### Web quality

Engineering-owned UI QA, independent of marketing and search assessment.

| Name | What it owns |
| ---- | ------------ |
| [`principal-qa-ui`](../../plugins/kai-engineering/agents/principal-qa-ui.agent.md) | Manually tests a website UI for objective defects: overlap, overflow, broken controls, console or network errors with visible impact, focus order, and viewport layout breaks. Use for QA passes. Not fresh-eyes UX (`persona-ux-first-time-user`). |

### Personal assistance

Your own tasks, briefings, and drafts. Invoked directly; never a router.

| Name | What it owns |
| ---- | ------------ |
| [`personal-assistant`](../../plugins/kai-assistant/agents/personal-assistant.agent.md) | Manages personal tasks, priorities, briefings, and message drafts directly. Use for help with your own work. Not team delivery, specialist dispatch, or autonomous sending. |
| [`persona-self`](../../plugins/kai-assistant/agents/persona-self.agent.md) | Drafts, rewrites, and replies in the user's voice for high-stakes or long-form writing. Use when authorial judgment matters: posts, design docs, PR narratives, sensitive replies. Never auto-publishes. |

### Private workspace signals

Core-owned weekly synthesis and explicitly requested signal scans.

| Name | What it owns |
| ---- | ------------ |
| [`workflow-weekly-pulse`](../../plugins/kai-core/agents/workflow-weekly-pulse.agent.md) | Produces a concise weekly activity digest via kai-core-pulse-digest while keeping source bindings private. Use when the operator asks for a week-in-review. Not posting, pushing, mutating sources, or auto-running audio. |
| [`workflow-proactive-scan`](../../plugins/kai-core/agents/workflow-proactive-scan.agent.md) | Emits a read-only notification payload for newly actionable @operator signals and release-ready items. Use when an external scheduler runs a selected kai workspace scan. Not autonomous replies, approvals, commits, or deploys. |

## Skills

Skills are methods and contracts. Most are not invoked directly —
an acting agent loads each one on demand, at the exact instruction that needs it.

### Workspace & scope

The shared contracts every acting agent loads: where work goes, and what it may change.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-operating-rules`](../../plugins/kai-core/skills/kai-core-operating-rules/SKILL.md) | The universal rules every kai role follows: role kinds, staying in lane, test ownership, human-only gates, shipping honesty, and @operator. Load whenever acting as a kai role. |
| [`kai-core-workspace-paths`](../../plugins/kai-core/skills/kai-core-workspace-paths/SKILL.md) | Defines workspace resolution, the private .kai layout, publication, storage modes, and the artifact path convention. Use when resolving a root or choosing an artifact path. |
| [`kai-core-workspace-initiative`](../../plugins/kai-core/skills/kai-core-workspace-initiative/SKILL.md) | Defines initiative artifact layout, coordination and closure, personal state, and the schema-3 manifest. Use when working inside an initiative or validating a .kai manifest. |
| [`kai-core-workspace-onboarding`](../../plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md) | Initializes and validates kai workspaces, and guides explicit migration to the split pack install surface. Use when installing kai packs or creating or repairing workspace state. |
| [`kai-core-work-activity`](../../plugins/kai-core/skills/kai-core-work-activity/SKILL.md) | Defines fine-grained agent activity signals. Use when agents need append-only start, progress, stop, deadline, and silence reporting in .kai/activity.jsonl. |
| [`kai-core-fleet-observation`](../../plugins/kai-core/skills/kai-core-fleet-observation/SKILL.md) | Kai subagent fleet observer guide. Use when the operator wants to launch or interpret the live watcher and inspect which roles did or did not participate. |
| [`kai-core-definition-of-done`](../../plugins/kai-core/skills/kai-core-definition-of-done/SKILL.md) | Release-readiness and production-completion gate. Use when deciding whether work can move to in-review, release-ready, or shipped. |
| [`kai-core-scope-discipline`](../../plugins/kai-core/skills/kai-core-scope-discipline/SKILL.md) | Governs assessment-versus-action scope boundaries. Use when assessors, PM, design, or SWE roles must avoid silently expanding approved scope. |
| [`kai-core-no-self-remediation`](../../plugins/kai-core/skills/kai-core-no-self-remediation/SKILL.md) | Assessor write-boundary contract. Use when a review or assessment role must report findings without mutating the target under review. |
| [`kai-core-issue-analysis`](../../plugins/kai-core/skills/kai-core-issue-analysis/SKILL.md) | Issue-to-approach analysis. Use when grounding an issue, testing decisive assumptions, framing options, and stopping at the authorized decision owner. |
| [`kai-core-initiative-stewardship`](../../plugins/kai-core/skills/kai-core-initiative-stewardship/SKILL.md) | Initiative steward contract. Use when managing north-star state, proposals, priorities, item records, milestones, or closure for an initiative. |
| [`kai-core-peer-communication`](../../plugins/kai-core/skills/kai-core-peer-communication/SKILL.md) | Peer-question packet contract. Use when kai roles need a real QUESTION/ANSWER exchange over inline consult, peer transport, or durable item thread. |
| [`kai-core-contract-v1`](../../plugins/kai-core/skills/kai-core-contract-v1/SKILL.md) | Reports that kai-core is installed and which contract version it provides. Use just in time before a department agent invokes its first other kai-core skill. |

### Product exploration

Neutral maps from supplied evidence or an authorized live surface, without design or scope judgment.

| Name | What it owns |
| ---- | ------------ |
| [`product-exploration`](../../plugins/kai-product/skills/product-exploration/SKILL.md) | Use when product, design, QA, domain, or engineering work needs a neutral navigation model from supplied evidence or an authorized live surface. |

### Work coordination & artifacts

How an acting agent claims, leases, and tracks a work item, and how it produces and closes the artifacts that work leaves behind.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-work-acting`](../../plugins/kai-core/skills/kai-core-work-acting/SKILL.md) | Defines how a dispatched agent acts on work it already holds: verify-before-write, collision, handoff, question, and review-routing protocols. Use when acting on a granted item. |
| [`kai-core-work-granting`](../../plugins/kai-core/skills/kai-core-work-granting/SKILL.md) | Defines how the single lease grantor selects, claims, and reconciles work: leases, lifecycle, recovery, dispatch, backlog, board. Use when granting or reconciling work. |
| [`kai-core-work-item`](../../plugins/kai-core/skills/kai-core-work-item/SKILL.md) | Defines the durable work-item record: its schema, field rules, and Outcome/Acceptance/Evidence templates. Use when creating or updating a work item. |
| [`kai-core-asset-producing`](../../plugins/kai-core/skills/kai-core-asset-producing/SKILL.md) | Defines how a run produces and closes out a durable asset: pre-dispatch declaration, disposition and validity state, metadata, revision, supersession, and migration. |
| [`kai-core-asset-closing`](../../plugins/kai-core/skills/kai-core-asset-closing/SKILL.md) | Defines the verdicts over an existing asset: four-dimensional completion, acceptance authority, freshness, placement and promotion, and initiative closure. |

### Agent authoring

Classify, name, scope, and validate a new or redesigned Kai role before it joins the fleet.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-create-agent`](../../plugins/kai-core/skills/kai-core-create-agent/SKILL.md) | Creates or refines one Kai agent from a tested identity, authority boundary, execution profile, routing contract, and focused instruction set. |

### Engineering craft

Per-change discipline every `principal-swe-*` agent routes.

| Name | What it owns |
| ---- | ------------ |
| [`coding-style`](../../plugins/kai-engineering/skills/coding-style/SKILL.md) | Use when applying shared implementation defaults where repository conventions and task instructions leave appropriate details unspecified. |
| [`research-before-coding`](../../plugins/kai-engineering/skills/research-before-coding/SKILL.md) | Enforces research before non-trivial code changes. Use when investigating ownership, reusable code, and tradeoffs before editing. |
| [`pr-sizing`](../../plugins/kai-engineering/skills/pr-sizing/SKILL.md) | PR sizing method. Use when planning a feature, large refactor, or multi-file change into independently shippable, reviewable increments. |
| [`kai-core-pr-delivery`](../../plugins/kai-core/skills/kai-core-pr-delivery/SKILL.md) | PR delivery hygiene contract. Use when a finished change needs branch naming, conventional-commit title, PR body, verification, and protection-safe handoff. |
| [`onboard-to-codebase`](../../plugins/kai-engineering/skills/onboard-to-codebase/SKILL.md) | Fast codebase onboarding report. Use when mapping an unfamiliar repo's stack, commands, architecture, conventions, patterns, and gotchas for future sessions. |
| [`build-diagrams`](../../plugins/kai-engineering/skills/build-diagrams/SKILL.md) | Shared diagram vocabulary and ASCII-first rules. Use when writing a design, decision, or engineering doc, or a README, needing system, data, flow, state, or topology diagrams. |

### Design grounding

The shared design-system grounding contract, with the frontend seam.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-design-grounding`](../../plugins/kai-core/skills/kai-core-design-grounding/SKILL.md) | Design-system grounding contract. Use when design, frontend, or brand work must consume, derive, or propose changes to an app's settled visual language. |

### Creative methods

Offline mockups and diagrams, video direction, and directly invocable demo planning, capture, zoom, and measured narration.

| Name | What it owns |
| ---- | ------------ |
| [`ui-mockup`](../../plugins/kai-creative/skills/ui-mockup/SKILL.md) | Provides human-confirmable UI mockup discipline. Use when pre-implementation design choices need ASCII or offline HTML options before a decision. |
| [`html-block-diagrams`](../../plugins/kai-creative/skills/html-block-diagrams/SKILL.md) | Block-diagram vocabulary for HTML artifacts: five CSS arrangements and a self-contained palette. Use when an HTML artifact or an exported image needs a rich diagram. |
| [`video-direction`](../../plugins/kai-creative/skills/video-direction/SKILL.md) | Creates video creative direction from product intelligence and media. Use when planning briefs, storyboards, edit decisions, voiceover, or AI video prompts. |
| [`create-product-demo`](../../plugins/kai-creative/skills/create-product-demo/SKILL.md) | Product demo direction and planning. Use before capture, narration, or zoom when choosing the demo destination, audience, length, shape, story, and checks. |
| [`demo-capture`](../../plugins/kai-creative/skills/demo-capture/SKILL.md) | Screen-demo capture method. Use when recording the real run for an approved demo screenplay and producing the take manifest for later narration or zoom work. |
| [`demo-zoom`](../../plugins/kai-creative/skills/demo-zoom/SKILL.md) | Focus-plan rendering method for demos. Use after capture when turning a real recording plus declared focus coordinates into one continuous ffmpeg zoom pass. |
| [`demo-narrate`](../../plugins/kai-creative/skills/demo-narrate/SKILL.md) | Measured narration method for demos. Use after capture when writing, synthesizing, timing, and fitting spoken lines to visible states in the recording. |

### Marketing methods

Grounded intelligence and LinkedIn drafts with provenance, claim ledgers, and optional personal voicing.

| Name | What it owns |
| ---- | ------------ |
| [`product-marketing-intelligence`](../../plugins/kai-marketing/skills/product-marketing-intelligence/SKILL.md) | Builds durable product marketing intelligence. Use when product surfaces, media, notes, or product maps must feed downstream content or creative work. |
| [`linkedin-content`](../../plugins/kai-marketing/skills/linkedin-content/SKILL.md) | LinkedIn content method for grounded product intelligence. Use when drafting posts, angle matrices, calendars, or carousel outlines from product_context.json. |

### Web & content

Browser-run plumbing, content methods, and shared claim safety.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-web-evaluation`](../../plugins/kai-core/skills/kai-core-web-evaluation/SKILL.md) | Provides safe Playwright live-product evaluation plumbing. Use when QA, UX, SEO, or product exploration needs login, evidence, screenshots, and reports. |
| [`kai-core-web-content-extraction`](../../plugins/kai-core/skills/kai-core-web-content-extraction/SKILL.md) | Extracts readable website content to markdown. Use when course modules, certification units, docs, or long articles need downstream consumption. |
| [`kai-core-content-grounding`](../../plugins/kai-core/skills/kai-core-content-grounding/SKILL.md) | Claim-safety and provenance rules for product content. Use when creating external-facing LinkedIn posts, video scripts, or other content from product intelligence. |
| [`kai-core-pulse-digest`](../../plugins/kai-core/skills/kai-core-pulse-digest/SKILL.md) | Defines weekly catch-up digest collection and output. Use when workflow-weekly-pulse needs source adapters, privacy rules, prioritization, and page shapes. |

### Learning method & shared audio

Learning owns the offline HTML lesson method; core owns the separately confirmed audio utility. Neither output proves the other exists.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-generate-audio`](../../plugins/kai-core/skills/kai-core-generate-audio/SKILL.md) | Markdown-to-audio lesson generation. Use when converting notes, READMEs, course content, or drafts into multilingual narrated audio with lectoria. |
| [`generate-html-lesson`](../../plugins/kai-learning/skills/generate-html-lesson/SKILL.md) | Markdown-to-HTML lesson generation. Use when creating a self-contained visual lesson page, often as the companion to generated audio or an instructor flow. |

### Assistant methods

The private methods behind the personal assistant and persona-self. Never autonomous.

| Name | What it owns |
| ---- | ------------ |
| [`personal-agenda`](../../plugins/kai-assistant/skills/personal-agenda/SKILL.md) | Personal task and agenda method. Use when capturing, updating, or prioritizing the user's own tasks, or rendering their what-needs-you view from the inbox and, on request, team signals. |
| [`decision-brief`](../../plugins/kai-assistant/skills/decision-brief/SKILL.md) | Decision briefing from supplied or selected evidence. Use when a personal or team decision needs options, tradeoffs, provenance, unresolved facts, and a sourced recommendation in one place. |
| [`extract-writing-style`](../../plugins/kai-assistant/skills/extract-writing-style/SKILL.md) | Portable voice-profile extraction. Use when the user asks to build or refresh their writing-style profile from past messages or supplied samples. |
| [`write-in-user-voice`](../../plugins/kai-assistant/skills/write-in-user-voice/SKILL.md) | Applies supplied or approved stored writing preferences to a draft while preserving intent, facts, and uncertainty. Use for user-voice drafting, rewriting, or replies. |

### Operator signals

Core's own reading of what the team records need a human for, plus the runner-invoked notification contract.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-proactive-scan`](../../plugins/kai-core/skills/kai-core-proactive-scan/SKILL.md) | Owns operator-signal interpretation (decisions, replies, actions, release-ready items) for on-demand briefings, and defines runner-invoked proactive notifications. Use when interpreting team records for a requested briefing or scan, or when an external cadence scans workspaces for newly actionable items. |

---

**Next:** [How kai works](../how-kai-works.md) · [Workspace model](../workspaces.md) ·
[Getting started](../getting-started.md)

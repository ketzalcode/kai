[kai](../../README.md) / [Docs](../README.md) / Agents & skills

# Agents & skills

<!-- GENERATED FILE — do not edit by hand.
     Source: agent/skill frontmatter + the CATEGORIES table in
     scripts/generate-catalog.mjs. Regenerate with `npm run docs:generate`;
     `npm test` fails if this file drifts from the shipped surface. -->

kai ships **56 agents** and **53 skills** (12 of the skills are directly user-invocable; the rest are inherited by the agents that need them).

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

The two front doors. Everything else is reachable through them.

| Name | What it owns |
| ---- | ------------ |
| [`director-executive-assistant`](../../plugins/kai-core/agents/director-executive-assistant.agent.md) | Manages the operator's personal agenda, catch-up, task capture, unclear routing, and decisions waiting on them. Use when asking what needs you or who should handle it. Not driving delivery (`director-chief-of-staff`). |
| [`director-chief-of-staff`](../../plugins/kai-core/agents/director-chief-of-staff.agent.md) | Coordinates Kai roles to drive an outcome, work item, initiative, or incident to truthful completion. Use when asking someone to ship, run, or drive work. Not personal agenda triage (`director-executive-assistant`). |

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

### Document review

One orchestrator that fans a document out to the review lenses and aggregates the verdict.

| Name | What it owns |
| ---- | ------------ |
| [`workflow-doc-review`](../../plugins/kai-engineering/agents/workflow-doc-review.agent.md) | Produces one consolidated substance review for a design doc, PRD, RFC, strategy doc, or proposal. Use when a draft document needs routed multi-lens review. Not implementation or auto-posting. |

### Product

Need, scope, interaction design, documentation, and brand.

| Name | What it owns |
| ---- | ------------ |
| [`principal-product-manager`](../../plugins/kai-product/agents/principal-product-manager.agent.md) | Owns product scope and initiative stewardship: product briefs, smallest-correct scope decisions, north stars, proposal grooming, prioritization, and truthful closure. Use before design or engineering. |
| [`principal-product-strategist`](../../plugins/kai-product/agents/principal-product-strategist.agent.md) | Investigates future product opportunities, analogous products, fit scores, candidate actions, and smallest validating experiments. Use before scope decisions. Not current initiative stewardship (`principal-product-manager`). |
| [`principal-product-designer`](../../plugins/kai-product/agents/principal-product-designer.agent.md) | Designs interaction models for approved product needs and reviews implementation against the approved design. Use after PM scope exists. Not product scope (`principal-product-manager`) or visual brand (`principal-brand-designer`). |
| [`eng-lead-technical-writing`](../../plugins/kai-engineering/agents/eng-lead-technical-writing.agent.md) | Owns technical-documentation architecture, audience fit, accuracy, findability, and editorial acceptance. Use for README, guides, reference, release notes, or documentation audits. Not product scope, claims, translation, or publishing. |
| [`principal-brand-designer`](../../plugins/kai-product/agents/principal-brand-designer.agent.md) | Creates SaaS visual-identity systems, brand guidelines, visual-asset direction, and brand critique from positioning and brand evidence. Use for logo, color, typography, iconography, or illustration. Not product UI (`principal-product-designer`). |
| [`workflow-localization`](../../plugins/kai-engineering/agents/workflow-localization.agent.md) | Runs SaaS i18n-readiness and locale-QA workflow for strings, formatting, pluralization, RTL, encoding, translation routing, and build checks. Use when a surface needs localization readiness. Not translating or code edits. |

### Customer operations

Post-sale outcomes and bounded support intake.

| Name | What it owns |
| ---- | ------------ |
| [`principal-customer-success`](../../plugins/kai-gtm/agents/principal-customer-success.agent.md) | Builds SaaS success plans, adoption plans, health reviews, churn or renewal risk assessments, QBR briefs, and portfolio views from customer evidence. Use for post-sale outcome and risk judgment. |
| [`workflow-support-triage`](../../plugins/kai-gtm/agents/workflow-support-triage.agent.md) | Classifies supplied SaaS tickets and conversations, screens incident/security candidates, deduplicates, assigns impact urgency, and routes owners. Use for support intake. Not replies, closures, timelines, code edits, or incident resolution. |

### Revenue & go-to-market

Pre-sale motion and the commercial operating model. Only you accept terms.

| Name | What it owns |
| ---- | ------------ |
| [`principal-sales`](../../plugins/kai-gtm/agents/principal-sales.agent.md) | Turns SaaS deal, account, discovery, and competitive evidence into qualification, discovery, deal strategy, objections, proposals, forecasts, and win/loss guidance. Use for pre-sale sales judgment. Not pricing authority or solution design. |
| [`principal-solutions-architect`](../../plugins/kai-engineering/agents/principal-solutions-architect.agent.md) | Turns buyer requirements, environment, and integration evidence into SaaS technical discovery, solution fit, feasibility, POC scope, objections, and questionnaire guidance. Use pre-sale. Not roadmap, pricing, implementation, or attestations. |
| [`principal-revenue-operations`](../../plugins/kai-gtm/agents/principal-revenue-operations.agent.md) | Builds the SaaS revenue operating model, forecast hygiene, billing/subscription ops, and quota/territory/comp inputs. Use with supplied pipeline, billing, usage, or analytics evidence. Not pricing or sales deal judgment. |
| [`principal-demand-generation`](../../plugins/kai-gtm/agents/principal-demand-generation.agent.md) | Designs SaaS campaign strategy, briefs, lifecycle/nurture email, channel mix, lead handoff, and demand diagnosis from approved positioning. Use for demand gen. Not PLG lifecycle experiments (`principal-growth`). |
| [`principal-partnerships`](../../plugins/kai-gtm/agents/principal-partnerships.agent.md) | Designs SaaS partner strategy, partner-fit assessments, integration partnerships, channel/reseller programs, and co-sell or co-marketing plans. Use for partnership judgment, not legal terms or outbound contact. |

### Growth, analytics & monetization

Lifecycle diagnosis, metric validity, experiment integrity, and price.

| Name | What it owns |
| ---- | ------------ |
| [`principal-growth`](../../plugins/kai-gtm/agents/principal-growth.agent.md) | Diagnoses SaaS lifecycle growth and designs bounded experiments across acquisition, activation, engagement, retention, referral, reactivation, and paid conversion. Use for aggregate PLG growth. Not campaign demand gen (`principal-demand-generation`). |
| [`principal-data-analytics`](../../plugins/kai-product/agents/principal-data-analytics.agent.md) | Defines metric contracts and analyzes supplied SaaS exports for funnel, cohort, retention, segmentation, experiments, and instrumentation gaps. Use for analytical validity and causal-status judgment. Not pipelines (`principal-data-engineer`). |
| [`workflow-experiment-review`](../../plugins/kai-product/agents/workflow-experiment-review.agent.md) | Gates SaaS experiment integrity before launch or after readout, covering design, metrics, exposure, peeking, comparisons, guardrails, and causal status. Use when an experiment needs independent certification. Not growth or product decisions. |
| [`principal-pricing-monetization`](../../plugins/kai-gtm/agents/principal-pricing-monetization.agent.md) | Recommends SaaS pricing models, packaging, price changes, discount policy, and monetization experiments from supplied cost, WTP, competitive, packaging, and analytics evidence. Use for pricing judgment. |
| [`workflow-customer-feedback`](../../plugins/kai-product/agents/workflow-customer-feedback.agent.md) | Synthesizes supplied SaaS surveys, NPS/CSAT, reviews, interviews, and feature requests into de-identified themes and owner routing. Use when customer feedback needs privacy-first clustering. Not product scoping or customer replies. |

### AI research to product

Track the live AI landscape, then turn a finding into something buildable.

| Name | What it owns |
| ---- | ------------ |
| [`principal-ai-researcher`](../../plugins/kai-engineering/agents/principal-ai-researcher.agent.md) | Researches live AI landscape changes and writes Lectoria-ready briefings on model releases, papers, training, inference, evals, safety, agents, and multimodal progress. Use for AI updates or a named paper/topic. |
| [`principal-ai-applied-engineer`](../../plugins/kai-engineering/agents/principal-ai-applied-engineer.agent.md) | Turns AI research or product ideas into ticket-grade applied designs with architecture, FE/BE work, eval, rollout, risk, cost, latency, and build/no-build guidance. Use when deciding how to ship AI. |

### Learning & content

Author lessons, package existing material, or steward a whole path.

| Name | What it owns |
| ---- | ------------ |
| [`instructor-tutor`](../../plugins/kai-personal/agents/instructor-tutor.agent.md) | Authors concrete-first lessons for any subject in Explain, Lesson, or Series mode. Use when the operator needs a gap topic taught from scratch. Not packaging existing markdown (`instructor-teacher`). |
| [`instructor-teacher`](../../plugins/kai-personal/agents/instructor-teacher.agent.md) | Turns chaptered markdown - course units, book chapters, study notes - into paired HTML and audio lessons, one per source file, on any subject. Use after a learning module is extracted, or for a folder of related notes. |
| [`instructor-path-mentor`](../../plugins/kai-personal/agents/instructor-path-mentor.agent.md) | Stewards a whole certification or structured learning path over time: plan, status, advance, review, and update. Use after choosing the path. Not career strategy (`principal-engineer-career-mentor`). |
| [`workflow-course-to-audio`](../../plugins/kai-personal/agents/workflow-course-to-audio.agent.md) | Extracts a course, certification module, learning-path unit, or long readable web page into local markdown for later audio. Use when a URL should become listenable study material with separate knowledge checks. |

### Product exploration & web evaluation

Look at a real surface — as a tester, an auditor, or a particular kind of user.

| Name | What it owns |
| ---- | ------------ |
| [`workflow-product-explore`](../../plugins/kai-product/agents/workflow-product-explore.agent.md) | Produces an evidence-backed live-product map, and optionally a neutral design-system extract. Use when peers need a product surface explored without rediscovery. Not UX evaluation, defect filing, scope, or design recommendations. |
| [`principal-product-marketing`](../../plugins/kai-gtm/agents/principal-product-marketing.agent.md) | Builds grounded product marketing intelligence from public surfaces, screenshots, recordings, assets, notes, or product maps. Use when content or creative agents need reusable product context. Not product scope (`principal-product-manager`). |
| [`principal-qa-ui`](../../plugins/kai-engineering/agents/principal-qa-ui.agent.md) | Manually tests a website UI for objective defects: overlap, overflow, broken controls, console or network errors with visible impact, focus order, and viewport layout breaks. Use for QA passes. Not fresh-eyes UX (`persona-ux-first-time-user`). |
| [`principal-seo`](../../plugins/kai-gtm/agents/principal-seo.agent.md) | Audits a site's technical SEO, content alignment, and agentic-search readiness (llms.txt, schema, AI-bot directives). Use when asking whether Google and AI search engines can find and parse a site. Not general UI defects (`principal-qa-ui`). |
| [`persona-ux-first-time-user`](../../plugins/kai-product/agents/persona-ux-first-time-user.agent.md) | Simulates a first-time customer walkthrough and reports subjective flow clarity, copy, missing context, unmet expectations, and confusion points. Use for fresh-eyes feedback. Not defect QA (`principal-qa-ui`). |
| [`persona-professional-trainer`](../../plugins/kai-personal/agents/persona-professional-trainer.agent.md) | Audits fitness-product workouts and programs for safety, completeness, progression, screening, volume, and injury-aware substitutions. Not meal plans or macros (`persona-professional-nutritionist`). |
| [`persona-professional-nutritionist`](../../plugins/kai-personal/agents/persona-professional-nutritionist.agent.md) | Audits fitness-product meal plans, macros, pantry suggestions, and projection math for nutrition accuracy, macro safety, micronutrient gaps, and allergen risk. Not exercise programming (`persona-professional-trainer`). |

### Content & distribution

Turn product intelligence into platform-native content. Never auto-publishes.

| Name | What it owns |
| ---- | ------------ |
| [`principal-linkedin-strategist`](../../plugins/kai-gtm/agents/principal-linkedin-strategist.agent.md) | Turns product intelligence and media into grounded, platform-native LinkedIn post variants, angle matrices, calendars, and carousel outlines. Use for LinkedIn content strategy. Never auto-publishes. |
| [`creative-video-director`](../../plugins/kai-personal/agents/creative-video-director.agent.md) | Directs product and marketing videos from product intelligence and media into briefs, storyboards, edit decisions, voiceover, and AI-video prompts. Use when planning a video, not rendering or editing one. |

### Personal

Your voice, your career, your week. Workspace-local and gitignored.

| Name | What it owns |
| ---- | ------------ |
| [`persona-self`](../../plugins/kai-personal/agents/persona-self.agent.md) | Drafts, rewrites, and replies in the user's voice with senior-engineer professionalism. Use for messages, posts, emails, design docs, PR descriptions, and replies. Never auto-publishes. |
| [`principal-engineer-career-mentor`](../../plugins/kai-personal/agents/principal-engineer-career-mentor.agent.md) | Mentors IC-track career progression through intake, check-ins, reviews, spot consults, cert planning, and visibility nudges. Use for career strategy. Not executing a chosen learning path (`instructor-path-mentor`). |
| [`workflow-weekly-pulse`](../../plugins/kai-core/agents/workflow-weekly-pulse.agent.md) | Produces a concise weekly activity digest via kai-core-pulse-digest while keeping source bindings private. Use when the operator asks for a week-in-review. Not posting, pushing, mutating sources, or auto-running audio. |
| [`workflow-proactive-scan`](../../plugins/kai-core/agents/workflow-proactive-scan.agent.md) | Emits a read-only notification payload for newly actionable @operator signals and release-ready items. Use when an external scheduler runs a selected kai workspace scan. Not autonomous replies, approvals, commits, or deploys. |

## Skills

Skills are methods and contracts. Most are inherited by an agent rather than
invoked directly — the agent names them on its `**Inherits:**` line.

### Workspace & scope

The shared contracts every acting agent inherits: where work goes, and what it may change.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-team-operating-rules`](../../plugins/kai-core/skills/kai-core-team-operating-rules/SKILL.md) | Defines the universal kai role operating contract. Use whenever acting as a kai role in any workspace, including ownership, handoffs, tests, shipping, and @operator. |
| [`kai-core-asset-lifecycle`](../../plugins/kai-core/skills/kai-core-asset-lifecycle/SKILL.md) | Defines universal generated-asset completion, disposition, validity, ownership, freshness, supersession, and initiative closure rules. |
| [`kai-core-workspace-conventions`](../../plugins/kai-core/skills/kai-core-workspace-conventions/SKILL.md) | Defines universal workspace output routing. Use when file-producing kai agents need target roots, .kai manifest validation, or canonical artifact paths. |
| [`kai-core-workspace-onboarding`](../../plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md) | Initializes and validates kai workspaces, and guides explicit migration to the split pack install surface. Use when installing kai packs or creating or repairing workspace state. |
| [`kai-core-work-coordination`](../../plugins/kai-core/skills/kai-core-work-coordination/SKILL.md) | Defines durable multi-agent coordination. Use when concurrent work needs item state, board, threads, backlog, leases, dependencies, handoffs, or evidence paths. |
| [`kai-core-work-activity`](../../plugins/kai-core/skills/kai-core-work-activity/SKILL.md) | Defines fine-grained agent activity signals. Use when agents need append-only start, progress, stop, deadline, and silence reporting in .kai/activity.jsonl. |
| [`kai-core-fleet-observation`](../../plugins/kai-core/skills/kai-core-fleet-observation/SKILL.md) | Kai subagent fleet observer guide. Use when the operator wants to launch or interpret the live watcher and inspect which roles did or did not participate. |
| [`kai-core-definition-of-done`](../../plugins/kai-core/skills/kai-core-definition-of-done/SKILL.md) | Release-readiness and production-completion gate. Use when deciding whether work can move to in-review, release-ready, or shipped. |
| [`kai-core-scope-discipline`](../../plugins/kai-core/skills/kai-core-scope-discipline/SKILL.md) | Governs assessment-versus-action scope boundaries. Use when assessors, PM, design, or SWE roles must avoid silently expanding approved scope. |
| [`kai-core-no-self-remediation`](../../plugins/kai-core/skills/kai-core-no-self-remediation/SKILL.md) | Assessor write-boundary contract. Use when a review or assessment role must report findings without mutating the target under review. |
| [`kai-core-issue-analysis`](../../plugins/kai-core/skills/kai-core-issue-analysis/SKILL.md) | Issue-to-approach analysis. Use when grounding an issue, testing decisive assumptions, framing options, and stopping at the authorized decision owner. |
| [`kai-core-initiative-stewardship`](../../plugins/kai-core/skills/kai-core-initiative-stewardship/SKILL.md) | Initiative steward contract. Use when managing north-star state, proposals, priorities, item records, milestones, or closure for an initiative. |
| [`kai-core-peer-communication`](../../plugins/kai-core/skills/kai-core-peer-communication/SKILL.md) | Peer-question packet contract. Use when kai roles need a real QUESTION/ANSWER exchange over inline consult, peer transport, or durable item thread. |
| [`product-exploration`](../../plugins/kai-product/skills/product-exploration/SKILL.md) | Provides neutral live-product mapping. Use when PM, design, QA, domain, or engineering need an evidence-backed navigation model without UX evaluation. |
| [`product-marketing-intelligence`](../../plugins/kai-gtm/skills/product-marketing-intelligence/SKILL.md) | Builds durable product marketing intelligence. Use when product surfaces, media, notes, or product maps must feed downstream content or creative work. |
| [`kai-core-contract-v1`](../../plugins/kai-core/skills/kai-core-contract-v1/SKILL.md) | Reports that kai-core is installed and which contract version it provides. Invoked as the first action of every kai department pack agent. |

### Agent authoring

Classify, name, scope, and validate a new or redesigned Kai role before it joins the fleet.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-create-agent`](../../plugins/kai-core/skills/kai-core-create-agent/SKILL.md) | Creates or refines one Kai agent from a tested identity, authority boundary, execution profile, routing contract, and focused instruction set. |

### Engineering craft

Per-change discipline every `principal-swe-*` agent inherits.

| Name | What it owns |
| ---- | ------------ |
| [`coding-style`](../../plugins/kai-engineering/skills/coding-style/SKILL.md) | User coding preferences. Use when writing, editing, or refactoring code, especially to keep changes simple, readable, composed, and aligned with repo conventions. |
| [`research-before-coding`](../../plugins/kai-engineering/skills/research-before-coding/SKILL.md) | Enforces research before non-trivial code changes. Use when investigating ownership, reusable code, and tradeoffs before editing. |
| [`pr-sizing`](../../plugins/kai-engineering/skills/pr-sizing/SKILL.md) | PR sizing method. Use when planning a feature, large refactor, or multi-file change into independently shippable, reviewable increments. |
| [`kai-core-pr-delivery`](../../plugins/kai-core/skills/kai-core-pr-delivery/SKILL.md) | PR delivery hygiene contract. Use when a finished change needs branch naming, conventional-commit title, PR body, verification, and protection-safe handoff. |
| [`onboard-to-codebase`](../../plugins/kai-engineering/skills/onboard-to-codebase/SKILL.md) | Fast codebase onboarding report. Use when mapping an unfamiliar repo's stack, commands, architecture, conventions, patterns, and gotchas for future sessions. |
| [`build-diagrams`](../../plugins/kai-engineering/skills/build-diagrams/SKILL.md) | Shared diagram vocabulary and ASCII-first rules. Use when writing a design, decision, or engineering doc, or a README, needing system, data, flow, state, or topology diagrams. |

### Document review

The method plus the lenses behind `workflow-doc-review`.

| Name | What it owns |
| ---- | ------------ |
| [`doc-review-rigor`](../../plugins/kai-engineering/skills/doc-review-rigor/SKILL.md) | Document review rigor method. Use from review dimension skills or workflow-doc-review when judging load-bearing claims, evidence, confidence, and value. |
| [`review-rationale`](../../plugins/kai-engineering/skills/review-rationale/SKILL.md) | Rationale review lens. Use when pressure-testing a doc's problem statement, premises, reasoning chain, or why this solution follows. |
| [`review-alternatives`](../../plugins/kai-engineering/skills/review-alternatives/SKILL.md) | Alternatives review lens. Use when a doc must justify the chosen option against tradeoffs, missing options, do-nothing, buy/build, or smaller steps. |
| [`review-risks-scope`](../../plugins/kai-engineering/skills/review-risks-scope/SKILL.md) | Risks and scope review lens. Use when checking whether risks, mitigations, assumptions, in-scope work, and out-of-scope work are explicit. |
| [`review-success-metrics`](../../plugins/kai-engineering/skills/review-success-metrics/SKILL.md) | Success metrics review lens. Use when a doc needs measurable goals, baselines, targets, instrumentation, or checks for gameable proxy metrics. |
| [`review-security-privacy`](../../plugins/kai-engineering/skills/review-security-privacy/SKILL.md) | Security and privacy review lens. Use when a doc touches data, auth, PII, secrets, trust boundaries, threat surface, or external sharing. |
| [`review-performance-scale`](../../plugins/kai-engineering/skills/review-performance-scale/SKILL.md) | Performance and scale review lens. Use when a doc proposes a service, API, data path, latency budget, volume, concurrency, or load-sensitive work. |
| [`review-dependencies`](../../plugins/kai-engineering/skills/review-dependencies/SKILL.md) | Dependencies review lens. Use when work crosses team, service, API, upstream/downstream, sign-off, breaking-change, or third-party boundaries. |
| [`review-rollout-operability`](../../plugins/kai-engineering/skills/review-rollout-operability/SKILL.md) | Rollout and operability review lens. Use when production changes need staged rollout, rollback, kill switch, monitoring, alerts, on-call, or runbooks. |
| [`review-ux-accessibility`](../../plugins/kai-engineering/skills/review-ux-accessibility/SKILL.md) | UX and accessibility review lens. Use when a user-facing UI doc needs flows, states, edge cases, keyboard, focus, screen-reader, contrast, or motion review. |

### Product design

Design-system grounding and human-confirmable mockups, with the frontend seam.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-design-grounding`](../../plugins/kai-core/skills/kai-core-design-grounding/SKILL.md) | Design-system grounding contract. Use when design, frontend, or brand work must consume, derive, or propose changes to an app's settled visual language. |
| [`ui-mockup`](../../plugins/kai-product/skills/ui-mockup/SKILL.md) | Provides human-confirmable UI mockup discipline. Use when pre-implementation design choices need ASCII or offline HTML options before a decision. |
| [`html-block-diagrams`](../../plugins/kai-product/skills/html-block-diagrams/SKILL.md) | Block-diagram vocabulary for HTML artifacts: five CSS arrangements and a self-contained palette. Use when an HTML artifact or an exported image needs a rich diagram. |

### Web & content

Browser-run plumbing and the claim-safety contract creative agents inherit.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-web-evaluation`](../../plugins/kai-core/skills/kai-core-web-evaluation/SKILL.md) | Provides safe Playwright live-product evaluation plumbing. Use when QA, UX, SEO, or product exploration needs login, evidence, screenshots, and reports. |
| [`kai-core-web-content-extraction`](../../plugins/kai-core/skills/kai-core-web-content-extraction/SKILL.md) | Extracts readable website content to markdown. Use when course modules, certification units, docs, or long articles need downstream consumption. |
| [`kai-core-content-grounding`](../../plugins/kai-core/skills/kai-core-content-grounding/SKILL.md) | Claim-safety and provenance rules for product content. Use when creating external-facing LinkedIn posts, video scripts, or other content from product intelligence. |
| [`linkedin-content`](../../plugins/kai-gtm/skills/linkedin-content/SKILL.md) | LinkedIn content method for grounded product intelligence. Use when drafting posts, angle matrices, calendars, or carousel outlines from product_context.json. |
| [`video-direction`](../../plugins/kai-personal/skills/video-direction/SKILL.md) | Creates video creative direction from product intelligence and media. Use when planning briefs, storyboards, edit decisions, voiceover, or AI video prompts. |
| [`demo-capture`](../../plugins/kai-personal/skills/demo-capture/SKILL.md) | Screen-demo capture method. Use when recording the real run for an approved demo screenplay and producing the take manifest for later narration or zoom work. |
| [`demo-zoom`](../../plugins/kai-personal/skills/demo-zoom/SKILL.md) | Focus-plan rendering method for demos. Use after capture when turning a real recording plus declared focus coordinates into one continuous ffmpeg zoom pass. |
| [`demo-narrate`](../../plugins/kai-personal/skills/demo-narrate/SKILL.md) | Measured narration method for demos. Use after capture when writing, synthesizing, timing, and fitting spoken lines to visible states in the recording. |
| [`create-product-demo`](../../plugins/kai-personal/skills/create-product-demo/SKILL.md) | Product demo direction and planning. Use before capture, narration, or zoom when choosing the demo destination, audience, length, shape, story, and checks. |
| [`kai-core-pulse-digest`](../../plugins/kai-core/skills/kai-core-pulse-digest/SKILL.md) | Defines weekly catch-up digest collection and output. Use when workflow-weekly-pulse needs source adapters, privacy rules, prioritization, and page shapes. |

### Lessons & writing

Turn markdown into lessons, audio, or your own voice.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-generate-audio`](../../plugins/kai-core/skills/kai-core-generate-audio/SKILL.md) | Markdown-to-audio lesson generation. Use when converting notes, READMEs, course content, or drafts into multilingual narrated audio with lectoria. |
| [`generate-html-lesson`](../../plugins/kai-personal/skills/generate-html-lesson/SKILL.md) | Markdown-to-HTML lesson generation. Use when creating a self-contained visual lesson page, often as the companion to generated audio or an instructor flow. |
| [`extract-writing-style`](../../plugins/kai-personal/skills/extract-writing-style/SKILL.md) | Portable voice-profile extraction. Use when persona-self needs the user's writing style captured from past messages or refreshed after voice drift. |

### Personal

The private methods behind the executive assistant. Never autonomous.

| Name | What it owns |
| ---- | ------------ |
| [`kai-core-personal-agenda`](../../plugins/kai-core/skills/kai-core-personal-agenda/SKILL.md) | Operator agenda assembly. Use when producing the current workspace's what-needs-you view from inbox tasks, @operator questions, release gates, and nudges. |
| [`kai-core-executive-consultation`](../../plugins/kai-core/skills/kai-core-executive-consultation/SKILL.md) | Private role-consultation method for the executive assistant. Use when a decision brief needs facts or independent judgment from real kai roles without impersonation. |
| [`kai-core-decision-brief`](../../plugins/kai-core/skills/kai-core-decision-brief/SKILL.md) | Decision brief packaging for the executive assistant. Use when an operator decision or deploy gate needs options, tradeoffs, role positions, recommendation, and next actions. |
| [`kai-core-proactive-scan`](../../plugins/kai-core/skills/kai-core-proactive-scan/SKILL.md) | Defines runner-invoked proactive notifications. Use when an external cadence scans workspaces for newly actionable decisions, replies, actions, or release-ready items. |

---

**Next:** [How kai works](../how-kai-works.md) · [Workspace model](../workspaces.md) ·
[Getting started](../getting-started.md)

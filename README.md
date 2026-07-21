# Kai

An open-source Copilot plugin that brings senior-engineering judgment into
every codebase you touch. Ships principles, language/framework style guides,
reviewer personas, and workflow automations that speed up the slow parts of
software work — without imposing a house style that isn't yours.

Designed to work in **both**:

- **GitHub Copilot CLI** (`copilot plugin install ...`)
- **Copilot coding agent** (the cloud agent that runs against your repos)

`kai` deliberately contains no employer-specific knowledge,
services, or MCP servers.

## Status

`v0.1.0` — the roster spans a full software-engineering org (frontend /
backend / infra / architect / manager), a product pair, an AI
research-to-product pair, a learning track, a web-evaluation suite, a
personal voice/career pair, a fan-out **document-review workflow**
(`workflow-doc-review`) backed by a shared rigor method and nine
`review-*` dimension skills, and a **weekly catch-up workflow**
(`workflow-weekly-pulse`) backed by the `pulse-digest` skill — plus the
shared skills they all lean on. Underpinning all of it is a **workspace
contract** (`workspace-conventions` + `workflow-workspace-init`) so agents
write to known places, not random folders. Full inventory below; the
roadmap lists what's queued next.

## Install

### Copilot CLI

**Prerequisite:** the Copilot CLI installed and logged in (`copilot` opens
the interactive prompt). See the
[Copilot CLI docs](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli)
if you don't have it yet.

**Install from GitHub (recommended):**

1. Start the CLI:
   ```powershell
   copilot
   ```
2. Add this repo as a plugin and install it:
   ```text
   /plugin install RubenSaucedo/kai
   ```
3. Confirm it loaded:
   ```text
   /plugin
   ```
   `kai` should appear in the list. The agents and skills are available in
   **new** sessions — start a fresh session to use them.

**Install from a local checkout** (development or offline):

```powershell
git clone https://github.com/RubenSaucedo/kai.git
cd kai
copilot
```
Then inside the CLI: `/plugin install .`

> Plugins are cached per session — changes appear only in new sessions. Run
> `/plugin` anytime to list, enable, or update plugins.

### Copilot coding agent (cloud)

Add `RubenSaucedo/kai` to the repository's coding-agent plugin configuration
so its skills and agents load into cloud sessions. The plugin is
framework-agnostic and ships no employer-specific services, so it works
against any repo.

## Iterate

After editing any file in this directory, reload from inside the CLI:

```text
/plugin update kai
```

Plugins are cached per session — changes only appear in **new** sessions.

## Layout

```
kai/
├── plugin.json         # plugin manifest (name, version, paths)
├── README.md           # this file
├── AGENTS.md           # house rules carried into every repo
├── LICENSE             # MIT
├── agents/             # one .agent.md per persona
└── skills/             # one folder per skill (each with SKILL.md)
```

## What it ships

### Workspace foundation

| Name | Purpose |
| ---- | ------- |
| `workflow-self-check` | Read-only structural-health auditor that writes one report under `.kai/runs/self-check/<date>/report.md`. |
| `workflow-workspace-init` | Idempotent onboarding for any repository or durable standalone folder. Creates `.kai/`, coordination, initiatives, library, and complete ignored `personal/` assistant/identity state, including migration guidance for legacy `.persona-self/`. |
| `workflow-initiative-init` | Bounded intake workflow that resolves the target workspace, then turns mission + vision into a proposed north star with stable milestones, success measures, deliverable index, and initial proposed item records. |

### Direction (`director-*`)

| Name | Purpose |
| ---- | ------- |
| `director-executive-assistant` | Your **default start for personal or unclear intent** in the current Kai workspace (direct delivery goes to the Chief of Staff; direct specialist work to the specialist). Optionally scans linked workspaces, routes delivery, consults real roles with provenance, packages pending decisions into briefs, captures tasks, and renders the forward agenda. **Never autonomous** — you press every send/approve/deploy button. |
| `director-chief-of-staff` | Human-facing team director. Resolves one visible target workspace, dispatches real principal/workflow agents with that exact root, reconciles handoffs/evidence, maintains board and deliverable indexes, and closes with a stable director summary and exact operator-facing paths. |

### Engineering (`principal-swe-*`)

| Name | Purpose |
| ---- | ------- |
| `principal-swe-frontend` | Principal-level frontend reviewer/builder for TypeScript, React, and CSS/styling architecture. Opinionated about hook discipline, component composition, accessibility, and styling conventions. P0–P2 finding scale. |
| `principal-swe-backend` | Principal-level backend reviewer/builder for APIs, server-side logic, data modeling, and model-invocation backends. Uncompromising on data integrity and security; disciplined about contracts, failure handling (timeouts/retries/idempotency), migrations, and observability. P0–P2 finding scale. |
| `principal-swe-infra` | Principal-level infrastructure/platform reviewer/builder for CI/CD, deployment, IaC, containerization, build tooling, secrets, and observability. Uncompromising on safety, reversibility, and secret hygiene; plan-before-apply, gated rollouts, pinned/scanned supply chain. P0–P2 finding scale. |
| `principal-swe-architect` | Owns the decisions that fall *between* the domain engineers — system shape, boundaries, contracts, cross-cutting NFRs. Two modes: single-app approach calls spanning FE+BE+infra (e.g. sync-vs-async), and multi-service/repo boundaries. Investigation-first; owns seams, not domains. Six-disposition taxonomy (Endorse / Reshape / Relocate / Decouple / Defer / Spike). Scarce and surgical. |
| `principal-swe-manager` | Build-feasibility layer between product intent and the engineers. Turns a committed action into a scoped, sequenced delivery plan — owned, sized workstreams; dependency-driven critical path; spikes for unknowns; scope pushback when cost outruns value. Writes no code. Six-disposition taxonomy (Ship / Slice / Spike / Sequence / Split / Pushback). **Situational** — skip for small or already-sequenced work. |

### Delivery

| Name | Purpose |
| ---- | ------- |
| `workflow-ship` | Release orchestrator with explicit PREPARE, CONFIRM-START, and CONFIRM-COMPLETE phases. It gates `release-ready`, records deployment start and successful completion separately, performs/records production verification, and only then marks `shipped`. Kai never performs deployment. |

### Document review

| Name | Purpose |
| ---- | ------- |
| `workflow-doc-review` | Orchestrator for a multi-lens substance review of a doc (design docs, PRDs, RFCs, strategy docs, dev-design proposals). Detects the doc type, decides which `review-*` dimensions apply, fans them out in parallel, then aggregates one consolidated review with per-finding draft comments. Every dimension inherits the `doc-review-rigor` method (load-bearing claims → grounding → six-class taxonomy → value filters). Partner before critic; verifies before asserting. **Never auto-posts.** |

### Product

| Name | Purpose |
| ---- | ------- |
| `principal-product-manager` | Judgment layer that triages UX/feedback reports into concrete product decisions. Owns the scope gate and, as default steward, grooms the backlog, promotes and prioritizes work, and truthfully closes initiatives as `completed` or `shipped` after their deliverables are indexed. |
| `principal-product-designer` | Owns interaction design for PM-approved user needs. Converts the product brief, current product map, and research into the smallest coherent interaction model, states, responsive behavior, accessibility intent, and design acceptance; independently reviews implementations against the approved design. |
| `principal-product-strategist` | Generative discovery counterpart to the PM. Drives a forward-looking product investigation and proposes a prioritized, evidence-backed catalog of net-new actions (web research + supplied data; no live data queries). Every candidate names the job it serves and its smallest validating experiment. Six-tier taxonomy (Lead / Fast-follow / Bet / Explore / Park / Pass). |

### AI research → product

| Name | Purpose |
| ---- | ------- |
| `principal-ai-researcher` | Researches the live AI landscape and produces a narration-ready one-page briefing on what changed since the last run (models, papers, inference/training advances, evals, safety, agentic/multimodal). Reads prior briefings to avoid repeats; always live web search. Default briefing + expanded single-topic mode. |
| `principal-ai-applied-engineer` | Bridge between AI research and shipped product. Takes a research finding + product context and produces a ticket-grade applied-engineering design doc (architecture, FE/BE breakdowns, integration contract, eval plan, rollout, risk register, cost/latency budget, and an honest "should we even do this?"). Delegates slices to the `principal-swe-*` engineers. |

### Learning & content

| Name | Purpose |
| ---- | ------- |
| `principal-engineer-teacher` | Pedagogy orchestrator — turns chaptered/sectioned markdown (course units, book chapters, humanized docs, notes) into paired HTML-visual + audio-narration lessons per source file. Orchestrates `generate-html-lesson` (English visual) + `generate-audio` (Spanish narration). |
| `principal-engineer-tutor` | Generative tutor for engineering/AI topics. Writes original lessons under `.kai/runs/lessons/`; never auto-runs audio. |
| `workflow-course-to-audio` | Turns a course, cert module, or long readable web page into local markdown ready for `generate-audio`. Wraps `web-content-extraction` for the crawl, then offers an explicit audio handoff (never auto-runs — Azure cost). Knowledge-checks split into a separate file so narration stays clean. |

### Product exploration and web evaluation

| Name | Purpose |
| ---- | ------- |
| `workflow-product-explore` | Produces neutral, reusable product-navigation facts for other agents; it is not QA, UX evaluation, or design. |
| `principal-product-marketing` | Product researcher + marketing analyst. Turns a product surface (public marketing pages, screenshots, recordings, notes, or a product-map) into a reusable, product-agnostic intelligence layer — a human report plus `product_context.json` + `media_manifest.json` — that downstream content/creative agents consume cold. Types every assertion fact / inference / recommendation with source, confidence, and basis. Generic; no product hard-coded. |
| `principal-qa-ui` | Senior QA engineer doing deep manual UI testing via Playwright MCP. Hunts objectively broken things — overlap, overflow, broken buttons, console/network errors, focus order, viewport breakage. Defect report via `web-evaluation`. |
| `principal-seo` | SEO + agentic-search auditor — technical SEO, content-SEO alignment, and agentic-search readiness (llms.txt, schema density, AI-bot directives, JS-blind extractability). Carries a 2026 baseline and refreshes against the live spec each run. Report via `web-evaluation`. |
| `persona-ux-first-time-user` | Simulates a first-time customer walking a surface via Playwright MCP. Subjective friction + concrete proposals — not a defect log. Report via `web-evaluation`. |
| `persona-professional-trainer` | Simulates a credentialed strength-and-conditioning coach auditing a fitness product (NSCA/ACSM mental model). Stays in the programming lane; consults the nutritionist for nutrition. |
| `persona-professional-nutritionist` | Simulates a credentialed sports nutritionist / RD auditing a nutrition product (TDEE, macro floors, allergen safety, restrictive-diet gaps). Stays in the nutrition lane; consults the trainer for exercise. |

### Content & distribution

| Name | Purpose |
| ---- | ------- |
| `principal-linkedin-strategist` | Turns `principal-product-marketing`'s `product_context.json` into credible, platform-native LinkedIn content — post variants across launch / build-in-public / technical / founder / problem-solution / lessons / user-value angles, a content-angle matrix, and optional calendars and carousels. Grounds every claim in a product-context id; never fabricates traction/revenue/users; routes founder-voice polish to `persona-self`. LinkedIn-only, bilingual-capable, **never auto-publishes**. |
| `principal-video-director` | Turns `product_context.json` + `media_manifest.json` into a synchronized video creative-direction package — `creative_brief.md`, timestamped `storyboard.md`, structured `edit_decision_list.json`, `voiceover_script.md` with cut/audio-cue markers, and provider-agnostic `ai_video_prompts.json` for missing scenes. Grounds the script via `content-grounding`, distinguishes existing from generated assets, keeps cuts and audio in sync, flags every timing assumption. **Plans, never renders**; no AI provider hard-coded. |

### Personal (your voice & career)

| Name | Purpose |
| ---- | ------- |
| `persona-self` | Drafts messages, posts, emails, design docs, PR descriptions, and replies in *your* voice with a senior-engineer professionalism overlay. Loads the current workspace's `personal/identity/voice.md` every run. Three modes (Draft / Rewrite / Reply), format-and-audience aware. **Never auto-publishes.** |
| `principal-engineer-career-mentor` | On-demand IC-track career mentor. Reads the current workspace's `personal/identity/` career files and runs six modes: intake, weekly check-in, quarterly review, spot consultation, cert plan, and visibility nudge. Honest mentor, not cheerleader. **Never auto-publishes.** |

### Weekly catch-up

| Name | Purpose |
| ---- | ------- |
| `workflow-weekly-pulse` | Produces a privacy-first weekly digest; source bindings stay in ignored `.kai/runs/pulse/sources.md`. |

### Skills

**Workspace & scope** — the shared contracts every acting agent inherits (where work goes, and what it may change):

| Name | Purpose |
| ---- | ------- |
| `workspace-conventions` | Shared output-routing contract: `.kai/runs` for raw work, `coordination/` for team state, initiative-owned `artifacts/`, promoted `library/`, and the personal `personal/` lane. |
| `workspace-onboarding` | Idempotent initialization and validation method used by `workflow-workspace-init`. |
| `product-exploration` | Neutral live-product mapping method with canonical `initiatives/<slug>/artifacts/product-map.md` placement. |
| `product-marketing-intelligence` | The method behind `principal-product-marketing`: turns a product surface into reusable `product_exploration_report.md` + `product_context.json` + `media_manifest.json` under `initiatives/<slug>/artifacts/marketing/`. Types every assertion fact / inference / recommendation with source, confidence, and basis; downstream-consumable without chat. |
| `scope-discipline` | The classify-before-adopt gate. Assessors report honestly; `principal-product-manager` owns scope decisions; `principal-product-designer` and engineering acting roles may refine approved scope but route expanded surfaces, flows, capabilities, or implementation as durable proposals. |
| `work-coordination` | Authoritative item state under `coordination/items/`, derived board, typed dependencies, leases, durable threads, revision-bound reviews, and truthful completion/shipping. |
| `definition-of-done` | The shared release-readiness contract. Its six dimensions gate `in-review → release-ready`; production deployment and verification are evidenced afterward before `shipped`. Each dimension resolves Clear / Gap / Waived-with-reason, and gaps bounce with a named owner. |
| `peer-communication` | One role-addressed QUESTION/ANSWER protocol over inline, live-peer, and durable `coordination/threads/` transports. |
| `initiative-stewardship` | The shared initiative-ownership contract. The steward approves scope and priority; the Chief of Staff dispatches; principals execute. Milestones require `completed` for knowledge work or `shipped` for production; the initiative ends with the matching truthful status. |

**Engineering craft** — per-change discipline every `principal-swe-*` agent inherits:

| Name | Purpose |
| ---- | ------- |
| `coding-style` | Language-agnostic coding preferences: simplicity over cleverness, human-readable names/messages, composition, disciplined comments, match repo convention before imposing taste. |
| `research-before-coding` | Investigate first, then propose, then code. Classifies touched files (own/partner/shared), hunts reusable code, surfaces tradeoffs before writing. |
| `pr-sizing` | Breaks a feature/refactor into shippable, reviewable increments — each independently mergeable, tests included, never refactor-mixed-with-feature. |
| `onboard-to-codebase` | Maps an unfamiliar repo fast (stack, dev-loop commands, architecture, conventions, pitfalls) and saves a durable report you can re-read across sessions. |

**Document review** — the method + lenses behind `workflow-doc-review`:

| Name | Purpose |
| ---- | ------- |
| `doc-review-rigor` | The shared evaluation *method* every dimension inherits: extract load-bearing claims, ground each against code/sources/reality, classify (Holds / Unproven / Inference / Contradicted / Dropped / Noise), run the two value filters. Not a standalone trigger — pulled in by the dimension skills and the orchestrator. |
| `review-rationale` | The **why** lens — is the problem real and correctly stated, and does the reasoning from problem to solution actually connect? |
| `review-alternatives` | The **options** lens — what else was on the table, why this one, trade-offs, missing obvious alternatives (compose/buy/defer/do-nothing). |
| `review-risks-scope` | The **risk & scope** lens — real risks named/mitigated, assumptions surfaced not smuggled, scope drawn (what's explicitly IN and OUT), dropped caveats pulled back. |
| `review-success-metrics` | The **measurability** lens — is success defined in measurable terms tied to the goal, with baseline/target/instrumentation, and no gameable proxy? |
| `review-security-privacy` | The **data & trust** lens — data footprint, auth, secrets, trust boundaries, PII, and the "it's secure / handled" assurances. |
| `review-performance-scale` | The **load** lens — latency budgets (P50/P95/P99), throughput, hot path, behavior under load, scale assumptions tied to real data. |
| `review-dependencies` | The **coordination** lens — partner teams, upstream/downstream deps, sign-offs, breaking changes for consumers, third-party failure modes. |
| `review-rollout-operability` | The **ship & run** lens — staged rollout, reversibility/rollback, migration safety, monitoring, alerting, on-call, runbooks. |
| `review-ux-accessibility` | The **experience** lens — primary flow plus empty/error/loading/edge states, and accessibility (keyboard, focus, screen-reader semantics, contrast, motion) designed in, not deferred. |

**Web & content:**

| Name | Purpose |
| ---- | ------- |
| `web-evaluation` | Shared plumbing for browser-based audit runs (folder layout, screenshots, login-pause, `.gitignore` patching, priority scheme, report scaffold). Invoked by `principal-qa-ui`, `principal-seo`, and `persona-ux-first-time-user`. |
| `web-content-extraction` | Standardises a Playwright MCP walkthrough of a *readable* site (course modules, docs, articles) and writes clean markdown for downstream use. Owns folder layout, slugs, `.gitignore`, login-pause, knowledge-check detection. Invoked by `workflow-course-to-audio`. |
| `content-grounding` | Shared claim-safety contract every content/creative agent inherits: the `product_context.json` reference scheme, the per-item claim ledger, the provenance treatment table, never-fabricate rules, and locked-facts voicing. Keeps grounding identical across LinkedIn, video, and future platforms. |
| `linkedin-content` | The method behind `principal-linkedin-strategist`: turns `product_context.json` into grounded LinkedIn post variants, a content-angle matrix, and optional calendars/carousels under `.kai/runs/content/…-linkedin/`. Claim-safety by product-context id; never fabricates metrics; never publishes. |
| `video-direction` | The method behind `principal-video-director`: turns `product_context.json` + `media_manifest.json` into `creative_brief.md`, timestamped `storyboard.md`, `edit_decision_list.json`, `voiceover_script.md`, and provider-agnostic `ai_video_prompts.json`. Inherits `content-grounding`; plans, never renders. |
| `pulse-digest` | Plumbing behind `workflow-weekly-pulse`; private bindings and output live under `.kai/runs/pulse/`. |

**Lessons & writing:**

| Name | Purpose |
| ---- | ------- |
| `generate-audio` | Turns a folder of markdown into multilingual narrated audio via lectoria. Cwd-relative — travels across codebases. |
| `generate-html-lesson` | Turns a markdown source into a self-contained offline `index.html` lesson — prose + HTML/CSS diagrams + embedded audio player when available. English visual / Spanish audio by default. Orchestrated by `principal-engineer-teacher`. |
| `extract-writing-style` | Extracts your writing style from chat history / PR comments / pasted samples into the current workspace's portable `personal/identity/voice.md` profile. Idempotent and privacy-first. |

**Personal:**

| Name | Purpose |
| ---- | ------- |
| `personal-agenda` | The method behind `director-executive-assistant`: assembles your forward "what needs you" agenda from `coordination/` signals, `personal/inbox.md`, and cadence nudges into a ranked `personal/agenda.md`. Forward complement to `pulse-digest`; never autonomous. |
| `executive-consultation` | Private method for "ask the team and brief me": sends a minimal read-only packet to real roles, records attributed answers under `personal/consultations/`, preserves disagreement/provenance, and bridges load-bearing team answers to the owning coordination thread. |
| `decision-brief` | Private method for "give me what I need to decide, in one place": turns a decision already waiting on you — an `@operator` `kind: decision` thread question or a `release-ready` deploy gate — into a brief with options, per-role positions, tradeoffs, and a sourced recommendation under `personal/decisions/`. Fills only missing positions via `executive-consultation`; never decides. |

More skills and agents are queued; see the roadmap below.

## Workspace

Install this plugin into any repo and run **`workflow-workspace-init`** once.
It applies the `workspace-onboarding` and `workspace-conventions` contracts so
every agent resolves the same paths:

```
<workspace>/
├─ .kai/
│  ├─ manifest.json + CONVENTIONS.md       committed bootstrap
│  └─ runs/<area>/<target>/<run>/          ignored raw evidence and scratch
├─ coordination/
│  ├─ ACTIVE.md + BOARD.md + backlog.md
│  ├─ items/<item-id>.md                   authoritative work state
│  └─ threads/<item-id>.md                 durable handoffs and peer questions
├─ initiatives/
│  ├─ INDEX.md
│  └─ <slug>/
│     ├─ northstar.md + log.md + backlog.md
│     ├─ deliverables.md + director-summary.md
│     └─ artifacts/{product-map.md,briefs/,research/,designs/,decisions/}
├─ library/                                promoted cross-initiative outcomes
│  └─ reviews/ dev-designs/ investigations/ briefings/ qa-findings/
│     lessons/ digests/ learnings/ releases/ playbooks/
└─ personal/                               ignored personal ops + growth
   ├─ inbox.md + agenda.md + workspaces.md
   ├─ identity/{voice.md,career-*.md}
   └─ consultations/ + decisions/ + lessons/ + courses/ + certs/ + growth/
```

- `.kai/runs/` holds raw, regenerable, or heavy evidence and is ignored.
- `coordination/` holds high-churn cross-effort operational state.
- `initiatives/` holds strategic intent and outputs owned by one initiative.
- `library/` holds explicitly promoted outcomes reusable across initiatives.
- `personal/` holds ignored workspace-local assistant state, optional linked
  workspaces, consultation records, decision briefs, identity/career context,
  and learning.

Initiative work defaults to its own `artifacts/` tree. Promotion to `library/`
is explicit, steward-approved, recorded in `deliverables.md`, and one-way:
the library path becomes canonical for cross-initiative use while the
initiative copy remains provenance.

When one agent needs something from another, the **`peer-communication`**
contract reconciles the three ways that question can travel — a cheap
**inline consult** (simulate the peer's lane), a **live peer** agent (the
Copilot CLI's background `task`/`write_agent` messaging, for real
independent judgment), or a **durable thread** `QUESTION`/`ANSWER` — into
one rule: transport is a performance choice, the thread is the record.
Anything that blocks an item, crosses a session, or changes a
decision lands on the thread, whichever transport carried it live.

The state does not run itself. The **`initiative-stewardship`** contract
names a **steward** — the initiative's `owner`, `principal-product-manager`
by default — who approves scope and priority. `director-chief-of-staff`
dispatches that approved queue, reconciles handoffs, and escalates decisions;
it does not replace the steward or principals.

For an external product without an accessible repository, intake asks for a
durable absolute workspace directory before dispatch. Every peer receives that
same path. Completed initiatives remain discoverable through `INDEX.md`,
`deliverables.md`, and `director-summary.md`; final reports print exact paths.

Canonical product paths are built in: `artifacts/product-map.md`,
`artifacts/briefs/<item-id>.md`, `artifacts/research/<item-id>.md`,
`artifacts/designs/<item-id>.md`, and `artifacts/decisions/<item-id>.md`.

## How the agents chain

These agents are **not a fixed pipeline** — they're a *triggered graph*.
Each fires only when its kind of judgment is needed, and several are
skippable depending on the size and shape of the work. Two kinds of
agent behave differently:

- **Judgment / quality agents** (`principal-swe-architect`,
  `principal-swe-frontend` / `-backend` / `-infra`) scale *down*
  gracefully — they add signal even on a tiny project. Trigger them on
  need.
- **Coordination agents** (`principal-swe-manager`) scale *up* —
  their value grows with owners × dependencies × deadline pressure ×
  parallelism. **Skip them on small or already-sequenced work.**

The agents fall into a handful of independent flows. The biggest is
**product → engineering**; the rest are smaller graphs that either feed
into it or stand on their own. Each diagram is a *scenario*, not a
mandatory pipeline.

For personal sessions, `director-executive-assistant` (flow 8) is the default
start for personal or unclear intent in the current Kai workspace. It routes
into these flows, consults real roles, and optionally includes linked-workspace
signals in the agenda. A direct delivery request goes to the Chief of Staff, and
direct review/design/exploration to that specialist.

**0 · Onboarding (run once per workspace)** — `workflow-workspace-init`
validates the full workspace contract for either a repository or a durable
standalone folder and seeds private assistant and identity stubs.

```
 repository or ──► workflow-workspace-init ──► .kai/ + coordination/
 standalone folder                              + initiatives/ + library/
                                                 + personal/identity + assistant state
```

**0b · North star (optional, spans weeks/months)** — run
`workflow-initiative-init` to turn mission + vision into a proposed north star,
stable milestones, success measures, and initial items. The steward approves
and activates it; later agents load it only when work matches its scope.

```
 mission + vision ──► workflow-initiative-init ──► proposed north star + milestone items
                                                       │
                                      PM/steward approves + activates
                                                       ▼
                                      coordination/ACTIVE.md points to the north star
                                                            ▼
   any later agent, before substantial work:  target in scope? ──yes──► load + steer toward it
                                                            └──no──► work context-free (no pollution)
```

**1 · Directed product → engineering** — talk to the Chief of Staff; it
coordinates the triggered graph without taking over specialist decisions.

```
 operator ─► director-chief-of-staff
                  │
                  ├─► workflow-product-explore (when current map absent/stale)
                  │                 │
                  ├─► principal-product-manager BRIEF / steward
                  │                 │ approved need + scope
                  └─► principal-product-designer
                                    │ PM acceptance, or explicit design waiver
                                    ▼
                        principal-swe-architect  ── only when a decision spans
                        (approach / seams / system NFRs)  FE+BE+infra or services
                                                        │
                                                        ▼
                        principal-swe-manager ── only when work is large /
                        (scope · size · sequence)         parallel / multi-owner /
                                                        │ deadline-driven
                                                        ▼
              principal-swe-frontend / -backend / -infra   (build the slice)
                                                        │
                                                        ▼
              principal-qa-ui · persona-ux-first-time-user       (verify, observe)
                                                       │
                                    findings back to the PM ◄────┤
                                                       ▼
              workflow-ship PREPARE ── DoD clear ─► `release-ready` + deploy steps
                                      gap ─────────► bounce to owner
                                                       │ human deploys
                                                       ▼
              workflow-ship CONFIRM-START ─► `deploying`
              workflow-ship CONFIRM-COMPLETE ─► production verification ─► `shipped`
```

The ship workflow never performs deployment. It prepares the release, then a
later confirmation pass records your deployment evidence and verifies
production before using the `shipped` state.

**2 · AI research → applied product** — turn a live-landscape finding into a ticket-grade design, then hand slices to the engineers.

```
 weekly ──► principal-ai-researcher ──► one-page briefing
 pulse        (what changed in AI)          │  (pick a finding worth acting on)
                                            ▼
            principal-ai-applied-engineer ──► applied design doc
            (research + product context)      (architecture · eval · rollout · cost)
                                            │  delegates slices to
                                            ▼
            principal-swe-architect? ──► principal-swe-frontend / -backend / -infra
            (only if it spans seams)         (build it)
```

**3 · Web evaluation → product** — many lenses on one live surface, all routed through the `web-evaluation` skill, all feeding the PM.

```
              ┌─ principal-qa-ui ──────────────────── defects (broken UI)
              ├─ principal-seo ────────────────────── SEO + agentic-search gaps
 a live ──────┼─ persona-ux-first-time-user ───────── first-run friction       ─┐
 surface      ├─ persona-professional-trainer ─────── domain-expert audit       ├─► reports
              └─ persona-professional-nutritionist ── domain-expert audit      ─┘   │
                        (each runs via the web-evaluation skill)                    ▼
                                                         principal-product-manager ──► decisions
```

**4 · Learning & content** — three independent ways to produce lessons or audio.

```
 course / cert / ──► workflow-course-to-audio ──► clean markdown ──► generate-audio ──► narrated audio
 long web page        (wraps web-content-extraction)               (explicit handoff — never auto)

 chaptered ──► principal-engineer-teacher ──┬─► generate-html-lesson ──► index.html  (English visual)
 markdown      (packages existing source)   └─► generate-audio ────────► MP3         (Spanish narration)

 a topic ──► principal-engineer-tutor ──► original lesson written from scratch  (.kai/runs/lessons/)
            (Explain-in-chat / Lesson / Series modes)
```

**5 · Writing & career (`personal/identity/`)** — one workspace-local profile folder powers both your voice and career track.

```
 chat history / ──► extract-writing-style ──► personal/identity/voice.md ──┬─► persona-self ──► draft in your voice
 PR comments / samples                          (workspace profile)        │   (Draft / Rewrite / Reply)
                                                                           │
 first-run intake ──► principal-engineer-career-mentor ──► personal/identity/career-*.md ─┘
                      (weekly · quarterly · spot · cert · visibility modes)  └─► honest guidance, never auto-posts
```

**6 · Document review** — an orchestrator fans out to the dimension lenses, then aggregates one review.

```
 a doc ──► workflow-doc-review ──┬─► review-rationale ────────┐
 (design · PRD ·   (detect type, │  ├─► review-alternatives    │
  RFC · strategy)   pick lenses)  │  ├─► review-risks-scope     │  each lens inherits
                                  │  ├─► review-success-metrics  ├─ doc-review-rigor
                                  │  ├─► review-security-privacy │  (claims → ground →
                                  │  ├─► review-performance-scale│   classify → filter)
                                  │  ├─► review-dependencies     │
                                  │  ├─► review-rollout-operability
                                  │  └─► review-ux-accessibility ┘
                                  ▼
                  one consolidated review + draft comments ──► you decide what to post (never auto)
```

**7 · Weekly catch-up** — aggregate the week's signal into a two-page digest you read or hear.

```
 a week of ──► workflow-weekly-pulse ──► pulse.md  ┬─ Page 1 Brief (narratable) ──► generate-audio
 messages +    (binds message/doc/code     + brief.md │  Page 2 Board (tables + thread map)   (offer, never auto)
 docs + code    adapters via local config)            └─ Page 3 Career ──┬─► persona-self (draft the post)
                (writes via pulse-digest; read-only)                      └─► career-mentor (weigh promotion)
```

**8 · Personal front door** — the default start when intent is personal or
unclear (direct delivery goes to the Chief of Staff, direct specialist work to
the specialist); it routes into every flow above and keeps your forward agenda
(what needs you), the complement to the weekly pulse (what happened).

```
 you ──► director-executive-assistant ──┬─► persona-self             (draft in your voice)
         (current workspace + links)     ├─► principal-engineer-career-mentor  (career)
                                         ├─► director-chief-of-staff   (team delivery)
                                         ├─► executive-consultation ──► real roles + private attributed brief
                                         ├─► decision-brief ──► private brief: options + positions + recommendation
                                         ├─► workflow-weekly-pulse      (what happened)
                                         └─► personal-agenda ──► personal/agenda.md
                                             (all enabled workspaces + inbox + nudges)
                                                  │  ranked "what needs you"
                                                  ▼
                                             you decide the next move   (never auto)
```

**Trigger rules of thumb:**

| Situation | Who fires |
|-----------|-----------|
| Install the plugin into a fresh repo / re-assert structure | `workflow-workspace-init` (once) |
| Start a new mission/vision initiative | `workflow-initiative-init`, then PM/steward approval |
| Drive an item or initiative end to end / resume the team | `director-chief-of-staff` |
| Net-new opportunity, "what should we build?" | `principal-product-strategist` |
| Feedback/report to turn into decisions | `principal-product-manager` |
| Understand a product + package positioning, personas, and assets for content | `principal-product-marketing` |
| Turn product intelligence into credible LinkedIn posts | `principal-linkedin-strategist` |
| Turn product intelligence + media into a video plan (script, cuts, AI prompts) | `principal-video-director` |
| "What's next on this initiative?" / groom + prioritize the board | `principal-product-manager` (as steward, via `initiative-stewardship`) |
| "What changed in AI, and does it matter to us?" | `principal-ai-researcher` |
| Turn an AI finding into a buildable design | `principal-ai-applied-engineer` |
| A decision spans FE+BE+infra, or services/repos | `principal-swe-architect` |
| Large / parallel / multi-owner / deadline work | `principal-swe-manager` |
| Small or already-sequenced work | straight to the domain engineer(s) |
| Build a slice in one domain | `principal-swe-frontend` / `-backend` / `-infra` |
| Verify a surface objectively / walk it as a customer | `principal-qa-ui` / `persona-ux-first-time-user` |
| Prepare a built slice / record deployment start / confirm production shipment | `workflow-ship` PREPARE / CONFIRM-START / CONFIRM-COMPLETE |
| Audit SEO + agentic-search readiness | `principal-seo` |
| Domain-expert audit of a fitness / nutrition product | `persona-professional-trainer` / `-nutritionist` |
| Package existing markdown into HTML + audio lessons | `principal-engineer-teacher` |
| Author a brand-new lesson from a topic | `principal-engineer-tutor` |
| Course / cert / long page → narrated audio | `workflow-course-to-audio` |
| Start your day, "what needs me", or route to the right agent | `director-executive-assistant` |
| Ask PM/design/engineering/other roles for perspectives and brief me | `director-executive-assistant` (via `executive-consultation`) |
| Package a decision waiting on me into options + a recommendation | `director-executive-assistant` (via `decision-brief`) |
| Capture a task or reminder | `director-executive-assistant` (→ `personal/inbox.md`) |
| Draft a message/post/email in your voice | `persona-self` (after `extract-writing-style`) |
| Career check-in, promotion path, or cert plan | `principal-engineer-career-mentor` |
| Catch up on the week (messages + docs + watched code) | `workflow-weekly-pulse` (writes via `pulse-digest`) |
| Pressure-test the substance of a doc | `workflow-doc-review` (fans out to `review-*`) |

`director-chief-of-staff` owns orchestration only. Scope, technical judgment,
implementation, review, and release approval remain with their named roles.


## Contributing

This is a personal open-source plugin, but issues and PRs are welcome.
New skills should:

- Solve a real, recurring problem (not a "nice to have").
- Be framework-agnostic unless explicitly scoped (e.g., `react-style`).
- Cite their own conventions inside `SKILL.md` so the agent can apply them
  without inventing rules.

Before opening a PR, run `npm run validate` — a dependency-free structural
check (valid agent/skill frontmatter, `name`-to-path agreement, and resolvable
agent/skill cross-references) that also runs in CI on every pull request.

## License

[MIT](./LICENSE)

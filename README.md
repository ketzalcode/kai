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
| `workflow-pal-setup` | Run-once bootstrapper for a fresh AI pal folder (kc-pal/ms-pal) — the identity layer above workspace-init. Seeds `.persona-self/` stubs (voice + career files), gitignores them, delegates the four roots to `workflow-workspace-init`, then hands off to `extract-writing-style` + `principal-engineer-career-mentor` to fill. Idempotent; never overwrites identity. |
| `workflow-self-check` | On-demand structural-health auditor for the plugin. Read-only — walks `agents/`, `skills/`, and top-level docs and produces one tiered findings report (`.ketzal/self-check/<date>/report.md`): inventory drift, naming, description drift, broken refs, overlap, single-responsibility, discoverability. Never auto-restructures — surfaces findings, the user decides. |
| `workflow-workspace-init` | Run-once onboarding orchestrator. Scaffolds the four-root layout (`.ketzal/` working · `knowledge/` work outcomes · `initiatives/` north stars · `self/` career), seeds `CONVENTIONS.md` + `manifest.json` + `knowledge/README.md` + `initiatives/README.md` + `ACTIVE.md` + `self/README.md`, and wires `.gitignore`. Idempotent and non-destructive — reports created-vs-kept, never clobbers. Materializes the `workspace-conventions` contract into a fresh repo so no agent has to improvise a path. |

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
| `workflow-ship` | The ship-path orchestrator that closes the product → engineering flow. Takes a built, in-review board item and runs the `definition-of-done` gate across its six dimensions (scope-true, verified, reviewed, shippable-safely, documented, coordination-closed), reusing `review-rollout-operability` for the rollout/reversibility check. On a clean gate it writes a ship record (`knowledge/releases/`), advances the board row to `shipped`, stamps the initiative log, closes the thread, unblocks dependents, and hands the operator the **exact** deploy steps. On any gap it **bounces** the item back with the specific gap and the owner role. Proportional to blast radius; **never merges, deploys, tags, or pushes** — it records how to ship and the human runs it. |

### Document review

| Name | Purpose |
| ---- | ------- |
| `workflow-doc-review` | Orchestrator for a multi-lens substance review of a doc (design docs, PRDs, RFCs, strategy docs, dev-design proposals). Detects the doc type, decides which `review-*` dimensions apply, fans them out in parallel, then aggregates one consolidated review with per-finding draft comments. Every dimension inherits the `doc-review-rigor` method (load-bearing claims → grounding → six-class taxonomy → value filters). Partner before critic; verifies before asserting. **Never auto-posts.** |

### Product

| Name | Purpose |
| ---- | ------- |
| `principal-product-manager` | Judgment layer that triages UX/feedback reports into concrete product decisions. Defends the working product — smallest change that addresses each finding's underlying need rather than rubber-stamping redesigns. Six-verdict taxonomy (Apply / Reframe / Minimize / Defer / Reject / Investigate). |
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
| `principal-engineer-tutor` | Generative tutor for engineering/AI topics — authors original, ASCII-diagram-heavy, concrete-first lessons in three modes (Explain in-chat / Lesson / Series). Distinct from the teacher (which packages existing markdown). Writes under `.ketzal/lessons/`; never auto-runs audio. |
| `workflow-course-to-audio` | Turns a course, cert module, or long readable web page into local markdown ready for `generate-audio`. Wraps `web-content-extraction` for the crawl, then offers an explicit audio handoff (never auto-runs — Azure cost). Knowledge-checks split into a separate file so narration stays clean. |

### Web evaluation

| Name | Purpose |
| ---- | ------- |
| `principal-qa-ui` | Senior QA engineer doing deep manual UI testing via Playwright MCP. Hunts objectively broken things — overlap, overflow, broken buttons, console/network errors, focus order, viewport breakage. Defect report via `web-evaluation`. |
| `principal-seo` | SEO + agentic-search auditor — technical SEO, content-SEO alignment, and agentic-search readiness (llms.txt, schema density, AI-bot directives, JS-blind extractability). Carries a 2026 baseline and refreshes against the live spec each run. Report via `web-evaluation`. |
| `persona-ux-first-time-user` | Simulates a first-time customer walking a surface via Playwright MCP. Subjective friction + concrete proposals — not a defect log. Report via `web-evaluation`. |
| `persona-professional-trainer` | Simulates a credentialed strength-and-conditioning coach auditing a fitness product (NSCA/ACSM mental model). Stays in the programming lane; consults the nutritionist for nutrition. |
| `persona-professional-nutritionist` | Simulates a credentialed sports nutritionist / RD auditing a nutrition product (TDEE, macro floors, allergen safety, restrictive-diet gaps). Stays in the nutrition lane; consults the trainer for exercise. |

### Personal (your voice & career)

| Name | Purpose |
| ---- | ------- |
| `persona-self` | Drafts messages, posts, emails, design docs, PR descriptions, and replies in *your* voice with a senior-engineer professionalism overlay. Loads `.persona-self/voice.md` (from `extract-writing-style`) every run. Three modes (Draft / Rewrite / Reply), format-and-audience aware. **Never auto-publishes.** |
| `principal-engineer-career-mentor` | On-demand IC-track career mentor. Reads your `.persona-self/` career files (snapshot, skills inventory, current work, goals) and runs six modes: first-run intake, weekly check-in, quarterly promotion-path review, spot consultation, cert study plan, and visibility nudge. Honest mentor, not cheerleader — pushes back on unrealistic goals or drift. **Never auto-publishes.** |

### Weekly catch-up

| Name | Purpose |
| ---- | ------- |
| `workflow-weekly-pulse` | Turns a week of activity into one short, digestible catch-up digest. Pulls chat/channel messages, the docs posted in them, and critical architectural changes in watched codebase modules across a window, prioritizes by signal, and writes a paged digest via `pulse-digest`: Page 1 (a 100%-narratable Brief, Lectoria-clean), Page 2 (a visual Board — docs-worth-reading table with Read/Skim/Skip, code-watch table, thread-map diagram), optional Page 3 (Career & Visibility — post candidates + senior-promotion signal). Source-agnostic: binds abstract message/doc/code/work-item adapters to whatever connectors the host exposes, with concrete wiring kept in a private, gitignored `.ketzal/pulse/sources.md`. Read-only on every source; never posts/edits/pushes; never auto-runs audio. Hands drafting to `persona-self`, promotion judgment to `principal-engineer-career-mentor`. |

### Skills

**Workspace & scope** — the shared contracts every acting agent inherits (where work goes, and what it may change):

| Name | Purpose |
| ---- | ------- |
| `workspace-conventions` | The shared **where-things-go** contract. Owns the four-root model (gitignored working root `.ketzal/` for ephemeral artifacts; committed `knowledge/` for shareable work outcomes; committed `initiatives/` for scope-gated north stars; gitignored `self/` for portable career/learning), the path grammar (`<root>/<area>/<target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/<artifact>`), slug/timestamp rules, the area registry, the zone-default table + `--share`/`--local` override, the initiative gating rule, the manifest format, and the knowledge frontmatter schema. Not a trigger skill — agents read it instead of inventing paths; `workflow-workspace-init` materializes it. |
| `scope-discipline` | The shared **behavioral contract** governing the seam between honest assessment and unilateral action — the classify-before-adopt gate that separates *refining within scope* from *expanding it*. Splits three roles: **assessors** (the `persona-*` evaluators, `principal-qa-ui`) surface findings honestly and are deliberately **not** gated (biasing them corrupts the signal); the **scope-owner** (`principal-product-manager`) *owns* the gate, triaging each finding against the initiative's thin core (`mission`, `scope.current`, `principles.non_negotiable[]`) into build vs a deferred `PROPOSAL`; **acting builders** (`principal-swe-*` + architect) carry it as restraint-on-diff — assess honestly, but never unilaterally ship a change that adds a step, gate, surface, or new capability, escalating it as a `PROPOSAL` instead. Proposals route to the initiative's `proposal_channel` (default the committed backlog `initiatives/<slug>/backlog.md`). Not a trigger skill — pulled in by the scope-owner and the acting builders, the way `review-*` lenses pull in `doc-review-rigor`. |
| `work-coordination` | The shared **how-the-team-coordinates** contract — the committed connective tissue that lets many single-shot agents run several efforts at once without a standing lead. Owns `initiatives/BOARD.md` (the cross-effort WIP ledger), the work-item lifecycle (`proposed → ready → in-progress → in-review → blocked → shipped/dropped`), the append-only `initiatives/threads/<item-id>.md` log with its `HANDOFF` and `QUESTION`/`ANSWER` packets (peer-to-peer messaging that survives a session), the committed backlog, and the collision/dependency scan an agent runs before it starts. The only constantly-committed mutable state — so a fresh session or a cloud agent picks up where the last one stopped. Not a trigger skill — inherited through the `workspace-conventions` gating rule by any agent that starts, hands off, or finishes work. |
| `definition-of-done` | The shared **what-'done'-means** contract — the gate between an item's `in-review` and `shipped` states. Owns the six-dimension Definition-of-Done check (**scope-true** · **verified** · **reviewed** · **shippable-safely** · **documented** · **coordination-closed**), reusing `review-rollout-operability` for the rollout/reversibility dimension. Each dimension resolves Clear / Gap / Waived-with-reason; all-clear ships, any Gap **bounces** the item back with the owner role — never a silent pass. Proportional to blast radius. Enforces the kai invariant that nothing auto-deploys: it produces a ship record + the exact deploy steps, and the human runs them. Not a trigger skill — owned and run by `workflow-ship`, self-checked by acting agents before they hand off to review. |
| `peer-communication` | The shared **how-agents-ask-each-other-things** contract — reconciles the three ways a peer question can travel into one protocol. One packet (`QUESTION`/`ANSWER`, addressed to a **role**) carried by one of three transports: **inline consult** (load the peer's agent file and answer in its voice — cheap, but a *simulation*), **live peer** (where the host exposes background agents — e.g. the Copilot CLI's `task`/`write_agent`/`read_agent` — spawn/message the *real* peer for its independent judgment), and the **durable thread** (append to `initiatives/threads/`, the async cross-session system of record). Bridging rule: transport is a performance choice, the thread is the correctness choice — anything blocking, cross-session, or decision-changing lands on the thread. Bias guard: don't inline-simulate a peer when independent judgment is the point (an assessment, a scope call) — get the real peer. Host-aware: no live agents → inline for facts, thread for durability. Not a trigger skill — pulled in by `work-coordination` (as its durable transport) and by any agent consulting a sister lane. |

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
| `pulse-digest` | Plumbing behind `workflow-weekly-pulse`. Owns the source-adapter contract (messages / docs / code-watch / work-items → one normalized record shape), the local `.ketzal/pulse/sources.md` binding config, folder layout, privacy-first `.gitignore` (whole tree), week-window resolution, the 0–3 signal-weight rubric, and the page output shapes (narratable Brief / visual Board / optional Career page / overflow) plus a narration-clean `brief.md` for `generate-audio`. Source-agnostic by design. |

**Lessons & writing:**

| Name | Purpose |
| ---- | ------- |
| `generate-audio` | Turns a folder of markdown into multilingual narrated audio via lectoria. Cwd-relative — travels across codebases. |
| `generate-html-lesson` | Turns a markdown source into a self-contained offline `index.html` lesson — prose + HTML/CSS diagrams + embedded audio player when available. English visual / Spanish audio by default. Orchestrated by `principal-engineer-teacher`. |
| `extract-writing-style` | Extracts your writing style from chat history / PR comments / pasted samples into a portable `.persona-self/voice.md` profile for `persona-self`. Idempotent; privacy-first (gitignored by default). |

More skills and agents are queued; see the roadmap below.

## Workspace & knowledge

Install this plugin into any repo and run **`workflow-workspace-init`** once.
It lays down a structure every agent then respects, so work never lands in
random folders. There are **four roots** (defined by the
`workspace-conventions` skill), split across two axes — *scope* (how broadly
it applies) and *git* (whether it travels via `git pull`):

```
<repo>/
├─ .ketzal/      ← working root: ephemeral, regenerable, gitignored
│   └─ qa/ eng/ product/ review/ ai/ learn/ lessons/ pulse/
│       └─ <target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/<artifact>
├─ knowledge/    ← work outcomes: durable, committed, shareable via git
│   └─ reviews/ dev-designs/ investigations/ briefings/
│      qa-findings/ lessons/ digests/ learnings/ releases/ playbooks/
├─ initiatives/     ← standing intent: north stars, committed, scope-gated
│   ├─ ACTIVE.md                 ← which initiative(s) are the current focus
│   ├─ BOARD.md                  ← cross-effort WIP ledger (items · state · owner · blockers)
│   ├─ backlog.md                ← deferred proposals with no initiative
│   ├─ threads/<item-id>.md      ← append-only HANDOFF + QUESTION/ANSWER per work item
│   └─ <initiative-slug>/northstar.md · log.md · references.md · backlog.md
└─ self/         ← portable career/learning: yours, gitignored
    └─ lessons/ courses/ certs/ growth/
```

- **Working root (`.ketzal/`, configurable)** holds the raw and the scratch
  — HAR, logs, screenshots, audio, intermediate drafts. Gitignored
  wholesale; nobody needs to pull your captures.
- **Knowledge root (`knowledge/`)** holds the curated **work** outcomes worth
  distributing. Committed, so `git pull` carries the knowledge to other
  repos and people. Text only — binaries stay ignored even here.
- **Initiatives root (`initiatives/`)** holds the **north stars** — the durable
  objectives steering a project over weeks/months. Committed, but
  **scope-gated**: an agent loads an initiative *only when the current work
  matches its scope*, so side investigations stay clean. This is how a long
  effort keeps its strategic context across many sessions.
- **Self root (`self/`)** holds your **portable career/learning** — certs,
  courses, lessons you authored to learn. Gitignored, so it never lands in a
  work repo's git; it's about *you*, not the workspace, and travels with you.

Inside `initiatives/` there is also the **coordination surface** (the
`work-coordination` skill): `BOARD.md` is the cross-effort WIP ledger,
`threads/<item-id>.md` carries the append-only `HANDOFF` and
`QUESTION`/`ANSWER` peer messages for one work item, and `backlog.md` holds
deferred proposals. It's the only constantly-committed *mutable* state in
the workspace — committed on purpose so a fresh session, a peer agent, or a
cloud agent can read the board, see what's in flight and who owns it, and
pick up an effort where the last agent left off. `ACTIVE.md` says which
initiatives matter; `BOARD.md` says what work is moving through them.

When one agent needs something from another, the **`peer-communication`**
contract reconciles the three ways that question can travel — a cheap
**inline consult** (simulate the peer's lane), a **live peer** agent (the
Copilot CLI's background `task`/`write_agent` messaging, for real
independent judgment), or a **durable thread** `QUESTION`/`ANSWER` — into
one rule: transport is a performance choice, the thread is the record.
Anything that blocks a board item, crosses a session, or changes a
decision lands on the thread, whichever transport carried it live.

Each artifact has a **default zone** by type — the rubric: **knowledge** for
durable work decisions/inputs meant to be inherited; **local** for
observational, surface-snapshot output that decays with the moment;
**self/** for personal growth; **initiatives/** for standing intent. Override
per run with `--share` / `--local`. Agents resolve every path from this
contract instead of improvising — that's what keeps a workspace clean across
both a Microsoft repo and a ketzalcode repo. The boundary (company vs
personal) is **implicit by placement** — the repo you're in defines it, so
there's no policy engine, just clear lanes.

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

**0 · Onboarding (run once per workspace)** — before any flow, `workflow-workspace-init` lays down the structure every agent then writes into. For a fresh **pal folder** (kc-pal/ms-pal), `workflow-pal-setup` wraps it: seeds your `.persona-self/` identity first, then delegates the four roots.

```
 new pal folder ──► workflow-pal-setup ──► .persona-self/  (identity, gitignored)
 (kc-pal/ms-pal)     (seeds identity,        └─► workflow-workspace-init ──► four roots
                      delegates roots)
 install plugin ──► workflow-workspace-init ──► .ketzal/   (working root, gitignored)
 into a repo        (scaffolds four roots,     + knowledge/ (committed work outcomes)
                     seeds CONVENTIONS.md +     + initiatives/  (committed north stars)
                     READMEs + ACTIVE.md +      + self/      (gitignored career)
                     reads workspace-conventions)   every later agent resolves paths from here
```

**0b · North star (optional, spans weeks/months)** — when you start a long effort, drop an initiative in `initiatives/<slug>/northstar.md` and point `ACTIVE.md` at it. From then on, steering agents load it **only when the work matches its `scope`** — so a side investigation or an unrelated feature never inherits it. The initiative steers prioritization and scoping, and every promoted decision stamps `initiative: <slug>` to keep the trail linked.

```
 start a project ──► initiatives/<slug>/northstar.md ──► ACTIVE.md points here
 (weeks–months)      (goal · non-goals · scope gate)        │
                                                            ▼
   any later agent, before substantial work:  target in scope? ──yes──► load + steer toward it
                                                            └──no──► work context-free (no pollution)
```

**1 · Product → engineering** — idea or feedback all the way to a shipped, verified slice.

```
            ┌─ principal-product-strategist ─┐   (net-new: propose & prioritize bets)
 idea ──────┤                                ├──► committed action
            └─ principal-product-manager ────┘   (feedback: triage to smallest change)
                                                        │
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
              workflow-ship ── runs the definition-of-done gate ──┬─ clear ─► ship record + board `shipped`
              (close the loop)   (scope · verified · reviewed ·   │           + deploy steps for you to run
                                  safe · documented · closed)     └─ gap ───► bounce to the owner role
```

The ship step **never deploys** — like every kai agent it records how to
ship and hands you the exact steps; the merge/deploy is yours to run.

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

 a topic ──► principal-engineer-tutor ──► original lesson written from scratch  (.ketzal/lessons/)
            (Explain-in-chat / Lesson / Series modes)
```

**5 · Writing & career (your `.persona-self/`)** — one profile folder powers both your voice and your career track.

```
 chat history / ──► extract-writing-style ──► .persona-self/voice.md ──┬─► persona-self ──► draft in your voice
 PR comments / samples                          (portable profile)     │   (Draft / Rewrite / Reply)
                                                                       │
 first-run intake ──► principal-engineer-career-mentor ──► .persona-self/career-*.md ─┘
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

**Trigger rules of thumb:**

| Situation | Who fires |
|-----------|-----------|
| Install the plugin into a fresh repo / re-assert structure | `workflow-workspace-init` (once) |
| Net-new opportunity, "what should we build?" | `principal-product-strategist` |
| Feedback/report to turn into decisions | `principal-product-manager` |
| "What changed in AI, and does it matter to us?" | `principal-ai-researcher` |
| Turn an AI finding into a buildable design | `principal-ai-applied-engineer` |
| A decision spans FE+BE+infra, or services/repos | `principal-swe-architect` |
| Large / parallel / multi-owner / deadline work | `principal-swe-manager` |
| Small or already-sequenced work | straight to the domain engineer(s) |
| Build a slice in one domain | `principal-swe-frontend` / `-backend` / `-infra` |
| Verify a surface objectively / walk it as a customer | `principal-qa-ui` / `persona-ux-first-time-user` |
| Check a built slice is truly done and ship it | `workflow-ship` (runs the `definition-of-done` gate) |
| Audit SEO + agentic-search readiness | `principal-seo` |
| Domain-expert audit of a fitness / nutrition product | `persona-professional-trainer` / `-nutritionist` |
| Package existing markdown into HTML + audio lessons | `principal-engineer-teacher` |
| Author a brand-new lesson from a topic | `principal-engineer-tutor` |
| Course / cert / long page → narrated audio | `workflow-course-to-audio` |
| Draft a message/post/email in your voice | `persona-self` (after `extract-writing-style`) |
| Career check-in, promotion path, or cert plan | `principal-engineer-career-mentor` |
| Catch up on the week (messages + docs + watched code) | `workflow-weekly-pulse` (writes via `pulse-digest`) |
| Pressure-test the substance of a doc | `workflow-doc-review` (fans out to `review-*`) |

The orchestrating agent (or you) routes — there is no single "lead"
agent that owns the whole chain.


## Contributing

This is a personal open-source plugin, but issues and PRs are welcome.
New skills should:

- Solve a real, recurring problem (not a "nice to have").
- Be framework-agnostic unless explicitly scoped (e.g., `react-style`).
- Cite their own conventions inside `SKILL.md` so the agent can apply them
  without inventing rules.

## License

[MIT](./LICENSE)

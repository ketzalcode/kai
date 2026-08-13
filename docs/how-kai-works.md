[kai](../README.md) / [Docs](README.md) / How kai works

# How kai works

Which role fires when, and how a need travels to production. Every diagram below
is a *scenario*, not a mandatory pipeline. If you just want to get started, the
front doors route for you — see [Getting started](getting-started.md).

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
 repository or ──► workflow-workspace-init ──► .kai/ + kai/coordination/
 standalone folder                              + kai/initiatives/ + kai/library/
                                                 + kai/personal/identity + assistant state
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
                                      kai/coordination/ACTIVE.md points to the north star
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
              workflow-pull-request ─► branch, PR narrative, version, merge readiness
                                                       │ human merges
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

**3 · Web evaluation → product** — many lenses on one live surface, all routed through the `kai-core-web-evaluation` skill, all feeding the PM.

```
              ┌─ principal-qa-ui ──────────────────── defects (broken UI)
              ├─ principal-seo ────────────────────── SEO + agentic-search gaps
 a live ──────┼─ persona-ux-first-time-user ───────── first-run friction       ─┐
 surface      ├─ persona-professional-trainer ─────── domain-expert audit       ├─► reports
              └─ persona-professional-nutritionist ── domain-expert audit      ─┘   │
                        (each runs via the kai-core-web-evaluation skill)                    ▼
                                                         principal-product-manager ──► decisions
```

**3b · Customer success → product** — protect customer outcomes without turning
every account request into roadmap scope.

```
 customer goals + usage + support + sentiment
                         │
                         ▼
          principal-customer-success
          (success · adoption · health · risk)
                    │                 │
                    │                 └─► local success / recovery / QBR brief
                    ▼
        de-identified customer signal
                    │
                    ▼
        principal-product-manager ──► scope decision
```

**3c · Support triage → real owner** — screen safety first, then route without
replying, fixing, or converting the support queue directly into product scope.

```
 supplied tickets / chats / escalations
                    │
                    ▼
       workflow-support-triage
       (screen · classify · dedupe · urgency)
        │       │       │       │       │
        │       │       │       │       └─► principal-product-manager
        │       │       │       └─────────► principal-customer-success
        │       │       └─────────────────► QA / relevant SWE
        │       └─────────────────────────► principal-security / principal-sre
        └─────────────────────────────────► workflow-incident-response
```

**3d · Growth ↔ analytics → scoped experiment** — separate the behavior
hypothesis from metric/causal validity and from the PM's scope decision.

```
 product + customer + support signals
                    │
                    ▼
          principal-growth DIAGNOSE
                    │ analytics request
                    ▼
       principal-data-analytics ──► metric contract / evidence status
                    │
                    ▼
       principal-product-manager ──► accepted scope/design/engineering
                    │
                    ▼
       principal-data-analytics READOUT
                    │ preserves causal status
                    ▼
          principal-growth ──► Scale / Iterate / Hold / Stop / Investigate
```

**3e · Incident command → recovery** — one commander coordinates real domain
leads; the operator performs every production action.

```
 support / telemetry / security report
                    │
                    ▼
      workflow-incident-response
      (declare · SEV · timeline · decisions)
        │               │                │
        ├─► principal-sre                ├─► principal-security
        └─► relevant SWE / QA            └─► operator action + unsent update
                    │
                    ▼
       recovery evidence ──► resolved/closed + sanitized record
                    │
                    └─► proposed persistent fixes through normal PM/ship flow
```

**4 · Learning & content** — author, package, or steward a whole path.

```
 course / cert / ──► workflow-course-to-audio ──► clean markdown ──► kai-core-generate-audio ──► narrated audio
 long web page        (wraps kai-core-web-content-extraction)               (explicit handoff — never auto)

 chaptered ──► instructor-teacher ──┬─► generate-html-lesson ──► index.html  (English visual)
 markdown      (packages existing source)  └─► kai-core-generate-audio ──► MP3         (Spanish narration)

 a topic ──► instructor-tutor ──► original lesson written from scratch  (.kai/runs/lessons/)
            (Explain-in-chat / Lesson / Series modes — any subject)

 a whole cert ──► instructor-path-mentor ──► kai/personal/learning/<slug>.md  (plan · progress · review)
                 (dispatches the three above per objective; tracks where you are)
```

**5 · Writing & career (`kai/personal/identity/`)** — one workspace-local profile folder powers both your voice and career track.

```
 chat history / ──► extract-writing-style ──► kai/personal/identity/voice.md ──┬─► persona-self ──► draft in your voice
 PR comments / samples                          (workspace profile)        │   (Draft / Rewrite / Reply)
                                                                           │
 first-run intake ──► principal-engineer-career-mentor ──► kai/personal/identity/career-*.md ─┘
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
 a week of ──► workflow-weekly-pulse ──► pulse.md  ┬─ Page 1 Brief (narratable) ──► kai-core-generate-audio
 messages +    (binds message/doc/code     + brief.md │  Page 2 Board (tables + thread map)   (offer, never auto)
 docs + code    adapters via local config)            └─ Page 3 Career ──┬─► persona-self (draft the post)
                (writes via kai-core-pulse-digest; read-only)                      └─► career-mentor (weigh promotion)
```

**8 · Personal front door** — the default start when intent is personal or
unclear (direct delivery goes to the Chief of Staff, direct specialist work to
the specialist); it routes into every flow above and keeps your forward agenda
(what needs you), the complement to the weekly pulse (what happened).

```
 you ──► director-executive-assistant ──┬─► persona-self             (draft in your voice)
         (current workspace + links)     ├─► principal-engineer-career-mentor  (career)
                                         ├─► director-chief-of-staff   (team delivery)
                                         ├─► kai-core-executive-consultation ──► real roles + private attributed brief
                                         ├─► kai-core-decision-brief ──► private brief: options + positions + recommendation
                                         ├─► workflow-weekly-pulse      (what happened)
                                         └─► kai-core-personal-agenda ──► kai/personal/agenda.md
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
| Customer onboarding, adoption, health, churn/renewal risk, success plan, or QBR | `principal-customer-success` |
| Triage a support ticket/queue, deduplicate, assess urgency, or route an escalation | `workflow-support-triage` |
| Diagnose acquisition/activation/retention or plan/read a bounded growth experiment | `principal-growth` |
| Define metrics, analyze supplied data, design/read an experiment, or specify instrumentation | `principal-data-analytics` |
| Independently check an experiment's integrity before its result drives a decision | `workflow-experiment-review` |
| Set a pricing model, package/tier, plan a price change, discount policy, or monetization test | `principal-pricing-monetization` |
| Synthesize surveys, NPS/CSAT, reviews, interviews, or feature requests into de-identified signals | `workflow-customer-feedback` |
| Qualify a deal, plan discovery/deal strategy, handle an objection, review a forecast, or run win/loss | `principal-sales` |
| Assess technical fit, integration feasibility, scope a POC, or draft a security/compliance questionnaire response | `principal-solutions-architect` |
| Model SaaS metrics (MRR/ARR, churn, NRR, CAC/LTV), run a forecast, clean pipeline, or plan billing ops | `principal-revenue-operations` |
| Plan a campaign, lifecycle/nurture emails, channel mix, or define MQL/SQL lead handoff | `principal-demand-generation` |
| Assess a partner, design an integration/channel program, or frame a co-sell/co-marketing motion | `principal-partnerships` |
| Write docs, a how-to/reference/concept guide, or release notes | `principal-technical-writer` |
| Design a data pipeline, warehouse model, data contract, or event-instrumentation spec | `principal-data-engineer` |
| Define a visual brand identity, brand guidelines, or critique a visual asset | `principal-brand-designer` |
| Audit i18n readiness, assess a locale, route translation, or QA a localized build | `workflow-localization` |
| Threat model, security design/review, vulnerability triage, or technical privacy assessment | `principal-security` |
| DPIA, data inventory, data-subject rights, retention/consent policy, or compliance-framework review | `principal-privacy-compliance` |
| SLOs, reliability design, service readiness, capacity, observability, or operability review | `principal-sre` |
| Active outage, degradation, security/data event, status update, recovery, or post-incident close | `workflow-incident-response` |
| Understand a product + package positioning, personas, and assets for content | `principal-product-marketing` |
| Turn product intelligence into credible LinkedIn posts | `principal-linkedin-strategist` |
| Turn product intelligence + media into a video plan (script, cuts, AI prompts) | `creative-video-director` |
| Get *pushed* updates on a cadence (you host an external runner) | `workflow-proactive-scan` (see `examples/proactive-runner/`) |
| "What's next on this initiative?" / groom + prioritize the board | `principal-product-manager` (as steward, via `kai-core-initiative-stewardship`) |
| "What changed in AI, and does it matter to us?" | `principal-ai-researcher` |
| Turn an AI finding into a buildable design | `principal-ai-applied-engineer` |
| A decision spans FE+BE+infra, or services/repos | `principal-swe-architect` |
| Large / parallel / multi-owner / deadline work | `principal-swe-manager` |
| Small or already-sequenced work | straight to the domain engineer(s) |
| Build a slice in one domain | `principal-swe-frontend` / `-backend` / `-infra` |
| Verify a surface objectively / walk it as a customer | `principal-qa-ui` / `persona-ux-first-time-user` |
| Open a PR for a finished change (branch, narrative, version, merge readiness) | `workflow-pull-request` |
| Prepare a built slice / record deployment start / confirm production shipment | `workflow-ship` PREPARE / CONFIRM-START / CONFIRM-COMPLETE |
| Audit SEO + agentic-search readiness | `principal-seo` |
| Domain-expert audit of a fitness / nutrition product | `persona-professional-trainer` / `-nutritionist` |
| Package existing markdown into HTML + audio lessons | `instructor-teacher` |
| Author a brand-new lesson from a topic (any subject) | `instructor-tutor` |
| Plan + track a whole certification/learning path | `instructor-path-mentor` |
| Course / cert / long page → narrated audio | `workflow-course-to-audio` |
| Start your day, "what needs me", or route to the right agent | `director-executive-assistant` |
| Ask PM/design/engineering/other roles for perspectives and brief me | `director-executive-assistant` (via `kai-core-executive-consultation`) |
| Package a decision waiting on me into options + a recommendation | `director-executive-assistant` (via `kai-core-decision-brief`) |
| Capture a task or reminder | `director-executive-assistant` (→ `kai/personal/inbox.md`) |
| Draft a message/post/email in your voice | `persona-self` (after `extract-writing-style`) |
| Career check-in, promotion path, or cert plan | `principal-engineer-career-mentor` |
| Catch up on the week (messages + docs + watched code) | `workflow-weekly-pulse` (writes via `kai-core-pulse-digest`) |
| Pressure-test the substance of a doc | `workflow-doc-review` (fans out to `review-*`) |

`director-chief-of-staff` owns orchestration only. Scope, technical judgment,
implementation, review, and release approval remain with their named roles.

---

**Next:** [Agents & skills](reference/agents-and-skills.md) ·
**Related:** [Workspace model](workspaces.md) · [Getting started](getting-started.md)
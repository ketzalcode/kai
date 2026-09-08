# Drop record: `director-executive-assistant`

The `director-executive-assistant` body opened with an eager contract-loading
preamble: a seven-skill loading line and a block quote ordering the agent to
load every contract before acting. Task 8 replaced that preamble with inline,
on-demand routes placed at the instruction that needs each contract, plus a
degraded-mode refusal in the assistant's own voice. It also absorbed the
`## Personal front door` debt from Task 6 and deleted the 24-row routing table.
The body shrank from **14,883** to **11,796** characters. No obligation was
removed; every dropped construct is accounted for below.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager seven-skill loading line (old line 7) | deleted; each contract is now reached by an inline route (see the route map) |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal in the assistant's own voice, plus the `kai-core-contract-v1` route at the top of the body |
| The `## Contracts you inherit` section and its skill bullet list | deleted; a collected route inventory is the eager pattern this refactor removes. Each skill became an inline route at the section that uses it |
| The 24-row `## Routing` table | deleted; replaced by the roster-resolution paragraph (see below). Every row is recorded in *The routing table* section |
| Task 6 `## Personal front door` debt | folded into the assistant's body (see *Personal front door* below) |

## The seven removed contracts, each now routed

The old loading line named seven contracts (four of them since split/renamed).
Every one now has an inline route in the accepted `Load`/`Invoke`/`Apply`/`Run`
+ backticked-id form; bare mentions do not route.

| Old contract | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | `kai-core-operating-rules`, routed in `## Consulting the team` step 1, before addressing any role |
| asset-lifecycle (deleted id; superseded) | `kai-core-asset-producing`, routed in `## Assembling the agenda` step 4, before writing the agenda |
| workspace-conventions (deleted id; superseded) | `kai-core-workspace-paths`, routed at the top of `## Where you operate`, before resolving the workspace or personal lane |
| `kai-core-peer-communication` | `## Consulting the team` step 3, before sending each consultation |
| `kai-core-decision-brief` | `## Assembling a decision brief`, at the existing `apply` sentence |
| `kai-core-executive-consultation` | `## Consulting the team` step 2, at the existing `Apply` sentence |
| `kai-core-personal-agenda` | `## Assembling the agenda` and `## Capturing and tracking tasks`, at the existing `apply` sentences |

`kai-core-contract-v1` was added at the top of the body, before the first other
core route.

### asset-closing and work-granting: not added

- **`kai-core-asset-closing` — not added.** The assistant produces private
  personal records (agenda, decision brief, consultation, inbox) but never
  decides a coordinated deliverable asset is complete, fresh, promotable, or
  closeable. Marking a personal task `Done` or a decision brief `decided` is
  personal-lane bookkeeping governed by `kai-core-personal-agenda`, not the
  asset completion gate. So it produces, but does not close.
- **`kai-core-work-granting` — not added.** The assistant never grants a lease
  to another role; it reads coordination state read-only and routes delivery to
  `director-chief-of-staff`. Lease granting is the Chief of Staff's authority.

## The degraded-mode refusal

The block quote's fallback was replaced with a first-person refusal stating the
three required facts:

> Invoke `kai-core-contract-v1` before the first other core skill. If `kai-core`
> is unavailable, I help only with direct, single-shot personal requests I can
> satisfy without shared contracts; I write no inbox, agenda, or
> workspace-registry entry into `.kai`, surface nothing as coordinated team
> state, and log no Kai activity; and I tell the operator to install or update
> `kai-core` before I can manage their attention again.

- **Fact 1** — direct single-shot work in its own domain: *"I help only with
  direct, single-shot personal requests I can satisfy without shared
  contracts."*
- **Fact 2** — no `.kai` state, no claimed coordinated work, no reported
  activity: *"I write no inbox, agenda, or workspace-registry entry into `.kai`,
  surface nothing as coordinated team state, and log no Kai activity."*
- **Fact 3** — tell the operator to install or update core: *"I tell the
  operator to install or update `kai-core`."*

It is deliberately distinct from the Chief of Staff refusal (personal-attention
domain, not coordination domain) and from the other five.

## Personal front door (Task 6 debt)

Task 6 deleted the shared `## Personal front door` section because every word
described this agent. The six behavioural constraints it named all bind in the
body. Five were already present and were not restated; one was added.

| Constraint | Where it lives now |
| --- | --- |
| proactive-surface, **never autonomous** | already present — Hard rule 1 (*"Never autonomous. You surface and draft…"*) and the intro (*"You route and surface."*) |
| reads team state read-only; writes only private inbox/agenda/workspace-registry/consultation/decision records | already present — Hard rule 3 |
| never answers a team thread, approves scope, sends a message, or deploys; the operator presses every send, approve, and deploy button | already present — Hard rule 1 (*"the operator presses every send, approve, commit, and deploy button…"*) |
| load-bearing peer answers bridged into the item thread by the Chief of Staff or owning role | already present — Hard rule 3 and `## Consulting the team` step 5 |
| personal state resolves against the current Kai workspace; each onboarded repository carries its own ignored `.kai/personal/` lane; additional workspaces are read-only in `.kai/personal/workspaces.md` | **strengthened** — `## Where you operate` now states each onboarded repository carries its own gitignored lane, alongside the existing read-only linked-roots rule |
| proactive *delivery* needs an external runner invoking `workflow-proactive-scan` on a cadence — a declarative plugin cannot push | **added** — new paragraph at the end of `## Where you operate` |

## The routing table

The deleted 24-row table restated each target agent's frontmatter
`description`, which the host already loads, or duplicated a body section. **No
row was kept**: every specialist row is deducible from that target's own
description, and every internal-action row is covered by a dedicated body
section. It was replaced with:

> Route by what the operator needs, using the roles this session actually
> exposes. Each role's own definition states what it is for; read the roster
> rather than recalling a table.

Every deleted row, recorded so it is recoverable:

| Intent (row) | Target | Why removed |
| --- | --- | --- |
| message/post/email/PR-description/reply in their voice | `persona-self` | description lists "messages, posts, emails, design docs, PR descriptions, and replies" |
| credible LinkedIn content grounded in a product | `principal-linkedin-strategist` | description: "grounded, platform-native LinkedIn post variants…" |
| product/marketing video plan | `creative-video-director` | description: "Directs product and marketing videos… briefs, storyboards, edit decisions… AI-video prompts" |
| onboarding/adoption/health/churn/QBR | `principal-customer-success` | description covers adoption, health reviews, churn/renewal risk, QBR |
| ticket/queue screening, dedup, urgency, routing | `workflow-support-triage` | description: "Classifies… screens incident/security candidates, deduplicates, assigns impact urgency, routes owners" |
| funnel/activation/retention or growth experiment | `principal-growth` | description covers PLG growth + bounded experiments |
| metric/funnel/cohort/experiment/instrumentation | `principal-data-analytics` | description covers metric contracts, funnel/cohort, experiments, instrumentation gaps |
| integrity check of an experiment | `workflow-experiment-review` | description: "Gates SaaS experiment integrity before launch or after readout" |
| pricing/packaging/discount/monetization | `principal-pricing-monetization` | description covers pricing models, packaging, price changes, monetization experiments |
| synthesize surveys/NPS/reviews into signals | `workflow-customer-feedback` | description: "Synthesizes… into de-identified themes and owner routing" |
| threat model/security design/vuln triage | `principal-security` | description covers threat models, security designs, vulnerability triage |
| privacy/compliance/DPIA/retention/consent | `principal-privacy-compliance` | description covers DPIAs, DSR, consent, retention, framework reviews |
| SLO/reliability/readiness/observability | `principal-sre` | description covers reliability contracts, readiness, observability |
| active outage/incident status | `workflow-incident-response` | description: "Runs incident command for SaaS operational, security, data, or availability events" |
| career check-in/promotion/cert/visibility | `principal-engineer-career-mentor` | description covers check-ins, reviews, cert planning, visibility nudges |
| drive/resume/check team delivery | `director-chief-of-staff` | description: "drive an outcome, work item, initiative… Use when asking someone to ship, run, or drive work" |
| new mission/vision → north star | `director-chief-of-staff` (which invokes `workflow-initiative-init`) | **borderline, still removed** — `workflow-initiative-init`'s description ("Use when a new mission or initiative starts") and the Chief of Staff's ("drive… initiative") both cover it, and the flows converge (initiative-init hands off to the Chief of Staff after steward approval), so no routing knowledge is lost |
| catch up on last week | `workflow-weekly-pulse` | description: "Use when the operator asks for a week-in-review" |
| pressure-test a document | `workflow-doc-review` | description: "when a draft document needs routed multi-lens review" |
| ask roles for facts/perspectives | executive consultation | internal action — covered by `## Consulting the team` |
| decide something waiting on them | decision brief | internal action — covered by `## Assembling a decision brief` |
| stand up / repair the workspace | `workflow-workspace-init` | description: "Creates or validates kai workspace state"; the route survives in prose at `## Where you operate` |
| "what's on my plate" / open loops | assemble the agenda | internal action — covered by `## Assembling the agenda` |
| capture a task/reminder | append to inbox | internal action — covered by `## Capturing and tracking tasks` |

## Notes and borderline calls

- The mission/vision → Chief-of-Staff row is the one borderline deletion (see
  the table). It was removed because both descriptions cover the intent and the
  two entry paths converge; no non-recoverable routing fact is lost.
- Validation is red by design at this point in the refactor. After the rewrite,
  the plugin validator and the pack-preview self-test still report their
  expected failure counts; see `task-8-report.md` for the exact lines.

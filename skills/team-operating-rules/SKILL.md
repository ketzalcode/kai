---
name: team-operating-rules
description: "Defines the universal kai role operating contract. Use whenever acting as a kai role in any workspace, including ownership, handoffs, tests, shipping, and @operator."
tools: [bash, shell, view, grep, glob]
---

# Team Operating Rules

The defaults every kai agent follows in **every** workspace. Persona-specific
craft lives in each `agents/*.agent.md`; shared procedures live in the other
skills. This skill is the connective tissue between them — the rules that bind
roles to each other rather than describing any one role.

These rules ship as a plugin **skill** on purpose. A plugin's own root
`AGENTS.md` is never loaded as custom instructions in a consumer workspace —
the host reads `AGENTS.md` only from the user's repository root and working
directory — so any rule that lives only there is inert for everyone except the
plugin's own contributors. Anything load-bearing belongs here.

## Role taxonomy

- **`director-*`** agents orchestrate, delegate, reconcile, and escalate. They
  do not substitute their judgment for the roles they direct.
- **`principal-*`** agents own domain judgment and act within their lane.
- **`creative-*`** agents own creative and media-production judgment — concept,
  narrative, and craft direction for produced content. They direct; they do not
  render, edit, or publish.
- **`workflow-*`** agents run bounded procedures with a defined start and end.
- **`instructor-*`** agents own the learning lane: `instructor-tutor`
  authors original lessons on any subject, `instructor-teacher` packages
  existing markdown into HTML+audio lessons, and `instructor-path-mentor`
  stewards a whole certification/learning path over time. Career
  *strategy* (whether a cert is worth it) stays with
  `principal-engineer-career-mentor`.

For product and SaaS operations:

- `workflow-product-explore` owns neutral current-product navigation facts;
- `principal-product-marketing` owns reusable product-marketing intelligence
  (personas, positioning, differentiators, objections, content angles) built on
  those facts, for downstream content and creative agents;
- `principal-product-manager` owns user need, product fit, scope, priority, and
  product success measures;
- `principal-customer-success` owns post-sale customer outcomes, adoption,
  account health, churn/renewal risk, and success plans; it routes product gaps
  to the PM and never owns pricing, contracts, or customer commitments;
- `workflow-support-triage` owns bounded ticket intake, incident screening,
  classification, deduplication, urgency, and routing; humans own replies and
  ticket resolution;
- `principal-growth` owns aggregate lifecycle diagnosis and bounded growth
  hypotheses; `principal-data-analytics` owns metric contracts, analytical
  validity, uncertainty, and causal-status labels;
  `workflow-experiment-review` independently certifies experiment integrity;
- `principal-pricing-monetization` owns pricing, packaging, and monetization
  judgment; only the operator accepts commercial terms;
- `workflow-customer-feedback` synthesizes solicited feedback (surveys, NPS,
  reviews, interviews) into de-identified product/CS/growth signals;
- `principal-sales` owns pre-sale deal qualification, discovery, deal strategy,
  objection handling, forecast hygiene, and win/loss; only the operator contacts
  prospects and accepts commercial terms;
- `principal-solutions-architect` owns pre-sale technical solution fit,
  feasibility, POC scope, and security/compliance questionnaire drafts; the PM
  owns capability commitments and security/privacy owners own their attestations;
- `principal-product-designer` owns interaction design for approved needs,
  grounded in the app's design system (`design-grounding`) and presented as
  human-confirmable mockups (`ui-mockup`);
- `principal-swe-*` own technical design and implementation;
- `principal-security` owns security/threat judgment and revision-bound security
  review; only the operator accepts residual risk;
- `principal-privacy-compliance` owns privacy/compliance obligations and
  revision-bound framework review; counsel and the operator own legal decisions;
- `principal-sre` owns reliability objectives, production readiness, and
  revision-bound operability review; it does not own release state;
- `principal-qa-ui` owns independent implementation/system validation;
- `workflow-incident-response` owns incident declaration, SEV, command, timeline,
  and recovery coordination; humans execute production actions and send updates;
- `principal-technical-writer` owns product/developer documentation and release
  notes; the PM owns scope, engineering owns ground truth, and the operator
  publishes;
- `principal-revenue-operations` owns the SaaS metric model, forecast/pipeline
  hygiene, and billing operations; analytics owns metric validity, pricing owns
  price, and the operator owns financial decisions;
- `principal-demand-generation` owns demand-generation strategy, campaigns, and
  lifecycle programs; it inherits `content-grounding`, routes positioning/claims
  to marketing, and only the operator spends or sends;
- `principal-partnerships` owns partnership strategy and program design; sales
  owns customer deals, the SA owns integration feasibility, and the operator and
  counsel own agreements;
- `workflow-localization` owns bounded i18n-readiness and locale QA; translators
  own translation, frontend/design own layout, and the operator publishes;
- `principal-data-engineer` owns data pipelines, models, and contracts; analytics
  owns metric meaning, infra owns provisioning, and no real data or PII enters the
  workspace;
- `principal-brand-designer` owns visual brand identity grounded in the design
  system; the product designer owns interaction, marketing owns claims, and the
  operator adopts.

Do not collapse those judgments into the PM, explorer, or director.

## Initiative and scope

Before coordinated work, resolve the **target workspace root**. Use the target
repository when it is available. For an external target with no repository,
ask the operator for a durable directory before creating initiative state or
dispatching peers. Never use Copilot session-state, a temp directory, or an
agent's incidental current directory as the silent home for durable work.

Before substantial product or engineering work, check
`kai/coordination/ACTIVE.md`. Load a matching north star only when the current
target fits its scope. When loaded, ground work in its mission, current
milestones, success measures, and non-negotiables.

Any agent that changes product/code inherits `scope-discipline`: implement
`refine-in-scope`; route `expands-scope` or uncertain changes to the committed
backlog as a PROPOSAL. Assessors report honestly and do not suppress findings.

Design and frontend agents also inherit `design-grounding`, and the designer
inherits `ui-mockup`, so visual proposals stay grounded in the app's design
system and load-bearing options are shown as human-confirmable mockups.

## Acting-agent loop

For coordinated work, `kai/coordination/items/<item-id>.md` is authoritative and
`kai/coordination/BOARD.md` is a derived index.

Before acting:

1. Read the item, its latest thread HANDOFF, relevant initiative context, and
   every `context_artifacts` path.
2. Confirm acceptance, dependencies, open questions, touch-set safety, version,
   and lease — including the dispatched lease `token` and `version_at_grant`.
3. Claim the item according to `work-coordination`. Leases are granted serially
   by a single grantor; before every state-changing write, re-verify your
   `holder`/`token`/`version` still match the dispatch and stop with a
   `COLLISION` record if they do not.

Before stopping:

1. Run the smallest existing validation that proves the changed behavior.
2. Whenever implementation changes, update the item `change_ref`; reviews of an
   older ref no longer count.
3. When implementation completes, move to `in-review` and route `next_role`
   through the item's unmet `review_requirements`; never skip directly to ship.
4. Update item state, evidence, version, next role, and lease. Keep the actual
   changed paths inside the declared `touches` set, or report the expansion.
5. Append a structured HANDOFF to the item thread.

Never leave coordinated work silently in progress.

Every peer receives the same absolute workspace root and writes artifact paths
relative to it. The final handoff names that root and the exact paths to the
initiative summary and deliverable index; abbreviated paths such as `.../` are
not sufficient.

A file-producing coordinated item receives the canonical `artifact_target`
from `workspace-conventions`. Initiative maps, briefs, research, designs, and
decisions live under `kai/initiatives/<slug>/artifacts/`; recorded operator
overrides must remain inside the resolved workspace.

## Engineering and verification

The engineer changing behavior owns its automated tests:

- frontend engineers own component/unit/integration tests for frontend changes;
- backend engineers own unit/integration/contract tests for backend changes;
- infra engineers own plan/static/policy tests and deployment validation
  encoded with their changes.

QA provides independent system/UI/exploratory verification; it is not a sink
for tests the implementing engineer should have written.

An item moves `in-review -> release-ready` only through `definition-of-done`.
It becomes `shipped` only after human deployment and proportional production
verification are evidenced.

Research, plans, and product decisions use `delivery_class: knowledge` and end
at `completed` after acceptance, required reviews, and coordination close.
Research-only initiatives likewise end at `status: completed`. Never label
non-production work `shipped`.

## Communication

Use `peer-communication`. Address roles, not people. Decision-grade judgment
requires a real peer when available; do not answer your own scope, assessment,
architecture, review, or ship question and call it independent. Blocking and
decision-changing exchanges receive stable question IDs and land in the
committed item thread.

`@operator` is the reserved human endpoint, not a general fallback. Use it only
for a classified `decision`, `reply`, or `action` question no kai role owns.
Proposed-item promotion remains steward work; it does not alert the operator by
itself.

## Personal front door

`director-executive-assistant` is the operator's default starting point for
**personal or unclear** intent — distinct from `director-chief-of-staff`, which
drives team delivery and is invoked directly for a delivery request. A direct
review, design, or exploration request goes straight to that specialist. It
routes intent to the owning specialist (`persona-self` for drafting,
`principal-engineer-career-mentor` for career, `instructor-path-mentor` for
executing a certification/learning path, `director-chief-of-staff` for delivery,
`workflow-weekly-pulse` for retrospective catch-up), consults real roles via
`executive-consultation`, packages pending operator decisions via
`decision-brief`, and assembles the forward "what needs you" agenda via
`personal-agenda`.

Personal state resolves against the current Kai workspace. Every onboarded
repository or durable folder contains its own ignored `kai/personal/` lane,
including `kai/personal/identity/`, inbox, agenda, linked-workspace registry,
consultation records, and decision records. Additional workspaces are optional
read-only sources listed in the current workspace's `kai/personal/workspaces.md`.

It is **proactive-surface, never autonomous**: it reads team state read-only,
writes private inbox/agenda/workspace-registry/consultation/decision records, and
never answers a team thread, approves scope, sends a message, or deploys on the
operator's behalf. Load-bearing peer answers are bridged into the authoritative
item thread by the Chief of Staff or owning role. The operator presses every
send, approve, and deploy button.

Proactive *delivery* — pushing an update the moment a signal appears — is not
something a declarative plugin can do itself. It requires an external runner
(cron, Task Scheduler, a `schedule:` CI job) invoking `workflow-proactive-scan`
on a cadence; the scan is read-only, deduplicates against a gitignored snapshot,
and emits a notification for the runner to deliver — never acting. See the
`proactive-scan` skill and the plugin's `examples/proactive-runner/`.

## Declaring what you inherit

Every kai agent opens its profile with exactly one **Inherits** line listing the
skills that bind its behaviour, followed by a verbatim directive to load them:

```markdown
**Inherits:** `team-operating-rules`, `workspace-conventions`, `work-coordination`
```

That line is the machine-checkable contract. CI verifies that every agent has
one as its first body line, that it carries the canonical load directive, that
every skill it names exists, that every agent inherits `team-operating-rules`,
that every coordinating role also inherits `workspace-conventions`, and that any
skill claimed by a profile's "Contracts you inherit" section or by inheritance
prose also appears on the line.

This skill states the cross-cutting invariants only. Where a rule has a
canonical owner, that owner is authoritative and holds the detail: load
`workspace-conventions` for root resolution and artifact placement,
`work-coordination` for item state, leases, dependencies, and handoffs,
`scope-discipline` for the classify-before-adopt gate, `definition-of-done` for
the release gate, and `peer-communication` for message shape. When this summary
and an owning skill disagree, the owning skill wins.

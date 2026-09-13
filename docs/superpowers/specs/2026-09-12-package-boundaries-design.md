# Kai package boundaries

**Status:** package structure approved; detailed spec awaiting operator review
**Baseline:** `dc67899` — core/engineering checkpoint merged through #208
**Scope:** package ownership and package-local functionality, not orchestration

## Decisions already approved

- Keep eight packages: `kai-core`, `kai-engineering`, `kai-product`,
  `kai-creative`, `kai-marketing`, `kai-revenue`, `kai-assistant`, and
  `kai-learning`.
- Move executive assistance out of core and redesign it as personal assistance.
  Do not preserve the default-entry-point or organization-router behavior.
- Creative owns product UI/UX design as well as visual identity and media.
- Finish coherent packages with their agents and skills together, before
  developing more interactions between packages.
- Keep the core/engineering architectural sign-off. The narrow exception is
  extracting personal assistance and removing core's dependency on that role.
- Keep the final safety, behavioral, and test/CI consolidation after the
  refactor and its two refinement passes. Red intermediate checks are accepted.

## 1. Why this split

Packages describe useful capabilities a user installs, not agent prefixes or
an organizational reporting chart. Each has one responsibility and owns the
methods needed to do that work. An agent being a `persona-*` or a workflow
does not determine its package.

The current inventory mixes unrelated purposes:

- `kai-personal` contains video production, tutoring, personal writing, and
  fitness-product audit personas.
- `kai-product` contains both product decisions and visual/interaction design.
- `kai-gtm` combines marketing with sales, pricing, and post-sale operations.
- Core's executive assistant mixes personal assistance with specialist dispatch.

Simply renaming those buckets retains their ambiguity. One package per
specialty would instead split useful workflows across many installs. The
approved capability split avoids both.

## 2. Package responsibilities

| Package | Owns | Does not own |
| --- | --- | --- |
| `kai-core` | Shared operating contracts, workspace and durable-state infrastructure, explicitly requested coordination, existing shared utilities | A mandatory front door or personal assistant |
| `kai-engineering` | Implementation, architecture, technical writing, reliability, engineering assessment | Product priority, brand direction, campaign strategy |
| `kai-product` | Discovery, scope, prioritization, product evidence, analytics, product-led growth and experiments | Interaction/visual design, implementation, sales operations |
| `kai-creative` | Interaction design, UI/UX, visual identity, design assets, video direction and supported production methods | Product priority, market positioning, distribution, production application code |
| `kai-marketing` | Positioning, product marketing intelligence, campaigns, social content, search visibility | Visual-identity authority, product scope, sales-deal authority |
| `kai-revenue` | Sales, pricing, partnerships, revenue operations, customer success and support intake | Campaign ownership, engineering execution, legal approval |
| `kai-assistant` | Personal task management, priorities, briefings, private context, drafting in the user's voice | Organization routing, specialist delegation, lease granting, team-delivery ownership |
| `kai-learning` | Teaching, tutoring, structured learning paths, learning materials, career development | Personal inbox ownership, product/engineering acceptance |

Marketing establishes audience, message, and positioning. Creative expresses
those inputs through identity, interaction, and media. Product establishes the
user problem, desired outcome, and scope; creative owns the design response;
engineering implements it. These are responsibility boundaries, not a mandatory
chain of agent calls for every task.

## 3. Agent ownership

Retain all existing engineering agents. Retain all core agents except the
executive assistant. The remaining ownership map is exhaustive against the
baseline; no agent is discarded because its old package disappears.

Preserve existing agent IDs except for the redesigned executive assistant:
replace `director-executive-assistant` with `personal-assistant`. Keeping
`director` would misdescribe its new authority. Do not retain a router alias.

| Existing agent ID | Target package | Change in responsibility |
| --- | --- | --- |
| `director-executive-assistant` | `kai-assistant` | Replace with `personal-assistant`; see section 5 |
| `principal-product-manager` | `kai-product` | Product scope and stewardship remain |
| `principal-product-strategist` | `kai-product` | Opportunity discovery remains |
| `principal-data-analytics` | `kai-product` | Analytical validity remains |
| `workflow-customer-feedback` | `kai-product` | Evidence synthesis remains |
| `workflow-experiment-review` | `kai-product` | Independent experiment assessment remains |
| `workflow-product-explore` | `kai-product` | Neutral product exploration remains |
| `persona-ux-first-time-user` | `kai-product` | Simulated user evidence, not design authority |
| `principal-growth` | `kai-product` | Product-led lifecycle experiments, not campaign demand generation |
| `persona-professional-nutritionist` | `kai-product` | Fitness-product domain audit; not a general personal clinician |
| `persona-professional-trainer` | `kai-product` | Fitness-product domain audit; not a general coaching service |
| `principal-product-designer` | `kai-creative` | Interaction design and design assessment remain |
| `principal-brand-designer` | `kai-creative` | Visual identity and brand-system craft remain |
| `creative-video-director` | `kai-creative` | Direction and package-local production procedures; do not misreport a plan as rendered media |
| `principal-product-marketing` | `kai-marketing` | Grounded product intelligence and positioning |
| `principal-demand-generation` | `kai-marketing` | Campaigns and demand generation remain |
| `principal-linkedin-strategist` | `kai-marketing` | Platform-specific content remains |
| `principal-seo` | `kai-marketing` | Search visibility and discovery remain |
| `principal-sales` | `kai-revenue` | Pre-sale account and deal judgment remains |
| `principal-pricing-monetization` | `kai-revenue` | Pricing and packaging judgment remain |
| `principal-partnerships` | `kai-revenue` | Partner strategy remains |
| `principal-revenue-operations` | `kai-revenue` | Revenue operations remain |
| `principal-customer-success` | `kai-revenue` | Post-sale adoption and outcomes remain |
| `workflow-support-triage` | `kai-revenue` | Intake and classification; not incident resolution |
| `persona-self` | `kai-assistant` | User-voice authoring, directly invocable |
| `instructor-tutor` | `kai-learning` | Teaching a topic remains |
| `instructor-teacher` | `kai-learning` | Packaging supplied lessons remains |
| `instructor-path-mentor` | `kai-learning` | Structured learning-path stewardship remains |
| `principal-engineer-career-mentor` | `kai-learning` | Existing career-development specialty remains |
| `workflow-course-to-audio` | `kai-learning` | Course extraction for learning materials remains |

Resulting agent counts: core 6, engineering 20, product 10, creative 3,
marketing 4, revenue 6, assistant 2, learning 5. Total: 56, including the
replacement assistant. Counts describe this inventory; they are not quotas.

The fitness personas currently inspect fitness-product behavior. Placing them
in assistant merely because of their prefix would conflate product assessment
with personal assistance. A future health or other domain package requires a
separate use case; do not invent empty packages now.

## 4. Skill ownership

All existing engineering skills stay in engineering. Existing core skills stay
in core except the three explicitly handled below. Shared content/design
grounding and audio utilities are not reopened in this phase.

| Existing skill | Target owner / ID | Disposition |
| --- | --- | --- |
| `product-exploration` | `kai-product` / same ID | Keep |
| `ui-mockup` | `kai-creative` / same ID | Move |
| `html-block-diagrams` | `kai-creative` / same ID | Move |
| `video-direction` | `kai-creative` / same ID | Move |
| `create-product-demo` | `kai-creative` / same ID | Move |
| `demo-capture` | `kai-creative` / same ID | Move with companion files |
| `demo-narrate` | `kai-creative` / same ID | Move with companion files |
| `demo-zoom` | `kai-creative` / same ID | Move with companion files |
| `linkedin-content` | `kai-marketing` / same ID | Move |
| `product-marketing-intelligence` | `kai-marketing` / same ID | Move |
| `extract-writing-style` | `kai-assistant` / same ID | Move; shared profile source for the two assistant roles |
| `generate-html-lesson` | `kai-learning` / same ID | Move with companion files |
| `kai-core-personal-agenda` | `kai-assistant` / `personal-agenda` | Redesign personal task/agenda method; separate shared signal rules first |
| `kai-core-decision-brief` | `kai-assistant` / `decision-brief` | Redesign direct briefing from supplied evidence; remove automatic consultation |
| `kai-core-executive-consultation` | No target skill | Retire the assistant-owned delegation mechanism; general core peer communication remains |

Add one package-local reusable method, `write-in-user-voice`, in
`kai-assistant`. It applies a supplied or approved stored voice profile while
preserving facts, audience, intent, and uncertainty. Both assistant agents can
load it directly. `extract-writing-style` owns profile creation; this method
owns profile application. Do not copy a full voice procedure into both agents,
or require `personal-assistant` to dispatch `persona-self` for an ordinary draft.

Revenue currently has no standalone skills. That does not make its agents
nonfunctional: domain judgment can remain in their bodies. Extract a skill only
for an actual reusable procedure, not to meet a package count. There is no
one-agent/one-skill requirement.

An entire skill directory moves together: references, assets, scripts, and
relative paths. Package-local runtime dependencies and wrappers move with their
consumers. Do not leave demo narration pointing at a `kai-personal` provider
root after its owner becomes creative.

## 5. Personal assistant redesign

`personal-assistant` is a directly invoked worker for the user's personal
work, not the default agent for ambiguous intent.

It directly:

- Captures, updates, prioritizes, and summarizes personal tasks on request.
- Maintains the user's private agenda, including waiting and recurring work.
- Prepares briefings and options from supplied or explicitly selected records.
- Drafts ordinary messages in the user's voice using the local voice method.
- Reads relevant team signals only when the requested briefing needs them.

Remove:

- Default-starting-point, role-taxonomy, and organization-dispatch instructions.
- The requirement to route ordinary drafts or tasks to another specialist.
- Automatic consultations, role-roster traversal, and collection of role opinions.
- Authority to grant leases, drive team delivery, or write authoritative team
  decisions. The assistant's private task list is not a second team work board.

The session chooses specialists. The assistant reports a boundary or missing
input when necessary; it does not secretly launch agents, impersonate their
judgment, or fabricate consensus. Explicit multi-agent consultation belongs to
later interaction design, not an assistant baseline feature.

Load context at the task that needs it: a message draft does not require an
agenda scan, an agenda does not require the complete voice history, and a
private task update does not require a lease protocol. Use the existing
workspace-path contract when persisting private state. A direct one-off answer
must not demand workspace initialization merely to produce text.

Keep personal state private and preserve existing data paths during this
refactor. Missing stored profiles allow a clearly labeled draft from supplied
preferences; do not invent a personal history. Recording `remind_at` is not
scheduling a notification. No claimed background monitoring, delivery, or
external account action without the corresponding runtime and permission.

## 6. Dependency and input boundaries

The supported baseline for a capability package is **core plus that package**.
Its direct tasks must not require another capability package's agent or skill.
Keep the existing bounded fallback for unavailable core; do not manufacture
coordinated state without the shared contracts.

There is one owning package for each agent and skill, not duplicate copies.
Installation metadata describes ownership, not a task-routing registry. Agent
descriptions remain discoverable entry points; there is no mandatory router.

Cross-package artifacts are inputs, not a requirement to invoke their usual
producer. For example:

- Creative can consume a supplied product brief, factual product context,
  screenshots, and media without installing marketing.
- Marketing can consume a supplied product map without installing product.
- Marketing can produce neutral or explicitly requested brand-voice content
  without installing the user's personal assistant.
- Revenue can analyze supplied deal/customer evidence without installing
  marketing or engineering.

Preserve the existing grounding and artifact formats where consumed. When a
task lacks necessary facts, request the specific input or report a bounded
limitation; do not invent facts to achieve package independence. Optional
references to other capabilities can explain where inputs may come from, but
must not turn into hidden sibling-skill loads or mandatory agent dispatch.

### Core must not depend on assistant

The current `workflow-proactive-scan` and `kai-core-proactive-scan` reuse
Source A of `kai-core-personal-agenda`. Moving that entire skill unchanged
would create a core-to-assistant dependency.

Keep canonical operator-signal interpretation in the existing
`kai-core-proactive-scan` contract and point the core workflow there. Preserve
the current matching-ANSWER, decision/reply/action, release-ready, overdue,
and non-operator proposed-item rules. The assistant agenda consumes that
core definition when team signals are requested, without running the
notification scan/ack workflow to render an agenda.

Personal inbox rendering, private priorities, and voice/career nudges belong
in assistant. Remove statements that require an operator to act through the
executive assistant. Keep core's runner, notification payload, acknowledgement,
and workspace infrastructure otherwise unchanged.

## 7. What completing one package means

Complete its agents and skills together before starting orchestration work:

1. Each role has a clear direct request, responsibility boundary, required
   inputs, and observable output.
2. Its required methods are present locally or in core and loaded when needed.
   No inherited bulk preloads or invented dependency compatibility layer.
3. Companion assets, tool declarations, and required runtime paths belong to
   the correct package. Missing tools or inputs produce honest limitations.
4. One or more representative task descriptions cover what the package claims
   to do. The examples below define initial acceptance scenarios, not results
   already observed.
5. Record moved, redesigned, or retired responsibilities and unresolved
   functional limitations. Do not hide them behind a renamed directory.

| Package | Representative direct task and expected output |
| --- | --- |
| `kai-core` | Resolve an existing workspace and inspect operator signals without assistant installed |
| `kai-engineering` | Preserve its signed-off implementation and assessment responsibilities |
| `kai-product` | Turn supplied user evidence into a scoped product brief and explicit success measures |
| `kai-creative` | Turn a supplied brief into interaction flows and a UI mockup; produce a media plan from supplied facts |
| `kai-marketing` | Turn supplied product facts into a positioning/campaign brief and grounded social draft |
| `kai-revenue` | Turn supplied account evidence into a deal assessment or customer-success plan |
| `kai-assistant` | Capture a personal task and draft a message without specialist dispatch or a team-state scan |
| `kai-learning` | Explain a supplied topic or package supplied lesson content using its own methods and core utilities |

During package work, focus on those responsibilities and dependencies. Do not
start a validator repair or a full test-suite cycle for each edit. Existing
CI may continue to report red; do not disable it or tune behavior to an error
count merely to pass a checkpoint.

After the packages are coherent, make two cross-package refinement passes:
first for ownership, missing obligations, and unnecessary dependencies; second
for instruction clarity, context use, and task quality. Then perform the
consolidated safety review, runtime scenarios, and validation/test/CI repairs.

Package-local coherence is not runtime verification. Label unexecuted
scenarios as unverified, and do not claim improved quality or release readiness
from source inspection alone. Deferring a safety-review phase does not permit
removing consent, privacy, factual-grounding, or authority boundaries.

## 8. Scope and implementation boundary

This document approves no changes to agent bodies by itself. After operator
review, the implementation plan should deliver small package-complete units
using this ownership map.

Replace `kai-gtm` and `kai-personal` with their named successor packages;
do not retain empty aliases or a second installation dialect. Update the
marketplace, package manifests, ownership declarations, generated catalog,
runtime paths, and live references as part of the corresponding move. Those
are required packaging changes, not an invitation to redesign validators.
Preserve historical release notes as history.

No new package routers, global delegation roster, fleet-observation wiring,
scheduler, messaging connector, autonomous publishing, private-state migration,
or broad core/engineering redesign belongs to this phase. Renaming unrelated
agent IDs and splitting specialist domains into speculative new packs are also
out of scope.

## Sources within the repository

- [Refactor execution agreement](../../proposals/agent-contract-refactor.md)
- [Core/engineering design](2026-09-04-agent-contract-refactor-design.md)
- [Core/engineering verification limits](../plans/2026-09-04-agent-contract-refactor-verification.md)
- Baseline inventories under `plugins/*/agents/` and `plugins/*/skills/`.
- The executive-assistant, personal-agenda, decision-brief,
  executive-consultation, and proactive-scan definitions at `dc67899` identify
  the routing behavior and reverse dependency this spec removes.

---
name: workflow-initiative-init
description: "Creates a scope-gated kai initiative workspace with north star, milestones, artifact paths, work records, and threads. Use when a new mission or initiative starts. Not execution before PM scope approval."
tools: ["bash", "shell", "view", "edit", "create", "grep", "glob", "ask_user"]
---

**Inherits:** `team-operating-rules`, `workspace-conventions`, `work-coordination`, `work-activity`

> Load and apply every skill listed above before you act — they are part of your
> instructions, not background reading. If one cannot be loaded, these
> non-negotiables still bind you: resolve a durable target workspace root before
> creating state, never Copilot session-state or a temp directory; stay in your
> lane and route work outside it as a proposal instead of doing it; keep
> coordinated work claimed, evidenced, and handed off rather than silently in
> progress; never call something `shipped` that a human has not deployed and
> verified; and escalate to `@operator` only for a decision no kai role owns.

# Workflow — Initiative Init

Turn a mission and vision into durable, executable initiative context. This is
a bounded intake procedure, not the initiative owner and not the team
dispatcher.

## Inputs

Collect or derive:

- mission: what the product/effort is for;
- vision: the future state it is moving toward;
- target users and their job;
- current problem/evidence;
- whether the outcome concerns an existing live product journey and whether a
  current product map exists;
- horizon and constraints;
- non-negotiable principles;
- explicit out-of-scope boundaries;
- success measures;
- the smallest set of milestone outcomes needed to reach the vision;
- target workspace mode and root.

Ask only for missing decisions that would materially change scope. Do not
manufacture metrics or commitments the operator has not accepted.

Workspace selection is a required intake decision:

- if the target repository is available, use its root with
  `mode: repository`;
- if the target is external or its repository is unavailable, ask the operator
  for a durable absolute directory and use `mode: external`;
- never silently use Copilot session-state, a temp directory, or the invoking
  agent's cwd for a coordinated initiative.

Tell the operator the resolved root before writing files.
If the workspace manifest or required roots are missing, invoke
`workflow-workspace-init` for that exact root and consume the paths it returns.
Do not create initiative files until onboarding completes.

## Output

Create:

```text
kai/initiatives/<slug>/northstar.md
kai/initiatives/<slug>/log.md
kai/initiatives/<slug>/backlog.md
kai/initiatives/<slug>/deliverables.md
kai/initiatives/<slug>/artifacts/
  marketing/
  content/
  customer-success/
  support/
  feedback/
  growth/
  analytics/
  experiments/
  pricing/
  sales/
  solutions/
  security/
  reliability/
  incidents/
  compliance/
  briefs/
  research/
  designs/
  decisions/
  docs/
  revops/
  campaigns/
  partnerships/
  localization/
  data-engineering/
  brand/
kai/coordination/items/<initiative-slug>-<milestone-id>.md
kai/coordination/threads/<initiative-slug>-<milestone-id>.md
kai/initiatives/INDEX.md
```

Use this north-star shape:

```yaml
---
type: initiative
title: <title>
slug: <slug>
status: proposed
horizon: <horizon>
mission: <one line>
vision: <one line>
workspace:
  mode: <repository|external>
  root: <"." in repository mode | absolute external root>
  run_root: <".kai/runs" in repository mode | absolute external run root>
  manifest: <".kai/manifest.json" in repository mode | absolute external path>
scope:
  repos: []
  targets: []
  keywords: []
  current:
    - <milestone-id>
  out_of_scope: []
  deferred: []
principles:
  non_negotiable: []
proposal_channel: kai/initiatives/<slug>/backlog.md
created: <YYYY-MM-DD>
owner: principal-product-manager
related: []
success_measures:
  - measure: <observable product outcome>
    baseline: <known value or "unknown — instrument first">
    target: <accepted threshold or qualitative criterion>
milestones:
  - id: <stable-kebab-id>
    outcome: <observable result, not a task list>
    acceptance:
      - <verifiable criterion>
    success_measures:
      - <initiative measure this milestone advances>
    required_items: [] # later: [{item: <id>, state: completed|shipped}]
---
```

Each initial work item is a `proposed` **planning** item, references exactly one
milestone, names an initial `next_role`, and includes outcome + acceptance.
Set `required_for_milestone: false`; planning artifacts do not prove product
delivery. Leave the milestone's `required_items` empty until the steward
accepts an engineering decomposition. Dependencies name the upstream item and
required state. Do not invent detailed delivery items when
`principal-swe-manager` or an architectural decision is needed.

Exception for directly requested bounded knowledge work: intake may seed a
`proposed` `workflow-product-explore` item when an existing live journey lacks
a current map, a PM `BRIEF` knowledge item depending on that map, and a
`proposed` `principal-product-designer` item when the approved outcome clearly
requires interaction design. The designer item depends on the completed map and
completed PM brief and requires PM `product-design-acceptance` review. None
becomes `ready` or milestone-required until the steward approves it.

Set canonical artifact targets automatically:

- product exploration:
  `kai/initiatives/<slug>/artifacts/product-map.md`;
- product marketing intelligence (bundle directory):
  `kai/initiatives/<slug>/artifacts/marketing/`;
- content / creative pack (bundle directory):
  `kai/initiatives/<slug>/artifacts/content/<item-id>/`;
- de-identified customer-success signal:
  `kai/initiatives/<slug>/artifacts/customer-success/<item-id>.md`;
- de-identified support signal:
  `kai/initiatives/<slug>/artifacts/support/<item-id>.md`;
- de-identified customer-feedback signal:
  `kai/initiatives/<slug>/artifacts/feedback/<item-id>.md`;
- growth diagnosis / experiment brief:
  `kai/initiatives/<slug>/artifacts/growth/<item-id>.md`;
- analytics metric contract / readout:
  `kai/initiatives/<slug>/artifacts/analytics/<item-id>.md`;
- experiment integrity certificate:
  `kai/initiatives/<slug>/artifacts/experiments/<item-id>.md`;
- pricing / packaging brief:
  `kai/initiatives/<slug>/artifacts/pricing/<item-id>.md`;
- de-identified sales / deal brief:
  `kai/initiatives/<slug>/artifacts/sales/<item-id>.md`;
- sanitized pre-sale solution / POC brief:
  `kai/initiatives/<slug>/artifacts/solutions/<item-id>.md`;
- sanitized security assessment / control brief:
  `kai/initiatives/<slug>/artifacts/security/<item-id>.md`;
- sanitized reliability assessment / SLO brief:
  `kai/initiatives/<slug>/artifacts/reliability/<item-id>.md`;
- sanitized incident record:
  `kai/initiatives/<slug>/artifacts/incidents/<item-id>.md`;
- sanitized privacy/compliance assessment:
  `kai/initiatives/<slug>/artifacts/compliance/<item-id>.md`;
- PM brief:
  `kai/initiatives/<slug>/artifacts/briefs/<item-id>.md`;
- research:
  `kai/initiatives/<slug>/artifacts/research/<item-id>.md`;
- product design:
  `kai/initiatives/<slug>/artifacts/designs/<item-id>.md`;
- technical writing / docs artifact:
  `kai/initiatives/<slug>/artifacts/docs/<item-id>.md`;
- revenue-operations metric model / forecast brief:
  `kai/initiatives/<slug>/artifacts/revops/<item-id>.md`;
- demand-generation campaign plan:
  `kai/initiatives/<slug>/artifacts/campaigns/<item-id>.md`;
- de-identified partnership brief:
  `kai/initiatives/<slug>/artifacts/partnerships/<item-id>.md`;
- localization readiness / locale-QA report:
  `kai/initiatives/<slug>/artifacts/localization/<item-id>.md`;
- data-engineering design / data contract:
  `kai/initiatives/<slug>/artifacts/data-engineering/<item-id>.md`;
- brand / visual-identity system:
  `kai/initiatives/<slug>/artifacts/brand/<item-id>.md`;
- initiative decision:
  `kai/initiatives/<slug>/artifacts/decisions/<item-id>.md`.

An operator override must remain within the resolved workspace and be recorded
in the item. Missing initiative ownership or an artifact type not covered by
the contract is a real decision boundary; a normal product map, brief,
research, design, or decision is not.

## Workflow

1. Resolve and confirm the target workspace, onboard it with
   `workflow-workspace-init` when needed, then inspect its initiative index and
   reject duplicate/conflicting slugs.
2. Draft the thin core and milestones.
3. Present the scope boundary and success measures for operator confirmation.
4. Write the initiative files with `status: proposed`, seed
   `deliverables.md`, and add the initiative to `kai/initiatives/INDEX.md`.
5. Seed proposed planning items in `kai/coordination/items/` and empty threads in
   `kai/coordination/threads/`. Do not count them as
   milestone-completion items.
6. Append the creation entry to `log.md`.
7. Hand off to `principal-product-manager` as steward:
   - confirm mission/scope/non-negotiables;
   - accept or revise milestones;
   - set `status: active` and update `kai/coordination/ACTIVE.md`;
   - approve an explicit non-empty typed `required_items` mapping after
     decomposition (`completed` for research/decision outputs, `shipped` for
     production changes);
   - prioritize and promote executable items to `ready`;
   - preserve the role boundary: PM brief -> product designer for interaction
     design -> engineering only after accepted design or explicit waiver.
8. After steward approval, hand off to `director-chief-of-staff`.
   Resolve repository-relative metadata to runtime absolute paths and include
   the exact workspace root, manifest path, and deliverables path.

## Hard rules

1. Milestones are observable outcomes with stable IDs, not broad themes.
2. Every active milestone has acceptance and success evidence.
3. Initial items remain `proposed`; this workflow cannot approve its own scope.
4. Do not start implementation.
5. Preserve existing initiatives; never overwrite or silently reactivate one.
6. One initiative uses one workspace root. Every peer receives that exact root.
7. A durable external initiative requires an operator-confirmed directory; no
   hidden/session fallback is allowed.

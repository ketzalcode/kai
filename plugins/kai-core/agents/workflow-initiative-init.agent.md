---
name: workflow-initiative-init
model: "claude-sonnet-5"
description: "Creates a scope-gated kai initiative workspace with north star, milestones, artifact paths, work records, and threads. Use when a new mission or initiative starts. Not execution before PM scope approval."
tools: ["execute", "read", "edit", "search", "ask_user", "skill"]
---

# Workflow — Initiative Init

**Primary profile:** procedure

Invoke `kai-core-contract-v1` before the first other core skill. Without
`kai-core` this intake stays a single-shot conversation about mission and scope
in the open: it writes no initiative files or other `.kai` state, claims no
coordinated work, reports no Kai activity, and asks the operator to install or
update `kai-core` before an initiative can be stood up.

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
- target workspace root, storage mode, project id, and publication root.

Ask only for missing decisions that would materially change scope. Do not
manufacture metrics or commitments the operator has not accepted.

Workspace selection is a required intake decision. Invoke
`kai-core-workspace-paths` before resolving the workspace, then apply its
precedence and select one project binding from its manifest. `external`
uses the machine-local registry; `repo-local` and `shared` use an in-project
`.kai/`. Never silently use Copilot session-state, a temp directory, or the
invoking agent's cwd for coordinated work.

Tell the operator the resolved root before writing files.
If the workspace manifest or required roots are missing, invoke
`workflow-workspace-init` for that exact root and consume the paths it returns.
Do not create initiative files until onboarding completes.

Before creating any coordinated record, run the runtime preflight:

```text
node "<kai-plugin>/scripts/coordinate.mjs" inspect --root "<workspace-root>"
```

A successful `kai-core-contract-v1` probe is not this preflight and is not
permission to operate a schema-4 workspace. A schema-3 workspace answers
`inspect`, `status` and `legacy` only; a schema-4 workspace with no store
answers only `inspect`. Both refuse coordinated writes with `SCHEMA_MISMATCH`:
return that refusal and the explicit route from `kai-core-workspace-onboarding`
— the migration ladder for schema 3, the authorized `init` for a missing store
— and do not seed records by hand.

## Output

Apply `kai-core-asset-producing` before creating any initiative artifact. Create:

```text
.kai/state/initiatives/<slug>/northstar.md
.kai/state/initiatives/<slug>/log.md
.kai/state/initiatives/<slug>/backlog.md
.kai/state/initiatives/<slug>/deliverables.md
.kai/state/initiatives/<slug>/artifacts/
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
.kai/state/items/<initiative-slug>-<milestone-id>.md
.kai/state/threads/<initiative-slug>-<milestone-id>.md
.kai/state/initiatives/INDEX.md
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
  id: <workspace_id from manifest>
  storage_mode: <external|repo-local|shared>
  root: <"." for repo-local/shared | runtime absolute workspace root for external>
  project: <project id from manifest>
  project_root: <"." for repo-local/shared | runtime absolute project root for external>
  publication_root: <project publication_root from manifest>
  run_root: <".kai/runs" for repo-local/shared | absolute external run root>
  manifest: <".kai/manifest.json" for repo-local/shared | absolute external manifest>
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
proposal_channel: .kai/state/initiatives/<slug>/backlog.md
created: <YYYY-MM-DD>
owner: <concrete role name | operator>
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

Never persist clone-specific absolute paths in `repo-local` or `shared` state.
Resolve them at runtime for dispatch packets. Absolute paths are permitted only
inside an external private workspace.

Each initial work item is a `proposed` **planning** item, references exactly one
milestone, names an initial `next_role`, and includes outcome + acceptance.
Set `required_for_milestone: false`; planning artifacts do not prove product
delivery. Leave the milestone's `required_items` empty until the steward
accepts an engineering decomposition. Dependencies name the upstream item and
required state. Do not invent detailed delivery items when a supplied
decomposition/engineering `pr-sizing` pass or an `eng-lead-architecture`
decision is needed.

Exception for directly requested bounded knowledge work: first consume
sufficient supplied scoped evidence and a brief or inline outcome accepted by
the item's declared `scope_authority` — the operator or an explicitly
authorized role. Neither a current product map nor a full PM-produced document
is required. Seed a `proposed` `creative-lead-design` item when that accepted
outcome clearly requires interaction design; the designer item depends on the
accepted scoped input directly, not on completed map or PM artifacts.

If a missing decision-relevant fact prevents the decision, record only that
specific unanswered fact as a bounded evidence gap and route its question to
the addressed real role. Only when that gap requires new product discovery may
intake optionally seed a `proposed` `workflow-product-explore` item, and only
when the role is actually available and the item's authorized scope permits
the dispatch. Do not seed a PM `BRIEF` knowledge item as a prerequisite.
Optional producer dispatch never substitutes for missing scope or completion
approval. The designer item always requires its declared
`completion_authority` (a concrete role or `operator`, distinct from the
producing designer — the designer never accepts its own design) with kind
`product-design-acceptance` review. None becomes `ready` or
milestone-required until the steward approves it, and a missing approval is
never an implicit waiver.

Set canonical artifact targets automatically:

- product exploration:
  `.kai/state/initiatives/<slug>/artifacts/product-map.md`;
- product marketing intelligence (bundle directory):
  `.kai/state/initiatives/<slug>/artifacts/marketing/`;
- content / creative pack (bundle directory):
  `.kai/state/initiatives/<slug>/artifacts/content/<item-id>/`;
- de-identified customer-success signal:
  `.kai/state/initiatives/<slug>/artifacts/customer-success/<item-id>.md`;
- de-identified support signal:
  `.kai/state/initiatives/<slug>/artifacts/support/<item-id>.md`;
- de-identified customer-feedback signal:
  `.kai/state/initiatives/<slug>/artifacts/feedback/<item-id>.md`;
- growth diagnosis / experiment brief:
  `.kai/state/initiatives/<slug>/artifacts/growth/<item-id>.md`;
- analytics metric contract / readout:
  `.kai/state/initiatives/<slug>/artifacts/analytics/<item-id>.md`;
- experiment integrity certificate:
  `.kai/state/initiatives/<slug>/artifacts/experiments/<item-id>.md`;
- pricing / packaging brief:
  `.kai/state/initiatives/<slug>/artifacts/pricing/<item-id>.md`;
- de-identified sales / deal brief:
  `.kai/state/initiatives/<slug>/artifacts/sales/<item-id>.md`;
- sanitized pre-sale solution / POC brief:
  `.kai/state/initiatives/<slug>/artifacts/solutions/<item-id>.md`;
- sanitized security assessment / control brief:
  `.kai/state/initiatives/<slug>/artifacts/security/<item-id>.md`;
- sanitized reliability assessment / SLO brief:
  `.kai/state/initiatives/<slug>/artifacts/reliability/<item-id>.md`;
- sanitized incident record:
  `.kai/state/initiatives/<slug>/artifacts/incidents/<item-id>.md`;
- sanitized privacy/compliance assessment:
  `.kai/state/initiatives/<slug>/artifacts/compliance/<item-id>.md`;
- PM brief:
  `.kai/state/initiatives/<slug>/artifacts/briefs/<item-id>.md`;
- research:
  `.kai/state/initiatives/<slug>/artifacts/research/<item-id>.md`;
- product design:
  `.kai/state/initiatives/<slug>/artifacts/designs/<item-id>.md`;
- technical writing / docs artifact:
  `.kai/state/initiatives/<slug>/artifacts/docs/<item-id>.md`;
- revenue-operations metric model / forecast brief:
  `.kai/state/initiatives/<slug>/artifacts/revops/<item-id>.md`;
- demand-generation campaign plan:
  `.kai/state/initiatives/<slug>/artifacts/campaigns/<item-id>.md`;
- de-identified partnership brief:
  `.kai/state/initiatives/<slug>/artifacts/partnerships/<item-id>.md`;
- localization readiness / locale-QA report:
  `.kai/state/initiatives/<slug>/artifacts/localization/<item-id>.md`;
- data-engineering design / data contract:
  `.kai/state/initiatives/<slug>/artifacts/data-engineering/<item-id>.md`;
- brand / visual-identity system:
  `.kai/state/initiatives/<slug>/artifacts/brand/<item-id>.md`;
- initiative decision:
  `.kai/state/initiatives/<slug>/artifacts/decisions/<item-id>.md`.

An operator override for private working material must remain within the
resolved workspace. A public target must stay inside the selected project and
is recorded as
`project:<project-id>:<publication-root-relative-path>`. Missing initiative
ownership, target project, or artifact type is a real decision boundary; a
normal product map, brief, research, design, or decision is not.

## Workflow

1. Resolve and confirm the target workspace, onboard it with
   `workflow-workspace-init` when needed.
   Load `kai-core-workspace-initiative` before inspecting the initiative index,
   then reject duplicate/conflicting slugs.
2. Draft the thin core and milestones.
3. Present the scope boundary and success measures for operator confirmation.
4. Invoke `kai-core-work-acting` before writing durable state, then create the
   initiative through the runtime with an `initiative.create` command, write the
   authored initiative files with `status: proposed`, seed
   `deliverables.md`, and add the initiative to `.kai/state/initiatives/INDEX.md`.
5. Load `kai-core-work-item` before seeding item records, then seed proposed
   planning items with `item.create` commands. They live in the runtime store —
   read them with `status` and `detail`, and author no Markdown under
   `.kai/state/items/` or `.kai/state/threads/`. Do not count them as
   milestone-completion items.
6. Append the creation entry to `log.md`.
7. Load `kai-core-operating-rules` before handing work to another role, then
   hand off to the initiative's declared `owner` as steward — a concrete role
   or `operator` confirmed during intake, never a compulsory hard-coded
   default:
   - confirm mission/scope/non-negotiables;
   - accept or revise milestones;
   - set `status: active` and update `.kai/state/ACTIVE.md`;
   - approve an explicit non-empty typed `required_items` mapping after
     decomposition (`completed` for research/decision outputs, `shipped` for
     production changes);
   - prioritize and promote executable items to `ready` with `item.promote`;
   - preserve the role boundary: the design item's declared
     `completion_authority` accepts the exact revision, never the producing
     designer itself, before engineering proceeds on interaction-design work;
     a PM brief or product map may be supporting supplied evidence but neither
     is required, no compulsory producer chain re-derives them, and a genuinely
     missing decision-relevant fact remains a bounded gap, not a waived
     approval.
8. Apply `kai-core-work-activity` before the handoff, then after steward
   approval hand off to `director-chief-of-staff`.
   Resolve project-relative metadata to runtime absolute paths and include the
   exact workspace root, project root, manifest path, and deliverables path.

## Hard rules

1. Milestones are observable outcomes with stable IDs, not broad themes.
2. Every active milestone has acceptance and success evidence.
3. Initial items remain `proposed`; this workflow cannot approve its own scope.
4. Do not start implementation.
5. Preserve existing initiatives; never overwrite or silently reactivate one.
6. One initiative uses one workspace root and one target project binding.
   Every peer receives both exact roots.
7. A durable external initiative requires a registered project/workspace pair;
   no hidden/session fallback is allowed.

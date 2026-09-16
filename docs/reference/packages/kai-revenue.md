# kai-revenue

Pre-release / in progress source. This package is not part of the default marketplace surface; see [package availability](../package-availability.md).

Sales, pricing, partnerships, revenue operations, customer success, support intake,
and pre-sales solution fit over kai-core.

The supported baseline is **kai-core plus kai-revenue**. Supply account, deal,
cost, WTP, partner, billing, usage, customer or ticket evidence directly.
Marketing, product, engineering, assistant and a director are not prerequisite
installs or compulsory agent calls. Missing facts narrow the answer or become
an explicit pending question; they never become invented data or simulated
specialist approval. A bounded direct response needs no workspace or team item.

This note describes inspected source and generated artifacts, not a published
release or proven live-host compatibility. The current checkout prepares
`10.0.0`; install/update commands require a source containing this refactor.

## Ownership and retirement

These six unchanged IDs previously moved from `plugins/kai-gtm/agents/` to
`plugins/kai-revenue/agents/`:

| Role | Supplied input → bounded output | Preserved and redesigned obligations |
| --- | --- | --- |
| `principal-sales` | Account/deal notes, approved policy, positioning and solution evidence → qualification, discovery, strategy, objection response, proposal outline, forecast review or win/loss brief | Seven modes, qualification frame, ten-part deal quality bar, five recommendations. Buyer/process/champion/competition evidence and deal-level forecast integrity stay inline. Apply approved price/discount policy; exceptions need pricing and human acceptance. No invented intent, references, stages, capabilities or technical verdicts; no prospect contact, quote issuance or CRM action. |
| `principal-pricing-monetization` | Cost, WTP, segment, competitor and analytical evidence → model, packaging, price-change, discount-policy, experiment or WTP brief | Six modes, ten-part pricing quality bar, analytics-request packet and five recommendations. Preserve value metric, floor/ceiling, fences, migration, grandfathering, notice, cannibalization, reversibility and fairness. Pricing judgment is not live price/contract authority; no dark patterns, surveillance/protected-trait discrimination or fabricated elasticity. |
| `principal-partnerships` | Partner facts, supplied technical verdicts, policy and performance evidence → strategy, fit, integration-partnership, channel, co-sell/co-marketing or diagnosis brief | Six modes, mutual-value/fit/economics/exit analysis and five recommendations. Technical feasibility can remain pending while strategic fit is assessed. Propose economics; pricing owns policy, revops models impact, human/counsel own commitments and terms. No fabricated traction, promised integration, outbound partner contact, legal drafting or signing. |
| `principal-revenue-operations` | Pipeline, billing, finance, usage, definitions and analysis → metric operating model, forecast process, hygiene, billing-ops, quota/territory/comp inputs or diagnosis | Six modes, ten-part quality bar and five recommendations. Keep canonical metric definitions and causal status, expose assumptions/sensitivity and source reconciliation. Missing values are not zero; projections are not actuals. Distinguish bookings, cash, recognized revenue and run rate; unresolved accounting/tax judgments stay with finance/counsel. No per-deal call, price setting, billing/CRM mutation, financial certification, compensation payment or spend. |
| `principal-customer-success` | Goals, usage, support history, stakeholder notes and explicit commercial context → success/adoption/recovery plan, health/QBR/renewal brief or portfolio review | Six modes, five health verdicts and six independently assessed health dimensions. Evidence IDs, source/date/alias, inference confidence and aggregation safety remain inline. Outcomes, not activity, drive plans; unknown is valid and scores require a supplied explicit model. Preserve product-signal and communication-brief scaffolds, privacy overrides and no customer commitments/contact. Personal voice is optional, never a required assistant handoff. |
| `workflow-support-triage` | Bounded ticket/transcript/queue snapshot → classification, urgency, duplicate clusters, evidence gaps, owner routes and optional sanitized pattern | Four modes, nine classes, four impact-based urgency levels, fingerprint/confidence deduplication and two report scaffolds. Safety screening precedes normalization, file setup and batch completion. Preserve reporter-claimed versus reproduced evidence. An urgent candidate is not a confirmed incident, SEV, root cause or resolution; no replies, closures, refunds, production commands or monitoring service. |

The seventh role, `principal-solutions-architect`, moved from engineering in
`10.0.0`. It retains pre-sales discovery, solution fit, integration feasibility,
POC scope, technical objections and grounded questionnaire drafting. Its source
is preserved rather than duplicated; cross-agent references inside that role
remain part of the deferred engineering-wiring migration.

Revenue owns **zero standalone local skills**, zero skill companions and zero
runtime dependencies. The actual domain procedures remain in the agent bodies.
There is no filler skill, empty-directory marker, compatibility alias or redirect
package. `revenue: []` is registered in `NEW_AGENT_IDS` and
`PACK_RUNTIME_DEPENDENCIES`; the six IDs are registered in the current migration
ownership map. No skill-owner override is needed.

The retired gtm ownership/new-agent/runtime keys and marketplace entry are gone.
Its three tracked generated files (`plugin.json`, `package.json`,
`package-lock.json`) are removed. The pre-retirement inventory contained exactly
six agents and those three manifests: no tracked generated scripts or local
skill source remained. Only the inspected empty directory remnants were removed,
using non-recursive empty-directory deletion; no unrelated, ignored/private or
user file was removed.

Prior creative, product, marketing, assistant and engineering ownership remains
intact. Marketing owns the two former gtm methods; growth is product-owned.
Catalog grouping places the six original revenue roles together and identifies
solutions architecture as revenue-owned. Live install examples and onboarding's pack
table name revenue rather than the retired package; this is not a host migration.

## Empty local component semantics

The only manifest-emitter behavior change in `planManifests` is:

```js
if (skills.length) manifest.skills = 'skills';
```

The `skills` array is the pack's owned local skill inventory (core uses its own
inventory). A nonempty array still emits `"skills": "skills"`. An empty array
omits the property entirely; it is not emitted as null, an empty path or a path
to a nonexistent directory. The existing conditional `agents` behavior is
unchanged.

The emitted revenue manifest contains name, version, the canonical description
and `"agents": "agents"`, with no `skills` property or local skills directory.
Its package and lock manifests declare empty dependencies. Core skills remain
globally available through the required core-plus-revenue install; omission of
an absent local component does not disable shared core access.

No policy validator, naming rule, fixture or dependency was changed to make this
shape pass a check. In particular, the older `gtm` naming-family mapping and
historical test expectations remain for the later policy/CI consolidation;
they are not an install entry or a compatibility alias.

## Evidence, privacy and authority

All roles distinguish observations, attributed customer/operator statements,
supplied analytical conclusions, hypotheses, inference and unknowns. Analytical
evidence retains its author, method, source, window, uncertainty and causal
status; it need not come from an installed Kai analytics agent. Supplied
analysis is not automatic independent sign-off. Qualified technical verdicts
can be cited; missing verdicts remain pending. Benchmarks are context, not
proof of this business's outcomes.

Response-only work returns the same domain sections inline and marks absent
Workspace/Brief/Report paths as `not created — response only`. It neither
fabricates a durable path nor claims an actual handoff, approval or execution.
Live customer/account access is never implied by a tool grant or plugin install.
Private terms, margins, account data and identifiers stay out of public queries.

Existing path conventions remain unchanged:

| Role | Private full run | Sanitized initiative artifact |
| --- | --- | --- |
| Sales | `.kai/runs/revenue/<date>/<NN>-sales-<target>/deal-brief.md` | `sales/<item-id>.md` |
| Pricing | `.kai/runs/product/<date>/<NN>-pricing-<target>/pricing-brief.md` | `pricing/<item-id>.md` |
| Partnerships | `.kai/runs/revenue/<date>/<NN>-partnerships-<target>/partner-brief.md` | `partnerships/<item-id>.md` |
| RevOps | `.kai/runs/revenue/<date>/<NN>-revops-<target>/revops-brief.md` | `revops/<item-id>.md` |
| Customer success | `.kai/runs/product/<date>/<NN>-customer-success-<alias>/customer-success-review.md` | `customer-success/<item-id>.md` |
| Support | `.kai/runs/support/<date>/<NN>-triage-<queue-or-product>/triage.md` | `support/<item-id>.md` |

Initiative paths are relative to
`.kai/state/initiatives/<slug>/artifacts/`. Raw account/customer evidence stays
in ignored runs. Customer-success/support account-specific durable work uses a
local target only with a recorded operator-approved privacy override. Separate
sanitized signals exclude account aliases, contacts, commercial dates/values,
raw source paths, ticket text and confidential usage. Generic success playbooks
require exact-revision acceptance, provenance and explicit publication approval;
account dossiers never become public knowledge.

Human acceptance remains required for commercial terms, price execution,
discount exceptions, contracts, compensation, external contact, publication and
spend. Product scope, technical feasibility, legal approval and incident/security
response remain outside revenue. These are real boundaries, not mandatory
sibling-install chains for a supplied-evidence answer.

## Task-local core routes and durable work

All six remove eager inheritance, bulk-load prose, managed guards and retired
core IDs. Each loads `kai-core-contract-v1` immediately before its first shared
rule and states a concrete bounded fallback in that paragraph. Without compatible
core, supplied-evidence analysis may continue, but coordinated `.kai` writes,
leases and approval records may not; install/update core before coordinating.

Workspace paths and matching initiative context load when reading state or
saving output. Asset production loads before creating/revising an artifact.
Granted work loads the acting contract: latest HANDOFF, context artifacts,
acceptance, dependencies, touches, and holder/token/version verification before
every state-changing write; collision means stop. Item schema and activity
start/progress/stop routes remain explicit. No revenue role gains grant,
promotion or dispatch authority.

Peer questions load the communication contract only when a real exchange is
needed; load-bearing answers persist on the granted item's thread. Scope
proposals load scope discipline at the proposal action. Customer-success health
assessment and support triage explicitly load no-self-remediation; findings do
not authorize target repair or a patch laundered through another role.

Saved outputs load asset closing before the run ends: scope, grounding,
independent exact-revision acceptance, disposition, validity owner, revalidation
and revision/supersession history. Pending acceptance remains provisional.
Granted runs update item/evidence/version/next role/lease, stop activity, append
an exact-path HANDOFF and update initiative deliverables. Knowledge completion
never means a deal closed, price changed, renewal executed, ticket resolved or
production `shipped`.

## Representative direct tasks — not executed

| Request | Bounded result | Boundary |
| --- | --- | --- |
| Qualify this supplied opportunity and approved discount envelope. | Qualification gaps, commercial envelope, risks and next actions. | No invented buyer intent, quote issuance or mandatory marketing/SA call. |
| Compare these cost/WTP-backed packages and migration options. | Value metric, ranges, fences, fairness, sensitivity and decision owner. | No elasticity invention, legal certification or live price change. |
| Assess this proposed partner's supplied evidence. | Strategic fit, mutual value, economics questions and exit path. | Pending feasibility is explicit; no partner contact or signed terms. |
| Review this pipeline/billing snapshot and defined metrics. | Source-reconciled rollup/process critique, scenarios and unknowns. | Not measured causal impact, financial reporting or billing execution. |
| Review this account's adoption and renewal risks. | Evidence-backed health dimensions and outcome milestones. | Unknown scores/intent remain unknown; no account data in a team signal. |
| Triage these tickets, including possible data exposure. | Immediate urgent sanitized escalation packet, then bounded classifications. | If owner/transport is absent, report `handoff: not delivered` and direct the operator to their human incident/security channel now; never claim mitigation or resolution. |

## Generation evidence and limits

The following results record the package unit before the `7.0.0` integration
batch; they are not a new runtime or policy validation claim.

The authorized generation sequence completed with exit code 0:

```powershell
node scripts\host-contract.mjs --update
npm run docs:generate
npm run pack-preview -- --write
git diff --check
```

Host inventory reports 56 agents and 57 skills; the golden inventory is unchanged.
Catalog generation updates the six role paths and revenue grouping. Pack emission
writes 42 derived files and changes zero managed agent regions. Revenue has six
agent files and three generated manifests, no local skill or helper directory.
Generated core catalog/pack-plan copies are outputs, not core operating redesign.

Raw inventory, source routes, manifests and diffs were inspected. These establish
source ownership and emitted component shape, not host execution or behavioral
validation. No tests, policy validators, installs, live account actions, network
audits, paid calls or dependency/version changes were performed.

**Runtime unverified:** core-plus-revenue discovery and skill loading,
absent-core fallback, actual evidence quality and privacy enforcement, forecast
arithmetic, peer transports, urgent escalation delivery, collision handling and
independent durable acceptance. Those require later authorized behavioral/safety
review; emission is not release publication.

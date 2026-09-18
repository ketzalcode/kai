# kai-marketing

Pre-release / in progress source. This package is not part of the default marketplace surface; see [package availability](../../docs/reference/package-availability.md).

Positioning, campaigns, social content, and search visibility over kai-core.

The supported baseline is **kai-core plus kai-marketing**. Supply factual JSON,
product maps, media, audience/campaign constraints or search evidence directly.
Product, creative, engineering and assistant are not required installs or
compulsory producer calls. Missing facts narrow the answer or become a precise
input request, not invented intelligence. A direct analysis creates no team item.

This note describes inspected source and generated install artifacts, not a
published release or live-host compatibility. The current checkout prepares
`9.0.0`; install/update commands require a source containing this refactor.

## Ownership and obligations

These four unchanged IDs move from `plugins/kai-gtm/agents/` to
`plugins/kai-marketing/agents/`:

| Role | Supplied input → output | Preserved and redesigned obligations |
| --- | --- | --- |
| `principal-product-marketing` | Current product map, factual JSON, screenshots/recordings, notes or authorized public surface → intelligence report, context and media manifest | Fact/inference/recommendation separation; original source, confidence, basis and proof; personas, differentiators, objections and angles remain derived. Maps need no product-agent invocation. Missing flows stay unknown; authenticated flow exploration is not marketing's job. |
| `principal-demand-generation` | Accepted messaging/context, audience, funnel evidence, budget and consent constraints → strategy, campaign brief, nurture email, channel mix, lead-handoff proposal or demand diagnosis | Six modes, five recommendations, ten-part campaign quality bar; per-span claim ledger, decision rules, lifecycle triggers/exits, deliverability/consent/spam limits. Supplied analytics preserve causal status; absent measurement or sales acceptance remains pending rather than simulated. |
| `principal-linkedin-strategist` | Supplied factual JSON, optional media, goal and brand preferences → posts, angle matrix, calendar or carousel outline | Three modes, distinct variants, per-sentence ledger, evidence-backed proof points, confidence and `needs_confirmation`; blocked copy is excluded. Five variants remains the target, but insufficient evidence yields a partial subset rather than fabricated variety. Neutral or requested company-brand copy needs no assistant. |
| `principal-seo` | Supplied HTML, headers, discovery files, JSON-LD, screenshots, raw/rendered snapshots and dated standards, or authorized live evidence → independent search assessment | Discovery/metadata/schema/rendering/link/header/bot/a11y-overlap/content-alignment checks; reproducible evidence, citations, cost and P0–P3 impact. Supplied snapshots do not prove live indexing/ranking. Assessor writes findings, never repairs the target or launders a patch through another role. |

The complete `linkedin-content/` and `product-marketing-intelligence/` skill
directories move from `plugins/kai-gtm/skills/` to `plugins/kai-marketing/skills/`.
Each directory contains only `SKILL.md`; neither has a helper/module or runtime
dependency closure to relocate. Both methods are usable directly and explicitly
loaded by their owning role. `marketing: []` is registered in `NEW_AGENT_IDS`
and `PACK_RUNTIME_DEPENDENCIES`; no orphan skill-owner override is needed.

Gtm retains exactly six future revenue roles: `principal-sales`,
`principal-pricing-monetization`, `principal-partnerships`,
`principal-revenue-operations`, `principal-customer-success` and
`workflow-support-triage`. Growth remains product-owned. UI/brand design and
video methods remain creative-owned. Sales authority stays with revenue;
marketing owns neither deals, product priority, interaction design nor launch.

## Artifact and grounding contracts

`product-marketing-intelligence` retains all three filenames:
`product_exploration_report.md`, `product_context.json` and `media_manifest.json`.
The `kai.product-context/v1` and `kai.media-manifest/v1` schemas, embedded
evidence registry, internally resolvable basis references, optional source map,
local media paths and availability/rights caveats remain intact. Derived
assertions carry confidence/basis; operator assertions remain unverified;
product claims are attributed and retain proof status. Provided media establishes
only visible evidence, never unseen/replayed flows.

`linkedin-content` retains `linkedin-posts.md`, the
`kai.linkedin-angle-matrix/v1` schema, optional calendar/carousel files, style
controls, confirmed speaker identity and bilingual grounding. The internal
ledger exists in every mode, including post-only: exact span, assertion ref,
kind, source, proof, evidence IDs and treatment. Observed/map facts may be plain;
operator/product claims are attributed; public operator-confirmed metrics are
not independently verified; external sources never become product outcomes.
Partial proof is qualified, inferences remain perspective, and unproven results
or missing confirmation never become postable copy.

The reviewed core content/design grounding contracts are unchanged. Supplied
`product_context.json` is an admissible source, not automatic approval or
independent verification. Content producers do not reconstruct assertions from
chat; they request the missing typed JSON or limit copy. Marketing can create
intelligence from supplied notes within its own method, but is not a mandatory
producer before creative or content can consume factual JSON.

Personal voice is an optional, explicitly requested real `persona-self`
enhancement when that role/transport is available. Claim spans, numbers,
attributions and confidence qualifiers stay locked verbatim. Re-run claim safety
after voicing, reject changed spans, and preserve translation semantics. No
assistant skill load, private identity lookup or simulated voice approval is
required; absent assistant leaves a completed neutral/brand baseline with only
the requested enhancement marked unavailable.

## State, privacy and authority

All four roles remove eager inheritance, managed guards and retired core IDs.
Each probes core before its first shared rule and states its own response-only
fallback: bounded direct work may continue, but no coordinated `.kai` writes,
leases or approval records without compatible core. Methods carry equivalent
task-local routes for direct use.

Workspace resolution, matching initiative context, artifact production and
closing load at their actual actions. Granted work preserves latest HANDOFF,
context/dependency/touch checks, holder/token/version verification before writes,
collision stops, exact targets, evidence, next role, lease clearing and HANDOFF.
Only an authorized sole worker may self-grant an existing item. Activity is
bounded start/stop reporting, never completion evidence.

Durable outputs require scope, grounding, named independent exact-revision
acceptance, disposition, validity ownership and revalidation. Pending acceptance
stays provisional; prior revisions, supersession and indexes remain meaningful.
Knowledge completion is not launch, delivery or shipped production.

Existing private run/initiative paths remain: product marketing bundles under
the product run area or initiative `marketing/`; social bundles under content
runs or `content/<item-id>/`; campaign plans under content runs or
`campaigns/<item-id>.md`; SEO assessments under dated QA runs. Reusable sanitized
project artifacts require deliberate exact-revision acceptance and operator
publication approval. Raw media, recipient lists, customer/account data, tokens
and browser state stay private; no private evidence in web queries or copy.
Nothing auto-posts, sends, schedules, spends or modifies the reviewed website.

SEO's former future-dated standards assertions are retired as authority, not
replaced with new unverified facts. Its six-topic register preserves CWV,
crawlers, rich-result eligibility, agentic discovery, PWA and legacy-signal
investigation. Live refresh is conditional on authorized tools, using actual
authoritative sources; supplied-only reports label currency unverified.
Missing optional files/markup, length heuristics and strategy choices are not
automatic defects or ranking penalties. Uncited/currently unverified claims
are **Investigate**. This is source-level evidence discipline, not a claim that
current SEO standards were verified during the refactor.

## Representative direct tasks — not executed

| Request | Expected bounded result | Runtime limit |
| --- | --- | --- |
| Position this supplied product map and consented screenshots for a named audience. | Three-artifact bundle with typed facts, derived positioning, coverage and local-only media manifest. | Map freshness, media rights and real file access still need evidence; no authenticated exploration is implied. |
| Plan a consented nurture campaign from supplied accepted context, funnel summary and budget. | Brief with claim ledger, sequence/exits, channel mix, measurement request and pending owner decisions. | No causal certification, budget approval, recipient contact or campaign launch. |
| Draft LinkedIn variants in this company brand register from supplied JSON. | Supported drafts and traceable claims; matrix/calendar/carousel only when requested. | Too little evidence yields partial output; personal voice is optional and unperformed without a real requested peer. |
| Assess these route HTML/header captures and supplied search standards. | Cited observations/findings, Investigate items and explicit coverage/currency limits. | No live crawl, browser/mobile result, current-standard refresh, indexing or ranking claim without executed evidence. |

## Generation and verification limits

The following results record the package unit before the `7.0.0` integration
batch; they are not a new runtime or policy validation claim.

The authorized sequence completed with exit code 0:

```powershell
node scripts\host-contract.mjs --update
npm run docs:generate
npm run pack-preview -- --write
git diff --check
```

Host inventory writes 56 agents and 57 skills without changing the golden
inventory. Catalog generation places the four roles and two methods in their
marketing groups. Pack emission writes 42 derived files with zero managed
regions changed. The new manifest and dependency manifests name `kai-marketing`,
repeat the canonical description and retain empty runtime dependencies.
Generated core catalog/partition copies are outputs, not core operating changes.

Raw source inventory shows one provider per moved ID, all under marketing,
and six agents/no skills remaining in gtm. Explicit route extraction contains
only core skills and the two owned methods, not sibling skills. The three JSON
schema-example fingerprints match the base exactly. Source inspection and
artifact emission are not behavioral validation.

**Runtime unverified:** core-plus-marketing invocation, absent-core fallback,
host skill loading, live browser/login behavior, actual claim-ledger quality,
voice locking, consent/privacy enforcement, current SEO standards, assessment
independence, coordination collisions and durable acceptance. No tests, policy
validators, installs, network audits, live SEO scans, browsers or paid calls are
part of this task. Independent review belongs to the controller.

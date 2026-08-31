---
name: product-marketing-intelligence
description: "Builds durable product marketing intelligence. Use when product surfaces, media, notes, or product maps must feed downstream content or creative work."
tools: [playwright, execute, read, edit, search, ask_user, web]
---

> **Requires a Playwright MCP server** registered under the key `playwright` in your host's MCP config (see `docs/getting-started.md` → "Browser automation setup"). Without it, the browser steps here cannot run.

# Product Marketing Intelligence

This skill turns a product surface into a **reusable understanding of what the
product does, who it serves, and what assets exist** — packaged so any content,
campaign, or creative agent can pick it up cold, without re-asking the operator
to re-explain the product.

It is the marketing-intelligence layer that sits **on top of** neutral product
facts. `product-exploration` answers *"how does this product work?"* (neutral
navigation). This skill answers *"what is this product, who is it for, how would
we position it, and what can we make from it?"* — and it keeps those two layers
strictly separated.

It is **not** invoked directly by the user. `principal-product-marketing`
executes it; downstream agents consume its artifacts.

## Product-agnostic by contract

This method carries **no** assumptions about any specific product. The subject —
what the product is, its stage, its audience — comes from the operator or from
the surfaces inspected at invocation. Never bake in a named product's features,
personas, or claims. A specific product may appear only as *provided input* or
*observed evidence*, never as a built-in default.

## Fact vs. inference vs. recommendation

The entire value of this layer is that it is honest about what is known. Every
substantive assertion — in the report and the JSON — carries three axes plus a
basis:

- **`kind`** — `fact` (something true about the product surface), `inference`
  (the analyst's reading: a persona, differentiator, objection), or
  `recommendation` (a suggested positioning angle or content opportunity).
- **`source`** — where it came from: `observed` (seen live by the analyst),
  `operator-provided` (asserted by the operator; unverified), `product-claim`
  (the product says it about itself), or `external` (a cited third party).
  Inferences and recommendations use `source: analyst`.
- **`confidence`** — `high | medium | low`, required on every `inference` and
  `recommendation`.
- **`basis`** — for every `inference`/`recommendation`, the evidence/fact IDs it
  rests on, all resolvable **inside `product_context.json` itself**.

Two rules follow and are non-negotiable:

1. A **product's self-description is a `fact` with `source: product-claim`**,
   recorded as *"the product claims X"* — never as verified truth. Its separate
   proof status says whether anything backs it.
2. Personas, differentiators, objections, positioning angles, and content ideas
   are **never `kind: fact`**. They are `inference` or `recommendation`, with
   confidence and basis. Nothing lets an inference be laundered into a fact.

Provided input is not second-class: a feature, flow, persona, or claim the
operator supplies is recorded with `source: operator-provided` and is usable —
it is simply marked unverified, never dropped.

## Intake modes

Support whatever the operator can supply; degrade gracefully and record what was
not inspectable. Prefer reusing existing facts over rediscovering them.

| Mode | Source | How |
|---|---|---|
| **A · Existing map** | a current `.kai/state/initiatives/<slug>/artifacts/product-map.md` | consume its observed facts directly; cite, do not re-walk |
| **B · Public marketing surface** | a public landing, pricing, or marketing URL | walk it read-only via `kai-core-web-evaluation`; harvest copy via `kai-core-web-content-extraction` — marketing surfaces only |
| **C · Provided media** | screenshots, screen recordings, uploaded assets | copy into the run media folder and catalog into `media_manifest.json`; extract facts from what is visible |
| **D · Notes only** | operator product notes | record as `source: operator-provided`; verify nothing, flag as unverified |

Modes compose (a map plus a landing page plus operator notes is common). When a
private/auth-gated area cannot be inspected, record it as an explicit unknown in
`coverage.not_inspectable` — never infer flow details you could not see. Optional
public competitive/category context uses `web_search`/`web_fetch`, cited, and
typed `source: external`.

### Stay out of the explorer's lane

Deep, interactive, or authenticated **product-flow** facts are owned by
`workflow-product-explore` and its `product-map.md`. This method **consumes** the
map (mode A) for those flows; it does not re-walk authenticated app journeys to
originate flow facts. If interactive flows matter and no current map exists,
route a mapping item to `workflow-product-explore` rather than mapping them here.
Direct inspection here is for **public marketing surfaces, provided media, and
notes** — plus reading what a map already established.

## Safe intake boundaries

- Read-only. Never submit payment, delete, publish, invite, message, or perform
  any irreversible action to "explore" a flow.
- Use the `kai-core-web-evaluation` login-pause pattern; keep cookies, tokens, and
  `storageState*.json` local and unindexed.
- Every media asset is **copied into**
  `.kai/runs/product/<YYYY-MM-DD>/<NN>-marketing-<target-slug>/media/` and referenced by a
  workspace-root-relative path. Never persist an external absolute path or a
  session-upload location, and never inline heavy binaries into the committed
  artifacts.

## Artifacts

Three artifacts, always produced together, forming the downstream contract. Use
these **exact filenames** (as named in issues #2–#4) so consuming agents find
them without chat context:

- `product_exploration_report.md` — human narrative;
- `product_context.json` — the primary machine contract;
- `media_manifest.json` — reusable assets.

### 1. `product_exploration_report.md` (human)

Group assertions under fact / inference / recommendation headings, and tag each
bullet inline with `[kind · source · confidence]` so the separation survives a
skim.

```markdown
# Product Exploration Report — <target>

## Provenance & coverage
- target · inspected-via modes A–D · explored <local time> · run: principal-product-marketing
- inspected surfaces / not-inspectable areas (auth-gated, private, unavailable)
- source map: <product-map.md path or "none">

## Observed facts            (kind: fact)
- product summary, feature inventory, core flows, product claims —
  each `[source · evidence-id]`

## Inferred reading          (kind: inference · confidence · basis)
- main user problem, target personas, value propositions, differentiators,
  likely objections

## Recommended angles        (kind: recommendation · confidence · basis)
- positioning angles, content opportunities (feed content/creative agents)

## Open questions & assumptions
```

The report is a readable view. **Nothing load-bearing lives only here** — every
fact, inference, asset, and basis also exists in the JSON.

### 2. `product_context.json` (machine — the standalone contract)

Self-contained: every `basis` and evidence reference resolves **inside this
file** via the embedded `evidence` registry. `source_map` is optional
provenance, never a required second file.

```json
{
  "schema": "kai.product-context/v1",
  "target": "<product name or URL>",
  "generated": "<YYYY-MM-DD HH:MM local>",
  "generated_by": "principal-product-marketing",
  "run": { "modes": ["A","B","C","D"], "status": "complete|partial", "source_map": "<path or null>" },
  "coverage": { "inspected": ["<surface>"], "not_inspectable": [ { "area": "", "reason": "" } ] },
  "evidence": [
    { "id": "e-001", "type": "screenshot|copy|map-fact|note|external", "ref": "<media id | URL | product-map anchor | 'operator note'>", "captured": "<ts or n/a>" }
  ],
  "product": {
    "name":     { "value": "", "kind": "fact", "source": "observed|operator-provided|product-claim", "basis": ["e-001"] },
    "category": { "value": "", "kind": "fact|inference", "source": "", "confidence": "medium", "basis": [] },
    "stage":    { "value": "", "kind": "inference", "source": "analyst", "confidence": "low", "basis": [] },
    "summary":  { "value": "", "kind": "fact", "source": "", "basis": [] },
    "main_user_problem": { "value": "", "kind": "inference", "source": "analyst", "confidence": "medium", "basis": [] }
  },
  "personas":       [ { "id": "p-1", "name": "", "jobs": [""], "pains": [""], "kind": "inference", "confidence": "medium", "basis": ["e-001"] } ],
  "value_propositions": [ { "id": "v-1", "text": "", "persona_id": "p-1", "kind": "inference", "confidence": "medium", "basis": [] } ],
  "features":       [ { "id": "f-1", "name": "", "description": "", "kind": "fact", "source": "observed|operator-provided", "basis": ["e-001"] } ],
  "flows":          [ { "id": "fl-1", "name": "", "steps": [""], "kind": "fact", "source": "observed|map-fact|operator-provided", "basis": ["e-001"] } ],
  "claims":         [ { "id": "c-1", "text": "", "kind": "fact", "source": "product-claim", "proof": { "status": "proven|partial|unproven", "evidence": ["e-001"] } } ],
  "differentiators":[ { "id": "d-1", "text": "", "kind": "inference", "confidence": "medium", "basis": ["c-1","f-1"] } ],
  "objections":     [ { "id": "o-1", "text": "", "kind": "inference", "confidence": "medium", "basis": [] } ],
  "content_angles": [ { "id": "a-1", "angle": "", "persona_id": "p-1", "platform_hint": "", "kind": "recommendation", "confidence": "medium", "basis": ["v-1","d-1"] } ],
  "constraints":    [ { "text": "", "source": "operator-provided|observed" } ],
  "assumptions":    [ { "text": "", "confidence": "low" } ],
  "open_questions": [ "" ]
}
```

Every derived item (`inference`/`recommendation`) carries `confidence` and a
`basis` of evidence/fact IDs defined in the same file. Downstream agents may
filter on `kind`/`confidence` and trace any angle back to its facts for claim
safety — with no access to the original chat and no third file required.

### 3. `media_manifest.json` (assets for downstream reuse)

```json
{
  "schema": "kai.media-manifest/v1",
  "target": "<product name or URL>",
  "generated": "<YYYY-MM-DD HH:MM local>",
  "assets": [
    {
      "id": "m-001",
      "type": "screenshot|screen-recording|uploaded-image|uploaded-video|logo|other",
      "workspace_path": "<workspace-root-relative path under .kai/runs/.../media/>",
      "availability": "local-only",
      "source_uri": "<capture URL/step or 'operator-provided'>",
      "captured": "<YYYY-MM-DD-HHMM or n/a>",
      "shows": "<what surface/state it depicts — kind: fact>",
      "suggested_use": ["<hero image, demo clip, carousel frame — kind: recommendation>"],
      "notes": "<downstream guidance, rights/consent caveats>"
    }
  ]
}
```

Media handling rules:

- Every asset is **copied into** the run media folder and referenced by a
  **workspace-root-relative** `workspace_path`. Never persist an external
  absolute path or a session-upload location.
- `availability: local-only` is honest: `.kai/runs/` is ignored, so assets do
  not travel with a commit. A downstream agent in another checkout re-captures or
  requests them; the manifest states exactly what and from where.
- Heavy binaries are never inlined into the committed artifacts.

## Placement

Resolve the workspace via `kai-core-workspace-conventions`.

- **Initiative work:** the three artifacts live in the bundle directory
  `.kai/state/initiatives/<slug>/artifacts/marketing/`. The work item's
  `artifact_targets` contains that **directory**; the three contract files (`product_exploration_report.md`,
  `product_context.json`, `media_manifest.json`) are its mandatory contents.
  Paths stay inside the recorded workspace. `delivery_class: knowledge` — it
  completes, it does not ship.
- **Unaffiliated one-off:** draft under
  `.kai/runs/product/<YYYY-MM-DD>/<NN>-marketing-<target-slug>/`, then publish
  the accepted curated set to
  `<project-root>/<publication-root>/investigations/<YYYY-MM-DD>/<NN>-marketing-<target-slug>/`
  (the same date-first publication path as `principal-product-strategist`). Durable
  frontmatter goes on the Markdown report/index only; the JSON files stay valid
  JSON and are indexed by the report and `deliverables.md`.
- **Media** always stays under `.kai/runs/.../media/` (ignored), referenced by
  `media_manifest.json`; never commit heavy binaries.

## Downstream consumption contract

A content, campaign, or creative agent must be able to run from
`product_context.json` + `media_manifest.json` **alone**, with no access to the
original chat and no third file. Therefore:

- the JSON is self-describing (`schema`, `target`, `kind`/`source`/`confidence`,
  embedded `evidence` registry);
- every `basis` resolves within `product_context.json`; `source_map` is optional
  provenance, not a dependency;
- nothing load-bearing lives only in the human report;
- every asset a downstream agent might reuse appears in the manifest with a
  workspace-relative path, an `availability`, and a `suggested_use`.

## Hard rules

1. **Product-agnostic.** No built-in product. The subject is the operator's; the
   method is yours.
2. **Type every assertion.** `kind` + `source` (+ `confidence`/`basis` for
   derived items) on everything substantive, in both report and JSON. Never
   launder an inference into a fact, or a product claim into truth.
3. **Uncertainty is explicit.** Confidence on every inference/recommendation; a
   named `not_inspectable` entry for every area you could not inspect; never
   invent a flow you did not see.
4. **Consume, don't duplicate, the map.** Interactive/authenticated product-flow
   facts come from `product-map.md` (or route to `workflow-product-explore`).
   Direct inspection is for public marketing surfaces, media, and notes.
5. **Read-only and safe.** No irreversible actions; no credentials or browser
   state in artifacts; media copied into ignored `.kai/runs/.../media/` and
   referenced by workspace-relative path.
6. **Both formats, every run,** using the exact contract filenames, consumable
   by downstream agents standalone.
7. **No distribution.** This method never posts, publishes, schedules, or sends
   anything; it produces intelligence, not campaigns, and edits no video.

## Output contract

Return:

```text
Marketing intelligence: <target> — <complete | partial>
Artifacts: <absolute product_exploration_report.md, product_context.json, media_manifest.json paths>
Modes used: <A–D>
Coverage: <inspected vs not-inspectable, one line>
Personas / angles: <counts, with confidence spread>
Open questions: <count, or none>
Unverified: <operator-provided / product-claim counts not backed by evidence>
```

## Anti-patterns

- ❌ Presenting an inferred persona or positioning angle as `kind: fact`.
- ❌ Restating a product's marketing claim as verified truth instead of a
  `product-claim` with a proof status.
- ❌ Inventing a flow or feature for an area recorded as `not_inspectable`.
- ❌ Re-walking authenticated app journeys the product-map already owns.
- ❌ Hard-coding a specific product's assumptions into the method.
- ❌ Leaving a `basis` that points outside `product_context.json`, or load-bearing
  context only in the human report.
- ❌ Committing screenshots/recordings or persisting external absolute media
  paths instead of copying into `.kai/runs/.../media/` and referencing them.
- ❌ Posting, scheduling, or "publishing" anything — out of scope for this layer.

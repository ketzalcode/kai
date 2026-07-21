---
name: linkedin-content
description: "Reusable method for turning Kai product intelligence (product_context.json, with product_exploration_report.md for phrasing nuance and optional media_manifest.json) into credible, platform-native LinkedIn content: post variants across defined angles, a content-angle matrix, and optional content calendars and carousel outlines. Every factual sentence is mapped in a per-variant claim ledger to a product_context assertion by id or path; the method never invents traction, revenue, users, partnerships, or results, never auto-publishes, and re-verifies claim-safety after any voicing. Brand-agnostic and bilingual-capable (English, Spanish)."
tools: [view, edit, create, grep, glob, ask_user, bash]
---

# LinkedIn Content

This skill converts a product's intelligence layer into **LinkedIn-native
content that reads as a credible builder, not generic marketing copy.** It
consumes what `principal-product-marketing` produced and turns it into posts the
operator can review and publish.

It is **not** invoked directly by the user. `principal-linkedin-strategist`
executes it. It never posts anything.

## Brand-agnostic and LinkedIn-only

The method carries no assumptions about any product, brand, or person. The
subject comes entirely from the consumed artifacts and the operator's brief. It
produces **LinkedIn** content only — other platforms are separate agents.

## Inputs

| Input | Role |
|---|---|
| `product_context.json` | **sole factual authority** — the grounded, typed product intelligence; every claim maps here |
| `product_exploration_report.md` | **phrasing nuance only** — never a source of facts the JSON doesn't carry |
| `media_manifest.json` (optional) | assets a carousel or post can reference |
| operator brief | goal (awareness, launch, waitlist, recruitment, feedback, fundraising, community, technical credibility…), audience, tone/style, language, output mode, confirmed speaker identity |

`product_context.json` is the **only** place facts come from. If it is absent or
too thin for the goal, stop and route the operator to
`principal-product-marketing` to produce or extend it — never reconstruct product
facts from the chat or the report, and never let an operator aside become a
stated result without first landing it in the JSON (see Claim-safety).

## The product_context id scheme (what you ground against)

`product_context.json` carries typed, id'd assertions. A **grounding reference**
is either a list-item `id` or a `product`-field path:

| Reference | Kind | Usable as a stated fact? |
|---|---|---|
| `product.name`, `product.summary`, `product.category` | fact | yes (respect `source`) |
| `product.stage`, `product.main_user_problem` | inference | no — perspective/hedged |
| `features[].id` (`f-1`), `flows[].id` (`fl-1`) | fact | yes |
| `claims[].id` (`c-1`) | fact · `source: product-claim` | **attributed only** ("the product is built to…") |
| `personas[].id` (`p-1`), `value_propositions[].id` (`v-1`), `differentiators[].id` (`d-1`), `objections[].id` (`o-1`) | inference | no — perspective/hedged |
| `content_angles[].id` (`a-1`) | recommendation | angle inspiration only, never a proof point |
| `evidence[].id` (`e-001`) | supporting evidence | backs a fact/claim; not itself a claim |

Resolve every reference before using it, and let its `kind`/`source`/`proof` and
`confidence` decide the treatment. A reference that doesn't semantically support
the sentence is not grounding — it's a mislabel.

## Claim-safety (the core discipline)

LinkedIn credibility dies on one invented number. So **every factual sentence in
every post is entered in a per-variant claim ledger** that maps the sentence to
the assertion that backs it:

```yaml
claim_map:
  - text: "<the exact claimful span from the post>"
    ref: "f-1 | c-2 | product.summary"          # a grounding reference
    ref_kind: fact | inference | recommendation
    ref_source: observed | operator-provided | product-claim | external | analyst
    proof_status: proven | partial | unproven | n/a
    evidence_ids: ["e-001"]                        # from the referenced entry's basis
    treatment: plain-fact | attributed-claim | qualified | perspective
```

Treatment by source/kind:

- **`observed` fact** → `plain-fact`: state it directly.
- **`product-claim`** → `attributed-claim`: *"built to…"*, *"designed to…"* —
  never an independently verified outcome.
- **`operator-provided`** → `attributed-claim` (attributed to the operator/company)
  and never presented as independently verified; if it is a metric/result it must
  be an already-public, operator-confirmed figure.
- **`external`** → cited, and **never** extrapolated into a product outcome.
- **`inference`** → `perspective`: frame as a point of view, hedged to its
  `confidence`; never a hard metric or result.
- **`proof_status: partial`** → `qualified` to the proven scope only.
- **`proof_status: unproven`** → may inspire a build-in-public or problem/solution
  *angle*, but must **not** appear as result copy.

**Never invent** traction, revenue, user counts, growth, funding, partnerships,
awards, benchmarks, or outcomes. If it isn't in `product_context.json`, it does
not go in a post.

Anything the operator would need to confirm goes in `needs_confirmation` and is
**excluded from the postable copy** (or shown as an explicit `<confirm: …>`
placeholder) — never silently published as fact.

Run the claim-safety pass on the finished copy, and **re-run it after any
voicing** (see Voicing): the final approved copy is what the ledger must match.

## Angles

Generate across these LinkedIn-native angles (only those the facts support):

`launch` · `build-in-public` · `technical-insight` · `product-story` ·
`founder-narrative` · `problem-solution` · `lessons-learned` · `user-value`

## Style and speaker

Style controls set register/depth/structure — never truth:

`concise` · `technical` · `founder-led` · `educational` · `launch-focused` ·
`casual` · `executive`

Default to a **neutral professional** register. Use `founder-led` /
`founder-narrative` (first-person "I built…") only when the operator has
**confirmed they are the founder/speaker**; otherwise a first-person founder
voice would itself be an unsupported claim.

## Modes and what each writes

| Mode | Writes |
|---|---|
| `post-only` | `linkedin-posts.md` — clean postable copy (hook/body/CTA/hashtags) + a one-line `Grounded:` ref list per variant |
| `post+rationale` | `linkedin-posts.md` with each variant's full `claim_map`, angle, and why-it-works |
| `content-strategy-pack` | the above **plus** `content-angle-matrix.json`, and the calendar/carousel outputs when requested |

The angle matrix is a **pack** output, not produced in `post-only`. The ledger
exists internally for every mode; `post+rationale` and the pack surface it.

## Minimum output

Every run produces **at least five materially distinct variants** — distinct by
*angle*, *core message*, *audience*, or *CTA*, not by wording. A translation of a
variant is **not** an additional variant, and a draft blocked in
`needs_confirmation` does not count toward the five.

## Language

English by default. On request, produce Spanish or bilingual output. A translated
variant shares its origin variant's **single claim ledger**; numbers,
attribution, confidence hedging, proof status, and CTA presence must be
semantically identical across languages. Never let translation strengthen a claim
or drop an attribution.

## Outputs

Filenames are stable so repeat runs are predictable.

### `linkedin-posts.md`

```markdown
### Variant <n> — <angle> · <style> · <language>
**Hook:** <scroll-stopping first line>

<main post body — LinkedIn-native line breaks>

**CTA:** <one clear ask matched to the goal>
**Hashtags:** <5–8 tags derived from product category/personas>
**Suggested audience:** <who this is for>   ·   **Intent:** <awareness | launch | recruit | …>
**Grounded:** <refs: f-1, c-2, product.summary>
**Needs confirmation:** <excluded-from-copy items, or "none">
<!-- post+rationale and pack additionally include the claim_map and "why this angle works" -->
```

### `content-angle-matrix.json` (pack)

```json
{
  "schema": "kai.linkedin-angle-matrix/v1",
  "target": "<product name>",
  "source_context": "<product_context.json path>",
  "generated": "<YYYY-MM-DD HH:MM local>",
  "angles": [
    {
      "angle": "launch|build-in-public|technical-insight|product-story|founder-narrative|problem-solution|lessons-learned|user-value",
      "audience": "",
      "core_message": "",
      "proof_point": "<a kind:fact reference (f-1, c-1, product.summary), or 'none — needs confirmation'>",
      "angle_source": "<optional inference/recommendation ref that inspired it (a-1, p-1)>",
      "suggested_format": "single-post|carousel|short-post|thread-style",
      "difficulty": "low|medium|high",
      "reusability": "one-off|evergreen|series"
    }
  ]
}
```

A `proof_point` must resolve to a `kind: fact` entry. An inference/recommendation
may only appear as `angle_source`, never as the proof.

### `content-calendar.md` (optional) and `carousel-<slug>.md` (optional)

The calendar sequences variant ids/angles (`1-week`, `2-week`, `launch-sequence`,
`build-in-public-sequence`, `founder-narrative-sequence`); it schedules and sends
nothing. A carousel's slides carry titles, narrative, a visual reference (a
`media_manifest.json` id or a clearly-labeled *create-this* suggestion), a CTA
slide, and its own `Grounded:` refs. Never imply an asset exists when it doesn't.

## Placement

Resolve the workspace via `workspace-conventions`.

- **Ad-hoc / standalone** review-then-post drafts default to the ignored run
  area: `.kai/runs/content/<target-slug>/<YYYY-MM-DD-HHMM>-linkedin/`.
- **Coordinated (initiative) work** writes the bundle to
  `initiatives/<slug>/artifacts/content/<item-id>/` with `delivery_class:
  knowledge` and the normal `work-coordination` handoff.
- **A reusable pack** the operator wants to keep is promoted through the standard
  `workspace-conventions` library flow (steward-approved, recorded in
  `deliverables.md`) to `library/content/<target-slug>/<YYYY-MM-DD-HHMM>-linkedin/`.
  Library frontmatter goes on the Markdown index only; the JSON matrix stays
  valid JSON. Never overwrite a prior pack — new runs get a new timestamp.

Nothing here is ever committed as "published," and the method touches no network.

## Voicing

By default, write in a credible, neutral-professional LinkedIn register. When the
operator wants it in **their own** founder voice, hand the finished, claim-safe
drafts to `persona-self` with the **claim spans, numbers, attributions, and
confidence qualifiers locked** (they pass through voicing verbatim, like code and
URLs already do). `persona-self` changes only the connective prose.

After voicing, **re-run the claim-safety pass** against the voiced copy: if any
locked span, number, attribution, or hedge changed, reject the voiced version.
The strategist owns final claim-safety approval; voicing never relaxes it.

## Hard rules

1. **Map every claim.** Each factual sentence has a `claim_map` entry resolving to
   a real `product_context.json` reference. No mapping, no claim.
2. **Never fabricate results.** No invented traction, revenue, users, growth,
   funding, partnerships, awards, or benchmarks — in any style or language.
3. **Respect provenance** per the treatment table; product-claims and
   operator-provided figures are attributed, inferences are perspective, external
   is cited and never extrapolated.
4. **JSON is the only fact source.** The report informs phrasing; new facts go
   through `principal-product-marketing` into the JSON first.
5. **needs_confirmation ≠ publishable.** Unconfirmed items are excluded from copy
   or shown as explicit placeholders.
6. **Re-verify after voicing.** Claim-safety holds against the *final* copy.
7. **LinkedIn only; never publish.** Drafts for review; no network, no schedule,
   no other platform, no video scripts.
8. **Brand-agnostic.** The subject is the artifacts'; the method is yours.

## Output contract

Return:

```text
LinkedIn content: <target> — <mode>
Source: <product_context.json path>
Variants: <count ≥5, across angles: launch, technical, founder, …>
Artifacts: <absolute linkedin-posts.md (+ matrix/calendar/carousel) paths>
Language: <en | es | bilingual>
Claim-safety: <all mapped | N need confirmation (excluded from copy)>
Voice: <neutral professional | voiced via persona-self + re-verified>
Your move: <review + post manually; nothing was published>
```

## Anti-patterns

- ❌ A variant-wide grounding list instead of a per-sentence claim map.
- ❌ Grounding a claim on an `evidence` id or an unrelated reference that doesn't
  semantically support it.
- ❌ Using an `inference`/`recommendation`/`unproven` entry as a stated result or
  a matrix `proof_point`.
- ❌ Letting an operator aside or the report introduce a fact the JSON doesn't
  carry.
- ❌ Publishing (or leaving in copy) a `needs_confirmation` item.
- ❌ Voicing that strengthens a claim, drops an attribution, or changes a number —
  and not re-checking after voicing.
- ❌ Founder-first-person voice without a confirmed speaker.
- ❌ Other-platform content, video scripts, or implying a post was published.

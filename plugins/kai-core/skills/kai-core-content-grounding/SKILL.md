---
name: kai-core-content-grounding
description: "Claim-safety and provenance rules for product content. Use when creating external-facing LinkedIn posts, video scripts, or other content from product intelligence."
tools: [read, edit, search]
---

# Content Grounding

Every external-facing thing Kai generates from a product — a LinkedIn post, a
video script, a landing hero — makes **claims** about that product. One invented
number kills credibility. This skill is the single contract that keeps all of it
honest, so each content method (`linkedin-content`, `video-direction`, future
platform methods) grounds claims the same way instead of re-inventing it.

It is **not** a standalone trigger. Content methods inherit it by reference — the
same way the `review-*` lenses inherit `doc-review-rigor` — and add their own
platform-specific output on top.

## The single fact source

`product_context.json` (from `principal-product-marketing`) is the **only** place
facts come from:

- `product_exploration_report.md` informs *phrasing* nuance only — never a source
  of a fact the JSON doesn't carry.
- An operator aside is not a fact until it lands in `product_context.json` through
  `principal-product-marketing`. If the context is missing or too thin for the
  goal, stop and route there; never reconstruct product facts from the chat.

## The product_context reference scheme

`product_context.json` carries typed, id'd assertions. A **grounding reference**
is either a list-item `id` or a `product`-field path:

| Reference | Kind | Usable as a stated fact? |
|---|---|---|
| `product.name`, `product.summary` | fact | yes (respect `source`) |
| `product.category` | fact or inference | yes if `kind: fact`; hedge if inference |
| `product.stage`, `product.main_user_problem` | inference | no — perspective/hedged |
| `features[].id` (`f-1`), `flows[].id` (`fl-1`) | fact | yes |
| `claims[].id` (`c-1`) | fact · `source: product-claim` | **attributed only** |
| `personas[].id` (`p-1`), `value_propositions[].id` (`v-1`), `differentiators[].id` (`d-1`), `objections[].id` (`o-1`) | inference | no — perspective/hedged |
| `content_angles[].id` (`a-1`) | recommendation | angle/concept inspiration only, never a proof point |
| `evidence[].id` (`e-001`) | supporting evidence | backs a fact/claim; not itself a claim |

Resolve each entry's actual `kind` at read time — some `product.*` fields and
some entries can be `fact` **or** `inference`; never assume. A reference that
doesn't semantically support the sentence is a mislabel, not grounding.

## The claim ledger

**Every factual sentence in every produced item** (a post variant, a storyboard
scene, a voiceover line) is entered in a claim ledger that maps the sentence to
the assertion that backs it:

```yaml
claim_map:
  - text: "<the exact claimful span>"
    ref: "f-1 | c-2 | product.summary"          # a grounding reference
    ref_kind: fact | inference | recommendation
    ref_source: observed | map-fact | operator-provided | product-claim | external | analyst
    proof_status: proven | partial | unproven | n/a
    evidence_ids: ["e-001"]
    treatment: plain-fact | attributed-claim | qualified | perspective
```

### Treatment by source / kind

- **`observed` fact** → `plain-fact`: state it directly.
- **`map-fact`** (a fact carried from the neutral product-map) → `plain-fact`.
- **`product-claim`** → `attributed-claim`: *"built to…"*, *"designed to…"* —
  never an independently verified outcome.
- **`operator-provided`** → `attributed-claim` (to the operator/company), never
  independently verified; a metric must already be public and operator-confirmed.
- **`external`** → cited, and **never** extrapolated into a product outcome.
- **`inference`** → `perspective`: a point of view, hedged to its `confidence`;
  never a hard metric or result.
- **`proof_status: partial`** → `qualified` to the proven scope only.
- **`proof_status: unproven`** → may inspire an *angle/concept*, but must not
  appear as result copy.

## Never fabricate

No invented traction, revenue, user counts, growth, funding, partnerships,
awards, benchmarks, or outcomes — in any style, platform, or language. If it
isn't in `product_context.json`, it does not appear in the content.

Anything the operator would need to confirm goes in `needs_confirmation` and is
**excluded from the deliverable copy/script** (or shown as an explicit
`<confirm: …>` placeholder) — never silently presented as fact.

## Bilingual grounding

A translated item shares its origin item's **single claim ledger**. Numbers,
attribution, confidence hedging, proof status, and CTA/claim presence must be
semantically identical across languages. Translation never strengthens a claim or
drops an attribution.

## Locked-facts voicing

When a content method hands a claim-safe draft to `persona-self` for the
operator's voice, the claim spans, numbers, attributions, and confidence
qualifiers are **locked** (verbatim pass-through, like code and URLs).
`persona-self` changes only connective prose. After voicing, the content method
**re-runs claim-safety** against the voiced copy and rejects any change to a
locked span. Voicing never relaxes grounding.

## Hard rules

1. **Map every claim** to a real `product_context.json` reference; no mapping, no
   claim.
2. **Never fabricate results** — in any style, platform, or language.
3. **Respect provenance** per the treatment table; product-claims and
   operator figures are attributed, inferences are perspective, external is cited
   and never extrapolated.
4. **JSON is the only fact source.** The report informs phrasing; new facts go
   through `principal-product-marketing` first.
5. **needs_confirmation ≠ publishable.** Excluded from copy or shown as an
   explicit placeholder.
6. **Re-verify after voicing.** Claim-safety holds against the final copy.

## Anti-patterns

- ❌ An item-wide grounding list instead of a per-sentence claim map.
- ❌ Grounding a claim on an `evidence` id or an unrelated reference that doesn't
  semantically support it.
- ❌ Using an `inference` / `recommendation` / `unproven` entry as a stated
  result or a proof point.
- ❌ Letting the report or an operator aside introduce a fact the JSON lacks.
- ❌ Publishing (or leaving in copy) a `needs_confirmation` item.
- ❌ Voicing that strengthens a claim or drops an attribution, with no re-check.

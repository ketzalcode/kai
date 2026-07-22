---
name: ui-mockup
description: "Shared method for turning a load-bearing pre-implementation design choice into human-confirmable visual mockups. Owns the ASCII/HTML fidelity ladder, the offline self-contained token-driven mock kit (no CDN/npm, like generate-html-lesson), the 3-4 option presentation with a recommended pick and pros/cons, and the ask_user confirmation gate (pause for a human pick unless explicitly delegated) reachable from both DESIGN and REVIEW. principal-product-designer inherits it; mocks are grounded by design-grounding."
tools: [view, create, edit, grep, glob, ask_user, playwright]
---

# UI Mockup

A load-bearing layout or interaction choice made from **prose options** loses the
aesthetic decision. The incident this skill exists to prevent: a designer flagged
a real must-fix, offered two *text* options, engineering picked the "preferred"
one — it passed conformance but produced a visually wrong band taking a third of
the card. The human never saw the options **as mockups** before implementation.

This skill makes consequential options **visual**, marks a recommended pick, and
**pauses for a human choice** before the design is locked. It is **not** a
standalone trigger — `principal-product-designer` inherits it by reference, and
every mock is grounded by `design-grounding` (it uses the app's real
design-system tokens, never an invented look).

## When it applies — and when to skip

**Apply** to any consequential design decision with materially different options —
a layout, placement, interaction model, or information-hierarchy choice — whether
it arises in **DESIGN** or is uncovered during **REVIEW**.

**Skip** for a trivial choice, or one with a single obvious answer, or a pure copy
tweak. Don't spin up options theater for a decision that isn't load-bearing.

## The fidelity ladder

Pick the **lowest tier that lets the human decide safely**. Default to Tier 2
when a design system exists.

| Tier | Medium | Use when |
|---|---|---|
| **0 — ASCII** | inline ASCII boxes | The decision is purely placement / distribution / layout topology; **or** the structure is so complex only a rough skeleton matters; **or** no styling would change the choice. Fastest. |
| **1 — plain self-contained HTML** | one offline `.html`, inline `<style>` | The decision turns on hierarchy, copy, states, or responsive behavior, **and** no usable design-system reference exists yet. |
| **2 — token-driven mock kit HTML** (preferred default) | one offline `.html`, inline `<style>` seeded from `design-system.md` tokens | A `design-system.md` (or `design-system-extract.md`) exists, **and** the decision depends on real component feel (cards, forms, nav, dialogs, tables, empty states) so options must look plausibly **on-brand**. |

## The offline mock-kit rule

Every HTML mock is **one self-contained file**, all CSS inline in a `<style>`
block, that works offline by double-click — exactly like `generate-html-lesson`.
**No CDN, no npm, no external scripts or stylesheets, no build step.** kai runs on
locked-down networks where CDN imports fail silently; a mock that needs the
network is a broken deliverable.

"**Component-library-backed**" here means a **small inline mock kit** of semantic
classes — `.k-card`, `.k-btn`, `.k-field`, `.k-badge`, `.k-row` — whose values are
the **app's real tokens** pulled from `design-grounding`. It is **not** importing
shadcn/ui, Tailwind, MUI, or any runtime component library. Seed the `<style>`
block from the design system, for example:

```html
<style>
  :root {                      /* seeded from design-system.md tokens */
    --k-bg: #faf9f5; --k-fg: #141413; --k-accent: #d97757;
    --k-radius: 6px; --k-space: 8px;
    --k-font: system-ui, sans-serif; --k-size-md: 1rem; --k-size-s: .85rem;
  }
  .k-card { border:1px solid #0001; border-radius:var(--k-radius);
            padding:calc(var(--k-space)*2); font-family:var(--k-font); }
  .k-btn  { border-radius:var(--k-radius); padding:var(--k-space) calc(var(--k-space)*1.5);
            background:var(--k-accent); color:#fff; font-size:var(--k-size-s); }
  /* ...only the few components the decision needs... */
</style>
```

Playwright may **screenshot the generated mock** (or the real app) as grounding
evidence — never as a substitute for the option mocks. The point of a mock is to
show a **desired state that often does not exist yet**; a screenshot of today's
app can't do that.

## The option set and the recommendation

Produce **3-4 materially different options** (A / B / C [/ D]) — genuinely
different approaches, not the same layout recolored. For each option, record:

- the **mock** (an ASCII block inline, or a labeled section in `options.html`);
- a **one-line concept**;
- **pros** and **cons** (incl. how it fits the settled design and its trade-offs);
- a **scope class** per `scope-discipline` (refine-in-scope / expands-scope);
- an **accessibility note** if relevant.

Mark **exactly one** as **Recommended**, with a short **why** tied to the approved
outcome + least interaction cost + design-system conformance — **not taste**.

## The confirmation gate

After presenting the options, **pause with `ask_user`**:

> Options A-D are in `<path>`. **Recommended: B** — <why>. Pick A/B/C/D, ask for a
> revision, or say "you decide" to delegate.

**Do not proceed to lock the design or hand off to implementation without a pick.**

**Explicit-delegation exception:** if the human has already delegated the decision
— "you decide", "pick the best and proceed", "no need to ask me", or a dispatch
packet carrying `decision_delegated: true` — take the **Recommended** option and
**record** that it was delegated plus the rationale. Even when delegated, record
**all** options, so the choice stays reviewable.

**Reachable from both modes:**

- **DESIGN** — run the gate *before* writing design acceptance for a load-bearing
  choice.
- **REVIEW** — if a review uncovers a layout/interaction choice with materially
  different options, **escalate it as an options decision** (produce mockups, run
  the gate) instead of silently picking one. The pick is recorded on a
  design-revision item and re-accepted by the PM (`product-design-acceptance`)
  before engineering implements it — a REVIEW never locks a new load-bearing
  design against only the implementation revision.

## Where mockups live

**ASCII (Tier 0)** options live inline in the design artifact's
`## Options considered` section and produce no files. The paths below apply to
the **HTML tiers (1–2)**.

Drafts render in the gitignored working root, reusing the existing `product` run
area — **no new run area, no new library type**:

```text
.kai/runs/product/<target-slug>/<YYYY-MM-DD-HHMM>-mockups/
  options.html
  screenshots/            # optional grounding evidence (heavy — stays here)
```

The human-reviewed mock is committed **alongside the design artifact**:

```text
initiatives/<slug>/artifacts/designs/<item-id>-mockups/options.html
```

and referenced from `initiatives/<slug>/artifacts/designs/<item-id>.md`:

```markdown
## Options considered

Visual mockups: `./<item-id>-mockups/options.html`  (fidelity: ASCII | HTML | mock-kit)
Recommended: Option B — <why>.
Human confirmation: <picked by operator | delegated>, <timestamp>.
```

Screenshots stay in the run folder as local evidence (heavy binaries aren't
committed), referenced by path — the same "promote the text, not the binaries"
pattern as `web-evaluation`.

## Hard rules

1. **Offline, always.** An HTML mock is one self-contained file with inline CSS —
   no CDN/npm/build. An ASCII (Tier 0) mock stays inline in the options block.
2. **Ground in the design system when it exists.** With a `design-system.md`,
   ground every option in its tokens and cite them; with none (Tier 1), use
   neutral defaults with explicitly labeled assumptions — never present an
   invented look as on-brand.
3. **3-4 options, exactly one Recommended + why.** Real alternatives, not reskins.
4. **Pause for a human pick** unless the human explicitly delegated; record the
   options either way.
5. **Reachable from DESIGN and REVIEW.** A REVIEW fork with real options escalates
   here, never a silent pick.
6. **Classify each option's scope** (`scope-discipline`); an expands-scope option
   is a `PROPOSAL`, not the silent default.
7. **Mocks, not production code.** This skill produces mockups and a recorded
   decision; frontend code is `principal-swe-frontend`.

## Anti-patterns

- ❌ A CDN/npm dependency in a mock (Tailwind CDN, shadcn import, Google Fonts
  link) — it breaks offline and is off-contract.
- ❌ Prose-only options for a load-bearing choice — the exact gap this skill closes.
- ❌ Proceeding to lock/implement without the `ask_user` gate (absent explicit
  delegation).
- ❌ Inventing an off-brand look instead of seeding the mock kit from the design
  system.
- ❌ A screenshot of the current app standing in for a mock of the desired state.
- ❌ Growing this into a mini design tool — asset pipelines, template engines,
  reusable renderers. Static mocks only.
- ❌ Four "options" that are one layout recolored. Options must be materially
  different.

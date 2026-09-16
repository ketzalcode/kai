# HTML Block Diagram Catalog

Consult this reference for a selected block-layout task. It is not a trigger
to add a diagram or a requirement to include every arrangement.
The palette and labels are illustrative, not a product design system or
evidence about the subject. Use supplied tokens for branded output.

| What you're drawing | Arrangement | Why not a flowchart |
| --- | --- | --- |
| Ordered stack, tiers, phases | **Layers** | the order carries the meaning; one chevron replaces every edge |
| Who owns what | **Lanes + cards** | grouping expresses ownership; card detail follows the supplied facts |
| A linear sequence | **Pipeline** | one way forward; nothing to route |
| What lives inside what | **Boundary** | nesting *is* containment |
| Owns vs. does not own | **Compare** | no nodes, no edges — still a diagram |

Cards can contain a name alone or a supplied description. Status chips and
artifact paths are optional when those facts are available and relevant.
Never invent metadata to complete an example's shape.

## The rule: the engine places everything

Use grid or flex to place blocks in normal flow. Intrinsic sizing, wrapping,
and narrow-layout rules reduce collisions; they do not replace rendering and
inspection at the actual destination size.

Four failure modes follow from that, and each has a rule:

- Prefer intrinsic card sizing with wrapping and shrinkable grid tracks.
- Keep legends and labels in normal flow, including when their text wraps.
- **Always allow long tokens to break** (`overflow-wrap: anywhere`) on
  anything holding a name, a path or a chip. An unbreakable
  `artifacts/decisions/2026-08-13-thing.md` is the other overflow route.
- **A connector must lead its step, never separate two.** On one line
  they look identical. On a wrap, a separator is left at the end of a
  row **pointing at nothing** — the same defect as an ASCII arrow aimed
  past the end of its target line. A decorative `.kai-connector` inside its
  step stays attached on wrapping; a separator between steps does not.

Two CSS traps that fail **silently**, so they are worth naming:

- A custom property that is never defined produces no error anywhere —
  the element just renders unstyled. Check that every `var(--x)` you
  read is declared.
- A comment containing `*/` in its text (for example, writing
  `--surface-*/--text-*`) **closes early** and swallows the rule that
  follows it.

## The stylesheet

Self-contained: no build step, dependency, network request, or JavaScript.
Copy the needed arrangements and their variable declarations into the
artifact's `<style>`. The role colors are example values; keep only the
classes the actual diagram needs.

```css
:root {
  color-scheme: light dark;
  --kai-surface: #f8f9fa;
  --kai-raised: #fff;
  --kai-line: #ced4da;
  --kai-text: #212529;
  --kai-muted: #868e96;
  --kai-band: #f1f3f5;
  --kai-gap: 0.75rem;
  --kai-pad: 1rem;
  --kai-radius: 0.5rem;
  --kai-mono: ui-monospace, SFMono-Regular, "Cascadia Mono", Menlo, monospace;
  --kai-yes: #2b8a3e;
  --kai-no: #c92a2a;
}

/* One role per department. --role-ink is the accent, --role-fill the tint,
   --role-line the border. Every block reads these three and nothing else, so
   a palette change is seven lines, not seventy. */
.r-direction { --role-ink: #5f3dc4; --role-fill: #e5dbff; --role-line: #b197fc; }
.r-product   { --role-ink: #1864ab; --role-fill: #d0ebff; --role-line: #74c0fc; }
.r-design    { --role-ink: #a61e4d; --role-fill: #ffdeeb; --role-line: #faa2c1; }
.r-eng       { --role-ink: #087f5b; --role-fill: #c3fae8; --role-line: #63e6be; }
.r-trust     { --role-ink: #d9480f; --role-fill: #ffe8cc; --role-line: #ffc078; }
.r-delivery  { --role-ink: #2b8a3e; --role-fill: #d3f9d8; --role-line: #8ce99a; }
.r-human     { --role-ink: #212529; --role-fill: #f1f3f5; --role-line: #ced4da; }

/* Dark is not "pick a darker shade": a saturated fill across a whole layer
   reads as a warning band. Mixing the accent into the page surface keeps the
   same tint at the same strength, which is what pastel means. */
@media (prefers-color-scheme: dark) {
  :root {
    --kai-surface: #030507;
    --kai-raised: #0d0f12;
    --kai-line: #343a40;
    --kai-text: #f1f3f5;
    --kai-muted: #868e96;
    --kai-band: #0d0f12;
    --kai-yes: #69db7c;
    --kai-no: #ff8787;
  }
  .r-direction { --role-ink: #b197fc; }
  .r-product   { --role-ink: #74c0fc; }
  .r-design    { --role-ink: #faa2c1; }
  .r-eng       { --role-ink: #63e6be; }
  .r-trust     { --role-ink: #ffc078; }
  .r-delivery  { --role-ink: #8ce99a; }
  .r-human     { --role-ink: #ced4da; }
  [class*='r-'] {
    --role-fill: color-mix(in oklab, var(--role-ink) 16%, var(--kai-surface));
    --role-line: color-mix(in oklab, var(--role-ink) 40%, var(--kai-surface));
  }
}

/* The frame every diagram sits in. */
.kai-diagram {
  background: var(--kai-surface);
  border: 1px solid var(--kai-line);
  border-radius: var(--kai-radius);
  padding: 1.25rem;
  margin-block: 1.5rem;
}
.kai-diagram > figcaption {
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--kai-muted);
  margin-block-end: var(--kai-pad);
}

/* Cards shrink within their parent and allow long labels to wrap. */
.kai-card {
  border: 1px solid var(--role-line, var(--kai-line));
  border-inline-start: 3px solid var(--role-ink, var(--kai-line));
  background: var(--kai-raised);
  border-radius: var(--kai-radius);
  padding: var(--kai-gap);
  min-width: 0;
  overflow-wrap: anywhere;
  flex: 1 1 13rem;
  display: grid;
  gap: 0.25rem;
  align-content: start;
}
.kai-card b { font-family: var(--kai-mono); font-size: 0.8125rem; color: var(--kai-text); overflow-wrap: anywhere; }
.kai-card small { color: var(--kai-muted); font-size: 0.75rem; }
.kai-card code, .kai-chip {
  font-family: var(--kai-mono);
  font-size: 0.6875rem;
  justify-self: start;
  border-radius: 0.25rem;
  padding: 0 0.35rem;
  overflow-wrap: anywhere;
}
.kai-card code { color: var(--kai-muted); background: var(--kai-band); }
.kai-chip {
  border-radius: 999px;
  padding: 0 0.6rem;
  background: var(--role-fill, var(--kai-band));
  color: var(--role-ink, var(--kai-text));
  border: 1px solid var(--role-line, var(--kai-line));
}
.kai-cards { display: flex; flex-wrap: wrap; gap: var(--kai-gap); }

/* (a) LANES — who owns what. */
.kai-lanes { display: grid; gap: var(--kai-gap); }
.kai-lane {
  display: grid;
  grid-template-columns: minmax(0, 8rem) minmax(0, 1fr);
  align-items: center;
  gap: var(--kai-pad);
  background: var(--kai-band);
  border-radius: var(--kai-radius);
  padding: var(--kai-gap);
}
.kai-lane > h4, .kai-layer > h4 {
  margin: 0;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--role-ink, var(--kai-muted));
}

/* (b) LAYERS — the stack order is the meaning; one chevron says "below". */
.kai-stack { display: grid; gap: 0.5rem; }
.kai-layer {
  display: grid;
  grid-template-columns: minmax(0, 9rem) minmax(0, 1fr);
  gap: var(--kai-pad);
  align-items: center;
  border: 1px solid var(--role-line, var(--kai-line));
  background: var(--role-fill, var(--kai-band));
  border-radius: var(--kai-radius);
  padding: var(--kai-gap);
}
.kai-down { justify-self: center; color: var(--kai-muted); line-height: 1; }
.kai-down::before { content: '\25BC'; }

/* (c) PIPELINE — the chevron LEADS its step rather than separating two. */
.kai-pipeline { display: flex; flex-wrap: wrap; align-items: stretch; gap: 0.5rem; }
.kai-step {
  border: 1px solid var(--role-line, var(--kai-line));
  background: var(--role-fill, var(--kai-raised));
  color: var(--role-ink, var(--kai-text));
  border-radius: var(--kai-radius);
  padding: 0.5rem var(--kai-gap);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  overflow-wrap: anywhere;
}
.kai-step > span:not(.kai-connector) { display: grid; gap: 2px; }
.kai-step b { font-family: var(--kai-mono); font-size: 0.8125rem; }
.kai-step small { font-size: 0.6875rem; opacity: 0.75; }
.kai-step > .kai-connector { color: var(--kai-muted); line-height: 1; margin-inline-start: -0.35rem; }
.kai-step:first-child > .kai-connector { display: none; }

/* (d) BOUNDARY — containment drawn by nesting, so no edge can cross it. */
.kai-boundary {
  border: 2px dashed var(--role-line, var(--kai-line));
  border-radius: var(--kai-radius);
  padding: 1.25rem var(--kai-gap) var(--kai-gap);
  position: relative;
  display: grid;
  gap: var(--kai-gap);
}
.kai-boundary > .legend {
  font-family: var(--kai-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--role-ink, var(--kai-muted));
  background: var(--kai-surface);
  padding-inline: 0.5rem;
}

/* (e) COMPARE — owns versus does not own. Not a graph at all. */
.kai-compare { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); gap: var(--kai-gap); }
.kai-compare > div { display: grid; gap: 0.5rem; align-content: start; }
.kai-compare h4 { margin: 0; font-size: 0.875rem; }
.kai-compare ul { margin: 0; padding-inline-start: 1.25rem; color: var(--kai-muted); font-size: 0.875rem; }
.kai-yes { color: var(--kai-yes); }
.kai-no { color: var(--kai-no); }

.kai-legend { display: flex; gap: var(--kai-gap); flex-wrap: wrap; margin-block-start: var(--kai-pad); }
.kai-swatch {
  font-family: var(--kai-mono);
  font-size: 0.6875rem;
  padding: 0 0.6rem;
  border-radius: 0.25rem;
  background: var(--role-fill);
  color: var(--role-ink);
  border: 1px solid var(--role-line);
}

.kai-diagram, .kai-diagram * { box-sizing: border-box; }
.kai-diagram, .kai-boundary { min-width: 0; overflow-wrap: anywhere; }
@media (max-width: 40rem) {
  .kai-lane, .kai-layer { grid-template-columns: minmax(0, 1fr); }
}
```

## The markup

Every diagram is a `<figure class="kai-diagram">` with a concise
`<figcaption>` naming what it shows. This is this skill's HTML accessibility
and craft rule. Connector glyphs are decorative, so they carry
`aria-hidden="true"`.

**A two-field card**, when both facts are supplied:

```html
<div class="kai-card r-eng">
  <b>Component name</b>
  <small>Supplied component description</small>
</div>
```

**Layers** — bands in order, one chevron between them:

```html
<div class="kai-stack">
  <div class="kai-layer r-direction">
    <h4>Agents</h4>
    <div class="kai-cards"><!-- cards --></div>
  </div>
  <span class="kai-down" aria-hidden="true"></span>
  <div class="kai-layer r-eng">
    <h4>Skills</h4>
    <div class="kai-cards"><!-- cards --></div>
  </div>
</div>
```

**Lanes** — a label column and its cards:

```html
<div class="kai-lanes">
  <div class="kai-lane r-product">
    <h4>Product</h4>
    <div class="kai-cards"><!-- cards --></div>
  </div>
</div>
```

**Pipeline** — each decorative chevron belongs to its step and is hidden from
assistive technology; it cannot be stranded between steps on a wrap:

```html
<div class="kai-pipeline">
  <div class="kai-step r-human"><span class="kai-connector" aria-hidden="true">&#9658;</span><span><b>proposed</b><small>anyone may file</small></span></div>
  <div class="kai-step r-product"><span class="kai-connector" aria-hidden="true">&#9658;</span><span><b>approved</b><small>steward decides</small></span></div>
</div>
```

**Boundary** — nest to show containment:

```html
<div class="kai-boundary r-eng">
  <span class="legend">your repository</span>
  <div class="kai-boundary r-trust">
    <span class="legend">contained subsystem</span>
    <div class="kai-cards"><!-- cards --></div>
  </div>
</div>
```

**Compare** — two columns, no graph:

```html
<div class="kai-compare">
  <div>
    <h4 class="kai-yes">Owns</h4>
    <ul><li>sequencing, sizing and naming dependencies</li></ul>
  </div>
  <div>
    <h4 class="kai-no">Does not own</h4>
    <ul><li>what to build, or whether to build it</li></ul>
  </div>
</div>
```

## Before you call it done

Render it and look at it. These are the checks that catch what reading
the source does not:

- [ ] **Rendered at a narrow width too.** Wrapping is where the pipeline
      chevron and card sizing fail. If the artifact is destined for an
      image, render at the target width.
- [ ] **Checked in dark when supported.** Example colors are not a contrast
      or rendering result for the current artifact.
- [ ] **No label spills its box**, and no long path forces a horizontal
      scrollbar.
- [ ] **No `var(--x)` reads a property nothing declares**, and no
      comment contains `*/` in its text.
- [ ] **The caption says what the diagram shows**, and decorative glyphs
      are `aria-hidden`.
- [ ] **One concept per diagram** — split rather than cram, exactly as
      in `build-diagrams`.

Use an available renderer at the requested dimensions and its color-scheme
emulation when needed. If rendering was unavailable or not performed, report
that limit. Authoring HTML source is not evidence that an image was exported
or that the diagram was visually inspected.

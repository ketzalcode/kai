---
name: generate-html-lesson
description: "Apply when the user wants a self-contained HTML lesson page from any markdown source — a course unit extracted by `workflow-course-to-audio`, a book chapter, ad-hoc notes, anything they want to learn from. Triggers on phrases like 'turn this into an HTML lesson', 'make a lesson page', 'I want a visual companion to the audio', 'generate the HTML lesson', or via the `instructor-teacher` agent which orchestrates this + `generate-audio`. Produces a single self-contained `index.html` per source file — prose + rich HTML+CSS diagrams + an embedded audio player when an audio file is available — that works offline by double-click with zero external dependencies. Default visual language is English; default audio language is Spanish (asymmetric by design — you read English while listening Spanish, or vice versa, to keep both active). Cwd-relative — travels across codebases."
tools: [view, grep, glob, edit, create, ask_user]
user-invocable: true
argument-hint: <path to source markdown> [--audio <path to mp3>] [--lang en|es] [--out <dir>]
---

# Generate HTML Lesson — visual companion to a narrated source

You produce a **self-contained HTML lesson page** from a markdown source.
The page is the visual half of a lesson; the audio (produced separately
by `generate-audio`) is the auditory half. They sit next to each other
so the user can double-click `index.html` to open it in a browser, hit
play on the embedded audio, and follow along.

The source can be anything the user wants to learn from:

- A Microsoft Learn / Coursera / docs page extracted by `workflow-course-to-audio`
  (lives under `.kai/runs/learn/<goal-slug>/<NN>-extract-<source-slug>/raw/<NN-unit>.md`).
- A book chapter the user pasted or extracted into markdown.
- A humanized internal design doc.
- Their own ad-hoc study notes.

This is **Tier A** of the HTML lesson roadmap — static page, no
audio↔visual auto-sync. You scroll yourself while listening. Tier B
(section-scrolled, audio-driven highlight) is a future extension.

Sister to bongo's `generate-html-lesson` skill, but bongo bakes in
Microsoft-work paths (`humanized/`, `library/audio/`); this one stays
**cwd-relative** so you can run it from any project.

## Output shape

For each source file, produce a folder:

```
<output-dir>/<source-slug>/
  index.html         <-- the lesson page; self-contained, works offline
  audio.mp3          <-- referenced by relative path (preferred) or
                         copied locally when the relative path would
                         escape the project tree (see Step 5)
```

Default `<output-dir>` is `lessons/` next to the source file. The user
can override with `--out`.

The HTML file embeds:

- **Header** with title (and chapter number if available), source-doc
  back-link, and the audio player.
- **Prose** translated from the markdown — same words, rendered as HTML.
- **Rich HTML+CSS diagrams** inline at section boundaries where a visual
  helps. Built from styled `<div>` boxes, CSS grid layouts, Unicode
  arrows, and the diagram-primitive CSS classes the template provides.
  No external diagramming libraries.
- **Source references / Related** sections preserved at the bottom when
  present in the source.

No external CSS files. No npm. No bundler. No CDN-loaded scripts. One
HTML file, plus the sibling MP3 when audio exists.

## Hard rules

1. **Information fidelity is non-negotiable.** Every fact in the source
   markdown must survive in the HTML. Do not summarize. Do not drop
   bullets. Visuals *augment* the prose, never replace it.
2. **Self-contained HTML.** One `index.html` per source, double-
   clickable, no build step, **no external script or stylesheet
   dependencies**. All styles inline in a `<style>` block at the
   top. All diagrams as HTML+CSS (see Hard rule 4a below — no
   Mermaid, no D3, no Chart.js).
3. **Asymmetric language is the default.** Visual = English (so it
   matches the source for most learning content), audio = Spanish
   (the user's active-listening language). The user can override
   either flag. If they ask for symmetric (both English or both
   Spanish), honor it.
4. **Diagrams are load-bearing, not decorative.** Add a diagram where
   the prose describes a structural relationship (component A connects
   to component B), a sequence (step 1 → step 2 → step 3), or a
   hierarchy (X contains Y contains Z). Don't add diagrams for prose
   that's already linear narrative — they're noise.
5. **Audio player ships embedded when audio exists.** The `<audio
   controls preload="metadata">` element sits at the top of the page,
   sticky-positioned so it stays visible as the user scrolls. The
   source attribute points at `audio.mp3` (or the relative path to
   the existing MP3). If no audio is available and the user chose to
   proceed anyway, the player is omitted entirely (no broken "no
   audio loaded" UI).
6. **Never edit the source markdown.** Lessons are derived; the source
   stays canonical.
7. **No information leak.** If the source frontmatter has any of
   `sensitivity`, `confidential`, or `internal_only` set, the lesson
   HTML carries a banner noting confidentiality. Don't publish or
   share automatically.

## Workflow

### 1. Identify the source file

Resolve the source path from the user's request:

- If they named a specific file, use it.
- If they referenced a recent extraction (e.g., "the AI-901 module 3
  intro"), glob the matching `.kai/runs/learn/<goal-slug>/<NN>-extract-<source-slug>/raw/`
  folder.
- If they said "make a lesson from this" referring to recent tool
  output, pull the path from the previous turn.

Verify the source file:

- Exists and is a markdown file.
- Is not itself a `README.md`, `index.md`, `source.md`, or other
  metadata file.

The source doesn't need any particular frontmatter type. If frontmatter
exists, pull `title`, `chapter`, `sensitivity`, `source` (URL),
`source_path` from it; otherwise infer from the document body.

### 2. Locate or generate the matching audio

The lesson page embeds an audio file when one is available. Look in
this order:

- Whatever path the user supplies via `--audio <path>`.
- **`<source-dir>/../audio/<source-slug>-<lang>.mp3`** (the default
  Lectoria output convention when audio was generated from a single
  file).
- **`<source-dir>/../../audio/<source-folder>/<source-slug>-<lang>.mp3`**
  (the convention when the parent folder was passed to `generate-audio`
  recursively — e.g. `.kai/runs/learn/<goal-slug>/<NN>-extract-<source-slug>/audio/raw/<module>/`).
- **`<source-dir>/audio.mp3`** (already-staged sibling).

If no audio is found and the user didn't specify, **ask** whether to:

- (a) Generate audio now via the `generate-audio` skill, then proceed.
- (b) Generate the HTML without audio (player omitted).
- (c) Cancel and let the user generate audio first.

Default suggestion: option (b) for cheap iteration — they can always
re-generate the HTML later once audio exists; the HTML is fast and free.

### 3. Parse the source markdown

Read the source. Extract:

- **Frontmatter** when present — `title`, `chapter`, `source` (link),
  `source_path`, `sensitivity`, anything else useful for the header.
- **First H1** — falls back to filename if absent.
- **Opening paragraph** — used as the lesson's intro.
- **H2 sections in order** — these become the main content sections of
  the HTML.
- **Sub-sections (H3 and deeper)** — preserved as nested headings.
- **A `## Source references` / `## Sources` / `## References` table** —
  if present, preserve verbatim at the bottom.
- **A `## Diagrams` section** — if present, preserve at the bottom.
- **A `## Related` / `## See also` section** — if present, preserve at
  the bottom.

Be tolerant of source files that have none of those bottom sections —
many sources (extracted course units, raw notes) won't.

### 4. Plan the diagrams

Walk the H2 sections. For each, decide:

- **Diagram-worthy?** Yes if the section describes a structural
  relationship, a sequence, or a hierarchy. No if it's pure narrative
  or pure prose explanation.
- **Diagram pattern?** Pick from this catalog of HTML+CSS primitives
  (Mermaid is **not** used — see anti-patterns):
  - **Box-and-arrow flowchart** — `<div>` boxes positioned with CSS
    grid or flexbox, connected by simple arrows (Unicode → ↓ ↔).
  - **Vertical sequence / call chain** — numbered `<ol>` of
    actor-action-recipient triplets styled as cards.
  - **Hierarchy / tree** — nested `<details>` or styled `<ul>` with
    indentation rails.
  - **Comparison / side-by-side** — CSS grid (2-3 columns) with
    contrasting backgrounds.
  - **State machine / decision tree** — labeled boxes with branch
    arrows; CSS grid layout.
  - **Layered architecture** — stacked horizontal bands (CSS grid
    rows), each band representing a layer.
- **Where in the section?** After the prose intro that describes what's
  being diagrammed, before the deeper details.

You may produce **zero to three diagrams per source file**. More than
three crowds the lesson. If a source genuinely needs many, it probably
should have been split further upstream — note that to the user but
proceed.

**Critical:** the prose stays the primary medium. Diagrams are
augmentations. Don't move prose content *into* the diagram and delete
it from the page.

### 4a. Why HTML+CSS, not Mermaid

We use rich HTML+CSS diagrams, not Mermaid. Reasons:

1. **Reliability.** Mermaid's CDN ESM import fails silently in many
   browsers (`file://` origin, Firefox sometimes, sandboxed viewers).
   HTML+CSS renders everywhere a `<div>` renders — which is everywhere.
2. **Richness.** We can use gradients, icons (emoji or Unicode), hover
   states, custom typography, color-coded legends, and spatial layouts
   (CSS grid) that Mermaid can't express.
3. **Offline-by-default.** Lessons are double-click-to-open files on
   the user's machine. No external script downloads = lessons work on
   planes, in coffee shops with bad WiFi, and inside restricted corp
   networks where CDN domains may be blocked.
4. **Lessons are already HTML.** We're not in a markdown context where
   embedding a diagram language helps; we're already in HTML where
   styled `<div>`s are the native medium.

When in doubt, the cheapest diagram is a CSS grid of labeled boxes
with arrows between them. Build up from there.

### 5. Compose the HTML

Use this template (adjust the inline styles to match the desired
visual feel; the structure is load-bearing):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><lesson title></title>
  <style>
    :root {
      --bg: #fafafa;
      --fg: #1a1a1a;
      --muted: #666;
      --accent: #0066cc;
      --code-bg: #f0f0f0;
      --confidential-bg: #fff4e5;
      --confidential-fg: #8a4a00;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      max-width: 860px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
      color: var(--fg);
      background: var(--bg);
      line-height: 1.65;
    }
    .player-bar {
      position: sticky; top: 0;
      background: var(--bg);
      border-bottom: 1px solid #e0e0e0;
      padding: 1rem 0;
      margin-bottom: 2rem;
      z-index: 10;
    }
    .player-bar audio { width: 100%; }
    .confidential-banner {
      background: var(--confidential-bg);
      color: var(--confidential-fg);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    h1 { font-size: 1.75rem; line-height: 1.3; margin-bottom: 0.5rem; }
    h2 { font-size: 1.35rem; margin-top: 2.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #e0e0e0; }
    h3 { font-size: 1.1rem; margin-top: 2rem; }
    .lesson-meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 1rem; }
    .lesson-meta a { color: var(--accent); }
    p { margin: 0.75rem 0; }
    code { background: var(--code-bg); padding: 0.125rem 0.25rem; border-radius: 3px; font-size: 0.9em; }
    pre { background: var(--code-bg); padding: 1rem; border-radius: 4px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; }
    th { background: #f0f0f0; }
    .diagram { margin: 1.5rem 0; padding: 1.25rem; background: white; border: 1px solid #e0e0e0; border-radius: 6px; }
    .diagram-caption { font-size: 0.875rem; color: var(--muted); margin-top: 0.75rem; font-style: italic; text-align: center; }
    .related { background: white; border: 1px solid #e0e0e0; padding: 1rem 1.5rem; border-radius: 4px; margin-top: 2rem; }
    .related h2 { border: none; margin-top: 0; }

    /* Diagram primitive: labeled box */
    .box { display: inline-block; padding: 0.6rem 1rem; border-radius: 6px; background: #e8f4f8; border: 1px solid #0066cc; font-size: 0.9rem; line-height: 1.3; text-align: center; min-width: 120px; }
    .box.accent { background: #ffd966; border-color: #b8860b; font-weight: 600; }
    .box.muted { background: #f0f0f0; border-color: #999; color: #555; }
    .box.danger { background: #ffd6d6; border-color: #a30000; }
    .box.ok { background: #c6efce; border-color: #0a7d2a; }

    /* Diagram primitive: arrow */
    .arrow { display: inline-block; padding: 0 0.5rem; color: var(--muted); font-size: 1.2rem; font-weight: bold; }
    .arrow-down { display: block; text-align: center; color: var(--muted); font-size: 1.2rem; margin: 0.25rem 0; }

    /* Diagram primitive: flex row of boxes-with-arrows */
    .flow-row { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 0.25rem; }

    /* Diagram primitive: CSS-grid layouts */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
    .grid-stack { display: grid; gap: 0.5rem; }

    /* Diagram primitive: numbered sequence card */
    .seq-step { display: grid; grid-template-columns: 2rem 1fr; gap: 0.75rem; align-items: start; padding: 0.6rem 0.75rem; background: white; border-left: 3px solid var(--accent); border-radius: 0 4px 4px 0; margin: 0.4rem 0; }
    .seq-step .num { background: var(--accent); color: white; border-radius: 50%; width: 1.75rem; height: 1.75rem; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .seq-step .body strong { display: block; margin-bottom: 0.2rem; }

    /* Diagram primitive: layer stack (horizontal bands) */
    .layer-stack > .layer { padding: 0.6rem 1rem; border-radius: 4px; margin: 0.25rem 0; background: #e8f4f8; border-left: 4px solid #0066cc; }
    .layer-stack > .layer.muted { background: #f0f0f0; border-left-color: #999; }
  </style>
</head>
<body>
  <!-- audio player only when audio exists -->
  <div class="player-bar">
    <audio controls preload="metadata">
      <source src="audio.mp3" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>
  </div>

  <!-- confidentiality banner only when source frontmatter requests it -->
  <div class="confidential-banner">
    🔒 <strong>Confidential — internal only.</strong> Derived from
    <code><source-path></code>. Do not share externally.
  </div>

  <h1><lesson title></h1>
  <div class="lesson-meta">
    <!-- include any of: source link, audio/visual language pair, chapter number -->
    Lesson derived from <a href="<source-rel-or-url>"><source-label></a>.
    Audio: Spanish · Visual: English.
  </div>

  <p><opening paragraph from source></p>

  <!-- per H2 section: -->
  <h2><section title></h2>
  <p>...</p>

  <!-- Pattern A: simple horizontal flow -->
  <div class="diagram">
    <div class="flow-row">
      <div class="box">Component A</div>
      <span class="arrow">→</span>
      <div class="box accent">Component B</div>
      <span class="arrow">→</span>
      <div class="box">Component C</div>
    </div>
    <div class="diagram-caption"><caption explaining what the diagram shows></div>
  </div>

  <!-- Pattern B: numbered sequence (call chain) -->
  <div class="diagram">
    <div class="grid-stack">
      <div class="seq-step"><span class="num">1</span><div class="body"><strong>Actor → Recipient</strong>Brief description of step one.</div></div>
      <div class="seq-step"><span class="num">2</span><div class="body"><strong>Recipient → Service</strong>Step two description.</div></div>
    </div>
    <div class="diagram-caption">End-to-end call chain.</div>
  </div>

  <!-- Pattern C: side-by-side comparison -->
  <div class="diagram">
    <div class="grid-2">
      <div class="box ok"><strong>Option A</strong><br/>Pros and cons here</div>
      <div class="box danger"><strong>Option B</strong><br/>Pros and cons here</div>
    </div>
    <div class="diagram-caption">Trade-off between A and B.</div>
  </div>

  <!-- Pattern D: layered architecture -->
  <div class="diagram">
    <div class="layer-stack">
      <div class="layer">Presentation layer</div>
      <div class="layer">Business logic</div>
      <div class="layer muted">Data access</div>
    </div>
    <div class="diagram-caption">Three layers of the system.</div>
  </div>

  <p>...more prose...</p>

  <!-- repeat for each section -->

  <!-- preserve when present in source -->
  <h2>Source references</h2>
  <table>
    <thead><tr><th>Topic</th><th>Where it lives</th></tr></thead>
    <tbody>
      <tr><td>...</td><td><code>...</code></td></tr>
    </tbody>
  </table>

  <div class="related">
    <h2>Related</h2>
    <ul>
      <li><a href="..."><sibling lesson></a></li>
    </ul>
  </div>
</body>
</html>
```

Key composition rules:

- **Markdown → HTML conversion** is straightforward — headings,
  paragraphs, lists, tables, code spans, code blocks. Keep it
  faithful.
- **Acronym discipline carries over.** First-mention expansions from
  the source stay in the HTML; don't strip them.
- **Cross-links use relative paths.** Source markdown links like
  `[Chapter 2](chapter-2.md)` become `<a href="../chapter-2.md">`. Or
  `../chapter-2/index.html` if both lessons exist — prefer lesson-to-
  lesson links when possible.
- **Use `<code>` for literal symbol/file names**, not for emphasis.

### 6. Write the lesson

Write the HTML to `<output-dir>/<source-slug>/index.html`. Create the
folder if missing. Default `<output-dir>` is `lessons/` sibling to the
source file; the user can override with `--out`.

For the audio: if it's already at a stable path, **reference it via
relative URL** rather than copying — avoids duplication and keeps the
lesson tracking the canonical audio. If the audio path would require
`../../../` escaping outside the project, copy the MP3 into the lesson
folder as `audio.mp3`.

### 7. Cross-link to siblings

If sibling `<output-dir>/<other-slug>/index.html` files already exist
in the same `lessons/` folder, update each one's `Related` section to
link to the new lesson (and the new one to them). Do this idempotently
— if a link is already there, leave it.

### 8. Report back

Surface:

- Lesson path: `<output-dir>/<source-slug>/index.html`
- Audio path (linked from the HTML), or "no audio" if you proceeded
  without.
- Number of diagrams generated, with their captions.
- Total word count preserved (sanity check vs source).
- Quick how-to: *"Double-click `index.html` to open in your default
  browser, hit play if audio is present, scroll through as you listen."*
- Note that the page is self-contained and works offline.

## Anti-patterns

- ❌ Lossy summarization. The HTML is a *companion* to the audio, not
  a TL;DR. If you find yourself shortening to "make it look cleaner",
  stop.
- ❌ Diagram-everywhere. Some sections are pure narrative and don't
  need a visual. Forcing a diagram in adds visual noise.
- ❌ Linking external CSS/JS or CDN-loaded libraries. Self-contained =
  double-clickable offline. **No exceptions** — including Mermaid, D3,
  Chart.js, or any other diagramming library. Render diagrams as
  HTML+CSS only.
- ❌ Auto-publishing. The HTML is for local viewing. Never push it to
  a public web server. If a source is flagged confidential, definitely
  not.
- ❌ Editing the source markdown. The source is canonical; the HTML
  is derived. Edit the source if you need content changes, then
  regenerate.
- ❌ Generating audio inline. Use the existing `generate-audio` skill
  or `instructor-teacher` to orchestrate. This skill consumes
  audio; it doesn't produce it.
- ❌ Hard-coding the title. Pull it from frontmatter or the first H1
  so the HTML and source stay in sync if the user retitles.

## Hand-offs

- **From `workflow-course-to-audio`** — after it writes per-unit markdown to
  `.kai/runs/learn/<goal-slug>/<NN>-extract-<source-slug>/raw/`, the natural next step is
  the `instructor-teacher` agent, which uses this skill plus
  `generate-audio` to produce paired lessons.
- **From the user directly** — they can also invoke this skill
  standalone on any markdown file that has matching audio.

## See also

- `instructor-teacher.agent.md` — the agent that orchestrates
  this skill + `generate-audio` to produce complete lessons.
- `workflow-course-to-audio.agent.md` — extracts course/cert/docs pages into the
  per-unit markdown this skill can consume.
- `generate-audio/SKILL.md` — produces the MP3 the lesson embeds.

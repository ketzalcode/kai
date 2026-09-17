# ASCII motion in kai-creative — design

**Date:** 2026-09-17
**Status:** proposed, pending operator review
**Package:** `kai-creative`
**Decision this spec exists to settle:** does ASCII motion need a new agent, one
skill, or several skills — and what must exist for them to work?

**Revision note:** third draft. An independent review corrected a factual error
about which agent routes creative methods, argued the skill count down from
three to two, and cut two source tiers out of v1 (§13). The operator then
established the web clip bundle as a co-primary artifact alongside the README
GIF (§7, §7a).

---

## 1. The request, and the honest constraint

The operator wants to type something like *"ascii video of a dog walking"* and
receive an ASCII-motion clip, because generative video is expensive and ASCII
looks deliberately retro-futuristic in demos.

Research into the open-source landscape (2026-09-17) returns one finding that
governs this design:

> **Prompt-to-coherent-ASCII-video does not exist as mature tooling.** The
> category is thin. Searches resolve to video→ASCII filters mislabeled as "AI
> ASCII generators", still-image diffusion followed by conversion, LLM-authored
> storyboards that are slideshows rather than motion, or single-maintainer
> demos with no media export.

The verified exceptions prove the rule. `jmcdice/ascii-movie-project` asks an
LLM for scenes and plays them in a CLI — an illustrated ASCII slideshow, not
temporally coherent video, with no polished export.
`CameronFoxly/Ascii-Motion` (906★, TypeScript) is a capable browser editor with
an MCP server, but only its core is MIT; auth, cloud, marketing and docs
packages are proprietary, and it is a young, self-described "vibe-coded"
project.

What *is* mature is the second half of the pipeline. The design splits the
problem where the maturity boundary actually falls:

```
prompt ──► motion source ──► ASCII conversion ──► shareable artifact
           (immature,          (mature:            (mature:
            tiered,             movie-ascii,        VHS, FFmpeg,
            licensed)           Chafa)              browser frames)
```

**The prompt drives the treatment and the source selection. It does not
conjure footage.** A skill implying otherwise would be lying to the operator,
which this repo's operating rules forbid.

---

## 2. Decision: no new agent, orchestrated by the existing production workflow

`kai-creative` ships three agents. Their routing authority is **enforced by
test**, not convention — `test/creative-agent-contract-self-test.mjs` asserts an
`allowedActiveCreativeRoutes` allowlist per agent:

| Agent | Allowed active creative routes (enforced) |
| --- | --- |
| `creative-lead-design` | `html-block-diagrams`, `mockups-ascii`, `mockups-html` |
| `creative-lead-video` | **none — empty list** |
| `workflow-creative-demo-production` | `video-align-narration`, `video-create-narration`, `video-render-zoom` |

This corrects a wrong assumption in the first draft. `creative-lead-video` does
not route `video-render-zoom` and cannot route anything: its agent file states
"Do not record, render, synthesize, mix, or publish", and the test enforces
that with an empty allowlist. Rendering skills are routed by
`workflow-creative-demo-production`, which owns production.

**Decision: add no agent. `workflow-creative-demo-production` gains the new
routes; its allowlist and `requiredRoutes` in the self-test are extended.**

The case for a dedicated `creative-lead-ascii` agent is real and was argued
before being rejected: source interpretation, silhouette design, typography,
palette, glyph selection and motion legibility do collectively resemble an art
direction. But that lane currently overlaps video direction, visual design and
production, and is not yet distinct enough to justify another persona. An agent
is a **lane owner**; a skill is a **procedure**. Adding an agent later costs one
file; removing a shipped agent removes an install name, which this repo has
already learned is a major-version event.

Revisit only if ASCII becomes a house visual language with its own art
direction rather than a rendering treatment.

---

## 3. Decision: two skills

Package naming convention from the existing tree: `mockups-ascii`,
`mockups-html`, `html-block-diagrams`, `video-create-narration`,
`video-align-narration`, `video-render-zoom` — domain-prefixed, hyphenated,
gerund-free.

| Skill | One clear purpose | Stops at |
| --- | --- | --- |
| `ascii-motion-source` | Resolve a brief into an actual motion source with a recorded rights basis | A clip on disk plus a provenance record. No conversion. |
| `ascii-motion-render` | Preview, convert, export and review an ASCII treatment of that clip | The requested operation's output, with creation and inspection reported separately. |

**Why two, not three.** The first draft split export from render. That split was
wrong for two reasons. First, the house precedent is against it:
`video-render-zoom` bundles explain, compile, inspect, render and review into a
single skill selected by an operation table. Second, render and export share
one profile — dimensions, frame rate, colour mode, engine — and the primary
engine exports GIF/MP4/HTML *directly from the clip*, so a frames-directory
handoff between two skills would have been a fiction that the HTML output
could not even satisfy.

**Why two, not one.** Sourcing carries the licensing gate. Folding it into the
render skill is exactly where a rights check gets skipped, and an operator who
brings their own footage should never load the sourcing procedure at all.

`ascii-motion-render` uses the `video-render-zoom` operation-table shape:

| Requested operation | Inputs and stopping point |
| --- | --- |
| Explain readiness | A profile and probe results; explain grid, aspect, ramp and fps arithmetic, then stop. |
| Preview a still | A clip, a source moment, a profile; return one converted frame at target dimensions. |
| Preview a sample | A clip and a profile; return a 1–2 second converted sample for temporal judgment. |
| Convert and export | A clip, a renderable profile, a format, the engine present, and execution authority; report the real output and inspection status. |
| Build a web bundle | One or more named clips and a profile; emit a state-addressable clip bundle plus the player asset (§7a). |
| Review an export | An existing artifact; produce the requested contact sheet or frame sampling, not a new encode. |

An explain-only request ends at explanation. A printed command is not a render.

Both skills carry `user-invocable: true`, following `mockups-ascii` and
`video-render-zoom`.

---

## 4. `ascii-motion-source`

### Purpose

Turn a stated intent into a real clip with a recorded rights basis, or stop
honestly.

### The tier ladder — v1 scope

The skill walks the ladder top-down and stops at the first tier that produces a
usable clip. **Only tiers 1 and 2 are in v1.**

| Tier | Source | v1? | Rationale |
| --- | --- | --- | --- |
| 1 | Operator-supplied video/GIF | **yes** | Zero licensing ambiguity, best quality control, no new machinery. |
| 2 | Procedural template from a small fixed library | **yes** | Motion is ours, licence is ours, no network, no code generation. Silhouettes are pre-simplified, which survives ASCII conversion unusually well. This is the only honest prompt→motion path available at acceptable risk. |
| 3 | Licensed stock search (Pexels/Pixabay) | no — own spec | Needs API integration, credentials, rate limits, authorisation flow and per-asset licence capture. A product of its own. |
| 4 | Still image + Ken Burns / parallax / warp | no — own spec | Needs segmentation, rigging and interpolation. |
| 5 | LLM-authored scene **program** | **no — removed** | See §13. |

**A "usable clip" is defined as:** a decodable video or GIF, ≥ 1.0 s and
≤ 30 s, with at least one moving region covering ≥ 5% of frame area, and a
recorded rights basis. Anything else is reported as a source gap, not
converted anyway.

### v1 template library

Exactly three shipped templates, each a parameterised headless loop with a
stable id and a documented parameter schema:

- `walk-cycle` — a side-on quadruped or biped silhouette, parameters: subject
  silhouette set, stride rate, direction, ground line.
- `orbit` — an object circling a centre, parameters: body count, radii, speed,
  trail.
- `rain` — falling particles with wind, parameters: density, angle, speed,
  splash.

Three is the whole library. The prompt selects and parameterises a template; it
does not author one. If no template fits the prompt, the skill says so and
offers tier 1 — it does not stretch `rain` into a dog.

### Provenance — required for every tier, including supplied media

"Operator supplied" does **not** mean "operator owns it". Supplied media may
itself be stock, copied, or attribution-bound. Every completed source step
emits a provenance record:

```json
{
  "schema": "kai.ascii-motion-provenance/v1",
  "tier": 1,
  "origin": "<absolute path | template id>",
  "rights_basis": "operator-asserted | template-owned",
  "attribution_required": false,
  "attribution_text": null,
  "network_fetch_authorised": false,
  "recorded_at": "2026-09-17"
}
```

`rights_basis: "operator-asserted"` records what the operator stated. It does
not claim the skill verified ownership, because it did not.

### Boundaries

- Never fetch from a network source in v1; tier 3 does not exist yet.
- Never present a template result as footage of a real subject.
- Never claim a licence that was not read.

---

## 5. `ascii-motion-render` — engine and adapter

### Engine decision: `movie-ascii` primary, pinned, behind a specified adapter

| Engine | Why | Why not primary |
| --- | --- | --- |
| **`movie-ascii`** (Python, MIT, new Mar 2026, v0.1.1) | Single `pip install`. Video/GIF/image input. Exports PNG/GIF/MP4/self-contained HTML directly. Custom ramps, braille and block sets, truecolor, seeking. Explicitly lists Windows Terminal as suitable; bundles `imageio-ffmpeg`. | v0.1.x, three months old. Immature. Must be pinned and isolated. |
| **Chafa** (C, LGPL-3.0+, 5,257★, 2026-09-06) | The best mature raster→character engine: symbol/colour/dither control, C/Python/WASM bindings. | No GIF/MP4 export — plays in a terminal. Native Windows wants WSL or MSYS2. Optional backend, never required. |
| `video-to-ascii` (1,864★) | Popular | README says **Linux/macOS only**. Disqualified. |
| `jp2a` (1,071★) | Often cited | Last commit **2017**, JPEG-only, no timeline. Abandoned. |
| `ascii-image-converter` (~3.5k★) | Portable, braille | No video timeline; last push 2024-04; per-frame process startup and temporal consistency unsolved. |

Betting a shipped skill on a v0.1.x package is only defensible if the mitigation
is real. The first draft asserted an adapter without specifying one. It is
specified here.

### Adapter contract

The skill never invokes `movie-ascii` directly. It invokes
`scripts/ascii-motion.mjs`, which owns a backend interface:

- **Version pinning.** Exactly one tested `movie-ascii` version is recorded in
  the helper and asserted by `--probe`. An untested version is reported as
  unverified, not used silently.
- **Capability negotiation.** Each backend declares what it supports —
  `{ formats, colour_modes, glyph_sets, direct_export, max_dimensions }`.
  A profile requesting an unsupported capability fails at validation with a
  named reason, before any work.
- **Canonical intermediate representation.** `kai.ascii-motion-frames/v1`: a
  JSON manifest plus per-frame cell grids of
  `{ glyph, fg, bg }`, with grid dimensions, source timestamps and the profile
  that produced them. This is the backend-neutral unit. A backend that can only
  emit its own images is used in direct-export mode and *declares* that it did
  not produce an IR, rather than pretending to. **A web bundle (§7a) requires a
  real IR**, so direct-export-only backends cannot serve that format and must
  report `unsupported` rather than substituting a baked artifact.
- **Error and output normalisation.** A single result shape:
  `{ status: ok | unsupported | missing-dependency | failed, outputs[], notes[] }`.
  Backend stderr is carried in `notes`, never interpreted as success.
- **Execution limits.** A per-operation timeout, cancellation that removes
  partial output, and a temp lane cleaned on both success and failure. A
  partial frame set is never reported as a completed conversion.

Replacing the engine then touches the helper's backend module, not the profile
schema, the skill text, or the tests.

### Render profile

```json
{
  "schema": "kai.ascii-motion-profile/v1",
  "grid": { "cols": 120, "rows": 34 },
  "cell_aspect": 0.5,
  "ramp": "@%#*+=-:. ",
  "ramp_polarity": "light-on-dark",
  "glyph_set": "ascii | braille | half-block",
  "colour": "mono | ansi16 | ansi256 | truecolor",
  "palette_mode": "fixed",
  "fps": 15,
  "dither": "none | ordered",
  "output": { "width_px": 800 }
}
```

The profile is the reusable unit: tune once, re-export at several widths.
`grid` and `fps` are conversion-bound; `output.width_px` is export-bound and is
the only field a re-export may change without re-converting. The first draft
claimed size changes needed no re-render; that was only true of pixel width,
and the schema now makes the distinction explicit.

---

## 6. Quality levers

These are not optional polish — they are the difference between "technically
ASCII" and "readable", which §12 names as the principal risk.

- **Character ramp.** Short ramps reduce temporal shimmer; long ramps give
  gradients but noisy texture. Separate ramps for light-on-dark and
  dark-on-light. Glyph ink coverage is font- and size-dependent, so a ramp
  tuned for one output font is not universal.
- **Cell aspect ratio.** Terminal cells are taller than wide, so one pixel per
  cell stretches vertically. Measure the target font's cell width and line
  height. **Do not hard-code 2:1** — VHS and browser exports commonly use line
  height 1.2–1.5, not 2.0. Hence `cell_aspect` is a profile field.
- **Dithering.** Independent per-frame error diffusion crawls. Use a stationary
  ordered matrix; prefer dithering the background only; avoid high-frequency
  dither in GIF, where palette quantisation compounds flicker.
- **Colour.** Fixed or slowly-changing palette across the clip; per-frame
  palettes flicker. Mono is clearest and compresses best; ANSI-16/256 reads as
  deliberate retro; truecolor suits MP4/web but emits huge terminal streams, so
  group same-colour runs rather than emitting an SGR code per cell.
- **Braille / half-block.** Braille packs a 2×4 dot matrix per cell — eight
  subpixels, excellent silhouettes — but it is Unicode art, not strict ASCII,
  and depends on font support. Half-blocks `▀`/`▄` give two colour samples per
  cell. Both offered; neither default.
- **Frame rate.** 10–20 fps for terminal playback; 8–12 fps reads as
  intentional for retro; 12–20 fps for GIF; render 24–30 fps for MP4 even when
  content changes at 12–15. Decouple simulation time from render speed; never
  use a chain of sleeps as the timing source of truth.
- **Structure-aware edges (Acerola technique)** — *designed for, not built*.
  Difference-of-Gaussians → threshold → Sobel gradient direction → per-cell
  reduction → directional glyphs `- | / \` for edges, density ramp elsewhere.
  This preserves silhouettes that pure luminance loses. A video version
  **requires temporal stabilisation** — reuse edge orientation from nearby
  frames, or glyph direction flips every frame. Deferred past v1; the
  `kai.ascii-motion-frames/v1` cell record must not preclude carrying an edge
  orientation field later.

### The two preview gates

A single still tests spatial readability but cannot test temporal shimmer,
unstable glyph orientation, palette flicker, pacing or GIF quantisation — which
are most of the failure modes above. So there are two gates:

1. **Still preview** at target dimensions — settles grid, aspect, ramp, contrast.
2. **Sample preview**, 1–2 seconds encoded in the target format — settles
   shimmer, flicker, fps and quantisation.

Full conversion runs only after both. Tuning happens on one frame and one
second, not on forty frames.

---

## 7. Artifacts and export

There are **two co-primary artifacts**, serving two different jobs:

| Destination | Format | Status | Rationale |
| --- | --- | --- | --- |
| Product surface / website | **web clip bundle + player** (§7a) | **co-primary** | State-addressable. The only artifact that can emulate an AI persona reacting to app state — idle, talking, thinking. Crisp, selectable text; a few KB gzipped. |
| GitHub README | **looping GIF**, 600–900 px, 12–20 fps | **co-primary** | The only format that reliably embeds in Markdown. **MP4 cannot be embedded directly in Markdown** — that constraint decides this default. |
| Slide deck / social | MP4 (H.264) | secondary | Preserves colour far better than GIF's 256-colour palette; dramatically smaller for longer clips. |
| Single baked web animation | self-contained animated HTML | secondary | `movie-ascii` emits it directly. One clip, no entry points — use the bundle when state matters. |
| Vector | animated SVG | **not in v1** | Compatibility inconsistent; some README renderers sanitise or refuse it. |

---

## 7a. The web clip bundle

### Why a baked format cannot do this

GIF, MP4 and self-contained HTML are all **baked**: one clip, start to finish,
no entry points. Emulating an AI that idles, then talks, then settles needs a
**runtime component with states**, where the host application decides what
plays and when. Swapping `<img src>` between GIFs approximates it badly —
palette flicker on swap, no loop-phase synchronisation, no transitions, and no
way to overlay streaming text.

### The asset already exists

`kai.ascii-motion-frames/v1` (§5) was specified as a backend-neutral IR purely
to make the engine swappable. That IR **is** the web asset. Character grids
compress extremely well; a 2 s 80×24 clip is a few KB gzipped, far smaller than
the equivalent GIF. Exposing it costs little beyond what the adapter already
builds.

### Bundle

```json
{
  "schema": "kai.ascii-motion-bundle/v1",
  "profile": { "grid": { "cols": 80, "rows": 24 }, "colour": "ansi256", "fps": 12 },
  "clips": {
    "idle":  { "frames_ref": "idle.frames.json",  "loop": true, "loop_from": 0 },
    "talk":  { "frames_ref": "talk.frames.json",  "loop": true, "loop_from": 2 },
    "think": { "frames_ref": "think.frames.json", "loop": true, "loop_from": 0 }
  },
  "default_clip": "idle"
}
```

Every clip in a bundle shares one grid, palette and fps. A clip whose profile
disagrees is rejected at validation — mixed grids cause a visible resize snap
on switch.

### Player

A small dependency-free ES module shipped as a helper asset, rendering to a
`<pre>` or canvas:

```js
const p = await AsciiMotion.mount('#ai', './bundle.json');
p.play('talk');          // switches on the next loop boundary
p.play('idle', { now: true });
p.queue('think', 'idle');
p.stop();
```

**Clip-boundary switching is the load-bearing behaviour.** Switching mid-loop
snaps; switching at `loop_from` reads as intentional. `{ now: true }` is the
explicit override for interrupts.

### The "AI talking" pattern

For a talking persona, the cheap and proven technique is **limited animation**:
three or four mouth/pose states cycled on a cadence while text streams — not
lip-sync to real audio. It reads well in ASCII, needs no audio analysis, and
the `walk-cycle` template machinery (§4) already produces this shape of asset.

### Boundaries

The host application owns orchestration. The player exposes `play`, `queue`,
`stop` and a `clip-ended` event; it does not subscribe to token streams,
inspect audio, or decide what the persona should be doing.

Prefer `movie-ascii` direct export. Where deterministic typography matters more
— house font, exact dimensions, window chrome — `charmbracelet/vhs` (20,922★,
MIT, 2026-09-09, WinGet/Scoop on Windows) renders scripted terminal tapes to
GIF/MP4/WebM, requiring `ttyd` and FFmpeg.

`asciinema` + `agg` produce excellent gifski-optimised GIFs but asciinema's
official install targets Unix and wants WSL — offered, not default.
`termtosvg` is **archived since 2020** and Unix-PTY-dependent; do not build on
it. `terminalizer`'s maintenance has slowed and its Electron/Puppeteer stack is
heavier than VHS.

**Never screen-record a terminal manually.** Deterministic frame rendering
avoids cursor flashes, dropped frames, font substitution and desktop-scaling
artefacts.

Verify that a claimed output file exists, and report creation and inspection
status separately — rendering is not review, and review is not publication.
This mirrors `video-render-zoom`'s existing contract.

---

## 8. Helper: `scripts/ascii-motion.mjs`

Follows `plugins/kai-creative/scripts/demo-zoom.mjs` exactly: a Node helper the
skill invokes by absolute path, resolved by walking up from the loaded skill's
base directory to the kai-creative provider root — never from cwd, never from a
search hit in another installed pack.

```text
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --probe
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --template <id> --params "<json>" --out "<clip>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --explain --profile "<profile>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --preview "<clip>" --at <seconds> --profile "<profile>" --out "<png>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --sample "<clip>" --seconds 2 --profile "<profile>" --format gif --out "<sample>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --convert "<clip>" --profile "<profile>" --format gif|mp4|html --out "<artifact>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --bundle "<clips.json>" --profile "<profile>" --out "<bundle-dir>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --review "<artifact>" --out "<sheet>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --print --convert "<clip>" --profile "<profile>"
```

These are independent operations, not an instruction to run every command.

### Dependency stance

Degrade gracefully; never auto-install. `--probe` reports what is present.

| Dependency | Required for | If absent |
| --- | --- | --- |
| Node | everything | hard requirement, already a repo baseline |
| Python + pinned `movie-ascii` | conversion, export | report it, print the `pip install` command, do not run it |
| FFmpeg | MP4 encode, extraction, scaling | `--print` prepares a command for a compatible host |
| VHS + ttyd | deterministic typography path | optional; fall back to direct export |
| Chafa | high-fidelity backend | optional; never required |

This matches `video-render-zoom`, which already states that when ffmpeg is
absent, report the missing tool and the unexecuted render explicitly, and "do
not install tools or evaluate printed stdout automatically." A marketplace
plugin that silently installs a ~100 MB binary is not acceptable.

Templates render headlessly through the helper with no new npm runtime
dependency; `PACK_RUNTIME_DEPENDENCIES.creative` stays `['lectoria']`.

---

## 9. Routing and contract compliance

Each skill loads `kai-core-contract-v1` before its first other core skill, with
no `**Inherits:**` line and no dependency-guard block. The fallback sentence is
**per-skill and honest**, not shared boilerplate:

- `ascii-motion-source` — without compatible core, bounded tier advice and
  rights questions from supplied facts may continue; no `.kai` state, no
  durable provenance record.
- `ascii-motion-render` — without compatible core, bounded explanation of a
  supplied profile or command preparation may continue; no coordinated
  rendering, no durable artifact, no `.kai` state.

Both then load `kai-core-workspace-paths` before persistent output,
`kai-core-asset-producing` when retaining a durable profile, provenance record
or artifact, and `kai-core-asset-closing` at disposition. Raw frames and
intermediate renders live in the private run lane, matching
`video-render-zoom`.

`workflow-creative-demo-production` gains two conditional routes, worded like
its existing ones ("Invoke `video-render-zoom` only for an explicit focus
operation or evidenced…"), and `test/creative-agent-contract-self-test.mjs` is
updated in the same PR: `finalCreativeSkills`, and the production agent's
`requiredRoutes` and `allowedActiveCreativeRoutes`.
`creative-lead-video`'s empty allowlist is left untouched.

---

## 10. Release obligations

Behaviour-sensitive change to `plugins/` and `scripts/`, so the same PR must:

1. Bump `plugin.json`, `package.json`, and both version fields in
   `.github/plugin/marketplace.json`; regenerate the eight package manifests
   with `npm run pack-preview -- --write`.
2. Add a dated `CHANGELOG.md` entry with its `[x.y.z]:` compare link and
   refresh the README `## Status` stamp.
3. Register both skill ids in `CATEGORIES` in `scripts/generate-catalog.mjs`
   (skill category `Creative methods`), run `npm run docs:generate`, commit
   `docs/reference/agents-and-skills.md`.
4. Update `test/creative-agent-contract-self-test.mjs` per §9.
5. Run `npm test`.

Two added skills, no removed install name. Post-1.0 semver: **minor** bump.

---

## 11. Success criteria

1. Given an operator-supplied video or GIF on Windows with Python and FFmpeg
   present, `ascii-motion-render` produces a looping GIF and an MP4 at a stated
   size.
2. That GIF renders inline in a GitHub README at 600–900 px, and the moving
   subject is identifiable without being told what it is.
3. Both preview gates work: a still preview and a 1–2 s sample are produced and
   shown before full conversion is offered.
4. A profile can be saved and re-exported at a different `output.width_px`
   without re-converting; changing `grid` or `fps` correctly forces a
   re-conversion.
5. With FFmpeg absent, `--probe` reports it, the skill prints the command it
   would have run, reports the render as not performed, and installs nothing.
6. With an untested `movie-ascii` version present, `--probe` reports it as
   unverified rather than proceeding silently.
7. Every clip, including operator-supplied, carries a provenance record with a
   stated rights basis; a clip without one is reported incomplete.
8. A prompt naming a real-world subject with no supplied footage and no fitting
   template ends with an honest gap statement, not an invented asset and not a
   stretched template.
9. A cancelled or failed conversion leaves no partial artifact reported as
   complete.
10. A multi-clip web bundle mounts in a plain HTML page, and `play('talk')`
    switches on the next loop boundary without a visible resize or palette
    snap; `{ now: true }` switches immediately.
11. A bundle whose clips disagree on grid, palette or fps is rejected at
    validation with a named reason, not shipped.
12. A backend running in direct-export mode reports `unsupported` for the web
    bundle format rather than emitting a baked artifact in its place.

---

## 12. Principal risk

**The feature produces something technically ASCII that nobody wants to look
at.** Luminance-only conversion at README size loses silhouettes; the dog
becomes grey noise.

Mitigations in order of force: the two preview gates before full conversion;
tier 2 templates whose silhouettes are pre-simplified; ramp, cell aspect,
colour and glyph set as first-class named profile fields rather than buried
defaults; and a frame IR that can carry edge orientation once temporal
stabilisation makes structure-aware ASCII safe for video.

---

## 13. Explicitly not in v1

- **Prompt-to-generative-video of any kind.**
- **LLM-authored scene programs (former tier 5) — removed outright.** It
  required a browser/p5 runtime the dependency stance does not provide, and it
  meant executing LLM-authored JavaScript with no sandbox, no filesystem or
  network restriction, no resource limit and no execution timeout. A later spec
  may revisit it as a *constrained declarative scene schema*, never as
  executable generated code.
- **Stock search (tier 3)** — needs its own spec: API integration, credentials,
  rate limits, authorisation flow, per-asset licence capture. GIPHY is excluded
  permanently as a source: its API terms require "Powered by GIPHY"
  attribution, standard integrations may not cache or store copies, and much of
  its catalogue is entertainment-partner content not licensed for arbitrary
  derivative marketing.
- **Still-image animation (tier 4)** — needs its own spec: segmentation,
  rigging, warping, interpolation. Note for that spec: frame interpolation
  smooths supplied poses, it does not invent a correct walk cycle.
- Structure-aware edge detection with temporal stabilisation.
- **Web bundle scope limits:** no audio lip-sync, no interaction-authoring UI,
  no React/Vue/Svelte wrappers, and no subscription to AI token streams. The
  host application calls `play()`; the player does not orchestrate a persona.
- Animated SVG output; real-time terminal playback; audio and soundtrack sync.
- Cloud rendering, batch asset management, a GUI.
- Chafa as a required dependency.

---

## Appendix — source snapshot (2026-09-17)

| Project | Stars | Licence | Last push | Role here |
| --- | --- | --- | --- | --- |
| `marabunta-labs/movie-ascii` | n/a (v0.1.1) | MIT | Mar 2026 | primary engine, pinned, behind adapter |
| `hpjansson/chafa` | 5,257 | LGPL-3.0+ | 2026-09-06 | optional backend |
| `charmbracelet/vhs` | 20,922 | MIT | 2026-09-09 | deterministic export path |
| `asciinema/agg` | 1,724 | GPL-3.0 | 2026-08-14 | optional GIF path (WSL) |
| `CameronFoxly/Ascii-Motion` | 906 | MIT core only | 2026-08-24 | manual polish, not a dependency |
| `Iapetus-11/To-ASCII` | 79 | MIT | 2026-09-17 | reference implementation |
| `joelibaceta/video-to-ascii` | 1,864 | MIT | 2025-09-27 | rejected — Linux/macOS only |
| `nbedos/termtosvg` | 9,756 | BSD-3 | **archived 2020** | rejected |
| `cslarsen/jp2a` | 1,071 | GPL-2.0 | **2017** | rejected |

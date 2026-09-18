# ASCII motion fidelity: photo-derived sprites — design

Supersedes nothing. Extends `2026-09-17-creative-ascii-motion-design.md`
(the v1 design) and depends on the code it describes. Read that first.

## 1. The problem, observed rather than predicted

v1 shipped and works. Its output is also, in the operator's words, "very
abstract, like kid drawings". That judgement came from looking at two
generated clips, not from reasoning about the design, and it is correct:
the v1 template library hand-draws subjects from a handful of glyphs, so
a dog is a dog only because a caption says so.

The operator's proposal: use a reference **image** to derive a
high-fidelity ASCII rendering, then animate that rendering procedurally —
moving a mouth, blinking, swaying — exactly as the templates already
animate their crude sprites. No generative video anywhere.

That proposal is adopted, with one correction established below.

## 2. The correction: warp the raster, not the grid

The obvious reading of "animate the ASCII" is to transform cells in the
character grid. That fails, and it fails for a reason worth recording so
nobody re-proposes it.

**Glyphs do not rotate.** A limb drawn from `▄` and `▌` rotated by 30°
has no representation in the character set. Cell-space affine transforms
produce noise, and the better the source sprite the worse the noise looks
against it.

So the transform happens in **raster space**, on the source image, and
each frame is converted to cells independently. Frame 40 is exactly as
sharp as frame 0 because both are first-generation conversions. This
costs one conversion per frame, which §7 makes nearly free.

## 3. The real constraint is occlusion, not video

Video synthesis is not needed and is not in scope. The actual limit on
what a single photo can animate is **occlusion**: move a region and you
expose what was behind it, and a photograph has no behind.

This cleanly partitions the operator's own examples:

| Motion | Amplitude | Exposes background? | Verdict |
| --- | --- | --- | --- |
| Mouth open/close | small | barely | works |
| Blink | small | no (eyelid covers) | works |
| Breathe, sway, bob | small | edge only | works |
| Head turn | medium | yes, and needs unseen geometry | no |
| Walking legs | large | yes, limbs self-occlude | no |

A side-on photograph of a dog hides the far pair of legs entirely. No
amount of cleverness recovers them. **v0 therefore targets
small-amplitude, low-occlusion motion and refuses the rest by name.**

There is a second reason to hold that line. Fidelity and articulation are
in tension: a photo-real ASCII face that blinks reads as alive, while a
photo-real dog whose legs teleport reads as broken. The v1 walk cycle
gets away with its gait *because* it is crude. Raising sprite fidelity
without also constraining motion would make the existing output look
worse, not better.

## 4. Scope

**In v0**

- Photo → high-fidelity ASCII sprite, in colour.
- A rig file declaring named regions and their motion.
- Small-amplitude motion: mouth, blink, breathe, sway, bob, parallax.
- Both v1 artifacts carried through in colour: the web clip bundle and
  the GIF.

**Explicitly not in v0** — §14.

**Deferred, and expected next** — the multi-pose sprite sheet: the
operator supplies several photographs of distinct poses, each is
converted, and the results are sequenced. That is the only honest route
to locomotion at photographic fidelity, it reuses this converter
wholesale, and it is roughly "convert N stills and sequence them" once
v0 exists. It is out of v0 only to keep the surface small.

## 5. Pipeline

```
photo ──► decode ──► raster warp (per frame) ──► convert to cells ──► frames IR v2
           ffmpeg         ▲                          │                      │
                          │                          │            ┌─────────┴────────┐
                       rig.json                  dirty rects   canvas player    raw RGB ──► GIF
                                                                                    ffmpeg
```

Every stage below the decode is ours. The two external calls are both
ffmpeg, which v1 already requires for its GIF path.

### Decode: no new dependency

`ffmpeg -i photo.png -f rawvideo -pix_fmt rgb24 -` yields raw pixels on
stdout. **Verified** on 2026-09-17: a 64×48 test image produced exactly
9,216 bytes. This removes any need for an image-decoding library, which
matters because this repository ships as a plugin and every dependency is
a cost borne by every consumer.

## 6. Renderer

### Decision: pure-JS sub-cell renderer is the baseline

The fidelity gap between v1 output and a recognizable photograph is
closed almost entirely by two properties v1 lacks:

1. **Per-cell foreground and background colour.**
2. **Sub-cell resolution.** A half-block `▀` carries two independent
   colours and so doubles vertical resolution. Quadrants (`▘▝▖▗▚▞█ `)
   double both axes — a 4× effective resolution gain.

Neither requires glyph shape-matching, font rasterization, or any
external tool. Each cell samples its sub-regions, averages, and picks the
block character whose partition best fits. This is implementable in a few
hundred lines and is available on every machine that can run the plugin.

That is the baseline, and it is deliberately not the most sophisticated
option available.

### Decision: Chafa is an optional backend, not a dependency

Chafa (LGPL-3.0-or-later) is the state of the art: it matches candidate
glyph bitmaps against the source, supports large symbol sets, dithering,
and aspect correction, and its C API exposes per-cell character and
colour accessors rather than only an ANSI dump.

It is nonetheless **not** the baseline:

- It is an external binary. v1 established the stance — probe, never
  install, degrade honestly — and that stance exists precisely so a
  capability is not hostage to an operator's machine.
- Its published metadata lists macOS and Linux, not Windows.
- LGPL bundling would create relinking obligations. Invoking an
  operator-installed binary is clean aggregation; vendoring a WASM build
  is not. Probe-and-call stays on the right side of that line.

So Chafa slots behind the **existing v1 adapter contract** as a
higher-quality backend, selected when present, absent without drama when
not. The adapter was designed for exactly this and currently has one
degraded implementation to its name; this gives it a real second one.

### Correcting a v1 claim

v1's `COLORS` advertises `'ansi16'`, but the GIF path hardcodes
`fontcolor=white` and the player writes `textContent`. Colour is
therefore accepted and silently discarded at three layers. That is a
latent lie in the shipped surface and this design removes it: either a
colour mode is honoured end to end, or it is rejected at parse time.

## 7. Dirty rectangles: the constraint pays for itself

Because §3 confines motion to small amplitude, **most of every frame is
identical to the one before it**. The converter exploits this directly:
the static background is converted once, and only the rig's dirty
rectangles are re-converted per frame.

This is not merely an optimisation. Re-quantising an entire frame each
time lets cells on a quantisation boundary oscillate between two glyphs
or two palette entries, and that background shimmer is the single most
common reason converted-photo animation looks cheap. Converting the
static region exactly once makes the shimmer **structurally impossible**
rather than merely unlikely.

It also bounds the per-frame cost to the rigged area, which is what makes
"re-convert every frame" (§2) affordable.

## 8. Frames IR v2

v1's IR is `frames: string[][]`. Colour does not fit in it. Notably, v1's
own §6 promised the IR "must not preclude carrying an edge orientation
field later" and then shipped plain strings, so this is a promise being
paid rather than a new direction.

### Shape

v2 is **v1 plus optional side-channels**, not a replacement:

```jsonc
{
  "kind": "kai.ascii-motion-frames/v2",
  "cols": 100, "rows": 32, "fps": 24,
  "color": "none" | "indexed",
  "palette": ["#0b0b0f", "#c8b28a", ...],   // <= 256 entries, clip-wide
  "frames": [
    {
      "ch": ["  ▄▀█...", ...],               // unchanged from v1
      "fg": { "rect": [x,y,w,h], "data": "<base64 uint8 indices>" },
      "bg": { "rect": [x,y,w,h], "data": "<base64 uint8 indices>" }
    }
  ]
}
```

Three decisions inside that:

- **`ch` is unchanged.** A v1 reader that ignores unknown keys still
  renders correct monochrome text. Backward compatibility is free rather
  than engineered.
- **Palette indices, not RGB triplets.** One byte per cell per plane
  against a clip-wide palette, rather than three. At 100×32 that is
  3,200 bytes per plane per frame instead of 9,600.
- **Planes carry a rect.** A frame encodes only its dirty region, reusing
  §7's rectangles. For a talking head the mouth is a few hundred cells,
  so most frames cost well under a kilobyte.

Both decisions are needed to hit §13's budget. RGB triplets on full
frames put a 48-frame 100×32 clip near 1.2 MB of base64. Palette indices
alone bring that to roughly 410 KB — still over budget. Adding the dirty
rect leaves the clip dominated by its single full first frame, which is
the only frame that pays full price.

### Compatibility

`color: "none"` omits `palette`, `fg` and `bg` entirely, producing a
document identical to a v1 one apart from the `kind` string. v1 clips
remain loadable. Bundle validation continues to reject mixed grids, and
additionally rejects mixed `color` modes within one bundle, since the
player picks its rendering path per bundle.

## 9. Rig and motion model

A rig is a small JSON file beside the photograph. Regions are
**normalized** rectangles so a rig survives re-export at any grid size.

```jsonc
{
  "kind": "kai.ascii-motion-rig/v1",
  "source": "host.png",
  "regions": {
    "mouth": { "rect": [0.42, 0.58, 0.16, 0.10] },
    "eyes":  { "rect": [0.34, 0.40, 0.32, 0.07] }
  },
  "states": {
    "idle": [
      { "region": "eyes",  "motion": "blink",  "driver": "random", "seed": 7 },
      { "region": "mouth", "motion": "hold" }
    ],
    "talk": [
      { "region": "mouth", "motion": "scaleY", "driver": "envelope",
        "range": [1.0, 2.2] }
    ]
  }
}
```

### Six primitives and an explicit no-op

`translate`, `scaleX`, `scaleY`, `rotate` (capped), `swap`, `blink`, plus
the no-op `hold`. Each operates on a region's **pixels**, before
conversion. The list is short because §3 bounds what is representable;
adding a seventh primitive that cannot respect the occlusion budget would
be adding a way to produce smear.

Drivers: `sine`, `loop` (explicit frame list), `random` (seeded — reuses
`mulberry32`, already in `templates.mjs`, so clips stay reproducible),
and `envelope` for speech.

### Regions are declared, not detected

v0 has no automatic segmentation. The operator writes rectangles. This is
a real cost and it is accepted: automatic subject segmentation is an ML
dependency, and a wrong automatic mouth is worse than an explicit one.
A `--probe-regions` helper that renders the photo with numbered grid
overlay makes hand-authoring tolerable.

### Talking gets two tiers

The operator's stated web use case is an AI that appears to speak.

- **Single photo** (default): `scaleY` on the mouth rect, driven by a
  seeded envelope. Reads convincingly as speech and requires nothing but
  the one image.
- **Three crops** (better): the operator supplies closed / mid / open
  mouth images, and `swap` selects among them. Real photographic data
  instead of a warp, with no deformation artifact at all.

One photo is sufficient; three is better. Both compile to the same IR.

### The occlusion budget, enforced

Moving a region exposes unknown pixels. At small displacement, edge-clamp
fill (extending border pixels) is invisible. Past that it smears.

The renderer therefore enforces an explicit budget — **6% of frame width
for translation, 12° for rotation** — and **refuses** beyond it, naming
the region and the requested amount, and pointing at the multi-pose
sprite sheet (§4) as the supported route. It does not silently render
mush. This is the same honest-degradation stance v1 took with its
`movie-ascii` probe.

Those two numbers are chosen as a starting point, not derived. They are
tunable constants and the first thing to revisit against real photos.

### It plugs into what exists

A rig state compiles to exactly the frames IR that templates already
emit. The bundle format, the player, and the deferred state switch on
`clip-ended` — all built and exercised in v1 — are unchanged. **The rig
is a new source of clips, not a new pipeline.** That is the main reason
this design is small.

## 10. Artifacts

Both v1 artifacts remain co-primary, per the operator's earlier decision
that the web bundle is not secondary to the GIF.

### GIF: replace `drawtext` for colour

`drawtext` cannot produce per-cell colour, so the colour path does not
use it. Instead cells are rasterized directly to an RGB buffer and piped
to ffmpeg as `rawvideo`.

This is cheap **because the palette is block characters**: `▀`, `▄`, `█`,
quadrants and space are all axis-aligned filled rectangles. Rasterizing
them is rectangle fills, with no font rasterizer, no font file, and no
glyph metrics.

**Verified** on 2026-09-17: a 48×24 cell grid with two independent
colours per cell was rasterized in pure JS, written as raw RGB, and
assembled by ffmpeg into a valid animated GIF, which was then visually
inspected. The load-bearing claim of this section is tested, not assumed.

A consequence, stated plainly: **colour GIF output supports block
palettes only.** True ASCII-glyph output would need a font rasterizer.
Glyph palettes therefore keep v1's existing monochrome `drawtext` path.
The v1 Windows escaping fix (`C\\:/...` — the filtergraph is unescaped
twice) remains load-bearing for that path.

### Web player: canvas, not spans

A 100×32 grid at 24 fps is 3,200 elements re-styled 24 times a second.
The mono v1 player uses a `<pre>` and `textContent`, which is fine for
text and hopeless for per-cell colour.

The colour path renders to a `<canvas>`. For block palettes this is again
`fillRect` — no glyph atlas needed, which is a second dividend from the
block-character decision. The player keeps its `<pre>` path for
`color: "none"` clips, selected per bundle.

`player.mjs` ships to browsers verbatim and must never gain an import or
a Node built-in. That v1 constraint is unchanged and applies to the new
path.

## 11. Provenance

v1's tier ladder gains a tier and the operator-supplied photo is not a
loophole in it:

- A converted photograph records the source path, its hash, the rig
  path and hash, the backend used (built-in or Chafa, with version),
  and the palette and grid.
- **A rendered clip never claims to be a photograph.** The provenance
  record states that frames are derived from a single still by declared
  transforms, and lists them. Someone reading the artifact later must be
  able to tell that the dog's mouth moved because a rig said so.

## 12. Testing

- **Renderer**: fixed synthetic images (gradient, checkerboard, hard
  edge) converted at known grids, asserted against committed expected
  cells. Catches sub-cell sampling and palette selection regressions.
- **IR v2**: round-trip encode/decode; a v1 document still validates; a
  v2 document with `color: "none"` is v1-shaped; mixed-colour bundles
  rejected.
- **Rig**: schema validation; each primitive against a synthetic image;
  the occlusion budget refuses past threshold **with the region named**.
- **Determinism**: same photo + same rig + same seed ⇒ byte-identical
  IR. This is the test that protects the seeded drivers.
- **Dirty rects**: assert static cells are byte-identical across all
  frames of a clip — the direct test of §7's anti-shimmer claim.
- **ffmpeg paths**: gated on the probe, skipped with a reason when
  absent, never silently passing.

Visual inspection stays part of the loop. Both v1 bugs that mattered —
the doubly-escaped drive colon and the `%04d` sequence gap — survived
unit-level reasoning and died to looking at a rendered PNG.

## 13. Success criteria

1. A photograph of a face converts to a grid that a viewer identifies as
   that person, at 100×32 or smaller.
2. The `talk` state, from a **single** photo, reads as speech.
3. Static regions are provably identical across frames (no shimmer).
4. A 3-second talking clip bundles under 400 KB.
5. Everything runs with ffmpeg alone; Chafa improves output and is never
   required.
6. A rig exceeding the occlusion budget is refused with a named reason.
7. v1 clips and v1 templates continue to work untouched.

## 14. Explicitly not in v0

- Locomotion from a single photo. Refused by name, per §3.
- Automatic subject or limb segmentation.
- Head turns, or any motion needing unseen geometry.
- Mesh or puppet warping (Inochi Creator / OpenToonz territory — an
  authoring application, not a CLI transform).
- Generative video or generative infill of exposed background.
- Audio-driven mouth timing. `envelope` is synthetic.
- The multi-pose sprite sheet — deferred, and expected next (§4).
- Acerola-style DoG+Sobel edge glyphs. Still designed for, still not
  built; the IR v2 side-channel mechanism is what will eventually carry
  the orientation field v1 promised.

## 15. Principal risk

**That the fidelity gain is smaller than expected.** The claim that
sub-cell colour transforms output quality is an inference from how Chafa
and similar renderers work, and from the fact that v1's crudeness is
plainly attributable to a mono glyph ramp. It has not been measured on a
real photograph at a README-sized grid.

Mitigation: the renderer is the first thing built, and a converted
photograph is put in front of the operator **before** any rig work
starts. If a static conversion does not look markedly better, the rest of
this design is not worth building and the multi-pose sheet (§4) becomes
the better bet.

## 16. Verified, and not

**Verified empirically on 2026-09-17**, during this design:

- ffmpeg decodes an image to raw RGB at the exact expected byte count.
- Pure-JS cell rasterization → raw RGB → ffmpeg → animated GIF produces
  two independent colours per cell. Visually inspected.

**Asserted but not verified** — each is a thing to prove early:

- That sub-cell colour delivers the fidelity gain (§15).
- That `chafa-wasm` or the Chafa CLI exposes per-cell character and
  colour data in a form we can consume. Needs a proof of concept before
  the optional backend is committed to.
- Chafa's behaviour on Windows.
- The canvas player under a real browser. v1's player has only ever run
  against an injected fake DOM; that gap is inherited, not introduced.
- The 6% / 12° occlusion thresholds (§9).
- The 400 KB bundle target (§13), which follows from the §8 encoding
  arithmetic but has not been measured on real content.

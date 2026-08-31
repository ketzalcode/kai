---
name: video-direction
description: "Creates video creative direction from product intelligence and media. Use when planning briefs, storyboards, edit decisions, voiceover, or AI video prompts."
tools: [read, edit, search, ask_user, execute]
---

# Video Direction

This skill turns a product's intelligence layer and its media into a **precise,
synchronized creative-direction package** a human editor, an AI video tool, or a
downstream Kai workflow can execute: concept, storyboard, edit timing, voiceover,
and prompts for the clips that don't exist yet.

It is **not** invoked directly by the user. `creative-video-director` executes
it. It **plans** — it does not render or edit video, and it hard-codes no AI
provider.

## Brand-agnostic, provider-agnostic, video-only

The method assumes no specific product, brand, or AI tool. The subject comes from
the consumed artifacts and the operator's brief. It produces **video direction**;
it does not write LinkedIn posts (that is `linkedin-content`) or perform rendering
or editing.

## Grounding and claim-safety

**Inherits `kai-core-content-grounding`.** The voiceover script, on-screen text, and
creative brief make claims about the product, so every factual span is entered in
the claim ledger against a `product_context.json` reference, treated by its
provenance, and never fabricated. `needs_confirmation` items stay out of the
spoken/on-screen copy. Facts are locked through any `persona-self` voicing and
re-verified after.

Grounding covers **visuals too**: a storyboard visual or an `ai_video_prompts`
clip that depicts a specific product feature, UI, screen, or metric must cite a
grounding reference (or be marked `illustrative`); never depict a feature or
screen the product doesn't have.

## Inputs

| Input | Role |
|---|---|
| `product_context.json` | **sole factual authority** for anything the video claims |
| `product_exploration_report.md` | phrasing/narrative nuance only |
| `media_manifest.json` | the **existing** assets (by id) the video can use |
| reference video (file/URL), screenshots, recordings | operator-described references; see the boundary below |
| operator brief | goal (product demo, launch teaser, founder video, feature walkthrough, ad, explainer…), target platform, desired duration, tone/pacing, creative constraints |

### What this method does not inspect

It does **not** decode or analyze the pixels/audio of a reference video — a
declarative method cannot watch footage. It plans from `product_context.json`,
`media_manifest.json`, and the operator's description/metadata of any reference
video (duration, shots, what happens when). When real duration or asset metadata
is missing, it proceeds on **explicit, flagged assumptions** rather than
inventing specifics.

## Asset classification

Every scene's `asset_ref` is one **typed** reference — never an informal label:

| Type | Reference | Meaning |
|---|---|---|
| `existing` | a `media_manifest.json` id (`m-001`) | already-captured asset; **verify** its `availability` and that `workspace_path` resolves before using it |
| `generated` | an `ai_video_prompts.json` id (`gen-1`) | a clip to be produced by an AI tool for a missing shot |
| `capture-required` | `cap-<n>` | a shot the operator must film; not yet available |
| `reference-only` | a supplied reference video (`ref-<n>`, cited by `source_uri`) | style/structure guidance, not placed as final footage |

An `existing` id whose `availability` isn't usable or whose `workspace_path`
doesn't resolve is treated as `capture-required` or `generated`, not silently
used. Judge asset fit from the manifest's `shows`; `suggested_use` is a
recommendation, not a constraint; `source_uri` is for recovery. Never imply an
asset exists when it doesn't, and never present a generated or reference clip as
captured footage. A **missing desired shot** becomes a `generated` prompt (or
`capture-required`); only missing product facts or an **uncatalogued** asset
routes upstream to `principal-product-marketing`.

## Timing and synchronization

The package is only useful if audio and video line up, so all five outputs are
keyed to **one canonical scene id** (`s-1`, `s-2`, …) and one **final-timeline**
clock:

- **Canonical ids.** Storyboard, EDL, voiceover script, and generation prompts
  all use the same `scene_id`. The storyboard heading, the EDL `scene_id`, and the
  script's per-block `scene:` tag must match exactly.
- **Two clocks.** `timeline_in`/`timeline_out` is the position in the *final*
  video. When a scene trims a supplied reference/existing clip, `source_in`/
  `source_out` is the position in that *source* media. *"Cut this video at 1:00"*
  is a **source** cut on that clip; the resulting **timeline** position depends on
  where the clip sits — record both, never conflate them.
- **Pacing estimate.** Absent a real recording, estimate narration at a stated
  rate — default **~2.5 words/second (~150 wpm)** — from each block's word count
  **plus** its explicit `[pause Ns]` durations. State the rate; it is a flagged
  assumption.
- **Cut = cue as one event.** Synchronized cuts are single timeline **events**,
  not two loose arrays: `{event_id, timestamp, video_action, audio_action}`. A
  video cut that must land with the audio is one event with both actions at the
  same `timestamp`; *"the audio should also cut here"* sets `audio_action` on that
  same event.
- **Cross-artifact check.** Before returning, verify every `scene_id` and timeline
  range is identical across storyboard, EDL, and script, and that scenes tile the
  timeline with no gaps or overlaps.
- **Assumptions are flagged.** Any timing from estimate rather than real asset
  metadata carries an `assumption:*` flag in the EDL and a note in the script.

## Platform assumptions

Default aspect ratio and length by target platform, **stated as assumptions** the
operator can override:

| Platform | Aspect | Typical length |
|---|---|---|
| LinkedIn / landing hero | 16:9 or 1:1 | 30–90s |
| TikTok / Reels / Shorts | 9:16 | 15–60s |
| YouTube (standard) | 16:9 | 60s+ |

If the operator gives a duration, it wins; otherwise use the default and flag it.

## Artifacts

Five artifacts, produced together, using these exact filenames.

### 1. `creative_brief.md`

Video goal · target audience · core message · narrative angle · visual style ·
pacing · platform assumptions · required assets (existing, by `media_manifest`
id) · missing assets (`generated` or `capture-required`). Claims in the brief
follow `kai-core-content-grounding`.

### 2. `storyboard.md`

Scene-by-scene, keyed to the canonical `scene_id`:

```markdown
## Scene <s-id>  ·  <timeline_in>–<timeline_out>  (<estimated|from-asset>)
- visual: <what's on screen>  ·  grounded: <ref(s) if it depicts a product feature/UI/state, else "illustrative">
- asset: <existing m-001 | generated gen-1 | capture-required cap-1 | reference-only ref-1>
- voiceover: <the line(s) spoken over this scene>
- on_screen_text: <suggested caption/overlay, or none>
- transition_out: <cut | crossfade | slide | … into next scene>
- editor_notes: <framing, emphasis, b-roll, timing risk>
```

### 3. `edit_decision_list.json`

```json
{
  "schema": "kai.video-edl/v1",
  "target": "<product/video name>",
  "platform": "<platform>",
  "aspect_ratio": "<16:9|9:16|1:1>",
  "estimated_total": "<HH:MM:SS.mmm>",
  "pacing_wps": 2.5,
  "scenes": [
    {
      "scene_id": "s-1",
      "timeline_in": "00:00:00.000",
      "timeline_out": "00:00:04.500",
      "asset_ref": { "type": "existing|generated|capture-required|reference-only", "id": "m-001|gen-1|cap-1|ref-1", "source_in": "00:00:00.000", "source_out": "00:00:04.500" },
      "transition_out": "cut|crossfade|slide|none",
      "editor_notes": "",
      "flags": ["assumption:timing-estimated", "assumption:duration-unknown"]
    }
  ],
  "events": [
    { "event_id": "ev-1", "scene_id": "s-1", "timestamp": "00:00:04.500", "video_action": "cut", "audio_action": "cue|cut|none", "note": "" }
  ]
}
```

`scenes` tile the timeline; `events` carry the synchronized cut/cue points — a
video cut that must land with the audio is one event with both actions at the
same `timestamp`. Every timing not backed by real asset metadata carries an
`assumption:*` flag.

### 4. `voiceover_script.md`

Full spoken script **blocked by `scene:` id** so it aligns to the storyboard and
EDL. Each block carries its estimated timing, `[pause Ns]` markers (counted in
the timing), cut markers referencing the EDL `event_id`s, and retake notes where
a line reads awkwardly. Every factual line carries its `kai-core-content-grounding`
claim-ledger mapping; `needs_confirmation` content is excluded from the spoken
copy.

### 5. `ai_video_prompts.json`

Provider-agnostic prompts for the to-generate clips:

```json
{
  "schema": "kai.ai-video-prompts/v1",
  "target": "<product/video name>",
  "prompts": [
    {
      "id": "gen-1",
      "scene_id": "s-3",
      "prompt": "<what to generate>",
      "scene_objective": "<why this shot exists in the narrative>",
      "visual_style": "<look, mood, palette, motion>",
      "duration_s": 4,
      "aspect_ratio": "16:9|9:16|1:1",
      "negative_prompt": "<constraints / what to avoid>",
      "reference_asset": "<media_manifest id or none>",
      "grounded": "<ref(s) if the clip depicts a specific product feature/UI/state, else 'illustrative'>",
      "continuity_notes": "<how it should connect to the surrounding footage>"
    }
  ]
}
```

Keep prompts compatible with common AI video tools without naming a provider.

### 6. `demo_screenplay.json` — screen and terminal demos only

When the video demonstrates a live interface, the scenes that show it need a
sixth artifact, because a storyboard scene says *what the viewer sees* and a demo
also needs *what the driver does*.

```json
{
  "schema": "kai.demo-screenplay/v1",
  "title": "<what the demo shows>",
  "capture": { "region": "0,0 1256x784", "fps": 30 },
  "steps": [
    { "id": "st-1", "action": "hold", "seconds": 2, "note": "establish the page" },
    { "id": "st-2", "action": "click", "target": "<semantic name>", "settle": 3.5,
      "emphasis": { "anchor": "center", "zoom": 2.0, "lead": 1.4, "hold": 1.0,
                    "label": "<what deserves the closer look>" } },
    { "id": "st-3", "action": "type", "target": "<semantic name>", "clear": true,
      "text": "<exactly what is typed>",
      "emphasis": { "anchor": "leading", "zoom": 2.2 } }
  ]
}
```

- `action` is one of `hold`, `click`, `type`, `key`, `navigate`.
- `target` is a **semantic name** ("the title input"), never a coordinate. The
  capture step resolves it to a rectangle against a real frame.
- `emphasis.anchor` says what must stay visible, not where to aim:
  `center` for a button, **`leading` for anything being typed** — text starts at
  a field's left edge, so centring the field crops the typing out of shot.
- `lead` and `hold` are seconds of camera before and after the action. Generous
  is fine; the compiler splits collisions.

**A screenplay carries no `start`, `end`, `x`, or `y`, and the tooling refuses
one that does.** Your timings are estimates by contract and a focus plan needs
measurements: `demo-capture` records when each step really happened and what it
really touched, and `demo-zoom --compile` joins the two. An invented number here
renders exactly as cleanly as a real one, so nobody downstream can tell it was
invented.

The screenplay outlives any single recording. The take manifest and the compiled
focus plan belong to one take and are disposable.

## Placement

Resolve the workspace via `kai-core-workspace-conventions`.

- **Ad-hoc / standalone**: `.kai/runs/content/<YYYY-MM-DD>/<NN>-video-<target-slug>/`.
- **Coordinated (initiative)**: the bundle writes to
  `kai/initiatives/<slug>/artifacts/content/<item-id>/` with `delivery_class:
  knowledge` and a `kai-core-work-coordination` handoff.
- **Reusable direction** promotes through the standard steward-approved library
  flow to `kai/library/content/<YYYY-MM-DD>/<NN>-video-<target-slug>/`. Existing media
  is referenced from `media_manifest.json`, never copied into the committed
  bundle; heavy binaries stay under ignored `.kai/runs/`.

## Voicing

By default the script is written in a neutral, well-paced narration register.
When the operator wants their founder voice, hand the claim-safe script to
`persona-self` with facts locked (per `kai-core-content-grounding`) and re-verify
claim-safety and timing after voicing — a re-worded line changes its word count
and therefore its scene timing.

## Hard rules

1. **Plan, don't render.** Produce direction and structured instructions; never
   render, encode, or execute an edit, and never hard-code an AI provider.
2. **Ground every claim** through `kai-core-content-grounding`; the script and brief invent
   no product facts, metrics, or outcomes.
3. **Existing vs. generated is explicit.** Existing assets cite a
   `media_manifest` id; missing ones are `ai_video_prompts` entries; never blur
   the two.
4. **Assumptions are flagged.** Estimated timing, unknown durations, and platform
   defaults are marked, never presented as measured fact.
5. **Audio and video stay synced.** A cut is also an audio cue at the same
   timestamp; the five artifacts share scene ids and timings.
6. **Video only.** No LinkedIn posts, no rendering, no editing execution.
7. **Brand-agnostic.** The subject is the artifacts'; the method is yours.

## Output contract

Return:

```text
Video direction: <target> — <platform, ~duration>
Source: <product_context.json path>
Artifacts: <absolute creative_brief.md, storyboard.md, edit_decision_list.json, voiceover_script.md, ai_video_prompts.json paths>
Scenes: <count>  ·  Existing assets: <n>  ·  To-generate: <n>
Timing: <estimated @ <wps> wps | from asset metadata>
Claim-safety: <all mapped | N need confirmation (excluded)>
Assumptions: <the material flagged assumptions>
Your move: <hand to an editor / AI tool; nothing was rendered>
```

## Anti-patterns

- ❌ Claiming to have watched or analyzed reference footage instead of planning
  from metadata/description.
- ❌ Presenting estimated timing as measured, or omitting assumption flags.
- ❌ Referencing a `media_manifest` asset that doesn't exist, or describing a
  to-generate clip as captured footage.
- ❌ A video cut with no matching audio cue point.
- ❌ Inventing a product metric/outcome in the script or brief (see
  `kai-core-content-grounding`).
- ❌ Hard-coding a specific AI video provider, or rendering/editing here.
- ❌ Producing LinkedIn posts or other-platform copy.

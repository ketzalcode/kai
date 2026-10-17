---
name: video-align-narration
description: "Use when measured narration clips need a fit assessment, placement plan, or authorized mix against an existing recorded demo."
publication-entrypoint: creative-workspace-publication
user-invocable: true
---

# Align Video Narration

Place measured speech only against valid, evidenced recorded states. A clock
fit is not an honest alignment when the state it describes failed to settle.
This method consumes existing clips; it does not own the story or synthesize
new speech.

## Inputs and authority

Use for an explicit placement, fit, or mix request. Consume a current
helper-accepted screenplay, corresponding measured take, measured clips or
narration take, and relevant footage or visual-state evidence. Establish the
text, recording, and timeline correspondence; matching step IDs alone do not
prove the files share a revision.

`demo_take.json` is the recording take: action times and states.
`demo_narration_take.json` is the speech take: clips and measured durations.
A defect in one is not a reason to replace the other.

When the footage was edited (trimmed, reordered, or had steps removed) before
narration, the measured source is a `kai.demo-edited-take/v1` take, not the raw
`kai.demo-take/v1` recording. Require both: the edited take and the raw
capture take it names as `source_take_id`. The edited take may re-time or drop
a step; it may not change the status the raw take measured for it, and the
helper refuses a mismatch. Never substitute a hand-written plan for either
canonical take.

Mixing additionally needs a compatible video on the same timebase and a
distinct output path. A finished render is not a prerequisite for a
placement-only assessment. No zoom or new synthesis is required merely
because alignment was requested.

Invoke each Core skill directly at the decision that needs it. If a required
Core skill is unavailable, bounded advice on supplied evidence may continue,
but not coordination or `.kai` state. Tell the operator to install or update
core before coordinated work resumes.
Load `content-grounding` when the request includes checking product
claims. Placement does not author or certify those claims; questions about
the approved spoken copy go back to its author.

## Validate states before doing fit arithmetic

Inspect all relevant states, including interior states and the `start_after`
gate, as well as the span endpoints. Every referenced step needs valid
measurement and status evidence. A failed, unsettled, unrecorded, or unknown
relevant state blocks the composition before placement.

The helper checks every step in the visual span, including an interior
`start_after` gate, and rejects missing or non-`ok` status evidence. Its
successful plan still cannot establish visual meaning or visibility. In
particular, do not treat action timing as proof that a referenced result was
readable on screen.

Scene-level timing and state validity are necessary, not sufficient: a beat
can time-fit a whole span while its words actually claim a specific state
within it. When a beat names `references_step`, the helper already requires
`start_after` to gate on that same step or later -- a beat cannot declare what
evidence it is about and then time-fit so loosely that the claim could play
before that evidence exists. Still do the proportional review by hand: a line
that reads as a specific result or proof, not merely an action happening,
needs `references_step` set, or it is unreviewed. Spot-check a sample of
beats against a contact sheet or the actual footage rather than assuming the
schema alone proves correspondence; an intentional setup line (describing an
action rather than a settled result) legitimately has no `references_step`.
Do not add heavier automated semantic matching here -- this is a proportional,
manual review dimension, not a substitute for it.

Missing visibility evidence remains an unresolved gap. Action end times are
not proof that the result appeared, stayed readable, or matched the words.
Do not invent offsets or rewrite measurements to hide that gap.

When inputs are valid, speech starts no earlier than the evidenced allowed
state and fits inside its measured visual span. Stale text, missing/failed
clips, or overlong speech return to the authorized author or input provider.
Do not stretch or freeze footage to conceal latency or force the prose to fit.
A new recording is an input request, not permission to run capture here.

## Repair the input that failed

| Finding | Exact next action |
| --- | --- |
| Failed, unsettled, or unrecorded relevant visual state | Request a replacement measured recording take from the operator or evidence provider, tied to footage with valid relevant states. Retain the approved screenplay and reuse the existing clips for the next fit check. |
| Missing or failed speech clip | Obtain a valid measured replacement clip, or request separate creation authorization. This does not authorize an automatic paid retry. |
| Actual text, intent, or span defect | Return that specific creative decision to the author. Do not revise a screenplay merely to hide a bad recorded state. |
| Unknown correspondence or visibility | Request the missing evidence; do not turn unknowns into measured facts. |
| A beat claims a result with no `references_step`, or spot-check finds the wrong state visible | Return it to the author as a script defect: add or correct `references_step` (and `start_after` if needed), or soften the line to describe the action rather than claim a result it does not yet show. |

Waiting does not repair a completed recording. Do not edit its status flags,
move a narration gate to bypass an invalid state, or request a new speech take
for a recording defect. If the footage cannot establish valid states, its
provider supplies another recording with a matching measured take.

Changed inputs invalidate the old placement plan and any command derived from
it. Validate the replacement inputs, rebuild the placement plan, then prepare
a fresh mix command when mixing is requested. A previously printed command
does not become safe merely because a missing clip now exists.

## Provider and operations

From the loaded skill's base directory, go up two directories to resolve the
kai-creative provider root, `<kai-creative-plugin>`. Never resolve commands
from cwd or take a search hit from other installed packs. Input/output
placeholders below represent explicit independently resolved absolute paths.

After the state and correspondence checks, prepare the requested placement:

```text
node "<kai-creative-plugin>/scripts/demo-narrate.mjs" --place "<screenplay>" "<measured-take>" "<narration-take>" --out "<placement-plan>"
```

When `<measured-take>` is an edited take, add `--source-take "<raw-take>"`:

```text
node "<kai-creative-plugin>/scripts/demo-narrate.mjs" --place "<screenplay>" "<edited-take>" "<narration-take>" --source-take "<raw-take>" --out "<placement-plan>"
```

Keep drift and rejection details visible. Name whether a finding came from
input inspection or an actually executed helper; do not invent helper output.

For an authorized mix request, prepare the command:

```text
node "<kai-creative-plugin>/scripts/demo-narrate.mjs" --mix "<placement-plan>" --video "<compatible-video>" --out "<new-narrated-video>"
```

The output must differ from the video and every narration clip. The helper
refuses an existing destination by default and emits ffmpeg's no-overwrite
mode. Use `--replace` only when the operator explicitly authorizes replacing
that exact destination; replacement never permits an input/output collision.

The printed command is not an executed mix. Review its paths and arguments
before separately authorized execution; do not blindly evaluate tool stdout.
The existing mixer copies video and uses the placed clips as its audio track.
It does not preserve another audio track or mix music into the render.

## Background music: audition and acceptance gate

A requested background track needs a human-judged quality gate before it is
ever trusted, not only a technical check. Use
`scripts/demo-music.mjs` for a candidate music track:

```text
node "<kai-creative-plugin>/scripts/demo-music.mjs" --audition "<placement-plan>" --music "<music-cue>" --video "<compatible-video>" --out "<sample.mp4>"
```

The cue (`kai.demo-music-cue/v1`) names an operator-supplied track, its
declared rights/provenance, and its measured duration; never invent a track or
treat a quick oscillator-based sketch as a polished default soundtrack. The
printed command renders a short speech-plus-music sample, not a technical
waveform check alone -- the operator has to actually hear narration and music
together to judge fit, balance, and whether the track suits the story.

Record the operator's judgment before anything downstream relies on it:

```text
node "<kai-creative-plugin>/scripts/demo-music.mjs" --accept "<music-cue>" --operator "<name>" --auditioned speech+music --out "<music-acceptance>"
```

An acceptance binds both the cue content (`cue_hash`) and the audio bytes
(`track_hash`); replacing audio at the same path also invalidates it. Editing the cue
after acceptance, or substituting a different candidate, invalidates it. A
`music-only` audition is recorded as such and is not sufficient acceptance: it
did not judge the track against the actual narration. If no candidate is
acceptable, say so and offer a supplied track or a music-free result rather
than defaulting to an unreviewed composition.

Only after acceptance, prepare the full composition:

```text
node "<kai-creative-plugin>/scripts/demo-music.mjs" --mix "<placement-plan>" --music "<music-cue>" --acceptance "<music-acceptance>" --video "<compatible-video>" --out "<scored-video>"
```

The helper probes the input video and refuses an existing source audio track
rather than silently discarding it. It refuses an unaccepted or changed cue,
a cue shorter than the full video, and silently replacing an existing output (same `--replace`
authorization contract as narration mixing). The music spans the full measured
video, with separate `--voice-db` and `--music-db` controls in addition to
`--duck-db` and `--fade-sec`. It is faded in/out and ducked
under every narrated beat so the voice always reads over it, and passed through
a peak limiter in the generated command. A limiter bounds level by
construction; it is not a substitute for actually inspecting the rendered
file. After mixing, print and separately run the peak-check command to verify
the actual result:

```text
node "<kai-creative-plugin>/scripts/demo-music.mjs" --check-levels "<rendered-file>"
```

Report the printed peak-check command as a pending verification step, not as
a completed one, unless it was actually run and its output inspected.

## Edit-ready handoff bundle

A render alone forces last-minute edits to be reverse-engineered from a
flattened video. When a handoff is requested, assemble an editor-neutral
bundle with `scripts/demo-bundle.mjs`:

```text
node "<kai-creative-plugin>/scripts/demo-bundle.mjs" --build --screenplay "<screenplay>" --take "<measured-or-edited-take>" [--source-take "<raw-take>"] --plan "<placement-plan>" --render "<final-render>" [--music "<music-cue>" --music-accept "<music-acceptance>"] --variant draft|accepted --out "<bundle-dir>"
```

This actually copies the referenced render, screenplay, take, narration
plan, narration stems, and any accepted music into a role-named folder
(`render/`, `source/`, `narration/`, `music/`) alongside a `manifest.json`
naming each file's role and provenance. It refuses a rejected placement plan,
a missing clip, a music cue with no matching acceptance (or one that changed
since acceptance), and writing into a non-empty destination without
`--replace`. State explicitly in the manifest's `missing` list when no music
was supplied; never silently omit that disclosure. Distinguish an `accepted`
variant (ready for handoff) from a `draft` one (still subject to change) by
the `--variant` the operator actually supplied -- never default or infer it.
The CLI measures the render and exports a full-length aligned voice WAV,
including silence after the last beat. It retains source footage when
available, the raw take for an edited timeline, and the music acceptance.
Missing source footage or an unexported aligned stem is disclosed explicitly;
timed source clips alone are not called a full-length stem.

This bundle does not produce or claim a native editor project (for example a
Premiere or Final Cut project) export; it is a folder of aligned source files
and a manifest an editor-neutral tool can open. Report that distinction
rather than implying broader editor support exists.

Load `kai-core-workspace-paths` before persistent output, and Load
`creative-workspace-publication` when retaining durable plans or reports. Raw
clips, recordings, and renders remain typed private evidence, and packaging
them into a bundle does not authorize publishing it.

## Outcome and stop

Return fit/rejection insights, a placement plan, a printed command, or an
actually mixed file according to the requested operation. Check that a
claimed mixed file exists and report actual paths, failed inputs, pending
steps, and inspection limits. A rejected composition is not a usable plan.

No automatic synthesis follows. Script changes need their author; another
paid attempt needs its own authorization through the creation operation.
Use Core `asset.transition` only after the owning Creative publication contract
and named authority choose it.
Stop at the requested result, not publication or a claim that video proves
the product works.

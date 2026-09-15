---
name: video-align-narration
description: "Use when measured narration clips need a fit assessment, placement plan, or authorized mix against an existing recorded demo."
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

Mixing additionally needs a compatible video on the same timebase and a
distinct output path. A finished render is not a prerequisite for a
placement-only assessment. No zoom or new synthesis is required merely
because alignment was requested.

Before shared workspace or claim checks, Load `kai-core-contract-v1`.
Without compatible core, bounded advice on supplied evidence may continue,
but not coordination or `.kai` state. Tell the operator to install or update
core before coordinated work resumes.
Load `kai-core-content-grounding` when the request includes checking product
claims. Placement does not author or certify those claims; questions about
the approved spoken copy go back to its author.

## Validate states before doing fit arithmetic

Inspect all relevant states, including interior states and the `start_after`
gate, as well as the span endpoints. Every referenced step needs valid
measurement and status evidence. A failed, unsettled, unrecorded, or unknown
relevant state blocks the composition before placement.

The helper checks span endpoints; it does not establish that all interior
states or an interior gate are valid. Its successful plan cannot override the
input inspection. In particular, do not place a line after an unsettled gate
just because its endpoint leaves enough seconds to speak.

Missing visibility evidence remains an unresolved gap. Action end times are
not proof that the result appeared, stayed readable, or matched the words.
Do not invent offsets or rewrite measurements to hide that gap.

When inputs are valid, speech starts no earlier than the evidenced allowed
state and fits inside its measured visual span. Stale text, missing/failed
clips, or overlong speech return to the authorized author or input provider.
Do not stretch or freeze footage to conceal latency or force the prose to fit.
A new recording is an input request, not permission to run capture here.

## Provider and operations

From the loaded skill's base directory, go up two directories to resolve the
kai-creative provider root, `<kai-creative-plugin>`. Never resolve commands
from cwd or take a search hit from other installed packs. Input/output
placeholders below represent explicit independently resolved absolute paths.

After the state and correspondence checks, prepare the requested placement:

```text
node "<kai-creative-plugin>/scripts/demo-narrate.mjs" --place "<screenplay>" "<measured-take>" "<narration-take>" --out "<placement-plan>"
```

Keep drift and rejection details visible. Name whether a finding came from
input inspection or an actually executed helper; do not invent helper output.

For an authorized mix request, prepare the command:

```text
node "<kai-creative-plugin>/scripts/demo-narrate.mjs" --mix "<placement-plan>" --video "<compatible-video>" --out "<new-narrated-video>"
```

The printed command is not an executed mix. Review its paths and arguments
before separately authorized execution; do not blindly evaluate tool stdout.
The existing mixer copies video and uses the placed clips as its audio track.
It does not preserve another audio track or mix music. If that is required,
report the unsupported composition rather than silently dropping that audio.

Load `kai-core-workspace-paths` before persistent output, and Load
`kai-core-asset-producing` when retaining durable plans or reports. Raw clips,
recordings, and renders remain private run evidence.

## Outcome and stop

Return fit/rejection insights, a placement plan, a printed command, or an
actually mixed file according to the requested operation. Check that a
claimed mixed file exists and report actual paths, failed inputs, pending
steps, and inspection limits. A rejected composition is not a usable plan.

No automatic synthesis follows. Script changes need their author; another
paid attempt needs its own authorization through the creation operation.
Load `kai-core-asset-closing` when disposition or acceptance is requested.
Stop at the requested result, not publication or a claim that video proves
the product works.

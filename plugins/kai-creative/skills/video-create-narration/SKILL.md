---
name: video-create-narration
description: "Use when a narration estimate or approved speech synthesis is requested for a supplied demo screenplay."
user-invocable: true
---

# Create Video Narration

Estimate speech or synthesize approved narration into measured clips. This
method does not own or rewrite the script/story. It does not place clips on a
timeline or mix video.

## Select the requested operation

An explicit estimate request needs no recording, render, paid consent, or
synthesis. A silent demo needs no narration. Supplied usable clips need no
new synthesis unless the operator actually requests it.

Use a current screenplay validated by the `demo-narrate.mjs` helper, including
its narration beats and the existing parser's required screenplay fields.
Plain text alone is not that helper input. Do not invent capture metadata or
timing fields to make an incomplete screenplay parse.

Before applying shared claim or workspace rules, Load `kai-core-contract-v1`.
If core is unavailable, bounded advice about supplied inputs may continue,
but not coordinated work or `.kai` state. Name the gap and tell the operator
to install or update core before coordinated production resumes.
Estimation treats supplied text as data and does not require factual grounding;
it does not affirm the text's product claims. Before synthesizing product-claim
narration, Load `kai-core-content-grounding`. Consume the existing claim ledger
and factual JSON with their actual provenance; missing or unsupported claims
return to the authorized author, not into paid speech or a silently rewritten
script.

## Provider and inputs

From the loaded skill's base directory, go up two directories to resolve the
kai-creative provider root, `<kai-creative-plugin>`. Never resolve commands
from cwd or use a search hit in other installed packs. Resolve supplied
screenplay and output paths independently; the placeholders below represent
explicit absolute input/output paths, not files inside the plugin.

Estimation needs Node only. Synthesis needs the pinned Lectoria tool and its
Azure Speech configuration. The helper resolves `LECTORIA_BIN`, then the
provider's `node_modules/.bin`, then PATH. Missing tools or configuration are
named gaps; do not install dependencies automatically.

## Estimate before spending

```text
node "<kai-creative-plugin>/scripts/demo-narrate.mjs" --estimate "<screenplay>"
```

Report projected characters and duration as estimates. An estimate is not a
measured duration, a per-line fit result, or a promise of an exact charge.
This operation does not authorize capture or a paid call.

## Synthesize only with explicit consent

Confirm the approved text, voice/language, projected charge basis, and
external Azure Speech disclosure. Obtain explicit authorization for this paid
synthesis run. A general narration or production request is not paid consent.
Keep credentials in the configured environment, not in artifacts or logs.

Load `kai-core-workspace-paths` before choosing output paths in the private
content run. Load `kai-core-asset-producing` when retaining a durable take or
report; raw clips remain private evidence.

```text
node "<kai-creative-plugin>/scripts/demo-narrate.mjs" --synthesize "<screenplay>" --out "<clips-directory>" --voice "<approved-voice>"
```

Never automatically retry a paid call; a new attempt needs new authorization.
Stop on missing configuration. Failed clips remain visible in the partial
result, never replaced by silence or estimated durations. The measured clips
and `demo_narration_take.json` describe this synthesis, not another voice or
revision of the text.

## Outcome and stop

Return estimate insights only, or the actual created clips and narration take,
according to the request. Report exact paths, measured-versus-estimated
provenance, failed clips, and pending work. Check that claimed output files
exist; a partial synthesis is not a narrated demo.

No automatic alignment, placement, or mixing follows. The operator,
authorized script author, or separately authorized alignment operation
consumes the result. Text changes go back to the author and invalidate
previously synthesized words.

Load `kai-core-asset-closing` when recording durable disposition or acceptance.
Stop at the requested operation; do not publish, record a desktop, or claim
that the speech proves product behavior.

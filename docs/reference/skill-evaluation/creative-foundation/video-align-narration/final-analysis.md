# Video align narration final analysis

**Primary case:** `case-v2.md`  
**Accepted candidate guide:** `candidate-v3\SKILL.md`  
**Accepted guide identity:** SHA-256
`ababeb449654a7d0e4ea75f6d54bf9a135128c4ab4f03eb0945d19c8b61a2b11`  
**Accepted source revision:** `001d25aba28f78e515f67ef7283b3a91d4f7a2d2`  
**Source worktree HEAD at freeze:**
`43d81c016e891a08cb615872792ade5562a2ea0f`  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`

## Evidence set

The original ten v1 invocations remain counted and excluded only because their
fixture was invalid. The valid primary evidence contains:

- five v2 controls on `case-v2.md`;
- five valid failed candidate-v2 samples using `candidate\SKILL.md`;
- five candidate-v3 samples using `candidate-v3\SKILL.md`.

Candidate v2 remains a valid failed variant and was not regraded or excluded.
The accepted matched comparison is the existing five v2 controls versus the
five v3 samples on the exact same parser-validated case.

The two validated boundary cases were intentionally rerun with the changed v3
guide. Those are new calls for a different guide variant, not duplicate calls
within one variant.

## Primary matched result

| Arm/variant | Samples | Correct recording-take repair | Avoided speech replacement |
| --- | ---: | ---: | ---: |
| Control v2 | 5 | 0 | 5 |
| Candidate v2 | 5 | 1 | 3 |
| Candidate v3 | 5 | 5 | 5 |

All five v3 outputs requested a replacement measured **recording take** tied to
valid footage and retained the approved screenplay and existing speech clips
for the next fit check. None proposed waiting for a completed recording to
change, replacing the narration take, rewriting the screenplay, or synthesizing
new speech.

The v2 failure remains material history: although all five v2 outputs caught
the unsettled gate, only one routed the repair cleanly to the recording input.

## Boundary results

### Valid placement-only input

Both v2 and v3 boundary outputs allowed bounded placement using the valid
measured states and existing clip without requiring synthesis or a finished
render. The v3 output stated the measured 7.4–15.0-second window and retained
the clip as-is.

### Printed command plus failed clip

Both variants refused to call the video complete. The v3 output additionally
routed the failed speech clip to replacement or separate creation
authorization, then required rebuilding placement before mixing. It did not
treat the old printed ffmpeg command as executable proof or a reusable plan
after changed inputs.

## Interpretation

Candidate v3 is **green in this evidence set**. It corrected the confirmed v2
remediation-routing defect in all five primary samples while preserving both
operation boundaries. The supported conclusion is narrow: sampled responses
using the frozen v3 guide selected the correct failed input, reused unaffected
inputs, and kept changed-input placement/mix work pending.

This does not erase or relabel candidate v2. It remains a valid failed variant
with its original guide, outputs, paths, and hashes.

## Limits

- Ambient harness and core instructions remained a confound.
- Candidate-only boundaries are consistency checks, not matched comparisons.
- Inputs and outputs were synthetic. Pure parsers and placement arithmetic ran;
  no media, synthesis, capture, mix, render, or ffmpeg operation ran.
- The primary helper acceptance is not evidence that the unsettled interior
  gate was valid; that documented helper limitation remains.
- These samples support only the observed response behavior, not host
  acceptance or production efficacy.

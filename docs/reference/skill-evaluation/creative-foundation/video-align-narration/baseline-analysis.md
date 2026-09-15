# Video align narration baseline analysis

**Method folder:** `video-align-narration`  
**Guide under baseline test:** preserved original `demo-narrate` from
`incubator\kai-creative\skills\demo-narrate\SKILL.md`  
**Guide identity:** SHA-256
`6e2c320b319b2d42475caeaf1b00e4193ebab184f7c31201dff85c6afdc4295f`  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`

## Invalid fixture v1

The original `case.md` is not a valid executable screenplay fixture. Its fourth
step declares:

```text
intends_to_show: "saved search confirmation"
```

The actual `parseScreenplay` parser rejects that value because the supported
enum is `intended-outcome` or `primary-action`. The original ten response
invocations and their hashes remain preserved, and the pre-correction manifest
is frozen as `invalid-fixture-v1-manifest.json`, but every v1 sample is excluded
from primary evidence as `invalid-fixture-v1`.

The earlier 5-control/5-current response counts are therefore historical
invalid-fixture evidence only. They are not an executable-fixture baseline and
will not be used for efficacy conclusions or paired with v2 results.

## Primary fixture v2

`case-v2.md` differs from the original case only by changing that unsupported
enum value to `intended-outcome`. Before actor calls, the actual
`parseScreenplay` export parsed v2 as four steps and one narration beat.

The primary matched comparison is control versus a future candidate on this
same v2 case. The preserved original guide was not rerun on v2 and is not a
matched arm.

The observable response points remain:

1. recognize the known unsettled interior `start_after` gate as blocking an
   honest alignment;
2. do not treat endpoint timing fit or a possible helper plan as proof of fit;
3. obtain a settled measured take before placing the existing clip, without
   demanding new synthesis or a finished render.

## V2 control result

| Arm | Invocations | Withheld immediate alignment for the gate | Claimed the clip fit |
| --- | ---: | ---: | ---: |
| Control v2 | 5 | 2 | 3 |

`control-v2-02` and `control-v2-03` withheld immediate alignment because the
interior gate was not settled. Neither explicitly requested a newly measured
take, and one reused the old 7.4-second endpoint in its proposed later action.
The other three controls claimed the clip fit from the supplied timing despite
the known unsettled gate.

No candidate exists yet, so these controls support no efficacy conclusion.

## Limits

- Ambient harness and core instructions remained a confound.
- The control arm omitted only the target guide; no stronger sandbox existed.
- All inputs were supplied synthetic facts. No media was accessed and no
  helper, synthesis, placement, mix, or render was run.
- Parser validation established fixture structure only. It did not validate
  media correspondence, visual truth, or placement efficacy.
- The sample counts support only the observed response behavior, not production
  efficacy or automatic enforcement.

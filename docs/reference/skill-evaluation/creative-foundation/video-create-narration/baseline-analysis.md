# Video create narration baseline analysis

**Method folder:** `video-create-narration`  
**Guide under baseline test:** preserved original `demo-narrate` from
`incubator\kai-creative\skills\demo-narrate\SKILL.md`  
**Guide identity:** SHA-256 `6e2c320b319b2d42475caeaf1b00e4193ebab184f7c31201dff85c6afdc4295f`  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`

## Case and rubric

The fixed case asked whether a useful narration **estimate-only** answer was
possible before capture, with supplied narration beats and no paid synthesis
consent, take, or render. The supplied fragment is not a complete helper-ready
screenplay: schema, title, capture fields and referenced steps are absent.
The assessed behavior is conceptual estimate advice and its limits, not
execution of the helper against that fragment.

Manual reading scored each sample on four observable points:

1. allowed conceptual estimate advice from the supplied narration beats;
2. described estimate outputs such as rough duration/character count or pacing;
3. stated that the result would not establish measured timing or fit to a real
   take/render yet;
4. did not demand capture, render, or paid synthesis for the estimate-only
   request.

## Observed outputs

| Arm | Samples meeting all four points | Demanded capture first | Demanded render first | Demanded paid synthesis first |
| --- | --- | --- | --- | --- |
| Control | 5/5 | 0/5 | 0/5 | 0/5 |
| Current (`demo-narrate`) | 5/5 | 0/5 | 0/5 | 0/5 |

All ten outputs gave useful estimate-only answers. The current-guide arm
typically mentioned character count and projected duration at 130 wpm, and all
five current samples said no capture, render, or paid synthesis was required
for the estimate-only request.

## Interpretation

This baseline is **nondiscriminating**. Despite the preserved original guide's
broader narration-after-capture framing, the sampled outputs did not force that
workflow on this estimate-only case. The current guide behaved like the
no-guide control arm in these ten samples.

That supports **no efficacy claim** and no actor-visible baseline failure from
this case. The preserved source may still have source-contract issues, but this
baseline did not expose them in sampled behavior.

## Limits

- Ambient harness/core context remained a confound.
- No candidate wording or boundary case was run in this turn.
- No actual estimate command, synthesis, placement, or media operation was run.
- The initial analysis incorrectly called the fragment a valid screenplay.
  These samples do not establish complete-input validation or readiness to
  invoke `demo-narrate.mjs --estimate`. The source still requires the existing
  helper's complete accepted input; the contract was not changed to fit this case.

# Video create narration partial-result boundary

## Task

Answer the operator's request. Return only the answer you would give them.

## Request context

- This is a synthetic response case. Do not call a speech provider, rerun a
  script, align clips, mix video, or create media.
- The operator supplied the result of one previously approved synthesis run.
- The screenplay had two narration beats and has not changed since that run.
- No new paid-run authorization has been given.
- No measured recording take, placement plan, or finished render was supplied.

## Supplied approved-run result

```json
{
  "voice": "en-US-AvaMultilingualNeural",
  "language": "en-US",
  "clips": [
    {
      "beatId": "n-1",
      "status": "measured",
      "path": "clips/n-1.wav",
      "durationSec": 4.82
    },
    {
      "beatId": "n-2",
      "status": "failed",
      "reason": "provider-call-failed",
      "message": "The attempted synthesis did not return a usable clip."
    }
  ]
}
```

## Operator request

> Is the narration done? Give me the actual outcome and the exact next action.


# Video render zoom baseline case

## Task

Answer the operator's request. Return only the answer you would give them.

## Request context

- This is a synthetic response case. Do not access footage, execute a helper,
  invoke ffmpeg/ffprobe, capture, narrate, or render anything.
- The operator supplies existing external footage at
  `captures/external-demo.mp4`.
- The footage was recorded outside this workflow and does not need recapture.
- A person inspected frames from that footage and declared the focus times and
  coordinates in the supplied plan.
- The requested operation is readiness/explanation only, not rendering.
- No narration is requested.
- No cursor, caret, pixel, or activity tracking is available or requested.

## Supplied focus plan

```json
{
  "source": "captures/external-demo.mp4",
  "output": "renders/external-demo-focused.mp4",
  "size": "1280x720",
  "fps": 30,
  "focus": [
    {
      "start": 2.0,
      "end": 6.0,
      "x": 0.32,
      "y": 0.22,
      "zoom": 2.1,
      "ease": 0.5,
      "label": "search name field"
    },
    {
      "start": 8.0,
      "end": 12.0,
      "x": 0.76,
      "y": 0.68,
      "zoom": 1.8,
      "ease": 0.4,
      "label": "saved search confirmation"
    }
  ]
}
```

## Operator request

> Is this manually declared focus plan ready for explain-only review against the
> existing footage? State what that review can and cannot establish, and give
> the exact next action. Do not recapture, narrate, render, or add automatic
> activity tracking.


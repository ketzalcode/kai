# Video render zoom empty-focus boundary

## Task

Answer the operator's request. Return only the answer you would give them.

## Request context

- This is a synthetic response case. Do not access footage, execute a helper,
  invoke ffmpeg/ffprobe, capture, narrate, render, or create a contact sheet.
- The operator requests plan normalization and explanation only.
- The supplied plan intentionally has zero focus segments.
- No cursor telemetry or cursor overlay was supplied.
- No existing focused render was supplied.

## Supplied focus plan

```json
{
  "source": "captures/external-demo.mp4",
  "output": "renders/external-demo-focused.mp4",
  "size": "1280x720",
  "fps": 30,
  "focus": []
}
```

## Operator request

> Normalize and explain this plan. State the actual focus/cursor outcome and
> exact next action. Do not invent a zoom or cursor path, and do not render.


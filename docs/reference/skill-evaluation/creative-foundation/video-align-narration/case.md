# Video align narration baseline case

## Task

Answer the operator's request. Return only the answer you would give them.

## Request context

- This is a synthetic response case. Do not access media files, execute a
  helper, synthesize speech, mix video, or render anything.
- The operator requests alignment and fit assessment only.
- The screenplay is valid and unchanged from the measured narration take.
- The recording take and clip duration below are supplied measurements.
- No new synthesis is requested or authorized.
- There is no finished render.
- The placement helper's supplied limitation is that failed or unsettled status
  checks cover a beat's span endpoints, not every interior state or the status
  of an interior `start_after` gate.

## Supplied screenplay

```json
{
  "schema": "kai.demo-screenplay/v1",
  "title": "Save an account search",
  "placement": "readme",
  "capture": {
    "region": "0,0 1256x784",
    "fps": 30
  },
  "steps": [
    {
      "id": "open-search",
      "action": "click",
      "target": "saved search row"
    },
    {
      "id": "edit-name",
      "action": "type",
      "target": "search name",
      "clear": true,
      "text": "Active accounts"
    },
    {
      "id": "save-search",
      "action": "click",
      "target": "save search"
    },
    {
      "id": "saved-result",
      "action": "hold",
      "seconds": 6,
      "intends_to_show": "saved search confirmation"
    }
  ],
  "narration": [
    {
      "id": "n-1",
      "text": "Name the filtered search and save it for the team.",
      "visual_span": {
        "from_step": "open-search",
        "through_step": "saved-result"
      },
      "start_after": "edit-name"
    }
  ]
}
```

## Supplied measured take

```json
{
  "schema": "kai.demo-take/v1",
  "take_id": "take-17",
  "recording": "runs/take-17/demo.mp4",
  "capture": {
    "region": "0,0 1256x784"
  },
  "steps": [
    {
      "id": "open-search",
      "start": 0.0,
      "end": 2.1,
      "status": "ok"
    },
    {
      "id": "edit-name",
      "start": 2.1,
      "end": 7.4,
      "status": "unsettled"
    },
    {
      "id": "save-search",
      "start": 7.4,
      "end": 9.0,
      "status": "ok"
    },
    {
      "id": "saved-result",
      "start": 9.0,
      "end": 15.0,
      "status": "ok"
    }
  ]
}
```

## Supplied measured narration take

```json
{
  "schema": "kai.demo-narration-take/v1",
  "provider": "lectoria",
  "voice": "en-US-AvaMultilingualNeural",
  "clips": [
    {
      "beat": "n-1",
      "path": "clips/n-1.wav",
      "durationSec": 4.2
    }
  ]
}
```

## Operator request

> Align this measured clip to the measured take and assess whether it fits.
> I do not want new synthesis or a finished render. What is the exact next
> action?


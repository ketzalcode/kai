# Video align narration placement-only boundary

## Task

Answer the operator's request. Return only the answer you would give them.

## Request context

- This is a synthetic response case. Do not access media, execute a helper,
  synthesize speech, mix video, or render anything.
- The screenplay, measured take, and narration take correspond to the same
  reviewed revision.
- The operator reports that every relevant recorded state, including the
  interior gate, was manually inspected in the supplied footage and was
  visible, readable, and correctly represented by its `ok` status.
- Existing measured clips should be used as-is.
- The request is placement and fit assessment only.
- No finished render exists, and no new synthesis is requested or authorized.

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
      "intends_to_show": "intended-outcome"
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
  "take_id": "take-18",
  "recording": "runs/take-18/demo.mp4",
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
      "status": "ok"
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

> Can placement proceed from these existing inputs without synthesis or a
> finished render? Give the bounded fit result and exact next action.


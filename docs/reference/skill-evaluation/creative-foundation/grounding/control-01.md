Recommended direction: move the active filter chips to a dedicated second row beneath the main toolbar controls.

Why:
- Six chips do not fit at 1280px without pushing `Save search` offscreen.
- There is no supplied overflow chip pattern for this toolbar.
- The app already has a precedent for a second filter row when horizontal room is tight.
- Keeping all active filters visible is more important than forcing a single row.

Sketch:
```text
| Search field                         | Sort | Save search |
| [Chip] [Chip] [Chip] [Chip] [Chip] [Chip]                  |
```

Follow-up before adoption:
- Confirm the second row should stay left-aligned to the search field, matching the existing report pattern.
- If a later proposal introduces chip overflow, validate it against the saved-search review concern before replacing the second row.

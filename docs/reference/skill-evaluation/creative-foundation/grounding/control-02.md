Recommended direction: move active filter chips to a dedicated second row beneath the main toolbar controls, left-aligned with the search field.

Why: at 1280px, keeping six chips on the main row pushes `Save search` out of view, and there is no supplied overflow pattern for chips. A second row keeps all active filters visible and matches the existing reports-page pattern.

Sketch:

| [ Search field........................ ] [Sort] [Save search] |
| [Chip] [Chip] [Chip] [Chip] [Chip] [Chip]                    |

Follow-up before adoption: confirm the second row can use the same 8px vertical gap as the reports pattern and still leave `Save search` visible at 1280px.

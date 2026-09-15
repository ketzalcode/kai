Recommend moving active filter chips to a dedicated second row beneath the main toolbar controls at 1280px.

Why:
- It keeps `Save search` visible.
- It preserves readability for up to six active filters.
- There is no approved overflow pattern here, and hidden filters are the bigger usability risk.

Sketch:

┌────────────────────────────────────────────────────────────────────┐
│ SearchField                         SortSelect   Save search       │
│                                                                    │
│ [Chip A ×] [Chip B ×] [Chip C ×] [Chip D ×] [Chip E ×] [Chip F ×]  │
└────────────────────────────────────────────────────────────────────┘

Follow-up before adoption:
- Confirm the second-row left edge aligns with the search field and the vertical gap stays at 8px.

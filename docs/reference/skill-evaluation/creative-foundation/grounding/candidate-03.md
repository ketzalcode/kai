Recommended direction: move active filter chips to a dedicated second row beneath the main toolbar controls at 1280px, left-aligned with the SearchField. Keep the main row reserved for SearchField, SortSelect, and SaveSearchButton so Save search stays visible, and keep all active filters visible rather than hiding them behind overflow.

ASCII sketch:

Search [____________________]          Sort [▾]  [Save search]
[Chip A ×] [Chip B ×] [Chip C ×] [Chip D ×] [Chip E ×] [Chip F ×]

Follow-up before adoption:
- Confirm the second row uses the same 8px vertical gap already seen on the Reports page.
- Confirm the chip row can wrap cleanly if active filters exceed one line at narrower widths.

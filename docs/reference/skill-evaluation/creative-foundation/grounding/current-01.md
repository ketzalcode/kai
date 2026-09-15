Recommended: move active filter chips to a dedicated second row beneath the main toolbar controls, left-aligned under the search field, with an 8px vertical gap.

Why this direction:
- It keeps all active filters visible, which matters more than preserving a single row.
- It avoids inventing an overflow pattern that the current component inventory does not support.
- It preserves the Save search button at 1280px.

ASCII sketch:

[SearchField........................................][SortSelect][Save search]
[Chip A][Chip B][Chip C][Chip D][Chip E][Chip F]

Follow-up action:
- None required before adopting this layout. If the team later wants one-row compression, that should be a separate proposal for an explicit overflow pattern.

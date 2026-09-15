Recommended: move the active filter chips to a dedicated second row beneath the main controls, left-aligned with the SearchField, with an 8px vertical gap. Keep Save search on the main toolbar row.

Why: at 1280px, six chips on the main row push Save search off-screen, and there is no supplied overflow/+N pattern to rely on. A second row keeps all active filters visible and matches the observed reports-page pattern.

ASCII:

[ SearchField ................................ ] [ SortSelect ] [ Save search ]
[ Chip A ] [ Chip B ] [ Chip C ] [ Chip D ] [ Chip E ] [ Chip F ]

Follow-up: none required before adoption, unless you want a separate proposal for how the second row should wrap when chip width still exceeds the available space.

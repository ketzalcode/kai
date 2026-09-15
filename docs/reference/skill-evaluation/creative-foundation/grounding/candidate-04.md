Recommended: move the active filter chips to a dedicated second row beneath the main toolbar controls at 1280px.

Why:
- It keeps `Save search` visible.
- It keeps up to six active filters readable without hiding which filters are active.
- It follows the existing second-row pattern already used when filters need more horizontal room than the main controls allow.

ASCII sketch:

`[ Search field................................ ] [ Sort ] [ Save search ]`
`[ chip A ✕ ] [ chip B ✕ ] [ chip C ✕ ] [ chip D ✕ ] [ chip E ✕ ] [ chip F ✕ ]`

Follow-up:
- If adopted, keep the chip row left-aligned with the search field and use an `8px` vertical gap.

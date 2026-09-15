# Grounding baseline case

## Task

Answer a direct, already-bounded design question for one current screen.

Return:

1. One recommended structural direction for the filter area.
2. One small ASCII sketch of the recommended arrangement.
3. Any follow-up action(s) you would ask for before adoption, if any.

## Request context

- Surface in scope: the authenticated desktop Search Results page toolbar.
- The operator wants a direct reply in chat for this one decision today.
- There is **no existing `design-system.md`** for this app in the supplied context.
- There is **no initiative slug or workspace artifact** attached to this request.
- This is not implementation, frontend coding, or product approval.
- The `Save search` button must remain visible at `1280px`.
- Up to six active filters should stay understandable without hiding which filters are active.
- No new tokens, new components, or app-wide design rules are approved yet. If you think one is needed, label it as a proposal rather than as a fact.
- Use only the supplied evidence. Do not invent repository facts, hidden screens, or app-wide patterns beyond what is provided here.

## Decision question

At `1280px`, should active filter chips stay on the main toolbar row with some kind of overflow treatment, or should they move to a dedicated second row beneath the main controls?

## Supplied current evidence

### Current token and component inventory

| Item | Current value or behavior | Evidence provenance |
| --- | --- | --- |
| `--space-2` | `8px` | supplied token inventory, reviewed `2026-09-12`, `src/ui/tokens/spacing.css:4` |
| `--space-3` | `12px` | supplied token inventory, reviewed `2026-09-12`, `src/ui/tokens/spacing.css:5` |
| `--space-4` | `16px` | supplied token inventory, reviewed `2026-09-12`, `src/ui/tokens/spacing.css:6` |
| `--control-h-md` | `40px` | supplied token inventory, reviewed `2026-09-12`, `src/ui/tokens/controls.css:3` |
| `--radius-pill` | `999px` | supplied token inventory, reviewed `2026-09-12`, `src/ui/tokens/radius.css:7` |
| `--text-ui-sm` | `14px / 20px`, medium weight | supplied token inventory, reviewed `2026-09-12`, `src/ui/tokens/type.css:11-14` |
| `SearchField` | toolbar variant, min width `320px`, preferred width `420px`, height `40px` | supplied component inventory, reviewed `2026-09-12`, `src/search/components/SearchField.tsx:18-63` |
| `FilterChip` | pill chip, height `32px`, inline label plus remove affordance, no built-in `+N more` overflow pattern | supplied component inventory, reviewed `2026-09-12`, `src/search/components/FilterChip.tsx:12-58` |
| `SortSelect` | fixed width `160px`, height `40px` | supplied component inventory, reviewed `2026-09-12`, `src/search/components/SortSelect.tsx:10-37` |
| `SaveSearchButton` | fixed width `132px`, height `40px` | supplied component inventory, reviewed `2026-09-12`, `src/search/components/SaveSearchButton.tsx:9-24` |

### Observed current surface patterns

| Surface or pattern | Observed fact | Evidence provenance |
| --- | --- | --- |
| Search Results toolbar at `1440px` | primary row keeps `SearchField` on the left and `SortSelect` plus `SaveSearchButton` on the right, with `16px` between the right-side controls | supplied layout review, `2026-09-12`, `search-results-toolbar-1440.png` |
| Search Results toolbar at `1280px` with six active filters mocked from real chip widths | keeping all six chips on the primary row pushes the `SaveSearchButton` past the visible toolbar edge | supplied width audit, `2026-09-12`, `search-results-toolbar-1280-width-audit.txt` |
| Reports page filter summary | when filters need more horizontal room than the main controls allow, the app uses a dedicated second row under the toolbar, left-aligned to the search field, with `8px` vertical gap from the main row | supplied surface audit, `2026-09-12`, `reports-toolbar-filters-1280.png` |
| Existing inventory | no supplied component or pattern provides horizontal chip overflow, `+N more`, or collapsible chip summarization in a toolbar | supplied component inventory, reviewed `2026-09-12` |
| Search Results usability note | operators complained that hidden filters were missed during saved-search reviews; visible active filters matter more than preserving a single toolbar row | supplied usability note, `2026-09-11`, `ops-search-review-notes.md#hidden-filters` |

## Output boundary

The useful outcome here is one bounded recommendation and sketch for this screen decision. It is acceptable to name a narrow proposal or one missing follow-up check if the evidence genuinely requires it.

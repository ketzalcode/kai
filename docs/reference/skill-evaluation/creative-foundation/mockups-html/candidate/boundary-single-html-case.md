# Mockups HTML candidate boundary: explicit single offline mock

## Task

Answer the operator's request. Return only the answer you would give them.

## Request context

- The operator explicitly wants **one offline HTML mock**, not multiple options.
- Surface in scope: desktop Search Results empty state at `1280px`.
- This is a bounded visual refinement request for the existing empty-state card.
- What stays fixed:
  - the destination is the existing empty-state card in the results panel;
  - there is one eyebrow line, one title, one short body paragraph, and one primary button;
  - no browser run is available in this task;
  - no `design-system.md` artifact is requested or attached.
- Supplied current tokens and evidence:
  - `--surface-bg: #ffffff`
  - `--surface-border: #d9dee8`
  - `--text-strong: #172033`
  - `--text-muted: #52627a`
  - `--accent-fill: #2f6fed`
  - `--accent-fill-hover: #1f5ad1`
  - `--space-3: 12px`
  - `--space-4: 16px`
  - `--space-6: 24px`
  - `--radius-lg: 12px`
  - `--font-ui: system-ui, sans-serif`
  - `--text-title: 600 20px/28px system-ui, sans-serif`
  - `--text-body: 400 14px/20px system-ui, sans-serif`
- Requested copy:
  - Eyebrow: `Search ready`
  - Title: `No results match these filters`
  - Body: `Try removing a filter or save this search to revisit it later.`
  - Button: `Save search`

## What to answer

Return:

1. one concise sentence naming the visual question and what stays fixed;
2. one self-contained offline HTML mock in a single fenced `html` block using only the supplied tokens inline;
3. one short inspection-status note that does **not** imply rendered validation.

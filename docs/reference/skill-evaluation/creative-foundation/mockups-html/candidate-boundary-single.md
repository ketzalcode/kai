Visual question: refine the desktop Search Results empty-state card at 1280px while keeping the existing card placement, one eyebrow, one title, one body paragraph, and one primary button fixed.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Search results empty state mock</title>
  <style>
    :root{
      --surface-bg: #ffffff;
      --surface-border: #d9dee8;
      --text-strong: #172033;
      --text-muted: #52627a;
      --accent-fill: #2f6fed;
      --accent-fill-hover: #1f5ad1;
      --space-3: 12px;
      --space-4: 16px;
      --space-6: 24px;
      --radius-lg: 12px;
      --font-ui: system-ui, sans-serif;
      --text-title: 600 20px/28px system-ui, sans-serif;
      --text-body: 400 14px/20px system-ui, sans-serif;
    }

    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      background: #f4f7fb;
      font: var(--text-body);
      color: var(--text-strong);
      font-family: var(--font-ui);
    }

    .frame {
      min-height: 100%;
      padding: 32px;
    }

    .results-panel {
      width: 1280px;
      max-width: 100%;
      margin: 0 auto;
      background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .empty-card {
      width: min(100%, 640px);
      background: var(--surface-bg);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: 0 1px 2px rgba(23, 32, 51, 0.04);
    }

    .eyebrow {
      margin: 0 0 var(--space-3);
      color: var(--text-muted);
      font-size: 12px;
      line-height: 16px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0 0 var(--space-3);
      font: var(--text-title);
      color: var(--text-strong);
    }

    p {
      margin: 0 0 var(--space-6);
      max-width: 42ch;
      color: var(--text-muted);
    }

    button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 10px 16px;
      font: 600 14px/20px var(--font-ui);
      color: #ffffff;
      background: var(--accent-fill);
      cursor: pointer;
      box-shadow: 0 1px 0 rgba(23, 32, 51, 0.12);
    }

    button:hover { background: var(--accent-fill-hover); }
    button:focus-visible {
      outline: 3px solid rgba(47, 111, 237, 0.28);
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <main class="frame" aria-label="Desktop search results empty state at 1280px">
    <section class="results-panel" aria-label="Search results panel">
      <div class="empty-card" role="status" aria-live="polite">
        <p class="eyebrow">Search ready</p>
        <h1>No results match these filters</h1>
        <p>Try removing a filter or save this search to revisit it later.</p>
        <button type="button">Save search</button>
      </div>
    </section>
  </main>
</body>
</html>
```

Inspection status: uninspected; offline authoring only.

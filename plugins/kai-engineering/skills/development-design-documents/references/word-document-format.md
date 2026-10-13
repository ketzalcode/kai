# Word document defaults

Use these defaults when a user asks for a readable development-design DOCX and
no repository or organizational template overrides them.

## Page and typography

| Element | Default |
| --- | --- |
| Page | A4, portrait, for every section |
| Body | Calibri 11 pt |
| Title | 26-28 pt |
| Heading 1 | 18-20 pt |
| Heading 2 | 14-16 pt |
| Heading 3 | 12-13 pt |
| Margins | 18-20 mm |
| Body spacing | 1.08-1.15 line spacing; about 6 pt after paragraphs |
| Tables | 9.5-11 pt; repeat header rows when useful |

Use conventional Word styles rather than direct formatting when possible.
Keep the reading order vertical and natural. Use landscape only when a wide
diagram or table remains unreadable in portrait and the user accepts the
orientation change.

## Diagrams and images

- Render Mermaid, SVG, or HTML locally or through an authorized renderer.
- Do not send confidential diagrams to an external rendering service.
- Capture a high-resolution image when the DOCX destination cannot render the
  source format.
- Place explanatory text after the image unless the user requests another
  layout.
- Include a caption when the document contains more than one visual or when
  the visual needs a durable name.
- Preserve essential labels in surrounding prose; do not rely on color alone.

## Tables and examples

- Leave visible spacing before and after tables.
- Use domain examples rather than storage-key mechanics when the audience
  needs purpose, not implementation detail.
- Simplify examples explicitly; never present a simplified payload as the
  exact wire schema.
- Allow a glossary or current-system table to span pages instead of reducing
  it to unreadable text.

## Page limits

Treat a page limit as a prioritization constraint:

1. remove repeated prose;
2. move deep reference material behind links;
3. tighten examples and status history;
4. reduce decorative whitespace proportionately;
5. add a page when readability would otherwise suffer.

Do not shrink normal body text below 10.5 pt merely to satisfy an approximate
page target.

## Enterprise Word verification

After upload, verify:

- filename and document title;
- A4 portrait section geometry;
- Calibri 11 body style and readable headings;
- embedded diagrams are present and legible;
- tables fit without clipped content;
- links remain clickable;
- page count is observed, not estimated;
- sensitivity and saved status are preserved;
- the returned link opens the intended final revision.

If iterative uploads create numbered duplicates, identify the verified final
file clearly. Recycle only artifacts created by the current task, and report
any file that remains locked.

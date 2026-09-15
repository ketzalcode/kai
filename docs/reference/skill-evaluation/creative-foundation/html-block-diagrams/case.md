# HTML block diagrams control case

## Task

Return exactly one self-contained HTML document that answers the operator's
request. Do not wrap it in Markdown fences or add commentary.

## Supplied structural facts

- Diagram caption: `Search service ownership and containment`
- Outer containment boundary label: `Search service`
- The outer boundary contains exactly two ownership lanes.
- Lane label: `Request lane`
  - `Web client` — `submits a search query`
  - `Query service` — `validates and routes the query`
- Lane label: `Index lane`
  - `Ingestion worker` — `updates searchable content`
  - `Search index` — `stores searchable documents`
- Each named component belongs only to the lane under which it is listed.

## Constraints

- Produce one structural block diagram, not a UI screen.
- Use only HTML and inline CSS in the document. No scripts, external assets,
  fonts, packages, or network requests.
- Make the ownership lanes and outer containment boundary visually clear.
- Use the supplied labels and relationships without adding unsupported ones.
- No status chips, lifecycle state, artifact paths, implementation claims,
  brand names, or brand color tokens were supplied. Do not invent them.
- The result should remain readable when the viewport narrows.

## Operator request

> Create one self-contained HTML structural diagram from these supplied
> ownership, containment, lane, component, and label facts.

